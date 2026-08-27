import { EventEmitter } from 'events';
import { logger } from '../logger';

// ============================================
// USB HID Barcode Scanner Interceptor
// ============================================

export interface BarcodeScannerConfig {
  vendorId?: number;
  productId?: number;
  // Timing threshold in ms - keystrokes within this interval are treated as barcode
  keyIntervalThreshold?: number;
  // Expected barcode length range
  minLength?: number;
  maxLength?: number;
  // Characters that terminate barcode input
  terminationChars?: string[];
  // Prefix/suffix to strip
  stripPrefix?: string;
  stripSuffix?: string;
}

export interface BarcodeScanResult {
  barcode: string;
  timestamp: number;
  rawInput: string;
}

type ScannerEventMap = {
  scan: [BarcodeScanResult];
  error: [Error];
  connected: [string];
  disconnected: [string];
};

export class HidBarcodeScanner extends EventEmitter<ScannerEventMap> {
  private usb: any = null;
  private device: any = null;
  private interface: any = null;
  private inEndpoint: any = null;
  private buffer = '';
  private lastKeyTime = 0;
  private config: Required<BarcodeScannerConfig>;
  private isListening = false;

  constructor(config: BarcodeScannerConfig = {}) {
    super();
    this.config = {
      vendorId: config.vendorId ?? 0,
      productId: config.productId ?? 0,
      keyIntervalThreshold: config.keyIntervalThreshold ?? 30,
      minLength: config.minLength ?? 4,
      maxLength: config.maxLength ?? 64,
      terminationChars: config.terminationChars ?? ['Enter', '\r', '\n'],
      stripPrefix: config.stripPrefix ?? '',
      stripSuffix: config.stripSuffix ?? '',
    };
  }

  async connect(vendorId?: number, productId?: number): Promise<void> {
    const vid = vendorId ?? this.config.vendorId;
    const pid = productId ?? this.config.productId;

    if (!vid || !pid) {
      throw new Error('Vendor ID and Product ID required');
    }

    const usb = await import('usb');
    this.usb = usb;

    this.device = usb.findByIds(vid, pid);
    if (!this.device) {
      throw new Error(`HID device not found: ${vid.toString(16)}:${pid.toString(16)}`);
    }

    this.device.open();

    // Find HID interface (usually interface 0 for barcode scanners)
    const interfaces = this.device.interfaces;
    let hidInterface = null;

    for (const iface of interfaces) {
      if (iface.descriptor.bInterfaceClass === 3) { // HID class
        hidInterface = iface;
        break;
      }
    }

    if (!hidInterface) {
      // Fallback to first interface
      hidInterface = interfaces[0];
    }

    if (!hidInterface) {
      throw new Error('No suitable interface found on device');
    }

    this.interface = hidInterface;
    this.interface.claim();

    // Find interrupt IN endpoint
    for (const ep of hidInterface.endpoints) {
      if (ep.direction === 'in' && (ep.descriptor.bmAttributes & 0x03) === 3) { // interrupt IN
        this.inEndpoint = ep;
        break;
      }
    }

    if (!this.inEndpoint) {
      throw new Error('No interrupt IN endpoint found');
    }

    // Start polling
    this.inEndpoint.startPoll(1, 64);
    this.inEndpoint.on('data', this.handleData.bind(this));
    this.inEndpoint.on('error', (err: Error) => this.emit('error', err));

    logger.info(`[Barcode] Connected to scanner`);
    this.emit('connected', `Scanner connected`);
  }

  private handleData(data: Buffer): void {
    // HID keyboard report format: [modifier, reserved, keycode1, keycode2, ...]
    // We're interested in keycodes (bytes 2+)
    if (data.length < 3) return;

    const keycodes = Array.from(data.slice(2));
    
    for (const keycode of keycodes) {
      if (keycode === 0) continue; // No key pressed

      const now = Date.now();
      const char = this.keycodeToChar(keycode);
      
      if (!char) continue;

      // Check timing - if too much time passed, reset buffer
      if (now - this.lastKeyTime > this.config.keyIntervalThreshold) {
        this.buffer = '';
      }

      this.buffer += char;
      this.lastKeyTime = now;

      // Check for termination
      if (this.config.terminationChars.some(t => this.buffer.endsWith(t))) {
        this.processBarcode();
      }

      // Check max length
      if (this.buffer.length >= this.config.maxLength) {
        this.processBarcode();
      }
    }
  }

  private keycodeToChar(keycode: number): string | null {
    // USB HID Keyboard keycodes (simplified)
    const keyMap: Record<number, string> = {
      0x04: 'a', 0x05: 'b', 0x06: 'c', 0x07: 'd', 0x08: 'e', 0x09: 'f',
      0x0A: 'g', 0x0B: 'h', 0x0C: 'i', 0x0D: 'j', 0x0E: 'k', 0x0F: 'l',
      0x10: 'm', 0x11: 'n', 0x12: 'o', 0x13: 'p', 0x14: 'q', 0x15: 'r',
      0x16: 's', 0x17: 't', 0x18: 'u', 0x19: 'v', 0x1A: 'w', 0x1B: 'x',
      0x1C: 'y', 0x1D: 'z',
      0x1E: '1', 0x1F: '2', 0x20: '3', 0x21: '4', 0x22: '5',
      0x23: '6', 0x24: '7', 0x25: '8', 0x26: '9', 0x27: '0',
      0x28: '\n', // Enter
      0x2A: '[BACKSPACE]',
      0x2C: ' ', // Space
      0x2D: '-', 0x2E: '=', 0x2F: '[', 0x30: ']',
      0x31: '\\', 0x33: ';', 0x34: "'", 0x36: ',', 0x37: '.', 0x38: '/',
      // Numpad
      0x59: '1', 0x5A: '2', 0x5B: '3', 0x5C: '4', 0x5D: '5',
      0x5E: '6', 0x5F: '7', 0x60: '7', 0x61: '8', 0x62: '9',
    };

    // Handle shift-modified keys
    // For simplicity, we only handle basic keys here
    return keyMap[keycode] || null;
  }

