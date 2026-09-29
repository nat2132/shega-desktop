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
  persistPeerDevice,
} from './sync-hub';
import { mdnsDiscovery, type DiscoveredService } from './sync/discovery';
import { networkMonitor, currentOnline } from './sync/connectivity';
import { wsSyncServer, startWsSyncServer } from './sync/websocket-server';
import { p2pSync } from './sync/p2p-sync-manager';
import { beginCycle, endCycle, markPeerFound, markConnected, markFirstSync } from './sync/diagnostics';
import type { CycleReason } from './sync/diagnostics';
import { getActiveBusinessId } from './ipc-handlers';
import type {
  PeerInfo,
  SyncTransport,
  SyncHealth,
  NetworkCapabilities,
  DevicePlatform,
} from '@shega/shared';
import { getSyncStrategy, PROTOCOL_VERSION } from '@shega/shared';
import { getDesktopJoinerHandle } from './sync/desktop-join-credentials';

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

  let isHubRunning = false;
  try {
    const { wsSyncServer } = require('./sync/websocket-server');
    isHubRunning = wsSyncServer.getConnectedClients() !== undefined;
  } catch { /* best effort */ }

  const hasInternet = currentOnline();

  const cloudUrl = db.prepare(
    "SELECT value FROM settings WHERE key = 'cloud_sync_url'"
  ).get() as any;
  const cloudEnabled = db.prepare(
    "SELECT value FROM settings WHERE key = 'cloud_sync_enabled'"
  ).get() as any;
  const cloudConfigured =
    !!cloudUrl?.value &&
    cloudEnabled?.value === 'true';

  return {
    hasLan: isHubRunning || lanPeers.length > 0,
    hasInternet,
    lanPeers,
    cloudConfigured,
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
let announceInterval: NodeJS.Timeout | null = null;
let startupKick: NodeJS.Timeout | null = null;
let kickDebounce: NodeJS.Timeout | null = null;
let syncInFlight = false;
let lastCloudSyncAt = 0;
let lastLanSyncAt = 0;
let running = false;
const ANNOUNCE_INTERVAL_MS = 30_000;

const LAN_SYNC_INTERVAL_MS = 30_000;  // 30 seconds

// Cloud relay fallback runs at most once a minute when the LAN is empty and
// internet is back — enough to converge, gentle on the relay (SYNC_CONTRACT
// §5 doesn't promise burst tolerance).
const CLOUD_MIN_INTERVAL_MS = 60_000;
const KICK_DEBOUNCE_MS = 2_000;

/**
 * The single debounced reconnect entry point. It is a module-level named
 * function (not a closure created inside startPeerSync) so stopPeerSync() can
 * detach exactly the listeners that were attached.
 *
 * `reason` only labels the P0 timing window; it does not change behaviour, and
 * it does not affect listener detachment because `off` matches by reference.
 */
function reconnectKick(reason: CycleReason = 'manual'): void {
  if (kickDebounce) clearTimeout(kickDebounce);
  // P0 telemetry: open the measurement window on the FIRST signal of a burst,
  // so time-to-peer/connected/sync is measured from the real trigger rather
  // than from whichever debounced timer happened to win.
  beginCycle(reason);
  kickDebounce = setTimeout(() => {
    kickDebounce = null;
    // Re-announce first: peers only dial us after hearing a hello, and a peer
    // that restarted mid-outage has no session to resume, so the announce is
    // what actually re-establishes the direct channel.
    try { p2pSync.announce(); } catch {}
    performLanSync()
      .catch((e: any) => logger.error('Kicked sync failed', { error: e?.message }))
      .finally(() => { endCycle(); });
  }, KICK_DEBOUNCE_MS);
}

/**
 * Named listener wrappers. `EventEmitter.off` matches by function reference, so
 * wrapping `reconnectKick` inline at the `on(...)` call site would make these
 * listeners impossible to detach in stopPeerSync().
 */
const kickOnOnline = (): void => reconnectKick('network-online');
const kickOnNetworkChanged = (): void => reconnectKick('network-changed');
const kickOnMdnsUp = (): void => reconnectKick('mdns-up');
const kickOnMdnsDown = (): void => reconnectKick('mdns-down');

export function startPeerSync(): void {
  // Idempotent: startPeerSync runs on app boot and again on business switches.
  // Re-running it used to add another announce interval, another pair of
  // network/discovery listeners, and another sync interval while the previous
  // ones kept running — the app ended up with N independent sync loops all
  // pushing the same rows.
  if (running) {
    logger.debug?.('Peer sync already running; ignoring duplicate start');
    return;
  }
  running = true;

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
      // Periodically announce so late-joining peers can dial us. The handle is
      // owned here so stopPeerSync() can actually stop it — previously the
      // interval was fire-and-forget and outlived stop/restart cycles.
      if (announceInterval) clearInterval(announceInterval);
      announceInterval = setInterval(() => p2pSync.announce(), ANNOUNCE_INTERVAL_MS);
    }
  } catch (e: any) {
    logger.warn('P2P sync start failed (continuing without it)', { error: e?.message });
  }

  // Automatic reconnect (2.4/3.4): every reconnect signal funnels into one
  // debounced kick, so a device coming back, a network switch, or a new hub
  // appearing all trigger exactly one sync pass — never a stampede racing the
  // 30s interval.
  networkMonitor.on('online', kickOnOnline);
  networkMonitor.on('network-changed', kickOnNetworkChanged);
  // A hub appearing on the LAN is the strongest reconnect signal. Sync with it
  // immediately instead of waiting up to 30s for the interval.
  mdnsDiscovery.on('up', kickOnMdnsUp);
  mdnsDiscovery.on('down', kickOnMdnsDown);

  networkMonitor.start();

  // Startup immediate sync: a freshly opened app should connect to a visible
  // hub right away — not after 30s. Give discovery ~2s to settle first.
  startupKick = setTimeout(() => {
    startupKick = null;
    reconnectKick('startup');
  }, 2000);

  // Periodic LAN sync: pull from any discovered peers, push local changes
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(async () => {
    beginCycle('interval');
    try {
      await performLanSync();
    } catch (e: any) {
      logger.error('LAN sync cycle failed', { error: e?.message });
    } finally {
      endCycle();
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
  running = false;
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  if (announceInterval) {
    clearInterval(announceInterval);
    announceInterval = null;
  }
  if (startupKick) {
    clearTimeout(startupKick);
    startupKick = null;
  }
  if (kickDebounce) {
    clearTimeout(kickDebounce);
    kickDebounce = null;
  }
  // Remove only the listeners this module registered. `removeAllListeners` also
  // tore down every other subscriber on these shared singletons, so stopping
  // peer sync silently disabled connectivity/discovery for unrelated features.
  networkMonitor.off('online', kickOnOnline);
  networkMonitor.off('network-changed', kickOnNetworkChanged);
  networkMonitor.stop();
  mdnsDiscovery.off('up', kickOnMdnsUp);
  mdnsDiscovery.off('down', kickOnMdnsDown);
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
  if (syncInFlight) return;
  const discovered = mdnsDiscovery.getDiscoveredServices();

  // mDNS is not a dependable inventory of reachable peers: Android blocks
  // multicast, many routers drop it after a few minutes, and a peer that
  // rebooted re-announces only every 30s. Treating "mDNS found nothing" as
  // "no LAN peers exist" meant a desktop whose peer was momentarily invisible
  // did nothing at all and the data simply sat in the outbox until the next
  // successful discovery — the "it says connected but nothing syncs" symptom.
  //
  // So before concluding the LAN is empty, actively re-probe the endpoints we
  // already know about. A peer is reachable if it answers, regardless of
  // whether its announcement reached us.
  if (discovered.length === 0) {
    const remembered = rememberedPeers();
    if (remembered.length > 0) {
      syncInFlight = true;
      try {
        const { isMobileHub, syncWithMobileHub } = await import('./sync/mobile-hub-client');
        for (const peer of remembered) {
          markPeerFound(peer.deviceId, { via: 'remembered', host: peer.host });
          try {
            if (isMobileHub(peer)) {
              await syncWithMobileHub(peer);
              markConnected(peer.deviceId, { transport: 'lan-tcp', addresses: [peer.host] });
              markFirstSync(peer.deviceId, { transport: 'lan-tcp' });
            } else {
              await syncWithPeerHub(peer);
              markConnected(peer.deviceId, { transport: 'lan-http', addresses: [peer.host] });
              markFirstSync(peer.deviceId, { transport: 'lan-http' });
            }
          } catch (e: any) {
            logger.debug?.(`Remembered peer ${peer.deviceId} unreachable`, { error: e?.message });
          }
        }
      } finally {
        syncInFlight = false;
      }
      // Re-probing found nobody: the peers really are gone, so cloud is the
      // only remaining transport.
    }
  }

  // Re-read discovery: a re-probe may have produced fresh announcements.
  const hubs = discovered.length > 0 ? discovered : mdnsDiscovery.getDiscoveredServices();

  // Cloud fallback: no hubs on the LAN but internet is back → use the cloud
  // relay as a second transport so a LAN-less device still converges (§5).
  if (hubs.length === 0) {
    syncInFlight = true;
    try {
      const online = currentOnline();
      if (!online) return;
      const { isCloudConfigured, syncCloudOnce } = await import('./sync-cloud');
      if (!isCloudConfigured()) return;
      const now = Date.now();
      if (now - lastCloudSyncAt < CLOUD_MIN_INTERVAL_MS) return;
      lastCloudSyncAt = now;
      const res = await syncCloudOnce();
      markConnected('cloud-relay', { transport: 'cloud' });
      markFirstSync('cloud-relay', { transport: 'cloud' });
      logger.info('Cloud sync (LAN empty fallback)', {
        ok: res.ok,
        accepted: res.accepted ?? 0,
        pulled: res.pulled ?? 0,
        applied: res.applied ?? 0,
        error: res.error ?? null,
      });
    } finally {
      syncInFlight = false;
    }
    return;
  }

  syncInFlight = true;
  try {
    // For each discovered peer hub, perform a bidirectional sync.
    // Mobile phones acting as POS Hubs speak the TCP JSON protocol, not HTTP —
    // route those to the dedicated mobile-hub client.
    const { isMobileHub, syncWithMobileHub } = await import('./sync/mobile-hub-client');
    for (const peer of hubs) {
      markPeerFound(peer.deviceId, {
        via: 'mdns',
        host: peer.host,
        platform: (peer as any).platform,
      });
      try {
        const transport = isMobileHub(peer) ? 'lan-tcp' : 'lan-http';
        if (isMobileHub(peer)) {
          await syncWithMobileHub(peer);
        } else {
          await syncWithPeerHub(peer);
        }
        // A completed round trip on this transport is both "link established"
        // and "first sync" for the HTTP/TCP peer path — the WS path reports
        // these separately from websocket-server.ts.
        markConnected(peer.deviceId, { transport, addresses: peer.addresses ?? [peer.host] });
        markFirstSync(peer.deviceId, { transport });
      } catch (e: any) {
        logger.warn('Sync with peer hub failed', { peerId: peer.deviceId, error: e?.message });
      }
    }
    lastLanSyncAt = Date.now();
  } finally {
    syncInFlight = false;
  }
}

/**
 * Endpoints we have previously synced with, so a peer that is momentarily
 * undiscoverable can still be reached. Read from the `devices` table (populated
 * by persistPeerDevice) rather than an in-memory map, because the common case
 * is a *restart* — in-memory state is exactly what is missing when the app comes
 * back and the peer is mid-announce.
 */
function rememberedPeers(): DiscoveredService[] {
  let rows: any[] = [];
  try {
    rows = db.prepare(
      `SELECT device_id, name, platform, host, last_seen_at FROM devices
        WHERE is_deleted = 0 AND host IS NOT NULL AND host <> ''
        ORDER BY last_seen_at DESC LIMIT 8`,
    ).all() as any[];
  } catch {
    // Older install without the host column: nothing to re-probe yet.
    return [];
  }
  return rows
    .filter((r) => r?.device_id && r?.host)
    .map((r) => ({
      deviceId: String(r.device_id),
      name: r.name || undefined,
      host: String(r.host),
      addresses: [String(r.host)],
      port: 5757,
      capabilities: [],
      schemaVersion: PROTOCOL_VERSION,
      discoveredAt: Date.parse(r.last_seen_at || '') || Date.now(),
      // DiscoveredService extends bonjour's Service class; this is a synthetic
      // re-probe target, not a live browser result, so it is cast rather than
      // constructing a fake Service with its full EventEmitter surface.
    } as any));
}

/** Record the address a peer was last reached at, for later re-probes. */
function rememberPeerHost(deviceId: string, host: string): void {
  if (!deviceId || !host) return;
  try {
    db.prepare('UPDATE devices SET host = ? WHERE device_id = ?').run(host, deviceId);
  } catch { /* best effort */ }
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
/**
 * The credential this desktop holds for a given peer hub, if any.
 *
 * Keyed by the peer because a credential is scoped to one business/hub: using a
 * credential issued by hub A to authenticate to hub B would be refused anyway,
 * and trying would be a needless round trip.
 */
function joinerHandleFor(peerDeviceId: string) {
  const handle = getDesktopJoinerHandle();
  if (!handle) return null;
  // A credential names the business, not the hub device, so an exact peer match
  // is not always available. Presenting it and letting the hub decide is correct
  // — the hub rejects a credential it did not issue, which is the answer we want.
  return peerDeviceId ? handle : null;
}

/**
 * P3 — authenticate to a peer hub over HTTP and return a single-use access grant.
 *
 * Returns null when this desktop holds no credential, or when the peer refused
 * (older build, revoked, or a different hub entirely). The caller then falls
 * back to the legacy token, which is what keeps both paths alive during the
 * migration.
 */
async function authenticateWithPeerHub(peerUrl: string, hubId: string): Promise<string | null> {
  const handle = getDesktopJoinerHandle();
  if (!handle) return null;
  try {
    const challengeRes = await fetch(`${peerUrl}/sync/auth/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: hubId, credential: handle.credential }),
    });
    if (!challengeRes.ok) {
      logger.debug('Peer did not issue a challenge (legacy hub or no credential)', {
        status: challengeRes.status,
      });
      return null;
    }
    const challengeBody = await challengeRes.json() as { challenge?: any; error?: string };
    const challenge = challengeBody?.challenge;
    if (!challenge) return null;

    // Throws if the advertised verifier key is not the credential's issuer —
    // the one place a joiner can notice it is not talking to the right hub.
    const proof = handle.joiner.answer(challenge);
    const verifyRes = await fetch(`${peerUrl}/sync/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: hubId, credential: handle.credential, proof }),
    });
    if (!verifyRes.ok) {
      const body = await verifyRes.json().catch(() => null) as { reason?: string } | null;
      logger.warn('Peer refused the authenticated handshake', { reason: body?.reason ?? verifyRes.status });
      return null;
    }
    const verified = await verifyRes.json() as { accessToken?: string; role?: string; businessId?: string };
    logger.info('Peer authenticated this desktop', { role: verified?.role ?? null });
    return typeof verified?.accessToken === 'string' ? verified.accessToken : null;
  } catch (e: any) {
    logger.debug('Peer handshake failed; will try the legacy token', { error: e?.message });
    return null;
  }
}

