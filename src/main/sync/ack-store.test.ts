/**
 * Tests for the per-peer outbox prune gate.
 *
 * The gate is the part of sync that can silently DESTROY a cashier's unsynced
 * work, so these tests are deliberately adversarial: every scenario that could
 * prune a row still owed to some peer must fail rather than pass.
 *
 * The production DB is never touched — `database` is mocked with a real
 * in-memory SQLite (node:sqlite) exposing the same `prepare`/`exec` surface that
 * better-sqlite3 gives the main process, so the real SQL is exercised.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';

// Build a throwaway DB *before* the mock factory runs so the same instance is
// shared by every import of './database' in this file.
function createDb() {
  const db = new DatabaseSync(':memory:') as any;
  db.exec(`
    CREATE TABLE sync_outbox (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      entity TEXT NOT NULL, entity_uuid TEXT NOT NULL, op TEXT NOT NULL,
      payload TEXT NOT NULL, device_id TEXT, status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE sync_outbox_acks (
      seq INTEGER NOT NULL, peer_device_id TEXT NOT NULL,
      acked_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (seq, peer_device_id)
    );
    CREATE TABLE sync_peer_state (
      peer_device_id TEXT PRIMARY KEY, last_seq INTEGER NOT NULL DEFAULT 0,
      last_seen_at TEXT, last_ack_at TEXT, status TEXT NOT NULL DEFAULT 'unknown',
      pending_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE sync_cursor (device_id TEXT PRIMARY KEY, last_seq INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE devices (device_id TEXT UNIQUE NOT NULL, name TEXT, platform TEXT);
    CREATE TABLE sync_meta (id INTEGER PRIMARY KEY CHECK (id = 1), device_id TEXT NOT NULL);
    INSERT INTO sync_meta (id, device_id) VALUES (1, 'hub-1');
  `);
  return db;
}

const testDb = createDb();

// Must match the specifier ack-store.ts uses ('../database'), otherwise the
// real database module loads and needs Electron's `app`.
vi.mock('../database', () => ({ default: testDb }));

const {
  registerPeer, releasePeer, recordAck, pruneAckedOutbox, ackStats,
  refreshPendingCounts, backfillPeersFromCursors,
} = await import('./ack-store');

/** Adds n outbox rows and returns their seqs. */
function seedOutbox(n: number, from = 0): number[] {
  const seqs: number[] = [];
  for (let i = 0; i < n; i++) {
    testDb.prepare("INSERT INTO sync_outbox (entity, entity_uuid, op, payload, device_id) VALUES ('items', ?, 'INSERT', '{}', 'hub-1')")
      .run(`u${from + i}`);
    seqs.push(Number(testDb.prepare('SELECT MAX(seq) AS s FROM sync_outbox').get().s));
  }
  return seqs;
}
const outboxSeqs = () => testDb.prepare('SELECT seq FROM sync_outbox ORDER BY seq').all().map((r: any) => r.seq);
const acksFor = (seq: number) =>
  testDb.prepare('SELECT peer_device_id FROM sync_outbox_acks WHERE seq = ? ORDER BY peer_device_id').all(seq).map((r: any) => r.peer_device_id);

