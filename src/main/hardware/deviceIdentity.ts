/**
 * Device Identification & Stable IDs
 *
 * Provides stable hardware identifiers that survive:
 * - Windows COM port reassignment
 * - USB port changes
 * - Bluetooth reconnection
 * - Network IP changes (with fallback)
 */

import { createHash } from 'crypto';

export interface DeviceIdentity {
  /** Stable unique identifier */
  deviceId: string;
  /** Human-readable name */
  name: string;
  /** Device type */
  deviceType: 'barcode_scanner' | 'receipt_printer';
  /** Connection type */
  connectionType: string;
  /** Manufacturer if known */
  manufacturer?: string;
  /** Model if known */
  model?: string;
  /** Serial number if available */
  serialNumber?: string;
  /** Hardware identifiers */
  hardwareIds: {
    vendorId?: number;
    productId?: number;
    port?: string;
    host?: string;
    networkPort?: number;
    bluetoothAddress?: string;
  };
  /** Configuration fingerprint (to detect config changes) */
  configFingerprint: string;
  /** First seen timestamp */
  firstSeen: number;
  /** Last seen timestamp */
  lastSeen: number;
  /** Whether this device was previously configured */
  previouslyConfigured: boolean;
}

/**
 * Generate a stable device ID from hardware identifiers.
 * Priority: serialNumber > VID:PID > host:port > port path
 */
export function generateStableDeviceId(params: {
  deviceType: 'barcode_scanner' | 'receipt_printer';
  connectionType: string;
  serialNumber?: string;
  vendorId?: number;
  productId?: number;
  host?: string;
  networkPort?: number;
  port?: string;
  bluetoothAddress?: string;
}): string {
  const { deviceType, connectionType } = params;

  // Use serial number if available (most stable)
  if (params.serialNumber) {
    return `${deviceType}_sn_${params.serialNumber}`;
  }

  // USB VID:PID (stable across port changes)
  if (params.vendorId !== undefined && params.productId !== undefined) {
    return `${deviceType}_usb_${params.vendorId.toString(16).padStart(4, '0')}_${params.productId.toString(16).padStart(4, '0')}`;
  }

  // Network host:port
  if (params.host && params.networkPort) {
    return `${deviceType}_net_${params.host.replace(/\./g, '_')}_${params.networkPort}`;
  }

  // Bluetooth address
  if (params.bluetoothAddress) {
    return `${deviceType}_bt_${params.bluetoothAddress.replace(/:/g, '')}`;
  }

  // Port path (least stable — Windows can reassign COM numbers)
  if (params.port) {
    return `${deviceType}_port_${params.port.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  // Fallback
  return `${deviceType}_unknown_${Date.now()}`;
}

/**
 * Generate a configuration fingerprint to detect config changes.
 */
export function generateConfigFingerprint(config: Record<string, unknown>): string {
  const str = JSON.stringify(config, Object.keys(config).sort());
  return createHash('sha256').update(str).digest('hex').slice(0, 16);
}

/**
 * Compare two device identities to determine if they represent
 * the same physical device despite connection changes.
 */
export function isSameDevice(a: DeviceIdentity, b: DeviceIdentity): boolean {
  // Same device ID = same device
  if (a.deviceId === b.deviceId) return true;

  // Same serial number = same device
  if (a.serialNumber && b.serialNumber && a.serialNumber === b.serialNumber) return true;

  // Same USB VID:PID = likely same device
  if (
    a.hardwareIds.vendorId !== undefined &&
    a.hardwareIds.vendorId === b.hardwareIds.vendorId &&
    a.hardwareIds.productId !== undefined &&
    a.hardwareIds.productId === b.hardwareIds.productId
  ) {
    return true;
  }

  // Same network host:port = same device
  if (
    a.hardwareIds.host &&
    a.hardwareIds.host === b.hardwareIds.host &&
    a.hardwareIds.networkPort === b.hardwareIds.networkPort
  ) {
    return true;
  }

  // Same Bluetooth address = same device
  if (
    a.hardwareIds.bluetoothAddress &&
    a.hardwareIds.bluetoothAddress === b.hardwareIds.bluetoothAddress
  ) {
    return true;
  }

  return false;
}

/**
 * Device registry — stores and retrieves device identities.
 */
export class DeviceRegistry {
  private devices: Map<string, DeviceIdentity> = new Map();

  /** Register a new device */
  register(identity: Omit<DeviceIdentity, 'firstSeen' | 'lastSeen'>): DeviceIdentity {
    const existing = this.findByIdentity(identity);
    if (existing) {
      // Update existing
      existing.lastSeen = Date.now();
      existing.name = identity.name;
      existing.manufacturer = identity.manufacturer;
      existing.model = identity.model;
      existing.serialNumber = identity.serialNumber;
      existing.hardwareIds = { ...existing.hardwareIds, ...identity.hardwareIds };
      existing.configFingerprint = identity.configFingerprint;
      return existing;
    }

    const device: DeviceIdentity = {
      ...identity,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    };
    this.devices.set(device.deviceId, device);
    return device;
  }

  /** Find a device by its identity (fuzzy match) */
  findByIdentity(identity: Omit<DeviceIdentity, 'firstSeen' | 'lastSeen'>): DeviceIdentity | undefined {
    const candidateId = generateStableDeviceId({
      deviceType: identity.deviceType,
      connectionType: identity.connectionType,
      serialNumber: identity.serialNumber,
      vendorId: identity.hardwareIds.vendorId,
      productId: identity.hardwareIds.productId,
      host: identity.hardwareIds.host,
      networkPort: identity.hardwareIds.networkPort,
      port: identity.hardwareIds.port,
      bluetoothAddress: identity.hardwareIds.bluetoothAddress,
    });

    // Try exact ID match first
    const exact = this.devices.get(candidateId);
    if (exact) return exact;

    // Try fuzzy match
    for (const device of this.devices.values()) {
      if (isSameDevice(device, { ...identity, deviceId: candidateId, firstSeen: 0, lastSeen: 0 })) {
        return device;
      }
    }

    return undefined;
  }

  /** Get all registered devices */
  getAll(): DeviceIdentity[] {
    return Array.from(this.devices.values());
  }

  /** Get devices by type */
  getByType(deviceType: 'barcode_scanner' | 'receipt_printer'): DeviceIdentity[] {
    return this.getAll().filter(d => d.deviceType === deviceType);
  }

  /** Get a device by ID */
  get(deviceId: string): DeviceIdentity | undefined {
    return this.devices.get(deviceId);
  }

  /** Remove a device */
  remove(deviceId: string): void {
    this.devices.delete(deviceId);
  }

  /** Clear all devices */
  clear(): void {
    this.devices.clear();
  }
}

// Singleton
export const deviceRegistry = new DeviceRegistry();