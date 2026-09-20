import { randomBytes } from 'crypto';
import db from '../database';
import { logger } from '../logger';

/**
 * QR user invitations (desktop side).
 *
 * Owner flow: Teams → Add User → a unique short-lived code is generated and
 * shown as a QR. Joiner flow: scan in Shega mobile, enter name, submit — a
 * *pending* request lands here. The owner reviews it and approves with a
 * role; only then does the user row materialize (pending → active). The
 * same store serves LAN (WS) and cloud-relayed requests.
 */

const CODE_TTL_MS = 24 * 60 * 60 * 1000; // invitations live for a day

export interface UserInvite {
  id: string;
  businessId: number;
  code: string;
  suggestedRole: string;
  status: 'open' | 'pending' | 'approved' | 'rejected' | 'expired';
  /** joiner-supplied name once claimed */
  joinerName: string | null;
  joinerDeviceId: string | null;
  createdBy: number | null;
  createdAt: string;
  expiresAt: string;
  decidedAt: string | null;
  /** owner-assigned identity (set at approve time, or pre-assigned by radar) */
  assignedName: string | null;
  assignedAvatar: string | null;
  assignedPermissions: Record<string, unknown> | null;
}

function ensureTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_invites (
      id TEXT PRIMARY KEY,
      business_id INTEGER NOT NULL,
      code TEXT UNIQUE NOT NULL,
      suggested_role TEXT DEFAULT 'cashier',
      status TEXT DEFAULT 'open',
      joiner_name TEXT,
      joiner_device_id TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT,
      decided_at TEXT
    );
  `);
  // Owner-assigned identity, added after the first release of this table.
  for (const col of ['assigned_name TEXT', 'assigned_avatar TEXT', 'assigned_permissions TEXT']) {
    try { db.exec(`ALTER TABLE user_invites ADD COLUMN ${col}`); } catch { /* already present */ }
  }
}

function rowToInvite(row: any): UserInvite {
  return {
    id: row.id,
    businessId: row.business_id,
    code: row.code,
    suggestedRole: row.suggested_role || 'cashier',
    status: row.status,
    joinerName: row.joiner_name,
    joinerDeviceId: row.joiner_device_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    decidedAt: row.decided_at,
    assignedName: row.assigned_name ?? null,
    assignedAvatar: row.assigned_avatar ?? null,
    assignedPermissions: row.assigned_permissions ? safeJson(row.assigned_permissions) : null,
  };
}

function safeJson(raw: string): Record<string, unknown> | null {
  try { return JSON.parse(raw); } catch { return null; }
}

function expireStale(): void {
  db.prepare("UPDATE user_invites SET status = 'expired' WHERE status IN ('open','pending') AND expires_at IS NOT NULL AND expires_at < datetime('now')").run();
}

export function createUserInvite(businessId: number, opts: { suggestedRole?: string; createdBy?: number } = {}): UserInvite {
  ensureTable();
  expireStale();
  const id = randomBytes(12).toString('hex');
  const code = `SHG-${randomBytes(3).toString('hex').toUpperCase()}`;
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
  db.prepare(
    `INSERT INTO user_invites (id, business_id, code, suggested_role, status, created_by, expires_at)
     VALUES (?, ?, ?, ?, 'open', ?, ?)`
  ).run(id, businessId, code, opts.suggestedRole || 'cashier', opts.createdBy ?? null, expiresAt);
  logger.info(`[invites] created ${code} for business ${businessId}`);
  return rowToInvite(db.prepare('SELECT * FROM user_invites WHERE id = ?').get(id));
}

export function listUserInvites(businessId: number): UserInvite[] {
  ensureTable();
  expireStale();
  return (db.prepare('SELECT * FROM user_invites WHERE business_id = ? ORDER BY created_at DESC LIMIT 100').all(businessId) as any[]).map(rowToInvite);
}

/** Joiner claims an open code and supplies their name → status becomes pending. */
export function claimUserInvite(code: string, joinerName: string, joinerDeviceId: string): UserInvite | null {
  ensureTable();
  expireStale();
  const row = db.prepare("SELECT * FROM user_invites WHERE code = ? AND status = 'open'").get(code) as any;
  if (!row) return null;
  db.prepare("UPDATE user_invites SET status = 'pending', joiner_name = ?, joiner_device_id = ? WHERE id = ?")
    .run(joinerName, joinerDeviceId, row.id);
  return rowToInvite(db.prepare('SELECT * FROM user_invites WHERE id = ?').get(row.id));
}

/** Owner decision: approve (with role + optional permissions) or reject. */
export function decideUserInvite(
  inviteId: string,
  decision: 'approved' | 'rejected',
  opts: {
    role?: string;
    decidedBy?: number;
    /** owner-assigned identity, applied when the member is provisioned */
    name?: string;
    avatar?: string | null;
    permissions?: Record<string, unknown>;
  } = {},
): UserInvite | null {
  ensureTable();
  const row = db.prepare('SELECT * FROM user_invites WHERE id = ?').get(inviteId) as any;
  if (!row) return null;
  if (decision === 'approved') {
    // Materialize the user inside the target business, inactive until they
    // set up their PIN on first login — matching the desktop employee flow.
    try {
      const name = (opts.name || row.assigned_name || row.joiner_name || 'New user') as string;
      const avatar = opts.avatar ?? row.assigned_avatar ?? null;
      const permissions = opts.permissions
        ?? (row.assigned_permissions ? safeJson(row.assigned_permissions) : null)
        ?? undefined;
      const [first] = String(name).split(' ');
      const username = `${String(first || 'user').toLowerCase()}.${randomBytes(2).toString('hex')}`;
      const role = opts.role || row.suggested_role || 'cashier';
      const permsJson = permissions ? JSON.stringify(permissions) : '[]';
      const hasAvatar = !!avatar;
      try {
        db.prepare(
          `INSERT INTO admins (name, username, pin, role, permissions, businessId, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(name, username, '', role, permsJson, row.business_id, avatar);
      } catch {
        // Older schemas may not have an avatar column on admins.
        db.prepare(
          `INSERT INTO admins (name, username, pin, role, permissions, businessId) VALUES (?, ?, ?, ?, ?, ?)`
        ).run(name, username, '', role, permsJson, row.business_id);
      }
      if (hasAvatar) logger.info('[invites] member created with assigned profile picture');
    } catch (e) {
      logger.warn('[invites] failed to materialize user', e);
    }
  }
  db.prepare('UPDATE user_invites SET status = ?, decided_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(decision, inviteId);

  if (decision === 'approved') {
    // "Approve & Sync": kick an immediate LAN/P2P cycle so the new device
    // starts pulling its initial SQLite snapshot right away instead of
    // waiting for the next periodic tick.
    import('../peer-sync').then((ps) => ps.performLanSync()).catch(() => {});
  }

  return rowToInvite(db.prepare('SELECT * FROM user_invites WHERE id = ?').get(inviteId));
}

