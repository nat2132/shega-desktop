import db from './database';

interface ImportRow {
  [key: string]: string
}

interface ImportResult {
  success: boolean
  imported: number
  errors: { row: number; message: string }[]
  skipped: number
}

function getActiveBusinessId(): number {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'active_business_id'").get() as any;
  if (row) return parseInt(row.value);
  const defaultBiz = db.prepare("SELECT id FROM businesses WHERE isDefault = 1 LIMIT 1").get() as any;
  return defaultBiz?.id || 1;
}

function getDefaultWarehouseId(): number {
  const wh = db.prepare('SELECT id FROM warehouses WHERE isActive = 1 ORDER BY id LIMIT 1').get() as any;
  if (wh) return wh.id;
  const anyWh = db.prepare('SELECT id FROM warehouses LIMIT 1').get() as any;
  if (anyWh) return anyWh.id;
  const bizId = getActiveBusinessId();
  const res = db.prepare('INSERT INTO warehouses (businessId, name, location, managerName) VALUES (?, ?, ?, ?)').run(bizId, 'Main Warehouse', 'Headquarters', 'Operations Manager');
  return res.lastInsertRowid as number;
}

function resolveId(
  table: string,
  nameField: string,
  nameValue: string,
  extraWhere: string = '',
  extraParams: any[] = []
): number | null {
  if (!nameValue?.trim()) return null;
  const bizId = getActiveBusinessId();
  const row = db.prepare(`SELECT id FROM ${table} WHERE ${nameField} = ? AND businessId = ? ${extraWhere} LIMIT 1`)
    .get(nameValue.trim(), bizId, ...extraParams) as any;
  return row?.id ?? null;
}

function resolveItemId(name: string): number | null {
  return resolveId('items', 'name', name, 'AND is_deleted = 0');
}

function getOrCreateCustomer(name: string, phone?: string): number {
  const bizId = getActiveBusinessId();
  const existing = db.prepare('SELECT id FROM customers WHERE customerName = ? AND businessId = ?').get(name.trim(), bizId) as any;
  if (existing) return existing.id;
  const res = db.prepare('INSERT INTO customers (businessId, customerName, phone, groupName) VALUES (?, ?, ?, ?)').run(bizId, name.trim(), phone?.trim() || '', 'general');
  return res.lastInsertRowid as number;
}

function resolveSupplierName(name: string): number | null {
  return resolveId('suppliers', 'supplierName', name, 'AND isActive = 1');
}

function resolveRoleName(name: string): number | null {
  const row = db.prepare('SELECT id FROM employee_roles WHERE name = ? LIMIT 1').get(name.trim()) as any;
  if (row) return row.id;
  const res = db.prepare('INSERT INTO employee_roles (name, description, permissions) VALUES (?, ?, ?)').run(name.trim(), 'Imported role', '[]');
  return res.lastInsertRowid as number;
}

