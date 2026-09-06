import crypto from 'crypto';
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { existsSync, mkdirSync, unlinkSync, copyFileSync } from 'fs';
import { BUILTIN_ROLES } from '@shega/shared';

const isDev = !app.isPackaged;
const dbDir = isDev 
  ? path.join(process.cwd(), 'db') 
  : path.join(app.getPath('userData'), 'db');

if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'shega_desktop.db');
const demoDbPath = path.join(dbDir, 'shega_desktop_demo.db');
let db: InstanceType<typeof Database> = new Database(dbPath);
let demoDb: InstanceType<typeof Database> | null = null;
let currentDb: InstanceType<typeof Database> = db;
let isDemoMode = false;

// Apply pragmas to main db
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

// Demo mode state management
export function getDemoMode(): boolean {
  return isDemoMode;
}

export function setDemoMode(enabled: boolean): void {
  isDemoMode = enabled;
  currentDb = enabled ? getDemoDb() : db;
}

export function getCurrentDb(): InstanceType<typeof Database> {
  return currentDb;
}

function getDemoDb(): InstanceType<typeof Database> {
  if (!demoDb) {
    // Create demo DB if it doesn't exist (copy from main or fresh)
    if (!existsSync(demoDbPath)) {
      copyFileSync(dbPath, demoDbPath);
    }
    demoDb = new Database(demoDbPath);
    demoDb.pragma('journal_mode = WAL');
    demoDb.pragma('busy_timeout = 5000');
    demoDb.pragma('foreign_keys = ON');
  }
  return demoDb;
}

export function resetDemoDb(): void {
  if (demoDb) {
    demoDb.close();
    demoDb = null;
  }
  if (existsSync(demoDbPath)) {
    unlinkSync(demoDbPath);
  }
  // Recreate from current main DB as fresh seed
  copyFileSync(dbPath, demoDbPath);
  demoDb = new Database(demoDbPath);
  demoDb.pragma('journal_mode = WAL');
  demoDb.pragma('busy_timeout = 5000');
  demoDb.pragma('foreign_keys = ON');
  if (isDemoMode) {
    currentDb = demoDb;
  }
}

export function getDb(): InstanceType<typeof Database> {
  return currentDb;
}

// Run integrity check on startup, log result
try {
  const integrity = db.pragma('integrity_check', { simple: true }) as string | string[];
  const result = Array.isArray(integrity) ? integrity[0] : integrity;
  if (result !== 'ok') {
    console.error(`[DB] Integrity check FAILED: ${result}`);
    try {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('db_integrity_status', ?)").run(JSON.stringify({
        ok: false,
        message: Array.isArray(integrity) ? integrity.join(', ') : integrity,
        timestamp: new Date().toISOString()
      }));
    } catch {
      // Table may not exist on fresh DB — initDB() will handle it later
    }
  } else {
    try {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('db_integrity_status', ?)").run(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }));
    } catch {
      // Table may not exist on fresh DB — initDB() will handle it later
    }
  }
} catch (_) {
  console.warn('[DB] Integrity check skipped (empty DB?)');
}

// Proxy to dynamically route db calls to currentDb (main or demo)
const dbProxy: any = new Proxy({} as InstanceType<typeof Database>, {
  get(target, prop: string | symbol) {
    return (currentDb as any)[prop];
  },
});

// Export the proxy as default so all existing code works transparently
export default dbProxy;

const ALL_PERMISSIONS = [
  'dashboard', 'inventory.view', 'inventory.add', 'inventory.edit', 'inventory.delete',
  'inventory.adjust', 'inventory.transfer', 'sales.create', 'sales.edit', 'sales.cancel',
  'sales.returns', 'sales.invoices', 'purchases.create', 'purchases.edit', 'purchases.approve',
  'purchases.receive', 'customers.view', 'customers.add', 'customers.edit', 'customers.delete',
  'suppliers.view', 'suppliers.add', 'suppliers.edit', 'suppliers.delete', 'suppliers',
  'warehouses.view', 'warehouses.create', 'warehouses.edit', 'warehouses.transfer',
  'expenses.view', 'expenses.add', 'expenses.edit', 'expenses.delete',
  'reports.view', 'reports.profits',
  'employees.view', 'employees.add', 'employees.edit', 'employees.delete',
  'employees.attendance', 'employees.performance',
  'settings.manage', 'settings.users', 'settings.roles', 'settings.backup',
  'audit.view', 'audit.export', 'sales.void', 'payments.reverse', 'adjustments.reverse', 'records.restore',
  'orders.view', 'orders.create', 'orders.edit', 'orders.delete', 'orders.convert', 'orders.cancel'
];

const DEFAULT_ROLES: { name: string; description: string; permissions: string[] }[] = [
  { name: 'Owner', description: 'Full system access and control', permissions: ALL_PERMISSIONS },
  { name: 'Administrator', description: 'System administration with all operational permissions', permissions: [...ALL_PERMISSIONS.filter(p => !p.startsWith('settings.')), 'settings.backup'] },
  { name: 'Manager', description: 'Oversee daily operations across all departments', permissions: ['dashboard', 'inventory.view', 'inventory.add', 'inventory.edit', 'inventory.adjust', 'inventory.transfer', 'sales.create', 'sales.edit', 'sales.cancel', 'sales.returns', 'sales.invoices', 'purchases.create', 'purchases.edit', 'purchases.approve', 'purchases.receive', 'customers.view', 'customers.add', 'customers.edit', 'suppliers.view', 'suppliers.add', 'suppliers.edit', 'warehouses.view', 'warehouses.transfer', 'expenses.view', 'expenses.add', 'expenses.edit', 'reports.view', 'reports.profits', 'employees.view', 'employees.add', 'employees.edit'] },
  { name: 'Accountant', description: 'Financial operations and reporting', permissions: ['dashboard', 'inventory.view', 'sales.view', 'purchases.view', 'customers.view', 'suppliers.view', 'expenses.view', 'expenses.add', 'expenses.edit', 'expenses.delete', 'reports.view', 'reports.profits'] },
  { name: 'Cashier', description: 'Process sales transactions', permissions: ['dashboard', 'inventory.view', 'sales.create', 'sales.invoices', 'customers.view', 'customers.add'] },
  { name: 'Inventory Manager', description: 'Manage stock levels and warehouse operations', permissions: ['dashboard', 'inventory.view', 'inventory.add', 'inventory.edit', 'inventory.adjust', 'inventory.transfer', 'purchases.receive', 'warehouses.view', 'warehouses.edit', 'warehouses.transfer', 'reports.view'] },
  { name: 'Warehouse Staff', description: 'Handle stock movement and organization', permissions: ['inventory.view', 'inventory.adjust', 'inventory.transfer', 'warehouses.view', 'warehouses.transfer'] },
  { name: 'Purchasing Officer', description: 'Manage purchase orders and supplier relations', permissions: ['dashboard', 'inventory.view', 'purchases.create', 'purchases.edit', 'purchases.approve', 'purchases.receive', 'suppliers.view', 'suppliers.add', 'suppliers.edit', 'suppliers.delete', 'reports.view'] },
  { name: 'Sales Representative', description: 'Customer-facing sales and relationship management', permissions: ['dashboard', 'inventory.view', 'sales.create', 'sales.edit', 'sales.invoices', 'customers.view', 'customers.add', 'customers.edit'] },
  { name: 'Driver', description: 'Handle shipments and deliveries', permissions: ['shipments', 'inventory.view', 'warehouses.view'] }
];

function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(pin, salt, 64).toString('hex');
  return `${salt}:${key}`;
}

