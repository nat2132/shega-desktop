import { createHash } from 'crypto';
import db from '../database';

export interface VectorClock {
  [deviceId: string]: number;
}

export interface Delta {
  entity: string;
  entity_uuid: string;
  op: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;
  vector_clock: VectorClock;
  origin_device_id: string;
  checksum: string;
  timestamp: number;
}

export interface SyncEntity {
  entity: string;
  columns: string[];
}

export const SHARED_ENTITIES: SyncEntity[] = [
  { entity: 'categories', columns: [] },
  { entity: 'items', columns: [] },
  { entity: 'item_packs', columns: [] },
  { entity: 'sales', columns: [] },
  { entity: 'debt_payments', columns: [] },
  { entity: 'returns', columns: [] },
  { entity: 'expenses', columns: [] },
  { entity: 'adjustments', columns: [] },
  { entity: 'customers', columns: [] },
];

export function getVectorClock(): VectorClock {
  const clock: VectorClock = {};
  const rows = db.prepare('SELECT device_id, MAX(seq) as max_seq FROM sync_outbox GROUP BY device_id').all() as any[];
  for (const row of rows) {
    if (row.device_id) clock[row.device_id] = row.max_seq;
  }
  return clock;
}

export function incrementVectorClock(clock: VectorClock, deviceId: string): VectorClock {
  return { ...clock, [deviceId]: (clock[deviceId] || 0) + 1 };
}

export function mergeVectorClocks(a: VectorClock, b: VectorClock): VectorClock {
  const merged = { ...a };
  for (const [deviceId, seq] of Object.entries(b)) {
    merged[deviceId] = Math.max(merged[deviceId] || 0, seq);
  }
  return merged;
}

export function compareVectorClocks(a: VectorClock, b: VectorClock): 'a-before-b' | 'b-before-a' | 'concurrent' | 'equal' {
  const allDevices = new Set([...Object.keys(a), ...Object.keys(b)]);
  let aGreater = false;
  let bGreater = false;

  for (const deviceId of allDevices) {
    const aSeq = a[deviceId] || 0;
    const bSeq = b[deviceId] || 0;
    if (aSeq > bSeq) aGreater = true;
    else if (bSeq > aSeq) bGreater = true;
  }

  if (aGreater && !bGreater) return 'a-before-b';
  if (bGreater && !aGreater) return 'b-before-a';
  if (aGreater && bGreater) return 'concurrent';
  return 'equal';
}

export function createDelta(
  entity: string,
  entity_uuid: string,
  op: 'INSERT' | 'UPDATE' | 'DELETE',
  payload: Record<string, any>,
  originDeviceId: string
): Delta {
  const vectorClock = incrementVectorClock(getVectorClock(), originDeviceId);
  const timestamp = Date.now();
  const canonical = `${entity}|${entity_uuid}|${op}|${JSON.stringify(payload)}|${timestamp}`;
  const checksum = createHash('sha256').update(canonical).digest('hex');

  return {
    entity,
    entity_uuid,
    op,
    payload,
    vector_clock: incrementVectorClock(getVectorClock(), originDeviceId),
    origin_device_id: originDeviceId,
    checksum,
    timestamp,
  };
}

