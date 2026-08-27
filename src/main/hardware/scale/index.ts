// ============================================
// Digital Weight Scale Driver - Desktop
// Supports: CAS, Dibal, Mettler-Toledo, Generic RS-232/USB Serial
// ============================================

import { EventEmitter } from 'events';
import { logger } from '../logger';
import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';

// ============================================
// Types
// ============================================

export interface ScaleReading {
  weightKg: number | null;
  unit: string;
  stable: boolean;
  zero: boolean;
  net: boolean;
  raw: string;
  timestamp: number;
}

export interface ScaleConfig {
  type: 'cas' | 'dibal' | 'mettler' | 'generic' | 'auto';
  baudRate?: number;
  dataBits?: number;
  stopBits?: number;
  parity?: 'none' | 'even' | 'odd' | 'mark' | 'space';
  path?: string;
  vendorId?: number;
  productId?: number;
  // Protocol options
  protocol?: 'continuous' | 'poll' | 'command';
  pollInterval?: number;
  command?: string; // Command to send for weight request
  // Stability
  stableThreshold?: number; // ms weight must be stable
  stableSamples?: number;   // consecutive stable readings required
}

export interface ScaleDeviceInfo {
  vendorId: number;
  productId: number;
  manufacturer: string;
  productName: string;
  serialNumber: string;
}

type ScaleEventMap = {
  reading: [ScaleReading];
  stable: [ScaleReading];
  unstable: [ScaleReading];
  zero: [ScaleReading];
  error: [Error];
  connected: [ScaleDeviceInfo];
  disconnected: [string];
};

const STABLE_MARKERS = ['S', 'T', 'ST'];
const UNSTABLE_MARKERS = ['D', 'I', 'U', 'US', 'UNSTABLE'];

export class ScaleDriver extends EventEmitter<ScaleEventMap> {
  private port: SerialPort | null = null;
  private parser: DelimiterParser | null = null;
  private config: Required<ScaleConfig>;
  private isConnected = false;
  private deviceInfo: ScaleDeviceInfo | null = null;
  private readingBuffer = '';
  private debouncer: any = null;

  constructor(config: ScaleConfig = {}) {
    super();
    this.config = {
      type: config.type || 'auto',
      baudRate: config.baudRate || 9600,
      dataBits: config.dataBits || 8,
      stopBits: config.stopBits || 1,
      parity: config.parity || 'none',
      path: config.path || '',
      vendorId: config.vendorId || 0,
      productId: config.productId || 0,
      protocol: config.protocol || 'continuous',
      pollInterval: config.pollInterval || 1000,
      command: config.command || '',
      stableThreshold: config.stableThreshold || 300,
      stableSamples: config.stableSamples || 3,
    };
  }

  // ============================================
  // Connection Management
  // ============================================

  async connect(path?: string): Promise<void> {
    if (this.isConnected) return;

    const portPath = path || this.config.path;
    if (!portPath) {
      // Auto-detect scale port
      const ports = await SerialPort.list();
      const scalePort = ports.find(p => 
        (this.config.vendorId && p.vendorId === this.config.vendorId) ||
        (this.config.productId && p.productId === this.config.productId) ||
        p.manufacturer?.toLowerCase().includes('scale') ||
        p.manufacturer?.toLowerCase().includes('cas') ||
        p.manufacturer?.toLowerCase().includes('dibal') ||
        p.manufacturer?.toLowerCase().includes('mettler') ||
        p.friendlyName?.toLowerCase().includes('scale')
      );

      if (!scalePort) {
        throw new Error('Scale port not found. Please specify path manually.');
      }
      this.connect(scalePort.path);
      return;
    }

    this.port = new SerialPort({
      path,
      baudRate: this.config.baudRate,
      dataBits: this.config.dataBits,
      stopBits: this.config.stopBits,
      parity: this.config.parity,
      autoOpen: false,
    });

    this.parser = this.port.pipe(new DelimiterParser({ delimiter: '\r\n' }));

    return new Promise((resolve, reject) => {
      this.port!.open((err) => {
        if (err) {
          logger.error('[Scale] Failed to open port:', err);
          reject(err);
          return;
        }

        // Setup parser
        this.parser!.on('data', this.handleData.bind(this));
        
        this.port!.on('error', (err) => this.emit('error', err));
        this.port!.on('close', () => this.handleDisconnect());

        // Get device info
        this.getDeviceInfo();

        this.isConnected = true;
        logger.info(`[Scale] Connected to ${path}`);
        this.emit('connected', this.deviceInfo!);
        resolve();
      });
    });
  }

