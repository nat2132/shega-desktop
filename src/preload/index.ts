import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
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

  // Sales
  getSales: (options?: any) => ipcRenderer.invoke('get-sales', options),
  getSale: (id: number) => ipcRenderer.invoke('get-sale', id),
  insertSale: (sale: any) => ipcRenderer.invoke('insert-sale', sale),
  updateSale: (id: number, sale: any) => ipcRenderer.invoke('update-sale', id, sale),
  deleteSale: (id: number) => ipcRenderer.invoke('delete-sale', id),
  getDebtSales: () => ipcRenderer.invoke('get-debt-sales'),
  payDebt: (saleId: number, amount: number) => ipcRenderer.invoke('pay-debt', saleId, amount),

  // Expenses
  getExpenses: (options?: any) => ipcRenderer.invoke('get-expenses', options),
  insertExpense: (expense: any) => ipcRenderer.invoke('insert-expense', expense),
  updateExpense: (id: number, expense: any) => ipcRenderer.invoke('update-expense', id, expense),
  deleteExpense: (id: number) => ipcRenderer.invoke('delete-expense', id),

  // Adjustments
  getAdjustments: (options?: any) => ipcRenderer.invoke('get-adjustments', options),
  insertAdjustment: (adjustment: any) => ipcRenderer.invoke('insert-adjustment', adjustment),

  // Notifications
  getNotifications: (options?: any) => ipcRenderer.invoke('get-notifications', options),
  insertNotification: (notification: any) => ipcRenderer.invoke('insert-notification', notification),
  markNotificationRead: (id: number) => ipcRenderer.invoke('mark-notification-read', id),
  clearNotifications: () => ipcRenderer.invoke('clear-notifications'),

  // Settings
  getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: any) => ipcRenderer.invoke('set-setting', key, value),

  // Analytics / Dashboard
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  getRecentActivity: (limit?: number) => ipcRenderer.invoke('get-recent-activity', limit),
  getAnalytics: (period: 'week' | 'month' | 'year') => ipcRenderer.invoke('get-analytics', period),

  // Customers
  getCustomers: () => ipcRenderer.invoke('get-customers'),
  getCustomerSales: (customerName: string) => ipcRenderer.invoke('get-customer-sales', customerName),

  // Data Management
  exportData: () => ipcRenderer.invoke('export-data'),
  resetData: () => ipcRenderer.invoke('reset-data')
})