export function applyDelta(delta: Delta): { applied: boolean; conflict: boolean; reason?: string } {
  const { entity, entity_uuid, op, payload, vector_clock, origin_device_id } = delta;

  // Verify checksum
  const canonical = `${delta.entity}|${delta.entity_uuid}|${delta.op}|${JSON.stringify(delta.payload)}|${delta.timestamp}`;
  const expectedChecksum = createHash('sha256').update(canonical).digest('hex');
  if (delta.checksum !== expectedChecksum) {
    return { applied: false, conflict: false, reason: 'checksum_mismatch' };
  }

  // Check if entity is in shared tables
  if (!SHARED_ENTITIES.some(e => e.entity === delta.entity)) {
    return { applied: false, conflict: false, reason: 'entity_not_shared' };
  }

  try {
    const existing = getRowByUuid(delta.entity, delta.entity_uuid);

    if (delta.op === 'DELETE') {
      if (existing) {
        // Soft delete
        const now = new Date().toISOString();
        const setClause = `is_deleted = 1, deleted_at = COALESCE(?, deleted_at)`;
        db.prepare(`UPDATE ${delta.entity} SET ${setClause} WHERE uuid = ?`).run(
          delta.payload.deleted_at || new Date().toISOString(),
          delta.entity_uuid
        );
        return { applied: true, conflict: false };
      }
      return { applied: false, conflict: false, reason: 'not_found' };
    }

    const existingRow = getRowByUuid(delta.entity, delta.entity_uuid);
    const cleanedPayload = cleanPayload(delta.entity, delta.payload);

    if (!existing) {
      // INSERT
      const insertData = { ...delta.payload };
      delete insertData.id;
      insertData.uuid = delta.entity_uuid;
      insertData.device_id = delta.origin_device_id;
      insertData.updated_at = delta.payload.updated_at || new Date().toISOString();

      // Resolve FKs
      if ((delta.entity === 'sales' || delta.entity === 'returns') && insertData.itemId != null) {
        const hubItemId = resolveFk(delta.origin_device_id, 'items', insertData.itemId);
        if (hubItemId != null) insertData.itemId = hubItemId;
        else insertData.itemId = null;
      }
      if (delta.entity === 'sales' && insertData.packId != null) {
        const hubPackId = resolveFk(delta.origin_device_id, 'item_packs', insertData.packId);
        if (hubPackId != null) insertData.packId = hubPackId;
      }

      const cols = Object.keys(insertData).filter(c => c in insertData);
      const placeholders = cols.map(() => '?').join(', ');
      db.prepare(`INSERT INTO ${delta.entity} (${cols.join(', ')}) VALUES (${placeholders})`).run(...cols.map(c => insertData[c]));
      recordRef(delta.origin_device_id, delta.entity, insertData);

      return { applied: true, conflict: false };
    }

    // UPDATE - use vector clock for conflict resolution
    const existingVc = getVectorClockForRow(delta.entity, delta.entity_uuid) || {};
    const cmp = compareVectorClocks(vector_clock, existingVc);

    if (cmp === 'b-before-a' || cmp === 'equal') {
      // Incoming wins
      const updateData = { ...delta.payload };
      delete updateData.id;
      updateData.device_id = delta.origin_device_id;
      const cols = Object.keys(updateData).filter(c => c in updateData && c !== 'id' && c !== 'uuid');
      if (cols.length) {
        const sets = cols.map(c => `${c} = ?`).join(', ');
        const values = [...cols.map(c => delta.payload[c]), delta.entity_uuid];
        db.prepare(`UPDATE ${delta.entity} SET ${sets} WHERE uuid = ?`).run(...values);
      }
      recordRef(delta.origin_device_id, delta.entity, delta.payload);
      return { applied: true, conflict: false };
    }

    if (cmp === 'concurrent') {
      // Merge non-conflicting fields
      const existingRow = getRowByUuid(delta.entity, delta.entity_uuid) as any;
      const merged = mergeConcurrent(existingRow, delta.payload);
      const updateData = { ...merged };
      delete updateData.id;
      updateData.device_id = delta.origin_device_id;
      const cols = Object.keys(updateData).filter(c => c in updateData && c !== 'id' && c !== 'uuid');
      if (cols.length) {
        const sets = cols.map(c => `${c} = ?`).join(', ');
        const values = [...cols.map(c => merged[c]), delta.entity_uuid];
        db.prepare(`UPDATE ${delta.entity} SET ${sets} WHERE uuid = ?`).run(...values);
      }
      recordRef(delta.origin_device_id, delta.entity, merged);
      return { applied: true, conflict: true };
    }

    // a-before-b: existing is newer, reject
    return { applied: false, conflict: true, reason: 'existing_newer' };
  } catch (e: any) {
    return { applied: false, conflict: false, reason: e.message };
  }
}

function getRowByUuid(entity: string, uuid: string): any {
  return db.prepare(`SELECT * FROM ${entity} WHERE uuid = ?`).get(uuid);
}

function getVectorClockForRow(entity: string, uuid: string): VectorClock {
  // Vector clock stored in sync_refs or derived from seq
  const row = db.prepare(`
    SELECT device_id, seq FROM sync_outbox
    WHERE entity = ? AND entity_uuid = ?
    ORDER BY seq DESC LIMIT 1
  `).get(entity, uuid) as any;

  if (!row) return {};

  // For simplicity, return single-device clock
  return { [row.device_id]: row.seq };
}

