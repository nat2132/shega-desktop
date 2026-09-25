/**
 * Cloud relay client (SYNC_CONTRACT.md §4/§5) — the Desktop hub's HTTPS half.
 *
 * The Django backend (`/api/sync/*`) is documented but NOT yet deployed; this
 * module implements the exact client contract so the hub is ready the moment
 * the endpoints exist. When nothing is configured it returns structured
 * `not_configured` results and makes zero network calls — LAN behavior is
 * completely unchanged.
 *
 * Settings (all in the local `settings` table):
 *   cloud_sync_url        relay base URL (empty = offline/local-only)
 *   cloud_sync_device_key per-hub shared secret (X-Device-Key)
 *   cloud_sync_enabled    'true' activates opportunistic cloud sync
 *   cloud_sync_cursor     last seen cloud seq
 *   cloud_sync_last_at    ISO timestamp of the last successful sync
 *   cloud_sync_last_error last failure message (diagnostics)
 *
 * The device key is read directly for the X-Device-Key header but is NEVER
 * sent to the renderer or written into logs.
 */
import { ipcMain } from 'electron';
import db from './database';
import {
  ensureHubDeviceId,
  buildCloudChanges,
  applyRemoteChanges,
  verifyChecksums,
} from './sync-hub';
import { logger } from './logger';

const DEFAULT_BASE = 'https://shega-api-dah3.onrender.com';
const REQUEST_TIMEOUT_MS = 20_000;

