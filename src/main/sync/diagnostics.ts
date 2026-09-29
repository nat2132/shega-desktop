/**
 * P0 instrumentation — connection-timing telemetry.
 *
 * Purpose: before changing discovery, admission or sync transport we need
 * measured numbers for the three latencies the redesign targets:
 *
 *   timeToFirstPeer  — search/announce started -> a hub or peer was identified
 *   timeToConnected  — search/announce started -> an authenticated link is up
 *   timeToFirstSync  — link up -> the first successful apply/ack round-trip
 *
 * Plus the steady-state numbers that tell us whether a link is actually alive:
 * last heartbeat age, the number of pending outbox rows, and the current
 * transport in use for each peer.
 *
 * This module is deliberately passive and side-effect free apart from the
 * logger. It owns no sockets, no timers and no database handles, so it can be
 * imported from anywhere in the main process (including tests) without
 * changing behaviour. Everything is best-effort: a failure to record a mark
 * must never break a sync path, so every entry point swallows its own errors.
 */
import { logger } from '../logger';

/** Why a discovery/connect cycle was started. Used to explain a slow cycle. */
export type CycleReason =
  | 'startup'
  | 'network-changed'
  | 'network-online'
  | 'mdns-up'
  | 'mdns-down'
  | 'interval'
  | 'manual'
  | string;

/** One timestamped observation. Cheap to build, never thrown away mid-cycle. */
export interface TimingMark {
  name: string;
  at: number;
  meta?: Record<string, unknown>;
}

/** The three headline latencies, in ms, for the most recent completed cycle. */
export interface CycleTimings {
  reason: CycleReason;
  startedAt: number;
  durationMs: number | null;
  timeToFirstPeerMs: number | null;
  timeToConnectedMs: number | null;
  timeToFirstSyncMs: number | null;
  peersFound: number;
}

/** Per-peer health, as surfaced on the diagnostics screen. */
export interface PeerDiagnostics {
  deviceId: string;
  deviceName?: string;
  platform?: string;
  transport: 'lan-ws' | 'lan-http' | 'lan-tcp' | 'cloud' | 'none' | string;
  addresses: string[];
  connected: boolean;
  lastHeartbeatAt: number | null;
  lastSyncAt: number | null;
  cursor: number | null;
  pendingOutbox: number | null;
  deadLetter: number | null;
}

export interface DiagnosticsSnapshot {
  startedAt: number;
  now: number;
  current: {
    reason: CycleReason;
    startedAt: number;
    elapsedMs: number;
  } | null;
  last: CycleTimings | null;
  recent: CycleTimings[];
  peers: PeerDiagnostics[];
  marks: TimingMark[];
}

const RECENT_CYCLES = 20;
const MARK_BUFFER = 200;
const PEER_STALE_MS = 5 * 60_000;

let startedAt = Date.now();
let currentReason: CycleReason | null = null;
let currentStartedAt = 0;
let currentFirstPeerAt: number | null = null;
let currentFirstConnectedAt: number | null = null;
let currentFirstSyncAt: number | null = null;
let currentPeersFound = 0;

let lastCycle: CycleTimings | null = null;
const recentCycles: CycleTimings[] = [];
const marks: TimingMark[] = [];
const peers = new Map<string, PeerDiagnostics>();

/**
 * Open a new measurement window. Re-entrant calls are ignored: several signals
 * (mDNS up, network-changed, interval) routinely fire together and we want the
 * latency measured from the FIRST one, not from whichever landed last.
 */
export function beginCycle(reason: CycleReason): void {
  if (currentReason !== null) return;
  currentReason = reason;
  currentStartedAt = Date.now();
  currentFirstPeerAt = null;
  currentFirstConnectedAt = null;
  currentFirstSyncAt = null;
  currentPeersFound = 0;
}

/** A peer or hub was identified. Only the first one in a cycle is timed. */
export function markPeerFound(deviceId?: string, meta?: Record<string, unknown>): void {
  try {
    if (currentReason !== null && currentFirstPeerAt === null) {
      currentFirstPeerAt = Date.now();
      logger.info('sync.timing.first_peer', {
        reason: currentReason,
        ms: currentFirstPeerAt - currentStartedAt,
        deviceId,
        ...meta,
      });
    }
    if (deviceId) touchPeer(deviceId).seen = true;
  } catch {
    /* telemetry must never break discovery */
  }
}

/** An authenticated link to a peer is established (WS/HTTP/TCP handshake done). */
export function markConnected(deviceId?: string, meta?: Record<string, unknown>): void {
  try {
    if (currentReason !== null && currentFirstConnectedAt === null) {
      currentFirstConnectedAt = Date.now();
      logger.info('sync.timing.connected', {
        reason: currentReason,
        ms: currentFirstConnectedAt - currentStartedAt,
        deviceId,
        ...meta,
      });
    }
    if (deviceId) {
      const p = touchPeer(deviceId);
      p.connected = true;
      if (meta?.transport) p.transport = String(meta.transport);
      if (Array.isArray(meta?.addresses)) p.addresses = meta.addresses.map(String);
    }
  } catch {
    /* telemetry must never break the connect path */
  }
}

