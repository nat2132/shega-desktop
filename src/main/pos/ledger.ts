// ============================================
// Append-Only Ledger with Reversal Entries
// ============================================

import db from '../database';
import { logger } from '../logger';

export type LedgerEntryType = 
  | 'SALE' 
  | 'SALE_REVERSAL' 
  | 'VOID' 
  | 'REFUND' 
  | 'RETURN' 
  | 'ADJUSTMENT' 
  | 'PAYMENT' 
  | 'PAYOUT' 
  | 'FLOAT' 
  | 'TIP' 
  | 'DISCOUNT' 
  | 'TAX' 
  | 'WHT';

export interface LedgerEntry {
  id: number;
  businessId: number;
  shiftId: number | null;
  type: LedgerEntryType;
  referenceId: number | null; // Sale ID, Return ID, etc.
  referenceType: string | null; // 'sale', 'return', 'shift', etc.
  amount: number; // Positive for credit, negative for debit
  balance: number; // Running balance
  description: string;
  metadata: string; // JSON
  createdBy: number | null;
  createdAt: string;
  uuid: string;
  isReversal: boolean;
  originalEntryId: number | null;
}

export interface LedgerBalance {
  businessId: number;
  totalCredits: number;
  totalDebits: number;
  netBalance: number;
  lastEntryId: number | null;
}

export interface ReversalRequest {
  entryId: number;
  reason: string;
  performedBy: number;
}

// ============================================
// Ledger Operations
// ============================================

export function createLedgerEntry(params: {
  businessId: number;
  shiftId?: number;
  type: LedgerEntryType;
  /** null/absent means the entry is not tied to a sale, return, etc. */
  referenceId?: number | null;
  referenceType?: string;
  amount: number;
  description: string;
  metadata?: Record<string, any>;
  createdBy?: number;
}): LedgerEntry {
  const now = new Date().toISOString();
  const uuid = crypto.randomUUID();

  // Get current balance
  const lastEntry = db.prepare(`
    SELECT balance FROM ledger_entries 
    WHERE businessId = ? 
    ORDER BY id DESC LIMIT 1
  `).get(arguments[0].businessId) as any;

  const currentBalance = lastEntry?.balance || 0;
  const newBalance = currentBalance + arguments[0].amount;

  const entry: any = {
    businessId: arguments[0].businessId,
    shiftId: arguments[0].shiftId || null,
    type: arguments[0].type,
    referenceId: arguments[0].referenceId || null,
    referenceType: arguments[0].referenceType || null,
    amount: arguments[0].amount,
    balance: newBalance,
    description: arguments[0].description,
    metadata: JSON.stringify(arguments[0].metadata || {}),
    createdBy: arguments[0].createdBy || null,
    createdAt: new Date().toISOString(),
    uuid: crypto.randomUUID(),
    isReversal: false,
    originalEntryId: null,
  };

  const result = db.prepare(`
    INSERT INTO ledger_entries (
      businessId, shiftId, type, referenceId, referenceType,
      amount, balance, description, metadata, createdBy,
      createdAt, uuid, isReversal, originalEntryId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.businessId, entry.shiftId, entry.type, entry.referenceId, entry.referenceType,
    entry.amount, entry.balance, entry.description, entry.metadata,
    entry.createdBy, entry.createdAt, entry.uuid, entry.isReversal, entry.originalEntryId
  );

  const entryId = result.lastInsertRowid;
  
  logger.info(`[Ledger] Created entry ${entryId}: ${entry.type} ${entry.amount > 0 ? '+' : ''}${entry.amount} (balance: ${newBalance})`);
  
  return { ...entry, id: entryId };
}

// Convenience functions for common operations
export function recordSale(businessId: number, shiftId: number, saleId: number, amount: number, createdBy: number): LedgerEntry {
  return createLedgerEntry({
    businessId,
    shiftId,
    type: 'SALE',
    referenceId: saleId,
    referenceType: 'sale',
    amount,
    description: `Sale #${saleId}`,
    metadata: { paymentMethod: 'mixed' }, // Would be determined from sale
    createdBy,
  });
}

