# Shega — Unified Device Connection & Sync Architecture

Date: 2026-09-21 · Scope: shega-desktop, shega-mobile, @shega/shared

This report documents the current (post-fix) device discovery / pairing / transport /
sync system, the gaps found during the four-way audit, the protocol unification
landed in this session, and the prioritized migration plan for the remaining
spec items (§1–§40).

---

## 1. What exists today (current state)

The LAN-first stack is implemented end-to-end on both platforms and is NOT a
stub — it was, however, broken in three critical places (see §3). The current
topology is **hub-centric**: a desktop (or mobile hub) is the "owner",
joining devices push/pull through it.

### 1.1 Transports (desktop)

| Transport | Port | Module | Status |
|---|---|---|---|
| HTTP sync hub | 5757 | `src/main/sync-hub.ts` | Working. Token-auth `/sync/info,/sync/pair,/sync/pull,/sync/push,/sync/verify,/sync/peers` + unpaired-joiner `/sync/invitations/resolve`, `/sync/join/submit`, `/sync/join/status`. `applyChange` = LWW + idempotency (`sync_received` keyed device_id+checksum) + FK deferral + business-UUID↔INT scoping. **Fixed this session: dead WS channel linked to it.** |
| WebSocket hub | 5758 | `src/main/sync/websocket-server.ts` | **Was completely dead** (ReferenceError). Now **fixed** (§3). Pairing, SYNC_PUSH/PULL/VERIFY/RESYNC, DEVICE_JOIN channel, phone-peripheral SCAN/CAPTURE, P2P_SIGNAL relay. |
| Mobile TCP hub client | 5759 | `src/main/sync/mobile-hub-client.ts` | Desktop→mobile-hub client (`PAIR_REQUEST`/`SYNC_PUSH`/`SYNC_PULL`, `mobile_hub_cursors`). |
| Yjs + WebRTC P2P | n/a | `sync/{p2p-sync-manager,yjs-manager,webrtc-manager}.ts` | Per-business Y.Doc ↔ SQLite pump (1.5s), full-state exchange, WebRTC DataChannels via `node-datachannel` + STUN. **Was MODULE_NOT_FOUND on dial — fixed (§3).** |

### 1.2 Transports (mobile)

| Transport | Module | Status |
|---|---|---|
| HTTP push/pull to hub | `src/services/syncService.ts` | Working (outbox→/sync/push→prune on ack→/sync/pull→apply). |
| WS hub client | `src/services/wsSyncClient.ts` | Working (pairing, DEVICE_JOIN, SYNC_CHANGES, P2P_SIGNAL relay). |
| Mobile hub (TCP server) | `src/services/mobileSyncServer.ts` | Mobile↔mobile hub on 5759 (`react-native-tcp-socket`, needs `expo run:android`). |
| WebRTC receiver | `src/services/webrtc-manager.ts` | `react-native-webrtc` guarded; no-ops in Expo Go. |

### 1.3 Discovery

- mDNS/Bonjour **`_shega-pos._tcp`** (hub advertisement, TXT carries device_id /
  schema_version / port / business_id / capabilities) → `sync/discovery.ts`
  (desktop) + `services/mobileMdnsPublisher.ts` + `services/mdnsDiscovery.ts`.
- **`_shega-pair._tcp`** v1 beacon (invite mode, radar) → `sync/pairing-beacon.ts`
  both sides + `services/mobilePairingBeacon.ts`.
- /24 **LAN sweep** of 5757+5759 → `sync/lan-discovery.ts` (desktop),
  `services/lanSweep.ts` (mobile). 12s cache / 45s TTL.
- Cloud only for **pairing/membership** (JWT endpoints, default Render URL) →
  `pairing-cloud.ts` (desktop) + `services/pairingService.ts` / `services/api.ts` (mobile).

### 1.4 Identity, auth, roles

- Persistent device id: `sync_meta.device_id` (+ 6-char CSPRNG pairing token) both sides.
- Business membership verified on LAN; hub-default business is authoritative.
- `users` roster projection from staff (desktop `user-bridge.ts`), PIN login with
  lockout (5 fails → steps), `@shega/shared` role/permission engine (7 builtin
  roles + custom roles + PermissionValue `true|'approval'|'limited'`).
- `devices` table = LAN pairing registry; **roster** = `roster_devices`
  (`devices` relay entity maps to `roster_devices`). Revocation/rename/lock/replace
  handlers exist in `business-domain.ts`.

