export interface ElectronAPI {
  // Categories
  getCategories: () => Promise<any[]>;
  insertCategory: (name: string, icon?: string) => Promise<number>;
  deleteCategory: (id: number) => Promise<any>;

  // Items
  getItems: (options?: any) => Promise<any[]>;
  getItem: (id: number) => Promise<any>;
  insertItem: (item: any) => Promise<number>;
  updateItem: (id: number, item: any) => Promise<any>;
  deleteItem: (id: number) => Promise<any>;
  getLowStockItems: () => Promise<any[]>;
  getExpiringItems: () => Promise<any[]>;

  // Sales
  getSales: (options?: any) => Promise<any[]>;
  getSale: (id: number) => Promise<any>;
  insertSale: (sale: any) => Promise<number>;
  updateSale: (id: number, sale: any) => Promise<any>;
  deleteSale: (id: number) => Promise<any>;
  getDebtSales: () => Promise<any[]>;
  payDebt: (saleId: number, amount: number) => Promise<any>;

  // Expenses
  getExpenses: (options?: any) => Promise<any[]>;
  insertExpense: (expense: any) => Promise<number>;
  updateExpense: (id: number, expense: any) => Promise<any>;
  deleteExpense: (id: number) => Promise<any>;

  // Adjustments
  getAdjustments: (options?: any) => Promise<any[]>;
  insertAdjustment: (adjustment: any) => Promise<number>;

  // Notifications
  getNotifications: (options?: any) => Promise<any[]>;
  insertNotification: (notification: any) => Promise<number>;
  markNotificationRead: (id: number) => Promise<any>;
  clearNotifications: () => Promise<any>;

  // Settings
  getSetting: (key: string) => Promise<any>;
  setSetting: (key: string, value: any) => Promise<any>;

  // Analytics / Dashboard
  getDashboardStats: () => Promise<any>;
  getRecentActivity: (limit?: number) => Promise<any[]>;
  getAnalytics: (period: 'week' | 'month' | 'year') => Promise<any>;

  // Customers
  getCustomers: () => Promise<any[]>;
  getCustomerSales: (customerName: string) => Promise<any[]>;

  // Data Management
  exportData: () => Promise<any>;
  resetData: () => Promise<any>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
