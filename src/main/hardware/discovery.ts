/**
 * Desktop Hardware Discovery Service
 * Detects available barcode scanners and ESC/POS printers
 * via Serial/COM, USB, and Network (TCP 9100)
 *
 * Runs in Electron main process. Does NOT auto-connect to unknown devices.
 * Discovery and connection are separate: detect → show → user connects → test → save.
 */

import { EventEmitter } from 'events';
import { SerialPort } from 'serialport';
import net from 'net';
import { ScannerConfig } from '@shega/shared/config/hardwareSettings';
import { USE_MOCK_PERIPHERALS } from '@shega/shared/peripherals/config';

/**
 * `usb` is a native module with a compiled `.node` binding. It cannot be
 * required in a plain-Node context (the e2e sync harness bundles this file) and
 * it is absent from some installs, so it is loaded lazily and defensively. USB
 * discovery is a bonus — serial and network discovery work without it.
 */
let usbModule: any | null | undefined;
function getUsb(): any | null {
  if (usbModule !== undefined) return usbModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    usbModule = require('usb');
  } catch {
    usbModule = null;
  }
  return usbModule;
}

// ==== Types ====

export type DeviceType = 'barcode_scanner' | 'receipt_printer';
export type ConnectionType = 'serial_com' | 'usb_hid' | 'usb_raw' | 'network_tcp' | 'bluetooth';

export interface DetectedDevice {
  /** Stable local identifier (not COM number) */
  deviceId: string;
  deviceType: DeviceType;
  connectionType: ConnectionType;
  /** Human-readable name */
  name: string;
  /** Manufacturer if known */
  manufacturer?: string;
  /** Model if known */
  model?: string;
  /** Connection details */
  port?: string;           // COM port path
  baudRate?: number;
  vendorId?: number;       // USB VID
  productId?: number;      // USB PID
  host?: string;           // Network IP
  networkPort?: number;    // Network port
  /** Protocol hint */
  protocol?: 'ESC/POS' | 'HID' | 'unknown';
  /** Detection confidence */
  confidence: 'high' | 'medium' | 'low';
  /** Whether this device was previously configured */
  previouslyConfigured: boolean;
  /** Last time this device was seen */
  lastSeen: number;
  /** Whether device is currently available */
  available: boolean;
}

export interface DiscoveryOptions {
  /** Scan serial/COM ports */
  scanSerial?: boolean;
  /** Scan USB devices */
  scanUsb?: boolean;
  /** Scan network printers (TCP 9100) */
  scanNetwork?: boolean;
  /** Network scan timeout (ms) */
  networkTimeoutMs?: number;
  /** Known network printer IPs to probe */
  knownNetworkHosts?: string[];
  /** Previously configured device IDs to prioritize */
  knownDeviceIds?: string[];
}

const DEFAULT_DISCOVERY_OPTIONS: DiscoveryOptions = {
  scanSerial: true,
  scanUsb: true,
  scanNetwork: true,
  networkTimeoutMs: 2000,
  knownNetworkHosts: [],
  knownDeviceIds: [],
};

// ==== Device Identification ====

/**
 * Generate a stable device ID from hardware identifiers.
 * Does NOT rely on COM number (Windows can reassign).
 */
function generateDeviceId(connectionType: ConnectionType, params: {
  port?: string;
  vendorId?: number;
  productId?: number;
  host?: string;
  networkPort?: number;
}): string {
  switch (connectionType) {
    case 'serial_com':
      // Use port path + any available serial number
      return `serial_${params.port?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown'}`;
    case 'usb_hid':
    case 'usb_raw':
      // USB VID:PID is stable across reconnects
      return `usb_${params.vendorId?.toString(16).padStart(4, '0') || '0000'}_${params.productId?.toString(16).padStart(4, '0') || '0000'}`;
    case 'network_tcp':
      return `net_${params.host?.replace(/\./g, '_') || 'unknown'}_${params.networkPort || 9100}`;
    case 'bluetooth':
      return `bt_${params.port?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown'}`;
    default:
      return `unknown_${Date.now()}`;
  }
}

/**
 * Identify if a USB device is likely a barcode scanner or printer.
 * Uses device class, VID/PID heuristics, and string descriptors.
 */