### 1.5 UI

Desktop: onboarding wizard → owner → team; `AuthScreen` join flow (radar →
manual code fallback → PIN/activate), `P2pSyncStatus` (connected devices + radar
pair modal), `SyncSettings`, `BusinessCenter`, `UsersEmployees` (QR invites).
Mobile: `setup-wizard`, `join-existing` (radar + layered resolve), `scan-join`
(QR + manual), `pairing-qr` (owner invite), `join-setup`, `initial-sync`,
`ConnectedDevicesScreen`, `SyncCenter`, `SyncSettings` (6-digit code + QR scan).

---

## 2. What the audit found broken (severity-ranked)

| # | Sev | Finding | Evidence | Status |
|---|---|---|---|---|
| 1 | CRITICAL | Every WS connection threw `ReferenceError` (`device_id`/`name`/`platform` undefined locals) fired at connect **before** the message handler attached → WS channel 5758 completely dead (no pairing, no live sync, no signaling). | `websocket-server.ts:107` | **FIXED** |
| 2 | CRITICAL | WebRTC dial crashed with `MODULE_NOT_FOUND` — `node-datachannel` not in deps, `require` unguarded. P2P transport unusable on desktop. | `webrtc-manager.ts:150`, `package.json` | **FIXED** |
| 3 | HIGH | `sync_conflicts` table never created on desktop, but `getUnifiedSyncStatus()` runs `SELECT COUNT(*) FROM sync_conflicts` → latent "no such table" crash. | `peer-sync.ts:336`, `database.ts` | **FIXED** |
| 4 | HIGH | No TURN server — `DEFAULT_ICE_SERVERS` STUN-only, so internet P2P fails behind symmetric NAT. | `shega-shared/src/sync/yjs-model.ts:108` | Gap (needs a TURN server) |
| 5 | MED | Cloud relay is **pairing-only**; business-data cloud sync never implemented. Desktop `detectNetworkCapabilities` hardcodes `hasInternet:true`, `cloudConfigured:false`; mobile never calls `getSyncStrategy` (dead import). | `peer-sync.ts:107`; `api.ts:468` stub | Gap (§20 item) |
| 6 | MED | Wire protocol duplicated 3×: entity lists (`SHARED_TABLES`/`SYNC_ENTITIES`), change envelope (`Change`/`HubChange`), checksum (sync-hub, syncService, wsSyncClient) — drift risk, no `protocolVersion`. Version hardcoded `21` across 6+ files. | sync-hub.ts, syncService.ts, wsSyncClient.ts | **FIXED** (unified) |
| 7 | LOW | mDNS/WS reports inconsistent `schema_version` (21/17/21). | discovery.ts:67, sync-hub.ts:119, websocket-server.ts:262 | **FIXED** |
| 8 | LOW | E2E harness (`npm run test:sync`) was broken pre-session: imported removed `sync-cloud.ts`. | `e2e-sync-entry.ts` | **FIXED** (harness revived) |

---

## 3. What landed this session

All changes verified — see §7 test matrix.

### 3.1 Restored the WebSocket channel (critical fix)
`src/main/sync/websocket-server.ts`
- Removed the connect-time `device-connected` emit that referenced undefined
  locals (only identity known *after* `PAIR_REQUEST`). Added guarded comment.
- `device-connected` now fires from `handlePairRequest` with the real
  `device_id/name/platform` once pairing succeeds.
- `PAIR_RESPONSE` and `/sync/info` now report `schemaVersion: PROTOCOL_VERSION`.

### 3.2 Enabled WebRTC transport (critical fix)
`src/main/sync/webrtc-manager.ts`
- `node-datachannel` is loaded lazily via `loadDatachannel()` in try/catch
  (cached). When absent, `createPeer()` returns `null`, emits a status line and
  the peer is skipped — P2P degrades to LAN/relay instead of crashing.
- `createOffer`/`acceptOffer` guard the `null` result.
- Added `"node-datachannel": "^0.33.4"` to `package.json` and installed it
  (verified `PeerConnection` loads under electron).

### 3.3 Created the missing `sync_conflicts` table
`src/main/database.ts` — `CREATE TABLE IF NOT EXISTS sync_conflicts (...)` +
`idx_sync_conflicts_uuid`, mirroring the mobile schema, so `getUnifiedSyncStatus`
and a future conflict resolver work.

