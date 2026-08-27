import { EventEmitter } from 'events';
import { EscposWriter } from '../escpos';
import { logger } from '../logger';

// ============================================
// Transport Interface
// ============================================

export type PrinterTransportType = 'usb' | 'tcp' | 'bluetooth' | 'file';

export interface PrinterTransportConfig {
  type: PrinterTransportType;
  // USB
  vendorId?: number;
  productId?: number;
  interfaceNumber?: number;
  // TCP
  host?: string;
  port?: number;
  // Bluetooth
  deviceId?: string;
  serviceUuid?: string;
  // File (for testing)
  path?: string;
}

export interface PrinterTransport {
  connect(config: PrinterTransportConfig): Promise<void>;
  write(data: Uint8Array): Promise<void>;
  close(): Promise<void>;
  isConnected(): boolean;
  getType(): PrinterTransportType;
}

// ============================================
// USB Transport (using `usb` package)
// ============================================

export class UsbTransport extends EventEmitter implements PrinterTransport {
  private device: any = null;
  private outEndpoint: any = null;
  private inEndpoint: any = null;

  async connect(config: PrinterTransportConfig): Promise<void> {
    if (!config.vendorId || !config.productId) {
      throw new Error('USB transport requires vendorId and productId');
    }

    // Dynamic import to avoid issues if usb not available
    const usb = await import('usb');

    this.device = usb.findByIds(config.vendorId, config.productId);
    if (!this.device) {
      throw new Error(`USB device not found: ${config.vendorId.toString(16)}:${config.productId.toString(16)}`);
    }

    this.device.open();
    this.device.interface(config.interfaceNumber || 0).claim();

    // Find endpoints
    const iface = this.device.interface(config.interfaceNumber || 0);
    for (const ep of iface.endpoints) {
      if (ep.direction === 'out' && ep.type === 2) { // bulk out
        this.outEndpoint = ep;
      } else if (ep.direction === 'in' && ep.type === 2) { // bulk in
        this.inEndpoint = ep;
      }
    }

    if (!this.outEndpoint) {
      throw new Error('No bulk OUT endpoint found');
    }

    // Start listening for incoming data (status)
    if (this.inEndpoint) {
      this.inEndpoint.startPoll(1, 64);
      this.inEndpoint.on('data', (data: Buffer) => {
        this.emit('data', data);
      });
      this.inEndpoint.on('error', (err: Error) => {
        this.emit('error', err);
      });
    }

    logger.info(`[USB] Connected to printer ${config.vendorId.toString(16)}:${config.productId.toString(16)}`);
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.outEndpoint) throw new Error('USB not connected');

