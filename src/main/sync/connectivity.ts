/**
 * Main-process network monitor — the desktop half of automatic reconnect.
 *
 * Tracks two independent signals:
 *   1. Internet reachability — a lightweight HTTPS probe (well-known 204
 *      endpoint, like the mobile app) classifies online/offline. This feeds
 *      `detectNetworkCapabilities().hasInternet` so the sync strategy can
 *      fall back to the cloud relay when the LAN is empty.
 *   2. Local interface changes — a signature over `os.networkInterfaces()`
 *      (non-internal addresses) detects Wi-Fi⇄Ethernet⇄cellular switches and
 *      VPN up/down without polling per-second. On change we emit
 *      `network-changed`, which the sync engine treats as "recompute the world":
 *      re-resolve the strategy and kick a sync immediately.
 *
 * Both signals roll into a single `online`/`offline` stream used by
 * peer-sync.ts to retry transports the moment connectivity returns (2.4/3.4).
 *
 * Design notes:
 *  - `powerMonitor` (Electron) is used if available for an instant resume hint,
 *    but the poll + probe loop is the source of truth so behavior holds in tests.
 *  - The probe runs at most every PROBE_MIN_INTERVAL_MS; a busy desktop with no
 *    internet will back off, not hammer the network.
 */
import { EventEmitter } from 'events';
import { networkInterfaces } from 'os';

const PROBE_URL = 'https://www.gstatic.com/generate_204';
const PROBE_TIMEOUT_MS = 5_000;
const PROBE_MIN_INTERVAL_MS = 30_000;
const POLL_INTERVAL_MS = 15_000;

export type ConnectivityStatus = 'unknown' | 'online' | 'offline';

interface ConnectivityEvents {
  online: [];
  offline: [];
  'network-changed': [signature: string];
}

let status: ConnectivityStatus = 'unknown';
let online = false;

export function currentInternetStatus(): ConnectivityStatus {
  return status;
}

export function currentOnline(): boolean {
  return online;
}

/**
 * Stable fingerprint of the machine's active (non-internal) network
 * interfaces. Address changes (new DHCP lease, VPN, adapter swap) bump it, so
 * a changed signature => the network topology changed under us.
 *
 * Pure + deterministic for tests.
 */
export function networkInterfacesSignature(
  interfaces: ReturnType<typeof networkInterfaces> | Record<string, Array<{ address: string; internal: boolean }>>,
): string {
  const entries: string[] = [];
  for (const [name, addrs] of Object.entries(interfaces ?? {})) {
    for (const addr of addrs ?? []) {
      if (addr.internal) continue;
      entries.push(`${name}:${addr.address}`);
    }
  }
  return entries.sort().join(',');
}

async function probeInternet(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      const res = await fetch(PROBE_URL, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      return res.ok;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}

export class NetworkMonitor extends EventEmitter<ConnectivityEvents> {
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastProbeAt = 0;
  private lastSignature = '';
  private sawInternet = false;

  start(): void {
    if (this.pollTimer) return;
    this.lastSignature = networkInterfacesSignature(networkInterfaces());
    this.poll();

    this.pollTimer = setInterval(() => this.poll(), POLL_INTERVAL_MS);

    // Instant resume hint when the OS wakes / network stack resets (Electron).
    try {
      // Lazy require keeps this module importable under vitest without a mock.
      const { powerMonitor } = require('electron') as typeof import('electron');
      powerMonitor?.on?.('resume', () => this.poll(true));
      powerMonitor?.on?.('on-ac', () => this.poll(true));
    } catch {
      /* no electron in tests */
    }
  }

  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.lastSignature = '';
  }

  private poll(force = false): void {
    this.pollSignature();

    const now = Date.now();
    if (force || now - this.lastProbeAt >= PROBE_MIN_INTERVAL_MS) {
      this.lastProbeAt = now;
      probeInternet().then((ok) => {
        // Debounce probe flapping: only flip online→offline after we actually
        // had internet (otherwise a cold-start single failure looks like a
        // "went offline" event).
        if (ok) {
          if (!online) {
            online = true;
            status = 'online';
            this.emit('online');
          }
        } else if (this.sawInternet && online) {
          online = false;
          status = 'offline';
          this.emit('offline');
        }
        this.sawInternet = online;
        return ok;
      }).catch(() => {});
    }
  }

  private pollSignature(): void {
    const sig = networkInterfacesSignature(networkInterfaces());
    if (sig === this.lastSignature) return;
    const prev = this.lastSignature;
    this.lastSignature = sig;
    // First poll only establishes the baseline; only real changes emit.
    if (prev !== '') this.emit('network-changed', sig);
  }
}

export const networkMonitor = new NetworkMonitor();