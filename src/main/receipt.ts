import { EscposWriter } from './escpos';

export interface ReceiptLine {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface ReceiptContext {
  businessName: string;
  address?: string;
  tin?: string;
  cashier?: string;
  receiptSerial?: number;
}

export interface ReceiptInput {
  lines: ReceiptLine[];
  subtotal: number;
  discount: number;
  vat: number;
  taxType?: string;
  total: number;
  paid: number;
  change: number;
  paymentMethod: string;
  paymentStatus: string;
  customerName?: string | null;
  createdAt?: string | null;
  context: ReceiptContext;
}

const WIDTH = 42;

function padRight(s: string, w: number): string {
  if (s.length >= w) return s.slice(0, w);
  return s + ' '.repeat(w - s.length);
}

function center(s: string, w: number): string {
  if (s.length >= w) return s.slice(0, w);
  const pad = Math.floor((w - s.length) / 2);
  return ' '.repeat(pad) + s + ' '.repeat(w - s.length - pad);
}

function money(n: number): string {
  return `ETB ${(Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const divider = '-'.repeat(WIDTH);

export function buildReceiptCommands(input: ReceiptInput): Uint8Array {
  const w = new EscposWriter().init();

  w.align(1).bold(true).text(input.context.businessName.slice(0, WIDTH)).lineFeed();
  w.bold(false).align(0);
  if (input.context.address) w.align(1).text(input.context.address.slice(0, WIDTH)).lineFeed().align(0);
  if (input.context.tin) w.text(`TIN: ${input.context.tin}`).lineFeed();

  w.text(divider).lineFeed();

  for (const line of input.lines) {
    w.text(padRight(line.name.slice(0, 28), 28)).text(padRight(String(line.quantity), 4)).text(padRight(line.unit.slice(0, 3), 4)).text(money(line.total).padStart(6)).lineFeed();
    if (line.unitPrice !== line.total) {
      w.text(`  @ ${money(line.unitPrice)}`).lineFeed();
    }
  }

  w.text(divider).lineFeed();
  w.column('Subtotal', money(input.subtotal), WIDTH);
  if (input.discount > 0) w.column('Discount', `-${money(input.discount)}`, WIDTH);
  if (input.vat > 0) w.column(`${input.taxType || 'VAT'}`, money(input.vat), WIDTH);
  w.text(divider).lineFeed();
  w.bold(true).size(2, 2).text(padRight('TOTAL', WIDTH - 6) + money(input.total)).lineFeed().size(1, 1).bold(false);
  w.text(divider).lineFeed();

  if (input.customerName) w.column('Customer', input.customerName.slice(0, 30), WIDTH);
  w.column('Payment', input.paymentMethod || 'Cash', WIDTH);
  if (input.paymentStatus === 'Debt') {
    w.column('Status', 'DEBT', WIDTH);
  } else if (input.change > 0) {
    w.column('Paid', money(input.paid), WIDTH);
    w.column('Change', money(input.change), WIDTH);
  }

  w.text(divider).lineFeed();
  w.text(padRight('Date: ' + (input.createdAt ? input.createdAt.slice(0, 16).replace('T', ' ') : new Date().toISOString().slice(0, 16).replace('T', ' ')), WIDTH / 2) + padRight('Rcpt #' + (input.context.receiptSerial ?? ''), WIDTH / 2)).lineFeed();
  if (input.context.cashier) w.text(`Cashier: ${input.context.cashier.slice(0, WIDTH)}`).lineFeed();
  w.align(1).text('Thank you for shopping with us!').lineFeed(2).align(0);

  w.cut(true);
  return w.toUint8Array();
}

export interface LabelInput {
  name: string;
  sku?: string | null;
  barcode?: string | null;
  price: number;
  barcodeType?: 'ean13' | 'code128';
}

// Shelf label for 58x40mm printers — barcode or QR plus price/name.
export function buildLabelCommands(label: LabelInput, copies: number = 1): Uint8Array {
  const w = new EscposWriter().init();
  const code = label.barcode || label.sku || '';

  for (let i = 0; i < Math.max(1, copies); i++) {
    w.align(1).bold(true).text(label.name.slice(0, 32)).lineFeed().bold(false);
    if (code) {
      if (label.barcodeType === 'code128') w.barcodeCode128(code);
      else w.barcodeEan13(code);
    } else if (label.sku) {
      w.qr(label.sku, 6);
    }
    w.align(1).size(2, 2).text(money(label.price)).lineFeed().size(1, 1).align(0);
    w.lineFeed(1);
  }
  w.cut(true);
  return w.toUint8Array();
}

// Printer self-test page.
export function buildTestPageCommands(): Uint8Array {
  const w = new EscposWriter().init();
  w.align(1).bold(true).size(2, 2).text('SHEGA TEST PAGE').lineFeed().size(1, 1).bold(false);
  w.text(divider).lineFeed();
  w.text('Date: ' + new Date().toLocaleString()).lineFeed();
  w.text('ESC/POS transport OK').lineFeed();
  w.text('  - align left  : ' + 'Shega').lineFeed();
  w.align(1).text('  - align center : Shega').lineFeed();
  w.align(2).text('  - align right  : Shega').lineFeed().align(0);
  w.text('Barcode EAN-13 1234567890128:').lineFeed();
  w.barcodeEan13('1234567890128');
  w.text('QR test:').lineFeed();
  w.qr('SHEGA::TEST::' + Date.now(), 6);
  w.text(divider).lineFeed();
  w.lineFeed(2);
  w.cut(true);
  return w.toUint8Array();
}

export { money };