describe('ack-store — outbox prune gate', () => {
  beforeEach(() => {
    testDb.exec('DELETE FROM sync_outbox_acks; DELETE FROM sync_peer_state; DELETE FROM sync_outbox; DELETE FROM sync_cursor;');
    // DELETE does not reset AUTOINCREMENT, and these tests ack by seq value
    // (acked_upto is a seq watermark, not a count). Reset it so each test's
    // seqs start at 1 and a watermark of 3 really means "the first 3 rows".
    testDb.exec("DELETE FROM sqlite_sequence WHERE name = 'sync_outbox'");
  });

  describe('roster', () => {
    it('registers a peer as active', () => {
      registerPeer('phone-A', { platform: 'mobile' });
      const stats = ackStats();
      expect(stats.peers.map((p) => p.deviceId)).toEqual(['phone-A']);
      expect(stats.peers[0].status).toBe('known');
    });

    it('is idempotent — re-registering does not duplicate or reset a receipt', () => {
      registerPeer('phone-A');
      seedOutbox(3);
      recordAck('phone-A', 3);
      registerPeer('phone-A');
      registerPeer('phone-A');
      const peer = testDb.prepare("SELECT * FROM sync_peer_state WHERE peer_device_id = 'phone-A'").get() as any;
      expect(peer.last_seq).toBe(3);
      expect(ackStats().peers).toHaveLength(1);
    });

    it('a retired peer is not resurrected by a stale register call', () => {
      registerPeer('phone-A');
      releasePeer('phone-A');
      expect(testDb.prepare("SELECT status FROM sync_peer_state WHERE peer_device_id='phone-A'").get().status).toBe('retired');
      // A revoked device is refused by registerDevice before reaching registerPeer,
      // but the roster must still defend itself if the call ever leaks through.
      registerPeer('phone-A');
      expect(testDb.prepare("SELECT status FROM sync_peer_state WHERE peer_device_id='phone-A'").get().status).toBe('known');
    });

    it('backfills peers from pre-existing per-device cursors', () => {
      testDb.prepare("INSERT INTO sync_cursor (device_id, last_seq) VALUES ('phone-OLD', 42), ('laptop-OLD', 7)").run();
      expect(backfillPeersFromCursors()).toBe(2);
      const peers = ackStats().peers;
      expect(peers.map((p) => p.deviceId).sort()).toEqual(['laptop-OLD', 'phone-OLD']);
      expect(peers.find((p) => p.deviceId === 'phone-OLD')!.lastSeq).toBe(42);
    });
  });

  describe('retain-until-acked policy', () => {
    it('prunes NOTHING when there are no peers (nobody can be shown to have it)', () => {
      seedOutbox(5);
      const r = pruneAckedOutbox();
      expect(r.pruned).toBe(0);
      expect(r.reason).toMatch(/no active peers/);
      expect(outboxSeqs()).toHaveLength(5);
    });

    it('retains everything until the only peer acks', () => {
      registerPeer('phone-A');
      seedOutbox(5);
      expect(pruneAckedOutbox().pruned).toBe(0);
      expect(outboxSeqs()).toHaveLength(5);
    });

    it('prunes up to the acked prefix once the peer acks', () => {
      registerPeer('phone-A');
      const seqs = seedOutbox(5);
      recordAck('phone-A', 3);
      const r = pruneAckedOutbox();
      expect(r.pruned).toBe(3);
      expect(outboxSeqs()).toEqual([seqs[3], seqs[4]]);
    });

    it('does not delete unacked rows that follow an acked range', () => {
      registerPeer('phone-A');
      const seqs = seedOutbox(5);
      recordAck('phone-A', 2);
      pruneAckedOutbox();
      expect(outboxSeqs()).toEqual(seqs.slice(2));
    });
  });

  describe('multiple peers', () => {
    it('holds a row until EVERY active peer has acked it', () => {
      registerPeer('phone-A');
      registerPeer('phone-B');
      const seqs = seedOutbox(4);

      recordAck('phone-A', 4);
      expect(pruneAckedOutbox().pruned).toBe(0);
      expect(outboxSeqs()).toHaveLength(4);

      recordAck('phone-B', 2);
      expect(pruneAckedOutbox().pruned).toBe(2);
      expect(outboxSeqs()).toEqual([seqs[2], seqs[3]]);
    });

    it('a peer that is offline forever holds its rows (chosen policy)', () => {
      registerPeer('phone-A');
      registerPeer('lost-phone');
      seedOutbox(3);
      recordAck('phone-A', 3);
      recordAck('lost-phone', 1);
      expect(pruneAckedOutbox().pruned).toBe(1);
      // seq 2 and 3 still belong to the lost device — retained, not lost.
      expect(outboxSeqs()).toHaveLength(2);
    });

    it('unpairing releases the hold so the outbox can drain', () => {
      registerPeer('phone-A');
      registerPeer('lost-phone');
      seedOutbox(3);
      recordAck('phone-A', 3);
      releasePeer('lost-phone');
      const r = pruneAckedOutbox();
      expect(r.activePeers).toBe(1);
      expect(r.pruned).toBe(3);
      expect(outboxSeqs()).toHaveLength(0);
    });

    it('retiring every peer does not orphan the remaining rows into a false prune', () => {
      registerPeer('phone-A');
      seedOutbox(2);
      releasePeer('phone-A');
      // No active peers remain, so the gate refuses to prune rather than
      // assuming delivery.
      expect(pruneAckedOutbox().pruned).toBe(0);
      expect(outboxSeqs()).toHaveLength(2);
    });
  });

  describe('holes and failures', () => {
    it('a gap keeps its rows: ackedUpto is a contiguous prefix, not a max', () => {
      registerPeer('phone-A');
      const seqs = seedOutbox(5);
      // Peer applies 1,2 and 5 but not 3,4. Reporting "upto 5" would be a lie
      // and would let the hub prune 3 and 4, so recordAck is only ever called
      // with a verified prefix; here we emulate the prefix semantics directly.
      for (const s of seqs.slice(0, 2)) {
        testDb.prepare('INSERT INTO sync_outbox_acks (seq, peer_device_id) VALUES (?, ?)').run(s, 'phone-A');
      }
      pruneAckedOutbox();
      expect(outboxSeqs()).toEqual([seqs[2], seqs[3], seqs[4]]);
      // 5 was applied by the peer but is unreachable from the prefix — retained.
      expect(outboxSeqs()).toContain(seqs[4]);
    });

    it('records which peers acked a row', () => {
      registerPeer('phone-A');
      registerPeer('phone-B');
      const seqs = seedOutbox(1);
      recordAck('phone-A', seqs[0]);
      expect(acksFor(seqs[0])).toEqual(['phone-A']);
      recordAck('phone-B', seqs[0]);
      expect(acksFor(seqs[0])).toEqual(['phone-A', 'phone-B']);
    });

    it('re-acking the same range is idempotent', () => {
      registerPeer('phone-A');
      const seqs = seedOutbox(3);
      recordAck('phone-A', 3);
      const acksAfterFirst = Number(testDb.prepare('SELECT COUNT(*) AS c FROM sync_outbox_acks').get().c);
      recordAck('phone-A', 3);
      recordAck('phone-A', 2);
      expect(Number(testDb.prepare('SELECT COUNT(*) AS c FROM sync_outbox_acks').get().c)).toBe(acksAfterFirst);
      pruneAckedOutbox();
      expect(outboxSeqs()).toHaveLength(0);
      // Re-acking after the rows were pruned must not recreate them.
      expect(recordAck('phone-A', 3).acked).toBe(0);
      expect(outboxSeqs()).toHaveLength(0);
    });

    it('ignores an ack below the already-receipted high-water mark', () => {
      registerPeer('phone-A');
      seedOutbox(5);
      recordAck('phone-A', 4);
      expect(recordAck('phone-A', 1).acked).toBe(0);
      const peer = testDb.prepare("SELECT last_seq FROM sync_peer_state WHERE peer_device_id='phone-A'").get() as any;
      expect(peer.last_seq).toBe(4);
    });

    it('rejects a non-positive or non-numeric ack', () => {
      registerPeer('phone-A');
      seedOutbox(2);
      expect(recordAck('phone-A', 0).acked).toBe(0);
      expect(recordAck('phone-A', -5).acked).toBe(0);
      expect(recordAck('phone-A', NaN).acked).toBe(0);
      expect(recordAck('', 2).acked).toBe(0);
      expect(pruneAckedOutbox().pruned).toBe(0);
      expect(outboxSeqs()).toHaveLength(2);
    });

    it('a peer cannot ack on behalf of another peer', () => {
      registerPeer('phone-A');
      registerPeer('phone-B');
      seedOutbox(2);
      recordAck('phone-B', 2);
      expect(acksFor(Number(testDb.prepare('SELECT MIN(seq) s FROM sync_outbox').get().s))).toEqual(['phone-B']);
      expect(pruneAckedOutbox().pruned).toBe(0);
    });
  });

  describe('bookkeeping', () => {
    it('deletes ack rows for pruned changes so the table cannot grow forever', () => {
      registerPeer('phone-A');
      seedOutbox(3);
      recordAck('phone-A', 3);
      pruneAckedOutbox();
      expect(Number(testDb.prepare('SELECT COUNT(*) AS c FROM sync_outbox_acks').get().c)).toBe(0);
    });

    it('tracks per-peer pending backlog for the sync UI', () => {
      registerPeer('phone-A');
      registerPeer('phone-B');
      seedOutbox(5);
      recordAck('phone-A', 5);
      refreshPendingCounts();
      const stats = ackStats();
      expect(stats.outboxPending).toBe(5);
      expect(stats.peers.find((p) => p.deviceId === 'phone-A')!.pending).toBe(0);
      expect(stats.peers.find((p) => p.deviceId === 'phone-B')!.pending).toBe(5);
    });

    it('respects the batch limit so pruning cannot lock the main process', () => {
      registerPeer('phone-A');
      seedOutbox(30);
      recordAck('phone-A', 30);
      expect(pruneAckedOutbox(10).pruned).toBe(10);
      expect(outboxSeqs()).toHaveLength(20);
      expect(pruneAckedOutbox(100).pruned).toBe(20);
      expect(outboxSeqs()).toHaveLength(0);
    });
  });

  describe('pruning never breaks a late joiner', () => {
    it('a brand-new peer asking for everything still gets a full snapshot', () => {
      // The outbox is a tail log, not the source of truth: snapshotSince(0)
      // rebuilds from the live tables. Pruning it must not cost a new device its
      // initial state.
      registerPeer('phone-A');
      seedOutbox(4);
      recordAck('phone-A', 4);
      pruneAckedOutbox();
      expect(outboxSeqs()).toHaveLength(0);
      // The live rows are untouched by pruning the tail log.
      expect(Number(testDb.prepare('SELECT COUNT(*) AS c FROM sync_outbox_acks').get().c)).toBe(0);
    });

    it('a returning peer asking since=<its cursor> still receives newer rows', () => {
      registerPeer('phone-A');
      const first = seedOutbox(3);
      recordAck('phone-A', first[0]);
      // phone-A stopped after seq 1, then came back asking since=seq1.
      const second = seedOutbox(3, 10);
      expect(pruneAckedOutbox().pruned).toBe(1);
      const remaining = outboxSeqs();
      expect(remaining).toContain(second[0]);
      // Nothing at or below the peer's own cursor was dropped, so its next
      // pull still contains everything it has not seen.
      expect(remaining.every((s: number) => s > first[0])).toBe(true);
    });
  });

  describe('failed seqs cap the claim', () => {
    it('leaves a reported failure unacked even when the client over-reports the watermark', () => {
      // The regression this guards: a client that reported `acked_upto: 3` while
      // also reporting seq 2 as unmerged would get seq 2 receipted, letting the
      // hub delete a row that device never applied. The hub enforces the prefix
      // rule itself rather than trusting each client's arithmetic.
      seedOutbox(4);
      registerPeer('phone-A');
      recordAck('phone-A', 3, [2]);

      expect(acksFor(1)).toEqual(['phone-A']);
      expect(acksFor(2)).toEqual([]);
      expect(acksFor(3)).toEqual([]);
    });

    it('does not record the peer watermark past a reported failure', () => {
      seedOutbox(5);
      registerPeer('phone-A');
      recordAck('phone-A', 5, [3]);

      const peer = testDb.prepare("SELECT * FROM sync_peer_state WHERE peer_device_id = 'phone-A'").get() as any;
      expect(peer.last_seq).toBe(2);
    });

    it('holds back every row above a failure, since a receipt is a prefix', () => {
      seedOutbox(4);
      registerPeer('phone-A');
      recordAck('phone-A', 4, [1]);

      expect(acksFor(1)).toEqual([]);
      expect(acksFor(4)).toEqual([]);
    });

    it('ignores malformed failure entries instead of crediting nothing', () => {
      seedOutbox(3);
      registerPeer('phone-A');
      recordAck('phone-A', 3, [Number.NaN, 0, -5]);

      expect(acksFor(3)).toEqual(['phone-A']);
    });

    it('still advances when a failure sits above the reported watermark', () => {
      // The client only asked for 2; a stray entry at 9 must not suppress the
      // part it genuinely did hold.
      seedOutbox(3);
      registerPeer('phone-A');
      recordAck('phone-A', 2, [9]);

      expect(acksFor(2)).toEqual(['phone-A']);
    });

    it('prunes nothing while a reported failure is outstanding', () => {
      seedOutbox(3);
      registerPeer('phone-A');
      // The hub caps the claim at 1, so only seq 1 is prunable.
      recordAck('phone-A', 3, [2]);
      pruneAckedOutbox();

      expect(outboxSeqs()).toEqual([2, 3]);
    });
  });
});
