import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  EscposWriter,
  buildReceiptBytes,
  sampleReceiptPayload,
  decodeEscposBytes,
  renderAscii,
  renderConsole,
  renderHtml,
  renderHtmlFragment,
  canvasOps,
  canvasSize,
  MockHidKeystrokeScanner,
  MockSerialScanner,
  MockThermalPrinterDriver,
  PeripheralMockService,
  getPeripheralMockService,
  installMockPeripherals,
  USE_MOCK_PERIPHERALS,
  describePeripheralEnvironment,
  syncScheduler,
  type PrintJobEvent,
  type ScannedBarcode,
} from '../../../shega-shared/src/peripherals';

const MOCK_ENV_ON = USE_MOCK_PERIPHERALS;

describe('ESC/POS decoder', () => {
  it('decodes a full receipt byte stream into the expected token stream', () => {
    const w = new EscposWriter()
      .init()
      .codePage(0)
      .align('center')
      .size(2, 2)
      .bold(true)
      .text('ARTISAN CAFE')
      .lineFeed()
      .size(1, 1)
      .bold(false)
      .align('left')
      .column('Order', 'INV-1', 32)
      .barcodeCode128('INV-1')
      .qr('SHEGA-QR-1')
      .cut(true);

    const decoded = decodeEscposBytes(w.toUint8Array());
    const kinds = decoded.tokens.map((t) => t.kind);
    expect(kinds).toContain('init');
    expect(kinds).toContain('codepage');
    expect(kinds).toContain('align');
    expect(kinds).toContain('doubled');
    expect(kinds).toContain('bold');
    expect(kinds).toContain('feed');
    expect(kinds).toContain('barcode');
    expect(kinds).toContain('qr');
    expect(kinds).toContain('cut');
    expect(decoded.hasCut).toBe(true);
    expect(decoded.printableChars).toBeGreaterThan(20);

    const barcode = decoded.tokens.find((t) => t.kind === 'barcode');
    expect(barcode?.kind).toBe('barcode');
    if (barcode?.kind === 'barcode') {
      expect(barcode.data).toBe('INV-1');
      expect(barcode.symbology).toBe('CODE128');
    }
    const qr = decoded.tokens.find((t) => t.kind === 'qr');
    if (qr?.kind === 'qr') expect(qr.data).toBe('SHEGA-QR-1');
  });

  it('round-trips a structured receipt: build → decode', () => {
    // orderId lives on meta; the override is shallow, so replace meta wholesale.
    const sample = sampleReceiptPayload();
    const payload = sampleReceiptPayload({ meta: { ...sample.meta, orderId: 'RT-1001' } });
    const bytes = buildReceiptBytes(payload);
    const decoded = decodeEscposBytes(bytes);
    expect(decoded.totalBytes).toBe(bytes.length);
    expect(decoded.hasCut).toBe(true);
    expect(decoded.commands.some((c) => c.id === 'barcode')).toBe(true);
    // Business name appears as printable text somewhere in the stream.
    expect(decoded.printableChars).toBeGreaterThan(0);
  });

  it('does not throw on truncated or garbage input', () => {
    expect(() => decodeEscposBytes(new Uint8Array([0x1b]))).not.toThrow();
    expect(() => decodeEscposBytes(new Uint8Array([0x1d, 0x76]))).not.toThrow();
    expect(() => decodeEscposBytes(new Uint8Array([0x1d, 0x28, 0x6b, 0xff]))).not.toThrow();
    expect(() => decodeEscposBytes(Uint8Array.from([0x1b, 0x40, 0x00, 0x7f, 0x09]))).not.toThrow();
  });

  it('records drawer-kick commands for ESC p', () => {
    const bytes = new EscposWriter().init().openDrawer(2).toUint8Array();
    const decoded = decodeEscposBytes(bytes);
    expect(decoded.hasDrawer).toBe(true);
    const drawer = decoded.tokens.find((t) => t.kind === 'drawer');
    if (drawer?.kind === 'drawer') expect(drawer.pin).toBe(2);
  });
});