    return new Promise((resolve, reject) => {
      this.outEndpoint.transfer(Buffer.from(data), (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async close(): Promise<void> {
    if (this.device) {
      try {
        if (this.inEndpoint) this.inEndpoint.stopPoll();
        this.device.close();
      } catch (e) {
        logger.warn('[USB] Error closing:', e);
      }
      this.device = null;
      this.outEndpoint = null;
      this.inEndpoint = null;
    }
  }

  isConnected(): boolean {
    return this.device !== null && this.outEndpoint !== null;
  }

  getType(): 'usb' {
    return 'usb';
  }
}

// ============================================
// TCP/IP Transport (Network printer)
// ============================================

export class TcpTransport extends EventEmitter implements PrinterTransport {
  private net = await import('net');
  private socket: any = null;
  private writeQueue: Promise<void> = Promise.resolve();

  async connect(config: PrinterTransportConfig): Promise<void> {
    if (!config.host || !config.port) {
      throw new Error('TCP transport requires host and port');
    }

    return new Promise((resolve, reject) => {
      this.socket = this.net.connect({ host: config.host, port: config.port }, () => {
        logger.info(`[TCP] Connected to printer at ${config.host}:${config.port}`);
        resolve();
      });

      this.socket.on('data', (data: Buffer) => {
        this.emit('data', data);
      });

      this.socket.on('close', () => {
        logger.warn('[TCP] Connection closed');
        this.emit('close');
      });

      this.socket.on('error', (err: Error) => {
        logger.error('[TCP] Error:', err);
        this.emit('error', err);
        reject(err);
      });

      this.socket.setTimeout(5000);
      this.socket.on('timeout', () => {
        logger.error('[TCP] Connection timeout');
        this.socket.destroy();
        reject(new Error('Connection timeout'));
      });
    });
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.socket || this.socket.destroyed) {
      throw new Error('TCP not connected');
    }

    return new Promise((resolve, reject) => {
      this.socket.write(Buffer.from(data), (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async close(): Promise<void> {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket !== null && !this.socket.destroyed;
  }

  getType(): 'tcp' {
    return 'tcp';
  }
}

// ============================================
// Bluetooth Transport (using node-bluetooth or similar)
// ============================================

export class BluetoothTransport extends EventEmitter implements PrinterTransport {
  private device: any = null;
  private socket: any = null;

  async connect(config: PrinterTransportConfig): Promise<void> {
    if (!config.deviceId) {
      throw new Error('Bluetooth transport requires deviceId');
    }

    // Dynamic import - requires node-bluetooth or similar
    // This is a placeholder implementation
    throw new Error('Bluetooth transport not yet implemented - requires node-bluetooth or similar package');
  }

  async write(data: Uint8Array): Promise<void> {
    throw new Error('Not implemented');
  }

  async close(): Promise<void> {
    if (this.socket) {
      try { this.socket.destroy(); } catch {}
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return false;
  }

  getType(): 'bluetooth' {
    return 'bluetooth';
  }
}

// ============================================
// File Transport (for testing)
// ============================================

export class FileTransport extends EventEmitter implements PrinterTransport {
  private fs = await import('fs');
  private fd: number | null = null;
  private path: string = '';

  async connect(config: PrinterTransportConfig): Promise<void> {
    if (!config.path) {
      throw new Error('File transport requires path');
    }

    this.path = config.path;
    this.fd = this.fs.openSync(config.path, 'a');
    logger.info(`[FILE] Opened printer output file: ${config.path}`);
  }

  async write(data: Uint8Array): Promise<void> {
    if (this.fd === null) throw new Error('File not open');
    this.fs.writeSync(this.fd, Buffer.from(data));
  }

  async close(): Promise<void> {
    if (this.fd !== null) {
      this.fs.closeSync(this.fd);
      this.fd = null;
    }
  }

  isConnected(): boolean {
    return this.fd !== null;
  }

  getType(): 'file' {
    return 'file';
  }
}

// ============================================
// Transport Factory
// ============================================

export function createTransport(type: PrinterTransportType): PrinterTransport {
  switch (type) {
    case 'usb': return new UsbTransport();
    case 'tcp': return new TcpTransport();
    case 'bluetooth': return new BluetoothTransport();
    case 'file': return new FileTransport();
    default: throw new Error(`Unknown transport type: ${type}`);
  }
}

// ============================================
// ESC/POS Driver with Multi-Transport Support
// ============================================

export interface PrinterConfig {
  transport: PrinterTransportType;
  // USB
  vendorId?: number;
  productId?: number;
  interfaceNumber?: number;
  // TCP
  host?: string;
  port?: number;
  // Bluetooth
  deviceId?: string;
  serviceUuid?: string;
  // File
  path?: string;
  // Common
  drawerPin?: 2 | 5;
  autoOpenDrawer?: boolean;
  enabled?: boolean;
  encoding?: 'utf8' | 'cp437' | 'cp936' | 'cp949';
}

export class EscposDriver extends EventEmitter {
  private transport: PrinterTransport | null = null;
  private config: PrinterConfig | null = null;
  private writer: EscposWriter;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor() {
    super();
    this.writer = new EscposWriter();
  }

  async connect(config: PrinterConfig): Promise<void> {
    if (this.transport && this.transport.isConnected()) {
      await this.disconnect();
    }

    this.config = config;
    this.transport = createTransport(config.transport);

    this.transport.on('data', (data: Buffer) => {
      this.emit('data', data);
    });
    this.transport.on('error', (err: Error) => {
      this.emit('error', err);
    });
    this.transport.on('close', () => {
      this.emit('close');
    });

    const transportConfig = {
      type: config.transport,
      vendorId: config.vendorId,
      productId: config.productId,
      interfaceNumber: config.interfaceNumber,
      host: config.host,
      port: config.port,
      deviceId: config.deviceId,
      serviceUuid: config.serviceUuid,
      path: config.path,
    };

    await this.transport.connect(transportConfig);
    this.emit('connected');
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
  }

  // Simple FIFO queue to prevent interleaving
  private enqueue(fn: () => Promise<void>): Promise<void> {
    const run = this.writeQueue.then(fn);
    this.writeQueue = run.catch(() => {});
    return run;
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.transport || !this.transport.isConnected()) {
      throw new Error('Printer not connected');
    }
    await this.enqueue(async () => {
      await this.transport!.write(data);
    });
  }

  // High-level ESC/POS commands
  async init(): Promise<void> {
    await this.write(this.writer.init().toUint8Array());
  }

  async printText(text: string, options?: { bold?: boolean; align?: 0 | 1 | 2; size?: { width: number; height: number } }): Promise<void> {
    const w = new EscposWriter();
    if (options?.align !== undefined) w.align(options.align);
    if (options?.bold) w.bold(true);
    if (options?.size) w.size(options.size.width, options.size.height);
    w.text(text).lineFeed();
    await this.write(w.toUint8Array());
  }

  async printReceipt(lines: { label: string; value: string }[]): Promise<void> {
    const w = new EscposWriter().init();
    w.align(1).bold(true).text('RECEIPT').lineFeed().bold(false).align(0);
    
    for (const line of lines) {
      w.column(line.label, line.value, 42);
    }
    
    w.cut(true);
    await this.write(w.toUint8Array());
  }

  async printBarcode(data: string, type: 'ean13' | 'code128' | 'qr' = 'code128'): Promise<void> {
    const w = new EscposWriter();
    if (type === 'ean13') w.barcodeEan13(data);
    else if (type === 'code128') w.barcodeCode128(data);
    else w.qr(data);
    await this.write(w.toUint8Array());
  }

  async cut(partial: boolean = true): Promise<void> {
    const w = new EscposWriter().cut(partial);
    await this.write(w.toUint8Array());
  }

  async openDrawer(pin: 2 | 5 = 2): Promise<void> {
    const w = new EscposWriter().init().openDrawer(this.config?.drawerPin || pin);
    await this.write(w.toUint8Array());
  }

  async printImage(imageData: Uint8Array, width: number): Promise<void> {
    const w = new EscposWriter();
    w.raster(imageData, width);
    await this.write(w.toUint8Array());
  }

  isConnected(): boolean {
    return this.transport?.isConnected() ?? false;
  }

  getConfig(): PrinterConfig | null {
    return this.config;
  }
}

export const escposDriver = new EscposDriver();

export function createEscposDriver(): EscposDriver {
  return new EscposDriver();
}

export default {
  createTransport,
  UsbTransport,
  TcpTransport,
  BluetoothTransport,
  FileTransport,
  EscposDriver,
  escposDriver,
};