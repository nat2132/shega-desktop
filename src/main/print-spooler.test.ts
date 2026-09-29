import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { PrintSpooler, type SpoolerDb, type SpoolerDeps } from './print-spooler';

/**
 * Print spooler behaviour tests.
 *
 * The bugs these guard against are the ones that lose a customer's receipt:
 * a job vanishing when the printer is asleep, a job printing twice after a
 * retry or restart, and receipts coming out in the wrong order.
 *
 * Runs against real SQLite via `node:sqlite` (better-sqlite3 is built for
 * Electron's ABI and cannot load in plain Node), with the printer and settings
 * injected — so "printer offline" is an exact, reproducible condition rather
 * than a timing accident.
 */

function makeDb(): DatabaseSync {
  return new DatabaseSync(':memory:');
}

/** Adapt node:sqlite to the better-sqlite3-shaped surface the spooler uses. */
function adapt(db: DatabaseSync): SpoolerDb {
  return {
    exec: (sql: string) => db.exec(sql),
    prepare: (sql: string) => ({
      run: (...params: unknown[]) => {
        const r = db.prepare(sql).run(...(params as never[]));
        return { lastInsertRowid: Number(r.lastInsertRowid), changes: Number(r.changes) };
      },
      get: (...params: unknown[]) => db.prepare(sql).get(...(params as never[])),
      all: (...params: unknown[]) => db.prepare(sql).all(...(params as never[])),
    }),
  };
}

interface Harness {
  spooler: PrintSpooler;
  db: DatabaseSync;
  /** Every byte payload the "printer" accepted, in order. */
  printed: string[];
  /** When false, printing throws as if the printer were offline. */
  setOnline(v: boolean): void;
}

function harness(opts: { online?: boolean } = {}): Harness {
  const db = makeDb();
  const printed: string[] = [];
  let online = opts.online ?? true;

  const deps: SpoolerDeps = {
    db: adapt(db),
    print: async (bytes) => {
      if (!online) throw new Error('printer unreachable');
      printed.push(Buffer.from(bytes).toString('utf8'));
    },
    isEnabled: () => true,
  };

  const spooler = new PrintSpooler(deps, { retryDelayMs: 5 });
  return { spooler, db, printed, setOnline: (v) => { online = v; } };
}

const bytesFor = (tag: string) => new TextEncoder().encode(tag);

