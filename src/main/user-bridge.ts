/* Cross-platform user identity bridge.
 *
 * Desktop signs in through `admins` (owner/manager) and `employees` +
 * `employee_accounts` (cashier/custom roles). Mobile signs in through the
 * shared `users` table. To make the SAME person able to sign in on BOTH
 * platforms, desktop staff are projected into the `users` relay table
 * (sourceType = 'admin' | 'employee'), which the hub already syncs to Mobile.
 *
 * Rows are keyed by (sourceType, sourceId) so re-bridging idempotently updates
 * the same projected user instead of duplicating. A deterministic synthetic
 * uuid (`staff:admin:<id>` / `staff:emp:<id>`) keeps the projection stable for
 * the sync outbox while never colliding with Mobile-created user uuids.
 */
import db from './database';
import { ensureHubDeviceId } from './sync-hub';
import { DEFAULT_ROLE_SETS } from '@shega/shared';

export type UserBridgeSource = 'admin' | 'employee';

type SyncUser = {
  id: number;
  businessId: number | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  username?: string | null;
  avatar?: string | null;
  role: string;
  roleName: string;
  permissions: string;
  isActive: number;
  isOwner: number;
  pinHash?: string | null;
  pinSalt?: string | null;
  uuid: string;
  device_id?: string | null;
};

function bridgeUuid(source: UserBridgeSource, sourceId: number): string {
  return `staff:${source === 'admin' ? 'admin' : 'emp'}:${sourceId}`;
}

function splitPin(pin: string | null | undefined): { pinHash: string | null; pinSalt: string | null } {
  if (!pin) return { pinHash: null, pinSalt: null };
  const parts = pin.split(':');
  if (parts.length === 2) return { pinHash: parts[1], pinSalt: parts[0] };
  return { pinHash: pin, pinSalt: null };
}

function roleFromName(name: string | null | undefined): string {
  const n = (name || '').toLowerCase();
  if (!n) return 'cashier';
  if (n.includes('owner') || n.includes('super')) return 'owner';
  if (n.includes('manager') || n.includes('supervisor') || n.includes('admin')) return 'manager';
  return 'cashier';
}

function safePermissions(raw: string | null | undefined): string {
  if (!raw) return '{}';
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return JSON.stringify(parsed);
    if (Array.isArray(parsed)) {
      const obj: Record<string, boolean> = {};
      for (const k of parsed) if (typeof k === 'string') obj[k] = true;
      return JSON.stringify(obj);
    }
    return '{}';
  } catch {
    return '{}';
  }
}

/** Upsert the projected `users` row for a desktop admin (owner/manager account). */
export function bridgeAdminUser(adminId: number): void {
  const admin = db
    .prepare('SELECT id, businessId, name, username, role, permissions, isActive, avatar, pin FROM admins WHERE id = ?')
    .get(adminId) as any;
  if (!admin) return;
  const isOwner = admin.role === 'super_admin' || admin.role === 'admin';
  const role = isOwner ? 'owner' : roleFromName(admin.role);
  const { pinHash, pinSalt } = splitPin(admin.pin);
  const now = new Date().toISOString();
  const payload: SyncUser = {
    id: admin.id,
    businessId: admin.businessId ?? null,
    name: admin.name || admin.username || 'Owner',
    email: admin.email ?? null,
    username: admin.username ?? null,
    avatar: admin.avatar ?? null,
    role,
    roleName: isOwner ? 'Owner' : (admin.role || role),
    permissions: safePermissions(admin.permissions),
    isActive: admin.isActive == null ? 1 : admin.isActive ? 1 : 0,
    isOwner: isOwner ? 1 : 0,
    pinHash,
    pinSalt,
    uuid: bridgeUuid('admin', admin.id),
    device_id: ensureHubDeviceId(),
  };
  upsertSyncUser('admin', admin.id, payload);
}

