/**
 * Per-peer delivery receipts and the outbox prune gate.
 *
 * The hub previously had no way to distinguish "transmitted to a peer" from
 * "durably applied by a peer": `handleSyncPull` advanced the client cursor and
 * the LAN pull wrote `sync_cursor` at send time, and `mobile-hub-client` deleted
 * the rows it had pushed. A peer that received a batch and then died (battery,
 * crash, force-quit) lost those changes permanently, because the hub believed
 * they were delivered.
 *
 * This module makes delivery explicit:
 *   - `registerPeer` / `releasePeer` maintain the roster of peers whose
 *     acknowledgement gates pruning.
 *   - `recordAck` turns a client's contiguous `ackedUpto` into per-row receipts
 *     in `sync_outbox_acks`.
 *   - `pruneAckedOutbox` deletes a row only when EVERY active peer has acked
 *     it, so a row is never pruned while any peer could still need it.
 *
 * Policy (chosen deliberately): rows are retained until acked. A peer that is
 * offline forever therefore holds its rows rather than risking silent data
 * loss, and the hold is released when the device is unpaired/revoked — at which
 * point it can no longer reconnect (`isDeviceRevoked`), so it can never ask for
 * those rows again. With no active peers the outbox is retained, matching the
 * pre-existing behaviour where nothing pruned it at all.
 */
import db from '../database';

/** Peers whose unacked rows still block pruning. */
const ACTIVE_PEER_FILTER = "status IS NOT NULL AND status != 'retired'";