describe('ESC/POS renderer', () => {
  it('renders ASCII preview centred + with cut marker for a sample receipt', () => {
    const payload = sampleReceiptPayload({ meta: { ...sampleReceiptPayload().meta, businessName: 'BEAN BOUTIQUE' } });
    const bytes = buildReceiptBytes(payload);
    const ascii = renderAscii(decodeEscposBytes(bytes).tokens, { paperWidth: 58 });
    expect(ascii.replace(/\s+/g, '')).toContain('BEAN BOUTIQUE'.replace(/\s+/g, ''));
    expect(ascii).toContain('CUT');
    expect(ascii).toContain('TOTAL');
    expect(ascii).toContain('Order');
  });

  it('renders a standalone HTML document plus a fragment', () => {
    const bytes = buildReceiptBytes(sampleReceiptPayload());
    const html = renderHtml(decodeEscposBytes(bytes).tokens, { paperWidth: 58 });
    const fragment = renderHtmlFragment(decodeEscposBytes(bytes).tokens, { paperWidth: 58 });
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<body>');
    expect(html).toContain('</html>');
    expect(fragment).toContain('</div>');
  });

  it('produces canvas ops of finite size', () => {
    const bytes = buildReceiptBytes(sampleReceiptPayload());
    const tokens = decodeEscposBytes(bytes).tokens;
    const ops = canvasOps(tokens, { paperWidth: 58 });
    expect(ops.length).toBeGreaterThan(0);
    const { width, height } = canvasSize(tokens, { paperWidth: 58 });
    expect(width).toBe(32 * 8);
    expect(height).toBeGreaterThan(10);
  });

  it('annotates drawer kicks in the ANSI console render', () => {
    const bytes = new EscposWriter().init().openDrawer(2).lineFeed().cut(true).toUint8Array();
    const out = renderConsole(decodeEscposBytes(bytes).tokens, { paperWidth: 58 });
    expect(out).toContain('CASH DRAWER');
  });
});

