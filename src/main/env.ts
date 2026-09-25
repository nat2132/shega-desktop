/**
 * Minimal `.env` loader for the Electron main process.
 *
 * The app ships no dotenv and electron-vite does not inline main-process env
 * files, so a `.env` beside the project (or in the working directory) is read
 * here — before any other module asks for configuration. Real environment
 * variables always win, so CI/deployment settings are never overridden.
 *
 * This is how `SHEGA_BACKEND_URL` (the Shega backend the desktop signs into for
 * accounts, onboarding, subscriptions and payments) is configured per
 * environment instead of being baked into the source.
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function parse(contents: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const equals = line.indexOf('=');
    if (equals <= 0) continue;
    const key = line.slice(0, equals).trim();
    let value = line.slice(equals + 1).trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted && value.length >= 2) value = value.slice(1, -1);
    if (key) out[key] = value;
  }
  return out;
}

export function loadDotEnv(dirs: string[]): void {
  for (const dir of dirs) {
    const file = join(dir, '.env');
    if (!existsSync(file)) continue;
    try {
      const values = parse(readFileSync(file, 'utf8'));
      for (const [key, value] of Object.entries(values)) {
        if (process.env[key] === undefined) process.env[key] = value;
      }
    } catch {
      // A malformed .env must never stop the app from starting.
    }
  }
}

// Project root when running from source or from `out/main`, and the current
// working directory as a fallback for packaged runs.
loadDotEnv([join(__dirname, '..', '..'), process.cwd()]);