  private async getDeviceInfo(): Promise<void> {
    try {
      // Try to get device info via USB
      const usb = await import('usb');
      const devices = usb.getDeviceList();
      const device = usb.findByIds(
        this.config.vendorId || 0,
        this.config.productId || 0
      );

      if (device) {
        this.deviceInfo = {
          vendorId: device.deviceDescriptor.idVendor,
          productId: device.deviceDescriptor.idProduct,
          manufacturer: await this.getStringDescriptor(device, device.deviceDescriptor.iManufacturer),
          productName: await this.getStringDescriptor(device, device.deviceDescriptor.iProduct),
          serialNumber: await this.getStringDescriptor(device, device.deviceDescriptor.iSerialNumber),
        };
      }
    } catch (e) {
      logger.warn('[Scale] Could not get device info:', e);
    }
  }

  private async getStringDescriptor(device: any, index: number): Promise<string> {
    if (!index) return '';
    try {
      return await new Promise<string>((resolve) => {
        device.getStringDescriptor(index, (err: Error | null, data: string) => {
          resolve(err ? '' : data);
        });
      });
    } catch {
      return '';
    }
  }

  private handleDisconnect(): void {
    this.isConnected = false;
    if (this.debouncer) {
      clearTimeout(this.debouncer);
      this.debouncer = null;
    }
    this.emit('disconnected', 'Scale disconnected');
  }

  async disconnect(): Promise<void> {
    if (this.port) {
      this.port.close();
      this.port = null;
      this.parser = null;
    }
    this.isConnected = false;
  }

  // ============================================
  // Data Handling
  // ============================================

  private handleData(data: Buffer): void {
    const line = data.toString('utf8').trim();
    if (!line) return;

    const reading = this.parseWeightLine(line);
    if (!reading) return;

    this.emit('reading', reading);

    // Handle stability debouncing
    if (reading.stable) {
      if (this.debouncer) clearTimeout(this.debouncer);
      this.debouncer = setTimeout(() => {
        this.emit('stable', reading);
      }, this.config.stableThreshold);
    } else {
      if (this.debouncer) clearTimeout(this.debouncer);
      this.emit('unstable', reading);
    }

    if (reading.zero) {
      this.emit('zero', reading);
    }
  }

  // ============================================
  // Protocol Parsers
  // ============================================

  private parseWeightLine(line: string): ScaleReading | null {
    const raw = line.trim();
    if (!raw) return null;

    let stable = true;
    let zero = false;
    let net = false;
    let body = raw;
    const upper = raw.toUpperCase();

    // Check for protocol headers
    if (upper.startsWith('ST') || upper.startsWith('ST,') || upper.startsWith('S')) {
      stable = true;
      body = raw.replace(/^ST,?|^S,?/, '');
    } else if (upper.startsWith('US') || upper.startsWith('US,') || 
               UNSTABLE_MARKERS.some(m => upper.startsWith(m + ',') || upper.startsWith(m + ' '))) {
      stable = false;
      body = raw.replace(/^US,?|^U,?|^D,?|^I,?/, '');
    }

    if (/\bNET\b/i.test(upper)) net = true;
    if (/\bZERO\b/i.test(upper) || /^\s*0(\.0+)?\s*(kg|g)?\s*$/i.test(body)) zero = true;

    // Extract number + unit
    const match = body.match(/([-+]?\d+(?:\.\d+)?)\s*(kg|g|lb|oz)?/i);
    if (!match) return null;

    const num = parseFloat(match[1]);
    const unit = (match[2] || 'kg').toLowerCase();

    let weightKg: number;
    if (unit === 'g') weightKg = num / 1000;
    else if (unit === 'lb') weightKg = num * 0.45359237;
    else if (unit === 'oz') weightKg = num * 0.028349523125;
    else weightKg = num;

    if (weightKg < 0) weightKg = 0;

    return {
      weightKg,
      unit: unit === 'g' ? 'g' : unit,
      stable,
      zero,
      net,
      raw,
      timestamp: Date.now(),
    };
  }

  // ============================================
  // Public API
  // ============================================

  async connect(path?: string): Promise<void> {
    if (this.isConnected) return;
    // Implementation in connect method above
  }

