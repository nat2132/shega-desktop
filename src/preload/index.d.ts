import type { MorVerification } from '@shega/shared';

/** Owner hub a discovered pairing invite belongs to — pins join to the LAN. */
export interface JoinSession {
  host: string;
  platform: 'mobile' | 'desktop';
  port: number;
  businessId?: string;
  businessName?: string;
}

export interface ElectronAPI {
  // Businesses
  getActiveBusiness: () => Promise<any>;
  updateBusiness: (id: number, biz: any) => Promise<any>;
  businessList: () => Promise<any[]>;
  businessCreate: (data: any) => Promise<any>;
  businessSwitch: (id: number) => Promise<any>;
  businessSetDefault: (id: number) => Promise<any>;
  businessArchive: (id: number) => Promise<any>;
  businessLeave: (id: number) => Promise<any>;

  // Categories
  getCategories: () => Promise<any[]>;
  insertCategory: (name: string, icon?: string) => Promise<number>;
  deleteCategory: (id: number) => Promise<any>;

  // Items
  getItems: (options?: any) => Promise<any[]>;
  generateShegaCode: () => Promise<string>;
  itemBarcodesList: (itemId: number) => Promise<any[]>;
  itemBarcodesAdd: (itemId: number, barcode: string) => Promise<number>;
  itemBarcodesRemove: (barcodeId: number) => Promise<void>;
  itemBarcodesSetPrimary: (barcodeId: number) => Promise<void>;
  getItem: (id: number) => Promise<any>;
  insertItem: (item: any) => Promise<number>;
  updateItem: (id: number, item: any) => Promise<any>;
  deleteItem: (id: number) => Promise<any>;
  getLowStockItems: () => Promise<any[]>;
  getReorderSuggestions: () => Promise<any[]>;
  getReportDrilldowns: (range: { start: string; end: string }) => Promise<any>;
  getGlJournal: (range: { start: string; end: string }) => Promise<any>;
  getExpiringItems: () => Promise<any[]>;
  getItemsBySupplier: (supplierId: number) => Promise<any[]>;
  restockItem: (id: number, quantity: number) => Promise<{ success: boolean }>;
  archiveItem: (data: any) => Promise<any>;
  restoreItem: (data: any) => Promise<any>;
  getDeletedItems: () => Promise<any[]>;

  // Sales
  getSales: (options?: any) => Promise<any[]>;
  getSale: (id: number) => Promise<any>;
  insertSale: (sale: any) => Promise<number>;
  insertSalesBatch: (sales: any[]) => Promise<number[]>;
  updateSale: (id: number, sale: any) => Promise<any>;
  deleteSale: (id: number) => Promise<any>;
  getDebtSales: () => Promise<any[]>;
  payDebt: (saleId: number, amount: number, options?: { type?: string; note?: string }) => Promise<any>;
  getDebtPayments: (saleId: number) => Promise<any[]>;
  createReturn: (data: any) => Promise<{ success: boolean; returnId?: number; error?: string }>;
  getReturns: (options?: any) => Promise<any[]>;
  voidSale: (data: any) => Promise<any>;
  reverseDebtPayment: (data: any) => Promise<any>;

  // Notifications
  checkNotifications: () => Promise<any>;
  getNotifications: (options?: any) => Promise<any[]>;
  getUnreadNotificationCount: () => Promise<number>;
  getNotificationCategories: () => Promise<any[]>;
  insertNotification: (notification: any) => Promise<number>;
  markNotificationRead: (id: number) => Promise<any>;
  markAllNotificationsRead: () => Promise<any>;
  dismissNotification: (id: number) => Promise<any>;
  snoozeNotification: (id: number, untilIso: string) => Promise<any>;
  clearNotifications: (options?: any) => Promise<any>;

  // Notification preferences
  getNotificationPreferences: () => Promise<any[]>;
  updateNotificationPreference: (key: string, prefs: any) => Promise<{ success: boolean }>;

  // Banners
  getActiveBanners: () => Promise<any[]>;
  dismissBanner: (id: number) => Promise<any>;
  createBanner: (data: any) => Promise<number>;

  // Reminders
  getReminders: (options?: any) => Promise<any[]>;
  createReminder: (data: any) => Promise<number>;
  updateReminder: (id: number, data: any) => Promise<any>;
  snoozeReminder: (id: number, untilIso: string) => Promise<any>;
  completeReminder: (id: number) => Promise<any>;
  deleteReminder: (id: number) => Promise<any>;
  runReminderEngine: () => Promise<{ fired: number }>;

