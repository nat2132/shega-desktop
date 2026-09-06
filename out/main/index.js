"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const fs = require("fs");
const electron = require("electron");
const path = require("path");
const crypto$1 = require("crypto");
const Database = require("better-sqlite3");
const electronUpdater = require("electron-updater");
const zod = require("zod");
const net = require("net");
const http = require("http");
const os = require("os");
const bonjourService = require("bonjour-service");
const events = require("events");
const ws = require("ws");
const QRCode = require("qrcode");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const DEFAULT_DISCOUNT_CAPS = {
  owner: null,
  manager: null,
  cashier: 10,
  inventory: 10,
  accountant: 10,
  reports: 10,
  warehouse: 10
};
function getDiscountCap(role) {
  if (!role) return DEFAULT_DISCOUNT_CAPS.cashier;
  const cap = DEFAULT_DISCOUNT_CAPS[role];
  return cap === void 0 ? DEFAULT_DISCOUNT_CAPS.cashier : cap;
}
const PERMISSION_CATALOG = [
  // ---- Sales / POS ----
  { key: "sales.create", label: "Make sales", description: "Record and complete sales transactions", scope: "sales" },
  { key: "sales.scan", label: "Scan products", description: "Scan barcodes into the sale", scope: "sales" },
  { key: "sales.search", label: "Search products", description: "Search the product catalog during checkout", scope: "sales" },
  { key: "sales.checkout", label: "Checkout", description: "Complete checkout and payment", scope: "sales" },
  { key: "sales.printReceipt", label: "Print receipts", description: "Print a thermal/PDF receipt", scope: "sales" },
  { key: "sales.hold", label: "Hold sales", description: "Place sales on hold for later", scope: "sales" },
  { key: "sales.viewOwn", label: "View own sales", description: "View sales recorded by yourself", scope: "sales" },
  { key: "sales.viewAll", label: "View all sales", description: "View every sale in the business", scope: "sales" },
  { key: "sales.refund", label: "Refunds", description: "Process refunds", scope: "sales" },
  { key: "sales.discount.unlimited", label: "Unlimited discounts", description: "Apply discounts up to 100%", scope: "sales" },
  { key: "sales.discount.limited", label: "Limited discounts", description: "Apply small discounts within threshold", scope: "sales" },
  { key: "sales.void", label: "Void / cancel sale", description: "Void or cancel a sale after the fact", scope: "sales" },
  { key: "sales.priceOverride", label: "Price override", description: "Override a product selling price at checkout", scope: "sales" },
  // ---- Products / Catalog ----
  { key: "products.view", label: "View products", description: "View the product catalog", scope: "products" },
  { key: "products.viewStock", label: "View product stock", description: "See live stock levels", scope: "products" },
  { key: "products.create", label: "Create products", description: "Add new products to the catalog", scope: "products" },
  { key: "products.edit", label: "Edit products", description: "Edit product details", scope: "products" },
  { key: "products.delete", label: "Delete products", description: "Delete products from the catalog", scope: "products" },
  { key: "products.changePrice", label: "Change selling price", description: "Change a product selling price", scope: "products" },
  { key: "products.scanBarcode", label: "Scan barcodes", description: "Scan/register product barcodes", scope: "products" },
  // ---- Inventory / Stock ----
  { key: "inventory.receive", label: "Receive stock", description: "Add stock / receive purchase", scope: "inventory" },
  { key: "inventory.adjust", label: "Stock adjustment", description: "Adjust stock (count, damaged, corrections)", scope: "inventory" },
  { key: "inventory.count", label: "Stock count", description: "Perform physical stock counts", scope: "inventory" },
  { key: "inventory.transfer", label: "Stock transfer", description: "Transfer stock between registers/warehouses", scope: "inventory" },
  { key: "inventory.suppliers", label: "Suppliers", description: "Manage suppliers and purchase orders", scope: "inventory" },
  // ---- Customers ----
  { key: "customers.view", label: "View customers", description: "View the customer directory", scope: "customers" },
  { key: "customers.manage", label: "Manage customers", description: "Create and edit customers", scope: "customers" },
  // ---- Payments / Finance ----
  { key: "payments.process", label: "Process payments", description: "Take payments (cash, digital, card)", scope: "payments" },
  { key: "payments.manageExpenses", label: "Manage expenses", description: "Record and manage expenses", scope: "payments" },
  { key: "payments.cashDrawer", label: "Cash drawer", description: "Open/close and audit the cash drawer", scope: "payments" },
  // ---- Registers ----
  { key: "registers.view", label: "View registers", description: "View registers and assignment", scope: "registers" },
  { key: "registers.manage", label: "Manage registers", description: "Create and configure registers", scope: "registers" },
  { key: "registers.openShift", label: "Open shift", description: "Open and close shifts on a register", scope: "registers" },
  // ---- Reports ----
  { key: "reports.viewOwn", label: "View own reports", description: "View reports scoped to yourself", scope: "reports" },
  { key: "reports.viewAll", label: "View all reports", description: "View full business reports", scope: "reports" },
  { key: "reports.export", label: "Export reports", description: "Export PDF/CSV reports", scope: "reports" },
  // ---- Team / Staff ----
  { key: "team.view", label: "View team", description: "View staff members", scope: "team" },
  { key: "team.manage", label: "Manage team", description: "Add, edit and remove staff", scope: "team" },
  { key: "team.assignRoles", label: "Assign roles", description: "Assign roles and permissions to staff", scope: "team" },
  // ---- Devices ----
  { key: "devices.view", label: "View devices", description: "View the business device list", scope: "devices" },
  { key: "devices.manage", label: "Manage devices", description: "Add, pair, lock, disable and remove devices", scope: "devices" },
  // ---- Settings ----
  { key: "settings.view", label: "View settings", description: "View business settings", scope: "settings" },
  { key: "settings.manage", label: "Manage settings", description: "Change business settings", scope: "settings" },
  // ---- Tax ----
  { key: "tax.view", label: "View tax config", description: "View tax configuration", scope: "tax" },
  { key: "tax.configure", label: "Configure tax", description: "Change tax rates and configuration", scope: "tax" },
  // ---- Subscription ----
  { key: "subscription.view", label: "View subscription", description: "View subscription and device plan", scope: "subscription" },
  { key: "subscription.manage", label: "Manage subscription", description: "Change plan, renew and manage payment", scope: "subscription" },
  // ---- Ownership (Owner only, server-verified) ----
  { key: "ownership.transfer", label: "Transfer ownership", description: "Transfer business ownership (strong confirmation)", scope: "ownership" },
  { key: "ownership.deleteBusiness", label: "Delete business", description: "Delete the entire business", scope: "ownership" }
];
const PERMISSION_BY_KEY = Object.fromEntries(
  PERMISSION_CATALOG.map((p) => [p.key, p])
);
function unpack(value) {
  if (value === true) return { allowed: true };
  if (value === "approval") return { allowed: false, reason: "approval-required" };
  if (value === "limited") return { allowed: false, reason: "limited" };
  return { allowed: false, reason: "denied" };
}
function checkPermission(ctx, key) {
  const result = unpack(ctx.permissions[key]);
  if (!result.allowed && result.reason === "approval-required" && ctx.canApprove) {
    return { allowed: true };
  }
  return result;
}
function can(ctx, key) {
  return checkPermission(ctx, key).allowed;
}
function mergePermissionSets(base, overrides) {
  const out = {};
  for (const key of Object.keys(PERMISSION_BY_KEY)) {
    out[key] = overrides[key] !== void 0 ? overrides[key] : base[key] ?? false;
  }
  return out;
}
const ROLE_ORDER = [
  "owner",
  "manager",
  "cashier",
  "inventory",
  "accountant",
  "reports",
  "warehouse"
];
const DEFAULT_ROLE_SETS = {
  // ðŸ‘‘ Owner â€” full control over everything.
  owner: {
    "sales.create": true,
    "sales.scan": true,
    "sales.search": true,
    "sales.checkout": true,
    "sales.printReceipt": true,
    "sales.hold": true,
    "sales.viewOwn": true,
    "sales.viewAll": true,
    "sales.refund": true,
    "sales.discount.unlimited": true,
    "sales.discount.limited": true,
    "sales.void": true,
    "sales.priceOverride": true,
    "products.view": true,
    "products.viewStock": true,
    "products.create": true,
    "products.edit": true,
    "products.delete": true,
    "products.changePrice": true,
    "products.scanBarcode": true,
    "inventory.receive": true,
    "inventory.adjust": true,
    "inventory.count": true,
    "inventory.transfer": true,
    "inventory.suppliers": true,
    "customers.view": true,
    "customers.manage": true,
    "payments.process": true,
    "payments.manageExpenses": true,
    "payments.cashDrawer": true,
    "registers.view": true,
    "registers.manage": true,
    "registers.openShift": true,
    "reports.viewOwn": true,
    "reports.viewAll": true,
    "reports.export": true,
    "team.view": true,
    "team.manage": true,
    "team.assignRoles": true,
    "devices.view": true,
    "devices.manage": true,
    "settings.view": true,
    "settings.manage": true,
    "tax.view": true,
    "tax.configure": true,
    "subscription.view": true,
    "subscription.manage": true,
    "ownership.transfer": true,
    "ownership.deleteBusiness": true
  },
  // ðŸ§‘â€ðŸ’¼ Manager â€” operations only, no ownership/subscription control unless granted.
  manager: {
    "sales.create": true,
    "sales.scan": true,
    "sales.search": true,
    "sales.checkout": true,
    "sales.printReceipt": true,
    "sales.hold": true,
    "sales.viewOwn": true,
    "sales.viewAll": true,
    "sales.refund": "approval",
    "sales.discount.unlimited": "approval",
    "sales.discount.limited": true,
    "sales.void": "approval",
    "sales.priceOverride": "approval",
    "products.view": true,
    "products.viewStock": true,
    "products.create": true,
    "products.edit": true,
    "products.delete": "approval",
    "products.changePrice": "approval",
    "products.scanBarcode": true,
    "inventory.receive": true,
    "inventory.adjust": "approval",
    "inventory.count": true,
    "inventory.transfer": true,
    "inventory.suppliers": true,
    "customers.view": true,
    "customers.manage": true,
    "payments.process": true,
    "payments.manageExpenses": true,
    "payments.cashDrawer": "approval",
    "registers.view": true,
    "registers.manage": true,
    "registers.openShift": true,
    "reports.viewOwn": true,
    "reports.viewAll": true,
    "reports.export": true,
    "team.view": true,
    "team.manage": true,
    "team.assignRoles": false,
    "devices.view": true,
    "devices.manage": false,
    "settings.view": true,
    "settings.manage": false,
    "tax.view": true,
    "tax.configure": "approval",
    "subscription.view": false,
    "subscription.manage": false,
    "ownership.transfer": false,
    "ownership.deleteBusiness": false
  },
  // ðŸ’° Cashier â€” POS and payment operations (spec section 11).
  cashier: {
    "sales.create": true,
    "sales.scan": true,
    "sales.search": true,
    "sales.checkout": true,
    "sales.printReceipt": true,
    "sales.hold": true,
    "sales.viewOwn": true,
    "sales.viewAll": false,
    "sales.refund": "approval",
    "sales.discount.unlimited": "approval",
    "sales.discount.limited": true,
    "sales.void": false,
    "sales.priceOverride": false,
    "products.view": true,
    "products.viewStock": true,
    "products.create": false,
    "products.edit": false,
    "products.delete": false,
    "products.changePrice": false,
    "products.scanBarcode": false,
    "inventory.receive": false,
    "inventory.adjust": false,
    "inventory.count": false,
    "inventory.transfer": false,
    "inventory.suppliers": false,
    "customers.view": true,
    "customers.manage": false,
    "payments.process": true,
    "payments.manageExpenses": false,
    "payments.cashDrawer": false,
    "registers.view": false,
    "registers.manage": false,
    "registers.openShift": true,
    "reports.viewOwn": true,
    "reports.viewAll": false,
    "reports.export": false,
    "team.view": false,
    "team.manage": false,
    "team.assignRoles": false,
    "devices.view": false,
    "devices.manage": false,
    "settings.view": false,
    "settings.manage": false,
    "tax.view": false,
    "tax.configure": false,
    "subscription.view": false,
    "subscription.manage": false,
    "ownership.transfer": false,
    "ownership.deleteBusiness": false
  },
  // ðŸ“¦ Inventory â€” products & stock operations (spec section 12).
  inventory: {
    "sales.create": false,
    "sales.scan": false,
    "sales.search": false,
    "sales.checkout": false,
    "products.view": true,
    "products.viewStock": true,
    "products.create": true,
    "products.edit": true,
    "products.delete": false,
    "products.changePrice": false,
    "products.scanBarcode": true,
    "inventory.receive": true,
    "inventory.adjust": "approval",
    "inventory.count": true,
    "inventory.transfer": true,
    "inventory.suppliers": true,
    "customers.view": false,
    "customers.manage": false,
    "payments.process": false,
    "payments.manageExpenses": false,
    "payments.cashDrawer": false,
    "registers.view": false,
    "registers.manage": false,
    "registers.openShift": false,
    "reports.viewOwn": false,
    "reports.viewAll": false,
    "reports.export": false,
    "team.view": false,
    "team.manage": false,
    "team.assignRoles": false,
    "devices.view": false,
    "devices.manage": false,
    "settings.view": false,
    "settings.manage": false,
    "tax.view": false,
    "tax.configure": false,
    "subscription.view": false,
    "subscription.manage": false,
    "ownership.transfer": false,
    "ownership.deleteBusiness": false
  },
  // ðŸ“Š Accountant / Finance â€” expenses, payments, financial reports.
  accountant: {
    "sales.viewAll": true,
    "sales.viewOwn": true,
    "sales.printReceipt": true,
    "sales.refund": "approval",
    "products.view": true,
    "products.viewStock": true,
    "inventory.receive": false,
    "inventory.adjust": false,
    "customers.view": true,
    "customers.manage": true,
    "payments.process": false,
    "payments.manageExpenses": true,
    "payments.cashDrawer": "approval",
    "registers.view": true,
    "registers.manage": false,
    "reports.viewOwn": true,
    "reports.viewAll": true,
    "reports.export": true,
    "team.view": false,
    "devices.view": false,
    "settings.view": false,
    "tax.view": true,
    "tax.configure": "approval",
    "subscription.view": false,
    "ownership.transfer": false,
    "ownership.deleteBusiness": false
  },
  // ðŸ“ˆ Reports â€” read-only reporting.
  reports: {
    "sales.viewAll": true,
    "sales.viewOwn": true,
    "sales.printReceipt": true,
    "products.view": true,
    "products.viewStock": true,
    "customers.view": true,
    "reports.viewOwn": true,
    "reports.viewAll": true,
    "reports.export": true,
    "registers.view": true,
    "tax.view": true,
    "devices.view": false,
    "settings.view": false
  },
  // ðŸšš Warehouse â€” warehouse & stock operations.
  warehouse: {
    "products.view": true,
    "products.viewStock": true,
    "products.scanBarcode": true,
    "inventory.receive": true,
    "inventory.adjust": "approval",
    "inventory.count": true,
    "inventory.transfer": true,
    "inventory.suppliers": true,
    "reports.viewOwn": true,
    "customers.view": false,
    "sales.create": false
  }
};
const ROLE_NAME = {
  owner: "Owner",
  manager: "Manager",
  cashier: "Cashier",
  inventory: "Inventory",
  accountant: "Accountant / Finance",
  reports: "Reports",
  warehouse: "Warehouse"
};
const ROLE_DESCRIPTION = {
  owner: "Full control over the business, including ownership, subscription and devices.",
  manager: "Runs business operations. No ownership/subscription control unless granted.",
  cashier: "POS and payment operations only.",
  inventory: "Products, stock receiving, counts and transfers.",
  accountant: "Expenses, payments and financial reports.",
  reports: "Read-only reporting access.",
  warehouse: "Warehouse and stock operations."
};
const BUILTIN_ROLES = ROLE_ORDER.map((key) => ({
  key,
  name: ROLE_NAME[key],
  description: ROLE_DESCRIPTION[key],
  isSystem: true,
  builtinKey: key,
  permissions: DEFAULT_ROLE_SETS[key]
}));
function getBuiltinRole(key) {
  return BUILTIN_ROLES.find((r) => r.builtinKey === key);
}
const BUSINESS_ADAPTER_ENTITIES = ["businesses", "locations", "registers", "business_roles", "users", "devices"];
const businesses = {
  mobileToDesktop: {
    name: "businessName",
    currency: "currency",
    address: "address",
    is_default: "isDefault",
    uuid: "uuid",
    row_version: "row_version",
    is_deleted: "is_deleted",
    is_synced: "is_synced",
    created_at: "created_at",
    updated_at: "updated_at"
  },
  desktopToMobile: {
    businessName: "name",
    currency: "currency",
    address: "address",
    isDefault: "is_default",
    uuid: "uuid",
    row_version: "row_version",
    is_deleted: "is_deleted",
    is_synced: "is_synced",
    created_at: "created_at",
    updated_at: "updated_at"
  },
  mobileFk: [],
  desktopFk: []
};
const locations = {
  mobileToDesktop: {
    business_id: "businessId",
    name: "name",
    address: "address",
    uuid: "uuid",
    row_version: "row_version",
    is_deleted: "is_deleted",
    is_synced: "is_synced",
    created_at: "created_at"
  },
  desktopToMobile: {
    businessId: "business_id",
    name: "name",
    address: "address",
    uuid: "uuid",
    row_version: "row_version",
    is_deleted: "is_deleted",
    is_synced: "is_synced",
    created_at: "created_at"
  },
  mobileFk: [{ mobileField: "business_id", desktopColumn: "businessId", lookupEntity: "businesses" }],
  desktopFk: [{ desktopColumn: "businessId", mobileField: "business_id", lookupEntity: "businesses" }]
};
const registers = {
  mobileToDesktop: {
    business_id: "businessId",
    location_id: "locationId",
    name: "name",
    device_id: "deviceId",
    printer_name: "printerName",
    has_drawer: "hasDrawer",
    is_active: "isActive",
    uuid: "uuid",
    row_version: "row_version",
    is_deleted: "is_deleted",
    is_synced: "is_synced",
    created_at: "created_at"
  },
  desktopToMobile: {
    businessId: "business_id",
    locationId: "location_id",
    name: "name",
    deviceId: "device_id",
    printerName: "printer_name",
    hasDrawer: "has_drawer",
    isActive: "is_active",
    uuid: "uuid",
    row_version: "row_version",
    is_deleted: "is_deleted",
    is_synced: "is_synced",
    created_at: "created_at"
  },
  mobileFk: [
    { mobileField: "location_id", desktopColumn: "locationId", lookupEntity: "locations" },
    { mobileField: "device_id", desktopColumn: "deviceId", lookupEntity: "devices" }
  ],
  desktopFk: [
    { desktopColumn: "locationId", mobileField: "location_id", lookupEntity: "locations" },
    { desktopColumn: "deviceId", mobileField: "device_id", lookupEntity: "devices" }
  ]
};
const business_roles = {
  mobileToDesktop: {
    business_id: "businessId",
    name: "name",
    description: "description",
    permissions: "permissions",
    is_system: "isSystem",
    builtin_key: "builtinKey",
    uuid: "uuid",
    row_version: "row_version",
    is_deleted: "is_deleted",
    is_synced: "is_synced",
    created_at: "created_at"
  },
  desktopToMobile: {
    businessId: "business_id",
    name: "name",
    description: "description",
    permissions: "permissions",
    isSystem: "is_system",
    builtinKey: "builtin_key",
    uuid: "uuid",
    row_version: "row_version",
    is_deleted: "is_deleted",
    is_synced: "is_synced",
    created_at: "created_at"
  },
  mobileFk: [{ mobileField: "business_id", desktopColumn: "businessId", lookupEntity: "businesses" }],
  desktopFk: [{ desktopColumn: "businessId", mobileField: "business_id", lookupEntity: "businesses" }]
};
const users = {
  mobileToDesktop: {
    business_id: "businessId",
    name: "name",
    phone: "phone",
    email: "email",
    role: "role",
    role_name: "roleName",
    permissions: "permissions",
    assigned_register_id: "assignedRegisterId",
    assigned_location_id: "assignedLocationId",
    is_active: "isActive",
    is_owner: "isOwner",
    pin_hash: "pinHash",
    pin_salt: "pinSalt",
    uuid: "uuid",
    row_version: "row_version",
    is_deleted: "is_deleted",
    is_synced: "is_synced",
    created_at: "created_at",
    updated_at: "updated_at"
  },
  desktopToMobile: {
    businessId: "business_id",
    name: "name",
    phone: "phone",
    email: "email",
    role: "role",
    roleName: "role_name",
    permissions: "permissions",
    assignedRegisterId: "assigned_register_id",
    assignedLocationId: "assigned_location_id",
    isActive: "is_active",
    isOwner: "is_owner",
    pinHash: "pin_hash",
    pinSalt: "pin_salt",
    uuid: "uuid",
    row_version: "row_version",
    is_deleted: "is_deleted",
    is_synced: "is_synced",
    created_at: "created_at",
    updated_at: "updated_at"
  },
  mobileFk: [
    { mobileField: "business_id", desktopColumn: "businessId", lookupEntity: "businesses" },
    { mobileField: "assigned_register_id", desktopColumn: "assignedRegisterId", lookupEntity: "registers" },
    { mobileField: "assigned_location_id", desktopColumn: "assignedLocationId", lookupEntity: "locations" }
  ],
  desktopFk: [
    { desktopColumn: "businessId", mobileField: "business_id", lookupEntity: "businesses" },
    { desktopColumn: "assignedRegisterId", mobileField: "assigned_register_id", lookupEntity: "registers" },
    { desktopColumn: "assignedLocationId", mobileField: "assigned_location_id", lookupEntity: "locations" }
  ]
};
const devices = {
  desktopTable: "roster_devices",
  mobileToDesktop: {
    business_id: "businessId",
    user_id: "userId",
    name: "name",
    model: "model",
    platform: "platform",
    register_id: "registerId",
    role: "role",
    status: "status",
    pairing_code: "pairingCode",
    pairing_expires_at: "pairingExpiresAt",
    last_seen_at: "lastSeenAt",
    last_sync_at: "lastSyncAt",
    app_version: "appVersion",
    is_primary: "isPrimary",
    uuid: "uuid",
    row_version: "row_version",
    is_deleted: "is_deleted",
    is_synced: "is_synced",
    created_at: "created_at",
    updated_at: "updated_at"
  },
  desktopToMobile: {
    businessId: "business_id",
    userId: "user_id",
    name: "name",
    model: "model",
    platform: "platform",
    registerId: "register_id",
    role: "role",
    status: "status",
    pairingCode: "pairing_code",
    pairingExpiresAt: "pairing_expires_at",
    lastSeenAt: "last_seen_at",
    lastSyncAt: "last_sync_at",
    appVersion: "app_version",
    isPrimary: "is_primary",
    uuid: "uuid",
    row_version: "row_version",
    is_deleted: "is_deleted",
    is_synced: "is_synced",
    created_at: "created_at",
    updated_at: "updated_at"
  },
  mobileFk: [
    { mobileField: "business_id", desktopColumn: "businessId", lookupEntity: "businesses" },
    { mobileField: "user_id", desktopColumn: "userId", lookupEntity: "users" },
    { mobileField: "register_id", desktopColumn: "registerId", lookupEntity: "registers" }
  ],
  desktopFk: [
    { desktopColumn: "businessId", mobileField: "business_id", lookupEntity: "businesses" },
    { desktopColumn: "userId", mobileField: "user_id", lookupEntity: "users" },
    { desktopColumn: "registerId", mobileField: "register_id", lookupEntity: "registers" }
  ]
};
const FIELD_MAPS = {
  businesses,
  locations,
  registers,
  business_roles,
  users,
  devices
};
function desktopTableName(entity) {
  return FIELD_MAPS[entity]?.desktopTable ?? entity;
}
function mobileToDesktopPayload(entity, payload) {
  const map = FIELD_MAPS[entity];
  const out = {};
  for (const mobile of Object.keys(payload)) {
    const desktop = map.mobileToDesktop[mobile];
    if (desktop) out[desktop] = payload[mobile];
  }
  return out;
}
function desktopToMobilePayload(entity, row) {
  const map = FIELD_MAPS[entity];
  const out = {};
  for (const desktop of Object.keys(row)) {
    const mobile = map.desktopToMobile[desktop];
    if (mobile) out[mobile] = row[desktop];
  }
  return out;
}
const DEVICE_JOIN_MSG = {
  SUBMIT: "DEVICE_JOIN_SUBMIT",
  LIST: "DEVICE_JOIN_LIST",
  DECIDE: "DEVICE_JOIN_DECIDE",
  PUBLISH: "INVITE_PUBLISH",
  RESOLVE: "INVITE_RESOLVE",
  /** joiner polls for the decision on its request */
  STATUS: "DEVICE_JOIN_STATUS",
  RESPONSE: "DEVICE_JOIN_RESPONSE",
  ACK: "DEVICE_JOIN_ACK"
};
const isDev$1 = !electron.app.isPackaged;
const dbDir = isDev$1 ? path.join(process.cwd(), "db") : path.join(electron.app.getPath("userData"), "db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, "shega_desktop.db");
const demoDbPath = path.join(dbDir, "shega_desktop_demo.db");
let db = new Database(dbPath);
let demoDb = null;
let currentDb = db;
let isDemoMode = false;
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");
db.pragma("foreign_keys = ON");
function getDemoMode() {
  return isDemoMode;
}
function setDemoMode(enabled) {
  isDemoMode = enabled;
  currentDb = enabled ? getDemoDb() : db;
}
function getCurrentDb() {
  return currentDb;
}
function getDemoDb() {
  if (!demoDb) {
    if (!fs.existsSync(demoDbPath)) {
      fs.copyFileSync(dbPath, demoDbPath);
    }
    demoDb = new Database(demoDbPath);
    demoDb.pragma("journal_mode = WAL");
    demoDb.pragma("busy_timeout = 5000");
    demoDb.pragma("foreign_keys = ON");
  }
  return demoDb;
}
function resetDemoDb() {
  if (demoDb) {
    demoDb.close();
    demoDb = null;
  }
  if (fs.existsSync(demoDbPath)) {
    fs.unlinkSync(demoDbPath);
  }
  fs.copyFileSync(dbPath, demoDbPath);
  demoDb = new Database(demoDbPath);
  demoDb.pragma("journal_mode = WAL");
  demoDb.pragma("busy_timeout = 5000");
  demoDb.pragma("foreign_keys = ON");
  if (isDemoMode) {
    currentDb = demoDb;
  }
}
try {
  const integrity = db.pragma("integrity_check", { simple: true });
  const result = Array.isArray(integrity) ? integrity[0] : integrity;
  if (result !== "ok") {
    console.error(`[DB] Integrity check FAILED: ${result}`);
    try {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('db_integrity_status', ?)").run(JSON.stringify({
        ok: false,
        message: Array.isArray(integrity) ? integrity.join(", ") : integrity,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }));
    } catch {
    }
  } else {
    try {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('db_integrity_status', ?)").run(JSON.stringify({ ok: true, timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
    } catch {
    }
  }
} catch (_) {
  console.warn("[DB] Integrity check skipped (empty DB?)");
}
const dbProxy = new Proxy({}, {
  get(target, prop) {
    return currentDb[prop];
  }
});
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
  const salt = crypto$1.randomBytes(16).toString("hex");
  const key = crypto$1.scryptSync(pin, salt, 64).toString("hex");
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
    if (!budgetColNames.includes("updatedAt")) db.exec("ALTER TABLE budgets ADD COLUMN updatedAt TEXT");
    db.exec("UPDATE budgets SET updatedAt = CURRENT_TIMESTAMP WHERE updatedAt IS NULL");
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
    const syncTables2 = ["categories", "items", "item_packs", "sales", "debt_payments", "returns", "expenses", "adjustments", "customers", "contacts", "suppliers", "orders", "order_items", "shipments", "shipment_items", "employee_roles", "employees", "employee_accounts", "subscriptions", "notification_reminders", "budgets"];
    for (const tbl2 of syncTables2) {
      const cols = db.prepare(`PRAGMA table_info(${tbl2})`).all();
      const names = cols.map((c) => c.name);
      if (!names.includes("uuid")) db.exec(`ALTER TABLE ${tbl2} ADD COLUMN uuid TEXT`);
      if (!names.includes("device_id")) db.exec(`ALTER TABLE ${tbl2} ADD COLUMN device_id TEXT`);
      if (!names.includes("row_version")) db.exec(`ALTER TABLE ${tbl2} ADD COLUMN row_version INTEGER DEFAULT 1`);
      if (!names.includes("updated_at")) db.exec(`ALTER TABLE ${tbl2} ADD COLUMN updated_at TEXT`);
      db.exec(`UPDATE ${tbl2} SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL`);
      if (!names.includes("is_deleted")) db.exec(`ALTER TABLE ${tbl2} ADD COLUMN is_deleted INTEGER DEFAULT 0`);
      if (!names.includes("deleted_at")) db.exec(`ALTER TABLE ${tbl2} ADD COLUMN deleted_at TEXT`);
      if (!names.includes("is_synced")) db.exec(`ALTER TABLE ${tbl2} ADD COLUMN is_synced INTEGER DEFAULT 1`);
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
      const c = crypto$1.createHash("sha256");
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
  if (version < 22) {
    const devCols = db.prepare("PRAGMA table_info(devices)").all().map((c) => c.name);
    const addDev = (col, def) => {
      if (!devCols.includes(col)) db.exec(`ALTER TABLE devices ADD COLUMN ${col} ${def}`);
    };
    addDev("platform", "TEXT NOT NULL DEFAULT 'desktop'");
    addDev("role", "TEXT");
    addDev("status", "TEXT NOT NULL DEFAULT 'active'");
    addDev("userId", "INTEGER");
    addDev("registerId", "INTEGER");
    addDev("appVersion", "TEXT");
    addDev("isPrimary", "INTEGER DEFAULT 0");
    addDev("uuid", "TEXT");
    addDev("row_version", "INTEGER DEFAULT 1");
    addDev("updated_at", "TEXT");
    addDev("is_deleted", "INTEGER DEFAULT 0");
    addDev("is_synced", "INTEGER DEFAULT 1");
    const empCols = db.prepare("PRAGMA table_info(employees)").all().map((c) => c.name);
    if (!empCols.includes("role_key")) db.exec("ALTER TABLE employees ADD COLUMN role_key TEXT");
    if (!empCols.includes("permissions_json")) db.exec("ALTER TABLE employees ADD COLUMN permissions_json TEXT");
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
    const seed = db.prepare("INSERT OR IGNORE INTO business_roles (name, description, permissions, isSystem, builtinKey) VALUES (?, ?, ?, 1, ?)");
    for (const r of BUILTIN_ROLES) {
      seed.run(r.name, r.description ?? "", JSON.stringify(r.permissions), r.builtinKey ?? r.key);
    }
    version = 22;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 23) {
    const addSyncCols = (table, cols) => {
      const have = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
      for (const c of cols) {
        if (have.includes(c)) continue;
        if (c === "device_id") db.exec(`ALTER TABLE ${table} ADD COLUMN device_id TEXT`);
        else if (c === "updated_at") db.exec(`ALTER TABLE ${table} ADD COLUMN updated_at TEXT`);
        else if (c === "deleted_at") db.exec(`ALTER TABLE ${table} ADD COLUMN deleted_at TEXT`);
      }
      db.exec(`UPDATE ${table} SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL`);
    };
    addSyncCols("locations", ["device_id", "updated_at", "deleted_at"]);
    addSyncCols("registers", ["device_id", "updated_at", "deleted_at"]);
    addSyncCols("business_roles", ["device_id", "updated_at", "deleted_at"]);
    version = 23;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 24) {
    const bizCols = db.prepare("PRAGMA table_info(businesses)").all().map((c) => c.name);
    const addBiz = (col, def) => {
      if (!bizCols.includes(col)) db.exec(`ALTER TABLE businesses ADD COLUMN ${col} ${def}`);
    };
    addBiz("uuid", "TEXT");
    addBiz("device_id", "TEXT");
    addBiz("row_version", "INTEGER DEFAULT 1");
    addBiz("updated_at", "TEXT");
    db.exec("UPDATE businesses SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL");
    addBiz("is_deleted", "INTEGER DEFAULT 0");
    addBiz("deleted_at", "TEXT");
    addBiz("is_synced", "INTEGER DEFAULT 1");
    const genUuid2 = "lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))";
    db.exec(`UPDATE businesses SET uuid = ${genUuid2} WHERE uuid IS NULL;`);
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_uuid ON businesses(uuid);");
    version = 24;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 25) {
    const devCols = db.prepare("PRAGMA table_info(devices)").all().map((c) => c.name);
    if (!devCols.includes("uuid")) db.exec("ALTER TABLE devices ADD COLUMN uuid TEXT");
    db.exec("UPDATE devices SET uuid = device_id WHERE uuid IS NULL;");
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_uuid ON devices(uuid);");
    version = 25;
    db.pragma(`user_version = ${version}`);
  }
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
  if (version < 28) {
    const cols = db.prepare("PRAGMA table_info(stock_movements)").all();
    const names = cols.map((c) => c.name);
    if (!names.includes("uuid")) db.exec("ALTER TABLE stock_movements ADD COLUMN uuid TEXT");
    if (!names.includes("device_id")) db.exec("ALTER TABLE stock_movements ADD COLUMN device_id TEXT");
    if (!names.includes("businessId")) db.exec("ALTER TABLE stock_movements ADD COLUMN businessId INTEGER REFERENCES businesses(id)");
    if (!names.includes("row_version")) db.exec("ALTER TABLE stock_movements ADD COLUMN row_version INTEGER DEFAULT 1");
    if (!names.includes("updated_at")) db.exec("ALTER TABLE stock_movements ADD COLUMN updated_at TEXT");
    db.exec("UPDATE stock_movements SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL");
    if (!names.includes("is_deleted")) db.exec("ALTER TABLE stock_movements ADD COLUMN is_deleted INTEGER DEFAULT 0");
    if (!names.includes("deleted_at")) db.exec("ALTER TABLE stock_movements ADD COLUMN deleted_at TEXT");
    if (!names.includes("is_synced")) db.exec("ALTER TABLE stock_movements ADD COLUMN is_synced INTEGER DEFAULT 1");
    db.exec(`UPDATE stock_movements SET uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), row_version = 1 WHERE uuid IS NULL;`);
    const auditCols = db.prepare("PRAGMA table_info(audit_logs)").all();
    const auditNames = auditCols.map((c) => c.name);
    if (!auditNames.includes("uuid")) db.exec("ALTER TABLE audit_logs ADD COLUMN uuid TEXT");
    if (!auditNames.includes("source_device")) db.exec("ALTER TABLE audit_logs ADD COLUMN source_device TEXT");
    db.exec(`UPDATE audit_logs SET uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))) WHERE uuid IS NULL;`);
    version = 28;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 29) {
    const aCols = db.prepare("PRAGMA table_info(audit_logs)").all().map((c) => c.name);
    const addA = (col, def) => {
      if (!aCols.includes(col)) db.exec(`ALTER TABLE audit_logs ADD COLUMN ${col} ${def}`);
    };
    addA("device_id", "TEXT");
    addA("row_version", "INTEGER DEFAULT 1");
    addA("updated_at", "TEXT");
    addA("is_deleted", "INTEGER DEFAULT 0");
    addA("deleted_at", "TEXT");
    addA("is_synced", "INTEGER DEFAULT 1");
    db.exec("UPDATE audit_logs SET updated_at = COALESCE(updated_at, createdAt, CURRENT_TIMESTAMP) WHERE updated_at IS NULL");
    version = 29;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 30) {
    const opTables = ["budgets", "suppliers", "contacts", "orders", "order_items", "order_history", "shipments", "shipment_items", "shipment_history", "employees", "employee_accounts", "employee_roles", "attendance", "employee_performance", "subscriptions", "notification_reminders"];
    for (const tbl2 of opTables) {
      let names = [];
      try {
        names = db.prepare(`PRAGMA table_info(${tbl2})`).all().map((c) => c.name);
      } catch {
        continue;
      }
      const add = (col, def) => {
        if (!names.includes(col)) {
          try {
            db.exec(`ALTER TABLE ${tbl2} ADD COLUMN ${col} ${def}`);
          } catch {
          }
        }
      };
      add("uuid", "TEXT");
      add("device_id", "TEXT");
      add("row_version", "INTEGER DEFAULT 1");
      add("updated_at", "TEXT");
      add("deleted_at", "TEXT");
      add("is_deleted", "INTEGER DEFAULT 0");
      add("is_synced", "INTEGER DEFAULT 1");
      try {
        db.exec(`UPDATE ${tbl2} SET updated_at = COALESCE(updated_at, createdAt, CURRENT_TIMESTAMP) WHERE updated_at IS NULL`);
      } catch {
      }
      try {
        db.exec(`UPDATE ${tbl2} SET uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), row_version = 1 WHERE uuid IS NULL;`);
      } catch {
      }
      try {
        db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_${tbl2}_uuid ON ${tbl2}(uuid);`);
      } catch {
      }
    }
    let supN = [];
    try {
      supN = db.prepare("PRAGMA table_info(suppliers)").all().map((c) => c.name);
    } catch {
    }
    if (!supN.includes("contact_id")) {
      try {
        db.exec("ALTER TABLE suppliers ADD COLUMN contact_id INTEGER REFERENCES contacts(id)");
      } catch {
      }
    }
    version = 30;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 31) {
    const cols = db.prepare("PRAGMA table_info(sales)").all().map((c) => c.name);
    if (!cols.includes("overrideBy")) db.exec("ALTER TABLE sales ADD COLUMN overrideBy TEXT");
    if (!cols.includes("overrideReason")) db.exec("ALTER TABLE sales ADD COLUMN overrideReason TEXT");
    version = 31;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 32) {
    const fallbackBiz = db.prepare("SELECT id FROM businesses WHERE isDefault = 1 LIMIT 1").get()?.id || 1;
    const scopeCandidates = [
      "employees",
      "employee_roles",
      "categories",
      "items",
      "item_packs",
      "item_barcodes",
      "quick_products",
      "sales",
      "debt_payments",
      "expenses",
      "adjustments",
      "customers",
      "warehouses",
      "returns",
      "gift_cards",
      "gift_card_transactions",
      "attendance",
      "employee_performance",
      "stock_movements",
      "suppliers",
      "supplier_purchases",
      "supplier_payments",
      "orders",
      "order_items",
      "shipments",
      "shipment_items",
      "budgets",
      "contacts"
    ];
    for (const t of scopeCandidates) {
      try {
        const cols = db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
        if (!cols.includes("businessId")) continue;
        db.exec(`UPDATE ${t} SET businessId = ${Number(fallbackBiz)} WHERE businessId IS NULL`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_${t}_businessId ON ${t}(businessId)`);
      } catch (e) {
      }
    }
    version = 32;
    db.pragma(`user_version = ${version}`);
  }
  if (version < 33) {
    const uCols = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
    if (!uCols.includes("assignedRegisterId")) db.exec("ALTER TABLE users ADD COLUMN assignedRegisterId INTEGER REFERENCES registers(id)");
    if (!uCols.includes("assignedLocationId")) db.exec("ALTER TABLE users ADD COLUMN assignedLocationId INTEGER REFERENCES locations(id)");
    version = 33;
    db.pragma(`user_version = ${version}`);
  }
  const syncTables = [
    { table: "businesses", id: "id", columns: ["id", "businessName", "storeName", "logo", "address", "phone", "email", "currency", "isDefault", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "categories", id: "id", columns: ["id", "businessId", "name", "icon", "isCustom", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "items", id: "id", columns: ["id", "businessId", "name", "categoryId", "sku", "barcode", "companyName", "purchaseUnit", "baseUnit", "unitsPerPack", "totalPackQuantity", "totalBaseQuantity", "packPurchasePrice", "basePurchasePrice", "baseSellingPrice", "packSellingPrice", "allowSellByBaseUnit", "allowSellByPackUnit", "expiryDate", "qualityGrade", "notes", "isCredit", "supplierPhone", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "item_packs", id: "id", columns: ["id", "itemId", "packNumber", "initialQuantity", "currentQuantity", "unit", "status", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "sales", id: "id", columns: ["id", "businessId", "itemId", "quantity", "unit", "unitType", "discount", "vat", "totalPrice", "paymentMethod", "paymentStatus", "status", "customerName", "customerPhone", "packId", "dueDate", "paidAmount", "createdBy", "createdAt", "fiscal_number", "fiscal_signature", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced", "overrideBy", "overrideReason", "voidReason", "voidedBy", "voidedAt"] },
    { table: "debt_payments", id: "id", columns: ["id", "saleId", "customerName", "customerPhone", "amount", "type", "note", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "returns", id: "id", columns: ["id", "businessId", "saleId", "itemId", "quantity", "unit", "unitType", "refundAmount", "reason", "status", "createdBy", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "expenses", id: "id", columns: ["id", "businessId", "name", "amount", "category", "date", "isRecurring", "frequency", "nextBillingDate", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "adjustments", id: "id", columns: ["id", "businessId", "itemId", "type", "oldValue", "newValue", "quantity", "unitType", "reason", "date", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "customers", id: "id", columns: ["id", "businessId", "customerName", "phone", "secondaryPhone", "email", "address", "city", "company", "taxNumber", "groupName", "creditLimit", "notes", "isActive", "createdAt", "updatedAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "locations", id: "id", columns: ["id", "businessId", "name", "address", "uuid", "device_id", "row_version", "created_at", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "registers", id: "id", columns: ["id", "businessId", "locationId", "name", "deviceId", "printerName", "hasDrawer", "isActive", "uuid", "device_id", "row_version", "created_at", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "business_roles", id: "id", columns: ["id", "businessId", "name", "description", "permissions", "isSystem", "builtinKey", "uuid", "device_id", "row_version", "created_at", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "users", relay: "users", id: "id", columns: ["id", "businessId", "name", "phone", "email", "role", "roleName", "permissions", "isActive", "isOwner", "pinHash", "pinSalt", "uuid", "device_id", "row_version", "created_at", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "roster_devices", relay: "devices", id: "id", columns: ["id", "businessId", "userId", "name", "model", "platform", "registerId", "role", "status", "pairingCode", "pairingExpiresAt", "lastSeenAt", "lastSyncAt", "appVersion", "isPrimary", "uuid", "device_id", "row_version", "created_at", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "budgets", id: "id", columns: ["id", "businessId", "category", "amount", "period", "month", "year", "budgetType", "referenceName", "isRecurring", "notes", "updatedAt", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "suppliers", id: "id", columns: ["id", "businessId", "supplierCode", "supplierName", "companyName", "contactPerson", "phone", "secondaryPhone", "email", "address", "city", "country", "taxNumber", "paymentTerms", "creditLimit", "notes", "status", "isActive", "createdAt", "updatedAt", "contact_id", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "contacts", id: "id", columns: ["id", "businessId", "name", "phone", "category", "subCategory", "notes", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "orders", id: "id", columns: ["id", "businessId", "orderNumber", "customerName", "customerPhone", "notes", "status", "totalAmount", "createdBy", "createdByName", "createdAt", "convertedAt", "convertedBy", "cancelledAt", "cancelledBy", "cancelReason", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "order_items", id: "id", columns: ["id", "orderId", "itemId", "itemName", "quantity", "unit", "unitType", "unitPrice", "totalPrice", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "shipments", id: "id", columns: ["id", "businessId", "origin", "destination", "driverName", "driverPhone", "vehicleInfo", "status", "notes", "scheduledDate", "deliveredAt", "createdAt", "updatedAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "shipment_items", id: "id", columns: ["id", "shipmentId", "itemId", "itemName", "quantity", "unit", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "employees", id: "id", columns: ["id", "businessId", "employeeCode", "firstName", "lastName", "phone", "email", "address", "emergencyContact", "gender", "dateOfBirth", "roleId", "department", "warehouseId", "isActive", "employmentStatus", "avatar", "hireDate", "notes", "createdAt", "updatedAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "employee_roles", id: "id", columns: ["id", "businessId", "name", "description", "permissions", "isSystem", "createdAt", "updatedAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "employee_accounts", id: "id", columns: ["id", "employeeId", "username", "pin", "isActive", "forcePasswordChange", "failedLoginAttempts", "lockedUntil", "lastPasswordChange", "lastLogin", "createdAt", "updatedAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "notification_reminders", id: "id", columns: ["id", "businessId", "title", "message", "category", "triggerDate", "repeatInterval", "status", "lastTriggeredAt", "completedAt", "snoozedUntil", "relatedEntityType", "relatedEntityId", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "subscriptions", id: "id", columns: ["id", "businessId", "planId", "tier", "status", "startedAt", "expiresAt", "trialStartedAt", "trialEndsAt", "isTrial", "autoRenew", "createdAt", "updatedAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "attendance", id: "id", columns: ["id", "employeeId", "date", "clockIn", "clockOut", "status", "notes", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "employee_performance", id: "id", columns: ["id", "employeeId", "period", "salesAmount", "ordersProcessed", "attendanceScore", "tasksCompleted", "rating", "notes", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "order_history", id: "id", columns: ["id", "orderId", "status", "changedBy", "notes", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "shipment_history", id: "id", columns: ["id", "shipmentId", "status", "changedBy", "notes", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "budget_categories", id: "id", columns: ["id", "budgetId", "category", "plannedAmount", "notes", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "budget_adjustments", id: "id", columns: ["id", "budgetId", "businessId", "previousAmount", "newAmount", "reason", "status", "requestedBy", "approvedBy", "approvedAt", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "subscription_payments", id: "id", columns: ["id", "subscriptionId", "transactionId", "businessName", "phoneNumber", "planName", "amount", "currency", "paymentDate", "notes", "status", "verifiedAt", "verifiedBy", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "subscription_renewals", id: "id", columns: ["id", "subscriptionId", "previousExpiry", "newExpiry", "plan", "durationMonths", "amount", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] },
    { table: "notifications", id: "id", columns: ["id", "type", "title", "message", "category", "priority", "isRead", "groupKey", "actionUrl", "actionLabel", "expiresAt", "createdAt", "uuid", "device_id", "row_version", "updated_at", "is_deleted", "deleted_at", "is_synced"] }
  ];
  const genUuid = "lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))";
  for (const t of syncTables) {
    const relayName = t.relay ?? t.table;
    const newArgs = t.columns.map((c) => `'${c}', ${c}`).join(", ");
    const oldArgs = t.columns.map((c) => `'${c}', OLD.${c}`).join(", ");
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
function validateDBFile(filePath) {
  try {
    const chk = new Database(filePath, { readonly: true, fileMustExist: true });
    const integrity = chk.pragma("integrity_check", { simple: true });
    const result = Array.isArray(integrity) ? integrity[0] : integrity;
    chk.close();
    return result === "ok" ? { ok: true } : { ok: false, message: `integrity_check: ${result}` };
  } catch (e) {
    return { ok: false, message: e?.message || String(e) };
  }
}
function reopenDB() {
  db.close();
  const wal = `${dbPath}-wal`;
  const shm = `${dbPath}-shm`;
  try {
    if (fs.existsSync(wal)) fs.unlinkSync(wal);
  } catch {
  }
  try {
    if (fs.existsSync(shm)) fs.unlinkSync(shm);
  } catch {
  }
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.pragma("foreign_keys = ON");
  module.exports.default = db;
}
const AUDIT_GENESIS = "GENESIS";
function auditHash(prev, r) {
  const c = crypto$1.createHash("sha256");
  c.update(
    `${prev}|${r.id}|${r.action}|${r.entityType}|${r.entityId ?? ""}|${r.fieldName ?? ""}|${r.oldValue ?? ""}|${r.newValue ?? ""}|${r.changedBy ?? ""}|${r.description ?? ""}|${r.createdAt ?? ""}`
  );
  return c.digest("hex");
}
function insertAudit(db2, entry, opts) {
  const insert = db2.prepare(
    `INSERT INTO audit_logs (businessId, action, entityType, entityId, fieldName, oldValue, newValue, changedBy, changedById, description, createdAt, uuid, source_device)
     VALUES (@businessId, @action, @entityType, @entityId, @fieldName, @oldValue, @newValue, @changedBy, @changedById, @description, @createdAt, @uuid, @source_device)`
  );
  const tx = db2.transaction(() => {
    const prev = db2.prepare("SELECT hash FROM audit_logs ORDER BY id DESC LIMIT 1").get()?.hash ?? AUDIT_GENESIS;
    const uuid = opts?.uuid || crypto$1.randomUUID();
    const info = insert.run({
      ...entry,
      createdAt: entry.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
      uuid,
      source_device: opts?.sourceDevice ?? null
    });
    const id = Number(info.lastInsertRowid);
    const row = db2.prepare("SELECT * FROM audit_logs WHERE id = ?").get(id);
    const h = auditHash(prev, row);
    db2.prepare("UPDATE audit_logs SET hash = ?, prev_hash = ? WHERE id = ?").run(h, prev, id);
    return id;
  });
  return tx();
}
function verifyAuditChain(db2) {
  const rows = db2.prepare("SELECT * FROM audit_logs ORDER BY id ASC").all();
  let prev = AUDIT_GENESIS;
  for (const r of rows) {
    const expected = auditHash(prev, r);
    if (r.prev_hash !== prev || r.hash !== expected) {
      return { ok: false, count: rows.length, brokenAt: r.id };
    }
    prev = r.hash ?? prev;
  }
  return { ok: true, count: rows.length, brokenAt: null };
}
const UPDATE_CACHE_TTL = 1e3 * 60 * 60;
const PREFS_FILE = "update-preferences.json";
const LOG_FILE = "updater.log";
class AppUpdater {
  mainWindow = null;
  status = "idle";
  updateInfo = null;
  progressInfo = null;
  errorMessage = null;
  prefs = {
    skippedVersions: [],
    remindLaterAt: null,
    autoCheckEnabled: true
  };
  cache = null;
  logPath;
  prefsPath;
  initialized = false;
  isDev;
  constructor() {
    this.isDev = !electron.app.isPackaged;
    this.logPath = "";
    this.prefsPath = "";
    this.setupAutoUpdater();
  }
  ensurePaths() {
    if (this.logPath) return;
    const userDataPath = electron.app.getPath("userData");
    this.logPath = path__namespace.join(userDataPath, LOG_FILE);
    this.prefsPath = path__namespace.join(userDataPath, PREFS_FILE);
    this.loadPreferences();
  }
  setupAutoUpdater() {
    electronUpdater.autoUpdater.autoDownload = false;
    electronUpdater.autoUpdater.autoInstallOnAppQuit = false;
    electronUpdater.autoUpdater.allowPrerelease = false;
    if (this.isDev) {
      this.log("Development mode - update checking disabled by default");
    }
  }
  setUpstreamEvents() {
    electronUpdater.autoUpdater.on("checking-for-update", () => {
      this.log("Checking for updates...");
      this.status = "checking";
      this.errorMessage = null;
      this.emit("update:status", { status: "checking" });
    });
    electronUpdater.autoUpdater.on("update-available", (info) => {
      this.log(`Update available: v${info.version}`);
      this.status = "available";
      this.updateInfo = info;
      this.cacheUpdateInfo(info);
      const formatted = this.formatUpdateInfo(info);
      this.emit("update:status", { status: "available", info: formatted });
    });
    electronUpdater.autoUpdater.on("update-not-available", () => {
      this.log("No updates available");
      this.status = "not-available";
      this.updateInfo = null;
      this.emit("update:status", { status: "not-available" });
    });
    electronUpdater.autoUpdater.on("download-progress", (progress) => {
      this.progressInfo = progress;
      this.emit("update:progress", {
        bytesPerSecond: progress.bytesPerSecond,
        percent: progress.percent,
        total: progress.total,
        transferred: progress.transferred,
        eta: this.calculateETA(progress)
      });
    });
    electronUpdater.autoUpdater.on("update-downloaded", (info) => {
      this.log(`Update downloaded successfully: v${info.version}`);
      this.status = "downloaded";
      this.emit("update:status", {
        status: "downloaded",
        info: this.formatUpdateInfo(info)
      });
    });
    electronUpdater.autoUpdater.on("error", (error) => {
      this.log(`Error: ${error.message}`);
      this.status = "error";
      this.errorMessage = error.message;
      this.emit("update:error", { message: error.message });
    });
  }
  init(mainWindow) {
    this.mainWindow = mainWindow;
    this.ensurePaths();
    if (!this.initialized) {
      this.setUpstreamEvents();
      this.initialized = true;
      this.log("Updater initialized");
    }
  }
  emit(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }
  log(message) {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    const line = `[${ts}] [UPDATER] ${message}`;
    console.log(line);
    if (!this.logPath) return;
    try {
      fs__namespace.appendFileSync(this.logPath, line + "\n");
    } catch {
    }
  }
  formatUpdateInfo(info) {
    let releaseNotes = "";
    if (typeof info.releaseNotes === "string") {
      releaseNotes = info.releaseNotes;
    } else if (Array.isArray(info.releaseNotes)) {
      releaseNotes = info.releaseNotes.map((n) => typeof n === "string" ? n : n.note || "").join("\n");
    }
    return {
      version: info.version,
      releaseDate: info.releaseDate || "",
      releaseNotes,
      files: (info.files || []).map((f) => ({
        url: f.url || "",
        size: f.size || 0
      }))
    };
  }
  calculateETA(progress) {
    if (progress.bytesPerSecond <= 0) return 0;
    const remaining = progress.total - progress.transferred;
    return Math.ceil(remaining / progress.bytesPerSecond);
  }
  cacheUpdateInfo(info) {
    this.cache = {
      ...this.formatUpdateInfo(info),
      cachedAt: Date.now()
    };
  }
  loadPreferences() {
    if (!this.prefsPath) return;
    try {
      if (fs__namespace.existsSync(this.prefsPath)) {
        const raw = fs__namespace.readFileSync(this.prefsPath, "utf-8");
        this.prefs = { ...this.prefs, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error("[UPDATER] Failed to load preferences:", err);
    }
  }
  savePreferences() {
    if (!this.prefsPath) return;
    try {
      const dir = path__namespace.dirname(this.prefsPath);
      if (!fs__namespace.existsSync(dir)) {
        fs__namespace.mkdirSync(dir, { recursive: true });
      }
      fs__namespace.writeFileSync(this.prefsPath, JSON.stringify(this.prefs, null, 2));
    } catch (err) {
      console.error("[UPDATER] Failed to save preferences:", err);
    }
  }
  isVersionSkipped(version) {
    return this.prefs.skippedVersions.includes(version);
  }
  async checkForUpdates() {
    if (this.isDev) {
      this.log("Dev mode - returning up-to-date");
      this.status = "not-available";
      return { status: "not-available" };
    }
    if (this.cache && Date.now() - this.cache.cachedAt < UPDATE_CACHE_TTL) {
      this.log(`Using cached update info (v${this.cache.version})`);
      if (this.isVersionSkipped(this.cache.version)) {
        this.status = "idle";
        return { status: "idle" };
      }
      this.status = "available";
      return { status: "available", info: this.cache };
    }
    try {
      this.log("Checking GitHub for updates...");
      const result = await electronUpdater.autoUpdater.checkForUpdates();
      if (!result || !result.updateInfo) {
        return { status: "not-available" };
      }
      const info = result.updateInfo;
      const isSkipped = this.isVersionSkipped(info.version);
      if (isSkipped) {
        this.log(`Version v${info.version} was skipped by user`);
        return { status: "idle" };
      }
      return { status: "available", info: this.formatUpdateInfo(info) };
    } catch (error) {
      this.log(`Check failed: ${error.message}`);
      this.status = "error";
      this.errorMessage = error.message;
      return { status: "error", error: error.message };
    }
  }
  async downloadUpdate() {
    if (this.isDev) {
      this.log("Dev mode - download simulated");
      return;
    }
    this.log("Starting update download...");
    this.status = "downloading";
    this.emit("update:status", { status: "downloading" });
    await electronUpdater.autoUpdater.downloadUpdate();
  }
  installUpdate() {
    this.log("Installing update...");
    electronUpdater.autoUpdater.quitAndInstall(true, true);
  }
  skipVersion(version) {
    this.log(`User skipped version v${version}`);
    if (!this.prefs.skippedVersions.includes(version)) {
      this.prefs.skippedVersions.push(version);
      this.savePreferences();
    }
  }
  remindLater(hours = 24) {
    const remindAt = Date.now() + hours * 60 * 60 * 1e3;
    this.prefs.remindLaterAt = remindAt;
    this.savePreferences();
    this.log(`Reminder set for ${new Date(remindAt).toISOString()}`);
  }
  clearReminder() {
    this.prefs.remindLaterAt = null;
    this.savePreferences();
  }
  shouldRemind() {
    if (!this.prefs.remindLaterAt) return true;
    return Date.now() >= this.prefs.remindLaterAt;
  }
  setAutoCheckEnabled(enabled) {
    this.prefs.autoCheckEnabled = enabled;
    this.savePreferences();
    this.log(`Auto-check ${enabled ? "enabled" : "disabled"}`);
  }
  isAutoCheckEnabled() {
    return this.prefs.autoCheckEnabled;
  }
  setAllowPrerelease(allow) {
    electronUpdater.autoUpdater.allowPrerelease = allow;
    this.log(`Pre-releases ${allow ? "allowed" : "ignored"}`);
  }
  getStatus() {
    return this.status;
  }
  getUpdateInfo() {
    return this.updateInfo ? this.formatUpdateInfo(this.updateInfo) : null;
  }
  getProgress() {
    if (!this.progressInfo) return null;
    return {
      bytesPerSecond: this.progressInfo.bytesPerSecond,
      percent: this.progressInfo.percent,
      total: this.progressInfo.total,
      transferred: this.progressInfo.transferred,
      eta: this.calculateETA(this.progressInfo)
    };
  }
  getError() {
    return this.errorMessage;
  }
  getAppVersion() {
    return electron.app.getVersion();
  }
  async checkOnLaunch() {
    if (this.isDev) return;
    if (!this.prefs.autoCheckEnabled) {
      this.log("Auto-check disabled by user preference");
      return;
    }
    if (!this.shouldRemind()) {
      this.log("Reminder not due yet, skipping auto-check");
      return;
    }
    this.log("Auto-check on launch...");
    await this.checkForUpdates();
  }
}
const appUpdater = new AppUpdater();
const optionalString = zod.z.union([zod.z.string(), zod.z.null()]).optional().nullable();
const optionalNumber = zod.z.union([zod.z.number(), zod.z.null()]).optional().nullable();
const saleSchema = zod.z.object({
  itemId: zod.z.number().int().positive(),
  quantity: zod.z.number().positive(),
  unit: zod.z.string().max(50).optional(),
  unitType: zod.z.string().max(20).optional(),
  discount: zod.z.number().nonnegative().optional(),
  vat: zod.z.number().nonnegative().optional(),
  taxType: zod.z.string().max(20).optional(),
  totalPrice: zod.z.number().nonnegative(),
  paymentMethod: zod.z.string().max(50).optional(),
  paymentStatus: zod.z.string().max(20).optional(),
  customerName: optionalString,
  customerPhone: optionalString,
  packId: optionalNumber,
  dueDate: optionalString,
  paidAmount: zod.z.number().nonnegative().optional(),
  notes: optionalString,
  batchId: optionalString,
  orderNumber: optionalString
});
const saleBatchSchema = zod.z.array(saleSchema);
const saleUpdateSchema = zod.z.object({
  itemId: zod.z.number().int().positive().optional(),
  quantity: zod.z.number().positive().optional(),
  unit: zod.z.string().max(50).optional(),
  unitType: zod.z.string().max(20).optional(),
  discount: zod.z.number().nonnegative().optional(),
  vat: zod.z.number().nonnegative().optional(),
  totalPrice: zod.z.number().nonnegative().optional(),
  paymentMethod: zod.z.string().max(50).optional(),
  paymentStatus: zod.z.string().max(20).optional(),
  customerName: optionalString,
  customerPhone: optionalString,
  dueDate: optionalString,
  paidAmount: zod.z.number().nonnegative().optional()
});
const payDebtSchema = zod.z.object({
  saleId: zod.z.number().int().positive(),
  amount: zod.z.number().positive(),
  type: zod.z.string().max(50).optional(),
  note: zod.z.string().max(500).optional()
});
const orderConversionSchema = zod.z.object({
  orderId: zod.z.number().int().positive(),
  paymentMethod: zod.z.string().max(50).optional(),
  discount: zod.z.number().nonnegative().optional(),
  vat: zod.z.number().nonnegative().optional(),
  dueDate: zod.z.string().optional()
});
function validate(schema, data, label) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".") || "value"}: ${i.message}`).join("; ");
    throw new Error(`Invalid ${label}: ${issues}`);
  }
  return result.data;
}
class EscposWriter {
  bytes = [];
  raw(...b) {
    this.bytes.push(...b);
    return this;
  }
  rawString(s) {
    for (let i = 0; i < s.length; i++) this.bytes.push(s.charCodeAt(i) & 255);
    return this;
  }
  text(s) {
    return this.rawString(s);
  }
  init() {
    return this.raw(27, 64);
  }
  lineFeed(n = 1) {
    return this.raw(10).raw(27, 100, Math.max(0, Math.min(255, n)));
  }
  align(n) {
    return this.raw(27, 97, n);
  }
  bold(on) {
    return this.raw(27, 69, on ? 1 : 0);
  }
  size(width, height) {
    const w = Math.max(0, Math.min(7, width));
    const h = Math.max(0, Math.min(7, height));
    return this.raw(29, 33, w << 4 | h);
  }
  underline(on) {
    return this.raw(27, 45, on ? 1 : 0);
  }
  codePage(n) {
    return this.raw(27, 116, n);
  }
  // Line with label + value aligned to width via spaces.
  column(label, value, width) {
    const line = `${label}${" ".repeat(Math.max(1, width - label.length - value.length))}${value}`;
    return this.text(line).lineFeed();
  }
  // Barcode: m = symbology (0 UPC-A, 2 EAN-13, 4 CODE128, 69 CODE93, 73 ITF).
  barcode(m, data) {
    this.raw(29, 107, m, data.length).rawString(data).raw(0);
    return this.lineFeed();
  }
  // EAN-13 with automatic checksum handling. Data must be 12 or 13 digits.
  barcodeEan13(data) {
    const digits = data.replace(/\D/g, "").slice(0, 13);
    if (digits.length < 12) throw new Error("EAN-13 requires at least 12 digits");
    const body = digits.length === 13 ? digits.slice(0, 12) : digits;
    const check = this.ean13CheckDigit(body);
    return this.barcode(2, body + String(check));
  }
  // CODE128 (best for internal SKUs).
  barcodeCode128(data) {
    return this.barcode(4, data);
  }
  // QR code via the GS ( k sequence (model 2, sizes 1-16, EC level L).
  qr(data, moduleSize = 6, ecLevel = 0) {
    const n = Math.max(1, Math.min(16, moduleSize));
    this.raw(29, 40, 107, 4, 0, 49, 65, 50, 0);
    this.raw(29, 40, 107, 3, 0, 49, 67, n);
    this.raw(29, 40, 107, 3, 0, 49, 69, 48 + ecLevel);
    const payload = [29, 40, 107, 0, 0, 49, 80, 48];
    for (let i = 0; i < data.length; i++) payload.push(data.charCodeAt(i) & 255);
    payload[3] = payload.length - 4 & 255;
    payload[4] = payload.length - 4 >> 8 & 255;
    this.raw(...payload);
    this.raw(29, 40, 107, 3, 0, 49, 81, 48);
    return this.lineFeed();
  }
  // Raster image: 1-bit, one byte per 8 horizontal pixels, MSB first.
  raster(rows, widthPx) {
    const bytesPerRow = Math.ceil(widthPx / 8);
    const y = rows.length / bytesPerRow;
    if (y > 65535 || bytesPerRow > 65535) throw new Error("Raster dimensions out of range");
    this.raw(29, 118, 48, 0);
    this.raw(bytesPerRow & 255, bytesPerRow >> 8 & 255);
    this.raw(y & 255, y >> 8 & 255);
    this.raw(...Array.from(rows));
    return this.lineFeed();
  }
  cut(partial = true) {
    return this.raw(29, 86, partial ? 66 : 65, 0);
  }
  // Cash drawer kick. pin: 2 (connector A) or 5 (connector B). t1/t2 in 2ms units.
  openDrawer(pin = 2, t1 = 25, t2 = 250) {
    return this.raw(27, 112, pin === 5 ? 1 : 0, t1, t2);
  }
  ean13CheckDigit(d12) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const d = parseInt(d12[i], 10);
      sum += i % 2 === 0 ? d : d * 3;
    }
    return (10 - sum % 10) % 10;
  }
  getBytes() {
    return this.bytes;
  }
  toUint8Array() {
    return Uint8Array.from(this.bytes);
  }
  get length() {
    return this.bytes.length;
  }
}
const SETTING_KEY = "printer_config";
function getPrinterConfig() {
  try {
    const row = dbProxy.prepare("SELECT value FROM settings WHERE key = ?").get(SETTING_KEY);
    const stored = row ? JSON.parse(row.value) : {};
    return {
      transport: stored.transport === "network" ? "network" : "os-dialog",
      host: stored.host || "127.0.0.1",
      port: Number(stored.port) || 9100,
      drawerPin: stored.drawerPin === 5 ? 5 : 2,
      autoOpenDrawer: stored.autoOpenDrawer !== false,
      enabled: stored.enabled !== false
    };
  } catch {
    return { transport: "os-dialog", host: "127.0.0.1", port: 9100, drawerPin: 2, autoOpenDrawer: true, enabled: true };
  }
}
function savePrinterConfig(cfg2) {
  const merged = { ...getPrinterConfig(), ...cfg2 };
  dbProxy.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(SETTING_KEY, JSON.stringify(merged));
  return merged;
}
let lastError = null;
let lastPrintAt = null;
function sendTcp(data) {
  const cfg2 = getPrinterConfig();
  return new Promise((resolve, reject) => {
    let done = false;
    const sock = net.connect({ host: cfg2.host, port: cfg2.port }, () => {
      sock.write(Buffer.from(data));
      sock.end();
    });
    sock.setTimeout(5e3, () => {
      if (done) return;
      done = true;
      sock.destroy();
      reject(new Error(`Printer timeout: ${cfg2.host}:${cfg2.port}`));
    });
    sock.on("error", (e) => {
      if (done) return;
      done = true;
      reject(new Error(`Printer connection failed (${cfg2.host}:${cfg2.port}): ${e.message}`));
    });
    sock.on("close", () => {
      if (done) return;
      done = true;
      resolve();
    });
  });
}
function probePrinter(timeoutMs = 3e3) {
  const cfg2 = getPrinterConfig();
  if (cfg2.transport === "os-dialog") return Promise.resolve(true);
  return new Promise((resolve) => {
    let done = false;
    const sock = net.connect({ host: cfg2.host, port: cfg2.port }, () => {
      if (done) return;
      done = true;
      sock.destroy();
      resolve(true);
    });
    sock.setTimeout(timeoutMs, () => {
      if (done) return;
      done = true;
      sock.destroy();
      resolve(false);
    });
    sock.on("error", () => {
      if (done) return;
      done = true;
      resolve(false);
    });
  });
}
function getPrintStatus() {
  const cfg2 = getPrinterConfig();
  return {
    enabled: cfg2.enabled,
    transport: cfg2.transport,
    host: cfg2.host,
    port: cfg2.port,
    drawerPin: cfg2.drawerPin,
    autoOpenDrawer: cfg2.autoOpenDrawer,
    online: cfg2.enabled && cfg2.transport === "network",
    lastError,
    lastPrintAt
  };
}
let queue = Promise.resolve();
function enqueue(fn) {
  const run = queue.then(fn);
  queue = run.catch(() => {
  });
  return run;
}
async function printRaw(data) {
  const cfg2 = getPrinterConfig();
  if (!cfg2.enabled) throw new Error("Printer is disabled in Settings");
  if (cfg2.transport === "os-dialog") throw new Error("Raw ESC/POS requires the network printer transport");
  await enqueue(async () => {
    try {
      await sendTcp(data);
      lastPrintAt = (/* @__PURE__ */ new Date()).toISOString();
      lastError = null;
    } catch (e) {
      lastError = e.message;
      throw e;
    }
  });
}
async function openDrawer() {
  const cfg2 = getPrinterConfig();
  const w = new EscposWriter().init().openDrawer(cfg2.drawerPin);
  await printRaw(w.toUint8Array());
  lastPrintAt = (/* @__PURE__ */ new Date()).toISOString();
}
const WIDTH$1 = 42;
function padRight$1(s, w) {
  if (s.length >= w) return s.slice(0, w);
  return s + " ".repeat(w - s.length);
}
function money$1(n) {
  return `ETB ${(Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
const divider$1 = "-".repeat(WIDTH$1);
function buildReceiptCommands(input) {
  const w = new EscposWriter().init();
  w.align(1).bold(true).text(input.context.businessName.slice(0, WIDTH$1)).lineFeed();
  w.bold(false).align(0);
  if (input.context.address) w.align(1).text(input.context.address.slice(0, WIDTH$1)).lineFeed().align(0);
  if (input.context.tin) w.text(`TIN: ${input.context.tin}`).lineFeed();
  w.text(divider$1).lineFeed();
  for (const line of input.lines) {
    w.text(padRight$1(line.name.slice(0, 28), 28)).text(padRight$1(String(line.quantity), 4)).text(padRight$1(line.unit.slice(0, 3), 4)).text(money$1(line.total).padStart(6)).lineFeed();
    if (line.unitPrice !== line.total) {
      w.text(`  @ ${money$1(line.unitPrice)}`).lineFeed();
    }
  }
  w.text(divider$1).lineFeed();
  w.column("Subtotal", money$1(input.subtotal), WIDTH$1);
  if (input.discount > 0) w.column("Discount", `-${money$1(input.discount)}`, WIDTH$1);
  if (input.vat > 0) w.column(`${input.taxType || "VAT"}`, money$1(input.vat), WIDTH$1);
  w.text(divider$1).lineFeed();
  w.bold(true).size(2, 2).text(padRight$1("TOTAL", WIDTH$1 - 6) + money$1(input.total)).lineFeed().size(1, 1).bold(false);
  w.text(divider$1).lineFeed();
  if (input.customerName) w.column("Customer", input.customerName.slice(0, 30), WIDTH$1);
  w.column("Payment", input.paymentMethod || "Cash", WIDTH$1);
  if (input.paymentStatus === "Debt") {
    w.column("Status", "DEBT", WIDTH$1);
  } else if (input.change > 0) {
    w.column("Paid", money$1(input.paid), WIDTH$1);
    w.column("Change", money$1(input.change), WIDTH$1);
  }
  w.text(divider$1).lineFeed();
  w.text(padRight$1("Date: " + (input.createdAt ? input.createdAt.slice(0, 16).replace("T", " ") : (/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace("T", " ")), WIDTH$1 / 2) + padRight$1("Rcpt #" + (input.context.receiptSerial ?? ""), WIDTH$1 / 2)).lineFeed();
  if (input.context.cashier) w.text(`Cashier: ${input.context.cashier.slice(0, WIDTH$1)}`).lineFeed();
  w.align(1).text("Thank you for shopping with us!").lineFeed(2).align(0);
  w.cut(true);
  return w.toUint8Array();
}
function buildLabelCommands(label, copies = 1) {
  const w = new EscposWriter().init();
  const code = label.barcode || label.sku || "";
  for (let i = 0; i < Math.max(1, copies); i++) {
    w.align(1).bold(true).text(label.name.slice(0, 32)).lineFeed().bold(false);
    if (code) {
      if (label.barcodeType === "code128") w.barcodeCode128(code);
      else w.barcodeEan13(code);
    } else if (label.sku) {
      w.qr(label.sku, 6);
    }
    w.align(1).size(2, 2).text(money$1(label.price)).lineFeed().size(1, 1).align(0);
    w.lineFeed(1);
  }
  w.cut(true);
  return w.toUint8Array();
}
function buildTestPageCommands() {
  const w = new EscposWriter().init();
  w.align(1).bold(true).size(2, 2).text("SHEGA TEST PAGE").lineFeed().size(1, 1).bold(false);
  w.text(divider$1).lineFeed();
  w.text("Date: " + (/* @__PURE__ */ new Date()).toLocaleString()).lineFeed();
  w.text("ESC/POS transport OK").lineFeed();
  w.text("  - align left  : Shega").lineFeed();
  w.align(1).text("  - align center : Shega").lineFeed();
  w.align(2).text("  - align right  : Shega").lineFeed().align(0);
  w.text("Barcode EAN-13 1234567890128:").lineFeed();
  w.barcodeEan13("1234567890128");
  w.text("QR test:").lineFeed();
  w.qr("SHEGA::TEST::" + Date.now(), 6);
  w.text(divider$1).lineFeed();
  w.lineFeed(2);
  w.cut(true);
  return w.toUint8Array();
}
const STABLE_MARKERS = ["S", "T"];
const UNSTABLE_MARKERS = ["D", "I", "U"];
function parseWeightLine(line) {
  const raw = line.trim();
  if (!raw) return { weightKg: null, unit: "", stable: false, zero: false, net: false, raw };
  let stable = true;
  let zero = false;
  let net2 = false;
  let body = raw;
  const upper = raw.toUpperCase();
  if (upper.startsWith("ST")) {
    stable = true;
    body = raw.slice(2);
  } else if (upper.startsWith("US")) {
    stable = false;
    body = raw.slice(2);
  } else if (UNSTABLE_MARKERS.some((m2) => upper.startsWith(m2) && (upper.startsWith(m2 + ",") || upper.startsWith(m2 + " ")))) {
    stable = false;
    body = raw.slice(1);
  } else if (STABLE_MARKERS.includes(upper[0] || "") && upper.length > 1) {
    stable = true;
    body = raw.slice(1);
  }
  if (/\bNET\b/i.test(upper)) net2 = true;
  if (/\bZERO\b/i.test(upper) || /^\s*0(\.0+)?\s*(kg|g)?\s*$/i.test(body)) zero = true;
  const m = body.match(/([-+]?\d+(?:\.\d+)?)\s*(kg|g|lb|oz)?/i);
  if (!m) return { weightKg: null, unit: "", stable, zero, net: net2, raw };
  const num = parseFloat(m[1]);
  const unit = (m[2] || "kg").toLowerCase();
  let weightKg;
  if (unit === "g") weightKg = num / 1e3;
  else if (unit === "lb") weightKg = num * 0.45359237;
  else if (unit === "oz") weightKg = num * 0.028349523125;
  else weightKg = num;
  if (weightKg < 0) weightKg = 0;
  return { weightKg, unit: unit === "g" ? "g" : unit, stable, zero, net: net2, raw };
}
class NullFiscalAdapter {
  name = "null";
  isAvailable() {
    return true;
  }
  signReceipt(receipt) {
    return {
      fiscalNumber: `F-${String(receipt.serial).padStart(8, "0")}`,
      signature: null
    };
  }
}
const fiscalAdapter = new NullFiscalAdapter();
const isDev = !electron.app.isPackaged;
const logDir = isDev ? path.join(process.cwd(), "logs") : path.join(electron.app.getPath("userData"), "logs");
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch {
  }
}
const LOG_PATH = path.join(logDir, "shega.log");
const MAX_BYTES = 5 * 1024 * 1024;
function rotateIfNeeded() {
  try {
    if (fs.existsSync(LOG_PATH) && fs.statSync(LOG_PATH).size > MAX_BYTES) {
      const old = LOG_PATH.replace(/\.log$/, ".1.log");
      try {
        fs.renameSync(LOG_PATH, old);
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
    fs.appendFileSync(LOG_PATH, line, { mode: 384 });
  } catch {
    process.stderr.write(`[logger] write failed: ${String(msg)}
`);
  }
}
const logger = {
  debug: (msg, meta) => write("debug", msg, meta),
  info: (msg, meta) => write("info", msg, meta),
  warn: (msg, meta) => write("warn", msg, meta),
  error: (msg, meta) => write("error", msg, meta),
  fatal: (msg, meta) => write("fatal", msg, meta),
  get path() {
    return LOG_PATH;
  }
};
const SYNC_PORT = 5757;
const SHARED_TABLES = [
  "categories",
  "items",
  "item_packs",
  "sales",
  "debt_payments",
  "returns",
  "expenses",
  "adjustments",
  "customers",
  "contacts",
  "suppliers",
  "budgets",
  "budget_categories",
  "budget_adjustments",
  "orders",
  "order_items",
  "order_history",
  "shipments",
  "shipment_items",
  "shipment_history",
  "employees",
  "employee_roles",
  "employee_accounts",
  "attendance",
  "employee_performance",
  "subscriptions",
  "subscription_payments",
  "subscription_renewals",
  "scheduled_reminders",
  "notification_reminders",
  "notifications",
  "businesses",
  "locations",
  "registers",
  "business_roles",
  "users",
  "devices",
  "stock_movements",
  "audit_logs"
];
function tbl(entity) {
  if (entity === "scheduled_reminders") return "notification_reminders";
  return desktopTableName(entity);
}
function changeChecksum(change) {
  const canonical = `${change.entity}|${change.entity_uuid}|${change.op}|${JSON.stringify(change.payload)}`;
  return crypto$1.createHash("sha256").update(canonical).digest("hex");
}
let columnCache = {};
function columnsOf(entity) {
  const table = tbl(entity);
  if (!columnCache[table]) {
    columnCache[table] = dbProxy.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  }
  return columnCache[table];
}
function ensureHubDeviceId() {
  const row = dbProxy.prepare("SELECT device_id, pairing_token FROM sync_meta WHERE id = 1").get();
  if (row?.device_id) return row.device_id;
  const id = crypto$1.randomUUID();
  const token = generatePairingToken();
  dbProxy.prepare("INSERT OR REPLACE INTO sync_meta (id, device_id, pairing_token, schema_version) VALUES (1, ?, ?, 21)").run(id, token);
  return id;
}
function getPairingToken() {
  const row = dbProxy.prepare("SELECT pairing_token FROM sync_meta WHERE id = 1").get();
  if (row?.pairing_token) return row.pairing_token;
  const token = generatePairingToken();
  dbProxy.prepare("UPDATE sync_meta SET pairing_token = ? WHERE id = 1").run(token);
  return token;
}
function generatePairingToken() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto$1.randomBytes(6);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}
function validToken(token) {
  return !!token && token.trim().toUpperCase() === getPairingToken();
}
function getLanAddress(port = SYNC_PORT) {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return `http://${iface.address}:${port}`;
      }
    }
  }
  return null;
}
function registerDevice(deviceId, name) {
  const existing = dbProxy.prepare("SELECT id FROM devices WHERE device_id = ?").get(deviceId);
  if (existing) {
    dbProxy.prepare("UPDATE devices SET last_seen_at = ? WHERE device_id = ?").run((/* @__PURE__ */ new Date()).toISOString(), deviceId);
    return;
  }
  dbProxy.prepare("INSERT INTO devices (device_id, name, last_seen_at, uuid) VALUES (?, ?, ?, ?)").run(
    deviceId,
    name || deviceId.slice(0, 8),
    (/* @__PURE__ */ new Date()).toISOString(),
    deviceId
  );
}
function logSync(deviceId, entity, entityUuid, op, detail) {
  dbProxy.prepare("INSERT INTO sync_log (device_id, entity, entity_uuid, op, detail) VALUES (?, ?, ?, ?, ?)").run(
    deviceId ?? null,
    entity,
    entityUuid,
    op,
    detail
  );
}
function maxSeq() {
  const r = dbProxy.prepare("SELECT COALESCE(MAX(seq),0) AS m FROM sync_outbox").get();
  return r?.m ?? 0;
}
function requestDeviceResync(deviceId) {
  dbProxy.prepare("INSERT OR REPLACE INTO sync_requests (device_id, requested_at) VALUES (?, ?)").run(
    deviceId,
    (/* @__PURE__ */ new Date()).toISOString()
  );
}
function takeResyncRequest(deviceId) {
  const r = dbProxy.prepare("SELECT 1 FROM sync_requests WHERE device_id = ?").get(deviceId);
  if (r) {
    dbProxy.prepare("DELETE FROM sync_requests WHERE device_id = ?").run(deviceId);
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
  const ref = dbProxy.prepare("SELECT uuid FROM sync_refs WHERE device_id = ? AND entity = ? AND local_id = ?").get(deviceId, entity, localId);
  if (!ref?.uuid) return null;
  const row = dbProxy.prepare(`SELECT id FROM ${entity} WHERE uuid = ?`).get(ref.uuid);
  return row?.id ?? null;
}
function recordRef(deviceId, entity, payload) {
  if (payload.id == null || !payload.uuid) return;
  dbProxy.prepare("INSERT OR REPLACE INTO sync_refs (device_id, entity, local_id, uuid) VALUES (?, ?, ?, ?)").run(
    deviceId,
    entity,
    Number(payload.id),
    String(payload.uuid)
  );
}
function existingByUuid(entity, uuid) {
  return dbProxy.prepare(`SELECT * FROM ${tbl(entity)} WHERE uuid = ?`).get(uuid);
}
function isAdapterEntity(entity) {
  return BUSINESS_ADAPTER_ENTITIES.includes(entity);
}
function looksLikeMobile(entity, payload) {
  if (!isAdapterEntity(entity)) return false;
  if (entity === "businesses") return "name" in payload && !("businessName" in payload);
  return "business_id" in payload;
}
function mobileFkToDesktopInt(fk, uuid) {
  if (uuid == null || uuid === "") return null;
  try {
    const row = dbProxy.prepare(`SELECT id FROM ${fk.lookupEntity} WHERE uuid = ?`).get(String(uuid));
    return row?.id ?? null;
  } catch {
    return null;
  }
}
function desktopFkToMobileUuid(fk, desktopId) {
  if (desktopId == null) return null;
  try {
    const row = dbProxy.prepare(`SELECT uuid FROM ${fk.lookupEntity} WHERE id = ?`).get(Number(desktopId));
    return row?.uuid ?? null;
  } catch {
    return null;
  }
}
const CORE_BUSINESS_SCOPED_ENTITIES = [
  "categories",
  "items",
  "item_packs",
  "item_barcodes",
  "quick_products",
  "sales",
  "debt_payments",
  "expenses",
  "adjustments",
  "customers",
  "warehouses",
  "returns",
  "gift_cards",
  "gift_card_transactions",
  "employee_roles",
  "employees",
  "employee_accounts",
  "attendance",
  "employee_performance"
];
function businessIntToUuid(int) {
  if (int == null) return null;
  try {
    const row = dbProxy.prepare("SELECT uuid FROM businesses WHERE id = ?").get(Number(int));
    return row?.uuid ?? null;
  } catch {
    return null;
  }
}
function businessUuidToInt(uuid) {
  if (uuid == null || uuid === "") return null;
  try {
    const row = dbProxy.prepare("SELECT id FROM businesses WHERE uuid = ?").get(String(uuid));
    return row?.id ?? null;
  } catch {
    return null;
  }
}
function emitEntityPayload(entity, row) {
  if (isAdapterEntity(entity)) return toMobilePayload(entity, row);
  if (CORE_BUSINESS_SCOPED_ENTITIES.includes(entity) && row.businessId != null) {
    const next = { ...row };
    const asStr = String(row.businessId);
    if (/^[0-9]+$/.test(asStr)) {
      next.businessId = businessIntToUuid(Number(row.businessId)) ?? `biz-${asStr}`;
    }
    return next;
  }
  return row;
}
function toDesktopPayload(entity, payload) {
  const out = mobileToDesktopPayload(entity, payload);
  const map = FIELD_MAPS[entity];
  for (const fk of map.mobileFk) {
    out[fk.desktopColumn] = mobileFkToDesktopInt(fk, out[fk.desktopColumn]);
  }
  return out;
}
function toMobilePayload(entity, payload) {
  const out = desktopToMobilePayload(entity, payload);
  const map = FIELD_MAPS[entity];
  for (const fk of map.desktopFk) {
    out[fk.mobileField] = desktopFkToMobileUuid(fk, payload[fk.desktopColumn]);
  }
  return out;
}
function applyChange(deviceId, change) {
  const { entity, entity_uuid, op, payload } = change;
  if (!SHARED_TABLES.includes(entity) || !entity_uuid) {
    logSync(deviceId, entity, entity_uuid, op, "skipped unknown entity");
    return "skipped";
  }
  const adapterData = isAdapterEntity(entity) && looksLikeMobile(entity, payload) ? toDesktopPayload(entity, payload) : payload;
  const data = cleanPayload(entity, adapterData);
  if (CORE_BUSINESS_SCOPED_ENTITIES.includes(entity) && data.businessId != null) {
    const asStr = String(data.businessId);
    if (!/^[0-9]+$/.test(asStr)) {
      data.businessId = businessUuidToInt(asStr) ?? null;
    }
  }
  if (entity === "audit_logs") {
    if (op === "DELETE") return "skipped";
    return applyAuditChange(deviceId, change) ? "applied" : "skipped";
  }
  if (op === "DELETE") {
    const existing2 = existingByUuid(entity, entity_uuid);
    if (existing2) {
      dbProxy.prepare(`UPDATE ${tbl(entity)} SET is_deleted = 1, deleted_at = COALESCE(?, deleted_at) WHERE uuid = ?`).run(
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
    let pending2 = false;
    if ((entity === "sales" || entity === "returns" || entity === "stock_movements") && insertData.itemId != null) {
      const hubItemId = resolveFk(deviceId, "items", insertData.itemId);
      if (hubItemId != null) {
        insertData.itemId = hubItemId;
      } else {
        insertData.itemId = null;
        pending2 = true;
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
    dbProxy.prepare(`INSERT INTO ${tbl(entity)} (${cols.join(", ")}) VALUES (${placeholders})`).run(...values);
    recordRef(deviceId, entity, insertData);
    return pending2 ? "pending" : "applied";
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
      dbProxy.prepare(`UPDATE ${tbl(entity)} SET ${sets} WHERE uuid = ?`).run(...values, entity_uuid);
    }
    recordRef(deviceId, entity, data);
    return "applied";
  }
  logSync(deviceId, entity, entity_uuid, op, "conflict_rejected");
  return "conflict";
}
function applyAuditChange(deviceId, change) {
  const payload = change.payload ?? {};
  const uuid = String(payload.uuid ?? change.entity_uuid ?? "");
  if (!uuid) return false;
  const duplicate = dbProxy.prepare("SELECT id FROM audit_logs WHERE uuid = ?").get(uuid);
  if (duplicate) return true;
  const businessId = payload.business_id ? mobileFkToDesktopInt({ desktopColumn: "businessId", lookupEntity: "businesses" }, String(payload.business_id)) : null;
  try {
    insertAudit(dbProxy, {
      businessId,
      action: String(payload.action ?? ""),
      entityType: String(payload.entity ?? payload.entityType ?? ""),
      entityId: payload.entity_id != null ? Number(payload.entity_id) : payload.entityId != null ? Number(payload.entityId) : null,
      fieldName: payload.field_name != null ? String(payload.field_name) : payload.fieldName ?? null,
      oldValue: payload.old_value != null ? String(payload.old_value) : payload.oldValue ?? null,
      newValue: payload.new_value != null ? String(payload.new_value) : payload.newValue ?? null,
      changedBy: payload.changed_by ? String(payload.changed_by) : payload.changedBy ?? null,
      changedById: payload.changed_by_id != null ? Number(payload.changed_by_id) : payload.changedById ?? null,
      description: payload.description ? String(payload.description) : null,
      createdAt: String(payload.created_at ?? payload.createdAt ?? (/* @__PURE__ */ new Date()).toISOString())
    }, {
      uuid,
      sourceDevice: String(payload.source_device ?? payload.device_id ?? deviceId)
    });
    return true;
  } catch (e) {
    logSync(deviceId, "audit_logs", uuid, change.op, "audit_merge_failed");
    return false;
  }
}
function applyPush(deviceId, changes) {
  const result = { applied: 0, conflicts: 0, skipped: 0, pending: 0 };
  const doApply = dbProxy.transaction((list) => {
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
    const bad = dbProxy.prepare("SELECT id, name, totalBaseQuantity FROM items WHERE totalBaseQuantity < 0 AND is_deleted = 0 LIMIT 20").all();
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
      const rows2 = dbProxy.prepare(`SELECT * FROM ${tbl(entity)} WHERE is_deleted = 0`).all();
      for (const r of rows2) {
        changes2.push({
          entity,
          entity_uuid: r.uuid,
          op: "INSERT",
          payload: emitEntityPayload(entity, r),
          device_id: r.device_id
        });
      }
    }
    return { changes: changes2, lastSeq: seq, snapshot: true };
  }
  const rows = dbProxy.prepare("SELECT * FROM sync_outbox WHERE seq > ? ORDER BY seq ASC LIMIT 1000").all(since);
  const changes = rows.map((r) => {
    let payload = {};
    try {
      payload = JSON.parse(r.payload);
    } catch {
    }
    payload = emitEntityPayload(r.entity, payload);
    return { entity: r.entity, entity_uuid: r.entity_uuid, op: r.op, payload, device_id: r.device_id, seq: r.seq };
  });
  return { changes, lastSeq: seq, snapshot: false };
}
function buildCloudChanges() {
  const out = [];
  const hubId = ensureHubDeviceId();
  for (const entity of SHARED_TABLES) {
    const rows = dbProxy.prepare(`SELECT * FROM ${tbl(entity)} WHERE is_deleted = 0`).all();
    for (const r of rows) {
      let payload = {};
      for (const k of Object.keys(r)) payload[k] = r[k];
      payload = emitEntityPayload(entity, payload);
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
    const rows = dbProxy.prepare(`SELECT uuid, updated_at, row_version, is_deleted FROM ${tbl(entity)} WHERE is_deleted = 0`).all();
    const h = crypto$1.createHash("sha256");
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
class SyncHub {
  server = null;
  deviceId = "";
  start(port = SYNC_PORT) {
    if (this.server) return;
    this.deviceId = ensureHubDeviceId();
    this.server = http.createServer(async (req, res) => {
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
          dbProxy.prepare("INSERT OR REPLACE INTO sync_cursor (device_id, last_seq, updated_at) VALUES (?, ?, ?)").run(
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
          const peers = dbProxy.prepare("SELECT device_id, name, last_seen_at, created_at FROM devices ORDER BY created_at").all();
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
}
const syncHub$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SHARED_TABLES,
  SYNC_PORT,
  SyncHub,
  applyPush,
  applyRemoteChanges,
  buildCloudChanges,
  changeChecksum,
  ensureHubDeviceId,
  getLanAddress,
  getPairingToken,
  lwwWins,
  registerDevice,
  requestDeviceResync,
  snapshotSince,
  verifyChecksums
}, Symbol.toStringTag, { value: "Module" }));
function openShift(businessId, registerId, cashierId, openingFloat, notes) {
  const existing = dbProxy.prepare(`
    SELECT id FROM shifts 
    WHERE registerId = ? AND status IN ('open', 'mid_audit', 'blind_count')
  `).get(registerId);
  if (existing) {
    throw new Error("Register already has an open shift");
  }
  const now2 = (/* @__PURE__ */ new Date()).toISOString();
  const result = dbProxy.prepare(`
    INSERT INTO shifts (businessId, registerId, cashierId, openingFloat, expectedCash, status, openedAt, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)
  `).run(businessId, registerId, cashierId, openingFloat, openingFloat, now2, notes || "", now2, now2);
  const shiftId = result.lastInsertRowid;
  dbProxy.prepare(`
    INSERT INTO shift_transactions (shiftId, saleId, paymentMethod, amount, createdAt)
    VALUES (?, NULL, 'float', ?, ?)
  `).run(shiftId, openingFloat, (/* @__PURE__ */ new Date()).toISOString());
  logger.info(`[Shift] Opened shift ${shiftId} for register ${registerId} by cashier ${cashierId} with float ${openingFloat}`);
  return shiftId;
}
function getOpenShift(registerId) {
  return dbProxy.prepare(`
    SELECT * FROM shifts 
    WHERE registerId = ? AND status IN ('open', 'mid_audit', 'blind_count')
    ORDER BY openedAt DESC LIMIT 1
  `).get(registerId);
}
function getShiftById$1(shiftId) {
  return dbProxy.prepare("SELECT * FROM shifts WHERE id = ?").get(shiftId);
}
function recordMidShiftAudit(shiftId, countedCash, notes) {
  const shift = getShiftById$1(shiftId);
  if (!shift) throw new Error("Shift not found");
  if (shift.status !== "open") throw new Error("Shift is not open");
  const now2 = (/* @__PURE__ */ new Date()).toISOString();
  const variance = countedCash - shift.expectedCash;
  dbProxy.prepare(`
    UPDATE shifts 
    SET status = 'mid_audit', 
        countedCash = ?, 
        variance = ?, 
        midAuditAt = ?, 
        notes = COALESCE(notes || '; ', '') || ?,
        updatedAt = ?
    WHERE id = ?
  `).run(countedCash, variance, now2, notes || "", now2, shiftId);
  logger.info(`[Shift] Mid-shift audit for shift ${shiftId}: counted ${countedCash}, variance ${variance}`);
}
function recordBlindCount(shiftId, countedCash, notes) {
  const shift = getShiftById$1(shiftId);
  if (!shift) throw new Error("Shift not found");
  if (shift.status !== "open" && shift.status !== "mid_audit") {
    throw new Error("Shift must be open or in mid-audit for blind count");
  }
  const now2 = (/* @__PURE__ */ new Date()).toISOString();
  const variance = countedCash - shift.expectedCash;
  dbProxy.prepare(`
    UPDATE shifts 
    SET status = 'blind_count', 
        countedCash = ?, 
        variance = ?, 
        blindCountAt = ?, 
        notes = COALESCE(notes || '; ', '') || ?,
        updatedAt = ?
    WHERE id = ?
  `).run(countedCash, variance, now2, notes || "", now2, shiftId);
  logger.info(`[Shift] Blind count for shift ${shiftId}: counted ${countedCash}, variance ${variance}`);
}
function closeShift$1(shiftId, countedCash, cashDrawerCounts, notes) {
  const shift = getShiftById$1(shiftId);
  if (!shift) throw new Error("Shift not found");
  if (shift.status === "closed") throw new Error("Shift already closed");
  const now2 = (/* @__PURE__ */ new Date()).toISOString();
  const variance = countedCash - shift.expectedCash;
  calculateShiftTotals(shiftId);
  dbProxy.prepare(`
    UPDATE shifts 
    SET status = 'closed', 
        countedCash = ?, 
        variance = ?, 
        closedAt = ?, 
        expectedCash = ?,
        notes = COALESCE(notes || '; ', '') || ?,
        updatedAt = ?
    WHERE id = ?
  `).run(countedCash, variance, now2, shift.expectedCash, notes || "", now2, shiftId);
  for (const count of cashDrawerCounts) {
    dbProxy.prepare(`
      INSERT INTO shift_cash_counts (shiftId, denomination, count, total, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(shiftId, count.denomination, count.count, count.total, (/* @__PURE__ */ new Date()).toISOString());
  }
  const summary = generateShiftSummary(shiftId, countedCash, cashDrawerCounts);
  logger.info(`[Shift] Closed shift ${shiftId}: variance ${variance}`);
  return summary;
}
function calculateShiftTotals(shiftId) {
  const sales = dbProxy.prepare(`
    SELECT paymentMethod, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
    FROM shift_transactions
    WHERE shiftId = ? AND saleId IS NOT NULL
    GROUP BY paymentMethod
  `).all(shiftId);
  const totals = { cash: 0, card: 0, mobile: 0, total: 0 };
  const counts = { sales: 0, voids: 0, refunds: 0, returns: 0 };
  for (const s of sales) {
    const method = s.paymentMethod?.toLowerCase();
    if (method === "cash") totals.cash = s.total;
    else if (method === "card") totals.card = s.total;
    else if (method === "mobile") totals.mobile = s.total;
    totals.total += s.total;
  }
  const voids = dbProxy.prepare("SELECT COUNT(*) as c FROM sales WHERE shiftId = ? AND status = ?").get(shiftId, "Voided");
  const refunds = dbProxy.prepare("SELECT COUNT(*) as c FROM returns WHERE shiftId = ?").get(shiftId);
  counts.voids = voids?.c || 0;
  counts.refunds = refunds?.c || 0;
  return { totals, counts };
}
function generateShiftSummary(shiftId, countedCash, cashDrawerCounts) {
  const shift = getShiftById$1(shiftId);
  const totals = calculateShiftTotals(shiftId);
  const expected = shift.expectedCash;
  const variance = countedCash - expected;
  return {
    shift,
    totals: totals.totals,
    counts: totals.counts,
    cashDrawer: {
      expected,
      counted: countedCash,
      variance,
      breakdown: cashDrawerCounts
    }
  };
}
function getCashDrawerBreakdown(shiftId) {
  return dbProxy.prepare(`
    SELECT denomination, count, total
    FROM shift_cash_counts
    WHERE shiftId = ?
    ORDER BY denomination DESC
  `).all(shiftId);
}
function calculateExpectedCash(shiftId) {
  const shift = getShiftById$1(shiftId);
  if (!shift) return 0;
  const cashSales = dbProxy.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM shift_transactions
    WHERE shiftId = ? AND paymentMethod = 'cash' AND saleId IS NOT NULL
  `).get(shiftId);
  const cashRefunds = dbProxy.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM shift_transactions st
    JOIN returns r ON st.saleId = r.saleId
    WHERE st.shiftId = ? AND st.paymentMethod = 'cash' AND r.refundAmount > 0
  `).get(shiftId);
  const cashPaidOut = dbProxy.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM shift_transactions
    WHERE shiftId = ? AND paymentMethod = 'cash' AND saleId IS NULL AND amount < 0
  `).get(shiftId);
  return (shift.openingFloat || 0) + (cashSales?.total || 0) - (cashRefunds?.total || 0) + (cashPaidOut?.total || 0);
}
function addShiftTransaction(shiftId, saleId, paymentMethod, amount) {
  const result = dbProxy.prepare(`
    INSERT INTO shift_transactions (shiftId, saleId, paymentMethod, amount, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `).run(shiftId, saleId, paymentMethod, amount, (/* @__PURE__ */ new Date()).toISOString());
  const shift = getShiftById$1(arguments[0]);
  if (shift && shift.status === "open") {
    const method = paymentMethod.toLowerCase();
    if (method === "cash") {
      dbProxy.prepare("UPDATE shifts SET expectedCash = expectedCash + ? WHERE id = ?").run(amount, shiftId);
    }
  }
  return result.lastInsertRowid;
}
function getShiftTransactions(shiftId) {
  return dbProxy.prepare(`
    SELECT st.*, s.customerName, s.totalPrice
    FROM shift_transactions st
    LEFT JOIN sales s ON st.saleId = s.id
    WHERE st.shiftId = ?
    ORDER BY st.createdAt DESC
  `).all(shiftId);
}
function generateShiftReport(shiftId) {
  const shift = getShiftById$1(shiftId);
  const transactions = getShiftTransactions(shiftId);
  const totals = calculateShiftTotals(shiftId);
  getCashDrawerBreakdown(shiftId);
  calculateExpectedCash(shiftId);
  shift.countedCash || 0;
  const topItems = dbProxy.prepare(`
    SELECT i.name, SUM(sl.qty) as totalQty, SUM(sl.totalPrice) as totalRevenue
    FROM sales s
    JOIN sale_lines sl ON s.id = sl.saleId
    JOIN items i ON sl.itemId = i.id
    WHERE s.id IN (SELECT saleId FROM shift_transactions WHERE shiftId = ?)
    GROUP BY i.id
    ORDER BY totalQty DESC
    LIMIT 10
  `).all(shiftId);
  const categoryBreakdown = dbProxy.prepare(`
    SELECT c.name as category, COUNT(*) as salesCount, SUM(sl.totalPrice) as revenue
    FROM sales s
    JOIN sale_lines sl ON s.id = sl.saleId
    JOIN items i ON sl.itemId = i.id
    JOIN categories c ON i.categoryId = c.id
    WHERE s.id IN (SELECT saleId FROM shift_transactions WHERE shiftId = ?)
    GROUP BY c.id
    ORDER BY revenue DESC
  `).all(shiftId);
  return {
    shift: getShiftById$1(shiftId),
    transactions,
    totals: {
      cash: totals.totals.cash,
      card: totals.totals.card,
      mobile: totals.totals.mobile,
      total: totals.totals.total
    },
    counts: totals.counts,
    cashDrawer: {
      expected: calculateExpectedCash(shiftId),
      counted: shift.countedCash || 0,
      variance: (shift.countedCash || 0) - calculateExpectedCash(shiftId),
      breakdown: getCashDrawerBreakdown(shiftId)
    },
    topItems,
    categoryBreakdown
  };
}
let reportCounter = 0;
function generateXReport(businessId, registerId) {
  const openShift2 = dbProxy.prepare(`
    SELECT * FROM shifts 
    WHERE registerId = ? AND status IN ('open', 'mid_audit', 'blind_count')
    ORDER BY openedAt DESC LIMIT 1
  `).get(registerId);
  const shift = openShift2 || { id: 0, registerId, openingFloat: 0, openedAt: (/* @__PURE__ */ new Date()).toISOString() };
  return generateReportData("X", businessId, shift);
}
function generateZReport(businessId, registerId, countedCash, cashDrawerCounts) {
  const shift = dbProxy.prepare(`
    SELECT * FROM shifts 
    WHERE registerId = ? AND status IN ('open', 'mid_audit', 'blind_count')
    ORDER BY openedAt DESC LIMIT 1
  `).get(registerId);
  if (!shift) throw new Error("No open shift to close");
  closeShiftForReport(shift.id, countedCash);
  return generateReportData("Z", shift.businessId, shift);
}
function closeShiftForReport(shiftId, countedCash, cashDrawerCounts) {
  dbProxy.prepare("SELECT * FROM shifts WHERE id = ?").get(countedCash);
  return closeShift(shiftId, countedCash);
}
function closeShift(shiftId, countedCash, cashDrawerCounts) {
  const shift = getShiftById(shiftId);
  if (!shift) throw new Error("Shift not found");
  (/* @__PURE__ */ new Date()).toISOString();
  const variance = countedCash - shift.expectedCash;
  const tx = dbProxy.transaction(() => {
    dbProxy.prepare(`
      UPDATE shifts 
      SET status = 'closed', 
          countedCash = ?, 
          variance = ?, 
          closedAt = ?, 
          updatedAt = ?
      WHERE id = ?
    `).run(countedCash, variance, (/* @__PURE__ */ new Date()).toISOString(), (/* @__PURE__ */ new Date()).toISOString(), shiftId);
  });
  tx();
  return { variance, closedAt: (/* @__PURE__ */ new Date()).toISOString() };
}
function getShiftById(shiftId) {
  return dbProxy.prepare("SELECT * FROM shifts WHERE id = ?").get(shiftId);
}
function generateReportData(reportType, businessId, shift, isZReport, closeResult) {
  const business = dbProxy.prepare("SELECT * FROM businesses WHERE id = ?").get(businessId);
  const settings = dbProxy.prepare("SELECT * FROM settings WHERE key IN (?, ?, ?, ?)").all("tin", "business_name", "address", "phone");
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  reportCounter++;
  const reportNumber = reportCounter;
  const shiftReport = generateShiftReport(shift.id);
  calculateShiftTotals(shift.id);
  calculateExpectedCash(shift.id);
  getCashDrawerBreakdown(shift.id);
  const expectedCashAmount = calculateExpectedCash(shift.id);
  const countedCash = shift.countedCash || 0;
  const variance = countedCash - expectedCashAmount;
  const taxBreakdown = calculateTaxBreakdown(shift.id);
  const voids = getVoids(shift.id);
  const refunds = getRefunds(shift.id);
  const returns = getReturns(shift.id);
  const topItems = getTopItems(shift.id);
  const categoryBreakdown = getCategoryBreakdown(shift.id);
  const fiscalSignature = generateFiscalSignature(shift.id);
  return {
    reportType,
    reportNumber,
    businessName: settingsMap?.business_name || business?.businessName || "Shega POS",
    tin: settingsMap?.tin || "",
    address: settingsMap?.address || business?.address || "",
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    time: (/* @__PURE__ */ new Date()).toISOString().split("T")[1].substring(0, 8),
    shift: {
      id: shift.id,
      registerId: shift.registerId,
      cashierId: shift.cashierId,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt
    },
    totals: {
      grossSales: shiftReport.totals.subtotal,
      netSales: shiftReport.totals.total,
      vat: taxBreakdown.vat15,
      tot: taxBreakdown.tot2 + taxBreakdown.tot10,
      discounts: shiftReport.totals.discount,
      voids: voids.amount,
      refunds: refunds.amount,
      cash: shiftReport.totals.cash,
      card: shiftReport.totals.card,
      mobile: shiftReport.totals.mobile,
      total: shiftReport.totals.total
    },
    taxBreakdown,
    paymentBreakdown: {
      cash: shiftReport.totals.cash,
      card: shiftReport.totals.card,
      mobile: shiftReport.totals.mobile,
      other: 0
    },
    voids: { count: voids.count, amount: voids.amount, reasons: voids.reasons },
    refunds: { count: refunds.count, amount: refunds.amount },
    returns: { count: returns.count, amount: returns.amount },
    cashDrawer: {
      openingFloat: shift.openingFloat,
      expectedCash: expectedCashAmount,
      countedCash: shift.countedCash || 0,
      variance,
      breakdown: getCashDrawerBreakdown(shift.id)
    },
    topItems: topItems.slice(0, 10),
    categoryBreakdown,
    fiscalSignature
  };
}
function calculateTaxBreakdown(shiftId) {
  const sales = dbProxy.prepare(`
    SELECT sl.*, i.taxType, i.taxRate
    FROM sales s
    JOIN sale_lines sl ON s.id = sl.saleId
    JOIN items i ON sl.itemId = i.id
    WHERE s.id IN (SELECT saleId FROM shift_transactions WHERE shiftId = ?)
  `).all(shiftId);
  let vat15 = 0, tot2 = 0, tot10 = 0, exempt = 0, withholding = 0;
  for (const line of sales) {
    const taxType = line.taxType || "VAT";
    const taxRate = line.taxRate || 0.15;
    const taxAmount = (line.totalPrice - line.discount) * taxRate;
    if (taxType === "VAT") vat15 += taxAmount;
    else if (taxType === "TOT") {
      if (taxRate >= 0.1) tot10 += taxAmount;
      else tot2 += taxAmount;
    } else if (taxType === "EXEMPT") exempt += line.totalPrice - line.discount;
    else if (taxType === "WHT") withholding += taxAmount;
  }
  return { vat15, tot2, tot10, exempt, withholding };
}
function getVoids(shiftId) {
  const voids = dbProxy.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(totalPrice), 0) as amount,
           GROUP_CONCAT(voidReason) as reasons
    FROM sales 
    WHERE id IN (SELECT saleId FROM shift_transactions WHERE shiftId = ?)
    AND status = 'Voided'
  `).get(shiftId);
  return {
    count: voids?.count || 0,
    amount: voids?.amount || 0,
    reasons: voids?.reasons?.split(",").filter(Boolean) || []
  };
}
function getRefunds(shiftId) {
  const refunds = dbProxy.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(refundAmount), 0) as amount
    FROM returns 
    WHERE saleId IN (SELECT saleId FROM shift_transactions WHERE shiftId = ?)
  `).get(shiftId);
  return { count: refunds?.count || 0, amount: refunds?.amount || 0 };
}
function getReturns(shiftId) {
  const returns = dbProxy.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(refundAmount), 0) as amount
    FROM returns 
    WHERE saleId IN (SELECT saleId FROM shift_transactions WHERE shiftId = ?)
  `).get(shiftId);
  return { count: returns?.count || 0, amount: returns?.amount || 0 };
}
function getTopItems(shiftId) {
  return dbProxy.prepare(`
    SELECT i.name, SUM(sl.qty) as totalQty, SUM(sl.totalPrice) as totalRevenue
    FROM sales s
    JOIN sale_lines sl ON s.id = sl.saleId
    JOIN items i ON sl.itemId = i.id
    WHERE s.id IN (SELECT saleId FROM shift_transactions WHERE shiftId = ?)
    GROUP BY i.id
    ORDER BY totalQty DESC
    LIMIT 20
  `).all(shiftId);
}
function getCategoryBreakdown(shiftId) {
  return dbProxy.prepare(`
    SELECT c.name as category, COUNT(*) as salesCount, SUM(sl.totalPrice) as revenue
    FROM sales s
    JOIN sale_lines sl ON s.id = sl.saleId
    JOIN items i ON sl.itemId = i.id
    JOIN categories c ON i.categoryId = c.id
    WHERE s.id IN (SELECT saleId FROM shift_transactions WHERE shiftId = ?)
    GROUP BY c.id
    ORDER BY revenue DESC
  `).all(shiftId);
}
function generateFiscalSignature(shiftId) {
  return {
    fiscalNumber: `F-${String(shiftId).padStart(8, "0")}`,
    signature: null
  };
}
function printFiscalReport(report, escposDriver) {
  const { EscposWriter: EscposWriter2 } = require("../escpos");
  const w = new EscposWriter2().init();
  const WIDTH2 = 42;
  function money2(n) {
    return `ETB ${(Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  const divider2 = "-".repeat(WIDTH2);
  w.align(1).bold(true).size(2, 2).text(report.reportType === "Z" ? "Z-REPORT" : "X-REPORT").lineFeed().size(1, 1).bold(false);
  w.align(1).text(report.businessName.slice(0, WIDTH2)).lineFeed();
  if (report.tin) w.text(`TIN: ${report.tin}`).lineFeed();
  if (report.address) w.align(1).text(report.address.slice(0, WIDTH2)).lineFeed().align(0);
  w.text(`Date: ${report.date}  Time: ${report.time}`).lineFeed();
  w.text(`Report #${report.reportNumber}`).lineFeed();
  w.text(divider2).lineFeed();
  w.text(`Shift: ${report.shift.id}  Register: ${report.shift.registerId}`).lineFeed();
  w.text(`Cashier: ${report.shift.cashierId}`).lineFeed();
  w.text(`Opened: ${report.shift.openedAt?.slice(0, 16).replace("T", " ")}`).lineFeed();
  if (report.shift.closedAt) w.text(`Closed: ${report.shift.closedAt.slice(0, 16).replace("T", " ")}`).lineFeed();
  w.text(divider2).lineFeed();
  w.bold(true).text("SALES SUMMARY").lineFeed().bold(false);
  w.column("Gross Sales", money2(report.totals.grossSales), WIDTH2);
  w.column("Discounts", money2(-report.totals.discounts), WIDTH2);
  w.column("Net Sales", money2(report.totals.netSales), WIDTH2);
  w.text(divider2).lineFeed();
  w.bold(true).text("TAX BREAKDOWN").lineFeed().bold(false);
  if (report.taxBreakdown.vat15 > 0) w.column("VAT 15%", money2(report.taxBreakdown.vat15), WIDTH2);
  if (report.taxBreakdown.tot2 > 0) w.column("TOT 2%", money2(report.taxBreakdown.tot2), WIDTH2);
  if (report.taxBreakdown.tot10 > 0) w.column("TOT 10%", money2(report.taxBreakdown.tot10), WIDTH2);
  if (report.taxBreakdown.exempt > 0) w.column("Exempt", money2(report.taxBreakdown.exempt), WIDTH2);
  if (report.taxBreakdown.withholding > 0) w.column("WHT", money2(report.taxBreakdown.withholding), WIDTH2);
  w.text(divider2).lineFeed();
  w.bold(true).column("NET SALES", money2(report.totals.netSales), WIDTH2).bold(false).lineFeed();
  w.text(divider2).lineFeed();
  w.bold(true).text("PAYMENT METHODS").lineFeed().bold(false);
  w.column("Cash", money2(report.paymentBreakdown.cash), WIDTH2);
  w.column("Card", money2(report.paymentBreakdown.card), WIDTH2);
  w.column("Mobile", money2(report.paymentBreakdown.mobile), WIDTH2);
  w.text(divider2).lineFeed();
  w.column("Voids", `${report.voids.count} (${money2(-report.voids.amount)})`, WIDTH2);
  w.column("Refunds", `${report.refunds.count} (${money2(-report.refunds.amount)})`, WIDTH2);
  w.column("Returns", `${report.returns.count} (${money2(-report.returns.amount)})`, WIDTH2);
  w.text(divider2).lineFeed();
  w.bold(true).text("CASH DRAWER").lineFeed().bold(false);
  w.column("Opening Float", money2(report.cashDrawer.openingFloat), WIDTH2);
  w.column("Expected Cash", money2(report.cashDrawer.expectedCash), WIDTH2);
  w.column("Counted Cash", money2(report.cashDrawer.countedCash), WIDTH2);
  w.column("Variance", money2(report.cashDrawer.variance), WIDTH2);
  w.text(divider2).lineFeed();
  for (const c of report.cashDrawer.breakdown) {
    w.column(`${c.denomination} x ${c.count}`, money2(c.total), WIDTH2);
  }
  w.text(divider2).lineFeed();
  if (report.topItems.length > 0) {
    w.bold(true).text("TOP ITEMS").lineFeed().bold(false);
    for (const item of report.topItems.slice(0, 5)) {
      w.text(`${item.name} x${item.totalQty} - ${money2(item.totalRevenue)}`).lineFeed();
    }
    w.text(divider2).lineFeed();
  }
  if (report.categoryBreakdown.length > 0) {
    w.bold(true).text("BY CATEGORY").lineFeed().bold(false);
    for (const cat of report.categoryBreakdown.slice(0, 10)) {
      w.column(cat.category, money2(cat.revenue), WIDTH2);
    }
    w.text(divider2).lineFeed();
  }
  w.text(`Fiscal #: ${report.fiscalSignature.fiscalNumber}`).lineFeed();
  if (report.fiscalSignature.signature) {
    w.text(`Sig: ${report.fiscalSignature.signature}`).lineFeed();
  }
  w.text(divider2).lineFeed();
  w.align(1).text("Thank you!").lineFeed(2).align(0);
  w.cut(true);
  return w.toUint8Array();
}
function createLedgerEntry(params) {
  (/* @__PURE__ */ new Date()).toISOString();
  crypto.randomUUID();
  const lastEntry = dbProxy.prepare(`
    SELECT balance FROM ledger_entries 
    WHERE businessId = ? 
    ORDER BY id DESC LIMIT 1
  `).get(arguments[0].businessId);
  const currentBalance = lastEntry?.balance || 0;
  const newBalance = currentBalance + arguments[0].amount;
  const entry = {
    businessId: arguments[0].businessId,
    shiftId: arguments[0].shiftId || null,
    type: arguments[0].type,
    referenceId: arguments[0].referenceId || null,
    referenceType: arguments[0].referenceType || null,
    amount: arguments[0].amount,
    balance: newBalance,
    description: arguments[0].description,
    metadata: JSON.stringify(arguments[0].metadata || {}),
    createdBy: arguments[0].createdBy || null,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    uuid: crypto.randomUUID(),
    isReversal: false,
    originalEntryId: null
  };
  const result = dbProxy.prepare(`
    INSERT INTO ledger_entries (
      businessId, shiftId, type, referenceId, referenceType,
      amount, balance, description, metadata, createdBy,
      createdAt, uuid, isReversal, originalEntryId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.businessId,
    entry.shiftId,
    entry.type,
    entry.referenceId,
    entry.referenceType,
    entry.amount,
    entry.balance,
    entry.description,
    entry.metadata,
    entry.createdBy,
    entry.createdAt,
    entry.uuid,
    entry.isReversal,
    entry.originalEntryId
  );
  const entryId = result.lastInsertRowid;
  logger.info(`[Ledger] Created entry ${entryId}: ${entry.type} ${entry.amount > 0 ? "+" : ""}${entry.amount} (balance: ${newBalance})`);
  return { ...entry, id: entryId };
}
function reverseEntry(request) {
  const original = dbProxy.prepare("SELECT * FROM ledger_entries WHERE id = ?").get(request.entryId);
  if (!original) throw new Error("Original entry not found");
  if (original.isReversal) throw new Error("Entry already reversed");
  if (original.businessId !== request.performedBy) ;
  const reversalAmount = -original.amount;
  const reversalDescription = `REVERSAL: ${original.description} (Reason: ${request.reason})`;
  const reversal = createLedgerEntry({
    businessId: original.businessId,
    shiftId: original.shiftId,
    type: original.type + "_REVERSAL",
    referenceId: original.referenceId,
    referenceType: original.referenceType,
    amount: reversalAmount,
    description: reversalDescription,
    metadata: {
      originalEntryId: original.id,
      reversalReason: request.reason,
      reversedBy: request.performedBy
    },
    createdBy: request.performedBy
  });
  dbProxy.prepare("UPDATE ledger_entries SET isReversal = 1 WHERE id = ?").run(original.id);
  logger.info(`[Ledger] Reversed entry ${original.id} with reversal ${reversal.id}`);
  return reversal;
}
function getLedgerBalance(businessId) {
  const result = dbProxy.prepare(`
    SELECT 
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as credits,
      SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END) as debits,
      MAX(balance) as balance
    FROM ledger_entries WHERE businessId = ?
  `).get(businessId);
  return {
    credits: result?.credits || 0,
    debits: Math.abs(result?.debits || 0),
    balance: result?.balance || 0
  };
}
function getLedgerEntries(businessId, options) {
  let query = "SELECT * FROM ledger_entries WHERE businessId = ?";
  const params = [businessId];
  if (options?.shiftId) {
    query += " AND shiftId = ?";
    params.push(options.shiftId);
  }
  if (options?.type) {
    query += " AND type = ?";
    params.push(options.type);
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
  if (options?.limit) {
    query += " LIMIT ?";
    params.push(options.limit);
  }
  if (options?.offset) {
    query += " OFFSET ?";
    params.push(options.offset);
  }
  return dbProxy.prepare(query).all(...params);
}
function getShiftLedgerSummary(shiftId) {
  const entries = dbProxy.prepare(`
    SELECT type, COUNT(*) as count, SUM(amount) as total
    FROM ledger_entries
    WHERE shiftId = ?
    GROUP BY type
    ORDER BY total DESC
  `).all(shiftId);
  const summary = {
    totalCredits: 0,
    totalDebits: 0,
    netAmount: 0,
    byType: {}
  };
  for (const e of entries) {
    if (e.total > 0) summary.totalCredits += e.total;
    else summary.totalDebits += Math.abs(e.total);
    summary.byType[e.type] = { count: e.count, total: e.total };
  }
  summary.netAmount = summary.totalCredits - summary.totalDebits;
  return summary;
}
function verifyLedgerIntegrity(businessId) {
  const errors = [];
  const entries = dbProxy.prepare(`
    SELECT id, amount, balance, createdAt 
    FROM ledger_entries 
    WHERE businessId = ? 
    ORDER BY id ASC
  `).all(businessId);
  let runningBalance = 0;
  for (let i = 0; i < entries.length; i++) {
    runningBalance += entries[i].amount;
    if (Math.abs(runningBalance - entries[i].balance) > 0.01) {
      errors.push(`Balance mismatch at entry ${entries[i].id}: expected ${runningBalance}, got ${entries[i].balance}`);
    }
  }
  const reversals = dbProxy.prepare(`
    SELECT * FROM ledger_entries 
    WHERE businessId = ? AND isReversal = 1
  `).all(businessId);
  for (const rev of reversals) {
    const original = dbProxy.prepare("SELECT * FROM ledger_entries WHERE id = ?").get(
      JSON.parse(rev.metadata).originalEntryId
    );
    if (!original) {
      errors.push(`Reversal ${rev.id} references non-existent original entry`);
    }
  }
  return { valid: errors.length === 0, errors };
}
const TAX_RATES = {
  VAT: { type: "VAT", rate: 0.15, description: "Value Added Tax 15%", applicableTo: "sales" },
  TOT_2: { type: "TOT_2", rate: 0.02, description: "Turnover Tax 2%", applicableTo: "sales" },
  TOT_10: { type: "TOT_10", rate: 0.1, description: "Turnover Tax 10%", applicableTo: "sales" },
  EXEMPT: { type: "EXEMPT", rate: 0, description: "Tax Exempt", applicableTo: "sales" },
  WHT_2: { type: "WHT_2", rate: 0.02, description: "Withholding Tax 2%", applicableTo: "payments" },
  WHT_3: { type: "WHT_3", rate: 0.03, description: "Withholding Tax 3%", applicableTo: "payments" }
};
function calculateTax(lines) {
  const result = {
    lines: [],
    subtotal: 0,
    totalDiscount: 0,
    totalTax: 0,
    total: 0,
    taxBreakdown: {
      VAT: 0,
      TOT_2: 0,
      TOT_10: 0,
      WHT_2: 0,
      WHT_3: 0,
      EXEMPT: 0
    }
  };
  for (const line of lines) {
    const taxRate = TAX_RATES[line.taxType].rate;
    const qty = line.qty || 0;
    const unitPrice = line.unitPrice || 0;
    const discount = line.discount || 0;
    const gross = qty * unitPrice;
    const discountAmount = discount;
    const net2 = gross - discountAmount;
    let tax = 0;
    if (line.isInclusive) {
      tax = gross - gross / (1 + taxRate);
    } else {
      tax = net2 * taxRate;
    }
    const total = net2 + tax;
    result.lines.push({
      qty,
      unitPrice,
      discount: discountAmount,
      taxType: line.taxType,
      taxRate,
      gross,
      discountAmount,
      net: net2,
      tax,
      total
    });
    result.subtotal += gross;
    result.totalDiscount += discountAmount;
    result.totalTax += tax;
    result.total += total;
    switch (line.taxType) {
      case "VAT":
        result.taxBreakdown.VAT += tax;
        break;
      case "TOT_2":
        result.taxBreakdown.TOT_2 += tax;
        break;
      case "TOT_10":
        result.taxBreakdown.TOT_10 += tax;
        break;
      case "WHT_2":
        result.taxBreakdown.WHT_2 += tax;
        break;
      case "WHT_3":
        result.taxBreakdown.WHT_3 += tax;
        break;
      case "EXEMPT":
        result.taxBreakdown.EXEMPT += tax;
        break;
    }
  }
  return result;
}
function calculateWHT(input) {
  if (input.isExempt) {
    return {
      whtType: "EXEMPT",
      rate: 0,
      baseAmount: input.paymentAmount,
      whtAmount: 0,
      netPayment: input.paymentAmount,
      isExempt: true,
      exemptionCertificate: input.exemptionCertificate
    };
  }
  let rate = 0;
  let whtType = "WHT_2";
  if (input.supplierCategory === "non-resident") {
    rate = 0.1;
    whtType = "WHT_3";
  } else {
    switch (input.paymentType) {
      case "service":
        rate = 0.02;
        whtType = "WHT_2";
        break;
      case "goods":
        rate = 0.02;
        whtType = "WHT_2";
        break;
      case "rent":
        rate = 0.1;
        whtType = "WHT_3";
        break;
      case "interest":
        rate = 0.05;
        whtType = "WHT_3";
        break;
      case "dividend":
        rate = 0.1;
        whtType = "WHT_3";
        break;
      case "royalty":
        rate = 0.05;
        whtType = "WHT_3";
        break;
      default:
        rate = 0.02;
        whtType = "WHT_2";
    }
  }
  const baseAmount = input.paymentAmount;
  const whtAmount = Math.round(baseAmount * rate * 100) / 100;
  const netPayment = baseAmount - whtAmount;
  return {
    whtType,
    rate,
    baseAmount,
    whtAmount,
    netPayment,
    isExempt: false
  };
}
function calculateVatReturn(input) {
  const netVat = input.outputVat - input.inputVat + (input.adjustments || 0);
  let status = "nil";
  if (netVat > 0) status = "payable";
  else if (netVat < 0) status = "refundable";
  return {
    period: input.period,
    outputVat: input.outputVat,
    inputVat: input.inputVat,
    netVat,
    adjustments: input.adjustments || 0,
    payable: Math.max(0, netVat),
    status
  };
}
function calculateTotReturn(input) {
  const taxRate = TAX_RATES[input.taxType].rate;
  const taxDue = Math.round(input.turnover * taxRate * 100) / 100;
  return {
    period: input.period,
    turnover: input.turnover,
    taxRate,
    taxDue
  };
}
function calculateMAT(grossTurnover) {
  return Math.round(grossTurnover * 0.025 * 100) / 100;
}
function calculateAdvanceTax(estimatedAnnualTax) {
  return Math.round(estimatedAnnualTax * 0.25 * 100) / 100;
}
function calculatePAYE(input) {
  const brackets = [
    { max: 600, rate: 0 },
    { max: 1650, rate: 0.1 },
    { max: 3200, rate: 0.15 },
    { max: 5250, rate: 0.2 },
    { max: 7800, rate: 0.25 },
    { max: 10900, rate: 0.3 },
    { max: Infinity, rate: 0.35 }
  ];
  const pensionContribution = Math.min(input.grossSalary * 0.07, 5e3);
  const taxableIncome = input.grossSalary - input.allowances - pensionContribution;
  let remainingIncome = Math.max(0, taxableIncome);
  let paye = 0;
  const breakdown = [];
  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    const previousMax = brackets[brackets.indexOf(bracket) - 1]?.max || 0;
    const bracketWidth = bracket.max - previousMax;
    const taxableInBracket = Math.min(remainingIncome, bracketWidth);
    if (taxableInBracket > 0) {
      const tax = Math.round(taxableInBracket * bracket.rate * 100) / 100;
      paye += tax;
      breakdown.push({
        bracket: `ETB ${previousMax + 1} - ${bracket.max === Infinity ? "∞" : bracket.max}`,
        rate: bracket.rate * 100,
        amount: tax
      });
      remainingIncome -= taxableInBracket;
    }
  }
  const dependentDeduction = Math.min(input.dependents * 150, paye * 0.5);
  paye = Math.max(0, paye - dependentDeduction);
  if (dependentDeduction > 0) {
    breakdown.push({
      bracket: "Dependent deduction",
      rate: 0,
      amount: -dependentDeduction
    });
  }
  const netSalary = input.grossSalary - pensionContribution - paye;
  return {
    grossSalary: input.grossSalary,
    taxableIncome,
    paye,
    netSalary,
    pensionContribution,
    breakdown
  };
}
function calculatePension(input) {
  const employeeRate = input.employeeRate || 0.07;
  const employerRate = input.employerRate || 0.11;
  const cap = input.cap || 5e3;
  let employeeContribution = Math.round(input.grossSalary * employeeRate * 100) / 100;
  let employerContribution = Math.round(input.grossSalary * employerRate * 100) / 100;
  let capped = false;
  if (employeeContribution > cap) {
    employeeContribution = cap;
    capped = true;
  }
  if (employerContribution > cap) {
    employerContribution = cap;
    capped = true;
  }
  return {
    employeeContribution,
    employerContribution,
    totalContribution: employeeContribution + employerContribution,
    capped
  };
}
function generateMorQrPayload(data) {
  const formatAmount2 = (amount) => {
    return (Math.round(amount * 100) / 100).toFixed(2);
  };
  const parts = [
    data.tin.padStart(10, "0"),
    // TIN: 10 digits, zero-padded
    data.invoiceNo,
    // Invoice number
    data.date,
    // YYYY-MM-DD
    formatAmount2(data.totalAmount),
    // Total amount
    formatAmount2(data.vatAmount),
    // VAT amount
    formatAmount2(data.totAmount || 0),
    // TOT amount (0 if not applicable)
    formatAmount2(data.whtAmount || 0)
    // WHT amount (0 if not applicable)
  ];
  return parts.join("|");
}
const WIDTH = 42;
function money(n) {
  return `ETB ${(Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function padRight(s, w) {
  if (s.length >= w) return s.slice(0, w);
  return s + " ".repeat(w - s.length);
}
const divider = "-".repeat(WIDTH);
function buildMorReceipt(input) {
  const w = new EscposWriter().init();
  w.align(1).bold(true).size(2, 2).text("SALES RECEIPT").lineFeed().size(1, 1).bold(false).lineFeed();
  w.align(1).bold(true).text(input.businessName.slice(0, WIDTH)).lineFeed().bold(false);
  if (input.address) w.align(1).text(input.address.slice(0, WIDTH)).lineFeed().align(0);
  if (input.phone) w.text(`Tel: ${input.phone}`).lineFeed();
  w.text(`TIN: ${input.tin}`).lineFeed();
  w.text(divider).lineFeed();
  w.text(`Invoice: ${input.invoiceNo}`).lineFeed();
  w.text(`Date: ${input.date}  Time: ${input.time}`).lineFeed();
  w.text(`Cashier: ${input.cashier}`).lineFeed();
  w.text(divider).lineFeed();
  for (const item of input.items) {
    const lineTotal = item.qty * item.unitPrice - (item.discount || 0);
    w.text(padRight(item.name.slice(0, 28), 28)).text(padRight(String(item.qty), 4)).text(padRight(item.unit.slice(0, 3), 4)).text(money(lineTotal).padStart(6)).lineFeed();
    if (item.discount && item.discount > 0) {
      w.text(`  Discount: ${money(item.discount)}`).lineFeed();
    }
    w.text(`  @ ${money(item.unitPrice)} (${item.taxType} ${(item.taxRate * 100).toFixed(0)}%)`).lineFeed();
  }
  w.text(divider).lineFeed();
  w.column("Subtotal", money(input.subtotal), WIDTH);
  if (input.discount > 0) w.column("Discount", `-${money(input.discount)}`, WIDTH);
  if (input.vatAmount > 0) w.column("VAT 15%", money(input.vatAmount), WIDTH);
  if (input.totAmount > 0) w.column("TOT", money(input.totAmount), WIDTH);
  w.text(divider).lineFeed();
  w.bold(true).size(2, 2).column("TOTAL", money(input.total), WIDTH).size(1, 1).bold(false).lineFeed();
  w.text(divider).lineFeed();
  w.column("Payment", input.paymentMethod, WIDTH);
  if (input.paid > 0) w.column("Paid", money(input.paid), WIDTH);
  if (input.change > 0) w.column("Change", money(input.change), WIDTH);
  w.text(divider).lineFeed();
  const qrPayload = generateMorQrPayload({
    tin: input.tin,
    invoiceNo: input.invoiceNo,
    date: input.date,
    totalAmount: input.total,
    vatAmount: input.vatAmount,
    totAmount: input.totAmount
  });
  w.align(1).text("MoR QR Code:").lineFeed();
  w.qr(qrPayload, 6, 1);
  w.lineFeed();
  w.text(`TIN: ${input.tin} | Inv: ${input.invoiceNo} | ${input.date}`).lineFeed();
  w.text(`Total: ${money(input.total)} | VAT: ${money(input.vatAmount)}`).lineFeed();
  w.lineFeed();
  w.text(divider).lineFeed();
  w.align(1).text("Thank you for your business!").lineFeed(2).align(0);
  w.text("This receipt is valid for tax purposes").lineFeed();
  w.text(`Fiscal Sign: F-${String(Date.now()).slice(-8)}`).lineFeed();
  w.cut(true);
  return w.toUint8Array();
}
function validateMorQrPayload(payload) {
  const errors = [];
  const parts = payload.split("|");
  if (parts.length !== 7) {
    errors.push(`Expected 7 parts, got ${parts.length}`);
    return { valid: false, errors };
  }
  const [tin, invoiceNo, date, totalAmount, vatAmount, totAmount, whtAmount] = parts;
  if (!/^\d{10}$/.test(tin)) {
    errors.push("TIN must be 10 digits");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push("Date must be YYYY-MM-DD format");
  } else {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      errors.push("Invalid date");
    }
  }
  const amountFields = [
    { name: "Total", value: totalAmount },
    { name: "VAT", value: vatAmount },
    { name: "TOT", value: totAmount },
    { name: "WHT", value: whtAmount }
  ];
  for (const field of amountFields) {
    if (!/^\d+\.\d{2}$/.test(field.value)) {
      errors.push(`${field.name} amount must have 2 decimal places`);
    }
    const val = parseFloat(field.value);
    if (isNaN(val) || val < 0) {
      errors.push(`${field.name} amount must be a positive number`);
    }
  }
  const total = parseFloat(totalAmount);
  const vat = parseFloat(vatAmount);
  const tot = parseFloat(totAmount);
  const wht = parseFloat(whtAmount);
  const net2 = total - vat - tot - wht;
  if (net2 < -0.01) {
    errors.push("Total amount less than sum of taxes");
  }
  return { valid: errors.length === 0, errors };
}
async function printMorReceipt(escposDriver, input) {
  const receiptData = buildMorReceipt(input);
  await escposDriver.write(receiptData);
}
const CASH_TRANSACTION_LIMIT = 5e4;
function checkCashTransactionLimit(context) {
  if (context.paymentMethod === "cash" && context.amount && context.amount > CASH_TRANSACTION_LIMIT) {
    return {
      passed: false,
      message: `Cash transaction of ${context.amount} ETB exceeds the legal limit of ${CASH_TRANSACTION_LIMIT} ETB. Digital payment required.`,
      code: "CASH_LIMIT_EXCEEDED",
      severity: "blocking",
      remediation: "Use digital payment (Telebirr, CBE Birr, Card) for amounts over 50,000 ETB"
    };
  }
  return { passed: true, message: "Cash transaction within limit", code: "CASH_LIMIT_OK", severity: "warning" };
}
function checkDigitalPaymentRequired(context) {
  if (context.amount && context.amount > CASH_TRANSACTION_LIMIT && context.paymentMethod === "cash") {
    return {
      passed: false,
      message: `Transactions over ${CASH_TRANSACTION_LIMIT} ETB require digital payment (Telebirr, CBE Birr, Card)`,
      code: "DIGITAL_PAYMENT_REQUIRED",
      severity: "blocking",
      remediation: "Select Telebirr, CBE Birr, or Card payment method"
    };
  }
  return { passed: true, message: "Payment method compliant", code: "PAYMENT_OK", severity: "warning" };
}
function checkMATCompliance(context) {
  if (context.amount && context.amount > 1e6) {
    return {
      passed: true,
      message: "Business may be subject to Minimum Alternative Tax (2.5% of turnover)",
      code: "MAT_WARNING",
      severity: "warning",
      remediation: "Ensure MAT is calculated and paid quarterly"
    };
  }
  return { passed: true, message: "MAT check passed", code: "MAT_OK", severity: "warning" };
}
function checkAdvanceTaxCompliance(context) {
  const now2 = /* @__PURE__ */ new Date();
  Math.floor(now2.getMonth() / 3) + 1;
  const quarterEndMonths = [3, 6, 9, 12];
  const isQuarterEnd = quarterEndMonths.includes(now2.getMonth() + 1);
  if (isQuarterEnd && now2.getDate() > 25) {
    return {
      passed: true,
      message: "Quarterly advance tax (25% of estimated annual tax) due this month",
      code: "ADVANCE_TAX_DUE",
      severity: "warning",
      remediation: "Calculate and pay 25% of estimated annual tax before quarter end"
    };
  }
  return { passed: true, message: "Advance tax not due", code: "ADVANCE_TAX_OK", severity: "warning" };
}
function validateTin(tin) {
  if (!tin) {
    return {
      passed: false,
      message: "TIN is required",
      code: "TIN_MISSING",
      severity: "error",
      remediation: "Provide valid 10-digit TIN"
    };
  }
  if (!/^\d{10}$/.test(tin)) {
    return {
      passed: false,
      message: "TIN must be 10 digits",
      code: "TIN_INVALID_FORMAT",
      severity: "error",
      remediation: "Provide valid 10-digit TIN"
    };
  }
  const digits = tin.split("").map(Number);
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 2), 0);
  if (sum % 10 !== 0) {
    return {
      passed: false,
      message: "TIN checksum validation failed",
      code: "TIN_INVALID_CHECKSUM",
      severity: "warning",
      remediation: "Verify TIN with Ministry of Revenues"
    };
  }
  return { passed: true, message: "TIN valid", code: "TIN_VALID", severity: "warning" };
}
function checkBuyerTinRequired(context) {
  if (context.amount && context.amount > 1e4 && !context.customerTin) {
    return {
      passed: false,
      message: "Buyer TIN required for transactions over 10,000 ETB",
      code: "BUYER_TIN_REQUIRED",
      severity: "blocking",
      remediation: "Collect buyer TIN before completing sale"
    };
  }
  return { passed: true, message: "Buyer TIN not required", code: "BUYER_TIN_OK", severity: "warning" };
}
function checkFiscalReceiptRequirements(context) {
  if (!context.items || context.items.length === 0) {
    return {
      passed: false,
      message: "Receipt must contain at least one item",
      code: "EMPTY_RECEIPT",
      severity: "blocking",
      remediation: "Add at least one item to the receipt"
    };
  }
  for (const item of context.items) {
    if (!item.qty || item.qty <= 0) {
      return {
        passed: false,
        message: "All items must have quantity > 0",
        code: "INVALID_QUANTITY",
        severity: "blocking",
        remediation: "Set valid quantity for all items"
      };
    }
    if (!item.unitPrice || item.unitPrice <= 0) {
      return {
        passed: false,
        message: "All items must have unit price > 0",
        code: "INVALID_PRICE",
        severity: "blocking",
        remediation: "Set valid price for all items"
      };
    }
    if (!item.taxType) {
      return {
        passed: false,
        message: "All items must have a tax type (VAT, TOT, EXEMPT)",
        code: "MISSING_TAX_TYPE",
        severity: "blocking",
        remediation: "Assign tax type to all items"
      };
    }
  }
  return { passed: true, message: "Receipt requirements met", code: "RECEIPT_OK", severity: "warning" };
}
function checkShiftCompliance(context) {
  if (!context.shiftId) {
    return {
      passed: false,
      message: "No active shift. Open a shift before processing sales.",
      code: "NO_ACTIVE_SHIFT",
      severity: "blocking",
      remediation: "Open a shift before processing transactions"
    };
  }
  return { passed: true, message: "Shift compliance OK", code: "SHIFT_OK", severity: "warning" };
}
function checkStockCompliance(context) {
  if (!context.items) return { passed: true, message: "No items to check", code: "STOCK_OK", severity: "warning" };
  for (const item of context.items) {
    if (item.qty <= 0) {
      return {
        passed: false,
        message: "Sale quantity must be positive",
        code: "INVALID_QUANTITY",
        severity: "blocking",
        remediation: "Enter valid sale quantity"
      };
    }
  }
  return { passed: true, message: "Stock compliance OK", code: "STOCK_OK", severity: "warning" };
}
function runComplianceChecks(context, rules = DEFAULT_COMPLIANCE_RULES) {
  const results = [];
  let blocked = false;
  for (const rule of rules) {
    try {
      const result = rule.check(context);
      results.push(result);
      if (!result.passed && result.severity === "blocking") {
        blocked = true;
      }
    } catch (e) {
      logger.error(`Compliance check ${rule.id} failed:`, e);
      results.push({
        passed: false,
        message: `Compliance check failed: ${e.message}`,
        code: "CHECK_ERROR",
        severity: "error"
      });
    }
  }
  return {
    passed: !blocked,
    results,
    blocked
  };
}
const DEFAULT_COMPLIANCE_RULES = [
  {
    id: "cash_limit",
    name: "Cash Transaction Limit",
    description: "Enforce ETB 50,000 cash transaction limit",
    severity: "blocking",
    check: checkCashTransactionLimit
  },
  {
    id: "digital_payment",
    name: "Digital Payment Required",
    description: "Enforce digital payment for transactions over 50,000 ETB",
    severity: "blocking",
    check: checkDigitalPaymentRequired
  },
  {
    id: "buyer_tin",
    name: "Buyer TIN Required",
    description: "Require buyer TIN for transactions over 10,000 ETB",
    severity: "blocking",
    check: checkBuyerTinRequired
  },
  {
    id: "fiscal_receipt",
    name: "Fiscal Receipt Requirements",
    description: "Ensure receipt has all required fields",
    severity: "blocking",
    check: checkFiscalReceiptRequirements
  },
  {
    id: "shift_compliance",
    name: "Shift Compliance",
    description: "Ensure active shift before processing",
    severity: "blocking",
    check: checkShiftCompliance
  },
  {
    id: "stock_compliance",
    name: "Stock Compliance",
    description: "Validate stock levels for sale items",
    severity: "blocking",
    check: checkStockCompliance
  },
  {
    id: "mat_warning",
    name: "MAT Warning",
    description: "Minimum Alternative Tax awareness",
    severity: "warning",
    check: checkMATCompliance
  },
  {
    id: "advance_tax",
    name: "Advance Tax Reminder",
    description: "Quarterly advance tax reminder",
    severity: "warning",
    check: checkAdvanceTaxCompliance
  }
];
function logComplianceEvent(businessId, eventType, details, userId) {
  ({
    details: JSON.stringify(details),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  const db2 = require("../database").default;
  db2.prepare(`
    INSERT INTO compliance_audit_log (businessId, eventType, details, userId, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(businessId, eventType, JSON.stringify(details), userId || null, (/* @__PURE__ */ new Date()).toISOString());
  logger.info(`[Compliance] ${eventType}:`, details);
}
function generateComplianceReport(businessId, fromDate, toDate) {
  const db2 = require("../database").default;
  const logs = db2.prepare(`
    SELECT * FROM compliance_audit_log 
    WHERE businessId = ? AND timestamp >= ? AND timestamp <= ?
    ORDER BY timestamp DESC
  `).all(businessId, fromDate, toDate);
  const byRule = {};
  for (const log of logs) {
    const details = JSON.parse(log.details);
    const ruleId = details.ruleId || "unknown";
    const passed2 = details.passed === true;
    if (!byRule[ruleId]) byRule[ruleId] = { passed: 0, failed: 0 };
    if (passed2) byRule[ruleId].passed++;
    else byRule[ruleId].failed++;
  }
  const totalChecks = logs.length;
  const passed = logs.filter((l) => JSON.parse(l.details).passed === true).length;
  const warnings = logs.filter((l) => {
    const d = JSON.parse(l.details);
    return d.severity === "warning" && d.passed === false;
  }).length;
  const errors = logs.filter((l) => {
    const d = JSON.parse(l.details);
    return d.severity === "error" && d.passed === false;
  }).length;
  const blocked = logs.filter((l) => {
    const d = JSON.parse(l.details);
    return d.severity === "blocking" && d.passed === false;
  }).length;
  return {
    period: `${fromDate} to ${toDate}`,
    totalChecks,
    passed,
    warnings,
    errors,
    blocked,
    byRule
  };
}
function formatAmount(amount) {
  return (Math.round(amount * 100) / 100).toFixed(2);
}
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toISOString().split("T")[0];
}
function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toTimeString().slice(0, 8);
}
function generateEtaxSalesCsv(options) {
  const db2 = require("../database").default;
  const { businessId, period, includeVoided = false, includeRefunded = false } = options;
  const [year, month] = period.split("-").map(Number);
  const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];
  let whereClause = `WHERE s.businessId = ? AND s.createdAt >= ? AND s.createdAt <= ?`;
  const params = [businessId, startDate, endDate + " 23:59:59"];
  if (!includeVoided) {
    whereClause += ` AND s.status != 'Voided'`;
  }
  if (!includeRefunded) {
    whereClause += ` AND s.status != 'Refunded'`;
  }
  const query = `
    SELECT 
      s.id,
      s.invoiceNo,
      s.createdAt,
      s.customerTin,
      s.customerName,
      s.totalPrice,
      s.vatAmount,
      s.totAmount,
      s.whtAmount,
      s.paymentMethod,
      s.status
    FROM sales s
    ${whereClause}
    ORDER BY s.createdAt ASC
  `;
  const sales = db2.prepare(query).all(...params);
  const errors = [];
  const headers = [
    "TIN",
    "Invoice_Number",
    "Invoice_Date",
    "Invoice_Time",
    "Buyer_TIN",
    "Buyer_Name",
    "Total_Amount",
    "VAT_Amount",
    "TOT_Amount",
    "WHT_Amount",
    "Payment_Method",
    "Status"
  ];
  let csv = headers.join(",") + "\n";
  let count = 0;
  let totalVat = 0;
  let totalWht = 0;
  for (const sale of sales) {
    try {
      if (!sale.invoiceNo) {
        errors.push(`Sale ${sale.id}: Missing invoice number`);
        continue;
      }
      let buyerTin = sale.customerTin || "";
      if (!buyerTin) {
        const customer = db2.prepare("SELECT tin FROM customers WHERE id = (SELECT customerId FROM sales WHERE id = ?)").get(sale.id);
        buyerTin = customer?.tin || "";
      }
      if (!buyerTin) {
        errors.push(`Sale ${sale.invoiceNo}: Missing buyer TIN`);
      }
      let buyerName = sale.customerName || "";
      if (!buyerName) {
        const customer = db2.prepare("SELECT name FROM customers WHERE id = (SELECT customerId FROM sales WHERE id = ?)").get(sale.id);
        buyerName = customer?.name || "";
      }
      const row = [
        sale.tin || "",
        // Seller TIN (from business settings)
        sale.invoiceNo,
        // Invoice Number
        formatDate(sale.createdAt),
        // Date
        formatTime(sale.createdAt),
        // Time
        buyerTin.padStart(10, "0"),
        // Buyer TIN (10 digits)
        `"${buyerName.replace(/"/g, '""')}"`,
        // Buyer Name (quoted)
        formatAmount(sale.totalPrice),
        // Total Amount
        formatAmount(sale.vatAmount || 0),
        // VAT Amount
        formatAmount(sale.totAmount || 0),
        // TOT Amount
        formatAmount(sale.whtAmount || 0),
        // WHT Amount
        sale.paymentMethod || "Cash",
        // Payment Method
        sale.status || "Valid"
        // Status
      ];
      csv += row.join(",") + "\n";
      count++;
      totalVat += sale.vatAmount || 0;
      totalWht += sale.whtAmount || 0;
    } catch (e) {
      errors.push(`Sale ${sale.invoiceNo}: ${e.message}`);
    }
  }
  return { csv, count, totalVat, totalWht, errors };
}
function generateEtaxPurchasesCsv(options) {
  const db2 = require("../database").default;
  const { businessId, period, includeVoided = false } = options;
  const [year, month] = period.split("-").map(Number);
  const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];
  let whereClause = `WHERE sp.businessId = ? AND sp.purchaseDate >= ? AND sp.purchaseDate <= ?`;
  const params = [businessId, startDate, endDate];
  if (!includeVoided) {
    whereClause += ` AND sp.status != 'Voided'`;
  }
  const query = `
    SELECT 
      sp.id,
      sp.purchaseNumber,
      sp.purchaseDate,
      sp.supplierTin,
      sp.supplierName,
      sp.totalAmount,
      sp.vatAmount,
      sp.whtAmount,
      sp.paymentMethod,
      sp.status
    FROM supplier_purchases sp
    ${whereClause}
    ORDER BY sp.purchaseDate ASC
  `;
  const purchases = db2.prepare(query).all(...params);
  const errors = [];
  const headers = [
    "TIN",
    "Invoice_Number",
    "Invoice_Date",
    "Supplier_TIN",
    "Supplier_Name",
    "Total_Amount",
    "VAT_Amount",
    "WHT_Amount",
    "Payment_Method",
    "Status"
  ];
  let csv = headers.join(",") + "\n";
  let count = 0;
  let totalVat = 0;
  let totalWht = 0;
  for (const purchase of purchases) {
    try {
      if (!purchase.purchaseNumber) {
        errors.push(`Purchase ${purchase.id}: Missing purchase number`);
        continue;
      }
      const row = [
        purchase.tin || "",
        // Business TIN
        purchase.purchaseNumber,
        // Invoice Number
        formatDate(purchase.purchaseDate),
        // Date
        purchase.supplierTin?.padStart(10, "0") || "",
        // Supplier TIN
        `"${(purchase.supplierName || "").replace(/"/g, '""')}"`,
        // Supplier Name
        formatAmount(purchase.totalAmount),
        // Total Amount
        formatAmount(purchase.vatAmount || 0),
        // VAT Amount
        formatAmount(purchase.whtAmount || 0),
        // WHT Amount
        purchase.paymentMethod || "Cash",
        // Payment Method
        purchase.status || "Valid"
        // Status
      ];
      csv += row.join(",") + "\n";
      count++;
      totalVat += purchase.vatAmount || 0;
      totalWht += purchase.whtAmount || 0;
    } catch (e) {
      errors.push(`Purchase ${purchase.purchaseNumber}: ${e.message}`);
    }
  }
  return { csv, count, totalVat, totalWht, errors };
}
function exportEtaxCsv(options) {
  const salesResult = generateEtaxSalesCsv(options);
  const purchasesResult = generateEtaxPurchasesCsv(options);
  const result = {
    salesFile: salesResult.csv,
    purchasesFile: purchasesResult.csv,
    salesCount: salesResult.count,
    purchasesCount: purchasesResult.count,
    totalVat: salesResult.totalVat + purchasesResult.totalVat,
    totalWht: salesResult.totalWht + purchasesResult.totalWht,
    errors: [...salesResult.errors, ...purchasesResult.errors]
  };
  if (options.outputPath) {
    const fs2 = require("fs");
    const path2 = require("path");
    const period = options.period.replace("-", "");
    const salesPath = path2.join(options.outputPath, `etax_sales_${period}.csv`);
    const purchasesPath = path2.join(options.outputPath, `etax_purchases_${period}.csv`);
    fs2.writeFileSync(salesPath, "\uFEFF" + result.salesFile, "utf8");
    fs2.writeFileSync(purchasesPath, "\uFEFF" + result.purchasesFile, "utf8");
    logger.info(`[eTax] Exported ${result.salesCount} sales and ${result.purchasesCount} purchases to ${options.outputPath}`);
  }
  logger.info(`[eTax] Export complete: ${result.salesCount} sales, ${result.purchasesCount} purchases, VAT: ${result.totalVat}, WHT: ${result.totalWht}`);
  return result;
}
function validateEtaxCsv(csv, type) {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return { valid: false, errors: ["Empty CSV"] };
  const headers = lines[0].split(",");
  const requiredHeaders = type === "sales" ? ["TIN", "Invoice_Number", "Invoice_Date", "Invoice_Time", "Buyer_TIN", "Buyer_Name", "Total_Amount", "VAT_Amount", "TOT_Amount", "WHT_Amount", "Payment_Method", "Status"] : ["TIN", "Invoice_Number", "Invoice_Date", "Supplier_TIN", "Supplier_Name", "Total_Amount", "VAT_Amount", "WHT_Amount", "Payment_Method", "Status"];
  const headerErrors = requiredHeaders.filter((h) => !headers.includes(h));
  if (headerErrors.length > 0) {
    return { valid: false, errors: [`Missing headers: ${headerErrors.join(", ")}`] };
  }
  const errors = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",");
    if (row.length < requiredHeaders.length) {
      errors.push(`Row ${i + 1}: Insufficient columns`);
    }
  }
  return { valid: errors.length === 0, errors };
}
function getSetting$1(key) {
  const row = dbProxy.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row?.value ?? null;
}
function setSetting$1(key, value) {
  dbProxy.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
}
function getCloudConfig() {
  const url = (getSetting$1("cloud_sync_url") || "").toString().trim();
  const key = (getSetting$1("cloud_sync_device_key") || "").toString().trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ""), key };
}
function getCloudStatus() {
  const cfg2 = getCloudConfig();
  return {
    enabled: getSetting$1("cloud_sync_enabled") === "true",
    configured: !!cfg2,
    lastError: getSetting$1("cloud_sync_last_error"),
    lastAt: getSetting$1("cloud_sync_last_at")
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
  const cfg2 = getCloudConfig();
  if (!cfg2) throw new Error("Cloud relay not configured (set cloud_sync_url + cloud_sync_device_key)");
  const hubId = ensureHubDeviceId();
  const idempotentKey = `${hubId}@${dbProxy.prepare("SELECT COALESCE(MAX(seq),0) AS m FROM sync_outbox").get().m}`;
  const pushed = buildCloudChanges();
  let result = { pushed: pushed.length, pulled: 0, conflicts: 0 };
  try {
    const res = await httpJson(`${cfg2.url}/api/sync/push`, {
      method: "POST",
      headers: { "X-Device-Key": cfg2.key, "X-Idempotency-Key": idempotentKey },
      body: JSON.stringify({ device_id: hubId, changes: pushed })
    });
    result.pushed = Number(res?.accepted ?? pushed.length);
    const cursor = dbProxy.prepare("SELECT value FROM settings WHERE key = 'cloud_sync_cursor'").get()?.value;
    const since = Number(cursor ?? 0);
    const pulled = await httpJson(`${cfg2.url}/api/sync/pull?device=${encodeURIComponent(hubId)}&since=${since}`, {
      method: "GET",
      headers: { "X-Device-Key": cfg2.key }
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
    setSetting$1("cloud_sync_cursor", String(newSeq));
    setSetting$1("cloud_sync_last_error", "");
    setSetting$1("cloud_sync_last_at", (/* @__PURE__ */ new Date()).toISOString());
  } catch (e) {
    setSetting$1("cloud_sync_last_error", e?.message || String(e));
    throw e;
  }
  return result;
}
async function refreshCloudStatus() {
  const cfg2 = getCloudConfig();
  if (!cfg2) return null;
  const hubId = ensureHubDeviceId();
  try {
    const res = await httpJson(`${cfg2.url}/api/sync/status/?device=${encodeURIComponent(hubId)}`, {
      method: "GET",
      headers: { "X-Device-Key": cfg2.key }
    });
    const status = res?.status ?? null;
    const blocked = !!res?.blocked;
    setSetting$1("cloud_device_status", String(status ?? ""));
    setSetting$1("cloud_device_blocked", String(blocked));
    return { status, blocked, lastError: null };
  } catch (e) {
    return { status: null, blocked: false, lastError: e?.message || String(e) };
  }
}
let timer = null;
const CLOUD_PERIOD_MS = 60 * 1e3;
function startCloudSyncTimer() {
  if (timer) return;
  timer = setInterval(async () => {
    const enabled = getSetting$1("cloud_sync_enabled") === "true";
    if (!enabled) return;
    const cfg2 = getCloudConfig();
    if (!cfg2) return;
    try {
      await syncToCloud();
      await refreshCloudStatus();
    } catch (e) {
    }
  }, CLOUD_PERIOD_MS);
  timer.unref?.();
}
let cfg = null;
function countUnsyncedForDevice(deviceId) {
  const row = dbProxy.prepare("SELECT COUNT(*) AS c FROM sync_outbox WHERE device_id = ?").get(String(deviceId));
  return row?.c ?? 0;
}
function registerBusinessDomainHandlers(config) {
  cfg = config;
  const bizId = () => config.getActiveBusinessId();
  const canManageTeam = () => config.isOwnerOrSuper() || can(config.buildPermissionContext(), "team.manage");
  electron.ipcMain.handle("business:list-registers", () => {
    return dbProxy.prepare("SELECT * FROM registers WHERE businessId = ? AND is_deleted = 0 ORDER BY created_at").all(bizId());
  });
  electron.ipcMain.handle("business:add-register", (_e, name, locationId) => {
    if (!name?.trim()) throw new Error("Register name is required");
    const r = dbProxy.prepare("INSERT INTO registers (businessId, locationId, name, hasDrawer, isActive, created_at) VALUES (?, ?, ?, 1, 1, ?)").run(bizId(), locationId ?? null, name.trim(), (/* @__PURE__ */ new Date()).toISOString());
    config.audit("register.added", "register", r.lastInsertRowid, `Added register ${name}`);
    return dbProxy.prepare("SELECT * FROM registers WHERE id = ?").get(r.lastInsertRowid);
  });
  electron.ipcMain.handle("business:update-register", (_e, id, patch) => {
    const cur = dbProxy.prepare("SELECT * FROM registers WHERE id = ?").get(id);
    if (!cur) throw new Error("Register not found");
    dbProxy.prepare(
      "UPDATE registers SET name = ?, locationId = ?, printerName = ?, hasDrawer = ?, isActive = ?, deviceId = ?, updated_at = ? WHERE id = ?"
    ).run(
      patch.name ?? cur.name,
      patch.locationId ?? cur.locationId,
      patch.printerName ?? cur.printerName,
      patch.hasDrawer !== void 0 ? patch.hasDrawer ? 1 : 0 : cur.hasDrawer,
      patch.isActive !== void 0 ? patch.isActive ? 1 : 0 : cur.isActive,
      patch.deviceId ?? cur.deviceId,
      (/* @__PURE__ */ new Date()).toISOString(),
      id
    );
    return dbProxy.prepare("SELECT * FROM registers WHERE id = ?").get(id);
  });
  electron.ipcMain.handle("business:delete-register", (_e, id) => {
    dbProxy.prepare("UPDATE registers SET is_deleted = 1, updated_at = ? WHERE id = ?").run((/* @__PURE__ */ new Date()).toISOString(), id);
    config.audit("register.removed", "register", id, "Removed register");
    return { ok: true };
  });
  electron.ipcMain.handle("business:list-locations", () => {
    return dbProxy.prepare("SELECT * FROM locations WHERE businessId = ? AND is_deleted = 0 ORDER BY created_at").all(bizId());
  });
  electron.ipcMain.handle("business:add-location", (_e, name, address) => {
    const r = dbProxy.prepare("INSERT INTO locations (businessId, name, address, created_at) VALUES (?, ?, ?, ?)").run(bizId(), name.trim(), address ?? null, (/* @__PURE__ */ new Date()).toISOString());
    return dbProxy.prepare("SELECT * FROM locations WHERE id = ?").get(r.lastInsertRowid);
  });
  electron.ipcMain.handle("business:list-devices", () => {
    return dbProxy.prepare("SELECT * FROM devices WHERE businessId = ? OR businessId IS NULL ORDER BY created_at").all(bizId());
  });
  electron.ipcMain.handle("business:set-device-status", (_e, deviceId, status) => {
    if (status === "disabled" || status === "removed") {
      const unsynced = countUnsyncedForDevice(deviceId);
      if (unsynced > 0) {
        throw new Error(
          `Cannot ${status === "disabled" ? "disable" : "remove"} this device — it still has ${unsynced} unsynced record${unsynced === 1 ? "" : "s"}. Sync first.`
        );
      }
    }
    dbProxy.prepare("UPDATE devices SET status = ?, updated_at = ? WHERE device_id = ? OR id = ?").run(status, (/* @__PURE__ */ new Date()).toISOString(), deviceId, deviceId);
    config.audit("device.changed", "device", null, `Device ${deviceId} -> ${status}`);
    return { ok: true };
  });
  electron.ipcMain.handle("business:rename-device", (_e, deviceId, name) => {
    dbProxy.prepare("UPDATE devices SET name = ?, updated_at = ? WHERE device_id = ? OR id = ?").run(name.trim(), (/* @__PURE__ */ new Date()).toISOString(), deviceId, deviceId);
    return { ok: true };
  });
  electron.ipcMain.handle("business:replace-device", (_e, input) => {
    if (!input?.name?.trim()) throw new Error("Replacement device name is required");
    const old = dbProxy.prepare("SELECT * FROM devices WHERE (device_id = ? OR id = ?) AND is_deleted = 0").get(input.oldDeviceId, input.oldDeviceId);
    if (!old) throw new Error("Original device not found or already removed");
    const unsynced = countUnsyncedForDevice(input.oldDeviceId);
    if (unsynced > 0) {
      throw new Error(
        `Cannot replace this device — it still has ${unsynced} unsynced record${unsynced === 1 ? "" : "s"}. Sync before replacing.`
      );
    }
    const bid = bizId();
    const now2 = (/* @__PURE__ */ new Date()).toISOString();
    const newDeviceId = crypto$1.randomUUID();
    const wasPrimary = !!old.isPrimary;
    const isThis = input.setThisAsReplacement === true;
    const status = isThis ? "active" : "active";
    const colon = dbProxy.prepare(
      `INSERT INTO devices (device_id, name, businessId, platform, role, userId, registerId, status, isPrimary, uuid, row_version, created_at, updated_at, is_deleted, is_synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0, 1)`
    ).run(
      newDeviceId,
      input.name.trim(),
      bid,
      input.platform ?? old.platform ?? "desktop",
      old.role ?? null,
      old.userId ?? null,
      old.registerId ?? null,
      status,
      wasPrimary ? 1 : 0,
      crypto$1.randomUUID(),
      now2,
      now2
    );
    const newId = Number(colon.lastInsertRowid);
    dbProxy.prepare("UPDATE devices SET status = 'removed', is_deleted = 1, updated_at = ? WHERE id = ?").run(now2, old.id);
    cfg?.audit(
      "device.replace",
      "device",
      newId,
      `Replaced device ${input.oldDeviceId} -> ${newDeviceId}`
    );
    return { ok: true, id: newId, device_id: newDeviceId };
  });
  electron.ipcMain.handle("business:self-device-status", () => {
    const deviceId = ensureHubDeviceId();
    const row = dbProxy.prepare(
      `SELECT id, uuid, device_id, name, platform, status, isPrimary, updated_at
         FROM roster_devices
         WHERE (uuid = ? OR device_id = ?) AND is_deleted = 0
         LIMIT 1`
    ).get(deviceId, deviceId);
    if (!row) return { found: false, deviceId, status: null, name: null };
    return { found: true, deviceId, status: row.status, name: row.name };
  });
  electron.ipcMain.handle("business:roles", () => {
    return {
      builtin: BUILTIN_ROLES.map((r) => ({ key: r.key, name: r.name, description: r.description, isSystem: true })),
      order: ROLE_ORDER,
      custom: dbProxy.prepare("SELECT * FROM business_roles WHERE isSystem = 0 AND is_deleted = 0 ORDER BY created_at").all(bizId())
    };
  });
  electron.ipcMain.handle("business:can", (_e, key) => {
    const r = can(config.buildPermissionContext(), key);
    return { allowed: r };
  });
  electron.ipcMain.handle("business:list-people", () => {
    const rows = dbProxy.prepare("SELECT * FROM employees WHERE businessId = ? AND isActive = 1 ORDER BY createdAt").all(bizId());
    return rows.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName || ""}`.trim(),
      phone: e.phone,
      email: e.email,
      roleKey: e.role_key || "cashier",
      permissions: e.permissions_json ? JSON.parse(e.permissions_json) : void 0
    }));
  });
  electron.ipcMain.handle("business:set-person-role", (_e, employeeId, roleKey) => {
    if (!canManageTeam()) throw new Error("You do not have permission to manage team roles");
    const r = getBuiltinRole(roleKey);
    dbProxy.prepare("UPDATE employees SET role_key = ? WHERE id = ? AND businessId = ?").run(roleKey, employeeId, bizId());
    config.audit("role.changed", "employee", employeeId, `Role -> ${r?.name ?? roleKey}`);
    return { ok: true };
  });
  electron.ipcMain.handle("business:set-person-active", (_e, employeeId, isActive) => {
    if (!canManageTeam()) throw new Error("You do not have permission to manage team members");
    dbProxy.prepare("UPDATE employees SET isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(isActive ? 1 : 0, employeeId, bizId());
    config.audit("employee.changed", "employee", employeeId, `Set active = ${isActive}`);
    return { ok: true };
  });
  electron.ipcMain.handle("business:get-user", () => {
    return { role: "admin", isOwner: config.isOwnerOrSuper() };
  });
}
const APPROVER_ROLES = /* @__PURE__ */ new Set(["Owner", "Administrator", "Manager", "super_admin", "admin"]);
function isApproverRole(role) {
  return !!role && APPROVER_ROLES.has(role);
}
function verifyStoredPin(pin, stored) {
  const parts = stored.split(":");
  if (parts.length !== 2) {
    const legacy = crypto$1.createHash("sha256").update(pin).digest("hex");
    return legacy === stored;
  }
  const [salt, key] = parts;
  const check = crypto$1.scryptSync(pin, salt, 64).toString("hex");
  return check === key;
}
function resolveApprover(businessId) {
  const admins = dbProxy.prepare(
    `SELECT id, name, role, pin FROM admins
       WHERE (businessId IS NULL OR businessId = ?) AND isActive = 1`
  ).all(businessId);
  const employees = dbProxy.prepare(
    `SELECT ea.id, e.firstName, e.lastName, r.name AS role, ea.pin
       FROM employee_accounts ea
       JOIN employees e ON ea.employeeId = e.id
       JOIN employee_roles r ON e.roleId = r.id
       WHERE ea.isActive = 1`
  ).all();
  const candidates = [
    ...admins.map((a) => ({
      source: "admin",
      id: a.id,
      name: a.name || "Admin",
      role: a.role || "admin",
      pin: a.pin ?? null
    })),
    ...employees.map((s) => ({
      source: "employee",
      id: s.id,
      name: `${s.firstName || ""} ${s.lastName || ""}`.trim() || "Employee",
      role: s.role || "employee",
      pin: s.pin ?? null
    }))
  ].filter((c) => isApproverRole(c.role));
  const ranking = ["Owner", "super_admin", "Administrator", "Manager", "admin"];
  const byRank = (a, b) => {
    const ad = ranking.indexOf(a.role);
    const bd = ranking.indexOf(b.role);
    return (ad === -1 ? 99 : ad) - (bd === -1 ? 99 : bd);
  };
  const withPin = candidates.filter((c) => c.pin).sort(byRank);
  return withPin[0] ?? candidates.sort(byRank)[0];
}
const pending = /* @__PURE__ */ new Map();
const PROMPT_TIMEOUT_MS = 2 * 60 * 1e3;
function registerApprovalResolvers() {
  const { ipcMain } = require("electron");
  ipcMain.handle("approval:resolve", (e, payload) => {
    const p = pending.get(payload?.requestId);
    if (!p) return false;
    const pin = String(payload.pin ?? "");
    if (!p.approver?.pin || pin.length === 0) {
      pending.delete(payload.requestId);
      clearTimeout(p.timer);
      p.resolveGate("denied");
      return false;
    }
    if (p.verifier(pin, p.approver.pin)) {
      pending.delete(payload.requestId);
      clearTimeout(p.timer);
      p.resolveGate("approved");
      return true;
    }
    try {
      e.sender.send("approval:pin-invalid", { requestId: payload.requestId });
    } catch {
    }
    return false;
  });
  ipcMain.handle("approval:cancel", (_e, requestId) => {
    const p = pending.get(requestId);
    if (!p) return false;
    pending.delete(requestId);
    clearTimeout(p.timer);
    p.resolveGate("cancelled");
    return true;
  });
}
function promptForPin(webContents, ctx, approver, verifier = verifyStoredPin) {
  const requestId = crypto$1.randomUUID();
  return new Promise((resolveGate) => {
    const timer2 = setTimeout(() => {
      if (pending.has(requestId)) {
        pending.delete(requestId);
        resolveGate("cancelled");
      }
    }, PROMPT_TIMEOUT_MS);
    pending.set(requestId, { resolveGate, approver, verifier, timer: timer2 });
    const payload = { ...ctx, requestId };
    try {
      webContents.send("approval:prompt", payload);
    } catch {
      clearTimeout(timer2);
      pending.delete(requestId);
      resolveGate("denied");
    }
  });
}
function getActiveBusinessId$1() {
  const row = dbProxy.prepare("SELECT value FROM settings WHERE key = 'active_business_id'").get();
  if (row) return parseInt(row.value);
  const defaultBiz = dbProxy.prepare("SELECT id FROM businesses WHERE isDefault = 1 LIMIT 1").get();
  return defaultBiz?.id || 1;
}
function getDefaultWarehouseId$1() {
  const wh = dbProxy.prepare("SELECT id FROM warehouses WHERE isActive = 1 ORDER BY id LIMIT 1").get();
  if (wh) return wh.id;
  const anyWh = dbProxy.prepare("SELECT id FROM warehouses LIMIT 1").get();
  if (anyWh) return anyWh.id;
  const bizId = getActiveBusinessId$1();
  const res = dbProxy.prepare("INSERT INTO warehouses (businessId, name, location, managerName) VALUES (?, ?, ?, ?)").run(bizId, "Main Warehouse", "Headquarters", "Operations Manager");
  return res.lastInsertRowid;
}
function resolveId(table, nameField, nameValue, extraWhere = "", extraParams = []) {
  if (!nameValue?.trim()) return null;
  const bizId = getActiveBusinessId$1();
  const row = dbProxy.prepare(`SELECT id FROM ${table} WHERE ${nameField} = ? AND businessId = ? ${extraWhere} LIMIT 1`).get(nameValue.trim(), bizId, ...extraParams);
  return row?.id ?? null;
}
function resolveItemId(name) {
  return resolveId("items", "name", name, "AND is_deleted = 0");
}
function getOrCreateCustomer(name, phone) {
  const bizId = getActiveBusinessId$1();
  const existing = dbProxy.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(name.trim(), bizId);
  if (existing) return existing.id;
  const res = dbProxy.prepare("INSERT INTO customers (businessId, customerName, phone, groupName) VALUES (?, ?, ?, ?)").run(bizId, name.trim(), phone?.trim() || "", "general");
  return res.lastInsertRowid;
}
function resolveSupplierName(name) {
  return resolveId("suppliers", "supplierName", name, "AND isActive = 1");
}
function resolveRoleName(name) {
  const row = dbProxy.prepare("SELECT id FROM employee_roles WHERE name = ? LIMIT 1").get(name.trim());
  if (row) return row.id;
  const res = dbProxy.prepare("INSERT INTO employee_roles (name, description, permissions) VALUES (?, ?, ?)").run(name.trim(), "Imported role", "[]");
  return res.lastInsertRowid;
}
function importSales(rows) {
  const result = { success: true, imported: 0, errors: [], skipped: 0 };
  const bizId = getActiveBusinessId$1();
  const transaction = dbProxy.transaction(() => {
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
        const stmt = dbProxy.prepare(`
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
        const item = dbProxy.prepare("SELECT unitsPerPack, totalBaseQuantity FROM items WHERE id = ?").get(itemId);
        let baseDeduction = quantity;
        if (unitType === "pack") baseDeduction = quantity * (item?.unitsPerPack || 1);
        const salesItemResult = dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity - ? WHERE id = ? AND totalBaseQuantity >= ?").run(baseDeduction, itemId, baseDeduction);
        if (salesItemResult.changes === 0) throw new Error(`Insufficient stock: item "${itemName}" has less than ${baseDeduction} units available`);
        const defWhId = getDefaultWarehouseId$1();
        const whRow = dbProxy.prepare("SELECT id, quantity FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, itemId);
        if (whRow) {
          const whResult = dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND quantity >= ?").run(baseDeduction, whRow.id, baseDeduction);
          if (whResult.changes === 0) throw new Error(`Insufficient warehouse stock for item "${itemName}"`);
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
  const transaction = dbProxy.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const name = r.name?.trim();
        if (!name) {
          result.errors.push({ row: i + 1, message: "Item name is required" });
          continue;
        }
        const existing = dbProxy.prepare("SELECT id FROM items WHERE name = ? AND businessId = ? AND is_deleted = 0").get(name, bizId);
        if (existing) {
          result.skipped++;
          continue;
        }
        let categoryId = null;
        const catName = r.categoryName?.trim();
        if (catName) {
          const cat = dbProxy.prepare("SELECT id FROM categories WHERE name = ? AND businessId = ?").get(catName, bizId);
          if (cat) categoryId = cat.id;
        }
        const basePurchasePrice = parseFloat(r.basePurchasePrice) || 0;
        const baseSellingPrice = parseFloat(r.baseSellingPrice) || 0;
        dbProxy.prepare(`
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
  const transaction = dbProxy.transaction(() => {
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
        dbProxy.prepare("INSERT INTO expenses (businessId, name, amount, category, date, isRecurring, frequency, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
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
  const transaction = dbProxy.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const name = r.customerName?.trim();
        if (!name) {
          result.errors.push({ row: i + 1, message: "Customer name is required" });
          continue;
        }
        const existing = dbProxy.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(name, bizId);
        if (existing) {
          result.skipped++;
          continue;
        }
        dbProxy.prepare("INSERT INTO customers (businessId, customerName, phone, email, address, city, company, groupName, creditLimit, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
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
  const transaction = dbProxy.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const name = r.supplierName?.trim();
        if (!name) {
          result.errors.push({ row: i + 1, message: "Supplier name is required" });
          continue;
        }
        const existing = dbProxy.prepare("SELECT id FROM suppliers WHERE supplierName = ? AND businessId = ?").get(name, bizId);
        if (existing) {
          result.skipped++;
          continue;
        }
        dbProxy.prepare("INSERT INTO suppliers (businessId, supplierName, companyName, contactPerson, phone, email, address, city, paymentTerms, creditLimit, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
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
  const transaction = dbProxy.transaction(() => {
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
        dbProxy.prepare("INSERT INTO shipments (businessId, origin, destination, driverName, driverPhone, vehicleInfo, status, scheduledDate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
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
  const transaction = dbProxy.transaction(() => {
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
        dbProxy.prepare("INSERT INTO adjustments (businessId, itemId, type, oldValue, newValue, quantity, unitType, reason, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
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
          const item = dbProxy.prepare("SELECT unitsPerPack FROM items WHERE id = ?").get(itemId);
          let baseDeduction = quantity;
          if (unitType === "pack") baseDeduction = quantity * (item?.unitsPerPack || 1);
          const itemResult = dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity - ? WHERE id = ? AND totalBaseQuantity >= ?").run(baseDeduction, itemId, baseDeduction);
          if (itemResult.changes === 0) throw new Error(`Insufficient stock: item "${itemName}" has less than ${baseDeduction} units available`);
          const defWhId = getDefaultWarehouseId$1();
          const whRow = dbProxy.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, itemId);
          if (whRow) {
            const whAdjustResult = dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND quantity >= ?").run(baseDeduction, whRow.id, baseDeduction);
            if (whAdjustResult.changes === 0) throw new Error(`Insufficient warehouse stock for item "${itemName}"`);
          }
        } else if (type === "add_stock") {
          const item = dbProxy.prepare("SELECT unitsPerPack FROM items WHERE id = ?").get(itemId);
          let baseAddition = quantity;
          if (unitType === "pack") baseAddition = quantity * (item?.unitsPerPack || 1);
          dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ? WHERE id = ?").run(baseAddition, itemId);
          const defWhId = getDefaultWarehouseId$1();
          const whRow = dbProxy.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, itemId);
          if (whRow) {
            dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(baseAddition, whRow.id);
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
  const transaction = dbProxy.transaction(() => {
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
        dbProxy.prepare("INSERT INTO contacts (businessId, name, phone, category, notes) VALUES (?, ?, ?, ?, ?)").run(
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
  const transaction = dbProxy.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const name = r.name?.trim();
        if (!name) {
          result.errors.push({ row: i + 1, message: "Warehouse name is required" });
          continue;
        }
        const existing = dbProxy.prepare("SELECT id FROM warehouses WHERE name = ? AND businessId = ?").get(name, bizId);
        if (existing) {
          result.skipped++;
          continue;
        }
        dbProxy.prepare("INSERT INTO warehouses (businessId, name, location, managerName, managerPhone, email) VALUES (?, ?, ?, ?, ?, ?)").run(
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
  const transaction = dbProxy.transaction(() => {
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
        dbProxy.prepare("INSERT INTO employees (employeeCode, firstName, lastName, phone, email, roleId, department, hireDate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
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
  const transaction = dbProxy.transaction(() => {
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
        const existingPO = dbProxy.prepare("SELECT id FROM supplier_purchases WHERE purchaseNumber = ? AND businessId = ?").get(purchaseNumber, bizId);
        if (existingPO) {
          result.skipped++;
          continue;
        }
        const poResult = dbProxy.prepare("INSERT INTO supplier_purchases (businessId, supplierId, purchaseNumber, purchaseDate, totalAmount, dueDate, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
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
        dbProxy.prepare("INSERT INTO supplier_purchase_items (purchaseId, itemId, itemName, quantity, unit, unitPrice, totalPrice, receivedQuantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
          purchaseId,
          itemId,
          itemName,
          quantity,
          r.unit?.trim() || "pcs",
          unitPrice,
          totalPrice,
          quantity
        );
        const item = dbProxy.prepare("SELECT unitsPerPack FROM items WHERE id = ?").get(itemId);
        dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ? WHERE id = ?").run(quantity, itemId);
        dbProxy.prepare("UPDATE items SET lastPurchaseDate = ?, lastPurchasePrice = ? WHERE id = ?").run(purchaseDate, unitPrice, itemId);
        const defWhId = getDefaultWarehouseId$1();
        const whRow = dbProxy.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, itemId);
        if (whRow) {
          dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(quantity, whRow.id);
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
  const transaction = dbProxy.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const orderNumber = r.orderNumber?.trim();
        if (!orderNumber) {
          result.errors.push({ row: i + 1, message: "orderNumber is required" });
          continue;
        }
        const existing = dbProxy.prepare("SELECT id FROM orders WHERE orderNumber = ? AND businessId = ?").get(orderNumber, bizId);
        if (existing) {
          result.skipped++;
          continue;
        }
        const orderResult = dbProxy.prepare("INSERT INTO orders (businessId, orderNumber, customerName, customerPhone, status, totalAmount, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
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
          dbProxy.prepare("INSERT INTO order_items (orderId, itemId, itemName, quantity, unit, unitPrice, totalPrice) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
            orderId,
            itemId,
            itemName,
            quantity,
            "pcs",
            unitPrice,
            totalPrice
          );
          dbProxy.prepare("UPDATE orders SET totalAmount = totalAmount + ? WHERE id = ?").run(totalPrice, orderId);
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
function importData(module2, rows) {
  const importer = IMPORTERS[module2];
  if (!importer) return { success: false, imported: 0, errors: [{ row: 0, message: `Unknown module: ${module2}` }], skipped: 0 };
  const result = importer(rows);
  try {
    const bizId = getActiveBusinessId$1();
    const description = `CSV import of ${rows.length} ${module2} records: ${result.imported} imported, ${result.errors.length} errors, ${result.skipped} skipped`;
    dbProxy.prepare("INSERT INTO audit_logs (businessId, action, entityType, entityId, fieldName, oldValue, newValue, changedBy, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      bizId,
      "csv_import",
      module2,
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
async function gateSensitiveAction(webContents, ctx) {
  if (isApproverRole(currentUserRole)) return true;
  const approver = resolveApprover(getActiveBusinessId());
  if (!approver) return false;
  if (!approver.pin) return false;
  const result = await promptForPin(
    webContents,
    {
      context: ctx.context,
      title: ctx.title ?? "Manager approval required",
      message: ctx.message ?? "This action requires manager approval. Enter the manager PIN.",
      approverName: approver.name
    },
    approver,
    verifyStoredPin
  );
  if (result === "approved") {
    insertAuditLog("manager_approval", "approval", null, null, null, null, `${ctx.context} approved by approver ${approver.name}`);
  }
  return result === "approved";
}
async function gateDiscountOverrides(webContents, sales, message) {
  let maxPct = 0;
  let hasDiscount = false;
  for (const s of sales) {
    const discount = s.discount || 0;
    if (discount <= 0) continue;
    hasDiscount = true;
    const item = dbProxy.prepare("SELECT baseSellingPrice FROM items WHERE id = ?").get(s.itemId);
    const subtotal = item?.baseSellingPrice ? s.quantity * item.baseSellingPrice : (s.totalPrice || 0) + discount;
    const pct = subtotal > 0 ? discount / subtotal * 100 : 0;
    if (pct > maxPct) maxPct = pct;
  }
  const role = (currentUserRole || "").toLowerCase();
  const cap = getDiscountCap(role);
  if (!hasDiscount || isApproverRole(currentUserRole) || cap === null || maxPct <= cap) {
    return { requiresOverride: false, approved: true, overrideReason: "" };
  }
  const overrideReason = sales.map((s) => s.overrideReason).find((r) => r) || "Over-limit discount";
  const ok = await gateSensitiveAction(webContents, {
    context: `Discount ${Math.round(maxPct)}% exceeds your ${cap}% limit`,
    title: "Price override approval required",
    message: `This discount is above your ${cap}% role limit. Manager approval is required. Enter the manager PIN to proceed.`
  });
  return { requiresOverride: true, approved: ok, overrideReason };
}
let activeBusinessId = null;
let currentAdminId = null;
let currentUserName = null;
let currentUserRole = null;
let currentUserPermissions = [];
let currentUserBusinessId = null;
let currentUserSharedPerms = null;
const PERMISSION_MODULE = {
  dashboard: "dashboard",
  inventory: "inventory",
  purchases: "inventory",
  sales: "sales",
  orders: "sales",
  payments: "sales",
  expenses: "expenses",
  budgets: "expenses",
  customers: "customers",
  contacts: "customers",
  analytics: "analytics",
  reports: "analytics",
  adjustments: "adjustments",
  settings: "settings",
  notifications: "settings",
  employees: "employees",
  team: "employees",
  shipments: "shipments",
  suppliers: "suppliers",
  warehouses: "warehouses",
  audit: "audit",
  records: "audit"
};
function resolveSharedPermissions(roleKey, permissionsJson) {
  const base = getBuiltinRole(roleKey || "cashier");
  if (!base) return null;
  let overrides = {};
  if (permissionsJson) {
    try {
      overrides = JSON.parse(permissionsJson);
    } catch (e) {
      overrides = {};
    }
  }
  return mergePermissionSets(base.permissions, overrides);
}
function requirePermission(perm) {
  if (currentUserRole === "super_admin") return;
  if (currentUserPermissions.includes(perm) || currentUserPermissions.includes("*")) return;
  const prefix = perm.split(".")[0];
  const modulePerm = PERMISSION_MODULE[prefix] || prefix;
  const effective = new Set(
    currentUserPermissions.map((p) => PERMISSION_MODULE[p.split(".")[0]] || p)
  );
  if (effective.has(modulePerm)) return;
  throw new Error(`Permission denied: ${perm}`);
}
function hashPin(pin) {
  const salt = crypto$1.randomBytes(16).toString("hex");
  const key = crypto$1.scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${key}`;
}
function verifyPin(pin, stored) {
  const parts = stored.split(":");
  if (parts.length !== 2) {
    const legacy = crypto$1.createHash("sha256").update(pin).digest("hex");
    return legacy === stored;
  }
  const [salt, key] = parts;
  const check = crypto$1.scryptSync(pin, salt, 64).toString("hex");
  return check === key;
}
function getActiveBusinessId() {
  if (!activeBusinessId) {
    const row = dbProxy.prepare("SELECT value FROM settings WHERE key = 'active_business_id'").get();
    if (row) {
      activeBusinessId = parseInt(row.value);
    } else {
      const defaultBiz = dbProxy.prepare("SELECT id FROM businesses WHERE isDefault = 1 LIMIT 1").get();
      activeBusinessId = defaultBiz?.id || 1;
    }
  }
  const live = dbProxy.prepare("SELECT id FROM businesses WHERE id = ? AND is_deleted = 0").get(activeBusinessId);
  if (!live) {
    const first = dbProxy.prepare("SELECT id FROM businesses WHERE is_deleted = 0 ORDER BY CASE WHEN isDefault = 1 THEN 0 ELSE 1 END, id LIMIT 1").get();
    activeBusinessId = first?.id || activeBusinessId;
  }
  return activeBusinessId;
}
function setActiveBusinessId(id) {
  activeBusinessId = id;
  dbProxy.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('active_business_id', ?)").run(String(id));
}
function clearActiveBusinessCache() {
  activeBusinessId = null;
}
const DEFAULT_LIST_LIMIT = 200;
function getDefaultWarehouseId() {
  const wh = dbProxy.prepare("SELECT id FROM warehouses WHERE isActive = 1 ORDER BY id LIMIT 1").get();
  if (wh) return wh.id;
  const anyWh = dbProxy.prepare("SELECT id FROM warehouses LIMIT 1").get();
  if (anyWh) return anyWh.id;
  const bizId = getActiveBusinessId();
  const res = dbProxy.prepare("INSERT INTO warehouses (businessId, name, location, managerName) VALUES (?, ?, ?, ?)").run(bizId, "Main Warehouse", "Headquarters", "Operations Manager");
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
    insertAudit(dbProxy, {
      businessId: getActiveBusinessId(),
      action,
      entityType,
      entityId,
      fieldName,
      oldValue,
      newValue,
      changedBy: currentUserName || "unknown",
      changedById: null,
      description,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (e) {
    console.error(`[AuditLog] Failed to log ${action}:`, e);
  }
}
function registerIPCHandlers() {
  console.log("[Handlers] registerIPCHandlers called");
  registerApprovalResolvers();
  electron.ipcMain.handle("get-active-business", () => {
    const id = getActiveBusinessId();
    return dbProxy.prepare("SELECT * FROM businesses WHERE id = ?").get(id);
  });
  electron.ipcMain.handle("update-business", (_, id, biz) => {
    requirePermission("settings");
    if (!biz.businessName?.trim()) throw new Error("Business name is required");
    const stmt = dbProxy.prepare("UPDATE businesses SET businessName = ?, storeName = ?, logo = ?, address = ?, phone = ?, email = ?, currency = ? WHERE id = ?");
    return stmt.run(biz.businessName, biz.storeName, biz.logo, biz.address, biz.phone, biz.email, biz.currency, id);
  });
  electron.ipcMain.handle("business:list", () => {
    requirePermission("settings");
    const totalBiz = dbProxy.prepare("SELECT COUNT(*) c FROM businesses WHERE is_deleted = 0").get().c;
    return dbProxy.prepare(`
      SELECT b.*,
        (SELECT COUNT(*) FROM employees e WHERE e.businessId = b.id AND e.isActive = 1 AND e.is_deleted = 0) as employeeCount,
        (SELECT COUNT(*) FROM roster_devices r WHERE r.businessId = b.id AND r.is_deleted = 0) as deviceCount,
        (SELECT COUNT(*) FROM registers r WHERE r.businessId = b.id AND r.is_deleted = 0) as registerCount,
        (SELECT COUNT(*) FROM locations l WHERE l.businessId = b.id AND l.is_deleted = 0) as locationCount
      FROM businesses b
      WHERE b.is_deleted = 0
      ORDER BY CASE WHEN b.isDefault = 1 THEN 0 ELSE 1 END, b.createdAt
    `).all().map((b) => ({ ...b, totalBusinesses: totalBiz }));
  });
  electron.ipcMain.handle("business:create", (_, data) => {
    if (!data?.businessName?.trim()) throw new Error("Business name is required");
    const isFirst = dbProxy.prepare("SELECT COUNT(*) c FROM businesses WHERE is_deleted = 0").get().c === 0;
    const result = dbProxy.prepare("INSERT INTO businesses (businessName, storeName, logo, address, phone, email, currency, isDefault) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(data.businessName.trim(), data.storeName?.trim() || data.businessName.trim(), data.logo || null, data.address || null, data.phone || null, data.email || null, data.currency || "ETB", 0);
    const bizId = result.lastInsertRowid;
    const whRes = dbProxy.prepare("INSERT INTO warehouses (businessId, name, location, managerName) VALUES (?, ?, ?, ?)").run(bizId, "Main Warehouse", data.address || "Headquarters", "Operations Manager");
    const locRes = dbProxy.prepare("INSERT INTO locations (businessId, name, address) VALUES (?, ?, ?)").run(bizId, "Main Location", data.address || null);
    dbProxy.prepare("INSERT INTO registers (businessId, locationId, name, isActive) VALUES (?, ?, ?, 1)").run(bizId, locRes.lastInsertRowid, "Main Register");
    if (isFirst) {
      dbProxy.prepare("UPDATE businesses SET isDefault = 1 WHERE id = ?").run(bizId);
    }
    if (isFirst || !currentUserBusinessId) setActiveBusinessId(bizId);
    insertAuditLog("business_created", "business", bizId, "businessName", null, data.businessName.trim(), `Business "${data.businessName.trim()}" created by ${currentUserName || "unknown"} (wh #${whRes.lastInsertRowid})`);
    return dbProxy.prepare("SELECT * FROM businesses WHERE id = ?").get(bizId);
  });
  electron.ipcMain.handle("business:switch", (_, id) => {
    if (!Number.isInteger(+id)) throw new Error("Invalid business id");
    if (currentUserBusinessId && currentUserBusinessId !== +id) {
      throw new Error("You are signed in as an employee of another business and cannot switch businesses.");
    }
    const biz = dbProxy.prepare("SELECT * FROM businesses WHERE id = ? AND is_deleted = 0").get(+id);
    if (!biz) throw new Error("Business not found");
    setActiveBusinessId(+id);
    return biz;
  });
  electron.ipcMain.handle("business:set-default", (_, id) => {
    requirePermission("settings");
    if (currentUserRole !== "super_admin" && currentUserRole !== "admin") throw new Error("Only platform administrators can set the default business");
    const biz = dbProxy.prepare("SELECT id FROM businesses WHERE id = ? AND is_deleted = 0").get(+id);
    if (!biz) throw new Error("Business not found");
    dbProxy.prepare("UPDATE businesses SET isDefault = 0").run();
    dbProxy.prepare("UPDATE businesses SET isDefault = 1 WHERE id = ?").run(+id);
    insertAuditLog("business_set_default", "business", +id, "isDefault", null, "1", `Business #${id} set as default by ${currentUserName || "unknown"}`);
    return { success: true };
  });
  electron.ipcMain.handle("business:archive", (_, id) => {
    requirePermission("settings");
    const bizId = +id;
    const biz = dbProxy.prepare("SELECT * FROM businesses WHERE id = ? AND is_deleted = 0").get(bizId);
    if (!biz) throw new Error("Business not found");
    const active = getActiveBusinessId();
    if (active === bizId) throw new Error("Cannot archive the currently active business. Switch to another business first.");
    const remaining = dbProxy.prepare("SELECT COUNT(*) c FROM businesses WHERE is_deleted = 0 AND id != ?").get(bizId).c;
    if (remaining === 0) throw new Error("Cannot archive the last business.");
    if (currentUserBusinessId === bizId) throw new Error("You cannot archive the business you are signed into.");
    dbProxy.prepare("UPDATE businesses SET is_deleted = 1, is_synced = 0, row_version = row_version + 1, deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?").run(bizId);
    insertAuditLog("business_archived", "business", bizId, "is_deleted", "0", "1", `Business "${biz.businessName}" archived by ${currentUserName || "unknown"}`);
    return { success: true };
  });
  electron.ipcMain.handle("business:leave", (_, id) => {
    if (currentUserBusinessId) throw new Error("Employees cannot leave a business. Contact a platform administrator.");
    if (!currentAdminId) throw new Error("Not signed in");
    const bizId = +id;
    if (getActiveBusinessId() === bizId) throw new Error("Switch to another business before leaving this one.");
    const remaining = dbProxy.prepare("SELECT COUNT(*) c FROM businesses WHERE is_deleted = 0 AND id != ?").get(bizId).c;
    if (remaining === 0) throw new Error("Cannot leave the last business.");
    dbProxy.prepare("UPDATE businesses SET is_deleted = 1, is_synced = 0, row_version = row_version + 1, deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?").run(bizId);
    insertAuditLog("business_left", "business", bizId, "is_deleted", "0", "1", `Admin left business "${bizId}"`);
    return { success: true };
  });
  electron.ipcMain.handle("get-categories", () => {
    const bizId = getActiveBusinessId();
    return dbProxy.prepare("SELECT * FROM categories WHERE businessId = ? AND isCustom = 1 ORDER BY name").all(bizId);
  });
  electron.ipcMain.handle("insert-category", (_, name, icon) => {
    requirePermission("settings.manage");
    const bizId = getActiveBusinessId();
    const result = dbProxy.prepare("INSERT INTO categories (businessId, name, icon, isCustom) VALUES (?, ?, ?, 1)").run(bizId, name, icon || "tag");
    return result.lastInsertRowid;
  });
  electron.ipcMain.handle("delete-category", (_, id) => {
    requirePermission("settings.manage");
    const bizId = getActiveBusinessId();
    dbProxy.prepare("SELECT name FROM categories WHERE id = ?").get(id);
    dbProxy.prepare("DELETE FROM categories WHERE id = ? AND businessId = ? AND isCustom = 1").run(id, bizId);
  });
  electron.ipcMain.handle("get-items", (_, options = {}) => {
    requirePermission("inventory.view");
    const bizId = getActiveBusinessId();
    let query = "SELECT items.*, categories.name as categoryName, suppliers.supplierName FROM items LEFT JOIN categories ON items.categoryId = categories.id LEFT JOIN suppliers ON items.supplierId = suppliers.id";
    const params = [];
    const conditions = ["items.businessId = ?", "items.is_deleted = 0"];
    params.push(bizId);
    if (options.search) {
      conditions.push("(LOWER(items.name) LIKE LOWER(?) OR LOWER(items.companyName) LIKE LOWER(?))");
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
    const offset = options.offset ?? 0;
    query += " LIMIT ? OFFSET ?";
    params.push(listLimit, offset);
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-item", (_, id) => {
    requirePermission("inventory.view");
    const bizId = getActiveBusinessId();
    const item = dbProxy.prepare(`
      SELECT items.*, categories.name as categoryName, suppliers.supplierName
      FROM items
      LEFT JOIN categories ON items.categoryId = categories.id
      LEFT JOIN suppliers ON items.supplierId = suppliers.id
      WHERE items.id = ? AND items.businessId = ? AND items.is_deleted = 0
    `).get(id, bizId);
    if (!item) return null;
    const totalPurchased = dbProxy.prepare(`
      SELECT COALESCE(SUM(spi.quantity), 0) AS totalPurchasedQuantity
      FROM supplier_purchase_items spi
      JOIN supplier_purchases sp ON sp.id = spi.purchaseId
      WHERE spi.itemId = ?
    `).get(id);
    const lastPO = dbProxy.prepare(`
      SELECT sp.purchaseNumber AS lastPurchaseOrderRef, sp.purchaseDate AS lastPurchaseOrderDate
      FROM supplier_purchase_items spi
      JOIN supplier_purchases sp ON sp.id = spi.purchaseId
      WHERE spi.itemId = ?
      ORDER BY sp.purchaseDate DESC
      LIMIT 1
    `).get(id);
    return { ...item, ...totalPurchased, ...lastPO };
  });
  electron.ipcMain.handle("get-item-by-barcode", (_, code) => {
    requirePermission("inventory.view");
    const bizId = getActiveBusinessId();
    if (!code || !code.trim()) return null;
    return dbProxy.prepare(`
      SELECT items.*, categories.name as categoryName
      FROM items
      LEFT JOIN categories ON items.categoryId = categories.id
      WHERE items.businessId = ? AND items.is_deleted = 0
        AND (items.barcode = ? COLLATE NOCASE OR items.sku = ? COLLATE NOCASE)
      LIMIT 1
    `).get(bizId, code, code) || null;
  });
  electron.ipcMain.handle("insert-item", (_, item) => {
    requirePermission("inventory.add");
    if (!item.name || !item.name.trim()) throw new Error("Product name is required");
    const unitsPerPack = validatePositive(item.unitsPerPack ?? 1, "Units per pack");
    const bizId = getActiveBusinessId();
    const purchaseDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const stmt = dbProxy.prepare(`
      INSERT INTO items (
        businessId, name, categoryId, sku, barcode, companyName, purchaseUnit, baseUnit, unitsPerPack,
        totalPackQuantity, totalBaseQuantity, packPurchasePrice, basePurchasePrice,
        baseSellingPrice, packSellingPrice, allowSellByBaseUnit, allowSellByPackUnit,
        expiryDate, qualityGrade, notes, isCredit, supplierPhone, supplierId,
        reorderPoint, reorderQty, autoReorder, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const newBaseQty = item.totalBaseQuantity || 0;
    const newPackQty = item.totalPackQuantity || 0;
    const result = stmt.run(
      bizId,
      item.name,
      item.categoryId || null,
      item.sku || null,
      item.barcode || null,
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
      item.supplierId || null,
      item.reorderPoint ?? 10,
      item.reorderQty ?? 0,
      item.autoReorder ? 1 : 0,
      purchaseDate
    );
    const newId = result.lastInsertRowid;
    if (item.supplierId && newBaseQty > 0) {
      try {
        const purchaseNumber = `PO-${Date.now().toString().slice(-8)}`;
        const unitPrice = item.basePurchasePrice || item.baseSellingPrice || 0;
        const totalAmount = unitPrice * newBaseQty;
        const paidAmount = item.isCredit ? 0 : totalAmount;
        const status = item.isCredit ? "pending" : "received";
        dbProxy.prepare(`
          INSERT INTO supplier_purchases (
            businessId, supplierId, purchaseNumber, purchaseDate,
            totalAmount, paidAmount, dueDate, status, notes, createdBy
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          bizId,
          item.supplierId,
          purchaseNumber,
          purchaseDate,
          totalAmount,
          paidAmount,
          item.expiryDate || null,
          status,
          `Auto-created from inventory item "${item.name}"`,
          currentUserName || "system"
        );
        const purchaseId = dbProxy.prepare("SELECT last_insert_rowid() AS id").get();
        dbProxy.prepare(`
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
    requirePermission("inventory.edit");
    if (!item.name || !item.name.trim()) throw new Error("Product name is required");
    const unitsPerPack = validatePositive(item.unitsPerPack ?? 1, "Units per pack");
    const bizId = getActiveBusinessId();
    const result = dbProxy.transaction(() => {
      const stmt = dbProxy.prepare(`
        UPDATE items SET
          name = ?, categoryId = ?, sku = ?, barcode = ?, companyName = ?, purchaseUnit = ?, baseUnit = ?, unitsPerPack = ?,
          totalPackQuantity = ?, totalBaseQuantity = ?, packPurchasePrice = ?, basePurchasePrice = ?,
          baseSellingPrice = ?, packSellingPrice = ?, allowSellByBaseUnit = ?, allowSellByPackUnit = ?,
          expiryDate = ?, qualityGrade = ?, notes = ?, isCredit = ?, supplierPhone = ?,
          supplierId = ?, reorderPoint = ?, reorderQty = ?, autoReorder = ?
        WHERE id = ? AND businessId = ?
      `);
      const result2 = stmt.run(
        item.name,
        item.categoryId || null,
        item.sku || null,
        item.barcode || null,
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
        item.reorderPoint ?? 10,
        item.reorderQty ?? 0,
        item.autoReorder ? 1 : 0,
        id,
        bizId
      );
      return result2;
    })();
    return result;
  });
  electron.ipcMain.handle("delete-item", (_, id) => {
    requirePermission("inventory.delete");
    dbProxy.prepare("SELECT name FROM items WHERE id = ?").get(id);
    dbProxy.prepare("UPDATE items SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?").run(currentUserName || "unknown", id);
    return { success: true };
  });
  electron.ipcMain.handle("get-low-stock-items", () => {
    requirePermission("inventory.view");
    const bizId = getActiveBusinessId();
    return dbProxy.prepare("SELECT items.*, suppliers.supplierName, suppliers.id as linkedSupplierId FROM items LEFT JOIN suppliers ON items.supplierId = suppliers.id WHERE items.totalBaseQuantity < COALESCE(items.reorderPoint, 10) AND items.businessId = ? ORDER BY items.totalBaseQuantity ASC LIMIT ?").all(bizId, DEFAULT_LIST_LIMIT);
  });
  electron.ipcMain.handle("get-reorder-suggestions", () => {
    requirePermission("inventory.view");
    const bizId = getActiveBusinessId();
    return dbProxy.prepare(`
      SELECT items.*, suppliers.supplierName, suppliers.id as linkedSupplierId,
             COALESCE(items.reorderPoint, 10) as reorderPoint,
             MAX(COALESCE(items.reorderQty, 0), COALESCE(items.reorderPoint, 10) - items.totalBaseQuantity) as suggestedQty
      FROM items
      LEFT JOIN suppliers ON items.supplierId = suppliers.id
      WHERE items.businessId = ?
        AND items.is_deleted = 0
        AND items.totalBaseQuantity < COALESCE(items.reorderPoint, 10)
      ORDER BY (items.totalBaseQuantity - COALESCE(items.reorderPoint, 10)) ASC
      LIMIT ?
    `).all(bizId, DEFAULT_LIST_LIMIT);
  });
  electron.ipcMain.handle("get-expiring-items", () => {
    requirePermission("inventory.view");
    const bizId = getActiveBusinessId();
    const thirtyDaysFromNow = /* @__PURE__ */ new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return dbProxy.prepare("SELECT items.*, suppliers.supplierName, suppliers.id as linkedSupplierId FROM items LEFT JOIN suppliers ON items.supplierId = suppliers.id WHERE items.expiryDate IS NOT NULL AND items.expiryDate <= ? AND items.businessId = ? ORDER BY items.expiryDate ASC LIMIT ?").all(thirtyDaysFromNow.toISOString().split("T")[0], bizId, DEFAULT_LIST_LIMIT);
  });
  electron.ipcMain.handle("get-items-by-supplier", (_, supplierId) => {
    requirePermission("inventory.view");
    const bizId = getActiveBusinessId();
    return dbProxy.prepare(`
      SELECT items.*, categories.name as categoryName, suppliers.supplierName
      FROM items
      LEFT JOIN categories ON items.categoryId = categories.id
      LEFT JOIN suppliers ON items.supplierId = suppliers.id
      WHERE items.supplierId = ? AND items.businessId = ? AND items.is_deleted = 0
      ORDER BY items.name ASC
    `).all(supplierId, bizId);
  });
  electron.ipcMain.handle("restock-item", (_, id, quantity) => {
    requirePermission("inventory.adjust");
    const bizId = getActiveBusinessId();
    const item = dbProxy.prepare("SELECT name, unitsPerPack FROM items WHERE id = ? AND businessId = ?").get(id, bizId);
    if (!item) throw new Error("Item not found");
    const qty = validatePositive(quantity, "Restock quantity");
    const packQty = Math.round(qty / (item.unitsPerPack || 1) * 1e6) / 1e6;
    dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, totalPackQuantity = totalPackQuantity + ? WHERE id = ?").run(qty, packQty, id);
    const defWhId = getDefaultWarehouseId();
    const whRow = dbProxy.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, id);
    if (whRow) {
      dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(qty, whRow.id);
    } else {
      dbProxy.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, id, qty);
    }
    dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, id, "restock_in", qty, "restock", `Restocked ${qty} ${item.name}`);
    return { success: true };
  });
  electron.ipcMain.handle("get-sales", (_, options = {}) => {
    requirePermission("sales.view");
    const bizId = getActiveBusinessId();
    let query = "SELECT sales.*, items.name as itemName, items.basePurchasePrice, items.unitsPerPack, categories.name as categoryName FROM sales LEFT JOIN items ON sales.itemId = items.id LEFT JOIN categories ON items.categoryId = categories.id";
    const params = [];
    const conditions = ["sales.businessId = ?"];
    params.push(bizId);
    if (options.search) {
      conditions.push("(LOWER(items.name) LIKE LOWER(?) OR LOWER(sales.customerName) LIKE LOWER(?))");
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
    const offset = options.offset ?? 0;
    query += " LIMIT ? OFFSET ?";
    params.push(listLimit, offset);
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-sale", (_, id) => {
    requirePermission("sales.view");
    return dbProxy.prepare("SELECT sales.*, items.name as itemName FROM sales LEFT JOIN items ON sales.itemId = items.id WHERE sales.id = ?").get(id);
  });
  electron.ipcMain.handle("insert-sales-batch", async (event, sales) => {
    requirePermission("sales.create");
    const overrideReason = (sales || []).map((s) => s?.overrideReason).find((r) => !!r);
    const gate = await gateDiscountOverrides(event.sender, sales || []);
    if (gate.requiresOverride && !gate.approved) {
      throw new Error("Manager approval required — discount over your limit was not approved");
    }
    sales = validate(saleBatchSchema, sales, "sales batch");
    const bizId = getActiveBusinessId();
    const transaction = dbProxy.transaction(() => {
      const results = [];
      for (const sale of sales) {
        const item = dbProxy.prepare("SELECT * FROM items WHERE id = ?").get(sale.itemId);
        if (!item) throw new Error(`Item ${sale.itemId} not found`);
        const qty = validatePositive(sale.quantity, "Sale quantity");
        sale.quantity = qty;
        const stmt = dbProxy.prepare(`
          INSERT INTO sales (
            businessId, itemId, quantity, unit, unitType, discount, vat, totalPrice, 
            paymentMethod, paymentStatus, customerName, customerPhone, packId, dueDate, paidAmount,
            overrideBy, overrideReason
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          sale.paidAmount || 0,
          gate.requiresOverride && gate.approved ? currentUserName || "unknown" : null,
          gate.requiresOverride && gate.approved ? gate.overrideReason || overrideReason : null
        );
        const cName = sale.customerName?.trim();
        if (cName && sale.paymentStatus === "Debt") {
          const exists = dbProxy.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(cName, bizId);
          if (!exists) {
            dbProxy.prepare(`INSERT INTO customers (businessId, customerName, phone, groupName) VALUES (?, ?, ?, ?)`).run(bizId, cName, sale.customerPhone?.trim() || "", "general");
          }
        }
        let baseDeduction = sale.quantity;
        let packDeduction = 0;
        if (sale.unitType === "pack") {
          baseDeduction = sale.quantity * (item.unitsPerPack || 1);
          packDeduction = sale.quantity;
        } else {
          packDeduction = Math.round(sale.quantity / (item.unitsPerPack || 1) * 1e6) / 1e6;
        }
        dbProxy.prepare("UPDATE sales SET costAtTimeOfSale = ? WHERE id = ?").run((item.basePurchasePrice || 0) * baseDeduction, result.lastInsertRowid);
        const itemResult = dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity - ?, totalPackQuantity = totalPackQuantity - ? WHERE id = ? AND totalBaseQuantity >= ?").run(baseDeduction, packDeduction, sale.itemId, baseDeduction);
        if (itemResult.changes === 0) throw new Error(`Insufficient stock: ${item.name} has less than ${baseDeduction} units available`);
        const defWhId = getDefaultWarehouseId();
        const whResult = dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE warehouseId = ? AND itemId = ? AND quantity >= ?").run(baseDeduction, defWhId, sale.itemId, baseDeduction);
        if (whResult.changes === 0) {
          const whExists = dbProxy.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, sale.itemId);
          if (!whExists) {
            dbProxy.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, sale.itemId, -baseDeduction);
          } else {
            throw new Error(`Insufficient stock at warehouse: ${item.name} has less than ${baseDeduction} units available`);
          }
        }
        dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, sale.itemId, "sale_out", baseDeduction, "sale", `Sale batch #${result.lastInsertRowid}`);
        results.push(result.lastInsertRowid);
      }
      return results;
    });
    return transaction();
  });
  electron.ipcMain.handle("insert-sale", (_, sale) => {
    requirePermission("sales.create");
    sale = validate(saleSchema, sale, "sale");
    const bizId = getActiveBusinessId();
    const item = dbProxy.prepare("SELECT * FROM items WHERE id = ?").get(sale.itemId);
    if (!item) throw new Error(`Item ${sale.itemId} not found`);
    const qty = validatePositive(sale.quantity, "Sale quantity");
    sale.quantity = qty;
    const transaction = dbProxy.transaction(() => {
      const stmt = dbProxy.prepare(`
        INSERT INTO sales (
          businessId, itemId, quantity, unit, unitType, discount, vat, totalPrice, 
          paymentMethod, paymentStatus, customerName, customerPhone, packId, dueDate, paidAmount, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        sale.paidAmount || 0,
        currentUserName || null
      );
      const cName = sale.customerName?.trim();
      if (cName && sale.paymentStatus === "Debt") {
        const exists = dbProxy.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(cName, bizId);
        if (!exists) {
          dbProxy.prepare(`INSERT INTO customers (businessId, customerName, phone, groupName) VALUES (?, ?, ?, ?)`).run(bizId, cName, sale.customerPhone?.trim() || "", "general");
        }
      }
      let baseDeduction = sale.quantity;
      let packDeduction = 0;
      if (sale.unitType === "pack") {
        baseDeduction = sale.quantity * (item.unitsPerPack || 1);
        packDeduction = sale.quantity;
      } else {
        packDeduction = Math.round(sale.quantity / (item.unitsPerPack || 1) * 1e6) / 1e6;
      }
      const costAtTimeOfSale = (item.basePurchasePrice || 0) * baseDeduction;
      dbProxy.prepare("UPDATE sales SET costAtTimeOfSale = ? WHERE id = ?").run(costAtTimeOfSale, result.lastInsertRowid);
      const fiscalMode = dbProxy.prepare("SELECT value FROM settings WHERE key = 'fiscal_mode'").get();
      if (fiscalMode && fiscalMode.value === "true" && fiscalAdapter.isAvailable()) {
        const sig = fiscalAdapter.signReceipt({ serial: result.lastInsertRowid, total: sale.totalPrice, date: (/* @__PURE__ */ new Date()).toISOString() });
        dbProxy.prepare("UPDATE sales SET fiscal_number = ?, fiscal_signature = ? WHERE id = ?").run(sig.fiscalNumber, sig.signature, result.lastInsertRowid);
      }
      const itemResult = dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity - ?, totalPackQuantity = totalPackQuantity - ? WHERE id = ? AND totalBaseQuantity >= ?").run(baseDeduction, packDeduction, sale.itemId, baseDeduction);
      if (itemResult.changes === 0) throw new Error(`Insufficient stock: ${item.name} has less than ${baseDeduction} units available`);
      const defWhId = getDefaultWarehouseId();
      const whResult = dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE warehouseId = ? AND itemId = ? AND quantity >= ?").run(baseDeduction, defWhId, sale.itemId, baseDeduction);
      if (whResult.changes === 0) {
        const whExists = dbProxy.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, sale.itemId);
        if (!whExists) {
          dbProxy.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, sale.itemId, -baseDeduction);
        } else {
          throw new Error(`Insufficient stock at warehouse: ${item.name} has less than ${baseDeduction} units available`);
        }
      }
      dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, sale.itemId, "sale_out", baseDeduction, "sale", `Sale #${result.lastInsertRowid}`);
      const saleId = result.lastInsertRowid;
      return saleId;
    });
    return transaction();
  });
  electron.ipcMain.handle("update-sale", (_, id, sale) => {
    requirePermission("sales.edit");
    sale = validate(saleUpdateSchema, sale, "sale update");
    const bizId = getActiveBusinessId();
    const original = dbProxy.prepare("SELECT * FROM sales WHERE id = ? AND businessId = ?").get(id, bizId);
    if (!original) throw new Error("Sale not found");
    const item = dbProxy.prepare("SELECT * FROM items WHERE id = ?").get(sale.itemId || original.itemId);
    if (!item) throw new Error("Item not found");
    const transaction = dbProxy.transaction(() => {
      const qtyDiff = (sale.quantity || original.quantity) - original.quantity;
      if (qtyDiff !== 0) {
        let baseDiff = Math.abs(qtyDiff);
        let packDiff = 0;
        const unitType = sale.unitType || original.unitType;
        if (unitType === "pack") {
          baseDiff = Math.abs(qtyDiff) * (item.unitsPerPack || 1);
          packDiff = Math.abs(qtyDiff);
        } else {
          packDiff = Math.round(Math.abs(qtyDiff) / (item.unitsPerPack || 1) * 1e6) / 1e6;
        }
        if (qtyDiff > 0) {
          const itemResult = dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity - ?, totalPackQuantity = totalPackQuantity - ? WHERE id = ? AND totalBaseQuantity >= ?").run(baseDiff, packDiff, sale.itemId || original.itemId, baseDiff);
          if (itemResult.changes === 0) throw new Error(`Insufficient stock: ${item.name} has less than ${baseDiff} units available`);
          const defWhId = getDefaultWarehouseId();
          const whExists = dbProxy.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, sale.itemId || original.itemId);
          if (whExists) {
            const whResult = dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND quantity >= ?").run(baseDiff, whExists.id, baseDiff);
            if (whResult.changes === 0) throw new Error(`Insufficient stock at warehouse: ${item.name} has less than ${baseDiff} units available`);
          }
        } else {
          dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, totalPackQuantity = totalPackQuantity + ? WHERE id = ?").run(baseDiff, packDiff, sale.itemId || original.itemId);
          const defWhId = getDefaultWarehouseId();
          const whRow = dbProxy.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, sale.itemId || original.itemId);
          if (whRow) {
            dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(baseDiff, whRow.id);
          } else {
            dbProxy.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, sale.itemId || original.itemId, baseDiff);
          }
        }
      }
      const newQty = sale.quantity || original.quantity;
      const newUnitType = sale.unitType || original.unitType;
      const baseDeduction = newUnitType === "pack" ? newQty * (item.unitsPerPack || 1) : newQty;
      const costAtTimeOfSale = (item.basePurchasePrice || 0) * baseDeduction;
      dbProxy.prepare(`
        UPDATE sales SET
          quantity = ?, unit = ?, unitType = ?, discount = ?, vat = ?, totalPrice = ?,
          paymentMethod = ?, paymentStatus = ?, customerName = ?, customerPhone = ?,
          dueDate = ?, paidAmount = ?, costAtTimeOfSale = ?
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
        costAtTimeOfSale,
        id,
        bizId
      );
    });
    transaction();
    return { success: true };
  });
  electron.ipcMain.handle("delete-sale", (_, id) => {
    requirePermission("sales.cancel");
    const sale = dbProxy.prepare("SELECT * FROM sales WHERE id = ?").get(id);
    if (!sale) return { success: false };
    const item = dbProxy.prepare("SELECT * FROM items WHERE id = ?").get(sale.itemId);
    const transaction = dbProxy.transaction(() => {
      if (item) {
        let baseRestore = sale.quantity;
        let packRestore = 0;
        if (sale.unitType === "pack") {
          baseRestore = sale.quantity * (item.unitsPerPack || 1);
          packRestore = sale.quantity;
        } else {
          packRestore = Math.round(sale.quantity / (item.unitsPerPack || 1) * 1e6) / 1e6;
        }
        dbProxy.prepare(`
          UPDATE items 
          SET totalBaseQuantity = totalBaseQuantity + ?,
              totalPackQuantity = totalPackQuantity + ?
          WHERE id = ?
        `).run(baseRestore, packRestore, sale.itemId);
        const defWhId = getDefaultWarehouseId();
        const whRow = dbProxy.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, sale.itemId);
        if (whRow) {
          dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(baseRestore, whRow.id);
        } else {
          dbProxy.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, sale.itemId, baseRestore);
        }
        dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, sale.itemId, "sale_restore", baseRestore, "sale", `Sale #${id} deleted — stock restored`);
      }
      dbProxy.prepare("DELETE FROM returns WHERE saleId = ?").run(id);
      dbProxy.prepare("DELETE FROM sales WHERE id = ?").run(id);
    });
    transaction();
    return { success: true };
  });
  electron.ipcMain.handle("create-return", async (event, data) => {
    requirePermission("sales.returns");
    const reason = (data?.reason || "").trim();
    if (!reason) return { success: false, error: "A reason is required to process a return" };
    if (!await gateSensitiveAction(event.sender, { context: `Process return for sale #${data?.saleId ?? ""}` })) {
      return { success: false, error: "Manager approval required — action not executed" };
    }
    const bizId = getActiveBusinessId();
    const sale = dbProxy.prepare("SELECT * FROM sales WHERE id = ?").get(data.saleId);
    if (!sale) return { success: false, error: "Sale not found" };
    if (sale.businessId !== bizId) return { success: false, error: "Unauthorized" };
    const item = dbProxy.prepare("SELECT * FROM items WHERE id = ?").get(sale.itemId);
    if (!item) return { success: false, error: "Item not found" };
    const returnQty = validatePositive(data.quantity, "Return quantity");
    if (returnQty > sale.quantity) return { success: false, error: "Return quantity exceeds original sale quantity" };
    const transaction = dbProxy.transaction(() => {
      let baseRestore = returnQty;
      let packRestore = 0;
      if (sale.unitType === "pack") {
        baseRestore = returnQty * (item.unitsPerPack || 1);
        packRestore = returnQty;
      } else {
        packRestore = Math.round(returnQty / (item.unitsPerPack || 1) * 1e6) / 1e6;
      }
      dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, totalPackQuantity = totalPackQuantity + ? WHERE id = ?").run(baseRestore, packRestore, sale.itemId);
      const originalMovement = dbProxy.prepare("SELECT warehouseId, quantity FROM stock_movements WHERE referenceType = 'sale' AND referenceId = ? AND type = 'sale_out' ORDER BY createdAt DESC LIMIT 1").get(data.saleId);
      const warehouseId = originalMovement?.warehouseId || getDefaultWarehouseId();
      const whRow = dbProxy.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(warehouseId, sale.itemId);
      if (whRow) {
        dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(baseRestore, whRow.id);
      } else {
        dbProxy.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(warehouseId, sale.itemId, baseRestore);
      }
      dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(warehouseId, sale.itemId, "return_in", baseRestore, "return", `Return for sale #${sale.id}`);
      const result = dbProxy.prepare(`
        INSERT INTO returns (businessId, saleId, itemId, quantity, unit, unitType, refundAmount, reason, createdBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(bizId, sale.id, sale.itemId, returnQty, sale.unit, sale.unitType, data.refundAmount || 0, data.reason || "", data.createdBy || null);
      const priceReduction = returnQty * (sale.totalPrice / sale.quantity);
      const paidReduction = Math.min(sale.paidAmount || 0, data.refundAmount || 0);
      dbProxy.prepare(`
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
    requirePermission("sales.view");
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
    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options?.offset ?? 0;
    query += " ORDER BY r.createdAt DESC LIMIT ? OFFSET ?";
    params.push(listLimit, offset);
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-debt-sales", () => {
    requirePermission("sales.view");
    const bizId = getActiveBusinessId();
    return dbProxy.prepare("SELECT sales.*, items.name as itemName FROM sales LEFT JOIN items ON sales.itemId = items.id WHERE sales.paymentStatus = ? AND sales.businessId = ? ORDER BY sales.dueDate ASC LIMIT ?").all("Debt", bizId, DEFAULT_LIST_LIMIT);
  });
  electron.ipcMain.handle("pay-debt", (_, saleId, amount, options) => {
    requirePermission("payments.pay");
    const { saleId: vSaleId, amount: vAmount, type, note } = validate(payDebtSchema, { saleId, amount, ...options }, "debt payment");
    const sale = dbProxy.prepare("SELECT * FROM sales WHERE id = ?").get(vSaleId);
    if (!sale) throw new Error("Sale not found");
    const recordType = type || "payment";
    const newPaid = (sale.paidAmount || 0) + vAmount;
    const newStatus = newPaid >= sale.totalPrice ? "Paid" : "Debt";
    const result = dbProxy.prepare("UPDATE sales SET paidAmount = ?, paymentStatus = ? WHERE id = ?").run(newPaid, newStatus, vSaleId);
    dbProxy.prepare("INSERT INTO debt_payments (saleId, customerName, customerPhone, amount, type, note) VALUES (?, ?, ?, ?, ?, ?)").run(vSaleId, sale.customerName || null, sale.customerPhone || null, vAmount, recordType, note || null);
    return result;
  });
  electron.ipcMain.handle("get-debt-payments", (_, saleId) => {
    return dbProxy.prepare("SELECT * FROM debt_payments WHERE saleId = ? ORDER BY createdAt DESC").all(saleId);
  });
  electron.ipcMain.handle("get-expenses", (_, options = {}) => {
    requirePermission("expenses.view");
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
    const offset = options.offset ?? 0;
    query += " LIMIT ? OFFSET ?";
    params.push(listLimit, offset);
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("insert-expense", (_, expense) => {
    requirePermission("expenses.add");
    const bizId = getActiveBusinessId();
    const result = dbProxy.prepare("INSERT INTO expenses (businessId, name, amount, category, date, isRecurring, frequency, nextBillingDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
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
      const budget = dbProxy.prepare("SELECT id, amount FROM budgets WHERE businessId = ? AND category = ? AND (month = ? OR month IS NULL) AND (year = ? OR year IS NULL)").get(bizId, expense.category, month, year);
      if (budget && budget.amount > 0) {
        const spentRow = dbProxy.prepare("SELECT SUM(amount) as total FROM expenses WHERE businessId = ? AND category = ? AND date >= ? AND date <= ? AND is_deleted = 0").get(bizId, expense.category, startDate, endDate);
        const totalSpent = spentRow?.total || 0;
        const usagePercent = totalSpent / budget.amount * 100;
        if (totalSpent >= budget.amount) {
          const existingAlert = dbProxy.prepare("SELECT id FROM budget_alerts WHERE businessId = ? AND category = ? AND alertType = ? AND month = ? AND year = ?").get(bizId, expense.category, "budget_exceeded", month, year);
          if (!existingAlert) {
            dbProxy.prepare("INSERT INTO budget_alerts (businessId, category, alertType, threshold, message, month, year) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
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
          const existingAlert = dbProxy.prepare("SELECT id FROM budget_alerts WHERE businessId = ? AND category = ? AND alertType = ? AND month = ? AND year = ?").get(bizId, expense.category, "budget_warning", month, year);
          if (!existingAlert) {
            dbProxy.prepare("INSERT INTO budget_alerts (businessId, category, alertType, threshold, message, month, year) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
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
    requirePermission("expenses.add");
    const result = dbProxy.prepare("UPDATE expenses SET name = ?, amount = ?, category = ?, date = ?, isRecurring = ?, frequency = ?, nextBillingDate = ? WHERE id = ?").run(
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
    requirePermission("expenses.delete");
    dbProxy.prepare("SELECT name FROM expenses WHERE id = ?").get(id);
    dbProxy.prepare("DELETE FROM expenses WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("get-adjustments", (_, options = {}) => {
    requirePermission("inventory.view");
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
    const offset = options.offset ?? 0;
    query += " LIMIT ? OFFSET ?";
    params.push(listLimit, offset);
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("insert-adjustment", async (event, adjustment) => {
    requirePermission("inventory.adjust");
    if (!await gateSensitiveAction(event.sender, { context: `Stock/price adjustment (${adjustment?.type ?? "unknown"})` })) {
      throw new Error("Manager approval required — action not executed");
    }
    const validTypes = ["damage", "loss", "add_stock", "price_increase", "price_decrease"];
    if (!validTypes.includes(adjustment.type)) throw new Error(`Invalid adjustment type: ${adjustment.type}`);
    if (["damage", "loss", "add_stock"].includes(adjustment.type)) {
      validatePositive(adjustment.quantity, "Adjustment quantity");
    }
    const bizId = getActiveBusinessId();
    const transaction = dbProxy.transaction(() => {
      const result = dbProxy.prepare("INSERT INTO adjustments (businessId, itemId, type, oldValue, newValue, quantity, unitType, reason, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
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
        const adjResult = dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity - ? WHERE id = ? AND totalBaseQuantity >= ?").run(adjustment.quantity, adjustment.itemId, adjustment.quantity);
        if (adjResult.changes === 0) throw new Error(`Insufficient stock for damage adjustment: item has less than ${adjustment.quantity} units`);
        invDelta = -adjustment.quantity;
      }
      if (adjustment.type === "loss" && adjustment.quantity) {
        const adjResult = dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity - ? WHERE id = ? AND totalBaseQuantity >= ?").run(adjustment.quantity, adjustment.itemId, adjustment.quantity);
        if (adjResult.changes === 0) throw new Error(`Insufficient stock for loss adjustment: item has less than ${adjustment.quantity} units`);
        invDelta = -adjustment.quantity;
      }
      if (adjustment.type === "add_stock" && adjustment.quantity) {
        dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ? WHERE id = ?").run(adjustment.quantity, adjustment.itemId);
        invDelta = adjustment.quantity;
      }
      if (invDelta !== 0) {
        const defWhId = getDefaultWarehouseId();
        const whRow = dbProxy.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, adjustment.itemId);
        if (whRow) {
          dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(invDelta, whRow.id);
        } else if (invDelta > 0) {
          dbProxy.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, adjustment.itemId, invDelta);
        }
        dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, adjustment.itemId, `adj_${adjustment.type}`, Math.abs(invDelta), "adjustment", adjustment.reason || null);
      }
      if (adjustment.type === "price_increase" || adjustment.type === "price_decrease") {
        if (adjustment.unitType === "base") {
          dbProxy.prepare("UPDATE items SET baseSellingPrice = ? WHERE id = ?").run(adjustment.newValue, adjustment.itemId);
        } else {
          dbProxy.prepare("UPDATE items SET packSellingPrice = ? WHERE id = ?").run(adjustment.newValue, adjustment.itemId);
        }
      }
      const adjustmentId = result.lastInsertRowid;
      dbProxy.prepare("SELECT name FROM items WHERE id = ?").get(adjustment.itemId);
      adjustment.type.replace("_", " ");
      return adjustmentId;
    });
    return transaction();
  });
  electron.ipcMain.handle("check-notifications", () => {
    const bizId = getActiveBusinessId();
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const notifications = [];
    const prefRow = dbProxy.prepare("SELECT value FROM settings WHERE key = 'notification_preferences'").get();
    const prefs = prefRow ? JSON.parse(prefRow.value) : {
      inventory_alerts: true,
      debt_alerts: true,
      expiry_alerts: true
    };
    if (prefs.debt_alerts) {
      const overdueDebts = dbProxy.prepare(`
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
      const dueToday = dbProxy.prepare(`
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
      const lowStockItems = dbProxy.prepare(
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
      const outOfStock = dbProxy.prepare(
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
      const expiringItems = dbProxy.prepare(
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
    const insertStmt = dbProxy.prepare(`
      INSERT INTO notifications (businessId, title, message, type, category, severity, actionUrl, actionLabel, entityType, entityId, channels, requiresAction)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const existsStmt = dbProxy.prepare(
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
      query += " AND (LOWER(title) LIKE LOWER(?) OR LOWER(message) LIKE LOWER(?))";
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
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-unread-notification-count", () => {
    const bizId = getActiveBusinessId();
    const row = dbProxy.prepare(`
      SELECT COUNT(*) AS c FROM notifications
      WHERE businessId = ? AND isRead = 0 AND isDismissed = 0
        AND (snoozedUntil IS NULL OR snoozedUntil <= CURRENT_TIMESTAMP)
        AND (expiresAt IS NULL OR expiresAt > CURRENT_TIMESTAMP)
    `).get(bizId);
    return row?.c || 0;
  });
  electron.ipcMain.handle("get-notification-categories", () => {
    const bizId = getActiveBusinessId();
    const rows = dbProxy.prepare(`
      SELECT category, COUNT(*) AS total, SUM(CASE WHEN isRead = 0 THEN 1 ELSE 0 END) AS unread
      FROM notifications WHERE businessId = ? AND isDismissed = 0
        AND (snoozedUntil IS NULL OR snoozedUntil <= CURRENT_TIMESTAMP)
        AND (expiresAt IS NULL OR expiresAt > CURRENT_TIMESTAMP)
      GROUP BY category
    `).all(bizId);
    return rows;
  });
  electron.ipcMain.handle("insert-notification", (_, notification) => {
    requirePermission("settings.manage");
    const bizId = getActiveBusinessId();
    return dbProxy.prepare(`
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
    return dbProxy.prepare("UPDATE notifications SET isRead = 1 WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("mark-all-notifications-read", () => {
    const bizId = getActiveBusinessId();
    return dbProxy.prepare("UPDATE notifications SET isRead = 1 WHERE businessId = ?").run(bizId);
  });
  electron.ipcMain.handle("dismiss-notification", (_, id) => {
    return dbProxy.prepare("UPDATE notifications SET isDismissed = 1, isRead = 1 WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("snooze-notification", (_, id, untilIso) => {
    return dbProxy.prepare("UPDATE notifications SET snoozedUntil = ? WHERE id = ?").run(untilIso, id);
  });
  electron.ipcMain.handle("clear-notifications", (_, options = {}) => {
    requirePermission("notifications.manage");
    const bizId = getActiveBusinessId();
    if (options.olderThanDays) {
      return dbProxy.prepare(`DELETE FROM notifications WHERE businessId = ? AND createdAt < datetime('now', '-' || ? || ' days')`).run(bizId, options.olderThanDays);
    }
    if (options.category) {
      return dbProxy.prepare("DELETE FROM notifications WHERE businessId = ? AND category = ?").run(bizId, options.category);
    }
    return dbProxy.prepare("DELETE FROM notifications WHERE businessId = ?").run(bizId);
  });
  electron.ipcMain.handle("get-notification-preferences", () => {
    return dbProxy.prepare("SELECT * FROM notification_preferences ORDER BY key").all();
  });
  electron.ipcMain.handle("update-notification-preference", (_, key, prefs) => {
    const existing = dbProxy.prepare("SELECT key FROM notification_preferences WHERE key = ?").get(key);
    if (!existing) {
      dbProxy.prepare(`
        INSERT INTO notification_preferences (key, enabled, sound, desktop, email, inApp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(key, prefs.enabled ?? 1, prefs.sound ?? 0, prefs.desktop ?? 0, prefs.email ?? 0, prefs.inApp ?? 1);
    } else {
      dbProxy.prepare(`
        UPDATE notification_preferences SET
          enabled = ?, sound = ?, desktop = ?, email = ?, inApp = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE key = ?
      `).run(prefs.enabled ?? 1, prefs.sound ?? 0, prefs.desktop ?? 0, prefs.email ?? 0, prefs.inApp ?? 1, key);
    }
    return { success: true };
  });
  electron.ipcMain.handle("get-active-banners", () => {
    const bizId = getActiveBusinessId();
    return dbProxy.prepare(`
      SELECT * FROM notification_banners
      WHERE businessId = ? AND dismissedAt IS NULL
        AND (endsAt IS NULL OR endsAt > CURRENT_TIMESTAMP)
        AND startsAt <= CURRENT_TIMESTAMP
      ORDER BY createdAt DESC
    `).all(bizId);
  });
  electron.ipcMain.handle("dismiss-banner", (_, id) => {
    return dbProxy.prepare("UPDATE notification_banners SET dismissedAt = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("create-banner", (_, data) => {
    requirePermission("settings.manage");
    const bizId = getActiveBusinessId();
    return dbProxy.prepare(`
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
    q += " ORDER BY triggerDate ASC LIMIT ? OFFSET ?";
    params.push(options.limit ?? DEFAULT_LIST_LIMIT, options.offset ?? 0);
    return dbProxy.prepare(q).all(...params);
  });
  electron.ipcMain.handle("create-reminder", (_, data) => {
    requirePermission("settings.manage");
    const bizId = getActiveBusinessId();
    if (!data.title || !data.triggerDate) throw new Error("title, triggerDate are required");
    const category = data.category || "general";
    return dbProxy.prepare(`
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
    return dbProxy.prepare(`UPDATE notification_reminders SET ${fields.join(", ")} WHERE id = ?`).run(...params);
  });
  electron.ipcMain.handle("snooze-reminder", (_, id, untilIso) => {
    return dbProxy.prepare("UPDATE notification_reminders SET snoozedUntil = ?, status = 'snoozed' WHERE id = ?").run(untilIso, id);
  });
  electron.ipcMain.handle("complete-reminder", (_, id) => {
    return dbProxy.prepare(`UPDATE notification_reminders SET status = 'completed', completedAt = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
  });
  electron.ipcMain.handle("delete-reminder", (_, id) => {
    requirePermission("settings.manage");
    return dbProxy.prepare("DELETE FROM notification_reminders WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("run-reminder-engine", () => {
    const bizId = getActiveBusinessId();
    const now2 = /* @__PURE__ */ new Date();
    const nowIso = now2.toISOString();
    const allPending = dbProxy.prepare(`
      SELECT * FROM notification_reminders
      WHERE businessId = ? AND status = 'pending'
        AND (snoozedUntil IS NULL OR snoozedUntil <= ?)
    `).all(bizId, nowIso);
    const dueReminders = allPending.filter((r) => {
      if (!r.triggerDate) return false;
      const trigger = new Date(r.triggerDate);
      return !isNaN(trigger.getTime()) && trigger <= now2;
    });
    let fired = 0;
    const insertNotif = dbProxy.prepare(`
      INSERT INTO notifications (businessId, title, message, type, category, severity, actionUrl, actionLabel, entityType, entityId, channels, requiresAction)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const updateReminder = dbProxy.prepare(`
      UPDATE notification_reminders SET lastTriggeredAt = ?, triggerDate = ? WHERE id = ?
    `);
    const completeReminder = dbProxy.prepare(`UPDATE notification_reminders SET status = 'completed', completedAt = ? WHERE id = ?`);
    for (const r of dueReminders) {
      const prefRow = dbProxy.prepare("SELECT * FROM notification_preferences WHERE key = ?").get(r.category);
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
    const lowStock = dbProxy.prepare(`
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
    const outOfStock = dbProxy.prepare(`
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
    const expiring = dbProxy.prepare(`
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
    const customerOverdue = dbProxy.prepare(`
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
    const supplierOverdue = dbProxy.prepare(`
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
    const dueReminders = dbProxy.prepare(`
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
    const row = dbProxy.prepare("SELECT value FROM settings WHERE key = ?").get(key);
    return row ? JSON.parse(row.value) : null;
  });
  electron.ipcMain.handle("set-setting", (_, key, value) => {
    return dbProxy.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, JSON.stringify(value));
  });
  electron.ipcMain.handle("demo:get-mode", () => {
    return { isDemoMode: getDemoMode() };
  });
  electron.ipcMain.handle("demo:set-mode", (_, enabled) => {
    setDemoMode(enabled);
    return { success: true, isDemoMode: getDemoMode() };
  });
  electron.ipcMain.handle("demo:reset", () => {
    resetDemoDb();
    return { success: true };
  });
  electron.ipcMain.handle("demo:seed", () => {
    const ddb = getCurrentDb();
    const bizId = 1;
    const categories = ["Beverages", "Snacks", "Dairy", "Bakery", "Produce", "Household"];
    for (const cat of categories) {
      ddb.prepare("INSERT OR IGNORE INTO categories (businessId, name, isCustom) VALUES (?, ?, 1)").run(bizId, cat);
    }
    const items = [
      { name: "Coca Cola 500ml", category: "Beverages", price: 45, cost: 30, qty: 100 },
      { name: "Pepsi 500ml", category: "Beverages", price: 45, cost: 30, qty: 80 },
      { name: "Water 1L", category: "Beverages", price: 15, cost: 8, qty: 200 },
      { name: "Potato Chips", category: "Snacks", price: 35, cost: 22, qty: 150 },
      { name: "Chocolate Bar", category: "Snacks", price: 25, cost: 15, qty: 200 },
      { name: "Milk 1L", category: "Dairy", price: 55, cost: 40, qty: 50 },
      { name: "Yogurt", category: "Dairy", price: 18, cost: 12, qty: 100 },
      { name: "Bread Loaf", category: "Bakery", price: 30, cost: 18, qty: 80 },
      { name: "Apples 1kg", category: "Produce", price: 80, cost: 50, qty: 60 },
      { name: "Bananas 1kg", category: "Produce", price: 60, cost: 35, qty: 90 },
      { name: "Dish Soap", category: "Household", price: 120, cost: 80, qty: 40 },
      { name: "Toilet Paper 4pk", category: "Household", price: 95, cost: 65, qty: 30 }
    ];
    for (const item of items) {
      const catRow = ddb.prepare("SELECT id FROM categories WHERE businessId = ? AND name = ?").get(bizId, item.category);
      if (catRow) {
        ddb.prepare(`
          INSERT OR IGNORE INTO items (businessId, name, categoryId, baseSalePrice, basePurchasePrice, totalBaseQuantity, unitsPerPack, isCustom)
          VALUES (?, ?, ?, ?, ?, ?, 1, 1)
        `).run(bizId, item.name, catRow.id, item.price, item.cost, item.qty);
      }
    }
    const customers = [
      { name: "Walk-in Customer", phone: "", email: "" },
      { name: "Abebe Kebede", phone: "+251911223344", email: "abebe@email.com" },
      { name: "Meron Tesfaye", phone: "+251922334455", email: "meron@email.com" },
      { name: "Office Supply Co.", phone: "+251115556677", email: "orders@office.com" }
    ];
    for (const cust of customers) {
      ddb.prepare(`
        INSERT OR IGNORE INTO customers (businessId, name, phone, email, isCustom)
        VALUES (?, ?, ?, ?, 1)
      `).run(bizId, cust.name, cust.phone, cust.email);
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const itemsForSale = ddb.prepare("SELECT id, baseSalePrice FROM items WHERE businessId = ?").all(bizId);
    const demoCustomers = ddb.prepare("SELECT id FROM customers WHERE businessId = ?").all(bizId);
    for (let i = 0; i < 10; i++) {
      const item = itemsForSale[Math.floor(Math.random() * itemsForSale.length)];
      const customer = demoCustomers[Math.floor(Math.random() * demoCustomers.length)];
      const qty = Math.floor(Math.random() * 5) + 1;
      const total = item.baseSalePrice * qty;
      ddb.prepare(`
        INSERT INTO sales (businessId, customerId, customerName, totalPrice, paymentMethod, paymentStatus, status, createdAt)
        VALUES (?, ?, ?, ?, 'Cash', 'Completed', 'Active', ?)
      `).run(bizId, customer?.id || null, customer?.name || "Walk-in Customer", total, today);
    }
    return { success: true, message: "Demo data seeded successfully" };
  });
  electron.ipcMain.handle("get-dashboard-stats", (_, dateRange) => {
    const bizId = getActiveBusinessId();
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 864e5).toISOString().split("T")[0];
    const todayStart = today;
    const tomorrowStart = new Date(Date.now() + 864e5).toISOString().split("T")[0];
    const todayRevenue = dbProxy.prepare("SELECT COALESCE(SUM(totalPrice), 0) as total FROM sales WHERE createdAt >= ? AND createdAt < ? AND businessId = ?").get(todayStart, tomorrowStart, bizId);
    const yesterdayRevenue = dbProxy.prepare("SELECT COALESCE(SUM(totalPrice), 0) as total FROM sales WHERE createdAt >= ? AND createdAt < ? AND businessId = ?").get(yesterday, todayStart, bizId);
    const todaySales = dbProxy.prepare("SELECT COUNT(*) as count FROM sales WHERE createdAt >= ? AND createdAt < ? AND businessId = ?").get(todayStart, tomorrowStart, bizId);
    const yesterdaySales = dbProxy.prepare("SELECT COUNT(*) as count FROM sales WHERE createdAt >= ? AND createdAt < ? AND businessId = ?").get(yesterday, todayStart, bizId);
    const todayExpenses = dbProxy.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ? AND businessId = ?").get(today, bizId);
    const yesterdayExpenses = dbProxy.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ? AND businessId = ?").get(yesterday, bizId);
    const activeDebts = dbProxy.prepare("SELECT COALESCE(SUM(totalPrice - paidAmount), 0) as total FROM sales WHERE paymentStatus = 'Debt' AND businessId = ?").get(bizId);
    const totalItems = dbProxy.prepare("SELECT COUNT(*) as count FROM items WHERE businessId = ?").get(bizId);
    const lowStock = dbProxy.prepare("SELECT COUNT(*) as count FROM items WHERE totalBaseQuantity < 10 AND businessId = ?").get(bizId);
    const todayProfit = dbProxy.prepare(`
      SELECT COALESCE(SUM(s.totalPrice - (CASE WHEN s.unitType = 'pack' THEN s.quantity * COALESCE(i.unitsPerPack, 1) ELSE s.quantity END * i.basePurchasePrice)), 0) as profit 
      FROM sales s LEFT JOIN items i ON s.itemId = i.id 
      WHERE DATE(s.createdAt) = ? AND s.businessId = ?
    `).get(today, bizId);
    const yesterdayProfit = dbProxy.prepare(`
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
    const sales = dbProxy.prepare(`
      SELECT 'sale' as type, 'sale-' || s.id as id, s.totalPrice as amount, s.createdAt as date, i.name as description, s.customerName as extra
      FROM sales s LEFT JOIN items i ON s.itemId = i.id
      ${dateFilter}
      ORDER BY s.createdAt DESC LIMIT ?
    `).all(...params, limit);
    const expenses = dbProxy.prepare(`
      SELECT 'expense' as type, 'expense-' || id as id, amount, date, name as description, category as extra
      FROM expenses ${expDateFilter} ORDER BY date DESC LIMIT ?
    `).all(...expParams, limit);
    const adjFilter = dateFilter.replace(/s\.createdAt/g, "a.createdAt").replace(/s\.businessId/g, "a.businessId");
    const adjustments = dbProxy.prepare(`
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
    const now2 = /* @__PURE__ */ new Date();
    let startDate;
    let endDate = null;
    if (dateRange?.start && dateRange?.end) {
      startDate = dateRange.start;
      endDate = dateRange.end;
    } else if (period === "today") {
      startDate = now2.toISOString().split("T")[0];
    } else if (period === "week") {
      const d = new Date(now2);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split("T")[0];
    } else if (period === "month") {
      const d = new Date(now2);
      d.setMonth(d.getMonth() - 1);
      startDate = d.toISOString().split("T")[0];
    } else {
      const d = new Date(now2);
      d.setFullYear(d.getFullYear() - 1);
      startDate = d.toISOString().split("T")[0];
    }
    const dateFilter = endDate ? "DATE(createdAt) >= ? AND DATE(createdAt) <= ? AND businessId = ?" : "DATE(createdAt) >= ? AND businessId = ?";
    const dateParams = endDate ? [startDate, endDate, bizId] : [startDate, bizId];
    const expDateFilter = endDate ? "date >= ? AND date <= ? AND businessId = ?" : "date >= ? AND businessId = ?";
    const expDateParams = endDate ? [startDate, endDate, bizId] : [startDate, bizId];
    const salesData = dbProxy.prepare(`
      SELECT 
        DATE(s.createdAt) as date, 
        COALESCE(SUM(s.totalPrice), 0) as revenue, 
        COALESCE(SUM(s.quantity), 0) as units,
        COALESCE(SUM(s.totalPrice - (CASE WHEN s.unitType = 'pack' THEN s.quantity * COALESCE(i.unitsPerPack, 1) ELSE s.quantity END * i.basePurchasePrice)), 0) as profit
      FROM sales s LEFT JOIN items i ON s.itemId = i.id
      WHERE ${dateFilter.replace(/createdAt/g, "s.createdAt").replace("businessId", "s.businessId")} 
      GROUP BY DATE(s.createdAt) ORDER BY date
    `).all(...dateParams);
    const expenseData = dbProxy.prepare(`
      SELECT date, COALESCE(SUM(amount), 0) as amount
      FROM expenses WHERE ${expDateFilter} GROUP BY date ORDER BY date
    `).all(...expDateParams);
    const totalRevenue = salesData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalProfit = salesData.reduce((acc, curr) => acc + curr.profit, 0);
    const totalExpenses = expenseData.reduce((acc, curr) => acc + curr.amount, 0);
    const topItems = dbProxy.prepare(`
      SELECT i.name, SUM(s.quantity) as totalQty, SUM(s.totalPrice) as totalRevenue
      FROM sales s LEFT JOIN items i ON s.itemId = i.id
      WHERE ${dateFilter.replace(/createdAt/g, "s.createdAt").replace("businessId", "s.businessId")} GROUP BY s.itemId ORDER BY totalQty DESC LIMIT 5
    `).all(...dateParams);
    const categoryBreakdown = dbProxy.prepare(`
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
  electron.ipcMain.handle("get-vat-report", (_, dateRange) => {
    requirePermission("reports.view");
    const bizId = getActiveBusinessId();
    let startDate;
    let endDate;
    const now2 = /* @__PURE__ */ new Date();
    if (dateRange?.start && dateRange?.end) {
      startDate = dateRange.start;
      endDate = dateRange.end;
    } else {
      const d = new Date(now2.getFullYear(), now2.getMonth(), 1);
      startDate = d.toISOString().split("T")[0];
      endDate = now2.toISOString().split("T")[0];
    }
    const rows = dbProxy.prepare(`
      SELECT id, quantity, unit, unitType, discount, vat, totalPrice, paymentMethod, paymentStatus, status, customerName, customerPhone, createdAt,
             COALESCE(i.baseSellingPrice, 0) AS unitSellingPrice,
             COALESCE(i.basePurchasePrice, 0) AS unitCost
      FROM sales s LEFT JOIN items i ON s.itemId = i.id
      WHERE s.businessId = ? AND DATE(s.createdAt) >= ? AND DATE(s.createdAt) <= ? AND (s.is_deleted = 0 OR s.is_deleted IS NULL)
      ORDER BY s.createdAt ASC
    `).all(bizId, startDate, endDate);
    const rateTotals = {};
    let totalTaxable = 0, totalVAT = 0, totalSales = 0, totalCount = 0, totalDiscount = 0;
    for (const r of rows) {
      const taxable = Math.max(0, (r.totalPrice || 0) - (r.discount || 0) - (r.vat || 0));
      const vatAmt = r.vat || 0;
      let rate = "0";
      if (vatAmt > 0 && taxable > 0) {
        const pct = Math.round(vatAmt / taxable * 100);
        rate = String(pct);
      } else if (vatAmt > 0) {
        rate = "15";
      }
      const bucket = rateTotals[rate] || { count: 0, taxable: 0, vat: 0, sales: 0 };
      bucket.count += 1;
      bucket.taxable += taxable;
      bucket.vat += vatAmt;
      bucket.sales += r.totalPrice || 0;
      rateTotals[rate] = bucket;
      totalTaxable += taxable;
      totalVAT += vatAmt;
      totalSales += r.totalPrice || 0;
      totalCount += 1;
      totalDiscount += r.discount || 0;
    }
    const buckets = Object.entries(rateTotals).map(([rate, v]) => ({ rate: rate === "0" ? "0%" : `${rate}%`, ...v })).sort((a, b) => a.rate === "0%" ? 1 : b.rate === "0%" ? -1 : Number(b.rate) - Number(a.rate));
    return {
      startDate,
      endDate,
      buckets,
      summary: { totalCount, totalTaxable, totalVAT, totalSales, totalDiscount },
      transactions: rows
    };
  });
  electron.ipcMain.handle("get-report-drilldowns", (_, dateRange) => {
    requirePermission("reports.view");
    const bizId = getActiveBusinessId();
    let startDate;
    let endDate;
    const now2 = /* @__PURE__ */ new Date();
    if (dateRange?.start && dateRange?.end) {
      startDate = dateRange.start;
      endDate = dateRange.end;
    } else {
      const d = new Date(now2.getFullYear(), now2.getMonth(), 1);
      startDate = d.toISOString().split("T")[0];
      endDate = now2.toISOString().split("T")[0];
    }
    const salesWhere = "s.businessId = ? AND DATE(s.createdAt) >= ? AND DATE(s.createdAt) <= ? AND (s.is_deleted = 0 OR s.is_deleted IS NULL)";
    const salesParams = [bizId, startDate, endDate];
    const byCashier = dbProxy.prepare(`
      SELECT COALESCE(s.createdBy, 'Unknown') AS cashier, COUNT(*) AS saleCount,
             COALESCE(SUM(s.totalPrice), 0) AS revenue, COALESCE(SUM(s.vat), 0) AS vat,
             COALESCE(SUM(s.totalPrice - COALESCE(s.costAtTimeOfSale, 0)), 0) AS profit
      FROM sales s
      WHERE ${salesWhere}
      GROUP BY COALESCE(s.createdBy, 'Unknown')
      ORDER BY revenue DESC
    `).all(...salesParams);
    const byHour = dbProxy.prepare(`
      SELECT CAST(strftime('%H', s.createdAt) AS INTEGER) AS hour, COUNT(*) AS saleCount,
             COALESCE(SUM(s.totalPrice), 0) AS revenue
      FROM sales s
      WHERE ${salesWhere}
      GROUP BY CAST(strftime('%H', s.createdAt) AS INTEGER)
      ORDER BY hour ASC
    `).all(...salesParams);
    const marginByItem = dbProxy.prepare(`
      SELECT i.id, i.name, COALESCE(c.name, 'Uncategorized') AS categoryName,
             SUM(s.quantity) AS units,
             COALESCE(SUM(s.totalPrice), 0) AS revenue,
             COALESCE(SUM(s.costAtTimeOfSale), 0) AS cogs,
             COALESCE(SUM(s.totalPrice - COALESCE(s.costAtTimeOfSale, 0)), 0) AS profit
      FROM sales s
      LEFT JOIN items i ON s.itemId = i.id
      LEFT JOIN categories c ON i.categoryId = c.id
      WHERE ${salesWhere}
      GROUP BY i.id
      ORDER BY profit DESC
    `).all(...salesParams);
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const debtAging = dbProxy.prepare(`
      SELECT s.customerName, s.customerPhone,
             COALESCE(SUM(s.totalPrice - COALESCE(s.paidAmount, 0)), 0) AS outstanding,
             CAST(julianday(?) - julianday(COALESCE(s.dueDate, s.createdAt)) AS INTEGER) AS daysOverdue
      FROM sales s
      WHERE s.paymentStatus = 'Debt' AND s.businessId = ?
        AND (s.is_deleted = 0 OR s.is_deleted IS NULL)
      GROUP BY s.customerName, s.customerPhone
      HAVING outstanding > 0
      ORDER BY daysOverdue DESC
    `).all(today, bizId);
    const movers = dbProxy.prepare(`
      SELECT i.id, i.name,
             COALESCE(SUM(s.quantity), 0) AS unitsSold,
             COALESCE(SUM(s.totalPrice), 0) AS revenue,
             COUNT(s.id) AS saleCount,
             CAST(julianday(?) - julianday(MAX(s.createdAt)) AS INTEGER) AS daysSinceLastSale
      FROM items i
      LEFT JOIN sales s ON s.itemId = i.id AND s.businessId = ? AND DATE(s.createdAt) >= ? AND DATE(s.createdAt) <= ? AND (s.is_deleted = 0 OR s.is_deleted IS NULL)
      WHERE i.businessId = ? AND i.is_deleted = 0
      GROUP BY i.id
      ORDER BY unitsSold DESC
    `).all(today, bizId, startDate, endDate, bizId);
    const valuationByWarehouse = dbProxy.prepare(`
      SELECT w.name AS warehouse,
             COALESCE(SUM(wi.quantity * i.basePurchasePrice), 0) AS value,
             COALESCE(SUM(wi.quantity), 0) AS units,
             COUNT(DISTINCT wi.itemId) AS productCount
      FROM warehouses w
      LEFT JOIN warehouse_inventory wi ON wi.warehouseId = w.id
      LEFT JOIN items i ON wi.itemId = i.id AND i.businessId = ? AND i.is_deleted = 0
      WHERE w.businessId = ?
      GROUP BY w.id
      ORDER BY value DESC
    `).all(bizId, bizId);
    return {
      startDate,
      endDate,
      byCashier,
      byHour,
      marginByItem,
      debtAging,
      movers,
      valuationByWarehouse
    };
  });
  electron.ipcMain.handle("get-gl-journal", (_, dateRange) => {
    requirePermission("reports.view");
    const bizId = getActiveBusinessId();
    const now2 = /* @__PURE__ */ new Date();
    const startDate = dateRange?.start || new Date(now2.getFullYear(), now2.getMonth(), 1).toISOString().split("T")[0];
    const endDate = dateRange?.end || now2.toISOString().split("T")[0];
    const lines = [];
    const sales = dbProxy.prepare(`
      SELECT s.id, s.totalPrice, s.vat, s.discount, s.paymentMethod, s.paymentStatus, s.customerName, s.createdAt, i.name AS itemName
      FROM sales s LEFT JOIN items i ON s.itemId = i.id
      WHERE s.businessId = ? AND DATE(s.createdAt) >= ? AND DATE(s.createdAt) <= ? AND (s.is_deleted = 0 OR s.is_deleted IS NULL)
      ORDER BY s.createdAt ASC
    `).all(bizId, startDate, endDate);
    for (const s of sales) {
      const gross = s.totalPrice || 0;
      const taxable = gross - (s.vat || 0);
      const ref = `SALE-${s.id}`;
      if (s.paymentStatus === "Debt") {
        lines.push({ date: s.createdAt, account: "Accounts Receivable", debit: gross, credit: 0, ref, memo: `Credit sale to ${s.customerName || "customer"} (${s.itemName || ""})` });
      } else {
        const cashAcc = (s.paymentMethod || "Cash") === "Cash" ? "Cash" : "Bank";
        lines.push({ date: s.createdAt, account: cashAcc, debit: gross, credit: 0, ref, memo: `Sale of ${s.itemName || "item"}` });
      }
      if ((s.vat || 0) > 0) {
        lines.push({ date: s.createdAt, account: "VAT Payable", debit: 0, credit: s.vat, ref, memo: `Output VAT on SALE-${s.id}` });
      }
      lines.push({ date: s.createdAt, account: "Sales Revenue", debit: 0, credit: taxable, ref, memo: `Revenue SALE-${s.id}` });
    }
    const expenses = dbProxy.prepare(`
      SELECT e.id, e.name, e.amount, e.category, e.date
      FROM expenses e
      WHERE e.businessId = ? AND DATE(e.date) >= ? AND DATE(e.date) <= ? AND (e.is_deleted = 0 OR e.is_deleted IS NULL)
      ORDER BY e.date ASC
    `).all(bizId, startDate, endDate);
    for (const e of expenses) {
      const ref = `EXP-${e.id}`;
      lines.push({ date: e.date, account: `Expense: ${e.category || "General"}`, debit: e.amount || 0, credit: 0, ref, memo: e.name });
      lines.push({ date: e.date, account: "Cash", debit: 0, credit: e.amount || 0, ref, memo: e.name });
    }
    const payments = dbProxy.prepare(`
      SELECT dp.id, dp.saleId, dp.customerName, dp.amount, dp.createdAt
      FROM debt_payments dp
      WHERE DATE(dp.createdAt) >= ? AND DATE(dp.createdAt) <= ? AND (dp.is_deleted = 0 OR dp.is_deleted IS NULL)
      ORDER BY dp.createdAt ASC
    `).all(startDate, endDate);
    for (const p of payments) {
      const ref = `PMT-${p.id}`;
      lines.push({ date: p.createdAt, account: "Cash", debit: p.amount || 0, credit: 0, ref, memo: `Payment from ${p.customerName || "customer"} on SALE-${p.saleId}` });
      lines.push({ date: p.createdAt, account: "Accounts Receivable", debit: 0, credit: p.amount || 0, ref, memo: `Receivable settled PMT-${p.id}` });
    }
    const sorted = lines.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const totals = sorted.reduce((acc, l) => {
      acc.debit += l.debit || 0;
      acc.credit += l.credit || 0;
      return acc;
    }, { debit: 0, credit: 0 });
    return { startDate, endDate, lines: sorted, totals };
  });
  const giftCode = () => `GC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  electron.ipcMain.handle("get-gift-cards", () => {
    requirePermission("inventory.view");
    const bizId = getActiveBusinessId();
    return dbProxy.prepare("SELECT * FROM gift_cards WHERE businessId = ? AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY createdAt DESC LIMIT ?").all(bizId, DEFAULT_LIST_LIMIT);
  });
  electron.ipcMain.handle("issue-gift-card", (_, data) => {
    requirePermission("inventory.edit");
    const bizId = getActiveBusinessId();
    const balance = validatePositive(data.balance, "Card balance");
    const code = data.code?.trim() || giftCode();
    const result = dbProxy.transaction(() => {
      const r = dbProxy.prepare(`
        INSERT INTO gift_cards (businessId, code, cardName, initialBalance, balance, issuedTo, issuedBy, expiryDate, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(bizId, code, data.cardName || null, balance, balance, data.issuedTo || null, currentUserName || null, data.expiryDate || null, data.notes || null);
      const id = r.lastInsertRowid;
      dbProxy.prepare("INSERT INTO gift_card_transactions (giftCardId, type, amount, note, createdBy) VALUES (?, ?, ?, ?, ?)").run(id, "issue", balance, data.notes || "Gift card issued", currentUserName || null);
      insertAuditLog("issue_gift_card", "gift_cards", id, "balance", "0", String(balance), `Gift card ${code} issued`);
      return { id, code };
    })();
    return result;
  });
  electron.ipcMain.handle("redeem-gift-card", (_, data) => {
    requirePermission("sales.create");
    const bizId = getActiveBusinessId();
    const code = (data.code || "").trim();
    const amount = validatePositive(data.amount, "Redeem amount");
    const card = dbProxy.prepare("SELECT * FROM gift_cards WHERE code = ? AND businessId = ? AND (is_deleted = 0 OR is_deleted IS NULL)").get(code, bizId);
    if (!card) throw new Error("Gift card not found");
    if (card.status !== "active") throw new Error("Gift card is not active");
    if (card.expiryDate && card.expiryDate < (/* @__PURE__ */ new Date()).toISOString().split("T")[0]) throw new Error("Gift card has expired");
    if ((card.balance || 0) < amount) throw new Error(`Insufficient gift card balance (${card.balance})`);
    const result = dbProxy.transaction(() => {
      dbProxy.prepare("UPDATE gift_cards SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(amount, card.id);
      dbProxy.prepare("INSERT INTO gift_card_transactions (giftCardId, type, amount, refType, refId, note, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)").run(card.id, "redeem", amount, data.refType || null, data.refId || null, data.note || "Gift card redeemed", currentUserName || null);
      insertAuditLog("redeem_gift_card", "gift_cards", card.id, "balance", String(card.balance), String(card.balance - amount), `Gift card ${code} redeemed ${amount}`);
      return { success: true, balance: card.balance - amount };
    })();
    return result;
  });
  electron.ipcMain.handle("topup-gift-card", (_, data) => {
    requirePermission("inventory.edit");
    const bizId = getActiveBusinessId();
    const card = dbProxy.prepare("SELECT * FROM gift_cards WHERE id = ? AND businessId = ? AND (is_deleted = 0 OR is_deleted IS NULL)").get(data.id, bizId);
    if (!card) throw new Error("Gift card not found");
    const amount = validatePositive(data.amount, "Top-up amount");
    const result = dbProxy.transaction(() => {
      dbProxy.prepare("UPDATE gift_cards SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(amount, card.id);
      dbProxy.prepare("INSERT INTO gift_card_transactions (giftCardId, type, amount, note, createdBy) VALUES (?, ?, ?, ?, ?)").run(card.id, "topup", amount, data.note || "Gift card top-up", currentUserName || null);
      insertAuditLog("topup_gift_card", "gift_cards", card.id, "balance", String(card.balance), String(card.balance + amount), `Gift card top-up ${amount}`);
      return { success: true, balance: card.balance + amount };
    })();
    return result;
  });
  electron.ipcMain.handle("void-gift-card", (_, id) => {
    requirePermission("inventory.delete");
    const bizId = getActiveBusinessId();
    const card = dbProxy.prepare("SELECT * FROM gift_cards WHERE id = ? AND businessId = ?").get(id, bizId);
    if (!card) throw new Error("Gift card not found");
    dbProxy.prepare("UPDATE gift_cards SET status = 'void', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    dbProxy.prepare("INSERT INTO gift_card_transactions (giftCardId, type, amount, note, createdBy) VALUES (?, ?, ?, ?, ?)").run(id, "void", 0, "Gift card voided", currentUserName || null);
    insertAuditLog("void_gift_card", "gift_cards", id, "status", card.status, "void", `Gift card ${card.code} voided`);
    return { success: true };
  });
  electron.ipcMain.handle("get-gift-card-transactions", (_, cardId) => {
    requirePermission("inventory.view");
    return dbProxy.prepare("SELECT * FROM gift_card_transactions WHERE giftCardId = ? ORDER BY createdAt DESC LIMIT ?").all(cardId, DEFAULT_LIST_LIMIT);
  });
  electron.ipcMain.handle("get-customers", (_, options) => {
    requirePermission("customers.view");
    const bizId = getActiveBusinessId();
    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options?.offset ?? 0;
    const customers = dbProxy.prepare(`
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
      LIMIT ? OFFSET ?
    `).all(bizId, bizId, listLimit, offset);
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
    requirePermission("customers.view");
    const bizId = getActiveBusinessId();
    const customerRaw = dbProxy.prepare(`
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
  electron.ipcMain.handle("get-customer-sales", (_, customerName, options) => {
    requirePermission("customers.view");
    const bizId = getActiveBusinessId();
    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options?.offset ?? 0;
    return dbProxy.prepare(`
      SELECT sales.*, items.name as itemName 
      FROM sales LEFT JOIN items ON sales.itemId = items.id 
      WHERE sales.customerName = ? AND sales.businessId = ?
      ORDER BY sales.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(customerName, bizId, listLimit, offset);
  });
  electron.ipcMain.handle("insert-customer", (_, customer) => {
    requirePermission("customers.add");
    const bizId = getActiveBusinessId();
    const name = customer.customerName?.trim();
    if (!name) throw new Error("Customer name is required");
    if (name.length > 200) throw new Error("Customer name must be 200 characters or less");
    if (customer.phone && String(customer.phone).length > 30) throw new Error("Phone must be 30 characters or less");
    if (customer.email && String(customer.email).length > 100) throw new Error("Email must be 100 characters or less");
    const existing = dbProxy.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(name, bizId);
    if (existing) return { success: false, error: "Customer name already exists" };
    const result = dbProxy.prepare(`
      INSERT INTO customers (businessId, customerName, phone, secondaryPhone, email, address, city, company, taxNumber, groupName, creditLimit, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(bizId, name, customer.phone || "", customer.secondaryPhone || "", customer.email || "", customer.address || "", customer.city || "", customer.company || "", customer.taxNumber || "", customer.groupName || "general", customer.creditLimit || 0, customer.notes || "");
    return { success: true, id: result.lastInsertRowid };
  });
  electron.ipcMain.handle("update-customer", (_, customer) => {
    requirePermission("customers.add");
    const bizId = getActiveBusinessId();
    const name = customer.customerName?.trim();
    if (!name) throw new Error("Customer name is required");
    if (name.length > 200) throw new Error("Customer name must be 200 characters or less");
    if (customer.phone && String(customer.phone).length > 30) throw new Error("Phone must be 30 characters or less");
    if (customer.email && String(customer.email).length > 100) throw new Error("Email must be 100 characters or less");
    const dup = dbProxy.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ? AND id != ?").get(name, bizId, customer.id);
    if (dup) return { success: false, error: "Another customer with this name already exists" };
    dbProxy.prepare(`
      UPDATE customers SET customerName = ?, phone = ?, secondaryPhone = ?, email = ?, address = ?, city = ?, company = ?, taxNumber = ?, groupName = ?, creditLimit = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND businessId = ?
    `).run(name, customer.phone || "", customer.secondaryPhone || "", customer.email || "", customer.address || "", customer.city || "", customer.company || "", customer.taxNumber || "", customer.groupName || "general", customer.creditLimit || 0, customer.notes || "", customer.id, bizId);
    return { success: true };
  });
  electron.ipcMain.handle("delete-customer", (_, customerId) => {
    requirePermission("customers.delete");
    dbProxy.prepare("UPDATE customers SET isActive = 0 WHERE id = ?").run(customerId);
    return { success: true };
  });
  electron.ipcMain.handle("get-customer-notes", (_, customerId) => {
    return dbProxy.prepare("SELECT * FROM customer_notes WHERE customerId = ? ORDER BY createdAt DESC LIMIT 50").all(customerId);
  });
  electron.ipcMain.handle("add-customer-note", (_, customerId, note, createdBy) => {
    requirePermission("customers.add");
    dbProxy.prepare("INSERT INTO customer_notes (customerId, note, createdBy) VALUES (?, ?, ?)").run(customerId, note, createdBy || "");
    return { success: true };
  });
  electron.ipcMain.handle("export-data", () => {
    requirePermission("settings.manage");
    const bizId = getActiveBusinessId();
    const tables = ["categories", "items", "item_packs", "sales", "expenses", "adjustments", "settings", "customers", "suppliers", "returns", "debt_payments", "warehouses", "warehouse_inventory", "budgets", "budget_adjustments", "gift_cards", "gift_card_transactions", "orders"];
    const data = {};
    for (const table of tables) {
      if (table === "settings") {
        data[table] = dbProxy.prepare(`SELECT * FROM ${table}`).all();
      } else {
        const hasBiz = dbProxy.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === "businessId");
        data[table] = hasBiz ? dbProxy.prepare(`SELECT * FROM ${table} WHERE businessId = ?`).all(bizId) : dbProxy.prepare(`SELECT * FROM ${table}`).all();
      }
    }
    return data;
  });
  electron.ipcMain.handle("reset-data", (_, mode = "transactions") => {
    requirePermission("settings.manage");
    const bizId = getActiveBusinessId();
    dbProxy.pragma("foreign_keys = OFF");
    try {
      const transaction = dbProxy.transaction(() => {
        dbProxy.prepare("DELETE FROM debt_payments WHERE saleId IN (SELECT id FROM sales WHERE businessId = ?)").run(bizId);
        dbProxy.prepare("DELETE FROM returns WHERE businessId = ?").run(bizId);
        dbProxy.prepare("DELETE FROM sales WHERE businessId = ?").run(bizId);
        dbProxy.prepare("DELETE FROM adjustments WHERE businessId = ?").run(bizId);
        dbProxy.prepare("DELETE FROM stock_movements WHERE itemId IN (SELECT id FROM items WHERE businessId = ?)").run(bizId);
        dbProxy.prepare("DELETE FROM stock_transfers WHERE businessId = ?").run(bizId);
        dbProxy.prepare("DELETE FROM shipment_items WHERE shipmentId IN (SELECT id FROM shipments WHERE businessId = ?)").run(bizId);
        dbProxy.prepare("DELETE FROM shipment_history WHERE shipmentId IN (SELECT id FROM shipments WHERE businessId = ?)").run(bizId);
        dbProxy.prepare("DELETE FROM shipments WHERE businessId = ?").run(bizId);
        dbProxy.prepare("DELETE FROM notification_banners WHERE businessId = ?").run(bizId);
        dbProxy.prepare("DELETE FROM notification_reminders WHERE businessId = ?").run(bizId);
        dbProxy.prepare("DELETE FROM supplier_purchase_items WHERE purchaseId IN (SELECT id FROM supplier_purchases WHERE businessId = ?)").run(bizId);
        dbProxy.prepare("DELETE FROM supplier_payments WHERE businessId = ?").run(bizId);
        dbProxy.prepare("DELETE FROM supplier_activity_log WHERE supplierId IN (SELECT id FROM suppliers WHERE businessId = ?)").run(bizId);
        dbProxy.prepare("DELETE FROM supplier_purchases WHERE businessId = ?").run(bizId);
        dbProxy.prepare("DELETE FROM customer_notes WHERE customerId IN (SELECT id FROM customers WHERE businessId = ?)").run(bizId);
        dbProxy.prepare("DELETE FROM expenses WHERE businessId = ?").run(bizId);
        dbProxy.prepare("DELETE FROM notifications WHERE businessId = ?").run(bizId);
        if (mode === "transactions") {
          dbProxy.prepare("DELETE FROM warehouse_inventory WHERE itemId IN (SELECT id FROM items WHERE businessId = ?)").run(bizId);
        }
        if (mode === "all" || mode === "factory") {
          dbProxy.prepare("DELETE FROM order_items WHERE orderId IN (SELECT id FROM orders WHERE businessId = ?)").run(bizId);
          dbProxy.prepare("DELETE FROM order_history WHERE orderId IN (SELECT id FROM orders WHERE businessId = ?)").run(bizId);
          dbProxy.prepare("DELETE FROM orders WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM draft_sales WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM contacts WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM budget_alerts WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM budget_adjustments WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM budgets WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM notification_quiet_hours WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM supplier_price_checks WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM audit_logs WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM warehouse_inventory WHERE warehouseId IN (SELECT id FROM warehouses WHERE businessId = ?)").run(bizId);
          dbProxy.prepare("DELETE FROM item_packs WHERE itemId IN (SELECT id FROM items WHERE businessId = ?)").run(bizId);
          dbProxy.prepare("DELETE FROM items WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM categories WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM warehouses WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM customers WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM suppliers WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM employee_performance WHERE employeeId IN (SELECT id FROM employees)").run();
          dbProxy.prepare("DELETE FROM attendance WHERE employeeId IN (SELECT id FROM employees)").run();
          dbProxy.prepare("DELETE FROM pin_recovery_keys WHERE employeeId IN (SELECT id FROM employees)").run();
          dbProxy.prepare("DELETE FROM login_history WHERE employeeId IN (SELECT id FROM employees)").run();
          dbProxy.prepare("DELETE FROM employee_accounts").run();
          dbProxy.prepare("DELETE FROM employees").run();
        }
        if (mode === "factory") {
          dbProxy.prepare("DELETE FROM pin_recovery_keys WHERE adminId IN (SELECT id FROM admins WHERE businessId = ?)").run(bizId);
          dbProxy.prepare("DELETE FROM login_history WHERE accountId IN (SELECT id FROM employee_accounts)").run();
          dbProxy.prepare("DELETE FROM payment_transactions WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM subscription_history WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM subscriptions WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM audit_logs WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM admins WHERE businessId = ?").run(bizId);
          dbProxy.prepare("DELETE FROM businesses WHERE id = ?").run(bizId);
        }
      });
      transaction();
    } finally {
      dbProxy.pragma("foreign_keys = ON");
    }
    if (mode === "factory") {
      clearActiveBusinessCache();
      currentUserBusinessId = null;
      currentAdminId = null;
      currentUserName = null;
      currentUserRole = null;
      currentUserPermissions = [];
      currentUserSharedPerms = null;
    }
    return { success: true, mode, message: mode === "factory" ? "Factory reset complete. This will log you out." : void 0 };
  });
  electron.ipcMain.handle("login", (_, username, pin) => {
    const admin = dbProxy.prepare(
      "SELECT id, name, username, role, permissions, isActive, businessId, avatar, pin FROM admins WHERE username = ?"
    ).get(username);
    if (admin) {
      if (admin.lockedUntil && new Date(admin.lockedUntil) > /* @__PURE__ */ new Date()) {
        return { success: false, error: "Account is locked. Try again later." };
      }
      if (!admin.isActive) return { success: false, error: "Account deactivated" };
      if (!verifyPin(pin, admin.pin)) {
        const attempts = (admin.failedLoginAttempts || 0) + 1;
        if (attempts >= 5) {
          const lockUntil = new Date(Date.now() + 30 * 60 * 1e3).toISOString();
          dbProxy.prepare("UPDATE admins SET failedLoginAttempts = ?, lockedUntil = ? WHERE id = ?").run(attempts, lockUntil, admin.id);
          return { success: false, error: "Account locked due to too many failed attempts." };
        }
        dbProxy.prepare("UPDATE admins SET failedLoginAttempts = ? WHERE id = ?").run(attempts, admin.id);
        return { success: false, error: "Invalid credentials" };
      }
      dbProxy.prepare("UPDATE admins SET lastLogin = CURRENT_TIMESTAMP, failedLoginAttempts = 0, lockedUntil = NULL WHERE id = ?").run(admin.id);
      currentAdminId = admin.id;
      currentUserName = admin.name;
      currentUserRole = admin.role || "admin";
      currentUserPermissions = admin.permissions ? JSON.parse(admin.permissions) : ["*"];
      currentUserBusinessId = null;
      currentUserSharedPerms = null;
      return {
        success: true,
        admin: {
          ...admin,
          permissions: admin.permissions ? JSON.parse(admin.permissions) : []
        }
      };
    }
    const account = dbProxy.prepare(`
      SELECT ea.*, e.id as employeeId, e.firstName, e.lastName,
        e.businessId as employeeBusinessId,
        e.role_key as roleKey, e.permissions_json as permissionsJson,
        r.name as roleName, r.permissions as rolePermissions
      FROM employee_accounts ea
      LEFT JOIN employees e ON ea.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
      WHERE ea.username = ?
    `).get(username);
    if (!account) {
      dbProxy.prepare("INSERT INTO login_history (action) VALUES (?)").run("failed_login: employee not found");
      return { success: false, error: "Invalid credentials" };
    }
    if (account.lockedUntil && new Date(account.lockedUntil) > /* @__PURE__ */ new Date()) {
      dbProxy.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "failed_login: account locked");
      return { success: false, error: "Account is locked. Try again later." };
    }
    if (!account.isActive) {
      dbProxy.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "failed_login: inactive");
      return { success: false, error: "Account deactivated" };
    }
    if (!verifyPin(pin, account.pin)) {
      const attempts = (account.failedLoginAttempts || 0) + 1;
      if (attempts >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1e3).toISOString();
        dbProxy.prepare("UPDATE employee_accounts SET failedLoginAttempts = ?, lockedUntil = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(attempts, lockUntil, account.id);
        dbProxy.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "failed_login: locked after 5 attempts");
        return { success: false, error: "Account locked due to too many failed attempts." };
      }
      dbProxy.prepare("UPDATE employee_accounts SET failedLoginAttempts = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(attempts, account.id);
      dbProxy.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "failed_login: wrong pin");
      return { success: false, error: "Invalid credentials" };
    }
    dbProxy.prepare("UPDATE employee_accounts SET lastLogin = CURRENT_TIMESTAMP, failedLoginAttempts = 0, lockedUntil = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(account.id);
    dbProxy.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "login");
    currentAdminId = account.employeeId;
    currentUserName = `${account.firstName || ""} ${account.lastName || ""}`.trim() || account.username;
    currentUserRole = account.roleName || "employee";
    const rolePerms = account.rolePermissions ? JSON.parse(account.rolePermissions) : [];
    currentUserPermissions = rolePerms.length > 0 ? rolePerms : ["*"];
    currentUserBusinessId = account.employeeBusinessId ?? null;
    currentUserSharedPerms = resolveSharedPermissions(account.roleKey, account.permissionsJson);
    if (currentUserBusinessId) setActiveBusinessId(currentUserBusinessId);
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
        isEmployee: true,
        roleKey: account.roleKey || null,
        sharedPermissions: currentUserSharedPerms
      }
    };
  });
  electron.ipcMain.handle("get-admins", () => {
    const admins = dbProxy.prepare("SELECT id, name, username, role, permissions, isActive, avatar, createdAt FROM admins ORDER BY createdAt ASC").all();
    return admins.map((a) => ({
      ...a,
      permissions: a.permissions ? JSON.parse(a.permissions) : []
    }));
  });
  electron.ipcMain.handle("get-current-admin", (_, id) => {
    const admin = dbProxy.prepare("SELECT id, name, username, role, permissions, isActive, avatar FROM admins WHERE id = ?").get(id);
    if (!admin) return null;
    return {
      ...admin,
      permissions: admin.permissions ? JSON.parse(admin.permissions) : []
    };
  });
  electron.ipcMain.handle("insert-admin", (_, admin) => {
    requirePermission("settings.users");
    const existing = dbProxy.prepare("SELECT id FROM admins WHERE username = ?").get(admin.username);
    if (existing) return { success: false, error: "Username already exists" };
    const hash = hashPin(admin.pin);
    const result = dbProxy.prepare(
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
    const isSelf = id === currentAdminId;
    const sensitiveFields = ["username", "pin", "role", "permissions", "isActive", "businessId"];
    const updatingSensitive = sensitiveFields.some((f) => admin[f] !== void 0);
    if (!isSelf || updatingSensitive) {
      requirePermission("settings.users");
    }
    if (admin.pin !== void 0 && id === currentAdminId) {
      const stored = dbProxy.prepare("SELECT pin FROM admins WHERE id = ?").get(id);
      if (!stored || !admin.currentPin || !verifyPin(admin.currentPin, stored.pin)) {
        return { success: false, error: "Current PIN is required to change your PIN" };
      }
      delete admin.currentPin;
    }
    if (admin.username) {
      const existing = dbProxy.prepare("SELECT id FROM admins WHERE username = ? AND id != ?").get(admin.username, id);
      if (existing) return { success: false, error: "Username already exists" };
    }
    const existingAdmin = dbProxy.prepare("SELECT id FROM admins WHERE id = ?").get(id);
    if (!existingAdmin) {
      const empFields = [];
      const empValues = [];
      if (admin.avatar !== void 0) {
        empFields.push("avatar = ?");
        empValues.push(admin.avatar);
      }
      if (admin.name !== void 0) {
        empFields.push("firstName = ?");
        empValues.push(admin.name);
      }
      if (empFields.length > 0) {
        empValues.push(id);
        dbProxy.prepare(`UPDATE employees SET ${empFields.join(", ")}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`).run(...empValues);
      }
      return { success: true };
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
    dbProxy.prepare(`UPDATE admins SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return { success: true };
  });
  electron.ipcMain.handle("delete-admin", (_, id) => {
    requirePermission("settings.users");
    const admin = dbProxy.prepare("SELECT role FROM admins WHERE id = ?").get(id);
    if (admin?.role === "super_admin") {
      const superCount = dbProxy.prepare("SELECT COUNT(*) as count FROM admins WHERE role = 'super_admin'").get();
      if (superCount.count <= 1) {
        return { success: false, error: "Cannot delete the last super admin" };
      }
    }
    dbProxy.prepare("DELETE FROM admins WHERE id = ?").run(id);
    return { success: true };
  });
  electron.ipcMain.handle("insert-bulk-adjustments", async (event, adjustments) => {
    requirePermission("inventory.adjust");
    if (!await gateSensitiveAction(event.sender, { context: `Bulk stock/price adjustments (${Array.isArray(adjustments) ? adjustments.length : 0})` })) {
      throw new Error("Manager approval required — action not executed");
    }
    const bizId = getActiveBusinessId();
    const transaction = dbProxy.transaction(() => {
      let count = 0;
      for (const adj of adjustments) {
        dbProxy.prepare("INSERT INTO adjustments (businessId, itemId, type, oldValue, newValue, quantity, unitType, reason, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
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
          dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity - ? WHERE id = ?").run(adj.quantity, adj.itemId);
          const defWhId = getDefaultWarehouseId();
          const whRow = dbProxy.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, adj.itemId);
          if (whRow) {
            dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(adj.quantity, whRow.id);
          }
          dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, adj.itemId, `adj_${adj.type}`, adj.quantity, "adjustment", adj.reason || null);
        } else if (adj.type === "add_stock") {
          dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ? WHERE id = ?").run(adj.quantity, adj.itemId);
          const defWhId = getDefaultWarehouseId();
          const whRow = dbProxy.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, adj.itemId);
          if (whRow) {
            dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(adj.quantity, whRow.id);
          } else {
            dbProxy.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, adj.itemId, adj.quantity);
          }
          dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, adj.itemId, `adj_${adj.type}`, adj.quantity, "adjustment", adj.reason || null);
        } else if (adj.type === "price_increase" || adj.type === "price_decrease") {
          if (adj.unitType === "base") {
            dbProxy.prepare("UPDATE items SET baseSellingPrice = ? WHERE id = ?").run(adj.newValue, adj.itemId);
          } else {
            dbProxy.prepare("UPDATE items SET packSellingPrice = ? WHERE id = ?").run(adj.newValue, adj.itemId);
          }
        }
        count++;
      }
      return count;
    });
    return transaction();
  });
  electron.ipcMain.handle("get-warehouses", () => {
    requirePermission("warehouses.view");
    const bizId = getActiveBusinessId();
    return dbProxy.prepare("SELECT * FROM warehouses WHERE businessId = ? ORDER BY name").all(bizId);
  });
  electron.ipcMain.handle("get-warehouse", (_, id) => {
    requirePermission("warehouses.view");
    return dbProxy.prepare("SELECT * FROM warehouses WHERE id = ?").get(id);
  });
  electron.ipcMain.handle("insert-warehouse", (_, wh) => {
    requirePermission("warehouses.create");
    const bizId = getActiveBusinessId();
    return dbProxy.prepare("INSERT INTO warehouses (businessId, name, location, managerName, managerPhone, email) VALUES (?, ?, ?, ?, ?, ?)").run(bizId, wh.name, wh.location, wh.managerName, wh.managerPhone, wh.email).lastInsertRowid;
  });
  electron.ipcMain.handle("update-warehouse", (_, id, wh) => {
    requirePermission("warehouses.create");
    return dbProxy.prepare("UPDATE warehouses SET name = ?, location = ?, managerName = ?, managerPhone = ?, email = ?, isActive = ? WHERE id = ?").run(wh.name, wh.location, wh.managerName, wh.managerPhone, wh.email, wh.isActive ?? 1, id);
  });
  electron.ipcMain.handle("delete-warehouse", (_, id) => {
    requirePermission("warehouses.edit");
    const tx = dbProxy.transaction(() => {
      dbProxy.prepare("DELETE FROM stock_movements WHERE warehouseId = ?").run(id);
      dbProxy.prepare("DELETE FROM warehouse_inventory WHERE warehouseId = ?").run(id);
      dbProxy.prepare("DELETE FROM warehouses WHERE id = ?").run(id);
    });
    return tx();
  });
  electron.ipcMain.handle("get-warehouse-inventory", (_, warehouseId) => {
    requirePermission("warehouses.view");
    return dbProxy.prepare(`
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
    requirePermission("warehouses.view");
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
      query += " AND (LOWER(items.name) LIKE LOWER(?) OR LOWER(items.companyName) LIKE LOWER(?))";
      params.push(`%${options.search}%`, `%${options.search}%`);
    }
    if (options.category && options.category !== "All") {
      query += " AND categories.name = ?";
      params.push(options.category);
    }
    query += " ORDER BY w.name, items.name LIMIT ? OFFSET ?";
    params.push(options.limit ?? DEFAULT_LIST_LIMIT, options.offset ?? 0);
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("update-warehouse-inventory", (_, warehouseId, itemId, quantity) => {
    requirePermission("inventory.adjust");
    validateNonNegative(quantity, "Warehouse inventory quantity");
    const existing = dbProxy.prepare("SELECT id, quantity FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(warehouseId, itemId);
    existing?.quantity || 0;
    if (existing) {
      dbProxy.prepare("UPDATE warehouse_inventory SET quantity = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(quantity, existing.id);
    } else {
      dbProxy.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(warehouseId, itemId, quantity);
    }
    const totalRow = dbProxy.prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM warehouse_inventory WHERE itemId = ?").get(itemId);
    dbProxy.prepare("UPDATE items SET totalBaseQuantity = ? WHERE id = ?").run(totalRow.total, itemId);
    dbProxy.prepare("SELECT name FROM items WHERE id = ?").get(itemId);
    dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(warehouseId, itemId, "adjustment", quantity, "manual", "Manual inventory adjustment");
    return { success: true };
  });
  electron.ipcMain.handle("transfer-stock", (_, transfer) => {
    requirePermission("warehouses.transfer");
    if (transfer.fromWarehouseId === transfer.toWarehouseId) throw new Error("Source and destination warehouses must be different");
    const qty = validatePositive(transfer.quantity, "Transfer quantity");
    transfer.quantity = qty;
    const bizId = getActiveBusinessId();
    const tx = dbProxy.transaction(() => {
      const fromResult = dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE warehouseId = ? AND itemId = ? AND quantity >= ?").run(transfer.quantity, transfer.fromWarehouseId, transfer.itemId, transfer.quantity);
      if (fromResult.changes === 0) throw new Error("Insufficient stock at source warehouse");
      const toExisting = dbProxy.prepare("SELECT id, quantity FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(transfer.toWarehouseId, transfer.itemId);
      if (toExisting) {
        const newQty = toExisting.quantity + transfer.quantity;
        dbProxy.prepare("UPDATE warehouse_inventory SET quantity = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(newQty, toExisting.id);
      } else {
        dbProxy.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(transfer.toWarehouseId, transfer.itemId, transfer.quantity);
      }
      const result = dbProxy.prepare("INSERT INTO stock_transfers (businessId, fromWarehouseId, toWarehouseId, itemId, quantity, unitType, notes, transferredBy, completedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)").run(bizId, transfer.fromWarehouseId, transfer.toWarehouseId, transfer.itemId, transfer.quantity, transfer.unitType || "base", transfer.notes, transfer.transferredBy);
      dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceId, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").run(transfer.fromWarehouseId, transfer.itemId, "transfer_out", transfer.quantity, result.lastInsertRowid, "transfer", `Transferred to warehouse #${transfer.toWarehouseId}`);
      dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceId, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").run(transfer.toWarehouseId, transfer.itemId, "transfer_in", transfer.quantity, result.lastInsertRowid, "transfer", `Received from warehouse #${transfer.fromWarehouseId}`);
      dbProxy.prepare("SELECT name FROM items WHERE id = ?").get(transfer.itemId);
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
    const offset = options.offset ?? 0;
    query += " LIMIT ? OFFSET ?";
    params.push(listLimit, offset);
    return dbProxy.prepare(query).all(...params);
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
    const offset = options.offset ?? 0;
    query += " LIMIT ? OFFSET ?";
    params.push(listLimit, offset);
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("cleanup-stock-movements", () => {
    requirePermission("settings.manage");
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1e3).toISOString();
    const result = dbProxy.prepare("DELETE FROM stock_movements WHERE createdAt < ?").run(ninetyDaysAgo);
    return { success: true, deleted: result.changes };
  });
  electron.ipcMain.handle("get-warehouse-report", (_, warehouseId) => {
    const inventory = dbProxy.prepare(`
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
    const recentMovements = dbProxy.prepare(`
      SELECT sm.*, items.name as itemName
      FROM stock_movements sm
      LEFT JOIN items ON sm.itemId = items.id
      WHERE sm.warehouseId = ?
      ORDER BY sm.createdAt DESC LIMIT 20
    `).all(warehouseId);
    return { inventory, totalItems, totalValue, lowStock, recentMovements };
  });
  electron.ipcMain.handle("get-employee-roles", () => {
    const bizId = getActiveBusinessId();
    return dbProxy.prepare("SELECT * FROM employee_roles WHERE businessId = ? ORDER BY name").all(bizId);
  });
  electron.ipcMain.handle("get-employee-role", (_, id) => {
    return dbProxy.prepare("SELECT * FROM employee_roles WHERE id = ? AND businessId = ?").get(id, getActiveBusinessId());
  });
  electron.ipcMain.handle("insert-employee-role", (_, data) => {
    requirePermission("settings.roles");
    const permissions = JSON.stringify(data.permissions || []);
    const result = dbProxy.prepare("INSERT INTO employee_roles (businessId, name, description, permissions, isSystem) VALUES (?, ?, ?, ?, ?)").run(getActiveBusinessId(), data.name, data.description || "", permissions, 0);
    return result.lastInsertRowid;
  });
  electron.ipcMain.handle("update-employee-role", (_, id, data) => {
    requirePermission("settings.roles");
    const permissions = JSON.stringify(data.permissions || []);
    const result = dbProxy.prepare("UPDATE employee_roles SET name = ?, description = ?, permissions = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(data.name, data.description || "", permissions, id, getActiveBusinessId());
    return result;
  });
  electron.ipcMain.handle("duplicate-employee-role", (_, id) => {
    requirePermission("settings.roles");
    const original = dbProxy.prepare("SELECT * FROM employee_roles WHERE id = ? AND businessId = ?").get(id, getActiveBusinessId());
    if (!original) throw new Error("Role not found");
    const result = dbProxy.prepare("INSERT INTO employee_roles (businessId, name, description, permissions, isSystem) VALUES (?, ?, ?, ?, 0)").run(getActiveBusinessId(), `${original.name} (Copy)`, original.description, original.permissions);
    return result.lastInsertRowid;
  });
  electron.ipcMain.handle("delete-employee-role", (_, id) => {
    requirePermission("settings.roles");
    const bizId = getActiveBusinessId();
    const role = dbProxy.prepare("SELECT name, isSystem FROM employee_roles WHERE id = ? AND businessId = ?").get(id, bizId);
    if (role?.isSystem) throw new Error("Cannot delete system role");
    dbProxy.prepare("UPDATE employees SET roleId = NULL WHERE roleId = ? AND businessId = ?").run(id, bizId);
    dbProxy.prepare("DELETE FROM employee_roles WHERE id = ? AND businessId = ?").run(id, bizId);
  });
  electron.ipcMain.handle("get-employees", (_, options) => {
    requirePermission("employees.view");
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
    const conditions = ["e.businessId = ?"];
    const params = [getActiveBusinessId()];
    if (options?.search) {
      conditions.push("(LOWER(e.firstName) LIKE LOWER(?) OR LOWER(e.lastName) LIKE LOWER(?) OR LOWER(e.phone) LIKE LOWER(?) OR LOWER(e.email) LIKE LOWER(?) OR LOWER(e.employeeCode) LIKE LOWER(?))");
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
    const offset = options?.offset ?? 0;
    query += " LIMIT ? OFFSET ?";
    params.push(listLimit, offset);
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-employee", (_, id) => {
    requirePermission("employees.view");
    return dbProxy.prepare(`
      SELECT e.*, r.name as roleName, r.permissions as rolePermissions,
        r.description as roleDescription, w.name as warehouseName
      FROM employees e
      LEFT JOIN employee_roles r ON e.roleId = r.id
      LEFT JOIN warehouses w ON e.warehouseId = w.id
      WHERE e.id = ? AND e.businessId = ?
    `).get(id, getActiveBusinessId());
  });
  electron.ipcMain.handle("insert-employee", (_, data) => {
    requirePermission("employees.add");
    const result = dbProxy.prepare(`
      INSERT INTO employees (businessId, employeeCode, firstName, lastName, phone, email, address, emergencyContact,
        gender, dateOfBirth, roleId, department, warehouseId, isActive, employmentStatus, avatar, hireDate, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      getActiveBusinessId(),
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
    requirePermission("employees.add");
    const result = dbProxy.prepare(`
      UPDATE employees SET
        employeeCode = ?, firstName = ?, lastName = ?, phone = ?, email = ?,
        address = ?, emergencyContact = ?, gender = ?, dateOfBirth = ?,
        roleId = ?, department = ?, warehouseId = ?, isActive = ?,
        employmentStatus = ?, avatar = ?, hireDate = ?, notes = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND businessId = ?
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
      id,
      getActiveBusinessId()
    );
    return result;
  });
  electron.ipcMain.handle("delete-employee", (_, id) => {
    requirePermission("employees.delete");
    dbProxy.prepare("DELETE FROM employees WHERE id = ? AND businessId = ?").run(id, getActiveBusinessId());
  });
  electron.ipcMain.handle("archive-employee", (_, id) => {
    requirePermission("employees.delete");
    const result = dbProxy.prepare("UPDATE employees SET employmentStatus = 'inactive', isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(id, getActiveBusinessId());
    return result;
  });
  electron.ipcMain.handle("reactivate-employee", (_, id) => {
    requirePermission("employees.delete");
    const result = dbProxy.prepare("UPDATE employees SET employmentStatus = 'active', isActive = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(id, getActiveBusinessId());
    return result;
  });
  electron.ipcMain.handle("get-employee-accounts", () => {
    requirePermission("settings.users");
    return dbProxy.prepare(`
      SELECT ea.*, e.firstName, e.lastName, e.employeeCode, r.name as roleName
      FROM employee_accounts ea
      LEFT JOIN employees e ON ea.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
      WHERE e.businessId = ?
      ORDER BY e.firstName, e.lastName
    `).all(getActiveBusinessId());
  });
  electron.ipcMain.handle("insert-employee-account", (_, data) => {
    requirePermission("settings.users");
    if (!data.username || !data.username.trim()) throw new Error("Username is required");
    if (!data.pin || data.pin.length < 4) throw new Error("PIN must be at least 4 characters");
    const empBiz = dbProxy.prepare("SELECT businessId FROM employees WHERE id = ?").get(data.employeeId);
    if (!empBiz || empBiz.businessId !== getActiveBusinessId()) throw new Error("Employee not found in this business");
    const hash = hashPin(data.pin);
    const result = dbProxy.prepare("INSERT INTO employee_accounts (employeeId, username, pin, forcePasswordChange) VALUES (?, ?, ?, ?)").run(data.employeeId, data.username, hash, data.forcePasswordChange ? 1 : 0);
    return result.lastInsertRowid;
  });
  electron.ipcMain.handle("update-employee-account", (_, id, data) => {
    requirePermission("settings.users");
    const acctBiz = dbProxy.prepare("SELECT e.businessId FROM employee_accounts ea LEFT JOIN employees e ON ea.employeeId = e.id WHERE ea.id = ?").get(id);
    if (!acctBiz || acctBiz.businessId !== getActiveBusinessId()) throw new Error("Account not found in this business");
    if (data.pin) {
      const hash = hashPin(data.pin);
      dbProxy.prepare("UPDATE employee_accounts SET username = ?, pin = ?, isActive = ?, forcePasswordChange = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(data.username, hash, data.isActive !== void 0 ? data.isActive ? 1 : 0 : 1, data.forcePasswordChange ? 1 : 0, id);
    } else {
      dbProxy.prepare("UPDATE employee_accounts SET username = ?, isActive = ?, forcePasswordChange = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(data.username, data.isActive !== void 0 ? data.isActive ? 1 : 0 : 1, data.forcePasswordChange ? 1 : 0, id);
    }
  });
  electron.ipcMain.handle("delete-employee-account", (_, id) => {
    requirePermission("settings.users");
    const acctBiz = dbProxy.prepare("SELECT e.businessId FROM employee_accounts ea LEFT JOIN employees e ON ea.employeeId = e.id WHERE ea.id = ?").get(id);
    if (!acctBiz || acctBiz.businessId !== getActiveBusinessId()) throw new Error("Account not found in this business");
    dbProxy.prepare("DELETE FROM employee_accounts WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("lock-employee-account", (_, id) => {
    requirePermission("settings.users");
    const acctBiz = dbProxy.prepare("SELECT e.businessId FROM employee_accounts ea LEFT JOIN employees e ON ea.employeeId = e.id WHERE ea.id = ?").get(id);
    if (!acctBiz || acctBiz.businessId !== getActiveBusinessId()) throw new Error("Account not found in this business");
    const lockUntil = new Date(Date.now() + 30 * 60 * 1e3).toISOString();
    dbProxy.prepare("UPDATE employee_accounts SET isActive = 0, lockedUntil = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(lockUntil, id);
  });
  electron.ipcMain.handle("unlock-employee-account", (_, id) => {
    requirePermission("settings.users");
    const acctBiz = dbProxy.prepare("SELECT e.businessId FROM employee_accounts ea LEFT JOIN employees e ON ea.employeeId = e.id WHERE ea.id = ?").get(id);
    if (!acctBiz || acctBiz.businessId !== getActiveBusinessId()) throw new Error("Account not found in this business");
    dbProxy.prepare("UPDATE employee_accounts SET isActive = 1, lockedUntil = NULL, failedLoginAttempts = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("reset-employee-password", (_, id, newPin) => {
    requirePermission("settings.users");
    const acct = dbProxy.prepare("SELECT ea.id, ea.employeeId, e.roleId, r.name as roleName FROM employee_accounts ea LEFT JOIN employees e ON ea.employeeId = e.id LEFT JOIN employee_roles r ON e.roleId = r.id WHERE ea.id = ? AND e.businessId = ?").get(id, getActiveBusinessId());
    if (!acct) return { success: false, error: "Account not found" };
    if (acct.roleName === "Owner") return { success: false, error: "Cannot reset PIN for Owner role" };
    const hash = hashPin(newPin);
    dbProxy.prepare("UPDATE employee_accounts SET pin = ?, forcePasswordChange = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(hash, id);
    dbProxy.prepare("INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)").run("employee_account", id, "pin_reset", currentUserName || "unknown", null, "PIN reset by super admin");
    insertAuditLog("pin_reset", "employee_account", id, "pin", "REDACTED", "REDACTED", `PIN reset for account #${id} by ${currentUserName || "unknown"}`);
    return { success: true };
  });
  electron.ipcMain.handle("generate-recovery-key", (_, entityType, entityId) => {
    requirePermission("settings.users");
    if (entityType === "employee") {
      const empBiz = dbProxy.prepare("SELECT businessId FROM employees WHERE id = ?").get(entityId);
      if (!empBiz || empBiz.businessId !== getActiveBusinessId()) throw new Error("Employee not found in this business");
    }
    const recoveryKey = crypto$1.randomBytes(32).toString("hex");
    const hint = recoveryKey.slice(0, 8) + "..." + recoveryKey.slice(-4);
    const hash = hashPin(recoveryKey);
    const existing = dbProxy.prepare("SELECT id FROM pin_recovery_keys WHERE employeeId = ? OR adminId = ?").get(entityType === "employee" ? entityId : null, entityType === "admin" ? entityId : null);
    if (existing) {
      dbProxy.prepare("UPDATE pin_recovery_keys SET recoveryKey = ?, keyHint = ?, usedAt = NULL, createdAt = CURRENT_TIMESTAMP WHERE id = ?").run(hash, hint, existing.id);
    } else {
      const empCol = entityType === "employee" ? entityId : null;
      const admCol = entityType === "admin" ? entityId : null;
      dbProxy.prepare("INSERT INTO pin_recovery_keys (employeeId, adminId, recoveryKey, keyHint) VALUES (?, ?, ?, ?)").run(empCol, admCol, hash, hint);
    }
    dbProxy.prepare("INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)").run(entityType === "employee" ? "employee_account" : "admin", entityId, "recovery_key_generated", currentUserName || "unknown", null, "Recovery key generated");
    insertAuditLog("generate_recovery_key", entityType === "employee" ? "employee_account" : "admin", entityId, null, null, null, `Recovery key generated for ${entityType} #${entityId} by ${currentUserName || "unknown"}`);
    return { recoveryKey, hint };
  });
  electron.ipcMain.handle("verify-recovery-key", (_, username, recoveryKey) => {
    let empId = null;
    let admId = null;
    const empAccount = dbProxy.prepare("SELECT ea.id as accountId, ea.employeeId FROM employee_accounts ea WHERE ea.username = ?").get(username);
    if (empAccount) {
      empId = empAccount.employeeId;
    } else {
      const admin = dbProxy.prepare("SELECT id FROM admins WHERE username = ?").get(username);
      if (admin) {
        admId = admin.id;
      }
    }
    if (!empId && !admId) return { valid: false, error: "Account not found" };
    let record = null;
    if (empId) {
      record = dbProxy.prepare("SELECT * FROM pin_recovery_keys WHERE employeeId = ?").get(empId);
    }
    if (!record && admId) {
      record = dbProxy.prepare("SELECT * FROM pin_recovery_keys WHERE adminId = ?").get(admId);
    }
    if (!record) return { valid: false, error: "No recovery key found for this account" };
    if (record.usedAt) return { valid: false, error: "Recovery key has already been used" };
    if (!verifyPin(recoveryKey, record.recoveryKey)) return { valid: false, error: "Invalid recovery key" };
    return { valid: true, accountId: empId || admId, isEmployee: !!empId };
  });
  electron.ipcMain.handle("reset-pin-with-recovery", (_, username, recoveryKey, newPin) => {
    let empId = null;
    let admId = null;
    const empAccount = dbProxy.prepare("SELECT ea.id as accountId, ea.employeeId FROM employee_accounts ea WHERE ea.username = ?").get(username);
    if (empAccount) {
      empId = empAccount.employeeId;
    } else {
      const admin = dbProxy.prepare("SELECT id FROM admins WHERE username = ?").get(username);
      if (admin) {
        admId = admin.id;
      }
    }
    if (!empId && !admId) return { success: false, error: "Account not found" };
    let record = null;
    if (empId) {
      record = dbProxy.prepare("SELECT * FROM pin_recovery_keys WHERE employeeId = ?").get(empId);
    }
    if (!record && admId) {
      record = dbProxy.prepare("SELECT * FROM pin_recovery_keys WHERE adminId = ?").get(admId);
    }
    if (!record) return { success: false, error: "No recovery key found" };
    if (record.usedAt) return { success: false, error: "Recovery key has already been used" };
    if (!verifyPin(recoveryKey, record.recoveryKey)) return { success: false, error: "Invalid recovery key" };
    dbProxy.prepare("UPDATE pin_recovery_keys SET usedAt = CURRENT_TIMESTAMP WHERE id = ?").run(record.id);
    const hash = hashPin(newPin);
    if (empId) {
      const existingAcct = dbProxy.prepare("SELECT id FROM employee_accounts WHERE employeeId = ?").get(empId);
      if (existingAcct) {
        dbProxy.prepare("UPDATE employee_accounts SET pin = ?, forcePasswordChange = 0, failedLoginAttempts = 0, lockedUntil = NULL, isActive = 1, updatedAt = CURRENT_TIMESTAMP WHERE employeeId = ?").run(hash, empId);
      }
    }
    if (admId) {
      dbProxy.prepare("UPDATE admins SET pin = ? WHERE id = ?").run(hash, admId);
    }
    const targetId = (empId || admId) ?? void 0;
    dbProxy.prepare("INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)").run("employee_account", targetId, "pin_recovery_reset", username, null, "PIN reset via recovery key");
    insertAuditLog("pin_recovery_reset", "account", targetId ?? null, "pin", "REDACTED", "REDACTED", `PIN reset via recovery key for ${username}`);
    return { success: true };
  });
  electron.ipcMain.handle("lock-user-account", (_, id) => {
    requirePermission("settings.users");
    const lockUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3).toISOString();
    const acct = dbProxy.prepare("SELECT ea.*, e.firstName, e.lastName, r.name as roleName FROM employee_accounts ea LEFT JOIN employees e ON ea.employeeId = e.id LEFT JOIN employee_roles r ON e.roleId = r.id WHERE ea.id = ?").get(id);
    if (!acct) return { success: false, error: "Account not found" };
    if (acct.roleName === "Owner") return { success: false, error: "Cannot lock an Owner account" };
    dbProxy.prepare("UPDATE employee_accounts SET isActive = 0, lockedUntil = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(lockUntil, id);
    dbProxy.prepare("INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)").run("employee_account", id, "account_locked", currentUserName || "unknown", null, `Account locked`);
    insertAuditLog("lock_account", "employee_account", id, "isActive", "1", "0", `Account #${id} locked by ${currentUserName || "unknown"}`);
    return { success: true };
  });
  electron.ipcMain.handle("unlock-user-account", (_, id) => {
    requirePermission("settings.users");
    const acct = dbProxy.prepare("SELECT id FROM employee_accounts WHERE id = ?").get(id);
    if (!acct) return { success: false, error: "Account not found" };
    dbProxy.prepare("UPDATE employee_accounts SET isActive = 1, lockedUntil = NULL, failedLoginAttempts = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    dbProxy.prepare("INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)").run("employee_account", id, "account_unlocked", currentUserName || "unknown", null, `Account unlocked`);
    insertAuditLog("unlock_account", "employee_account", id, "isActive", "0", "1", `Account #${id} unlocked by ${currentUserName || "unknown"}`);
    return { success: true };
  });
  electron.ipcMain.handle("force-pin-change", (_, id) => {
    requirePermission("settings.users");
    const acct = dbProxy.prepare("SELECT ea.id, e.roleId, r.name as roleName FROM employee_accounts ea LEFT JOIN employees e ON ea.employeeId = e.id LEFT JOIN employee_roles r ON e.roleId = r.id WHERE ea.id = ?").get(id);
    if (!acct) return { success: false, error: "Account not found" };
    if (acct.roleName === "Owner") return { success: false, error: "Cannot force PIN change for Owner role" };
    dbProxy.prepare("UPDATE employee_accounts SET forcePasswordChange = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    dbProxy.prepare("INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)").run("employee_account", id, "force_pin_change", currentUserName || "unknown", null, `Forced PIN change`);
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
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("login-employee", (_, username, pin) => {
    const account = dbProxy.prepare(`
      SELECT ea.*, e.firstName, e.lastName, e.id as employeeId, e.roleId,
        e.businessId as employeeBusinessId,
        e.role_key as roleKey, e.permissions_json as permissionsJson,
        r.name as roleName, r.permissions as rolePermissions
      FROM employee_accounts ea
      LEFT JOIN employees e ON ea.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
      WHERE ea.username = ?
    `).get(username);
    if (!account) {
      dbProxy.prepare("INSERT INTO login_history (accountId, action) VALUES (?, ?)").run(null, "failed_login: user not found");
      return null;
    }
    if (account.lockedUntil && new Date(account.lockedUntil) > /* @__PURE__ */ new Date()) {
      dbProxy.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "failed_login: account locked");
      return { error: "locked", lockedUntil: account.lockedUntil };
    }
    if (!account.isActive) {
      dbProxy.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "failed_login: inactive");
      return { error: "inactive" };
    }
    if (!verifyPin(pin, account.pin)) {
      const attempts = (account.failedLoginAttempts || 0) + 1;
      if (attempts >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1e3).toISOString();
        dbProxy.prepare("UPDATE employee_accounts SET failedLoginAttempts = ?, lockedUntil = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(attempts, lockUntil, account.id);
        dbProxy.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "failed_login: locked after 5 attempts");
        return { error: "locked", lockedUntil: lockUntil };
      }
      dbProxy.prepare("UPDATE employee_accounts SET failedLoginAttempts = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(attempts, account.id);
      dbProxy.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "failed_login: wrong pin");
      return null;
    }
    dbProxy.prepare("UPDATE employee_accounts SET lastLogin = CURRENT_TIMESTAMP, failedLoginAttempts = 0, lockedUntil = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(account.id);
    dbProxy.prepare("INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)").run(account.id, account.employeeId, "login");
    currentUserName = `${account.firstName} ${account.lastName}`;
    currentUserRole = account.roleName || "employee";
    const rolePerms = account.rolePermissions ? JSON.parse(account.rolePermissions) : [];
    currentUserPermissions = rolePerms.length > 0 ? rolePerms : ["*"];
    currentUserBusinessId = account.employeeBusinessId ?? null;
    currentUserSharedPerms = resolveSharedPermissions(account.roleKey, account.permissionsJson);
    if (currentUserBusinessId) setActiveBusinessId(currentUserBusinessId);
    return {
      id: account.employeeId,
      accountId: account.id,
      username: account.username,
      firstName: account.firstName,
      lastName: account.lastName,
      businessId: account.employeeBusinessId ?? null,
      roleName: account.roleName,
      roleId: account.roleId,
      permissions: account.rolePermissions ? JSON.parse(account.rolePermissions) : [],
      roleKey: account.roleKey || null,
      sharedPermissions: currentUserSharedPerms,
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
    const offset = options?.offset ?? 0;
    query += " LIMIT ? OFFSET ?";
    params.push(listLimit, offset);
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("clock-in", (_, employeeId, notes) => {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const now2 = (/* @__PURE__ */ new Date()).toISOString();
    const existing = dbProxy.prepare("SELECT id FROM attendance WHERE employeeId = ? AND date = ?").get(employeeId, today);
    if (existing) throw new Error("Already clocked in today");
    const result = dbProxy.prepare("INSERT INTO attendance (employeeId, date, clockIn, status, notes) VALUES (?, ?, ?, ?, ?)").run(employeeId, today, now2, "present", notes || null);
    return result.lastInsertRowid;
  });
  electron.ipcMain.handle("clock-out", (_, employeeId, notes) => {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const now2 = (/* @__PURE__ */ new Date()).toISOString();
    const existing = dbProxy.prepare("SELECT id, clockIn FROM attendance WHERE employeeId = ? AND date = ?").get(employeeId, today);
    if (!existing) throw new Error("Not clocked in today");
    if (existing.clockOut) throw new Error("Already clocked out today");
    const clockIn = new Date(existing.clockIn);
    const clockOut = new Date(now2);
    const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1e3 * 60 * 60);
    const status = hoursWorked >= 8 ? "present" : hoursWorked >= 4 ? "partial" : "short";
    dbProxy.prepare("UPDATE attendance SET clockOut = ?, status = ?, notes = ? WHERE id = ?").run(now2, status, notes || null, existing.id);
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
    const offset = options?.offset ?? 0;
    query += " LIMIT ? OFFSET ?";
    params.push(listLimit, offset);
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-today-attendance", () => {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    return dbProxy.prepare(`
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
    const offset = options?.offset ?? 0;
    query += " LIMIT ? OFFSET ?";
    params.push(listLimit, offset);
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("update-employee-performance", (_, data) => {
    requirePermission("employees.edit");
    const existing = dbProxy.prepare("SELECT id FROM employee_performance WHERE employeeId = ? AND period = ?").get(data.employeeId, data.period);
    if (existing) {
      dbProxy.prepare(`UPDATE employee_performance SET salesAmount = ?, ordersProcessed = ?, attendanceScore = ?, tasksCompleted = ?, rating = ?, notes = ? WHERE id = ?`).run(data.salesAmount || 0, data.ordersProcessed || 0, data.attendanceScore || 0, data.tasksCompleted || 0, data.rating || null, data.notes || null, existing.id);
    } else {
      dbProxy.prepare(`INSERT INTO employee_performance (employeeId, period, salesAmount, ordersProcessed, attendanceScore, tasksCompleted, rating, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(data.employeeId, data.period, data.salesAmount || 0, data.ordersProcessed || 0, data.attendanceScore || 0, data.tasksCompleted || 0, data.rating || null, data.notes || null);
    }
  });
  electron.ipcMain.handle("get-employee-stats", () => {
    const total = dbProxy.prepare("SELECT COUNT(*) as count FROM employees").get();
    const active = dbProxy.prepare("SELECT COUNT(*) as count FROM employees WHERE isActive = 1").get();
    const online = dbProxy.prepare("SELECT COUNT(*) as count FROM employee_accounts WHERE isActive = 1 AND lastLogin IS NOT NULL AND lastLogin >= datetime('now', '-24 hours')").get();
    const pendingApprovals = dbProxy.prepare("SELECT COUNT(*) as count FROM employees WHERE employmentStatus = 'pending'").get();
    const clockedIn = (() => {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const row = dbProxy.prepare("SELECT COUNT(*) as count FROM attendance WHERE date = ? AND clockIn IS NOT NULL AND clockOut IS NULL").get(today);
      return row.count;
    })();
    const departments = dbProxy.prepare("SELECT department, COUNT(*) as count FROM employees WHERE department IS NOT NULL AND department != '' GROUP BY department ORDER BY count DESC").all();
    return { total: total.count, active: active.count, online: online.count, pendingApprovals: pendingApprovals.count, clockedIn, departments };
  });
  electron.ipcMain.handle("get-shipments", (_, options) => {
    requirePermission("shipments");
    let query = `SELECT * FROM shipments WHERE businessId = ?`;
    const params = [getActiveBusinessId()];
    if (options?.status) {
      query += " AND status = ?";
      params.push(options.status);
    }
    if (options?.search) {
      query += " AND (LOWER(destination) LIKE LOWER(?) OR LOWER(driverName) LIKE LOWER(?) OR LOWER(notes) LIKE LOWER(?))";
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
    const offset = options?.offset ?? 0;
    query += " LIMIT ? OFFSET ?";
    params.push(listLimit, offset);
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-shipment", (_, id) => {
    requirePermission("shipments");
    const shipment = dbProxy.prepare("SELECT * FROM shipments WHERE id = ?").get(id);
    const items = dbProxy.prepare("SELECT * FROM shipment_items WHERE shipmentId = ?").all(id);
    const history = dbProxy.prepare("SELECT * FROM shipment_history WHERE shipmentId = ? ORDER BY createdAt DESC").all(id);
    return { ...shipment, items, history };
  });
  electron.ipcMain.handle("insert-shipment", (_, data) => {
    requirePermission("shipments");
    const bizId = getActiveBusinessId();
    const result = dbProxy.prepare(`
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
    dbProxy.prepare("INSERT INTO shipment_history (shipmentId, status, changedBy, notes) VALUES (?, ?, ?, ?)").run(shipmentId, "pending", data.createdBy || null, "Shipment created");
    return shipmentId;
  });
  electron.ipcMain.handle("update-shipment", (_, id, data) => {
    requirePermission("shipments");
    return dbProxy.prepare(`
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
    requirePermission("shipments");
    const validStatuses = ["pending", "in_transit", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) throw new Error("Invalid status");
    const updates = ["status = ?", "updatedAt = CURRENT_TIMESTAMP"];
    const params = [status];
    if (status === "delivered") {
      updates.push("deliveredAt = CURRENT_TIMESTAMP");
    }
    params.push(id);
    dbProxy.prepare(`UPDATE shipments SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    dbProxy.prepare("INSERT INTO shipment_history (shipmentId, status, changedBy, notes) VALUES (?, ?, ?, ?)").run(id, status, changedBy || null, notes || null);
    return { success: true };
  });
  electron.ipcMain.handle("delete-shipment", (_, id) => {
    requirePermission("shipments");
    return dbProxy.prepare("DELETE FROM shipments WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("get-shipment-history", (_, shipmentId) => {
    requirePermission("shipments");
    return dbProxy.prepare("SELECT * FROM shipment_history WHERE shipmentId = ? ORDER BY createdAt DESC").all(shipmentId);
  });
  electron.ipcMain.handle("get-suppliers", (_, options = {}) => {
    requirePermission("suppliers.view");
    const bizId = getActiveBusinessId();
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    const search = options.search ? `%${options.search}%` : null;
    const status = options.status || null;
    let where = "s.businessId = ?";
    const params = [bizId];
    if (search) {
      where += " AND (LOWER(s.supplierName) LIKE LOWER(?) OR LOWER(s.companyName) LIKE LOWER(?) OR LOWER(s.phone) LIKE LOWER(?) OR LOWER(s.email) LIKE LOWER(?))";
      params.push(search, search, search, search);
    }
    if (status === "active") where += " AND s.isActive = 1";
    if (status === "inactive") where += " AND s.isActive = 0";
    const rows = dbProxy.prepare(`
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
    const total = dbProxy.prepare(`SELECT COUNT(*) AS c FROM suppliers s WHERE ${where}`).get(...params).c;
    return { rows, total };
  });
  electron.ipcMain.handle("get-supplier", (_, id) => {
    requirePermission("suppliers.view");
    getActiveBusinessId();
    const supplier = dbProxy.prepare("SELECT * FROM suppliers WHERE id = ?").get(id);
    if (!supplier) return null;
    const stats = dbProxy.prepare(`
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
    requirePermission("suppliers.add");
    const name = data.supplierName?.trim();
    if (!name) throw new Error("Supplier name is required");
    if (name.length > 200) throw new Error("Supplier name must be 200 characters or less");
    const phone = data.phone ? String(data.phone).trim() : "";
    if (phone.length > 30) throw new Error("Phone must be 30 characters or less");
    if (phone && phone.length > 0 && (phone.length < 7 || phone.length > 20 || !/^[+\d\s\-\(\)]+$/.test(phone))) {
      throw new Error("Invalid phone number");
    }
    if (data.email && data.email.trim()) {
      const email = data.email.trim();
      if (email.length > 100) throw new Error("Email must be 100 characters or less");
      if (email.length > 5 && !/^[^\s@]+@[^\s@]+/.test(email)) {
        throw new Error("Invalid email address");
      }
    }
    const bizId = getActiveBusinessId();
    const dup = dbProxy.prepare(`
      SELECT id FROM suppliers WHERE businessId = ? AND LOWER(supplierName) = LOWER(?)
    `).get(bizId, data.supplierName);
    if (dup) throw new Error("A supplier with this name already exists");
    const code = data.supplierCode || `SUP-${Date.now().toString().slice(-7)}`;
    const creditLimit = data.creditLimit ? validateNonNegative(data.creditLimit, "Credit limit") : 0;
    const res = dbProxy.prepare(`
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
    requirePermission("suppliers.add");
    const name = data.supplierName?.trim();
    if (!name) throw new Error("Supplier name is required");
    if (name.length > 200) throw new Error("Supplier name must be 200 characters or less");
    const phone = data.phone ? String(data.phone).trim() : "";
    if (phone.length > 30) throw new Error("Phone must be 30 characters or less");
    if (phone && phone.length > 0 && (phone.length < 7 || phone.length > 20 || !/^[+\d\s\-\(\)]+$/.test(phone))) {
      throw new Error("Invalid phone number");
    }
    if (data.email && data.email.trim()) {
      const email = data.email.trim();
      if (email.length > 100) throw new Error("Email must be 100 characters or less");
      if (email.length > 5 && !/^[^\s@]+@[^\s@]+/.test(email)) {
        throw new Error("Invalid email address");
      }
    }
    const dup = dbProxy.prepare(`
      SELECT id FROM suppliers WHERE id != ? AND LOWER(supplierName) = LOWER(?)
    `).get(id, data.supplierName);
    if (dup) throw new Error("A supplier with this name already exists");
    const creditLimit = data.creditLimit != null ? validateNonNegative(data.creditLimit, "Credit limit") : 0;
    dbProxy.prepare(`
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
    dbProxy.prepare("UPDATE suppliers SET isActive = 0, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run("inactive", id);
    dbProxy.prepare("SELECT supplierName FROM suppliers WHERE id = ?").get(id);
    return { success: true };
  });
  electron.ipcMain.handle("restore-supplier", (_, id) => {
    dbProxy.prepare("UPDATE suppliers SET isActive = 1, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run("active", id);
    dbProxy.prepare("SELECT supplierName FROM suppliers WHERE id = ?").get(id);
    return { success: true };
  });
  electron.ipcMain.handle("delete-supplier", (_, id) => {
    const purchases = dbProxy.prepare("SELECT COUNT(*) AS c FROM supplier_purchases WHERE supplierId = ?").get(id);
    if (purchases.c > 0) throw new Error("Cannot delete supplier with existing purchases. Archive instead.");
    dbProxy.prepare("SELECT supplierName FROM suppliers WHERE id = ?").get(id);
    dbProxy.prepare("DELETE FROM suppliers WHERE id = ?").run(id);
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
    const rows = dbProxy.prepare(`
      SELECT sp.*, s.supplierName, s.companyName,
        (sp.totalAmount - sp.paidAmount) AS remainingBalance,
        (SELECT COUNT(*) FROM supplier_purchase_items WHERE purchaseId = sp.id) AS productCount
      FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId
      WHERE ${where}
      ORDER BY sp.purchaseDate DESC, sp.id DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    const total = dbProxy.prepare(`SELECT COUNT(*) AS c FROM supplier_purchases sp WHERE ${where}`).get(...params).c;
    return { rows, total };
  });
  electron.ipcMain.handle("get-supplier-purchase", (_, id) => {
    const purchase = dbProxy.prepare(`
      SELECT sp.*, s.supplierName, s.companyName
      FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId
      WHERE sp.id = ?
    `).get(id);
    if (!purchase) return null;
    const items = dbProxy.prepare("SELECT * FROM supplier_purchase_items WHERE purchaseId = ?").all(id);
    return { ...purchase, items };
  });
  function logSupplierActivity(supplierId, action, entityType, entityId, description) {
    try {
      dbProxy.prepare("INSERT INTO supplier_activity_log (supplierId, action, description, entityType, entityId, createdBy) VALUES (?, ?, ?, ?, ?, ?)").run(supplierId, action, description, entityType, entityId, currentUserName || "system");
      dbProxy.prepare("UPDATE suppliers SET lastActivityDate = CURRENT_TIMESTAMP WHERE id = ?").run(supplierId);
    } catch (_) {
    }
  }
  electron.ipcMain.handle("insert-supplier-purchase", (_, data) => {
    requirePermission("purchases.create");
    if (!data.purchaseDate) throw new Error("Purchase date is required");
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("At least one item is required");
    }
    const totalAmount = validateNonNegative(data.totalAmount, "Total amount");
    const purchaseNumber = data.purchaseNumber || `PO-${Date.now().toString().slice(-8)}`;
    const bizId = getActiveBusinessId();
    let supplierId = Number(data.supplierId) || 0;
    const supplierName = data.supplierName ? String(data.supplierName).trim() : "";
    if (supplierId) {
      const s = dbProxy.prepare("SELECT id FROM suppliers WHERE id = ?").get(supplierId);
      if (!s) throw new Error("Supplier not found. Please pick a valid supplier.");
    } else {
      if (!supplierName) throw new Error("Supplier is required");
      const existing = dbProxy.prepare("SELECT id FROM suppliers WHERE businessId = ? AND LOWER(supplierName) = LOWER(?)").get(bizId, supplierName) || dbProxy.prepare("SELECT id FROM suppliers WHERE LOWER(supplierName) = LOWER(?)").get(supplierName);
      if (existing) {
        supplierId = existing.id;
      } else {
        const code = `SUP-${Date.now().toString().slice(-7)}`;
        const res = dbProxy.prepare("INSERT INTO suppliers (businessId, supplierCode, supplierName, status, isActive) VALUES (?, ?, ?, ?, 1)").run(bizId, code, supplierName, "active");
        supplierId = Number(res.lastInsertRowid);
      }
    }
    const defWhId = getDefaultWarehouseId();
    const insertPurchase = dbProxy.transaction(() => {
      const res = dbProxy.prepare(`
        INSERT INTO supplier_purchases (
          businessId, supplierId, purchaseNumber, purchaseDate,
          totalAmount, paidAmount, dueDate, status, notes, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        bizId,
        supplierId,
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
      const insertItem = dbProxy.prepare(`
        INSERT INTO supplier_purchase_items (
          purchaseId, itemId, itemName, sku, quantity, unit, unitPrice, totalPrice
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const updateItemStock = dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, lastPurchaseDate = ?, lastPurchasePrice = ? WHERE id = ?");
      const upsertWh = dbProxy.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?) ON CONFLICT(warehouseId, itemId) DO UPDATE SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP");
      const insertSm = dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceId, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
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
          const realItem = dbProxy.prepare("SELECT id FROM items WHERE id = ?").get(it.itemId);
          if (realItem) {
            updateItemStock.run(qty, data.purchaseDate, price, it.itemId);
            upsertWh.run(defWhId, it.itemId, qty, qty);
            insertSm.run(defWhId, it.itemId, "purchase_in", qty, purchaseId, "supplier_purchase", `Purchase ${purchaseNumber} - ${it.itemName}`);
          }
        }
      }
      return purchaseId;
    });
    const id = insertPurchase();
    logSupplierActivity(supplierId, "purchase_created", "supplier_purchase", id, `Purchase ${purchaseNumber} created for $${totalAmount}`);
    try {
      dbProxy.prepare(`INSERT INTO notifications (businessId, type, category, title, message, severity) VALUES (?, ?, ?, ?, ?, ?)`).run(bizId, "purchase_created", "suppliers", "New Purchase Created", `Purchase ${purchaseNumber} for supplier #${supplierId}`, "info");
    } catch (_2) {
    }
    return { id };
  });
  electron.ipcMain.handle("update-supplier-purchase-status", (_, id, status, notes) => {
    requirePermission("purchases.create");
    const validStatuses = ["draft", "pending", "approved", "ordered", "received", "cancelled"];
    if (!validStatuses.includes(status)) throw new Error("Invalid status");
    const prev = dbProxy.prepare("SELECT status, supplierId FROM supplier_purchases WHERE id = ?").get(id);
    if (!prev) throw new Error("Purchase not found");
    const prevStatus = prev.status;
    dbProxy.prepare("UPDATE supplier_purchases SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(status, id);
    if (status === "received" && prevStatus !== "received") {
      const defWhId = getDefaultWarehouseId();
      const items = dbProxy.prepare("SELECT * FROM supplier_purchase_items WHERE purchaseId = ?").all(id);
      const purchase = dbProxy.prepare("SELECT purchaseNumber, supplierId FROM supplier_purchases WHERE id = ?").get(id);
      const updateItemStock = dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, lastPurchaseDate = CURRENT_TIMESTAMP, lastPurchasePrice = ? WHERE id = ?");
      const upsertWh = dbProxy.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?) ON CONFLICT(warehouseId, itemId) DO UPDATE SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP");
      const insertSm = dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceId, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
      const updateReceived = dbProxy.prepare("UPDATE supplier_purchase_items SET receivedQuantity = receivedQuantity + ? WHERE id = ?");
      const receiveTxn = dbProxy.transaction(() => {
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
        dbProxy.prepare(`INSERT INTO notifications (businessId, type, category, title, message, severity) VALUES (?, ?, ?, ?, ?, ?)`).run(bizId2, "purchase_received", "suppliers", "Purchase Order Received", `Purchase order #${id} marked as ${status}`, "success");
      } catch (_2) {
      }
    }
    return { success: true };
  });
  electron.ipcMain.handle("delete-supplier-purchase", (_, id) => {
    requirePermission("purchases.create");
    const row = dbProxy.prepare("SELECT purchaseNumber, supplierId FROM supplier_purchases WHERE id = ?").get(id);
    if (!row) throw new Error("Purchase not found");
    const payCheck = dbProxy.prepare("SELECT paidAmount FROM supplier_purchases WHERE id = ?").get(id);
    if (payCheck && payCheck.paidAmount > 0) {
      throw new Error("Cannot delete a purchase with payments. Delete payments first.");
    }
    const transaction = dbProxy.transaction(() => {
      const items = dbProxy.prepare("SELECT * FROM supplier_purchase_items WHERE purchaseId = ?").all(id);
      const defWhId = getDefaultWarehouseId();
      for (const it of items) {
        if (!it.itemId) continue;
        const receivedQty = it.receivedQuantity || 0;
        if (receivedQty > 0) {
          dbProxy.prepare("UPDATE items SET totalBaseQuantity = MAX(0, totalBaseQuantity - ?) WHERE id = ?").run(receivedQty, it.itemId);
          dbProxy.prepare("UPDATE warehouse_inventory SET quantity = MAX(0, quantity - ?) WHERE warehouseId = ? AND itemId = ?").run(receivedQty, defWhId, it.itemId);
          dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceId, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").run(defWhId, it.itemId, "purchase_reversal", -receivedQty, id, "supplier_purchase", `Reversed purchase #${id} - ${it.itemName}`);
        }
      }
      dbProxy.prepare("DELETE FROM supplier_purchase_items WHERE purchaseId = ?").run(id);
      dbProxy.prepare("DELETE FROM supplier_purchases WHERE id = ?").run(id);
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
    const rows = dbProxy.prepare(`
      SELECT pay.*, s.supplierName, sp.purchaseNumber
      FROM supplier_payments pay
      JOIN suppliers s ON s.id = pay.supplierId
      LEFT JOIN supplier_purchases sp ON sp.id = pay.purchaseId
      WHERE ${where}
      ORDER BY pay.paymentDate DESC, pay.id DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    const total = dbProxy.prepare(`SELECT COUNT(*) AS c FROM supplier_payments pay JOIN suppliers s ON s.id = pay.supplierId WHERE ${where}`).get(...params).c;
    return { rows, total };
  });
  electron.ipcMain.handle("insert-supplier-payment", (_, data) => {
    requirePermission("purchases.edit");
    if (!data.supplierId) throw new Error("Supplier is required");
    if (!data.paymentDate) throw new Error("Payment date is required");
    const amount = validatePositive(data.amount, "Amount");
    const validMethods = ["cash", "bank_transfer", "mobile_money", "check", "other"];
    if (!validMethods.includes(data.paymentMethod)) throw new Error("Invalid payment method");
    const bizId = getActiveBusinessId();
    const insertTxn = dbProxy.transaction(() => {
      const targetPurchaseId = data.purchaseId || null;
      let effectivePurchaseId = targetPurchaseId;
      if (!effectivePurchaseId) {
        const oldestOutstanding = dbProxy.prepare(`
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
      const res = dbProxy.prepare(`
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
        dbProxy.prepare(`
          UPDATE supplier_purchases SET paidAmount = paidAmount + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
        `).run(amount, effectivePurchaseId);
        const remaining = dbProxy.prepare("SELECT totalAmount - paidAmount AS r FROM supplier_purchases WHERE id = ?").get(effectivePurchaseId);
        if (remaining && remaining.r <= 0) {
          dbProxy.prepare("UPDATE supplier_purchases SET status = 'received' WHERE id = ? AND status NOT IN ('cancelled')").run(effectivePurchaseId);
        }
      }
      return res.lastInsertRowid;
    });
    const id = insertTxn();
    logSupplierActivity(data.supplierId, "payment_recorded", "supplier_payment", Number(id), `Payment of ${amount} recorded via ${data.paymentMethod}`);
    return { id };
  });
  electron.ipcMain.handle("update-supplier-payment", (_, id, data) => {
    requirePermission("purchases.edit");
    const oldPayment = dbProxy.prepare("SELECT * FROM supplier_payments WHERE id = ?").get(id);
    if (!oldPayment) throw new Error("Payment not found");
    const amount = validatePositive(data.amount, "Amount");
    const validMethods = ["cash", "bank_transfer", "mobile_money", "check", "other"];
    if (!validMethods.includes(data.paymentMethod)) throw new Error("Invalid payment method");
    const purchaseId = data.purchaseId ? Number(data.purchaseId) : oldPayment.purchaseId;
    const updateTxn = dbProxy.transaction(() => {
      dbProxy.prepare(`
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
        const totalPaid = dbProxy.prepare("SELECT COALESCE(SUM(amount), 0) AS tp FROM supplier_payments WHERE purchaseId = ? AND id != ?").get(purchaseId, id).tp;
        const newPaid = totalPaid + amount;
        dbProxy.prepare("UPDATE supplier_purchases SET paidAmount = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(newPaid, purchaseId);
        const remaining = dbProxy.prepare("SELECT totalAmount - paidAmount AS r FROM supplier_purchases WHERE id = ?").get(purchaseId);
        if (remaining && remaining.r <= 0) {
          dbProxy.prepare("UPDATE supplier_purchases SET status = 'received' WHERE id = ? AND status NOT IN ('cancelled')").run(purchaseId);
        } else if (remaining && remaining.r > 0) {
          dbProxy.prepare("UPDATE supplier_purchases SET status = 'pending' WHERE id = ? AND status = 'received'").run(purchaseId);
        }
      }
    });
    updateTxn();
    return { success: true };
  });
  electron.ipcMain.handle("delete-supplier-payment", (_, id) => {
    requirePermission("purchases.edit");
    const payment = dbProxy.prepare("SELECT * FROM supplier_payments WHERE id = ?").get(id);
    if (!payment) throw new Error("Payment not found");
    const reverse = dbProxy.transaction(() => {
      dbProxy.prepare("DELETE FROM supplier_payments WHERE id = ?").run(id);
      if (payment.purchaseId) {
        const totalPaid = dbProxy.prepare("SELECT COALESCE(SUM(amount), 0) AS tp FROM supplier_payments WHERE purchaseId = ?").get(payment.purchaseId).tp;
        dbProxy.prepare("UPDATE supplier_purchases SET paidAmount = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(totalPaid, payment.purchaseId);
      }
    });
    reverse();
    return { success: true };
  });
  electron.ipcMain.handle("get-supplier-products", (_, supplierId) => {
    return dbProxy.prepare(`
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
    const totals = dbProxy.prepare(`
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
    requirePermission("suppliers.edit");
    const current = dbProxy.prepare("SELECT isFavorite FROM suppliers WHERE id = ?").get(id);
    const newVal = current?.isFavorite ? 0 : 1;
    dbProxy.prepare("UPDATE suppliers SET isFavorite = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(newVal, id);
    return { success: true, isFavorite: !!newVal };
  });
  electron.ipcMain.handle("get-supplier-activity-log", (_, supplierId, limit = 20) => {
    return dbProxy.prepare(`
      SELECT * FROM supplier_activity_log WHERE supplierId = ? ORDER BY createdAt DESC LIMIT ?
    `).all(supplierId, limit);
  });
  electron.ipcMain.handle("get-supplier-analytics", (_) => {
    const bizId = getActiveBusinessId();
    const topSuppliers = dbProxy.prepare(`
      SELECT s.id, s.supplierName, COALESCE(SUM(sp.totalAmount), 0) AS totalValue,
        COUNT(sp.id) AS purchaseCount, MAX(sp.purchaseDate) AS lastPurchase
      FROM suppliers s
      LEFT JOIN supplier_purchases sp ON sp.supplierId = s.id
      WHERE s.businessId = ? AND s.isActive = 1
      GROUP BY s.id
      HAVING totalValue > 0
      ORDER BY totalValue DESC LIMIT 10
    `).all(bizId);
    const monthlyTrends = dbProxy.prepare(`
      SELECT strftime('%Y-%m', purchaseDate) AS month,
        COUNT(*) AS purchaseCount, COALESCE(SUM(totalAmount), 0) AS totalAmount
      FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId
      WHERE s.businessId = ? AND purchaseDate >= DATE('now', '-12 months')
      GROUP BY month ORDER BY month
    `).all(bizId);
    const outstandingBySupplier = dbProxy.prepare(`
      SELECT s.supplierName, COALESCE(SUM(sp.totalAmount - sp.paidAmount), 0) AS outstanding
      FROM suppliers s
      LEFT JOIN supplier_purchases sp ON sp.supplierId = s.id
      WHERE s.businessId = ? AND s.isActive = 1
      GROUP BY s.id HAVING outstanding > 0 ORDER BY outstanding DESC
    `).all(bizId);
    const avgPurchase = dbProxy.prepare(`
      SELECT COALESCE(AVG(totalAmount), 0) AS avgValue FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId WHERE s.businessId = ?
    `).get(bizId);
    const summary = dbProxy.prepare(`
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
    return dbProxy.prepare(`
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
    const stats = dbProxy.prepare(`
      SELECT
        (SELECT COUNT(*) FROM suppliers WHERE businessId = ? AND isActive = 1) AS activeSuppliers,
        (SELECT COUNT(*) FROM suppliers WHERE businessId = ?) AS totalSuppliers,
        (SELECT COALESCE(SUM(totalAmount - paidAmount), 0) FROM supplier_purchases WHERE businessId = ? AND status != 'cancelled') AS outstandingBalance,
        (SELECT COALESCE(SUM(totalAmount), 0) FROM supplier_purchases WHERE businessId = ? AND purchaseDate >= DATE('now', 'start of month')) AS monthPurchases
    `).get(bizId, bizId, bizId, bizId);
    const top = dbProxy.prepare(`
      SELECT s.id, s.supplierName, COALESCE(SUM(sp.totalAmount), 0) AS totalValue
      FROM suppliers s
      JOIN supplier_purchases sp ON sp.supplierId = s.id
      WHERE s.businessId = ?
      GROUP BY s.id
      ORDER BY totalValue DESC LIMIT 1
    `).get(bizId);
    const recent = dbProxy.prepare(`
      SELECT id, supplierName, companyName, createdAt FROM suppliers
      WHERE businessId = ? ORDER BY createdAt DESC LIMIT 5
    `).all(bizId);
    return { ...stats, topSupplier: top || null, recent };
  });
  electron.ipcMain.handle("get-supplier-monthly-report", () => {
    const bizId = getActiveBusinessId();
    return dbProxy.prepare(`
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
    return dbProxy.prepare(`
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
  electron.ipcMain.handle("get-draft-sales", () => {
    const bizId = getActiveBusinessId();
    return dbProxy.prepare("SELECT * FROM draft_sales WHERE businessId = ? ORDER BY createdAt DESC").all(bizId);
  });
  electron.ipcMain.handle("get-draft-sale", (_, id) => {
    return dbProxy.prepare("SELECT * FROM draft_sales WHERE id = ?").get(id);
  });
  electron.ipcMain.handle("save-draft-sale", (_, data) => {
    requirePermission("sales.create");
    const bizId = getActiveBusinessId();
    try {
      JSON.parse(JSON.stringify(data.items));
    } catch {
      throw new Error("Invalid items data: must be valid JSON");
    }
    if (data.id) {
      dbProxy.prepare("UPDATE draft_sales SET items = ?, customerName = ?, customerPhone = ?, discount = ?, vat = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(JSON.stringify(data.items), data.customerName || null, data.customerPhone || null, data.discount || 0, data.vat || 0, data.notes || null, data.id, bizId);
      return { success: true };
    }
    const r = dbProxy.prepare("INSERT INTO draft_sales (businessId, items, customerName, customerPhone, discount, vat, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").run(bizId, JSON.stringify(data.items), data.customerName || null, data.customerPhone || null, data.discount || 0, data.vat || 0, data.notes || null);
    return { success: true, id: r.lastInsertRowid };
  });
  electron.ipcMain.handle("delete-draft-sale", (_, id) => {
    requirePermission("sales.create");
    const bizId = getActiveBusinessId();
    return dbProxy.prepare("DELETE FROM draft_sales WHERE id = ? AND businessId = ?").run(id, bizId);
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
    return dbProxy.prepare(q).all(...params);
  });
  electron.ipcMain.handle("insert-contact", (_, data) => {
    requirePermission("contacts.add");
    const bizId = getActiveBusinessId();
    const r = dbProxy.prepare("INSERT INTO contacts (businessId, name, phone, category, subCategory, notes) VALUES (?, ?, ?, ?, ?, ?)").run(bizId, data.name, data.phone, data.category || "other", data.subCategory || null, data.notes || null);
    return { success: true, id: r.lastInsertRowid };
  });
  electron.ipcMain.handle("update-contact", (_, id, data) => {
    requirePermission("contacts.edit");
    const bizId = getActiveBusinessId();
    dbProxy.prepare("UPDATE contacts SET name = ?, phone = ?, category = ?, subCategory = ?, notes = ? WHERE id = ? AND businessId = ?").run(data.name, data.phone, data.category || "other", data.subCategory || null, data.notes || null, id, bizId);
    return { success: true };
  });
  electron.ipcMain.handle("delete-contact", (_, id) => {
    requirePermission("contacts.delete");
    const bizId = getActiveBusinessId();
    dbProxy.prepare("DELETE FROM contacts WHERE id = ? AND businessId = ?").run(id, bizId);
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
    const budgets = dbProxy.prepare(q).all(...params);
    const targetMonth = options?.month || String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0");
    const targetYear = options?.year || String((/* @__PURE__ */ new Date()).getFullYear());
    const startDate = `${targetYear}-${targetMonth}-01`;
    const endDate = new Date(parseInt(targetYear), parseInt(targetMonth), 0).toISOString().split("T")[0];
    const expenses = dbProxy.prepare(
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
    requirePermission("budgets.manage");
    const bizId = getActiveBusinessId();
    const existing = dbProxy.prepare(
      "SELECT id FROM budgets WHERE businessId = ? AND category = ? AND period = ? AND budgetType = ? AND (month = ? OR month IS NULL) AND (year = ? OR year IS NULL)"
    ).get(bizId, data.category, data.period || "monthly", data.budgetType || "business", data.month || null, data.year || null);
    if (existing) {
      dbProxy.prepare("UPDATE budgets SET amount = ?, notes = ?, isRecurring = ?, referenceName = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(data.amount, data.notes || null, data.isRecurring ? 1 : 0, data.referenceName || null, existing.id);
      return { success: true, id: existing.id };
    }
    const r = dbProxy.prepare(
      "INSERT INTO budgets (businessId, category, amount, period, month, year, budgetType, referenceName, isRecurring, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(bizId, data.category, data.amount, data.period || "monthly", data.month || null, data.year || null, data.budgetType || "business", data.referenceName || null, data.isRecurring ? 1 : 0, data.notes || null);
    return { success: true, id: r.lastInsertRowid };
  });
  electron.ipcMain.handle("delete-budget", (_, id) => {
    requirePermission("budgets.manage");
    const bizId = getActiveBusinessId();
    return dbProxy.prepare("DELETE FROM budgets WHERE id = ? AND businessId = ?").run(id, bizId);
  });
  electron.ipcMain.handle("get-budget-adjustments", (_, budgetId) => {
    return dbProxy.prepare("SELECT * FROM budget_adjustments WHERE budgetId = ? ORDER BY createdAt DESC").all(budgetId);
  });
  electron.ipcMain.handle("create-budget-adjustment", (_, data) => {
    requirePermission("budgets.manage");
    const bizId = getActiveBusinessId();
    const r = dbProxy.prepare(
      "INSERT INTO budget_adjustments (budgetId, businessId, previousAmount, newAmount, reason, status, requestedBy) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(data.budgetId, bizId, data.previousAmount, data.newAmount, data.reason, data.status || "pending", data.requestedBy || null);
    return { success: true, id: r.lastInsertRowid };
  });
  electron.ipcMain.handle("approve-budget-adjustment", (_, id, approvedBy) => {
    requirePermission("budgets.manage");
    const adj = dbProxy.prepare("SELECT * FROM budget_adjustments WHERE id = ?").get(id);
    if (!adj) return { success: false, error: "Adjustment not found" };
    dbProxy.prepare("UPDATE budget_adjustments SET status = 'approved', approvedBy = ?, approvedAt = CURRENT_TIMESTAMP WHERE id = ?").run(approvedBy, id);
    dbProxy.prepare("UPDATE budgets SET amount = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(adj.newAmount, adj.budgetId);
    return { success: true };
  });
  electron.ipcMain.handle("duplicate-budget", (_, fromData, toMonth, toYear) => {
    requirePermission("budgets.manage");
    const bizId = getActiveBusinessId();
    const sourceBudgets = dbProxy.prepare(
      "SELECT * FROM budgets WHERE businessId = ? AND month = ? AND year = ?"
    ).all(bizId, fromData.month, fromData.year);
    let count = 0;
    for (const b of sourceBudgets) {
      const existing = dbProxy.prepare(
        "SELECT id FROM budgets WHERE businessId = ? AND category = ? AND period = ? AND month = ? AND year = ? AND budgetType = ?"
      ).get(bizId, b.category, b.period, toMonth, toYear, b.budgetType);
      if (!existing) {
        dbProxy.prepare(
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
    return dbProxy.prepare(q).all(...params);
  });
  electron.ipcMain.handle("acknowledge-budget-alert", (_, id) => {
    requirePermission("budgets.manage");
    dbProxy.prepare("UPDATE budget_alerts SET acknowledged = 1 WHERE id = ?").run(id);
    return { success: true };
  });
  electron.ipcMain.handle("get-budget-report", (_, options) => {
    const bizId = getActiveBusinessId();
    const month = options?.month || String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0");
    const year = options?.year || String((/* @__PURE__ */ new Date()).getFullYear());
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split("T")[0];
    const budgets = dbProxy.prepare("SELECT * FROM budgets WHERE businessId = ? AND (month = ? OR month IS NULL) AND (year = ? OR year IS NULL)").all(bizId, month, year);
    const expenses = dbProxy.prepare("SELECT category, SUM(amount) as spent FROM expenses WHERE businessId = ? AND date >= ? AND date <= ? AND is_deleted = 0 GROUP BY category").all(bizId, startDate, endDate);
    const totalExpenses = dbProxy.prepare("SELECT SUM(amount) as total FROM expenses WHERE businessId = ? AND date >= ? AND date <= ? AND is_deleted = 0").get(bizId, startDate, endDate);
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
    const now2 = /* @__PURE__ */ new Date();
    const forecasts = [];
    const sixMonthsAgo = new Date(now2.getFullYear(), now2.getMonth() - 6, 1).toISOString().split("T")[0];
    const avgSpending = dbProxy.prepare(
      "SELECT category, AVG(monthly) as avgMonthly FROM (SELECT category, strftime('%Y-%m', date) as ym, SUM(amount) as monthly FROM expenses WHERE businessId = ? AND date >= ? AND is_deleted = 0 GROUP BY category, ym) GROUP BY category"
    ).all(bizId, sixMonthsAgo);
    for (let i = 1; i <= months; i++) {
      const forecastMonth = now2.getMonth() + i;
      const forecastYear = now2.getFullYear() + Math.floor(forecastMonth / 12);
      const m = String(forecastMonth % 12 + 1).padStart(2, "0");
      const y = String(forecastYear);
      const budgets = dbProxy.prepare("SELECT SUM(amount) as total FROM budgets WHERE businessId = ? AND (month = ? OR month IS NULL) AND (year = ? OR year IS NULL)").get(bizId, m, y);
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
    return dbProxy.prepare(q).all(...params);
  });
  electron.ipcMain.handle("save-supplier-price-check", (_, data) => {
    requirePermission("purchases.create");
    const bizId = getActiveBusinessId();
    const nextCheck = data.nextCheck || new Date(Date.now() + 7 * 864e5).toISOString();
    if (data.id) {
      dbProxy.prepare("UPDATE supplier_price_checks SET supplierId = ?, itemId = ?, frequency = ?, nextCheck = ?, notes = ?, active = ? WHERE id = ? AND businessId = ?").run(data.supplierId, data.itemId || null, data.frequency || "weekly", nextCheck, data.notes || null, data.active ?? 1, data.id, bizId);
      return { success: true };
    }
    const r = dbProxy.prepare("INSERT INTO supplier_price_checks (businessId, supplierId, itemId, frequency, lastChecked, nextCheck, notes, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(bizId, data.supplierId, data.itemId || null, data.frequency || "weekly", data.lastChecked || null, nextCheck, data.notes || null, data.active ?? 1);
    return { success: true, id: r.lastInsertRowid };
  });
  electron.ipcMain.handle("delete-supplier-price-check", (_, id) => {
    requirePermission("purchases.create");
    const bizId = getActiveBusinessId();
    return dbProxy.prepare("DELETE FROM supplier_price_checks WHERE id = ? AND businessId = ?").run(id, bizId);
  });
  electron.ipcMain.handle("get-quiet-hours", () => {
    const bizId = getActiveBusinessId();
    return dbProxy.prepare("SELECT * FROM notification_quiet_hours WHERE businessId = ?").all(bizId);
  });
  electron.ipcMain.handle("set-quiet-hours", (_, data) => {
    requirePermission("settings.manage");
    const bizId = getActiveBusinessId();
    const existing = dbProxy.prepare("SELECT id FROM notification_quiet_hours WHERE businessId = ?").get(bizId);
    if (existing) {
      dbProxy.prepare("UPDATE notification_quiet_hours SET startTime = ?, endTime = ?, active = ? WHERE id = ?").run(data.startTime, data.endTime, data.active ?? 1, existing.id);
      return { success: true };
    }
    const r = dbProxy.prepare("INSERT INTO notification_quiet_hours (businessId, startTime, endTime, active) VALUES (?, ?, ?, ?)").run(bizId, data.startTime, data.endTime, data.active ?? 1);
    return { success: true, id: r.lastInsertRowid };
  });
  electron.ipcMain.handle("delete-quiet-hours", () => {
    requirePermission("settings.manage");
    const bizId = getActiveBusinessId();
    return dbProxy.prepare("DELETE FROM notification_quiet_hours WHERE businessId = ?").run(bizId);
  });
  function escapeHtml(s) {
    const str = String(s ?? "");
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  electron.ipcMain.handle("print-receipt", async (_e, sale) => {
    try {
      const cfg2 = getPrinterConfig();
      if (cfg2.transport === "network") {
        const bizId = getActiveBusinessId();
        const biz = dbProxy.prepare("SELECT businessName, address FROM businesses WHERE id = ?").get(bizId);
        const tinRow = dbProxy.prepare("SELECT value FROM settings WHERE key = 'tin'").get();
        const unitPrice = sale.quantity ? sale.totalPrice / sale.quantity : sale.totalPrice;
        const paid = sale.paidAmount || sale.totalPrice;
        const change = sale.paymentMethod === "Cash" && sale.paymentStatus !== "Debt" && paid > sale.totalPrice ? paid - sale.totalPrice : 0;
        const commands = buildReceiptCommands({
          lines: [{ name: sale.itemName || "Item", quantity: sale.quantity, unit: sale.unit || "pcs", unitPrice, total: sale.totalPrice }],
          subtotal: sale.totalPrice + (sale.discount || 0) - (sale.vat || 0),
          discount: sale.discount || 0,
          vat: sale.vat || 0,
          taxType: sale.taxType || "VAT",
          total: sale.totalPrice,
          paid,
          change,
          paymentMethod: sale.paymentMethod || "Cash",
          paymentStatus: sale.paymentStatus || "Paid",
          customerName: sale.customerName,
          createdAt: sale.createdAt,
          context: {
            businessName: biz?.businessName || "Shega",
            address: biz?.address,
            tin: tinRow ? tinRow.value : void 0,
            cashier: currentUserName || void 0,
            receiptSerial: sale.id
          }
        });
        await printRaw(commands);
        if (cfg2.autoOpenDrawer && sale.paymentMethod === "Cash" && sale.paymentStatus !== "Debt") {
          await openDrawer();
        }
        return { success: true, transport: "network" };
      }
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
  electron.ipcMain.handle("open-cash-drawer", async () => {
    try {
      await openDrawer();
      insertAuditLog("cash_drawer", "register", null, null, null, "open", `Drawer opened by ${currentUserName || "unknown"}`);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("print-test-page", async () => {
    try {
      await printRaw(buildTestPageCommands());
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("print-label", async (_e, label) => {
    try {
      await printRaw(buildLabelCommands(label, label?.copies || 1));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("get-print-status", async () => {
    const status = getPrintStatus();
    if (status.enabled && status.transport === "network") status.online = await probePrinter();
    return status;
  });
  electron.ipcMain.handle("set-printer-config", (_e, cfg2) => {
    return savePrinterConfig(cfg2);
  });
  electron.ipcMain.handle("parse-scale-reading", (_e, line, config) => {
    return parseWeightLine(line);
  });
  electron.ipcMain.handle("sync:status", () => {
    const now2 = Date.now();
    const peers = dbProxy.prepare("SELECT device_id, name, last_seen_at, created_at FROM devices ORDER BY created_at").all().map((p) => {
      const cursor = dbProxy.prepare("SELECT last_seq, updated_at FROM sync_cursor WHERE device_id = ?").get(p.device_id);
      return {
        deviceId: p.device_id,
        name: p.name,
        lastSeenAt: p.last_seen_at,
        cursorSeq: cursor?.last_seq ?? 0,
        lastSyncAt: cursor?.updated_at ?? null,
        stale: p.last_seen_at ? now2 - new Date(p.last_seen_at).getTime() > 24 * 3600 * 1e3 : true
      };
    });
    return {
      running: syncHub.isRunning(),
      hubId: syncHub.getDeviceId(),
      pairingToken: getPairingToken(),
      lanUrl: getLanAddress(5757),
      port: 5757,
      peers,
      lastSeq: dbProxy.prepare("SELECT COALESCE(MAX(seq),0) AS m FROM sync_outbox").get().m,
      pendingOutbox: dbProxy.prepare("SELECT COUNT(*) AS c FROM sync_outbox").get().c,
      conflicts: dbProxy.prepare("SELECT COUNT(*) AS c FROM sync_log WHERE detail = 'conflict_rejected' OR detail LIKE 'checksum_mismatch'").get().c
    };
  });
  electron.ipcMain.handle("sync:verify", () => {
    return verifyChecksums();
  });
  electron.ipcMain.handle("sync:resync", (_e, deviceId) => {
    if (!deviceId) return { ok: false, error: "device_id required" };
    requestDeviceResync(deviceId);
    return { ok: true };
  });
  electron.ipcMain.handle("sync:log", (_e, limit = 100) => {
    const rows = dbProxy.prepare("SELECT device_id, entity, entity_uuid, op, detail, created_at FROM sync_log ORDER BY id DESC LIMIT ?").all(limit);
    return rows;
  });
  electron.ipcMain.handle("cloud:status", () => getCloudStatus());
  electron.ipcMain.handle("cloud:sync", async () => {
    return syncToCloud();
  });
  electron.ipcMain.handle("cloud:save-config", (_e, url, key) => {
    const urlStr = typeof url === "string" ? url.trim() : "";
    const keyStr = typeof key === "string" ? key.trim() : "";
    let parsed;
    try {
      parsed = new URL(urlStr);
    } catch {
      return { ok: false, error: "invalid cloud URL", configured: false };
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, error: "cloud URL must be http(s)", configured: false };
    }
    if (urlStr.length > 512 || keyStr.length > 256) {
      return { ok: false, error: "cloud config too long", configured: false };
    }
    if (!keyStr) {
      return { ok: false, error: "device key is required", configured: false };
    }
    dbProxy.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('cloud_sync_url', ?)").run(urlStr);
    dbProxy.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('cloud_sync_device_key', ?)").run(keyStr);
    return { ok: true, configured: true };
  });
  electron.ipcMain.handle("cloud:set-enabled", (_e, enabled) => {
    if (typeof enabled !== "boolean") return { ok: false, error: "expected boolean" };
    dbProxy.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('cloud_sync_enabled', ?)").run(String(enabled));
    return { ok: true, enabled };
  });
  electron.ipcMain.handle("cloud:self-status", async () => {
    await refreshCloudStatus();
    const status = dbProxy.prepare("SELECT value FROM settings WHERE key = 'cloud_device_status'").get()?.value ?? null;
    const blocked = dbProxy.prepare("SELECT value FROM settings WHERE key = 'cloud_device_blocked'").get()?.value === "true";
    return { status, blocked };
  });
  const isDevBackup = !electron.app.isPackaged;
  const dbDir2 = isDevBackup ? path.join(process.cwd(), "db") : path.join(electron.app.getPath("userData"), "db");
  const backupDir = path.join(dbDir2, "backups");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  electron.ipcMain.handle("create-backup", async () => {
    requirePermission("settings.backup");
    try {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      const bizId = getActiveBusinessId();
      const biz = dbProxy.prepare("SELECT businessName FROM businesses WHERE id = ?").get(bizId);
      const bizName = (biz?.businessName || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
      const backupName = `shega-backup-${bizName}-${timestamp}.db`;
      const backupPath = path.join(backupDir, backupName);
      dbProxy.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`);
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
      const check = validateDBFile(backupPath);
      if (!check.ok) return { success: false, error: `Backup failed integrity check: ${check.message}` };
      dbProxy.exec("PRAGMA wal_checkpoint(TRUNCATE)");
      reopenDB();
      fs.copyFileSync(backupPath, dbProxy.name);
      reopenDB();
      const verify = validateDBFile(dbProxy.name);
      if (!verify.ok) {
        return { success: false, error: `Restored database failed integrity check: ${verify.message}` };
      }
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
    return dbProxy.prepare(`
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
    const rows = dbProxy.prepare(`
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
    const total = dbProxy.prepare(`SELECT COUNT(*) AS c FROM supplier_purchases sp JOIN suppliers s ON s.id = sp.supplierId WHERE ${where} AND sp.status != 'cancelled'`).get(...params).c;
    const payments = dbProxy.prepare(`
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
    return dbProxy.prepare(`
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
    return dbProxy.prepare(`
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
    return dbProxy.prepare(`
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
    return dbProxy.prepare(`
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
  electron.ipcMain.handle("void-sale", async (event, data) => {
    requirePermission("sales.void");
    const reason = (data?.reason || "").trim();
    if (!reason) throw new Error("A reason is required to void a sale");
    if (!await gateSensitiveAction(event.sender, { context: `Void sale #${data.saleId}` })) {
      throw new Error("Manager approval required — action not executed");
    }
    const sale = dbProxy.prepare("SELECT * FROM sales WHERE id = ?").get(data.saleId);
    if (!sale) throw new Error("Sale not found");
    if (sale.status === "Voided") throw new Error("Sale is already voided");
    const item = dbProxy.prepare("SELECT * FROM items WHERE id = ?").get(sale.itemId);
    const transaction = dbProxy.transaction(() => {
      if (item) {
        let baseRestore = sale.quantity;
        let packRestore = 0;
        if (sale.unitType === "pack") {
          baseRestore = sale.quantity * (item.unitsPerPack || 1);
          packRestore = sale.quantity;
        } else {
          packRestore = Math.round(sale.quantity / (item.unitsPerPack || 1) * 1e6) / 1e6;
        }
        dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, totalPackQuantity = totalPackQuantity + ? WHERE id = ?").run(baseRestore, packRestore, sale.itemId);
        const defWhId = getDefaultWarehouseId();
        const whRow = dbProxy.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, sale.itemId);
        if (whRow) {
          dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(baseRestore, whRow.id);
        } else {
          dbProxy.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, sale.itemId, baseRestore);
        }
        dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, sale.itemId, "void_restore", baseRestore, "void", `Sale #${data.saleId} voided — stock restored`);
      }
      dbProxy.prepare("UPDATE sales SET status = 'Voided', voidReason = ?, voidedBy = ?, voidedAt = CURRENT_TIMESTAMP WHERE id = ?").run(data.reason, currentUserName || "unknown", data.saleId);
      if ((sale.paidAmount || 0) > 0) {
        dbProxy.prepare("UPDATE sales SET paidAmount = 0, paymentStatus = ? WHERE id = ?").run(sale.totalPrice > 0 ? "Debt" : "Pending", data.saleId);
      }
    });
    transaction();
    insertAuditLog("void_sale", "sale", data.saleId, "status", "Active", "Voided", `Sale #${data.saleId} voided by ${currentUserName || "unknown"}. Reason: ${data.reason}`);
    return dbProxy.prepare("SELECT * FROM sales WHERE id = ?").get(data.saleId);
  });
  electron.ipcMain.handle("reverse-debt-payment", async (event, data) => {
    requirePermission("payments.reverse");
    if (!await gateSensitiveAction(event.sender, { context: `Reverse debt payment #${data.paymentId}` })) {
      throw new Error("Manager approval required — action not executed");
    }
    const payment = dbProxy.prepare("SELECT * FROM debt_payments WHERE id = ?").get(data.paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.reversalId) throw new Error("Payment has already been reversed");
    const transaction = dbProxy.transaction(() => {
      dbProxy.prepare("UPDATE debt_payments SET reversalId = id, reversalReason = ?, reversedBy = ?, reversalDate = CURRENT_TIMESTAMP WHERE id = ?").run(data.reason, currentUserName || "unknown", data.paymentId);
      dbProxy.prepare("UPDATE sales SET paidAmount = MAX(0, paidAmount - ?) WHERE id = ?").run(payment.amount, payment.saleId);
    });
    transaction();
    insertAuditLog("reverse_debt_payment", "debt_payment", data.paymentId, "reversalId", null, String(data.paymentId), `Debt payment #${data.paymentId} reversed by ${currentUserName || "unknown"}. Reason: ${data.reason}`);
    return { success: true };
  });
  electron.ipcMain.handle("reverse-supplier-payment", async (event, data) => {
    requirePermission("payments.reverse");
    if (!await gateSensitiveAction(event.sender, { context: `Reverse supplier payment #${data.paymentId}` })) {
      throw new Error("Manager approval required — action not executed");
    }
    const payment = dbProxy.prepare("SELECT * FROM supplier_payments WHERE id = ?").get(data.paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.reversalId) throw new Error("Payment has already been reversed");
    const transaction = dbProxy.transaction(() => {
      dbProxy.prepare("UPDATE supplier_payments SET reversalId = id, reversalReason = ?, reversedBy = ?, reversalDate = CURRENT_TIMESTAMP WHERE id = ?").run(data.reason, currentUserName || "unknown", data.paymentId);
      if (payment.purchaseId) {
        dbProxy.prepare("UPDATE supplier_purchases SET paidAmount = MAX(0, paidAmount - ?) WHERE id = ?").run(payment.amount, payment.purchaseId);
      }
    });
    transaction();
    insertAuditLog("reverse_supplier_payment", "supplier_payment", data.paymentId, "reversalId", null, String(data.paymentId), `Supplier payment #${data.paymentId} reversed by ${currentUserName || "unknown"}. Reason: ${data.reason}`);
    return { success: true };
  });
  electron.ipcMain.handle("reverse-adjustment", async (event, data) => {
    requirePermission("adjustments.reverse");
    if (!await gateSensitiveAction(event.sender, { context: `Reverse adjustment #${data.adjustmentId}` })) {
      throw new Error("Manager approval required — action not executed");
    }
    const adjustment = dbProxy.prepare("SELECT * FROM adjustments WHERE id = ?").get(data.adjustmentId);
    if (!adjustment) throw new Error("Adjustment not found");
    if (adjustment.reversalId) throw new Error("Adjustment has already been reversed");
    const bizId = getActiveBusinessId();
    const transaction = dbProxy.transaction(() => {
      dbProxy.prepare("UPDATE adjustments SET reversalId = id, reversalReason = ?, reversedBy = ?, reversalDate = CURRENT_TIMESTAMP WHERE id = ?").run(data.reason, currentUserName || "unknown", data.adjustmentId);
      let compensationType = adjustment.type;
      if (adjustment.type === "damage") compensationType = "add_stock";
      else if (adjustment.type === "loss") compensationType = "add_stock";
      else if (adjustment.type === "add_stock") compensationType = "damage";
      else if (adjustment.type === "price_increase") compensationType = "price_decrease";
      else if (adjustment.type === "price_decrease") compensationType = "price_increase";
      dbProxy.prepare("INSERT INTO adjustments (businessId, itemId, type, oldValue, newValue, quantity, unitType, reason, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
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
        dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity + ? WHERE id = ?").run(restoreQty, adjustment.itemId);
        const defWhId = getDefaultWarehouseId();
        const whRow = dbProxy.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, adjustment.itemId);
        if (whRow) {
          dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(restoreQty, whRow.id);
        } else if (restoreQty > 0) {
          dbProxy.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, adjustment.itemId, restoreQty);
        }
        dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, adjustment.itemId, `adj_reversal`, Math.abs(restoreQty), "adjustment", `Reversal of adjustment #${data.adjustmentId}: ${data.reason}`);
      }
      if (adjustment.type === "price_increase" || adjustment.type === "price_decrease") {
        if (adjustment.unitType === "base") {
          dbProxy.prepare("UPDATE items SET baseSellingPrice = ? WHERE id = ?").run(adjustment.oldValue, adjustment.itemId);
        } else {
          dbProxy.prepare("UPDATE items SET packSellingPrice = ? WHERE id = ?").run(adjustment.oldValue, adjustment.itemId);
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
    const offset = options?.offset ?? 0;
    query += " LIMIT ? OFFSET ?";
    params.push(listLimit, offset);
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("verify-audit-chain", () => {
    requirePermission("audit.view");
    return verifyAuditChain(dbProxy);
  });
  electron.ipcMain.handle("archive-item", (_, data) => {
    requirePermission("inventory.delete");
    dbProxy.prepare("SELECT name FROM items WHERE id = ?").get(data.id);
    dbProxy.prepare("UPDATE items SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?").run(currentUserName || "unknown", data.id);
    return { success: true };
  });
  electron.ipcMain.handle("restore-item", (_, data) => {
    requirePermission("records.restore");
    const item = dbProxy.prepare("SELECT name FROM items WHERE id = ?").get(data.id);
    dbProxy.prepare("UPDATE items SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL WHERE id = ?").run(data.id);
    insertAuditLog("restore_item", "item", data.id, "is_deleted", "1", "0", `Item #${data.id} "${item?.name || "unknown"}" restored by ${currentUserName || "unknown"}`);
    return { success: true };
  });
  electron.ipcMain.handle("archive-customer", (_, data) => {
    requirePermission("customers.delete");
    const bizId = getActiveBusinessId();
    dbProxy.prepare("UPDATE customers SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(currentUserName || "unknown", data.id, bizId);
    return { success: true };
  });
  electron.ipcMain.handle("restore-customer", (_, data) => {
    requirePermission("records.restore");
    const bizId = getActiveBusinessId();
    dbProxy.prepare("UPDATE customers SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(data.id, bizId);
    insertAuditLog("restore_customer", "customer", data.id, "is_deleted", "1", "0", `Customer #${data.id} restored by ${currentUserName || "unknown"}`);
    return { success: true };
  });
  electron.ipcMain.handle("get-deleted-items", () => {
    requirePermission("inventory.view");
    const bizId = getActiveBusinessId();
    return dbProxy.prepare("SELECT * FROM items WHERE businessId = ? AND is_deleted = 1").all(bizId);
  });
  electron.ipcMain.handle("get-deleted-customers", () => {
    requirePermission("customers.view");
    const bizId = getActiveBusinessId();
    return dbProxy.prepare("SELECT * FROM customers WHERE businessId = ? AND is_deleted = 1").all(bizId);
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
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("reverse-audit-log-entry", (_, data) => {
    requirePermission("audit.view");
    const entry = dbProxy.prepare("SELECT * FROM audit_logs WHERE id = ? AND businessId = ?").get(data.logId, getActiveBusinessId());
    if (!entry) throw new Error("Audit log entry not found");
    if (entry.reversedAt) throw new Error("This change has already been reversed");
    const reverseAction = (newAction, description) => {
      dbProxy.prepare("UPDATE audit_logs SET reversedAt = CURRENT_TIMESTAMP, reversedBy = ? WHERE id = ?").run(currentUserName || "unknown", entry.id);
      insertAuditLog(newAction, entry.entityType, entry.entityId, entry.fieldName, entry.newValue, entry.oldValue, description);
    };
    if (entry.fieldName && entry.oldValue !== null && ["update", "insert"].includes(entry.action)) {
      const tableMap = { item: "items", customer: "customers", sale: "sales", supplier: "suppliers", expense: "expenses", adjustment: "adjustments" };
      const table = tableMap[entry.entityType];
      if (table && entry.entityId) {
        dbProxy.prepare(`UPDATE ${table} SET ${entry.fieldName} = ? WHERE id = ?`).run(entry.oldValue, entry.entityId);
        reverseAction("reverse_field_update", `Reversed field ${entry.fieldName} on ${entry.entityType} #${entry.entityId} from '${entry.newValue}' back to '${entry.oldValue}'`);
        return { success: true };
      }
    }
    if ((entry.action === "soft_delete" || entry.action === "archive") && entry.entityType === "item") {
      dbProxy.prepare("UPDATE items SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL WHERE id = ?").run(entry.entityId);
      reverseAction("restore_item", `Item #${entry.entityId} restored via audit log reversal`);
      return { success: true };
    }
    if ((entry.action === "soft_delete" || entry.action === "archive") && entry.entityType === "customer") {
      dbProxy.prepare("UPDATE customers SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL WHERE id = ?").run(entry.entityId);
      reverseAction("restore_customer", `Customer #${entry.entityId} restored via audit log reversal`);
      return { success: true };
    }
    if ((entry.action === "restore_item" || entry.action === "restore") && entry.entityType === "item") {
      dbProxy.prepare("UPDATE items SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?").run(currentUserName || "unknown", entry.entityId);
      reverseAction("soft_delete", `Item #${entry.entityId} re-deleted via audit log reversal`);
      return { success: true };
    }
    if ((entry.action === "restore_customer" || entry.action === "restore") && entry.entityType === "customer") {
      dbProxy.prepare("UPDATE customers SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?").run(currentUserName || "unknown", entry.entityId);
      reverseAction("soft_delete", `Customer #${entry.entityId} re-deleted via audit log reversal`);
      return { success: true };
    }
    throw new Error("This action type cannot be automatically reversed from audit logs. Please use the relevant page to undo this change.");
  });
  electron.ipcMain.handle("get-reversal-stats", () => {
    const bizId = getActiveBusinessId();
    const voidedSales = dbProxy.prepare("SELECT COUNT(*) as count FROM sales WHERE businessId = ? AND status = 'Voided'").get(bizId).count;
    const reversedPayments = dbProxy.prepare("SELECT COUNT(*) as count FROM debt_payments dp JOIN sales s ON dp.saleId = s.id WHERE s.businessId = ? AND dp.reversalId IS NOT NULL").get(bizId).count;
    const reversedSupplierPayments = dbProxy.prepare("SELECT COUNT(*) as count FROM supplier_payments WHERE businessId = ? AND reversalId IS NOT NULL").get(bizId).count;
    const reversedAdjustments = dbProxy.prepare("SELECT COUNT(*) as count FROM adjustments WHERE businessId = ? AND reversalId IS NOT NULL").get(bizId).count;
    return { voidedSales, reversedPayments, reversedSupplierPayments, reversedAdjustments };
  });
  electron.ipcMain.handle("get-orders", (_, options = {}) => {
    requirePermission("orders.view");
    const bizId = getActiveBusinessId();
    let query = "SELECT * FROM orders WHERE businessId = ? AND is_deleted = 0";
    const params = [bizId];
    if (options.search) {
      query += " AND (LOWER(orderNumber) LIKE LOWER(?) OR LOWER(customerName) LIKE LOWER(?) OR LOWER(customerPhone) LIKE LOWER(?))";
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
    const offset = options.offset ?? 0;
    query += " LIMIT ? OFFSET ?";
    params.push(listLimit, offset);
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-order", (_, id) => {
    requirePermission("orders.view");
    const bizId = getActiveBusinessId();
    const order = dbProxy.prepare("SELECT * FROM orders WHERE id = ? AND businessId = ? AND is_deleted = 0").get(id, bizId);
    if (!order) return null;
    const items = dbProxy.prepare("SELECT * FROM order_items WHERE orderId = ?").all(id);
    const history = dbProxy.prepare("SELECT * FROM order_history WHERE orderId = ? ORDER BY createdAt ASC").all(id);
    return { ...order, items, history };
  });
  electron.ipcMain.handle("insert-order", (_, data) => {
    requirePermission("orders.create");
    const bizId = getActiveBusinessId();
    if (!data.items || data.items.length === 0) throw new Error("Order must have at least one item");
    const orderNumber = data.orderNumber || `ORD-${crypto$1.randomUUID().slice(0, 8).toUpperCase()}`;
    let totalAmount = 0;
    for (const item of data.items) {
      validatePositive(item.quantity, "Item quantity");
      validateNonNegative(item.unitPrice, "Unit price");
      totalAmount += item.quantity * item.unitPrice;
    }
    const transaction = dbProxy.transaction(() => {
      const orderResult = dbProxy.prepare(`
        INSERT INTO orders (businessId, orderNumber, customerName, customerPhone, notes, status, totalAmount, createdBy, createdByName, createdAt)
        VALUES (?, ?, ?, ?, ?, 'Order', ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(bizId, orderNumber, data.customerName || null, data.customerPhone || null, data.notes || null, totalAmount, null, currentUserName || "unknown");
      const orderId2 = orderResult.lastInsertRowid;
      const itemStmt = dbProxy.prepare(`
        INSERT INTO order_items (orderId, itemId, itemName, quantity, unit, unitType, unitPrice, totalPrice)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of data.items) {
        itemStmt.run(orderId2, item.itemId || null, item.itemName, item.quantity, item.unit || "pcs", item.unitType || "base", item.unitPrice, item.quantity * item.unitPrice);
      }
      dbProxy.prepare("INSERT INTO order_history (orderId, action, performedBy, notes) VALUES (?, ?, ?, ?)").run(orderId2, "created", currentUserName || "unknown", "Order created");
      return orderId2;
    });
    const orderId = transaction();
    return orderId;
  });
  electron.ipcMain.handle("convert-order-to-sale", (_, data) => {
    requirePermission("orders.convert");
    data = validate(orderConversionSchema, data, "order conversion");
    const bizId = getActiveBusinessId();
    const order = dbProxy.prepare("SELECT * FROM orders WHERE id = ? AND businessId = ? AND is_deleted = 0").get(data.orderId, bizId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "Order") throw new Error('Only orders with status "Order" can be converted');
    const items = dbProxy.prepare("SELECT * FROM order_items WHERE orderId = ?").all(data.orderId);
    const transaction = dbProxy.transaction(() => {
      const saleIds = [];
      for (const item of items) {
        const dbItem = dbProxy.prepare("SELECT * FROM items WHERE id = ?").get(item.itemId);
        if (!dbItem) throw new Error(`Item "${item.itemName}" not found in inventory`);
        const qty = item.quantity;
        let baseDeduction = qty;
        let packDeduction = 0;
        if (item.unitType === "pack") {
          baseDeduction = qty * (dbItem.unitsPerPack || 1);
          packDeduction = qty;
        } else {
          packDeduction = Math.round(qty / (dbItem.unitsPerPack || 1) * 1e6) / 1e6;
        }
        const itemResult = dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity - ?, totalPackQuantity = totalPackQuantity - ? WHERE id = ? AND totalBaseQuantity >= ?").run(baseDeduction, packDeduction, item.itemId, baseDeduction);
        if (itemResult.changes === 0) throw new Error(`Insufficient stock: ${dbItem.name} has less than ${baseDeduction} units available`);
        const itemDiscount = data.discount ? item.totalPrice / order.totalAmount * data.discount : 0;
        const itemVat = data.vat ? item.totalPrice / order.totalAmount * data.vat : 0;
        const finalPrice = item.totalPrice - itemDiscount + itemVat;
        const saleResult = dbProxy.prepare(`
          INSERT INTO sales (businessId, itemId, quantity, unit, unitType, discount, vat, totalPrice, paymentMethod, paymentStatus, customerName, customerPhone, createdBy)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid', ?, ?, ?)
        `).run(bizId, item.itemId, qty, item.unit || "pcs", item.unitType || "base", itemDiscount, itemVat, finalPrice, data.paymentMethod || "Cash", order.customerName || null, order.customerPhone || null, null);
        saleIds.push(saleResult.lastInsertRowid);
        const defWhId = getDefaultWarehouseId();
        const whResult = dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE warehouseId = ? AND itemId = ? AND quantity >= ?").run(baseDeduction, defWhId, item.itemId, baseDeduction);
        if (whResult.changes === 0) {
          const whExists = dbProxy.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, item.itemId);
          if (!whExists) {
            dbProxy.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, item.itemId, -baseDeduction);
          } else {
            throw new Error(`Insufficient stock at warehouse: ${dbItem.name} has less than ${baseDeduction} units available`);
          }
        }
        dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, item.itemId, "sale_out", baseDeduction, "order_conversion", `Converted from order ${order.orderNumber}`);
      }
      dbProxy.prepare("UPDATE orders SET status = 'Converted', convertedAt = CURRENT_TIMESTAMP, convertedBy = ? WHERE id = ?").run(currentUserName || "unknown", data.orderId);
      dbProxy.prepare("INSERT INTO order_history (orderId, action, performedBy, notes) VALUES (?, ?, ?, ?)").run(data.orderId, "converted_to_sale", currentUserName || "unknown", `Converted to sale(s): ${saleIds.join(", ")}. Payment: ${data.paymentMethod || "Cash"}`);
      return { success: true, saleIds };
    });
    const result = transaction();
    insertAuditLog("convert_order_to_sale", "order", data.orderId, "status", "Order", "Converted", `Order #${data.orderId} converted to sale by ${currentUserName || "unknown"}`);
    return result;
  });
  electron.ipcMain.handle("convert-order-to-debt", (_, data) => {
    requirePermission("orders.convert");
    data = validate(orderConversionSchema, data, "order conversion");
    const bizId = getActiveBusinessId();
    const order = dbProxy.prepare("SELECT * FROM orders WHERE id = ? AND businessId = ? AND is_deleted = 0").get(data.orderId, bizId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "Order") throw new Error('Only orders with status "Order" can be converted');
    const items = dbProxy.prepare("SELECT * FROM order_items WHERE orderId = ?").all(data.orderId);
    const cName = order.customerName?.trim();
    if (!cName) throw new Error("Customer name is required for debt conversion");
    const transaction = dbProxy.transaction(() => {
      const exists = dbProxy.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(cName, bizId);
      if (!exists) {
        dbProxy.prepare("INSERT INTO customers (businessId, customerName, phone, groupName) VALUES (?, ?, ?, ?)").run(bizId, cName, order.customerPhone?.trim() || "", "general");
      }
      const saleIds = [];
      for (const item of items) {
        const dbItem = dbProxy.prepare("SELECT * FROM items WHERE id = ?").get(item.itemId);
        if (!dbItem) throw new Error(`Item "${item.itemName}" not found in inventory`);
        const qty = item.quantity;
        let baseDeduction = qty;
        let packDeduction = 0;
        if (item.unitType === "pack") {
          baseDeduction = qty * (dbItem.unitsPerPack || 1);
          packDeduction = qty;
        } else {
          packDeduction = Math.round(qty / (dbItem.unitsPerPack || 1) * 1e6) / 1e6;
        }
        const itemResult = dbProxy.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity - ?, totalPackQuantity = totalPackQuantity - ? WHERE id = ? AND totalBaseQuantity >= ?").run(baseDeduction, packDeduction, item.itemId, baseDeduction);
        if (itemResult.changes === 0) throw new Error(`Insufficient stock: ${dbItem.name} has less than ${baseDeduction} units available`);
        const itemDiscount = data.discount ? item.totalPrice / order.totalAmount * data.discount : 0;
        const itemVat = data.vat ? item.totalPrice / order.totalAmount * data.vat : 0;
        const finalPrice = item.totalPrice - itemDiscount + itemVat;
        const saleResult = dbProxy.prepare(`
          INSERT INTO sales (businessId, itemId, quantity, unit, unitType, discount, vat, totalPrice, paymentMethod, paymentStatus, customerName, customerPhone, dueDate, paidAmount, createdBy)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Debt', ?, ?, ?, 0, ?)
        `).run(bizId, item.itemId, qty, item.unit || "pcs", item.unitType || "base", itemDiscount, itemVat, finalPrice, data.paymentMethod || "Credit", order.customerName, order.customerPhone || null, data.dueDate || null, null);
        saleIds.push(saleResult.lastInsertRowid);
        const defWhId = getDefaultWarehouseId();
        const whResult = dbProxy.prepare("UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE warehouseId = ? AND itemId = ? AND quantity >= ?").run(baseDeduction, defWhId, item.itemId, baseDeduction);
        if (whResult.changes === 0) {
          const whExists = dbProxy.prepare("SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?").get(defWhId, item.itemId);
          if (!whExists) {
            dbProxy.prepare("INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)").run(defWhId, item.itemId, -baseDeduction);
          } else {
            throw new Error(`Insufficient stock at warehouse: ${dbItem.name} has less than ${baseDeduction} units available`);
          }
        }
        dbProxy.prepare("INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)").run(defWhId, item.itemId, "sale_out", baseDeduction, "order_debt_conversion", `Converted from order ${order.orderNumber}`);
      }
      dbProxy.prepare("UPDATE orders SET status = 'Converted', convertedAt = CURRENT_TIMESTAMP, convertedBy = ? WHERE id = ?").run(currentUserName || "unknown", data.orderId);
      dbProxy.prepare("INSERT INTO order_history (orderId, action, performedBy, notes) VALUES (?, ?, ?, ?)").run(data.orderId, "converted_to_debt", currentUserName || "unknown", `Converted to debt sale(s): ${saleIds.join(", ")}. Due: ${data.dueDate || "Not set"}`);
      return { success: true, saleIds };
    });
    const result = transaction();
    insertAuditLog("convert_order_to_debt", "order", data.orderId, "status", "Order", "Converted", `Order #${data.orderId} converted to debt by ${currentUserName || "unknown"}`);
    return result;
  });
  electron.ipcMain.handle("import-data", (_, module2, rows) => {
    requirePermission("settings.manage");
    return importData(module2, rows);
  });
  electron.ipcMain.handle("cancel-order", (_, data) => {
    requirePermission("orders.cancel");
    const bizId = getActiveBusinessId();
    const order = dbProxy.prepare("SELECT * FROM orders WHERE id = ? AND businessId = ? AND is_deleted = 0").get(data.orderId, bizId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "Order") throw new Error('Only orders with status "Order" can be cancelled');
    dbProxy.prepare("UPDATE orders SET status = 'Cancelled', cancelledAt = CURRENT_TIMESTAMP, cancelledBy = ?, cancelReason = ? WHERE id = ?").run(currentUserName || "unknown", data.reason || null, data.orderId);
    dbProxy.prepare("INSERT INTO order_history (orderId, action, performedBy, notes) VALUES (?, ?, ?, ?)").run(data.orderId, "cancelled", currentUserName || "unknown", data.reason || "Cancelled");
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
    console.log("[Search] items count:", dbProxy.prepare("SELECT COUNT(*) as c FROM items WHERE businessId = ?").get(bizId)?.c);
    console.log("[Search] sales count:", dbProxy.prepare("SELECT COUNT(*) as c FROM sales WHERE businessId = ?").get(bizId)?.c);
    try {
      const items = dbProxy.prepare(`
        SELECT items.id, items.name, items.companyName, items.categoryId, items.totalBaseQuantity, items.baseUnit, items.baseSellingPrice,
          categories.name as categoryName
        FROM items LEFT JOIN categories ON items.categoryId = categories.id
        WHERE items.businessId = ? AND items.is_deleted = 0
          AND (LOWER(items.name) LIKE LOWER(?) OR LOWER(items.companyName) LIKE LOWER(?))
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
      const sales = dbProxy.prepare(`
        SELECT s.id, s.totalPrice, s.customerName, s.paymentStatus, s.createdAt, i.name as itemName
        FROM sales s LEFT JOIN items i ON s.itemId = i.id
        WHERE s.businessId = ? AND (LOWER(i.name) LIKE LOWER(?) OR LOWER(s.customerName) LIKE LOWER(?) OR CAST(s.id AS TEXT) LIKE ?)
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
      const customers = dbProxy.prepare(`
        SELECT id, customerName, phone, company, groupName
        FROM customers WHERE businessId = ? AND isActive = 1
          AND (LOWER(customerName) LIKE LOWER(?) OR LOWER(phone) LIKE LOWER(?) OR LOWER(company) LIKE LOWER(?))
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
      const suppliers = dbProxy.prepare(`
        SELECT id, supplierName, companyName, phone, contactPerson
        FROM suppliers WHERE businessId = ? AND isActive = 1
          AND (LOWER(supplierName) LIKE LOWER(?) OR LOWER(companyName) LIKE LOWER(?) OR LOWER(phone) LIKE LOWER(?) OR LOWER(contactPerson) LIKE LOWER(?))
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
      const expenses = dbProxy.prepare(`
        SELECT id, name, amount, category, date
        FROM expenses WHERE businessId = ? AND (LOWER(name) LIKE LOWER(?) OR LOWER(category) LIKE LOWER(?))
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
      const budgets = dbProxy.prepare(`
        SELECT id, category, amount, budgetType, month, year, referenceName
        FROM budgets WHERE businessId = ? AND (LOWER(category) LIKE LOWER(?) OR LOWER(referenceName) LIKE LOWER(?))
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
      const cats = dbProxy.prepare(`
        SELECT id, name FROM categories WHERE businessId = ? AND LOWER(name) LIKE LOWER(?)
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
      const whs = dbProxy.prepare(`
        SELECT id, name, location, managerName
        FROM warehouses WHERE businessId = ? AND (LOWER(name) LIKE LOWER(?) OR LOWER(location) LIKE LOWER(?) OR LOWER(managerName) LIKE LOWER(?))
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
      const purchases = dbProxy.prepare(`
        SELECT sp.id, sp.purchaseNumber, sp.totalAmount, sp.status, s.supplierName
        FROM supplier_purchases sp LEFT JOIN suppliers s ON sp.supplierId = s.id
        WHERE sp.businessId = ? AND (LOWER(sp.purchaseNumber) LIKE LOWER(?) OR LOWER(s.supplierName) LIKE LOWER(?) OR CAST(sp.id AS TEXT) LIKE ?)
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
      const adjustments = dbProxy.prepare(`
        SELECT a.id, a.type, a.reason, a.quantity, i.name as itemName
        FROM adjustments a LEFT JOIN items i ON a.itemId = i.id
        WHERE a.businessId = ? AND (LOWER(i.name) LIKE LOWER(?) OR LOWER(a.reason) LIKE LOWER(?) OR LOWER(a.type) LIKE LOWER(?))
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
      const notifs = dbProxy.prepare(`
        SELECT id, title, message, type, severity
        FROM notifications WHERE businessId = ? AND isDismissed = 0
          AND (LOWER(title) LIKE LOWER(?) OR LOWER(message) LIKE LOWER(?))
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
      const drafts = dbProxy.prepare(`
        SELECT id, customerName, discount, vat, notes
        FROM draft_sales WHERE businessId = ?
          AND (LOWER(customerName) LIKE LOWER(?) OR LOWER(notes) LIKE LOWER(?))
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
    const now2 = /* @__PURE__ */ new Date();
    const today = now2.toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(now2.getTime() - 30 * 864e5).toISOString().split("T")[0];
    const sixtyDaysAgo = new Date(now2.getTime() - 60 * 864e5).toISOString().split("T")[0];
    const ninetyDaysAgo = new Date(now2.getTime() - 90 * 864e5).toISOString().split("T")[0];
    const monthStart = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, "0")}-01`;
    const factors = [];
    const recommendations = [];
    try {
      const last30Sales = dbProxy.prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND DATE(createdAt) <= ? AND businessId = ?"
      ).get(thirtyDaysAgo, today, bizId);
      const prev30Sales = dbProxy.prepare(
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
      const profitData = dbProxy.prepare(`
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
      const totalExpenses = dbProxy.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND date <= ? AND businessId = ?"
      ).get(thirtyDaysAgo, today, bizId);
      const last30Rev = dbProxy.prepare(
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
      const totalItems = dbProxy.prepare("SELECT COUNT(*) as count FROM items WHERE businessId = ? AND is_deleted = 0").get(bizId);
      const lowStock = dbProxy.prepare("SELECT COUNT(*) as count FROM items WHERE totalBaseQuantity < 10 AND businessId = ? AND is_deleted = 0").get(bizId);
      const outOfStock = dbProxy.prepare("SELECT COUNT(*) as count FROM items WHERE totalBaseQuantity <= 0 AND businessId = ? AND is_deleted = 0").get(bizId);
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
      const slowMoving = dbProxy.prepare(`
        SELECT COUNT(*) as count FROM items i WHERE i.businessId = ? AND i.is_deleted = 0
          AND (SELECT COUNT(*) FROM sales WHERE itemId = i.id AND DATE(createdAt) >= ?) = 0
          AND i.totalBaseQuantity > 0
      `).get(bizId, ninetyDaysAgo);
      const deadStock = dbProxy.prepare(`
        SELECT COUNT(*) as count FROM items i WHERE i.businessId = ? AND i.is_deleted = 0
          AND (SELECT COUNT(*) FROM sales WHERE itemId = i.id AND DATE(createdAt) >= ?) = 0
          AND i.totalBaseQuantity > 0
      `).get(bizId, sixtyDaysAgo);
      const totalActive = dbProxy.prepare("SELECT COUNT(*) as count FROM items WHERE businessId = ? AND is_deleted = 0 AND totalBaseQuantity > 0").get(bizId);
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
      const budgets = dbProxy.prepare("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM budgets WHERE businessId = ? AND year = ? AND (month = ? OR month IS NULL)").get(bizId, String(now2.getFullYear()), String(now2.getMonth() + 1).padStart(2, "0"));
      if (budgets.count > 0) {
        const expenses = dbProxy.prepare(
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
      const activeCustomers = dbProxy.prepare(`
        SELECT COUNT(DISTINCT TRIM(customerName)) as count FROM sales
        WHERE DATE(createdAt) >= ? AND businessId = ? AND customerName IS NOT NULL AND customerName != ''
      `).get(thirtyDaysAgo, bizId);
      const totalCustomers = dbProxy.prepare("SELECT COUNT(*) as count FROM customers WHERE businessId = ? AND isActive = 1").get(bizId);
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
      const currentMonthRev = dbProxy.prepare(
        "SELECT COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND businessId = ?"
      ).get(thirtyDaysAgo, bizId);
      const prevMonthRev = dbProxy.prepare(
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
    console.log("[Insights] items:", dbProxy.prepare("SELECT COUNT(*) as c FROM items WHERE businessId = ?").get(bizId)?.c);
    const now2 = /* @__PURE__ */ new Date();
    const today = now2.toISOString().split("T")[0];
    const sevenDaysAgo = new Date(now2.getTime() - 7 * 864e5).toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(now2.getTime() - 30 * 864e5).toISOString().split("T")[0];
    const ninetyDaysAgo = new Date(now2.getTime() - 90 * 864e5).toISOString().split("T")[0];
    const sixtyDaysAgo = new Date(now2.getTime() - 60 * 864e5).toISOString().split("T")[0];
    const monthStart = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, "0")}-01`;
    const insights = [];
    try {
      const lowItems = dbProxy.prepare(`
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
      const oosItems = dbProxy.prepare(`
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
      const bestSellers = dbProxy.prepare(`
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
      const topProfit = dbProxy.prepare(`
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
      const slowMoving = dbProxy.prepare(`
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
      const overstocked = dbProxy.prepare(`
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
      const currentExpenses = dbProxy.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND businessId = ?"
      ).get(thirtyDaysAgo, bizId);
      const prevExpenses = dbProxy.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND date < ? AND businessId = ?"
      ).get(sixtyDaysAgo, thirtyDaysAgo, bizId);
      if (prevExpenses.total > 0) {
        const change = (currentExpenses.total - prevExpenses.total) / prevExpenses.total * 100;
        if (change > 30) {
          const topCategory = dbProxy.prepare(`
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
      const overrunBudgets = dbProxy.prepare(`
        SELECT b.category, b.amount as budgetAmount,
          COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.businessId = ? AND e.category = b.category AND e.date >= ? AND e.date <= ?), 0) as spent
        FROM budgets b
        WHERE b.businessId = ? AND b.month = ? AND b.year = ?
          AND COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.businessId = ? AND e.category = b.category AND e.date >= ? AND e.date <= ?), 0) > b.amount
        ORDER BY (COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.businessId = ? AND e.category = b.category AND e.date >= ? AND e.date <= ?), 0) - b.amount) DESC LIMIT 3
      `).all(bizId, monthStart, today, bizId, String(now2.getMonth() + 1).padStart(2, "0"), String(now2.getFullYear()), bizId, monthStart, today, bizId, monthStart, today);
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
      const weeklySales = dbProxy.prepare(`
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
      const topCustomers = dbProxy.prepare(`
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
      const todaySales = dbProxy.prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) = ? AND businessId = ?"
      ).get(today, bizId);
      const todayExpenses = dbProxy.prepare(
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
      const weekSales = dbProxy.prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND businessId = ?"
      ).get(sevenDaysAgo, bizId);
      const weekExpenses = dbProxy.prepare(
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
      const monthSales = dbProxy.prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND businessId = ?"
      ).get(thirtyDaysAgo, bizId);
      const monthExpenses = dbProxy.prepare(
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
      const topSuppliers = dbProxy.prepare(`
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
      const totalRevenue = dbProxy.prepare(
        "SELECT COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND businessId = ? AND paymentStatus = 'Paid'"
      ).get(thirtyDaysAgo, bizId);
      const debtSales = dbProxy.prepare(
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
      const avgMargin = dbProxy.prepare(`
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
      const lastYearSales = dbProxy.prepare(`
        SELECT COALESCE(SUM(totalPrice), 0) as revenue FROM sales
        WHERE DATE(createdAt) >= ? AND DATE(createdAt) < ? AND businessId = ?
      `).get(thirtyDaysAgo, today, bizId);
      const lastYearPeriod = dbProxy.prepare(`
        SELECT COALESCE(SUM(totalPrice), 0) as revenue FROM sales
        WHERE DATE(createdAt) >= ? AND DATE(createdAt) < ? AND businessId = ?
      `).get(
        new Date(now2.getFullYear() - 1, now2.getMonth(), now2.getDate()).toISOString().split("T")[0],
        new Date(now2.getFullYear() - 1, now2.getMonth(), now2.getDate() + 30).toISOString().split("T")[0],
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
    return dbProxy.prepare("SELECT * FROM subscription_plans WHERE isActive = 1 ORDER BY price ASC").all();
  });
  electron.ipcMain.handle("get-current-subscription", () => {
    const bizId = getActiveBusinessId();
    const sub = dbProxy.prepare("SELECT * FROM subscriptions WHERE businessId = ?").get(bizId);
    if (!sub) return null;
    const now2 = /* @__PURE__ */ new Date();
    if (sub.isTrial && sub.trialEndsAt && new Date(sub.trialEndsAt) < now2 && sub.status === "active") {
      sub.tier = "basic";
      sub.status = "active";
      sub.isTrial = 0;
      dbProxy.prepare("UPDATE subscriptions SET tier = ?, isTrial = 0, updatedAt = ? WHERE id = ?").run("basic", now2.toISOString(), sub.id);
      dbProxy.prepare("INSERT INTO subscription_history (subscriptionId, businessId, action, oldTier, newTier, details, changedBy) VALUES (?, ?, ?, ?, ?, ?, ?)").run(sub.id, bizId, "trial_expired", "trial", "basic", "Trial period ended, auto-downgraded to Basic", "system");
      sub.tier = "basic";
      sub.isTrial = 0;
    }
    if (sub.expiresAt && new Date(sub.expiresAt) < now2 && sub.status === "active" && !sub.isTrial) {
      const oldTier = sub.tier;
      sub.tier = "basic";
      sub.status = "expired";
      dbProxy.prepare("UPDATE subscriptions SET status = ?, updatedAt = ? WHERE id = ?").run("expired", now2.toISOString(), sub.id);
      dbProxy.prepare("INSERT INTO subscription_history (subscriptionId, businessId, action, oldTier, newTier, oldStatus, newStatus, details, changedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(sub.id, bizId, "subscription_expired", oldTier, "basic", "active", "expired", "Subscription period ended", "system");
      sub.status = "expired";
      sub.tier = "basic";
    }
    const plan = sub.planId ? dbProxy.prepare("SELECT * FROM subscription_plans WHERE id = ?").get(sub.planId) : null;
    return { ...sub, plan };
  });
  electron.ipcMain.handle("start-trial", () => {
    const bizId = getActiveBusinessId();
    const now2 = /* @__PURE__ */ new Date();
    const trialEnd = new Date(now2.getTime() + 7 * 24 * 60 * 60 * 1e3);
    const existing = dbProxy.prepare("SELECT id, isTrial, status FROM subscriptions WHERE businessId = ?").get(bizId);
    if (existing) {
      if (existing.isTrial) return { success: true, message: "Trial already active" };
      if (!existing.isTrial && existing.status !== "expired") {
        return { success: false, error: "Subscription already active" };
      }
      dbProxy.prepare("UPDATE subscriptions SET tier = ?, status = ?, isTrial = 1, trialStartedAt = ?, trialEndsAt = ?, startedAt = ?, expiresAt = ?, updatedAt = ? WHERE id = ?").run("trial", "active", now2.toISOString(), trialEnd.toISOString(), now2.toISOString(), trialEnd.toISOString(), now2.toISOString(), existing.id);
    } else {
      dbProxy.prepare("INSERT INTO subscriptions (businessId, tier, status, isTrial, trialStartedAt, trialEndsAt, startedAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(bizId, "trial", "active", 1, now2.toISOString(), trialEnd.toISOString(), now2.toISOString(), trialEnd.toISOString());
    }
    dbProxy.prepare("INSERT INTO subscription_history (subscriptionId, businessId, action, oldTier, newTier, details, changedBy) VALUES (?, ?, ?, ?, ?, ?, ?)").run(existing?.id || dbProxy.prepare("SELECT id FROM subscriptions WHERE businessId = ?").get(bizId)?.id, bizId, "trial_started", existing?.tier || "none", "trial", "7-day premium trial started", currentUserName || "system");
    return { success: true };
  });
  electron.ipcMain.handle("submit-payment", (_, data) => {
    const bizId = getActiveBusinessId();
    const result = dbProxy.prepare(`
      INSERT INTO payment_transactions (businessId, transactionId, businessName, phoneNumber, selectedPlan, amount, paymentDate, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(bizId, data.transactionId, data.businessName, data.phoneNumber, data.selectedPlan, data.amount, data.paymentDate, data.notes || null);
    dbProxy.prepare("INSERT INTO subscription_history (subscriptionId, businessId, action, details, changedBy) VALUES (?, ?, ?, ?, ?)").run(null, bizId, "payment_submitted", `Payment submitted for plan "${data.selectedPlan}" (Transaction: ${data.transactionId})`, currentUserName || "system");
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
    return dbProxy.prepare(query).all(...params);
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
    return dbProxy.prepare(query).all(...params);
  });
  electron.ipcMain.handle("approve-payment", (_, data) => {
    requirePermission("settings");
    getActiveBusinessId();
    const tx = dbProxy.prepare("SELECT * FROM payment_transactions WHERE id = ?").get(data.transactionId);
    if (!tx) return { success: false, error: "Transaction not found" };
    const plan = dbProxy.prepare("SELECT * FROM subscription_plans WHERE name = ?").get(tx.selectedPlan);
    if (!plan) return { success: false, error: "Plan not found" };
    const now2 = /* @__PURE__ */ new Date();
    const expiresAt = new Date(now2.getTime() + plan.durationMonths * 30 * 24 * 60 * 60 * 1e3);
    const existingSub = dbProxy.prepare("SELECT id, tier FROM subscriptions WHERE businessId = ?").get(tx.businessId);
    const oldTier = existingSub?.tier || "basic";
    if (existingSub) {
      dbProxy.prepare(`
        UPDATE subscriptions SET planId = ?, tier = ?, status = 'active', isTrial = 0, startedAt = ?, expiresAt = ?, updatedAt = ?
        WHERE id = ?
      `).run(plan.id, plan.tier, now2.toISOString(), expiresAt.toISOString(), now2.toISOString(), existingSub.id);
    } else {
      const r = dbProxy.prepare(`
        INSERT INTO subscriptions (businessId, planId, tier, status, startedAt, expiresAt)
        VALUES (?, ?, ?, 'active', ?, ?)
      `).run(tx.businessId, plan.id, plan.tier, now2.toISOString(), expiresAt.toISOString());
      data.subscriptionId = r.lastInsertRowid;
    }
    dbProxy.prepare("UPDATE payment_transactions SET status = ?, verifiedBy = ?, verifiedAt = ?, subscriptionId = ? WHERE id = ?").run("approved", currentAdminId, now2.toISOString(), existingSub?.id || data.subscriptionId, data.transactionId);
    dbProxy.prepare("INSERT INTO subscription_history (subscriptionId, businessId, action, oldTier, newTier, details, changedBy) VALUES (?, ?, ?, ?, ?, ?, ?)").run(existingSub?.id || data.subscriptionId, tx.businessId, "payment_approved", oldTier, plan.tier, `Payment #${tx.id} approved. Plan: ${tx.selectedPlan}`, currentUserName || "system");
    return { success: true };
  });
  electron.ipcMain.handle("reject-payment", (_, data) => {
    requirePermission("settings");
    const tx = dbProxy.prepare("SELECT * FROM payment_transactions WHERE id = ?").get(data.transactionId);
    if (!tx) return { success: false, error: "Transaction not found" };
    dbProxy.prepare("UPDATE payment_transactions SET status = ?, adminNotes = ?, verifiedBy = ?, verifiedAt = ? WHERE id = ?").run("rejected", data.reason, currentAdminId, (/* @__PURE__ */ new Date()).toISOString(), data.transactionId);
    dbProxy.prepare("INSERT INTO subscription_history (subscriptionId, businessId, action, details, changedBy) VALUES (?, ?, ?, ?, ?)").run(null, tx.businessId, "payment_rejected", `Payment #${tx.id} rejected. Reason: ${data.reason}`, currentUserName || "system");
    return { success: true };
  });
  electron.ipcMain.handle("get-subscription-history", () => {
    const bizId = getActiveBusinessId();
    return dbProxy.prepare("SELECT * FROM subscription_history WHERE businessId = ? ORDER BY createdAt DESC").all(bizId);
  });
  electron.ipcMain.handle("get-renewal-info", () => {
    const bizId = getActiveBusinessId();
    const sub = dbProxy.prepare("SELECT * FROM subscriptions WHERE businessId = ?").get(bizId);
    if (!sub || !sub.expiresAt) return null;
    const now2 = /* @__PURE__ */ new Date();
    const expiry = new Date(sub.expiresAt);
    const daysRemaining = Math.ceil((expiry.getTime() - now2.getTime()) / (1e3 * 60 * 60 * 24));
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
    const sub = dbProxy.prepare("SELECT tier, isTrial, status, expiresAt FROM subscriptions WHERE businessId = ?").get(bizId);
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
    const allSubs = dbProxy.prepare(`
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
      pendingPayments: dbProxy.prepare("SELECT COUNT(*) as c FROM payment_transactions WHERE status = 'pending'").get().c
    };
  });
  electron.ipcMain.handle("check-trial-availability", () => {
    const bizId = getActiveBusinessId();
    const sub = dbProxy.prepare("SELECT isTrial, tier, status FROM subscriptions WHERE businessId = ?").get(bizId);
    if (!sub) return { available: true };
    if (sub.isTrial) return { available: false, reason: "already_on_trial", trialActive: true };
    if (sub.status === "expired" && !sub.isTrial) return { available: false, reason: "already_used_trial" };
    if (sub.status === "active" && sub.tier !== "basic") return { available: false, reason: "already_subscribed" };
    return { available: true };
  });
  electron.ipcMain.handle("debug:ping", () => ({ pong: true }));
  electron.ipcMain.handle("update:check", async () => {
    try {
      return await appUpdater.checkForUpdates();
    } catch (err) {
      return { status: "error", error: err.message };
    }
  });
  electron.ipcMain.handle("update:download", async () => {
    try {
      await appUpdater.downloadUpdate();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  electron.ipcMain.handle("update:install", () => {
    appUpdater.installUpdate();
    return { success: true };
  });
  electron.ipcMain.handle("update:skip-version", (_, version) => {
    appUpdater.skipVersion(version);
    return { success: true };
  });
  electron.ipcMain.handle("update:remind-later", (_, hours) => {
    appUpdater.remindLater(hours ?? 24);
    return { success: true };
  });
  electron.ipcMain.handle("update:get-status", () => {
    return {
      status: appUpdater.getStatus(),
      info: appUpdater.getUpdateInfo(),
      progress: appUpdater.getProgress(),
      error: appUpdater.getError(),
      appVersion: appUpdater.getAppVersion(),
      autoCheckEnabled: appUpdater.isAutoCheckEnabled()
    };
  });
  electron.ipcMain.handle("update:set-auto-check", (_, enabled) => {
    appUpdater.setAutoCheckEnabled(enabled);
    return { success: true };
  });
  electron.ipcMain.handle("update:get-app-version", () => {
    return appUpdater.getAppVersion();
  });
  electron.ipcMain.handle("update:clear-reminder", () => {
    appUpdater.clearReminder();
    return { success: true };
  });
  electron.ipcMain.handle("check-stock-consistency", () => {
    requirePermission("inventory.view");
    const bizId = getActiveBusinessId();
    return checkStockConsistency(bizId);
  });
  electron.ipcMain.handle("fix-stock-consistency", () => {
    requirePermission("inventory.adjust");
    const bizId = getActiveBusinessId();
    const result = checkStockConsistency(bizId);
    const fixed = [];
    const fixTx = dbProxy.transaction(() => {
      for (const item of result.inconsistent) {
        dbProxy.prepare("UPDATE items SET totalBaseQuantity = (SELECT COALESCE(SUM(quantity), 0) FROM warehouse_inventory WHERE itemId = ?) WHERE id = ?").run(item.itemId, item.itemId);
        fixed.push(item.itemId);
      }
    });
    fixTx();
    return { fixed: fixed.length, totalInconsistent: result.inconsistent.length };
  });
  electron.ipcMain.handle("shift:open", (_, data) => {
    const bizId = getActiveBusinessId();
    return openShift(bizId, data.registerId, data.cashierId, data.openingFloat);
  });
  electron.ipcMain.handle("shift:close", (_, shiftId, data) => {
    return closeShift$1(shiftId, data.closedBy, data.closingCash, data.notes);
  });
  electron.ipcMain.handle("shift:mid-audit", (_, shiftId, countedCash, notes) => {
    return recordMidShiftAudit(shiftId, countedCash, notes);
  });
  electron.ipcMain.handle("shift:blind-count", (_, shiftId, countedCash, notes) => {
    return recordBlindCount(shiftId, countedCash, notes);
  });
  electron.ipcMain.handle("shift:active", (_, registerId) => {
    return getOpenShift(registerId);
  });
  electron.ipcMain.handle("shift:by-id", (_, shiftId) => {
    return getShiftById$1(shiftId);
  });
  electron.ipcMain.handle("shift:transactions", (_, shiftId) => {
    return getShiftTransactions(shiftId);
  });
  electron.ipcMain.handle("shift:summary", (_, shiftId) => {
    return generateShiftReport(shiftId);
  });
  electron.ipcMain.handle("shift:record-transaction", (_, data) => {
    return addShiftTransaction(data.shiftId, data.type, data.amount, data.saleId, data.paymentMethod, data.notes);
  });
  electron.ipcMain.handle("reports:x-report", (_, registerId) => {
    const bizId = getActiveBusinessId();
    return generateXReport(bizId, registerId);
  });
  electron.ipcMain.handle("reports:z-report", (_, registerId, countedCash, cashDrawerCounts) => {
    const bizId = getActiveBusinessId();
    return generateZReport(bizId, registerId, countedCash);
  });
  electron.ipcMain.handle("reports:x-report-print", async (_, registerId) => {
    const bizId = getActiveBusinessId();
    const report = generateXReport(bizId, registerId);
    const driver = getPrinterConfig();
    if (driver) {
      const cmds = printFiscalReport(report);
      await printRaw(cmds);
    }
    return report;
  });
  electron.ipcMain.handle("reports:z-report-print", async (_, registerId, countedCash, cashDrawerCounts) => {
    const bizId = getActiveBusinessId();
    const report = generateZReport(bizId, registerId, countedCash);
    const driver = getPrinterConfig();
    if (driver) {
      const cmds = printFiscalReport(report);
      await printRaw(cmds);
    }
    return report;
  });
  electron.ipcMain.handle("ledger:entries", (_, options) => {
    const bizId = getActiveBusinessId();
    return getLedgerEntries(bizId, options);
  });
  electron.ipcMain.handle("ledger:reverse", (_, request) => {
    return reverseEntry(request);
  });
  electron.ipcMain.handle("ledger:verify", () => {
    const bizId = getActiveBusinessId();
    return verifyLedgerIntegrity(bizId);
  });
  electron.ipcMain.handle("ledger:balance", () => {
    const bizId = getActiveBusinessId();
    return getLedgerBalance(bizId);
  });
  electron.ipcMain.handle("ledger:shift-summary", (_, shiftId) => {
    return getShiftLedgerSummary(shiftId);
  });
  electron.ipcMain.handle("tax:calculate", (_, lines) => {
    return calculateTax(lines);
  });
  electron.ipcMain.handle("tax:wht", (_, input) => {
    return calculateWHT(input);
  });
  electron.ipcMain.handle("tax:vat-return", (_, input) => {
    return calculateVatReturn(input);
  });
  electron.ipcMain.handle("tax:tot-return", (_, input) => {
    return calculateTotReturn(input);
  });
  electron.ipcMain.handle("tax:mat", (_, grossTurnover) => {
    return calculateMAT(grossTurnover);
  });
  electron.ipcMain.handle("tax:advance", (_, estimatedAnnualTax) => {
    return calculateAdvanceTax(estimatedAnnualTax);
  });
  electron.ipcMain.handle("tax:paye", (_, input) => {
    return calculatePAYE(input);
  });
  electron.ipcMain.handle("tax:pension", (_, input) => {
    return calculatePension(input);
  });
  electron.ipcMain.handle("mor-qr:generate", (_, data) => {
    return generateMorQrPayload(data);
  });
  electron.ipcMain.handle("mor-qr:validate", (_, payload) => {
    return validateMorQrPayload(payload);
  });
  electron.ipcMain.handle("mor-qr:print-receipt", async (_, data) => {
    const driver = getPrinterConfig();
    if (!driver) throw new Error("No printer configured");
    await printMorReceipt(data, driver);
    return { success: true };
  });
  electron.ipcMain.handle("compliance:check", (_, context, rules) => {
    return runComplianceChecks(context, rules);
  });
  electron.ipcMain.handle("compliance:validate-tin", (_, tin) => {
    return validateTin(tin);
  });
  electron.ipcMain.handle("compliance:report", (_, fromDate, toDate) => {
    const bizId = getActiveBusinessId();
    return generateComplianceReport(bizId, fromDate, toDate);
  });
  electron.ipcMain.handle("compliance:log", (_, event) => {
    return logComplianceEvent(event);
  });
  electron.ipcMain.handle("etax:export-sales", (_, options) => {
    return generateEtaxSalesCsv(options);
  });
  electron.ipcMain.handle("etax:export-purchases", (_, options) => {
    return generateEtaxPurchasesCsv(options);
  });
  electron.ipcMain.handle("etax:validate", (_, csv, type) => {
    return validateEtaxCsv(csv, type);
  });
  electron.ipcMain.handle("etax:export-all", (_, options) => {
    return exportEtaxCsv(options);
  });
  registerBusinessDomainHandlers({
    getActiveBusinessId,
    isOwnerOrSuper: () => currentUserRole === "super_admin" || currentUserRole === "owner",
    buildPermissionContext: () => {
      const canApprove = currentUserRole === "super_admin" || currentUserRole === "owner" || (currentUserPermissions ?? []).includes("*");
      if (currentUserSharedPerms) {
        return { permissions: currentUserSharedPerms, canApprove };
      }
      const permissions = {};
      for (const r of BUILTIN_ROLES) for (const [k, v] of Object.entries(r.permissions)) permissions[k] = v;
      return { permissions: { ...permissions, business: true, settings: true }, canApprove };
    },
    audit: (action, entityType, entityId, description) => insertAuditLog(action, entityType, entityId, null, null, null, description)
  });
  console.log("[Handlers] All IPC handlers registered successfully");
}
function checkStockConsistency(bizId) {
  const items = dbProxy.prepare("SELECT id, name, totalBaseQuantity FROM items WHERE businessId = ? AND is_deleted = 0").all(bizId);
  const inconsistent = [];
  for (const item of items) {
    const whSum = dbProxy.prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM warehouse_inventory WHERE itemId = ?").get(item.id);
    const expected = item.totalBaseQuantity || 0;
    const actual = whSum?.total || 0;
    if (Math.abs(expected - actual) > 1e-3) {
      inconsistent.push({ itemId: item.id, itemName: item.name, expected, actual, diff: expected - actual });
    }
  }
  return { inconsistent, checked: items.length };
}
class MdnsDiscovery extends events.EventEmitter {
  bonjour = null;
  isPublishing = false;
  isBrowsing = false;
  discoveredServices = /* @__PURE__ */ new Map();
  constructor() {
    super();
  }
  start() {
    if (this.bonjour) return;
    this.bonjour = new bonjourService.Bonjour();
    this.bonjour.on("error", (err) => {
      console.error("[mDNS] Bonjour error:", err);
      this.emit("error", err);
    });
    this.startPublishing();
    this.startBrowsing();
  }
  startPublishing() {
    if (!this.bonjour || this.isPublishing) return;
    const deviceId = ensureHubDeviceId();
    const pairingToken = getPairingToken();
    const port = SYNC_PORT;
    let businessId = "";
    try {
      const row = require("../database").default.prepare(
        "SELECT uuid FROM businesses WHERE isDefault = 1 OR id = 1 LIMIT 1"
      ).get();
      businessId = row?.uuid ?? "";
    } catch {
    }
    const txtRecord = {
      device_id: deviceId,
      pairing_token: pairingToken,
      schema_version: "21",
      port: String(port),
      platform: "desktop",
      business_id: businessId,
      capabilities: "lan,sync,cloud,desktop"
    };
    this.bonjour.publish({
      name: `Shega POS Hub (${deviceId.slice(0, 8)})`,
      type: "shega-pos",
      protocol: "tcp",
      port,
      txt: txtRecord
    });
    this.isPublishing = true;
    console.log(`[mDNS] Publishing service: Shega POS Hub on port ${port}`);
  }
  startBrowsing() {
    if (!this.bonjour || this.isBrowsing) return;
    const browser = this.bonjour.find({ type: "shega-pos", protocol: "tcp" });
    browser.on("up", (service) => {
      const deviceId = service.txt?.device_id;
      if (!deviceId) return;
      const hubId = ensureHubDeviceId();
      if (deviceId === hubId) return;
      const discovered = {
        deviceId,
        pairingToken: service.txt?.pairing_token || "",
        schemaVersion: parseInt(service.txt?.schema_version || "0", 10),
        port: service.port,
        hostname: service.host,
        addresses: service.addresses || [],
        capabilities: (service.txt?.capabilities || "").split(",").filter(Boolean),
        discoveredAt: Date.now(),
        host: service.addresses?.[0] || service.host,
        platform: service.txt?.platform || "desktop",
        businessId: service.txt?.business_id || void 0
      };
      this.discoveredServices.set(deviceId, discovered);
      console.log(`[mDNS] Discovered hub: ${deviceId} at ${discovered.host}:${service.port}`);
      this.emit("up", discovered);
    });
    browser.on("down", (service) => {
      const deviceId = service.txt?.device_id;
      if (!deviceId) return;
      const existing = this.discoveredServices.get(deviceId);
      if (existing) {
        this.discoveredServices.delete(deviceId);
        console.log(`[mDNS] Hub went down: ${deviceId}`);
        this.emit("down", existing);
      }
    });
    browser.on("error", (err) => {
      console.error("[mDNS] Browser error:", err);
      this.emit("error", err);
    });
    this.isBrowsing = true;
    console.log("[mDNS] Browsing for Shega POS hubs...");
  }
  getDiscoveredServices() {
    return Array.from(this.discoveredServices.values());
  }
  getService(deviceId) {
    return this.discoveredServices.get(deviceId);
  }
  stop() {
    if (this.bonjour) {
      this.bonjour.destroy();
      this.bonjour = null;
    }
    this.isPublishing = false;
    this.isBrowsing = false;
    this.discoveredServices.clear();
    console.log("[mDNS] Stopped");
  }
}
const mdnsDiscovery = new MdnsDiscovery();
const now = () => (/* @__PURE__ */ new Date()).toISOString();
function rowToRecord(row) {
  return {
    requestId: row.id,
    businessId: row.business_id,
    code: row.code,
    joinerDeviceId: row.joiner_device_id,
    joinerName: row.joiner_name,
    joinerModel: row.joiner_model,
    joinerUser: row.joiner_user,
    role: row.role,
    platform: row.platform,
    status: row.status,
    createdAt: row.created_at,
    decidedAt: row.decided_at
  };
}
function submitDeviceJoinRequest(req) {
  const existing = dbProxy.prepare("SELECT * FROM device_requests WHERE business_id = ? AND joiner_device_id = ? AND status = ?").get(req.businessId, req.joinerDeviceId, "pending");
  if (existing) return rowToRecord(existing);
  const id = crypto$1.randomBytes(12).toString("hex");
  dbProxy.prepare(
    `INSERT INTO device_requests
       (id, business_id, code, joiner_device_id, joiner_name, joiner_model, joiner_user, role, platform, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).run(
    id,
    req.businessId,
    req.code ?? null,
    req.joinerDeviceId,
    req.joinerName ?? null,
    req.joinerModel ?? null,
    req.joinerUser,
    req.role ?? "cashier",
    req.platform ?? "mobile",
    now()
  );
  return rowToRecord(dbProxy.prepare("SELECT * FROM device_requests WHERE id = ?").get(id));
}
function listDeviceJoinRequests(businessId, limit = 100) {
  const rows = dbProxy.prepare(
    `SELECT * FROM device_requests WHERE business_id = ?
     ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC LIMIT ?`
  ).all(businessId, limit);
  return rows.map(rowToRecord);
}
function decideDeviceJoinRequest(decision) {
  const row = dbProxy.prepare("SELECT * FROM device_requests WHERE id = ?").get(decision.requestId);
  if (!row) return null;
  dbProxy.prepare("UPDATE device_requests SET status = ?, decided_at = ? WHERE id = ?").run(
    decision.decision,
    now(),
    decision.requestId
  );
  return rowToRecord(dbProxy.prepare("SELECT * FROM device_requests WHERE id = ?").get(decision.requestId));
}
function getDeviceJoinRequestBy(code, joinerDeviceId) {
  const row = dbProxy.prepare(
    `SELECT * FROM device_requests WHERE code = ? AND joiner_device_id = ?
     ORDER BY created_at DESC LIMIT 1`
  ).get(code, joinerDeviceId);
  return row ? rowToRecord(row) : null;
}
function publishInvitation(inv) {
  dbProxy.prepare(
    `INSERT OR REPLACE INTO invitations (id, business_id, code, name, role, platform, created_by, expires_at, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 'open', ?)`
  ).run(
    inv.id,
    inv.businessId,
    inv.code,
    inv.name ?? null,
    inv.role ?? null,
    inv.platform ?? "mobile",
    inv.expiresAt ?? null,
    now()
  );
}
function resolveInvitation(code) {
  const row = dbProxy.prepare(
    `SELECT * FROM invitations WHERE code = ? AND status = 'open'`
  ).get(code);
  if (!row) return null;
  if (row.expires_at && row.expires_at < now()) {
    dbProxy.prepare(`UPDATE invitations SET status = 'expired' WHERE id = ?`).run(row.id);
    return null;
  }
  return {
    id: row.id,
    businessId: row.business_id,
    code: row.code,
    name: row.name,
    role: row.role,
    platform: row.platform,
    expiresAt: row.expires_at
  };
}
const WS_SYNC_PORT = 5758;
class WsSyncServer extends events.EventEmitter {
  wss = null;
  clients = /* @__PURE__ */ new Map();
  heartbeatInterval = null;
  start() {
    if (this.wss) return;
    this.wss = new ws.WebSocketServer({ port: WS_SYNC_PORT });
    this.wss.on("connection", (ws2, req) => {
      this.handleConnection(ws2, req);
    });
    this.wss.on("error", (err) => {
      logger.error("[WS] Server error:", err);
      this.emit("error", err);
    });
    this.heartbeatInterval = setInterval(() => this.sendHeartbeats(), 3e4);
    logger.info(`[WS] Sync server listening on port ${WS_SYNC_PORT}`);
  }
  handleConnection(ws2, req) {
    const clientId = crypto$1.randomBytes(8).toString("hex");
    const client = {
      ws: ws2,
      deviceId: "",
      paired: false,
      lastHeartbeat: Date.now(),
      lastSeq: 0
    };
    this.clients.set(clientId, client);
    logger.info(`[WS] Client connected: ${clientId}`);
    ws2.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        this.handleMessage(clientId, client, msg);
      } catch (e) {
        logger.warn("[WS] Invalid message:", e);
        this.sendError(ws2, "INVALID_MESSAGE", "Malformed JSON");
      }
    });
    ws2.on("close", () => {
      this.handleDisconnect(clientId, client);
    });
    ws2.on("error", (err) => {
      logger.warn("[WS] Client error:", err);
    });
  }
  handleMessage(clientId, client, msg) {
    const ws$1 = client.ws;
    if (ws$1.readyState !== ws.WebSocket.OPEN) return;
    switch (msg.type) {
      case "HEARTBEAT":
        client.lastHeartbeat = Date.now();
        this.send(ws$1, { type: "HEARTBEAT_ACK", timestamp: Date.now() });
        break;
      case "PAIR_REQUEST":
        this.handlePairRequest(clientId, client, msg);
        break;
      case "SYNC_PUSH":
        this.handleSyncPush(clientId, client, msg);
        break;
      case "SYNC_PULL":
        this.handleSyncPull(clientId, client, msg);
        break;
      case "SYNC_VERIFY":
        this.handleSyncVerify(clientId, client, msg);
        break;
      case "RESYNC_REQUEST":
        this.handleResyncRequest(clientId, client, msg);
        break;
      case DEVICE_JOIN_MSG.SUBMIT:
        this.handleDeviceJoinSubmit(clientId, client, msg);
        break;
      case DEVICE_JOIN_MSG.LIST:
        this.handleDeviceJoinList(clientId, client, msg);
        break;
      case DEVICE_JOIN_MSG.DECIDE:
        this.handleDeviceJoinDecide(clientId, client, msg);
        break;
      case DEVICE_JOIN_MSG.PUBLISH:
        this.handleInvitePublish(clientId, client, msg);
        break;
      case DEVICE_JOIN_MSG.RESOLVE:
        this.handleInviteResolve(clientId, client, msg);
        break;
      case DEVICE_JOIN_MSG.STATUS:
        this.handleDeviceJoinStatus(clientId, client, msg);
        break;
      default:
        this.sendError(ws$1, "UNKNOWN_TYPE", `Unknown message type: ${msg.type}`);
    }
  }
  handlePairRequest(clientId, client, msg) {
    const ws2 = client.ws;
    const { device_id, name, token } = msg.payload || {};
    if (!device_id) {
      this.sendError(ws2, "PAIR_FAILED", "device_id required");
      return;
    }
    const hubToken = getPairingToken();
    if (token && token.trim().toUpperCase() !== hubToken) {
      this.sendError(ws2, "PAIR_FAILED", "Invalid pairing token");
      return;
    }
    registerDevice(device_id, name);
    client.deviceId = device_id;
    client.paired = true;
    this.send(ws2, {
      type: "PAIR_RESPONSE",
      requestId: msg.requestId,
      payload: {
        success: true,
        hubId: ensureHubDeviceId(),
        pairingToken: hubToken,
        schemaVersion: 21
      }
    });
    logger.info(`[WS] Device paired: ${device_id} (${name || "unknown"})`);
    this.emit("clientConnected", this.clients.get(clientId));
  }
  handleDeviceJoinSubmit(clientId, client, msg) {
    const ws2 = client.ws;
    if (!client.paired) {
      this.sendError(ws2, "NOT_PAIRED", "Device not paired");
      return;
    }
    const payload = msg.payload || {};
    if (!payload.businessId || !payload.joinerDeviceId) {
      this.sendError(ws2, "DEVICE_JOIN_FAILED", "businessId and joinerDeviceId required");
      return;
    }
    const rec = submitDeviceJoinRequest(payload);
    this.send(ws2, { type: DEVICE_JOIN_MSG.ACK, requestId: msg.requestId, payload: { requestId: rec.requestId, status: rec.status } });
    logger.info(`[WS] Device join request staged: ${rec.joinerDeviceId} -> ${rec.businessId}`);
  }
  handleDeviceJoinList(clientId, client, msg) {
    const ws2 = client.ws;
    if (!client.paired) {
      this.sendError(ws2, "NOT_PAIRED", "Device not paired");
      return;
    }
    const { businessId } = msg.payload || {};
    if (!businessId) {
      this.sendError(ws2, "DEVICE_JOIN_FAILED", "businessId required");
      return;
    }
    const requests = listDeviceJoinRequests(businessId);
    this.send(ws2, { type: DEVICE_JOIN_MSG.RESPONSE, requestId: msg.requestId, payload: { requests } });
  }
  handleDeviceJoinDecide(clientId, client, msg) {
    const ws2 = client.ws;
    if (!client.paired) {
      this.sendError(ws2, "NOT_PAIRED", "Device not paired");
      return;
    }
    const payload = msg.payload || {};
    if (!payload.requestId || !payload.decision) {
      this.sendError(ws2, "DEVICE_JOIN_FAILED", "requestId and decision required");
      return;
    }
    const rec = decideDeviceJoinRequest(payload);
    if (!rec) {
      this.sendError(ws2, "DEVICE_JOIN_FAILED", "request not found");
      return;
    }
    this.send(ws2, { type: DEVICE_JOIN_MSG.RESPONSE, requestId: msg.requestId, payload: { record: rec } });
    logger.info(`[WS] Device join ${payload.decision}: ${rec.joinerDeviceId}`);
  }
  handleInvitePublish(clientId, client, msg) {
    const ws2 = client.ws;
    if (!client.paired) {
      this.sendError(ws2, "NOT_PAIRED", "Device not paired");
      return;
    }
    const p = msg.payload || {};
    if (!p.id || !p.businessId || !p.code) {
      this.sendError(ws2, "INVITE_FAILED", "id, businessId, code required");
      return;
    }
    publishInvitation(p);
    this.send(ws2, { type: DEVICE_JOIN_MSG.ACK, requestId: msg.requestId, payload: { published: true } });
  }
  handleInviteResolve(clientId, client, msg) {
    const ws2 = client.ws;
    const { code } = msg.payload || {};
    if (!code) {
      this.sendError(ws2, "INVITE_FAILED", "code required");
      return;
    }
    const inv = resolveInvitation(code);
    if (!inv) {
      this.sendError(ws2, "INVITE_INVALID", "Invitation not found or expired");
      return;
    }
    this.send(ws2, { type: DEVICE_JOIN_MSG.RESPONSE, requestId: msg.requestId, payload: { invitation: inv } });
  }
  handleDeviceJoinStatus(clientId, client, msg) {
    const ws2 = client.ws;
    const { code, joinerDeviceId } = msg.payload || {};
    if (!code || !joinerDeviceId) {
      this.sendError(ws2, "DEVICE_JOIN_FAILED", "code and joinerDeviceId required");
      return;
    }
    const rec = getDeviceJoinRequestBy(code, joinerDeviceId);
    this.send(ws2, { type: DEVICE_JOIN_MSG.RESPONSE, requestId: msg.requestId, payload: { record: rec } });
  }
  async handleSyncPush(clientId, client, msg) {
    const ws2 = client.ws;
    if (!client.paired) {
      this.sendError(ws2, "NOT_PAIRED", "Device not paired");
      return;
    }
    const { changes, client_seq } = msg.payload || {};
    if (!Array.isArray(changes)) {
      this.sendError(ws2, "INVALID_PAYLOAD", "changes must be array");
      return;
    }
    try {
      const result = applyPush(client.deviceId, changes);
      client.lastSeq = Math.max(client.lastSeq, client_seq || 0);
      this.send(ws2, {
        type: "SYNC_ACK",
        requestId: msg.requestId,
        payload: {
          applied: result.applied,
          conflicts: result.conflicts,
          skipped: result.skipped,
          pending: result.pending,
          serverSeq: this.getMaxSeq()
        }
      });
      this.emit("syncCompleted", this.clients.get(clientId), {
        pushed: result.applied,
        pulled: 0,
        conflicts: result.conflicts
      });
    } catch (e) {
      logger.error("[WS] Sync push failed:", e);
      this.sendError(ws2, "SYNC_PUSH_FAILED", e.message);
    }
  }
  async handleSyncPull(clientId, client, msg) {
    const ws2 = client.ws;
    if (!client.paired) {
      this.sendError(ws2, "NOT_PAIRED", "Device not paired");
      return;
    }
    const { since, force } = msg.payload || {};
    const sinceSeq = typeof since === "number" ? since : client.lastSeq;
    try {
      let result;
      if (force) {
        requestDeviceResync(client.deviceId);
      }
      result = snapshotSince(sinceSeq);
      client.lastSeq = result.lastSeq;
      this.send(ws2, {
        type: "SYNC_CHANGES",
        requestId: msg.requestId,
        payload: {
          changes: result.changes,
          lastSeq: result.lastSeq,
          snapshot: result.snapshot
        }
      });
      this.emit("syncCompleted", this.clients.get(clientId), {
        pushed: 0,
        pulled: result.changes.length,
        conflicts: 0
      });
    } catch (e) {
      logger.error("[WS] Sync pull failed:", e);
      this.sendError(ws2, "SYNC_PULL_FAILED", e.message);
    }
  }
  handleSyncVerify(clientId, client, msg) {
    const ws2 = client.ws;
    if (!client.paired) {
      this.sendError(ws2, "NOT_PAIRED", "Device not paired");
      return;
    }
    try {
      const checksums = verifyChecksums();
      this.send(ws2, {
        type: "SYNC_VERIFY_RESPONSE",
        requestId: msg.requestId,
        payload: { checksums }
      });
    } catch (e) {
      logger.error("[WS] Verify failed:", e);
      this.sendError(ws2, "VERIFY_FAILED", e.message);
    }
  }
  handleResyncRequest(clientId, client, msg) {
    const ws2 = client.ws;
    if (!client.paired) {
      this.sendError(ws2, "NOT_PAIRED", "Device not paired");
      return;
    }
    requestDeviceResync(client.deviceId);
    this.send(ws2, {
      type: "RESYNC_RESPONSE",
      requestId: msg.requestId,
      payload: { success: true }
    });
  }
  handleDisconnect(clientId, client) {
    this.clients.delete(clientId);
    logger.info(`[WS] Client disconnected: ${clientId} (${client.deviceId || "unpaired"})`);
    this.emit("clientDisconnected", client);
  }
  sendHeartbeats() {
    const now2 = Date.now();
    for (const [clientId, client] of this.clients) {
      if (now2 - client.lastHeartbeat > 9e4) {
        logger.warn(`[WS] Client timeout: ${clientId}`);
        client.ws.close();
        this.clients.delete(clientId);
        this.emit("clientDisconnected", client);
      } else if (client.ws.readyState === ws.WebSocket.OPEN) {
        this.send(client.ws, { type: "HEARTBEAT", timestamp: now2 });
      }
    }
  }
  getMaxSeq() {
    const r = dbProxy.prepare("SELECT COALESCE(MAX(seq),0) AS m FROM sync_outbox").get();
    return r?.m ?? 0;
  }
  send(ws$1, msg) {
    if (ws$1.readyState === ws.WebSocket.OPEN) {
      ws$1.send(JSON.stringify(msg));
    }
  }
  sendError(ws2, code, message) {
    this.send(ws2, { type: "ERROR", payload: { code, message } });
  }
  stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.clients.clear();
    logger.info("[WS] Server stopped");
  }
  getConnectedClients() {
    return Array.from(this.clients.values());
  }
  getClientCount() {
    return this.clients.size;
  }
}
const wsSyncServer = new WsSyncServer();
function startWsSyncServer() {
  wsSyncServer.start();
}
function verifyPeerMembership(peerBusinessId, peerDeviceId) {
  if (!peerBusinessId) {
    const existing = dbProxy.prepare(
      "SELECT device_id, name FROM devices WHERE device_id = ?"
    ).get(peerDeviceId);
    if (existing) return { allowed: true };
    return { allowed: false, reason: "unknown_device_no_business" };
  }
  const hubBusinessId = getCurrentBusinessId();
  if (!hubBusinessId) {
    return { allowed: false, reason: "hub_has_no_business" };
  }
  if (peerBusinessId !== hubBusinessId) {
    logger.warn("Business mismatch", { peer: peerBusinessId, hub: hubBusinessId });
    return { allowed: false, reason: "business_mismatch" };
  }
  return { allowed: true };
}
function getCurrentBusinessId() {
  const row = dbProxy.prepare(
    "SELECT uuid FROM businesses WHERE isDefault = 1 OR id = 1 LIMIT 1"
  ).get();
  return row?.uuid ?? null;
}
let syncInterval = null;
const LAN_SYNC_INTERVAL_MS = 3e4;
function startPeerSync() {
  const hubId = ensureHubDeviceId();
  const platform = process.platform === "darwin" ? "desktop" : "desktop";
  mdnsDiscovery.start();
  startWsSyncServer();
  startCloudSyncTimer();
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(async () => {
    try {
      await performLanSync();
    } catch (e) {
      logger.error("LAN sync cycle failed", { error: e?.message });
    }
  }, LAN_SYNC_INTERVAL_MS);
  logger.info("Peer sync started", { hubId, platform });
}
async function performLanSync() {
  const discovered = mdnsDiscovery.getDiscoveredServices();
  if (discovered.length === 0) return;
  for (const peer of discovered) {
    try {
      await syncWithPeerHub(peer);
    } catch (e) {
      logger.warn("Sync with peer hub failed", { peerId: peer.deviceId, error: e?.message });
    }
  }
}
async function syncWithPeerHub(peer) {
  const hubId = ensureHubDeviceId();
  const token = getPairingToken();
  const peerUrl = `http://${peer.host}:${peer.port}`;
  try {
    const infoRes = await fetch(`${peerUrl}/sync/info`);
    const info = await infoRes.json();
    if (!info.ok) return;
    const verification = verifyPeerMembership(info.businessId, peer.deviceId);
    if (!verification.allowed) {
      logger.warn("Peer auth failed", { peerId: peer.deviceId, reason: verification.reason });
      return;
    }
  } catch {
    return;
  }
  const pullUrl = `${peerUrl}/sync/pull?device=${encodeURIComponent(hubId)}&since=0&token=${encodeURIComponent(token)}`;
  try {
    const pullRes = await fetch(pullUrl);
    const pullData = await pullRes.json();
    const changes = pullData.changes;
    if (pullData.ok && changes && changes.length > 0) {
      const { applyRemoteChanges: applyRemoteChanges2 } = await Promise.resolve().then(() => syncHub$1);
      const result = applyRemoteChanges2(hubId, changes);
      logger.info("Peer sync pull", {
        peerId: peer.deviceId,
        pulled: changes.length,
        applied: result.applied,
        conflicts: result.conflicts
      });
    }
  } catch (e) {
    logger.warn("Peer pull failed", { peerId: peer.deviceId, error: e?.message });
  }
}
const DEFAULT_BASE = "https://shega-api-dah3.onrender.com";
function getSetting(key) {
  const row = dbProxy.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row?.value ?? null;
}
function setSetting(key, value) {
  dbProxy.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
}
function getBaseUrl() {
  return (getSetting("cloud_sync_url") || process.env.SHEGA_API_URL || DEFAULT_BASE).replace(/\/+$/, "");
}
let authPromise = null;
async function doAuthRequest(path2, body, {
  method = "GET",
  auth = false,
  retried = false
} = {}) {
  const headers = { Accept: "application/json", "Content-Type": "application/json" };
  let token = auth ? getSetting("pairing_access_token") : null;
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${getBaseUrl()}${path2}`, {
    method,
    headers,
    body: body !== void 0 ? JSON.stringify(body) : void 0
  });
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (res.status === 401 && auth && !retried) {
    const refreshed = await refreshPairingToken();
    if (refreshed) return doAuthRequest(path2, body, { method, auth, retried: true });
  }
  if (!res.ok) {
    const msg = data?.detail ?? data?.error ?? (typeof data === "string" ? data : `HTTP ${res.status}`);
    const err = new Error(typeof msg === "object" ? msg.detail ?? JSON.stringify(msg) : String(msg));
    err.status = res.status;
    err.detail = data?.detail ?? null;
    throw err;
  }
  return data;
}
async function refreshPairingToken() {
  if (authPromise) return authPromise;
  authPromise = (async () => {
    try {
      const refresh = getSetting("pairing_refresh_token");
      if (!refresh) return false;
      const res = await fetch(`${getBaseUrl()}/api/auth/refresh/`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ refresh })
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (!data?.access) return false;
      setSetting("pairing_access_token", data.access);
      if (data.refresh) setSetting("pairing_refresh_token", data.refresh);
      return true;
    } catch {
      return false;
    } finally {
      authPromise = null;
    }
  })();
  return authPromise;
}
function registerPairingCloudHandlers() {
  electron.ipcMain.handle("pairing:status", () => {
    const linked = !!getSetting("pairing_access_token");
    return {
      linked,
      email: getSetting("pairing_account_email") ?? null,
      businessName: getSetting("pairing_business_name") ?? null
    };
  });
  electron.ipcMain.handle("pairing:link-account", async (_e, email, password) => {
    if (!email?.trim() || !password) throw new Error("Email and password are required");
    const data = await doAuthRequest("/api/auth/login/", { email: email.trim().toLowerCase(), password }, { method: "POST" });
    const access = data?.access ?? data?.token;
    if (!access) throw new Error("Could not obtain an access token");
    setSetting("pairing_access_token", access);
    if (data?.refresh) setSetting("pairing_refresh_token", data.refresh);
    setSetting("pairing_account_email", email.trim().toLowerCase());
    setSetting("pairing_business_name", String(data?.user?.business_name ?? ""));
    setSetting("pairing_last_error", "");
    return { linked: true, email: email.trim().toLowerCase(), businessName: String(data?.user?.business_name ?? "") };
  });
  electron.ipcMain.handle("pairing:unlink", () => {
    dbProxy.prepare("DELETE FROM settings WHERE key LIKE 'pairing_%'").run();
    return { linked: false };
  });
  electron.ipcMain.handle("pairing:list", async () => {
    const res = await doAuthRequest("/api/sync/pairing/", {}, { auth: true });
    return res?.invitations ?? [];
  });
  electron.ipcMain.handle("pairing:invite", async (_e, input) => {
    const body = { role: input?.role ?? "cashier" };
    if (input?.employeeName) body.employee_name = input.employeeName;
    if (input?.register) body.register = input.register;
    if (input?.location) body.location = input.location;
    return doAuthRequest("/api/sync/pairing/invite/", body, { method: "POST", auth: true });
  });
  electron.ipcMain.handle("pairing:revoke", async (_e, id) => {
    return doAuthRequest(`/api/sync/pairing/${id}/revoke/`, {}, { method: "POST", auth: true });
  });
  electron.ipcMain.handle("pairing:decide", async (_e, id, decision) => {
    return doAuthRequest(`/api/sync/pairing/${id}/${decision}/`, {}, { method: "POST", auth: true });
  });
  electron.ipcMain.handle("pairing:qr-code", async (_e, text) => {
    if (!text?.trim()) throw new Error("Nothing to encode");
    return QRCode.toDataURL(text, { width: 340, margin: 2, errorCorrectionLevel: "M" });
  });
}
const syncHub = new SyncHub();
process.on("uncaughtException", (error) => {
  logger.fatal("uncaughtException", { error: String(error), stack: error?.stack });
});
process.on("unhandledRejection", (reason) => {
  logger.fatal("unhandledRejection", { reason: String(reason), stack: reason?.stack });
});
function createWindow() {
  const settingsPath = path.join(electron.app.getPath("userData"), "window-state.json");
  let windowState = { width: 1200, height: 800 };
  if (fs.existsSync(settingsPath)) {
    try {
      const saved = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      windowState = { ...windowState, ...saved };
    } catch {
    }
  }
  const mainWindow = new electron.BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    ...windowState.x !== void 0 && windowState.y !== void 0 ? { x: windowState.x, y: windowState.y } : {},
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../../src/assets/images/logo.ico"),
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });
  mainWindow.on("resize", () => {
    const bounds = mainWindow.getBounds();
    try {
      fs.writeFileSync(settingsPath, JSON.stringify({ width: bounds.width, height: bounds.height, x: bounds.x, y: bounds.y }));
    } catch {
    }
  });
  mainWindow.on("move", () => {
    const bounds = mainWindow.getBounds();
    try {
      fs.writeFileSync(settingsPath, JSON.stringify({ width: bounds.width, height: bounds.height, x: bounds.x, y: bounds.y }));
    } catch {
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
  mainWindow.webContents.on("preload-error", (_e, path2, error) => {
    logger.error("preload-error", { path: path2, error: String(error) });
    console.error("[Preload Error]", path2, error);
  });
  mainWindow.webContents.on("did-fail-load", (_e, code, desc, url, isMain) => {
    if (isMain) {
      logger.error("did-fail-load", { code, desc, url });
      console.error("[Did Fail Load]", code, desc, url);
    }
  });
  mainWindow.webContents.on("render-process-gone", (_e, details) => {
    logger.fatal("render-process-gone", { details });
    console.error("[Renderer Gone]", details);
  });
}
electron.app.whenReady().then(() => {
  try {
    initDB();
    registerIPCHandlers();
    registerPairingCloudHandlers();
    syncHub.start(SYNC_PORT);
    startPeerSync();
    createWindow();
  } catch (err) {
    logger.fatal("startup-failed", { error: String(err), stack: err?.stack });
    electron.dialog.showErrorBox("Startup failed", String(err));
    electron.app.quit();
  }
  const wins = electron.BrowserWindow.getAllWindows();
  if (wins.length > 0) {
    appUpdater.init(wins[0]);
    appUpdater.checkOnLaunch();
  }
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
exports.syncHub = syncHub;
