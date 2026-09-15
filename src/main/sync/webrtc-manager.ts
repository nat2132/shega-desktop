/**
 * Desktop WebRTC peer transport for Yjs updates.
 *
 * Uses node-datachannel (native libdatachannel) for DataChannels. Signaling is
 * relayed through the existing LAN WebSocket hub — the hub never carries
 * business data, only SDP/ICE. Once the DataChannel opens, Yjs update binaries
 * flow directly peer-to-peer (LAN or internet via STUN/TURN).
 */

import {
  DEFAULT_ICE_SERVERS,
  type ConnectionKind,
  type SignalMessage,
  type YjsPeerInfo,
} from '@shega/shared';

type PeerConn = any; // node-datachannel PeerConnection
type DataChan = any; // node-datachannel DataChannel

interface PeerSession {
  deviceId: string;
  deviceType: 'mobile' | 'desktop';
  pc: PeerConn;
  dc: DataChan | null;
  businessId: string;
  kind: ConnectionKind;
  connectedAt: number;
  polite: boolean; // glare handling: one side yields
}

interface YjsWebRtcEvents {
  peerConnected: (peer: YjsPeerInfo) => void;
  peerDisconnected: (deviceId: string) => void;
  update: (businessId: string, fromDeviceId: string, update: Uint8Array) => void;
  status: (line: string) => void;
}

export class DesktopWebRtcManager {
  private sessions = new Map<string, PeerSession>();
  private signalingSend: ((toDeviceId: string, msg: SignalMessage) => void) | null = null;
  private listeners = new Map<keyof YjsWebRtcEvents, Set<Function>>();
  private businessId = '';

  /** Wire the signaling path (typically the WS hub relay). */
  setSignalingSender(fn: (toDeviceId: string, msg: SignalMessage) => void): void {
    this.signalingSend = fn;
  }

