/**
 * LAN presence sweep — discovery that does not depend on mDNS.
 *
 * mDNS multicast is frequently blocked in the real world: Windows Firewall
 * inbound rules, guest/AP isolation, Android's multicast lock, corporate
 * Wi-Fi. On those networks the beacon channel is silent even though both
 * devices are on the same subnet and can talk TCP perfectly well.
 *
 * So we sweep our own /24s and knock on the ports every Shega device already
 * listens on:
 *
 *   5757  desktop sync hub      → HTTP `GET /sync/info`  (identity + device name)
 *   5758  desktop WS sync hub   → TCP connect only (presence)
 *   5759  mobile LAN sync hub   → TCP `DEVICE_HELLO`     (identity + device name)
 *
 * Results are cached for a short window and sweeps are serialized, because the
 * discovery screens poll every few seconds and a sweep costs ~250 connects.
 */

import * as net from 'net';
import type { PairingBeacon } from '@shega/shared';
import { getDesktopDeviceName, getLocalIPv4s } from './device-name';
import { ensureHubDeviceId } from '../sync-hub';

export interface LanFoundDevice {
  /** Same shape as an mDNS beacon hit so callers can merge the two lists. */
  beacon: PairingBeacon;
  host: string;
  platform: string;
  /** Where the hit came from — useful for the UI and for debugging. */
  via: 'http' | 'hello' | 'port';
}

const HUB_HTTP_PORT = 5757;
const HUB_WS_PORT = 5758;
const MOBILE_PORT = 5759;
const CONNECT_TIMEOUT_MS = 200;
const IDENTITY_TIMEOUT_MS = 600;
const CONCURRENCY = 128;
const CACHE_MS = 1_500;
const DISCOVERY_TTL_MS = 45_000;

let cache: { at: number; items: LanFoundDevice[] } = { at: 0, items: [] };
let inflight: Promise<LanFoundDevice[]> | null = null;

/** /24 host list for every active IPv4 on this machine plus hotspot subnets. */
function candidateHosts(): string[] {
  const hosts = new Set<string>();
  const addSubnet = (prefix: string, skipIp?: string) => {
    for (let i = 1; i <= 254; i += 1) {
      const h = `${prefix}.${i}`;
      if (h !== skipIp) hosts.add(h);
    }
  };

  const localIps = getLocalIPv4s();
  for (const ip of localIps) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      const prefix = `${parts[0]}.${parts[1]}.${parts[2]}`;
      addSubnet(prefix, ip);
      hosts.add(`${prefix}.1`);
      hosts.add(`${prefix}.254`);
    }
  }

  // Mobile & Desktop Hotspot subnets
  const hotspotSubnets = [
    '192.168.43',  // Android Hotspot
    '192.168.49',  // Android Wi-Fi Direct / P2P
    '192.168.50',  // Android Hotspot variant
    '192.168.100', // Android Hotspot variant
    '192.168.225', // Android Hotspot variant
    '172.20.10',   // iOS Personal Hotspot
    '192.168.137', // Windows Mobile Hotspot
    '192.168.173', // Windows 11 Mobile Hotspot variant
    '192.168.2',   // macOS / Linux Internet Sharing
    '192.168.3',   // macOS / Linux Internet Sharing
    '10.0.0',      // Generic Hotspot / Router
    '10.0.1',      // Generic Hotspot / Router
  ];

  for (const sub of hotspotSubnets) {
    addSubnet(sub);
  }

  return [...hosts];
}

function connect(host: string, port: number, timeoutMs = CONNECT_TIMEOUT_MS): Promise<net.Socket | null> {
  return new Promise((resolve) => {
    let settled = false;
    const socket = net.connect({ host, port });
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      socket.removeAllListeners('error');
      socket.removeAllListeners('connect');
      socket.setTimeout(0);
      if (ok) resolve(socket);
      else { try { socket.destroy(); } catch { /* already gone */ } resolve(null); }
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
}

/** Ask a desktop hub who it is (its `/sync/info` is unauthenticated by design). */
async function readDesktopIdentity(host: string): Promise<{ deviceId: string; deviceName: string; inviteCode?: string | null } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), IDENTITY_TIMEOUT_MS);
    const res = await fetch(`http://${host}:${HUB_HTTP_PORT}/sync/info`, {
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timer);
    if (!res || !res.ok) return null;
    const info = (await res.json().catch(() => null)) as {
      hub?: string;
      deviceName?: string;
      inviteCode?: string;
    } | null;
    if (!info?.hub) return null;
    return {
      deviceId: String(info.hub),
      deviceName: String(info.deviceName || 'Shega Desktop'),
      inviteCode: info.inviteCode ? String(info.inviteCode) : null,
    };
  } catch {
    return null;
  }
}

