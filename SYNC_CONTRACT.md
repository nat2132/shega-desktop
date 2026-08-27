# Shega POS — Phase 3 Sync Protocol & Cloud-Relay Contract

This document specifies the **cloud relay** (`/api/sync/*` REST on the Django backend)
and the **branch-to-branch** replication flow that the Desktop hub and Mobile client
are already written against (see `src/main/sync-hub.ts`, `src/main/sync-cloud.ts`,
`shega-mobile/src/services/syncService.ts`). The local LAN sync (3.1–3.5, 3.7, 3.8,
3.10) is implemented and verified end-to-end by `e2e-sync-run.js` (31 checks).
**Only the Django backend** described here remains to be deployed.

## 1. Roles

| Actor | Device id | Talks to | Purpose |
|---|---|---|---|
| Phone (Mobile) | random UUID v4 (persisted in `sync_meta`) | Desktop hub | LAN sync: push outbox → pull changes since cursor |
| Desktop hub | `sync_meta.device_id` (UUID v4, stable) | Phones (LAN) + Cloud relay | Authoritative LAN master; relay for multi-branch |
| Cloud relay (Django) | per-hub `device_key` (shared secret) | Hubs (Internet) | Aggregates branches; enforces tenant isolation |

## 2. Shared message format

Every change pushed to the hub or cloud is:

```ts
{
  entity: "categories" | "items" | "item_packs" | "sales" | "debt_payments" |
          "returns" | "expenses" | "adjustments" | "customers",
  entity_uuid: string,            // canonical PK (UUID v4), NOT the integer id
  op: "INSERT" | "UPDATE" | "DELETE",
  payload: Record<string, any>,    // full row; FK local ids are device-local, remapped by hub
  device_id?: string,
  checksum?: string               // SHA-256 of `${entity}|${entity_uuid}|${op}|${JSON.stringify(payload)}`
}
```

**Canonical checksum** (integrity, 3.7) — must be recomputed and rejected on mismatch:

```ts
canonical = `${entity}|${entity_uuid}|${op}|${JSON.stringify(payload)}`;
checksum = sha256(canonical);
```

## 3. Desktop hub HTTP API (LAN, port 5757)

Already implemented in `src/main/sync-hub.ts` (`SyncHub` class). mDNS/bonjour
advertising is OPTIONAL; discovery also works via Settings → pair QR (hub shows
its `lanUrl` + pairing token in a QR, scanned by the phone).

- `GET /sync/info` → `{ ok, hub, schemaVersion, port, tables, lastSeq, pairingRequired, lanUrl }`
- `POST /sync/pair` body `{ token, device_id, name }` → 403 on bad token; 200 `{ ok, hub }`. Token = 6-char CSPRNG from `settings('pairing_token')` (read via `getPairingToken()`).
- `GET /sync/pull?device=<id>&since=<seq>&token=<t>` → full snapshot when `since<=0` (or `force` resync), else outbox changes with `seq > since` (LIMIT 1000). Updates `sync_cursor`. Returns `{ ok, changes, lastSeq, snapshot, forceResync, hub }`.
- `POST /sync/push` body `{ device_id, token, changes[] }` → applies each via LWW + checksum check (3.5/3.7). Returns `{ ok, applied, conflicts, skipped, pending, serverSeq }`.
- `GET /sync/verify?token=<t>` → `{ ok, hub, tables: { <entity>: { count, checksum } }, lastSeq }` (3.7 drift snapshot).
- `GET /sync/peers?token=<t>` → registered `{ device_id, name, last_seen_at, created_at }`.

**Auth:** pairing token only (LAN trust). No tenant scoping needed on LAN (single-business desktop).

## 4. Cloud relay REST API (Django) — 3.6 & 3.9

Base URL configured via Desktop setting `cloud_sync_url`. Auth: `X-Device-Key`
header = per-hub secret (`cloud_sync_device_key`, stored in `settings`), provisioned
by the Django admin. Phones **never** call the cloud directly — the hub relays on
their behalf (this preserves licensing + conflict rules centrally).