  // Desktop OS notification
  showDesktopNotification: (data: { title: string; body: string; urgency?: 'normal' | 'critical' }) => Promise<{ shown: boolean; reason?: string }>;

  // Dashboard alerts
  getDashboardAlerts: () => Promise<any[]>;

  // Settings
  getSetting: (key: string) => Promise<any>;
  setSetting: (key: string, value: any) => Promise<any>;

  // Analytics / Dashboard
  getDashboardStats: () => Promise<any>;
  getRecentActivity: (limit?: number, dateRange?: { start: string; end: string }) => Promise<any[]>;

  // P2P Yjs + WebRTC sync
  p2pHealth: () => Promise<any>;
  p2pDevices: () => Promise<any[]>;
  p2pAnnounce: () => Promise<boolean>;
  p2pApprove: (name?: string, code?: string) => Promise<string[]>;
  p2pRevokeDevice: (deviceId: string) => Promise<boolean>;
  p2pRenameDevice: (deviceId: string, name: string) => Promise<boolean>;
  p2pRecordCounts: () => Promise<Record<string, number>>;
  p2pPersistPeer: (device: { deviceId: string; name?: string; platform?: 'mobile' | 'desktop'; businessId?: number | string; model?: string }) => Promise<{ ok: boolean; error?: string }>;
  getAnalytics: (period: string, dateRange?: { start: string; end: string }) => Promise<any>;
  getVatReport: (dateRange?: { start: string; end: string }) => Promise<any>;
  getVoidedSales: (options?: any) => Promise<any>;
  getReversalStats: () => Promise<any>;

  // Customers
  getCustomers: () => Promise<any[]>;
  getCustomer: (id: number) => Promise<any>;
  getCustomerSales: (customerName: string) => Promise<any[]>;
  insertCustomer: (customer: any) => Promise<{ success: boolean; id?: number; error?: string }>;
  updateCustomer: (customer: any) => Promise<{ success: boolean; error?: string }>;
  deleteCustomer: (id: number) => Promise<{ success: boolean; error?: string }>;
  getCustomerNotes: (customerId: number) => Promise<any[]>;
  addCustomerNote: (customerId: number, note: string, createdBy?: string) => Promise<{ success: boolean }>;
  archiveCustomer: (data: any) => Promise<any>;
  restoreCustomer: (data: any) => Promise<any>;
  getDeletedCustomers: () => Promise<any[]>;

  // Data Management
  exportData: () => Promise<any>;
  resetData: (mode?: 'transactions' | 'all' | 'factory') => Promise<any>;
  factoryReset: () => Promise<{ ok: boolean; deleted: string[]; error?: string }>;
  quitApp: () => Promise<void>;

  // Admin Management
  login: (username: string, pin: string) => Promise<any>;
  getAdmins: () => Promise<any[]>;
  getLoginUsers: () => Promise<Array<{ key: string; source: 'admin' | 'employee' | 'roster'; id: number; name: string; username: string | null; role: string; roleName: string; avatar: string | null; isOwner: boolean }>>;
  getLastLoginUser: () => Promise<string | null>;
  loginByUser: (source: 'admin' | 'employee' | 'roster', id: number, pin: string) => Promise<any>;
  getCurrentAdmin: (id: number, isEmployee?: boolean) => Promise<any>;
  insertAdmin: (admin: any) => Promise<any>;
  updateAdmin: (id: number, admin: any) => Promise<any>;
  deleteAdmin: (id: number) => Promise<any>;

  // Warehouses
  getWarehouses: () => Promise<any[]>;
  getWarehouse: (id: number) => Promise<any>;
  insertWarehouse: (wh: any) => Promise<number>;
  updateWarehouse: (id: number, wh: any) => Promise<any>;
  deleteWarehouse: (id: number) => Promise<any>;

  // Warehouse Inventory
  getWarehouseInventory: (warehouseId: number) => Promise<any[]>;
  getAllWarehouseInventory: (options?: any) => Promise<any[]>;
  updateWarehouseInventory: (warehouseId: number, itemId: number, quantity: number) => Promise<any>;

