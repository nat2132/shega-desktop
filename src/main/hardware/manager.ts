/**
 * Unified Hardware Manager
 *
 * Central coordinator for all hardware operations:
 * - Device discovery and detection
 * - Connection management with auto-reconnect
 * - Printer operations (receipt, label, test)
 * - Scanner operations (start, stop, test)
 * - Mock mode support
 *
 * This is the single entry point for all hardware operations.
 * The rest of Shega should not need to know how devices are connected.
 */

import { EventEmitter } from 'events';
import { hardwareDiscoveryService, DetectedDevice } from './discovery';
import { autoReconnectManager, ConnectionState } from './autoReconnect';
import { deviceRegistry, DeviceIdentity } from './deviceIdentity';
import { printerManager } from '../printer/manager';
import { barcodeScannerService } from '../scanner/service';
import { isMockMode, dispatchScanToWindows } from './mock';
import { buildReceiptBytes, buildTestPageBytes } from '@shega/shared/peripherals/escpos-encoder';
import type { LabelPayload } from '@shega/shared/peripherals/escpos-encoder';
import type { ReceiptPayload } from '@shega/shared/peripherals/types';

// ==== Types ====

export interface HardwareManagerOptions {
  /** Enable auto-discovery on startup */
  autoDiscover?: boolean;
  /** Auto-discovery interval (ms) */
  discoveryIntervalMs?: number;
  /** Enable auto-reconnect for configured devices */
  autoReconnect?: boolean;
  /** Mock mode (overrides USE_MOCK_PERIPHERALS) */
  mockMode?: boolean;
}

const DEFAULT_OPTIONS: HardwareManagerOptions = {
  autoDiscover: true,
  discoveryIntervalMs: 30000,
  autoReconnect: true,
  mockMode: false,
};

export interface HardwareStatus {
  scanners: Array<{
    deviceId: string;
    name: string;
    state: ConnectionState;
    lastError?: string;
  }>;
  printers: Array<{
    deviceId: string;
    name: string;
    state: ConnectionState;
    lastError?: string;
  }>;
  isMockMode: boolean;
}

// ==== Hardware Manager ====

export class HardwareManager extends EventEmitter {
  private options: HardwareManagerOptions;
  private isInitialized = false;
  private activePrinterId: string | null = null;
  private activeScannerId: string | null = null;

