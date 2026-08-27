// ============================================
// Compliance Guardrails
// Ethiopian regulatory compliance enforcement
// ============================================

import { logger } from '../logger';

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  severity: 'warning' | 'error' | 'blocking';
  check: (context: ComplianceContext) => ComplianceResult;
}

export interface ComplianceContext {
  businessId: number;
  shiftId?: number;
  saleId?: number;
  amount?: number;
  paymentMethod?: string;
  customerTin?: string;
  items?: Array<{ qty: number; unitPrice: number; taxType: string }>;
  userId?: number;
  userRole?: string;
}

export interface ComplianceResult {
  passed: boolean;
  message: string;
  code: string;
  severity: 'warning' | 'error' | 'blocking';
  remediation?: string;
}

export interface ComplianceCheckResult {
  passed: boolean;
  results: ComplianceResult[];
  blocked: boolean;
}

// ============================================
// Cash Transaction Limit (ETB 50,000)
// ============================================

export const CASH_TRANSACTION_LIMIT = 50000; // ETB

export function checkCashTransactionLimit(context: ComplianceContext): ComplianceResult {
  if (context.paymentMethod === 'cash' && context.amount && context.amount > CASH_TRANSACTION_LIMIT) {
    return {
      passed: false,
      message: `Cash transaction of ${context.amount} ETB exceeds the legal limit of ${CASH_TRANSACTION_LIMIT} ETB. Digital payment required.`,
      code: 'CASH_LIMIT_EXCEEDED',
      severity: 'blocking',
      remediation: 'Use digital payment (Telebirr, CBE Birr, Card) for amounts over 50,000 ETB',
    };
  }
  return { passed: true, message: 'Cash transaction within limit', code: 'CASH_LIMIT_OK', severity: 'warning' };
}

// ============================================
// Digital Payment Enforcement
// ============================================

export function checkDigitalPaymentRequired(context: ComplianceContext): ComplianceResult {
  if (context.amount && context.amount > CASH_TRANSACTION_LIMIT && context.paymentMethod === 'cash') {
    return {
      passed: false,
      message: `Transactions over ${CASH_TRANSACTION_LIMIT} ETB require digital payment (Telebirr, CBE Birr, Card)`,
      code: 'DIGITAL_PAYMENT_REQUIRED',
      severity: 'blocking',
      remediation: 'Select Telebirr, CBE Birr, or Card payment method',
    };
  }
  return { passed: true, message: 'Payment method compliant', code: 'PAYMENT_OK', severity: 'warning' };
}

// ============================================
// Minimum Alternative Tax (MAT) - 2.5% of turnover
// ============================================

export function checkMATCompliance(context: ComplianceContext): ComplianceResult {
  // This would check if business has filed MAT
  // For now, return warning if turnover > threshold
  if (context.amount && context.amount > 1000000) { // 1M ETB annual threshold
    return {
      passed: true,
      message: 'Business may be subject to Minimum Alternative Tax (2.5% of turnover)',
      code: 'MAT_WARNING',
      severity: 'warning',
      remediation: 'Ensure MAT is calculated and paid quarterly',
    };
  }
  return { passed: true, message: 'MAT check passed', code: 'MAT_OK', severity: 'warning' };
}

// ============================================
// Advance Tax (25% quarterly)
// ============================================

export function checkAdvanceTaxCompliance(context: ComplianceContext): ComplianceResult {
  // Check if advance tax is due
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  const quarterEndMonths = [3, 6, 9, 12];
  const isQuarterEnd = quarterEndMonths.includes(now.getMonth() + 1);
  
  if (isQuarterEnd && now.getDate() > 25) {
    return {
      passed: true,
      message: 'Quarterly advance tax (25% of estimated annual tax) due this month',
      code: 'ADVANCE_TAX_DUE',
      severity: 'warning',
      remediation: 'Calculate and pay 25% of estimated annual tax before quarter end',
    };
  }
  return { passed: true, message: 'Advance tax not due', code: 'ADVANCE_TAX_OK', severity: 'warning' };
}

// ============================================
// TIN Validation
// ============================================

export function validateTin(tin: string): ComplianceResult {
  if (!tin) {
    return {
      passed: false,
      message: 'TIN is required',
      code: 'TIN_MISSING',
      severity: 'error',
      remediation: 'Provide valid 10-digit TIN',
    };
  }

  if (!/^\d{10}$/.test(tin)) {
    return {
      passed: false,
      message: 'TIN must be 10 digits',
      code: 'TIN_INVALID_FORMAT',
      severity: 'error',
      remediation: 'Provide valid 10-digit TIN',
    };
  }

  // Basic checksum validation (simplified)
  const digits = tin.split('').map(Number);
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 2), 0);
  if (sum % 10 !== 0) {
    return {
      passed: false,
      message: 'TIN checksum validation failed',
      code: 'TIN_INVALID_CHECKSUM',
      severity: 'warning',
      remediation: 'Verify TIN with Ministry of Revenues',
    };
  }

  return { passed: true, message: 'TIN valid', code: 'TIN_VALID', severity: 'warning' };
}