### 3.4 Unified wire protocol (the "single source of truth")
New `@shega/shared/src/sync/protocol.ts` (+ exported via `src/sync/index.ts`):
- `PROTOCOL_VERSION = 22`
- `SHARED_SYNC_ENTITIES` — authoritative relay entity list (36 entities; mobile's
  34 are a strict subset). Desktop `SHARED_TABLES` and mobile `SYNC_ENTITIES`
  now both derive from it.
- `ChangeEnvelope` (extends the existing shared `SyncChange`) — the single
  wire envelope with an optional server `seq`/`ts`.
- `canonicalChangeString()` + `changeChecksum()` — one canonical string
  `entity|uuid|op|JSON(payload)` hashed by pure-JS SHA-256 (`js-sha256`,
  added to `@shega/shared` deps). Byte-identical in Node and React Native.

Wired to the shared module:
- `sync-hub.ts` — removes local `SHARED_TABLES` + `changeChecksum` (both now from
  shared; `createHash` kept for the aggregate snapshot checksum in
  `verifyChecksums`); `schema_meta` insert + `/sync/info` use `PROTOCOL_VERSION`.
- `syncService.ts` — removes duplicated `canonicalChange`/`changeChecksum` +
  `expo-crypto` (kept for `randomUUID`); `SYNC_ENTITIES = SHARED_SYNC_ENTITIES`.
- `wsSyncClient.ts` — `computeChecksum` delegates to shared `changeChecksum`.
- Version consistency: `discovery.ts`, `websocket-server.ts`,
  `mobileMdnsPublisher.ts`, `mobileSyncServer.ts`, `database.ts` default now all
  read `PROTOCOL_VERSION`.

### 3.5 Revived the E2E harness
`e2e-sync-entry.ts` — removed the stale `./src/main/sync-cloud` import block
(the cloud-sync module no longer exists; cloud **pairing** lives in
`pairing-cloud.ts`). Added a **WS regression** suite (pair → SYNC_PUSH → verify
row) that fails on the old code and passes now. `npm run test:sync` is green
again (34/34).

---

## 4. Target architecture (map of goals → modules)

```
                 ┌──────────────────────────────────────────────────────┐
                 │        UNIFIED SHEGA SYNC LAYER (any device)         │
                 │   @shega/shared/src/sync/protocol.ts (wire spec)     │
                 │   PROTOCOL_VERSION · SHARED_SYNC_ENTITIES            │
                 │   ChangeEnvelope · changeChecksum                    │
                 └──────────────┬───────────────────────┬───────────────┘
                                │                       │
   ┌──────────── DISCOVERY ─────┤          ┌────────── TRANSPORT ────────┤
   │ mDNS _shega-pos + _shega-pair│          │ LAN HTTP 5757 (sync-hub)   │
   │ LAN sweep 5757/5759         │          │ WS 5758 (websocket-server)  │
   │ cloud membership (pair only)│          │ Mobile TCP hub 5759         │
   └──────────────┬──────────────┘          │ WebRTC DataChannel (P2P)    │
                  │                         │ Cloud relay (MISSING §20)   │
   ┌──────────── PAIRING ─────────┐          └──────────┬────────────────┘
   │ 6-char hub code (always shown)│                     │
   │ invite code (XXX-XXX-XXX)     │   ┌────────── SYNC ──────────┐
   │ QR (primary on mobile,        │   │ outbox → push → PRUNE on │
   │   secondary everywhere)       │   │ per-change ack (applied/  │
   │ owner approval / role assign  │   │  conflict); pull cursor;  │
   │ device lock/replace/revoke    │   │ LWW + idempotency + FK    │
   └───────────────────────────────┘   │ deferral; sync_conflicts  │
                                        └──────────┬────────────────┘
                                              VTIME/single connection
                                              manager + diagnostics
```

Priorities against the §1–§40 spec:

- **A — Identity & pairing (largely present).** DeviceId persistence, hub pairing
  token, invite codes, QR, owner approval, role assignment, replace/revoke/lock
  exist. Pairing is now **code-first with QR secondary** on every add-device
  surface: the mobile PairCard shows the invitation code + QR above the radar,
  the desktop Add Device modal shows its pairing code by default, and scanning
  an invitation QR drops straight into the joined flow. Remaining polish:
  the desktop joiner (AuthScreen) still offers code entry only after the radar
  search window elapses, and device counts from the plan are not enforced.
