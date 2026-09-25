import { createServer, IncomingMessage, ServerResponse } from 'http';
import { createHash, randomUUID, randomBytes } from 'crypto';
import { EventEmitter } from 'events';
import { networkInterfaces } from 'os';
import db from './database';
import { getDesktopDeviceName } from './sync/device-name';
import { getOpenInviteCode } from './sync/user-invites';
import { businessDisplayName } from './sync/device-requests';
import { logger } from './logger';
import { insertAudit } from './audit-chain';
import { notifyDataApplied } from './sync/notify';
import { mainBus } from './bus';
import {
  BUSINESS_ADAPTER_ENTITIES,
  FIELD_MAPS,
  mobileToDesktopPayload,
  desktopToMobilePayload,
  desktopTableName,
  changeChecksum,
  SHARED_SYNC_ENTITIES,
  PROTOCOL_VERSION,
  AdapterEntity,
  type PairingHandshakeAck,
  shortId,
  defaultPairingLogger,
} from '@shega/shared';

export { changeChecksum };
export const SYNC_PORT = 5757;

// ─────────────────────────────────────────────────────────────────────────────
// Handshake-aware HTTP join: both /sync/join/submit and /sync/join/status now
// return a `handshake` field so the joiner's session tracker can mark the
// connection established the moment the HTTP call returns — instead of staying on
// "Waiting for connection…" until (or unless) the owner's approval arrives.
//
// Both fields are derived from the SAME record the caller reads, so there is no
// separate source of truth. businessDisplayName() is fragile before the business
// tables exist on a fresh install; we guard failures rather than let them kill
// the join endpoint.
// ─────────────────────────────────────────────────────────────────────────────

function buildHandshakeAck(rec: { businessId?: string | null; status?: string | null; requestId?: string | null } | null, hubPort: number): PairingHandshakeAck {
  const hubDeviceId = getHubDeviceId();
  let businessId: string | null = null;
  let businessName: string | null = null;
  try {
    if (rec?.businessId) businessId = String(rec.businessId);
  } catch { /* cosmetic — handshake stays useful without a known business */ }
  try {
    if (businessId) businessName = businessDisplayName(businessId);
  } catch { /* cosmetic */ }
  return {
    ok: true,
    hubDeviceId,
    hubName: getDesktopDeviceName(),
    hubPlatform: 'desktop',
    hubPort,
    businessId: businessId ?? (rec?.businessId ? String(rec.businessId) : null),
    businessName,
    status: (rec?.status ?? 'pending') as PairingHandshakeAck['status'],
    requestId: rec?.requestId ?? null,
    at: Date.now(),
  };
}

function getHubDeviceId(): string {
  try { return ensureHubDeviceId(); } catch { return 'desktop'; }
}

/** In-process bus fired whenever new data is persisted by any transport.
 * Subscribers (WS server, future cloud relay) use it to push live updates. */
export const syncHubBus = new EventEmitter();

/** Authoritative relay entity list — single source of truth in @shega/shared
 * (protocol.ts). Kept re-exported as SHARED_TABLES so existing callers keep
 * working while the definition lives in one place. */
export const SHARED_TABLES = SHARED_SYNC_ENTITIES;

export type SyncEntity = (typeof SHARED_TABLES)[number];

/**
 * Map a relay entity name to the physical desktop table. Most entities share
 * their relay name, but roster `devices` are persisted under `roster_devices`
 * (the legacy `devices` table is the LAN pairing registry, not the roster).
 * Mobile's `scheduled_reminders` maps to desktop's `notification_reminders`.
 */
export function tbl(entity: string): string {
  if (entity === 'scheduled_reminders') return 'notification_reminders';
  return desktopTableName(entity as AdapterEntity);
}

/** Inverse of tbl(): the relay entity name for a physical desktop table. */
function relayName(table: string): string {
  if (table === 'notification_reminders') return 'scheduled_reminders';
  return table;
}

interface Change {
  entity: SyncEntity;
  entity_uuid: string;
  op: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;
  device_id?: string;
  client_seq?: number;
  checksum?: string;
}

let columnCache: Record<string, string[]> = {};
function columnsOf(entity: string): string[] {
  const table = tbl(entity);
  if (!columnCache[table]) {
    columnCache[table] = (db.prepare(`PRAGMA table_info(${table})`).all() as any[]).map((c: any) => c.name);
  }
  return columnCache[table];
}

export function ensureHubDeviceId(): string {
  const row = db.prepare('SELECT device_id, pairing_token FROM sync_meta WHERE id = 1').get() as any;
  if (row?.device_id) return row.device_id;
  const id = randomUUID();
  const token = generatePairingToken();
    db.prepare('INSERT OR REPLACE INTO sync_meta (id, device_id, pairing_token, schema_version) VALUES (1, ?, ?, ' + PROTOCOL_VERSION + ')').run(id, token);
  return id;
}

export function getPairingToken(): string {
  const row = db.prepare('SELECT pairing_token FROM sync_meta WHERE id = 1').get() as any;
  if (row?.pairing_token) return row.pairing_token;
  const token = generatePairingToken();
  db.prepare('UPDATE sync_meta SET pairing_token = ? WHERE id = 1').run(token);
  return token;
}

function generatePairingToken(): string {
  // 6 unambiguous characters (no 0/O/1/I) from a CSPRNG.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

function validToken(token: string | null | undefined): boolean {
  return !!token && token.trim().toUpperCase() === getPairingToken();
}

/**
 * Pick a hub address that a phone on the same Wi‑Fi can actually reach.
 *
 * os.networkInterfaces() is keyed by adapter *name*, and on typical Windows
 * rigs the first entries are virtual adapters (vEthernet/WSL, Hyper‑V,
 * VirtualBox/VMware, Hamachi/Tailscale, etc.). Those subnets are unreachable
 * from a phone and surface as "Host unreachable" (NoRouteToHostException)
 * during pairing, so we exclude them instead of blindly returning the first
 * IPv4. Physical adapters and private LAN ranges are preferred.
 */
export function getLanAddress(port = SYNC_PORT): string | null {
  const candidates: { name: string; address: string }[] = [];
  const ifaces = networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] ?? []) {
      if (iface.family !== 'IPv4' || iface.internal) continue;
      const addr = iface.address;
      if (/^(127\.|169\.254\.|0\.)/.test(addr)) continue;
      candidates.push({ name, address: addr });
    }
  }
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => lanScore(a) - lanScore(b));
  return `http://${candidates[0].address}:${port}`;
}

/** Lower is better: physical adapter + private LAN range outranks virtual/exotic. */
function lanScore(c: { name: string; address: string }): number {
  let score = isVirtualAdapterName(c.name) ? 10 : 0;
  if (!/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(c.address)) score += 1;
  return score;
}

function isVirtualAdapterName(name: string): boolean {
  const n = name.toLowerCase();
  const virtual = [
    'veethernet', 'vether', 'wsl', 'hyper-v', 'hyperv', 'virtualbox', 'vmware',
    'vmnet', 'docker', 'bluetooth', 'loopback', 'hamachi', 'tailscale',
    'zerotier', 'npcap', 'wireguard', 'openvpn', 'anyconnect', 'globalprotect',
    'fortinet', 'tap-', 'tap_', 'tun-', 'tun_', 'cisco', 'wan miniport', 'ndis',
    'localhost', 'lan-v6', 'teredo', 'isatap',
  ];
  return virtual.some((v) => n.includes(v));
}

