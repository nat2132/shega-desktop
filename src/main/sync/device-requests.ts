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

export function ensureDeviceRequestsColumns(): void {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS device_requests (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        code TEXT,
        joiner_device_id TEXT NOT NULL,
        joiner_name TEXT,
        joiner_model TEXT,
        joiner_user TEXT,
        role TEXT DEFAULT 'cashier',
        platform TEXT DEFAULT 'mobile',
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        decided_at TEXT,
        assigned_name TEXT,
        assigned_avatar TEXT,
        assigned_permissions TEXT,
        joiner_avatar TEXT
      );
    `);
  } catch { /* ignore */ }

  const cols = ['assigned_name TEXT', 'assigned_avatar TEXT', 'assigned_permissions TEXT', 'joiner_avatar TEXT'];
  for (const col of cols) {
    try {
      db.exec(`ALTER TABLE device_requests ADD COLUMN ${col}`);
    } catch { /* column already exists */ }
  }
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
    } else {
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
    }

    // Also update roster_devices with userId so Connected Devices shows user profile.
    if (bizId != null) {
      try {
        const rosterCols = tableColumns('roster_devices');
        if (rosterCols.has('userId') && rosterCols.has('uuid') && rosterCols.has('businessId')) {
          const nowIso = now();
          const rosterExisting = db.prepare('SELECT id FROM roster_devices WHERE businessId = ? AND uuid = ?').get(bizId, rec.joinerDeviceId) as any;
          if (rosterExisting) {
            if (userId != null && rosterCols.has('userId')) {
              db.prepare('UPDATE roster_devices SET userId = ?, updated_at = ? WHERE id = ?').run(userId, nowIso, rosterExisting.id);
            }
          } else {
            const insertRoster: Record<string, string | number | null> = {
              businessId: bizId,
              uuid: rec.joinerDeviceId,
              device_id: rec.joinerDeviceId,
              name,
              platform: rec.platform ?? 'mobile',
              status,
              isPrimary: 0,
              row_version: 1,
              created_at: nowIso,
              updated_at: nowIso,
              is_deleted: 0,
              is_synced: 1,
            };
            if (userId != null) insertRoster.userId = userId;
            if (role) insertRoster.role = role;
            const rosterKeys = Object.keys(insertRoster).filter((k) => rosterCols.has(k));
            if (rosterKeys.length) {
              db.prepare(`INSERT INTO roster_devices (${rosterKeys.join(', ')}) VALUES (${rosterKeys.map(() => '?').join(', ')})`)
                .run(...rosterKeys.map((k) => insertRoster[k]));
            }
          }
        }
      } catch { /* roster table naming may differ */ }
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

/**
 * Code-less admission lookup (radar-tap / "Add Team" path). Radar-tap owner
 * intent rows are keyed by joiner_device_id WITHOUT a code — the owner tapped
 * the joiner on the radar rather than issuing an invite. The joiner learns its
 * decision by polling the hub with only its own device id, no invitation code.
 * Returns the most recent request for that joiner device across businesses.
 */
export function getDeviceJoinRequestByDeviceId(joinerDeviceId: string): DeviceJoinRequestRecord | null {
  const row = db.prepare(
    `SELECT * FROM device_requests WHERE joiner_device_id = ? ORDER BY created_at DESC LIMIT 1`
  ).get(joinerDeviceId) as any;
  return row ? rowToRecord(row) : null;
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

/** Stage a new join request, idempotent per (business, joiner device).
 *  Reuses an existing `pending` OR `approved` record for the same device —
 *  an owner who tapped the radar (and assigned a role) before the joiner's
 *  request landed has an owner-intent record parked here; the joiner's later
 *  submit must NOT fork a duplicate that would split the STATUS poll. */
export function submitDeviceJoinRequest(req: DeviceJoinRequest): DeviceJoinRequestRecord {
  const resolvedId = resolveBusinessId(String(req.businessId ?? ''));
  const canonicalBizId = resolvedId != null ? String(resolvedId) : String(req.businessId || 1);

  const existing = db
    .prepare('SELECT * FROM device_requests WHERE (business_id = ? OR business_id = ?) AND joiner_device_id = ? AND status IN (?, ?) ORDER BY created_at ASC LIMIT 1')
    .get(canonicalBizId, req.businessId, req.joinerDeviceId, 'pending', 'approved') as any;
  if (existing) {
    // Owner-intent rows are created without a code (the owner tapped the radar
    // before the joiner resolved an invite). Fill in what the submit now knows.
    if (!existing.code && req.code) {
      db.prepare(
        'UPDATE device_requests SET code = ?, joiner_name = COALESCE(?, joiner_name), joiner_model = COALESCE(?, joiner_model), joiner_user = COALESCE(?, joiner_user) WHERE id = ?'
      ).run(req.code, req.joinerName ?? null, req.joinerModel ?? null, req.joinerUser, existing.id);
    }
    return rowToRecord(db.prepare('SELECT * FROM device_requests WHERE id = ?').get(existing.id));
  }

  const id = randomBytes(12).toString('hex');
  db.prepare(
    `INSERT INTO device_requests
       (id, business_id, code, joiner_device_id, joiner_name, joiner_model, joiner_user, role, platform, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).run(
    id, canonicalBizId, req.code ?? null, req.joinerDeviceId, req.joinerName ?? null,
    req.joinerModel ?? null, req.joinerUser, req.role ?? 'cashier', req.platform ?? 'mobile', now()
  );
  const rec = rowToRecord(db.prepare('SELECT * FROM device_requests WHERE id = ?').get(id));
  // Surface the joiner device on the hub roster so the desktop owner's
  // BusinessCenter "Pending device approvals" list shows it immediately.
  upsertJoinDevice(rec, 'pending', null, null, resolveBusinessId(rec.businessId));

  // Emit event to notify Owner UI in real-time
  try {
    const { mainBus } = require('../bus');
    mainBus.emitEvent('device-event', {
      type: 'join-request',
      joinerName: rec.joinerUser || rec.joinerName || 'New Member',
      deviceId: rec.joinerDeviceId,
    });
  } catch { /* best-effort */ }

  return rec;
}

