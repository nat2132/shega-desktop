import { describe, it, expect, vi, beforeEach } from 'vitest';

/** Tiny in-memory stand-in for the better-sqlite3 wrapper. */
type Row = Record<string, any>;

const state = {
  businesses: [] as Row[],
  users: [] as Row[],
  warehouses: [] as Row[],
  locations: [] as Row[],
  registers: [] as Row[],
  nextId: 1,
  reset() {
    this.businesses = [];
    this.users = [];
    this.warehouses = [];
    this.locations = [];
    this.registers = [];
    this.nextId = 1;
  },
};

const runArgs: any[][] = [];
const prepared: string[] = [];

function rowsFor(sql: string, args: any[]): Row[] {
  if (/FROM businesses/.test(sql)) {
    if (/cloud_business_id = \? AND id != \?/.test(sql)) {
      return state.businesses.filter((b) => b.cloud_business_id === args[0] && b.id !== args[1]);
    }
    if (/cloud_business_id = \?/.test(sql)) {
      return state.businesses.filter((b) => b.cloud_business_id === args[0]);
    }
    if (/businessName = \? OR storeName = \?/.test(sql)) {
      return state.businesses.filter((b) => b.businessName === args[0] || b.storeName === args[0]);
    }
    return state.businesses;
  }
  if (/FROM users/.test(sql)) {
    return state.users.filter((u) => u.businessId === args[0] && !u.is_deleted);
  }
  if (/FROM warehouses/.test(sql)) {
    return state.warehouses.filter((w) => w.businessId === args[0]);
  }
  if (/FROM locations/.test(sql)) {
    return state.locations.filter((l) => l.businessId === args[0]);
  }
  return [];
}

function execWrite(sql: string, args: any[]) {
  if (/INSERT INTO businesses/.test(sql)) {
    const id = state.nextId++;
    state.businesses.push({
      id,
      businessName: args[0],
      storeName: args[1],
      currency: args[2],
      isDefault: args[3],
      uuid: args[4],
      cloud_business_id: null,
    });
    return { lastInsertRowid: id };
  }
  if (/UPDATE businesses SET cloud_business_id/.test(sql)) {
    const target = state.businesses.find((b) => b.id === args[1]);
    if (target) target.cloud_business_id = args[0];
    return { changes: target ? 1 : 0 };
  }
  if (/INSERT INTO warehouses/.test(sql)) {
    state.warehouses.push({ businessId: args[0], name: args[1] });
    return { lastInsertRowid: state.nextId++ };
  }
  if (/INSERT INTO locations/.test(sql)) {
    const id = state.nextId++;
    state.locations.push({ id, businessId: args[0], name: args[1] });
    return { lastInsertRowid: id };
  }
  if (/INSERT INTO registers/.test(sql)) {
    state.registers.push({ businessId: args[0], locationId: args[1] });
    return { lastInsertRowid: state.nextId++ };
  }
  if (/INSERT INTO users/.test(sql)) {
    const id = state.nextId++;
    state.users.push({
      id,
      businessId: args[0],
      name: args[1],
      role: args[2],
      roleName: args[3],
      permissions: JSON.parse(args[4] as string),
      isActive: 1,
      isOwner: args[5],
      is_deleted: 0,
    });
    return { lastInsertRowid: id };
  }
  if (/UPDATE users SET role/.test(sql)) {
    const targets = state.users.filter((u) => u.businessId === args[3] && !u.is_deleted && u.isOwner);
    for (const u of targets) {
      u.role = args[0];
      u.roleName = args[1];
      u.permissions = JSON.parse(args[2] as string);
      u.isOwner = args[3] === undefined ? u.isOwner : u.isOwner;
      u.isOwnerFlag = args[3];
    }
    return { changes: targets.length };
  }
  return { changes: 0 };
}

vi.mock('./database', () => ({
  default: {
    prepare: (sql: string) => {
      prepared.push(sql);
      return {
        get: (...args: any[]) => {
          if (/COUNT\(\*\) c/.test(sql)) return { c: rowsFor(sql, args).length };
          return rowsFor(sql, args)[0] ?? null;
        },
        all: (...args: any[]) => rowsFor(sql, args),
        run: (...args: any[]) => {
          runArgs.push([sql, ...args]);
          const isRead = /^\s*SELECT/i.test(sql);
          if (isRead) return { lastInsertRowid: null };
          const result = execWrite(sql, args);
          return { ...result, lastInsertRowid: result.lastInsertRowid ?? null };
        },
      };
    },
    exec: vi.fn(),
  },
}));

beforeEach(() => {
  state.reset();
  runArgs.length = 0;
  prepared.length = 0;
  vi.resetModules();
});

async function loadSeeder() {
  const mod = await import('./subscription-backend');
  return mod.seedBusinessesFromMemberships;
}

