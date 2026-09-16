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
import { desktopWebRtc } from './webrtc-manager';
import { notifyDataApplied } from './notify';
import { getActiveBusinessId } from '../ipc-handlers';import {
  COLLECTION_TABLE,
  APPEND_ONLY,
  isYjsCollection,
  detectPayloadPlatform,
  normalizeToPlatform,
  reconcileToColumns,
  type YjsCollection,
  type YjsRecord,
  type SyncHealthSnapshot,
  type SignalMessage,
} from '@shega/shared';

// Track per-peer last-seen / last full sync for the devices UI.
export interface DeviceStatusRow {
  deviceId: string;
  deviceType: string;
  kind: string;
  connectedAt: number;
  lastSyncAt: number | null;
  online: boolean;
  source: 'webrtc' | 'roster';
  name?: string;
  model?: string;
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
        let biz = record.businessId;
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
      if (rowId) {
        const setSql = keys.map((k) => `${k} = ?`).join(', ');
        db.prepare(`UPDATE ${table} SET ${setSql}, is_synced = 1 WHERE id = ?`).run(...keys.map((k) => data[k]), rowId.id);
      } else {
        const colSql = keys.join(', ');
        const ph = keys.map(() => '?').join(', ');
        db.prepare(`INSERT INTO ${table} (${colSql}, is_synced) VALUES (${ph}, 1)`).run(...keys.map((k) => data[k]));
      }
      notifyDataApplied({ applied: 1, conflicts: 0, changes: 1, source: 'p2p' });
    } catch (e) {
      console.warn(`[p2p] apply ${collection}/${record.uuid} failed:`, e);
    }
  }

  getHealth(): SyncHealthSnapshot {
    return {
      businessId: this.businessUuid || null,
      health: desktopWebRtc.getPeers().length > 0 ? 'synced' : this.businessUuid ? 'waiting' : 'offline',
      peers: desktopWebRtc.getPeers(),
      lastSyncAt: this.lastSyncAt,
      pendingUpdates: yjsManager.pendingCount(),
    };
  }

  getDevices(): DeviceStatusRow[] {
    const rows: DeviceStatusRow[] = desktopWebRtc.getPeers().map((p) => ({
      deviceId: p.deviceId,
      deviceType: p.deviceType,
      kind: p.kind,
      connectedAt: p.connectedAt,
      lastSyncAt: this.lastSyncAt,
      online: true,
      source: 'webrtc' as const,
    }));
    // Also surface roster devices (paired via the hub) with live presence from
    // connected WS clients, so the owner sees offline devices too.
    try {
      const roster = db.prepare("SELECT uuid, device_id, name, model, platform, status, last_seen_at, last_sync_at FROM roster_devices WHERE is_deleted = 0").all() as any[];
      for (const r of roster) {
        if (rows.some((x) => x.deviceId === (r.uuid || r.device_id))) continue;
        const status = String(r.status || 'offline').toLowerCase();
        rows.push({
          deviceId: String(r.uuid || r.device_id || r.name),
          deviceType: String(r.platform || 'mobile').includes('desktop') ? 'desktop' : 'mobile',
          kind: 'lan',
          connectedAt: Date.parse(r.last_seen_at || '') || 0,
          lastSyncAt: Date.parse(r.last_sync_at || '') || null,
          online: status === 'online' || status === 'active',
          source: 'roster' as const,
          name: r.name,
          model: r.model,
        } as any);
      }
    } catch { /* roster table naming may differ */ }
    return rows;
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
      const rows = db.prepare("SELECT uuid, device_id FROM roster_devices WHERE userId = ? OR user_id = ?").all(userUuid, userUuid) as any[];
      for (const r of rows) this.kickDevice(String(r.uuid || r.device_id), reason);
    } catch { /* roster columns may differ */ }
  }

  announce(): void {
    // Ask the hub to relay our hello so peers can dial us.
    this.signalingRelay?.('__broadcast__', { t: 'hello', deviceId: yjsManager.getDeviceId(), deviceType: 'desktop', businessId: this.businessUuid });
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