// ===== SALES IMPORT =====
function importSales(rows: ImportRow[]): ImportResult {
  const result: ImportResult = { success: true, imported: 0, errors: [], skipped: 0 }
  const bizId = getActiveBusinessId()

  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      try {
        const itemName = r.itemName?.trim()
        if (!itemName) { result.errors.push({ row: i + 1, message: 'itemName is required' }); continue }
        const itemId = resolveItemId(itemName)
        if (!itemId) { result.errors.push({ row: i + 1, message: `Item "${itemName}" not found` }); continue }

        const quantity = parseFloat(r.quantity)
        if (isNaN(quantity) || quantity <= 0) { result.errors.push({ row: i + 1, message: `Invalid quantity: "${r.quantity}"` }); continue }
        const totalPrice = parseFloat(r.totalPrice)
        if (isNaN(totalPrice) || totalPrice < 0) { result.errors.push({ row: i + 1, message: `Invalid totalPrice: "${r.totalPrice}"` }); continue }

        const unit = r.unit || 'pcs'
        const unitType = r.unitType || 'base'
        const discount = parseFloat(r.discount) || 0
        const vat = parseFloat(r.vat) || 0
        const paymentMethod = r.paymentMethod || 'cash'
        const paymentStatus = r.paymentStatus || 'Paid'
        const customerName = r.customerName?.trim() || ''
        const customerPhone = r.customerPhone?.trim() || ''
        const dueDate = r.dueDate || null
        const paidAmount = parseFloat(r.paidAmount) || 0
        const createdAt = r.createdAt || new Date().toISOString()

        const stmt = db.prepare(`
          INSERT INTO sales (businessId, itemId, quantity, unit, unitType, discount, vat, totalPrice,
            paymentMethod, paymentStatus, customerName, customerPhone, dueDate, paidAmount, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        stmt.run(bizId, itemId, quantity, unit, unitType, discount, vat, totalPrice,
          paymentMethod, paymentStatus, customerName, customerPhone || null, dueDate, paidAmount, createdAt)

        if (customerName && (paymentStatus === 'Debt' || paymentStatus === 'Partial')) {
          getOrCreateCustomer(customerName, customerPhone)
        }

        const item = db.prepare('SELECT unitsPerPack, totalBaseQuantity FROM items WHERE id = ?').get(itemId) as any
        let baseDeduction = quantity
        if (unitType === 'pack') baseDeduction = quantity * (item?.unitsPerPack || 1)
        const salesItemResult = db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity - ? WHERE id = ? AND totalBaseQuantity >= ?').run(baseDeduction, itemId, baseDeduction)
        if (salesItemResult.changes === 0) throw new Error(`Insufficient stock: item "${itemName}" has less than ${baseDeduction} units available`)

        const defWhId = getDefaultWarehouseId()
        const whRow = db.prepare('SELECT id, quantity FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, itemId) as any
        if (whRow) {
          const whResult = db.prepare('UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND quantity >= ?').run(baseDeduction, whRow.id, baseDeduction)
          if (whResult.changes === 0) throw new Error(`Insufficient warehouse stock for item "${itemName}"`)
        }

        result.imported++
      } catch (e: any) {
        result.errors.push({ row: i + 1, message: e.message || 'Unknown error' })
      }
    }
  })

  try {
    transaction()
  } catch (e: any) {
    result.success = false
    result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` })
  }

  return result
}

// ===== ITEMS IMPORT =====
function importItems(rows: ImportRow[]): ImportResult {
  const result: ImportResult = { success: true, imported: 0, errors: [], skipped: 0 }
  const bizId = getActiveBusinessId()

  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      try {
        const name = r.name?.trim()
        if (!name) { result.errors.push({ row: i + 1, message: 'Item name is required' }); continue }

        const existing = db.prepare('SELECT id FROM items WHERE name = ? AND businessId = ? AND is_deleted = 0').get(name, bizId) as any
        if (existing) { result.skipped++; continue }

        let categoryId: number | null = null
        const catName = r.categoryName?.trim()
        if (catName) {
          const cat = db.prepare('SELECT id FROM categories WHERE name = ? AND businessId = ?').get(catName, bizId) as any
          if (cat) categoryId = cat.id
        }

        const basePurchasePrice = parseFloat(r.basePurchasePrice) || 0
        const baseSellingPrice = parseFloat(r.baseSellingPrice) || 0

        db.prepare(`
          INSERT INTO items (businessId, name, categoryId, purchaseUnit, baseUnit, unitsPerPack,
            basePurchasePrice, baseSellingPrice, packPurchasePrice, packSellingPrice,
            totalBaseQuantity, totalPackQuantity, expiryDate, notes, supplierId)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            (SELECT id FROM suppliers WHERE supplierName = ? AND businessId = ? LIMIT 1))
        `).run(
          bizId, name, categoryId, r.purchaseUnit || null, r.baseUnit || null,
          parseFloat(r.unitsPerPack) || 1,
          basePurchasePrice, baseSellingPrice,
          parseFloat(r.packPurchasePrice) || 0, parseFloat(r.packSellingPrice) || 0,
          parseFloat(r.totalBaseQuantity) || 0, parseFloat(r.totalPackQuantity) || 0,
          r.expiryDate || null, r.notes || null,
          r.supplierName?.trim() || null, bizId
        )

        result.imported++
      } catch (e: any) {
        result.errors.push({ row: i + 1, message: e.message || 'Unknown error' })
      }
    }
  })

  try { transaction() } catch (e: any) { result.success = false; result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` }) }
  return result
}

// ===== CUSTOMERS IMPORT =====
function importCustomers(rows: ImportRow[]): ImportResult {
  const result: ImportResult = { success: true, imported: 0, errors: [], skipped: 0 }
  const bizId = getActiveBusinessId()

  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      try {
        const name = r.customerName?.trim()
        if (!name) { result.errors.push({ row: i + 1, message: 'Customer name is required' }); continue }

        const existing = db.prepare('SELECT id FROM customers WHERE customerName = ? AND businessId = ?').get(name, bizId) as any
        if (existing) { result.skipped++; continue }

        db.prepare('INSERT INTO customers (businessId, customerName, phone, email, address, city, company, groupName, creditLimit, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          bizId, name, r.phone?.trim() || '', r.email?.trim() || null, r.address?.trim() || null,
          r.city?.trim() || null, r.company?.trim() || null, r.groupName?.trim() || 'general',
          parseFloat(r.creditLimit) || 0, r.notes?.trim() || null
        )
        result.imported++
      } catch (e: any) {
        result.errors.push({ row: i + 1, message: e.message || 'Unknown error' })
      }
    }
  })

  try { transaction() } catch (e: any) { result.success = false; result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` }) }
  return result
}

