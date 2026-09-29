// HID keyboard-wedge barcode scanner support.
// Wedge scanners type the code as keystrokes then send Enter very quickly.
// We buffer printable keys and commit on Enter, resetting the buffer when
// keys arrive too slowly (that means a human is typing, not scanning).
//
// FOCUS INDEPENDENCE
// The detector is driven purely by inter-key timing, not by which element has
// focus. That matters because the POS keeps a search input focused: a detector
// that bailed out on INPUT would only ever work when nothing was focused, and
// scanning into the search box (the most natural place for a cashier) would be
// silently dropped. Human typing is still left completely alone — it is slow,
// so it trips the gap threshold and resets the buffer before it can commit.
//
// This runs in the renderer, so it captures keystrokes while Shega has focus.
// Capturing keystrokes while ANOTHER application is in the foreground needs a
// native global hook (iohook/uiohook-class addon), which is not part of this
// build; see the hardware docs for the trade-off.

let buffer = '';
let lastKeyTime = 0;
let active = false;

/** A human types well above this; a scanner is far below it. */
const MAX_GAP_MS = 60;
const MIN_LENGTH = 3;

function inEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

function handler(e: KeyboardEvent): void {
  if (!active) return;

  const now = Date.now();
  const gap = now - lastKeyTime;
  // Slow keystroke => a human. Drop whatever we had and stop accumulating so a
  // word typed in the search box can never be mistaken for a barcode.
  if (gap > MAX_GAP_MS) buffer = '';
  lastKeyTime = now;

  if (e.key === 'Enter') {
    const code = buffer.trim();
    buffer = '';
    if (code.length >= MIN_LENGTH) {
      // We are going to deliver this as a scan, so stop the surrounding form
      // from ALSO submitting the same code and adding the item twice.
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('shega:barcode-scan', { detail: code }));
    }
    return;
  }

  if (e.key.length === 1) buffer += e.key;
}

export function startBarcodeWedge(): void {
  if (active) return;
  active = true;
  lastKeyTime = 0;
  buffer = '';
  window.addEventListener('keydown', handler, true);
}

export function stopBarcodeWedge(): void {
  if (!active) return;
  active = false;
  buffer = '';
  lastKeyTime = 0;
  window.removeEventListener('keydown', handler, true);
}

export function isBarcodeWedgeActive(): boolean {
  return active;
}
