/**
 * Pairing-beacon discovery (desktop side) — "Bluetooth-style" nearby-owner
 * visibility for the join flow.
 *
 * While an owner has an open pairing invitation, a short-lived `PairingBeacon`
 * is encoded into the mDNS TXT record of a `_shega-pair._tcp` advertisement.
 * Joiner devices (mobile or desktop) browse that service and render a discovery
 * list — exactly like scanning for Bluetooth devices. The same module both:
 *
 *   • PUBLISHES this device's beacon when "Add Team Member" opens an invite
 *     (owner role, any platform), and tears it down when the invite closes.
 *   • BROWSES for other devices' beacons so the "Join an existing business"
 *     screen can show nearby businesses live, like a Bluetooth scan list.
 *
 * Security: the beacon only ever carries the short-lived invite code, the
 * business UUID and display name, and the owner device identity — no
 * credentials, no tokens, no business data. Beacons expire with the invite
 * (default 10 minutes) and disappear when revoked.
 */

import * as os from 'os';
import { Bonjour } from 'bonjour-service';
import { EventEmitter } from 'events';
import { ipcMain } from 'electron';
import {
  type PairingBeacon,
  type BeaconRole,
  encodePairingBeacon,
  decodePairingBeacon,
  isBeaconLive,
} from '@shega/shared';
import { ensureHubDeviceId } from '../sync-hub';
import db from '../database';

const PAIR_SERVICE_TYPE = 'shega-pair';

interface DiscoveredBeacon {
  beacon: PairingBeacon;
  host: string;
  port: number;
  addresses: string[];
  discoveredAt: number;
}

type BeaconEventMap = {
  up: [DiscoveredBeacon];
  down: [DiscoveredBeacon];
};

interface PublishedHandle { stop: () => void }

class PairingBeaconService extends EventEmitter<BeaconEventMap> {
  private bonjour: Bonjour | null = null;
  /** Owner side: the currently advertised beacon (or null when not pairing). */
  private published: { svcName: string; beacon: PairingBeacon; handle: PublishedHandle | null } | null = null;
  /** Joiner side: deviceId → last seen beacon from the network. */
  private seen = new Map<string, DiscoveredBeacon>();
  private browsing = false;

  // ── Owner side: publish / stop ──────────────────────────────────────────

  /**
   * Advertise an open pairing invitation. Called when the owner generates a
   * pairing invite (onboarding "Add team member" or Settings → Team).
   */
  publishBeacon(beacon: PairingBeacon): void {
    this.stopPublishing();
    if (!this.bonjour) {
      try {
        this.bonjour = new Bonjour({}, () => {});
      } catch (e) {
        console.warn('[pair-beacon] bonjour unavailable:', e);
        return;
      }
    }
    const svcName = `Shega Pair — ${beacon.businessName}`.slice(0, 60);
    const txt = {
      device_id: beacon.owner.deviceId,
      platform: beacon.owner.platform,
      beacon: encodePairingBeacon(beacon),
    };
    // Port is the device's existing sync port; the beacon port itself is not
    // dialed — joiners submit join requests through the normal hub channels.
    const handle = this.bonjour.publish({
      name: svcName,
      type: PAIR_SERVICE_TYPE,
      protocol: 'tcp',
      port: 5757,
      txt,
    });
    this.published = { svcName, beacon, handle: { stop: () => { try { (handle as any).stop?.(); } catch {} } } };
    console.log(`[pair-beacon] publishing "${svcName}" until ${beacon.expiresAt}`);
  }

  /** Stop advertising (invite closed / approved / revoked / expired). */
  stopPublishing(): void {
    if (!this.published) return;
    try {
      // bonjour-service exposes stop() on the published service handle —
      // unpublishAll() does not exist there.
      this.published.handle?.stop();
      this.bonjour?.unpublishAll?.();
    } catch { /* best-effort */ }
    this.published = null;
    console.log('[pair-beacon] publishing stopped');
  }

  /** Owner-side state used by the UI while the pairing sheet is open. */
  isPublishing(): boolean {
    return this.published !== null;
  }

  /**
   * Discovery mode: stay visible without an open invite. Broadcasts a
   * code-less beacon carrying this device's name so peers see it in their
   * discovery list; joining still requires a live invite code. `role` tells
   * peers how to label this device — 'team' when this device is in Joining
   * Mode (owner lists it as "Team · name"), 'owner' when it's recruiting
   * (joiners list it as "Owner · name").
   */
  setDiscoverable(on: boolean, businessName = 'Shega', role: BeaconRole = 'owner'): void {
    if (on) {
      if (this.published) return; // a live invite beacon is already stronger
      let bizName = businessName;
      let bizId = 'discovery';
      try {
        const row = db.prepare(
          'SELECT uuid, businessName FROM businesses WHERE isDefault = 1 OR id = 1 LIMIT 1'
        ).get() as any;
        if (row) { bizName = row.businessName || bizName; bizId = row.uuid ?? bizId; }
      } catch { /* brand-new install */ }
      const beacon: PairingBeacon = {
        v: 1,
        businessId: bizId,
        businessName: bizName,
        owner: {
          deviceId: ensureHubDeviceId(),
          deviceName: getDesktopDeviceName(),
          platform: 'desktop',
        },
        code: '',
        role,
        expiresAt: new Date(Date.now() + 12 * 3600_000).toISOString(),
        suggestedRole: 'cashier' as any,
      };
      this.publishBeacon(beacon);
    } else if (this.published && this.published.beacon.code === '') {
      // Only stop a discovery-only beacon — never a live invite beacon.
      this.stopPublishing();
    }
  }

