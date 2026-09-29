import { describe, it, expect } from 'vitest';
import { isAddonPayment, ADDON_PAYMENT_TYPES, type CustomerPayment } from './usePaymentStatus';

const pay = (payment_type: string): CustomerPayment => ({
  id: 1,
  status: 'pending',
  payment_type,
});

describe('payment type classification', () => {
  it('treats a business purchase as an add-on', () => {
    expect(isAddonPayment(pay('additional_business'))).toBe(true);
  });

  it('does not treat the retired device add-ons as add-ons', () => {
    // Devices are never billed, so these types no longer exist on the server and
    // must not open the add-on path here either.
    expect(isAddonPayment(pay('additional_mobile_device'))).toBe(false);
    expect(isAddonPayment(pay('additional_desktop_device'))).toBe(false);
  });

  it('treats the subscription itself as not an add-on', () => {
    expect(isAddonPayment(pay('subscription'))).toBe(false);
    expect(isAddonPayment(pay('renewal'))).toBe(false);
  });

  /**
   * These strings cross the wire to `POST /api/customers/payments`, where the
   * server keys `ADDON_TYPES` in api/src/lib/pricing.ts. A rename on either side
   * that is not mirrored here would leave the client unable to recognise a
   * pending add-on, so the customer would be invited to buy the same thing twice.
   */
  it('uses the exact payment_type names the server accepts', () => {
    expect([...ADDON_PAYMENT_TYPES].sort()).toEqual(['additional_business']);
  });

  it('does not classify an unknown type as an add-on', () => {
    // An unrecognised value must fall through to the subscription branch, which
    // blocks the broadest set of requests, rather than open the add-on path.
    expect(isAddonPayment(pay('some_future_addon'))).toBe(false);
    expect(isAddonPayment(pay(''))).toBe(false);
  });
});