  // Stock Transfers
  transferStock: (transfer: any) => Promise<number>;
  getStockTransfers: (options?: any) => Promise<any[]>;

  // Stock Movements
  getStockMovements: (options?: any) => Promise<any[]>;
  cleanupStockMovements: () => Promise<{ success: boolean; deleted: number }>;
  getWarehouseReport: (warehouseId: number) => Promise<any>;

  // Employee Roles
  getEmployeeRoles: () => Promise<any[]>;
  getEmployeeRole: (id: number) => Promise<any>;
  insertEmployeeRole: (data: any) => Promise<any>;
  updateEmployeeRole: (id: number, data: any) => Promise<any>;
  duplicateEmployeeRole: (id: number) => Promise<any>;
  deleteEmployeeRole: (id: number) => Promise<any>;

  // Employees
  getEmployees: (options?: any) => Promise<any[]>;
  getEmployee: (id: number) => Promise<any>;
  insertEmployee: (data: any) => Promise<any>;
  updateEmployee: (id: number, data: any) => Promise<any>;
  deleteEmployee: (id: number) => Promise<any>;
  archiveEmployee: (id: number) => Promise<any>;
  reactivateEmployee: (id: number) => Promise<any>;

  // Employee Accounts
  getEmployeeAccounts: () => Promise<any[]>;
  insertEmployeeAccount: (data: any) => Promise<any>;
  updateEmployeeAccount: (id: number, data: any) => Promise<any>;
  deleteEmployeeAccount: (id: number) => Promise<any>;
  lockEmployeeAccount: (id: number) => Promise<any>;
  unlockEmployeeAccount: (id: number) => Promise<any>;
  resetEmployeePassword: (id: number, newPin: string) => Promise<any>;
  loginEmployee: (username: string, pin: string) => Promise<any>;

