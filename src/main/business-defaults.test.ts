import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import {
  ensureBusinessDefaults,
  backfillLegacyCustomerNames,
  DEFAULT_ROLES,
} from './business-defaults';

/**
 * Regression tests for the clean-install foreign key crash.
 *
 * The bug: `initDB` seeded `warehouses` / `employee_roles` / `customers` against
 * a hardcoded `businessId = 1`. On a clean install the first business is only
 * created at owner signup, so those inserts hit the `businesses` foreign key and
 * SQLite raised "FOREIGN KEY constraint failed", aborting initDB. Every startup
 * on a fresh database died before the app could show anything.
 *
 * These run against a real SQLite database with the foreign keys actually
 * enabled, so a reintroduced guess-the-id bug fails here rather than silently
 * working because a mock swallowed the error. `node:sqlite` is used rather than
 * better-sqlite3 because the latter is built against Electron's ABI and cannot
 * be loaded by the plain Node running vitest.
 */
const SCHEMA = `
  CREATE TABLE businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    businessName TEXT,
    isDefault INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0
  );
  CREATE TABLE warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    businessId INTEGER NOT NULL,
    name TEXT,
    location TEXT,
    managerName TEXT,
    FOREIGN KEY (businessId) REFERENCES businesses(id) ON DELETE CASCADE
  );
  CREATE TABLE employee_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    businessId INTEGER NOT NULL,
    name TEXT,
    description TEXT,
    permissions TEXT,
    isSystem INTEGER DEFAULT 0,
    FOREIGN KEY (businessId) REFERENCES businesses(id) ON DELETE CASCADE
  );
  CREATE TABLE sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    businessId INTEGER,
    customerName TEXT,
    customerPhone TEXT
  );
  CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    businessId INTEGER NOT NULL,
    customerName TEXT,
    phone TEXT,
    FOREIGN KEY (businessId) REFERENCES businesses(id) ON DELETE CASCADE
  );
`;

let db: DatabaseSync;

const asConn = () => db as unknown as Parameters<typeof ensureBusinessDefaults>[1];

const count = (table: string, where = ''): number =>
  (db.prepare(`SELECT COUNT(*) AS c FROM ${table} ${where}`).get() as { c: number }).c;

beforeEach(() => {
  db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(SCHEMA);
});

afterEach(() => db.close());

describe('ensureBusinessDefaults', () => {
  it('seeds one warehouse and the system roles for a real business', () => {
    db.prepare('INSERT INTO businesses (businessName, isDefault) VALUES (?, 1)').run('Habesha Mart');
    const bizId = 1;

    ensureBusinessDefaults(bizId, asConn());

    expect(count('warehouses', 'WHERE businessId = 1')).toBe(1);
    expect(count('employee_roles', 'WHERE businessId = 1')).toBe(DEFAULT_ROLES.length);
  });

  it('rejects a business id that does not exist, proving the guard is load-bearing', () => {
    // No business rows at all — the clean-install state that used to crash.
    expect(count('businesses')).toBe(0);
    expect(() => ensureBusinessDefaults(1, asConn())).toThrow(/FOREIGN KEY/i);
  });

  it('is idempotent', () => {
    db.prepare('INSERT INTO businesses (businessName, isDefault) VALUES (?, 1)').run('Habesha Mart');
    ensureBusinessDefaults(1, asConn());
    ensureBusinessDefaults(1, asConn());
    ensureBusinessDefaults(1, asConn());

    expect(count('warehouses', 'WHERE businessId = 1')).toBe(1);
    expect(count('employee_roles', 'WHERE businessId = 1')).toBe(DEFAULT_ROLES.length);
  });

  it('scopes seeds per business so a second business is not left without roles', () => {
    db.prepare('INSERT INTO businesses (businessName, isDefault) VALUES (?, 1)').run('First');
    db.prepare('INSERT INTO businesses (businessName, isDefault) VALUES (?, 0)').run('Second');
    const second = (db.prepare('SELECT id FROM businesses WHERE businessName = ?').get('Second') as { id: number }).id;

    ensureBusinessDefaults(1, asConn());
    ensureBusinessDefaults(second, asConn());

    expect(count('warehouses', 'WHERE businessId = 1')).toBe(1);
    expect(count('warehouses', `WHERE businessId = ${second}`)).toBe(1);
    expect(count('employee_roles', `WHERE businessId = ${second}`)).toBe(DEFAULT_ROLES.length);
  });
});

describe('backfillLegacyCustomerNames', () => {
  it('imports sales customers once and does not duplicate on a second pass', () => {
    db.prepare('INSERT INTO businesses (businessName, isDefault) VALUES (?, 1)').run('Habesha Mart');
    db.prepare('INSERT INTO sales (businessId, customerName, customerPhone) VALUES (1, ?, ?)').run('Abebe', '0800');
    db.prepare('INSERT INTO sales (businessId, customerName, customerPhone) VALUES (1, ?, ?)').run('Abebe', '0800');
    db.prepare('INSERT INTO sales (businessId, customerName, customerPhone) VALUES (1, ?, ?)').run('Kebede', '0900');

    backfillLegacyCustomerNames(1, asConn());
    backfillLegacyCustomerNames(1, asConn());

    // "Abebe" appears twice in sales but must land once in customers.
    expect(count('customers')).toBe(2);
  });

  it('ignores blank customer names', () => {
    db.prepare('INSERT INTO businesses (businessName, isDefault) VALUES (?, 1)').run('Habesha Mart');
    db.prepare('INSERT INTO sales (businessId, customerName, customerPhone) VALUES (1, ?, ?)').run('', '0800');
    db.prepare('INSERT INTO sales (businessId, customerName, customerPhone) VALUES (1, NULL, NULL)').run();

    backfillLegacyCustomerNames(1, asConn());

    expect(count('customers')).toBe(0);
  });
});
