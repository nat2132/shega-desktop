import { WebSocketServer, WebSocket } from 'ws';
import { createHash, randomBytes } from 'crypto';
import { EventEmitter } from 'events';
import db from '../database';
import {
  applyPush,
  snapshotSince,
  verifyChecksums,
  getPairingToken,
  ensureHubDeviceId,
  registerDevice,
  isDeviceRevoked,
  requestDeviceResync,
  syncHubBus,
} from '../sync-hub';
import { logger } from '../logger';
import { mainBus } from '../bus';
import { notifyDataApplied } from './notify';
import {
  submitDeviceJoinRequest,
  listDeviceJoinRequests,
  decideDeviceJoinRequest,
  publishInvitation,
  resolveInvitation,
  getDeviceJoinRequestBy,
  getDeviceJoinRequestByDevice,
  canonicalBusinessUuid,
  businessDisplayName,
} from './device-requests';
import { DEVICE_JOIN_MSG, PERIPHERAL_MSG, PROTOCOL_VERSION } from '@shega/shared';
import {
  defaultPairingLogger,
  shortId,
  PAIRING_SESSION_MSG,
  type PairingHandshakeAck,
} from '@shega/shared';
import { p2pSync } from './p2p-sync-manager';
import {
  peripheralHub,
  buildScanRequest,
  buildCaptureRequest,
} from './peripheral-server';

export const WS_SYNC_PORT = 5758;

export interface WsClient {
  ws: WebSocket;
  /** id assigned in handleConnection; also used to route phone peripherals */
  clientId?: string;
  deviceId: string;
  paired: boolean;
  lastHeartbeat: number;
  lastSeq: number;
}

export interface WsMessage {
  type: string;
  payload?: any;
  requestId?: string;
  timestamp?: number;
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
  private outboxWatchInterval: NodeJS.Timeout | null = null;
  private lastBroadcastSeq = 0;
  /**
   * Joiner device ids that are actively polling this hub over a live socket.
   * The pairing session has a single source of truth — the `device_requests`
   * row — but a pushed decision needs a socket to travel over, so we remember
   * which joiner sits on which connection. Populated by join-status polls and
   * join submits (both are sent by an unpaired joiner, so they are the only
   * proof that a joiner is reachable right now).
   */
  private joinWaiters = new Map<string, string>();

  private log = defaultPairingLogger;

