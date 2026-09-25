import { describe, it, expect } from 'vitest';
import { buildRtcConfiguration, iceServerUrls } from '@shega/shared';
import { iceCandidateType, readIceServersFromEnv, stripUrlCreds } from './webrtc-manager';

describe('buildRtcConfiguration', () => {
  it('collapses to STUN defaults when given no TURN servers', () => {
    const cfg = buildRtcConfiguration(undefined);
    const urls = cfg.flatMap((s) => iceServerUrls(s));
    expect(urls).toContain('stun:stun.l.google.com:19302');
    expect(urls).toContain('stun:stun1.l.google.com:19302');
  });

  it('merges TURN servers after the STUN defaults, deduplicating URLs', () => {
    const cfg = buildRtcConfiguration([
      { urls: 'turn:relay.example.com:3478', username: 'u', credential: 'p' },
      { urls: ['turn:relay.example.com:3478', 'stun:stun.l.google.com:19302'] },
    ]);
    const urls = cfg.flatMap((s) => iceServerUrls(s));
    expect(urls.filter((u) => u === 'turn:relay.example.com:3478')).toHaveLength(1);
    // STUN default survives and is not duplicated.
    expect(urls.filter((u) => u === 'stun:stun.l.google.com:19302')).toHaveLength(1);
  });

  it('never mutates the shared defaults', () => {
    const before = iceServerUrls({ urls: ['stun:stun.l.google.com:19302'] });
    buildRtcConfiguration([{ urls: 'turn:x.example.com', username: 'u', credential: 'p' }]);
    expect(iceServerUrls({ urls: ['stun:stun.l.google.com:19302'] })).toEqual(before);
  });
});

describe('readIceServersFromEnv', () => {
  it('returns [] when nothing is configured', () => {
    expect(readIceServersFromEnv({})).toEqual([]);
  });

  it('parses a single TURN url with credentials', () => {
    const servers = readIceServersFromEnv({
      SHEGA_TURN_URL: 'turn:relay.example.com:3478',
      SHEGA_TURN_USERNAME: 'user',
      SHEGA_TURN_PASSWORD: 'secret',
    });
    expect(servers).toEqual([{ urls: 'turn:relay.example.com:3478', username: 'user', credential: 'secret' }]);
  });

  it('supports a comma-separated list of TURN urls', () => {
    const servers = readIceServersFromEnv({
      SHEGA_TURN_URL: 'turn:a.example.com:3478,turn:b.example.com:3478',
    });
    expect(servers[0].urls).toEqual(['turn:a.example.com:3478', 'turn:b.example.com:3478']);
  });

  it('honours a JSON override for per-server credentials', () => {
    const servers = readIceServersFromEnv({
      SHEGA_ICE_SERVERS: JSON.stringify([{ urls: ['turn:x.com:3478'], username: 'u', credential: 'p' }]),
    });
    expect(servers).toEqual([{ urls: ['turn:x.com:3478'], username: 'u', credential: 'p' }]);
  });
});

describe('diagnostics helpers', () => {
  it('extracts candidate types without exposing addresses', () => {
    expect(iceCandidateType('candidate:1 1 udp 2113937151 192.168.1.5 52107 typ host')).toBe('host');
    expect(iceCandidateType('candidate:2 1 udp 2113937151 1.2.3.4 52107 typ srflx')).toBe('srflx');
    expect(iceCandidateType('candidate:3 1 udp 2113937151 1.2.3.4 52107 typ relay')).toBe('relay');
    expect(iceCandidateType('')).toBeNull();
  });

  it('redacts credentials from diagnostics', () => {
    expect(stripUrlCreds('turn:relay.example.com:3478')).toBe('turn:relay.example.com:3478');
    expect(stripUrlCreds('turn:user:secret@relay.example.com:3478')).toBe('turn:***:***@relay.example.com:3478');
  });
});