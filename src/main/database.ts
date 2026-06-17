import crypto from 'crypto';
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

const isDev = !app.isPackaged;
const dbDir = isDev 
  ? path.join(process.cwd(), 'db') 
  : path.join(app.getPath('userData'), 'db');

if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'shega_desktop.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

// Run integrity check on startup, log result
try {
  const integrity = db.pragma('integrity_check', { simple: true }) as string | string[];
  const result = Array.isArray(integrity) ? integrity[0] : integrity;
  if (result !== 'ok') {
    console.error(`[DB] Integrity check failed: ${Array.isArray(integrity) ? integrity.join(', ') : integrity}`);
  }
} catch (_) { /* integrity_check may fail on empty DB */ }

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
  'audit.view', 'audit.export', 'sales.void', 'payments.reverse', 'adjustments.reverse', 'records.restore'
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
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
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
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
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
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
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
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
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
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId INTEGER REFERENCES employees(id),
      action TEXT NOT NULL,
      entityType TEXT,
      entityId INTEGER,
      details TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
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

  // Migration: add new columns to notifications if missing
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
    CREATE INDEX IF NOT EXISTS idx_activity_logs_createdAt ON activity_logs(createdAt);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_entityType ON activity_logs(entityType);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_employeeId ON activity_logs(employeeId);
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
  `);

  // Migration: Add columns to employees if missing
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

  // Migration: Add columns to employee_accounts if missing
  const acctColumns = db.prepare("PRAGMA table_info(employee_accounts)").all() as any[];
  const acctColNames = acctColumns.map((c: any) => c.name);
  if (!acctColNames.includes('forcePasswordChange')) db.exec("ALTER TABLE employee_accounts ADD COLUMN forcePasswordChange INTEGER DEFAULT 0");
  if (!acctColNames.includes('failedLoginAttempts')) db.exec("ALTER TABLE employee_accounts ADD COLUMN failedLoginAttempts INTEGER DEFAULT 0");
  if (!acctColNames.includes('lockedUntil')) db.exec("ALTER TABLE employee_accounts ADD COLUMN lockedUntil TEXT");
  if (!acctColNames.includes('lastPasswordChange')) db.exec("ALTER TABLE employee_accounts ADD COLUMN lastPasswordChange TEXT");

  // Migration: Add createdBy to sales if missing
  const salesColumns = db.prepare("PRAGMA table_info(sales)").all() as any[];
  let salesColNames = salesColumns.map((c: any) => c.name);
  if (!salesColNames.includes('createdBy')) db.exec("ALTER TABLE sales ADD COLUMN createdBy INTEGER");

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

  // Migration: Add supplier columns if missing (favorites, performance)
  const supColumns = db.prepare("PRAGMA table_info(suppliers)").all() as any[];
  const supColNames = supColumns.map((c: any) => c.name);
  if (!supColNames.includes('businessId')) db.exec("ALTER TABLE suppliers ADD COLUMN businessId INTEGER REFERENCES businesses(id)");
  if (!supColNames.includes('isFavorite')) db.exec("ALTER TABLE suppliers ADD COLUMN isFavorite INTEGER DEFAULT 0");
  if (!supColNames.includes('performanceScore')) db.exec("ALTER TABLE suppliers ADD COLUMN performanceScore REAL DEFAULT 0");
  if (!supColNames.includes('lastActivityDate')) db.exec("ALTER TABLE suppliers ADD COLUMN lastActivityDate TEXT");

  // Migration: Ensure supplier_purchases and supplier_payments have businessId
  const spColumns = db.prepare("PRAGMA table_info(supplier_purchases)").all() as any[];
  const spColNames = spColumns.map((c: any) => c.name);
  if (!spColNames.includes('businessId')) db.exec("ALTER TABLE supplier_purchases ADD COLUMN businessId INTEGER REFERENCES businesses(id)");

  const spPayColumns = db.prepare("PRAGMA table_info(supplier_payments)").all() as any[];
  const spPayColNames = spPayColumns.map((c: any) => c.name);
  if (!spPayColNames.includes('businessId')) db.exec("ALTER TABLE supplier_payments ADD COLUMN businessId INTEGER REFERENCES businesses(id)");

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

  // Migration: Add supplierId to items table for direct supplier-product link
  const itemColumns = db.prepare("PRAGMA table_info(items)").all() as any[];
  let itemColNames = itemColumns.map((c: any) => c.name);
  if (!itemColNames.includes('supplierId')) {
    db.exec("ALTER TABLE items ADD COLUMN supplierId INTEGER REFERENCES suppliers(id)");
  }
  if (!itemColNames.includes('lastPurchaseDate')) {
    db.exec("ALTER TABLE items ADD COLUMN lastPurchaseDate TEXT");
  }
  if (!itemColNames.includes('lastPurchasePrice')) {
    db.exec("ALTER TABLE items ADD COLUMN lastPurchasePrice REAL DEFAULT 0");
  }

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

  // Sales void fields
  const salesCols = db.prepare("PRAGMA table_info(sales)").all() as any[];
  salesColNames = salesCols.map((c: any) => c.name);
  if (!salesColNames.includes('status')) db.exec("ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'Active'");
  if (!salesColNames.includes('voidReason')) db.exec("ALTER TABLE sales ADD COLUMN voidReason TEXT");
  if (!salesColNames.includes('voidedBy')) db.exec("ALTER TABLE sales ADD COLUMN voidedBy TEXT");
  if (!salesColNames.includes('voidedAt')) db.exec("ALTER TABLE sales ADD COLUMN voidedAt TEXT");

  // Debt payment reversal fields
  const dpCols = db.prepare("PRAGMA table_info(debt_payments)").all() as any[];
  const dpColNames = dpCols.map((c: any) => c.name);
  if (!dpColNames.includes('reversalId')) db.exec("ALTER TABLE debt_payments ADD COLUMN reversalId INTEGER");
  if (!dpColNames.includes('reversalReason')) db.exec("ALTER TABLE debt_payments ADD COLUMN reversalReason TEXT");
  if (!dpColNames.includes('reversedBy')) db.exec("ALTER TABLE debt_payments ADD COLUMN reversedBy TEXT");
  if (!dpColNames.includes('reversalDate')) db.exec("ALTER TABLE debt_payments ADD COLUMN reversalDate TEXT");

  // Supplier payment reversal fields
  const supPayCols = db.prepare("PRAGMA table_info(supplier_payments)").all() as any[];
  const supPayColNames = supPayCols.map((c: any) => c.name);
  if (!supPayColNames.includes('reversalId')) db.exec("ALTER TABLE supplier_payments ADD COLUMN reversalId INTEGER");
  if (!supPayColNames.includes('reversalReason')) db.exec("ALTER TABLE supplier_payments ADD COLUMN reversalReason TEXT");
  if (!supPayColNames.includes('reversedBy')) db.exec("ALTER TABLE supplier_payments ADD COLUMN reversedBy TEXT");
  if (!supPayColNames.includes('reversalDate')) db.exec("ALTER TABLE supplier_payments ADD COLUMN reversalDate TEXT");

  // Adjustment reversal fields
  const adjCols = db.prepare("PRAGMA table_info(adjustments)").all() as any[];
  const adjColNames = adjCols.map((c: any) => c.name);
  if (!adjColNames.includes('reversalId')) db.exec("ALTER TABLE adjustments ADD COLUMN reversalId INTEGER");
  if (!adjColNames.includes('reversalReason')) db.exec("ALTER TABLE adjustments ADD COLUMN reversalReason TEXT");
  if (!adjColNames.includes('reversedBy')) db.exec("ALTER TABLE adjustments ADD COLUMN reversedBy TEXT");
  if (!adjColNames.includes('reversalDate')) db.exec("ALTER TABLE adjustments ADD COLUMN reversalDate TEXT");

  // Soft delete fields for items
  const itemCols = db.prepare("PRAGMA table_info(items)").all() as any[];
  itemColNames = itemCols.map((c: any) => c.name);
  if (!itemColNames.includes('deleted_by')) db.exec("ALTER TABLE items ADD COLUMN deleted_by TEXT");
  if (!itemColNames.includes('deleted_at')) db.exec("ALTER TABLE items ADD COLUMN deleted_at TEXT");

  // Soft delete fields for customers
  const custCols = db.prepare("PRAGMA table_info(customers)").all() as any[];
  const custColNames = custCols.map((c: any) => c.name);
  if (!custColNames.includes('is_deleted')) db.exec("ALTER TABLE customers ADD COLUMN is_deleted INTEGER DEFAULT 0");
  if (!custColNames.includes('deleted_by')) db.exec("ALTER TABLE customers ADD COLUMN deleted_by TEXT");
  if (!custColNames.includes('deleted_at')) db.exec("ALTER TABLE customers ADD COLUMN deleted_at TEXT");

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
  const newPerms = ['audit.view', 'audit.export', 'sales.void', 'payments.reverse', 'adjustments.reverse', 'records.restore'];
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

  // Migration: Backfill audit_logs from existing activity_logs
  const auditCount = (db.prepare("SELECT COUNT(*) as c FROM audit_logs").get() as any).c;
  if (auditCount === 0) {
    const bizId = (db.prepare("SELECT value FROM settings WHERE key = 'active_business_id'").get() as any)?.value;
    if (bizId) {
      const existing = db.prepare("SELECT id, action, entityType, entityId, details, createdAt FROM activity_logs ORDER BY createdAt ASC").all() as any[];
      const insert = db.prepare('INSERT INTO audit_logs (businessId, action, entityType, entityId, fieldName, oldValue, newValue, changedBy, changedById, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      const tx = db.transaction(() => {
        for (const row of existing) {
          let changedBy = null;
          if (row.details) {
            const m = row.details.match(/— by (.+)$/);
            if (m) changedBy = m[1];
          }
          insert.run(bizId, row.action, row.entityType || null, row.entityId || null, null, null, null, changedBy || 'system', null, row.details, row.createdAt);
        }
      });
      tx();
    }
  }
}

export { ALL_PERMISSIONS, DEFAULT_ROLES };
export default db;
