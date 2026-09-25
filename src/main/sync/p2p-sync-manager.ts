/**
 * Desktop SyncManager facade — the single entry point for P2P Yjs+WebRTC sync.
 *
 * Wires: YjsManager (docs) ⇄ DesktopWebRtcManager (transport) ⇄ WS hub
 * (signaling only) ⇄ SQLite (apply incoming records). UI/IPC talks only to
 * this module.
 */

import * as Y from 'yjs';
import db from '../database';
import { yjsManager } from './yjs-manager';
import { desktopWebRtc, readIceServersFromEnv } from './webrtc-manager';
import { notifyDataApplied } from './notify';
import { getActiveBusinessId } from '../ipc-handlers';
import { mdnsDiscovery } from './discovery';
import { logger } from '../logger';
import { getPairingToken } from '../sync-hub';
import { pairingBeacon } from './pairing-beacon';
import { sweepLan } from './lan-discovery';
import { provisionJoinForDevice } from './device-requests';
import {
  buildRtcConfiguration,
  COLLECTION_TABLE,
  APPEND_ONLY,
  isYjsCollection,
  detectPayloadPlatform,
  normalizeToPlatform,
  reconcileToColumns,
  defaultPairingLogger,
  shortId,
  type YjsCollection,
  type YjsRecord,
  type SyncHealthSnapshot,
  type SignalMessage,
} from '@shega/shared';

/**
 * Connection-state logging for the pairing/session path, on the SAME tag both
 * platforms use (`[pair]`), so a desktop log and a phone log can be read side by
 * side to see exactly where the handshake succeeded or failed.
 */
const pairLog = defaultPairingLogger;

// Track per-peer last-seen / last full sync for the devices UI.
export interface DeviceStatusRow {
  deviceId: string;
  deviceType: string;
  kind: string;
  /** How the connection is actually established — drives the UI label. */
  method: 'lan' | 'p2p' | 'relay' | 'cloud' | 'offline';
  connectedAt: number;
  lastSyncAt: number | null;
  lastSeenAt: number | null;
  online: boolean;
  status: 'connected' | 'connecting' | 'offline' | 'reconnecting';
  source: 'webrtc' | 'ws' | 'roster';
  name?: string;
  model?: string;
  userName?: string | null;
  role?: string | null;
  avatar?: string | null;
}

class P2pSyncManager {
  private businessUuid = '';
  private lastSyncAt: number | null = null;
  private unsubs: Array<() => void> = [];
  private signalingRelay: ((to: string, msg: SignalMessage) => void) | null = null;
  private started = false;
  private outboxTimer: NodeJS.Timeout | null = null;
  private lastOutboxSeq = 0;
  private businessRowId = 0;
  /**
   * Pushes an owner decision to a joiner's live socket. Registered by the WS hub
   * (`WsSyncServer.start`) — an injected callback instead of a direct import so
   * the hub ⇄ manager cycle stays one-directional.
   */
  private joinDecisionNotifier: ((deviceId: string, payload: { record?: any; pairingToken?: string }) => boolean) | null = null;

  setJoinDecisionNotifier(fn: ((deviceId: string, payload: { record?: any; pairingToken?: string }) => boolean) | null): void {
    this.joinDecisionNotifier = fn;
  }

  /** Map relay entity names → Yjs collections. */
  private static ENTITY_TO_COLLECTION: Record<string, YjsCollection> = {
    items: 'products',
    categories: 'categories',
    sales: 'sales',
    sale_items: 'saleItems',
    stock_movements: 'inventory',
    payments: 'payments',
    debts: 'debts',
    debt_payments: 'debtPayments',
    customers: 'customers',
    suppliers: 'suppliers',
    returns: 'returns',
    businesses: 'businesses',
    locations: 'locations',
    registers: 'registers',
    audit_logs: 'activities',
    users: 'users',
    employees: 'employees',
    employee_roles: 'employeeRoles',
  };

  /** Called from the WS hub when a signaling envelope arrives from a client. */
  handleSignalEnvelope(fromDeviceId: string, msg: SignalMessage): void {
    desktopWebRtc.handleSignal(msg);
  }

  /** Provide the function used to push signaling messages down to a client. */
  setSignalingRelay(fn: (toDeviceId: string, msg: SignalMessage) => void): void {
    this.signalingRelay = fn;
    desktopWebRtc.setSignalingSender((to, msg) => this.signalingRelay?.(to, msg));
  }

