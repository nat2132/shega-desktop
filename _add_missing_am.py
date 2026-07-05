#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')

filepath = 'src/renderer/src/i18n/translations.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0

# ===== 1. Add audit_logs flat keys =====
# Insert after the first `'audit_logs.no_logs'` occurrence (in en section, right before `auth`)
# Actually, audit_logs doesn't exist in am. Let me find a good insertion point.
# Let me add them near other flat keys like auth in the am section.
# Find the am section's auth: {
en_auth_line = "    'audit_logs.no_logs': 'No audit logs found',\n    'audit_logs.action_void_sale': 'Void Sale',"

# Actually, I need to add them in the am section. Let me find the am section boundaries
# and add them before the start of `bo:` (which follows `om:` after am).
# Better: add them right before `auth:` section in the am area.
# Let me find where to insert - I'll add them after the `'app_name'` key or similar.

# Actually the cleanest way: search for a pattern that exists only in am 
# and add the audit_logs keys there. Let me look for a pattern in am like 'attendances':
# No, a simpler approach: find the end of `'audit_logs.no_logs'` in the en section,
# and the am section doesn't have audit_logs, so I need to add them.

# Let me find the am section's ads or analytics or similar:
# Actually let me use the transition between sections. Let me find `am:` start and
# look for a good pattern to insert before or after.

# Found that the am section starts with 'am: {\n    analytics: {'
# The flat keys like 'auth.*' appear after the nested sections.
# Let me add audit_logs flat keys right after the am section's `'analytics.title'` block or similar.

# Actually the easiest approach: find the `auth:` section in am and add before it.
# Let me check if `'auth.'` flat keys exist in am.

# Let me just search for a known position - the am section has nested contacts->draft_sales->budgets etc.
# Then after budgets there are more flat keys.
# Let me look at what comes after the budgets section in am.

# Found that budgets section ends with forecast_no_data, then `    },` 
# Next line might be something like `'attendance.'` or another flat key section.

# Let me take a simpler approach - find a line unique to am and add after it
# Actually let me find where flat keys like 'auth.' start in am and add audit_logs before them.

# For now, I'll find the am section and look for a good insertion point.
am_start = content.find('\n  am: {')

# Let me find where the flat key section starts in am (after all nested sections)
# After the support section closes with `    },`, the next line should be `  om: {`
# But wait, I already added nav and orders before om, so the structure is:
# am: {
#   ...
#   support: { ... },
#   nav: { ... },
#   orders: { ... },
# om: {

# So now there's no flat key section after support. Let me check if auth: exists in am before support.

auth_idx = content.find("\n    auth: {", am_start)
if auth_idx >= 0 and auth_idx < am_start + 5000:
    # auth section exists in am, add audit_logs before it
    old = "\n    auth: {"
    new = "\n    'audit_logs.no_logs': 'ምንም የኦዲት መዝገብ አልተገኘም',\n    'audit_logs.action_void_sale': 'ሽያጭ ሰርዝ',\n    'audit_logs.action_reverse_payment': 'ክፍያ መልስ',\n    'audit_logs.action_reverse_adjustment': 'ማስተካከያ መልስ',\n    'audit_logs.action_restore': 'መልስ',\n    'audit_logs.action_soft_delete': 'ለስላሳ ሰርዝ',\n    'audit_logs.action_delete': 'ሰርዝ',\n    'audit_logs.action_update': 'አዘምን',\n    'audit_logs.action_insert': 'አስገባ',\n    'audit_logs.entity_sale': 'ሽያጭ',\n    'audit_logs.entity_item': 'እቃ',\n    'audit_logs.entity_customer': 'ደንበኛ',\n    'audit_logs.entity_supplier': 'አቅራቢ',\n    'audit_logs.entity_payment': 'ክፍያ',\n    'audit_logs.entity_adjustment': 'ማስተካከያ',\n    'audit_logs.restore_item': 'እቃ መልስ',\n    'audit_logs.restore_customer': 'ደንበኛ መልስ',\n    'audit_logs.redelete_item': 'እቃ እንደገና ሰርዝ',\n    'audit_logs.redelete_customer': 'ደንበኛ እንደገና ሰርዝ',\n    'audit_logs.undo_change': 'ለውጥ ቀልብስ',\n    'audit_logs.reverse_success': 'በተሳካ ሁኔታ ተመልሷል',\n    'audit_logs.reverse_error': 'መመለስ አልተሳካም',\n    'audit_logs.empty_value': '(ባዶ)',\n    auth: {"
    content = content.replace(old, new, 1)
    changes += 1
    print("[OK] Added audit_logs am flat keys")