const OWNER_AND_STAFF = {
  // `owned` is the serialized USER: its `id` is a user id, never a business id.
  owned: [{ id: 7, business_name: 'Habesha Mart', full_name: 'Selam Bekele' }],
  memberships: [
    { id: 1, business_id: 42, business_name: 'Habesha Mart', role: 'owner', permissions: null },
    { id: 2, business_id: 77, business_name: 'Bole Branch', role: 'cashier', permissions: ['pos:sell', 'pos:refund'] },
  ],
};

describe('seedBusinessesFromMemberships', () => {
  it('adopts an existing local business by name and records the real business id', async () => {
    state.businesses.push({ id: 1, businessName: 'Habesha Mart', storeName: 'Habesha Mart', cloud_business_id: null });
    const seed = await loadSeeder();

    const seeded = seed(OWNER_AND_STAFF);

    expect(seeded).toHaveLength(2);
    expect(seeded[0]).toBe(1);
    const habesha = state.businesses.find((b) => b.id === 1)!;
    expect(habesha.cloud_business_id).toBe(42);
  });

  it('never stores the owned user id as a business id', async () => {
    const seed = await loadSeeder();
    // `id` is the serialized USER's id. It is present in the real API response but
    // deliberately absent from the declared type, so the payload is built as the
    // raw wire shape the main process actually receives.
    const payload = {
      owned: [{ id: 7, business_name: 'Habesha Mart', full_name: 'Selam Bekele' }],
      memberships: [],
    } as unknown as Parameters<typeof seed>[0];
    seed(payload);

    const biz = state.businesses[0];
    expect(biz.businessName).toBe('Habesha Mart');
    expect(biz.cloud_business_id).toBeNull();
  });

  it('is idempotent — a re-run creates no duplicate business or user rows', async () => {
    const seed = await loadSeeder();
    seed(OWNER_AND_STAFF);
    const bizCount = state.businesses.length;
    const userCount = state.users.length;

    seed(OWNER_AND_STAFF);

    expect(state.businesses.length).toBe(bizCount);
    expect(state.users.length).toBe(userCount);
  });

  it('gives an owner wildcard access but keeps a cashier on the backend permissions', async () => {
    const seed = await loadSeeder();
    seed(OWNER_AND_STAFF);

    const owner = state.users.find((u) => state.businesses.find((b) => b.id === u.businessId && b.businessName === 'Habesha Mart'))!;
    const cashier = state.users.find((u) => state.businesses.find((b) => b.id === u.businessId && b.businessName === 'Bole Branch'))!;

    expect(owner.isOwner).toBe(1);
    expect(owner.permissions).toEqual(['*']);
    expect(cashier.isOwner).toBe(0);
    expect(cashier.permissions).toEqual(['pos:sell', 'pos:refund']);
  });

  it('never escalates a member with no permissions to wildcard access', async () => {
    const seed = await loadSeeder();
    seed({ owned: [], memberships: [{ business_id: 88, business_name: 'Merkato Store', role: 'staff' }] });

    const staff = state.users[0];
    expect(staff.role).toBe('staff');
    expect(staff.permissions).toEqual([]);
  });

  it('creates the child warehouse/location/register a POS needs, exactly once', async () => {
    const seed = await loadSeeder();
    seed(OWNER_AND_STAFF);
    const afterFirst = {
      warehouses: state.warehouses.length,
      locations: state.locations.length,
      registers: state.registers.length,
    };
    seed(OWNER_AND_STAFF);

    expect(state.warehouses.length).toBe(afterFirst.warehouses);
    expect(state.locations.length).toBe(afterFirst.locations);
    expect(state.registers.length).toBe(afterFirst.registers);
    expect(afterFirst.registers).toBe(2); // one per business
  });

  it('does not hijack a business id already mapped to another local row', async () => {
    state.businesses.push({ id: 5, businessName: 'Bole Branch', storeName: 'Bole Branch', cloud_business_id: 77 });
    const seed = await loadSeeder();
    seed(OWNER_AND_STAFF);

    const bole = state.businesses.find((b) => b.storeName === 'Bole Branch')!;
    expect(bole.cloud_business_id).toBe(77);
    expect(state.businesses.filter((b) => b.cloud_business_id === 77).length).toBe(1);
  });

  it('returns nothing for an account with no businesses', async () => {
    const seed = await loadSeeder();
    expect(seed({ owned: [], memberships: [] })).toEqual([]);
    expect(state.businesses.length).toBe(0);
  });

  it('parameterises every value it writes', async () => {
    const seed = await loadSeeder();
    seed(OWNER_AND_STAFF);
    for (const [sql] of runArgs) {
      expect(sql).not.toMatch(/\$\{/);
      expect(sql).toMatch(/\?/);
    }
  });
});