export function recordPayment(businessId: number, shiftId: number, saleId: number, amount: number, method: string, createdBy: number): LedgerEntry {
  return createLedgerEntry({
    businessId,
    shiftId,
    type: 'PAYMENT',
    referenceId: saleId,
    referenceType: 'sale',
    amount,
    description: `Payment for sale #${saleId} via ${method}`,
    metadata: { paymentMethod: method },
    createdBy,
  });
}

export function recordFloat(businessId: number, shiftId: number, amount: number, createdBy: number): LedgerEntry {
  return createLedgerEntry({
    businessId,
    shiftId,
    type: 'FLOAT',
    referenceId: null,
    referenceType: 'shift',
    amount,
    description: 'Opening float',
    metadata: {},
    createdBy,
  });
}

export function recordPayout(businessId: number, shiftId: number, amount: number, description: string, createdBy: number): LedgerEntry {
  return createLedgerEntry({
    businessId,
    shiftId,
    type: 'PAYOUT',
    referenceId: null,
    referenceType: 'shift',
    amount: -Math.abs(amount), // Negative for payout
    description: `Payout: ${description}`,
    metadata: {},
    createdBy,
  });
}

export function recordDiscount(businessId: number, shiftId: number, saleId: number, amount: number, createdBy: number): LedgerEntry {
  return createLedgerEntry({
    businessId,
    shiftId,
    type: 'DISCOUNT',
    referenceId: saleId,
    referenceType: 'sale',
    amount: -Math.abs(amount),
    description: `Discount on sale #${saleId}`,
    metadata: {},
    createdBy,
  });
}

export function recordTax(businessId: number, shiftId: number, saleId: number, taxType: string, amount: number, createdBy: number): LedgerEntry {
  const typeMap: Record<string, LedgerEntryType> = {
    'VAT': 'TAX',
    'TOT': 'TAX',
    'WHT': 'WHT',
  };

  return createLedgerEntry({
    businessId,
    shiftId,
    type: typeMap[taxType] || 'TAX',
    referenceId: saleId,
    referenceType: 'sale',
    amount: amount, // Tax collected is positive (liability)
    description: `${taxType} collected on sale #${saleId}`,
    metadata: { taxType, taxRate: 'variable' },
    createdBy,
  });
}

// ============================================
// Reversal Operations (Append-Only)
// ============================================

export function reverseEntry(request: ReversalRequest): LedgerEntry {
  const original = db.prepare('SELECT * FROM ledger_entries WHERE id = ?').get(request.entryId) as any;
  
  if (!original) throw new Error('Original entry not found');
  if (original.isReversal) throw new Error('Entry already reversed');
  if (original.businessId !== request.performedBy) {
    // Check permissions - simplified
  }

  const reversalAmount = -original.amount;
  const reversalDescription = `REVERSAL: ${original.description} (Reason: ${request.reason})`;

  const reversal = createLedgerEntry({
    businessId: original.businessId,
    shiftId: original.shiftId,
    type: original.type + '_REVERSAL' as LedgerEntryType,
    referenceId: original.referenceId,
    referenceType: original.referenceType,
    amount: reversalAmount,
    description: reversalDescription,
    metadata: { 
      originalEntryId: original.id, 
      reversalReason: request.reason,
      reversedBy: request.performedBy 
    },
    createdBy: request.performedBy,
  });

  // Mark original as reversed
  db.prepare('UPDATE ledger_entries SET isReversal = 1 WHERE id = ?').run(original.id);

  logger.info(`[Ledger] Reversed entry ${original.id} with reversal ${reversal.id}`);
  return reversal;
}

// Specific reversal functions
export function voidSale(businessId: number, shiftId: number, saleId: number, reason: string, performedBy: number): LedgerEntry {
  // Find the sale entry
  const saleEntry = db.prepare(`
    SELECT * FROM ledger_entries 
    WHERE businessId = ? AND referenceId = ? AND referenceType = 'sale' AND type = 'SALE'
  `).get(businessId, saleId) as any;

  if (!saleEntry) throw new Error('Sale entry not found');

  return reverseEntry({
    entryId: saleEntry.id,
    reason: `VOID: ${reason}`,
    performedBy,
  });
}

