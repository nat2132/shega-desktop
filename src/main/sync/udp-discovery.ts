/**
 * Shega UDP Discovery Engine (Desktop side) — Sub-millisecond LAN/Hotspot Discovery.
 *
 * Bypasses mDNS multicast lock restrictions and sequential TCP IP sweeps by using
 * UDP broadcast on port 5756.
 *
 * - Listens for `SHEGA_PING` broadcasts from mobile or desktop devices.
 * - Answers immediately with `SHEGA_PONG` carrying device identity and open invite code.
 * - Broadcasts `SHEGA_PING` to 255.255.255.255 and subnet broadcast addresses for instant peer discovery.
 */

import * as dgram from 'dgram';
import { EventEmitter } from 'events';
import { ensureHubDeviceId } from '../sync-hub';
import { getDesktopDeviceName, getLocalIPv4s } from './device-name';
import { getOpenInviteCode } from './user-invites';
import type { PairingBeacon } from '@shega/shared';

export const UDP_DISCOVERY_PORT = 5756;

export interface DiscoveredUdpPeer {
  deviceId: string;
  deviceName: string;
  platform: 'desktop' | 'mobile';
  host: string;
  port: number;
  inviteCode?: string | null;
  beacon: PairingBeacon;
  discoveredAt: number;
}

type UdpEventMap = {
  peerDiscovered: [DiscoveredUdpPeer];
};

class UdpDiscoveryService extends EventEmitter<UdpEventMap> {
  private socket: dgram.Socket | null = null;
  private running = false;
  private seen = new Map<string, DiscoveredUdpPeer>();

  start(port = UDP_DISCOVERY_PORT): void {
    if (this.running) return;

    try {
      this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

      this.socket.on('error', (err) => {
        console.warn('[UDP Discovery] Socket error:', err.message);
      });

      this.socket.on('message', (msg, rinfo) => {
        this.handleMessage(msg.toString('utf8'), rinfo.address, rinfo.port);
      });

      this.socket.bind(port, () => {
        try {
          this.socket?.setBroadcast(true);
        } catch { /* ignore */ }
        this.running = true;
        console.log(`[UDP Discovery] Desktop listening on UDP port ${port}`);
      });
    } catch (e: any) {
      console.warn('[UDP Discovery] Failed to bind socket:', e?.message);
    }
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    try {
      this.socket?.close();
    } catch { /* ignore */ }
    this.socket = null;
    this.seen.clear();
  }

  /** Send an instant UDP ping to 255.255.255.255 and subnet broadcast addresses. */
  broadcastPing(): void {
    if (!this.socket || !this.running) {
      this.start();
    }
    const selfId = ensureHubDeviceId();
    const packet = JSON.stringify({
      type: 'SHEGA_PING',
      deviceId: selfId,
      deviceName: getDesktopDeviceName(),
      platform: 'desktop',
      port: 5757,
      inviteCode: getOpenInviteCode(),
      timestamp: Date.now(),
    });

    const buf = Buffer.from(packet);
    const sendBurst = () => {
      if (!this.socket || !this.running) return;
      const targets = new Set<string>(['255.255.255.255']);

      // Generate broadcast addresses for all local interfaces
      for (const ip of getLocalIPv4s()) {
        const parts = ip.split('.');
        if (parts.length === 4) {
          targets.add(`${parts[0]}.${parts[1]}.${parts[2]}.255`);
        }
      }

      // Always include mobile hotspot broadcast targets
      targets.add('192.168.43.255');
      targets.add('172.20.10.255');
      targets.add('192.168.137.255');
      targets.add('192.168.49.255');

      for (const targetHost of targets) {
        try {
          this.socket?.send(buf, 0, buf.length, UDP_DISCOVERY_PORT, targetHost, () => {});
        } catch { /* ignore send errors on inactive interfaces */ }
      }
    };

    // Send rapid burst: 0ms, 120ms, 300ms
    sendBurst();
    setTimeout(sendBurst, 120);
    setTimeout(sendBurst, 300);
  }

  private handleMessage(raw: string, senderHost: string, _senderPort: number): void {
    try {
      const msg = JSON.parse(raw);
      if (!msg || typeof msg !== 'object') return;

      const selfId = ensureHubDeviceId();
      if (msg.deviceId === selfId) return; // Ignore self packets

      if (msg.type === 'SHEGA_PING' || msg.type === 'SHEGA_PONG' || msg.type === 'SHEGA_PING_ACK') {
        // Symmetrical discovery: register peer whether packet was PING or PONG
        const peer: DiscoveredUdpPeer = {
          deviceId: String(msg.deviceId),
          deviceName: String(msg.deviceName || 'Shega Device'),
          platform: String(msg.platform || 'desktop').includes('mobile') ? 'mobile' : 'desktop',
          host: senderHost,
          port: Number(msg.port || (msg.platform === 'mobile' ? 5759 : 5757)),
          inviteCode: msg.inviteCode ? String(msg.inviteCode) : null,
          beacon: {
            v: 1,
            businessId: '',
            businessName: 'Shega',
            owner: {
              deviceId: String(msg.deviceId),
              deviceName: String(msg.deviceName || 'Shega Device'),
              platform: String(msg.platform || 'desktop').includes('mobile') ? 'mobile' : 'desktop',
            },
            code: msg.inviteCode ? String(msg.inviteCode) : '',
            role: 'owner',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            suggestedRole: 'cashier' as any,
          },
          discoveredAt: Date.now(),
        };

        this.seen.set(peer.deviceId, peer);
        console.log(`[UDP Discovery] Desktop discovered peer ${peer.deviceName} (${peer.platform}) at ${senderHost}:${peer.port} via ${msg.type}`);
        this.emit('peerDiscovered', peer);

        if (msg.type === 'SHEGA_PING') {
          // Answer PING immediately with PONG
          this.sendPong(senderHost, msg.deviceId);
        }
      }
    } catch { /* malformed packet */ }
  }

  private sendPong(targetHost: string, _targetDeviceId: string): void {
    if (!this.socket || !this.running) return;
    const packet = JSON.stringify({
      type: 'SHEGA_PONG',
      deviceId: ensureHubDeviceId(),
      deviceName: getDesktopDeviceName(),
      platform: 'desktop',
      port: 5757,
      inviteCode: getOpenInviteCode(),
      timestamp: Date.now(),
    });

    const buf = Buffer.from(packet);
    try {
      this.socket.send(buf, 0, buf.length, UDP_DISCOVERY_PORT, targetHost, () => {});
    } catch { /* best-effort */ }
  }

  getDiscoveredPeers(): DiscoveredUdpPeer[] {
    const now = Date.now();
    const out: DiscoveredUdpPeer[] = [];
    for (const [id, peer] of this.seen) {
      if (now - peer.discoveredAt > 45_000) {
        this.seen.delete(id);
      } else {
        out.push(peer);
      }
    }
    return out;
  }
}

export const udpDiscovery = new UdpDiscoveryService();
udpDiscovery.start();
