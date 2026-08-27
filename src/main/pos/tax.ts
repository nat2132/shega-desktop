// ============================================
// Ethiopian Tax Engine
// Supports: VAT 15%, TOT 2%/10%, WHT 2%/3%, Exempt
// ============================================

import { computeTotal, MoneyLine } from '../money';

export type TaxType = 'VAT' | 'TOT_2' | 'TOT_10' | 'EXEMPT' | 'WHT_2' | 'WHT_3';

export interface TaxRate {
  type: TaxType;
  rate: number;
  description: string;
  applicableTo: 'sales' | 'purchases' | 'payments';
}

export const TAX_RATES: Record<TaxType, TaxRate> = {
  VAT: { type: 'VAT', rate: 0.15, description: 'Value Added Tax 15%', applicableTo: 'sales' },
  TOT_2: { type: 'TOT_2', rate: 0.02, description: 'Turnover Tax 2%', applicableTo: 'sales' },
  TOT_10: { type: 'TOT_10', rate: 0.10, description: 'Turnover Tax 10%', applicableTo: 'sales' },
  EXEMPT: { type: 'EXEMPT', rate: 0, description: 'Tax Exempt', applicableTo: 'sales' },
  WHT_2: { type: 'WHT_2', rate: 0.02, description: 'Withholding Tax 2%', applicableTo: 'payments' },
  WHT_3: { type: 'WHT_3', rate: 0.03, description: 'Withholding Tax 3%', applicableTo: 'payments' },
};

export interface TaxLineInput {
  qty: number;
  unitPrice: number;
  discount?: number;
  taxType: TaxType;
  isInclusive?: boolean; // Whether price includes tax
}