function identifyUsbDevice(device: any): { type: DeviceType; confidence: 'high' | 'medium' | 'low'; name: string } {
  const desc = device.deviceDescriptor;
  const vid = desc.idVendor;
  const pid = desc.idProduct;

  // Known barcode scanner VID/PIDs
  const KNOWN_SCANNER_VIDS = [0x05e0, 0x0c2e, 0x1a86, 0x0483, 0x1eab];
  const KNOWN_PRINTER_VIDS = [0x04b8, 0x0483, 0x0519, 0x067b, 0x0403, 0x0fe6];

  // Check device class
  const isHid = desc.bDeviceClass === 3 || desc.bDeviceClass === 0;
  const isPrinter = desc.bDeviceClass === 7; // Printer class

  // Try to read string descriptors
  let manufacturer = '';
  let product = '';
  try {
    device.open();
    if (desc.iManufacturer) {
      manufacturer = device.getStringDescriptor(desc.iManufacturer, () => {});
    }
    if (desc.iProduct) {
      product = device.getStringDescriptor(desc.iProduct, () => {});
    }
    device.close();
  } catch {
    // Ignore descriptor read errors
  }

  const name = product || manufacturer || `USB Device ${vid.toString(16)}:${pid.toString(16)}`;

  // Heuristics
  if (isPrinter || KNOWN_PRINTER_VIDS.includes(vid)) {
    return { type: 'receipt_printer', confidence: 'high', name };
  }
  if (isHid && KNOWN_SCANNER_VIDS.includes(vid)) {
    return { type: 'barcode_scanner', confidence: 'high', name };
  }
  if (isHid) {
    // HID device — could be scanner or other input
    return { type: 'barcode_scanner', confidence: 'low', name };
  }

  return { type: 'barcode_scanner', confidence: 'low', name };
}

/**
 * Identify if a serial device is likely a scanner or printer.
 * Uses port name heuristics and common baud rates.
 */
function identifySerialDevice(portInfo: { path: string; manufacturer?: string; vendorId?: string; productId?: string }): { type: DeviceType; confidence: 'high' | 'medium' | 'low'; name: string } {
  const path = portInfo.path.toLowerCase();
  const manufacturer = (portInfo.manufacturer || '').toLowerCase();

  // Common scanner manufacturers
  const SCANNER_MANUFACTURERS = ['symbol', 'motorola', 'zebra', 'honeywell', 'datalogic', 'newland', 'sunmi'];
  const PRINTER_MANUFACTURERS = ['epson', 'star', 'bixolon', 'xprinter', 'gprinter', 'custom', 'rongta'];

  for (const m of SCANNER_MANUFACTURERS) {
    if (manufacturer.includes(m)) return { type: 'barcode_scanner', confidence: 'high', name: portInfo.manufacturer || 'Barcode Scanner' };
  }
  for (const m of PRINTER_MANUFACTURERS) {
    if (manufacturer.includes(m)) return { type: 'receipt_printer', confidence: 'high', name: portInfo.manufacturer || 'Thermal Printer' };
  }

  // Path heuristics
  if (path.includes('com') || path.includes('ttyusb') || path.includes('ttyacm')) {
    return { type: 'barcode_scanner', confidence: 'medium', name: 'Serial Device' };
  }

  return { type: 'barcode_scanner', confidence: 'low', name: 'Serial Device' };
}

/**
 * Probe a network host for ESC/POS printer on port 9100.
 * Returns true if a printer responds.
 */
async function probeNetworkPrinter(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let responded = false;

    socket.setTimeout(timeoutMs);

    socket.once('connect', () => {
      // Send ESC @ (init) and GS r 1 (status request)
      socket.write(Buffer.from([0x1b, 0x40, 0x1d, 0x72, 0x01]), () => {
        // Wait for response
        setTimeout(() => {
          if (!responded) {
            responded = true;
            socket.destroy();
            resolve(true); // Connected and accepted data — likely a printer
          }
        }, 500);
      });
    });

    socket.once('data', () => {
      if (!responded) {
        responded = true;
        socket.destroy();
        resolve(true);
      }
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect({ host, port });
  });
}

// ==== Discovery Service ====

export class HardwareDiscoveryService extends EventEmitter {
  private options: DiscoveryOptions;
  private knownDevices: Map<string, DetectedDevice> = new Map();
  private isScanning = false;
  private scanInterval: NodeJS.Timeout | null = null;

  constructor(options: Partial<DiscoveryOptions> = {}) {
    super();
    this.options = { ...DEFAULT_DISCOVERY_OPTIONS, ...options };
    this.setMaxListeners(50);
  }