/** Upsert the projected `users` row for a desktop employee + employee_account. */
export function bridgeEmployeeUser(employeeId: number): void {
  const emp = db
    .prepare(
      `SELECT e.*, a.username, a.pin, a.isActive AS accountActive, a.forcePasswordChange,
              r.name AS roleName, r.permissions AS rolePermissions
       FROM employees e
       LEFT JOIN employee_accounts a ON a.employeeId = e.id
       LEFT JOIN employee_roles r ON e.roleId = r.id
       WHERE e.id = ?`
    )
    .get(employeeId) as any;
  if (!emp) return;
  const roleKey = emp.role_key || roleFromName(emp.roleName || emp.role);
  // Multi-owner model: any employee whose role is the owner role is a full,
  // equal owner (isOwner = 1) regardless of which device created them.
  const isOwnerRole = roleKey === 'owner';
  const { pinHash, pinSalt } = splitPin(emp.pin);
  const now = new Date().toISOString();
  const payload: SyncUser = {
    id: emp.id,
    businessId: emp.businessId ?? null,
    name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.username || `Employee ${emp.id}`,
    phone: emp.phone ?? null,
    email: emp.email ?? null,
    username: emp.username ?? null,
    avatar: emp.avatar ?? null,
    role: roleKey,
    roleName: emp.roleName || roleKey,
    // Owners always carry the full owner permission set, equal on every device.
    permissions: isOwnerRole
      ? JSON.stringify(DEFAULT_ROLE_SETS.owner)
      : safePermissions(emp.permissions_json || (Array.isArray(emp.rolePermissions) ? JSON.stringify(emp.rolePermissions) : emp.rolePermissions)),
    isActive: emp.isActive == null ? 1 : emp.isActive ? 1 : 0,
    isOwner: isOwnerRole ? 1 : 0,
    pinHash,
    pinSalt,
    uuid: bridgeUuid('employee', emp.id),
    device_id: ensureHubDeviceId(),
  };
  upsertSyncUser('employee', emp.id, payload);
}

function upsertSyncUser(source: UserBridgeSource, sourceId: number, payload: SyncUser): void {
  const existing = db.prepare('SELECT id FROM users WHERE sourceType = ? AND sourceId = ?').get(source, sourceId) as any;
  const now = new Date().toISOString();
  if (existing) {
    db.prepare(
      `UPDATE users SET businessId = ?, name = ?, phone = ?, email = ?, username = ?, avatar = ?,
         role = ?, roleName = ?, permissions = ?, isActive = ?, isOwner = ?, pinHash = ?, pinSalt = ?,
         updated_at = ?, is_deleted = 0 WHERE id = ?`
    ).run(
      payload.businessId, payload.name, payload.phone, payload.email, payload.username, payload.avatar,
      payload.role, payload.roleName, payload.permissions, payload.isActive, payload.isOwner,
      payload.pinHash, payload.pinSalt, now, existing.id
    );
  } else {
    db.prepare(
      `INSERT INTO users (businessId, name, phone, email, username, avatar, role, roleName, permissions,
         isActive, isOwner, pinHash, pinSalt, uuid, device_id, sourceType, sourceId, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      payload.businessId, payload.name, payload.phone, payload.email, payload.username, payload.avatar,
      payload.role, payload.roleName, payload.permissions, payload.isActive, payload.isOwner,
      payload.pinHash, payload.pinSalt, payload.uuid, payload.device_id, source, sourceId, now, now
    );
  }
}

/** Soft-delete the projected user when a desktop admin/employee is removed. */
export function bridgeDeleteBySource(source: UserBridgeSource, sourceId: number): void {
  db.prepare('UPDATE users SET is_deleted = 1, updated_at = ? WHERE sourceType = ? AND sourceId = ?')
    .run(new Date().toISOString(), source, sourceId);
}

/** Reconcile the whole desktop staff roster into the synced `users` table. */
export function reconcileUserBridge(): number {
  const admins = db.prepare('SELECT id FROM admins').all() as any[];
  const emps = db.prepare('SELECT id FROM employees').all() as any[];
  for (const a of admins) bridgeAdminUser(a.id);
  for (const e of emps) bridgeEmployeeUser(e.id);
  return admins.length + emps.length;
}

/** Desktop-visible view of the synced team (mobile-created users + projections). */
export function getSyncedTeam(businessId?: number | null): any[] {
  try {
    const q = (businessId != null && businessId !== 0)
      ? `SELECT id, businessId, name, username, email, phone, role, roleName, permissions, avatar, isActive, isOwner, sourceType, updated_at
         FROM users WHERE (is_deleted IS NULL OR is_deleted = 0) AND (businessId = ? OR CAST(businessId AS TEXT) = ? OR businessId IS NULL)
         ORDER BY isOwner DESC, name ASC`
      : `SELECT id, businessId, name, username, email, phone, role, roleName, permissions, avatar, isActive, isOwner, sourceType, updated_at
         FROM users WHERE (is_deleted IS NULL OR is_deleted = 0)
         ORDER BY isOwner DESC, name ASC`;
    return db.prepare(q).all(businessId ? [businessId, String(businessId)] : []) as any[];
  } catch (e) {
    console.warn('[user-bridge] getSyncedTeam error:', e);
    return [];
  }
}

/** Roster row matched for sign-in (username first, then email/name). */
export function findRosterLogin(username: string): any | null {
  const row = db
    .prepare(
      `SELECT id, businessId, name, email, phone, username, role, roleName, permissions, isActive, isOwner, pinHash, pinSalt, avatar
       FROM users WHERE is_deleted = 0 AND isActive = 1
         AND (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?))
       LIMIT 1`
    )
    .get(username.trim(), username.trim(), username.trim()) as any;
  return row ?? null;
}