  // ── Joiner side: browse nearby owners ───────────────────────────────────

  startBrowsing(): void {
    if (this.browsing) return;
    if (!this.bonjour) {
      try {
        this.bonjour = new Bonjour({}, () => {});
      } catch (e) {
        console.warn('[pair-beacon] bonjour unavailable:', e);
        return;
      }
    }
    const browser = this.bonjour.find({ type: PAIR_SERVICE_TYPE, protocol: 'tcp' });
    (this as any).browser = browser;
    browser.on('up', (service: any) => {
      const beacon = decodePairingBeacon(service.txt?.beacon);
      if (!beacon || !isBeaconLive(beacon)) return;
      const selfId = ensureHubDeviceId();
      if (beacon.owner.deviceId === selfId) return; // never list ourselves
      const entry: DiscoveredBeacon = {
        beacon,
        host: service.addresses?.[0] || service.host || '',
        port: service.port ?? 5757,
        addresses: service.addresses || [],
        discoveredAt: Date.now(),
      };
      this.seen.set(beacon.owner.deviceId, entry);
      this.emit('up', entry);
    });
    browser.on('down', (service: any) => {
      const beacon = decodePairingBeacon(service.txt?.beacon);
      if (!beacon) return;
      const existing = this.seen.get(beacon.owner.deviceId);
      if (existing) {
        this.seen.delete(beacon.owner.deviceId);
        this.emit('down', existing);
      }
    });
    this.browsing = true;
    console.log('[pair-beacon] browsing for nearby pairing beacons…');
  }

  stopBrowsing(): void {
    try { (this as any).browser?.stop?.(); } catch { /* best-effort */ }
    (this as any).browser = null;
    this.browsing = false;
    this.seen.clear();
  }

  /** Snapshot for the discovery list — expired beacons are filtered out. */
  getNearbyOwners(): Array<{ beacon: PairingBeacon; host: string; platform: string }> {
    const out: Array<{ beacon: PairingBeacon; host: string; platform: string }> = [];
    for (const [deviceId, entry] of this.seen) {
      if (!isBeaconLive(entry.beacon)) { this.seen.delete(deviceId); continue; }
      out.push({ beacon: entry.beacon, host: entry.host, platform: entry.beacon.owner.platform });
    }
    return out;
  }
}

export const pairingBeacon = new PairingBeaconService();

/**
 * Build a beacon from an open local invitation and start advertising it.
 * Works identically for desktop-owner and mobile-owner invites stored here.
 */
/** Real, human-readable device name for discovery lists. */
function getDesktopDeviceName(): string {
  try {
    const host = os.hostname();
    return host ? `Desktop — ${host}`.slice(0, 48) : 'Shega Desktop';
  } catch {
    return 'Shega Desktop';
  }
}

export function startPairingBeaconForInvite(invite: {
  id: string;
  code: string;
  businessId: number | string;
  suggestedRole?: string | null;
  role?: string | null;
  expiresAt?: string | null;
}): void {
  const biz = db.prepare('SELECT uuid, businessName FROM businesses WHERE id = ? OR uuid = ?')
    .get(invite.businessId, invite.businessId) as any;
  const beacon: PairingBeacon = {
    v: 1,
    businessId: biz?.uuid ?? String(invite.businessId),
    businessName: biz?.businessName ?? 'Shega Business',
    owner: {
      deviceId: ensureHubDeviceId(),
      deviceName: getDesktopDeviceName(),
      platform: 'desktop',
    },
    code: invite.code,
    role: 'owner',
    expiresAt: invite.expiresAt ?? new Date(Date.now() + 10 * 60_000).toISOString(),
    suggestedRole: (invite.suggestedRole ?? invite.role ?? 'cashier') as any,
  };
  pairingBeacon.publishBeacon(beacon);
}

/** Wire the IPC surface used by the renderer join/pairing screens. */
export function registerPairingBeaconHandlers(): void {
  ipcMain.handle('pair-beacon:start', (_e, invite: any) => {
    startPairingBeaconForInvite(invite);
    return { publishing: pairingBeacon.isPublishing() };
  });

  ipcMain.handle('pair-beacon:stop', () => {
    pairingBeacon.stopPublishing();
    return { publishing: false };
  });

  // Discovery mode: entering Joining Mode / Add-Team keeps this device
  // visible on the network (device-name beacon without an invite code) so
  // other devices can find it — never overrides a live invite beacon.
  ipcMain.handle('pair-beacon:discoverable', (_e, on: boolean, businessName?: string, role?: BeaconRole) => {
    pairingBeacon.setDiscoverable(!!on, businessName, role ?? 'owner');
    return { publishing: pairingBeacon.isPublishing() };
  });

  ipcMain.handle('pair-beacon:nearby', () => {
    pairingBeacon.startBrowsing();
    return pairingBeacon.getNearbyOwners();
  });

  // This device's human-readable name, shown in Join Mode / Add Team screens
  // so peers can identify it the same way they do from a discovery beacon.
  ipcMain.handle('device:name', () => getDesktopDeviceName());
}
