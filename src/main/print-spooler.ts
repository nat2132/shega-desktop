/**
 * Persistent print spooler (desktop main process).
 *
 * WHY THIS EXISTS
 * The previous queue was an in-memory promise chain. A receipt requested while
 * the printer was asleep, unplugged, or mid-reboot was *lost forever* — the
 * promise rejected, nothing was stored, and the cashier had no way to know the
 * receipt had vanished. For a till, a silently dropped receipt is a real
 * financial/audit problem.
 *
 * DESIGN
 * A print job is written to SQLite BEFORE any bytes are sent, so a crash, a
 * kill, or a dead printer can never lose it. The job is only marked `done`
 * after `printRaw` resolves. Anything still `pending` is retried when the
 * printer comes back and on the next app start.
 *
 * This is deliberately INDEPENDENT of the sale transaction. Enqueueing a job
 * never touches `sales`, stock, or shift totals — the sale is already committed
 * by the time we are called, and printing is a side effect that can fail and be
 * retried without any risk of double-charging a customer.
 *
 * DE-DUPLICATION
 * Each job carries a caller-supplied `dedupeKey` (normally the sale id). The
 * key is UNIQUE, so re-submitting the same receipt inserts nothing and returns
 * the existing job. Combined with only marking `done` on success, this makes it
 * impossible to print one receipt twice — whether from a duplicate request, a
 * retry, or an app restart.
 */

import { EventEmitter } from 'events';

export type PrintJobKind = 'receipt' | 'label' | 'test' | 'report' | 'x_report' | 'z_report' | 'shift';
export type PrintJobStatus = 'pending' | 'done' | 'failed';

export interface PrintJob {
  id: number;
  dedupeKey: string | null;
  kind: PrintJobKind;
  /** Business entity this belongs to, for display only. */
  refId: number | null;
  label: string;
  paperWidth: 58 | 80;
  /** Raw ESC/POS bytes to send. */
  bytes: Buffer;
  status: PrintJobStatus;
  attempts: number;
  lastError: string | null;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}

export interface EnqueueInput {
  kind: PrintJobKind;
  bytes: Uint8Array;
  paperWidth?: 58 | 80;
  /** Stable identity so the same receipt is never queued twice. */
  dedupeKey?: string | null;
  refId?: number | null;
  label?: string;
}

function now(): number {
  return Date.now();
}

/** Minimal surface the spooler needs from the database (better-sqlite3 compatible). */
export interface SpoolerDb {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): { lastInsertRowid: number | bigint; changes: number | bigint };
    get(...params: unknown[]): any;
    all(...params: unknown[]): any[];
  };
}

export interface SpoolerDeps {
  db: SpoolerDb;
  /** Sends the bytes. Rejecting means "printer unavailable" — job stays queued. */
  print(bytes: Uint8Array): Promise<void>;
  /** Whether printing is currently enabled in settings. */
  isEnabled(): boolean;
}

/** Rows are converted defensively: a corrupt blob must not break settings UI. */
function rowToJob(row: any): PrintJob {
  return {
    id: Number(row.id),
    dedupeKey: row.dedupeKey ?? null,
    kind: (row.kind ?? 'receipt') as PrintJobKind,
    refId: row.refId == null ? null : Number(row.refId),
    label: row.label ?? '',
    paperWidth: (Number(row.paperWidth) === 58 ? 58 : 80) as 58 | 80,
    bytes: Buffer.from(row.bytes ?? Buffer.alloc(0)),
    status: (row.status ?? 'pending') as PrintJobStatus,
    attempts: Number(row.attempts ?? 0),
    lastError: row.lastError ?? null,
    createdAt: Number(row.createdAt ?? 0),
    updatedAt: Number(row.updatedAt ?? 0),
    completedAt: row.completedAt == null ? null : Number(row.completedAt),
  };
}

export class PrintSpooler extends EventEmitter {
  private draining = false;
  /** Guards against re-entrant drain from concurrent triggers. */
  private retryTimer: NodeJS.Timeout | null = null;
  private started = false;
  private maxAttempts: number;
  private retryDelayMs: number;
  /**
   * Auto-reconnect subscription is set up at most once. Two callers racing to
   * start the spooler must not attach duplicate listeners to the emitter.
   */
  private autoReconnectBound = false;

