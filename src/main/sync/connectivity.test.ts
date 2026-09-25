/**
 * Unit tests for the network signature helper in connectivity.ts.
 *
 * The monitor's probe loop depends on real network/Electron, so we test only
 * the pure deterministic fingerprint: internal interfaces are excluded, order
 * is normalized, and any address change produces a different signature (the
 * "network-changed" trigger).
 */
import { describe, it, expect } from 'vitest';
import { networkInterfacesSignature } from './connectivity';

type IfaceRecord = Array<{ address: string; internal: boolean }>;

describe('networkInterfacesSignature', () => {
  it('returns empty string for no interfaces / all-internal', () => {
    expect(networkInterfacesSignature({})).toBe('');
    expect(networkInterfacesSignature({ eth0: [] })).toBe('');
    expect(networkInterfacesSignature({
      lo: [{ address: '127.0.0.1', internal: true }],
    })).toBe('');
  });

  it('excludes internal loopback-like interfaces', () => {
    const ifaces: Record<string, IfaceRecord> = {
      lo: [{ address: '127.0.0.1', internal: true }],
      'Wi-Fi': [{ address: '192.168.1.20', internal: false }],
    };
    expect(networkInterfacesSignature(ifaces)).toBe('Wi-Fi:192.168.1.20');
  });

  it('normalizes ordering regardless of interface enumeration order', () => {
    const a: Record<string, IfaceRecord> = {
      'Ethernet': [{ address: '10.0.0.5', internal: false }],
      'Wi-Fi': [{ address: '192.168.1.20', internal: false }],
    };
    const b: Record<string, IfaceRecord> = {
      'Wi-Fi': [{ address: '192.168.1.20', internal: false }],
      'Ethernet': [{ address: '10.0.0.5', internal: false }],
    };
    expect(networkInterfacesSignature(a)).toBe(networkInterfacesSignature(b));
    expect(networkInterfacesSignature(a)).toBe('Ethernet:10.0.0.5,Wi-Fi:192.168.1.20');
  });

  it('changes signature when an address changes (network switch / VPN up)', () => {
    const before: Record<string, IfaceRecord> = {
      'Wi-Fi': [{ address: '192.168.1.20', internal: false }],
    };
    const after: Record<string, IfaceRecord> = {
      'Wi-Fi': [{ address: '192.168.8.44', internal: false }],
    };
    expect(networkInterfacesSignature(after)).not.toBe(networkInterfacesSignature(before));
  });

  it('stays stable when an internal-only adapter is added', () => {
    const before: Record<string, IfaceRecord> = {
      'Wi-Fi': [{ address: '192.168.1.20', internal: false }],
    };
    const after: Record<string, IfaceRecord> = {
      'Wi-Fi': [{ address: '192.168.1.20', internal: false }],
      'Loopback Pseudo-Interface': [{ address: '127.0.0.1', internal: true }],
    };
    expect(networkInterfacesSignature(after)).toBe(networkInterfacesSignature(before));
  });
});