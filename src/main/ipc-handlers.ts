import { ipcMain } from 'electron';
import db from './database';

export function registerIPCHandlers() {
  // ========== CATEGORIES ==========
  ipcMain.handle('get-categories', () => {
    return db.prepare('SELECT * FROM categories ORDER BY name').all();
  });

  ipcMain.handle('insert-category', (_, name: string, icon?: string) => {
    return db.prepare('INSERT INTO categories (name, icon, isCustom) VALUES (?, ?, 1)').run(name, icon || 'tag').lastInsertRowid;
  });

  ipcMain.handle('delete-category', (_, id: number) => {
    return db.prepare('DELETE FROM categories WHERE id = ? AND isCustom = 1').run(id);
  });

  // ========== ITEMS ==========
  ipcMain.handle('get-items', (_, options: any = {}) => {
    let query = 'SELECT items.*, categories.name as categoryName FROM items LEFT JOIN categories ON items.categoryId = categories.id';
    const params: any[] = [];
    const conditions: string[] = [];

    if (options.search) {
      conditions.push('(items.name LIKE ? OR items.companyName LIKE ?)');
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    if (options.category && options.category !== 'All') {
      conditions.push('categories.name = ?');
      params.push(options.category);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY items.createdAt DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-item', (_, id: number) => {
    return db.prepare('SELECT items.*, categories.name as categoryName FROM items LEFT JOIN categories ON items.categoryId = categories.id WHERE items.id = ?').get(id);
  });

  ipcMain.handle('insert-item', (_, item: any) => {
    const stmt = db.prepare(`
      INSERT INTO items (
        name, categoryId, companyName, purchaseUnit, baseUnit, unitsPerPack,
        totalPackQuantity, totalBaseQuantity, packPurchasePrice, basePurchasePrice,
        baseSellingPrice, packSellingPrice, allowSellByBaseUnit, allowSellByPackUnit,
        expiryDate, qualityGrade, notes, isCredit, supplierPhone, supplierAccount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      item.name, item.categoryId || null, item.companyName, item.purchaseUnit, item.baseUnit, item.unitsPerPack || 1,
      item.totalPackQuantity || 0, item.totalBaseQuantity || 0, item.packPurchasePrice || 0, item.basePurchasePrice || 0,
      item.baseSellingPrice || 0, item.packSellingPrice || 0, item.allowSellByBaseUnit ? 1 : 0, item.allowSellByPackUnit ? 1 : 0,
      item.expiryDate || null, item.qualityGrade, item.notes, item.isCredit ? 1 : 0, item.supplierPhone, item.supplierAccount
    );

    return result.lastInsertRowid;
  });

  ipcMain.handle('update-item', (_, id: number, item: any) => {
    const stmt = db.prepare(`
      UPDATE items SET
        name = ?, categoryId = ?, companyName = ?, purchaseUnit = ?, baseUnit = ?, unitsPerPack = ?,
        totalPackQuantity = ?, totalBaseQuantity = ?, packPurchasePrice = ?, basePurchasePrice = ?,
        baseSellingPrice = ?, packSellingPrice = ?, allowSellByBaseUnit = ?, allowSellByPackUnit = ?,
        expiryDate = ?, qualityGrade = ?, notes = ?, isCredit = ?, supplierPhone = ?, supplierAccount = ?
      WHERE id = ?
    `);

    return stmt.run(
      item.name, item.categoryId || null, item.companyName, item.purchaseUnit, item.baseUnit, item.unitsPerPack || 1,
      item.totalPackQuantity || 0, item.totalBaseQuantity || 0, item.packPurchasePrice || 0, item.basePurchasePrice || 0,
      item.baseSellingPrice || 0, item.packSellingPrice || 0, item.allowSellByBaseUnit ? 1 : 0, item.allowSellByPackUnit ? 1 : 0,
      item.expiryDate || null, item.qualityGrade, item.notes, item.isCredit ? 1 : 0, item.supplierPhone, item.supplierAccount,
      id
    );
  });

  ipcMain.handle('delete-item', (_, id: number) => {
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM item_packs WHERE itemId = ?').run(id);
      db.prepare('DELETE FROM adjustments WHERE itemId = ?').run(id);
      db.prepare('DELETE FROM sales WHERE itemId = ?').run(id);
      db.prepare('DELETE FROM items WHERE id = ?').run(id);
    });
    transaction();
    return { success: true };
  });

  ipcMain.handle('get-low-stock-items', () => {
    return db.prepare('SELECT * FROM items WHERE totalBaseQuantity < 10 ORDER BY totalBaseQuantity ASC').all();
  });

  ipcMain.handle('get-expiring-items', () => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return db.prepare('SELECT * FROM items WHERE expiryDate IS NOT NULL AND expiryDate <= ? ORDER BY expiryDate ASC').all(thirtyDaysFromNow.toISOString().split('T')[0]);
  });

  // ========== SALES ==========
  ipcMain.handle('get-sales', (_, options: any = {}) => {
    let query = 'SELECT sales.*, items.name as itemName, items.basePurchasePrice, items.unitsPerPack FROM sales LEFT JOIN items ON sales.itemId = items.id';
    const params: any[] = [];
    const conditions: string[] = [];

    if (options.search) {
      conditions.push('(items.name LIKE ? OR sales.customerName LIKE ?)');
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    if (options.paymentStatus) {
      conditions.push('sales.paymentStatus = ?');
      params.push(options.paymentStatus);
    }

    if (options.startDate && options.endDate) {
      conditions.push('DATE(sales.createdAt) BETWEEN ? AND ?');
      params.push(options.startDate, options.endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY sales.createdAt DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-sale', (_, id: number) => {
    return db.prepare('SELECT sales.*, items.name as itemName FROM sales LEFT JOIN items ON sales.itemId = items.id WHERE sales.id = ?').get(id);
  });

  ipcMain.handle('insert-sale', (_, sale: any) => {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(sale.itemId) as any;
    if (!item) throw new Error('Item not found');

    const stmt = db.prepare(`
      INSERT INTO sales (
        itemId, quantity, unit, unitType, discount, vat, totalPrice, 
        paymentMethod, paymentStatus, customerName, customerPhone, packId, dueDate, paidAmount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const transaction = db.transaction(() => {
      const result = stmt.run(
        sale.itemId, sale.quantity, sale.unit, sale.unitType, sale.discount || 0, sale.vat || 0, sale.totalPrice,
        sale.paymentMethod, sale.paymentStatus, sale.customerName, sale.customerPhone, sale.packId || null, 
        sale.dueDate || null, sale.paidAmount || 0
      );

      // Update stock
      let baseDeduction = sale.quantity;
      let packDeduction = 0;

      if (sale.unitType === 'pack') {
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

  ipcMain.handle('update-sale', (_, id: number, sale: any) => {
    return db.prepare(`
      UPDATE sales SET
        quantity = ?, unit = ?, unitType = ?, discount = ?, vat = ?, totalPrice = ?,
        paymentMethod = ?, paymentStatus = ?, customerName = ?, customerPhone = ?,
        dueDate = ?, paidAmount = ?
      WHERE id = ?
    `).run(
      sale.quantity, sale.unit, sale.unitType, sale.discount, sale.vat, sale.totalPrice,
      sale.paymentMethod, sale.paymentStatus, sale.customerName, sale.customerPhone,
      sale.dueDate, sale.paidAmount, id
    );
  });

  ipcMain.handle('delete-sale', (_, id: number) => {
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id) as any;
    if (!sale) return { success: false };

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(sale.itemId) as any;

    const transaction = db.transaction(() => {
      // Restore stock
      if (item) {
        let baseRestore = sale.quantity;
        let packRestore = 0;

        if (sale.unitType === 'pack') {
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

      db.prepare('DELETE FROM sales WHERE id = ?').run(id);
    });

    transaction();
    return { success: true };
  });

  ipcMain.handle('get-debt-sales', () => {
    return db.prepare('SELECT sales.*, items.name as itemName FROM sales LEFT JOIN items ON sales.itemId = items.id WHERE sales.paymentStatus = ? ORDER BY sales.dueDate ASC').all('Debt');
  });

  ipcMain.handle('pay-debt', (_, saleId: number, amount: number) => {
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId) as any;
    if (!sale) throw new Error('Sale not found');
    
    const newPaid = (sale.paidAmount || 0) + amount;
    const newStatus = newPaid >= sale.totalPrice ? 'Paid' : 'Debt';
    
    return db.prepare('UPDATE sales SET paidAmount = ?, paymentStatus = ? WHERE id = ?').run(newPaid, newStatus, saleId);
  });

  // ========== EXPENSES ==========
  ipcMain.handle('get-expenses', (_, options: any = {}) => {
    let query = 'SELECT * FROM expenses';
    const params: any[] = [];
    const conditions: string[] = [];

    if (options.category) {
      conditions.push('category = ?');
      params.push(options.category);
    }

    if (options.startDate && options.endDate) {
      conditions.push('date BETWEEN ? AND ?');
      params.push(options.startDate, options.endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY date DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    return db.prepare(query).all(...params);
  });

  ipcMain.handle('insert-expense', (_, expense: any) => {
    return db.prepare('INSERT INTO expenses (name, amount, category, date, isRecurring, frequency, nextBillingDate) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      expense.name, expense.amount, expense.category, expense.date, expense.isRecurring ? 1 : 0, expense.frequency, expense.nextBillingDate
    ).lastInsertRowid;
  });

  ipcMain.handle('update-expense', (_, id: number, expense: any) => {
    return db.prepare('UPDATE expenses SET name = ?, amount = ?, category = ?, date = ?, isRecurring = ?, frequency = ?, nextBillingDate = ? WHERE id = ?').run(
      expense.name, expense.amount, expense.category, expense.date, expense.isRecurring ? 1 : 0, expense.frequency, expense.nextBillingDate, id
    );
  });

  ipcMain.handle('delete-expense', (_, id: number) => {
    return db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  });

  // ========== ADJUSTMENTS ==========
  ipcMain.handle('get-adjustments', (_, options: any = {}) => {
    let query = 'SELECT adjustments.*, items.name as itemName FROM adjustments LEFT JOIN items ON adjustments.itemId = items.id';
    const params: any[] = [];

    if (options.itemId) {
      query += ' WHERE adjustments.itemId = ?';
      params.push(options.itemId);
    }

    query += ' ORDER BY adjustments.createdAt DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    return db.prepare(query).all(...params);
  });

  ipcMain.handle('insert-adjustment', (_, adjustment: any) => {
    const transaction = db.transaction(() => {
      const result = db.prepare('INSERT INTO adjustments (itemId, type, oldValue, newValue, quantity, unitType, reason, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        adjustment.itemId, adjustment.type, adjustment.oldValue, adjustment.newValue, adjustment.quantity, adjustment.unitType, adjustment.reason, adjustment.date
      );

      // Apply stock changes for damage/adjustment types
      if (adjustment.type === 'damage' && adjustment.quantity) {
        db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity - ? WHERE id = ?').run(adjustment.quantity, adjustment.itemId);
      }
      if (adjustment.type === 'price_increase' || adjustment.type === 'price_decrease') {
        if (adjustment.unitType === 'base') {
          db.prepare('UPDATE items SET baseSellingPrice = ? WHERE id = ?').run(adjustment.newValue, adjustment.itemId);
        } else {
          db.prepare('UPDATE items SET packSellingPrice = ? WHERE id = ?').run(adjustment.newValue, adjustment.itemId);
        }
      }

      return result.lastInsertRowid;
    });

    return transaction();
  });

  // ========== NOTIFICATIONS ==========
  ipcMain.handle('get-notifications', (_, options: any = {}) => {
    let query = 'SELECT * FROM notifications ORDER BY createdAt DESC';
    const params: any[] = [];
    if (options.unreadOnly) {
      query = 'SELECT * FROM notifications WHERE isRead = 0 ORDER BY createdAt DESC';
    }
    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('insert-notification', (_, notification: any) => {
    return db.prepare('INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)').run(
      notification.title, notification.message, notification.type || 'info'
    ).lastInsertRowid;
  });

  ipcMain.handle('mark-notification-read', (_, id: number) => {
    return db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ?').run(id);
  });

  ipcMain.handle('clear-notifications', () => {
    return db.prepare('DELETE FROM notifications').run();
  });

  // ========== SETTINGS ==========
  ipcMain.handle('get-setting', (_, key: string) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
    return row ? JSON.parse(row.value) : null;
  });

  ipcMain.handle('set-setting', (_, key: string, value: any) => {
    return db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
  });

  // ========== ANALYTICS / DASHBOARD ==========
  ipcMain.handle('get-dashboard-stats', (_, dateRange?: { start: string; end: string }) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const todayRevenue = db.prepare("SELECT COALESCE(SUM(totalPrice), 0) as total FROM sales WHERE DATE(createdAt) = ?").get(today) as any;
    const yesterdayRevenue = db.prepare("SELECT COALESCE(SUM(totalPrice), 0) as total FROM sales WHERE DATE(createdAt) = ?").get(yesterday) as any;
    
    const todaySales = db.prepare("SELECT COUNT(*) as count FROM sales WHERE DATE(createdAt) = ?").get(today) as any;
    const yesterdaySales = db.prepare("SELECT COUNT(*) as count FROM sales WHERE DATE(createdAt) = ?").get(yesterday) as any;

    const todayExpenses = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ?").get(today) as any;
    const yesterdayExpenses = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ?").get(yesterday) as any;

    const activeDebts = db.prepare("SELECT COALESCE(SUM(totalPrice - paidAmount), 0) as total FROM sales WHERE paymentStatus = 'Debt'").get() as any;
    const totalItems = db.prepare("SELECT COUNT(*) as count FROM items").get() as any;
    const lowStock = db.prepare("SELECT COUNT(*) as count FROM items WHERE totalBaseQuantity < 10").get() as any;

    // Cost of goods sold for profit calculation
    const todayProfit = db.prepare(`
      SELECT COALESCE(SUM(s.totalPrice - (s.quantity * i.basePurchasePrice)), 0) as profit 
      FROM sales s LEFT JOIN items i ON s.itemId = i.id 
      WHERE DATE(s.createdAt) = ?
    `).get(today) as any;

    const yesterdayProfit = db.prepare(`
      SELECT COALESCE(SUM(s.totalPrice - (s.quantity * i.basePurchasePrice)), 0) as profit 
      FROM sales s LEFT JOIN items i ON s.itemId = i.id 
      WHERE DATE(s.createdAt) = ?
    `).get(yesterday) as any;

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

  ipcMain.handle('get-recent-activity', (_, limit: number = 10) => {
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

    const all = [...sales, ...expenses, ...adjustments] as any[];
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return all.slice(0, limit);
  });

  ipcMain.handle('get-analytics', (_, period: 'week' | 'month' | 'year') => {
    const now = new Date();
    let startDate: string;
    let groupFormat: string;

    if (period === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split('T')[0];
      groupFormat = '%Y-%m-%d';
    } else if (period === 'month') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      startDate = d.toISOString().split('T')[0];
      groupFormat = '%Y-%m-%d';
    } else {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      startDate = d.toISOString().split('T')[0];
      groupFormat = '%Y-%m';
    }

    const salesData = db.prepare(`
      SELECT DATE(createdAt) as date, COALESCE(SUM(totalPrice), 0) as revenue, COALESCE(SUM(quantity), 0) as units
      FROM sales WHERE DATE(createdAt) >= ? GROUP BY DATE(createdAt) ORDER BY date
    `).all(startDate);

    const expenseData = db.prepare(`
      SELECT date, COALESCE(SUM(amount), 0) as amount
      FROM expenses WHERE date >= ? GROUP BY date ORDER BY date
    `).all(startDate);

    // Top selling items
    const topItems = db.prepare(`
      SELECT i.name, SUM(s.quantity) as totalQty, SUM(s.totalPrice) as totalRevenue
      FROM sales s LEFT JOIN items i ON s.itemId = i.id
      WHERE DATE(s.createdAt) >= ? GROUP BY s.itemId ORDER BY totalQty DESC LIMIT 5
    `).all(startDate);

    // Category breakdown
    const categoryBreakdown = db.prepare(`
      SELECT c.name, COUNT(s.id) as saleCount, SUM(s.totalPrice) as revenue
      FROM sales s LEFT JOIN items i ON s.itemId = i.id LEFT JOIN categories c ON i.categoryId = c.id
      WHERE DATE(s.createdAt) >= ? GROUP BY c.id ORDER BY revenue DESC
    `).all(startDate);

    return { salesData, expenseData, topItems, categoryBreakdown };
  });

  ipcMain.handle('get-customers', () => {
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

  ipcMain.handle('get-customer-sales', (_, customerName: string) => {
    return db.prepare(`
      SELECT sales.*, items.name as itemName 
      FROM sales LEFT JOIN items ON sales.itemId = items.id 
      WHERE sales.customerName = ? AND sales.paymentStatus = 'Debt'
      ORDER BY sales.createdAt DESC
    `).all(customerName);
  });

  // ========== DATA MANAGEMENT ==========
  ipcMain.handle('export-data', () => {
    const tables = ['categories', 'items', 'item_packs', 'sales', 'expenses', 'adjustments', 'settings'];
    const data: Record<string, any> = {};
    for (const table of tables) {
      data[table] = db.prepare(`SELECT * FROM ${table}`).all();
    }
    return data;
  });

  ipcMain.handle('reset-data', () => {
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM adjustments').run();
      db.prepare('DELETE FROM sales').run();
      db.prepare('DELETE FROM expenses').run();
      db.prepare('DELETE FROM item_packs').run();
      db.prepare('DELETE FROM items').run();
      db.prepare('DELETE FROM categories WHERE isCustom = 1').run();
      db.prepare('DELETE FROM notifications').run();
    });
    transaction();
    return { success: true };
  });
}
