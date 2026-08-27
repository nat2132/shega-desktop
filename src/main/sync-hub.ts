import { createServer, IncomingMessage, ServerResponse } from 'http';
import { createHash, randomUUID, randomBytes } from 'crypto';
import { networkInterfaces } from 'os';
import db from './database';
import { logger } from './logger';

export const SYNC_PORT = 5757;

export const SHARED_TABLES = [
  'categories',
  'items',
  'item_packs',
  'sales',
  'debt_payments',
  'returns',
  'expenses',
  'adjustments',
  'customers'
] as const;

export type SyncEntity = (typeof SHARED_TABLES)[number];

interface Change {
  entity: SyncEntity;
  entity_uuid: string;
  op: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;
  device_id?: string;
  client_seq?: number;
  checksum?: string;
}

/** Canonical checksum of a change payload (3.7). Clients send it; hub verifies. */
export function changeChecksum(change: {
  entity: string;
  entity_uuid: string;
  op: string;
  payload: Record<string, any>;
}): string {
  const canonical = `${change.entity}|${change.entity_uuid}|${change.op}|${JSON.stringify(change.payload)}`;
  return createHash('sha256').update(canonical).digest('hex');
}

let columnCache: Record<string, string[]> = {};
function columnsOf(entity: string): string[] {
  if (!columnCache[entity]) {
    columnCache[entity] = (db.prepare(`PRAGMA table_info(${entity})`).all() as any[]).map((c: any) => c.name);
  }
  return columnCache[entity];
}

export function ensureHubDeviceId(): string {
  const row = db.prepare('SELECT device_id, pairing_token FROM sync_meta WHERE id = 1').get() as any;
  if (row?.device_id) return row.device_id;
  const id = randomUUID();
  const token = generatePairingToken();
    db.prepare('INSERT OR REPLACE INTO sync_meta (id, device_id, pairing_token, schema_version) VALUES (1, ?, ?, 21)').run(id, token);
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

export function getLanAddress(port = SYNC_PORT): string | null {
  for (const ifaces of Object.values(networkInterfaces())) {
    for (const iface of ifaces ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return `http://${iface.address}:${port}`;
      }
    }
  }
  return null;
}

