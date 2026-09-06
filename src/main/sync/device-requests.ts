/**
 * LAN hub device-join channel (spec §4/5/6/26).
 *
 * The hub is a *rendezvous/staging point* for device-join requests and their
 * decisions. It does NOT own the business roster (desktop has no `users` table
 * and its `devices` table is the pairing registry) — that lives on the Owner's
 * mobile. This module stores requests + decisions and relays them over the WS
 * channel; the owner's mobile turns an approval into real user/device rows.
 */
import { randomBytes } from 'crypto';
import db from '../database';
import {
  DeviceJoinRequest,
  DeviceJoinRequestRecord,
  DeviceJoinDecision,
} from '@shega/shared';

const now = () => new Date().toISOString();

function rowToRecord(row: any): DeviceJoinRequestRecord {
  return {
    requestId: row.id,
    businessId: row.business_id,
    code: row.code,
    joinerDeviceId: row.joiner_device_id,
    joinerName: row.joiner_name,
    joinerModel: row.joiner_model,
    joinerUser: row.joiner_user,
    role: row.role,
    platform: row.platform,
    status: row.status,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
  };
}

/** Stage a new join request, idempotent per (business, joiner device). */
export function submitDeviceJoinRequest(req: DeviceJoinRequest): DeviceJoinRequestRecord {
  const existing = db
    .prepare('SELECT * FROM device_requests WHERE business_id = ? AND joiner_device_id = ? AND status = ?')
    .get(req.businessId, req.joinerDeviceId, 'pending') as any;
  if (existing) return rowToRecord(existing);

  const id = randomBytes(12).toString('hex');
  db.prepare(
    `INSERT INTO device_requests
       (id, business_id, code, joiner_device_id, joiner_name, joiner_model, joiner_user, role, platform, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).run(
    id, req.businessId, req.code ?? null, req.joinerDeviceId, req.joinerName ?? null,
    req.joinerModel ?? null, req.joinerUser, req.role ?? 'cashier', req.platform ?? 'mobile', now()
  );
  return rowToRecord(db.prepare('SELECT * FROM device_requests WHERE id = ?').get(id));
}

/** Return pending (and recently decided) requests for a business. */
export function listDeviceJoinRequests(businessId: string, limit = 100): DeviceJoinRequestRecord[] {
  const rows = db.prepare(
    `SELECT * FROM device_requests WHERE business_id = ?
     ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC LIMIT ?`
  ).all(businessId, limit) as any[];
  return rows.map(rowToRecord);
}

/** Record an owner/manager decision. Returns the updated record or null. */
export function decideDeviceJoinRequest(decision: DeviceJoinDecision): DeviceJoinRequestRecord | null {
  const row = db.prepare('SELECT * FROM device_requests WHERE id = ?').get(decision.requestId) as any;
  if (!row) return null;
  db.prepare('UPDATE device_requests SET status = ?, decided_at = ? WHERE id = ?').run(
    decision.decision, now(), decision.requestId
  );
  return rowToRecord(db.prepare('SELECT * FROM device_requests WHERE id = ?').get(decision.requestId));
}

/**
 * Joiner-side status poll: return the request (with its decision) for an
 * invite code + joiner device, so the joiner can learn whether the owner
 * approved it. Returns the most recent request matching, or null.
 */
export function getDeviceJoinRequestBy(code: string, joinerDeviceId: string): DeviceJoinRequestRecord | null {
  const row = db.prepare(
    `SELECT * FROM device_requests WHERE code = ? AND joiner_device_id = ?
     ORDER BY created_at DESC LIMIT 1`
  ).get(code, joinerDeviceId) as any;
  return row ? rowToRecord(row) : null;
}

// ---------- Invitation publish / resolve (hub side) ----------

export interface HubInvitation {
  id: string;
  businessId: string;
  code: string;
  name: string | null;
  role: string | null;
  platform: string | null;
  expiresAt: string | null;
}

/** Owner publishes an active invitation to the hub so joiners can resolve it by code. */
export function publishInvitation(inv: {
  id: string; businessId: string; code: string; name?: string; role?: string; platform?: string; expiresAt?: string;
}): void {
  db.prepare(
    `INSERT OR REPLACE INTO invitations (id, business_id, code, name, role, platform, created_by, expires_at, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 'open', ?)`
  ).run(inv.id, inv.businessId, inv.code, inv.name ?? null, inv.role ?? null, inv.platform ?? 'mobile',
    inv.expiresAt ?? null, now());
}

/** Resolve a code to an open invitation (used by the joiner device). */
export function resolveInvitation(code: string): HubInvitation | null {
  const row = db.prepare(
    `SELECT * FROM invitations WHERE code = ? AND status = 'open'`
  ).get(code) as any;
  if (!row) return null;
  if (row.expires_at && row.expires_at < now()) {
    db.prepare(`UPDATE invitations SET status = 'expired' WHERE id = ?`).run(row.id);
    return null;
  }
  return {
    id: row.id,
    businessId: row.business_id,
    code: row.code,
    name: row.name,
    role: row.role,
    platform: row.platform,
    expiresAt: row.expires_at,
  };
}
