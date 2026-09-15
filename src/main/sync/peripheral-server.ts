import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';
import { WebSocket } from 'ws';
import { logger } from '../logger';
import {
  PERIPHERAL_MSG,
  type PeripheralDeviceInfo,
  type PeripheralScanRequest,
  type PeripheralScanResult,
  type PeripheralCaptureRequest,
  type PeripheralCaptureResult,
} from '@shega/shared';

/**
 * Phone-peripheral hub (desktop side).
 *
 * The mobile app registers itself as a barcode scanner / camera on the LAN
 * WebSocket hub. The desktop asks a connected phone to scan or capture; the
 * phone answers over the same socket. Requests are tracked so results can be
 * matched (and so stale results are rejected). Works offline — it rides the
 * existing LAN sync server; cloud relay reuses the same message types.
 */

export interface PeripheralClient {
  deviceId: string;
  name: string;
  model: string;
  info: PeripheralDeviceInfo;
  registeredAt: number;
  /** ws client id on the WsSyncServer that hosts this socket */
  socketClientId: string;
}

type PeripheralEventMap = {
  peripheralRegistered: [PeripheralClient];
  peripheralDisconnected: [string];
  scanResult: [PeripheralScanResult];
  captureResult: [PeripheralCaptureResult];
  /** phone status update: { deviceId, mode, busy } */
  status: [{ deviceId: string; mode: string; busy?: boolean }];
};

class PeripheralHub extends EventEmitter<PeripheralEventMap> {
  /** deviceId -> client */
  private phones = new Map<string, PeripheralClient>();
  /** outstanding request ids we still expect answers for */
  private pending = new Map<string, { kind: 'scan' | 'capture'; at: number }>();
  /** last reported companion mode per phone ('idle' | 'scanner' | 'camera') */
  private modes = new Map<string, string>();
  private gcTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super();
    this.gcTimer = setInterval(() => this.gc(), 30000);
  }

  private gc() {
    const now = Date.now();
    for (const [id, p] of this.pending) {
      if (now - p.at > 120000) this.pending.delete(id);
    }
  }

  /** Handle an incoming PERIPHERAL_REGISTER from a phone. */
  register(socketClientId: string, payload: any): PeripheralClient | null {
    const { deviceId, name, model, kinds, platform } = payload || {};
    if (!deviceId) return null;
    const client: PeripheralClient = {
      deviceId,
      name: name || model || 'Phone',
      model: model || '',
      info: {
        deviceId,
        name: name || model || 'Phone',
        model,
        platform: platform || 'mobile',
        kinds: Array.isArray(kinds) && kinds.length ? kinds : ['scanner', 'camera'],
      },
      registeredAt: Date.now(),
      socketClientId,
    };
    this.phones.set(deviceId, client);
    logger.info(`[peripheral] phone registered: ${client.name} (${deviceId}) kinds=${client.info.kinds.join(',')}`);
    this.emit('peripheralRegistered', client);
    return client;
  }

  /** Socket dropped — forget any phone that lived on it. */
  unregisterBySocket(socketClientId: string): void {
    for (const [id, c] of this.phones) {
      if (c.socketClientId === socketClientId) {
        this.phones.delete(id);
        this.emit('peripheralDisconnected', id);
        logger.info(`[peripheral] phone disconnected: ${c.name}`);
      }
    }
  }

  list(): PeripheralClient[] {
    return Array.from(this.phones.values());
  }

  /** Record a companion status report from a phone. */
  ingestStatus(deviceId: string, payload: any): void {
    const mode = String(payload?.mode || 'idle');
    this.modes.set(deviceId, mode);
    this.emit('status', { deviceId, mode, busy: !!payload?.busy });
  }

  /** Last known companion mode of a phone ('idle' if never reported). */
  getMode(deviceId: string): string {
    return this.modes.get(deviceId) || 'idle';
  }

  get(deviceId: string): PeripheralClient | undefined {
    return this.phones.get(deviceId);
  }

  /** True when this payload completes a request we issued. */
  trackRequest(kind: 'scan' | 'capture'): string {
    const requestId = randomBytes(8).toString('hex');
    this.pending.set(requestId, { kind, at: Date.now() });
    return requestId;
  }

  consumeRequest(requestId: string, kind: 'scan' | 'capture'): boolean {
    const p = this.pending.get(requestId);
    if (!p || p.kind !== kind) return false;
    this.pending.delete(requestId);
    return true;
  }

  /** Ingest a result message coming back from a phone. Returns true if accepted. */
  ingestResult(msgType: string, payload: any): boolean {
    if (msgType === PERIPHERAL_MSG.SCAN_RESULT) {
      const res = payload as PeripheralScanResult;
      if (!res?.requestId || !res?.barcode) return false;
      if (!this.consumeRequest(res.requestId, 'scan')) {
        logger.warn(`[peripheral] stale scan result ${res.requestId}`);
        return false;
      }
      this.emit('scanResult', res);
      return true;
    }
    if (msgType === PERIPHERAL_MSG.CAPTURE_RESULT) {
      const res = payload as PeripheralCaptureResult;
      if (!res?.requestId) return false;
      if (!this.consumeRequest(res.requestId, 'capture')) {
        logger.warn(`[peripheral] stale capture result ${res.requestId}`);
        return false;
      }
      this.emit('captureResult', res);
      return true;
    }
    return false;
  }
}

export const peripheralHub = new PeripheralHub();

/** Helpers used by the WS server to build outbound payloads. */
export function buildScanRequest(requestId: string): { type: string; payload: PeripheralScanRequest } {
  return { type: PERIPHERAL_MSG.SCAN_REQUEST, payload: { requestId } };
}

export function buildCaptureRequest(requestId: string, mode: 'photo' | 'barcode' | 'qr'): { type: string; payload: PeripheralCaptureRequest } {
  return { type: PERIPHERAL_MSG.CAPTURE_REQUEST, payload: { requestId, mode } };
}
