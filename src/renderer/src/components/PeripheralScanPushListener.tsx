import { useEffect } from 'react';
import { deliverScanPush } from '../services/scanPushBridge';

/**
 * App-level listener for phone-initiated barcode pushes ("Use as Barcode
 * Scanner" on Shega Mobile).
 *
 * Mounted once, outside the routing tree, so it also answers while the desktop
 * is on a screen that has no cart — that is what produces the phone's
 * "no active sale" message instead of a silent hang.
 */
export function PeripheralScanPushListener() {
  useEffect(() => {
    const off = window.api?.onPeripheralScanPush?.((push) => {
      const pushToken = push?.pushToken;
      if (!pushToken) return;
      const barcode = String(push?.barcode || '').trim();

      void (async () => {
        const verdict = barcode
          ? await deliverScanPush(barcode, push.symbology)
          : { ok: false, status: 'error' as const, message: 'Empty barcode' };
        try {
          await window.api?.ackPeripheralScanPush?.(pushToken, { ...verdict, barcode });
        } catch {
          // The main process settles the push on its own if the ack is lost.
        }
      })();
    });
    return () => {
      try { off?.(); } catch { /* listener already gone */ }
    };
  }, []);

  return null;
}

export default PeripheralScanPushListener;
