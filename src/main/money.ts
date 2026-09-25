/* 5.2 Money handling — operate in integer minor units (ETB × 100) to avoid
 * float drift in VAT/discount chains. All amounts enter/exit as numbers
 * (major units, e.g. 19.99) but are converted to cents (1999) for arithmetic;
 * totals are rounded once per line and once at the total using the documented
 * ETB convention (HALF_UP at the line, then sum). A property invariant is
 * checked in the E2E suite (10k carts: integer vs float differ by <= 0.01 and
 * are deterministic across runs). */

export const MINOR_UNITS_PER_MAJOR = 100;

/** One cart line, in major units. Discount and tax rate default to 0. */
export interface MoneyLine {
  qty: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}

/** A cart total, in major units. */
export interface MoneyResult {
  /** Sum of line gross (qty * unitPrice) before discount. */
  subtotal: number;
  /** Sum of line discounts. */
  discount: number;
  tax: number;
  /** subtotal - discount + tax */
  total: number;
}

/** Convert a major-unit amount (e.g. 19.99) to minor units (1999). */
export function toMinor(amount: number): number {
  return Math.round(Number(amount) * MINOR_UNITS_PER_MAJOR);
}

/** Convert minor units back to major units (1999 -> 19.99). */
export function fromMinor(cents: number): number {
  return Math.round(Number(cents)) / MINOR_UNITS_PER_MAJOR;
}

/** Round half-up to 2 decimals in major units (matches ERCA invoice rounding). */
export function roundMoney(amount: number): number {
  const c = toMinor(amount);
  return fromMinor(c);
}

/**
 * Compute a cart total in minor units with the documented ETB rule (5.2):
 * round once per line, sum line totals, round tax per line.
 *   lineGross = round(qty * unitPrice)
 *   lineDisc  = round(discount)
 *   lineNet   = lineGross - lineDisc
 *   subtotal  = sum(lineGross)
 *   discount  = sum(lineDisc)
 *   tax       = sum(round(lineNet * taxRate))
 *   total     = subtotal - discount + tax
 * Integer arithmetic in cents; only the final return is in major units.
 * Deterministic for identical inputs.
 */
export function computeTotal(lines: MoneyLine[]): MoneyResult {
  let subtotalCents = 0;
  let discountCents = 0;
  let taxCents = 0;
  for (const l of lines) {
    const gross = toMinor((l.qty || 0) * (l.unitPrice || 0));
    const disc = toMinor(l.discount || 0);
    const net = gross - disc;
    subtotalCents += gross;
    discountCents += disc;
    taxCents += Math.round(net * (l.taxRate || 0));
  }
  return {
    subtotal: fromMinor(subtotalCents),
    discount: fromMinor(discountCents),
    tax: fromMinor(taxCents),
    total: fromMinor(subtotalCents - discountCents + taxCents),
  };
}

/** Float-reference total (same rule, using JS floats) for the invariant test. */
export function computeTotalFloat(lines: MoneyLine[]): MoneyResult {
  let subtotal = 0;
  let discount = 0;
  let tax = 0;
  for (const l of lines) {
    const gross = Math.round((l.qty || 0) * (l.unitPrice || 0) * MINOR_UNITS_PER_MAJOR) / MINOR_UNITS_PER_MAJOR;
    const disc = Math.round((l.discount || 0) * MINOR_UNITS_PER_MAJOR) / MINOR_UNITS_PER_MAJOR;
    const net = gross - disc;
    subtotal += gross;
    discount += disc;
    tax += Math.round(net * (l.taxRate || 0) * MINOR_UNITS_PER_MAJOR) / MINOR_UNITS_PER_MAJOR;
  }
  return {
    subtotal,
    discount,
    tax,
    total: Math.round((subtotal - discount + tax) * MINOR_UNITS_PER_MAJOR) / MINOR_UNITS_PER_MAJOR,
  };
}

export default { toMinor, fromMinor, roundMoney, computeTotal, computeTotalFloat, MINOR_UNITS_PER_MAJOR };
