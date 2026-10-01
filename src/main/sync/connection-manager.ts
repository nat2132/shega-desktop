/**
 * DesktopConnectionManager — Authoritative Connection State Manager for Shega Desktop.
 *
 * Enforces:
 * 1. Single source of truth for peer device connection states across WebRTC, WebSocket, and LAN discovery.
 * 2. Endpoint candidate management: merges discovered endpoints per deviceId across mDNS, UDP, LAN sweep, and cache.
 * 3. Endpoint selection with IPv4 preference, port preservation, and unreachable-endpoint filtering via @shega/shared.
 * 4. Multi-transport aggregation: a peer remains Connected as long as ANY transport is active.
 * 5. 20-second Grace Period and 3-attempt failure threshold before marking a device as Disconnected.
 * 6. Stale event protection using generation numbers.
 * 7. Diagnostic logging for all discovery, endpoint selection, and connection state transitions.
 */

import { EventEmitter } from 'events';
import {
  type EndpointCandidate,
  type EndpointTransport,
  type ResolvedEndpoint,
  selectEndpoint,
  mergeEndpoints,
  markUnreachable,
  markReachable,
  ConnectionStateRegistry,
  type ConnectionState,
} from '@shega/shared';

export type DeviceConnectionState = 'connected' | 'reconnecting' | 'disconnected';
export type TransportType = 'ws' | 'webrtc' | 'tcp' | 'lan';

export interface TransportActiveState {
  ws: boolean;
  webrtc: boolean;
  tcp: boolean;
  lan: boolean;
}

export interface DeviceConnectionInfo {
  deviceId: string;
  state: DeviceConnectionState;
  activeTransports: TransportActiveState;
  primaryTransport: 'lan' | 'p2p' | 'relay' | 'cloud';
  lastSeenAt: number;
  lastConnectedAt: number;
  failureCount: number;
  generation: number;
}

class DesktopConnectionManager extends EventEmitter {
  private devices = new Map<string, DeviceConnectionInfo>();
  private deviceEndpoints = new Map<string, EndpointCandidate[]>();
  private graceTimers = new Map<string, NodeJS.Timeout>();
  public stateRegistry = new ConnectionStateRegistry();

  private readonly GRACE_PERIOD_MS = 20_000;
  private readonly MIN_FAILURES_BEFORE_OFFLINE = 3;

  // ─── Endpoint Candidate Management ─────────────────────────────────────────

  /**
   * Register or merge a discovered endpoint for a device ID.
   * Merges multiple candidates (mDNS, UDP, LAN sweep, cache) under ONE deviceId.
   */
  public addDiscoveredEndpoint(deviceId: string, candidate: EndpointCandidate): void {
    if (!deviceId || !candidate || !candidate.host || !candidate.port) return;

    const existing = this.deviceEndpoints.get(deviceId) ?? [];
    const merged = mergeEndpoints(existing, [candidate]);
    this.deviceEndpoints.set(deviceId, merged);

    console.log(
      `[Discovery] device=${deviceId} source=${candidate.source} host=${candidate.host} port=${candidate.port} transport=${candidate.transport}`
    );
    console.log(
      `[EndpointModel] device=${deviceId} action=merge_endpoint endpoint=${candidate.host}:${candidate.port} source=${candidate.source}`
    );

    // Also update connection state registry
    const current = this.stateRegistry.get(deviceId);
    if (!current || current.state === 'disconnected') {
      this.stateRegistry.set(deviceId, 'discovered', {
        endpoint: `${candidate.host}:${candidate.port}`,
        transport: candidate.transport,
      });
    }
  }

  /**
   * Get all endpoint candidates registered for a device ID.
   */
  public getEndpoints(deviceId: string): EndpointCandidate[] {
    return this.deviceEndpoints.get(deviceId) ?? [];
  }

