/**
 * LAN hub device-join channel (spec §4/5/6/26).
 *
 * The hub is a *rendezvous/staging point* for device-join requests and their
 * decisions. Any authorized Owner/Manager hub — on Desktop or Mobile — can
 * serve as that rendezvous: platforms are equal first-class participants, and
 * the business roster (users + devices) lives per-device on every authorized
 * install, synced over LAN + Cloud. This module stores requests + decisions
 * and relays them over the WS channel; the approving owner turns a decision
 * into real user/device rows.
 */
import { randomBytes, randomUUID } from 'crypto';
import db from '../database';
import {
  DeviceJoinRequest,
  DeviceJoinRequestRecord,
  DeviceJoinDecision,
} from '@shega/shared';

const now = () => new Date().toISOString();
const normalizeCode = (code: string) => String(code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const CODE_EQ = "replace(replace(upper(coalesce(code,'')), '-', ''), ' ', '') = ?";

const columnCache = new Map<string, Set<string>>();
function tableColumns(table: string): Set<string> {
  let cols = columnCache.get(table);
  if (!cols) {
    try {
      cols = new Set((db.prepare(`PRAGMA table_info(${table})`).all() as any[]).map((c) => c.name));
    } catch {
      cols = new Set<string>();
    }
    columnCache.set(table, cols);
  }
  return cols;
}

/** Map the hub's businessId reference (int string or uuid) to the integer business row id. */
function resolveBusinessId(bizText: string): number | null {
  if (!bizText) return null;
  try {
    const row = db.prepare('SELECT id FROM businesses WHERE uuid = ? OR CAST(id AS TEXT) = ? LIMIT 1').get(bizText, bizText) as any;
    return row ? Number(row.id) : null;
  } catch {
    return null;
  }
}

/**
 * Create (or promote) the joiner's `devices` roster row on the hub so the
 * owner's BusinessCenter "Pending device approvals" list surfaces it. Column
 * set is guarded because older hubs may lack the extended roster columns.
 */
function upsertJoinDevice(
  rec: DeviceJoinRequestRecord,
  status: 'pending' | 'active' | 'revoked',
  userId: number | null,
  role: string | null,
  bizId: number | null,
): void {
  try {
    const cols = tableColumns('devices');
    if (!cols.has('device_id')) return;
    const nowIso = now();
    const name = String(rec.joinerName || rec.joinerUser || rec.joinerDeviceId.slice(0, 8));
    const existing = db.prepare('SELECT id FROM devices WHERE device_id = ?').get(rec.joinerDeviceId) as any;

    const updates: string[] = ['status = ?'];
    const vals: (string | number | null)[] = [status];
    const assign = (col: string, v: string | number | null) => {
      if (cols.has(col)) { updates.push(`${col} = ?`); vals.push(v); }
    };
    assign('name', name);
    assign('businessId', bizId);
    assign('platform', rec.platform ?? 'mobile');
    assign('userId', userId);
    assign('role', role);
    assign('uuid', rec.joinerDeviceId);
    assign('updated_at', nowIso);
    assign('is_synced', 1);

    if (existing) {
      db.prepare(`UPDATE devices SET ${updates.join(', ')} WHERE device_id = ?`).run(...vals, rec.joinerDeviceId);
      return;
    }

    const insert: Record<string, string | number | null> = {
      device_id: rec.joinerDeviceId,
      name,
      platform: rec.platform ?? 'mobile',
      status,
      uuid: rec.joinerDeviceId,
      row_version: 1,
      created_at: nowIso,
      updated_at: nowIso,
      is_deleted: 0,
      is_synced: 1,
    };
    if (bizId != null) insert.businessId = bizId;
    if (userId != null) insert.userId = userId;
    if (role) insert.role = role;
    const keys = Object.keys(insert).filter((k) => cols.has(k));
    if (keys.length) {
      db.prepare(`INSERT INTO devices (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`)
        .run(...keys.map((k) => insert[k]));
    }
  } catch (e: any) {
    // The devices registry may be missing/incompatible on this hub build —
    // the join request and its decision stand alone, so provisioning degrades
    // quietly instead of failing the whole join.
    console.warn('[device-requests] upsertJoinDevice skipped:', e?.message);
  }
}

/** Find an active member on a business, or create one for the approved joiner. */
function findOrCreateMember(bizId: number, name: string, role: string, decision?: DeviceJoinDecision): number | null {
  try {
    const cols = tableColumns('users');
    if (!cols.has('id') || !cols.has('businessId') || !cols.has('name')) return null;
    const existing = db.prepare(
      `SELECT id FROM users WHERE businessId = ? AND name = ? COLLATE NOCASE AND isActive = 1 AND is_deleted = 0 LIMIT 1`
    ).get(bizId, name) as any;
    if (existing) return Number(existing.id);

    const nowIso = now();
    const insert: Record<string, string | number | null> = {
      businessId: bizId,
      name,
      role,
      roleName: role,
      permissions: decision?.assignedPermissions && typeof decision.assignedPermissions === 'object'
        ? JSON.stringify(decision.assignedPermissions)
        : '{}',
      avatar: decision?.assignedAvatar ?? null as string | null,
      isActive: 1,
      isOwner: role === 'owner' ? 1 : 0,
      uuid: randomUUID(),
      row_version: 1,
      created_at: nowIso,
      updated_at: nowIso,
      is_deleted: 0,
      is_synced: 1,
    };
    const keys = Object.keys(insert).filter((k) => cols.has(k));
    const info = db.prepare(`INSERT INTO users (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`)
      .run(...keys.map((k) => insert[k]));
    return Number(info.lastInsertRowid);
  } catch (e: any) {
    console.warn('[device-requests] findOrCreateMember skipped:', e?.message);
    return null;
  }
}

/** Consume the open invitation tied to an approved join (one device per invite). */
function markInvitationUsed(code: string | null): void {
  if (!code) return;
  const n = normalizeCode(code);
  db.prepare(`UPDATE invitations SET status = 'used' WHERE ${CODE_EQ} AND status = 'open'`).run(n);
}

/**
 * Turn an approved join decision into real roster rows (user + active device)
 * and consume the invitation. Idempotent: re-deciding an already-approved
 * request re-runs the same writes without creating duplicates.
 */
function applyApproval(rec: DeviceJoinRequestRecord, decision?: DeviceJoinDecision): void {
  const bizId = resolveBusinessId(rec.businessId);
  const role = String(decision?.assignedRole || rec.role || 'cashier');
  const personName = String(decision?.assignedName || rec.joinerUser || rec.joinerName || 'Team Member').trim();
  const userId = bizId != null ? findOrCreateMember(bizId, personName, role, decision) : null;
  // Custom-permission membership: persist the owner's picks on the user row.
  if (userId != null && decision?.assignedPermissions && typeof decision.assignedPermissions === 'object') {
    try {
      db.prepare('UPDATE users SET permissions = ?, updated_at = ? WHERE id = ?')
        .run(JSON.stringify(decision.assignedPermissions), now(), userId);
    } catch { /* column-guarded installs skip gracefully */ }
  }
  upsertJoinDevice(rec, 'active', userId, role, bizId);
  markInvitationUsed(rec.code ?? null);
}

function applyRejection(rec: DeviceJoinRequestRecord): void {
  upsertJoinDevice(rec, 'revoked', null, null, resolveBusinessId(rec.businessId));
}

function rowToRecord(row: any): DeviceJoinRequestRecord {
  const rec: DeviceJoinRequestRecord = {
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
  // Owner-assigned identity rides along so the joiner is provisioned with it.
  if (row.assigned_name) rec.assignedName = row.assigned_name;
  if (row.assigned_avatar) rec.assignedAvatar = row.assigned_avatar;
  if (row.assigned_permissions) {
    try { rec.assignedPermissions = JSON.parse(row.assigned_permissions); } catch { /* ignore */ }
  }
  if (row.joiner_avatar) rec.assignedAvatar = row.joiner_avatar;
  return rec;
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
  const rec = rowToRecord(db.prepare('SELECT * FROM device_requests WHERE id = ?').get(id));
  // Surface the joiner device on the hub roster so the desktop owner's
  // BusinessCenter "Pending device approvals" list shows it immediately.
  upsertJoinDevice(rec, 'pending', null, null, resolveBusinessId(rec.businessId));
  return rec;
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
  if (!['approved', 'rejected'].includes(decision.decision)) return null;
  const row = db.prepare('SELECT * FROM device_requests WHERE id = ?').get(decision.requestId) as any;
  if (!row) return null;
  const rec = rowToRecord(row);
  db.prepare('UPDATE device_requests SET status = ?, decided_at = ? WHERE id = ?').run(
    decision.decision, now(), decision.requestId
  );
  // Persist the owner-assigned identity on the record so the joiner's STATUS
  // poll (and any roster mirror) receives the exact name/avatar/role/permissions.
  try {
    const sets: string[] = [];
    const vals: any[] = [];
    if (decision.assignedName) { sets.push('assigned_name = ?'); vals.push(decision.assignedName); }
    if (decision.assignedRole) { sets.push('role = ?'); vals.push(decision.assignedRole); }
    if (decision.assignedAvatar !== undefined) { sets.push('assigned_avatar = ?'); vals.push(decision.assignedAvatar); }
    if (decision.assignedPermissions) { sets.push('assigned_permissions = ?'); vals.push(JSON.stringify(decision.assignedPermissions)); }
    if (sets.length) {
      vals.push(decision.requestId);
      db.prepare(`UPDATE device_requests SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
    }
  } catch {
    try { db.exec('ALTER TABLE device_requests ADD COLUMN assigned_name TEXT');
      db.exec('ALTER TABLE device_requests ADD COLUMN assigned_avatar TEXT');
      db.exec('ALTER TABLE device_requests ADD COLUMN assigned_permissions TEXT'); } catch { /* older schema */ }
  }
  // Approval is the point where the join becomes *real*: create the member's
  // user row (with the owner-assigned name/avatar/role/permissions), promote
  // the device to active, consume the invitation.
  if (decision.decision === 'approved') {
    applyApproval(rec, decision);
  } else {
    applyRejection(rec);
  }
  return rowToRecord(db.prepare('SELECT * FROM device_requests WHERE id = ?').get(decision.requestId));
}

/**
 * Desktop BusinessCenter approve path (`business:set-device-status -> active`):
 * mirror that approval into the pending join request — decision + provisioning —
 * so the joiner's STATUS poll flips and member/device rows are created even
 * though the desktop approve UI never touches the DEVICE_JOIN channel.
 */
export function provisionJoinForDevice(deviceId: string): void {
  const row = db.prepare(
    `SELECT * FROM device_requests WHERE joiner_device_id = ? AND status = 'pending'
     ORDER BY created_at ASC LIMIT 1`
  ).get(String(deviceId ?? '')) as any;
  if (!row) return;
  const rec = rowToRecord(row);
  db.prepare('UPDATE device_requests SET status = ?, decided_at = ? WHERE id = ?').run('approved', now(), rec.requestId);
  applyApproval(rec, {
    requestId: rec.requestId,
    businessId: rec.businessId,
    joinerDeviceId: rec.joinerDeviceId,
    decision: 'approved',
    decidedBy: '',
    assignedName: (row as any).joiner_avatar ? rec.joinerUser : rec.joinerUser,
    assignedAvatar: (row as any).joiner_avatar ?? null,
  });
}

/**
 * Owner-assigned identity for a join request (name + profile picture).
 * Applies to the pending request's staged user row immediately (or the
 * already-materialized user once approved) so the member appears in the team
 * with the owner-chosen identity, and — for approvals — the identity rides
 * along on the join record the joiner's STATUS poll returns.
 */
export function assignJoinIdentity(requestId: string, identity: { name?: string; avatar?: string | null }): boolean {
  const row = db.prepare('SELECT * FROM device_requests WHERE id = ?').get(requestId) as any;
  if (!row) return false;
  const name = identity.name?.trim();
  const nowIso = now();
  // Materialized user (approval already happened): update name/avatar there.
  if (row.status === 'approved') {
    const bizId = resolveBusinessId(row.business_id);
    const target = name || row.joiner_user;
    if (bizId != null && target) {
      const existing = db.prepare(
        `SELECT id FROM users WHERE businessId = ? AND name = ? COLLATE NOCASE AND isActive = 1 AND is_deleted = 0 LIMIT 1`
      ).get(bizId, target) as any;
      if (existing) {
        const sets: string[] = [];
        const vals: any[] = [];
        if (name) { sets.push('name = ?'); vals.push(name); }
        if (identity.avatar !== undefined) { sets.push('avatar = ?'); vals.push(identity.avatar); }
        if (sets.length) {
          sets.push('updated_at = ?'); vals.push(nowIso);
          vals.push(existing.id);
          db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
          return true;
        }
      }
    }
    return false;
  }
  // Pending: store the identity on the request so applyApproval uses it when
  // the owner confirms the invitation.
  if (name) db.prepare('UPDATE device_requests SET joiner_user = ? WHERE id = ?').run(name, requestId);
  if (identity.avatar !== undefined) {
    try { db.prepare('UPDATE device_requests SET joiner_avatar = ? WHERE id = ?').run(identity.avatar, requestId); }
    catch { db.exec('ALTER TABLE device_requests ADD COLUMN joiner_avatar TEXT');
      db.prepare('UPDATE device_requests SET joiner_avatar = ? WHERE id = ?').run(identity.avatar, requestId); }
  }
  return true;
}

/**
 * Joiner-side status poll: return the request (with its decision) for an
 * invite code + joiner device, so the joiner can learn whether the owner
 * approved it. Returns the most recent request matching, or null.
 */
/** Owner can re-invite with the same code; dedup on business + joinerDeviceId. */
export function getDeviceJoinRequestBy(code: string, joinerDeviceId: string): DeviceJoinRequestRecord | null {
  const n = normalizeCode(code);
  const row = db.prepare(
    `SELECT * FROM device_requests WHERE ${CODE_EQ} AND joiner_device_id = ?
     ORDER BY created_at DESC LIMIT 1`
  ).get(n, joinerDeviceId) as any;
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
  businessName?: string | null;
}

/**
 * Canonicalize a stored business reference (int id string OR uuid) to the
 * business's stable UUID for the joiner wire. Joining devices key their local
 * business identity by UUID, so a desktop-created invite (stored as the int id
 * string) must resolve to the real uuid — otherwise the same business would be
 * known by two identities across platforms (the "business-uuid split").
 */
export function canonicalBusinessUuid(bizText: string): string {
  if (!bizText) return bizText;
  try {
    const row = db.prepare('SELECT id, uuid FROM businesses WHERE uuid = ? OR CAST(id AS TEXT) = ? LIMIT 1')
      .get(bizText, bizText) as any;
    if (!row) return bizText;
    if (row.uuid) return row.uuid;
    // Desktop-created business with no uuid yet — materialize one so the joiner
    // adopts the same uuid the relay emits, never the raw int or a fabricated
    // sentinel.
    const uuid = randomUUID();
    db.prepare('UPDATE businesses SET uuid = ? WHERE id = ?').run(uuid, Number(row.id));
    return uuid;
  } catch {
    return bizText;
  }
}

/** Human business name for a stored int-id string or uuid reference. */
export function businessDisplayName(bizText: string): string | null {
  if (!bizText) return null;
  try {
    const row = db.prepare('SELECT businessName, storeName FROM businesses WHERE uuid = ? OR CAST(id AS TEXT) = ? LIMIT 1')
      .get(bizText, bizText) as any;
    return row?.businessName || row?.storeName || null;
  } catch {
    return null;
  }
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
  const n = normalizeCode(code);
  const row = db.prepare(
    `SELECT * FROM invitations WHERE ${CODE_EQ} AND status = 'open'`
  ).get(n) as any;
  if (!row) return null;
  if (row.expires_at && row.expires_at < now()) {
    db.prepare(`UPDATE invitations SET status = 'expired' WHERE id = ?`).run(row.id);
    return null;
  }
  return {
    id: row.id,
    businessId: canonicalBusinessUuid(String(row.business_id)),
    code: row.code,
    name: row.name,
    role: row.role,
    platform: row.platform,
    expiresAt: row.expires_at,
    businessName: businessDisplayName(String(row.business_id)),
  };
}
