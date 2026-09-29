/**
 * Auto-Reconnect Manager
 *
 * Handles automatic reconnection of configured devices with:
 * - Exponential backoff
 * - Max retry limits
 * - Clean listener cleanup before reconnect
 * - No duplicate connections
 * - No crashes on repeated failures
 */

import { EventEmitter } from 'events';

export interface ReconnectConfig {
  /** Initial retry delay (ms) */
  initialDelayMs?: number;
  /** Max retry delay (ms) */
  maxDelayMs?: number;
  /** Exponential backoff multiplier */
  backoffMultiplier?: number;
  /** Max retry attempts (0 = unlimited) */
  maxRetries?: number;
  /** Reset backoff after this many successful connections */
  resetAfterSuccesses?: number;
}

/**
 * Every field required, merged from DEFAULT_CONFIG in the constructor. Keeping
 * the public option shape optional but the stored shape total means the retry
 * maths never has to re-check for `undefined` at each use.
 */
type ResolvedReconnectConfig = Required<ReconnectConfig>;

const DEFAULT_CONFIG: ResolvedReconnectConfig = {
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  maxRetries: 0, // Unlimited
  resetAfterSuccesses: 3,
};

export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting' | 'error' | 'disabled';

export interface DeviceConnection {
  deviceId: string;
  deviceType: 'barcode_scanner' | 'receipt_printer';
  state: ConnectionState;
  lastConnected?: number;
  lastDisconnected?: number;
  retryCount: number;
  consecutiveSuccesses: number;
  lastError?: string;
}

export class AutoReconnectManager extends EventEmitter {
  private config: ResolvedReconnectConfig;
  private devices: Map<string, DeviceConnection> = new Map();
  private retryTimers: Map<string, NodeJS.Timeout> = new Map();
  private isReconnecting: Set<string> = new Set();

  constructor(config: Partial<ReconnectConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setMaxListeners(50);
  }

  /** Register a device for auto-reconnect */
  registerDevice(deviceId: string, deviceType: 'barcode_scanner' | 'receipt_printer'): void {
    if (this.devices.has(deviceId)) return;

    this.devices.set(deviceId, {
      deviceId,
      deviceType,
      state: 'disconnected',
      retryCount: 0,
      consecutiveSuccesses: 0,
    });
  }

  /** Unregister a device */
  unregisterDevice(deviceId: string): void {
    this.cancelRetry(deviceId);
    this.devices.delete(deviceId);
    this.isReconnecting.delete(deviceId);
  }

  /** Mark device as connected */
  markConnected(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (!device) return;

    this.cancelRetry(deviceId);
    this.isReconnecting.delete(deviceId);

    device.state = 'connected';
    device.lastConnected = Date.now();
    device.retryCount = 0;
    device.consecutiveSuccesses++;
    device.lastError = undefined;

    this.emit('connected', { deviceId });
  }

  /** Mark device as disconnected and schedule reconnect */
  markDisconnected(deviceId: string, reason?: string): void {
    const device = this.devices.get(deviceId);
    if (!device) return;

    // Don't override reconnecting state
    if (device.state === 'reconnecting') return;

    device.state = 'disconnected';
    device.lastDisconnected = Date.now();
    device.lastError = reason;

    this.emit('disconnected', { deviceId, reason });

    // Schedule reconnect
    this.scheduleRetry(deviceId);
  }

  /** Mark device as having an error */
  markError(deviceId: string, error: string): void {
    const device = this.devices.get(deviceId);
    if (!device) return;

    device.state = 'error';
    device.lastError = error;
    device.retryCount++;

    this.emit('error', { deviceId, error });

    // Schedule reconnect
    this.scheduleRetry(deviceId);
  }

  /** Schedule a retry with exponential backoff */
  private scheduleRetry(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (!device) return;

    // Cancel existing retry
    this.cancelRetry(deviceId);

    // Check max retries
    if (this.config.maxRetries > 0 && device.retryCount >= this.config.maxRetries) {
      device.state = 'error';
      this.emit('max-retries-exceeded', { deviceId });
      return;
    }

    // Reset backoff after consecutive successes
    if (device.consecutiveSuccesses >= this.config.resetAfterSuccesses) {
      device.retryCount = 0;
      device.consecutiveSuccesses = 0;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, device.retryCount),
      this.config.maxDelayMs
    );

    device.state = 'reconnecting';
    this.emit('reconnecting', { deviceId, attempt: device.retryCount + 1, delay });

    // All device access done - only use deviceId (string) in closure
    const timer = setTimeout(() => {
      this.retryTimers.delete(deviceId);
      this.attemptReconnect(deviceId);
    }, delay);

    this.retryTimers.set(deviceId, timer);
  }

  /** Attempt to reconnect a device */
  private async attemptReconnect(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) return;

    // Prevent duplicate reconnection attempts
    if (this.isReconnecting.has(deviceId)) return;
    this.isReconnecting.add(deviceId);

    device.retryCount++;
    this.emit('reconnect-attempt', { deviceId, attempt: device.retryCount });

    try {
      // Emit reconnect event — consumer handles actual reconnection
      this.emit('reconnect', { deviceId, deviceType: device.deviceType });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      device.lastError = error;
      this.emit('reconnect-failed', { deviceId, error });

      // Schedule next retry
      this.scheduleRetry(deviceId);
    } finally {
      this.isReconnecting.delete(deviceId);
    }
  }

  /** Cancel a pending retry */
  private cancelRetry(deviceId: string): void {
    const timer = this.retryTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.retryTimers.delete(deviceId);
    }
  }

  /** Get device connection state */
  getDeviceState(deviceId: string): DeviceConnection | undefined {
    return this.devices.get(deviceId);
  }

  /** Get all device states */
  getAllStates(): DeviceConnection[] {
    return Array.from(this.devices.values());
  }

  /** Manually trigger reconnect */
  async reconnect(deviceId: string): Promise<void> {
    this.cancelRetry(deviceId);
    const device = this.devices.get(deviceId);
    if (device) {
      device.retryCount = 0;
    }
    await this.attemptReconnect(deviceId);
  }

  /** Disable auto-reconnect for a device */
  disable(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (!device) return;

    this.cancelRetry(deviceId);
    device.state = 'disabled';
    this.emit('disabled', { deviceId });
  }

  /** Enable auto-reconnect for a device */
  enable(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (!device) return;

    device.state = 'disconnected';
    device.retryCount = 0;
    this.emit('enabled', { deviceId });
    this.scheduleRetry(deviceId);
  }

  /** Get all registered device IDs */
  getDeviceIds(): string[] {
    return Array.from(this.devices.keys());
  }

  /** Cleanup */
  destroy(): void {
    for (const timer of this.retryTimers.values()) {
      clearTimeout(timer);
    }
    this.retryTimers.clear();
    this.devices.clear();
    this.isReconnecting.clear();
  }
}

// Singleton
export const autoReconnectManager = new AutoReconnectManager();