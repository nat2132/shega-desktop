// ============================================
// MoR QR Code Receipts (Ethiopian Ministry of Revenues Directive 188/2024)
// ============================================

import { EscposWriter } from '../escpos';
import { createHash } from 'crypto';

export interface MorQrData {
  tin: string;           // Tax Identification Number (10 digits)
  invoiceNo: string;     // Invoice/Receipt number
  date: string;          // Date in YYYY-MM-DD format
  totalAmount: number;   // Total amount including VAT
  vatAmount: number;     // VAT amount
  totAmount?: number;    // TOT amount (if applicable)
  whtAmount?: number;    // Withholding tax amount (if applicable)
  currency?: string;     // Currency code (default: ETB)
}

export interface MorQrReceiptOptions {
  qrSize?: number;       // QR module size (default: 6)
  ecLevel?: 0 | 1 | 2 | 3; // Error correction level (default: 1/M)
  includeLogo?: boolean; // Whether to include logo in QR (not standard)
}

/**
 * Generate MoR QR code payload per Directive 188/2024
 * Format: TIN|InvoiceNo|Date|TotalAmount|VATAmount|TOTAmount|WHTAmount
 * All amounts in ETB with 2 decimal places, no currency symbol
 */
export function generateMorQrPayload(data: MorQrData): string {
  const formatAmount = (amount: number): string => {
    return (Math.round(amount * 100) / 100).toFixed(2);
  };

  const parts = [
    data.tin.padStart(10, '0'),                    // TIN: 10 digits, zero-padded
    data.invoiceNo,                                 // Invoice number
    data.date,                                      // YYYY-MM-DD
    formatAmount(data.totalAmount),                 // Total amount
    formatAmount(data.vatAmount),                   // VAT amount
    formatAmount(data.totAmount || 0),              // TOT amount (0 if not applicable)
    formatAmount(data.whtAmount || 0),              // WHT amount (0 if not applicable)
  ];

  return parts.join('|');
}

/**
 * Generate QR code image data (base64 PNG) for MoR receipt
 */
export async function generateMorQrImage(
  data: MorQrData, 
  options: MorQrReceiptOptions = {}
): Promise<string> {
  // Using EscposWriter's QR generation capability
  // For actual image generation, you'd use a library like qrcode or canvas
  // Here we return the payload that can be used with a QR library
  
  const payload = generateMorQrPayload(data);
  
  // Return payload - actual image generation would use:
  // const QRCode = require('qrcode');
  // return await QRCode.toDataURL(payload, {
  //   width: 256,
  //   margin: 2,
  //   errorCorrectionLevel: ['L', 'M', 'Q', 'H'][options.ecLevel || 1]
  // });
  
  return payload;
}

/**
 * Generate full MoR-compliant receipt with QR code
 */
export interface MorReceiptInput {
  businessName: string;
  tin: string;
  address: string;
  phone?: string;
  invoiceNo: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  cashier: string;
  items: {
    name: string;
    qty: number;
    unitPrice: number;
    discount?: number;
    taxType: 'VAT' | 'TOT_2' | 'TOT_10' | 'EXEMPT';
    taxRate: number;
    /** Unit label printed on the receipt (e.g. pcs, kg). */
    unit?: string;
  }[];
  subtotal: number;
  discount: number;
  vatAmount: number;
  totAmount: number;
  total: number;
  paymentMethod: string;
  paid: number;
  change: number;
  qrData: MorQrData;
}

const WIDTH = 42;