export interface TaxCalculationResult {
  lines: {
    qty: number;
    unitPrice: number;
    discount: number;
    taxType: TaxType;
    taxRate: number;
    gross: number;
    discountAmount: number;
    net: number;
    tax: number;
    total: number;
  }[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  total: number;
  taxBreakdown: {
    VAT: number;
    TOT_2: number;
    TOT_10: number;
    WHT_2: number;
    WHT_3: number;
    EXEMPT: number;
  };
}

export function calculateTax(lines: TaxLineInput[]): TaxCalculationResult {
  const result: TaxCalculationResult = {
    lines: [],
    subtotal: 0,
    totalDiscount: 0,
    totalTax: 0,
    total: 0,
    taxBreakdown: {
      VAT: 0,
      TOT_2: 0,
      TOT_10: 0,
      WHT_2: 0,
      WHT_3: 0,
      EXEMPT: 0,
    },
  };

  for (const line of lines) {
    const taxRate = TAX_RATES[line.taxType].rate;
    const qty = line.qty || 0;
    const unitPrice = line.unitPrice || 0;
    const discount = line.discount || 0;

    const gross = qty * unitPrice;
    const discountAmount = discount;
    const net = gross - discountAmount;

    let tax = 0;
    if (line.isInclusive) {
      // Price includes tax: net = gross / (1 + rate), tax = gross - net
      tax = gross - (gross / (1 + taxRate));
    } else {
      // Price excludes tax: tax = net * rate
      tax = net * taxRate;
    }

    const total = net + tax;

    result.lines.push({
      qty,
      unitPrice,
      discount: discountAmount,
      taxType: line.taxType,
      taxRate,
      gross,
      discountAmount,
      net,
      tax,
      total,
    });

    result.subtotal += gross;
    result.totalDiscount += discountAmount;
    result.totalTax += tax;
    result.total += total;

    // Accumulate tax breakdown
    switch (line.taxType) {
      case 'VAT':
        result.taxBreakdown.VAT += tax;
        break;
      case 'TOT_2':
        result.taxBreakdown.TOT_2 += tax;
        break;
      case 'TOT_10':
        result.taxBreakdown.TOT_10 += tax;
        break;
      case 'WHT_2':
        result.taxBreakdown.WHT_2 += tax;
        break;
      case 'WHT_3':
        result.taxBreakdown.WHT_3 += tax;
        break;
      case 'EXEMPT':
        result.taxBreakdown.EXEMPT += tax;
        break;
    }
  }

  return result;
}

// ============================================
// Withholding Tax Calculation (for supplier payments)
// ============================================

export interface WhtInput {
  paymentAmount: number;
  supplierCategory: 'resident' | 'non-resident';
  paymentType: 'service' | 'goods' | 'rent' | 'interest' | 'dividend' | 'royalty';
  isExempt?: boolean;
  exemptionCertificate?: string;
}

export interface WhtResult {
  whtType: TaxType;
  rate: number;
  baseAmount: number;
  whtAmount: number;
  netPayment: number;
  isExempt: boolean;
  exemptionCertificate?: string;
}

export function calculateWHT(input: WhtInput): WhtResult {
  if (input.isExempt) {
    return {
      whtType: 'EXEMPT',
      rate: 0,
      baseAmount: input.paymentAmount,
      whtAmount: 0,
      netPayment: input.paymentAmount,
      isExempt: true,
      exemptionCertificate: input.exemptionCertificate,
    };
  }

  // WHT rates per Ethiopian proclamation
  // Service payments: 2% for residents, 10% for non-residents
  // Rent: 10%
  // Interest: 5% (resident), 10% (non-resident)
  // Dividend: 10%
  // Royalty: 5% (resident), 10% (non-resident)

  let rate = 0;
  let whtType: TaxType = 'WHT_2';

  if (input.supplierCategory === 'non-resident') {
    rate = 0.10; // 10% for non-residents generally
    whtType = 'WHT_3'; // Use 3% as base, but actual is 10%
  } else {
    switch (input.paymentType) {
      case 'service':
        rate = 0.02;
        whtType = 'WHT_2';
        break;
      case 'goods':
        rate = 0.02;
        whtType = 'WHT_2';
        break;
      case 'rent':
        rate = 0.10;
        whtType = 'WHT_3';
        break;
      case 'interest':
        rate = 0.05;
        whtType = 'WHT_3'; // 5%
        break;
      case 'dividend':
        rate = 0.10;
        whtType = 'WHT_3';
        break;
      case 'royalty':
        rate = 0.05;
        whtType = 'WHT_3';
        break;
      default:
        rate = 0.02;
        whtType = 'WHT_2';
    }
  }

  const baseAmount = input.paymentAmount;
  const whtAmount = Math.round(baseAmount * rate * 100) / 100;
  const netPayment = baseAmount - whtAmount;

  return {
    whtType,
    rate,
    baseAmount,
    whtAmount,
    netPayment,
    isExempt: false,
  };
}

// ============================================
// VAT Return Calculation (Monthly)
// ============================================

export interface VatReturnInput {
  businessId: number;
  period: string; // YYYY-MM
  outputVat: number; // VAT collected on sales
  inputVat: number; // VAT paid on purchases
  adjustments?: number;
}

export interface VatReturnResult {
  period: string;
  outputVat: number;
  inputVat: number;
  netVat: number; // output - input
  adjustments: number;
  payable: number;
  status: 'payable' | 'refundable' | 'nil';
}

export function calculateVatReturn(input: VatReturnInput): VatReturnResult {
  const netVat = input.outputVat - input.inputVat + (input.adjustments || 0);
  
  let status: 'payable' | 'refundable' | 'nil' = 'nil';
  if (netVat > 0) status = 'payable';
  else if (netVat < 0) status = 'refundable';

  return {
    period: input.period,
    outputVat: input.outputVat,
    inputVat: input.inputVat,
    netVat,
    adjustments: input.adjustments || 0,
    payable: Math.max(0, netVat),
    status,
  };
}

// ============================================
// TOT Return Calculation
// ============================================

export interface TotReturnInput {
  businessId: number;
  period: string; // YYYY-MM
  turnover: number;
  taxType: 'TOT_2' | 'TOT_10';
}

export interface TotReturnResult {
  period: string;
  turnover: number;
  taxRate: number;
  taxDue: number;
}

export function calculateTotReturn(input: TotReturnInput): TotReturnResult {
  const taxRate = TAX_RATES[input.taxType].rate;
  const taxDue = Math.round(input.turnover * taxRate * 100) / 100;

  return {
    period: input.period,
    turnover: input.turnover,
    taxRate,
    taxDue,
  };
}

// ============================================
// Minimum Alternative Tax (MAT) - 2.5% of gross turnover
// ============================================

export function calculateMAT(grossTurnover: number): number {
  return Math.round(grossTurnover * 0.025 * 100) / 100;
}

// ============================================
// Quarterly Advance Tax (25% of estimated annual tax)
// ============================================

export function calculateAdvanceTax(estimatedAnnualTax: number): number {
  return Math.round(estimatedAnnualTax * 0.25 * 100) / 100;
}

// ============================================
// PAYE Calculation (Progressive)
// ============================================

export interface PayeInput {
  grossSalary: number;
  allowances: number; // Tax-free allowances
  pensionContribution: number; // Employee pension (7%)
  dependents: number; // Number of dependents
}

export interface PayeResult {
  grossSalary: number;
  taxableIncome: number;
  paye: number;
  netSalary: number;
  pensionContribution: number;
  breakdown: { bracket: string; rate: number; amount: number }[];
}

export function calculatePAYE(input: PayeInput): PayeResult {
  // Ethiopian PAYE brackets (Proclamation No. 979/2016)
  // Monthly brackets:
  // 0 - 600: 0%
  // 601 - 1,650: 10%
  // 1,651 - 3,200: 15%
  // 3,201 - 5,250: 20%
  // 5,251 - 7,800: 25%
  // 7,801 - 10,900: 30%
  // Over 10,900: 35%

  const brackets = [
    { max: 600, rate: 0 },
    { max: 1650, rate: 0.10 },
    { max: 3200, rate: 0.15 },
    { max: 5250, rate: 0.20 },
    { max: 7800, rate: 0.25 },
    { max: 10900, rate: 0.30 },
    { max: Infinity, rate: 0.35 },
  ];

  const pensionContribution = Math.min(input.grossSalary * 0.07, 5000); // Cap at 5000 ETB
  const taxableIncome = input.grossSalary - input.allowances - pensionContribution;

  let remainingIncome = Math.max(0, taxableIncome);
  let paye = 0;
  const breakdown: { bracket: string; rate: number; amount: number }[] = [];

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;

    const previousMax = brackets[brackets.indexOf(bracket) - 1]?.max || 0;
    const bracketWidth = bracket.max - previousMax;
    const taxableInBracket = Math.min(remainingIncome, bracketWidth);
    
    if (taxableInBracket > 0) {
      const tax = Math.round(taxableInBracket * bracket.rate * 100) / 100;
      paye += tax;
      breakdown.push({
        bracket: `ETB ${previousMax + 1} - ${bracket.max === Infinity ? '∞' : bracket.max}`,
        rate: bracket.rate * 100,
        amount: tax,
      });
      remainingIncome -= taxableInBracket;
    }
  }

