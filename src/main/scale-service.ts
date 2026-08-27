// Scale reading parser — pure, dependency-free.
// Handles the common retail scale protocols:
//   CAS / Dibal:        "1.250 kg", "1.250kg", "0002500g" (0.01kg resolution)
//   Mettler-Toledo:     "ST,GS,+0001.250kg"  (ST=stable, GS=weight)
//   STX/ETX wrapped:    "\x02W 1.250 kg\x03"  or  "\x02S, 1.250 kg\x03"
//   Poll response:      "W 1.250 kg"
// Stability markers:    leading S = stable; leading D or "unstable" = not stable;
//                       "U" in some protocols = unstable; "I" = in-motion.

export interface ScaleReading {
  weightKg: number | null;
  unit: string;
  stable: boolean;
  zero: boolean;
  net: boolean;
  raw: string;
}

export interface ScaleConfig {
  baud: number;
  parity: string;
  dataBits: number;
  stopBits: number;
}

export const DEFAULT_SCALE_CONFIG: ScaleConfig = {
  baud: 9600,
  parity: 'none',
  dataBits: 8,
  stopBits: 1,
};

const STABLE_MARKERS = ['S', 'T']; // leading stable markers in ASCII protocols
const UNSTABLE_MARKERS = ['D', 'I', 'U'];

export function parseWeightLine(line: string): ScaleReading {
  const raw = line.trim();

  if (!raw) return { weightKg: null, unit: '', stable: false, zero: false, net: false, raw };

  let stable = true;
  let zero = false;
  let net = false;

  // Protocol wrappers / status codes.
  let body = raw;
  const upper = raw.toUpperCase();

  if (upper.startsWith('ST')) {
    stable = true;
    body = raw.slice(2);
  } else if (upper.startsWith('US')) {
    stable = false;
    body = raw.slice(2);
  } else if (UNSTABLE_MARKERS.some((m) => upper.startsWith(m) && (upper.startsWith(m + ',') || upper.startsWith(m + ' ')))) {
    stable = false;
    body = raw.slice(1);
  } else if (STABLE_MARKERS.includes(upper[0] || '') && upper.length > 1) {
    stable = true;
    body = raw.slice(1);
  }

  if (/\bNET\b/i.test(upper)) net = true;
  if (/\bZERO\b/i.test(upper) || /^\s*0(\.0+)?\s*(kg|g)?\s*$/i.test(body)) zero = true;

  // Extract number + unit.
  const m = body.match(/([-+]?\d+(?:\.\d+)?)\s*(kg|g|lb|oz)?/i);
  if (!m) return { weightKg: null, unit: '', stable, zero, net, raw };

  const num = parseFloat(m[1]);
  const unit = (m[2] || 'kg').toLowerCase();

  let weightKg: number;
  if (unit === 'g') weightKg = num / 1000;
  else if (unit === 'lb') weightKg = num * 0.45359237;
  else if (unit === 'oz') weightKg = num * 0.028349523125;
  else weightKg = num;

  if (weightKg < 0) weightKg = 0;

  return { weightKg, unit: unit === 'g' ? 'g' : unit, stable, zero, net, raw };
}

// Debounce a scale stream: only accept a reading that has held steady for
// `ms` (typical 300ms) to avoid capturing in-motion values.
export class ScaleDebouncer {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private last: ScaleReading | null = null;

  constructor(private ms: number = 300) {}

  push(reading: ScaleReading, onStable: (r: ScaleReading) => void): void {
    if (this.timer) clearTimeout(this.timer);
    this.last = reading;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.last) onStable(this.last);
    }, this.ms);
  }

  flush(onStable: (r: ScaleReading) => void): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
      if (this.last) onStable(this.last);
    }
  }
}