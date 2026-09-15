import { ipcMain, BrowserWindow, shell } from 'electron';
import type { WebContents } from 'electron';
import db, { validateDBFile, reopenDB, getDemoMode, setDemoMode, resetDemoDb, getCurrentDb } from './database';
import { insertAudit, verifyAuditChain } from './audit-chain';
import crypto from 'crypto';
import { statSync, copyFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'fs';
import path from 'path';
import { app } from 'electron';
import { appUpdater } from './updater';
import { saleSchema, saleUpdateSchema, saleBatchSchema, payDebtSchema, orderConversionSchema, validate } from './validation';
import { getPrinterConfig, savePrinterConfig, getPrintStatus, printRaw, openDrawer, probePrinter } from './print-service';
import { buildReceiptCommands, buildLabelCommands, buildTestPageCommands } from './receipt';
import { parseWeightLine, ScaleConfig } from './scale-service';
import { fiscalAdapter } from './fiscal';
import { syncHub } from './index';
import { verifyChecksums, getPairingToken, getLanAddress, requestDeviceResync } from './sync-hub';
import * as shifts from './pos/shifts';
import * as reports from './pos/reports';
import * as ledger from './pos/ledger';
import * as tax from './pos/tax';
import * as morQr from './pos/mor-qr';
import * as compliance from './pos/compliance';
import * as etaxExport from './pos/etax-export';
import { BUILTIN_ROLES, exceedsDiscountCap, getDiscountCap, getBuiltinRole, mergePermissionSets } from '@shega/shared';
import type { PermissionValue } from '@shega/shared';
import { registerBusinessDomainHandlers } from './business-domain';
import { p2pSync } from './sync/p2p-sync-manager';
import {
  isApproverRole,
  resolveApprover,
  promptForPin,
  registerApprovalResolvers,
  verifyStoredPin,
  ApprovalOutcome,
} from './approval';
import {
  bridgeAdminUser,
  bridgeDeleteBySource,
  bridgeEmployeeUser,
  findRosterLogin,
  reconcileUserBridge,
} from './user-bridge';

// §15 — Desktop manager-PIN approval gate. Returns true when the sensitive
// action may proceed: either the acting user is an approver (Owner/Administrator/
// Manager/super_admin — same bypass Mobile applies), or a manager PIN was
// successfully verified here in the main process.
async function gateSensitiveAction(
  webContents: WebContents,
  ctx: { context: string; title?: string; message?: string }
): Promise<boolean> {
  if (isApproverRole(currentUserRole)) return true;
  const approver = resolveApprover(getActiveBusinessId());
  if (!approver) return false;
  if (!approver.pin) return false;
  const result: ApprovalOutcome = await promptForPin(
    webContents,
    {
      context: ctx.context,
      title: ctx.title ?? 'Manager approval required',
      message: ctx.message ?? 'This action requires manager approval. Enter the manager PIN.',
      approverName: approver.name,
    },
    approver,
    verifyStoredPin
  );
  if (result === 'approved') {
    insertAuditLog('manager_approval', 'approval', null, null, null, null, `${ctx.context} approved by approver ${approver.name}`);
  }
  return result === 'approved';
}

/**
 * §1.7 Price-override approval — enforce per-role max discount %.
 *
 * Computes the highest discount percentage across a batch of sale lines (against
 * each item's current selling price) and, when it exceeds the acting user's role
 * cap, requires manager approval via the §15 PIN gate. Returns the approved
 * override reason (and whether the override happened at all) so callers can stamp
 * `overrideBy` / `overrideReason` on the sale rows.
 */
async function gateDiscountOverrides(
  webContents: WebContents,
  sales: any[],
  message?: string
): Promise<{ requiresOverride: boolean; approved: boolean; overrideReason: string }> {
  let maxPct = 0;
  let hasDiscount = false;
  for (const s of sales as any[]) {
    const discount = s.discount || 0;
    if (discount <= 0) continue;
    hasDiscount = true;
    const item = db.prepare('SELECT baseSellingPrice FROM items WHERE id = ?').get(s.itemId) as any;
    const subtotal = item?.baseSellingPrice ? s.quantity * item.baseSellingPrice : (s.totalPrice || 0) + discount;
    const pct = subtotal > 0 ? (discount / subtotal) * 100 : 0;
    if (pct > maxPct) maxPct = pct;
  }

  const role = (currentUserRole || '').toLowerCase();
  const cap = getDiscountCap(role);
  // Approvers (Owner/Administrator/Manager/super_admin/admin) are never blocked.
  if (!hasDiscount || isApproverRole(currentUserRole) || cap === null || maxPct <= cap) {
    return { requiresOverride: false, approved: true, overrideReason: '' };
  }

  const overrideReason =
    (sales as any[]).map((s) => s.overrideReason).find((r) => r) || 'Over-limit discount';
  const ok = await gateSensitiveAction(webContents, {
    context: `Discount ${Math.round(maxPct)}% exceeds your ${cap}% limit`,
    title: 'Price override approval required',
    message:
      message ||
      `This discount is above your ${cap}% role limit. Manager approval is required. Enter the manager PIN to proceed.`,
  });
  return { requiresOverride: true, approved: ok, overrideReason };
}


let activeBusinessId: number | null = null;
let currentAdminId: number | null = null;
let currentUserName: string | null = null;
let currentUserRole: string | null = null;
let currentUserPermissions: string[] = [];
let currentUserBusinessId: number | null = null; // set when an employee signs in; pins them to one business
// Canonical @shega/shared permission set for the signed-in user. null = local
// admin / owner-level access (full). Employees resolve their builtin role +
// per-role overrides so domain handlers gate by team.manage etc.
let currentUserSharedPerms: Record<string, PermissionValue> | null = null;

// Maps granular permission prefixes (and module names) to the module-level permission that grants them.
const PERMISSION_MODULE: Record<string, string> = {
  dashboard: 'dashboard',
  inventory: 'inventory',
  purchases: 'inventory',
  sales: 'sales',
  orders: 'sales',
  payments: 'sales',
  expenses: 'expenses',
  customers: 'customers',
  analytics: 'analytics',
  reports: 'analytics',
  settings: 'settings',
  notifications: 'settings',
  employees: 'employees',
  team: 'employees',
  shipments: 'shipments',
  suppliers: 'suppliers',
  warehouses: 'warehouses',
  audit: 'audit',
  records: 'audit',
};

/**
 * Resolve the canonical @shega/shared effective permission set for an employee
 * from their builtin role key + stored per-role overrides. Legacy employees
 * without a role_key default to cashier (narrowest safe default).
 */
function resolveSharedPermissions(roleKey?: string, permissionsJson?: string): Record<string, PermissionValue> | null {
  const base = getBuiltinRole((roleKey as any) || 'cashier');
  if (!base) return null;
  let overrides: Partial<Record<string, PermissionValue>> = {};
  if (permissionsJson) {
    try { overrides = JSON.parse(permissionsJson); } catch (e) { overrides = {}; }
  }
  return mergePermissionSets(base.permissions, overrides);
}

/**
 * Resolve the current session's effective identity from the synced `users`
 * roster (the canonical cross-device person record carrying the membership role
 * + permissions). When the signed-in person exists in the roster, their role /
 * permissions SHOULD be the roster's (backend/membership-derived) so the same
 * account is the SAME user with the SAME role on every device — never a fresh
 * per-device identity. Returns null when no roster row matches (fresh install
 * before first cloud/roster sync → keep the legacy admin/employee identity).
 */
function resolveRosterIdentity(): {
  role: string;
  permissions: string[];
  sharedPerms: Record<string, PermissionValue> | null;
  businessId: number | null;
  isOwner: boolean;
  rosterUserId: number | null;
} | null {
  if (!currentUserName) return null;
  // Match this person in the roster by the email/login username first, then by
  // name. The roster `users` row is the person across devices (same phone/email
  // identity synced from Mobile or another install).
  const roster = db
    .prepare(
      `SELECT id, businessId, name, email, phone, role, roleName, permissions,
              isActive, isOwner, pinHash
       FROM users
       WHERE is_deleted = 0 AND isActive = 1
         AND (email = ? OR name = ? OR phone = ?)
       ORDER BY CASE WHEN isOwner = 1 THEN 0 ELSE 1 END
       LIMIT 1`
    )
    .get(currentUserName, currentUserName, currentUserName) as any;
  if (!roster) return null;

  const isOwner = !!roster.isOwner || roster.role === 'owner' || roster.role === 'super_admin';
  const rawPerms: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(roster.permissions || '{}');
    if (parsed && typeof parsed === 'object') Object.assign(rawPerms, parsed);
  } catch (e) {
    /* keep {} */
  }
  const legacyPerms = Object.keys(rawPerms).filter((k) => !['*'].includes(k));
  const sharedPerms = resolveSharedPermissions(roster.role, roster.permissions);

  return {
    role: isOwner ? 'owner' : (roster.roleName || roster.role || 'cashier'),
    permissions: isOwner ? ['*'] : (legacyPerms.length ? legacyPerms : ['*']),
    sharedPerms,
    businessId: roster.businessId ?? null,
    isOwner,
    rosterUserId: roster.id ?? null,
  };
}

