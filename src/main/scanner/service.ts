/**
 * Desktop Barcode Scanner Service
 * Background listeners for:
 * - Serial/COM port scanners (wired RS-232, USB-to-serial)
 * - USB HID scanners (keyboard wedge via raw USB)
 *
 * Runs in Electron main process, emits barcode events to renderer via IPC
 */

import { EventEmitter } from 'events';
import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { getItemByBarcode } from '../database';
import { getActiveBusinessId } from '../ipc-handlers';

/**
 * `usb` is a native module with a compiled `.node` binding: it cannot be
 * required in a plain-Node context (the e2e sync harness bundles this file) and
 * may be missing from an install. Load it lazily and degrade to serial + HID
 * keyboard-wedge scanning when it is unavailable.
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

export interface BarcodeScanResult {
  code: string;
  symbology?: string;
  timestamp: number;
  source: 'serial' | 'usb_hid' | 'keyboard_wedge';
  portPath?: string;
  deviceInfo?: { vendorId: number; productId: number };
}

export interface ScannerConfig {
  serialPorts: Array<{
    path: string;
    baudRate: number;
    dataBits?: 7 | 8;
    stopBits?: 1 | 2;
    parity?: 'none' | 'even' | 'odd' | 'mark' | 'space';
    enabled: boolean;
  }>;
  usbHidDevices: Array<{
    vendorId: number;
    productId: number;
    enabled: boolean;
  }>;
  keyboardWedge: {
    enabled: boolean;
    prefix?: string;
    suffix?: string;
    minLength: number;
    maxLength: number;
    interKeyTimeoutMs: number;
  };
  /** Minimum time between duplicate scans (ms) */
  duplicateFilterMs: number;
  /** Auto-lookup product in DB and emit enriched event */
  autoLookup: boolean;
}

const DEFAULT_CONFIG: ScannerConfig = {
  serialPorts: [],
  usbHidDevices: [],
  keyboardWedge: {
    enabled: true,
    prefix: '',
    suffix: '\r',
    minLength: 3,
    maxLength: 64,
    interKeyTimeoutMs: 50,
  },
  duplicateFilterMs: 2000,
  autoLookup: true,
};

export class BarcodeScannerService extends EventEmitter {
  private config: ScannerConfig = DEFAULT_CONFIG;
  private serialPorts = new Map<string, { port: SerialPort; parser: DelimiterParser }>();
  private usbDevices = new Map<string, any>();
  private keyboardBuffer = '';
  private lastKeyTime = 0;
  private lastScanTime = new Map<string, number>();
  private isListening = false;
  private keyboardListener: ((e: any) => void) | null = null;

  constructor() {
    super();
    this.setMaxListeners(50);
  }

  /** Update configuration and restart listeners if needed */
  async setConfig(config: Partial<ScannerConfig>): Promise<void> {
    const wasListening = this.isListening;
    if (wasListening) await this.stop();

    this.config = { ...this.config, ...config };

    if (wasListening) await this.start();
  }

  getConfig(): ScannerConfig {
    return { ...this.config };
  }

  /** Start all configured listeners */
  async start(): Promise<void> {
    if (this.isListening) return;
    this.isListening = true;

    // Start serial port listeners
    for (const portConfig of this.config.serialPorts) {
      if (portConfig.enabled) {
        await this.openSerialPort(portConfig);
      }
    }

    // Start USB HID listeners
    for (const deviceConfig of this.config.usbHidDevices) {
      if (deviceConfig.enabled) {
        await this.openUsbHidDevice(deviceConfig);
      }
    }

    // Start keyboard wedge listener (main process global hook)
    if (this.config.keyboardWedge.enabled) {
      this.startKeyboardWedge();
    }

    // Listen for USB device hotplug
    const usb = getUsb();
    if (usb) {
      usb.deviceConnectCallback = this.onUsbAttach.bind(this);
      usb.deviceDisconnectCallback = this.onUsbDetach.bind(this);
    }
  }

  /** Stop all listeners */
  async stop(): Promise<void> {
    if (!this.isListening) return;
    this.isListening = false;

    // Close serial ports
    for (const [path, { port }] of this.serialPorts) {
      try {
        port.close();
      } catch {}
    }
    this.serialPorts.clear();

    // Close USB devices
    for (const device of this.usbDevices.values()) {
      try {
        device.close();
      } catch {}
    }
    this.usbDevices.clear();

    // Stop keyboard wedge
    this.stopKeyboardWedge();

    // Remove USB hotplug listeners
    const usb = getUsb();
    if (usb) {
      usb.deviceConnectCallback = null;
      usb.deviceDisconnectCallback = null;
    }
  }

