/**
 * Integration test for the hub's LAN delivery-receipt route (`POST /sync/ack`)
 * over a REAL in-process SyncHub bound to an ephemeral port.
 *
 * Why the shim instead of the real `database` module: better-sqlite3 is compiled
 * against Electron's ABI, so it cannot be loaded by the Node that vitest runs
 * under (that is why `sync-hub.test.ts` is excluded in vitest.config.ts). This
 * test provides a node:sqlite-backed stand-in with the same prepare/exec surface,
 * so the HTTP path, the token gate and the prune gate are all genuinely
 * exercised rather than mocked away.
 *
 * `ack-store.test.ts` covers the gate's edge cases; this proves the route a real
 * phone calls actually reaches it.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getPath: () => process.cwd(),
    on: () => {}, once: () => {}, emit: () => true, removeListener: () => {},
  },
  BrowserWindow: { getAllWindows: () => [] },
  ipcMain: { handle: () => {}, on: () => {}, removeHandler: () => {} },
}));

/** Minimal better-sqlite3-compatible facade over node:sqlite. */
function createShim() {
  const raw = new DatabaseSync(':memory:') as any;
  return {
    exec: (sql: string) => raw.exec(sql),
    prepare: (sql: string) => raw.prepare(sql),
    pragma(p: string) {
      if (/=/.test(p)) { raw.exec(`PRAGMA ${p}`); return; }
      return raw.prepare(`PRAGMA ${p}`).all();
    },
    transaction(fn: any) {
      return (...args: any[]) => {
        raw.exec('BEGIN');
        try { const r = fn(...args); raw.exec('COMMIT'); return r; }
        catch (e) { try { raw.exec('ROLLBACK'); } catch { /* already unwound */ } throw e; }
      };
    },
    close: () => raw.close(),
    name: ':memory:',
  };
}

const shim = createShim();

vi.mock('./database', () => ({
  default: shim,
  getDb: () => shim,
  initDB: () => { /* schema pre-created below */ },
}));