  /** Update discovery options */
  setOptions(options: Partial<DiscoveryOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /** Get all known devices */
  getKnownDevices(): DetectedDevice[] {
    return Array.from(this.knownDevices.values());
  }

  /** Get devices by type */
  getDevicesByType(type: DeviceType): DetectedDevice[] {
    return this.getKnownDevices().filter(d => d.deviceType === type);
  }

  /** Get a specific device by ID */
  getDevice(deviceId: string): DetectedDevice | undefined {
    return this.knownDevices.get(deviceId);
  }

  /** Scan for all available devices */
  async scan(): Promise<DetectedDevice[]> {
    if (this.isScanning) return this.getKnownDevices();
    this.isScanning = true;
    this.emit('scan:start');

    const detected: DetectedDevice[] = [];

    try {
      // Scan serial ports
      if (this.options.scanSerial) {
        const serialDevices = await this.scanSerialPorts();
        detected.push(...serialDevices);
      }

      // Scan USB devices
      if (this.options.scanUsb) {
        const usbDevices = await this.scanUsbDevices();
        detected.push(...usbDevices);
      }

      // Scan network printers
      if (this.options.scanNetwork) {
        const networkDevices = await this.scanNetworkPrinters();
        detected.push(...networkDevices);
      }

      // Development mock devices. Gated by USE_MOCK_PERIPHERALS, which is off in
      // production unless explicitly enabled, so a real cashier never sees a
      // fake scanner/printer that silently swallows a sale.
      if (USE_MOCK_PERIPHERALS) {
        detected.push(
          {
            deviceId: 'mock_barcode_scanner',
            deviceType: 'barcode_scanner',
            connectionType: 'serial_com',
            name: 'Mock Barcode Scanner (dev)',
            manufacturer: 'Shega',
            model: 'Mock',
            port: 'MOCK-SCAN',
            baudRate: 9600,
            protocol: 'HID',
            confidence: 'high',
            previouslyConfigured: this.options.knownDeviceIds?.includes('mock_barcode_scanner') || false,
            lastSeen: Date.now(),
            available: true,
          },
          {
            deviceId: 'mock_receipt_printer',
            deviceType: 'receipt_printer',
            connectionType: 'network_tcp',
            name: 'Mock Receipt Printer (dev)',
            manufacturer: 'Shega',
            model: 'Mock',
            host: 'mock.local',
            networkPort: 9100,
            protocol: 'ESC/POS',
            confidence: 'high',
            previouslyConfigured: this.options.knownDeviceIds?.includes('mock_receipt_printer') || false,
            lastSeen: Date.now(),
            available: true,
          }
        );
      }
    } catch (err) {
      this.emit('error', { phase: 'scan', error: err instanceof Error ? err.message : String(err) });
    }

    // Merge with known devices
    for (const device of detected) {
      const existing = this.knownDevices.get(device.deviceId);
      if (existing) {
        // Update existing device
        existing.lastSeen = Date.now();
        existing.available = true;
        existing.previouslyConfigured = device.previouslyConfigured;
      } else {
        // New device
        this.knownDevices.set(device.deviceId, device);
      }
    }

    // Mark devices that weren't detected as unavailable
    const detectedIds = new Set(detected.map(d => d.deviceId));
    for (const [id, device] of this.knownDevices) {
      if (!detectedIds.has(id)) {
        device.available = false;
      }
    }

    this.isScanning = false;
    this.emit('scan:complete', { devices: this.getKnownDevices() });
    return this.getKnownDevices();
  }

  /** Scan serial/COM ports */
  private async scanSerialPorts(): Promise<DetectedDevice[]> {
    const devices: DetectedDevice[] = [];

    try {
      const ports = await SerialPort.list();
      for (const port of ports) {
        const identification = identifySerialDevice(port);
        const deviceId = generateDeviceId('serial_com', { port: port.path });

        devices.push({
          deviceId,
          deviceType: identification.type,
          connectionType: 'serial_com',
          name: identification.name,
          manufacturer: port.manufacturer,
          port: port.path,
          baudRate: 9600, // Default, will be configured by user
          protocol: identification.type === 'receipt_printer' ? 'ESC/POS' : 'HID',
          confidence: identification.confidence,
          previouslyConfigured: this.options.knownDeviceIds?.includes(deviceId) || false,
          lastSeen: Date.now(),
          available: true,
        });
      }
    } catch (err) {
      this.emit('error', { phase: 'serial-scan', error: err instanceof Error ? err.message : String(err) });
    }

    return devices;
  }

  /** Scan USB devices */
  private async scanUsbDevices(): Promise<DetectedDevice[]> {
    const devices: DetectedDevice[] = [];

    try {
      const usb = getUsb();
      if (!usb) return devices; // native module unavailable — skip USB silently
      const knownDevices = usb.knownDevices || {};
      for (const [key, device] of Object.entries(knownDevices)) {
        const d = device as any;
        if (!d.deviceDescriptor) continue;

        const desc = d.deviceDescriptor;
        const identification = identifyUsbDevice(d);

        // Determine connection type based on device class
        const isPrinterClass = desc.bDeviceClass === 7;
        const connectionType: ConnectionType = isPrinterClass ? 'usb_raw' : 'usb_hid';

        const deviceId = generateDeviceId(connectionType, {
          vendorId: desc.idVendor,
          productId: desc.idProduct,
        });

        devices.push({
          deviceId,
          deviceType: identification.type,
          connectionType,
          name: identification.name,
          manufacturer: desc.iManufacturer ? `VID:${desc.idVendor.toString(16)}` : undefined,
          model: desc.iProduct ? `PID:${desc.idProduct.toString(16)}` : undefined,
          vendorId: desc.idVendor,
          productId: desc.idProduct,
          protocol: identification.type === 'receipt_printer' ? 'ESC/POS' : 'HID',
          confidence: identification.confidence,
          previouslyConfigured: this.options.knownDeviceIds?.includes(deviceId) || false,
          lastSeen: Date.now(),
          available: true,
        });
      }
    } catch (err) {
      this.emit('error', { phase: 'usb-scan', error: err instanceof Error ? err.message : String(err) });
    }

    return devices;
  }

  /** Scan network for ESC/POS printers */
  private async scanNetworkPrinters(): Promise<DetectedDevice[]> {
    const devices: DetectedDevice[] = [];
    const hosts = this.options.knownNetworkHosts || [];
    const timeout = this.options.networkTimeoutMs || 2000;

    // Also try common local network ranges
    const localHosts = this.getLocalNetworkHosts();
    const allHosts = [...new Set([...hosts, ...localHosts])];

    for (const host of allHosts) {
      try {
        const isPrinter = await probeNetworkPrinter(host, 9100, timeout);
        if (isPrinter) {
          const deviceId = generateDeviceId('network_tcp', { host, networkPort: 9100 });
          devices.push({
            deviceId,
            deviceType: 'receipt_printer',
            connectionType: 'network_tcp',
            name: 'Network Printer',
            host,
            networkPort: 9100,
            protocol: 'ESC/POS',
            confidence: 'medium',
            previouslyConfigured: this.options.knownDeviceIds?.includes(deviceId) || false,
            lastSeen: Date.now(),
            available: true,
          });
        }
      } catch {
        // Ignore individual host errors
      }
    }

    return devices;
  }

  /** Get local network hosts to probe */
  private getLocalNetworkHosts(): string[] {
    const hosts: string[] = [];
    try {
      const os = require('os');
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
          if (iface.family === 'IPv4' && !iface.internal) {
            // Probe common printer IPs on same subnet
            const parts = iface.address.split('.');
            if (parts.length === 4) {
              const subnet = `${parts[0]}.${parts[1]}.${parts[2]}`;
              // Probe common printer IPs
              for (const last of [100, 101, 102, 103, 104, 105, 150, 200, 254]) {
                hosts.push(`${subnet}.${last}`);
              }
            }
          }
        }
      }
    } catch {
      // Ignore
    }
    return hosts;
  }

  /** Start periodic auto-discovery */
  startAutoDiscovery(intervalMs: number = 30000): void {
    if (this.scanInterval) return;
    this.scanInterval = setInterval(() => {
      this.scan().catch(() => {});
    }, intervalMs);
  }

  /** Stop periodic auto-discovery */
  stopAutoDiscovery(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  /** Remove a device from known devices */
  removeDevice(deviceId: string): void {
    this.knownDevices.delete(deviceId);
  }

  /** Clear all known devices */
  clear(): void {
    this.knownDevices.clear();
  }
}

// Singleton
export const hardwareDiscoveryService = new HardwareDiscoveryService();