import { WebSocketServer, WebSocket } from 'ws';
import { createHash, randomBytes } from 'crypto';
import { EventEmitter } from 'events';
import db from '../database';
import {
  SHARED_TABLES,
  SyncEntity,
  applyPush,
  snapshotSince,
  lwwWins,
  verifyChecksums,
  getPairingToken,
  ensureHubDeviceId,
  registerDevice,
  logSync,
  requestDeviceResync,
  buildCloudChanges,
  applyRemoteChanges,
  changeChecksum,
  type Change,
} from './sync-hub';
import { logger } from '../logger';
import {
  submitDeviceJoinRequest,
  listDeviceJoinRequests,
  decideDeviceJoinRequest,
  publishInvitation,
  resolveInvitation,
  getDeviceJoinRequestBy,
} from './device-requests';
import { DEVICE_JOIN_MSG } from '@shega/shared';

export const WS_SYNC_PORT = 5758;

export interface WsClient {
  ws: WebSocket;
  deviceId: string;
  paired: boolean;
  lastHeartbeat: number;
  lastSeq: number;
}

export interface WsMessage {
  type: string;
  payload?: any;
  requestId?: string;
}

type SyncEventMap = {
  clientConnected: [WsClient];
  clientDisconnected: [WsClient];
  syncCompleted: [WsClient, { pushed: number; pulled: number; conflicts: number }];
  error: [Error];
};

export class WsSyncServer extends EventEmitter<SyncEventMap> {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, WsClient>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  start(): void {
    if (this.wss) return;

    this.wss = new WebSocketServer({ port: WS_SYNC_PORT });
    this.wss.on('connection', (ws: WebSocket, req) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (err) => {
      logger.error('[WS] Server error:', err);
      this.emit('error', err);
    });

    // Heartbeat to detect dead connections
    this.heartbeatInterval = setInterval(() => this.sendHeartbeats(), 30000);

    logger.info(`[WS] Sync server listening on port ${WS_SYNC_PORT}`);
  }

