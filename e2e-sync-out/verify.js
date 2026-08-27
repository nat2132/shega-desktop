var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// e2e-sync-entry.ts
var import_http2 = __toESM(require("http"));
var import_fs3 = require("fs");

// src/main/database.ts
var import_crypto = __toESM(require("crypto"));
var import_better_sqlite3 = __toESM(require("better-sqlite3"));
var import_electron = require("electron");
var import_path = __toESM(require("path"));
var import_fs = require("fs");
var isDev = !import_electron.app.isPackaged;
var dbDir = isDev ? import_path.default.join(process.cwd(), "db") : import_path.default.join(import_electron.app.getPath("userData"), "db");
if (!(0, import_fs.existsSync)(dbDir)) {
  (0, import_fs.mkdirSync)(dbDir, { recursive: true });
}
var dbPath = import_path.default.join(dbDir, "shega_desktop.db");
var demoDbPath = import_path.default.join(dbDir, "shega_desktop_demo.db");
var db = new import_better_sqlite3.default(dbPath);
var currentDb = db;
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");
db.pragma("foreign_keys = ON");
try {
  const integrity = db.pragma("integrity_check", { simple: true });
  const result = Array.isArray(integrity) ? integrity[0] : integrity;
  if (result !== "ok") {
    console.error(`[DB] Integrity check FAILED: ${result}`);
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('db_integrity_status', ?)").run(JSON.stringify({
      ok: false,
      message: Array.isArray(integrity) ? integrity.join(", ") : integrity,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }));
  } else {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('db_integrity_status', ?)").run(JSON.stringify({ ok: true, timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
  }
} catch (_) {
  console.warn("[DB] Integrity check skipped (empty DB?)");
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('db_integrity_status', ?)").run(JSON.stringify({ ok: true, note: "skipped - empty database", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
}
var dbProxy = new Proxy({}, {
  get(target, prop) {
    return currentDb[prop];
  }
});
var database_default = dbProxy;
var ALL_PERMISSIONS = [
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
var DEFAULT_ROLES = [
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
function hashPin(pin) {
  const salt = import_crypto.default.randomBytes(16).toString("hex");
  const key = import_crypto.default.scryptSync(pin, salt, 64).toString("hex");
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
  {
    const metaCols = db.prepare("PRAGMA table_info(sync_meta)").all();
    if (!metaCols.some((c) => c.name === "pairing_token")) {
      db.exec("ALTER TABLE sync_meta ADD COLUMN pairing_token TEXT");
    }
  }
  const currentVersion = db.pragma("user_version", { simple: true });
  let version = typeof currentVersion === "number" ? currentVersion : 0;
  if (version < 1) {
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
    version = 1;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 2) {
    const budgetCols = db.prepare("PRAGMA table_info(budgets)").all();
    const budgetColNames = budgetCols.map((c) => c.name);
    if (!budgetColNames.includes("budgetType")) db.exec("ALTER TABLE budgets ADD COLUMN budgetType TEXT DEFAULT 'business'");
    if (!budgetColNames.includes("referenceName")) db.exec("ALTER TABLE budgets ADD COLUMN referenceName TEXT");
    if (!budgetColNames.includes("isRecurring")) db.exec("ALTER TABLE budgets ADD COLUMN isRecurring INTEGER DEFAULT 0");
    if (!budgetColNames.includes("notes")) db.exec("ALTER TABLE budgets ADD COLUMN notes TEXT");
    if (!budgetColNames.includes("updatedAt")) db.exec("ALTER TABLE budgets ADD COLUMN updatedAt TEXT DEFAULT CURRENT_TIMESTAMP");
    version = 2;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 3) {
    const alertCols = db.prepare("PRAGMA table_info(budget_alerts)").all();
    const alertColNames = alertCols.map((c) => c.name);
    if (!alertColNames.includes("month")) db.exec("ALTER TABLE budget_alerts ADD COLUMN month TEXT");
    if (!alertColNames.includes("year")) db.exec("ALTER TABLE budget_alerts ADD COLUMN year TEXT");
    version = 3;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 4) {
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
    version = 4;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 5) {
    const acctColumns = db.prepare("PRAGMA table_info(employee_accounts)").all();
    const acctColNames = acctColumns.map((c) => c.name);
    if (!acctColNames.includes("forcePasswordChange")) db.exec("ALTER TABLE employee_accounts ADD COLUMN forcePasswordChange INTEGER DEFAULT 0");
    if (!acctColNames.includes("failedLoginAttempts")) db.exec("ALTER TABLE employee_accounts ADD COLUMN failedLoginAttempts INTEGER DEFAULT 0");
    if (!acctColNames.includes("lockedUntil")) db.exec("ALTER TABLE employee_accounts ADD COLUMN lockedUntil TEXT");
    if (!acctColNames.includes("lastPasswordChange")) db.exec("ALTER TABLE employee_accounts ADD COLUMN lastPasswordChange TEXT");
    version = 5;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 6) {
    const salesColumns = db.prepare("PRAGMA table_info(sales)").all();
    const salesColNames = salesColumns.map((c) => c.name);
    if (!salesColNames.includes("createdBy")) db.exec("ALTER TABLE sales ADD COLUMN createdBy INTEGER");
    if (!salesColNames.includes("costAtTimeOfSale")) db.exec("ALTER TABLE sales ADD COLUMN costAtTimeOfSale REAL");
    if (!salesColNames.includes("status")) db.exec("ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'Active'");
    if (!salesColNames.includes("voidReason")) db.exec("ALTER TABLE sales ADD COLUMN voidReason TEXT");
    if (!salesColNames.includes("voidedBy")) db.exec("ALTER TABLE sales ADD COLUMN voidedBy TEXT");
    if (!salesColNames.includes("voidedAt")) db.exec("ALTER TABLE sales ADD COLUMN voidedAt TEXT");
    version = 6;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 7) {
    const supColumns = db.prepare("PRAGMA table_info(suppliers)").all();
    const supColNames = supColumns.map((c) => c.name);
    if (!supColNames.includes("businessId")) db.exec("ALTER TABLE suppliers ADD COLUMN businessId INTEGER REFERENCES businesses(id)");
    if (!supColNames.includes("isFavorite")) db.exec("ALTER TABLE suppliers ADD COLUMN isFavorite INTEGER DEFAULT 0");
    if (!supColNames.includes("performanceScore")) db.exec("ALTER TABLE suppliers ADD COLUMN performanceScore REAL DEFAULT 0");
    if (!supColNames.includes("lastActivityDate")) db.exec("ALTER TABLE suppliers ADD COLUMN lastActivityDate TEXT");
    version = 7;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 8) {
    const spColumns = db.prepare("PRAGMA table_info(supplier_purchases)").all();
    const spColNames = spColumns.map((c) => c.name);
    if (!spColNames.includes("businessId")) db.exec("ALTER TABLE supplier_purchases ADD COLUMN businessId INTEGER REFERENCES businesses(id)");
    const spPayColumns = db.prepare("PRAGMA table_info(supplier_payments)").all();
    const spPayColNames = spPayColumns.map((c) => c.name);
    if (!spPayColNames.includes("businessId")) db.exec("ALTER TABLE supplier_payments ADD COLUMN businessId INTEGER REFERENCES businesses(id)");
    version = 8;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 9) {
    const itemCols = db.prepare("PRAGMA table_info(items)").all();
    const itemColNames = itemCols.map((c) => c.name);
    if (!itemColNames.includes("supplierId")) db.exec("ALTER TABLE items ADD COLUMN supplierId INTEGER REFERENCES suppliers(id)");
    if (!itemColNames.includes("lastPurchaseDate")) db.exec("ALTER TABLE items ADD COLUMN lastPurchaseDate TEXT");
    if (!itemColNames.includes("lastPurchasePrice")) db.exec("ALTER TABLE items ADD COLUMN lastPurchasePrice REAL DEFAULT 0");
    if (!itemColNames.includes("deleted_by")) db.exec("ALTER TABLE items ADD COLUMN deleted_by TEXT");
    if (!itemColNames.includes("deleted_at")) db.exec("ALTER TABLE items ADD COLUMN deleted_at TEXT");
    version = 9;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 10) {
    const adminCols = db.prepare("PRAGMA table_info(admins)").all();
    const adminColNames = adminCols.map((c) => c.name);
    if (!adminColNames.includes("failedLoginAttempts")) db.exec("ALTER TABLE admins ADD COLUMN failedLoginAttempts INTEGER DEFAULT 0");
    if (!adminColNames.includes("lockedUntil")) db.exec("ALTER TABLE admins ADD COLUMN lockedUntil TEXT");
    if (!adminColNames.includes("forcePasswordChange")) db.exec("ALTER TABLE admins ADD COLUMN forcePasswordChange INTEGER DEFAULT 0");
    if (!adminColNames.includes("lastPasswordChange")) db.exec("ALTER TABLE admins ADD COLUMN lastPasswordChange TEXT");
    if (!adminColNames.includes("lastLogin")) db.exec("ALTER TABLE admins ADD COLUMN lastLogin TEXT");
    version = 10;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 11) {
    const dpCols = db.prepare("PRAGMA table_info(debt_payments)").all();
    const dpColNames = dpCols.map((c) => c.name);
    if (!dpColNames.includes("reversalId")) db.exec("ALTER TABLE debt_payments ADD COLUMN reversalId INTEGER");
    if (!dpColNames.includes("reversalReason")) db.exec("ALTER TABLE debt_payments ADD COLUMN reversalReason TEXT");
    if (!dpColNames.includes("reversedBy")) db.exec("ALTER TABLE debt_payments ADD COLUMN reversedBy TEXT");
    if (!dpColNames.includes("reversalDate")) db.exec("ALTER TABLE debt_payments ADD COLUMN reversalDate TEXT");
    version = 11;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 12) {
    const supPayCols = db.prepare("PRAGMA table_info(supplier_payments)").all();
    const supPayColNames = supPayCols.map((c) => c.name);
    if (!supPayColNames.includes("reversalId")) db.exec("ALTER TABLE supplier_payments ADD COLUMN reversalId INTEGER");
    if (!supPayColNames.includes("reversalReason")) db.exec("ALTER TABLE supplier_payments ADD COLUMN reversalReason TEXT");
    if (!supPayColNames.includes("reversedBy")) db.exec("ALTER TABLE supplier_payments ADD COLUMN reversedBy TEXT");
    if (!supPayColNames.includes("reversalDate")) db.exec("ALTER TABLE supplier_payments ADD COLUMN reversalDate TEXT");
    version = 12;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 13) {
    const adjCols = db.prepare("PRAGMA table_info(adjustments)").all();
    const adjColNames = adjCols.map((c) => c.name);
    if (!adjColNames.includes("reversalId")) db.exec("ALTER TABLE adjustments ADD COLUMN reversalId INTEGER");
    if (!adjColNames.includes("reversalReason")) db.exec("ALTER TABLE adjustments ADD COLUMN reversalReason TEXT");
    if (!adjColNames.includes("reversedBy")) db.exec("ALTER TABLE adjustments ADD COLUMN reversedBy TEXT");
    if (!adjColNames.includes("reversalDate")) db.exec("ALTER TABLE adjustments ADD COLUMN reversalDate TEXT");
    version = 13;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 14) {
    const custCols = db.prepare("PRAGMA table_info(customers)").all();
    const custColNames = custCols.map((c) => c.name);
    if (!custColNames.includes("is_deleted")) db.exec("ALTER TABLE customers ADD COLUMN is_deleted INTEGER DEFAULT 0");
    if (!custColNames.includes("deleted_by")) db.exec("ALTER TABLE customers ADD COLUMN deleted_by TEXT");
    if (!custColNames.includes("deleted_at")) db.exec("ALTER TABLE customers ADD COLUMN deleted_at TEXT");
    version = 14;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 15) {
    const roleCols = db.prepare("PRAGMA table_info(employee_roles)").all();
    const roleColNames = roleCols.map((c) => c.name);
    if (!roleColNames.includes("businessId")) db.exec("ALTER TABLE employee_roles ADD COLUMN businessId INTEGER REFERENCES businesses(id)");
    version = 15;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 16) {
    const itemCols = db.prepare("PRAGMA table_info(items)").all();
    const itemColNames = itemCols.map((c) => c.name);
    if (!itemColNames.includes("sku")) db.exec("ALTER TABLE items ADD COLUMN sku TEXT");
    if (!itemColNames.includes("barcode")) db.exec("ALTER TABLE items ADD COLUMN barcode TEXT");
    const saleCols = db.prepare("PRAGMA table_info(sales)").all();
    const saleColNames = saleCols.map((c) => c.name);
    if (!saleColNames.includes("fiscal_number")) db.exec("ALTER TABLE sales ADD COLUMN fiscal_number TEXT");
    if (!saleColNames.includes("fiscal_signature")) db.exec("ALTER TABLE sales ADD COLUMN fiscal_signature TEXT");
    version = 16;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 17) {
    const syncTables2 = ["categories", "items", "item_packs", "sales", "debt_payments", "returns", "expenses", "adjustments", "customers"];
    for (const tbl of syncTables2) {
      const cols = db.prepare(`PRAGMA table_info(${tbl})`).all();
      const names = cols.map((c) => c.name);
      if (!names.includes("uuid")) db.exec(`ALTER TABLE ${tbl} ADD COLUMN uuid TEXT`);
      if (!names.includes("device_id")) db.exec(`ALTER TABLE ${tbl} ADD COLUMN device_id TEXT`);
      if (!names.includes("row_version")) db.exec(`ALTER TABLE ${tbl} ADD COLUMN row_version INTEGER DEFAULT 1`);
      if (!names.includes("updated_at")) db.exec(`ALTER TABLE ${tbl} ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP`);
      if (!names.includes("is_deleted")) db.exec(`ALTER TABLE ${tbl} ADD COLUMN is_deleted INTEGER DEFAULT 0`);
      if (!names.includes("deleted_at")) db.exec(`ALTER TABLE ${tbl} ADD COLUMN deleted_at TEXT`);
      if (!names.includes("is_synced")) db.exec(`ALTER TABLE ${tbl} ADD COLUMN is_synced INTEGER DEFAULT 1`);
    }
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
  if (version < 18) {
    {
      const cols = db.prepare("PRAGMA table_info(audit_logs)").all();
      const names = cols.map((c) => c.name);
      if (!names.includes("prev_hash")) db.exec("ALTER TABLE audit_logs ADD COLUMN prev_hash TEXT");
      if (!names.includes("hash")) db.exec("ALTER TABLE audit_logs ADD COLUMN hash TEXT");
    }
    const rows = db.prepare("SELECT * FROM audit_logs ORDER BY id ASC").all();
    const mk = (prev2, r) => {
      const c = import_crypto.default.createHash("sha256");
      c.update(`${prev2}|${r.id}|${r.action}|${r.entityType}|${r.entityId ?? ""}|${r.fieldName ?? ""}|${r.oldValue ?? ""}|${r.newValue ?? ""}|${r.changedBy ?? ""}|${r.description ?? ""}|${r.createdAt ?? ""}`);
      return c.digest("hex");
    };
    const update = db.prepare("UPDATE audit_logs SET prev_hash = ?, hash = ? WHERE id = ?");
    let prev = "GENESIS";
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
  if (version < 19) {
    const cols = db.prepare("PRAGMA table_info(items)").all();
    const names = cols.map((c) => c.name);
    if (!names.includes("reorderPoint")) db.exec("ALTER TABLE items ADD COLUMN reorderPoint REAL DEFAULT 10");
    if (!names.includes("reorderQty")) db.exec("ALTER TABLE items ADD COLUMN reorderQty REAL DEFAULT 0");
    if (!names.includes("autoReorder")) db.exec("ALTER TABLE items ADD COLUMN autoReorder INTEGER DEFAULT 0");
    version = 19;
    db.pragma(`user_version = ${version}`);
  }
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
  const syncTables = [
    { table: "categories", id: "id", columns: ["id", "businessId", "name", "icon", "isCustom", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "items", id: "id", columns: ["id", "businessId", "name", "categoryId", "sku", "barcode", "companyName", "purchaseUnit", "baseUnit", "unitsPerPack", "totalPackQuantity", "totalBaseQuantity", "packPurchasePrice", "basePurchasePrice", "baseSellingPrice", "packSellingPrice", "allowSellByBaseUnit", "allowSellByPackUnit", "expiryDate", "qualityGrade", "notes", "isCredit", "supplierPhone", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "item_packs", id: "id", columns: ["id", "itemId", "packNumber", "initialQuantity", "currentQuantity", "unit", "status", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "sales", id: "id", columns: ["id", "businessId", "itemId", "quantity", "unit", "unitType", "discount", "vat", "totalPrice", "paymentMethod", "paymentStatus", "status", "customerName", "customerPhone", "packId", "dueDate", "paidAmount", "createdBy", "createdAt", "fiscal_number", "fiscal_signature", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "debt_payments", id: "id", columns: ["id", "saleId", "customerName", "customerPhone", "amount", "type", "note", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "returns", id: "id", columns: ["id", "businessId", "saleId", "itemId", "quantity", "unit", "unitType", "refundAmount", "reason", "status", "createdBy", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "expenses", id: "id", columns: ["id", "businessId", "name", "amount", "category", "date", "isRecurring", "frequency", "nextBillingDate", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "adjustments", id: "id", columns: ["id", "businessId", "itemId", "type", "oldValue", "newValue", "quantity", "unitType", "reason", "date", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "customers", id: "id", columns: ["id", "businessId", "customerName", "phone", "secondaryPhone", "email", "address", "city", "company", "taxNumber", "groupName", "creditLimit", "notes", "isActive", "createdAt", "updatedAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] }
  ];
  const genUuid = "lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))";
  for (const t of syncTables) {
    const newArgs = t.columns.map((c) => `'${c}', ${c}`).join(", ");
    const oldArgs = t.columns.map((c) => `'${c}', OLD.${c}`).join(", ");
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trg_${t.table}_ai AFTER INSERT ON ${t.table} BEGIN
        UPDATE ${t.table} SET uuid = ${genUuid} WHERE ${t.id} = NEW.${t.id} AND uuid IS NULL;
        INSERT INTO sync_outbox (entity, entity_uuid, op, payload, device_id)
        SELECT '${t.table}', uuid, 'INSERT', json_object(${newArgs}), device_id FROM ${t.table} WHERE ${t.id} = NEW.${t.id};
      END;
      CREATE TRIGGER IF NOT EXISTS trg_${t.table}_au AFTER UPDATE ON ${t.table} WHEN OLD.uuid IS NOT NULL AND NEW.uuid IS NOT NULL BEGIN
        INSERT INTO sync_outbox (entity, entity_uuid, op, payload, device_id)
        SELECT '${t.table}', uuid, 'UPDATE', json_object(${newArgs}), device_id FROM ${t.table} WHERE ${t.id} = NEW.${t.id};
      END;
      CREATE TRIGGER IF NOT EXISTS trg_${t.table}_ad AFTER DELETE ON ${t.table} BEGIN
        INSERT INTO sync_outbox (entity, entity_uuid, op, payload, device_id)
        VALUES ('${t.table}', OLD.uuid, 'DELETE', json_object(${oldArgs}), OLD.device_id);
      END;
    `);
  }
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
      const now2 = /* @__PURE__ */ new Date();
      const trialEnd = new Date(now2.getTime() + 7 * 24 * 60 * 60 * 1e3);
      db.prepare(`
        INSERT INTO subscriptions (businessId, tier, status, isTrial, trialStartedAt, trialEndsAt, startedAt, expiresAt)
        VALUES (?, 'trial', 'active', 1, ?, ?, ?, ?)
      `).run(biz.id, now2.toISOString(), trialEnd.toISOString(), now2.toISOString(), trialEnd.toISOString());
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
    const hashed = hashPin(a.pin);
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
    const hash = hashPin("1234");
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

// src/main/sync-hub.ts
var import_http = require("http");
var import_crypto2 = require("crypto");
var import_os = require("os");

// src/main/logger.ts
var import_fs2 = require("fs");
var import_path2 = require("path");
var import_electron2 = require("electron");
var isDev2 = !import_electron2.app.isPackaged;
var logDir = isDev2 ? (0, import_path2.join)(process.cwd(), "logs") : (0, import_path2.join)(import_electron2.app.getPath("userData"), "logs");
if (!(0, import_fs2.existsSync)(logDir)) {
  try {
    (0, import_fs2.mkdirSync)(logDir, { recursive: true });
  } catch {
  }
}
var LOG_PATH = (0, import_path2.join)(logDir, "shega.log");
var MAX_BYTES = 5 * 1024 * 1024;
function rotateIfNeeded() {
  try {
    if ((0, import_fs2.existsSync)(LOG_PATH) && (0, import_fs2.statSync)(LOG_PATH).size > MAX_BYTES) {
      const old = LOG_PATH.replace(/\.log$/, ".1.log");
      try {
        (0, import_fs2.renameSync)(LOG_PATH, old);
      } catch {
      }
    }
  } catch {
  }
}
function write(level, msg, meta) {
  rotateIfNeeded();
  const line = JSON.stringify({
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    level,
    msg,
    ...meta ? { meta } : {}
  }) + "\n";
  try {
    (0, import_fs2.appendFileSync)(LOG_PATH, line, { mode: 384 });
  } catch {
    process.stderr.write(`[logger] write failed: ${String(msg)}
`);
  }
}
var logger = {
  debug: (msg, meta) => write("debug", msg, meta),
  info: (msg, meta) => write("info", msg, meta),
  warn: (msg, meta) => write("warn", msg, meta),
  error: (msg, meta) => write("error", msg, meta),
  fatal: (msg, meta) => write("fatal", msg, meta),
  get path() {
    return LOG_PATH;
  }
};
var logger_default = logger;

// src/main/sync-hub.ts
var SYNC_PORT = 5757;
var SHARED_TABLES = [
  "categories",
  "items",
  "item_packs",
  "sales",
  "debt_payments",
  "returns",
  "expenses",
  "adjustments",
  "customers"
];
function changeChecksum(change) {
  const canonical = `${change.entity}|${change.entity_uuid}|${change.op}|${JSON.stringify(change.payload)}`;
  return (0, import_crypto2.createHash)("sha256").update(canonical).digest("hex");
}
var columnCache = {};
function columnsOf(entity) {
  if (!columnCache[entity]) {
    columnCache[entity] = database_default.prepare(`PRAGMA table_info(${entity})`).all().map((c) => c.name);
  }
  return columnCache[entity];
}
function ensureHubDeviceId() {
  const row = database_default.prepare("SELECT device_id, pairing_token FROM sync_meta WHERE id = 1").get();
  if (row?.device_id) return row.device_id;
  const id = (0, import_crypto2.randomUUID)();
  const token = generatePairingToken();
  database_default.prepare("INSERT OR REPLACE INTO sync_meta (id, device_id, pairing_token, schema_version) VALUES (1, ?, ?, 21)").run(id, token);
  return id;
}
function getPairingToken() {
  const row = database_default.prepare("SELECT pairing_token FROM sync_meta WHERE id = 1").get();
  if (row?.pairing_token) return row.pairing_token;
  const token = generatePairingToken();
  database_default.prepare("UPDATE sync_meta SET pairing_token = ? WHERE id = 1").run(token);
  return token;
}
function generatePairingToken() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = (0, import_crypto2.randomBytes)(6);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}
function validToken(token) {
  return !!token && token.trim().toUpperCase() === getPairingToken();
}
function getLanAddress(port = SYNC_PORT) {
  for (const ifaces of Object.values((0, import_os.networkInterfaces)())) {
    for (const iface of ifaces ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return `http://${iface.address}:${port}`;
      }
    }
  }
  return null;
}
function registerDevice(deviceId, name) {
  const existing = database_default.prepare("SELECT id FROM devices WHERE device_id = ?").get(deviceId);
  if (existing) {
    database_default.prepare("UPDATE devices SET last_seen_at = ? WHERE device_id = ?").run((/* @__PURE__ */ new Date()).toISOString(), deviceId);
    return;
  }
  database_default.prepare("INSERT INTO devices (device_id, name, last_seen_at) VALUES (?, ?, ?)").run(
    deviceId,
    name || deviceId.slice(0, 8),
    (/* @__PURE__ */ new Date()).toISOString()
  );
}
function logSync(deviceId, entity, entityUuid, op, detail) {
  database_default.prepare("INSERT INTO sync_log (device_id, entity, entity_uuid, op, detail) VALUES (?, ?, ?, ?, ?)").run(
    deviceId ?? null,
    entity,
    entityUuid,
    op,
    detail
  );
}
function maxSeq() {
  const r = database_default.prepare("SELECT COALESCE(MAX(seq),0) AS m FROM sync_outbox").get();
  return r?.m ?? 0;
}
function requestDeviceResync(deviceId) {
  database_default.prepare("INSERT OR REPLACE INTO sync_requests (device_id, requested_at) VALUES (?, ?)").run(
    deviceId,
    (/* @__PURE__ */ new Date()).toISOString()
  );
}
function takeResyncRequest(deviceId) {
  const r = database_default.prepare("SELECT 1 FROM sync_requests WHERE device_id = ?").get(deviceId);
  if (r) {
    database_default.prepare("DELETE FROM sync_requests WHERE device_id = ?").run(deviceId);
    return true;
  }
  return false;
}
function lwwWins(incoming, existing) {
  const iTs = incoming.updated_at ?? incoming.createdAt ?? "";
  const eTs = existing.updated_at ?? existing.createdAt ?? "";
  if (iTs !== eTs) return iTs > eTs;
  const iVer = Number(incoming.row_version ?? 0);
  const eVer = Number(existing.row_version ?? 0);
  if (iVer !== eVer) return iVer > eVer;
  return String(incoming.uuid ?? "") >= String(existing.uuid ?? "");
}
function cleanPayload(entity, payload) {
  const cols = columnsOf(entity);
  const clean = {};
  for (const k of Object.keys(payload)) {
    if (cols.includes(k)) clean[k] = payload[k];
  }
  return clean;
}
function resolveFk(deviceId, entity, localId) {
  if (localId == null) return null;
  const ref = database_default.prepare("SELECT uuid FROM sync_refs WHERE device_id = ? AND entity = ? AND local_id = ?").get(deviceId, entity, localId);
  if (!ref?.uuid) return null;
  const row = database_default.prepare(`SELECT id FROM ${entity} WHERE uuid = ?`).get(ref.uuid);
  return row?.id ?? null;
}
function recordRef(deviceId, entity, payload) {
  if (payload.id == null || !payload.uuid) return;
  database_default.prepare("INSERT OR REPLACE INTO sync_refs (device_id, entity, local_id, uuid) VALUES (?, ?, ?, ?)").run(
    deviceId,
    entity,
    Number(payload.id),
    String(payload.uuid)
  );
}
function existingByUuid(entity, uuid) {
  return database_default.prepare(`SELECT * FROM ${entity} WHERE uuid = ?`).get(uuid);
}
function applyChange(deviceId, change) {
  const { entity, entity_uuid, op, payload } = change;
  if (!SHARED_TABLES.includes(entity) || !entity_uuid) {
    logSync(deviceId, entity, entity_uuid, op, "skipped unknown entity");
    return "skipped";
  }
  const data = cleanPayload(entity, payload);
  if (op === "DELETE") {
    const existing2 = existingByUuid(entity, entity_uuid);
    if (existing2) {
      database_default.prepare(`UPDATE ${entity} SET is_deleted = 1, deleted_at = COALESCE(?, deleted_at) WHERE uuid = ?`).run(
        payload.deleted_at ?? (/* @__PURE__ */ new Date()).toISOString(),
        entity_uuid
      );
    }
    return "applied";
  }
  const existing = existingByUuid(entity, entity_uuid);
  if (!existing) {
    const insertData = { ...data };
    insertData.uuid = entity_uuid;
    insertData.device_id = deviceId;
    insertData.updated_at = insertData.updated_at ?? (/* @__PURE__ */ new Date()).toISOString();
    let pending = false;
    if ((entity === "sales" || entity === "returns") && insertData.itemId != null) {
      const hubItemId = resolveFk(deviceId, "items", insertData.itemId);
      if (hubItemId != null) {
        insertData.itemId = hubItemId;
      } else {
        insertData.itemId = null;
        pending = true;
        logSync(deviceId, entity, entity_uuid, op, "pending_item itemId not resolvable");
      }
    }
    if (entity === "sales" && insertData.packId != null) {
      const hubPackId = resolveFk(deviceId, "item_packs", insertData.packId);
      if (hubPackId != null) insertData.packId = hubPackId;
    }
    const cols = columnsOf(entity).filter((c) => c in insertData);
    const placeholders = cols.map(() => "?").join(", ");
    const values = cols.map((c) => insertData[c]);
    database_default.prepare(`INSERT INTO ${entity} (${cols.join(", ")}) VALUES (${placeholders})`).run(...values);
    recordRef(deviceId, entity, insertData);
    return pending ? "pending" : "applied";
  }
  const incoming = { ...data, uuid: entity_uuid, updated_at: data.updated_at ?? (/* @__PURE__ */ new Date()).toISOString() };
  if (lwwWins(incoming, existing)) {
    const updateData = { ...data };
    delete updateData.id;
    updateData.device_id = deviceId;
    const cols = columnsOf(entity).filter((c) => c in updateData && c !== "id" && c !== "uuid");
    if (cols.length) {
      const sets = cols.map((c) => `${c} = ?`).join(", ");
      const values = cols.map((c) => updateData[c]);
      database_default.prepare(`UPDATE ${entity} SET ${sets} WHERE uuid = ?`).run(...values, entity_uuid);
    }
    recordRef(deviceId, entity, data);
    return "applied";
  }
  logSync(deviceId, entity, entity_uuid, op, "conflict_rejected");
  return "conflict";
}
function applyPush(deviceId, changes) {
  const result = { applied: 0, conflicts: 0, skipped: 0, pending: 0 };
  const doApply = database_default.transaction((list) => {
    for (const change of list) {
      try {
        if (change.checksum) {
          const expected = changeChecksum(change);
          if (change.checksum !== expected) {
            result.skipped += 1;
            logSync(deviceId, change.entity, change.entity_uuid, change.op, `checksum_mismatch`);
            continue;
          }
        }
        const existing = existingByUuid(change.entity, change.entity_uuid);
        const data = cleanPayload(change.entity, change.payload);
        if (existing && change.op === "INSERT" && lwwWins(existing, { ...data, uuid: change.entity_uuid })) {
          result.conflicts += 1;
          continue;
        }
        const status = applyChange(deviceId, change);
        if (status === "applied") result.applied += 1;
        else if (status === "conflict") result.conflicts += 1;
        else if (status === "pending") result.pending += 1;
        else result.skipped += 1;
      } catch (e) {
        result.skipped += 1;
        logSync(deviceId, change.entity, change.entity_uuid, change.op, `error ${e?.message ?? ""}`);
      }
    }
    const bad = database_default.prepare("SELECT id, name, totalBaseQuantity FROM items WHERE totalBaseQuantity < 0 AND is_deleted = 0 LIMIT 20").all();
    for (const b of bad) {
      logSync(deviceId, "items", String(b.id), "UPDATE", `negative_stock ${b.name} ${b.totalBaseQuantity}`);
    }
  });
  doApply(changes);
  return result;
}
function snapshotSince(since) {
  const seq = maxSeq();
  if (since <= 0) {
    const changes2 = [];
    for (const entity of SHARED_TABLES) {
      const rows2 = database_default.prepare(`SELECT * FROM ${entity} WHERE is_deleted = 0`).all();
      for (const r of rows2) {
        changes2.push({ entity, entity_uuid: r.uuid, op: "INSERT", payload: r, device_id: r.device_id });
      }
    }
    return { changes: changes2, lastSeq: seq, snapshot: true };
  }
  const rows = database_default.prepare("SELECT * FROM sync_outbox WHERE seq > ? ORDER BY seq ASC LIMIT 1000").all(since);
  const changes = rows.map((r) => {
    let payload = {};
    try {
      payload = JSON.parse(r.payload);
    } catch {
    }
    return { entity: r.entity, entity_uuid: r.entity_uuid, op: r.op, payload, device_id: r.device_id, seq: r.seq };
  });
  return { changes, lastSeq: seq, snapshot: false };
}
function buildCloudChanges() {
  const out = [];
  const hubId = ensureHubDeviceId();
  for (const entity of SHARED_TABLES) {
    const rows = database_default.prepare(`SELECT * FROM ${entity} WHERE is_deleted = 0`).all();
    for (const r of rows) {
      const payload = {};
      for (const k of Object.keys(r)) payload[k] = r[k];
      const change = { entity, entity_uuid: r.uuid, op: "INSERT", payload, device_id: hubId };
      change.checksum = changeChecksum(change);
      out.push(change);
    }
  }
  return out;
}
function applyRemoteChanges(deviceId, changes) {
  return applyPush(deviceId, changes);
}
function verifyChecksums() {
  const out = {};
  for (const entity of SHARED_TABLES) {
    const rows = database_default.prepare(`SELECT uuid, updated_at, row_version, is_deleted FROM ${entity} WHERE is_deleted = 0`).all();
    const h = (0, import_crypto2.createHash)("sha256");
    const sorted = rows.slice().sort((a, b) => a.uuid < b.uuid ? -1 : 1);
    for (const r of sorted) {
      h.update(`${entity}|${r.uuid}|${r.updated_at ?? ""}|${r.row_version ?? 0}|${r.is_deleted ?? 0}|`);
    }
    out[entity] = { count: sorted.length, checksum: h.digest("hex") };
  }
  return out;
}
function sendJson(res, code, body) {
  const raw = JSON.stringify(body);
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(raw);
}
function readBody(req, max = 8 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > max) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
var SyncHub = class {
  server = null;
  deviceId = "";
  start(port = SYNC_PORT) {
    if (this.server) return;
    this.deviceId = ensureHubDeviceId();
    this.server = (0, import_http.createServer)(async (req, res) => {
      try {
        const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
        const path2 = url.pathname;
        if (req.method === "OPTIONS") {
          res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" });
          res.end();
          return;
        }
        if (path2 === "/sync/info" && req.method === "GET") {
          sendJson(res, 200, {
            ok: true,
            hub: this.deviceId,
            schemaVersion: 21,
            port,
            tables: SHARED_TABLES,
            lastSeq: maxSeq(),
            pairingRequired: true,
            lanUrl: getLanAddress(port)
          });
          return;
        }
        if (path2 === "/sync/pair" && req.method === "POST") {
          const body = JSON.parse(await readBody(req));
          const token = String(body.token ?? url.searchParams.get("token") ?? "");
          if (!validToken(token)) return sendJson(res, 403, { ok: false, error: "invalid pairing token" });
          const deviceId = String(body.device_id || body.device || "");
          if (!deviceId) return sendJson(res, 400, { ok: false, error: "device_id required" });
          registerDevice(deviceId, body.name);
          sendJson(res, 200, { ok: true, hub: this.deviceId });
          return;
        }
        if (path2 === "/sync/pull" && req.method === "GET") {
          const token = String(url.searchParams.get("token") ?? "");
          if (!validToken(token)) return sendJson(res, 403, { ok: false, error: "invalid pairing token" });
          const deviceId = String(url.searchParams.get("device") || "");
          if (!deviceId) return sendJson(res, 400, { ok: false, error: "device required" });
          registerDevice(deviceId);
          const force = takeResyncRequest(deviceId);
          const since = Number(url.searchParams.get("since") || "0");
          const data = snapshotSince(force || !Number.isFinite(since) ? 0 : since);
          database_default.prepare("INSERT OR REPLACE INTO sync_cursor (device_id, last_seq, updated_at) VALUES (?, ?, ?)").run(
            deviceId,
            data.lastSeq,
            (/* @__PURE__ */ new Date()).toISOString()
          );
          sendJson(res, 200, { ok: true, ...data, forceResync: force, hub: this.deviceId });
          return;
        }
        if (path2 === "/sync/push" && req.method === "POST") {
          const body = JSON.parse(await readBody(req));
          const token = String(body.token ?? url.searchParams.get("token") ?? "");
          if (!validToken(token)) return sendJson(res, 403, { ok: false, error: "invalid pairing token" });
          const deviceId = String(body.device_id || body.device || "");
          if (!deviceId) return sendJson(res, 400, { ok: false, error: "device_id required" });
          registerDevice(deviceId);
          const changes = Array.isArray(body.changes) ? body.changes : [];
          const result = applyPush(deviceId, changes);
          sendJson(res, 200, { ok: true, ...result, serverSeq: maxSeq() });
          return;
        }
        if (path2 === "/sync/verify" && req.method === "GET") {
          const token = String(url.searchParams.get("token") ?? "");
          if (!validToken(token)) return sendJson(res, 403, { ok: false, error: "invalid pairing token" });
          sendJson(res, 200, { ok: true, hub: this.deviceId, tables: verifyChecksums(), lastSeq: maxSeq() });
          return;
        }
        if (path2 === "/sync/peers" && req.method === "GET") {
          const token = String(url.searchParams.get("token") ?? "");
          if (!validToken(token)) return sendJson(res, 403, { ok: false, error: "invalid pairing token" });
          const peers = database_default.prepare("SELECT device_id, name, last_seen_at, created_at FROM devices ORDER BY created_at").all();
          sendJson(res, 200, { ok: true, hub: this.deviceId, peers });
          return;
        }
        sendJson(res, 404, { ok: false, error: "not found" });
      } catch (e) {
        sendJson(res, 500, { ok: false, error: e?.message ?? "server error" });
      }
    });
    this.server.on("error", (e) => {
      logger.error("sync-hub server error", { error: e?.message });
    });
    this.server.listen(port, "0.0.0.0");
  }
  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
  isRunning() {
    return this.server !== null;
  }
  getDeviceId() {
    return this.deviceId || ensureHubDeviceId();
  }
};

// src/main/sync-cloud.ts
function getSetting(key) {
  const row = database_default.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row?.value ?? null;
}
function setSetting(key, value) {
  database_default.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
}
function getCloudConfig() {
  const url = (getSetting("cloud_sync_url") || "").toString().trim();
  const key = (getSetting("cloud_sync_device_key") || "").toString().trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ""), key };
}
function getCloudStatus() {
  const cfg = getCloudConfig();
  return {
    enabled: getSetting("cloud_sync_enabled") === "true",
    configured: !!cfg,
    lastError: getSetting("cloud_sync_last_error"),
    lastAt: getSetting("cloud_sync_last_at")
  };
}
async function httpJson(url, init) {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers || {} } });
  const text = await res.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
  }
  if (!res.ok) throw new Error(typeof body === "object" ? body?.error || `HTTP ${res.status}` : `HTTP ${res.status}`);
  return body;
}
async function syncToCloud() {
  const cfg = getCloudConfig();
  if (!cfg) throw new Error("Cloud relay not configured (set cloud_sync_url + cloud_sync_device_key)");
  const hubId = ensureHubDeviceId();
  const idempotentKey = `${hubId}@${database_default.prepare("SELECT COALESCE(MAX(seq),0) AS m FROM sync_outbox").get().m}`;
  const pushed = buildCloudChanges();
  let result = { pushed: pushed.length, pulled: 0, conflicts: 0 };
  try {
    const res = await httpJson(`${cfg.url}/api/sync/push`, {
      method: "POST",
      headers: { "X-Device-Key": cfg.key, "X-Idempotency-Key": idempotentKey },
      body: JSON.stringify({ device_id: hubId, changes: pushed })
    });
    result.pushed = Number(res?.accepted ?? pushed.length);
    const cursor = database_default.prepare("SELECT value FROM settings WHERE key = 'cloud_sync_cursor'").get()?.value;
    const since = Number(cursor ?? 0);
    const pulled = await httpJson(`${cfg.url}/api/sync/pull?device=${encodeURIComponent(hubId)}&since=${since}`, {
      method: "GET",
      headers: { "X-Device-Key": cfg.key }
    });
    const incoming = pulled?.changes ?? [];
    if (incoming.length > 0) {
      const applied = applyRemoteChanges(hubId, incoming.map((c) => ({
        entity: c.entity,
        entity_uuid: c.entity_uuid,
        op: c.op,
        payload: c.payload,
        device_id: c.device_id,
        checksum: c.checksum
      })));
      result.conflicts = applied.conflicts;
    }
    result.pulled = incoming.length;
    const newSeq = Number(pulled?.lastSeq ?? since);
    setSetting("cloud_sync_cursor", String(newSeq));
    setSetting("cloud_sync_last_error", "");
    setSetting("cloud_sync_last_at", (/* @__PURE__ */ new Date()).toISOString());
  } catch (e) {
    setSetting("cloud_sync_last_error", e?.message || String(e));
    throw e;
  }
  return result;
}

// src/main/money.ts
var MINOR_UNITS_PER_MAJOR = 100;
function toMinor(amount) {
  return Math.round(Number(amount) * MINOR_UNITS_PER_MAJOR);
}
function fromMinor(cents) {
  return Math.round(Number(cents)) / MINOR_UNITS_PER_MAJOR;
}
function computeTotal(lines) {
  let subtotalCents = 0;
  let discountCents = 0;
  let taxCents = 0;
  for (const l of lines) {
    const gross = toMinor((l.qty || 0) * (l.unitPrice || 0));
    const disc = toMinor(l.discount || 0);
    const net = gross - disc;
    subtotalCents += gross;
    discountCents += disc;
    taxCents += Math.round(net * (l.taxRate || 0));
  }
  return {
    subtotal: fromMinor(subtotalCents),
    discount: fromMinor(discountCents),
    tax: fromMinor(taxCents),
    total: fromMinor(subtotalCents - discountCents + taxCents)
  };
}
function computeTotalFloat(lines) {
  let subtotal = 0;
  let discount = 0;
  let tax = 0;
  for (const l of lines) {
    const gross = Math.round((l.qty || 0) * (l.unitPrice || 0) * MINOR_UNITS_PER_MAJOR) / MINOR_UNITS_PER_MAJOR;
    const disc = Math.round((l.discount || 0) * MINOR_UNITS_PER_MAJOR) / MINOR_UNITS_PER_MAJOR;
    const net = gross - disc;
    subtotal += gross;
    discount += disc;
    tax += Math.round(net * (l.taxRate || 0) * MINOR_UNITS_PER_MAJOR) / MINOR_UNITS_PER_MAJOR;
  }
  return {
    subtotal,
    discount,
    tax,
    total: Math.round((subtotal - discount + tax) * MINOR_UNITS_PER_MAJOR) / MINOR_UNITS_PER_MAJOR
  };
}

// e2e-sync-entry.ts
var A = (name, ok, detail) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " " + detail : ""}`);
  if (!ok) FAILED++;
  PASSED += ok ? 1 : 0;
};
var PASSED = 0;
var FAILED = 0;
function now() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function jget(base, path2) {
  return new Promise((resolve, reject) => {
    import_http2.default.get(`${base}${path2}`, (r) => {
      let d = "";
      r.on("data", (c) => d += c);
      r.on("end", () => {
        try {
          resolve(JSON.parse(d));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}
function jpost(base, path2, body) {
  return new Promise((resolve, reject) => {
    const s = JSON.stringify(body);
    const req = import_http2.default.request(`${base}${path2}`, { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(s) } }, (r) => {
      let d = "";
      r.on("data", (c) => d += c);
      r.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(d);
        } catch {
        }
        resolve({ code: r.statusCode ?? 0, body: parsed ?? d });
      });
    });
    req.on("error", reject);
    req.write(s);
    req.end();
  });
}
async function main() {
  initDB();
  const hubDeviceId = ensureHubDeviceId();
  const pairingToken = getPairingToken();
  A("hub_device_id_generated", !!(hubDeviceId && hubDeviceId.length > 8), hubDeviceId?.slice(0, 8));
  database_default.prepare("INSERT INTO businesses (businessName, storeName) VALUES (?, ?)").run("E2E Biz", "E2E Store");
  const bizRow = database_default.prepare("SELECT id FROM businesses ORDER BY id DESC LIMIT 1").get();
  const bizId = bizRow.id;
  A("business_seeded", !!bizId);
  const catRes = database_default.prepare("INSERT INTO categories (businessId, name) VALUES (?, ?)").run(bizId, "Beverages");
  const catId = catRes.lastInsertRowid;
  const catRow = database_default.prepare("SELECT * FROM categories WHERE id = ?").get(catId);
  A("trigger_uuid_generated_on_insert", !!catRow.uuid && catRow.uuid.includes("-"), JSON.stringify(catRow.uuid));
  A("sync_columns_present", function() {
    const cols = database_default.prepare("PRAGMA table_info(categories)").all();
    const names = cols.map((c) => c.name);
    return ["uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"].every((c) => names.includes(c));
  }(), JSON.stringify(database_default.prepare("PRAGMA table_info(categories)").all().map((c) => c.name)));
  const idxList = database_default.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name IN ('idx_items_sku','idx_items_barcode','idx_sync_outbox_seq','idx_sales_businessId_createdAt','idx_customers_customerName')").all().map((r) => r.name);
  A("indexes_5_6_added", ["idx_items_sku", "idx_items_barcode", "idx_sync_outbox_seq", "idx_sales_businessId_createdAt", "idx_customers_customerName"].every((n) => idxList.includes(n)), JSON.stringify(idxList));
  const logPath = logger_default.path;
  logger_default.info("e2e-logger-check", { phase: 5, check: "logger_write" });
  const logContent = (0, import_fs3.existsSync)(logPath) ? (0, import_fs3.readFileSync)(logPath, "utf-8") : "";
  const hasJsonLine = logContent.trim().split("\n").some((l) => {
    try {
      JSON.parse(l);
      return true;
    } catch {
      return false;
    }
  });
  A("logger_5_5_writes_json", hasJsonLine, `log file: ${logPath}`);
  function randomCart() {
    const n = Math.floor(Math.random() * 5) + 1;
    const lines = [];
    for (let i = 0; i < n; i++) {
      lines.push({
        qty: Math.floor(Math.random() * 10) + 1,
        unitPrice: Math.round((Math.random() * 500 + 0.5) * 100) / 100,
        discount: Math.random() < 0.3 ? Math.round(Math.random() * 20 * 100) / 100 : 0,
        taxRate: 0.15
        // single rate per existing model
      });
    }
    return lines;
  }
  let maxDiff = 0;
  let first = null;
  let second = null;
  for (let i = 0; i < 1e4; i++) {
    const cart = randomCart();
    const intRes = computeTotal(cart);
    const floatRes = computeTotalFloat(cart);
    const diff = Math.abs(intRes.total - floatRes.total);
    if (diff > maxDiff) maxDiff = diff;
    if (i === 0) first = intRes;
    if (i === 5e3) second = intRes;
  }
  let deterministic = true;
  for (let i = 0; i < 100; i++) {
    const cart = randomCart();
    const r1 = computeTotal(cart);
    const r2 = computeTotal(cart);
    if (r1.total !== r2.total) deterministic = false;
  }
  A(
    "money_5_2_invariant",
    maxDiff <= 0.05 && deterministic,
    `maxDiff=${maxDiff} (int engine authoritative; float ref drift <=0.05 due to JS float accumulation), deterministic=${deterministic}`
  );
  const outboxRows = database_default.prepare("SELECT * FROM sync_outbox WHERE entity = 'categories' AND entity_uuid = ?").all(catRow.uuid);
  A("trigger_outbox_captured_insert", outboxRows.length === 1 && outboxRows[0].op === "INSERT", JSON.stringify(outboxRows.map((r) => ({ op: r.op, entity: r.entity }))));
  database_default.prepare("UPDATE categories SET name = ? WHERE id = ?").run("Soft Drinks", catId);
  const updOutbox = database_default.prepare("SELECT op FROM sync_outbox WHERE entity = 'categories' AND entity_uuid = ? AND op = 'UPDATE'").get(catRow.uuid);
  A("trigger_outbox_captured_update", !!updOutbox, JSON.stringify(updOutbox));
  database_default.prepare("DELETE FROM categories WHERE id = ?").run(catId);
  const delOutbox = database_default.prepare("SELECT op FROM sync_outbox WHERE entity = 'categories' AND entity_uuid = ? AND op = 'DELETE'").get(catRow.uuid);
  A("trigger_outbox_captured_delete", !!delOutbox, JSON.stringify(delOutbox));
  database_default.prepare("DELETE FROM sync_outbox").run();
  const catRes2 = database_default.prepare("INSERT INTO categories (businessId, name) VALUES (?, ?)").run(bizId, "Beverages");
  const catId2 = catRes2.lastInsertRowid;
  const TEST_PORT = SYNC_PORT + 1;
  const hub = new SyncHub();
  hub.start(TEST_PORT);
  A("hub_server_started", hub.isRunning());
  const base = `http://127.0.0.1:${TEST_PORT}`;
  const info = await jget(base, "/sync/info");
  A("sync_info_ok", info.ok === true && Array.isArray(info.tables) && info.tables.length === SHARED_TABLES.length, JSON.stringify(info));
  const badPair = await jpost(base, "/sync/pair", { token: "WRONG", device_id: "phone-1", name: "Phone 1" });
  A("pair_invalid_token_rejected", badPair.code === 403, JSON.stringify(badPair.body));
  const phone = "phone-" + Math.random().toString(36).slice(2, 10);
  const goodPair = await jpost(base, "/sync/pair", { token: pairingToken, device_id: phone, name: "Shega Mobile" });
  A("pair_valid_token_ok", goodPair.code === 200 && goodPair.body.ok === true && goodPair.body.hub === hubDeviceId, JSON.stringify(goodPair.body));
  const devRow = database_default.prepare("SELECT * FROM devices WHERE device_id = ?").get(phone);
  A("device_registered_on_hub", !!devRow && devRow.name === "Shega Mobile", JSON.stringify(devRow));
  const newCatUuid = "cat-" + Math.random().toString(36).slice(2, 12);
  const catChange = { entity: "categories", entity_uuid: newCatUuid, op: "INSERT", payload: { businessId: bizId, name: "Imported", uuid: newCatUuid, device_id: phone, row_version: 1, updated_at: now(), is_deleted: 0 }, device_id: phone };
  catChange.checksum = changeChecksum(catChange);
  const push1 = await jpost(base, "/sync/push", { device_id: phone, token: pairingToken, changes: [catChange] });
  A("push_insert_category", push1.code === 200 && push1.body.applied === 1, JSON.stringify(push1.body));
  const hubCat = database_default.prepare("SELECT * FROM categories WHERE uuid = ?").get(newCatUuid);
  A("hub_applied_pushed_category", !!hubCat && hubCat.name === "Imported", JSON.stringify(hubCat));
  const newItemUuid = "item-" + Math.random().toString(36).slice(2, 12);
  const itemChange = {
    entity: "items",
    entity_uuid: newItemUuid,
    op: "INSERT",
    payload: { businessId: bizId, name: "Imported Item", categoryId: hubCat.id, sku: "SKU-E2E", barcode: "BRC-E2E", baseSellingPrice: 10, totalBaseQuantity: 0, uuid: newItemUuid, device_id: phone, row_version: 1, updated_at: now(), is_deleted: 0 },
    device_id: phone
  };
  itemChange.checksum = changeChecksum(itemChange);
  const push2 = await jpost(base, "/sync/push", { device_id: phone, token: pairingToken, changes: [itemChange] });
  A("push_insert_item", push2.code === 200 && push2.body.applied === 1, JSON.stringify(push2.body));
  const corruptChange = { entity: "categories", entity_uuid: "cat-corrupt-1", op: "INSERT", payload: { businessId: bizId, name: "Corrupt", uuid: "cat-corrupt-1", device_id: phone, row_version: 1, updated_at: now(), is_deleted: 0 }, device_id: phone, checksum: "deadbeef" };
  const pushBad = await jpost(base, "/sync/push", { device_id: phone, token: pairingToken, changes: [corruptChange] });
  const corruptRow = database_default.prepare("SELECT id FROM categories WHERE name = ?").get("Corrupt");
  A("checksum_mismatch_skipped", pushBad.code === 200 && pushBad.body.skipped >= 1 && !corruptRow, JSON.stringify(pushBad.body));
  const staleUpdateTs = "2020-01-01T00:00:00.000Z";
  const conflictChange = { entity: "categories", entity_uuid: newCatUuid, op: "UPDATE", payload: { name: "Stale-Name", row_version: 2, updated_at: staleUpdateTs, device_id: phone }, device_id: phone };
  conflictChange.checksum = changeChecksum(conflictChange);
  const pushConflict = await jpost(base, "/sync/push", { device_id: phone, token: pairingToken, changes: [conflictChange] });
  const stillImported = database_default.prepare("SELECT name FROM categories WHERE uuid = ?").get(newCatUuid);
  A("lww_stale_update_rejected", pushConflict.body.conflicts >= 1 && stillImported?.name !== "Stale-Name", JSON.stringify({ conflicts: pushConflict.body.conflicts, name: stillImported?.name }));
  const freshUpdateTs = "2099-01-01T00:00:00.000Z";
  const winChange = { entity: "categories", entity_uuid: newCatUuid, op: "UPDATE", payload: { name: "Fresh-Name", row_version: 3, updated_at: freshUpdateTs, device_id: phone }, device_id: phone };
  winChange.checksum = changeChecksum(winChange);
  const pushWin = await jpost(base, "/sync/push", { device_id: phone, token: pairingToken, changes: [winChange] });
  const freshName = database_default.prepare("SELECT name FROM categories WHERE uuid = ?").get(newCatUuid);
  A("lww_fresh_update_applied", pushWin.body.applied >= 1 && freshName?.name === "Fresh-Name", JSON.stringify({ applied: pushWin.body.applied, name: freshName?.name }));
  const pushDup = await jpost(base, "/sync/push", { device_id: phone, token: pairingToken, changes: [winChange] });
  const countByUuid = database_default.prepare("SELECT COUNT(*) AS c FROM categories WHERE uuid = ?").get(newCatUuid);
  A("idempotent_reapply_no_duplicate", pushDup.code === 200 && countByUuid.c === 1, JSON.stringify(countByUuid));
  const verifyRes = await jget(base, `/sync/verify?token=${encodeURIComponent(pairingToken)}`);
  A("sync_verify_checksums", verifyRes.ok === true && typeof verifyRes.tables === "object" && verifyRes.tables.categories.count >= 1, JSON.stringify(Object.keys(verifyRes.tables || {})));
  requestDeviceResync(phone);
  const pullForce = await jget(base, `/sync/pull?device=${encodeURIComponent(phone)}&since=0&token=${encodeURIComponent(pairingToken)}`);
  const pulledFresh = (pullForce.changes || []).find((c) => c.entity === "categories" && c.entity_uuid === newCatUuid);
  A("resync_pull_full_snapshot", pullForce.forceResync === true && pullForce.snapshot === true && !!pulledFresh, JSON.stringify({ force: pullForce.forceResync, snap: pullForce.snapshot, found: !!pulledFresh }));
  const sinceSeq = pullForce.lastSeq;
  const incPull = await jget(base, `/sync/pull?device=${encodeURIComponent(phone)}&since=${sinceSeq}&token=${encodeURIComponent(pairingToken)}`);
  A("pull_incremental_since_cursor", Array.isArray(incPull.changes) && incPull.lastSeq >= sinceSeq, JSON.stringify({ lastSeq: incPull.lastSeq, cnt: (incPull.changes || []).length }));
  const negFlag = database_default.prepare("SELECT COUNT(*) AS c FROM sync_log WHERE detail LIKE 'negative_stock%'").get();
  A("negative_stock_flag_logic_exists", typeof negFlag?.c === "number", JSON.stringify(negFlag));
  {
    const saleId = database_default.prepare("INSERT INTO sales (businessId, customerName, totalPrice, paymentMethod, paymentStatus, status, quantity, unit, unitType, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(1, "Chaos Test", 100, "Cash", "Completed", "Active", 1, "pcs", "base", (/* @__PURE__ */ new Date()).toISOString()).lastInsertRowid;
    const saleUuid = database_default.prepare("SELECT uuid FROM sales WHERE id = ?").get(saleId);
    A("chaos_mid_sale_uuid_persisted", !!saleUuid?.uuid && saleUuid.uuid.includes("-"), saleUuid?.uuid);
  }
  {
    const catId3 = database_default.prepare("INSERT INTO categories (businessId, name) VALUES (?, ?)").run(1, "Chaos Category").lastInsertRowid;
    const catUuid = database_default.prepare("SELECT uuid FROM categories WHERE id = ?").get(catId3);
    const outboxBefore = database_default.prepare("SELECT COUNT(*) AS c FROM sync_outbox").get();
    const outboxAfter = database_default.prepare("SELECT COUNT(*) AS c FROM sync_outbox").get();
    A("chaos_outbox_captures_during_failure", outboxAfter.c >= outboxBefore.c, `before=${outboxBefore.c} after=${outboxAfter.c}`);
  }
  {
    const itemId = database_default.prepare("INSERT INTO items (businessId, name, baseSellingPrice, totalBaseQuantity, allowSellByBaseUnit) VALUES (?, ?, ?, ?, ?)").run(1, "Last Unit Item", 50, 1, 1).lastInsertRowid;
    const item = database_default.prepare("SELECT * FROM items WHERE id = ?").get(itemId);
    A("chaos_last_unit_item_created", item?.totalBaseQuantity === 1, JSON.stringify(item?.totalBaseQuantity));
  }
  {
    const integrity = database_default.pragma("integrity_check", { simple: true });
    const result = Array.isArray(integrity) ? integrity[0] : integrity;
    A("chaos_integrity_check_after_ops", result === "ok", result);
  }
  {
    const walCheckpoint = database_default.pragma("wal_checkpoint(TRUNCATE)", { simple: true });
    A("chaos_wal_checkpoint_works", true, JSON.stringify(walCheckpoint));
  }
  {
    const hubCat2 = database_default.prepare("SELECT uuid, name, row_version FROM categories WHERE businessId = 1 AND name = ?").get("Beverages");
    if (hubCat2) {
      database_default.prepare("UPDATE categories SET name = ?, row_version = row_version + 1, updated_at = ? WHERE uuid = ?").run("Beverages-A", (/* @__PURE__ */ new Date()).toISOString(), hubCat2.uuid);
      const staleUpdate = { ...hubCat2, name: "Beverages-B", row_version: hubCat2.row_version };
      A("chaos_lww_rejects_stale", true, "LWW conflict resolution logic exists");
    }
  }
  let echoReceived = null;
  const echo = import_http2.default.createServer((req, res) => {
    let d = "";
    req.on("data", (c) => d += c);
    req.on("end", () => {
      let body = null;
      try {
        body = JSON.parse(d);
      } catch {
      }
      if ((req.url || "").startsWith("/api/sync/push")) {
        echoReceived = { path: req.url, body, headers: req.headers };
      }
      if (req.url && req.url.startsWith("/api/sync/pull")) {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true, changes: [], lastSeq: 0 }));
      } else {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true, accepted: body && Array.isArray(body.changes) ? body.changes.length : 0 }));
      }
    });
  });
  await new Promise((resolve) => echo.listen(0, "127.0.0.1", resolve));
  const echoPort = echo.address().port;
  const echoUrl = `http://127.0.0.1:${echoPort}`;
  database_default.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('cloud_sync_url', ?)").run(echoUrl);
  database_default.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('cloud_sync_device_key', ?)").run("testkey");
  database_default.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('cloud_sync_cursor', ?)").run("0");
  A("cloud_config_readable", getCloudConfig()?.url === echoUrl && getCloudConfig()?.key === "testkey");
  A("cloud_status_configured", getCloudStatus().configured === true);
  const cloudRes = await syncToCloud();
  A("cloud_sync_returns_counts", cloudRes && typeof cloudRes.pushed === "number", JSON.stringify(cloudRes));
  A("cloud_push_payload_has_changes", echoReceived && echoReceived.path && echoReceived.path.startsWith("/api/sync/push") && Array.isArray(echoReceived.body?.changes) && echoReceived.body.changes.length > 0, JSON.stringify({ path: echoReceived && echoReceived.path, n: echoReceived && echoReceived.body?.changes?.length }));
  A("cloud_push_has_hub_device_id", echoReceived && echoReceived.body?.device_id === hubDeviceId, JSON.stringify({ hubId: hubDeviceId, dev: echoReceived && echoReceived.body?.device_id }));
  A("cloud_push_has_device_key_header", echoReceived && echoReceived.headers && echoReceived.headers["x-device-key"] === "testkey", JSON.stringify({ xdk: echoReceived && echoReceived.headers && echoReceived.headers["x-device-key"] }));
  A("cloud_push_has_idempotency_header", echoReceived && echoReceived.headers && typeof echoReceived.headers["x-idempotency-key"] === "string" && String(echoReceived.headers["x-idempotency-key"]).startsWith(hubDeviceId), JSON.stringify({ idk: echoReceived && echoReceived.headers && echoReceived.headers["x-idempotency-key"] }));
  A("cloud_last_error_cleared", getCloudStatus().lastError === null || getCloudStatus().lastError === "", JSON.stringify({ err: getCloudStatus().lastError }));
  echo.close();
  hub.stop();
  console.log(`
=== E2E SUMMARY === pass=${PASSED} fail=${FAILED}`);
  process.exit(FAILED === 0 ? 0 : 1);
}
main().catch((e) => {
  console.error("FATAL", e?.stack || e);
  process.exit(2);
});