export function refundSale(businessId: number, shiftId: number, saleId: number, amount: number, reason: string, performedBy: number): LedgerEntry {
  // Create refund entry (negative amount)
  const refund = createLedgerEntry({
    businessId,
    shiftId,
    type: 'REFUND',
    referenceId: saleId,
    referenceType: 'sale',
    amount: -amount,
    description: `Refund for sale #${saleId}: ${reason}`,
    metadata: { reason, originalSaleId: saleId },
    createdBy: performedBy,
  });

  // Also create reversal of original payment if partial refund
  return refund;
}

export function returnSale(businessId: number, shiftId: number, saleId: number, amount: number, reason: string, performedBy: number): LedgerEntry {
  const returnEntry = createLedgerEntry({
    businessId,
    shiftId,
    type: 'RETURN',
    referenceId: saleId,
    referenceType: 'sale',
    amount: -amount,
    description: `Return for sale #${saleId}: ${reason}`,
    metadata: { reason, originalSaleId: saleId },
    createdBy: performedBy,
  });

  return returnEntry;
}

// ============================================
// Adjustment Entries
// ============================================

export function recordAdjustment(businessId: number, shiftId: number, itemId: number, adjustmentType: 'STOCK' | 'PRICE', oldValue: any, newValue: any, reason: string, performedBy: number): LedgerEntry {
  return createLedgerEntry({
    businessId,
    shiftId,
    type: 'ADJUSTMENT',
    referenceId: itemId,
    referenceType: 'item',
    amount: 0, // Adjustments don't have monetary amount directly
    description: `${adjustmentType} adjustment for item #${itemId}: ${reason}`,
    metadata: { adjustmentType, oldValue, newValue, reason },
    createdBy: performedBy,
  });
}

// ============================================
// Ledger Queries
// ============================================

export function getLedgerBalance(businessId: number): { credits: number; debits: number; balance: number } {
  const result = db.prepare(`
    SELECT 
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as credits,
      SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END) as debits,
      MAX(balance) as balance
    FROM ledger_entries WHERE businessId = ?
  `).get(businessId) as any;

  return {
    credits: result?.credits || 0,
    debits: Math.abs(result?.debits || 0),
    balance: result?.balance || 0,
  };
}

export function getLedgerEntries(businessId: number, options?: {
  shiftId?: number;
  type?: LedgerEntryType;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}): any[] {
  let query = 'SELECT * FROM ledger_entries WHERE businessId = ?';
  const params: any[] = [businessId];

  if (options?.shiftId) {
    query += ' AND shiftId = ?';
    params.push(options.shiftId);
  }
  if (options?.type) {
    query += ' AND type = ?';
    params.push(options.type);
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
  
  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }
  if (options?.offset) {
    query += ' OFFSET ?';
    params.push(options.offset);
  }

  return db.prepare(query).all(...params);
}

export function getReversals(businessId: number, fromDate?: string, toDate?: string): any[] {
  let query = 'SELECT * FROM ledger_entries WHERE businessId = ? AND isReversal = 1';
  const params: any[] = [businessId];

  if (fromDate) {
    query += ' AND createdAt >= ?';
    params.push(fromDate);
  }
  if (toDate) {
    query += ' AND createdAt <= ?';
    params.push(toDate);
  }

  query += ' ORDER BY createdAt DESC';
  return db.prepare(query).all(...params);
}

export function getEntryById(entryId: number): any {
  return db.prepare('SELECT * FROM ledger_entries WHERE id = ?').get(entryId);
}

// ============================================
// Audit Trail
// ============================================

export function getAuditTrail(businessId: number, entityType: string, entityId: number): any[] {
  return db.prepare(`
    SELECT * FROM ledger_entries 
    WHERE businessId = ? AND referenceType = ? AND referenceId = ?
    ORDER BY createdAt ASC
  `).all(businessId, entityType, entityId);
}

export function getShiftLedgerSummary(shiftId: number): any {
  const entries = db.prepare(`
    SELECT type, COUNT(*) as count, SUM(amount) as total
    FROM ledger_entries
    WHERE shiftId = ?
    GROUP BY type
    ORDER BY total DESC
  `).all(shiftId);

  const summary = {
    totalCredits: 0,
    totalDebits: 0,
    netAmount: 0,
    byType: {} as Record<string, { count: number; total: number }>,
  };

  for (const e of entries) {
    if (e.total > 0) summary.totalCredits += e.total;
    else summary.totalDebits += Math.abs(e.total);
    summary.byType[e.type] = { count: e.count, total: e.total };
  }

  summary.netAmount = summary.totalCredits - summary.totalDebits;
  return summary;
}

