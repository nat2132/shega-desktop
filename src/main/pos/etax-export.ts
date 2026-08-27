// ============================================
// 1-Click e-Tax CSV Export (Ethiopian Ministry of Revenues)
// ============================================

import db from '../database';
import { logger } from '../logger';

export interface EtaxSalesRecord {
  tin: string;
  invoiceNo: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  buyerTin: string;
  buyerName: string;
  totalAmount: number;
  vatAmount: number;
  totAmount: number;
  whtAmount: number;
  paymentMethod: string;
  status: string; // 'valid', 'voided', 'refunded'
}

export interface EtaxPurchaseRecord {
  tin: string;
  invoiceNo: string;
  date: string;
  supplierTin: string;
  supplierName: string;
  totalAmount: number;
  vatAmount: number;
  whtAmount: number;
  paymentMethod: string;
  status: string;
}

export interface EtaxExportOptions {
  businessId: number;
  period: string; // YYYY-MM
  includeVoided?: boolean;
  includeRefunded?: boolean;
  outputPath?: string;
}

export interface EtaxExportResult {
  salesFile: string;
  purchasesFile: string;
  salesCount: number;
  purchasesCount: number;
  totalVat: number;
  totalWht: number;
  errors: string[];
}

// ============================================
// Sales Export (per MoR format)
// ============================================

function formatAmount(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}

function formatDate(dateStr: string): string {
  // Ensure YYYY-MM-DD format
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toTimeString().slice(0, 8);
}

export function generateEtaxSalesCsv(options: EtaxExportOptions): { csv: string; count: number; totalVat: number; totalWht: number; errors: string[] } {
  const db = require('../database').default;
  const { businessId, period, includeVoided = false, includeRefunded = false } = options;

  const [year, month] = period.split('-').map(Number);
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

  let whereClause = `WHERE s.businessId = ? AND s.createdAt >= ? AND s.createdAt <= ?`;
  const params: any[] = [businessId, startDate, endDate + ' 23:59:59'];

  if (!includeVoided) {
    whereClause += ` AND s.status != 'Voided'`;
  }
  if (!includeRefunded) {
    whereClause += ` AND s.status != 'Refunded'`;
  }

  const query = `
    SELECT 
      s.id,
      s.invoiceNo,
      s.createdAt,
      s.customerTin,
      s.customerName,
      s.totalPrice,
      s.vatAmount,
      s.totAmount,
      s.whtAmount,
      s.paymentMethod,
      s.status
    FROM sales s
    ${whereClause}
    ORDER BY s.createdAt ASC
  `;

  const sales = db.prepare(query).all(...params) as any[];
  const errors: string[] = [];

  // CSV Header per MoR specification
  const headers = [
    'TIN',
    'Invoice_Number',
    'Invoice_Date',
    'Invoice_Time',
    'Buyer_TIN',
    'Buyer_Name',
    'Total_Amount',
    'VAT_Amount',
    'TOT_Amount',
    'WHT_Amount',
    'Payment_Method',
    'Status'
  ];

  let csv = headers.join(',') + '\n';
  let count = 0;
  let totalVat = 0;
  let totalWht = 0;

  for (const sale of sales) {
    try {
      // Validate required fields
      if (!sale.invoiceNo) {
        errors.push(`Sale ${sale.id}: Missing invoice number`);
        continue;
      }

      // Get buyer TIN
      let buyerTin = sale.customerTin || '';
      if (!buyerTin) {
        const customer = db.prepare('SELECT tin FROM customers WHERE id = (SELECT customerId FROM sales WHERE id = ?)').get(sale.id) as any;
        buyerTin = customer?.tin || '';
      }

      if (!buyerTin) {
        errors.push(`Sale ${sale.invoiceNo}: Missing buyer TIN`);
      }

      // Get customer name
      let buyerName = sale.customerName || '';
      if (!buyerName) {
        const customer = db.prepare('SELECT name FROM customers WHERE id = (SELECT customerId FROM sales WHERE id = ?)').get(sale.id) as any;
        buyerName = customer?.name || '';
      }

      const row = [
        sale.tin || '',                    // Seller TIN (from business settings)
        sale.invoiceNo,                    // Invoice Number
        formatDate(sale.createdAt),        // Date
        formatTime(sale.createdAt),        // Time
        buyerTin.padStart(10, '0'),        // Buyer TIN (10 digits)
        `"${buyerName.replace(/"/g, '""')}"`, // Buyer Name (quoted)
        formatAmount(sale.totalPrice),     // Total Amount
        formatAmount(sale.vatAmount || 0), // VAT Amount
        formatAmount(sale.totAmount || 0), // TOT Amount
        formatAmount(sale.whtAmount || 0), // WHT Amount
        sale.paymentMethod || 'Cash',      // Payment Method
        sale.status || 'Valid'             // Status
      ];

      csv += row.join(',') + '\n';
      count++;
      totalVat += sale.vatAmount || 0;
      totalWht += sale.whtAmount || 0;
    } catch (e: any) {
      errors.push(`Sale ${sale.invoiceNo}: ${e.message}`);
    }
  }

  return { csv, count, totalVat, totalWht: totalWht, errors };
}

// ============================================
// Purchases Export
// ============================================