function requirePermission(perm: string) {
  if (currentUserRole === 'super_admin') return;
  if (currentUserPermissions.includes(perm) || currentUserPermissions.includes('*')) return;
  // Canonical @shega/shared PermissionKey grants (employees resolve their builtin
  // role + overrides into currentUserSharedPerms; e.g. cashier holds products.view).
  if (currentUserSharedPerms && currentUserSharedPerms[perm] === true) return;
  const prefix = perm.split('.')[0];
  const modulePerm = PERMISSION_MODULE[prefix] || prefix;
  const effective = new Set(
    currentUserPermissions.map((p) => PERMISSION_MODULE[p.split('.')[0]] || p)
  );
  if (effective.has(modulePerm)) return;
  throw new Error(`Permission denied: ${perm}`);
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

export function getActiveBusinessId(): number {
  if (!activeBusinessId) {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'active_business_id'").get() as any;
    if (row) {
      activeBusinessId = parseInt(row.value);
    } else {
      const defaultBiz = db.prepare("SELECT id FROM businesses WHERE isDefault = 1 LIMIT 1").get() as any;
      activeBusinessId = defaultBiz?.id || 1;
    }
  }
  const live = db.prepare('SELECT id FROM businesses WHERE id = ? AND is_deleted = 0').get(activeBusinessId) as any;
  if (!live) {
    const first = db.prepare("SELECT id FROM businesses WHERE is_deleted = 0 ORDER BY CASE WHEN isDefault = 1 THEN 0 ELSE 1 END, id LIMIT 1").get() as any;
    activeBusinessId = first?.id || activeBusinessId;
  }
  return activeBusinessId as number;
}

function setActiveBusinessId(id: number) {
  activeBusinessId = id;
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('active_business_id', ?)").run(String(id));
}

function clearActiveBusinessCache() {
  activeBusinessId = null;
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


function insertAuditLog(action: string, entityType: string, entityId: number | null, fieldName: string | null, oldValue: string | null, newValue: string | null, description: string | null) {
  try {
    insertAudit(db, {
      businessId: getActiveBusinessId(),
      action,
      entityType,
      entityId,
      fieldName,
      oldValue,
      newValue,
      changedBy: currentUserName || 'unknown',
      changedById: null,
      description,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.error(`[AuditLog] Failed to log ${action}:`, e);
  }
}

import { importData } from './csv-import';

export function registerIPCHandlers() {
  console.log('[Handlers] registerIPCHandlers called');
  registerApprovalResolvers();

  // ========== BUSINESSES ==========
  ipcMain.handle('get-active-business', () => {
    const id = getActiveBusinessId();
    return db.prepare('SELECT * FROM businesses WHERE id = ?').get(id);
  });

  ipcMain.handle('update-business', (_, id: number, biz: any) => {
    requirePermission('settings');
    if (!biz.businessName?.trim()) throw new Error('Business name is required');
    const stmt = db.prepare('UPDATE businesses SET businessName = ?, storeName = ?, logo = ?, address = ?, phone = ?, email = ?, currency = ? WHERE id = ?');
    return stmt.run(biz.businessName, biz.storeName, biz.logo, biz.address, biz.phone, biz.email, biz.currency, id);
  });

  // ========== P2P Yjs + WebRTC sync ==========
  ipcMain.handle('p2p:health', () => p2pSync.getHealth());
  ipcMain.handle('p2p:devices', () => p2pSync.getDevices());
  ipcMain.handle('p2p:announce', () => { p2pSync.announce(); return true; });
  ipcMain.handle('p2p:revoke-device', (_, deviceId: string) => { p2pSync.revokeDevice(deviceId); return true; });
  ipcMain.handle('p2p:rename-device', (_, deviceId: string, name: string) => p2pSync.renameDevice(deviceId, name));
  ipcMain.handle('p2p:record-counts', () => p2pSync.getRecordCounts());

  ipcMain.handle('business:list', () => {
    const totalBiz = (db.prepare('SELECT COUNT(*) c FROM businesses WHERE is_deleted = 0').get() as any).c;
    const activeId = getActiveBusinessId();
    return db.prepare(`
      SELECT b.*,
        (SELECT COUNT(*) FROM employees e WHERE e.businessId = b.id AND e.isActive = 1 AND e.is_deleted = 0) as employeeCount,
        (SELECT COUNT(*) FROM roster_devices r WHERE r.businessId = b.id AND r.is_deleted = 0) as deviceCount,
        (SELECT COUNT(*) FROM registers r WHERE r.businessId = b.id AND r.is_deleted = 0) as registerCount,
        (SELECT COUNT(*) FROM locations l WHERE l.businessId = b.id AND l.is_deleted = 0) as locationCount
      FROM businesses b
      WHERE b.is_deleted = 0
      ORDER BY CASE WHEN b.isDefault = 1 THEN 0 ELSE 1 END, b.createdAt
    `).all().map((b: any) => ({ ...b, totalBusinesses: totalBiz, isActive: b.id === activeId }));
  });

  ipcMain.handle('business:create', (_, data: any) => {
    if (!data?.businessName?.trim()) throw new Error('Business name is required');
    const isFirst = (db.prepare('SELECT COUNT(*) c FROM businesses WHERE is_deleted = 0').get() as any).c === 0;
    const result = db.prepare('INSERT INTO businesses (businessName, storeName, logo, address, phone, email, currency, isDefault) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(data.businessName.trim(), data.storeName?.trim() || data.businessName.trim(), data.logo || null, data.address || null, data.phone || null, data.email || null, data.currency || 'ETB', 0);
    const bizId = result.lastInsertRowid as number;
    const whRes = db.prepare('INSERT INTO warehouses (businessId, name, location, managerName) VALUES (?, ?, ?, ?)')
      .run(bizId, 'Main Warehouse', data.address || 'Headquarters', 'Operations Manager');
    const locRes = db.prepare('INSERT INTO locations (businessId, name, address) VALUES (?, ?, ?)')
      .run(bizId, 'Main Location', data.address || null);
    db.prepare('INSERT INTO registers (businessId, locationId, name, isActive) VALUES (?, ?, ?, 1)')
      .run(bizId, locRes.lastInsertRowid as number, 'Main Register');
    if (isFirst) {
      db.prepare('UPDATE businesses SET isDefault = 1 WHERE id = ?').run(bizId);
    }
    // Multi-business: the creator becomes the OWNER member of the new business
    // (per-business membership, separate from their other businesses).
    try {
      db.prepare(`
        INSERT INTO users (businessId, name, username, email, role, roleName, permissions, isActive, isOwner, sourceType, sourceId, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'owner', 'Owner', ?, 1, 1, 'admin', ?, ?, ?)
      `).run(
        bizId, currentUserName || 'Owner', null, null,
        JSON.stringify(['*']), currentAdminId ?? null,
        new Date().toISOString(), new Date().toISOString(),
      );
    } catch { /* roster table schema may differ on old installs */ }
    // The creator can always operate the business they just created — switch
    // the session to it even when they already belong to another business.
    setActiveBusinessId(bizId);
    insertAuditLog('business_created', 'business', bizId, 'businessName', null, data.businessName.trim(), `Business "${data.businessName.trim()}" created by ${currentUserName || 'unknown'} (wh #${whRes.lastInsertRowid})`);
    return db.prepare('SELECT * FROM businesses WHERE id = ?').get(bizId);
  });

  ipcMain.handle('business:switch', (_, id: number) => {
    if (!Number.isInteger(+id)) throw new Error('Invalid business id');
    // Employee-scoped accounts may only operate the business of their
    // membership. Owners/admins (multi-business operators) may switch freely
    // between the businesses they created or hold memberships in.
    if (currentUserBusinessId && currentUserBusinessId !== +id) {
      const isOperator = currentUserRole === 'super_admin' || currentUserRole === 'admin' || currentUserRole === 'owner';
      const membership = db.prepare('SELECT id FROM users WHERE businessId = ? AND (id = ? OR username = ? OR name = ?) AND is_deleted = 0 AND isActive = 1')
        .get(+id, currentAdminId ?? -1, currentUserName ?? '', currentUserName ?? '') as any;
      if (!isOperator && !membership) {
        throw new Error('You are signed in as an employee of another business and cannot switch businesses.');
      }
    }
    const biz = db.prepare('SELECT * FROM businesses WHERE id = ? AND is_deleted = 0').get(+id) as any;
    if (!biz) throw new Error('Business not found');
    setActiveBusinessId(+id);
    // Re-scope the P2P/Yjs sync to the new business immediately — the old
    // business doc is closed and the new one bootstrapped, so data can never
    // cross the business boundary after switching.
    try {
      const { reScopePeerSync } = require('./peer-sync');
      reScopePeerSync(+id);
    } catch { /* sync layer may not be running yet */ }
    // Ask every renderer window to reload its business-scoped data so no
    // records from the previous business stay on screen.
    const { BrowserWindow } = require('electron');
    for (const w of BrowserWindow.getAllWindows()) {
      w.webContents.send('business-changed', { businessId: +id, name: biz.businessName });
    }
    return biz;
  });

  ipcMain.handle('business:set-default', (_, id: number) => {
    requirePermission('settings');
    if (currentUserRole !== 'super_admin' && currentUserRole !== 'admin') throw new Error('Only platform administrators can set the default business');
    const biz = db.prepare('SELECT id FROM businesses WHERE id = ? AND is_deleted = 0').get(+id) as any;
    if (!biz) throw new Error('Business not found');
    db.prepare('UPDATE businesses SET isDefault = 0').run();
    db.prepare('UPDATE businesses SET isDefault = 1 WHERE id = ?').run(+id);
    insertAuditLog('business_set_default', 'business', +id, 'isDefault', null, '1', `Business #${id} set as default by ${currentUserName || 'unknown'}`);
    return { success: true };
  });

  ipcMain.handle('business:archive', (_, id: number) => {
    requirePermission('settings');
    const bizId = +id;
    const biz = db.prepare('SELECT * FROM businesses WHERE id = ? AND is_deleted = 0').get(bizId) as any;
    if (!biz) throw new Error('Business not found');
    const active = getActiveBusinessId();
    if (active === bizId) throw new Error('Cannot archive the currently active business. Switch to another business first.');
    const remaining = (db.prepare('SELECT COUNT(*) c FROM businesses WHERE is_deleted = 0 AND id != ?').get(bizId) as any).c;
    if (remaining === 0) throw new Error('Cannot archive the last business.');
    if (currentUserBusinessId === bizId) throw new Error('You cannot archive the business you are signed into.');
    db.prepare("UPDATE businesses SET is_deleted = 1, is_synced = 0, row_version = row_version + 1, deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?").run(bizId);
    insertAuditLog('business_archived', 'business', bizId, 'is_deleted', '0', '1', `Business "${biz.businessName}" archived by ${currentUserName || 'unknown'}`);
    return { success: true };
  });

  ipcMain.handle('business:leave', (_, id: number) => {
    if (currentUserBusinessId) throw new Error('Employees cannot leave a business. Contact a platform administrator.');
    if (!currentAdminId) throw new Error('Not signed in');
    const bizId = +id;
    if (getActiveBusinessId() === bizId) throw new Error('Switch to another business before leaving this one.');
    const remaining = (db.prepare('SELECT COUNT(*) c FROM businesses WHERE is_deleted = 0 AND id != ?').get(bizId) as any).c;
    if (remaining === 0) throw new Error('Cannot leave the last business.');
    db.prepare("UPDATE businesses SET is_deleted = 1, is_synced = 0, row_version = row_version + 1, deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?").run(bizId);
    insertAuditLog('business_left', 'business', bizId, 'is_deleted', '0', '1', `Admin left business "${bizId}"`);
    return { success: true };
  });

  // ========== CATEGORIES ==========
  ipcMain.handle('get-categories', () => {
    const bizId = getActiveBusinessId();
    return db.prepare('SELECT * FROM categories WHERE businessId = ? AND isCustom = 1 ORDER BY name').all(bizId);
  });

  ipcMain.handle('insert-category', (_, name: string, icon?: string) => {
    requirePermission('settings.manage');
    const bizId = getActiveBusinessId();
    const result = db.prepare('INSERT INTO categories (businessId, name, icon, isCustom) VALUES (?, ?, ?, 1)').run(bizId, name, icon || 'tag');
    return result.lastInsertRowid;
  });

  ipcMain.handle('delete-category', (_, id: number) => {
    requirePermission('settings.manage');
    const bizId = getActiveBusinessId();
    const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(id) as any;
    db.prepare('DELETE FROM categories WHERE id = ? AND businessId = ? AND isCustom = 1').run(id, bizId);
  });

  // ========== ITEMS ==========
  ipcMain.handle('get-items', (_, options: any = {}) => {
    requirePermission('inventory.view');
    const bizId = getActiveBusinessId();
    let query = 'SELECT items.*, categories.name as categoryName, suppliers.supplierName FROM items LEFT JOIN categories ON items.categoryId = categories.id LEFT JOIN suppliers ON items.supplierId = suppliers.id';
    const params: any[] = [];
    const conditions: string[] = ['items.businessId = ?', "items.is_deleted = 0"];
    params.push(bizId);

    if (options.search) {
      conditions.push('(LOWER(items.name) LIKE LOWER(?) OR LOWER(items.companyName) LIKE LOWER(?))');
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
    const offset = options.offset ?? 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(listLimit, offset);

    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-item', (_, id: number) => {
    requirePermission('inventory.view');
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

  ipcMain.handle('get-item-by-barcode', (_, code: string) => {
    requirePermission('inventory.view');
    const bizId = getActiveBusinessId();
    if (!code || !code.trim()) return null;
    return db.prepare(`
      SELECT items.*, categories.name as categoryName
      FROM items
      LEFT JOIN categories ON items.categoryId = categories.id
      WHERE items.businessId = ? AND items.is_deleted = 0
        AND (items.barcode = ? COLLATE NOCASE OR items.sku = ? COLLATE NOCASE)
      LIMIT 1
    `).get(bizId, code, code) as any || null;
  });

  ipcMain.handle('insert-item', (_, item: any) => {
    requirePermission('inventory.add');
    if (!item.name || !item.name.trim()) throw new Error('Product name is required');
    const unitsPerPack = validatePositive(item.unitsPerPack ?? 1, 'Units per pack');
    const bizId = getActiveBusinessId();
    const purchaseDate = new Date().toISOString().split('T')[0];
    const stmt = db.prepare(`
      INSERT INTO items (
        businessId, name, categoryId, sku, barcode, companyName, purchaseUnit, baseUnit, unitsPerPack,
        totalPackQuantity, totalBaseQuantity, packPurchasePrice, basePurchasePrice,
        baseSellingPrice, packSellingPrice, allowSellByBaseUnit, allowSellByPackUnit,
        expiryDate, qualityGrade, taxType, taxTreatment, notes, isCredit, supplierPhone, supplierId,
        reorderPoint, reorderQty, autoReorder, createdAt,
        image, wholesaleSellingPrice, minWholesaleQty,
        transportCost, importCost, packagingCost, handlingCost, otherCost, targetMargin,
        supplierAccount, supplierCallEnabled, warehouseId, isActive, quickProduct
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const newBaseQty = item.totalBaseQuantity || 0;
    const newPackQty = item.totalPackQuantity || 0;

    const result = stmt.run(
      bizId, item.name, item.categoryId || null, item.sku || null, item.barcode || null, item.companyName, item.purchaseUnit, item.baseUnit, unitsPerPack,
      newPackQty, newBaseQty, item.packPurchasePrice || 0, item.basePurchasePrice || 0,
      item.baseSellingPrice || 0, item.packSellingPrice || 0, item.allowSellByBaseUnit ? 1 : 0, item.allowSellByPackUnit ? 1 : 0,
      item.expiryDate || null, item.qualityGrade, item.taxType || null, item.taxTreatment || null, item.notes, item.isCredit ? 1 : 0, item.supplierPhone,
      item.supplierId || null, item.reorderPoint ?? 10, item.reorderQty ?? 0, item.autoReorder ? 1 : 0, purchaseDate,
      item.image || null, item.wholesaleSellingPrice ?? null, item.minWholesaleQty ?? null,
      item.transportCost ?? 0, item.importCost ?? 0, item.packagingCost ?? 0, item.handlingCost ?? 0, item.otherCost ?? 0, item.targetMargin ?? null,
      item.supplierAccount || null, item.supplierCallEnabled ? 1 : 0, item.warehouseId ?? null, item.isActive ?? 1, item.quickProduct ? 1 : 0
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
          bizId, item.supplierId, purchaseNumber, purchaseDate,
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

    return newId;
  });

  ipcMain.handle('update-item', (_, id: number, item: any) => {
    requirePermission('inventory.edit');
    if (!item.name || !item.name.trim()) throw new Error('Product name is required');
    const unitsPerPack = validatePositive(item.unitsPerPack ?? 1, 'Units per pack');
    const bizId = getActiveBusinessId();
    const result = db.transaction(() => {
      const stmt = db.prepare(`
        UPDATE items SET
          name = ?, categoryId = ?, sku = ?, barcode = ?, companyName = ?, purchaseUnit = ?, baseUnit = ?, unitsPerPack = ?,
          totalPackQuantity = ?, totalBaseQuantity = ?, packPurchasePrice = ?, basePurchasePrice = ?,
          baseSellingPrice = ?, packSellingPrice = ?, allowSellByBaseUnit = ?, allowSellByPackUnit = ?,
          expiryDate = ?, qualityGrade = ?, taxType = ?, taxTreatment = ?, notes = ?, isCredit = ?, supplierPhone = ?,
          supplierId = ?, reorderPoint = ?, reorderQty = ?, autoReorder = ?,
          image = ?, wholesaleSellingPrice = ?, minWholesaleQty = ?,
          transportCost = ?, importCost = ?, packagingCost = ?, handlingCost = ?, otherCost = ?, targetMargin = ?,
          supplierAccount = ?, supplierCallEnabled = ?, warehouseId = ?, isActive = ?, quickProduct = ?
        WHERE id = ? AND businessId = ?
      `);

      const result = stmt.run(
        item.name, item.categoryId || null, item.sku || null, item.barcode || null, item.companyName, item.purchaseUnit, item.baseUnit, unitsPerPack,
        item.totalPackQuantity || 0, item.totalBaseQuantity || 0, item.packPurchasePrice || 0, item.basePurchasePrice || 0,
        item.baseSellingPrice || 0, item.packSellingPrice || 0, item.allowSellByBaseUnit ? 1 : 0, item.allowSellByPackUnit ? 1 : 0,
        item.expiryDate || null, item.qualityGrade, item.taxType || null, item.taxTreatment || null, item.notes, item.isCredit ? 1 : 0, item.supplierPhone,
        item.supplierId || null, item.reorderPoint ?? 10, item.reorderQty ?? 0, item.autoReorder ? 1 : 0,
        item.image || null, item.wholesaleSellingPrice ?? null, item.minWholesaleQty ?? null,
        item.transportCost ?? 0, item.importCost ?? 0, item.packagingCost ?? 0, item.handlingCost ?? 0, item.otherCost ?? 0, item.targetMargin ?? null,
        item.supplierAccount || null, item.supplierCallEnabled ? 1 : 0, item.warehouseId ?? null, item.isActive ?? 1, item.quickProduct ? 1 : 0,
        id, bizId
      );

      return result;
    })();

    return result;
  });

  ipcMain.handle('delete-item', (_, id: number) => {
    requirePermission('inventory.delete');
    const item = db.prepare('SELECT name FROM items WHERE id = ?').get(id) as any;
    db.prepare('UPDATE items SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(currentUserName || 'unknown', id);
    return { success: true };
  });

  ipcMain.handle('generate-shega-code', () => {
    requirePermission('inventory.add');
    const bizId = getActiveBusinessId();
    // Ensure sequence setting exists
    const seqRow = db.prepare(`SELECT value FROM app_settings WHERE key = 'shega_barcode_seq'`).get() as any;
    let seq = seqRow ? parseInt(seqRow.value, 10) || 0 : 0;
    for (let i = 0; i < 100; i++) {
      seq += 1;
      const code = 'SHG-' + String(seq).padStart(6, '0');
      const clash = db.prepare(
        `SELECT COUNT(*) as n FROM items WHERE (barcode = ? OR sku = ?) AND is_deleted = 0 AND businessId = ?`
      ).get(code, code, bizId) as any;
      if (!clash || clash.n === 0) {
        db.prepare(`INSERT OR REPLACE INTO app_settings (key, value) VALUES ('shega_barcode_seq', ?)`).run(String(seq));
        return code;
      }
    }
    return 'SHG-' + String(Date.now()).slice(-6);
  });

  ipcMain.handle('item-barcodes:list', (_, itemId: number) => {
    return db.prepare(
      `SELECT * FROM item_barcodes WHERE itemId = ? AND is_deleted = 0 ORDER BY isPrimary DESC, id ASC`
    ).all(itemId);
  });

  ipcMain.handle('item-barcodes:add', (_, itemId: number, barcode: string) => {
    requirePermission('inventory.edit');
    if (!barcode || !barcode.trim()) throw new Error('Barcode is required');
    const existing = db.prepare(
      `SELECT id FROM item_barcodes WHERE itemId = ? AND barcode = ? AND is_deleted = 0`
    ).get(itemId, barcode.trim());
    if (existing) throw new Error('Barcode already exists for this item');
    const hasAny = db.prepare(
      `SELECT COUNT(*) as n FROM item_barcodes WHERE itemId = ? AND is_deleted = 0`
    ).get(itemId) as any;
    const isPrimary = hasAny.n === 0 ? 1 : 0;
    const result = db.prepare(
      `INSERT INTO item_barcodes (itemId, barcode, isPrimary) VALUES (?, ?, ?)`
    ).run(itemId, barcode.trim(), isPrimary);
    return result.lastInsertRowid;
  });

  ipcMain.handle('item-barcodes:remove', (_, barcodeId: number) => {
    requirePermission('inventory.edit');
    const row = db.prepare(`SELECT itemId, isPrimary FROM item_barcodes WHERE id = ? AND is_deleted = 0`).get(barcodeId) as any;
    if (!row) return;
    db.prepare(`UPDATE item_barcodes SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?`).run(barcodeId);
    if (row.isPrimary) {
      const next = db.prepare(
        `SELECT id FROM item_barcodes WHERE itemId = ? AND is_deleted = 0 ORDER BY id ASC LIMIT 1`
      ).get(row.itemId) as any;
      if (next) db.prepare(`UPDATE item_barcodes SET isPrimary = 1 WHERE id = ?`).run(next.id);
    }
  });

  ipcMain.handle('item-barcodes:set-primary', (_, barcodeId: number) => {
    requirePermission('inventory.edit');
    const row = db.prepare(`SELECT itemId FROM item_barcodes WHERE id = ? AND is_deleted = 0`).get(barcodeId) as any;
    if (!row) return;
    db.prepare(`UPDATE item_barcodes SET isPrimary = 0 WHERE itemId = ? AND is_deleted = 0`).run(row.itemId);
    db.prepare(`UPDATE item_barcodes SET isPrimary = 1 WHERE id = ?`).run(barcodeId);
  });

  ipcMain.handle('get-low-stock-items', () => {
    requirePermission('inventory.view');
    const bizId = getActiveBusinessId();
    return db.prepare('SELECT items.*, suppliers.supplierName, suppliers.id as linkedSupplierId FROM items LEFT JOIN suppliers ON items.supplierId = suppliers.id WHERE items.totalBaseQuantity < COALESCE(items.reorderPoint, 10) AND items.businessId = ? ORDER BY items.totalBaseQuantity ASC LIMIT ?').all(bizId, DEFAULT_LIST_LIMIT);
  });

  // 4.8: automated reorder suggestions using per-item reorder point + reorder qty.
  ipcMain.handle('get-reorder-suggestions', () => {
    requirePermission('inventory.view');
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT items.*, suppliers.supplierName, suppliers.id as linkedSupplierId,
             COALESCE(items.reorderPoint, 10) as reorderPoint,
             MAX(COALESCE(items.reorderQty, 0), COALESCE(items.reorderPoint, 10) - items.totalBaseQuantity) as suggestedQty
      FROM items
      LEFT JOIN suppliers ON items.supplierId = suppliers.id
      WHERE items.businessId = ?
        AND items.is_deleted = 0
        AND items.totalBaseQuantity < COALESCE(items.reorderPoint, 10)
      ORDER BY (items.totalBaseQuantity - COALESCE(items.reorderPoint, 10)) ASC
      LIMIT ?
    `).all(bizId, DEFAULT_LIST_LIMIT);
  });

  ipcMain.handle('get-expiring-items', () => {
    requirePermission('inventory.view');
    const bizId = getActiveBusinessId();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return db.prepare('SELECT items.*, suppliers.supplierName, suppliers.id as linkedSupplierId FROM items LEFT JOIN suppliers ON items.supplierId = suppliers.id WHERE items.expiryDate IS NOT NULL AND items.expiryDate <= ? AND items.businessId = ? ORDER BY items.expiryDate ASC LIMIT ?').all(thirtyDaysFromNow.toISOString().split('T')[0], bizId, DEFAULT_LIST_LIMIT);
  });

  ipcMain.handle('get-items-by-supplier', (_, supplierId: number) => {
    requirePermission('inventory.view');
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

  ipcMain.handle('restock-item', (_, id: number, quantity: number, unit?: 'single' | 'pack') => {
    requirePermission('inventory.adjust');
    const bizId = getActiveBusinessId();
    const item = db.prepare('SELECT name, unitsPerPack FROM items WHERE id = ? AND businessId = ?').get(id, bizId) as any;
    if (!item) throw new Error('Item not found');
    const qty = validatePositive(quantity, 'Restock quantity');
    const unitsPerPack = item.unitsPerPack || 1;
    // 'pack' means quantity is in packs — convert to individual units; 'single' (default) is already in units.
    const baseQty = unit === 'pack' ? Math.round(qty * unitsPerPack * 1e6) / 1e6 : qty;
    const packQty = Math.round((baseQty / unitsPerPack) * 1e6) / 1e6;
    const result = db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, totalPackQuantity = totalPackQuantity + ? WHERE id = ?').run(baseQty, packQty, id);
    const defWhId = getDefaultWarehouseId();
    const whRow = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, id) as any;
    if (whRow) {
      db.prepare('UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(baseQty, whRow.id);
    } else {
      db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(defWhId, id, baseQty);
    }
    const unitLabel = unit === 'pack' ? `pack(s) of ${unitsPerPack}` : 'unit(s)';
    db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)').run(defWhId, id, 'restock_in', baseQty, 'restock', `Restocked ${qty} ${unitLabel} of ${item.name}`);
    return { success: true };
  });

  // ========== SALES ==========
  ipcMain.handle('get-sales', (_, options: any = {}) => {
    requirePermission('sales.view');
    const bizId = getActiveBusinessId();
    let query = 'SELECT sales.*, items.name as itemName, items.basePurchasePrice, items.unitsPerPack, items.image as itemImage, categories.name as categoryName FROM sales LEFT JOIN items ON sales.itemId = items.id LEFT JOIN categories ON items.categoryId = categories.id';
    const params: any[] = [];
    const conditions: string[] = ['sales.businessId = ?'];
    params.push(bizId);

    if (options.search) {
      conditions.push('(LOWER(items.name) LIKE LOWER(?) OR LOWER(sales.customerName) LIKE LOWER(?))');
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    if (options.paymentStatus) {
      conditions.push('sales.paymentStatus = ?');
      params.push(options.paymentStatus);
    }

    if (options.createdBy) {
      conditions.push('sales.createdBy = ?');
      params.push(options.createdBy);
    }

    if (options.cashier) {
      conditions.push('sales.createdBy = ?');
      params.push(options.cashier);
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
    const offset = options.offset ?? 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(listLimit, offset);

    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-sale', (_, id: number) => {
    requirePermission('sales.view');
    return db.prepare('SELECT sales.*, items.name as itemName, items.image as itemImage FROM sales LEFT JOIN items ON sales.itemId = items.id WHERE sales.id = ?').get(id);
  });

  ipcMain.handle('insert-sales-batch', async (event, sales: any[]) => {
    requirePermission('sales.create');
    // §1.7 — capture an optional override reason the renderer attached to lines
    // that exceed the actor's discount cap before zod strips unknown keys.
    const overrideReason = (sales || []).map((s) => s?.overrideReason).find((r) => !!r) as string | undefined;
    const gate = await gateDiscountOverrides(event.sender, sales || []);
    if (gate.requiresOverride && !gate.approved) {
      throw new Error('Manager approval required — discount over your limit was not approved');
    }
    sales = validate(saleBatchSchema, sales, 'sales batch');
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
            paymentMethod, paymentStatus, customerName, customerPhone, packId, dueDate, paidAmount,
            createdBy, overrideBy, overrideReason
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
          bizId, sale.itemId, sale.quantity, sale.unit, sale.unitType, sale.discount || 0, sale.vat || 0, sale.totalPrice,
          sale.paymentMethod, sale.paymentStatus, sale.customerName, sale.customerPhone, sale.packId || null, 
          sale.dueDate || null, sale.paidAmount || 0,
          currentUserName || null,
          gate.requiresOverride && gate.approved ? currentUserName || 'unknown' : null,
          gate.requiresOverride && gate.approved ? (gate.overrideReason || overrideReason) : null
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
          packDeduction = Math.round((sale.quantity / (item.unitsPerPack || 1)) * 1e6) / 1e6;
        }

        db.prepare('UPDATE sales SET costAtTimeOfSale = ? WHERE id = ?').run((item.basePurchasePrice || 0) * baseDeduction, result.lastInsertRowid);

        const itemResult = db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity - ?, totalPackQuantity = totalPackQuantity - ? WHERE id = ? AND totalBaseQuantity >= ?').run(baseDeduction, packDeduction, sale.itemId, baseDeduction);
        if (itemResult.changes === 0) throw new Error(`Insufficient stock: ${item.name} has less than ${baseDeduction} units available`);

        // Sync default warehouse inventory
        const defWhId = getDefaultWarehouseId();
        const whResult = db.prepare('UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE warehouseId = ? AND itemId = ? AND quantity >= ?').run(baseDeduction, defWhId, sale.itemId, baseDeduction);
        if (whResult.changes === 0) {
          const whExists = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, sale.itemId);
          if (!whExists) {
            db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(defWhId, sale.itemId, -baseDeduction);
          } else {
            throw new Error(`Insufficient stock at warehouse: ${item.name} has less than ${baseDeduction} units available`);
          }
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
    requirePermission('sales.create');
    sale = validate(saleSchema, sale, 'sale');
    const bizId = getActiveBusinessId();
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(sale.itemId) as any;
    if (!item) throw new Error(`Item ${sale.itemId} not found`);
    const qty = validatePositive(sale.quantity, 'Sale quantity');
    sale.quantity = qty;

    const transaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO sales (
          businessId, itemId, quantity, unit, unitType, discount, vat, totalPrice, 
          paymentMethod, paymentStatus, customerName, customerPhone, packId, dueDate, paidAmount, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        bizId, sale.itemId, sale.quantity, sale.unit, sale.unitType, sale.discount || 0, sale.vat || 0, sale.totalPrice,
        sale.paymentMethod, sale.paymentStatus, sale.customerName, sale.customerPhone, sale.packId || null, 
        sale.dueDate || null, sale.paidAmount || 0, currentUserName || null
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
        packDeduction = Math.round((sale.quantity / (item.unitsPerPack || 1)) * 1e6) / 1e6;
      }

      const costAtTimeOfSale = (item.basePurchasePrice || 0) * baseDeduction;

      // Update the costAtTimeOfSale on the inserted record
      db.prepare('UPDATE sales SET costAtTimeOfSale = ? WHERE id = ?').run(costAtTimeOfSale, result.lastInsertRowid);

      // Fiscal/ETRS-ready hook (Phase 2: 2.8)
      const fiscalMode = db.prepare("SELECT value FROM settings WHERE key = 'fiscal_mode'").get() as any;
      if (fiscalMode && fiscalMode.value === 'true' && fiscalAdapter.isAvailable()) {
        const sig = fiscalAdapter.signReceipt({ serial: result.lastInsertRowid, total: sale.totalPrice, date: new Date().toISOString() });
        db.prepare('UPDATE sales SET fiscal_number = ?, fiscal_signature = ? WHERE id = ?').run(sig.fiscalNumber, sig.signature, result.lastInsertRowid);
      }

      const itemResult = db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity - ?, totalPackQuantity = totalPackQuantity - ? WHERE id = ? AND totalBaseQuantity >= ?').run(baseDeduction, packDeduction, sale.itemId, baseDeduction);
      if (itemResult.changes === 0) throw new Error(`Insufficient stock: ${item.name} has less than ${baseDeduction} units available`);

      // Sync default warehouse inventory
      const defWhId = getDefaultWarehouseId();
      const whResult = db.prepare('UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE warehouseId = ? AND itemId = ? AND quantity >= ?').run(baseDeduction, defWhId, sale.itemId, baseDeduction);
      if (whResult.changes === 0) {
        const whExists = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, sale.itemId);
        if (!whExists) {
          db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(defWhId, sale.itemId, -baseDeduction);
        } else {
          throw new Error(`Insufficient stock at warehouse: ${item.name} has less than ${baseDeduction} units available`);
        }
      }
      db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)')
        .run(defWhId, sale.itemId, 'sale_out', baseDeduction, 'sale', `Sale #${result.lastInsertRowid}`);

      const saleId = result.lastInsertRowid;
      return saleId;
    });

    return transaction();
  });

  ipcMain.handle('update-sale', (_, id: number, sale: any) => {
    requirePermission('sales.edit');
    sale = validate(saleUpdateSchema, sale, 'sale update');
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
          packDiff = Math.round((Math.abs(qtyDiff) / (item.unitsPerPack || 1)) * 1e6) / 1e6;
        }

        if (qtyDiff > 0) {
          // Increasing quantity — deduct additional stock
          const itemResult = db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity - ?, totalPackQuantity = totalPackQuantity - ? WHERE id = ? AND totalBaseQuantity >= ?').run(baseDiff, packDiff, sale.itemId || original.itemId, baseDiff);
          if (itemResult.changes === 0) throw new Error(`Insufficient stock: ${item.name} has less than ${baseDiff} units available`);
          const defWhId = getDefaultWarehouseId();
          const whExists = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, sale.itemId || original.itemId) as any;
          if (whExists) {
            const whResult = db.prepare('UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND quantity >= ?').run(baseDiff, whExists.id, baseDiff);
            if (whResult.changes === 0) throw new Error(`Insufficient stock at warehouse: ${item.name} has less than ${baseDiff} units available`);
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

      const newQty = sale.quantity || original.quantity;
      const newUnitType = sale.unitType || original.unitType;
      const baseDeduction = newUnitType === 'pack' ? newQty * (item.unitsPerPack || 1) : newQty;
      const costAtTimeOfSale = (item.basePurchasePrice || 0) * baseDeduction;

      db.prepare(`
        UPDATE sales SET
          quantity = ?, unit = ?, unitType = ?, discount = ?, vat = ?, totalPrice = ?,
          paymentMethod = ?, paymentStatus = ?, customerName = ?, customerPhone = ?,
          dueDate = ?, paidAmount = ?, costAtTimeOfSale = ?
        WHERE id = ? AND businessId = ?
      `).run(
        sale.quantity, sale.unit, sale.unitType, sale.discount, sale.vat, sale.totalPrice,
        sale.paymentMethod, sale.paymentStatus, sale.customerName, sale.customerPhone,
        sale.dueDate, sale.paidAmount, costAtTimeOfSale, id, bizId
      );
    });

    transaction();
    return { success: true };
  });

  ipcMain.handle('delete-sale', (_, id: number) => {
    requirePermission('sales.cancel');
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
          packRestore = Math.round((sale.quantity / (item.unitsPerPack || 1)) * 1e6) / 1e6;
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
    return { success: true };
  });

  ipcMain.handle('create-return', async (event, data: any) => {
    requirePermission('sales.returns');
    const reason = (data?.reason || '').trim();
    if (!reason) return { success: false, error: 'A reason is required to process a return' };
    if (!(await gateSensitiveAction(event.sender, { context: `Process return for sale #${data?.saleId ?? ''}` }))) {
      return { success: false, error: 'Manager approval required — action not executed' };
    }
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
        packRestore = Math.round((returnQty / (item.unitsPerPack || 1)) * 1e6) / 1e6;
      }

      db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity + ?, totalPackQuantity = totalPackQuantity + ? WHERE id = ?')
        .run(baseRestore, packRestore, sale.itemId);

      const originalMovement = db.prepare("SELECT warehouseId, quantity FROM stock_movements WHERE referenceType = 'sale' AND referenceId = ? AND type = 'sale_out' ORDER BY createdAt DESC LIMIT 1").get(data.saleId) as any;
      const warehouseId = originalMovement?.warehouseId || getDefaultWarehouseId();
      const whRow = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(warehouseId, sale.itemId) as any;
      if (whRow) {
        db.prepare('UPDATE warehouse_inventory SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(baseRestore, whRow.id);
      } else {
        db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(warehouseId, sale.itemId, baseRestore);
      }

      db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)')
        .run(warehouseId, sale.itemId, 'return_in', baseRestore, 'return', `Return for sale #${sale.id}`);

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

      return { success: true, returnId: result.lastInsertRowid };
    });

    return transaction();
  });

  ipcMain.handle('get-returns', (_e, options?: any) => {
    requirePermission('sales.view');
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

    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options?.offset ?? 0;
    query += ' ORDER BY r.createdAt DESC LIMIT ? OFFSET ?';
    params.push(listLimit, offset);
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-debt-sales', () => {
    requirePermission('sales.view');
    const bizId = getActiveBusinessId();
    return db.prepare('SELECT sales.*, items.name as itemName FROM sales LEFT JOIN items ON sales.itemId = items.id WHERE sales.paymentStatus = ? AND sales.businessId = ? ORDER BY sales.dueDate ASC LIMIT ?').all('Debt', bizId, DEFAULT_LIST_LIMIT);
  });

  ipcMain.handle('pay-debt', (_, saleId: number, amount: number, options?: { type?: string; note?: string }) => {
    requirePermission('payments.pay');
    const { saleId: vSaleId, amount: vAmount, type, note } = validate(payDebtSchema, { saleId, amount, ...options }, 'debt payment');
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(vSaleId) as any;
    if (!sale) throw new Error('Sale not found');
    
    const recordType = type || 'payment';
    const newPaid = (sale.paidAmount || 0) + vAmount;
    const newStatus = newPaid >= sale.totalPrice ? 'Paid' : 'Debt';
    
    const result = db.prepare('UPDATE sales SET paidAmount = ?, paymentStatus = ? WHERE id = ?').run(newPaid, newStatus, vSaleId);
    
    db.prepare('INSERT INTO debt_payments (saleId, customerName, customerPhone, amount, type, note) VALUES (?, ?, ?, ?, ?, ?)')
      .run(vSaleId, sale.customerName || null, sale.customerPhone || null, vAmount, recordType, note || null);
    
    const activityType = recordType === 'loss' ? 'Marked as loss' : 'Payment received';
    return result;
  });

  ipcMain.handle('get-debt-payments', (_, saleId: number) => {
    return db.prepare('SELECT * FROM debt_payments WHERE saleId = ? ORDER BY createdAt DESC').all(saleId);
  });

  // ========== EXPENSES ==========
  ipcMain.handle('get-expenses', (_, options: any = {}) => {
    requirePermission('expenses.view');
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
    const offset = options.offset ?? 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(listLimit, offset);

    return db.prepare(query).all(...params);
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
            const { Notification: ElectronNotification, nativeImage } = require('electron');
            if (ElectronNotification.isSupported()) {
              const icon = nativeImage.createFromPath(path.join(app.getAppPath(), 'src/assets/images/logo.ico'));
              new ElectronNotification({ title: n.title, body: n.message, icon, urgency: n.type === 'error' ? 'critical' : 'normal' }).show();
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
      query += ' AND (LOWER(title) LIKE LOWER(?) OR LOWER(message) LIKE LOWER(?))';
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
    requirePermission('settings.manage');
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
    requirePermission('notifications.manage');
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
    requirePermission('settings.manage');
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
    q += ' ORDER BY triggerDate ASC LIMIT ? OFFSET ?';
    params.push(options.limit ?? DEFAULT_LIST_LIMIT, options.offset ?? 0);
    return db.prepare(q).all(...params);
  });

  ipcMain.handle('create-reminder', (_, data: any) => {
    requirePermission('settings.manage');
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
    requirePermission('settings.manage');
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
          const { Notification: ElectronNotification, nativeImage } = require('electron');
          if (ElectronNotification.isSupported()) {
            const icon = nativeImage.createFromPath(path.join(app.getAppPath(), 'src/assets/images/logo.ico'));
            new ElectronNotification({ title: r.title, body: r.message || '', icon }).show();
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
      const { Notification: ElectronNotification, nativeImage } = require('electron');
      if (!ElectronNotification.isSupported()) return { shown: false, reason: 'unsupported' };
      const icon = nativeImage.createFromPath(path.join(app.getAppPath(), 'src/assets/images/logo.ico'));
      const n = new ElectronNotification({
        title: data.title,
        body: data.body,
        icon,
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

  // ========== DEMO MODE (6.6) ==========
  ipcMain.handle('demo:get-mode', () => {
    return { isDemoMode: getDemoMode() };
  });

  ipcMain.handle('demo:set-mode', (_, enabled: boolean) => {
    setDemoMode(enabled);
    return { success: true, isDemoMode: getDemoMode() };
  });

  ipcMain.handle('demo:reset', () => {
    resetDemoDb();
    return { success: true };
  });

  ipcMain.handle('demo:seed', () => {
    const ddb = getCurrentDb();
    const bizId = 1; // Demo business
    
    // Add demo categories
    const categories = ['Beverages', 'Snacks', 'Dairy', 'Bakery', 'Produce', 'Household'];
    for (const cat of categories) {
      ddb.prepare('INSERT OR IGNORE INTO categories (businessId, name, isCustom) VALUES (?, ?, 1)').run(bizId, cat);
    }
    
    // Add demo items
    const items = [
      { name: 'Coca Cola 500ml', category: 'Beverages', price: 45, cost: 30, qty: 100 },
      { name: 'Pepsi 500ml', category: 'Beverages', price: 45, cost: 30, qty: 80 },
      { name: 'Water 1L', category: 'Beverages', price: 15, cost: 8, qty: 200 },
      { name: 'Potato Chips', category: 'Snacks', price: 35, cost: 22, qty: 150 },
      { name: 'Chocolate Bar', category: 'Snacks', price: 25, cost: 15, qty: 200 },
      { name: 'Milk 1L', category: 'Dairy', price: 55, cost: 40, qty: 50 },
      { name: 'Yogurt', category: 'Dairy', price: 18, cost: 12, qty: 100 },
      { name: 'Bread Loaf', category: 'Bakery', price: 30, cost: 18, qty: 80 },
      { name: 'Apples 1kg', category: 'Produce', price: 80, cost: 50, qty: 60 },
      { name: 'Bananas 1kg', category: 'Produce', price: 60, cost: 35, qty: 90 },
      { name: 'Dish Soap', category: 'Household', price: 120, cost: 80, qty: 40 },
      { name: 'Toilet Paper 4pk', category: 'Household', price: 95, cost: 65, qty: 30 },
    ];
    
    for (const item of items) {
      const catRow = ddb.prepare('SELECT id FROM categories WHERE businessId = ? AND name = ?').get(bizId, item.category) as any;
      if (catRow) {
        ddb.prepare(`
          INSERT OR IGNORE INTO items (businessId, name, categoryId, baseSalePrice, basePurchasePrice, totalBaseQuantity, unitsPerPack, isCustom)
          VALUES (?, ?, ?, ?, ?, ?, 1, 1)
        `).run(bizId, item.name, catRow.id, item.price, item.cost, item.qty);
      }
    }
    
    // Add demo customers
    const customers = [
      { name: 'Walk-in Customer', phone: '', email: '' },
      { name: 'Abebe Kebede', phone: '+251911223344', email: 'abebe@email.com' },
      { name: 'Meron Tesfaye', phone: '+251922334455', email: 'meron@email.com' },
      { name: 'Office Supply Co.', phone: '+251115556677', email: 'orders@office.com' },
    ];
    
    for (const cust of customers) {
      ddb.prepare(`
        INSERT OR IGNORE INTO customers (businessId, name, phone, email, isCustom)
        VALUES (?, ?, ?, ?, 1)
      `).run(bizId, cust.name, cust.phone, cust.email);
    }
    
    // Add demo sales
    const today = new Date().toISOString().split('T')[0];
    const itemsForSale = ddb.prepare('SELECT id, baseSalePrice FROM items WHERE businessId = ?').all(bizId) as any[];
    const demoCustomers = ddb.prepare('SELECT id FROM customers WHERE businessId = ?').all(bizId) as any[];
    
    for (let i = 0; i < 10; i++) {
      const item = itemsForSale[Math.floor(Math.random() * itemsForSale.length)];
      const customer = demoCustomers[Math.floor(Math.random() * demoCustomers.length)];
      const qty = Math.floor(Math.random() * 5) + 1;
      const total = item.baseSalePrice * qty;
      
      ddb.prepare(`
        INSERT INTO sales (businessId, customerId, customerName, totalPrice, paymentMethod, paymentStatus, status, createdAt)
        VALUES (?, ?, ?, ?, 'Cash', 'Completed', 'Active', ?)
      `).run(bizId, customer?.id || null, customer?.name || 'Walk-in Customer', total, today);
    }
    
    return { success: true, message: 'Demo data seeded successfully' };
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
      SELECT 'sale' as type, 'sale-' || s.id as id, s.totalPrice as amount, s.createdAt as date, i.name as description, s.customerName as extra, i.image as itemImage,
        COALESCE(e.firstName || ' ' || e.lastName, u.name) as userName,
        COALESCE(e.avatar, u.avatar) as userAvatar
      FROM sales s LEFT JOIN items i ON s.itemId = i.id
      LEFT JOIN employees e ON s.createdBy = e.id
      LEFT JOIN users u ON s.createdBy = u.id
      ${dateFilter}
      ORDER BY s.createdAt DESC LIMIT ?
    `).all(...params, limit);

    const expenses = db.prepare(`
      SELECT 'expense' as type, 'expense-' || id as id, amount, date, name as description, category as extra
      FROM expenses ${expDateFilter} ORDER BY date DESC LIMIT ?
    `).all(...expParams, limit);

    const adjFilter = dateFilter.replace(/s\.createdAt/g, 'a.createdAt').replace(/s\.businessId/g, 'a.businessId');

    const adjustments = db.prepare(`
      SELECT 'adjustment' as type, 'adj-' || a.id as id, a.newValue as amount, a.createdAt as date, i.name as description, a.type as extra, i.image as itemImage,
        COALESCE(e.avatar, u.avatar) as userAvatar, COALESCE(e.firstName || ' ' || e.lastName, u.name) as userName
      FROM adjustments a LEFT JOIN items i ON a.itemId = i.id
      LEFT JOIN employees e ON a.user_id = e.id
      LEFT JOIN users u ON a.user_id = u.id
      ${adjFilter}
      ORDER BY a.createdAt DESC LIMIT ?
    `).all(...params, limit);

    const attendance = db.prepare(`
      SELECT CASE WHEN a.clockOut IS NOT NULL THEN 'clock_out' ELSE 'clock_in' END as type,
             'att-' || a.id as id, 0 as amount,
             CASE WHEN a.clockOut IS NOT NULL THEN a.clockOut ELSE a.clockIn END as date,
             e.firstName || ' ' || e.lastName as userName,
             a.status as description
      FROM attendance a LEFT JOIN employees e ON a.employeeId = e.id
      WHERE e.businessId = ?
      ORDER BY date DESC LIMIT ?
    `).all(bizId, limit);

    const all = [...sales, ...expenses, ...adjustments, ...attendance] as any[];
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

  // 4.5 VAT/TOT report for ERCA filing.
  ipcMain.handle('get-vat-report', (_, dateRange?: { start: string; end: string }) => {
    requirePermission('reports.view');
    const bizId = getActiveBusinessId();
    let startDate: string;
    let endDate: string;
    const now = new Date();
    if (dateRange?.start && dateRange?.end) {
      startDate = dateRange.start;
      endDate = dateRange.end;
    } else {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = d.toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    }

    const rows = db.prepare(`
      SELECT id, quantity, unit, unitType, discount, vat, totalPrice, paymentMethod, paymentStatus, status, customerName, customerPhone, createdAt,
             COALESCE(i.baseSellingPrice, 0) AS unitSellingPrice,
             COALESCE(i.basePurchasePrice, 0) AS unitCost
      FROM sales s LEFT JOIN items i ON s.itemId = i.id
      WHERE s.businessId = ? AND DATE(s.createdAt) >= ? AND DATE(s.createdAt) <= ? AND (s.is_deleted = 0 OR s.is_deleted IS NULL)
      ORDER BY s.createdAt ASC
    `).all(bizId, startDate, endDate) as any[];

    const rateTotals: Record<string, { count: number; taxable: number; vat: number; sales: number }> = {};
    let totalTaxable = 0, totalVAT = 0, totalSales = 0, totalCount = 0, totalDiscount = 0;
    for (const r of rows) {
      // taxType is not stored on desktop sales rows; VAT is recorded per sale as the
      // vat column. Infer the rate from the vat vs taxable amount when present.
      const taxable = Math.max(0, (r.totalPrice || 0) - (r.discount || 0) - (r.vat || 0));
      const vatAmt = r.vat || 0;
      let rate = '0';
      if (vatAmt > 0 && taxable > 0) {
        const pct = Math.round((vatAmt / taxable) * 100);
        rate = String(pct);
      } else if (vatAmt > 0) {
        rate = '15';
      }
      const bucket = rateTotals[rate] || { count: 0, taxable: 0, vat: 0, sales: 0 };
      bucket.count += 1;
      bucket.taxable += taxable;
      bucket.vat += vatAmt;
      bucket.sales += r.totalPrice || 0;
      rateTotals[rate] = bucket;
      totalTaxable += taxable;
      totalVAT += vatAmt;
      totalSales += r.totalPrice || 0;
      totalCount += 1;
      totalDiscount += r.discount || 0;
    }

    const buckets = Object.entries(rateTotals)
      .map(([rate, v]) => ({ rate: rate === '0' ? '0%' : `${rate}%`, ...v }))
      .sort((a: any, b: any) => (a.rate === '0%' ? 1 : b.rate === '0%' ? -1 : Number(b.rate) - Number(a.rate)));

    return {
      startDate, endDate,
      buckets,
      summary: { totalCount, totalTaxable, totalVAT, totalSales, totalDiscount },
      transactions: rows
    };
  });

  // 4.1 Advanced report drill-downs.
  ipcMain.handle('get-report-drilldowns', (_, dateRange?: { start: string; end: string }) => {
    requirePermission('reports.view');
    const bizId = getActiveBusinessId();
    let startDate: string;
    let endDate: string;
    const now = new Date();
    if (dateRange?.start && dateRange?.end) {
      startDate = dateRange.start;
      endDate = dateRange.end;
    } else {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = d.toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    }
    const salesWhere = 's.businessId = ? AND DATE(s.createdAt) >= ? AND DATE(s.createdAt) <= ? AND (s.is_deleted = 0 OR s.is_deleted IS NULL)';
    const salesParams = [bizId, startDate, endDate];

    // Sales by cashier (createdBy -> employee name string).
    const byCashier = db.prepare(`
      SELECT COALESCE(s.createdBy, 'Unknown') AS cashier, COUNT(*) AS saleCount,
             COALESCE(SUM(s.totalPrice), 0) AS revenue, COALESCE(SUM(s.vat), 0) AS vat,
             COALESCE(SUM(s.totalPrice - COALESCE(s.costAtTimeOfSale, 0)), 0) AS profit
      FROM sales s
      WHERE ${salesWhere}
      GROUP BY COALESCE(s.createdBy, 'Unknown')
      ORDER BY revenue DESC
    `).all(...salesParams);

    // Sales by hour of day.
    const byHour = db.prepare(`
      SELECT CAST(strftime('%H', s.createdAt) AS INTEGER) AS hour, COUNT(*) AS saleCount,
             COALESCE(SUM(s.totalPrice), 0) AS revenue
      FROM sales s
      WHERE ${salesWhere}
      GROUP BY CAST(strftime('%H', s.createdAt) AS INTEGER)
      ORDER BY hour ASC
    `).all(...salesParams);

    // Margin by item (uses per-sale costAtTimeOfSale for accurate COGS).
    const marginByItem = db.prepare(`
      SELECT i.id, i.name, COALESCE(c.name, 'Uncategorized') AS categoryName,
             SUM(s.quantity) AS units,
             COALESCE(SUM(s.totalPrice), 0) AS revenue,
             COALESCE(SUM(s.costAtTimeOfSale), 0) AS cogs,
             COALESCE(SUM(s.totalPrice - COALESCE(s.costAtTimeOfSale, 0)), 0) AS profit
      FROM sales s
      LEFT JOIN items i ON s.itemId = i.id
      LEFT JOIN categories c ON i.categoryId = c.id
      WHERE ${salesWhere}
      GROUP BY i.id
      ORDER BY profit DESC
    `).all(...salesParams);

    // Debt aging buckets (customer debt).
    const today = new Date().toISOString().split('T')[0];
    const debtAging = db.prepare(`
      SELECT s.customerName, s.customerPhone,
             COALESCE(SUM(s.totalPrice - COALESCE(s.paidAmount, 0)), 0) AS outstanding,
             CAST(julianday(?) - julianday(COALESCE(s.dueDate, s.createdAt)) AS INTEGER) AS daysOverdue
      FROM sales s
      WHERE s.paymentStatus = 'Debt' AND s.businessId = ?
        AND (s.is_deleted = 0 OR s.is_deleted IS NULL)
      GROUP BY s.customerName, s.customerPhone
      HAVING outstanding > 0
      ORDER BY daysOverdue DESC
    `).all(today, bizId);

    // Slow/fast movers.
    const movers = db.prepare(`
      SELECT i.id, i.name,
             COALESCE(SUM(s.quantity), 0) AS unitsSold,
             COALESCE(SUM(s.totalPrice), 0) AS revenue,
             COUNT(s.id) AS saleCount,
             CAST(julianday(?) - julianday(MAX(s.createdAt)) AS INTEGER) AS daysSinceLastSale
      FROM items i
      LEFT JOIN sales s ON s.itemId = i.id AND s.businessId = ? AND DATE(s.createdAt) >= ? AND DATE(s.createdAt) <= ? AND (s.is_deleted = 0 OR s.is_deleted IS NULL)
      WHERE i.businessId = ? AND i.is_deleted = 0
      GROUP BY i.id
      ORDER BY unitsSold DESC
    `).all(today, bizId, startDate, endDate, bizId);

    // Stock valuation by warehouse.
    const valuationByWarehouse = db.prepare(`
      SELECT w.name AS warehouse,
             COALESCE(SUM(wi.quantity * i.basePurchasePrice), 0) AS value,
             COALESCE(SUM(wi.quantity), 0) AS units,
             COUNT(DISTINCT wi.itemId) AS productCount
      FROM warehouses w
      LEFT JOIN warehouse_inventory wi ON wi.warehouseId = w.id
      LEFT JOIN items i ON wi.itemId = i.id AND i.businessId = ? AND i.is_deleted = 0
      WHERE w.businessId = ?
      GROUP BY w.id
      ORDER BY value DESC
    `).all(bizId, bizId);

    return {
      startDate, endDate,
      byCashier, byHour, marginByItem,
      debtAging: debtAging as any[],
      movers: movers as any[],
      valuationByWarehouse
    };
  });

  // 4.13: GL journal export — generates double-entry journal lines from sales, expenses, and debt payments.
  ipcMain.handle('get-gl-journal', (_, dateRange?: { start: string; end: string }) => {
    requirePermission('reports.view');
    const bizId = getActiveBusinessId();
    const now = new Date();
    const startDate = dateRange?.start || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = dateRange?.end || now.toISOString().split('T')[0];
    const range = { startDate, endDate };
    const lines: any[] = [];

    const sales = db.prepare(`
      SELECT s.id, s.totalPrice, s.vat, s.discount, s.paymentMethod, s.paymentStatus, s.customerName, s.createdAt, i.name AS itemName
      FROM sales s LEFT JOIN items i ON s.itemId = i.id
      WHERE s.businessId = ? AND DATE(s.createdAt) >= ? AND DATE(s.createdAt) <= ? AND (s.is_deleted = 0 OR s.is_deleted IS NULL)
      ORDER BY s.createdAt ASC
    `).all(bizId, startDate, endDate);
    for (const s of sales) {
      const gross = s.totalPrice || 0;
      const taxable = gross - (s.vat || 0);
      const ref = `SALE-${s.id}`;
      if (s.paymentStatus === 'Debt') {
        lines.push({ date: s.createdAt, account: 'Accounts Receivable', debit: gross, credit: 0, ref, memo: `Credit sale to ${s.customerName || 'customer'} (${s.itemName || ''})` });
      } else {
        const cashAcc = (s.paymentMethod || 'Cash') === 'Cash' ? 'Cash' : 'Bank';
        lines.push({ date: s.createdAt, account: cashAcc, debit: gross, credit: 0, ref, memo: `Sale of ${s.itemName || 'item'}` });
      }
      if ((s.vat || 0) > 0) {
        lines.push({ date: s.createdAt, account: 'VAT Payable', debit: 0, credit: s.vat, ref, memo: `Output VAT on SALE-${s.id}` });
      }
      lines.push({ date: s.createdAt, account: 'Sales Revenue', debit: 0, credit: taxable, ref, memo: `Revenue SALE-${s.id}` });
    }

    const expenses = db.prepare(`
      SELECT e.id, e.name, e.amount, e.category, e.date
      FROM expenses e
      WHERE e.businessId = ? AND DATE(e.date) >= ? AND DATE(e.date) <= ? AND (e.is_deleted = 0 OR e.is_deleted IS NULL)
      ORDER BY e.date ASC
    `).all(bizId, startDate, endDate);
    for (const e of expenses) {
      const ref = `EXP-${e.id}`;
      lines.push({ date: e.date, account: `Expense: ${e.category || 'General'}`, debit: e.amount || 0, credit: 0, ref, memo: e.name });
      lines.push({ date: e.date, account: 'Cash', debit: 0, credit: e.amount || 0, ref, memo: e.name });
    }

    const payments = db.prepare(`
      SELECT dp.id, dp.saleId, dp.customerName, dp.amount, dp.createdAt
      FROM debt_payments dp
      WHERE DATE(dp.createdAt) >= ? AND DATE(dp.createdAt) <= ? AND (dp.is_deleted = 0 OR dp.is_deleted IS NULL)
      ORDER BY dp.createdAt ASC
    `).all(startDate, endDate);
    for (const p of payments) {
      const ref = `PMT-${p.id}`;
      lines.push({ date: p.createdAt, account: 'Cash', debit: p.amount || 0, credit: 0, ref, memo: `Payment from ${p.customerName || 'customer'} on SALE-${p.saleId}` });
      lines.push({ date: p.createdAt, account: 'Accounts Receivable', debit: 0, credit: p.amount || 0, ref, memo: `Receivable settled PMT-${p.id}` });
    }

    const sorted = lines.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const totals = sorted.reduce((acc, l) => {
      acc.debit += l.debit || 0;
      acc.credit += l.credit || 0;
      return acc;
    }, { debit: 0, credit: 0 });

    return { startDate, endDate, lines: sorted, totals };
  });

  ipcMain.handle('get-customers', (_, options?: { limit?: number; offset?: number }) => {
    requirePermission('customers.view');
    const bizId = getActiveBusinessId();
    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options?.offset ?? 0;
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
      LIMIT ? OFFSET ?
    `).all(bizId, bizId, listLimit, offset) as any[];
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
    requirePermission('customers.view');
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

  ipcMain.handle('get-customer-sales', (_, customerName: string, options?: { limit?: number; offset?: number }) => {
    requirePermission('customers.view');
    const bizId = getActiveBusinessId();
    const listLimit = options?.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options?.offset ?? 0;
    return db.prepare(`
      SELECT sales.*, items.name as itemName 
      FROM sales LEFT JOIN items ON sales.itemId = items.id 
      WHERE sales.customerName = ? AND sales.businessId = ?
      ORDER BY sales.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(customerName, bizId, listLimit, offset);
  });

  ipcMain.handle('insert-customer', (_, customer: any) => {
    requirePermission('customers.add');
    const bizId = getActiveBusinessId();
    const name = customer.customerName?.trim();
    if (!name) throw new Error('Customer name is required');
    if (name.length > 200) throw new Error('Customer name must be 200 characters or less');
    if (customer.phone && String(customer.phone).length > 30) throw new Error('Phone must be 30 characters or less');
    if (customer.email && String(customer.email).length > 100) throw new Error('Email must be 100 characters or less');
    const existing = db.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(name, bizId);
    if (existing) return { success: false, error: 'Customer name already exists' };
    const result = db.prepare(`
      INSERT INTO customers (businessId, customerName, phone, secondaryPhone, email, address, city, company, taxNumber, groupName, creditLimit, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(bizId, name, customer.phone || '', customer.secondaryPhone || '', customer.email || '', customer.address || '', customer.city || '', customer.company || '', customer.taxNumber || '', customer.groupName || 'general', customer.creditLimit || 0, customer.notes || '');
    return { success: true, id: result.lastInsertRowid };
  });

  ipcMain.handle('update-customer', (_, customer: any) => {
    requirePermission('customers.add');
    const bizId = getActiveBusinessId();
    const name = customer.customerName?.trim();
    if (!name) throw new Error('Customer name is required');
    if (name.length > 200) throw new Error('Customer name must be 200 characters or less');
    if (customer.phone && String(customer.phone).length > 30) throw new Error('Phone must be 30 characters or less');
    if (customer.email && String(customer.email).length > 100) throw new Error('Email must be 100 characters or less');
    const dup = db.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ? AND id != ?").get(name, bizId, customer.id);
    if (dup) return { success: false, error: 'Another customer with this name already exists' };
    db.prepare(`
      UPDATE customers SET customerName = ?, phone = ?, secondaryPhone = ?, email = ?, address = ?, city = ?, company = ?, taxNumber = ?, groupName = ?, creditLimit = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND businessId = ?
    `).run(name, customer.phone || '', customer.secondaryPhone || '', customer.email || '', customer.address || '', customer.city || '', customer.company || '', customer.taxNumber || '', customer.groupName || 'general', customer.creditLimit || 0, customer.notes || '', customer.id, bizId);
    return { success: true };
  });

  ipcMain.handle('delete-customer', (_, customerId: number) => {
    requirePermission('customers.delete');
    db.prepare('UPDATE customers SET isActive = 0 WHERE id = ?').run(customerId);
    return { success: true };
  });

  ipcMain.handle('get-customer-notes', (_, customerId: number) => {
    return db.prepare("SELECT * FROM customer_notes WHERE customerId = ? ORDER BY createdAt DESC LIMIT 50").all(customerId);
  });

  ipcMain.handle('add-customer-note', (_, customerId: number, note: string, createdBy?: string) => {
    requirePermission('customers.add');
    db.prepare("INSERT INTO customer_notes (customerId, note, createdBy) VALUES (?, ?, ?)").run(customerId, note, createdBy || '');
    return { success: true };
  });

  // ========== DATA MANAGEMENT ==========
  ipcMain.handle('export-data', () => {
    requirePermission('settings.manage');
    const bizId = getActiveBusinessId();
    const tables = ['categories', 'items', 'item_packs', 'sales', 'expenses', 'adjustments', 'settings', 'customers', 'suppliers', 'returns', 'debt_payments', 'warehouses', 'warehouse_inventory', 'budgets', 'budget_adjustments', 'gift_cards', 'gift_card_transactions', 'orders'];
    const data: Record<string, any> = {};
    for (const table of tables) {
      if (table === 'settings') {
        data[table] = db.prepare(`SELECT * FROM ${table}`).all();
      } else {
        const hasBiz = (db.prepare(`PRAGMA table_info(${table})`).all() as any[]).some((c: any) => c.name === 'businessId');
        data[table] = hasBiz
          ? db.prepare(`SELECT * FROM ${table} WHERE businessId = ?`).all(bizId)
          : db.prepare(`SELECT * FROM ${table}`).all();
      }
    }
    return data;
  });

  ipcMain.handle('reset-data', (_, mode: 'transactions' | 'all' | 'factory' = 'transactions') => {
    requirePermission('settings.manage');
    const bizId = getActiveBusinessId();
    // Purge deletes parents (items, warehouses, suppliers) across many inter-related
    // tables, so disable FK enforcement for the duration of the wipe to avoid
    // SQLITE_CONSTRAINT_FOREIGNKEY failures. PRAGMA only takes effect outside a
    // transaction, so toggle it around db.transaction().
    db.pragma('foreign_keys = OFF');
    try {
      const transaction = db.transaction(() => {
      // ===== TRANSACTIONAL DATA (all modes - children before parents) =====
      db.prepare('DELETE FROM debt_payments WHERE saleId IN (SELECT id FROM sales WHERE businessId = ?)').run(bizId);
      db.prepare('DELETE FROM returns WHERE businessId = ?').run(bizId);
      db.prepare('DELETE FROM sales WHERE businessId = ?').run(bizId);
      db.prepare('DELETE FROM adjustments WHERE businessId = ?').run(bizId);
      db.prepare('DELETE FROM stock_movements WHERE itemId IN (SELECT id FROM items WHERE businessId = ?)').run(bizId);
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
      db.prepare('DELETE FROM expenses WHERE businessId = ?').run(bizId);
      db.prepare('DELETE FROM notifications WHERE businessId = ?').run(bizId);

      if (mode === 'transactions') {
        db.prepare('DELETE FROM warehouse_inventory WHERE itemId IN (SELECT id FROM items WHERE businessId = ?)').run(bizId);
      }

      if (mode === 'all' || mode === 'factory') {
        // ===== ORDERS, BUDGETS, CONTACTS, DRAFT SALES =====
        db.prepare('DELETE FROM order_items WHERE orderId IN (SELECT id FROM orders WHERE businessId = ?)').run(bizId);
        db.prepare('DELETE FROM order_history WHERE orderId IN (SELECT id FROM orders WHERE businessId = ?)').run(bizId);
        db.prepare('DELETE FROM orders WHERE businessId = ?').run(bizId);
        db.prepare('DELETE FROM draft_sales WHERE businessId = ?').run(bizId);
        db.prepare('DELETE FROM contacts WHERE businessId = ?').run(bizId);
        db.prepare('DELETE FROM budget_alerts WHERE businessId = ?').run(bizId);
        db.prepare('DELETE FROM budget_adjustments WHERE businessId = ?').run(bizId);
        db.prepare('DELETE FROM budgets WHERE businessId = ?').run(bizId);
        db.prepare('DELETE FROM notification_quiet_hours WHERE businessId = ?').run(bizId);
        db.prepare('DELETE FROM supplier_price_checks WHERE businessId = ?').run(bizId);
        db.prepare('DELETE FROM audit_logs WHERE businessId = ?').run(bizId);
        // ===== MASTER DATA =====
        db.prepare('DELETE FROM warehouse_inventory WHERE warehouseId IN (SELECT id FROM warehouses WHERE businessId = ?)').run(bizId);
        db.prepare('DELETE FROM item_packs WHERE itemId IN (SELECT id FROM items WHERE businessId = ?)').run(bizId);
        db.prepare('DELETE FROM items WHERE businessId = ?').run(bizId);
        db.prepare('DELETE FROM categories WHERE businessId = ?').run(bizId);
        db.prepare('DELETE FROM warehouses WHERE businessId = ?').run(bizId);
        db.prepare('DELETE FROM customers WHERE businessId = ?').run(bizId);
        db.prepare('DELETE FROM suppliers WHERE businessId = ?').run(bizId);
        // ===== EMPLOYEES (no businessId - delete all) =====
        db.prepare('DELETE FROM employee_performance WHERE employeeId IN (SELECT id FROM employees)').run();
        db.prepare('DELETE FROM attendance WHERE employeeId IN (SELECT id FROM employees)').run();
        db.prepare('DELETE FROM pin_recovery_keys WHERE employeeId IN (SELECT id FROM employees)').run();
        db.prepare('DELETE FROM login_history WHERE employeeId IN (SELECT id FROM employees)').run();
        db.prepare('DELETE FROM employee_accounts').run();
        db.prepare('DELETE FROM employees').run();
      }

      if (mode === 'factory') {
        // ===== BUSINESS & ADMIN DATA =====
        db.prepare('DELETE FROM pin_recovery_keys WHERE adminId IN (SELECT id FROM admins WHERE businessId = ?)').run(bizId);
        db.prepare('DELETE FROM login_history WHERE accountId IN (SELECT id FROM employee_accounts)').run();
        db.prepare('DELETE FROM payment_transactions WHERE businessId = ?').run(bizId);
        db.prepare('DELETE FROM subscription_history WHERE businessId = ?').run(bizId);
        db.prepare('DELETE FROM subscriptions WHERE businessId = ?').run(bizId);
        db.prepare('DELETE FROM audit_logs WHERE businessId = ?').run(bizId);
        db.prepare('DELETE FROM admins WHERE businessId = ?').run(bizId);
        db.prepare('DELETE FROM businesses WHERE id = ?').run(bizId);
      }
      });
      transaction();
    } finally {
      db.pragma('foreign_keys = ON');
    }
    if (mode === 'factory') {
      clearActiveBusinessCache();
      currentUserBusinessId = null;
      currentAdminId = null;
      currentUserName = null;
      currentUserRole = null;
      currentUserPermissions = [];
      currentUserSharedPerms = null;
    }
    return { success: true, mode, message: mode === 'factory' ? 'Factory reset complete. This will log you out.' : undefined };
  });

  // ========== ADMIN MANAGEMENT ==========
  // ---------- Who's using Shega? (device-local user profiles for PIN login) ----------
  // Returns every authorized person on this install: local admins, bridged
  // employees, and roster users synced from other devices. Never leaks PIN
  // hashes — only avatar/name/role for the picker UI.
  ipcMain.handle('get-login-users', () => {
    type LoginUser = { key: string; source: 'admin' | 'employee' | 'roster'; id: number; name: string; username: string | null; role: string; roleName: string; avatar: string | null; isOwner: boolean };
    const seen = new Set<string>();
    const out: LoginUser[] = [];
    const push = (u: LoginUser) => {
      const dupKey = (u.username || u.name || '').toLowerCase();
      if (!dupKey || seen.has(dupKey)) return;
      seen.add(dupKey);
      out.push(u);
    };
    try {
      const admins = db.prepare('SELECT id, name, username, role, roleName, avatar, isActive FROM admins WHERE isActive = 1').all() as any[];
      for (const a of admins) {
        push({
          key: `admin:${a.id}`, source: 'admin', id: a.id,
          name: a.name || a.username || 'User', username: a.username ?? null,
          role: a.role === 'super_admin' || a.role === 'admin' ? 'owner' : (a.role || 'staff'),
          roleName: a.roleName || (a.role === 'super_admin' || a.role === 'admin' ? 'Owner' : a.role || 'Staff'),
          avatar: a.avatar ?? null, isOwner: a.role === 'super_admin' || a.role === 'admin',
        });
      }
    } catch { /* admins table may not exist pre-init */ }
    try {
      const emps = db.prepare(`
        SELECT e.id, e.firstName, e.lastName, e.avatar, ea.username, ea.isActive,
               e.role_key, r.name as roleName
        FROM employees e
        LEFT JOIN employee_accounts ea ON ea.employeeId = e.id
        LEFT JOIN employee_roles r ON r.id = e.roleId
        WHERE ea.isActive = 1
      `).all() as any[];
      for (const e of emps) {
        const name = `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.username || `Employee ${e.id}`;
        push({
          key: `employee:${e.id}`, source: 'employee', id: e.id,
          name, username: e.username ?? null,
          role: e.role_key || 'cashier', roleName: e.roleName || 'Cashier',
          avatar: e.avatar ?? null, isOwner: e.role_key === 'owner',
        });
      }
    } catch { /* ignore */ }
    try {
      const roster = db.prepare('SELECT id, name, username, email, role, roleName, avatar, isOwner FROM users WHERE is_deleted = 0 AND isActive = 1 AND (pinHash IS NOT NULL AND pinHash != \'\'\')').all() as any[];
      for (const u of roster) {
        push({
          key: `roster:${u.id}`, source: 'roster', id: u.id,
          name: u.name || u.username || 'User', username: u.username ?? u.email ?? null,
          role: u.role || 'cashier', roleName: u.roleName || u.role || 'Cashier',
          avatar: u.avatar ?? null, isOwner: !!u.isOwner || u.role === 'owner',
        });
      }
    } catch { /* ignore */ }
    return out;
  });

  // PIN-only login for a picked profile. Verifies against the source row's
  // scrypt hash and sets the same session state as `login` so permissions,
  // business context, and activity attribution switch with the user.
  ipcMain.handle('login-by-user', (_e, source: 'admin' | 'employee' | 'roster', id: number, pin: string) => {
    if (!pin || !/^\d{4}$/.test(String(pin))) return { success: false, error: 'Enter your 4-digit PIN' };
    if (source === 'admin') {
      const admin = db.prepare('SELECT id, name, username, role, permissions, isActive, businessId, avatar, pin FROM admins WHERE id = ?').get(id) as any;
      if (!admin) return { success: false, error: 'User not found' };
      if (!admin.isActive) return { success: false, error: 'Account deactivated' };
      if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) return { success: false, error: 'Account is locked. Try again later.' };
      if (!verifyPin(pin, admin.pin)) {
        const attempts = (admin.failedLoginAttempts || 0) + 1;
        if (attempts >= 5) {
          const lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
          db.prepare('UPDATE admins SET failedLoginAttempts = ?, lockedUntil = ? WHERE id = ?').run(attempts, lockUntil, admin.id);
          return { success: false, error: 'Account locked due to too many failed attempts.' };
        }
        db.prepare('UPDATE admins SET failedLoginAttempts = ? WHERE id = ?').run(attempts, admin.id);
        return { success: false, error: 'Wrong PIN' };
      }
      db.prepare('UPDATE admins SET lastLogin = CURRENT_TIMESTAMP, failedLoginAttempts = 0, lockedUntil = NULL WHERE id = ?').run(admin.id);
      db.prepare('INSERT INTO login_history (action) VALUES (?)').run(`login: admin ${admin.id}`);
      currentAdminId = admin.id;
      currentUserName = admin.name;
      currentUserRole = admin.role || 'admin';
      currentUserPermissions = admin.permissions ? JSON.parse(admin.permissions) : ['*'];
      currentUserBusinessId = admin.businessId ?? null;
      currentUserSharedPerms = null;
      // Roster identity wins when this person exists in the synced membership
      // table (same person across devices, same role/permissions).
      const rosterId = resolveRosterIdentity();
      if (rosterId) {
        currentUserRole = rosterId.isOwner ? 'super_admin' : rosterId.role;
        currentUserPermissions = rosterId.permissions;
        currentUserSharedPerms = rosterId.isOwner ? null : rosterId.sharedPerms;
        if (rosterId.businessId) {
          currentUserBusinessId = rosterId.businessId;
          setActiveBusinessId(rosterId.businessId);
        }
      }
      return {
        success: true,
        admin: {
          ...admin,
          pin: undefined,
          role: currentUserRole,
          permissions: currentUserPermissions,
          isEmployee: rosterId ? !rosterId.isOwner : false,
          roleKey: rosterId?.role ?? null,
          sharedPermissions: currentUserSharedPerms,
        },
      };
    }
    if (source === 'roster') {
      const roster = db.prepare('SELECT * FROM users WHERE id = ? AND is_deleted = 0 AND isActive = 1').get(id) as any;
      if (!roster) return { success: false, error: 'User not found or deactivated' };
      const hasPin = !!roster.pinHash;
      if (hasPin && !verifyPin(pin, `${roster.pinSalt ?? ''}:${roster.pinHash}`)) {
        db.prepare('INSERT INTO login_history (action) VALUES (?)').run(`failed_login: roster ${roster.id} wrong pin`);
        return { success: false, error: 'Wrong PIN' };
      }
      const isOwner = !!roster.isOwner || roster.role === 'owner' || roster.role === 'super_admin';
      const rawPerms: Record<string, unknown> = {};
      try {
        const parsed = JSON.parse(roster.permissions || '{}');
        if (parsed && typeof parsed === 'object') Object.assign(rawPerms, parsed);
        if (Array.isArray(parsed)) for (const k of parsed) if (typeof k === 'string') rawPerms[k] = true;
      } catch { /* keep {} */ }
      const legacyPerms = Object.keys(rawPerms).filter((k) => !['*'].includes(k));
      currentAdminId = roster.id;
      currentUserName = roster.name;
      currentUserRole = isOwner ? 'super_admin' : (roster.roleName || roster.role || 'cashier');
      currentUserPermissions = isOwner ? ['*'] : (legacyPerms.length ? legacyPerms : ['*']);
      currentUserSharedPerms = isOwner ? null : resolveSharedPermissions(roster.role, roster.permissions);
      currentUserBusinessId = roster.businessId ?? null;
      if (currentUserBusinessId) setActiveBusinessId(currentUserBusinessId);
      db.prepare('INSERT INTO login_history (action) VALUES (?)').run(`login: roster ${roster.id}`);
      return {
        success: true,
        admin: {
          id: roster.id,
          name: roster.name,
          username: roster.username,
          role: currentUserRole,
          permissions: currentUserPermissions,
          isActive: roster.isActive,
          avatar: roster.avatar || undefined,
          isEmployee: !isOwner,
          roleKey: roster.role,
          sharedPermissions: currentUserSharedPerms,
        },
      };
    }
    // employee
    const account = db.prepare(`
      SELECT ea.*, e.firstName, e.lastName, e.id as employeeId, e.roleId,
        e.businessId as employeeBusinessId, e.avatar as employeeAvatar,
        e.role_key as roleKey, e.permissions_json as permissionsJson,
        r.name as roleName, r.permissions as rolePermissions
      FROM employee_accounts ea
      LEFT JOIN employees e ON ea.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
      WHERE ea.employeeId = ?
    `).get(id) as any;
    if (!account) return { success: false, error: 'User not found' };
    if (account.lockedUntil && new Date(account.lockedUntil) > new Date()) return { success: false, error: 'Account is locked. Try again later.' };
    if (!account.isActive) return { success: false, error: 'Account deactivated' };
    if (!verifyPin(pin, account.pin)) {
      const attempts = (account.failedLoginAttempts || 0) + 1;
      if (attempts >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        db.prepare('UPDATE employee_accounts SET failedLoginAttempts = ?, lockedUntil = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(attempts, lockUntil, account.id);
        return { success: false, error: 'Account locked due to too many failed attempts.' };
      }
      db.prepare('UPDATE employee_accounts SET failedLoginAttempts = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(attempts, account.id);
      return { success: false, error: 'Wrong PIN' };
    }
    db.prepare('UPDATE employee_accounts SET lastLogin = CURRENT_TIMESTAMP, failedLoginAttempts = 0, lockedUntil = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(account.id);
    db.prepare('INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)').run(account.id, account.employeeId, 'login');
    currentAdminId = account.id;
    currentUserName = `${account.firstName} ${account.lastName}`.trim();
    currentUserRole = account.roleName || 'employee';
    const rolePerms: string[] = account.rolePermissions ? JSON.parse(account.rolePermissions) : [];
    currentUserPermissions = rolePerms.length > 0 ? rolePerms : ['*'];
    currentUserBusinessId = account.employeeBusinessId ?? null;
    currentUserSharedPerms = resolveSharedPermissions(account.roleKey, account.permissionsJson);
    if (currentUserBusinessId) setActiveBusinessId(currentUserBusinessId);
    return {
      success: true,
      admin: {
        id: account.employeeId,
        accountId: account.id,
        username: account.username,
        firstName: account.firstName,
        lastName: account.lastName,
        avatar: account.employeeAvatar || undefined,
        businessId: account.employeeBusinessId ?? null,
        roleName: account.roleName,
        roleId: account.roleId,
        permissions: rolePerms,
        roleKey: account.roleKey || null,
        sharedPermissions: currentUserSharedPerms,
        forcePasswordChange: account.forcePasswordChange,
      },
    };
  });

  ipcMain.handle('login', (_, username: string, pin: string) => {
    // Check admins table first
    const admin = db.prepare(
      'SELECT id, name, username, role, permissions, isActive, businessId, avatar, pin FROM admins WHERE username = ?'
    ).get(username) as any;
    if (admin) {
      if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
        return { success: false, error: 'Account is locked. Try again later.' };
      }
      if (!admin.isActive) return { success: false, error: 'Account deactivated' };
      if (!verifyPin(pin, admin.pin)) {
        const attempts = (admin.failedLoginAttempts || 0) + 1;
        if (attempts >= 5) {
          const lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
          db.prepare('UPDATE admins SET failedLoginAttempts = ?, lockedUntil = ? WHERE id = ?').run(attempts, lockUntil, admin.id);
          return { success: false, error: 'Account locked due to too many failed attempts.' };
        }
        db.prepare('UPDATE admins SET failedLoginAttempts = ? WHERE id = ?').run(attempts, admin.id);
        return { success: false, error: 'Invalid credentials' };
      }
      db.prepare('UPDATE admins SET lastLogin = CURRENT_TIMESTAMP, failedLoginAttempts = 0, lockedUntil = NULL WHERE id = ?').run(admin.id);
      currentAdminId = admin.id;
      currentUserName = admin.name;
      currentUserRole = admin.role || 'admin';
      currentUserPermissions = admin.permissions ? JSON.parse(admin.permissions) : ['*'];
      currentUserBusinessId = null;
      currentUserSharedPerms = null;

      // Identity resolution against the synced `users` roster: when this person
      // already exists on the roster (the canonical cross-device membership
      // record synced from another install / the backend), their role and
      // permissions MUST come from that membership so the same account is the
      // same user with the same role here. Only fall back to the local admin
      // seed when no roster row exists (fresh install before first sync).
      const rosterId = resolveRosterIdentity();
      if (rosterId) {
        // Owners stay FULL-ACCESS super_admin at the legacy renderer layer
        // (mapped back to 'owner' by the shared model's getUserRole), so the
        // existing UI gates are unchanged; the roster is still the source that
        // this person is the SAME owner across devices.
        currentUserRole = rosterId.isOwner ? 'super_admin' : rosterId.role;
        currentUserPermissions = rosterId.permissions;
        currentUserSharedPerms = rosterId.isOwner ? null : rosterId.sharedPerms;
        if (rosterId.businessId) {
          currentUserBusinessId = rosterId.businessId;
          setActiveBusinessId(rosterId.businessId);
        }
      }
      return {
        success: true,
        admin: {
          ...admin,
          role: currentUserRole,
          permissions: currentUserPermissions,
          isEmployee: rosterId ? !rosterId.isOwner : false,
          roleKey: rosterId?.role ?? null,
          sharedPermissions: currentUserSharedPerms
        }
      };
    }
    // Fall back to employee_accounts
    const account = db.prepare(`
      SELECT ea.*, e.id as employeeId, e.firstName, e.lastName,
        e.businessId as employeeBusinessId,
        e.avatar as employeeAvatar,
        e.role_key as roleKey, e.permissions_json as permissionsJson,
        r.name as roleName, r.permissions as rolePermissions
      FROM employee_accounts ea
      LEFT JOIN employees e ON ea.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
      WHERE ea.username = ?
    `).get(username) as any;
    if (!account) {
      // Cross-platform sign-in: accept a business user synced from Mobile via
      // the `users` roster (username/PIN lives in pinHash:pinSalt). Desktop
      // staff were bridged into the same table, so this is the unified path.
      const roster = findRosterLogin(username);
      if (roster) {
        const hasPin = !!roster.pinHash;
        if (hasPin && !verifyPin(pin, `${roster.pinSalt ?? ''}:${roster.pinHash}`)) {
          db.prepare('INSERT INTO login_history (action) VALUES (?)').run('failed_login: roster wrong pin');
          return { success: false, error: 'Invalid credentials' };
        }
        const isOwner = !!roster.isOwner || roster.role === 'owner' || roster.role === 'super_admin';
        const rawPerms: Record<string, unknown> = {};
        try {
          const parsed = JSON.parse(roster.permissions || '{}');
          if (parsed && typeof parsed === 'object') Object.assign(rawPerms, parsed);
          if (Array.isArray(parsed)) for (const k of parsed) if (typeof k === 'string') rawPerms[k] = true;
        } catch (e) { /* keep {} */ }
        const legacyPerms = Object.keys(rawPerms).filter((k) => !['*'].includes(k));
        currentAdminId = roster.id;
        currentUserName = roster.name;
        currentUserRole = isOwner ? 'super_admin' : (roster.roleName || roster.role || 'cashier');
        currentUserPermissions = isOwner ? ['*'] : (legacyPerms.length ? legacyPerms : ['*']);
        currentUserSharedPerms = isOwner ? null : resolveSharedPermissions(roster.role, roster.permissions);
        currentUserBusinessId = roster.businessId ?? null;
        if (currentUserBusinessId) setActiveBusinessId(currentUserBusinessId);
        return {
          success: true,
          admin: {
            id: roster.id,
            name: roster.name,
            username: roster.username,
            role: currentUserRole,
            permissions: currentUserPermissions,
            isActive: roster.isActive,
            avatar: roster.avatar || undefined,
            isEmployee: !isOwner,
            roleKey: roster.role,
            sharedPermissions: currentUserSharedPerms,
            forcePasswordChange: hasPin ? 0 : 1
          }
        };
      }
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
        db.prepare('UPDATE employee_accounts SET failedLoginAttempts = ?, lockedUntil = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(attempts, lockUntil, account.id);
        db.prepare('INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)').run(account.id, account.employeeId, 'failed_login: locked after 5 attempts');
        return { success: false, error: 'Account locked due to too many failed attempts.' };
      }
      db.prepare('UPDATE employee_accounts SET failedLoginAttempts = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(attempts, account.id);
      db.prepare('INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)').run(account.id, account.employeeId, 'failed_login: wrong pin');
      return { success: false, error: 'Invalid credentials' };
    }
    db.prepare('UPDATE employee_accounts SET lastLogin = CURRENT_TIMESTAMP, failedLoginAttempts = 0, lockedUntil = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(account.id);
    db.prepare('INSERT INTO login_history (accountId, employeeId, action) VALUES (?, ?, ?)').run(account.id, account.employeeId, 'login');
    currentAdminId = account.employeeId;
    currentUserName = `${account.firstName || ''} ${account.lastName || ''}`.trim() || account.username;
    currentUserRole = account.roleName || 'employee';
    const rolePerms: string[] = account.rolePermissions ? JSON.parse(account.rolePermissions) : [];
    currentUserPermissions = rolePerms.length > 0 ? rolePerms : ['*'];
    currentUserBusinessId = account.employeeBusinessId ?? null;
    currentUserSharedPerms = resolveSharedPermissions(account.roleKey, account.permissionsJson);
    if (currentUserBusinessId) setActiveBusinessId(currentUserBusinessId);
    return {
      success: true,
      admin: {
        id: account.employeeId,
        name: `${account.firstName || ''} ${account.lastName || ''}`.trim() || account.username,
        username: account.username,
        role: account.roleName || 'employee',
        permissions: account.rolePermissions ? JSON.parse(account.rolePermissions) : [],
        isActive: account.isActive,
        avatar: account.employeeAvatar || undefined,
        isEmployee: true,
        roleKey: account.roleKey || null,
        sharedPermissions: currentUserSharedPerms
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

  ipcMain.handle('get-current-admin', (_, id: number, isEmployee?: boolean) => {
    if (isEmployee) {
      const account = db.prepare(`
        SELECT ea.*, e.id as employeeId, e.firstName, e.lastName,
          e.businessId as employeeBusinessId, e.avatar as employeeAvatar,
          e.role_key as roleKey, e.permissions_json as permissionsJson,
          r.name as roleName, r.permissions as rolePermissions
        FROM employee_accounts ea
        LEFT JOIN employees e ON ea.employeeId = e.id
        LEFT JOIN employee_roles r ON e.roleId = r.id
        WHERE ea.employeeId = ?
      `).get(id) as any;
      if (!account) return null;
      return {
        id: account.employeeId,
        name: `${account.firstName || ''} ${account.lastName || ''}`.trim() || account.username,
        username: account.username,
        role: account.roleName || 'employee',
        permissions: account.rolePermissions ? JSON.parse(account.rolePermissions) : [],
        isActive: account.isActive,
        avatar: account.employeeAvatar || undefined,
        isEmployee: true,
        roleKey: account.roleKey || null,
        sharedPermissions: resolveSharedPermissions(account.roleKey, account.permissionsJson)
      };
    }
    const admin = db.prepare('SELECT id, name, username, role, permissions, isActive, avatar FROM admins WHERE id = ?').get(id) as any;
    if (admin) {
      return {
        ...admin,
        permissions: admin.permissions ? JSON.parse(admin.permissions) : []
      };
    }
    return null;
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
    bridgeAdminUser(Number(result.lastInsertRowid));
    return { success: true, id: result.lastInsertRowid };
  });

  ipcMain.handle('update-admin', (_, id: number, admin: any) => {
    const isSelf = id === currentAdminId;
    // Sensitive fields always require settings.users permission
    const sensitiveFields = ['username', 'pin', 'role', 'permissions', 'isActive', 'businessId'];
    const updatingSensitive = sensitiveFields.some(f => admin[f] !== undefined);
    // Updating another user, or any sensitive field, requires settings.users
    if (!isSelf || updatingSensitive) {
      requirePermission('settings.users');
    }

    // PIN change flow (self only)
    if (admin.pin !== undefined && id === currentAdminId) {
      const stored = db.prepare('SELECT pin FROM admins WHERE id = ?').get(id) as any;
      if (!stored || !admin.currentPin || !verifyPin(admin.currentPin, stored.pin)) {
        return { success: false, error: 'Current PIN is required to change your PIN' };
      }
      delete admin.currentPin;
    }

    // Check for duplicate username (exclude current admin)
    if (admin.username) {
      const existing = db.prepare('SELECT id FROM admins WHERE username = ? AND id != ?').get(admin.username, id);
      if (existing) return { success: false, error: 'Username already exists' };
    }

    // If the target id is not an admin (employee account), update the employees table instead
    const existingAdmin = db.prepare('SELECT id FROM admins WHERE id = ?').get(id) as any;
    if (!existingAdmin) {
      const empFields: string[] = [];
      const empValues: any[] = [];
      if (admin.avatar !== undefined) { empFields.push('avatar = ?'); empValues.push(admin.avatar); }
      if (admin.name !== undefined) { empFields.push('firstName = ?'); empValues.push(admin.name); }
      if (empFields.length > 0) {
        empValues.push(id);
        db.prepare(`UPDATE employees SET ${empFields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`).run(...empValues);
      }
      bridgeEmployeeUser(id);
      return { success: true };
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
    bridgeAdminUser(id);
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
    bridgeDeleteBySource('admin', id);
    return { success: true };
  });

  // ========== WAREHOUSES ==========
  ipcMain.handle('get-warehouses', () => {
    requirePermission('warehouses.view');
    const bizId = getActiveBusinessId();
    return db.prepare('SELECT * FROM warehouses WHERE businessId = ? ORDER BY name').all(bizId);
  });

  ipcMain.handle('get-warehouse', (_, id: number) => {
    requirePermission('warehouses.view');
    return db.prepare('SELECT * FROM warehouses WHERE id = ?').get(id);
  });

  ipcMain.handle('insert-warehouse', (_, wh: any) => {
    requirePermission('warehouses.create');
    const bizId = getActiveBusinessId();
    return db.prepare('INSERT INTO warehouses (businessId, name, location, managerName, managerPhone, email) VALUES (?, ?, ?, ?, ?, ?)')
      .run(bizId, wh.name, wh.location, wh.managerName, wh.managerPhone, wh.email).lastInsertRowid;
  });

  ipcMain.handle('update-warehouse', (_, id: number, wh: any) => {
    requirePermission('warehouses.create');
    return db.prepare('UPDATE warehouses SET name = ?, location = ?, managerName = ?, managerPhone = ?, email = ?, isActive = ? WHERE id = ?')
      .run(wh.name, wh.location, wh.managerName, wh.managerPhone, wh.email, wh.isActive ?? 1, id);
  });

  ipcMain.handle('delete-warehouse', (_, id: number) => {
    requirePermission('warehouses.edit');
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM stock_movements WHERE warehouseId = ?').run(id);
      db.prepare('DELETE FROM warehouse_inventory WHERE warehouseId = ?').run(id);
      db.prepare('DELETE FROM warehouses WHERE id = ?').run(id);
    });
    return tx();
  });

  // ========== WAREHOUSE INVENTORY ==========
  ipcMain.handle('get-warehouse-inventory', (_, warehouseId: number) => {
    requirePermission('warehouses.view');
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

  ipcMain.handle('get-all-warehouse-inventory', (_, options: { search?: string; category?: string; limit?: number; offset?: number } = {}) => {
    requirePermission('warehouses.view');
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
      query += ' AND (LOWER(items.name) LIKE LOWER(?) OR LOWER(items.companyName) LIKE LOWER(?))';
      params.push(`%${options.search}%`, `%${options.search}%`);
    }
    if (options.category && options.category !== 'All') {
      query += ' AND categories.name = ?';
      params.push(options.category);
    }
    query += ' ORDER BY w.name, items.name LIMIT ? OFFSET ?';
    params.push(options.limit ?? DEFAULT_LIST_LIMIT, options.offset ?? 0);
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('update-warehouse-inventory', (_, warehouseId: number, itemId: number, quantity: number) => {
    requirePermission('inventory.adjust');
    validateNonNegative(quantity, 'Warehouse inventory quantity');
    const existing = db.prepare('SELECT id, quantity FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(warehouseId, itemId) as any;
    const oldQty = existing?.quantity || 0;
    const delta = quantity - oldQty;
    if (existing) {
      db.prepare('UPDATE warehouse_inventory SET quantity = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(quantity, existing.id);
    } else {
      db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(warehouseId, itemId, quantity);
    }
    // Sync global totals via atomic recalculation from warehouse_inventory
    const totalRow = db.prepare('SELECT COALESCE(SUM(quantity), 0) as total FROM warehouse_inventory WHERE itemId = ?').get(itemId) as any;
    db.prepare('UPDATE items SET totalBaseQuantity = ? WHERE id = ?').run(totalRow.total, itemId);
    // Log movement
    const item = db.prepare('SELECT name FROM items WHERE id = ?').get(itemId) as any;
    db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)')
      .run(warehouseId, itemId, 'adjustment', quantity, 'manual', 'Manual inventory adjustment');
    return { success: true };
  });

  // ========== STOCK TRANSFERS ==========
  ipcMain.handle('transfer-stock', (_, transfer: any) => {
    requirePermission('warehouses.transfer');
    if (transfer.fromWarehouseId === transfer.toWarehouseId) throw new Error('Source and destination warehouses must be different');
    const qty = validatePositive(transfer.quantity, 'Transfer quantity');
    transfer.quantity = qty;
    const bizId = getActiveBusinessId();
    const tx = db.transaction(() => {
      // Deduct from source
      const fromResult = db.prepare('UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE warehouseId = ? AND itemId = ? AND quantity >= ?').run(transfer.quantity, transfer.fromWarehouseId, transfer.itemId, transfer.quantity);
      if (fromResult.changes === 0) throw new Error('Insufficient stock at source warehouse');

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
    const offset = options.offset ?? 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(listLimit, offset);
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
    const offset = options.offset ?? 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(listLimit, offset);
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('cleanup-stock-movements', () => {
    requirePermission('settings.manage');
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
    const bizId = getActiveBusinessId();
    return db.prepare('SELECT * FROM employee_roles WHERE businessId = ? ORDER BY name').all(bizId);
  });

  ipcMain.handle('get-employee-role', (_, id: number) => {
    return db.prepare('SELECT * FROM employee_roles WHERE id = ? AND businessId = ?').get(id, getActiveBusinessId());
  });

  ipcMain.handle('insert-employee-role', (_, data: any) => {
    requirePermission('settings.roles');
    const permissions = JSON.stringify(data.permissions || []);
    const result = db.prepare('INSERT INTO employee_roles (businessId, name, description, permissions, isSystem) VALUES (?, ?, ?, ?, ?)')
      .run(getActiveBusinessId(), data.name, data.description || '', permissions, 0);
    return result.lastInsertRowid;
  });

  ipcMain.handle('update-employee-role', (_, id: number, data: any) => {
    requirePermission('settings.roles');
    const permissions = JSON.stringify(data.permissions || []);
    const result = db.prepare('UPDATE employee_roles SET name = ?, description = ?, permissions = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?')
      .run(data.name, data.description || '', permissions, id, getActiveBusinessId());
    return result;
  });

  ipcMain.handle('duplicate-employee-role', (_, id: number) => {
    requirePermission('settings.roles');
    const original = db.prepare('SELECT * FROM employee_roles WHERE id = ? AND businessId = ?').get(id, getActiveBusinessId()) as any;
    if (!original) throw new Error('Role not found');
    const result = db.prepare('INSERT INTO employee_roles (businessId, name, description, permissions, isSystem) VALUES (?, ?, ?, ?, 0)')
      .run(getActiveBusinessId(), `${original.name} (Copy)`, original.description, original.permissions);
    return result.lastInsertRowid;
  });

  ipcMain.handle('delete-employee-role', (_, id: number) => {
    requirePermission('settings.roles');
    const bizId = getActiveBusinessId();
    const role = db.prepare('SELECT name, isSystem FROM employee_roles WHERE id = ? AND businessId = ?').get(id, bizId) as any;
    if (role?.isSystem) throw new Error('Cannot delete system role');
    db.prepare('UPDATE employees SET roleId = NULL WHERE roleId = ? AND businessId = ?').run(id, bizId);
    db.prepare('DELETE FROM employee_roles WHERE id = ? AND businessId = ?').run(id, bizId);
  });

  // ========== EMPLOYEES ==========
  ipcMain.handle('get-employees', (_, options?: any) => {
    requirePermission('employees.view');
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
    const conditions: string[] = ['e.businessId = ?'];
    const params: any[] = [getActiveBusinessId()];
    if (options?.search) {
      conditions.push('(LOWER(e.firstName) LIKE LOWER(?) OR LOWER(e.lastName) LIKE LOWER(?) OR LOWER(e.phone) LIKE LOWER(?) OR LOWER(e.email) LIKE LOWER(?) OR LOWER(e.employeeCode) LIKE LOWER(?))');
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
    const offset = options?.offset ?? 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(listLimit, offset);
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-employee', (_, id: number) => {
    requirePermission('employees.view');
    return db.prepare(`
      SELECT e.*, r.name as roleName, r.permissions as rolePermissions,
        r.description as roleDescription, w.name as warehouseName
      FROM employees e
      LEFT JOIN employee_roles r ON e.roleId = r.id
      LEFT JOIN warehouses w ON e.warehouseId = w.id
      WHERE e.id = ? AND e.businessId = ?
    `).get(id, getActiveBusinessId());
  });

  ipcMain.handle('insert-employee', (_, data: any) => {
    requirePermission('employees.add');
    const result = db.prepare(`
      INSERT INTO employees (businessId, employeeCode, firstName, lastName, phone, email, address, emergencyContact,
        gender, dateOfBirth, roleId, department, warehouseId, isActive, employmentStatus, avatar, hireDate, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      getActiveBusinessId(),
      data.employeeCode || null, data.firstName, data.lastName,
      data.phone || null, data.email || null, data.address || null,
      data.emergencyContact || null, data.gender || null, data.dateOfBirth || null,
      data.roleId || null, data.department || null, data.warehouseId || null,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      data.employmentStatus || 'active', data.avatar || null,
      data.hireDate || null, data.notes || null
    );
    bridgeEmployeeUser(Number(result.lastInsertRowid));
    return result.lastInsertRowid;
  });

  ipcMain.handle('update-employee', (_, id: number, data: any) => {
    requirePermission('employees.add');
    const result = db.prepare(`
      UPDATE employees SET
        employeeCode = ?, firstName = ?, lastName = ?, phone = ?, email = ?,
        address = ?, emergencyContact = ?, gender = ?, dateOfBirth = ?,
        roleId = ?, department = ?, warehouseId = ?, isActive = ?,
        employmentStatus = ?, avatar = ?, hireDate = ?, notes = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND businessId = ?
    `).run(
      data.employeeCode || null, data.firstName, data.lastName,
      data.phone || null, data.email || null, data.address || null,
      data.emergencyContact || null, data.gender || null, data.dateOfBirth || null,
      data.roleId || null, data.department || null, data.warehouseId || null,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      data.employmentStatus || 'active', data.avatar || null,
      data.hireDate || null, data.notes || null, id, getActiveBusinessId()
    );
    bridgeEmployeeUser(id);
    return result;
  });

  ipcMain.handle('delete-employee', (_, id: number) => {
    requirePermission('employees.delete');
    db.prepare('DELETE FROM employees WHERE id = ? AND businessId = ?').run(id, getActiveBusinessId());
    bridgeDeleteBySource('employee', id);
  });

  ipcMain.handle('archive-employee', (_, id: number) => {
    requirePermission('employees.delete');
    const result = db.prepare("UPDATE employees SET employmentStatus = 'inactive', isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(id, getActiveBusinessId());
    bridgeEmployeeUser(id);
    // Push an immediate lock to any devices signed in as this employee.
    try {
      const emp = db.prepare('SELECT uuid FROM employees WHERE id = ?').get(id) as any;
      if (emp?.uuid) p2pSync.kickUserDevices(String(emp.uuid), 'Your access was deactivated by the owner.');
    } catch { /* best effort */ }
    return result;
  });

  ipcMain.handle('reactivate-employee', (_, id: number) => {
    requirePermission('employees.delete');
    const result = db.prepare("UPDATE employees SET employmentStatus = 'active', isActive = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(id, getActiveBusinessId());
    bridgeEmployeeUser(id);
    return result;
  });

  // ========== EMPLOYEE ACCOUNTS ==========
  ipcMain.handle('get-employee-accounts', () => {
    requirePermission('settings.users');
    return db.prepare(`
      SELECT ea.*, e.firstName, e.lastName, e.employeeCode, e.avatar as avatar, r.name as roleName
      FROM employee_accounts ea
      LEFT JOIN employees e ON ea.employeeId = e.id
      LEFT JOIN employee_roles r ON e.roleId = r.id
      WHERE e.businessId = ?
      ORDER BY e.firstName, e.lastName
    `).all(getActiveBusinessId());
  });

  ipcMain.handle('insert-employee-account', (_, data: any) => {
    requirePermission('settings.users');
    if (!data.username || !data.username.trim()) throw new Error('Username is required');
    if (!data.pin || data.pin.length < 4) throw new Error('PIN must be at least 4 characters');
    const empBiz = db.prepare('SELECT businessId FROM employees WHERE id = ?').get(data.employeeId) as any;
    if (!empBiz || empBiz.businessId !== getActiveBusinessId()) throw new Error('Employee not found in this business');
    const hash = hashPin(data.pin);
    const result = db.prepare('INSERT INTO employee_accounts (employeeId, username, pin, forcePasswordChange) VALUES (?, ?, ?, ?)')
      .run(data.employeeId, data.username, hash, data.forcePasswordChange ? 1 : 0);
    bridgeEmployeeUser(data.employeeId);
    return result.lastInsertRowid;
  });

  ipcMain.handle('update-employee-account', (_, id: number, data: any) => {
    requirePermission('settings.users');
    const acctBiz = db.prepare('SELECT e.businessId, ea.employeeId FROM employee_accounts ea LEFT JOIN employees e ON ea.employeeId = e.id WHERE ea.id = ?').get(id) as any;
    if (!acctBiz || acctBiz.businessId !== getActiveBusinessId()) throw new Error('Account not found in this business');
    if (data.pin) {
    const hash = hashPin(data.pin);
      db.prepare('UPDATE employee_accounts SET username = ?, pin = ?, isActive = ?, forcePasswordChange = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
        .run(data.username, hash, data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1, data.forcePasswordChange ? 1 : 0, id);
    } else {
      db.prepare('UPDATE employee_accounts SET username = ?, isActive = ?, forcePasswordChange = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
        .run(data.username, data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1, data.forcePasswordChange ? 1 : 0, id);
    }
    bridgeEmployeeUser(acctBiz.employeeId);
  });

  ipcMain.handle('delete-employee-account', (_, id: number) => {
    requirePermission('settings.users');
    const acctBiz = db.prepare('SELECT e.businessId, ea.employeeId FROM employee_accounts ea LEFT JOIN employees e ON ea.employeeId = e.id WHERE ea.id = ?').get(id) as any;
    if (!acctBiz || acctBiz.businessId !== getActiveBusinessId()) throw new Error('Account not found in this business');
    db.prepare('DELETE FROM employee_accounts WHERE id = ?').run(id);
    bridgeEmployeeUser(acctBiz.employeeId);
  });

  ipcMain.handle('lock-employee-account', (_, id: number) => {
    requirePermission('settings.users');
    const acctBiz = db.prepare('SELECT e.businessId, ea.employeeId FROM employee_accounts ea LEFT JOIN employees e ON ea.employeeId = e.id WHERE ea.id = ?').get(id) as any;
    if (!acctBiz || acctBiz.businessId !== getActiveBusinessId()) throw new Error('Account not found in this business');
    const lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    db.prepare('UPDATE employee_accounts SET isActive = 0, lockedUntil = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(lockUntil, id);
    bridgeEmployeeUser(acctBiz.employeeId);
  });

  ipcMain.handle('unlock-employee-account', (_, id: number) => {
    requirePermission('settings.users');
    const acctBiz = db.prepare('SELECT e.businessId, ea.employeeId FROM employee_accounts ea LEFT JOIN employees e ON ea.employeeId = e.id WHERE ea.id = ?').get(id) as any;
    if (!acctBiz || acctBiz.businessId !== getActiveBusinessId()) throw new Error('Account not found in this business');
    db.prepare('UPDATE employee_accounts SET isActive = 1, lockedUntil = NULL, failedLoginAttempts = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    bridgeEmployeeUser(acctBiz.employeeId);
  });

  ipcMain.handle('reset-employee-password', (_, id: number, newPin: string) => {
    requirePermission('settings.users');
    const acct = db.prepare('SELECT ea.id, ea.employeeId, e.roleId, r.name as roleName FROM employee_accounts ea LEFT JOIN employees e ON ea.employeeId = e.id LEFT JOIN employee_roles r ON e.roleId = r.id WHERE ea.id = ? AND e.businessId = ?').get(id, getActiveBusinessId()) as any;
    if (!acct) return { success: false, error: 'Account not found' };
    if (acct.roleName === 'Owner') return { success: false, error: 'Cannot reset PIN for Owner role' };
    const hash = hashPin(newPin);
    db.prepare('UPDATE employee_accounts SET pin = ?, forcePasswordChange = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(hash, id);
    bridgeEmployeeUser(acct.employeeId);
    db.prepare('INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)')
      .run('employee_account', id, 'pin_reset', currentUserName || 'unknown', null, 'PIN reset by super admin');
    insertAuditLog('pin_reset', 'employee_account', id, 'pin', 'REDACTED', 'REDACTED', `PIN reset for account #${id} by ${currentUserName || 'unknown'}`);
    return { success: true };
  });

  ipcMain.handle('generate-recovery-key', (_, entityType: 'employee' | 'admin', entityId: number) => {
    requirePermission('settings.users');
    if (entityType === 'employee') {
      const empBiz = db.prepare('SELECT businessId FROM employees WHERE id = ?').get(entityId) as any;
      if (!empBiz || empBiz.businessId !== getActiveBusinessId()) throw new Error('Employee not found in this business');
    }
    const recoveryKey = crypto.randomBytes(32).toString('hex');
    const hint = recoveryKey.slice(0, 8) + '...' + recoveryKey.slice(-4);
    const hash = hashPin(recoveryKey);
    const existing = db.prepare('SELECT id FROM pin_recovery_keys WHERE employeeId = ? OR adminId = ?')
      .get(entityType === 'employee' ? entityId : null, entityType === 'admin' ? entityId : null) as any;
    if (existing) {
      db.prepare('UPDATE pin_recovery_keys SET recoveryKey = ?, keyHint = ?, usedAt = NULL, createdAt = CURRENT_TIMESTAMP WHERE id = ?')
        .run(hash, hint, existing.id);
    } else {
      const empCol = entityType === 'employee' ? entityId : null;
      const admCol = entityType === 'admin' ? entityId : null;
      db.prepare('INSERT INTO pin_recovery_keys (employeeId, adminId, recoveryKey, keyHint) VALUES (?, ?, ?, ?)')
        .run(empCol, admCol, hash, hint);
    }
    db.prepare('INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)')
      .run(entityType === 'employee' ? 'employee_account' : 'admin', entityId, 'recovery_key_generated', currentUserName || 'unknown', null, 'Recovery key generated');
    insertAuditLog('generate_recovery_key', entityType === 'employee' ? 'employee_account' : 'admin', entityId, null, null, null, `Recovery key generated for ${entityType} #${entityId} by ${currentUserName || 'unknown'}`);
    return { recoveryKey, hint };
  });

  ipcMain.handle('verify-recovery-key', (_, username: string, recoveryKey: string) => {
    let empId: number | null = null;
    let admId: number | null = null;
    const empAccount = db.prepare('SELECT ea.id as accountId, ea.employeeId FROM employee_accounts ea WHERE ea.username = ?').get(username) as any;
    if (empAccount) {
      empId = empAccount.employeeId;
    } else {
      const admin = db.prepare('SELECT id FROM admins WHERE username = ?').get(username) as any;
      if (admin) {
        admId = admin.id;
      }
    }
    if (!empId && !admId) return { valid: false, error: 'Account not found' };
    let record: any = null;
    if (empId) {
      record = db.prepare('SELECT * FROM pin_recovery_keys WHERE employeeId = ?').get(empId) as any;
    }
    if (!record && admId) {
      record = db.prepare('SELECT * FROM pin_recovery_keys WHERE adminId = ?').get(admId) as any;
    }
    if (!record) return { valid: false, error: 'No recovery key found for this account' };
    if (record.usedAt) return { valid: false, error: 'Recovery key has already been used' };
    if (!verifyPin(recoveryKey, record.recoveryKey)) return { valid: false, error: 'Invalid recovery key' };
    return { valid: true, accountId: empId || admId, isEmployee: !!empId };
  });

  ipcMain.handle('reset-pin-with-recovery', (_, username: string, recoveryKey: string, newPin: string) => {
    let empId: number | null = null;
    let admId: number | null = null;
    const empAccount = db.prepare('SELECT ea.id as accountId, ea.employeeId FROM employee_accounts ea WHERE ea.username = ?').get(username) as any;
    if (empAccount) {
      empId = empAccount.employeeId;
    } else {
      const admin = db.prepare('SELECT id FROM admins WHERE username = ?').get(username) as any;
      if (admin) {
        admId = admin.id;
      }
    }
    if (!empId && !admId) return { success: false, error: 'Account not found' };
    let record: any = null;
    if (empId) {
      record = db.prepare('SELECT * FROM pin_recovery_keys WHERE employeeId = ?').get(empId) as any;
    }
    if (!record && admId) {
      record = db.prepare('SELECT * FROM pin_recovery_keys WHERE adminId = ?').get(admId) as any;
    }
    if (!record) return { success: false, error: 'No recovery key found' };
    if (record.usedAt) return { success: false, error: 'Recovery key has already been used' };
    if (!verifyPin(recoveryKey, record.recoveryKey)) return { success: false, error: 'Invalid recovery key' };
    db.prepare('UPDATE pin_recovery_keys SET usedAt = CURRENT_TIMESTAMP WHERE id = ?').run(record.id);
    const hash = hashPin(newPin);
    if (empId) {
      const existingAcct = db.prepare('SELECT id FROM employee_accounts WHERE employeeId = ?').get(empId) as any;
      if (existingAcct) {
        db.prepare('UPDATE employee_accounts SET pin = ?, forcePasswordChange = 0, failedLoginAttempts = 0, lockedUntil = NULL, isActive = 1, updatedAt = CURRENT_TIMESTAMP WHERE employeeId = ?')
          .run(hash, empId);
      }
    }
    if (admId) {
      db.prepare('UPDATE admins SET pin = ? WHERE id = ?').run(hash, admId);
    }
    const targetId = (empId || admId) ?? undefined;
    db.prepare('INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)')
      .run('employee_account', targetId, 'pin_recovery_reset', username, null, 'PIN reset via recovery key');
    insertAuditLog('pin_recovery_reset', 'account', targetId ?? null, 'pin', 'REDACTED', 'REDACTED', `PIN reset via recovery key for ${username}`);
    return { success: true };
  });

  ipcMain.handle('lock-user-account', (_, id: number) => {
    requirePermission('settings.users');
    const lockUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const acct = db.prepare('SELECT ea.*, e.firstName, e.lastName, r.name as roleName FROM employee_accounts ea LEFT JOIN employees e ON ea.employeeId = e.id LEFT JOIN employee_roles r ON e.roleId = r.id WHERE ea.id = ?').get(id) as any;
    if (!acct) return { success: false, error: 'Account not found' };
    if (acct.roleName === 'Owner') return { success: false, error: 'Cannot lock an Owner account' };
    db.prepare('UPDATE employee_accounts SET isActive = 0, lockedUntil = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(lockUntil, id);
    db.prepare('INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)')
      .run('employee_account', id, 'account_locked', currentUserName || 'unknown', null, `Account locked`);
    insertAuditLog('lock_account', 'employee_account', id, 'isActive', '1', '0', `Account #${id} locked by ${currentUserName || 'unknown'}`);
    return { success: true };
  });

  ipcMain.handle('unlock-user-account', (_, id: number) => {
    requirePermission('settings.users');
    const acct = db.prepare('SELECT id FROM employee_accounts WHERE id = ?').get(id) as any;
    if (!acct) return { success: false, error: 'Account not found' };
    db.prepare('UPDATE employee_accounts SET isActive = 1, lockedUntil = NULL, failedLoginAttempts = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    db.prepare('INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)')
      .run('employee_account', id, 'account_unlocked', currentUserName || 'unknown', null, `Account unlocked`);
    insertAuditLog('unlock_account', 'employee_account', id, 'isActive', '0', '1', `Account #${id} unlocked by ${currentUserName || 'unknown'}`);
    return { success: true };
  });

  ipcMain.handle('force-pin-change', (_, id: number) => {
    requirePermission('settings.users');
    const acct = db.prepare('SELECT ea.id, e.roleId, r.name as roleName FROM employee_accounts ea LEFT JOIN employees e ON ea.employeeId = e.id LEFT JOIN employee_roles r ON e.roleId = r.id WHERE ea.id = ?').get(id) as any;
    if (!acct) return { success: false, error: 'Account not found' };
    if (acct.roleName === 'Owner') return { success: false, error: 'Cannot force PIN change for Owner role' };
    db.prepare('UPDATE employee_accounts SET forcePasswordChange = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    db.prepare('INSERT INTO pin_history (entityType, entityId, action, performedBy, performedById, details) VALUES (?, ?, ?, ?, ?, ?)')
      .run('employee_account', id, 'force_pin_change', currentUserName || 'unknown', null, `Forced PIN change`);
    insertAuditLog('force_pin_change', 'employee_account', id, 'forcePasswordChange', '0', '1', `Force PIN change set for account #${id} by ${currentUserName || 'unknown'}`);
    return { success: true };
  });

  ipcMain.handle('get-pin-history', (_, entityType?: string, entityId?: number) => {
    let query = 'SELECT * FROM pin_history';
    const params: any[] = [];
    if (entityType && entityId) {
      query += ' WHERE entityType = ? AND entityId = ?';
      params.push(entityType, entityId);
    }
    query += ' ORDER BY createdAt DESC LIMIT 100';
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('login-employee', (_, username: string, pin: string) => {
    const account = db.prepare(`
      SELECT ea.*, e.firstName, e.lastName, e.id as employeeId, e.roleId,
        e.businessId as employeeBusinessId,
        e.role_key as roleKey, e.permissions_json as permissionsJson,
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
        db.prepare('UPDATE employee_accounts SET failedLoginAttempts = ?, lockedUntil = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(attempts, lockUntil, account.id);
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
    currentUserRole = account.roleName || 'employee';
    const rolePerms: string[] = account.rolePermissions ? JSON.parse(account.rolePermissions) : [];
    currentUserPermissions = rolePerms.length > 0 ? rolePerms : ['*'];
    currentUserBusinessId = account.employeeBusinessId ?? null;
    currentUserSharedPerms = resolveSharedPermissions(account.roleKey, account.permissionsJson);
    if (currentUserBusinessId) setActiveBusinessId(currentUserBusinessId);
    return {
      id: account.employeeId,
      accountId: account.id,
      username: account.username,
      firstName: account.firstName,
      lastName: account.lastName,
      businessId: account.employeeBusinessId ?? null,
      roleName: account.roleName,
      roleId: account.roleId,
      permissions: account.rolePermissions ? JSON.parse(account.rolePermissions) : [],
      roleKey: account.roleKey || null,
      sharedPermissions: currentUserSharedPerms,
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
    const offset = options?.offset ?? 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(listLimit, offset);
    return db.prepare(query).all(...params);
  });

  // ========== ATTENDANCE ==========
  ipcMain.handle('clock-in', (_, employeeId: number, notes?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    const existing = db.prepare('SELECT id FROM attendance WHERE employeeId = ? AND date = ?').get(employeeId, today) as any;
    if (existing) throw new Error('Already clocked in today');
    const result = db.prepare('INSERT INTO attendance (employeeId, date, clockIn, status, notes) VALUES (?, ?, ?, ?, ?)').run(employeeId, today, now, 'present', notes || null);
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
  });

  ipcMain.handle('get-attendance', (_, options?: any) => {
    let query = `
      SELECT a.*, e.firstName, e.lastName, e.employeeCode, e.avatar as avatar, r.name as roleName
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
    const offset = options?.offset ?? 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(listLimit, offset);
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-today-attendance', () => {
    const today = new Date().toISOString().split('T')[0];
    return db.prepare(`
      SELECT a.*, e.firstName, e.lastName, e.employeeCode, e.avatar as avatar, r.name as roleName
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
    const offset = options?.offset ?? 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(listLimit, offset);
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('update-employee-performance', (_, data: any) => {
    requirePermission('employees.edit');
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

  // ========== SHIPMENTS ==========
  ipcMain.handle('get-shipments', (_, options?: any) => {
    requirePermission('shipments');
    let query = `SELECT * FROM shipments WHERE businessId = ?`;
    const params: any[] = [getActiveBusinessId()];
    if (options?.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }
    if (options?.search) {
      query += ' AND (LOWER(destination) LIKE LOWER(?) OR LOWER(driverName) LIKE LOWER(?) OR LOWER(notes) LIKE LOWER(?))';
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
    const offset = options?.offset ?? 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(listLimit, offset);
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-shipment', (_, id: number) => {
    requirePermission('shipments');
    const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(id);
    const items = db.prepare('SELECT * FROM shipment_items WHERE shipmentId = ?').all(id);
    const history = db.prepare('SELECT * FROM shipment_history WHERE shipmentId = ? ORDER BY createdAt DESC').all(id);
    return { ...(shipment as any), items, history };
  });

  ipcMain.handle('insert-shipment', (_, data: any) => {
    requirePermission('shipments');
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
    requirePermission('shipments');
    return db.prepare(`
      UPDATE shipments SET origin = ?, destination = ?, driverName = ?, driverPhone = ?,
        vehicleInfo = ?, notes = ?, scheduledDate = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.origin || null, data.destination, data.driverName || null, data.driverPhone || null,
      data.vehicleInfo || null, data.notes || null, data.scheduledDate || null, id);
  });

  ipcMain.handle('update-shipment-status', (_, id: number, status: string, changedBy?: string, notes?: string) => {
    requirePermission('shipments');
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
    requirePermission('shipments');
    return db.prepare('DELETE FROM shipments WHERE id = ?').run(id);
  });

  ipcMain.handle('get-shipment-history', (_, shipmentId: number) => {
    requirePermission('shipments');
    return db.prepare('SELECT * FROM shipment_history WHERE shipmentId = ? ORDER BY createdAt DESC').all(shipmentId);
  });

  // ========== SUPPLIERS ==========
  ipcMain.handle('get-suppliers', (_, options: any = {}) => {
    requirePermission('suppliers.view');
    const bizId = getActiveBusinessId();
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    const search = options.search ? `%${options.search}%` : null;
    const status = options.status || null;

    let where = 's.businessId = ?';
    const params: any[] = [bizId];
    if (search) {
      where += ' AND (LOWER(s.supplierName) LIKE LOWER(?) OR LOWER(s.companyName) LIKE LOWER(?) OR LOWER(s.phone) LIKE LOWER(?) OR LOWER(s.email) LIKE LOWER(?))';
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
    requirePermission('suppliers.view');
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
    requirePermission('suppliers.add');
    const name = data.supplierName?.trim();
    if (!name) throw new Error('Supplier name is required');
    if (name.length > 200) throw new Error('Supplier name must be 200 characters or less');
    const phone = data.phone ? String(data.phone).trim() : '';
    if (phone.length > 30) throw new Error('Phone must be 30 characters or less');
    if (phone && phone.length > 0 && (phone.length < 7 || phone.length > 20 || !/^[+\d\s\-\(\)]+$/.test(phone))) {
      throw new Error('Invalid phone number');
    }
    if (data.email && data.email.trim()) {
      const email = data.email.trim();
      if (email.length > 100) throw new Error('Email must be 100 characters or less');
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
    return { id: res.lastInsertRowid };
  });

  ipcMain.handle('update-supplier', (_, id: number, data: any) => {
    requirePermission('suppliers.add');
    const name = data.supplierName?.trim();
    if (!name) throw new Error('Supplier name is required');
    if (name.length > 200) throw new Error('Supplier name must be 200 characters or less');
    const phone = data.phone ? String(data.phone).trim() : '';
    if (phone.length > 30) throw new Error('Phone must be 30 characters or less');
    if (phone && phone.length > 0 && (phone.length < 7 || phone.length > 20 || !/^[+\d\s\-\(\)]+$/.test(phone))) {
      throw new Error('Invalid phone number');
    }
    if (data.email && data.email.trim()) {
      const email = data.email.trim();
      if (email.length > 100) throw new Error('Email must be 100 characters or less');
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
    return { success: true };
  });

  ipcMain.handle('archive-supplier', (_, id: number) => {
    db.prepare('UPDATE suppliers SET isActive = 0, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
      .run('inactive', id);
    const sup = db.prepare('SELECT supplierName FROM suppliers WHERE id = ?').get(id) as any;
    return { success: true };
  });

  ipcMain.handle('restore-supplier', (_, id: number) => {
    db.prepare('UPDATE suppliers SET isActive = 1, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
      .run('active', id);
    const sup = db.prepare('SELECT supplierName FROM suppliers WHERE id = ?').get(id) as any;
    return { success: true };
  });

  ipcMain.handle('delete-supplier', (_, id: number) => {
    const purchases = db.prepare('SELECT COUNT(*) AS c FROM supplier_purchases WHERE supplierId = ?').get(id) as any;
    if (purchases.c > 0) throw new Error('Cannot delete supplier with existing purchases. Archive instead.');
    const sup = db.prepare('SELECT supplierName FROM suppliers WHERE id = ?').get(id) as any;
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
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
    requirePermission('purchases.create');
    if (!data.purchaseDate) throw new Error('Purchase date is required');
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('At least one item is required');
    }
    const totalAmount = validateNonNegative(data.totalAmount, 'Total amount');
    const purchaseNumber = data.purchaseNumber || `PO-${Date.now().toString().slice(-8)}`;
    const bizId = getActiveBusinessId();

    // Resolve the supplier: by id when provided, otherwise by name (creating a
    // new supplier on the fly when the name isn't one of the saved suppliers).
    let supplierId = Number(data.supplierId) || 0;
    const supplierName = data.supplierName ? String(data.supplierName).trim() : '';
    if (supplierId) {
      const s = db.prepare('SELECT id FROM suppliers WHERE id = ?').get(supplierId) as any;
      if (!s) throw new Error('Supplier not found. Please pick a valid supplier.');
    } else {
      if (!supplierName) throw new Error('Supplier is required');
      const existing = db.prepare('SELECT id FROM suppliers WHERE businessId = ? AND LOWER(supplierName) = LOWER(?)').get(bizId, supplierName) as any
        || db.prepare('SELECT id FROM suppliers WHERE LOWER(supplierName) = LOWER(?)').get(supplierName) as any;
      if (existing) {
        supplierId = existing.id;
      } else {
        const code = `SUP-${Date.now().toString().slice(-7)}`;
        const res = db.prepare('INSERT INTO suppliers (businessId, supplierCode, supplierName, status, isActive) VALUES (?, ?, ?, ?, 1)')
          .run(bizId, code, supplierName, 'active');
        supplierId = Number(res.lastInsertRowid);
      }
    }

    const defWhId = getDefaultWarehouseId();
    const insertPurchase = db.transaction(() => {
      const res = db.prepare(`
        INSERT INTO supplier_purchases (
          businessId, supplierId, purchaseNumber, purchaseDate,
          totalAmount, paidAmount, dueDate, status, notes, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        bizId, supplierId, purchaseNumber, data.purchaseDate,
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
        // Auto-update inventory: only for items that actually exist (custom/free-text
        // PO lines carry a null itemId and must not reference a fake id).
        if (it.itemId) {
          const realItem = db.prepare('SELECT id FROM items WHERE id = ?').get(it.itemId) as any;
          if (realItem) {
            updateItemStock.run(qty, data.purchaseDate, price, it.itemId);
            upsertWh.run(defWhId, it.itemId, qty, qty);
            insertSm.run(defWhId, it.itemId, 'purchase_in', qty, purchaseId, 'supplier_purchase', `Purchase ${purchaseNumber} - ${it.itemName}`);
          }
        }
      }
      return purchaseId;
    });
    const id = insertPurchase();
    logSupplierActivity(supplierId, 'purchase_created', 'supplier_purchase', id, `Purchase ${purchaseNumber} created for $${totalAmount}`);
    try {
      db.prepare(`INSERT INTO notifications (businessId, type, category, title, message, severity) VALUES (?, ?, ?, ?, ?, ?)`)
        .run(bizId, 'purchase_created', 'suppliers', 'New Purchase Created', `Purchase ${purchaseNumber} for supplier #${supplierId}`, 'info');
    } catch (_) {}
    return { id };
  });

  ipcMain.handle('update-supplier-purchase-status', (_, id: number, status: string, notes?: string) => {
    requirePermission('purchases.create');
    const validStatuses = ['draft', 'pending', 'approved', 'ordered', 'received', 'cancelled'];
    if (!validStatuses.includes(status)) throw new Error('Invalid status');
    const prev = db.prepare('SELECT status, supplierId FROM supplier_purchases WHERE id = ?').get(id) as any;
    if (!prev) throw new Error('Purchase not found');
    const prevStatus = prev.status;
    db.prepare('UPDATE supplier_purchases SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
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
    requirePermission('purchases.create');
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
    requirePermission('purchases.edit');
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
    logSupplierActivity(data.supplierId, 'payment_recorded', 'supplier_payment', Number(id), `Payment of ${amount} recorded via ${data.paymentMethod}`);
    return { id };
  });

  ipcMain.handle('update-supplier-payment', (_, id: number, data: any) => {
    requirePermission('purchases.edit');
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
    return { success: true };
  });

  ipcMain.handle('delete-supplier-payment', (_, id: number) => {
    requirePermission('purchases.edit');
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
    requirePermission('suppliers.edit');
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
    requirePermission('sales.create');
    const bizId = getActiveBusinessId();
    try {
      JSON.parse(JSON.stringify(data.items));
    } catch {
      throw new Error('Invalid items data: must be valid JSON');
    }
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
    requirePermission('sales.create');
    const bizId = getActiveBusinessId();
    return db.prepare('DELETE FROM draft_sales WHERE id = ? AND businessId = ?').run(id, bizId);
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
    requirePermission('purchases.create');
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
    requirePermission('purchases.create');
    const bizId = getActiveBusinessId();
    return db.prepare('DELETE FROM supplier_price_checks WHERE id = ? AND businessId = ?').run(id, bizId);
  });

  // ========== QUIET HOURS ==========
  ipcMain.handle('get-quiet-hours', () => {
    const bizId = getActiveBusinessId();
    return db.prepare('SELECT * FROM notification_quiet_hours WHERE businessId = ?').all(bizId);
  });

  ipcMain.handle('set-quiet-hours', (_, data: any) => {
    requirePermission('settings.manage');
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
    requirePermission('settings.manage');
    const bizId = getActiveBusinessId();
    return db.prepare('DELETE FROM notification_quiet_hours WHERE businessId = ?').run(bizId);
  });

  function escapeHtml(s: any): string {
    const str = String(s ?? '');
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  ipcMain.handle('print-receipt', async (_e, sale: any) => {
    try {
      const cfg = getPrinterConfig();
      if (cfg.transport === 'network') {
        const bizId = getActiveBusinessId();
        const biz = db.prepare('SELECT businessName, address FROM businesses WHERE id = ?').get(bizId) as any;
        const tinRow = db.prepare("SELECT value FROM settings WHERE key = 'tin'").get() as any;
        const unitPrice = sale.quantity ? sale.totalPrice / sale.quantity : sale.totalPrice;
        const paid = sale.paidAmount || sale.totalPrice;
        const change = sale.paymentMethod === 'Cash' && sale.paymentStatus !== 'Debt' && paid > sale.totalPrice ? paid - sale.totalPrice : 0;
        const commands = buildReceiptCommands({
          paperWidth: cfg.paperWidth,
          lines: [{ name: sale.itemName || 'Item', quantity: sale.quantity, unit: sale.unit || 'pcs', unitPrice, total: sale.totalPrice }],
          subtotal: sale.totalPrice + (sale.discount || 0) - (sale.vat || 0),
          discount: sale.discount || 0,
          vat: sale.vat || 0,
          taxType: sale.taxType || 'VAT',
          total: sale.totalPrice,
          paid,
          change,
          paymentMethod: sale.paymentMethod || 'Cash',
          paymentStatus: sale.paymentStatus || 'Paid',
          customerName: sale.customerName,
          createdAt: sale.createdAt,
          context: {
            businessName: biz?.businessName || 'Shega',
            address: biz?.address,
            tin: tinRow ? tinRow.value : undefined,
            cashier: currentUserName || undefined,
            receiptSerial: sale.id,
          },
        });
        await printRaw(commands);
        if (cfg.autoOpenDrawer && sale.paymentMethod === 'Cash' && sale.paymentStatus !== 'Debt') {
          await openDrawer();
        }
        return { success: true, transport: 'network' };
      }
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

  // --- Peripherals (Phase 2) ---
  ipcMain.handle('open-cash-drawer', async () => {
    try {
      await openDrawer();
      insertAuditLog('cash_drawer', 'register', null, null, null, 'open', `Drawer opened by ${currentUserName || 'unknown'}`);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('barcode-png', async (_e, value: string) => {
    try {
      const { barcodePng } = await import('@shega/shared');
      const png = barcodePng(value);
      if (!png) return { success: false, error: 'Cannot encode barcode value' };
      const { dialog } = await import('electron');
      const { BrowserWindow } = await import('electron');
      const win = BrowserWindow.getAllWindows()[0];
      const res = await dialog.showSaveDialog(win, {
        defaultPath: `${value.replace(/[^0-9A-Za-z\-]/g, '_')}.png`,
        filters: [{ name: 'PNG image', extensions: ['png'] }],
      });
      if (res.canceled || !res.filePath) return { success: false, canceled: true };
      const fs = await import('fs');
      fs.writeFileSync(res.filePath, Buffer.from(png));
      return { success: true, path: res.filePath };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('barcode-png-dataurl', async (_e, value: string) => {
    try {
      const { barcodePng } = await import('@shega/shared');
      const png = barcodePng(value);
      if (!png) return { success: false, error: 'Cannot encode barcode value' };
      return { success: true, dataUrl: 'data:image/png;base64,' + Buffer.from(png).toString('base64') };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('simulate-scan', async (_e, code?: string) => {
    try {
      const value = code && code.trim() ? code.trim() : String(Math.floor(100000000000 + Math.random() * 899999999999));
      const win = (await import('electron')).BrowserWindow.getAllWindows()[0];
      win?.webContents.executeJavaScript(
        `window.dispatchEvent(new CustomEvent('shega:barcode-scan', { detail: ${JSON.stringify(value)} }))`,
      );
      return { success: true, value };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('print-test-page', async () => {
    try {
      await printRaw(buildTestPageCommands(getPrinterConfig().paperWidth));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('print-label', async (_e, label: { name: string; sku?: string; barcode?: string; price: number; barcodeType?: 'ean13' | 'code128'; copies?: number }) => {
    try {
      await printRaw(buildLabelCommands(label, label?.copies || 1));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('get-print-status', async () => {
    const status = getPrintStatus();
    if (status.enabled && status.transport === 'network') status.online = await probePrinter();
    return status;
  });

  ipcMain.handle('set-printer-config', (_e, cfg: any) => {
    return savePrinterConfig(cfg);
  });

  ipcMain.handle('parse-scale-reading', (_e, line: string, config?: ScaleConfig) => {
    return parseWeightLine(line);
  });

  // --- Sync (Phase 3) ---
  ipcMain.handle('sync:status', () => {
    const now = Date.now();
    const peers = (db.prepare('SELECT device_id, name, last_seen_at, created_at FROM devices ORDER BY created_at').all() as any[]).map((p) => {
      const cursor = db.prepare('SELECT last_seq, updated_at FROM sync_cursor WHERE device_id = ?').get(p.device_id) as any;
      return {
        deviceId: p.device_id,
        name: p.name,
        lastSeenAt: p.last_seen_at,
        cursorSeq: cursor?.last_seq ?? 0,
        lastSyncAt: cursor?.updated_at ?? null,
        stale: p.last_seen_at ? (now - new Date(p.last_seen_at).getTime()) > 24 * 3600 * 1000 : true
      };
    });
    return {
      running: syncHub.isRunning(),
      hubId: syncHub.getDeviceId(),
      pairingToken: getPairingToken(),
      lanUrl: getLanAddress(5757),
      port: 5757,
      peers,
      lastSeq: (db.prepare('SELECT COALESCE(MAX(seq),0) AS m FROM sync_outbox').get() as any).m,
      pendingOutbox: (db.prepare('SELECT COUNT(*) AS c FROM sync_outbox').get() as any).c,
      conflicts: (db.prepare("SELECT COUNT(*) AS c FROM sync_log WHERE detail = 'conflict_rejected' OR detail LIKE 'checksum_mismatch'").get() as any).c
    };
  });

  ipcMain.handle('sync:verify', () => {
    return verifyChecksums();
  });

  ipcMain.handle('sync:resync', (_e, deviceId: string) => {
    if (!deviceId) return { ok: false, error: 'device_id required' };
    requestDeviceResync(deviceId);
    return { ok: true };
  });

  ipcMain.handle('sync:log', (_e, limit = 100) => {
    const rows = db.prepare('SELECT device_id, entity, entity_uuid, op, detail, created_at FROM sync_log ORDER BY id DESC LIMIT ?').all(limit) as any[];
    return rows;
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
      const bizId = getActiveBusinessId();
      const biz = db.prepare('SELECT businessName FROM businesses WHERE id = ?').get(bizId) as any;
      const bizName = (biz?.businessName || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
      const backupName = `shega-backup-${bizName}-${timestamp}.db`;
      const backupPath = path.join(backupDir, backupName);
      db.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`);
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

      const check = validateDBFile(backupPath);
      if (!check.ok) return { success: false, error: `Backup failed integrity check: ${check.message}` };

      // Flush WAL to main file, then close the live connection so the
      // database file is not locked during the copy (avoids EBUSY on Windows).
      db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
      reopenDB();
      copyFileSync(backupPath, db.name);
      reopenDB();

      const verify = validateDBFile(db.name);
      if (!verify.ok) {
        return { success: false, error: `Restored database failed integrity check: ${verify.message}` };
      }
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

  ipcMain.handle('void-sale', async (event, data: { saleId: number; reason: string }) => {
    requirePermission('sales.void');
    const reason = (data?.reason || '').trim();
    if (!reason) throw new Error('A reason is required to void a sale');
    if (!(await gateSensitiveAction(event.sender, { context: `Void sale #${data.saleId}` }))) {
      throw new Error('Manager approval required — action not executed');
    }
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
          packRestore = Math.round((sale.quantity / (item.unitsPerPack || 1)) * 1e6) / 1e6;
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
    insertAuditLog('void_sale', 'sale', data.saleId, 'status', 'Active', 'Voided', `Sale #${data.saleId} voided by ${currentUserName || 'unknown'}. Reason: ${data.reason}`);
    return db.prepare('SELECT * FROM sales WHERE id = ?').get(data.saleId);
  });

  ipcMain.handle('reverse-debt-payment', async (event, data: { paymentId: number; reason: string }) => {
    requirePermission('payments.reverse');
    if (!(await gateSensitiveAction(event.sender, { context: `Reverse debt payment #${data.paymentId}` }))) {
      throw new Error('Manager approval required — action not executed');
    }
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
    insertAuditLog('reverse_debt_payment', 'debt_payment', data.paymentId, 'reversalId', null, String(data.paymentId), `Debt payment #${data.paymentId} reversed by ${currentUserName || 'unknown'}. Reason: ${data.reason}`);
    return { success: true };
  });

  ipcMain.handle('reverse-supplier-payment', async (event, data: { paymentId: number; reason: string }) => {
    requirePermission('payments.reverse');
    if (!(await gateSensitiveAction(event.sender, { context: `Reverse supplier payment #${data.paymentId}` }))) {
      throw new Error('Manager approval required — action not executed');
    }
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
    insertAuditLog('reverse_supplier_payment', 'supplier_payment', data.paymentId, 'reversalId', null, String(data.paymentId), `Supplier payment #${data.paymentId} reversed by ${currentUserName || 'unknown'}. Reason: ${data.reason}`);
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
    const offset = options?.offset ?? 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(listLimit, offset);

    return db.prepare(query).all(...params);
  });

  ipcMain.handle('verify-audit-chain', () => {
    requirePermission('audit.view');
    return verifyAuditChain(db);
  });

  ipcMain.handle('archive-item', (_, data: { id: number }) => {
    requirePermission('inventory.delete');
    const item = db.prepare('SELECT name FROM items WHERE id = ?').get(data.id) as any;
    db.prepare('UPDATE items SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(currentUserName || 'unknown', data.id);
    return { success: true };
  });

  ipcMain.handle('restore-item', (_, data: { id: number }) => {
    requirePermission('records.restore');
    const item = db.prepare('SELECT name FROM items WHERE id = ?').get(data.id) as any;
    db.prepare('UPDATE items SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL WHERE id = ?').run(data.id);
    insertAuditLog('restore_item', 'item', data.id, 'is_deleted', '1', '0', `Item #${data.id} "${item?.name || 'unknown'}" restored by ${currentUserName || 'unknown'}`);
    return { success: true };
  });

  ipcMain.handle('archive-customer', (_, data: { id: number }) => {
    requirePermission('customers.delete');
    const bizId = getActiveBusinessId();
    db.prepare("UPDATE customers SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(currentUserName || 'unknown', data.id, bizId);
    return { success: true };
  });

  ipcMain.handle('restore-customer', (_, data: { id: number }) => {
    requirePermission('records.restore');
    const bizId = getActiveBusinessId();
    db.prepare("UPDATE customers SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND businessId = ?").run(data.id, bizId);
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

  ipcMain.handle('reverse-audit-log-entry', (_, data: { logId: number }) => {
    requirePermission('audit.view');
    const entry = db.prepare('SELECT * FROM audit_logs WHERE id = ? AND businessId = ?').get(data.logId, getActiveBusinessId()) as any;
    if (!entry) throw new Error('Audit log entry not found');
    if (entry.reversedAt) throw new Error('This change has already been reversed');

    const reverseAction = (newAction: string, description: string) => {
      db.prepare('UPDATE audit_logs SET reversedAt = CURRENT_TIMESTAMP, reversedBy = ? WHERE id = ?').run(currentUserName || 'unknown', entry.id);
      insertAuditLog(newAction, entry.entityType, entry.entityId, entry.fieldName, entry.newValue, entry.oldValue, description);
    };

    // Handle field-level updates (generic reverse: set field back to oldValue)
    if (entry.fieldName && entry.oldValue !== null && ['update', 'insert'].includes(entry.action)) {
      const tableMap: Record<string, string> = { item: 'items', customer: 'customers', sale: 'sales', supplier: 'suppliers', expense: 'expenses', adjustment: 'adjustments' };
      const table = tableMap[entry.entityType];
      if (table && entry.entityId) {
        db.prepare(`UPDATE ${table} SET ${entry.fieldName} = ? WHERE id = ?`).run(entry.oldValue, entry.entityId);
        reverseAction('reverse_field_update', `Reversed field ${entry.fieldName} on ${entry.entityType} #${entry.entityId} from '${entry.newValue}' back to '${entry.oldValue}'`);
        return { success: true };
      }
    }

    // Handle soft-delete/archive → restore
    if ((entry.action === 'soft_delete' || entry.action === 'archive') && entry.entityType === 'item') {
      db.prepare('UPDATE items SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL WHERE id = ?').run(entry.entityId);
      reverseAction('restore_item', `Item #${entry.entityId} restored via audit log reversal`);
      return { success: true };
    }
    if ((entry.action === 'soft_delete' || entry.action === 'archive') && entry.entityType === 'customer') {
      db.prepare('UPDATE customers SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL WHERE id = ?').run(entry.entityId);
      reverseAction('restore_customer', `Customer #${entry.entityId} restored via audit log reversal`);
      return { success: true };
    }

    // Handle restore → re-soft-delete
    if ((entry.action === 'restore_item' || entry.action === 'restore') && entry.entityType === 'item') {
      db.prepare('UPDATE items SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(currentUserName || 'unknown', entry.entityId);
      reverseAction('soft_delete', `Item #${entry.entityId} re-deleted via audit log reversal`);
      return { success: true };
    }
    if ((entry.action === 'restore_customer' || entry.action === 'restore') && entry.entityType === 'customer') {
      db.prepare('UPDATE customers SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(currentUserName || 'unknown', entry.entityId);
      reverseAction('soft_delete', `Customer #${entry.entityId} re-deleted via audit log reversal`);
      return { success: true };
    }

    throw new Error('This action type cannot be automatically reversed from audit logs. Please use the relevant page to undo this change.');
  });

  ipcMain.handle('get-reversal-stats', () => {
    const bizId = getActiveBusinessId();
    const voidedSales = (db.prepare("SELECT COUNT(*) as count FROM sales WHERE businessId = ? AND status = 'Voided'").get(bizId) as any).count;
    const reversedPayments = (db.prepare('SELECT COUNT(*) as count FROM debt_payments dp JOIN sales s ON dp.saleId = s.id WHERE s.businessId = ? AND dp.reversalId IS NOT NULL').get(bizId) as any).count;
    const reversedSupplierPayments = (db.prepare('SELECT COUNT(*) as count FROM supplier_payments WHERE businessId = ? AND reversalId IS NOT NULL').get(bizId) as any).count;
    const reversedAdjustments = (db.prepare('SELECT COUNT(*) as count FROM adjustments WHERE businessId = ? AND reversalId IS NOT NULL').get(bizId) as any).count;
    return { voidedSales, reversedPayments, reversedSupplierPayments, reversedAdjustments };
  });

  // ========== ORDER MANAGEMENT ==========

  ipcMain.handle('get-orders', (_, options: any = {}) => {
    requirePermission('orders.view');
    const bizId = getActiveBusinessId();
    let query = 'SELECT * FROM orders WHERE businessId = ? AND is_deleted = 0';
    const params: any[] = [bizId];

    if (options.search) {
      query += ' AND (LOWER(orderNumber) LIKE LOWER(?) OR LOWER(customerName) LIKE LOWER(?) OR LOWER(customerPhone) LIKE LOWER(?))';
      params.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
    }

    if (options.status && options.status !== 'All') {
      query += ' AND status = ?';
      params.push(options.status);
    }

    if (options.startDate && options.endDate) {
      if (options.startDate === options.endDate) {
        query += ' AND createdAt >= ? AND createdAt < ?';
        params.push(options.startDate, options.startDate + 'T23:59:59.999Z');
      } else {
        query += ' AND createdAt >= ? AND createdAt <= ?';
        params.push(options.startDate, options.endDate + 'T23:59:59.999Z');
      }
    } else if (options.startDate) {
      query += ' AND createdAt >= ?';
      params.push(options.startDate);
    } else if (options.endDate) {
      query += ' AND createdAt <= ?';
      params.push(options.endDate + 'T23:59:59.999Z');
    }

    query += ' ORDER BY createdAt DESC';

    const listLimit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(listLimit, offset);

    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-order', (_, id: number) => {
    requirePermission('orders.view');
    const bizId = getActiveBusinessId();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND businessId = ? AND is_deleted = 0').get(id, bizId) as any;
    if (!order) return null;
    const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(id);
    const history = db.prepare('SELECT * FROM order_history WHERE orderId = ? ORDER BY createdAt ASC').all(id);
    return { ...order, items, history };
  });

  ipcMain.handle('insert-order', (_, data: { customerName?: string; customerPhone?: string; notes?: string; orderNumber?: string; items: { itemId: number; itemName: string; quantity: number; unit: string; unitType: string; unitPrice: number }[] }) => {
    requirePermission('orders.create');
    const bizId = getActiveBusinessId();
    if (!data.items || data.items.length === 0) throw new Error('Order must have at least one item');

    const orderNumber = data.orderNumber || `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    let totalAmount = 0;
    for (const item of data.items) {
      validatePositive(item.quantity, 'Item quantity');
      validateNonNegative(item.unitPrice, 'Unit price');
      totalAmount += item.quantity * item.unitPrice;
    }

    const transaction = db.transaction(() => {
      const orderResult = db.prepare(`
        INSERT INTO orders (businessId, orderNumber, customerName, customerPhone, notes, status, totalAmount, createdBy, createdByName, createdAt)
        VALUES (?, ?, ?, ?, ?, 'Order', ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(bizId, orderNumber, data.customerName || null, data.customerPhone || null, data.notes || null, totalAmount, null, currentUserName || 'unknown');

      const orderId = orderResult.lastInsertRowid as number;

      const itemStmt = db.prepare(`
        INSERT INTO order_items (orderId, itemId, itemName, quantity, unit, unitType, unitPrice, totalPrice)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of data.items) {
        itemStmt.run(orderId, item.itemId || null, item.itemName, item.quantity, item.unit || 'pcs', item.unitType || 'base', item.unitPrice, item.quantity * item.unitPrice);
      }

      db.prepare('INSERT INTO order_history (orderId, action, performedBy, notes) VALUES (?, ?, ?, ?)').run(orderId, 'created', currentUserName || 'unknown', 'Order created');

      return orderId;
    });

    const orderId = transaction();
    return orderId;
  });

  ipcMain.handle('convert-order-to-sale', (_, data: { orderId: number; paymentMethod?: string; discount?: number; vat?: number }) => {
    requirePermission('orders.convert');
    data = validate(orderConversionSchema, data, 'order conversion');
    const bizId = getActiveBusinessId();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND businessId = ? AND is_deleted = 0').get(data.orderId, bizId) as any;
    if (!order) throw new Error('Order not found');
    if (order.status !== 'Order') throw new Error('Only orders with status "Order" can be converted');

    const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(data.orderId) as any[];

    const transaction = db.transaction(() => {
      const saleIds: number[] = [];
      for (const item of items) {
        const dbItem = db.prepare('SELECT * FROM items WHERE id = ?').get(item.itemId) as any;
        if (!dbItem) throw new Error(`Item "${item.itemName}" not found in inventory`);

        const qty = item.quantity;
        let baseDeduction = qty;
        let packDeduction = 0;

        if (item.unitType === 'pack') {
          baseDeduction = qty * (dbItem.unitsPerPack || 1);
          packDeduction = qty;
        } else {
          packDeduction = Math.round((qty / (dbItem.unitsPerPack || 1)) * 1e6) / 1e6;
        }

        const itemResult = db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity - ?, totalPackQuantity = totalPackQuantity - ? WHERE id = ? AND totalBaseQuantity >= ?').run(baseDeduction, packDeduction, item.itemId, baseDeduction);
        if (itemResult.changes === 0) throw new Error(`Insufficient stock: ${dbItem.name} has less than ${baseDeduction} units available`);

        const itemDiscount = data.discount ? (item.totalPrice / order.totalAmount) * data.discount : 0;
        const itemVat = data.vat ? (item.totalPrice / order.totalAmount) * data.vat : 0;
        const finalPrice = item.totalPrice - itemDiscount + itemVat;

        const saleResult = db.prepare(`
          INSERT INTO sales (businessId, itemId, quantity, unit, unitType, discount, vat, totalPrice, paymentMethod, paymentStatus, customerName, customerPhone, createdBy)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid', ?, ?, ?)
        `).run(bizId, item.itemId, qty, item.unit || 'pcs', item.unitType || 'base', itemDiscount, itemVat, finalPrice, data.paymentMethod || 'Cash', order.customerName || null, order.customerPhone || null, null);

        saleIds.push(saleResult.lastInsertRowid as number);

        const defWhId = getDefaultWarehouseId();
        const whResult = db.prepare('UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE warehouseId = ? AND itemId = ? AND quantity >= ?').run(baseDeduction, defWhId, item.itemId, baseDeduction);
        if (whResult.changes === 0) {
          const whExists = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, item.itemId);
          if (!whExists) {
            db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(defWhId, item.itemId, -baseDeduction);
          } else {
            throw new Error(`Insufficient stock at warehouse: ${dbItem.name} has less than ${baseDeduction} units available`);
          }
        }
        db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)').run(defWhId, item.itemId, 'sale_out', baseDeduction, 'order_conversion', `Converted from order ${order.orderNumber}`);
      }

      db.prepare("UPDATE orders SET status = 'Converted', convertedAt = CURRENT_TIMESTAMP, convertedBy = ? WHERE id = ?").run(currentUserName || 'unknown', data.orderId);
      db.prepare('INSERT INTO order_history (orderId, action, performedBy, notes) VALUES (?, ?, ?, ?)').run(data.orderId, 'converted_to_sale', currentUserName || 'unknown', `Converted to sale(s): ${saleIds.join(', ')}. Payment: ${data.paymentMethod || 'Cash'}`);

      return { success: true, saleIds };
    });

    const result = transaction();
    insertAuditLog('convert_order_to_sale', 'order', data.orderId, 'status', 'Order', 'Converted', `Order #${data.orderId} converted to sale by ${currentUserName || 'unknown'}`);
    return result;
  });

  ipcMain.handle('convert-order-to-debt', (_, data: { orderId: number; dueDate?: string; paymentMethod?: string; discount?: number; vat?: number }) => {
    requirePermission('orders.convert');
    data = validate(orderConversionSchema, data, 'order conversion');
    const bizId = getActiveBusinessId();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND businessId = ? AND is_deleted = 0').get(data.orderId, bizId) as any;
    if (!order) throw new Error('Order not found');
    if (order.status !== 'Order') throw new Error('Only orders with status "Order" can be converted');

    const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(data.orderId) as any[];

    const cName = order.customerName?.trim();
    if (!cName) throw new Error('Customer name is required for debt conversion');

    const transaction = db.transaction(() => {
      const exists = db.prepare("SELECT id FROM customers WHERE customerName = ? AND businessId = ?").get(cName, bizId);
      if (!exists) {
        db.prepare("INSERT INTO customers (businessId, customerName, phone, groupName) VALUES (?, ?, ?, ?)").run(bizId, cName, order.customerPhone?.trim() || '', 'general');
      }

      const saleIds: number[] = [];
      for (const item of items) {
        const dbItem = db.prepare('SELECT * FROM items WHERE id = ?').get(item.itemId) as any;
        if (!dbItem) throw new Error(`Item "${item.itemName}" not found in inventory`);

        const qty = item.quantity;
        let baseDeduction = qty;
        let packDeduction = 0;

        if (item.unitType === 'pack') {
          baseDeduction = qty * (dbItem.unitsPerPack || 1);
          packDeduction = qty;
        } else {
          packDeduction = Math.round((qty / (dbItem.unitsPerPack || 1)) * 1e6) / 1e6;
        }

        const itemResult = db.prepare('UPDATE items SET totalBaseQuantity = totalBaseQuantity - ?, totalPackQuantity = totalPackQuantity - ? WHERE id = ? AND totalBaseQuantity >= ?').run(baseDeduction, packDeduction, item.itemId, baseDeduction);
        if (itemResult.changes === 0) throw new Error(`Insufficient stock: ${dbItem.name} has less than ${baseDeduction} units available`);

        const itemDiscount = data.discount ? (item.totalPrice / order.totalAmount) * data.discount : 0;
        const itemVat = data.vat ? (item.totalPrice / order.totalAmount) * data.vat : 0;
        const finalPrice = item.totalPrice - itemDiscount + itemVat;

        const saleResult = db.prepare(`
          INSERT INTO sales (businessId, itemId, quantity, unit, unitType, discount, vat, totalPrice, paymentMethod, paymentStatus, customerName, customerPhone, dueDate, paidAmount, createdBy)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Debt', ?, ?, ?, 0, ?)
        `).run(bizId, item.itemId, qty, item.unit || 'pcs', item.unitType || 'base', itemDiscount, itemVat, finalPrice, data.paymentMethod || 'Credit', order.customerName, order.customerPhone || null, data.dueDate || null, null);

        saleIds.push(saleResult.lastInsertRowid as number);

        const defWhId = getDefaultWarehouseId();
        const whResult = db.prepare('UPDATE warehouse_inventory SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE warehouseId = ? AND itemId = ? AND quantity >= ?').run(baseDeduction, defWhId, item.itemId, baseDeduction);
        if (whResult.changes === 0) {
          const whExists = db.prepare('SELECT id FROM warehouse_inventory WHERE warehouseId = ? AND itemId = ?').get(defWhId, item.itemId);
          if (!whExists) {
            db.prepare('INSERT INTO warehouse_inventory (warehouseId, itemId, quantity) VALUES (?, ?, ?)').run(defWhId, item.itemId, -baseDeduction);
          } else {
            throw new Error(`Insufficient stock at warehouse: ${dbItem.name} has less than ${baseDeduction} units available`);
          }
        }
        db.prepare('INSERT INTO stock_movements (warehouseId, itemId, type, quantity, referenceType, notes) VALUES (?, ?, ?, ?, ?, ?)').run(defWhId, item.itemId, 'sale_out', baseDeduction, 'order_debt_conversion', `Converted from order ${order.orderNumber}`);
      }

      db.prepare("UPDATE orders SET status = 'Converted', convertedAt = CURRENT_TIMESTAMP, convertedBy = ? WHERE id = ?").run(currentUserName || 'unknown', data.orderId);
      db.prepare('INSERT INTO order_history (orderId, action, performedBy, notes) VALUES (?, ?, ?, ?)').run(data.orderId, 'converted_to_debt', currentUserName || 'unknown', `Converted to debt sale(s): ${saleIds.join(', ')}. Due: ${data.dueDate || 'Not set'}`);

      return { success: true, saleIds };
    });

    const result = transaction();
    insertAuditLog('convert_order_to_debt', 'order', data.orderId, 'status', 'Order', 'Converted', `Order #${data.orderId} converted to debt by ${currentUserName || 'unknown'}`);
    return result;
  });

  ipcMain.handle('import-data', (_, module: string, rows: any[]) => {
    requirePermission('settings.manage');
    return importData(module, rows);
  });

  ipcMain.handle('cancel-order', (_, data: { orderId: number; reason?: string }) => {
    requirePermission('orders.cancel');
    const bizId = getActiveBusinessId();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND businessId = ? AND is_deleted = 0').get(data.orderId, bizId) as any;
    if (!order) throw new Error('Order not found');
    if (order.status !== 'Order') throw new Error('Only orders with status "Order" can be cancelled');

    db.prepare("UPDATE orders SET status = 'Cancelled', cancelledAt = CURRENT_TIMESTAMP, cancelledBy = ?, cancelReason = ? WHERE id = ?").run(currentUserName || 'unknown', data.reason || null, data.orderId);
    db.prepare('INSERT INTO order_history (orderId, action, performedBy, notes) VALUES (?, ?, ?, ?)').run(data.orderId, 'cancelled', currentUserName || 'unknown', data.reason || 'Cancelled');

    insertAuditLog('cancel_order', 'order', data.orderId, 'status', 'Order', 'Cancelled', `Order #${data.orderId} cancelled by ${currentUserName || 'unknown'}. Reason: ${data.reason || 'N/A'}`);
    return { success: true };
  });

  // ========== GLOBAL SEARCH ==========
  console.log('[Handlers] Registered global-search');

  ipcMain.handle('global-search', (_, query: string) => {
    const bizId = getActiveBusinessId();
    if (!query || query.trim().length < 1) return [];
    const q = `%${query.trim()}%`;
    const results: any[] = [];

    // Verify bizId is valid
    console.log('[Search] bizId:', bizId, 'query:', query);
    console.log('[Search] items count:', (db.prepare('SELECT COUNT(*) as c FROM items WHERE businessId = ?').get(bizId) as any)?.c);
    console.log('[Search] sales count:', (db.prepare('SELECT COUNT(*) as c FROM sales WHERE businessId = ?').get(bizId) as any)?.c);

    // Inventory items
    try {
      const items = db.prepare(`
        SELECT items.id, items.name, items.companyName, items.categoryId, items.totalBaseQuantity, items.baseUnit, items.baseSellingPrice,
          categories.name as categoryName
        FROM items LEFT JOIN categories ON items.categoryId = categories.id
        WHERE items.businessId = ? AND items.is_deleted = 0
          AND (LOWER(items.name) LIKE LOWER(?) OR LOWER(items.companyName) LIKE LOWER(?))
        LIMIT 8
      `).all(bizId, q, q) as any[];
      items.forEach(i => results.push({
        type: 'item', id: i.id, title: i.name,
        subtitle: `${i.companyName || ''} ${i.categoryName ? '· ' + i.categoryName : ''} · ${i.totalBaseQuantity || 0} ${i.baseUnit || 'pcs'}`,
        route: '/inventory', detail: i.id
      }));
    } catch (e) { console.error('[Search]', e); }

    // Sales / Transactions
    try {
      const sales = db.prepare(`
        SELECT s.id, s.totalPrice, s.customerName, s.paymentStatus, s.createdAt, i.name as itemName
        FROM sales s LEFT JOIN items i ON s.itemId = i.id
        WHERE s.businessId = ? AND (LOWER(i.name) LIKE LOWER(?) OR LOWER(s.customerName) LIKE LOWER(?) OR CAST(s.id AS TEXT) LIKE ?)
        LIMIT 8
      `).all(bizId, q, q, q) as any[];
      sales.forEach(s => results.push({
        type: 'sale', id: s.id, title: `#${s.id} · ${s.itemName || 'Item'}`,
        subtitle: `${s.customerName || 'Walk-in'} · ${s.paymentStatus} · ETB ${(s.totalPrice || 0).toLocaleString()}`,
        route: `/sales/${s.id}`, detail: s.id
      }));
    } catch (e) { console.error('[Search]', e); }

    // Customers
    try {
      const customers = db.prepare(`
        SELECT id, customerName, phone, company, groupName
        FROM customers WHERE businessId = ? AND isActive = 1
          AND (LOWER(customerName) LIKE LOWER(?) OR LOWER(phone) LIKE LOWER(?) OR LOWER(company) LIKE LOWER(?))
        LIMIT 8
      `).all(bizId, q, q, q) as any[];
      customers.forEach(c => results.push({
        type: 'customer', id: c.id, title: c.customerName,
        subtitle: `${c.phone || ''} ${c.company ? '· ' + c.company : ''}`,
        route: '/customers', detail: c.id
      }));
    } catch (e) { console.error('[Search]', e); }

    // Suppliers
    try {
      const suppliers = db.prepare(`
        SELECT id, supplierName, companyName, phone, contactPerson
        FROM suppliers WHERE businessId = ? AND isActive = 1
          AND (LOWER(supplierName) LIKE LOWER(?) OR LOWER(companyName) LIKE LOWER(?) OR LOWER(phone) LIKE LOWER(?) OR LOWER(contactPerson) LIKE LOWER(?))
        LIMIT 8
      `).all(bizId, q, q, q, q) as any[];
      suppliers.forEach(s => results.push({
        type: 'supplier', id: s.id, title: s.supplierName,
        subtitle: `${s.companyName || ''} ${s.contactPerson ? '· ' + s.contactPerson : ''}`,
        route: '/suppliers', detail: s.id
      }));
    } catch (e) { console.error('[Search]', e); }

    // Expenses
    try {
      const expenses = db.prepare(`
        SELECT id, name, amount, category, date
        FROM expenses WHERE businessId = ? AND (LOWER(name) LIKE LOWER(?) OR LOWER(category) LIKE LOWER(?))
        LIMIT 8
      `).all(bizId, q, q) as any[];
      expenses.forEach(e => results.push({
        type: 'expense', id: e.id, title: e.name,
        subtitle: `${e.category} · ETB ${(e.amount || 0).toLocaleString()}`,
        route: '/expenses', detail: e.id
      }));
    } catch (e) { console.error('[Search]', e); }

    // Budgets
    try {
      const budgets = db.prepare(`
        SELECT id, category, amount, budgetType, month, year, referenceName
        FROM budgets WHERE businessId = ? AND (LOWER(category) LIKE LOWER(?) OR LOWER(referenceName) LIKE LOWER(?))
        LIMIT 8
      `).all(bizId, q, q) as any[];
      budgets.forEach(b => results.push({
        type: 'budget', id: b.id, title: b.category,
        subtitle: `ETB ${(b.amount || 0).toLocaleString()} · ${b.budgetType}${b.referenceName ? ' · ' + b.referenceName : ''}`,
        route: '/budgets', detail: b.id
      }));
    } catch (e) { console.error('[Search]', e); }

    // Categories
    try {
      const cats = db.prepare(`
        SELECT id, name FROM categories WHERE businessId = ? AND LOWER(name) LIKE LOWER(?)
        LIMIT 8
      `).all(bizId, q) as any[];
      cats.forEach(c => results.push({
        type: 'category', id: c.id, title: c.name,
        subtitle: '',
        route: '/inventory', detail: c.id
      }));
    } catch (e) { console.error('[Search]', e); }

    // Warehouses
    try {
      const whs = db.prepare(`
        SELECT id, name, location, managerName
        FROM warehouses WHERE businessId = ? AND (LOWER(name) LIKE LOWER(?) OR LOWER(location) LIKE LOWER(?) OR LOWER(managerName) LIKE LOWER(?))
        LIMIT 8
      `).all(bizId, q, q, q) as any[];
      whs.forEach(w => results.push({
        type: 'warehouse', id: w.id, title: w.name,
        subtitle: `${w.location || ''} ${w.managerName ? '· ' + w.managerName : ''}`,
        route: '/warehouses', detail: w.id
      }));
    } catch (e) { console.error('[Search]', e); }

    // Supplier Purchases (Purchase Records)
    try {
      const purchases = db.prepare(`
        SELECT sp.id, sp.purchaseNumber, sp.totalAmount, sp.status, s.supplierName
        FROM supplier_purchases sp LEFT JOIN suppliers s ON sp.supplierId = s.id
        WHERE sp.businessId = ? AND (LOWER(sp.purchaseNumber) LIKE LOWER(?) OR LOWER(s.supplierName) LIKE LOWER(?) OR CAST(sp.id AS TEXT) LIKE ?)
        LIMIT 8
      `).all(bizId, q, q, q) as any[];
      purchases.forEach(p => results.push({
        type: 'purchase', id: p.id, title: p.purchaseNumber || `#${p.id}`,
        subtitle: `${p.supplierName || ''} · ETB ${(p.totalAmount || 0).toLocaleString()} · ${p.status || ''}`,
        route: '/suppliers', detail: p.id
      }));
    } catch (e) { console.error('[Search]', e); }

    // Adjustments
    try {
      const adjustments = db.prepare(`
        SELECT a.id, a.type, a.reason, a.quantity, i.name as itemName
        FROM adjustments a LEFT JOIN items i ON a.itemId = i.id
        WHERE a.businessId = ? AND (LOWER(i.name) LIKE LOWER(?) OR LOWER(a.reason) LIKE LOWER(?) OR LOWER(a.type) LIKE LOWER(?))
        LIMIT 8
      `).all(bizId, q, q, q) as any[];
      adjustments.forEach(a => results.push({
        type: 'adjustment', id: a.id, title: `${a.type} · ${a.itemName || ''}`,
        subtitle: `${a.reason || ''} ${a.quantity ? '· Qty: ' + a.quantity : ''}`,
        route: '/adjustments', detail: a.id
      }));
    } catch (e) { console.error('[Search]', e); }

    // Notifications
    try {
      const notifs = db.prepare(`
        SELECT id, title, message, type, severity
        FROM notifications WHERE businessId = ? AND isDismissed = 0
          AND (LOWER(title) LIKE LOWER(?) OR LOWER(message) LIKE LOWER(?))
        LIMIT 8
      `).all(bizId, q, q) as any[];
      notifs.forEach(n => results.push({
        type: 'notification', id: n.id, title: n.title,
        subtitle: n.message || '',
        route: null, detail: n.id
      }));
    } catch (e) { console.error('[Search]', e); }

    // Draft Sales
    try {
      const drafts = db.prepare(`
        SELECT id, customerName, discount, vat, notes
        FROM draft_sales WHERE businessId = ?
          AND (LOWER(customerName) LIKE LOWER(?) OR LOWER(notes) LIKE LOWER(?))
        LIMIT 8
      `).all(bizId, q, q) as any[];
      drafts.forEach(d => results.push({
        type: 'draft', id: d.id, title: d.customerName || 'Unnamed Draft',
        subtitle: `${d.notes || ''}${d.discount ? ' · Discount: ' + d.discount : ''}`,
        route: '/sales', detail: d.id
      }));
    } catch (e) { console.error('[Search]', e); }

    return results.slice(0, 40);
  });

  // ========== BUSINESS HEALTH SCORE ==========
  ipcMain.handle('get-business-health-score', () => {
    const bizId = getActiveBusinessId();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString().split('T')[0];
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000).toISOString().split('T')[0];

    const factors: { name: string; score: number; weight: number; status: 'good' | 'warning' | 'critical'; detail: string }[] = [];
    const recommendations: string[] = [];

    // 1. Sales Performance (weight: 20)
    try {
      const last30Sales = db.prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND DATE(createdAt) <= ? AND businessId = ?"
      ).get(thirtyDaysAgo, today, bizId) as any;
      const prev30Sales = db.prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND DATE(createdAt) < ? AND businessId = ?"
      ).get(sixtyDaysAgo, thirtyDaysAgo, bizId) as any;

      const salesGrowth = prev30Sales.revenue > 0 ? ((last30Sales.revenue - prev30Sales.revenue) / prev30Sales.revenue) * 100 : 0;
      let salesScore = 50;
      if (last30Sales.count > 0 && prev30Sales.count > 0) {
        salesScore = Math.min(100, Math.max(0, 50 + salesGrowth));
      } else if (last30Sales.count > 0) {
        salesScore = 60;
      } else {
        salesScore = 20;
      }
      factors.push({
        name: 'Sales Performance',
        score: Math.round(salesScore),
        weight: 20,
        status: salesScore >= 70 ? 'good' : salesScore >= 40 ? 'warning' : 'critical',
        detail: `${last30Sales.count} transactions, ETB ${(last30Sales.revenue || 0).toLocaleString()} revenue (${salesGrowth >= 0 ? '+' : ''}${salesGrowth.toFixed(1)}% vs prev period)`
      });
      if (salesScore < 40) recommendations.push('Increase sales efforts — revenue is significantly below potential. Consider promotions or new product lines.');
    } catch (e) { console.error('[Search]', e); }

    // 2. Gross Profit Margin (weight: 15)
    try {
      const profitData = db.prepare(`
        SELECT COALESCE(SUM(s.totalPrice - (CASE WHEN s.unitType = 'pack' THEN s.quantity * COALESCE(i.unitsPerPack, 1) ELSE s.quantity END * COALESCE(i.basePurchasePrice, 0))), 0) as grossProfit,
               COALESCE(SUM(s.totalPrice), 0) as revenue
        FROM sales s LEFT JOIN items i ON s.itemId = i.id
        WHERE DATE(s.createdAt) >= ? AND DATE(s.createdAt) <= ? AND s.businessId = ?
      `).get(thirtyDaysAgo, today, bizId) as any;
      const margin = profitData.revenue > 0 ? (profitData.grossProfit / profitData.revenue) * 100 : 0;
      let marginScore = Math.min(100, Math.max(0, (margin / 50) * 100));
      factors.push({
        name: 'Gross Profit Margin',
        score: Math.round(marginScore),
        weight: 15,
        status: margin >= 30 ? 'good' : margin >= 15 ? 'warning' : 'critical',
        detail: `${margin.toFixed(1)}% margin (ETB ${(profitData.grossProfit || 0).toLocaleString()} profit on ETB ${(profitData.revenue || 0).toLocaleString()} revenue)`
      });
      if (margin < 20) recommendations.push('Your gross profit margin is low. Review pricing strategy and negotiate better purchase prices from suppliers.');
    } catch (e) { console.error('[Search]', e); }

    // 3. Inventory Health (weight: 15)
    try {
      const totalItems = db.prepare("SELECT COUNT(*) as count FROM items WHERE businessId = ? AND is_deleted = 0").get(bizId) as any;
      const lowStock = db.prepare("SELECT COUNT(*) as count FROM items WHERE totalBaseQuantity < 10 AND businessId = ? AND is_deleted = 0").get(bizId) as any;
      const outOfStock = db.prepare("SELECT COUNT(*) as count FROM items WHERE totalBaseQuantity <= 0 AND businessId = ? AND is_deleted = 0").get(bizId) as any;

      const healthyRatio = totalItems.count > 0 ? 1 - (lowStock.count / totalItems.count) : 0;
      let invScore = Math.round(healthyRatio * 100);
      factors.push({
        name: 'Inventory Health',
        score: invScore,
        weight: 15,
        status: invScore >= 80 ? 'good' : invScore >= 50 ? 'warning' : 'critical',
        detail: `${lowStock.count} low-stock, ${outOfStock.count} out-of-stock out of ${totalItems.count} products`
      });
      if (lowStock.count > totalItems.count * 0.3) recommendations.push('Too many products are low on stock. Restock popular items and set up automated reorder alerts.');
      if (outOfStock.count > 5) recommendations.push('Several items are completely out of stock. Prioritize restocking best-selling products.');
    } catch (e) { console.error('[Search]', e); }

    // 5. Slow-moving / Dead Stock (weight: 10)
    try {
      const slowMoving = db.prepare(`
        SELECT COUNT(*) as count FROM items i WHERE i.businessId = ? AND i.is_deleted = 0
          AND (SELECT COUNT(*) FROM sales WHERE itemId = i.id AND DATE(createdAt) >= ?) = 0
          AND i.totalBaseQuantity > 0
      `).get(bizId, ninetyDaysAgo) as any;
      const deadStock = db.prepare(`
        SELECT COUNT(*) as count FROM items i WHERE i.businessId = ? AND i.is_deleted = 0
          AND (SELECT COUNT(*) FROM sales WHERE itemId = i.id AND DATE(createdAt) >= ?) = 0
          AND i.totalBaseQuantity > 0
      `).get(bizId, sixtyDaysAgo) as any;

      const totalActive = db.prepare("SELECT COUNT(*) as count FROM items WHERE businessId = ? AND is_deleted = 0 AND totalBaseQuantity > 0").get(bizId) as any;
      const slowRatio = totalActive.count > 0 ? slowMoving.count / totalActive.count : 0;
      let slowScore = Math.round(Math.max(0, 100 - slowRatio * 200));
      factors.push({
        name: 'Inventory Turnover',
        score: slowScore,
        weight: 10,
        status: slowScore >= 70 ? 'good' : slowScore >= 40 ? 'warning' : 'critical',
        detail: `${slowMoving.count} items with no sales in 90 days, ${deadStock.count} with no sales in 60 days`
      });
      if (slowMoving.count > 5) recommendations.push('You have slow-moving inventory. Consider discounts or bundles to clear stagnant stock.');
    } catch (e) { console.error('[Search]', e); }

    // 6. Customer Activity (weight: 10)
    try {
      const activeCustomers = db.prepare(`
        SELECT COUNT(DISTINCT TRIM(customerName)) as count FROM sales
        WHERE DATE(createdAt) >= ? AND businessId = ? AND customerName IS NOT NULL AND customerName != ''
      `).get(thirtyDaysAgo, bizId) as any;
      const totalCustomers = db.prepare("SELECT COUNT(*) as count FROM customers WHERE businessId = ? AND isActive = 1").get(bizId) as any;
      const repeatRate = totalCustomers.count > 0 ? Math.min(1, (activeCustomers.count / totalCustomers.count) * 2) : 0;
      let custScore = Math.round(repeatRate * 100);
      factors.push({
        name: 'Customer Activity',
        score: custScore,
        weight: 10,
        status: custScore >= 60 ? 'good' : custScore >= 30 ? 'warning' : 'critical',
        detail: `${activeCustomers.count} active customers this month (${totalCustomers.count} total)`
      });
      if (custScore < 40) recommendations.push('Customer engagement is low. Launch a loyalty program or email campaign to bring customers back.');
    } catch (e) { console.error('[Search]', e); }

    // 7. Revenue Growth Trend (weight: 5)
    try {
      const currentMonthRev = db.prepare(
        "SELECT COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND businessId = ?"
      ).get(thirtyDaysAgo, bizId) as any;
      const prevMonthRev = db.prepare(
        "SELECT COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND DATE(createdAt) < ? AND businessId = ?"
      ).get(sixtyDaysAgo, thirtyDaysAgo, bizId) as any;
      const growth = prevMonthRev.revenue > 0 ? ((currentMonthRev.revenue - prevMonthRev.revenue) / prevMonthRev.revenue) * 100 : 0;
      let growthScore = Math.min(100, Math.max(0, 50 + growth));
      factors.push({
        name: 'Revenue Growth',
        score: Math.round(growthScore),
        weight: 5,
        status: growth >= 5 ? 'good' : growth >= -5 ? 'warning' : 'critical',
        detail: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% month-over-month`
      });
      if (growth < -10) recommendations.push('Revenue is declining. Analyze sales data to identify trends and adjust your strategy.');
    } catch (e) { console.error('[Search]', e); }

    // Calculate weighted score
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const weightedScore = totalWeight > 0 ? factors.reduce((sum, f) => sum + (f.score * f.weight / totalWeight), 0) : 0;
    const finalScore = Math.round(Math.max(0, Math.min(100, weightedScore)));

    let rating: string;
    if (finalScore >= 80) rating = 'Excellent';
    else if (finalScore >= 60) rating = 'Good';
    else if (finalScore >= 40) rating = 'Fair';
    else rating = 'Needs Attention';

    return { score: finalScore, rating, factors, recommendations };
  });

  // ========== BUSINESS ASSISTANT INSIGHTS ==========
  console.log('[Handlers] Registered get-business-insights');

  ipcMain.handle('get-business-insights', () => {
    const bizId = getActiveBusinessId();
    console.log('[Insights] Called with bizId:', bizId);
    console.log('[Insights] items:', (db.prepare('SELECT COUNT(*) as c FROM items WHERE businessId = ?').get(bizId) as any)?.c);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000).toISOString().split('T')[0];
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString().split('T')[0];
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const insights: { type: string; severity: 'info' | 'success' | 'warning' | 'critical'; title: string; message: string; action?: { label: string; route: string } }[] = [];

    // Low Stock Alerts
    try {
      const lowItems = db.prepare(`
        SELECT i.id, i.name, i.totalBaseQuantity, i.baseUnit, i.baseSellingPrice, c.name as categoryName
        FROM items i LEFT JOIN categories c ON i.categoryId = c.id
        WHERE i.businessId = ? AND i.is_deleted = 0 AND i.totalBaseQuantity < 10 AND i.totalBaseQuantity > 0
        ORDER BY i.totalBaseQuantity ASC LIMIT 5
      `).all(bizId) as any[];
      if (lowItems.length > 0) {
        insights.push({
          type: 'low_stock', severity: 'warning',
          title: `${lowItems.length} Products Running Low`,
          message: lowItems.map(i => `${i.name} (${i.totalBaseQuantity} ${i.baseUnit})`).join(', ') + '. Restock soon to avoid stockouts.',
          action: { label: 'View Inventory', route: '/inventory' }
        });
      }
    } catch (e) { console.error('[Search]', e); }

    // Out of Stock
    try {
      const oosItems = db.prepare(`
        SELECT COUNT(*) as count FROM items WHERE businessId = ? AND is_deleted = 0 AND totalBaseQuantity <= 0
      `).get(bizId) as any;
      if (oosItems.count > 0) {
        insights.push({
          type: 'out_of_stock', severity: 'critical',
          title: `${oosItems.count} Products Out of Stock`,
          message: `These items need immediate attention to restore availability. Check your supplier list and place orders.`,
          action: { label: 'View Inventory', route: '/inventory' }
        });
      }
    } catch (e) { console.error('[Search]', e); }

    // Best Selling Products
    try {
      const bestSellers = db.prepare(`
        SELECT i.name, SUM(s.quantity) as totalQty, SUM(s.totalPrice) as totalRevenue
        FROM sales s JOIN items i ON s.itemId = i.id
        WHERE DATE(s.createdAt) >= ? AND s.businessId = ?
        GROUP BY s.itemId ORDER BY totalQty DESC LIMIT 5
      `).all(thirtyDaysAgo, bizId) as any[];
      if (bestSellers.length > 0) {
        insights.push({
          type: 'best_sellers', severity: 'success',
          title: 'Best Selling Products',
          message: bestSellers.map((i: any) => `${i.name} (${i.totalQty} units, ETB ${(i.totalRevenue || 0).toLocaleString()})`).join(' · '),
          action: { label: 'View Sales', route: '/sales' }
        });
      }
    } catch (e) { console.error('[Search]', e); }

    // Highest Profit Items
    try {
      const topProfit = db.prepare(`
        SELECT i.name,
          SUM(s.totalPrice - (CASE WHEN s.unitType = 'pack' THEN s.quantity * COALESCE(i.unitsPerPack, 1) ELSE s.quantity END * COALESCE(i.basePurchasePrice, 0))) as totalProfit,
          SUM(s.quantity) as totalQty
        FROM sales s JOIN items i ON s.itemId = i.id
        WHERE DATE(s.createdAt) >= ? AND s.businessId = ?
        GROUP BY s.itemId ORDER BY totalProfit DESC LIMIT 5
      `).all(thirtyDaysAgo, bizId) as any[];
      if (topProfit.length > 0) {
        insights.push({
          type: 'top_profit', severity: 'success',
          title: 'Highest Profit Items',
          message: topProfit.map((i: any) => `${i.name} (ETB ${(i.totalProfit || 0).toLocaleString()})`).join(' · '),
        });
      }
    } catch (e) { console.error('[Search]', e); }

    // Slow Moving Products
    try {
      const slowMoving = db.prepare(`
        SELECT i.id, i.name, i.totalBaseQuantity, i.baseUnit, i.basePurchasePrice * i.totalBaseQuantity as inventoryValue
        FROM items i WHERE i.businessId = ? AND i.is_deleted = 0 AND i.totalBaseQuantity > 0
          AND (SELECT COALESCE(SUM(quantity), 0) FROM sales WHERE itemId = i.id AND DATE(createdAt) >= ?) = 0
        ORDER BY inventoryValue DESC LIMIT 5
      `).all(bizId, ninetyDaysAgo) as any[];
      if (slowMoving.length > 0) {
        insights.push({
          type: 'slow_moving', severity: 'warning',
          title: 'Slow-Moving Products',
          message: `${slowMoving.length} products haven't sold in 90 days. Consider promotions or bundles to move this stock. Top: ${slowMoving[0].name} (ETB ${((slowMoving[0].inventoryValue || 0)).toLocaleString()} tied up)`,
        });
      }
    } catch (e) { console.error('[Search]', e); }

    // Overstocked
    try {
      const overstocked = db.prepare(`
        SELECT i.name, i.totalBaseQuantity, i.baseUnit, c.name as categoryName
        FROM items i LEFT JOIN categories c ON i.categoryId = c.id
        WHERE i.businessId = ? AND i.is_deleted = 0 AND i.totalBaseQuantity > 100
        ORDER BY i.totalBaseQuantity DESC LIMIT 3
      `).all(bizId) as any[];
      if (overstocked.length > 0) {
        insights.push({
          type: 'overstocked', severity: 'info',
          title: 'Overstocked Items',
          message: `${overstocked.map((i: any) => `${i.name} (${i.totalBaseQuantity} ${i.baseUnit})`).join(', ')}. Consider reducing future orders.`,
        });
      }
    } catch (e) { console.error('[Search]', e); }

    // Declining Sales Trend
    try {
      const weeklySales = db.prepare(`
        SELECT DATE(createdAt) as date, COALESCE(SUM(totalPrice), 0) as revenue
        FROM sales WHERE DATE(createdAt) >= ? AND businessId = ? GROUP BY DATE(createdAt) ORDER BY date
      `).all(sevenDaysAgo, bizId) as any[];
      if (weeklySales.length >= 4) {
        const recent = weeklySales.slice(-2).reduce((a: number, d: any) => a + d.revenue, 0);
        const earlier = weeklySales.slice(0, -2).reduce((a: number, d: any) => a + d.revenue, 0);
        if (earlier > 0 && recent < earlier * 0.7) {
          insights.push({
            type: 'sales_decline', severity: 'critical',
            title: 'Sales Declining',
            message: 'Revenue has dropped significantly in recent days. Check for stock issues, competitor activity, or seasonal factors.',
            action: { label: 'View Analytics', route: '/analytics' }
          });
        }
      }
    } catch (e) { console.error('[Search]', e); }

    // Top Customers
    try {
      const topCustomers = db.prepare(`
        SELECT TRIM(s.customerName) as name, COUNT(*) as count, SUM(s.totalPrice) as total
        FROM sales s WHERE DATE(s.createdAt) >= ? AND s.businessId = ? AND s.customerName IS NOT NULL AND s.customerName != ''
        GROUP BY TRIM(s.customerName) ORDER BY total DESC LIMIT 3
      `).all(thirtyDaysAgo, bizId) as any[];
      if (topCustomers.length > 0) {
        insights.push({
          type: 'top_customers', severity: 'success',
          title: 'Top Customers (30 days)',
          message: topCustomers.map((c: any) => `${c.name} (ETB ${(c.total || 0).toLocaleString()})`).join(' · '),
        });
      }
    } catch (e) { console.error('[Search]', e); }

    // Daily Summary
    try {
      const todaySales = db.prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) = ? AND businessId = ?"
      ).get(today, bizId) as any;
      const todayExpenses = db.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ? AND businessId = ?"
      ).get(today, bizId) as any;
      if (todaySales.count > 0 || todayExpenses.total > 0) {
        insights.push({
          type: 'daily_summary', severity: 'info',
          title: 'Today\'s Summary',
          message: `${todaySales.count} sales · ETB ${(todaySales.revenue || 0).toLocaleString()} revenue · ETB ${(todayExpenses.total || 0).toLocaleString()} expenses`,
        });
      }
    } catch (e) { console.error('[Search]', e); }

    // Weekly Summary
    try {
      const weekSales = db.prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND businessId = ?"
      ).get(sevenDaysAgo, bizId) as any;
      const weekExpenses = db.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND businessId = ?"
      ).get(sevenDaysAgo, bizId) as any;
      if (weekSales.count > 0) {
        insights.push({
          type: 'weekly_summary', severity: 'info',
          title: 'This Week',
          message: `${weekSales.count} sales · ETB ${(weekSales.revenue || 0).toLocaleString()} revenue · ETB ${(weekExpenses.total || 0).toLocaleString()} expenses · Net: ETB ${((weekSales.revenue || 0) - (weekExpenses.total || 0)).toLocaleString()}`,
        });
      }
    } catch (e) { console.error('[Search]', e); }

    // Monthly Summary
    try {
      const monthSales = db.prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND businessId = ?"
      ).get(thirtyDaysAgo, bizId) as any;
      const monthExpenses = db.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND businessId = ?"
      ).get(thirtyDaysAgo, bizId) as any;
      if (monthSales.count > 0) {
        insights.push({
          type: 'monthly_summary', severity: 'info',
          title: 'Last 30 Days',
          message: `${monthSales.count} sales · ETB ${(monthSales.revenue || 0).toLocaleString()} revenue · ETB ${(monthExpenses.total || 0).toLocaleString()} expenses · Net: ETB ${((monthSales.revenue || 0) - (monthExpenses.total || 0)).toLocaleString()}`,
        });
      }
    } catch (e) { console.error('[Search]', e); }

    // Supplier Performance
    try {
      const topSuppliers = db.prepare(`
        SELECT s.supplierName,
          COUNT(sp.id) as purchaseCount,
          COALESCE(SUM(sp.totalAmount), 0) as totalAmount,
          AVG(CASE WHEN sp.status = 'received' THEN julianday(sp.purchaseDate) - julianday(sp.purchaseDate) ELSE NULL END) as leadTime
        FROM suppliers s
        JOIN supplier_purchases sp ON sp.supplierId = s.id
        WHERE sp.businessId = ? AND sp.status != 'cancelled' AND sp.purchaseDate >= ?
        GROUP BY s.id ORDER BY totalAmount DESC LIMIT 2
      `).all(bizId, thirtyDaysAgo) as any[];
      if (topSuppliers.length > 0) {
        insights.push({
          type: 'supplier_performance', severity: 'info',
          title: 'Top Suppliers',
          message: topSuppliers.map((s: any) => `${s.supplierName} (ETB ${(s.totalAmount || 0).toLocaleString()})`).join(' · '),
          action: { label: 'View Suppliers', route: '/suppliers' }
        });
      }
    } catch (e) { console.error('[Search]', e); }

    // Cash Flow Observation
    try {
      const totalRevenue = db.prepare(
        "SELECT COALESCE(SUM(totalPrice), 0) as revenue FROM sales WHERE DATE(createdAt) >= ? AND businessId = ? AND paymentStatus = 'Paid'"
      ).get(thirtyDaysAgo, bizId) as any;
      const debtSales = db.prepare(
        "SELECT COALESCE(SUM(totalPrice - paidAmount), 0) as outstanding FROM sales WHERE paymentStatus = 'Debt' AND businessId = ?"
      ).get(bizId) as any;
      const ratio = totalRevenue.revenue > 0 ? (debtSales.outstanding / totalRevenue.revenue) * 100 : 0;
      if (ratio > 30) {
        insights.push({
          type: 'cash_flow', severity: 'warning',
          title: 'Cash Flow Observation',
          message: `Outstanding debts (ETB ${(debtSales.outstanding || 0).toLocaleString()}) represent ${ratio.toFixed(0)}% of paid revenue. Follow up on collections to improve cash flow.`,
          action: { label: 'View Debts', route: '/debt-management' }
        });
      }
    } catch (e) { console.error('[Search]', e); }

    // Profit Improvement Suggestion
    try {
      const avgMargin = db.prepare(`
        SELECT AVG(CASE WHEN s.totalPrice > 0 THEN
          (s.totalPrice - (CASE WHEN s.unitType = 'pack' THEN s.quantity * COALESCE(i.unitsPerPack, 1) ELSE s.quantity END * COALESCE(i.basePurchasePrice, 0))) / s.totalPrice * 100
        ELSE 0 END) as avgMargin
        FROM sales s LEFT JOIN items i ON s.itemId = i.id
        WHERE DATE(s.createdAt) >= ? AND s.businessId = ? AND s.totalPrice > 0
      `).get(thirtyDaysAgo, bizId) as any;
      if (avgMargin.avgMargin !== null && avgMargin.avgMargin < 25) {
        insights.push({
          type: 'profit_suggestion', severity: 'info',
          title: 'Profit Improvement Opportunity',
          message: `Average margin is ${avgMargin.avgMargin.toFixed(1)}%. A 5% price increase across all products could boost profit by ${avgMargin.avgMargin > 0 ? Math.round((5 / avgMargin.avgMargin) * 100) : 20}%.`,
        });
      }
    } catch (e) { console.error('[Search]', e); }

    // Seasonal Trend
    try {
      const lastYearSales = db.prepare(`
        SELECT COALESCE(SUM(totalPrice), 0) as revenue FROM sales
        WHERE DATE(createdAt) >= ? AND DATE(createdAt) < ? AND businessId = ?
      `).get(thirtyDaysAgo, today, bizId) as any;
      const lastYearPeriod = db.prepare(`
        SELECT COALESCE(SUM(totalPrice), 0) as revenue FROM sales
        WHERE DATE(createdAt) >= ? AND DATE(createdAt) < ? AND businessId = ?
      `).get(
        new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0],
        new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 30).toISOString().split('T')[0],
        bizId
      ) as any;
      if (lastYearPeriod.revenue > 0) {
        const yoy = ((lastYearSales.revenue - lastYearPeriod.revenue) / lastYearPeriod.revenue) * 100;
        if (Math.abs(yoy) > 20) {
          insights.push({
            type: 'seasonal_trend', severity: yoy > 0 ? 'success' : 'warning',
            title: `Year-over-Year: ${yoy >= 0 ? '+' : ''}${yoy.toFixed(0)}%`,
            message: `Revenue compared to same period last year. ${yoy >= 0 ? 'Growing' : 'Declining'} market trend detected.`,
          });
        }
      }
    } catch (e) { console.error('[Search]', e); }

    return insights.sort((a, b) => {
      const order = { critical: 0, warning: 1, success: 2, info: 3 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    });
  });

  // ========== SUBSCRIPTION SYSTEM ==========

  ipcMain.handle('get-subscription-plans', () => {
    return db.prepare('SELECT * FROM subscription_plans WHERE isActive = 1 ORDER BY price ASC').all();
  });

  ipcMain.handle('get-current-subscription', () => {
    const bizId = getActiveBusinessId();
    const sub = db.prepare('SELECT * FROM subscriptions WHERE businessId = ?').get(bizId) as any;
    if (!sub) return null;

    // Check if trial has expired
    const now = new Date();
    if (sub.isTrial && sub.trialEndsAt && new Date(sub.trialEndsAt) < now && sub.status === 'active') {
      sub.tier = 'basic';
      sub.status = 'active';
      sub.isTrial = 0;
      db.prepare('UPDATE subscriptions SET tier = ?, isTrial = 0, updatedAt = ? WHERE id = ?')
        .run('basic', now.toISOString(), sub.id);
      db.prepare('INSERT INTO subscription_history (subscriptionId, businessId, action, oldTier, newTier, details, changedBy) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(sub.id, bizId, 'trial_expired', 'trial', 'basic', 'Trial period ended, auto-downgraded to Basic', 'system');
      sub.tier = 'basic';
      sub.isTrial = 0;
    }

    // Check if paid subscription has expired
    if (sub.expiresAt && new Date(sub.expiresAt) < now && sub.status === 'active' && !sub.isTrial) {
      const oldTier = sub.tier;
      sub.tier = 'basic';
      sub.status = 'expired';
      db.prepare('UPDATE subscriptions SET status = ?, updatedAt = ? WHERE id = ?')
        .run('expired', now.toISOString(), sub.id);
      db.prepare('INSERT INTO subscription_history (subscriptionId, businessId, action, oldTier, newTier, oldStatus, newStatus, details, changedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(sub.id, bizId, 'subscription_expired', oldTier, 'basic', 'active', 'expired', 'Subscription period ended', 'system');
      sub.status = 'expired';
      sub.tier = 'basic';
    }

    const plan = sub.planId ? db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(sub.planId) : null;
    return { ...sub, plan };
  });

  ipcMain.handle('start-trial', () => {
    const bizId = getActiveBusinessId();
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const existing = db.prepare('SELECT id, isTrial, status FROM subscriptions WHERE businessId = ?').get(bizId) as any;

    if (existing) {
      if (existing.isTrial) return { success: true, message: 'Trial already active' };
      if (!existing.isTrial && existing.status !== 'expired') {
        return { success: false, error: 'Subscription already active' };
      }
      db.prepare('UPDATE subscriptions SET tier = ?, status = ?, isTrial = 1, trialStartedAt = ?, trialEndsAt = ?, startedAt = ?, expiresAt = ?, updatedAt = ? WHERE id = ?')
        .run('trial', 'active', now.toISOString(), trialEnd.toISOString(), now.toISOString(), trialEnd.toISOString(), now.toISOString(), existing.id);
    } else {
      db.prepare('INSERT INTO subscriptions (businessId, tier, status, isTrial, trialStartedAt, trialEndsAt, startedAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(bizId, 'trial', 'active', 1, now.toISOString(), trialEnd.toISOString(), now.toISOString(), trialEnd.toISOString());
    }
    db.prepare('INSERT INTO subscription_history (subscriptionId, businessId, action, oldTier, newTier, details, changedBy) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(existing?.id || (db.prepare('SELECT id FROM subscriptions WHERE businessId = ?').get(bizId) as any)?.id, bizId, 'trial_started', existing?.tier || 'none', 'trial', '7-day premium trial started', currentUserName || 'system');
    return { success: true };
  });

  ipcMain.handle('submit-payment', (_, data: {
    transactionId: string; businessName: string; phoneNumber: string;
    selectedPlan: string; amount: number; paymentDate: string; notes?: string
  }) => {
    const bizId = getActiveBusinessId();
    const result = db.prepare(`
      INSERT INTO payment_transactions (businessId, transactionId, businessName, phoneNumber, selectedPlan, amount, paymentDate, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(bizId, data.transactionId, data.businessName, data.phoneNumber, data.selectedPlan, data.amount, data.paymentDate, data.notes || null);
    db.prepare('INSERT INTO subscription_history (subscriptionId, businessId, action, details, changedBy) VALUES (?, ?, ?, ?, ?)')
      .run(null, bizId, 'payment_submitted', `Payment submitted for plan "${data.selectedPlan}" (Transaction: ${data.transactionId})`, currentUserName || 'system');
    return { success: true, id: result.lastInsertRowid };
  });

  ipcMain.handle('get-payment-transactions', (_, options?: { status?: string }) => {
    const bizId = getActiveBusinessId();
    let query = 'SELECT * FROM payment_transactions WHERE businessId = ?';
    const params: any[] = [bizId];
    if (options?.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }
    query += ' ORDER BY createdAt DESC';
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-all-payment-transactions', (_, options?: { status?: string }) => {
    requirePermission('settings');
    let query = 'SELECT pt.*, b.businessName as bizName FROM payment_transactions pt LEFT JOIN businesses b ON pt.businessId = b.id';
    const params: any[] = [];
    if (options?.status) {
      query += ' WHERE pt.status = ?';
      params.push(options.status);
    }
    query += ' ORDER BY pt.createdAt DESC';
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('approve-payment', (_, data: { transactionId: number; subscriptionId?: number }) => {
    requirePermission('settings');
    const bizId = getActiveBusinessId();
    const tx = db.prepare('SELECT * FROM payment_transactions WHERE id = ?').get(data.transactionId) as any;
    if (!tx) return { success: false, error: 'Transaction not found' };

    const plan = db.prepare('SELECT * FROM subscription_plans WHERE name = ?').get(tx.selectedPlan) as any;
    if (!plan) return { success: false, error: 'Plan not found' };

    const now = new Date();
    const expiresAt = new Date(now.getTime() + plan.durationMonths * 30 * 24 * 60 * 60 * 1000);

    const existingSub = db.prepare('SELECT id, tier FROM subscriptions WHERE businessId = ?').get(tx.businessId) as any;
    const oldTier = existingSub?.tier || 'basic';

    if (existingSub) {
      db.prepare(`
        UPDATE subscriptions SET planId = ?, tier = ?, status = 'active', isTrial = 0, startedAt = ?, expiresAt = ?, updatedAt = ?
        WHERE id = ?
      `).run(plan.id, plan.tier, now.toISOString(), expiresAt.toISOString(), now.toISOString(), existingSub.id);
    } else {
      const r = db.prepare(`
        INSERT INTO subscriptions (businessId, planId, tier, status, startedAt, expiresAt)
        VALUES (?, ?, ?, 'active', ?, ?)
      `).run(tx.businessId, plan.id, plan.tier, now.toISOString(), expiresAt.toISOString());
      data.subscriptionId = r.lastInsertRowid as number;
    }

    db.prepare('UPDATE payment_transactions SET status = ?, verifiedBy = ?, verifiedAt = ?, subscriptionId = ? WHERE id = ?')
      .run('approved', currentAdminId, now.toISOString(), existingSub?.id || data.subscriptionId, data.transactionId);

    db.prepare('INSERT INTO subscription_history (subscriptionId, businessId, action, oldTier, newTier, details, changedBy) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(existingSub?.id || data.subscriptionId, tx.businessId, 'payment_approved', oldTier, plan.tier, `Payment #${tx.id} approved. Plan: ${tx.selectedPlan}`, currentUserName || 'system');

    return { success: true };
  });

  ipcMain.handle('reject-payment', (_, data: { transactionId: number; reason: string }) => {
    requirePermission('settings');
    const tx = db.prepare('SELECT * FROM payment_transactions WHERE id = ?').get(data.transactionId) as any;
    if (!tx) return { success: false, error: 'Transaction not found' };

    db.prepare('UPDATE payment_transactions SET status = ?, adminNotes = ?, verifiedBy = ?, verifiedAt = ? WHERE id = ?')
      .run('rejected', data.reason, currentAdminId, new Date().toISOString(), data.transactionId);

    db.prepare('INSERT INTO subscription_history (subscriptionId, businessId, action, details, changedBy) VALUES (?, ?, ?, ?, ?)')
      .run(null, tx.businessId, 'payment_rejected', `Payment #${tx.id} rejected. Reason: ${data.reason}`, currentUserName || 'system');

    return { success: true };
  });

  ipcMain.handle('get-subscription-history', () => {
    const bizId = getActiveBusinessId();
    return db.prepare('SELECT * FROM subscription_history WHERE businessId = ? ORDER BY createdAt DESC').all(bizId);
  });

  ipcMain.handle('get-renewal-info', () => {
    const bizId = getActiveBusinessId();
    const sub = db.prepare('SELECT * FROM subscriptions WHERE businessId = ?').get(bizId) as any;
    if (!sub || !sub.expiresAt) return null;

    const now = new Date();
    const expiry = new Date(sub.expiresAt);
    const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      daysRemaining: Math.max(0, daysRemaining),
      expiresAt: sub.expiresAt,
      isExpired: daysRemaining <= 0,
      needsRenewal: daysRemaining <= 7,
      tier: sub.tier,
      status: sub.status,
      isTrial: !!sub.isTrial,
    };
  });

  ipcMain.handle('check-premium-feature', (_, feature: string) => {
    const bizId = getActiveBusinessId();
    const sub = db.prepare('SELECT tier, isTrial, status, expiresAt FROM subscriptions WHERE businessId = ?').get(bizId) as any;
    if (!sub) return { allowed: false, reason: 'no_subscription' };

    if (sub.status !== 'active') return { allowed: false, reason: 'subscription_not_active' };
    const isPremium = sub.tier === 'premium' || sub.isTrial;
    if (!isPremium) return { allowed: false, reason: 'requires_premium' };

    // Check expiry for paid premium
    if (!sub.isTrial && sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
      return { allowed: false, reason: 'subscription_expired' };
    }

    return { allowed: true };
  });

  ipcMain.handle('get-subscription-stats', () => {
    const allSubs = db.prepare(`
      SELECT s.tier, s.status, s.isTrial, s.expiresAt, s.businessId, b.businessName as bizName
      FROM subscriptions s LEFT JOIN businesses b ON s.businessId = b.id
    `).all();
    return {
      total: allSubs.length,
      active: allSubs.filter((s: any) => s.status === 'active').length,
      trial: allSubs.filter((s: any) => s.isTrial).length,
      premium: allSubs.filter((s: any) => s.tier === 'premium').length,
      basic: allSubs.filter((s: any) => s.tier === 'basic' && !s.isTrial).length,
      expired: allSubs.filter((s: any) => s.status === 'expired').length,
      pendingPayments: (db.prepare("SELECT COUNT(*) as c FROM payment_transactions WHERE status = 'pending'").get() as any).c,
    };
  });

  ipcMain.handle('check-trial-availability', () => {
    const bizId = getActiveBusinessId();
    const sub = db.prepare('SELECT isTrial, tier, status FROM subscriptions WHERE businessId = ?').get(bizId) as any;
    if (!sub) return { available: true };
    if (sub.isTrial) return { available: false, reason: 'already_on_trial', trialActive: true };
    if (sub.status === 'expired' && !sub.isTrial) return { available: false, reason: 'already_used_trial' };
    if (sub.status === 'active' && sub.tier !== 'basic') return { available: false, reason: 'already_subscribed' };
    return { available: true };
  });

  // Debug handler
  ipcMain.handle('debug:ping', () => ({ pong: true }));

  // ──────────────────────────────────────────────
  // Update System IPC Handlers
  // ──────────────────────────────────────────────

  ipcMain.handle('update:check', async () => {
    try {
      return await appUpdater.checkForUpdates();
    } catch (err: any) {
      return { status: 'error', error: err.message };
    }
  });

  ipcMain.handle('update:download', async () => {
    try {
      await appUpdater.downloadUpdate();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('update:install', () => {
    appUpdater.installUpdate();
    return { success: true };
  });

  ipcMain.handle('update:skip-version', (_, version: string) => {
    appUpdater.skipVersion(version);
    return { success: true };
  });

  ipcMain.handle('update:remind-later', (_, hours?: number) => {
    appUpdater.remindLater(hours ?? 24);
    return { success: true };
  });

  ipcMain.handle('update:get-status', () => {
    return {
      status: appUpdater.getStatus(),
      info: appUpdater.getUpdateInfo(),
      progress: appUpdater.getProgress(),
      error: appUpdater.getError(),
      appVersion: appUpdater.getAppVersion(),
      autoCheckEnabled: appUpdater.isAutoCheckEnabled(),
    };
  });

  ipcMain.handle('update:set-auto-check', (_, enabled: boolean) => {
    appUpdater.setAutoCheckEnabled(enabled);
    return { success: true };
  });

  ipcMain.handle('update:get-app-version', () => {
    return appUpdater.getAppVersion();
  });

  ipcMain.handle('update:clear-reminder', () => {
    appUpdater.clearReminder();
    return { success: true };
  });

  ipcMain.handle('check-stock-consistency', () => {
    requirePermission('inventory.view');
    const bizId = getActiveBusinessId() as number;
    return checkStockConsistency(bizId);
  });

  ipcMain.handle('fix-stock-consistency', () => {
    requirePermission('inventory.adjust');
    const bizId = getActiveBusinessId() as number;
    const result = checkStockConsistency(bizId);
    const fixed: number[] = [];

    const fixTx = db.transaction(() => {
      for (const item of result.inconsistent) {
        db.prepare('UPDATE items SET totalBaseQuantity = (SELECT COALESCE(SUM(quantity), 0) FROM warehouse_inventory WHERE itemId = ?) WHERE id = ?')
          .run(item.itemId, item.itemId);
        fixed.push(item.itemId);
      }
    });
    fixTx();

    return { fixed: fixed.length, totalInconsistent: result.inconsistent.length };
  });

  // ========== POS MODULE: SHIFTS ==========
  ipcMain.handle('pos:products', () => {
    requirePermission('sales.create');
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT i.*, c.name as categoryName
      FROM items i
      LEFT JOIN categories c ON i.categoryId = c.id
      WHERE i.businessId = ? AND i.is_deleted = 0 AND (i.isActive = 1 OR i.isActive IS NULL)
      ORDER BY i.name COLLATE NOCASE
    `).all(bizId);
  });

  ipcMain.handle('pos:categories', () => {
    requirePermission('sales.create');
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT DISTINCT c.id, c.name, c.icon
      FROM items i
      LEFT JOIN categories c ON i.categoryId = c.id
      WHERE i.businessId = ? AND i.is_deleted = 0 AND i.categoryId IS NOT NULL
      ORDER BY c.name COLLATE NOCASE
    `).all(bizId);
  });

  ipcMain.handle('pos:shift-by-register', () => {
    const bizId = getActiveBusinessId();
    return db.prepare(`
      SELECT r.id, r.name, s.id as shiftId, s.status, s.openedAt, s.openingFloat, s.expectedCash,
        s.cashierId
      FROM registers r
      LEFT JOIN shifts s ON s.registerId = r.id AND s.status IN ('open', 'mid_audit', 'blind_count')
      WHERE r.businessId = ? AND r.isActive = 1 AND r.is_deleted = 0
      ORDER BY r.name COLLATE NOCASE
    `).all(bizId);
  });

  ipcMain.handle('shift:open', (_, data: { registerId: number; cashierId: number; openingFloat: number }) => {
    const bizId = getActiveBusinessId();
    return shifts.openShift(bizId, data.registerId, data.cashierId, data.openingFloat);
  });

  ipcMain.handle('shift:close', (_, shiftId: number, data: { closingCash: number; cashDrawerCounts?: any[]; notes?: string }) => {
    return shifts.closeShift(shiftId, data.closingCash, data.cashDrawerCounts || [], data.notes);
  });

  ipcMain.handle('shift:mid-audit', (_, shiftId: number, countedCash: number, notes?: string) => {
    return shifts.recordMidShiftAudit(shiftId, countedCash, notes);
  });

  ipcMain.handle('shift:blind-count', (_, shiftId: number, countedCash: number, notes?: string) => {
    return shifts.recordBlindCount(shiftId, countedCash, notes);
  });

  ipcMain.handle('shift:active', (_, registerId: number) => {
    return shifts.getOpenShift(registerId);
  });

  ipcMain.handle('shift:by-id', (_, shiftId: number) => {
    return shifts.getShiftById(shiftId);
  });

  ipcMain.handle('shift:last-by-cashier', (_, cashierId: number) => {
    return shifts.getLastShiftByCashier(cashierId);
  });

  ipcMain.handle('shift:transactions', (_, shiftId: number) => {
    return shifts.getShiftTransactions(shiftId);
  });

  ipcMain.handle('shift:summary', (_, shiftId: number) => {
    return shifts.generateShiftReport(shiftId);
  });

  ipcMain.handle('shift:record-transaction', (_, data: { shiftId: number; saleId?: number | null; paymentMethod: string; amount: number; notes?: string }) => {
    return shifts.addShiftTransaction(data.shiftId, data.saleId ?? null, data.paymentMethod, data.amount);
  });

  // ========== POS MODULE: REPORTS ==========
  ipcMain.handle('reports:x-report', (_, registerId: number) => {
    const bizId = getActiveBusinessId();
    return reports.generateXReport(bizId, registerId);
  });

  ipcMain.handle('reports:z-report', (_, registerId: number, countedCash: number, cashDrawerCounts: any[]) => {
    const bizId = getActiveBusinessId();
    return reports.generateZReport(bizId, registerId, countedCash, cashDrawerCounts);
  });

  ipcMain.handle('reports:x-report-print', async (_, registerId: number) => {
    const bizId = getActiveBusinessId();
    const report = reports.generateXReport(bizId, registerId);
    const driver = getPrinterConfig();
    if (driver) {
      const cmds = reports.printFiscalReport(report, driver);
      await printRaw(cmds);
    }
    return report;
  });

  ipcMain.handle('reports:z-report-print', async (_, registerId: number, countedCash: number, cashDrawerCounts: any[]) => {
    const bizId = getActiveBusinessId();
    const report = reports.generateZReport(bizId, registerId, countedCash, cashDrawerCounts);
    const driver = getPrinterConfig();
    if (driver) {
      const cmds = reports.printFiscalReport(report, driver);
      await printRaw(cmds);
    }
    return report;
  });

  // ========== POS MODULE: LEDGER ==========
  ipcMain.handle('ledger:entries', (_, options?: { limit?: number; offset?: number; type?: string }) => {
    const bizId = getActiveBusinessId();
    return ledger.getLedgerEntries(bizId, options);
  });

  ipcMain.handle('ledger:reverse', (_, request: { entryId: number; reason: string; reversedBy: number }) => {
    return ledger.reverseEntry(request);
  });

  ipcMain.handle('ledger:verify', () => {
    const bizId = getActiveBusinessId();
    return ledger.verifyLedgerIntegrity(bizId);
  });

  ipcMain.handle('ledger:balance', () => {
    const bizId = getActiveBusinessId();
    return ledger.getLedgerBalance(bizId);
  });

  ipcMain.handle('ledger:shift-summary', (_, shiftId: number) => {
    return ledger.getShiftLedgerSummary(shiftId);
  });

  // ========== POS MODULE: TAX ==========
  ipcMain.handle('tax:calculate', (_, lines: any[]) => {
    return tax.calculateTax(lines);
  });

  ipcMain.handle('tax:wht', (_, input: { amount: number; rate: number; payerName: string; payerTin: string }) => {
    return tax.calculateWHT(input);
  });

  ipcMain.handle('tax:vat-return', (_, input: any) => {
    return tax.calculateVatReturn(input);
  });

  ipcMain.handle('tax:tot-return', (_, input: any) => {
    return tax.calculateTotReturn(input);
  });

  ipcMain.handle('tax:mat', (_, grossTurnover: number) => {
    return tax.calculateMAT(grossTurnover);
  });

  ipcMain.handle('tax:advance', (_, estimatedAnnualTax: number) => {
    return tax.calculateAdvanceTax(estimatedAnnualTax);
  });

  ipcMain.handle('tax:paye', (_, input: any) => {
    return tax.calculatePAYE(input);
  });

  ipcMain.handle('tax:pension', (_, input: any) => {
    return tax.calculatePension(input);
  });

  // ========== POS MODULE: MoR QR ==========
  ipcMain.handle('mor-qr:generate', (_, data: {
    tin: string; invoiceNumber: string; invoiceDate: string;
    totalAmount: number; vatAmount: number; totAmount: number; whtAmount: number;
  }) => {
    return morQr.generateMorQrPayload(data);
  });

  ipcMain.handle('mor-qr:validate', (_, payload: string) => {
    return morQr.validateMorQrPayload(payload);
  });

  ipcMain.handle('mor-qr:print-receipt', async (_, data: any) => {
    const driver = getPrinterConfig();
    if (!driver) throw new Error('No printer configured');
    await morQr.printMorReceipt(data, driver);
    return { success: true };
  });

  // ========== POS MODULE: COMPLIANCE ==========
  ipcMain.handle('compliance:check', (_, context: any, rules?: any[]) => {
    return compliance.runComplianceChecks(context, rules);
  });

  ipcMain.handle('compliance:validate-tin', (_, tin: string) => {
    return compliance.validateTin(tin);
  });

  ipcMain.handle('compliance:report', (_, fromDate: string, toDate: string) => {
    const bizId = getActiveBusinessId();
    return compliance.generateComplianceReport(bizId, fromDate, toDate);
  });

  ipcMain.handle('compliance:log', (_, event: any) => {
    return compliance.logComplianceEvent(event);
  });

  // ========== POS MODULE: e-TAX EXPORT ==========
  ipcMain.handle('etax:export-sales', (_, options: { fromDate: string; toDate: string; outputDir?: string }) => {
    return etaxExport.generateEtaxSalesCsv(options);
  });

  ipcMain.handle('etax:export-purchases', (_, options: { fromDate: string; toDate: string; outputDir?: string }) => {
    return etaxExport.generateEtaxPurchasesCsv(options);
  });

  ipcMain.handle('etax:validate', (_, csv: string, type: 'sales' | 'purchases') => {
    return etaxExport.validateEtaxCsv(csv, type);
  });

  ipcMain.handle('etax:export-all', (_, options: { fromDate: string; toDate: string; outputDir: string }) => {
    return etaxExport.exportEtaxCsv(options);
  });

  // ========== SHARED BUSINESS MODEL (registers, devices, roles, people) ==========
  registerBusinessDomainHandlers({
    getActiveBusinessId,
    isOwnerOrSuper: () => currentUserRole === 'super_admin' || currentUserRole === 'owner',
    getUserRole: () =>
      currentUserRole === 'super_admin' ? 'owner' : (currentUserRole ?? 'cashier'),
    buildPermissionContext: () => {
      // Employees resolve from their canonical @shega/shared role; local admins
      // and owner-level sessions keep full access to the shared business model.
      const canApprove = currentUserRole === 'super_admin' || currentUserRole === 'owner' || (currentUserPermissions ?? []).includes('*');
      if (currentUserSharedPerms) {
        return { permissions: currentUserSharedPerms, canApprove };
      }
      const permissions: Record<string, any> = {};
      for (const r of BUILTIN_ROLES) for (const [k, v] of Object.entries(r.permissions)) permissions[k] = v;
      return { permissions: { ...permissions, business: true, settings: true }, canApprove };
    },
    audit: (action, entityType, entityId, description) =>
      insertAuditLog(action, entityType, entityId, null, null, null, description),
  });

  console.log('[Handlers] All IPC handlers registered successfully');
}

// ========== STOCK CONSISTENCY CHECK ==========

function checkStockConsistency(bizId: number): { inconsistent: { itemId: number; itemName: string; expected: number; actual: number; diff: number }[]; checked: number } {
  const items = db.prepare('SELECT id, name, totalBaseQuantity FROM items WHERE businessId = ? AND is_deleted = 0').all(bizId) as any[];
  const inconsistent: any[] = [];

  for (const item of items) {
    const whSum = db.prepare('SELECT COALESCE(SUM(quantity), 0) as total FROM warehouse_inventory WHERE itemId = ?').get(item.id) as any;
    const expected = item.totalBaseQuantity || 0;
    const actual = whSum?.total || 0;
    if (Math.abs(expected - actual) > 0.001) {
      inconsistent.push({ itemId: item.id, itemName: item.name, expected, actual, diff: expected - actual });
    }
  }

  return { inconsistent, checked: items.length };
}
