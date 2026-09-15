import { randomUUID } from 'crypto';
import { ipcMain } from 'electron';
import db from './database';
import { ensureHubDeviceId } from './sync-hub';
import {
  getBuiltinRole, SURFACED_BUILTIN_ROLES, DEFAULT_ROLE_SETS, can, PermissionContext,
} from '@shega/shared';
import type { BuiltinRoleKey, PermissionValue } from '@shega/shared';

/**
 * Desktop business-domain handlers for the shared multi-device model:
 * registers, locations, enriched devices, canonical roles and permission-gated
 * role lookups. These mirror the Mobile businessService so both platforms share
 * the same business model.
 *
 * Auth/audit accessors are injected from ipc-handlers so the same login session
 * and permission set drive everything.
 */

export interface BusinessDomainConfig {
  getActiveBusinessId: () => number;
  isOwnerOrSuper: () => boolean;
  /** The current desktop user's effective role key ('owner'|'manager'|'cashier'|...). */
  getUserRole: () => string;
  /** Build the shared-model permission context for the current desktop user. */
  buildPermissionContext: () => PermissionContext;
  audit: (action: string, entityType: string, entityId: number | null, description: string) => void;
}

let cfg: BusinessDomainConfig | null = null;

/**
 * §P5 Unsynced-Data Disable Guard — count records attributable to a device that
 * have not yet been synced to the hub (pending outbox rows carrying its device_id).
 */
function countUnsyncedForDevice(deviceId: string | number): number {
  const row = db
    .prepare('SELECT COUNT(*) AS c FROM sync_outbox WHERE device_id = ?')
    .get(String(deviceId)) as any;
  return row?.c ?? 0;
}

