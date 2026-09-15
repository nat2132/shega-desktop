/* Desktop MoR (Ministry of Revenues) taxpayer verification — Section U.
 *
 * Flow: Enter TIN → Verify with MoR → Backend gateway (official MoR only) →
 * Review → Save. Then the cached, dated MoR answer is used everywhere the
 * verified TIN is shown. Offline-first: cached answers are served without
 * connectivity and surfaced with a clear "cached" indicator + freshness age;
 * nothing is ever promoted to "verified" unless MoR actually said so.
 *
 * Privacy: the full TIN is kept only in the local DB (never logged); the
 * backend persists hash/mask only. No MoR credentials exist on this device.
 */
import db from '../database';
import { logger } from '../logger';
import {
  buildClientCacheRecord,
  fromMorBackendResponse,
  type MorBackendResponse,
  type MorVerification,
  type MorVerificationStatus,
} from '@shega/shared';

const DEFAULT_BASE = 'https://shega-api-dah3.onrender.com';

interface DbRow {
  tin: string;
  sub_tin: string | null;
  status: string;
  taxpayer_name: string | null;
  taxpayer_type: string | null;
  registration: string | null;
  reference: string | null;
  verified_at: string | null;
  source: string;
  reason: string | null;
  cached_at: string;
  cache_until: string;
}

function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
  return row?.value ?? null;
}

function getBaseUrl(): string {
  return (getSetting('cloud_sync_url') || process.env.SHEGA_API_URL || DEFAULT_BASE).replace(/\/+$/, '');
}

function toRecord(row: DbRow): MorVerification {
  return {
    tin: row.tin,
    subTin: row.sub_tin,
    status: row.status as MorVerificationStatus,
    taxpayerName: row.taxpayer_name,
    taxpayerType: row.taxpayer_type,
    registration: row.registration ? JSON.parse(row.registration) : null,
    reference: row.reference,
    verifiedAt: row.verified_at,
    source: row.source === 'mor' || row.source === 'backend' ? row.source : 'client-cache',
    reason: row.reason,
    cachedAt: row.cached_at,
    cacheUntil: row.cache_until,
  };
}

export function isBackendLinked(): boolean {
  return !!getSetting('pairing_access_token');
}

function getCached(tin: string, subTin: string | null | undefined): MorVerification | null {
  const row = db
    .prepare('SELECT * FROM mor_verifications WHERE tin = ? AND COALESCE(sub_tin, "") = COALESCE(?, "")')
    .get(tin, subTin ?? '') as DbRow | undefined;
  return row ? toRecord(row) : null;
}

function upsert(record: MorVerification): void {
  db.prepare(
    `INSERT INTO mor_verifications
       (tin, sub_tin, status, taxpayer_name, taxpayer_type, registration, reference,
        verified_at, source, reason, cached_at, cache_until, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(tin) DO UPDATE SET
       status = excluded.status,
       sub_tin = excluded.sub_tin,
       taxpayer_name = excluded.taxpayer_name,
       taxpayer_type = excluded.taxpayer_type,
       registration = excluded.registration,
       reference = excluded.reference,
       verified_at = excluded.verified_at,
       source = excluded.source,
       reason = excluded.reason,
       cached_at = excluded.cached_at,
       cache_until = excluded.cache_until,
       updated_at = CURRENT_TIMESTAMP`,
  ).run(
    record.tin,
    record.subTin ?? null,
    record.status,
    record.taxpayerName ?? null,
    record.taxpayerType ?? null,
    record.registration ? JSON.stringify(record.registration) : null,
    record.reference ?? null,
    record.verifiedAt ?? null,
    record.source,
    record.reason ?? null,
    record.cachedAt ?? new Date().toISOString(),
    record.cacheUntil ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  );
}

async function callBackend(tin: string, subTin: string | null, force: boolean): Promise<MorBackendResponse> {
  const token = getSetting('pairing_access_token');
  const res = await fetch(`${getBaseUrl()}/api/mor/verify-tin/`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tin, sub_tin: subTin ?? null, force }),
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg = data?.detail ?? data?.error ?? (typeof data === 'string' ? data : `HTTP ${res.status}`);
    const err: any = new Error(typeof msg === 'object' ? msg.detail ?? JSON.stringify(msg) : String(msg));
    err.status = res.status;
    throw err;
  }
  return data as MorBackendResponse;
}

export async function verifyTin(
  tin: string,
  subTin?: string | null,
  force = false,
): Promise<MorVerification> {
  const flat = tin.replace(/[\s-]/g, '').trim();
  if (!/^\d{8,12}$/.test(flat)) {
    return {
      tin: flat,
      subTin: subTin ?? null,
      status: 'unavailable',
      reason: 'invalid_tin',
      source: 'client-cache',
    };
  }

  // Offline-first: serve a fresh cached answer without hitting the network.
  if (!force) {
    const cached = getCached(flat, subTin);
    if (cached && isFresh(cached)) return cached;
  }

  if (!isBackendLinked()) {
    return {
      tin: flat,
      subTin: subTin ?? null,
      status: 'unavailable',
      reason: 'backend_link_required',
      source: 'client-cache',
    };
  }

  try {
    const res = await callBackend(flat, subTin ?? null, force);
    const record = buildClientCacheRecord(fromMorBackendResponse(res));
    upsert(record);
    return record;
  } catch (err) {
    // Transport/auth failure: honest "unavailable", keep any older cached data
    // only if we can tell the user it is stale (the UI renders the reason).
    logger.warn('mor verify transport failure', { tin: flat.slice(0, 2) + '****', error: String(err) });
    return {
      tin: flat,
      subTin: subTin ?? null,
      status: 'unavailable',
      reason: (err as any)?.status ? 'backend_rejected' : 'backend_unreachable',
      source: 'client-cache',
    };
  }
}

export function getVerification(tin: string, subTin?: string | null): MorVerification | null {
  return getCached(tin.replace(/[\s-]/g, ''), subTin);
}

export function listVerifications(): { verification: MorVerification; fresh: boolean }[] {
  const rows = db
    .prepare('SELECT * FROM mor_verifications ORDER BY updated_at DESC, cached_at DESC LIMIT 200')
    .all() as DbRow[];
  return rows.map((row) => {
    const verification = toRecord(row);
    return { verification, fresh: isFresh(verification) };
  });
}

export function clearVerification(tin: string): void {
  db.prepare('DELETE FROM mor_verifications WHERE tin = ?').run(tin.replace(/[\s-]/g, ''));
}

function isFresh(v: MorVerification): boolean {
  if (!v.cacheUntil) return v.status !== 'unavailable' && v.status !== 'failed';
  return Date.now() < new Date(v.cacheUntil).getTime();
}