// HID keyboard-wedge barcode scanner support.
// Wedge scanners type the code as keystrokes then send Enter very quickly.
// We buffer printable keys and commit on Enter, resetting the buffer when
// keys arrive too slowly (that means a human is typing, not scanning).

let buffer = '';
let lastKeyTime = 0;
let active = false;

const MAX_GAP_MS = 60;
const MIN_LENGTH = 3;

function handler(e: KeyboardEvent): void {
  const now = Date.now();
  if (now - lastKeyTime > MAX_GAP_MS) buffer = '';
  lastKeyTime = now;

  if (e.key === 'Enter') {
    const code = buffer;
    buffer = '';
    if (code.length >= MIN_LENGTH && active) {
      window.dispatchEvent(new CustomEvent('shega:barcode-scan', { detail: code }));
    }
    return;
  }

  if (e.key.length === 1) buffer += e.key;
}

export function startBarcodeWedge(): void {
  if (active) return;
  active = true;
  window.addEventListener('keydown', handler);
}

export function stopBarcodeWedge(): void {
  if (!active) return;
  active = false;
  window.removeEventListener('keydown', handler);
}