// ============================================
// Shift Management Module
// Lifecycle: OPEN_SHIFT → FLOAT_CASH → MID_SHIFT_AUDIT → BLIND_COUNT → CLOSE_SHIFT
// ============================================

import db from '../database';
import { logger } from '../logger';

export type ShiftStatus = 'open' | 'mid_audit' | 'blind_count' | 'closed';

export interface Shift {
  id: number;
  businessId: number;
  registerId: number;
  cashierId: number;
  openingFloat: number;
  expectedCash: number;
  countedCash: number;
  variance: number;
  status: ShiftStatus;
  openedAt: string;
  closedAt: string | null;
  midAuditAt: string | null;
  blindCountAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftTransaction {
  id: number;
  shiftId: number;
  saleId: number;
  paymentMethod: string;
  amount: number;
  createdAt: string;
}

export interface CashDrawerCount {
  denomination: number;
  count: number;
  total: number;
}

export interface ShiftSummary {
  shift: Shift;
  totals: {
    cash: number;
    card: number;
    mobile: number;
    total: number;
  };
  counts: {
    sales: number;
    voids: number;
    refunds: number;
    returns: number;
  };
  cashDrawer: {
    expected: number;
    counted: number;
    variance: number;
    breakdown: CashDrawerCount[];
  };
}

// ============================================
// Shift Operations
// ============================================

export function openShift(
  businessId: number,
  registerId: number,
  cashierId: number,
  openingFloat: number,
  notes?: string
): number {
  const existing = db.prepare(`
    SELECT id FROM shifts 
    WHERE registerId = ? AND status IN ('open', 'mid_audit', 'blind_count')
  `).get(registerId) as any;

  if (existing) {
    throw new Error('Register already has an open shift');
  }

  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO shifts (businessId, registerId, cashierId, openingFloat, expectedCash, status, openedAt, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)
  `).run(businessId, registerId, cashierId, openingFloat, openingFloat, now, notes || '', now, now);

  const shiftId = result.lastInsertRowid as number;
  
  // Record opening float in shift transactions
  db.prepare(`
    INSERT INTO shift_transactions (shiftId, saleId, paymentMethod, amount, createdAt)
    VALUES (?, NULL, 'float', ?, ?)
  `).run(shiftId, openingFloat, new Date().toISOString());

  logger.info(`[Shift] Opened shift ${shiftId} for register ${registerId} by cashier ${cashierId} with float ${openingFloat}`);
  return shiftId;
}

export function getOpenShift(registerId: number): Shift | null {
  return db.prepare(`
    SELECT * FROM shifts 
    WHERE registerId = ? AND status IN ('open', 'mid_audit', 'blind_count')
    ORDER BY openedAt DESC LIMIT 1
  `).get(registerId) as Shift | null;
}

export function getShiftById(shiftId: number): Shift | null {
  return db.prepare('SELECT * FROM shifts WHERE id = ?').get(shiftId) as Shift | null;
}

export function getLastShiftByCashier(cashierId: number): Shift | null {
  return db.prepare(`
    SELECT * FROM shifts
    WHERE cashierId = ?
    ORDER BY openedAt DESC LIMIT 1
  `).get(cashierId) as Shift | null;
}

export function recordMidShiftAudit(shiftId: number, countedCash: number, notes?: string): void {
  const shift = getShiftById(shiftId);
  if (!shift) throw new Error('Shift not found');
  if (shift.status !== 'open') throw new Error('Shift is not open');

  const now = new Date().toISOString();
  const variance = countedCash - shift.expectedCash;

  db.prepare(`
    UPDATE shifts 
    SET status = 'mid_audit', 
        countedCash = ?, 
        variance = ?, 
        midAuditAt = ?, 
        notes = COALESCE(notes || '; ', '') || ?,
        updatedAt = ?
    WHERE id = ?
  `).run(countedCash, variance, now, notes || '', now, shiftId);

  logger.info(`[Shift] Mid-shift audit for shift ${shiftId}: counted ${countedCash}, variance ${variance}`);
}

export function recordBlindCount(shiftId: number, countedCash: number, notes?: string): void {
  const shift = getShiftById(shiftId);
  if (!shift) throw new Error('Shift not found');
  if (shift.status !== 'open' && shift.status !== 'mid_audit') {
    throw new Error('Shift must be open or in mid-audit for blind count');
  }

  const now = new Date().toISOString();
  const variance = countedCash - shift.expectedCash;

  db.prepare(`
    UPDATE shifts 
    SET status = 'blind_count', 
        countedCash = ?, 
        variance = ?, 
        blindCountAt = ?, 
        notes = COALESCE(notes || '; ', '') || ?,
        updatedAt = ?
    WHERE id = ?
  `).run(countedCash, variance, now, notes || '', now, shiftId);

  logger.info(`[Shift] Blind count for shift ${shiftId}: counted ${countedCash}, variance ${variance}`);
}

export function closeShift(
  shiftId: number,
  countedCash: number,
  cashDrawerCounts: CashDrawerCount[],
  notes?: string
): ShiftSummary {
  const shift = getShiftById(shiftId);
  if (!shift) throw new Error('Shift not found');
  if (shift.status === 'closed') throw new Error('Shift already closed');

  const now = new Date().toISOString();
  const variance = countedCash - shift.expectedCash;

  // Calculate totals
  const totals = calculateShiftTotals(shiftId);

  db.prepare(`
    UPDATE shifts 
    SET status = 'closed', 
        countedCash = ?, 
        variance = ?, 
        closedAt = ?, 
        expectedCash = ?,
        notes = COALESCE(notes || '; ', '') || ?,
        updatedAt = ?
    WHERE id = ?
  `).run(countedCash, variance, now, shift.expectedCash, notes || '', now, shiftId);

  // Record cash drawer breakdown
  for (const count of cashDrawerCounts) {
    db.prepare(`
      INSERT INTO shift_cash_counts (shiftId, denomination, count, total, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(shiftId, count.denomination, count.count, count.total, new Date().toISOString());
  }

  // Calculate summary
  const summary = generateShiftSummary(shiftId, countedCash, cashDrawerCounts);
  
  logger.info(`[Shift] Closed shift ${shiftId}: variance ${variance}`);
  return summary;
}

export function calculateShiftTotals(shiftId: number): any {
  const sales = db.prepare(`
    SELECT paymentMethod, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
    FROM shift_transactions
    WHERE shiftId = ? AND saleId IS NOT NULL
    GROUP BY paymentMethod
  `).all(shiftId) as any[];

  const totals = { cash: 0, card: 0, mobile: 0, total: 0, subtotal: 0, discount: 0 };
  const counts = { sales: 0, voids: 0, refunds: 0, returns: 0 };

  for (const s of sales) {
    const method = s.paymentMethod?.toLowerCase();
    if (method === 'cash') totals.cash = s.total;
    else if (method === 'card') totals.card = s.total;
    else if (method === 'mobile') totals.mobile = s.total;
    totals.total += s.total;
  }

  // Gross sales before discount, and the discount total. The fiscal X/Z report
  // prints both, so they have to come from the sale rows rather than being read
  // off the payment-method totals (which only carry what was tendered).
  const gross = db.prepare(`
    SELECT
      COALESCE(SUM(s.totalPrice + s.discount), 0) AS subtotal,
      COALESCE(SUM(s.discount), 0) AS discount
    FROM shift_transactions st
    JOIN sales s ON s.id = st.saleId
    WHERE st.shiftId = ? AND st.saleId IS NOT NULL
      AND COALESCE(s.is_deleted, 0) = 0
      AND COALESCE(s.status, '') NOT IN ('Voided', 'voided', 'cancelled', 'refunded')
  `).get(shiftId) as any;
  totals.subtotal = Number(gross?.subtotal || 0);
  totals.discount = Number(gross?.discount || 0);

  // Get void/refund counts
  const voids = db.prepare('SELECT COUNT(*) as c FROM sales WHERE shiftId = ? AND status = ?').get(shiftId, 'Voided') as any;
  const refunds = db.prepare('SELECT COUNT(*) as c FROM returns WHERE shiftId = ?').get(shiftId) as any;
  counts.voids = voids?.c || 0;
  counts.refunds = refunds?.c || 0;

  return { totals, counts };
}

export function generateShiftSummary(shiftId: number, countedCash: number, cashDrawerCounts: CashDrawerCount[]): ShiftSummary {
  const shift = getShiftById(shiftId)!;
  const totals = calculateShiftTotals(shiftId);
  const expected = shift.expectedCash;
  const variance = countedCash - expected;

  return {
    shift,
    totals: totals.totals,
    counts: totals.counts,
    cashDrawer: {
      expected,
      counted: countedCash,
      variance,
      breakdown: cashDrawerCounts,
    },
  };
}

// ============================================
// Cash Drawer Operations
// ============================================

export function getCashDrawerBreakdown(shiftId: number): CashDrawerCount[] {
  return db.prepare(`
    SELECT denomination, count, total
    FROM shift_cash_counts
    WHERE shiftId = ?
    ORDER BY denomination DESC
  `).all(shiftId) as CashDrawerCount[];
}

export function calculateExpectedCash(shiftId: number): number {
  const shift = getShiftById(shiftId);
  if (!shift) return 0;
  
  // Opening float + cash sales - cash refunds - cash paid out
  const cashSales = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM shift_transactions
    WHERE shiftId = ? AND paymentMethod = 'cash' AND saleId IS NOT NULL
  `).get(shiftId) as any;

  const cashRefunds = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM shift_transactions st
    JOIN returns r ON st.saleId = r.saleId
    WHERE st.shiftId = ? AND st.paymentMethod = 'cash' AND r.refundAmount > 0
  `).get(shiftId) as any;