  /**
   * Select the best usable endpoint for a device using IPv4 preference rules from @shega/shared.
   */
  public selectBestEndpoint(
    deviceId: string,
    opts: { scheme?: string; path?: string; preferTransport?: EndpointTransport } = {}
  ): ResolvedEndpoint | null {
    const candidates = this.getEndpoints(deviceId);
    const resolved = selectEndpoint(candidates, opts);
    if (resolved) {
      console.log(
        `[Connection] device=${deviceId} selectedEndpoint=${resolved.url || resolved.authority} transport=${resolved.transport}`
      );
    }
    return resolved;
  }

  /**
   * Mark a specific host:port as unreachable (e.g. after ECONNREFUSED, EHOSTUNREACH, timeout).
   * Does NOT remove the device; allows discovery to replace/recover the endpoint.
   */
  public markEndpointUnreachable(deviceId: string, host: string, port: number, reason: string): void {
    if (!deviceId || !host || !port) return;

    const existing = this.getEndpoints(deviceId);
    if (!existing.length) return;

    const updated = markUnreachable(existing, host, port, reason);
    this.deviceEndpoints.set(deviceId, updated);

    console.log(`[EndpointModel] device=${deviceId} endpoint=${host}:${port} action=markUnreachable reason=${reason}`);
  }

  /**
   * Mark a previously unreachable endpoint as reachable when discovery sees it again.
   */
  public markEndpointReachable(deviceId: string, host: string, port: number): void {
    if (!deviceId || !host || !port) return;

    const existing = this.getEndpoints(deviceId);
    if (!existing.length) return;

    const updated = markReachable(existing, host, port);
    this.deviceEndpoints.set(deviceId, updated);

    console.log(`[EndpointModel] device=${deviceId} endpoint=${host}:${port} action=markReachable`);
  }

  // ─── Connection Lifecycle Events ───────────────────────────────────────────

  public reportTransportConnected(
    deviceId: string,
    transport: TransportType,
    generation?: number,
    primaryKind: 'lan' | 'p2p' | 'relay' | 'cloud' = 'lan'
  ): void {
    if (!deviceId) return;

    const now = Date.now();
    let existing = this.devices.get(deviceId);

    // Stale generation protection
    if (existing && generation !== undefined && generation < existing.generation) {
      console.log(
        `[Connection] Ignoring stale connection event device=${deviceId} eventGeneration=${generation} currentGeneration=${existing.generation} event=connect`
      );
      return;
    }

    const currentGen = generation ?? ((existing?.generation ?? 0) + 1);

    if (!existing) {
      existing = {
        deviceId,
        state: 'disconnected',
        activeTransports: { ws: false, webrtc: false, tcp: false, lan: false },
        primaryTransport: primaryKind,
        lastSeenAt: now,
        lastConnectedAt: now,
        failureCount: 0,
        generation: currentGen,
      };
      this.devices.set(deviceId, existing);
    }

    existing.activeTransports[transport] = true;
    existing.lastSeenAt = now;
    existing.lastConnectedAt = now;
    existing.failureCount = 0;
    existing.generation = Math.max(existing.generation, currentGen);
    existing.primaryTransport = primaryKind;

    this.clearGraceTimer(deviceId);

    const prevState = existing.state;
    if (prevState !== 'connected') {
      existing.state = 'connected';
      this.stateRegistry.set(deviceId, 'connected', { transport, attemptFailed: false });
      console.log(
        `[Connection] device=${deviceId} state=${prevState} → connected transport=${transport} generation=${existing.generation}`
      );
      this.emit('stateChange', { ...existing });
    }
  }

  public reportHeartbeat(deviceId: string, transport: TransportType = 'ws'): void {
    if (!deviceId) return;
    const existing = this.devices.get(deviceId);
    if (!existing) return;

    existing.lastSeenAt = Date.now();
    existing.activeTransports[transport] = true;

    if (existing.state === 'reconnecting') {
      this.reportTransportConnected(deviceId, transport, existing.generation, existing.primaryTransport);
    }
  }

