// ============================================
// X/Z Fiscal Reports
// Z-Report: End of day, closes shift
// X-Report: Mid-day, no closure
// ============================================

import { EscposWriter } from '../escpos';
import db from '../database';
import { getShiftById, calculateShiftTotals, generateShiftReport, printShiftReport } from '../pos/shifts';
import { logger } from '../logger';

export type ReportType = 'X' | 'Z';

export interface FiscalReportData {
  reportType: ReportType;
  reportNumber: number;
  businessName: string;
  tin: string;
  address: string;
  date: string;
  time: string;
  shift: any;
  totals: {
    grossSales: number;
    netSales: number;
    vat: number;
    tot: number;
    discounts: number;
    voids: number;
    refunds: number;
    cash: number;
    card: number;
    mobile: number;
    total: number;
  };
  taxBreakdown: {
    vat15: number;
    tot2: number;
    tot10: number;
    exempt: number;
    withholding: number;
  };
  paymentBreakdown: {
    cash: number;
    card: number;
    mobile: number;
    other: number;
  };
  voids: { count: number; amount: number; reasons: string[] };
  refunds: { count: number; amount: number };
  returns: { count: number; amount: number };
  cashDrawer: {
    openingFloat: number;
    expectedCash: number;
    countedCash: number;
    variance: number;
    breakdown: any[];
  };
  topItems: any[];
  categoryBreakdown: any[];
  fiscalSignature: {
    fiscalNumber: string;
    signature: string | null;
  };
}

let reportCounter = 0;

// ============================================
// Report Generation
// ============================================

export function generateXReport(businessId: number, registerId: number): FiscalReportData {
  const openShift = db.prepare(`
    SELECT * FROM shifts 
    WHERE registerId = ? AND status IN ('open', 'mid_audit', 'blind_count')
    ORDER BY openedAt DESC LIMIT 1
  `).get(registerId) as any;

  const shift = openShift || { id: 0, registerId, businessId, openingFloat: 0, expectedCash: 0, status: 'open', openedAt: new Date().toISOString() };

  return generateReportData('X', businessId, shift, false);
}

export function generateZReport(businessId: number, registerId: number, countedCash: number, cashDrawerCounts: any[]): FiscalReportData {
  const shift = db.prepare(`
    SELECT * FROM shifts 
    WHERE registerId = ? AND status IN ('open', 'mid_audit', 'blind_count')
    ORDER BY openedAt DESC LIMIT 1
  `).get(registerId) as any;

  if (!shift) throw new Error('No open shift to close');

  // Close the shift
  const closeResult = closeShiftForReport(shift.id, countedCash, []);
  
  return generateReportData('Z', shift.businessId, shift, true, closeResult);
}

function closeShiftForReport(shiftId: number, countedCash: number, cashDrawerCounts: any[]) {
  const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(countedCash) as any; // reuse parameter
  // Actually we need to close the shift properly
  return closeShift(shiftId, countedCash, []);
}