// ===== SUPPLIERS IMPORT =====
function importSuppliers(rows: ImportRow[]): ImportResult {
  const result: ImportResult = { success: true, imported: 0, errors: [], skipped: 0 }
  const bizId = getActiveBusinessId()

  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      try {
        const name = r.supplierName?.trim()
        if (!name) { result.errors.push({ row: i + 1, message: 'Supplier name is required' }); continue }

        const existing = db.prepare('SELECT id FROM suppliers WHERE supplierName = ? AND businessId = ?').get(name, bizId) as any
        if (existing) { result.skipped++; continue }

        db.prepare('INSERT INTO suppliers (businessId, supplierName, companyName, contactPerson, phone, email, address, city, paymentTerms, creditLimit, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          bizId, name, r.companyName?.trim() || null, r.contactPerson?.trim() || null,
          r.phone?.trim() || '', r.email?.trim() || null, r.address?.trim() || null,
          r.city?.trim() || null, r.paymentTerms?.trim() || null,
          parseFloat(r.creditLimit) || 0, r.notes?.trim() || null
        )
        result.imported++
      } catch (e: any) {
        result.errors.push({ row: i + 1, message: e.message || 'Unknown error' })
      }
    }
  })

  try { transaction() } catch (e: any) { result.success = false; result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` }) }
  return result
}

// ===== SHIPMENTS IMPORT =====
function importShipments(rows: ImportRow[]): ImportResult {
  const result: ImportResult = { success: true, imported: 0, errors: [], skipped: 0 }
  const bizId = getActiveBusinessId()
  const validStatuses = ['pending', 'in_transit', 'delivered', 'cancelled']

  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      try {
        const dest = r.destination?.trim()
        if (!dest) { result.errors.push({ row: i + 1, message: 'Destination is required' }); continue }
        const status = r.status?.trim() || 'pending'
        if (!validStatuses.includes(status)) { result.errors.push({ row: i + 1, message: `Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}` }); continue }

        db.prepare('INSERT INTO shipments (businessId, origin, destination, driverName, driverPhone, vehicleInfo, status, scheduledDate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          bizId, r.origin?.trim() || null, dest, r.driverName?.trim() || null,
          r.driverPhone?.trim() || null, r.vehicleInfo?.trim() || null,
          status, r.scheduledDate || null, r.notes?.trim() || null
        )
        result.imported++
      } catch (e: any) {
        result.errors.push({ row: i + 1, message: e.message || 'Unknown error' })
      }
    }
  })

  try { transaction() } catch (e: any) { result.success = false; result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` }) }
  return result
}