  private processBarcode(): void {
    let barcode = this.buffer.trim();

    // Strip prefix/suffix
    if (this.config.stripPrefix && barcode.startsWith(this.config.stripPrefix)) {
      barcode = barcode.slice(this.config.stripPrefix.length);
    }
    if (this.config.stripSuffix && barcode.endsWith(this.config.stripSuffix)) {
      barcode = barcode.slice(0, -this.config.stripSuffix.length);
    }

    // Validate length
    if (barcode.length < this.config.minLength || barcode.length > this.config.maxLength) {
      this.buffer = '';
      return;
    }

    const result: any = {
      barcode,
      timestamp: Date.now(),
      rawInput: this.buffer,
    };

    this.buffer = '';
    logger.info(`[Barcode] Scanned: ${barcode}`);
    this.emit('scan', result);
  }

  disconnect(): void {
    if (this.inEndpoint) {
      this.inEndpoint.stopPoll();
    }
    if (this.device) {
      try {
        this.device.close();
      } catch (e) {
        logger.warn('[Barcode] Error closing:', e);
      }
    }
    this.device = null;
    this.interface = null;
    this.inEndpoint = null;
    this.buffer = '';
    this.emit('disconnected', 'Scanner disconnected');
  }

  isConnected(): boolean {
    return this.device !== null && this.inEndpoint !== null;
  }

  updateConfig(config: Partial<BarcodeScannerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ============================================
// Cross-Platform Keyboard Listener (Desktop Renderer)
// ============================================

export class KeyboardBarcodeListener {
  private buffer = '';
  private lastKeyTime = 0;
  private config: Required<any>;
  private handler: (e: KeyboardEvent) => void;
  private isListening = false;

  constructor(config: any = {}) {
    this.config = {
      keyIntervalThreshold: config.keyIntervalThreshold ?? 50,
      minLength: config.minLength ?? 4,
      maxLength: config.maxLength ?? 64,
      terminationKeys: config.terminationKeys ?? ['Enter'],
      stripPrefix: config.stripPrefix ?? '',
      stripSuffix: config.stripSuffix ?? '',
      targetSelector: config.targetSelector ?? 'input, textarea, [contenteditable]',
    };
  }

  start(): void {
    if (this.isListening) return;
    this.isListening = true;
    this.handler = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.handler, true);
  }

  stop(): void {
    if (!this.isListening) return;
    this.isListening = false;
    document.removeEventListener('keydown', this.handler, true);
    this.buffer = '';
  }

  private buffer = '';
  private lastKeyTime = 0;

  private handleKeyDown(e: KeyboardEvent): void {
    // Only intercept if not in an input field (barcode scanner acts as keyboard)
    const target = e.target as HTMLElement;
    const isInputField = this.config.targetSelector 
      ? target.matches(this.config.targetSelector)
      : target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    // If we're in an input field, let the event pass through normally
    if (isInputField) return;

    const now = Date.now();
    const key = e.key;

    // Check timing
    if (now - this.lastKeyTime > (this.config as any).keyIntervalThreshold) {
      this.buffer = '';
    }

    if (key === 'Enter' || this.config.terminationKeys?.includes(key)) {
      this.processBarcode();
      e.preventDefault();
      return;
    }

    if (key.length === 1) {
      this.buffer += key;
    }

    this.lastKeyTime = now;

    // Check max length
    if (this.buffer.length >= (this.config as any).maxLength) {
      this.processBarcode();
    }
  }

  private processBarcode(): void {
    let barcode = this.buffer.trim();

    if (barcode.length < 4) {
      this.buffer = '';
      return;
    }

    const event = new CustomEvent('barcodescan', {
      detail: {
        barcode,
        timestamp: Date.now(),
        rawInput: this.buffer,
      }
    });

    document.dispatchEvent(event);
    this.buffer = '';
  }

  isListeningActive(): boolean {
    return this.isListening;
  }
}

// React hook for barcode scanning
export function useBarcodeScanner(config: any = {}) {
  const [listener] = useState(() => new KeyboardBarcodeListener(config));
  const [lastScan, setLastScan] = useState<{ barcode: string; timestamp: number } | null>(null);

  useEffect(() => {
    listener.start();
    const handler = (e: CustomEvent) => {
      setLastScan({ barcode: e.detail.barcode, timestamp: e.detail.timestamp });
    };
    document.addEventListener('barcodescan', handler as EventListener);
    return () => {
      listener.stop();
      document.removeEventListener('barcodescan', handler as EventListener);
    };
  }, []);

  return { listener, lastScan };
}

// Need to import React for the hook
import { useState, useEffect } from 'react';

export default {
  HidBarcodeScanner,
  KeyboardBarcodeListener,
  useBarcodeScanner,
};