  const cashPaidOut = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM shift_transactions
    WHERE shiftId = ? AND paymentMethod = 'cash' AND saleId IS NULL AND amount < 0
  `).get(shiftId) as any;

  return (shift.openingFloat || 0) + (cashSales?.total || 0) - (cashRefunds?.total || 0) + (cashPaidOut?.total || 0);
}

// ============================================
// Shift Transactions
// ============================================

export function addShiftTransaction(
  shiftId: number,
  saleId: number | null,
  paymentMethod: string,
  amount: number
): number {
  const result = db.prepare(`
    INSERT INTO shift_transactions (shiftId, saleId, paymentMethod, amount, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `).run(shiftId, saleId, paymentMethod, amount, new Date().toISOString());

  // Update expected cash
  const shift = getShiftById(arguments[0] as number);
  if (shift && shift.status === 'open') {
    const method = paymentMethod.toLowerCase();
    if (method === 'cash') {
      db.prepare('UPDATE shifts SET expectedCash = expectedCash + ? WHERE id = ?').run(amount, shiftId);
    }
  }

  return result.lastInsertRowid as number;
}

export function getShiftTransactions(shiftId: number): any[] {
  return db.prepare(`
    SELECT st.*, s.customerName, s.totalPrice
    FROM shift_transactions st
    LEFT JOIN sales s ON st.saleId = s.id
    WHERE st.shiftId = ?
    ORDER BY st.createdAt DESC
  `).all(shiftId) as any[];
}

// ============================================
// Shift Reports
// ============================================

export interface ShiftReportData {
  shift: Shift;
  transactions: any[];
  totals: {
    cash: number;
    card: number;
    mobile: number;
    total: number;
    /** Gross sales before discount. */
    subtotal: number;
    /** Total discount applied to the shift's sales. */
    discount: number;
  };
  counts: {
    sales: number;
    voids: number;
    refunds: number;
    returns: number;
  };
  cashDrawer: {
    expected: number;
    counted: number;
    variance: number;
    breakdown: CashDrawerCount[];
  };
  topItems: any[];
  categoryBreakdown: any[];
}

export function generateShiftReport(shiftId: number): ShiftReportData {
  const shift = getShiftById(shiftId)!;
  const transactions = getShiftTransactions(shiftId);
  const totals = calculateShiftTotals(shiftId);
  const cashDrawerCounts = getCashDrawerBreakdown(shiftId);
  const expectedCash = calculateExpectedCash(shiftId);
  const countedCash = shift.countedCash || 0;
  const variance = countedCash - expectedCash;

  // Top selling items
  const topItems = db.prepare(`
    SELECT i.name, SUM(sl.qty) as totalQty, SUM(sl.totalPrice) as totalRevenue
    FROM sales s
    JOIN sale_lines sl ON s.id = sl.saleId
    JOIN items i ON sl.itemId = i.id
    WHERE s.id IN (SELECT saleId FROM shift_transactions WHERE shiftId = ?)
    GROUP BY i.id
    ORDER BY totalQty DESC
    LIMIT 10
  `).all(shiftId) as any[];

  // Category breakdown
  const categoryBreakdown = db.prepare(`
    SELECT c.name as category, COUNT(*) as salesCount, SUM(sl.totalPrice) as revenue
    FROM sales s
    JOIN sale_lines sl ON s.id = sl.saleId
    JOIN items i ON sl.itemId = i.id
    JOIN categories c ON i.categoryId = c.id
    WHERE s.id IN (SELECT saleId FROM shift_transactions WHERE shiftId = ?)
    GROUP BY c.id
    ORDER BY revenue DESC
  `).all(shiftId) as any[];

  return {
    shift: getShiftById(shiftId)!,
    transactions,
    totals: {
      cash: totals.totals.cash,
      card: totals.totals.card,
      mobile: totals.totals.mobile,
      total: totals.totals.total,
      subtotal: totals.totals.subtotal,
      discount: totals.totals.discount,
    },
    counts: totals.counts,
    cashDrawer: {
      expected: calculateExpectedCash(shiftId),
      counted: shift.countedCash || 0,
      variance: (shift.countedCash || 0) - calculateExpectedCash(shiftId),
      breakdown: getCashDrawerBreakdown(shiftId),
    },
    topItems,
    categoryBreakdown,
  };
}

export function printShiftReport(shiftId: number, escposDriver: any): Uint8Array {
  const report = generateShiftReport(shiftId);
  const { EscposWriter } = require('../escpos');
  const w = new EscposWriter().init();

  const { shift, totals, counts, cashDrawer, topItems, categoryBreakdown } = report;

  w.align(1).bold(true).size(2, 2).text('SHIFT REPORT').lineFeed().size(1, 1).bold(false);
  w.align(0);
  w.text(`Shift: #${shift.id}`).lineFeed();
  w.text(`Register: ${shift.registerId}`).lineFeed();
  w.text(`Cashier: ${shift.cashierId}`).lineFeed();
  w.text(`Opened: ${shift.openedAt}`).lineFeed();
  w.text(`Closed: ${shift.closedAt || 'N/A'}`).lineFeed();
  w.text('------------------------------').lineFeed();

  // Totals
  w.bold(true).text('SALES SUMMARY').lineFeed().bold(false);
  w.column('Cash', `ETB ${totals.cash.toLocaleString()}`, 42);
  w.column('Card', `ETB ${totals.card.toLocaleString()}`, 42);
  w.column('Mobile', `ETB ${totals.mobile.toLocaleString()}`, 42);
  w.text('------------------------------').lineFeed();
  w.bold(true).column('TOTAL', `ETB ${totals.total.toLocaleString()}`, 42).bold(false).lineFeed();

  // Counts
  w.text('------------------------------').lineFeed();
  w.text(`Sales: ${counts.sales}`).lineFeed();
  w.text(`Voids: ${counts.voids}`).lineFeed();
  w.text(`Refunds: ${counts.refunds}`).lineFeed();
  w.text(`Returns: ${counts.returns}`).lineFeed();

  // Cash drawer
  w.text('------------------------------').lineFeed();
  w.bold(true).text('CASH DRAWER').lineFeed().bold(false);
  w.column('Expected', `ETB ${cashDrawer.expected.toLocaleString()}`, 42);
  w.column('Counted', `ETB ${cashDrawer.counted.toLocaleString()}`, 42);
  w.column('Variance', `ETB ${cashDrawer.variance.toLocaleString()}`, 42);
  w.text('------------------------------').lineFeed();

  for (const c of cashDrawer.breakdown) {
    w.column(`${c.denomination} x ${c.count}`, `ETB ${c.total.toLocaleString()}`, 42);
  }

  w.text('------------------------------').lineFeed();

  // Top items
  if (report.topItems.length > 0) {
    w.bold(true).text('TOP ITEMS').lineFeed().bold(false);
    for (const item of report.topItems.slice(0, 5)) {
      w.text(`${item.name} x${item.totalQty} - ETB ${item.totalRevenue.toLocaleString()}`).lineFeed();
    }
  }

  w.cut(true);
  return w.toUint8Array();
}

export default {
  openShift,
  getOpenShift,
  getShiftById,
  getLastShiftByCashier,
  recordMidShiftAudit,
  recordBlindCount,
  closeShift,
  calculateShiftTotals,
  generateShiftSummary,
  getCashDrawerBreakdown,
  calculateExpectedCash,
  addShiftTransaction,
  getShiftTransactions,
  generateShiftReport,
  printShiftReport,
};