function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
  return row?.value ?? null;
}
function setSetting(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

function getBaseUrl(): string {
  return (getSetting('cloud_sync_url') || process.env.SHEGA_API_URL || DEFAULT_BASE).replace(/\/+$/, '');
}

export interface CloudSyncConfig {
  url: string;
  enabled: boolean;
  cursor: number;
  lastAt: string | null;
  lastError: string | null;
}

export interface CloudSyncResult {
  ok: boolean;
  reason?: 'not_configured' | 'error';
  error?: string;
  accepted?: number;
  pulled?: number;
  applied?: number;
  conflicts?: number;
  cursor?: number;
  lastSeq?: number;
}

export interface CloudStatus {
  configured: boolean;
  enabled: boolean;
  url: string;
  urlFromDefault: boolean;
  cursor: number;
  lastAt: string | null;
  lastError: string | null;
  /** Present only when a previous pull was applied — direct vs relay is ICE, not cloud. */
  lastMessage?: string;
}

/** Does this hub have everything needed to talk to the relay? */
export function isCloudConfigured(): boolean {
  return (
    getSetting('cloud_sync_enabled') === 'true' &&
    !!getSetting('cloud_sync_url') &&
    !!getSetting('cloud_sync_device_key')
  );
}

/** Conservative status for the renderer — never includes the device key. */
export function cloudStatus(): CloudStatus {
  const url = getBaseUrl();
  const configured = getSetting('cloud_sync_enabled') === 'true';
  return {
    configured,
    enabled: configured,
    url,
    urlFromDefault: !getSetting('cloud_sync_url'),
    cursor: Number(getSetting('cloud_sync_cursor') ?? 0),
    lastAt: getSetting('cloud_sync_last_at'),
    lastError: getSetting('cloud_sync_last_error'),
  };
}

/** Persist cloud config. The device key is written here and read only for the header. */
export function saveCloudConfig(input: { url?: string; deviceKey?: string; enabled?: boolean }): { ok: boolean } {
  if (input.url !== undefined) setSetting('cloud_sync_url', input.url.trim().replace(/\/+$/, ''));
  if (input.deviceKey !== undefined) setSetting('cloud_sync_device_key', String(input.deviceKey).trim());
  if (input.enabled !== undefined) setSetting('cloud_sync_enabled', input.enabled ? 'true' : 'false');
  return { ok: true };
}

/** Enable/disable without touching credentials. */
export function setCloudEnabled(enabled: boolean): { ok: boolean } {
  setSetting('cloud_sync_enabled', enabled ? 'true' : 'false');
  return { ok: true };
}

/** Idempotency token: hubId@max(outbox seq) — a re-POST with the same key is a backend no-op (§4.1). */
function idempotencyKey(): string {
  const hubId = ensureHubDeviceId();
  const maxSeq = (db.prepare('SELECT COALESCE(MAX(seq),0) AS m FROM sync_outbox').get() as any)?.m ?? 0;
  return `${hubId}@${maxSeq}`;
}

async function cloudFetch(path: string, init: { method?: string; headers?: Record<string, string>; body?: unknown } = {}): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) {
      const msg = (data && data.error) || (data && data.detail) || `HTTP ${res.status}`;
      throw new Error(`cloud ${path}: ${msg}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * One-shot cloud sync: push full snapshot (checksummed), then pull changes
 * since the cursor through the same LWW/verify path used for LAN. Returns a
 * summary; throws nothing (errors are captured into the result + diagnostics).
 */
export async function syncCloudOnce(): Promise<CloudSyncResult> {
  const deviceKey = getSetting('cloud_sync_device_key');
  if (!isCloudConfigured() || !deviceKey) {
    return { ok: false, reason: 'not_configured' };
  }
  const hubId = ensureHubDeviceId();
  const cursor = Number(getSetting('cloud_sync_cursor') ?? 0);
  try {
    // 4.1 push — full snapshot with checksums, idempotent by key.
    const changes = buildCloudChanges();
    const pushRes = await cloudFetch('/api/sync/push', {
      method: 'POST',
      headers: {
        'X-Device-Key': deviceKey,
        'X-Idempotency-Key': idempotencyKey(),
      },
      body: { device_id: hubId, changes },
    });

    // 4.2 pull — changes from other branches with server seq > cursor.
    const pullRes = await cloudFetch(
      `/api/sync/pull?device=${encodeURIComponent(hubId)}&since=${cursor}`
    );
    const incoming = Array.isArray(pullRes?.changes) ? pullRes.changes : [];
    let applied = 0;
    let conflicts = 0;
    if (incoming.length) {
      const result = applyRemoteChanges(hubId, incoming);
      applied = result.applied;
      conflicts = result.conflicts;
    }
    const lastSeq = Number(pullRes?.lastSeq ?? cursor);
    setSetting('cloud_sync_cursor', String(lastSeq));
    setSetting('cloud_sync_last_at', new Date().toISOString());
    setSetting('cloud_sync_last_error', '');
    logger.info('Cloud sync ok', {
      accepted: pushRes?.accepted ?? changes.length,
      pulled: incoming.length,
      applied,
      cursor: lastSeq,
    });
    return {
      ok: true,
      accepted: pushRes?.accepted ?? changes.length,
      pulled: incoming.length,
      applied,
      conflicts,
      cursor: lastSeq,
      lastSeq,
    };
  } catch (e: any) {
    const message = e?.name === 'AbortError' ? 'cloud sync timed out' : String(e?.message ?? e);
    setSetting('cloud_sync_last_error', message);
    logger.error('Cloud sync failed', { error: message });
    return { ok: false, reason: 'error', error: message };
  }
}

/** 4.3 drift check — compares local per-table checksums against the relay. */
export async function verifyCloud(): Promise<{ ok: boolean; error?: string; tables?: Record<string, { count: number; checksum: string }>; matched: boolean }> {
  const deviceKey = getSetting('cloud_sync_device_key');
  if (!isCloudConfigured() || !deviceKey) {
    return { ok: false, error: 'not_configured', matched: false };
  }
  try {
    const res = await cloudFetch('/api/sync/verify', {
      headers: { 'X-Device-Key': deviceKey },
    });
    const local = verifyChecksums();
    const tables = res?.tables ?? {};
    let matched = true;
    for (const entity of Object.keys(local)) {
      const remote = tables[entity];
      if (remote && remote.checksum !== local[entity].checksum) matched = false;
    }
    return { ok: true, tables: local, matched };
  } catch (e: any) {
    const message = e?.name === 'AbortError' ? 'cloud verify timed out' : String(e?.message ?? e);
    setSetting('cloud_sync_last_error', message);
    return { ok: false, error: message, matched: false };
  }
}

export function registerCloudSyncHandlers(): void {
  ipcMain.handle('cloud:status', () => cloudStatus());
  ipcMain.handle('cloud:sync', () => syncCloudOnce());
  ipcMain.handle('cloud:verify', () => verifyCloud());
  ipcMain.handle('cloud:save-config', (_e, input: { url?: string; deviceKey?: string; enabled?: boolean }) =>
    saveCloudConfig(input ?? {})
  );
  ipcMain.handle('cloud:set-enabled', (_e, enabled: boolean) => setCloudEnabled(!!enabled));
}