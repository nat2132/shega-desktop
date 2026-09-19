/**
 * Peer-to-peer sync engine for Shega Desktop.
 *
 * Extends the existing SyncHub (HTTP on port 5757) with:
 * - Business membership verification on LAN (not just pairing token)
 * - Desktop↔Desktop peer discovery and sync
 * - Mobile can connect as a peer (same protocol)
 * - Unified transport: LAN + Cloud as two transports for one sync engine
 *
 * This module does NOT replace sync-hub.ts — it wraps it and adds the peer
 * layer on top. The existing SyncHub HTTP endpoints continue to serve the
 * wire protocol; this module adds authentication, transport coordination,
 * and peer management.
 */
import { randomUUID } from 'crypto';
import db from './database';
import { logger } from './logger';
import {
  ensureHubDeviceId,
} from './sync-hub';
import { mdnsDiscovery, type DiscoveredService } from './sync/discovery';
import { wsSyncServer, startWsSyncServer } from './sync/websocket-server';
import { p2pSync } from './sync/p2p-sync-manager';
import { getActiveBusinessId } from './ipc-handlers';
import type {
  PeerInfo,
  SyncTransport,
  SyncHealth,
  NetworkCapabilities,
  DevicePlatform,
} from '@shega/shared';
import { getSyncStrategy } from '@shega/shared';

// ─── Peer registry ──────────────────────────────────────────────────────────

interface RegisteredPeer {
  deviceId: string;
  name: string;
  platform: DevicePlatform;
  businessId: string | null;
  roleKey: string | null;
  lastSeenAt: string;
  transport: SyncTransport;
  isHub: boolean;
}

const peerRegistry = new Map<string, RegisteredPeer>();

// ─── Business membership verification (LAN auth) ───────────────────────────

/**
 * Verify that a connecting peer belongs to the same business.
 *
 * On LAN, pairing tokens authenticate the _device_, but we also need to
 * verify business membership. The hub stores the business ID in sync_meta.
 * A peer joining over LAN must present either:
 * 1. A valid pairing token (6-char CSPRNG) — legacy path for first-time join
 * 2. A valid business membership UUID — for peers already registered
 *
 * This closes the gap where "same WiFi = access" without membership check.
 */
export function verifyPeerMembership(
  peerBusinessId: string | null | undefined,
  peerDeviceId: string
): { allowed: boolean; reason?: string } {
  if (!peerBusinessId) {
    // Peer didn't send business ID — check if it's a known device
    const existing = db.prepare(
      'SELECT device_id, name FROM devices WHERE device_id = ?'
    ).get(peerDeviceId) as any;
    if (existing) return { allowed: true };
    return { allowed: false, reason: 'unknown_device_no_business' };
  }

  // Verify the business exists locally
  const hubBusinessId = getCurrentBusinessId();
  if (!hubBusinessId) {
    return { allowed: false, reason: 'hub_has_no_business' };
  }

  // Business IDs must match (UUID comparison)
  if (peerBusinessId !== hubBusinessId) {
    logger.warn('Business mismatch', { peer: peerBusinessId, hub: hubBusinessId });
    return { allowed: false, reason: 'business_mismatch' };
  }

  return { allowed: true };
}

/**
 * Get the current business ID from the local database.
 * This is the business this hub belongs to.
 */
function getCurrentBusinessId(): string | null {
  const row = db.prepare(
    'SELECT uuid FROM businesses WHERE isDefault = 1 OR id = 1 LIMIT 1'
  ).get() as any;
  return row?.uuid ?? null;
}

// ─── Network capability detection ───────────────────────────────────────────

/**
 * Detect current network capabilities: LAN peers, internet connectivity,
 * cloud configuration. Used by the transport manager to decide sync strategy.
 */
export function detectNetworkCapabilities(): NetworkCapabilities {
  const lanPeers = mdnsDiscovery.getDiscoveredServices().map((svc) => ({
    ...svc,
    platform: (svc.capabilities?.includes('mobile') ? 'mobile' : 'desktop') as DevicePlatform,
  }));

  const hasInternet = true; // Will be updated by connectivity service

  return {
    hasLan: lanPeers.length > 0,
    hasInternet,
    lanPeers,
    cloudConfigured: false,
  };
}

// ─── Transport manager ──────────────────────────────────────────────────────