// ===== WAREHOUSES IMPORT =====
function importWarehouses(rows: ImportRow[]): ImportResult {
  const result: ImportResult = { success: true, imported: 0, errors: [], skipped: 0 }
  const bizId = getActiveBusinessId()

  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      try {
        const name = r.name?.trim()
        if (!name) { result.errors.push({ row: i + 1, message: 'Warehouse name is required' }); continue }

        const existing = db.prepare('SELECT id FROM warehouses WHERE name = ? AND businessId = ?').get(name, bizId) as any
        if (existing) { result.skipped++; continue }

        db.prepare('INSERT INTO warehouses (businessId, name, location, managerName, managerPhone, email) VALUES (?, ?, ?, ?, ?, ?)').run(
          bizId, name, r.location?.trim() || null, r.managerName?.trim() || null,
          r.managerPhone?.trim() || null, r.email?.trim() || null
        )
        result.imported++
      } catch (e: any) {
        result.errors.push({ row: i + 1, message: e.message || 'Unknown error' })
      }
    }
  })

  try { transaction() } catch (e: any) { result.success = false; result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` }) }
  return result
}

// ===== EMPLOYEES IMPORT =====
function importEmployees(rows: ImportRow[]): ImportResult {
  const result: ImportResult = { success: true, imported: 0, errors: [], skipped: 0 }
  const bizId = getActiveBusinessId()

  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      try {
        const firstName = r.firstName?.trim()
        const lastName = r.lastName?.trim()
        if (!firstName || !lastName) { result.errors.push({ row: i + 1, message: 'First name and last name are required' }); continue }

        const roleId = r.roleName?.trim() ? resolveRoleName(r.roleName.trim()) : null

        db.prepare('INSERT INTO employees (employeeCode, firstName, lastName, phone, email, roleId, department, hireDate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          r.employeeCode?.trim() || null, firstName, lastName, r.phone?.trim() || null,
          r.email?.trim() || null, roleId, r.department?.trim() || null,
          r.hireDate || null, r.notes?.trim() || null
        )
        result.imported++
      } catch (e: any) {
        result.errors.push({ row: i + 1, message: e.message || 'Unknown error' })
      }
    }
  })

  try { transaction() } catch (e: any) { result.success = false; result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` }) }
  return result
}