  public reportTransportDisconnected(
    deviceId: string,
    transport: TransportType,
    generation?: number,
    reason = 'transport closed'
  ): void {
    if (!deviceId) return;

    const existing = this.devices.get(deviceId);
    if (!existing) return;

    // Stale generation protection
    if (generation !== undefined && generation < existing.generation) {
      console.log(
        `[Connection] Ignoring stale connection event device=${deviceId} eventGeneration=${generation} currentGeneration=${existing.generation} event=disconnect`
      );
      return;
    }

    existing.activeTransports[transport] = false;

    // Check if ANY other transport is active for this device
    const anyActive = Object.values(existing.activeTransports).some(Boolean);
    if (anyActive) {
      console.log(
        `[Connection] device=${deviceId} transport=${transport} closed (${reason}), but other transport still active — state remains connected`
      );
      return;
    }

    existing.failureCount += 1;

    const prevState = existing.state;
    if (prevState === 'connected') {
      existing.state = 'reconnecting';
      this.stateRegistry.set(deviceId, 'reconnecting', { error: reason });
      console.log(
        `[Connection] device=${deviceId} state=connected → reconnecting reason=${reason} generation=${existing.generation}`
      );
      this.emit('stateChange', { ...existing });

      // Start grace period timer
      this.clearGraceTimer(deviceId);
      const timer = setTimeout(() => {
        this.graceTimers.delete(deviceId);
        const current = this.devices.get(deviceId);
        if (current && current.state === 'reconnecting') {
          const stillAnyActive = Object.values(current.activeTransports).some(Boolean);
          if (stillAnyActive) {
            current.state = 'connected';
            this.stateRegistry.set(deviceId, 'connected');
            console.log(`[Connection] device=${deviceId} state=reconnecting → connected (active transport verified)`);
            this.emit('stateChange', { ...current });
          } else {
            current.state = 'disconnected';
            this.stateRegistry.set(deviceId, 'disconnected', { error: 'grace period 20s exhausted' });
            console.log(`[Connection] device=${deviceId} state=reconnecting → disconnected (grace period 20s exhausted)`);
            this.emit('stateChange', { ...current });
          }
        }
      }, this.GRACE_PERIOD_MS);

      this.graceTimers.set(deviceId, timer);
    } else if (
      prevState === 'reconnecting' &&
      existing.failureCount >= this.MIN_FAILURES_BEFORE_OFFLINE &&
      !this.graceTimers.has(deviceId)
    ) {
      existing.state = 'disconnected';
      this.stateRegistry.set(deviceId, 'disconnected', { error: reason });
      console.log(
        `[Connection] device=${deviceId} state=reconnecting → disconnected (failure threshold ${existing.failureCount} reached)`
      );
      this.emit('stateChange', { ...existing });
    }
  }

  public reportExplicitDisconnect(deviceId: string, reason = 'unpaired / revoked'): void {
    if (!deviceId) return;
    this.clearGraceTimer(deviceId);

    const existing = this.devices.get(deviceId);
    if (existing) {
      const prevState = existing.state;
      existing.state = 'disconnected';
      existing.activeTransports = { ws: false, webrtc: false, tcp: false, lan: false };
      existing.failureCount = 0;
      this.stateRegistry.set(deviceId, 'disconnected', { error: reason });
      console.log(`[Connection] device=${deviceId} state=${prevState} → disconnected (explicit: ${reason})`);
      this.emit('stateChange', { ...existing });
    }
  }

  private clearGraceTimer(deviceId: string): void {
    const timer = this.graceTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.graceTimers.delete(deviceId);
    }
  }

  public getDeviceState(deviceId: string): DeviceConnectionState {
    const dev = this.devices.get(deviceId);
    return dev?.state ?? 'disconnected';
  }

  public isDeviceConnected(deviceId: string): boolean {
    const state = this.getDeviceState(deviceId);
    return state === 'connected' || state === 'reconnecting';
  }

  public getDeviceConnectionInfo(deviceId: string): DeviceConnectionInfo | undefined {
    return this.devices.get(deviceId);
  }

  public getAllDeviceStates(): DeviceConnectionInfo[] {
    return [...this.devices.values()];
  }
}

export const desktopConnectionManager = new DesktopConnectionManager();
