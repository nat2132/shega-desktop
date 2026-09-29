import { describe, it, expect } from 'vitest';
import { displayUsername } from './username';

describe('displayUsername', () => {
  it('shows an email username without a leading @', () => {
    expect(displayUsername('yene@gmail.com')).toBe('yene@gmail.com');
  });

  it('removes an @ that was already baked into the value', () => {
    expect(displayUsername('@yene@gmail.com')).toBe('yene@gmail.com');
    expect(displayUsername('@@yene@gmail.com')).toBe('yene@gmail.com');
  });

  it('keeps the @ for a plain handle', () => {
    // Dropping it here would leave a bare word with no indication it is a login.
    expect(displayUsername('cashier01')).toBe('@cashier01');
  });

  it('does not touch a handle that legitimately starts with a letter only', () => {
    expect(displayUsername('abebe.t')).toBe('@abebe.t');
  });

  it('trims surrounding whitespace', () => {
    expect(displayUsername('  yene@gmail.com  ')).toBe('yene@gmail.com');
  });

  it('falls back when there is no username', () => {
    expect(displayUsername(null)).toBe('');
    expect(displayUsername(undefined)).toBe('');
    expect(displayUsername('   ')).toBe('');
    expect(displayUsername(null, 'admin')).toBe('admin');
    expect(displayUsername('', 'Unknown')).toBe('Unknown');
  });
});