  on<K extends keyof YjsWebRtcEvents>(event: K, fn: YjsWebRtcEvents[K]): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return () => this.listeners.get(event)!.delete(fn);
  }

  private emit<K extends keyof YjsWebRtcEvents>(event: K, ...args: Parameters<YjsWebRtcEvents[K]>): void {
    this.listeners.get(event)?.forEach((fn) => (fn as Function)(...args));
  }

  setBusinessId(businessId: string): void {
    this.businessId = businessId;
  }

  getPeers(): YjsPeerInfo[] {
    return [...this.sessions.values()].map((s) => ({
      deviceId: s.deviceId,
      deviceType: s.deviceType,
      businessId: s.businessId,
      kind: s.kind,
      connectedAt: s.connectedAt,
    }));
  }

  isConnectedToDevice(deviceId: string): boolean {
    const s = this.sessions.get(deviceId);
    return !!s && !!s.dc;
  }

  /** Send a Yjs update binary to a connected peer. */
  sendUpdate(deviceId: string, update: Uint8Array): boolean {
    const s = this.sessions.get(deviceId);
    if (!s?.dc || s.dc.readyState !== 'open') return false;
    try {
      s.dc.sendMessage(Buffer.from(update));
      return true;
    } catch {
      return false;
    }
  }

  broadcastUpdate(businessId: string, update: Uint8Array): void {
    for (const [deviceId, s] of this.sessions) {
      if (s.businessId === businessId) this.sendUpdate(deviceId, update);
    }
  }

  /** Handle a signaling message relayed by the hub. */
  handleSignal(msg: SignalMessage): void {
    switch (msg.t) {
      case 'hello':
        // A new peer announced itself — initiate if we are the deterministic
        // initiator (higher device id goes first to avoid double offers).
        if (msg.businessId !== this.businessId) return;
        if (this.sessions.has(msg.deviceId)) return;
        if (this.deviceIdRank() > this.rankOf(msg.deviceId, msg.deviceType)) {
          this.createOffer(msg.deviceId, msg.deviceType);
        }
        break;
      case 'offer':
        if (msg.to !== this.myId()) return;
        this.acceptOffer(msg.from, msg.sdp);
        break;
      case 'answer':
        if (msg.to !== this.myId()) return;
        this.acceptAnswer(msg.from, msg.sdp);
        break;
      case 'ice':
        if (msg.to !== this.myId()) return;
        {
          const s = this.sessions.get(msg.from);
          if (s?.pc) {
            try { s.pc.addRemoteCandidate(msg.candidate, msg.sdpMid ?? '0'); } catch { /* ignore */ }
          }
        }
        break;
      case 'bye': {
        this.closePeer(msg.from);
        break;
      }
    }
  }

  private myId(): string { return 'desktop'; } // replaced at init via setDeviceId
  private deviceIdRank(): number { return this.rankOf(this.myId(), 'desktop'); }
  private rankOf(id: string, _t: string): number {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return h;
  }

  private setDeviceId(id: string): void {
    (this as any).myId = () => id;
  }

  init(deviceId: string, businessId: string): void {
    this.setDeviceId(deviceId);
    this.businessId = businessId;
  }

  private createPeer(deviceId: string, deviceType: 'mobile' | 'desktop', polite: boolean): PeerSession {
    const pc = new (require('node-datachannel').PeerConnection)(`shega-${deviceId}`, {
      iceServers: DEFAULT_ICE_SERVERS.map((s) => ({
        urls: Array.isArray(s.urls) ? s.urls : [s.urls],
        username: s.username,
        credential: s.credential,
      })),
    });
    const session: PeerSession = {
      deviceId, deviceType, pc, dc: null,
      businessId: this.businessId, kind: 'p2p-direct',
      connectedAt: 0, polite,
    };
    this.sessions.set(deviceId, session);

    pc.on('localDescription', (sdp: any) => {
      const isOffer = sdp.type === 'offer';
      const m: SignalMessage = isOffer
        ? { t: 'offer', from: this.myId(), to: deviceId, sdp: sdp.sdp }
        : { t: 'answer', from: this.myId(), to: deviceId, sdp: sdp.sdp };
      this.signalingSend?.(deviceId, m);
    });

    pc.on('localCandidate', (candidate: string, mid: string) => {
      this.signalingSend?.(deviceId, { t: 'ice', from: this.myId(), to: deviceId, candidate, sdpMid: mid });
    });

    pc.on('connectionStateChange', (state: string) => {
      this.emit('status', `peer ${deviceId}: ${state}`);
      if (state === 'connected' || state === 'completed') {
        session.kind = 'p2p-direct';
      } else if (state === 'failed' || state === 'closed' || state === 'disconnected') {
        this.closePeer(deviceId);
      }
    });

    pc.on('dataChannel', (dc: DataChan) => this.attachChannel(session, dc));
    return session;
  }

  private attachChannel(session: PeerSession, dc: DataChan): void {
    session.dc = dc;
    dc.on('open', () => {
      session.connectedAt = Date.now();
      this.emit('peerConnected', {
        deviceId: session.deviceId,
        deviceType: session.deviceType,
        businessId: session.businessId,
        kind: session.kind,
        connectedAt: session.connectedAt,
      });
      this.emit('status', `peer ${session.deviceId}: datachannel open`);
    });
    dc.on('closed', () => this.closePeer(session.deviceId));
    dc.on('message', (data: ArrayBuffer | string) => {
      if (typeof data === 'string') return;
      this.emit('update', session.businessId, session.deviceId, new Uint8Array(data));
    });
  }

  createOffer(deviceId: string, deviceType: 'mobile' | 'desktop'): void {
    if (this.sessions.has(deviceId)) return;
    const session = this.createPeer(deviceId, deviceType, false);
    const dc = session.pc.createDataChannel('yjs', { ordered: true });
    this.attachChannel(session, dc);
  }

  private acceptOffer(deviceId: string, sdp: string): void {
    try {
      let session = this.sessions.get(deviceId);
      if (!session) session = this.createPeer(deviceId, 'mobile', true);
      session.pc.setRemoteDescription(sdp, 'offer');
    } catch (e) {
      this.emit('status', `acceptOffer failed: ${String(e)}`);
    }
  }

  private acceptAnswer(deviceId: string, sdp: string): void {
    const session = this.sessions.get(deviceId);
    if (!session) return;
    try { session.pc.setRemoteDescription(sdp, 'answer'); } catch { /* ignore */ }
  }

  closePeer(deviceId: string): void {
    const s = this.sessions.get(deviceId);
    if (!s) return;
    try { s.dc?.close(); } catch {}
    try { s.pc.close(); } catch {}
    this.sessions.delete(deviceId);
    this.emit('peerDisconnected', deviceId);
  }

  closeAll(): void {
    for (const id of [...this.sessions.keys()]) this.closePeer(id);
  }
}

export const desktopWebRtc = new DesktopWebRtcManager();
