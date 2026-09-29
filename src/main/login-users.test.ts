import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { buildLoginUsers, type ProfileDb } from './login-users';

/**
 * Regression tests for the "Who's using Shega?" profile picker.
 *
 * The bug: the admin lookup selected `admins.roleName`, a column that has never
 * existed on that table. SQLite threw "no such column: roleName", the enclosing
 * catch swallowed it, and the owner was dropped from the picker. An empty list
 * is what makes the UI fall back to asking for a username + PIN, so a schema
 * drift in one query turned into a completely different login screen.
 *
 * These tests run the real queries against a real SQLite database whose schema
 * matches the shipped one, so a column that does not exist genuinely fails
 * instead of being mocked away. `node:sqlite` is used rather than
 * better-sqlite3 because the latter is built against Electron's ABI.
 */
const SCHEMA = `
  CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    businessId INTEGER,
    name TEXT,
    username TEXT,
    pin TEXT,
    role TEXT,
    permissions TEXT,
    isActive INTEGER DEFAULT 1,
    avatar TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    failedLoginAttempts INTEGER DEFAULT 0,
    lockedUntil TEXT,
    forcePasswordChange INTEGER DEFAULT 0,
    lastPasswordChange TEXT,
    lastLogin TEXT,
    pinLength INTEGER
  );
  CREATE TABLE employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeCode TEXT,
    firstName TEXT,
    lastName TEXT,
    roleId INTEGER,
    avatar TEXT,
    isActive INTEGER DEFAULT 1,
    role_key TEXT
  );
  CREATE TABLE employee_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  );
  CREATE TABLE employee_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId INTEGER UNIQUE,
    username TEXT,
    pin TEXT,
    pinLength INTEGER,
    isActive INTEGER DEFAULT 1
  );
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    username TEXT,
    role TEXT,
    roleName TEXT,
    permissions TEXT,
    isActive INTEGER DEFAULT 1,
    isOwner INTEGER DEFAULT 0,
    pinHash TEXT,
    pinSalt TEXT,
    avatar TEXT,
    is_deleted INTEGER DEFAULT 0
  );
`;

let db: DatabaseSync;

/** `??` would swallow an explicit null, which several cases rely on. */
const val = <T>(o: Record<string, unknown>, key: string, fallback: T): T =>
  (key in o ? (o[key] as T) : fallback);

function insertAdmin(o: Record<string, unknown> = {}) {
  db.prepare(
    `INSERT INTO admins (name, username, role, isActive, pin)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    val(o, 'name', 'yenenake kebede'),
    val(o, 'username', 'yene@gmail.com'),
    val(o, 'role', 'super_admin'),
    val(o, 'isActive', 1),
    val(o, 'pin', 'hash'),
  );
}

function insertRoster(o: Record<string, unknown> = {}) {
  db.prepare(
    `INSERT INTO users (name, username, email, role, roleName, isActive, pinHash, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    val(o, 'name', 'yenenake kebede'),
    val(o, 'username', 'yene@gmail.com'),
    val(o, 'email', null),
    val(o, 'role', 'cashier'),
    val(o, 'roleName', null),
    val(o, 'isActive', 1),
    val(o, 'pinHash', 'hash'),
    val(o, 'is_deleted', 0),
  );
}

/** better-sqlite3's prepare().all() vs node:sqlite's, behind one interface. */
const handle: ProfileDb = {
  prepare: (sql: string) => ({ all: () => db.prepare(sql).all() as any[] }),
};

beforeEach(() => {
  db = new DatabaseSync(':memory:');
  db.exec(SCHEMA);
});

afterEach(() => {
  db.close();
});

describe('buildLoginUsers — the owner must appear in the picker', () => {
  it('includes an active admin', () => {
    insertAdmin();
    const list = buildLoginUsers(handle);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ key: 'admin:1', source: 'admin', id: 1 });
  });

  it('labels a super_admin as the Owner', () => {
    insertAdmin({ role: 'super_admin' });
    const [u] = buildLoginUsers(handle);
    expect(u.isOwner).toBe(true);
    expect(u.roleName).toBe('Owner');
  });

  it('does not fail on the admins schema (roleName is not a column there)', () => {
    // The regression itself: this query used to throw and the admin vanished.
    insertAdmin();
    expect(() => db.prepare('SELECT id, name, username, role, avatar, isActive FROM admins').all()).not.toThrow();
    expect(buildLoginUsers(handle).length).toBe(1);
  });

  it('reports the failure instead of returning a silently short list', () => {
    // Guards the second half of the bug: the error must be surfaced.
    db.exec('DROP TABLE admins');
    const errors: string[] = [];
    expect(buildLoginUsers(handle, (what) => errors.push(what))).toEqual([]);
    expect(errors).toContain('admins');
  });

  it('skips a deactivated admin', () => {
    insertAdmin({ isActive: 0 });
    expect(buildLoginUsers(handle)).toEqual([]);
  });

  it('falls back to the username when the admin has no name', () => {
    insertAdmin({ name: null });
    expect(buildLoginUsers(handle)[0].name).toBe('yene@gmail.com');
  });
});

