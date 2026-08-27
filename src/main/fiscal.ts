// Fiscal / ETRS integration hooks (Ethiopia e-tax roadmap).
// Keeps a stable receipt-signing contract so a real fiscal device (ETRS,
// tax authority signing box) can be dropped in later without schema changes.

export interface FiscalReceipt {
  serial: number;
  total: number;
  date: string;
}

export interface FiscalSignature {
  fiscalNumber: string;
  signature: string | null;
}

export interface FiscalAdapter {
  name: string;
  isAvailable(): boolean;
  signReceipt(receipt: FiscalReceipt): FiscalSignature;
}

class NullFiscalAdapter implements FiscalAdapter {
  readonly name = 'null';

  isAvailable(): boolean {
    return true;
  }

  signReceipt(receipt: FiscalReceipt): FiscalSignature {
    return {
      fiscalNumber: `F-${String(receipt.serial).padStart(8, '0')}`,
      signature: null,
    };
  }
}

export const fiscalAdapter: FiscalAdapter = new NullFiscalAdapter();