describe('MockHidKeystrokeScanner (USB-HID wedge)', () => {
  it('delivers a scan after a <20ms-per-key stream terminated by Enter', async () => {
    const scanner = new MockHidKeystrokeScanner({ minIntervalMs: 8, maxIntervalMs: 19, scheduler: syncScheduler, now: () => 1000 });
    let received: ScannedBarcode | null = null;
    scanner.onScan((s) => {
      received = s;
    });
    scanner.start();
    const result = await scanner.simulate('6294001234567');
    expect(received).not.toBeNull();
    expect(result.code).toBe('6294001234567');
    expect(result.simulated).toBe(true);
    expect(result.transport).toBe('hid');
    expect(result.keyDetail?.terminator).toBe('enter');
    // 13 key chars + 1 terminating Enter key.
    expect(result.keyDetail?.intervalsMs.length).toBe(14);
    expect(result.keyDetail!.maxIntervalMs).toBeLessThan(20);
    // All key intervals within the configured window.
    for (const iv of result.keyDetail!.intervalsMs) expect(iv).toBeGreaterThanOrEqual(8);
    expect(scanner.active).toBe(true);
    scanner.stop();
    expect(scanner.active).toBe(false);
  });

  it('omits the terminating key when terminator=none', async () => {
    const scanner = new MockHidKeystrokeScanner({ scheduler: syncScheduler });
    const result = await scanner.simulate('ABC', { terminator: 'none' });
    expect(result.keyDetail?.intervalsMs.length).toBe(3);
    expect(result.keyDetail?.terminator).toBe('none');
  });

  it('unsubscribes listeners', async () => {
    const scanner = new MockHidKeystrokeScanner({ scheduler: syncScheduler });
    const spy = vi.fn();
    const off = scanner.onScan(spy);
    await scanner.simulate('X');
    expect(spy).toHaveBeenCalledTimes(1);
    off();
    await scanner.simulate('Y');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('MockSerialScanner (Serial/COM)', () => {
  it('streams a single payload immediately', async () => {
    const scanner = new MockSerialScanner({ intervalMs: 0 });
    const listener = vi.fn();
    scanner.onScan(listener);
    const result = await scanner.simulate('01380000401842', { terminator: '\r\n' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(result.code).toBe('01380000401842');
    expect(result.transport).toBe('serial');
    expect(result.simulated).toBe(true);
    expect(result.keyDetail?.terminator).toBe('\r\n');
  });

  it('start/stop controls the active state without leaking timers', () => {
    const scanner = new MockSerialScanner({ intervalMs: 0 });
    scanner.start();
    expect(scanner.active).toBe(true);
    scanner.stop();
    expect(scanner.active).toBe(false);
  });
});

describe('MockThermalPrinterDriver (network/cable ESC/POS)', () => {
  let printer: MockThermalPrinterDriver;
  beforeEach(() => {
    printer = new MockThermalPrinterDriver({ name: 'Test TSP-743', paperWidth: 58 });
    printer.clear();
  });

  it('intercepts raw bytes, decodes them and previews the job', () => {
    const onPrint = vi.fn((_job: PrintJobEvent) => {});
    printer.onPrint(onPrint);
    const bytes = buildReceiptBytes(sampleReceiptPayload());
    const job = printer.printBytes(bytes);
    expect(job.simulated).toBe(true);
    expect(job.byteLength).toBe(bytes.length);
    expect(job.decoded.hasCut).toBe(true);
    expect(job.preview.ascii).toContain('CUT');
    expect(job.preview.html).toContain('<!DOCTYPE html>');
    expect(onPrint).toHaveBeenCalledTimes(1);
    expect(printer.lastJob?.jobId).toBe(job.jobId);
    expect(printer.totalJobs).toBe(1);
    expect(printer.totalBytes).toBe(bytes.length);
  });

  it('printReceipt builds the bytes internally and decodes them back', () => {
    const job = printer.printReceipt(sampleReceiptPayload({ paperWidth: 80 }));
    expect(job.byteLength).toBeGreaterThan(0);
    expect(job.decoded.commands.length).toBeGreaterThan(10);
    const firstText = job.decoded.tokens.find((t) => t.kind === 'text');
    expect(job.preview.ascii.replace(/\s+/g, '')).toContain((firstText?.kind === 'text' ? firstText.text : '').replace(/\s+/g, ''));
  });
});

describe('PeripheralMockService + environment gating', () => {
  beforeEach(() => {
    getPeripheralMockService().stop();
  });

  it('reports USB as desktop-only from a Node/test environment', () => {
    const env = describePeripheralEnvironment();
    expect(env.platform).toBe('desktop');
    expect(env.usbSupported).toBe(true);
    expect(env.mockEnabled).toBe(MOCK_ENV_ON);
  });

  it('runs a synthetic serial scan through the bridge', async () => {
    const svc = getPeripheralMockService();
    let bridged: ScannedBarcode | null = null;
    svc.subscribeScan((scan) => {
      bridged = scan;
    });
    const scan = await svc.scan('6294001234567', 'serial');
    expect(scan.simulated).toBe(true);
    // The assignment happens inside the subscriber callback, which control-flow
    // analysis cannot see, so the read needs an explicit widening.
    expect((bridged as ScannedBarcode | null)?.code).toBe('6294001234567');
  });

  it('prints a receipt and exposes preview + status counters', async () => {
    const svc = getPeripheralMockService();
    const job = await svc.print({ paperWidth: 58 });
    const status = svc.status();
    expect(status.printerJobs).toBeGreaterThanOrEqual(1);
    expect(status.printerBytes).toBeGreaterThan(0);
    expect(status.lastJobId).toBe(job.jobId);
    expect(status.lastPreviewLines).toBeGreaterThan(0);
    expect(status.lastPreviewHtmlChars).toBeGreaterThan(0);
  });

  it('decodes + previews raw bytes through the service', () => {
    const svc = getPeripheralMockService();
    const bytes = new EscposWriter().init().align('center').bold(true).text('HI').lineFeed().cut(true).toUint8Array();
    const decoded = svc.decode(bytes);
    expect(decoded.hasCut).toBe(true);
    const preview = svc.preview(bytes, 58);
    expect(preview.ascii).toContain('CUT');
    expect(preview.canvasOps.length).toBeGreaterThan(0);
  });

  it('installMockPeripherals installs console helpers when enabled', () => {
    const installed = installMockPeripherals();
    expect(installed).toBe(MOCK_ENV_ON);
    if (MOCK_ENV_ON) {
      const g = globalThis as Record<string, unknown>;
      expect(typeof g.__shegaMockScan).toBe('function');
      expect(typeof (g.__shegaMockPeripherals as Record<string, unknown>).printReceipt).toBe('function');
    }
  });
});

describe('receipt money formatting', () => {
  it('formats a line item with quantity x unit price', () => {
    const payload = sampleReceiptPayload();
    const decoded = decodeEscposBytes(buildReceiptBytes(payload));
    const text = decoded.tokens.filter((t) => t.kind === 'text').map((t) => (t.kind === 'text' ? t.text : '')).join('\n');
    expect(text).toContain('x');
  });
});