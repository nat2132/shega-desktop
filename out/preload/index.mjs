import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("api", {
  // Businesses
  getActiveBusiness: () => ipcRenderer.invoke("get-active-business"),
  updateBusiness: (id, biz) => ipcRenderer.invoke("update-business", id, biz),
  // Categories
  getCategories: () => ipcRenderer.invoke("get-categories"),
  insertCategory: (name, icon) => ipcRenderer.invoke("insert-category", name, icon),
  deleteCategory: (id) => ipcRenderer.invoke("delete-category", id),
  // Items
  getItems: (options) => ipcRenderer.invoke("get-items", options),
  getItem: (id) => ipcRenderer.invoke("get-item", id),
  insertItem: (item) => ipcRenderer.invoke("insert-item", item),
  updateItem: (id, item) => ipcRenderer.invoke("update-item", id, item),
  deleteItem: (id) => ipcRenderer.invoke("delete-item", id),
  getLowStockItems: () => ipcRenderer.invoke("get-low-stock-items"),
  getExpiringItems: () => ipcRenderer.invoke("get-expiring-items"),
  getItemsBySupplier: (supplierId) => ipcRenderer.invoke("get-items-by-supplier", supplierId),
  restockItem: (id, quantity) => ipcRenderer.invoke("restock-item", id, quantity),
  archiveItem: (data) => ipcRenderer.invoke("archive-item", data),
  restoreItem: (data) => ipcRenderer.invoke("restore-item", data),
  getDeletedItems: () => ipcRenderer.invoke("get-deleted-items"),
  // Sales
  getSales: (options) => ipcRenderer.invoke("get-sales", options),
  getSale: (id) => ipcRenderer.invoke("get-sale", id),
  insertSale: (sale) => ipcRenderer.invoke("insert-sale", sale),
  insertSalesBatch: (sales) => ipcRenderer.invoke("insert-sales-batch", sales),
  updateSale: (id, sale) => ipcRenderer.invoke("update-sale", id, sale),
  deleteSale: (id) => ipcRenderer.invoke("delete-sale", id),
  voidSale: (data) => ipcRenderer.invoke("void-sale", data),
  getDebtSales: () => ipcRenderer.invoke("get-debt-sales"),
  payDebt: (saleId, amount, options) => ipcRenderer.invoke("pay-debt", saleId, amount, options),
  getDebtPayments: (saleId) => ipcRenderer.invoke("get-debt-payments", saleId),
  reverseDebtPayment: (data) => ipcRenderer.invoke("reverse-debt-payment", data),
  createReturn: (data) => ipcRenderer.invoke("create-return", data),
  getReturns: (options) => ipcRenderer.invoke("get-returns", options),
  // Expenses
  getExpenses: (options) => ipcRenderer.invoke("get-expenses", options),
  insertExpense: (expense) => ipcRenderer.invoke("insert-expense", expense),
  updateExpense: (id, expense) => ipcRenderer.invoke("update-expense", id, expense),
  deleteExpense: (id) => ipcRenderer.invoke("delete-expense", id),
  // Adjustments
  getAdjustments: (options) => ipcRenderer.invoke("get-adjustments", options),
  insertAdjustment: (adjustment) => ipcRenderer.invoke("insert-adjustment", adjustment),
  insertBulkAdjustments: (adjustments) => ipcRenderer.invoke("insert-bulk-adjustments", adjustments),
  reverseAdjustment: (data) => ipcRenderer.invoke("reverse-adjustment", data),
  // Notifications
  checkNotifications: () => ipcRenderer.invoke("check-notifications"),
  getNotifications: (options) => ipcRenderer.invoke("get-notifications", options),
  getUnreadNotificationCount: () => ipcRenderer.invoke("get-unread-notification-count"),
  getNotificationCategories: () => ipcRenderer.invoke("get-notification-categories"),
  insertNotification: (notification) => ipcRenderer.invoke("insert-notification", notification),
  markNotificationRead: (id) => ipcRenderer.invoke("mark-notification-read", id),
  markAllNotificationsRead: () => ipcRenderer.invoke("mark-all-notifications-read"),
  dismissNotification: (id) => ipcRenderer.invoke("dismiss-notification", id),
  snoozeNotification: (id, untilIso) => ipcRenderer.invoke("snooze-notification", id, untilIso),
  clearNotifications: (options) => ipcRenderer.invoke("clear-notifications", options),
  // Notification preferences
  getNotificationPreferences: () => ipcRenderer.invoke("get-notification-preferences"),
  updateNotificationPreference: (key, prefs) => ipcRenderer.invoke("update-notification-preference", key, prefs),
  // Banners
  getActiveBanners: () => ipcRenderer.invoke("get-active-banners"),
  dismissBanner: (id) => ipcRenderer.invoke("dismiss-banner", id),
  createBanner: (data) => ipcRenderer.invoke("create-banner", data),
  // Reminders
  getReminders: (options) => ipcRenderer.invoke("get-reminders", options),
  createReminder: (data) => ipcRenderer.invoke("create-reminder", data),
  updateReminder: (id, data) => ipcRenderer.invoke("update-reminder", id, data),
  snoozeReminder: (id, untilIso) => ipcRenderer.invoke("snooze-reminder", id, untilIso),
  completeReminder: (id) => ipcRenderer.invoke("complete-reminder", id),
  deleteReminder: (id) => ipcRenderer.invoke("delete-reminder", id),
  runReminderEngine: () => ipcRenderer.invoke("run-reminder-engine"),
  // Desktop OS notification
  showDesktopNotification: (data) => ipcRenderer.invoke("show-desktop-notification", data),
  // Dashboard alerts
  getDashboardAlerts: () => ipcRenderer.invoke("get-dashboard-alerts"),
  // Settings
  getSetting: (key) => ipcRenderer.invoke("get-setting", key),
  setSetting: (key, value) => ipcRenderer.invoke("set-setting", key, value),
  // Analytics / Dashboard
  getDashboardStats: () => ipcRenderer.invoke("get-dashboard-stats"),
  getRecentActivity: (limit, dateRange) => ipcRenderer.invoke("get-recent-activity", limit, dateRange),
  getAnalytics: (period, dateRange) => ipcRenderer.invoke("get-analytics", period, dateRange),
  getVoidedSales: (options) => ipcRenderer.invoke("get-voided-sales", options),
  getReversalStats: () => ipcRenderer.invoke("get-reversal-stats"),
  // Customers
  getCustomers: () => ipcRenderer.invoke("get-customers"),
  getCustomer: (id) => ipcRenderer.invoke("get-customer", id),
  getCustomerSales: (customerName) => ipcRenderer.invoke("get-customer-sales", customerName),
  insertCustomer: (customer) => ipcRenderer.invoke("insert-customer", customer),
  updateCustomer: (customer) => ipcRenderer.invoke("update-customer", customer),
  deleteCustomer: (id) => ipcRenderer.invoke("delete-customer", id),
  archiveCustomer: (data) => ipcRenderer.invoke("archive-customer", data),
  restoreCustomer: (data) => ipcRenderer.invoke("restore-customer", data),
  getDeletedCustomers: () => ipcRenderer.invoke("get-deleted-customers"),
  getCustomerNotes: (customerId) => ipcRenderer.invoke("get-customer-notes", customerId),
  addCustomerNote: (customerId, note, createdBy) => ipcRenderer.invoke("add-customer-note", customerId, note, createdBy),
  // Data Management
  exportData: () => ipcRenderer.invoke("export-data"),
  resetData: () => ipcRenderer.invoke("reset-data"),
  // Admin Management
  login: (username, pin) => ipcRenderer.invoke("login", username, pin),
  getAdmins: () => ipcRenderer.invoke("get-admins"),
  getCurrentAdmin: (id) => ipcRenderer.invoke("get-current-admin", id),
  insertAdmin: (admin) => ipcRenderer.invoke("insert-admin", admin),
  updateAdmin: (id, admin) => ipcRenderer.invoke("update-admin", id, admin),
  deleteAdmin: (id) => ipcRenderer.invoke("delete-admin", id),
  // Warehouses
  getWarehouses: () => ipcRenderer.invoke("get-warehouses"),
  getWarehouse: (id) => ipcRenderer.invoke("get-warehouse", id),
  insertWarehouse: (wh) => ipcRenderer.invoke("insert-warehouse", wh),
  updateWarehouse: (id, wh) => ipcRenderer.invoke("update-warehouse", id, wh),
  deleteWarehouse: (id) => ipcRenderer.invoke("delete-warehouse", id),
  // Warehouse Inventory
  getWarehouseInventory: (warehouseId) => ipcRenderer.invoke("get-warehouse-inventory", warehouseId),
  getAllWarehouseInventory: (options) => ipcRenderer.invoke("get-all-warehouse-inventory", options),
  updateWarehouseInventory: (warehouseId, itemId, quantity) => ipcRenderer.invoke("update-warehouse-inventory", warehouseId, itemId, quantity),
  // Stock Transfers
  transferStock: (transfer) => ipcRenderer.invoke("transfer-stock", transfer),
  getStockTransfers: (options) => ipcRenderer.invoke("get-stock-transfers", options),
  // Stock Movements
  getStockMovements: (options) => ipcRenderer.invoke("get-stock-movements", options),
  cleanupStockMovements: () => ipcRenderer.invoke("cleanup-stock-movements"),
  getWarehouseReport: (warehouseId) => ipcRenderer.invoke("get-warehouse-report", warehouseId),
  // Employee Roles
  getEmployeeRoles: () => ipcRenderer.invoke("get-employee-roles"),
  getEmployeeRole: (id) => ipcRenderer.invoke("get-employee-role", id),
  insertEmployeeRole: (data) => ipcRenderer.invoke("insert-employee-role", data),
  updateEmployeeRole: (id, data) => ipcRenderer.invoke("update-employee-role", id, data),
  duplicateEmployeeRole: (id) => ipcRenderer.invoke("duplicate-employee-role", id),
  deleteEmployeeRole: (id) => ipcRenderer.invoke("delete-employee-role", id),
  // Employees
  getEmployees: (options) => ipcRenderer.invoke("get-employees", options),
  getEmployee: (id) => ipcRenderer.invoke("get-employee", id),
  insertEmployee: (data) => ipcRenderer.invoke("insert-employee", data),
  updateEmployee: (id, data) => ipcRenderer.invoke("update-employee", id, data),
  deleteEmployee: (id) => ipcRenderer.invoke("delete-employee", id),
  archiveEmployee: (id) => ipcRenderer.invoke("archive-employee", id),
  reactivateEmployee: (id) => ipcRenderer.invoke("reactivate-employee", id),
  // Employee Accounts
  getEmployeeAccounts: () => ipcRenderer.invoke("get-employee-accounts"),
  insertEmployeeAccount: (data) => ipcRenderer.invoke("insert-employee-account", data),
  updateEmployeeAccount: (id, data) => ipcRenderer.invoke("update-employee-account", id, data),
  deleteEmployeeAccount: (id) => ipcRenderer.invoke("delete-employee-account", id),
  lockEmployeeAccount: (id) => ipcRenderer.invoke("lock-employee-account", id),
  unlockEmployeeAccount: (id) => ipcRenderer.invoke("unlock-employee-account", id),
  resetEmployeePassword: (id, newPin) => ipcRenderer.invoke("reset-employee-password", id, newPin),
  loginEmployee: (username, pin) => ipcRenderer.invoke("login-employee", username, pin),
  // PIN Recovery
  generateRecoveryKey: (entityType, entityId) => ipcRenderer.invoke("generate-recovery-key", entityType, entityId),
  verifyRecoveryKey: (username, recoveryKey) => ipcRenderer.invoke("verify-recovery-key", username, recoveryKey),
  resetPinWithRecovery: (username, recoveryKey, newPin) => ipcRenderer.invoke("reset-pin-with-recovery", username, recoveryKey, newPin),
  lockUserAccount: (id) => ipcRenderer.invoke("lock-user-account", id),
  unlockUserAccount: (id) => ipcRenderer.invoke("unlock-user-account", id),
  forcePinChange: (id) => ipcRenderer.invoke("force-pin-change", id),
  getPinHistory: (entityType, entityId) => ipcRenderer.invoke("get-pin-history", entityType, entityId),
  // Login History
  getLoginHistory: (options) => ipcRenderer.invoke("get-login-history", options),
  // Attendance
  clockIn: (employeeId, notes) => ipcRenderer.invoke("clock-in", employeeId, notes),
  clockOut: (employeeId, notes) => ipcRenderer.invoke("clock-out", employeeId, notes),
  getAttendance: (options) => ipcRenderer.invoke("get-attendance", options),
  getTodayAttendance: () => ipcRenderer.invoke("get-today-attendance"),
  // Employee Performance
  getEmployeePerformance: (options) => ipcRenderer.invoke("get-employee-performance", options),
  updateEmployeePerformance: (data) => ipcRenderer.invoke("update-employee-performance", data),
  // Employee Stats (Dashboard)
  getEmployeeStats: () => ipcRenderer.invoke("get-employee-stats"),
  getAuditLogs: (options) => ipcRenderer.invoke("get-audit-logs", options),
  reverseAuditLogEntry: (data) => ipcRenderer.invoke("reverse-audit-log-entry", data),
  // Shipments
  getShipments: (options) => ipcRenderer.invoke("get-shipments", options),
  getShipment: (id) => ipcRenderer.invoke("get-shipment", id),
  insertShipment: (data) => ipcRenderer.invoke("insert-shipment", data),
  updateShipment: (id, data) => ipcRenderer.invoke("update-shipment", id, data),
  updateShipmentStatus: (id, status, changedBy, notes) => ipcRenderer.invoke("update-shipment-status", id, status, changedBy, notes),
  deleteShipment: (id) => ipcRenderer.invoke("delete-shipment", id),
  getShipmentHistory: (shipmentId) => ipcRenderer.invoke("get-shipment-history", shipmentId),
  // Suppliers
  getSuppliers: (options) => ipcRenderer.invoke("get-suppliers", options),
  getSupplier: (id) => ipcRenderer.invoke("get-supplier", id),
  insertSupplier: (data) => ipcRenderer.invoke("insert-supplier", data),
  updateSupplier: (id, data) => ipcRenderer.invoke("update-supplier", id, data),
  archiveSupplier: (id) => ipcRenderer.invoke("archive-supplier", id),
  restoreSupplier: (id) => ipcRenderer.invoke("restore-supplier", id),
  deleteSupplier: (id) => ipcRenderer.invoke("delete-supplier", id),
  // Supplier Purchases
  getSupplierPurchases: (options) => ipcRenderer.invoke("get-supplier-purchases", options),
  getSupplierPurchase: (id) => ipcRenderer.invoke("get-supplier-purchase", id),
  insertSupplierPurchase: (data) => ipcRenderer.invoke("insert-supplier-purchase", data),
  updateSupplierPurchaseStatus: (id, status, notes) => ipcRenderer.invoke("update-supplier-purchase-status", id, status, notes),
  deleteSupplierPurchase: (id) => ipcRenderer.invoke("delete-supplier-purchase", id),
  // Supplier Payments
  getSupplierPayments: (options) => ipcRenderer.invoke("get-supplier-payments", options),
  insertSupplierPayment: (data) => ipcRenderer.invoke("insert-supplier-payment", data),
  updateSupplierPayment: (id, data) => ipcRenderer.invoke("update-supplier-payment", id, data),
  deleteSupplierPayment: (id) => ipcRenderer.invoke("delete-supplier-payment", id),
  reverseSupplierPayment: (data) => ipcRenderer.invoke("reverse-supplier-payment", data),
  // Supplier Products / Balances / Reports
  getSupplierProducts: (supplierId) => ipcRenderer.invoke("get-supplier-products", supplierId),
  getSupplierBalance: (supplierId) => ipcRenderer.invoke("get-supplier-balance", supplierId),
  getSupplierAgingReport: () => ipcRenderer.invoke("get-supplier-aging-report"),
  getSupplierDashboardStats: () => ipcRenderer.invoke("get-supplier-dashboard-stats"),
  getSupplierMonthlyReport: () => ipcRenderer.invoke("get-supplier-monthly-report"),
  getTopSuppliers: (limit) => ipcRenderer.invoke("get-top-suppliers", limit),
  toggleSupplierFavorite: (id) => ipcRenderer.invoke("toggle-supplier-favorite", id),
  getSupplierActivityLog: (supplierId, limit) => ipcRenderer.invoke("get-supplier-activity-log", supplierId, limit),
  getSupplierAnalytics: () => ipcRenderer.invoke("get-supplier-analytics"),
  // Test Data
  generateTestSuppliers: (count) => ipcRenderer.invoke("generate-test-suppliers", count),
  clearTestSuppliers: () => ipcRenderer.invoke("clear-test-suppliers"),
  // Comprehensive Test Data Generator
  generateTestData: (count) => ipcRenderer.invoke("generate-test-data", count),
  clearTestData: () => ipcRenderer.invoke("clear-test-data"),
  onTestDataProgress: (callback) => {
    ipcRenderer.on("test-data-progress", (_event, data) => callback(data));
  },
  removeTestDataProgressListener: () => {
    ipcRenderer.removeAllListeners("test-data-progress");
  },
  measurePerformance: () => ipcRenderer.invoke("measure-performance"),
  getDatabaseSize: () => ipcRenderer.invoke("get-database-size"),
  // Backup & Restore
  createBackup: () => ipcRenderer.invoke("create-backup"),
  listBackups: () => ipcRenderer.invoke("list-backups"),
  restoreBackup: (name) => ipcRenderer.invoke("restore-backup", name),
  deleteBackup: (name) => ipcRenderer.invoke("delete-backup", name),
  // Receipt Printing
  printReceipt: (sale) => ipcRenderer.invoke("print-receipt", sale),
  // Draft Sales
  getDraftSales: () => ipcRenderer.invoke("get-draft-sales"),
  getDraftSale: (id) => ipcRenderer.invoke("get-draft-sale", id),
  saveDraftSale: (data) => ipcRenderer.invoke("save-draft-sale", data),
  deleteDraftSale: (id) => ipcRenderer.invoke("delete-draft-sale", id),
  // Contacts
  getContacts: (options) => ipcRenderer.invoke("get-contacts", options),
  insertContact: (data) => ipcRenderer.invoke("insert-contact", data),
  updateContact: (id, data) => ipcRenderer.invoke("update-contact", id, data),
  deleteContact: (id) => ipcRenderer.invoke("delete-contact", id),
  // Budgets
  getBudgets: (options) => ipcRenderer.invoke("get-budgets", options),
  setBudget: (data) => ipcRenderer.invoke("set-budget", data),
  deleteBudget: (id) => ipcRenderer.invoke("delete-budget", id),
  getBudgetAdjustments: (budgetId) => ipcRenderer.invoke("get-budget-adjustments", budgetId),
  createBudgetAdjustment: (data) => ipcRenderer.invoke("create-budget-adjustment", data),
  approveBudgetAdjustment: (id, approvedBy) => ipcRenderer.invoke("approve-budget-adjustment", id, approvedBy),
  duplicateBudget: (fromData, toMonth, toYear) => ipcRenderer.invoke("duplicate-budget", fromData, toMonth, toYear),
  getBudgetAlerts: (options) => ipcRenderer.invoke("get-budget-alerts", options),
  acknowledgeBudgetAlert: (id) => ipcRenderer.invoke("acknowledge-budget-alert", id),
  getBudgetReport: (options) => ipcRenderer.invoke("get-budget-report", options),
  getBudgetForecast: (options) => ipcRenderer.invoke("get-budget-forecast", options),
  // Supplier Price Checks
  getSupplierPriceChecks: (supplierId) => ipcRenderer.invoke("get-supplier-price-checks", supplierId),
  saveSupplierPriceCheck: (data) => ipcRenderer.invoke("save-supplier-price-check", data),
  deleteSupplierPriceCheck: (id) => ipcRenderer.invoke("delete-supplier-price-check", id),
  // Quiet Hours
  getQuietHours: () => ipcRenderer.invoke("get-quiet-hours"),
  setQuietHours: (data) => ipcRenderer.invoke("set-quiet-hours", data),
  deleteQuietHours: () => ipcRenderer.invoke("delete-quiet-hours"),
  // External links
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  // Supplier Reports
  getSupplierReportSummary: () => ipcRenderer.invoke("get-supplier-report-summary"),
  getSupplierTransactionReport: (options) => ipcRenderer.invoke("get-supplier-transaction-report", options),
  getInventoryBySupplierReport: () => ipcRenderer.invoke("get-inventory-by-supplier-report"),
  getSupplierUnpaidOrders: () => ipcRenderer.invoke("get-supplier-unpaid-orders"),
  getSupplierPaymentDueAlerts: () => ipcRenderer.invoke("get-supplier-payment-due-alerts"),
  getSupplierLowStock: () => ipcRenderer.invoke("get-supplier-low-stock"),
  // CSV / Data Import
  importData: (module, rows) => ipcRenderer.invoke("import-data", module, rows),
  // Order Management
  getOrders: (options) => ipcRenderer.invoke("get-orders", options),
  getOrder: (id) => ipcRenderer.invoke("get-order", id),
  insertOrder: (data) => ipcRenderer.invoke("insert-order", data),
  convertOrderToSale: (data) => ipcRenderer.invoke("convert-order-to-sale", data),
  convertOrderToDebt: (data) => ipcRenderer.invoke("convert-order-to-debt", data),
  cancelOrder: (data) => ipcRenderer.invoke("cancel-order", data),
  // Global Search
  globalSearch: (query) => ipcRenderer.invoke("global-search", query),
  // Business Health Score
  getBusinessHealthScore: () => ipcRenderer.invoke("get-business-health-score"),
  // Business Assistant Insights
  getBusinessInsights: () => ipcRenderer.invoke("get-business-insights"),
  // Subscription System
  getSubscriptionPlans: () => ipcRenderer.invoke("get-subscription-plans"),
  getCurrentSubscription: () => ipcRenderer.invoke("get-current-subscription"),
  startTrial: () => ipcRenderer.invoke("start-trial"),
  submitPayment: (data) => ipcRenderer.invoke("submit-payment", data),
  getPaymentTransactions: (options) => ipcRenderer.invoke("get-payment-transactions", options),
  getAllPaymentTransactions: (options) => ipcRenderer.invoke("get-all-payment-transactions", options),
  approvePayment: (data) => ipcRenderer.invoke("approve-payment", data),
  rejectPayment: (data) => ipcRenderer.invoke("reject-payment", data),
  getSubscriptionHistory: () => ipcRenderer.invoke("get-subscription-history"),
  getRenewalInfo: () => ipcRenderer.invoke("get-renewal-info"),
  checkPremiumFeature: (feature) => ipcRenderer.invoke("check-premium-feature", feature),
  getSubscriptionStats: () => ipcRenderer.invoke("get-subscription-stats"),
  checkTrialAvailability: () => ipcRenderer.invoke("check-trial-availability"),
  // Debug
  debugPing: () => ipcRenderer.invoke("debug:ping"),
  // ── Update System ──
  checkForUpdates: () => ipcRenderer.invoke("update:check"),
  downloadUpdate: () => ipcRenderer.invoke("update:download"),
  installUpdate: () => ipcRenderer.invoke("update:install"),
  skipVersion: (version) => ipcRenderer.invoke("update:skip-version", version),
  remindLater: (hours) => ipcRenderer.invoke("update:remind-later", hours),
  getUpdateStatus: () => ipcRenderer.invoke("update:get-status"),
  setAutoCheckEnabled: (enabled) => ipcRenderer.invoke("update:set-auto-check", enabled),
  getAppVersion: () => ipcRenderer.invoke("update:get-app-version"),
  clearReminder: () => ipcRenderer.invoke("update:clear-reminder"),
  onUpdateStatus: (callback) => {
    ipcRenderer.on("update:status", (_event, data) => callback(data));
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on("update:progress", (_event, data) => callback(data));
  },
  onUpdateError: (callback) => {
    ipcRenderer.on("update:error", (_event, data) => callback(data));
  },
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners("update:status");
    ipcRenderer.removeAllListeners("update:progress");
    ipcRenderer.removeAllListeners("update:error");
  }
});