/** Registers (or refreshes) a peer that must ack before rows can be pruned. */
export function registerPeer(peerDeviceId: string, opts?: { name?: string; platform?: string }): void {
  if (!peerDeviceId) return;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO sync_peer_state (peer_device_id, last_seq, last_seen_at, status, pending_count)
     VALUES (?, 0, ?, 'known', 0)
     ON CONFLICT(peer_device_id) DO UPDATE SET
       last_seen_at = excluded.last_seen_at,
       status = CASE WHEN sync_peer_state.status = 'retired' THEN 'known' ELSE sync_peer_state.status END`,
  ).run(peerDeviceId, now);
  try {
    if (opts?.platform) {
      db.prepare('UPDATE devices SET platform = ? WHERE device_id = ? AND COALESCE(platform, ?) != ?')
        .run(opts.platform, peerDeviceId, opts.platform, opts.platform);
    }
  } catch { /* devices table shape may differ on older builds */ }
}

/**
 * Stops a peer from gating pruning. Called when a device is unpaired/revoked:
 * it can no longer authenticate, so holding rows for it forever would leak
 * space for a device that can never collect them.
 */
export function releasePeer(peerDeviceId: string): void {
  if (!peerDeviceId) return;
  try {
    db.prepare("UPDATE sync_peer_state SET status = 'retired' WHERE peer_device_id = ?").run(peerDeviceId);
  } catch { /* table may not exist on a pre-v47 install until migrations run */ }
}

/**
 * Records that `peerDeviceId` durably applied every hub change up to and
 * including `ackedUpto`.
 *
 * `ackedUpto` is treated as a contiguous prefix, so every existing outbox row at
 * or below it is materialised as an ack row. Rows above it are untouched.
 *
 * `failedSeqs` caps the claim from below: a receipt is a prefix claim, so a
 * change the peer reported as unmerged holds every row above it back. The hub
 * applies this itself instead of relying on each client to have subtracted them,
 * so a client that over-reports cannot have an undelivered row pruned.
 */
export function recordAck(peerDeviceId: string, ackedUpto: number, failedSeqs: number[] = []): { acked: number } {
  if (!peerDeviceId || !Number.isFinite(ackedUpto) || ackedUpto <= 0) return { acked: 0 };
  const now = new Date().toISOString();

  // Defence in depth: every client also reports the seqs it could not merge, so
  // the hub can enforce the prefix rule itself rather than trusting each
  // client's arithmetic. A receipt is a *prefix* claim, so one reported failure
  // caps the whole claim below it. Without this, a client that reported
  // `acked_upto: 10, failed_seqs: [5]` would still get seq 5 receipted and the
  // row deleted out from under a device that never merged it.
  const failed = failedSeqs
    .map((s) => Math.floor(Number(s)))
    .filter((s) => Number.isFinite(s) && s > 0);
  const lowestFailure = failed.length > 0 ? Math.min(...failed) : Infinity;
  const effective = Math.min(Math.floor(ackedUpto), lowestFailure - 1);

  const info = effective > 0
    ? db.prepare(
      `INSERT OR IGNORE INTO sync_outbox_acks (seq, peer_device_id, acked_at)
       SELECT seq, ?, ? FROM sync_outbox WHERE seq <= ?`,
    ).run(peerDeviceId, now, effective)
    : { changes: 0 };

  const acked = Number(info?.changes ?? 0);
  if (acked > 0 || failed.length > 0) {
    // Only ever advance the watermark, and only to the effective (post-failure)
    // value, so a late or malformed ack cannot walk a peer backwards.
    db.prepare(
      `UPDATE sync_peer_state
          SET last_seq = MAX(COALESCE(last_seq, 0), ?),
              last_ack_at = ?,
              status = 'acked'
        WHERE peer_device_id = ?`,
    ).run(Math.max(0, effective), now, peerDeviceId);
  }
  return { acked };
}

/** Records a peer that is connected but has not acked anything yet. */
export function markPeerSeen(peerDeviceId: string): void {
  if (!peerDeviceId) return;
  try {
    db.prepare('UPDATE sync_peer_state SET last_seen_at = ? WHERE peer_device_id = ?')
      .run(new Date().toISOString(), peerDeviceId);
  } catch { /* best effort */ }
}

/**
 * Highest seq this peer has previously receipted, or 0 if it never has.
 *
 * Callers that derive a new watermark need this as the floor, so a receipt is
 * always an advance from a known value rather than a guess.
 */
export function peerReceiptWatermark(peerDeviceId: string): number {
  if (!peerDeviceId) return 0;
  try {
    const row = db.prepare('SELECT last_seq FROM sync_peer_state WHERE peer_device_id = ?').get(peerDeviceId) as any;
    const n = Number(row?.last_seq);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

/**
 * Deletes outbox rows that every active peer has acknowledged.
 *
 * Returns how many rows were removed. With no active peers nothing is pruned —
 * there is no evidence anyone received the rows, and retaining them is the
 * safe default.
 */
export function pruneAckedOutbox(limit = 500): { pruned: number; activePeers: number; reason?: string } {
  const activePeers = Number(
    (db.prepare(`SELECT COUNT(*) AS c FROM sync_peer_state WHERE ${ACTIVE_PEER_FILTER}`).get() as any)?.c ?? 0,
  );
  if (activePeers === 0) return { pruned: 0, activePeers, reason: 'no active peers — retaining' };

  // A row is prunable when there is no active peer still missing an ack for it.
  const doomed = db.prepare(
    `SELECT o.seq FROM sync_outbox o
      WHERE NOT EXISTS (
        SELECT 1 FROM sync_peer_state p
         WHERE ${ACTIVE_PEER_FILTER}
           AND NOT EXISTS (
             SELECT 1 FROM sync_outbox_acks a
              WHERE a.seq = o.seq AND a.peer_device_id = p.peer_device_id
           )
      )
      ORDER BY o.seq ASC
      LIMIT ?`,
  ).all(limit) as { seq: number }[];

  if (doomed.length === 0) return { pruned: 0, activePeers };

  const ph = doomed.map(() => '?').join(', ');
  const seqs = doomed.map((d) => d.seq);
  const removed = db.prepare(`DELETE FROM sync_outbox WHERE seq IN (${ph})`).run(...seqs);
  // Ack rows are meaningless once the change is gone; without this the table
  // grows without bound even though the outbox stays small.
  db.prepare(`DELETE FROM sync_outbox_acks WHERE seq IN (${ph})`).run(...seqs);

  const pruned = Number(removed?.changes ?? 0);
  refreshPendingCounts();
  return { pruned, activePeers };
}

/** Keeps `pending_count` (the unacked backlog) accurate for the sync UI. */
export function refreshPendingCounts(): void {
  try {
    db.prepare(
      `UPDATE sync_peer_state SET pending_count = (
        SELECT COUNT(*) FROM sync_outbox o
         WHERE NOT EXISTS (
           SELECT 1 FROM sync_outbox_acks a
            WHERE a.seq = o.seq AND a.peer_device_id = sync_peer_state.peer_device_id
         )
      ) WHERE ${ACTIVE_PEER_FILTER}`,
    ).run();
  } catch { /* best effort */ }
}

/** Diagnostics for the Sync Details UI and tests. */
export function ackStats(): {
  outboxPending: number;
  ackedRows: number;
  peers: { deviceId: string; status: string; lastSeq: number; pending: number; lastAckAt: string | null }[];
} {
  const outboxPending = Number((db.prepare('SELECT COUNT(*) AS c FROM sync_outbox').get() as any)?.c ?? 0);
  const ackedRows = Number((db.prepare('SELECT COUNT(*) AS c FROM sync_outbox_acks').get() as any)?.c ?? 0);
  const peers = (db.prepare(
    `SELECT peer_device_id, status, last_seq, pending_count, last_ack_at
       FROM sync_peer_state ORDER BY last_seen_at DESC`,
  ).all() as any[]).map((p) => ({
    deviceId: p.peer_device_id,
    status: p.status,
    lastSeq: Number(p.last_seq ?? 0),
    pending: Number(p.pending_count ?? 0),
    lastAckAt: p.last_ack_at ?? null,
  }));
  return { outboxPending, ackedRows, peers };
}

/**
 * Seeds the roster from the pre-existing per-device `sync_cursor` table so an
 * install that already synced with devices does not suddenly look peerless
 * (which would make every row look unackable and never prune).
 */
export function backfillPeersFromCursors(): number {
  const now = new Date().toISOString();
  try {
    const info = db.prepare(
      `INSERT OR IGNORE INTO sync_peer_state (peer_device_id, last_seq, last_seen_at, status, pending_count)
       SELECT device_id, COALESCE(last_seq, 0), ?, 'legacy', 0 FROM sync_cursor`,
    ).run(now);
    return Number(info?.changes ?? 0);
  } catch {
    return 0;
  }
}
