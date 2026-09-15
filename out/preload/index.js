"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  // Businesses
  getActiveBusiness: () => electron.ipcRenderer.invoke("get-active-business"),
  updateBusiness: (id, biz) => electron.ipcRenderer.invoke("update-business", id, biz),
  businessList: () => electron.ipcRenderer.invoke("business:list"),
  businessCreate: (data) => electron.ipcRenderer.invoke("business:create", data),
  businessSwitch: (id) => electron.ipcRenderer.invoke("business:switch", id),
  businessSetDefault: (id) => electron.ipcRenderer.invoke("business:set-default", id),
  businessArchive: (id) => electron.ipcRenderer.invoke("business:archive", id),
  businessLeave: (id) => electron.ipcRenderer.invoke("business:leave", id),
  // Categories
  getCategories: () => electron.ipcRenderer.invoke("get-categories"),
  insertCategory: (name, icon) => electron.ipcRenderer.invoke("insert-category", name, icon),
  deleteCategory: (id) => electron.ipcRenderer.invoke("delete-category", id),
  // Items
  getItems: (options) => electron.ipcRenderer.invoke("get-items", options),
  getItem: (id) => electron.ipcRenderer.invoke("get-item", id),
  getItemByBarcode: (code) => electron.ipcRenderer.invoke("get-item-by-barcode", code),
  insertItem: (item) => electron.ipcRenderer.invoke("insert-item", item),
  updateItem: (id, item) => electron.ipcRenderer.invoke("update-item", id, item),
  deleteItem: (id) => electron.ipcRenderer.invoke("delete-item", id),
  generateShegaCode: () => electron.ipcRenderer.invoke("generate-shega-code"),
  itemBarcodesList: (itemId) => electron.ipcRenderer.invoke("item-barcodes:list", itemId),
  itemBarcodesAdd: (itemId, barcode) => electron.ipcRenderer.invoke("item-barcodes:add", itemId, barcode),
  itemBarcodesRemove: (barcodeId) => electron.ipcRenderer.invoke("item-barcodes:remove", barcodeId),
  itemBarcodesSetPrimary: (barcodeId) => electron.ipcRenderer.invoke("item-barcodes:set-primary", barcodeId),
  getLowStockItems: () => electron.ipcRenderer.invoke("get-low-stock-items"),
  getReorderSuggestions: () => electron.ipcRenderer.invoke("get-reorder-suggestions"),
  getReportDrilldowns: (range) => electron.ipcRenderer.invoke("get-report-drilldowns", range),
  getGlJournal: (range) => electron.ipcRenderer.invoke("get-gl-journal", range),
  getExpiringItems: () => electron.ipcRenderer.invoke("get-expiring-items"),
  getItemsBySupplier: (supplierId) => electron.ipcRenderer.invoke("get-items-by-supplier", supplierId),
  restockItem: (id, quantity, unit) => electron.ipcRenderer.invoke("restock-item", id, quantity, unit),
  archiveItem: (data) => electron.ipcRenderer.invoke("archive-item", data),
  restoreItem: (data) => electron.ipcRenderer.invoke("restore-item", data),
  getDeletedItems: () => electron.ipcRenderer.invoke("get-deleted-items"),
  // Sales
  getSales: (options) => electron.ipcRenderer.invoke("get-sales", options),
  getSale: (id) => electron.ipcRenderer.invoke("get-sale", id),
  insertSale: (sale) => electron.ipcRenderer.invoke("insert-sale", sale),
  insertSalesBatch: (sales) => electron.ipcRenderer.invoke("insert-sales-batch", sales),
  updateSale: (id, sale) => electron.ipcRenderer.invoke("update-sale", id, sale),
  deleteSale: (id) => electron.ipcRenderer.invoke("delete-sale", id),
  voidSale: (data) => electron.ipcRenderer.invoke("void-sale", data),
  getDebtSales: () => electron.ipcRenderer.invoke("get-debt-sales"),
  payDebt: (saleId, amount, options) => electron.ipcRenderer.invoke("pay-debt", saleId, amount, options),
  getDebtPayments: (saleId) => electron.ipcRenderer.invoke("get-debt-payments", saleId),
  reverseDebtPayment: (data) => electron.ipcRenderer.invoke("reverse-debt-payment", data),
  createReturn: (data) => electron.ipcRenderer.invoke("create-return", data),
  getReturns: (options) => electron.ipcRenderer.invoke("get-returns", options),
  // Notifications
  checkNotifications: () => electron.ipcRenderer.invoke("check-notifications"),
  getNotifications: (options) => electron.ipcRenderer.invoke("get-notifications", options),
  getUnreadNotificationCount: () => electron.ipcRenderer.invoke("get-unread-notification-count"),
  getNotificationCategories: () => electron.ipcRenderer.invoke("get-notification-categories"),
  insertNotification: (notification) => electron.ipcRenderer.invoke("insert-notification", notification),
  markNotificationRead: (id) => electron.ipcRenderer.invoke("mark-notification-read", id),
  markAllNotificationsRead: () => electron.ipcRenderer.invoke("mark-all-notifications-read"),
  dismissNotification: (id) => electron.ipcRenderer.invoke("dismiss-notification", id),
  snoozeNotification: (id, untilIso) => electron.ipcRenderer.invoke("snooze-notification", id, untilIso),
  clearNotifications: (options) => electron.ipcRenderer.invoke("clear-notifications", options),
  // Notification preferences
  getNotificationPreferences: () => electron.ipcRenderer.invoke("get-notification-preferences"),
  updateNotificationPreference: (key, prefs) => electron.ipcRenderer.invoke("update-notification-preference", key, prefs),
  // Banners
  getActiveBanners: () => electron.ipcRenderer.invoke("get-active-banners"),
  dismissBanner: (id) => electron.ipcRenderer.invoke("dismiss-banner", id),
  createBanner: (data) => electron.ipcRenderer.invoke("create-banner", data),
  // Reminders
  getReminders: (options) => electron.ipcRenderer.invoke("get-reminders", options),
  createReminder: (data) => electron.ipcRenderer.invoke("create-reminder", data),
  updateReminder: (id, data) => electron.ipcRenderer.invoke("update-reminder", id, data),
  snoozeReminder: (id, untilIso) => electron.ipcRenderer.invoke("snooze-reminder", id, untilIso),
  completeReminder: (id) => electron.ipcRenderer.invoke("complete-reminder", id),
  deleteReminder: (id) => electron.ipcRenderer.invoke("delete-reminder", id),
  runReminderEngine: () => electron.ipcRenderer.invoke("run-reminder-engine"),
  // Desktop OS notification
  showDesktopNotification: (data) => electron.ipcRenderer.invoke("show-desktop-notification", data),
  // Dashboard alerts
  getDashboardAlerts: () => electron.ipcRenderer.invoke("get-dashboard-alerts"),
  // Settings
  getSetting: (key) => electron.ipcRenderer.invoke("get-setting", key),
  setSetting: (key, value) => electron.ipcRenderer.invoke("set-setting", key, value),
  // Analytics / Dashboard
  getDashboardStats: () => electron.ipcRenderer.invoke("get-dashboard-stats"),
  getRecentActivity: (limit, dateRange) => electron.ipcRenderer.invoke("get-recent-activity", limit, dateRange),
  // P2P Yjs + WebRTC sync
  p2pHealth: () => electron.ipcRenderer.invoke("p2p:health"),
  p2pDevices: () => electron.ipcRenderer.invoke("p2p:devices"),
  p2pAnnounce: () => electron.ipcRenderer.invoke("p2p:announce"),
  p2pRevokeDevice: (deviceId) => electron.ipcRenderer.invoke("p2p:revoke-device", deviceId),
  p2pRenameDevice: (deviceId, name) => electron.ipcRenderer.invoke("p2p:rename-device", deviceId, name),
  p2pRecordCounts: () => electron.ipcRenderer.invoke("p2p:record-counts"),
  getAnalytics: (period, dateRange) => electron.ipcRenderer.invoke("get-analytics", period, dateRange),
  getVatReport: (dateRange) => electron.ipcRenderer.invoke("get-vat-report", dateRange),
  getVoidedSales: (options) => electron.ipcRenderer.invoke("get-voided-sales", options),
  getReversalStats: () => electron.ipcRenderer.invoke("get-reversal-stats"),
  // Customers
  getCustomers: () => electron.ipcRenderer.invoke("get-customers"),
  getCustomer: (id) => electron.ipcRenderer.invoke("get-customer", id),
  getCustomerSales: (customerName) => electron.ipcRenderer.invoke("get-customer-sales", customerName),
  insertCustomer: (customer) => electron.ipcRenderer.invoke("insert-customer", customer),
  updateCustomer: (customer) => electron.ipcRenderer.invoke("update-customer", customer),
  deleteCustomer: (id) => electron.ipcRenderer.invoke("delete-customer", id),
  archiveCustomer: (data) => electron.ipcRenderer.invoke("archive-customer", data),
  restoreCustomer: (data) => electron.ipcRenderer.invoke("restore-customer", data),
  getDeletedCustomers: () => electron.ipcRenderer.invoke("get-deleted-customers"),
  getCustomerNotes: (customerId) => electron.ipcRenderer.invoke("get-customer-notes", customerId),
  addCustomerNote: (customerId, note, createdBy) => electron.ipcRenderer.invoke("add-customer-note", customerId, note, createdBy),
  // Data Management
  exportData: () => electron.ipcRenderer.invoke("export-data"),
  resetData: (mode = "all") => electron.ipcRenderer.invoke("reset-data", mode),
  // Admin Management
  login: (username, pin) => electron.ipcRenderer.invoke("login", username, pin),
  getAdmins: () => electron.ipcRenderer.invoke("get-admins"),
  getLoginUsers: () => electron.ipcRenderer.invoke("get-login-users"),
  loginByUser: (source, id, pin) => electron.ipcRenderer.invoke("login-by-user", source, id, pin),
  getCurrentAdmin: (id, isEmployee) => electron.ipcRenderer.invoke("get-current-admin", id, isEmployee),
  insertAdmin: (admin) => electron.ipcRenderer.invoke("insert-admin", admin),
  updateAdmin: (id, admin) => electron.ipcRenderer.invoke("update-admin", id, admin),
  deleteAdmin: (id) => electron.ipcRenderer.invoke("delete-admin", id),
  // Warehouses
  getWarehouses: () => electron.ipcRenderer.invoke("get-warehouses"),
  getWarehouse: (id) => electron.ipcRenderer.invoke("get-warehouse", id),
  insertWarehouse: (wh) => electron.ipcRenderer.invoke("insert-warehouse", wh),
  updateWarehouse: (id, wh) => electron.ipcRenderer.invoke("update-warehouse", id, wh),
  deleteWarehouse: (id) => electron.ipcRenderer.invoke("delete-warehouse", id),
  // Warehouse Inventory
  getWarehouseInventory: (warehouseId) => electron.ipcRenderer.invoke("get-warehouse-inventory", warehouseId),
  getAllWarehouseInventory: (options) => electron.ipcRenderer.invoke("get-all-warehouse-inventory", options),
  updateWarehouseInventory: (warehouseId, itemId, quantity) => electron.ipcRenderer.invoke("update-warehouse-inventory", warehouseId, itemId, quantity),
  // Stock Transfers
  transferStock: (transfer) => electron.ipcRenderer.invoke("transfer-stock", transfer),
  getStockTransfers: (options) => electron.ipcRenderer.invoke("get-stock-transfers", options),
  // Stock Movements
  getStockMovements: (options) => electron.ipcRenderer.invoke("get-stock-movements", options),
  cleanupStockMovements: () => electron.ipcRenderer.invoke("cleanup-stock-movements"),
  getWarehouseReport: (warehouseId) => electron.ipcRenderer.invoke("get-warehouse-report", warehouseId),
  // Stock Consistency
  checkStockConsistency: () => electron.ipcRenderer.invoke("check-stock-consistency"),
  fixStockConsistency: () => electron.ipcRenderer.invoke("fix-stock-consistency"),
  // Employee Roles
  getEmployeeRoles: () => electron.ipcRenderer.invoke("get-employee-roles"),
  getEmployeeRole: (id) => electron.ipcRenderer.invoke("get-employee-role", id),
  insertEmployeeRole: (data) => electron.ipcRenderer.invoke("insert-employee-role", data),
  updateEmployeeRole: (id, data) => electron.ipcRenderer.invoke("update-employee-role", id, data),
  duplicateEmployeeRole: (id) => electron.ipcRenderer.invoke("duplicate-employee-role", id),
  deleteEmployeeRole: (id) => electron.ipcRenderer.invoke("delete-employee-role", id),
  // Employees
  getEmployees: (options) => electron.ipcRenderer.invoke("get-employees", options),
  getEmployee: (id) => electron.ipcRenderer.invoke("get-employee", id),
  insertEmployee: (data) => electron.ipcRenderer.invoke("insert-employee", data),
  updateEmployee: (id, data) => electron.ipcRenderer.invoke("update-employee", id, data),
  deleteEmployee: (id) => electron.ipcRenderer.invoke("delete-employee", id),
  archiveEmployee: (id) => electron.ipcRenderer.invoke("archive-employee", id),
  reactivateEmployee: (id) => electron.ipcRenderer.invoke("reactivate-employee", id),
  // Employee Accounts
  getEmployeeAccounts: () => electron.ipcRenderer.invoke("get-employee-accounts"),
  insertEmployeeAccount: (data) => electron.ipcRenderer.invoke("insert-employee-account", data),
  updateEmployeeAccount: (id, data) => electron.ipcRenderer.invoke("update-employee-account", id, data),
  deleteEmployeeAccount: (id) => electron.ipcRenderer.invoke("delete-employee-account", id),
  lockEmployeeAccount: (id) => electron.ipcRenderer.invoke("lock-employee-account", id),
  unlockEmployeeAccount: (id) => electron.ipcRenderer.invoke("unlock-employee-account", id),
  resetEmployeePassword: (id, newPin) => electron.ipcRenderer.invoke("reset-employee-password", id, newPin),
  loginEmployee: (username, pin) => electron.ipcRenderer.invoke("login-employee", username, pin),
  // PIN Recovery
  generateRecoveryKey: (entityType, entityId) => electron.ipcRenderer.invoke("generate-recovery-key", entityType, entityId),
  verifyRecoveryKey: (username, recoveryKey) => electron.ipcRenderer.invoke("verify-recovery-key", username, recoveryKey),
  resetPinWithRecovery: (username, recoveryKey, newPin) => electron.ipcRenderer.invoke("reset-pin-with-recovery", username, recoveryKey, newPin),
  lockUserAccount: (id) => electron.ipcRenderer.invoke("lock-user-account", id),
  unlockUserAccount: (id) => electron.ipcRenderer.invoke("unlock-user-account", id),
  forcePinChange: (id) => electron.ipcRenderer.invoke("force-pin-change", id),
  getPinHistory: (entityType, entityId) => electron.ipcRenderer.invoke("get-pin-history", entityType, entityId),
  // Login History
  getLoginHistory: (options) => electron.ipcRenderer.invoke("get-login-history", options),
  // Attendance
  clockIn: (employeeId, notes) => electron.ipcRenderer.invoke("clock-in", employeeId, notes),
  clockOut: (employeeId, notes) => electron.ipcRenderer.invoke("clock-out", employeeId, notes),
  getAttendance: (options) => electron.ipcRenderer.invoke("get-attendance", options),
  getTodayAttendance: () => electron.ipcRenderer.invoke("get-today-attendance"),
  // Employee Performance
  getEmployeePerformance: (options) => electron.ipcRenderer.invoke("get-employee-performance", options),
  updateEmployeePerformance: (data) => electron.ipcRenderer.invoke("update-employee-performance", data),
  // Employee Stats (Dashboard)
  getEmployeeStats: () => electron.ipcRenderer.invoke("get-employee-stats"),
  getAuditLogs: (options) => electron.ipcRenderer.invoke("get-audit-logs", options),
  reverseAuditLogEntry: (data) => electron.ipcRenderer.invoke("reverse-audit-log-entry", data),
  // Shipments
  getShipments: (options) => electron.ipcRenderer.invoke("get-shipments", options),
  getShipment: (id) => electron.ipcRenderer.invoke("get-shipment", id),
  insertShipment: (data) => electron.ipcRenderer.invoke("insert-shipment", data),
  updateShipment: (id, data) => electron.ipcRenderer.invoke("update-shipment", id, data),
  updateShipmentStatus: (id, status, changedBy, notes) => electron.ipcRenderer.invoke("update-shipment-status", id, status, changedBy, notes),
  deleteShipment: (id) => electron.ipcRenderer.invoke("delete-shipment", id),
  getShipmentHistory: (shipmentId) => electron.ipcRenderer.invoke("get-shipment-history", shipmentId),
  // Suppliers
  getSuppliers: (options) => electron.ipcRenderer.invoke("get-suppliers", options),
  getSupplier: (id) => electron.ipcRenderer.invoke("get-supplier", id),
  insertSupplier: (data) => electron.ipcRenderer.invoke("insert-supplier", data),
  updateSupplier: (id, data) => electron.ipcRenderer.invoke("update-supplier", id, data),
  archiveSupplier: (id) => electron.ipcRenderer.invoke("archive-supplier", id),
  restoreSupplier: (id) => electron.ipcRenderer.invoke("restore-supplier", id),
  deleteSupplier: (id) => electron.ipcRenderer.invoke("delete-supplier", id),
  // Supplier Purchases
  getSupplierPurchases: (options) => electron.ipcRenderer.invoke("get-supplier-purchases", options),
  getSupplierPurchase: (id) => electron.ipcRenderer.invoke("get-supplier-purchase", id),
  insertSupplierPurchase: (data) => electron.ipcRenderer.invoke("insert-supplier-purchase", data),
  updateSupplierPurchaseStatus: (id, status, notes) => electron.ipcRenderer.invoke("update-supplier-purchase-status", id, status, notes),
  deleteSupplierPurchase: (id) => electron.ipcRenderer.invoke("delete-supplier-purchase", id),
  // Supplier Payments
  getSupplierPayments: (options) => electron.ipcRenderer.invoke("get-supplier-payments", options),
  insertSupplierPayment: (data) => electron.ipcRenderer.invoke("insert-supplier-payment", data),
  updateSupplierPayment: (id, data) => electron.ipcRenderer.invoke("update-supplier-payment", id, data),
  deleteSupplierPayment: (id) => electron.ipcRenderer.invoke("delete-supplier-payment", id),
  reverseSupplierPayment: (data) => electron.ipcRenderer.invoke("reverse-supplier-payment", data),
  // Supplier Products / Balances / Reports
  getSupplierProducts: (supplierId) => electron.ipcRenderer.invoke("get-supplier-products", supplierId),
  getSupplierBalance: (supplierId) => electron.ipcRenderer.invoke("get-supplier-balance", supplierId),
  getSupplierAgingReport: () => electron.ipcRenderer.invoke("get-supplier-aging-report"),
  getSupplierDashboardStats: () => electron.ipcRenderer.invoke("get-supplier-dashboard-stats"),
  getSupplierMonthlyReport: () => electron.ipcRenderer.invoke("get-supplier-monthly-report"),
  getTopSuppliers: (limit) => electron.ipcRenderer.invoke("get-top-suppliers", limit),
  toggleSupplierFavorite: (id) => electron.ipcRenderer.invoke("toggle-supplier-favorite", id),
  getSupplierActivityLog: (supplierId, limit) => electron.ipcRenderer.invoke("get-supplier-activity-log", supplierId, limit),
  getSupplierAnalytics: () => electron.ipcRenderer.invoke("get-supplier-analytics"),
  // Backup & Restore
  createBackup: () => electron.ipcRenderer.invoke("create-backup"),
  listBackups: () => electron.ipcRenderer.invoke("list-backups"),
  restoreBackup: (name) => electron.ipcRenderer.invoke("restore-backup", name),
  deleteBackup: (name) => electron.ipcRenderer.invoke("delete-backup", name),
  // Receipt Printing
  printReceipt: (sale) => electron.ipcRenderer.invoke("print-receipt", sale),
  // Peripherals (Phase 2)
  openCashDrawer: () => electron.ipcRenderer.invoke("open-cash-drawer"),
  printTestPage: () => electron.ipcRenderer.invoke("print-test-page"),
  printLabel: (label) => electron.ipcRenderer.invoke("print-label", label),
  barcodePng: (value) => electron.ipcRenderer.invoke("barcode-png", value),
  barcodePngDataUrl: (value) => electron.ipcRenderer.invoke("barcode-png-dataurl", value),
  simulateScan: (code) => electron.ipcRenderer.invoke("simulate-scan", code),
  getPrintStatus: () => electron.ipcRenderer.invoke("get-print-status"),
  setPrinterConfig: (cfg) => electron.ipcRenderer.invoke("set-printer-config", cfg),
  parseScaleReading: (line) => electron.ipcRenderer.invoke("parse-scale-reading", line),
  // Sync hub (Phase 3)
  syncStatus: () => electron.ipcRenderer.invoke("sync:status"),
  syncVerify: () => electron.ipcRenderer.invoke("sync:verify"),
  syncLog: (limit) => electron.ipcRenderer.invoke("sync:log", limit),
  syncResync: (deviceId) => electron.ipcRenderer.invoke("sync:resync", deviceId),
  // Audit (Phase 4)
  verifyAuditChain: () => electron.ipcRenderer.invoke("verify-audit-chain"),
  // Draft Sales
  getDraftSales: () => electron.ipcRenderer.invoke("get-draft-sales"),
  getDraftSale: (id) => electron.ipcRenderer.invoke("get-draft-sale", id),
  saveDraftSale: (data) => electron.ipcRenderer.invoke("save-draft-sale", data),
  deleteDraftSale: (id) => electron.ipcRenderer.invoke("delete-draft-sale", id),
  // Supplier Price Checks
  getSupplierPriceChecks: (supplierId) => electron.ipcRenderer.invoke("get-supplier-price-checks", supplierId),
  saveSupplierPriceCheck: (data) => electron.ipcRenderer.invoke("save-supplier-price-check", data),
  deleteSupplierPriceCheck: (id) => electron.ipcRenderer.invoke("delete-supplier-price-check", id),
  // Quiet Hours
  getQuietHours: () => electron.ipcRenderer.invoke("get-quiet-hours"),
  setQuietHours: (data) => electron.ipcRenderer.invoke("set-quiet-hours", data),
  deleteQuietHours: () => electron.ipcRenderer.invoke("delete-quiet-hours"),
  // External links
  openExternal: (url) => electron.ipcRenderer.invoke("open-external", url),
  // Supplier Reports
  getSupplierReportSummary: () => electron.ipcRenderer.invoke("get-supplier-report-summary"),
  getSupplierTransactionReport: (options) => electron.ipcRenderer.invoke("get-supplier-transaction-report", options),
  getInventoryBySupplierReport: () => electron.ipcRenderer.invoke("get-inventory-by-supplier-report"),
  getSupplierUnpaidOrders: () => electron.ipcRenderer.invoke("get-supplier-unpaid-orders"),
  getSupplierPaymentDueAlerts: () => electron.ipcRenderer.invoke("get-supplier-payment-due-alerts"),
  getSupplierLowStock: () => electron.ipcRenderer.invoke("get-supplier-low-stock"),
  // CSV / Data Import
  importData: (module, rows) => electron.ipcRenderer.invoke("import-data", module, rows),
  // Order Management
  getOrders: (options) => electron.ipcRenderer.invoke("get-orders", options),
  getOrder: (id) => electron.ipcRenderer.invoke("get-order", id),
  insertOrder: (data) => electron.ipcRenderer.invoke("insert-order", data),
  convertOrderToSale: (data) => electron.ipcRenderer.invoke("convert-order-to-sale", data),
  convertOrderToDebt: (data) => electron.ipcRenderer.invoke("convert-order-to-debt", data),
  cancelOrder: (data) => electron.ipcRenderer.invoke("cancel-order", data),
  // Global Search
  globalSearch: (query) => electron.ipcRenderer.invoke("global-search", query),
  // Business Health Score
  getBusinessHealthScore: () => electron.ipcRenderer.invoke("get-business-health-score"),
  // Business Assistant Insights
  getBusinessInsights: () => electron.ipcRenderer.invoke("get-business-insights"),
  // Subscription System
  getSubscriptionPlans: () => electron.ipcRenderer.invoke("get-subscription-plans"),
  getCurrentSubscription: () => electron.ipcRenderer.invoke("get-current-subscription"),
  startTrial: () => electron.ipcRenderer.invoke("start-trial"),
  submitPayment: (data) => electron.ipcRenderer.invoke("submit-payment", data),
  getPaymentTransactions: (options) => electron.ipcRenderer.invoke("get-payment-transactions", options),
  getAllPaymentTransactions: (options) => electron.ipcRenderer.invoke("get-all-payment-transactions", options),
  approvePayment: (data) => electron.ipcRenderer.invoke("approve-payment", data),
  rejectPayment: (data) => electron.ipcRenderer.invoke("reject-payment", data),
  getSubscriptionHistory: () => electron.ipcRenderer.invoke("get-subscription-history"),
  getRenewalInfo: () => electron.ipcRenderer.invoke("get-renewal-info"),
  checkPremiumFeature: (feature) => electron.ipcRenderer.invoke("check-premium-feature", feature),
  getSubscriptionStats: () => electron.ipcRenderer.invoke("get-subscription-stats"),
  checkTrialAvailability: () => electron.ipcRenderer.invoke("check-trial-availability"),
  // Debug
  debugPing: () => electron.ipcRenderer.invoke("debug:ping"),
  // ── Update System ──
  checkForUpdates: () => electron.ipcRenderer.invoke("update:check"),
  downloadUpdate: () => electron.ipcRenderer.invoke("update:download"),
  installUpdate: () => electron.ipcRenderer.invoke("update:install"),
  skipVersion: (version) => electron.ipcRenderer.invoke("update:skip-version", version),
  remindLater: (hours) => electron.ipcRenderer.invoke("update:remind-later", hours),
  getUpdateStatus: () => electron.ipcRenderer.invoke("update:get-status"),
  setAutoCheckEnabled: (enabled) => electron.ipcRenderer.invoke("update:set-auto-check", enabled),
  getAppVersion: () => electron.ipcRenderer.invoke("update:get-app-version"),
  clearReminder: () => electron.ipcRenderer.invoke("update:clear-reminder"),
  onUpdateStatus: (callback) => {
    electron.ipcRenderer.on("update:status", (_event, data) => callback(data));
  },
  onUpdateProgress: (callback) => {
    electron.ipcRenderer.on("update:progress", (_event, data) => callback(data));
  },
  onUpdateError: (callback) => {
    electron.ipcRenderer.on("update:error", (_event, data) => callback(data));
  },
  removeUpdateListeners: () => {
    electron.ipcRenderer.removeAllListeners("update:status");
    electron.ipcRenderer.removeAllListeners("update:progress");
    electron.ipcRenderer.removeAllListeners("update:error");
  },
  // POS Products & Categories (cashier-safe)
  posProducts: () => electron.ipcRenderer.invoke("pos:products"),
  posCategories: () => electron.ipcRenderer.invoke("pos:categories"),
  posRegisters: () => electron.ipcRenderer.invoke("pos:shift-by-register"),
  // POS Shifts (cashier)
  posLastShift: (cashierId) => electron.ipcRenderer.invoke("shift:last-by-cashier", cashierId),
  shiftOpen: (data) => electron.ipcRenderer.invoke("shift:open", data),
  shiftClose: (shiftId, data) => electron.ipcRenderer.invoke("shift:close", shiftId, data),
  shiftMidAudit: (shiftId, countedCash, notes) => electron.ipcRenderer.invoke("shift:mid-audit", shiftId, countedCash, notes),
  shiftActive: (registerId) => electron.ipcRenderer.invoke("shift:active", registerId),
  shiftById: (shiftId) => electron.ipcRenderer.invoke("shift:by-id", shiftId),
  shiftTransactions: (shiftId) => electron.ipcRenderer.invoke("shift:transactions", shiftId),
  shiftSummary: (shiftId) => electron.ipcRenderer.invoke("shift:summary", shiftId),
  shiftRecordTransaction: (data) => electron.ipcRenderer.invoke("shift:record-transaction", data),
  // Shared Business Model (registers, devices, roles, people)
  businessListRegisters: () => electron.ipcRenderer.invoke("business:list-registers"),
  businessAddRegister: (name, locationId) => electron.ipcRenderer.invoke("business:add-register", name, locationId),
  businessUpdateRegister: (id, patch) => electron.ipcRenderer.invoke("business:update-register", id, patch),
  businessDeleteRegister: (id) => electron.ipcRenderer.invoke("business:delete-register", id),
  businessListLocations: () => electron.ipcRenderer.invoke("business:list-locations"),
  businessAddLocation: (name, address) => electron.ipcRenderer.invoke("business:add-location", name, address),
  businessListDevices: () => electron.ipcRenderer.invoke("business:list-devices"),
  businessSelfDeviceStatus: () => electron.ipcRenderer.invoke("business:self-device-status"),
  businessSetDeviceStatus: (deviceId, status) => electron.ipcRenderer.invoke("business:set-device-status", deviceId, status),
  businessRenameDevice: (deviceId, name) => electron.ipcRenderer.invoke("business:rename-device", deviceId, name),
  businessReplaceDevice: (input) => electron.ipcRenderer.invoke("business:replace-device", input),
  businessRoles: () => electron.ipcRenderer.invoke("business:roles"),
  businessCan: (key) => electron.ipcRenderer.invoke("business:can", key),
  businessListPeople: () => electron.ipcRenderer.invoke("business:list-people"),
  businessSetPersonRole: (employeeId, roleKey) => electron.ipcRenderer.invoke("business:set-person-role", employeeId, roleKey),
  businessSetPersonActive: (employeeId, isActive) => electron.ipcRenderer.invoke("business:set-person-active", employeeId, isActive),
  // Employee QR pairing (cloud)
  pairingStatus: () => electron.ipcRenderer.invoke("pairing:status"),
  pairingLinkAccount: (email, password) => electron.ipcRenderer.invoke("pairing:link-account", email, password),
  pairingUnlink: () => electron.ipcRenderer.invoke("pairing:unlink"),
  pairingList: () => electron.ipcRenderer.invoke("pairing:list"),
  pairingInvite: (input) => electron.ipcRenderer.invoke("pairing:invite", input),
  pairingRevoke: (id) => electron.ipcRenderer.invoke("pairing:revoke", id),
  pairingDecide: (id, decision, role, permissions) => electron.ipcRenderer.invoke("pairing:decide", id, decision, role, permissions),
  pairingQrCode: (text) => electron.ipcRenderer.invoke("pairing:qr-code", text),
  joinLookup: (code) => electron.ipcRenderer.invoke("join:lookup", code),
  joinAccept: (input) => electron.ipcRenderer.invoke("join:accept", input),
  joinStatus: (invitationId) => electron.ipcRenderer.invoke("join:status", invitationId),
  joinActivate: (pin) => electron.ipcRenderer.invoke("join:activate", pin),
  joinCancel: () => electron.ipcRenderer.invoke("join:cancel"),
  // Tax computation (existing pos modules, now reachable)
  taxCalculateWht: (input) => electron.ipcRenderer.invoke("tax:wht", input),
  taxCalculateVatReturn: (input) => electron.ipcRenderer.invoke("tax:vat-return", input),
  taxCalculateTotReturn: (input) => electron.ipcRenderer.invoke("tax:tot-return", input),
  taxCalculateMat: (grossTurnover) => electron.ipcRenderer.invoke("tax:mat", grossTurnover),
  taxCalculateAdvance: (estimatedAnnualTax) => electron.ipcRenderer.invoke("tax:advance", estimatedAnnualTax),
  taxCalculatePaye: (input) => electron.ipcRenderer.invoke("tax:paye", input),
  taxCalculatePension: (input) => electron.ipcRenderer.invoke("tax:pension", input),
  morQrGenerate: (data) => electron.ipcRenderer.invoke("mor-qr:generate", data),
  morQrValidate: (payload) => electron.ipcRenderer.invoke("mor-qr:validate", payload),
  morQrPrintReceipt: (data) => electron.ipcRenderer.invoke("mor-qr:print-receipt", data),
  complianceCheck: (context, rules) => electron.ipcRenderer.invoke("compliance:check", context, rules),
  complianceValidateTin: (tin) => electron.ipcRenderer.invoke("compliance:validate-tin", tin),
  complianceReport: (fromDate, toDate) => electron.ipcRenderer.invoke("compliance:report", fromDate, toDate),
  // §U — Ministry of Revenues taxpayer verification
  morVerify: (tin, subTin, force) => electron.ipcRenderer.invoke("mor:verify", tin, subTin, force),
  morGet: (tin, subTin) => electron.ipcRenderer.invoke("mor:get", tin, subTin),
  morList: () => electron.ipcRenderer.invoke("mor:list"),
  morClear: (tin) => electron.ipcRenderer.invoke("mor:clear", tin),
  morIsVerified: (tin, subTin) => electron.ipcRenderer.invoke("mor:is-verified", tin, subTin),
  // §15 — Manager PIN approval prompt (main → renderer event + renderer → main)
  onApprovalPrompt: (callback) => {
    electron.ipcRenderer.on("approval:prompt", (_event, payload) => callback(payload));
  },
  onBusinessChanged: (callback) => {
    electron.ipcRenderer.on("business-changed", (_event, payload) => callback(payload));
  },
  onDataChanged: (callback) => {
    electron.ipcRenderer.on("data:changed", (_event, stats) => callback(stats));
  },
  removeDataChangedListeners: () => {
    electron.ipcRenderer.removeAllListeners("data:changed");
  },
  // Phone-peripherals: use a connected phone as scanner / camera
  peripheralPhones: () => electron.ipcRenderer.invoke("peripheral:phones"),
  peripheralScan: (deviceId, timeoutMs) => electron.ipcRenderer.invoke("peripheral:scan", deviceId, timeoutMs),
  peripheralCapture: (deviceId, mode, timeoutMs) => electron.ipcRenderer.invoke("peripheral:capture", deviceId, mode, timeoutMs),
  peripheralCancel: (deviceId, requestId) => electron.ipcRenderer.invoke("peripheral:cancel", deviceId, requestId),
  // QR user invites (Teams → Add User)
  inviteCreate: (opts = {}) => electron.ipcRenderer.invoke("invites:create", opts),
  inviteList: () => electron.ipcRenderer.invoke("invites:list"),
  inviteDecide: (inviteId, decision, opts = {}) => electron.ipcRenderer.invoke("invites:decide", inviteId, decision, opts),
  onApprovalPinInvalid: (callback) => {
    electron.ipcRenderer.on("approval:pin-invalid", (_event, payload) => callback(payload));
  },
  approveWithPin: (requestId, pin) => electron.ipcRenderer.invoke("approval:resolve", { requestId, pin }),
  cancelApproval: (requestId) => electron.ipcRenderer.invoke("approval:cancel", requestId)
});
