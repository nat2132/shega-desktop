/**
 * Human-readable device identity, shared by the sync hub (which advertises it
 * in `/sync/info` so LAN probes can name this device) and the pairing beacon.
 * Kept in its own module so neither of those has to import the other.
 */

import * as os from 'os';

/** Real, human-readable device name for discovery lists. */
export function getDesktopDeviceName(): string {
  try {
    const host = os.hostname();
    return host ? `Desktop — ${host}`.slice(0, 48) : 'Shega Desktop';
  } catch {
    return 'Shega Desktop';
  }
}

/** This machine's non-internal IPv4 addresses (all active interfaces, including Windows Mobile Hotspot). */
export function getLocalIPv4s(): string[] {
  const ips: string[] = [];
  try {
    const interfaces = os.networkInterfaces();
    for (const addrs of Object.values(interfaces)) {
      for (const a of addrs ?? []) {
        if (a.family === 'IPv4' && !a.internal) {
          if (!ips.includes(a.address)) ips.push(a.address);
        }
      }
    }
  } catch { /* no interfaces */ }
  return ips;
}
