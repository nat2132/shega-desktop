/**
 * Desktop client for a Mobile POS Hub.
 *
 * A phone running Shega Mobile can act as the main connector (POS Hub):
 * it listens on TCP port 5759 and speaks newline-delimited JSON messages:
 *   PAIR_REQUEST / PAIR_RESPONSE, SYNC_PUSH / SYNC_ACK, SYNC_PULL / SYNC_CHANGES.
 *
 * This module lets the desktop discover such a phone (mDNS platform=mobile)
 * and treat it as a first-class hub: pair with the phone's pairing code,
 * push the desktop outbox, and pull the phone's changes into the desktop's
 * normal LWW apply path. Platform-symmetric: desktop ↔ mobile either way.
 */

import * as net from 'net';
import * as crypto from 'crypto';
import db from '../database';
import { logger } from '../logger';
import { ensureHubDeviceId, applyRemoteChanges, persistPeerDevice } from '../sync-hub';
import { recordAck, pruneAckedOutbox, peerReceiptWatermark } from './ack-store';
import { answerHubChallenge, getDesktopJoinerHandle } from './desktop-join-credentials';
import { computeReceiptWatermark, unconfirmedCap, type ApplyOutcome, type ReceiptedChange } from '@shega/shared';
import type { DiscoveredService } from './discovery';

/**
 * Builds the SYNC_PUSH payload from the desktop's own outbox rows.
 *
 * Exported for tests because the `client_seq` contract is load-bearing: the hub
 * echoes per-change outcomes keyed by `client_seq`, and `appliedSeqs` (which
 * decides which rows may be pruned) is built by matching on it. A change without
 * it comes back as `client_seq: null`, every match misses, and unmerged rows —
 * `pending` ones especially — would be treated as applied and then deleted.
 */
export function buildPushChanges(hubId: string): { changes: any[]; pushedSeqs: number[] } {
  const outbox = db.prepare(
    'SELECT seq, entity, entity_uuid, op, row_id, device_id FROM sync_outbox WHERE device_id = ? OR device_id IS NULL ORDER BY seq ASC LIMIT 500'
  ).all(hubId) as any[];
  const changes: any[] = [];
  const pushedSeqs: number[] = [];
  for (const r of outbox) {
    let payload: any = {};
    if (r.op === 'DELETE') {
      payload = { id: r.row_id ?? null, uuid: r.entity_uuid, deleted_at: new Date().toISOString() };
    } else if (r.row_id != null) {
      try {
        const row = db.prepare(`SELECT * FROM ${r.entity} WHERE id = ?`).get(r.row_id) as any;
        if (row) payload = row;
      } catch { /* table may not exist on this build */ }
    }
    if (r.op !== 'DELETE' && Object.keys(payload).length === 0) continue;
    changes.push({
      entity: r.entity,
      entity_uuid: r.entity_uuid,
      op: r.op,
      payload,
      device_id: hubId,
      client_seq: r.seq,
    });
    pushedSeqs.push(r.seq);
  }
  return { changes, pushedSeqs };
}

/**
 * Classifies pushed rows by the hub's per-change `results` and returns the
 * highest seq this phone may be credited with holding.
 *
 * Two bounds apply, and both matter:
 *   - `computeReceiptWatermark` stops at the first change the hub did not merge,
 *     so a `pending` row (FK ordering) keeps occupying its slot in the watermark
 *     and cannot be pruned. An unmatched result counts as not-merged: unknown is
 *     not applied.
 *   - `unconfirmedCap` additionally refuses to claim past rows that exist in the
 *     outbox but were never pushed to *this* peer. The desktop outbox is shared
 *     across devices, so seq numbers this phone never saw belong to other
 *     authors' rows; crediting through them would let the hub delete a row the
 *     phone was never sent. This is what previously made pruning here stall.
 */
export function contiguousAppliedPrefix(
  pushedSeqs: number[],
  results: { client_seq: number | null; status: string }[] | null,
  opts?: { lastReceipt?: number; unpushedSeqs?: number[] },
): { prefix: number; failed: number[] } {
  const lastReceipt = opts?.lastReceipt ?? 0;
  const merged: ReceiptedChange[] = pushedSeqs.map((seq) => {
    const status = results ? results.find((r) => r.client_seq === seq)?.status : 'applied';
    const outcome: ApplyOutcome = status === 'applied' || status === 'conflict' ? 'applied' : 'pending';
    return { seq, outcome };
  });
  const ceiling = pushedSeqs.length > 0 ? Math.max(...pushedSeqs) : 0;
  const { ackedUpto, failedSeqs } = computeReceiptWatermark(lastReceipt, merged, ceiling);
  const cap = unconfirmedCap(lastReceipt, opts?.unpushedSeqs ?? []);
  return { prefix: Math.min(ackedUpto, cap), failed: failedSeqs };
}