  async disconnect(): Promise<void> {
    if (this.port) {
      this.port.close();
      this.port = null;
      this.parser = null;
    }
    this.isConnected = false;
  }

  isConnected(): boolean {
    return this.isConnected && this.port !== null;
  }

  getConfig(): Required<ScaleConfig> {
    return this.config;
  }

  getDeviceInfo(): any {
    return this.deviceInfo;
  }

  // Request weight (for poll/command mode)
  async requestWeight(): Promise<ScaleReading | null> {
    if (!this.isConnected || !this.port) return null;

    if (this.config.protocol === 'command' && this.config.command) {
      this.port.write(this.config.command + '\r\n');
    } else if (this.config.protocol === 'poll') {
      // Just wait for next reading
    }

    // Return a promise that resolves on next reading
    return new Promise((resolve) => {
      const handler = (reading: any) => {
        this.off('reading', handler);
        resolve(reading);
      };
      this.on('reading', handler);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        this.off('reading', handler);
        resolve(null);
      }, 5000);
    });
  }

  // Tare the scale (zero)
  async tare(): Promise<boolean> {
    if (!this.isConnected || !this.port) return false;
    
    // Common tare commands
    const tareCommands = ['T', 'TARE', '\x1BT', '\x02T'];
    
    for (const cmd of tareCommands) {
      try {
        this.port.write(cmd + '\r\n');
        await new Promise(r => setTimeout(r, 200));
        return true;
      } catch (e) {
        continue;
      }
    }
    return false;
  }

  // Send custom command
  async sendCommand(command: string): Promise<void> {
    if (!this.isConnected || !this.port) return;
    this.port.write(command + '\r\n');
  }

  isConnected(): boolean {
    return this.isConnected;
  }

  // Auto-detect scale type
  static async detectScaleType(portPath: string): Promise<string> {
    // Open port temporarily to detect
    const port = new SerialPort({ path: portPath, baudRate: 9600 });
    const parser = port.pipe(new DelimiterParser({ delimiter: '\r\n' }));

    return new Promise((resolve) => {
      let detected = 'generic';
      let samples = 0;

      const handler = (data: Buffer) => {
        samples++;
        const line = data.toString().toUpperCase();
        
        if (line.startsWith('ST') || line.includes('ST,') || line.startsWith('S')) {
          detected = 'cas';
        } else if (line.startsWith('ST,GS') || line.includes('METTLER')) {
          detected = 'mettler';
        } else if (line.startsWith('DIBAL') || line.includes('DIBAL')) {
          detected = 'dibal';
        }

        if (samples >= 5) {
          port.close();
          resolve(detected);
        }
      };

      parser.on('data', handler);

      setTimeout(() => {
        port.removeListener('data', handler);
        port.close();
        resolve(detected);
      }, 3000);
    });
  }
}

// ============================================
// USB Scale Support (HID or Bulk)
// ============================================

export class UsbScaleDriver extends EventEmitter {
  private device: any = null;
  private inEndpoint: any = null;
  private config: any;

  constructor(config: any = {}) {
    super();
    this.config = config;
  }

  async connect(vendorId: number, productId: number): Promise<void> {
    const usb = await import('usb');
    this.device = usb.findByIds(vendorId, productId);
    if (!this.device) throw new Error('USB scale not found');

    this.device.open();
    const iface = this.device.interface(0);
    iface.claim();

    for (const ep of iface.endpoints) {
      if (ep.direction === 'in' && ep.type === 'interrupt') {
        this.inEndpoint = ep;
        break;
      }
    }

    if (!this.inEndpoint) throw new Error('No interrupt IN endpoint found');

    this.inEndpoint.startPoll(10, 64);
    this.inEndpoint.on('data', (data: Buffer) => {
      const reading = this.parseHidData(data);
      if (reading) this.emit('reading', reading);
    });
  }

  private parseHidData(data: Buffer): any | null {
    // HID scale report format varies by manufacturer
    // Typical: [report_id, status, weight_bytes...]
    if (data.length < 3) return null;

    const reportId = data[0];
    const status = data[1];
    const weightBytes = data.slice(2);

    // Parse based on known formats
    // This is manufacturer-specific
    return null;
  }

  disconnect(): void {
    if (this.inEndpoint) {
      this.inEndpoint.stopPoll();
    }
    if (this.device) {
      this.device.close();
    }
  }
}

export default {
  ScaleDriver,
  UsbScaleDriver,
};