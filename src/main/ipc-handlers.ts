import { ipcMain, BrowserWindow, shell } from 'electron';
import db from './database';
import crypto from 'crypto';
import { statSync, copyFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'fs';
import path from 'path';
import { app } from 'electron';


let activeBusinessId: number | null = null;
let currentUserName: string | null = null;
let currentUserPermissions: string[] = [];

function requirePermission(perm: string) {
  if (!currentUserPermissions.includes(perm) && !currentUserPermissions.includes('*')) {
    throw new Error(`Permission denied: ${perm}`);
  }
}

function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(pin, salt, 64).toString('hex');
  return `${salt}:${key}`;
}

function verifyPin(pin: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) {
    // legacy SHA-256 fallback
    const legacy = crypto.createHash('sha256').update(pin).digest('hex');
    return legacy === stored;
  }
  const [salt, key] = parts;
  const check = crypto.scryptSync(pin, salt, 64).toString('hex');
  return check === key;
}

function getActiveBusinessId() {
  if (activeBusinessId) return activeBusinessId;
  const row = db.prepare("SELECT value FROM settings WHERE key = 'active_business_id'").get() as any;
  if (row) {
    activeBusinessId = parseInt(row.value);
    return activeBusinessId;
  }
  const defaultBiz = db.prepare("SELECT id FROM businesses WHERE isDefault = 1 LIMIT 1").get() as any;
  activeBusinessId = defaultBiz?.id || 1;
  return activeBusinessId;
}

const DEFAULT_LIST_LIMIT = 200;

function getDefaultWarehouseId(): number {
  const wh = db.prepare('SELECT id FROM warehouses WHERE isActive = 1 ORDER BY id LIMIT 1').get() as any;
  if (wh) return wh.id;
  const anyWh = db.prepare('SELECT id FROM warehouses LIMIT 1').get() as any;
  if (anyWh) return anyWh.id;
  const bizId = getActiveBusinessId();
  const res = db.prepare('INSERT INTO warehouses (businessId, name, location, managerName) VALUES (?, ?, ?, ?)').run(bizId, 'Main Warehouse', 'Headquarters', 'Operations Manager');
  return res.lastInsertRowid as number;
}

function validatePositive(v: any, label: string): number {
  const n = Number(v);
  if (isNaN(n) || n <= 0) throw new Error(`${label} must be a positive number`);
  return n;
}

function validateNonNegative(v: any, label: string): number {
  const n = Number(v);
  if (isNaN(n) || n < 0) throw new Error(`${label} must be a non-negative number`);
  return n;
}