// C9: Helper to cascade-delete all records for a business
// This exists because SQLite doesn't support ALTER TABLE ADD CONSTRAINT
// to add ON DELETE CASCADE to existing FKs
export function cascadeDeleteBusiness(businessId: number): void {
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM returns WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM debt_payments WHERE saleId IN (SELECT id FROM sales WHERE businessId = ?)').run(businessId);
    db.prepare('DELETE FROM sales WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM stock_movements WHERE itemId IN (SELECT id FROM items WHERE businessId = ?)').run(businessId);
    db.prepare('DELETE FROM warehouse_inventory WHERE itemId IN (SELECT id FROM items WHERE businessId = ?)').run(businessId);
    db.prepare('DELETE FROM stock_transfers WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM item_packs WHERE itemId IN (SELECT id FROM items WHERE businessId = ?)').run(businessId);
    db.prepare('DELETE FROM items WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM categories WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM expenses WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM adjustments WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM notifications WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM notification_banners WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM notification_reminders WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM notification_quiet_hours WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM draft_sales WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM contacts WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM budgets WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM budget_adjustments WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM budget_alerts WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM supplier_price_checks WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM orders WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM shipment_items WHERE shipmentId IN (SELECT id FROM shipments WHERE businessId = ?)').run(businessId);
    db.prepare('DELETE FROM shipment_history WHERE shipmentId IN (SELECT id FROM shipments WHERE businessId = ?)').run(businessId);
    db.prepare('DELETE FROM shipments WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM supplier_purchase_items WHERE purchaseId IN (SELECT id FROM supplier_purchases WHERE businessId = ?)').run(businessId);
    db.prepare('DELETE FROM supplier_payments WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM supplier_activity_log WHERE supplierId IN (SELECT id FROM suppliers WHERE businessId = ?)').run(businessId);
    db.prepare('DELETE FROM supplier_purchases WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM customer_notes WHERE customerId IN (SELECT id FROM customers WHERE businessId = ?)').run(businessId);
    db.prepare('DELETE FROM customers WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM suppliers WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM warehouses WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM admins WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM subscriptions WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM payment_transactions WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM subscription_history WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM audit_logs WHERE businessId = ?').run(businessId);
    db.prepare('DELETE FROM businesses WHERE id = ?').run(businessId);
  });
  tx();
}

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS businesses (
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

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      name TEXT NOT NULL,
      icon TEXT,
      isCustom INTEGER NOT NULL DEFAULT 0,
      uuid TEXT UNIQUE,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0,
      is_synced INTEGER DEFAULT 1,
      UNIQUE(businessId, name),
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      name TEXT NOT NULL,
      categoryId INTEGER,
      sku TEXT,
      barcode TEXT,
      companyName TEXT,
      purchaseUnit TEXT, 
      baseUnit TEXT,
      unitsPerPack REAL,
      totalPackQuantity REAL,
      totalBaseQuantity REAL,
      packPurchasePrice REAL,
      basePurchasePrice REAL,
      baseSellingPrice REAL,
      packSellingPrice REAL,
      allowSellByBaseUnit INTEGER DEFAULT 1,
      allowSellByPackUnit INTEGER DEFAULT 0,
      expiryDate TEXT,
      qualityGrade TEXT,
      notes TEXT,
      isCredit INTEGER,
      supplierPhone TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      uuid TEXT UNIQUE,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0,
      is_synced INTEGER DEFAULT 1,
      UNIQUE(businessId, name),
      FOREIGN KEY (categoryId) REFERENCES categories(id),
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS item_packs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemId INTEGER,
      packNumber INTEGER,
      initialQuantity REAL,
      currentQuantity REAL,
      unit TEXT,
      status TEXT DEFAULT 'Not Opened',
      uuid TEXT UNIQUE,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0,
      is_synced INTEGER DEFAULT 1,
      FOREIGN KEY (itemId) REFERENCES items(id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      itemId INTEGER,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      unitType TEXT NOT NULL,
      discount REAL DEFAULT 0,
      vat REAL DEFAULT 0,
      totalPrice REAL NOT NULL,
      paymentMethod TEXT,
      paymentStatus TEXT,
      status TEXT DEFAULT 'Active',
      customerName TEXT,
      customerPhone TEXT,
      packId INTEGER,
      dueDate TEXT,
      paidAmount REAL DEFAULT 0,
      createdBy INTEGER,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      uuid TEXT UNIQUE,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0,
      is_synced INTEGER DEFAULT 1,
      FOREIGN KEY (itemId) REFERENCES items(id),
      FOREIGN KEY (packId) REFERENCES item_packs(id),
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS debt_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      saleId INTEGER NOT NULL,
      customerName TEXT,
      customerPhone TEXT,
      amount REAL NOT NULL,
      type TEXT DEFAULT 'payment',
      note TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (saleId) REFERENCES sales(id)
    );

    CREATE TABLE IF NOT EXISTS returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      saleId INTEGER NOT NULL,
      itemId INTEGER,
      quantity REAL NOT NULL,
      unit TEXT,
      unitType TEXT,
      refundAmount REAL DEFAULT 0,
      reason TEXT,
      status TEXT DEFAULT 'completed',
      createdBy INTEGER,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (saleId) REFERENCES sales(id),
      FOREIGN KEY (itemId) REFERENCES items(id),
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      date TEXT NOT NULL,
      isRecurring INTEGER DEFAULT 0,
      frequency TEXT,
      nextBillingDate TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      uuid TEXT UNIQUE,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0,
      is_synced INTEGER DEFAULT 1,
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      itemId INTEGER NOT NULL,
      type TEXT NOT NULL,
      oldValue REAL,
      newValue REAL,
      quantity REAL,
      unitType TEXT,
      reason TEXT,
      date TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      uuid TEXT UNIQUE,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0,
      is_synced INTEGER DEFAULT 1,
      FOREIGN KEY (itemId) REFERENCES items(id),
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT,
      isRead INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      key TEXT PRIMARY KEY,
      enabled INTEGER DEFAULT 1,
      sound INTEGER DEFAULT 1,
      desktop INTEGER DEFAULT 1,
      email INTEGER DEFAULT 0,
      inApp INTEGER DEFAULT 1,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notification_banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT DEFAULT 'info',
      dismissible INTEGER DEFAULT 1,
      startsAt TEXT DEFAULT CURRENT_TIMESTAMP,
      endsAt TEXT,
      dismissedAt TEXT,
      actionUrl TEXT,
      actionLabel TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS draft_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      items TEXT NOT NULL,
      customerName TEXT,
      customerPhone TEXT,
      discount REAL DEFAULT 0,
      vat REAL DEFAULT 0,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      category TEXT DEFAULT 'other',
      subCategory TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      uuid TEXT,
      device_id TEXT,
      row_version INTEGER DEFAULT 1,
      updated_at TEXT,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT,
      is_synced INTEGER DEFAULT 1,
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      period TEXT DEFAULT 'monthly',
      month TEXT,
      year TEXT,
      budgetType TEXT DEFAULT 'business',
      referenceName TEXT,
      isRecurring INTEGER DEFAULT 0,
      notes TEXT,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS budget_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      budgetId INTEGER NOT NULL,
      businessId INTEGER,
      previousAmount REAL NOT NULL,
      newAmount REAL NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      requestedBy TEXT,
      approvedBy TEXT,
      approvedAt TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (budgetId) REFERENCES budgets(id),
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS budget_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      budgetId INTEGER,
      businessId INTEGER,
      category TEXT NOT NULL,
      alertType TEXT NOT NULL,
      threshold REAL,
      message TEXT,
      month TEXT,
      year TEXT,
      acknowledged INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (budgetId) REFERENCES budgets(id),
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS supplier_price_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      supplierId INTEGER NOT NULL,
      itemId INTEGER,
      frequency TEXT DEFAULT 'weekly',
      lastChecked TEXT,
      nextCheck TEXT,
      notes TEXT,
      active INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplierId) REFERENCES suppliers(id),
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS notification_quiet_hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS notification_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      title TEXT NOT NULL,
      message TEXT,
      category TEXT NOT NULL,
      triggerDate TEXT NOT NULL,
      repeatInterval TEXT,
      status TEXT DEFAULT 'pending',
      lastTriggeredAt TEXT,
      completedAt TEXT,
      snoozedUntil TEXT,
      relatedEntityType TEXT,
      relatedEntityId INTEGER,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      uuid TEXT,
      device_id TEXT,
      row_version INTEGER DEFAULT 1,
      updated_at TEXT,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT,
      is_synced INTEGER DEFAULT 1
    );

    -- Budget categories (mirrors mobile's budget_categories table)
    CREATE TABLE IF NOT EXISTS budget_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      budgetId INTEGER NOT NULL,
      category TEXT NOT NULL,
      plannedAmount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      uuid TEXT,
      device_id TEXT,
      row_version INTEGER DEFAULT 1,
      updated_at TEXT,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT,
      is_synced INTEGER DEFAULT 1,
      FOREIGN KEY (budgetId) REFERENCES budgets(id) ON DELETE CASCADE
    );

    -- Subscription payments (mirrors mobile's subscription_payments table)
    CREATE TABLE IF NOT EXISTS subscription_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscriptionId INTEGER,
      transactionId TEXT,
      businessName TEXT,
      phoneNumber TEXT,
      planName TEXT,
      amount REAL,
      currency TEXT DEFAULT 'ETB',
      paymentDate TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending_verification',
      verifiedAt TEXT,
      verifiedBy TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      uuid TEXT,
      device_id TEXT,
      row_version INTEGER DEFAULT 1,
      updated_at TEXT,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT,
      is_synced INTEGER DEFAULT 1,
      FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id)
    );

    -- Subscription renewals (mirrors mobile's subscription_renewals table)
    CREATE TABLE IF NOT EXISTS subscription_renewals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscriptionId INTEGER,
      previousExpiry TEXT,
      newExpiry TEXT,
      plan TEXT,
      durationMonths INTEGER,
      amount REAL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      uuid TEXT,
      device_id TEXT,
      row_version INTEGER DEFAULT 1,
      updated_at TEXT,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT,
      is_synced INTEGER DEFAULT 1,
      FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id)
    );

    -- Scheduled reminders (mirrors mobile's scheduled_reminders table)
    CREATE TABLE IF NOT EXISTS scheduled_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      notificationId TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      category TEXT,
      priority TEXT DEFAULT 'normal',
      triggerDate TEXT,
      repeatInterval TEXT,
      status TEXT DEFAULT 'scheduled',
      lastTriggeredAt TEXT,
      completedAt TEXT,
      snoozedUntil TEXT,
      relatedEntityType TEXT,
      relatedEntityId INTEGER,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      uuid TEXT,
      device_id TEXT,
      row_version INTEGER DEFAULT 1,
      updated_at TEXT,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT,
      is_synced INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      pin TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      permissions TEXT,
      isActive INTEGER DEFAULT 1,
      avatar TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS warehouses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      name TEXT NOT NULL,
      location TEXT,
      managerName TEXT,
      managerPhone TEXT,
      email TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(businessId, name),
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS warehouse_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      warehouseId INTEGER,
      itemId INTEGER,
      quantity REAL DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (warehouseId) REFERENCES warehouses(id) ON DELETE CASCADE,
      FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
      UNIQUE(warehouseId, itemId)
    );

    CREATE TABLE IF NOT EXISTS stock_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      fromWarehouseId INTEGER,
      toWarehouseId INTEGER,
      itemId INTEGER,
      quantity REAL NOT NULL,
      unitType TEXT DEFAULT 'base',
      status TEXT DEFAULT 'completed',
      notes TEXT,
      transferredBy TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      completedAt TEXT,
      FOREIGN KEY (fromWarehouseId) REFERENCES warehouses(id),
      FOREIGN KEY (toWarehouseId) REFERENCES warehouses(id),
      FOREIGN KEY (itemId) REFERENCES items(id),
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      warehouseId INTEGER,
      itemId INTEGER,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      referenceId INTEGER,
      referenceType TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (warehouseId) REFERENCES warehouses(id) ON DELETE CASCADE,
      FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employee_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      permissions TEXT DEFAULT '[]',
      isSystem INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      uuid TEXT,
      device_id TEXT,
      row_version INTEGER DEFAULT 1,
      updated_at TEXT,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT,
      is_synced INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeCode TEXT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      emergencyContact TEXT,
      gender TEXT,
      dateOfBirth TEXT,
      roleId INTEGER REFERENCES employee_roles(id),
      department TEXT,
      warehouseId INTEGER REFERENCES warehouses(id),
      isActive INTEGER DEFAULT 1,
      employmentStatus TEXT DEFAULT 'active',
      avatar TEXT,
      hireDate TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      uuid TEXT,
      device_id TEXT,
      row_version INTEGER DEFAULT 1,
      updated_at TEXT,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT,
      is_synced INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS employee_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId INTEGER UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
      username TEXT UNIQUE NOT NULL,
      pin TEXT NOT NULL,
      isActive INTEGER DEFAULT 1,
      forcePasswordChange INTEGER DEFAULT 0,
      failedLoginAttempts INTEGER DEFAULT 0,
      lockedUntil TEXT,
      lastPasswordChange TEXT,
      lastLogin TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      uuid TEXT,
      device_id TEXT,
      row_version INTEGER DEFAULT 1,
      updated_at TEXT,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT,
      is_synced INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER REFERENCES businesses(id),
      action TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId INTEGER,
      fieldName TEXT,
      oldValue TEXT,
      newValue TEXT,
      changedBy TEXT,
      changedById INTEGER,
      description TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS login_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountId INTEGER REFERENCES employee_accounts(id) ON DELETE CASCADE,
      employeeId INTEGER REFERENCES employees(id),
      action TEXT NOT NULL,
      ipAddress TEXT,
      deviceInfo TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      clockIn TEXT,
      clockOut TEXT,
      status TEXT DEFAULT 'present',
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employeeId, date)
    );

    CREATE TABLE IF NOT EXISTS pin_recovery_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId INTEGER UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
      adminId INTEGER REFERENCES admins(id) ON DELETE CASCADE,
      recoveryKey TEXT NOT NULL,
      keyHint TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      usedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS pin_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entityType TEXT NOT NULL,
      entityId INTEGER NOT NULL,
      action TEXT NOT NULL,
      performedBy TEXT NOT NULL,
      performedById INTEGER,
      details TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_performance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      period TEXT NOT NULL,
      salesAmount REAL DEFAULT 0,
      ordersProcessed INTEGER DEFAULT 0,
      attendanceScore REAL DEFAULT 0,
      tasksCompleted INTEGER DEFAULT 0,
      rating REAL,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employeeId, period)
    );

    CREATE TABLE IF NOT EXISTS shipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER REFERENCES businesses(id),
      origin TEXT,
      destination TEXT NOT NULL,
      driverName TEXT,
      driverPhone TEXT,
      vehicleInfo TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      scheduledDate TEXT,
      deliveredAt TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shipment_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipmentId INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
      itemId INTEGER REFERENCES items(id),
      itemName TEXT,
      quantity REAL NOT NULL,
      unit TEXT
    );

    CREATE TABLE IF NOT EXISTS shipment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipmentId INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      changedBy TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      supplierCode TEXT,
      supplierName TEXT NOT NULL,
      companyName TEXT,
      contactPerson TEXT,
      phone TEXT,
      secondaryPhone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      country TEXT,
      taxNumber TEXT,
      paymentTerms TEXT,
      creditLimit REAL DEFAULT 0,
      notes TEXT,
      status TEXT DEFAULT 'active',
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(businessId, supplierName),
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      customerName TEXT NOT NULL,
      phone TEXT,
      secondaryPhone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      company TEXT,
      taxNumber TEXT,
      groupName TEXT DEFAULT 'general',
      creditLimit REAL DEFAULT 0,
      notes TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(businessId, customerName),
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS customer_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER NOT NULL,
      note TEXT NOT NULL,
      createdBy TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS supplier_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      supplierId INTEGER NOT NULL,
      purchaseNumber TEXT UNIQUE,
      purchaseDate TEXT NOT NULL,
      totalAmount REAL NOT NULL DEFAULT 0,
      paidAmount REAL DEFAULT 0,
      dueDate TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      createdBy TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE CASCADE,
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS supplier_purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchaseId INTEGER NOT NULL,
      itemId INTEGER,
      itemName TEXT NOT NULL,
      sku TEXT,
      quantity REAL NOT NULL,
      unit TEXT,
      unitPrice REAL NOT NULL,
      totalPrice REAL NOT NULL,
      receivedQuantity REAL DEFAULT 0,
      FOREIGN KEY (purchaseId) REFERENCES supplier_purchases(id) ON DELETE CASCADE,
      FOREIGN KEY (itemId) REFERENCES items(id)
    );

    CREATE TABLE IF NOT EXISTS supplier_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      supplierId INTEGER NOT NULL,
      purchaseId INTEGER,
      paymentDate TEXT NOT NULL,
      referenceNumber TEXT,
      amount REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE CASCADE,
      FOREIGN KEY (purchaseId) REFERENCES supplier_purchases(id) ON DELETE SET NULL,
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );
  `);

  // ========== SYNC INFRASTRUCTURE TABLES ==========
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      device_id TEXT NOT NULL,
      pairing_token TEXT,
      schema_version INTEGER DEFAULT 17
    );

    CREATE TABLE IF NOT EXISTS sync_outbox (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      entity TEXT NOT NULL,
      entity_uuid TEXT NOT NULL,
      op TEXT NOT NULL,
      payload TEXT NOT NULL,
      device_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_sync_outbox_entity ON sync_outbox(entity_uuid);

    CREATE TABLE IF NOT EXISTS sync_cursor (
      device_id TEXT PRIMARY KEY,
      last_seq INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT UNIQUE NOT NULL,
      name TEXT,
      pairing_token TEXT,
      businessId INTEGER,
      last_seen_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT,
      entity TEXT,
      entity_uuid TEXT,
      op TEXT,
      detail TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_refs (
      device_id TEXT,
      entity TEXT,
      local_id INTEGER,
      uuid TEXT,
      PRIMARY KEY (device_id, entity, local_id)
    );

    CREATE TABLE IF NOT EXISTS sync_requests (
      device_id TEXT PRIMARY KEY,
      requested_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Existing DBs created before pairing tokens may lack the column.
  {
    const metaCols = db.prepare('PRAGMA table_info(sync_meta)').all() as any[];
    if (!metaCols.some((c: any) => c.name === 'pairing_token')) {
      db.exec('ALTER TABLE sync_meta ADD COLUMN pairing_token TEXT');
    }
  }

  // ========== VERSIONED MIGRATION SYSTEM ==========
  const currentVersion = db.pragma('user_version', { simple: true }) as number;
  let version = typeof currentVersion === 'number' ? currentVersion : 0;

  if (version < 1) {
    const notifCols = db.prepare("PRAGMA table_info(notifications)").all() as any[];
    const notifColNames = notifCols.map((c: any) => c.name);
    if (!notifColNames.includes('category')) db.exec("ALTER TABLE notifications ADD COLUMN category TEXT DEFAULT 'system'");
    if (!notifColNames.includes('severity')) db.exec("ALTER TABLE notifications ADD COLUMN severity TEXT DEFAULT 'info'");
    if (!notifColNames.includes('actionUrl')) db.exec("ALTER TABLE notifications ADD COLUMN actionUrl TEXT");
    if (!notifColNames.includes('actionLabel')) db.exec("ALTER TABLE notifications ADD COLUMN actionLabel TEXT");
    if (!notifColNames.includes('entityType')) db.exec("ALTER TABLE notifications ADD COLUMN entityType TEXT");
    if (!notifColNames.includes('entityId')) db.exec("ALTER TABLE notifications ADD COLUMN entityId INTEGER");
    if (!notifColNames.includes('isDismissed')) db.exec("ALTER TABLE notifications ADD COLUMN isDismissed INTEGER DEFAULT 0");
    if (!notifColNames.includes('snoozedUntil')) db.exec("ALTER TABLE notifications ADD COLUMN snoozedUntil TEXT");
    if (!notifColNames.includes('channels')) db.exec("ALTER TABLE notifications ADD COLUMN channels TEXT DEFAULT 'in_app'");
    if (!notifColNames.includes('requiresAction')) db.exec("ALTER TABLE notifications ADD COLUMN requiresAction INTEGER DEFAULT 0");
    if (!notifColNames.includes('expiresAt')) db.exec("ALTER TABLE notifications ADD COLUMN expiresAt TEXT");
    version = 1;
    db.pragma(`user_version = ${version}`);
  }

  if (version < 2) {
    const budgetCols = db.prepare("PRAGMA table_info(budgets)").all() as any[];
    const budgetColNames = budgetCols.map((c: any) => c.name);
    if (!budgetColNames.includes('budgetType')) db.exec("ALTER TABLE budgets ADD COLUMN budgetType TEXT DEFAULT 'business'");
    if (!budgetColNames.includes('referenceName')) db.exec("ALTER TABLE budgets ADD COLUMN referenceName TEXT");
    if (!budgetColNames.includes('isRecurring')) db.exec("ALTER TABLE budgets ADD COLUMN isRecurring INTEGER DEFAULT 0");
    if (!budgetColNames.includes('notes')) db.exec("ALTER TABLE budgets ADD COLUMN notes TEXT");
    if (!budgetColNames.includes('updatedAt')) db.exec("ALTER TABLE budgets ADD COLUMN updatedAt TEXT");
db.exec('UPDATE budgets SET updatedAt = CURRENT_TIMESTAMP WHERE updatedAt IS NULL');
    version = 2;
    db.pragma(`user_version = ${version}`);
  }

  if (version < 3) {
    const alertCols = db.prepare("PRAGMA table_info(budget_alerts)").all() as any[];
    const alertColNames = alertCols.map((c: any) => c.name);
    if (!alertColNames.includes('month')) db.exec("ALTER TABLE budget_alerts ADD COLUMN month TEXT");
    if (!alertColNames.includes('year')) db.exec("ALTER TABLE budget_alerts ADD COLUMN year TEXT");
    version = 3;
    db.pragma(`user_version = ${version}`);
  }

  if (version < 4) {
    const empColumns = db.prepare("PRAGMA table_info(employees)").all() as any[];
    const empColNames = empColumns.map((c: any) => c.name);
    if (!empColNames.includes('address')) db.exec("ALTER TABLE employees ADD COLUMN address TEXT");
    if (!empColNames.includes('emergencyContact')) db.exec("ALTER TABLE employees ADD COLUMN emergencyContact TEXT");
    if (!empColNames.includes('gender')) db.exec("ALTER TABLE employees ADD COLUMN gender TEXT");
    if (!empColNames.includes('dateOfBirth')) db.exec("ALTER TABLE employees ADD COLUMN dateOfBirth TEXT");
    if (!empColNames.includes('department')) db.exec("ALTER TABLE employees ADD COLUMN department TEXT");
    if (!empColNames.includes('warehouseId')) db.exec("ALTER TABLE employees ADD COLUMN warehouseId INTEGER REFERENCES warehouses(id)");
    if (!empColNames.includes('employmentStatus')) db.exec("ALTER TABLE employees ADD COLUMN employmentStatus TEXT DEFAULT 'active'");
    if (!empColNames.includes('avatar')) db.exec("ALTER TABLE employees ADD COLUMN avatar TEXT");
    if (!empColNames.includes('notes')) db.exec("ALTER TABLE employees ADD COLUMN notes TEXT");
    version = 4;
    db.pragma(`user_version = ${version}`);
  }

  if (version < 5) {
    const acctColumns = db.prepare("PRAGMA table_info(employee_accounts)").all() as any[];
    const acctColNames = acctColumns.map((c: any) => c.name);
    if (!acctColNames.includes('forcePasswordChange')) db.exec("ALTER TABLE employee_accounts ADD COLUMN forcePasswordChange INTEGER DEFAULT 0");
    if (!acctColNames.includes('failedLoginAttempts')) db.exec("ALTER TABLE employee_accounts ADD COLUMN failedLoginAttempts INTEGER DEFAULT 0");
    if (!acctColNames.includes('lockedUntil')) db.exec("ALTER TABLE employee_accounts ADD COLUMN lockedUntil TEXT");
    if (!acctColNames.includes('lastPasswordChange')) db.exec("ALTER TABLE employee_accounts ADD COLUMN lastPasswordChange TEXT");
    version = 5;
    db.pragma(`user_version = ${version}`);
  }

  if (version < 6) {
    const salesColumns = db.prepare("PRAGMA table_info(sales)").all() as any[];
    const salesColNames = salesColumns.map((c: any) => c.name);
    if (!salesColNames.includes('createdBy')) db.exec("ALTER TABLE sales ADD COLUMN createdBy INTEGER");
    if (!salesColNames.includes('costAtTimeOfSale')) db.exec("ALTER TABLE sales ADD COLUMN costAtTimeOfSale REAL");
    if (!salesColNames.includes('status')) db.exec("ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'Active'");
    if (!salesColNames.includes('voidReason')) db.exec("ALTER TABLE sales ADD COLUMN voidReason TEXT");
    if (!salesColNames.includes('voidedBy')) db.exec("ALTER TABLE sales ADD COLUMN voidedBy TEXT");
    if (!salesColNames.includes('voidedAt')) db.exec("ALTER TABLE sales ADD COLUMN voidedAt TEXT");
    version = 6;
    db.pragma(`user_version = ${version}`);
  }

  if (version < 7) {
    const supColumns = db.prepare("PRAGMA table_info(suppliers)").all() as any[];
    const supColNames = supColumns.map((c: any) => c.name);
    if (!supColNames.includes('businessId')) db.exec("ALTER TABLE suppliers ADD COLUMN businessId INTEGER REFERENCES businesses(id)");
    if (!supColNames.includes('isFavorite')) db.exec("ALTER TABLE suppliers ADD COLUMN isFavorite INTEGER DEFAULT 0");
    if (!supColNames.includes('performanceScore')) db.exec("ALTER TABLE suppliers ADD COLUMN performanceScore REAL DEFAULT 0");
    if (!supColNames.includes('lastActivityDate')) db.exec("ALTER TABLE suppliers ADD COLUMN lastActivityDate TEXT");
    version = 7;
    db.pragma(`user_version = ${version}`);
  }

  if (version < 8) {
    const spColumns = db.prepare("PRAGMA table_info(supplier_purchases)").all() as any[];
    const spColNames = spColumns.map((c: any) => c.name);
    if (!spColNames.includes('businessId')) db.exec("ALTER TABLE supplier_purchases ADD COLUMN businessId INTEGER REFERENCES businesses(id)");
    const spPayColumns = db.prepare("PRAGMA table_info(supplier_payments)").all() as any[];
    const spPayColNames = spPayColumns.map((c: any) => c.name);
    if (!spPayColNames.includes('businessId')) db.exec("ALTER TABLE supplier_payments ADD COLUMN businessId INTEGER REFERENCES businesses(id)");
    version = 8;
    db.pragma(`user_version = ${version}`);
  }

  if (version < 9) {
    const itemCols = db.prepare("PRAGMA table_info(items)").all() as any[];
    const itemColNames = itemCols.map((c: any) => c.name);
    if (!itemColNames.includes('supplierId')) db.exec("ALTER TABLE items ADD COLUMN supplierId INTEGER REFERENCES suppliers(id)");
    if (!itemColNames.includes('lastPurchaseDate')) db.exec("ALTER TABLE items ADD COLUMN lastPurchaseDate TEXT");
    if (!itemColNames.includes('lastPurchasePrice')) db.exec("ALTER TABLE items ADD COLUMN lastPurchasePrice REAL DEFAULT 0");
    if (!itemColNames.includes('deleted_by')) db.exec("ALTER TABLE items ADD COLUMN deleted_by TEXT");
    if (!itemColNames.includes('deleted_at')) db.exec("ALTER TABLE items ADD COLUMN deleted_at TEXT");
    version = 9;
    db.pragma(`user_version = ${version}`);
  }

  if (version < 10) {
    const adminCols = db.prepare("PRAGMA table_info(admins)").all() as any[];
    const adminColNames = adminCols.map((c: any) => c.name);
    if (!adminColNames.includes('failedLoginAttempts')) db.exec("ALTER TABLE admins ADD COLUMN failedLoginAttempts INTEGER DEFAULT 0");
    if (!adminColNames.includes('lockedUntil')) db.exec("ALTER TABLE admins ADD COLUMN lockedUntil TEXT");
    if (!adminColNames.includes('forcePasswordChange')) db.exec("ALTER TABLE admins ADD COLUMN forcePasswordChange INTEGER DEFAULT 0");
    if (!adminColNames.includes('lastPasswordChange')) db.exec("ALTER TABLE admins ADD COLUMN lastPasswordChange TEXT");
    if (!adminColNames.includes('lastLogin')) db.exec("ALTER TABLE admins ADD COLUMN lastLogin TEXT");
    version = 10;
    db.pragma(`user_version = ${version}`);
  }

  if (version < 11) {
    const dpCols = db.prepare("PRAGMA table_info(debt_payments)").all() as any[];
    const dpColNames = dpCols.map((c: any) => c.name);
    if (!dpColNames.includes('reversalId')) db.exec("ALTER TABLE debt_payments ADD COLUMN reversalId INTEGER");
    if (!dpColNames.includes('reversalReason')) db.exec("ALTER TABLE debt_payments ADD COLUMN reversalReason TEXT");
    if (!dpColNames.includes('reversedBy')) db.exec("ALTER TABLE debt_payments ADD COLUMN reversedBy TEXT");
    if (!dpColNames.includes('reversalDate')) db.exec("ALTER TABLE debt_payments ADD COLUMN reversalDate TEXT");
    version = 11;
    db.pragma(`user_version = ${version}`);
  }

  if (version < 12) {
    const supPayCols = db.prepare("PRAGMA table_info(supplier_payments)").all() as any[];
    const supPayColNames = supPayCols.map((c: any) => c.name);
    if (!supPayColNames.includes('reversalId')) db.exec("ALTER TABLE supplier_payments ADD COLUMN reversalId INTEGER");
    if (!supPayColNames.includes('reversalReason')) db.exec("ALTER TABLE supplier_payments ADD COLUMN reversalReason TEXT");
    if (!supPayColNames.includes('reversedBy')) db.exec("ALTER TABLE supplier_payments ADD COLUMN reversedBy TEXT");
    if (!supPayColNames.includes('reversalDate')) db.exec("ALTER TABLE supplier_payments ADD COLUMN reversalDate TEXT");
    version = 12;
    db.pragma(`user_version = ${version}`);
  }

  if (version < 13) {
    const adjCols = db.prepare("PRAGMA table_info(adjustments)").all() as any[];
    const adjColNames = adjCols.map((c: any) => c.name);
    if (!adjColNames.includes('reversalId')) db.exec("ALTER TABLE adjustments ADD COLUMN reversalId INTEGER");
    if (!adjColNames.includes('reversalReason')) db.exec("ALTER TABLE adjustments ADD COLUMN reversalReason TEXT");
    if (!adjColNames.includes('reversedBy')) db.exec("ALTER TABLE adjustments ADD COLUMN reversedBy TEXT");
    if (!adjColNames.includes('reversalDate')) db.exec("ALTER TABLE adjustments ADD COLUMN reversalDate TEXT");
    version = 13;
    db.pragma(`user_version = ${version}`);
  }

  if (version < 14) {
    const custCols = db.prepare("PRAGMA table_info(customers)").all() as any[];
    const custColNames = custCols.map((c: any) => c.name);
    if (!custColNames.includes('is_deleted')) db.exec("ALTER TABLE customers ADD COLUMN is_deleted INTEGER DEFAULT 0");
    if (!custColNames.includes('deleted_by')) db.exec("ALTER TABLE customers ADD COLUMN deleted_by TEXT");
    if (!custColNames.includes('deleted_at')) db.exec("ALTER TABLE customers ADD COLUMN deleted_at TEXT");
    version = 14;
    db.pragma(`user_version = ${version}`);
  }

  if (version < 15) {
    const roleCols = db.prepare("PRAGMA table_info(employee_roles)").all() as any[];
    const roleColNames = roleCols.map((c: any) => c.name);
    if (!roleColNames.includes('businessId')) db.exec("ALTER TABLE employee_roles ADD COLUMN businessId INTEGER REFERENCES businesses(id)");
    version = 15;
    db.pragma(`user_version = ${version}`);
  }

  if (version < 16) {
    const itemCols = db.prepare("PRAGMA table_info(items)").all() as any[];
    const itemColNames = itemCols.map((c: any) => c.name);
    if (!itemColNames.includes('sku')) db.exec("ALTER TABLE items ADD COLUMN sku TEXT");
    if (!itemColNames.includes('barcode')) db.exec("ALTER TABLE items ADD COLUMN barcode TEXT");
    const saleCols = db.prepare("PRAGMA table_info(sales)").all() as any[];
    const saleColNames = saleCols.map((c: any) => c.name);
    if (!saleColNames.includes('fiscal_number')) db.exec("ALTER TABLE sales ADD COLUMN fiscal_number TEXT");
    if (!saleColNames.includes('fiscal_signature')) db.exec("ALTER TABLE sales ADD COLUMN fiscal_signature TEXT");
    version = 16;
    db.pragma(`user_version = ${version}`);
  }

  if (version < 17) {
    const syncTables = ['categories', 'items', 'item_packs', 'sales', 'debt_payments', 'returns', 'expenses', 'adjustments', 'customers', 'contacts', 'suppliers', 'orders', 'order_items', 'shipments', 'shipment_items', 'employee_roles', 'employees', 'employee_accounts', 'subscriptions', 'notification_reminders', 'budgets'];
    for (const tbl of syncTables) {
      const cols = db.prepare(`PRAGMA table_info(${tbl})`).all() as any[];
      const names = cols.map((c: any) => c.name);
      if (!names.includes('uuid')) db.exec(`ALTER TABLE ${tbl} ADD COLUMN uuid TEXT`);
      if (!names.includes('device_id')) db.exec(`ALTER TABLE ${tbl} ADD COLUMN device_id TEXT`);
      if (!names.includes('row_version')) db.exec(`ALTER TABLE ${tbl} ADD COLUMN row_version INTEGER DEFAULT 1`);
      if (!names.includes('updated_at')) db.exec(`ALTER TABLE ${tbl} ADD COLUMN updated_at TEXT`);
      // SQLite forbids non-constant DEFAULT in ALTER TABLE ADD COLUMN, so backfill instead.
      db.exec(`UPDATE ${tbl} SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL`);
      if (!names.includes('is_deleted')) db.exec(`ALTER TABLE ${tbl} ADD COLUMN is_deleted INTEGER DEFAULT 0`);
      if (!names.includes('deleted_at')) db.exec(`ALTER TABLE ${tbl} ADD COLUMN deleted_at TEXT`);
      if (!names.includes('is_synced')) db.exec(`ALTER TABLE ${tbl} ADD COLUMN is_synced INTEGER DEFAULT 1`);
    }
    // Backfill UUIDs (v4-style, generated in SQL) for every existing row.
    const backfill = `
      UPDATE categories SET uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), row_version = 1 WHERE uuid IS NULL;
      UPDATE items SET uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), row_version = 1 WHERE uuid IS NULL;
      UPDATE item_packs SET uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), row_version = 1 WHERE uuid IS NULL;
      UPDATE sales SET uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), row_version = 1 WHERE uuid IS NULL;
      UPDATE debt_payments SET uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), row_version = 1 WHERE uuid IS NULL;
      UPDATE returns SET uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), row_version = 1 WHERE uuid IS NULL;
      UPDATE expenses SET uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), row_version = 1 WHERE uuid IS NULL;
      UPDATE adjustments SET uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), row_version = 1 WHERE uuid IS NULL;
      UPDATE customers SET uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), row_version = 1 WHERE uuid IS NULL;
    `;
    db.exec(backfill);
    version = 17;
    db.pragma(`user_version = ${version}`);
  }

  // 4.3: tamper-evident audit — chained SHA-256 hashes on audit_logs.
  if (version < 18) {
    {
      const cols = db.prepare('PRAGMA table_info(audit_logs)').all() as any[];
      const names = cols.map((c: any) => c.name);
      if (!names.includes('prev_hash')) db.exec('ALTER TABLE audit_logs ADD COLUMN prev_hash TEXT');
      if (!names.includes('hash')) db.exec('ALTER TABLE audit_logs ADD COLUMN hash TEXT');
    }
    // Backfill a hash chain over any pre-existing rows (id order).
    const rows = db.prepare('SELECT * FROM audit_logs ORDER BY id ASC').all() as any[];
    const mk = (prev: string, r: any): string => {
      const c = crypto.createHash('sha256');
      c.update(`${prev}|${r.id}|${r.action}|${r.entityType}|${r.entityId ?? ''}|${r.fieldName ?? ''}|${r.oldValue ?? ''}|${r.newValue ?? ''}|${r.changedBy ?? ''}|${r.description ?? ''}|${r.createdAt ?? ''}`);
      return c.digest('hex');
    };
    const update = db.prepare('UPDATE audit_logs SET prev_hash = ?, hash = ? WHERE id = ?');
    let prev = 'GENESIS';
    const tx = db.transaction(() => {
      for (const r of rows) {
        const h = mk(prev, r);
        update.run(prev, h, r.id);
        prev = h;
      }
    });
    tx();
    version = 18;
    db.pragma(`user_version = ${version}`);
  }

  // 4.8: reorder automation — per-item reorder point / reorder qty.
  if (version < 19) {
    const cols = db.prepare('PRAGMA table_info(items)').all() as any[];
    const names = cols.map((c: any) => c.name);
    if (!names.includes('reorderPoint')) db.exec('ALTER TABLE items ADD COLUMN reorderPoint REAL DEFAULT 10');
    if (!names.includes('reorderQty')) db.exec('ALTER TABLE items ADD COLUMN reorderQty REAL DEFAULT 0');
    if (!names.includes('autoReorder')) db.exec('ALTER TABLE items ADD COLUMN autoReorder INTEGER DEFAULT 0');
    version = 19;
    db.pragma(`user_version = ${version}`);
  }

  // 4.12: gift cards / store credit.
  if (version < 20) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS gift_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        businessId INTEGER,
        code TEXT UNIQUE NOT NULL,
        cardName TEXT,
        initialBalance REAL DEFAULT 0,
        balance REAL DEFAULT 0,
        currency TEXT DEFAULT 'ETB',
        status TEXT DEFAULT 'active',
        issuedTo TEXT,
        issuedBy TEXT,
        expiryDate TEXT,
        notes TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        uuid TEXT,
        device_id TEXT,
        row_version INTEGER DEFAULT 1,
        is_deleted INTEGER DEFAULT 0,
        deleted_at TEXT,
        is_synced INTEGER DEFAULT 1,
        FOREIGN KEY (businessId) REFERENCES businesses(id)
      );
      CREATE TABLE IF NOT EXISTS gift_card_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        giftCardId INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        refType TEXT,
        refId INTEGER,
        note TEXT,
        createdBy TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (giftCardId) REFERENCES gift_cards(id)
      );
    `);
    version = 20;
    db.pragma(`user_version = ${version}`);
  }

  // 5.6: high-cardinality indexes for hot query paths discovered in perf review.
  if (version < 21) {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku);
      CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);
      CREATE INDEX IF NOT EXISTS idx_sync_outbox_seq ON sync_outbox(seq);
      CREATE INDEX IF NOT EXISTS idx_sync_outbox_device_seq ON sync_outbox(device_id, seq);
      CREATE INDEX IF NOT EXISTS idx_sales_businessId_createdAt ON sales(businessId, createdAt);
      CREATE INDEX IF NOT EXISTS idx_sales_customerName ON sales(customerName);
      CREATE INDEX IF NOT EXISTS idx_customers_customerName ON customers(customerName);
      CREATE INDEX IF NOT EXISTS idx_items_businessId_updated_at ON items(businessId, updated_at);
    `);
    version = 21;
    db.pragma(`user_version = ${version}`);
  }

  // 5.7: shared multi-device business model (registers, locations, canonical
  // roles, enriched devices). Mirrors @shega/shared entities so Desktop and
  // Mobile agree on the same business model.
  if (version < 22) {
    const devCols = (db.prepare('PRAGMA table_info(devices)').all() as any[]).map((c: any) => c.name);
    const addDev = (col: string, def: string) => { if (!devCols.includes(col)) db.exec(`ALTER TABLE devices ADD COLUMN ${col} ${def}`); };
    addDev('platform', "TEXT NOT NULL DEFAULT 'desktop'");
    addDev('role', 'TEXT');
    addDev('status', "TEXT NOT NULL DEFAULT 'active'");
    addDev('userId', 'INTEGER');
    addDev('registerId', 'INTEGER');
    addDev('appVersion', 'TEXT');
    addDev('isPrimary', 'INTEGER DEFAULT 0');
    addDev('uuid', 'TEXT');
    addDev('row_version', 'INTEGER DEFAULT 1');
    // SQLite forbids DEFAULT CURRENT_TIMESTAMP in ALTER TABLE ADD COLUMN; add plain column and backfill.
    addDev('updated_at', 'TEXT');
    addDev('is_deleted', 'INTEGER DEFAULT 0');
    addDev('is_synced', 'INTEGER DEFAULT 1');

    const empCols = (db.prepare('PRAGMA table_info(employees)').all() as any[]).map((c: any) => c.name);
    if (!empCols.includes('role_key')) db.exec("ALTER TABLE employees ADD COLUMN role_key TEXT");
    if (!empCols.includes('permissions_json')) db.exec("ALTER TABLE employees ADD COLUMN permissions_json TEXT");

    db.exec(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        businessId INTEGER,
        name TEXT NOT NULL,
        address TEXT,
        uuid TEXT,
        row_version INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_deleted INTEGER DEFAULT 0,
        is_synced INTEGER DEFAULT 1,
        FOREIGN KEY (businessId) REFERENCES businesses(id)
      );

      CREATE TABLE IF NOT EXISTS registers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        businessId INTEGER,
        locationId INTEGER,
        name TEXT NOT NULL,
        deviceId INTEGER,
        printerName TEXT,
        hasDrawer INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1,
        uuid TEXT,
        row_version INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_deleted INTEGER DEFAULT 0,
        is_synced INTEGER DEFAULT 1,
        FOREIGN KEY (businessId) REFERENCES businesses(id),
        FOREIGN KEY (locationId) REFERENCES locations(id)
      );

      CREATE TABLE IF NOT EXISTS business_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        businessId INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        permissions TEXT DEFAULT '{}',
        isSystem INTEGER DEFAULT 0,
        builtinKey TEXT,
        uuid TEXT,
        row_version INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_deleted INTEGER DEFAULT 0,
        is_synced INTEGER DEFAULT 1
      );

      CREATE INDEX IF NOT EXISTS idx_registers_business ON registers(businessId);
      CREATE INDEX IF NOT EXISTS idx_devices_business ON devices(businessId);
      CREATE INDEX IF NOT EXISTS idx_business_roles_business ON business_roles(businessId);
    `);

    // Seed the canonical built-in roles from @shega/shared so both apps share
    // the same role default permission sets.
    const seed = db.prepare('INSERT OR IGNORE INTO business_roles (name, description, permissions, isSystem, builtinKey) VALUES (?, ?, ?, 1, ?)');
    for (const r of BUILTIN_ROLES) {
      seed.run(r.name, r.description ?? '', JSON.stringify(r.permissions), r.builtinKey ?? r.key);
    }

    version = 22;
    db.pragma(`user_version = ${version}`);
  }

  // 5.7: add the sync columns the change-capture triggers require to the shared
  // business-model tables created in v22 (devices got them in v22; the others
  // were created without device_id/updated_at/deleted_at).
  if (version < 23) {
    const addSyncCols = (table: string, cols: string[]) => {
      const have = (db.prepare(`PRAGMA table_info(${table})`).all() as any[]).map((c: any) => c.name);
      for (const c of cols) {
        if (have.includes(c)) continue;
        if (c === 'device_id') db.exec(`ALTER TABLE ${table} ADD COLUMN device_id TEXT`);
        else if (c === 'updated_at') db.exec(`ALTER TABLE ${table} ADD COLUMN updated_at TEXT`);
        else if (c === 'deleted_at') db.exec(`ALTER TABLE ${table} ADD COLUMN deleted_at TEXT`);
      }
      // SQLite forbids non-constant DEFAULT in ALTER TABLE ADD COLUMN, so backfill instead.
      db.exec(`UPDATE ${table} SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL`);
    };
    addSyncCols('locations', ['device_id', 'updated_at', 'deleted_at']);
    addSyncCols('registers', ['device_id', 'updated_at', 'deleted_at']);
    addSyncCols('business_roles', ['device_id', 'updated_at', 'deleted_at']);
    version = 23;
    db.pragma(`user_version = ${version}`);
  }

  // 5.7: give the desktop `businesses` table a sync identity so it participates
  // in the relay. Previously it had no uuid/sync columns, which blocked the
  // business_id FK from resolving across platforms. A uuid is backfilled for any
  // pre-existing rows so existing businesses are immediately sync-addressable.
  if (version < 24) {
    const bizCols = (db.prepare('PRAGMA table_info(businesses)').all() as any[]).map((c: any) => c.name);
    const addBiz = (col: string, def: string) => { if (!bizCols.includes(col)) db.exec(`ALTER TABLE businesses ADD COLUMN ${col} ${def}`); };
    addBiz('uuid', 'TEXT');
    addBiz('device_id', 'TEXT');
    addBiz('row_version', 'INTEGER DEFAULT 1');
    addBiz('updated_at', 'TEXT');
    db.exec('UPDATE businesses SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL');
    addBiz('is_deleted', 'INTEGER DEFAULT 0');
    addBiz('deleted_at', 'TEXT');
    addBiz('is_synced', 'INTEGER DEFAULT 1');
    const genUuid = "lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))";
    db.exec(`UPDATE businesses SET uuid = ${genUuid} WHERE uuid IS NULL;`);
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_uuid ON businesses(uuid);');
    version = 24;
    db.pragma(`user_version = ${version}`);
  }

  // 5.8: give the desktop `devices` pairing registry a uuid (= its device_id) so
  // the register.deviceId FK can be translated cross-platform by uuid. The infra
  // devices table itself stays OUT of the business sync stream (it is the hub's
  // pairing registry, not the business device roster).
  if (version < 25) {
    const devCols = (db.prepare('PRAGMA table_info(devices)').all() as any[]).map((c: any) => c.name);
    if (!devCols.includes('uuid')) db.exec('ALTER TABLE devices ADD COLUMN uuid TEXT');
    db.exec('UPDATE devices SET uuid = device_id WHERE uuid IS NULL;');
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_uuid ON devices(uuid);');
    version = 25;
    db.pragma(`user_version = ${version}`);
  }

  // 5.9: device-join request channel (spec §4/5/6/26). The hub stages join
  // requests + decisions here and relays them over the WebSocket channel. It is
  // a control-plane staging table, separate from the pairing `devices` registry
  // and the business sync schema.
  if (version < 26) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS device_requests (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        code TEXT,
        joiner_device_id TEXT NOT NULL,
        joiner_name TEXT,
        joiner_model TEXT,
        joiner_user TEXT,
        role TEXT,
        platform TEXT DEFAULT 'mobile',
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        decided_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_device_requests_biz ON device_requests(business_id, status);
      CREATE TABLE IF NOT EXISTS invitations (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        name TEXT,
        role TEXT,
        platform TEXT DEFAULT 'mobile',
        created_by TEXT,
        expires_at TEXT,
        status TEXT DEFAULT 'open',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(code, status);
    `);
    version = 26;
    db.pragma(`user_version = ${version}`);
  }

  // 5.10: native roster tables. `users` (team members) and `roster_devices` are
  // the canonical mobile roster synced through the relay under entity names
  // `users` / `devices`. The legacy `devices` table stays the LAN pairing
  // registry (identity not merged), so the roster is stored under a distinct
  // table name and the field-map aliases relay `devices` -> `roster_devices`.
  if (version < 27) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        businessId INTEGER,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        role TEXT,
        roleName TEXT,
        permissions TEXT DEFAULT '{}',
        isActive INTEGER DEFAULT 1,
        isOwner INTEGER DEFAULT 0,
        pinHash TEXT,
        pinSalt TEXT,
        uuid TEXT,
        device_id TEXT,
        row_version INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_deleted INTEGER DEFAULT 0,
        deleted_at TEXT,
        is_synced INTEGER DEFAULT 1,
        FOREIGN KEY (businessId) REFERENCES businesses(id)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);

      CREATE TABLE IF NOT EXISTS roster_devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        businessId INTEGER,
        userId INTEGER,
        name TEXT NOT NULL,
        model TEXT,
        platform TEXT DEFAULT 'mobile',
        registerId INTEGER,
        role TEXT,
        status TEXT DEFAULT 'pending',
        pairingCode TEXT,
        pairingExpiresAt TEXT,
        lastSeenAt TEXT,
        lastSyncAt TEXT,
        appVersion TEXT,
        isPrimary INTEGER DEFAULT 0,
        uuid TEXT,
        device_id TEXT,
        row_version INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_deleted INTEGER DEFAULT 0,
        deleted_at TEXT,
        is_synced INTEGER DEFAULT 1,
        FOREIGN KEY (businessId) REFERENCES businesses(id),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (registerId) REFERENCES registers(id)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_roster_devices_uuid ON roster_devices(uuid);
      CREATE INDEX IF NOT EXISTS idx_roster_devices_business ON roster_devices(businessId);
    `);
    version = 27;
    db.pragma(`user_version = ${version}`);
  }

  // 5.x (§23): add LAN/cloud sync columns to stock_movements so the movement
  // ledger can participate in the shared relay as history (stock itself
  // converges via the already-synced `items` rows — movements are never used to
  // deduct on-hand stock, which avoids double-counting).
  if (version < 28) {
    const cols = db.prepare('PRAGMA table_info(stock_movements)').all() as any[];
    const names = cols.map((c: any) => c.name);
    if (!names.includes('uuid')) db.exec('ALTER TABLE stock_movements ADD COLUMN uuid TEXT');
    if (!names.includes('device_id')) db.exec('ALTER TABLE stock_movements ADD COLUMN device_id TEXT');
    if (!names.includes('businessId')) db.exec('ALTER TABLE stock_movements ADD COLUMN businessId INTEGER REFERENCES businesses(id)');
    if (!names.includes('row_version')) db.exec('ALTER TABLE stock_movements ADD COLUMN row_version INTEGER DEFAULT 1');
    if (!names.includes('updated_at')) db.exec('ALTER TABLE stock_movements ADD COLUMN updated_at TEXT');
    db.exec('UPDATE stock_movements SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL');
    if (!names.includes('is_deleted')) db.exec('ALTER TABLE stock_movements ADD COLUMN is_deleted INTEGER DEFAULT 0');
    if (!names.includes('deleted_at')) db.exec('ALTER TABLE stock_movements ADD COLUMN deleted_at TEXT');
    if (!names.includes('is_synced')) db.exec('ALTER TABLE stock_movements ADD COLUMN is_synced INTEGER DEFAULT 1');
    db.exec(`UPDATE stock_movements SET uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), row_version = 1 WHERE uuid IS NULL;`);
    // §32: add a stable cross-device identity + origin to audit_logs for merge.
    const auditCols = db.prepare('PRAGMA table_info(audit_logs)').all() as any[];
    const auditNames = auditCols.map((c: any) => c.name);
    if (!auditNames.includes('uuid')) db.exec('ALTER TABLE audit_logs ADD COLUMN uuid TEXT');
    if (!auditNames.includes('source_device')) db.exec('ALTER TABLE audit_logs ADD COLUMN source_device TEXT');
    db.exec(`UPDATE audit_logs SET uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))) WHERE uuid IS NULL;`);
    version = 28;
    db.pragma(`user_version = ${version}`);
  }

  // 5.11: audit_logs participates in the sync stream (SHARED_TABLES) but was
  // only given uuid/source_device in v28. Add the remaining sync columns the
  // change-capture/verify paths require. SQLite forbids non-constant DEFAULT
  // in ALTER TABLE ADD COLUMN, so updated_at is backfilled from createdAt.
  if (version < 29) {
    const aCols = (db.prepare('PRAGMA table_info(audit_logs)').all() as any[]).map((c: any) => c.name);
    const addA = (col: string, def: string) => { if (!aCols.includes(col)) db.exec(`ALTER TABLE audit_logs ADD COLUMN ${col} ${def}`); };
    addA('device_id', 'TEXT');
    addA('row_version', 'INTEGER DEFAULT 1');
    addA('updated_at', 'TEXT');
    addA('is_deleted', 'INTEGER DEFAULT 0');
    addA('deleted_at', 'TEXT');
    addA('is_synced', 'INTEGER DEFAULT 1');
    db.exec('UPDATE audit_logs SET updated_at = COALESCE(updated_at, createdAt, CURRENT_TIMESTAMP) WHERE updated_at IS NULL');
    version = 29;
    db.pragma(`user_version = ${version}`);
  }

  // 6.x: bring the operational entity tables (budgets, suppliers, contacts,
  // orders, shipments, employees, subscriptions) into the LAN/cloud sync stream.
  // Each gets the standard sync columns + a stable uuid so the same outbox/LWW/
  // idempotency protocol used by POS entities applies. Desktop is canonical; the
  // mobile client mirrors the same (snake/camel) column names.
  if (version < 30) {
    const opTables = ['budgets','suppliers','contacts','orders','order_items','order_history','shipments','shipment_items','shipment_history','employees','employee_accounts','employee_roles','attendance','employee_performance','subscriptions','notification_reminders'];
    for (const tbl of opTables) {
      let names: string[] = [];
      try { names = (db.prepare(`PRAGMA table_info(${tbl})`).all() as any[]).map((c: any) => c.name); } catch { continue; }
      const add = (col: string, def: string) => { if (!names.includes(col)) { try { db.exec(`ALTER TABLE ${tbl} ADD COLUMN ${col} ${def}`); } catch {} } };
      add('uuid', 'TEXT');
      add('device_id', 'TEXT');
      add('row_version', 'INTEGER DEFAULT 1');
      add('updated_at', 'TEXT');
      add('deleted_at', 'TEXT');
      add('is_deleted', 'INTEGER DEFAULT 0');
      add('is_synced', 'INTEGER DEFAULT 1');
      try { db.exec(`UPDATE ${tbl} SET updated_at = COALESCE(updated_at, createdAt, CURRENT_TIMESTAMP) WHERE updated_at IS NULL`); } catch {}
      try { db.exec(`UPDATE ${tbl} SET uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), row_version = 1 WHERE uuid IS NULL;`); } catch {}
      try { db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_${tbl}_uuid ON ${tbl}(uuid);`); } catch {}
    }
    // supplier -> optional contact link (dedicated suppliers table)
    let supN: string[] = [];
    try { supN = (db.prepare('PRAGMA table_info(suppliers)').all() as any[]).map((c: any) => c.name); } catch {}
    if (!supN.includes('contact_id')) { try { db.exec('ALTER TABLE suppliers ADD COLUMN contact_id INTEGER REFERENCES contacts(id)'); } catch {} }
    version = 30;
    db.pragma(`user_version = ${version}`);
  }

  if (version < 31) {
    // §1.7 price overrides: capture who approved an over-cap discount and why.
    const cols = (db.prepare('PRAGMA table_info(sales)').all() as any[]).map((c: any) => c.name);
    if (!cols.includes('overrideBy')) db.exec('ALTER TABLE sales ADD COLUMN overrideBy TEXT');
    if (!cols.includes('overrideReason')) db.exec('ALTER TABLE sales ADD COLUMN overrideReason TEXT');
    version = 31;
    db.pragma(`user_version = ${version}`);
  }

  // 7.x: multi-business — employees/employee_roles must be business-scoped so
  // user rosters never leak across businesses. Backfill existing rows to the
  // current/default business (the only business that existed pre-multi-business)
  // across every business-scoped table so legacy rows stay visible.
  if (version < 32) {
    const fallbackBiz = (db.prepare('SELECT id FROM businesses WHERE isDefault = 1 LIMIT 1').get() as any)?.id || 1;
    const scopeCandidates = [
      'employees', 'employee_roles',
      'categories', 'items', 'item_packs', 'item_barcodes', 'quick_products',
      'sales', 'debt_payments', 'expenses', 'adjustments', 'customers',
      'warehouses', 'returns', 'gift_cards', 'gift_card_transactions',
      'attendance', 'employee_performance', 'stock_movements',
      'suppliers', 'supplier_purchases', 'supplier_payments',
      'orders', 'order_items', 'shipments', 'shipment_items',
      'budgets', 'contacts'
    ];
    for (const t of scopeCandidates) {
      try {
        const cols = (db.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
        if (!cols.includes('businessId')) continue;
        db.exec(`UPDATE ${t} SET businessId = ${Number(fallbackBiz)} WHERE businessId IS NULL`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_${t}_businessId ON ${t}(businessId)`);
      } catch (e) {
        // table may not exist yet for the candidate list — skip safely
      }
    }
    version = 32;
    db.pragma(`user_version = ${version}`);
  }

  // 7.x: PIN employees to a register / location. Mirrors the mobile users table
  // (`assigned_register_id` / `assigned_location_id`), translated through the
  // shared field-map (uuid <-> INTEGER resolves via the register/location uuid).
  if (version < 33) {
    const uCols = (db.prepare('PRAGMA table_info(users)').all() as any[]).map((c: any) => c.name);
    if (!uCols.includes('assignedRegisterId')) db.exec('ALTER TABLE users ADD COLUMN assignedRegisterId INTEGER REFERENCES registers(id)');
    if (!uCols.includes('assignedLocationId')) db.exec('ALTER TABLE users ADD COLUMN assignedLocationId INTEGER REFERENCES locations(id)');
    version = 33;
    db.pragma(`user_version = ${version}`);
  }

  // ========== CHANGE CAPTURE TRIGGERS (run after migrations so all sync columns exist) ==========
  const syncTables: { table: string; relay?: string; id: string; columns: string[] }[] = [
    { table: 'businesses', id: 'id', columns: ['id', 'businessName', 'storeName', 'logo', 'address', 'phone', 'email', 'currency', 'isDefault', 'createdAt', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'] },
    { table: 'categories', id: 'id', columns: ['id', 'businessId', 'name', 'icon', 'isCustom', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'] },
    { table: 'items', id: 'id', columns: ['id', 'businessId', 'name', 'categoryId', 'sku', 'barcode', 'companyName', 'purchaseUnit', 'baseUnit', 'unitsPerPack', 'totalPackQuantity', 'totalBaseQuantity', 'packPurchasePrice', 'basePurchasePrice', 'baseSellingPrice', 'packSellingPrice', 'allowSellByBaseUnit', 'allowSellByPackUnit', 'expiryDate', 'qualityGrade', 'notes', 'isCredit', 'supplierPhone', 'createdAt', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'] },
    { table: 'item_packs', id: 'id', columns: ['id', 'itemId', 'packNumber', 'initialQuantity', 'currentQuantity', 'unit', 'status', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'] },
    { table: 'sales', id: 'id', columns: ['id', 'businessId', 'itemId', 'quantity', 'unit', 'unitType', 'discount', 'vat', 'totalPrice', 'paymentMethod', 'paymentStatus', 'status', 'customerName', 'customerPhone', 'packId', 'dueDate', 'paidAmount', 'createdBy', 'createdAt', 'fiscal_number', 'fiscal_signature', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced', 'overrideBy', 'overrideReason', 'voidReason', 'voidedBy', 'voidedAt'] },
    { table: 'debt_payments', id: 'id', columns: ['id', 'saleId', 'customerName', 'customerPhone', 'amount', 'type', 'note', 'createdAt', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'] },
    { table: 'returns', id: 'id', columns: ['id', 'businessId', 'saleId', 'itemId', 'quantity', 'unit', 'unitType', 'refundAmount', 'reason', 'status', 'createdBy', 'createdAt', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'] },
    { table: 'expenses', id: 'id', columns: ['id', 'businessId', 'name', 'amount', 'category', 'date', 'isRecurring', 'frequency', 'nextBillingDate', 'createdAt', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'] },
    { table: 'adjustments', id: 'id', columns: ['id', 'businessId', 'itemId', 'type', 'oldValue', 'newValue', 'quantity', 'unitType', 'reason', 'date', 'createdAt', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'] },
    { table: 'customers', id: 'id', columns: ['id', 'businessId', 'customerName', 'phone', 'secondaryPhone', 'email', 'address', 'city', 'company', 'taxNumber', 'groupName', 'creditLimit', 'notes', 'isActive', 'createdAt', 'updatedAt', 'uuid', 'device_id', 'row_version', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'] },
    { table: 'locations', id: 'id', columns: ['id', 'businessId', 'name', 'address', 'uuid', 'device_id', 'row_version', 'created_at', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'] },
    { table: 'registers', id: 'id', columns: ['id', 'businessId', 'locationId', 'name', 'deviceId', 'printerName', 'hasDrawer', 'isActive', 'uuid', 'device_id', 'row_version', 'created_at', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'] },
    { table: 'business_roles', id: 'id', columns: ['id', 'businessId', 'name', 'description', 'permissions', 'isSystem', 'builtinKey', 'uuid', 'device_id', 'row_version', 'created_at', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'] },
    { table: 'users', relay: 'users', id: 'id', columns: ['id', 'businessId', 'name', 'phone', 'email', 'role', 'roleName', 'permissions', 'isActive', 'isOwner', 'pinHash', 'pinSalt', 'uuid', 'device_id', 'row_version', 'created_at', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'] },
    { table: 'roster_devices', relay: 'devices', id: 'id', columns: ['id', 'businessId', 'userId', 'name', 'model', 'platform', 'registerId', 'role', 'status', 'pairingCode', 'pairingExpiresAt', 'lastSeenAt', 'lastSyncAt', 'appVersion', 'isPrimary', 'uuid', 'device_id', 'row_version', 'created_at', 'updated_at', 'is_deleted', 'deleted_at', 'is_synced'] },
    { table: 'budgets', id: 'id', columns: ['id','businessId','category','amount','period','month','year','budgetType','referenceName','isRecurring','notes','updatedAt','createdAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'suppliers', id: 'id', columns: ['id','businessId','supplierCode','supplierName','companyName','contactPerson','phone','secondaryPhone','email','address','city','country','taxNumber','paymentTerms','creditLimit','notes','status','isActive','createdAt','updatedAt','contact_id','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'contacts', id: 'id', columns: ['id','businessId','name','phone','category','subCategory','notes','createdAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'orders', id: 'id', columns: ['id','businessId','orderNumber','customerName','customerPhone','notes','status','totalAmount','createdBy','createdByName','createdAt','convertedAt','convertedBy','cancelledAt','cancelledBy','cancelReason','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'order_items', id: 'id', columns: ['id','orderId','itemId','itemName','quantity','unit','unitType','unitPrice','totalPrice','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'shipments', id: 'id', columns: ['id','businessId','origin','destination','driverName','driverPhone','vehicleInfo','status','notes','scheduledDate','deliveredAt','createdAt','updatedAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'shipment_items', id: 'id', columns: ['id','shipmentId','itemId','itemName','quantity','unit','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
{ table: 'employees', id: 'id', columns: ['id','businessId','employeeCode','firstName','lastName','phone','email','address','emergencyContact','gender','dateOfBirth','roleId','department','warehouseId','isActive','employmentStatus','avatar','hireDate','notes','createdAt','updatedAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
   { table: 'employee_roles', id: 'id', columns: ['id','businessId','name','description','permissions','isSystem','createdAt','updatedAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'employee_accounts', id: 'id', columns: ['id','employeeId','username','pin','isActive','forcePasswordChange','failedLoginAttempts','lockedUntil','lastPasswordChange','lastLogin','createdAt','updatedAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'notification_reminders', id: 'id', columns: ['id','businessId','title','message','category','triggerDate','repeatInterval','status','lastTriggeredAt','completedAt','snoozedUntil','relatedEntityType','relatedEntityId','createdAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'subscriptions', id: 'id', columns: ['id','businessId','planId','tier','status','startedAt','expiresAt','trialStartedAt','trialEndsAt','isTrial','autoRenew','createdAt','updatedAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'attendance', id: 'id', columns: ['id','employeeId','date','clockIn','clockOut','status','notes','createdAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'employee_performance', id: 'id', columns: ['id','employeeId','period','salesAmount','ordersProcessed','attendanceScore','tasksCompleted','rating','notes','createdAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'order_history', id: 'id', columns: ['id','orderId','status','changedBy','notes','createdAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'shipment_history', id: 'id', columns: ['id','shipmentId','status','changedBy','notes','createdAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'budget_categories', id: 'id', columns: ['id','budgetId','category','plannedAmount','notes','createdAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'budget_adjustments', id: 'id', columns: ['id','budgetId','businessId','previousAmount','newAmount','reason','status','requestedBy','approvedBy','approvedAt','createdAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'subscription_payments', id: 'id', columns: ['id','subscriptionId','transactionId','businessName','phoneNumber','planName','amount','currency','paymentDate','notes','status','verifiedAt','verifiedBy','createdAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'subscription_renewals', id: 'id', columns: ['id','subscriptionId','previousExpiry','newExpiry','plan','durationMonths','amount','createdAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'notifications', id: 'id', columns: ['id','type','title','message','category','priority','isRead','groupKey','actionUrl','actionLabel','expiresAt','createdAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] }
  ];
  const genUuid = "lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))";
  for (const t of syncTables) {
    const relayName = t.relay ?? t.table;
    const newArgs = t.columns.map((c) => `'${c}', ${c}`).join(', ');
    const oldArgs = t.columns.map((c) => `'${c}', OLD.${c}`).join(', ');
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trg_${t.table}_ai AFTER INSERT ON ${t.table} BEGIN
        UPDATE ${t.table} SET uuid = ${genUuid} WHERE ${t.id} = NEW.${t.id} AND uuid IS NULL;
        INSERT INTO sync_outbox (entity, entity_uuid, op, payload, device_id)
        SELECT '${relayName}', uuid, 'INSERT', json_object(${newArgs}), device_id FROM ${t.table} WHERE ${t.id} = NEW.${t.id};
      END;
      CREATE TRIGGER IF NOT EXISTS trg_${t.table}_au AFTER UPDATE ON ${t.table} WHEN OLD.uuid IS NOT NULL AND NEW.uuid IS NOT NULL BEGIN
        INSERT INTO sync_outbox (entity, entity_uuid, op, payload, device_id)
        SELECT '${relayName}', uuid, 'UPDATE', json_object(${newArgs}), device_id FROM ${t.table} WHERE ${t.id} = NEW.${t.id};
      END;
      CREATE TRIGGER IF NOT EXISTS trg_${t.table}_ad AFTER DELETE ON ${t.table} BEGIN
        INSERT INTO sync_outbox (entity, entity_uuid, op, payload, device_id)
        VALUES ('${relayName}', OLD.uuid, 'DELETE', json_object(${oldArgs}), OLD.device_id);
      END;
    `);
  }

  // §23: LAN/cloud sync of the inventory movement ledger. Only ADDITIVE
  // (`restock_in`) movements cross the wire. Deductions (sale_out, etc.) are
  // NOT synced as movements: on-hand stock already converges via the synced
  // `items` rows (which carry totalBaseQuantity), so syncing deduction rows
  // would risk double-counting. This keeps the movement history converged while
  // never altering stock from a relayed movement.
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_stock_movements_ai AFTER INSERT ON stock_movements
    WHEN NEW.type = 'restock_in' BEGIN
      UPDATE stock_movements SET uuid = ${genUuid} WHERE rowid = NEW.rowid AND (uuid IS NULL OR uuid = '');
      INSERT INTO sync_outbox (entity, entity_uuid, op, payload, device_id)
      SELECT 'stock_movements', uuid, 'INSERT',
        json_object('id', id, 'businessId', businessId, 'warehouseId', warehouseId, 'itemId', itemId, 'type', type, 'quantity', quantity, 'referenceId', referenceId, 'referenceType', referenceType, 'notes', notes, 'createdAt', createdAt, 'uuid', uuid, 'device_id', device_id, 'row_version', row_version, 'updated_at', updated_at, 'is_deleted', is_deleted, 'deleted_at', deleted_at, 'is_synced', is_synced),
        device_id
      FROM stock_movements WHERE rowid = NEW.rowid;
    END;
  `);

  // §32: emit local audit events into the sync outbox (append-only). The
  // receiving device dedupes by `uuid` and never edits a hashed row.
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_audit_logs_ai AFTER INSERT ON audit_logs BEGIN
      INSERT INTO sync_outbox (entity, entity_uuid, op, payload, device_id)
      SELECT 'audit_logs', uuid, 'INSERT',
        json_object('businessId', businessId, 'action', action, 'entityType', entityType, 'entityId', entityId, 'fieldName', fieldName, 'oldValue', oldValue, 'newValue', newValue, 'changedBy', changedBy, 'changedById', changedById, 'description', description, 'createdAt', createdAt, 'uuid', uuid, 'source_device', source_device),
        NEW.device_id
      FROM audit_logs WHERE id = NEW.id AND uuid IS NOT NULL;
    END;
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      orderNumber TEXT UNIQUE NOT NULL,
      customerName TEXT,
      customerPhone TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'Order',
      totalAmount REAL NOT NULL DEFAULT 0,
      createdBy INTEGER,
      createdByName TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      convertedAt TEXT,
      convertedBy TEXT,
      cancelledAt TEXT,
      cancelledBy TEXT,
      cancelReason TEXT,
      uuid TEXT UNIQUE,
      is_deleted INTEGER DEFAULT 0,
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER NOT NULL,
      itemId INTEGER,
      itemName TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT,
      unitType TEXT DEFAULT 'base',
      unitPrice REAL NOT NULL DEFAULT 0,
      totalPrice REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (itemId) REFERENCES items(id)
    );

    CREATE TABLE IF NOT EXISTS order_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER NOT NULL,
      action TEXT NOT NULL,
      performedBy TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // ========== SUBSCRIPTION SYSTEM TABLES ==========
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      tier TEXT NOT NULL CHECK(tier IN ('basic', 'premium')),
      durationMonths INTEGER NOT NULL,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'ETB',
      description TEXT,
      features TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER NOT NULL UNIQUE,
      planId INTEGER,
      tier TEXT NOT NULL DEFAULT 'basic' CHECK(tier IN ('basic', 'premium', 'trial')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'expired', 'cancelled', 'pending')),
      startedAt TEXT,
      expiresAt TEXT,
      trialStartedAt TEXT,
      trialEndsAt TEXT,
      isTrial INTEGER DEFAULT 0,
      autoRenew INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      uuid TEXT,
      device_id TEXT,
      row_version INTEGER DEFAULT 1,
      updated_at TEXT,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT,
      is_synced INTEGER DEFAULT 1,
      FOREIGN KEY (businessId) REFERENCES businesses(id),
      FOREIGN KEY (planId) REFERENCES subscription_plans(id)
    );

    CREATE TABLE IF NOT EXISTS payment_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      businessId INTEGER,
      transactionId TEXT,
      businessName TEXT NOT NULL,
      phoneNumber TEXT NOT NULL,
      selectedPlan TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'ETB',
      paymentDate TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')),
      adminNotes TEXT,
      verifiedBy INTEGER,
      verifiedAt TEXT,
      subscriptionId INTEGER,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (businessId) REFERENCES businesses(id),
      FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id)
    );

    CREATE TABLE IF NOT EXISTS subscription_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscriptionId INTEGER,
      businessId INTEGER,
      action TEXT NOT NULL,
      oldTier TEXT,
      newTier TEXT,
      oldStatus TEXT,
      newStatus TEXT,
      details TEXT,
      changedBy TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id),
      FOREIGN KEY (businessId) REFERENCES businesses(id)
    );
  `);

  // Seed subscription plans
  const planCount = db.prepare('SELECT COUNT(*) as count FROM subscription_plans').get() as any;
  if (planCount.count === 0) {
    const insertPlan = db.prepare('INSERT INTO subscription_plans (name, tier, durationMonths, price, description, features) VALUES (?, ?, ?, ?, ?, ?)');
    insertPlan.run('Basic 1 Month', 'basic', 1, 2499, 'Run your daily business.', JSON.stringify(['inventory', 'sales', 'customers', 'adjustments']));
    insertPlan.run('Basic 3 Months', 'basic', 3, 5499, 'Run your daily business.', JSON.stringify(['inventory', 'sales', 'customers', 'adjustments']));
    insertPlan.run('Premium 1 Month', 'premium', 1, 4499, 'Manage and grow your business with advanced tools.', JSON.stringify(['inventory', 'sales', 'customers', 'adjustments', 'employees', 'users', 'audit', 'suppliers', 'shipments', 'analytics', 'reports']));
    insertPlan.run('Premium 3 Months', 'premium', 3, 11499, 'Manage and grow your business with advanced tools.', JSON.stringify(['inventory', 'sales', 'customers', 'adjustments', 'employees', 'users', 'audit', 'suppliers', 'shipments', 'analytics', 'reports']));
  }

  // Initialize trial for businesses without subscription
  const bizList = db.prepare('SELECT id FROM businesses').all() as any[];
  for (const biz of bizList) {
    const existing = db.prepare('SELECT id FROM subscriptions WHERE businessId = ?').get(biz.id);
    if (!existing) {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      db.prepare(`
        INSERT INTO subscriptions (businessId, tier, status, isTrial, trialStartedAt, trialEndsAt, startedAt, expiresAt)
        VALUES (?, 'trial', 'active', 1, ?, ?, ?, ?)
      `).run(biz.id, now.toISOString(), trialEnd.toISOString(), now.toISOString(), trialEnd.toISOString());
    }
  }

  // Subscription indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_businessId ON subscriptions(businessId);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_payment_transactions_businessId ON payment_transactions(businessId);
    CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
    CREATE INDEX IF NOT EXISTS idx_subscription_history_subscriptionId ON subscription_history(subscriptionId);
  `);

  // Performance indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_items_businessId ON items(businessId);
    CREATE INDEX IF NOT EXISTS idx_items_categoryId ON items(categoryId);
    CREATE INDEX IF NOT EXISTS idx_items_totalBaseQuantity ON items(totalBaseQuantity);
    CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
    CREATE INDEX IF NOT EXISTS idx_items_createdAt ON items(createdAt);
    CREATE INDEX IF NOT EXISTS idx_sales_businessId ON sales(businessId);
    CREATE INDEX IF NOT EXISTS idx_sales_itemId ON sales(itemId);
    CREATE INDEX IF NOT EXISTS idx_sales_createdAt ON sales(createdAt);
    CREATE INDEX IF NOT EXISTS idx_sales_paymentStatus ON sales(paymentStatus);
    CREATE INDEX IF NOT EXISTS idx_sales_customerName ON sales(customerName);
    CREATE INDEX IF NOT EXISTS idx_returns_businessId ON returns(businessId);
    CREATE INDEX IF NOT EXISTS idx_returns_saleId ON returns(saleId);
    CREATE INDEX IF NOT EXISTS idx_expenses_businessId ON expenses(businessId);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
    CREATE INDEX IF NOT EXISTS idx_adjustments_businessId ON adjustments(businessId);
    CREATE INDEX IF NOT EXISTS idx_adjustments_itemId ON adjustments(itemId);
    CREATE INDEX IF NOT EXISTS idx_adjustments_type ON adjustments(type);
    CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_warehouseId ON warehouse_inventory(warehouseId);
    CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_itemId ON warehouse_inventory(itemId);
    CREATE INDEX IF NOT EXISTS idx_stock_transfers_businessId ON stock_transfers(businessId);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouseId ON stock_movements(warehouseId);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_itemId ON stock_movements(itemId);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_createdAt ON stock_movements(createdAt);
    CREATE INDEX IF NOT EXISTS idx_attendance_employeeId ON attendance(employeeId);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
    CREATE INDEX IF NOT EXISTS idx_login_history_accountId ON login_history(accountId);
    CREATE INDEX IF NOT EXISTS idx_login_history_employeeId ON login_history(employeeId);
    CREATE INDEX IF NOT EXISTS idx_employee_performance_employeeId ON employee_performance(employeeId);
    CREATE INDEX IF NOT EXISTS idx_notifications_businessId ON notifications(businessId);
    CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON notifications(createdAt);
    CREATE INDEX IF NOT EXISTS idx_notifications_isRead ON notifications(isRead);
    CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
    CREATE INDEX IF NOT EXISTS idx_notifications_businessId_isRead ON notifications(businessId, isRead);
    CREATE INDEX IF NOT EXISTS idx_notif_banners_businessId ON notification_banners(businessId);
    CREATE INDEX IF NOT EXISTS idx_notif_reminders_businessId ON notification_reminders(businessId);
    CREATE INDEX IF NOT EXISTS idx_debt_payments_saleId ON debt_payments(saleId);
    CREATE INDEX IF NOT EXISTS idx_draft_sales_businessId ON draft_sales(businessId);
    CREATE INDEX IF NOT EXISTS idx_contacts_businessId ON contacts(businessId);
    CREATE INDEX IF NOT EXISTS idx_budgets_businessId ON budgets(businessId);
    CREATE INDEX IF NOT EXISTS idx_supplier_price_checks_supplierId ON supplier_price_checks(supplierId);
    CREATE INDEX IF NOT EXISTS idx_notif_reminders_status ON notification_reminders(status);
    CREATE INDEX IF NOT EXISTS idx_notif_reminders_triggerDate ON notification_reminders(triggerDate);
    CREATE INDEX IF NOT EXISTS idx_employees_roleId ON employees(roleId);
    CREATE INDEX IF NOT EXISTS idx_employees_isActive ON employees(isActive);
    CREATE INDEX IF NOT EXISTS idx_employee_accounts_employeeId ON employee_accounts(employeeId);
    CREATE INDEX IF NOT EXISTS idx_employee_accounts_username ON employee_accounts(username);
    CREATE INDEX IF NOT EXISTS idx_shipments_businessId ON shipments(businessId);
    CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
    CREATE INDEX IF NOT EXISTS idx_items_expiryDate ON items(expiryDate);
    CREATE INDEX IF NOT EXISTS idx_items_companyName ON items(companyName);
    CREATE INDEX IF NOT EXISTS idx_sales_dueDate ON sales(dueDate);
    CREATE INDEX IF NOT EXISTS idx_stock_transfers_from ON stock_transfers(fromWarehouseId);
    CREATE INDEX IF NOT EXISTS idx_stock_transfers_to ON stock_transfers(toWarehouseId);
    CREATE INDEX IF NOT EXISTS idx_customers_businessId ON customers(businessId);
    CREATE INDEX IF NOT EXISTS idx_customers_groupName ON customers(groupName);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_customer_notes_customerId ON customer_notes(customerId);
    CREATE INDEX IF NOT EXISTS idx_suppliers_businessId ON suppliers(businessId);
    CREATE INDEX IF NOT EXISTS idx_suppliers_supplierName ON suppliers(supplierName);
    CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON suppliers(phone);
    CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
    CREATE INDEX IF NOT EXISTS idx_supplier_purchases_supplierId ON supplier_purchases(supplierId);
    CREATE INDEX IF NOT EXISTS idx_supplier_purchases_businessId ON supplier_purchases(businessId);
    CREATE INDEX IF NOT EXISTS idx_supplier_purchases_purchaseDate ON supplier_purchases(purchaseDate);
    CREATE INDEX IF NOT EXISTS idx_supplier_purchases_status ON supplier_purchases(status);
    CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplierId ON supplier_payments(supplierId);
    CREATE INDEX IF NOT EXISTS idx_supplier_payments_purchaseId ON supplier_payments(purchaseId);
    CREATE INDEX IF NOT EXISTS idx_supplier_payments_paymentDate ON supplier_payments(paymentDate);
    CREATE INDEX IF NOT EXISTS idx_orders_businessId ON orders(businessId);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON orders(createdAt);
    CREATE INDEX IF NOT EXISTS idx_orders_customerName ON orders(customerName);
    CREATE INDEX IF NOT EXISTS idx_order_items_orderId ON order_items(orderId);
    CREATE INDEX IF NOT EXISTS idx_order_history_orderId ON order_history(orderId);
  `);

  // ========== UPDATED_AT TRIGGERS ==========
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_items_updated AFTER UPDATE ON items
    BEGIN UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

    CREATE TRIGGER IF NOT EXISTS trg_sales_updated AFTER UPDATE ON sales
    BEGIN UPDATE sales SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

    CREATE TRIGGER IF NOT EXISTS trg_customers_updated AFTER UPDATE ON customers
    BEGIN UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

    CREATE TRIGGER IF NOT EXISTS trg_suppliers_updated AFTER UPDATE ON suppliers
    BEGIN UPDATE suppliers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

    CREATE TRIGGER IF NOT EXISTS trg_expenses_updated AFTER UPDATE ON expenses
    BEGIN UPDATE expenses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

    CREATE TRIGGER IF NOT EXISTS trg_adjustments_updated AFTER UPDATE ON adjustments
    BEGIN UPDATE adjustments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

    CREATE TRIGGER IF NOT EXISTS trg_employees_updated AFTER UPDATE ON employees
    BEGIN UPDATE employees SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

    CREATE TRIGGER IF NOT EXISTS trg_employee_accounts_updated AFTER UPDATE ON employee_accounts
    BEGIN UPDATE employee_accounts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
  `);

  // Seed: Ensure at least one business exists
  let businessId = 1;
  const bizCount = db.prepare('SELECT COUNT(*) as count FROM businesses').get() as any;
  if (bizCount.count === 0) {
    const res = db.prepare('INSERT INTO businesses (businessName, storeName, isDefault) VALUES (?, ?, 1)')
      .run('Shega Enterprise', 'Main Branch');
    businessId = res.lastInsertRowid as number;
    db.prepare('UPDATE categories SET businessId = ? WHERE businessId IS NULL').run(businessId);
    db.prepare('UPDATE items SET businessId = ? WHERE businessId IS NULL').run(businessId);
    db.prepare('UPDATE sales SET businessId = ? WHERE businessId IS NULL').run(businessId);
    db.prepare('UPDATE expenses SET businessId = ? WHERE businessId IS NULL').run(businessId);
    db.prepare('UPDATE adjustments SET businessId = ? WHERE businessId IS NULL').run(businessId);
    db.prepare('UPDATE notifications SET businessId = ? WHERE businessId IS NULL').run(businessId);
  } else {
    const defaultBiz = db.prepare('SELECT id FROM businesses WHERE isDefault = 1 LIMIT 1').get() as any;
    businessId = defaultBiz?.id || 1;
  }

  // Seed default warehouse
  const warehouseCount = db.prepare('SELECT COUNT(*) as count FROM warehouses').get() as any;
  if (warehouseCount.count === 0) {
    db.prepare('INSERT INTO warehouses (businessId, name, location, managerName) VALUES (?, ?, ?, ?)')
      .run(businessId, 'Main Warehouse', 'Headquarters', 'Operations Manager');
  }

  // Seed 10 default employee roles
  const roleCount = db.prepare('SELECT COUNT(*) as count FROM employee_roles').get() as any;
  if (roleCount.count === 0) {
    const insertRole = db.prepare('INSERT INTO employee_roles (name, description, permissions, isSystem) VALUES (?, ?, ?, 1)');
    for (const role of DEFAULT_ROLES) {
      insertRole.run(role.name, role.description, JSON.stringify(role.permissions));
    }
  }

  // Migration: Add settings.backup to Administrator role
  const adminRole = db.prepare("SELECT id, permissions FROM employee_roles WHERE name = 'Administrator' LIMIT 1").get() as any;
  if (adminRole) {
    const perms: string[] = JSON.parse(adminRole.permissions || '[]');
    if (!perms.includes('settings.backup')) {
      perms.push('settings.backup');
      perms.sort();
      db.prepare('UPDATE employee_roles SET permissions = ? WHERE id = ?').run(JSON.stringify(perms), adminRole.id);
    }
  }

  // Migration: hash any existing plain-text admin PINs using scrypt
  const plainPinAdmins = db.prepare("SELECT id, pin FROM admins WHERE length(pin) < 64").all() as any[];
  for (const a of plainPinAdmins) {
    const hashed = hashPin(a.pin);
    db.prepare('UPDATE admins SET pin = ? WHERE id = ?').run(hashed, a.id);
  }

  // Seed default super admin if no admins exist, and migrate to employee system
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get() as any;
  if (adminCount.count === 0) {
    const ownerRole = db.prepare("SELECT id FROM employee_roles WHERE name = 'Owner' LIMIT 1").get() as any;
    const roleId = ownerRole?.id || 1;
    const empResult = db.prepare(
      'INSERT INTO employees (firstName, lastName, roleId, isActive, hireDate) VALUES (?, ?, ?, ?, ?)'
    ).run('Super', 'Admin', roleId, 1, new Date().toISOString().split('T')[0]);
    const empId = empResult.lastInsertRowid as number;
    const hash = hashPin('1234');
    db.prepare(
      'INSERT INTO employee_accounts (employeeId, username, pin, isActive, forcePasswordChange) VALUES (?, ?, ?, ?, ?)'
    ).run(empId, 'admin', hash, 1, 1);
    db.prepare(
      'INSERT INTO admins (name, username, pin, role, permissions) VALUES (?, ?, ?, ?, ?)'
    ).run('Super Admin', 'admin', hash, 'super_admin', JSON.stringify(ALL_PERMISSIONS));
  }

  // Migration: Import existing customer names from sales into customers table
  const existingCustomerNames = db.prepare("SELECT DISTINCT customerName, customerPhone FROM sales WHERE customerName IS NOT NULL AND customerName != ''").all() as any[];
  for (const c of existingCustomerNames) {
    const alreadyExists = db.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(c.customerName, businessId);
    if (!alreadyExists) {
      db.prepare("INSERT INTO customers (businessId, customerName, phone) VALUES (?, ?, ?)").run(businessId, c.customerName, c.customerPhone || '');
    }
  }

  // Seed default notification preferences
  const prefCount = (db.prepare('SELECT COUNT(*) AS c FROM notification_preferences').get() as any).c;
  if (prefCount === 0) {
    const defaultPrefs = [
      // Inventory
      { key: 'inventory.low_stock', desktop: 1, inApp: 1, email: 0, sound: 1 },
      { key: 'inventory.out_of_stock', desktop: 1, inApp: 1, email: 1, sound: 1 },
      { key: 'inventory.expiring', desktop: 1, inApp: 1, email: 0, sound: 1 },
      { key: 'inventory.adjustment', desktop: 0, inApp: 1, email: 0, sound: 0 },
      // Sales
      { key: 'sales.completed', desktop: 0, inApp: 1, email: 0, sound: 1 },
      { key: 'sales.refund', desktop: 1, inApp: 1, email: 0, sound: 1 },
      // Customers
      { key: 'customers.overdue_balance', desktop: 1, inApp: 1, email: 0, sound: 1 },
      { key: 'customers.payment_due', desktop: 0, inApp: 1, email: 0, sound: 0 },
      // Suppliers
      { key: 'suppliers.overdue_balance', desktop: 1, inApp: 1, email: 0, sound: 1 },
      { key: 'suppliers.payment_due', desktop: 1, inApp: 1, email: 0, sound: 0 },
      { key: 'suppliers.purchase_received', desktop: 0, inApp: 1, email: 0, sound: 0 },
      // Expenses
      { key: 'expenses.recurring_due', desktop: 1, inApp: 1, email: 0, sound: 1 },
      { key: 'expenses.overdue', desktop: 1, inApp: 1, email: 0, sound: 1 },
      // System
      { key: 'system.backup_complete', desktop: 1, inApp: 1, email: 1, sound: 0 },
      { key: 'system.backup_reminder', desktop: 0, inApp: 1, email: 0, sound: 0 },
      { key: 'system.update_available', desktop: 0, inApp: 1, email: 0, sound: 0 },
      { key: 'system.license_expiring', desktop: 1, inApp: 1, email: 1, sound: 1 },
      // Employees
      { key: 'employees.account_locked', desktop: 1, inApp: 1, email: 1, sound: 1 },
      { key: 'employees.shift_reminder', desktop: 0, inApp: 1, email: 0, sound: 0 },
    ];
    const insertPref = db.prepare(`
      INSERT INTO notification_preferences (key, enabled, sound, desktop, email, inApp)
      VALUES (?, 1, ?, ?, ?, ?)
    `);
    for (const p of defaultPrefs) insertPref.run(p.key, p.sound, p.desktop, p.email, p.inApp);
  }

  // Migration: Create supplier_activity_log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS supplier_activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplierId INTEGER NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      entityType TEXT,
      entityId INTEGER,
      createdBy TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE CASCADE
    )
  `);

  // Index for faster supplier-item lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_items_supplierId ON items(supplierId);
  `);

  // Migration: Create purchase records for existing items linked to a supplier that don't have one yet
  const missingPurchases = db.prepare(`
    SELECT i.id, i.name, i.supplierId, i.totalBaseQuantity, i.basePurchasePrice, i.baseSellingPrice,
           i.isCredit, i.baseUnit, i.businessId
    FROM items i
    WHERE i.supplierId IS NOT NULL
      AND i.supplierId > 0
      AND i.totalBaseQuantity > 0
      AND i.is_deleted = 0
      AND NOT EXISTS (
        SELECT 1 FROM supplier_purchase_items spi
        JOIN supplier_purchases sp ON sp.id = spi.purchaseId AND sp.status != 'cancelled'
        WHERE spi.itemId = i.id
      )
  `).all() as any[];
  const insPurchase = db.prepare(`
    INSERT INTO supplier_purchases (businessId, supplierId, purchaseNumber, purchaseDate, totalAmount, paidAmount, status, notes, createdBy)
    VALUES (?, ?, ?, date('now'), ?, ?, ?, ?, 'system')
  `);
  const insItem = db.prepare(`
    INSERT INTO supplier_purchase_items (purchaseId, itemId, itemName, sku, quantity, unit, unitPrice, totalPrice)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const getPurchaseId = db.prepare('SELECT last_insert_rowid() AS id');
  for (const item of missingPurchases) {
    try {
      const unitPrice = item.basePurchasePrice || item.baseSellingPrice || 0;
      const totalAmount = unitPrice * item.totalBaseQuantity;
      const paidAmount = item.isCredit ? 0 : totalAmount;
      const status = item.isCredit ? 'pending' : 'received';
      const purchaseNumber = `PO-AUTO-${Date.now()}-${item.id}`;
      insPurchase.run(item.businessId || 1, item.supplierId, purchaseNumber, totalAmount, paidAmount, status, `Auto-created from inventory item "${item.name}"`);
      const pid = getPurchaseId.get() as any;
      insItem.run(pid.id, item.id, item.name, null, item.totalBaseQuantity, item.baseUnit || 'pcs', unitPrice, totalAmount);
    } catch (_) {}
  }

  // ========== AUDIT/REVERSAL SYSTEM MIGRATIONS ==========

  // Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_items_deleted_by ON items(deleted_by);
    CREATE INDEX IF NOT EXISTS idx_customers_deleted_by ON customers(deleted_by);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_businessId ON audit_logs(businessId);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entityType ON audit_logs(entityType);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_createdAt ON audit_logs(createdAt);
    CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
    CREATE INDEX IF NOT EXISTS idx_debt_payments_reversalId ON debt_payments(reversalId);
    CREATE INDEX IF NOT EXISTS idx_supplier_payments_reversalId ON supplier_payments(reversalId);
    CREATE INDEX IF NOT EXISTS idx_adjustments_reversalId ON adjustments(reversalId);
  `);

  // Migration: Add new audit/reversal permissions to all system roles that have related permissions
  const allRoles = db.prepare("SELECT id, name, permissions, isSystem FROM employee_roles").all() as any[];
  const newPerms = ['audit.view', 'audit.export', 'sales.void', 'payments.reverse', 'adjustments.reverse', 'records.restore', 'orders.view', 'orders.create', 'orders.edit', 'orders.delete', 'orders.convert', 'orders.cancel'];
  for (const role of allRoles) {
    if (!role.isSystem) continue;
    const perms: string[] = JSON.parse(role.permissions || '[]');
    let changed = false;
    for (const np of newPerms) {
      if (!perms.includes(np)) {
        perms.push(np);
        changed = true;
      }
    }
    if (changed) {
      perms.sort();
      db.prepare('UPDATE employee_roles SET permissions = ? WHERE id = ?').run(JSON.stringify(perms), role.id);
    }
  }

  // Also update legacy admins with super_admin role to include new perms
  const allAdmins = db.prepare("SELECT id, permissions FROM admins").all() as any[];
  for (const adm of allAdmins) {
    if (!adm.permissions) continue;
    const perms: string[] = JSON.parse(adm.permissions || '[]');
    let changed = false;
    for (const np of newPerms) {
      if (!perms.includes(np)) {
        perms.push(np);
        changed = true;
      }
    }
    if (changed) {
      perms.sort();
      db.prepare('UPDATE admins SET permissions = ? WHERE id = ?').run(JSON.stringify(perms), adm.id);
    }
  }


}

export { ALL_PERMISSIONS, DEFAULT_ROLES };

export function validateDBFile(filePath: string): { ok: boolean; message?: string } {
  try {
    const chk = new Database(filePath, { readonly: true, fileMustExist: true });
    const integrity = chk.pragma('integrity_check', { simple: true }) as string | string[];
    const result = Array.isArray(integrity) ? integrity[0] : integrity;
    chk.close();
    return result === 'ok' ? { ok: true } : { ok: false, message: `integrity_check: ${result}` };
  } catch (e: any) {
    return { ok: false, message: e?.message || String(e) };
  }
}

export function reopenDB(): void {
  db.close();
  const wal = `${dbPath}-wal`;
  const shm = `${dbPath}-shm`;
  try { if (existsSync(wal)) unlinkSync(wal); } catch {}
  try { if (existsSync(shm)) unlinkSync(shm); } catch {}
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');
  (module as any).exports.default = db;
}