### 4.1 `POST /api/sync/push`
- Headers: `X-Device-Key: <hub-secret>`, `X-Idempotency-Key: <hubId>@<max(outbox seq)>`
- Body: `{ device_id: <hub-uuid>, changes: [Change...] }` (full snapshot or batched outbox; the hub sends a full snapshot per successful push via `buildCloudChanges()`).
- Idempotency: re-POST with the same `X-Idempotency-Key` is a no-op (the backend dedupes by key).
- Business isolation: the backend derives `business_id` from the device key's tenant — **never client-supplied**. Every row writes are scoped server-side to that tenant.
- Response: `{ ok: true, accepted: <count>, last_remote_seq: <seq> }`.
- Server writes incoming changes into `cloud_inbox` (per-tenant) with `applied=0`; returns the hub's `last_remote_seq` so the hub can pull its incremental tail.

### 4.2 `GET /api/sync/pull?device=<hub-uuid>&since=<seq>`
- Headers: `X-Device-Key: <hub-secret>`.
- Returns changes from **other** branches (same tenant) with server-side `seq > since`, in FK-safe apply order: `categories, items, item_packs, customers, sales, debt_payments, expenses, adjustments, returns`.
- Each change includes the origin `device_id` (branch) and `row_version`.
- Response: `{ ok: true, changes: [Change...], lastSeq: <seq> }`.
- The hub applies via `applyRemoteChanges(hubId, changes)` — same LWW/checksum/negative-stock path as LAN sync.

### 4.3 `GET /api/sync/verify` (3.7 repair)
- Headers: `X-Device-Key`.
- Returns `{ ok, tables: { <entity>: { count, checksum } }, lastSeq }`; the hub compares against its local `verifyChecksums()` and, on mismatch, calls `GET /api/sync/pull` with `since=0` to force a full re-snapshot for that table (repair).

### 4.4 Branch-to-branch — 3.9
- Star topology: Hub A → cloud → Hub B. Catalog/price-list/personnel/warehouse changes are `businessId` + `entity_uuid` scoped and replicate to all hubs in the tenant. Sales remain branch-attributed (`sales.registerId`/branch tag; the schema keeps `businessId`, branch tagging via the originating `device_id`).
- Conflict rule across branches: same LWW (3.5). Hub B's `applyRemoteChanges` records a conflict exactly as it would for a phone.
- The hub's own `sync_outbox` IS the cloud inbox source; `cloud_sync_cursor` (in `settings`) tracks how far the hub has pulled from the cloud.

## 5. Client settings consumed by the hub (3.6 client half)
Stored in the Desktop `settings` table (`src/main/sync-cloud.ts`):
- `cloud_sync_url` — relay base URL (empty = offline/local-only; **no cloud traffic**).
- `cloud_sync_device_key` — per-hub shared secret.
- `cloud_sync_enabled` — `true` to activate opportunistic cloud sync.
- `cloud_sync_cursor` — last seen cloud `seq`.
- `cloud_sync_last_at`, `cloud_sync_last_error` — diagnostics surfaced via `cloud:status` IPC.

IPCs (`src/main/ipc-handlers.ts`): `cloud:status`, `cloud:sync` (one-shot push+pull),
`cloud:save-config`, `cloud:set-enabled`. Renderer hooks in
`src/preload/index.ts`: `cloudStatus`, `cloudSync`, `saveCloudConfig`, `cloudEnabled`.

## 6. Mobile client contract (3.4) — already implemented
`shega-mobile/src/services/syncService.ts` talks HTTP JSON to the hub on port 5757
(`/sync/push`, `/sync/pull`, `/sync/verify`, `/sync/pair`). It uses the pairing token
(`setHubToken`) and `getHubUrl()` (scanned from the hub's pair QR via
`QrPairScanner.tsx`). Auto-sync is wired in `SyncContext.tsx`
(60s periodic + foreground + post-sale debounced + backoff+jitter, 3.5/3.7 path).

## 7. Backend must-do (the only missing piece)
1. Provision one `device_key` per hub, bound to a `business_id` (tenant).
2. Implement 4.1–4.3 exactly as above (outbox/checksum/LWW are the hub's job; the
   backend only stores, dedupes, and routes).
3. Tenant-isolate every query by `business_id` (server-derived). Return `429` with
   `Retry-After` on flood (the mobile client already handles `RateLimitError`).
4. Seed `pairing_token` to hubs via the Django admin (the hub generates its own and
   exposes it; the backend must accept it or provision its own).
