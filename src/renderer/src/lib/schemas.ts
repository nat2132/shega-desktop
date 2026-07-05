export interface SchemaField {
  key: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean'
  required?: boolean
  description?: string
  example?: string
}

export interface ModuleSchema {
  module: string
  label: string
  description: string
  fields: SchemaField[]
  uniqueKeys?: string[]
}

export const MODULE_SCHEMAS: ModuleSchema[] = [
  {
    module: 'sales',
    label: 'Sales',
    description: 'Sales transactions',
    uniqueKeys: ['id'],
    fields: [
      { key: 'itemName', label: 'Item Name', type: 'string', required: true, description: 'Name of the item sold' },
      { key: 'quantity', label: 'Quantity', type: 'number', required: true, description: 'Quantity sold', example: '1' },
      { key: 'unit', label: 'Unit', type: 'string', required: true, description: 'Unit of measurement', example: 'pcs' },
      { key: 'unitType', label: 'Unit Type', type: 'string', required: true, description: 'base or pack', example: 'base' },
      { key: 'totalPrice', label: 'Total Price', type: 'number', required: true, description: 'Total sale amount', example: '150.00' },
      { key: 'discount', label: 'Discount', type: 'number', description: 'Discount amount', example: '0' },
      { key: 'vat', label: 'VAT', type: 'number', description: 'VAT amount', example: '0' },
      { key: 'paymentMethod', label: 'Payment Method', type: 'string', description: 'cash, bank_transfer, etc.', example: 'cash' },
      { key: 'paymentStatus', label: 'Payment Status', type: 'string', description: 'Paid, Debt, Partial', example: 'Paid' },
      { key: 'customerName', label: 'Customer Name', type: 'string', description: 'Customer name' },
      { key: 'customerPhone', label: 'Customer Phone', type: 'string', description: 'Customer phone number' },
      { key: 'dueDate', label: 'Due Date', type: 'date', description: 'Due date for debt sales', example: '2025-12-31' },
      { key: 'paidAmount', label: 'Paid Amount', type: 'number', description: 'Amount already paid', example: '0' },
      { key: 'createdAt', label: 'Created At', type: 'date', description: 'Sale date', example: '2025-01-15' },
    ],
  },
  {
    module: 'inventory',
    label: 'Inventory (Items)',
    description: 'Product inventory items',
    uniqueKeys: ['id', 'name'],
    fields: [
      { key: 'name', label: 'Item Name', type: 'string', required: true, description: 'Product name', example: 'Coffee Beans' },
      { key: 'categoryName', label: 'Category', type: 'string', description: 'Category name', example: 'Beverages' },
      { key: 'purchaseUnit', label: 'Purchase Unit', type: 'string', description: 'Unit used for purchasing', example: 'kg' },
      { key: 'baseUnit', label: 'Base Unit', type: 'string', description: 'Smallest sellable unit', example: 'g' },
      { key: 'unitsPerPack', label: 'Units Per Pack', type: 'number', description: 'Units in one pack', example: '1000' },
      { key: 'basePurchasePrice', label: 'Base Purchase Price', type: 'number', description: 'Purchase price per base unit', example: '5.00' },
      { key: 'baseSellingPrice', label: 'Base Selling Price', type: 'number', description: 'Selling price per base unit', example: '8.00' },
      { key: 'packPurchasePrice', label: 'Pack Purchase Price', type: 'number', description: 'Purchase price per pack', example: '5000.00' },
      { key: 'packSellingPrice', label: 'Pack Selling Price', type: 'number', description: 'Selling price per pack', example: '8000.00' },
      { key: 'totalBaseQuantity', label: 'Stock Quantity', type: 'number', description: 'Current stock in base units', example: '5000' },
      { key: 'totalPackQuantity', label: 'Pack Quantity', type: 'number', description: 'Current stock in packs', example: '5' },
      { key: 'supplierName', label: 'Supplier Name', type: 'string', description: 'Supplier name' },
      { key: 'expiryDate', label: 'Expiry Date', type: 'date', description: 'Expiry date', example: '2026-12-31' },
      { key: 'notes', label: 'Notes', type: 'string', description: 'Additional notes' },
    ],
  },
  {
    module: 'expenses',
    label: 'Expenses',
    description: 'Business expenses',
    uniqueKeys: ['id'],
    fields: [
      { key: 'name', label: 'Expense Name', type: 'string', required: true, description: 'Description of expense', example: 'Electricity Bill' },
      { key: 'amount', label: 'Amount', type: 'number', required: true, description: 'Expense amount', example: '2500.00' },
      { key: 'category', label: 'Category', type: 'string', description: 'Expense category', example: 'Utilities' },
      { key: 'date', label: 'Date', type: 'date', required: true, description: 'Expense date', example: '2025-01-15' },
      { key: 'isRecurring', label: 'Is Recurring', type: 'boolean', description: 'Is this a recurring expense', example: 'false' },
      { key: 'frequency', label: 'Frequency', type: 'string', description: 'monthly, weekly, yearly', example: 'monthly' },
      { key: 'notes', label: 'Notes', type: 'string', description: 'Additional notes' },
    ],
  },
  {
    module: 'customers',
    label: 'Customers',
    description: 'Customer records',
    uniqueKeys: ['id', 'customerName'],
    fields: [
      { key: 'customerName', label: 'Customer Name', type: 'string', required: true, description: 'Full name', example: 'Abebe Kebede' },
      { key: 'phone', label: 'Phone', type: 'string', required: true, description: 'Phone number', example: '+251911000000' },
      { key: 'email', label: 'Email', type: 'string', description: 'Email address', example: 'abebe@example.com' },
      { key: 'address', label: 'Address', type: 'string', description: 'Physical address' },
      { key: 'city', label: 'City', type: 'string', description: 'City', example: 'Addis Ababa' },
      { key: 'company', label: 'Company', type: 'string', description: 'Company name' },
      { key: 'groupName', label: 'Group', type: 'string', description: 'Customer group', example: 'general' },
      { key: 'creditLimit', label: 'Credit Limit', type: 'number', description: 'Credit limit', example: '50000.00' },
      { key: 'notes', label: 'Notes', type: 'string', description: 'Additional notes' },
    ],
  },
  {
    module: 'suppliers',
    label: 'Suppliers',
    description: 'Supplier/vendor records',
    uniqueKeys: ['id', 'supplierName'],
    fields: [
      { key: 'supplierName', label: 'Supplier Name', type: 'string', required: true, description: 'Supplier/business name', example: 'ABC Trading' },
      { key: 'companyName', label: 'Company Name', type: 'string', description: 'Company name' },
      { key: 'contactPerson', label: 'Contact Person', type: 'string', description: 'Contact person name', example: 'John Doe' },
      { key: 'phone', label: 'Phone', type: 'string', description: 'Phone number', example: '+251911000000' },
      { key: 'email', label: 'Email', type: 'string', description: 'Email address' },
      { key: 'address', label: 'Address', type: 'string', description: 'Physical address' },
      { key: 'city', label: 'City', type: 'string', description: 'City', example: 'Addis Ababa' },
      { key: 'paymentTerms', label: 'Payment Terms', type: 'string', description: 'Payment terms', example: 'Net 30' },
      { key: 'creditLimit', label: 'Credit Limit', type: 'number', description: 'Credit limit', example: '100000.00' },
      { key: 'notes', label: 'Notes', type: 'string', description: 'Additional notes' },
    ],
  },
  {
    module: 'shipments',
    label: 'Shipments',
    description: 'Shipment/delivery records',
    uniqueKeys: ['id'],
    fields: [
      { key: 'destination', label: 'Destination', type: 'string', required: true, description: 'Delivery destination', example: 'Addis Ababa' },
      { key: 'origin', label: 'Origin', type: 'string', description: 'Origin location', example: 'Bishoftu' },
      { key: 'driverName', label: 'Driver Name', type: 'string', description: 'Driver full name' },
      { key: 'driverPhone', label: 'Driver Phone', type: 'string', description: 'Driver phone number' },
      { key: 'vehicleInfo', label: 'Vehicle Info', type: 'string', description: 'License plate or vehicle details', example: 'AA-1234-AB' },
      { key: 'status', label: 'Status', type: 'string', description: 'pending, in_transit, delivered, cancelled', example: 'pending' },
      { key: 'scheduledDate', label: 'Scheduled Date', type: 'date', description: 'Scheduled date', example: '2025-01-20' },
      { key: 'notes', label: 'Notes', type: 'string', description: 'Additional notes' },
    ],
  },
  {
    module: 'adjustments',
    label: 'Stock Adjustments',
    description: 'Inventory stock adjustments',
    uniqueKeys: ['id'],
    fields: [
      { key: 'itemName', label: 'Item Name', type: 'string', required: true, description: 'Name of the item', example: 'Coffee Beans' },
      { key: 'type', label: 'Adjustment Type', type: 'string', required: true, description: 'damage, loss, add_stock, price_increase, price_decrease', example: 'add_stock' },
      { key: 'quantity', label: 'Quantity', type: 'number', required: true, description: 'Quantity adjusted', example: '100' },
      { key: 'unitType', label: 'Unit Type', type: 'string', description: 'base or pack', example: 'base' },
      { key: 'reason', label: 'Reason', type: 'string', description: 'Reason for adjustment', example: 'Damaged during transport' },
      { key: 'date', label: 'Date', type: 'date', required: true, description: 'Adjustment date', example: '2025-01-15' },
    ],
  },
  {
    module: 'orders',
    label: 'Customer Orders',
    description: 'Customer orders and pre-orders',
    uniqueKeys: ['id', 'orderNumber'],
    fields: [
      { key: 'orderNumber', label: 'Order Number', type: 'string', required: true, description: 'Unique order number', example: 'ORD-001' },
      { key: 'customerName', label: 'Customer Name', type: 'string', description: 'Customer name' },
      { key: 'customerPhone', label: 'Customer Phone', type: 'string', description: 'Customer phone' },
      { key: 'status', label: 'Status', type: 'string', description: 'Order, Completed, Cancelled', example: 'Order' },
      { key: 'itemName', label: 'Item Name', type: 'string', required: true, description: 'Name of ordered item' },
      { key: 'quantity', label: 'Quantity', type: 'number', required: true, description: 'Ordered quantity', example: '10' },
      { key: 'unitPrice', label: 'Unit Price', type: 'number', description: 'Price per unit', example: '50.00' },
      { key: 'notes', label: 'Notes', type: 'string', description: 'Order notes' },
    ],
  },
  {
    module: 'contacts',
    label: 'Contacts',
    description: 'Business contacts',
    uniqueKeys: ['id'],
    fields: [
      { key: 'name', label: 'Name', type: 'string', required: true, description: 'Contact name', example: 'Abebe Kebede' },
      { key: 'phone', label: 'Phone', type: 'string', required: true, description: 'Phone number', example: '+251911000000' },
      { key: 'category', label: 'Category', type: 'string', description: 'Contact category', example: 'supplier' },
      { key: 'notes', label: 'Notes', type: 'string', description: 'Additional notes' },
    ],
  },
  {
    module: 'warehouses',
    label: 'Warehouses',
    description: 'Warehouse/storage locations',
    uniqueKeys: ['id', 'name'],
    fields: [
      { key: 'name', label: 'Warehouse Name', type: 'string', required: true, description: 'Warehouse name', example: 'Main Warehouse' },
      { key: 'location', label: 'Location', type: 'string', description: 'Physical location', example: 'Addis Ababa' },
      { key: 'managerName', label: 'Manager Name', type: 'string', description: 'Manager full name' },
      { key: 'managerPhone', label: 'Manager Phone', type: 'string', description: 'Manager phone number' },
      { key: 'email', label: 'Email', type: 'string', description: 'Email address' },
    ],
  },
  {
    module: 'employees',
    label: 'Employees',
    description: 'Employee records',
    uniqueKeys: ['id'],
    fields: [
      { key: 'firstName', label: 'First Name', type: 'string', required: true, description: 'Employee first name', example: 'Abebe' },
      { key: 'lastName', label: 'Last Name', type: 'string', required: true, description: 'Employee last name', example: 'Kebede' },
      { key: 'employeeCode', label: 'Employee Code', type: 'string', description: 'Unique employee code', example: 'EMP-001' },
      { key: 'phone', label: 'Phone', type: 'string', description: 'Phone number', example: '+251911000000' },
      { key: 'email', label: 'Email', type: 'string', description: 'Email address' },
      { key: 'department', label: 'Department', type: 'string', description: 'Department name', example: 'Sales' },
      { key: 'roleName', label: 'Role', type: 'string', description: 'Employee role name', example: 'Cashier' },
      { key: 'hireDate', label: 'Hire Date', type: 'date', description: 'Date of hire', example: '2025-01-01' },
      { key: 'notes', label: 'Notes', type: 'string', description: 'Additional notes' },
    ],
  },
  {
    module: 'supplier-purchases',
    label: 'Supplier Purchases',
    description: 'Purchase orders from suppliers',
    uniqueKeys: ['id', 'purchaseNumber'],
    fields: [
      { key: 'purchaseNumber', label: 'Purchase Number', type: 'string', required: true, description: 'Purchase order number', example: 'PO-001' },
      { key: 'supplierName', label: 'Supplier Name', type: 'string', required: true, description: 'Supplier name' },
      { key: 'itemName', label: 'Item Name', type: 'string', required: true, description: 'Name of purchased item' },
      { key: 'quantity', label: 'Quantity', type: 'number', required: true, description: 'Quantity purchased', example: '100' },
      { key: 'unitPrice', label: 'Unit Price', type: 'number', required: true, description: 'Price per unit', example: '50.00' },
      { key: 'totalPrice', label: 'Total Price', type: 'number', required: true, description: 'Total purchase amount' },
      { key: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true, description: 'Date of purchase', example: '2025-01-15' },
      { key: 'dueDate', label: 'Due Date', type: 'date', description: 'Payment due date', example: '2025-02-15' },
      { key: 'status', label: 'Status', type: 'string', description: 'draft, pending, approved, ordered, received, cancelled', example: 'pending' },
      { key: 'notes', label: 'Notes', type: 'string', description: 'Additional notes' },
    ],
  },
]

