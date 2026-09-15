import { describe, it, expect } from 'vitest';
import {
  normalizeTin, normalizeSubTin, fromMorBackendResponse, buildClientCacheRecord,
  isVerificationFresh, isVerificationStale, verificationAgeLabel, morStatusLabel,
  isMorVerified, MOR_CACHE_TTL_MS,
} from '@shega/shared';

describe('MoR verification protocol', () => {
  it('normalizes TINs to digits only and rejects malformed input', () => {
    expect(normalizeTin(' 00-1281 4908 ')).toBe('0012814908');
    expect(normalizeTin('0012814908')).toBe('0012814908');
    expect(normalizeTin('123')).toBeNull();
    expect(normalizeTin('ABC1234567')).toBeNull();
    expect(normalizeTin(1234 as any)).toBeNull();
  });

  it('normalizes optional sub-TINs (empty → undefined, bad → null)', () => {
    expect(normalizeSubTin(undefined)).toBeUndefined();
    expect(normalizeSubTin('')).toBeUndefined();
    expect(normalizeSubTin('br1')).toBe('BR1');
    expect(normalizeSubTin('bad value!')).toBeNull();
  });

  it('maps a backend response onto the client canonical shape', () => {
    const v = fromMorBackendResponse({
      status: 'verified',
      tin: '0012814908',
      taxpayer_name: 'Aster Coffee PLC',
      reference: 'mo-1',
      verified_at: '2026-09-07T10:00:00Z',
    });
    expect(v.status).toBe('verified');
    expect(v.source).toBe('mor');
    expect(v.taxpayerName).toBe('Aster Coffee PLC');
    expect(v.reference).toBe('mo-1');
  });

  it('only live-answered statuses count as verified', () => {
    const fresh = fromMorBackendResponse({ status: 'verified', tin: '0012814908' });
    const cached = buildClientCacheRecord(fresh);
    const unavailable = { ...fresh, status: 'unavailable' };
    expect(isMorVerified(fresh)).toBe(true);
    expect(isMorVerified(cached)).toBe(true); // a dated MoR answer stays verified
    expect(isMorVerified(unavailable)).toBe(false);
  });

  it('cache records carry timestamps and expire after the TTL', () => {
    const at = new Date('2026-09-07T00:00:00.000Z').getTime();
    const v = buildClientCacheRecord(
      { tin: '0012814908', status: 'verified', source: 'mor' },
      at,
      MOR_CACHE_TTL_MS,
    );
    expect(v.source).toBe('client-cache');
    expect(isVerificationFresh(v, at)).toBe(true);
    expect(isVerificationFresh(v, at + MOR_CACHE_TTL_MS - 1)).toBe(true);
    expect(isVerificationFresh(v, at + MOR_CACHE_TTL_MS + 1)).toBe(false);
    expect(isVerificationStale(v, at + MOR_CACHE_TTL_MS + 1)).toBe(true);
  });

  it('availability/failure records are never presented as fresh', () => {
    const unavailable = { tin: '0012814908', status: 'unavailable' as const, source: 'client-cache' };
    expect(isVerificationFresh(unavailable)).toBe(false);
    expect(isVerificationStale(unavailable)).toBe(false);
  });

  it('renders honest age labels', () => {
    const at = new Date('2026-09-07T00:00:00.000Z').getTime();
    expect(verificationAgeLabel(new Date(at).toISOString(), at)).toBe('just now');
    expect(verificationAgeLabel(new Date(at - 5 * 60_000).toISOString(), at)).toBe('5m ago');
    expect(verificationAgeLabel(new Date(at - 3 * 3_600_000).toISOString(), at)).toBe('3h ago');
    expect(verificationAgeLabel(new Date(at - 2 * 86_400_000).toISOString(), at)).toBe('2d ago');
    expect(verificationAgeLabel(null, at)).toBe('');
  });

  it('never labels an unavailable answer as a Ministry verification', () => {
    expect(morStatusLabel('verified')).toContain('Ministry of Revenues');
    expect(morStatusLabel('unavailable')).toContain('unavailable');
    expect(morStatusLabel('failed')).toContain('failed');
    expect(morStatusLabel('not_found')).toContain('MoR match');
  });
});