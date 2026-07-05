const fs = require('fs');
const path = require('path');
const eol = '\r\n';

const filePath = path.join(__dirname, '..', 'src', 'renderer', 'src', 'i18n', 'translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

// ===== ALL NEW FLAT KEYS (English values initially) =====
const newSections = {
  orders: {
    title: 'Orders', subtitle: 'Manage purchase orders', create: 'Create Order',
    create_order: 'Create Order', create_error: 'Failed to create order',
    created: 'Order created', created_at: 'Created At', created_by: 'Created By',
    cancel: 'Cancel Order', cancel_order: 'Cancel Order', cancel_error: 'Failed to cancel order',
    cancel_reason: 'Reason for cancellation', cancel_reason_placeholder: 'Enter cancellation reason...',
    cancel_warning: 'Are you sure?', confirm_cancel: 'Yes, Cancel Order',
    cancelled: 'Cancelled', cancelled_at: 'Cancelled At',
    confirm_convert: 'Confirm Conversion', convert_to_sale: 'Convert to Sale',
    convert_to_debt: 'Convert to Debt', convert_sale_warning: 'Convert this order to a sale?',
    convert_debt_warning: 'Convert this order to debt?', converted: 'Converted',
    converted_at: 'Converted At', converted_to_sale: 'Converted to Sale',
    converted_to_debt: 'Converted to Debt', convert_error: 'Failed to convert order',
    date: 'Date', due_date: 'Due Date', customer: 'Customer',
    customer_name: 'Customer Name', customer_name_placeholder: 'Enter customer name...',
    customer_phone: 'Customer Phone', customer_phone_placeholder: 'Enter phone...',
    items: 'Items', qty: 'Qty', unit_price: 'Unit Price', total: 'Total',
    total_value: 'Total Value', total_revenue: 'Total Revenue', total_orders: 'Total Orders',
    status: 'Status', status_order: 'Order', status_cancelled: 'Cancelled',
    status_converted: 'Converted', order_number: 'Order #', order_info: 'Order Info',
    detail_subtitle: 'Order details and management', go_back: 'Go Back',
    view_details: 'View Details', search_items: 'Search items...',
    no_items_found: 'No items found', no_orders: 'No orders found',
    not_found: 'Order not found', notes: 'Notes', notes_placeholder: 'Optional notes...',
    reason: 'Reason', payment_method: 'Payment', pending_fulfillment: 'Pending',
    fulfilled: 'Fulfilled', history: 'History', history_created: 'Order created',
    history_cancelled: 'Order cancelled', history_converted_sale: 'Converted to sale',
    history_converted_debt: 'Converted to debt', all: 'All', all_time: 'All Time',
    last_30_days: 'Last 30 Days', by: 'By', active_orders: 'Active Orders',
    walk_in: 'Walk-in', cart_empty: 'Cart is empty', of_total: 'of {total}',
    filter_title: 'Filter Orders', filter_desc: 'Filter by status and date range',
    cancellation_rate: 'Cancellation Rate'
  },
  sale_detail: {
    load_error: 'Failed to load sale', not_found: 'Sale not found',
    void_sale: 'Void Sale', confirm_void: 'Are you sure?',
    void_reason_label: 'Reason', void_reason_placeholder: 'Enter reason...',
    void_description: 'This will reverse the sale.', void_error: 'Failed to void sale',
    return_processed: 'Return processed', return_failed: 'Failed to process return',
    update_error: 'Failed to update sale', updated: 'Sale updated',
    delete_error: 'Failed to delete', deleted: 'Sale deleted'
  },
  expense: {
    insurance: 'Insurance', taxes: 'Taxes', maintenance: 'Maintenance',
    marketing: 'Marketing', office_supplies: 'Office Supplies',
    placeholder_name: 'Enter name...', placeholder_amount: 'Enter amount...',
    name_required: 'Name is required', amount_required: 'Amount is required',
    export_name: 'Name', export_amount: 'Amount', export_category: 'Category',
    export_date: 'Date', export_frequency: 'Frequency', export_recurring: 'Recurring',
    export_yes: 'Yes', export_no: 'No', next_billing: 'Next Billing',
    projected_savings_value: 'Projected Savings', budget_details: 'Budget Details',
    budget_subtitle: 'Track category spending limits', budget_save: 'Save Budget',
    budget_spent: 'Spent', budget_over: 'Over Budget', budget_health: 'Health',
    budget_no_budgets: 'No budgets yet', budget_create_first: 'Create your first budget',
    budget_delete_title: 'Delete Budget?'
  },
  audit_logs: {
    empty_value: '(empty)', action_insert: 'Insert', action_update: 'Update',
    action_delete: 'Delete', action_soft_delete: 'Soft Delete', action_restore: 'Restore',
    action_void_sale: 'Void Sale', action_reverse_payment: 'Reverse Payment',
    action_reverse_adjustment: 'Reverse Adjustment', undo_change: 'Undo Change',
    reversed: 'Reversed', reverse_success: 'Reversed successfully',
    reverse_error: 'Failed to reverse', entity_sale: 'Sale', entity_payment: 'Payment',
    entity_item: 'Item', entity_customer: 'Customer', entity_supplier: 'Supplier',
    entity_adjustment: 'Adjustment', restore_customer: 'Restore Customer',
    restore_item: 'Restore Item', redelete_customer: 'Re-delete Customer',
    redelete_item: 'Re-delete Item'
  },
  dashboard: {
    load_error: 'Failed to load dashboard', total_employees: 'Total Employees',
    online_now: 'Online Now', clocked_in: 'Clocked In', due_in: 'Due In',
    low_stock_supplier: 'Low Stock by Supplier', payment_due_alerts: 'Payment Due Alerts',
    system_entry: 'System Entry', reversed_adjustments: 'Reversed Adjustments',
    reversed_payments: 'Reversed Payments', trend_high: 'High', trend_normal: 'Normal'
  },
  pdf: {
    receipt: 'Receipt', date: 'Date', customer: 'Customer', item: 'Item',
    qty: 'Qty', price: 'Price', total: 'Total', payment: 'Payment',
    paid: 'Paid', thanks: 'Thank you for your business!'
  }
};

// Application-level missing keys (used in code, not in translations)
const appKeys = {
  nav: {
    documents: 'Documents', more: 'More', open: 'Open',
    share: 'Share', delete: 'Delete', quick_create: 'Quick Create', inbox: 'Inbox'
  },
  common: {
    active: 'Active', inactive: 'Inactive', unknown: 'Unknown', pcs: 'pcs', leave_blank: 'Leave blank to keep current'
  },
  data_transfer: {
    title: 'Data Transfer', subtitle: 'Import and export your business data',
    export: 'Export Data', import: 'Import Data', format: 'Format',
    data_type: 'Data Type', select_type: 'Select type...',
    export_action: 'Export', upload_file: 'Upload File',
    file_hint: 'Accepted: .json files up to 10MB',
    preview: 'Preview', restore_action: 'Restore', import_action: 'Import',
    available_backups: 'Available Backups',
    restore_success: 'Data restored successfully', restore_error: 'Failed to restore data',
    export_success: 'Data exported successfully', export_error: 'Failed to export data',
    expenses_report: 'Expenses Report', sales_report: 'Sales Report', inventory_report: 'Inventory Report'
  },
  sale_success: {
    title: 'Sale Completed', description: 'The sale has been recorded successfully.',
    items_label: 'Items', total_label: 'Total', payment_label: 'Payment',
    customer_label: 'Customer', download_receipt: 'Download Receipt', new_sale: 'New Sale'
  },
  budgets: {
    budget_amount_error: 'Please enter a valid budget amount',
    budget_save_error: 'Failed to save budget',
    budget_delete_error: 'Failed to delete budget',
    tab_budgets: 'Budgets',
    budget_updated: 'Budget updated',
    budget_set_success: 'Budget saved successfully',
    budget_deleted_msg: 'Budget deleted',
    duplicate_count: 'Duplicated {{count}} budget(s)',
    duplicate_exists: 'A budget for this category already exists',
    adjust_reason_required: 'Please provide a reason for the adjustment',
    adjust_amount_required: 'Please enter the new amount',
    budget_adjusted: 'Budget adjusted successfully',
    col_category: 'Category', col_planned: 'Planned', col_actual: 'Actual',
    col_remaining: 'Remaining', col_used_percent: 'Used %', col_status: 'Status',
    report_title: 'Budget Report - {{period}}',
    export_success: '{{type}} exported successfully',
    total_budget: 'Total Budget', planned_budget: 'Planned Budget',
    for_period: 'for {{period}}',
    total_spent: 'Total Spent', budget_used: 'Budget Used',
    percent_of_total: '{{percent}} of total',
    under_budget: 'Under Budget',
    remaining_funds: '{{amount}} remaining', no_funds: 'No funds remaining',
    budget_health: 'Budget Health', healthy: 'Healthy', critical: 'Critical',
    good_shape: 'In good shape', needs_attention: 'Needs attention',
    within_targets: 'Within targets', review_spending: 'Review spending',
    ethiopian_year: '{{year}} E.C.',
    refresh: 'Refresh',
    tab_dashboard: 'Dashboard', tab_reports: 'Reports',
    tab_adjustments: 'Adjustments', tab_forecast: 'Forecast',
    active_alerts: '{{count}} active alert(s)',
    dismiss: 'Dismiss', category_breakdown: 'Category Breakdown',
    no_budgets_period: 'No budgets for this period',
    duplicate_from_previous: 'Duplicate from Previous',
    empty_state: 'No budgets set yet. Create your first budget.',
    recurring: 'Recurring', adjust_btn_title: 'Adjust Budget',
    planned_vs_actual: 'Planned vs Actual - {{period}}',
    export_csv: 'Export CSV', export_pdf: 'Export PDF',
    total_planned: 'Total Planned', usage: 'Usage',
    no_data_period: 'No data for this period',
    adjustment_history: 'Adjustment History',
    adjustment_history_desc: 'Track changes to your budgets',
    no_adjustments: 'No adjustments recorded',
    approved_by: 'Approved by {{name}}',
    status_approved: 'Approved', status_rejected: 'Rejected',
    forecast_title: 'Forecast', forecast_desc: 'Projected budget trends',
    forecast_no_data: 'Not enough data for forecast',
    budgeted_label: 'Budgeted', estimated_label: 'Estimated',
    variance_label: 'Variance',
    edit_budget: 'Edit Budget', budget_type: 'Budget Type',
    department_name: 'Department Name', project_name: 'Project Name',
    branch_name: 'Branch Name',
    enter_name_placeholder: 'Enter {{type}} name...',
    planned_amount: 'Planned Amount',
    amount_placeholder: 'Enter amount...',
    notes_label: 'Notes', notes_placeholder: 'Optional notes...',
    update_budget: 'Update Budget',
    adjust_budget_title: 'Adjust Budget - {{category}}',
    current_budget: 'Current Budget', new_amount: 'New Amount',
    adjustment_reason: 'Reason', adjustment_reason_placeholder: 'Why are you adjusting?',
    apply_adjustment: 'Apply Adjustment',
    duplicate_title: 'Duplicate Budget', duplicate_desc: 'Copy budgets from {{period}}?',
    target_month: 'Month', target_year: 'Year', duplicate_btn: 'Duplicate',
    quarter_1: 'Q1', quarter_2: 'Q2', quarter_3: 'Q3', quarter_4: 'Q4',
    quarterly: 'Quarterly', yearly: 'Yearly',
    month_jan: 'January', month_feb: 'February', month_mar: 'March',
    month_apr: 'April', month_may: 'May', month_jun: 'June',
    month_jul: 'July', month_aug: 'August', month_sep: 'September',
    month_oct: 'October', month_nov: 'November', month_dec: 'December'
  },
  customers: {
    invoice_footer: 'Thank you for your business!', statement_footer: 'This is a computer-generated statement'
  },
  contacts: {
    load_error: 'Failed to load contacts', save_error: 'Failed to save contact'
  },
  debt: {
    filter_title: 'Filter Debts'
  },
  reminders: {
    create_error: 'Failed to create reminder', update_error: 'Failed to update reminder'
  },
  summary: {
    load_error: 'Failed to load summary'
  },
  settings: {
    modules: 'Modules', modules_desc: 'Enable or disable system modules', modules_hint: 'Changes take effect after restart'
  },
  onboarding: {
    benefits: 'Benefits'
  },
  reports: {
    col_gross_profit: 'Gross Profit', col_net_profit: 'Net Profit',
    col_total_revenue: 'Total Revenue', col_total_expenses: 'Total Expenses',
    col_metric: 'Metric', col_value: 'Value',
    badge_adjustment: 'Adjustment', badge_payment: 'Payment',
    gen_failed: 'Report generation failed',
    header_action: 'Action', header_amount: 'Amount', header_balance: 'Balance',
    header_base_qty: 'Base Qty', header_brand: 'Brand',
    csv: 'CSV', pdf: 'PDF',
    gross_margin: 'Gross Margin', net_margin: 'Net Margin',
    total_revenue: 'Total Revenue', total_expenses: 'Total Expenses',
    net_income: 'Net Income', profit_margin: 'Profit Margin',
    expense_breakdown: 'Expense Breakdown', revenue_breakdown: 'Revenue Breakdown',
    period_comparison: 'Period Comparison',
    this_period: 'This Period', previous_period: 'Previous Period',
    change: 'Change', percentage: 'Percentage',
    inventory_report: 'Inventory Report', sales_report: 'Sales Report',
    expense_report: 'Expense Report', summary_report: 'Summary Report',
    generate: 'Generate', preview: 'Preview', print: 'Print',
    no_data: 'No data available', loading: 'Loading...'
  },
  common: {
    admin: 'Admin', go_back: 'Go Back', retry: 'Retry',
    days: 'Days', due: 'Due', employee: 'Employee',
    not_available: 'N/A', pdf: 'PDF', super_admin: 'Super Admin',
    csv: 'CSV', app_name: 'Shega', terminal_version: 'Terminal Version'
  },
  analytics: {
    by_day: 'By Day', payment_methods: 'Payment Methods',
    by_day_mon: 'Monday', by_day_tue: 'Tuesday', by_day_wed: 'Wednesday',
    by_day_thu: 'Thursday', by_day_fri: 'Friday', by_day_sat: 'Saturday', by_day_sun: 'Sunday',
    day_mon: 'Mon', day_tue: 'Tue', day_wed: 'Wed', day_thu: 'Thu',
    day_fri: 'Fri', day_sat: 'Sat', day_sun: 'Sun'
  }
};

// EN-only missing keys for existing sections
const enMissingKeys = {
  analytics: {
    most_used: 'Most Used', top_selling: 'Top Selling', revenue_chart: 'Revenue Chart',
    period_comparison: 'Period Comparison', export_data: 'Export Data',
    filter: 'Filter', date_range: 'Date Range', apply: 'Apply', reset: 'Reset',
    growth_rate: 'Growth Rate', decline_rate: 'Decline Rate',
    total_sales: 'Total Sales', total_expenses: 'Total Expenses',
    net_income: 'Net Income', cash_flow: 'Cash Flow', forecast: 'Forecast',
    trending_up: 'Trending Up', trending_down: 'Trending Down'
  },
  adjustments: {
    reverse_title: 'Reverse Adjustment', reverse_desc: 'Are you sure you want to reverse this adjustment?',
    confirm_reverse: 'Yes, Reverse', reverse_success: 'Adjustment reversed successfully',
    reverse_error: 'Failed to reverse adjustment', search_placeholder: 'Search adjustments...'
  },
  inventory: {
    load_error: 'Failed to load inventory', create_error: 'Failed to create item',
    save_error: 'Failed to save changes', update_error: 'Failed to update item',
    search_placeholder: 'Search items...'
  },
  contacts: {
    search_placeholder: 'Search contacts...'
  },
  summary: {
    loading: 'Loading...', error: 'Error loading summary', retry: 'Retry',
    no_data: 'No data available', last_updated: 'Last updated',
    view_all: 'View All', show_more: 'Show More', show_less: 'Show Less',
    quick_actions: 'Quick Actions', shortcuts: 'Shortcuts'
  },
  debt: {
    search_placeholder: 'Search debts...', load_error: 'Failed to load debts',
    create_debt: 'Create Debt', debt_date: 'Debt Date', amount_positive: 'Amount must be positive'
  },
  reminders: {
    search_placeholder: 'Search reminders...', load_error: 'Failed to load reminders',
    no_reminders: 'No reminders found', create_reminder: 'Create Reminder',
    title_required: 'Title is required', date_required: 'Date is required'
  },
  suppliers: {
    search_placeholder: 'Search suppliers...', load_error: 'Failed to load suppliers',
    save_error: 'Failed to save supplier'
  }
};

// Build flat key lines from sections object
function buildFlatKeys(sections) {
  const lines = [];
  for (const [section, keys] of Object.entries(sections)) {
    for (const [key, value] of Object.entries(keys)) {
      const escapedValue = value.replace(/'/g, "\\'");
      lines.push("    '" + section + "." + key + "': '" + escapedValue + "'");
    }
  }
  return lines.join(',' + eol);
}

const newSectionLines = buildFlatKeys(newSections);
const enMissingLines = buildFlatKeys(enMissingKeys);
const appLines = buildFlatKeys(appKeys);

const enLines = newSectionLines + ',' + eol + enMissingLines + ',' + eol + appLines;
const amOmTiLines = newSectionLines + ',' + eol + enMissingLines + ',' + eol + appLines;

// Insert flat keys before a language close marker
function insertBeforeLangMarker(content, marker, flatKeysStr) {
  const idx = content.indexOf(marker);
  if (idx === -1) {
    console.log('  Marker not found: ' + JSON.stringify(marker));
    return content;
  }

  const before = content.slice(0, idx);
  const after = content.slice(idx);

  // Remove trailing whitespace/newlines to add comma cleanly
  const trimmed = before.replace(/[\r\n]+$/, '');

  return trimmed + ',' + eol + flatKeysStr + ',' + eol + after;
}

// EN: insert before `  },\r\n  am: {`
const enMarker = '  },\r\n  am: {';
console.log('EN marker found at:', content.indexOf(enMarker));
let result = insertBeforeLangMarker(content, enMarker, enLines);

// AM: insert before `  },\r\n  om: {`
const amMarker = '  },\r\n  om: {';
console.log('AM marker found at:', result.indexOf(amMarker));
result = insertBeforeLangMarker(result, amMarker, amOmTiLines);

// OM: insert before `  },\r\n  ti: {`
const omMarker = '  },\r\n  ti: {';
console.log('OM marker found at:', result.indexOf(omMarker));
result = insertBeforeLangMarker(result, omMarker, amOmTiLines);

// TI: insert before `  }\r\n};`
const tiMarker = '  }\r\n};';
console.log('TI marker found at:', result.indexOf(tiMarker));
// Handle TI specially: last language, no comma before `};`
const tiIdx = result.indexOf(tiMarker);
if (tiIdx !== -1) {
  const tiBefore = result.slice(0, tiIdx);
  const tiAfter = result.slice(tiIdx);
  const tiTrimmed = tiBefore.replace(/[\r\n]+$/, '');
  result = tiTrimmed + ',' + eol + amOmTiLines + ',' + eol + tiAfter;
}

fs.writeFileSync(filePath, result, 'utf8');
console.log('File updated successfully');