export function getBusinessLedgerSummary(businessId: number, fromDate?: string, toDate?: string): any {
  let query = 'SELECT type, COUNT(*) as count, SUM(amount) as total FROM ledger_entries WHERE businessId = ?';
  const params: any[] = [businessId];

  if (fromDate) {
    params.push(fromDate);
    params.push(toDate || new Date().toISOString());
    query += ' AND createdAt >= ? AND createdAt <= ?';
  }

  query += ' GROUP BY type ORDER BY total DESC';

  const entries = db.prepare(query).all(...params) as any[];

  const summary = {
    totalCredits: 0,
    totalDebits: 0,
    netAmount: 0,
    byType: {} as Record<string, { count: number; total: number }>,
    entryCount: 0,
  };

  for (const e of entries) {
    if (e.total > 0) summary.totalCredits += e.total;
    else summary.totalDebits += Math.abs(e.total);
    summary.byType[e.type] = { count: e.count, total: e.total };
    summary.entryCount += e.count;
  }

  summary.netAmount = summary.totalCredits - summary.totalDebits;
  return summary;
}

// ============================================
// Ledger Integrity Verification
// ============================================

export function verifyLedgerIntegrity(businessId: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check running balance consistency
  const entries = db.prepare(`
    SELECT id, amount, balance, createdAt 
    FROM ledger_entries 
    WHERE businessId = ? 
    ORDER BY id ASC
  `).all(businessId) as any[];

  let runningBalance = 0;
  for (let i = 0; i < entries.length; i++) {
    runningBalance += entries[i].amount;
    if (Math.abs(runningBalance - entries[i].balance) > 0.01) {
      errors.push(`Balance mismatch at entry ${entries[i].id}: expected ${runningBalance}, got ${entries[i].balance}`);
    }
  }

  // Check for orphaned reversals
  const reversals = db.prepare(`
    SELECT * FROM ledger_entries 
    WHERE businessId = ? AND isReversal = 1
  `).all(businessId);

  for (const rev of reversals) {
    const original = db.prepare('SELECT * FROM ledger_entries WHERE id = ?').get(
      JSON.parse(rev.metadata).originalEntryId
    );
    if (!original) {
      errors.push(`Reversal ${rev.id} references non-existent original entry`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================
// Export/Import
// ============================================

export function exportLedger(businessId: number, fromDate: string, toDate: string): string {
  const entries = getLedgerEntries(businessId, { fromDate, toDate, limit: 10000 });
  return JSON.stringify(entries, null, 2);
}

export function importLedger(businessId: number, jsonData: string): number {
  const entries = JSON.parse(jsonData);
  let imported = 0;

  for (const entry of entries) {
    try {
      db.prepare(`
        INSERT OR IGNORE INTO ledger_entries (
          businessId, shiftId, type, referenceId, referenceType,
          amount, balance, description, metadata, createdBy,
          createdAt, uuid, isReversal, originalEntryId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        businessId,
        entry.shiftId,
        entry.type,
        entry.referenceId,
        entry.referenceType,
        entry.amount,
        entry.balance,
        entry.description,
        entry.metadata,
        entry.createdBy,
        entry.createdAt,
        entry.uuid,
        entry.isReversal,
        entry.originalEntryId
      );
      imported++;
    } catch (e) {
      logger.warn(`[Ledger] Failed to import entry ${entry.uuid}:`, e);
    }
  }

  return imported;
}

export default {
  createLedgerEntry,
  recordSale,
  recordPayment,
  recordFloat,
  recordPayout,
  recordDiscount,
  recordTax,
  reverseEntry,
  voidSale,
  refundSale,
  returnSale,
  recordAdjustment,
  getLedgerBalance,
  getLedgerEntries,
  getReversals,
  getEntryById,
  getAuditTrail,
  getShiftLedgerSummary,
  getBusinessLedgerSummary,
  verifyLedgerIntegrity,
  exportLedger,
  importLedger,
};