"use strict";
const electron = require("electron");
const path = require("path");
const crypto = require("crypto");
const Database = require("better-sqlite3");
const fs = require("fs");
const isDev = !electron.app.isPackaged;
const dbDir = isDev ? path.join(process.cwd(), "db") : path.join(electron.app.getPath("userData"), "db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, "shega_desktop.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");
db.pragma("foreign_keys = ON");
try {
  const integrity = db.pragma("integrity_check", { simple: true });
  const result = Array.isArray(integrity) ? integrity[0] : integrity;
  if (result !== "ok") {
    console.error(`[DB] Integrity check failed: ${Array.isArray(integrity) ? integrity.join(", ") : integrity}`);
  }
} catch (_) {
}
const ALL_PERMISSIONS = [
  "dashboard",
  "inventory.view",
  "inventory.add",
  "inventory.edit",
  "inventory.delete",
  "inventory.adjust",
  "inventory.transfer",
  "sales.create",
  "sales.edit",
  "sales.cancel",
  "sales.returns",
  "sales.invoices",
  "purchases.create",
  "purchases.edit",
  "purchases.approve",
  "purchases.receive",
  "customers.view",
  "customers.add",
  "customers.edit",
  "customers.delete",
  "suppliers.view",
  "suppliers.add",
  "suppliers.edit",
  "suppliers.delete",
  "suppliers",
  "warehouses.view",
  "warehouses.create",
  "warehouses.edit",
  "warehouses.transfer",
  "expenses.view",
  "expenses.add",
  "expenses.edit",
  "expenses.delete",
  "reports.view",
  "reports.profits",
  "employees.view",
  "employees.add",
  "employees.edit",
  "employees.delete",
  "employees.attendance",
  "employees.performance",
  "settings.manage",
  "settings.users",
  "settings.roles",
  "settings.backup",
  "audit.view",
  "audit.export",
  "sales.void",
  "payments.reverse",
  "adjustments.reverse",
  "records.restore",
  "orders.view",
  "orders.create",
  "orders.edit",
  "orders.delete",
  "orders.convert",
  "orders.cancel"
];
const DEFAULT_ROLES = [
  { name: "Owner", description: "Full system access and control", permissions: ALL_PERMISSIONS },
  { name: "Administrator", description: "System administration with all operational permissions", permissions: [...ALL_PERMISSIONS.filter((p) => !p.startsWith("settings.")), "settings.backup"] },
  { name: "Manager", description: "Oversee daily operations across all departments", permissions: ["dashboard", "inventory.view", "inventory.add", "inventory.edit", "inventory.adjust", "inventory.transfer", "sales.create", "sales.edit", "sales.cancel", "sales.returns", "sales.invoices", "purchases.create", "purchases.edit", "purchases.approve", "purchases.receive", "customers.view", "customers.add", "customers.edit", "suppliers.view", "suppliers.add", "suppliers.edit", "warehouses.view", "warehouses.transfer", "expenses.view", "expenses.add", "expenses.edit", "reports.view", "reports.profits", "employees.view", "employees.add", "employees.edit"] },
  { name: "Accountant", description: "Financial operations and reporting", permissions: ["dashboard", "inventory.view", "sales.view", "purchases.view", "customers.view", "suppliers.view", "expenses.view", "expenses.add", "expenses.edit", "expenses.delete", "reports.view", "reports.profits"] },
  { name: "Cashier", description: "Process sales transactions", permissions: ["dashboard", "inventory.view", "sales.create", "sales.invoices", "customers.view", "customers.add"] },
  { name: "Inventory Manager", description: "Manage stock levels and warehouse operations", permissions: ["dashboard", "inventory.view", "inventory.add", "inventory.edit", "inventory.adjust", "inventory.transfer", "purchases.receive", "warehouses.view", "warehouses.edit", "warehouses.transfer", "reports.view"] },
  { name: "Warehouse Staff", description: "Handle stock movement and organization", permissions: ["inventory.view", "inventory.adjust", "inventory.transfer", "warehouses.view", "warehouses.transfer"] },
  { name: "Purchasing Officer", description: "Manage purchase orders and supplier relations", permissions: ["dashboard", "inventory.view", "purchases.create", "purchases.edit", "purchases.approve", "purchases.receive", "suppliers.view", "suppliers.add", "suppliers.edit", "suppliers.delete", "reports.view"] },
  { name: "Sales Representative", description: "Customer-facing sales and relationship management", permissions: ["dashboard", "inventory.view", "sales.create", "sales.edit", "sales.invoices", "customers.view", "customers.add", "customers.edit"] },
  { name: "Driver", description: "Handle shipments and deliveries", permissions: ["shipments", "inventory.view", "warehouses.view"] }
];
function hashPin$1(pin) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = crypto.scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${key}`;
}
function initDB() {
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
  const notifCols = db.prepare("PRAGMA table_info(notifications)").all();
  const notifColNames = notifCols.map((c) => c.name);
  if (!notifColNames.includes("category")) db.exec("ALTER TABLE notifications ADD COLUMN category TEXT DEFAULT 'system'");
  if (!notifColNames.includes("severity")) db.exec("ALTER TABLE notifications ADD COLUMN severity TEXT DEFAULT 'info'");
  if (!notifColNames.includes("actionUrl")) db.exec("ALTER TABLE notifications ADD COLUMN actionUrl TEXT");
  if (!notifColNames.includes("actionLabel")) db.exec("ALTER TABLE notifications ADD COLUMN actionLabel TEXT");
  if (!notifColNames.includes("entityType")) db.exec("ALTER TABLE notifications ADD COLUMN entityType TEXT");
  if (!notifColNames.includes("entityId")) db.exec("ALTER TABLE notifications ADD COLUMN entityId INTEGER");
  if (!notifColNames.includes("isDismissed")) db.exec("ALTER TABLE notifications ADD COLUMN isDismissed INTEGER DEFAULT 0");
  if (!notifColNames.includes("snoozedUntil")) db.exec("ALTER TABLE notifications ADD COLUMN snoozedUntil TEXT");
  if (!notifColNames.includes("channels")) db.exec("ALTER TABLE notifications ADD COLUMN channels TEXT DEFAULT 'in_app'");
  if (!notifColNames.includes("requiresAction")) db.exec("ALTER TABLE notifications ADD COLUMN requiresAction INTEGER DEFAULT 0");
  if (!notifColNames.includes("expiresAt")) db.exec("ALTER TABLE notifications ADD COLUMN expiresAt TEXT");
  const budgetCols = db.prepare("PRAGMA table_info(budgets)").all();
  const budgetColNames = budgetCols.map((c) => c.name);
  if (!budgetColNames.includes("budgetType")) db.exec("ALTER TABLE budgets ADD COLUMN budgetType TEXT DEFAULT 'business'");
  if (!budgetColNames.includes("referenceName")) db.exec("ALTER TABLE budgets ADD COLUMN referenceName TEXT");
  if (!budgetColNames.includes("isRecurring")) db.exec("ALTER TABLE budgets ADD COLUMN isRecurring INTEGER DEFAULT 0");
  if (!budgetColNames.includes("notes")) db.exec("ALTER TABLE budgets ADD COLUMN notes TEXT");
  if (!budgetColNames.includes("updatedAt")) db.exec("ALTER TABLE budgets ADD COLUMN updatedAt TEXT DEFAULT CURRENT_TIMESTAMP");
  const alertCols = db.prepare("PRAGMA table_info(budget_alerts)").all();
  const alertColNames = alertCols.map((c) => c.name);
  if (!alertColNames.includes("month")) db.exec("ALTER TABLE budget_alerts ADD COLUMN month TEXT");
  if (!alertColNames.includes("year")) db.exec("ALTER TABLE budget_alerts ADD COLUMN year TEXT");
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
  const planCount = db.prepare("SELECT COUNT(*) as count FROM subscription_plans").get();
  if (planCount.count === 0) {
    const insertPlan = db.prepare("INSERT INTO subscription_plans (name, tier, durationMonths, price, description, features) VALUES (?, ?, ?, ?, ?, ?)");
    insertPlan.run("Basic 1 Month", "basic", 1, 2499, "Run your daily business.", JSON.stringify(["inventory", "sales", "customers", "adjustments"]));
    insertPlan.run("Basic 3 Months", "basic", 3, 5499, "Run your daily business.", JSON.stringify(["inventory", "sales", "customers", "adjustments"]));
    insertPlan.run("Premium 1 Month", "premium", 1, 4499, "Manage and grow your business with advanced tools.", JSON.stringify(["inventory", "sales", "customers", "adjustments", "employees", "users", "audit", "suppliers", "shipments", "analytics", "reports"]));
    insertPlan.run("Premium 3 Months", "premium", 3, 11499, "Manage and grow your business with advanced tools.", JSON.stringify(["inventory", "sales", "customers", "adjustments", "employees", "users", "audit", "suppliers", "shipments", "analytics", "reports"]));
  }
  const bizList = db.prepare("SELECT id FROM businesses").all();
  for (const biz of bizList) {
    const existing = db.prepare("SELECT id FROM subscriptions WHERE businessId = ?").get(biz.id);
    if (!existing) {
      const now = /* @__PURE__ */ new Date();
      const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3);
      db.prepare(`
        INSERT INTO subscriptions (businessId, tier, status, isTrial, trialStartedAt, trialEndsAt, startedAt, expiresAt)
        VALUES (?, 'trial', 'active', 1, ?, ?, ?, ?)
      `).run(biz.id, now.toISOString(), trialEnd.toISOString(), now.toISOString(), trialEnd.toISOString());
    }
  }
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_businessId ON subscriptions(businessId);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_payment_transactions_businessId ON payment_transactions(businessId);
    CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
    CREATE INDEX IF NOT EXISTS idx_subscription_history_subscriptionId ON subscription_history(subscriptionId);
  `);
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
  const empColumns = db.prepare("PRAGMA table_info(employees)").all();
  const empColNames = empColumns.map((c) => c.name);
  if (!empColNames.includes("address")) db.exec("ALTER TABLE employees ADD COLUMN address TEXT");
  if (!empColNames.includes("emergencyContact")) db.exec("ALTER TABLE employees ADD COLUMN emergencyContact TEXT");
  if (!empColNames.includes("gender")) db.exec("ALTER TABLE employees ADD COLUMN gender TEXT");
  if (!empColNames.includes("dateOfBirth")) db.exec("ALTER TABLE employees ADD COLUMN dateOfBirth TEXT");
  if (!empColNames.includes("department")) db.exec("ALTER TABLE employees ADD COLUMN department TEXT");
  if (!empColNames.includes("warehouseId")) db.exec("ALTER TABLE employees ADD COLUMN warehouseId INTEGER REFERENCES warehouses(id)");
  if (!empColNames.includes("employmentStatus")) db.exec("ALTER TABLE employees ADD COLUMN employmentStatus TEXT DEFAULT 'active'");
  if (!empColNames.includes("avatar")) db.exec("ALTER TABLE employees ADD COLUMN avatar TEXT");
  if (!empColNames.includes("notes")) db.exec("ALTER TABLE employees ADD COLUMN notes TEXT");
  const acctColumns = db.prepare("PRAGMA table_info(employee_accounts)").all();
  const acctColNames = acctColumns.map((c) => c.name);
  if (!acctColNames.includes("forcePasswordChange")) db.exec("ALTER TABLE employee_accounts ADD COLUMN forcePasswordChange INTEGER DEFAULT 0");
  if (!acctColNames.includes("failedLoginAttempts")) db.exec("ALTER TABLE employee_accounts ADD COLUMN failedLoginAttempts INTEGER DEFAULT 0");
  if (!acctColNames.includes("lockedUntil")) db.exec("ALTER TABLE employee_accounts ADD COLUMN lockedUntil TEXT");
  if (!acctColNames.includes("lastPasswordChange")) db.exec("ALTER TABLE employee_accounts ADD COLUMN lastPasswordChange TEXT");
  const salesColumns = db.prepare("PRAGMA table_info(sales)").all();
  let salesColNames = salesColumns.map((c) => c.name);
  if (!salesColNames.includes("createdBy")) db.exec("ALTER TABLE sales ADD COLUMN createdBy INTEGER");
  let businessId = 1;
  const bizCount = db.prepare("SELECT COUNT(*) as count FROM businesses").get();
  if (bizCount.count === 0) {
    const res = db.prepare("INSERT INTO businesses (businessName, storeName, isDefault) VALUES (?, ?, 1)").run("Shega Enterprise", "Main Branch");
    businessId = res.lastInsertRowid;
    db.prepare("UPDATE categories SET businessId = ? WHERE businessId IS NULL").run(businessId);
    db.prepare("UPDATE items SET businessId = ? WHERE businessId IS NULL").run(businessId);
    db.prepare("UPDATE sales SET businessId = ? WHERE businessId IS NULL").run(businessId);
    db.prepare("UPDATE expenses SET businessId = ? WHERE businessId IS NULL").run(businessId);
    db.prepare("UPDATE adjustments SET businessId = ? WHERE businessId IS NULL").run(businessId);
    db.prepare("UPDATE notifications SET businessId = ? WHERE businessId IS NULL").run(businessId);
  } else {
    const defaultBiz = db.prepare("SELECT id FROM businesses WHERE isDefault = 1 LIMIT 1").get();
    businessId = defaultBiz?.id || 1;
  }
  const warehouseCount = db.prepare("SELECT COUNT(*) as count FROM warehouses").get();
  if (warehouseCount.count === 0) {
    db.prepare("INSERT INTO warehouses (businessId, name, location, managerName) VALUES (?, ?, ?, ?)").run(businessId, "Main Warehouse", "Headquarters", "Operations Manager");
  }
  const roleCount = db.prepare("SELECT COUNT(*) as count FROM employee_roles").get();
  if (roleCount.count === 0) {
    const insertRole = db.prepare("INSERT INTO employee_roles (name, description, permissions, isSystem) VALUES (?, ?, ?, 1)");
    for (const role of DEFAULT_ROLES) {
      insertRole.run(role.name, role.description, JSON.stringify(role.permissions));
    }
  }
  const adminRole = db.prepare("SELECT id, permissions FROM employee_roles WHERE name = 'Administrator' LIMIT 1").get();
  if (adminRole) {
    const perms = JSON.parse(adminRole.permissions || "[]");
    if (!perms.includes("settings.backup")) {
      perms.push("settings.backup");
      perms.sort();
      db.prepare("UPDATE employee_roles SET permissions = ? WHERE id = ?").run(JSON.stringify(perms), adminRole.id);
    }
  }
  const plainPinAdmins = db.prepare("SELECT id, pin FROM admins WHERE length(pin) < 64").all();
  for (const a of plainPinAdmins) {
    const hashed = hashPin$1(a.pin);
    db.prepare("UPDATE admins SET pin = ? WHERE id = ?").run(hashed, a.id);
  }
  const adminCount = db.prepare("SELECT COUNT(*) as count FROM admins").get();
  if (adminCount.count === 0) {
    const ownerRole = db.prepare("SELECT id FROM employee_roles WHERE name = 'Owner' LIMIT 1").get();
    const roleId = ownerRole?.id || 1;
    const empResult = db.prepare(
      "INSERT INTO employees (firstName, lastName, roleId, isActive, hireDate) VALUES (?, ?, ?, ?, ?)"
    ).run("Super", "Admin", roleId, 1, (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
    const empId = empResult.lastInsertRowid;
    const hash = hashPin$1("1234");
    db.prepare(
      "INSERT INTO employee_accounts (employeeId, username, pin, isActive, forcePasswordChange) VALUES (?, ?, ?, ?, ?)"
    ).run(empId, "admin", hash, 1, 1);
    db.prepare(
      "INSERT INTO admins (name, username, pin, role, permissions) VALUES (?, ?, ?, ?, ?)"
    ).run("Super Admin", "admin", hash, "super_admin", JSON.stringify(ALL_PERMISSIONS));
  }
  const existingCustomerNames = db.prepare("SELECT DISTINCT customerName, customerPhone FROM sales WHERE customerName IS NOT NULL AND customerName != ''").all();
  for (const c of existingCustomerNames) {
    const alreadyExists = db.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(c.customerName, businessId);
    if (!alreadyExists) {
      db.prepare("INSERT INTO customers (businessId, customerName, phone) VALUES (?, ?, ?)").run(businessId, c.customerName, c.customerPhone || "");
    }
  }
  const prefCount = db.prepare("SELECT COUNT(*) AS c FROM notification_preferences").get().c;
  if (prefCount === 0) {
    const defaultPrefs = [
      // Inventory
      { key: "inventory.low_stock", desktop: 1, inApp: 1, email: 0, sound: 1 },
      { key: "inventory.out_of_stock", desktop: 1, inApp: 1, email: 1, sound: 1 },
      { key: "inventory.expiring", desktop: 1, inApp: 1, email: 0, sound: 1 },
      { key: "inventory.adjustment", desktop: 0, inApp: 1, email: 0, sound: 0 },
      // Sales
      { key: "sales.completed", desktop: 0, inApp: 1, email: 0, sound: 1 },
      { key: "sales.refund", desktop: 1, inApp: 1, email: 0, sound: 1 },
      // Customers
      { key: "customers.overdue_balance", desktop: 1, inApp: 1, email: 0, sound: 1 },
      { key: "customers.payment_due", desktop: 0, inApp: 1, email: 0, sound: 0 },
      // Suppliers
      { key: "suppliers.overdue_balance", desktop: 1, inApp: 1, email: 0, sound: 1 },
      { key: "suppliers.payment_due", desktop: 1, inApp: 1, email: 0, sound: 0 },
      { key: "suppliers.purchase_received", desktop: 0, inApp: 1, email: 0, sound: 0 },
      // Expenses
      { key: "expenses.recurring_due", desktop: 1, inApp: 1, email: 0, sound: 1 },
      { key: "expenses.overdue", desktop: 1, inApp: 1, email: 0, sound: 1 },
      // System
      { key: "system.backup_complete", desktop: 1, inApp: 1, email: 1, sound: 0 },
      { key: "system.backup_reminder", desktop: 0, inApp: 1, email: 0, sound: 0 },
      { key: "system.update_available", desktop: 0, inApp: 1, email: 0, sound: 0 },
      { key: "system.license_expiring", desktop: 1, inApp: 1, email: 1, sound: 1 },
      // Employees
      { key: "employees.account_locked", desktop: 1, inApp: 1, email: 1, sound: 1 },
      { key: "employees.shift_reminder", desktop: 0, inApp: 1, email: 0, sound: 0 }
    ];
    const insertPref = db.prepare(`
      INSERT INTO notification_preferences (key, enabled, sound, desktop, email, inApp)
      VALUES (?, 1, ?, ?, ?, ?)
    `);
    for (const p of defaultPrefs) insertPref.run(p.key, p.sound, p.desktop, p.email, p.inApp);
  }
  const supColumns = db.prepare("PRAGMA table_info(suppliers)").all();
  const supColNames = supColumns.map((c) => c.name);
  if (!supColNames.includes("businessId")) db.exec("ALTER TABLE suppliers ADD COLUMN businessId INTEGER REFERENCES businesses(id)");
  if (!supColNames.includes("isFavorite")) db.exec("ALTER TABLE suppliers ADD COLUMN isFavorite INTEGER DEFAULT 0");
  if (!supColNames.includes("performanceScore")) db.exec("ALTER TABLE suppliers ADD COLUMN performanceScore REAL DEFAULT 0");
  if (!supColNames.includes("lastActivityDate")) db.exec("ALTER TABLE suppliers ADD COLUMN lastActivityDate TEXT");
  const spColumns = db.prepare("PRAGMA table_info(supplier_purchases)").all();
  const spColNames = spColumns.map((c) => c.name);
  if (!spColNames.includes("businessId")) db.exec("ALTER TABLE supplier_purchases ADD COLUMN businessId INTEGER REFERENCES businesses(id)");
  const spPayColumns = db.prepare("PRAGMA table_info(supplier_payments)").all();
  const spPayColNames = spPayColumns.map((c) => c.name);
  if (!spPayColNames.includes("businessId")) db.exec("ALTER TABLE supplier_payments ADD COLUMN businessId INTEGER REFERENCES businesses(id)");
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
  const itemColumns = db.prepare("PRAGMA table_info(items)").all();
  let itemColNames = itemColumns.map((c) => c.name);
  if (!itemColNames.includes("supplierId")) {
    db.exec("ALTER TABLE items ADD COLUMN supplierId INTEGER REFERENCES suppliers(id)");
  }
  if (!itemColNames.includes("lastPurchaseDate")) {
    db.exec("ALTER TABLE items ADD COLUMN lastPurchaseDate TEXT");
  }
  if (!itemColNames.includes("lastPurchasePrice")) {
    db.exec("ALTER TABLE items ADD COLUMN lastPurchasePrice REAL DEFAULT 0");
  }
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_items_supplierId ON items(supplierId);
  `);
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
  `).all();
  const insPurchase = db.prepare(`
    INSERT INTO supplier_purchases (businessId, supplierId, purchaseNumber, purchaseDate, totalAmount, paidAmount, status, notes, createdBy)
    VALUES (?, ?, ?, date('now'), ?, ?, ?, ?, 'system')
  `);
  const insItem = db.prepare(`
    INSERT INTO supplier_purchase_items (purchaseId, itemId, itemName, sku, quantity, unit, unitPrice, totalPrice)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const getPurchaseId = db.prepare("SELECT last_insert_rowid() AS id");
  for (const item of missingPurchases) {
    try {
      const unitPrice = item.basePurchasePrice || item.baseSellingPrice || 0;
      const totalAmount = unitPrice * item.totalBaseQuantity;
      const paidAmount = item.isCredit ? 0 : totalAmount;
      const status = item.isCredit ? "pending" : "received";
      const purchaseNumber = `PO-AUTO-${Date.now()}-${item.id}`;
      insPurchase.run(item.businessId || 1, item.supplierId, purchaseNumber, totalAmount, paidAmount, status, `Auto-created from inventory item "${item.name}"`);
      const pid = getPurchaseId.get();
      insItem.run(pid.id, item.id, item.name, null, item.totalBaseQuantity, item.baseUnit || "pcs", unitPrice, totalAmount);
    } catch (_) {
    }
  }
  const salesCols = db.prepare("PRAGMA table_info(sales)").all();
  salesColNames = salesCols.map((c) => c.name);
  if (!salesColNames.includes("status")) db.exec("ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'Active'");
  if (!salesColNames.includes("voidReason")) db.exec("ALTER TABLE sales ADD COLUMN voidReason TEXT");
  if (!salesColNames.includes("voidedBy")) db.exec("ALTER TABLE sales ADD COLUMN voidedBy TEXT");
  if (!salesColNames.includes("voidedAt")) db.exec("ALTER TABLE sales ADD COLUMN voidedAt TEXT");
  const dpCols = db.prepare("PRAGMA table_info(debt_payments)").all();
  const dpColNames = dpCols.map((c) => c.name);
  if (!dpColNames.includes("reversalId")) db.exec("ALTER TABLE debt_payments ADD COLUMN reversalId INTEGER");
  if (!dpColNames.includes("reversalReason")) db.exec("ALTER TABLE debt_payments ADD COLUMN reversalReason TEXT");
  if (!dpColNames.includes("reversedBy")) db.exec("ALTER TABLE debt_payments ADD COLUMN reversedBy TEXT");
  if (!dpColNames.includes("reversalDate")) db.exec("ALTER TABLE debt_payments ADD COLUMN reversalDate TEXT");
  const supPayCols = db.prepare("PRAGMA table_info(supplier_payments)").all();
  const supPayColNames = supPayCols.map((c) => c.name);
  if (!supPayColNames.includes("reversalId")) db.exec("ALTER TABLE supplier_payments ADD COLUMN reversalId INTEGER");
  if (!supPayColNames.includes("reversalReason")) db.exec("ALTER TABLE supplier_payments ADD COLUMN reversalReason TEXT");
  if (!supPayColNames.includes("reversedBy")) db.exec("ALTER TABLE supplier_payments ADD COLUMN reversedBy TEXT");
  if (!supPayColNames.includes("reversalDate")) db.exec("ALTER TABLE supplier_payments ADD COLUMN reversalDate TEXT");
  const adjCols = db.prepare("PRAGMA table_info(adjustments)").all();
  const adjColNames = adjCols.map((c) => c.name);
  if (!adjColNames.includes("reversalId")) db.exec("ALTER TABLE adjustments ADD COLUMN reversalId INTEGER");
  if (!adjColNames.includes("reversalReason")) db.exec("ALTER TABLE adjustments ADD COLUMN reversalReason TEXT");
  if (!adjColNames.includes("reversedBy")) db.exec("ALTER TABLE adjustments ADD COLUMN reversedBy TEXT");
  if (!adjColNames.includes("reversalDate")) db.exec("ALTER TABLE adjustments ADD COLUMN reversalDate TEXT");
  const itemCols = db.prepare("PRAGMA table_info(items)").all();
  itemColNames = itemCols.map((c) => c.name);
  if (!itemColNames.includes("deleted_by")) db.exec("ALTER TABLE items ADD COLUMN deleted_by TEXT");
  if (!itemColNames.includes("deleted_at")) db.exec("ALTER TABLE items ADD COLUMN deleted_at TEXT");
  const custCols = db.prepare("PRAGMA table_info(customers)").all();
  const custColNames = custCols.map((c) => c.name);
  if (!custColNames.includes("is_deleted")) db.exec("ALTER TABLE customers ADD COLUMN is_deleted INTEGER DEFAULT 0");
  if (!custColNames.includes("deleted_by")) db.exec("ALTER TABLE customers ADD COLUMN deleted_by TEXT");
  if (!custColNames.includes("deleted_at")) db.exec("ALTER TABLE customers ADD COLUMN deleted_at TEXT");
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
  const allRoles = db.prepare("SELECT id, name, permissions, isSystem FROM employee_roles").all();
  const newPerms = ["audit.view", "audit.export", "sales.void", "payments.reverse", "adjustments.reverse", "records.restore", "orders.view", "orders.create", "orders.edit", "orders.delete", "orders.convert", "orders.cancel"];
  for (const role of allRoles) {
    if (!role.isSystem) continue;
    const perms = JSON.parse(role.permissions || "[]");
    let changed = false;
    for (const np of newPerms) {
      if (!perms.includes(np)) {
        perms.push(np);
        changed = true;
      }
    }
    if (changed) {
      perms.sort();
      db.prepare("UPDATE employee_roles SET permissions = ? WHERE id = ?").run(JSON.stringify(perms), role.id);
    }
  }
  const allAdmins = db.prepare("SELECT id, permissions FROM admins").all();
  for (const adm of allAdmins) {
    if (!adm.permissions) continue;
    const perms = JSON.parse(adm.permissions || "[]");
    let changed = false;
    for (const np of newPerms) {
      if (!perms.includes(np)) {
        perms.push(np);
        changed = true;
      }
    }
    if (changed) {
      perms.sort();
      db.prepare("UPDATE admins SET permissions = ? WHERE id = ?").run(JSON.stringify(perms), adm.id);
    }
  }
}
function getActiveBusinessId$1() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'active_business_id'").get();
  if (row) return parseInt(row.value);
  const defaultBiz = db.prepare("SELECT id FROM businesses WHERE isDefault = 1 LIMIT 1").get();
  return defaultBiz?.id || 1;
}
function getDefaultWarehouseId$1() {
  const wh = db.prepare("SELECT id FROM warehouses WHERE isActive = 1 ORDER BY id LIMIT 1").get();
  if (wh) return wh.id;
  const anyWh = db.prepare("SELECT id FROM warehouses LIMIT 1").get();
  if (anyWh) return anyWh.id;
  const bizId = getActiveBusinessId$1();
  const res = db.prepare("INSERT INTO warehouses (businessId, name, location, managerName) VALUES (?, ?, ?, ?)").run(bizId, "Main Warehouse", "Headquarters", "Operations Manager");
  return res.lastInsertRowid;
}
function resolveId(table, nameField, nameValue, extraWhere = "", extraParams = []) {
  if (!nameValue?.trim()) return null;
  const bizId = getActiveBusinessId$1();
  const row = db.prepare(`SELECT id FROM ${table} WHERE ${nameField} = ? AND businessId = ? ${extraWhere} LIMIT 1`).get(nameValue.trim(), bizId, ...extraParams);
  return row?.id ?? null;
}
function resolveItemId(name) {
  return resolveId("items", "name", name, "AND is_deleted = 0");
}
function getOrCreateCustomer(name, phone) {
  const bizId = getActiveBusinessId$1();
  const existing = db.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(name.trim(), bizId);
  if (existing) return existing.id;
  const res = db.prepare("INSERT INTO customers (businessId, customerName, phone, groupName) VALUES (?, ?, ?, ?)").run(bizId, name.trim(), phone?.trim() || "", "general");
  return res.lastInsertRowid;
}
function resolveSupplierName(name) {
  return resolveId("suppliers", "supplierName", name, "AND isActive = 1");
}
function resolveRoleName(name) {
  const row = db.prepare("SELECT id FROM employee_roles WHERE name = ? LIMIT 1").get(name.trim());
  if (row) return row.id;
  const res = db.prepare("INSERT INTO employee_roles (name, description, permissions) VALUES (?, ?, ?)").run(name.trim(), "Imported role", "[]");
  return res.lastInsertRowid;
}
function importSales(rows) {
  const result = { success: true, imported: 0, errors: [], skipped: 0 };
  const bizId = getActiveBusinessId$1();
  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const itemName = r.itemName?.trim();
        if (!itemName) {
          result.errors.push({ row: i + 1, message: "itemName is required" });
          continue;
        }
        const itemId = resolveItemId(itemName);
        if (!itemId) {
          result.errors.push({ row: i + 1, message: `Item "${itemName}" not found` });
          continue;
        }
        const quantity = parseFloat(r.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          result.errors.push({ row: i + 1, message: `Invalid quantity: "${r.quantity}"` });
          continue;
        }
        const totalPrice = parseFloat(r.totalPrice);
        if (isNaN(totalPrice) || totalPrice < 0) {
          result.errors.push({ row: i + 1, message: `Invalid totalPrice: "${r.totalPrice}"` });
          continue;
        }
        const unit = r.unit || "pcs";
        const unitType = r.unitType || "base";
        const discount = parseFloat(r.discount) || 0;
        const vat = parseFloat(r.vat) || 0;
        const paymentMethod = r.paymentMethod || "cash";
        const paymentStatus = r.paymentStatus || "Paid";
        const customerName = r.customerName?.trim() || "";
        const customerPhone = r.customerPhone?.trim() || "";
        const dueDate = r.dueDate || null;
        const paidAmount = parseFloat(r.paidAmount) || 0;
        const createdAt = r.createdAt || (/* @__PURE__ */ new Date()).toISOString();
        const stmt = db.prepare(`
          INSERT INTO sales (businessId, itemId, quantity, unit, unitType, discount, vat, totalPrice,
            paymentMethod, paymentStatus, customerName, customerPhone, dueDate, paidAmount, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          bizId,
          itemId,
          quantity,
          unit,
          unitType,
          discount,
          vat,
          totalPrice,
          paymentMethod,
          paymentStatus,
          customerName,
          customerPhone || null,
          dueDate,
          paidAmount,
          createdAt
        );
        if (customerName && (paymentStatus === "Debt" || paymentStatus === "Partial")) {
          getOrCreateCustomer(customerName, customerPhone);
        }
        const item = db.prepare("SELECT unitsPerPack, totalBaseQuantity FROM items WHERE id = ?").get(itemId);
        let baseDeduction = quantity;
        if (unitType === "pack") baseDeduction = quantity * (item?.unitsPerPack || 1);
        db.prepare("UPDATE items SET totalBaseQuantity = MAX(0, totalBaseQuantity - ?) WHERE id = ?").run(baseDeduction, itemId);
        const defWhId = getDefaultWarehouseId$1();
        const whRow = db.prepare("SELECT id, quantity FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, itemId);
        if (whRow) {
          db.prepare("UPDATE warehouse_inventory SET quantity = MAX(0, quantity - ?), updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(baseDeduction, whRow.id);
        }
        result.imported++;
      } catch (e) {
        result.errors.push({ row: i + 1, message: e.message || "Unknown error" });
      }
    }
  });
  try {
    transaction();
  } catch (e) {
    result.success = false;
    result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` });
  }
  return result;
}
function importItems(rows) {
  const result = { success: true, imported: 0, errors: [], skipped: 0 };
  const bizId = getActiveBusinessId$1();
  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const name = r.name?.trim();
        if (!name) {
          result.errors.push({ row: i + 1, message: "Item name is required" });
          continue;
        }
        const existing = db.prepare("SELECT id FROM items WHERE name = ? AND businessId = ? AND is_deleted = 0").get(name, bizId);
        if (existing) {
          result.skipped++;
          continue;
        }
        let categoryId = null;
        const catName = r.categoryName?.trim();
        if (catName) {
          const cat = db.prepare("SELECT id FROM categories WHERE name = ? AND businessId = ?").get(catName, bizId);
          if (cat) categoryId = cat.id;
        }
        const basePurchasePrice = parseFloat(r.basePurchasePrice) || 0;
        const baseSellingPrice = parseFloat(r.baseSellingPrice) || 0;
        db.prepare(`
          INSERT INTO items (businessId, name, categoryId, purchaseUnit, baseUnit, unitsPerPack,
            basePurchasePrice, baseSellingPrice, packPurchasePrice, packSellingPrice,
            totalBaseQuantity, totalPackQuantity, expiryDate, notes, supplierId)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            (SELECT id FROM suppliers WHERE supplierName = ? AND businessId = ? LIMIT 1))
        `).run(
          bizId,
          name,
          categoryId,
          r.purchaseUnit || null,
          r.baseUnit || null,
          parseFloat(r.unitsPerPack) || 1,
          basePurchasePrice,
          baseSellingPrice,
          parseFloat(r.packPurchasePrice) || 0,
          parseFloat(r.packSellingPrice) || 0,
          parseFloat(r.totalBaseQuantity) || 0,
          parseFloat(r.totalPackQuantity) || 0,
          r.expiryDate || null,
          r.notes || null,
          r.supplierName?.trim() || null,
          bizId
        );
        result.imported++;
      } catch (e) {
        result.errors.push({ row: i + 1, message: e.message || "Unknown error" });
      }
    }
  });
  try {
    transaction();
  } catch (e) {
    result.success = false;
    result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` });
  }
  return result;
}
function importExpenses(rows) {
  const result = { success: true, imported: 0, errors: [], skipped: 0 };
  const bizId = getActiveBusinessId$1();
  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const name = r.name?.trim();
        if (!name) {
          result.errors.push({ row: i + 1, message: "Expense name is required" });
          continue;
        }
        const amount = parseFloat(r.amount);
        if (isNaN(amount) || amount < 0) {
          result.errors.push({ row: i + 1, message: `Invalid amount: "${r.amount}"` });
          continue;
        }
        const date = r.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        if (!date) {
          result.errors.push({ row: i + 1, message: "Date is required" });
          continue;
        }
        db.prepare("INSERT INTO expenses (businessId, name, amount, category, date, isRecurring, frequency, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
          bizId,
          name,
          amount,
          r.category || null,
          date,
          r.isRecurring === "true" || r.isRecurring === "1" ? 1 : 0,
          r.frequency || null,
          r.notes || null
        );
        result.imported++;
      } catch (e) {
        result.errors.push({ row: i + 1, message: e.message || "Unknown error" });
      }
    }
  });
  try {
    transaction();
  } catch (e) {
    result.success = false;
    result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` });
  }
  return result;
}
function importCustomers(rows) {
  const result = { success: true, imported: 0, errors: [], skipped: 0 };
  const bizId = getActiveBusinessId$1();
  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const name = r.customerName?.trim();
        if (!name) {
          result.errors.push({ row: i + 1, message: "Customer name is required" });
          continue;
        }
        const existing = db.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(name, bizId);
        if (existing) {
          result.skipped++;
          continue;
        }
        db.prepare("INSERT INTO customers (businessId, customerName, phone, email, address, city, company, groupName, creditLimit, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
          bizId,
          name,
          r.phone?.trim() || "",
          r.email?.trim() || null,
          r.address?.trim() || null,
          r.city?.trim() || null,
          r.company?.trim() || null,
          r.groupName?.trim() || "general",
          parseFloat(r.creditLimit) || 0,
          r.notes?.trim() || null
        );
        result.imported++;
      } catch (e) {
        result.errors.push({ row: i + 1, message: e.message || "Unknown error" });
      }
    }
  });
  try {
    transaction();
  } catch (e) {
    result.success = false;
    result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` });
  }
  return result;
}
function importSuppliers(rows) {
  const result = { success: true, imported: 0, errors: [], skipped: 0 };
  const bizId = getActiveBusinessId$1();
  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const name = r.supplierName?.trim();
        if (!name) {
          result.errors.push({ row: i + 1, message: "Supplier name is required" });
          continue;
        }
        const existing = db.prepare("SELECT id FROM suppliers WHERE supplierName = ? AND businessId = ?").get(name, bizId);
        if (existing) {
          result.skipped++;
          continue;
        }
        db.prepare("INSERT INTO suppliers (businessId, supplierName, companyName, contactPerson, phone, email, address, city, paymentTerms, creditLimit, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
          bizId,
          name,
          r.companyName?.trim() || null,
          r.contactPerson?.trim() || null,
          r.phone?.trim() || "",
          r.email?.trim() || null,
          r.address?.trim() || null,
          r.city?.trim() || null,
          r.paymentTerms?.trim() || null,
          parseFloat(r.creditLimit) || 0,
          r.notes?.trim() || null
        );
        result.imported++;
      } catch (e) {
        result.errors.push({ row: i + 1, message: e.message || "Unknown error" });
      }
    }
  });
  try {
    transaction();
  } catch (e) {
    result.success = false;
    result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` });
  }
  return result;
}
function importShipments(rows) {
  const result = { success: true, imported: 0, errors: [], skipped: 0 };
  const bizId = getActiveBusinessId$1();
  const validStatuses = ["pending", "in_transit", "delivered", "cancelled"];
  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const dest = r.destination?.trim();
        if (!dest) {
          result.errors.push({ row: i + 1, message: "Destination is required" });
          continue;
        }
        const status = r.status?.trim() || "pending";
        if (!validStatuses.includes(status)) {
          result.errors.push({ row: i + 1, message: `Invalid status "${status}". Must be one of: ${validStatuses.join(", ")}` });
          continue;
        }
        db.prepare("INSERT INTO shipments (businessId, origin, destination, driverName, driverPhone, vehicleInfo, status, scheduledDate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
          bizId,
          r.origin?.trim() || null,
          dest,
          r.driverName?.trim() || null,
          r.driverPhone?.trim() || null,
          r.vehicleInfo?.trim() || null,
          status,
          r.scheduledDate || null,
          r.notes?.trim() || null
        );
        result.imported++;
      } catch (e) {
        result.errors.push({ row: i + 1, message: e.message || "Unknown error" });
      }
    }
  });
  try {
    transaction();
  } catch (e) {
    result.success = false;
    result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` });
  }
  return result;
}
function importAdjustments(rows) {
  const result = { success: true, imported: 0, errors: [], skipped: 0 };
  const bizId = getActiveBusinessId$1();
  const validTypes = ["damage", "loss", "add_stock", "price_increase", "price_decrease"];
  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const itemName = r.itemName?.trim();
        if (!itemName) {
          result.errors.push({ row: i + 1, message: "Item name is required" });
          continue;
        }
        const itemId = resolveItemId(itemName);
        if (!itemId) {
          result.errors.push({ row: i + 1, message: `Item "${itemName}" not found` });
          continue;
        }
        const type = r.type?.trim();
        if (!type || !validTypes.includes(type)) {
          result.errors.push({ row: i + 1, message: `Invalid type "${type}". Must be one of: ${validTypes.join(", ")}` });
          continue;
        }
        const quantity = parseFloat(r.quantity);
        if (isNaN(quantity) || quantity < 0) {
          result.errors.push({ row: i + 1, message: `Invalid quantity: "${r.quantity}"` });
          continue;
        }
        const date = r.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const unitType = r.unitType || "base";
        db.prepare("INSERT INTO adjustments (businessId, itemId, type, oldValue, newValue, quantity, unitType, reason, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
          bizId,
          itemId,
          type,
          null,
          null,
          quantity,
          unitType,
          r.reason?.trim() || null,
          date
        );
        if (type === "damage" || type === "loss") {
          const item = db.prepare("SELECT unitsPerPack FROM items WHERE id = ?").get(itemId);
          let baseDeduction = quantity;
          if (unitType === "pack") baseDeduction = quantity * (item?.unitsPerPack || 1);
          db.prepare("UPDATE items SET totalBaseQuantity = MAX(0, totalBaseQuantity - ?) WHERE id = ?").run(baseDeduction, itemId);
          const defWhId = getDefaultWarehouseId$1();
          const whRow = db.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, itemId);
          if (whRow) {
            db.prepare("UPDATE warehouse_inventory SET quantity = MAX(0, quantity - ?), updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(baseDeduction, whRow.id);
          }
        } else if (type === "add_stock") {
          const item = db.prepare("SELECT unitsPerPack FROM items WHERE id = ?").get(itemId);
          let baseAddition = quantity;
          if (unitType === "pack") baseAddition = quantity * (item?.unitsPerPack || 1);
          db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ? WHERE id = ?").run(baseAddition, itemId);
          const defWhId = getDefaultWarehouseId$1();
          const whRow = db.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, itemId);
          if (whRow) {
            db.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(baseAddition, whRow.id);
          }
        }
        result.imported++;
      } catch (e) {
        result.errors.push({ row: i + 1, message: e.message || "Unknown error" });
      }
    }
  });
  try {
    transaction();
  } catch (e) {
    result.success = false;
    result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` });
  }
  return result;
}
function importContacts(rows) {
  const result = { success: true, imported: 0, errors: [], skipped: 0 };
  const bizId = getActiveBusinessId$1();
  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const name = r.name?.trim();
        if (!name) {
          result.errors.push({ row: i + 1, message: "Name is required" });
          continue;
        }
        const phone = r.phone?.trim();
        if (!phone) {
          result.errors.push({ row: i + 1, message: "Phone is required" });
          continue;
        }
        db.prepare("INSERT INTO contacts (businessId, name, phone, category, notes) VALUES (?, ?, ?, ?, ?)").run(
          bizId,
          name,
          phone,
          r.category?.trim() || "other",
          r.notes?.trim() || null
        );
        result.imported++;
      } catch (e) {
        result.errors.push({ row: i + 1, message: e.message || "Unknown error" });
      }
    }
  });
  try {
    transaction();
  } catch (e) {
    result.success = false;
    result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` });
  }
  return result;
}
function importWarehouses(rows) {
  const result = { success: true, imported: 0, errors: [], skipped: 0 };
  const bizId = getActiveBusinessId$1();
  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const name = r.name?.trim();
        if (!name) {
          result.errors.push({ row: i + 1, message: "Warehouse name is required" });
          continue;
        }
        const existing = db.prepare("SELECT id FROM warehouses WHERE name = ? AND businessId = ?").get(name, bizId);
        if (existing) {
          result.skipped++;
          continue;
        }
        db.prepare("INSERT INTO warehouses (businessId, name, location, managerName, managerPhone, email) VALUES (?, ?, ?, ?, ?, ?)").run(
          bizId,
          name,
          r.location?.trim() || null,
          r.managerName?.trim() || null,
          r.managerPhone?.trim() || null,
          r.email?.trim() || null
        );
        result.imported++;
      } catch (e) {
        result.errors.push({ row: i + 1, message: e.message || "Unknown error" });
      }
    }
  });
  try {
    transaction();
  } catch (e) {
    result.success = false;
    result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` });
  }
  return result;
}
function importEmployees(rows) {
  const result = { success: true, imported: 0, errors: [], skipped: 0 };
  getActiveBusinessId$1();
  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const firstName = r.firstName?.trim();
        const lastName = r.lastName?.trim();
        if (!firstName || !lastName) {
          result.errors.push({ row: i + 1, message: "First name and last name are required" });
          continue;
        }
        const roleId = r.roleName?.trim() ? resolveRoleName(r.roleName.trim()) : null;
        db.prepare("INSERT INTO employees (employeeCode, firstName, lastName, phone, email, roleId, department, hireDate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
          r.employeeCode?.trim() || null,
          firstName,
          lastName,
          r.phone?.trim() || null,
          r.email?.trim() || null,
          roleId,
          r.department?.trim() || null,
          r.hireDate || null,
          r.notes?.trim() || null
        );
        result.imported++;
      } catch (e) {
        result.errors.push({ row: i + 1, message: e.message || "Unknown error" });
      }
    }
  });
  try {
    transaction();
  } catch (e) {
    result.success = false;
    result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` });
  }
  return result;
}
function importSupplierPurchases(rows) {
  const result = { success: true, imported: 0, errors: [], skipped: 0 };
  const bizId = getActiveBusinessId$1();
  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const purchaseNumber = r.purchaseNumber?.trim();
        if (!purchaseNumber) {
          result.errors.push({ row: i + 1, message: "purchaseNumber is required" });
          continue;
        }
        const supplierName = r.supplierName?.trim();
        if (!supplierName) {
          result.errors.push({ row: i + 1, message: "supplierName is required" });
          continue;
        }
        const supplierId = resolveSupplierName(supplierName);
        if (!supplierId) {
          result.errors.push({ row: i + 1, message: `Supplier "${supplierName}" not found` });
          continue;
        }
        const itemName = r.itemName?.trim();
        if (!itemName) {
          result.errors.push({ row: i + 1, message: "itemName is required" });
          continue;
        }
        const itemId = resolveItemId(itemName);
        if (!itemId) {
          result.errors.push({ row: i + 1, message: `Item "${itemName}" not found` });
          continue;
        }
        const quantity = parseFloat(r.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          result.errors.push({ row: i + 1, message: `Invalid quantity: "${r.quantity}"` });
          continue;
        }
        const unitPrice = parseFloat(r.unitPrice);
        if (isNaN(unitPrice) || unitPrice < 0) {
          result.errors.push({ row: i + 1, message: `Invalid unitPrice: "${r.unitPrice}"` });
          continue;
        }
        const totalPrice = parseFloat(r.totalPrice);
        if (isNaN(totalPrice) || totalPrice < 0) {
          result.errors.push({ row: i + 1, message: `Invalid totalPrice: "${r.totalPrice}"` });
          continue;
        }
        const purchaseDate = r.purchaseDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const existingPO = db.prepare("SELECT id FROM supplier_purchases WHERE purchaseNumber = ? AND businessId = ?").get(purchaseNumber, bizId);
        if (existingPO) {
          result.skipped++;
          continue;
        }
        const poResult = db.prepare("INSERT INTO supplier_purchases (businessId, supplierId, purchaseNumber, purchaseDate, totalAmount, dueDate, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
          bizId,
          supplierId,
          purchaseNumber,
          purchaseDate,
          totalPrice,
          r.dueDate || null,
          r.status?.trim() || "received",
          r.notes?.trim() || null
        );
        const purchaseId = poResult.lastInsertRowid;
        db.prepare("INSERT INTO supplier_purchase_items (purchaseId, itemId, itemName, quantity, unit, unitPrice, totalPrice, receivedQuantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
          purchaseId,
          itemId,
          itemName,
          quantity,
          r.unit?.trim() || "pcs",
          unitPrice,
          totalPrice,
          quantity
        );
        const item = db.prepare("SELECT unitsPerPack FROM items WHERE id = ?").get(itemId);
        db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ? WHERE id = ?").run(quantity, itemId);
        db.prepare("UPDATE items SET lastPurchaseDate = ?, lastPurchasePrice = ? WHERE id = ?").run(purchaseDate, unitPrice, itemId);
        const defWhId = getDefaultWarehouseId$1();
        const whRow = db.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, itemId);
        if (whRow) {
          db.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(quantity, whRow.id);
        }
        result.imported++;
      } catch (e) {
        result.errors.push({ row: i + 1, message: e.message || "Unknown error" });
      }
    }
  });
  try {
    transaction();
  } catch (e) {
    result.success = false;
    result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` });
  }
  return result;
}
function importOrders(rows) {
  const result = { success: true, imported: 0, errors: [], skipped: 0 };
  const bizId = getActiveBusinessId$1();
  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const orderNumber = r.orderNumber?.trim();
        if (!orderNumber) {
          result.errors.push({ row: i + 1, message: "orderNumber is required" });
          continue;
        }
        const existing = db.prepare("SELECT id FROM orders WHERE orderNumber = ? AND businessId = ?").get(orderNumber, bizId);
        if (existing) {
          result.skipped++;
          continue;
        }
        const orderResult = db.prepare("INSERT INTO orders (businessId, orderNumber, customerName, customerPhone, status, totalAmount, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
          bizId,
          orderNumber,
          r.customerName?.trim() || null,
          r.customerPhone?.trim() || null,
          r.status?.trim() || "Order",
          0,
          r.notes?.trim() || null
        );
        const orderId = orderResult.lastInsertRowid;
        const itemName = r.itemName?.trim();
        if (itemName) {
          const itemId = resolveItemId(itemName);
          const quantity = parseFloat(r.quantity) || 1;
          const unitPrice = parseFloat(r.unitPrice) || 0;
          const totalPrice = quantity * unitPrice;
          db.prepare("INSERT INTO order_items (orderId, itemId, itemName, quantity, unit, unitPrice, totalPrice) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
            orderId,
            itemId,
            itemName,
            quantity,
            "pcs",
            unitPrice,
            totalPrice
          );
          db.prepare("UPDATE orders SET totalAmount = totalAmount + ? WHERE id = ?").run(totalPrice, orderId);
        }
        result.imported++;
      } catch (e) {
        result.errors.push({ row: i + 1, message: e.message || "Unknown error" });
      }
    }
  });
  try {
    transaction();
  } catch (e) {
    result.success = false;
    result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` });
  }
  return result;
}
const IMPORTERS = {
  sales: importSales,
  inventory: importItems,
  expenses: importExpenses,
  customers: importCustomers,
  suppliers: importSuppliers,
  shipments: importShipments,
  adjustments: importAdjustments,
  contacts: importContacts,
  warehouses: importWarehouses,
  employees: importEmployees,
  "supplier-purchases": importSupplierPurchases,
  orders: importOrders
};
function importData(module, rows) {
  const importer = IMPORTERS[module];
  if (!importer) return { success: false, imported: 0, errors: [{ row: 0, message: `Unknown module: ${module}` }], skipped: 0 };
  const result = importer(rows);
  try {
    const bizId = getActiveBusinessId$1();
    const description = `CSV import of ${rows.length} ${module} records: ${result.imported} imported, ${result.errors.length} errors, ${result.skipped} skipped`;
    db.prepare("INSERT INTO audit_logs (businessId, action, entityType, entityId, fieldName, oldValue, newValue, changedBy, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      bizId,
      "csv_import",
      module,
      null,
      null,
      null,
      null,
      "system",
      description
    );
  } catch (e) {
    console.error("[CSV Import] Failed to audit log:", e);
  }
  return result;
}
let activeBusinessId = null;
let currentAdminId = null;
let currentUserName = null;
let currentUserPermissions = [];
function requirePermission(perm) {
  if (!currentUserPermissions.includes(perm) && !currentUserPermissions.includes("*")) {
    throw new Error(`Permission denied: ${perm}`);
  }
}
function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = crypto.scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${key}`;
}
function verifyPin(pin, stored) {
  const parts = stored.split(":");
  if (parts.length !== 2) {
    const legacy = crypto.createHash("sha256").update(pin).digest("hex");
    return legacy === stored;
  }
  const [salt, key] = parts;
  const check = crypto.scryptSync(pin, salt, 64).toString("hex");
  return check === key;
}
function getActiveBusinessId() {
  if (activeBusinessId) return activeBusinessId;
  const row = db.prepare("SELECT value FROM settings WHERE key = 'active_business_id'").get();
  if (row) {
    activeBusinessId = parseInt(row.value);
    return activeBusinessId;
  }
  const defaultBiz = db.prepare("SELECT id FROM businesses WHERE isDefault = 1 LIMIT 1").get();
  activeBusinessId = defaultBiz?.id || 1;
  return activeBusinessId;
}
const DEFAULT_LIST_LIMIT = 200;
function getDefaultWarehouseId() {
  const wh = db.prepare("SELECT id FROM warehouses WHERE isActive = 1 ORDER BY id LIMIT 1").get();
  if (wh) return wh.id;
  const anyWh = db.prepare("SELECT id FROM warehouses LIMIT 1").get();
  if (anyWh) return anyWh.id;
  const bizId = getActiveBusinessId();
  const res = db.prepare("INSERT INTO warehouses (businessId, name, location, managerName) VALUES (?, ?, ?, ?)").run(bizId, "Main Warehouse", "Headquarters", "Operations Manager");
  return res.lastInsertRowid;
}
function validatePositive(v, label) {
  const n = Number(v);
  if (isNaN(n) || n <= 0) throw new Error(`${label} must be a positive number`);
  return n;
}
function validateNonNegative(v, label) {
  const n = Number(v);
  if (isNaN(n) || n < 0) throw new Error(`${label} must be a non-negative number`);
  return n;
}
function insertAuditLog(action, entityType, entityId, fieldName, oldValue, newValue, description) {
  try {
    db.prepare("INSERT INTO audit_logs (businessId, action, entityType, entityId, fieldName, oldValue, newValue, changedBy, changedById, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(getActiveBusinessId(), action, entityType, entityId, fieldName, oldValue, newValue, currentUserName || "unknown", null, description);
  } catch (e) {
    console.error(`[AuditLog] Failed to log ${action}:`, e);
  }
}
function registerIPCHandlers() {
  console.log("[Handlers] registerIPCHandlers called");
  electron.ipcMain.handle("get-active-business", () => {
    const id = getActiveBusinessId();
    return db.prepare("SELECT * FROM businesses WHERE id = ?").get(id);
  });
  electron.ipcMain.handle("update-business", (_, id, biz) => {
    const stmt = db.prepare("UPDATE businesses SET businessName = ?, storeName = ?, logo = ?, address = ?, phone = ?, email = ?, currency = ? WHERE id = ?");
    return stmt.run(biz.businessName, biz.storeName, biz.logo, biz.address, biz.phone, biz.email, biz.currency, id);
  });
  electron.ipcMain.handle("get-categories", () => {
    const bizId = getActiveBusinessId();
    return db.prepare("SELECT * FROM categories WHERE businessId = ? AND isCustom = 1 ORDER BY name").all(bizId);
  });
  electron.ipcMain.handle("insert-category", (_, name, icon) => {
    const bizId = getActiveBusinessId();
    const result = db.prepare("INSERT INTO categories (businessId, name, icon, isCustom) VALUES (?, ?, ?, 1)").run(bizId, name, icon || "tag");
    return result.lastInsertRowid;
  });
  electron.ipcMain.handle("delete-category", (_, id) => {
    const bizId = getActiveBusinessId();
    db.prepare("SELECT name FROM categories WHERE id = ?").get(id);
    db.prepare("DELETE FROM categories WHERE id = ? AND businessId = ? AND isCustom = 1").run(id, bizId);
  });
  electron.ipcMain.handle("get-items", (_, options = {}) => {
    const bizId = getActiveBusinessId();
    let query = "SELECT items.*, categories.name as categoryName, suppliers.supplierName FROM items LEFT JOIN categories ON items.categoryId = categories.id LEFT JOIN suppliers ON items.supplierId = suppliers.id";
    const params = [];
    const conditions = ["items.businessId = ?", "items.is_deleted = 0"];
    params.push(bizId);
    if (options.search) {
      conditions.push("(items.name LIKE ? OR items.companyName LIKE ?)");
      params.push(`%${options.search}%`, `%${options.search}%`);
    }
    if (options.category && options.category !== "All") {
      conditions.push("categories.name = ?");
      params.push(options.category);
    }
    if (options.supplierId) {
      conditions.push("items.supplierId = ?");
      params.push(options.supplierId);
    }
    if (options.startDate && options.endDate) {
      if (options.startDate === options.endDate) {
        conditions.push("items.createdAt >= ? AND items.createdAt < ?");
        params.push(options.startDate, options.startDate + "T23:59:59.999Z");
      } else {
        conditions.push("items.createdAt >= ? AND items.createdAt <= ?");
        params.push(options.startDate, options.endDate + "T23:59:59.999Z");
      }
    } else if (options.startDate) {
      conditions.push("items.createdAt >= ?");
      params.push(options.startDate);
    } else if (options.endDate) {
      conditions.push("items.createdAt <= ?");
      params.push(options.endDate + "T23:59:59.999Z");
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY items.createdAt DESC";
    const listLimit = options.limit ?? DEFAULT_LIST_LIMIT;
    query += " LIMIT ?";
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-item", (_, id) => {
    const bizId = getActiveBusinessId();
    const item = db.prepare(`
      SELECT items.*, categories.name as categoryName, suppliers.supplierName
      FROM items
      LEFT JOIN categories ON items.categoryId = categories.id
      LEFT JOIN suppliers ON items.supplierId = suppliers.id
      WHERE items.id = ? AND items.businessId = ? AND items.is_deleted = 0
    `).get(id, bizId);
    if (!item) return null;
    const totalPurchased = db.prepare(`
      SELECT COALESCE(SUM(spi.quantity), 0) AS totalPurchasedQuantity
      FROM supplier_purchase_items spi
      JOIN supplier_purchases sp ON sp.id = spi.purchaseId
      WHERE spi.itemId = ?
    `).get(id);
    const lastPO = db.prepare(`
      SELECT sp.purchaseNumber AS lastPurchaseOrderRef, sp.purchaseDate AS lastPurchaseOrderDate
      FROM supplier_purchase_items spi
      JOIN supplier_purchases sp ON sp.id = spi.purchaseId
      WHERE spi.itemId = ?
      ORDER BY sp.purchaseDate DESC
      LIMIT 1
    `).get(id);
    return { ...item, ...totalPurchased, ...lastPO };
  });
  electron.ipcMain.handle("insert-item", (_, item) => {
    if (!item.name || !item.name.trim()) throw new Error("Product name is required");
    const unitsPerPack = validatePositive(item.unitsPerPack ?? 1, "Units per pack");
    const bizId = getActiveBusinessId();
    const stmt = db.prepare(`
      INSERT INTO items (
        businessId, name, categoryId, companyName, purchaseUnit, baseUnit, unitsPerPack,
        totalPackQuantity, totalBaseQuantity, packPurchasePrice, basePurchasePrice,
        baseSellingPrice, packSellingPrice, allowSellByBaseUnit, allowSellByPackUnit,
        expiryDate, qualityGrade, notes, isCredit, supplierPhone, supplierId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const newBaseQty = item.totalBaseQuantity || 0;
    const newPackQty = item.totalPackQuantity || 0;
    const result = stmt.run(
      bizId,
      item.name,
      item.categoryId || null,
      item.companyName,
      item.purchaseUnit,
      item.baseUnit,
      unitsPerPack,
      newPackQty,
      newBaseQty,
      item.packPurchasePrice || 0,
      item.basePurchasePrice || 0,
      item.baseSellingPrice || 0,
      item.packSellingPrice || 0,
      item.allowSellByBaseUnit ? 1 : 0,
      item.allowSellByPackUnit ? 1 : 0,
      item.expiryDate || null,
      item.qualityGrade,
      item.notes,
      item.isCredit ? 1 : 0,
      item.supplierPhone,
      item.supplierId || null
    );
    const newId = result.lastInsertRowid;
    if (item.supplierId && newBaseQty > 0) {
      try {
        const purchaseNumber = `PO-${Date.now().toString().slice(-8)}`;
        const unitPrice = item.basePurchasePrice || item.baseSellingPrice || 0;
        const totalAmount = unitPrice * newBaseQty;
        const paidAmount = item.isCredit ? 0 : totalAmount;
        const status = item.isCredit ? "pending" : "received";
        db.prepare(`
          INSERT INTO supplier_purchases (
            businessId, supplierId, purchaseNumber, purchaseDate,
            totalAmount, paidAmount, dueDate, status, notes, createdBy
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          bizId,
          item.supplierId,
          purchaseNumber,
          (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          totalAmount,
          paidAmount,
          item.expiryDate || null,
          status,
          `Auto-created from inventory item "${item.name}"`,
          currentUserName || "system"
        );
        const purchaseId = db.prepare("SELECT last_insert_rowid() AS id").get();
        db.prepare(`
          INSERT INTO supplier_purchase_items (purchaseId, itemId, itemName, sku, quantity, unit, unitPrice, totalPrice)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(purchaseId.id, newId, item.name, item.sku || null, newBaseQty, item.baseUnit || "pcs", unitPrice, totalAmount);
        logSupplierActivity(
          item.supplierId,
          "purchase_created",
          "supplier_purchase",
          purchaseId.id,
          `Auto purchase ${purchaseNumber} for ${item.name}`
        );
      } catch (e) {
        console.error("Auto-create supplier purchase failed:", e);
      }
    }
    return newId;
  });
  electron.ipcMain.handle("update-item", (_, id, item) => {
    if (!item.name || !item.name.trim()) throw new Error("Product name is required");
    const unitsPerPack = validatePositive(item.unitsPerPack ?? 1, "Units per pack");
    const bizId = getActiveBusinessId();
    const stmt = db.prepare(`
      UPDATE items SET
        name = ?, categoryId = ?, companyName = ?, purchaseUnit = ?, baseUnit = ?, unitsPerPack = ?,
        totalPackQuantity = ?, totalBaseQuantity = ?, packPurchasePrice = ?, basePurchasePrice = ?,
        baseSellingPrice = ?, packSellingPrice = ?, allowSellByBaseUnit = ?, allowSellByPackUnit = ?,
        expiryDate = ?, qualityGrade = ?, notes = ?, isCredit = ?, supplierPhone = ?,
        supplierId = ?
      WHERE id = ? AND businessId = ?
    `);
    const result = stmt.run(
      item.name,
      item.categoryId || null,
      item.companyName,
      item.purchaseUnit,
      item.baseUnit,
      unitsPerPack,
      item.totalPackQuantity || 0,
      item.totalBaseQuantity || 0,
      item.packPurchasePrice || 0,
      item.basePurchasePrice || 0,
      item.baseSellingPrice || 0,
      item.packSellingPrice || 0,
      item.allowSellByBaseUnit ? 1 : 0,
      item.allowSellByPackUnit ? 1 : 0,
      item.expiryDate || null,
      item.qualityGrade,
      item.notes,
      item.isCredit ? 1 : 0,
      item.supplierPhone,
      item.supplierId || null,
      id,
      bizId
    );
    if (item.supplierId) {
      const existingPurchase = db.prepare(`
        SELECT 1 FROM supplier_purchase_items spi
        JOIN supplier_purchases sp ON sp.id = spi.purchaseId
        WHERE spi.itemId = ? AND sp.supplierId = ? AND sp.status != 'cancelled'
        LIMIT 1
      `).get(id, item.supplierId);
      if (!existingPurchase) {
        const newBaseQty = item.totalBaseQuantity || 0;
        if (newBaseQty > 0) {
          try {
            const purchaseNumber = `PO-${Date.now().toString().slice(-8)}`;
            const unitPrice = item.basePurchasePrice || item.baseSellingPrice || 0;
            const totalAmount = unitPrice * newBaseQty;
            const paidAmount = item.isCredit ? 0 : totalAmount;
            const status = item.isCredit ? "pending" : "received";
            db.prepare(`
              INSERT INTO supplier_purchases (
                businessId, supplierId, purchaseNumber, purchaseDate,
                totalAmount, paidAmount, dueDate, status, notes, createdBy
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              bizId,
              item.supplierId,
              purchaseNumber,
              (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
              totalAmount,
              paidAmount,
              item.expiryDate || null,
              status,
              `Auto-created from inventory item "${item.name}"`,
              currentUserName || "system"
            );
            const purchaseId = db.prepare("SELECT last_insert_rowid() AS id").get();
            db.prepare(`
              INSERT INTO supplier_purchase_items (purchaseId, itemId, itemName, sku, quantity, unit, unitPrice, totalPrice)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(purchaseId.id, id, item.name, item.sku || null, newBaseQty, item.baseUnit || "pcs", unitPrice, totalAmount);
            logSupplierActivity(
              item.supplierId,
              "purchase_created",
              "supplier_purchase",
              purchaseId.id,
              `Auto purchase ${purchaseNumber} for ${item.name}`
            );
          } catch (e) {
            console.error("Auto-create supplier purchase failed (update):", e);
          }
        }
      }
    }
    return result;
  });
  electron.ipcMain.handle("delete-item", (_, id) => {
    db.prepare("SELECT name FROM items WHERE id = ?").get(id);
    db.prepare("UPDATE items SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?").run(currentUserName || "unknown", id);
    return { success: true };
  });
  electron.ipcMain.handle("get-low-stock-items", () => {
    const bizId = getActiveBusinessId();
    return db.prepare("SELECT items.*, suppliers.supplierName, suppliers.id as linkedSupplierId FROM items LEFT JOIN suppliers ON items.supplierId = suppliers.id WHERE items.totalBaseQuantity < 10 AND items.businessId = ? ORDER BY items.totalBaseQuantity ASC LIMIT ?").all(bizId, DEFAULT_LIST_LIMIT);
  });
  electron.ipcMain.handle("get-expiring-items", () => {
    const bizId = getActiveBusinessId();
    const thirtyDaysFromNow = /* @__PURE__ */ new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return db.prepare("SELECT items.*, suppliers.supplierName, suppliers.id as linkedSupplierId FROM items LEFT JOIN suppliers ON items.supplierId = suppliers.id WHERE items.expiryDate IS NOT NULL AND items.expiryDate <= ? AND items.businessId = ? ORDER BY items.expiryDate ASC LIMIT ?").all(thirtyDaysFromNow.toISOString().split("T")[0], bizId, DEFAULT_LIST_LIMIT);
  });
  electron.ipcMain.handle("get-items-by-supplier", (_, supplierId) => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT items.*, categories.name as categoryName, suppliers.supplierName
      FROM items
      LEFT JOIN categories ON items.categoryId = categories.id
      LEFT JOIN suppliers ON items.supplierId = suppliers.id
      WHERE items.supplierId = ? AND items.businessId = ? AND items.is_deleted = 0
      ORDER BY items.name ASC
    `).all(supplierId, bizId);
  });
  electron.ipcMain.handle("restock-item", (_, id, quantity) => {
    const bizId = getActiveBusinessId();
    const item = db.prepare("SELECT name, unitsPerPack FROM items WHERE id = ? AND businessId = ?").get(id, bizId);
    if (!item) throw new Error("Item not found");
    const qty = validatePositive(quantity, "Restock quantity");
    const packQty = qty / (item.unitsPerPack || 1);
    db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, totalPackQuantity = totalPackQuantity + ? WHERE id = ?").run(qty, packQty, id);
    const defWhId = getDefaultWarehouseId();
    const whRow = db.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, id);
    if (whRow) {
      db.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(qty, whRow.id);
    } else {
      db.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, id, qty);
    }
    db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, id, "restock_in", qty, "restock", `Restocked ${qty} ${item.name}`);
    return { success: true };
  });
  electron.ipcMain.handle("get-sales", (_, options = {}) => {
    const bizId = getActiveBusinessId();
    let query = "SELECT sales.*, items.name as itemName, items.basePurchasePrice, items.unitsPerPack, categories.name as categoryName FROM sales LEFT JOIN items ON sales.itemId = items.id LEFT JOIN categories ON items.categoryId = categories.id";
    const params = [];
    const conditions = ["sales.businessId = ?"];
    params.push(bizId);
    if (options.search) {
      conditions.push("(items.name LIKE ? OR sales.customerName LIKE ?)");
      params.push(`%${options.search}%`, `%${options.search}%`);
    }
    if (options.paymentStatus) {
      conditions.push("sales.paymentStatus = ?");
      params.push(options.paymentStatus);
    }
    if (options.category && options.category !== "All") {
      conditions.push("categories.name = ?");
      params.push(options.category);
    }
    if (options.startDate && options.endDate) {
      if (options.startDate === options.endDate) {
        conditions.push("sales.createdAt >= ? AND sales.createdAt < ?");
        params.push(options.startDate, options.startDate + "T23:59:59.999Z");
      } else {
        conditions.push("sales.createdAt >= ? AND sales.createdAt <= ?");
        params.push(options.startDate, options.endDate + "T23:59:59.999Z");
      }
    } else if (options.startDate) {
      conditions.push("sales.createdAt >= ?");
      params.push(options.startDate);
    } else if (options.endDate) {
      conditions.push("sales.createdAt <= ?");
      params.push(options.endDate + "T23:59:59.999Z");
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY sales.createdAt DESC";
    const listLimit = options.limit ?? DEFAULT_LIST_LIMIT;
    query += " LIMIT ?";
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-sale", (_, id) => {
    return db.prepare("SELECT sales.*, items.name as itemName FROM sales LEFT JOIN items ON sales.itemId = items.id WHERE sales.id = ?").get(id);
  });
  electron.ipcMain.handle("insert-sales-batch", (_, sales) => {
    const bizId = getActiveBusinessId();
    const transaction = db.transaction(() => {
      const results = [];
      for (const sale of sales) {
        const item = db.prepare("SELECT * FROM items WHERE id = ?").get(sale.itemId);
        if (!item) throw new Error(`Item ${sale.itemId} not found`);
        const qty = validatePositive(sale.quantity, "Sale quantity");
        sale.quantity = qty;
        const stmt = db.prepare(`
          INSERT INTO sales (
            businessId, itemId, quantity, unit, unitType, discount, vat, totalPrice, 
            paymentMethod, paymentStatus, customerName, customerPhone, packId, dueDate, paidAmount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          bizId,
          sale.itemId,
          sale.quantity,
          sale.unit,
          sale.unitType,
          sale.discount || 0,
          sale.vat || 0,
          sale.totalPrice,
          sale.paymentMethod,
          sale.paymentStatus,
          sale.customerName,
          sale.customerPhone,
          sale.packId || null,
          sale.dueDate || null,
          sale.paidAmount || 0
        );
        const cName = sale.customerName?.trim();
        if (cName && sale.paymentStatus === "Debt") {
          const exists = db.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(cName, bizId);
          if (!exists) {
            db.prepare(`INSERT INTO customers (businessId, customerName, phone, groupName) VALUES (?, ?, ?, ?)`).run(bizId, cName, sale.customerPhone?.trim() || "", "general");
          }
        }
        let baseDeduction = sale.quantity;
        let packDeduction = 0;
        if (sale.unitType === "pack") {
          baseDeduction = sale.quantity * (item.unitsPerPack || 1);
          packDeduction = sale.quantity;
        } else {
          packDeduction = sale.quantity / (item.unitsPerPack || 1);
        }
        if (item.totalBaseQuantity < baseDeduction) {
          throw new Error(`Insufficient stock: ${item.name} has ${item.totalBaseQuantity} ${item.baseUnit}, need ${baseDeduction}`);
        }
        db.prepare(`
          UPDATE items 
          SET totalBaseQuantity = totalBaseQuantity - ?,
              totalPackQuantity = totalPackQuantity - ?
          WHERE id = ?
        `).run(baseDeduction, packDeduction, sale.itemId);
        const defWhId = getDefaultWarehouseId();
        const whRow = db.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, sale.itemId);
        if (whRow) {
          if (whRow.quantity < baseDeduction) {
            throw new Error(`Insufficient stock at warehouse: ${item.name} has ${whRow.quantity}, need ${baseDeduction}`);
          }
          db.prepare("UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(baseDeduction, whRow.id);
        } else {
          db.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, sale.itemId, -baseDeduction);
        }
        db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, sale.itemId, "sale_out", baseDeduction, "sale", `Sale batch #${result.lastInsertRowid}`);
        results.push(result.lastInsertRowid);
      }
      return results;
    });
    return transaction();
  });
  electron.ipcMain.handle("insert-sale", (_, sale) => {
    const bizId = getActiveBusinessId();
    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(sale.itemId);
    if (!item) throw new Error(`Item ${sale.itemId} not found`);
    const qty = validatePositive(sale.quantity, "Sale quantity");
    sale.quantity = qty;
    const transaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO sales (
          businessId, itemId, quantity, unit, unitType, discount, vat, totalPrice, 
          paymentMethod, paymentStatus, customerName, customerPhone, packId, dueDate, paidAmount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        bizId,
        sale.itemId,
        sale.quantity,
        sale.unit,
        sale.unitType,
        sale.discount || 0,
        sale.vat || 0,
        sale.totalPrice,
        sale.paymentMethod,
        sale.paymentStatus,
        sale.customerName,
        sale.customerPhone,
        sale.packId || null,
        sale.dueDate || null,
        sale.paidAmount || 0
      );
      const cName = sale.customerName?.trim();
      if (cName && sale.paymentStatus === "Debt") {
        const exists = db.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(cName, bizId);
        if (!exists) {
          db.prepare(`INSERT INTO customers (businessId, customerName, phone, groupName) VALUES (?, ?, ?, ?)`).run(bizId, cName, sale.customerPhone?.trim() || "", "general");
        }
      }
      let baseDeduction = sale.quantity;
      let packDeduction = 0;
      if (sale.unitType === "pack") {
        baseDeduction = sale.quantity * (item.unitsPerPack || 1);
        packDeduction = sale.quantity;
      } else {
        packDeduction = sale.quantity / (item.unitsPerPack || 1);
      }
      if (item.totalBaseQuantity < baseDeduction) {
        throw new Error(`Insufficient stock: ${item.name} has ${item.totalBaseQuantity} ${item.baseUnit}, need ${baseDeduction}`);
      }
      db.prepare(`
          UPDATE items 
          SET totalBaseQuantity = totalBaseQuantity - ?,
              totalPackQuantity = totalPackQuantity - ?
          WHERE id = ?
        `).run(baseDeduction, packDeduction, sale.itemId);
      const defWhId = getDefaultWarehouseId();
      const whRow = db.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, sale.itemId);
      if (whRow) {
        if (whRow.quantity < baseDeduction) {
          throw new Error(`Insufficient stock at warehouse: ${item.name} has ${whRow.quantity}, need ${baseDeduction}`);
        }
        db.prepare("UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(baseDeduction, whRow.id);
      } else {
        db.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, sale.itemId, -baseDeduction);
      }
      db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, sale.itemId, "sale_out", baseDeduction, "sale", `Sale #${result.lastInsertRowid}`);
      const saleId = result.lastInsertRowid;
      return saleId;
    });
    return transaction();
  });
  electron.ipcMain.handle("update-sale", (_, id, sale) => {
    const bizId = getActiveBusinessId();
    const original = db.prepare("SELECT * FROM sales WHERE id = ? AND businessId = ?").get(id, bizId);
    if (!original) throw new Error("Sale not found");
    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(sale.itemId || original.itemId);
    if (!item) throw new Error("Item not found");
    const transaction = db.transaction(() => {
      const qtyDiff = (sale.quantity || original.quantity) - original.quantity;
      if (qtyDiff !== 0) {
        let baseDiff = Math.abs(qtyDiff);
        let packDiff = 0;
        const unitType = sale.unitType || original.unitType;
        if (unitType === "pack") {
          baseDiff = Math.abs(qtyDiff) * (item.unitsPerPack || 1);
          packDiff = Math.abs(qtyDiff);
        } else {
          packDiff = Math.abs(qtyDiff) / (item.unitsPerPack || 1);
        }
        if (qtyDiff > 0) {
          if (item.totalBaseQuantity < baseDiff) {
            throw new Error(`Insufficient stock: ${item.name} has ${item.totalBaseQuantity}, need additional ${baseDiff}`);
          }
          db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity - ?, totalPackQuantity = totalPackQuantity - ? WHERE id = ?").run(baseDiff, packDiff, sale.itemId || original.itemId);
          const defWhId = getDefaultWarehouseId();
          const whRow = db.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, sale.itemId || original.itemId);
          if (whRow) {
            if (whRow.quantity < baseDiff) throw new Error(`Insufficient stock at warehouse`);
            db.prepare("UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(baseDiff, whRow.id);
          }
        } else {
          db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, totalPackQuantity = totalPackQuantity + ? WHERE id = ?").run(baseDiff, packDiff, sale.itemId || original.itemId);
          const defWhId = getDefaultWarehouseId();
          const whRow = db.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, sale.itemId || original.itemId);
          if (whRow) {
            db.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(baseDiff, whRow.id);
          } else {
            db.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, sale.itemId || original.itemId, baseDiff);
          }
        }
      }
      db.prepare(`
        UPDATE sales SET
          quantity = ?, unit = ?, unitType = ?, discount = ?, vat = ?, totalPrice = ?,
          paymentMethod = ?, paymentStatus = ?, customerName = ?, customerPhone = ?,
          dueDate = ?, paidAmount = ?
        WHERE id = ? AND businessId = ?
      `).run(
        sale.quantity,
        sale.unit,
        sale.unitType,
        sale.discount,
        sale.vat,
        sale.totalPrice,
        sale.paymentMethod,
        sale.paymentStatus,
        sale.customerName,
        sale.customerPhone,
        sale.dueDate,
        sale.paidAmount,
        id,
        bizId
      );
    });
    transaction();
    return { success: true };
  });
  electron.ipcMain.handle("delete-sale", (_, id) => {
    const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(id);
    if (!sale) return { success: false };
    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(sale.itemId);
    const transaction = db.transaction(() => {
      if (item) {
        let baseRestore = sale.quantity;
        let packRestore = 0;
        if (sale.unitType === "pack") {
          baseRestore = sale.quantity * (item.unitsPerPack || 1);
          packRestore = sale.quantity;
        } else {
          packRestore = sale.quantity / (item.unitsPerPack || 1);
        }
        db.prepare(`
          UPDATE items 
          SET totalBaseQuantity = totalBaseQuantity + ?,
              totalPackQuantity = totalPackQuantity + ?
          WHERE id = ?
        `).run(baseRestore, packRestore, sale.itemId);
        const defWhId = getDefaultWarehouseId();
        const whRow = db.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, sale.itemId);
        if (whRow) {
          db.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(baseRestore, whRow.id);
        } else {
          db.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, sale.itemId, baseRestore);
        }
        db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, sale.itemId, "sale_restore", baseRestore, "sale", `Sale #${id} deleted — stock restored`);
      }
      db.prepare("DELETE FROM returns WHERE saleId = ?").run(id);
      db.prepare("DELETE FROM sales WHERE id = ?").run(id);
    });
    transaction();
    return { success: true };
  });
  electron.ipcMain.handle("create-return", (_, data) => {
    const bizId = getActiveBusinessId();
    const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(data.saleId);
    if (!sale) return { success: false, error: "Sale not found" };
    if (sale.businessId !== bizId) return { success: false, error: "Unauthorized" };
    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(sale.itemId);
    if (!item) return { success: false, error: "Item not found" };
    const returnQty = validatePositive(data.quantity, "Return quantity");
    if (returnQty > sale.quantity) return { success: false, error: "Return quantity exceeds original sale quantity" };
    const transaction = db.transaction(() => {
      let baseRestore = returnQty;
      let packRestore = 0;
      if (sale.unitType === "pack") {
        baseRestore = returnQty * (item.unitsPerPack || 1);
        packRestore = returnQty;
      } else {
        packRestore = returnQty / (item.unitsPerPack || 1);
      }
      db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, totalPackQuantity = totalPackQuantity + ? WHERE id = ?").run(baseRestore, packRestore, sale.itemId);
      const defWhId = getDefaultWarehouseId();
      const whRow = db.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, sale.itemId);
      if (whRow) {
        db.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(baseRestore, whRow.id);
      } else {
        db.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, sale.itemId, baseRestore);
      }
      db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, sale.itemId, "return_in", baseRestore, "return", `Return for sale #${sale.id}`);
      const result = db.prepare(`
        INSERT INTO returns (businessId, saleId, itemId, quantity, unit, unitType, refundAmount, reason, createdBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(bizId, sale.id, sale.itemId, returnQty, sale.unit, sale.unitType, data.refundAmount || 0, data.reason || "", data.createdBy || null);
      const priceReduction = returnQty * (sale.totalPrice / sale.quantity);
      const paidReduction = Math.min(sale.paidAmount || 0, data.refundAmount || 0);
      db.prepare(`
        UPDATE sales SET quantity = quantity - ?, totalPrice = totalPrice - ?,
          paidAmount = MAX(0, paidAmount - ?),
          paymentStatus = CASE WHEN quantity - ? <= 0 THEN 'Returned' WHEN paidAmount >= totalPrice THEN 'Paid' ELSE 'Debt' END
        WHERE id = ?
      `).run(returnQty, priceReduction, paidReduction, returnQty, sale.id);
      return { success: true, returnId: result.lastInsertRowid };
    });
    return transaction();
  });
  electron.ipcMain.handle("get-returns", (_e, options) => {
    const bizId = getActiveBusinessId();
    let query = `
      SELECT r.*, s.customerName, s.itemName, i.name as itemName2
      FROM returns r
      LEFT JOIN sales s ON r.saleId = s.id
      LEFT JOIN items i ON r.itemId = i.id
      WHERE r.businessId = ?
    `;
    const params = [bizId];
    if (options?.startDate) {
      query += ` AND r.createdAt >= ?`;
      params.push(options.startDate);
    }
    if (options?.endDate) {
      query += ` AND r.createdAt <= ?`;
      params.push(options.endDate);
    }
    query += ` ORDER BY r.createdAt DESC LIMIT ${DEFAULT_LIST_LIMIT}`;
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-debt-sales", () => {
    const bizId = getActiveBusinessId();
    return db.prepare("SELECT sales.*, items.name as itemName FROM sales LEFT JOIN items ON sales.itemId = items.id WHERE sales.paymentStatus = ? AND sales.businessId = ? ORDER BY sales.dueDate ASC LIMIT ?").all("Debt", bizId, DEFAULT_LIST_LIMIT);
  });
  electron.ipcMain.handle("pay-debt", (_, saleId, amount, options) => {
    const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(saleId);
    if (!sale) throw new Error("Sale not found");
    const recordType = options?.type || "payment";
    const newPaid = (sale.paidAmount || 0) + amount;
    const newStatus = newPaid >= sale.totalPrice ? "Paid" : "Debt";
    const result = db.prepare("UPDATE sales SET paidAmount = ?, paymentStatus = ? WHERE id = ?").run(newPaid, newStatus, saleId);
    db.prepare("INSERT INTO debt_payments (saleId, customerName, customerPhone, amount, type, note) VALUES (?, ?, ?, ?, ?, ?)").run(saleId, sale.customerName || null, sale.customerPhone || null, amount, recordType, options?.note || null);
    return result;
  });
  electron.ipcMain.handle("get-debt-payments", (_, saleId) => {
    return db.prepare("SELECT * FROM debt_payments WHERE saleId = ? ORDER BY createdAt DESC").all(saleId);
  });
  electron.ipcMain.handle("get-expenses", (_, options = {}) => {
    const bizId = getActiveBusinessId();
    let query = "SELECT * FROM expenses";
    const params = [];
    const conditions = ["businessId = ?"];
    params.push(bizId);
    if (options.category) {
      conditions.push("category = ?");
      params.push(options.category);
    }
    if (options.startDate && options.endDate) {
      conditions.push("date BETWEEN ? AND ?");
      params.push(options.startDate, options.endDate);
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY date DESC";
    const listLimit = options.limit ?? DEFAULT_LIST_LIMIT;
    query += " LIMIT ?";
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("insert-expense", (_, expense) => {
    const bizId = getActiveBusinessId();
    const result = db.prepare("INSERT INTO expenses (businessId, name, amount, category, date, isRecurring, frequency, nextBillingDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
      bizId,
      expense.name,
      expense.amount,
      expense.category,
      expense.date,
      expense.isRecurring ? 1 : 0,
      expense.frequency,
      expense.nextBillingDate
    );
    try {
      const expenseDate = new Date(expense.date || /* @__PURE__ */ new Date());
      const month = String(expenseDate.getMonth() + 1).padStart(2, "0");
      const year = String(expenseDate.getFullYear());
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(expenseDate.getFullYear(), expenseDate.getMonth() + 1, 0).toISOString().split("T")[0];
      const budget = db.prepare("SELECT id, amount FROM budgets WHERE businessId = ? AND category = ? AND (month = ? OR month IS NULL) AND (year = ? OR year IS NULL)").get(bizId, expense.category, month, year);
      if (budget && budget.amount > 0) {
        const spentRow = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE businessId = ? AND category = ? AND date >= ? AND date <= ? AND is_deleted = 0").get(bizId, expense.category, startDate, endDate);
        const totalSpent = spentRow?.total || 0;
        const usagePercent = totalSpent / budget.amount * 100;
        if (totalSpent >= budget.amount) {
          const existingAlert = db.prepare("SELECT id FROM budget_alerts WHERE businessId = ? AND category = ? AND alertType = ? AND month = ? AND year = ?").get(bizId, expense.category, "budget_exceeded", month, year);
          if (!existingAlert) {
            db.prepare("INSERT INTO budget_alerts (businessId, category, alertType, threshold, message, month, year) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
              bizId,
              expense.category,
              "budget_exceeded",
              100,
              `${expense.category} budget of ETB ${budget.amount.toLocaleString()} has been exceeded (Total: ETB ${totalSpent.toLocaleString()})`,
              month,
              year
            );
          }
        } else if (usagePercent >= 80) {
          const existingAlert = db.prepare("SELECT id FROM budget_alerts WHERE businessId = ? AND category = ? AND alertType = ? AND month = ? AND year = ?").get(bizId, expense.category, "budget_warning", month, year);
          if (!existingAlert) {
            db.prepare("INSERT INTO budget_alerts (businessId, category, alertType, threshold, message, month, year) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
              bizId,
              expense.category,
              "budget_warning",
              80,
              `${expense.category} has reached ${Math.round(usagePercent)}% of its ETB ${budget.amount.toLocaleString()} budget`,
              month,
              year
            );
          }
        }
      }
    } catch (err) {
      console.error("Budget alert check failed:", err);
    }
    return result.lastInsertRowid;
  });
  electron.ipcMain.handle("update-expense", (_, id, expense) => {
    const result = db.prepare("UPDATE expenses SET name = ?, amount = ?, category = ?, date = ?, isRecurring = ?, frequency = ?, nextBillingDate = ? WHERE id = ?").run(
      expense.name,
      expense.amount,
      expense.category,
      expense.date,
      expense.isRecurring ? 1 : 0,
      expense.frequency,
      expense.nextBillingDate,
      id
    );
    return result;
  });
  electron.ipcMain.handle("delete-expense", (_, id) => {
    db.prepare("SELECT name FROM expenses WHERE id = ?").get(id);
    db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("get-adjustments", (_, options = {}) => {
    const bizId = getActiveBusinessId();
    let query = "SELECT adjustments.*, items.name as itemName FROM adjustments LEFT JOIN items ON adjustments.itemId = items.id";
    const params = [];
    const conditions = ["adjustments.businessId = ?"];
    params.push(bizId);
    if (options.itemId) {
      conditions.push("adjustments.itemId = ?");
      params.push(options.itemId);
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY adjustments.createdAt DESC";
    const listLimit = options.limit ?? DEFAULT_LIST_LIMIT;
    query += " LIMIT ?";
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("insert-adjustment", (_, adjustment) => {
    const validTypes = ["damage", "loss", "add_stock", "price_increase", "price_decrease"];
    if (!validTypes.includes(adjustment.type)) throw new Error(`Invalid adjustment type: ${adjustment.type}`);
    if (["damage", "loss", "add_stock"].includes(adjustment.type)) {
      validatePositive(adjustment.quantity, "Adjustment quantity");
      const item = db.prepare("SELECT totalBaseQuantity FROM items WHERE id = ?").get(adjustment.itemId);
      if (["damage", "loss"].includes(adjustment.type) && item && item.totalBaseQuantity < adjustment.quantity) {
        throw new Error(`Insufficient stock: item has ${item.totalBaseQuantity}, adjustment is ${adjustment.quantity}`);
      }
    }
    const bizId = getActiveBusinessId();
    const transaction = db.transaction(() => {
      const result = db.prepare("INSERT INTO adjustments (businessId, itemId, type, oldValue, newValue, quantity, unitType, reason, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        bizId,
        adjustment.itemId,
        adjustment.type,
        adjustment.oldValue,
        adjustment.newValue,
        adjustment.quantity,
        adjustment.unitType,
        adjustment.reason,
        adjustment.date
      );
      let invDelta = 0;
      if (adjustment.type === "damage" && adjustment.quantity) {
        db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity - ? WHERE id = ?").run(adjustment.quantity, adjustment.itemId);
        invDelta = -adjustment.quantity;
      }
      if (adjustment.type === "loss" && adjustment.quantity) {
        db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity - ? WHERE id = ?").run(adjustment.quantity, adjustment.itemId);
        invDelta = -adjustment.quantity;
      }
      if (adjustment.type === "add_stock" && adjustment.quantity) {
        db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ? WHERE id = ?").run(adjustment.quantity, adjustment.itemId);
        invDelta = adjustment.quantity;
      }
      if (invDelta !== 0) {
        const defWhId = getDefaultWarehouseId();
        const whRow = db.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, adjustment.itemId);
        if (whRow) {
          db.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(invDelta, whRow.id);
        } else if (invDelta > 0) {
          db.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, adjustment.itemId, invDelta);
        }
        db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, adjustment.itemId, `adj_${adjustment.type}`, Math.abs(invDelta), "adjustment", adjustment.reason || null);
      }
      if (adjustment.type === "price_increase" || adjustment.type === "price_decrease") {
        if (adjustment.unitType === "base") {
          db.prepare("UPDATE items SET baseSellingPrice = ? WHERE id = ?").run(adjustment.newValue, adjustment.itemId);
        } else {
          db.prepare("UPDATE items SET packSellingPrice = ? WHERE id = ?").run(adjustment.newValue, adjustment.itemId);
        }
      }
      const adjustmentId = result.lastInsertRowid;
      db.prepare("SELECT name FROM items WHERE id = ?").get(adjustment.itemId);
      adjustment.type.replace("_", " ");
      return adjustmentId;
    });
    return transaction();
  });
  electron.ipcMain.handle("check-notifications", () => {
    const bizId = getActiveBusinessId();
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const notifications = [];
    const prefRow = db.prepare("SELECT value FROM settings WHERE key = 'notification_preferences'").get();
    const prefs = prefRow ? JSON.parse(prefRow.value) : {
      inventory_alerts: true,
      debt_alerts: true,
      expiry_alerts: true
    };
    if (prefs.debt_alerts) {
      const overdueDebts = db.prepare(`
        SELECT sales.*, items.name as itemName 
        FROM sales LEFT JOIN items ON sales.itemId = items.id 
        WHERE sales.paymentStatus = 'Debt' AND sales.dueDate < ? AND sales.businessId = ?
      `).all(today, bizId);
      if (overdueDebts.length > 0) {
        const totalOverdue = overdueDebts.reduce((s, d) => s + (d.totalPrice - d.paidAmount), 0);
        notifications.push({
          title: `${overdueDebts.length} Overdue Debt${overdueDebts.length > 1 ? "s" : ""}`,
          message: `ETB ${totalOverdue.toLocaleString()} in overdue payments. Oldest from ${overdueDebts[overdueDebts.length - 1]?.customerName || "Unknown"}.`,
          type: "warning",
          group: "debt_alerts"
        });
      }
      const dueToday = db.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(totalPrice - paidAmount), 0) as total
        FROM sales WHERE paymentStatus = 'Debt' AND dueDate = ? AND businessId = ?
      `).get(today, bizId);
      if (dueToday.count > 0) {
        notifications.push({
          title: `${dueToday.count} Payment${dueToday.count > 1 ? "s" : ""} Due Today`,
          message: `ETB ${dueToday.total.toLocaleString()} in debt payments are due today.`,
          type: "info",
          group: "debt_alerts"
        });
      }
    }
    if (prefs.inventory_alerts) {
      const lowStockItems = db.prepare(
        "SELECT * FROM items WHERE totalBaseQuantity > 0 AND totalBaseQuantity < 10 AND businessId = ?"
      ).all(bizId);
      if (lowStockItems.length > 0) {
        notifications.push({
          title: `${lowStockItems.length} Low Stock Item${lowStockItems.length > 1 ? "s" : ""}`,
          message: `${lowStockItems.map((i) => i.name).slice(0, 3).join(", ")}${lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} more` : ""} running low.`,
          type: "warning",
          group: "inventory_alerts"
        });
      }
      const outOfStock = db.prepare(
        "SELECT COUNT(*) as count FROM items WHERE totalBaseQuantity <= 0 AND businessId = ?"
      ).get(bizId);
      if (outOfStock.count > 0) {
        notifications.push({
          title: `${outOfStock.count} Out of Stock`,
          message: `${outOfStock.count} product${outOfStock.count > 1 ? "s are" : " is"} completely out of stock. Reorder needed.`,
          type: "error",
          group: "inventory_alerts"
        });
      }
    }
    if (prefs.expiry_alerts) {
      const sevenDays = /* @__PURE__ */ new Date();
      sevenDays.setDate(sevenDays.getDate() + 7);
      const expiringItems = db.prepare(
        "SELECT * FROM items WHERE expiryDate IS NOT NULL AND expiryDate <= ? AND expiryDate >= ? AND businessId = ?"
      ).all(sevenDays.toISOString().split("T")[0], today, bizId);
      if (expiringItems.length > 0) {
        notifications.push({
          title: `${expiringItems.length} Item${expiringItems.length > 1 ? "s" : ""} Expiring Soon`,
          message: `${expiringItems.map((i) => i.name).slice(0, 3).join(", ")} expiring within 7 days.`,
          type: "warning",
          group: "expiry_alerts"
        });
      }
    }
    const insertStmt = db.prepare(`
      INSERT INTO notifications (businessId, title, message, type, category, severity, actionUrl, actionLabel, entityType, entityId, channels, requiresAction)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const existsStmt = db.prepare(
      "SELECT COUNT(*) as count FROM notifications WHERE businessId = ? AND title = ? AND type = ? AND DATE(createdAt) = ?"
    );
    let newCount = 0;
    for (const n of notifications) {
      const exists = existsStmt.get(bizId, n.title, n.type, today);
      if (exists.count === 0) {
        insertStmt.run(
          bizId,
          n.title,
          n.message,
          n.type,
          n.group || "system",
          n.type || "info",
          n.actionUrl || null,
          n.actionLabel || null,
          n.entityType || null,
          n.entityId || null,
          n.channels || "in_app",
          n.requiresAction ? 1 : 0
        );
        newCount++;
        try {
          if (n.type === "error" || n.type === "warning") {
            const { Notification: ElectronNotification, nativeImage } = require("electron");
            if (ElectronNotification.isSupported()) {
              const icon = nativeImage.createFromPath(path.join(electron.app.getAppPath(), "src/assets/images/logo.ico"));
              new ElectronNotification({ title: n.title, body: n.message, icon, urgency: n.type === "error" ? "critical" : "normal" }).show();
            }
          }
        } catch (_) {
        }
      }
    }
    return {
      generated: newCount,
      total: notifications.length,
      bad: notifications.filter((n) => n.type === "warning" || n.type === "error").length
    };
  });
  electron.ipcMain.handle("get-notifications", (_, options = {}) => {
    const bizId = getActiveBusinessId();
    let query = "SELECT * FROM notifications WHERE businessId = ?";
    const params = [bizId];
    if (options.unreadOnly) query += " AND isRead = 0";
    if (options.dismissedOnly) query += " AND isDismissed = 1";
    if (!options.includeDismissed) query += " AND isDismissed = 0";
    if (options.category) {
      query += " AND category = ?";
      params.push(options.category);
    }
    if (options.severity) {
      query += " AND severity = ?";
      params.push(options.severity);
    }
    if (options.search) {
      query += " AND (title LIKE ? OR message LIKE ?)";
      const s = `%${options.search}%`;
      params.push(s, s);
    }
    query += " AND (snoozedUntil IS NULL OR snoozedUntil <= CURRENT_TIMESTAMP)";
    query += " AND (expiresAt IS NULL OR expiresAt > CURRENT_TIMESTAMP)";
    query += " ORDER BY createdAt DESC";
    const listLimit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    query += " LIMIT ? OFFSET ?";
    params.push(listLimit, offset);
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-unread-notification-count", () => {
    const bizId = getActiveBusinessId();
    const row = db.prepare(`
      SELECT COUNT(*) AS c FROM notifications
      WHERE businessId = ? AND isRead = 0 AND isDismissed = 0
        AND (snoozedUntil IS NULL OR snoozedUntil <= CURRENT_TIMESTAMP)
        AND (expiresAt IS NULL OR expiresAt > CURRENT_TIMESTAMP)
    `).get(bizId);
    return row?.c || 0;
  });
  electron.ipcMain.handle("get-notification-categories", () => {
    const bizId = getActiveBusinessId();
    const rows = db.prepare(`
      SELECT category, COUNT(*) AS total, SUM(CASE WHEN isRead = 0 THEN 1 ELSE 0 END) AS unread
      FROM notifications WHERE businessId = ? AND isDismissed = 0
        AND (snoozedUntil IS NULL OR snoozedUntil <= CURRENT_TIMESTAMP)
        AND (expiresAt IS NULL OR expiresAt > CURRENT_TIMESTAMP)
      GROUP BY category
    `).all(bizId);
    return rows;
  });
  electron.ipcMain.handle("insert-notification", (_, notification) => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      INSERT INTO notifications (
        businessId, title, message, type, category, severity,
        actionUrl, actionLabel, entityType, entityId, channels, requiresAction
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bizId,
      notification.title,
      notification.message,
      notification.type || "info",
      notification.category || "system",
      notification.severity || notification.type || "info",
      notification.actionUrl || null,
      notification.actionLabel || null,
      notification.entityType || null,
      notification.entityId || null,
      notification.channels || "in_app",
      notification.requiresAction ? 1 : 0
    ).lastInsertRowid;
  });
  electron.ipcMain.handle("mark-notification-read", (_, id) => {
    return db.prepare("UPDATE notifications SET isRead = 1 WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("mark-all-notifications-read", () => {
    const bizId = getActiveBusinessId();
    return db.prepare("UPDATE notifications SET isRead = 1 WHERE businessId = ?").run(bizId);
  });
  electron.ipcMain.handle("dismiss-notification", (_, id) => {
    return db.prepare("UPDATE notifications SET isDismissed = 1, isRead = 1 WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("snooze-notification", (_, id, untilIso) => {
    return db.prepare("UPDATE notifications SET snoozedUntil = ? WHERE id = ?").run(untilIso, id);
  });
  electron.ipcMain.handle("clear-notifications", (_, options = {}) => {
    const bizId = getActiveBusinessId();
    if (options.olderThanDays) {
      return db.prepare(`DELETE FROM notifications WHERE businessId = ? AND createdAt < datetime('now', '-' || ? || ' days')`).run(bizId, options.olderThanDays);
    }
    if (options.category) {
      return db.prepare("DELETE FROM notifications WHERE businessId = ? AND category = ?").run(bizId, options.category);
    }
    return db.prepare("DELETE FROM notifications WHERE businessId = ?").run(bizId);
  });
  electron.ipcMain.handle("get-notification-preferences", () => {
    return db.prepare("SELECT * FROM notification_preferences ORDER BY key").all();
  });
  electron.ipcMain.handle("update-notification-preference", (_, key, prefs) => {
    const existing = db.prepare("SELECT key FROM notification_preferences WHERE key = ?").get(key);
    if (!existing) {
      db.prepare(`
        INSERT INTO notification_preferences (key, enabled, sound, desktop, email, inApp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(key, prefs.enabled ?? 1, prefs.sound ?? 0, prefs.desktop ?? 0, prefs.email ?? 0, prefs.inApp ?? 1);
    } else {
      db.prepare(`
        UPDATE notification_preferences SET
          enabled = ?, sound = ?, desktop = ?, email = ?, inApp = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE key = ?
      `).run(prefs.enabled ?? 1, prefs.sound ?? 0, prefs.desktop ?? 0, prefs.email ?? 0, prefs.inApp ?? 1, key);
    }
    return { success: true };
  });
  electron.ipcMain.handle("get-active-banners", () => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT * FROM notification_banners
      WHERE businessId = ? AND dismissedAt IS NULL
        AND (endsAt IS NULL OR endsAt > CURRENT_TIMESTAMP)
        AND startsAt <= CURRENT_TIMESTAMP
      ORDER BY createdAt DESC
    `).all(bizId);
  });
  electron.ipcMain.handle("dismiss-banner", (_, id) => {
    return db.prepare("UPDATE notification_banners SET dismissedAt = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("create-banner", (_, data) => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      INSERT INTO notification_banners (businessId, title, message, severity, dismissible, startsAt, endsAt, actionUrl, actionLabel)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bizId,
      data.title,
      data.message,
      data.severity || "info",
      data.dismissible === false ? 0 : 1,
      data.startsAt || (/* @__PURE__ */ new Date()).toISOString(),
      data.endsAt || null,
      data.actionUrl || null,
      data.actionLabel || null
    ).lastInsertRowid;
  });
  electron.ipcMain.handle("get-reminders", (_, options = {}) => {
    const bizId = getActiveBusinessId();
    let q = "SELECT * FROM notification_reminders WHERE businessId = ?";
    const params = [bizId];
    if (options.status) {
      q += " AND status = ?";
      params.push(options.status);
    }
    q += " ORDER BY triggerDate ASC LIMIT ?";
    params.push(options.limit ?? DEFAULT_LIST_LIMIT);
    return db.prepare(q).all(...params);
  });
  electron.ipcMain.handle("create-reminder", (_, data) => {
    const bizId = getActiveBusinessId();
    if (!data.title || !data.triggerDate) throw new Error("title, triggerDate are required");
    const category = data.category || "general";
    return db.prepare(`
      INSERT INTO notification_reminders (businessId, title, message, category, triggerDate, repeatInterval, relatedEntityType, relatedEntityId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bizId,
      data.title,
      data.message || null,
      category,
      data.triggerDate,
      data.repeatInterval || null,
      data.relatedEntityType || null,
      data.relatedEntityId || null
    ).lastInsertRowid;
  });
  electron.ipcMain.handle("update-reminder", (_, id, data) => {
    const fields = [];
    const params = [];
    if (data.title !== void 0) {
      fields.push("title = ?");
      params.push(data.title);
    }
    if (data.message !== void 0) {
      fields.push("message = ?");
      params.push(data.message);
    }
    if (data.triggerDate !== void 0) {
      fields.push("triggerDate = ?");
      params.push(data.triggerDate);
    }
    if (data.repeatInterval !== void 0) {
      fields.push("repeatInterval = ?");
      params.push(data.repeatInterval);
    }
    if (data.category !== void 0) {
      fields.push("category = ?");
      params.push(data.category);
    }
    if (fields.length === 0) throw new Error("No fields to update");
    params.push(id);
    return db.prepare(`UPDATE notification_reminders SET ${fields.join(", ")} WHERE id = ?`).run(...params);
  });
  electron.ipcMain.handle("snooze-reminder", (_, id, untilIso) => {
    return db.prepare("UPDATE notification_reminders SET snoozedUntil = ?, status = 'snoozed' WHERE id = ?").run(untilIso, id);
  });
  electron.ipcMain.handle("complete-reminder", (_, id) => {
    return db.prepare(`UPDATE notification_reminders SET status = 'completed', completedAt = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
  });
  electron.ipcMain.handle("delete-reminder", (_, id) => {
    return db.prepare("DELETE FROM notification_reminders WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("run-reminder-engine", () => {
    const bizId = getActiveBusinessId();
    const now = /* @__PURE__ */ new Date();
    const nowIso = now.toISOString();
    const allPending = db.prepare(`
      SELECT * FROM notification_reminders
      WHERE businessId = ? AND status = 'pending'
        AND (snoozedUntil IS NULL OR snoozedUntil <= ?)
    `).all(bizId, nowIso);
    const dueReminders = allPending.filter((r) => {
      if (!r.triggerDate) return false;
      const trigger = new Date(r.triggerDate);
      return !isNaN(trigger.getTime()) && trigger <= now;
    });
    let fired = 0;
    const insertNotif = db.prepare(`
      INSERT INTO notifications (businessId, title, message, type, category, severity, actionUrl, actionLabel, entityType, entityId, channels, requiresAction)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const updateReminder = db.prepare(`
      UPDATE notification_reminders SET lastTriggeredAt = ?, triggerDate = ? WHERE id = ?
    `);
    const completeReminder = db.prepare(`UPDATE notification_reminders SET status = 'completed', completedAt = ? WHERE id = ?`);
    for (const r of dueReminders) {
      const prefRow = db.prepare("SELECT * FROM notification_preferences WHERE key = ?").get(r.category);
      const pref = prefRow || { desktop: 0 };
      insertNotif.run(
        bizId,
        r.title,
        r.message || "",
        "info",
        r.category,
        "info",
        r.relatedEntityType ? `/${r.relatedEntityType}` : null,
        r.relatedEntityType ? "View" : null,
        r.relatedEntityType || null,
        r.relatedEntityId || null,
        pref.desktop ? "desktop,in_app" : "in_app",
        1
      );
      if (pref.desktop) {
        try {
          const { Notification: ElectronNotification, nativeImage } = require("electron");
          if (ElectronNotification.isSupported()) {
            const icon = nativeImage.createFromPath(path.join(electron.app.getAppPath(), "src/assets/images/logo.ico"));
            new ElectronNotification({ title: r.title, body: r.message || "", icon }).show();
          }
        } catch (_) {
        }
      }
      if (r.repeatInterval) {
        const next = new Date(r.triggerDate);
        if (r.repeatInterval === "daily") next.setDate(next.getDate() + 1);
        else if (r.repeatInterval === "weekly") next.setDate(next.getDate() + 7);
        else if (r.repeatInterval === "monthly") next.setMonth(next.getMonth() + 1);
        else if (r.repeatInterval.startsWith("days:")) {
          const days = parseInt(r.repeatInterval.split(":")[1]) || 1;
          next.setDate(next.getDate() + days);
        }
        updateReminder.run(nowIso, next.toISOString(), r.id);
      } else {
        completeReminder.run(nowIso, r.id);
      }
      fired++;
    }
    return { fired };
  });
  electron.ipcMain.handle("show-desktop-notification", (_, data) => {
    try {
      const { Notification: ElectronNotification, nativeImage } = require("electron");
      if (!ElectronNotification.isSupported()) return { shown: false, reason: "unsupported" };
      const icon = nativeImage.createFromPath(path.join(electron.app.getAppPath(), "src/assets/images/logo.ico"));
      const n = new ElectronNotification({
        title: data.title,
        body: data.body,
        icon,
        urgency: data.urgency || "normal",
        silent: false
      });
      n.show();
      return { shown: true };
    } catch (e) {
      return { shown: false, reason: e.message };
    }
  });
  electron.ipcMain.handle("get-dashboard-alerts", () => {
    const bizId = getActiveBusinessId();
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const alerts = [];
    const lowStock = db.prepare(`
      SELECT id, name, totalBaseQuantity FROM items
      WHERE businessId = ? AND totalBaseQuantity > 0 AND totalBaseQuantity < 10
      ORDER BY totalBaseQuantity ASC LIMIT 5
    `).all(bizId);
    if (lowStock.length > 0) {
      alerts.push({
        id: "low_stock",
        type: "warning",
        title: "Low Stock",
        message: `${lowStock.length} product(s) running low. ${lowStock.map((i) => i.name).slice(0, 3).join(", ")}.`,
        count: lowStock.length,
        actionUrl: "/inventory",
        actionLabel: "View Inventory",
        entityType: "inventory",
        dismissible: false
      });
    }
    const outOfStock = db.prepare(`
      SELECT COUNT(*) AS c FROM items WHERE businessId = ? AND totalBaseQuantity <= 0
    `).get(bizId).c;
    if (outOfStock > 0) {
      alerts.push({
        id: "out_of_stock",
        type: "error",
        title: "Out of Stock",
        message: `${outOfStock} product(s) completely out of stock. Reorder needed.`,
        count: outOfStock,
        actionUrl: "/inventory",
        actionLabel: "View Inventory",
        entityType: "inventory",
        dismissible: false
      });
    }
    const expiring = db.prepare(`
      SELECT COUNT(*) AS c FROM items
      WHERE businessId = ? AND expiryDate IS NOT NULL AND expiryDate <= date('now', '+7 days') AND expiryDate >= date('now')
    `).get(bizId);
    if (expiring.c > 0) {
      alerts.push({
        id: "expiring",
        type: "warning",
        title: "Expiring Soon",
        message: `${expiring.c} product(s) expiring within 7 days.`,
        count: expiring.c,
        actionUrl: "/inventory",
        actionLabel: "View Inventory",
        entityType: "inventory",
        dismissible: false
      });
    }
    const customerOverdue = db.prepare(`
      SELECT COALESCE(SUM(totalPrice - paidAmount), 0) AS total, COUNT(*) AS c
      FROM sales WHERE businessId = ? AND paymentStatus = 'Debt' AND dueDate < ?
    `).get(bizId, today);
    if (customerOverdue.c > 0) {
      alerts.push({
        id: "customer_overdue",
        type: "warning",
        title: "Overdue Customer Balances",
        message: `${customerOverdue.c} debt(s) overdue, totaling ETB ${(customerOverdue.total || 0).toLocaleString()}.`,
        count: customerOverdue.c,
        actionUrl: "/customers",
        actionLabel: "View Customers",
        entityType: "customers",
        dismissible: false
      });
    }
    const supplierOverdue = db.prepare(`
      SELECT COALESCE(SUM(totalAmount - paidAmount), 0) AS total, COUNT(*) AS c
      FROM supplier_purchases WHERE businessId = ? AND status != 'cancelled' AND dueDate IS NOT NULL AND dueDate < ? AND (totalAmount - paidAmount) > 0
    `).get(bizId, today);
    if (supplierOverdue.c > 0) {
      alerts.push({
        id: "supplier_overdue",
        type: "warning",
        title: "Unpaid Supplier Invoices",
        message: `${supplierOverdue.c} supplier invoice(s) overdue, totaling ETB ${(supplierOverdue.total || 0).toLocaleString()}.`,
        count: supplierOverdue.c,
        actionUrl: "/suppliers",
        actionLabel: "View Suppliers",
        entityType: "suppliers",
        dismissible: false
      });
    }
    const dueReminders = db.prepare(`
      SELECT COUNT(*) AS c FROM notification_reminders
      WHERE businessId = ? AND status = 'pending' AND triggerDate <= ?
        AND (snoozedUntil IS NULL OR snoozedUntil <= ?)
    `).get(bizId, (/* @__PURE__ */ new Date()).toISOString(), (/* @__PURE__ */ new Date()).toISOString()).c;
    if (dueReminders > 0) {
      alerts.push({
        id: "reminders_due",
        type: "info",
        title: "Reminders Due",
        message: `${dueReminders} scheduled reminder(s) need attention.`,
        count: dueReminders,
        actionUrl: "/settings",
        actionLabel: "Open Settings",
        entityType: "reminders",
        dismissible: true
      });
    }
    return alerts;
  });
  electron.ipcMain.handle("get-setting", (_, key) => {
    const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
    return row ? JSON.parse(row.value) : null;
  });
  electron.ipcMain.handle("set-setting", (_, key, value) => {
    return db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, JSON.stringify(value));
  });
  electron.ipcMain.handle("get-dashboard-stats", (_, dateRange) => {
    const bizId = getActiveBusinessId();
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 864e5).toISOString().split("T")[0];
    const todayStart = today;
    const tomorrowStart = new Date(Date.now() + 864e5).toISOString().split("T")[0];
    const todayRevenue = db.prepare("SELECT COALESCE(SUM(totalPrice), 0) as total FROM sales WHERE createdAt >= ? AND createdAt < ? AND businessId = ?").get(todayStart, tomorrowStart, bizId);
    const yesterdayRevenue = db.prepare("SELECT COALESCE(SUM(totalPrice), 0) as total FROM sales WHERE createdAt >= ? AND createdAt < ? AND businessId = ?").get(yesterday, todayStart, bizId);
    const todaySales = db.prepare("SELECT COUNT(*) as count FROM sales WHERE createdAt >= ? AND createdAt < ? AND businessId = ?").get(todayStart, tomorrowStart, bizId);
    const yesterdaySales = db.prepare("SELECT COUNT(*) as count FROM sales WHERE createdAt >= ? AND createdAt < ? AND businessId = ?").get(yesterday, todayStart, bizId);
    const todayExpenses = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ? AND businessId = ?").get(today, bizId);
    const yesterdayExpenses = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ? AND businessId = ?").get(yesterday, bizId);
    const activeDebts = db.prepare("SELECT COALESCE(SUM(totalPrice - paidAmount), 0) as total FROM sales WHERE paymentStatus = 'Debt' AND businessId = ?").get(bizId);
    const totalItems = db.prepare("SELECT COUNT(*) as count FROM items WHERE businessId = ?").get(bizId);
    const lowStock = db.prepare("SELECT COUNT(*) as count FROM items WHERE totalBaseQuantity < 10 AND businessId = ?").get(bizId);
    const todayProfit = db.prepare(`
      SELECT COALESCE(SUM(s.totalPrice - (CASE WHEN s.unitType = 'pack' THEN s.quantity * COALESCE(i.unitsPerPack, 1) ELSE s.quantity END * i.basePurchasePrice)), 0) as profit 
      FROM sales s LEFT JOIN items i ON s.itemId = i.id 
      WHERE DATE(s.createdAt) = ? AND s.businessId = ?
    `).get(today, bizId);
    const yesterdayProfit = db.prepare(`
      SELECT COALESCE(SUM(s.totalPrice - (CASE WHEN s.unitType = 'pack' THEN s.quantity * COALESCE(i.unitsPerPack, 1) ELSE s.quantity END * i.basePurchasePrice)), 0) as profit 
      FROM sales s LEFT JOIN items i ON s.itemId = i.id 
      WHERE DATE(s.createdAt) = ? AND s.businessId = ?
    `).get(yesterday, bizId);
    return {
      todayRevenue: todayRevenue.total,
      yesterdayRevenue: yesterdayRevenue.total,
      todaySales: todaySales.count,
      yesterdaySales: yesterdaySales.count,
      todayExpenses: todayExpenses.total,
      yesterdayExpenses: yesterdayExpenses.total,
      todayProfit: todayProfit.profit,
      yesterdayProfit: yesterdayProfit.profit,
      activeDebts: activeDebts.total,
      totalItems: totalItems.count,
      lowStock: lowStock.count
    };
  });
  electron.ipcMain.handle("get-recent-activity", (_, limit = 10, dateRange) => {
    const bizId = getActiveBusinessId();
    let dateFilter = "WHERE s.businessId = ?";
    let expDateFilter = "WHERE businessId = ?";
    let params = [bizId];
    let expParams = [bizId];
    if (dateRange?.start && dateRange?.end) {
      dateFilter = "WHERE DATE(s.createdAt) >= ? AND DATE(s.createdAt) <= ? AND s.businessId = ?";
      expDateFilter = "WHERE date >= ? AND date <= ? AND businessId = ?";
      params = [dateRange.start, dateRange.end, bizId];
      expParams = [dateRange.start, dateRange.end, bizId];
    } else if (dateRange?.start) {
      dateFilter = "WHERE DATE(s.createdAt) = ? AND s.businessId = ?";
      expDateFilter = "WHERE date = ? AND businessId = ?";
      params = [dateRange.start, bizId];
      expParams = [dateRange.start, bizId];
    }
    const sales = db.prepare(`
      SELECT 'sale' as type, 'sale-' || s.id as id, s.totalPrice as amount, s.createdAt as date, i.name as description, s.customerName as extra
      FROM sales s LEFT JOIN items i ON s.itemId = i.id
      ${dateFilter}
      ORDER BY s.createdAt DESC LIMIT ?
    `).all(...params, limit);
    const expenses = db.prepare(`
      SELECT 'expense' as type, 'expense-' || id as id, amount, date, name as description, category as extra
      FROM expenses ${expDateFilter} ORDER BY date DESC LIMIT ?
    `).all(...expParams, limit);
    const adjFilter = dateFilter.replace(/s\.createdAt/g, "a.createdAt").replace(/s\.businessId/g, "a.businessId");
    const adjustments = db.prepare(`
      SELECT 'adjustment' as type, 'adj-' || a.id as id, a.newValue as amount, a.createdAt as date, i.name as description, a.type as extra
      FROM adjustments a LEFT JOIN items i ON a.itemId = i.id
      ${adjFilter}
      ORDER BY a.createdAt DESC LIMIT ?
    `).all(...params, limit);
    const all = [...sales, ...expenses, ...adjustments];
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return all.slice(0, limit);
  });
  electron.ipcMain.handle("get-analytics", (_, period, dateRange) => {
    const bizId = getActiveBusinessId();
    const now = /* @__PURE__ */ new Date();
    let startDate;
    let endDate = null;
    if (dateRange?.start && dateRange?.end) {
      startDate = dateRange.start;
      endDate = dateRange.end;
    } else if (period === "today") {
      startDate = now.toISOString().split("T")[0];
    } else if (period === "week") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split("T")[0];
    } else if (period === "month") {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      startDate = d.toISOString().split("T")[0];
    } else {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      startDate = d.toISOString().split("T")[0];
    }
    const dateFilter = endDate ? "DATE(createdAt) >= ? AND DATE(createdAt) <= ? AND businessId = ?" : "DATE(createdAt) >= ? AND businessId = ?";
    const dateParams = endDate ? [startDate, endDate, bizId] : [startDate, bizId];
    const expDateFilter = endDate ? "date >= ? AND date <= ? AND businessId = ?" : "date >= ? AND businessId = ?";
    const expDateParams = endDate ? [startDate, endDate, bizId] : [startDate, bizId];
    const salesData = db.prepare(`
      SELECT 
        DATE(s.createdAt) as date, 
        COALESCE(SUM(s.totalPrice), 0) as revenue, 
        COALESCE(SUM(s.quantity), 0) as units,
        COALESCE(SUM(s.totalPrice - (CASE WHEN s.unitType = 'pack' THEN s.quantity * COALESCE(i.unitsPerPack, 1) ELSE s.quantity END * i.basePurchasePrice)), 0) as profit
      FROM sales s LEFT JOIN items i ON s.itemId = i.id
      WHERE ${dateFilter.replace(/createdAt/g, "s.createdAt").replace("businessId", "s.businessId")} 
      GROUP BY DATE(s.createdAt) ORDER BY date
    `).all(...dateParams);
    const expenseData = db.prepare(`
      SELECT date, COALESCE(SUM(amount), 0) as amount
      FROM expenses WHERE ${expDateFilter} GROUP BY date ORDER BY date
    `).all(...expDateParams);
    const totalRevenue = salesData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalProfit = salesData.reduce((acc, curr) => acc + curr.profit, 0);
    const totalExpenses = expenseData.reduce((acc, curr) => acc + curr.amount, 0);
    const topItems = db.prepare(`
      SELECT i.name, SUM(s.quantity) as totalQty, SUM(s.totalPrice) as totalRevenue
      FROM sales s LEFT JOIN items i ON s.itemId = i.id
      WHERE ${dateFilter.replace(/createdAt/g, "s.createdAt").replace("businessId", "s.businessId")} GROUP BY s.itemId ORDER BY totalQty DESC LIMIT 5
    `).all(...dateParams);
    const categoryBreakdown = db.prepare(`
      SELECT c.name, COUNT(s.id) as saleCount, SUM(s.totalPrice) as revenue
      FROM sales s LEFT JOIN items i ON s.itemId = i.id LEFT JOIN categories c ON i.categoryId = c.id
      WHERE ${dateFilter.replace(/createdAt/g, "s.createdAt").replace("businessId", "s.businessId")} GROUP BY c.id ORDER BY revenue DESC
    `).all(...dateParams);
    return {
      salesData,
      expenseData,
      topItems,
      categoryBreakdown,
      summary: {
        totalRevenue,
        totalProfit,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses
      }
    };
  });
  electron.ipcMain.handle("get-customers", () => {
    const bizId = getActiveBusinessId();
    const customers = db.prepare(`
      SELECT c.*,
        s.transactionCount,
        s.totalDebt,
        s.totalPaid,
        s.outstanding,
        s.overdueCount
      FROM customers c
      LEFT JOIN (
        SELECT TRIM(customerName) as tCustomerName,
          COUNT(*) as transactionCount,
          SUM(CASE WHEN paymentStatus != 'Paid' THEN totalPrice ELSE 0 END) as totalDebt,
          SUM(paidAmount) as totalPaid,
          SUM(CASE WHEN paymentStatus != 'Paid' THEN totalPrice - paidAmount ELSE 0 END) as outstanding,
          SUM(CASE WHEN paymentStatus != 'Paid' AND dueDate < date('now') AND totalPrice > paidAmount THEN 1 ELSE 0 END) as overdueCount
        FROM sales
        WHERE businessId = ? AND customerName IS NOT NULL AND customerName != ''
        GROUP BY TRIM(customerName)
      ) s ON TRIM(c.customerName) = s.tCustomerName
      WHERE c.businessId = ? AND c.isActive = 1
      ORDER BY c.customerName ASC
      LIMIT ?
    `).all(bizId, bizId, DEFAULT_LIST_LIMIT);
    return customers.map((c) => ({
      id: c.id,
      customerName: c.customerName,
      createdAt: c.createdAt,
      phone: c.phone,
      secondaryPhone: c.secondaryPhone,
      email: c.email,
      address: c.address,
      city: c.city,
      company: c.company,
      taxNumber: c.taxNumber,
      groupName: c.groupName,
      creditLimit: c.creditLimit,
      notes: c.notes,
      isActive: c.isActive,
      salesStats: {
        transactionCount: c.transactionCount ?? 0,
        totalDebt: c.totalDebt ?? 0,
        totalPaid: c.totalPaid ?? 0,
        outstanding: c.outstanding ?? 0,
        overdueCount: c.overdueCount ?? 0
      }
    }));
  });
  electron.ipcMain.handle("get-customer", (_, customerId) => {
    const bizId = getActiveBusinessId();
    const customerRaw = db.prepare(`
      SELECT c.*,
        s.transactionCount,
        s.totalSales,
        s.totalPaid,
        s.outstanding
      FROM customers c
      LEFT JOIN (
        SELECT TRIM(customerName) as tCustomerName,
          COUNT(*) as transactionCount,
          SUM(totalPrice) as totalSales,
          SUM(paidAmount) as totalPaid,
          SUM(CASE WHEN paymentStatus != 'Paid' THEN totalPrice - paidAmount ELSE 0 END) as outstanding
        FROM sales
        WHERE businessId = ? AND customerName IS NOT NULL AND customerName != ''
        GROUP BY TRIM(customerName)
      ) s ON TRIM(c.customerName) = s.tCustomerName
      WHERE c.id = ? AND c.businessId = ?
    `).get(bizId, customerId, bizId);
    if (!customerRaw) return null;
    return {
      id: customerRaw.id,
      customerName: customerRaw.customerName,
      createdAt: customerRaw.createdAt,
      phone: customerRaw.phone,
      secondaryPhone: customerRaw.secondaryPhone,
      email: customerRaw.email,
      address: customerRaw.address,
      city: customerRaw.city,
      company: customerRaw.company,
      taxNumber: customerRaw.taxNumber,
      groupName: customerRaw.groupName,
      creditLimit: customerRaw.creditLimit,
      notes: customerRaw.notes,
      isActive: customerRaw.isActive,
      salesStats: {
        transactionCount: customerRaw.transactionCount ?? 0,
        totalSales: customerRaw.totalSales ?? 0,
        totalPaid: customerRaw.totalPaid ?? 0,
        outstanding: customerRaw.outstanding ?? 0
      }
    };
  });
  electron.ipcMain.handle("get-customer-sales", (_, customerName) => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT sales.*, items.name as itemName 
      FROM sales LEFT JOIN items ON sales.itemId = items.id 
      WHERE sales.customerName = ? AND sales.businessId = ?
      ORDER BY sales.createdAt DESC
      LIMIT ?
    `).all(customerName, bizId, DEFAULT_LIST_LIMIT);
  });
  electron.ipcMain.handle("insert-customer", (_, customer) => {
    const bizId = getActiveBusinessId();
    const existing = db.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(customer.customerName, bizId);
    if (existing) return { success: false, error: "Customer name already exists" };
    const result = db.prepare(`
      INSERT INTO customers (businessId, customerName, phone, secondaryPhone, email, address, city, company, taxNumber, groupName, creditLimit, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(bizId, customer.customerName, customer.phone || "", customer.secondaryPhone || "", customer.email || "", customer.address || "", customer.city || "", customer.company || "", customer.taxNumber || "", customer.groupName || "general", customer.creditLimit || 0, customer.notes || "");
    return { success: true, id: result.lastInsertRowid };
  });
  electron.ipcMain.handle("update-customer", (_, customer) => {
    const bizId = getActiveBusinessId();
    const dup = db.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ? AND id != ?").get(customer.customerName, bizId, customer.id);
    if (dup) return { success: false, error: "Another customer with this name already exists" };
    db.prepare(`
      UPDATE customers SET customerName = ?, phone = ?, secondaryPhone = ?, email = ?, address = ?, city = ?, company = ?, taxNumber = ?, groupName = ?, creditLimit = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND businessId = ?
    `).run(customer.customerName, customer.phone || "", customer.secondaryPhone || "", customer.email || "", customer.address || "", customer.city || "", customer.company || "", customer.taxNumber || "", customer.groupName || "general", customer.creditLimit || 0, customer.notes || "", customer.id, bizId);
    return { success: true };
  });
  electron.ipcMain.handle("delete-customer", (_, customerId) => {
    const bizId = getActiveBusinessId();
    const hasSales = db.prepare("SELECT COUNT(*) as count FROM sales WHERE customerName = (SELECT customerName FROM customers WHERE id = ?) AND businessId = ?").get(customerId, bizId);
    if (hasSales.count > 0) return { success: false, error: "Cannot delete customer with sales history. Deactivate instead." };
    db.prepare("UPDATE customers SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(currentUserName || "unknown", customerId, bizId);
    return { success: true };
  });
  electron.ipcMain.handle("get-customer-notes", (_, customerId) => {
    return db.prepare("SELECT * FROM customer_notes WHERE customerId = ? ORDER BY createdAt DESC LIMIT 50").all(customerId);
  });
  electron.ipcMain.handle("add-customer-note", (_, customerId, note, createdBy) => {
    db.prepare("INSERT INTO customer_notes (customerId, note, createdBy) VALUES (?, ?, ?)").run(customerId, note, createdBy || "");
    return { success: true };
  });
  electron.ipcMain.handle("export-data", () => {
    requirePermission("settings.manage");
    const bizId = getActiveBusinessId();
    const tables = ["categories", "items", "item_packs", "sales", "expenses", "adjustments", "settings"];
    const data = {};
    for (const table of tables) {
      if (table === "settings") {
        data[table] = db.prepare(`SELECT * FROM ${table}`).all();
      } else {
        data[table] = db.prepare(`SELECT * FROM ${table} WHERE businessId = ?`).all(bizId);
      }
    }
    return data;
  });
  electron.ipcMain.handle("reset-data", () => {
    const hasBackupPerm = currentUserPermissions.includes("settings.backup");
    const hasManagePerm = currentUserPermissions.includes("settings.manage");
    const hasWildcard = currentUserPermissions.includes("*");
    if (!hasBackupPerm && !hasManagePerm && !hasWildcard) {
      throw new Error("Permission denied: settings.manage");
    }
    const bizId = getActiveBusinessId();
    const transaction = db.transaction(() => {
      db.prepare("DELETE FROM returns WHERE businessId = ?").run(bizId);
      db.prepare("DELETE FROM sales WHERE businessId = ?").run(bizId);
      db.prepare("DELETE FROM adjustments WHERE businessId = ?").run(bizId);
      db.prepare("DELETE FROM stock_movements WHERE itemId IN (SELECT id FROM items WHERE businessId = ?)").run(bizId);
      db.prepare("DELETE FROM warehouse_inventory WHERE itemId IN (SELECT id FROM items WHERE businessId = ?)").run(bizId);
      db.prepare("DELETE FROM stock_transfers WHERE businessId = ?").run(bizId);
      db.prepare("DELETE FROM shipment_items WHERE shipmentId IN (SELECT id FROM shipments WHERE businessId = ?)").run(bizId);
      db.prepare("DELETE FROM shipment_history WHERE shipmentId IN (SELECT id FROM shipments WHERE businessId = ?)").run(bizId);
      db.prepare("DELETE FROM shipments WHERE businessId = ?").run(bizId);
      db.prepare("DELETE FROM notification_banners WHERE businessId = ?").run(bizId);
      db.prepare("DELETE FROM notification_reminders WHERE businessId = ?").run(bizId);
      db.prepare("DELETE FROM supplier_purchase_items WHERE purchaseId IN (SELECT id FROM supplier_purchases WHERE businessId = ?)").run(bizId);
      db.prepare("DELETE FROM supplier_payments WHERE businessId = ?").run(bizId);
      db.prepare("DELETE FROM supplier_activity_log WHERE supplierId IN (SELECT id FROM suppliers WHERE businessId = ?)").run(bizId);
      db.prepare("DELETE FROM supplier_purchases WHERE businessId = ?").run(bizId);
      db.prepare("DELETE FROM customer_notes WHERE customerId IN (SELECT id FROM customers WHERE businessId = ?)").run(bizId);
      db.prepare("DELETE FROM customers WHERE businessId = ?").run(bizId);
      db.prepare("DELETE FROM suppliers WHERE businessId = ?").run(bizId);
      db.prepare("DELETE FROM item_packs WHERE itemId IN (SELECT id FROM items WHERE businessId = ?)").run(bizId);
      db.prepare("DELETE FROM items WHERE businessId = ?").run(bizId);
      db.prepare("DELETE FROM expenses WHERE businessId = ?").run(bizId);
      db.prepare("DELETE FROM categories WHERE businessId = ? AND isCustom = 1").run(bizId);
      db.prepare("DELETE FROM notifications WHERE businessId = ?").run(bizId);
    });
    transaction();
    return { success: true };
  });
  electron.ipcMain.handle("login", (_, username, pin) => {
    const admin = db.prepare(
      "SELECT id, name, username, role, permissions, isActive, businessId, avatar, pin FROM admins WHERE username = ?"
    ).get(username);
    if (admin) {
      if (!admin.isActive) return { success: false, error: "Account deactivated" };
      if (!verifyPin(pin, admin.pin)) return { success: false, error: "Invalid credentials" };
      currentAdminId = admin.id;
      currentUserName = admin.name;
      currentUserPermissions = admin.permissions ? JSON.parse(admin.permissions) : ["*"];
      return {
        success: true,
        admin: {
          ...admin,
          permissions: admin.permissions ? JSON.parse(admin.permissions) : []
        }
      };
    }
    const account = db.prepare(`
      SELECT ea.*, e.id as employeeId, e.firstName, e.lastName,
        r.name as roleName, r.permissions as rolePermissions
      FROM employee_accounts ea
      LEFT JOIN employees e ON ea.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
      WHERE ea.username = ?
    `).get(username);
    if (!account) {
      db.prepare("INSERT INTO login_history (action) VALUES (?)").run("failed_login: employee not found");
      return { success: false, error: "Invalid credentials" };
    }
    if (account.lockedUntil && new Date(account.lockedUntil) > /* @__PURE__ */ new Date()) {
      db.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "failed_login: account locked");
      return { success: false, error: "Account is locked. Try again later." };
    }
    if (!account.isActive) {
      db.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "failed_login: inactive");
      return { success: false, error: "Account deactivated" };
    }
    if (!verifyPin(pin, account.pin)) {
      const attempts = (account.failedLoginAttempts || 0) + 1;
      if (attempts >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1e3).toISOString();
        db.prepare("UPDATE employee_accounts SET failedLoginAttempts = ?, lockedUntil = ?, isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(attempts, lockUntil, account.id);
        db.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "failed_login: locked after 5 attempts");
        return { success: false, error: "Account locked due to too many failed attempts." };
      }
      db.prepare("UPDATE employee_accounts SET failedLoginAttempts = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(attempts, account.id);
      db.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "failed_login: wrong pin");
      return { success: false, error: "Invalid credentials" };
    }
    db.prepare("UPDATE employee_accounts SET lastLogin = CURRENT_TIMESTAMP, failedLoginAttempts = 0, lockedUntil = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(account.id);
    db.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "login");
    currentAdminId = account.employeeId;
    currentUserName = `${account.firstName || ""} ${account.lastName || ""}`.trim() || account.username;
    const rolePerms = account.rolePermissions ? JSON.parse(account.rolePermissions) : [];
    currentUserPermissions = rolePerms.length > 0 ? rolePerms : ["*"];
    return {
      success: true,
      admin: {
        id: account.employeeId,
        name: `${account.firstName || ""} ${account.lastName || ""}`.trim() || account.username,
        username: account.username,
        role: account.roleName || "employee",
        permissions: account.rolePermissions ? JSON.parse(account.rolePermissions) : [],
        isActive: account.isActive,
        avatar: void 0,
        isEmployee: true
      }
    };
  });
  electron.ipcMain.handle("get-admins", () => {
    const admins = db.prepare("SELECT id, name, username, role, permissions, isActive, avatar, createdAt FROM admins ORDER BY createdAt ASC").all();
    return admins.map((a) => ({
      ...a,
      permissions: a.permissions ? JSON.parse(a.permissions) : []
    }));
  });
  electron.ipcMain.handle("get-current-admin", (_, id) => {
    const admin = db.prepare("SELECT id, name, username, role, permissions, isActive, avatar FROM admins WHERE id = ?").get(id);
    if (!admin) return null;
    return {
      ...admin,
      permissions: admin.permissions ? JSON.parse(admin.permissions) : []
    };
  });
  electron.ipcMain.handle("insert-admin", (_, admin) => {
    requirePermission("settings.users");
    const existing = db.prepare("SELECT id FROM admins WHERE username = ?").get(admin.username);
    if (existing) return { success: false, error: "Username already exists" };
    const hash = hashPin(admin.pin);
    const result = db.prepare(
      "INSERT INTO admins (name, username, pin, role, permissions, businessId) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(
      admin.name,
      admin.username,
      hash,
      admin.role || "admin",
      JSON.stringify(admin.permissions || []),
      admin.businessId || null
    );
    return { success: true, id: result.lastInsertRowid };
  });
  electron.ipcMain.handle("update-admin", (_, id, admin) => {
    if (id !== currentAdminId) {
      requirePermission("settings.users");
    }
    if (admin.username) {
      const existing = db.prepare("SELECT id FROM admins WHERE username = ? AND id != ?").get(admin.username, id);
      if (existing) return { success: false, error: "Username already exists" };
    }
    const fields = [];
    const values = [];
    if (admin.name !== void 0) {
      fields.push("name = ?");
      values.push(admin.name);
    }
    if (admin.username !== void 0) {
      fields.push("username = ?");
      values.push(admin.username);
    }
    if (admin.pin !== void 0) {
      const h = hashPin(admin.pin);
      fields.push("pin = ?");
      values.push(h);
    }
    if (admin.role !== void 0) {
      fields.push("role = ?");
      values.push(admin.role);
    }
    if (admin.permissions !== void 0) {
      fields.push("permissions = ?");
      values.push(JSON.stringify(admin.permissions));
    }
    if (admin.isActive !== void 0) {
      fields.push("isActive = ?");
      values.push(admin.isActive);
    }
    if (admin.businessId !== void 0) {
      fields.push("businessId = ?");
      values.push(admin.businessId);
    }
    if (admin.avatar !== void 0) {
      fields.push("avatar = ?");
      values.push(admin.avatar);
    }
    if (fields.length === 0) return { success: false, error: "No fields to update" };
    values.push(id);
    db.prepare(`UPDATE admins SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return { success: true };
  });
  electron.ipcMain.handle("delete-admin", (_, id) => {
    requirePermission("settings.users");
    const admin = db.prepare("SELECT role FROM admins WHERE id = ?").get(id);
    if (admin?.role === "super_admin") {
      const superCount = db.prepare("SELECT COUNT(*) as count FROM admins WHERE role = 'super_admin'").get();
      if (superCount.count <= 1) {
        return { success: false, error: "Cannot delete the last super admin" };
      }
    }
    db.prepare("DELETE FROM admins WHERE id = ?").run(id);
    return { success: true };
  });
  electron.ipcMain.handle("insert-bulk-adjustments", (_, adjustments) => {
    const bizId = getActiveBusinessId();
    const transaction = db.transaction(() => {
      let count = 0;
      for (const adj of adjustments) {
        db.prepare("INSERT INTO adjustments (businessId, itemId, type, oldValue, newValue, quantity, unitType, reason, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
          bizId,
          adj.itemId,
          adj.type,
          adj.oldValue,
          adj.newValue,
          adj.quantity,
          adj.unitType,
          adj.reason,
          adj.date
        );
        if (adj.type === "damage" || adj.type === "loss") {
          db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity - ? WHERE id = ?").run(adj.quantity, adj.itemId);
          const defWhId = getDefaultWarehouseId();
          const whRow = db.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, adj.itemId);
          if (whRow) {
            db.prepare("UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(adj.quantity, whRow.id);
          }
          db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, adj.itemId, `adj_${adj.type}`, adj.quantity, "adjustment", adj.reason || null);
        } else if (adj.type === "add_stock") {
          db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ? WHERE id = ?").run(adj.quantity, adj.itemId);
          const defWhId = getDefaultWarehouseId();
          const whRow = db.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, adj.itemId);
          if (whRow) {
            db.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(adj.quantity, whRow.id);
          } else {
            db.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, adj.itemId, adj.quantity);
          }
          db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, adj.itemId, `adj_${adj.type}`, adj.quantity, "adjustment", adj.reason || null);
        } else if (adj.type === "price_increase" || adj.type === "price_decrease") {
          if (adj.unitType === "base") {
            db.prepare("UPDATE items SET baseSellingPrice = ? WHERE id = ?").run(adj.newValue, adj.itemId);
          } else {
            db.prepare("UPDATE items SET packSellingPrice = ? WHERE id = ?").run(adj.newValue, adj.itemId);
          }
        }
        count++;
      }
      return count;
    });
    return transaction();
  });
  electron.ipcMain.handle("get-warehouses", () => {
    const bizId = getActiveBusinessId();
    return db.prepare("SELECT * FROM warehouses WHERE businessId = ? ORDER BY name").all(bizId);
  });
  electron.ipcMain.handle("get-warehouse", (_, id) => {
    return db.prepare("SELECT * FROM warehouses WHERE id = ?").get(id);
  });
  electron.ipcMain.handle("insert-warehouse", (_, wh) => {
    const bizId = getActiveBusinessId();
    return db.prepare("INSERT INTO warehouses (businessId, name, location, managerName, managerPhone, email) VALUES (?, ?, ?, ?, ?, ?)").run(bizId, wh.name, wh.location, wh.managerName, wh.managerPhone, wh.email).lastInsertRowid;
  });
  electron.ipcMain.handle("update-warehouse", (_, id, wh) => {
    return db.prepare("UPDATE warehouses SET name = ?, location = ?, managerName = ?, managerPhone = ?, email = ?, isActive = ? WHERE id = ?").run(wh.name, wh.location, wh.managerName, wh.managerPhone, wh.email, wh.isActive ?? 1, id);
  });
  electron.ipcMain.handle("delete-warehouse", (_, id) => {
    const tx = db.transaction(() => {
      db.prepare("DELETE FROM stock_movements WHERE warehouseId = ?").run(id);
      db.prepare("DELETE FROM warehouse_inventory WHERE warehouseId = ?").run(id);
      db.prepare("DELETE FROM warehouses WHERE id = ?").run(id);
    });
    return tx();
  });
  electron.ipcMain.handle("get-warehouse-inventory", (_, warehouseId) => {
    return db.prepare(`
      SELECT wi.*, items.name as itemName, items.companyName, items.baseUnit,
        items.baseSellingPrice, items.packSellingPrice, items.categoryId,
        categories.name as categoryName
      FROM warehouse_inventory wi
      LEFT JOIN items ON wi.itemId = items.id
      LEFT JOIN categories ON items.categoryId = categories.id
      WHERE wi.warehouseId = ?
      ORDER BY items.name
    `).all(warehouseId);
  });
  electron.ipcMain.handle("get-all-warehouse-inventory", (_, options = {}) => {
    const bizId = getActiveBusinessId();
    let query = `
      SELECT wi.*, w.name as warehouseName, items.name as itemName, items.companyName,
        items.baseUnit, items.baseSellingPrice, items.packSellingPrice,
        categories.name as categoryName
      FROM warehouse_inventory wi
      LEFT JOIN warehouses w ON wi.warehouseId = w.id
      LEFT JOIN items ON wi.itemId = items.id
      LEFT JOIN categories ON items.categoryId = categories.id
      WHERE w.businessId = ?
    `;
    const params = [bizId];
    if (options.search) {
      query += " AND (items.name LIKE ? OR items.companyName LIKE ?)";
      params.push(`%${options.search}%`, `%${options.search}%`);
    }
    if (options.category && options.category !== "All") {
      query += " AND categories.name = ?";
      params.push(options.category);
    }
    query += " ORDER BY w.name, items.name LIMIT ?";
    params.push(DEFAULT_LIST_LIMIT);
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("update-warehouse-inventory", (_, warehouseId, itemId, quantity) => {
    validateNonNegative(quantity, "Warehouse inventory quantity");
    const existing = db.prepare("SELECT id, quantity FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(warehouseId, itemId);
    const oldQty = existing?.quantity || 0;
    const delta = quantity - oldQty;
    if (existing) {
      db.prepare("UPDATE warehouse_inventory SET quantity = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(quantity, existing.id);
    } else {
      db.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(warehouseId, itemId, quantity);
    }
    db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ? WHERE id = ?").run(delta, itemId);
    db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(warehouseId, itemId, "adjustment", quantity, "manual", "Manual inventory adjustment");
    db.prepare("SELECT name FROM items WHERE id = ?").get(itemId);
    return { success: true };
  });
  electron.ipcMain.handle("transfer-stock", (_, transfer) => {
    if (transfer.fromWarehouseId === transfer.toWarehouseId) throw new Error("Source and destination warehouses must be different");
    const qty = validatePositive(transfer.quantity, "Transfer quantity");
    transfer.quantity = qty;
    const bizId = getActiveBusinessId();
    const tx = db.transaction(() => {
      const fromExisting = db.prepare("SELECT id, quantity FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(transfer.fromWarehouseId, transfer.itemId);
      if (!fromExisting || fromExisting.quantity < transfer.quantity) {
        throw new Error("Insufficient stock at source warehouse");
      }
      db.prepare("UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(transfer.quantity, fromExisting.id);
      const toExisting = db.prepare("SELECT id, quantity FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(transfer.toWarehouseId, transfer.itemId);
      if (toExisting) {
        const newQty = toExisting.quantity + transfer.quantity;
        db.prepare("UPDATE warehouse_inventory SET quantity = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(newQty, toExisting.id);
      } else {
        db.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(transfer.toWarehouseId, transfer.itemId, transfer.quantity);
      }
      const result = db.prepare("INSERT INTO stock_transfers (businessId, fromWarehouseId, toWarehouseId, itemId, quantity, unitType, notes, transferredBy, completedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)").run(bizId, transfer.fromWarehouseId, transfer.toWarehouseId, transfer.itemId, transfer.quantity, transfer.unitType || "base", transfer.notes, transfer.transferredBy);
      db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceId, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").run(transfer.fromWarehouseId, transfer.itemId, "transfer_out", transfer.quantity, result.lastInsertRowid, "transfer", `Transferred to warehouse #${transfer.toWarehouseId}`);
      db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceId, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").run(transfer.toWarehouseId, transfer.itemId, "transfer_in", transfer.quantity, result.lastInsertRowid, "transfer", `Received from warehouse #${transfer.fromWarehouseId}`);
      db.prepare("SELECT name FROM items WHERE id = ?").get(transfer.itemId);
      return result.lastInsertRowid;
    });
    return tx();
  });
  electron.ipcMain.handle("get-stock-transfers", (_, options = {}) => {
    const bizId = getActiveBusinessId();
    let query = `
      SELECT st.*, 
        fromWh.name as fromWarehouseName, toWh.name as toWarehouseName,
        items.name as itemName, items.companyName
      FROM stock_transfers st
      LEFT JOIN warehouses fromWh ON st.fromWarehouseId = fromWh.id
      LEFT JOIN warehouses toWh ON st.toWarehouseId = toWh.id
      LEFT JOIN items ON st.itemId = items.id
      WHERE st.businessId = ?
    `;
    const params = [bizId];
    if (options.startDate && options.endDate) {
      query += " AND DATE(st.createdAt) BETWEEN ? AND ?";
      params.push(options.startDate, options.endDate);
    }
    query += " ORDER BY st.createdAt DESC";
    const listLimit = options.limit ?? DEFAULT_LIST_LIMIT;
    query += " LIMIT ?";
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-stock-movements", (_, options = {}) => {
    const bizId = getActiveBusinessId();
    let query = `
      SELECT sm.*, w.name as warehouseName, items.name as itemName, items.companyName
      FROM stock_movements sm
      LEFT JOIN warehouses w ON sm.warehouseId = w.id
      LEFT JOIN items ON sm.itemId = items.id
      WHERE w.businessId = ?
    `;
    const params = [bizId];
    if (options.warehouseId) {
      query += " AND sm.warehouseId = ?";
      params.push(options.warehouseId);
    }
    if (options.itemId) {
      query += " AND sm.itemId = ?";
      params.push(options.itemId);
    }
    if (options.startDate && options.endDate) {
      query += " AND DATE(sm.createdAt) BETWEEN ? AND ?";
      params.push(options.startDate, options.endDate);
    }
    query += " ORDER BY sm.createdAt DESC";
    const listLimit = options.limit ?? DEFAULT_LIST_LIMIT;
    query += " LIMIT ?";
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("cleanup-stock-movements", () => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1e3).toISOString();
    const result = db.prepare("DELETE FROM stock_movements WHERE createdAt < ?").run(ninetyDaysAgo);
    return { success: true, deleted: result.changes };
  });
  electron.ipcMain.handle("get-warehouse-report", (_, warehouseId) => {
    const inventory = db.prepare(`
      SELECT wi.*, items.name as itemName, items.companyName, items.baseUnit,
        items.baseSellingPrice, items.packSellingPrice, categories.name as categoryName
      FROM warehouse_inventory wi
      LEFT JOIN items ON wi.itemId = items.id
      LEFT JOIN categories ON items.categoryId = categories.id
      WHERE wi.warehouseId = ?
      ORDER BY items.name
    `).all(warehouseId);
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, i) => sum + i.quantity * (i.baseSellingPrice || 0), 0);
    const lowStock = inventory.filter((i) => i.quantity < 10).length;
    const recentMovements = db.prepare(`
      SELECT sm.*, items.name as itemName
      FROM stock_movements sm
      LEFT JOIN items ON sm.itemId = items.id
      WHERE sm.warehouseId = ?
      ORDER BY sm.createdAt DESC LIMIT 20
    `).all(warehouseId);
    return { inventory, totalItems, totalValue, lowStock, recentMovements };
  });
  electron.ipcMain.handle("get-employee-roles", () => {
    return db.prepare("SELECT * FROM employee_roles ORDER BY name").all();
  });
  electron.ipcMain.handle("get-employee-role", (_, id) => {
    return db.prepare("SELECT * FROM employee_roles WHERE id = ?").get(id);
  });
  electron.ipcMain.handle("insert-employee-role", (_, data) => {
    const permissions = JSON.stringify(data.permissions || []);
    const result = db.prepare("INSERT INTO employee_roles (name, description, permissions, isSystem) VALUES (?, ?, ?, ?)").run(data.name, data.description || "", permissions, 0);
    return result.lastInsertRowid;
  });
  electron.ipcMain.handle("update-employee-role", (_, id, data) => {
    const permissions = JSON.stringify(data.permissions || []);
    const result = db.prepare("UPDATE employee_roles SET name = ?, description = ?, permissions = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(data.name, data.description || "", permissions, id);
    return result;
  });
  electron.ipcMain.handle("duplicate-employee-role", (_, id) => {
    const original = db.prepare("SELECT * FROM employee_roles WHERE id = ?").get(id);
    if (!original) throw new Error("Role not found");
    const result = db.prepare("INSERT INTO employee_roles (name, description, permissions, isSystem) VALUES (?, ?, ?, 0)").run(`${original.name} (Copy)`, original.description, original.permissions);
    return result.lastInsertRowid;
  });
  electron.ipcMain.handle("delete-employee-role", (_, id) => {
    const role = db.prepare("SELECT name, isSystem FROM employee_roles WHERE id = ?").get(id);
    if (role?.isSystem) throw new Error("Cannot delete system role");
    db.prepare("UPDATE employees SET roleId = NULL WHERE roleId = ?").run(id);
    db.prepare("DELETE FROM employee_roles WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("get-employees", (_, options) => {
    let query = `
      SELECT e.*, r.name as roleName, r.permissions as rolePermissions,
        CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END as hasAccount,
        a.username, a.isActive as accountActive, a.lastLogin, a.forcePasswordChange,
        a.failedLoginAttempts, a.lockedUntil, w.name as warehouseName
      FROM employees e
      LEFT JOIN employee_roles r ON e.roleId = r.id
      LEFT JOIN employee_accounts a ON e.id = a.employeeId
      LEFT JOIN warehouses w ON e.warehouseId = w.id
    `;
    const conditions = [];
    const params = [];
    if (options?.search) {
      conditions.push("(e.firstName LIKE ? OR e.lastName LIKE ? OR e.phone LIKE ? OR e.email LIKE ? OR e.employeeCode LIKE ?)");
      const s = `%${options.search}%`;
      params.push(s, s, s, s, s);
    }
    if (options?.roleId) {
      conditions.push("e.roleId = ?");
      params.push(options.roleId);
    }
    if (options?.department) {
      conditions.push("e.department = ?");
      params.push(options.department);
    }
    if (options?.employmentStatus) {
      conditions.push("e.employmentStatus = ?");
      params.push(options.employmentStatus);
    }
    if (options?.warehouseId) {
      conditions.push("e.warehouseId = ?");
      params.push(options.warehouseId);
    }
    if (options?.hasAccount !== void 0) {
      conditions.push(options.hasAccount ? "a.id IS NOT NULL" : "a.id IS NULL");
    }
    if (options?.isActive !== void 0) {
      conditions.push("e.isActive = ?");
      params.push(options.isActive ? 1 : 0);
    }
    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY e.firstName, e.lastName";
    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    query += " LIMIT ?";
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-employee", (_, id) => {
    return db.prepare(`
      SELECT e.*, r.name as roleName, r.permissions as rolePermissions,
        r.description as roleDescription, w.name as warehouseName
      FROM employees e
      LEFT JOIN employee_roles r ON e.roleId = r.id
      LEFT JOIN warehouses w ON e.warehouseId = w.id
      WHERE e.id = ?
    `).get(id);
  });
  electron.ipcMain.handle("insert-employee", (_, data) => {
    const result = db.prepare(`
      INSERT INTO employees (employeeCode, firstName, lastName, phone, email, address, emergencyContact,
        gender, dateOfBirth, roleId, department, warehouseId, isActive, employmentStatus, avatar, hireDate, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.employeeCode || null,
      data.firstName,
      data.lastName,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.emergencyContact || null,
      data.gender || null,
      data.dateOfBirth || null,
      data.roleId || null,
      data.department || null,
      data.warehouseId || null,
      data.isActive !== void 0 ? data.isActive ? 1 : 0 : 1,
      data.employmentStatus || "active",
      data.avatar || null,
      data.hireDate || null,
      data.notes || null
    );
    return result.lastInsertRowid;
  });
  electron.ipcMain.handle("update-employee", (_, id, data) => {
    const result = db.prepare(`
      UPDATE employees SET
        employeeCode = ?, firstName = ?, lastName = ?, phone = ?, email = ?,
        address = ?, emergencyContact = ?, gender = ?, dateOfBirth = ?,
        roleId = ?, department = ?, warehouseId = ?, isActive = ?,
        employmentStatus = ?, avatar = ?, hireDate = ?, notes = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.employeeCode || null,
      data.firstName,
      data.lastName,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.emergencyContact || null,
      data.gender || null,
      data.dateOfBirth || null,
      data.roleId || null,
      data.department || null,
      data.warehouseId || null,
      data.isActive !== void 0 ? data.isActive ? 1 : 0 : 1,
      data.employmentStatus || "active",
      data.avatar || null,
      data.hireDate || null,
      data.notes || null,
      id
    );
    return result;
  });
  electron.ipcMain.handle("delete-employee", (_, id) => {
    db.prepare("SELECT firstName, lastName FROM employees WHERE id = ?").get(id);
    db.prepare("DELETE FROM employees WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("archive-employee", (_, id) => {
    const result = db.prepare("UPDATE employees SET employmentStatus = 'inactive', isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    return result;
  });
  electron.ipcMain.handle("reactivate-employee", (_, id) => {
    const result = db.prepare("UPDATE employees SET employmentStatus = 'active', isActive = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    return result;
  });
  electron.ipcMain.handle("get-employee-accounts", () => {
    return db.prepare(`
      SELECT ea.*, e.firstName, e.lastName, e.employeeCode, r.name as roleName
      FROM employee_accounts ea
      LEFT JOIN employees e ON ea.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
      ORDER BY e.firstName, e.lastName
    `).all();
  });
  electron.ipcMain.handle("insert-employee-account", (_, data) => {
    if (!data.username || !data.username.trim()) throw new Error("Username is required");
    if (!data.pin || data.pin.length < 4) throw new Error("PIN must be at least 4 characters");
    const hash = hashPin(data.pin);
    const result = db.prepare("INSERT INTO employee_accounts (employeeId, username, pin, forcePasswordChange) VALUES (?, ?, ?, ?)").run(data.employeeId, data.username, hash, data.forcePasswordChange ? 1 : 0);
    return result.lastInsertRowid;
  });
  electron.ipcMain.handle("update-employee-account", (_, id, data) => {
    if (data.pin) {
      const hash = hashPin(data.pin);
      db.prepare("UPDATE employee_accounts SET username = ?, pin = ?, isActive = ?, forcePasswordChange = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(data.username, hash, data.isActive !== void 0 ? data.isActive ? 1 : 0 : 1, data.forcePasswordChange ? 1 : 0, id);
    } else {
      db.prepare("UPDATE employee_accounts SET username = ?, isActive = ?, forcePasswordChange = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(data.username, data.isActive !== void 0 ? data.isActive ? 1 : 0 : 1, data.forcePasswordChange ? 1 : 0, id);
    }
  });
  electron.ipcMain.handle("delete-employee-account", (_, id) => {
    db.prepare("SELECT username FROM employee_accounts WHERE id = ?").get(id);
    db.prepare("DELETE FROM employee_accounts WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("lock-employee-account", (_, id) => {
    const lockUntil = new Date(Date.now() + 30 * 60 * 1e3).toISOString();
    db.prepare("UPDATE employee_accounts SET isActive = 0, lockedUntil = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(lockUntil, id);
  });
  electron.ipcMain.handle("unlock-employee-account", (_, id) => {
    db.prepare("UPDATE employee_accounts SET isActive = 1, lockedUntil = NULL, failedLoginAttempts = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("reset-employee-password", (_, id, newPin) => {
    requirePermission("settings.users");
    const acct = db.prepare("SELECT ea.id, ea.employeeId, e.roleId, r.name as roleName FROM employee_accounts ea LEFT JOIN employees e ON ea.employeeId = e.id LEFT JOIN employee_roles r ON e.roleId = r.id WHERE ea.id = ?").get(id);
    if (!acct) return { success: false, error: "Account not found" };
    if (acct.roleName === "Owner") return { success: false, error: "Cannot reset PIN for Owner role" };
    const hash = hashPin(newPin);
    db.prepare("UPDATE employee_accounts SET pin = ?, forcePasswordChange = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(hash, id);
    db.prepare("INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)").run("employee_account", id, "pin_reset", currentUserName || "unknown", null, "PIN reset by super admin");
    insertAuditLog("pin_reset", "employee_account", id, "pin", "REDACTED", "REDACTED", `PIN reset for account #${id} by ${currentUserName || "unknown"}`);
    return { success: true };
  });
  electron.ipcMain.handle("generate-recovery-key", (_, entityType, entityId) => {
    const recoveryKey = crypto.randomBytes(32).toString("hex");
    const hint = recoveryKey.slice(0, 8) + "..." + recoveryKey.slice(-4);
    const hash = hashPin(recoveryKey);
    const existing = db.prepare("SELECT id FROM pin_recovery_keys WHERE employeeId = ? OR adminId = ?").get(entityType === "employee" ? entityId : null, entityType === "admin" ? entityId : null);
    if (existing) {
      db.prepare("UPDATE pin_recovery_keys SET recoveryKey = ?, keyHint = ?, usedAt = NULL, createdAt = CURRENT_TIMESTAMP WHERE id = ?").run(hash, hint, existing.id);
    } else {
      const empCol = entityType === "employee" ? entityId : null;
      const admCol = entityType === "admin" ? entityId : null;
      db.prepare("INSERT INTO pin_recovery_keys (employeeId, adminId, recoveryKey, keyHint) VALUES (?, ?, ?, ?)").run(empCol, admCol, hash, hint);
    }
    db.prepare("INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)").run(entityType === "employee" ? "employee_account" : "admin", entityId, "recovery_key_generated", currentUserName || "unknown", null, "Recovery key generated");
    insertAuditLog("generate_recovery_key", entityType === "employee" ? "employee_account" : "admin", entityId, null, null, null, `Recovery key generated for ${entityType} #${entityId} by ${currentUserName || "unknown"}`);
    return { recoveryKey, hint };
  });
  electron.ipcMain.handle("verify-recovery-key", (_, username, recoveryKey) => {
    let empId = null;
    let admId = null;
    const empAccount = db.prepare("SELECT ea.id as accountId, ea.employeeId FROM employee_accounts ea WHERE ea.username = ?").get(username);
    if (empAccount) {
      empId = empAccount.employeeId;
    } else {
      const admin = db.prepare("SELECT id FROM admins WHERE username = ?").get(username);
      if (admin) {
        admId = admin.id;
      }
    }
    if (!empId && !admId) return { valid: false, error: "Account not found" };
    let record = null;
    if (empId) {
      record = db.prepare("SELECT * FROM pin_recovery_keys WHERE employeeId = ?").get(empId);
    }
    if (!record && admId) {
      record = db.prepare("SELECT * FROM pin_recovery_keys WHERE adminId = ?").get(admId);
    }
    if (!record) return { valid: false, error: "No recovery key found for this account" };
    if (record.usedAt) return { valid: false, error: "Recovery key has already been used" };
    if (!verifyPin(recoveryKey, record.recoveryKey)) return { valid: false, error: "Invalid recovery key" };
    return { valid: true, accountId: empId || admId, isEmployee: !!empId };
  });
  electron.ipcMain.handle("reset-pin-with-recovery", (_, username, recoveryKey, newPin) => {
    let empId = null;
    let admId = null;
    const empAccount = db.prepare("SELECT ea.id as accountId, ea.employeeId FROM employee_accounts ea WHERE ea.username = ?").get(username);
    if (empAccount) {
      empId = empAccount.employeeId;
    } else {
      const admin = db.prepare("SELECT id FROM admins WHERE username = ?").get(username);
      if (admin) {
        admId = admin.id;
      }
    }
    if (!empId && !admId) return { success: false, error: "Account not found" };
    let record = null;
    if (empId) {
      record = db.prepare("SELECT * FROM pin_recovery_keys WHERE employeeId = ?").get(empId);
    }
    if (!record && admId) {
      record = db.prepare("SELECT * FROM pin_recovery_keys WHERE adminId = ?").get(admId);
    }
    if (!record) return { success: false, error: "No recovery key found" };
    if (record.usedAt) return { success: false, error: "Recovery key has already been used" };
    if (!verifyPin(recoveryKey, record.recoveryKey)) return { success: false, error: "Invalid recovery key" };
    db.prepare("UPDATE pin_recovery_keys SET usedAt = CURRENT_TIMESTAMP WHERE id = ?").run(record.id);
    const hash = hashPin(newPin);
    if (empId) {
      const existingAcct = db.prepare("SELECT id FROM employee_accounts WHERE employeeId = ?").get(empId);
      if (existingAcct) {
        db.prepare("UPDATE employee_accounts SET pin = ?, forcePasswordChange = 0, failedLoginAttempts = 0, lockedUntil = NULL, isActive = 1, updatedAt = CURRENT_TIMESTAMP WHERE employeeId = ?").run(hash, empId);
      }
    }
    if (admId) {
      db.prepare("UPDATE admins SET pin = ? WHERE id = ?").run(hash, admId);
    }
    const targetId = (empId || admId) ?? void 0;
    db.prepare("INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)").run("employee_account", targetId, "pin_recovery_reset", username, null, "PIN reset via recovery key");
    insertAuditLog("pin_recovery_reset", "account", targetId ?? null, "pin", "REDACTED", "REDACTED", `PIN reset via recovery key for ${username}`);
    return { success: true };
  });
  electron.ipcMain.handle("lock-user-account", (_, id) => {
    requirePermission("settings.users");
    const lockUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3).toISOString();
    const acct = db.prepare("SELECT ea.*, e.firstName, e.lastName, r.name as roleName FROM employee_accounts ea LEFT JOIN employees e ON ea.employeeId = e.id LEFT JOIN employee_roles r ON e.roleId = r.id WHERE ea.id = ?").get(id);
    if (!acct) return { success: false, error: "Account not found" };
    if (acct.roleName === "Owner") return { success: false, error: "Cannot lock an Owner account" };
    db.prepare("UPDATE employee_accounts SET isActive = 0, lockedUntil = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(lockUntil, id);
    db.prepare("INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)").run("employee_account", id, "account_locked", currentUserName || "unknown", null, `Account locked`);
    insertAuditLog("lock_account", "employee_account", id, "isActive", "1", "0", `Account #${id} locked by ${currentUserName || "unknown"}`);
    return { success: true };
  });
  electron.ipcMain.handle("unlock-user-account", (_, id) => {
    requirePermission("settings.users");
    const acct = db.prepare("SELECT id FROM employee_accounts WHERE id = ?").get(id);
    if (!acct) return { success: false, error: "Account not found" };
    db.prepare("UPDATE employee_accounts SET isActive = 1, lockedUntil = NULL, failedLoginAttempts = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    db.prepare("INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)").run("employee_account", id, "account_unlocked", currentUserName || "unknown", null, `Account unlocked`);
    insertAuditLog("unlock_account", "employee_account", id, "isActive", "0", "1", `Account #${id} unlocked by ${currentUserName || "unknown"}`);
    return { success: true };
  });
  electron.ipcMain.handle("force-pin-change", (_, id) => {
    requirePermission("settings.users");
    const acct = db.prepare("SELECT ea.id, e.roleId, r.name as roleName FROM employee_accounts ea LEFT JOIN employees e ON ea.employeeId = e.id LEFT JOIN employee_roles r ON e.roleId = r.id WHERE ea.id = ?").get(id);
    if (!acct) return { success: false, error: "Account not found" };
    if (acct.roleName === "Owner") return { success: false, error: "Cannot force PIN change for Owner role" };
    db.prepare("UPDATE employee_accounts SET forcePasswordChange = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    db.prepare("INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)").run("employee_account", id, "force_pin_change", currentUserName || "unknown", null, `Forced PIN change`);
    insertAuditLog("force_pin_change", "employee_account", id, "forcePasswordChange", "0", "1", `Force PIN change set for account #${id} by ${currentUserName || "unknown"}`);
    return { success: true };
  });
  electron.ipcMain.handle("get-pin-history", (_, entityType, entityId) => {
    let query = "SELECT * FROM pin_history";
    const params = [];
    if (entityType && entityId) {
      query += " WHERE entityType = ? AND entityId = ?";
      params.push(entityType, entityId);
    }
    query += " ORDER BY createdAt DESC LIMIT 100";
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("login-employee", (_, username, pin) => {
    const account = db.prepare(`
      SELECT ea.*, e.firstName, e.lastName, e.id as employeeId, e.roleId,
        r.name as roleName, r.permissions as rolePermissions
      FROM employee_accounts ea
      LEFT JOIN employees e ON ea.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
      WHERE ea.username = ?
    `).get(username);
    if (!account) {
      db.prepare("INSERT INTO login_history (accountId, action) VALUES (?, ?)").run(null, "failed_login: user not found");
      return null;
    }
    if (account.lockedUntil && new Date(account.lockedUntil) > /* @__PURE__ */ new Date()) {
      db.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "failed_login: account locked");
      return { error: "locked", lockedUntil: account.lockedUntil };
    }
    if (!account.isActive) {
      db.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "failed_login: inactive");
      return { error: "inactive" };
    }
    if (!verifyPin(pin, account.pin)) {
      const attempts = (account.failedLoginAttempts || 0) + 1;
      if (attempts >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1e3).toISOString();
        db.prepare("UPDATE employee_accounts SET failedLoginAttempts = ?, lockedUntil = ?, isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(attempts, lockUntil, account.id);
        db.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "failed_login: locked after 5 attempts");
        return { error: "locked", lockedUntil: lockUntil };
      }
      db.prepare("UPDATE employee_accounts SET failedLoginAttempts = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(attempts, account.id);
      db.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "failed_login: wrong pin");
      return null;
    }
    db.prepare("UPDATE employee_accounts SET lastLogin = CURRENT_TIMESTAMP, failedLoginAttempts = 0, lockedUntil = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(account.id);
    db.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "login");
    currentUserName = `${account.firstName} ${account.lastName}`;
    const rolePerms = account.rolePermissions ? JSON.parse(account.rolePermissions) : [];
    currentUserPermissions = rolePerms.length > 0 ? rolePerms : ["*"];
    return {
      id: account.employeeId,
      accountId: account.id,
      username: account.username,
      firstName: account.firstName,
      lastName: account.lastName,
      roleName: account.roleName,
      roleId: account.roleId,
      permissions: account.rolePermissions ? JSON.parse(account.rolePermissions) : [],
      forcePasswordChange: account.forcePasswordChange
    };
  });
  electron.ipcMain.handle("get-login-history", (_, options) => {
    let query = `
      SELECT lh.*, e.firstName, e.lastName, ea.username
      FROM login_history lh
      LEFT JOIN employee_accounts ea ON lh.accountId = ea.id
      LEFT JOIN employees e ON lh.employeeId = e.id
    `;
    const conditions = [];
    const params = [];
    if (options?.employeeId) {
      conditions.push("lh.employeeId = ?");
      params.push(options.employeeId);
    }
    if (options?.accountId) {
      conditions.push("lh.accountId = ?");
      params.push(options.accountId);
    }
    if (options?.fromDate) {
      conditions.push("lh.createdAt >= ?");
      params.push(options.fromDate);
    }
    if (options?.toDate) {
      conditions.push("lh.createdAt <= ?");
      params.push(options.toDate);
    }
    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY lh.createdAt DESC";
    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    query += " LIMIT ?";
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("clock-in", (_, employeeId, notes) => {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existing = db.prepare("SELECT id FROM attendance WHERE employeeId = ? AND date = ?").get(employeeId, today);
    if (existing) throw new Error("Already clocked in today");
    const result = db.prepare("INSERT INTO attendance (employeeId, date, clockIn, status, notes) VALUES (?, ?, ?, ?, ?)").run(employeeId, today, now, "present", notes || null);
    return result.lastInsertRowid;
  });
  electron.ipcMain.handle("clock-out", (_, employeeId, notes) => {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existing = db.prepare("SELECT id, clockIn FROM attendance WHERE employeeId = ? AND date = ?").get(employeeId, today);
    if (!existing) throw new Error("Not clocked in today");
    if (existing.clockOut) throw new Error("Already clocked out today");
    const clockIn = new Date(existing.clockIn);
    const clockOut = new Date(now);
    const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1e3 * 60 * 60);
    const status = hoursWorked >= 8 ? "present" : hoursWorked >= 4 ? "partial" : "short";
    db.prepare("UPDATE attendance SET clockOut = ?, status = ?, notes = ? WHERE id = ?").run(now, status, notes || null, existing.id);
  });
  electron.ipcMain.handle("get-attendance", (_, options) => {
    let query = `
      SELECT a.*, e.firstName, e.lastName, e.employeeCode, r.name as roleName
      FROM attendance a
      LEFT JOIN employees e ON a.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
    `;
    const conditions = [];
    const params = [];
    if (options?.employeeId) {
      conditions.push("a.employeeId = ?");
      params.push(options.employeeId);
    }
    if (options?.fromDate) {
      conditions.push("a.date >= ?");
      params.push(options.fromDate);
    }
    if (options?.toDate) {
      conditions.push("a.date <= ?");
      params.push(options.toDate);
    }
    if (options?.status) {
      conditions.push("a.status = ?");
      params.push(options.status);
    }
    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY a.date DESC, a.clockIn DESC";
    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    query += " LIMIT ?";
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-today-attendance", () => {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    return db.prepare(`
      SELECT a.*, e.firstName, e.lastName, e.employeeCode, r.name as roleName
      FROM attendance a
      LEFT JOIN employees e ON a.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
      WHERE a.date = ?
      ORDER BY a.clockIn DESC
    `).all(today);
  });
  electron.ipcMain.handle("get-employee-performance", (_, options) => {
    let query = `
      SELECT ep.*, e.firstName, e.lastName, e.employeeCode, r.name as roleName
      FROM employee_performance ep
      LEFT JOIN employees e ON ep.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
    `;
    const conditions = [];
    const params = [];
    if (options?.employeeId) {
      conditions.push("ep.employeeId = ?");
      params.push(options.employeeId);
    }
    if (options?.period) {
      conditions.push("ep.period = ?");
      params.push(options.period);
    }
    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY ep.period DESC, ep.salesAmount DESC";
    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    query += " LIMIT ?";
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("update-employee-performance", (_, data) => {
    const existing = db.prepare("SELECT id FROM employee_performance WHERE employeeId = ? AND period = ?").get(data.employeeId, data.period);
    if (existing) {
      db.prepare(`UPDATE employee_performance SET salesAmount = ?, ordersProcessed = ?, attendanceScore = ?, tasksCompleted = ?, rating = ?, notes = ? WHERE id = ?`).run(data.salesAmount || 0, data.ordersProcessed || 0, data.attendanceScore || 0, data.tasksCompleted || 0, data.rating || null, data.notes || null, existing.id);
    } else {
      db.prepare(`INSERT INTO employee_performance (employeeId, period, salesAmount, ordersProcessed, attendanceScore, tasksCompleted, rating, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(data.employeeId, data.period, data.salesAmount || 0, data.ordersProcessed || 0, data.attendanceScore || 0, data.tasksCompleted || 0, data.rating || null, data.notes || null);
    }
  });
  electron.ipcMain.handle("get-employee-stats", () => {
    const total = db.prepare("SELECT COUNT(*) as count FROM employees").get();
    const active = db.prepare("SELECT COUNT(*) as count FROM employees WHERE isActive = 1").get();
    const online = db.prepare("SELECT COUNT(*) as count FROM employee_accounts WHERE isActive = 1 AND lastLogin IS NOT NULL AND lastLogin >= datetime('now', '-24 hours')").get();
    const pendingApprovals = db.prepare("SELECT COUNT(*) as count FROM employees WHERE employmentStatus = 'pending'").get();
    const clockedIn = (() => {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const row = db.prepare("SELECT COUNT(*) as count FROM attendance WHERE date = ? AND clockIn IS NOT NULL AND clockOut IS NULL").get(today);
      return row.count;
    })();
    const departments = db.prepare("SELECT department, COUNT(*) as count FROM employees WHERE department IS NOT NULL AND department != '' GROUP BY department ORDER BY count DESC").all();
    return { total: total.count, active: active.count, online: online.count, pendingApprovals: pendingApprovals.count, clockedIn, departments };
  });
  electron.ipcMain.handle("get-shipments", (_, options) => {
    let query = `SELECT * FROM shipments WHERE businessId = ?`;
    const params = [getActiveBusinessId()];
    if (options?.status) {
      query += " AND status = ?";
      params.push(options.status);
    }
    if (options?.search) {
      query += " AND (destination LIKE ? OR driverName LIKE ? OR notes LIKE ?)";
      const s = `%${options.search}%`;
      params.push(s, s, s);
    }
    if (options?.fromDate) {
      query += " AND createdAt >= ?";
      params.push(options.fromDate);
    }
    if (options?.toDate) {
      query += " AND createdAt <= ?";
      params.push(options.toDate);
    }
    query += " ORDER BY createdAt DESC";
    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    query += " LIMIT ?";
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-shipment", (_, id) => {
    const shipment = db.prepare("SELECT * FROM shipments WHERE id = ?").get(id);
    const items = db.prepare("SELECT * FROM shipment_items WHERE shipmentId = ?").all(id);
    const history = db.prepare("SELECT * FROM shipment_history WHERE shipmentId = ? ORDER BY createdAt DESC").all(id);
    return { ...shipment, items, history };
  });
  electron.ipcMain.handle("insert-shipment", (_, data) => {
    const bizId = getActiveBusinessId();
    const result = db.prepare(`
      INSERT INTO shipments (businessId, origin, destination, driverName, driverPhone, vehicleInfo, status, notes, scheduledDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bizId,
      data.origin || null,
      data.destination,
      data.driverName || null,
      data.driverPhone || null,
      data.vehicleInfo || null,
      "pending",
      data.notes || null,
      data.scheduledDate || null
    );
    const shipmentId = result.lastInsertRowid;
    db.prepare("INSERT INTO shipment_history (shipmentId, status, changedBy, notes) VALUES (?, ?, ?, ?)").run(shipmentId, "pending", data.createdBy || null, "Shipment created");
    return shipmentId;
  });
  electron.ipcMain.handle("update-shipment", (_, id, data) => {
    return db.prepare(`
      UPDATE shipments SET origin = ?, destination = ?, driverName = ?, driverPhone = ?,
        vehicleInfo = ?, notes = ?, scheduledDate = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.origin || null,
      data.destination,
      data.driverName || null,
      data.driverPhone || null,
      data.vehicleInfo || null,
      data.notes || null,
      data.scheduledDate || null,
      id
    );
  });
  electron.ipcMain.handle("update-shipment-status", (_, id, status, changedBy, notes) => {
    const validStatuses = ["pending", "in_transit", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) throw new Error("Invalid status");
    const updates = ["status = ?", "updatedAt = CURRENT_TIMESTAMP"];
    const params = [status];
    if (status === "delivered") {
      updates.push("deliveredAt = CURRENT_TIMESTAMP");
    }
    params.push(id);
    db.prepare(`UPDATE shipments SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    db.prepare("INSERT INTO shipment_history (shipmentId, status, changedBy, notes) VALUES (?, ?, ?, ?)").run(id, status, changedBy || null, notes || null);
    return { success: true };
  });
  electron.ipcMain.handle("delete-shipment", (_, id) => {
    return db.prepare("DELETE FROM shipments WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("get-shipment-history", (_, shipmentId) => {
    return db.prepare("SELECT * FROM shipment_history WHERE shipmentId = ? ORDER BY createdAt DESC").all(shipmentId);
  });
  electron.ipcMain.handle("get-suppliers", (_, options = {}) => {
    const bizId = getActiveBusinessId();
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    const search = options.search ? `%${options.search}%` : null;
    const status = options.status || null;
    let where = "s.businessId = ?";
    const params = [bizId];
    if (search) {
      where += " AND (s.supplierName LIKE ? OR s.companyName LIKE ? OR s.phone LIKE ? OR s.email LIKE ?)";
      params.push(search, search, search, search);
    }
    if (status === "active") where += " AND s.isActive = 1";
    if (status === "inactive") where += " AND s.isActive = 0";
    const rows = db.prepare(`
      SELECT s.*,
        COALESCE(SUM(CASE WHEN sp.status != 'cancelled' THEN sp.totalAmount ELSE 0 END), 0) AS totalPurchases,
        COALESCE(SUM(CASE WHEN sp.status != 'cancelled' THEN sp.paidAmount ELSE 0 END), 0) AS totalPaid,
        COALESCE(SUM(CASE WHEN sp.status != 'cancelled' THEN sp.totalAmount - sp.paidAmount ELSE 0 END), 0) AS outstandingBalance,
        MAX(CASE WHEN sp.status != 'cancelled' THEN sp.purchaseDate ELSE NULL END) AS lastPurchaseDate,
        (SELECT COUNT(*) FROM supplier_purchases WHERE supplierId = s.id AND status != 'cancelled') AS purchaseCount
      FROM suppliers s
      LEFT JOIN supplier_purchases sp ON sp.supplierId = s.id
      WHERE ${where}
      GROUP BY s.id
      ORDER BY s.supplierName ASC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    const total = db.prepare(`SELECT COUNT(*) AS c FROM suppliers s WHERE ${where}`).get(...params).c;
    return { rows, total };
  });
  electron.ipcMain.handle("get-supplier", (_, id) => {
    getActiveBusinessId();
    const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id);
    if (!supplier) return null;
    const stats = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN totalAmount ELSE 0 END), 0) AS totalPurchases,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN paidAmount ELSE 0 END), 0) AS totalPaid,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN totalAmount - paidAmount ELSE 0 END), 0) AS outstanding,
        COUNT(CASE WHEN status != 'cancelled' THEN 1 ELSE NULL END) AS purchaseCount,
        AVG(CASE WHEN status != 'cancelled' THEN totalAmount ELSE NULL END) AS avgPurchase,
        MAX(CASE WHEN status != 'cancelled' THEN purchaseDate ELSE NULL END) AS lastPurchaseDate,
        (SELECT COUNT(DISTINCT itemId) FROM supplier_purchase_items spi
         JOIN supplier_purchases sp ON spi.purchaseId = sp.id
         WHERE sp.supplierId = ? AND sp.status != 'cancelled') AS productCount
      FROM supplier_purchases WHERE supplierId = ?
    `).get(id, id);
    return { ...supplier, ...stats };
  });
  electron.ipcMain.handle("insert-supplier", (_, data) => {
    if (!data.supplierName || String(data.supplierName).trim() === "") {
      throw new Error("Supplier name is required");
    }
    const phone = data.phone ? String(data.phone).trim() : "";
    if (phone && phone.length > 0 && (phone.length < 7 || phone.length > 20 || !/^[+\d\s\-\(\)]+$/.test(phone))) {
      throw new Error("Invalid phone number");
    }
    if (data.email && data.email.trim()) {
      const email = data.email.trim();
      if (email.length > 5 && !/^[^\s@]+@[^\s@]+/.test(email)) {
        throw new Error("Invalid email address");
      }
    }
    const bizId = getActiveBusinessId();
    const dup = db.prepare(`
      SELECT id FROM suppliers WHERE businessId = ? AND LOWER(supplierName) = LOWER(?)
    `).get(bizId, data.supplierName);
    if (dup) throw new Error("A supplier with this name already exists");
    const code = data.supplierCode || `SUP-${Date.now().toString().slice(-7)}`;
    const creditLimit = data.creditLimit ? validateNonNegative(data.creditLimit, "Credit limit") : 0;
    const res = db.prepare(`
      INSERT INTO suppliers (
        businessId, supplierCode, supplierName, companyName, contactPerson,
        phone, secondaryPhone, email, address, city, country,
        taxNumber, paymentTerms, creditLimit, notes, status, isActive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      bizId,
      code,
      data.supplierName,
      data.companyName || null,
      data.contactPerson || null,
      phone || null,
      data.secondaryPhone || null,
      data.email || null,
      data.address || null,
      data.city || null,
      data.country || "Ethiopia",
      data.taxNumber || null,
      data.paymentTerms || null,
      creditLimit,
      data.notes || null,
      data.status || "active"
    );
    return { id: res.lastInsertRowid };
  });
  electron.ipcMain.handle("update-supplier", (_, id, data) => {
    if (!data.supplierName || String(data.supplierName).trim() === "") {
      throw new Error("Supplier name is required");
    }
    const phone = data.phone ? String(data.phone).trim() : "";
    if (phone && phone.length > 0 && (phone.length < 7 || phone.length > 20 || !/^[+\d\s\-\(\)]+$/.test(phone))) {
      throw new Error("Invalid phone number");
    }
    if (data.email && data.email.trim()) {
      const email = data.email.trim();
      if (email.length > 5 && !/^[^\s@]+@[^\s@]+/.test(email)) {
        throw new Error("Invalid email address");
      }
    }
    const dup = db.prepare(`
      SELECT id FROM suppliers WHERE id != ? AND LOWER(supplierName) = LOWER(?)
    `).get(id, data.supplierName);
    if (dup) throw new Error("A supplier with this name already exists");
    const creditLimit = data.creditLimit != null ? validateNonNegative(data.creditLimit, "Credit limit") : 0;
    db.prepare(`
      UPDATE suppliers SET
        supplierName = ?, companyName = ?, contactPerson = ?,
        phone = ?, secondaryPhone = ?, email = ?,
        address = ?, city = ?, country = ?,
        taxNumber = ?, paymentTerms = ?, creditLimit = ?,
        notes = ?, status = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.supplierName,
      data.companyName || null,
      data.contactPerson || null,
      phone || null,
      data.secondaryPhone || null,
      data.email || null,
      data.address || null,
      data.city || null,
      data.country || "Ethiopia",
      data.taxNumber || null,
      data.paymentTerms || null,
      creditLimit,
      data.notes || null,
      data.status || "active",
      id
    );
    return { success: true };
  });
  electron.ipcMain.handle("archive-supplier", (_, id) => {
    db.prepare("UPDATE suppliers SET isActive = 0, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run("inactive", id);
    db.prepare("SELECT supplierName FROM suppliers WHERE id = ?").get(id);
    return { success: true };
  });
  electron.ipcMain.handle("restore-supplier", (_, id) => {
    db.prepare("UPDATE suppliers SET isActive = 1, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run("active", id);
    db.prepare("SELECT supplierName FROM suppliers WHERE id = ?").get(id);
    return { success: true };
  });
  electron.ipcMain.handle("delete-supplier", (_, id) => {
    const purchases = db.prepare("SELECT COUNT(*) AS c FROM supplier_purchases WHERE supplierId = ?").get(id);
    if (purchases.c > 0) throw new Error("Cannot delete supplier with existing purchases. Archive instead.");
    db.prepare("SELECT supplierName FROM suppliers WHERE id = ?").get(id);
    db.prepare("DELETE FROM suppliers WHERE id = ?").run(id);
    return { success: true };
  });
  electron.ipcMain.handle("get-supplier-purchases", (_, options = {}) => {
    const bizId = getActiveBusinessId();
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    const supplierId = options.supplierId || null;
    const status = options.status || null;
    let where = "sp.businessId = ?";
    const params = [bizId];
    if (supplierId) {
      where += " AND sp.supplierId = ?";
      params.push(supplierId);
    }
    if (status) {
      where += " AND sp.status = ?";
      params.push(status);
    }
    const rows = db.prepare(`
      SELECT sp.*, s.supplierName, s.companyName,
        (sp.totalAmount - sp.paidAmount) AS remainingBalance,
        (SELECT COUNT(*) FROM supplier_purchase_items WHERE purchaseId = sp.id) AS productCount
      FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId
      WHERE ${where}
      ORDER BY sp.purchaseDate DESC, sp.id DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    const total = db.prepare(`SELECT COUNT(*) AS c FROM supplier_purchases sp WHERE ${where}`).get(...params).c;
    return { rows, total };
  });
  electron.ipcMain.handle("get-supplier-purchase", (_, id) => {
    const purchase = db.prepare(`
      SELECT sp.*, s.supplierName, s.companyName
      FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId
      WHERE sp.id = ?
    `).get(id);
    if (!purchase) return null;
    const items = db.prepare("SELECT * FROM supplier_purchase_items WHERE purchaseId = ?").all(id);
    return { ...purchase, items };
  });
  function logSupplierActivity(supplierId, action, entityType, entityId, description) {
    try {
      db.prepare("INSERT INTO supplier_activity_log (supplierId, action, description, entityType, entityId, createdBy) VALUES (?, ?, ?, ?, ?, ?)").run(supplierId, action, description, entityType, entityId, currentUserName || "system");
      db.prepare("UPDATE suppliers SET lastActivityDate = CURRENT_TIMESTAMP WHERE id = ?").run(supplierId);
    } catch (_) {
    }
  }
  electron.ipcMain.handle("insert-supplier-purchase", (_, data) => {
    if (!data.supplierId) throw new Error("Supplier is required");
    if (!data.purchaseDate) throw new Error("Purchase date is required");
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("At least one item is required");
    }
    const totalAmount = validateNonNegative(data.totalAmount, "Total amount");
    const purchaseNumber = data.purchaseNumber || `PO-${Date.now().toString().slice(-8)}`;
    const bizId = getActiveBusinessId();
    const defWhId = getDefaultWarehouseId();
    const insertPurchase = db.transaction(() => {
      const res = db.prepare(`
        INSERT INTO supplier_purchases (
          businessId, supplierId, purchaseNumber, purchaseDate,
          totalAmount, paidAmount, dueDate, status, notes, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        bizId,
        data.supplierId,
        purchaseNumber,
        data.purchaseDate,
        totalAmount,
        validateNonNegative(data.paidAmount || 0, "Paid amount"),
        data.dueDate || null,
        data.status || "pending",
        data.notes || null,
        currentUserName || "system"
      );
      const purchaseId = Number(res.lastInsertRowid);
      const insertItem = db.prepare(`
        INSERT INTO supplier_purchase_items (
          purchaseId, itemId, itemName, sku, quantity, unit, unitPrice, totalPrice
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const updateItemStock = db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, lastPurchaseDate = ?, lastPurchasePrice = ? WHERE id = ?");
      const upsertWh = db.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?) ON CONFLICT(warehouseId, itemId) DO UPDATE SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP");
      const insertSm = db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceId, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
      for (const it of data.items) {
        const qty = validatePositive(it.quantity, "Item quantity");
        const price = validateNonNegative(it.unitPrice, "Item unit price");
        insertItem.run(
          purchaseId,
          it.itemId || null,
          it.itemName,
          it.sku || null,
          qty,
          it.unit || "pcs",
          price,
          qty * price
        );
        if (it.itemId) {
          updateItemStock.run(qty, data.purchaseDate, price, it.itemId);
          upsertWh.run(defWhId, it.itemId, qty, qty);
          insertSm.run(defWhId, it.itemId, "purchase_in", qty, purchaseId, "supplier_purchase", `Purchase ${purchaseNumber} - ${it.itemName}`);
        }
      }
      return purchaseId;
    });
    const id = insertPurchase();
    logSupplierActivity(data.supplierId, "purchase_created", "supplier_purchase", id, `Purchase ${purchaseNumber} created for $${totalAmount}`);
    try {
      db.prepare(`INSERT INTO notifications (businessId, type, category, title, message, severity) VALUES (?, ?, ?, ?, ?, ?)`).run(bizId, "purchase_created", "suppliers", "New Purchase Created", `Purchase ${purchaseNumber} for supplier #${data.supplierId}`, "info");
    } catch (_2) {
    }
    return { id };
  });
  electron.ipcMain.handle("update-supplier-purchase-status", (_, id, status, notes) => {
    const validStatuses = ["draft", "pending", "approved", "ordered", "received", "cancelled"];
    if (!validStatuses.includes(status)) throw new Error("Invalid status");
    const prev = db.prepare("SELECT status, supplierId FROM supplier_purchases WHERE id = ?").get(id);
    if (!prev) throw new Error("Purchase not found");
    const prevStatus = prev.status;
    db.prepare("UPDATE supplier_purchases SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(status, id);
    if (status === "received" && prevStatus !== "received") {
      const defWhId = getDefaultWarehouseId();
      const items = db.prepare("SELECT * FROM supplier_purchase_items WHERE purchaseId = ?").all(id);
      const purchase = db.prepare("SELECT purchaseNumber, supplierId FROM supplier_purchases WHERE id = ?").get(id);
      const updateItemStock = db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, lastPurchaseDate = CURRENT_TIMESTAMP, lastPurchasePrice = ? WHERE id = ?");
      const upsertWh = db.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?) ON CONFLICT(warehouseId, itemId) DO UPDATE SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP");
      const insertSm = db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceId, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
      const updateReceived = db.prepare("UPDATE supplier_purchase_items SET receivedQuantity = receivedQuantity + ? WHERE id = ?");
      const receiveTxn = db.transaction(() => {
        for (const it of items) {
          if (!it.itemId) continue;
          const remaining = it.quantity - (it.receivedQuantity || 0);
          if (remaining <= 0) continue;
          updateReceived.run(remaining, it.id);
          updateItemStock.run(remaining, it.unitPrice, it.itemId);
          upsertWh.run(defWhId, it.itemId, remaining, remaining);
          insertSm.run(defWhId, it.itemId, "purchase_received", remaining, id, "supplier_purchase", `Received purchase #${id} - ${it.itemName}`);
        }
      });
      receiveTxn();
      logSupplierActivity(purchase.supplierId, "purchase_received", "supplier_purchase", id, `Purchase order #${id} marked as received`);
    }
    if (status === "received" || status === "approved") {
      try {
        const bizId2 = getActiveBusinessId();
        db.prepare(`INSERT INTO notifications (businessId, type, category, title, message, severity) VALUES (?, ?, ?, ?, ?, ?)`).run(bizId2, "purchase_received", "suppliers", "Purchase Order Received", `Purchase order #${id} marked as ${status}`, "success");
      } catch (_2) {
      }
    }
    return { success: true };
  });
  electron.ipcMain.handle("delete-supplier-purchase", (_, id) => {
    const row = db.prepare("SELECT purchaseNumber, supplierId FROM supplier_purchases WHERE id = ?").get(id);
    if (!row) throw new Error("Purchase not found");
    const payCheck = db.prepare("SELECT paidAmount FROM supplier_purchases WHERE id = ?").get(id);
    if (payCheck && payCheck.paidAmount > 0) {
      throw new Error("Cannot delete a purchase with payments. Delete payments first.");
    }
    const transaction = db.transaction(() => {
      const items = db.prepare("SELECT * FROM supplier_purchase_items WHERE purchaseId = ?").all(id);
      const defWhId = getDefaultWarehouseId();
      for (const it of items) {
        if (!it.itemId) continue;
        const receivedQty = it.receivedQuantity || 0;
        if (receivedQty > 0) {
          db.prepare("UPDATE items SET totalBaseQuantity = MAX(0, totalBaseQuantity - ?) WHERE id = ?").run(receivedQty, it.itemId);
          db.prepare("UPDATE warehouse_inventory SET quantity = MAX(0, quantity - ?) WHERE warehouseId = ? AND itemId = ?").run(receivedQty, defWhId, it.itemId);
          db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceId, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").run(defWhId, it.itemId, "purchase_reversal", -receivedQty, id, "supplier_purchase", `Reversed purchase #${id} - ${it.itemName}`);
        }
      }
      db.prepare("DELETE FROM supplier_purchase_items WHERE purchaseId = ?").run(id);
      db.prepare("DELETE FROM supplier_purchases WHERE id = ?").run(id);
    });
    transaction();
    logSupplierActivity(row.supplierId, "purchase_deleted", "supplier_purchase", id, `Purchase ${row?.purchaseNumber || id} deleted`);
    return { success: true };
  });
  electron.ipcMain.handle("get-supplier-payments", (_, options = {}) => {
    const bizId = getActiveBusinessId();
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    const supplierId = options.supplierId || null;
    let where = "s.businessId = ?";
    const params = [bizId];
    if (supplierId) {
      where += " AND pay.supplierId = ?";
      params.push(supplierId);
    }
    const rows = db.prepare(`
      SELECT pay.*, s.supplierName, sp.purchaseNumber
      FROM supplier_payments pay
      JOIN suppliers s ON s.id = pay.supplierId
      LEFT JOIN supplier_purchases sp ON sp.id = pay.purchaseId
      WHERE ${where}
      ORDER BY pay.paymentDate DESC, pay.id DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    const total = db.prepare(`SELECT COUNT(*) AS c FROM supplier_payments pay JOIN suppliers s ON s.id = pay.supplierId WHERE ${where}`).get(...params).c;
    return { rows, total };
  });
  electron.ipcMain.handle("insert-supplier-payment", (_, data) => {
    if (!data.supplierId) throw new Error("Supplier is required");
    if (!data.paymentDate) throw new Error("Payment date is required");
    const amount = validatePositive(data.amount, "Amount");
    const validMethods = ["cash", "bank_transfer", "mobile_money", "check", "other"];
    if (!validMethods.includes(data.paymentMethod)) throw new Error("Invalid payment method");
    const bizId = getActiveBusinessId();
    const insertTxn = db.transaction(() => {
      const targetPurchaseId = data.purchaseId || null;
      let effectivePurchaseId = targetPurchaseId;
      if (!effectivePurchaseId) {
        const oldestOutstanding = db.prepare(`
          SELECT id, totalAmount - paidAmount AS remaining
          FROM supplier_purchases
          WHERE supplierId = ? AND businessId = ? AND status != 'cancelled' AND (totalAmount - paidAmount) > 0
          ORDER BY purchaseDate ASC, id ASC
          LIMIT 1
        `).get(data.supplierId, bizId);
        if (oldestOutstanding) {
          effectivePurchaseId = oldestOutstanding.id;
        }
      }
      const res = db.prepare(`
        INSERT INTO supplier_payments (
          businessId, supplierId, purchaseId, paymentDate,
          referenceNumber, amount, paymentMethod, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        bizId,
        data.supplierId,
        effectivePurchaseId,
        data.paymentDate,
        data.referenceNumber || null,
        amount,
        data.paymentMethod,
        data.notes || null
      );
      if (effectivePurchaseId) {
        db.prepare(`
          UPDATE supplier_purchases SET paidAmount = paidAmount + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
        `).run(amount, effectivePurchaseId);
        const remaining = db.prepare("SELECT totalAmount - paidAmount AS r FROM supplier_purchases WHERE id = ?").get(effectivePurchaseId);
        if (remaining && remaining.r <= 0) {
          db.prepare("UPDATE supplier_purchases SET status = 'received' WHERE id = ? AND status NOT IN ('cancelled')").run(effectivePurchaseId);
        }
      }
      return res.lastInsertRowid;
    });
    const id = insertTxn();
    logSupplierActivity(data.supplierId, "payment_recorded", "supplier_payment", Number(id), `Payment of ${amount} recorded via ${data.paymentMethod}`);
    return { id };
  });
  electron.ipcMain.handle("update-supplier-payment", (_, id, data) => {
    const oldPayment = db.prepare("SELECT * FROM supplier_payments WHERE id = ?").get(id);
    if (!oldPayment) throw new Error("Payment not found");
    const amount = validatePositive(data.amount, "Amount");
    const validMethods = ["cash", "bank_transfer", "mobile_money", "check", "other"];
    if (!validMethods.includes(data.paymentMethod)) throw new Error("Invalid payment method");
    const purchaseId = data.purchaseId ? Number(data.purchaseId) : oldPayment.purchaseId;
    const updateTxn = db.transaction(() => {
      db.prepare(`
        UPDATE supplier_payments SET
          paymentDate = ?, referenceNumber = ?, amount = ?,
          paymentMethod = ?, notes = ?, purchaseId = ?
        WHERE id = ?
      `).run(
        data.paymentDate,
        data.referenceNumber || null,
        amount,
        data.paymentMethod,
        data.notes || null,
        purchaseId,
        id
      );
      if (purchaseId) {
        const totalPaid = db.prepare("SELECT COALESCE(SUM(amount), 0) AS tp FROM supplier_payments WHERE purchaseId = ? AND id != ?").get(purchaseId, id).tp;
        const newPaid = totalPaid + amount;
        db.prepare("UPDATE supplier_purchases SET paidAmount = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(newPaid, purchaseId);
        const remaining = db.prepare("SELECT totalAmount - paidAmount AS r FROM supplier_purchases WHERE id = ?").get(purchaseId);
        if (remaining && remaining.r <= 0) {
          db.prepare("UPDATE supplier_purchases SET status = 'received' WHERE id = ? AND status NOT IN ('cancelled')").run(purchaseId);
        } else if (remaining && remaining.r > 0) {
          db.prepare("UPDATE supplier_purchases SET status = 'pending' WHERE id = ? AND status = 'received'").run(purchaseId);
        }
      }
    });
    updateTxn();
    return { success: true };
  });
  electron.ipcMain.handle("delete-supplier-payment", (_, id) => {
    const payment = db.prepare("SELECT * FROM supplier_payments WHERE id = ?").get(id);
    if (!payment) throw new Error("Payment not found");
    const reverse = db.transaction(() => {
      db.prepare("DELETE FROM supplier_payments WHERE id = ?").run(id);
      if (payment.purchaseId) {
        const totalPaid = db.prepare("SELECT COALESCE(SUM(amount), 0) AS tp FROM supplier_payments WHERE purchaseId = ?").get(payment.purchaseId).tp;
        db.prepare("UPDATE supplier_purchases SET paidAmount = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(totalPaid, payment.purchaseId);
      }
    });
    reverse();
    return { success: true };
  });
  electron.ipcMain.handle("get-supplier-products", (_, supplierId) => {
    return db.prepare(`
      SELECT
        COALESCE(spi.itemId, i.id) AS productId,
        COALESCE(spi.itemName, i.name) AS itemName,
        spi.sku,
        MAX(COALESCE(sp.purchaseDate, i.lastPurchaseDate)) AS lastPurchaseDate,
        COALESCE(spi.unitPrice, i.lastPurchasePrice, i.basePurchasePrice) AS lastPurchasePrice,
        COALESCE(AVG(spi.unitPrice), i.basePurchasePrice) AS avgPurchasePrice,
        COALESCE(SUM(spi.quantity), 0) AS totalPurchased,
        COALESCE(i.totalBaseQuantity, 0) AS currentStock
      FROM items i
      LEFT JOIN supplier_purchase_items spi ON spi.itemId = i.id
      LEFT JOIN supplier_purchases sp ON sp.id = spi.purchaseId AND sp.supplierId = ? AND sp.status != 'cancelled'
      WHERE i.supplierId = ? AND i.is_deleted = 0
      GROUP BY i.id
      ORDER BY lastPurchaseDate DESC, i.name ASC
    `).all(supplierId, supplierId);
  });
  electron.ipcMain.handle("get-supplier-balance", (_, supplierId) => {
    const totals = db.prepare(`
      SELECT
        COALESCE(SUM(totalAmount), 0) AS totalDue,
        COALESCE(SUM(paidAmount), 0) AS totalPaid,
        COALESCE(SUM(totalAmount - paidAmount), 0) AS remaining,
        SUM(CASE WHEN status != 'cancelled' AND dueDate IS NOT NULL AND dueDate < DATE('now') AND (totalAmount - paidAmount) > 0
              THEN (totalAmount - paidAmount) ELSE 0 END) AS overdue
      FROM supplier_purchases WHERE supplierId = ?
    `).get(supplierId);
    return totals;
  });
  electron.ipcMain.handle("toggle-supplier-favorite", (_, id) => {
    const current = db.prepare("SELECT isFavorite FROM suppliers WHERE id = ?").get(id);
    const newVal = current?.isFavorite ? 0 : 1;
    db.prepare("UPDATE suppliers SET isFavorite = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(newVal, id);
    return { success: true, isFavorite: !!newVal };
  });
  electron.ipcMain.handle("get-supplier-activity-log", (_, supplierId, limit = 20) => {
    return db.prepare(`
      SELECT * FROM supplier_activity_log WHERE supplierId = ? ORDER BY createdAt DESC LIMIT ?
    `).all(supplierId, limit);
  });
  electron.ipcMain.handle("get-supplier-analytics", (_) => {
    const bizId = getActiveBusinessId();
    const topSuppliers = db.prepare(`
      SELECT s.id, s.supplierName, COALESCE(SUM(sp.totalAmount), 0) AS totalValue,
        COUNT(sp.id) AS purchaseCount, MAX(sp.purchaseDate) AS lastPurchase
      FROM suppliers s
      LEFT JOIN supplier_purchases sp ON sp.supplierId = s.id
      WHERE s.businessId = ? AND s.isActive = 1
      GROUP BY s.id
      HAVING totalValue > 0
      ORDER BY totalValue DESC LIMIT 10
    `).all(bizId);
    const monthlyTrends = db.prepare(`
      SELECT strftime('%Y-%m', purchaseDate) AS month,
        COUNT(*) AS purchaseCount, COALESCE(SUM(totalAmount), 0) AS totalAmount
      FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId
      WHERE s.businessId = ? AND purchaseDate >= DATE('now', '-12 months')
      GROUP BY month ORDER BY month
    `).all(bizId);
    const outstandingBySupplier = db.prepare(`
      SELECT s.supplierName, COALESCE(SUM(sp.totalAmount - sp.paidAmount), 0) AS outstanding
      FROM suppliers s
      LEFT JOIN supplier_purchases sp ON sp.supplierId = s.id
      WHERE s.businessId = ? AND s.isActive = 1
      GROUP BY s.id HAVING outstanding > 0 ORDER BY outstanding DESC
    `).all(bizId);
    const avgPurchase = db.prepare(`
      SELECT COALESCE(AVG(totalAmount), 0) AS avgValue FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId WHERE s.businessId = ?
    `).get(bizId);
    const summary = db.prepare(`
      SELECT
        COUNT(*) AS totalSuppliers,
        SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) AS activeSuppliers,
        COALESCE((SELECT COUNT(*) FROM supplier_purchases sp JOIN suppliers s ON s.id = sp.supplierId WHERE s.businessId = ? AND sp.purchaseDate >= DATE('now', '-30 days')), 0) AS purchasesThisMonth
      FROM suppliers WHERE businessId = ?
    `).get(bizId, bizId);
    return { topSuppliers, monthlyTrends, outstandingBySupplier, avgPurchase: avgPurchase?.avgValue || 0, summary };
  });
  electron.ipcMain.handle("get-supplier-aging-report", () => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT
        s.id AS supplierId, s.supplierName, s.companyName, s.phone,
        SUM(CASE WHEN sp.dueDate >= DATE('now') OR sp.dueDate IS NULL THEN sp.totalAmount - sp.paidAmount ELSE 0 END) AS current_due,
        SUM(CASE WHEN sp.dueDate < DATE('now') AND sp.dueDate >= DATE('now', '-30 days') THEN sp.totalAmount - sp.paidAmount ELSE 0 END) AS days_1_30,
        SUM(CASE WHEN sp.dueDate < DATE('now', '-30 days') AND sp.dueDate >= DATE('now', '-60 days') THEN sp.totalAmount - sp.paidAmount ELSE 0 END) AS days_31_60,
        SUM(CASE WHEN sp.dueDate < DATE('now', '-60 days') AND sp.dueDate >= DATE('now', '-90 days') THEN sp.totalAmount - sp.paidAmount ELSE 0 END) AS days_61_90,
        SUM(CASE WHEN sp.dueDate < DATE('now', '-90 days') THEN sp.totalAmount - sp.paidAmount ELSE 0 END) AS days_over_90,
        SUM(sp.totalAmount - sp.paidAmount) AS total_outstanding
      FROM suppliers s
      JOIN supplier_purchases sp ON sp.supplierId = s.id
      WHERE sp.status != 'cancelled' AND (sp.totalAmount - sp.paidAmount) > 0 AND s.businessId = ?
      GROUP BY s.id
      ORDER BY total_outstanding DESC
    `).all(bizId);
  });
  electron.ipcMain.handle("get-supplier-dashboard-stats", () => {
    const bizId = getActiveBusinessId();
    const stats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM suppliers WHERE businessId = ? AND isActive = 1) AS activeSuppliers,
        (SELECT COUNT(*) FROM suppliers WHERE businessId = ?) AS totalSuppliers,
        (SELECT COALESCE(SUM(totalAmount - paidAmount), 0) FROM supplier_purchases WHERE businessId = ? AND status != 'cancelled') AS outstandingBalance,
        (SELECT COALESCE(SUM(totalAmount), 0) FROM supplier_purchases WHERE businessId = ? AND purchaseDate >= DATE('now', 'start of month')) AS monthPurchases
    `).get(bizId, bizId, bizId, bizId);
    const top = db.prepare(`
      SELECT s.id, s.supplierName, COALESCE(SUM(sp.totalAmount), 0) AS totalValue
      FROM suppliers s
      JOIN supplier_purchases sp ON sp.supplierId = s.id
      WHERE s.businessId = ?
      GROUP BY s.id
      ORDER BY totalValue DESC LIMIT 1
    `).get(bizId);
    const recent = db.prepare(`
      SELECT id, supplierName, companyName, createdAt FROM suppliers
      WHERE businessId = ? ORDER BY createdAt DESC LIMIT 5
    `).all(bizId);
    return { ...stats, topSupplier: top || null, recent };
  });
  electron.ipcMain.handle("get-supplier-monthly-report", () => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT
        strftime('%Y-%m', purchaseDate) AS month,
        COUNT(*) AS purchaseCount,
        SUM(totalAmount) AS totalAmount,
        SUM(paidAmount) AS paidAmount,
        SUM(totalAmount - paidAmount) AS outstanding
      FROM supplier_purchases
      WHERE status != 'cancelled' AND businessId = ?
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `).all(bizId);
  });
  electron.ipcMain.handle("get-top-suppliers", (_, limit = 10) => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT s.id, s.supplierName, s.companyName, s.phone,
        COUNT(sp.id) AS purchaseCount,
        COALESCE(SUM(sp.totalAmount), 0) AS totalValue,
        COALESCE(SUM(sp.paidAmount), 0) AS totalPaid,
        COALESCE(SUM(sp.totalAmount - sp.paidAmount), 0) AS outstanding,
        MAX(sp.purchaseDate) AS lastPurchaseDate
      FROM suppliers s
      LEFT JOIN supplier_purchases sp ON sp.supplierId = s.id
      WHERE s.businessId = ?
      GROUP BY s.id
      HAVING totalValue > 0
      ORDER BY totalValue DESC
      LIMIT ?
    `).all(bizId, limit);
  });
  electron.ipcMain.handle("generate-test-suppliers", (_, count) => {
    if (![100, 1e3, 1e4].includes(count)) throw new Error("Count must be 100, 1000, or 10000");
    const bizId = getActiveBusinessId();
    const cities = ["Addis Ababa", "Dire Dawa", "Hawassa", "Bahir Dar", "Mekelle", "Adama", "Gondar", "Jimma"];
    const countries = ["Ethiopia", "Kenya", "UAE", "China", "Turkey", "India"];
    const methods = ["cash", "bank_transfer", "mobile_money", "check"];
    const statuses = ["active", "inactive"];
    const gen = db.transaction(() => {
      const insert = db.prepare(`
        INSERT INTO suppliers (
          businessId, supplierCode, supplierName, companyName, contactPerson,
          phone, email, city, country, taxNumber, paymentTerms, creditLimit, status, isActive
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);
      const insertPurchase = db.prepare(`
        INSERT INTO supplier_purchases (
          businessId, supplierId, purchaseNumber, purchaseDate,
          totalAmount, paidAmount, dueDate, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertPayment = db.prepare(`
        INSERT INTO supplier_payments (
          businessId, supplierId, purchaseId, paymentDate, amount, paymentMethod
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (let i = 0; i < count; i++) {
        const name = `Test Supplier ${i + 1}`;
        const code = `TSUP-${String(i + 1).padStart(6, "0")}`;
        const status = statuses[i % 8 === 0 ? 1 : 0];
        const supRes = insert.run(
          bizId,
          code,
          name,
          `${name} Co.`,
          `Contact ${i + 1}`,
          `+2519${String(1e7 + i).slice(-8)}`,
          `supplier${i + 1}@test.com`,
          cities[i % cities.length],
          countries[i % countries.length],
          `TAX-${1e3 + i}`,
          ["Net 30", "Net 60", "Cash on Delivery", "Net 15"][i % 4],
          i % 10 * 1e4,
          status
        );
        const supplierId = Number(supRes.lastInsertRowid);
        const purchases = i % 5 + 1;
        for (let p = 0; p < purchases; p++) {
          const total = 1e3 + (i * 13 + p * 7) % 5e4;
          const paid = i % 3 === 0 ? 0 : p % 2 === 0 ? total : total * 0.7;
          const date = new Date(Date.now() - (i + p) * 864e5 * 3).toISOString();
          const dueDate = new Date(Date.now() + (30 - p * 7) * 864e5).toISOString();
          const purRes = insertPurchase.run(
            bizId,
            supplierId,
            `${code}-P${p + 1}`,
            date,
            total,
            paid,
            dueDate,
            paid >= total ? "received" : "pending"
          );
          if (i % 3 === 0 && p === 0) {
            insertPayment.run(
              bizId,
              supplierId,
              Number(purRes.lastInsertRowid),
              date,
              paid,
              methods[i % methods.length]
            );
          }
        }
      }
    });
    gen();
    return { success: true, count };
  });
  electron.ipcMain.handle("clear-test-suppliers", () => {
    const bizId = getActiveBusinessId();
    const result = db.prepare(`DELETE FROM suppliers WHERE businessId = ? AND supplierCode LIKE 'TSUP-%'`).run(bizId);
    return { deleted: result.changes };
  });
  const REAL_FIRST_NAMES = ["Abebe", "Almaz", "Biruk", "Chaltu", "Dawit", "Eden", "Frehiwot", "Girma", "Hana", "Ibrahim", "Jemila", "Kebede", "Lemlem", "Mekdes", "Nigist", "Obsa", "Paschal", "Rahma", "Sisay", "Tigist", "Umer", "Winta", "Yonas", "Zerihun", "Amina", "Bontu", "Daniel", "Eyerusalem", "Fikadu", "Genet", "Hussein", "Ismail", "Jalene", "Keneni", "Lensa", "Mulu", "Nardos", "Oliyad", "Priya", "Selam", "Teshome", "Mahlet", "Birhane", "Tizita", "Mahder", "Biniyam", "Amanuel", "Meron", "Simon", "Yordanos", "Haben", "Samiya", "Addis", "Beki", "Chernet", "Desta", "Elias", "Feven", "Gebre", "Hiwot"];
  const REAL_LAST_NAMES = ["Kebede", "Tadesse", "Wondimu", "Alemu", "Bekele", "Mengistu", "Tesfaye", "Hailu", "Desta", "Fikru", "Girma", "Hunde", "Jemal", "Kassa", "Lemma", "Mamo", "Nigussie", "Obsi", "Petros", "Reda", "Sisay", "Tekle", "Uggaz", "Worku", "Yeshitla", "Zeleke", "Assefa", "Berhe", "Cherkos", "Demeke", "Endale", "Fanta", "Gizaw", "Haile", "Ibrahim", "Kinfu", "Lema", "Mekonnen", "Negash", "Oli", "Asfaw", "Belayneh", "Dagne", "Eshetu", "Fisseha", "Gebremedhin", "Hagos", "Jote", "Kebede", "Legesse", "Mesfin", "Nega", "Shiferaw", "Tamerat", "Woldie"];
  const PRODUCT_PREFIXES = ["Premium", "Organic", "Deluxe", "Standard", "Economy", "Professional", "Natural", "Classic", "Ultra", "Fine"];
  const PRODUCT_TYPES = ["Coffee Beans", "Tea Leaves", "Honey", "Cooking Oil", "Rice", "Wheat Flour", "Sugar", "Spice Mix", "Bar Soap", "Detergent", "Bread", "Butter", "Cheese", "Fruit Juice", "Mineral Water", "Pasta", "Cereal", "Sauce", "Seasoning", "Milk", "Yogurt", "Biscuit", "Chocolate", "Salt", "Pasta", "Lentils", "Spaghetti", "Ketchup", "Jam", "Olive Oil"];
  const PRODUCT_SIZES = ["1kg", "500g", "250g", "2kg", "5kg", "1L", "500ml", "250ml", "2L", "100g", "200g", "50g", "750ml", "3kg", "10kg", "150g", "300g", "4L", "20kg"];
  const CATEGORY_NAMES = ["Electronics", "Clothing & Apparel", "Food & Beverages", "Beverages", "Household", "Personal Care", "Pharmaceuticals", "Office Supplies", "Building Materials", "Agriculture", "Cleaning Supplies", "Sporting Goods", "Books & Media", "Automotive", "Baby Products", "Furniture", "Stationery", "Cosmetics", "Pet Supplies", "Gardening"];
  const SUPPLIER_COMPANIES = ["Ethio Supply Co.", "Global Trading PLC", "Highland Distributors", "Unity Imports", "Sheba Trading", "Habesha Wholesale", "Addis Merchants", "Nile River Trading", "Axum Commercial", "Lalibela Distributors", "Rift Valley Enterprises", "Zemen Trading", "Abay Import Export", "Terara Trading", "Wabi Shebelle Co."];
  const EXPENSE_CATEGORIES = ["Rent", "Utilities - Electric", "Utilities - Water", "Salaries & Wages", "Transportation", "Office Supplies", "Marketing & Ads", "Maintenance", "Insurance", "Taxes", "Communication", "Equipment Lease", "Cleaning Services", "Security Services", "Employee Training", "Software Licenses", "Bank Charges", "Professional Fees", "Stationery", "Refreshments"];
  const CITIES = ["Addis Ababa", "Dire Dawa", "Hawassa", "Bahir Dar", "Mekelle", "Adama", "Gondar", "Jimma", "Dessie", "Shashamane", "Bishoftu", "Arba Minch", "Harar", "Jijiga", "Nekemte", "Debre Markos", "Adigrat", "Wolaita Sodo", "Assosa", "Gambela"];
  const PAYMENT_METHODS = ["cash", "bank_transfer", "mobile_money", "check", "card"];
  const ITEM_UNITS = ["pcs", "kg", "L", "pack", "box", "bottle", "bag", "tin", "carton", "roll"];
  const BATCH_SIZE = 250;
  const randomDate = (daysBack = 365) => {
    const now = Date.now();
    const past = now - daysBack * 864e5;
    return new Date(past + Math.random() * (now - past)).toISOString();
  };
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[randomInt(0, arr.length - 1)];
  electron.ipcMain.handle("generate-test-data", async (event, count) => {
    if (![10, 100, 1e3, 1e4].includes(count)) throw new Error("Count must be 10, 100, or 10000");
    const startTime = Date.now();
    const bizId = getActiveBusinessId();
    const batchId = crypto.randomUUID();
    const phases = [];
    let globalProgress = 0;
    const scale = (factor) => Math.max(1, Math.round(count * factor));
    const phasePlans = [
      { name: "categories", total: Math.min(15, count) },
      { name: "items", total: scale(0.35) },
      { name: "suppliers", total: scale(0.1) },
      { name: "sales", total: scale(0.25) },
      { name: "expenses", total: scale(0.12) },
      { name: "employees", total: scale(0.05) },
      { name: "stock_movements", total: scale(0.15) },
      { name: "notifications", total: scale(0.06) }
    ];
    const grandTotal = phasePlans.reduce((s, p) => s + p.total, 0);
    db.exec(`
      CREATE TABLE IF NOT EXISTS test_data_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id TEXT NOT NULL,
        table_name TEXT NOT NULL,
        row_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_test_data_tags_batch ON test_data_tags(batch_id);
    `);
    const tagStmt = db.prepare("INSERT INTO test_data_tags (batch_id, table_name, row_id) VALUES (?, ?, ?)");
    const sendProgress = (phase, current, total, message) => {
      const soFar = globalProgress + Math.min(current, total);
      const pct = grandTotal > 0 ? Math.min(100, Math.round(soFar / grandTotal * 100)) : 0;
      try {
        event.sender.send("test-data-progress", { phase, current, total, message, totalCreated: soFar, overallPercent: pct });
      } catch (_) {
      }
    };
    const runBatch = async (total, phaseName, fn) => {
      if (total === 0) return 0;
      const ts = Date.now();
      let inserted = 0;
      for (let s = 0; s < total; s += BATCH_SIZE) {
        const e = Math.min(s + BATCH_SIZE, total);
        db.transaction(() => fn(s, e))();
        inserted += e - s;
        globalProgress += e - s;
        sendProgress(phaseName, inserted, total, `Generating ${phaseName}...`);
        await new Promise((resolve) => setImmediate(resolve));
      }
      phases.push({ name: phaseName, count: inserted, time: Date.now() - ts });
      return inserted;
    };
    let catIds = [];
    {
      const catTotal = phasePlans[0].total;
      const insert = db.prepare("INSERT INTO categories (businessId, name, icon, isCustom, uuid) VALUES (?, ?, ?, 1, ?)");
      const tx = db.transaction(() => {
        for (let i = 0; i < catTotal; i++) {
          const name = CATEGORY_NAMES[i % CATEGORY_NAMES.length];
          const r = insert.run(bizId, name, pick(["Box", "Tag", "ShoppingBag", "Wrench", "Heart", "Star", "Book", "Monitor", "Shirt", "Home"]), crypto.randomUUID());
          catIds.push(Number(r.lastInsertRowid));
          tagStmt.run(batchId, "categories", Number(r.lastInsertRowid));
        }
      });
      tx();
      globalProgress += catTotal;
      phases.push({ name: "categories", count: catTotal, time: 0 });
    }
    const itemIds = [];
    {
      const total = phasePlans[1].total;
      const insert = db.prepare(`INSERT INTO items (businessId, name, categoryId, companyName, purchaseUnit, baseUnit, unitsPerPack, totalPackQuantity, totalBaseQuantity, packPurchasePrice, basePurchasePrice, baseSellingPrice, packSellingPrice, expiryDate, notes, createdAt, uuid, updated_at, is_deleted, is_synced) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,0,1)`);
      await runBatch(total, "items", (s, e) => {
        for (let i = s; i < e; i++) {
          const catId = catIds[i % catIds.length];
          const name = `${pick(PRODUCT_PREFIXES)} ${pick(PRODUCT_TYPES)} ${pick(PRODUCT_SIZES)}`;
          const unit = pick(ITEM_UNITS);
          const qty = count <= 100 ? randomInt(10, 500) : randomInt(0, 1e3);
          const bp = randomInt(10, 2e3);
          const sp = bp + randomInt(5, 500);
          const packQty = randomInt(1, 20);
          const expDays = i % 10 === 0 ? -randomInt(1, 60) : randomInt(30, 400);
          const expDate = new Date(Date.now() + expDays * 864e5).toISOString();
          const r = insert.run(bizId, name, catId, pick(SUPPLIER_COMPANIES), unit, unit, randomInt(1, 24), packQty, qty, bp * randomInt(1, 10), bp, sp, sp * randomInt(1, 10), expDate, `Generated test item ${i + 1}`, randomDate(), crypto.randomUUID());
          const id = Number(r.lastInsertRowid);
          itemIds.push(id);
          tagStmt.run(batchId, "items", id);
        }
      });
    }
    const supplierIds = [];
    {
      const total = phasePlans[2].total;
      const insert = db.prepare(`INSERT INTO suppliers (businessId, supplierCode, supplierName, companyName, contactPerson, phone, email, city, country, taxNumber, paymentTerms, creditLimit, status, isActive, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)`);
      runBatch(total, "suppliers", (s, e) => {
        for (let i = s; i < e; i++) {
          const name = `Test Supplier ${i + 1}`;
          const code = `TST-SUP-${String(i + 1).padStart(6, "0")}`;
          const contact = `${pick(REAL_FIRST_NAMES)} ${pick(REAL_LAST_NAMES)}`;
          const r = insert.run(bizId, code, name, `${name} ${pick(["Trading", "PLC", "Co.", "Enterprise", "Import"])}, ${pick(SUPPLIER_COMPANIES)}`, contact, `+2519${String(9e7 + i).slice(-8)}`, `supplier${i + 1}@test.com`, pick(CITIES), pick(["Ethiopia", "Kenya", "UAE", "China", "India"]), `TAX-${1e4 + i}`, pick(["Net 30", "Net 60", "Cash on Delivery", "Net 15"]), i % 10 * 5e3, pick(["active", "active", "active", "inactive"]), randomDate());
          supplierIds.push(Number(r.lastInsertRowid));
          tagStmt.run(batchId, "suppliers", Number(r.lastInsertRowid));
        }
      });
    }
    const customerNames = [];
    {
      const total = phasePlans[3].total;
      for (let i = 0; i < Math.min(count, 200); i++) {
        if (customerNames.length < Math.min(count, 200)) customerNames.push(`${pick(REAL_FIRST_NAMES)} ${pick(REAL_LAST_NAMES)}`);
      }
      const insert = db.prepare(`INSERT INTO sales (businessId, itemId, quantity, unit, unitType, totalPrice, paymentMethod, paymentStatus, customerName, customerPhone, dueDate, paidAmount, createdBy, createdAt, uuid, updated_at, is_deleted, is_synced) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,0,1)`);
      await runBatch(total, "sales", (s, e) => {
        for (let i = s; i < e; i++) {
          const itemId = pick(itemIds);
          const qty = randomInt(1, 10);
          const unitPrice = randomInt(15, 3e3);
          const totalPrice = qty * unitPrice;
          const isCredit = i % 4 === 0;
          const paidAmount = isCredit ? randomInt(0, Math.floor(totalPrice * 0.5)) : totalPrice;
          const payStatus = isCredit ? "credit" : "paid";
          const custName = pick(customerNames);
          const r = insert.run(bizId, itemId, qty, pick(ITEM_UNITS), "pcs", totalPrice, pick(PAYMENT_METHODS), payStatus, custName, `+2519${String(7e7 + i).slice(-8)}`, isCredit ? new Date(Date.now() + randomInt(15, 90) * 864e5).toISOString() : null, paidAmount, "Test Data Generator", randomDate(365), crypto.randomUUID());
          tagStmt.run(batchId, "sales", Number(r.lastInsertRowid));
        }
      });
    }
    {
      const total = phasePlans[4].total;
      const insert = db.prepare(`INSERT INTO expenses (businessId, name, amount, category, date, createdAt, uuid, updated_at, is_deleted, is_synced) VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP,0,1)`);
      await runBatch(total, "expenses", (s, e) => {
        for (let i = s; i < e; i++) {
          const cat = pick(EXPENSE_CATEGORIES);
          const amount = randomInt(50, 5e4);
          const d = randomDate(365);
          insert.run(bizId, `${cat} - ${cat} Payment ${i + 1}`, amount, cat, d, d, crypto.randomUUID());
        }
      });
    }
    const employeeIds = [];
    {
      const total = phasePlans[5].total;
      const insert = db.prepare(`INSERT INTO employees (employeeCode, firstName, lastName, phone, email, department, isActive, hireDate, createdAt, updatedAt) VALUES (?,?,?,?,?,?,1,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
      await runBatch(total, "employees", (s, e) => {
        for (let i = s; i < e; i++) {
          const fn = pick(REAL_FIRST_NAMES);
          const ln = pick(REAL_LAST_NAMES);
          const dept = pick(["Sales", "Inventory", "Accounting", "HR", "Management", "Logistics", "Customer Service", "IT"]);
          const code = `TST-EMP-${String(i + 1).padStart(5, "0")}`;
          const r = insert.run(code, fn, ln, `+2519${String(8e7 + i).slice(-8)}`, `${fn.toLowerCase()}.${ln.toLowerCase()}@test.com`, dept, randomDate(730));
          employeeIds.push(Number(r.lastInsertRowid));
          tagStmt.run(batchId, "employees", Number(r.lastInsertRowid));
        }
      });
    }
    {
      const total = phasePlans[6].total;
      const insert = db.prepare(`INSERT INTO stock_movements (itemId, type, quantity, referenceType, notes, createdAt) VALUES (?,?,?,?,?,?)`);
      await runBatch(total, "stock_movements", (s, e) => {
        for (let i = s; i < e; i++) {
          const itemId = pick(itemIds);
          const qty = randomInt(1, 100);
          const type = pick(["in", "out", "in", "in", "adjustment"]);
          const refType = type === "in" ? "purchase" : "sale";
          insert.run(itemId, type, qty, refType, `Test ${type} movement ${i + 1}`, randomDate(365));
        }
      });
    }
    {
      const total = phasePlans[7].total;
      const insert = db.prepare(`INSERT INTO notifications (businessId, title, message, type, isRead, category, severity, channels, createdAt) VALUES (?,?,?,?,?,?,?,?,?)`);
      await runBatch(total, "notifications", (s, e) => {
        for (let i = s; i < e; i++) {
          const cat = pick(["inventory", "sales", "system", "employees", "customers", "suppliers"]);
          const sev = pick(["info", "info", "info", "warning", "error"]);
          insert.run(bizId, `Test Notification ${i + 1}`, `This is generated test notification #${i + 1} in category ${cat}`, cat, i % 3 === 0 ? 1 : 0, cat, sev, "in_app", randomDate(365));
        }
      });
    }
    const duration = Date.now() - startTime;
    return { success: true, totalCreated: globalProgress, duration, phases };
  });
  electron.ipcMain.handle("clear-test-data", () => {
    const ts = Date.now();
    const tables = ["notifications", "stock_movements", "employees", "expenses", "sales", "suppliers", "items", "categories"];
    const deletions = {};
    const tags = db.prepare("SELECT DISTINCT table_name, row_id FROM test_data_tags").all();
    const grouped = {};
    for (const t of tags) {
      if (!grouped[t.table_name]) grouped[t.table_name] = [];
      grouped[t.table_name].push(t.row_id);
    }
    const delTx = db.transaction(() => {
      for (const table of tables) {
        const ids = grouped[table];
        if (!ids || ids.length === 0) continue;
        for (let i = 0; i < ids.length; i += 500) {
          const chunk = ids.slice(i, i + 500);
          const placeholders = chunk.map(() => "?").join(",");
          const r = db.prepare(`DELETE FROM ${table} WHERE id IN (${placeholders})`).run(...chunk);
          deletions[table] = (deletions[table] || 0) + r.changes;
        }
      }
      db.prepare("DELETE FROM test_data_tags").run();
    });
    delTx();
    const totalDeleted = Object.values(deletions).reduce((s, v) => s + v, 0);
    return { deleted: totalDeleted, duration: Date.now() - ts, details: deletions };
  });
  electron.ipcMain.handle("measure-performance", () => {
    const results = {};
    let t;
    t = Date.now();
    db.prepare("SELECT COUNT(*) as c FROM items").get();
    results.itemsCount = Date.now() - t;
    t = Date.now();
    db.prepare("SELECT COUNT(*) as c FROM sales").get();
    results.salesCount = Date.now() - t;
    t = Date.now();
    db.prepare("SELECT DISTINCT customerName FROM sales LIMIT 100").all();
    results.customersQuery = Date.now() - t;
    t = Date.now();
    db.prepare("SELECT COUNT(*) as c FROM suppliers").get();
    results.suppliersCount = Date.now() - t;
    t = Date.now();
    db.prepare("SELECT COUNT(*) as c FROM categories").get();
    results.categoriesCount = Date.now() - t;
    t = Date.now();
    db.prepare("SELECT COUNT(*) as c FROM expenses").get();
    results.expensesCount = Date.now() - t;
    t = Date.now();
    db.prepare("SELECT COUNT(*) as c FROM employees").get();
    results.employeesCount = Date.now() - t;
    t = Date.now();
    db.prepare("SELECT * FROM items ORDER BY id DESC LIMIT 50").all();
    results.itemsListQuery = Date.now() - t;
    t = Date.now();
    db.prepare(`
      SELECT s.*, i.name as itemName 
      FROM sales s LEFT JOIN items i ON s.itemId = i.id 
      ORDER BY s.id DESC LIMIT 50
    `).all();
    results.salesListQuery = Date.now() - t;
    t = Date.now();
    db.prepare(`
      SELECT COALESCE(SUM(totalPrice),0) as rev, COALESCE(SUM(paidAmount),0) as collected,
        COUNT(*) as txns, COUNT(DISTINCT customerName) as customers
      FROM sales WHERE createdAt >= date('now','-30 days')
    `).get();
    results.dashboardAggQuery = Date.now() - t;
    return results;
  });
  electron.ipcMain.handle("get-draft-sales", () => {
    const bizId = getActiveBusinessId();
    return db.prepare("SELECT * FROM draft_sales WHERE businessId = ? ORDER BY createdAt DESC").all(bizId);
  });
  electron.ipcMain.handle("get-draft-sale", (_, id) => {
    return db.prepare("SELECT * FROM draft_sales WHERE id = ?").get(id);
  });
  electron.ipcMain.handle("save-draft-sale", (_, data) => {
    const bizId = getActiveBusinessId();
    if (data.id) {
      db.prepare("UPDATE draft_sales SET items = ?, customerName = ?, customerPhone = ?, discount = ?, vat = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(JSON.stringify(data.items), data.customerName || null, data.customerPhone || null, data.discount || 0, data.vat || 0, data.notes || null, data.id, bizId);
      return { success: true };
    }
    const r = db.prepare("INSERT INTO draft_sales (businessId, items, customerName, customerPhone, discount, vat, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").run(bizId, JSON.stringify(data.items), data.customerName || null, data.customerPhone || null, data.discount || 0, data.vat || 0, data.notes || null);
    return { success: true, id: r.lastInsertRowid };
  });
  electron.ipcMain.handle("delete-draft-sale", (_, id) => {
    const bizId = getActiveBusinessId();
    return db.prepare("DELETE FROM draft_sales WHERE id = ? AND businessId = ?").run(id, bizId);
  });
  electron.ipcMain.handle("get-contacts", (_, options) => {
    const bizId = getActiveBusinessId();
    let q = "SELECT * FROM contacts WHERE businessId = ?";
    const params = [bizId];
    if (options?.category) {
      q += " AND category = ?";
      params.push(options.category);
    }
    q += " ORDER BY name ASC";
    return db.prepare(q).all(...params);
  });
  electron.ipcMain.handle("insert-contact", (_, data) => {
    const bizId = getActiveBusinessId();
    const r = db.prepare("INSERT INTO contacts (businessId, name, phone, category, subCategory, notes) VALUES (?, ?, ?, ?, ?, ?)").run(bizId, data.name, data.phone, data.category || "other", data.subCategory || null, data.notes || null);
    return { success: true, id: r.lastInsertRowid };
  });
  electron.ipcMain.handle("update-contact", (_, id, data) => {
    const bizId = getActiveBusinessId();
    db.prepare("UPDATE contacts SET name = ?, phone = ?, category = ?, subCategory = ?, notes = ? WHERE id = ? AND businessId = ?").run(data.name, data.phone, data.category || "other", data.subCategory || null, data.notes || null, id, bizId);
    return { success: true };
  });
  electron.ipcMain.handle("delete-contact", (_, id) => {
    const bizId = getActiveBusinessId();
    db.prepare("DELETE FROM contacts WHERE id = ? AND businessId = ?").run(id, bizId);
    return { success: true };
  });
  electron.ipcMain.handle("get-budgets", (_, options) => {
    const bizId = getActiveBusinessId();
    let q = "SELECT * FROM budgets WHERE businessId = ?";
    const params = [bizId];
    if (options?.period) {
      q += " AND period = ?";
      params.push(options.period);
    }
    if (options?.month) {
      q += " AND month = ?";
      params.push(options.month);
    }
    if (options?.year) {
      q += " AND year = ?";
      params.push(options.year);
    }
    if (options?.budgetType) {
      q += " AND budgetType = ?";
      params.push(options.budgetType);
    }
    if (options?.category) {
      q += " AND category = ?";
      params.push(options.category);
    }
    q += " ORDER BY category ASC";
    const budgets = db.prepare(q).all(...params);
    const targetMonth = options?.month || String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0");
    const targetYear = options?.year || String((/* @__PURE__ */ new Date()).getFullYear());
    const startDate = `${targetYear}-${targetMonth}-01`;
    const endDate = new Date(parseInt(targetYear), parseInt(targetMonth), 0).toISOString().split("T")[0];
    const expenses = db.prepare(
      "SELECT category, SUM(amount) as spent FROM expenses WHERE businessId = ? AND date >= ? AND date <= ? AND is_deleted = 0 GROUP BY category"
    ).all(bizId, startDate, endDate);
    const spentMap = {};
    for (const e of expenses) {
      spentMap[e.category] = e.spent;
    }
    return budgets.map((b) => ({
      ...b,
      spent: spentMap[b.category] || 0,
      remaining: b.amount - (spentMap[b.category] || 0),
      usagePercent: b.amount > 0 ? Math.round((spentMap[b.category] || 0) / b.amount * 100) : 0
    }));
  });
  electron.ipcMain.handle("set-budget", (_, data) => {
    const bizId = getActiveBusinessId();
    const existing = db.prepare(
      "SELECT id FROM budgets WHERE businessId = ? AND category = ? AND period = ? AND budgetType = ? AND (month = ? OR month IS NULL) AND (year = ? OR year IS NULL)"
    ).get(bizId, data.category, data.period || "monthly", data.budgetType || "business", data.month || null, data.year || null);
    if (existing) {
      db.prepare("UPDATE budgets SET amount = ?, notes = ?, isRecurring = ?, referenceName = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(data.amount, data.notes || null, data.isRecurring ? 1 : 0, data.referenceName || null, existing.id);
      return { success: true, id: existing.id };
    }
    const r = db.prepare(
      "INSERT INTO budgets (businessId, category, amount, period, month, year, budgetType, referenceName, isRecurring, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(bizId, data.category, data.amount, data.period || "monthly", data.month || null, data.year || null, data.budgetType || "business", data.referenceName || null, data.isRecurring ? 1 : 0, data.notes || null);
    return { success: true, id: r.lastInsertRowid };
  });
  electron.ipcMain.handle("delete-budget", (_, id) => {
    const bizId = getActiveBusinessId();
    return db.prepare("DELETE FROM budgets WHERE id = ? AND businessId = ?").run(id, bizId);
  });
  electron.ipcMain.handle("get-budget-adjustments", (_, budgetId) => {
    return db.prepare("SELECT * FROM budget_adjustments WHERE budgetId = ? ORDER BY createdAt DESC").all(budgetId);
  });
  electron.ipcMain.handle("create-budget-adjustment", (_, data) => {
    const bizId = getActiveBusinessId();
    const r = db.prepare(
      "INSERT INTO budget_adjustments (budgetId, businessId, previousAmount, newAmount, reason, status, requestedBy) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(data.budgetId, bizId, data.previousAmount, data.newAmount, data.reason, data.status || "pending", data.requestedBy || null);
    return { success: true, id: r.lastInsertRowid };
  });
  electron.ipcMain.handle("approve-budget-adjustment", (_, id, approvedBy) => {
    const adj = db.prepare("SELECT * FROM budget_adjustments WHERE id = ?").get(id);
    if (!adj) return { success: false, error: "Adjustment not found" };
    db.prepare("UPDATE budget_adjustments SET status = 'approved', approvedBy = ?, approvedAt = CURRENT_TIMESTAMP WHERE id = ?").run(approvedBy, id);
    db.prepare("UPDATE budgets SET amount = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(adj.newAmount, adj.budgetId);
    return { success: true };
  });
  electron.ipcMain.handle("duplicate-budget", (_, fromData, toMonth, toYear) => {
    const bizId = getActiveBusinessId();
    const sourceBudgets = db.prepare(
      "SELECT * FROM budgets WHERE businessId = ? AND month = ? AND year = ?"
    ).all(bizId, fromData.month, fromData.year);
    let count = 0;
    for (const b of sourceBudgets) {
      const existing = db.prepare(
        "SELECT id FROM budgets WHERE businessId = ? AND category = ? AND period = ? AND month = ? AND year = ? AND budgetType = ?"
      ).get(bizId, b.category, b.period, toMonth, toYear, b.budgetType);
      if (!existing) {
        db.prepare(
          "INSERT INTO budgets (businessId, category, amount, period, month, year, budgetType, referenceName, isRecurring, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).run(bizId, b.category, b.amount, b.period, toMonth, toYear, b.budgetType, b.referenceName, b.isRecurring, b.notes);
        count++;
      }
    }
    return { success: true, count };
  });
  electron.ipcMain.handle("get-budget-alerts", (_, options) => {
    const bizId = getActiveBusinessId();
    let q = "SELECT * FROM budget_alerts WHERE businessId = ?";
    const params = [bizId];
    if (options?.acknowledged !== void 0) {
      q += " AND acknowledged = ?";
      params.push(options.acknowledged ? 1 : 0);
    }
    if (options?.alertType) {
      q += " AND alertType = ?";
      params.push(options.alertType);
    }
    q += " ORDER BY createdAt DESC";
    if (options?.limit) {
      q += " LIMIT ?";
      params.push(options.limit);
    }
    return db.prepare(q).all(...params);
  });
  electron.ipcMain.handle("acknowledge-budget-alert", (_, id) => {
    db.prepare("UPDATE budget_alerts SET acknowledged = 1 WHERE id = ?").run(id);
    return { success: true };
  });
  electron.ipcMain.handle("get-budget-report", (_, options) => {
    const bizId = getActiveBusinessId();
    const month = options?.month || String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0");
    const year = options?.year || String((/* @__PURE__ */ new Date()).getFullYear());
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split("T")[0];
    const budgets = db.prepare("SELECT * FROM budgets WHERE businessId = ? AND (month = ? OR month IS NULL) AND (year = ? OR year IS NULL)").all(bizId, month, year);
    const expenses = db.prepare("SELECT category, SUM(amount) as spent FROM expenses WHERE businessId = ? AND date >= ? AND date <= ? AND is_deleted = 0 GROUP BY category").all(bizId, startDate, endDate);
    const totalExpenses = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE businessId = ? AND date >= ? AND date <= ? AND is_deleted = 0").get(bizId, startDate, endDate);
    const totalPlanned = budgets.reduce((s, b) => s + b.amount, 0);
    const totalSpent = totalExpenses?.total || 0;
    const spentMap = {};
    for (const e of expenses) {
      spentMap[e.category] = e.spent;
    }
    const categories = budgets.map((b) => ({
      category: b.category,
      planned: b.amount,
      actual: spentMap[b.category] || 0,
      remaining: b.amount - (spentMap[b.category] || 0),
      usagePercent: b.amount > 0 ? Math.round((spentMap[b.category] || 0) / b.amount * 100) : 0,
      status: (spentMap[b.category] || 0) > b.amount ? "exceeded" : (spentMap[b.category] || 0) > b.amount * 0.8 ? "warning" : "ok"
    }));
    return {
      month,
      year,
      totalPlanned,
      totalSpent,
      remaining: totalPlanned - totalSpent,
      usagePercent: totalPlanned > 0 ? Math.round(totalSpent / totalPlanned * 100) : 0,
      categories,
      health: totalPlanned > 0 ? totalSpent > totalPlanned ? "critical" : totalSpent > totalPlanned * 0.8 ? "warning" : "healthy" : "healthy"
    };
  });
  electron.ipcMain.handle("get-budget-forecast", (_, options) => {
    const bizId = getActiveBusinessId();
    const months = options?.months || 3;
    const now = /* @__PURE__ */ new Date();
    const forecasts = [];
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split("T")[0];
    const avgSpending = db.prepare(
      "SELECT category, AVG(monthly) as avgMonthly FROM (SELECT category, strftime('%Y-%m', date) as ym, SUM(amount) as monthly FROM expenses WHERE businessId = ? AND date >= ? AND is_deleted = 0 GROUP BY category, ym) GROUP BY category"
    ).all(bizId, sixMonthsAgo);
    for (let i = 1; i <= months; i++) {
      const forecastMonth = now.getMonth() + i;
      const forecastYear = now.getFullYear() + Math.floor(forecastMonth / 12);
      const m = String(forecastMonth % 12 + 1).padStart(2, "0");
      const y = String(forecastYear);
      const budgets = db.prepare("SELECT SUM(amount) as total FROM budgets WHERE businessId = ? AND (month = ? OR month IS NULL) AND (year = ? OR year IS NULL)").get(bizId, m, y);
      const estimatedSpend = avgSpending.reduce((s, a) => s + a.avgMonthly, 0);
      forecasts.push({
        month: m,
        year: y,
        label: `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][parseInt(m) - 1]} ${y}`,
        planned: budgets?.total || 0,
        estimated: Math.round(estimatedSpend)
      });
    }
    return forecasts;
  });
  electron.ipcMain.handle("get-supplier-price-checks", (_, supplierId) => {
    const bizId = getActiveBusinessId();
    let q = `SELECT spc.*, s.name as supplierName, i.name as itemName 
      FROM supplier_price_checks spc 
      LEFT JOIN suppliers s ON spc.supplierId = s.id 
      LEFT JOIN items i ON spc.itemId = i.id 
      WHERE spc.businessId = ?`;
    const params = [bizId];
    if (supplierId) {
      q += " AND spc.supplierId = ?";
      params.push(supplierId);
    }
    q += " ORDER BY spc.nextCheck ASC";
    return db.prepare(q).all(...params);
  });
  electron.ipcMain.handle("save-supplier-price-check", (_, data) => {
    const bizId = getActiveBusinessId();
    const nextCheck = data.nextCheck || new Date(Date.now() + 7 * 864e5).toISOString();
    if (data.id) {
      db.prepare("UPDATE supplier_price_checks SET supplierId = ?, itemId = ?, frequency = ?, nextCheck = ?, notes = ?, active = ? WHERE id = ? AND businessId = ?").run(data.supplierId, data.itemId || null, data.frequency || "weekly", nextCheck, data.notes || null, data.active ?? 1, data.id, bizId);
      return { success: true };
    }
    const r = db.prepare("INSERT INTO supplier_price_checks (businessId, supplierId, itemId, frequency, lastChecked, nextCheck, notes, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(bizId, data.supplierId, data.itemId || null, data.frequency || "weekly", data.lastChecked || null, nextCheck, data.notes || null, data.active ?? 1);
    return { success: true, id: r.lastInsertRowid };
  });
  electron.ipcMain.handle("delete-supplier-price-check", (_, id) => {
    const bizId = getActiveBusinessId();
    return db.prepare("DELETE FROM supplier_price_checks WHERE id = ? AND businessId = ?").run(id, bizId);
  });
  electron.ipcMain.handle("get-quiet-hours", () => {
    const bizId = getActiveBusinessId();
    return db.prepare("SELECT * FROM notification_quiet_hours WHERE businessId = ?").all(bizId);
  });
  electron.ipcMain.handle("set-quiet-hours", (_, data) => {
    const bizId = getActiveBusinessId();
    const existing = db.prepare("SELECT id FROM notification_quiet_hours WHERE businessId = ?").get(bizId);
    if (existing) {
      db.prepare("UPDATE notification_quiet_hours SET startTime = ?, endTime = ?, active = ? WHERE id = ?").run(data.startTime, data.endTime, data.active ?? 1, existing.id);
      return { success: true };
    }
    const r = db.prepare("INSERT INTO notification_quiet_hours (businessId, startTime, endTime, active) VALUES (?, ?, ?, ?)").run(bizId, data.startTime, data.endTime, data.active ?? 1);
    return { success: true, id: r.lastInsertRowid };
  });
  electron.ipcMain.handle("delete-quiet-hours", () => {
    const bizId = getActiveBusinessId();
    return db.prepare("DELETE FROM notification_quiet_hours WHERE businessId = ?").run(bizId);
  });
  electron.ipcMain.handle("get-database-size", () => {
    try {
      const size = fs.statSync(db.name).size;
      return size;
    } catch {
      return 0;
    }
  });
  function escapeHtml(s) {
    const str = String(s ?? "");
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  electron.ipcMain.handle("print-receipt", async (_e, sale) => {
    try {
      const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt</title>
  <style>
    body { font-family: 'Courier New', 'Noto Sans Ethiopic', 'Abyssinica SIL', 'Nyala', 'Segoe UI Historic', monospace; font-size: 12px; margin: 0; padding: 10px; width: 80mm; }
    h1 { text-align: center; font-size: 16px; margin: 0 0 5px; }
    h2 { text-align: center; font-size: 12px; margin: 0 0 10px; color: #555; }
    .divider { border-top: 1px dashed #000; margin: 5px 0; }
    .row { display: flex; justify-content: space-between; }
    .total { font-weight: bold; font-size: 14px; }
    .footer { text-align: center; font-size: 10px; color: #888; margin-top: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 2px 0; }
    th { border-bottom: 1px solid #000; }
    .text-right { text-align: right; }
  </style>
</head>
<body>
  <h1>RECEIPT</h1>
  <h2>#REC-${escapeHtml(sale.id)}</h2>
  <div class="divider"></div>
  <div class="row"><span>Date:</span><span>${escapeHtml(new Date(sale.createdAt).toLocaleString())}</span></div>
  <div class="row"><span>Customer:</span><span>${escapeHtml(sale.customerName) || "Walk-in"}</span></div>
  ${sale.customerPhone ? `<div class="row"><span>Phone:</span><span>${escapeHtml(sale.customerPhone)}</span></div>` : ""}
  <div class="divider"></div>
  <table>
    <tr><th>Item</th><th class="text-right">Qty</th><th class="text-right">Price</th><th class="text-right">Total</th></tr>
    <tr>
      <td>${escapeHtml(sale.itemName)}</td>
      <td class="text-right">${escapeHtml(sale.quantity)}</td>
      <td class="text-right">${escapeHtml((sale.totalPrice / sale.quantity).toFixed(2))}</td>
      <td class="text-right">${escapeHtml(sale.totalPrice.toFixed(2))}</td>
    </tr>
  </table>
  <div class="divider"></div>
  <div class="row total"><span>Total:</span><span>${escapeHtml(sale.totalPrice.toFixed(2))}</span></div>
  <div class="row"><span>Payment:</span><span>${escapeHtml(sale.paymentMethod)}</span></div>
  <div class="row"><span>Paid:</span><span>${escapeHtml((sale.paidAmount || sale.totalPrice).toFixed(2))}</span></div>
  ${sale.paymentStatus === "Debt" ? `<div class="row"><span>Due:</span><span>${escapeHtml((sale.totalPrice - (sale.paidAmount || 0)).toFixed(2))}</span></div>` : ""}
  <div class="footer">Thank you for your business!</div>
</body>
</html>`;
      const printWindow = new electron.BrowserWindow({ show: false, width: 400, height: 600, webPreferences: { nodeIntegration: false, contextIsolation: true } });
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(receiptHtml)}`);
      printWindow.webContents.on("did-finish-load", () => {
        printWindow.webContents.print({}, () => printWindow.close());
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  const isDevBackup = !electron.app.isPackaged;
  const dbDir2 = isDevBackup ? path.join(process.cwd(), "db") : path.join(electron.app.getPath("userData"), "db");
  const backupDir = path.join(dbDir2, "backups");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  electron.ipcMain.handle("create-backup", async () => {
    requirePermission("settings.backup");
    try {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      const backupName = `shega-backup-${timestamp}.db`;
      const backupPath = path.join(backupDir, backupName);
      fs.copyFileSync(db.name, backupPath);
      const size = fs.statSync(backupPath).size;
      return { success: true, name: backupName, size, path: backupPath };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("list-backups", async () => {
    try {
      if (!fs.existsSync(backupDir)) return [];
      const files = fs.readdirSync(backupDir).filter((f) => f.endsWith(".db")).sort().reverse();
      return files.map((name) => {
        const fullPath = path.join(backupDir, name);
        const stats = fs.statSync(fullPath);
        return { name, size: stats.size, createdAt: stats.birthtime.toISOString(), path: fullPath };
      });
    } catch {
      return [];
    }
  });
  electron.ipcMain.handle("restore-backup", async (_e, backupName) => {
    requirePermission("settings.backup");
    try {
      const safeName = path.basename(backupName);
      const backupPath = path.join(backupDir, safeName);
      if (!fs.existsSync(backupPath)) return { success: false, error: "Backup file not found" };
      fs.copyFileSync(backupPath, db.name);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("delete-backup", async (_e, backupName) => {
    requirePermission("settings.backup");
    try {
      const safeName = path.basename(backupName);
      const backupPath = path.join(backupDir, safeName);
      if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("open-external", (_event, url) => {
    electron.shell.openExternal(url);
  });
  electron.ipcMain.handle("get-supplier-report-summary", () => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT
        s.id, s.supplierName, s.companyName, s.status, s.isActive,
        COALESCE(sp.totalPurchases, 0) AS totalPurchases,
        COALESCE(sp.totalPaid, 0) AS totalPayments,
        COALESCE(sp.totalPurchases - sp.totalPaid, 0) AS outstandingBalance
      FROM suppliers s
      LEFT JOIN (
        SELECT supplierId,
          SUM(totalAmount) AS totalPurchases,
          SUM(paidAmount) AS totalPaid
        FROM supplier_purchases
        WHERE status != 'cancelled'
        GROUP BY supplierId
      ) sp ON sp.supplierId = s.id
      WHERE s.businessId = ?
      ORDER BY s.supplierName
    `).all(bizId);
  });
  electron.ipcMain.handle("get-supplier-transaction-report", (_, options = {}) => {
    const bizId = getActiveBusinessId();
    const limit = options.limit ?? 100;
    const offset = options.offset ?? 0;
    const params = [bizId];
    let where = "s.businessId = ?";
    if (options.supplierId) {
      where += " AND sp.supplierId = ?";
      params.push(options.supplierId);
    }
    if (options.startDate) {
      where += " AND sp.purchaseDate >= ?";
      params.push(options.startDate);
    }
    if (options.endDate) {
      where += " AND sp.purchaseDate <= ?";
      params.push(options.endDate);
    }
    const rows = db.prepare(`
      SELECT sp.id, sp.purchaseNumber, sp.purchaseDate, sp.totalAmount, sp.paidAmount,
        (sp.totalAmount - sp.paidAmount) AS remainingBalance, sp.status, sp.dueDate,
        s.supplierName, s.companyName,
        (SELECT COUNT(*) FROM supplier_purchase_items WHERE purchaseId = sp.id) AS itemCount
      FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId
      WHERE ${where} AND sp.status != 'cancelled'
      ORDER BY sp.purchaseDate DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    const total = db.prepare(`SELECT COUNT(*) AS c FROM supplier_purchases sp JOIN suppliers s ON s.id = sp.supplierId WHERE ${where} AND sp.status != 'cancelled'`).get(...params).c;
    const payments = db.prepare(`
      SELECT pay.id, pay.paymentDate, pay.amount, pay.paymentMethod, pay.referenceNumber, pay.notes,
        sp.purchaseNumber, s.supplierName
      FROM supplier_payments pay
      JOIN supplier_purchases sp ON sp.id = pay.purchaseId
      JOIN suppliers s ON s.id = pay.supplierId
      WHERE s.businessId = ?
      ORDER BY pay.paymentDate DESC
      LIMIT ?
    `).all(bizId, limit);
    return { rows, total, payments };
  });
  electron.ipcMain.handle("get-inventory-by-supplier-report", () => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT
        s.id AS supplierId, s.supplierName, s.companyName,
        COUNT(DISTINCT i.id) AS productCount,
        COALESCE(SUM(i.totalBaseQuantity), 0) AS totalStockQuantity,
        COALESCE(SUM(i.totalBaseQuantity * i.basePurchasePrice), 0) AS inventoryValue,
        MAX(i.lastPurchaseDate) AS lastSupplyDate
      FROM suppliers s
      LEFT JOIN items i ON i.supplierId = s.id AND i.businessId = s.businessId AND i.is_deleted = 0
      WHERE s.businessId = ?
      GROUP BY s.id
      ORDER BY inventoryValue DESC
    `).all(bizId);
  });
  electron.ipcMain.handle("get-supplier-unpaid-orders", () => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT sp.id, sp.purchaseNumber, sp.purchaseDate, sp.totalAmount, sp.paidAmount,
        (sp.totalAmount - sp.paidAmount) AS remainingBalance, sp.dueDate, sp.status,
        s.supplierName, s.companyName, s.phone
      FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId
      WHERE s.businessId = ?
        AND sp.status != 'cancelled'
        AND (sp.totalAmount - sp.paidAmount) > 0
      ORDER BY sp.dueDate ASC, remainingBalance DESC
      LIMIT 50
    `).all(bizId);
  });
  electron.ipcMain.handle("get-supplier-payment-due-alerts", () => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT sp.id, sp.purchaseNumber, sp.purchaseDate, sp.totalAmount, sp.paidAmount,
        (sp.totalAmount - sp.paidAmount) AS remainingBalance, sp.dueDate,
        s.supplierName,
        CAST(julianday(sp.dueDate) - julianday('now') AS INTEGER) AS daysUntilDue
      FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId
      WHERE s.businessId = ?
        AND sp.status != 'cancelled'
        AND (sp.totalAmount - sp.paidAmount) > 0
        AND sp.dueDate IS NOT NULL
        AND sp.dueDate <= DATE('now', '+30 days')
      ORDER BY sp.dueDate ASC
      LIMIT 20
    `).all(bizId);
  });
  electron.ipcMain.handle("get-supplier-low-stock", () => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT i.id, i.name, i.totalBaseQuantity, i.baseUnit,
        s.id AS supplierId, s.supplierName, s.phone AS supplierPhone,
        c.name AS categoryName
      FROM items i
      JOIN suppliers s ON s.id = i.supplierId
      LEFT JOIN categories c ON c.id = i.categoryId
      WHERE i.businessId = ?
        AND i.is_deleted = 0
        AND i.supplierId IS NOT NULL
        AND i.totalBaseQuantity < 10
      ORDER BY i.totalBaseQuantity ASC
      LIMIT 20
    `).all(bizId);
  });
  electron.ipcMain.handle("void-sale", (_, data) => {
    requirePermission("sales.void");
    const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(data.saleId);
    if (!sale) throw new Error("Sale not found");
    if (sale.status === "Voided") throw new Error("Sale is already voided");
    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(sale.itemId);
    const transaction = db.transaction(() => {
      if (item) {
        let baseRestore = sale.quantity;
        let packRestore = 0;
        if (sale.unitType === "pack") {
          baseRestore = sale.quantity * (item.unitsPerPack || 1);
          packRestore = sale.quantity;
        } else {
          packRestore = sale.quantity / (item.unitsPerPack || 1);
        }
        db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, totalPackQuantity = totalPackQuantity + ? WHERE id = ?").run(baseRestore, packRestore, sale.itemId);
        const defWhId = getDefaultWarehouseId();
        const whRow = db.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, sale.itemId);
        if (whRow) {
          db.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(baseRestore, whRow.id);
        } else {
          db.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, sale.itemId, baseRestore);
        }
        db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, sale.itemId, "void_restore", baseRestore, "void", `Sale #${data.saleId} voided — stock restored`);
      }
      db.prepare("UPDATE sales SET status = 'Voided', voidReason = ?, voidedBy = ?, voidedAt = CURRENT_TIMESTAMP WHERE id = ?").run(data.reason, currentUserName || "unknown", data.saleId);
      if ((sale.paidAmount || 0) > 0) {
        db.prepare("UPDATE sales SET paidAmount = 0, paymentStatus = ? WHERE id = ?").run(sale.totalPrice > 0 ? "Debt" : "Pending", data.saleId);
      }
    });
    transaction();
    insertAuditLog("void_sale", "sale", data.saleId, "status", "Active", "Voided", `Sale #${data.saleId} voided by ${currentUserName || "unknown"}. Reason: ${data.reason}`);
    return db.prepare("SELECT * FROM sales WHERE id = ?").get(data.saleId);
  });
  electron.ipcMain.handle("reverse-debt-payment", (_, data) => {
    requirePermission("payments.reverse");
    const payment = db.prepare("SELECT * FROM debt_payments WHERE id = ?").get(data.paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.reversalId) throw new Error("Payment has already been reversed");
    const transaction = db.transaction(() => {
      db.prepare("UPDATE debt_payments SET reversalId = id, reversalReason = ?, reversedBy = ?, reversalDate = CURRENT_TIMESTAMP WHERE id = ?").run(data.reason, currentUserName || "unknown", data.paymentId);
      db.prepare("UPDATE sales SET paidAmount = MAX(0, paidAmount - ?) WHERE id = ?").run(payment.amount, payment.saleId);
    });
    transaction();
    insertAuditLog("reverse_debt_payment", "debt_payment", data.paymentId, "reversalId", null, String(data.paymentId), `Debt payment #${data.paymentId} reversed by ${currentUserName || "unknown"}. Reason: ${data.reason}`);
    return { success: true };
  });
  electron.ipcMain.handle("reverse-supplier-payment", (_, data) => {
    requirePermission("payments.reverse");
    const payment = db.prepare("SELECT * FROM supplier_payments WHERE id = ?").get(data.paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.reversalId) throw new Error("Payment has already been reversed");
    const transaction = db.transaction(() => {
      db.prepare("UPDATE supplier_payments SET reversalId = id, reversalReason = ?, reversedBy = ?, reversalDate = CURRENT_TIMESTAMP WHERE id = ?").run(data.reason, currentUserName || "unknown", data.paymentId);
      if (payment.purchaseId) {
        db.prepare("UPDATE supplier_purchases SET paidAmount = MAX(0, paidAmount - ?) WHERE id = ?").run(payment.amount, payment.purchaseId);
      }
    });
    transaction();
    insertAuditLog("reverse_supplier_payment", "supplier_payment", data.paymentId, "reversalId", null, String(data.paymentId), `Supplier payment #${data.paymentId} reversed by ${currentUserName || "unknown"}. Reason: ${data.reason}`);
    return { success: true };
  });
  electron.ipcMain.handle("reverse-adjustment", (_, data) => {
    requirePermission("adjustments.reverse");
    const adjustment = db.prepare("SELECT * FROM adjustments WHERE id = ?").get(data.adjustmentId);
    if (!adjustment) throw new Error("Adjustment not found");
    if (adjustment.reversalId) throw new Error("Adjustment has already been reversed");
    const bizId = getActiveBusinessId();
    const transaction = db.transaction(() => {
      db.prepare("UPDATE adjustments SET reversalId = id, reversalReason = ?, reversedBy = ?, reversalDate = CURRENT_TIMESTAMP WHERE id = ?").run(data.reason, currentUserName || "unknown", data.adjustmentId);
      let compensationType = adjustment.type;
      if (adjustment.type === "damage") compensationType = "add_stock";
      else if (adjustment.type === "loss") compensationType = "add_stock";
      else if (adjustment.type === "add_stock") compensationType = "damage";
      else if (adjustment.type === "price_increase") compensationType = "price_decrease";
      else if (adjustment.type === "price_decrease") compensationType = "price_increase";
      db.prepare("INSERT INTO adjustments (businessId, itemId, type, oldValue, newValue, quantity, unitType, reason, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        bizId,
        adjustment.itemId,
        compensationType,
        adjustment.newValue,
        adjustment.oldValue,
        adjustment.quantity,
        adjustment.unitType,
        `Reversal of adjustment #${data.adjustmentId}: ${data.reason}`,
        (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      );
      if (["damage", "loss", "add_stock"].includes(adjustment.type) && adjustment.quantity) {
        const restoreQty = adjustment.type === "damage" || adjustment.type === "loss" ? adjustment.quantity : -adjustment.quantity;
        db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ? WHERE id = ?").run(restoreQty, adjustment.itemId);
        const defWhId = getDefaultWarehouseId();
        const whRow = db.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, adjustment.itemId);
        if (whRow) {
          db.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(restoreQty, whRow.id);
        } else if (restoreQty > 0) {
          db.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, adjustment.itemId, restoreQty);
        }
        db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, adjustment.itemId, `adj_reversal`, Math.abs(restoreQty), "adjustment", `Reversal of adjustment #${data.adjustmentId}: ${data.reason}`);
      }
      if (adjustment.type === "price_increase" || adjustment.type === "price_decrease") {
        if (adjustment.unitType === "base") {
          db.prepare("UPDATE items SET baseSellingPrice = ? WHERE id = ?").run(adjustment.oldValue, adjustment.itemId);
        } else {
          db.prepare("UPDATE items SET packSellingPrice = ? WHERE id = ?").run(adjustment.oldValue, adjustment.itemId);
        }
      }
    });
    transaction();
    insertAuditLog("reverse_adjustment", "adjustment", data.adjustmentId, "reversalId", null, String(data.adjustmentId), `Adjustment #${data.adjustmentId} reversed by ${currentUserName || "unknown"}. Reason: ${data.reason}`);
    return { success: true };
  });
  electron.ipcMain.handle("get-audit-logs", (_, options) => {
    requirePermission("audit.view");
    let query = "SELECT * FROM audit_logs WHERE businessId = ?";
    const params = [getActiveBusinessId()];
    if (options?.entityType) {
      query += " AND entityType = ?";
      params.push(options.entityType);
    }
    if (options?.entityId) {
      query += " AND entityId = ?";
      params.push(options.entityId);
    }
    if (options?.action) {
      query += " AND action = ?";
      params.push(options.action);
    }
    if (options?.fromDate) {
      query += " AND createdAt >= ?";
      params.push(options.fromDate + " 00:00:00");
    }
    if (options?.toDate) {
      query += " AND createdAt <= ?";
      params.push(options.toDate + " 23:59:59");
    }
    query += " ORDER BY createdAt DESC";
    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    query += " LIMIT ?";
    params.push(listLimit);
    if (options?.offset) {
      query += " OFFSET ?";
      params.push(options.offset);
    }
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("archive-item", (_, data) => {
    requirePermission("inventory.delete");
    db.prepare("SELECT name FROM items WHERE id = ?").get(data.id);
    db.prepare("UPDATE items SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?").run(currentUserName || "unknown", data.id);
    return { success: true };
  });
  electron.ipcMain.handle("restore-item", (_, data) => {
    requirePermission("records.restore");
    const item = db.prepare("SELECT name FROM items WHERE id = ?").get(data.id);
    db.prepare("UPDATE items SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL WHERE id = ?").run(data.id);
    insertAuditLog("restore_item", "item", data.id, "is_deleted", "1", "0", `Item #${data.id} "${item?.name || "unknown"}" restored by ${currentUserName || "unknown"}`);
    return { success: true };
  });
  electron.ipcMain.handle("archive-customer", (_, data) => {
    requirePermission("customers.delete");
    const bizId = getActiveBusinessId();
    db.prepare("UPDATE customers SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(currentUserName || "unknown", data.id, bizId);
    return { success: true };
  });
  electron.ipcMain.handle("restore-customer", (_, data) => {
    requirePermission("records.restore");
    const bizId = getActiveBusinessId();
    db.prepare("UPDATE customers SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(data.id, bizId);
    insertAuditLog("restore_customer", "customer", data.id, "is_deleted", "1", "0", `Customer #${data.id} restored by ${currentUserName || "unknown"}`);
    return { success: true };
  });
  electron.ipcMain.handle("get-deleted-items", () => {
    requirePermission("inventory.view");
    const bizId = getActiveBusinessId();
    return db.prepare("SELECT * FROM items WHERE businessId = ? AND is_deleted = 1").all(bizId);
  });
  electron.ipcMain.handle("get-deleted-customers", () => {
    requirePermission("customers.view");
    const bizId = getActiveBusinessId();
    return db.prepare("SELECT * FROM customers WHERE businessId = ? AND is_deleted = 1").all(bizId);
  });
  electron.ipcMain.handle("get-voided-sales", (_, options) => {
    requirePermission("audit.view");
    const bizId = getActiveBusinessId();
    let query = `SELECT s.*, i.name as itemName FROM sales s LEFT JOIN items i ON s.itemId = i.id WHERE s.businessId = ? AND s.status = 'Voided'`;
    const params = [bizId];
    if (options?.fromDate) {
      query += " AND s.voidedAt >= ?";
      params.push(options.fromDate + " 00:00:00");
    }
    if (options?.toDate) {
      query += " AND s.voidedAt <= ?";
      params.push(options.toDate + " 23:59:59");
    }
    query += " ORDER BY s.voidedAt DESC";
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("reverse-audit-log-entry", (_, data) => {
    requirePermission("audit.view");
    const entry = db.prepare("SELECT * FROM audit_logs WHERE id = ? AND businessId = ?").get(data.logId, getActiveBusinessId());
    if (!entry) throw new Error("Audit log entry not found");
    if (entry.reversedAt) throw new Error("This change has already been reversed");
    const reverseAction = (newAction, description) => {
      db.prepare("UPDATE audit_logs SET reversedAt = CURRENT_TIMESTAMP, reversedBy = ? WHERE id = ?").run(currentUserName || "unknown", entry.id);
      insertAuditLog(newAction, entry.entityType, entry.entityId, entry.fieldName, entry.newValue, entry.oldValue, description);
    };
    if (entry.fieldName && entry.oldValue !== null && ["update", "insert"].includes(entry.action)) {
      const tableMap = { item: "items", customer: "customers", sale: "sales", supplier: "suppliers", expense: "expenses", adjustment: "adjustments" };
      const table = tableMap[entry.entityType];
      if (table && entry.entityId) {
        db.prepare(`UPDATE ${table} SET ${entry.fieldName} = ? WHERE id = ?`).run(entry.oldValue, entry.entityId);
        reverseAction("reverse_field_update", `Reversed field ${entry.fieldName} on ${entry.entityType} #${entry.entityId} from '${entry.newValue}' back to '${entry.oldValue}'`);
        return { success: true };
      }
    }
    if ((entry.action === "soft_delete" || entry.action === "archive") && entry.entityType === "item") {
      db.prepare("UPDATE items SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL WHERE id = ?").run(entry.entityId);
      reverseAction("restore_item", `Item #${entry.entityId} restored via audit log reversal`);
      return { success: true };
    }
    if ((entry.action === "soft_delete" || entry.action === "archive") && entry.entityType === "customer") {
      db.prepare("UPDATE customers SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL WHERE id = ?").run(entry.entityId);
      reverseAction("restore_customer", `Customer #${entry.entityId} restored via audit log reversal`);
      return { success: true };
    }
    if ((entry.action === "restore_item" || entry.action === "restore") && entry.entityType === "item") {
      db.prepare("UPDATE items SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?").run(currentUserName || "unknown", entry.entityId);
      reverseAction("soft_delete", `Item #${entry.entityId} re-deleted via audit log reversal`);
      return { success: true };
    }
    if ((entry.action === "restore_customer" || entry.action === "restore") && entry.entityType === "customer") {
      db.prepare("UPDATE customers SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?").run(currentUserName || "unknown", entry.entityId);
      reverseAction("soft_delete", `Customer #${entry.entityId} re-deleted via audit log reversal`);
      return { success: true };
    }
    throw new Error("This action type cannot be automatically reversed from audit logs. Please use the relevant page to undo this change.");
  });
  electron.ipcMain.handle("get-reversal-stats", () => {
    const bizId = getActiveBusinessId();
    const voidedSales = db.prepare("SELECT COUNT(*) as count FROM sales WHERE businessId = ? AND status = 'Voided'").get(bizId).count;
    const reversedPayments = db.prepare("SELECT COUNT(*) as count FROM debt_payments dp JOIN sales s ON dp.saleId = s.id WHERE s.businessId = ? AND dp.reversalId IS NOT NULL").get(bizId).count;
    const reversedSupplierPayments = db.prepare("SELECT COUNT(*) as count FROM supplier_payments WHERE businessId = ? AND reversalId IS NOT NULL").get(bizId).count;
    const reversedAdjustments = db.prepare("SELECT COUNT(*) as count FROM adjustments WHERE businessId = ? AND reversalId IS NOT NULL").get(bizId).count;
    return { voidedSales, reversedPayments, reversedSupplierPayments, reversedAdjustments };
  });
  electron.ipcMain.handle("get-orders", (_, options = {}) => {
    requirePermission("orders.view");
    const bizId = getActiveBusinessId();
    let query = "SELECT * FROM orders WHERE businessId = ? AND is_deleted = 0";
    const params = [bizId];
    if (options.search) {
      query += " AND (orderNumber LIKE ? OR customerName LIKE ? OR customerPhone LIKE ?)";
      params.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
    }
    if (options.status && options.status !== "All") {
      query += " AND status = ?";
      params.push(options.status);
    }
    if (options.startDate && options.endDate) {
      if (options.startDate === options.endDate) {
        query += " AND createdAt >= ? AND createdAt < ?";
        params.push(options.startDate, options.startDate + "T23:59:59.999Z");
      } else {
        query += " AND createdAt >= ? AND createdAt <= ?";
        params.push(options.startDate, options.endDate + "T23:59:59.999Z");
      }
    } else if (options.startDate) {
      query += " AND createdAt >= ?";
      params.push(options.startDate);
    } else if (options.endDate) {
      query += " AND createdAt <= ?";
      params.push(options.endDate + "T23:59:59.999Z");
    }
    query += " ORDER BY createdAt DESC";
    const listLimit = options.limit ?? DEFAULT_LIST_LIMIT;
    query += " LIMIT ?";
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-order", (_, id) => {
    requirePermission("orders.view");
    const bizId = getActiveBusinessId();
    const order = db.prepare("SELECT * FROM orders WHERE id = ? AND businessId = ? AND is_deleted = 0").get(id, bizId);
    if (!order) return null;
    const items = db.prepare("SELECT * FROM order_items WHERE orderId = ?").all(id);
    const history = db.prepare("SELECT * FROM order_history WHERE orderId = ? ORDER BY createdAt ASC").all(id);
    return { ...order, items, history };
  });
  electron.ipcMain.handle("insert-order", (_, data) => {
    requirePermission("orders.create");
    const bizId = getActiveBusinessId();
    if (!data.items || data.items.length === 0) throw new Error("Order must have at least one item");
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    let totalAmount = 0;
    for (const item of data.items) {
      validatePositive(item.quantity, "Item quantity");
      validateNonNegative(item.unitPrice, "Unit price");
      totalAmount += item.quantity * item.unitPrice;
    }
    const transaction = db.transaction(() => {
      const orderResult = db.prepare(`
        INSERT INTO orders (businessId, orderNumber, customerName, customerPhone, notes, status, totalAmount, createdBy, createdByName, createdAt)
        VALUES (?, ?, ?, ?, ?, 'Order', ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(bizId, orderNumber, data.customerName || null, data.customerPhone || null, data.notes || null, totalAmount, null, currentUserName || "unknown");
      const orderId2 = orderResult.lastInsertRowid;
      const itemStmt = db.prepare(`
        INSERT INTO order_items (orderId, itemId, itemName, quantity, unit, unitType, unitPrice, totalPrice)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of data.items) {
        itemStmt.run(orderId2, item.itemId || null, item.itemName, item.quantity, item.unit || "pcs", item.unitType || "base", item.unitPrice, item.quantity * item.unitPrice);
      }
      db.prepare("INSERT INTO order_history (orderId, action, performedBy, notes) VALUES (?, ?, ?, ?)").run(orderId2, "created", currentUserName || "unknown", "Order created");
      return orderId2;
    });
    const orderId = transaction();
    return orderId;
  });
  electron.ipcMain.handle("convert-order-to-sale", (_, data) => {
    requirePermission("orders.convert");
    const bizId = getActiveBusinessId();
    const order = db.prepare("SELECT * FROM orders WHERE id = ? AND businessId = ? AND is_deleted = 0").get(data.orderId, bizId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "Order") throw new Error('Only orders with status "Order" can be converted');
    const items = db.prepare("SELECT * FROM order_items WHERE orderId = ?").all(data.orderId);
    const transaction = db.transaction(() => {
      const saleIds = [];
      for (const item of items) {
        const dbItem = db.prepare("SELECT * FROM items WHERE id = ?").get(item.itemId);
        if (!dbItem) throw new Error(`Item "${item.itemName}" not found in inventory`);
        const qty = item.quantity;
        let baseDeduction = qty;
        let packDeduction = 0;
        if (item.unitType === "pack") {
          baseDeduction = qty * (dbItem.unitsPerPack || 1);
          packDeduction = qty;
        } else {
          packDeduction = qty / (dbItem.unitsPerPack || 1);
        }
        if (dbItem.totalBaseQuantity < baseDeduction) {
          throw new Error(`Insufficient stock: ${dbItem.name} has ${dbItem.totalBaseQuantity} ${dbItem.baseUnit}, need ${baseDeduction}`);
        }
        const itemDiscount = data.discount ? item.totalPrice / order.totalAmount * data.discount : 0;
        const itemVat = data.vat ? item.totalPrice / order.totalAmount * data.vat : 0;
        const finalPrice = item.totalPrice - itemDiscount + itemVat;
        const saleResult = db.prepare(`
          INSERT INTO sales (businessId, itemId, quantity, unit, unitType, discount, vat, totalPrice, paymentMethod, paymentStatus, customerName, customerPhone, createdBy)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid', ?, ?, ?)
        `).run(bizId, item.itemId, qty, item.unit || "pcs", item.unitType || "base", itemDiscount, itemVat, finalPrice, data.paymentMethod || "Cash", order.customerName || null, order.customerPhone || null, null);
        saleIds.push(saleResult.lastInsertRowid);
        db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity - ?, totalPackQuantity = totalPackQuantity - ? WHERE id = ?").run(baseDeduction, packDeduction, item.itemId);
        const defWhId = getDefaultWarehouseId();
        const whRow = db.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, item.itemId);
        if (whRow) {
          if (whRow.quantity < baseDeduction) throw new Error(`Insufficient stock at warehouse: ${dbItem.name}`);
          db.prepare("UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(baseDeduction, whRow.id);
        } else {
          db.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, item.itemId, -baseDeduction);
        }
        db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, item.itemId, "sale_out", baseDeduction, "order_conversion", `Converted from order ${order.orderNumber}`);
      }
      db.prepare("UPDATE orders SET status = 'Converted', convertedAt = CURRENT_TIMESTAMP, convertedBy = ? WHERE id = ?").run(currentUserName || "unknown", data.orderId);
      db.prepare("INSERT INTO order_history (orderId, action, performedBy, notes) VALUES (?, ?, ?, ?)").run(data.orderId, "converted_to_sale", currentUserName || "unknown", `Converted to sale(s): ${saleIds.join(", ")}. Payment: ${data.paymentMethod || "Cash"}`);
      return { success: true, saleIds };
    });
    const result = transaction();
    insertAuditLog("convert_order_to_sale", "order", data.orderId, "status", "Order", "Converted", `Order #${data.orderId} converted to sale by ${currentUserName || "unknown"}`);
    return result;
  });
  electron.ipcMain.handle("convert-order-to-debt", (_, data) => {
    requirePermission("orders.convert");
    const bizId = getActiveBusinessId();
    const order = db.prepare("SELECT * FROM orders WHERE id = ? AND businessId = ? AND is_deleted = 0").get(data.orderId, bizId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "Order") throw new Error('Only orders with status "Order" can be converted');
    const items = db.prepare("SELECT * FROM order_items WHERE orderId = ?").all(data.orderId);
    const cName = order.customerName?.trim();
    if (!cName) throw new Error("Customer name is required for debt conversion");
    const transaction = db.transaction(() => {
      const exists = db.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(cName, bizId);
      if (!exists) {
        db.prepare("INSERT INTO customers (businessId, customerName, phone, groupName) VALUES (?, ?, ?, ?)").run(bizId, cName, order.customerPhone?.trim() || "", "general");
      }
      const saleIds = [];
      for (const item of items) {
        const dbItem = db.prepare("SELECT * FROM items WHERE id = ?").get(item.itemId);
        if (!dbItem) throw new Error(`Item "${item.itemName}" not found in inventory`);
        const qty = item.quantity;
        let baseDeduction = qty;
        let packDeduction = 0;
        if (item.unitType === "pack") {
          baseDeduction = qty * (dbItem.unitsPerPack || 1);
          packDeduction = qty;
        } else {
          packDeduction = qty / (dbItem.unitsPerPack || 1);
        }
        if (dbItem.totalBaseQuantity < baseDeduction) {
          throw new Error(`Insufficient stock: ${dbItem.name} has ${dbItem.totalBaseQuantity} ${dbItem.baseUnit}, need ${baseDeduction}`);
        }
        const itemDiscount = data.discount ? item.totalPrice / order.totalAmount * data.discount : 0;
        const itemVat = data.vat ? item.totalPrice / order.totalAmount * data.vat : 0;
        const finalPrice = item.totalPrice - itemDiscount + itemVat;
        const saleResult = db.prepare(`
          INSERT INTO sales (businessId, itemId, quantity, unit, unitType, discount, vat, totalPrice, paymentMethod, paymentStatus, customerName, customerPhone, dueDate, paidAmount, createdBy)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Debt', ?, ?, ?, 0, ?)
        `).run(bizId, item.itemId, qty, item.unit || "pcs", item.unitType || "base", itemDiscount, itemVat, finalPrice, data.paymentMethod || "Credit", order.customerName, order.customerPhone || null, data.dueDate || null, null);
        saleIds.push(saleResult.lastInsertRowid);
        db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity - ?, totalPackQuantity = totalPackQuantity - ? WHERE id = ?").run(baseDeduction, packDeduction, item.itemId);
        const defWhId = getDefaultWarehouseId();
        const whRow = db.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, item.itemId);
        if (whRow) {
          if (whRow.quantity < baseDeduction) throw new Error(`Insufficient stock at warehouse: ${dbItem.name}`);
          db.prepare("UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(baseDeduction, whRow.id);
        } else {
          db.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, item.itemId, -baseDeduction);
        }
        db.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, item.itemId, "sale_out", baseDeduction, "order_debt_conversion", `Converted from order ${order.orderNumber}`);
      }
      db.prepare("UPDATE orders SET status = 'Converted', convertedAt = CURRENT_TIMESTAMP, convertedBy = ? WHERE id = ?").run(currentUserName || "unknown", data.orderId);
      db.prepare("INSERT INTO order_history (orderId, action, performedBy, notes) VALUES (?, ?, ?, ?)").run(data.orderId, "converted_to_debt", currentUserName || "unknown", `Converted to debt sale(s): ${saleIds.join(", ")}. Due: ${data.dueDate || "Not set"}`);
      return { success: true, saleIds };
    });
    const result = transaction();
    insertAuditLog("convert_order_to_debt", "order", data.orderId, "status", "Order", "Converted", `Order #${data.orderId} converted to debt by ${currentUserName || "unknown"}`);
    return result;
  });
  electron.ipcMain.handle("import-data", (_, module, rows) => {
    return importData(module, rows);
  });
  electron.ipcMain.handle("cancel-order", (_, data) => {
    requirePermission("orders.cancel");
    const bizId = getActiveBusinessId();
    const order = db.prepare("SELECT * FROM orders WHERE id = ? AND businessId = ? AND is_deleted = 0").get(data.orderId, bizId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "Order") throw new Error('Only orders with status "Order" can be cancelled');
    db.prepare("UPDATE orders SET status = 'Cancelled', cancelledAt = CURRENT_TIMESTAMP, cancelledBy = ?, cancelReason = ? WHERE id = ?").run(currentUserName || "unknown", data.reason || null, data.orderId);
    db.prepare("INSERT INTO order_history (orderId, action, performedBy, notes) VALUES (?, ?, ?, ?)").run(data.orderId, "cancelled", currentUserName || "unknown", data.reason || "Cancelled");
    insertAuditLog("cancel_order", "order", data.orderId, "status", "Order", "Cancelled", `Order #${data.orderId} cancelled by ${currentUserName || "unknown"}. Reason: ${data.reason || "N/A"}`);
    return { success: true };
  });
  console.log("[Handlers] Registered global-search");
  electron.ipcMain.handle("global-search", (_, query) => {
    const bizId = getActiveBusinessId();
    if (!query || query.trim().length < 1) return [];
    const q = `%${query.trim()}%`;
    const results = [];
    console.log("[Search] bizId:", bizId, "query:", query);
    console.log("[Search] items count:", db.prepare("SELECT COUNT(*) as c FROM items WHERE businessId = ?").get(bizId)?.c);
    console.log("[Search] sales count:", db.prepare("SELECT COUNT(*) as c FROM sales WHERE businessId = ?").get(bizId)?.c);
    try {
      const items = db.prepare(`
        SELECT items.id, items.name, items.companyName, items.categoryId, items.totalBaseQuantity, items.baseUnit, items.baseSellingPrice,
          categories.name as categoryName
        FROM items LEFT JOIN categories ON items.categoryId = categories.id
        WHERE items.businessId = ? AND items.is_deleted = 0
          AND (items.name LIKE ? OR items.companyName LIKE ?)
        LIMIT 8
      `).all(bizId, q, q);
      items.forEach((i) => results.push({
        type: "item",
        id: i.id,
        title: i.name,
        subtitle: `${i.companyName || ""} ${i.categoryName ? "· " + i.categoryName : ""} · ${i.totalBaseQuantity || 0} ${i.baseUnit || "pcs"}`,
        route: "/inventory",
        detail: i.id
      }));
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const sales = db.prepare(`
        SELECT s.id, s.totalPrice, s.customerName, s.paymentStatus, s.createdAt, i.name as itemName
        FROM sales s LEFT JOIN items i ON s.itemId = i.id
        WHERE s.businessId = ? AND (i.name LIKE ? OR s.customerName LIKE ? OR CAST(s.id AS TEXT) LIKE ?)
        LIMIT 8
      `).all(bizId, q, q, q);
      sales.forEach((s) => results.push({
        type: "sale",
        id: s.id,
        title: `#${s.id} · ${s.itemName || "Item"}`,
        subtitle: `${s.customerName || "Walk-in"} · ${s.paymentStatus} · ETB ${(s.totalPrice || 0).toLocaleString()}`,
        route: `/sales/${s.id}`,
        detail: s.id
      }));
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const customers = db.prepare(`
        SELECT id, customerName, phone, company, groupName
        FROM customers WHERE businessId = ? AND isActive = 1
          AND (customerName LIKE ? OR phone LIKE ? OR company LIKE ?)
        LIMIT 8
      `).all(bizId, q, q, q);
      customers.forEach((c) => results.push({
        type: "customer",
        id: c.id,
        title: c.customerName,
        subtitle: `${c.phone || ""} ${c.company ? "· " + c.company : ""}`,
        route: "/customers",
        detail: c.id
      }));
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const suppliers = db.prepare(`
        SELECT id, supplierName, companyName, phone, contactPerson
        FROM suppliers WHERE businessId = ? AND isActive = 1
          AND (supplierName LIKE ? OR companyName LIKE ? OR phone LIKE ? OR contactPerson LIKE ?)
        LIMIT 8
      `).all(bizId, q, q, q, q);
      suppliers.forEach((s) => results.push({
        type: "supplier",
        id: s.id,
        title: s.supplierName,
        subtitle: `${s.companyName || ""} ${s.contactPerson ? "· " + s.contactPerson : ""}`,
        route: "/suppliers",
        detail: s.id
      }));
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const expenses = db.prepare(`
        SELECT id, name, amount, category, date
        FROM expenses WHERE businessId = ? AND (name LIKE ? OR category LIKE ?)
        LIMIT 8
      `).all(bizId, q, q);
      expenses.forEach((e) => results.push({
        type: "expense",
        id: e.id,
        title: e.name,
        subtitle: `${e.category} · ETB ${(e.amount || 0).toLocaleString()}`,
        route: "/expenses",
        detail: e.id
      }));
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const budgets = db.prepare(`
        SELECT id, category, amount, budgetType, month, year, referenceName
        FROM budgets WHERE businessId = ? AND (category LIKE ? OR referenceName LIKE ?)
        LIMIT 8
      `).all(bizId, q, q);
      budgets.forEach((b) => results.push({
        type: "budget",
        id: b.id,
        title: b.category,
        subtitle: `ETB ${(b.amount || 0).toLocaleString()} · ${b.budgetType}${b.referenceName ? " · " + b.referenceName : ""}`,
        route: "/budgets",
        detail: b.id
      }));
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const cats = db.prepare(`
        SELECT id, name FROM categories WHERE businessId = ? AND name LIKE ?
        LIMIT 8
      `).all(bizId, q);
      cats.forEach((c) => results.push({
        type: "category",
        id: c.id,
        title: c.name,
        subtitle: "",
        route: "/inventory",
        detail: c.id
      }));
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const whs = db.prepare(`
        SELECT id, name, location, managerName
        FROM warehouses WHERE businessId = ? AND (name LIKE ? OR location LIKE ? OR managerName LIKE ?)
        LIMIT 8
      `).all(bizId, q, q, q);
      whs.forEach((w) => results.push({
        type: "warehouse",
        id: w.id,
        title: w.name,
        subtitle: `${w.location || ""} ${w.managerName ? "· " + w.managerName : ""}`,
        route: "/warehouses",
        detail: w.id
      }));
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const purchases = db.prepare(`
        SELECT sp.id, sp.purchaseNumber, sp.totalAmount, sp.status, s.supplierName
        FROM supplier_purchases sp LEFT JOIN suppliers s ON sp.supplierId = s.id
        WHERE sp.businessId = ? AND (sp.purchaseNumber LIKE ? OR s.supplierName LIKE ? OR CAST(sp.id AS TEXT) LIKE ?)
        LIMIT 8
      `).all(bizId, q, q, q);
      purchases.forEach((p) => results.push({
        type: "purchase",
        id: p.id,
        title: p.purchaseNumber || `#${p.id}`,
        subtitle: `${p.supplierName || ""} · ETB ${(p.totalAmount || 0).toLocaleString()} · ${p.status || ""}`,
        route: "/suppliers",
        detail: p.id
      }));
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const adjustments = db.prepare(`
        SELECT a.id, a.type, a.reason, a.quantity, i.name as itemName
        FROM adjustments a LEFT JOIN items i ON a.itemId = i.id
        WHERE a.businessId = ? AND (i.name LIKE ? OR a.reason LIKE ? OR a.type LIKE ?)
        LIMIT 8
      `).all(bizId, q, q, q);
      adjustments.forEach((a) => results.push({
        type: "adjustment",
        id: a.id,
        title: `${a.type} · ${a.itemName || ""}`,
        subtitle: `${a.reason || ""} ${a.quantity ? "· Qty: " + a.quantity : ""}`,
        route: "/adjustments",
        detail: a.id
      }));
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const notifs = db.prepare(`
        SELECT id, title, message, type, severity
        FROM notifications WHERE businessId = ? AND isDismissed = 0
          AND (title LIKE ? OR message LIKE ?)
        LIMIT 8
      `).all(bizId, q, q);
      notifs.forEach((n) => results.push({
        type: "notification",
        id: n.id,
        title: n.title,
        subtitle: n.message || "",
        route: null,
        detail: n.id
      }));
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const drafts = db.prepare(`
        SELECT id, customerName, discount, vat, notes
        FROM draft_sales WHERE businessId = ?
          AND (customerName LIKE ? OR notes LIKE ?)
        LIMIT 8
      `).all(bizId, q, q);
      drafts.forEach((d) => results.push({
        type: "draft",
        id: d.id,
        title: d.customerName || "Unnamed Draft",
        subtitle: `${d.notes || ""}${d.discount ? " · Discount: " + d.discount : ""}`,
        route: "/sales",
        detail: d.id
      }));
    } catch (e) {
      console.error("[Search]", e);
    }
    return results.slice(0, 40);
  });
  electron.ipcMain.handle("get-business-health-score", () => {
    const bizId = getActiveBusinessId();
    const now = /* @__PURE__ */ new Date();
    const today = now.toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 864e5).toISOString().split("T")[0];
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 864e5).toISOString().split("T")[0];
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 864e5).toISOString().split("T")[0];
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const factors = [];
    const recommendations = [];
    try {
      const last30Sales = db.prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND DATE(createdAt) <= ? AND businessId = ?"
      ).get(thirtyDaysAgo, today, bizId);
      const prev30Sales = db.prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND DATE(createdAt) < ? AND businessId = ?"
      ).get(sixtyDaysAgo, thirtyDaysAgo, bizId);
      const salesGrowth = prev30Sales.revenue > 0 ? (last30Sales.revenue - prev30Sales.revenue) / prev30Sales.revenue * 100 : 0;
      let salesScore = 50;
      if (last30Sales.count > 0 && prev30Sales.count > 0) {
        salesScore = Math.min(100, Math.max(0, 50 + salesGrowth));
      } else if (last30Sales.count > 0) {
        salesScore = 60;
      } else {
        salesScore = 20;
      }
      factors.push({
        name: "Sales Performance",
        score: Math.round(salesScore),
        weight: 20,
        status: salesScore >= 70 ? "good" : salesScore >= 40 ? "warning" : "critical",
        detail: `${last30Sales.count} transactions, ETB ${(last30Sales.revenue || 0).toLocaleString()} revenue (${salesGrowth >= 0 ? "+" : ""}${salesGrowth.toFixed(1)}% vs prev period)`
      });
      if (salesScore < 40) recommendations.push("Increase sales efforts — revenue is significantly below potential. Consider promotions or new product lines.");
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const profitData = db.prepare(`
        SELECT COALESCE(SUM(s.totalPrice - (CASE WHEN s.unitType = 'pack' THEN s.quantity * COALESCE(i.unitsPerPack, 1) ELSE s.quantity END * COALESCE(i.basePurchasePrice, 0))), 0) as grossProfit,
               COALESCE(SUM(s.totalPrice), 0) as revenue
        FROM sales s LEFT JOIN items i ON s.itemId = i.id
        WHERE DATE(s.createdAt) >= ? AND DATE(s.createdAt) <= ? AND s.businessId = ?
      `).get(thirtyDaysAgo, today, bizId);
      const margin = profitData.revenue > 0 ? profitData.grossProfit / profitData.revenue * 100 : 0;
      let marginScore = Math.min(100, Math.max(0, margin / 50 * 100));
      factors.push({
        name: "Gross Profit Margin",
        score: Math.round(marginScore),
        weight: 15,
        status: margin >= 30 ? "good" : margin >= 15 ? "warning" : "critical",
        detail: `${margin.toFixed(1)}% margin (ETB ${(profitData.grossProfit || 0).toLocaleString()} profit on ETB ${(profitData.revenue || 0).toLocaleString()} revenue)`
      });
      if (margin < 20) recommendations.push("Your gross profit margin is low. Review pricing strategy and negotiate better purchase prices from suppliers.");
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const totalExpenses = db.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND date <= ? AND businessId = ?"
      ).get(thirtyDaysAgo, today, bizId);
      const last30Rev = db.prepare(
        "SELECT COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND DATE(createdAt) <= ? AND businessId = ?"
      ).get(thirtyDaysAgo, today, bizId);
      const expenseRatio = last30Rev.revenue > 0 ? totalExpenses.total / last30Rev.revenue * 100 : 0;
      let expenseScore = Math.min(100, Math.max(0, 100 - expenseRatio * 2));
      factors.push({
        name: "Expense Control",
        score: Math.round(expenseScore),
        weight: 15,
        status: expenseRatio <= 30 ? "good" : expenseRatio <= 60 ? "warning" : "critical",
        detail: `Expenses are ${expenseRatio.toFixed(1)}% of revenue (ETB ${(totalExpenses.total || 0).toLocaleString()})`
      });
      if (expenseRatio > 50) recommendations.push("Expenses are eating into profits. Review and cut non-essential spending.");
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const totalItems = db.prepare("SELECT COUNT(*) as count FROM items WHERE businessId = ? AND is_deleted = 0").get(bizId);
      const lowStock = db.prepare("SELECT COUNT(*) as count FROM items WHERE totalBaseQuantity < 10 AND businessId = ? AND is_deleted = 0").get(bizId);
      const outOfStock = db.prepare("SELECT COUNT(*) as count FROM items WHERE totalBaseQuantity <= 0 AND businessId = ? AND is_deleted = 0").get(bizId);
      const healthyRatio = totalItems.count > 0 ? 1 - lowStock.count / totalItems.count : 0;
      let invScore = Math.round(healthyRatio * 100);
      factors.push({
        name: "Inventory Health",
        score: invScore,
        weight: 15,
        status: invScore >= 80 ? "good" : invScore >= 50 ? "warning" : "critical",
        detail: `${lowStock.count} low-stock, ${outOfStock.count} out-of-stock out of ${totalItems.count} products`
      });
      if (lowStock.count > totalItems.count * 0.3) recommendations.push("Too many products are low on stock. Restock popular items and set up automated reorder alerts.");
      if (outOfStock.count > 5) recommendations.push("Several items are completely out of stock. Prioritize restocking best-selling products.");
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const slowMoving = db.prepare(`
        SELECT COUNT(*) as count FROM items i WHERE i.businessId = ? AND i.is_deleted = 0
          AND (SELECT COUNT(*) FROM sales WHERE itemId = i.id AND DATE(createdAt) >= ?) = 0
          AND i.totalBaseQuantity > 0
      `).get(bizId, ninetyDaysAgo);
      const deadStock = db.prepare(`
        SELECT COUNT(*) as count FROM items i WHERE i.businessId = ? AND i.is_deleted = 0
          AND (SELECT COUNT(*) FROM sales WHERE itemId = i.id AND DATE(createdAt) >= ?) = 0
          AND i.totalBaseQuantity > 0
      `).get(bizId, sixtyDaysAgo);
      const totalActive = db.prepare("SELECT COUNT(*) as count FROM items WHERE businessId = ? AND is_deleted = 0 AND totalBaseQuantity > 0").get(bizId);
      const slowRatio = totalActive.count > 0 ? slowMoving.count / totalActive.count : 0;
      let slowScore = Math.round(Math.max(0, 100 - slowRatio * 200));
      factors.push({
        name: "Inventory Turnover",
        score: slowScore,
        weight: 10,
        status: slowScore >= 70 ? "good" : slowScore >= 40 ? "warning" : "critical",
        detail: `${slowMoving.count} items with no sales in 90 days, ${deadStock.count} with no sales in 60 days`
      });
      if (slowMoving.count > 5) recommendations.push("You have slow-moving inventory. Consider discounts or bundles to clear stagnant stock.");
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const budgets = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM budgets WHERE businessId = ? AND year = ? AND (month = ? OR month IS NULL)").get(bizId, String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"));
      if (budgets.count > 0) {
        const expenses = db.prepare(
          "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE businessId = ? AND date >= ? AND date <= ?"
        ).get(bizId, monthStart, today);
        const budgetUsage = budgets.total > 0 ? expenses.total / budgets.total * 100 : 0;
        let budgetScore = budgetUsage <= 100 ? Math.round(100 - Math.abs(budgetUsage - 50) * 0.5) : Math.max(0, Math.round(100 - (budgetUsage - 100) * 1.5));
        factors.push({
          name: "Budget Adherence",
          score: budgetScore,
          weight: 10,
          status: budgetUsage <= 100 ? "good" : "critical",
          detail: `${budgetUsage.toFixed(1)}% of budget used (ETB ${(expenses.total || 0).toLocaleString()} / ETB ${(budgets.total || 0).toLocaleString()})`
        });
        if (budgetUsage > 100) recommendations.push("You have exceeded your budget. Review spending and adjust budget allocations.");
      } else {
        factors.push({ name: "Budget Adherence", score: 50, weight: 10, status: "warning", detail: "No budgets set for this period. Set budgets to track spending." });
        recommendations.push("Set up monthly budgets to better track and control your expenses.");
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const activeCustomers = db.prepare(`
        SELECT COUNT(DISTINCT TRIM(customerName)) as count FROM sales
        WHERE DATE(createdAt) >= ? AND businessId = ? AND customerName IS NOT NULL AND customerName != ''
      `).get(thirtyDaysAgo, bizId);
      const totalCustomers = db.prepare("SELECT COUNT(*) as count FROM customers WHERE businessId = ? AND isActive = 1").get(bizId);
      const repeatRate = totalCustomers.count > 0 ? Math.min(1, activeCustomers.count / totalCustomers.count * 2) : 0;
      let custScore = Math.round(repeatRate * 100);
      factors.push({
        name: "Customer Activity",
        score: custScore,
        weight: 10,
        status: custScore >= 60 ? "good" : custScore >= 30 ? "warning" : "critical",
        detail: `${activeCustomers.count} active customers this month (${totalCustomers.count} total)`
      });
      if (custScore < 40) recommendations.push("Customer engagement is low. Launch a loyalty program or email campaign to bring customers back.");
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const currentMonthRev = db.prepare(
        "SELECT COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND businessId = ?"
      ).get(thirtyDaysAgo, bizId);
      const prevMonthRev = db.prepare(
        "SELECT COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND DATE(createdAt) < ? AND businessId = ?"
      ).get(sixtyDaysAgo, thirtyDaysAgo, bizId);
      const growth = prevMonthRev.revenue > 0 ? (currentMonthRev.revenue - prevMonthRev.revenue) / prevMonthRev.revenue * 100 : 0;
      let growthScore = Math.min(100, Math.max(0, 50 + growth));
      factors.push({
        name: "Revenue Growth",
        score: Math.round(growthScore),
        weight: 5,
        status: growth >= 5 ? "good" : growth >= -5 ? "warning" : "critical",
        detail: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}% month-over-month`
      });
      if (growth < -10) recommendations.push("Revenue is declining. Analyze sales data to identify trends and adjust your strategy.");
    } catch (e) {
      console.error("[Search]", e);
    }
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const weightedScore = totalWeight > 0 ? factors.reduce((sum, f) => sum + f.score * f.weight / totalWeight, 0) : 0;
    const finalScore = Math.round(Math.max(0, Math.min(100, weightedScore)));
    let rating;
    if (finalScore >= 80) rating = "Excellent";
    else if (finalScore >= 60) rating = "Good";
    else if (finalScore >= 40) rating = "Fair";
    else rating = "Needs Attention";
    return { score: finalScore, rating, factors, recommendations };
  });
  console.log("[Handlers] Registered get-business-insights");
  electron.ipcMain.handle("get-business-insights", () => {
    const bizId = getActiveBusinessId();
    console.log("[Insights] Called with bizId:", bizId);
    console.log("[Insights] items:", db.prepare("SELECT COUNT(*) as c FROM items WHERE businessId = ?").get(bizId)?.c);
    const now = /* @__PURE__ */ new Date();
    const today = now.toISOString().split("T")[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 864e5).toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 864e5).toISOString().split("T")[0];
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 864e5).toISOString().split("T")[0];
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 864e5).toISOString().split("T")[0];
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const insights = [];
    try {
      const lowItems = db.prepare(`
        SELECT i.id, i.name, i.totalBaseQuantity, i.baseUnit, i.baseSellingPrice, c.name as categoryName
        FROM items i LEFT JOIN categories c ON i.categoryId = c.id
        WHERE i.businessId = ? AND i.is_deleted = 0 AND i.totalBaseQuantity < 10 AND i.totalBaseQuantity > 0
        ORDER BY i.totalBaseQuantity ASC LIMIT 5
      `).all(bizId);
      if (lowItems.length > 0) {
        insights.push({
          type: "low_stock",
          severity: "warning",
          title: `${lowItems.length} Products Running Low`,
          message: lowItems.map((i) => `${i.name} (${i.totalBaseQuantity} ${i.baseUnit})`).join(", ") + ". Restock soon to avoid stockouts.",
          action: { label: "View Inventory", route: "/inventory" }
        });
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const oosItems = db.prepare(`
        SELECT COUNT(*) as count FROM items WHERE businessId = ? AND is_deleted = 0 AND totalBaseQuantity <= 0
      `).get(bizId);
      if (oosItems.count > 0) {
        insights.push({
          type: "out_of_stock",
          severity: "critical",
          title: `${oosItems.count} Products Out of Stock`,
          message: `These items need immediate attention to restore availability. Check your supplier list and place orders.`,
          action: { label: "View Inventory", route: "/inventory" }
        });
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const bestSellers = db.prepare(`
        SELECT i.name, SUM(s.quantity) as totalQty, SUM(s.totalPrice) as totalRevenue
        FROM sales s JOIN items i ON s.itemId = i.id
        WHERE DATE(s.createdAt) >= ? AND s.businessId = ?
        GROUP BY s.itemId ORDER BY totalQty DESC LIMIT 5
      `).all(thirtyDaysAgo, bizId);
      if (bestSellers.length > 0) {
        insights.push({
          type: "best_sellers",
          severity: "success",
          title: "Best Selling Products",
          message: bestSellers.map((i) => `${i.name} (${i.totalQty} units, ETB ${(i.totalRevenue || 0).toLocaleString()})`).join(" · "),
          action: { label: "View Sales", route: "/sales" }
        });
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const topProfit = db.prepare(`
        SELECT i.name,
          SUM(s.totalPrice - (CASE WHEN s.unitType = 'pack' THEN s.quantity * COALESCE(i.unitsPerPack, 1) ELSE s.quantity END * COALESCE(i.basePurchasePrice, 0))) as totalProfit,
          SUM(s.quantity) as totalQty
        FROM sales s JOIN items i ON s.itemId = i.id
        WHERE DATE(s.createdAt) >= ? AND s.businessId = ?
        GROUP BY s.itemId ORDER BY totalProfit DESC LIMIT 5
      `).all(thirtyDaysAgo, bizId);
      if (topProfit.length > 0) {
        insights.push({
          type: "top_profit",
          severity: "success",
          title: "Highest Profit Items",
          message: topProfit.map((i) => `${i.name} (ETB ${(i.totalProfit || 0).toLocaleString()})`).join(" · ")
        });
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const slowMoving = db.prepare(`
        SELECT i.id, i.name, i.totalBaseQuantity, i.baseUnit, i.basePurchasePrice * i.totalBaseQuantity as inventoryValue
        FROM items i WHERE i.businessId = ? AND i.is_deleted = 0 AND i.totalBaseQuantity > 0
          AND (SELECT COALESCE(SUM(quantity), 0) FROM sales WHERE itemId = i.id AND DATE(createdAt) >= ?) = 0
        ORDER BY inventoryValue DESC LIMIT 5
      `).all(bizId, ninetyDaysAgo);
      if (slowMoving.length > 0) {
        insights.push({
          type: "slow_moving",
          severity: "warning",
          title: "Slow-Moving Products",
          message: `${slowMoving.length} products haven't sold in 90 days. Consider promotions or bundles to move this stock. Top: ${slowMoving[0].name} (ETB ${(slowMoving[0].inventoryValue || 0).toLocaleString()} tied up)`
        });
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const overstocked = db.prepare(`
        SELECT i.name, i.totalBaseQuantity, i.baseUnit, c.name as categoryName
        FROM items i LEFT JOIN categories c ON i.categoryId = c.id
        WHERE i.businessId = ? AND i.is_deleted = 0 AND i.totalBaseQuantity > 100
        ORDER BY i.totalBaseQuantity DESC LIMIT 3
      `).all(bizId);
      if (overstocked.length > 0) {
        insights.push({
          type: "overstocked",
          severity: "info",
          title: "Overstocked Items",
          message: `${overstocked.map((i) => `${i.name} (${i.totalBaseQuantity} ${i.baseUnit})`).join(", ")}. Consider reducing future orders.`
        });
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const currentExpenses = db.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND businessId = ?"
      ).get(thirtyDaysAgo, bizId);
      const prevExpenses = db.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND date < ? AND businessId = ?"
      ).get(sixtyDaysAgo, thirtyDaysAgo, bizId);
      if (prevExpenses.total > 0) {
        const change = (currentExpenses.total - prevExpenses.total) / prevExpenses.total * 100;
        if (change > 30) {
          const topCategory = db.prepare(`
            SELECT category, SUM(amount) as total FROM expenses
            WHERE date >= ? AND businessId = ? GROUP BY category ORDER BY total DESC LIMIT 1
          `).get(thirtyDaysAgo, bizId);
          insights.push({
            type: "expense_increase",
            severity: "warning",
            title: "Expenses Up Significantly",
            message: `Expenses increased ${change.toFixed(0)}% vs last month${topCategory ? `. Top category: ${topCategory.category} (ETB ${(topCategory.total || 0).toLocaleString()})` : ""}. Review for potential savings.`,
            action: { label: "View Expenses", route: "/expenses" }
          });
        }
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const overrunBudgets = db.prepare(`
        SELECT b.category, b.amount as budgetAmount,
          COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.businessId = ? AND e.category = b.category AND e.date >= ? AND e.date <= ?), 0) as spent
        FROM budgets b
        WHERE b.businessId = ? AND b.month = ? AND b.year = ?
          AND COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.businessId = ? AND e.category = b.category AND e.date >= ? AND e.date <= ?), 0) > b.amount
        ORDER BY (COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.businessId = ? AND e.category = b.category AND e.date >= ? AND e.date <= ?), 0) - b.amount) DESC LIMIT 3
      `).all(bizId, monthStart, today, bizId, String(now.getMonth() + 1).padStart(2, "0"), String(now.getFullYear()), bizId, monthStart, today, bizId, monthStart, today);
      if (overrunBudgets.length > 0) {
        insights.push({
          type: "budget_overrun",
          severity: "critical",
          title: "Budget Overruns Detected",
          message: overrunBudgets.map((b) => `${b.category}: ETB ${(b.spent || 0).toLocaleString()} / ETB ${(b.budgetAmount || 0).toLocaleString()}`).join(" · "),
          action: { label: "View Budgets", route: "/budgets" }
        });
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const weeklySales = db.prepare(`
        SELECT DATE(createdAt) as date, COALESCE(SUM(totalPrice), 0) as revenue
        FROM sales WHERE DATE(createdAt) >= ? AND businessId = ? GROUP BY DATE(createdAt) ORDER BY date
      `).all(sevenDaysAgo, bizId);
      if (weeklySales.length >= 4) {
        const recent = weeklySales.slice(-2).reduce((a, d) => a + d.revenue, 0);
        const earlier = weeklySales.slice(0, -2).reduce((a, d) => a + d.revenue, 0);
        if (earlier > 0 && recent < earlier * 0.7) {
          insights.push({
            type: "sales_decline",
            severity: "critical",
            title: "Sales Declining",
            message: "Revenue has dropped significantly in recent days. Check for stock issues, competitor activity, or seasonal factors.",
            action: { label: "View Analytics", route: "/analytics" }
          });
        }
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const topCustomers = db.prepare(`
        SELECT TRIM(s.customerName) as name, COUNT(*) as count, SUM(s.totalPrice) as total
        FROM sales s WHERE DATE(s.createdAt) >= ? AND s.businessId = ? AND s.customerName IS NOT NULL AND s.customerName != ''
        GROUP BY TRIM(s.customerName) ORDER BY total DESC LIMIT 3
      `).all(thirtyDaysAgo, bizId);
      if (topCustomers.length > 0) {
        insights.push({
          type: "top_customers",
          severity: "success",
          title: "Top Customers (30 days)",
          message: topCustomers.map((c) => `${c.name} (ETB ${(c.total || 0).toLocaleString()})`).join(" · ")
        });
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const todaySales = db.prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) = ? AND businessId = ?"
      ).get(today, bizId);
      const todayExpenses = db.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ? AND businessId = ?"
      ).get(today, bizId);
      if (todaySales.count > 0 || todayExpenses.total > 0) {
        insights.push({
          type: "daily_summary",
          severity: "info",
          title: "Today's Summary",
          message: `${todaySales.count} sales · ETB ${(todaySales.revenue || 0).toLocaleString()} revenue · ETB ${(todayExpenses.total || 0).toLocaleString()} expenses`
        });
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const weekSales = db.prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND businessId = ?"
      ).get(sevenDaysAgo, bizId);
      const weekExpenses = db.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND businessId = ?"
      ).get(sevenDaysAgo, bizId);
      if (weekSales.count > 0) {
        insights.push({
          type: "weekly_summary",
          severity: "info",
          title: "This Week",
          message: `${weekSales.count} sales · ETB ${(weekSales.revenue || 0).toLocaleString()} revenue · ETB ${(weekExpenses.total || 0).toLocaleString()} expenses · Net: ETB ${((weekSales.revenue || 0) - (weekExpenses.total || 0)).toLocaleString()}`
        });
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const monthSales = db.prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND businessId = ?"
      ).get(thirtyDaysAgo, bizId);
      const monthExpenses = db.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND businessId = ?"
      ).get(thirtyDaysAgo, bizId);
      if (monthSales.count > 0) {
        insights.push({
          type: "monthly_summary",
          severity: "info",
          title: "Last 30 Days",
          message: `${monthSales.count} sales · ETB ${(monthSales.revenue || 0).toLocaleString()} revenue · ETB ${(monthExpenses.total || 0).toLocaleString()} expenses · Net: ETB ${((monthSales.revenue || 0) - (monthExpenses.total || 0)).toLocaleString()}`
        });
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const topSuppliers = db.prepare(`
        SELECT s.supplierName,
          COUNT(sp.id) as purchaseCount,
          COALESCE(SUM(sp.totalAmount), 0) as totalAmount,
          AVG(CASE WHEN sp.status = 'received' THEN julianday(sp.purchaseDate) - julianday(sp.purchaseDate) ELSE NULL END) as leadTime
        FROM suppliers s
        JOIN supplier_purchases sp ON sp.supplierId = s.id
        WHERE sp.businessId = ? AND sp.status != 'cancelled' AND sp.purchaseDate >= ?
        GROUP BY s.id ORDER BY totalAmount DESC LIMIT 2
      `).all(bizId, thirtyDaysAgo);
      if (topSuppliers.length > 0) {
        insights.push({
          type: "supplier_performance",
          severity: "info",
          title: "Top Suppliers",
          message: topSuppliers.map((s) => `${s.supplierName} (ETB ${(s.totalAmount || 0).toLocaleString()})`).join(" · "),
          action: { label: "View Suppliers", route: "/suppliers" }
        });
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const totalRevenue = db.prepare(
        "SELECT COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND businessId = ? AND paymentStatus = 'Paid'"
      ).get(thirtyDaysAgo, bizId);
      const debtSales = db.prepare(
        "SELECT COALESCE(SUM(totalPrice - paidAmount), 0) as outstanding FROM sales WHERE paymentStatus = 'Debt' AND businessId = ?"
      ).get(bizId);
      const ratio = totalRevenue.revenue > 0 ? debtSales.outstanding / totalRevenue.revenue * 100 : 0;
      if (ratio > 30) {
        insights.push({
          type: "cash_flow",
          severity: "warning",
          title: "Cash Flow Observation",
          message: `Outstanding debts (ETB ${(debtSales.outstanding || 0).toLocaleString()}) represent ${ratio.toFixed(0)}% of paid revenue. Follow up on collections to improve cash flow.`,
          action: { label: "View Debts", route: "/debt-management" }
        });
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const avgMargin = db.prepare(`
        SELECT AVG(CASE WHEN s.totalPrice > 0 THEN
          (s.totalPrice - (CASE WHEN s.unitType = 'pack' THEN s.quantity * COALESCE(i.unitsPerPack, 1) ELSE s.quantity END * COALESCE(i.basePurchasePrice, 0))) / s.totalPrice * 100
        ELSE 0 END) as avgMargin
        FROM sales s LEFT JOIN items i ON s.itemId = i.id
        WHERE DATE(s.createdAt) >= ? AND s.businessId = ? AND s.totalPrice > 0
      `).get(thirtyDaysAgo, bizId);
      if (avgMargin.avgMargin !== null && avgMargin.avgMargin < 25) {
        insights.push({
          type: "profit_suggestion",
          severity: "info",
          title: "Profit Improvement Opportunity",
          message: `Average margin is ${avgMargin.avgMargin.toFixed(1)}%. A 5% price increase across all products could boost profit by ${avgMargin.avgMargin > 0 ? Math.round(5 / avgMargin.avgMargin * 100) : 20}%.`
        });
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    try {
      const lastYearSales = db.prepare(`
        SELECT COALESCE(SUM(totalPrice), 0) as revenue FROM sales
        WHERE DATE(createdAt) >= ? AND DATE(createdAt) < ? AND businessId = ?
      `).get(thirtyDaysAgo, today, bizId);
      const lastYearPeriod = db.prepare(`
        SELECT COALESCE(SUM(totalPrice), 0) as revenue FROM sales
        WHERE DATE(createdAt) >= ? AND DATE(createdAt) < ? AND businessId = ?
      `).get(
        new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split("T")[0],
        new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 30).toISOString().split("T")[0],
        bizId
      );
      if (lastYearPeriod.revenue > 0) {
        const yoy = (lastYearSales.revenue - lastYearPeriod.revenue) / lastYearPeriod.revenue * 100;
        if (Math.abs(yoy) > 20) {
          insights.push({
            type: "seasonal_trend",
            severity: yoy > 0 ? "success" : "warning",
            title: `Year-over-Year: ${yoy >= 0 ? "+" : ""}${yoy.toFixed(0)}%`,
            message: `Revenue compared to same period last year. ${yoy >= 0 ? "Growing" : "Declining"} market trend detected.`
          });
        }
      }
    } catch (e) {
      console.error("[Search]", e);
    }
    return insights.sort((a, b) => {
      const order = { critical: 0, warning: 1, success: 2, info: 3 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    });
  });
  electron.ipcMain.handle("get-subscription-plans", () => {
    return db.prepare("SELECT * FROM subscription_plans WHERE isActive = 1 ORDER BY price ASC").all();
  });
  electron.ipcMain.handle("get-current-subscription", () => {
    const bizId = getActiveBusinessId();
    const sub = db.prepare("SELECT * FROM subscriptions WHERE businessId = ?").get(bizId);
    if (!sub) return null;
    const now = /* @__PURE__ */ new Date();
    if (sub.isTrial && sub.trialEndsAt && new Date(sub.trialEndsAt) < now && sub.status === "active") {
      sub.tier = "basic";
      sub.status = "active";
      sub.isTrial = 0;
      db.prepare("UPDATE subscriptions SET tier = ?, isTrial = 0, updatedAt = ? WHERE id = ?").run("basic", now.toISOString(), sub.id);
      db.prepare("INSERT INTO subscription_history (subscriptionId, businessId, action, oldTier, newTier, details, changedBy) VALUES (?, ?, ?, ?, ?, ?, ?)").run(sub.id, bizId, "trial_expired", "trial", "basic", "Trial period ended, auto-downgraded to Basic", "system");
      sub.tier = "basic";
      sub.isTrial = 0;
    }
    if (sub.expiresAt && new Date(sub.expiresAt) < now && sub.status === "active" && !sub.isTrial) {
      const oldTier = sub.tier;
      sub.tier = "basic";
      sub.status = "expired";
      db.prepare("UPDATE subscriptions SET status = ?, updatedAt = ? WHERE id = ?").run("expired", now.toISOString(), sub.id);
      db.prepare("INSERT INTO subscription_history (subscriptionId, businessId, action, oldTier, newTier, oldStatus, newStatus, details, changedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(sub.id, bizId, "subscription_expired", oldTier, "basic", "active", "expired", "Subscription period ended", "system");
      sub.status = "expired";
      sub.tier = "basic";
    }
    const plan = sub.planId ? db.prepare("SELECT * FROM subscription_plans WHERE id = ?").get(sub.planId) : null;
    return { ...sub, plan };
  });
  electron.ipcMain.handle("start-trial", () => {
    const bizId = getActiveBusinessId();
    const now = /* @__PURE__ */ new Date();
    const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3);
    const existing = db.prepare("SELECT id, isTrial, status FROM subscriptions WHERE businessId = ?").get(bizId);
    if (existing) {
      if (existing.isTrial) return { success: true, message: "Trial already active" };
      if (!existing.isTrial && existing.status !== "expired") {
        return { success: false, error: "Subscription already active" };
      }
      db.prepare("UPDATE subscriptions SET tier = ?, status = ?, isTrial = 1, trialStartedAt = ?, trialEndsAt = ?, startedAt = ?, expiresAt = ?, updatedAt = ? WHERE id = ?").run("trial", "active", now.toISOString(), trialEnd.toISOString(), now.toISOString(), trialEnd.toISOString(), now.toISOString(), existing.id);
    } else {
      db.prepare("INSERT INTO subscriptions (businessId, tier, status, isTrial, trialStartedAt, trialEndsAt, startedAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(bizId, "trial", "active", 1, now.toISOString(), trialEnd.toISOString(), now.toISOString(), trialEnd.toISOString());
    }
    db.prepare("INSERT INTO subscription_history (subscriptionId, businessId, action, oldTier, newTier, details, changedBy) VALUES (?, ?, ?, ?, ?, ?, ?)").run(existing?.id || db.prepare("SELECT id FROM subscriptions WHERE businessId = ?").get(bizId).id, bizId, "trial_started", existing?.tier || "none", "trial", "7-day premium trial started", currentUserName || "system");
    return { success: true };
  });
  electron.ipcMain.handle("submit-payment", (_, data) => {
    const bizId = getActiveBusinessId();
    const result = db.prepare(`
      INSERT INTO payment_transactions (businessId, transactionId, businessName, phoneNumber, selectedPlan, amount, paymentDate, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(bizId, data.transactionId, data.businessName, data.phoneNumber, data.selectedPlan, data.amount, data.paymentDate, data.notes || null);
    db.prepare("INSERT INTO subscription_history (subscriptionId, businessId, action, details, changedBy) VALUES (?, ?, ?, ?, ?)").run(null, bizId, "payment_submitted", `Payment submitted for plan "${data.selectedPlan}" (Transaction: ${data.transactionId})`, currentUserName || "system");
    return { success: true, id: result.lastInsertRowid };
  });
  electron.ipcMain.handle("get-payment-transactions", (_, options) => {
    const bizId = getActiveBusinessId();
    let query = "SELECT * FROM payment_transactions WHERE businessId = ?";
    const params = [bizId];
    if (options?.status) {
      query += " AND status = ?";
      params.push(options.status);
    }
    query += " ORDER BY createdAt DESC";
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-all-payment-transactions", (_, options) => {
    requirePermission("settings");
    let query = "SELECT pt.*, b.businessName as bizName FROM payment_transactions pt LEFT JOIN businesses b ON pt.businessId = b.id";
    const params = [];
    if (options?.status) {
      query += " WHERE pt.status = ?";
      params.push(options.status);
    }
    query += " ORDER BY pt.createdAt DESC";
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("approve-payment", (_, data) => {
    requirePermission("settings");
    getActiveBusinessId();
    const tx = db.prepare("SELECT * FROM payment_transactions WHERE id = ?").get(data.transactionId);
    if (!tx) return { success: false, error: "Transaction not found" };
    const plan = db.prepare("SELECT * FROM subscription_plans WHERE name = ?").get(tx.selectedPlan);
    if (!plan) return { success: false, error: "Plan not found" };
    const now = /* @__PURE__ */ new Date();
    const expiresAt = new Date(now.getTime() + plan.durationMonths * 30 * 24 * 60 * 60 * 1e3);
    const existingSub = db.prepare("SELECT id, tier FROM subscriptions WHERE businessId = ?").get(tx.businessId);
    const oldTier = existingSub?.tier || "basic";
    if (existingSub) {
      db.prepare(`
        UPDATE subscriptions SET planId = ?, tier = ?, status = 'active', isTrial = 0, startedAt = ?, expiresAt = ?, updatedAt = ?
        WHERE id = ?
      `).run(plan.id, plan.tier, now.toISOString(), expiresAt.toISOString(), now.toISOString(), existingSub.id);
    } else {
      const r = db.prepare(`
        INSERT INTO subscriptions (businessId, planId, tier, status, startedAt, expiresAt)
        VALUES (?, ?, ?, 'active', ?, ?)
      `).run(tx.businessId, plan.id, plan.tier, now.toISOString(), expiresAt.toISOString());
      data.subscriptionId = r.lastInsertRowid;
    }
    db.prepare("UPDATE payment_transactions SET status = ?, verifiedBy = ?, verifiedAt = ?, subscriptionId = ? WHERE id = ?").run("approved", currentAdminId, now.toISOString(), existingSub?.id || data.subscriptionId, data.transactionId);
    db.prepare("INSERT INTO subscription_history (subscriptionId, businessId, action, oldTier, newTier, details, changedBy) VALUES (?, ?, ?, ?, ?, ?, ?)").run(existingSub?.id || data.subscriptionId, tx.businessId, "payment_approved", oldTier, plan.tier, `Payment #${tx.id} approved. Plan: ${tx.selectedPlan}`, currentUserName || "system");
    return { success: true };
  });
  electron.ipcMain.handle("reject-payment", (_, data) => {
    requirePermission("settings");
    const tx = db.prepare("SELECT * FROM payment_transactions WHERE id = ?").get(data.transactionId);
    if (!tx) return { success: false, error: "Transaction not found" };
    db.prepare("UPDATE payment_transactions SET status = ?, adminNotes = ?, verifiedBy = ?, verifiedAt = ? WHERE id = ?").run("rejected", data.reason, currentAdminId, (/* @__PURE__ */ new Date()).toISOString(), data.transactionId);
    db.prepare("INSERT INTO subscription_history (subscriptionId, businessId, action, details, changedBy) VALUES (?, ?, ?, ?, ?)").run(null, tx.businessId, "payment_rejected", `Payment #${tx.id} rejected. Reason: ${data.reason}`, currentUserName || "system");
    return { success: true };
  });
  electron.ipcMain.handle("get-subscription-history", () => {
    const bizId = getActiveBusinessId();
    return db.prepare("SELECT * FROM subscription_history WHERE businessId = ? ORDER BY createdAt DESC").all(bizId);
  });
  electron.ipcMain.handle("get-renewal-info", () => {
    const bizId = getActiveBusinessId();
    const sub = db.prepare("SELECT * FROM subscriptions WHERE businessId = ?").get(bizId);
    if (!sub || !sub.expiresAt) return null;
    const now = /* @__PURE__ */ new Date();
    const expiry = new Date(sub.expiresAt);
    const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24));
    return {
      daysRemaining: Math.max(0, daysRemaining),
      expiresAt: sub.expiresAt,
      isExpired: daysRemaining <= 0,
      needsRenewal: daysRemaining <= 7,
      tier: sub.tier,
      status: sub.status,
      isTrial: !!sub.isTrial
    };
  });
  electron.ipcMain.handle("check-premium-feature", (_, feature) => {
    const bizId = getActiveBusinessId();
    const sub = db.prepare("SELECT tier, isTrial, status, expiresAt FROM subscriptions WHERE businessId = ?").get(bizId);
    if (!sub) return { allowed: false, reason: "no_subscription" };
    if (sub.status !== "active") return { allowed: false, reason: "subscription_not_active" };
    const isPremium = sub.tier === "premium" || sub.isTrial;
    if (!isPremium) return { allowed: false, reason: "requires_premium" };
    if (!sub.isTrial && sub.expiresAt && new Date(sub.expiresAt) < /* @__PURE__ */ new Date()) {
      return { allowed: false, reason: "subscription_expired" };
    }
    return { allowed: true };
  });
  electron.ipcMain.handle("get-subscription-stats", () => {
    const allSubs = db.prepare(`
      SELECT s.tier, s.status, s.isTrial, s.expiresAt, s.businessId, b.businessName as bizName
      FROM subscriptions s LEFT JOIN businesses b ON s.businessId = b.id
    `).all();
    return {
      total: allSubs.length,
      active: allSubs.filter((s) => s.status === "active").length,
      trial: allSubs.filter((s) => s.isTrial).length,
      premium: allSubs.filter((s) => s.tier === "premium").length,
      basic: allSubs.filter((s) => s.tier === "basic" && !s.isTrial).length,
      expired: allSubs.filter((s) => s.status === "expired").length,
      pendingPayments: db.prepare("SELECT COUNT(*) as c FROM payment_transactions WHERE status = 'pending'").get().c
    };
  });
  electron.ipcMain.handle("check-trial-availability", () => {
    const bizId = getActiveBusinessId();
    const sub = db.prepare("SELECT isTrial, tier, status FROM subscriptions WHERE businessId = ?").get(bizId);
    if (!sub) return { available: true };
    if (sub.isTrial) return { available: false, reason: "already_on_trial", trialActive: true };
    if (sub.status === "expired" && !sub.isTrial) return { available: false, reason: "already_used_trial" };
    if (sub.status === "active" && sub.tier !== "basic") return { available: false, reason: "already_subscribed" };
    return { available: true };
  });
  electron.ipcMain.handle("debug:ping", () => {
    return { ok: true, timestamp: (/* @__PURE__ */ new Date()).toISOString(), handlersRegistered: true };
  });
  console.log("[Handlers] All IPC handlers registered successfully");
}
process.on("uncaughtException", (error) => {
  console.error("[FATAL] Uncaught exception:", error);
});
process.on("unhandledRejection", (reason) => {
  console.error("[FATAL] Unhandled rejection:", reason);
});
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../../src/assets/images/logo.ico"),
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  if (process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  mainWindow.webContents.on("console-message", (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console]: ${message} (Line ${line} in ${sourceId})`);
  });
}
electron.app.whenReady().then(() => {
  initDB();
  registerIPCHandlers();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