export function registerDevice(deviceId: string, name?: string, platform?: string): void {
  const existing = db.prepare('SELECT id, status FROM devices WHERE device_id = ?').get(deviceId) as any;
  const now = new Date().toISOString();
  if (existing) {
    // A revoked/unpaired device must complete a new pairing/authorization
    // before it can sync again — it never re-registers silently.
    if ((existing.status || 'active') === 'revoked') return;
    db.prepare('UPDATE devices SET last_seen_at = ? WHERE device_id = ?').run(now, deviceId);
  } else {
    db.prepare('INSERT INTO devices (device_id, name, last_seen_at, platform, uuid) VALUES (?, ?, ?, ?, ?)').run(
      deviceId,
      name || deviceId.slice(0, 8),
      now,
      platform === 'mobile' ? 'mobile' : 'desktop',
      deviceId
    );
  }
  // Flip the business roster row online so Connected Devices reflects live
  // presence the moment a device registers with the hub (WS pair or HTTP sync).
  try {
    db.prepare("UPDATE roster_devices SET status = 'online', lastSeenAt = ?, updated_at = CURRENT_TIMESTAMP WHERE uuid = ? OR device_id = ?")
      .run(now, deviceId, deviceId);
  } catch { /* roster table naming may differ */ }
}

/**
 * Persist a peer/hub device in the local devices table.
 * Called by a joiner device after successful pairing with a hub,
 * so the hub appears in Connected Devices and can be used for auto-reconnect.
 */