describe('buildLoginUsers — roster rows', () => {
  it('includes a roster user that has a PIN', () => {
    insertRoster({ username: 'cashier', name: 'Meron' });
    const list = buildLoginUsers(handle);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ key: 'roster:1', source: 'roster', id: 1, name: 'Meron' });
  });

  it('never offers an invite placeholder that has no PIN', () => {
    insertRoster({ username: 'invited', name: 'Invited', pinHash: null });
    expect(buildLoginUsers(handle)).toEqual([]);
  });

  it('never offers a soft-deleted or deactivated row', () => {
    insertRoster({ username: 'a', is_deleted: 1 });
    insertRoster({ username: 'b', isActive: 0 });
    expect(buildLoginUsers(handle)).toEqual([]);
  });
});

describe('buildLoginUsers — one entry per person', () => {
  it('dedupes an owner who also exists as a synced roster row', () => {
    // This is the real install's shape: the same human in admins and users.
    insertAdmin();
    insertRoster();
    const list = buildLoginUsers(handle);
    expect(list).toHaveLength(1);
    expect(list[0].source).toBe('admin');
  });

  it('keeps genuinely different people', () => {
    insertAdmin({ username: 'owner@x.com', name: 'Owner' });
    insertRoster({ username: 'staff@x.com', name: 'Staff' });
    expect(buildLoginUsers(handle)).toHaveLength(2);
  });

  it('dedupes on name when neither side has a username', () => {
    insertAdmin({ username: null, name: 'Meron' });
    insertRoster({ username: null, name: 'meron' });
    // Name is the fallback identity, and it is compared case-insensitively.
    expect(buildLoginUsers(handle)).toHaveLength(1);
  });

  it('does NOT merge an email-identified admin into a name-only roster row', () => {
    // The admin's dedup key is its username, so there is nothing to match a
    // name-only roster row against. Merging on a guess would silently hide a
    // real account, so both are offered.
    insertAdmin({ username: 'owner@x.com', name: 'Meron' });
    insertRoster({ username: null, name: 'meron', email: 'm@x.com' });
    expect(buildLoginUsers(handle)).toHaveLength(2);
  });
});

describe('buildLoginUsers — employees', () => {
  it('includes an employee that has an active account', () => {
    db.prepare(`INSERT INTO employees (firstName, lastName, roleId, isActive, role_key) VALUES (?, ?, ?, 1, ?)`)
      .run('Abebe', 'Tesfaye', null, 'cashier');
    db.prepare(`INSERT INTO employee_roles (id, name) VALUES (1, 'Cashier')`).run();
    db.prepare(`UPDATE employees SET roleId = 1 WHERE id = 1`).run();
    db.prepare(`INSERT INTO employee_accounts (employeeId, username, pin, isActive) VALUES (1, ?, 'hash', 1)`)
      .run('abebe');

    const list = buildLoginUsers(handle);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ source: 'employee', id: 1, name: 'Abebe Tesfaye' });
  });

  it('ignores an employee with no account', () => {
    db.prepare(`INSERT INTO employees (firstName, lastName, isActive, role_key) VALUES ('No', 'Acct', 1, 'cashier')`).run();
    expect(buildLoginUsers(handle)).toEqual([]);
  });
});