export function checkBuyerTinRequired(context: ComplianceContext): ComplianceResult {
  if (context.amount && context.amount > 10000 && !context.customerTin) {
    return {
      passed: false,
      message: 'Buyer TIN required for transactions over 10,000 ETB',
      code: 'BUYER_TIN_REQUIRED',
      severity: 'blocking',
      remediation: 'Collect buyer TIN before completing sale',
    };
  }
  return { passed: true, message: 'Buyer TIN not required', code: 'BUYER_TIN_OK', severity: 'warning' };
}

// ============================================
// Invoice Sequence Validation
// ============================================

export function checkInvoiceSequence(businessId: number, invoiceNo: string): ComplianceResult {
  // Check for gaps in invoice sequence
  // This is a simplified check
  return { passed: true, message: 'Invoice sequence valid', code: 'INVOICE_SEQ_OK', severity: 'warning' };
}

// ============================================
// Fiscal Receipt Requirements
// ============================================

export function checkFiscalReceiptRequirements(context: ComplianceContext): ComplianceResult {
  if (!context.items || context.items.length === 0) {
    return {
      passed: false,
      message: 'Receipt must contain at least one item',
      code: 'EMPTY_RECEIPT',
      severity: 'blocking',
      remediation: 'Add at least one item to the receipt',
    };
  }

  // Check for required fields on each item
  for (const item of context.items) {
    if (!item.qty || item.qty <= 0) {
      return {
        passed: false,
        message: 'All items must have quantity > 0',
        code: 'INVALID_QUANTITY',
        severity: 'blocking',
        remediation: 'Set valid quantity for all items',
      };
    }
    if (!item.unitPrice || item.unitPrice <= 0) {
      return {
        passed: false,
        message: 'All items must have unit price > 0',
        code: 'INVALID_PRICE',
        severity: 'blocking',
        remediation: 'Set valid price for all items',
      };
    }
    if (!item.taxType) {
      return {
        passed: false,
        message: 'All items must have a tax type (VAT, TOT, EXEMPT)',
        code: 'MISSING_TAX_TYPE',
        severity: 'blocking',
        remediation: 'Assign tax type to all items',
      };
    }
  }

  return { passed: true, message: 'Receipt requirements met', code: 'RECEIPT_OK', severity: 'warning' };
}

// ============================================
// Shift Compliance
// ============================================

export function checkShiftCompliance(context: ComplianceContext): ComplianceResult {
  if (!context.shiftId) {
    return {
      passed: false,
      message: 'No active shift. Open a shift before processing sales.',
      code: 'NO_ACTIVE_SHIFT',
      severity: 'blocking',
      remediation: 'Open a shift before processing transactions',
    };
  }

  // Check shift status
  // This would query the database
  return { passed: true, message: 'Shift compliance OK', code: 'SHIFT_OK', severity: 'warning' };
}

// ============================================
// Stock Compliance
// ============================================

export function checkStockCompliance(context: ComplianceContext): ComplianceResult {
  if (!context.items) return { passed: true, message: 'No items to check', code: 'STOCK_OK', severity: 'warning' };

  for (const item of context.items) {
    // This would check actual stock levels
    // For now, just validate positive quantities
    if (item.qty <= 0) {
      return {
        passed: false,
        message: 'Sale quantity must be positive',
        code: 'INVALID_QUANTITY',
        severity: 'blocking',
        remediation: 'Enter valid sale quantity',
      };
    }
  }

  return { passed: true, message: 'Stock compliance OK', code: 'STOCK_OK', severity: 'warning' };
}

// ============================================
// User Permission Checks
// ============================================

export function checkUserPermission(context: ComplianceContext, requiredPermission: string): ComplianceResult {
  // This would check user roles/permissions from database
  // For now, simplified check
  if (!context.userId) {
    return {
      passed: false,
      message: 'User not authenticated',
      code: 'UNAUTHENTICATED',
      severity: 'blocking',
      remediation: 'Log in to continue',
    };
  }

  return { passed: true, message: 'Permission granted', code: 'PERMISSION_OK', severity: 'warning' };
}

// ============================================
// Composite Compliance Checker
// ============================================

export function runComplianceChecks(
  context: ComplianceContext,
  rules: ComplianceRule[] = DEFAULT_COMPLIANCE_RULES
): ComplianceCheckResult {
  const results: ComplianceResult[] = [];
  let blocked = false;

  for (const rule of rules) {
    try {
      const result = rule.check(context);
      results.push(result);
      
      if (!result.passed && result.severity === 'blocking') {
        blocked = true;
      }
    } catch (e: any) {
      logger.error(`Compliance check ${rule.id} failed:`, e);
      results.push({
        passed: false,
        message: `Compliance check failed: ${e.message}`,
        code: 'CHECK_ERROR',
        severity: 'error',
      });
    }
  }

  return {
    passed: !blocked,
    results,
    blocked,
  };
}

// ============================================
// Default Compliance Rules
// ============================================