export function getSchema(module: string): ModuleSchema | undefined {
  return MODULE_SCHEMAS.find(s => s.module === module)
}

export function generateCSVTemplate(module: string): string {
  const schema = getSchema(module)
  if (!schema) return ''
  const bom = '\uFEFF'
  const headers = schema.fields.map(f => `"${f.label}"`).join(',')
  const examples = schema.fields.map(f => {
    if (f.required) return `"${f.example || ''}"`
    return '""'
  }).join(',')
  return `${bom}${headers}\n${examples}\n`
}

export function generateCSVExport(module: string, data: Record<string, any>[]): string {
  const schema = getSchema(module)
  if (!schema || !data.length) return ''
  const bom = '\uFEFF'
  const headers = schema.fields.map(f => `"${f.label}"`).join(',')
  const rows = data.map(item =>
    schema.fields.map(f => {
      const val = item[f.key] ?? item[f.key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')] ?? ''
      return `"${String(val).replace(/"/g, '""')}"`
    }).join(',')
  )
  return `${bom}${headers}\n${rows.join('\n')}\n`
}

export function parseCSVRow(row: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < row.length; i++) {
    const c = row[i]
    if (c === '"') {
      if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  result.push(current.trim())
  return result
}

export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 1) return { headers: [], rows: [] }
  const headers = parseCSVRow(lines[0])
  const rows = lines.slice(1).map(l => parseCSVRow(l))
  return { headers, rows }
}

