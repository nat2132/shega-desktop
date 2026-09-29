/**
 * Desktop Printer Transport Factory & Manager
 * Centralizes transport creation, selection, and lifecycle
 */

import { IPrinterTransport, PrinterTransportConfig, TransportType, TransportFactory, PrinterStatus, TransportCapabilities, TransportError, TransportErrorCode } from '@shega/shared/peripherals/transport';
import { NetworkTcpTransport } from './transports/network';
import { SerialComTransport } from './transports/serial';
import { UsbRawTransport } from './transports/usb';

export class DesktopTransportFactory implements TransportFactory {
  private transports = new Map<TransportType, IPrinterTransport>();

  create(type: TransportType): IPrinterTransport | null {
    // Return existing instance if already created
    if (this.transports.has(type)) {
      return this.transports.get(type)!;
    }

    let transport: IPrinterTransport | null = null;
    switch (type) {
      case 'network_tcp':
        transport = new NetworkTcpTransport();
        break;
      case 'serial_com':
        transport = new SerialComTransport();
        break;
      case 'usb_raw':
        transport = new UsbRawTransport();
        break;
      default:
        return null;
    }

    this.transports.set(type, transport);
    return transport;
  }

  getSupportedTypes(): TransportType[] {
    return ['network_tcp', 'serial_com', 'usb_raw'];
  }

  getTransport(type: TransportType): IPrinterTransport | undefined {
    return this.transports.get(type);
  }

  async disconnectAll(): Promise<void> {
    for (const transport of this.transports.values()) {
      try {
        await transport.disconnect();
      } catch {
        // Ignore individual disconnect errors
      }
    }
  }

  getAllCapabilities(): Map<TransportType, TransportCapabilities> {
    const caps = new Map<TransportType, TransportCapabilities>();
    for (const type of this.getSupportedTypes()) {
      const t = this.create(type);
      if (t) caps.set(type, t.getCapabilities());
    }
    return caps;
  }
}

/**
 * Printer Manager — high-level API for the renderer
 * Handles config persistence, transport selection, and print jobs
 */

import { buildReceiptBytes, buildTestPageBytes, buildLabelBytes, EscposWriter } from '@shega/shared/peripherals/escpos-encoder';
import { getDb } from '../database';

const SETTING_KEY = 'printer_config';

export interface PrinterManagerConfig {
  id: string;
  name: string;
  type: string;
  params: Record<string, unknown>;
  paperWidth: 58 | 80;
  drawerPin?: 2 | 5;
  autoOpenDrawer?: boolean;
  enabled: boolean;
  isDefault: boolean;
}

export class PrinterManager {
  private factory = new DesktopTransportFactory();
  private currentTransport: IPrinterTransport | null = null;
  private currentConfig: PrinterManagerConfig | null = null;
  private writeQueue: Promise<void> = Promise.resolve();
  private isProcessing = false;

  /** Load saved config and connect */
  async initialize(): Promise<void> {
    const saved = await this.loadConfig();
    if (saved) {
      await this.selectTransport(saved.type as any, saved);
    }
  }

  /** Load printer config from database */
  private async loadConfig(): Promise<PrinterManagerConfig | null> {
    const db = getDb();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(SETTING_KEY) as { value: string } | undefined;
    if (!row) return null;

    try {
      const config = JSON.parse(row.value) as PrinterManagerConfig;
      return config;
    } catch {
      return null;
    }
  }

  /** Save printer config to database */
  async saveConfig(config: PrinterManagerConfig): Promise<void> {
    const db = getDb();
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(SETTING_KEY, JSON.stringify(config));
  }

