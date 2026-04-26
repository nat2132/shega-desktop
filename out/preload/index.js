"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  // Categories
  getCategories: () => electron.ipcRenderer.invoke("get-categories"),
  insertCategory: (name, icon) => electron.ipcRenderer.invoke("insert-category", name, icon),
  deleteCategory: (id) => electron.ipcRenderer.invoke("delete-category", id),
  // Items
  getItems: (options) => electron.ipcRenderer.invoke("get-items", options),
  getItem: (id) => electron.ipcRenderer.invoke("get-item", id),
  insertItem: (item) => electron.ipcRenderer.invoke("insert-item", item),
  updateItem: (id, item) => electron.ipcRenderer.invoke("update-item", id, item),
  deleteItem: (id) => electron.ipcRenderer.invoke("delete-item", id),
  getLowStockItems: () => electron.ipcRenderer.invoke("get-low-stock-items"),
  getExpiringItems: () => electron.ipcRenderer.invoke("get-expiring-items"),
  // Sales
  getSales: (options) => electron.ipcRenderer.invoke("get-sales", options),
  getSale: (id) => electron.ipcRenderer.invoke("get-sale", id),
  insertSale: (sale) => electron.ipcRenderer.invoke("insert-sale", sale),
  updateSale: (id, sale) => electron.ipcRenderer.invoke("update-sale", id, sale),
  deleteSale: (id) => electron.ipcRenderer.invoke("delete-sale", id),
  getDebtSales: () => electron.ipcRenderer.invoke("get-debt-sales"),
  payDebt: (saleId, amount) => electron.ipcRenderer.invoke("pay-debt", saleId, amount),
  // Expenses
  getExpenses: (options) => electron.ipcRenderer.invoke("get-expenses", options),
  insertExpense: (expense) => electron.ipcRenderer.invoke("insert-expense", expense),
  updateExpense: (id, expense) => electron.ipcRenderer.invoke("update-expense", id, expense),
  deleteExpense: (id) => electron.ipcRenderer.invoke("delete-expense", id),
  // Adjustments
  getAdjustments: (options) => electron.ipcRenderer.invoke("get-adjustments", options),
  insertAdjustment: (adjustment) => electron.ipcRenderer.invoke("insert-adjustment", adjustment),
  // Notifications
  getNotifications: (options) => electron.ipcRenderer.invoke("get-notifications", options),
  insertNotification: (notification) => electron.ipcRenderer.invoke("insert-notification", notification),
  markNotificationRead: (id) => electron.ipcRenderer.invoke("mark-notification-read", id),
  clearNotifications: () => electron.ipcRenderer.invoke("clear-notifications"),
  // Settings
  getSetting: (key) => electron.ipcRenderer.invoke("get-setting", key),
  setSetting: (key, value) => electron.ipcRenderer.invoke("set-setting", key, value),
  // Analytics / Dashboard
  getDashboardStats: () => electron.ipcRenderer.invoke("get-dashboard-stats"),
  getRecentActivity: (limit) => electron.ipcRenderer.invoke("get-recent-activity", limit),
  getAnalytics: (period) => electron.ipcRenderer.invoke("get-analytics", period),
  // Customers
  getCustomers: () => electron.ipcRenderer.invoke("get-customers"),
  getCustomerSales: (customerName) => electron.ipcRenderer.invoke("get-customer-sales", customerName),
  // Data Management
  exportData: () => electron.ipcRenderer.invoke("export-data"),
  resetData: () => electron.ipcRenderer.invoke("reset-data")
});
