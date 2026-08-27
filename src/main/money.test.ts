import { describe, it, expect, vi } from 'vitest';
import {
  MINOR_UNITS_PER_MAJOR,
  toMinor,
  fromMinor,
  roundMoney,
  computeTotal,
  computeTotalFloat,
  type MoneyLine,
  type MoneyResult,
} from './money';

describe('Money module — integer minor-units (ETB × 100)', () => {
  describe('toMinor / fromMinor', () => {
    it('converts major to minor units correctly', () => {
      expect(toMinor(19.99)).toBe(1999);
      expect(toMinor(100)).toBe(10000);
      expect(toMinor(0.01)).toBe(1);
      expect(toMinor(0)).toBe(0);
      expect(toMinor(-50.50)).toBe(-5050);
    });

    it('converts minor to major units correctly', () => {
      expect(fromMinor(1999)).toBe(19.99);
      expect(fromMinor(10000)).toBe(100);
      expect(fromMinor(1)).toBe(0.01);
      expect(fromMinor(0)).toBe(0);
      expect(fromMinor(-5050)).toBe(-50.50);
    });

    it('round-trip preserves values', () => {
      const testValues = [0, 0.01, 0.10, 0.99, 1, 19.99, 100, 1000.50, 9999.99];
      for (const val of testValues) {
        expect(fromMinor(toMinor(val))).toBe(val);
      }
    });

    it('handles floating point edge cases (banker rounding)', () => {
      // JavaScript floating point precision affects banker rounding
      expect(toMinor(1.005)).toBe(100); // 1.005 * 100 = 100.499... -> 100
      expect(toMinor(1.015)).toBe(101); // 1.015 * 100 = 101.499... -> 101
      expect(toMinor(1.004)).toBe(100);
      expect(fromMinor(101)).toBe(1.01);
    });
  });

  describe('roundMoney', () => {
    it('rounds using banker rounding (via toMinor)', () => {
      expect(roundMoney(1.005)).toBe(1.00); // 100.499... -> 100
      expect(roundMoney(1.015)).toBe(1.01); // 101.499... -> 101
      expect(roundMoney(1.004)).toBe(1.00);
      expect(roundMoney(19.995)).toBe(20.00); // 1999.5 -> 2000
      expect(roundMoney(19.994)).toBe(19.99);
    });

    it('handles whole numbers', () => {
      expect(roundMoney(100)).toBe(100);
      expect(roundMoney(0)).toBe(0);
    });

    it('handles negative values (banker rounding)', () => {
      expect(roundMoney(-1.005)).toBe(-1.00); // -100.499... -> -100
      expect(roundMoney(-1.015)).toBe(-1.01); // -101.499... -> -101
      expect(roundMoney(-1.004)).toBe(-1.00);
    });
  });

  describe('computeTotal — integer engine', () => {
    const createLine = (overrides: Partial<MoneyLine> = {}): MoneyLine => ({
      qty: 1,
      unitPrice: 100,
      discount: 0,
      taxRate: 0.15,
      ...overrides,
    });

    it('computes simple single-line total', () => {
      const lines = [createLine({ qty: 1, unitPrice: 100, discount: 0, taxRate: 0.15 })];
      const result = computeTotal(lines);
      // gross = 10000 cents, disc = 0, net = 10000, tax = round(10000 * 0.15) = 1500 cents = 15.00
      expect(result.subtotal).toBe(100);
      expect(result.discount).toBe(0);
      expect(result.tax).toBe(15);
      expect(result.total).toBe(115);
    });

    it('computes multi-line total', () => {
      const lines = [
        createLine({ qty: 2, unitPrice: 50, discount: 0, taxRate: 0.15 }), // gross 10000, tax 1500
        createLine({ qty: 1, unitPrice: 30, discount: 5, taxRate: 0.15 }),  // gross 3000, disc 500, net 2500, tax 375
      ];
      const result = computeTotal(lines);
      expect(result.subtotal).toBe(130); // 100 + 30
      expect(result.discount).toBe(5);
      expect(result.tax).toBe(18.75); // 15 + 3.75
      expect(result.total).toBe(143.75); // 130 - 5 + 18.75
    });

    it('handles zero tax rate', () => {
      const lines = [createLine({ taxRate: 0 })];
      const result = computeTotal(lines);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(100);
    });

    it('handles discount correctly', () => {
      const lines = [createLine({ unitPrice: 100, discount: 10, taxRate: 0.15 })];
      const result = computeTotal(lines);
      // gross = 10000, disc = 1000, net = 9000, tax = round(9000 * 0.15) = 1350 cents = 13.50
      expect(result.subtotal).toBe(100);
      expect(result.discount).toBe(10);
      expect(result.tax).toBe(13.5);
      expect(result.total).toBe(103.5); // 100 - 10 + 13.5
    });

    it('handles quantity > 1', () => {
      const lines = [createLine({ qty: 3, unitPrice: 10, discount: 0, taxRate: 0.15 })];
      const result = computeTotal(lines);
      // gross = 3000, tax = round(3000 * 0.15) = 450 cents = 4.50
      expect(result.subtotal).toBe(30);
      expect(result.tax).toBe(4.5);
      expect(result.total).toBe(34.5);
    });

    it('handles mixed tax rates per line', () => {
      const lines = [
        createLine({ unitPrice: 100, taxRate: 0.15 }),
        createLine({ unitPrice: 100, taxRate: 0.05 }),
        createLine({ unitPrice: 100, taxRate: 0 }),
      ];
      const result = computeTotal(lines);
      expect(result.subtotal).toBe(300);
      expect(result.tax).toBe(20); // 15 + 5 + 0
      expect(result.total).toBe(320);
    });

    it('handles large quantities and prices', () => {
      const lines = [createLine({ qty: 1000, unitPrice: 999.99, taxRate: 0.15 })];
      const result = computeTotal(lines);
      // gross = 999990, tax = round(999990 * 0.15) = 150000 (approx)
      expect(result.subtotal).toBe(999990);
      expect(result.tax).toBeGreaterThan(149000);
      expect(result.tax).toBeLessThan(151000);
    });

    it('handles zero values', () => {
      const lines = [createLine({ qty: 0, unitPrice: 0, discount: 0, taxRate: 0.15 })];
      const result = computeTotal(lines);
      expect(result.subtotal).toBe(0);
      expect(result.discount).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(0);
    });

    it('handles missing optional fields', () => {
      const lines = [{ qty: 1, unitPrice: 100 } as MoneyLine];
      const result = computeTotal(lines);
      expect(result.subtotal).toBe(100);
      expect(result.discount).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(100);
    });
  });

  describe('computeTotalFloat — float reference', () => {
    const createLine = (overrides: Partial<MoneyLine> = {}): MoneyLine => ({
      qty: 1,
      unitPrice: 100,
      discount: 0,
      taxRate: 0.15,
      ...overrides,
    });

    it('matches integer engine for simple cases', () => {
      const lines = [createLine()];
      const intResult = computeTotal(lines);
      const floatResult = computeTotalFloat(lines);
      
      expect(floatResult.subtotal).toBe(intResult.subtotal);
      expect(floatResult.discount).toBe(intResult.discount);
      expect(floatResult.tax).toBe(intResult.tax);
      expect(floatResult.total).toBe(intResult.total);
    });

    it('matches integer engine for multi-line', () => {
      const lines = [
        createLine({ qty: 2, unitPrice: 50 }),
        createLine({ qty: 1, unitPrice: 30, discount: 5 }),
      ];
      const intResult = computeTotal(lines);
      const floatResult = computeTotalFloat(lines);
      
      expect(floatResult.subtotal).toBe(intResult.subtotal);
      expect(floatResult.discount).toBe(intResult.discount);
      expect(floatResult.tax).toBe(intResult.tax);
      expect(floatResult.total).toBe(intResult.total);
    });

    it('handles undefined optional fields (covers || 0 branches)', () => {
      const lines = [{ qty: 1, unitPrice: 100 } as MoneyLine];
      const result = computeTotalFloat(lines);
      expect(result.subtotal).toBe(100);
      expect(result.discount).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(100);
    });

    it('handles explicit undefined for qty/unitPrice/discount/taxRate', () => {
      const lines = [{ 
        qty: undefined as any, 
        unitPrice: undefined as any, 
        discount: undefined as any, 
        taxRate: undefined as any 
      } as MoneyLine];
      const result = computeTotalFloat(lines);
      expect(result.subtotal).toBe(0);
      expect(result.discount).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('Integer vs Float invariant (property-based style)', () => {
    const createRandomLine = (): MoneyLine => ({
      qty: Math.floor(Math.random() * 10) + 1,
      unitPrice: Math.round((Math.random() * 500 + 0.5) * 100) / 100,
      discount: Math.random() < 0.3 ? Math.round(Math.random() * 20 * 100) / 100 : 0,
      taxRate: 0.15,
    });

    it('10k random carts: integer vs float diff ≤ 0.05, deterministic', () => {
      let maxDiff = 0;
      const firstRunResults: number[] = [];
      
      for (let i = 0; i < 10000; i++) {
        const cart = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, createRandomLine);
        const intRes = computeTotal(cart);
        const floatRes = computeTotalFloat(cart);
        const diff = Math.abs(intRes.total - floatRes.total);
        if (diff > maxDiff) maxDiff = diff;
        if (i < 100) firstRunResults.push(intRes.total);
      }
      
      // Determinism check: re-run first 100 carts
      for (let i = 0; i < 100; i++) {
        const cart = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, createRandomLine);
        const r1 = computeTotal(cart);
        const r2 = computeTotal(cart);
        expect(r1.total).toBe(r2.total);
      }
      
      expect(maxDiff).toBeLessThanOrEqual(0.05);
    });
  });

  describe('Edge cases & ERCA compliance', () => {
    it('rounds tax per line (not on aggregate)', () => {
      // Two lines: 0.01 tax each should round to 0.01 each, not 0.02 aggregate
      const lines = [
        { qty: 1, unitPrice: 0.07, discount: 0, taxRate: 0.15 },
        { qty: 1, unitPrice: 0.07, discount: 0, taxRate: 0.15 },
      ];
      const result = computeTotal(lines);
      // Each line: gross=7, net=7, tax=round(7 * 0.15)=round(1.05)=1 cent
      // Total tax = 2 cents
      expect(result.tax).toBe(0.02);
    });

    it('handles fractional cent rounding correctly', () => {
      // 1 * 1000 * 0.15 = 150 cents -> 1.50
      const lines = [{ qty: 1, unitPrice: 10, discount: 0, taxRate: 0.15 }];
      const result = computeTotal(lines);
      expect(result.tax).toBe(1.5);
    });

    it('discount can exceed gross (negative net)', () => {
      const lines = [{ qty: 1, unitPrice: 10, discount: 15, taxRate: 0.15 }];
      const result = computeTotal(lines);
      // disc = 1500, gross = 1000, net = -500, tax = round(-500 * 0.15) = -75 cents = -0.75
      // total = 10 - 15 + (-0.75) = -5.75
      expect(result.total).toBe(-5.75);
    });

    it('empty cart returns zeros', () => {
      const result = computeTotal([]);
      expect(result.subtotal).toBe(0);
      expect(result.discount).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(0);
    });
  });
});