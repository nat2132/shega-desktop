/**
 * Network (TCP 9100) Printer Transport — Desktop
 * Raw socket connection to ESC/POS printer on port 9100
 */

import { IPrinterTransport, PrinterTransportConfig, PrintResult, PrinterStatus, TransportCapabilities, TransportError, TransportErrorCode } from '@shega/shared/peripherals/transport';
import net from 'net';

interface NetworkConfigParams {
  host: string;
  port: number;
  timeout?: number;
}

export class NetworkTcpTransport implements IPrinterTransport {
  readonly type = 'network_tcp' as const;
  private socket: net.Socket | null = null;
  private config: PrinterTransportConfig | null = null;
  private writeQueue: Array<{ data: Uint8Array; resolve: (r: PrintResult) => void; reject: (e: Error) => void }> = [];
  private isWriting = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private lastError: string | undefined;

  getCapabilities(): TransportCapabilities {
    return { available: true };
  }

  async connect(config: PrinterTransportConfig): Promise<boolean> {
    const validationError = validateNetworkParams(config.params as unknown as NetworkConfigParams);
    if (validationError) throw validationError;

    this.config = config;
    this.lastError = undefined;

    return this.doConnect();
  }

  private doConnect(): Promise<boolean> {
    if (this.isConnecting || (this.socket && !this.socket.destroyed)) return Promise.resolve(true);
    this.isConnecting = true;

    const { host, port, timeout = 5000 } = this.config!.params as unknown as NetworkConfigParams;

    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(timeout);
      socket.setNoDelay(true);

      const cleanup = () => {
        socket.removeAllListeners();
        this.isConnecting = false;
      };

      socket.once('connect', () => {
        this.socket = socket;
        this.setupSocketEvents();
        cleanup();
        this.processQueue();
        resolve(true);
      });

      socket.once('error', (err) => {
        this.lastError = err.message;
        cleanup();
        this.socket = null;
        resolve(false);
      });

      socket.once('timeout', () => {
        this.lastError = `Connection timeout (${timeout}ms)`;
        socket.destroy();
        cleanup();
        resolve(false);
      });

      socket.connect({ host, port });
    });
  }

  private setupSocketEvents() {
    if (!this.socket) return;
    this.socket.on('close', () => {
      this.socket = null;
      this.scheduleReconnect();
    });
    this.socket.on('error', (err) => {
      this.lastError = err.message;
      this.socket = null;
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.config?.enabled && this.writeQueue.length > 0) {
        this.doConnect().catch(() => {});
      }
    }, 5000);
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
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

    return new Promise((resolve, reject) => {
      this.writeQueue.push({ data, resolve, reject });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.isWriting || this.writeQueue.length === 0 || !this.socket) return;
    this.isWriting = true;

    const item = this.writeQueue.shift()!;
    const { data, resolve, reject } = item;

    try {
      this.socket!.write(Buffer.from(data), (err) => {
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
    // TCP is fire-and-forget; derive status from connection state
    const online = this.socket !== null && !this.socket.destroyed;
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

  async updateConfig(params: Partial<NetworkConfigParams>): Promise<void> {
    if (!this.config) throw new TransportError(TransportErrorCode.INVALID_CONFIG, 'Not connected');
    const newParams = { ...this.config.params, ...params } as unknown as NetworkConfigParams;
    const validationError = validateNetworkParams(newParams);
    if (validationError) throw validationError;

    const wasConnected = this.socket !== null && !this.socket.destroyed;
    await this.disconnect();
    this.config.params = newParams as unknown as Record<string, unknown>;
    if (wasConnected) await this.connect(this.config);
  }
}

function validateNetworkParams(params: NetworkConfigParams): TransportError | null {
  if (!params.host || typeof params.host !== 'string') {
    return new TransportError(TransportErrorCode.INVALID_CONFIG, 'Network printer requires host');
  }
  if (!params.port || typeof params.port !== 'number' || params.port < 1 || params.port > 65535) {
    return new TransportError(TransportErrorCode.INVALID_CONFIG, 'Network printer requires valid port (1-65535)');
  }
  return null;
}