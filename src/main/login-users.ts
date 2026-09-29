/**
 * Builds the list behind the "Who's using Shega?" profile picker.
 *
 * Extracted from ipc-handlers so it can be tested against a real SQLite schema.
 * That matters: the previous inline version selected `admins.roleName`, a column
 * that has never existed on that table. The query threw, the surrounding catch
 * swallowed it, and the owner silently disappeared from the picker — which made
 * the UI fall back to asking for a username and PIN.
 *
 * The lesson encoded here is that every column must match the real schema, and a
 * failed lookup must be reported rather than silently dropped, because a partial
 * result is indistinguishable from "no profiles" and quietly changes the UI.
 */

export type LoginUser = {
  key: string;
  source: 'admin' | 'employee' | 'roster';
  id: number;
  name: string;
  username: string | null;
  role: string;
  roleName: string;
  avatar: string | null;
  isOwner: boolean;
};

/** Minimal surface of the better-sqlite3 handle this module needs. */
export interface ProfileDb {
  prepare(sql: string): { all(): any[] };
}

export function buildLoginUsers(db: ProfileDb, onError?: (what: string, err: unknown) => void): LoginUser[] {
  const seen = new Set<string>();
  const out: LoginUser[] = [];

  // One person can exist as an owner AND as a synced roster row. Username (or
  // failing that, name) is the identity, so the first push wins and the mirror
  // is dropped — otherwise the same person picks themselves twice.
  const push = (u: LoginUser) => {
    const dupKey = (u.username || u.name || '').toLowerCase();
    if (!dupKey || seen.has(dupKey)) return;
    seen.add(dupKey);
    out.push(u);
  };

  const fail = (what: string, err: unknown) => {
    if (onError) onError(what, err);
    else console.error(`[get-login-users] ${what} lookup failed:`, err);
  };

  try {
    // `admins` has NO `roleName` column — only `users` does. Derive it from `role`.
    const admins = db
      .prepare('SELECT id, name, username, role, avatar, isActive FROM admins WHERE isActive = 1')
      .all();
    for (const a of admins) {
      const isOwner = a.role === 'super_admin' || a.role === 'admin';
      push({
        key: `admin:${a.id}`,
        source: 'admin',
        id: a.id,
        name: a.name || a.username || 'User',
        username: a.username ?? null,
        role: isOwner ? 'owner' : a.role || 'staff',
        roleName: isOwner ? 'Owner' : a.role || 'Staff',
        avatar: a.avatar ?? null,
        isOwner,
      });
    }
  } catch (e) {
    fail('admins', e);
  }

  try {
    const emps = db
      .prepare(
        `SELECT e.id, e.firstName, e.lastName, e.avatar, ea.username, ea.isActive,
                e.role_key, r.name as roleName
         FROM employees e
         LEFT JOIN employee_accounts ea ON ea.employeeId = e.id
         LEFT JOIN employee_roles r ON r.id = e.roleId
         WHERE ea.isActive = 1`,
      )
      .all();
    for (const e of emps) {
      const name = `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.username || `Employee ${e.id}`;
      push({
        key: `employee:${e.id}`,
        source: 'employee',
        id: e.id,
        name,
        username: e.username ?? null,
        role: e.role_key || 'cashier',
        roleName: e.roleName || 'Cashier',
        avatar: e.avatar ?? null,
        isOwner: e.role_key === 'owner',
      });
    }
  } catch (e) {
    fail('employee', e);
  }

  try {
    // A roster row with no PIN hash is an invite placeholder, not a login, so it
    // must never be offered in the picker.
    const roster = db
      .prepare(
        `SELECT id, name, username, email, role, roleName, avatar, isOwner FROM users
         WHERE is_deleted = 0 AND isActive = 1 AND (pinHash IS NOT NULL AND pinHash != '')`,
      )
      .all();
    for (const u of roster) {
      push({
        key: `roster:${u.id}`,
        source: 'roster',
        id: u.id,
        name: u.name || u.username || 'User',
        username: u.username ?? u.email ?? null,
        role: u.role || 'cashier',
        roleName: u.roleName || u.role || 'Cashier',
        avatar: u.avatar ?? null,
        isOwner: !!u.isOwner || u.role === 'owner',
      });
    }
  } catch (e) {
    fail('roster', e);
  }

  return out;
}
