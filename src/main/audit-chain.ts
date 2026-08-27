import { createHash } from 'crypto';
import type Database from 'better-sqlite3';

export const AUDIT_GENESIS = 'GENESIS';

export interface AuditEntry {
  id: number;
  businessId: number | null;
  action: string;
  entityType: string;
  entityId: number | null;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string | null;
  changedById: number | null;
  description: string | null;
  createdAt: string | null;
  prev_hash: string | null;
  hash: string | null;
}

export function auditHash(prev: string, r: AuditEntry): string {
  const c = createHash('sha256');
  c.update(
    `${prev}|${r.id}|${r.action}|${r.entityType}|${r.entityId ?? ''}|${r.fieldName ?? ''}|${r.oldValue ?? ''}|${r.newValue ?? ''}|${r.changedBy ?? ''}|${r.description ?? ''}|${r.createdAt ?? ''}`
  );
  return c.digest('hex');
}

/**
 * Insert an audit entry with a chained hash. Runs inside a transaction so the
 * previous-hash read and the insert are atomic.
 */
export function insertAudit(db: InstanceType<typeof Database>, entry: Omit<AuditEntry, 'id' | 'prev_hash' | 'hash'>): number {
  const insert = db.prepare(
    `INSERT INTO audit_logs (businessId, action, entityType, entityId, fieldName, oldValue, newValue, changedBy, changedById, description, createdAt)
     VALUES (@businessId, @action, @entityType, @entityId, @fieldName, @oldValue, @newValue, @changedBy, @changedById, @description, @createdAt)`
  );
  const tx = db.transaction(() => {
    const prev = (db.prepare('SELECT hash FROM audit_logs ORDER BY id DESC LIMIT 1').get() as any)?.hash ?? AUDIT_GENESIS;
    const info = insert.run({ ...entry, createdAt: entry.createdAt ?? new Date().toISOString() });
    const id = Number(info.lastInsertRowid);
    const row = db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(id) as AuditEntry;
    const h = auditHash(prev, row);
    db.prepare('UPDATE audit_logs SET hash = ?, prev_hash = ? WHERE id = ?').run(h, prev, id);
    return id;
  });
  return tx();
}

/** Verify the full chain. Returns { ok, count, brokenAt } where brokenAt is the first bad id or null. */
export function verifyAuditChain(db: InstanceType<typeof Database>): { ok: boolean; count: number; brokenAt: number | null } {
  const rows = db.prepare('SELECT * FROM audit_logs ORDER BY id ASC').all() as AuditEntry[];
  let prev = AUDIT_GENESIS;
  for (const r of rows) {
    const expected = auditHash(prev, r);
    if (r.prev_hash !== prev || r.hash !== expected) {
      return { ok: false, count: rows.length, brokenAt: r.id };
    }
    prev = r.hash ?? prev;
  }
  return { ok: true, count: rows.length, brokenAt: null };
}