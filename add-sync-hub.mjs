import fs from 'fs';

const path = 'C:/Users/Natol/Desktop/Projects/shega-desktop/src/main/sync-hub.ts';
let s = fs.readFileSync(path, 'utf8');

// --- 1) Add new entities to SHARED_TABLES (before the closing '] as const;') ---
const rst = "  'audit_logs'\n] as const;";
const rsi = s.indexOf(rst);
if (rsi < 0) { console.error('SHARED_TABLES close not found'); process.exit(1); }
const newTables = `  'budgets',
  'suppliers',
  'contacts',
  'orders',
  'order_items',
  'shipments',
  'shipment_items',
  'employees',
  'subscriptions',
  'audit_logs'
] as const;`;
s = s.slice(0, rsi) + newTables + s.slice(rsi + rst.length);

// --- 2) Extend applyChange FK resolution for the new relational entities ---
// The existing sales/returns/stock_movements itemId resolution block exists; we
// add generic resolution for the new child-table FKs (orderId/itemId on
// order_items, shipmemtId/itemId on shipment_items) before the insert cols run.
const fkAnchor = `    if (entity === 'sales' && insertData.packId != null) {
      const hubPackId = resolveFk(deviceId, 'item_packs', insertData.packId);
      if (hubPackId != null) insertData.packId = hubPackId;
    }`;
const fki = s.indexOf(fkAnchor);
if (fki < 0) { console.error('FK anchor not found'); process.exit(1); }
const fkBlock = `    if (entity === 'sales' && insertData.packId != null) {
      const hubPackId = resolveFk(deviceId, 'item_packs', insertData.packId);
      if (hubPackId != null) insertData.packId = hubPackId;
    }
    // Relational child entities: resolve boolean ownership/listing FKs to local
    // INTEGER ids via the uuid registry (same pattern as items above).
    if (entity === 'order_items' || entity === 'shipment_items') {
      if (insertData.itemId != null) {
        const hubItemId = resolveFk(deviceId, 'items', insertData.itemId);
        if (hubItemId != null) insertData.itemId = hubItemId; else insertData.itemId = null;
      }
      if (entity === 'order_items' && insertData.orderId != null) {
        const hubOrderId = resolveFk(deviceId, 'orders', insertData.orderId);
        if (hubOrderId != null) insertData.orderId = hubOrderId; else insertData.orderId = null;
      }
      if (entity === 'shipment_items' && insertData.shipmentId != null) {
        const hubShipId = resolveFk(deviceId, 'shipments', insertData.shipmentId);
        if (hubShipId != null) insertData.shipmentId = hubShipId; else insertData.shipmentId = null;
      }
    }`;
s = s.slice(0, fki) + fkBlock + s.slice(fki + fkAnchor.length);

fs.writeFileSync(path, s, 'utf8');
console.log('desktop sync-hub.ts updated OK');