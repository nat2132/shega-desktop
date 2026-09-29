/**
 * Per-business seed rows, kept free of Electron/DB-singleton imports so they can
 * be unit tested against a throwaway SQLite connection.
 *
 * The bug this module exists to prevent: `initDB` used to seed warehouses and
 * employee roles against a hardcoded `businessId = 1` before any business row
 * existed. On a clean install the first business is only created at owner
 * signup, so the seeds violated the `businesses` foreign key and aborted startup
 * with "FOREIGN KEY constraint failed" — taking the app down on every fresh
 * database, not just the test harness.
 *
 * The rule both callers must respect: only ever call these with an id that has
 * already been INSERTed into `businesses`.
 */

export const DEFAULT_ROLES: { name: string; description: string; permissions: string[] }[] = [
  { name: 'Cashier', description: 'Process sales transactions', permissions: ['dashboard', 'inventory.view', 'sales.create', 'sales.invoices', 'customers.view', 'customers.add'] }
];

/** The subset of better-sqlite3's API these seeds need, so tests can pass node:sqlite. */
export interface SeedConnection {
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown;
  };
}

/**
 * Create the rows every business needs: one warehouse and the system roles.
 *
 * Idempotent per business — each piece is skipped when rows already exist for
 * that business, so calling it twice is safe.
 */
export function ensureBusinessDefaults(businessId: number, conn: SeedConnection): void {
  const warehouse = conn.prepare('SELECT COUNT(*) as count FROM warehouses WHERE businessId = ?').get(businessId) as { count: number };
  if (warehouse.count === 0) {
    conn.prepare('INSERT INTO warehouses (businessId, name, location, managerName) VALUES (?, ?, ?, ?)')
      .run(businessId, 'Main Warehouse', 'Headquarters', 'Operations Manager');
  }

  const roleCount = conn.prepare('SELECT COUNT(*) as count FROM employee_roles WHERE businessId = ?').get(businessId) as { count: number };
  if (roleCount.count === 0) {
    const insertRole = conn.prepare('INSERT INTO employee_roles (businessId, name, description, permissions, isSystem) VALUES (?, ?, ?, ?, 1)');
    for (const role of DEFAULT_ROLES) {
      insertRole.run(businessId, role.name, role.description, JSON.stringify(role.permissions));
    }
  }
}

/**
 * Legacy migration: sales predate the customers table, so customer names typed
 * at the point of sale were never materialised as customer rows. Import the ones
 * still missing, scoped to a single business.
 */
export function backfillLegacyCustomerNames(businessId: number, conn: SeedConnection): void {
  const names = conn.prepare("SELECT DISTINCT customerName, customerPhone FROM sales WHERE customerName IS NOT NULL AND customerName != ''").all() as { customerName: string; customerPhone: string | null }[];
  for (const c of names) {
    const exists = conn.prepare('SELECT id FROM customers WHERE customerName = ? AND businessId = ?').get(c.customerName, businessId);
    if (!exists) {
      conn.prepare('INSERT INTO customers (businessId, customerName, phone) VALUES (?, ?, ?)').run(businessId, c.customerName, c.customerPhone || '');
    }
  }
}