export function registerBusinessDomainHandlers(config: BusinessDomainConfig) {
  cfg = config;
  const bizId = () => config.getActiveBusinessId();

  /** Owner / super-admin users, or any user holding the canonical team.manage permission. */
  const canManageTeam = () =>
    config.isOwnerOrSuper() || can(config.buildPermissionContext(), 'team.manage');

  // ---- Registers ----
  ipcMain.handle('business:list-registers', () => {
    return db.prepare('SELECT * FROM registers WHERE businessId = ? AND is_deleted = 0 ORDER BY created_at').all(bizId());
  });

  ipcMain.handle('business:add-register', (_e, name: string, locationId?: number) => {
    if (!name?.trim()) throw new Error('Register name is required');
    const r = db.prepare('INSERT INTO registers (businessId, locationId, name, hasDrawer, isActive, created_at) VALUES (?, ?, ?, 1, 1, ?)')
      .run(bizId(), locationId ?? null, name.trim(), new Date().toISOString());
    config.audit('register.added', 'register', r.lastInsertRowid as number, `Added register ${name}`);
    return db.prepare('SELECT * FROM registers WHERE id = ?').get(r.lastInsertRowid);
  });

  ipcMain.handle('business:update-register', (_e, id: number, patch: any) => {
    const cur = db.prepare('SELECT * FROM registers WHERE id = ?').get(id) as any;
    if (!cur) throw new Error('Register not found');
    db.prepare(
      'UPDATE registers SET name = ?, locationId = ?, printerName = ?, hasDrawer = ?, isActive = ?, deviceId = ?, updated_at = ? WHERE id = ?'
    ).run(
      patch.name ?? cur.name,
      patch.locationId ?? cur.locationId,
      patch.printerName ?? cur.printerName,
      patch.hasDrawer !== undefined ? (patch.hasDrawer ? 1 : 0) : cur.hasDrawer,
      patch.isActive !== undefined ? (patch.isActive ? 1 : 0) : cur.isActive,
      patch.deviceId ?? cur.deviceId,
      new Date().toISOString(),
      id
    );
    return db.prepare('SELECT * FROM registers WHERE id = ?').get(id);
  });

  ipcMain.handle('business:delete-register', (_e, id: number) => {
    db.prepare('UPDATE registers SET is_deleted = 1, updated_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    config.audit('register.removed', 'register', id, 'Removed register');
    return { ok: true };
  });

  // ---- Locations ----
  ipcMain.handle('business:list-locations', () => {
    return db.prepare('SELECT * FROM locations WHERE businessId = ? AND is_deleted = 0 ORDER BY created_at').all(bizId());
  });

  ipcMain.handle('business:add-location', (_e, name: string, address?: string) => {
    const r = db.prepare('INSERT INTO locations (businessId, name, address, created_at) VALUES (?, ?, ?, ?)')
      .run(bizId(), name.trim(), address ?? null, new Date().toISOString());
    return db.prepare('SELECT * FROM locations WHERE id = ?').get(r.lastInsertRowid);
  });

  // ---- Devices ----
  ipcMain.handle('business:list-devices', () => {
    return db.prepare('SELECT * FROM devices WHERE businessId = ? OR businessId IS NULL ORDER BY created_at').all(bizId());
  });

  ipcMain.handle('business:set-device-status', (_e, deviceId: string | number, status: string) => {
    // §P5 Unsynced-Data Disable Guard — never disable/remove a device that still
    // has unsynced records (protect against silently losing not-yet-synced data).
    if (status === 'disabled' || status === 'removed') {
      const unsynced = countUnsyncedForDevice(deviceId);
      if (unsynced > 0) {
        throw new Error(
          `Cannot ${status === 'disabled' ? 'disable' : 'remove'} this device — it still has ${unsynced} unsynced record${unsynced === 1 ? '' : 's'}. Sync first.`
        );
      }
    }
    db.prepare('UPDATE devices SET status = ?, updated_at = ? WHERE device_id = ? OR id = ?')
      .run(status, new Date().toISOString(), deviceId, deviceId);
    config.audit('device.changed', 'device', null, `Device ${deviceId} -> ${status}`);
    return { ok: true };
  });

  ipcMain.handle('business:rename-device', (_e, deviceId: string | number, name: string) => {
    db.prepare('UPDATE devices SET name = ?, updated_at = ? WHERE device_id = ? OR id = ?')
      .run(name.trim(), new Date().toISOString(), deviceId, deviceId);
    return { ok: true };
  });

  // §30 — Device Replacement. Registers a replacement for a lost/broken device,
  // carrying over the old device's user/role/register (and primary flag) onto
  // the new row, then deprecating the old row (status='removed', soft-delete) so
  // historical audit entries and the synced roster remain intact.
  ipcMain.handle('business:replace-device', (_e, input: {
    oldDeviceId: string | number;
    name: string;
    platform?: string;
    setThisAsReplacement?: boolean;
  }) => {
    if (!input?.name?.trim()) throw new Error('Replacement device name is required');
    const old = db
      .prepare('SELECT * FROM devices WHERE (device_id = ? OR id = ?) AND is_deleted = 0')
      .get(input.oldDeviceId, input.oldDeviceId) as any;
    if (!old) throw new Error('Original device not found or already removed');

    // §P5 Unsynced-Data Disable Guard — replacing removes the old device, so
    // block it while the original still has unsynced records.
    const unsynced = countUnsyncedForDevice(input.oldDeviceId);
    if (unsynced > 0) {
      throw new Error(
        `Cannot replace this device — it still has ${unsynced} unsynced record${unsynced === 1 ? '' : 's'}. Sync before replacing.`
      );
    }

    const bid = bizId();
    const now = new Date().toISOString();
    const newDeviceId = randomUUID();
    const wasPrimary = !!old.isPrimary;
    // The replacement is a normal authorized device — its activation does not
    // depend on whether it is running on Desktop or Mobile (platforms are equal
    // first-class participants). Either platform can be a primary/master device.
    const status = 'active';
    const colon = db
      .prepare(
        `INSERT INTO devices (device_id, name, businessId, platform, role, userId, registerId, status, isPrimary, uuid, row_version, created_at, updated_at, is_deleted, is_synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0, 1)`
      )
      .run(
        newDeviceId, input.name.trim(), bid, input.platform ?? old.platform ?? 'desktop',
        old.role ?? null, old.userId ?? null, old.registerId ?? null, status,
        wasPrimary ? 1 : 0, randomUUID(), now, now,
      );
    const newId = Number(colon.lastInsertRowid);

    // Deprecate the original device (history preserved, removed from active roster).
    db.prepare("UPDATE devices SET status = 'removed', is_deleted = 1, updated_at = ? WHERE id = ?")
      .run(now, old.id);

    cfg?.audit('device.replace', 'device', newId,
      `Replaced device ${input.oldDeviceId} -> ${newDeviceId}`);

    return { ok: true, id: newId, device_id: newDeviceId };
  });

  /**
   * §17/§18 remote device control — the receiving side. Reads THIS desktop
   * install's own roster status from the synced `roster_devices` table, matched
   * by this device's hub identity (sync_meta.device_id). If a matching blocking
   * status (locked/disabled/removed) was relayed from another device, the
   * renderer uses it to lock the whole UI.
   */
  ipcMain.handle('business:self-device-status', () => {
    const deviceId = ensureHubDeviceId();
    const row = db
      .prepare(
        `SELECT id, uuid, device_id, name, platform, status, isPrimary, updated_at
         FROM roster_devices
         WHERE (uuid = ? OR device_id = ?) AND is_deleted = 0
         LIMIT 1`
      )
      .get(deviceId, deviceId) as any;
    if (!row) return { found: false, deviceId, status: null, name: null };
    return { found: true, deviceId, status: row.status, name: row.name };
  });

  // ---- Roles & people ----
  ipcMain.handle('business:roles', () => {
    return {
      builtin: SURFACED_BUILTIN_ROLES.map((key) => {
        const r = getBuiltinRole(key);
        return { key: r!.key, name: r!.name, description: r!.description, isSystem: true };
      }),
      order: SURFACED_BUILTIN_ROLES,
      custom: db.prepare('SELECT * FROM business_roles WHERE businessId = ? AND isSystem = 0 AND is_deleted = 0 ORDER BY created_at').all(bizId()),
    };
  });

  ipcMain.handle('business:can', (_e, key: string) => {
    const r = can(config.buildPermissionContext(), key);
    return { allowed: r };
  });

  ipcMain.handle('business:list-people', () => {
    const rows = db.prepare('SELECT * FROM employees WHERE businessId = ? AND isActive = 1 ORDER BY createdAt').all(bizId()) as any[];
    return rows.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName || ''}`.trim(),
      phone: e.phone,
      email: e.email,
      roleKey: e.role_key || 'cashier',
      isOwner: (e.role_key || 'cashier') === 'owner',
      permissions: e.permissions_json ? JSON.parse(e.permissions_json) : undefined,
    }));
  });

  ipcMain.handle('business:set-person-role', (_e, employeeId: number, roleKey: BuiltinRoleKey | string) => {
    if (!canManageTeam()) throw new Error('You do not have permission to manage team roles');
    let name: string | undefined = getBuiltinRole(roleKey as BuiltinRoleKey)?.name;
    if (!name) {
      const custom = db
        .prepare('SELECT name FROM business_roles WHERE id = ? AND businessId = ? AND isSystem = 0 AND is_deleted = 0')
        .get(roleKey, bizId()) as any;
      if (!custom) throw new Error(`Unknown role: ${roleKey}`);
      name = custom.name;
    }
    db.prepare('UPDATE employees SET role_key = ? WHERE id = ? AND businessId = ?').run(roleKey, employeeId, bizId());
    // Multi-owner: granting/revoking the owner role keeps the projected `users`
    // membership in lockstep (is_owner flag + full owner permission set).
    const projected = db.prepare('SELECT id, isOwner FROM users WHERE sourceType = ? AND sourceId = ?').get('employee', employeeId) as any;
    if (projected && (roleKey === 'owner') !== !!projected.isOwner) {
      db.prepare('UPDATE users SET isOwner = ?, role = ?, roleName = ?, permissions = ?, updated_at = ? WHERE id = ?')
        .run(roleKey === 'owner' ? 1 : 0, roleKey, name ?? 'Owner', roleKey === 'owner' ? JSON.stringify(DEFAULT_ROLE_SETS.owner) : (projected.permissions ?? '{}'), new Date().toISOString(), projected.id);
    }
    config.audit('role.changed', 'employee', employeeId, `Role -> ${name}`);
    return { ok: true };
  });

  ipcMain.handle('business:set-person-active', (_e, employeeId: number, isActive: boolean) => {
    if (!canManageTeam()) throw new Error('You do not have permission to manage team members');
    // Last-owner guard: never lock the final active owner out of the business.
    if (!isActive) {
      const projected = db.prepare('SELECT id FROM users WHERE sourceType = ? AND sourceId = ? AND isOwner = 1 AND isActive = 1 AND is_deleted = 0').get('employee', employeeId) as any;
      if (projected) {
        const remaining = (db.prepare('SELECT COUNT(*) AS c FROM users WHERE isOwner = 1 AND isActive = 1 AND is_deleted = 0 AND businessId = ? AND id != ?').get(bizId(), projected.id) as any).c;
        if (remaining === 0) throw new Error('Cannot deactivate the last owner of this business. Promote another owner first.');
      }
    }
    db.prepare('UPDATE employees SET isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?')
      .run(isActive ? 1 : 0, employeeId, bizId());
    config.audit('employee.changed', 'employee', employeeId, `Set active = ${isActive}`);
    return { ok: true };
  });

  ipcMain.handle('business:get-user', () => {
    // Return the real business-level role (owner/manager/cashier/...) that the
    // current desktop user holds, not a hardcoded platform admin string. Desktop
    // and Mobile are equal first-class platforms: a desktop user is a member of
    // the business with a role, exactly like a mobile user.
    const role = config.getUserRole() || 'cashier';
    return { role, isOwner: config.isOwnerOrSuper() || role === 'owner' };
  });
}