  /** Open a serial port for barcode scanning */
  private async openSerialPort(portConfig: ScannerConfig['serialPorts'][0]): Promise<void> {
    const { path, baudRate, dataBits = 8, stopBits = 1, parity = 'none' } = portConfig;

    try {
      const port = new SerialPort({
        path,
        baudRate,
        dataBits,
        stopBits,
        parity,
        autoOpen: false,
        lock: true,
      });

      // Most barcode scanners send LF/CR terminated strings
      const parser = port.pipe(new DelimiterParser({ delimiter: Buffer.from([0x0d, 0x0a]) }));

      parser.on('data', (data: Buffer) => {
        const code = data.toString('ascii').trim();
        if (code) this.handleScan(code, 'serial', { portPath: path } as any);
      });

      port.on('error', (err) => {
        this.emit('error', { source: 'serial', portPath: path, error: err.message });
      });

      port.on('close', () => {
        this.serialPorts.delete(path);
        // Auto-reconnect if still enabled
        if (this.isListening && this.config.serialPorts.find(p => p.path === path)?.enabled) {
          setTimeout(() => this.openSerialPort(portConfig), 5000);
        }
      });

      await new Promise<void>((resolve, reject) => {
        port.open((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      this.serialPorts.set(path, { port, parser });
    } catch (err) {
      this.emit('error', { source: 'serial', portPath: path, error: err instanceof Error ? err.message : String(err) });
    }
  }

  /** Open a USB HID device for raw barcode reading */
  private async openUsbHidDevice(deviceConfig: ScannerConfig['usbHidDevices'][0]): Promise<void> {
    const { vendorId, productId } = deviceConfig;
    const key = `${vendorId}:${productId}`;

    try {
      const usb = getUsb();
      if (!usb) {
        this.emit('error', { source: 'usb_hid', key, error: 'USB module unavailable' });
        return;
      }
      // Find device in knownDevices
      const knownDevices = (usb as any).knownDevices || {};
      let device: any = null;
      for (const [, d] of Object.entries(knownDevices)) {
        const desc = (d as any).deviceDescriptor;
        if (desc && desc.idVendor === vendorId && desc.idProduct === productId) {
          device = d;
          break;
        }
      }

      if (!device) {
        this.emit('error', { source: 'usb_hid', key, error: 'Device not found' });
        return;
      }

      await new Promise<void>((resolve, reject) => {
        device.open((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Find HID interface (class 3)
      const iface = device.interfaces.find((i: any) => i.descriptor.bInterfaceClass === 3);
      if (!iface) {
        this.emit('error', { source: 'usb_hid', key, error: 'No HID interface found' });
        device.close();
        return;
      }

      await new Promise<void>((resolve, reject) => {
        iface.claim((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Find interrupt IN endpoint
      const inEndpoint = iface.endpoints.find((e: any) => e.direction === 'in' && e.type === 'interrupt');
      if (!inEndpoint) {
        this.emit('error', { source: 'usb_hid', key, error: 'No interrupt IN endpoint' });
        await this.releaseInterface(iface);
        device.close();
        return;
      }

      // Start polling
      const poll = () => {
        if (!this.isListening || !this.usbDevices.has(key)) return;
        inEndpoint.transfer(64, (err: any, data: any) => {
          if (!this.isListening) return;
          if (err) {
            this.emit('error', { source: 'usb_hid', key, error: err.message });
            // Reconnect after delay
            setTimeout(poll, 1000);
            return;
          }
          if (data && data.length > 0) {
            this.handleUsbHidData(data, key, { vendorId, productId });
          }
          // Poll at reasonable rate
          setTimeout(poll, 10);
        });
      };
      poll();

      this.usbDevices.set(key, device);
    } catch (err: any) {
      this.emit('error', { source: 'usb_hid', key, error: err instanceof Error ? err.message : String(err) });
    }
  }

  private async releaseInterface(iface: any): Promise<void> {
    return new Promise((resolve) => {
      iface.release(() => resolve());
    });
  }

  /** Handle USB HID raw report data */
  private handleUsbHidData(data: Buffer, key: string, deviceInfo: { vendorId: number; productId: number }) {
    // USB HID barcode scanners typically send usage-page 0x07 (keyboard) reports
    // Format: [modifier, reserved, key1, key2, key3, key4, key5, key6]
    // We need to parse HID keyboard usage codes to characters
    // This is a simplified parser; real implementation needs full HID usage table

    // For now, try to extract printable ASCII from report
    let code = '';
    for (let i = 2; i < data.length; i++) {
      const usage = data[i];
      if (usage === 0) continue;
      const ch = this.hidUsageToChar(usage);
      if (ch) code += ch;
    }

    if (code) this.handleScan(code, 'usb_hid', { deviceInfo } as any);
  }

  /** Map HID keyboard usage codes to characters (US layout) */
  private hidUsageToChar(usage: number): string | null {
    // Simplified mapping for common barcode scanner outputs (numbers, letters, Enter)
    if (usage >= 0x1e && usage <= 0x27) return String.fromCharCode(0x61 + (usage - 0x1e)); // a-z
    if (usage >= 0x1f && usage <= 0x28) return String.fromCharCode(0x31 + (usage - 0x1f)); // 1-9,0
    if (usage === 0x28) return '\r'; // Enter
    if (usage === 0x2c) return ' ';  // Space
    if (usage === 0x2d) return '-';
    if (usage === 0x2e) return '=';
    if (usage === 0x2f) return '[';
    if (usage === 0x30) return ']';
    if (usage === 0x31) return '\\';
    if (usage === 0x33) return ';';
    if (usage === 0x34) return '\'';
    if (usage === 0x36) return ',';
    if (usage === 0x37) return '.';
    if (usage === 0x38) return '/';
    return null;
  }

  /** Handle USB hotplug attach */
  private onUsbAttach(device: any) {
    const key = `${device.deviceDescriptor.idVendor}:${device.deviceDescriptor.idProduct}`;
    const config = this.config.usbHidDevices.find(d => d.vendorId === device.deviceDescriptor.idVendor && d.productId === device.deviceDescriptor.idProduct);
    if (config?.enabled && !this.usbDevices.has(key)) {
      this.openUsbHidDevice(config).catch(() => {});
    }
  }

  /** Handle USB hotplug detach */
  private onUsbDetach(device: any) {
    const key = `${device.deviceDescriptor.idVendor}:${device.deviceDescriptor.idProduct}`;
    const existing = this.usbDevices.get(key);
    if (existing) {
      try { existing.close(); } catch {}
      this.usbDevices.delete(key);
    }
  }

  /** Start global keyboard wedge listener (main process) */
  private startKeyboardWedge() {
    if (this.keyboardListener) return;

    // In Electron main process, we can use a global hook via native module
    // For now, we'll expose a function for renderer to call when input is focused
    // The real implementation would use `iohook` or similar native module
    // This is a placeholder for the architecture
  }

  private stopKeyboardWedge() {
    if (this.keyboardListener) {
      // Remove global hook
      this.keyboardListener = null;
    }
  }

  /** Process a scanned barcode from any source */
  private async handleScan(code: string, source: BarcodeScanResult['source'], extra: BarcodeScanResult) {
    const now = Date.now();
    const lastScan = this.lastScanTime.get(code) ?? 0;

    // Duplicate filter
    if (now - lastScan < this.config.duplicateFilterMs) return;
    this.lastScanTime.set(code, now);

    // Apply keyboard wedge prefix/suffix stripping if applicable
    if (source === 'keyboard_wedge') {
      const { prefix, suffix } = this.config.keyboardWedge;
      if (prefix && code.startsWith(prefix)) code = code.slice(prefix.length);
      if (suffix && code.endsWith(suffix)) code = code.slice(0, -suffix.length);
    }

    // Validate length
    const { minLength, maxLength } = this.config.keyboardWedge;
    if (code.length < minLength || code.length > maxLength) return;

    const result: BarcodeScanResult = {
      ...extra,
      code,
      timestamp: now,
      source,
    };

    // Auto-lookup product
    if (this.config.autoLookup) {
      try {
        const bizId = getActiveBusinessId();
        if (bizId) {
          const item = getItemByBarcode(code, true);
          if (item) {
            (result as any).item = item;
          }
        }
      } catch {
        // Ignore lookup errors
      }
    }

    this.emit('scan', result);
    this.emit(`scan:${source}`, result);
  }

  /** Get list of available serial ports */
  static async listSerialPorts(): Promise<Array<{ path: string; manufacturer?: string; vendorId?: string; productId?: string }>> {
    const { SerialPort } = await import('serialport');
    return SerialPort.list();
  }

  /** Get list of USB HID devices */
  static listUsbHidDevices(): Array<{ vendorId: number; productId: number; manufacturer?: string; product?: string }> {
    const devices: Array<{ vendorId: number; productId: number; manufacturer?: string; product?: string }> = [];
    try {
      const usb = getUsb();
      if (!usb) return devices;
      const knownDevices = usb.knownDevices || {};
      for (const [, device] of Object.entries(knownDevices)) {
        const d = device as any;
        if (!d.deviceDescriptor) continue;
        const desc = d.deviceDescriptor;
        devices.push({
          vendorId: desc.idVendor,
          productId: desc.idProduct,
          manufacturer: desc.iManufacturer,
          product: desc.iProduct,
        });
      }
    } catch {
      // Ignore
    }
    return devices;
  }
}

// Singleton
export const barcodeScannerService = new BarcodeScannerService();