export function persistPeerDevice(device: {
  deviceId: string;
  name?: string;
  platform?: 'mobile' | 'desktop';
  businessId?: number | string;
  model?: string;
}): void {
  const now = new Date().toISOString();
  const bizId = device.businessId ?? null;
  const existing = db.prepare('SELECT device_id FROM devices WHERE device_id = ?').get(device.deviceId) as any;
  if (existing) {
    db.prepare("UPDATE devices SET name = COALESCE(?, name), platform = COALESCE(?, platform), businessId = COALESCE(?, businessId), status = 'active', last_seen_at = ?, updated_at = CURRENT_TIMESTAMP WHERE device_id = ?")
      .run(device.name, device.platform, bizId, now, device.deviceId);
  } else {
    db.prepare("INSERT INTO devices (device_id, name, platform, businessId, status, last_seen_at) VALUES (?, ?, ?, ?, 'active', ?)")
      .run(device.deviceId, device.name ?? device.deviceId.slice(0, 8), device.platform ?? 'desktop', bizId, now);
  }
  // Also update roster_devices for the business roster view
  if (bizId != null) {
    try {
      const roster = db.prepare('SELECT id FROM roster_devices WHERE businessId = ? AND device_id = ?').get(bizId, device.deviceId) as any;
      if (roster) {
        db.prepare("UPDATE roster_devices SET status = 'active', name = ?, platform = ?, lastSeenAt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .run(device.name ?? device.deviceId.slice(0, 8), device.platform ?? 'desktop', now, roster.id);
      } else {
        db.prepare("INSERT INTO roster_devices (businessId, name, platform, status, isPrimary, uuid, device_id, lastSeenAt, updated_at) VALUES (?, ?, ?, 'active', 0, ?, ?, ?, CURRENT_TIMESTAMP)")
          .run(bizId, device.name ?? device.deviceId.slice(0, 8), device.platform ?? 'desktop', device.deviceId, device.deviceId, now);
      }
    } catch { /* roster table naming may differ */ }
  }
}

/** True when the device has been revoked/unpaired and may not reconnect. */
export function isDeviceRevoked(deviceId: string): boolean {
  try {
    const d = db.prepare('SELECT status FROM devices WHERE device_id = ?').get(deviceId) as any;
    if (d && (d.status || 'active') === 'revoked') return true;
    const r = db.prepare("SELECT status FROM roster_devices WHERE uuid = ? OR id = ?").get(deviceId, deviceId) as any;
    return !!(r && (r.status || '') === 'revoked');
  } catch { return false; }
}

function logSync(deviceId: string | undefined, entity: string, entityUuid: string, op: string, detail: string): void {
  db.prepare('INSERT INTO sync_log (device_id, entity, entity_uuid, op, detail) VALUES (?, ?, ?, ?, ?)').run(
    deviceId ?? null,
    entity,
    entityUuid,
    op,
    detail
  );
}

function maxSeq(): number {
  const r = db.prepare('SELECT COALESCE(MAX(seq),0) AS m FROM sync_outbox').get() as any;
  return r?.m ?? 0;
}

/** 3.10: mark a device so its next pull returns a full re-snapshot. */
export function requestDeviceResync(deviceId: string): void {
  db.prepare('INSERT OR REPLACE INTO sync_requests (device_id, requested_at) VALUES (?, ?)').run(
    deviceId,
    new Date().toISOString()
  );
}

function takeResyncRequest(deviceId: string): boolean {
  const r = db.prepare('SELECT 1 FROM sync_requests WHERE device_id = ?').get(deviceId) as any;
  if (r) {
    db.prepare('DELETE FROM sync_requests WHERE device_id = ?').run(deviceId);
    return true;
  }
  return false;
}

/**
 * Last-write-wins comparison shared by hub and clients.
 * Incoming wins on equal timestamp (last writer), ties broken by row_version then uuid.
 */
export function lwwWins(incoming: Record<string, any>, existing: Record<string, any>): boolean {
  const iTs = (incoming.updated_at ?? incoming.createdAt ?? '') as string;
  const eTs = (existing.updated_at ?? existing.createdAt ?? '') as string;
  if (iTs !== eTs) return iTs > eTs;
  const iVer = Number(incoming.row_version ?? 0);
  const eVer = Number(existing.row_version ?? 0);
  if (iVer !== eVer) return iVer > eVer;
  return String(incoming.uuid ?? '') >= String(existing.uuid ?? '');
}

/**
 * True when an incoming row carries no column value that differs from the
 * existing row (identity/provenance columns excluded). LWW ties use `>=`, so an
 * identical re-delivery would otherwise "win" and write — firing the change
 * triggers and re-echoing the same row forever. Skipping the zero-op write
 * breaks that loop while converging (the row already holds the content).
 */
export function payloadEqualsExisting(incoming: Record<string, any>, existing: Record<string, any>): boolean {
  for (const k of Object.keys(incoming)) {
    if (k === 'id' || k === 'uuid' || k === 'device_id' || k === 'is_synced') continue;
    if (!Object.prototype.hasOwnProperty.call(existing, k)) continue;
    const a = incoming[k];
    const b = existing[k];
    if (a === b) continue;
    // DB reads return numbers; wire values may arrive as strings for numeric-ish columns.
    if (typeof a === 'number' && typeof b === 'string' && String(a) === b) continue;
    if (typeof b === 'number' && typeof a === 'string' && String(b) === a) continue;
    return false;
  }
  return true;
}

function cleanPayload(entity: string, payload: Record<string, any>): Record<string, any> {
  const cols = columnsOf(entity);
  const clean: Record<string, any> = {};
  for (const k of Object.keys(payload)) {
    if (cols.includes(k)) clean[k] = payload[k];
  }
  return clean;
}

/**
 * Bridge the cross-wire column-name drift for the history tables. Mobile names
 * the columns `status`/`changedBy`; desktop's schema uses `action`/`performedBy`
 * (ipc-handlers inserts action/performedBy, so a `status` column would be
 * dropped by cleanPayload and desktop-origin rows would lose their label on
 * mobile). Applied symmetrically on emit and apply so both directions work.
 * The `sales` entry preserves user attribution cross-platform: mobile records
 * the cashier in `user_id`, desktop stores `createdBy`.
 */
const HISTORY_COLUMN_BRIDGE: Record<string, [string, string]> = {
  order_history: ['status', 'action'],
  shipment_history: ['status', 'action'],
  sales: ['user_id', 'createdBy']
};

export function bridgeHistoryColumns(entity: string, payload: Record<string, any>): Record<string, any> {
  let out = { ...payload };
  if (entity === 'users') {
    if (out.businessId == null && out.business_id != null) out.businessId = out.business_id;
    if (out.business_id == null && out.businessId != null) out.business_id = out.businessId;

    if (out.isActive == null && out.is_active != null) out.isActive = out.is_active ? 1 : 0;
    if (out.is_active == null && out.isActive != null) out.is_active = out.is_active ? 1 : 0;

    if (out.isOwner == null && out.is_owner != null) out.isOwner = out.is_owner ? 1 : 0;
    if (out.is_owner == null && out.isOwner != null) out.is_owner = out.is_owner ? 1 : 0;

    if (out.pinHash == null && out.pin_hash != null) out.pinHash = out.pin_hash;
    if (out.pin_hash == null && out.pinHash != null) out.pin_hash = out.pinHash;

    if (out.pinSalt == null && out.pin_salt != null) out.pinSalt = out.pin_salt;
    if (out.pin_salt == null && out.pinSalt != null) out.pin_salt = out.pinSalt;

    if (out.roleName == null && out.role_name != null) out.roleName = out.role_name;
    if (out.role_name == null && out.roleName != null) out.role_name = out.roleName;
  }
  const bridge = HISTORY_COLUMN_BRIDGE[entity];
  if (!bridge) return out;
  const [mobileCol, desktopCol] = bridge;
  if (out[desktopCol] == null && out[mobileCol] != null) out[desktopCol] = out[mobileCol];
  if (out[mobileCol] == null && out[desktopCol] != null) out[mobileCol] = out[desktopCol];
  return out;
}

/**
 * Map a remote device's local FK id to the hub's local id via the uuid registry.
 */
function resolveFk(deviceId: string, entity: string, localId: number | null): number | null {
  if (localId == null) return null;
  const ref = db
    .prepare('SELECT uuid FROM sync_refs WHERE device_id = ? AND entity = ? AND local_id = ?')
    .get(deviceId, entity, localId) as any;
  if (!ref?.uuid) return null;
  const row = db.prepare(`SELECT id FROM ${entity} WHERE uuid = ?`).get(ref.uuid) as any;
  return row?.id ?? null;
}

function recordRef(deviceId: string, entity: string, payload: Record<string, any>): void {
  if (payload.id == null || !payload.uuid) return;
  db.prepare('INSERT OR REPLACE INTO sync_refs (device_id, entity, local_id, uuid) VALUES (?, ?, ?, ?)').run(
    deviceId,
    entity,
    Number(payload.id),
    String(payload.uuid)
  );
}

function existingByUuid(entity: string, uuid: string): any {
  return db.prepare(`SELECT * FROM ${tbl(entity)} WHERE uuid = ?`).get(uuid) as any;
}

// ===== Business-model adapter: Mobile (snake_case, uuid) <-> Desktop (camelCase, integer id) =====
function isAdapterEntity(entity: string): entity is AdapterEntity {
  return (BUSINESS_ADAPTER_ENTITIES as readonly string[]).includes(entity);
}

/** A mobile-canonical payload carries the canonical schema; detect it per-entity. */
function looksLikeMobile(entity: string, payload: Record<string, any>): boolean {
  if (!isAdapterEntity(entity)) return false;
  if (entity === 'businesses') return 'name' in payload && !('businessName' in payload);
  return 'business_id' in payload;
}

/** Translate a Mobile FK uuid to the Desktop table's INTEGER id (best-effort). */
function mobileFkToDesktopInt(fk: { desktopColumn: string; lookupEntity: string }, uuid: string | null | undefined): number | null {
  if (uuid == null || uuid === '') return null;
  try {
    const row = db.prepare(`SELECT id FROM ${fk.lookupEntity} WHERE uuid = ?`).get(String(uuid)) as any;
    return row?.id ?? null;
  } catch {
    return null;
  }
}

/** Translate a Desktop INTEGER FK id to the Mobile uuid (best-effort). */
function desktopFkToMobileUuid(fk: { mobileField: string; lookupEntity: string }, desktopId: number | null | undefined): string | null {
  if (desktopId == null) return null;
  try {
    const row = db.prepare(`SELECT uuid FROM ${fk.lookupEntity} WHERE id = ?`).get(Number(desktopId)) as any;
    return row?.uuid ?? null;
  } catch {
    return null;
  }
}

// ===== Multi-business: core POS tables use the business UUID on the wire =====
// Adapter entities already bridge business_id (uuid) <-> businessId (int). The
// core POS tables store the desktop INTEGER business id internally, but mobile
// peers operate by the business UUID, so payloads are normalized on the way out
// (int -> uuid) and on the way in (uuid -> int). Peers that predate this send
// the desktop int or nothing; ints pass through untouched on the wire and nulls
// are left alone (mobile backfills those to its operating business).
const CORE_BUSINESS_SCOPED_ENTITIES: readonly string[] = [
  'categories', 'items', 'item_packs', 'item_barcodes', 'quick_products',
  'sales', 'debt_payments', 'adjustments', 'customers',
  'warehouses', 'returns',
  'employee_roles', 'employees', 'employee_accounts', 'attendance', 'employee_performance',
  'subscriptions'
];

function businessIntToUuid(int: number | null | undefined): string | null {
  if (int == null) return null;
  try {
    const row = db.prepare('SELECT id, uuid FROM businesses WHERE id = ?').get(Number(int)) as any;
    if (!row) return null;
    if (row.uuid) return row.uuid;
    // Desktop-created businesses can reach the wire without a uuid (the 5.7
    // migration backfilled existing rows, but new `business:create` inserts
    // ran without one). Materialize a real uuid on first wire contact — never
    // the fabricated `biz-<id>` sentinel, which splits the business identity
    // across platforms (mobile keyed the business by uuid, desktop by int).
    const uuid = randomUUID();
    db.prepare('UPDATE businesses SET uuid = ? WHERE id = ?').run(uuid, Number(int));
    return uuid;
  } catch {
    return null;
  }
}

function businessUuidToInt(uuid: string | null | undefined): number | null {
  if (uuid == null || uuid === '') return null;
  try {
    const row = db.prepare('SELECT id FROM businesses WHERE uuid = ?').get(String(uuid)) as any;
    return row?.id ?? null;
  } catch {
    return null;
  }
}

/** The hub's primary business id (isDefault=1, else the first one). Used to
 * attach rows from peers that never set a business key (subscriptions). */
function getDefaultBusinessId(): number | null {
  try {
    const row = db.prepare("SELECT id FROM businesses WHERE isDefault = 1 LIMIT 1").get() as any;
    if (row?.id != null) return Number(row.id);
    const first = db.prepare('SELECT id FROM businesses ORDER BY id LIMIT 1').get() as any;
    return first?.id != null ? Number(first.id) : null;
  } catch {
    return null;
  }
}

/**
 * Build the cross-wire payload for a desktop relay row. Adapter entities use
 * their field map; core POS tables carry the business UUID instead of the
 * desktop INTEGER id (`biz-<id>` sentinel when the business has no uuid yet).
 */
export function emitEntityPayload(entity: string, row: Record<string, any>): Record<string, any> {
  if (isAdapterEntity(entity)) return toMobilePayload(entity, row);
  if (CORE_BUSINESS_SCOPED_ENTITIES.includes(entity) && row.businessId != null) {
    const next = { ...row };
    const asStr = String(row.businessId);
    if (/^[0-9]+$/.test(asStr)) {
      next.businessId = businessIntToUuid(Number(row.businessId)) ?? `biz-${asStr}`;
    }
    return next;
  }
  return row;
}

/** Convert an incoming Mobile payload to Desktop schema, resolving FKs to local INTEGER ids. */
function toDesktopPayload(entity: AdapterEntity, payload: Record<string, any>): Record<string, any> {
  const out = mobileToDesktopPayload(entity, payload);
  const map = FIELD_MAPS[entity];
  for (const fk of map.mobileFk) {
    out[fk.desktopColumn] = mobileFkToDesktopInt(fk, out[fk.desktopColumn]);
  }
  return out;
}

/** Convert a Desktop row (or desktop-schema payload) to the Mobile schema, resolving FKs back to uuids. */
function toMobilePayload(entity: AdapterEntity, payload: Record<string, any>): Record<string, any> {
  const out = desktopToMobilePayload(entity, payload);
  const map = FIELD_MAPS[entity];
  for (const fk of map.desktopFk) {
    out[fk.mobileField] = desktopFkToMobileUuid(fk, payload[fk.desktopColumn]);
  }
  return out;
}

type ApplyStatus = 'applied' | 'conflict' | 'pending' | 'skipped';

export interface ApplyResult {
  applied: number;
  conflicts: number;
  skipped: number;
  pending: number;
  /** Per-change outcome keyed to the client's `client_seq` so it can prune/retry its outbox. */
  results?: { client_seq: number | null; status: ApplyStatus }[];
}

/**
 * Apply an incoming change with LWW + idempotency. Mutations go through the DB
 * triggers so every write is echoed back into sync_outbox for other clients.
 */
function applyChange(deviceId: string, change: Change): 'applied' | 'conflict' | 'pending' | 'skipped' {
  const { entity, entity_uuid, op, payload } = change;
  if (!SHARED_TABLES.includes(entity as SyncEntity) || !entity_uuid) {
    logSync(deviceId, entity, entity_uuid, op, 'skipped unknown entity');
    return 'skipped';
  }
  const adapterData = isAdapterEntity(entity) && looksLikeMobile(entity, payload)
    ? toDesktopPayload(entity, payload)
    : payload;
  const data = cleanPayload(entity, bridgeHistoryColumns(entity, adapterData));

  // Peer subscriptions may carry status values (e.g. mobile's 'trial') that
  // the hub's CHECK constraint does not allow. Map them onto the nearest
  // legal value instead of failing the whole change.
  if (entity === 'subscriptions') {
    const VALID_SUB_STATUS = ['active', 'expired', 'cancelled', 'pending'];
    if (data.status == null || !VALID_SUB_STATUS.includes(String(data.status))) {
      data.status = 'active';
    }
    // Editions are the canonical vocabulary; the legacy words stay accepted so
    // a peer on an older build never has its subscription row rejected.
    const VALID_SUB_TIER = ['mobile', 'desktop', 'both', 'trial', 'none', 'basic', 'premium'];
    if (data.tier == null || !VALID_SUB_TIER.includes(String(data.tier))) {
      data.tier = 'none';
    }
  }
  // Mobile business rows never bridge a storeName (and may send null) but the
  // hub's businesses.storeName is NOT NULL; fall back to the business name, or
  // a placeholder, instead of dropping the whole change. Same guard for
  // businessName.
  if (entity === 'businesses') {
    if (data.storeName == null || data.storeName === '') {
      data.storeName = data.businessName ?? 'Business';
    }
    if (data.businessName == null || data.businessName === '') {
      data.businessName = data.storeName ?? 'Business';
    }
  }

  // Normalize the cross-wire business key for core tables: peers send the
  // business UUID (mobile) or the desktop id; store the desktop INTEGER id so
  // business-scoped reads keep working. An unknown UUID falls back to the
  // default business — the push was token-authenticated, so the row belongs
  // to the business this hub serves. Storing NULL (the old behavior) made
  // every such row invisible to business-scoped queries, which looked exactly
  // like "sync works but nothing appears".
  if (CORE_BUSINESS_SCOPED_ENTITIES.includes(entity)) {
    if (data.businessId != null && !/^[0-9]+$/.test(String(data.businessId))) {
      data.businessId = businessUuidToInt(String(data.businessId)) ?? getDefaultBusinessId();
    } else if (data.businessId == null) {
      data.businessId = getDefaultBusinessId();
    }
  }
  // Subscriptions carry businessId NOT NULL on the hub; a peer that never set
  // it (pre-multi-business mobile rows) must attach to the default business
  // instead of tripping the constraint.
  if (entity === 'subscriptions' && (data.businessId == null || data.businessId === '')) {
    data.businessId = getDefaultBusinessId();
  }

  // Hub-centric business authority: a peer pushing its own standalone business
  // row must not become a SECOND default on the hub — two defaults make the
  // active business ambiguous and every default-scoped desktop view (inventory,
  // sales, debts) silently shows the wrong rows. Only the hub's own current
  // default keeps its flag.
  if (entity === 'businesses' && data.isDefault) {
    const hubDefault = db.prepare('SELECT id, uuid FROM businesses WHERE isDefault = 1 ORDER BY id LIMIT 1').get() as any;
    if (hubDefault && String(hubDefault?.uuid ?? '') !== String(data.uuid ?? '')) {
      data.isDefault = 0;
    }
  }
  // Peer data under a peer-imported business (a hub business whose record came
  // from another device, not the hub's local default) is folded onto the hub's
  // default business so joined-device rows never split the shared dataset.
  // Applies to every table carrying a businessId column, core or not.
  if (entity !== 'businesses' && data.businessId != null) {
    const raw = String(data.businessId);
    const intId = /^[0-9]+$/.test(raw) ? Number(raw) : businessUuidToInt(raw);
    const defId = getDefaultBusinessId();
    if (intId != null && Number.isInteger(intId) && intId !== defId) {
      const row = db.prepare('SELECT id, device_id FROM businesses WHERE id = ?').get(intId) as any;
      if (row && String(row.device_id ?? '').length > 0) {
        data.businessId = defId;
      }
    }
  }

  // §32: audit events are append-only — never LWW-updated. Incoming changes are
  // deduped by stable `uuid` and re-chained into the hub's tamper-evident log
  // via insertAudit() so the merged ledger remains one verifiable chain.
  if (entity === 'audit_logs') {
    if (op === 'DELETE') return 'skipped'; // audit rows are immutable
    return applyAuditChange(deviceId, change) ? 'applied' : 'skipped';
  }

  if (op === 'DELETE') {
    const existing = existingByUuid(entity, entity_uuid);
    if (existing) {
      db.prepare(`UPDATE ${tbl(entity)} SET is_deleted = 1, deleted_at = COALESCE(?, deleted_at) WHERE uuid = ?`).run(
        payload.deleted_at ?? new Date().toISOString(),
        entity_uuid
      );
      logSync(deviceId, entity, entity_uuid, op, 'applied');
    }
    else {
      logSync(deviceId, entity, entity_uuid, op, 'skipped unknown entity row (nothing to delete)');
    }
    return 'applied';
  }

  // subscriptions.businessId is UNIQUE on the hub and the hub ALWAYS seeds a
  // default-business row, so a peer pushing its subscription for the default
  // business must never take the blind-INSERT path (that trips UNIQUE). Route
  // it onto the row that already owns that businessId instead — mirroring the
  // desktop approver's SELECT-by-businessId → UPDATE-else-INSERT upsert — so
  // trial/plan data from a phone folds onto the hub's authoritative row.
  if (entity === 'subscriptions' && data.businessId != null) {
    const byBiz = db.prepare('SELECT * FROM subscriptions WHERE businessId = ?').get(data.businessId) as any;
    if (byBiz && byBiz.businessId != null) {
      if (payloadEqualsExisting({ ...data, uuid: entity_uuid }, byBiz)) {
        logSync(deviceId, entity, entity_uuid, op, 'noop_identical');
        recordRef(deviceId, entity, { id: byBiz.id, uuid: byBiz.uuid });
        return 'applied';
      }
      if (lwwWins({ ...data, uuid: entity_uuid }, byBiz)) {
        const updateData: Record<string, any> = { ...data };
        delete updateData.id;
        delete updateData.uuid;
        const cols2 = columnsOf(entity).filter((c) => c in updateData && c !== 'id' && c !== 'uuid');
        if (cols2.length) {
          const sets = cols2.map((c) => `${c} = ?`).join(', ');
          const values = cols2.map((c) => updateData[c]);
          db.prepare(`UPDATE ${tbl(entity)} SET ${sets} WHERE id = ?`).run(...values, byBiz.id);
        }
        recordRef(deviceId, entity, { id: byBiz.id, uuid: byBiz.uuid });
        logSync(deviceId, entity, entity_uuid, op, 'applied (redirected to existing businessId row)');
        return 'applied';
      }
      logSync(deviceId, entity, entity_uuid, op, 'conflict_rejected (incoming older than hub row)');
      return 'conflict';
    }
  }

  const existing = existingByUuid(entity, entity_uuid);
  if (!existing) {
    const insertData: Record<string, any> = { ...data };
    // Never trust a peer's INTEGER id: each device owns its PK sequence. Strip
    // it so the hub assigns its own autoincrement id, and record the (device,
    // remote id, uuid) ref so that device's later FKs (itemId, categoryId, …)
    // can be resolved back to the hub's local id.
    const remoteId = Number(data.id);
    delete insertData.id;
    insertData.uuid = entity_uuid;
    insertData.device_id = deviceId;
    insertData.updated_at = insertData.updated_at ?? new Date().toISOString();
    let pending = false;
    if ((entity === 'sales' || entity === 'returns' || entity === 'stock_movements') && insertData.itemId != null) {
      const hubItemId = resolveFk(deviceId, 'items', insertData.itemId);
      if (hubItemId != null) {
        insertData.itemId = hubItemId;
      } else {
        insertData.itemId = null;
        pending = true;
        logSync(deviceId, entity, entity_uuid, op, 'pending_item itemId not resolvable');
      }
    }
    if (entity === 'sales' && insertData.packId != null) {
      const hubPackId = resolveFk(deviceId, 'item_packs', insertData.packId);
      if (hubPackId != null) insertData.packId = hubPackId;
    }
    if (entity === 'stock_movements' && insertData.warehouseId != null) {
      const hubWhId = resolveFk(deviceId, 'warehouses', insertData.warehouseId);
      // Null out an unresolvable warehouse rather than keeping the peer's raw
      // id — that row is a local id from another device and would violate the FK.
      insertData.warehouseId = hubWhId;
    }
    if (entity === 'stock_movements' && insertData.referenceId != null && insertData.referenceType === 'sale') {
      // The referenced sale may not have arrived yet (peer outbox ordering);
      // drop the dangling reference instead of failing the FK constraint.
      const hubSaleId = resolveFk(deviceId, 'sales', insertData.referenceId);
      if (hubSaleId == null) delete insertData.referenceId;
      else insertData.referenceId = hubSaleId;
    }
    const cols = columnsOf(entity).filter((c) => c in insertData);
    const placeholders = cols.map(() => '?').join(', ');
    const values = cols.map((c) => insertData[c]);
    const insertSql =
      entity === 'subscriptions'
        // subscriptions.businessId is UNIQUE; the hub ALWAYS seeds a default
        // business row, so a peer pushing its subscription for the default
        // business must fold onto that existing row (LWW-style) instead of a
        // blind INSERT that trips UNIQUE.
        ? `INSERT INTO ${tbl(entity)} (${cols.join(', ')}) VALUES (${placeholders}) ON CONFLICT(businessId) DO UPDATE SET ${cols.filter((c) => c !== 'id' && c !== 'uuid' && c !== 'businessId').map((c) => `${c} = excluded.${c}`).join(', ')}`
        : `INSERT INTO ${tbl(entity)} (${cols.join(', ')}) VALUES (${placeholders})`;
    db.prepare(insertSql).run(...values);
    if (Number.isFinite(remoteId) && remoteId > 0) {
      recordRef(deviceId, entity, { id: remoteId, uuid: entity_uuid });
    }
    logSync(deviceId, entity, entity_uuid, op, pending ? 'pending_item (inserted, waiting for parent row)' : 'applied');
    return pending ? 'pending' : 'applied';
  }

  // Row exists -> skip a zero-op re-delivery (identical content) before LWW:
  // LWW ties on equal uuid resolve "incoming wins", which would rewrite an
  // echo'd row, fire the triggers, and re-broadcast the same change forever.
  const incoming = { ...data, uuid: entity_uuid, updated_at: data.updated_at ?? new Date().toISOString() };
  if (payloadEqualsExisting(incoming, existing)) {
    logSync(deviceId, entity, entity_uuid, change.op, 'noop_identical');
    return 'applied';
  }
  if (lwwWins(incoming, existing)) {
    const updateData: Record<string, any> = { ...data };
    delete updateData.id;
    updateData.device_id = deviceId;
    // The insert path resolves peer FKs (itemId/warehouseId) to hub-local ids;
    // the update path must do the same or a movement whose parent sale/item
    // arrived under a different local id trips FOREIGN KEY constraint failed.
    if (entity === 'stock_movements' || entity === 'sales' || entity === 'returns') {
      if (updateData.itemId != null) {
        const hubItemId = resolveFk(deviceId, 'items', updateData.itemId);
        if (hubItemId != null) updateData.itemId = hubItemId;
        else delete updateData.itemId; // keep the existing local value rather than crash
      }
      if (entity === 'stock_movements' && updateData.warehouseId != null) {
        const hubWhId = resolveFk(deviceId, 'warehouses', updateData.warehouseId);
        if (hubWhId != null) updateData.warehouseId = hubWhId;
        else delete updateData.warehouseId;
      }
    }
    const cols = columnsOf(entity).filter((c) => c in updateData && c !== 'id' && c !== 'uuid');
    if (cols.length) {
      const sets = cols.map((c) => `${c} = ?`).join(', ');
      const values = cols.map((c) => updateData[c]);
      db.prepare(`UPDATE ${tbl(entity)} SET ${sets} WHERE uuid = ?`).run(...values, entity_uuid);
    }
    recordRef(deviceId, entity, data);
    logSync(deviceId, entity, entity_uuid, op, 'applied');
    return 'applied';
  }
  logSync(deviceId, entity, entity_uuid, op, 'conflict_rejected');
  return 'conflict';
}

/**
 * §32 — append-only merge of a remote audit event into the hub's authoritative,
 * tamper-evident chain. Dedupes by the stable `uuid` (the auditId); on new rows
 * it maps the mobile snake_case payload to the desktop schema and re-chains via
 * insertAudit() so `verifyAuditChain()` keeps passing after every merge.
 */
function applyAuditChange(deviceId: string, change: Change): boolean {
  const payload = change.payload ?? {};
  const uuid = String(payload.uuid ?? change.entity_uuid ?? '');
  if (!uuid) return false;
  const duplicate = (db.prepare('SELECT id FROM audit_logs WHERE uuid = ?').get(uuid) as any);
  if (duplicate) return true; // at-least-once delivery — already merged

  const businessId = payload.business_id
    ? mobileFkToDesktopInt({ desktopColumn: 'businessId', lookupEntity: 'businesses' }, String(payload.business_id))
    : null;

  try {
    insertAudit(db, {
      businessId,
      action: String(payload.action ?? ''),
      entityType: String(payload.entity ?? payload.entityType ?? ''),
      entityId: payload.entity_id != null ? Number(payload.entity_id) : (payload.entityId != null ? Number(payload.entityId) : null),
      fieldName: payload.field_name != null ? String(payload.field_name) : (payload.fieldName ?? null),
      oldValue: payload.old_value != null ? String(payload.old_value) : (payload.oldValue ?? null),
      newValue: payload.new_value != null ? String(payload.new_value) : (payload.newValue ?? null),
      changedBy: payload.changed_by ? String(payload.changed_by) : (payload.changedBy ?? null),
      changedById: payload.changed_by_id != null ? Number(payload.changed_by_id) : (payload.changedById ?? null),
      description: payload.description ? String(payload.description) : null,
      createdAt: String(payload.created_at ?? payload.createdAt ?? new Date().toISOString()),
    }, {
      uuid,
      sourceDevice: String(payload.source_device ?? payload.device_id ?? deviceId),
    });
    return true;
  } catch (e) {
    logSync(deviceId, 'audit_logs', uuid, change.op, 'audit_merge_failed');
    return false;
  }
}

/**
 * Cross-device write idempotency ledger. Keyed by (device_id, checksum): once a
 * checksum from a given device has been merged, the same change re-delivered
 * again (trigger echo, LAN retry, cloud replay) is acknowledged without a write.
 */
export function ensureSyncReceivedTable(): void {
  db.exec(
    'CREATE TABLE IF NOT EXISTS sync_received (' +
      'device_id TEXT NOT NULL, ' +
      'checksum TEXT NOT NULL, ' +
      'received_at TEXT, ' +
      'PRIMARY KEY (device_id, checksum)' +
      ')'
  );
}

/**
 * Cloud pushes stream out of the desktop outbox as a delta (seq > watermark).
 * On the first cloud sync after enabling, rows that predate the outbox triggers
 * are backfilled so the whole shared dataset is pushed at least once.
 */
export function ensureBaselineOutbox(): number {
  const exists = db.prepare('SELECT 1 FROM sync_outbox WHERE entity = ? AND entity_uuid = ? LIMIT 1');
  const enqueue = db.prepare(
    'INSERT INTO sync_outbox (entity, entity_uuid, op, payload, device_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  let added = 0;
  const now = new Date().toISOString();
  for (const entity of SHARED_TABLES) {
    const rows = db.prepare(`SELECT * FROM ${tbl(entity)} WHERE is_deleted = 0`).all() as any[];
    for (const r of rows) {
      if (!r.uuid) continue;
      if (exists.get(entity, r.uuid)) continue;
      enqueue.run(entity, r.uuid, 'INSERT', JSON.stringify(r), r.device_id ?? null, now);
      added += 1;
    }
  }
  if (added) logSync('', 'sync_outbox', 'baseline', 'INSERT', `backfilled ${added} pre-trigger rows`);
  return added;
}

export function applyPush(deviceId: string, changes: Change[]): ApplyResult {
  const result: ApplyResult = { applied: 0, conflicts: 0, skipped: 0, pending: 0, results: [] };
  ensureSyncReceivedTable();
  const receivedMark = db.prepare('INSERT OR IGNORE INTO sync_received (device_id, checksum, received_at) VALUES (?, ?, ?)');
  const alreadyReceived = db.prepare('SELECT 1 FROM sync_received WHERE device_id = ? AND checksum = ?');
  const doApply = db.transaction((list: Change[]) => {
    for (const change of list) {
      const clientSeq = change.client_seq != null ? Number(change.client_seq) : null;
      let status: ApplyStatus;
      try {
        // 3.7 integrity: reject a change whose checksum does not match its payload.
        if (change.checksum) {
          const expected = changeChecksum(change);
          if (change.checksum !== expected) {
            result.skipped += 1;
            status = 'skipped';
            logSync(deviceId, change.entity, change.entity_uuid, change.op, `checksum_mismatch`);
            result.results!.push({ client_seq: clientSeq, status });
            continue;
          }
        }
        // Idempotent at-least-once delivery: a checksum we already merged is a
        // re-delivery (echo, LAN retry, cloud replay) — acknowledge without
        // writing, so triggers never re-broadcast the same change forever.
        if (change.checksum && alreadyReceived.get(deviceId, change.checksum)) {
          result.applied += 1;
          result.results!.push({ client_seq: clientSeq, status: 'applied' });
          continue;
        }
        const existing = existingByUuid(change.entity, change.entity_uuid);
        const data = cleanPayload(change.entity, change.payload);
        if (existing && change.op === 'INSERT' && lwwWins(existing, { ...data, uuid: change.entity_uuid })) {
          result.conflicts += 1;
          status = 'conflict';
          result.results!.push({ client_seq: clientSeq, status });
          continue;
        }
        status = applyChange(deviceId, change);
        if (status === 'applied') {
          result.applied += 1;
          if (change.checksum) receivedMark.run(deviceId, change.checksum, new Date().toISOString());
        }
        else if (status === 'conflict') result.conflicts += 1;
        else if (status === 'pending') result.pending += 1;
        else result.skipped += 1;
        result.results!.push({ client_seq: clientSeq, status: status as ApplyStatus });
      } catch (e: any) {
        result.skipped += 1;
        status = 'skipped';
        result.results!.push({ client_seq: clientSeq, status });
        logSync(deviceId, change.entity, change.entity_uuid, change.op, `error ${e?.message ?? ''}`);
      }
    }
    // Flag any stock going negative after applying the batch.
    const bad = db
      .prepare('SELECT id, name, totalBaseQuantity FROM items WHERE totalBaseQuantity < 0 AND is_deleted = 0 LIMIT 20')
      .all() as any[];
    for (const b of bad) {
      logSync(deviceId, 'items', String(b.id), 'UPDATE', `negative_stock ${b.name} ${b.totalBaseQuantity}`);
    }
  });
  doApply(changes);
  // Live UI push: this is the single choke point every transport funnels
  // through (LAN HTTP /sync/push, WS SYNC_PUSH, cloud relay, desktop peer
  // pulls). Tell every open renderer window to re-query SQLite, and let
  // connected WS clients know new data is pullable right away.
  if (result.applied > 0) {
    notifyDataApplied({ applied: result.applied, conflicts: result.conflicts, changes: changes.length, source: 'hub' });
    syncHubBus.emit('applied', { applied: result.applied });
    // Life-cycle notification: sync finished after a successful push from a remote device.
    try { mainBus.emitEvent('sync-completed', { deviceId, deviceName: deviceId, platform: 'unknown', pushed: result.applied, conflicts: result.conflicts }); } catch {}
    // Keep the activity log bounded — pruning after each batch prevents the
    // sync_log table from growing without limit.
    db.prepare('DELETE FROM sync_log WHERE id NOT IN (SELECT id FROM sync_log ORDER BY id DESC LIMIT 5000)').run();
  }
  return result;
}

export function snapshotSince(since: number) {
  const seq = maxSeq();
  if (since <= 0) {
    const changes: any[] = [];
    for (const entity of SHARED_TABLES) {
      const rows = db.prepare(`SELECT * FROM ${tbl(entity)} WHERE is_deleted = 0`).all() as any[];
      for (const r of rows) {
        changes.push({
          entity,
          entity_uuid: r.uuid,
          op: 'INSERT',
          payload: emitEntityPayload(entity, bridgeHistoryColumns(entity, r)),
          device_id: r.device_id
        });
      }
    }
    return { changes, lastSeq: seq, snapshot: true };
  }
  const rows = db
    .prepare('SELECT * FROM sync_outbox WHERE seq > ? ORDER BY seq ASC LIMIT 1000')
    .all(since) as any[];
  const changes = rows.map((r) => {
    let payload: any = {};
    try {
      payload = JSON.parse(r.payload);
    } catch {}
    if (r.op !== 'DELETE' && (!payload || Object.keys(payload).length === 0) && r.entity_uuid) {
      try {
        const row = db.prepare(`SELECT * FROM ${tbl(r.entity)} WHERE uuid = ?`).get(r.entity_uuid) as any;
        if (row) payload = row;
      } catch {}
    }
    payload = emitEntityPayload(r.entity, bridgeHistoryColumns(r.entity, payload));
    return { entity: r.entity, entity_uuid: r.entity_uuid, op: r.op, payload, device_id: r.device_id, seq: r.seq };
  });
  return { changes, lastSeq: seq, snapshot: false };
}

/**
 * 3.6: Build a full snapshot of all shared tables as hub-format changes, each
 * carrying a SHA-256 checksum so the cloud relay can verify integrity (3.7).
 * Used by the desktop hub when pushing its state to the cloud relay.
 */
export function buildCloudChanges(): Change[] {
  const out: Change[] = [];
  const hubId = ensureHubDeviceId();
  for (const entity of SHARED_TABLES) {
    const rows = db.prepare(`SELECT * FROM ${tbl(entity)} WHERE is_deleted = 0`).all() as any[];
    for (const r of rows) {
      let payload: Record<string, any> = {};
      for (const k of Object.keys(r)) payload[k] = r[k];
      payload = emitEntityPayload(entity, payload);
      const change: Change = { entity, entity_uuid: r.uuid, op: 'INSERT', payload, device_id: hubId };
      change.checksum = changeChecksum(change);
      out.push(change);
    }
  }
  return out;
}

/** 3.6: Apply changes received from the cloud relay (other branches). Reuses
 * the same LWW/integrity path so cloud changes are audited exactly like LAN sync. */
export function applyRemoteChanges(deviceId: string, changes: Change[]): ApplyResult {
  return applyPush(deviceId, changes);
}

export function verifyChecksums() {
  const out: Record<string, { count: number; checksum: string }> = {};
  for (const entity of SHARED_TABLES) {
    const rows = db
      .prepare(`SELECT uuid, updated_at, row_version, is_deleted FROM ${tbl(entity)} WHERE is_deleted = 0`)
      .all() as any[];
    const h = createHash('sha256');
    const sorted = rows.slice().sort((a, b) => (a.uuid < b.uuid ? -1 : 1));
    for (const r of sorted) {
      h.update(`${entity}|${r.uuid}|${r.updated_at ?? ''}|${r.row_version ?? 0}|${r.is_deleted ?? 0}|`);
    }
    out[entity] = { count: sorted.length, checksum: h.digest('hex') };
  }
  return out;
}

function sendJson(res: ServerResponse, code: number, body: any): void {
  const raw = JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(raw);
}

function readBody(req: IncomingMessage, max = 8 * 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > max) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export class SyncHub {
  private server: ReturnType<typeof createServer> | null = null;
  private deviceId = '';

  start(port = SYNC_PORT): void {
    if (this.server) return;
    this.deviceId = ensureHubDeviceId();
    this.server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const path = url.pathname;

        if (req.method === 'OPTIONS') {
          res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' });
          res.end();
          return;
        }

        if (path === '/sync/info' && req.method === 'GET') {
          sendJson(res, 200, {
            ok: true,
            hub: this.deviceId,
            // Advertised so LAN probes (lan-discovery.ts) can name this device
            // even when mDNS multicast never reaches us, plus any open invite
            // code so a joiner can still join when multicast is blocked.
            deviceName: getDesktopDeviceName(),
            platform: 'desktop',
            inviteCode: getOpenInviteCode(),
            schemaVersion: PROTOCOL_VERSION,
            port,
            tables: SHARED_TABLES,
            lastSeq: maxSeq(),
            pairingRequired: true,
            lanUrl: getLanAddress(port)
          });
          return;
        }

        if (path === '/sync/pair' && req.method === 'POST') {
          const body = JSON.parse(await readBody(req));
          const token = String(body.token ?? url.searchParams.get('token') ?? '');
          if (!validToken(token)) return sendJson(res, 403, { ok: false, error: 'invalid pairing token' });
          const deviceId = String(body.device_id || body.device || '');
          if (!deviceId) return sendJson(res, 400, { ok: false, error: 'device_id required' });
          if (isDeviceRevoked(deviceId)) return sendJson(res, 403, { ok: false, error: 'device was unpaired — new pairing required' });
          registerDevice(deviceId, body.name, body.platform);
          mainBus.emitEvent('device-connected', { deviceId, deviceName: body.name || deviceId, platform: body.platform || 'unknown' });
          sendJson(res, 200, { ok: true, hub: this.deviceId });
          return;
        }

        if (path === '/sync/pull' && req.method === 'GET') {
          const token = String(url.searchParams.get('token') ?? '');
          if (!validToken(token)) return sendJson(res, 403, { ok: false, error: 'invalid pairing token' });
          const deviceId = String(url.searchParams.get('device') || '');
          if (!deviceId) return sendJson(res, 400, { ok: false, error: 'device required' });
          if (isDeviceRevoked(deviceId)) return sendJson(res, 403, { ok: false, error: 'device was unpaired — new pairing required' });
          registerDevice(deviceId);
          const force = takeResyncRequest(deviceId);
          const since = Number(url.searchParams.get('since') || '0');
          const data = snapshotSince(force || !Number.isFinite(since) ? 0 : since);
          db.prepare('INSERT OR REPLACE INTO sync_cursor (device_id, last_seq, updated_at) VALUES (?, ?, ?)').run(
            deviceId,
            data.lastSeq,
            new Date().toISOString()
          );
          if (data.changes.length > 0) {
            try { mainBus.emitEvent('sync-started', { deviceId, deviceName: deviceId, platform: 'unknown' }); } catch {}
          }
          sendJson(res, 200, { ok: true, ...data, forceResync: force, hub: this.deviceId });
          return;
        }

        if (path === '/sync/push' && req.method === 'POST') {
          const body = JSON.parse(await readBody(req));
          const token = String(body.token ?? url.searchParams.get('token') ?? '');
          if (!validToken(token)) return sendJson(res, 403, { ok: false, error: 'invalid pairing token' });
          const deviceId = String(body.device_id || body.device || '');
          if (!deviceId) return sendJson(res, 400, { ok: false, error: 'device_id required' });
          if (isDeviceRevoked(deviceId)) return sendJson(res, 403, { ok: false, error: 'device was unpaired — new pairing required' });
          registerDevice(deviceId, body.name, body.platform);
          mainBus.emitEvent('device-connected', { deviceId, deviceName: body.name || deviceId, platform: body.platform || 'unknown' });
          const changes: Change[] = Array.isArray(body.changes) ? body.changes : [];
          const result = applyPush(deviceId, changes);
          if (result.applied > 0) {
            try { mainBus.emitEvent('sync-started', { deviceId, deviceName: body.name || deviceId, platform: body.platform || 'unknown' }); } catch {}
          }
          sendJson(res, 200, { ok: true, ...result, serverSeq: maxSeq() });
          return;
        }

        if (path === '/sync/verify' && req.method === 'GET') {
          const token = String(url.searchParams.get('token') ?? '');
          if (!validToken(token)) return sendJson(res, 403, { ok: false, error: 'invalid pairing token' });
          sendJson(res, 200, { ok: true, hub: this.deviceId, tables: verifyChecksums(), lastSeq: maxSeq() });
          return;
        }

        if (path === '/sync/peers' && req.method === 'GET') {
          const token = String(url.searchParams.get('token') ?? '');
          if (!validToken(token)) return sendJson(res, 403, { ok: false, error: 'invalid pairing token' });
          const peers = db.prepare('SELECT device_id, name, last_seen_at, created_at FROM devices ORDER BY created_at').all();
          sendJson(res, 200, { ok: true, hub: this.deviceId, peers });
          return;
        }

        // ── Unpaired joiner endpoints (invite code is the authorization) ──
        if (path === '/sync/invitations/resolve' && req.method === 'POST') {
          const body = JSON.parse(await readBody(req));
          const { resolveInvitation } = await import('./sync/device-requests');
          const inv = resolveInvitation(String(body.code ?? ''));
          if (!inv) return sendJson(res, 404, { ok: false, error: 'Invitation not found or expired' });
          sendJson(res, 200, { ok: true, invitation: inv });
          return;
        }

        if (path === '/sync/join/submit' && req.method === 'POST') {
          const body = JSON.parse(await readBody(req));
          const { resolveInvitation, submitDeviceJoinRequest, getDeviceJoinRequestBy, provisionJoinForDevice } = await import('./sync/device-requests');
          const { getActiveBusinessId } = await import('./ipc-handlers');
          const code = String(body.code ?? '');
          const inv = code ? resolveInvitation(code) : null;
          const bizId = inv?.businessId || body.businessId || body.business_id || String(getActiveBusinessId() || 1);
          const joinerDeviceId = String(body.joinerDeviceId ?? body.joiner_device_id ?? '');
          // Tap-first handoff: capture the device's grant state BEFORE staging
          let preGranted = false;
          try {
            const dev = db.prepare('SELECT status FROM devices WHERE device_id = ?').get(joinerDeviceId) as any;
            const ros = db.prepare('SELECT status FROM roster_devices WHERE uuid = ? OR device_id = ?').get(joinerDeviceId, joinerDeviceId) as any;
            const active = (s: any) => s != null && !['revoked', 'pending', 'offline'].includes(String(s.status || ''));
            preGranted = active(dev) || active(ros);
          } catch { /* schema variance — fall through to the manual flow */ }
          let rec = submitDeviceJoinRequest({ ...body, businessId: bizId });
          if (preGranted && rec.status === 'pending') {
            try {
              provisionJoinForDevice(joinerDeviceId);
              rec = getDeviceJoinRequestBy(String(rec.code ?? ''), joinerDeviceId) ?? rec;
              logger.info('Tap-first auto-approval: request from an already-granted device', { deviceId: joinerDeviceId });
            } catch (e: any) {
              logger.warn('Tap-first auto-approval failed', { deviceId: joinerDeviceId, error: e?.message });
            }
          }
          const payload: any = { ok: true, requestId: rec.requestId, status: rec.status };
          // Approval grants the pairing credential in-band (same as WS path).
          if (rec.status === 'approved') payload.pairingToken = getPairingToken();
          // Explicit connection acknowledgement: the joiner's session tracker
          // uses this to mark the connection real the moment the HTTP call
          // returns, so the joiner does not sit on "Waiting for connection…"
          // while the owner already believes it is connected.
          payload.handshake = buildHandshakeAck(rec, SYNC_PORT);
          sendJson(res, 200, payload);
          return;
        }

        if (path === '/sync/join/status' && req.method === 'POST') {
          const body = JSON.parse(await readBody(req));
          const { getDeviceJoinRequestBy, getDeviceJoinRequestByDevice } = await import('./sync/device-requests');
          const code = String(body.code ?? '');
          const joinerDeviceId = String(body.joinerDeviceId ?? body.joiner_device_id ?? '');

          // Check device ID first to guarantee approval status is found
          // regardless of formatting differences or code-less polls.
          const rec = (joinerDeviceId ? getDeviceJoinRequestByDevice(joinerDeviceId) : null)
            || (code && joinerDeviceId ? getDeviceJoinRequestBy(code, joinerDeviceId) : null);

          const payload: any = { ok: true, record: rec };
          // Approval grants the pairing credential in-band (same as WS path).
          if (rec && rec.status === 'approved') payload.pairingToken = getPairingToken();
          // Explicit connection acknowledgement for the client's session tracker.
          payload.handshake = buildHandshakeAck(rec, SYNC_PORT);
          sendJson(res, 200, payload);
          return;
        }

        sendJson(res, 404, { ok: false, error: 'not found' });
      } catch (e: any) {
        sendJson(res, 500, { ok: false, error: e?.message ?? 'server error' });
      }
    });
    this.server.on('error', (e: any) => {
      logger.error('sync-hub server error', { error: e?.message });
    });
    this.server.listen(port, '0.0.0.0');
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  isRunning(): boolean {
    return this.server !== null;
  }

  getDeviceId(): string {
    return this.deviceId || ensureHubDeviceId();
  }
}