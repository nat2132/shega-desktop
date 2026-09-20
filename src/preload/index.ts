import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Businesses
  getActiveBusiness: () => ipcRenderer.invoke('get-active-business'),
  updateBusiness: (id: number, biz: any) => ipcRenderer.invoke('update-business', id, biz),
  businessList: () => ipcRenderer.invoke('business:list'),
  businessCreate: (data: any) => ipcRenderer.invoke('business:create', data),
  businessSwitch: (id: number) => ipcRenderer.invoke('business:switch', id),
  businessSetDefault: (id: number) => ipcRenderer.invoke('business:set-default', id),
  businessArchive: (id: number) => ipcRenderer.invoke('business:archive', id),
  businessLeave: (id: number) => ipcRenderer.invoke('business:leave', id),

  // Categories
  getCategories: () => ipcRenderer.invoke('get-categories'),
  insertCategory: (name: string, icon?: string) => ipcRenderer.invoke('insert-category', name, icon),
  deleteCategory: (id: number) => ipcRenderer.invoke('delete-category', id),

  // Items
  getItems: (options?: any) => ipcRenderer.invoke('get-items', options),
  getItem: (id: number) => ipcRenderer.invoke('get-item', id),
  getItemByBarcode: (code: string) => ipcRenderer.invoke('get-item-by-barcode', code),
  insertItem: (item: any) => ipcRenderer.invoke('insert-item', item),
  updateItem: (id: number, item: any) => ipcRenderer.invoke('update-item', id, item),
  deleteItem: (id: number) => ipcRenderer.invoke('delete-item', id),
  generateShegaCode: () => ipcRenderer.invoke('generate-shega-code'),
  itemBarcodesList: (itemId: number) => ipcRenderer.invoke('item-barcodes:list', itemId),
  itemBarcodesAdd: (itemId: number, barcode: string) => ipcRenderer.invoke('item-barcodes:add', itemId, barcode),
  itemBarcodesRemove: (barcodeId: number) => ipcRenderer.invoke('item-barcodes:remove', barcodeId),
  itemBarcodesSetPrimary: (barcodeId: number) => ipcRenderer.invoke('item-barcodes:set-primary', barcodeId),
  getLowStockItems: () => ipcRenderer.invoke('get-low-stock-items'),
  getReorderSuggestions: () => ipcRenderer.invoke('get-reorder-suggestions'),
  getReportDrilldowns: (range: { start: string; end: string }) => ipcRenderer.invoke('get-report-drilldowns', range),
  getGlJournal: (range: { start: string; end: string }) => ipcRenderer.invoke('get-gl-journal', range),
  getExpiringItems: () => ipcRenderer.invoke('get-expiring-items'),
  getItemsBySupplier: (supplierId: number) => ipcRenderer.invoke('get-items-by-supplier', supplierId),
  restockItem: (id: number, quantity: number, unit?: 'single' | 'pack') => ipcRenderer.invoke('restock-item', id, quantity, unit),
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

  // P2P Yjs + WebRTC sync
  p2pHealth: () => ipcRenderer.invoke('p2p:health'),
  p2pDevices: () => ipcRenderer.invoke('p2p:devices'),
  p2pAnnounce: () => ipcRenderer.invoke('p2p:announce'),
  p2pApprove: (name?: string, code?: string) => ipcRenderer.invoke('p2p:approve', name, code),
  p2pRevokeDevice: (deviceId: string) => ipcRenderer.invoke('p2p:revoke-device', deviceId),
  p2pRenameDevice: (deviceId: string, name: string) => ipcRenderer.invoke('p2p:rename-device', deviceId, name),
  p2pRecordCounts: () => ipcRenderer.invoke('p2p:record-counts'),
  getAnalytics: (period: string, dateRange?: { start: string; end: string }) => ipcRenderer.invoke('get-analytics', period, dateRange),
  getVatReport: (dateRange?: { start: string; end: string }) => ipcRenderer.invoke('get-vat-report', dateRange),
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
  resetData: (mode: 'transactions' | 'all' | 'factory' = 'all') => ipcRenderer.invoke('reset-data', mode),
  factoryReset: () => ipcRenderer.invoke('factory-reset'),
  quitApp: () => ipcRenderer.invoke('app:quit'),

  // Admin Management
  login: (username: string, pin: string) => ipcRenderer.invoke('login', username, pin),
  getAdmins: () => ipcRenderer.invoke('get-admins'),
  getLoginUsers: () => ipcRenderer.invoke('get-login-users'),
  loginByUser: (source: 'admin' | 'employee' | 'roster', id: number, pin: string) => ipcRenderer.invoke('login-by-user', source, id, pin),
  getCurrentAdmin: (id: number, isEmployee?: boolean) => ipcRenderer.invoke('get-current-admin', id, isEmployee),
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

  // Stock Consistency
  checkStockConsistency: () => ipcRenderer.invoke('check-stock-consistency'),
  fixStockConsistency: () => ipcRenderer.invoke('fix-stock-consistency'),

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

  // Backup & Restore
  createBackup: () => ipcRenderer.invoke('create-backup'),
  listBackups: () => ipcRenderer.invoke('list-backups'),
  restoreBackup: (name: string) => ipcRenderer.invoke('restore-backup', name),
  deleteBackup: (name: string) => ipcRenderer.invoke('delete-backup', name),

  // Receipt Printing
  printReceipt: (sale: any) => ipcRenderer.invoke('print-receipt', sale),

  // Peripherals (Phase 2)
  openCashDrawer: () => ipcRenderer.invoke('open-cash-drawer'),
  printTestPage: () => ipcRenderer.invoke('print-test-page'),
  printLabel: (label: any) => ipcRenderer.invoke('print-label', label),
  barcodePng: (value: string) => ipcRenderer.invoke('barcode-png', value),
  barcodePngDataUrl: (value: string) => ipcRenderer.invoke('barcode-png-dataurl', value),
  simulateScan: (code?: string) => ipcRenderer.invoke('simulate-scan', code),
  getPrintStatus: () => ipcRenderer.invoke('get-print-status'),
  setPrinterConfig: (cfg: any) => ipcRenderer.invoke('set-printer-config', cfg),
  parseScaleReading: (line: string) => ipcRenderer.invoke('parse-scale-reading', line),

  // Sync hub (Phase 3)
   syncStatus: () => ipcRenderer.invoke('sync:status'),
  syncVerify: () => ipcRenderer.invoke('sync:verify'),
  syncLog: (limit: number) => ipcRenderer.invoke('sync:log', limit),
  syncResync: (deviceId: string) => ipcRenderer.invoke('sync:resync', deviceId),

  // Audit (Phase 4)
  verifyAuditChain: () => ipcRenderer.invoke('verify-audit-chain'),

  // Draft Sales
  getDraftSales: () => ipcRenderer.invoke('get-draft-sales'),
  getDraftSale: (id: number) => ipcRenderer.invoke('get-draft-sale', id),
  saveDraftSale: (data: any) => ipcRenderer.invoke('save-draft-sale', data),
  deleteDraftSale: (id: number) => ipcRenderer.invoke('delete-draft-sale', id),

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

  // Global Search
  globalSearch: (query: string) => ipcRenderer.invoke('global-search', query),

  // Business Health Score
  getBusinessHealthScore: () => ipcRenderer.invoke('get-business-health-score'),

  // Business Assistant Insights
  getBusinessInsights: () => ipcRenderer.invoke('get-business-insights'),

  // Subscription System
  getSubscriptionPlans: () => ipcRenderer.invoke('get-subscription-plans'),
  getCurrentSubscription: () => ipcRenderer.invoke('get-current-subscription'),
  startTrial: () => ipcRenderer.invoke('start-trial'),
  submitPayment: (data: any) => ipcRenderer.invoke('submit-payment', data),
  getPaymentTransactions: (options?: any) => ipcRenderer.invoke('get-payment-transactions', options),
  getAllPaymentTransactions: (options?: any) => ipcRenderer.invoke('get-all-payment-transactions', options),
  approvePayment: (data: any) => ipcRenderer.invoke('approve-payment', data),
  rejectPayment: (data: any) => ipcRenderer.invoke('reject-payment', data),
  getSubscriptionHistory: () => ipcRenderer.invoke('get-subscription-history'),
  getRenewalInfo: () => ipcRenderer.invoke('get-renewal-info'),
  checkPremiumFeature: (feature: string) => ipcRenderer.invoke('check-premium-feature', feature),
  getSubscriptionStats: () => ipcRenderer.invoke('get-subscription-stats'),
  checkTrialAvailability: () => ipcRenderer.invoke('check-trial-availability'),

  // Debug
  debugPing: () => ipcRenderer.invoke('debug:ping'),

  // ── Update System ──
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  skipVersion: (version: string) => ipcRenderer.invoke('update:skip-version', version),
  remindLater: (hours?: number) => ipcRenderer.invoke('update:remind-later', hours),
  getUpdateStatus: () => ipcRenderer.invoke('update:get-status'),
  setAutoCheckEnabled: (enabled: boolean) => ipcRenderer.invoke('update:set-auto-check', enabled),
  getAppVersion: () => ipcRenderer.invoke('update:get-app-version'),
  clearReminder: () => ipcRenderer.invoke('update:clear-reminder'),

  onUpdateStatus: (callback: (data: any) => void) => {
    ipcRenderer.on('update:status', (_event, data) => callback(data));
  },
  onUpdateProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('update:progress', (_event, data) => callback(data));
  },
  onUpdateError: (callback: (data: any) => void) => {
    ipcRenderer.on('update:error', (_event, data) => callback(data));
  },
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update:status');
    ipcRenderer.removeAllListeners('update:progress');
    ipcRenderer.removeAllListeners('update:error');
  },

  // POS Products & Categories (cashier-safe)
  posProducts: () => ipcRenderer.invoke('pos:products'),
  posCategories: () => ipcRenderer.invoke('pos:categories'),
  posRegisters: () => ipcRenderer.invoke('pos:shift-by-register'),

  // POS Shifts (cashier)
  posLastShift: (cashierId: number) => ipcRenderer.invoke('shift:last-by-cashier', cashierId),
  shiftOpen: (data: { registerId: number; cashierId: number; openingFloat: number; notes?: string }) => ipcRenderer.invoke('shift:open', data),
  shiftClose: (shiftId: number, data: { closingCash: number; cashDrawerCounts?: any[]; notes?: string }) => ipcRenderer.invoke('shift:close', shiftId, data),
  shiftMidAudit: (shiftId: number, countedCash: number, notes?: string) => ipcRenderer.invoke('shift:mid-audit', shiftId, countedCash, notes),
  shiftActive: (registerId: number) => ipcRenderer.invoke('shift:active', registerId),
  shiftById: (shiftId: number) => ipcRenderer.invoke('shift:by-id', shiftId),
  shiftTransactions: (shiftId: number) => ipcRenderer.invoke('shift:transactions', shiftId),
  shiftSummary: (shiftId: number) => ipcRenderer.invoke('shift:summary', shiftId),
  shiftRecordTransaction: (data: { shiftId: number; saleId?: number | null; paymentMethod: string; amount: number; notes?: string }) =>
    ipcRenderer.invoke('shift:record-transaction', data),

  // Shared Business Model (registers, devices, roles, people)
  businessListRegisters: () => ipcRenderer.invoke('business:list-registers'),
  businessAddRegister: (name: string, locationId?: number) => ipcRenderer.invoke('business:add-register', name, locationId),
  businessUpdateRegister: (id: number, patch: any) => ipcRenderer.invoke('business:update-register', id, patch),
  businessDeleteRegister: (id: number) => ipcRenderer.invoke('business:delete-register', id),
  businessListLocations: () => ipcRenderer.invoke('business:list-locations'),
  businessAddLocation: (name: string, address?: string) => ipcRenderer.invoke('business:add-location', name, address),
  businessListDevices: () => ipcRenderer.invoke('business:list-devices'),
  businessSelfDeviceStatus: () => ipcRenderer.invoke('business:self-device-status'),
  businessSetDeviceStatus: (deviceId: string | number, status: string) => ipcRenderer.invoke('business:set-device-status', deviceId, status),
  businessRenameDevice: (deviceId: string | number, name: string) => ipcRenderer.invoke('business:rename-device', deviceId, name),
  businessReplaceDevice: (input: any) => ipcRenderer.invoke('business:replace-device', input),
  businessRoles: () => ipcRenderer.invoke('business:roles'),
  businessCan: (key: string) => ipcRenderer.invoke('business:can', key),
  businessListPeople: () => ipcRenderer.invoke('business:list-people'),
  businessSetPersonRole: (employeeId: number, roleKey: string) => ipcRenderer.invoke('business:set-person-role', employeeId, roleKey),
  businessSetPersonActive: (employeeId: number, isActive: boolean) => ipcRenderer.invoke('business:set-person-active', employeeId, isActive),

  // Employee QR pairing (cloud)
  pairingStatus: () => ipcRenderer.invoke('pairing:status'),
  pairingLinkAccount: (email: string, password: string) => ipcRenderer.invoke('pairing:link-account', email, password),
  pairingUnlink: () => ipcRenderer.invoke('pairing:unlink'),
  pairingList: () => ipcRenderer.invoke('pairing:list'),
  pairingInvite: (input: { employeeName?: string; role?: string; register?: string; location?: string }) => ipcRenderer.invoke('pairing:invite', input),
  pairingRevoke: (id: number) => ipcRenderer.invoke('pairing:revoke', id),
  pairingDecide: (id: number, decision: 'approve' | 'reject', role?: string, permissions?: Record<string, unknown>) => ipcRenderer.invoke('pairing:decide', id, decision, role, permissions),
  pairingAssignIdentity: (id: number, identity: { name?: string; avatar?: string | null }) => ipcRenderer.invoke('pairing:assign-identity', id, identity),
  pairingQrCode: (text: string) => ipcRenderer.invoke('pairing:qr-code', text),
  joinLookup: (code: string) => ipcRenderer.invoke('join:lookup', code),
  joinAccept: (input: { code: string; email: string; password: string; name?: string; deviceName?: string }) => ipcRenderer.invoke('join:accept', input),
  joinStatus: (invitationId?: number) => ipcRenderer.invoke('join:status', invitationId),
  joinActivate: (pin: string) => ipcRenderer.invoke('join:activate', pin),
  joinCancel: () => ipcRenderer.invoke('join:cancel'),
  // Bluetooth-style pairing-beacon discovery
  pairBeaconStart: (invite: any) => ipcRenderer.invoke('pair-beacon:start', invite),
  pairBeaconDiscoverable: (on: boolean, businessName?: string, role?: 'owner' | 'team') => ipcRenderer.invoke('pair-beacon:discoverable', on, businessName, role),
  pairBeaconStop: () => ipcRenderer.invoke('pair-beacon:stop'),
  pairBeaconNearby: () => ipcRenderer.invoke('pair-beacon:nearby'),
  deviceName: () => ipcRenderer.invoke('device:name'),

  // Tax computation (existing pos modules, now reachable)
  taxCalculateWht: (input: any) => ipcRenderer.invoke('tax:wht', input),
  taxCalculateVatReturn: (input: any) => ipcRenderer.invoke('tax:vat-return', input),
  taxCalculateTotReturn: (input: any) => ipcRenderer.invoke('tax:tot-return', input),
  taxCalculateMat: (grossTurnover: number) => ipcRenderer.invoke('tax:mat', grossTurnover),
  taxCalculateAdvance: (estimatedAnnualTax: number) => ipcRenderer.invoke('tax:advance', estimatedAnnualTax),
  taxCalculatePaye: (input: any) => ipcRenderer.invoke('tax:paye', input),
  taxCalculatePension: (input: any) => ipcRenderer.invoke('tax:pension', input),
  morQrGenerate: (data: any) => ipcRenderer.invoke('mor-qr:generate', data),
  morQrValidate: (payload: string) => ipcRenderer.invoke('mor-qr:validate', payload),
  morQrPrintReceipt: (data: any) => ipcRenderer.invoke('mor-qr:print-receipt', data),
  complianceCheck: (context: any, rules?: any[]) => ipcRenderer.invoke('compliance:check', context, rules),
  complianceValidateTin: (tin: string) => ipcRenderer.invoke('compliance:validate-tin', tin),
  complianceReport: (fromDate: string, toDate: string) => ipcRenderer.invoke('compliance:report', fromDate, toDate),

  // §U — Ministry of Revenues taxpayer verification
  morVerify: (tin: string, subTin?: string | null, force?: boolean) =>
    ipcRenderer.invoke('mor:verify', tin, subTin, force),
  morGet: (tin: string, subTin?: string | null) => ipcRenderer.invoke('mor:get', tin, subTin),
  morList: () => ipcRenderer.invoke('mor:list'),
  morClear: (tin: string) => ipcRenderer.invoke('mor:clear', tin),
  morIsVerified: (tin: string, subTin?: string | null) =>
    ipcRenderer.invoke('mor:is-verified', tin, subTin),

  // §15 — Manager PIN approval prompt (main → renderer event + renderer → main)
  onApprovalPrompt: (callback: (payload: any) => void) => {
    ipcRenderer.on('approval:prompt', (_event, payload) => callback(payload));
  },
  onBusinessChanged: (callback: (payload: { businessId: number; name: string }) => void) => {
    ipcRenderer.on('business-changed', (_event, payload) => callback(payload));
  },
  onDataChanged: (callback: (stats: { applied: number; conflicts: number; changes: number; source: string; at: string }) => void) => {
    ipcRenderer.on('data:changed', (_event, stats) => callback(stats));
  },
  removeDataChangedListeners: () => {
    ipcRenderer.removeAllListeners('data:changed');
  },

  // Phone-peripherals: use a connected phone as scanner / camera
  peripheralPhones: () => ipcRenderer.invoke('peripheral:phones'),
  peripheralScan: (deviceId: string, timeoutMs?: number) => ipcRenderer.invoke('peripheral:scan', deviceId, timeoutMs),
  peripheralCapture: (deviceId: string, mode: 'photo' | 'barcode' | 'qr', timeoutMs?: number) => ipcRenderer.invoke('peripheral:capture', deviceId, mode, timeoutMs),
  peripheralCancel: (deviceId: string, requestId: string) => ipcRenderer.invoke('peripheral:cancel', deviceId, requestId),
  // QR user invites (Teams → Add User)
  inviteCreate: (opts: { suggestedRole?: string } = {}) => ipcRenderer.invoke('invites:create', opts),
  inviteList: () => ipcRenderer.invoke('invites:list'),
  inviteDecide: (inviteId: string, decision: 'approved' | 'rejected', opts: { role?: string; name?: string; avatar?: string | null; permissions?: Record<string, unknown> } = {}) => ipcRenderer.invoke('invites:decide', inviteId, decision, opts),
  inviteAssignIdentity: (inviteId: string, identity: { name?: string; avatar?: string | null; role?: string; permissions?: Record<string, unknown> }) => ipcRenderer.invoke('invites:assign-identity', inviteId, identity),
  onApprovalPinInvalid: (callback: (payload: { requestId: string }) => void) => {
    ipcRenderer.on('approval:pin-invalid', (_event, payload) => callback(payload));
  },
  approveWithPin: (requestId: string, pin: string) => ipcRenderer.invoke('approval:resolve', { requestId, pin }),
  cancelApproval: (requestId: string) => ipcRenderer.invoke('approval:cancel', requestId),
})
