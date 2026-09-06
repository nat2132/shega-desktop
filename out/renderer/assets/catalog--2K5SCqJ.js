const VOID_REASONS = [
  { value: "wrong_item", label: "Wrong item sold" },
  { value: "wrong_quantity", label: "Wrong quantity" },
  { value: "wrong_price", label: "Wrong price applied" },
  { value: "duplicate_sale", label: "Duplicate / double-charge" },
  { value: "customer_request", label: "Customer request" },
  { value: "payment_error", label: "Payment error" },
  { value: "fraud_suspected", label: "Fraud suspected" },
  { value: "other", label: "Other" }
];
const RETURN_REASONS = [
  { value: "defective", label: "Defective / damaged" },
  { value: "wrong_item", label: "Wrong item received" },
  { value: "wrong_qty", label: "Wrong quantity" },
  { value: "exchange", label: "Exchange / swap" },
  { value: "customer_request", label: "Customer request" },
  { value: "expired", label: "Expired product" },
  { value: "other", label: "Other" }
];
const OVERRIDE_REASONS = [
  { value: "customer_discount", label: "Customer loyalty discount" },
  { value: "damaged_discount", label: "Damaged / display item" },
  { value: "price_match", label: "Price match" },
  { value: "clearance", label: "Clearance / promotion" },
  { value: "manager_decision", label: "Manager decision" },
  { value: "error_correction", label: "Pricing error correction" },
  { value: "other", label: "Other" }
];
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
Object.fromEntries(
  PERMISSION_CATALOG.map((p) => [p.key, p])
);
export {
  OVERRIDE_REASONS as O,
  RETURN_REASONS as R,
  VOID_REASONS as V,
  getDiscountCap as g
};
