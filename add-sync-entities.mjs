import fs from 'fs';

const path = 'C:/Users/Natol/Desktop/Projects/shega-desktop/src/main/database.ts';
let s = fs.readFileSync(path, 'utf8');

// --- 1) Insert v30 migration before the change-capture triggers block ---
const anchor = '  // ========== CHANGE CAPTURE TRIGGERS (run after migrations so all sync columns exist) ==========';
const ai = s.indexOf(anchor);
if (ai < 0) { console.error('ANCHOR1 not found'); process.exit(1); }

const migration = `  // 6.x: bring the operational entity tables (budgets, suppliers, contacts,
  // orders, shipments, employees, subscriptions) into the LAN/cloud sync stream.
  // Each gets the standard sync columns + a stable uuid so the same outbox/LWW/
  // idempotency protocol used by POS entities applies. Desktop is canonical; the
  // mobile client mirrors the same (snake/camel) column names.
  if (version < 30) {
    const opTables = ['budgets','suppliers','contacts','orders','order_items','order_history','shipments','shipment_items','shipment_history','employees','employee_accounts','employee_roles','attendance','employee_performance','subscriptions'];
    for (const tbl of opTables) {
      let names: string[] = [];
      try { names = (db.prepare(\`PRAGMA table_info(\${tbl})\`).all() as any[]).map((c: any) => c.name); } catch { continue; }
      const add = (col: string, def: string) => { if (!names.includes(col)) { try { db.exec(\`ALTER TABLE \${tbl} ADD COLUMN \${col} \${def}\`); } catch {} } };
      add('uuid', 'TEXT');
      add('device_id', 'TEXT');
      add('row_version', 'INTEGER DEFAULT 1');
      add('updated_at', 'TEXT');
      add('deleted_at', 'TEXT');
      add('is_deleted', 'INTEGER DEFAULT 0');
      add('is_synced', 'INTEGER DEFAULT 1');
      try { db.exec(\`UPDATE \${tbl} SET updated_at = COALESCE(updated_at, createdAt, CURRENT_TIMESTAMP) WHERE updated_at IS NULL\`); } catch {}
      try { db.exec(\`UPDATE \${tbl} SET uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), row_version = 1 WHERE uuid IS NULL;\`); } catch {}
      try { db.exec(\`CREATE UNIQUE INDEX IF NOT EXISTS idx_\${tbl}_uuid ON \${tbl}(uuid);\`); } catch {}
    }
    // supplier -> optional contact link (dedicated suppliers table)
    let supN: string[] = [];
    try { supN = (db.prepare('PRAGMA table_info(suppliers)').all() as any[]).map((c: any) => c.name); } catch {}
    if (!supN.includes('contact_id')) { try { db.exec('ALTER TABLE suppliers ADD COLUMN contact_id INTEGER REFERENCES contacts(id)'); } catch {} }
    version = 30;
    db.pragma(\`user_version = \${version}\`);
  }

`;

s = s.slice(0, ai) + migration + s.slice(ai);

// --- 2) Append new entities to the change-capture syncTables array ---
const arrAnchor = '  ];\n  const genUuid = "lower(hex(randomblob(4))';
const arrIdx = s.indexOf('  ];\n  const genUuid');
if (arrIdx < 0) { console.error('ARRAY close not found'); process.exit(1); }

const entries = `    { table: 'budgets', id: 'id', columns: ['id','businessId','category','amount','period','month','year','budgetType','referenceName','isRecurring','notes','updatedAt','createdAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'suppliers', id: 'id', columns: ['id','businessId','supplierCode','supplierName','companyName','contactPerson','phone','secondaryPhone','email','address','city','country','taxNumber','paymentTerms','creditLimit','notes','status','isActive','createdAt','updatedAt','contact_id','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'contacts', id: 'id', columns: ['id','businessId','name','phone','category','subCategory','notes','createdAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'orders', id: 'id', columns: ['id','businessId','orderNumber','customerName','customerPhone','notes','status','totalAmount','createdBy','createdByName','createdAt','convertedAt','convertedBy','cancelledAt','cancelledBy','cancelReason','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'order_items', id: 'id', columns: ['id','orderId','itemId','itemName','quantity','unit','unitType','unitPrice','totalPrice','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'shipments', id: 'id', columns: ['id','businessId','origin','destination','driverName','driverPhone','vehicleInfo','status','notes','scheduledDate','deliveredAt','createdAt','updatedAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'shipment_items', id: 'id', columns: ['id','shipmentId','itemId','itemName','quantity','unit','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'employees', id: 'id', columns: ['id','employeeCode','firstName','lastName','phone','email','address','emergencyContact','gender','dateOfBirth','roleId','department','warehouseId','isActive','employmentStatus','avatar','hireDate','notes','createdAt','updatedAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] },
    { table: 'subscriptions', id: 'id', columns: ['id','businessId','planId','tier','status','startedAt','expiresAt','trialStartedAt','trialEndsAt','isTrial','autoRenew','createdAt','updatedAt','uuid','device_id','row_version','updated_at','is_deleted','deleted_at','is_synced'] }
`;

s = s.slice(0, arrIdx) + entries + s.slice(arrIdx);

fs.writeFileSync(path, s, 'utf8');
console.log('desktop database.ts updated OK');