  // PIN Recovery
  generateRecoveryKey: (entityType: 'employee' | 'admin', entityId: number) => Promise<{ recoveryKey: string; hint: string }>;
  verifyRecoveryKey: (username: string, recoveryKey: string) => Promise<{ valid: boolean; error?: string; accountId?: number; isEmployee?: boolean }>;
  resetPinWithRecovery: (username: string, recoveryKey: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  lockUserAccount: (id: number) => Promise<{ success: boolean; error?: string }>;
  unlockUserAccount: (id: number) => Promise<{ success: boolean; error?: string }>;
  forcePinChange: (id: number) => Promise<{ success: boolean; error?: string }>;
  getPinHistory: (entityType?: string, entityId?: number) => Promise<any[]>;

  // Login History
  getLoginHistory: (options?: any) => Promise<any[]>;

  // Attendance
  clockIn: (employeeId: number, notes?: string) => Promise<any>;
  clockOut: (employeeId: number, notes?: string) => Promise<any>;
  getAttendance: (options?: any) => Promise<any[]>;
  getTodayAttendance: () => Promise<any[]>;

  // Employee Performance
  getEmployeePerformance: (options?: any) => Promise<any[]>;
  updateEmployeePerformance: (data: any) => Promise<any>;

  // Employee Stats (Dashboard)
  getEmployeeStats: () => Promise<any>;

  // Shipments
  getShipments: (options?: any) => Promise<any[]>;
  getShipment: (id: number) => Promise<any>;
  insertShipment: (data: any) => Promise<number>;
  updateShipment: (id: number, data: any) => Promise<any>;
  updateShipmentStatus: (id: number, status: string, changedBy?: string, notes?: string) => Promise<any>;
  deleteShipment: (id: number) => Promise<any>;
  getShipmentHistory: (shipmentId: number) => Promise<any[]>;

  // Suppliers
  getSuppliers: (options?: any) => Promise<{ rows: any[]; total: number }>;
  getSupplier: (id: number) => Promise<any>;
  insertSupplier: (data: any) => Promise<{ id: number }>;
  updateSupplier: (id: number, data: any) => Promise<{ success: boolean }>;
  archiveSupplier: (id: number) => Promise<{ success: boolean }>;
  restoreSupplier: (id: number) => Promise<{ success: boolean }>;
  deleteSupplier: (id: number) => Promise<{ success: boolean }>;

  getSupplierPurchases: (options?: any) => Promise<{ rows: any[]; total: number }>;
  getSupplierPurchase: (id: number) => Promise<any>;
  insertSupplierPurchase: (data: any) => Promise<{ id: number }>;
  updateSupplierPurchaseStatus: (id: number, status: string, notes?: string) => Promise<{ success: boolean }>;
  deleteSupplierPurchase: (id: number) => Promise<{ success: boolean }>;

  getSupplierPayments: (options?: any) => Promise<{ rows: any[]; total: number }>;
  insertSupplierPayment: (data: any) => Promise<{ id: number }>;
  updateSupplierPayment: (id: number, data: any) => Promise<{ success: boolean }>;
  deleteSupplierPayment: (id: number) => Promise<{ success: boolean }>;
  reverseSupplierPayment: (data: any) => Promise<any>;

  getSupplierProducts: (supplierId: number) => Promise<any[]>;
  getSupplierBalance: (supplierId: number) => Promise<any>;
  getSupplierAgingReport: () => Promise<any[]>;
  getSupplierDashboardStats: () => Promise<any>;
  getSupplierMonthlyReport: () => Promise<any[]>;
  getTopSuppliers: (limit?: number) => Promise<any[]>;
  toggleSupplierFavorite: (id: number) => Promise<{ success: boolean; isFavorite: boolean }>;
  getSupplierActivityLog: (supplierId: number, limit?: number) => Promise<any[]>;
  getSupplierAnalytics: () => Promise<{ topSuppliers: any[]; monthlyTrends: any[]; outstandingBySupplier: any[]; avgPurchase: number; summary: any }>;

  // Backup & Restore
  createBackup: () => Promise<{ success: boolean; name?: string; size?: number; error?: string }>;
  listBackups: () => Promise<{ name: string; size: number; createdAt: string }[]>;
  restoreBackup: (name: string) => Promise<{ success: boolean; error?: string }>;
  deleteBackup: (name: string) => Promise<{ success: boolean; error?: string }>;

  // Receipt Printing
  printReceipt: (sale: any) => Promise<{ success: boolean; error?: string }>;
  barcodePng: (value: string) => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
  barcodePngDataUrl: (value: string) => Promise<{ success: boolean; dataUrl?: string; error?: string }>;
  simulateScan: (code?: string) => Promise<{ success: boolean; value?: string; simulated?: boolean; transport?: 'hid' | 'serial'; error?: string }>;

  // Mock Peripherals (USE_MOCK_PERIPHERALS dev harness)
  mockPeripheralStatus: () => Promise<any>;
  mockScan: (code?: string) => Promise<{ success: boolean; value?: string; simulated?: boolean; transport?: 'hid' | 'serial'; error?: string }>;
  mockScanSerial: (code?: string) => Promise<{ success: boolean; value?: string; simulated?: boolean; transport?: 'hid' | 'serial'; error?: string }>;
  mockPrintReceipt: (payload?: any) => Promise<{ success: boolean; jobId?: string; byteLength?: number; commands?: number; ascii?: string; html?: string; error?: string }>;
  mockPrintBytes: (bytes: number[]) => Promise<{ success: boolean; jobId?: string; byteLength?: number; commands?: number; ascii?: string; html?: string; error?: string }>;
  mockDecode: (bytes: number[]) => Promise<{ success: boolean; commands?: any[]; tokens?: any[]; error?: string }>;

  // Draft Sales
  getDraftSales: () => Promise<any[]>;
  getDraftSale: (id: number) => Promise<any>;
  saveDraftSale: (data: any) => Promise<{ success: boolean; id?: number }>;
  deleteDraftSale: (id: number) => Promise<any>;

  // Supplier Price Checks
  getSupplierPriceChecks: (supplierId?: number) => Promise<any[]>;
  saveSupplierPriceCheck: (data: any) => Promise<{ success: boolean; id?: number }>;
  deleteSupplierPriceCheck: (id: number) => Promise<any>;

  // Quiet Hours
  getQuietHours: () => Promise<any[]>;
  setQuietHours: (data: any) => Promise<{ success: boolean; id?: number }>;
  deleteQuietHours: () => Promise<any>;

  // External links
  openExternal: (url: string) => Promise<any>;

  // Supplier Reports
  getSupplierUnpaidOrders: () => Promise<any>;
  getSupplierPaymentDueAlerts: () => Promise<any>;
  getSupplierLowStock: () => Promise<any>;
  getSupplierReportSummary: () => Promise<any>;
  getSupplierTransactionReport: (options?: any) => Promise<any>;
  getInventoryBySupplierReport: () => Promise<any>;

  // Audit Logs
  getAuditLogs: (options?: any) => Promise<any[]>;
  reverseAuditLogEntry: (data: { logId: number }) => Promise<any>;

  // CSV / Data Import
  importData: (module: string, rows: any[]) => Promise<{ success: boolean; imported: number; errors: { row: number; message: string }[]; skipped: number }>;

  // Global Search
  globalSearch: (query: string) => Promise<GlobalSearchResult[]>;

  // Business Health Score
  getBusinessHealthScore: () => Promise<BusinessHealthScore>;

  // Business Assistant Insights
  getBusinessInsights: () => Promise<BusinessInsight[]>;

  // Debug
  debugPing: () => Promise<{ ok: boolean; timestamp: string; handlersRegistered: boolean }>;

  // Order Management

  getOrders: (options?: any) => Promise<any[]>;
  getOrder: (id: number) => Promise<any>;
  insertOrder: (data: any) => Promise<number>;
  convertOrderToSale: (data: { orderId: number; paymentMethod?: string; discount?: number; vat?: number }) => Promise<{ success: boolean; saleIds: number[] }>;
  convertOrderToDebt: (data: { orderId: number; dueDate?: string; paymentMethod?: string; discount?: number; vat?: number }) => Promise<{ success: boolean; saleIds: number[] }>;
  cancelOrder: (data: { orderId: number; reason?: string }) => Promise<{ success: boolean }>;

  // ── Update System ──
  checkForUpdates: () => Promise<UpdateCheckResult>;
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
  installUpdate: () => Promise<{ success: boolean }>;
  skipVersion: (version: string) => Promise<{ success: boolean }>;
  remindLater: (hours?: number) => Promise<{ success: boolean }>;
  getUpdateStatus: () => Promise<UpdateStatusResult>;
  setAutoCheckEnabled: (enabled: boolean) => Promise<{ success: boolean }>;
  getAppVersion: () => Promise<string>;
  clearReminder: () => Promise<{ success: boolean }>;

  onUpdateStatus: (callback: (data: { status: UpdateStatus; info?: UpdateInfoData }) => void) => void;
  onUpdateProgress: (callback: (data: UpdateProgressData) => void) => void;
  onUpdateError: (callback: (data: { message: string }) => void) => void;
  removeUpdateListeners: () => void;

  // POS Shifts (cashier)
  posProducts: () => Promise<any[]>;
  posCategories: () => Promise<any[]>;
  posRegisters: () => Promise<any[]>;
  posLastShift: (cashierId: number) => Promise<any>;
  shiftOpen: (data: { registerId: number; cashierId: number; openingFloat: number; notes?: string }) => Promise<number>;
  shiftClose: (shiftId: number, data: { closingCash: number; cashDrawerCounts?: any[]; notes?: string }) => Promise<any>;
  shiftMidAudit: (shiftId: number, countedCash: number, notes?: string) => Promise<any>;
  shiftActive: (registerId: number) => Promise<any>;
  shiftById: (shiftId: number) => Promise<any>;
  shiftTransactions: (shiftId: number) => Promise<any[]>;
  shiftSummary: (shiftId: number) => Promise<any>;
  shiftRecordTransaction: (data: { shiftId: number; saleId?: number | null; paymentMethod: string; amount: number; notes?: string }) => Promise<any>;

  // Shared Business Model (registers, devices, roles, people)
  businessListRegisters: () => Promise<any[]>;
  businessAddRegister: (name: string, locationId?: number) => Promise<any>;
  businessUpdateRegister: (id: number, patch: any) => Promise<any>;
  businessDeleteRegister: (id: number) => Promise<any>;
  businessListLocations: () => Promise<any[]>;
  businessAddLocation: (name: string, address?: string) => Promise<any>;
  businessListDevices: () => Promise<any[]>;
  businessSelfDeviceStatus: () => Promise<{ found: boolean; deviceId: string; status: string | null; name: string | null }>;
  businessSetDeviceStatus: (deviceId: string | number, status: string) => Promise<any>;
  businessRenameDevice: (deviceId: string | number, name: string) => Promise<any>;
  businessReplaceDevice: (input: { oldDeviceId: string | number; name: string; platform?: string; setThisAsReplacement?: boolean }) => Promise<any>;
  businessRoles: () => Promise<any[]>;
  businessCan: (key: string) => Promise<{ allowed: boolean }>;
  businessListPeople: () => Promise<any[]>;
  businessSetPersonRole: (employeeId: number, roleKey: string) => Promise<any>;
  businessSetPersonActive: (employeeId: number, isActive: boolean) => Promise<any>;

  // Employee QR pairing (cloud)
  pairingStatus: () => Promise<{ linked: boolean; email: string | null; businessName: string | null }>;
  pairingLinkAccount: (email: string, password: string) => Promise<{ linked: boolean; email: string; businessName: string }>;
  pairingUnlink: () => Promise<{ linked: boolean }>;
  pairingList: () => Promise<any[]>;
  pairingInvite: (input: { employeeName?: string; role?: string; register?: string; location?: string }) => Promise<any>;
  pairingRevoke: (id: number) => Promise<any>;
  pairingDecide: (id: number, decision: 'approve' | 'reject', role?: string, permissions?: Record<string, unknown>) => Promise<any>;
  pairingAssignIdentity: (id: number, identity: { name?: string; avatar?: string | null }) => Promise<boolean>;
  pairingQrCode: (text: string) => Promise<string>;

  // Cloud relay (SYNC_CONTRACT §5)
  cloudStatus: () => Promise<{ configured: boolean; enabled: boolean; url: string; urlFromDefault: boolean; cursor: number; lastAt: string | null; lastError: string | null }>;
  cloudSync: () => Promise<{ ok: boolean; reason?: string; error?: string; accepted?: number; pulled?: number; applied?: number; conflicts?: number; cursor?: number; lastSeq?: number }>;
  cloudVerify: () => Promise<{ ok: boolean; error?: string; tables?: Record<string, { count: number; checksum: string }>; matched: boolean }>;
  saveCloudConfig: (input: { url?: string; deviceKey?: string; enabled?: boolean }) => Promise<{ ok: boolean }>;
  cloudEnabled: (enabled: boolean) => Promise<{ ok: boolean }>;

  // Shega cloud subscription (backend served via ngrok)
  backendLogin: (creds: { username: string; password: string }) => Promise<any>;
  backendLogout: () => Promise<any>;
  backendSession: () => Promise<any>;
  backendSync: () => Promise<any>;
  backendPlans: () => Promise<any>;
  backendStartTrial: (args: { planId?: number }) => Promise<any>;
  /** Backend base URL configuration (setting → SHEGA_BACKEND_URL → default). */
  getBackendUrl: () => Promise<{ baseUrl: string }>;
  setBackendUrl: (url: string) => Promise<{ success: boolean; baseUrl?: string; error?: string }>;
  backendSubmitPayment: (args: { planId: number; transactionId: string; paymentMethod?: string; description?: string; paymentType?: string; quantity?: number }) => Promise<any>;

  // Join an existing business (desktop employee onboarding via 6-digit code)
  joinLookup: (code: string, session?: JoinSession) => Promise<{ business_id: number; business_name: string; employee_name: string | null; role: string; register: string | null; location: string | null; expires_at: string }>;
  joinAccept: (input: { code: string; email: string; password: string; name?: string; deviceName?: string }, session?: JoinSession) => Promise<{ status: 'pending' | 'active'; invitation_id: number | null; device_key: string | null; device_id: string; business_name: string | null; role: string | null; email: string }>;
  joinStatus: (invitationId?: number) => Promise<{ phase: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired' | 'error' | 'none'; status?: string; business_name?: string | null; role?: string | null; device_status?: string | null; email?: string | null; error?: string }>;
  joinActivate: (pin: string | { pin: string; name?: string; username?: string; avatar?: string | null }) => Promise<{ success: boolean; username: string }>;
  joinCancel: () => Promise<{ cancelled: boolean }>;
  pairBeaconStart: (invite: any) => Promise<{ publishing: boolean }>;
  pairBeaconDiscoverable: (on: boolean, businessName?: string, role?: 'owner' | 'team') => Promise<{ publishing: boolean }>;
  pairBeaconStop: () => Promise<{ publishing: boolean }>;
  pairBeaconNearby: () => Promise<Array<{ beacon: any; host: string; port: number; platform: string }>>;
  onDeviceEvent: (cb: (e: any) => void) => () => void;
  deviceName: () => Promise<string>;

  taxCalculateWht: (input: any) => Promise<any>;
  taxCalculateVatReturn: (input: any) => Promise<any>;
  taxCalculateTotReturn: (input: any) => Promise<any>;
  taxCalculateMat: (grossTurnover: number) => Promise<number>;
  taxCalculateAdvance: (estimatedAnnualTax: number) => Promise<number>;
  taxCalculatePaye: (input: any) => Promise<any>;
  taxCalculatePension: (input: any) => Promise<any>;
  morQrGenerate: (data: any) => Promise<any>;
  morQrValidate: (payload: string) => Promise<any>;
  morQrPrintReceipt: (data: any) => Promise<{ success: boolean }>;
  complianceCheck: (context: any, rules?: any[]) => Promise<any>;
  complianceValidateTin: (tin: string) => Promise<any>;
  complianceReport: (fromDate: string, toDate: string) => Promise<any>;

  // §U — Ministry of Revenues taxpayer verification
  morVerify: (tin: string, subTin?: string | null, force?: boolean) => Promise<MorVerification>;
  morGet: (tin: string, subTin?: string | null) => Promise<MorVerification | null>;
  morList: () => Promise<{ verification: MorVerification; fresh: boolean }[]>;
  morClear: (tin: string) => Promise<{ cleared: boolean }>;
  morIsVerified: (tin: string, subTin?: string | null) => Promise<{ verified: boolean }>;

  // §15 — Manager PIN approval
  onApprovalPrompt: (callback: (payload: {
    requestId: string;
    title?: string;
    message?: string;
    approverName?: string;
    context: string;
  }) => void) => void;
  onApprovalPinInvalid: (callback: (payload: { requestId: string }) => void) => void;
  approveWithPin: (requestId: string, pin: string) => Promise<boolean>;

  // Business scope switching — pushed when the active business changes
  onBusinessChanged: (callback: (payload: { businessId: number; name: string }) => void) => void;

  // Phone-peripherals: use a connected phone as scanner / camera
  peripheralPhones: () => Promise<Array<{ deviceId: string; name: string; model?: string; platform: string; kinds: string[] }>>;
  peripheralScan: (deviceId: string, timeoutMs?: number) => Promise<{ barcode: string; symbology?: string; deviceId: string }>;
  peripheralCapture: (deviceId: string, mode: 'photo' | 'barcode' | 'qr', timeoutMs?: number) => Promise<{ dataUrl?: string; text?: string; mode: string; deviceId: string }>;
  peripheralCancel: (deviceId: string, requestId: string) => Promise<boolean>;
  // QR user invites (Teams → Add User)
  inviteCreate: (opts?: { suggestedRole?: string }) => Promise<any>;
  inviteList: () => Promise<any[]>;
  inviteDecide: (inviteId: string, decision: 'approved' | 'rejected', opts?: { role?: string; name?: string; avatar?: string | null; permissions?: Record<string, unknown> }) => Promise<any>;
  inviteAssignIdentity: (inviteId: string, identity: { name?: string; avatar?: string | null; role?: string; permissions?: Record<string, unknown> }) => Promise<boolean>;
  cancelApproval: (requestId: string) => Promise<boolean>;
}

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';

export interface UpdateProgressData {
  bytesPerSecond: number;
  percent: number;
  total: number;
  transferred: number;
  eta: number;
}

export interface UpdateInfoData {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  files: { url: string; size: number }[];
}

export interface UpdateCheckResult {
  status: UpdateStatus;
  info?: UpdateInfoData;
  error?: string;
}

export interface UpdateStatusResult {
  status: UpdateStatus;
  info: UpdateInfoData | null;
  progress: UpdateProgressData | null;
  error: string | null;
  appVersion: string;
  autoCheckEnabled: boolean;
}

export interface GlobalSearchResult {
  type: 'item' | 'sale' | 'customer' | 'supplier' | 'category' | 'warehouse' | 'purchase' | 'adjustment' | 'notification' | 'draft';
  id: number;
  title: string;
  subtitle: string;
  route: string | null;
  detail: number;
}

export interface BusinessHealthScore {
  score: number;
  rating: string;
  factors: { name: string; score: number; weight: number; status: 'good' | 'warning' | 'critical'; detail: string }[];
  recommendations: string[];
}

export interface BusinessInsight {
  type: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  message: string;
  action?: { label: string; route: string };
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