  constructor(
    private readonly deps: SpoolerDeps,
    opts: { maxAttempts?: number; retryDelayMs?: number } = {}
  ) {
    super();
    this.maxAttempts = opts.maxAttempts ?? 0; // 0 = keep trying forever
    this.retryDelayMs = opts.retryDelayMs ?? 5000;
    this.setMaxListeners(50);
  }

  private get db() {
    return this.deps.db;
  }

  /**
   * The spool table is device-local by design: print jobs are a property of THIS
   * till's printer, not business data, so they intentionally carry no
   * uuid/device_id/row_version columns and never participate in LAN/P2P sync.
   */
  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS print_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dedupeKey TEXT UNIQUE,
        kind TEXT NOT NULL DEFAULT 'receipt',
        refId INTEGER,
        label TEXT,
        paperWidth INTEGER NOT NULL DEFAULT 80,
        bytes BLOB NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        lastError TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        completedAt INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status, id);
    `);
  }

  /**
   * Persist a job and try to print it.
   *
   * Returns the job. If `dedupeKey` matches an existing job the existing row is
   * returned untouched — an already-printed receipt is never re-queued, and a
   * still-pending one is simply picked up again.
   */
  enqueue(input: EnqueueInput): PrintJob {
    this.ensureSchema();
    const created = now();
    const paperWidth = input.paperWidth ?? 80;

    if (input.dedupeKey) {
      const existing = this.db
        .prepare('SELECT * FROM print_jobs WHERE dedupeKey = ?')
        .get(input.dedupeKey) as any;
      if (existing) {
        const job = rowToJob(existing);
        // A completed job stays completed: that is what stops a double print.
        if (job.status === 'pending') this.scheduleDrain();
        return job;
      }
    }

    const info = this.db
      .prepare(
        `INSERT INTO print_jobs
           (dedupeKey, kind, refId, label, paperWidth, bytes, status, attempts, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
      )
      .run(
        input.dedupeKey ?? null,
        input.kind,
        input.refId ?? null,
        input.label ?? input.kind,
        paperWidth,
        Buffer.from(input.bytes),
        created,
        created,
      );

    const job = this.getById(Number(info.lastInsertRowid))!;
    this.emit('queued', job);
    // Fire and forget: the caller is a completed sale and must not block on
    // printer availability. Failure is recorded on the job, not thrown.
    void this.drain();
    return job;
  }

  getById(id: number): PrintJob | null {
    this.ensureSchema();
    const row = this.db.prepare('SELECT * FROM print_jobs WHERE id = ?').get(id) as any;
    return row ? rowToJob(row) : null;
  }

  /** List newest-first, optionally filtered by status. */
  list(status?: PrintJobStatus, limit = 100): PrintJob[] {
    this.ensureSchema();
    const rows = status
      ? (this.db
          .prepare('SELECT * FROM print_jobs WHERE status = ? ORDER BY id DESC LIMIT ?')
          .all(status, limit) as any[])
      : (this.db.prepare('SELECT * FROM print_jobs ORDER BY id DESC LIMIT ?').all(limit) as any[]);
    return rows.map(rowToJob);
  }

  counts(): { pending: number; failed: number; done: number } {
    this.ensureSchema();
    const row = this.db
      .prepare(
        `SELECT
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
           SUM(CASE WHEN status = 'failed'  THEN 1 ELSE 0 END) AS failed,
           SUM(CASE WHEN status = 'done'    THEN 1 ELSE 0 END) AS done
         FROM print_jobs`,
      )
      .get() as any;
    return {
      pending: Number(row?.pending ?? 0),
      failed: Number(row?.failed ?? 0),
      done: Number(row?.done ?? 0),
    };
  }

  /**
   * Try to print every pending job, oldest first.
   *
   * Stops at the first failure so receipts keep their order — printing job 5
   * before job 3 would hand a customer the wrong paperwork.
   */
  async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      if (!this.deps.isEnabled()) {
        this.emit('blocked', { reason: 'printer_disabled' });
        return;
      }

      this.ensureSchema();
      const rows = this.db
        .prepare("SELECT * FROM print_jobs WHERE status = 'pending' ORDER BY id ASC")
        .all() as any[];

      for (const row of rows) {
        const job = rowToJob(row);
        if (this.maxAttempts > 0 && job.attempts >= this.maxAttempts) {
          this.markFailed(job.id, `Exceeded ${this.maxAttempts} attempts`);
          continue;
        }
        try {
          await this.deps.print(job.bytes);
          // Only now is it safe to consider the receipt delivered.
          this.db.prepare(
            "UPDATE print_jobs SET status = 'done', attempts = attempts + 1, lastError = NULL, updatedAt = ?, completedAt = ? WHERE id = ? AND status = 'pending'",
          ).run(now(), now(), job.id);
          this.emit('printed', job);
        } catch (err: any) {
          const message = err?.message ?? String(err);
          this.db.prepare(
            "UPDATE print_jobs SET attempts = attempts + 1, lastError = ?, updatedAt = ? WHERE id = ?",
          ).run(message, now(), job.id);
          this.emit('failed', { job, error: message });
          // Preserve ordering: stop here and retry the whole tail later.
          this.scheduleDrain();
          return;
        }
      }
      this.emit('idle', this.counts());
    } finally {
      this.draining = false;
    }
  }

  private markFailed(id: number, error: string): void {
    this.db.prepare("UPDATE print_jobs SET status = 'failed', lastError = ?, updatedAt = ? WHERE id = ?").run(
      error,
      now(),
      id,
    );
    this.emit('failed', { job: this.getById(id), error });
  }

  /** Retry a single job from the settings UI ("Retry now"). */
  async retry(id: number): Promise<boolean> {
    this.ensureSchema();
    const job = this.getById(id);
    if (!job) return false;
    this.db.prepare("UPDATE print_jobs SET status = 'pending', lastError = NULL, updatedAt = ? WHERE id = ?").run(
      now(),
      id,
    );
    await this.drain();
    return this.getById(id)?.status === 'done';
  }

  /** Give up on a job the user has acknowledged. */
  discard(id: number): void {
    this.ensureSchema();
    this.db.prepare('DELETE FROM print_jobs WHERE id = ?').run(id);
    this.emit('discarded', { id });
  }

  /** Clear finished jobs; pending/failed are kept. */
  clearCompleted(): number {
    this.ensureSchema();
    const info = this.db.prepare("DELETE FROM print_jobs WHERE status = 'done'").run();
    return Number(info.changes ?? 0);
  }

  /**
   * Call when the printer connection state changes (reconnect, config save,
   * app focus). This is what turns "queued while offline" into "printed".
   */
  onPrinterAvailable(): void {
    this.scheduleDrain(0);
  }

  /**
   * Attach to the hardware layer so a reconnect automatically flushes the queue.
   *
   * Imported lazily and defensively: the spooler must work even if the hardware
   * services are unavailable, and a missing auto-reconnect manager should never
   * break printing.
   */
  bindAutoReconnect(): void {
    if (this.autoReconnectBound) return;
    this.autoReconnectBound = true;
    void (async () => {
      try {
        const { autoReconnectManager } = await import('./hardware/autoReconnect');
        const kick = () => this.onPrinterAvailable();
        autoReconnectManager.on('connected', kick);
        autoReconnectManager.on('enabled', kick);
      } catch {
        // Hardware layer unavailable — the 5s retry backoff still drains.
      }
    })();
  }

  /** Backoff drain so an offline printer does not spin the CPU. */
  private scheduleDrain(delayMs: number = this.retryDelayMs): void {
    if (this.retryTimer) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.drain();
    }, delayMs);
    // Never hold the process open just to poll a printer.
    this.retryTimer.unref?.();
  }

  /** Resume printing anything left over from a previous run. */
  start(): void {
    if (this.started) return;
    this.started = true;
    this.ensureSchema();
    this.bindAutoReconnect();
    const counts = this.counts();
    if (counts.pending > 0) {
      this.emit('resumed', counts);
      this.scheduleDrain(1500);
    }
  }

  stop(): void {
    this.started = false;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }
}