  /** Select and connect a transport */
  async selectTransport(type: TransportType, config?: Partial<PrinterManagerConfig>): Promise<boolean> {
    // Disconnect current
    if (this.currentTransport) {
      await this.currentTransport.disconnect();
      this.currentTransport = null;
    }

    const transport = this.factory.create(type);
    if (!transport) {
      throw new TransportError(TransportErrorCode.INVALID_CONFIG, `Unsupported transport: ${type}`);
    }

    // Merge config
    const mergedConfig: PrinterManagerConfig = {
      type,
      name: this.getTransportName(type),
      params: {},
      paperWidth: 80,
      drawerPin: 2,
      autoOpenDrawer: false,
      enabled: true,
      id: `printer_${Date.now()}`,
      isDefault: true,
      ...config,
    } as PrinterManagerConfig;

    // Validate
    const validationError = transport.getCapabilities().available ? null : new TransportError(TransportErrorCode.NOT_AVAILABLE, `Transport ${type} not available`);
    if (validationError) throw validationError;

    // Connect
    const connected = await transport.connect(mergedConfig as any);
    if (!connected) {
      throw new TransportError(TransportErrorCode.CONNECTION_FAILED, `Failed to connect to ${type} printer`);
    }

    this.currentTransport = transport;
    this.currentConfig = mergedConfig;
    await this.saveConfig(mergedConfig as PrinterManagerConfig);
    return true;
  }

  /** Print raw ESC/POS bytes */
  async printRaw(data: Uint8Array): Promise<{ success: boolean; error?: string }> {
    if (!this.currentTransport || !this.currentConfig?.enabled) {
      return { success: false, error: 'No printer selected or disabled' };
    }

    return this.enqueue(async () => {
      const result = await this.currentTransport!.write(data);
      return result;
    });
  }

  /** Print a sale receipt */
  async printReceipt(payload: Parameters<typeof buildReceiptBytes>[0]): Promise<{ success: boolean; error?: string }> {
    const bytes = buildReceiptBytes(payload);
    return this.printRaw(bytes);
  }

  /** Print test page */
  async printTestPage(paperWidth: 58 | 80 = 80): Promise<{ success: boolean; error?: string }> {
    const bytes = buildTestPageBytes(paperWidth);
    return this.printRaw(bytes);
  }

  /** Print label */
  async printLabel(payload: Parameters<typeof buildLabelBytes>[0]): Promise<{ success: boolean; error?: string }> {
    const bytes = buildLabelBytes(payload);
    return this.printRaw(bytes);
  }

  /** Open cash drawer */
  async openDrawer(): Promise<{ success: boolean; error?: string }> {
    if (!this.currentTransport || !this.currentConfig?.enabled) {
      return { success: false, error: 'No printer selected or disabled' };
    }

    // ESC p command for drawer kick
    const writer = new EscposWriter();
    writer.openDrawer(this.currentConfig.drawerPin ?? 2);
    return this.printRaw(writer.toUint8Array());
  }

  /** Get current printer status */
  async getStatus(): Promise<PrinterStatus> {
    if (!this.currentTransport) {
      return { online: false, transport: 'network_tcp' };
    }
    return this.currentTransport.getStatus();
  }

  /** Get current config */
  getConfig(): PrinterManagerConfig | null {
    return this.currentConfig;
  }

  /** Get available transports with capabilities */
  getAvailableTransports(): Array<{ type: TransportType; name: string; capabilities: TransportCapabilities }> {
    return this.factory.getSupportedTypes().map((type) => {
      const t = this.factory.create(type);
      return { type, name: this.getTransportName(type), capabilities: t!.getCapabilities() };
    });
  }

  /** Enqueue a print job (serializes concurrent prints) */
  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.writeQueue = this.writeQueue.then(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  private getTransportName(type: TransportType): string {
    switch (type) {
      case 'network_tcp': return 'Network (TCP 9100)';
      case 'serial_com': return 'Serial / COM Port';
      case 'usb_raw': return 'USB Raw (Windows Spooler)';
      default: return type;
    }
  }

  /** Cleanup on app exit */
  async shutdown(): Promise<void> {
    await this.factory.disconnectAll();
  }
}

// Singleton instance
export const printerManager = new PrinterManager();