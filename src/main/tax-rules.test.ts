import { describe, it, expect } from 'vitest';
import {
  rateFor, ratePctFor, rulesFor, applyBrackets, PAYE_BRACKETS,
  categoryBIncomeTax, payeForMonth, COMPLIANCE_THRESHOLDS,
} from '@shega/shared';
import { classifyTaxpayer, taxpayerCategoryName } from '@shega/shared';
import {
  buildTaxObligations, mergePaymentStatus, nextDueObligations, advanceQuarterDates, periodForMonth,
} from '@shega/shared';

describe('tax rules', () => {
  it('centralizes the core Ethiopian rates', () => {
    expect(rateFor('VAT')).toBeCloseTo(0.15);
    expect(rateFor('WHT_DOMESTIC')).toBeCloseTo(0.03);
    expect(rateFor('VAT_WITHHOLDING')).toBeCloseTo(0.50);
    expect(rateFor('MAT')).toBeCloseTo(0.025);
    expect(rateFor('ADVANCE')).toBeCloseTo(0.25);
    expect(ratePctFor('VAT')).toBe(15);
  });

  it('honours effective dates for rule resolution', () => {
    const pre = new Date('2002-06-01');
    expect(rateFor('VAT', pre)).toBe(0);
    expect(rateFor('VAT', new Date('2003-06-01'))).toBeCloseTo(0.15);
    expect(rateFor('WHT_DOMESTIC', new Date('2023-01-01'))).toBe(0);
    expect(rateFor('WHT_DOMESTIC', new Date('2025-01-01'))).toBeCloseTo(0.03);
    const active = rulesFor(new Date('2025-01-01'));
    expect(active.some((r) => r.kind === 'MAT')).toBe(true);
  });

  it('computes progressive PAYE with exemptions only above the threshold', () => {
    expect(payeForMonth(0).tax).toBe(0);
    const low = payeForMonth(600);
    expect(low.tax).toBe(0);
    const mid = payeForMonth(1200);
    expect(mid.tax).toBeCloseTo((1200 - 600) * 0.10);
    const hi = payeForMonth(1650);
    expect(hi.tax).toBeCloseTo((1650 - 600) * 0.10);
  });

  it('computes Category B 2-9% gross receipts tax', () => {
    const none = categoryBIncomeTax(5000);
    expect(none.tax).toBe(0);
    const twoPct = categoryBIncomeTax(10000);
    expect(twoPct.tax).toBeCloseTo((10000 - 7200) * 0.02);
    const top = categoryBIncomeTax(200000);
    expect(top.tax).toBeGreaterThan(0);
    const lastBand = top.breakdown[top.breakdown.length - 1];
    expect(lastBand.rate).toBe(0.09);
  });

  it('applies brackets against a floor-sorted schedule', () => {
    const r = applyBrackets(1300, PAYE_BRACKETS);
    expect(r.tax).toBeCloseTo(700 * 0.10);
    expect(r.breakdown.length).toBeGreaterThanOrEqual(1);
    expect(r.breakdown.some((b) => b.rate === 0.10)).toBe(true);
  });
});

describe('taxpayer classification', () => {
  it('classifies by the VAT-registration turnover threshold', () => {
    expect(classifyTaxpayer(100_000)).toBe('B');
    expect(classifyTaxpayer(COMPLIANCE_THRESHOLDS.vatRegistrationTurnover)).toBe('A');
    expect(classifyTaxpayer(50_000, true)).toBe('A');
  });

  it('has stable display names', () => {
    expect(taxpayerCategoryName('A')).toBe('Category A');
    expect(taxpayerCategoryName('B')).toBe('Category B');
  });
});

describe('tax obligations calendar', () => {
  const catA = { category: 'A' as const, vatRegistered: true, payrollActive: true };
  const catB = { category: 'B' as const, vatRegistered: false, payrollActive: false };

  it('generates Category A calendar: VAT, WHT, PAYE, pension, 4 advances, annual', () => {
    const obs = buildTaxObligations(catA, 2025);
    expect(obs.length).toBe(12 * 4 + 4 + 1);
    expect(obs.filter((o) => o.kind === 'advance').length).toBe(4);
    expect(obs.filter((o) => o.kind === 'annual').length).toBe(1);
    expect(obs.filter((o) => o.kind === 'vat').length).toBe(12);
  });

  it('generates Category B calendar without VAT or advances', () => {
    const obs = buildTaxObligations(catB, 2025);
    expect(obs.filter((o) => o.kind === 'vat').length).toBe(0);
    expect(obs.filter((o) => o.kind === 'advance').length).toBe(0);
    expect(obs.filter((o) => o.kind === 'tot').length).toBe(12);
    expect(obs.filter((o) => o.kind === 'wht').length).toBe(12);
  });

  it('the VAT period is due at the end of the following month', () => {
    const jan = buildTaxObligations(catA, 2025).find((o) => o.id === 'vat-2025-01');
    expect(jan?.dueDate).toBe('2025-02-28');
    const dec = buildTaxObligations(catA, 2025).find((o) => o.id === 'vat-2025-12');
    expect(dec?.dueDate).toBe('2026-01-31');
  });

  it('schedules quarterly advances on quarter-end dates', () => {
    const qs = advanceQuarterDates(2025);
    expect(qs.map((q) => q.dueDate)).toEqual(['2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31']);
  });

  it('WHT/PAYE/pension are due mid following month', () => {
    const wht = buildTaxObligations(catA, 2025).find((o) => o.id === 'wht-2025-01');
    expect(wht?.dueDate).toBe('2025-02-15');
  });

  it('merges payment status without mutating sources', () => {
    const obs = buildTaxObligations(catB, 2025).filter((o) => o.kind === 'tot');
    const merged = mergePaymentStatus(obs, [
      { obligationId: 'tot-2025-01', paidAmount: 200, paidDate: '2025-02-14' },
    ], new Date('2025-03-20'));
    expect(merged.find((o) => o.id === 'tot-2025-01')?.status).toBe('paid');
    expect(merged.find((o) => o.id === 'tot-2025-02')?.status).toBe('overdue');
    expect(merged.find((o) => o.id === 'tot-2025-03')?.status).toBe('pending');
  });

  it('nextDueObligations filters by horizon', () => {
    const from = new Date('2025-02-01');
    const due = nextDueObligations(catA, from, 60);
    expect(due.every((o) => {
      const d = new Date(`${o.dueDate}T00:00:00`);
      return d >= from && d <= new Date('2025-04-02');
    })).toBe(true);
    expect(due.some((o) => o.id === 'vat-2025-01')).toBe(true);
  });
});

describe('helpers', () => {
  it('formats periods and quarter labels', () => {
    expect(periodForMonth(2025, 3)).toBe('2025-03');
    expect(advanceQuarterDates(2025)[0].period).toBe('2025-Q1');
  });
});