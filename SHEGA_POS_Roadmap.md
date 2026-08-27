SHEGA
Premium POS Upgrade Roadmap
Implementation Plan & Development Checklist
Shega Desktop (Electron) & Shega Mobile (Expo/React Native)
Prepared 2026 · Confidential
Scope. This document is the complete, step-by-step engineering plan for turning the current offline
inventory/sales system into a commercial-grade, multi-user POS platform with LAN/Wi-Fi and
Internet synchronization plus full peripheral support (ESC/POS thermal printers, cash drawers,
HID/serial barcode scanners, and digital scales). Every recommendation states what is missing, why
it matters, what to change, which app it affects, how it should work, priority, dependencies, and how
to test it.
Contents
1. Phase 0 — Critical Security & Data-Integrity
Fixes
2. Phase 1 — POS Core (Checkout, Cashier,
Inventory, Roles, Tax)
3. Phase 2 — Peripherals & Hardware
Integration
4. Phase 3 — Offline-First Synchronization (LAN
+ Internet)
5. Phase 4 — Advanced Commercial Features
6. Phase 5 — Architecture, Security & Code
Quality
7. Phase 6 — UX, Localization, Performance &
Polish
8. Phase 7 — Testing, QA & Release Readiness
9. Appendix A — Priority Legend & Glossary
10. Appendix B — ESC/POS Command Reference
11. Appendix C — Cash Drawer Wiring & RJ11
Pinout
12. Appendix D — Barcode Symbologies &
Scanner Setup
13. Appendix E — Sync Protocol Message
Contracts
14. Appendix F — Ethiopian Tax (VAT/TOT/ERCA)
Checklist
15. Appendix G — Database Migration & Backfill
Checklist
16. Appendix H — Hardware Compatibility Matrix
17. Appendix I — Disaster Recovery Runbook
18. Appendix J — Security Hardening Checklist
19. Appendix K — Performance Budgets &
Benchmarks
20. Appendix L — Cashier Standard Operating
Procedures
21. Appendix M — QA Test Matrix
Phase 0 — Critical Security & Data-Integrity Fixes
Do these first. They protect revenue data, credentials, and the company's GitHub account.
0.1 Remove leaked GitHub Personal Access Token CRITICAL Mobile
Missing/Broken A live github_pat_...  token is committed in shega-mobile/app.json  under
expo.extra.update.githubToken . Anyone with repo read access can read it.
Why it matters Grants write access to the GitHub repo — an attacker can push malicious code to every
install and exfiltrate customer data.
Change Revoke the token now in GitHub settings; delete it from app.json/history; use EAS Secrets
(eas secret:set ) or an env var at build time.
How expo-updates reads extra.update.githubToken  only when present; provide it via EAS build
environment instead.
Dependencies GitHub account access, EAS account.
Test Confirm token is revoked; grep repo history for the old value; build via EAS succeeds without
a token in app.json.
0.2 Fix permanent account lockout after 5 failed PINs CRITICAL Desktop
Missing/Broken In ipc-handlers.ts  login , hitting 5 failed attempts sets isActive = 0  AND
lockedUntil . The next login returns "Account deactivated" before the lockout check — so
a 30-minute lockout becomes a permanent deactivation.
Why it matters A cashier mistyping a PIN bricks their own account; the business must manually reactivate,
and there is no unlock path.
Change Never deactivate on failed attempts. Track failedLoginAttempts  + lockedUntil  only;
auto-unlock when lockedUntil  passes.
How Remove isActive = 0  from the lock branch; on login, if lockedUntil < now , reset
attempts and allow.
Dependencies None.
Test Enter wrong PIN 5×; wait 30 min (or set short duration); verify login succeeds without admin
intervention.
0.3 Block negative stock / insufficient-stock sales on Mobile CRITICAL Mobile
Missing/Broken insertSale  in db.ts  decrements totalBaseQuantity  unconditionally (UPDATE ...
totalBaseQuantity = totalBaseQuantity - ? ) with no stock check; Desktop correctly uses
AND totalBaseQuantity >= ?  and throws.
Why it matters Selling more than stock produces negative inventory, corrupts profit calculations, and lets
cashiers oversell.
Change Add AND totalBaseQuantity >= ?  guard + row-count check; throw/return error and roll
back; mirror the Desktop contract. Also honor
allowSellByBaseUnit /allowSellByPackUnit  flags and pack conversion edge cases.
How Use runSync  result changes  to detect failure inside the existing transaction.
Dependencies None.
Test Attempt sale of 5 units when 3 in stock → rejected; attempt with 3 → succeeds; verify no
negative quantities in DB.
0.4 Fix Mobile sales category filter (filters by item name, not category) CRITICAL Mobile
Missing/Broken getFilteredSales  uses items.name = ?  for the category filter instead of joining
categories — filtering by "Beverages" returns nothing.
Why it matters A core filter is silently broken; cashiers and managers get wrong ledgers.
Change JOIN categories  and filter on categories.name ; fix same pattern on any other list filters.
Dependencies None.
Test Create 2 categories with items; filter sales by each; assert results match category
membership.
0.5 Fix Desktop read-permission bugs on Sales, Returns, Debt CRITICAL Desktop
Missing/Broken get-sales , get-sale , get-returns  require sales.create ; pay-debt  requires
payments.reverse . A role that can only view sales cannot open the page, and cashiers
cannot collect debt payments.
Why it matters Role model is unusable: least-privilege users are blocked from read/operational actions.
Change Use sales.view /sales.pay -style granular perms and map them in PERMISSION_MODULE ;
default roles must include them.
Dependencies None.
Test Create a read-only cashier role; verify list/detail pages load and debt payment works under
the correct permission.
0.6 Encrypt full-disk-sensitive local data & secure IPC boundary HIGH Both
Missing/Broken SQLite files (sales, customers, PIN hashes) are plaintext on disk. Desktop runs with sandbox:
false ; renderer has broad API surface (exportData , resetData , delete-* ) reachable by
any page.
Why it matters A stolen laptop or phone yields the entire business ledger and PII.
Change Desktop: enable Electron sandbox (verify preload works), add app-level DB encryption layer
(e.g., SQLCipher) or full-disk guidance; add IPC arg validation/whitelisting. Mobile: keep
app_settings  secrets in SecureStore (already done for tokens) and never store PIN
plaintext.
Dependencies Testing on Windows 10/11; backup/restore must handle encrypted DBs.
Test Open DB file in a hex editor — no customer names visible; sandboxed window still loads all
features; restore-from-backup works after encryption.
0.7 Fix Desktop backup restore + WAL consistency HIGH Desktop
Missing/Broken Restore does copyFileSync(backupPath, db.name)  then requires restart; WAL/shm files
may be stale, and no pre-restore safety backup or transaction of "current data" is offered.
Why it matters A bad restore can destroy the live ledger with no rollback.
Change Force wal_checkpoint(TRUNCATE)  before copy, delete stale -wal /-shm , take an
automatic pre-restore snapshot, and verify integrity (PRAGMA integrity_check ) before
swap.
Dependencies 0.6 if encryption lands.
Test Make sales, backup, restore, verify data intact and app opens; intentionally restore a corrupt
file and confirm it is rejected, not loaded.
0.8 Validate every IPC payload with Zod (defense in depth) HIGH Desktop
Missing/Broken Preload exposes ~100 methods that pass raw any  objects to the main process; ipc-
handlers.ts  does ad-hoc field checks but nothing enforces a full shape. A compromised or
buggy renderer (or an XSS path) can inject malformed records.
Why it matters IPC is the trust boundary; zod is already a dependency and is used in renderer schemas —
enforcing it at the boundary is nearly free.
Change Add a Zod schema per IPC channel in a shared contracts/  module; validate at the top of
each handler; return typed ApiError -style failures. Same schemas become the sync DTO
contracts (3.1/5.7).
Dependencies 5.1 service refactor (best moment to add).
Test Send malformed payloads from the renderer console; each is rejected with a clear error and
no DB write occurs.
Phase 1 — POS Core
The checkout, cashier, inventory, roles, and tax engine must be fast, safe, and multi-register capable.
1.1 Dedicated fast-checkout "POS Register" screen (Desktop) HIGH Desktop
Missing/Broken Sales live inside a data-table page with a wizard; no single screen optimized for scanning a
cart at 60–90 seconds/customer.
Why it matters Professional POS is judged by checkout speed and touch ergonomics.
Change New /register  route: big product grid, live search + barcode field, cart rail,
Qty/Unit/Price/Discount steppers, payment buttons, quick-change (cash tendered → change
due), one-tap settle + print + drawer kick. Keyboard-first (F2 search, F4 pay, Enter).
Dependencies 2.1 (barcode), 2.2 (printer), 2.3 (drawer).
Test Time a 5-item scan+pay transaction; assert < 60s and change calculation correct for multiple
tender types.
1.2 Unified cart/checkout model shared by both apps HIGH Both
Missing/Broken Desktop wizard and Mobile checkout implement pricing/stock logic twice and differently
(VAT field only on desktop; taxType  only on mobile).
Why it matters Divergence causes different receipts for the same cart and breaks shared sync/tax logic.
Change One cross-platform domain module (pure TS): Cart → line items, discount, tax
(VAT/TOT/None), subtotal, total, change; unit-conversion via unitsPerPack ; consumed by
both apps.
Dependencies 1.8 (tax engine), 4.3 (shared schema).
Test Property tests over random carts: same inputs → identical totals and rounded output on
both platforms.
1.3 Cashier shifts, open/close cash, X/Z reports HIGH Both
Missing/Broken No shift concept; no cash-in-drawer tracking; no Z (day-end) or X (mid-day) reporting.
"Clocked in" exists in Employees UI only as a field.
Why it matters Cash reconciliation and shrinkage detection are core retail requirements and legal audit
needs.
Change Add cash_registers  and shifts  tables (register id, cashier, opening float, open time,
close time, counted cash, status). Start shift = opening balance; each sale with method=Cash
ties to shift; closing records counted cash and computes variance. X report = current shift
summary; Z report = end-of-day totals + void/return/refund summary (print via Phase 2).
Dependencies 4.3 schema; 2.2 printer for X/Z print.
Test Open shift with 500 ETB float, sell cash 300, cash-drawer counted 800 → variance 0; Z report
figures match ledger; two overlapping shifts rejected.
1.4 Multi-register support HIGH Both
Missing/Broken One default warehouse/register; no concept of multiple registers with separate
drawers/receipts.
Why it matters Stores run 2–10 registers; each needs its own drawer, printer, and shift.
Change Add registers  table (name, warehouse, printer/drawer/scanner/scale device config); each
sale records registerId ; Dashboard/Reports can filter by register.
Dependencies 1.3 shifts, Phase 2 peripherals, 4.3 schema.
Test Create 2 registers on one desktop; sell on each; verify sales tagged per register and Z reports
separated.
1.5 Multi-user roles & permissions on Mobile HIGH Mobile
Missing/Broken Mobile has a single local user (no employees/roles). Desktop has a full roles/permission
system that mobile ignores.
Why it matters Any phone can void, delete, or export everything; premium POS needs per-user PINs and
permissions synced from the hub.
Change Add users /roles /sessions  tables; user table synced from Desktop hub (Phase 3); gate
screens/actions (e.g., void requires sales.void , settings require settings ).
Dependencies Phase 3 sync; 1.7 approvals.
Test Log in as 3 roles on one device; verify each sees only permitted actions; permission change
on hub reflects within one sync.
1.6 Returns/refunds/voids with manager approval & reasons HIGH Both
Missing/Broken Returns and voids exist but without approval workflow, refund-to-original-payment, or
mandatory reason enforcement; void reasons are free-text and unenforced.
Why it matters Retail shrink and fraud live here; professional POS requires audit-grade controls.
Change Configurable policy: require reason (from picklist) + manager PIN approval over threshold.
Void/return create receipt_transactions  with original sale reference; refunds limited to
original payment method where possible; all logged to audit.
Dependencies 1.5 roles; 4.5 audit; Phase 3 (conflicts).
Test Void above threshold without manager PIN → blocked; with PIN → proceeds, audit row
created, stock restored exactly.
1.7 Price overrides, manager approvals, and max-discount caps HIGH Both
Missing/Broken Discounts are unrestricted; no price-override permission; no per-role discount caps.
Why it matters Uncontrolled discounts erode margin and are a classic fraud vector.
Change Add price_override  permission; per-role max discount %; overrides above cap require
manager PIN; store overrideBy /overrideReason  on the sale.
Dependencies 1.5 roles.
Test Cashier with 10% cap tries 25% → blocked; manager approval lets it through and logs the
override.
1.8 Ethiopian tax engine: VAT 15%, TOT 2%, multi-rate, receipts with TIN HIGH Both
Missing/Broken Single VAT% field (mobile has taxType  VAT/TOT/None with rate). No per-item tax rates, no
tax-exempt handling, no TIN/Tax-Registration No. on receipts, no fiscal/ETRS output.
Why it matters Ethiopian Revenue Service requires VAT invoices with business TIN, date, and serialized
receipt numbers; wrong tax = legal risk.
Change Tax config per item/category (0%, VAT 15%, TOT 2%) with inclusive/exclusive switch; receipt
template includes business name, TIN, register no., serial no., itemized tax; reserve fields for
ETRS/fiscal printer integration.
Dependencies 4.3 schema (tax columns), 2.2 printer.
Test Mixed-tax cart computes correct per-line tax and totals; receipt shows TIN and serial; Z
report aggregates VAT payable.
1.9 Loyalty, customer profiles, and stored balances MEDIUM Both
Missing/Broken Customers exist with credit limits and ledgers, but no loyalty points, no customer tiers
driving discounts, no quick profile at checkout.
Why it matters Retention mechanics and debt collection are tied to strong customer identity.
Change Add loyalty table (points, tier), points accrual/spend rules in the cart engine, customer quick-
search by phone at checkout, and auto-create from sale.
Dependencies 1.2 cart model; 4.3 schema.
Test Sale with loyalty customer accrues 1 point/10 ETB; redeem 10 points = 5 ETB discount;
balance persists across sync.
1.10 Purchase orders, receiving, batch/expiry tracking HIGH Both
Missing/Broken Orders and supplier purchases exist, but no purchase-order → receiving workflow (received
qty vs ordered qty), no batch/lot numbers, and expiry is a single item field.
Why it matters FEFO stock control and expiry tracking prevent loss; receiving reconciliation prevents
supplier disputes.
Change Add batches  table (item, lot, expiry, qty-in, qty-out) and sell-from-batch (FEFO); PO → GRN
workflow (partial receipts, qty match variance); low-stock reorder suggestions already exist
— link them to PO creation.
Dependencies 4.3 schema; 1.2 unit conversions.
Test PO 100 units, receive 60 → open qty 40; two batches same item, expiry A < B; sales consume
A first; expired batch flagged.
1.11 Inventory counting (stocktake) with variance approvals MEDIUM Both
Missing/Broken Warehouse inventory can be set/adjusted manually, but there is no guided stocktake session
with counted-vs-system variance and approval.
Why it matters Stocktakes are how a shop discovers shrinkage; manual edits hide it.
Change Stocktake table (session, items, system qty, counted qty, variance, status); posting a session
creates adjustments in one transaction and requires manager approval over a variance
threshold.
Dependencies 1.5 roles; 1.10 batches; 4.3 schema.
Test Count differs by 15 units on an item; post under threshold applies; over threshold requires
approval; adjustment rows logged.
1.12 Deposit/down-payment and layaway (prepayment) handling LOW Both
Missing/Broken No concept of deposits or layaway sales.
Why it matters Common in furniture/electronics retail in Ethiopia.
Change Extend debt/order flow: mark item reserved, take deposit, remainder due on pickup; reuse
debt_payments  mechanics.
Dependencies 1.3 shifts (cash tracking), Phase 3 sync.
Test Reserve with 30% deposit; stock reserved not sold; pickup completes sale; deposit applied.
1.13 Gift receipts, no-price receipts, and receipt copy/reprint LOW Both
Missing/Broken Single receipt format; reprint from Sale Detail exists on desktop but no gift-receipt mode.
Why it matters Retailers need flexible receipt variants; reprint is an audit-relevant action.
Change Receipt renderer options: standard / gift (no prices) / void / X / Z / tax-invoice; log every
reprint to audit.
Dependencies 2.2 printer; 4.5 audit.
Test Print all variants; verify gift receipt hides prices; verify reprint shows in audit log.
1.14 Payment-method expansion & split tender HIGH Both
Missing/Broken Payment methods are Cash / Bank Transfer / Check / Other (Desktop) and Cash / Transfer /
None (Mobile). No Mobile Money — dominant in Ethiopia — and no split payment (e.g., half
cash, half Telebirr) or "quick cash" tender buttons.
Why it matters Telebirr/CBE Birr/MPESA are mainstream; cashiers shouldn't round by hand.
Change Configurable payment methods with payment_methods  table (name, type
cash|mobile|card|transfer|check, icon, max split count); Register supports split tender
allocating line totals across methods; quick buttons for exact/500/1000/2000 notes
computing change.
Dependencies 1.2 cart model; 1.3 shifts (method totals per shift); 4.3 schema.
Test Split 250 ETB sale 100 cash + 150 Telebirr → two payment lines, totals reconcile, Z report
groups by method; change computed for 500 note.
1.15 Customer-specific price lists (tiers & contracts) MEDIUM Both
Missing/Broken Customers have groups (general/vip/wholesale/retail/corporate) but pricing ignores them;
one retail price only.
Why it matters Wholesale/corporate contracts depend on customer-tier pricing.
Change Price-list table (group, item, price, effective dates); checkout resolves price by customer
group with override fallback; syncs like any entity.
Dependencies 1.2 cart; 1.9 loyalty; 4.3 schema.
Test Wholesale customer sees contract price automatically; price change effective-dated; override
logs to audit.
1.16 Cash float, petty cash, and cash-drop tracking MEDIUM Both
Missing/Broken No petty-cash or cash-drop ("cash pick-up from register mid-shift") handling; shift float (1.3)
only as opening balance.
Why it matters Mid-shift drawer removals must be tracked or the closing variance looks wrong.
Change cash_moves  table (shift, register, type float-in|drop|petty-out|refund, amount, reason, user);
Z-report shows moves and adjusted expected cash.
Dependencies 1.3 shifts.
Test Drop 1000 mid-shift; close count matches sales minus drops; report shows each move with
actor.
Phase 2 — Peripherals & Hardware Integration
Industry-standard ESC/POS, HID, and Serial/COM support for both platforms, with a common device
manager.
2.1 Barcode scanner support (HID wedge + Serial + USB-HID) HIGH Both
Missing/Broken No scanner handling anywhere; "barcode" exists only as a translation key. Items have no
sku /barcode  column.
Why it matters Scanning is the fastest product lookup; without it checkout speed and accuracy suffer.
Change Add sku /barcode  to items (unique per business). BarcodeService: (a) HID keyboard-
wedge — global key buffer that commits on Enter, debounced; (b) Serial — read lines over
COM (9600 baud default); (c) USB-HID raw — node-hid  (desktop) / react-native-usb-
hid  (Android). Resolve scan → item; wire into Register search and Inventory item form.
Dependencies 1.1 register; 4.3 schema.
Test Physical wedge scan adds item to cart; serial scanner over USB-serial adds item; unknown
barcode shows "not found" and offers add-product.
2.2 ESC/POS thermal printer driver (raster rendering) HIGH Both
Missing/Broken Desktop prints via OS print dialog (webContents.print , ipc-handlers.ts:4165 ) — not
ESC/POS, no 80mm layout guarantee. Mobile exports PDF only. No direct printer support.
Why it matters Retail printers (Epson TM, Star, Bixolon, custom 58/80mm) are ESC/POS; the dialog path
prints A4 and can't open drawers reliably.
Change Shared ReceiptRenderer  builds a raster bitmap (384 px / 576 dots for 80mm) including
Ethiopic fonts; EscposWriter  encodes ESC @ , GS v 0  raster, cut, drawer kick. Transports
per platform (see table). Print a test page + receipt preview in Settings.
How Desktop: Serial (node-serialport ), USB (node-usb /escpos ), Network TCP 9100 (net );
Windows driver fallback stays. Android: Network TCP via react-native-tcp-socket ,
Bluetooth SPP via react-native-bluetooth-escpos-printer , USB OTG via react-native-
usb-serialport . iOS: AirPrint (react-native-print ) image fallback + MFI/Epson ePOS for
retail.
Dependencies Native modules require Expo prebuild/dev-client (not Expo Go); 4.3 device config.
Test Print 80mm receipt with Ethiopic + English on Epson TM-T82 (USB), Star (TCP 9100), and a
58mm Chinese printer (serial); verify alignment, cut, and no text overflow.
2.3 Cash drawer kick (RJ11 two-kick + standalone RS-232) HIGH Both
Missing/Broken None.
Why it matters Drawer opening is a core register action; currently no way to open it except OS print.
Change Drawer-through-printer: send ESC p 0 19 FA  (pin 2) or ESC p 1 19 FA  (pin 5) on the
same transport as the receipt. Standalone RS-232 drawer: DTR pulse via serialport. Auto-
open on settled cash sale (configurable), manual button, and open-log to audit.
Dependencies 2.2 printer transports; 1.3 shifts.
Test Settle cash sale → drawer opens; manual open works; audit records each open; pin 2 vs pin 5
config works on both drawer types.
2.4 Digital scale integration (Serial/COM + USB-HID + network) HIGH Both
Missing/Broken None. Weight-based items can't be sold by scale.
Why it matters Produce/butchery retail sells by weight; manual entry is slow and error-prone.
Change ScaleService  (shared parser): configurable baud (2400/9600), parity (7E1/8N1), stream vs
poll ("W"+CR). Parse weight regex, read stability/zero/net bits, 300ms debounce before
accepting. Transports: desktop node-serialport /node-hid ; Android OTG react-native-
usb-serialport /HID; network scales via TCP/UDP. Auto-fill sale quantity with unit
conversion (g → base unit) + tare; status indicator in Register.
Dependencies 1.2 unit conversions; 4.3 device config.
Test Place 1.25 kg item; stable weight auto-fills 1.25 kg; put item down mid-count → weight
rejected until re-stable; tare works.
2.5 Peripheral Device Manager & diagnostics HIGH Both
Missing/Broken No device inventory, connection state, or diagnostics UI.
Why it matters A dead printer at peak time with no visibility costs sales; diagnosis must be self-service.
Change Settings → Devices: list configured printers/drawers/scanners/scales with status
(Online/Offline/Error), reconnect/backoff, test-page buttons, and a health event log;
unsupported device auto-detection on Desktop (enumerate COM + USB).
Dependencies 2.1–2.4 transports; 4.3 device config table.
Test Unplug printer → status flips Offline within 5s; replug → auto-reconnect; test page prints;
errors surface in UI not console.
2.6 Mobile → Desktop remote printing over LAN HIGH Mobile + Desktop
Missing/Broken Mobile cannot print to the shop's thermal printer; it only shares PDFs.
Why it matters A phone register must print receipts to the same printer the desktop uses.
Change Add a "Print via Hub" transport: mobile sends a rendered receipt job to the Desktop hub
over LAN (WebSocket/HTTP, authenticated by device key); hub prints via its own 2.2
transport. Works offline on LAN and also via the Internet relay in Phase 3.
Dependencies Phase 3 hub; 2.2 desktop transports.
Test Sell on phone with hub on LAN → receipt prints on desktop printer; queue prints when hub
briefly disconnected and flush on reconnect.
2.7 QR-code workflows (scanner + generator) MEDIUM Both
Missing/Broken No QR generation or scan handling beyond camera-free HID scanners.
Why it matters QR loyalty, item QR labels, and receipts-with-QR (tax) are now standard.
Change Generate QR for items (printable shelf labels) and receipts (receipt ID/URL); Mobile camera
scan via expo-camera  + expo-barcode-scanner ; route scanned data to search/pay-by-QR.
Dependencies 2.1 scanner path; 2.2 label printing.
Test Print item QR label; scan with phone camera → item added to cart; receipt QR encodes valid
receipt reference.
2.8 Fiscal/ETRS-ready receipt hooks (future Ethiopia e-tax) LOW Both
Missing/Broken No integration point for ETRS/fiscal device signing.
Why it matters Ethiopia is rolling out mandatory fiscalization; the schema must not block it.
Change Receipt serializer keeps a stable JSON contract + digital signature field; add
fiscal_number /signature  columns; keep a pluggable fiscal adapter interface.
Dependencies 2.2 renderer; 4.3 schema.
Test Signed receipt round-trips; adapter stub rejects unsigned receipts when fiscal mode on.
2.9 Shelf/barcode label printing (ESC/POS GS k  + QR) MEDIUM Both
Missing/Broken No label printing; price tags/shelf labels are still written by hand.
Why it matters Self-printed labels enable the barcode workflow (2.1) and reduce price errors.
Change Label renderer (e.g., 58×40mm) with GS k  barcode (EAN-13/CODE128), price, name, QR
(item ID); batch select items → print N copies; test page in Device Manager.
Dependencies 2.1 SKU/barcode column; 2.2 transports; 2.7 QR.
Test Print 5 labels for an item; scan one back into the cart → correct item resolves.
2.10 Customer pole/customer-facing display LOW Desktop
Missing/Broken No customer-facing display support.
Why it matters Pole displays show item + total to the customer and build trust at the counter.
Change ESC/POS display commands over serial (e.g., ESC DS -style or vendor VFD command sets) or
a second browser window as an on-screen customer display driven by the cart state; shows
each line + running total.
Dependencies 1.1 register; 2.2 serial transport.
Test Add items → display updates line-by-line; final total shows after settle; clear after receipt.
Phase 3 — Offline-First Synchronization
Local-first SQLite on every device, Desktop as the LAN hub, optional Internet cloud relay, with conflict-safe
replication.
3.1 Shared canonical schema + UUID identity + tombstone columns CRITICAL Both
Missing/Broken Desktop and Mobile schemas have drifted (Desktop: multi-business, employees, orders,
audit; Mobile: budgets, subscriptions; orders stored in sales  with orderNumber ). All PKs
are local autoincrement ints. Desktop has uuid/updated_at/is_synced/is_deleted  on 7
tables but never uses them; Mobile has none.
Why it matters Sync is impossible with colliding integer IDs and divergent columns.
Change One canonical schema (business-scoped). Add to every shared table: id TEXT PK (uuid
v4)  (keep int local_id  for local FKs), device_id , row_version INTEGER , updated_at
TEXT (ISO-8601 UTC) , deleted_at TEXT NULL . Add PRAGMA user_version  migration
runner (mobile already patterns this in db.ts ); backfill existing rows with generated UUIDs.
Dependencies Phase 0 items done; freeze feature scope while migrating.
Test Migration on existing DBs (Desktop + Mobile) preserves all rows; UUID uniqueness across
two seeded devices; user_version  matches.
3.2 Outbox / change-log capture on every mutation CRITICAL Both
Missing/Broken Writes happen all over (ipc-handlers.ts , db.ts ) with no capture point.
Why it matters Sync requires every mutation to be captured exactly once, including from batch operations
and edits.
Change Add sync_outbox  (seq AUTOINCREMENT, device_id, entity, entity_uuid, op
INSERT/UPDATE/DELETE, payload JSON, status) + sync_log  (hub replica) + sync_cursor
(per device). Write via explicit pushOutbox()  in a thin write layer plus defensive SQLite
triggers on shared tables (Desktop). Snapshot full row in payload.
Dependencies 3.1.
Test Insert/edit/delete each shared entity → exactly one outbox row each with correct op and
payload; rollback removes the outbox row.
3.3 Desktop sync hub (WebSocket + HTTP over LAN) CRITICAL Desktop (hub) + Mobile
Missing/Broken No networking code in Desktop main at all (no ws /net  runtime deps).
Why it matters The hub is the durable master that phones sync to when on the shop's Wi-Fi.
Change Electron main embeds a ws  WebSocket + HTTP server on a configurable port (default 5757)
bound to LAN. Endpoints: GET /sync/info  (schema_version, business, device list), GET
/sync/pull?device=&since= , POST /sync/push . Advertise via bonjour-service  (mDNS) so
phones auto-discover; Settings shows hub IP/port + QR to pair.
Dependencies 3.1, 3.2; Windows firewall rules for the port.
Test Phone on same Wi-Fi discovers hub without typing IP; pull/push round-trip; kill hub mid-
push → client resumes from cursor on reconnect.
3.4 Mobile sync client (background, resumable, power-aware) CRITICAL Mobile
Missing/Broken Mobile has no sync client; connectivity.ts  only probes the Internet.
Why it matters Phones must reconcile carts, stock, and debt with the desktop even when the store's Internet
is down.
Change SyncService  runs in the foreground (expo-background-fetch / worklets where permitted):
push outbox batches (≤500 rows), pull since  cursor, apply in FK-safe order, persist cursors,
exponential backoff + jitter, resume via cursors. Pause when battery saver; never block the
register. UI: "Last synced 2m ago" + sync now button + conflict count.
Dependencies 3.1–3.3.
Test Sell offline on phone; phone finds hub; push/pull reconcile both DBs; kill network mid-sync
→ no dupes, resume works; battery drain measured < 5%/hr idle.
3.5 Conflict resolution & duplicate prevention CRITICAL Both
Missing/Broken No mechanism; integer IDs guarantee duplicates across devices.
Why it matters Double-scanning a barcode or double-selling the last unit corrupts stock and money.
Change LWW on row_version  for scalar rows; money/stock rows carry deltas (e.g.,
quantity_delta , paid_delta ) that compose; hub re-checks totalBaseQuantity >= 0
and flags violations to the sale rather than silently writing negative stock; tombstones win by
version; unique barcode enforced globally. Any conflict surfaces in a UI list with "keep mine /
keep theirs / retry".
Dependencies 3.1–3.4.
Test Two phones sell last unit simultaneously offline → one succeeds, other flagged on sync; edit
same customer name on both → LWW picks newest version; delete vs update resolved by
version.
3.6 Internet/cloud sync relay (Django backend) HIGH Backend + Desktop
Missing/Broken The existing Django API (api.ts ) handles auth/subscription/license/payment only; no data
sync.
Why it matters Multi-branch businesses and backup need cross-site aggregation when Internet exists.
Change Reuse the same outbox protocol: /api/sync/pull , /api/sync/push , JWT + per-device key
auth; Desktop hub syncs to cloud opportunistically; phones never talk to cloud directly
(keeps licensing and conflict rules central). Per-business tenant isolation.
Dependencies 3.3–3.5; backend deployment.
Test Hub online → deltas reach cloud; second hub (branch B) pulls from cloud; totals match;
offline hub buffers and flushes without dupes.
3.7 Sync integrity: checksums, idempotency, and repair HIGH Both
Missing/Broken No way to verify a client's DB matches the hub, or to repair drift.
Why it matters Silent divergence = wrong stock/money with no alarm.
Change Add a per-entity checksum to outbox payloads; hub verifies on push; a periodic
/sync/verify  returns row-count + checksum snapshots per table so a client can detect
drift and request a full re-snapshot; re-snapshot endpoint for repair. All ops idempotent by
(entity_uuid, row_version).
Dependencies 3.3–3.5.
Test Corrupt one row on phone; verify flags mismatch; re-snapshot repairs it; re-applying the
same outbox batch twice is a no-op.
3.8 Device pairing, multi-business isolation, and sync audit MEDIUM Both + Backend
Missing/Broken No device registry or pairing; desktop supports multiple businesses but sync has no tenant
scoping.
Why it matters Wrong-business sync or an unpaired phone is a data leak.
Change devices  table with pairing key (QR shown by hub, scanned by phone); all sync rows carry
businessId  + device_id ; hub rejects unknown devices; sync events written to audit log.
Dependencies 3.1, 3.3; 4.5 audit.
Test Unpaired phone can't pull; pairing QR works; second business's data never reaches business
A's hub; every sync logged.
3.9 Branch-to-branch sync (Desktop hub ↔ Desktop hub via Internet) MEDIUM
Desktop + Backend
Missing/Broken Sync is designed as one hub per shop; multi-branch groups have no way to share
sales/catalog between branches.
Why it matters Groups running several shops need consolidated reporting and shared price lists.
Change Hubs sync to the cloud relay (3.6) under a tenant; catalog/price-list/personnel changes
replicate across hubs while sales remain branch-tagged. Star topology: hub A → cloud →
hub B. Same outbox protocol and conflict rules.
Dependencies 3.6 relay; 3.8 tenant isolation; 3.5 conflict rules.
Test Edit price on hub A → appears on hub B; sale on B → appears on A reports with branch
attribution; no double-count in consolidated P&L.
3.10 Sync admin dashboard & health monitoring MEDIUM Desktop
Missing/Broken No visibility into sync queues, pending outbox size, or which devices are stale.
Why it matters A silently stale phone (crashed app, never opened) causes surprises at end-of-day.
Change Hub Settings tab: device list with last-synced, pending outbox counts per device, conflict log,
drift-verify results, and per-device "sync now" / "re-snapshot" buttons; alert banner when a
paired device is >24h stale.
Dependencies 3.4, 3.7, 3.8.
Test Leave a phone offline 25h → stale alert fires; re-snapshot brings it in sync; conflict list
renders with resolve actions.
Phase 4 — Advanced Commercial Features
Reporting, audit, subscription, backup, and workflow depth that separates a POS from a tracker.
4.1 Advanced reporting suite (P&L, margins, aging, product, sales-by-...) HIGH Both
Missing/Broken Reports exist (Sales Performance, Stock Valuation, Expense, P&L, Catalog) but no sales-by-
hour/cashier/register drill-down, margin-by-item, inventory aging, supplier aging, or export
of dashboard KPIs.
Why it matters Owners make buying/pricing decisions from these; drill-downs are expected in premium
POS.
Change Add report views (SQL in one analytics module, shared semantics): Gross margin by item
(uses costAtTimeOfSale  — already captured), sales by cashier/register/hour, debt aging
buckets, slow/fast movers, stock valuation by warehouse, supplier spend; all exportable to
CSV/PDF and to X/Z context.
Dependencies 1.3 shifts (cashier/register dimension); 4.3 schema.
Test Seed known dataset; assert report totals match manual calculation; export PDF/CSV opens
correctly in Excel.
4.2 Automated backup & recovery (scheduled, offsite, verified) HIGH Both + Backend
Missing/Broken Desktop has manual backup via VACUUM INTO  and restore (with the Phase 0 risk). Mobile
has manual export/import only.
Why it matters A crashed register or lost phone without a recent backup is unrecoverable revenue history.
Change Scheduled backups (daily at close-of-day default), retention policy (keep last N), integrity-
check each backup, optional encrypted upload to the cloud relay or a configured folder/S3.
Mobile auto-backup to cloud when on Wi-Fi + charging. Restore wizard on both.
Dependencies 0.7 restore fix; 0.6 encryption; 3.6 relay.
Test Schedule daily backup; delete a row; restore; verify row back and integrity_check passes;
simulate disk-full → alert, not silent failure.
4.3 Full audit trail with tamper evidence HIGH Both
Missing/Broken Desktop has audit_logs  with reversal; Mobile has no audit table at all —
voids/edits/deletes are untracked.
Why it matters Regulatory and fraud context require a full, immutable trail on every device.
Change Add audit_logs  to Mobile mirroring Desktop (entity, action, old/new values, user, device,
timestamp); write from the shared write layer; chain hashes (prev_hash) for tamper-evidence;
sync audit rows to hub.
Dependencies 3.1 (shared schema), 1.5 (users).
Test Void/edit/delete on both apps → audit rows appear with correct actor; tampering with an
old row breaks the chain and is flagged.
4.4 Server-verified subscription/licensing with offline grace HIGH Both + Backend
Missing/Broken Licensing is enforced client-side in JS (postAuthRouter.ts , PremiumRoute ) — trivially
bypassable. Desktop gates are route-only too. No signed license or offline grace.
Why it matters A premium/commercial product's revenue depends on enforceable licensing; offline shops
must not be locked out by flaky Internet.
Change Issue short-lived signed license tokens (JWT-like, HMAC/Ed25519-signed) covering plan +
expiry + device count; app caches a lease (e.g., 14 days) usable fully offline; feature flags
come from the token; server can revoke. Desktop uses the same license module as Mobile.
Locked features show upgrade CTAs, not crashes.
Dependencies Backend key mgmt; 4.3 schema for cached lease.
Test Expire license offline → app runs on cached lease; tamper with lease → feature lock; revoke
on server → lockout within grace period.
4.5 VAT/TOT reports for ERCA filing MEDIUM Both
Missing/Broken No VAT payable/input summary report.
Why it matters Monthly VAT filing needs output VAT, input VAT, exempt totals by period.
Change Report from sales (output) + expenses/supplier purchases (input) per tax type; export the
ERCA-compatible layout.
Dependencies 1.8 tax engine; 4.1 reports.
Test VAT payable for a period equals sum of per-line output tax; totals match ERCA columns.
4.6 Sales order / quotation lifecycle (quote → order → invoice → fulfillment) MEDIUM
Both
Missing/Broken Orders exist but live in different shapes (dedicated orders  table on Desktop; sales  +
orderNumber  on Mobile) and have no quote/fulfillment states.
Why it matters B2B sales need quotes that become orders and invoices with fulfillment tracking.
Change Unify into the canonical schema: orders  with status flow quote → confirmed → invoiced →
fulfilled/cancelled; convert-to-sale preserves references; order history timestamps (Desktop
has order_history ).
Dependencies 3.1 schema unification.
Test Create quote, confirm, invoice, partially fulfill; statuses and timestamps correct; converts to
sale on both platforms identically.
4.7 Multi-branch / multi-business mode on Mobile MEDIUM Mobile
Missing/Broken Desktop is multi-business; Mobile is single-business with a warehouse selector only.
Why it matters Groups run multiple businesses/branches; the same phone may manage several.
Change Add businessId  to Mobile shared tables; business switcher in Settings; sync scopes rows
by business (3.8).
Dependencies 3.1, 3.8.
Test Switch business on mobile; inventory/sales isolated; sync only touches the active business's
rows.
4.8 Supplier purchasing, price tracking, and reorder automation MEDIUM Both
Missing/Broken Supplier modules exist and are rich on Desktop; reorder suggestions exist; but no automatic
PO generation from reorder level + suggested qty (EOQ), and no price-history charting.
Why it matters Automating replenishment reduces stockouts and manual work.
Change Reorder-point + reorder-qty per item; "Generate POs" screen batches suggested orders;
supplier price history captured on every PO/price-check (desktop already records
supplier_price_checks ).
Dependencies 1.10 PO/receiving; 4.1 reports.
Test Set reorder point; sell below → item appears in PO builder with suggested qty; PO creation
updates open qty.
4.9 Expense budgets, approvals, and commitment tracking LOW Both
Missing/Broken Budgets exist on both; no pre-approval for expenses over a threshold, no encumbrance
(commitment) tracking.
Why it matters Spend control reduces waste in growing businesses.
Change Expense approval workflow with manager PIN above threshold; planned/committed/spent
view per budget category.
Dependencies 1.5 roles; 4.5 audit.
Test Expense over threshold without approval → held in pending; approval posts it and updates
budget rings.
4.10 Data import/export hardening (12-module CSV + DB) MEDIUM Both
Missing/Broken CSV import exists (12 modules, validation) but doesn't integrate with sync (imported rows
aren't outboxed) and has no rollback on partial failure.
Why it matters Mass migration is a common onboarding step; half-applied imports corrupt data.
Change Wrap each import in one transaction; route through the write layer so imports produce sync
outbox rows; preview + duplicate detection (mobile already has); dry-run mode.
Dependencies 3.2 outbox write layer.
Test Import with one bad row → entire import rolls back with clear error; successful import
appears on hub after sync.
4.11 Customer communication: receipts & statements via WhatsApp/Email MEDIUM
Both + Backend
Missing/Broken whatsappService.ts  and emailService.ts  exist but are stubs (// TODO: integrate with
WhatsApp Business API  / future feature ) that only log. Debt reminders, receipts, and
statements can't reach customers.
Why it matters Ethiopian SMEs collect debt faster with a WhatsApp reminder; paperless receipts are
expected.
Change Route sends through the cloud relay (Django) using WhatsApp Business API + SMTP; offline-
safe queue (persist send attempts, retry on connectivity); templates for receipt, invoice,
statement, debt reminder, low-stock (already stubbed). Respect quiet hours.
Dependencies 3.6 relay; 4.5 audit (log sends); 4.3 schema for send-log.
Test Sell to a customer with phone → WhatsApp receipt delivered; overdue debt triggers
reminder; offline → queued and delivered when online; send-log audited.
4.12 Gift cards & store credit LOW Both
Missing/Broken No prepaid value product; refunds can only return cash/back to original method.
Why it matters Store credit is the standard alternative when cash refunds are undesirable.
Change gift_cards  (code, balance, expiry, status) usable as a payment method; returns can issue
store credit; redemption and top-up logged; syncs as an entity.
Dependencies 1.14 payment methods; 4.3 schema; 3.5 money-delta rules.
Test Issue 200 ETB gift card; sell item, pay by card → balance 0 and two devices stay consistent;
redeem attempt over balance rejected.
4.13 Accounting export (GL journal to Excel/CSV) LOW Both
Missing/Broken Reports exist but no double-entry style journal export that an accountant (or local
bookkeeper) can import.
Why it matters Businesses hand ledgers to accountants monthly; a clean export wins trust.
Change Journal export per period: date, reference, account (Sales, Cash, VAT Output, Debtors, Cost of
Sales, Expenses), debit/credit amounts; deterministic ordering; Excel/CSV/PDF. Optional one-
way accounting-software integration later.
Dependencies 4.1 reports; 5.2 money.
Test A month's journal balances to zero (debits=credits); matches P&L numbers.
Phase 5 — Architecture, Security & Code Quality
5.1 Refactor Desktop monolith (ipc-handlers.ts  ~6,000 lines) HIGH Desktop
Missing/Broken All business logic lives in one file: raw SQL, validation, auth, and audit inlined per handler;
duplicated sale/return logic.
Why it matters Sync, hardware, and tax changes become unmaintainable and bug-prone without
boundaries.
Change Split into services/  (sales, inventory, expenses, customers, suppliers, analytics, sync,
devices, tax) over a repository layer; IPC handlers become thin adapters; extract shared
cross-platform domain module (1.2).
Dependencies Phase 0 fixes first (permission bugs); adopt while adding 3.2.
Test Full regression of every IPC channel after split (existing test-results/scripts); route each
domain to its module and compare outputs.
5.2 Money handling: integer minor-units + decimal arithmetic everywhere HIGH Both
Missing/Broken Currency stored as REAL; floats accumulate rounding error in VAT/discount chains; rounding
rules inconsistent.
Why it matters ETB totals must round identically across devices or sync reconciles to pennies.
Change Store amounts as INTEGER cents (ETB ×100) in new columns or at the domain layer; a single
money  util with banker's/standard rounding config (EITHER match ERCA convention); round
once per line and once at total.
Dependencies 1.2 cart model; 1.8 tax.
Test 10,000 random carts: float vs integer engine differ by 0 exactly or ≤0.01 with documented
rule; both apps identical.
5.3 Central time handling (UTC storage, tz-aware display, Ethiopian time) MEDIUM Both
Missing/Broken createdAt DEFAULT CURRENT_TIMESTAMP  is UTC but stored/parsed as local text in many
places; Ethiopian-time conversion scattered.
Why it matters Reports by "today" and sync ordering break across time zones and after the app restarts.
Change Store ISO-8601 UTC in sync-safe  columns; one dateTime  module for device vs Ethiopian
time display; "today" queries use the business timezone (Africa/Addis_Ababa default).
Dependencies 3.1 schema.
Test Set device to UTC+14; sale at 11 PM local → "today" report includes it; Ethiopian-time
display shows correct 12-hour mapping.
5.4 Secrets management & config via environment/EAS, not source HIGH Both + Backend
Missing/Broken GitHub token in app.json ; API_BASE_URL  hard-coded with fallback to a public Render
URL.
Why it matters Secrets in source = instant compromise and rebuild churn per environment.
Change Move to EXPO_PUBLIC_* /EAS secrets and CI secrets; inject at build; delete secrets from git
history (filter-branch / BFG).
Dependencies CI setup.
Grep release build for secrets (empty); builds with env-only config succeed.
5.5 Crash reporting, structured logging, and telemetry MEDIUM Both
Missing/Broken Desktop only console.error ; mobile has a global ErrorUtils  handler that logs to
console; no persistent logs or upload.
Why it matters Field issues are invisible; support can't diagnose without the device.
Change Structured JSON logs (rotating files on Desktop, DB table on Mobile); opt-in encrypted
telemetry: crashes, sync failures, device diagnostics, slow queries. Send to the cloud relay
(3.6) respecting consent.
Dependencies 3.6 relay endpoint.
Test Force a crash → diagnostic packet recorded and uploads when online; logs rotate and don't
grow unbounded.
5.6 Database indexes & query performance review MEDIUM Both
Missing/Broken Some lists filter by LIKE %...%  on unindexed text columns and sort full tables; dashboards
run many aggregate queries.
Why it matters At 50k+ sales the register and dashboard slow down visibly.
Change Index high-cardinality filtered columns (businessId +createdAt , paymentStatus ,
dueDate , categoryId , supplierId , sku , updated_at ); paginate (desktop already
LIMITs); add date-partitioned summary tables for dashboard KPIs.
Dependencies 3.1 migration (indexes via migration).
Test Seed 100k sales; dashboard and ledger respond < 300ms; EXPLAIN QUERY PLAN  shows
index usage.
5.7 Type safety: shared contracts, stricter TS config MEDIUM Both
Missing/Broken IPC payloads are any ; preload types partially duplicated; mobile db functions return
any[] .
Why it matters Mismatched payloads silently corrupt data across the IPC/sync boundary.
Change Shared TS types package (entities, DTOs) consumed by both apps; zod  validation at IPC +
sync boundaries (desktop already uses zod); enforce strict + noUncheckedIndexedAccess.
Dependencies Adopt with 3.1/5.1.
Test Typecheck passes on both; a payload with an unexpected field fails validation instead of
inserting garbage.
5.8 Code quality: dedupe logic, lint gates, unit tests MEDIUM Both
Missing/Broken Duplicated sale/return math (desktop insert-sale  vs insert-sales-batch ), throwaway
migration scripts scattered at repo roots, no CI.
Why it matters Duplicated logic is where sync/tax bugs hide.
Change Consolidate write paths; clean root scripts; add CI (GitHub Actions) running typecheck + lint
+ tests on both apps; enforce via lint rules.
Dependencies 5.1 refactor.
Test PR runs CI green; mutation of shared math caught by unit tests.
5.9 Backend API hardening (tenant isolation, idempotency, rate limits) MEDIUM Backend
Missing/Broken The Django API is auth/subscription focused; adding sync (3.6) without hardening invites
cross-tenant reads and duplicate writes.
Why it matters POS data is the most sensitive the business owns; API flaws leak everything.
Change Every query scoped by tenant (business_id) server-side, never client-supplied; idempotency
keys on push; per-tenant and per-IP rate limits (client already handles 429 via
RateLimitError ); audit of admin actions; TLS-only; secrets in env (5.4).
Dependencies 3.6; 5.4.
Test Tenant A token can't read tenant B rows (enumeration test); double push with same
idempotency key applies once; flood triggers 429 with Retry-After honored by the client.
Phase 6 — UX, Localization, Performance & Polish
6.1 Complete and consistent localization (4 languages, all new strings) HIGH Both
Missing/Broken Huge translation key files exist but many new features/strings are English-only; extraction is
done via scripts; no central sync of keys (there are dozens of missing-*.txt /batch files).
Why it matters Amharic/Oromo/Tigrinya users abandon mixed-language screens.
Change CI check: every key present in all 4 locales (fail on missing); one i18n pipeline for both apps;
translate all new feature strings (Phases 1–4).
Dependencies None.
Test Key-coverage check passes; smoke-switch all 4 languages on both apps; screenshots
reviewed for overflow.
6.2 Offline-first UX: sync status, queue indicators, no blocking modals MEDIUM Mobile
Missing/Broken Connectivity exists only to block network actions; sales screens are unaffected (good) but
there's no visible sync state or "pending to send" indicator.
Why it matters Staff must trust that an offline sale will reach the register.
Change Sync status pill (Online/LAN/Offline + pending count), non-blocking toasts on push/pull,
"last synced" timestamps, and a sync history screen.
Dependencies Phase 3 client.
Test Offline sale shows pending badge; badge clears after hub sync; no modal ever blocks
checkout.
6.3 Touch-friendly register layout, accessibility, and keyboard shortcuts MEDIUM Desktop
Missing/Broken Desktop UI is dense/click-first; no large-button touch mode, no focus states, no keyboard
map.
Why it matters Registers are often touch screens; accessibility matters for staff.
Change Register layout with ≥ 48px targets, high-contrast themes, audible scan feedback, and
documented keyboard shortcuts (F2 search, F4 pay, F1 help).
Dependencies 1.1 register.
Operate the register with keyboard only and with touch only; each core flow completes.
6.4 Loading, caching, and skeleton polish (big lists, charts) LOW Both
Missing/Broken Mobile already uses FlashList + skeletons; desktop re-fetches large lists on every navigation.
Why it matters Snappy navigation reads as professional.
Change Desktop: React Query-style caching/invalidation for list queries; virtualize long tables; keep
chart libs but add data-preload on register idle.
Dependencies 5.1 services layer.
Test Navigate between pages with 20k items; no visible skeleton flicker after warm-up; memory
stable over an hour.
6.5 Notifications & reminders reliability (push vs local) LOW Mobile
Missing/Broken Notifications are local-only (expo-notifications  scheduled); no remote push; quiet hours
exist.
Why it matters Debt/expiry alerts should reach the owner even when the app isn't open.
Change Optional remote push via Expo Push / FCM tokens registered with the relay; alert generation
runs server-side from synced data.
Dependencies 3.6 relay.
Test Force-close app; trigger an overdue-debt alert; push arrives; quiet hours suppress it.
6.6 Onboarding & training mode for new cashiers LOW Both
Missing/Broken Desktop has a 6-step onboarding wizard and tutorials; mobile has onboarding + tutorials.
No sandbox/demo mode.
Why it matters Training on live data is dangerous.
Change Demo mode with a separate DB + seed data + reset button; per-role tutorial toggles.
Dependencies None.
Test Enter demo mode, run full sale/void/refund, reset — live data untouched.
Phase 7 — Testing, QA & Release Readiness
7.1 Unit & integration test suite for the money/tax/cart engine HIGH Both
Missing/Broken No shared engine; test-results/  exists on desktop; mobile has __tests__/ . No coverage
of the core math.
Why it matters Tax/cash math is the most error-prone and expensive to get wrong.
Change Property/table-driven tests: cart totals, VAT/TOT, rounding, change, discount caps, stock
guards, return math, shift variance, sync merge.
Dependencies 1.2, 1.8, 5.2.
Test Run in CI on every PR; target ≥ 90% on money module.
7.2 E2E hardware test matrix HIGH Both
Missing/Broken No hardware lab or automated printer/scanner/scale checks.
Why it matters Field failures are the top support cost.
Change Maintain a hardware matrix (Epson/Star/Bixolon printers over USB/COM/TCP/BT, drawer
models, Zebra/Honeywell scanners wedge+serial, 2 scale models) with a scripted smoke test
per device on both apps.
Dependencies Phase 2.
Test Each matrix row passes: print, cut, drawer open, scan-into-cart, weight-into-qty.
7.3 Offline/sync failure chaos tests HIGH Both
Missing/Broken No failure-mode testing today.
Why it matters Sync must be safe under power loss, mid-write crashes, and network flaps.
Change Chaos suite: kill app mid-sale, mid-sync, mid-restore; disconnect LAN mid-push; run two
devices on last unit; restore stale backup while syncing; verify invariants (no negative stock,
no duplicate sales, money reconciles).
Dependencies Phase 3.
Test All chaos scenarios leave DBs consistent and reported to the user.
7.4 Security audit & penetration pass HIGH Both + Backend
Missing/Broken No audit performed; known issues already listed (0.1, 0.2, 0.6, 5.4).
Why it matters POS handles cash + PII; a breach destroys trust.
Change OAuth/rate-limiting review of API (429 handling exists — verify), JWT refresh rotation (exists
— verify), device pairing security, backup encryption, dependency CVE scan in CI (npm
audit /osv-scanner ), Electron security settings review.
Dependencies Phase 0 + 3.
Test Pen-test findings closed; dependency scan clean or documented exceptions.
7.5 Release pipeline (signed installers, EAS, staged rollouts) MEDIUM Both + Backend
Missing/Broken electron-builder NSIS configured with signAndEditExecutable: false  (unsigned); mobile
uses EAS + expo-updates with GitHub token (fixed in 0.1). No staged rollout or rollback
procedure.
Why it matters Windows SmartScreen blocks unsigned installers; no rollback = production outages.
Change Code-sign Windows builds (EV cert) + auto-update channel; EAS staged updates; versioned
schema with safe-downgrade guard (schema_version mismatch prevents app downgrade
with newer DB).
Dependencies Cert purchase, CI.
Test Install signed installer on clean Windows 10/11 without warnings; staged update rolls to 5%
then 100%; downgrade blocked safely.
7.6 Performance budget & soak test LOW Both
Missing/Broken No defined performance budgets.
Why it matters Registers must never feel slow at peak.
Change Budgets: cold start < 5s, checkout settle < 1s, dashboard < 300ms, sync batch < 2s. 24h soak
with continuous sales + sync; memory/CPU/disk growth tracked.
Dependencies 5.6 performance work.
Test Soak run passes budgets; disk growth bounded (WAL checkpointing + log rotation).
7.7 Documentation & support readiness LOW Both + Backend
Missing/Broken Feature docs are drifting (SDK version mismatch already noted); no admin/ops/cashier
manuals.
Why it matters Reseller/in-store adoption depends on clear manuals.
Change Regenerate product docs from code; write cashier quick-start, manager guide, hardware
setup guide, and troubleshooting; in-app help links.
Dependencies Phase 2 & 3 features stable.
Test A new cashier can open a shift, sell, and close Z-report following only the manual.
Implementation Roadmap (Sequenced)
Sprint 1 — Foundations (Weeks 1–2) · Critical
Security + data-integrity + architecture plumbing. No features until these land.
0.1 Revoke & remove GitHub token; 0.6 secret/config hygiene (5.4).
0.2 Fix permanent lockout; 0.5 fix sales/debt read permissions.
0.3 Mobile stock guard; 0.4 mobile category filter; 0.7 backup/restore safety.
3.1 Canonical schema + UUID/tombstone migration (both apps) — the foundation everything else builds
on.
5.1 Begin Desktop service-layer refactor (extract domains in sync with 3.1).
7.4 Security audit kickoff; 5.4 CVE scanning in CI.
Sprint 2 — POS Core (Weeks 3–6) · High
Checkout speed, roles, tax, shifts, and inventory depth on top of the unified schema.
1.2 Shared cart/checkout domain; 5.2 integer money; 5.3 central time.
1.8 Ethiopian tax engine (VAT/TOT, TIN receipts, ERCA report 4.5).
1.1 Desktop Register screen; 6.3 touch + keyboard ergonomics.
1.3 Shifts + X/Z; 1.4 Registers; 1.6 returns/voids with approvals; 1.7 price override caps.
1.5 Mobile users/roles; 1.10 PO→receiving + batches/expiry; 1.11 stocktakes.
4.3 Audit on Mobile; 4.1 advanced reports; 4.6 order lifecycle unification.
3.2 Outbox capture (wired through the new write layer).
Sprint 3 — Peripherals (Weeks 7–10) · High
All hardware on both platforms, driven by a common device layer.
2.1 Barcode (HID wedge + serial + USB-HID) + sku  column.
2.2 ESC/POS raster printer driver + transports (USB/COM/TCP/BT/AirPrint).
2.3 Cash drawer kick; 2.4 Scales; 2.5 Device Manager & diagnostics.
2.6 Mobile→Desktop remote printing; 2.7 QR workflows.
7.2 Hardware test matrix. (Requires Expo prebuild/dev-client builds; desktop native rebuilds.)
Sprint 4 — Synchronization (Weeks 11–14) · Critical
Offline-first replication end-to-end; the defining premium feature.
3.3 Desktop hub (ws/HTTP + mDNS); 3.4 Mobile client (resumable, background).
3.5 Conflict resolution + delta composition + duplicate prevention.
3.7 Integrity checksums + repair; 3.8 device pairing + multi-business isolation.
3.6 Cloud relay on Django; 6.2 offline-first UX (sync status, pending badge).
7.3 Chaos test suite for sync.
Sprint 5 — Advanced & Commercial (Weeks 15–18) · Mixed
4.4 Server-verified licensing with offline grace (monetization gate).
4.2 Scheduled verified backups (offsite). 4.8 reorder automation; 1.9 loyalty; 1.12 layaway.
4.9 expense approvals; 4.7 multi-business on mobile; 4.10 import/export hardening.
2.8 Fiscal-ready hooks; 6.1 full 4-language coverage of all new strings.
Sprint 6 — Polish, QA & Release (Weeks 19–22) · Quality
5.6 indexes/perf; 6.4 caching; 6.5 remote push; 6.6 demo mode; 5.5 telemetry.
7.1 unit/integration coverage of money engine; 7.6 soak + performance budgets.
7.5 signed installers + staged updates + safe downgrade.
7.7 Manuals/docs regen; final security re-pass; pilot deployment in a live shop before wide rollout.
Appendix A — Priority Legend & Testing Conventions
Priority Meaning Gate
CRITICAL Security/data-integrity; blocks production or is a known
revenue/loss/legal risk
Must ship before any pilot
HIGH Core POS parity or user-facing commercial requirement Required for premium
positioning
MEDIUM Competitive differentiation / operational depth Ship in Phase 4–5
LOW Polish, convenience, or future-proofing When core is stable
App legend. Desktop  = Electron (Windows). Mobile  = Expo/React Native (Android/iOS). Backend  =
existing Django REST API. Both  = shared logic/schema change required in both apps.
Testing convention. Every item above lists explicit acceptance checks. Where hardware is involved, verify against
the physical device matrix (7.2) on both platforms. Where sync is involved, always add a failure-mode case (7.3):
network cut mid-operation, process kill, stale backup restore. Where money is involved (7.1), assert identical results
on Desktop and Mobile from the shared engine, not just one platform.
Appendix B — ESC/POS Command Reference
ESC/POS is a byte protocol. ESC  = 0x1B, GS  = 0x1D, FS  = 0x1C. All commands below are the minimum
required to drive thermal printers, drawers, and pole displays.
Command Bytes Purpose
Initialize printer 1B 40 Reset to power-on defaults; send first
Line feed 0A Advance one line
Print & feed n lines 1B 64 n Feed n (1–255) lines after content
Feed & cut (partial) 1D 56 42 00 Partial cut (tear bar). Full cut: 1D 56 41 00
Align text 1B 61 n n=0 left, 1 center, 2 right
Bold on/off 1B 45 n n=1 on, 0 off (some printers: 1B 21 n )
Character size 1D 21 n n bits 0–2 height, 4–6 width multiplier
Select code page 1B 74 n n = code page (see notes; Ethiopic unsupported → use
raster)
Horizontal tab 1B 44 n1..nk 00 Set tab stops for column alignment
Print barcode 1D 6B m n d1..dn m = symbology (see D), n = length, d = data
Print QR code 1D 28 6B ... GS ( k model/size/error-correction/data sequence
Open cash drawer (pin
2)
1B 70 00 t1 t2 t1/t2 = pulse on-time/off-time in 2 ms units
Open cash drawer (pin
5)
1B 70 01 t1 t2 Same, second connector pin
Raster image 1D 76 30 00 xL xH yL yH
d1..dN
Print bitmap raster; the way to render Ethiopic
Bitmap (legacy) 1D 2A m xL xH d1..dN Older GS *  bitmap; some 58 mm printers only
Set thermal density 1D 28 45 n m t … Heat/contrast tuning for light prints
Raster rendering flow (recommended for Shega)
Build the receipt in a 384 px-wide (80 mm @ 203 DPI ≈ 576 dots) or 384-dot canvas; render text with the
Ethiopic-capable font (Noto Sans Ethiopic); convert to 1-bit per-pixel rows.
Emit ESC @ , then for each band of rows: GS v 0 xL xH yL yH <rows> , then ESC d 4 , then cut GS V B .
Fallback for tiny 58 mm printers: render at 384 dots and let the printer scale, or add a 58 mm layout
profile.
Ethiopic note. Retail printers do not contain Ethiopic glyphs and code-page switching (ESC t ) cannot fix that.
Sending text bytes for Amharic/Oromo/Tigrinya will print garbage. Always render receipts to a raster image in
the app. This is why receipt rendering lives in the shared JS layer, not in the printer driver.
Appendix C — Cash Drawer Wiring & RJ11 Pinout
RJ11 (6P4C) drawer cable from the printer: pin 2 = drawer pin 2 (power/signal), pin 5 = drawer pin 5
(second drawer), pins 3–4 = 24 V, others unused. Always power-cycle the printer when changing drawer
wiring.
Kick command. ESC p m t1 t2 : m=0 (48) opens connector A (pin 2), m=1 (49) opens connector B (pin 5).
t1 = pulse ON (2 ms units; 19 → 38 ms typical), t2 = pulse OFF (255 → 510 ms typical). Recommend 1B 70
00 19 FA .
Standalone RS-232 drawer: no ESC/POS — toggle DTR high for ~100 ms. Desktop: serialport.set({
dtr: true })  then false. Android OTG: react-native-usb-serialport  DTR API.
Logic: never kick on debt/void; kick only after a successful cash settlement (configurable), and log every
kick (time, register, cashier) to audit.
Appendix D — Barcode Symbologies & Scanner Setup
Symbology Use Notes
EAN-13 Retail consumer products Default; store full 13 digits
UPC-A North-American retail Convert/store as-is
EAN-8 Small packages Rare
Code 128 SKU / internal labels Best for internal item codes
QR Loyalty, receipts, shelf labels 2D; not all laser scanners read it
Scanner modes. (a) HID keyboard wedge — types the code + Enter; app must capture global input,
buffer printable chars, commit on the configured terminator (CR/LF), and debounce ~150 ms. (b) Serial —
ASCII line at 9600 baud (typical), terminator CR/LF, optional prefix/suffix from scanner setup guide. (c)
USB-HID raw — read HID key/report bytes directly.
Uniqueness: enforce one sku /barcode  per business at write time and during sync merge (3.5) so two
products never share a code.
Lookup path: barcode → exact match; on miss show "not found" with quick add-product; on duplicate
(shouldn't exist) surface an admin error.
Appendix E — Sync Protocol Message Contracts
Versioned, resumable, idempotent. All times ISO-8601 UTC. Base URL for LAN: ws://<hub-ip>:5757  /
http://<hub-ip>:5757 .
1. Discovery & handshake
GET /sync/info
→ { "schema_version": 7, "business_id": "b-9f2c", "business_name": "Shega Enterprise",
    "server_time": "2026-08-16T09:12:33Z", "require_pairing": true }
// After pairing (3.8): request includes "Authorization: Bearer <device-key>"
2. Pull (client asks hub for changes)
GET /sync/pull?device=dev-7a1c&since=10421&limit=500
→ { "changes": [ { "seq": 10422, "device_id": "dev-3b9e",
      "entity": "sales", "entity_uuid": "8f2a…c1", "op": "INSERT",
      "row_version": 3, "deleted_at": null,
      "payload": { "itemId": "…", "quantity": 2, "totalPriceCents": 24500, "…" } }, … ],
    "next_seq": 10425 }
3. Push (client sends its outbox)
POST /sync/push
{ "device": "dev-7a1c", "idempotency_key": "push-20260816-0900-01",
  "outbox": [ { "entity": "sales", "entity_uuid": "…", "op": "INSERT",
                "row_version": 1, "payload": { … } } ] }
→ { "applied": [ "8f2a…c1" ], "conflicts": [ { "entity": "sales", "entity_uuid": "…",
    "reason": "stock_shortfall", "resolved_version": 2, "resolved": { "quantity": 1 } } ],
    "next_seq": 10430 }
4. Stock as deltas (never absolute)
// Sale commits on phone: payload carries quantity_delta = -2 (base), -2 (pack=0)
// Hub recomputes: if new total < 0 → conflict { reason: "stock_shortfall" } and flags the sale.
// Cash payments similarly: paid_delta so two collections on one debt compose safely.
5. Verify & repair
GET /sync/verify → per-table { table, row_count, checksum }
GET /sync/snapshot?table=sales&since=0  → full table re-snapshot for repair
Idempotency: applying the same entity_uuid +row_version  twice is a no-op. Reject out-of-order
row_version  (older than hub) per 3.5 rules.
Appendix F — Ethiopian Tax (VAT/TOT/ERCA) Checklist
VAT 15% on taxable goods/services; TOT 2% turnover tax for under-threshold businesses; exempt items
list per business config.
Tax types per item/category: VAT , TOT , Exempt ; rate stored (defaults 15 / 2), inclusive or exclusive switch.
Receipt must carry: business name + address, TIN, date/time, register/receipt serial, itemized lines with
unit price × qty, per-line tax, subtotal, VAT output, grand total, payment method.
Serialized receipt numbering: receipt_serial  per register, gap detection reported in audit (missing =
voided/skipped).
Monthly filing report: output VAT (sales), input VAT (purchases/expenses with VAT), exempt totals, net VAT
payable — export matches ERCA return layout (4.5).
Fiscalization roadmap: keep fiscal_number /signature  columns and a pluggable fiscal adapter (2.8) so an
ETRS device can be added when mandated.
Appendix G — Database Migration & Backfill Checklist
Run per-app, in order. Both apps must end at the same user_version .
1. Snapshot/backup both DBs; record PRAGMA user_version  and row counts per table for comparison.
2. Freeze schema scope; add PRAGMA user_version = N+1  migration entries using each app's runner
(mobile pattern in db.ts ; desktop in database.ts ).
3. Add sync columns to shared tables: uuid TEXT UNIQUE , device_id , row_version INTEGER DEFAULT 1 ,
updated_at TEXT , deleted_at TEXT NULL .
4. Backfill UUIDs (generate v4) for existing rows; set updated_at = createdAt .
5. Create devices , sync_outbox , sync_log , sync_cursor  (3.2), registers  (1.4), shifts /cash_moves
(1.3/1.16), batches  (1.10), audit_logs  mobile (4.3), payment_methods /gift_cards  (1.14/4.12),
price_lists  (1.15).
6. Add sku /barcode  (2.1), tax columns (1.8), money-as-cents columns or domain mapping (5.2).
7. Add indexes from 5.6 via migration (idempotent CREATE INDEX IF NOT EXISTS ).
8. Re-verify row counts and run PRAGMA integrity_check ; run the full regression suite on both apps
before enabling sync.
Appendix H — Hardware Compatibility Matrix (target)
Category Model examples Desktop transport Android
transport iOS transport
Thermal 80
mm
Epson TM-T82/T88, Star TSP650,
Bixolon SRP-350, custom TTL/ESC-
POS
USB, Serial COM, TCP
9100, WinSpool fallback
USB OTG, BT
SPP, TCP 9100
AirPrint image;
Epson ePOS SDK
Thermal 58
mm
Common Chinese 58 mm ESC/POSSerial COM, USB BT SPP, USB OTG AirPrint
Cash
drawer
Any RJ11 2-pin drawer (e.g., 24 V
two-kick)
Via printer ESC p;
standalone RS-232 DTR
Via BT/USB
printer ESC p
Via paired MFI
printer
Scanner Zebra DS2208, Honeywell 14xx,
generic 1D wedge
HID wedge, Serial, USB-
HID
HID wedge, USB
OTG serial
Camera + external
BT scanner
Scale CAS, Mettler-Toledo, Dibal, generic
RS-232
Serial COM, USB-HID USB OTG
serial/HID
Network/BT (rare)
Pole displayGeneric VFD/LCD ESC/POS or serialSerial COM + second
window
— —
Each matrix row gets a smoke-test script (7.2) executed on both platforms during release.
Appendix I — Disaster Recovery Runbook
Scenario Action Owner
Register PC dies mid-day Open same shifts on another device; sync restores stock state on
return; reconcile Z-variance vs expected.
Manager +
support
Phone lost/stolen Revoke device key (3.8); wipe remote via relay; restore from last cloud
backup (4.2); review audit for gaps.
Manager
DB corruption detected Restore last verified backup (0.7); re-snapshot from hub; log incident;
preserve corrupt file for forensics.
Support
Hub restored from stale backup
while phones newer
Do NOT sync immediately; boot hub, import recent phone outboxes
via re-push; verify checksums (3.7) before serving.
Support
Full site disaster Cloud relay holds last verified hub state; restore to a new hub; re-pair
devices.
Support +
owner
Appendix J — Security Hardening Checklist
No secrets in source, configs, or git history (0.1, 5.4); CI secret scanning enabled.
Electron: sandbox on, contextIsolation on, nodeIntegration off, webSecurity  on, disable navigation to
remote content, validate all IPC input (0.8).
SQLite files: encryption layer or documented FDE guidance; keys in OS keychain/SecureStore (0.6).
Mobile: PIN hashed with scrypt/argon2 (upgrade from SHA-256), biometrics optional, 5-attempt lockout
retained, session auto-lock on 5 min inactivity (exists), SecureStore for all secrets.
API: JWT short-lived + refresh rotation, TLS-only, tenant-scoped queries, idempotency keys, rate limits,
audit admin actions (5.9).
Sync: per-device key auth, pairing QR, tamper-evident audit chain (4.3), checksums (3.7).
Dependency CVEs: npm audit  / OSV-scanner in CI; pin/rebuild native modules per Electron ABI.
Appendix K — Performance Budgets & Benchmarks
Metric Budget Measurement
Cold start (Desktop) < 5 s Launch → register visible
Cold start (Mobile) < 4 s Splash → authenticated screen
Checkout settle < 1 s Authorize → receipt queued/printed
Dashboard render < 300 ms With 100k sales dataset
Ledger/list scroll 60 fps FlashList / virtualized table, 20k+ rows
Sync batch (500 rows) < 2 s LAN Phone→hub round trip
Backup < 60 s 1 GB DB, VACUUM INTO + integrity check
Idle battery drain (Mobile) < 5%/hr Sync service idle, screen off
Appendix L — Cashier Standard Operating Procedures
1. Open shift: select register, log in with PIN, enter opening float; system starts shift and expects cash to
reconcile.
2. Sell: scan/add items → verify cart → apply discounts within role cap → settle: select method
(Cash/Mobile/…), tender, auto change; cash auto-opens drawer; receipt prints (or queues).
3. Void/return: requires reason; over-threshold requires manager PIN; stock and money restore via the
same write layer; audit records actor.
4. Mid-shift cash drop: record drop (1.16) with reason and actor.
5. Close shift / Z-report: count drawer, enter counted cash; system computes variance vs expected
(opening + sales − drops − refunds − petty); variance outside threshold blocks close until manager
acknowledges; Z summary printed and stored.
6. Day-end: run Z per register, verify cloud/hub sync complete, verify backup (4.2) succeeded, review
exception report (voids/overrides/conflicts).
Appendix M — QA Test Matrix
Flow Cases Pass criteria
Auth Wrong PIN ×5, lockout expiry, deactivated, role gating, inactivity
re-lock
Correct lock/unlock; no permanent
deactivation (0.2)
Checkout Cash tender/change, split tender, mobile money, debt, discount
cap, override+approval, negative stock attempt
Totals match manual calc; change
exact; no negative stock (0.3)
Tax VAT-only, TOT-only, exempt, mixed cart, inclusive/exclusivePer-line and total tax correct; receipt
TIN/serial present (1.8)
Shifts/X-Z Open, sell, drop, refund, close; variance ok / over thresholdZ totals match ledger; variance math
exact (1.3/1.16)
Hardware Print/cut/drawer/scan/scale per matrix (App. H) All smoke tests green on both
platforms (2.x)
Sync Offline sale → LAN push/pull, last-unit conflict, delete vs update,
checksum drift → repair, stale phone
No dupes, no negative stock, cursors
resume, repair converges (3.x)
Backup/DRBackup, restore, corrupt-file restore, stale-backup restore + newer
phones
Integrity passes; runbook steps
execute without data loss (0.7/4.2/I)
LocalizationAll screens × 4 languages, Ge'ez calendar/time, ETB formattingNo missing keys (6.1); receipts render
Ethiopic via raster (2.2)
Perf 100k sales dataset, 24 h soak Budgets in App. K met; disk growth
bounded