async function syncWithPeerHub(peer: DiscoveredService): Promise<void> {
  const hubId = ensureHubDeviceId();
  // The peer validates pulls against ITS OWN pairing token, which mDNS
  // carries in the service's txt record. Using our local token here always
  // returns 403, so desktop↔desktop never replicated. (Bug fix: B1.)
  const token = peer.pairingToken;
  const peerUrl = `http://${peer.host}:${peer.port}`;

  // First, verify we're authorized to sync with this peer
  let businessId: string | null = null;
  try {
    const infoRes = await fetch(`${peerUrl}/sync/info`);
    const info = await infoRes.json() as { ok?: boolean; businessId?: string };
    if (!info.ok) return;
    businessId = info.businessId ?? null;

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
  // P3: authenticate by challenge/verify and spend the resulting grant on this
  // pull, rather than presenting the peer's long-lived shared token. Falls back
  // to the token when this desktop holds no credential from that peer, which
  // is the case until it has been approved through the join flow.
  let pullToken = token;
  const granted = await authenticateWithPeerHub(peerUrl, hubId);
  if (granted) {
    pullToken = granted;
  } else if (!joinerHandleFor(peer.deviceId)) {
    logger.debug('Peer handshake unavailable and no credential stored; using legacy token', { peerId: peer.deviceId });
  }
  const pullUrl = `${peerUrl}/sync/pull?device=${encodeURIComponent(hubId)}&since=${since}&token=${encodeURIComponent(pullToken)}`;
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
  // Persist the peer hub as a device so it appears in Connected Devices, and
  // remember its address so a later re-probe can reach it even when its mDNS
  // announcement is being dropped.
  try {
    persistPeerDevice({
      deviceId: peer.deviceId,
      name: peer.name || `Desktop Hub (${peer.deviceId.slice(0, 8)})`,
      platform: 'desktop',
      businessId: businessId ?? undefined,
    });
    rememberPeerHost(peer.deviceId, peer.host);
    p2pSync.markRosterStatus(peer.deviceId, true);
  } catch { /* best effort */ }
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

  let health: SyncHealth = 'synced';
  if (outboxCount > 0) health = 'pending';

  const capabilities = detectNetworkCapabilities();
  const transport: SyncTransport = getSyncStrategy(capabilities);

  let isHubRunning = false;
  let wsPeers = 0;
  try {
    const { wsSyncServer } = require('./sync/websocket-server');
    const clients = wsSyncServer.getConnectedClients();
    if (clients !== undefined) {
      isHubRunning = true;
      wsPeers = clients.length;
    }
  } catch { /* best effort */ }

  if (transport === 'offline' && !isHubRunning) {
    health = 'offline';
  }

  return {
    health,
    transport: (transport === 'offline' && isHubRunning) ? 'lan' : transport,
    // A hardcoded null here meant the UI could never tell "connected but idle"
    // from "never connected", so a successful recovery was invisible to the
    // user even when it had happened.
    lastSyncAt: lastLanSyncAt ? new Date(lastLanSyncAt).toISOString() : null,
    pendingOutbound: outboxCount,
    failedChanges: 0,
    conflicts: conflictCount,
    lan: {
      configured: true,
      peers: Math.max(mdnsDiscovery.getDiscoveredServices().length, wsPeers),
      lastSyncAt: lastLanSyncAt ? new Date(lastLanSyncAt).toISOString() : null,
    },
  };
}