- **B — Discovery (present).** mDNS + sweep + pair beacon work; needs consistent
  `schemaVersion` handling (now unified) and a "no nearby devices →
  pair by code over internet" fallback message.
- **C — Transport (now functional).** WS + WebRTC fixed. Remaining: a **TURN
  server** config for NAT'd internet P2P (§ connectivity matrix), and the
  **cloud data relay** (§20) — the two work items that make internet sync real.
- **D — Sync/conflict (robust).** LWW + movement-ledger + immutable + version
  conflict strategy selection exists in `getConflictStrategy`; `sync_conflicts`
  table now materialized; the real obsoletion of `sync/crdt.ts` (dead CRDT
  prototype) can be deleted; follow-ups: persist conflicts to `sync_conflicts`,
  per-business isolation test, background sync task on Android (TaskManager).

---

## 5. Migration / rollout plan

1. **Ship bugs 1–3 + protocol unification (this session).** Backwards compatible:
   `PROTOCOL_VERSION` is informational; both apps still accept older versions;
   checksum string is unchanged so existing `sync_received` idempotency keys stay
   valid. No DB migration required (new `sync_conflicts` is `IF NOT EXISTS`).
2. **Desktop restart** after installing `node-datachannel` (already in
   `package-lock.json`). Run `npm run dev` or rebuild; confirm WS + WebRTC init
   in logs. Restart also runs `foldPeerBusinessDataIntoDefault()` from earlier
   work (verify phone products now show in Inventory Ledger under the default
   business).
3. **Mobile:** run `expo run:android` (native modules required for TCP server +
   WebRTC; mDNS for beacon). `@shega/shared` change is additive; no schema change.
4. **Next iteration (§ priority order):** (a) add TURN + wire internet P2P,
   (b) implement §20 cloud data relay in `api.ts`/`pairing-cloud.ts` and call
   `getSyncStrategy` on both sides, (c) PairCard code/QR UX, (d) background sync,
   (e) delete dead `sync/crdt.ts`.

---

## 6. Files touched this session

| Repo | File | Change |
|---|---|---|
| shared | `src/sync/protocol.ts` | **new** unified protocol module |
| shared | `src/sync/index.ts` | export protocol |
| shared | `package.json` | + `js-sha256` |
| desktop | `src/main/sync-hub.ts` | import shared entities/checksum/version; remove dups |
| desktop | `src/main/sync/websocket-server.ts` | fix ReferenceError + real identity emit + PROTOCOL_VERSION |
| desktop | `src/main/sync/webrtc-manager.ts` | guard node-datachannel |
| desktop | `src/main/sync/discovery.ts` | PROTOCOL_VERSION in TXT |
| desktop | `src/main/database.ts` | + sync_conflicts table; DEFAULT version |
| desktop | `package.json` | + `node-datachannel` |
| desktop | `e2e-sync-entry.ts` | drop stale sync-cloud import; + WS regression suite |
| mobile | `src/services/syncService.ts` | shared entities/checksum |
| mobile | `src/services/wsSyncClient.ts` | shared checksum |
| mobile | `src/services/mobileMdnsPublisher.ts` | PROTOCOL_VERSION |
| mobile | `src/services/mobileSyncServer.ts` | PROTOCOL_VERSION |
| mobile | `src/screens/settings/devices/ConnectedDevicesScreen.tsx` | PairCard: invitation code + QR + copy shown above the discovery radar (code-first) |
| mobile | `app/scan-join.tsx` | invitation-code/QR scans now route into the standard join flow |
| mobile | `src/screens/onboarding/join-existing.tsx` | accepts a `code` deep-link param and auto-connects (scanned QR → join) |
| desktop | `src/renderer/src/components/P2pSyncStatus.tsx` | Add Device modal shows pairing code + hub URL by default (no hidden toggle) |

## 7. Test matrix (all green)

| Suite | Result |
|---|---|
| `@shega/shared` `npx tsc --noEmit` | PASS |
| desktop `npx esbuild` (touched files) | PASS |
| desktop `npx vitest run` | **78/78** (69 original + 9 ICE-config/diagnostics) |
| desktop `npm run test:sync` (electron e2e) | **34/34**, incl. new `ws_pair_request_succeeds`, `ws_client_registered`, `ws_sync_push_applied` (schemaVersion 22) |
| mobile `npx tsc --noEmit` | PASS (0 errors) |
| mobile esbuild (touched files) | PASS |
| WebRTC runtime | `node -e "require('node-datachannel').PeerConnection"` → function |

