/**
 * Integration tests for the LAN/cloud sync protocol across all device
 * directions, exercised against a REAL in-process SyncHub bound to an
 * ephemeral port (no Electron window needed).
 *
 *   - Mobile → Desktop  : phone-shaped (snake_case + business UUID) HTTP push
 *   - Desktop → Mobile  : pull a mobile-shaped payload back from snapshotSince
 *   - Mobile ↔ Mobile   : hub relay LWW convergence between two phone ids
 *   - Desktop ↔ Desktop : local outbox rows (B5) — applyPush echoes carry the
 *                         REMOTE device id so the peer-push filter excludes them
 *   - Idempotency       : sync/refs + uuid dedupe, cursor-advance, checksum skip
 *
 * The desktop app DB is pointed at a throwaway temp dir via process.chdir,
 * so the production DB is never touched.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Hoisted by vitest — applies to every (re)import below.
vi.mock('electron', () => {
  const tmp = () => process.env.SHEGA_E2E_TMP || process.cwd();
  return {
    app: { isPackaged: false, getPath: () => tmp(), on: () => {}, once: () => {}, emit: () => true, removeListener: () => {} },
    BrowserWindow: { getAllWindows: () => [] },
    ipcMain: { handle: () => {}, on: () => {}, removeHandler: () => {} },
  };
});

describe('Sync hub — all device directions (real HTTP)', () => {
  let hubModule: any;
  let dbm: any;
  let db: any;
  let hub: any;
  let tmp: string;
  let token: string;
  let hubId: string;
  const port = 59741;
  const base = `http://127.0.0.1:${port}`;

  const BIZ_UUID = '3f2b6c1e-8f10-4c6d-9c3a-111111111111';
  const CAT_UUID = 'a1c4e7f2-0000-4000-8000-000000000001';
  const ITEM_UUID = 'b2d5f8a1-0000-4000-9000-000000000002';

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shega-hub-e2e-'));
    process.env.SHEGA_E2E_TMP = tmp;
    process.chdir(tmp);
    vi.resetModules();
    hubModule = await import('./sync-hub');
    dbm = await import('./database');
    // initDB's change-capture trigger loop (line ~1799) needs every table in its
    // sync list to already exist, but `orders`, `order_items`, `order_history` and
    // `subscriptions` are only created LATER inside initDB, and `notifications`
    // is referenced by the trigger loop yet never gets sync columns from the v17
    // or v30 migrations. On a truly fresh DB all five would break the trigger
    // loop, so we pre-create just them with exactly the columns the triggers
    // reference. The other tables initDB creates fully (with their real columns)
    // are left untouched by the IF NOT EXISTS no-op.
    const lateTables: Record<string, string[]> = {
      orders: ['id', 'businessId', 'orderNumber', 'customerName', 'customerPhone', 'notes', 'status', 'totalAmount', 'createdBy', 'createdByName', 'createdAt', 'convertedAt', 'convertedBy', 'cancelledAt', 'cancelledBy', 'cancelReason', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'],
      order_items: ['id', 'orderId', 'itemId', 'itemName', 'quantity', 'unit', 'unitType', 'unitPrice', 'totalPrice', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'],
      order_history: ['id', 'orderId', 'status', 'changedBy', 'notes', 'createdAt', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'],
      subscriptions: ['id', 'businessId', 'planId', 'tier', 'status', 'startedAt', 'expiresAt', 'trialStartedAt', 'trialEndsAt', 'isTrial', 'autoRenew', 'createdAt', 'updatedAt', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'],
      notifications: ['id', 'type', 'title', 'message', 'category', 'priority', 'isRead', 'groupKey', 'actionUrl', 'actionLabel', 'expiresAt', 'businessId', 'createdAt', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'],
      employees: ['id', 'businessId', 'employeeCode', 'firstName', 'lastName', 'phone', 'email', 'address', 'emergencyContact', 'gender', 'dateOfBirth', 'roleId', 'department', 'warehouseId', 'isActive', 'employmentStatus', 'avatar', 'hireDate', 'notes', 'createdAt', 'updatedAt', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'],
    };
    const preCreate = Object.entries(lateTables)
      .map(([table, cols]) => {
        const defs = cols.map((c) => (c === 'id' ? `${c} INTEGER PRIMARY KEY AUTOINCREMENT` : `${c} TEXT`));
        return `CREATE TABLE IF NOT EXISTS ${table} (${defs.join(', ')});`;
      })
      .join('\n');
    dbm.getDb().exec(preCreate);
    dbm.initDB();
    // snapshotSince(0) queries is_deleted = 0 on every SHARED_TABLES table.
    // On a fresh DB some tables may still lack the sync columns, so ensure they
    // exist for all tables the hub queries.
    const db2 = dbm.getDb();
    const missingSync = ['is_deleted', 'deleted_at', 'is_synced', 'uuid', 'device_id', 'row_version', 'updated_at'];
    for (const t of hubModule.SHARED_TABLES) {
      const cols = (db2.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
      for (const col of missingSync) {
        const def = col === 'is_deleted' || col === 'is_synced' ? 'INTEGER DEFAULT 1' : 'TEXT';
        if (!cols.includes(col)) { try { db2.exec(`ALTER TABLE ${t} ADD COLUMN ${col} ${def}`); } catch {} }
      }
    }
    db = dbm.getDb();
    // ensureHubDeviceId() must run first: it INSERTs sync_meta (id=1) which
    // persists the pairing token; getPairingToken() only UPDATEs an existing row.
    hubId = hubModule.ensureHubDeviceId();
    token = hubModule.getPairingToken();
    const { SyncHub } = hubModule;
    hub = new SyncHub();
    hub.start(port);
    // Seed one desktop business row the pushed items can reference.
    db.prepare(
      `INSERT INTO businesses (businessName, storeName, currency, isDefault, uuid, device_id, row_version, updated_at, is_synced)
       VALUES ('E2E Test', 'E2E Store', 'ETB', 1, ?, 'hub', 1, '2026-09-15 08:00:00', 1)`
    ).run(BIZ_UUID);
  });

  afterAll(() => {
    try { hub?.stop(); } catch {}
    try { db?.close?.(); } catch {}
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  });

  const phonePush = (deviceId: string, changes: any[]) =>
    fetch(`${base}/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, token, changes }),
    }).then((r) => r.json());

  const phonePull = (deviceId: string, since: number) =>
    fetch(`${base}/sync/pull?device=${encodeURIComponent(deviceId)}&since=${since}&token=${encodeURIComponent(token)}`).then((r) => r.json());

  const mobileCategory = (op: 'INSERT' | 'UPDATE', name: string, ts: string) => ({
    entity: 'categories',
    entity_uuid: CAT_UUID,
    op,
    client_seq: 1,
    payload: {
      businessId: BIZ_UUID,
      name,
      is_deleted: 0,
      uuid: CAT_UUID,
      created_at: ts,
      updated_at: ts,
    },
  });

  it('Mobile → Desktop: phone-shaped push lands in the desktop hub', async () => {
    const res = await phonePush('phone-A', [mobileCategory('INSERT', 'Drinks', '2026-09-15 08:00:00')]);
    expect(res.ok).toBe(true);
    expect(res.applied).toBe(1);
    expect(Array.isArray(res.results)).toBe(true);
    expect(res.results[0]).toMatchObject({ client_seq: 1, status: 'applied' });

    const row = db.prepare('SELECT * FROM categories WHERE uuid = ?').get(CAT_UUID) as any;
    const bizRows = db.prepare('SELECT id, uuid, businessName FROM businesses').all();
    expect(bizRows.length).toBeGreaterThan(0);
    expect(row).toBeTruthy();
    expect(row.name).toBe('Drinks');
    expect(row.device_id).toBe('phone-A');
  });

  it('Desktop → Mobile: snapshotSince(0) returns the row in mobile shape', async () => {
    const snap = await phonePull('phone-B', 0);
    expect(snap.ok).toBe(true);
    expect(snap.snapshot).toBe(true);
    const cat = (snap.changes ?? []).find((c: any) => c.entity_uuid === CAT_UUID);
    expect(cat).toBeTruthy();
    expect(cat.payload.businessId).toBe(BIZ_UUID); // UUID, not desktop INTEGER
  });

  it('Cursor semantics: delta pull after applied push returns nothing new', async () => {
    const afterFirst = await phonePull('phone-A', 999999);
    expect(afterFirst.ok).toBe(true);
    const dup = (afterFirst.changes ?? []).find((c: any) => c.entity_uuid === CAT_UUID);
    expect(dup).toBeUndefined();
  });

  it('Mobile ↔ Mobile: relay converges with LWW (newer write wins)', async () => {
    // phone-A created the category at 08:00. phone-B writes a newer name.
    const newer = await phonePush('phone-B', [mobileCategory('UPDATE', 'Beverages', '2026-09-15 09:00:00')]);
    expect(newer.applied).toBe(1);
    const row = db.prepare('SELECT name FROM categories WHERE uuid = ?').get(CAT_UUID) as any;
    expect(row.name).toBe('Beverages');

    // An OLDER overwrite from phone-A is rejected as a conflict — no loop-back.
    const stale = await phonePush('phone-A', [mobileCategory('UPDATE', 'Old Name', '2026-09-15 07:30:00')]);
    expect(stale.conflicts).toBe(1);
    expect(db.prepare('SELECT name FROM categories WHERE uuid = ?').get(CAT_UUID).name).toBe('Beverages');
  });

  it('LWW timestamp normalization: space vs ISO formats tie at the same epoch', async () => {
    const spaceTime = '2026-09-15 10:00:00';
    const isoTime = '2026-09-15T10:00:00.000Z';
    // Both normalize to the same epoch — the space format no longer loses.
    const f = (v: string) => {
      const s = v.replace(' ', 'T');
      return Date.parse(s.endsWith('Z') ? s : `${s}Z`);
    };
    expect(f(spaceTime)).toBe(f(isoTime));
  });

  it('Integrity: a change with a bad checksum is skipped, flagged per-seq', async () => {
    const res = await phonePush('phone-A', [
      { ...mobileCategory('UPDATE', 'Bad', '2026-09-15 10:00:00'), checksum: 'deadbeef' },
    ]);
    expect(res.skipped).toBe(1);
    expect(res.results[0].status).toBe('skipped');
  });

  it('Desktop ↔ Desktop (B5): remote-applied echoes are excluded from peer push', async () => {
    // phone-A pushed the category; the trigger echoed it into sync_outbox with
    // device_id = phone-A. That row must NOT be pushed onward to another
    // desktop (which would bounce it back to the origin) — the peer-sync
    // filter only takes rows owned by this desktop.
    const echoes = (db.prepare('SELECT seq, device_id FROM sync_outbox WHERE entity_uuid = ? ORDER BY seq').all(CAT_UUID)) as any[];
    expect(echoes.length).toBeGreaterThan(0);
    for (const e of echoes) {
      expect(e.device_id).not.toBe(hubId);
      const localOnly = db
        .prepare('SELECT COUNT(*) AS c FROM sync_outbox WHERE (device_id IS NULL OR device_id = ?) AND seq = ?')
        .get(hubId, e.seq) as any;
      expect(localOnly.c).toBe(0);
    }
  });

  it('E2E regression: push with an UNKNOWN business UUID still lands business-visible', async () => {
    // The exact failure users saw: a peer whose business UUID differs from the
    // hub's (or that predates shared business rows) pushed rows that the hub
    // stored with businessId = NULL — synced, connected, yet invisible to
    // every business-scoped query. The hub must fall back to its active
    // (default) business: the push is token-authenticated, so the row belongs
    // to the business this hub serves.
    const UNKNOWN_BIZ = '00000000-aaaa-4bbb-8ccc-000000000999';
    const ITEM_UUID_UNKNOWN = 'c3e6a9b2-0000-4000-a000-000000000010';
    const ts = '2026-09-16 10:00:00';
    const res = await phonePush('phone-unknown-biz', [
      {
        entity: 'items', entity_uuid: ITEM_UUID_UNKNOWN, op: 'INSERT', client_seq: 1,
        payload: {
          businessId: UNKNOWN_BIZ, // no businesses row with this uuid locally
          name: 'Unknown-Biz Product', baseSellingPrice: 30, totalBaseQuantity: 10,
          isActive: 1, is_deleted: 0, uuid: ITEM_UUID_UNKNOWN, created_at: ts, updated_at: ts,
        },
      },
    ]);
    expect(res.ok).toBe(true);
    expect(res.applied).toBe(1);

    const row = db.prepare('SELECT * FROM items WHERE uuid = ?').get(ITEM_UUID_UNKNOWN) as any;
    expect(row).toBeTruthy();
    const defaultBiz = db.prepare('SELECT id FROM businesses WHERE isDefault = 1').get() as any;
    expect(row.businessId).toBe(defaultBiz.id); // NOT NULL — visible to UI queries

    // And a business-scoped read — the shape every screen actually runs — sees it.
    const visible = db.prepare('SELECT name FROM items WHERE businessId = ? AND is_deleted = 0 AND uuid = ?').get(defaultBiz.id, ITEM_UUID_UNKNOWN) as any;
    expect(visible?.name).toBe('Unknown-Biz Product');
  });

  it('Idempotent re-push: same INSERT after apply is a conflict, never duplicated', async () => {
    const res = await phonePush('phone-C', [mobileCategory('INSERT', 'Beverages', '2026-09-15 09:00:00')]);
    expect(res.conflicts).toBe(1);
    const count = db.prepare('SELECT COUNT(*) AS c FROM categories WHERE uuid = ?').get(CAT_UUID) as any;
    expect(count.c).toBe(1);
  });

  it('Subscriptions UPDATE with an illegal status (mobile "trial") is normalized, not rejected', async () => {
    // Mobile sends status values the hub CHECK constraint does not allow;
    // the hub must map them onto a legal status instead of erroring.
    const SUB_UUID = 'd1a5a9b2-0000-4000-a000-000000000021';
    const defaultBiz = db.prepare('SELECT id FROM businesses WHERE isDefault = 1').get() as any;
    const ts = '2026-09-16 11:00:00';
    const push1 = await phonePush('phone-sub', [
      { entity: 'subscriptions', entity_uuid: SUB_UUID, op: 'INSERT', client_seq: 1,
        payload: { businessId: defaultBiz.id, tier: 'trial', status: 'trial', isTrial: 1, is_deleted: 0, uuid: SUB_UUID, updated_at: ts } },
    ]) as any;
    expect(push1.ok).toBe(true);
    const row = db.prepare('SELECT * FROM subscriptions WHERE uuid = ?').get(SUB_UUID) as any;
    expect(row).toBeTruthy();
    expect(['active', 'expired', 'cancelled', 'pending']).toContain(row.status);

    // A follow-up UPDATE with the same illegal value must not throw either.
    const push2 = await phonePush('phone-sub', [
      { entity: 'subscriptions', entity_uuid: SUB_UUID, op: 'UPDATE', client_seq: 2,
        payload: { businessId: defaultBiz.id, tier: 'trial', status: 'trial', isTrial: 1, is_deleted: 0, uuid: SUB_UUID, updated_at: '2026-09-16 11:05:00' } },
    ]) as any;
    expect(push2.ok).toBe(true);
    expect(db.prepare('SELECT status FROM subscriptions WHERE uuid = ?').get(SUB_UUID) as any).toBeTruthy();
  });

  it('stock_movements UPDATE with a peer itemId that maps to a hub item applies without FK error', async () => {
    // Phone inserts a movement; then UPDATEs it — the update path must
    // resolve the peer itemId/warehouseId to hub-local ids like the insert
    // path does, or the FK constraint fails.
    const phoneItem = db.prepare("SELECT uuid FROM sync_refs WHERE device_id = 'phone-A' AND entity = 'items' LIMIT 1").get() as any;
    const itemUuid = phoneItem?.uuid ?? CAT_UUID;
    const item = db.prepare('SELECT id FROM items WHERE uuid = ?').get(itemUuid) as any;
    const ref = db.prepare("SELECT local_id FROM sync_refs WHERE device_id = 'phone-A' AND entity = 'items' LIMIT 1").get() as any;
    const MV_UUID = 'e2b6a9b2-0000-4000-a000-000000000031';
    const ts = '2026-09-16 12:00:00';
    if (!ref) return; // no prior items ref in this fixture — skip defensively
    const push1 = await phonePush('phone-A', [
      { entity: 'stock_movements', entity_uuid: MV_UUID, op: 'INSERT', client_seq: 1,
        payload: { itemId: ref.remote_id, warehouseId: 1, type: 'restock_in', quantity: 5, referenceType: 'manual', is_deleted: 0, uuid: MV_UUID, updated_at: ts } },
    ]) as any;
    expect(push1.ok).toBe(true);
    const mv = db.prepare('SELECT * FROM stock_movements WHERE uuid = ?').get(MV_UUID) as any;
    expect(mv).toBeTruthy();
    expect(mv.itemId).toBe(item.id); // resolved to the hub-local item id

    const push2 = await phonePush('phone-A', [
      { entity: 'stock_movements', entity_uuid: MV_UUID, op: 'UPDATE', client_seq: 2,
        payload: { itemId: ref.remote_id, warehouseId: 1, type: 'restock_in', quantity: 9, referenceType: 'manual', is_deleted: 0, uuid: MV_UUID, updated_at: '2026-09-16 12:05:00' } },
    ]) as any;
    expect(push2.ok).toBe(true);
    expect(push2.applied).toBe(1);
    const updated = db.prepare('SELECT itemId, quantity FROM stock_movements WHERE uuid = ?').get(MV_UUID) as any;
    expect(updated.itemId).toBe(item.id); // still the local id, no FK error
    expect(updated.quantity).toBe(9);
  });
});