function closeShift(shiftId: number, countedCash: number, cashDrawerCounts: any[]) {
  const shift = getShiftById(shiftId);
  if (!shift) throw new Error('Shift not found');

  const now = new Date().toISOString();
  const variance = countedCash - shift.expectedCash;

  // Close in transaction
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE shifts 
      SET status = 'closed', 
          countedCash = ?, 
          variance = ?, 
          closedAt = ?, 
          updatedAt = ?
      WHERE id = ?
    `).run(countedCash, variance, new Date().toISOString(), new Date().toISOString(), shiftId);

    // Record cash drawer counts
    // (would insert into shift_cash_counts table)
  });
  tx();

  return { variance, closedAt: new Date().toISOString() };
}

// Reuse shift functions
function getShiftById(shiftId: number) {
  return db.prepare('SELECT * FROM shifts WHERE id = ?').get(shiftId);
}

function getShiftById(shiftId: number): any {
  return db.prepare('SELECT * FROM shifts WHERE id = ?').get(shiftId);
}

// Actually, let me re-export from shifts module
import { 
  getShiftById as getShift, 
  calculateShiftTotals, 
  generateShiftReport,
  calculateExpectedCash,
  getCashDrawerBreakdown 
} from './pos/shifts';

// ============================================
// Main Report Generation
// ============================================

export function generateReportData(
  reportType: ReportType,
  businessId: number,
  shift: any,
  isZReport: boolean,
  closeResult?: any
): FiscalReportData {
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId) as any;
  const settings = db.prepare('SELECT * FROM settings WHERE key IN (?, ?, ?, ?)').all('tin', 'business_name', 'address', 'phone') as any[];
  const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));

  reportCounter++;
  const reportNumber = reportCounter;

  const shiftReport = generateShiftReport(shift.id);
  const totals = calculateShiftTotals(shift.id);
  const expectedCash = calculateExpectedCash(shift.id);
  const cashDrawerCounts = getCashDrawerBreakdown(shift.id);
  const expectedCashAmount = calculateExpectedCash(shift.id);
  const countedCash = shift.countedCash || 0;
  const variance = countedCash - expectedCashAmount;

  // Calculate tax breakdown
  const taxBreakdown = calculateTaxBreakdown(shift.id);
  
  // Voids
  const voids = getVoids(shift.id);
  
  // Refunds
  const refunds = getRefunds(shift.id);
  
  // Returns
  const returns = getReturns(shift.id);

  // Top items
  const topItems = getTopItems(shift.id);

  // Category breakdown
  const categoryBreakdown = getCategoryBreakdown(shift.id);

  // Fiscal signature
  const fiscalSignature = generateFiscalSignature(shift.id);

  return {
    reportType: reportType as ReportType,
    reportNumber,
    businessName: settingsMap?.business_name || business?.businessName || 'Shega POS',
    tin: settingsMap?.tin || '',
    address: settingsMap?.address || business?.address || '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toISOString().split('T')[1].substring(0, 8),
    shift: {
      id: shift.id,
      registerId: shift.registerId,
      cashierId: shift.cashierId,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt,
    },
    totals: {
      grossSales: shiftReport.totals.subtotal,
      netSales: shiftReport.totals.total,
      vat: taxBreakdown.vat15,
      tot: taxBreakdown.tot2 + taxBreakdown.tot10,
      discounts: shiftReport.totals.discount,
      voids: voids.amount,
      refunds: refunds.amount,
      cash: shiftReport.totals.cash,
      card: shiftReport.totals.card,
      mobile: shiftReport.totals.mobile,
      total: shiftReport.totals.total,
    },
    taxBreakdown,
    paymentBreakdown: {
      cash: shiftReport.totals.cash,
      card: shiftReport.totals.card,
      mobile: shiftReport.totals.mobile,
      other: 0,
    },
    voids: { count: voids.count, amount: voids.amount, reasons: voids.reasons },
    refunds: { count: refunds.count, amount: refunds.amount },
    returns: { count: returns.count, amount: returns.amount },
    cashDrawer: {
      openingFloat: shift.openingFloat,
      expectedCash: expectedCashAmount,
      countedCash: shift.countedCash || 0,
      variance,
      breakdown: getCashDrawerBreakdown(shift.id),
    },
    topItems: topItems.slice(0, 10),
    categoryBreakdown,
    fiscalSignature,
  };
}

function calculateTaxBreakdown(shiftId: number) {
  const sales = db.prepare(`
    SELECT sl.*, i.taxType, i.taxRate
    FROM sales s
    JOIN sale_lines sl ON s.id = sl.saleId
    JOIN items i ON sl.itemId = i.id
    WHERE s.id IN (SELECT saleId FROM shift_transactions WHERE shiftId = ?)
  `).all(shiftId) as any[];

  let vat15 = 0, tot2 = 0, tot10 = 0, exempt = 0, withholding = 0;

  for (const line of sales) {
    const taxType = line.taxType || 'VAT';
    const taxRate = line.taxRate || 0.15;
    const taxAmount = (line.totalPrice - line.discount) * taxRate;

    if (taxType === 'VAT') vat15 += taxAmount;
    else if (taxType === 'TOT') {
      if (taxRate >= 0.1) tot10 += taxAmount;
      else tot2 += taxAmount;
    } else if (taxType === 'EXEMPT') exempt += line.totalPrice - line.discount;
    else if (taxType === 'WHT') withholding += taxAmount;
  }

  return { vat15, tot2, tot10, exempt, withholding };
}

function getVoids(shiftId: number) {
  const voids = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(totalPrice), 0) as amount,
           GROUP_CONCAT(voidReason) as reasons
    FROM sales 
    WHERE id IN (SELECT saleId FROM shift_transactions WHERE shiftId = ?)
    AND status = 'Voided'
  `).get(shiftId) as any;

  return {
    count: voids?.count || 0,
    amount: voids?.amount || 0,
    reasons: voids?.reasons?.split(',').filter(Boolean) || [],
  };
}

