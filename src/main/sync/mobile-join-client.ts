/**
 * Desktop client for joining a business whose OWNER is a mobile phone.
 *
 * The mobile POS hub speaks newline-delimited JSON over TCP (port 5759) and —
 * like the desktop hub — serves the DEVICE_JOIN channel (INVITE_RESOLVE,
 * DEVICE_JOIN_SUBMIT, DEVICE_JOIN_STATUS). This module lets a desktop joiner
 * resolve an invite code, submit its join request, and poll the approval
 * status directly against the owner's phone — no cloud, no prior pairing.
 *
 * Platform-symmetric with `directJoinClient` on mobile.
 */

import * as net from 'net';
import type { DiscoveredService } from './discovery';

const MOBILE_HUB_PORT = 5759;

interface PendingCall { resolve: (v: any) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }

function rpc(socket: net.Socket, msg: any, timeoutMs = 20000): Promise<any> {
  return new Promise((resolve, reject) => {
    const requestId = `dj_${Date.now()}_${Math.random().toString(36).slice(2)}`;
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

function connect(host: string, port: number): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
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
            const key = String(msg.requestId ?? '');
            const pending: Map<string, PendingCall> | undefined = (socket as any).__pending;
            const call = pending?.get(key);
            if (call) {
              clearTimeout(call.timer);
              pending!.delete(key);
              if (msg.type === 'ERROR') call.reject(new Error(msg.payload?.message || 'mobile hub error'));
              else call.resolve(msg);
            }
          } catch { /* malformed line */ }
        }
      });
      resolve(socket);
    });
    socket.on('error', reject);
  });
}

function getHost(peer: DiscoveredService): string | null {
  return peer.host || peer.addresses?.[0] || null;
}

/**
 * Resolve an invite code against a mobile hub. Returns the invitation or null
 * when the code is unknown there.
 */
export async function probeMobileHubJoin(peer: DiscoveredService, code: string): Promise<any | null> {
  const host = getHost(peer);
  if (!host) return null;
  const port = peer.port || MOBILE_HUB_PORT;
  let socket: net.Socket | null = null;
  try {
    socket = await connect(host, port);
    const res = await rpc(socket, { type: 'INVITE_RESOLVE', payload: { code } });
    return res?.payload?.invitation ?? null;
  } catch {
    return null;
  } finally {
    try { socket?.destroy(); } catch { /* ignore */ }
  }
}

/** Submit a join request to the owner's phone. */
export async function submitJoinToMobileHub(peer: DiscoveredService, payload: any): Promise<any> {
  const host = getHost(peer);
  if (!host) throw new Error('Mobile hub is unreachable');
  const port = peer.port || MOBILE_HUB_PORT;
  let socket: net.Socket | null = null;
  try {
    socket = await connect(host, port);
    const res = await rpc(socket, { type: 'DEVICE_JOIN_SUBMIT', payload });
    return res?.payload ?? {};
  } finally {
    try { socket?.destroy(); } catch { /* ignore */ }
  }
}

/** Poll the join status. Returns { record, pairingToken? }. */
export async function pollJoinStatusOnMobileHub(peer: DiscoveredService, code: string, joinerDeviceId: string): Promise<any> {
  const host = getHost(peer);
  if (!host) throw new Error('Mobile hub is unreachable');
  const port = peer.port || MOBILE_HUB_PORT;
  let socket: net.Socket | null = null;
  try {
    socket = await connect(host, port);
    const res = await rpc(socket, { type: 'DEVICE_JOIN_STATUS', payload: { code, joinerDeviceId } });
    return res?.payload ?? {};
  } finally {
    try { socket?.destroy(); } catch { /* ignore */ }
  }
}
