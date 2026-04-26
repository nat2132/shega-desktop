"use strict";
const electron = require("electron");
const path = require("path");
const Database = require("better-sqlite3");
const fs = require("fs");
const isDev = !electron.app.isPackaged;
const dbDir = isDev ? path.join(process.cwd(), "db") : path.join(electron.app.getPath("userData"), "db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, "shega_desktop.db");
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      isCustom INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      categoryId INTEGER,
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
      supplierAccount TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS item_packs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemId INTEGER,
      packNumber INTEGER,
      initialQuantity REAL,
      currentQuantity REAL,
      unit TEXT,
      status TEXT DEFAULT 'Not Opened',
      FOREIGN KEY (itemId) REFERENCES items(id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemId INTEGER,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      unitType TEXT NOT NULL,
      discount REAL DEFAULT 0,
      vat REAL DEFAULT 0,
      totalPrice REAL NOT NULL,
      paymentMethod TEXT,
      paymentStatus TEXT,
      customerName TEXT,
      customerPhone TEXT,
      packId INTEGER,
      dueDate TEXT,
      paidAmount REAL DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (itemId) REFERENCES items(id),
      FOREIGN KEY (packId) REFERENCES item_packs(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      date TEXT NOT NULL,
      isRecurring INTEGER DEFAULT 0,
      frequency TEXT,
      nextBillingDate TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemId INTEGER NOT NULL,
      type TEXT NOT NULL,
      oldValue REAL,
      newValue REAL,
      quantity REAL,
      unitType TEXT,
      reason TEXT,
      date TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (itemId) REFERENCES items(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT, -- 'info', 'warning', 'error', 'success'
      isRead INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
  const count = db.prepare("SELECT COUNT(*) as count FROM categories").get();
  if (count.count === 0) {
    const insertCat = db.prepare("INSERT INTO categories (name, icon, isCustom) VALUES (?, ?, 0)");
    const defaultCats = [
      ["Grocery", "shopping-basket"],
      ["Hardware", "hammer"],
      ["Electrical", "zap"],
      ["Plumbing", "droplet"],
      ["Cleaning", "sparkles"],
      ["Building", "factory"]
    ];
    for (const cat of defaultCats) {
      insertCat.run(cat[0], cat[1]);
    }
  }
}
function registerIPCHandlers() {
  electron.ipcMain.handle("get-categories", () => {
    return db.prepare("SELECT * FROM categories ORDER BY name").all();
  });
  electron.ipcMain.handle("insert-category", (_, name, icon) => {
    return db.prepare("INSERT INTO categories (name, icon, isCustom) VALUES (?, ?, 1)").run(name, icon || "tag").lastInsertRowid;
  });
  electron.ipcMain.handle("delete-category", (_, id) => {
    return db.prepare("DELETE FROM categories WHERE id = ? AND isCustom = 1").run(id);
  });
  electron.ipcMain.handle("get-items", (_, options = {}) => {
    let query = "SELECT items.*, categories.name as categoryName FROM items LEFT JOIN categories ON items.categoryId = categories.id";
    const params = [];
    const conditions = [];
    if (options.search) {
      conditions.push("(items.name LIKE ? OR items.companyName LIKE ?)");
      params.push(`%${options.search}%`, `%${options.search}%`);
    }
    if (options.category && options.category !== "All") {
      conditions.push("categories.name = ?");
      params.push(options.category);
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY items.createdAt DESC";
    if (options.limit) {
      query += " LIMIT ?";
      params.push(options.limit);
    }
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-item", (_, id) => {
    return db.prepare("SELECT items.*, categories.name as categoryName FROM items LEFT JOIN categories ON items.categoryId = categories.id WHERE items.id = ?").get(id);
  });
  electron.ipcMain.handle("insert-item", (_, item) => {
    const stmt = db.prepare(`
      INSERT INTO items (
        name, categoryId, companyName, purchaseUnit, baseUnit, unitsPerPack,
        totalPackQuantity, totalBaseQuantity, packPurchasePrice, basePurchasePrice,
        baseSellingPrice, packSellingPrice, allowSellByBaseUnit, allowSellByPackUnit,
        expiryDate, qualityGrade, notes, isCredit, supplierPhone, supplierAccount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      item.name,
      item.categoryId || null,
      item.companyName,
      item.purchaseUnit,
      item.baseUnit,
      item.unitsPerPack || 1,
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
      item.supplierAccount
    );
    return result.lastInsertRowid;
  });
  electron.ipcMain.handle("update-item", (_, id, item) => {
    const stmt = db.prepare(`
      UPDATE items SET
        name = ?, categoryId = ?, companyName = ?, purchaseUnit = ?, baseUnit = ?, unitsPerPack = ?,
        totalPackQuantity = ?, totalBaseQuantity = ?, packPurchasePrice = ?, basePurchasePrice = ?,
        baseSellingPrice = ?, packSellingPrice = ?, allowSellByBaseUnit = ?, allowSellByPackUnit = ?,
        expiryDate = ?, qualityGrade = ?, notes = ?, isCredit = ?, supplierPhone = ?, supplierAccount = ?
      WHERE id = ?
    `);
    return stmt.run(
      item.name,
      item.categoryId || null,
      item.companyName,
      item.purchaseUnit,
      item.baseUnit,
      item.unitsPerPack || 1,
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
      item.supplierAccount,
      id
    );
  });
  electron.ipcMain.handle("delete-item", (_, id) => {
    const transaction = db.transaction(() => {
      db.prepare("DELETE FROM item_packs WHERE itemId = ?").run(id);
      db.prepare("DELETE FROM adjustments WHERE itemId = ?").run(id);
      db.prepare("DELETE FROM sales WHERE itemId = ?").run(id);
      db.prepare("DELETE FROM items WHERE id = ?").run(id);
    });
    transaction();
    return { success: true };
  });
  electron.ipcMain.handle("get-low-stock-items", () => {
    return db.prepare("SELECT * FROM items WHERE totalBaseQuantity < 10 ORDER BY totalBaseQuantity ASC").all();
  });
  electron.ipcMain.handle("get-expiring-items", () => {
    const thirtyDaysFromNow = /* @__PURE__ */ new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return db.prepare("SELECT * FROM items WHERE expiryDate IS NOT NULL AND expiryDate <= ? ORDER BY expiryDate ASC").all(thirtyDaysFromNow.toISOString().split("T")[0]);
  });
  electron.ipcMain.handle("get-sales", (_, options = {}) => {
    let query = "SELECT sales.*, items.name as itemName, items.basePurchasePrice, items.unitsPerPack FROM sales LEFT JOIN items ON sales.itemId = items.id";
    const params = [];
    const conditions = [];
    if (options.search) {
      conditions.push("(items.name LIKE ? OR sales.customerName LIKE ?)");
      params.push(`%${options.search}%`, `%${options.search}%`);
    }
    if (options.paymentStatus) {
      conditions.push("sales.paymentStatus = ?");
      params.push(options.paymentStatus);
    }
    if (options.startDate && options.endDate) {
      conditions.push("DATE(sales.createdAt) BETWEEN ? AND ?");
      params.push(options.startDate, options.endDate);
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY sales.createdAt DESC";
    if (options.limit) {
      query += " LIMIT ?";
      params.push(options.limit);
    }
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("get-sale", (_, id) => {
    return db.prepare("SELECT sales.*, items.name as itemName FROM sales LEFT JOIN items ON sales.itemId = items.id WHERE sales.id = ?").get(id);
  });
  electron.ipcMain.handle("insert-sale", (_, sale) => {
    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(sale.itemId);
    if (!item) throw new Error("Item not found");
    const stmt = db.prepare(`
      INSERT INTO sales (
        itemId, quantity, unit, unitType, discount, vat, totalPrice, 
        paymentMethod, paymentStatus, customerName, customerPhone, packId, dueDate, paidAmount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const transaction = db.transaction(() => {
      const result = stmt.run(
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
        sale.paidAmount || 0
      );
      let baseDeduction = sale.quantity;
      let packDeduction = 0;
      if (sale.unitType === "pack") {
        baseDeduction = sale.quantity * (item.unitsPerPack || 1);
        packDeduction = sale.quantity;
      } else {
        packDeduction = sale.quantity / (item.unitsPerPack || 1);
      }
      db.prepare(`
        UPDATE items 
        SET totalBaseQuantity = totalBaseQuantity - ?,
            totalPackQuantity = totalPackQuantity - ?
        WHERE id = ?
      `).run(baseDeduction, packDeduction, sale.itemId);
      return result.lastInsertRowid;
    });
    return transaction();
  });
  electron.ipcMain.handle("update-sale", (_, id, sale) => {
    return db.prepare(`
      UPDATE sales SET
        quantity = ?, unit = ?, unitType = ?, discount = ?, vat = ?, totalPrice = ?,
        paymentMethod = ?, paymentStatus = ?, customerName = ?, customerPhone = ?,
        dueDate = ?, paidAmount = ?
      WHERE id = ?
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
      id
    );
  });
  electron.ipcMain.handle("delete-sale", (_, id) => {
    const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(id);
    if (!sale) return { success: false };
    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(sale.itemId);
    const transaction = db.transaction(() => {
      if (item) {
        let baseRestore = sale.quantity;
        let packRestore = 0;
        if (sale.unitType === "pack") {
          baseRestore = sale.quantity * (item.unitsPerPack || 1);
          packRestore = sale.quantity;
        } else {
          packRestore = sale.quantity / (item.unitsPerPack || 1);
        }
        db.prepare(`
          UPDATE items 
          SET totalBaseQuantity = totalBaseQuantity + ?,
              totalPackQuantity = totalPackQuantity + ?
          WHERE id = ?
        `).run(baseRestore, packRestore, sale.itemId);
      }
      db.prepare("DELETE FROM sales WHERE id = ?").run(id);
    });
    transaction();
    return { success: true };
  });
  electron.ipcMain.handle("get-debt-sales", () => {
    return db.prepare("SELECT sales.*, items.name as itemName FROM sales LEFT JOIN items ON sales.itemId = items.id WHERE sales.paymentStatus = ? ORDER BY sales.dueDate ASC").all("Debt");
  });
  electron.ipcMain.handle("pay-debt", (_, saleId, amount) => {
    const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(saleId);
    if (!sale) throw new Error("Sale not found");
    const newPaid = (sale.paidAmount || 0) + amount;
    const newStatus = newPaid >= sale.totalPrice ? "Paid" : "Debt";
    return db.prepare("UPDATE sales SET paidAmount = ?, paymentStatus = ? WHERE id = ?").run(newPaid, newStatus, saleId);
  });
  electron.ipcMain.handle("get-expenses", (_, options = {}) => {
    let query = "SELECT * FROM expenses";
    const params = [];
    const conditions = [];
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
    if (options.limit) {
      query += " LIMIT ?";
      params.push(options.limit);
    }
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("insert-expense", (_, expense) => {
    return db.prepare("INSERT INTO expenses (name, amount, category, date, isRecurring, frequency, nextBillingDate) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      expense.name,
      expense.amount,
      expense.category,
      expense.date,
      expense.isRecurring ? 1 : 0,
      expense.frequency,
      expense.nextBillingDate
    ).lastInsertRowid;
  });
  electron.ipcMain.handle("update-expense", (_, id, expense) => {
    return db.prepare("UPDATE expenses SET name = ?, amount = ?, category = ?, date = ?, isRecurring = ?, frequency = ?, nextBillingDate = ? WHERE id = ?").run(
      expense.name,
      expense.amount,
      expense.category,
      expense.date,
      expense.isRecurring ? 1 : 0,
      expense.frequency,
      expense.nextBillingDate,
      id
    );
  });
  electron.ipcMain.handle("delete-expense", (_, id) => {
    return db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("get-adjustments", (_, options = {}) => {
    let query = "SELECT adjustments.*, items.name as itemName FROM adjustments LEFT JOIN items ON adjustments.itemId = items.id";
    const params = [];
    if (options.itemId) {
      query += " WHERE adjustments.itemId = ?";
      params.push(options.itemId);
    }
    query += " ORDER BY adjustments.createdAt DESC";
    if (options.limit) {
      query += " LIMIT ?";
      params.push(options.limit);
    }
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("insert-adjustment", (_, adjustment) => {
    const transaction = db.transaction(() => {
      const result = db.prepare("INSERT INTO adjustments (itemId, type, oldValue, newValue, quantity, unitType, reason, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
        adjustment.itemId,
        adjustment.type,
        adjustment.oldValue,
        adjustment.newValue,
        adjustment.quantity,
        adjustment.unitType,
        adjustment.reason,
        adjustment.date
      );
      if (adjustment.type === "damage" && adjustment.quantity) {
        db.prepare("UPDATE items SET totalBaseQuantity = totalBaseQuantity - ? WHERE id = ?").run(adjustment.quantity, adjustment.itemId);
      }
      if (adjustment.type === "price_increase" || adjustment.type === "price_decrease") {
        if (adjustment.unitType === "base") {
          db.prepare("UPDATE items SET baseSellingPrice = ? WHERE id = ?").run(adjustment.newValue, adjustment.itemId);
        } else {
          db.prepare("UPDATE items SET packSellingPrice = ? WHERE id = ?").run(adjustment.newValue, adjustment.itemId);
        }
      }
      return result.lastInsertRowid;
    });
    return transaction();
  });
  electron.ipcMain.handle("get-notifications", (_, options = {}) => {
    let query = "SELECT * FROM notifications ORDER BY createdAt DESC";
    const params = [];
    if (options.unreadOnly) {
      query = "SELECT * FROM notifications WHERE isRead = 0 ORDER BY createdAt DESC";
    }
    if (options.limit) {
      query += " LIMIT ?";
      params.push(options.limit);
    }
    return db.prepare(query).all(...params);
  });
  electron.ipcMain.handle("insert-notification", (_, notification) => {
    return db.prepare("INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)").run(
      notification.title,
      notification.message,
      notification.type || "info"
    ).lastInsertRowid;
  });
  electron.ipcMain.handle("mark-notification-read", (_, id) => {
    return db.prepare("UPDATE notifications SET isRead = 1 WHERE id = ?").run(id);
  });
  electron.ipcMain.handle("clear-notifications", () => {
    return db.prepare("DELETE FROM notifications").run();
  });
  electron.ipcMain.handle("get-setting", (_, key) => {
    const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
    return row ? JSON.parse(row.value) : null;
  });
  electron.ipcMain.handle("set-setting", (_, key, value) => {
    return db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, JSON.stringify(value));
  });
  electron.ipcMain.handle("get-dashboard-stats", (_, dateRange) => {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 864e5).toISOString().split("T")[0];
    const todayRevenue = db.prepare("SELECT COALESCE(SUM(totalPrice), 0) as total FROM sales WHERE DATE(createdAt) = ?").get(today);
    const yesterdayRevenue = db.prepare("SELECT COALESCE(SUM(totalPrice), 0) as total FROM sales WHERE DATE(createdAt) = ?").get(yesterday);
    const todaySales = db.prepare("SELECT COUNT(*) as count FROM sales WHERE DATE(createdAt) = ?").get(today);
    const yesterdaySales = db.prepare("SELECT COUNT(*) as count FROM sales WHERE DATE(createdAt) = ?").get(yesterday);
    const todayExpenses = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ?").get(today);
    const yesterdayExpenses = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ?").get(yesterday);
    const activeDebts = db.prepare("SELECT COALESCE(SUM(totalPrice - paidAmount), 0) as total FROM sales WHERE paymentStatus = 'Debt'").get();
    const totalItems = db.prepare("SELECT COUNT(*) as count FROM items").get();
    const lowStock = db.prepare("SELECT COUNT(*) as count FROM items WHERE totalBaseQuantity < 10").get();
    const todayProfit = db.prepare(`
      SELECT COALESCE(SUM(s.totalPrice - (s.quantity * i.basePurchasePrice)), 0) as profit 
      FROM sales s LEFT JOIN items i ON s.itemId = i.id 
      WHERE DATE(s.createdAt) = ?
    `).get(today);
    const yesterdayProfit = db.prepare(`
      SELECT COALESCE(SUM(s.totalPrice - (s.quantity * i.basePurchasePrice)), 0) as profit 
      FROM sales s LEFT JOIN items i ON s.itemId = i.id 
      WHERE DATE(s.createdAt) = ?
    `).get(yesterday);
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
  electron.ipcMain.handle("get-recent-activity", (_, limit = 10) => {
    const sales = db.prepare(`
      SELECT 'sale' as type, s.id, s.totalPrice as amount, s.createdAt as date, i.name as description, s.customerName as extra
      FROM sales s LEFT JOIN items i ON s.itemId = i.id
      ORDER BY s.createdAt DESC LIMIT ?
    `).all(limit);
    const expenses = db.prepare(`
      SELECT 'expense' as type, id, amount, date, name as description, category as extra
      FROM expenses ORDER BY date DESC LIMIT ?
    `).all(limit);
    const adjustments = db.prepare(`
      SELECT 'adjustment' as type, a.id, a.newValue as amount, a.date, i.name as description, a.type as extra
      FROM adjustments a LEFT JOIN items i ON a.itemId = i.id
      ORDER BY a.createdAt DESC LIMIT ?
    `).all(limit);
    const all = [...sales, ...expenses, ...adjustments];
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return all.slice(0, limit);
  });
  electron.ipcMain.handle("get-analytics", (_, period) => {
    const now = /* @__PURE__ */ new Date();
    let startDate;
    if (period === "week") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split("T")[0];
    } else if (period === "month") {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      startDate = d.toISOString().split("T")[0];
    } else {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      startDate = d.toISOString().split("T")[0];
    }
    const salesData = db.prepare(`
      SELECT DATE(createdAt) as date, COALESCE(SUM(totalPrice), 0) as revenue, COALESCE(SUM(quantity), 0) as units
      FROM sales WHERE DATE(createdAt) >= ? GROUP BY DATE(createdAt) ORDER BY date
    `).all(startDate);
    const expenseData = db.prepare(`
      SELECT date, COALESCE(SUM(amount), 0) as amount
      FROM expenses WHERE date >= ? GROUP BY date ORDER BY date
    `).all(startDate);
    const topItems = db.prepare(`
      SELECT i.name, SUM(s.quantity) as totalQty, SUM(s.totalPrice) as totalRevenue
      FROM sales s LEFT JOIN items i ON s.itemId = i.id
      WHERE DATE(s.createdAt) >= ? GROUP BY s.itemId ORDER BY totalQty DESC LIMIT 5
    `).all(startDate);
    const categoryBreakdown = db.prepare(`
      SELECT c.name, COUNT(s.id) as saleCount, SUM(s.totalPrice) as revenue
      FROM sales s LEFT JOIN items i ON s.itemId = i.id LEFT JOIN categories c ON i.categoryId = c.id
      WHERE DATE(s.createdAt) >= ? GROUP BY c.id ORDER BY revenue DESC
    `).all(startDate);
    return { salesData, expenseData, topItems, categoryBreakdown };
  });
  electron.ipcMain.handle("get-customers", () => {
    return db.prepare(`
      SELECT customerName, customerPhone, COUNT(*) as transactionCount,
        SUM(totalPrice) as totalDebt, SUM(paidAmount) as totalPaid,
        SUM(totalPrice - paidAmount) as outstanding
      FROM sales 
      WHERE paymentStatus = 'Debt' AND customerName IS NOT NULL AND customerName != ''
      GROUP BY customerName, customerPhone
      ORDER BY outstanding DESC
    `).all();
  });
  electron.ipcMain.handle("get-customer-sales", (_, customerName) => {
    return db.prepare(`
      SELECT sales.*, items.name as itemName 
      FROM sales LEFT JOIN items ON sales.itemId = items.id 
      WHERE sales.customerName = ? AND sales.paymentStatus = 'Debt'
      ORDER BY sales.createdAt DESC
    `).all(customerName);
  });
  electron.ipcMain.handle("export-data", () => {
    const tables = ["categories", "items", "item_packs", "sales", "expenses", "adjustments", "settings"];
    const data = {};
    for (const table of tables) {
      data[table] = db.prepare(`SELECT * FROM ${table}`).all();
    }
    return data;
  });
  electron.ipcMain.handle("reset-data", () => {
    const transaction = db.transaction(() => {
      db.prepare("DELETE FROM adjustments").run();
      db.prepare("DELETE FROM sales").run();
      db.prepare("DELETE FROM expenses").run();
      db.prepare("DELETE FROM item_packs").run();
      db.prepare("DELETE FROM items").run();
      db.prepare("DELETE FROM categories WHERE isCustom = 1").run();
      db.prepare("DELETE FROM notifications").run();
    });
    transaction();
    return { success: true };
  });
}
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
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
}
electron.app.whenReady().then(() => {
  initDB();
  registerIPCHandlers();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