function getRefunds(shiftId: number) {
  const refunds = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(refundAmount), 0) as amount
    FROM returns 
    WHERE saleId IN (SELECT saleId FROM shift_transactions WHERE shiftId = ?)
  `).get(shiftId) as any;

  return { count: refunds?.count || 0, amount: refunds?.amount || 0 };
}

function getReturns(shiftId: number) {
  const returns = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(refundAmount), 0) as amount
    FROM returns 
    WHERE saleId IN (SELECT saleId FROM shift_transactions WHERE shiftId = ?)
  `).get(shiftId) as any;

  return { count: returns?.count || 0, amount: returns?.amount || 0 };
}

function getTopItems(shiftId: number) {
  return db.prepare(`
    SELECT i.name, SUM(sl.qty) as totalQty, SUM(sl.totalPrice) as totalRevenue
    FROM sales s
    JOIN sale_lines sl ON s.id = sl.saleId
    JOIN items i ON sl.itemId = i.id
    WHERE s.id IN (SELECT saleId FROM shift_transactions WHERE shiftId = ?)
    GROUP BY i.id
    ORDER BY totalQty DESC
    LIMIT 20
  `).all(shiftId);
}

function getCategoryBreakdown(shiftId: number) {
  return db.prepare(`
    SELECT c.name as category, COUNT(*) as salesCount, SUM(sl.totalPrice) as revenue
    FROM sales s
    JOIN sale_lines sl ON s.id = sl.saleId
    JOIN items i ON sl.itemId = i.id
    JOIN categories c ON i.categoryId = c.id
    WHERE s.id IN (SELECT saleId FROM shift_transactions WHERE shiftId = ?)
    GROUP BY c.id
    ORDER BY revenue DESC
  `).all(shiftId);
}

function generateFiscalSignature(shiftId: number) {
  // In production, this would call the fiscal adapter
  return {
    fiscalNumber: `F-${String(shiftId).padStart(8, '0')}`,
    signature: null,
  };
}

// ============================================
// Report Printing (ESC/POS)
// ============================================