/**
 * The unified sync manager coordinates peer transports.
 *
 * Sync priority:
 * 1. LAN first (fast, local)
 * 2. P2P (WebRTC/Yjs) in the background for branch convergence
 * 3. Offline: queue changes, sync when reconnected
 *
 * All transports apply the same LWW/conflict resolution through the
 * existing applyChange() path, so changes arriving via any transport
 * are treated identically.
 */
let syncInterval: NodeJS.Timeout | null = null;

const LAN_SYNC_INTERVAL_MS = 30_000;  // 30 seconds

export function startPeerSync(): void {
  const hubId = ensureHubDeviceId();
  // This install is a Desktop build; the platform identity is a peer-detected
  // property, not an ownership marker. Desktop and Mobile are equal first-class
  // platforms: either may host a hub or join as a client depending on role.
  const platform: DevicePlatform = 'desktop';

  // Start mDNS discovery (broadcast this hub + discover other hubs)
  mdnsDiscovery.start();

  // Start WebSocket server for real-time sync
  startWsSyncServer();

  // Start P2P Yjs+WebRTC sync for the active business (SQLite stays source of
  // truth; Yjs replicates, WebRTC transports, the WS hub only signals).
  try {
    const hubDevId = ensureHubDeviceId();
    const bizId = getActiveBusinessId();
    const biz = db.prepare('SELECT id, uuid FROM businesses WHERE id = ?').get(bizId) as any;
    if (biz?.uuid) {
      p2pSync.start(hubDevId, String(biz.uuid), Number(biz.id));
      // Periodically announce so late-joining peers can dial us.
      setInterval(() => p2pSync.announce(), 30000);
    }
  } catch (e: any) {
    logger.warn('P2P sync start failed (continuing without it)', { error: e?.message });
  }

  // Periodic LAN sync: pull from any discovered peers, push local changes
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(async () => {
    try {
      await performLanSync();
    } catch (e: any) {
      logger.error('LAN sync cycle failed', { error: e?.message });
    }
  }, LAN_SYNC_INTERVAL_MS);

  logger.info('Peer sync started', { hubId, platform });
}

/**
 * Re-scope the P2P sync to a newly-activated business without restarting the
 * whole app. Closes the old business Y.Doc and bootstraps the new one so the
 * sync layer always matches `active_business_id` — business data never crosses
 * the boundary after a switch.
 */
export function reScopePeerSync(businessRowId: number): void {
  try {
    const hubDevId = ensureHubDeviceId();
    const biz = db.prepare('SELECT id, uuid FROM businesses WHERE id = ?').get(businessRowId) as any;
    if (biz?.uuid) {
      p2pSync.start(hubDevId, String(biz.uuid), Number(biz.id));
      p2pSync.announce();
      logger.info('P2P sync re-scoped to business', { businessId: businessRowId, uuid: biz.uuid });
    }
  } catch (e: any) {
    logger.warn('P2P sync re-scope failed', { error: e?.message });
  }
}

export function stopPeerSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  mdnsDiscovery.stop();
  wsSyncServer.stop();
  logger.info('Peer sync stopped');
}

/**
 * Perform one LAN sync cycle: discover peers, sync with each.
 *
 * For Desktop↔Desktop: both hubs have SyncHub running. The one with the
 * higher peer count (or older start time) acts as the merge point. Both
 * push their outbox and pull from the other.
 *
 * For Desktop↔Mobile: sync is bidirectional and platform-symmetric. Either a
 * desktop or a mobile running the hub protocol may be the server; the peer
 * layer treats any discovered hub equally, so a desktop can pull/push with a
 * mobile hub just as it can with another desktop (or vice-versa). No platform
 * is assumed to always be the server.
 */
export async function performLanSync(): Promise<void> {
  const discovered = mdnsDiscovery.getDiscoveredServices();
  if (discovered.length === 0) return;

  // For each discovered peer hub, perform a bidirectional sync.
  // Mobile phones acting as POS Hubs speak the TCP JSON protocol, not HTTP —
  // route those to the dedicated mobile-hub client.
  const { isMobileHub, syncWithMobileHub } = await import('./sync/mobile-hub-client');
  for (const peer of discovered) {
    try {
      if (isMobileHub(peer)) {
        await syncWithMobileHub(peer);
      } else {
        await syncWithPeerHub(peer);
      }
    } catch (e: any) {
      logger.warn('Sync with peer hub failed', { peerId: peer.deviceId, error: e?.message });
    }
  }
}

