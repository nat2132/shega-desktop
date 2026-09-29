/**
 * Serial/COM Port Printer Transport — Desktop
 * Uses serialport v13 with @serialport/parser-delimiter for framed reads
 */

import { IPrinterTransport, PrinterTransportConfig, PrintResult, PrinterStatus, TransportCapabilities, TransportError, TransportErrorCode } from '@shega/shared/peripherals/transport';
import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';

interface SerialConfigParams {
  path: string;
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd' | 'mark' | 'space';
  rtscts?: boolean;
  xonxoff?: boolean;
  rtsOnOpen?: boolean;
  dtrOnOpen?: boolean;
}

export class SerialComTransport implements IPrinterTransport {
  readonly type = 'serial_com' as const;
  private port: SerialPort | null = null;
  private parser: DelimiterParser | null = null;
  private config: PrinterTransportConfig | null = null;
  private writeQueue: Array<{ data: Uint8Array; resolve: (r: PrintResult) => void; reject: (e: Error) => void }> = [];
  private isWriting = false;
  private lastError: string | undefined;
  private statusResponse: string | null = null;

  getCapabilities(): TransportCapabilities {
    // serialport is a native Node module; available in Electron main process
    return { available: true, bidirectional: true };
  }

  async connect(config: PrinterTransportConfig): Promise<boolean> {
    const validationError = validateSerialParams(config.params as unknown as SerialConfigParams);
    if (validationError) throw validationError;

    this.config = config;
    this.lastError = undefined;

    return this.doConnect();
  }

  private doConnect(): Promise<boolean> {
    if (this.port && this.port.isOpen) return Promise.resolve(true);

    const { path, baudRate, dataBits = 8, stopBits = 1, parity = 'none', rtscts = false, xonxoff = false } = this.config!.params as unknown as SerialConfigParams;

    return new Promise((resolve) => {
      try {
        this.port = new SerialPort({
          path,
          baudRate,
          dataBits,
          stopBits,
          parity,
          rtscts,
          xonxoff,
          autoOpen: false,
          lock: true,
        });

        // Use DelimiterParser for status responses (ESC/POS status ends with LF or specific byte)
        this.parser = this.port.pipe(new DelimiterParser({ delimiter: Buffer.from([0x0a]) }));

        this.port.on('open', () => {
          this.setupPortEvents();
          resolve(true);
        });

        this.port.on('error', (err) => {
          this.lastError = err.message;
          this.port = null;
          this.parser = null;
          resolve(false);
        });

        this.port.open();
      } catch (err) {
        this.lastError = err instanceof Error ? err.message : String(err);
        this.port = null;
        resolve(false);
      }
    });
  }

  private setupPortEvents() {
    if (!this.port || !this.parser) return;

    this.port.on('close', () => {
      this.port = null;
      this.parser = null;
    });

    this.port.on('error', (err) => {
      this.lastError = err.message;
    });

    // Capture status responses (for getStatus bidirectional queries)
    this.parser.on('data', (data: Buffer) => {
      this.statusResponse = data.toString('ascii').trim();
    });
  }

  async disconnect(): Promise<void> {
    if (this.port) {
      await new Promise<void>((resolve) => {
        this.port!.close(() => resolve());
      });
      this.port = null;
      this.parser = null;
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
    if (!this.port || !this.port.isOpen) {
      return { success: false, error: 'Serial port not open' };
    }

    return new Promise((resolve, reject) => {
      this.writeQueue.push({ data, resolve, reject });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.isWriting || this.writeQueue.length === 0 || !this.port) return;
    this.isWriting = true;

    const item = this.writeQueue.shift()!;
    const { data, resolve, reject } = item;

    try {
      this.port!.write(Buffer.from(data), (err) => {
        this.isWriting = false;
        if (err) {
          this.lastError = err.message;
          reject(new TransportError(TransportErrorCode.WRITE_FAILED, err.message, err, this.type));
        } else {
          resolve({ success: true, bytesWritten: data.length });
        }
        this.processQueue();
      });
    } catch (err) {
      this.isWriting = false;
      this.lastError = err instanceof Error ? err.message : String(err);
      reject(new TransportError(TransportErrorCode.WRITE_FAILED, this.lastError, err instanceof Error ? err : undefined, this.type));
      this.processQueue();
    }
  }

  async getStatus(): Promise<PrinterStatus> {
    if (!this.port || !this.port.isOpen) {
      return { online: false, lastError: this.lastError, transport: this.type };
    }

    // Try to query printer status (ESC v for status, GS r for real-time status)
    // Note: Many thermal printers don't respond to status queries over serial
    // We'll derive online from port state
    const online = this.port.isOpen;
    return {
      online,
      lastError: this.lastError,
      lastSeen: online ? Date.now() : undefined,
      transport: this.type,
    };
  }

  getConfig(): PrinterTransportConfig | null {
    return this.config;
  }

  async updateConfig(params: Partial<SerialConfigParams>): Promise<void> {
    if (!this.config) throw new TransportError(TransportErrorCode.INVALID_CONFIG, 'Not connected');
    const newParams = { ...this.config.params, ...params } as unknown as SerialConfigParams;
    const validationError = validateSerialParams(newParams);
    if (validationError) throw validationError;

    const wasOpen = this.port?.isOpen;
    await this.disconnect();
    this.config.params = newParams as unknown as Record<string, unknown>;
    if (wasOpen) await this.connect(this.config);
  }
}

function validateSerialParams(params: SerialConfigParams): TransportError | null {
  if (!params.path || typeof params.path !== 'string') {
    return new TransportError(TransportErrorCode.INVALID_CONFIG, 'Serial printer requires port path (e.g., COM3, /dev/ttyUSB0)');
  }
  if (params.baudRate && (typeof params.baudRate !== 'number' || params.baudRate < 300)) {
    return new TransportError(TransportErrorCode.INVALID_CONFIG, 'Invalid baud rate (min 300)');
  }
  return null;
}