/**
 * Integration tests for the WebSocket sync path (mobile wsSyncClient ↔ desktop
 * WsSyncServer). Exercises the real server bound to an ephemeral port with
 * real `ws` clients, covering the exact message exchange the phone performs:
 *
 *   - PAIR_REQUEST  → PAIR_RESPONSE (token auth, hubId, pairingToken)
 *   - SYNC_PUSH     → SYNC_ACK (phone-shaped camelCase payload lands in SQLite)
 *   - DATA_CHANGED  : a paired second client is notified the moment a push applies
 *   - SYNC_PULL     → SYNC_CHANGES (mobile-shaped payload comes back with UUIDs)
 *   - checksum skip : bad-checksum change is ACK'd as skipped, never written
 *
 * Uses the same throwaway-DB harness as sync-hub.test.ts; the desktop app DB
 * is never touched.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createHash } from 'crypto';
import WebSocket from 'ws';

vi.mock('electron', () => {
  const tmp = () => process.env.SHEGA_E2E_TMP || process.cwd();
  return {
    app: { isPackaged: false, getPath: () => tmp(), on: () => {}, once: () => {}, emit: () => true, removeListener: () => {} },
    BrowserWindow: { getAllWindows: () => [] },
    ipcMain: { handle: () => {}, on: () => {}, removeHandler: () => {} },
  };
});

describe('Sync hub — WebSocket path (real WsSyncServer + ws clients)', () => {
  let dbm: any;
  let db: any;
  let hubModule: any;
  let server: any;
  let tmp: string;
  let token: string;
  let wsUrl: string;
  const wsPort = 59744;
  let seq = 0;

  const BIZ_UUID = '3f2b6c1e-8f10-4c6d-9c3a-222222222222';
  const CAT_UUID = 'a1c4e7f2-0000-4000-8000-333333333331';

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shega-ws-e2e-'));
    process.env.SHEGA_E2E_TMP = tmp;
    process.chdir(tmp);
    vi.resetModules();
    hubModule = await import('../sync-hub');
    dbm = await import('../database');
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
    hubModule.ensureHubDeviceId();
    token = hubModule.getPairingToken();

    const { WsSyncServer } = await import('./websocket-server');
    server = new WsSyncServer();
    server.start(wsPort);
    wsUrl = `ws://127.0.0.1:${wsPort}`;

    db.prepare(
      `INSERT INTO businesses (businessName, storeName, currency, isDefault, uuid, device_id, row_version, updated_at, is_synced)
       VALUES ('E2E WS', 'E2E WS Store', 'ETB', 1, ?, 'hub', 1, '2026-09-15 08:00:00', 1)`
    ).run(BIZ_UUID);
  });

  afterAll(() => {
    try { server?.stop(); } catch {}
    try { db?.close?.(); } catch {}
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  });

  /** Minimal request/response WS client shaped like the phone's wsSyncClient. */
  function openPhone(deviceId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const pending = new Map<string, (payload: any) => void>();
      const events: any[] = [];
      ws.on('open', () => {
        const send = (type: string, payload: any, requestId?: string) => {
          const id = requestId || `r${++seq}`;
          return new Promise<any>((res) => {
            pending.set(id, (p) => res({ ...p, _requestId: id }));
            ws.send(JSON.stringify({ type, payload, requestId: id }));
          });
        };
        const phone = {
          ws,
          events,
          next: (type: string, timeoutMs = 4000) =>
            new Promise<any>((res, rej) => {
              const t = setTimeout(() => rej(new Error(`timeout waiting for ${type}`)), timeoutMs);
              const onMsg = (raw: Buffer) => {
                const msg = JSON.parse(raw.toString());
                events.push(msg);
                if (msg.type !== type) return;
                clearTimeout(t);
                ws.off('message', onMsg);
                res(msg);
              };
              ws.on('message', onMsg);
            }),
          send,
          close: () => ws.close(),
        };
        resolve(phone);
      });
      ws.on('error', reject);
    });
  }

  async function pair(phone: any, deviceId: string): Promise<void> {
    const p = phone.next('PAIR_RESPONSE');
    phone.send('PAIR_REQUEST', { device_id: deviceId, name: deviceId, token });
    const resp = await p;
    expect(resp.payload.success).toBe(true);
    expect(resp.payload.hubId).toBeTruthy();
  }

  it('PAIR_REQUEST authenticates and returns hubId + pairing token', async () => {
    const phone = await openPhone('ws-phone-A');
    await pair(phone, 'ws-phone-A');
    expect(phone.events[0].payload.schemaVersion).toBe(21);
    phone.close();
  });

  it('SYNC_PUSH applies a phone-shaped change; SYNC_ACK reports it', async () => {
    const phone = await openPhone('ws-phone-B');
    await pair(phone, 'ws-phone-B');
    const ackP = phone.next('SYNC_ACK');
    phone.send('SYNC_PUSH', {
      changes: [{
        entity: 'categories',
        entity_uuid: CAT_UUID,
        op: 'INSERT',
        client_seq: 41,
        payload: {
          businessId: BIZ_UUID,
          name: 'WS Snacks',
          is_deleted: 0,
          uuid: CAT_UUID,
          created_at: '2026-09-15T10:00:00.000Z',
          updated_at: '2026-09-15T10:00:00.000Z',
        },
      }],
      client_seq: 41,
    }, 'rpush1');
    const ack = await ackP;
    expect(ack.payload.applied).toBe(1);
    expect(ack.payload.results[0]).toMatchObject({ client_seq: 41, status: 'applied' });

    const row = db.prepare('SELECT * FROM categories WHERE uuid = ?').get(CAT_UUID) as any;
    expect(row).toBeTruthy();
    expect(row.name).toBe('WS Snacks');
    expect(row.device_id).toBe('ws-phone-B');
    phone.close();
  });

  it('A paired second client receives DATA_CHANGED when a push applies', async () => {
    const observer = await openPhone('ws-phone-C');
    await pair(observer, 'ws-phone-C');

    const producer = await openPhone('ws-phone-D');
    await pair(producer, 'ws-phone-D');

    const changed = observer.next('DATA_CHANGED');
    const ackP = producer.next('SYNC_ACK');
    const otherUuid = 'a1c4e7f2-0000-4000-8000-444444444444';
    producer.send('SYNC_PUSH', {
      changes: [{
        entity: 'categories',
        entity_uuid: otherUuid,
        op: 'INSERT',
        client_seq: 50,
        payload: {
          businessId: BIZ_UUID,
          name: 'WS Drinks',
          is_deleted: 0,
          uuid: otherUuid,
          created_at: '2026-09-15T11:00:00.000Z',
          updated_at: '2026-09-15T11:00:00.000Z',
        },
      }],
      client_seq: 50,
    }, 'rpush2');
    await ackP;

    const dc = await changed;
    expect(dc.type).toBe('DATA_CHANGED');
    expect(typeof dc.payload.serverSeq).toBe('number');
    expect(dc.payload.serverSeq).toBeGreaterThan(0);
    observer.close();
    producer.close();
  });

  it('SYNC_PULL since=0 returns the snapshot in mobile shape (UUID businessId)', async () => {
    const phone = await openPhone('ws-phone-E');
    await pair(phone, 'ws-phone-E');
    const changesP = phone.next('SYNC_CHANGES');
    phone.send('SYNC_PULL', { since: 0 }, 'rpull1');
    const resp = await changesP;
    expect(resp.payload.snapshot).toBe(true);
    const cat = (resp.payload.changes ?? []).find((c: any) => c.entity_uuid === CAT_UUID);
    expect(cat).toBeTruthy();
    expect(cat.payload.businessId).toBe(BIZ_UUID);
    phone.close();
  });

  it('Delta pull after the snapshot returns only newer rows', async () => {
    const phone = await openPhone('ws-phone-F');
    await pair(phone, 'ws-phone-F');
    const changesP = phone.next('SYNC_CHANGES');
    phone.send('SYNC_PULL', { since: 999999 }, 'rpull2');
    const resp = await changesP;
    const dup = (resp.payload.changes ?? []).find((c: any) => c.entity_uuid === CAT_UUID);
    expect(dup).toBeUndefined();
    phone.close();
  });

  function phoneChecksum(change: {
    entity: string;
    entity_uuid: string;
    op: string;
    payload: Record<string, any>;
  }): string {
    const canonical = `${change.entity}|${change.entity_uuid}|${change.op}|${JSON.stringify(change.payload)}`;
    return createHash('sha256').update(canonical).digest('hex');
  }

  it('A change with a phone-computed checksum is accepted (applied, not skipped)', async () => {
    const phone = await openPhone('ws-phone-CHK');
    await pair(phone, 'ws-phone-CHK');
    const ackP = phone.next('SYNC_ACK');
    const goodUuid = 'a1c4e7f2-0000-4000-8000-666666666666';
    const payload = {
      businessId: BIZ_UUID,
      name: 'WS Checked Snacks',
      is_deleted: 0,
      uuid: goodUuid,
      created_at: '2026-09-15T12:30:00.000Z',
      updated_at: '2026-09-15T12:30:00.000Z',
    };
    const checksum = phoneChecksum({ entity: 'categories', entity_uuid: goodUuid, op: 'INSERT', payload });
    phone.send(
      'SYNC_PUSH',
      {
        changes: [{ entity: 'categories', entity_uuid: goodUuid, op: 'INSERT', client_seq: 70, checksum, payload }],
        client_seq: 70,
      },
      'rpush-chk'
    );
    const ack = await ackP;
    expect(ack.payload.skipped).toBe(0);
    expect(ack.payload.applied).toBe(1);
    expect(ack.payload.results[0].status).toBe('applied');
    const row = db.prepare('SELECT * FROM categories WHERE uuid = ?').get(goodUuid) as any;
    expect(row).toBeTruthy();
    expect(row.name).toBe('WS Checked Snacks');
    phone.close();
  });

  it('Phone-shaped UPDATE subscriptions with businessId null lands on default business (was NOT NULL error)', async () => {
    const phone = await openPhone('ws-phone-SUB');
    await pair(phone, 'ws-phone-SUB');
    const ackP = phone.next('SYNC_ACK');
    const subUuid = 'a1c4e7f2-0000-4000-8000-777777777777';
    const payload = {
      plan: 'premium',
      planId: null,
      tier: 'premium',
      status: 'active',
      businessId: null, // phone rows predating the multi-business model
      startedAt: '2026-09-15T09:00:00.000Z',
      expiresAt: '2026-09-16T09:00:00.000Z',
      trialStartedAt: null,
      trialEndsAt: null,
      isTrial: 0,
      autoRenew: 1,
      currency: 'ETB',
      is_deleted: 0,
      uuid: subUuid,
      created_at: '2026-09-15T08:00:00.000Z',
      updated_at: '2026-09-15T09:00:00.000Z',
    };
    const checksum = phoneChecksum({ entity: 'subscriptions', entity_uuid: subUuid, op: 'UPDATE', payload });
    phone.send(
      'SYNC_PUSH',
      {
        changes: [
          { entity: 'subscriptions', entity_uuid: subUuid, op: 'UPDATE', client_seq: 80, checksum, payload },
        ],
        client_seq: 80,
      },
      'rpush-sub'
    );
    const ack = await ackP;
    expect(ack.payload.skipped).toBe(0);
    expect(ack.payload.applied).toBe(1);
    expect(ack.payload.results[0].status).toBe('applied');
    const row = db.prepare('SELECT * FROM subscriptions WHERE uuid = ?').get(subUuid) as any;
    expect(row).toBeTruthy();
    expect(row.tier).toBe('premium');
    expect(row.status).toBe('active');
    // businessId must be resolved to the hub's default business, not null
    expect(Number(row.businessId)).toBe(db.prepare("SELECT id FROM businesses WHERE isDefault = 1 LIMIT 1").get()?.id);
    phone.close();
  });

  it('A phone re-push of the same subscriptions row with null businessId is idempotent (no NOT NULL error)', async () => {
    const phone = await openPhone('ws-phone-SUB2');
    await pair(phone, 'ws-phone-SUB2');
    const ackP = phone.next('SYNC_ACK');
    const subUuid = 'a1c4e7f2-0000-4000-8000-777777777777';
    const payload = {
      plan: 'premium',
      planId: null,
      tier: 'premium',
      status: 'expired',
      businessId: null,
      startedAt: '2026-09-15T09:00:00.000Z',
      expiresAt: '2026-09-16T09:00:00.000Z',
      trialStartedAt: null,
      trialEndsAt: null,
      isTrial: 0,
      autoRenew: 1,
      currency: 'ETB',
      is_deleted: 0,
      uuid: subUuid,
      created_at: '2026-09-15T08:00:00.000Z',
      updated_at: '2026-09-15T10:00:00.000Z',
    };
    const checksum = phoneChecksum({ entity: 'subscriptions', entity_uuid: subUuid, op: 'UPDATE', payload });
    phone.send(
      'SYNC_PUSH',
      {
        changes: [
          { entity: 'subscriptions', entity_uuid: subUuid, op: 'UPDATE', client_seq: 81, checksum, payload },
        ],
        client_seq: 81,
      },
      'rpush-sub2'
    );
    const ack = await ackP;
    expect(ack.payload.skipped).toBe(0);
    expect(ack.payload.applied).toBe(1);
    expect(ack.payload.results[0].status).toBe('applied');
    const row = db.prepare('SELECT * FROM subscriptions WHERE uuid = ?').get(subUuid) as any;
    expect(row).toBeTruthy();
    expect(row.status).toBe('expired');
    expect(Number(row.businessId)).toBe(db.prepare("SELECT id FROM businesses WHERE isDefault = 1 LIMIT 1").get()?.id);
    phone.close();
  });

  it('A change with an invalid checksum is ACK skipped, never written', async () => {
    const phone = await openPhone('ws-phone-G');
    await pair(phone, 'ws-phone-G');
    const ackP = phone.next('SYNC_ACK');
    const badUuid = 'a1c4e7f2-0000-4000-8000-555555555555';
    phone.send('SYNC_PUSH', {
      changes: [{
        entity: 'categories',
        entity_uuid: badUuid,
        op: 'INSERT',
        client_seq: 60,
        checksum: 'deadbeef',
        payload: {
          businessId: BIZ_UUID,
          name: 'Should Not Land',
          is_deleted: 0,
          uuid: badUuid,
          created_at: '2026-09-15T12:00:00.000Z',
          updated_at: '2026-09-15T12:00:00.000Z',
        },
      }],
      client_seq: 60,
    }, 'rpush3');
    const ack = await ackP;
    expect(ack.payload.skipped).toBe(1);
    expect(ack.payload.results[0].status).toBe('skipped');
    const row = db.prepare('SELECT * FROM categories WHERE uuid = ?').get(badUuid) as any;
    expect(row).toBeUndefined();
    phone.close();
  });
});