/**
 * Owner-side pre-assignment: the radar lets the owner configure a discovered
 * device *before* the joiner claims the invite. The identity/role/permissions
 * are stored here and applied automatically when the request is approved.
 */
export function assignUserInviteIdentity(
  inviteId: string,
  identity: { name?: string; avatar?: string | null; role?: string; permissions?: Record<string, unknown> },
): boolean {
  ensureTable();
  const row = db.prepare('SELECT * FROM user_invites WHERE id = ?').get(inviteId) as any;
  if (!row) return false;
  if (identity.name !== undefined) db.prepare('UPDATE user_invites SET assigned_name = ? WHERE id = ?').run(identity.name, inviteId);
  if (identity.role !== undefined) db.prepare('UPDATE user_invites SET suggested_role = ? WHERE id = ?').run(identity.role, inviteId);
  if (identity.avatar !== undefined) db.prepare('UPDATE user_invites SET assigned_avatar = ? WHERE id = ?').run(identity.avatar, inviteId);
  if (identity.permissions !== undefined) db.prepare('UPDATE user_invites SET assigned_permissions = ? WHERE id = ?').run(JSON.stringify(identity.permissions), inviteId);
  return true;
}

/** Joiner-side poll: what happened to my request? */
export function getUserInviteStatus(code: string): UserInvite | null {
  ensureTable();
  expireStale();
  const row = db.prepare('SELECT * FROM user_invites WHERE code = ? ORDER BY created_at DESC LIMIT 1').get(code) as any;
  return row ? rowToInvite(row) : null;
}
