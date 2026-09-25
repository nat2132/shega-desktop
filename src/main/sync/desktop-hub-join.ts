/**
 * Desktop client for joining a business whose OWNER is another desktop.
 *
 * The desktop hub serves the DEVICE_JOIN channel over HTTP (port 5757):
 *   POST /sync/invitations/resolve  → resolve an invite code
 *   POST /sync/join/submit          → stage a join request
 *   POST /sync/join/status          → poll the approval decision (+ pairingToken)
 *
 * This module lets a desktop joiner resolve, submit and poll directly against
 * the owner's hub over the LAN — no cloud, no prior pairing. Platform-symmetric
 * with `mobile-join-client` (owner is a phone, TCP port 5759) and
 * `directJoinClient` on mobile (owner is a desktop, this same HTTP channel).
 */

import { defaultPairingLogger } from '@shega/shared';

const pairLog = defaultPairingLogger;
const DESKTOP_HUB_PORT = 5757;

interface HubTarget {
  host: string;
  port?: number;
}

async function postJson(target: HubTarget, path: string, body: any, timeoutMs = 20000): Promise<any> {
  const url = `http://${target.host}:${target.port || DESKTOP_HUB_PORT}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Hub rejected ${path} (HTTP ${res.status})`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve an invite code against a desktop hub. Returns the invitation or null
 * when the code is unknown there.
 */
export async function probeDesktopHubJoin(target: HubTarget, code: string): Promise<any | null> {
  try {
    const res = await postJson(target, '/sync/invitations/resolve', { code });
    return res?.invitation ?? null;
  } catch {
    return null;
  }
}

/** Submit a join request to the owner's desktop hub. */
export async function submitJoinToDesktopHub(target: HubTarget, payload: any): Promise<any> {
  pairLog('info', `submitting join request to desktop hub ${target.host}:${target.port || DESKTOP_HUB_PORT}`);
  const res = await postJson(target, '/sync/join/submit', payload);
  const p = res ?? {};
  const handshake = p.handshake ?? extractDesktopHandshake(p);
  pairLog('info', `desktop hub join submit response: status=${p.status || 'pending'}, handshake.ok=${!!handshake?.ok}`);
  return { ...p, handshake };
}

/** Extract a handshake ack from a raw desktop hub JSON payload (best-effort). */
function extractDesktopHandshake(p: any): { ok?: boolean; hubDeviceId?: string; hubName?: string; hubPlatform?: string; hubPort?: number; businessId?: string | null; businessName?: string | null; status?: string | null; requestId?: string | null; at?: number } | undefined {
  if (!p || typeof p !== 'object') return undefined;
  if (p.handshake) return p.handshake;
  return {
    ok: true,
    hubDeviceId: p.hub ?? 'desktop',
    hubName: 'Shega Desktop',
    hubPlatform: 'desktop',
    hubPort: 5757,
    businessId: p?.invitation?.businessId ?? p.businessId ?? null,
    businessName: p?.invitation?.businessName ?? p.businessName ?? null,
    status: p.status ?? null,
    requestId: p.requestId ?? null,
    at: Date.now(),
  };
}

/** Poll the desktop owner hub's join status / LAN-join admission over HTTP.
 *
 * Code-less radar-tap joiner: the owner admitted this joiner on the radar by
 * device id alone (no typed invite), so the joiner polls the desktop hub HTTP
 * endpoint code-less — the hub falls back to the joiner_device_id-only lookup
 * exactly like the WebSocket path. Mirrors the mobile joiner's code-less poll.
 */
export async function pollJoinStatusOnDesktopHub(target: HubTarget, code: string | null | undefined, joinerDeviceId: string): Promise<any> {
  const res = await postJson(target, '/sync/join/status', {
    ...(code ? { code } : {}),
    joinerDeviceId,
  });
  const p = res ?? {};
  const handshake = p.handshake ?? extractDesktopHandshake(p);
  pairLog('info', `desktop hub join status poll response: status=${p?.record?.status || 'pending'}, handshake.ok=${!!handshake?.ok}`);
  return { ...p, handshake };
}