  private handleConnection(ws: WebSocket, req: any): void {
    const clientId = randomBytes(8).toString('hex');
    const client: WsClient = {
      ws,
      deviceId: '',
      paired: false,
      lastHeartbeat: Date.now(),
      lastSeq: 0,
    };

    this.clients.set(clientId, client);
    logger.info(`[WS] Client connected: ${clientId}`);

    ws.on('message', (data: Buffer) => {
      try {
        const msg: WsMessage = JSON.parse(data.toString());
        this.handleMessage(clientId, client, msg);
      } catch (e) {
        logger.warn('[WS] Invalid message:', e);
        this.sendError(ws, 'INVALID_MESSAGE', 'Malformed JSON');
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(clientId, client);
    });

    ws.on('error', (err) => {
      logger.warn('[WS] Client error:', err);
    });
  }

  private handleMessage(clientId: string, client: WsClient, msg: WsMessage): void {
    const ws = client.ws;
    if (ws.readyState !== WebSocket.OPEN) return;

    switch (msg.type) {
      case 'HEARTBEAT':
        client.lastHeartbeat = Date.now();
        this.send(ws, { type: 'HEARTBEAT_ACK', timestamp: Date.now() });
        break;

      case 'PAIR_REQUEST':
        this.handlePairRequest(clientId, client, msg);
        break;

      case 'SYNC_PUSH':
        this.handleSyncPush(clientId, client, msg);
        break;

      case 'SYNC_PULL':
        this.handleSyncPull(clientId, client, msg);
        break;

      case 'SYNC_VERIFY':
        this.handleSyncVerify(clientId, client, msg);
        break;

      case 'RESYNC_REQUEST':
        this.handleResyncRequest(clientId, client, msg);
        break;

      case DEVICE_JOIN_MSG.SUBMIT:
        this.handleDeviceJoinSubmit(clientId, client, msg);
        break;

      case DEVICE_JOIN_MSG.LIST:
        this.handleDeviceJoinList(clientId, client, msg);
        break;

      case DEVICE_JOIN_MSG.DECIDE:
        this.handleDeviceJoinDecide(clientId, client, msg);
        break;

      case DEVICE_JOIN_MSG.PUBLISH:
        this.handleInvitePublish(clientId, client, msg);
        break;

      case DEVICE_JOIN_MSG.RESOLVE:
        this.handleInviteResolve(clientId, client, msg);
        break;

      case DEVICE_JOIN_MSG.STATUS:
        this.handleDeviceJoinStatus(clientId, client, msg);
        break;

      default:
        this.sendError(ws, 'UNKNOWN_TYPE', `Unknown message type: ${msg.type}`);
    }
  }

  private handlePairRequest(clientId: string, client: WsClient, msg: WsMessage): void {
    const ws = client.ws;
    const { device_id, name, token } = msg.payload || {};

    if (!device_id) {
      this.sendError(ws, 'PAIR_FAILED', 'device_id required');
      return;
    }

    const hubToken = getPairingToken();
    if (token && token.trim().toUpperCase() !== hubToken) {
      this.sendError(ws, 'PAIR_FAILED', 'Invalid pairing token');
      return;
    }

    registerDevice(device_id, name);
    client.deviceId = device_id;
    client.paired = true;

    this.send(ws, {
      type: 'PAIR_RESPONSE',
      requestId: msg.requestId,
      payload: {
        success: true,
        hubId: ensureHubDeviceId(),
        pairingToken: hubToken,
        schemaVersion: 21,
      },
    });

    logger.info(`[WS] Device paired: ${device_id} (${name || 'unknown'})`);
    this.emit('clientConnected', this.clients.get(clientId)!);
  }

  private handleDeviceJoinSubmit(clientId: string, client: WsClient, msg: WsMessage): void {
    const ws = client.ws;
    if (!client.paired) { this.sendError(ws, 'NOT_PAIRED', 'Device not paired'); return; }
    const payload = msg.payload || {};
    if (!payload.businessId || !payload.joinerDeviceId) {
      this.sendError(ws, 'DEVICE_JOIN_FAILED', 'businessId and joinerDeviceId required');
      return;
    }
    const rec = submitDeviceJoinRequest(payload);
    this.send(ws, { type: DEVICE_JOIN_MSG.ACK, requestId: msg.requestId, payload: { requestId: rec.requestId, status: rec.status } });
    logger.info(`[WS] Device join request staged: ${rec.joinerDeviceId} -> ${rec.businessId}`);
  }

  private handleDeviceJoinList(clientId: string, client: WsClient, msg: WsMessage): void {
    const ws = client.ws;
    if (!client.paired) { this.sendError(ws, 'NOT_PAIRED', 'Device not paired'); return; }
    const { businessId } = msg.payload || {};
    if (!businessId) { this.sendError(ws, 'DEVICE_JOIN_FAILED', 'businessId required'); return; }
    const requests = listDeviceJoinRequests(businessId);
    this.send(ws, { type: DEVICE_JOIN_MSG.RESPONSE, requestId: msg.requestId, payload: { requests } });
  }

  private handleDeviceJoinDecide(clientId: string, client: WsClient, msg: WsMessage): void {
    const ws = client.ws;
    if (!client.paired) { this.sendError(ws, 'NOT_PAIRED', 'Device not paired'); return; }
    const payload = msg.payload || {};
    if (!payload.requestId || !payload.decision) {
      this.sendError(ws, 'DEVICE_JOIN_FAILED', 'requestId and decision required');
      return;
    }
    const rec = decideDeviceJoinRequest(payload);
    if (!rec) { this.sendError(ws, 'DEVICE_JOIN_FAILED', 'request not found'); return; }
    this.send(ws, { type: DEVICE_JOIN_MSG.RESPONSE, requestId: msg.requestId, payload: { record: rec } });
    logger.info(`[WS] Device join ${payload.decision}: ${rec.joinerDeviceId}`);
  }

  private handleInvitePublish(clientId: string, client: WsClient, msg: WsMessage): void {
    const ws = client.ws;
    if (!client.paired) { this.sendError(ws, 'NOT_PAIRED', 'Device not paired'); return; }
    const p = msg.payload || {};
    if (!p.id || !p.businessId || !p.code) { this.sendError(ws, 'INVITE_FAILED', 'id, businessId, code required'); return; }
    publishInvitation(p);
    this.send(ws, { type: DEVICE_JOIN_MSG.ACK, requestId: msg.requestId, payload: { published: true } });
  }

  private handleInviteResolve(clientId: string, client: WsClient, msg: WsMessage): void {
    const ws = client.ws;
    const { code } = msg.payload || {};
    if (!code) { this.sendError(ws, 'INVITE_FAILED', 'code required'); return; }
    const inv = resolveInvitation(code);
    if (!inv) { this.sendError(ws, 'INVITE_INVALID', 'Invitation not found or expired'); return; }
    this.send(ws, { type: DEVICE_JOIN_MSG.RESPONSE, requestId: msg.requestId, payload: { invitation: inv } });
  }

  private handleDeviceJoinStatus(clientId: string, client: WsClient, msg: WsMessage): void {
    const ws = client.ws;
    const { code, joinerDeviceId } = msg.payload || {};
    if (!code || !joinerDeviceId) { this.sendError(ws, 'DEVICE_JOIN_FAILED', 'code and joinerDeviceId required'); return; }
    const rec = getDeviceJoinRequestBy(code, joinerDeviceId);
    this.send(ws, { type: DEVICE_JOIN_MSG.RESPONSE, requestId: msg.requestId, payload: { record: rec } });
  }

  private async handleSyncPush(clientId: string, client: WsClient, msg: WsMessage): Promise<void> {
    const ws = client.ws;
    if (!client.paired) {
      this.sendError(ws, 'NOT_PAIRED', 'Device not paired');
      return;
    }

    const { changes, client_seq } = msg.payload || {};
    if (!Array.isArray(changes)) {
      this.sendError(ws, 'INVALID_PAYLOAD', 'changes must be array');
      return;
    }

    try {
      const result = applyPush(client.deviceId, changes);
      client.lastSeq = Math.max(client.lastSeq, client_seq || 0);

      this.send(ws, {
        type: 'SYNC_ACK',
        requestId: msg.requestId,
        payload: {
          applied: result.applied,
          conflicts: result.conflicts,
          skipped: result.skipped,
          pending: result.pending,
          serverSeq: this.getMaxSeq(),
        },
      });

      this.emit('syncCompleted', this.clients.get(clientId)!, result);
    } catch (e: any) {
      logger.error('[WS] Sync push failed:', e);
      this.sendError(ws, 'SYNC_PUSH_FAILED', e.message);
    }
  }

  private async handleSyncPull(clientId: string, client: WsClient, msg: WsMessage): Promise<void> {
    const ws = client.ws;
    if (!client.paired) {
      this.sendError(ws, 'NOT_PAIRED', 'Device not paired');
      return;
    }

    const { since, force } = msg.payload || {};
    const sinceSeq = typeof since === 'number' ? since : client.lastSeq;

    try {
      let result;
      if (force) {
        requestDeviceResync(client.deviceId);
      }
      result = snapshotSince(sinceSeq);
      client.lastSeq = result.lastSeq;

      this.send(ws, {
        type: 'SYNC_CHANGES',
        requestId: msg.requestId,
        payload: {
          changes: result.changes,
          lastSeq: result.lastSeq,
          snapshot: result.snapshot,
        },
      });

      this.emit('syncCompleted', this.clients.get(clientId)!, {
        pushed: 0,
        pulled: result.changes.length,
        conflicts: 0,
      });
    } catch (e: any) {
      logger.error('[WS] Sync pull failed:', e);
      this.sendError(ws, 'SYNC_PULL_FAILED', e.message);
    }
  }

  private handleSyncVerify(clientId: string, client: WsClient, msg: WsMessage): void {
    const ws = client.ws;
    if (!client.paired) {
      this.sendError(ws, 'NOT_PAIRED', 'Device not paired');
      return;
    }

    try {
      const checksums = verifyChecksums();
      this.send(ws, {
        type: 'SYNC_VERIFY_RESPONSE',
        requestId: msg.requestId,
        payload: { checksums },
      });
    } catch (e: any) {
      logger.error('[WS] Verify failed:', e);
      this.sendError(ws, 'VERIFY_FAILED', e.message);
    }
  }

  private handleResyncRequest(clientId: string, client: WsClient, msg: WsMessage): void {
    const ws = client.ws;
    if (!client.paired) {
      this.sendError(ws, 'NOT_PAIRED', 'Device not paired');
      return;
    }

    requestDeviceResync(client.deviceId);
    this.send(ws, {
      type: 'RESYNC_RESPONSE',
      requestId: msg.requestId,
      payload: { success: true },
    });
  }

  private handleDisconnect(clientId: string, client: WsClient): void {
    this.clients.delete(clientId);
    logger.info(`[WS] Client disconnected: ${clientId} (${client.deviceId || 'unpaired'})`);
    this.emit('clientDisconnected', client);
  }

  private sendHeartbeats(): void {
    const now = Date.now();
    for (const [clientId, client] of this.clients) {
      if (now - client.lastHeartbeat > 90000) {
        // 90s timeout
        logger.warn(`[WS] Client timeout: ${clientId}`);
        client.ws.close();
        this.clients.delete(clientId);
        this.emit('clientDisconnected', client);
      } else if (client.ws.readyState === WebSocket.OPEN) {
        this.send(client.ws, { type: 'HEARTBEAT', timestamp: now });
      }
    }
  }

  private getMaxSeq(): number {
    const r = db.prepare('SELECT COALESCE(MAX(seq),0) AS m FROM sync_outbox').get() as any;
    return r?.m ?? 0;
  }

  private send(ws: WebSocket, msg: WsMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  private sendError(ws: WebSocket, code: string, message: string): void {
    this.send(ws, { type: 'ERROR', payload: { code, message } });
  }

  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.clients.clear();
    logger.info('[WS] Server stopped');
  }

  getConnectedClients(): WsClient[] {
    return Array.from(this.clients.values());
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const wsSyncServer = new WsSyncServer();

export function startWsSyncServer(): void {
  wsSyncServer.start();
}

export function stopWsSyncServer(): void {
  wsSyncServer.stop();
}