describe('PrintSpooler', () => {
  it('persists a job before printing and marks it done only after success', async () => {
    const h = harness();
    const job = h.spooler.enqueue({ kind: 'receipt', bytes: bytesFor('A'), dedupeKey: 'sale:1' });
    await h.spooler.drain();

    expect(h.printed).toEqual(['A']);
    const stored = h.spooler.getById(job.id)!;
    expect(stored.status).toBe('done');
    expect(stored.completedAt).not.toBeNull();
  });

  it('keeps the job queued (and does not print) when the printer is offline', async () => {
    const h = harness({ online: false });
    const job = h.spooler.enqueue({ kind: 'receipt', bytes: bytesFor('A'), dedupeKey: 'sale:1' });
    await h.spooler.drain();

    expect(h.printed).toEqual([]);
    const stored = h.spooler.getById(job.id)!;
    // Still pending, with the reason recorded — the receipt is NOT lost.
    expect(stored.status).toBe('pending');
    expect(stored.attempts).toBe(1);
    expect(stored.lastError).toMatch(/unreachable/i);
  });

  it('prints a queued job once the printer comes back', async () => {
    const h = harness({ online: false });
    h.spooler.enqueue({ kind: 'receipt', bytes: bytesFor('A'), dedupeKey: 'sale:1' });
    await h.spooler.drain();
    expect(h.printed).toEqual([]);

    h.setOnline(true);
    await h.spooler.drain();

    expect(h.printed).toEqual(['A']);
    expect(h.spooler.counts().pending).toBe(0);
  });

  it('never prints the same sale twice, even when re-enqueued', async () => {
    const h = harness();
    const first = h.spooler.enqueue({ kind: 'receipt', bytes: bytesFor('A'), dedupeKey: 'sale:7' });
    await h.spooler.drain();
    // A retry / double-click / re-render of the same sale.
    const second = h.spooler.enqueue({ kind: 'receipt', bytes: bytesFor('A'), dedupeKey: 'sale:7' });
    await h.spooler.drain();

    expect(second.id).toBe(first.id);
    expect(h.printed).toEqual(['A']); // exactly one print
  });

  it('does not re-print an already-printed job when the queue is drained again', async () => {
    const h = harness();
    h.spooler.enqueue({ kind: 'receipt', bytes: bytesFor('A'), dedupeKey: 'sale:7' });
    await h.spooler.drain();
    await h.spooler.drain();
    await h.spooler.drain();

    expect(h.printed).toEqual(['A']);
  });

  it('survives a restart: pending jobs in the DB are picked up by a new spooler', async () => {
    const h = harness({ online: false });
    h.spooler.enqueue({ kind: 'receipt', bytes: bytesFor('A'), dedupeKey: 'sale:1' });
    h.spooler.enqueue({ kind: 'receipt', bytes: bytesFor('B'), dedupeKey: 'sale:2' });
    await h.spooler.drain();
    expect(h.printed).toEqual([]);

    // Simulate app restart: brand new spooler instance over the SAME database.
    h.setOnline(true);
    const revived = new PrintSpooler(
      { db: adapt(h.db), print: async (b) => { h.printed.push(Buffer.from(b).toString('utf8')); }, isEnabled: () => true },
      { retryDelayMs: 5 },
    );
    await revived.drain();

    expect(h.printed).toEqual(['A', 'B']);
    expect(revived.counts().pending).toBe(0);
  });

  it('does not re-print completed jobs after a restart', async () => {
    const h = harness();
    h.spooler.enqueue({ kind: 'receipt', bytes: bytesFor('A'), dedupeKey: 'sale:1' });
    await h.spooler.drain();
    expect(h.printed).toEqual(['A']);

    const revived = new PrintSpooler(
      { db: adapt(h.db), print: async (b) => { h.printed.push(Buffer.from(b).toString('utf8')); }, isEnabled: () => true },
      { retryDelayMs: 5 },
    );
    await revived.drain();

    expect(h.printed).toEqual(['A']); // still just one
  });

  it('prints multiple queued receipts in order', async () => {
    const h = harness({ online: false });
    for (const tag of ['A', 'B', 'C']) {
      h.spooler.enqueue({ kind: 'receipt', bytes: bytesFor(tag), dedupeKey: `sale:${tag}` });
    }
    await h.spooler.drain();

    h.setOnline(true);
    await h.spooler.drain();

    expect(h.printed).toEqual(['A', 'B', 'C']);
  });

  it('stops at the first failure so later receipts keep their order', async () => {
    const h = harness();
    let failNext = true;
    const db = h.db;
    const spooler = new PrintSpooler(
      {
        db: adapt(db),
        print: async (b) => {
          if (failNext) { failNext = false; throw new Error('printer unreachable'); }
          h.printed.push(Buffer.from(b).toString('utf8'));
        },
        isEnabled: () => true,
      },
      { retryDelayMs: 5 },
    );

    spooler.enqueue({ kind: 'receipt', bytes: bytesFor('A'), dedupeKey: 'sale:A' });
    spooler.enqueue({ kind: 'receipt', bytes: bytesFor('B'), dedupeKey: 'sale:B' });
    await spooler.drain();
    // A failed, so B must NOT have printed yet.
    expect(h.printed).toEqual([]);

    await spooler.drain();
    expect(h.printed).toEqual(['A', 'B']);
  });

  it('retry(id) re-queues a failed job and reports success', async () => {
    const h = harness({ online: false });
    const job = h.spooler.enqueue({ kind: 'receipt', bytes: bytesFor('A'), dedupeKey: 'sale:1' });
    await h.spooler.drain();
    expect(h.printed).toEqual([]);

    h.setOnline(true);
    const ok = await h.spooler.retry(job.id);
    expect(ok).toBe(true);
    expect(h.printed).toEqual(['A']);
  });

  it('clearCompleted removes finished jobs but keeps ones still queued', async () => {
    const h = harness({ online: false });
    const done = h.spooler.enqueue({ kind: 'receipt', bytes: bytesFor('A'), dedupeKey: 'sale:1' });
    const queued = h.spooler.enqueue({ kind: 'receipt', bytes: bytesFor('B'), dedupeKey: 'sale:2' });

    // Printer comes back for the first job only: A prints, B stays pending
    // because the printer goes away again before the second attempt.
    let allow = true;
    const spooler = new PrintSpooler(
      {
        db: adapt(h.db),
        print: async (b) => {
          if (!allow) throw new Error('printer unreachable');
          h.printed.push(Buffer.from(b).toString('utf8'));
          allow = false;
        },
        isEnabled: () => true,
      },
      { retryDelayMs: 5 },
    );
    spooler.enqueue({ kind: 'receipt', bytes: bytesFor('A'), dedupeKey: 'sale:1' });
    spooler.enqueue({ kind: 'receipt', bytes: bytesFor('B'), dedupeKey: 'sale:2' });
    await spooler.drain();

    expect(h.printed).toEqual(['A']);
    expect(spooler.getById(queued.id)!.status).toBe('pending');

    const removed = spooler.clearCompleted();
    expect(removed).toBe(1);
    // The delivered receipt's record is gone; the undelivered one is preserved
    // so it can still be printed later.
    expect(spooler.getById(done.id)).toBeNull();
    expect(spooler.getById(queued.id)).not.toBeNull();
  });

  it('does nothing when printing is disabled in settings', async () => {
    const db = makeDb();
    const printed: string[] = [];
    const spooler = new PrintSpooler(
      {
        db: adapt(db),
        print: async (b) => { printed.push(Buffer.from(b).toString('utf8')); },
        isEnabled: () => false,
      },
      { retryDelayMs: 5 },
    );
    spooler.enqueue({ kind: 'receipt', bytes: bytesFor('A'), dedupeKey: 'sale:1' });
    await spooler.drain();

    expect(printed).toEqual([]);
    expect(spooler.counts().pending).toBe(1);
  });
});