const MOBILE_HUB_PORT = 5759;

interface PendingCall { resolve: (v: any) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }

/** Send one request and await the matching response (by requestId). */
function rpc(socket: net.Socket, msg: any, timeoutMs = 20000): Promise<any> {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const pending: PendingCall = {
      resolve,
      reject,
      timer: setTimeout(() => {
        (socket as any).__pending?.delete(requestId);
        reject(new Error('mobile hub timeout'));
      }, timeoutMs),
    };
    (socket as any).__pending = (socket as any).__pending ?? new Map<string, PendingCall>();
    (socket as any).__pending.set(requestId, pending);
    socket.write(JSON.stringify({ ...msg, requestId }) + '\n');
  });
}

function wireSocketHandlers(socket: net.Socket): void {
  let buf = '';
  socket.on('data', (chunk: Buffer) => {
    buf += chunk.toString('utf8');
    let idx: number;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      try {
        const msg = JSON.parse(line);
        const pending: Map<string, PendingCall> | undefined = (socket as any).__pending;
        const key = String(msg.requestId ?? '');
        const call = pending?.get(key);
        if (call) {
          clearTimeout(call.timer);
          pending!.delete(key);
          if (msg.type === 'ERROR') call.reject(new Error(msg.payload?.message || 'mobile hub error'));
          else call.resolve(msg);
        }
      } catch { /* malformed line — skip */ }
    }
  });
}

function connect(host: string, port: number): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      wireSocketHandlers(socket);
      resolve(socket);
    });
    socket.on('error', reject);
  });
}

function closeQuietly(socket: net.Socket): void {
  try { socket.destroy(); } catch { /* ignore */ }
}

// Per-hub pull cursors (sync_meta is a single-row table, so keep our own).
function ensureCursorTable(): void {
  db.exec('CREATE TABLE IF NOT EXISTS mobile_hub_cursors (device_id TEXT PRIMARY KEY, since INTEGER NOT NULL DEFAULT 0)');
}

function getCursor(deviceId: string): number {
  ensureCursorTable();
  const row = db.prepare('SELECT since FROM mobile_hub_cursors WHERE device_id = ?').get(deviceId) as any;
  return row?.since ?? 0;
}

function setCursor(deviceId: string, since: number): void {
  ensureCursorTable();
  db.prepare(
    'INSERT INTO mobile_hub_cursors (device_id, since) VALUES (?, ?) ON CONFLICT(device_id) DO UPDATE SET since = excluded.since'
  ).run(deviceId, since);
}

/**
 * Sync once with a discovered mobile hub: pair, push our outbox, pull theirs.
 * Returns true when a full push+pull cycle succeeded.
 */