export function generateEtaxPurchasesCsv(options: EtaxExportOptions): { csv: string; count: number; totalVat: number; totalWht: number; errors: string[] } {
  const db = require('../database').default;
  const { businessId, period, includeVoided = false } = options;

  const [year, month] = period.split('-').map(Number);
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  let whereClause = `WHERE sp.businessId = ? AND sp.purchaseDate >= ? AND sp.purchaseDate <= ?`;
  const params: any[] = [businessId, startDate, endDate];

  if (!includeVoided) {
    whereClause += ` AND sp.status != 'Voided'`;
  }

  const query = `
    SELECT 
      sp.id,
      sp.purchaseNumber,
      sp.purchaseDate,
      sp.supplierTin,
      sp.supplierName,
      sp.totalAmount,
      sp.vatAmount,
      sp.whtAmount,
      sp.paymentMethod,
      sp.status
    FROM supplier_purchases sp
    ${whereClause}
    ORDER BY sp.purchaseDate ASC
  `;

  const purchases = db.prepare(query).all(...params) as any[];
  const errors: string[] = [];

  const headers = [
    'TIN',
    'Invoice_Number',
    'Invoice_Date',
    'Supplier_TIN',
    'Supplier_Name',
    'Total_Amount',
    'VAT_Amount',
    'WHT_Amount',
    'Payment_Method',
    'Status'
  ];

  let csv = headers.join(',') + '\n';
  let count = 0;
  let totalVat = 0;
  let totalWht = 0;

  for (const purchase of purchases) {
    try {
      if (!purchase.purchaseNumber) {
        errors.push(`Purchase ${purchase.id}: Missing purchase number`);
        continue;
      }

      const row = [
        purchase.tin || '',                    // Business TIN
        purchase.purchaseNumber,               // Invoice Number
        formatDate(purchase.purchaseDate),     // Date
        purchase.supplierTin?.padStart(10, '0') || '', // Supplier TIN
        `"${(purchase.supplierName || '').replace(/"/g, '""')}"`, // Supplier Name
        formatAmount(purchase.totalAmount),    // Total Amount
        formatAmount(purchase.vatAmount || 0), // VAT Amount
        formatAmount(purchase.whtAmount || 0), // WHT Amount
        purchase.paymentMethod || 'Cash',      // Payment Method
        purchase.status || 'Valid'             // Status
      ];

      csv += row.join(',') + '\n';
      count++;
      totalVat += purchase.vatAmount || 0;
      totalWht += purchase.whtAmount || 0;
    } catch (e: any) {
      errors.push(`Purchase ${purchase.purchaseNumber}: ${e.message}`);
    }
  }

  return { csv, count, totalVat, totalWht, errors };
}

// ============================================
// Main Export Function
// ============================================

export function exportEtaxCsv(options: EtaxExportOptions): EtaxExportResult {
  const salesResult = generateEtaxSalesCsv(options);
  const purchasesResult = generateEtaxPurchasesCsv(options);

  const result: EtaxExportResult = {
    salesFile: salesResult.csv,
    purchasesFile: purchasesResult.csv,
    salesCount: salesResult.count,
    purchasesCount: purchasesResult.count,
    totalVat: salesResult.totalVat + purchasesResult.totalVat,
    totalWht: salesResult.totalWht + purchasesResult.totalWht,
    errors: [...salesResult.errors, ...purchasesResult.errors],
  };

  // Write to files if outputPath provided
  if (options.outputPath) {
    const fs = require('fs');
    const path = require('path');
    
    const period = options.period.replace('-', '');
    const salesPath = path.join(options.outputPath, `etax_sales_${period}.csv`);
    const purchasesPath = path.join(options.outputPath, `etax_purchases_${period}.csv`);
    
    fs.writeFileSync(salesPath, '\uFEFF' + result.salesFile, 'utf8'); // UTF-8 BOM
    fs.writeFileSync(purchasesPath, '\uFEFF' + result.purchasesFile, 'utf8');
    
    logger.info(`[eTax] Exported ${result.salesCount} sales and ${result.purchasesCount} purchases to ${options.outputPath}`);
  }

  logger.info(`[eTax] Export complete: ${result.salesCount} sales, ${result.purchasesCount} purchases, VAT: ${result.totalVat}, WHT: ${result.totalWht}`);

  return result;
}

// ============================================
// Validation
// ============================================

export function validateEtaxCsv(csv: string, type: 'sales' | 'purchases'): { valid: boolean; errors: string[] } {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return { valid: false, errors: ['Empty CSV'] };

  const headers = lines[0].split(',');
  const requiredHeaders = type === 'sales' 
    ? ['TIN', 'Invoice_Number', 'Invoice_Date', 'Invoice_Time', 'Buyer_TIN', 'Buyer_Name', 'Total_Amount', 'VAT_Amount', 'TOT_Amount', 'WHT_Amount', 'Payment_Method', 'Status']
    : ['TIN', 'Invoice_Number', 'Invoice_Date', 'Supplier_TIN', 'Supplier_Name', 'Total_Amount', 'VAT_Amount', 'WHT_Amount', 'Payment_Method', 'Status'];

  const headerErrors = requiredHeaders.filter(h => !headers.includes(h));
  if (headerErrors.length > 0) {
    return { valid: false, errors: [`Missing headers: ${headerErrors.join(', ')}`] };
  }

  const errors: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    if (row.length < requiredHeaders.length) {
      errors.push(`Row ${i + 1}: Insufficient columns`);
    }
    // Add more validation as needed
  }

  return { valid: errors.length === 0, errors };
}

export default {
  exportEtaxCsv,
  generateEtaxSalesCsv,
  generateEtaxPurchasesCsv,
  validateEtaxCsv,
};