function logActivity(action: string, entityType?: string, entityId?: number, details?: string) {
  try {
    db.prepare('INSERT INTO activity_logs (employeeId, action, entityType, entityId, details) VALUES (?, ?, ?, ?, ?)')
      .run(null, action, entityType || null, entityId || null, details ? `${details} — by ${currentUserName || 'unknown'}` : `by ${currentUserName || 'unknown'}`);
  } catch (e) {
    console.error(`[ActivityLog] Failed to log ${action}:`, e);
  }
  try {
    const bizId = getActiveBusinessId();
    if (bizId) {
      db.prepare('INSERT INTO audit_logs (businessId, action, entityType, entityId, fieldName, oldValue, newValue, changedBy, changedById, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(bizId, action, entityType || null, entityId || null, null, null, null, currentUserName || 'unknown', null, details || `${action} on ${entityType || 'unknown'}`);
    }
  } catch (e) {
    console.error(`[AuditLog] Failed to log ${action}:`, e);
  }
}

function insertAuditLog(action: string, entityType: string, entityId: number | null, fieldName: string | null, oldValue: string | null, newValue: string | null, description: string | null) {
  try {
    db.prepare('INSERT INTO audit_logs (businessId, action, entityType, entityId, fieldName, oldValue, newValue, changedBy, changedById, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(getActiveBusinessId(), action, entityType, entityId, fieldName, oldValue, newValue, currentUserName || 'unknown', null, description);
  } catch (e) {
    console.error(`[AuditLog] Failed to log ${action}:`, e);
  }
}

export function registerIPCHandlers() {
  // ========== BUSINESSES ==========
  ipcMain.handle('get-active-business', () => {
    const id = getActiveBusinessId();
    return db.prepare('SELECT * FROM businesses WHERE id = ?').get(id);
  });

  ipcMain.handle('update-business', (_, id: number, biz: any) => {
    const stmt = db.prepare('UPDATE businesses SET businessName = ?, storeName = ?, logo = ?, address = ?, phone = ?, email = ?, currency = ? WHERE id = ?');
    return stmt.run(biz.businessName, biz.storeName, biz.logo, biz.address, biz.phone, biz.email, biz.currency, id);
  });

  // ========== CATEGORIES ==========
  ipcMain.handle('get-categories', () => {
    const bizId = getActiveBusinessId();
    return db.prepare('SELECT * FROM categories WHERE businessId = ? AND isCustom = 1 ORDER BY name').all(bizId);
  });

  ipcMain.handle('insert-category', (_, name: string, icon?: string) => {
    const bizId = getActiveBusinessId();
    const result = db.prepare('INSERT INTO categories (businessId, name, icon, isCustom) VALUES (?, ?, ?, 1)').run(bizId, name, icon || 'tag');
    logActivity('insert', 'category', result.lastInsertRowid as number, `Created category "${name}"`);
    return result.lastInsertRowid;
  });

  ipcMain.handle('delete-category', (_, id: number) => {
    const bizId = getActiveBusinessId();
    const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(id) as any;
    db.prepare('DELETE FROM categories WHERE id = ? AND businessId = ? AND isCustom = 1').run(id, bizId);
    logActivity('delete', 'category', id, `Deleted category "${cat?.name || 'unknown'}"`);
  });

  // ========== ITEMS ==========
  ipcMain.handle('get-items', (_, options: any = {}) => {
    const bizId = getActiveBusinessId();
    let query = 'SELECT items.*, categories.name as categoryName, suppliers.supplierName FROM items LEFT JOIN categories ON items.categoryId = categories.id LEFT JOIN suppliers ON items.supplierId = suppliers.id';
    const params: any[] = [];
    const conditions: string[] = ['items.businessId = ?', "items.is_deleted = 0"];
    params.push(bizId);

    if (options.search) {
      conditions.push('(items.name LIKE ? OR items.companyName LIKE ?)');
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    if (options.category && options.category !== 'All') {
      conditions.push('categories.name = ?');
      params.push(options.category);
    }

    if (options.supplierId) {
      conditions.push('items.supplierId = ?');
      params.push(options.supplierId);
    }

    if (options.startDate && options.endDate) {
      if (options.startDate === options.endDate) {
        conditions.push('items.createdAt >= ? AND items.createdAt < ?');
        params.push(options.startDate, options.startDate + 'T23:59:59.999Z');
      } else {
        conditions.push('items.createdAt >= ? AND items.createdAt <= ?');
        params.push(options.startDate, options.endDate + 'T23:59:59.999Z');
      }
    } else if (options.startDate) {
      conditions.push('items.createdAt >= ?');
      params.push(options.startDate);
    } else if (options.endDate) {
      conditions.push('items.createdAt <= ?');
      params.push(options.endDate + 'T23:59:59.999Z');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY items.createdAt DESC';

    const listLimit = options.limit ?? DEFAULT_LIST_LIMIT;
    query += ' LIMIT ?';
    params.push(listLimit);

    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-item', (_, id: number) => {
    const bizId = getActiveBusinessId();
    const item = db.prepare(`
      SELECT items.*, categories.name as categoryName, suppliers.supplierName
      FROM items
      LEFT JOIN categories ON items.categoryId = categories.id
      LEFT JOIN suppliers ON items.supplierId = suppliers.id
      WHERE items.id = ? AND items.businessId = ? AND items.is_deleted = 0
    `).get(id, bizId) as any;
    if (!item) return null;
    const totalPurchased = db.prepare(`
      SELECT COALESCE(SUM(spi.quantity), 0) AS totalPurchasedQuantity
      FROM supplier_purchase_items spi
      JOIN supplier_purchases sp ON sp.id = spi.purchaseId
      WHERE spi.itemId = ?
    `).get(id) as any;
    const lastPO = db.prepare(`
      SELECT sp.purchaseNumber AS lastPurchaseOrderRef, sp.purchaseDate AS lastPurchaseOrderDate
      FROM supplier_purchase_items spi
      JOIN supplier_purchases sp ON sp.id = spi.purchaseId
      WHERE spi.itemId = ?
      ORDER BY sp.purchaseDate DESC
      LIMIT 1
    `).get(id) as any;
    return { ...item, ...totalPurchased, ...lastPO };
  });

  ipcMain.handle('insert-item', (_, item: any) => {
    if (!item.name || !item.name.trim()) throw new Error('Product name is required');
    const unitsPerPack = validatePositive(item.unitsPerPack ?? 1, 'Units per pack');
    const bizId = getActiveBusinessId();
    const stmt = db.prepare(`
      INSERT INTO items (
        businessId, name, categoryId, companyName, purchaseUnit, baseUnit, unitsPerPack,
        totalPackQuantity, totalBaseQuantity, packPurchasePrice, basePurchasePrice,
        baseSellingPrice, packSellingPrice, allowSellByBaseUnit, allowSellByPackUnit,
        expiryDate, qualityGrade, notes, isCredit, supplierPhone, supplierId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const newBaseQty = item.totalBaseQuantity || 0;
    const newPackQty = item.totalPackQuantity || 0;

    const result = stmt.run(
      bizId, item.name, item.categoryId || null, item.companyName, item.purchaseUnit, item.baseUnit, unitsPerPack,
      newPackQty, newBaseQty, item.packPurchasePrice || 0, item.basePurchasePrice || 0,
      item.baseSellingPrice || 0, item.packSellingPrice || 0, item.allowSellByBaseUnit ? 1 : 0, item.allowSellByPackUnit ? 1 : 0,
      item.expiryDate || null, item.qualityGrade, item.notes, item.isCredit ? 1 : 0, item.supplierPhone,
      item.supplierId || null
    );

    const newId = result.lastInsertRowid as number;

    // Auto-create supplier purchase record when item has a supplier and quantity
    if (item.supplierId && newBaseQty > 0) {
      try {
        const purchaseNumber = `PO-${Date.now().toString().slice(-8)}`;
        const unitPrice = item.basePurchasePrice || item.baseSellingPrice || 0;
        const totalAmount = unitPrice * newBaseQty;
        const paidAmount = item.isCredit ? 0 : totalAmount;
        const status = item.isCredit ? 'pending' : 'received';
        db.prepare(`
          INSERT INTO supplier_purchases (
            businessId, supplierId, purchaseNumber, purchaseDate,
            totalAmount, paidAmount, dueDate, status, notes, createdBy
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          bizId, item.supplierId, purchaseNumber, new Date().toISOString().split('T')[0],
          totalAmount, paidAmount, item.expiryDate || null, status,
          `Auto-created from inventory item "${item.name}"`, currentUserName || 'system'
        );
        const purchaseId = db.prepare('SELECT last_insert_rowid() AS id').get() as any;
        db.prepare(`
          INSERT INTO supplier_purchase_items (purchaseId, itemId, itemName, sku, quantity, unit, unitPrice, totalPrice)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(purchaseId.id, newId, item.name, item.sku || null, newBaseQty, item.baseUnit || 'pcs', unitPrice, totalAmount);
        logSupplierActivity(item.supplierId, 'purchase_created', 'supplier_purchase', purchaseId.id,
          `Auto purchase ${purchaseNumber} for ${item.name}`);
      } catch (e) {
        console.error('Auto-create supplier purchase failed:', e);
      }
    }

    logActivity('insert', 'item', newId, `Added product "${item.name}"`);
    return newId;
  });

  ipcMain.handle('update-item', (_, id: number, item: any) => {
    if (!item.name || !item.name.trim()) throw new Error('Product name is required');
    const unitsPerPack = validatePositive(item.unitsPerPack ?? 1, 'Units per pack');
    const bizId = getActiveBusinessId();
    const stmt = db.prepare(`
      UPDATE items SET
        name = ?, categoryId = ?, companyName = ?, purchaseUnit = ?, baseUnit = ?, unitsPerPack = ?,
        totalPackQuantity = ?, totalBaseQuantity = ?, packPurchasePrice = ?, basePurchasePrice = ?,
        baseSellingPrice = ?, packSellingPrice = ?, allowSellByBaseUnit = ?, allowSellByPackUnit = ?,
        expiryDate = ?, qualityGrade = ?, notes = ?, isCredit = ?, supplierPhone = ?,
        supplierId = ?
      WHERE id = ? AND businessId = ?
    `);

    const result = stmt.run(
      item.name, item.categoryId || null, item.companyName, item.purchaseUnit, item.baseUnit, unitsPerPack,
      item.totalPackQuantity || 0, item.totalBaseQuantity || 0, item.packPurchasePrice || 0, item.basePurchasePrice || 0,
      item.baseSellingPrice || 0, item.packSellingPrice || 0, item.allowSellByBaseUnit ? 1 : 0, item.allowSellByPackUnit ? 1 : 0,
      item.expiryDate || null, item.qualityGrade, item.notes, item.isCredit ? 1 : 0, item.supplierPhone,
      item.supplierId || null,
      id, bizId
    );

    // Auto-create supplier purchase when item has a supplier with quantity and no linked purchase exists
    if (item.supplierId) {
      const existingPurchase = db.prepare(`
        SELECT 1 FROM supplier_purchase_items spi
        JOIN supplier_purchases sp ON sp.id = spi.purchaseId
        WHERE spi.itemId = ? AND sp.supplierId = ? AND sp.status != 'cancelled'
        LIMIT 1
      `).get(id, item.supplierId) as any;
      if (!existingPurchase) {
        const newBaseQty = item.totalBaseQuantity || 0;
        if (newBaseQty > 0) {
          try {
            const purchaseNumber = `PO-${Date.now().toString().slice(-8)}`;
            const unitPrice = item.basePurchasePrice || item.baseSellingPrice || 0;
            const totalAmount = unitPrice * newBaseQty;
            const paidAmount = item.isCredit ? 0 : totalAmount;
            const status = item.isCredit ? 'pending' : 'received';
            db.prepare(`
              INSERT INTO supplier_purchases (
                businessId, supplierId, purchaseNumber, purchaseDate,
                totalAmount, paidAmount, dueDate, status, notes, createdBy
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              bizId, item.supplierId, purchaseNumber, new Date().toISOString().split('T')[0],
              totalAmount, paidAmount, item.expiryDate || null, status,
              `Auto-created from inventory item "${item.name}"`, currentUserName || 'system'
            );
            const purchaseId = db.prepare('SELECT last_insert_rowid() AS id').get() as any;
            db.prepare(`
              INSERT INTO supplier_purchase_items (purchaseId, itemId, itemName, sku, quantity, unit, unitPrice, totalPrice)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(purchaseId.id, id, item.name, item.sku || null, newBaseQty, item.baseUnit || 'pcs', unitPrice, totalAmount);
            logSupplierActivity(item.supplierId, 'purchase_created', 'supplier_purchase', purchaseId.id,
              `Auto purchase ${purchaseNumber} for ${item.name}`);
          } catch (e) {
            console.error('Auto-create supplier purchase failed (update):', e);
          }
        }
      }
    }

    logActivity('update', 'item', id, `Edited product "${item.name}"`);
    return result;
  });

  ipcMain.handle('delete-item', (_, id: number) => {
    const item = db.prepare('SELECT name FROM items WHERE id = ?').get(id) as any;
    db.prepare('UPDATE items SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(currentUserName || 'unknown', id);
    logActivity('delete', 'item', id, `Deleted product "${item?.name || 'unknown'}"`);
    return { success: true };
  });

  ipcMain.handle('get-low-stock-items', () => {
    const bizId = getActiveBusinessId();
    return db.prepare('SELECT items.*, suppliers.supplierName, suppliers.id as linkedSupplierId FROM items LEFT JOIN suppliers ON items.supplierId = suppliers.id WHERE items.totalBaseQuantity < 10 AND items.businessId = ? ORDER BY items.totalBaseQuantity ASC LIMIT ?').all(bizId, DEFAULT_LIST_LIMIT);
  });

  ipcMain.handle('get-expiring-items', () => {
    const bizId = getActiveBusinessId();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return db.prepare('SELECT items.*, suppliers.supplierName, suppliers.id as linkedSupplierId FROM items LEFT JOIN suppliers ON items.supplierId = suppliers.id WHERE items.expiryDate IS NOT NULL AND items.expiryDate <= ? AND items.businessId = ? ORDER BY items.expiryDate ASC LIMIT ?').all(thirtyDaysFromNow.toISOString().split('T')[0], bizId, DEFAULT_LIST_LIMIT);
  });

  ipcMain.handle('get-items-by-supplier', (_, supplierId: number) => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT items.*, categories.name as categoryName, suppliers.supplierName
      FROM items
      LEFT JOIN categories ON items.categoryId = categories.id
      LEFT JOIN suppliers ON items.supplierId = suppliers.id
      WHERE items.supplierId = ? AND items.businessId = ? AND items.is_deleted = 0
      ORDER BY items.name ASC
    `).all(supplierId, bizId);
  });

  ipcMain.handle('restock-item', (_, id: number, quantity: number) => {
    const bizId = getActiveBusinessId();
    const item = db.prepare('SELECT name, unitsPerPack FROM items WHERE id = ? AND businessId = ?').get(id, bizId) as any;
    if (!item) throw new Error('Item not found');
    const qty = validatePositive(quantity, 'Restock quantity');
    const packQty = qty / (item.unitsPerPack || 1);
    const result = db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, totalPackQuantity = totalPackQuantity + ? WHERE id = ?').run(qty, packQty, id);
    const defWhId = getDefaultWarehouseId();
    const whRow = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, id) as any;
    if (whRow) {
      db.prepare('UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(qty, whRow.id);
    } else {
      db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(defWhId, id, qty);
    }
    db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)').run(defWhId, id, 'restock_in', qty, 'restock', `Restocked ${qty} ${item.name}`);
    logActivity('restock', 'item', id, `Restocked "${item.name}": +${qty} units`);
    return { success: true };
  });

  // ========== SALES ==========
  ipcMain.handle('get-sales', (_, options: any = {}) => {
    const bizId = getActiveBusinessId();
    let query = 'SELECT sales.*, items.name as itemName, items.basePurchasePrice, items.unitsPerPack, categories.name as categoryName FROM sales LEFT JOIN items ON sales.itemId = items.id LEFT JOIN categories ON items.categoryId = categories.id';
    const params: any[] = [];
    const conditions: string[] = ['sales.businessId = ?'];
    params.push(bizId);

    if (options.search) {
      conditions.push('(items.name LIKE ? OR sales.customerName LIKE ?)');
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    if (options.paymentStatus) {
      conditions.push('sales.paymentStatus = ?');
      params.push(options.paymentStatus);
    }

    if (options.category && options.category !== 'All') {
      conditions.push('categories.name = ?');
      params.push(options.category);
    }

    if (options.startDate && options.endDate) {
      if (options.startDate === options.endDate) {
        conditions.push('sales.createdAt >= ? AND sales.createdAt < ?');
        params.push(options.startDate, options.startDate + 'T23:59:59.999Z');
      } else {
        conditions.push('sales.createdAt >= ? AND sales.createdAt <= ?');
        params.push(options.startDate, options.endDate + 'T23:59:59.999Z');
      }
    } else if (options.startDate) {
      conditions.push('sales.createdAt >= ?');
      params.push(options.startDate);
    } else if (options.endDate) {
      conditions.push('sales.createdAt <= ?');
      params.push(options.endDate + 'T23:59:59.999Z');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY sales.createdAt DESC';

    const listLimit = options.limit ?? DEFAULT_LIST_LIMIT;
    query += ' LIMIT ?';
    params.push(listLimit);

    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-sale', (_, id: number) => {
    return db.prepare('SELECT sales.*, items.name as itemName FROM sales LEFT JOIN items ON sales.itemId = items.id WHERE sales.id = ?').get(id);
  });

  ipcMain.handle('insert-sales-batch', (_, sales: any[]) => {
    const bizId = getActiveBusinessId();
    const transaction = db.transaction(() => {
      const results: any[] = [];
      for (const sale of sales) {
        const item = db.prepare('SELECT * FROM items WHERE id = ?').get(sale.itemId) as any;
        if (!item) throw new Error(`Item ${sale.itemId} not found`);
        const qty = validatePositive(sale.quantity, 'Sale quantity');
        sale.quantity = qty;

        const stmt = db.prepare(`
          INSERT INTO sales (
            businessId, itemId, quantity, unit, unitType, discount, vat, totalPrice, 
            paymentMethod, paymentStatus, customerName, customerPhone, packId, dueDate, paidAmount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
          bizId, sale.itemId, sale.quantity, sale.unit, sale.unitType, sale.discount || 0, sale.vat || 0, sale.totalPrice,
          sale.paymentMethod, sale.paymentStatus, sale.customerName, sale.customerPhone, sale.packId || null, 
          sale.dueDate || null, sale.paidAmount || 0
        );

        // Auto-create customer if debt sale with a new name
        const cName = sale.customerName?.trim();
        if (cName && sale.paymentStatus === 'Debt') {
          const exists = db.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(cName, bizId);
          if (!exists) {
            db.prepare(`INSERT INTO customers (businessId, customerName, phone, groupName) VALUES (?, ?, ?, ?)`).run(bizId, cName, sale.customerPhone?.trim() || '', 'general');
          }
        }

        // Update stock
        let baseDeduction = sale.quantity;
        let packDeduction = 0;

        if (sale.unitType === 'pack') {
          baseDeduction = sale.quantity * (item.unitsPerPack || 1);
          packDeduction = sale.quantity;
        } else {
          packDeduction = sale.quantity / (item.unitsPerPack || 1);
        }

        if (item.totalBaseQuantity < baseDeduction) {
          throw new Error(`Insufficient stock: ${item.name} has ${item.totalBaseQuantity} ${item.baseUnit}, need ${baseDeduction}`);
        }

        db.prepare(`
          UPDATE items 
          SET totalBaseQuantity = totalBaseQuantity - ?,
              totalPackQuantity = totalPackQuantity - ?
          WHERE id = ?
        `).run(baseDeduction, packDeduction, sale.itemId);

        // Sync default warehouse inventory
        const defWhId = getDefaultWarehouseId();
        const whRow = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, sale.itemId) as any;
        if (whRow) {
          if (whRow.quantity < baseDeduction) {
            throw new Error(`Insufficient stock at warehouse: ${item.name} has ${whRow.quantity}, need ${baseDeduction}`);
          }
          db.prepare('UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(baseDeduction, whRow.id);
        } else {
          db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(defWhId, sale.itemId, -baseDeduction);
        }
        db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)')
          .run(defWhId, sale.itemId, 'sale_out', baseDeduction, 'sale', `Sale batch #${result.lastInsertRowid}`);

        results.push(result.lastInsertRowid);
      }
      return results;
    });

    return transaction();
  });

  ipcMain.handle('insert-sale', (_, sale: any) => {
    const bizId = getActiveBusinessId();
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(sale.itemId) as any;
    if (!item) throw new Error(`Item ${sale.itemId} not found`);
    const qty = validatePositive(sale.quantity, 'Sale quantity');
    sale.quantity = qty;

    const transaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO sales (
          businessId, itemId, quantity, unit, unitType, discount, vat, totalPrice, 
          paymentMethod, paymentStatus, customerName, customerPhone, packId, dueDate, paidAmount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        bizId, sale.itemId, sale.quantity, sale.unit, sale.unitType, sale.discount || 0, sale.vat || 0, sale.totalPrice,
        sale.paymentMethod, sale.paymentStatus, sale.customerName, sale.customerPhone, sale.packId || null, 
        sale.dueDate || null, sale.paidAmount || 0
      );

      // Auto-create customer if debt sale with a new name
      const cName = sale.customerName?.trim();
      if (cName && sale.paymentStatus === 'Debt') {
        const exists = db.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(cName, bizId);
        if (!exists) {
          db.prepare(`INSERT INTO customers (businessId, customerName, phone, groupName) VALUES (?, ?, ?, ?)`).run(bizId, cName, sale.customerPhone?.trim() || '', 'general');
        }
      }

      // Update stock
      let baseDeduction = sale.quantity;
      let packDeduction = 0;

      if (sale.unitType === 'pack') {
        baseDeduction = sale.quantity * (item.unitsPerPack || 1);
        packDeduction = sale.quantity;
      } else {
        packDeduction = sale.quantity / (item.unitsPerPack || 1);
      }

      if (item.totalBaseQuantity < baseDeduction) {
        throw new Error(`Insufficient stock: ${item.name} has ${item.totalBaseQuantity} ${item.baseUnit}, need ${baseDeduction}`);
      }

      db.prepare(`
          UPDATE items 
          SET totalBaseQuantity = totalBaseQuantity - ?,
              totalPackQuantity = totalPackQuantity - ?
          WHERE id = ?
        `).run(baseDeduction, packDeduction, sale.itemId);

      // Sync default warehouse inventory
      const defWhId = getDefaultWarehouseId();
      const whRow = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, sale.itemId) as any;
      if (whRow) {
        if (whRow.quantity < baseDeduction) {
          throw new Error(`Insufficient stock at warehouse: ${item.name} has ${whRow.quantity}, need ${baseDeduction}`);
        }
        db.prepare('UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(baseDeduction, whRow.id);
      } else {
        db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(defWhId, sale.itemId, -baseDeduction);
      }
      db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)')
        .run(defWhId, sale.itemId, 'sale_out', baseDeduction, 'sale', `Sale #${result.lastInsertRowid}`);

      const saleId = result.lastInsertRowid;
      logActivity('insert', 'sale', saleId as number, `Sale recorded: ${sale.customerName || 'walk-in'} — ${sale.quantity} ${sale.unit} of ${item.name} — ETB ${sale.totalPrice}`);
      return saleId;
    });

    return transaction();
  });

  ipcMain.handle('update-sale', (_, id: number, sale: any) => {
    const bizId = getActiveBusinessId();
    const original = db.prepare('SELECT * FROM sales WHERE id = ? AND businessId = ?').get(id, bizId) as any;
    if (!original) throw new Error('Sale not found');

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(sale.itemId || original.itemId) as any;
    if (!item) throw new Error('Item not found');

    const transaction = db.transaction(() => {
      // Adjust stock if quantity changed
      const qtyDiff = (sale.quantity || original.quantity) - original.quantity;
      if (qtyDiff !== 0) {
        let baseDiff = Math.abs(qtyDiff);
        let packDiff = 0;
        const unitType = sale.unitType || original.unitType;

        if (unitType === 'pack') {
          baseDiff = Math.abs(qtyDiff) * (item.unitsPerPack || 1);
          packDiff = Math.abs(qtyDiff);
        } else {
          packDiff = Math.abs(qtyDiff) / (item.unitsPerPack || 1);
        }

        if (qtyDiff > 0) {
          // Increasing quantity — deduct additional stock
          if (item.totalBaseQuantity < baseDiff) {
            throw new Error(`Insufficient stock: ${item.name} has ${item.totalBaseQuantity}, need additional ${baseDiff}`);
          }
          db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity - ?, totalPackQuantity = totalPackQuantity - ? WHERE id = ?')
            .run(baseDiff, packDiff, sale.itemId || original.itemId);
          const defWhId = getDefaultWarehouseId();
          const whRow = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, sale.itemId || original.itemId) as any;
          if (whRow) {
            if (whRow.quantity < baseDiff) throw new Error(`Insufficient stock at warehouse`);
            db.prepare('UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(baseDiff, whRow.id);
          }
        } else {
          // Decreasing quantity — restore stock
          db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, totalPackQuantity = totalPackQuantity + ? WHERE id = ?')
            .run(baseDiff, packDiff, sale.itemId || original.itemId);
          const defWhId = getDefaultWarehouseId();
          const whRow = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, sale.itemId || original.itemId) as any;
          if (whRow) {
            db.prepare('UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(baseDiff, whRow.id);
          } else {
            db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(defWhId, sale.itemId || original.itemId, baseDiff);
          }
        }
      }

      db.prepare(`
        UPDATE sales SET
          quantity = ?, unit = ?, unitType = ?, discount = ?, vat = ?, totalPrice = ?,
          paymentMethod = ?, paymentStatus = ?, customerName = ?, customerPhone = ?,
          dueDate = ?, paidAmount = ?
        WHERE id = ? AND businessId = ?
      `).run(
        sale.quantity, sale.unit, sale.unitType, sale.discount, sale.vat, sale.totalPrice,
        sale.paymentMethod, sale.paymentStatus, sale.customerName, sale.customerPhone,
        sale.dueDate, sale.paidAmount, id, bizId
      );
    });

    transaction();
    return { success: true };
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

        // Restore default warehouse inventory
        const defWhId = getDefaultWarehouseId();
        const whRow = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, sale.itemId) as any;
        if (whRow) {
          db.prepare('UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(baseRestore, whRow.id);
        } else {
          db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(defWhId, sale.itemId, baseRestore);
        }
        db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)')
          .run(defWhId, sale.itemId, 'sale_restore', baseRestore, 'sale', `Sale #${id} deleted — stock restored`);
      }

      // Delete related returns first
      db.prepare('DELETE FROM returns WHERE saleId = ?').run(id);

      db.prepare('DELETE FROM sales WHERE id = ?').run(id);
    });

    transaction();
    logActivity('delete', 'sale', id, `Deleted sale #${id} — ${sale.customerName || 'walk-in'} — ETB ${sale.totalPrice}`);
    return { success: true };
  });

  ipcMain.handle('create-return', (_, data: any) => {
    const bizId = getActiveBusinessId();
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(data.saleId) as any;
    if (!sale) return { success: false, error: 'Sale not found' };
    if (sale.businessId !== bizId) return { success: false, error: 'Unauthorized' };

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(sale.itemId) as any;
    if (!item) return { success: false, error: 'Item not found' };

    const returnQty = validatePositive(data.quantity, 'Return quantity');
    if (returnQty > sale.quantity) return { success: false, error: 'Return quantity exceeds original sale quantity' };

    const transaction = db.transaction(() => {
      // Restore stock
      let baseRestore = returnQty;
      let packRestore = 0;
      if (sale.unitType === 'pack') {
        baseRestore = returnQty * (item.unitsPerPack || 1);
        packRestore = returnQty;
      } else {
        packRestore = returnQty / (item.unitsPerPack || 1);
      }

      db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, totalPackQuantity = totalPackQuantity + ? WHERE id = ?')
        .run(baseRestore, packRestore, sale.itemId);

      const defWhId = getDefaultWarehouseId();
      const whRow = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, sale.itemId) as any;
      if (whRow) {
        db.prepare('UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(baseRestore, whRow.id);
      } else {
        db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(defWhId, sale.itemId, baseRestore);
      }

      db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)')
        .run(defWhId, sale.itemId, 'return_in', baseRestore, 'return', `Return for sale #${sale.id}`);

      // Insert return record
      const result = db.prepare(`
        INSERT INTO returns (businessId, saleId, itemId, quantity, unit, unitType, refundAmount, reason, createdBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(bizId, sale.id, sale.itemId, returnQty, sale.unit, sale.unitType, data.refundAmount || 0, data.reason || '', data.createdBy || null);

      // Update original sale: reduce quantity and adjust financials
      const priceReduction = returnQty * (sale.totalPrice / sale.quantity);
      const paidReduction = Math.min(sale.paidAmount || 0, data.refundAmount || 0);

      db.prepare(`
        UPDATE sales SET quantity = quantity - ?, totalPrice = totalPrice - ?,
          paidAmount = MAX(0, paidAmount - ?),
          paymentStatus = CASE WHEN quantity - ? <= 0 THEN 'Returned' WHEN paidAmount >= totalPrice THEN 'Paid' ELSE 'Debt' END
        WHERE id = ?
      `).run(returnQty, priceReduction, paidReduction, returnQty, sale.id);

      logActivity('create', 'return', result.lastInsertRowid as number, `Return processed: ${returnQty} of ${item.name} from sale #${sale.id} — refund ETB ${data.refundAmount || 0}`);
      return { success: true, returnId: result.lastInsertRowid };
    });

    return transaction();
  });

  ipcMain.handle('get-returns', (_e, options?: any) => {
    const bizId = getActiveBusinessId();
    let query = `
      SELECT r.*, s.customerName, s.itemName, i.name as itemName2
      FROM returns r
      LEFT JOIN sales s ON r.saleId = s.id
      LEFT JOIN items i ON r.itemId = i.id
      WHERE r.businessId = ?
    `;
    const params: any[] = [bizId];

    if (options?.startDate) { query += ` AND r.createdAt >= ?`; params.push(options.startDate); }
    if (options?.endDate) { query += ` AND r.createdAt <= ?`; params.push(options.endDate); }

    query += ` ORDER BY r.createdAt DESC LIMIT ${DEFAULT_LIST_LIMIT}`;
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-debt-sales', () => {
    const bizId = getActiveBusinessId();
    return db.prepare('SELECT sales.*, items.name as itemName FROM sales LEFT JOIN items ON sales.itemId = items.id WHERE sales.paymentStatus = ? AND sales.businessId = ? ORDER BY sales.dueDate ASC LIMIT ?').all('Debt', bizId, DEFAULT_LIST_LIMIT);
  });

  ipcMain.handle('pay-debt', (_, saleId: number, amount: number, options?: { type?: string; note?: string }) => {
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId) as any;
    if (!sale) throw new Error('Sale not found');
    
    const recordType = options?.type || 'payment';
    const newPaid = (sale.paidAmount || 0) + amount;
    const newStatus = newPaid >= sale.totalPrice ? 'Paid' : 'Debt';
    
    const result = db.prepare('UPDATE sales SET paidAmount = ?, paymentStatus = ? WHERE id = ?').run(newPaid, newStatus, saleId);
    
    db.prepare('INSERT INTO debt_payments (saleId, customerName, customerPhone, amount, type, note) VALUES (?, ?, ?, ?, ?, ?)')
      .run(saleId, sale.customerName || null, sale.customerPhone || null, amount, recordType, options?.note || null);
    
    const activityType = recordType === 'loss' ? 'Marked as loss' : 'Payment received';
    logActivity('update', 'sale', saleId, `${activityType} on sale #${saleId}: ETB ${amount} (${newStatus})`);
    return result;
  });

  ipcMain.handle('get-debt-payments', (_, saleId: number) => {
    return db.prepare('SELECT * FROM debt_payments WHERE saleId = ? ORDER BY createdAt DESC').all(saleId);
  });

  // ========== EXPENSES ==========
  ipcMain.handle('get-expenses', (_, options: any = {}) => {
    const bizId = getActiveBusinessId();
    let query = 'SELECT * FROM expenses';
    const params: any[] = [];
    const conditions: string[] = ['businessId = ?'];
    params.push(bizId);

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

    const listLimit = options.limit ?? DEFAULT_LIST_LIMIT;
    query += ' LIMIT ?';
    params.push(listLimit);

    return db.prepare(query).all(...params);
  });

  ipcMain.handle('insert-expense', (_, expense: any) => {
    const bizId = getActiveBusinessId();
    const result = db.prepare('INSERT INTO expenses (businessId, name, amount, category, date, isRecurring, frequency, nextBillingDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      bizId, expense.name, expense.amount, expense.category, expense.date, expense.isRecurring ? 1 : 0, expense.frequency, expense.nextBillingDate
    );
    logActivity('insert', 'expense', result.lastInsertRowid as number, `Added expense "${expense.name}" — ETB ${expense.amount} (${expense.category})`);
    return result.lastInsertRowid;
  });

  ipcMain.handle('update-expense', (_, id: number, expense: any) => {
    const result = db.prepare('UPDATE expenses SET name = ?, amount = ?, category = ?, date = ?, isRecurring = ?, frequency = ?, nextBillingDate = ? WHERE id = ?').run(
      expense.name, expense.amount, expense.category, expense.date, expense.isRecurring ? 1 : 0, expense.frequency, expense.nextBillingDate, id
    );
    logActivity('update', 'expense', id, `Updated expense "${expense.name}" — ETB ${expense.amount} (${expense.category})`);
    return result;
  });

  ipcMain.handle('delete-expense', (_, id: number) => {
    const exp = db.prepare('SELECT name FROM expenses WHERE id = ?').get(id) as any;
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    logActivity('delete', 'expense', id, `Deleted expense "${exp?.name || 'unknown'}"`);
  });

  // ========== ADJUSTMENTS ==========
  ipcMain.handle('get-adjustments', (_, options: any = {}) => {
    const bizId = getActiveBusinessId();
    let query = 'SELECT adjustments.*, items.name as itemName FROM adjustments LEFT JOIN items ON adjustments.itemId = items.id';
    const params: any[] = [];
    const conditions: string[] = ['adjustments.businessId = ?'];
    params.push(bizId);

    if (options.itemId) {
      conditions.push('adjustments.itemId = ?');
      params.push(options.itemId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY adjustments.createdAt DESC';

    const listLimit = options.limit ?? DEFAULT_LIST_LIMIT;
    query += ' LIMIT ?';
    params.push(listLimit);

    return db.prepare(query).all(...params);
  });

  ipcMain.handle('insert-adjustment', (_, adjustment: any) => {
    const validTypes = ['damage', 'loss', 'add_stock', 'price_increase', 'price_decrease'];
    if (!validTypes.includes(adjustment.type)) throw new Error(`Invalid adjustment type: ${adjustment.type}`);
    if (['damage', 'loss', 'add_stock'].includes(adjustment.type)) {
      validatePositive(adjustment.quantity, 'Adjustment quantity');
      const item = db.prepare('SELECT totalBaseQuantity FROM items WHERE id = ?').get(adjustment.itemId) as any;
      if (['damage', 'loss'].includes(adjustment.type) && item && item.totalBaseQuantity < adjustment.quantity) {
        throw new Error(`Insufficient stock: item has ${item.totalBaseQuantity}, adjustment is ${adjustment.quantity}`);
      }
    }
    const bizId = getActiveBusinessId();
    const transaction = db.transaction(() => {
      const result = db.prepare('INSERT INTO adjustments (businessId, itemId, type, oldValue, newValue, quantity, unitType, reason, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        bizId, adjustment.itemId, adjustment.type, adjustment.oldValue, adjustment.newValue, adjustment.quantity, adjustment.unitType, adjustment.reason, adjustment.date
      );

      // Apply stock changes for damage/loss/add_stock types
      let invDelta = 0;
      if (adjustment.type === 'damage' && adjustment.quantity) {
        db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity - ? WHERE id = ?').run(adjustment.quantity, adjustment.itemId);
        invDelta = -adjustment.quantity;
      }
      if (adjustment.type === 'loss' && adjustment.quantity) {
        db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity - ? WHERE id = ?').run(adjustment.quantity, adjustment.itemId);
        invDelta = -adjustment.quantity;
      }
      if (adjustment.type === 'add_stock' && adjustment.quantity) {
        db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity + ? WHERE id = ?').run(adjustment.quantity, adjustment.itemId);
        invDelta = adjustment.quantity;
      }
      if (invDelta !== 0) {
        const defWhId = getDefaultWarehouseId();
        const whRow = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, adjustment.itemId) as any;
        if (whRow) {
          db.prepare('UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(invDelta, whRow.id);
        } else if (invDelta > 0) {
          db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(defWhId, adjustment.itemId, invDelta);
        }
        db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)')
          .run(defWhId, adjustment.itemId, `adj_${adjustment.type}`, Math.abs(invDelta), 'adjustment', adjustment.reason || null);
      }
      if (adjustment.type === 'price_increase' || adjustment.type === 'price_decrease') {
        if (adjustment.unitType === 'base') {
          db.prepare('UPDATE items SET baseSellingPrice = ? WHERE id = ?').run(adjustment.newValue, adjustment.itemId);
        } else {
          db.prepare('UPDATE items SET packSellingPrice = ? WHERE id = ?').run(adjustment.newValue, adjustment.itemId);
        }
      }

      const adjustmentId = result.lastInsertRowid;
      const item = db.prepare('SELECT name FROM items WHERE id = ?').get(adjustment.itemId) as any;
      const typeLabel = adjustment.type.replace('_', ' ');
      logActivity('insert', 'adjustment', adjustmentId as number, `${typeLabel} on "${item?.name || 'unknown'}" — ${adjustment.quantity ? `qty: ${adjustment.quantity}` : `price → ${adjustment.newValue}`} (${adjustment.reason || 'no reason'})`);
      return adjustmentId;
    });

    return transaction();
  });

  // ========== NOTIFICATIONS ==========
  ipcMain.handle('check-notifications', () => {
    const bizId = getActiveBusinessId();
    const today = new Date().toISOString().split('T')[0];
    const notifications: { title: string; message: string; type: string; group: string; actionUrl?: string; actionLabel?: string; entityType?: string; entityId?: number; channels?: string; requiresAction?: boolean }[] = [];

    // Load notification preferences
    const prefRow = db.prepare("SELECT value FROM settings WHERE key = 'notification_preferences'").get() as any;
    const prefs = prefRow ? JSON.parse(prefRow.value) : {
      inventory_alerts: true,
      debt_alerts: true,
      expiry_alerts: true,
      sales_alerts: true
    };

    // 1. Overdue debts
    if (prefs.debt_alerts) {
      const overdueDebts = db.prepare(`
        SELECT sales.*, items.name as itemName 
        FROM sales LEFT JOIN items ON sales.itemId = items.id 
        WHERE sales.paymentStatus = 'Debt' AND sales.dueDate < ? AND sales.businessId = ?
      `).all(today, bizId) as any[];
      
      if (overdueDebts.length > 0) {
        const totalOverdue = overdueDebts.reduce((s: number, d: any) => s + (d.totalPrice - d.paidAmount), 0);
        notifications.push({
          title: `${overdueDebts.length} Overdue Debt${overdueDebts.length > 1 ? 's' : ''}`,
          message: `ETB ${totalOverdue.toLocaleString()} in overdue payments. Oldest from ${overdueDebts[overdueDebts.length - 1]?.customerName || 'Unknown'}.`,
          type: 'warning',
          group: 'debt_alerts'
        });
      }

      // Debts due today
      const dueToday = db.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(totalPrice - paidAmount), 0) as total
        FROM sales WHERE paymentStatus = 'Debt' AND dueDate = ? AND businessId = ?
      `).get(today, bizId) as any;
      
      if (dueToday.count > 0) {
        notifications.push({
          title: `${dueToday.count} Payment${dueToday.count > 1 ? 's' : ''} Due Today`,
          message: `ETB ${dueToday.total.toLocaleString()} in debt payments are due today.`,
          type: 'info',
          group: 'debt_alerts'
        });
      }
    }

    // 2. Low stock items (< 10 units)
    if (prefs.inventory_alerts) {
      const lowStockItems = db.prepare(
        'SELECT * FROM items WHERE totalBaseQuantity > 0 AND totalBaseQuantity < 10 AND businessId = ?'
      ).all(bizId) as any[];
      
      if (lowStockItems.length > 0) {
        notifications.push({
          title: `${lowStockItems.length} Low Stock Item${lowStockItems.length > 1 ? 's' : ''}`,
          message: `${lowStockItems.map((i: any) => i.name).slice(0, 3).join(', ')}${lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} more` : ''} running low.`,
          type: 'warning',
          group: 'inventory_alerts'
        });
      }

      // Out of stock
      const outOfStock = db.prepare(
        'SELECT COUNT(*) as count FROM items WHERE totalBaseQuantity <= 0 AND businessId = ?'
      ).get(bizId) as any;
      
      if (outOfStock.count > 0) {
        notifications.push({
          title: `${outOfStock.count} Out of Stock`,
          message: `${outOfStock.count} product${outOfStock.count > 1 ? 's are' : ' is'} completely out of stock. Reorder needed.`,
          type: 'error',
          group: 'inventory_alerts'
        });
      }
    }

    // 3. Expiring items (within 7 days)
    if (prefs.expiry_alerts) {
      const sevenDays = new Date();
      sevenDays.setDate(sevenDays.getDate() + 7);
      const expiringItems = db.prepare(
        'SELECT * FROM items WHERE expiryDate IS NOT NULL AND expiryDate <= ? AND expiryDate >= ? AND businessId = ?'
      ).all(sevenDays.toISOString().split('T')[0], today, bizId) as any[];
      
      if (expiringItems.length > 0) {
        notifications.push({
          title: `${expiringItems.length} Item${expiringItems.length > 1 ? 's' : ''} Expiring Soon`,
          message: `${expiringItems.map((i: any) => i.name).slice(0, 3).join(', ')} expiring within 7 days.`,
          type: 'warning',
          group: 'expiry_alerts'
        });
      }
    }

    // Insert only new notifications (deduplicate by title + type for today)
    const insertStmt = db.prepare(`
      INSERT INTO notifications (businessId, title, message, type, category, severity, actionUrl, actionLabel, entityType, entityId, channels, requiresAction)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const existsStmt = db.prepare(
      "SELECT COUNT(*) as count FROM notifications WHERE businessId = ? AND title = ? AND type = ? AND DATE(createdAt) = ?"
    );

    let newCount = 0;
    for (const n of notifications) {
      const exists = existsStmt.get(bizId, n.title, n.type, today) as any;
      if (exists.count === 0) {
        insertStmt.run(
          bizId, n.title, n.message, n.type,
          n.group || 'system',
          n.type || 'info',
          n.actionUrl || null,
          n.actionLabel || null,
          n.entityType || null,
          n.entityId || null,
          n.channels || 'in_app',
          n.requiresAction ? 1 : 0
        );
        newCount++;
        // Trigger OS notification for critical events when app is not focused
        try {
          if (n.type === 'error' || n.type === 'warning') {
            const { Notification: ElectronNotification } = require('electron');
            if (ElectronNotification.isSupported()) {
              new ElectronNotification({ title: n.title, body: n.message, urgency: n.type === 'error' ? 'critical' : 'normal' }).show();
            }
          }
        } catch (_) {}
      }
    }

    return {
      generated: newCount,
      total: notifications.length,
      bad: notifications.filter(n => n.type === 'warning' || n.type === 'error').length,
    };
  });

  ipcMain.handle('get-notifications', (_, options: any = {}) => {
    const bizId = getActiveBusinessId();
    let query = 'SELECT * FROM notifications WHERE businessId = ?';
    const params: any[] = [bizId];

    if (options.unreadOnly) query += ' AND isRead = 0';
    if (options.dismissedOnly) query += ' AND isDismissed = 1';
    if (!options.includeDismissed) query += ' AND isDismissed = 0';
    if (options.category) { query += ' AND category = ?'; params.push(options.category); }
    if (options.severity) { query += ' AND severity = ?'; params.push(options.severity); }
    if (options.search) {
      query += ' AND (title LIKE ? OR message LIKE ?)';
      const s = `%${options.search}%`;
      params.push(s, s);
    }
    // Hide snoozed until later
    query += ' AND (snoozedUntil IS NULL OR snoozedUntil <= CURRENT_TIMESTAMP)';
    // Hide expired
    query += ' AND (expiresAt IS NULL OR expiresAt > CURRENT_TIMESTAMP)';

    query += ' ORDER BY createdAt DESC';

    const listLimit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(listLimit, offset);
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-unread-notification-count', () => {
    const bizId = getActiveBusinessId();
    const row = db.prepare(`
      SELECT COUNT(*) AS c FROM notifications
      WHERE businessId = ? AND isRead = 0 AND isDismissed = 0
        AND (snoozedUntil IS NULL OR snoozedUntil <= CURRENT_TIMESTAMP)
        AND (expiresAt IS NULL OR expiresAt > CURRENT_TIMESTAMP)
    `).get(bizId) as any;
    return row?.c || 0;
  });

  ipcMain.handle('get-notification-categories', () => {
    const bizId = getActiveBusinessId();
    const rows = db.prepare(`
      SELECT category, COUNT(*) AS total, SUM(CASE WHEN isRead = 0 THEN 1 ELSE 0 END) AS unread
      FROM notifications WHERE businessId = ? AND isDismissed = 0
        AND (snoozedUntil IS NULL OR snoozedUntil <= CURRENT_TIMESTAMP)
        AND (expiresAt IS NULL OR expiresAt > CURRENT_TIMESTAMP)
      GROUP BY category
    `).all(bizId);
    return rows;
  });

  ipcMain.handle('insert-notification', (_, notification: any) => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      INSERT INTO notifications (
        businessId, title, message, type, category, severity,
        actionUrl, actionLabel, entityType, entityId, channels, requiresAction
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bizId,
      notification.title, notification.message,
      notification.type || 'info',
      notification.category || 'system',
      notification.severity || notification.type || 'info',
      notification.actionUrl || null,
      notification.actionLabel || null,
      notification.entityType || null,
      notification.entityId || null,
      notification.channels || 'in_app',
      notification.requiresAction ? 1 : 0
    ).lastInsertRowid;
  });

  ipcMain.handle('mark-notification-read', (_, id: number) => {
    return db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ?').run(id);
  });

  ipcMain.handle('mark-all-notifications-read', () => {
    const bizId = getActiveBusinessId();
    return db.prepare('UPDATE notifications SET isRead = 1 WHERE businessId = ?').run(bizId);
  });

  ipcMain.handle('dismiss-notification', (_, id: number) => {
    return db.prepare('UPDATE notifications SET isDismissed = 1, isRead = 1 WHERE id = ?').run(id);
  });

  ipcMain.handle('snooze-notification', (_, id: number, untilIso: string) => {
    return db.prepare('UPDATE notifications SET snoozedUntil = ? WHERE id = ?').run(untilIso, id);
  });

  ipcMain.handle('clear-notifications', (_, options: any = {}) => {
    const bizId = getActiveBusinessId();
    if (options.olderThanDays) {
      return db.prepare(`DELETE FROM notifications WHERE businessId = ? AND createdAt < datetime('now', '-' || ? || ' days')`).run(bizId, options.olderThanDays);
    }
    if (options.category) {
      return db.prepare('DELETE FROM notifications WHERE businessId = ? AND category = ?').run(bizId, options.category);
    }
    return db.prepare('DELETE FROM notifications WHERE businessId = ?').run(bizId);
  });

  // ========== NOTIFICATION PREFERENCES ==========
  ipcMain.handle('get-notification-preferences', () => {
    return db.prepare('SELECT * FROM notification_preferences ORDER BY key').all();
  });

  ipcMain.handle('update-notification-preference', (_, key: string, prefs: any) => {
    const existing = db.prepare('SELECT key FROM notification_preferences WHERE key = ?').get(key) as any;
    if (!existing) {
      db.prepare(`
        INSERT INTO notification_preferences (key, enabled, sound, desktop, email, inApp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(key, prefs.enabled ?? 1, prefs.sound ?? 0, prefs.desktop ?? 0, prefs.email ?? 0, prefs.inApp ?? 1);
    } else {
      db.prepare(`
        UPDATE notification_preferences SET
          enabled = ?, sound = ?, desktop = ?, email = ?, inApp = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE key = ?
      `).run(prefs.enabled ?? 1, prefs.sound ?? 0, prefs.desktop ?? 0, prefs.email ?? 0, prefs.inApp ?? 1, key);
    }
    return { success: true };
  });

  // ========== BANNERS ==========
  ipcMain.handle('get-active-banners', () => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT * FROM notification_banners
      WHERE businessId = ? AND dismissedAt IS NULL
        AND (endsAt IS NULL OR endsAt > CURRENT_TIMESTAMP)
        AND startsAt <= CURRENT_TIMESTAMP
      ORDER BY createdAt DESC
    `).all(bizId);
  });

  ipcMain.handle('dismiss-banner', (_, id: number) => {
    return db.prepare('UPDATE notification_banners SET dismissedAt = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  });

  ipcMain.handle('create-banner', (_, data: any) => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      INSERT INTO notification_banners (businessId, title, message, severity, dismissible, startsAt, endsAt, actionUrl, actionLabel)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bizId,
      data.title, data.message,
      data.severity || 'info',
      data.dismissible === false ? 0 : 1,
      data.startsAt || new Date().toISOString(),
      data.endsAt || null,
      data.actionUrl || null,
      data.actionLabel || null
    ).lastInsertRowid;
  });

  // ========== REMINDERS ==========
  ipcMain.handle('get-reminders', (_, options: any = {}) => {
    const bizId = getActiveBusinessId();
    let q = 'SELECT * FROM notification_reminders WHERE businessId = ?';
    const params: any[] = [bizId];
    if (options.status) { q += ' AND status = ?'; params.push(options.status); }
    q += ' ORDER BY triggerDate ASC LIMIT ?';
    params.push(options.limit ?? DEFAULT_LIST_LIMIT);
    return db.prepare(q).all(...params);
  });

  ipcMain.handle('create-reminder', (_, data: any) => {
    const bizId = getActiveBusinessId();
    if (!data.title || !data.triggerDate) throw new Error('title, triggerDate are required');
    const category = data.category || 'general';
    return db.prepare(`
      INSERT INTO notification_reminders (businessId, title, message, category, triggerDate, repeatInterval, relatedEntityType, relatedEntityId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bizId, data.title, data.message || null, category,
      data.triggerDate, data.repeatInterval || null,
      data.relatedEntityType || null, data.relatedEntityId || null
    ).lastInsertRowid;
  });

  ipcMain.handle('update-reminder', (_, id: number, data: any) => {
    const fields: string[] = [];
    const params: any[] = [];
    if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title); }
    if (data.message !== undefined) { fields.push('message = ?'); params.push(data.message); }
    if (data.triggerDate !== undefined) { fields.push('triggerDate = ?'); params.push(data.triggerDate); }
    if (data.repeatInterval !== undefined) { fields.push('repeatInterval = ?'); params.push(data.repeatInterval); }
    if (data.category !== undefined) { fields.push('category = ?'); params.push(data.category); }
    if (fields.length === 0) throw new Error('No fields to update');
    params.push(id);
    return db.prepare(`UPDATE notification_reminders SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  });

  ipcMain.handle('snooze-reminder', (_, id: number, untilIso: string) => {
    return db.prepare("UPDATE notification_reminders SET snoozedUntil = ?, status = 'snoozed' WHERE id = ?")
      .run(untilIso, id);
  });

  ipcMain.handle('complete-reminder', (_, id: number) => {
    return db.prepare(`UPDATE notification_reminders SET status = 'completed', completedAt = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
  });

  ipcMain.handle('delete-reminder', (_, id: number) => {
    return db.prepare('DELETE FROM notification_reminders WHERE id = ?').run(id);
  });

  // Recurring reminder engine: dispatch due reminders into the notifications table
  ipcMain.handle('run-reminder-engine', () => {
    const bizId = getActiveBusinessId();
    const now = new Date();
    const nowIso = now.toISOString();
    const allPending = db.prepare(`
      SELECT * FROM notification_reminders
      WHERE businessId = ? AND status = 'pending'
        AND (snoozedUntil IS NULL OR snoozedUntil <= ?)
    `).all(bizId, nowIso) as any[];
    const dueReminders = allPending.filter((r: any) => {
      if (!r.triggerDate) return false;
      const trigger = new Date(r.triggerDate);
      return !isNaN(trigger.getTime()) && trigger <= now;
    });
    let fired = 0;
    const insertNotif = db.prepare(`
      INSERT INTO notifications (businessId, title, message, type, category, severity, actionUrl, actionLabel, entityType, entityId, channels, requiresAction)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const updateReminder = db.prepare(`
      UPDATE notification_reminders SET lastTriggeredAt = ?, triggerDate = ? WHERE id = ?
    `);
    const completeReminder = db.prepare(`UPDATE notification_reminders SET status = 'completed', completedAt = ? WHERE id = ?`);
    for (const r of dueReminders) {
      const prefRow = db.prepare('SELECT * FROM notification_preferences WHERE key = ?').get(r.category) as any;
      const pref = prefRow || { desktop: 0, inApp: 1, sound: 0 };
      insertNotif.run(
        bizId,
        r.title,
        r.message || '',
        'info',
        r.category,
        'info',
        r.relatedEntityType ? `/${r.relatedEntityType}` : null,
        r.relatedEntityType ? 'View' : null,
        r.relatedEntityType || null,
        r.relatedEntityId || null,
        pref.desktop ? 'desktop,in_app' : 'in_app',
        1
      );
      if (pref.desktop) {
        try {
          const { Notification: ElectronNotification } = require('electron');
          if (ElectronNotification.isSupported()) {
            new ElectronNotification({ title: r.title, body: r.message || '' }).show();
          }
        } catch (_) {}
      }
      if (r.repeatInterval) {
        // Compute next trigger based on simple interval codes: 'daily'/'weekly'/'monthly'
        const next = new Date(r.triggerDate);
        if (r.repeatInterval === 'daily') next.setDate(next.getDate() + 1);
        else if (r.repeatInterval === 'weekly') next.setDate(next.getDate() + 7);
        else if (r.repeatInterval === 'monthly') next.setMonth(next.getMonth() + 1);
        else if (r.repeatInterval.startsWith('days:')) {
          const days = parseInt(r.repeatInterval.split(':')[1]) || 1;
          next.setDate(next.getDate() + days);
        }
        updateReminder.run(nowIso, next.toISOString(), r.id);
      } else {
        completeReminder.run(nowIso, r.id);
      }
      fired++;
    }
    return { fired };
  });

  // ========== DESKTOP OS NOTIFICATION ==========
  ipcMain.handle('show-desktop-notification', (_, data: { title: string; body: string; urgency?: 'normal' | 'critical' }) => {
    try {
      const { Notification: ElectronNotification } = require('electron');
      if (!ElectronNotification.isSupported()) return { shown: false, reason: 'unsupported' };
      const n = new ElectronNotification({
        title: data.title,
        body: data.body,
        urgency: data.urgency || 'normal',
        silent: false
      });
      n.show();
      return { shown: true };
    } catch (e: any) {
      return { shown: false, reason: e.message };
    }
  });

  // ========== DASHBOARD ALERTS (persistent widget) ==========
  ipcMain.handle('get-dashboard-alerts', () => {
    const bizId = getActiveBusinessId();
    const today = new Date().toISOString().split('T')[0];
    const alerts: any[] = [];

    const lowStock = db.prepare(`
      SELECT id, name, totalBaseQuantity FROM items
      WHERE businessId = ? AND totalBaseQuantity > 0 AND totalBaseQuantity < 10
      ORDER BY totalBaseQuantity ASC LIMIT 5
    `).all(bizId) as any[];
    if (lowStock.length > 0) {
      alerts.push({
        id: 'low_stock',
        type: 'warning',
        title: 'Low Stock',
        message: `${lowStock.length} product(s) running low. ${lowStock.map((i: any) => i.name).slice(0, 3).join(', ')}.`,
        count: lowStock.length,
        actionUrl: '/inventory',
        actionLabel: 'View Inventory',
        entityType: 'inventory',
        dismissible: false
      });
    }

    const outOfStock = (db.prepare(`
      SELECT COUNT(*) AS c FROM items WHERE businessId = ? AND totalBaseQuantity <= 0
    `).get(bizId) as any).c;
    if (outOfStock > 0) {
      alerts.push({
        id: 'out_of_stock',
        type: 'error',
        title: 'Out of Stock',
        message: `${outOfStock} product(s) completely out of stock. Reorder needed.`,
        count: outOfStock,
        actionUrl: '/inventory',
        actionLabel: 'View Inventory',
        entityType: 'inventory',
        dismissible: false
      });
    }

    const expiring = db.prepare(`
      SELECT COUNT(*) AS c FROM items
      WHERE businessId = ? AND expiryDate IS NOT NULL AND expiryDate <= date('now', '+7 days') AND expiryDate >= date('now')
    `).get(bizId) as any;
    if (expiring.c > 0) {
      alerts.push({
        id: 'expiring',
        type: 'warning',
        title: 'Expiring Soon',
        message: `${expiring.c} product(s) expiring within 7 days.`,
        count: expiring.c,
        actionUrl: '/inventory',
        actionLabel: 'View Inventory',
        entityType: 'inventory',
        dismissible: false
      });
    }

    const customerOverdue = (db.prepare(`
      SELECT COALESCE(SUM(totalPrice - paidAmount), 0) AS total, COUNT(*) AS c
      FROM sales WHERE businessId = ? AND paymentStatus = 'Debt' AND dueDate < ?
    `).get(bizId, today) as any);
    if (customerOverdue.c > 0) {
      alerts.push({
        id: 'customer_overdue',
        type: 'warning',
        title: 'Overdue Customer Balances',
        message: `${customerOverdue.c} debt(s) overdue, totaling ETB ${(customerOverdue.total || 0).toLocaleString()}.`,
        count: customerOverdue.c,
        actionUrl: '/customers',
        actionLabel: 'View Customers',
        entityType: 'customers',
        dismissible: false
      });
    }

    const supplierOverdue = (db.prepare(`
      SELECT COALESCE(SUM(totalAmount - paidAmount), 0) AS total, COUNT(*) AS c
      FROM supplier_purchases WHERE businessId = ? AND status != 'cancelled' AND dueDate IS NOT NULL AND dueDate < ? AND (totalAmount - paidAmount) > 0
    `).get(bizId, today) as any);
    if (supplierOverdue.c > 0) {
      alerts.push({
        id: 'supplier_overdue',
        type: 'warning',
        title: 'Unpaid Supplier Invoices',
        message: `${supplierOverdue.c} supplier invoice(s) overdue, totaling ETB ${(supplierOverdue.total || 0).toLocaleString()}.`,
        count: supplierOverdue.c,
        actionUrl: '/suppliers',
        actionLabel: 'View Suppliers',
        entityType: 'suppliers',
        dismissible: false
      });
    }

    const dueReminders = (db.prepare(`
      SELECT COUNT(*) AS c FROM notification_reminders
      WHERE businessId = ? AND status = 'pending' AND triggerDate <= ?
        AND (snoozedUntil IS NULL OR snoozedUntil <= ?)
    `).get(bizId, new Date().toISOString(), new Date().toISOString()) as any).c;
    if (dueReminders > 0) {
      alerts.push({
        id: 'reminders_due',
        type: 'info',
        title: 'Reminders Due',
        message: `${dueReminders} scheduled reminder(s) need attention.`,
        count: dueReminders,
        actionUrl: '/settings',
        actionLabel: 'Open Settings',
        entityType: 'reminders',
        dismissible: true
      });
    }

    return alerts;
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
    const bizId = getActiveBusinessId();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const todayStart = today;
    const tomorrowStart = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const todayRevenue = db.prepare("SELECT COALESCE(SUM(totalPrice), 0) as total FROM sales WHERE createdAt >= ? AND createdAt < ? AND businessId = ?").get(todayStart, tomorrowStart, bizId) as any;
    const yesterdayRevenue = db.prepare("SELECT COALESCE(SUM(totalPrice), 0) as total FROM sales WHERE createdAt >= ? AND createdAt < ? AND businessId = ?").get(yesterday, todayStart, bizId) as any;
    
    const todaySales = db.prepare("SELECT COUNT(*) as count FROM sales WHERE createdAt >= ? AND createdAt < ? AND businessId = ?").get(todayStart, tomorrowStart, bizId) as any;
    const yesterdaySales = db.prepare("SELECT COUNT(*) as count FROM sales WHERE createdAt >= ? AND createdAt < ? AND businessId = ?").get(yesterday, todayStart, bizId) as any;

    const todayExpenses = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ? AND businessId = ?").get(today, bizId) as any;
    const yesterdayExpenses = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ? AND businessId = ?").get(yesterday, bizId) as any;

    const activeDebts = db.prepare("SELECT COALESCE(SUM(totalPrice - paidAmount), 0) as total FROM sales WHERE paymentStatus = 'Debt' AND businessId = ?").get(bizId) as any;
    const totalItems = db.prepare("SELECT COUNT(*) as count FROM items WHERE businessId = ?").get(bizId) as any;
    const lowStock = db.prepare("SELECT COUNT(*) as count FROM items WHERE totalBaseQuantity < 10 AND businessId = ?").get(bizId) as any;

    // Cost of goods sold for profit calculation
    const todayProfit = db.prepare(`
      SELECT COALESCE(SUM(s.totalPrice - (CASE WHEN s.unitType = 'pack' THEN s.quantity * COALESCE(i.unitsPerPack, 1) ELSE s.quantity END * i.basePurchasePrice)), 0) as profit 
      FROM sales s LEFT JOIN items i ON s.itemId = i.id 
      WHERE DATE(s.createdAt) = ? AND s.businessId = ?
    `).get(today, bizId) as any;

    const yesterdayProfit = db.prepare(`
      SELECT COALESCE(SUM(s.totalPrice - (CASE WHEN s.unitType = 'pack' THEN s.quantity * COALESCE(i.unitsPerPack, 1) ELSE s.quantity END * i.basePurchasePrice)), 0) as profit 
      FROM sales s LEFT JOIN items i ON s.itemId = i.id 
      WHERE DATE(s.createdAt) = ? AND s.businessId = ?
    `).get(yesterday, bizId) as any;

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

  ipcMain.handle('get-recent-activity', (_, limit: number = 10, dateRange?: { start: string; end: string }) => {
    const bizId = getActiveBusinessId();
    
    let dateFilter = 'WHERE s.businessId = ?';
    let expDateFilter = 'WHERE businessId = ?';
    let params: any[] = [bizId];
    let expParams: any[] = [bizId];

    if (dateRange?.start && dateRange?.end) {
      dateFilter = 'WHERE DATE(s.createdAt) >= ? AND DATE(s.createdAt) <= ? AND s.businessId = ?';
      expDateFilter = 'WHERE date >= ? AND date <= ? AND businessId = ?';
      params = [dateRange.start, dateRange.end, bizId];
      expParams = [dateRange.start, dateRange.end, bizId];
    } else if (dateRange?.start) {
      dateFilter = 'WHERE DATE(s.createdAt) = ? AND s.businessId = ?';
      expDateFilter = 'WHERE date = ? AND businessId = ?';
      params = [dateRange.start, bizId];
      expParams = [dateRange.start, bizId];
    }

    const sales = db.prepare(`
      SELECT 'sale' as type, 'sale-' || s.id as id, s.totalPrice as amount, s.createdAt as date, i.name as description, s.customerName as extra
      FROM sales s LEFT JOIN items i ON s.itemId = i.id
      ${dateFilter}
      ORDER BY s.createdAt DESC LIMIT ?
    `).all(...params, limit);

    const expenses = db.prepare(`
      SELECT 'expense' as type, 'expense-' || id as id, amount, date, name as description, category as extra
      FROM expenses ${expDateFilter} ORDER BY date DESC LIMIT ?
    `).all(...expParams, limit);

    const adjFilter = dateFilter.replace(/s\.createdAt/g, 'a.createdAt').replace(/s\.businessId/g, 'a.businessId');

    const adjustments = db.prepare(`
      SELECT 'adjustment' as type, 'adj-' || a.id as id, a.newValue as amount, a.createdAt as date, i.name as description, a.type as extra
      FROM adjustments a LEFT JOIN items i ON a.itemId = i.id
      ${adjFilter}
      ORDER BY a.createdAt DESC LIMIT ?
    `).all(...params, limit);

    const all = [...sales, ...expenses, ...adjustments] as any[];
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return all.slice(0, limit);
  });

  ipcMain.handle('get-analytics', (_, period: string, dateRange?: { start: string; end: string }) => {
    const bizId = getActiveBusinessId();
    const now = new Date();
    let startDate: string;
    let endDate: string | null = null;
    let groupFormat: string;

    if (dateRange?.start && dateRange?.end) {
      // Custom date range
      startDate = dateRange.start;
      endDate = dateRange.end;
      groupFormat = '%Y-%m-%d';
    } else if (period === 'today') {
      startDate = now.toISOString().split('T')[0];
      groupFormat = '%Y-%m-%d';
    } else if (period === 'week') {
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

    const dateFilter = endDate
      ? 'DATE(createdAt) >= ? AND DATE(createdAt) <= ? AND businessId = ?'
      : 'DATE(createdAt) >= ? AND businessId = ?';
    const dateParams = endDate ? [startDate, endDate, bizId] : [startDate, bizId];

    const expDateFilter = endDate
      ? 'date >= ? AND date <= ? AND businessId = ?'
      : 'date >= ? AND businessId = ?';
    const expDateParams = endDate ? [startDate, endDate, bizId] : [startDate, bizId];

    const salesData = db.prepare(`
      SELECT 
        DATE(s.createdAt) as date, 
        COALESCE(SUM(s.totalPrice), 0) as revenue, 
        COALESCE(SUM(s.quantity), 0) as units,
        COALESCE(SUM(s.totalPrice - (CASE WHEN s.unitType = 'pack' THEN s.quantity * COALESCE(i.unitsPerPack, 1) ELSE s.quantity END * i.basePurchasePrice)), 0) as profit
      FROM sales s LEFT JOIN items i ON s.itemId = i.id
      WHERE ${dateFilter.replace(/createdAt/g, 's.createdAt').replace('businessId', 's.businessId')} 
      GROUP BY DATE(s.createdAt) ORDER BY date
    `).all(...dateParams);

    const expenseData = db.prepare(`
      SELECT date, COALESCE(SUM(amount), 0) as amount
      FROM expenses WHERE ${expDateFilter} GROUP BY date ORDER BY date
    `).all(...expDateParams);

    // Summary Totals
    const totalRevenue = salesData.reduce((acc: number, curr: any) => acc + curr.revenue, 0);
    const totalProfit = salesData.reduce((acc: number, curr: any) => acc + curr.profit, 0);
    const totalExpenses = expenseData.reduce((acc: number, curr: any) => acc + curr.amount, 0);

    // Top selling items
    const topItems = db.prepare(`
      SELECT i.name, SUM(s.quantity) as totalQty, SUM(s.totalPrice) as totalRevenue
      FROM sales s LEFT JOIN items i ON s.itemId = i.id
      WHERE ${dateFilter.replace(/createdAt/g, 's.createdAt').replace('businessId', 's.businessId')} GROUP BY s.itemId ORDER BY totalQty DESC LIMIT 5
    `).all(...dateParams);

    // Category breakdown
    const categoryBreakdown = db.prepare(`
      SELECT c.name, COUNT(s.id) as saleCount, SUM(s.totalPrice) as revenue
      FROM sales s LEFT JOIN items i ON s.itemId = i.id LEFT JOIN categories c ON i.categoryId = c.id
      WHERE ${dateFilter.replace(/createdAt/g, 's.createdAt').replace('businessId', 's.businessId')} GROUP BY c.id ORDER BY revenue DESC
    `).all(...dateParams);

    return { 
      salesData, 
      expenseData, 
      topItems, 
      categoryBreakdown,
      summary: {
        totalRevenue,
        totalProfit,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses
      }
    };
  });

  ipcMain.handle('get-customers', () => {
    const bizId = getActiveBusinessId();
    const customers = db.prepare(`
      SELECT c.*,
        s.transactionCount,
        s.totalDebt,
        s.totalPaid,
        s.outstanding,
        s.overdueCount
      FROM customers c
      LEFT JOIN (
        SELECT TRIM(customerName) as tCustomerName,
          COUNT(*) as transactionCount,
          SUM(CASE WHEN paymentStatus != 'Paid' THEN totalPrice ELSE 0 END) as totalDebt,
          SUM(paidAmount) as totalPaid,
          SUM(CASE WHEN paymentStatus != 'Paid' THEN totalPrice - paidAmount ELSE 0 END) as outstanding,
          SUM(CASE WHEN paymentStatus != 'Paid' AND dueDate < date('now') AND totalPrice > paidAmount THEN 1 ELSE 0 END) as overdueCount
        FROM sales
        WHERE businessId = ? AND customerName IS NOT NULL AND customerName != ''
        GROUP BY TRIM(customerName)
      ) s ON TRIM(c.customerName) = s.tCustomerName
      WHERE c.businessId = ? AND c.isActive = 1
      ORDER BY c.customerName ASC
      LIMIT ?
    `).all(bizId, bizId, DEFAULT_LIST_LIMIT) as any[];
    return customers.map((c: any) => ({
      id: c.id,
      customerName: c.customerName,
      createdAt: c.createdAt,
      phone: c.phone,
      secondaryPhone: c.secondaryPhone,
      email: c.email,
      address: c.address,
      city: c.city,
      company: c.company,
      taxNumber: c.taxNumber,
      groupName: c.groupName,
      creditLimit: c.creditLimit,
      notes: c.notes,
      isActive: c.isActive,
      salesStats: {
        transactionCount: c.transactionCount ?? 0,
        totalDebt: c.totalDebt ?? 0,
        totalPaid: c.totalPaid ?? 0,
        outstanding: c.outstanding ?? 0,
        overdueCount: c.overdueCount ?? 0,
      }
    }));
  });

  ipcMain.handle('get-customer', (_, customerId: number) => {
    const bizId = getActiveBusinessId();
    const customerRaw = db.prepare(`
      SELECT c.*,
        s.transactionCount,
        s.totalSales,
        s.totalPaid,
        s.outstanding
      FROM customers c
      LEFT JOIN (
        SELECT TRIM(customerName) as tCustomerName,
          COUNT(*) as transactionCount,
          SUM(totalPrice) as totalSales,
          SUM(paidAmount) as totalPaid,
          SUM(CASE WHEN paymentStatus != 'Paid' THEN totalPrice - paidAmount ELSE 0 END) as outstanding
        FROM sales
        WHERE businessId = ? AND customerName IS NOT NULL AND customerName != ''
        GROUP BY TRIM(customerName)
      ) s ON TRIM(c.customerName) = s.tCustomerName
      WHERE c.id = ? AND c.businessId = ?
    `).get(bizId, customerId, bizId) as any;
    if (!customerRaw) return null;
    return {
      id: customerRaw.id,
      customerName: customerRaw.customerName,
      createdAt: customerRaw.createdAt,
      phone: customerRaw.phone,
      secondaryPhone: customerRaw.secondaryPhone,
      email: customerRaw.email,
      address: customerRaw.address,
      city: customerRaw.city,
      company: customerRaw.company,
      taxNumber: customerRaw.taxNumber,
      groupName: customerRaw.groupName,
      creditLimit: customerRaw.creditLimit,
      notes: customerRaw.notes,
      isActive: customerRaw.isActive,
      salesStats: {
        transactionCount: customerRaw.transactionCount ?? 0,
        totalSales: customerRaw.totalSales ?? 0,
        totalPaid: customerRaw.totalPaid ?? 0,
        outstanding: customerRaw.outstanding ?? 0,
      }
    };
  });

  ipcMain.handle('get-customer-sales', (_, customerName: string) => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT sales.*, items.name as itemName 
      FROM sales LEFT JOIN items ON sales.itemId = items.id 
      WHERE sales.customerName = ? AND sales.businessId = ?
      ORDER BY sales.createdAt DESC
      LIMIT ?
    `).all(customerName, bizId, DEFAULT_LIST_LIMIT);
  });

  ipcMain.handle('insert-customer', (_, customer: any) => {
    const bizId = getActiveBusinessId();
    const existing = db.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(customer.customerName, bizId);
    if (existing) return { success: false, error: 'Customer name already exists' };
    const result = db.prepare(`
      INSERT INTO customers (businessId, customerName, phone, secondaryPhone, email, address, city, company, taxNumber, groupName, creditLimit, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(bizId, customer.customerName, customer.phone || '', customer.secondaryPhone || '', customer.email || '', customer.address || '', customer.city || '', customer.company || '', customer.taxNumber || '', customer.groupName || 'general', customer.creditLimit || 0, customer.notes || '');
    return { success: true, id: result.lastInsertRowid };
  });

  ipcMain.handle('update-customer', (_, customer: any) => {
    const bizId = getActiveBusinessId();
    const dup = db.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ? AND id != ?").get(customer.customerName, bizId, customer.id);
    if (dup) return { success: false, error: 'Another customer with this name already exists' };
    db.prepare(`
      UPDATE customers SET customerName = ?, phone = ?, secondaryPhone = ?, email = ?, address = ?, city = ?, company = ?, taxNumber = ?, groupName = ?, creditLimit = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND businessId = ?
    `).run(customer.customerName, customer.phone || '', customer.secondaryPhone || '', customer.email || '', customer.address || '', customer.city || '', customer.company || '', customer.taxNumber || '', customer.groupName || 'general', customer.creditLimit || 0, customer.notes || '', customer.id, bizId);
    return { success: true };
  });

  ipcMain.handle('delete-customer', (_, customerId: number) => {
    const bizId = getActiveBusinessId();
    const hasSales = db.prepare("SELECT COUNT(*) as count FROM sales WHERE customerName = (SELECT customerName FROM customers WHERE id = ?) AND businessId = ?").get(customerId, bizId) as any;
    if (hasSales.count > 0) return { success: false, error: 'Cannot delete customer with sales history. Deactivate instead.' };
    db.prepare("UPDATE customers SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(currentUserName || 'unknown', customerId, bizId);
    logActivity('delete', 'customer', customerId, `Deleted customer (ID: ${customerId})`);
    return { success: true };
  });

  ipcMain.handle('get-customer-notes', (_, customerId: number) => {
    return db.prepare("SELECT * FROM customer_notes WHERE customerId = ? ORDER BY createdAt DESC LIMIT 50").all(customerId);
  });

  ipcMain.handle('add-customer-note', (_, customerId: number, note: string, createdBy?: string) => {
    db.prepare("INSERT INTO customer_notes (customerId, note, createdBy) VALUES (?, ?, ?)").run(customerId, note, createdBy || '');
    return { success: true };
  });

  // ========== DATA MANAGEMENT ==========
  ipcMain.handle('export-data', () => {
    requirePermission('settings.manage');
    const bizId = getActiveBusinessId();
    const tables = ['categories', 'items', 'item_packs', 'sales', 'expenses', 'adjustments', 'settings'];
    const data: Record<string, any> = {};
    for (const table of tables) {
      if (table === 'settings') {
        data[table] = db.prepare(`SELECT * FROM ${table}`).all();
      } else {
        data[table] = db.prepare(`SELECT * FROM ${table} WHERE businessId = ?`).all(bizId);
      }
    }
    return data;
  });

  ipcMain.handle('reset-data', () => {
    const hasBackupPerm = currentUserPermissions.includes('settings.backup');
    const hasManagePerm = currentUserPermissions.includes('settings.manage');
    const hasWildcard = currentUserPermissions.includes('*');
    if (!hasBackupPerm && !hasManagePerm && !hasWildcard) {
      throw new Error('Permission denied: settings.manage');
    }
    const bizId = getActiveBusinessId();
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM returns WHERE businessId = ?').run(bizId);
      db.prepare('DELETE FROM sales WHERE businessId = ?').run(bizId);
      db.prepare('DELETE FROM adjustments WHERE businessId = ?').run(bizId);
      db.prepare('DELETE FROM stock_movements WHERE itemId IN (SELECT id FROM items WHERE businessId = ?)').run(bizId);
      db.prepare('DELETE FROM warehouse_inventory WHERE itemId IN (SELECT id FROM items WHERE businessId = ?)').run(bizId);
      db.prepare('DELETE FROM stock_transfers WHERE businessId = ?').run(bizId);
      db.prepare('DELETE FROM shipment_items WHERE shipmentId IN (SELECT id FROM shipments WHERE businessId = ?)').run(bizId);
      db.prepare('DELETE FROM shipment_history WHERE shipmentId IN (SELECT id FROM shipments WHERE businessId = ?)').run(bizId);
      db.prepare('DELETE FROM shipments WHERE businessId = ?').run(bizId);
      db.prepare('DELETE FROM notification_banners WHERE businessId = ?').run(bizId);
      db.prepare('DELETE FROM notification_reminders WHERE businessId = ?').run(bizId);
      db.prepare('DELETE FROM supplier_purchase_items WHERE purchaseId IN (SELECT id FROM supplier_purchases WHERE businessId = ?)').run(bizId);
      db.prepare('DELETE FROM supplier_payments WHERE businessId = ?').run(bizId);
      db.prepare('DELETE FROM supplier_activity_log WHERE supplierId IN (SELECT id FROM suppliers WHERE businessId = ?)').run(bizId);
      db.prepare('DELETE FROM supplier_purchases WHERE businessId = ?').run(bizId);
      db.prepare('DELETE FROM customer_notes WHERE customerId IN (SELECT id FROM customers WHERE businessId = ?)').run(bizId);
      db.prepare('DELETE FROM customers WHERE businessId = ?').run(bizId);
      db.prepare('DELETE FROM suppliers WHERE businessId = ?').run(bizId);
      db.prepare('DELETE FROM item_packs WHERE itemId IN (SELECT id FROM items WHERE businessId = ?)').run(bizId);
      db.prepare('DELETE FROM items WHERE businessId = ?').run(bizId);
      db.prepare('DELETE FROM expenses WHERE businessId = ?').run(bizId);
      db.prepare('DELETE FROM categories WHERE businessId = ? AND isCustom = 1').run(bizId);
      db.prepare('DELETE FROM notifications WHERE businessId = ?').run(bizId);
    });
    transaction();
    return { success: true };
  });

  // ========== ADMIN MANAGEMENT ==========
  ipcMain.handle('login', (_, username: string, pin: string) => {
    // Check admins table first
    const admin = db.prepare(
      'SELECT id, name, username, role, permissions, isActive, businessId, avatar, pin FROM admins WHERE username = ?'
    ).get(username) as any;
    if (admin) {
      if (!admin.isActive) return { success: false, error: 'Account deactivated' };
      if (!verifyPin(pin, admin.pin)) return { success: false, error: 'Invalid credentials' };
      currentUserName = admin.name;
      currentUserPermissions = admin.permissions ? JSON.parse(admin.permissions) : ['*'];
      return {
        success: true,
        admin: {
          ...admin,
          permissions: admin.permissions ? JSON.parse(admin.permissions) : []
        }
      };
    }
    // Fall back to employee_accounts
    const account = db.prepare(`
      SELECT ea.*, e.id as employeeId, e.firstName, e.lastName,
        r.name as roleName, r.permissions as rolePermissions
      FROM employee_accounts ea
      LEFT JOIN employees e ON ea.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
      WHERE ea.username = ?
    `).get(username) as any;
    if (!account) {
      db.prepare('INSERT INTO login_history (action) VALUES (?)').run('failed_login: employee not found');
      return { success: false, error: 'Invalid credentials' };
    }
    if (account.lockedUntil && new Date(account.lockedUntil) > new Date()) {
      db.prepare('INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)').run(account.id, account.employeeId, 'failed_login: account locked');
      return { success: false, error: 'Account is locked. Try again later.' };
    }
    if (!account.isActive) {
      db.prepare('INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)').run(account.id, account.employeeId, 'failed_login: inactive');
      return { success: false, error: 'Account deactivated' };
    }
    if (!verifyPin(pin, account.pin)) {
      const attempts = (account.failedLoginAttempts || 0) + 1;
      if (attempts >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        db.prepare('UPDATE employee_accounts SET failedLoginAttempts = ?, lockedUntil = ?, isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(attempts, lockUntil, account.id);
        db.prepare('INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)').run(account.id, account.employeeId, 'failed_login: locked after 5 attempts');
        return { success: false, error: 'Account locked due to too many failed attempts.' };
      }
      db.prepare('UPDATE employee_accounts SET failedLoginAttempts = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(attempts, account.id);
      db.prepare('INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)').run(account.id, account.employeeId, 'failed_login: wrong pin');
      return { success: false, error: 'Invalid credentials' };
    }
    db.prepare('UPDATE employee_accounts SET lastLogin = CURRENT_TIMESTAMP, failedLoginAttempts = 0, lockedUntil = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(account.id);
    db.prepare('INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)').run(account.id, account.employeeId, 'login');
    currentUserName = `${account.firstName || ''} ${account.lastName || ''}`.trim() || account.username;
    const rolePerms: string[] = account.rolePermissions ? JSON.parse(account.rolePermissions) : [];
    currentUserPermissions = rolePerms.length > 0 ? rolePerms : ['*'];
    return {
      success: true,
      admin: {
        id: account.employeeId,
        name: `${account.firstName || ''} ${account.lastName || ''}`.trim() || account.username,
        username: account.username,
        role: account.roleName || 'employee',
        permissions: account.rolePermissions ? JSON.parse(account.rolePermissions) : [],
        isActive: account.isActive,
        avatar: undefined,
        isEmployee: true
      }
    };
  });

  ipcMain.handle('get-admins', () => {
    const admins = db.prepare('SELECT id, name, username, role, permissions, isActive, avatar, createdAt FROM admins ORDER BY createdAt ASC').all() as any[];
    return admins.map(a => ({
      ...a,
      permissions: a.permissions ? JSON.parse(a.permissions) : []
    }));
  });

  ipcMain.handle('get-current-admin', (_, id: number) => {
    const admin = db.prepare('SELECT id, name, username, role, permissions, isActive, avatar FROM admins WHERE id = ?').get(id) as any;
    if (!admin) return null;
    return {
      ...admin,
      permissions: admin.permissions ? JSON.parse(admin.permissions) : []
    };
  });

  ipcMain.handle('insert-admin', (_, admin: any) => {
    requirePermission('settings.users');
    // Check for duplicate username
    const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(admin.username);
    if (existing) return { success: false, error: 'Username already exists' };

    const hash = hashPin(admin.pin);
    const result = db.prepare(
      'INSERT INTO admins (name, username, pin, role, permissions, businessId) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      admin.name,
      admin.username,
      hash,
      admin.role || 'admin',
      JSON.stringify(admin.permissions || []),
      admin.businessId || null
    );
    return { success: true, id: result.lastInsertRowid };
  });

  ipcMain.handle('update-admin', (_, id: number, admin: any) => {
    requirePermission('settings.users');
    // Check for duplicate username (exclude current admin)
    if (admin.username) {
      const existing = db.prepare('SELECT id FROM admins WHERE username = ? AND id != ?').get(admin.username, id);
      if (existing) return { success: false, error: 'Username already exists' };
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (admin.name !== undefined) { fields.push('name = ?'); values.push(admin.name); }
    if (admin.username !== undefined) { fields.push('username = ?'); values.push(admin.username); }
    if (admin.pin !== undefined) { const h = hashPin(admin.pin); fields.push('pin = ?'); values.push(h); }
    if (admin.role !== undefined) { fields.push('role = ?'); values.push(admin.role); }
    if (admin.permissions !== undefined) { fields.push('permissions = ?'); values.push(JSON.stringify(admin.permissions)); }
    if (admin.isActive !== undefined) { fields.push('isActive = ?'); values.push(admin.isActive); }
    if (admin.businessId !== undefined) { fields.push('businessId = ?'); values.push(admin.businessId); }
    if (admin.avatar !== undefined) { fields.push('avatar = ?'); values.push(admin.avatar); }

    if (fields.length === 0) return { success: false, error: 'No fields to update' };

    values.push(id);
    db.prepare(`UPDATE admins SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return { success: true };
  });

  ipcMain.handle('delete-admin', (_, id: number) => {
    requirePermission('settings.users');
    // Prevent deleting the last super admin
    const admin = db.prepare('SELECT role FROM admins WHERE id = ?').get(id) as any;
    if (admin?.role === 'super_admin') {
      const superCount = db.prepare("SELECT COUNT(*) as count FROM admins WHERE role = 'super_admin'").get() as any;
      if (superCount.count <= 1) {
        return { success: false, error: 'Cannot delete the last super admin' };
      }
    }
    db.prepare('DELETE FROM admins WHERE id = ?').run(id);
    return { success: true };
  });

  ipcMain.handle('insert-bulk-adjustments', (_, adjustments: any[]) => {
    const bizId = getActiveBusinessId();
    const transaction = db.transaction(() => {
      let count = 0;
      for (const adj of adjustments) {
        db.prepare('INSERT INTO adjustments (businessId, itemId, type, oldValue, newValue, quantity, unitType, reason, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          bizId, adj.itemId, adj.type, adj.oldValue, adj.newValue, adj.quantity, adj.unitType, adj.reason, adj.date
        );

        if (adj.type === 'damage' || adj.type === 'loss') {
          db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity - ? WHERE id = ?').run(adj.quantity, adj.itemId);
          // Sync default warehouse inventory
          const defWhId = getDefaultWarehouseId();
          const whRow = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, adj.itemId) as any;
          if (whRow) {
            db.prepare('UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(adj.quantity, whRow.id);
          }
          db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)')
            .run(defWhId, adj.itemId, `adj_${adj.type}`, adj.quantity, 'adjustment', adj.reason || null);
        } else if (adj.type === 'add_stock') {
          db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity + ? WHERE id = ?').run(adj.quantity, adj.itemId);
          // Sync default warehouse inventory
          const defWhId = getDefaultWarehouseId();
          const whRow = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, adj.itemId) as any;
          if (whRow) {
            db.prepare('UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(adj.quantity, whRow.id);
          } else {
            db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(defWhId, adj.itemId, adj.quantity);
          }
          db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)')
            .run(defWhId, adj.itemId, `adj_${adj.type}`, adj.quantity, 'adjustment', adj.reason || null);
        } else if (adj.type === 'price_increase' || adj.type === 'price_decrease') {
          if (adj.unitType === 'base') {
            db.prepare('UPDATE items SET baseSellingPrice = ? WHERE id = ?').run(adj.newValue, adj.itemId);
          } else {
            db.prepare('UPDATE items SET packSellingPrice = ? WHERE id = ?').run(adj.newValue, adj.itemId);
          }
        }
        count++;
      }
      return count;
    });

    return transaction();
  });

  // ========== WAREHOUSES ==========
  ipcMain.handle('get-warehouses', () => {
    const bizId = getActiveBusinessId();
    return db.prepare('SELECT * FROM warehouses WHERE businessId = ? ORDER BY name').all(bizId);
  });

  ipcMain.handle('get-warehouse', (_, id: number) => {
    return db.prepare('SELECT * FROM warehouses WHERE id = ?').get(id);
  });

  ipcMain.handle('insert-warehouse', (_, wh: any) => {
    const bizId = getActiveBusinessId();
    return db.prepare('INSERT INTO warehouses (businessId, name, location, managerName, managerPhone, email) VALUES (?, ?, ?, ?, ?, ?)')
      .run(bizId, wh.name, wh.location, wh.managerName, wh.managerPhone, wh.email).lastInsertRowid;
  });

  ipcMain.handle('update-warehouse', (_, id: number, wh: any) => {
    return db.prepare('UPDATE warehouses SET name = ?, location = ?, managerName = ?, managerPhone = ?, email = ?, isActive = ? WHERE id = ?')
      .run(wh.name, wh.location, wh.managerName, wh.managerPhone, wh.email, wh.isActive ?? 1, id);
  });

  ipcMain.handle('delete-warehouse', (_, id: number) => {
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM stock_movements WHERE warehouseId = ?').run(id);
      db.prepare('DELETE FROM warehouse_inventory WHERE warehouseId = ?').run(id);
      db.prepare('DELETE FROM warehouses WHERE id = ?').run(id);
    });
    return tx();
  });

  // ========== WAREHOUSE INVENTORY ==========
  ipcMain.handle('get-warehouse-inventory', (_, warehouseId: number) => {
    return db.prepare(`
      SELECT wi.*, items.name as itemName, items.companyName, items.baseUnit,
        items.baseSellingPrice, items.packSellingPrice, items.categoryId,
        categories.name as categoryName
      FROM warehouse_inventory wi
      LEFT JOIN items ON wi.itemId = items.id
      LEFT JOIN categories ON items.categoryId = categories.id
      WHERE wi.warehouseId = ?
      ORDER BY items.name
    `).all(warehouseId);
  });

  ipcMain.handle('get-all-warehouse-inventory', (_, options: { search?: string; category?: string } = {}) => {
    const bizId = getActiveBusinessId();
    let query = `
      SELECT wi.*, w.name as warehouseName, items.name as itemName, items.companyName,
        items.baseUnit, items.baseSellingPrice, items.packSellingPrice,
        categories.name as categoryName
      FROM warehouse_inventory wi
      LEFT JOIN warehouses w ON wi.warehouseId = w.id
      LEFT JOIN items ON wi.itemId = items.id
      LEFT JOIN categories ON items.categoryId = categories.id
      WHERE w.businessId = ?
    `;
    const params: any[] = [bizId];
    if (options.search) {
      query += ' AND (items.name LIKE ? OR items.companyName LIKE ?)';
      params.push(`%${options.search}%`, `%${options.search}%`);
    }
    if (options.category && options.category !== 'All') {
      query += ' AND categories.name = ?';
      params.push(options.category);
    }
    query += ' ORDER BY w.name, items.name LIMIT ?';
    params.push(DEFAULT_LIST_LIMIT);
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('update-warehouse-inventory', (_, warehouseId: number, itemId: number, quantity: number) => {
    validateNonNegative(quantity, 'Warehouse inventory quantity');
    const existing = db.prepare('SELECT id, quantity FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(warehouseId, itemId) as any;
    const oldQty = existing?.quantity || 0;
    const delta = quantity - oldQty;
    if (existing) {
      db.prepare('UPDATE warehouse_inventory SET quantity = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(quantity, existing.id);
    } else {
      db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(warehouseId, itemId, quantity);
    }
    // Sync global totals
    db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity + ? WHERE id = ?').run(delta, itemId);
    // Log movement
    db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)')
      .run(warehouseId, itemId, 'adjustment', quantity, 'manual', 'Manual inventory adjustment');
    const item = db.prepare('SELECT name FROM items WHERE id = ?').get(itemId) as any;
    logActivity('update', 'inventory', itemId, `Set inventory qty to ${quantity} for "${item?.name || 'unknown'}" at warehouse #${warehouseId}`);
    return { success: true };
  });

  // ========== STOCK TRANSFERS ==========
  ipcMain.handle('transfer-stock', (_, transfer: any) => {
    if (transfer.fromWarehouseId === transfer.toWarehouseId) throw new Error('Source and destination warehouses must be different');
    const qty = validatePositive(transfer.quantity, 'Transfer quantity');
    transfer.quantity = qty;
    const bizId = getActiveBusinessId();
    const tx = db.transaction(() => {
      // Deduct from source
      const fromExisting = db.prepare('SELECT id, quantity FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(transfer.fromWarehouseId, transfer.itemId) as any;
      if (!fromExisting || fromExisting.quantity < transfer.quantity) {
        throw new Error('Insufficient stock at source warehouse');
      }
      db.prepare('UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(transfer.quantity, fromExisting.id);

      // Add to destination
      const toExisting = db.prepare('SELECT id, quantity FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(transfer.toWarehouseId, transfer.itemId) as any;
      if (toExisting) {
        const newQty = toExisting.quantity + transfer.quantity;
        db.prepare('UPDATE warehouse_inventory SET quantity = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(newQty, toExisting.id);
      } else {
        db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(transfer.toWarehouseId, transfer.itemId, transfer.quantity);
      }
      // Create transfer record
      const result = db.prepare('INSERT INTO stock_transfers (businessId, fromWarehouseId, toWarehouseId, itemId, quantity, unitType, notes, transferredBy, completedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
        .run(bizId, transfer.fromWarehouseId, transfer.toWarehouseId, transfer.itemId, transfer.quantity, transfer.unitType || 'base', transfer.notes, transfer.transferredBy);
      // Log movements
      db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceId, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(transfer.fromWarehouseId, transfer.itemId, 'transfer_out', transfer.quantity, result.lastInsertRowid, 'transfer', `Transferred to warehouse #${transfer.toWarehouseId}`);
      db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceId, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(transfer.toWarehouseId, transfer.itemId, 'transfer_in', transfer.quantity, result.lastInsertRowid, 'transfer', `Received from warehouse #${transfer.fromWarehouseId}`);
      const item = db.prepare('SELECT name FROM items WHERE id = ?').get(transfer.itemId) as any;
      logActivity('update', 'transfer', result.lastInsertRowid as number, `Transferred ${transfer.quantity} of "${item?.name || 'unknown'}" from warehouse #${transfer.fromWarehouseId} to #${transfer.toWarehouseId}`);
      return result.lastInsertRowid;
    });
    return tx();
  });

  ipcMain.handle('get-stock-transfers', (_, options: any = {}) => {
    const bizId = getActiveBusinessId();
    let query = `
      SELECT st.*, 
        fromWh.name as fromWarehouseName, toWh.name as toWarehouseName,
        items.name as itemName, items.companyName
      FROM stock_transfers st
      LEFT JOIN warehouses fromWh ON st.fromWarehouseId = fromWh.id
      LEFT JOIN warehouses toWh ON st.toWarehouseId = toWh.id
      LEFT JOIN items ON st.itemId = items.id
      WHERE st.businessId = ?
    `;
    const params: any[] = [bizId];
    if (options.startDate && options.endDate) {
      query += ' AND DATE(st.createdAt) BETWEEN ? AND ?';
      params.push(options.startDate, options.endDate);
    }
    query += ' ORDER BY st.createdAt DESC';
    const listLimit = options.limit ?? DEFAULT_LIST_LIMIT;
    query += ' LIMIT ?';
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });

  // ========== STOCK MOVEMENTS ==========
  ipcMain.handle('get-stock-movements', (_, options: any = {}) => {
    const bizId = getActiveBusinessId();
    let query = `
      SELECT sm.*, w.name as warehouseName, items.name as itemName, items.companyName
      FROM stock_movements sm
      LEFT JOIN warehouses w ON sm.warehouseId = w.id
      LEFT JOIN items ON sm.itemId = items.id
      WHERE w.businessId = ?
    `;
    const params: any[] = [bizId];
    if (options.warehouseId) {
      query += ' AND sm.warehouseId = ?';
      params.push(options.warehouseId);
    }
    if (options.itemId) {
      query += ' AND sm.itemId = ?';
      params.push(options.itemId);
    }
    if (options.startDate && options.endDate) {
      query += ' AND DATE(sm.createdAt) BETWEEN ? AND ?';
      params.push(options.startDate, options.endDate);
    }
    query += ' ORDER BY sm.createdAt DESC';
    const listLimit = options.limit ?? DEFAULT_LIST_LIMIT;
    query += ' LIMIT ?';
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('cleanup-stock-movements', () => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const result = db.prepare("DELETE FROM stock_movements WHERE createdAt < ?").run(ninetyDaysAgo);
    return { success: true, deleted: result.changes };
  });

  ipcMain.handle('get-warehouse-report', (_, warehouseId: number) => {
    const inventory = db.prepare(`
      SELECT wi.*, items.name as itemName, items.companyName, items.baseUnit,
        items.baseSellingPrice, items.packSellingPrice, categories.name as categoryName
      FROM warehouse_inventory wi
      LEFT JOIN items ON wi.itemId = items.id
      LEFT JOIN categories ON items.categoryId = categories.id
      WHERE wi.warehouseId = ?
      ORDER BY items.name
    `).all(warehouseId) as any[];

    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum: number, i: any) => sum + (i.quantity * (i.baseSellingPrice || 0)), 0);
    const lowStock = inventory.filter(i => i.quantity < 10).length;

    const recentMovements = db.prepare(`
      SELECT sm.*, items.name as itemName
      FROM stock_movements sm
      LEFT JOIN items ON sm.itemId = items.id
      WHERE sm.warehouseId = ?
      ORDER BY sm.createdAt DESC LIMIT 20
    `).all(warehouseId);

    return { inventory, totalItems, totalValue, lowStock, recentMovements };
  });

  // ========== EMPLOYEE ROLES ==========
  ipcMain.handle('get-employee-roles', () => {
    return db.prepare('SELECT * FROM employee_roles ORDER BY name').all();
  });

  ipcMain.handle('get-employee-role', (_, id: number) => {
    return db.prepare('SELECT * FROM employee_roles WHERE id = ?').get(id);
  });

  ipcMain.handle('insert-employee-role', (_, data: any) => {
    const permissions = JSON.stringify(data.permissions || []);
    const result = db.prepare('INSERT INTO employee_roles (name, description, permissions, isSystem) VALUES (?, ?, ?, ?)')
      .run(data.name, data.description || '', permissions, 0);
    logActivity('insert', 'role', result.lastInsertRowid as number, `Created role "${data.name}"`);
    return result.lastInsertRowid;
  });

  ipcMain.handle('update-employee-role', (_, id: number, data: any) => {
    const permissions = JSON.stringify(data.permissions || []);
    const result = db.prepare('UPDATE employee_roles SET name = ?, description = ?, permissions = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
      .run(data.name, data.description || '', permissions, id);
    logActivity('update', 'role', id, `Updated role "${data.name}"`);
    return result;
  });

  ipcMain.handle('duplicate-employee-role', (_, id: number) => {
    const original = db.prepare('SELECT * FROM employee_roles WHERE id = ?').get(id) as any;
    if (!original) throw new Error('Role not found');
    const result = db.prepare('INSERT INTO employee_roles (name, description, permissions, isSystem) VALUES (?, ?, ?, 0)')
      .run(`${original.name} (Copy)`, original.description, original.permissions);
    logActivity('insert', 'role', result.lastInsertRowid as number, `Duplicated role "${original.name}"`);
    return result.lastInsertRowid;
  });

  ipcMain.handle('delete-employee-role', (_, id: number) => {
    const role = db.prepare('SELECT name, isSystem FROM employee_roles WHERE id = ?').get(id) as any;
    if (role?.isSystem) throw new Error('Cannot delete system role');
    db.prepare('UPDATE employees SET roleId = NULL WHERE roleId = ?').run(id);
    db.prepare('DELETE FROM employee_roles WHERE id = ?').run(id);
    logActivity('delete', 'role', id, `Deleted role "${role?.name || 'unknown'}"`);
  });

  // ========== EMPLOYEES ==========
  ipcMain.handle('get-employees', (_, options?: any) => {
    let query = `
      SELECT e.*, r.name as roleName, r.permissions as rolePermissions,
        CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END as hasAccount,
        a.username, a.isActive as accountActive, a.lastLogin, a.forcePasswordChange,
        a.failedLoginAttempts, a.lockedUntil, w.name as warehouseName
      FROM employees e
      LEFT JOIN employee_roles r ON e.roleId = r.id
      LEFT JOIN employee_accounts a ON e.id = a.employeeId
      LEFT JOIN warehouses w ON e.warehouseId = w.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];
    if (options?.search) {
      conditions.push('(e.firstName LIKE ? OR e.lastName LIKE ? OR e.phone LIKE ? OR e.email LIKE ? OR e.employeeCode LIKE ?)');
      const s = `%${options.search}%`;
      params.push(s, s, s, s, s);
    }
    if (options?.roleId) {
      conditions.push('e.roleId = ?');
      params.push(options.roleId);
    }
    if (options?.department) {
      conditions.push('e.department = ?');
      params.push(options.department);
    }
    if (options?.employmentStatus) {
      conditions.push('e.employmentStatus = ?');
      params.push(options.employmentStatus);
    }
    if (options?.warehouseId) {
      conditions.push('e.warehouseId = ?');
      params.push(options.warehouseId);
    }
    if (options?.hasAccount !== undefined) {
      conditions.push(options.hasAccount ? 'a.id IS NOT NULL' : 'a.id IS NULL');
    }
    if (options?.isActive !== undefined) {
      conditions.push('e.isActive = ?');
      params.push(options.isActive ? 1 : 0);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY e.firstName, e.lastName';
    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    query += ' LIMIT ?';
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-employee', (_, id: number) => {
    return db.prepare(`
      SELECT e.*, r.name as roleName, r.permissions as rolePermissions,
        r.description as roleDescription, w.name as warehouseName
      FROM employees e
      LEFT JOIN employee_roles r ON e.roleId = r.id
      LEFT JOIN warehouses w ON e.warehouseId = w.id
      WHERE e.id = ?
    `).get(id);
  });

  ipcMain.handle('insert-employee', (_, data: any) => {
    const result = db.prepare(`
      INSERT INTO employees (employeeCode, firstName, lastName, phone, email, address, emergencyContact,
        gender, dateOfBirth, roleId, department, warehouseId, isActive, employmentStatus, avatar, hireDate, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.employeeCode || null, data.firstName, data.lastName,
      data.phone || null, data.email || null, data.address || null,
      data.emergencyContact || null, data.gender || null, data.dateOfBirth || null,
      data.roleId || null, data.department || null, data.warehouseId || null,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      data.employmentStatus || 'active', data.avatar || null,
      data.hireDate || null, data.notes || null
    );
    logActivity('insert', 'employee', result.lastInsertRowid as number, `Added employee "${data.firstName} ${data.lastName}"`);
    return result.lastInsertRowid;
  });

  ipcMain.handle('update-employee', (_, id: number, data: any) => {
    const result = db.prepare(`
      UPDATE employees SET
        employeeCode = ?, firstName = ?, lastName = ?, phone = ?, email = ?,
        address = ?, emergencyContact = ?, gender = ?, dateOfBirth = ?,
        roleId = ?, department = ?, warehouseId = ?, isActive = ?,
        employmentStatus = ?, avatar = ?, hireDate = ?, notes = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.employeeCode || null, data.firstName, data.lastName,
      data.phone || null, data.email || null, data.address || null,
      data.emergencyContact || null, data.gender || null, data.dateOfBirth || null,
      data.roleId || null, data.department || null, data.warehouseId || null,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      data.employmentStatus || 'active', data.avatar || null,
      data.hireDate || null, data.notes || null, id
    );
    logActivity('update', 'employee', id, `Updated employee "${data.firstName} ${data.lastName}"`);
    return result;
  });

  ipcMain.handle('delete-employee', (_, id: number) => {
    const emp = db.prepare('SELECT firstName, lastName FROM employees WHERE id = ?').get(id) as any;
    db.prepare('DELETE FROM employees WHERE id = ?').run(id);
    logActivity('delete', 'employee', id, `Deleted employee "${emp?.firstName || ''} ${emp?.lastName || 'unknown'}"`);
  });

  ipcMain.handle('archive-employee', (_, id: number) => {
    const result = db.prepare("UPDATE employees SET employmentStatus = 'inactive', isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    logActivity('update', 'employee', id, `Archived employee #${id}`);
    return result;
  });

  ipcMain.handle('reactivate-employee', (_, id: number) => {
    const result = db.prepare("UPDATE employees SET employmentStatus = 'active', isActive = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    logActivity('update', 'employee', id, `Reactivated employee #${id}`);
    return result;
  });

  // ========== EMPLOYEE ACCOUNTS ==========
  ipcMain.handle('get-employee-accounts', () => {
    return db.prepare(`
      SELECT ea.*, e.firstName, e.lastName, e.employeeCode, r.name as roleName
      FROM employee_accounts ea
      LEFT JOIN employees e ON ea.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
      ORDER BY e.firstName, e.lastName
    `).all();
  });

  ipcMain.handle('insert-employee-account', (_, data: any) => {
    if (!data.username || !data.username.trim()) throw new Error('Username is required');
    if (!data.pin || data.pin.length < 4) throw new Error('PIN must be at least 4 characters');
    const hash = hashPin(data.pin);
    const result = db.prepare('INSERT INTO employee_accounts (employeeId, username, pin, forcePasswordChange) VALUES (?, ?, ?, ?)')
      .run(data.employeeId, data.username, hash, data.forcePasswordChange ? 1 : 0);
    logActivity('insert', 'account', result.lastInsertRowid as number, `Created account "${data.username}"`);
    return result.lastInsertRowid;
  });

  ipcMain.handle('update-employee-account', (_, id: number, data: any) => {
    if (data.pin) {
    const hash = hashPin(data.pin);
      db.prepare('UPDATE employee_accounts SET username = ?, pin = ?, isActive = ?, forcePasswordChange = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
        .run(data.username, hash, data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1, data.forcePasswordChange ? 1 : 0, id);
    } else {
      db.prepare('UPDATE employee_accounts SET username = ?, isActive = ?, forcePasswordChange = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
        .run(data.username, data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1, data.forcePasswordChange ? 1 : 0, id);
    }
    logActivity('update', 'account', id, `Updated account "${data.username}"`);
  });

  ipcMain.handle('delete-employee-account', (_, id: number) => {
    const acct = db.prepare('SELECT username FROM employee_accounts WHERE id = ?').get(id) as any;
    db.prepare('DELETE FROM employee_accounts WHERE id = ?').run(id);
    logActivity('delete', 'account', id, `Deleted account "${acct?.username || 'unknown'}"`);
  });

  ipcMain.handle('lock-employee-account', (_, id: number) => {
    const lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    db.prepare('UPDATE employee_accounts SET isActive = 0, lockedUntil = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(lockUntil, id);
    logActivity('update', 'account', id, 'Locked account');
  });

  ipcMain.handle('unlock-employee-account', (_, id: number) => {
    db.prepare('UPDATE employee_accounts SET isActive = 1, lockedUntil = NULL, failedLoginAttempts = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    logActivity('update', 'account', id, 'Unlocked account');
  });

  ipcMain.handle('reset-employee-password', (_, id: number, newPin: string) => {
    const hash = hashPin(newPin);
    db.prepare('UPDATE employee_accounts SET pin = ?, forcePasswordChange = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(hash, id);
    logActivity('update', 'account', id, 'Password reset');
  });

  ipcMain.handle('login-employee', (_, username: string, pin: string) => {
    const account = db.prepare(`
      SELECT ea.*, e.firstName, e.lastName, e.id as employeeId, e.roleId,
        r.name as roleName, r.permissions as rolePermissions
      FROM employee_accounts ea
      LEFT JOIN employees e ON ea.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
      WHERE ea.username = ?
    `).get(username) as any;
    if (!account) {
      db.prepare('INSERT INTO login_history (accountId, action) VALUES (?, ?)').run(null, 'failed_login: user not found');
      return null;
    }
    if (account.lockedUntil && new Date(account.lockedUntil) > new Date()) {
      db.prepare('INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)').run(account.id, account.employeeId, 'failed_login: account locked');
      return { error: 'locked', lockedUntil: account.lockedUntil };
    }
    if (!account.isActive) {
      db.prepare('INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)').run(account.id, account.employeeId, 'failed_login: inactive');
      return { error: 'inactive' };
    }
    if (!verifyPin(pin, account.pin)) {
      const attempts = (account.failedLoginAttempts || 0) + 1;
      if (attempts >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        db.prepare('UPDATE employee_accounts SET failedLoginAttempts = ?, lockedUntil = ?, isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(attempts, lockUntil, account.id);
        db.prepare('INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)').run(account.id, account.employeeId, 'failed_login: locked after 5 attempts');
        return { error: 'locked', lockedUntil: lockUntil };
      }
      db.prepare('UPDATE employee_accounts SET failedLoginAttempts = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(attempts, account.id);
      db.prepare('INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)').run(account.id, account.employeeId, 'failed_login: wrong pin');
      return null;
    }
    db.prepare('UPDATE employee_accounts SET lastLogin = CURRENT_TIMESTAMP, failedLoginAttempts = 0, lockedUntil = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(account.id);
    db.prepare('INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)').run(account.id, account.employeeId, 'login');
    currentUserName = `${account.firstName} ${account.lastName}`;
    const rolePerms: string[] = account.rolePermissions ? JSON.parse(account.rolePermissions) : [];
    currentUserPermissions = rolePerms.length > 0 ? rolePerms : ['*'];
    return {
      id: account.employeeId,
      accountId: account.id,
      username: account.username,
      firstName: account.firstName,
      lastName: account.lastName,
      roleName: account.roleName,
      roleId: account.roleId,
      permissions: account.rolePermissions ? JSON.parse(account.rolePermissions) : [],
      forcePasswordChange: account.forcePasswordChange
    };
  });

  // ========== LOGIN HISTORY ==========
  ipcMain.handle('get-login-history', (_, options?: any) => {
    let query = `
      SELECT lh.*, e.firstName, e.lastName, ea.username
      FROM login_history lh
      LEFT JOIN employee_accounts ea ON lh.accountId = ea.id
      LEFT JOIN employees e ON lh.employeeId = e.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];
    if (options?.employeeId) {
      conditions.push('lh.employeeId = ?');
      params.push(options.employeeId);
    }
    if (options?.accountId) {
      conditions.push('lh.accountId = ?');
      params.push(options.accountId);
    }
    if (options?.fromDate) {
      conditions.push('lh.createdAt >= ?');
      params.push(options.fromDate);
    }
    if (options?.toDate) {
      conditions.push('lh.createdAt <= ?');
      params.push(options.toDate);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY lh.createdAt DESC';
    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    query += ' LIMIT ?';
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });

  // ========== ATTENDANCE ==========
  ipcMain.handle('clock-in', (_, employeeId: number, notes?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    const existing = db.prepare('SELECT id FROM attendance WHERE employeeId = ? AND date = ?').get(employeeId, today) as any;
    if (existing) throw new Error('Already clocked in today');
    const result = db.prepare('INSERT INTO attendance (employeeId, date, clockIn, status, notes) VALUES (?, ?, ?, ?, ?)').run(employeeId, today, now, 'present', notes || null);
    logActivity('insert', 'attendance', result.lastInsertRowid as number, `Employee #${employeeId} clocked in`);
    return result.lastInsertRowid;
  });

  ipcMain.handle('clock-out', (_, employeeId: number, notes?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    const existing = db.prepare('SELECT id, clockIn FROM attendance WHERE employeeId = ? AND date = ?').get(employeeId, today) as any;
    if (!existing) throw new Error('Not clocked in today');
    if (existing.clockOut) throw new Error('Already clocked out today');
    const clockIn = new Date(existing.clockIn);
    const clockOut = new Date(now);
    const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
    const status = hoursWorked >= 8 ? 'present' : hoursWorked >= 4 ? 'partial' : 'short';
    db.prepare('UPDATE attendance SET clockOut = ?, status = ?, notes = ? WHERE id = ?').run(now, status, notes || null, existing.id);
    logActivity('update', 'attendance', existing.id, `Employee #${employeeId} clocked out (${hoursWorked.toFixed(1)}h)`);
  });

  ipcMain.handle('get-attendance', (_, options?: any) => {
    let query = `
      SELECT a.*, e.firstName, e.lastName, e.employeeCode, r.name as roleName
      FROM attendance a
      LEFT JOIN employees e ON a.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];
    if (options?.employeeId) {
      conditions.push('a.employeeId = ?');
      params.push(options.employeeId);
    }
    if (options?.fromDate) {
      conditions.push('a.date >= ?');
      params.push(options.fromDate);
    }
    if (options?.toDate) {
      conditions.push('a.date <= ?');
      params.push(options.toDate);
    }
    if (options?.status) {
      conditions.push('a.status = ?');
      params.push(options.status);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY a.date DESC, a.clockIn DESC';
    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    query += ' LIMIT ?';
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-today-attendance', () => {
    const today = new Date().toISOString().split('T')[0];
    return db.prepare(`
      SELECT a.*, e.firstName, e.lastName, e.employeeCode, r.name as roleName
      FROM attendance a
      LEFT JOIN employees e ON a.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
      WHERE a.date = ?
      ORDER BY a.clockIn DESC
    `).all(today);
  });

  // ========== EMPLOYEE PERFORMANCE ==========
  ipcMain.handle('get-employee-performance', (_, options?: any) => {
    let query = `
      SELECT ep.*, e.firstName, e.lastName, e.employeeCode, r.name as roleName
      FROM employee_performance ep
      LEFT JOIN employees e ON ep.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];
    if (options?.employeeId) {
      conditions.push('ep.employeeId = ?');
      params.push(options.employeeId);
    }
    if (options?.period) {
      conditions.push('ep.period = ?');
      params.push(options.period);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY ep.period DESC, ep.salesAmount DESC';
    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    query += ' LIMIT ?';
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('update-employee-performance', (_, data: any) => {
    const existing = db.prepare('SELECT id FROM employee_performance WHERE employeeId = ? AND period = ?').get(data.employeeId, data.period) as any;
    if (existing) {
      db.prepare(`UPDATE employee_performance SET salesAmount = ?, ordersProcessed = ?, attendanceScore = ?, tasksCompleted = ?, rating = ?, notes = ? WHERE id = ?`)
        .run(data.salesAmount || 0, data.ordersProcessed || 0, data.attendanceScore || 0, data.tasksCompleted || 0, data.rating || null, data.notes || null, existing.id);
    } else {
      db.prepare(`INSERT INTO employee_performance (employeeId, period, salesAmount, ordersProcessed, attendanceScore, tasksCompleted, rating, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(data.employeeId, data.period, data.salesAmount || 0, data.ordersProcessed || 0, data.attendanceScore || 0, data.tasksCompleted || 0, data.rating || null, data.notes || null);
    }
  });

  // ========== EMPLOYEE STATS (DASHBOARD) ==========
  ipcMain.handle('get-employee-stats', () => {
    const total = db.prepare("SELECT COUNT(*) as count FROM employees").get() as any;
    const active = db.prepare("SELECT COUNT(*) as count FROM employees WHERE isActive = 1").get() as any;
    const online = db.prepare("SELECT COUNT(*) as count FROM employee_accounts WHERE isActive = 1 AND lastLogin IS NOT NULL AND lastLogin >= datetime('now', '-24 hours')").get() as any;
    const pendingApprovals = db.prepare("SELECT COUNT(*) as count FROM employees WHERE employmentStatus = 'pending'").get() as any;
    const clockedIn = (() => {
      const today = new Date().toISOString().split('T')[0];
      const row = db.prepare("SELECT COUNT(*) as count FROM attendance WHERE date = ? AND clockIn IS NOT NULL AND clockOut IS NULL").get(today) as any;
      return row.count;
    })();
    const departments = db.prepare("SELECT department, COUNT(*) as count FROM employees WHERE department IS NOT NULL AND department != '' GROUP BY department ORDER BY count DESC").all() as any[];
    return { total: total.count, active: active.count, online: online.count, pendingApprovals: pendingApprovals.count, clockedIn, departments };
  });

  // ========== ACTIVITY LOGS ==========
  ipcMain.handle('get-activity-logs', (_, options?: any) => {
    let query = `
      SELECT al.*, e.firstName, e.lastName, e.employeeCode
      FROM activity_logs al
      LEFT JOIN employees e ON al.employeeId = e.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];
    if (options?.employeeId) {
      conditions.push('al.employeeId = ?');
      params.push(options.employeeId);
    }
    if (options?.action) {
      conditions.push('al.action = ?');
      params.push(options.action);
    }
    if (options?.entityType) {
      conditions.push('al.entityType = ?');
      params.push(options.entityType);
    }
    if (options?.fromDate) {
      conditions.push('al.createdAt >= ?');
      params.push(options.fromDate + ' 00:00:00');
    }
    if (options?.toDate) {
      conditions.push('al.createdAt <= ?');
      params.push(options.toDate + ' 23:59:59');
    }
    if (options?.search) {
      conditions.push('(al.details LIKE ? OR e.firstName LIKE ? OR e.lastName LIKE ?)');
      const s = `%${options.search}%`;
      params.push(s, s, s);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY al.createdAt DESC';
    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    query += ' LIMIT ?';
    params.push(listLimit);
    if (options?.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('log-activity', (_, data: any) => {
    return db.prepare('INSERT INTO activity_logs (employeeId, action, entityType, entityId, details) VALUES (?, ?, ?, ?, ?)')
      .run(data.employeeId || null, data.action, data.entityType || null, data.entityId || null, data.details || null);
  });

  // ========== SHIPMENTS ==========
  ipcMain.handle('get-shipments', (_, options?: any) => {
    let query = `SELECT * FROM shipments WHERE businessId = ?`;
    const params: any[] = [getActiveBusinessId()];
    if (options?.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }
    if (options?.search) {
      query += ' AND (destination LIKE ? OR driverName LIKE ? OR notes LIKE ?)';
      const s = `%${options.search}%`;
      params.push(s, s, s);
    }
    if (options?.fromDate) {
      query += ' AND createdAt >= ?';
      params.push(options.fromDate);
    }
    if (options?.toDate) {
      query += ' AND createdAt <= ?';
      params.push(options.toDate);
    }
    query += ' ORDER BY createdAt DESC';
    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    query += ' LIMIT ?';
    params.push(listLimit);
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-shipment', (_, id: number) => {
    const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(id);
    const items = db.prepare('SELECT * FROM shipment_items WHERE shipmentId = ?').all(id);
    const history = db.prepare('SELECT * FROM shipment_history WHERE shipmentId = ? ORDER BY createdAt DESC').all(id);
    return { ...(shipment as any), items, history };
  });

  ipcMain.handle('insert-shipment', (_, data: any) => {
    const bizId = getActiveBusinessId();
    const result = db.prepare(`
      INSERT INTO shipments (businessId, origin, destination, driverName, driverPhone, vehicleInfo, status, notes, scheduledDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(bizId, data.origin || null, data.destination, data.driverName || null, data.driverPhone || null,
      data.vehicleInfo || null, 'pending', data.notes || null, data.scheduledDate || null);
    const shipmentId = result.lastInsertRowid as number;
    db.prepare('INSERT INTO shipment_history (shipmentId, status, changedBy, notes) VALUES (?, ?, ?, ?)')
      .run(shipmentId, 'pending', data.createdBy || null, 'Shipment created');
    return shipmentId;
  });

  ipcMain.handle('update-shipment', (_, id: number, data: any) => {
    return db.prepare(`
      UPDATE shipments SET origin = ?, destination = ?, driverName = ?, driverPhone = ?,
        vehicleInfo = ?, notes = ?, scheduledDate = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.origin || null, data.destination, data.driverName || null, data.driverPhone || null,
      data.vehicleInfo || null, data.notes || null, data.scheduledDate || null, id);
  });

  ipcMain.handle('update-shipment-status', (_, id: number, status: string, changedBy?: string, notes?: string) => {
    const validStatuses = ['pending', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) throw new Error('Invalid status');
    const updates: string[] = ['status = ?', 'updatedAt = CURRENT_TIMESTAMP'];
    const params: any[] = [status];
    if (status === 'delivered') {
      updates.push('deliveredAt = CURRENT_TIMESTAMP');
    }
    params.push(id);
    db.prepare(`UPDATE shipments SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    db.prepare('INSERT INTO shipment_history (shipmentId, status, changedBy, notes) VALUES (?, ?, ?, ?)')
      .run(id, status, changedBy || null, notes || null);
    return { success: true };
  });

  ipcMain.handle('delete-shipment', (_, id: number) => {
    return db.prepare('DELETE FROM shipments WHERE id = ?').run(id);
  });

  ipcMain.handle('get-shipment-history', (_, shipmentId: number) => {
    return db.prepare('SELECT * FROM shipment_history WHERE shipmentId = ? ORDER BY createdAt DESC').all(shipmentId);
  });

  // ========== SUPPLIERS ==========
  ipcMain.handle('get-suppliers', (_, options: any = {}) => {
    const bizId = getActiveBusinessId();
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    const search = options.search ? `%${options.search}%` : null;
    const status = options.status || null;

    let where = 's.businessId = ?';
    const params: any[] = [bizId];
    if (search) {
      where += ' AND (s.supplierName LIKE ? OR s.companyName LIKE ? OR s.phone LIKE ? OR s.email LIKE ?)';
      params.push(search, search, search, search);
    }
    if (status === 'active') where += ' AND s.isActive = 1';
    if (status === 'inactive') where += ' AND s.isActive = 0';

    const rows = db.prepare(`
      SELECT s.*,
        COALESCE(SUM(CASE WHEN sp.status != 'cancelled' THEN sp.totalAmount ELSE 0 END), 0) AS totalPurchases,
        COALESCE(SUM(CASE WHEN sp.status != 'cancelled' THEN sp.paidAmount ELSE 0 END), 0) AS totalPaid,
        COALESCE(SUM(CASE WHEN sp.status != 'cancelled' THEN sp.totalAmount - sp.paidAmount ELSE 0 END), 0) AS outstandingBalance,
        MAX(CASE WHEN sp.status != 'cancelled' THEN sp.purchaseDate ELSE NULL END) AS lastPurchaseDate,
        (SELECT COUNT(*) FROM supplier_purchases WHERE supplierId = s.id AND status != 'cancelled') AS purchaseCount
      FROM suppliers s
      LEFT JOIN supplier_purchases sp ON sp.supplierId = s.id
      WHERE ${where}
      GROUP BY s.id
      ORDER BY s.supplierName ASC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const total = (db.prepare(`SELECT COUNT(*) AS c FROM suppliers s WHERE ${where}`).get(...params) as any).c;
    return { rows, total };
  });

  ipcMain.handle('get-supplier', (_, id: number) => {
    const bizId = getActiveBusinessId();
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id) as any;
    if (!supplier) return null;
    const stats = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN totalAmount ELSE 0 END), 0) AS totalPurchases,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN paidAmount ELSE 0 END), 0) AS totalPaid,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN totalAmount - paidAmount ELSE 0 END), 0) AS outstanding,
        COUNT(CASE WHEN status != 'cancelled' THEN 1 ELSE NULL END) AS purchaseCount,
        AVG(CASE WHEN status != 'cancelled' THEN totalAmount ELSE NULL END) AS avgPurchase,
        MAX(CASE WHEN status != 'cancelled' THEN purchaseDate ELSE NULL END) AS lastPurchaseDate,
        (SELECT COUNT(DISTINCT itemId) FROM supplier_purchase_items spi
         JOIN supplier_purchases sp ON spi.purchaseId = sp.id
         WHERE sp.supplierId = ? AND sp.status != 'cancelled') AS productCount
      FROM supplier_purchases WHERE supplierId = ?
    `).get(id, id) as any;
    return { ...supplier, ...stats };
  });

  ipcMain.handle('insert-supplier', (_, data: any) => {
    if (!data.supplierName || String(data.supplierName).trim() === '') {
      throw new Error('Supplier name is required');
    }
    const phone = data.phone ? String(data.phone).trim() : '';
    if (phone && phone.length > 0 && (phone.length < 7 || phone.length > 20 || !/^[+\d\s\-\(\)]+$/.test(phone))) {
      throw new Error('Invalid phone number');
    }
    if (data.email && data.email.trim()) {
      const email = data.email.trim();
      if (email.length > 5 && !/^[^\s@]+@[^\s@]+/.test(email)) {
        throw new Error('Invalid email address');
      }
    }
    const bizId = getActiveBusinessId();
    const dup = db.prepare(`
      SELECT id FROM suppliers WHERE businessId = ? AND LOWER(supplierName) = LOWER(?)
    `).get(bizId, data.supplierName);
    if (dup) throw new Error('A supplier with this name already exists');
    const code = data.supplierCode || `SUP-${Date.now().toString().slice(-7)}`;
    const creditLimit = data.creditLimit ? validateNonNegative(data.creditLimit, 'Credit limit') : 0;
    const res = db.prepare(`
      INSERT INTO suppliers (
        businessId, supplierCode, supplierName, companyName, contactPerson,
        phone, secondaryPhone, email, address, city, country,
        taxNumber, paymentTerms, creditLimit, notes, status, isActive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      bizId, code, data.supplierName,
      data.companyName || null, data.contactPerson || null,
      phone || null, data.secondaryPhone || null, data.email || null,
      data.address || null, data.city || null, data.country || 'Ethiopia',
      data.taxNumber || null, data.paymentTerms || null,
      creditLimit, data.notes || null,
      data.status || 'active'
    );
    logActivity('created', 'supplier', Number(res.lastInsertRowid), `Created supplier ${data.supplierName}`);
    return { id: res.lastInsertRowid };
  });

  ipcMain.handle('update-supplier', (_, id: number, data: any) => {
    if (!data.supplierName || String(data.supplierName).trim() === '') {
      throw new Error('Supplier name is required');
    }
    const phone = data.phone ? String(data.phone).trim() : '';
    if (phone && phone.length > 0 && (phone.length < 7 || phone.length > 20 || !/^[+\d\s\-\(\)]+$/.test(phone))) {
      throw new Error('Invalid phone number');
    }
    if (data.email && data.email.trim()) {
      const email = data.email.trim();
      if (email.length > 5 && !/^[^\s@]+@[^\s@]+/.test(email)) {
        throw new Error('Invalid email address');
      }
    }
    const dup = db.prepare(`
      SELECT id FROM suppliers WHERE id != ? AND LOWER(supplierName) = LOWER(?)
    `).get(id, data.supplierName);
    if (dup) throw new Error('A supplier with this name already exists');
    const creditLimit = data.creditLimit != null ? validateNonNegative(data.creditLimit, 'Credit limit') : 0;
    db.prepare(`
      UPDATE suppliers SET
        supplierName = ?, companyName = ?, contactPerson = ?,
        phone = ?, secondaryPhone = ?, email = ?,
        address = ?, city = ?, country = ?,
        taxNumber = ?, paymentTerms = ?, creditLimit = ?,
        notes = ?, status = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.supplierName, data.companyName || null, data.contactPerson || null,
      phone || null, data.secondaryPhone || null, data.email || null,
      data.address || null, data.city || null, data.country || 'Ethiopia',
      data.taxNumber || null, data.paymentTerms || null, creditLimit,
      data.notes || null, data.status || 'active', id
    );
    logActivity('updated', 'supplier', id, `Updated supplier ${data.supplierName}`);
    return { success: true };
  });

  ipcMain.handle('archive-supplier', (_, id: number) => {
    db.prepare('UPDATE suppliers SET isActive = 0, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
      .run('inactive', id);
    const sup = db.prepare('SELECT supplierName FROM suppliers WHERE id = ?').get(id) as any;
    logActivity('archived', 'supplier', id, `Archived supplier ${sup?.supplierName || id}`);
    return { success: true };
  });

  ipcMain.handle('restore-supplier', (_, id: number) => {
    db.prepare('UPDATE suppliers SET isActive = 1, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
      .run('active', id);
    const sup = db.prepare('SELECT supplierName FROM suppliers WHERE id = ?').get(id) as any;
    logActivity('restored', 'supplier', id, `Restored supplier ${sup?.supplierName || id}`);
    return { success: true };
  });

  ipcMain.handle('delete-supplier', (_, id: number) => {
    const purchases = db.prepare('SELECT COUNT(*) AS c FROM supplier_purchases WHERE supplierId = ?').get(id) as any;
    if (purchases.c > 0) throw new Error('Cannot delete supplier with existing purchases. Archive instead.');
    const sup = db.prepare('SELECT supplierName FROM suppliers WHERE id = ?').get(id) as any;
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
    logActivity('deleted', 'supplier', id, `Deleted supplier ${sup?.supplierName || id}`);
    return { success: true };
  });

  // ========== SUPPLIER PURCHASES ==========
  ipcMain.handle('get-supplier-purchases', (_, options: any = {}) => {
    const bizId = getActiveBusinessId();
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    const supplierId = options.supplierId || null;
    const status = options.status || null;
    let where = 'sp.businessId = ?';
    const params: any[] = [bizId];
    if (supplierId) { where += ' AND sp.supplierId = ?'; params.push(supplierId); }
    if (status) { where += ' AND sp.status = ?'; params.push(status); }
    const rows = db.prepare(`
      SELECT sp.*, s.supplierName, s.companyName,
        (sp.totalAmount - sp.paidAmount) AS remainingBalance,
        (SELECT COUNT(*) FROM supplier_purchase_items WHERE purchaseId = sp.id) AS productCount
      FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId
      WHERE ${where}
      ORDER BY sp.purchaseDate DESC, sp.id DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    const total = (db.prepare(`SELECT COUNT(*) AS c FROM supplier_purchases sp WHERE ${where}`).get(...params) as any).c;
    return { rows, total };
  });

  ipcMain.handle('get-supplier-purchase', (_, id: number) => {
    const purchase = db.prepare(`
      SELECT sp.*, s.supplierName, s.companyName
      FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId
      WHERE sp.id = ?
    `).get(id) as any;
    if (!purchase) return null;
    const items = db.prepare('SELECT * FROM supplier_purchase_items WHERE purchaseId = ?').all(id);
    return { ...purchase, items };
  });

  // Helper: log to supplier_activity_log
  function logSupplierActivity(supplierId: number, action: string, entityType: string, entityId: number | null, description: string) {
    try {
      db.prepare('INSERT INTO supplier_activity_log (supplierId, action, description, entityType, entityId, createdBy) VALUES (?, ?, ?, ?, ?, ?)')
        .run(supplierId, action, description, entityType, entityId, currentUserName || 'system');
      db.prepare('UPDATE suppliers SET lastActivityDate = CURRENT_TIMESTAMP WHERE id = ?').run(supplierId);
    } catch (_) {}
  }

  ipcMain.handle('insert-supplier-purchase', (_, data: any) => {
    if (!data.supplierId) throw new Error('Supplier is required');
    if (!data.purchaseDate) throw new Error('Purchase date is required');
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('At least one item is required');
    }
    const totalAmount = validateNonNegative(data.totalAmount, 'Total amount');
    const purchaseNumber = data.purchaseNumber || `PO-${Date.now().toString().slice(-8)}`;
    const bizId = getActiveBusinessId();
    const defWhId = getDefaultWarehouseId();
    const insertPurchase = db.transaction(() => {
      const res = db.prepare(`
        INSERT INTO supplier_purchases (
          businessId, supplierId, purchaseNumber, purchaseDate,
          totalAmount, paidAmount, dueDate, status, notes, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        bizId, data.supplierId, purchaseNumber, data.purchaseDate,
        totalAmount, validateNonNegative(data.paidAmount || 0, 'Paid amount'),
        data.dueDate || null, data.status || 'pending',
        data.notes || null, currentUserName || 'system'
      );
      const purchaseId = Number(res.lastInsertRowid);
      const insertItem = db.prepare(`
        INSERT INTO supplier_purchase_items (
          purchaseId, itemId, itemName, sku, quantity, unit, unitPrice, totalPrice
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const updateItemStock = db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, lastPurchaseDate = ?, lastPurchasePrice = ? WHERE id = ?');
      const upsertWh = db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?) ON CONFLICT(warehouseId, itemId) DO UPDATE SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP');
      const insertSm = db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceId, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const it of data.items) {
        const qty = validatePositive(it.quantity, 'Item quantity');
        const price = validateNonNegative(it.unitPrice, 'Item unit price');
        insertItem.run(
          purchaseId, it.itemId || null, it.itemName,
          it.sku || null, qty, it.unit || 'pcs', price, qty * price
        );
        // Auto-update inventory: add stock to items.totalBaseQuantity and default warehouse
        if (it.itemId) {
          updateItemStock.run(qty, data.purchaseDate, price, it.itemId);
          upsertWh.run(defWhId, it.itemId, qty, qty);
          insertSm.run(defWhId, it.itemId, 'purchase_in', qty, purchaseId, 'supplier_purchase', `Purchase ${purchaseNumber} - ${it.itemName}`);
        }
      }
      return purchaseId;
    });
    const id = insertPurchase();
    logActivity('created', 'supplier_purchase', id, `Created purchase ${purchaseNumber}`);
    logSupplierActivity(data.supplierId, 'purchase_created', 'supplier_purchase', id, `Purchase ${purchaseNumber} created for $${totalAmount}`);
    try {
      db.prepare(`INSERT INTO notifications (businessId, type, category, title, message, severity) VALUES (?, ?, ?, ?, ?, ?)`)
        .run(bizId, 'purchase_created', 'suppliers', 'New Purchase Created', `Purchase ${purchaseNumber} for supplier #${data.supplierId}`, 'info');
    } catch (_) {}
    return { id };
  });

  ipcMain.handle('update-supplier-purchase-status', (_, id: number, status: string, notes?: string) => {
    const validStatuses = ['draft', 'pending', 'approved', 'ordered', 'received', 'cancelled'];
    if (!validStatuses.includes(status)) throw new Error('Invalid status');
    const prev = db.prepare('SELECT status, supplierId FROM supplier_purchases WHERE id = ?').get(id) as any;
    if (!prev) throw new Error('Purchase not found');
    const prevStatus = prev.status;
    db.prepare('UPDATE supplier_purchases SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    logActivity('status_change', 'supplier_purchase', id, `Status changed from ${prevStatus} to ${status}${notes ? ' — ' + notes : ''}`);
    // When status changes to 'received', add stock if not already added
    if (status === 'received' && prevStatus !== 'received') {
      const defWhId = getDefaultWarehouseId();
      const items = db.prepare('SELECT * FROM supplier_purchase_items WHERE purchaseId = ?').all(id) as any[];
      const purchase = db.prepare('SELECT purchaseNumber, supplierId FROM supplier_purchases WHERE id = ?').get(id) as any;
      const updateItemStock = db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, lastPurchaseDate = CURRENT_TIMESTAMP, lastPurchasePrice = ? WHERE id = ?');
      const upsertWh = db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?) ON CONFLICT(warehouseId, itemId) DO UPDATE SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP');
      const insertSm = db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceId, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
      const updateReceived = db.prepare('UPDATE supplier_purchase_items SET receivedQuantity = receivedQuantity + ? WHERE id = ?');
      const receiveTxn = db.transaction(() => {
        for (const it of items) {
          if (!it.itemId) continue;
          const remaining = it.quantity - (it.receivedQuantity || 0);
          if (remaining <= 0) continue;
          updateReceived.run(remaining, it.id);
          updateItemStock.run(remaining, it.unitPrice, it.itemId);
          upsertWh.run(defWhId, it.itemId, remaining, remaining);
          insertSm.run(defWhId, it.itemId, 'purchase_received', remaining, id, 'supplier_purchase', `Received purchase #${id} - ${it.itemName}`);
        }
      });
      receiveTxn();
      logSupplierActivity(purchase.supplierId, 'purchase_received', 'supplier_purchase', id, `Purchase order #${id} marked as received`);
      logActivity('received', 'supplier_purchase', id, `Stock added from purchase #${id}`);
    }
    if (status === 'received' || status === 'approved') {
      try {
        const bizId2 = getActiveBusinessId();
        db.prepare(`INSERT INTO notifications (businessId, type, category, title, message, severity) VALUES (?, ?, ?, ?, ?, ?)`)
          .run(bizId2, 'purchase_received', 'suppliers', 'Purchase Order Received', `Purchase order #${id} marked as ${status}`, 'success');
      } catch (_) {}
    }
    return { success: true };
  });

  ipcMain.handle('delete-supplier-purchase', (_, id: number) => {
    const row = db.prepare('SELECT purchaseNumber, supplierId FROM supplier_purchases WHERE id = ?').get(id) as any;
    if (!row) throw new Error('Purchase not found');
    const payCheck = db.prepare('SELECT paidAmount FROM supplier_purchases WHERE id = ?').get(id) as any;
    if (payCheck && payCheck.paidAmount > 0) {
      throw new Error('Cannot delete a purchase with payments. Delete payments first.');
    }
    // Reverse stock if status was received
    const transaction = db.transaction(() => {
      const items = db.prepare('SELECT * FROM supplier_purchase_items WHERE purchaseId = ?').all(id) as any[];
      const defWhId = getDefaultWarehouseId();
      for (const it of items) {
        if (!it.itemId) continue;
        const receivedQty = it.receivedQuantity || 0;
        if (receivedQty > 0) {
          db.prepare('UPDATE items SET totalBaseQuantity = MAX(0, totalBaseQuantity - ?) WHERE id = ?').run(receivedQty, it.itemId);
          db.prepare('UPDATE warehouse_inventory SET quantity = MAX(0, quantity - ?) WHERE warehouseId = ? AND itemId = ?').run(receivedQty, defWhId, it.itemId);
          db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceId, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .run(defWhId, it.itemId, 'purchase_reversal', -receivedQty, id, 'supplier_purchase', `Reversed purchase #${id} - ${it.itemName}`);
        }
      }
      db.prepare('DELETE FROM supplier_purchase_items WHERE purchaseId = ?').run(id);
      db.prepare('DELETE FROM supplier_purchases WHERE id = ?').run(id);
    });
    transaction();
    logSupplierActivity(row.supplierId, 'purchase_deleted', 'supplier_purchase', id, `Purchase ${row?.purchaseNumber || id} deleted`);
    logActivity('deleted', 'supplier_purchase', id, `Deleted purchase ${row?.purchaseNumber || id}`);
    return { success: true };
  });

  // ========== SUPPLIER PAYMENTS ==========
  ipcMain.handle('get-supplier-payments', (_, options: any = {}) => {
    const bizId = getActiveBusinessId();
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    const supplierId = options.supplierId || null;
    let where = 's.businessId = ?';
    const params: any[] = [bizId];
    if (supplierId) { where += ' AND pay.supplierId = ?'; params.push(supplierId); }
    const rows = db.prepare(`
      SELECT pay.*, s.supplierName, sp.purchaseNumber
      FROM supplier_payments pay
      JOIN suppliers s ON s.id = pay.supplierId
      LEFT JOIN supplier_purchases sp ON sp.id = pay.purchaseId
      WHERE ${where}
      ORDER BY pay.paymentDate DESC, pay.id DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    const total = (db.prepare(`SELECT COUNT(*) AS c FROM supplier_payments pay JOIN suppliers s ON s.id = pay.supplierId WHERE ${where}`).get(...params) as any).c;
    return { rows, total };
  });

  ipcMain.handle('insert-supplier-payment', (_, data: any) => {
    if (!data.supplierId) throw new Error('Supplier is required');
    if (!data.paymentDate) throw new Error('Payment date is required');
    const amount = validatePositive(data.amount, 'Amount');
    const validMethods = ['cash', 'bank_transfer', 'mobile_money', 'check', 'other'];
    if (!validMethods.includes(data.paymentMethod)) throw new Error('Invalid payment method');
    const bizId = getActiveBusinessId();
    const insertTxn = db.transaction(() => {
      const targetPurchaseId = data.purchaseId || null;
      // If no specific purchase, distribute payment across outstanding purchases (oldest first)
      let effectivePurchaseId = targetPurchaseId;
      if (!effectivePurchaseId) {
        const oldestOutstanding = db.prepare(`
          SELECT id, totalAmount - paidAmount AS remaining
          FROM supplier_purchases
          WHERE supplierId = ? AND businessId = ? AND status != 'cancelled' AND (totalAmount - paidAmount) > 0
          ORDER BY purchaseDate ASC, id ASC
          LIMIT 1
        `).get(data.supplierId, bizId) as any;
        if (oldestOutstanding) {
          effectivePurchaseId = oldestOutstanding.id;
        }
      }
      const res = db.prepare(`
        INSERT INTO supplier_payments (
          businessId, supplierId, purchaseId, paymentDate,
          referenceNumber, amount, paymentMethod, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        bizId, data.supplierId, effectivePurchaseId,
        data.paymentDate, data.referenceNumber || null,
        amount, data.paymentMethod, data.notes || null
      );
      if (effectivePurchaseId) {
        db.prepare(`
          UPDATE supplier_purchases SET paidAmount = paidAmount + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
        `).run(amount, effectivePurchaseId);
        const remaining = (db.prepare('SELECT totalAmount - paidAmount AS r FROM supplier_purchases WHERE id = ?').get(effectivePurchaseId) as any);
        if (remaining && remaining.r <= 0) {
          db.prepare("UPDATE supplier_purchases SET status = 'received' WHERE id = ? AND status NOT IN ('cancelled')").run(effectivePurchaseId);
        }
      }
      return res.lastInsertRowid;
    });
    const id = insertTxn();
    logActivity('created', 'supplier_payment', Number(id), `Recorded payment of ${amount} via ${data.paymentMethod}`);
    logSupplierActivity(data.supplierId, 'payment_recorded', 'supplier_payment', Number(id), `Payment of ${amount} recorded via ${data.paymentMethod}`);
    return { id };
  });

  ipcMain.handle('update-supplier-payment', (_, id: number, data: any) => {
    const oldPayment = db.prepare('SELECT * FROM supplier_payments WHERE id = ?').get(id) as any;
    if (!oldPayment) throw new Error('Payment not found');
    const amount = validatePositive(data.amount, 'Amount');
    const validMethods = ['cash', 'bank_transfer', 'mobile_money', 'check', 'other'];
    if (!validMethods.includes(data.paymentMethod)) throw new Error('Invalid payment method');
    const purchaseId = data.purchaseId ? Number(data.purchaseId) : oldPayment.purchaseId;
    const updateTxn = db.transaction(() => {
      db.prepare(`
        UPDATE supplier_payments SET
          paymentDate = ?, referenceNumber = ?, amount = ?,
          paymentMethod = ?, notes = ?, purchaseId = ?
        WHERE id = ?
      `).run(
        data.paymentDate, data.referenceNumber || null, amount,
        data.paymentMethod, data.notes || null, purchaseId, id
      );
      if (purchaseId) {
        const totalPaid = (db.prepare('SELECT COALESCE(SUM(amount), 0) AS tp FROM supplier_payments WHERE purchaseId = ? AND id != ?').get(purchaseId, id) as any).tp;
        const newPaid = totalPaid + amount;
        db.prepare('UPDATE supplier_purchases SET paidAmount = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(newPaid, purchaseId);
        const remaining = (db.prepare('SELECT totalAmount - paidAmount AS r FROM supplier_purchases WHERE id = ?').get(purchaseId) as any);
        if (remaining && remaining.r <= 0) {
          db.prepare("UPDATE supplier_purchases SET status = 'received' WHERE id = ? AND status NOT IN ('cancelled')").run(purchaseId);
        } else if (remaining && remaining.r > 0) {
          db.prepare("UPDATE supplier_purchases SET status = 'pending' WHERE id = ? AND status = 'received'").run(purchaseId);
        }
      }
    });
    updateTxn();
    logActivity('updated', 'supplier_payment', id, `Updated payment`);
    return { success: true };
  });

  ipcMain.handle('delete-supplier-payment', (_, id: number) => {
    const payment = db.prepare('SELECT * FROM supplier_payments WHERE id = ?').get(id) as any;
    if (!payment) throw new Error('Payment not found');
    const reverse = db.transaction(() => {
      db.prepare('DELETE FROM supplier_payments WHERE id = ?').run(id);
      if (payment.purchaseId) {
        const totalPaid = (db.prepare('SELECT COALESCE(SUM(amount), 0) AS tp FROM supplier_payments WHERE purchaseId = ?').get(payment.purchaseId) as any).tp;
        db.prepare('UPDATE supplier_purchases SET paidAmount = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(totalPaid, payment.purchaseId);
      }
    });
    reverse();
    logActivity('deleted', 'supplier_payment', id, `Deleted payment of ${payment.amount}`);
    return { success: true };
  });

  // ========== SUPPLIER PRODUCTS ==========
  ipcMain.handle('get-supplier-products', (_, supplierId: number) => {
    return db.prepare(`
      SELECT
        COALESCE(spi.itemId, i.id) AS productId,
        COALESCE(spi.itemName, i.name) AS itemName,
        spi.sku,
        MAX(COALESCE(sp.purchaseDate, i.lastPurchaseDate)) AS lastPurchaseDate,
        COALESCE(spi.unitPrice, i.lastPurchasePrice, i.basePurchasePrice) AS lastPurchasePrice,
        COALESCE(AVG(spi.unitPrice), i.basePurchasePrice) AS avgPurchasePrice,
        COALESCE(SUM(spi.quantity), 0) AS totalPurchased,
        COALESCE(i.totalBaseQuantity, 0) AS currentStock
      FROM items i
      LEFT JOIN supplier_purchase_items spi ON spi.itemId = i.id
      LEFT JOIN supplier_purchases sp ON sp.id = spi.purchaseId AND sp.supplierId = ? AND sp.status != 'cancelled'
      WHERE i.supplierId = ? AND i.is_deleted = 0
      GROUP BY i.id
      ORDER BY lastPurchaseDate DESC, i.name ASC
    `).all(supplierId, supplierId);
  });

  // ========== SUPPLIER BALANCES / REPORTS ==========
  ipcMain.handle('get-supplier-balance', (_, supplierId: number) => {
    const totals = db.prepare(`
      SELECT
        COALESCE(SUM(totalAmount), 0) AS totalDue,
        COALESCE(SUM(paidAmount), 0) AS totalPaid,
        COALESCE(SUM(totalAmount - paidAmount), 0) AS remaining,
        SUM(CASE WHEN status != 'cancelled' AND dueDate IS NOT NULL AND dueDate < DATE('now') AND (totalAmount - paidAmount) > 0
              THEN (totalAmount - paidAmount) ELSE 0 END) AS overdue
      FROM supplier_purchases WHERE supplierId = ?
    `).get(supplierId) as any;
    return totals;
  });

  ipcMain.handle('toggle-supplier-favorite', (_, id: number) => {
    const current = db.prepare('SELECT isFavorite FROM suppliers WHERE id = ?').get(id) as any;
    const newVal = current?.isFavorite ? 0 : 1;
    db.prepare('UPDATE suppliers SET isFavorite = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(newVal, id);
    return { success: true, isFavorite: !!newVal };
  });

  ipcMain.handle('get-supplier-activity-log', (_, supplierId: number, limit = 20) => {
    return db.prepare(`
      SELECT * FROM supplier_activity_log WHERE supplierId = ? ORDER BY createdAt DESC LIMIT ?
    `).all(supplierId, limit);
  });

  ipcMain.handle('get-supplier-analytics', (_) => {
    const bizId = getActiveBusinessId();
    const topSuppliers = db.prepare(`
      SELECT s.id, s.supplierName, COALESCE(SUM(sp.totalAmount), 0) AS totalValue,
        COUNT(sp.id) AS purchaseCount, MAX(sp.purchaseDate) AS lastPurchase
      FROM suppliers s
      LEFT JOIN supplier_purchases sp ON sp.supplierId = s.id
      WHERE s.businessId = ? AND s.isActive = 1
      GROUP BY s.id
      HAVING totalValue > 0
      ORDER BY totalValue DESC LIMIT 10
    `).all(bizId);
    const monthlyTrends = db.prepare(`
      SELECT strftime('%Y-%m', purchaseDate) AS month,
        COUNT(*) AS purchaseCount, COALESCE(SUM(totalAmount), 0) AS totalAmount
      FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId
      WHERE s.businessId = ? AND purchaseDate >= DATE('now', '-12 months')
      GROUP BY month ORDER BY month
    `).all(bizId);
    const outstandingBySupplier = db.prepare(`
      SELECT s.supplierName, COALESCE(SUM(sp.totalAmount - sp.paidAmount), 0) AS outstanding
      FROM suppliers s
      LEFT JOIN supplier_purchases sp ON sp.supplierId = s.id
      WHERE s.businessId = ? AND s.isActive = 1
      GROUP BY s.id HAVING outstanding > 0 ORDER BY outstanding DESC
    `).all(bizId);
    const avgPurchase = db.prepare(`
      SELECT COALESCE(AVG(totalAmount), 0) AS avgValue FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId WHERE s.businessId = ?
    `).get(bizId) as any;
    const summary = db.prepare(`
      SELECT
        COUNT(*) AS totalSuppliers,
        SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) AS activeSuppliers,
        COALESCE((SELECT COUNT(*) FROM supplier_purchases sp JOIN suppliers s ON s.id = sp.supplierId WHERE s.businessId = ? AND sp.purchaseDate >= DATE('now', '-30 days')), 0) AS purchasesThisMonth
      FROM suppliers WHERE businessId = ?
    `).get(bizId, bizId) as any;
    return { topSuppliers, monthlyTrends, outstandingBySupplier, avgPurchase: avgPurchase?.avgValue || 0, summary };
  });

  ipcMain.handle('get-supplier-aging-report', () => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT
        s.id AS supplierId, s.supplierName, s.companyName, s.phone,
        SUM(CASE WHEN sp.dueDate >= DATE('now') OR sp.dueDate IS NULL THEN sp.totalAmount - sp.paidAmount ELSE 0 END) AS current_due,
        SUM(CASE WHEN sp.dueDate < DATE('now') AND sp.dueDate >= DATE('now', '-30 days') THEN sp.totalAmount - sp.paidAmount ELSE 0 END) AS days_1_30,
        SUM(CASE WHEN sp.dueDate < DATE('now', '-30 days') AND sp.dueDate >= DATE('now', '-60 days') THEN sp.totalAmount - sp.paidAmount ELSE 0 END) AS days_31_60,
        SUM(CASE WHEN sp.dueDate < DATE('now', '-60 days') AND sp.dueDate >= DATE('now', '-90 days') THEN sp.totalAmount - sp.paidAmount ELSE 0 END) AS days_61_90,
        SUM(CASE WHEN sp.dueDate < DATE('now', '-90 days') THEN sp.totalAmount - sp.paidAmount ELSE 0 END) AS days_over_90,
        SUM(sp.totalAmount - sp.paidAmount) AS total_outstanding
      FROM suppliers s
      JOIN supplier_purchases sp ON sp.supplierId = s.id
      WHERE sp.status != 'cancelled' AND (sp.totalAmount - sp.paidAmount) > 0 AND s.businessId = ?
      GROUP BY s.id
      ORDER BY total_outstanding DESC
    `).all(bizId);
  });

  ipcMain.handle('get-supplier-dashboard-stats', () => {
    const bizId = getActiveBusinessId();
    const stats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM suppliers WHERE businessId = ? AND isActive = 1) AS activeSuppliers,
        (SELECT COUNT(*) FROM suppliers WHERE businessId = ?) AS totalSuppliers,
        (SELECT COALESCE(SUM(totalAmount - paidAmount), 0) FROM supplier_purchases WHERE businessId = ? AND status != 'cancelled') AS outstandingBalance,
        (SELECT COALESCE(SUM(totalAmount), 0) FROM supplier_purchases WHERE businessId = ? AND purchaseDate >= DATE('now', 'start of month')) AS monthPurchases
    `).get(bizId, bizId, bizId, bizId) as any;
    const top = db.prepare(`
      SELECT s.id, s.supplierName, COALESCE(SUM(sp.totalAmount), 0) AS totalValue
      FROM suppliers s
      JOIN supplier_purchases sp ON sp.supplierId = s.id
      WHERE s.businessId = ?
      GROUP BY s.id
      ORDER BY totalValue DESC LIMIT 1
    `).get(bizId) as any;
    const recent = db.prepare(`
      SELECT id, supplierName, companyName, createdAt FROM suppliers
      WHERE businessId = ? ORDER BY createdAt DESC LIMIT 5
    `).all(bizId);
    return { ...stats, topSupplier: top || null, recent };
  });

  ipcMain.handle('get-supplier-monthly-report', () => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT
        strftime('%Y-%m', purchaseDate) AS month,
        COUNT(*) AS purchaseCount,
        SUM(totalAmount) AS totalAmount,
        SUM(paidAmount) AS paidAmount,
        SUM(totalAmount - paidAmount) AS outstanding
      FROM supplier_purchases
      WHERE status != 'cancelled' AND businessId = ?
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `).all(bizId);
  });

  ipcMain.handle('get-top-suppliers', (_, limit: number = 10) => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT s.id, s.supplierName, s.companyName, s.phone,
        COUNT(sp.id) AS purchaseCount,
        COALESCE(SUM(sp.totalAmount), 0) AS totalValue,
        COALESCE(SUM(sp.paidAmount), 0) AS totalPaid,
        COALESCE(SUM(sp.totalAmount - sp.paidAmount), 0) AS outstanding,
        MAX(sp.purchaseDate) AS lastPurchaseDate
      FROM suppliers s
      LEFT JOIN supplier_purchases sp ON sp.supplierId = s.id
      WHERE s.businessId = ?
      GROUP BY s.id
      HAVING totalValue > 0
      ORDER BY totalValue DESC
      LIMIT ?
    `).all(bizId, limit);
  });

  // ========== TEST DATA GENERATION ==========
  ipcMain.handle('generate-test-suppliers', (_, count: number) => {
    if (![100, 1000, 10000].includes(count)) throw new Error('Count must be 100, 1000, or 10000');
    const bizId = getActiveBusinessId();
    const cities = ['Addis Ababa', 'Dire Dawa', 'Hawassa', 'Bahir Dar', 'Mekelle', 'Adama', 'Gondar', 'Jimma'];
    const countries = ['Ethiopia', 'Kenya', 'UAE', 'China', 'Turkey', 'India'];
    const methods = ['cash', 'bank_transfer', 'mobile_money', 'check'];
    const statuses = ['active', 'inactive'];
    const gen = db.transaction(() => {
      const insert = db.prepare(`
        INSERT INTO suppliers (
          businessId, supplierCode, supplierName, companyName, contactPerson,
          phone, email, city, country, taxNumber, paymentTerms, creditLimit, status, isActive
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);
      const insertPurchase = db.prepare(`
        INSERT INTO supplier_purchases (
          businessId, supplierId, purchaseNumber, purchaseDate,
          totalAmount, paidAmount, dueDate, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertPayment = db.prepare(`
        INSERT INTO supplier_payments (
          businessId, supplierId, purchaseId, paymentDate, amount, paymentMethod
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (let i = 0; i < count; i++) {
        const name = `Test Supplier ${i + 1}`;
        const code = `TSUP-${String(i + 1).padStart(6, '0')}`;
        const status = statuses[i % 8 === 0 ? 1 : 0];
        const isActive = status === 'active' ? 1 : 0;
        const supRes = insert.run(
          bizId, code, name, `${name} Co.`, `Contact ${i + 1}`,
          `+2519${String(10000000 + i).slice(-8)}`,
          `supplier${i + 1}@test.com`,
          cities[i % cities.length],
          countries[i % countries.length],
          `TAX-${1000 + i}`,
          ['Net 30', 'Net 60', 'Cash on Delivery', 'Net 15'][i % 4],
          (i % 10) * 10000,
          status
        );
        const supplierId = Number(supRes.lastInsertRowid);
        // Create 1-5 purchases per supplier
        const purchases = (i % 5) + 1;
        for (let p = 0; p < purchases; p++) {
          const total = 1000 + ((i * 13 + p * 7) % 50000);
          const paid = (i % 3 === 0) ? 0 : (p % 2 === 0 ? total : total * 0.7);
          const date = new Date(Date.now() - (i + p) * 86400000 * 3).toISOString();
          const dueDate = new Date(Date.now() + (30 - p * 7) * 86400000).toISOString();
          const purRes = insertPurchase.run(
            bizId, supplierId, `${code}-P${p + 1}`, date,
            total, paid, dueDate,
            paid >= total ? 'received' : 'pending'
          );
          // Add a payment for 30% of suppliers
          if (i % 3 === 0 && p === 0) {
            insertPayment.run(
              bizId, supplierId, Number(purRes.lastInsertRowid),
              date, paid, methods[i % methods.length]
            );
          }
        }
      }
    });
    gen();
    logActivity('test_data', 'supplier', undefined, `Generated ${count} test suppliers`);
    return { success: true, count };
  });

  ipcMain.handle('clear-test-suppliers', () => {
    const bizId = getActiveBusinessId();
    const result = db.prepare(`DELETE FROM suppliers WHERE businessId = ? AND supplierCode LIKE 'TSUP-%'`).run(bizId);
    return { deleted: result.changes };
  });

  // ========== COMPREHENSIVE TEST DATA GENERATOR ==========

  const REAL_FIRST_NAMES = ['Abebe','Almaz','Biruk','Chaltu','Dawit','Eden','Frehiwot','Girma','Hana','Ibrahim','Jemila','Kebede','Lemlem','Mekdes','Nigist','Obsa','Paschal','Rahma','Sisay','Tigist','Umer','Winta','Yonas','Zerihun','Amina','Bontu','Daniel','Eyerusalem','Fikadu','Genet','Hussein','Ismail','Jalene','Keneni','Lensa','Mulu','Nardos','Oliyad','Priya','Selam','Teshome','Mahlet','Birhane','Tizita','Mahder','Biniyam','Amanuel','Meron','Simon','Yordanos','Haben','Samiya','Addis','Beki','Chernet','Desta','Elias','Feven','Gebre','Hiwot'];
  const REAL_LAST_NAMES = ['Kebede','Tadesse','Wondimu','Alemu','Bekele','Mengistu','Tesfaye','Hailu','Desta','Fikru','Girma','Hunde','Jemal','Kassa','Lemma','Mamo','Nigussie','Obsi','Petros','Reda','Sisay','Tekle','Uggaz','Worku','Yeshitla','Zeleke','Assefa','Berhe','Cherkos','Demeke','Endale','Fanta','Gizaw','Haile','Ibrahim','Kinfu','Lema','Mekonnen','Negash','Oli','Asfaw','Belayneh','Dagne','Eshetu','Fisseha','Gebremedhin','Hagos','Jote','Kebede','Legesse','Mesfin','Nega','Shiferaw','Tamerat','Woldie'];
  const PRODUCT_PREFIXES = ['Premium','Organic','Deluxe','Standard','Economy','Professional','Natural','Classic','Ultra','Fine'];
  const PRODUCT_TYPES = ['Coffee Beans','Tea Leaves','Honey','Cooking Oil','Rice','Wheat Flour','Sugar','Spice Mix','Bar Soap','Detergent','Bread','Butter','Cheese','Fruit Juice','Mineral Water','Pasta','Cereal','Sauce','Seasoning','Milk','Yogurt','Biscuit','Chocolate','Salt','Pasta','Lentils','Spaghetti','Ketchup','Jam','Olive Oil'];
  const PRODUCT_SIZES = ['1kg','500g','250g','2kg','5kg','1L','500ml','250ml','2L','100g','200g','50g','750ml','3kg','10kg','150g','300g','4L','20kg'];
  const CATEGORY_NAMES = ['Electronics','Clothing & Apparel','Food & Beverages','Beverages','Household','Personal Care','Pharmaceuticals','Office Supplies','Building Materials','Agriculture','Cleaning Supplies','Sporting Goods','Books & Media','Automotive','Baby Products','Furniture','Stationery','Cosmetics','Pet Supplies','Gardening'];
  const SUPPLIER_COMPANIES = ['Ethio Supply Co.','Global Trading PLC','Highland Distributors','Unity Imports','Sheba Trading','Habesha Wholesale','Addis Merchants','Nile River Trading','Axum Commercial','Lalibela Distributors','Rift Valley Enterprises','Zemen Trading','Abay Import Export','Terara Trading','Wabi Shebelle Co.'];
  const EXPENSE_CATEGORIES = ['Rent','Utilities - Electric','Utilities - Water','Salaries & Wages','Transportation','Office Supplies','Marketing & Ads','Maintenance','Insurance','Taxes','Communication','Equipment Lease','Cleaning Services','Security Services','Employee Training','Software Licenses','Bank Charges','Professional Fees','Stationery','Refreshments'];
  const CITIES = ['Addis Ababa','Dire Dawa','Hawassa','Bahir Dar','Mekelle','Adama','Gondar','Jimma','Dessie','Shashamane','Bishoftu','Arba Minch','Harar','Jijiga','Nekemte','Debre Markos','Adigrat','Wolaita Sodo','Assosa','Gambela'];
  const PAYMENT_METHODS = ['cash','bank_transfer','mobile_money','check','card'];
  const PAYMENT_STATUSES = ['paid','credit','partial'];
  const ITEM_UNITS = ['pcs','kg','L','pack','box','bottle','bag','tin','carton','roll'];

  const BATCH_SIZE = 250;

  const randomDate = (daysBack = 365) => {
    const now = Date.now();
    const past = now - daysBack * 86400000;
    return new Date(past + Math.random() * (now - past)).toISOString();
  };

  const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const pick = <T>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];

  ipcMain.handle('generate-test-data', async (event, count: number) => {
    if (![10, 100, 1000, 10000].includes(count)) throw new Error('Count must be 10, 100, or 10000');
    const startTime = Date.now();
    const bizId = getActiveBusinessId();
    const batchId = crypto.randomUUID();
    const phases: { name: string; count: number; time: number }[] = [];
    let globalProgress = 0;

    const scale = (factor: number) => Math.max(1, Math.round(count * factor));
    const phasePlans = [
      { name: 'categories', total: Math.min(15, count) },
      { name: 'items', total: scale(0.35) },
      { name: 'suppliers', total: scale(0.1) },
      { name: 'sales', total: scale(0.25) },
      { name: 'expenses', total: scale(0.12) },
      { name: 'employees', total: scale(0.05) },
      { name: 'stock_movements', total: scale(0.15) },
      { name: 'notifications', total: scale(0.06) },
      { name: 'activity_logs', total: scale(0.1) },
    ];
    const grandTotal = phasePlans.reduce((s, p) => s + p.total, 0);

    // Ensure test_data_tags table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS test_data_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id TEXT NOT NULL,
        table_name TEXT NOT NULL,
        row_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_test_data_tags_batch ON test_data_tags(batch_id);
    `);

    const tagStmt = db.prepare('INSERT INTO test_data_tags (batch_id, table_name, row_id) VALUES (?, ?, ?)');

    const sendProgress = (phase: string, current: number, total: number, message: string) => {
      const soFar = globalProgress + Math.min(current, total);
      const pct = grandTotal > 0 ? Math.min(100, Math.round((soFar / grandTotal) * 100)) : 0;
      try { event.sender.send('test-data-progress', { phase, current, total, message, totalCreated: soFar, overallPercent: pct }); } catch (_) {}
    };

    const runBatch = async (total: number, phaseName: string, fn: (start: number, end: number) => void): Promise<number> => {
      if (total === 0) return 0;
      const ts = Date.now();
      let inserted = 0;
      for (let s = 0; s < total; s += BATCH_SIZE) {
        const e = Math.min(s + BATCH_SIZE, total);
        (db.transaction(() => fn(s, e)))();
        inserted += (e - s);
        globalProgress += (e - s);
        sendProgress(phaseName, inserted, total, `Generating ${phaseName}...`);
        await new Promise(resolve => setImmediate(resolve));
      }
      phases.push({ name: phaseName, count: inserted, time: Date.now() - ts });
      return inserted;
    };

    // ── Phase 1: Categories ──
    let catIds: number[] = [];
    {
      const catTotal = phasePlans[0].total;
      const insert = db.prepare('INSERT INTO categories (businessId, name, icon, isCustom, uuid) VALUES (?, ?, ?, 1, ?)');
      const tx = db.transaction(() => {
        for (let i = 0; i < catTotal; i++) {
          const name = CATEGORY_NAMES[i % CATEGORY_NAMES.length];
          const r = insert.run(bizId, name, pick(['Box','Tag','ShoppingBag','Wrench','Heart','Star','Book','Monitor','Shirt','Home']), crypto.randomUUID());
          catIds.push(Number(r.lastInsertRowid));
          tagStmt.run(batchId, 'categories', Number(r.lastInsertRowid));
        }
      });
      tx();
      globalProgress += catTotal;
      phases.push({ name: 'categories', count: catTotal, time: 0 });
    }

    // ── Phase 2: Items ──
    const itemIds: number[] = [];
    {
      const total = phasePlans[1].total;
      const insert = db.prepare(`INSERT INTO items (businessId, name, categoryId, companyName, purchaseUnit, baseUnit, unitsPerPack, totalPackQuantity, totalBaseQuantity, packPurchasePrice, basePurchasePrice, baseSellingPrice, packSellingPrice, expiryDate, notes, createdAt, uuid, updated_at, is_deleted, is_synced) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,0,1)`);
      await runBatch(total, 'items', (s, e) => {
        for (let i = s; i < e; i++) {
          const catId = catIds[i % catIds.length];
          const name = `${pick(PRODUCT_PREFIXES)} ${pick(PRODUCT_TYPES)} ${pick(PRODUCT_SIZES)}`;
          const unit = pick(ITEM_UNITS);
          const qty = count <= 100 ? randomInt(10, 500) : randomInt(0, 1000);
          const bp = randomInt(10, 2000);
          const sp = bp + randomInt(5, 500);
          const packQty = randomInt(1, 20);
          const expDays = i % 10 === 0 ? -randomInt(1, 60) : randomInt(30, 400);
          const expDate = new Date(Date.now() + expDays * 86400000).toISOString();
          const r = insert.run(bizId, name, catId, pick(SUPPLIER_COMPANIES), unit, unit, randomInt(1, 24), packQty, qty, bp * randomInt(1, 10), bp, sp, sp * randomInt(1, 10), expDate, `Generated test item ${i + 1}`, randomDate(), crypto.randomUUID());
          const id = Number(r.lastInsertRowid);
          itemIds.push(id);
          tagStmt.run(batchId, 'items', id);
        }
      });
    }

    // ── Phase 3: Suppliers ──
    const supplierIds: number[] = [];
    {
      const total = phasePlans[2].total;
      const insert = db.prepare(`INSERT INTO suppliers (businessId, supplierCode, supplierName, companyName, contactPerson, phone, email, city, country, taxNumber, paymentTerms, creditLimit, status, isActive, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)`);
      runBatch(total, 'suppliers', (s, e) => {
        for (let i = s; i < e; i++) {
          const name = `Test Supplier ${i + 1}`;
          const code = `TST-SUP-${String(i + 1).padStart(6, '0')}`;
          const contact = `${pick(REAL_FIRST_NAMES)} ${pick(REAL_LAST_NAMES)}`;
          const r = insert.run(bizId, code, name, `${name} ${pick(['Trading','PLC','Co.','Enterprise','Import'])}, ${pick(SUPPLIER_COMPANIES)}`, contact, `+2519${String(90000000 + i).slice(-8)}`, `supplier${i+1}@test.com`, pick(CITIES), pick(['Ethiopia','Kenya','UAE','China','India']), `TAX-${10000 + i}`, pick(['Net 30','Net 60','Cash on Delivery','Net 15']), (i % 10) * 5000, pick(['active','active','active','inactive']), randomDate());
          supplierIds.push(Number(r.lastInsertRowid));
          tagStmt.run(batchId, 'suppliers', Number(r.lastInsertRowid));
        }
      });
    }

    // ── Phase 4: Sales ──
    const customerNames: string[] = [];
    {
      const total = phasePlans[3].total;
      // Generate some customer names
      for (let i = 0; i < Math.min(count, 200); i++) {
        if (customerNames.length < Math.min(count, 200)) customerNames.push(`${pick(REAL_FIRST_NAMES)} ${pick(REAL_LAST_NAMES)}`);
      }
      const insert = db.prepare(`INSERT INTO sales (businessId, itemId, quantity, unit, unitType, totalPrice, paymentMethod, paymentStatus, customerName, customerPhone, dueDate, paidAmount, createdBy, createdAt, uuid, updated_at, is_deleted, is_synced) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,0,1)`);
      await runBatch(total, 'sales', (s, e) => {
        for (let i = s; i < e; i++) {
          const itemId = pick(itemIds);
          const qty = randomInt(1, 10);
          const unitPrice = randomInt(15, 3000);
          const totalPrice = qty * unitPrice;
          const isCredit = i % 4 === 0;
          const paidAmount = isCredit ? randomInt(0, Math.floor(totalPrice * 0.5)) : totalPrice;
          const payStatus = isCredit ? 'credit' : 'paid';
          const custName = pick(customerNames);
          const r = insert.run(bizId, itemId, qty, pick(ITEM_UNITS), 'pcs', totalPrice, pick(PAYMENT_METHODS), payStatus, custName, `+2519${String(70000000 + i).slice(-8)}`, isCredit ? new Date(Date.now() + randomInt(15, 90) * 86400000).toISOString() : null, paidAmount, 'Test Data Generator', randomDate(365), crypto.randomUUID());
          tagStmt.run(batchId, 'sales', Number(r.lastInsertRowid));
        }
      });
    }

    // ── Phase 5: Expenses ──
    {
      const total = phasePlans[4].total;
      const insert = db.prepare(`INSERT INTO expenses (businessId, name, amount, category, date, createdAt, uuid, updated_at, is_deleted, is_synced) VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP,0,1)`);
      await runBatch(total, 'expenses', (s, e) => {
        for (let i = s; i < e; i++) {
          const cat = pick(EXPENSE_CATEGORIES);
          const amount = randomInt(50, 50000);
          const d = randomDate(365);
          insert.run(bizId, `${cat} - ${cat} Payment ${i + 1}`, amount, cat, d, d, crypto.randomUUID());
        }
      });
    }

    // ── Phase 6: Employees ──
    const employeeIds: number[] = [];
    {
      const total = phasePlans[5].total;
      const insert = db.prepare(`INSERT INTO employees (employeeCode, firstName, lastName, phone, email, department, isActive, hireDate, createdAt, updatedAt) VALUES (?,?,?,?,?,?,1,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
      await runBatch(total, 'employees', (s, e) => {
        for (let i = s; i < e; i++) {
          const fn = pick(REAL_FIRST_NAMES);
          const ln = pick(REAL_LAST_NAMES);
          const dept = pick(['Sales','Inventory','Accounting','HR','Management','Logistics','Customer Service','IT']);
          const code = `TST-EMP-${String(i + 1).padStart(5, '0')}`;
          const r = insert.run(code, fn, ln, `+2519${String(80000000 + i).slice(-8)}`, `${fn.toLowerCase()}.${ln.toLowerCase()}@test.com`, dept, randomDate(730));
          employeeIds.push(Number(r.lastInsertRowid));
          tagStmt.run(batchId, 'employees', Number(r.lastInsertRowid));
        }
      });
    }

    // ── Phase 7: Stock Movements ──
    {
      const total = phasePlans[6].total;
      const insert = db.prepare(`INSERT INTO stock_movements (itemId, type, quantity, referenceType, notes, createdAt) VALUES (?,?,?,?,?,?)`);
      await runBatch(total, 'stock_movements', (s, e) => {
        for (let i = s; i < e; i++) {
          const itemId = pick(itemIds);
          const qty = randomInt(1, 100);
          const type = pick(['in','out','in','in','adjustment']);
          const refType = type === 'in' ? 'purchase' : 'sale';
          insert.run(itemId, type, qty, refType, `Test ${type} movement ${i + 1}`, randomDate(365));
        }
      });
    }

    // ── Phase 8: Notifications ──
    {
      const total = phasePlans[7].total;
      const insert = db.prepare(`INSERT INTO notifications (businessId, title, message, type, isRead, category, severity, channels, createdAt) VALUES (?,?,?,?,?,?,?,?,?)`);
      await runBatch(total, 'notifications', (s, e) => {
        for (let i = s; i < e; i++) {
          const cat = pick(['inventory','sales','system','employees','customers','suppliers']);
          const sev = pick(['info','info','info','warning','error']);
          insert.run(bizId, `Test Notification ${i + 1}`, `This is generated test notification #${i + 1} in category ${cat}`, cat, i % 3 === 0 ? 1 : 0, cat, sev, 'in_app', randomDate(365));
        }
      });
    }

    // ── Phase 9: Activity Logs ──
    {
      const total = phasePlans[8].total;
      const insert = db.prepare(`INSERT INTO activity_logs (employeeId, action, entityType, entityId, details, createdAt) VALUES (?,?,?,?,?,?)`);
      await runBatch(total, 'activity_logs', (s, e) => {
        for (let i = s; i < e; i++) {
          const empId = employeeIds.length > 0 ? pick(employeeIds) : null;
          const actions = pick(['create','update','delete','read','login','export','print','approve']);
          const entityType = pick(['item','sale','expense','supplier','employee','customer','notification']);
          insert.run(empId, actions, entityType, randomInt(1, 1000), `Test ${actions} on ${entityType} #${i + 1}`, randomDate(365));
        }
      });
    }

    const duration = Date.now() - startTime;
    logActivity('test_data', 'system', undefined, `Generated ${globalProgress} test records in ${duration}ms (batch: ${batchId})`);
    return { success: true, totalCreated: globalProgress, duration, phases };
  });

  ipcMain.handle('clear-test-data', () => {
    const ts = Date.now();
    const tables = ['activity_logs','notifications','stock_movements','employees','expenses','sales','suppliers','items','categories'];
    const deletions: Record<string, number> = {};
    const tags = db.prepare('SELECT DISTINCT table_name, row_id FROM test_data_tags').all() as any[];
    const grouped: Record<string, number[]> = {};
    for (const t of tags) {
      if (!grouped[t.table_name]) grouped[t.table_name] = [];
      grouped[t.table_name].push(t.row_id);
    }
    const delTx = db.transaction(() => {
      for (const table of tables) {
        const ids = grouped[table];
        if (!ids || ids.length === 0) continue;
        // Delete in chunks to avoid SQL limit issues
        for (let i = 0; i < ids.length; i += 500) {
          const chunk = ids.slice(i, i + 500);
          const placeholders = chunk.map(() => '?').join(',');
          const r = db.prepare(`DELETE FROM ${table} WHERE id IN (${placeholders})`).run(...chunk);
          deletions[table] = (deletions[table] || 0) + r.changes;
        }
      }
      db.prepare('DELETE FROM test_data_tags').run();
    });
    delTx();
    const totalDeleted = Object.values(deletions).reduce((s: number, v: number) => s + v, 0);
    logActivity('test_data', 'system', undefined, `Cleared ${totalDeleted} test records in ${Date.now() - ts}ms`);
    return { deleted: totalDeleted, duration: Date.now() - ts, details: deletions };
  });

  ipcMain.handle('measure-performance', () => {
    const results: Record<string, number> = {};
    let t: number;

    t = Date.now();
    db.prepare('SELECT COUNT(*) as c FROM items').get();
    results.itemsCount = Date.now() - t;

    t = Date.now();
    db.prepare('SELECT COUNT(*) as c FROM sales').get();
    results.salesCount = Date.now() - t;

    t = Date.now();
    const customers = db.prepare('SELECT DISTINCT customerName FROM sales LIMIT 100').all();
    results.customersQuery = Date.now() - t;

    t = Date.now();
    db.prepare('SELECT COUNT(*) as c FROM suppliers').get();
    results.suppliersCount = Date.now() - t;

    t = Date.now();
    db.prepare('SELECT COUNT(*) as c FROM categories').get();
    results.categoriesCount = Date.now() - t;

    t = Date.now();
    db.prepare('SELECT COUNT(*) as c FROM expenses').get();
    results.expensesCount = Date.now() - t;

    t = Date.now();
    db.prepare('SELECT COUNT(*) as c FROM employees').get();
    results.employeesCount = Date.now() - t;

    t = Date.now();
    const items = db.prepare('SELECT * FROM items ORDER BY id DESC LIMIT 50').all();
    results.itemsListQuery = Date.now() - t;

    t = Date.now();
    const sales = db.prepare(`
      SELECT s.*, i.name as itemName 
      FROM sales s LEFT JOIN items i ON s.itemId = i.id 
      ORDER BY s.id DESC LIMIT 50
    `).all();
    results.salesListQuery = Date.now() - t;

    t = Date.now();
    const agg = db.prepare(`
      SELECT COALESCE(SUM(totalPrice),0) as rev, COALESCE(SUM(paidAmount),0) as collected,
        COUNT(*) as txns, COUNT(DISTINCT customerName) as customers
      FROM sales WHERE createdAt >= date('now','-30 days')
    `).get();
    results.dashboardAggQuery = Date.now() - t;

    return results;
  });

  // --- Receipt Printing ---

  // ========== DRAFT SALES ==========
  ipcMain.handle('get-draft-sales', () => {
    const bizId = getActiveBusinessId();
    return db.prepare('SELECT * FROM draft_sales WHERE businessId = ? ORDER BY createdAt DESC').all(bizId);
  });

  ipcMain.handle('get-draft-sale', (_, id: number) => {
    return db.prepare('SELECT * FROM draft_sales WHERE id = ?').get(id);
  });

  ipcMain.handle('save-draft-sale', (_, data: any) => {
    const bizId = getActiveBusinessId();
    if (data.id) {
      db.prepare('UPDATE draft_sales SET items = ?, customerName = ?, customerPhone = ?, discount = ?, vat = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?')
        .run(JSON.stringify(data.items), data.customerName || null, data.customerPhone || null, data.discount || 0, data.vat || 0, data.notes || null, data.id, bizId);
      return { success: true };
    }
    const r = db.prepare('INSERT INTO draft_sales (businessId, items, customerName, customerPhone, discount, vat, notes) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(bizId, JSON.stringify(data.items), data.customerName || null, data.customerPhone || null, data.discount || 0, data.vat || 0, data.notes || null);
    return { success: true, id: r.lastInsertRowid };
  });

  ipcMain.handle('delete-draft-sale', (_, id: number) => {
    const bizId = getActiveBusinessId();
    return db.prepare('DELETE FROM draft_sales WHERE id = ? AND businessId = ?').run(id, bizId);
  });

  // ========== CONTACTS ==========
  ipcMain.handle('get-contacts', (_, options?: any) => {
    const bizId = getActiveBusinessId();
    let q = 'SELECT * FROM contacts WHERE businessId = ?';
    const params: any[] = [bizId];
    if (options?.category) { q += ' AND category = ?'; params.push(options.category); }
    q += ' ORDER BY name ASC';
    return db.prepare(q).all(...params);
  });

  ipcMain.handle('insert-contact', (_, data: any) => {
    const bizId = getActiveBusinessId();
    const r = db.prepare('INSERT INTO contacts (businessId, name, phone, category, subCategory, notes) VALUES (?, ?, ?, ?, ?, ?)')
      .run(bizId, data.name, data.phone, data.category || 'other', data.subCategory || null, data.notes || null);
    logActivity('insert', 'contact', r.lastInsertRowid, `Contact "${data.name}" added`);
    return { success: true, id: r.lastInsertRowid };
  });

  ipcMain.handle('update-contact', (_, id: number, data: any) => {
    const bizId = getActiveBusinessId();
    db.prepare('UPDATE contacts SET name = ?, phone = ?, category = ?, subCategory = ?, notes = ? WHERE id = ? AND businessId = ?')
      .run(data.name, data.phone, data.category || 'other', data.subCategory || null, data.notes || null, id, bizId);
    logActivity('update', 'contact', id, `Contact "${data.name}" updated`);
    return { success: true };
  });

  ipcMain.handle('delete-contact', (_, id: number) => {
    const bizId = getActiveBusinessId();
    db.prepare('DELETE FROM contacts WHERE id = ? AND businessId = ?').run(id, bizId);
    logActivity('delete', 'contact', id, 'Contact deleted');
    return { success: true };
  });

  // ========== BUDGETS ==========
  ipcMain.handle('get-budgets', (_, options?: any) => {
    const bizId = getActiveBusinessId();
    let q = 'SELECT * FROM budgets WHERE businessId = ?';
    const params: any[] = [bizId];
    if (options?.period) { q += ' AND period = ?'; params.push(options.period); }
    if (options?.month) { q += ' AND month = ?'; params.push(options.month); }
    return db.prepare(q).all(...params);
  });

  ipcMain.handle('set-budget', (_, data: any) => {
    const bizId = getActiveBusinessId();
    const existing = db.prepare('SELECT id FROM budgets WHERE businessId = ? AND category = ? AND period = ? AND (month = ? OR month IS NULL)')
      .get(bizId, data.category, data.period || 'monthly', data.month || null);
    if (existing) {
      db.prepare('UPDATE budgets SET amount = ? WHERE id = ?').run(data.amount, (existing as any).id);
      return { success: true, id: (existing as any).id };
    }
    const r = db.prepare('INSERT INTO budgets (businessId, category, amount, period, month, year) VALUES (?, ?, ?, ?, ?, ?)')
      .run(bizId, data.category, data.amount, data.period || 'monthly', data.month || null, data.year || null);
    return { success: true, id: r.lastInsertRowid };
  });

  ipcMain.handle('delete-budget', (_, id: number) => {
    const bizId = getActiveBusinessId();
    return db.prepare('DELETE FROM budgets WHERE id = ? AND businessId = ?').run(id, bizId);
  });

  // ========== SUPPLIER PRICE CHECKS ==========
  ipcMain.handle('get-supplier-price-checks', (_, supplierId?: number) => {
    const bizId = getActiveBusinessId();
    let q = `SELECT spc.*, s.name as supplierName, i.name as itemName 
      FROM supplier_price_checks spc 
      LEFT JOIN suppliers s ON spc.supplierId = s.id 
      LEFT JOIN items i ON spc.itemId = i.id 
      WHERE spc.businessId = ?`;
    const params: any[] = [bizId];
    if (supplierId) { q += ' AND spc.supplierId = ?'; params.push(supplierId); }
    q += ' ORDER BY spc.nextCheck ASC';
    return db.prepare(q).all(...params);
  });

  ipcMain.handle('save-supplier-price-check', (_, data: any) => {
    const bizId = getActiveBusinessId();
    const nextCheck = data.nextCheck || new Date(Date.now() + 7 * 86400000).toISOString();
    if (data.id) {
      db.prepare('UPDATE supplier_price_checks SET supplierId = ?, itemId = ?, frequency = ?, nextCheck = ?, notes = ?, active = ? WHERE id = ? AND businessId = ?')
        .run(data.supplierId, data.itemId || null, data.frequency || 'weekly', nextCheck, data.notes || null, data.active ?? 1, data.id, bizId);
      return { success: true };
    }
    const r = db.prepare('INSERT INTO supplier_price_checks (businessId, supplierId, itemId, frequency, lastChecked, nextCheck, notes, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(bizId, data.supplierId, data.itemId || null, data.frequency || 'weekly', data.lastChecked || null, nextCheck, data.notes || null, data.active ?? 1);
    return { success: true, id: r.lastInsertRowid };
  });

  ipcMain.handle('delete-supplier-price-check', (_, id: number) => {
    const bizId = getActiveBusinessId();
    return db.prepare('DELETE FROM supplier_price_checks WHERE id = ? AND businessId = ?').run(id, bizId);
  });

  // ========== QUIET HOURS ==========
  ipcMain.handle('get-quiet-hours', () => {
    const bizId = getActiveBusinessId();
    return db.prepare('SELECT * FROM notification_quiet_hours WHERE businessId = ?').all(bizId);
  });

  ipcMain.handle('set-quiet-hours', (_, data: any) => {
    const bizId = getActiveBusinessId();
    const existing = db.prepare('SELECT id FROM notification_quiet_hours WHERE businessId = ?').get(bizId);
    if (existing) {
      db.prepare('UPDATE notification_quiet_hours SET startTime = ?, endTime = ?, active = ? WHERE id = ?')
        .run(data.startTime, data.endTime, data.active ?? 1, (existing as any).id);
      return { success: true };
    }
    const r = db.prepare('INSERT INTO notification_quiet_hours (businessId, startTime, endTime, active) VALUES (?, ?, ?, ?)')
      .run(bizId, data.startTime, data.endTime, data.active ?? 1);
    return { success: true, id: r.lastInsertRowid };
  });

  ipcMain.handle('delete-quiet-hours', () => {
    const bizId = getActiveBusinessId();
    return db.prepare('DELETE FROM notification_quiet_hours WHERE businessId = ?').run(bizId);
  });

  ipcMain.handle('get-database-size', () => {
    try {
      const size = statSync(db.name).size;
      return size;
    } catch { return 0; }
  });
  function escapeHtml(s: any): string {
    const str = String(s ?? '');
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  ipcMain.handle('print-receipt', async (_e, sale: any) => {
    try {
      const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt</title>
  <style>
    body { font-family: 'Courier New', 'Noto Sans Ethiopic', 'Abyssinica SIL', 'Nyala', 'Segoe UI Historic', monospace; font-size: 12px; margin: 0; padding: 10px; width: 80mm; }
    h1 { text-align: center; font-size: 16px; margin: 0 0 5px; }
    h2 { text-align: center; font-size: 12px; margin: 0 0 10px; color: #555; }
    .divider { border-top: 1px dashed #000; margin: 5px 0; }
    .row { display: flex; justify-content: space-between; }
    .total { font-weight: bold; font-size: 14px; }
    .footer { text-align: center; font-size: 10px; color: #888; margin-top: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 2px 0; }
    th { border-bottom: 1px solid #000; }
    .text-right { text-align: right; }
  </style>
</head>
<body>
  <h1>RECEIPT</h1>
  <h2>#REC-${escapeHtml(sale.id)}</h2>
  <div class="divider"></div>
  <div class="row"><span>Date:</span><span>${escapeHtml(new Date(sale.createdAt).toLocaleString())}</span></div>
  <div class="row"><span>Customer:</span><span>${escapeHtml(sale.customerName) || 'Walk-in'}</span></div>
  ${sale.customerPhone ? `<div class="row"><span>Phone:</span><span>${escapeHtml(sale.customerPhone)}</span></div>` : ''}
  <div class="divider"></div>
  <table>
    <tr><th>Item</th><th class="text-right">Qty</th><th class="text-right">Price</th><th class="text-right">Total</th></tr>
    <tr>
      <td>${escapeHtml(sale.itemName)}</td>
      <td class="text-right">${escapeHtml(sale.quantity)}</td>
      <td class="text-right">${escapeHtml((sale.totalPrice / sale.quantity).toFixed(2))}</td>
      <td class="text-right">${escapeHtml(sale.totalPrice.toFixed(2))}</td>
    </tr>
  </table>
  <div class="divider"></div>
  <div class="row total"><span>Total:</span><span>${escapeHtml(sale.totalPrice.toFixed(2))}</span></div>
  <div class="row"><span>Payment:</span><span>${escapeHtml(sale.paymentMethod)}</span></div>
  <div class="row"><span>Paid:</span><span>${escapeHtml((sale.paidAmount || sale.totalPrice).toFixed(2))}</span></div>
  ${sale.paymentStatus === 'Debt' ? `<div class="row"><span>Due:</span><span>${escapeHtml((sale.totalPrice - (sale.paidAmount || 0)).toFixed(2))}</span></div>` : ''}
  <div class="footer">Thank you for your business!</div>
</body>
</html>`;
      const printWindow = new BrowserWindow({ show: false, width: 400, height: 600, webPreferences: { nodeIntegration: false, contextIsolation: true } });
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(receiptHtml)}`);
      printWindow.webContents.on('did-finish-load', () => {
        printWindow.webContents.print({}, () => printWindow.close());
      });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // --- Backup & Restore ---
  const isDevBackup = !app.isPackaged;
  const dbDir = isDevBackup
    ? path.join(process.cwd(), 'db')
    : path.join(app.getPath('userData'), 'db');
  const backupDir = path.join(dbDir, 'backups');
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });

  ipcMain.handle('create-backup', async () => {
    requirePermission('settings.backup');
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `shega-backup-${timestamp}.db`;
      const backupPath = path.join(backupDir, backupName);
      copyFileSync(db.name, backupPath);
      const size = statSync(backupPath).size;
      return { success: true, name: backupName, size, path: backupPath };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('list-backups', async () => {
    try {
      if (!existsSync(backupDir)) return [];
      const files = readdirSync(backupDir).filter(f => f.endsWith('.db')).sort().reverse();
      return files.map(name => {
        const fullPath = path.join(backupDir, name);
        const stats = statSync(fullPath);
        return { name, size: stats.size, createdAt: stats.birthtime.toISOString(), path: fullPath };
      });
    } catch { return []; }
  });

  ipcMain.handle('restore-backup', async (_e, backupName: string) => {
    requirePermission('settings.backup');
    try {
      const safeName = path.basename(backupName);
      const backupPath = path.join(backupDir, safeName);
      if (!existsSync(backupPath)) return { success: false, error: 'Backup file not found' };
      // Close current DB connection and copy backup
      copyFileSync(backupPath, db.name);
      // The app should be restarted for the restored DB to take full effect
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('delete-backup', async (_e, backupName: string) => {
    requirePermission('settings.backup');
    try {
      const safeName = path.basename(backupName);
      const backupPath = path.join(backupDir, safeName);
      if (existsSync(backupPath)) unlinkSync(backupPath);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('open-external', (_event, url: string) => {
    shell.openExternal(url);
  });

  // ========== SUPPLIER REPORTS ==========
  ipcMain.handle('get-supplier-report-summary', () => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT
        s.id, s.supplierName, s.companyName, s.status, s.isActive,
        COALESCE(sp.totalPurchases, 0) AS totalPurchases,
        COALESCE(sp.totalPaid, 0) AS totalPayments,
        COALESCE(sp.totalPurchases - sp.totalPaid, 0) AS outstandingBalance
      FROM suppliers s
      LEFT JOIN (
        SELECT supplierId,
          SUM(totalAmount) AS totalPurchases,
          SUM(paidAmount) AS totalPaid
        FROM supplier_purchases
        WHERE status != 'cancelled'
        GROUP BY supplierId
      ) sp ON sp.supplierId = s.id
      WHERE s.businessId = ?
      ORDER BY s.supplierName
    `).all(bizId);
  });

  ipcMain.handle('get-supplier-transaction-report', (_, options: { supplierId?: number; startDate?: string; endDate?: string; limit?: number; offset?: number } = {}) => {
    const bizId = getActiveBusinessId();
    const limit = options.limit ?? 100;
    const offset = options.offset ?? 0;
    const params: any[] = [bizId];
    let where = 's.businessId = ?';
    if (options.supplierId) { where += ' AND sp.supplierId = ?'; params.push(options.supplierId); }
    if (options.startDate) { where += ' AND sp.purchaseDate >= ?'; params.push(options.startDate); }
    if (options.endDate) { where += ' AND sp.purchaseDate <= ?'; params.push(options.endDate); }
    const rows = db.prepare(`
      SELECT sp.id, sp.purchaseNumber, sp.purchaseDate, sp.totalAmount, sp.paidAmount,
        (sp.totalAmount - sp.paidAmount) AS remainingBalance, sp.status, sp.dueDate,
        s.supplierName, s.companyName,
        (SELECT COUNT(*) FROM supplier_purchase_items WHERE purchaseId = sp.id) AS itemCount
      FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId
      WHERE ${where} AND sp.status != 'cancelled'
      ORDER BY sp.purchaseDate DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    const total = (db.prepare(`SELECT COUNT(*) AS c FROM supplier_purchases sp JOIN suppliers s ON s.id = sp.supplierId WHERE ${where} AND sp.status != 'cancelled'`).get(...params) as any).c;
    const payments = db.prepare(`
      SELECT pay.id, pay.paymentDate, pay.amount, pay.paymentMethod, pay.referenceNumber, pay.notes,
        sp.purchaseNumber, s.supplierName
      FROM supplier_payments pay
      JOIN supplier_purchases sp ON sp.id = pay.purchaseId
      JOIN suppliers s ON s.id = pay.supplierId
      WHERE s.businessId = ?
      ORDER BY pay.paymentDate DESC
      LIMIT ?
    `).all(bizId, limit);
    return { rows, total, payments };
  });

  ipcMain.handle('get-inventory-by-supplier-report', () => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT
        s.id AS supplierId, s.supplierName, s.companyName,
        COUNT(DISTINCT i.id) AS productCount,
        COALESCE(SUM(i.totalBaseQuantity), 0) AS totalStockQuantity,
        COALESCE(SUM(i.totalBaseQuantity * i.basePurchasePrice), 0) AS inventoryValue,
        MAX(i.lastPurchaseDate) AS lastSupplyDate
      FROM suppliers s
      LEFT JOIN items i ON i.supplierId = s.id AND i.businessId = s.businessId AND i.is_deleted = 0
      WHERE s.businessId = ?
      GROUP BY s.id
      ORDER BY inventoryValue DESC
    `).all(bizId);
  });

  ipcMain.handle('get-supplier-unpaid-orders', () => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT sp.id, sp.purchaseNumber, sp.purchaseDate, sp.totalAmount, sp.paidAmount,
        (sp.totalAmount - sp.paidAmount) AS remainingBalance, sp.dueDate, sp.status,
        s.supplierName, s.companyName, s.phone
      FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId
      WHERE s.businessId = ?
        AND sp.status != 'cancelled'
        AND (sp.totalAmount - sp.paidAmount) > 0
      ORDER BY sp.dueDate ASC, remainingBalance DESC
      LIMIT 50
    `).all(bizId);
  });

  ipcMain.handle('get-supplier-payment-due-alerts', () => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT sp.id, sp.purchaseNumber, sp.purchaseDate, sp.totalAmount, sp.paidAmount,
        (sp.totalAmount - sp.paidAmount) AS remainingBalance, sp.dueDate,
        s.supplierName,
        CAST(julianday(sp.dueDate) - julianday('now') AS INTEGER) AS daysUntilDue
      FROM supplier_purchases sp
      JOIN suppliers s ON s.id = sp.supplierId
      WHERE s.businessId = ?
        AND sp.status != 'cancelled'
        AND (sp.totalAmount - sp.paidAmount) > 0
        AND sp.dueDate IS NOT NULL
        AND sp.dueDate <= DATE('now', '+30 days')
      ORDER BY sp.dueDate ASC
      LIMIT 20
    `).all(bizId);
  });

  ipcMain.handle('get-supplier-low-stock', () => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT i.id, i.name, i.totalBaseQuantity, i.baseUnit,
        s.id AS supplierId, s.supplierName, s.phone AS supplierPhone,
        c.name AS categoryName
      FROM items i
      JOIN suppliers s ON s.id = i.supplierId
      LEFT JOIN categories c ON c.id = i.categoryId
      WHERE i.businessId = ?
        AND i.is_deleted = 0
        AND i.supplierId IS NOT NULL
        AND i.totalBaseQuantity < 10
      ORDER BY i.totalBaseQuantity ASC
      LIMIT 20
    `).all(bizId);
  });

  // ========== AUDIT / REVERSAL SYSTEM ==========

  ipcMain.handle('void-sale', (_, data: { saleId: number; reason: string }) => {
    requirePermission('sales.void');
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(data.saleId) as any;
    if (!sale) throw new Error('Sale not found');
    if (sale.status === 'Voided') throw new Error('Sale is already voided');

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

        db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, totalPackQuantity = totalPackQuantity + ? WHERE id = ?')
          .run(baseRestore, packRestore, sale.itemId);

        const defWhId = getDefaultWarehouseId();
        const whRow = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, sale.itemId) as any;
        if (whRow) {
          db.prepare('UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(baseRestore, whRow.id);
        } else {
          db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(defWhId, sale.itemId, baseRestore);
        }
        db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)')
          .run(defWhId, sale.itemId, 'void_restore', baseRestore, 'void', `Sale #${data.saleId} voided — stock restored`);
      }

      // Mark sale as voided
      db.prepare("UPDATE sales SET status = 'Voided', voidReason = ?, voidedBy = ?, voidedAt = CURRENT_TIMESTAMP WHERE id = ?")
        .run(data.reason, currentUserName || 'unknown', data.saleId);

      // Reset paid amount for debt tracking
      if ((sale.paidAmount || 0) > 0) {
        db.prepare('UPDATE sales SET paidAmount = 0, paymentStatus = ? WHERE id = ?')
          .run(sale.totalPrice > 0 ? 'Debt' : 'Pending', data.saleId);
      }
    });

    transaction();
    logActivity('void', 'sale', data.saleId, `Voided sale #${data.saleId}. Reason: ${data.reason}`);
    insertAuditLog('void_sale', 'sale', data.saleId, 'status', 'Active', 'Voided', `Sale #${data.saleId} voided by ${currentUserName || 'unknown'}. Reason: ${data.reason}`);
    return db.prepare('SELECT * FROM sales WHERE id = ?').get(data.saleId);
  });

  ipcMain.handle('reverse-debt-payment', (_, data: { paymentId: number; reason: string }) => {
    requirePermission('payments.reverse');
    const payment = db.prepare('SELECT * FROM debt_payments WHERE id = ?').get(data.paymentId) as any;
    if (!payment) throw new Error('Payment not found');
    if (payment.reversalId) throw new Error('Payment has already been reversed');

    const transaction = db.transaction(() => {
      db.prepare('UPDATE debt_payments SET reversalId = id, reversalReason = ?, reversedBy = ?, reversalDate = CURRENT_TIMESTAMP WHERE id = ?')
        .run(data.reason, currentUserName || 'unknown', data.paymentId);

      db.prepare('UPDATE sales SET paidAmount = MAX(0, paidAmount - ?) WHERE id = ?')
        .run(payment.amount, payment.saleId);
    });

    transaction();
    logActivity('reverse', 'debt_payment', data.paymentId, `Reversed debt payment #${data.paymentId}. Reason: ${data.reason}`);
    insertAuditLog('reverse_debt_payment', 'debt_payment', data.paymentId, 'reversalId', null, String(data.paymentId), `Debt payment #${data.paymentId} reversed by ${currentUserName || 'unknown'}. Reason: ${data.reason}`);
    return { success: true };
  });

  ipcMain.handle('reverse-supplier-payment', (_, data: { paymentId: number; reason: string }) => {
    requirePermission('payments.reverse');
    const payment = db.prepare('SELECT * FROM supplier_payments WHERE id = ?').get(data.paymentId) as any;
    if (!payment) throw new Error('Payment not found');
    if (payment.reversalId) throw new Error('Payment has already been reversed');

    const transaction = db.transaction(() => {
      db.prepare('UPDATE supplier_payments SET reversalId = id, reversalReason = ?, reversedBy = ?, reversalDate = CURRENT_TIMESTAMP WHERE id = ?')
        .run(data.reason, currentUserName || 'unknown', data.paymentId);

      if (payment.purchaseId) {
        db.prepare('UPDATE supplier_purchases SET paidAmount = MAX(0, paidAmount - ?) WHERE id = ?')
          .run(payment.amount, payment.purchaseId);
      }
    });

    transaction();
    logActivity('reverse', 'supplier_payment', data.paymentId, `Reversed supplier payment #${data.paymentId}. Reason: ${data.reason}`);
    insertAuditLog('reverse_supplier_payment', 'supplier_payment', data.paymentId, 'reversalId', null, String(data.paymentId), `Supplier payment #${data.paymentId} reversed by ${currentUserName || 'unknown'}. Reason: ${data.reason}`);
    return { success: true };
  });

  ipcMain.handle('reverse-adjustment', (_, data: { adjustmentId: number; reason: string }) => {
    requirePermission('adjustments.reverse');
    const adjustment = db.prepare('SELECT * FROM adjustments WHERE id = ?').get(data.adjustmentId) as any;
    if (!adjustment) throw new Error('Adjustment not found');
    if (adjustment.reversalId) throw new Error('Adjustment has already been reversed');

    const bizId = getActiveBusinessId();

    const transaction = db.transaction(() => {
      // Mark original as reversed
      db.prepare('UPDATE adjustments SET reversalId = id, reversalReason = ?, reversedBy = ?, reversalDate = CURRENT_TIMESTAMP WHERE id = ?')
        .run(data.reason, currentUserName || 'unknown', data.adjustmentId);

      // Create compensating adjustment
      let compensationType = adjustment.type;
      if (adjustment.type === 'damage') compensationType = 'add_stock';
      else if (adjustment.type === 'loss') compensationType = 'add_stock';
      else if (adjustment.type === 'add_stock') compensationType = 'damage';
      // Price adjustments: create opposite
      else if (adjustment.type === 'price_increase') compensationType = 'price_decrease';
      else if (adjustment.type === 'price_decrease') compensationType = 'price_increase';

      const compResult = db.prepare('INSERT INTO adjustments (businessId, itemId, type, oldValue, newValue, quantity, unitType, reason, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        bizId, adjustment.itemId, compensationType, adjustment.newValue, adjustment.oldValue, adjustment.quantity, adjustment.unitType, `Reversal of adjustment #${data.adjustmentId}: ${data.reason}`, new Date().toISOString().split('T')[0]
      );

      // Restore stock for stock-affecting types
      if (['damage', 'loss', 'add_stock'].includes(adjustment.type) && adjustment.quantity) {
        const restoreQty = (adjustment.type === 'damage' || adjustment.type === 'loss') ? adjustment.quantity : -adjustment.quantity;
        db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity + ? WHERE id = ?').run(restoreQty, adjustment.itemId);

        const defWhId = getDefaultWarehouseId();
        const whRow = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, adjustment.itemId) as any;
        if (whRow) {
          db.prepare('UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(restoreQty, whRow.id);
        } else if (restoreQty > 0) {
          db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(defWhId, adjustment.itemId, restoreQty);
        }
        db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)')
          .run(defWhId, adjustment.itemId, `adj_reversal`, Math.abs(restoreQty), 'adjustment', `Reversal of adjustment #${data.adjustmentId}: ${data.reason}`);
      }

      // Restore price for price-affecting types
      if (adjustment.type === 'price_increase' || adjustment.type === 'price_decrease') {
        if (adjustment.unitType === 'base') {
          db.prepare('UPDATE items SET baseSellingPrice = ? WHERE id = ?').run(adjustment.oldValue, adjustment.itemId);
        } else {
          db.prepare('UPDATE items SET packSellingPrice = ? WHERE id = ?').run(adjustment.oldValue, adjustment.itemId);
        }
      }
    });

    transaction();
    logActivity('reverse', 'adjustment', data.adjustmentId, `Reversed adjustment #${data.adjustmentId}. Reason: ${data.reason}`);
    insertAuditLog('reverse_adjustment', 'adjustment', data.adjustmentId, 'reversalId', null, String(data.adjustmentId), `Adjustment #${data.adjustmentId} reversed by ${currentUserName || 'unknown'}. Reason: ${data.reason}`);
    return { success: true };
  });

  ipcMain.handle('get-audit-logs', (_, options?: { limit?: number; offset?: number; entityType?: string; entityId?: number; action?: string; fromDate?: string; toDate?: string }) => {
    requirePermission('audit.view');
    let query = 'SELECT * FROM audit_logs WHERE businessId = ?';
    const params: any[] = [getActiveBusinessId()];

    if (options?.entityType) {
      query += ' AND entityType = ?';
      params.push(options.entityType);
    }
    if (options?.entityId) {
      query += ' AND entityId = ?';
      params.push(options.entityId);
    }
    if (options?.action) {
      query += ' AND action = ?';
      params.push(options.action);
    }
    if (options?.fromDate) {
      query += ' AND createdAt >= ?';
      params.push(options.fromDate + ' 00:00:00');
    }
    if (options?.toDate) {
      query += ' AND createdAt <= ?';
      params.push(options.toDate + ' 23:59:59');
    }

    query += ' ORDER BY createdAt DESC';

    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    query += ' LIMIT ?';
    params.push(listLimit);

    if (options?.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }

    return db.prepare(query).all(...params);
  });

  ipcMain.handle('archive-item', (_, data: { id: number }) => {
    requirePermission('inventory.delete');
    const item = db.prepare('SELECT name FROM items WHERE id = ?').get(data.id) as any;
    db.prepare('UPDATE items SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(currentUserName || 'unknown', data.id);
    logActivity('archive', 'item', data.id, `Archived product "${item?.name || 'unknown'}"`);
    return { success: true };
  });

  ipcMain.handle('restore-item', (_, data: { id: number }) => {
    requirePermission('records.restore');
    const item = db.prepare('SELECT name FROM items WHERE id = ?').get(data.id) as any;
    db.prepare('UPDATE items SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL WHERE id = ?').run(data.id);
    logActivity('restore', 'item', data.id, `Restored product "${item?.name || 'unknown'}"`);
    insertAuditLog('restore_item', 'item', data.id, 'is_deleted', '1', '0', `Item #${data.id} "${item?.name || 'unknown'}" restored by ${currentUserName || 'unknown'}`);
    return { success: true };
  });

  ipcMain.handle('archive-customer', (_, data: { id: number }) => {
    requirePermission('customers.delete');
    const bizId = getActiveBusinessId();
    db.prepare("UPDATE customers SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(currentUserName || 'unknown', data.id, bizId);
    logActivity('archive', 'customer', data.id, `Archived customer (ID: ${data.id})`);
    return { success: true };
  });

  ipcMain.handle('restore-customer', (_, data: { id: number }) => {
    requirePermission('records.restore');
    const bizId = getActiveBusinessId();
    db.prepare("UPDATE customers SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(data.id, bizId);
    logActivity('restore', 'customer', data.id, `Restored customer (ID: ${data.id})`);
    insertAuditLog('restore_customer', 'customer', data.id, 'is_deleted', '1', '0', `Customer #${data.id} restored by ${currentUserName || 'unknown'}`);
    return { success: true };
  });

  ipcMain.handle('get-deleted-items', () => {
    requirePermission('inventory.view');
    const bizId = getActiveBusinessId();
    return db.prepare('SELECT * FROM items WHERE businessId = ? AND is_deleted = 1').all(bizId);
  });

  ipcMain.handle('get-deleted-customers', () => {
    requirePermission('customers.view');
    const bizId = getActiveBusinessId();
    return db.prepare('SELECT * FROM customers WHERE businessId = ? AND is_deleted = 1').all(bizId);
  });

  ipcMain.handle('get-voided-sales', (_, options?: { fromDate?: string; toDate?: string }) => {
    requirePermission('audit.view');
    const bizId = getActiveBusinessId();
    let query = `SELECT s.*, i.name as itemName FROM sales s LEFT JOIN items i ON s.itemId = i.id WHERE s.businessId = ? AND s.status = 'Voided'`;
    const params: any[] = [bizId];
    if (options?.fromDate) {
      query += ' AND s.voidedAt >= ?';
      params.push(options.fromDate + ' 00:00:00');
    }
    if (options?.toDate) {
      query += ' AND s.voidedAt <= ?';
      params.push(options.toDate + ' 23:59:59');
    }
    query += ' ORDER BY s.voidedAt DESC';
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-reversal-stats', () => {
    const bizId = getActiveBusinessId();
    const voidedSales = (db.prepare("SELECT COUNT(*) as count FROM sales WHERE businessId = ? AND status = 'Voided'").get(bizId) as any).count;
    const reversedPayments = (db.prepare('SELECT COUNT(*) as count FROM debt_payments dp JOIN sales s ON dp.saleId = s.id WHERE s.businessId = ? AND dp.reversalId IS NOT NULL').get(bizId) as any).count;
    const reversedSupplierPayments = (db.prepare('SELECT COUNT(*) as count FROM supplier_payments WHERE businessId = ? AND reversalId IS NOT NULL').get(bizId) as any).count;
    const reversedAdjustments = (db.prepare('SELECT COUNT(*) as count FROM adjustments WHERE businessId = ? AND reversalId IS NOT NULL').get(bizId) as any).count;
    return { voidedSales, reversedPayments, reversedSupplierPayments, reversedAdjustments };
  });
}