  constructor(options: Partial<HardwareManagerOptions> = {}) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.setMaxListeners(100);
  }

  /** Initialize the hardware manager */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.emit('initializing');

    // Set up discovery listeners
    hardwareDiscoveryService.on('scan:complete', this.handleDiscoveryComplete.bind(this));
    hardwareDiscoveryService.on('error', this.handleDiscoveryError.bind(this));

    // Set up reconnect listeners
    autoReconnectManager.on('connected', this.handleDeviceConnected.bind(this));
    autoReconnectManager.on('disconnected', this.handleDeviceDisconnected.bind(this));
    autoReconnectManager.on('reconnecting', this.handleDeviceReconnecting.bind(this));
    autoReconnectManager.on('error', this.handleDeviceError.bind(this));

    // Set up scanner scan listener
    barcodeScannerService.on('scan', this.handleScan.bind(this));

    // Auto-discover on startup
    if (this.options.autoDiscover) {
      await this.discover();
      hardwareDiscoveryService.startAutoDiscovery(this.options.discoveryIntervalMs);
    }

    // Restore previously configured devices
    await this.restoreConfiguredDevices();

    this.emit('initialized');
  }

  /** Shutdown the hardware manager */
  async shutdown(): Promise<void> {
    this.emit('shutting-down');

    hardwareDiscoveryService.stopAutoDiscovery();
    await barcodeScannerService.stop();
    await printerManager.shutdown();
    autoReconnectManager.destroy();

    this.emit('shutdown');
  }

  // ==== Discovery ====

  /** Scan for available hardware */
  async discover(): Promise<DetectedDevice[]> {
    this.emit('discovery:start');
    try {
      const devices = await hardwareDiscoveryService.scan();
      this.emit('discovery:complete', { devices });
      return devices;
    } catch (err) {
      this.emit('discovery:error', { error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }

  private handleDiscoveryComplete(data: { devices: DetectedDevice[] }): void {
    this.emit('devices:detected', { devices: data.devices });
  }

  private handleDiscoveryError(data: { error: string }): void {
    this.emit('discovery:error', { error: data.error });
  }

  // ==== Device Connection ====

  /** Connect to a detected device */
  async connectDevice(deviceId: string): Promise<boolean> {
    const device = hardwareDiscoveryService.getDevice(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    this.emit('device:connecting', { deviceId });

    try {
      if (device.deviceType === 'receipt_printer') {
        await this.connectPrinter(device);
      } else if (device.deviceType === 'barcode_scanner') {
        await this.connectScanner(device);
      }

      // Register for auto-reconnect
      if (this.options.autoReconnect) {
        autoReconnectManager.registerDevice(deviceId, device.deviceType);
        autoReconnectManager.markConnected(deviceId);
      }

      // Save to device registry
      deviceRegistry.register({
        deviceId,
        name: device.name,
        deviceType: device.deviceType,
        connectionType: device.connectionType,
        manufacturer: device.manufacturer,
        model: device.model,
        hardwareIds: {
          vendorId: device.vendorId,
          productId: device.productId,
          port: device.port,
          host: device.host,
          networkPort: device.networkPort,
        },
        configFingerprint: '',
        previouslyConfigured: true,
      });

      this.emit('device:connected', { deviceId });
      return true;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.emit('device:error', { deviceId, error });
      throw err;
    }
  }

  /** Disconnect a device */
  async disconnectDevice(deviceId: string): Promise<void> {
    const device = hardwareDiscoveryService.getDevice(deviceId);
    if (!device) return;

    this.emit('device:disconnecting', { deviceId });

    try {
      if (device.deviceType === 'receipt_printer') {
        await printerManager.selectTransport('network_tcp', { enabled: false } as any);
        if (this.activePrinterId === deviceId) {
          this.activePrinterId = null;
        }
      } else if (device.deviceType === 'barcode_scanner') {
        await barcodeScannerService.stop();
        if (this.activeScannerId === deviceId) {
          this.activeScannerId = null;
        }
      }

      autoReconnectManager.unregisterDevice(deviceId);
      this.emit('device:disconnected', { deviceId });
    } catch (err) {
      this.emit('device:error', { deviceId, error: err instanceof Error ? err.message : String(err) });
    }
  }

  private async connectPrinter(device: DetectedDevice): Promise<void> {
    await printerManager.selectTransport(device.connectionType as any, {
      name: device.name,
      params: {
        host: device.host,
        port: device.networkPort,
        path: device.port,
        baudRate: device.baudRate,
        vendorId: device.vendorId,
        productId: device.productId,
      },
      paperWidth: 80,
      enabled: true,
    } as any);
    this.activePrinterId = device.deviceId;
  }

  private async connectScanner(device: DetectedDevice): Promise<void> {
    await barcodeScannerService.setConfig({
      serialPorts: device.connectionType === 'serial_com' ? [{
        path: device.port || '',
        baudRate: device.baudRate || 9600,
        enabled: true,
      }] : [],
      usbHidDevices: device.connectionType === 'usb_hid' ? [{
        vendorId: device.vendorId || 0,
        productId: device.productId || 0,
        enabled: true,
      }] : [],
      keyboardWedge: { enabled: false, minLength: 3, maxLength: 64, interKeyTimeoutMs: 50 },
    });
    await barcodeScannerService.start();
    this.activeScannerId = device.deviceId;
  }

  // ==== Printer Operations ====

  /** Print a receipt */
  async printReceipt(payload: ReceiptPayload): Promise<{ success: boolean; error?: string }> {
    if (this.isMockMode()) {
      // Mock mode: dispatch to mock printer
      const bytes = buildReceiptBytes(payload);
      this.emit('print:mock', { byteLength: bytes.length, payload });
      return { success: true };
    }

    if (!this.activePrinterId) {
      return { success: false, error: 'No active printer' };
    }

    return printerManager.printReceipt(payload);
  }

  /** Print a test page */
  async printTestPage(paperWidth: 58 | 80 = 80): Promise<{ success: boolean; error?: string }> {
    if (this.isMockMode()) {
      const bytes = buildTestPageBytes(paperWidth);
      this.emit('print:mock', { byteLength: bytes.length, type: 'test' });
      return { success: true };
    }

    return printerManager.printTestPage(paperWidth);
  }

  /** Print a label */
  async printLabel(payload: LabelPayload): Promise<{ success: boolean; error?: string }> {
    if (this.isMockMode()) {
      this.emit('print:mock', { type: 'label', payload });
      return { success: true };
    }

    return printerManager.printLabel(payload);
  }

  /** Open cash drawer */
  async openDrawer(): Promise<{ success: boolean; error?: string }> {
    if (this.isMockMode()) {
      this.emit('drawer:mock');
      return { success: true };
    }

    return printerManager.openDrawer();
  }

  // ==== Scanner Operations ====

  /** Start scanning */
  async startScanning(): Promise<void> {
    if (this.isMockMode()) {
      // Mock mode: scans are dispatched via IPC
      return;
    }
    await barcodeScannerService.start();
  }

  /** Stop scanning */
  async stopScanning(): Promise<void> {
    await barcodeScannerService.stop();
  }

  /** Handle incoming scan */
  private handleScan(result: { code: string; source: string; timestamp: number }): void {
    this.emit('scan', result);
  }

  // ==== Auto-Reconnect Handlers ====

  private handleDeviceConnected(data: { deviceId: string }): void {
    this.emit('device:connected', data);
  }

  private handleDeviceDisconnected(data: { deviceId: string; reason?: string }): void {
    this.emit('device:disconnected', data);
  }

  private handleDeviceReconnecting(data: { deviceId: string; attempt: number; delay: number }): void {
    this.emit('device:reconnecting', data);
  }

  private handleDeviceError(data: { deviceId: string; error: string }): void {
    this.emit('device:error', data);
  }

  // ==== Device Restoration ====

  /** Restore previously configured devices */
  private async restoreConfiguredDevices(): Promise<void> {
    const devices = deviceRegistry.getAll();
    for (const device of devices) {
      if (!device.previouslyConfigured) continue;

      const detected = hardwareDiscoveryService.getDevice(device.deviceId);
      if (detected && detected.available) {
        try {
          await this.connectDevice(device.deviceId);
          this.emit('device:restored', { deviceId: device.deviceId });
        } catch (err) {
          this.emit('device:restore-failed', { deviceId: device.deviceId, error: err instanceof Error ? err.message : String(err) });
        }
      }
    }
  }

  // ==== Status ====

  /** Get current hardware status */
  getStatus(): HardwareStatus {
    const devices = hardwareDiscoveryService.getKnownDevices();
    const states = autoReconnectManager.getAllStates();

    const scanners = devices
      .filter(d => d.deviceType === 'barcode_scanner')
      .map(d => {
        const state = states.find(s => s.deviceId === d.deviceId);
        return {
          deviceId: d.deviceId,
          name: d.name,
          state: state?.state || (d.previouslyConfigured ? 'connected' : 'disconnected'),
          lastError: state?.lastError,
        };
      });

    const printers = devices
      .filter(d => d.deviceType === 'receipt_printer')
      .map(d => {
        const state = states.find(s => s.deviceId === d.deviceId);
        return {
          deviceId: d.deviceId,
          name: d.name,
          state: state?.state || (d.previouslyConfigured ? 'connected' : 'disconnected'),
          lastError: state?.lastError,
        };
      });

    return {
      scanners,
      printers,
      isMockMode: this.isMockMode(),
    };
  }

  /** Check if mock mode is active */
  isMockMode(): boolean {
    return this.options.mockMode || isMockMode();
  }

  /** Get active printer ID */
  getActivePrinterId(): string | null {
    return this.activePrinterId;
  }

  /** Get active scanner ID */
  getActiveScannerId(): string | null {
    return this.activeScannerId;
  }

  /** Set active printer */
  setActivePrinter(deviceId: string): void {
    this.activePrinterId = deviceId;
  }

  /** Set active scanner */
  setActiveScanner(deviceId: string): void {
    this.activeScannerId = deviceId;
  }
}

// Singleton
export const hardwareManager = new HardwareManager();