function registerDevice(deviceId: string, name?: string): void {
  const existing = db.prepare('SELECT id FROM devices WHERE device_id = ?').get(deviceId) as any;
  if (existing) {
    db.prepare('UPDATE devices SET last_seen_at = ? WHERE device_id = ?').run(new Date().toISOString(), deviceId);
    return;
  }
  db.prepare('INSERT INTO devices (device_id, name, last_seen_at) VALUES (?, ?, ?)').run(
    deviceId,
    name || deviceId.slice(0, 8),
    new Date().toISOString()
  );
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

function cleanPayload(entity: string, payload: Record<string, any>): Record<string, any> {
  const cols = columnsOf(entity);
  const clean: Record<string, any> = {};
  for (const k of Object.keys(payload)) {
    if (cols.includes(k)) clean[k] = payload[k];
  }
  return clean;
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
  return db.prepare(`SELECT * FROM ${entity} WHERE uuid = ?`).get(uuid) as any;
}

export interface ApplyResult {
  applied: number;
  conflicts: number;
  skipped: number;
  pending: number;
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
  const data = cleanPayload(entity, payload);

  if (op === 'DELETE') {
    const existing = existingByUuid(entity, entity_uuid);
    if (existing) {
      db.prepare(`UPDATE ${entity} SET is_deleted = 1, deleted_at = COALESCE(?, deleted_at) WHERE uuid = ?`).run(
        payload.deleted_at ?? new Date().toISOString(),
        entity_uuid
      );
    }
    return 'applied';
  }

  const existing = existingByUuid(entity, entity_uuid);
  if (!existing) {
    const insertData: Record<string, any> = { ...data };
    insertData.uuid = entity_uuid;
    insertData.device_id = deviceId;
    insertData.updated_at = insertData.updated_at ?? new Date().toISOString();
    let pending = false;
    if ((entity === 'sales' || entity === 'returns') && insertData.itemId != null) {
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
    const cols = columnsOf(entity).filter((c) => c in insertData);
    const placeholders = cols.map(() => '?').join(', ');
    const values = cols.map((c) => insertData[c]);
    db.prepare(`INSERT INTO ${entity} (${cols.join(', ')}) VALUES (${placeholders})`).run(...values);
    recordRef(deviceId, entity, insertData);
    return pending ? 'pending' : 'applied';
  }

  // Row exists -> LWW.
  const incoming = { ...data, uuid: entity_uuid, updated_at: data.updated_at ?? new Date().toISOString() };
  if (lwwWins(incoming, existing)) {
    const updateData: Record<string, any> = { ...data };
    delete updateData.id;
    updateData.device_id = deviceId;
    const cols = columnsOf(entity).filter((c) => c in updateData && c !== 'id' && c !== 'uuid');
    if (cols.length) {
      const sets = cols.map((c) => `${c} = ?`).join(', ');
      const values = cols.map((c) => updateData[c]);
      db.prepare(`UPDATE ${entity} SET ${sets} WHERE uuid = ?`).run(...values, entity_uuid);
    }
    recordRef(deviceId, entity, data);
    return 'applied';
  }
  logSync(deviceId, entity, entity_uuid, op, 'conflict_rejected');
  return 'conflict';
}

function applyPush(deviceId: string, changes: Change[]): ApplyResult {
  const result: ApplyResult = { applied: 0, conflicts: 0, skipped: 0, pending: 0 };
  const doApply = db.transaction((list: Change[]) => {
    for (const change of list) {
      try {
        // 3.7 integrity: reject a change whose checksum does not match its payload.
        if (change.checksum) {
          const expected = changeChecksum(change);
          if (change.checksum !== expected) {
            result.skipped += 1;
            logSync(deviceId, change.entity, change.entity_uuid, change.op, `checksum_mismatch`);
            continue;
          }
        }
        const existing = existingByUuid(change.entity, change.entity_uuid);
        const data = cleanPayload(change.entity, change.payload);
        if (existing && change.op === 'INSERT' && lwwWins(existing, { ...data, uuid: change.entity_uuid })) {
          result.conflicts += 1;
          continue;
        }
        const status = applyChange(deviceId, change);
        if (status === 'applied') result.applied += 1;
        else if (status === 'conflict') result.conflicts += 1;
        else if (status === 'pending') result.pending += 1;
        else result.skipped += 1;
      } catch (e: any) {
        result.skipped += 1;
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
  return result;
}

export function snapshotSince(since: number) {
  const seq = maxSeq();
  if (since <= 0) {
    const changes: any[] = [];
    for (const entity of SHARED_TABLES) {
      const rows = db.prepare(`SELECT * FROM ${entity} WHERE is_deleted = 0`).all() as any[];
      for (const r of rows) {
        changes.push({ entity, entity_uuid: r.uuid, op: 'INSERT', payload: r, device_id: r.device_id });
      }
    }
    return { changes, lastSeq: seq, snapshot: true };
  }
  const rows = db
    .prepare('SELECT * FROM sync_outbox WHERE seq > ? ORDER BY seq ASC LIMIT 1000')
    .all(since) as any[];
  const changes = rows.map((r) => {
    let payload = {};
    try {
      payload = JSON.parse(r.payload);
    } catch {}
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
    const rows = db.prepare(`SELECT * FROM ${entity} WHERE is_deleted = 0`).all() as any[];
    for (const r of rows) {
      const payload: Record<string, any> = {};
      for (const k of Object.keys(r)) payload[k] = r[k];
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
      .prepare(`SELECT uuid, updated_at, row_version, is_deleted FROM ${entity} WHERE is_deleted = 0`)
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
            schemaVersion: 21,
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
          registerDevice(deviceId, body.name);
          sendJson(res, 200, { ok: true, hub: this.deviceId });
          return;
        }

        if (path === '/sync/pull' && req.method === 'GET') {
          const token = String(url.searchParams.get('token') ?? '');
          if (!validToken(token)) return sendJson(res, 403, { ok: false, error: 'invalid pairing token' });
          const deviceId = String(url.searchParams.get('device') || '');
          if (!deviceId) return sendJson(res, 400, { ok: false, error: 'device required' });
          registerDevice(deviceId);
          const force = takeResyncRequest(deviceId);
          const since = Number(url.searchParams.get('since') || '0');
          const data = snapshotSince(force || !Number.isFinite(since) ? 0 : since);
          db.prepare('INSERT OR REPLACE INTO sync_cursor (device_id, last_seq, updated_at) VALUES (?, ?, ?)').run(
            deviceId,
            data.lastSeq,
            new Date().toISOString()
          );
          sendJson(res, 200, { ok: true, ...data, forceResync: force, hub: this.deviceId });
          return;
        }

        if (path === '/sync/push' && req.method === 'POST') {
          const body = JSON.parse(await readBody(req));
          const token = String(body.token ?? url.searchParams.get('token') ?? '');
          if (!validToken(token)) return sendJson(res, 403, { ok: false, error: 'invalid pairing token' });
          const deviceId = String(body.device_id || body.device || '');
          if (!deviceId) return sendJson(res, 400, { ok: false, error: 'device_id required' });
          registerDevice(deviceId);
          const changes: Change[] = Array.isArray(body.changes) ? body.changes : [];
          const result = applyPush(deviceId, changes);
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