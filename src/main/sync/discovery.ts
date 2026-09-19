import { Bonjour } from 'bonjour-service';
import { EventEmitter } from 'events';
import { ensureHubDeviceId, SYNC_PORT } from '../sync-hub';

export interface ServiceInfo {
  deviceId: string;
  pairingToken: string;
  schemaVersion: number;
  port: number;
  hostname: string;
  addresses: string[];
  capabilities: string[];
  discoveredAt: number;
  platform?: string;
  businessId?: string;
}

export interface DiscoveredService extends ServiceInfo {
  host: string;
}

type DiscoveryEventMap = {
  up: [DiscoveredService];
  down: [DiscoveredService];
  error: [Error];
};

export class MdnsDiscovery extends EventEmitter<DiscoveryEventMap> {
  private bonjour: Bonjour | null = null;
  private isPublishing = false;
  private isBrowsing = false;
  private discoveredServices = new Map<string, DiscoveredService>();

  constructor() {
    super();
  }

  start(): void {
    if (this.bonjour) return;

    this.bonjour = new Bonjour({}, (err: Error) => {
      console.error('[mDNS] Bonjour error:', err);
      this.emit('error', err);
    });

    this.startPublishing();
    this.startBrowsing();
  }

  private startPublishing(): void {
    if (!this.bonjour || this.isPublishing) return;

    const deviceId = ensureHubDeviceId();
    const port = SYNC_PORT;

    // Get business ID for peer verification
    let businessId = '';
    try {
      const row = require('../database').default.prepare(
        "SELECT uuid FROM businesses WHERE isDefault = 1 OR id = 1 LIMIT 1"
      ).get() as any;
      businessId = row?.uuid ?? '';
    } catch {}

    const txtRecord = {
      device_id: deviceId,
      schema_version: '21',
      port: String(port),
      platform: 'desktop',
      business_id: businessId,
      capabilities: 'lan,sync,cloud,desktop',
    };

    this.bonjour.publish({
      name: `Shega POS Hub (${deviceId.slice(0, 8)})`,
      type: 'shega-pos',
      protocol: 'tcp',
      port,
      txt: txtRecord,
    });

    this.isPublishing = true;
    console.log(`[mDNS] Publishing service: Shega POS Hub on port ${port}`);
  }

  private startBrowsing(): void {
    if (!this.bonjour || this.isBrowsing) return;

    const browser = this.bonjour.find({ type: 'shega-pos', protocol: 'tcp' });

    browser.on('up', (service) => {
      const deviceId = service.txt?.device_id;
      if (!deviceId) return;

      // Don't discover ourselves
      const hubId = ensureHubDeviceId();
      if (deviceId === hubId) return;

      const discovered: DiscoveredService = {
        deviceId,
        pairingToken: service.txt?.pairing_token || '',
        schemaVersion: parseInt(service.txt?.schema_version || '0', 10),
        port: service.port,
        hostname: service.host,
        addresses: service.addresses || [],
        capabilities: (service.txt?.capabilities || '').split(',').filter(Boolean),
        discoveredAt: Date.now(),
        host: service.addresses?.[0] || service.host,
        platform: service.txt?.platform || 'desktop',
        businessId: service.txt?.business_id || undefined,
      };

      this.discoveredServices.set(deviceId, discovered);
      console.log(`[mDNS] Discovered hub: ${deviceId} at ${discovered.host}:${service.port}`);
      this.emit('up', discovered);
    });

    browser.on('down', (service) => {
      const deviceId = service.txt?.device_id;
      if (!deviceId) return;

      const existing = this.discoveredServices.get(deviceId);
      if (existing) {
        this.discoveredServices.delete(deviceId);
        console.log(`[mDNS] Hub went down: ${deviceId}`);
        this.emit('down', existing);
      }
    });

    browser.on('error', (err: Error) => {
      console.error('[mDNS] Browser error:', err);
      this.emit('error', err);
    });

    this.isBrowsing = true;
    console.log('[mDNS] Browsing for Shega POS hubs...');
  }

  getDiscoveredServices(): DiscoveredService[] {
    return Array.from(this.discoveredServices.values());
  }

  getService(deviceId: string): DiscoveredService | undefined {
    return this.discoveredServices.get(deviceId);
  }

  stop(): void {
    if (this.bonjour) {
      this.bonjour.destroy();
      this.bonjour = null;
    }
    this.isPublishing = false;
    this.isBrowsing = false;
    this.discoveredServices.clear();
    console.log('[mDNS] Stopped');
  }
}

export const mdnsDiscovery = new MdnsDiscovery();

export function startMdnsDiscovery(): void {
  mdnsDiscovery.start();
}

export function stopMdnsDiscovery(): void {
  mdnsDiscovery.stop();
}