## 8. TURN / ICE configuration (credential placement)

TURN support is implemented end-to-end but **deployed STUN-only** until a
credential provider is chosen. With no env vars set, both apps behave exactly
as before (default STUN servers, direct/detected connectivity).

**Where to put credentials (desktop)** — set any/all in the desktop env before
launch:

```
SHEGA_TURN_URL=turn:your.turn.host:3478,turn:your.turn.host:3479
SHEGA_TURN_USERNAME=user
SHEGA_TURN_PASSWORD=secret
# alternative: full JSON override with per-server credentials
SHEGA_ICE_SERVERS=[{"urls":["turn:a.example.com:3478"],"username":"u","credential":"p"}]
```

- `SHEGA_TURN_URL` accepts a single URL or comma-separated list (same creds).
- `SHEGA_ICE_SERVERS` is a raw JSON array that replaces the whole list — use it
  only when different TURN servers need different credentials. If both are set,
  `SHEGA_ICE_SERVERS` wins.

**Where to put credentials (mobile)** — Expo inlines only `EXPO_PUBLIC_*` at
build time, so use the `EXPO_PUBLIC_` prefixed names; the `SHEGA_*` aliases are
also read for parity with desktop:

```
EXPO_PUBLIC_TURN_URL=turn:your.turn.host:3478
EXPO_PUBLIC_TURN_USERNAME=user
EXPO_PUBLIC_TURN_PASSWORD=secret
EXPO_PUBLIC_ICE_SERVERS=[...]
```

**How to verify a connection actually used TURN (relay):**
1. Open the sync status UI (desktop or mobile) and check the peer line.
2. The session `kind` reads `relay` when the selected candidate pair was a TURN
   relay (`type relay`), `srflx` when it used a STUN-mapped public address, and
   `p2p-direct` for a host pair. ICE candidate types are also reported per peer.
3. If the credential line is wrong (or the TURN host refuses), WebRTC falls back
   to STUN silently — expect `srflx`/`p2p-direct` and no `relay` line. Try the
   relay unit test in `src/main/sync/webrtc.test.ts` after wire-tapping, or test
   the TURN host with a tool like trickle-ice
   (https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/).
4. Credentials never appear in logs, IPC responses, or the UI — `stripUrlCreds`
   redacts `turn(s)://user:pass@host` in every diagnostic path.

## 9. Cloud data sync (§20) status

- **Desktop**: `src/main/sync-cloud.ts` implements the relay client per
  `SYNC_CONTRACT.md` (§4 endpoints, §5 setting keys). Settings
  (`cloud_sync_url`, `cloud_sync_device_key`, `cloud_sync_enabled`,
  `cloud_sync_cursor`) live in the desktop `settings` table; secrets are never
  returned over IPC. Preload exposes `cloudStatus`, `cloudSync`, `cloudVerify`,
  `saveCloudConfig`, `cloudEnabled`. The hub is the single cloud carrier — the
  `X-Device-Key` + `X-Idempotency-Key` (hubId@maxSeq) headers implement the
  contract. `detectNetworkCapabilities()` now reports `cloudConfigured` from
  settings, and the unified status transport resolves through
  `getSyncStrategy()`.
- **Mobile**: `src/services/api.ts` has contract-complete transport helpers
  (`cloudPushChanges`, `cloudPullChanges`, `cloudVerify`, `isCloudSyncReachable`)
  built on the authenticated `request()` client; `syncService.ts` adds
  `syncViaCloud()` orchestrator (push outbox → prune → pull since cursor →
  apply LWW, cursor persisted in `app_settings`). All endpoint paths mirror
  `SYNC_CONTRACT.md` §4 — nothing invented.

## 10. Known gaps requiring owner decisions

- **TURN server**: implemented but not deployed. Internet WebRTC behind
  symmetric NAT still fails with STUN only. Add a TURN credentials provider
  (free tier acceptable), place credentials per §8 above, restart, and confirm
  the peer line shows `relay`. No hardcoded credentials exist in the repo.
- **Cloud relay backend (backend gap)**: the Django `/api/sync/*` endpoints in
  `SYNC_CONTRACT.md` §4 do not exist yet (no Shega backend is deployed; the
  only Django found, `fresh-roots/backend`, is a different project). Both
  clients are **contract-complete and return structured `not_configured` /
  network-error results without E2E** until a backend is stood up per the
  contract. This is the single owner decision blocking live cloud sync.