export interface ColumnMatch {
  fieldKey: string
  headerIndex: number
  confidence: 'exact' | 'fuzzy' | 'none'
}

export function matchColumns(schema: ModuleSchema, fileHeaders: string[]): ColumnMatch[] {
  return schema.fields.map(field => {
    const lower = fileHeaders.map(h => h.toLowerCase().trim())
    const fieldLower = field.label.toLowerCase().trim()
    const exact = lower.indexOf(fieldLower)
    if (exact >= 0) return { fieldKey: field.key, headerIndex: exact, confidence: 'exact' as const }

    const aliases = [
      field.key,
      field.key.replace(/([A-Z])/g, ' $1').trim().toLowerCase(),
      field.key.replace(/_/g, ' ').toLowerCase(),
      field.label.replace(/[()]/g, '').toLowerCase().trim(),
    ]
    for (const alias of aliases) {
      const idx = lower.indexOf(alias)
      if (idx >= 0) return { fieldKey: field.key, headerIndex: idx, confidence: 'fuzzy' as const }
    }

    return { fieldKey: field.key, headerIndex: -1, confidence: 'none' as const }
  })
}

export interface ValidationError {
  row: number
  field: string
  message: string
}

export function validateRow(
  schema: ModuleSchema,
  row: string[],
  columnMap: ColumnMatch[],
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = []
  for (const match of columnMap) {
    const field = schema.fields.find(f => f.key === match.fieldKey)
    if (!field) continue
    if (match.headerIndex === -1) {
      if (field.required) {
        errors.push({ row: rowIndex, field: field.label, message: `Required field "${field.label}" is missing from CSV` })
      }
      continue
    }
    const value = row[match.headerIndex]?.trim() ?? ''
    if (field.required && !value) {
      errors.push({ row: rowIndex, field: field.label, message: `"${field.label}" is required but empty` })
    }
    if (value) {
      if (field.type === 'number' && isNaN(Number(value))) {
        errors.push({ row: rowIndex, field: field.label, message: `"${field.label}" must be a number, got "${value}"` })
      }
      if (field.type === 'date') {
        const d = new Date(value)
        if (isNaN(d.getTime())) {
          errors.push({ row: rowIndex, field: field.label, message: `"${field.label}" must be a valid date, got "${value}"` })
        }
      }
    }
  }
  return errors
}
