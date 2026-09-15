/**
 * Desktop YjsManager — one Y.Doc per business, persisted to disk, bootstrapped
 * from SQLite, and kept in two-way sync with the local database.
 *
 * SQLite stays the application database (UI reads never go through Yjs).
 * Yjs is the replication layer: outbound row changes become Yjs records, and
 * incoming Yjs records are applied back into SQLite. Transactional collections
 * (sales, stock movements, payments...) are append-only, so merging offline
 * edits is a union rather than an overwrite.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as Y from 'yjs';
import { randomUUID } from 'crypto';
import db from '../database';
import {
  YJS_COLLECTIONS,
  COLLECTION_TABLE,
  APPEND_ONLY,
  isYjsCollection,
  createBusinessDoc,
  encodeFullState,
  type YjsCollection,
  type YjsRecord,
} from '@shega/shared';

const DOC_DIR = path.join(process.cwd(), 'shega-yjs-docs');
const FLUSH_DEBOUNCE_MS = 800;

// SQLite column sets are discovered lazily and cached per table.
const columnCache = new Map<string, string[]>();

function tableColumns(table: string): string[] {
  let cols = columnCache.get(table);
  if (!cols) {
    cols = (db.prepare(`PRAGMA table_info(${table})`).all() as any[]).map((c) => c.name);
    columnCache.set(table, cols);
  }
  return cols;
}

function rowToData(table: string, row: Record<string, any>): Record<string, unknown> {
  const cols = tableColumns(table);
  const out: Record<string, unknown> = {};
  for (const c of cols) {
    if (c === 'id' || c === 'row_version' || c === 'is_synced') continue;
    const v = row[c];
    if (v === undefined) continue;
    out[c] = v === null ? null : typeof v === 'object' ? JSON.stringify(v) : v;
  }
  return out;
}

class DesktopYjsManager {
  private docs = new Map<string, { doc: Y.Doc; maps: Record<YjsCollection, Y.Map<YjsRecord>>; flushTimer: NodeJS.Timeout | null }>();
  private deviceId = 'desktop-unknown';
  private userId: string | null = null;
  private listeners = new Set<(businessId: string, update: Uint8Array, origin: 'local' | 'remote') => void>();
  private pendingByBusiness = new Map<string, number>();

  setDeviceId(id: string): void { this.deviceId = id || this.deviceId; }
  setUserId(id: string | null): void { this.userId = id; }
  getDeviceId(): string { return this.deviceId; }

  /** Subscribe to encoded updates originating from THIS device (to send to peers). */
  onUpdate(fn: (businessId: string, update: Uint8Array, origin: 'local' | 'remote') => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private ensureDoc(businessId: string) {
    let entry = this.docs.get(businessId);
    if (entry) return entry;
    const { doc, maps } = createBusinessDoc(businessId);

    // Load persisted state if we have one from a previous session.
    if (!fs.existsSync(DOC_DIR)) fs.mkdirSync(DOC_DIR, { recursive: true });
    const file = path.join(DOC_DIR, `${businessId}.ydoc`);
    try {
      if (fs.existsSync(file)) Y.applyUpdate(doc, new Uint8Array(fs.readFileSync(file)));
    } catch { /* corrupted file — start fresh; SQLite re-bootstrap heals */ }

    // Re-emit updates from this doc so the transport can fan them out.
    doc.on('update', (update: Uint8Array, origin: unknown) => {
      const dir = origin === 'remote' ? 'remote' : 'local';
      this.pendingByBusiness.set(businessId, (this.pendingByBusiness.get(businessId) ?? 0) + 1);
      for (const fn of this.listeners) fn(businessId, update, dir);
      this.scheduleFlush(businessId);
    });

    entry = { doc, maps, flushTimer: null };
    this.docs.set(businessId, entry);
    return entry;
  }

  private scheduleFlush(businessId: string) {
    const entry = this.docs.get(businessId);
    if (!entry) return;
    if (entry.flushTimer) return;
    entry.flushTimer = setTimeout(() => {
      entry.flushTimer = null;
      this.flush(businessId);
    }, FLUSH_DEBOUNCE_MS);
  }

  private flush(businessId: string) {
    const entry = this.docs.get(businessId);
    if (!entry) return;
    try {
      if (!fs.existsSync(DOC_DIR)) fs.mkdirSync(DOC_DIR, { recursive: true });
      fs.writeFileSync(path.join(DOC_DIR, `${businessId}.ydoc`), encodeFullState(entry.doc));
      this.pendingByBusiness.set(businessId, 0);
    } catch (e) {
      console.warn('[yjs] doc flush failed', e);
    }
  }

  /** Bootstrap: pull all rows for this business into the doc (idempotent). */
  bootstrapBusiness(businessId: number, businessUuid: string): void {
    const entry = this.ensureDoc(businessUuid);
    for (const collection of YJS_COLLECTIONS) {
      const table = COLLECTION_TABLE[collection];
      let rows: any[] = [];
      try {
        const hasBiz = tableColumns(table).includes('businessId');
        rows = hasBiz
          ? db.prepare(`SELECT * FROM ${table} WHERE businessId = ? AND is_deleted = 0 LIMIT 5000`).all(businessId) as any[]
          : db.prepare(`SELECT * FROM ${table} WHERE is_deleted = 0 LIMIT 5000`).all() as any[];
      } catch { continue; }
      const map = entry.maps[collection];
      for (const row of rows) {
        const uuid = String(row.uuid ?? row.id);
        if (!uuid || map.has(uuid)) continue;
        map.set(uuid, {
          uuid,
          businessId: businessUuid,
          deviceId: this.deviceId,
          createdAt: Date.parse(row.createdAt ?? row.created_at ?? '') || Date.now(),
          rev: Number(row.row_version ?? 1),
          deleted: false,
          data: rowToData(table, row),
        });
      }
    }
    this.flush(businessUuid);
  }

  /** Push a local SQLite row change into the doc (called by the sync outbox watcher). */
  recordLocalChange(businessUuid: string, collection: YjsCollection, uuid: string, payload: Record<string, any>, deleted = false): void {
    if (!isYjsCollection(collection)) return;
    const entry = this.ensureDoc(businessUuid);
    entry.maps[collection].set(uuid, {
      uuid,
      businessId: businessUuid,
      deviceId: this.deviceId,
      userId: this.userId ?? undefined,
      createdAt: Date.now(),
      rev: (entry.maps[collection].get(uuid)?.rev ?? 0) + 1,
      deleted,
      data: payload,
    });
  }

  /** Apply a remote update coming from a peer; returns the change for SQLite apply. */
  acceptRemoteUpdate(businessId: string, update: Uint8Array): void {
    const entry = this.ensureDoc(businessId);
    Y.applyUpdate(entry.doc, update, 'remote');
  }

  getFullState(businessId: string): Uint8Array | null {
    const entry = this.docs.get(businessId);
    return entry ? encodeFullState(entry.doc) : null;
  }

  /** Diffs records added/changed remotely since `sinceState`, for SQLite apply. */
  collectRemoteChanges(businessId: string, sinceState: Uint8Array): Array<{ collection: YjsCollection; record: YjsRecord }> {
    const entry = this.docs.get(businessId);
    if (!entry) return [];
    const out: Array<{ collection: YjsCollection; record: YjsRecord }> = [];
    const seen = new Y.Doc();
    Y.applyUpdate(seen, sinceState);
    const seenMaps = {} as Record<YjsCollection, Y.Map<YjsRecord>>;
    for (const c of YJS_COLLECTIONS) seenMaps[c] = seen.getMap<YjsRecord>(c);
    for (const c of YJS_COLLECTIONS) {
      for (const [uuid, rec] of entry.maps[c].entries()) {
        const prev = seenMaps[c].get(uuid);
        if (!prev || prev.rev !== rec.rev || prev.deleted !== rec.deleted) {
          out.push({ collection: c, record: rec });
        }
      }
    }
    return out;
  }

  pendingCount(businessId?: string): number {
    if (businessId) return this.pendingByBusiness.get(businessId) ?? 0;
    let total = 0;
    for (const v of this.pendingByBusiness.values()) total += v;
    return total;
  }

  closeBusiness(businessId: string): void {
    const entry = this.docs.get(businessId);
    if (!entry) return;
    if (entry.flushTimer) clearTimeout(entry.flushTimer);
    this.flush(businessId);
    entry.doc.destroy();
    this.docs.delete(businessId);
  }
}

export const yjsManager = new DesktopYjsManager();
export { randomUUID };
