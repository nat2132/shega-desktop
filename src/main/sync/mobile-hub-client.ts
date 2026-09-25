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
import type { DiscoveredService } from './discovery';

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
  // The pairing code is no longer broadcast over mDNS; without an explicitly
  // configured token the phone hub will (correctly) reject the pair.
  if (!peer.pairingToken) {
    logger.debug('Skipping mobile hub without an explicit pairing token', { host });
    return false;
  }
  const port = peer.port || MOBILE_HUB_PORT;
  const hubId = ensureHubDeviceId();

  let socket: net.Socket | null = null;
  try {
    socket = await connect(host, port);

    // 1. Pair with the phone's pairing code (carried in its mDNS TXT record).
    const pairRes = await rpc(socket, {
      type: 'PAIR_REQUEST',
      payload: {
        device_id: hubId,
        name: `Shega Desktop (${hubId.slice(0, 6)})`,
        token: peer.pairingToken,
      },
    });
    if (pairRes?.type !== 'PAIR_RESPONSE' || !pairRes?.payload?.success) {
      logger.warn('Mobile hub pair rejected', { host, port });
      return false;
    }

    // 2. Push the desktop's unsynced outbox rows as changes.
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
      changes.push({ entity: r.entity, entity_uuid: r.entity_uuid, op: r.op, payload, device_id: hubId });
      pushedSeqs.push(r.seq);
    }
    if (changes.length > 0) {
      const ack = await rpc(socket, { type: 'SYNC_PUSH', payload: { changes } });
      if (ack?.type === 'SYNC_ACK') {
        logger.info('Mobile hub push', { host, pushed: ack.payload?.applied ?? 0, conflicts: ack.payload?.conflicts ?? 0 });
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

    // 4. Successful cycle — clear the pushed outbox rows so we don't resend.
    if (pushedSeqs.length > 0) {
      const ph = pushedSeqs.map(() => '?').join(', ');
      db.prepare(`DELETE FROM sync_outbox WHERE seq IN (${ph})`).run(...pushedSeqs);
    }
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