  start(deviceId: string, businessUuid: string, businessRowId: number): void {
    if (this.started && this.businessUuid === businessUuid) return;
    if (this.businessUuid && this.businessUuid !== businessUuid) {
      yjsManager.closeBusiness(this.businessUuid);
      desktopWebRtc.closeAll();
    }
    this.businessUuid = businessUuid;
    this.businessRowId = businessRowId;
    this.started = true;

    yjsManager.setDeviceId(deviceId);
    desktopWebRtc.init(deviceId, businessUuid);
    // (Re)apply TURN/ICE servers from the environment on every start so config
    // changes are honoured without a reboot. Empty env => STUN-only defaults.
    desktopWebRtc.setIceServers(buildRtcConfiguration(readIceServersFromEnv()));
    yjsManager.bootstrapBusiness(businessRowId, businessUuid);
    this.repairOrphanedRows();

    // Local doc changes → broadcast over WebRTC.
    this.unsubs.push(
      yjsManager.onUpdate((bizId, update, origin) => {
        if (origin !== 'local') return;
        desktopWebRtc.broadcastUpdate(bizId, update);
      }),
    );

    // Remote updates → apply to doc → push into SQLite.
    this.unsubs.push(
      desktopWebRtc.on('update', (bizId, _from, update) => {
        const before = yjsManager.getFullState(bizId);
        yjsManager.acceptRemoteUpdate(bizId, update);
        const after = yjsManager.getFullState(bizId);
        if (before && after) this.applyDocToSqlite(bizId, before, after);
        this.lastSyncAt = Date.now();
      }),
    );

    // On peer connect: exchange full doc states both ways so late joiners
    // catch up on everything (products, sales, etc.) immediately.
    this.unsubs.push(
      desktopWebRtc.on('peerConnected', (peer) => {
        this.sendFullState(peer.deviceId);
        this.lastSyncAt = Date.now();
      }),
    );

    // Tail the sync_outbox so every local SQLite mutation also lands in the
    // Yjs doc (which then fans out over WebRTC).
    try {
      this.lastOutboxSeq = (db.prepare('SELECT COALESCE(MAX(seq),0) AS m FROM sync_outbox').get() as any)?.m ?? 0;
    } catch { this.lastOutboxSeq = 0; }
    if (this.outboxTimer) clearInterval(this.outboxTimer);
    this.outboxTimer = setInterval(() => this.pumpOutbox(), 1500);
  }

  /**
   * One-time repair: rows synced from peers before the business-UUID fallback
   * existed landed with businessId = NULL and were invisible to every
   * business-scoped query. Re-attach them to this hub's active business.
   */
  private repairOrphanedRows(): void {
    if (!this.businessRowId) return;
    const tables = ['items', 'categories', 'sales', 'sale_items', 'debt_payments', 'adjustments', 'customers', 'suppliers', 'returns', 'stock_movements'];
    let fixed = 0;
    for (const table of tables) {
      try {
        const cols = (db.prepare(`PRAGMA table_info(${table})`).all() as any[]).map((c) => c.name);
        if (!cols.includes('businessId') || !cols.includes('uuid')) continue;
        const r = db.prepare(`UPDATE ${table} SET businessId = ? WHERE businessId IS NULL AND uuid IS NOT NULL`).run(this.businessRowId);
        fixed += r.changes;
      } catch { /* table may not exist */ }
    }
    if (fixed > 0) {
      console.log(`[p2p] re-attached ${fixed} orphaned row(s) to the active business`);
      // Re-broadcast the repaired rows so peers get the corrected scope too.
      try {
        yjsManager.bootstrapBusiness(this.businessRowId, this.businessUuid);
      } catch { /* non-fatal */ }
    }
  }

  private pumpOutbox(): void {
    if (!this.businessUuid) return;
    try {
      const rows = db.prepare('SELECT seq, entity, entity_uuid, op, payload FROM sync_outbox WHERE seq > ? ORDER BY seq ASC LIMIT 500').all(this.lastOutboxSeq) as any[];
      for (const row of rows) {
        this.lastOutboxSeq = row.seq;
        const collection = P2pSyncManager.ENTITY_TO_COLLECTION[row.entity];
        if (!collection) continue;
        let payload: Record<string, any> = {};
        try { payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload || {}; } catch { continue; }
        // Local payloads come from the outbox (desktop camelCase). Incoming
        // records may carry either naming — normalize to desktop columns.
        const data = detectPayloadPlatform(payload) === 'mobile'
          ? normalizeToPlatform(payload, 'desktop')
          : payload;
        yjsManager.recordLocalChange(this.businessUuid, collection, row.entity_uuid, data, row.op === 'DELETE');
      }
    } catch { /* db busy — next tick */ }
  }

