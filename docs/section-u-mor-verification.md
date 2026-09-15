# Section U — MoR (Ministry of Revenues) Taxpayer Verification

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Mobile / Desktop UI                       │
│  MorVerification badge + Verify / Refresh-from-MoR button        │
└──────────────────────────┬───────────────────────────────────────┘
                           │  cache (client-cache, fresh/stale)
┌──────────────────────────▼───────────────────────────────────────┐
│                     Tax Verification Service                     │
│  app_settings JSON (mobile) / mor_verifications SQLite (desktop) │
└──────────────────────────┬───────────────────────────────────────┘
                           │  authenticated POST (Bearer token)
┌──────────────────────────▼───────────────────────────────────────┐
│                   Shega Backend  (Django REST)                   │
│              POST  /api/mor/verify-tin/                          │
│              per-user throttle: 30/min                           │
│              local cache: 12h (verified, not_found)              │
│              audit log: MorVerificationEvent (masked TIN only)   │
└──────────────────────────┬───────────────────────────────────────┘
                           │  optional — when MOR_API_KEY is set
┌──────────────────────────▼───────────────────────────────────────┐
│              Official MoR Gateway (env-gated seam)               │
│  MOR_API_BASE_URL + MOR_API_KEY → real Ministry response        │
│  If not configured → returns honest "unavailable" status        │
└──────────────────────────────────────────────────────────────────┘
```

## Key Contract

| Status       | Meaning                                                        | UI rendering                           |
|--------------|----------------------------------------------------------------|----------------------------------------|
| `verified`   | MoR returned a valid taxpayer record                           | Green badge "Verified by Ministry of Revenues" |
| `not_found`  | MoR confirms the TIN does not exist                            | Grey badge "No MoR match"             |
| `unavailable`| MoR could not answer (not configured, network, CAPTCHA, etc.)  | Amber badge "Verification unavailable" |
| `failed`     | MoR returned an unexpected error                               | Red badge "Verification failed"       |

**Only `verified` may display "Verified by Ministry of Revenues".**  
`source` distinguishes `mor` (live gateway), `backend` (Django 12 h cache), `client-cache` (mobile/desktop local cache).

## Offline Behaviour

- **Desktop**: a fresh verified/not_found answer is cached in SQLite (`cache_until`). When offline, stale cached answers are **not** shown as fallback; the UI renders `unavailable` with the reason `"backend_unreachable"`. This ensures no silently outdated "verified" state.
- **Mobile**: a stale cached answer **is** shown as fallback (with a visible "cached — refresh recommended" indicator) to preserve offline utility. The user always sees the stale-age label and can manually refresh.
- Both platforms never claim "verified" unless the Ministry actually answered `verified`.

## Privacy

- Full TIN is **never persisted** on the backend — only a SHA-256 `tin_digest` and a masked form (first 2 + last 2 digits) appear in the audit log.
- Full TIN is stored client-side only (SQLite on desktop, app_settings JSON on mobile) and never transmitted outside the user's device except to the Shega backend endpoint.
- No MoR credentials, API keys, or session cookies are stored in or passed through mobile or desktop clients.

## Backend Configuration (shega-admin/backend)

Set the following environment variables to enable the real MoR gateway:

```bash
MOR_API_BASE_URL=https://<official-mor-api-host>
MOR_API_KEY=<api-key>
MOR_VERIFY_PATH=/v1/taxpayer/verify   # default
MOR_CACHE_SECONDS=43200                # 12 hours
```

If **any** of these are unset, the gateway returns `unavailable` and the endpoint behaves as a controlled staging seam.

## Adding a new official MoR integration

1. Obtain an API key from the Ministry of Revenues.
2. Set the four env vars above in the production Render deployment.
3. Map the official JSON response in `backend/mor/gateway.py` → `MorGatewaySeam.map_official_response()`. The method currently whitelists: `tin`, `sub_tin`, `status`, `taxpayer_name`, `taxpayer_type`, `registration_number`, `reason`, `reference`.
4. Ship. No mobile or desktop code changes required.

## Source Files

| Layer       | File                                                           |
|-------------|----------------------------------------------------------------|
| Shared      | `@shega/shared/src/tax/verification.ts`                       |
| Backend     | `backend/mor/{verification,gateway,models,views,urls,admin,tests}.py` |
| Desktop DB  | `src/main/database.ts` (migration v37)                        |
| Desktop IPC | `src/main/mor/{verifier,index}.ts`                            |
| Desktop UI  | `src/renderer/src/components/MorVerification.tsx`              |
| Mobile      | `src/services/taxVerification.ts`                              |
| Mobile UI   | `src/components/tax/mor-verification.tsx`                      |

## Tests

- **Backend**: `python manage.py test mor` → 13 tests (auth gate, invalid TIN, cache-hit, force bypass, transient failure handling).
- **Desktop**: `npx vitest run` → 48 tests across 3 files including `tax-verification.test.ts` (8 MoR verification unit tests).
