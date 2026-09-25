/**
 * Desktop WebRTC peer transport for Yjs updates.
 *
 * Uses node-datachannel (native libdatachannel) for DataChannels. Signaling is
 * relayed through the existing LAN WebSocket hub — the hub never carries
 * business data, only SDP/ICE. Once the DataChannel opens, Yjs update binaries
 * flow directly peer-to-peer (LAN or internet via STUN/TURN).
 */

import {
  buildRtcConfiguration,
  type ConnectionKind,
  type RTCIceServerLike,
  type SignalMessage,
  type YjsPeerInfo,
} from '@shega/shared';

type PeerConn = any; // node-datachannel PeerConnection
type DataChan = any; // node-datachannel DataChannel

/**
 * node-datachannel (native libdatachannel) is an optional runtime dependency.
 * The WebRTC transport degrades gracefully to LAN/relay when it is not
 * installed, instead of crashing the first dial with MODULE_NOT_FOUND.
 */
let datachannelModule: any = null;
let datachannelChecked = false;
function loadDatachannel(): any {
  if (!datachannelChecked) {
    datachannelChecked = true;
    try {
      datachannelModule = require('node-datachannel');
    } catch {
      datachannelModule = null;
    }
  }
  return datachannelModule;
}

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

/**
 * Minimal ICE candidate parser — extracts the candidate type (`host`, `srflx`
 * or `relay`). Used only for diagnostics; never logs the candidate address or
 * credentials.
 */
export function iceCandidateType(candidate: string): string | null {
  const m = / typ (\w+)/.exec(candidate || '');
  return m ? m[1].toLowerCase() : null;
}

/** Redact credentials from a turn: URL so diagnostics never leak a secret. */
export function stripUrlCreds(url: string): string {
  const m = /^(turn|turns):\/\/(?:[^:]+):([^@]+)@(.+)$/.exec(url);
  if (m) return `${m[1]}://***:***@${m[3]}`;
  const n = /^(turn|turns):(?:[^:]+):([^@]+)@(.+)$/.exec(url);
  if (n) return `${n[1]}:***:***@${n[3]}`;
  return url;
}

/**
 * Deserialize the TURN/ICE servers from the environment. Supports both a
 * single TURN URL and a comma-separated list (multiple TURN servers with the
 * same credentials), plus a raw JSON override for per-server credentials.
 *
 *   SHEGA_TURN_URL=turn:a.example.com:3478,turn:b.example.com:3478
 *   SHEGA_TURN_USERNAME=user
 *   SHEGA_TURN_PASSWORD=secret
 *   SHEGA_ICE_SERVERS=[{"urls":["turn:x"],"username":"u","credential":"p"}]
 *
 * Returns [] when nothing is configured — the app then behaves exactly as
 * before (STUN-only, direct/detected connectivity).
 */
export function readIceServersFromEnv(env: Record<string, string | undefined> = process.env): RTCIceServerLike[] {
  const out: RTCIceServerLike[] = [];
  const rawJson = env.SHEGA_ICE_SERVERS;
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as RTCIceServerLike[];
      if (Array.isArray(parsed)) {
        for (const s of parsed) {
          if (s && s.urls) out.push(s);
        }
      }
    } catch {
      // Ignore a malformed override; fall through to SHEGA_TURN_*.
    }
  }
  const rawUrl = env.SHEGA_TURN_URL;
  if (rawUrl) {
    const urls = rawUrl.split(',').map((u) => u.trim()).filter(Boolean);
    if (urls.length) {
      out.push({
        urls: urls.length === 1 ? urls[0] : urls,
        username: env.SHEGA_TURN_USERNAME || undefined,
        credential: env.SHEGA_TURN_PASSWORD || undefined,
      });
    }
  }
  return out;
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
  private iceServers: RTCIceServerLike[] = buildRtcConfiguration(readIceServersFromEnv());

  /** Wire the signaling path (typically the WS hub relay). */
  setSignalingSender(fn: (toDeviceId: string, msg: SignalMessage) => void): void {
    this.signalingSend = fn;
  }

  /** Set the ICE server list (STUN defaults are always merged in). */
  setIceServers(servers: RTCIceServerLike[]): void {
    this.iceServers = buildRtcConfiguration(servers);
  }

  /** Immutable copy of the resolved ICE server list. */
  getIceServers(): RTCIceServerLike[] {
    return this.iceServers.map((s) => ({ ...s }));
  }

  /** ICE server URLs only — never exposes credentials. */
  getIceServerUrls(): string[] {
    const urls: string[] = [];
    for (const s of this.iceServers) {
      for (const u of Array.isArray(s.urls) ? s.urls : [s.urls]) {
        urls.push(stripUrlCreds(u));
      }
    }
    return urls;
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

  private createPeer(deviceId: string, deviceType: 'mobile' | 'desktop', polite: boolean): PeerSession | null {
    const ndc = loadDatachannel();
    if (!ndc?.PeerConnection) {
      this.emit('status', `WebRTC unavailable (node-datachannel not installed) — skipping direct peer ${deviceId}`);
      return null;
    }
    const pc = new ndc.PeerConnection(`shega-${deviceId}`, {
      iceServers: this.iceServers.map((s) => ({
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
      const typ = iceCandidateType(candidate);
      if (typ) this.emit('status', `peer ${deviceId}: ICE candidate ${typ}`);
      this.signalingSend?.(deviceId, { t: 'ice', from: this.myId(), to: deviceId, candidate, sdpMid: mid });
    });

    pc.on('connectionStateChange', (state: string) => {
      this.emit('status', `peer ${deviceId}: ${state}`);
      if (state === 'connected' || state === 'completed') {
        session.kind = 'p2p-direct';
        // Classify the selected transport: direct vs TURN relay. node-datachannel
        // exposes the winning candidate pair; only the candidate types are logged.
        try {
          const pair = (pc as any).getSelectedCandidatePair?.();
          const localTyp = pair?.local ? iceCandidateType(pair.local.candidate || '') : null;
          const remoteTyp = pair?.remote ? iceCandidateType(pair.remote.candidate || '') : null;
          if (localTyp === 'relay' || remoteTyp === 'relay') {
            session.kind = 'relay';
            this.emit('status', `peer ${deviceId}: connected via TURN relay (${localTyp ?? '?'} -> ${remoteTyp ?? '?'})`);
          } else if (remoteTyp === 'srflx' || localTyp === 'srflx') {
            this.emit('status', `peer ${deviceId}: connected via STUN (${localTyp ?? '?'} -> ${remoteTyp ?? '?'})`);
          } else {
            this.emit('status', `peer ${deviceId}: connected direct (${localTyp ?? '?'} -> ${remoteTyp ?? '?'})`);
          }
        } catch { /* diagnostics only — never fail a connection on stats access */ }
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
    if (!session) return;
    const dc = session.pc.createDataChannel('yjs', { ordered: true });
    this.attachChannel(session, dc);
  }

  private acceptOffer(deviceId: string, sdp: string): void {
    try {
      let session = this.sessions.get(deviceId);
      if (!session) {
        const created = this.createPeer(deviceId, 'mobile', true);
        if (!created) return;
        session = created;
      }
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