  /** Record a local SQLite mutation into the Yjs doc (called from the outbox). */
  recordLocalChange(collection: string, entityUuid: string, payload: Record<string, any>, deleted = false): void {
    if (!this.businessUuid || !isYjsCollection(collection)) return;
    yjsManager.recordLocalChange(this.businessUuid, collection as YjsCollection, entityUuid, payload, deleted);
  }

  /** Apply changed Yjs records into SQLite (append-only upsert / tombstone). */
  private applyDocToSqlite(businessId: string, before: Uint8Array, _after: Uint8Array): void {
    void _after;
    const changes = yjsManager.collectRemoteChanges(businessId, before);
    for (const { collection, record } of changes) {
      if (record.businessId !== businessId) continue; // isolation guard
      this.applyRecord(collection, record);
    }
  }

  private applyRecord(collection: YjsCollection, record: YjsRecord): void {
    const table = COLLECTION_TABLE[collection];
    try {
      const cols = (db.prepare(`PRAGMA table_info(${table})`).all() as any[]).map((c) => c.name);
      const hasUuid = cols.includes('uuid');
      const hasBiz = cols.includes('businessId');
      // Reconcile key-by-key against this table's real columns: desktop core
      // tables are camelCase, mobile canonical tables are snake, so a blind
      // camel<->snake pass would corrupt or drop fields (e.g. categoryId).
      const data: Record<string, any> = reconcileToColumns(
        record.data as Record<string, any>,
        new Set(cols),
        'desktop',
      );
      if (hasUuid) data.uuid = record.uuid;
      if (record.deleted) {
        if (hasUuid) db.prepare(`UPDATE ${table} SET is_deleted = 1, is_synced = 1 WHERE uuid = ?`).run(record.uuid);
        try {
          db.prepare('INSERT INTO sync_log (device_id, entity, entity_uuid, op, detail) VALUES (?, ?, ?, ?, ?)').run(
            record.deviceId ? String(record.deviceId) : null, table, record.uuid, 'DELETE', 'applied (p2p)'
          );
        } catch { /* logging must never break the apply */ }
        return;
      }
      // Dedup on uuid — the sync PK. Append-only tables simply ignore repeats.
      let rowId: any;
      if (hasUuid) {
        rowId = db.prepare(`SELECT id FROM ${table} WHERE uuid = ?`).get(record.uuid) as any;
        if (rowId && APPEND_ONLY.has(collection)) return; // immutable event already present
      } else {
        rowId = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(record.uuid) as any;
        if (rowId && APPEND_ONLY.has(collection)) return;
      }
      // Desktop business columns are INTEGER ids of the local `businesses`
      // rows, while every Yjs record carries the business UUID. Translate the
      // UUID back to the local INTEGER id (numeric values pass through for
      // compatibility with pre-UUID peers). A UUID with no local business row
      // falls back to THIS hub's active business — the peer was already
      // membership-verified to share it, so its rows must be visible here.
      // Storing NULL (the old behavior) made every synced row invisible to
      // business-scoped queries, which looked like "sync doesn't work".
      if (hasBiz) {
        let biz: unknown = record.businessId;
        if (biz != null && !/^[0-9]+$/.test(String(biz))) {
          const row = db.prepare('SELECT id FROM businesses WHERE uuid = ?').get(String(biz)) as any;
          biz = row?.id ?? this.businessRowId ?? null;
        } else if (biz == null) {
          biz = this.businessRowId ?? null;
        }
        data.businessId = biz ?? null;
      }
      const keys = Object.keys(data).filter((k) => cols.includes(k));
      if (keys.length === 0) return;
      const action = rowId ? 'UPDATE' : 'INSERT';
      if (rowId) {
        const setSql = keys.map((k) => `${k} = ?`).join(', ');
        db.prepare(`UPDATE ${table} SET ${setSql}, is_synced = 1 WHERE id = ?`).run(...keys.map((k) => data[k]), rowId.id);
      } else {
        const colSql = keys.join(', ');
        const ph = keys.map(() => '?').join(', ');
        db.prepare(`INSERT INTO ${table} (${colSql}, is_synced) VALUES (${ph}, 1)`).run(...keys.map((k) => data[k]));
      }
      // Write into sync_log so the Sync Hub's "Sync activity" panel shows
      // changes arriving over the Yjs/WebRTC transport (it previously only
      // logged the LAN/WS hub path).
      try {
        db.prepare('INSERT INTO sync_log (device_id, entity, entity_uuid, op, detail) VALUES (?, ?, ?, ?, ?)').run(
          record.deviceId ? String(record.deviceId) : null,
          table,
          record.uuid,
          action,
          'applied (p2p)'
        );
      } catch { /* logging must never break the apply */ }
      notifyDataApplied({ applied: 1, conflicts: 0, changes: 1, source: 'p2p' });
    } catch (e) {
      console.warn(`[p2p] apply ${collection}/${record.uuid} failed:`, e);
    }
  }

