## Goal
- Continue translating all remaining hardcoded English UI strings across the app into t() calls.

## Constraints & Preferences
- Use existing translation keys where available; add new keys to `translations.ts` under the correct section.
- Keep fallback strings as second argument in `t('key', 'Fallback')` calls.
- No comments about summarization.

## Progress
### Done
- Added ~300+ new translation keys to `translations.ts` across `dashboard`, `sale_detail`, `adjustments`, `expense`, `budgets`, `sales`, `pdf`, `suppliers`, `settings`, `inventory`, `employees`, `customers`, `notifications`, `nav_user`, `data_table`, `header` sections.
- Translated all remaining hardcoded strings across ~25 files: `Dashboard.tsx`, `SaleDetail.tsx`, `Adjustments.tsx`, `Expenses.tsx`, `Sales.tsx`, `Suppliers.tsx`, `Settings.tsx`, `Inventory.tsx`, `OrderDetail.tsx`, `UsersEmployees.tsx`, `Customers.tsx`, `nav-user.tsx`, `data-table.tsx`, `Header.tsx`, `NotificationSettings.tsx`.
- Fixed toast key bugs in `ReminderHistory.tsx` (lines 113, 120, 145): `edit_reminder` → `reminder_updated`, `new_reminder` → `reminder_created`, `snoozed` → `snoozed_hours`.
- Fixed toast key bug in `Contacts.tsx` (line 174): `contacts.call` → `contacts.phone_copied`.
- Added `snoozed_hours` key to `reminders` section in `translations.ts`.
- TypeScript `--noEmit` passes with zero errors.
- Added ~91 new translation keys to `translations.ts` for month abbreviations, day abbreviations, sale_success section, budget status/report keys, common utility keys, sales return keys, debt payment keys, customer group keys, dashboard trend keys, summary insight keys.
- Translated `BudgetManagement.tsx`: replaced hardcoded month abbreviations with t() calls in 4 places, added translated category names, translated 'Approved by' text, status badges, PDF title, and Ethiopian year display.
- Translated `SaleSuccessModal.tsx`: replaced all hardcoded PDF receipt text and dialog UI strings with t() calls.
- Translated `Analytics.tsx`: replaced hardcoded day/month abbreviations, 'Payment Methods', 'Most used', and 'Revenue' with t() calls.
- Translated `Summary.tsx`: replaced 'Top selling product', 'Low stock alerts', 'Debt alerts', 'Positive/Negative cash flow', 'Retry', 'Failed to load summary data' with t() calls.
- Translated `Sales.tsx`: replaced 'Walk-in', 'Sales Report', 'Refund Amount' with t() calls.
- Translated `Dashboard.tsx`: replaced 'High'/'Normal' trend, 'System' badge, 'days' suffix with t() calls.
- Translated `Expenses.tsx`: replaced 'Salaries', 'High', 'Expenses Report' with t() calls.
- Translated `Inventory.tsx`: replaced 'Inventory Report', 'CSV'/'PDF', 'N/A' with t() calls.
- Translated `Customers.tsx`: replaced customer group names, PDF footer strings with t() calls using mapping approach.
- Translated `DebtManagement.tsx`: replaced payment method display, 'Marked as loss', 'Date Filters' with t() calls.
- Translated `Orders.tsx`: replaced 'pcs' fallback with t() calls.
- Translated `Contacts.tsx`: replaced all fallback strings with t() calls.

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Process files in priority order: pages first (most user-visible), then shared components.
- For component-level functions outside component scope (e.g., `reverseLabel()` in AuditLogs), pass `t` as parameter instead of inlining.
- For module-level PAYMENT_METHODS arrays, map at render time via lookup object.
- Use parallel task agents to handle multiple files per round.
- `nav-main.tsx` and `nav-documents.tsx` are dead code (never imported); skip translating unless user explicitly asks.
- For BudgetManagement category names, keep original English values as API/database keys but display translated versions in UI using mapping approach.
- For Customer group names, use similar mapping approach: internal values unchanged, UI displays translated labels.