/**
 * Per-peer change-log cursor so peer pulls are deltas, not full snapshots.
 * Keyed by the peer's device_id; starts at 0 (full snapshot) the first time a
 * peer is seen, then advances to the peer's lastSeq after each successful pull.
 */
const peerCursors = new Map<string, number>();

function peerCursorSeq(deviceId: string): number {
  return peerCursors.get(deviceId) ?? 0;
}

/**
 * Bidirectional sync with a peer hub (Desktop↔Desktop).
 * Both hubs push their changes and pull the other's changes, each asking for
 * changes newer than the lastSeq it saw from the peer (delta pull).
 * The same LWW/conflict resolution applies as with Mobile clients.
 */
async function syncWithPeerHub(peer: DiscoveredService): Promise<void> {
  const hubId = ensureHubDeviceId();
  // The peer validates pulls against ITS OWN pairing token, which mDNS
  // carries in the service's txt record. Using our local token here always
  // returns 403, so desktop↔desktop never replicated. (Bug fix: B1.)
  const token = peer.pairingToken;
  const peerUrl = `http://${peer.host}:${peer.port}`;

  // First, verify we're authorized to sync with this peer
  try {
    const infoRes = await fetch(`${peerUrl}/sync/info`);
    const info = await infoRes.json() as { ok?: boolean; businessId?: string };
    if (!info.ok) return;

    // Check business membership match
    const verification = verifyPeerMembership(info.businessId, peer.deviceId);
    if (!verification.allowed) {
      logger.warn('Peer auth failed', { peerId: peer.deviceId, reason: verification.reason });
      return;
    }
  } catch {
    return; // Peer unreachable
  }

  // Pull delta changes from peer (since=0 → full snapshot the first time).
  const since = peerCursorSeq(peer.deviceId);
  const pullUrl = `${peerUrl}/sync/pull?device=${encodeURIComponent(hubId)}&since=${since}&token=${encodeURIComponent(token)}`;
  try {
    const pullRes = await fetch(pullUrl);
    const pullData = await pullRes.json() as {
      ok?: boolean;
      changes?: any[];
      lastSeq?: number;
    };
    const changes = pullData.changes;
    if (pullData.ok && changes && changes.length > 0) {
      // Apply remote changes through the existing LWW path
      const { applyRemoteChanges } = await import('./sync-hub');
      const result = applyRemoteChanges(hubId, changes);
      logger.info('Peer sync pull', {
        peerId: peer.deviceId,
        pulled: changes.length,
        applied: result.applied,
        conflicts: result.conflicts,
        from: since,
      });
    }
    const lastSeq = Number(pullData?.lastSeq ?? since);
    if (pullData.ok && lastSeq > since) peerCursors.set(peer.deviceId, lastSeq);
  } catch (e: any) {
    logger.warn('Peer pull failed', { peerId: peer.deviceId, error: e?.message });
  }
}

// ─── Status query ───────────────────────────────────────────────────────────

/**
 * Get unified sync status combining LAN and Cloud transports.
 * Used by the renderer (via IPC) to display sync health.
 */
export async function getUnifiedSyncStatus(): Promise<{
  health: SyncHealth;
  transport: SyncTransport;
  lastSyncAt: string | null;
  pendingOutbound: number;
  failedChanges: number;
  conflicts: number;
  lan: { configured: boolean; peers: number; lastSyncAt: string | null };
}> {
  const outboxCount = (db.prepare(
    'SELECT COUNT(*) AS c FROM sync_outbox'
  ).get() as any)?.c ?? 0;

  const conflictCount = (db.prepare(
    'SELECT COUNT(*) AS c FROM sync_conflicts'
  ).get() as any)?.c ?? 0;

  const hasLan = mdnsDiscovery.getDiscoveredServices().length > 0;

  let health: SyncHealth = 'synced';
  if (outboxCount > 0) health = 'pending';
  if (!hasLan) health = 'offline';

  const transport: SyncTransport = hasLan ? 'lan' : 'offline';

  return {
    health,
    transport,
    lastSyncAt: null,
    pendingOutbound: outboxCount,
    failedChanges: 0,
    conflicts: conflictCount,
    lan: {
      configured: true,
      peers: mdnsDiscovery.getDiscoveredServices().length,
      lastSyncAt: null,
    },
  };
}