  getHealth(): SyncHealthSnapshot {
    let wsConnected = false;
    try {
      const { wsSyncServer } = require('./websocket-server') as typeof import('./websocket-server');
      wsConnected = wsSyncServer.getConnectedClients() !== undefined;
    } catch { /* best effort */ }

    const isOnline = wsConnected || desktopWebRtc.getPeers().length > 0;
    return {
      businessId: this.businessUuid || null,
      health: isOnline ? 'synced' : this.businessUuid ? 'waiting' : 'offline',
      peers: desktopWebRtc.getPeers(),
      lastSyncAt: this.lastSyncAt,
      pendingUpdates: yjsManager.pendingCount(),
    };
  }

  getDevices(): DeviceStatusRow[] {
    const byId = new Map<string, DeviceStatusRow>();

    const lookupUser = (userId?: string | number | null, deviceId?: string | null) => {
      let userName: string | null = null;
      let userRole: string | null = null;
      let avatar: string | null = null;
      try {
        if (userId != null) {
          const u = db.prepare(
            'SELECT name, role, roleName, avatar FROM users WHERE (id = ? OR uuid = ?) AND is_deleted = 0 LIMIT 1'
          ).get(userId, userId) as any;
          if (u) {
            userName = u.name ?? null;
            userRole = u.roleName || u.role || null;
            avatar = u.avatar ?? null;
          }
        }
        if (!userName && deviceId) {
          const d = db.prepare(
            `SELECT d.name as device_name, d.user_id, d.userId, d.role as dev_role,
                    u.name as user_name, u.role as user_role, u.roleName, u.avatar
             FROM devices d
             LEFT JOIN users u ON (u.id = d.user_id OR u.uuid = d.user_id OR u.id = d.userId OR u.uuid = d.userId)
             WHERE (d.device_id = ? OR d.uuid = ? OR d.id = ?) AND d.is_deleted = 0 LIMIT 1`
          ).get(deviceId, deviceId, deviceId) as any;
          if (d) {
            userName = d.user_name ?? null;
            userRole = d.roleName || d.user_role || d.dev_role || null;
            avatar = d.avatar ?? null;
          }
        }
      } catch { /* best effort */ }
      return { userName, userRole, avatar };
    };

    // 1) Live WebRTC peers
    for (const p of desktopWebRtc.getPeers()) {
      const info = lookupUser(p.userUuid, p.deviceId);
      byId.set(p.deviceId, {
        deviceId: p.deviceId,
        deviceType: p.deviceType,
        kind: p.kind,
        method: p.kind === 'relay' ? 'relay' : 'p2p',
        connectedAt: p.connectedAt ?? Date.now(),
        lastSyncAt: this.lastSyncAt,
        lastSeenAt: Date.now(),
        online: true,
        status: 'connected' as const,
        source: 'webrtc' as const,
        name: (p as any).deviceName || (p as any).name || 'Peer device',
        userName: info.userName,
        role: info.userRole,
        avatar: info.avatar,
      });
    }

    // 2) WS connected clients (Mobile or Desktop dialing our hub)
    try {
      const { wsSyncServer } = require('./websocket-server') as typeof import('./websocket-server');
      for (const c of wsSyncServer.getConnectedClients()) {
        if (!c.deviceId || byId.has(c.deviceId)) continue;
        const info = lookupUser((c as any).userId, c.deviceId);
        byId.set(c.deviceId, {
          deviceId: c.deviceId,
          deviceType: 'mobile',
          kind: 'lan',
          method: 'lan',
          connectedAt: Date.now(),
          lastSyncAt: this.lastSyncAt,
          lastSeenAt: Date.now(),
          online: true,
          status: 'connected' as const,
          source: 'ws' as const,
          name: (c as any).name || (c as any).deviceName || 'Shega Mobile',
          userName: info.userName,
          role: info.userRole,
          avatar: info.avatar,
        });
      }
    } catch { /* ws bridge unstarted */ }

    // 3) Stored devices in devices table
    try {
      const devRows = db.prepare(
        `SELECT d.id, d.device_id, d.uuid, d.name, d.model, d.platform, d.status,
                d.last_seen_at, d.lastSeenAt, d.last_sync_at, d.lastSyncAt, d.user_id, d.userId, d.role,
                u.name as user_name, u.role as user_role, u.roleName, u.avatar
         FROM devices d
         LEFT JOIN users u ON (u.id = d.user_id OR u.uuid = d.user_id OR u.id = d.userId OR u.uuid = d.userId)
         WHERE d.is_deleted = 0`
      ).all() as any[];

      for (const r of devRows) {
        const id = String(r.device_id || r.uuid || r.id || '');
        if (!id) continue;
        const seenStr = r.last_seen_at || r.lastSeenAt || '';
        const seen = Date.parse(seenStr) || 0;
        const ageMs = seen ? Date.now() - seen : Infinity;
        const live = byId.get(id);
        const devStatus = String(r.status || 'offline').toLowerCase();
        const online = !!live || devStatus === 'online' || devStatus === 'connected' || (devStatus === 'active' && ageMs < 5 * 60_000);

        const userName = live?.userName ?? r.user_name ?? null;
        const userRole = live?.role ?? r.roleName ?? r.user_role ?? r.role ?? null;
        const avatar = live?.avatar ?? r.avatar ?? null;
        const name = live?.name ?? r.name ?? (String(r.platform || 'mobile').includes('desktop') ? 'Shega Desktop' : 'Shega Mobile');

        byId.set(id, {
          deviceId: id,
          deviceType: String(r.platform || 'mobile').includes('desktop') ? 'desktop' : 'mobile',
          kind: 'lan',
          method: live ? live.method : (online ? 'lan' : 'offline'),
          connectedAt: live?.connectedAt ?? (seen || Date.now()),
          lastSyncAt: Date.parse(r.last_sync_at || r.lastSyncAt || '') || (live?.lastSyncAt ?? null),
          lastSeenAt: live?.lastSeenAt ?? (seen || null),
          online,
          status: online ? 'connected' : ageMs < 5 * 60_000 ? 'reconnecting' : 'offline',
          source: live?.source ?? 'roster',
          name,
          model: live?.model ?? r.model,
          userName,
          role: userRole,
          avatar,
        } as DeviceStatusRow);
      }
    } catch { /* devices query fallback */ }

    return [...byId.values()];
  }