else:
    # Find auth section after am section (might be in om section)
    print("[FAIL] Could not find auth section in am. Searching further...")

# ===== 2. Add reports nested keys =====
# The reports section ends with:
# description: 'ታኪናቈሳን'
#     },
#     contacts: {
old_reports_end = "      description: 'ታኪናቈሳን'\n    },\n    contacts: {"

new_reports_keys = """      description: 'ታኪናቈሳን',
      gen_failed: 'ሪፖርት ማመንጨት አልተሳካም',
      low_stock_failed: 'አነስተኛ ክምችት እቃዎችን ማምጣት አልተሳካም',
      report_exported: 'ሪፖርት በተሳካ ሁኔታ ወጥቷል',
      header_date: 'ቀን',
      header_revenue: 'ገቢ',
      header_units_sold: 'የተሸጡ ብዛቶች',
      header_profit: 'ትርፍ',
      header_product: 'ምርት',
      header_category: 'ምድብ',
      header_base_qty: 'መሰረታዊ ብዛት',
      header_unit: 'አሃድ',
      header_unit_cost: 'የአሃድ ዋጋ',
      header_total_value: 'ጠቅላላ ዋጋ',
      header_name: 'ስም',
      header_amount: 'መጠን',
      col_metric: 'መለኪያ',
      col_value: 'ዋጋ',
      col_total_revenue: 'ጠቅላላ ገቢ',
      col_total_expenses: 'ጠቅላላ ወጪ',
      col_gross_profit: 'ጠቅላላ ትርፍ',
      col_net_profit: 'የተጣራ ትርፍ',
      header_brand: 'ብራንድ',
      header_selling_price: 'የሽያጭ ዋጋ',
      header_purchase_price: 'የግዢ ዋጋ',
      header_supplier: 'አቅራቢ',
      header_total_purchases: 'ጠቅላላ ግዢዎች',
      header_total_payments: 'ጠቅላላ ክፍያዎች',
      header_outstanding_balance: 'ያልተከፈለ ቀሪ',
      header_order_num: 'ትዕዛዝ ቁጥር',
      header_paid_amount: 'የተከፈለ መጠን',
      header_balance: 'ቀሪ',
      header_status: 'ሁኔታ',
      header_product_count: 'ምርቶች',
      header_stock_quantity: 'የክምችት ብዛት',
      header_inventory_value: 'የክምችት ዋጋ',
      header_last_supply: 'የመጨረሻ አቅርቦት',
      header_sale_num: 'ሽያጭ ቁጥር',
      header_reason: 'ምክንያት',
      header_voided_by: 'የሰረዘው',
      header_action: 'ድርጊት',
      header_entity: 'አካል',
      header_entity_id: 'የአካል መለያ',
      header_description: 'መግለጫ',
      header_changed_by: 'የለወጠው',
      report_sales_performance: 'የሽያጭ አፈጻጸም ሪፖርት',
      report_stock_valuation: 'የክምችት ግምት ሪፖርት',
      report_expense: 'የወጪ ሪፖርት',
      report_pnl: 'የትርፍ እና ኪሳራ መግለጫ',
      report_catalog: 'የምርት ካታሎግ',
      report_supplier_summary: 'የአቅራቢ ማጠቃለያ',
      report_supplier_transactions: 'የአቅራቢ ግብይቶች',
      report_inventory_supplier: 'በአቅራቢ የክምችት ዝርዝር',
      report_voided_sales: 'የተሰረዙ ሽያጮች ሪፖርት',
      report_reversals: 'የተመለሱ ግብይቶች ሪፖርት',
      tab_suppliers: 'አቅራቢዎች',
      tab_transactions: 'ግብይቶች',
      tab_by_supplier: 'በአቅራቢ',
      supplier_summary_card: 'የአቅራቢ ማጠቃለያ',
      purchase_transactions_card: 'የግዢ ግብይቶች',
      payment_transactions_card: 'የክፍያ ግብይቶች',
      inventory_supplier_card: 'በአቅራቢ የክምችት ዝርዝር',
      outstanding_badge: 'ያልተከፈለ',
      total_stock_badge: 'ክምችት',
      value_badge: 'ዋጋ',
      id_header: 'መለያ',
      badge_payment: 'ክፍያ',
      badge_adjustment: 'ማስተካከያ',
      payments_label: 'ክፍያዎች: {count}',
      adjustments_label: 'ማስተካከያዎች: {count}',
    },\n    contacts: {"""

