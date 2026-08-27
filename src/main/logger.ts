/* 5.5 Structured logging — JSON lines to a rotating file under <dbDir>/logs.
 * Replaces ad-hoc console.error/console.log in the main process so that
 * field issues are diagnosable (Phase 5.5). Logs are best-effort and never
 * block the event loop on the hot path. */
import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from 'fs';
import { join } from 'path';
import { app } from 'electron';

const isDev = !app.isPackaged;
const logDir = isDev
  ? join(process.cwd(), 'logs')
  : join(app.getPath('userData'), 'logs');
if (!existsSync(logDir)) {
  try { mkdirSync(logDir, { recursive: true }); } catch {}
}

const LOG_PATH = join(logDir, 'shega.log');
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB then rotate

type Level = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

function rotateIfNeeded(): void {
  try {
    if (existsSync(LOG_PATH) && statSync(LOG_PATH).size > MAX_BYTES) {
      const old = LOG_PATH.replace(/\.log$/, '.1.log');
      try { renameSync(LOG_PATH, old); } catch {}
    }
  } catch {}
}

function write(level: Level, msg: string, meta?: unknown): void {
  rotateIfNeeded();
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta ? { meta } : {}),
  }) + '\n';
  try {
    appendFileSync(LOG_PATH, line, { mode: 0o600 });
  } catch {
    // Last-resort: surface to stderr so it isn't silently lost.
    process.stderr.write(`[logger] write failed: ${String(msg)}\n`);
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => write('debug', msg, meta),
  info: (msg: string, meta?: unknown) => write('info', msg, meta),
  warn: (msg: string, meta?: unknown) => write('warn', msg, meta),
  error: (msg: string, meta?: unknown) => write('error', msg, meta),
  fatal: (msg: string, meta?: unknown) => write('fatal', msg, meta),
  get path() { return LOG_PATH; },
};

export default logger;