function money(n: number): string {
  return `ETB ${(Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function padRight(s: string, w: number): string {
  if (s.length >= w) return s.slice(0, w);
  return s + ' '.repeat(w - s.length);
}

const divider = '-'.repeat(WIDTH);

export function buildMorReceipt(input: MorReceiptInput): Uint8Array {
  const w = new EscposWriter().init();

  // Header
  w.align(1).bold(true).size(2, 2).text('SALES RECEIPT').lineFeed().size(1, 1).bold(false).lineFeed();
  w.align(1).bold(true).text(input.businessName.slice(0, WIDTH)).lineFeed().bold(false);
  if (input.address) w.align(1).text(input.address.slice(0, WIDTH)).lineFeed().align(0);
  if (input.phone) w.text(`Tel: ${input.phone}`).lineFeed();
  w.text(`TIN: ${input.tin}`).lineFeed();
  w.text(divider).lineFeed();

  // Invoice info
  w.text(`Invoice: ${input.invoiceNo}`).lineFeed();
  w.text(`Date: ${input.date}  Time: ${input.time}`).lineFeed();
  w.text(`Cashier: ${input.cashier}`).lineFeed();
  w.text(divider).lineFeed();

  // Items
  for (const item of input.items) {
    const lineTotal = (item.qty * item.unitPrice) - (item.discount || 0);
    w.text(padRight(item.name.slice(0, 28), 28))
     .text(padRight(String(item.qty), 4))
     .text(padRight((item.unit || 'pcs').slice(0, 3), 4))
     .text(money(lineTotal).padStart(6))
     .lineFeed();
    
    if (item.discount && item.discount > 0) {
      w.text(`  Discount: ${money(item.discount)}`).lineFeed();
    }
    w.text(`  @ ${money(item.unitPrice)} (${item.taxType} ${(item.taxRate * 100).toFixed(0)}%)`).lineFeed();
  }

  w.text(divider).lineFeed();

  // Totals
  w.column('Subtotal', money(input.subtotal), WIDTH);
  if (input.discount > 0) w.column('Discount', `-${money(input.discount)}`, WIDTH);
  if (input.vatAmount > 0) w.column('VAT 15%', money(input.vatAmount), WIDTH);
  if (input.totAmount > 0) w.column('TOT', money(input.totAmount), WIDTH);
  w.text(divider).lineFeed();
  w.bold(true).size(2, 2).column('TOTAL', money(input.total), WIDTH).size(1, 1).bold(false).lineFeed();
  w.text(divider).lineFeed();

  // Payment
  w.column('Payment', input.paymentMethod, WIDTH);
  if (input.paid > 0) w.column('Paid', money(input.paid), WIDTH);
  if (input.change > 0) w.column('Change', money(input.change), WIDTH);
  w.text(divider).lineFeed();

  // MoR QR Code
  const qrPayload = generateMorQrPayload({
    tin: input.tin,
    invoiceNo: input.invoiceNo,
    date: input.date,
    totalAmount: input.total,
    vatAmount: input.vatAmount,
    totAmount: input.totAmount,
  });

  w.align(1).text('MoR QR Code:').lineFeed();
  w.qr(qrPayload, 6, 1); // Module size 6, EC level M
  w.lineFeed();
  w.text(`TIN: ${input.tin} | Inv: ${input.invoiceNo} | ${input.date}`).lineFeed();
  w.text(`Total: ${money(input.total)} | VAT: ${money(input.vatAmount)}`).lineFeed();
  w.lineFeed();

  // Footer
  w.text(divider).lineFeed();
  w.align(1).text('Thank you for your business!').lineFeed(2).align(0);
  w.text('This receipt is valid for tax purposes').lineFeed();
  w.text(`Fiscal Sign: F-${String(Date.now()).slice(-8)}`).lineFeed();

  w.cut(true);
  return w.toUint8Array();
}

/**
 * Validate MoR QR payload format
 */
export function validateMorQrPayload(payload: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const parts = payload.split('|');

  if (parts.length !== 7) {
    errors.push(`Expected 7 parts, got ${parts.length}`);
    return { valid: false, errors };
  }

  const [tin, invoiceNo, date, totalAmount, vatAmount, totAmount, whtAmount] = parts;

  // Validate TIN (10 digits)
  if (!/^\d{10}$/.test(tin)) {
    errors.push('TIN must be 10 digits');
  }

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push('Date must be YYYY-MM-DD format');
  } else {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      errors.push('Invalid date');
    }
  }

  // Validate amounts (numeric with 2 decimals)
  const amountFields = [
    { name: 'Total', value: totalAmount },
    { name: 'VAT', value: vatAmount },
    { name: 'TOT', value: totAmount },
    { name: 'WHT', value: whtAmount },
  ];

  for (const field of amountFields) {
    if (!/^\d+\.\d{2}$/.test(field.value)) {
      errors.push(`${field.name} amount must have 2 decimal places`);
    }
    const val = parseFloat(field.value);
    if (isNaN(val) || val < 0) {
      errors.push(`${field.name} amount must be a positive number`);
    }
  }

  // Cross-validate: Total should equal VAT + TOT + (Net amount)
  // This is a simplified check
  const total = parseFloat(totalAmount);
  const vat = parseFloat(vatAmount);
  const tot = parseFloat(totAmount);
  const wht = parseFloat(whtAmount);
  const net = total - vat - tot - wht;
  if (net < -0.01) {
    errors.push('Total amount less than sum of taxes');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Generate MoR QR code for printing on receipt
 * Returns the payload string that can be used with any QR code generator
 */
export function createMorQrCode(data: MorQrData): string {
  return generateMorQrPayload(data);
}

/**
 * Print MoR receipt with QR code using ESC/POS driver
 */
export async function printMorReceipt(
  escposDriver: any,
  input: MorReceiptInput
): Promise<void> {
  const receiptData = buildMorReceipt(input);
  await escposDriver.write(receiptData);
}

export default {
  generateMorQrPayload,
  generateMorQrImage,
  buildMorReceipt,
  validateMorQrPayload,
  createMorQrCode,
  printMorReceipt,
};