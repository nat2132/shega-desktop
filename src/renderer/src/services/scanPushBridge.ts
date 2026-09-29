/**
 * Scan-push bridge (renderer side).
 *
 * A connected phone can scan a barcode and push it straight to this desktop
 * ("Use as Barcode Scanner"). The cart belongs to whichever checkout screen is
 * open, so that screen registers an accept handler here and the app-level
 * listener routes the push into it.
 *
 * When nothing has registered, the push is answered with `no_active_sale` —
 * this bridge deliberately never creates a sale of its own, it only feeds an
 * already-open cart.
 */

export type ScanPushStatus =
  | 'added'
  | 'not_found'
  | 'out_of_stock'
  | 'no_active_sale'
  | 'unavailable'
  | 'error';

export interface ScanPushVerdict {
  ok: boolean;
  status: ScanPushStatus;
  productName?: string;
  message?: string;
}

export type ScanPushHandler = (
  barcode: string,
  symbology?: string,
) => ScanPushVerdict | Promise<ScanPushVerdict>;

interface Registration {
  owner: string;
  handler: ScanPushHandler;
}

// Most-recently-registered wins. Only one checkout screen is mounted at a time,
// but a route transition can briefly overlap two.
const stack: Registration[] = [];

/**
 * Register a cart surface as the destination for phone scans. Returns an
 * unsubscribe that is a no-op if this exact registration already left.
 */
export function registerScanPushHandler(owner: string, handler: ScanPushHandler): () => void {
  const reg: Registration = { owner, handler };
  stack.push(reg);
  return () => {
    const i = stack.indexOf(reg);
    if (i >= 0) stack.splice(i, 1);
  };
}

/** True when a checkout screen is currently able to accept a pushed scan. */
export function hasActiveScanTarget(): boolean {
  return stack.length > 0;
}

/** Hand a pushed barcode to the active cart and return its verdict. */
export async function deliverScanPush(barcode: string, symbology?: string): Promise<ScanPushVerdict> {
  const reg = stack[stack.length - 1];
  if (!reg) {
    return {
      ok: false,
      status: 'no_active_sale',
      message: 'No sales checkout is open on Shega Desktop',
    };
  }
  try {
    const verdict = await reg.handler(barcode, symbology);
    return verdict ?? { ok: false, status: 'error', message: 'No result from the cart' };
  } catch (e: any) {
    return { ok: false, status: 'error', message: e?.message || 'Failed to add to cart' };
  }
}
