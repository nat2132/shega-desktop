/* 3.6 (client-side half) — opt-in cloud relay transport for the Desktop hub.
 *
 * The Django backend is deployed separately (see SYNC_CONTRACT.md). This module
 * is the Desktop-side of the relay: when a cloud URL + device key are configured
 * in `settings` (keys `cloud_sync_url`, `cloud_sync_device_key`), the hub pushes
 * its full snapshot to the cloud and pulls other-branches' changes back, applying
 * them through the SAME LWW/checksum path used for LAN sync. Disabled by default
 * (no URL configured) so it is a no-op until a backend exists.
 */
import db from './database';
import { buildCloudChanges, applyRemoteChanges, ensureHubDeviceId } from './sync-hub';

function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
  return row?.value ?? null;
}
function setSetting(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

interface CloudConfig { url: string; key: string; }

export function getCloudConfig(): CloudConfig | null {
  const url = (getSetting('cloud_sync_url') || '').toString().trim();
  const key = (getSetting('cloud_sync_device_key') || '').toString().trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ''), key };
}

export interface CloudStatus { enabled: boolean; configured: boolean; lastError: string | null; lastAt: string | null; }

export function getCloudStatus(): CloudStatus {
  const cfg = getCloudConfig();
  return {
    enabled: getSetting('cloud_sync_enabled') === 'true',
    configured: !!cfg,
    lastError: getSetting('cloud_sync_last_error'),
    lastAt: getSetting('cloud_sync_last_at')
  };
}

async function httpJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  const text = await res.text();
  let body: any = null;
  try { body = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(typeof body === 'object' ? body?.error || `HTTP ${res.status}` : `HTTP ${res.status}`);
  return body;
}

/**
 * Push the hub's snapshot to the cloud relay (idempotent key = hubId@max(outbox seq)),
 * then pull changes from other branches since the stored cloud cursor and apply them.
 */
export async function syncToCloud(): Promise<{ pushed: number; pulled: number; conflicts: number }> {
  const cfg = getCloudConfig();
  if (!cfg) throw new Error('Cloud relay not configured (set cloud_sync_url + cloud_sync_device_key)');

  const hubId = ensureHubDeviceId();
  const idempotentKey = `${hubId}@${(db.prepare('SELECT COALESCE(MAX(seq),0) AS m FROM sync_outbox').get() as any).m}`;
  const pushed = buildCloudChanges();

  let result: { pushed: number; pulled: number; conflicts: number } = { pushed: pushed.length, pulled: 0, conflicts: 0 };
  try {
    const res = await httpJson(`${cfg.url}/api/sync/push`, {
      method: 'POST',
      headers: { 'X-Device-Key': cfg.key, 'X-Idempotency-Key': idempotentKey },
      body: JSON.stringify({ device_id: hubId, changes: pushed })
    });
    result.pushed = Number(res?.accepted ?? pushed.length);

    const cursor = (db.prepare("SELECT value FROM settings WHERE key = 'cloud_sync_cursor'").get() as any)?.value;
    const since = Number(cursor ?? 0);
    const pulled = await httpJson(`${cfg.url}/api/sync/pull?device=${encodeURIComponent(hubId)}&since=${since}`, {
      method: 'GET',
      headers: { 'X-Device-Key': cfg.key }
    });
    const incoming = (pulled?.changes ?? []) as any[];
    if (incoming.length > 0) {
      const applied = applyRemoteChanges(hubId, incoming.map((c) => ({
        entity: c.entity, entity_uuid: c.entity_uuid, op: c.op, payload: c.payload,
        device_id: c.device_id, checksum: c.checksum
      })));
      result.conflicts = applied.conflicts;
    }
    result.pulled = incoming.length;
    const newSeq = Number(pulled?.lastSeq ?? since);
    setSetting('cloud_sync_cursor', String(newSeq));
    setSetting('cloud_sync_last_error', '');
    setSetting('cloud_sync_last_at', new Date().toISOString());
  } catch (e: any) {
    setSetting('cloud_sync_last_error', e?.message || String(e));
    throw e;
  }
  return result;
}