export function printFiscalReport(report: any, escposDriver: any): Uint8Array {
  const { EscposWriter } = require('../escpos');
  const w = new EscposWriter().init();

  const WIDTH = 42;

  function center(s: string): string {
    if (s.length >= WIDTH) return s.slice(0, WIDTH);
    const pad = Math.floor((WIDTH - s.length) / 2);
    return ' '.repeat(pad) + s + ' '.repeat(WIDTH - s.length - pad);
  }

  function money(n: number): string {
    return `ETB ${(Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const divider = '-'.repeat(WIDTH);

  w.align(1).bold(true).size(2, 2).text(report.reportType === 'Z' ? 'Z-REPORT' : 'X-REPORT').lineFeed().size(1, 1).bold(false);
  w.align(1).text(report.businessName.slice(0, WIDTH)).lineFeed();
  if (report.tin) w.text(`TIN: ${report.tin}`).lineFeed();
  if (report.address) w.align(1).text(report.address.slice(0, WIDTH)).lineFeed().align(0);
  w.text(`Date: ${report.date}  Time: ${report.time}`).lineFeed();
  w.text(`Report #${report.reportNumber}`).lineFeed();
  w.text(divider).lineFeed();

  // Shift info
  w.text(`Shift: ${report.shift.id}  Register: ${report.shift.registerId}`).lineFeed();
  w.text(`Cashier: ${report.shift.cashierId}`).lineFeed();
  w.text(`Opened: ${report.shift.openedAt?.slice(0, 16).replace('T', ' ')}`).lineFeed();
  if (report.shift.closedAt) w.text(`Closed: ${report.shift.closedAt.slice(0, 16).replace('T', ' ')}`).lineFeed();
  w.text(divider).lineFeed();

  // Sales Summary
  w.bold(true).text('SALES SUMMARY').lineFeed().bold(false);
  w.column('Gross Sales', money(report.totals.grossSales), WIDTH);
  w.column('Discounts', money(-report.totals.discounts), WIDTH);
  w.column('Net Sales', money(report.totals.netSales), WIDTH);
  w.text(divider).lineFeed();

  // Tax breakdown
  w.bold(true).text('TAX BREAKDOWN').lineFeed().bold(false);
  if (report.taxBreakdown.vat15 > 0) w.column('VAT 15%', money(report.taxBreakdown.vat15), WIDTH);
  if (report.taxBreakdown.tot2 > 0) w.column('TOT 2%', money(report.taxBreakdown.tot2), WIDTH);
  if (report.taxBreakdown.tot10 > 0) w.column('TOT 10%', money(report.taxBreakdown.tot10), WIDTH);
  if (report.taxBreakdown.exempt > 0) w.column('Exempt', money(report.taxBreakdown.exempt), WIDTH);
  if (report.taxBreakdown.withholding > 0) w.column('WHT', money(report.taxBreakdown.withholding), WIDTH);
  w.text(divider).lineFeed();

  // Totals
  w.bold(true).column('NET SALES', money(report.totals.netSales), WIDTH).bold(false).lineFeed();
  w.text(divider).lineFeed();

  // Payment breakdown
  w.bold(true).text('PAYMENT METHODS').lineFeed().bold(false);
  w.column('Cash', money(report.paymentBreakdown.cash), WIDTH);
  w.column('Card', money(report.paymentBreakdown.card), WIDTH);
  w.column('Mobile', money(report.paymentBreakdown.mobile), WIDTH);
  w.text(divider).lineFeed();

  // Voids/Refunds/Returns
  w.column('Voids', `${report.voids.count} (${money(-report.voids.amount)})`, WIDTH);
  w.column('Refunds', `${report.refunds.count} (${money(-report.refunds.amount)})`, WIDTH);
  w.column('Returns', `${report.returns.count} (${money(-report.returns.amount)})`, WIDTH);
  w.text(divider).lineFeed();

  // Cash drawer
  w.bold(true).text('CASH DRAWER').lineFeed().bold(false);
  w.column('Opening Float', money(report.cashDrawer.openingFloat), WIDTH);
  w.column('Expected Cash', money(report.cashDrawer.expectedCash), WIDTH);
  w.column('Counted Cash', money(report.cashDrawer.countedCash), WIDTH);
  w.column('Variance', money(report.cashDrawer.variance), WIDTH);
  w.text(divider).lineFeed();

  for (const c of report.cashDrawer.breakdown) {
    w.column(`${c.denomination} x ${c.count}`, money(c.total), WIDTH);
  }
  w.text(divider).lineFeed();

  // Top items
  if (report.topItems.length > 0) {
    w.bold(true).text('TOP ITEMS').lineFeed().bold(false);
    for (const item of report.topItems.slice(0, 5)) {
      w.text(`${item.name} x${item.totalQty} - ${money(item.totalRevenue)}`).lineFeed();
    }
    w.text(divider).lineFeed();
  }

  // Category breakdown
  if (report.categoryBreakdown.length > 0) {
    w.bold(true).text('BY CATEGORY').lineFeed().bold(false);
    for (const cat of report.categoryBreakdown.slice(0, 10)) {
      w.column(cat.category, money(cat.revenue), WIDTH);
    }
    w.text(divider).lineFeed();
  }

  // Fiscal info
  w.text(`Fiscal #: ${report.fiscalSignature.fiscalNumber}`).lineFeed();
  if (report.fiscalSignature.signature) {
    w.text(`Sig: ${report.fiscalSignature.signature}`).lineFeed();
  }
  w.text(divider).lineFeed();
  w.align(1).text('Thank you!').lineFeed(2).align(0);

  w.cut(true);
  return w.toUint8Array();
}

export default {
  generateXReport,
  generateZReport,
  generateReportData,
  printFiscalReport,
};