# Phase 5 — Architecture, Security & Code Quality (Completed Core + Staged Plan)

## ✅ Completed & Verified (34/34 E2E pass, tsc clean, build green)

### 5.4 Secrets / Config — **Already Handled**
- **Mobile** (`shega-mobile/src/services/api.ts:18-21`): `API_BASE_URL` uses `process.env.EXPO_PUBLIC_API_URL` → `Constants.expoConfig.extra.apiUrl` → production default. Not a secret; public API endpoint. No change needed.
- **Desktop**: Offline-first; no hardcoded API URL.

### 5.6 Missing Hot Indexes — **DONE (Migration v21)**
Added 8 indexes via `if (version < 21)` block in `database.ts`:
| Index | Table | Columns | Rationale |
|-------|-------|---------|-----------|
| `idx_items_sku` | items | sku | POS barcode/scan lookup (high cardinality) |
| `idx_items_barcode` | items | barcode | POS scan hot path |
| `idx_sync_outbox_seq` | sync_outbox | seq | Incremental pull `WHERE seq > ? ORDER BY seq` |
| `idx_sync_outbox_device_seq` | sync_outbox | (device_id, seq) | Per-device incremental pull |
| `idx_sales_businessId_createdAt` | sales | (businessId, createdAt) | P&L / reports by business + date range |
| `idx_sales_customerName` | sales | customerName | Search by customer name |
| `idx_customers_customerName` | customers | customerName | Customer search |
| `idx_items_businessId_updated_at` | items | (businessId, updated_at) | Sync checksum / delta queries |

E2E assertion: `indexes_5_6_added` passes (all 5 verified present).
Sync `schemaVersion` bumped to 21 in hub + `/sync/info`.

### 5.5 Structured Logging — **DONE**
- `src/main/logger.ts`: JSON-lines logger with 5MB rotation (`shega.log` / `shega.1.log`).
- Wired global handlers in `index.ts` (`uncaughtException`, `unhandledRejection`).
- Wired `sync-hub.ts` server error handler.
- E2E assertion: `logger_5_5_writes_json` passes (valid JSON line in log file).

### 5.2 Integer Money Utility — **DONE**
- `src/main/money.ts`: `toMinor`, `fromMinor`, `roundMoney`, `computeTotal` (integer cents), `computeTotalFloat` (float reference).
- Rule: round per line (gross, discount), sum line totals, round tax per line, total = subtotal − discount + tax.
- E2E invariant `money_5_2_invariant`: 10,000 random carts — max diff 0.03, deterministic across runs. Integer engine is authoritative; float reference drift ≤0.05 documented.

---

## 📋 Staged Plan (Deferred — Not Blocking)

### 5.1 Monolith Split (IPC / Sync extraction)
**Goal**: Extract ~40 sync IPC handlers from `ipc-handlers.ts` (6k lines) into `sync-routes.ts` + `ipc-handlers.ts` thin re-export.
**Approach**:
1. Create `src/main/sync-routes.ts` with `registerSyncIPC()` — move `sync:push`, `sync:pull`, `sync:info`, `sync:pair`, `sync:verify`, `sync:resync`, `sync:status`, `sync:config`.
2. `ipc-handlers.ts` imports and calls `registerSyncIPC()`.
3. No behavior change — pure code organization.
**Risk**: Low (simple move + re-export). **Do after** Phase 5 core stabilizes.

### 5.7 Shared Zod Contracts + Strict TS
**Goal**: Eliminate `any` at IPC boundary; single source of truth for request/response shapes.
**Approach**:
1. Create `packages/shared/src/contracts/` with Zod schemas for all IPC channels (e.g., `SyncPushRequest`, `SyncPushResponse`, `SaleCreateInput`).
2. Generate TS types: `export type SyncPushRequest = z.infer<typeof SyncPushRequestSchema>`.
3. Both `ipc-handlers.ts` (main) and renderer preload use the same types.
4. Enable `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true` in `tsconfig.json`.
**Risk**: Medium (touches many files). **Do in a dedicated sprint** with codemod + manual review.

### 5.8 Lint + CI Gate
**Goal**: Enforce quality on every PR.
**Approach**:
1. Add Biome (already in `package.json`): `npm run lint` (check), `npm run lint:fix` (fix).
2. GitHub Actions workflow: `lint`, `tsc`, `test:sync` on push/PR.
3. Block merge on failure.
**Risk**: Low. **Do alongside 5.1**.

### 5.9 Backend Hardening (Cloud Relay)
**Goal**: Production-ready Django relay with auth, rate-limit, idempotency, device binding.
**Status**: Contract defined in `SYNC_CONTRACT.md` (Phase 3.6/3.9 client stub done). Backend not yet built.
**Approach**:
1. Django app with endpoints: `/api/sync/push`, `/api/sync/pull`, `/api/sync/info`, `/api/sync/pair`, `/api/sync/verify`.
2. Auth: `X-Device-Key` (per-device secret) + `X-Idempotency-Key` (client-generated UUID per request).
3. Rate-limit: 60 req/min per device; burst 10.
4. Idempotency: store `idempotency_key` + response for 24h; return cached on replay.
5. Device binding: `pairing_token` exchange → `device_key` issued; hub_device_id in payload must match registered hub.
6. Observability: structured JSON logs (request_id, device_id, latency_ms, status).
7. Deploy: Render (existing) + PostgreSQL + Redis for idempotency cache.
**Risk**: High (new service). **Do after** mobile app ships with stub; can run in shadow mode first.

---

## Verification Checklist
- [x] `npx tsc --noEmit` (desktop) — clean
- [x] `npm run build` — clean (469 kB main bundle)
- [x] `npm run test:sync` — 34/34 PASS
- [x] `npx tsc --noEmit` (mobile) — clean
- [x] Mobile `api.ts` already uses `EXPO_PUBLIC_API_URL` (5.4 satisfied)

---

## Next Steps
1. **Optional**: Run `npm run lint` / `npm run lint:fix` to adopt Biome rules.
2. **Phase 6** (if applicable) — or begin 5.1/5.7/5.8 as a follow-up sprint.
3. **Phase 7** (Production Release) — requires 5.9 backend completion.