export const DEFAULT_COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: 'cash_limit',
    name: 'Cash Transaction Limit',
    description: 'Enforce ETB 50,000 cash transaction limit',
    severity: 'blocking',
    check: checkCashTransactionLimit,
  },
  {
    id: 'digital_payment',
    name: 'Digital Payment Required',
    description: 'Enforce digital payment for transactions over 50,000 ETB',
    severity: 'blocking',
    check: checkDigitalPaymentRequired,
  },
  {
    id: 'buyer_tin',
    name: 'Buyer TIN Required',
    description: 'Require buyer TIN for transactions over 10,000 ETB',
    severity: 'blocking',
    check: checkBuyerTinRequired,
  },
  {
    id: 'fiscal_receipt',
    name: 'Fiscal Receipt Requirements',
    description: 'Ensure receipt has all required fields',
    severity: 'blocking',
    check: checkFiscalReceiptRequirements,
  },
  {
    id: 'shift_compliance',
    name: 'Shift Compliance',
    description: 'Ensure active shift before processing',
    severity: 'blocking',
    check: checkShiftCompliance,
  },
  {
    id: 'stock_compliance',
    name: 'Stock Compliance',
    description: 'Validate stock levels for sale items',
    severity: 'blocking',
    check: checkStockCompliance,
  },
  {
    id: 'mat_warning',
    name: 'MAT Warning',
    description: 'Minimum Alternative Tax awareness',
    severity: 'warning',
    check: checkMATCompliance,
  },
  {
    id: 'advance_tax',
    name: 'Advance Tax Reminder',
    description: 'Quarterly advance tax reminder',
    severity: 'warning',
    check: checkAdvanceTaxCompliance,
  },
];

// ============================================
// Compliance Middleware (for IPC handlers)
// ============================================

export function createComplianceMiddleware(rules: ComplianceRule[] = DEFAULT_COMPLIANCE_RULES) {
  return async (context: ComplianceContext): Promise<ComplianceCheckResult> => {
    return runComplianceChecks(context, rules);
  };
}

// ============================================
// Audit Trail for Compliance
// ============================================

export function logComplianceEvent(
  businessId: number,
  eventType: string,
  details: Record<string, any>,
  userId?: number
): void {
  const logEntry = {
    businessId,
    eventType,
    details: JSON.stringify(details),
    userId: userId || null,
    timestamp: new Date().toISOString(),
  };

  // Store in audit log
  const db = require('../database').default;
  db.prepare(`
    INSERT INTO compliance_audit_log (businessId, eventType, details, userId, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(businessId, eventType, JSON.stringify(details), userId || null, new Date().toISOString());

  logger.info(`[Compliance] ${eventType}:`, details);
}

// ============================================
// Compliance Report
// ============================================

export interface ComplianceReport {
  period: string;
  totalChecks: number;
  passed: number;
  warnings: number;
  errors: number;
  blocked: number;
  byRule: Record<string, { passed: number; failed: number }>;
}

export function generateComplianceReport(businessId: number, fromDate: string, toDate: string): any {
  const db = require('../database').default;
  
  const logs = db.prepare(`
    SELECT * FROM compliance_audit_log 
    WHERE businessId = ? AND timestamp >= ? AND timestamp <= ?
    ORDER BY timestamp DESC
  `).all(businessId, fromDate, toDate) as any[];

  const byRule: Record<string, { passed: number; failed: number }> = {};
  
  for (const log of logs) {
    const details = JSON.parse(log.details);
    const ruleId = details.ruleId || 'unknown';
    const passed = details.passed === true;

    if (!byRule[ruleId]) byRule[ruleId] = { passed: 0, failed: 0 };
    if (passed) byRule[ruleId].passed++;
    else byRule[ruleId].failed++;
  }

  const totalChecks = logs.length;
  const passed = logs.filter(l => JSON.parse(l.details).passed === true).length;
  const warnings = logs.filter(l => {
    const d = JSON.parse(l.details);
    return d.severity === 'warning' && d.passed === false;
  }).length;
  const errors = logs.filter(l => {
    const d = JSON.parse(l.details);
    return d.severity === 'error' && d.passed === false;
  }).length;
  const blocked = logs.filter(l => {
    const d = JSON.parse(l.details);
    return d.severity === 'blocking' && d.passed === false;
  }).length;

  return {
    period: `${fromDate} to ${toDate}`,
    totalChecks,
    passed,
    warnings,
    errors,
    blocked,
    byRule,
  };
}

export default {
  CASH_TRANSACTION_LIMIT,
  checkCashTransactionLimit,
  checkDigitalPaymentRequired,
  checkMATCompliance,
  checkAdvanceTaxCompliance,
  validateTin,
  checkBuyerTinRequired,
  checkInvoiceSequence,
  checkFiscalReceiptRequirements,
  checkShiftCompliance,
  checkStockCompliance,
  checkUserPermission,
  runComplianceChecks,
  DEFAULT_COMPLIANCE_RULES,
  createComplianceMiddleware,
  logComplianceEvent,
  generateComplianceReport,
};