// ===== SUPPLIER PURCHASES IMPORT =====
function importSupplierPurchases(rows: ImportRow[]): ImportResult {
  const result: ImportResult = { success: true, imported: 0, errors: [], skipped: 0 }
  const bizId = getActiveBusinessId()

  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      try {
        const purchaseNumber = r.purchaseNumber?.trim()
        if (!purchaseNumber) { result.errors.push({ row: i + 1, message: 'purchaseNumber is required' }); continue }
        const supplierName = r.supplierName?.trim()
        if (!supplierName) { result.errors.push({ row: i + 1, message: 'supplierName is required' }); continue }

        const supplierId = resolveSupplierName(supplierName)
        if (!supplierId) { result.errors.push({ row: i + 1, message: `Supplier "${supplierName}" not found` }); continue }

        const itemName = r.itemName?.trim()
        if (!itemName) { result.errors.push({ row: i + 1, message: 'itemName is required' }); continue }
        const itemId = resolveItemId(itemName)
        if (!itemId) { result.errors.push({ row: i + 1, message: `Item "${itemName}" not found` }); continue }

        const quantity = parseFloat(r.quantity)
        if (isNaN(quantity) || quantity <= 0) { result.errors.push({ row: i + 1, message: `Invalid quantity: "${r.quantity}"` }); continue }
        const unitPrice = parseFloat(r.unitPrice)
        if (isNaN(unitPrice) || unitPrice < 0) { result.errors.push({ row: i + 1, message: `Invalid unitPrice: "${r.unitPrice}"` }); continue }
        const totalPrice = parseFloat(r.totalPrice)
        if (isNaN(totalPrice) || totalPrice < 0) { result.errors.push({ row: i + 1, message: `Invalid totalPrice: "${r.totalPrice}"` }); continue }

        const purchaseDate = r.purchaseDate || new Date().toISOString().split('T')[0]

        const existingPO = db.prepare('SELECT id FROM supplier_purchases WHERE purchaseNumber = ? AND businessId = ?').get(purchaseNumber, bizId) as any
        if (existingPO) { result.skipped++; continue }

        const poResult = db.prepare('INSERT INTO supplier_purchases (businessId, supplierId, purchaseNumber, purchaseDate, totalAmount, dueDate, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
          bizId, supplierId, purchaseNumber, purchaseDate, totalPrice, r.dueDate || null, r.status?.trim() || 'received', r.notes?.trim() || null
        )
        const purchaseId = poResult.lastInsertRowid as number

        db.prepare('INSERT INTO supplier_purchase_items (purchaseId, itemId, itemName, quantity, unit, unitPrice, totalPrice, receivedQuantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
          purchaseId, itemId, itemName, quantity, r.unit?.trim() || 'pcs', unitPrice, totalPrice, quantity
        )

        const item = db.prepare('SELECT unitsPerPack FROM items WHERE id = ?').get(itemId) as any
        db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity + ? WHERE id = ?').run(quantity, itemId)
        db.prepare('UPDATE items SET lastPurchaseDate = ?, lastPurchasePrice = ? WHERE id = ?').run(purchaseDate, unitPrice, itemId)

        const defWhId = getDefaultWarehouseId()
        const whRow = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, itemId) as any
        if (whRow) {
          db.prepare('UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(quantity, whRow.id)
        }

        result.imported++
      } catch (e: any) {
        result.errors.push({ row: i + 1, message: e.message || 'Unknown error' })
      }
    }
  })

  try { transaction() } catch (e: any) { result.success = false; result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` }) }
  return result
}

// ===== ORDERS IMPORT =====
function importOrders(rows: ImportRow[]): ImportResult {
  const result: ImportResult = { success: true, imported: 0, errors: [], skipped: 0 }
  const bizId = getActiveBusinessId()

  const transaction = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      try {
        const orderNumber = r.orderNumber?.trim()
        if (!orderNumber) { result.errors.push({ row: i + 1, message: 'orderNumber is required' }); continue }

        const existing = db.prepare('SELECT id FROM orders WHERE orderNumber = ? AND businessId = ?').get(orderNumber, bizId) as any
        if (existing) { result.skipped++; continue }

        const orderResult = db.prepare('INSERT INTO orders (businessId, orderNumber, customerName, customerPhone, status, totalAmount, notes) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          bizId, orderNumber, r.customerName?.trim() || null, r.customerPhone?.trim() || null,
          r.status?.trim() || 'Order', 0, r.notes?.trim() || null
        )
        const orderId = orderResult.lastInsertRowid as number

        const itemName = r.itemName?.trim()
        if (itemName) {
          const itemId = resolveItemId(itemName)
          const quantity = parseFloat(r.quantity) || 1
          const unitPrice = parseFloat(r.unitPrice) || 0
          const totalPrice = quantity * unitPrice

          db.prepare('INSERT INTO order_items (orderId, itemId, itemName, quantity, unit, unitPrice, totalPrice) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
            orderId, itemId, itemName, quantity, 'pcs', unitPrice, totalPrice
          )
          db.prepare('UPDATE orders SET totalAmount = totalAmount + ? WHERE id = ?').run(totalPrice, orderId)
        }

        result.imported++
      } catch (e: any) {
        result.errors.push({ row: i + 1, message: e.message || 'Unknown error' })
      }
    }
  })

  try { transaction() } catch (e: any) { result.success = false; result.errors.push({ row: 0, message: `Transaction failed: ${e.message}` }) }
  return result
}

// ===== MAIN DISPATCH =====
const IMPORTERS: Record<string, (rows: ImportRow[]) => ImportResult> = {
  sales: importSales,
  inventory: importItems,
  customers: importCustomers,
  suppliers: importSuppliers,
  shipments: importShipments,
  warehouses: importWarehouses,
  employees: importEmployees,
  'supplier-purchases': importSupplierPurchases,
  orders: importOrders,
}

export function validateData(module: string, rows: ImportRow[]): { valid: boolean; errors: { row: number; message: string }[] } {
  const importer = IMPORTERS[module]
  if (!importer) return { valid: false, errors: [{ row: 0, message: `Unknown module: ${module}` }] }

  let result: ImportResult = { success: true, imported: 0, errors: [], skipped: 0 }
  try {
    db.transaction(() => {
      const r = importer(rows)
      result = r
      throw new Error('__rollback__')
    })()
  } catch (e: any) {
    if (e.message !== '__rollback__') {
      return { valid: false, errors: [{ row: 0, message: `Validation failed: ${e.message}` }] }
    }
  }

  return { valid: result.errors.length === 0, errors: result.errors }
}

export function importData(module: string, rows: ImportRow[]): ImportResult {
  const importer = IMPORTERS[module]
  if (!importer) return { success: false, imported: 0, errors: [{ row: 0, message: `Unknown module: ${module}` }], skipped: 0 }

  const result = importer(rows)

  try {
    const bizId = getActiveBusinessId()
    const description = `CSV import of ${rows.length} ${module} records: ${result.imported} imported, ${result.errors.length} errors, ${result.skipped} skipped`
    db.prepare('INSERT INTO audit_logs (businessId, action, entityType, entityId, fieldName, oldValue, newValue, changedBy, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      bizId, 'csv_import', module, null, null, null, null, 'system', description
    )
  } catch (e) {
    console.error('[CSV Import] Failed to audit log:', e)
  }

  return result
}

export { ImportRow, ImportResult }
