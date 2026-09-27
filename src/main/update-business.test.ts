import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

/**
 * Regression tests for the `update-business` IPC handler.
 *
 * The bug: the handler used to bind every column unconditionally, so a partial
 * payload from BusinessSetup (which sends only businessName/address) wrote
 * `undefined` into `storeName` — a NOT NULL column — and SQLite rejected the
 * whole statement with SQLITE_CONSTRAINT_NOTNULL. The same statement also
 * blanked `currency` to NULL, wiping the 'ETB' default set at creation.
 *
 * These tests replicate the handler's SQL-building logic against a real SQLite
 * database so the constraint is genuinely enforced, not mocked away.
 * `node:sqlite` is used rather than better-sqlite3 because the latter is a
 * native module built against Electron's ABI and cannot load under vitest.
 */

const SCHEMA = `
  CREATE TABLE businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    businessName TEXT NOT NULL,
    storeName TEXT NOT NULL,
    logo TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    currency TEXT DEFAULT 'ETB',
    isDefault INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;

/** Mirror of the fixed handler in src/main/ipc-handlers.ts. */
function updateBusiness(db: DatabaseSync, id: number, biz: any) {
  const businessName = biz?.businessName?.trim();
  if (!businessName) throw new Error('Business name is required');

  const existing = db.prepare('SELECT storeName FROM businesses WHERE id = ?').get(id) as { storeName: string } | undefined;
  if (!existing) throw new Error('Business not found');

  const sets: string[] = [];
  const values: SQLInputValue[] = [];
  const put = (column: string, value: SQLInputValue) => {
    sets.push(`${column} = ?`);
    values.push(value);
  };

  put('businessName', businessName);
  put('storeName', biz?.storeName?.trim() || existing.storeName || businessName);
  if (biz && 'logo' in biz) put('logo', biz.logo || null);
  if (biz && 'address' in biz) put('address', biz.address || null);
  if (biz && 'phone' in biz) put('phone', biz.phone || null);
  if (biz && 'email' in biz) put('email', biz.email || null);
  if (biz?.currency) put('currency', biz.currency);

  values.push(id);
  return db.prepare(`UPDATE businesses SET ${sets.join(', ')} WHERE id = ?`).run(...values);
}

/** The old handler, kept to prove the test actually catches the bug. */
function updateBusinessLegacy(db: DatabaseSync, id: number, biz: any) {
  if (!biz.businessName?.trim()) throw new Error('Business name is required');
  const stmt = db.prepare(
    'UPDATE businesses SET businessName = ?, storeName = ?, logo = ?, address = ?, phone = ?, email = ?, currency = ? WHERE id = ?',
  );
  return stmt.run(biz.businessName, biz.storeName, biz.logo, biz.address, biz.phone, biz.email, biz.currency, id);
}

describe("update-business partial payloads", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec(SCHEMA);
    db.prepare(
      'INSERT INTO businesses (businessName, storeName, address, currency) VALUES (?, ?, ?, ?)',
    ).run('Habesha Mart', 'Habesha Mart', 'Addis Ababa', 'ETB');
  });

  afterEach(() => db.close());

  it('accepts the partial payload BusinessSetup sends (no storeName)', () => {
    // This exact object shape is what BusinessSetup.tsx sends.
    expect(() =>
      updateBusiness(db, 1, {
        businessName: 'Habesha Mart',
        address: 'Bole',
        businessType: 'retail',
        country: 'Ethiopia',
        city: 'Addis Ababa',
      }),
    ).not.toThrow();
  });

  it('leaves the stored storeName intact when none is supplied', () => {
    updateBusiness(db, 1, { businessName: 'Habesha Mart', address: 'Bole' });
    const row = db.prepare('SELECT * FROM businesses WHERE id = 1').get() as any;
    expect(row.storeName).toBe('Habesha Mart');
    expect(row.address).toBe('Bole');
  });

  it('does not blank out currency when it is not supplied', () => {
    updateBusiness(db, 1, { businessName: 'Habesha Mart', address: 'Bole' });
    const row = db.prepare('SELECT currency FROM businesses WHERE id = 1').get() as any;
    expect(row.currency).toBe('ETB');
  });

  it('still applies a full Settings form payload', () => {
    updateBusiness(db, 1, {
      businessName: 'Habesha Mart HQ',
      storeName: 'Main Store',
      logo: 'data:image/png;base64,AAA',
      address: 'Merke',
      phone: '0911223344',
      email: 'hi@example.com',
      currency: 'USD',
    });
    const row = db.prepare('SELECT * FROM businesses WHERE id = 1').get() as any;
    expect(row.businessName).toBe('Habesha Mart HQ');
    expect(row.storeName).toBe('Main Store');
    expect(row.logo).toBe('data:image/png;base64,AAA');
    expect(row.address).toBe('Merke');
    expect(row.phone).toBe('0911223344');
    expect(row.email).toBe('hi@example.com');
    expect(row.currency).toBe('USD');
  });

  it('lets the owner clear an optional field', () => {
    updateBusiness(db, 1, { businessName: 'Habesha Mart', logo: '', phone: '' });
    const row = db.prepare('SELECT logo, phone FROM businesses WHERE id = 1').get() as any;
    expect(row.logo).toBeNull();
    expect(row.phone).toBeNull();
  });

  it('keeps the stored storeName when the caller sends only whitespace', () => {
    updateBusiness(db, 1, { businessName: 'Bole Branch', storeName: '   ' });
    const row = db.prepare('SELECT storeName FROM businesses WHERE id = 1').get() as any;
    expect(row.storeName).toBe('Habesha Mart');
  });

  it('falls back to the business name when there is no stored storeName either', () => {
    db.prepare('UPDATE businesses SET storeName = ? WHERE id = 1').run('');
    updateBusiness(db, 1, { businessName: 'Bole Branch', storeName: '' });
    const row = db.prepare('SELECT storeName FROM businesses WHERE id = 1').get() as any;
    expect(row.storeName).toBe('Bole Branch');
  });

  it('still requires a business name', () => {
    expect(() => updateBusiness(db, 1, { address: 'Bole' })).toThrow('Business name is required');
    expect(() => updateBusiness(db, 1, { businessName: '  ' })).toThrow('Business name is required');
  });

  it('rejects an unknown business id', () => {
    expect(() => updateBusiness(db, 999, { businessName: 'Ghost' })).toThrow('Business not found');
  });

  it('the old handler really did throw on this payload (guards the test)', () => {
    // node:sqlite reports the bind failure rather than a NOT NULL message;
    // either way the statement must not succeed.
    expect(() => updateBusinessLegacy(db, 1, { businessName: 'Habesha Mart', address: 'Bole' })).toThrow(
      /NOT NULL|cannot be bound/i,
    );
  });
});