export async function syncWithMobileHub(peer: DiscoveredService): Promise<boolean> {
  const host = peer.host || peer.addresses?.[0];
  if (!host) return false;
  // A pairing secret is no longer broadcast over mDNS, so `peer.pairingToken`
  // is usually empty. That is fine as long as this desktop holds a membership
  // credential from that phone: the credential handshake replaces the token.
  // The old guard required a token outright, which — once the broadcast was
  // removed — would have silently disabled desktop→mobile sync entirely.
  if (!peer.pairingToken && !getDesktopJoinerHandle()) {
    logger.debug('Skipping mobile hub: no pairing token and no stored credential', { host });
    return false;
  }
  const port = peer.port || MOBILE_HUB_PORT;
  const hubId = ensureHubDeviceId();

  let socket: net.Socket | null = null;
  try {
    socket = await connect(host, port);

    // 1. Pair with the phone's pairing code (carried in its mDNS TXT record).
    //    P3: when this desktop holds a membership credential from a previous
    //    approval, present it instead and answer the phone's challenge — the
    //    token then becomes a fallback rather than the only thing in play.
    const joinerHandle = getDesktopJoinerHandle();
    const pairRes = await rpc(socket, {
      type: 'PAIR_REQUEST',
      payload: {
        device_id: hubId,
        name: `Shega Desktop (${hubId.slice(0, 6)})`,
        // Present whichever the phone can use; the hub prefers the credential.
        ...(peer.pairingToken ? { token: peer.pairingToken } : {}),
        ...(joinerHandle ? { credential: joinerHandle.credential } : {}),
      },
    });
    if (pairRes?.type === 'AUTH_CHALLENGE') {
      const proof = answerHubChallenge(pairRes);
      if (!proof) {
        logger.warn('Mobile hub issued a challenge but this desktop has no credential', { host });
        return false;
      }
      const authRes = await rpc(socket, { type: 'AUTH_PROOF', payload: proof });
      if (authRes?.type === 'AUTH_DENY') {
        logger.warn('Mobile hub denied the authenticated handshake', { host, reason: authRes.payload?.reason });
        return false;
      }
      logger.info('Mobile hub authenticated this desktop', { host, role: authRes?.payload?.role ?? null });
    } else if (pairRes?.type !== 'PAIR_RESPONSE' || !pairRes?.payload?.success) {
      logger.warn('Mobile hub pair rejected', { host, port });
      return false;
    }

    // 2. Push the desktop's unsynced outbox rows as changes.
    const { changes, pushedSeqs } = buildPushChanges(hubId);
    if (changes.length > 0) {
      const ack = await rpc(socket, { type: 'SYNC_PUSH', payload: { changes } });
      if (ack?.type === 'SYNC_ACK') {
        logger.info('Mobile hub push', { host, pushed: ack.payload?.applied ?? 0, conflicts: ack.payload?.conflicts ?? 0 });
        // Record what the hub actually merged. Previously this step DELETED the
        // pushed rows outright, so a hub that rejected or deferred a change lost
        // it permanently — the desktop believed "pushed" meant "delivered". Rows
        // are now only eligible for deletion once every active peer has acked
        // them, and an explicit receipt is recorded for this phone.
        const results = Array.isArray(ack.payload?.results)
          ? (ack.payload.results as { client_seq: number | null; status: string }[])
          : null;
        // The desktop outbox is shared across devices, so some rows in it belong
        // to other authors and were deliberately not pushed to this phone. Those
        // rows must cap the receipt, or the hub could prune a row this phone was
        // never sent.
        const lastReceipt = peerReceiptWatermark(peer.deviceId);
        const pushedSet = new Set(pushedSeqs);
        const unpushed = (db.prepare('SELECT seq FROM sync_outbox ORDER BY seq ASC').all() as any[])
          .map((r) => Number(r.seq))
          .filter((seq) => seq > lastReceipt && !pushedSet.has(seq));
        const { prefix, failed } = contiguousAppliedPrefix(pushedSeqs, results, { lastReceipt, unpushedSeqs: unpushed });
        if (prefix > lastReceipt) {
          recordAck(peer.deviceId, prefix, failed);
          pruneAckedOutbox();
        }
      } else {
        logger.warn('Mobile hub push was not acknowledged — rows retained', { host });
      }
    }

    // 3. Pull the phone's changes (since our stored cursor) and apply via LWW.
    const since = getCursor(peer.deviceId);
    const pulled = await rpc(socket, { type: 'SYNC_PULL', payload: { since } }, 30000);
    if (pulled?.type === 'SYNC_CHANGES' && Array.isArray(pulled.payload?.changes)) {
      const incoming = pulled.payload.changes;
      if (incoming.length > 0) {
        const result = applyRemoteChanges(hubId, incoming);
        logger.info('Mobile hub pull', { host, pulled: incoming.length, applied: result.applied, conflicts: result.conflicts });
      }
      const lastSeq = Number(pulled.payload.lastSeq ?? since);
      if (lastSeq > since) setCursor(peer.deviceId, lastSeq);
    }

    // 4. Successful cycle — the pushed rows are now eligible for pruning, but
    // only once every active peer has acked them (see step 2). Rows are no
    // longer deleted here: an unacked peer must still be able to collect them.
    // Persist the mobile hub as a peer device so it appears in Connected Devices
    // and we have its info for auto-reconnect.
    try {
      persistPeerDevice({
        deviceId: peer.deviceId,
        name: peer.name || `Mobile Hub (${peer.deviceId.slice(0, 8)})`,
        platform: 'mobile',
        // businessId: undefined, // will use default business
      });
    } catch { /* best effort */ }
    return true;
  } catch (e: any) {
    logger.warn('Mobile hub sync failed', { host, port, error: e?.message });
    return false;
  } finally {
    if (socket) closeQuietly(socket);
  }
}

/** True when this discovered peer is a mobile phone acting as a hub. */
export function isMobileHub(peer: DiscoveredService): boolean {
  return peer.platform === 'mobile' || peer.port === MOBILE_HUB_PORT;
}