  // Dependent deduction: ETB 150 per dependent per month
  const dependentDeduction = Math.min(input.dependents * 150, paye * 0.5); // Max 50% of PAYE
  paye = Math.max(0, paye - dependentDeduction);

  // Recalculate breakdown for dependent deduction
  if (dependentDeduction > 0) {
    breakdown.push({
      bracket: 'Dependent deduction',
      rate: 0,
      amount: -dependentDeduction,
    });
  }

  const netSalary = input.grossSalary - pensionContribution - paye;

  return {
    grossSalary: input.grossSalary,
    taxableIncome,
    paye,
    netSalary,
    pensionContribution,
    breakdown,
  };
}

// ============================================
// Pension Calculation
// ============================================

export interface PensionInput {
  grossSalary: number;
  employeeRate?: number; // 7% default
  employerRate?: number; // 11% default
  cap?: number; // Monthly cap
}

export interface PensionResult {
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  capped: boolean;
}

export function calculatePension(input: PensionInput): PensionResult {
  const employeeRate = input.employeeRate || 0.07;
  const employerRate = input.employerRate || 0.11;
  const cap = input.cap || 5000; // Monthly cap

  let employeeContribution = Math.round(input.grossSalary * employeeRate * 100) / 100;
  let employerContribution = Math.round(input.grossSalary * employerRate * 100) / 100;

  let capped = false;
  if (employeeContribution > cap) {
    employeeContribution = cap;
    capped = true;
  }
  if (employerContribution > cap) {
    employerContribution = cap;
    capped = true;
  }

  return {
    employeeContribution,
    employerContribution,
    totalContribution: employeeContribution + employerContribution,
    capped,
  };
}

export default {
  TAX_RATES,
  calculateTax,
  calculateWHT,
  calculateVatReturn,
  calculateTotReturn,
  calculateMAT,
  calculateAdvanceTax,
  calculatePAYE,
  calculatePension,
};