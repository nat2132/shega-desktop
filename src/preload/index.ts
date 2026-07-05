import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Businesses
  getActiveBusiness: () => ipcRenderer.invoke('get-active-business'),
  updateBusiness: (id: number, biz: any) => ipcRenderer.invoke('update-business', id, biz),

  // Categories
  getCategories: () => ipcRenderer.invoke('get-categories'),
  insertCategory: (name: string, icon?: string) => ipcRenderer.invoke('insert-category', name, icon),
  deleteCategory: (id: number) => ipcRenderer.invoke('delete-category', id),

  // Items
  getItems: (options?: any) => ipcRenderer.invoke('get-items', options),
  getItem: (id: number) => ipcRenderer.invoke('get-item', id),
  insertItem: (item: any) => ipcRenderer.invoke('insert-item', item),
  updateItem: (id: number, item: any) => ipcRenderer.invoke('update-item', id, item),
  deleteItem: (id: number) => ipcRenderer.invoke('delete-item', id),
  getLowStockItems: () => ipcRenderer.invoke('get-low-stock-items'),
  getExpiringItems: () => ipcRenderer.invoke('get-expiring-items'),
  getItemsBySupplier: (supplierId: number) => ipcRenderer.invoke('get-items-by-supplier', supplierId),
  restockItem: (id: number, quantity: number) => ipcRenderer.invoke('restock-item', id, quantity),
  archiveItem: (data: any) => ipcRenderer.invoke('archive-item', data),
  restoreItem: (data: any) => ipcRenderer.invoke('restore-item', data),
  getDeletedItems: () => ipcRenderer.invoke('get-deleted-items'),

  // Sales
  getSales: (options?: any) => ipcRenderer.invoke('get-sales', options),
  getSale: (id: number) => ipcRenderer.invoke('get-sale', id),
  insertSale: (sale: any) => ipcRenderer.invoke('insert-sale', sale),
  insertSalesBatch: (sales: any[]) => ipcRenderer.invoke('insert-sales-batch', sales),
  updateSale: (id: number, sale: any) => ipcRenderer.invoke('update-sale', id, sale),
  deleteSale: (id: number) => ipcRenderer.invoke('delete-sale', id),
  voidSale: (data: any) => ipcRenderer.invoke('void-sale', data),
  getDebtSales: () => ipcRenderer.invoke('get-debt-sales'),
  payDebt: (saleId: number, amount: number, options?: { type?: string; note?: string }) => ipcRenderer.invoke('pay-debt', saleId, amount, options),
  getDebtPayments: (saleId: number) => ipcRenderer.invoke('get-debt-payments', saleId),
  reverseDebtPayment: (data: any) => ipcRenderer.invoke('reverse-debt-payment', data),
  createReturn: (data: any) => ipcRenderer.invoke('create-return', data),
  getReturns: (options?: any) => ipcRenderer.invoke('get-returns', options),

  // Expenses
  getExpenses: (options?: any) => ipcRenderer.invoke('get-expenses', options),
  insertExpense: (expense: any) => ipcRenderer.invoke('insert-expense', expense),
  updateExpense: (id: number, expense: any) => ipcRenderer.invoke('update-expense', id, expense),
  deleteExpense: (id: number) => ipcRenderer.invoke('delete-expense', id),

  // Adjustments
  getAdjustments: (options?: any) => ipcRenderer.invoke('get-adjustments', options),
  insertAdjustment: (adjustment: any) => ipcRenderer.invoke('insert-adjustment', adjustment),
  insertBulkAdjustments: (adjustments: any[]) => ipcRenderer.invoke('insert-bulk-adjustments', adjustments),
  reverseAdjustment: (data: any) => ipcRenderer.invoke('reverse-adjustment', data),

  // Notifications
  checkNotifications: () => ipcRenderer.invoke('check-notifications'),
  getNotifications: (options?: any) => ipcRenderer.invoke('get-notifications', options),
  getUnreadNotificationCount: () => ipcRenderer.invoke('get-unread-notification-count'),
  getNotificationCategories: () => ipcRenderer.invoke('get-notification-categories'),
  insertNotification: (notification: any) => ipcRenderer.invoke('insert-notification', notification),
  markNotificationRead: (id: number) => ipcRenderer.invoke('mark-notification-read', id),
  markAllNotificationsRead: () => ipcRenderer.invoke('mark-all-notifications-read'),
  dismissNotification: (id: number) => ipcRenderer.invoke('dismiss-notification', id),
  snoozeNotification: (id: number, untilIso: string) => ipcRenderer.invoke('snooze-notification', id, untilIso),
  clearNotifications: (options?: any) => ipcRenderer.invoke('clear-notifications', options),

  // Notification preferences
  getNotificationPreferences: () => ipcRenderer.invoke('get-notification-preferences'),
  updateNotificationPreference: (key: string, prefs: any) => ipcRenderer.invoke('update-notification-preference', key, prefs),

  // Banners
  getActiveBanners: () => ipcRenderer.invoke('get-active-banners'),
  dismissBanner: (id: number) => ipcRenderer.invoke('dismiss-banner', id),
  createBanner: (data: any) => ipcRenderer.invoke('create-banner', data),

  // Reminders
  getReminders: (options?: any) => ipcRenderer.invoke('get-reminders', options),
  createReminder: (data: any) => ipcRenderer.invoke('create-reminder', data),
  updateReminder: (id: number, data: any) => ipcRenderer.invoke('update-reminder', id, data),
  snoozeReminder: (id: number, untilIso: string) => ipcRenderer.invoke('snooze-reminder', id, untilIso),
  completeReminder: (id: number) => ipcRenderer.invoke('complete-reminder', id),
  deleteReminder: (id: number) => ipcRenderer.invoke('delete-reminder', id),
  runReminderEngine: () => ipcRenderer.invoke('run-reminder-engine'),

  // Desktop OS notification
  showDesktopNotification: (data: { title: string; body: string; urgency?: 'normal' | 'critical' }) => ipcRenderer.invoke('show-desktop-notification', data),

  // Dashboard alerts
  getDashboardAlerts: () => ipcRenderer.invoke('get-dashboard-alerts'),

  // Settings
  getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: any) => ipcRenderer.invoke('set-setting', key, value),

  // Analytics / Dashboard
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  getRecentActivity: (limit?: number, dateRange?: { start: string; end: string }) => ipcRenderer.invoke('get-recent-activity', limit, dateRange),
  getAnalytics: (period: string, dateRange?: { start: string; end: string }) => ipcRenderer.invoke('get-analytics', period, dateRange),
  getVoidedSales: (options?: any) => ipcRenderer.invoke('get-voided-sales', options),
  getReversalStats: () => ipcRenderer.invoke('get-reversal-stats'),

  // Customers
  getCustomers: () => ipcRenderer.invoke('get-customers'),
  getCustomer: (id: number) => ipcRenderer.invoke('get-customer', id),
  getCustomerSales: (customerName: string) => ipcRenderer.invoke('get-customer-sales', customerName),
  insertCustomer: (customer: any) => ipcRenderer.invoke('insert-customer', customer),
  updateCustomer: (customer: any) => ipcRenderer.invoke('update-customer', customer),
  deleteCustomer: (id: number) => ipcRenderer.invoke('delete-customer', id),
  archiveCustomer: (data: any) => ipcRenderer.invoke('archive-customer', data),
  restoreCustomer: (data: any) => ipcRenderer.invoke('restore-customer', data),
  getDeletedCustomers: () => ipcRenderer.invoke('get-deleted-customers'),
  getCustomerNotes: (customerId: number) => ipcRenderer.invoke('get-customer-notes', customerId),
  addCustomerNote: (customerId: number, note: string, createdBy?: string) => ipcRenderer.invoke('add-customer-note', customerId, note, createdBy),

  // Data Management
  exportData: () => ipcRenderer.invoke('export-data'),
  resetData: () => ipcRenderer.invoke('reset-data'),

  // Admin Management
  login: (username: string, pin: string) => ipcRenderer.invoke('login', username, pin),
  getAdmins: () => ipcRenderer.invoke('get-admins'),
  getCurrentAdmin: (id: number) => ipcRenderer.invoke('get-current-admin', id),
  insertAdmin: (admin: any) => ipcRenderer.invoke('insert-admin', admin),
  updateAdmin: (id: number, admin: any) => ipcRenderer.invoke('update-admin', id, admin),
  deleteAdmin: (id: number) => ipcRenderer.invoke('delete-admin', id),

  // Warehouses
  getWarehouses: () => ipcRenderer.invoke('get-warehouses'),
  getWarehouse: (id: number) => ipcRenderer.invoke('get-warehouse', id),
  insertWarehouse: (wh: any) => ipcRenderer.invoke('insert-warehouse', wh),
  updateWarehouse: (id: number, wh: any) => ipcRenderer.invoke('update-warehouse', id, wh),
  deleteWarehouse: (id: number) => ipcRenderer.invoke('delete-warehouse', id),

  // Warehouse Inventory
  getWarehouseInventory: (warehouseId: number) => ipcRenderer.invoke('get-warehouse-inventory', warehouseId),
  getAllWarehouseInventory: (options?: any) => ipcRenderer.invoke('get-all-warehouse-inventory', options),
  updateWarehouseInventory: (warehouseId: number, itemId: number, quantity: number) => ipcRenderer.invoke('update-warehouse-inventory', warehouseId, itemId, quantity),

  // Stock Transfers
  transferStock: (transfer: any) => ipcRenderer.invoke('transfer-stock', transfer),
  getStockTransfers: (options?: any) => ipcRenderer.invoke('get-stock-transfers', options),

  // Stock Movements
  getStockMovements: (options?: any) => ipcRenderer.invoke('get-stock-movements', options),
  cleanupStockMovements: () => ipcRenderer.invoke('cleanup-stock-movements'),
  getWarehouseReport: (warehouseId: number) => ipcRenderer.invoke('get-warehouse-report', warehouseId),

  // Employee Roles
  getEmployeeRoles: () => ipcRenderer.invoke('get-employee-roles'),
  getEmployeeRole: (id: number) => ipcRenderer.invoke('get-employee-role', id),
  insertEmployeeRole: (data: any) => ipcRenderer.invoke('insert-employee-role', data),
  updateEmployeeRole: (id: number, data: any) => ipcRenderer.invoke('update-employee-role', id, data),
  duplicateEmployeeRole: (id: number) => ipcRenderer.invoke('duplicate-employee-role', id),
  deleteEmployeeRole: (id: number) => ipcRenderer.invoke('delete-employee-role', id),

  // Employees
  getEmployees: (options?: any) => ipcRenderer.invoke('get-employees', options),
  getEmployee: (id: number) => ipcRenderer.invoke('get-employee', id),
  insertEmployee: (data: any) => ipcRenderer.invoke('insert-employee', data),
  updateEmployee: (id: number, data: any) => ipcRenderer.invoke('update-employee', id, data),
  deleteEmployee: (id: number) => ipcRenderer.invoke('delete-employee', id),
  archiveEmployee: (id: number) => ipcRenderer.invoke('archive-employee', id),
  reactivateEmployee: (id: number) => ipcRenderer.invoke('reactivate-employee', id),

  // Employee Accounts
  getEmployeeAccounts: () => ipcRenderer.invoke('get-employee-accounts'),
  insertEmployeeAccount: (data: any) => ipcRenderer.invoke('insert-employee-account', data),
  updateEmployeeAccount: (id: number, data: any) => ipcRenderer.invoke('update-employee-account', id, data),
  deleteEmployeeAccount: (id: number) => ipcRenderer.invoke('delete-employee-account', id),
  lockEmployeeAccount: (id: number) => ipcRenderer.invoke('lock-employee-account', id),
  unlockEmployeeAccount: (id: number) => ipcRenderer.invoke('unlock-employee-account', id),
  resetEmployeePassword: (id: number, newPin: string) => ipcRenderer.invoke('reset-employee-password', id, newPin),
  loginEmployee: (username: string, pin: string) => ipcRenderer.invoke('login-employee', username, pin),

  // PIN Recovery
  generateRecoveryKey: (entityType: 'employee' | 'admin', entityId: number) => ipcRenderer.invoke('generate-recovery-key', entityType, entityId),
  verifyRecoveryKey: (username: string, recoveryKey: string) => ipcRenderer.invoke('verify-recovery-key', username, recoveryKey),
  resetPinWithRecovery: (username: string, recoveryKey: string, newPin: string) => ipcRenderer.invoke('reset-pin-with-recovery', username, recoveryKey, newPin),
  lockUserAccount: (id: number) => ipcRenderer.invoke('lock-user-account', id),
  unlockUserAccount: (id: number) => ipcRenderer.invoke('unlock-user-account', id),
  forcePinChange: (id: number) => ipcRenderer.invoke('force-pin-change', id),
  getPinHistory: (entityType?: string, entityId?: number) => ipcRenderer.invoke('get-pin-history', entityType, entityId),

  // Login History
  getLoginHistory: (options?: any) => ipcRenderer.invoke('get-login-history', options),

  // Attendance
  clockIn: (employeeId: number, notes?: string) => ipcRenderer.invoke('clock-in', employeeId, notes),
  clockOut: (employeeId: number, notes?: string) => ipcRenderer.invoke('clock-out', employeeId, notes),
  getAttendance: (options?: any) => ipcRenderer.invoke('get-attendance', options),
  getTodayAttendance: () => ipcRenderer.invoke('get-today-attendance'),

  // Employee Performance
  getEmployeePerformance: (options?: any) => ipcRenderer.invoke('get-employee-performance', options),
  updateEmployeePerformance: (data: any) => ipcRenderer.invoke('update-employee-performance', data),

  // Employee Stats (Dashboard)
  getEmployeeStats: () => ipcRenderer.invoke('get-employee-stats'),

  getAuditLogs: (options?: any) => ipcRenderer.invoke('get-audit-logs', options),
  reverseAuditLogEntry: (data: { logId: number }) => ipcRenderer.invoke('reverse-audit-log-entry', data),

  // Shipments
  getShipments: (options?: any) => ipcRenderer.invoke('get-shipments', options),
  getShipment: (id: number) => ipcRenderer.invoke('get-shipment', id),
  insertShipment: (data: any) => ipcRenderer.invoke('insert-shipment', data),
  updateShipment: (id: number, data: any) => ipcRenderer.invoke('update-shipment', id, data),
  updateShipmentStatus: (id: number, status: string, changedBy?: string, notes?: string) => ipcRenderer.invoke('update-shipment-status', id, status, changedBy, notes),
  deleteShipment: (id: number) => ipcRenderer.invoke('delete-shipment', id),
  getShipmentHistory: (shipmentId: number) => ipcRenderer.invoke('get-shipment-history', shipmentId),

  // Suppliers
  getSuppliers: (options?: any) => ipcRenderer.invoke('get-suppliers', options),
  getSupplier: (id: number) => ipcRenderer.invoke('get-supplier', id),
  insertSupplier: (data: any) => ipcRenderer.invoke('insert-supplier', data),
  updateSupplier: (id: number, data: any) => ipcRenderer.invoke('update-supplier', id, data),
  archiveSupplier: (id: number) => ipcRenderer.invoke('archive-supplier', id),
  restoreSupplier: (id: number) => ipcRenderer.invoke('restore-supplier', id),
  deleteSupplier: (id: number) => ipcRenderer.invoke('delete-supplier', id),

  // Supplier Purchases
  getSupplierPurchases: (options?: any) => ipcRenderer.invoke('get-supplier-purchases', options),
  getSupplierPurchase: (id: number) => ipcRenderer.invoke('get-supplier-purchase', id),
  insertSupplierPurchase: (data: any) => ipcRenderer.invoke('insert-supplier-purchase', data),
  updateSupplierPurchaseStatus: (id: number, status: string, notes?: string) =>
    ipcRenderer.invoke('update-supplier-purchase-status', id, status, notes),
  deleteSupplierPurchase: (id: number) => ipcRenderer.invoke('delete-supplier-purchase', id),

  // Supplier Payments
  getSupplierPayments: (options?: any) => ipcRenderer.invoke('get-supplier-payments', options),
  insertSupplierPayment: (data: any) => ipcRenderer.invoke('insert-supplier-payment', data),
  updateSupplierPayment: (id: number, data: any) => ipcRenderer.invoke('update-supplier-payment', id, data),
  deleteSupplierPayment: (id: number) => ipcRenderer.invoke('delete-supplier-payment', id),
  reverseSupplierPayment: (data: any) => ipcRenderer.invoke('reverse-supplier-payment', data),

  // Supplier Products / Balances / Reports
  getSupplierProducts: (supplierId: number) => ipcRenderer.invoke('get-supplier-products', supplierId),
  getSupplierBalance: (supplierId: number) => ipcRenderer.invoke('get-supplier-balance', supplierId),
  getSupplierAgingReport: () => ipcRenderer.invoke('get-supplier-aging-report'),
  getSupplierDashboardStats: () => ipcRenderer.invoke('get-supplier-dashboard-stats'),
  getSupplierMonthlyReport: () => ipcRenderer.invoke('get-supplier-monthly-report'),
  getTopSuppliers: (limit?: number) => ipcRenderer.invoke('get-top-suppliers', limit),
  toggleSupplierFavorite: (id: number) => ipcRenderer.invoke('toggle-supplier-favorite', id),
  getSupplierActivityLog: (supplierId: number, limit?: number) => ipcRenderer.invoke('get-supplier-activity-log', supplierId, limit),
  getSupplierAnalytics: () => ipcRenderer.invoke('get-supplier-analytics'),

  // Test Data
  generateTestSuppliers: (count: number) => ipcRenderer.invoke('generate-test-suppliers', count),
  clearTestSuppliers: () => ipcRenderer.invoke('clear-test-suppliers'),

  // Comprehensive Test Data Generator
  generateTestData: (count: number) => ipcRenderer.invoke('generate-test-data', count),
  clearTestData: () => ipcRenderer.invoke('clear-test-data'),
  onTestDataProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('test-data-progress', (_event, data) => callback(data));
  },
  removeTestDataProgressListener: () => {
    ipcRenderer.removeAllListeners('test-data-progress');
  },
  measurePerformance: () => ipcRenderer.invoke('measure-performance'),
  getDatabaseSize: () => ipcRenderer.invoke('get-database-size'),

  // Backup & Restore
  createBackup: () => ipcRenderer.invoke('create-backup'),
  listBackups: () => ipcRenderer.invoke('list-backups'),
  restoreBackup: (name: string) => ipcRenderer.invoke('restore-backup', name),
  deleteBackup: (name: string) => ipcRenderer.invoke('delete-backup', name),

  // Receipt Printing
  printReceipt: (sale: any) => ipcRenderer.invoke('print-receipt', sale),

  // Draft Sales
  getDraftSales: () => ipcRenderer.invoke('get-draft-sales'),
  getDraftSale: (id: number) => ipcRenderer.invoke('get-draft-sale', id),
  saveDraftSale: (data: any) => ipcRenderer.invoke('save-draft-sale', data),
  deleteDraftSale: (id: number) => ipcRenderer.invoke('delete-draft-sale', id),

  // Contacts
  getContacts: (options?: any) => ipcRenderer.invoke('get-contacts', options),
  insertContact: (data: any) => ipcRenderer.invoke('insert-contact', data),
  updateContact: (id: number, data: any) => ipcRenderer.invoke('update-contact', id, data),
  deleteContact: (id: number) => ipcRenderer.invoke('delete-contact', id),

  // Budgets
  getBudgets: (options?: any) => ipcRenderer.invoke('get-budgets', options),
  setBudget: (data: any) => ipcRenderer.invoke('set-budget', data),
  deleteBudget: (id: number) => ipcRenderer.invoke('delete-budget', id),
  getBudgetAdjustments: (budgetId: number) => ipcRenderer.invoke('get-budget-adjustments', budgetId),
  createBudgetAdjustment: (data: any) => ipcRenderer.invoke('create-budget-adjustment', data),
  approveBudgetAdjustment: (id: number, approvedBy: string) => ipcRenderer.invoke('approve-budget-adjustment', id, approvedBy),
  duplicateBudget: (fromData: any, toMonth: string, toYear: string) => ipcRenderer.invoke('duplicate-budget', fromData, toMonth, toYear),
  getBudgetAlerts: (options?: any) => ipcRenderer.invoke('get-budget-alerts', options),
  acknowledgeBudgetAlert: (id: number) => ipcRenderer.invoke('acknowledge-budget-alert', id),
  getBudgetReport: (options?: any) => ipcRenderer.invoke('get-budget-report', options),
  getBudgetForecast: (options?: any) => ipcRenderer.invoke('get-budget-forecast', options),

  // Supplier Price Checks
  getSupplierPriceChecks: (supplierId?: number) => ipcRenderer.invoke('get-supplier-price-checks', supplierId),
  saveSupplierPriceCheck: (data: any) => ipcRenderer.invoke('save-supplier-price-check', data),
  deleteSupplierPriceCheck: (id: number) => ipcRenderer.invoke('delete-supplier-price-check', id),

  // Quiet Hours
  getQuietHours: () => ipcRenderer.invoke('get-quiet-hours'),
  setQuietHours: (data: any) => ipcRenderer.invoke('set-quiet-hours', data),
  deleteQuietHours: () => ipcRenderer.invoke('delete-quiet-hours'),

  // External links
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  // Supplier Reports
  getSupplierReportSummary: () => ipcRenderer.invoke('get-supplier-report-summary'),
  getSupplierTransactionReport: (options?: any) => ipcRenderer.invoke('get-supplier-transaction-report', options),
  getInventoryBySupplierReport: () => ipcRenderer.invoke('get-inventory-by-supplier-report'),
  getSupplierUnpaidOrders: () => ipcRenderer.invoke('get-supplier-unpaid-orders'),
  getSupplierPaymentDueAlerts: () => ipcRenderer.invoke('get-supplier-payment-due-alerts'),
  getSupplierLowStock: () => ipcRenderer.invoke('get-supplier-low-stock'),

  // CSV / Data Import
  importData: (module: string, rows: any[]) => ipcRenderer.invoke('import-data', module, rows),

  // Order Management
  getOrders: (options?: any) => ipcRenderer.invoke('get-orders', options),
  getOrder: (id: number) => ipcRenderer.invoke('get-order', id),
  insertOrder: (data: any) => ipcRenderer.invoke('insert-order', data),
  convertOrderToSale: (data: { orderId: number; paymentMethod?: string; discount?: number; vat?: number }) => ipcRenderer.invoke('convert-order-to-sale', data),
  convertOrderToDebt: (data: { orderId: number; dueDate?: string; paymentMethod?: string; discount?: number; vat?: number }) => ipcRenderer.invoke('convert-order-to-debt', data),
  cancelOrder: (data: { orderId: number; reason?: string }) => ipcRenderer.invoke('cancel-order', data),
})