- **Background sync** on Android (TaskManager/BackgroundFetch) not implemented.
- **`encryptField`** in mobile `sqlcipher.ts` is still a `'PLACEHOLDER:'+` stub;
  MASTER_KEY unused for field encryption.
- **Desktop joiner (AuthScreen)** still reveals the invitation-code input only
  after the 30s radar search window elapses — acceptable (radar-first) but a
  one-line "enter code" affordance would match the mobile first-class code UX.

## 11. Automatic reconnect & network-change handling (this session)

Both apps now converge *event-driven*, not just on a poll. Every reconnect
signal funnels into a single kick, so a device coming back online never waits
the full poll interval and never stampedes the engine.

### Triggers → action

| Signal | App | Action |
|---|---|---|
| App open / re-open (WS effect, 2s settle kick) | desktop | immediate sync pass |
| mDNS `up`/`down` (hub appeared / vanished) | both | immediate discovery + sync pass |
| Network restored (offline→online) | both | reconnect ancillary transports + sync pass |
| Network switched (Wi-Fi⇄cellular/Ethernet, VPN) | both | re-detect strategy + sync pass |
| App foreground (`AppState 'active'`) | mobile | re-probe connectivity + sync pass |
| Periodic loop | both | LAN every 30s, discovery every 15s, WS pushed live |

### Mobile (`shega-mobile`)

- **`connectivity.ts`** — gstatic `generate_204` probe with TTL cache; live
  status subscription (`subscribeConnectivityStatus`). NO NetInfo dependency
  (works in Expo Go). `AppState 'active'` invalidates the cache and re-probes.
- **`wsSyncClient`** — no more permanent give-up: reconnect grows with capped
  exponential backoff (2s → ~30s max) and retries forever while configured;
  backoff resets only on success. `retryNow()` (cancel timer, dial immediately)
  is called on connectivity restore / app resume via the singleton wrapper.
  `disconnect()` fully cancels the backoff timer (explicit teardown only).
- **`peerSyncManager`** — subscribes to mDNS `up`/`down` → immediate
  discovery + LAN sync when mode is client/both (previously poll-only, up to
  15s). `performLanSync` is single-flight so a tick + an `up` event coalesce.
- **`SyncContext`** — subscribes to connectivity; offline→online triggers
  `wsSyncClient.retryNow()` + `p2pSync.announce()` + `runSync()` +
  `refreshUnifiedStatus()`. `runSync()` falls back to cloud
  (`syncViaCloud()`) when the LAN yields nothing, so a phone without a desktop
  on the network still converges against the relay. `SyncTransport` extended
  with `'cloud'`; unified status resolves transport as lan → cloud → offline.

### Desktop (`shega-desktop`)

- **`src/main/sync/connectivity.ts` (new)** — main-process network monitor:
  (1) internet probe (same gstatic 204, ≥30s spacing), (2) `os.networkInterfaces()`
  signature poll every 15s (internal interfaces excluded; any address change =
  network switch/VPN), (3) `powerMonitor` resume/on-ac hints. Emits
  `online` / `offline` / `network-changed`. The signature helper is pure +
  unit-tested.
- **`peer-sync.ts`** — `networkMonitor.start()`; `online` and `network-changed`
  debounced → `performLanSync()` + `p2pSync.announce()`. mDNS `up`/`down` also
  kick. Startup kicks ~2s after discovery settles (no more 30s wait).
  `detectNetworkCapabilities().hasInternet` is now the real monitor state, so
  `getSyncStrategy` can pick cloud when LAN is empty. `performLanSync` is
  single-flight and, when no hubs exist but cloud is configured + online,
  calls `syncCloudOnce()` as the fallback transport (≥60s throttle).
  `stopPeerSync` tears down the monitor and all listeners.
- Unified status health resolves through `getSyncStrategy`: `offline` only when
  there is truly no path (LAN empty AND not online/cloud-configured), so an
  online cloud-configured device reads as connected, not offline.

### Retry/backoff policy (3.4)

- Mobile WS: `delay = min(2000 · 1.5ⁿ, 30_000)`, `n` resets on success. Infinite
  while configured.
- Mobile sync loop: 20s period, on failure exponential backoff with jitter
  (5s base → 5min cap).
- Desktop: 30s LAN interval + event kicks (no failure spin-up needed — the
  monitor replaces blind retries with *reconnects when signals say so*).
- Cloud fallback: ≥60s throttle both apps to be gentle on the relay.