  revokeDevice(deviceId: string): void {
    // Tell the device to lock immediately before dropping the connection.
    this.kickDevice(deviceId, 'You were removed from this business by the owner.');
    desktopWebRtc.closePeer(deviceId);
    try {
      db.prepare('UPDATE roster_devices SET status = ?, is_deleted = 1 WHERE uuid = ? OR id = ?').run('revoked', deviceId, deviceId);
    } catch { /* roster table naming may differ */ }
  }

  /** Owner: rename a device in the roster. */
  renameDevice(deviceId: string, newName: string): boolean {
    try {
      const r = db.prepare('UPDATE roster_devices SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE uuid = ? OR id = ?').run(newName, deviceId, deviceId);
      return r.changes > 0;
    } catch { return false; }
  }

  /** Per-collection record counts for the sync/bootstrap progress UI. */
  getRecordCounts(): Record<string, number> {
    const out: Record<string, number> = {};
    try {
      const bizRow = (db.prepare('SELECT id FROM businesses WHERE uuid = ?').get(this.businessUuid) as any);
      const bizId = bizRow?.id ?? this.businessRowId;
      const tableToLabel: Array<[string, string]> = [
        ['items', 'Products'], ['categories', 'Categories'], ['sales', 'Sales'],
        ['customers', 'Customers'], ['suppliers', 'Suppliers'], ['debt_payments', 'Payments'],
        ['stock_movements', 'Inventory'], ['returns', 'Returns'], ['audit_logs', 'Activities'],
      ];
      for (const [table, label] of tableToLabel) {
        try {
          const r = db.prepare(`SELECT COUNT(*) AS c FROM ${table} WHERE businessId = ? AND is_deleted = 0`).get(bizId) as any;
          out[label] = r?.c ?? 0;
        } catch { out[label] = 0; }
      }
    } catch {}
    return out;
  }