describe('Sync hub — LAN delivery receipt (POST /sync/ack)', () => {
  let hubModule: any;
  let hub: any;
  let token: string;
  const port = 59777;
  const base = `http://127.0.0.1:${port}`;

  // Response.json() is Promise<unknown> without the DOM lib, so the body is
  // asserted field-by-field and typed `any` at the boundary.
  const post = (p: string, body: any): Promise<{ status: number; body: any }> =>
    fetch(`${base}${p}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(async (r) => ({ status: r.status, body: (await r.json().catch(() => null)) as any }));

  const outboxSeqs = () => shim.prepare('SELECT seq FROM sync_outbox ORDER BY seq').all().map((r: any) => r.seq);
  const peerRow = (id: string) => shim.prepare('SELECT * FROM sync_peer_state WHERE peer_device_id = ?').get(id) as any;

  beforeAll(async () => {
    shim.exec(`
      CREATE TABLE sync_meta (id INTEGER PRIMARY KEY CHECK (id = 1), device_id TEXT NOT NULL,
        pairing_token TEXT, schema_version INTEGER);
      INSERT INTO sync_meta (id, device_id, pairing_token) VALUES (1, 'hub-1', 'ABC234');

      CREATE TABLE devices (id INTEGER PRIMARY KEY AUTOINCREMENT, device_id TEXT UNIQUE NOT NULL,
        name TEXT, pairing_token TEXT, businessId INTEGER, last_seen_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP, platform TEXT, uuid TEXT,
        status TEXT DEFAULT 'active');

      CREATE TABLE roster_devices (id INTEGER PRIMARY KEY AUTOINCREMENT, businessId INTEGER, name TEXT,
        platform TEXT, status TEXT, isPrimary INTEGER, uuid TEXT, device_id TEXT, lastSeenAt TEXT,
        updated_at TEXT, is_deleted INTEGER DEFAULT 0);

      CREATE TABLE sync_outbox (seq INTEGER PRIMARY KEY AUTOINCREMENT, entity TEXT NOT NULL,
        entity_uuid TEXT NOT NULL, op TEXT NOT NULL, payload TEXT NOT NULL, device_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP, status TEXT DEFAULT 'pending');

      CREATE TABLE sync_outbox_acks (seq INTEGER NOT NULL, peer_device_id TEXT NOT NULL,
        acked_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (seq, peer_device_id));

      CREATE TABLE sync_peer_state (peer_device_id TEXT PRIMARY KEY, last_seq INTEGER NOT NULL DEFAULT 0,
        last_seen_at TEXT, last_ack_at TEXT, status TEXT NOT NULL DEFAULT 'unknown',
        pending_count INTEGER NOT NULL DEFAULT 0);

      CREATE TABLE sync_cursor (device_id TEXT PRIMARY KEY, last_seq INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP);

      CREATE TABLE sync_log (id INTEGER PRIMARY KEY AUTOINCREMENT, device_id TEXT, entity TEXT,
        entity_uuid TEXT, op TEXT, detail TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    `);

    vi.resetModules();
    hubModule = await import('./sync-hub');
    token = hubModule.getPairingToken();
    const { SyncHub } = hubModule;
    hub = new SyncHub();
    hub.start(port);
  });

  afterAll(() => {
    try { hub?.stop(); } catch {}
    try { shim.close(); } catch {}
  });

  beforeEach(() => {
    shim.exec('DELETE FROM sync_outbox; DELETE FROM sync_outbox_acks; DELETE FROM sync_peer_state; DELETE FROM devices; DELETE FROM sync_cursor;');
    try { shim.exec("DELETE FROM sqlite_sequence WHERE name = 'sync_outbox'"); } catch {}
  });

  const seedOutbox = (n: number) => {
    for (let i = 0; i < n; i++) {
      shim.prepare("INSERT INTO sync_outbox (entity, entity_uuid, op, payload, device_id) VALUES ('items', ?, 'INSERT', ?, 'hub-1')")
        .run(`u${i}`, JSON.stringify({ name: `item-${i}` }));
    }
    return outboxSeqs();
  };
  /**
   * Registers a peer through the same function the /sync/push and WS pair
   * routes call. Going through the route would require the full SHARED_TABLES
   * schema in this shim; what is under test is that `registerDevice` puts the
   * peer in the roster and that /sync/ack honours it.
   */
  const register = (deviceId: string) => {
    hubModule.registerDevice(deviceId, deviceId, 'mobile');
    return Promise.resolve({ status: 200, body: { ok: true } });
  };

  it('serves the route and the receipt tables exist', async () => {
    const res = await post('/sync/ack', { device_id: 'phone-A', token, acked_upto: 1 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects a receipt with an invalid pairing token', async () => {
    seedOutbox(3);
    const res = await post('/sync/ack', { device_id: 'phone-A', token: 'not-the-token', acked_upto: 3 });
    expect(res.status).toBe(403);
    expect(outboxSeqs()).toHaveLength(3);
  });

  it('rejects a receipt with no device id', async () => {
    seedOutbox(2);
    expect((await post('/sync/ack', { token, acked_upto: 2 })).status).toBe(400);
    expect(outboxSeqs()).toHaveLength(2);
  });

  it('rejects a non-positive or malformed watermark', async () => {
    seedOutbox(2);
    expect((await post('/sync/ack', { device_id: 'phone-A', token, acked_upto: 0 })).status).toBe(400);
    expect((await post('/sync/ack', { device_id: 'phone-A', token, acked_upto: -3 })).status).toBe(400);
    expect((await post('/sync/ack', { device_id: 'phone-A', token, acked_upto: 'abc' })).status).toBe(400);
    expect((await post('/sync/ack', { device_id: 'phone-A', token, acked_upto: {} })).status).toBe(400);
    expect(outboxSeqs()).toHaveLength(2);
  });

  it('does not prune when no peer has ever registered', async () => {
    const seqs = seedOutbox(4);
    const res = await post('/sync/ack', { device_id: 'ghost', token, acked_upto: 4 });
    expect(res.status).toBe(200);
    // A device that never paired cannot be trusted to have applied anything, so
    // its receipt does not license deletion.
    expect(res.body.activePeers).toBe(0);
    expect(outboxSeqs()).toEqual(seqs);
  });

  it('registers the peer, then prunes only what it acked', async () => {
    const seqs = seedOutbox(5);
    const reg = await register('phone-A');
    expect(reg.status).toBe(200);
    expect(peerRow('phone-A')).toBeTruthy();
    expect(peerRow('phone-A').status).not.toBe('retired');

    let res = await post('/sync/ack', { device_id: 'phone-A', token, acked_upto: 2 });
    expect(res.body.pruned).toBe(2);
    expect(outboxSeqs()).toEqual(seqs.slice(2));

    res = await post('/sync/ack', { device_id: 'phone-A', token, acked_upto: 5 });
    expect(res.body.pruned).toBe(3);
    expect(outboxSeqs()).toEqual([]);
  });

  it('holds rows until every registered peer has acked', async () => {
    const seqs = seedOutbox(3);
    await register('phone-A');
    await register('phone-B');
    expect(Number(shim.prepare('SELECT COUNT(*) AS c FROM sync_peer_state').get().c)).toBe(2);

    expect((await post('/sync/ack', { device_id: 'phone-A', token, acked_upto: 3 })).body.pruned).toBe(0);
    expect(outboxSeqs()).toEqual(seqs);
    expect((await post('/sync/ack', { device_id: 'phone-B', token, acked_upto: 3 })).body.pruned).toBe(3);
    expect(outboxSeqs()).toEqual([]);
  });

  it('reports failed seqs without letting them be pruned', async () => {
    const seqs = seedOutbox(3);
    await register('phone-A');
    const res = await post('/sync/ack', { device_id: 'phone-A', token, acked_upto: 1, failed_seqs: [seqs[1], seqs[2]] });
    expect(res.body.pruned).toBe(1);
    expect(outboxSeqs()).toEqual(seqs.slice(1));
  });

  it('tolerates a receipt whose watermark is beyond the last row', async () => {
    await register('phone-A');
    seedOutbox(2);
    const res = await post('/sync/ack', { device_id: 'phone-A', token, acked_upto: 99999 });
    expect(res.status).toBe(200);
    expect(outboxSeqs()).toEqual([]);
  });

  it('a revoked device cannot receipt its way to a prune', async () => {
    const seqs = seedOutbox(3);
    await register('phone-A');
    await register('phone-B');
    shim.prepare("UPDATE devices SET status = 'revoked' WHERE device_id = 'phone-B'").run();
    const res = await post('/sync/ack', { device_id: 'phone-B', token, acked_upto: 3 });
    expect(res.status).toBe(403);
    expect(outboxSeqs()).toEqual(seqs);
  });

  it('re-registering a device does not reset its receipt high-water mark', async () => {
    await register('phone-A');
    seedOutbox(4);
    await post('/sync/ack', { device_id: 'phone-A', token, acked_upto: 4 });
    expect(peerRow('phone-A').last_seq).toBe(4);
    await register('phone-A');
    expect(peerRow('phone-A').last_seq).toBe(4);
  });
});