  start(port: number = WS_SYNC_PORT): void {
    if (this.wss) return;

    // Owner approved a radar/late peer: push the decision down the joiner's
    // live socket immediately instead of waiting for its next poll, and log the
    // handshake so both consoles show the same connection state.
    p2pSync.setJoinDecisionNotifier((deviceId, payload) => this.notifyJoinDecision(deviceId, payload));

    // Any transport that applies new data (a phone pushing over HTTP, a peer
    // desktop pulling, or another WS client) makes every connected client pull
    // immediately — live convergence instead of timer-driven pulls.
    syncHubBus.on('applied', () => this.broadcastDataChanged());

    this.wss = new WebSocketServer({ port });
    this.wss.on('connection', (ws: WebSocket, req) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (err) => {
      logger.error('[WS] Server error:', err);
      if ((err as NodeJS.ErrnoException).code !== 'EADDRINUSE') {
        this.emit('error', err);
      }
    });

    // Heartbeat to detect dead connections
    this.heartbeatInterval = setInterval(() => this.sendHeartbeats(), 30000);

    // Outbox watcher: broadcast DATA_CHANGED whenever the outbox max seq advances,
    // so desktop-local writes (which don't fire 'applied') also push live updates
    // to connected WS clients. Runs every 2s — low overhead, instant convergence.
    this.lastBroadcastSeq = this.getMaxSeq();
    this.outboxWatchInterval = setInterval(() => {
      const current = this.getMaxSeq();
      if (current > this.lastBroadcastSeq) {
        this.lastBroadcastSeq = current;
        this.broadcastDataChanged();
      }
    }, 2000);

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

    client.clientId = clientId;
    this.clients.set(clientId, client);
    logger.info(`[WS] Client connected: ${clientId}`);

    // NOTE: `device-connected` is intentionally NOT emitted here — at connect
    // time the client has no identity yet (device_id/name/platform are only
    // known after PAIR_REQUEST). Emitting with undefined locals used to throw
    // a ReferenceError, killing the socket before its message handler attached
    // (the whole WS channel was dead). The event fires from handlePairRequest
    // with the real identity instead.

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
      if (client.deviceId) mainBus.emitEvent('device-disconnected', { deviceId: client.deviceId, deviceName: client.deviceId, platform: 'unknown' });
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

      case 'HEARTBEAT_ACK':
        // Client acknowledges our heartbeat — no action needed.
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

      // Pairing connection handshake (shared contract): a joiner announces
      // itself and the hub answers with an explicit acknowledgement, so neither
      // side has to guess whether the connection exists.
      case PAIRING_SESSION_MSG.HELLO:
        this.handlePairSessionHello(clientId, client, msg);
        break;

      case PERIPHERAL_MSG.REGISTER:
        this.handlePeripheralRegister(clientId, client, msg);
        break;

      case PERIPHERAL_MSG.SCAN_RESULT:
      case PERIPHERAL_MSG.CAPTURE_RESULT:
        peripheralHub.ingestResult(msg.type, msg.payload);
        break;

      case PERIPHERAL_MSG.STATUS:
        // Companion-mode status beacons from a phone (mode, busy).
        peripheralHub.ingestStatus(client.deviceId, msg.payload);
        break;

      case 'INVITE_CLAIM':
        this.handleInviteClaim(ws, msg);
        break;

      case 'INVITE_STATUS':
        this.handleInviteStatusQuery(ws, msg);
        break;

      case 'P2P_SIGNAL':
        if (!client.paired) { this.sendError(ws, 'NOT_PAIRED', 'Device not paired'); break; }
        // Signaling only — relay SDP/ICE between paired clients. Never carries
        // business data; Yjs updates flow directly over WebRTC DataChannels.
        {
          const payload = msg.payload || {};
          const target = payload.to ? this.findByDeviceId(String(payload.to)) : null;
          const envelope = payload.signal || payload;
          if (target) {
            this.send(target.ws, { type: 'P2P_SIGNAL', payload: { from: clientId, signal: envelope } });
          } else if (payload.to === '__broadcast__') {
            for (const [id, c] of this.clients) {
              if (id !== clientId) this.send(c.ws, { type: 'P2P_SIGNAL', payload: { from: clientId, signal: envelope } });
            }
          }
          p2pSync.handleSignalEnvelope(client.deviceId, envelope);
        }
        break;

      default:
        this.sendError(ws, 'UNKNOWN_TYPE', `Unknown message type: ${msg.type}`);
    }
  }

  private handlePairRequest(clientId: string, client: WsClient, msg: WsMessage): void {
    const ws = client.ws;
    const { device_id, name, token, platform } = msg.payload || {};

    if (!device_id) {
      this.sendError(ws, 'PAIR_FAILED', 'device_id required', msg.requestId);
      return;
    }

    const hubToken = getPairingToken();
    if (String(token ?? '').trim().toUpperCase() !== hubToken) {
      this.sendError(ws, 'PAIR_FAILED', token ? 'Invalid pairing token' : 'Pairing token required', msg.requestId);
      return;
    }

    // A revoked/unpaired device is refused even with a valid token — it must
    // be re-approved by an owner (new pairing/authorization) first.
    if (isDeviceRevoked(device_id)) {
      this.sendError(ws, 'PAIR_FAILED', 'Device was unpaired by the owner. A new pairing is required.', msg.requestId);
      logger.warn(`[WS] Refused re-pair from revoked device ${device_id}`);
      return;
    }

    registerDevice(device_id, name, platform);
    client.deviceId = device_id;
    client.paired = true;

    mainBus.emitEvent('device-connected', {
      deviceId: device_id,
      deviceName: name || device_id,
      platform: platform || 'unknown',
    });

    this.send(ws, {
      type: 'PAIR_RESPONSE',
      requestId: msg.requestId,
      payload: {
        success: true,
        hubId: ensureHubDeviceId(),
        serverSeq: this.getMaxSeq(),
        schemaVersion: PROTOCOL_VERSION,
      },
    });

    logger.info(`[WS] Device paired: ${device_id} (${name || 'unknown'})`);
    this.emit('clientConnected', this.clients.get(clientId)!);
  }

  private handleDeviceJoinSubmit(clientId: string, client: WsClient, msg: WsMessage): void {
    const ws = client.ws;
    const payload = msg.payload || {};
    const joinerDeviceId = String(payload.joinerDeviceId ?? payload.joiner_device_id ?? '');
    if (!joinerDeviceId) {
      this.sendError(ws, 'DEVICE_JOIN_FAILED', 'joinerDeviceId required');
      return;
    }
    const code = String(payload.code ?? '');
    const inv = code ? resolveInvitation(code) : null;
    const { getActiveBusinessId } = require('../ipc-handlers');
    const bizId = inv?.businessId || payload.businessId || String(getActiveBusinessId() || 1);

    const rec = submitDeviceJoinRequest({ ...payload, code, businessId: bizId, joinerDeviceId });
    this.registerJoinWaiter(clientId, rec.joinerDeviceId, 'submit');
    this.send(ws, {
      type: DEVICE_JOIN_MSG.ACK,
      requestId: msg.requestId,
      payload: {
        requestId: rec.requestId,
        status: rec.status,
        handshake: this.buildHandshakeAck({ ...rec, status: rec.status }),
      },
    });
    this.log('info', 'join request staged — connection acknowledged', {
      joiner: shortId(rec.joinerDeviceId),
      requestId: rec.requestId ?? null,
      business: inv?.businessName ?? null,
    });
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
    // Owner-assigned identity (name/avatar/role/permissions) rides on the
    // decision payload and is applied when the approval materializes the user.
    const rec = decideDeviceJoinRequest({
      requestId: String(payload.requestId),
      businessId: String(payload.businessId ?? ''),
      joinerDeviceId: String(payload.joinerDeviceId ?? ''),
      decision: payload.decision,
      decidedBy: String(payload.decidedBy ?? ''),
      assignedName: payload.assignedName,
      assignedAvatar: payload.assignedAvatar ?? null,
      assignedRole: payload.assignedRole ?? payload.role,
      assignedPermissions: payload.assignedPermissions ?? payload.permissions,
    } as any);
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
    if (!joinerDeviceId) { this.sendError(ws, 'DEVICE_JOIN_FAILED', 'joinerDeviceId required'); return; }
    // Code-less admission: radar-tap approvals are keyed by joiner_device_id
    // alone (the owner tapped the joiner, no invite code was ever typed). When
    // no code rides along, fall back to the device-keyed lookup so the joiner
    // can learn its decision without an invite code.
    const rec = code
      ? getDeviceJoinRequestBy(String(code), joinerDeviceId)
      : getDeviceJoinRequestByDevice(joinerDeviceId);
    // Every poll proves the joiner is live on this socket: remember it so the
    // owner's approval can be PUSHED instead of waiting for the next poll.
    this.registerJoinWaiter(clientId, String(joinerDeviceId), 'status-poll');
    const payload: any = { record: rec };
    // Approval hands the admitted device its pairing credential in-band (same
    // as the HTTP hub) — without it the code-less joiner could never pair.
    if (rec && rec.status === 'approved') {
      payload.pairingToken = getPairingToken();
    }
    // Explicit connection acknowledgement. `handshake.ok` means "this hub holds
    // your session" — the signal the joiner needs to leave "Waiting for
    // connection…" even before the owner decides.
    payload.handshake = this.buildHandshakeAck(rec);
    if (!rec || rec.status === 'pending') {
      this.log('info', 'join status poll — connection acknowledged, awaiting owner', {
        joiner: shortId(String(joinerDeviceId)),
        code: code ? 'yes' : 'none',
      });
    } else {
      this.log('info', `join status poll — decision returned: ${rec.status}`, {
        joiner: shortId(String(joinerDeviceId)),
        requestId: rec.requestId ?? null,
        role: rec.role ?? null,
      });
    }
    this.send(ws, { type: DEVICE_JOIN_MSG.RESPONSE, requestId: msg.requestId, payload });
  }

  /**
   * The shared handshake acknowledgement for a joiner.
   *
   * `ok: true` = this hub holds the joiner's session and the connection is real;
   * `status` = the decision currently recorded (the owner's role assignment
   * rides the same record). Both platforms read this shape, so the owner's
   * "Connected" and the joiner's connected state come from ONE record.
   */
  private buildHandshakeAck(
    rec: { requestId?: string | null; status?: string | null; businessId?: string | null } | null,
  ): PairingHandshakeAck {
    let businessName: string | null = null;
    let businessId: string | null = rec?.businessId ? String(rec.businessId) : null;
    try {
      if (businessId) businessName = businessDisplayName(businessId);
      if (!businessId) businessId = canonicalBusinessUuid(this.currentBusinessUuid()) || null;
    } catch { /* business naming is cosmetic — never fail the ack */ }
    return {
      ok: true,
      hubDeviceId: ensureHubDeviceId(),
      hubName: 'Shega Desktop',
      hubPlatform: 'desktop',
      hubPort: WS_SYNC_PORT,
      businessId,
      businessName,
      status: (rec?.status ?? 'pending') as PairingHandshakeAck['status'],
      requestId: rec?.requestId ?? null,
      at: Date.now(),
    };
  }

  private currentBusinessUuid(): string {
    try {
      const row = db.prepare('SELECT uuid FROM businesses WHERE isDefault = 1 OR id = 1 LIMIT 1').get() as any;
      return row?.uuid ? String(row.uuid) : '';
    } catch { return ''; }
  }

  /** Remember which socket a joiner device is polling from. */
  private registerJoinWaiter(clientId: string, joinerDeviceId: string, via: string): void {
    if (!joinerDeviceId) return;
    const known = this.joinWaiters.get(joinerDeviceId);
    if (known !== clientId) {
      this.joinWaiters.set(joinerDeviceId, clientId);
      this.log('info', 'joiner connection tracked', { joiner: shortId(joinerDeviceId), via });
    }
  }

  /**
   * Push a join decision to a joiner that is connected right now.
   *
   * Called by the owner's approval path (`p2p:approve-one` → approveIncoming)
   * the moment a device is granted, so a radar-tap admission reaches the joiner
   * instantly instead of on its next 4s poll. Returns false when the joiner has
   * no live socket — the caller keeps the poll as the durable fallback.
   */
  notifyJoinDecision(joinerDeviceId: string, payload: { record?: any; pairingToken?: string; handshake?: PairingHandshakeAck }): boolean {
    const clientId = this.joinWaiters.get(joinerDeviceId);
    if (!clientId) {
      this.log('info', 'decision not pushed — joiner has no live socket (poll will deliver it)', {
        joiner: shortId(joinerDeviceId),
      });
      return false;
    }
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      this.joinWaiters.delete(joinerDeviceId);
      this.log('warn', 'decision push skipped — joiner socket closed', { joiner: shortId(joinerDeviceId) });
      return false;
    }
    const body = {
      ...(payload ?? {}),
      handshake: payload?.handshake ?? this.buildHandshakeAck(payload?.record ?? null),
    };
    // A pushed decision has no caller-issued requestId, so the joiner treats a
    // requestId-less RESPONSE as an out-of-band session update.
    this.send(client.ws, { type: DEVICE_JOIN_MSG.RESPONSE, payload: body });
    this.log('info', `decision pushed to joiner: ${payload?.record?.status ?? 'updated'}`, {
      joiner: shortId(joinerDeviceId),
      role: payload?.record?.role ?? null,
      tokenIncluded: !!payload?.pairingToken,
    });
    return true;
  }

  /** Push a bare connection acknowledgement to a joiner (handshake only). */
  notifyJoinAck(joinerDeviceId: string): boolean {
    const clientId = this.joinWaiters.get(joinerDeviceId);
    if (!clientId) return false;
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return false;
    this.send(client.ws, {
      type: DEVICE_JOIN_MSG.ACK,
      payload: { status: 'pending', handshake: this.buildHandshakeAck(null) },
    });
    this.log('info', 'handshake ack pushed to joiner', { joiner: shortId(joinerDeviceId) });
    return true;
  }

  /** Pairing-session hello from a joiner: answer with the handshake ack. */
  private handlePairSessionHello(clientId: string, client: WsClient, msg: WsMessage): void {
    const joinerDeviceId = String(msg.payload?.deviceId ?? msg.payload?.joinerDeviceId ?? '');
    this.registerJoinWaiter(clientId, joinerDeviceId, 'pair-session-hello');
    const rec = joinerDeviceId ? getDeviceJoinRequestByDevice(joinerDeviceId) : null;
    this.send(client.ws, {
      type: DEVICE_JOIN_MSG.ACK,
      requestId: msg.requestId,
      payload: {
        status: rec?.status ?? 'pending',
        record: rec,
        ...(rec?.status === 'approved' ? { pairingToken: getPairingToken() } : {}),
        handshake: this.buildHandshakeAck(rec),
      },
    });
    this.log('info', 'pair-session hello acknowledged', {
      joiner: shortId(joinerDeviceId),
      status: rec?.status ?? 'none',
    });
  }

  // ---------- Phone-peripheral channel (scanner / camera) ----------

  private handlePeripheralRegister(clientId: string, client: WsClient, msg: WsMessage): void {
    const ws = client.ws;
    if (!client.paired) { this.sendError(ws, 'NOT_PAIRED', 'Device not paired'); return; }
    const reg = peripheralHub.register(client.clientId || clientId, { ...(msg.payload || {}), platform: 'mobile' });
    if (!reg) { this.sendError(ws, 'PERIPHERAL_FAILED', 'deviceId required'); return; }
    this.send(ws, { type: PERIPHERAL_MSG.ACK, requestId: msg.requestId, payload: { registered: true, hubId: ensureHubDeviceId() } });
  }

  /** IPC-facing: ask a connected phone to scan a barcode. */
  requestScan(deviceId: string): string {
    const phone = peripheralHub.get(deviceId);
    if (!phone) throw new Error('Phone not connected');
    const req = buildScanRequest(peripheralHub.trackRequest('scan'));
    this.sendToPhone(phone.socketClientId, req.type, req.payload);
    return req.payload.requestId;
  }

  /** IPC-facing: ask a connected phone to capture a photo / scan with camera. */
  requestCapture(deviceId: string, mode: 'photo' | 'barcode' | 'qr'): string {
    const phone = peripheralHub.get(deviceId);
    if (!phone) throw new Error('Phone not connected');
    const req = buildCaptureRequest(peripheralHub.trackRequest('capture'), mode);
    this.sendToPhone(phone.socketClientId, req.type, req.payload);
    return req.payload.requestId;
  }

  /** IPC-facing: cancel an outstanding request (user gave up). */
  cancelRequest(deviceId: string, requestId: string): void {
    const phone = peripheralHub.get(deviceId);
    if (!phone) return;
    this.sendToPhone(phone.socketClientId, PERIPHERAL_MSG.CANCEL, { requestId });
  }

  private sendToPhone(socketClientId: string, type: string, payload: any): void {
    const client = this.clients.get(socketClientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      this.send(client.ws, { type, payload });
    }
  }

  /** Notify every connected phone that this hub accepts peripherals. */
  broadcastHello(): void {
    for (const c of this.clients.values()) {
      if (c.paired) this.send(c.ws, { type: PERIPHERAL_MSG.HELLO, payload: { hubId: ensureHubDeviceId() } });
    }
  }

  /** Joiner claims an invite code and submits their name (LAN path). */
  private handleInviteClaim(ws: any, msg: any): void {
    const { code, name, joinerDeviceId } = msg.payload || {};
    if (!code || !joinerDeviceId) { this.sendError(ws, 'INVITE_FAILED', 'code and joinerDeviceId required'); return; }
    // Lazy import avoids a circular dependency at module load.
    const { claimUserInvite } = require('./user-invites');
    const rec = claimUserInvite(String(code).trim().toUpperCase(), String(name || 'New user').trim(), joinerDeviceId);
    if (!rec) { this.sendError(ws, 'INVITE_INVALID', 'Invitation not found or already used'); return; }
    const bizRef = String(rec.businessId);
    this.send(ws, { type: 'INVITE_RESPONSE', requestId: msg.requestId, payload: { invite: { id: rec.id, status: rec.status, businessId: canonicalBusinessUuid(bizRef), suggestedRole: rec.suggestedRole, businessName: businessDisplayName(bizRef) || `Business ${rec.businessId}` } } });
  }

  /** Joiner polls the decision on their invite. */
  private handleInviteStatusQuery(ws: any, msg: any): void {
    const { code } = msg.payload || {};
    if (!code) { this.sendError(ws, 'INVITE_FAILED', 'code required'); return; }
    const { getUserInviteStatus } = require('./user-invites');
    const rec = getUserInviteStatus(String(code).trim().toUpperCase());
    if (!rec) { this.send(ws, { type: 'INVITE_RESPONSE', requestId: msg.requestId, payload: { invite: null } }); return; }
    const bizRef = String(rec.businessId);
    const payload = { type: 'INVITE_RESPONSE', requestId: msg.requestId, payload: { invite: { id: rec.id, status: rec.status, businessId: canonicalBusinessUuid(bizRef), suggestedRole: rec.suggestedRole, businessName: businessDisplayName(bizRef) || `Business ${rec.businessId}` } as any } };
    // An approved user invite admits the device — hand it the hub pairing
    // credential so the joiner can pair + sync, exactly like the device-join
    // STATUS grant (J1).
    if (rec.status === 'approved') payload.payload.invite.pairingToken = getPairingToken();
    this.send(ws, payload);
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
          results: result.results,
          serverSeq: this.getMaxSeq(),
        },
      });

      this.emit('syncCompleted', this.clients.get(clientId)!, {
        pushed: result.applied,
        pulled: 0,
        conflicts: result.conflicts,
      });
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
    const deviceId = client.deviceId;
    this.clients.delete(clientId);
    // Stop pushing decisions to a socket that is gone; the joiner falls back to
    // its poll (which is the durable path).
    for (const [joinerId, waiterClientId] of this.joinWaiters) {
      if (waiterClientId === clientId) {
        this.joinWaiters.delete(joinerId);
        this.log('info', 'joiner waiter released', { joiner: shortId(joinerId), reason: 'disconnected' });
      }
    }
    peripheralHub.unregisterBySocket(clientId);
    logger.info(`[WS] Client disconnected: ${clientId} (${deviceId || 'unpaired'})`);
    if (deviceId) this.markRosterOffline(deviceId);
    this.emit('clientDisconnected', client);
  }

  private markRosterOffline(deviceId: string): void {
    try {
      db.prepare("UPDATE roster_devices SET status = 'offline', updated_at = CURRENT_TIMESTAMP WHERE uuid = ? OR device_id = ?")
        .run(deviceId, deviceId);
    } catch { /* roster table naming may differ */ }
  }

  private sendHeartbeats(): void {
    const now = Date.now();
    for (const [clientId, client] of this.clients) {
      if (now - client.lastHeartbeat > 90000) {
        // 90s timeout
        logger.warn(`[WS] Client timeout: ${clientId}`);
        const deadDeviceId = client.deviceId;
        client.ws.close();
        this.clients.delete(clientId);
        if (deadDeviceId) this.markRosterOffline(deadDeviceId);
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

  findByDeviceId(deviceId: string): WsClient | null {
    for (const c of this.clients.values()) if (c.deviceId === deviceId) return c;
    return null;
  }

  /** Tell every paired client that new server data is available to pull. */
  broadcastDataChanged(): void {
    const news: WsMessage = {
      type: 'DATA_CHANGED',
      payload: { at: new Date().toISOString(), serverSeq: this.getMaxSeq() },
    };
    for (const c of this.clients.values()) {
      if (c.paired) this.send(c.ws, news);
    }
  }

  /** Push a signaling message to a connected client (or broadcast). */
  sendSignal(toDeviceId: string, signal: unknown): void {
    const payload = { type: 'P2P_SIGNAL', payload: { from: 'desktop-hub', signal } };
    if (toDeviceId === '__broadcast__') {
      for (const c of this.clients.values()) this.send(c.ws, payload);
    } else {
      const target = this.findByDeviceId(toDeviceId);
      if (target) this.send(target.ws, payload);
    }
  }

  private sendError(ws: WebSocket, code: string, message: string, requestId?: string): void {
    // Echo requestId so the client can settle the exact pending request —
    // omitting it left PAIR_REQUEST hanging until timeout while the socket
    // stayed open (mobile never re-armed its reconnect: zombie pairing).
    this.send(ws, { type: 'ERROR', requestId, payload: { code, message } });
  }

  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.outboxWatchInterval) {
      clearInterval(this.outboxWatchInterval);
      this.outboxWatchInterval = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    syncHubBus.removeAllListeners('applied');
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

// Desktop → peer signaling: route via the WS hub to the target device.
p2pSync.setSignalingRelay((toDeviceId, signal) => {
  wsSyncServer.sendSignal(toDeviceId, signal);
});

export function startWsSyncServer(): void {
  wsSyncServer.start();
}

export function stopWsSyncServer(): void {
  wsSyncServer.stop();
}