  /**
   * Push a kick/lock message to a connected device over the signaling channel
   * (small control message — fine to ride the relay; data channel may be gone).
   */
  kickDevice(deviceId: string, reason: string): void {
    try {
      this.signalingRelay?.(deviceId, {
        t: 'error',
        reason: 'device-revoked',
      } as unknown as SignalMessage);
      // Also try the data channel for an explicit lock payload.
      desktopWebRtc.sendUpdate(deviceId, Buffer.from(JSON.stringify({ __shega_control__: 'force-lock', reason })));
    } catch { /* best effort */ }
  }

  /** Deactivate a user: push lock to any of their connected devices. */
  kickUserDevices(userUuid: string, reason: string): void {
    try {
      const rows = db.prepare('SELECT uuid, device_id FROM roster_devices WHERE userId = ?').all(userUuid, userUuid) as any[];
      for (const r of rows) this.kickDevice(String(r.uuid || r.device_id), reason);
    } catch { /* roster columns may differ */ }
  }

  announce(): void {
    // Ask the hub to relay our hello so peers can dial us.
    this.signalingRelay?.('__broadcast__', { t: 'hello', deviceId: yjsManager.getDeviceId(), deviceType: 'desktop', businessId: this.businessUuid });
  }

  /**
   * Explicit device pairing approval (J4). The renderer's pair modal "Approve"
   * used to be a placebo for radar peers: it only re-broadcast a LAN hello, and
   * the mDNS-only source disagreed with the radar (which shows shega-pair
   * beacons + a LAN sweep), so tapping a device never granted it. This grants
   * every matching discovered peer: it is registered in the hub pairing
   * registry (`devices`) and the active business roster (`roster_devices`) as
   * active, and any pending join request from that device is approved so the
   * joiner's STATUS poll immediately flips to approved and it receives the
   * pairing token. Returns the granted device ids ([] = nothing matching).
   *
   * `target` = an exact peer the user tapped in the radar (deviceId + host +
   * platform). Only that device is granted; on direct taps we trust the radar
   * row identity (it already includes LAN-sweep hits, which mDNS misses).
   *
   * When `code` is passed (PairDeviceModal "Enter pairing code"), only the
   * peer whose mDNS-advertised pairing token matches is granted.
   */
  approveIncoming(name?: string, code?: string, target?: { deviceId?: string; host?: string; platform?: string }, opts?: { role?: string; permissions?: Record<string, unknown> }): string[] {
    const granted: string[] = [];
    pairLog('info', 'owner approving device — assigning role', {
      target: target?.deviceId ? shortId(target.deviceId) : null,
      name: name ?? null,
      role: opts?.role ?? null,
      byCode: code ? 'yes' : 'no',
    });
    try {
      const rawCode = code ? String(code).trim().toUpperCase() : null;
      // An explicit radar tap carries the authoritative row (beacon or
      // LAN-sweep hit), and that row may include a pairing token that the
      // radar shows under the device. The tap ALWAYS means "grant exactly
      // this device" �?" a token/code supplied by the same row must never switch
      // us into code-filtering that strips the tapped candidate out again.
      const exactTap = Boolean(target?.deviceId);
      const want = exactTap ? null : rawCode;
      let candidates: any[] = [];
      if (exactTap) {
        // Exact radar tap �?" the renderer already has the authoritative row
        // (beacon or LAN-sweep hit). We grant that device only.
        const platform = String(target?.platform || 'desktop').includes('mobile') ? 'mobile' : 'desktop';
        candidates = [{ deviceId: String(target?.deviceId), host: target?.host, platform }];
      } else {
        // Approve-all-desktops / approve-by-code path: unify every discovery
        // channel so the radar and the approve dialog agree.
        const pool = this.discoverApprovablePeers();
        const dedup = new Map<string, any>();
        for (const p of pool) if (p?.deviceId) dedup.set(String(p.deviceId), p);
        candidates = [...dedup.values()];
        if (target?.host) {
          const h = String(target.host);
          candidates = candidates.filter((p) => p.host === h || (p.addresses || []).includes(h));
        }
        if (want == null) {
          // name-only (legacy "approve desktop peers"): mobile peers join via
          // the join-request path, never through this bulk grant.
          candidates = candidates.filter(
            (p) => !(p.capabilities || []).includes('mobile') && String(p.platform || 'desktop') !== 'mobile'
          );
        }
      }
      if (want != null) {
        candidates = candidates.filter((p) => String(p.pairingToken || '').toUpperCase() === want);
      }
      const displayName = name || undefined;
      const bizId = this.businessRowId || null;
      for (const peer of candidates) {
        const peerId = String(peer.deviceId || '').trim();
        if (!peerId) continue;
        const display = displayName || peer.name || peerId;
        const platform = String(peer.platform || 'desktop').includes('mobile') ? 'mobile' : 'desktop';
        const now = new Date().toISOString();
        // 1) Hub pairing registry (idempotent by the unique device_id).
        const reg = db.prepare('SELECT device_id FROM devices WHERE device_id = ?').get(peerId) as any;
        if (reg) {
          db.prepare("UPDATE devices SET name = COALESCE(?, name), platform = COALESCE(?, platform), businessId = ?, status = 'active', last_seen_at = ? WHERE device_id = ?")
            .run(display, platform, bizId, now, peerId);
        } else {
          db.prepare("INSERT OR REPLACE INTO devices (device_id, name, platform, businessId, status, last_seen_at) VALUES (?, ?, ?, ?, 'active', ?)")
            .run(peerId, display, platform, bizId, now);
        }
        // 2) Business roster so the owner's Connected Devices list + revoke see it.
        // Column guard: the roster schema (lastSeenAt/lastSyncAt camelCase on a
        // fresh install) has drifted from the snake_case legacy names. A roster
        // write failure must never abort the grant — the trust decision already
        // happened in step 1, so this is best-effort bookkeeping only.
        if (bizId != null) {
          try {
            const roster = db.prepare('SELECT id FROM roster_devices WHERE businessId = ? AND device_id = ?').get(bizId, peerId) as any;
            if (roster) {
              db.prepare("UPDATE roster_devices SET status = 'active', name = ?, platform = ?, lastSeenAt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                .run(display, platform, now, roster.id);
            } else {
              db.prepare("INSERT INTO roster_devices (businessId, name, platform, status, isPrimary, uuid, device_id, lastSeenAt, updated_at) VALUES (?, ?, ?, 'active', 0, ?, ?, ?, CURRENT_TIMESTAMP)")
                .run(bizId, display, platform, peerId, peerId, now);
            }
          } catch (e: any) {
            // Preserve the grant; surface the bookkeeping failure for tooling.
            logger.warn('approveIncoming roster write skipped', { deviceId: peerId, error: e?.message });
          }
        }
        // 3) Approve any join request this device already submitted; that hands
        // it the pairing token on its next STATUS poll and materializes its
        // user + device on BOTH sides. When the owner assigned a role at the
        // radar tap, that role (and permissions) ride the approval so the
        // joiner is provisioned with exactly the owner's choice.
        try {
          provisionJoinForDevice(peerId, {
            role: opts?.role ?? undefined,
            permissions: opts?.permissions,
            businessId: bizId ?? undefined,
            name: display,
            platform,
          });
        } catch { /* best effort */ }
        // 4) Push the SAME decision to the joiner if it is connected right now.
        // Without this the owner showed "Connected" while the joiner sat on
        // "Waiting for connection…" until its next poll (or forever, when the
        // poll was broken). The poll stays as the durable fallback, so a missing
        // socket is never a failure — only a slower path.
        this.pushJoinDecision(peerId, { role: opts?.role, name: display });
        granted.push(peerId);
      }
    } catch (e: any) {
      // A grant failure must never break the UI path — but it MUST be logged.
      // Swallowing it silently made the radar report "device is not reachable"
      // for what was actually a local DB error (devices/roster_devices column
      // drift), sending the user hunting for a network problem that didn't
      // exist.
      logger.warn('approveIncoming grant failed', { error: e?.message });
    }
    if (granted.length === 0) {
      pairLog('warn', 'owner approve found no matching nearby device', { name: name ?? null });
    }
    return granted;
  }

  /**
   * Push an owner decision to the joiner (best effort) and log the handshake.
   *
   * Reads the record `provisionJoinForDevice` just wrote — so the pushed payload
   * is byte-identical to what the joiner's poll would return — and hands it to
   * the WS hub, which owns the joiner sockets. Used by the radar tap, the manual
   * code path and the API-driven assigns, so all four pairing combinations push
   * through one path.
   */
  private pushJoinDecision(deviceId: string, detail?: { role?: string; name?: string }): void {
    try {
      const { getDeviceJoinRequestByDevice, businessDisplayName } = require('./device-requests');
      const rec = getDeviceJoinRequestByDevice(deviceId);
      if (!rec) {
        pairLog('warn', 'owner approved but no session record exists yet — joiner will resolve on its next poll', {
          joiner: shortId(deviceId),
        });
        return;
      }
      const pushed = this.joinDecisionNotifier?.(deviceId, {
        record: rec,
        pairingToken: getPairingToken(),
      }) ?? false;
      pairLog('info', `owner approved device — session ${rec.status}`, {
        joiner: shortId(deviceId),
        name: detail?.name ?? null,
        role: rec.role ?? detail?.role ?? null,
        business: businessDisplayName(rec.businessId) ?? null,
        pushedToLiveSocket: pushed,
        delivery: pushed ? 'push' : 'poll',
      });
    } catch (e: any) {
      logger.warn('pushJoinDecision failed', { deviceId, error: e?.message });
    }
  }

  /**
   * Unified discovery pool for approvals = mDNS `shega-pos` services + the
   * pairing-beacon `shega-pair` radar owners. Backward-compatible superset of
   * the old mDNS-only source so the approve dialog and the radar agree.
   */
  private discoverApprovablePeers(): any[] {
    const out: any[] = [];
    const seen = new Set<string>();
    for (const s of mdnsDiscovery.getDiscoveredServices()) {
      if (s.deviceId) seen.add(s.deviceId);
      out.push({ ...s, host: s.host });
    }
    for (const n of pairingBeacon.getNearbyOwners()) {
      const b = n.beacon;
      if (b?.owner?.deviceId) {
        if (seen.has(b.owner.deviceId)) continue;
        seen.add(b.owner.deviceId);
      }
      out.push({
        deviceId: b.owner.deviceId,
        name: b.owner.deviceName,
        platform: typeof b.owner.platform === 'string' ? b.owner.platform : 'mobile',
        model: b.owner.model,
        // The beacon's open business-invite code doubles as the manual-code
        // credential: the owner can type it on the desktop's Add Device modal
        // to grant exactly that joiner when discovery filtering hides it.
        pairingToken: String(b.code || '').trim().toUpperCase(),
        host: n.host,
        port: n.port,
        capabilities: [typeof b.owner.platform === 'string' && b.owner.platform === 'desktop' ? 'desktop' : 'mobile'],
      });
    }
    return out;
  }

  /** Flip roster + pairing-registry presence (called by the WS/HTTP hubs). */
  markRosterStatus(deviceId: string, online: boolean): void {
    const now = online ? new Date().toISOString() : undefined;
    try {
      db.prepare("UPDATE roster_devices SET status = ?, lastSeenAt = COALESCE(?, lastSeenAt), updated_at = CURRENT_TIMESTAMP WHERE uuid = ? OR device_id = ?")
        .run(online ? 'online' : 'offline', now ?? null, deviceId, deviceId);
    } catch { /* roster column naming may differ */ }
    try {
      db.prepare("UPDATE devices SET status = ?, last_seen_at = COALESCE(?, last_seen_at) WHERE device_id = ?")
        .run(online ? 'active' : 'offline', now ?? null, deviceId);
    } catch { /* blocked updates are fine */ }
  }

  /** Send our full doc state to a newly connected peer (initial catch-up). */
  sendFullState(deviceId: string): void {
    if (!this.businessUuid) return;
    const state = yjsManager.getFullState(this.businessUuid);
    if (state) desktopWebRtc.sendUpdate(deviceId, state);
  }

  shutdown(): void {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    if (this.outboxTimer) { clearInterval(this.outboxTimer); this.outboxTimer = null; }
    desktopWebRtc.closeAll();
    this.started = false;
  }
}

export const p2pSync = new P2pSyncManager();
