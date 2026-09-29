/**
 * How a username should read on screen.
 *
 * An account username is normally an email address, and prefixing that with `@`
 * produced "@yene@gmail.com", which reads as a mistake. A username that is a
 * plain handle ("cashier01") is the opposite case: there the `@` is the
 * convention and dropping it makes the value look like a stray word.
 *
 * So the `@` is stripped only when the value is already an email address, and
 * kept for genuine handles.
 */
export function displayUsername(username: string | null | undefined, fallback = ''): string {
  const value = String(username ?? '').trim();
  if (!value) return fallback;
  // A second @ anywhere means this is an address, not a handle.
  if (value.includes('@')) return value.replace(/^@+/, '');
  return `@${value}`;
}