/** Ask a mobile LAN hub who it is (`DEVICE_HELLO` is additive and read-only). */
function readMobileIdentity(host: string): Promise<{ deviceId: string; deviceName: string; businessName?: string; inviteCode?: string | null } | null> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port: MOBILE_PORT });
    let buffer = '';
    let settled = false;
    const finish = (value: { deviceId: string; deviceName: string; businessName?: string; inviteCode?: string | null } | null) => {
      if (settled) return;
      settled = true;
      try { socket.destroy(); } catch { /* ignore */ }
      resolve(value);
    };
    socket.setTimeout(IDENTITY_TIMEOUT_MS, () => finish(null));
    socket.once('error', () => finish(null));
    socket.once('connect', () => {
      socket.write(`${JSON.stringify({ type: 'DEVICE_HELLO', requestId: 'probe' })}\n`);
    });
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const line = buffer.split('\n').find((l) => l.includes('DEVICE_HELLO'));
      if (!line) return;
      try {
        const msg = JSON.parse(line);
        const p = msg?.payload || {};
        if (!p.deviceId) return finish(null);
        finish({
          deviceId: String(p.deviceId),
          deviceName: String(p.deviceName || 'Shega Mobile'),
          businessName: p.businessName ? String(p.businessName) : undefined,
          inviteCode: p.inviteCode ? String(p.inviteCode) : null,
        });
      } catch {
        finish(null);
      }
    });
    socket.on('close', () => finish(null));
  });
}

/** Synthesize a beacon-shaped entry so mDNS and LAN hits are interchangeable. */
function toEntry(
  host: string,
  identity: { deviceId: string; deviceName: string; businessName?: string; platform: 'desktop' | 'mobile'; inviteCode?: string | null },
  via: LanFoundDevice['via'],
): LanFoundDevice {
  const beacon: PairingBeacon = {
    v: 1,
    businessId: '',
    businessName: identity.businessName || 'Shega',
    owner: {
      deviceId: identity.deviceId,
      deviceName: identity.deviceName,
      platform: identity.platform,
    },
    // A probe that carried an open invite code is joinable exactly like an
    // mDNS beacon; a bare presence hit carries no code.
    code: identity.inviteCode || '',
    role: 'owner',
    expiresAt: new Date(Date.now() + DISCOVERY_TTL_MS).toISOString(),
    suggestedRole: 'cashier' as any,
  };
  return { beacon, host, platform: identity.platform, via };
}

async function probeHost(host: string): Promise<LanFoundDevice[]> {
  const found: LanFoundDevice[] = [];
  // Desktop hub (HTTP identity) and mobile hub (HELLO identity) in parallel.
  const [desktop, mobile] = await Promise.all([
    connect(host, HUB_HTTP_PORT).then((s) => { if (s) s.destroy(); return !!s; }),
    connect(host, MOBILE_PORT).then((s) => { if (s) s.destroy(); return !!s; }),
  ]);

  if (desktop) {
    const id = await readDesktopIdentity(host);
    if (id) found.push(toEntry(host, { ...id, platform: 'desktop' }, 'http'));
  }
  if (mobile) {
    const id = await readMobileIdentity(host);
    if (id) found.push(toEntry(host, { ...id, platform: 'mobile' }, 'hello'));
  }
  if (!desktop && !mobile) {
    // Anonymous presence (e.g. a desktop whose HTTP identity didn't answer).
    const ws = await connect(host, HUB_WS_PORT);
    if (ws) {
      ws.destroy();
      found.push(toEntry(host, { deviceId: `lan-${host}`, deviceName: `Shega device (${host})`, platform: 'desktop' }, 'port'));
    }
  }
  return found;
}

async function runSweep(): Promise<LanFoundDevice[]> {
  const hosts = candidateHosts();
  const selfId = ensureHubDeviceId();
  const out: LanFoundDevice[] = [];
  for (let i = 0; i < hosts.length; i += CONCURRENCY) {
    const slice = hosts.slice(i, i + CONCURRENCY);
    const results = await Promise.all(slice.map((h) => probeHost(h).catch(() => [] as LanFoundDevice[])));
    for (const list of results) {
      for (const entry of list) {
        if (entry.beacon.owner.deviceId === selfId) continue;
        out.push(entry);
      }
    }
  }
  return out;
}

/**
 * Nearby devices found by sweeping the LAN. Cached briefly and never
 * concurrent, so the discovery screens can poll this cheaply.
 */
export async function sweepLan(force = false): Promise<LanFoundDevice[]> {
  if (!force && Date.now() - cache.at < CACHE_MS) return cache.items;
  if (inflight) return inflight;
  inflight = runSweep()
    .then((items) => {
      cache = { at: Date.now(), items };
      return items;
    })
    .catch(() => cache.items)
    .finally(() => { inflight = null; });
  return inflight;
}

export const __testing = { candidateHosts, toEntry, CONCURRENCY };