/** Return pending (and recently decided) requests for a business. */
export function listDeviceJoinRequests(businessId: string, limit = 100): DeviceJoinRequestRecord[] {
  let bizInt = String(businessId);
  let bizUuid = String(businessId);
  try {
    const biz = db.prepare('SELECT id, uuid FROM businesses WHERE uuid = ? OR CAST(id AS TEXT) = ? LIMIT 1')
      .get(businessId, businessId) as any;
    if (biz) {
      bizInt = String(biz.id);
      bizUuid = String(biz.uuid || biz.id);
    }
  } catch { /* ignore */ }

  const rows = db.prepare(
    `SELECT * FROM device_requests
     WHERE (business_id = ? OR business_id = ? OR business_id = ?)
     ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC LIMIT ?`
  ).all(businessId, bizInt, bizUuid, limit) as any[];
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
 * Desktop BusinessCenter approve path (`business:set-device-status -> active`)
 * AND the radar tap role-assignment path (`p2p:approve-one`): mirror that
 * approval into the pending join request — decision + provisioning — so the
 * joiner's STATUS poll flips and member/device rows are created even though
 * the desktop approve UI never touches the DEVICE_JOIN channel.
 *
 * When `opts.role` is supplied (owner tapped the joiner in Add Team / Device
 * and assigned a role), that role and permissions override the joiner-submitted
 * ones — the owner controls role assignment. If no request exists yet, the
 * owner's choice is parked as an approved owner-intent record so the joiner's
 * later `submitDeviceJoinRequest` reuses it (and its STATUS poll reads the
 * owner-assigned role + pairing token).
 */
export function provisionJoinForDevice(
  deviceId: string,
  opts?: { role?: string; permissions?: Record<string, unknown>; businessId?: number | string; name?: string; platform?: string },
): boolean {
  ensureDeviceRequestsColumns();
  const row = db.prepare(
    `SELECT * FROM device_requests WHERE joiner_device_id = ? AND status = 'pending'
     ORDER BY created_at ASC LIMIT 1`
  ).get(String(deviceId ?? '')) as any;
  if (!row) {
    // Owner tapped the radar before the joiner's request landed: park an
    // owner-intent record (approved, owner role baked in, code null) so a
    // later submit reuses it and there is no owner-side re-approval.
    if (opts?.role && opts?.businessId) {
      try {
        const id = randomBytes(12).toString('hex');
        const nowIso = now();
        const ident = String(opts.name || 'Team Member').trim() || 'Team Member';
        const cols = tableColumns('device_requests');
        const insertObj: Record<string, string | null> = {
          id,
          business_id: String(opts.businessId),
          code: null,
          joiner_device_id: String(deviceId ?? ''),
          joiner_name: ident,
          joiner_model: null,
          joiner_user: ident,
          role: opts.role ?? 'cashier',
          platform: String(opts.platform ?? 'mobile'),
          status: 'approved',
          created_at: nowIso,
          decided_at: nowIso,
        };
        if (cols.has('assigned_permissions')) {
          insertObj.assigned_permissions = opts.permissions ? JSON.stringify(opts.permissions) : null;
        }

        const keys = Object.keys(insertObj).filter((k) => cols.has(k) || k === 'id' || k === 'business_id' || k === 'joiner_device_id' || k === 'status');
        db.prepare(
          `INSERT INTO device_requests (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`
        ).run(...keys.map((k) => insertObj[k]));

        applyApproval(rowToRecord(db.prepare('SELECT * FROM device_requests WHERE id = ?').get(id)), {
          requestId: id,
          businessId: String(opts.businessId),
          joinerDeviceId: String(deviceId ?? ''),
          decision: 'approved',
          decidedBy: '',
          assignedName: ident,
          assignedRole: opts.role ?? 'cashier',
          assignedPermissions: opts.permissions,
        });
        return true;
      } catch (e: any) {
        console.warn('[device-requests] provision owner-intent skipped:', e?.message);
      }
    }
    return false;
  }
  const rec = rowToRecord(row);
  // Owner-assigned role/permissions win over the joiner-submitted ones. Persist
  // them on the record so the joiner's STATUS poll returns the real assignment.
  const assignedRole = opts?.role || rec.role || 'cashier';
  db.prepare('UPDATE device_requests SET status = ?, decided_at = ?, role = ? WHERE id = ?')
    .run('approved', now(), assignedRole, rec.requestId);
  if (opts?.permissions) {
    try {
      db.prepare('UPDATE device_requests SET assigned_permissions = ? WHERE id = ?')
        .run(JSON.stringify(opts.permissions), rec.requestId);
    } catch {
      try { db.exec('ALTER TABLE device_requests ADD COLUMN assigned_permissions TEXT'); } catch { /* older schema */ }
    }
  }
  applyApproval(rec, {
    requestId: rec.requestId,
    businessId: rec.businessId,
    joinerDeviceId: rec.joinerDeviceId,
    decision: 'approved',
    decidedBy: '',
    assignedName: rec.joinerUser || rec.joinerName,
    assignedAvatar: rec.assignedAvatar ?? null,
    assignedRole,
    assignedPermissions: opts?.permissions,
  });
  return true;
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
/**
 * Code-less admission lookup: the owner's radar-tap approval is keyed by
 * joiner_device_id alone — no invite code exists (the joiner never typed one,
 * the owner tapped them directly). Joiners poll this to learn the decision.
 * Returns the most recent request for that joiner device across businesses.
 */
export function getDeviceJoinRequestByDevice(joinerDeviceId: string): DeviceJoinRequestRecord | null {
  const row = db.prepare(
    `SELECT * FROM device_requests WHERE joiner_device_id = ?
     ORDER BY created_at DESC LIMIT 1`
  ).get(joinerDeviceId) as any;
  return row ? rowToRecord(row) : null;
}

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
  if (row) {
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

  // Desktop-owner invites (Teams → Add User, "SHG-…" codes) live in the
  // `user_invites` table, not `invitations`. A LAN joiner — desktop over HTTP
  // or mobile via the WS channel — must be able to resolve those codes too,
  // otherwise the join dies with "invitation not found" even though the owner
  // is right there on the network. The approved invite admits the joiner
  // through the same device-request flow as any other invitation.
  const ui = db.prepare(
    `SELECT * FROM user_invites WHERE ${CODE_EQ} AND status = 'open'`
  ).get(n) as any;
  if (ui) {
    if (ui.expires_at && ui.expires_at < now()) {
      db.prepare(`UPDATE user_invites SET status = 'expired' WHERE id = ?`).run(ui.id);
      return null;
    }
    return {
      id: ui.id,
      businessId: canonicalBusinessUuid(String(ui.business_id)),
      code: ui.code,
      name: ui.joiner_name ?? null,
      role: ui.suggested_role ?? 'cashier',
      platform: 'desktop',
      expiresAt: ui.expires_at,
      businessName: businessDisplayName(String(ui.business_id)),
    };
  }
  return null;
}