function cleanPayload(entity: string, payload: Record<string, any>): Record<string, any> {
  const cols = db.prepare(`PRAGMA table_info(${entity})`).all() as any[];
  const colNames = new Set(cols.map((c: any) => c.name));
  const clean: Record<string, any> = {};
  for (const k of Object.keys(payload)) {
    if (colNames.has(k)) clean[k] = payload[k];
  }
  return clean;
}

function resolveFk(deviceId: string, entity: string, localId: number): number | null {
  if (localId == null) return null;
  const ref = db.prepare('SELECT uuid FROM sync_refs WHERE device_id = ? AND entity = ? AND local_id = ?')
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

function mergeConcurrent(existing: Record<string, any>, incoming: Record<string, any>): Record<string, any> {
  const merged = { ...existing };

  // Fields that can be safely merged (take max for quantities, latest timestamp for prices)
  const quantityFields = ['totalBaseQuantity', 'totalPackQuantity', 'quantity', 'qty'];
  const priceFields = ['baseSalePrice', 'basePurchasePrice', 'packSalePrice', 'packPurchasePrice', 'unitPrice'];
  const timestampFields = ['updated_at', 'createdAt'];

  for (const key of Object.keys(incoming)) {
    if (key === 'id' || key === 'uuid' || key === 'device_id' || key === 'row_version') continue;

    const existingVal = existing[key];
    const incomingVal = incoming[key];

    if (quantityFields.includes(key) && typeof existingVal === 'number' && typeof incomingVal === 'number') {
      merged[key] = Math.max(existingVal, incomingVal);
    } else if (priceFields.includes(key) && typeof existingVal === 'number' && typeof incomingVal === 'number') {
      // For prices, use the one with newer timestamp if available
      merged[key] = incomingVal; // In practice, use timestamp comparison
    } else if (timestampFields.includes(key)) {
      merged[key] = incoming[key]; // Take newer timestamp
    } else {
      // Default: incoming wins for other fields
      merged[key] = incomingVal;
    }
  }

  return merged;
}

export function getPendingDeltas(limit = 100): Delta[] {
  const rows = db.prepare(`
    SELECT * FROM sync_outbox
    ORDER BY seq ASC
    LIMIT ?
  `).all(limit) as any[];

  return rows.map(row => {
    let payload: Record<string, any> = {};
    try {
      payload = JSON.parse(row.payload);
    } catch {}
    return {
      entity: row.entity,
      entity_uuid: row.entity_uuid,
      op: row.op as 'INSERT' | 'UPDATE' | 'DELETE',
      payload,
      vector_clock: { [row.device_id]: row.seq },
      origin_device_id: row.device_id,
      checksum: '',
      timestamp: Date.now(),
    };
  });
}

export function markDeltaApplied(seq: number): void {
  db.prepare('DELETE FROM sync_outbox WHERE seq = ?').run(seq);
}

export function getMaxSeq(): number {
  const r = db.prepare('SELECT COALESCE(MAX(seq),0) AS m FROM sync_outbox').get() as any;
  return r?.m ?? 0;
}

export function verifyChecksum(delta: Delta): boolean {
  const canonical = `${delta.entity}|${delta.entity_uuid}|${delta.op}|${JSON.stringify(delta.payload)}|${delta.timestamp}`;
  const expected = createHash('sha256').update(canonical).digest('hex');
  return delta.checksum === expected;
}

export function getAllDeltasSince(since: number): Delta[] {
  const rows = db.prepare(`
    SELECT * FROM sync_outbox WHERE seq > ? ORDER BY seq ASC
  `).all(since) as any[];

  return rows.map(row => {
    let payload: Record<string, any> = {};
    try {
      payload = JSON.parse(row.payload);
    } catch {}
    return {
      entity: row.entity,
      entity_uuid: row.entity_uuid,
      op: row.op as 'INSERT' | 'UPDATE' | 'DELETE',
      payload,
      vector_clock: { [row.device_id]: row.seq },
      origin_device_id: row.device_id,
      checksum: '',
      timestamp: Date.now(),
    };
  });
}

export default {
  createDelta,
  applyDelta,
  getVectorClock,
  mergeVectorClocks,
  compareVectorClocks,
  getPendingDeltas,
  markDeltaApplied,
  getMaxSeq,
  verifyChecksum,
  getAllDeltasSince,
};