/** The first successful apply/ack round-trip on a freshly connected link. */
export function markFirstSync(deviceId?: string, meta?: Record<string, unknown>): void {
  try {
    if (currentReason !== null && currentFirstSyncAt === null) {
      currentFirstSyncAt = Date.now();
      logger.info('sync.timing.first_sync', {
        reason: currentReason,
        ms: currentFirstSyncAt - currentStartedAt,
        sinceConnectedMs:
          currentFirstConnectedAt !== null ? currentFirstSyncAt - currentFirstConnectedAt : null,
        deviceId,
        ...meta,
      });
    }
    if (deviceId) {
      const p = touchPeer(deviceId);
      p.lastSyncAt = Date.now();
    }
  } catch {
    /* telemetry must never break the sync path */
  }
}

/** Arbitrary named mark, for one-off measurements during a cycle. */
export function mark(name: string, meta?: Record<string, unknown>): void {
  try {
    marks.push({ name, at: Date.now(), meta });
    if (marks.length > MARK_BUFFER) marks.splice(0, marks.length - MARK_BUFFER);
    logger.debug(`sync.mark.${name}`, meta);
  } catch {
    /* ignore */
  }
}

/** Close the window and record the cycle. No-op when no window is open. */
export function endCycle(): CycleTimings | null {
  if (currentReason === null) return null;
  const endedAt = Date.now();
  const cycle: CycleTimings = {
    reason: currentReason,
    startedAt: currentStartedAt,
    durationMs: endedAt - currentStartedAt,
    timeToFirstPeerMs: currentFirstPeerAt !== null ? currentFirstPeerAt - currentStartedAt : null,
    timeToConnectedMs: currentFirstConnectedAt !== null ? currentFirstConnectedAt - currentStartedAt : null,
    timeToFirstSyncMs: currentFirstSyncAt !== null ? currentFirstSyncAt - currentStartedAt : null,
    peersFound: currentPeersFound,
  };
  currentReason = null;
  currentFirstPeerAt = null;
  currentFirstConnectedAt = null;
  currentFirstSyncAt = null;
  lastCycle = cycle;
  recentCycles.push(cycle);
  if (recentCycles.length > RECENT_CYCLES) recentCycles.shift();
  logger.info('sync.timing.cycle', { ...cycle });
  return cycle;
}

/** Whether a measurement window is currently open. */
export function isCycleOpen(): boolean {
  return currentReason !== null;
}

function touchPeer(deviceId: string): PeerDiagnostics & { seen?: boolean } {
  let p = peers.get(deviceId);
  if (!p) {
    p = {
      deviceId,
      transport: 'none',
      addresses: [],
      connected: false,
      lastHeartbeatAt: null,
      lastSyncAt: null,
      cursor: null,
      pendingOutbox: null,
      deadLetter: null,
    };
    peers.set(deviceId, p);
  }
  return p as PeerDiagnostics & { seen?: boolean };
}

/** Record a heartbeat so the diagnostics view can show link age. */
export function markHeartbeat(deviceId: string, meta?: Record<string, unknown>): void {
  try {
    const p = touchPeer(deviceId);
    p.lastHeartbeatAt = Date.now();
    if (meta?.transport) p.transport = String(meta.transport);
    if (Array.isArray(meta?.addresses)) p.addresses = meta.addresses.map(String);
  } catch {
    /* ignore */
  }
}

/** Drop a peer's "connected" flag when its socket closes. */
export function markDisconnected(deviceId: string): void {
  try {
    const p = peers.get(deviceId);
    if (p) {
      p.connected = false;
      p.transport = 'none';
    }
  } catch {
    /* ignore */
  }
}

/** Count peers seen in the current window (for the cycle summary). */
export function countPeerFound(n = 1): void {
  currentPeersFound += n;
}

/**
 * Full snapshot for the diagnostics screen / IPC.
 *
 * Peers that have not been heard from for PEER_STALE_MS are dropped so the
 * list reflects live topology rather than every device this install has ever
 * seen.
 */
export function getDiagnosticsSnapshot(): DiagnosticsSnapshot {
  const now = Date.now();
  const live: PeerDiagnostics[] = [];
  for (const p of peers.values()) {
    const lastHeard = Math.max(p.lastHeartbeatAt ?? 0, p.lastSyncAt ?? 0);
    if (lastHeard > 0 && now - lastHeard > PEER_STALE_MS) continue;
    live.push({ ...p });
  }
  live.sort((a, b) => a.deviceId.localeCompare(b.deviceId));
  return {
    startedAt,
    now,
    current:
      currentReason !== null
        ? { reason: currentReason, startedAt: currentStartedAt, elapsedMs: now - currentStartedAt }
        : null,
    last: lastCycle,
    recent: [...recentCycles],
    peers: live,
    marks: [...marks],
  };
}

/** Test hook: reset all state so a suite can start from a clean slate. */
export function __resetDiagnostics(): void {
  startedAt = Date.now();
  currentReason = null;
  currentStartedAt = 0;
  currentFirstPeerAt = null;
  currentFirstConnectedAt = null;
  currentFirstSyncAt = null;
  currentPeersFound = 0;
  lastCycle = null;
  recentCycles.length = 0;
  marks.length = 0;
  peers.clear();
}