if old_reports_end in content:
    content = content.replace(old_reports_end, new_reports_keys, 1)
    changes += 1
    print("[OK] Added reports am nested keys")
else:
    print("[FAIL] Could not find am reports section end")

# ===== 3. Add budgets status keys =====
# The budgets section has forecast_no_data at the end. Let me find the closing
old_budgets_end = "      forecast_no_data: 'ከሳረሳን ብሓናንንን ብታቈንሪሳንን ንካሳኍ'\n    },"

new_budgets_keys = """      forecast_no_data: 'ከሳረሳን ብሓናንንን ብታቈንሪሳንን ንካሳኍ',
      status_healthy: 'ጤናማ',
      status_warning: 'ትኩረት ያስፈልገዋል',
      status_critical: 'ወሳኝ',
      under_budget: 'ከበጀት በታች',"""

if old_budgets_end in content:
    content = content.replace(old_budgets_end, new_budgets_keys, 1)
    changes += 1
    print("[OK] Added budgets am status keys")
else:
    print("[FAIL] Could not find am budgets section end")

# ===== 4. Add debt missing keys =====
old_debt_end = "      marked_as_loss: 'በመሳን ተንኪኅን ብሓናኬን'\n    },\n    reminders:"

new_debt_keys = """      marked_as_loss: 'በመሳን ተንኪኅን ብሓናኬን',
      amount_positive: 'መጠኑ አዎንታዊ መሆን አለበት',
      filter_title: 'ዕዳዎችን አጣራ',
      payment_reversed: 'ክፍያ ተመልሷል',
      reverse_error: 'ክፍያ መመለስ አልተሳካም',
      reverse_payment: 'ክፍያ መልስ',
      reverse_payment_confirm: 'የ{amount} ክፍያ ይመለስ?',
      reverse_reason_placeholder: 'ይህ ክፍያ ለምን እየተመለሰ ነው?',
      reverse: 'መልስ',
    },\n    reminders:"""

if old_debt_end in content:
    content = content.replace(old_debt_end, new_debt_keys, 1)
    changes += 1
    print("[OK] Added debt am keys")
else:
    print("[FAIL] Could not find am debt section")

# ===== 5. Add reminders update_error =====
old_reminders_end = "      confirm_delete: 'መሓንናንን ካታና?'\n    },\n    supplier_call:"

new_reminders_keys = """      confirm_delete: 'መሓንናንን ካታና?',
      update_error: 'ማሳሰቢያ ማዘመን አልተሳካም',
    },\n    supplier_call:"""

if old_reminders_end in content:
    content = content.replace(old_reminders_end, new_reminders_keys, 1)
    changes += 1
    print("[OK] Added reminders am update_error")
else:
    print("[FAIL] Could not find am reminders section")

# ===== 6. Add contacts phone_copied =====
old_contacts_phone = "      copy_phone: 'ስልክ ቁጥር ቅዳ',\n    },\n    draft_sales:"

# Check if phone_copied already exists
if "phone_copied" not in content.split('  am:')[1].split('  om:')[0] if '  am:' in content else "":
    # Try a different approach - add right after the contacts section end
    # Check what's after the contacts end
    old_contacts_end2 = "      copy_phone: 'ስልክ ቁጥር ቅዳ'\n    },\n    draft_sales:"
    new_contacts_keys2 = """      copy_phone: 'ስልክ ቁጥር ቅዳ',
      phone_copied: 'ስልክ ቁጥር ተገልብጧል',
    },\n    draft_sales:"""
    if old_contacts_end2 in content:
        content = content.replace(old_contacts_end2, new_contacts_keys2, 1)
        changes += 1
        print("[OK] Added contacts am phone_copied")
    else:
        print("[FAIL] Could not find am contacts phone_copied insertion point")
else:
    print("[OK] Contacts phone_copied already present")

if changes > 0:
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'\nSUCCESS: {changes} sections updated')
else:
    print('\nERROR: No changes made')
