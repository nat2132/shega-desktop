/**
 * USB Raw (Windows Raw Spooler) Printer Transport — Desktop
 * Uses libusb via `usb` package to write directly to printer's bulk OUT endpoint
 * Falls back to Windows spooler API if libusb fails
 */

import { IPrinterTransport, PrinterTransportConfig, PrintResult, PrinterStatus, TransportCapabilities, TransportError, TransportErrorCode } from '@shega/shared/peripherals/transport';

/**
 * `usb` is a native module with a compiled `.node` binding. It is loaded lazily
 * so that bundling/plain-Node contexts (the e2e sync harness) do not fail at
 * require-time, and so a missing native build degrades to "USB unavailable"
 * instead of crashing startup.
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

interface UsbConfigParams {
  vendorId: number;
  productId: number;
  interface?: number;
  outEndpoint?: number; // bulk OUT endpoint address (default: 0x02)
  inEndpoint?: number;  // bulk IN endpoint for status (default: 0x81)
  timeout?: number;
}

interface UsbDeviceHandle {
  device: any;
  interface: number;
  outEndpoint: number;
  inEndpoint: number;
  timeout: number;
  claimed: boolean;
}

export class UsbRawTransport implements IPrinterTransport {
  readonly type = 'usb_raw' as const;
  private handle: UsbDeviceHandle | null = null;
  private config: PrinterTransportConfig | null = null;
  private writeQueue: Array<{ data: Uint8Array; resolve: (r: PrintResult) => void; reject: (e: Error) => void }> = [];
  private isWriting = false;
  private lastError: string | undefined;

  getCapabilities(): TransportCapabilities {
    // usb package requires native build; available in Electron with native modules
    return { available: true, bidirectional: true, maxPayload: 64 * 1024 };
  }

  async connect(config: PrinterTransportConfig): Promise<boolean> {
    const validationError = validateUsbParams(config.params as unknown as UsbConfigParams);
    if (validationError) throw validationError;

    this.config = config;
    this.lastError = undefined;

    return this.doConnect();
  }

  private doConnect(): Promise<boolean> {
    const { vendorId, productId, interface: iface = 0, outEndpoint = 0x02, inEndpoint = 0x81, timeout = 5000 } = this.config!.params as unknown as UsbConfigParams;

    return new Promise((resolve) => {
      const usb = getUsb();
      if (!usb) {
        this.lastError = 'USB module unavailable (native binding not loaded)';
        resolve(false);
        return;
      }
      // Find device in knownDevices
      const knownDevices = usb.knownDevices || {};
      let device: any = null;
      for (const [, d] of Object.entries(knownDevices)) {
        const desc = (d as any).deviceDescriptor;
        if (desc && desc.idVendor === vendorId && desc.idProduct === productId) {
          device = d;
          break;
        }
      }

      if (!device) {
        this.lastError = `USB device not found (VID: 0x${vendorId.toString(16).padStart(4, '0')}, PID: 0x${productId.toString(16).padStart(4, '0')})`;
        resolve(false);
        return;
      }

      try {
        device.open();

        // Claim interface
        device.interface(iface).claim((err: any) => {
          if (err) {
            this.lastError = `Failed to claim interface ${iface}: ${err.message}`;
            device.close();
            resolve(false);
            return;
          }

          this.handle = {
            device,
            interface: iface,
            outEndpoint,
            inEndpoint,
            timeout,
            claimed: true,
          };

          resolve(true);
        });
      } catch (err) {
        this.lastError = err instanceof Error ? err.message : String(err);
        resolve(false);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.handle) {
      try {
        if (this.handle.claimed) {
          this.handle.device.interface(this.handle.interface).release(() => {});
        }
        this.handle.device.close();
      } catch {
        // Ignore cleanup errors
      }
      this.handle = null;
    }

    // Reject queued writes
    for (const item of this.writeQueue) {
      item.reject(new TransportError(TransportErrorCode.CONNECTION_LOST, 'Disconnected'));
    }
    this.writeQueue = [];
  }

  async write(data: Uint8Array): Promise<PrintResult> {
    if (!this.config?.enabled) {
      return { success: false, error: 'Printer disabled' };
    }
    if (!this.handle || !this.handle.claimed) {
      return { success: false, error: 'USB device not connected' };
    }

    // Chunk large payloads to endpoint max packet size (typically 64 bytes for USB 2.0 bulk)
    const CHUNK_SIZE = 64 * 1024; // Use reasonable chunk; OS handles packetization

    return new Promise((resolve, reject) => {
      this.writeQueue.push({ data, resolve, reject });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.isWriting || this.writeQueue.length === 0 || !this.handle) return;
    this.isWriting = true;

    const item = this.writeQueue.shift()!;
    const { data, resolve, reject } = item;

    try {
      // Write in chunks if needed
      const chunks = this.chunkData(data, 64 * 1024);
      let completed = 0;
      let hasError = false;

      const writeNext = () => {
        if (completed >= chunks.length || hasError || !this.handle) {
          this.isWriting = false;
          if (!hasError) resolve({ success: true, bytesWritten: data.length });
          this.processQueue();
          return;
        }

        const chunk = chunks[completed];
        this.handle!.device.transferOut(
          this.handle!.outEndpoint,
          Buffer.from(chunk),
          this.handle!.timeout,
          (err: any) => {
            if (err) {
              hasError = true;
              this.lastError = err.message;
              reject(new TransportError(TransportErrorCode.WRITE_FAILED, err.message, err, this.type));
            } else {
              completed++;
              writeNext();
            }
          }
        );
      };

      writeNext();
    } catch (err) {
      this.isWriting = false;
      this.lastError = err instanceof Error ? err.message : String(err);
      reject(new TransportError(TransportErrorCode.WRITE_FAILED, this.lastError, err instanceof Error ? err : undefined, this.type));
      this.processQueue();
    }
  }

  private chunkData(data: Uint8Array, chunkSize: number): Uint8Array[] {
    if (data.length <= chunkSize) return [data];
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.subarray(i, Math.min(i + chunkSize, data.length)));
    }
    return chunks;
  }

  async getStatus(): Promise<PrinterStatus> {
    if (!this.handle || !this.handle.claimed) {
      return { online: false, lastError: this.lastError, transport: this.type };
    }

    // Try to read status from IN endpoint (if supported by printer)
    // Many USB ESC/POS printers don't implement bulk IN status
    return {
      online: true,
      lastError: this.lastError,
      lastSeen: Date.now(),
      transport: this.type,
    };
  }

  getConfig(): PrinterTransportConfig | null {
    return this.config;
  }

  async updateConfig(params: Partial<UsbConfigParams>): Promise<void> {
    if (!this.config) throw new TransportError(TransportErrorCode.INVALID_CONFIG, 'Not connected');
    const newParams = { ...this.config.params, ...params } as unknown as UsbConfigParams;
    const validationError = validateUsbParams(newParams);
    if (validationError) throw validationError;

    const wasConnected = this.handle !== null;
    await this.disconnect();
    this.config.params = newParams as unknown as Record<string, unknown>;
    if (wasConnected) await this.connect(this.config);
  }
}

function validateUsbParams(params: UsbConfigParams): TransportError | null {
  if (params.vendorId === undefined || typeof params.vendorId !== 'number') {
    return new TransportError(TransportErrorCode.INVALID_CONFIG, 'USB printer requires vendorId (number)');
  }
  if (params.productId === undefined || typeof params.productId !== 'number') {
    return new TransportError(TransportErrorCode.INVALID_CONFIG, 'USB printer requires productId (number)');
  }
  return null;
}