import { ScreenTutorial } from './types';

const tutorials: ScreenTutorial[] = [
  // ═══════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-dashboard',
    screenPath: '/',
    screenName: 'Dashboard',
    title: 'Dashboard Overview',
    description: 'Learn how to monitor your business health, track key metrics, and access quick actions from the Dashboard.',
    estimatedDuration: 8,
    steps: [
      {
        id: 'dashboard-welcome',
        title: 'Welcome to Your Dashboard',
        description: 'The Dashboard is your command center. It gives you a real-time snapshot of your business performance, including revenue, profit, and key alerts.',
        instruction: 'Take a moment to scan the summary cards at the top. These show your total revenue, profit, and outstanding debts for the current period.',
        tooltipPosition: 'center',
      },
      {
        id: 'dashboard-kpi-cards',
        title: 'Key Performance Indicators',
        description: 'The KPI cards at the top show your most important metrics: Total Revenue, Profit, and Outstanding Debts for the current period.',
        instruction: 'Each card shows a metric name, the current value, and a comparison indicator. Green means positive performance, red means attention needed. Review all three cards to get a snapshot of your business health.',
        targetSelector: '[data-tutorial-section="kpi-cards"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'dashboard-alerts',
        title: 'Alerts & Notifications',
        description: 'Stay informed about low stock, unpaid debts, expiring items, and other important events. Alerts appear here so nothing slips through the cracks.',
        instruction: 'Review any active alerts. Each alert shows severity (warning, error, or info) and a brief message about what needs attention.',
        tooltipPosition: 'center',
      },
      {
        id: 'dashboard-employee-stats',
        title: 'Employee Overview',
        description: 'View key employee metrics at a glance: total employees, active staff, online now, clocked in, and pending approvals.',
        instruction: 'These stats give you a quick snapshot of your workforce. Check how many employees are currently online, clocked in, and any pending approvals that need your attention.',
        targetSelector: '[data-tutorial-section="employee-stats"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'dashboard-charts',
        title: 'Sales & Revenue Charts',
        description: 'Visualize your sales trends over time. These charts help you spot patterns, peak seasons, and areas for improvement.',
        instruction: 'The Revenue Intelligence chart shows your sales over time. Use the period selector (Week/Month/Year) above the chart to switch between views.',
        targetSelector: '[data-tutorial-section="revenue-chart"]',
        tooltipPosition: 'top',
      },
      {
        id: 'dashboard-category-sales',
        title: 'Recent Activity',
        description: 'See the latest sales, adjustments, and staff clock-in/out events with the user who performed them.',
        instruction: 'Review the recent activity feed. Each entry shows the action, the person who performed it, and the time. Use this to keep track of what is happening across your team.',
        targetSelector: '[data-tutorial-section="recent-activity"]',
        tooltipPosition: 'top',
      },
      {
        id: 'dashboard-quick-actions',
        title: 'Business Assistant',
        description: 'The Business Assistant provides actionable insights and suggestions based on your data, helping you make informed decisions.',
        instruction: 'Read the assistant\'s suggestions below. Each card offers a specific action you can take to improve your business.',
        targetSelector: '[data-tutorial-section="business-assistant"]',
        tooltipPosition: 'top',
      },
      {
        id: 'dashboard-summary',
        title: 'You\'re All Set!',
        description: 'You now understand the Dashboard. Use it daily to monitor performance, catch issues early, and make data-driven decisions.',
        instruction: 'Best Practice: Check your Dashboard at the start of each day. Review alerts first, then scan metrics, and finally check charts for trends.',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // INVENTORY — Add Item form (12+ fields), Purchase Order, Details
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-inventory',
    screenPath: '/inventory',
    screenName: 'Inventory',
    title: 'Inventory Management',
    description: 'Learn how to add, manage, and track inventory items, create purchase orders, and monitor stock levels.',
    estimatedDuration: 8,
    steps: [
      {
        id: 'inv-welcome',
        title: 'Managing Your Inventory',
        description: 'The Inventory screen is where you track all products. You can add new items, update stock, manage suppliers, and create purchase orders.',
        instruction: 'This is your product management hub. From here you can browse inventory, search and filter items, add new products, manage stock levels, create purchase orders, and track supplier information. Take a moment to explore the layout before we begin.',
        tooltipPosition: 'center',
      },
      {
        id: 'inv-search',
        title: 'Search & Filter Inventory',
        description: 'Quickly find items using the search bar or apply filters to narrow down by category, date range, or credit status.',
        instruction: 'Type in the search box to filter items by name. Click the Filter button to explore advanced filtering options by date range, category, or credit status.',
        targetSelector: 'input[data-tutorial-section="table-search"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'inv-add-open',
        title: 'Opening the Add Item Form',
        description: 'Click "Add Item" to open the registration form. You\'ll enter product details, pricing, units, and supplier information.',
        instruction: 'Click the Add Item button (Plus icon) to open the form. We\'ll fill it out as one complete form.',
        targetSelector: 'button[data-tutorial-section="add-item-btn"]',
        tooltipPosition: 'left',
      },
      {
        id: 'inv-add-dialog',
        title: 'Add Item Form',
        description: 'The Add Item form captures all product details including name, brand, quality, category, pricing, units, supplier, and expiry information.',
        instruction: 'Fill in the entire form top to bottom — Item Name (required), Brand, Quality Grade, Category, Purchase & Base Units, Pricing, Sell Unit toggles, and Supplier & Expiry. Only the item name is required; the rest can be set to sensible defaults and adjusted later. When the form is complete, move on to the next step to save it.',
        targetSelector: '[data-slot="dialog-content"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'inv-add-submit',
        title: 'Submitting the Form',
        description: 'Review the profit analysis showing your margins. When ready, click "Commit Ledger" to save the item to inventory.',
        instruction: 'Check the base and pack profit margins displayed. If satisfied, click "Commit Ledger" to save. Click "Abort" to cancel.',
        targetSelector: 'button[type="submit"]',
        tooltipPosition: 'right',
      },
      // ── Purchase Order Form ──
      {
        id: 'inv-po-open',
        title: 'Creating a Purchase Order',
        description: 'Purchase Orders help you restock inventory. Search for items, set order quantities, and generate reports.',
        instruction: 'Click the Purchase Order button (Shopping Cart icon) to open the PO form.',
        targetSelector: 'button:has(svg.lucide-shopping-cart)',
        tooltipPosition: 'left',
      },
      {
        id: 'inv-po-search',
        title: 'Adding Items to PO',
        description: 'Search for products to add to your purchase order. You can also add custom items not yet in inventory.',
        instruction: 'Type a product name in the search box, then click "+ Add" next to items. For custom items, fill in the name, quantity, and price fields at the bottom.',
        targetSelector: 'input[data-tutorial-section="po-search"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'inv-po-submit',
        title: 'Finalizing the PO',
        description: 'Review all items and their quantities. The estimated total cost is displayed. Submit to create the purchase order.',
        instruction: 'Adjust quantities as needed. Click "Generate Purchase Order" to create the PO and optionally print it.',
        targetSelector: 'button[type="submit"]',
        tooltipPosition: 'right',
      },
      {
        id: 'inv-restock',
        title: 'Restocking Items',
        description: 'When stock runs low, restock directly from the inventory list. This updates quantities and records purchase history.',
        instruction: 'Find an item row and click the restock icon (refresh arrows). Enter the additional quantity and the new purchase price.',
        targetSelector: 'button:has(svg.lucide-rotate-ccw)',
        tooltipPosition: 'right',
      },
      {
        id: 'inv-best-practices',
        title: 'Best Practices',
        description: 'Keep your inventory accurate with these tips.',
        instruction: '• Set reorder alerts for fast-moving items\n• Use categories to organize products\n• Update purchase prices when restocking\n• Run stock counts regularly\n• Export reports weekly for backup',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SALES — 3-step wizard (search → review → settlement + payment)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-sales',
    screenPath: '/sales',
    screenName: 'Sales',
    title: 'Sales Management',
    description: 'Learn how to record sales, manage transactions, handle returns, and track sales performance.',
    estimatedDuration: 12,
    steps: [
      {
        id: 'sales-welcome',
        title: 'Recording Sales',
        description: 'The Sales screen lets you record every transaction. You can add items, apply discounts, track payments, and generate receipts.',
        instruction: 'This is your sales command center. From here you can view sales history, start new transactions, process returns, and track performance. Take a moment to explore the layout before we begin.',
        tooltipPosition: 'center',
      },
      {
        id: 'sales-new',
        title: 'Starting a New Sale',
        description: 'Click "New Sale" to open the 3-step transaction wizard: Selection → Review → Settlement.',
        instruction: 'Click the "New Sale" button to begin. The wizard guides you through each step.',
        targetSelector: 'button:has(svg.lucide-plus)',
        tooltipPosition: 'left',
      },
      {
        id: 'sales-step1',
        title: 'Step 1: Selecting Items',
        description: 'Search for inventory items and add them to the cart. The search filters in real time as you type.',
        instruction: 'Type an item name in the search box. Results appear instantly. Click on an item to add it to the cart with default quantity 1.',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'sales-step1-review',
        title: 'Reviewing Your Cart',
        description: 'The cart badge shows how many items you\'ve selected. Click "Review Ledger" when done to proceed to Step 2.',
        instruction: 'Review the cart badge showing item count. Click "Review Ledger (N)" to proceed, or "Save Draft" to continue later.',
        targetSelector: 'button[type="submit"]',
        tooltipPosition: 'right',
      },
      {
        id: 'sales-step2-qty',
        title: 'Step 2: Adjust Quantities & Units',
        description: 'In the review step, you can adjust quantities using +/- buttons, change unit type (individual vs pack), or remove items.',
        instruction: 'Use the + and - buttons to adjust quantities. Use the dropdown to switch between base unit and pack unit for each item.',
        targetSelector: 'button:has(svg.lucide-plus)',
        tooltipPosition: 'right',
      },
      {
        id: 'sales-step2-proceed',
        title: 'Proceeding to Settlement',
        description: 'Once the cart looks right, click "Proceed Settlement" to enter payment details and customer info.',
        instruction: 'Click "Add More" to go back and add items, "Save Draft" to save for later, or "Proceed Settlement" to continue.',
        targetSelector: 'button:has(svg.lucide-arrow-right)',
        tooltipPosition: 'right',
      },
      {
        id: 'sales-step3-discount',
        title: 'Step 3: Discount & VAT',
        description: 'Enter a flat discount amount and VAT percentage. These are applied to the subtotal before calculating the final total.',
        instruction: 'Enter a discount in ETB (e.g. 50 for a 50 Birr discount). Enter VAT percentage (e.g. 15 for 15%). Leave as 0 if not applicable.',
        targetSelector: 'input[data-slot="input"][type="number"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'sales-step3-customer',
        title: 'Customer Information',
        description: 'Enter the customer name and phone number. For credit sales, this information is required to track the debt.',
        instruction: 'Type the customer\'s name (e.g. "Abebe Kebede") and phone. If this is a walk-in sale, you can leave these blank for cash settlements.',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'sales-step3-payment',
        title: 'Payment Method',
        description: 'Choose how the customer pays: Cash, Bank Transfer, Check, or Other. Toggle between cash settlement and credit (debt) sale.',
        instruction: 'Select a payment method. Toggle to "Debt" if the customer will pay later — a due date field will appear.',
        targetSelector: 'button[data-slot="switch"][role="switch"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'sales-step3-submit',
        title: 'Completing the Sale',
        description: 'Review the final total in the highlighted summary card. Click "Authorize" to complete the transaction.',
        instruction: 'Verify the total is correct. Check the settlement summary. Click "Authorize" to finalize. A receipt will be generated.',
        targetSelector: 'button:has(svg.lucide-check)',
        tooltipPosition: 'right',
      },
      {
        id: 'sales-return',
        title: 'Processing a Return',
        description: 'If a customer needs to return an item, use the return form. Enter the quantity to return and refund amount.',
        instruction: 'Click the return icon on any sale. Enter the quantity to return (max: original quantity). Set refund to 0 for exchange only. Provide a reason.',
        targetSelector: 'button:has(svg.lucide-undo-2)',
        tooltipPosition: 'left',
      },
      {
        id: 'sales-detail-edit',
        title: 'Editing a Transaction (Sale Detail)',
        description: 'From the sale detail view, you can edit the customer info, quantity, discount, and VAT for any transaction.',
        instruction: 'Click the edit icon on a sale. Update the customer name, phone, quantity, discount, or VAT fields. Click Confirm to save changes.',
        tooltipPosition: 'center',
      },
      {
        id: 'sales-best-practices',
        title: 'Sales Best Practices',
        description: 'Master these tips for accurate sales tracking.',
        instruction: '• Always verify quantities before completing a sale\n• Use credit sales sparingly and track debts\n• Generate receipts for every transaction\n• Reconcile daily sales with cash on hand\n• Review sales trends weekly to spot patterns',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SALE DETAIL — Edit, Return, Void, Print actions
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-sale-detail',
    screenPath: '/sales/',
    screenName: 'Sale Detail',
    title: 'Sale Detail & Transaction Management',
    description: 'Learn how to review completed sales, edit transactions, process returns, void sales, and print receipts.',
    estimatedDuration: 6,
    steps: [
      {
        id: 'sale-detail-welcome',
        title: 'Sale Detail Overview',
        description: 'The Sale Detail screen shows everything about a single transaction: customer info, items purchased, payment details, and financial summary.',
        instruction: 'This view is organized into cards. From top to bottom: Sale Info, Item Details, Financial Summary, and optional Payment History.',
        tooltipPosition: 'center',
      },
      {
        id: 'sale-detail-info',
        title: 'Sale Information',
        description: 'The Sale Info card shows the transaction date, customer name and phone, payment method, and payment status.',
        instruction: 'Check the customer name and payment status. If this is a credit sale, the due date is displayed here.',
        targetSelector: 'div[data-slot="card"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'sale-detail-items',
        title: 'Items Purchased',
        description: 'The Item Details table lists every product in the transaction with quantity, unit, unit price, and total.',
        instruction: 'Review each item. The product names, quantities, and individual totals are shown for reference.',
        tooltipPosition: 'center',
      },
      {
        id: 'sale-detail-financial',
        title: 'Financial Summary',
        description: 'The Financial Summary shows the subtotal, discount applied, VAT, and the final total price.',
        instruction: 'Verify the discount and VAT amounts. For credit sales, the due amount is shown separately.',
        tooltipPosition: 'center',
      },
      {
        id: 'sale-detail-edit',
        title: 'Editing the Transaction',
        description: 'Click the Edit button to modify customer info, quantity, discount, or VAT. Changes are saved with a confirm.',
        instruction: 'Click Edit (pencil icon). Update customer name, phone, quantity, discount, or VAT. Click "Confirm" to save changes or "Cancel" to discard.',
        targetSelector: 'button:has(svg.lucide-edit)',
        tooltipPosition: 'left',
      },
      {
        id: 'sale-detail-return-void',
        title: 'Returns & Voiding',
        description: 'Use the Return button (undo icon) to process customer returns. Use Void to cancel the entire sale.',
        instruction: 'Return: Click the amber Return button, enter return quantity, refund amount, and reason. Void: Click the red Void Sale button and provide a reason.',
        targetSelector: 'button:has(svg.lucide-undo-2)',
        tooltipPosition: 'left',
      },
      {
        id: 'sale-detail-best-practices',
        title: 'Transaction Best Practices',
        description: 'Keep accurate records with these tips.',
        instruction: '• Always provide a receipt after completing a sale\n• Use returns instead of voiding when possible\n• Document void reasons clearly for audit trails\n• Verify customer identity for credit sale edits\n• Print receipts for customer records',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMERS — Add/Edit Customer form + Payment form
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-customers',
    screenPath: '/customers',
    screenName: 'Customers',
    title: 'Customer Management',
    description: 'Learn how to manage customer records, track debts, and maintain contact information.',
    estimatedDuration: 11,
    steps: [
      {
        id: 'customers-welcome',
        title: 'Managing Customers',
        description: 'The Customers screen stores all customer information including contact details, debt balances, and purchase history.',
        instruction: 'This is your customer management hub. From here you can view customer records, add new customers, track debts, and manage payments. Take a moment to explore the layout before we begin.',
        tooltipPosition: 'center',
      },
      // ── Customer Form ──
      {
        id: 'customers-add-open',
        title: 'Opening the Add Customer Form',
        description: 'Click "Add Customer" to create a new record. The form has fields for all customer details.',
        instruction: 'Click "Add Customer" to open the form. Fields marked with * are required.',
        targetSelector: 'button:has(svg.lucide-plus)',
        tooltipPosition: 'left',
      },
      {
        id: 'customers-add-dialog',
        title: 'Add Customer Form',
        description: 'The Add Customer form stores customer information including name, group, contact details, credit limit, and address.',
        instruction: 'This form has fields for entering the necessary information. Take a moment to review the layout before we fill in each field step by step.',
        targetSelector: '[data-slot="dialog-content"]',
        tooltipPosition: 'top',
      },
      {
        id: 'customers-add-name',
        title: 'Customer Name (Required)',
        description: 'Enter the customer\'s full name. This is how they\'ll appear in sales, debt records, and search results.',
        instruction: 'Type the customer\'s full name (e.g. "Abebe Kebede"). Use a consistent naming convention.',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'customers-add-group',
        title: 'Customer Group',
        description: 'Assign the customer to a group like Retail, Wholesale, or Premium. Groups help with targeted marketing and pricing.',
        instruction: 'Select a group from the dropdown. Choose "Retail" for individual buyers, "Wholesale" for bulk purchasers.',
        targetSelector: 'button[data-slot="select-trigger"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'customers-add-phone',
        title: 'Phone & Contact Info',
        description: 'Enter the customer\'s primary phone number. This is used for debt follow-ups and communication.',
        instruction: 'Enter phone number with area code (e.g. "+251 911 234 567"). Add secondary phone, email, and company details as needed.',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'customers-add-credit',
        title: 'Credit Limit',
        description: 'Set a credit limit for this customer. This controls how much they can owe before requiring payment.',
        instruction: 'Enter the maximum credit amount in ETB (e.g. 50000). Set to 0 if you don\'t want to extend credit. Be conservative — it\'s easier to increase later.',
        targetSelector: 'input[data-slot="input"][type="number"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'customers-add-location',
        title: 'City & Address',
        description: 'Record the customer\'s location. This is useful for delivery routing and market analysis.',
        instruction: 'Enter the city (e.g. "Addis Ababa"). Add a specific address for delivery purposes.',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'customers-add-submit',
        title: 'Saving the Customer',
        description: 'Review all fields and click "Create Customer" to save. The customer will immediately be available for sales and debt tracking.',
        instruction: 'Add optional notes if needed. Click "Create Customer" to save, or "Cancel" to discard.',
        targetSelector: 'button[type="submit"]',
        tooltipPosition: 'right',
      },
      // ── Payment Form ──
      {
        id: 'customers-payment',
        title: 'Recording a Customer Payment',
        description: 'When a customer pays off a debt, use the payment form. Enter the amount and confirm.',
        instruction: 'From the customer profile, click "Pay" on a debt entry. Enter the payment amount (max: outstanding balance). Click "Confirm Payment".',
        targetSelector: 'button:has(svg.lucide-credit-card)',
        tooltipPosition: 'right',
      },
      {
        id: 'customers-best-practices',
        title: 'Customer Best Practices',
        description: 'Keep your customer relationships strong.',
        instruction: '• Always verify customer identity for credit sales\n• Follow up on overdue debts promptly but professionally\n• Keep contact information up to date\n• Use the notes field for important customer preferences\n• Review customer purchase history before offering credit',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-analytics',
    screenPath: '/analytics',
    screenName: 'Analytics',
    title: 'Business Analytics',
    description: 'Learn how to analyze your business performance using charts, reports, and data visualizations.',
    estimatedDuration: 5,
    steps: [
      {
        id: 'analytics-welcome',
        title: 'Understanding Your Analytics',
        description: 'The Analytics screen provides detailed visualizations of your business data, helping you identify trends and opportunities.',
        instruction: 'Analytics are organized by category: sales, inventory, and customers. Each section offers different chart types.',
        tooltipPosition: 'center',
      },
      {
        id: 'analytics-sales',
        title: 'Sales Analytics',
        description: 'View sales trends over time with interactive charts. Compare periods, identify peak seasons, and track growth.',
        instruction: 'Switch between chart views (bar, line, area) to find the visualization that makes trends clearest to you.',
        targetSelector: 'svg.recharts-surface',
        tooltipPosition: 'bottom',
      },
      {
        id: 'analytics-period',
        title: 'Selecting Time Periods',
        description: 'Choose different time ranges to analyze: daily, weekly, monthly, quarterly, or custom date ranges.',
        instruction: 'Try changing the period selector. Compare this month to last month to see growth or decline.',
        targetSelector: 'div.flex.bg-muted.p-1.rounded-xl',
        tooltipPosition: 'bottom',
      },
      {
        id: 'analytics-export',
        title: 'Exporting Reports',
        description: 'Export analytics data and charts to PDF or CSV for presentations, meetings, and record-keeping.',
        instruction: 'Click the export button to download the current view as a report. You can include charts and data tables.',
        tooltipPosition: 'center',
      },
      {
        id: 'analytics-best-practices',
        title: 'Analytics Best Practices',
        description: 'Get the most value from your analytics.',
        instruction: '• Review analytics weekly, not just monthly\n• Compare against previous periods for context\n• Export monthly reports for your records\n• Use filters to isolate specific products or categories\n• Share insights with your team during meetings',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SETTINGS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-settings',
    screenPath: '/settings',
    screenName: 'Settings',
    title: 'App Settings',
    description: 'Learn how to configure the application, manage your business profile, set preferences, and customize themes.',
    estimatedDuration: 4,
    steps: [
      {
        id: 'settings-welcome',
        title: 'Configuring Your App',
        description: 'The Settings screen lets you customize every aspect of the application, from language and theme to business information and module preferences.',
        instruction: 'This is where you configure the entire application. Settings are organized into tabs for Appearance, Language, Business Info, and Modules. Take a moment to explore the layout before we begin.',
        tooltipPosition: 'center',
      },
      {
        id: 'settings-theme',
        title: 'Choosing a Theme',
        description: 'Switch between Light, Dark, and five custom themes. The interface updates in real time.',
        instruction: 'Click different theme options to see how they change the interface. Each theme is designed for comfortable extended use.',
        targetSelector: 'div.grid.grid-cols-4.gap-3',
        tooltipPosition: 'bottom',
      },
      {
        id: 'settings-language',
        title: 'Changing Language',
        description: 'The app supports English, Amharic, Oromo, and Tigrinya. Switch languages at any time.',
        instruction: 'Click the Language tab and select a different language to see the interface update. All menus and labels will change.',
        targetSelector: 'button[data-slot="tabs-trigger"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'settings-business',
        title: 'Business Information',
        description: 'Update your business name, currency, and other settings. These values are used throughout the app.',
        instruction: 'Review the business information and ensure your currency setting matches your local currency for accurate financial reporting.',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'left',
      },
      {
        id: 'settings-modules',
        title: 'Managing Modules',
        description: 'The Modules tab lets you enable or disable features. Disable modules you don\'t use to keep the interface clean and focused.',
        instruction: 'Click the Modules tab. Toggle switches on for features you use (Inventory, Sales, etc.) and off for those you don\'t need. Changes apply immediately.',
        targetSelector: 'button[data-slot="switch"][role="switch"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'settings-best-practices',
        title: 'Settings Best Practices',
        description: 'Optimize your setup with these recommendations.',
        instruction: '• Choose a theme that reduces eye strain during long sessions\n• Set the correct currency before recording any transactions\n• Enable only the modules you actively use\n• Review settings periodically as your business grows',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // WAREHOUSES — Add, Transfer Stock, Adjust Qty forms
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-warehouses',
    screenPath: '/warehouses',
    screenName: 'Warehouses',
    title: 'Warehouse Management',
    description: 'Learn how to manage multiple warehouses, track stock across locations, and organize inventory by storage area.',
    estimatedDuration: 9,
    steps: [
      {
        id: 'warehouses-welcome',
        title: 'Managing Warehouses',
        description: 'The Warehouses screen lets you organize inventory across multiple physical storage locations.',
        instruction: 'This is your warehouse management hub. From here you can view all storage locations, add new warehouses, transfer stock between sites, and adjust inventory quantities. Take a moment to explore the layout before we begin.',
        tooltipPosition: 'center',
      },
      // ── Add Warehouse Form ──
      {
        id: 'warehouses-add-open',
        title: 'Adding a Warehouse',
        description: 'Create new warehouse records with names, locations, manager information, and contact details.',
        instruction: 'Click "Add Warehouse" to open the form. We\'ll walk through each field.',
        targetSelector: 'button:has(svg.lucide-plus)',
        tooltipPosition: 'left',
      },
      {
        id: 'warehouses-add-dialog',
        title: 'Add Warehouse Form',
        description: 'The Add Warehouse form creates new storage locations with name, location, manager, and contact information.',
        instruction: 'This form has fields for entering the necessary information. Take a moment to review the layout before we fill in each field step by step.',
        targetSelector: '[data-slot="dialog-content"]',
        tooltipPosition: 'top',
      },
      {
        id: 'warehouses-add-name',
        title: 'Warehouse Name (Required)',
        description: 'Enter a descriptive name for the warehouse. Use names that make location and purpose clear.',
        instruction: 'Type a name (e.g. "Main Warehouse — Bole"). Be specific enough to distinguish from other warehouses.',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'warehouses-add-location',
        title: 'Warehouse Location',
        description: 'Enter the physical location or address of the warehouse for reference.',
        instruction: 'Type the location (e.g. "Bole, Addis Ababa").',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'warehouses-add-manager',
        title: 'Manager Details',
        description: 'Assign a manager to the warehouse. Include their name, phone number, and email for contact purposes.',
        instruction: 'Enter the manager\'s name (e.g. "Abebe Kebede"), phone number with area code, and email address. This helps with coordination.',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'warehouses-add-submit',
        title: 'Saving the Warehouse',
        description: 'Review the details and click "Create Warehouse" to save the new location.',
        instruction: 'Click "Create Warehouse" to save. The warehouse will appear in the list and be available for stock transfers.',
        targetSelector: 'button:has(svg.lucide-check)',
        tooltipPosition: 'right',
      },
      // ── Transfer Stock Form ──
      {
        id: 'warehouses-transfer-open',
        title: 'Transferring Stock Between Warehouses',
        description: 'Move inventory from one warehouse to another. Select source, destination, item, and quantity.',
        instruction: 'Click the "Transfer Stock" button to open the form.',
        targetSelector: 'button:has(svg.lucide-arrow-right-left)',
        tooltipPosition: 'left',
      },
      {
        id: 'warehouses-transfer-source',
        title: 'Select Source & Destination',
        description: 'Choose which warehouse the stock is leaving and which one it\'s going to. They must be different.',
        instruction: 'Select the source warehouse (where stock is now) and destination warehouse (where stock is going). Cannot be the same.',
        targetSelector: 'button[data-slot="select-trigger"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'warehouses-transfer-item',
        title: 'Select Item & Quantity',
        description: 'Choose the item to transfer and enter the quantity. The system checks available stock at the source.',
        instruction: 'Select an item from the dropdown. Enter the quantity to transfer (e.g. 50). Add the name of the person authorizing the transfer.',
        targetSelector: 'input[data-slot="input"][type="number"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'warehouses-transfer-submit',
        title: 'Executing the Transfer',
        description: 'Review the transfer details and click "Execute Transfer". Stock counts update immediately at both locations.',
        instruction: 'Add optional notes. Click "Execute Transfer" to complete. You can view the transfer history in the warehouse details.',
        targetSelector: 'button[type="submit"]',
        tooltipPosition: 'right',
      },
      {
        id: 'warehouses-adjust-open',
        title: 'Adjusting Inventory Quantities',
        description: 'Set exact inventory quantities for a specific item in a warehouse. Use this for stock counts and corrections.',
        instruction: 'Click the "Set Inventory Qty" button. Select warehouse, item, and enter the new quantity.',
        targetSelector: 'button:has(svg.lucide-pencil)',
        tooltipPosition: 'left',
      },
      {
        id: 'warehouses-best-practices',
        title: 'Warehouse Best Practices',
        description: 'Keep your warehouses organized.',
        instruction: '• Assign a responsible person to each warehouse\n• Conduct monthly stock counts\n• Use transfers to document all movement\n• Keep warehouse names descriptive (e.g. "Main Store — Ground Floor")\n• Review warehouse activity weekly',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ADJUSTMENTS — Inline stock/price/bulk forms
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-adjustments',
    screenPath: '/adjustments',
    screenName: 'Adjustments',
    title: 'Stock Adjustments',
    description: 'Learn how to record inventory adjustments for damaged goods, returns, and stock corrections.',
    estimatedDuration: 8,
    steps: [
      {
        id: 'adjustments-welcome',
        title: 'Recording Adjustments',
        description: 'Stock adjustments correct inventory records when actual count differs from system count.',
        instruction: 'This is where you record inventory corrections. Use the tabs to switch between Stock, Price, and Bulk adjustment forms. Take a moment to explore the layout before we begin.',
        tooltipPosition: 'center',
      },
      // ── Stock Adjustment Form ──
      {
        id: 'adjustments-stock-type',
        title: 'Stock Adjustment — Action Type',
        description: 'Choose what type of stock change you\'re recording: add stock, damage, or loss.',
        instruction: 'Select the type: "Add Stock" for new inventory, "Damage" for damaged goods, or "Loss" for missing items.',
        targetSelector: 'button[data-slot="select-trigger"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'adjustments-stock-item',
        title: 'Select the Item & Quantity',
        description: 'Choose the product being adjusted and enter the quantity affected.',
        instruction: 'Select an item from the dropdown. Enter the quantity (e.g. 10). Use positive numbers for additions, the system handles the direction.',
        targetSelector: 'input[data-slot="input"][type="number"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'adjustments-stock-reason',
        title: 'Provide a Reason',
        description: 'Always document why the adjustment is needed. This is critical for audits and inventory accuracy.',
        instruction: 'Type a clear reason (e.g. "5 cartons damaged during transport"). Be specific.',
        targetSelector: 'textarea',
        tooltipPosition: 'bottom',
      },
      {
        id: 'adjustments-stock-submit',
        title: 'Applying the Adjustment',
        description: 'Review the impact preview showing current vs. new stock levels. Click "Submit Adjustment" to apply.',
        instruction: 'Check the impact preview for financial implications. Click "Submit Adjustment" to record the change.',
        targetSelector: 'button[type="submit"]',
        tooltipPosition: 'right',
      },
      // ── Price Adjustment Form ──
      {
        id: 'adjustments-price-tab',
        title: 'Price Adjustments',
        description: 'Switch to the Price tab to update item selling prices. Select item, unit type, and enter the new price.',
        instruction: 'Click the "Price" tab. Select the item and unit type (base or pack). Enter the new selling price and an optional reason.',
        targetSelector: 'button[data-slot="tabs-trigger"]',
        tooltipPosition: 'left',
      },
      // ── Bulk Adjustment Form ──
      {
        id: 'adjustments-bulk-tab',
        title: 'Bulk Adjustments',
        description: 'The Bulk tab lets you adjust prices for entire categories at once — percentage increase or fixed amount changes.',
        instruction: 'Click the "Bulk" tab. Select a category (or "All Items"), choose adjustment type (percentage or fixed), and enter the value.',
        targetSelector: 'button[data-slot="tabs-trigger"]',
        tooltipPosition: 'left',
      },
      {
        id: 'adjustments-best-practices',
        title: 'Adjustment Best Practices',
        description: 'Follow these guidelines for accurate adjustments.',
        instruction: '• Always investigate discrepancies before adjusting\n• Document the reason clearly\n• Get manager approval for significant adjustments\n• Review adjustment reports monthly for patterns\n• Use bulk adjustments carefully — verify impact first',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // DEBT MANAGEMENT — Payment form + Reverse Payment
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-debt-management',
    screenPath: '/debt-management',
    screenName: 'Debt Management',
    title: 'Debt Management',
    description: 'Learn how to track customer debts, record payments, and manage collections.',
    estimatedDuration: 8,
    steps: [
      {
        id: 'debt-welcome',
        title: 'Managing Customer Debts',
        description: 'The Debt Management screen provides a comprehensive view of all customer debts, payment history, and collection tools.',
        instruction: 'This is your debt management hub. From here you can view all outstanding debts, record payments, reverse transactions, and track collection progress. Take a moment to explore the layout before we begin.',
        tooltipPosition: 'center',
      },
      {
        id: 'debt-filter',
        title: 'Filtering Debts',
        description: 'Use filters to narrow down by date range. This helps focus on specific periods.',
        instruction: 'Click the Filter button and set a date range to view debts from a specific period.',
        targetSelector: 'button:has(svg.lucide-list-filter)',
        tooltipPosition: 'left',
      },
      // ── Payment Form ──
      {
        id: 'debt-payment-open',
        title: 'Recording a Payment',
        description: 'When a customer pays, click the ellipsis menu on their debt row and select "Mark as Paid".',
        instruction: 'Click the three-dot menu on a debt row, then select "Mark as Paid" to open the payment form.',
        targetSelector: 'button:has(svg.lucide-more-horizontal)',
        tooltipPosition: 'right',
      },
      {
        id: 'debt-add-dialog',
        title: 'Payment Form',
        description: 'The Payment form records customer debt payments with amount, payment method, and optional notes.',
        instruction: 'This form has fields for entering the necessary information. Take a moment to review the layout before we fill in each field step by step.',
        targetSelector: '[data-slot="dialog-content"]',
        tooltipPosition: 'top',
      },
      {
        id: 'debt-payment-amount',
        title: 'Payment Amount',
        description: 'Enter how much the customer is paying. The max amount shown is their outstanding balance.',
        instruction: 'Type the payment amount (e.g. 25000 ETB). You can pay partially — the remaining balance stays on the debt. Enter any amount up to the max shown.',
        targetSelector: 'input[data-slot="input"][type="number"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'debt-payment-method',
        title: 'Payment Method',
        description: 'Select how the customer paid: Cash, Bank Transfer, Mobile Money, or Check.',
        instruction: 'Choose the payment method that matches how the customer actually paid.',
        targetSelector: 'button[data-slot="select-trigger"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'debt-payment-note',
        title: 'Payment Note (Optional)',
        description: 'Add a note about the payment for reference, like receipt number or any special terms.',
        instruction: 'Optionally add a note (e.g. "Receipt #12345").',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'debt-payment-submit',
        title: 'Confirming the Payment',
        description: 'Click "Confirm Payment" to record it. The debt balance updates immediately.',
        instruction: 'Review the details. Click "Confirm Payment" to apply. The debt status will update to reflect the payment.',
        targetSelector: 'button[type="submit"]',
        tooltipPosition: 'right',
      },
      {
        id: 'debt-reverse',
        title: 'Reversing a Payment',
        description: 'If a payment was recorded by mistake, you can reverse it. Click the undo icon on the payment history entry.',
        instruction: 'In the payment history, click the ban icon on an entry. Provide a reason for the reversal. This creates an audit trail.',
        targetSelector: 'button:has(svg.lucide-ban)',
        tooltipPosition: 'right',
      },
      {
        id: 'debt-best-practices',
        title: 'Debt Management Best Practices',
        description: 'Keep your receivables healthy.',
        instruction: '• Set clear credit terms before extending credit\n• Follow up on overdue debts within 7 days\n• Offer receipts for every payment\n• Review the debt report weekly\n• Consider setting credit limits for customers',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // EMPLOYEES — Employee, Role, Account forms
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-employees',
    screenPath: '/employees',
    screenName: 'Employees',
    title: 'Employee Management',
    description: 'Learn how to manage employee records, assign roles, and create system accounts.',
    estimatedDuration: 11,
    steps: [
      {
        id: 'employees-welcome',
        title: 'Managing Employees',
        description: 'The Employee Management screen helps you track your team members, their roles, and contact information.',
        instruction: 'This is your employee management hub. From here you can view team members, add new employees, assign roles, create system accounts, and manage permissions. Take a moment to explore the layout before we begin.',
        tooltipPosition: 'center',
      },
      // ── Employee Form ──
      {
        id: 'employees-add-open',
        title: 'Adding an Employee',
        description: 'Click "Add Employee" to open the form. Enter personal details, contact info, role, and employment status.',
        instruction: 'Click "Add Employee" to begin. Fields marked with * are required.',
        targetSelector: 'button:has(svg.lucide-user-plus)',
        tooltipPosition: 'left',
      },
      {
        id: 'employees-add-dialog',
        title: 'Add Employee Form',
        description: 'The Add Employee form captures personal details, contact information, role assignment, and employment dates.',
        instruction: 'This form has fields for entering the necessary information. Take a moment to review the layout before we fill in each field step by step.',
        targetSelector: '[data-slot="dialog-content"]',
        tooltipPosition: 'top',
      },
      {
        id: 'employees-add-name',
        title: 'Employee Name (Required)',
        description: 'Enter the employee\'s first and last name. These are used in reports and system access.',
        instruction: 'Type the first name and last name (e.g. "Biruk Alemu").',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'employees-add-code',
        title: 'Employee Code & Role',
        description: 'Assign a unique employee code (like EMP-001) and select their role from the dropdown.',
        instruction: 'Enter an employee code for identification. Select a role that matches their job function (e.g. Cashier, Manager).',
        targetSelector: 'select',
        tooltipPosition: 'bottom',
      },
      {
        id: 'employees-add-contact',
        title: 'Contact Information',
        description: 'Enter the employee\'s phone number and email for communication and emergency contact.',
        instruction: 'Enter phone number with area code (e.g. "+251 911 234 567"). Enter email address for official communications.',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'employees-add-hire-date',
        title: 'Hire Date',
        description: 'Record when the employee started working. This is used for tenure tracking and reports.',
        instruction: 'Select the hire date from the date picker (e.g. 2026-06-01). Defaults to today if not set.',
        targetSelector: 'input[data-slot="input"][type="date"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'employees-add-submit',
        title: 'Saving the Employee',
        description: 'Click "Create" to save the employee record. They\'ll appear in the employee list.',
        instruction: 'Review all fields. Click "Create" to save the employee.',
        targetSelector: 'button[data-slot="button"]',
        tooltipPosition: 'right',
      },
      // ── Role Form ──
      {
        id: 'employees-role-open',
        title: 'Creating a Role',
        description: 'Roles define what permissions an employee has. Create roles like "Cashier" or "Manager" with specific access.',
        instruction: 'Click "Add Role". Enter the role name, description, and select permissions for this role.',
        targetSelector: 'button:has(svg.lucide-plus)',
        tooltipPosition: 'left',
      },
      {
        id: 'employees-role-permissions',
        title: 'Setting Permissions',
        description: 'Check the permissions this role should have. Each permission controls access to a specific feature.',
        instruction: 'Select permissions by checking the boxes. Be thoughtful — give only the access needed for the job.',
        targetSelector: 'input[type="checkbox"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'employees-role-submit',
        title: 'Saving the Role',
        description: 'Click "Create" to save the role. It will be available when adding or editing employees.',
        instruction: 'Verify the permissions are correct. Click "Create" to save.',
        targetSelector: 'button[data-slot="button"]',
        tooltipPosition: 'right',
      },
      // ── Account Form ──
      {
        id: 'employees-account-open',
        title: 'Creating a System Account',
        description: 'System accounts let employees log in to the application. Select an employee and set their username and PIN.',
        instruction: 'Click "Add Account". Select the employee from the dropdown. This creates their login credentials.',
        targetSelector: 'button:has(svg.lucide-key-round)',
        tooltipPosition: 'left',
      },
      {
        id: 'employees-account-credentials',
        title: 'Username & PIN',
        description: 'Set the login username and a numeric PIN. The PIN is used for quick access. Optionally force a password change on next login.',
        instruction: 'Enter a unique username (e.g. johndoe). Set a 4-digit PIN (e.g. 1234). Check "Force password change" if this is a first-time user.',
        targetSelector: 'input[data-slot="input"][type="password"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'employees-account-submit',
        title: 'Creating the Account',
        description: 'Click "Create Account" to finalize. The employee can now log in with their credentials.',
        instruction: 'Click "Create Account" to save. Share the credentials with the employee securely.',
        targetSelector: 'button[data-slot="button"]',
        tooltipPosition: 'right',
      },
      {
        id: 'employees-best-practices',
        title: 'Employee Best Practices',
        description: 'Keep your team organized.',
        instruction: '• Update employee records when roles change\n• Use strong PINs for all accounts\n• Review permissions quarterly\n• Remove accounts when employees leave\n• Keep emergency contact info current',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SHIPMENTS — Create/Edit Shipment form
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-shipments',
    screenPath: '/shipments',
    screenName: 'Shipments',
    title: 'Shipment Tracking',
    description: 'Learn how to track incoming and outgoing shipments, manage carriers, and monitor delivery status.',
    estimatedDuration: 8,
    steps: [
      {
        id: 'shipments-welcome',
        title: 'Tracking Shipments',
        description: 'The Shipments screen helps you track goods coming in from suppliers and going out to customers.',
        instruction: 'This is your shipment tracking hub. From here you can view all incoming and outgoing shipments, create new shipments, manage carriers, and monitor delivery status. Take a moment to explore the layout before we begin.',
        tooltipPosition: 'center',
      },
      // ── Shipment Form ──
      {
        id: 'shipments-add-open',
        title: 'Creating a New Shipment',
        description: 'Click "New Shipment" to open the form. Enter origin, destination, driver, vehicle, and schedule details.',
        instruction: 'Click "New Shipment" to begin. We\'ll walk through each field.',
        targetSelector: 'button:has(svg.lucide-truck)',
        tooltipPosition: 'left',
      },
      {
        id: 'shipments-add-dialog',
        title: 'New Shipment Form',
        description: 'The New Shipment form tracks goods movement with origin, destination, driver, vehicle, and schedule details.',
        instruction: 'This form has fields for entering the necessary information. Take a moment to review the layout before we fill in each field step by step.',
        targetSelector: '[data-slot="dialog-content"]',
        tooltipPosition: 'top',
      },
      {
        id: 'shipments-add-route',
        title: 'Origin & Destination',
        description: 'Enter where the shipment is coming from and where it\'s going. Both fields help with route planning.',
        instruction: 'Type the origin (e.g. "Supplier Warehouse — Bole"). Enter the destination (e.g. "Main Store — Merkato"). Destination is required.',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'shipments-add-driver',
        title: 'Driver & Vehicle Info',
        description: 'Record the driver\'s name, phone number, and vehicle details for tracking and communication.',
        instruction: 'Enter driver name (e.g. "Abebe Kebede"), phone number with area code, and vehicle info.',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'shipments-add-schedule',
        title: 'Scheduled Date & Notes',
        description: 'Set the expected departure or arrival date. Add any special instructions for the driver or recipient.',
        instruction: 'Pick the scheduled date (e.g. 2026-06-01). Add notes like "Handle with care — fragile items" or "Deliver to loading dock B".',
        targetSelector: 'input[data-slot="input"][type="date"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'shipments-add-submit',
        title: 'Creating the Shipment',
        description: 'Click "Create" to save the shipment. It will appear with "Pending" status. You can update status as it progresses.',
        instruction: 'Review all details. Click "Create" to save. Use the "Mark In Transit" and "Mark Delivered" buttons to update status.',
        targetSelector: 'button:has(svg.lucide-check)',
        tooltipPosition: 'right',
      },
      {
        id: 'shipments-best-practices',
        title: 'Shipment Best Practices',
        description: 'Keep shipments organized.',
        instruction: '• Record shipments immediately when goods leave\n• Update status promptly as shipments progress\n• Keep driver contact info handy\n• Add detailed notes for special handling\n• Review pending shipments daily',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SUPPLIERS — Payment form + Price Check form
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-suppliers',
    screenPath: '/suppliers',
    screenName: 'Suppliers',
    title: 'Supplier Management',
    description: 'Learn how to manage supplier information, record payments, and schedule price checks.',
    estimatedDuration: 9,
    steps: [
      {
        id: 'suppliers-welcome',
        title: 'Managing Suppliers',
        description: 'The Suppliers screen stores information about your vendors, including contact details, purchase history, and payment terms.',
        instruction: 'This is your supplier management hub. From here you can view vendor information, record payments, schedule price checks, and manage your supply chain. Take a moment to explore the layout before we begin.',
        tooltipPosition: 'center',
      },
      {
        id: 'suppliers-detail',
        title: 'Viewing Supplier Details',
        description: 'Click on a supplier to see their full profile including purchase history, payment records, and outstanding balances.',
        instruction: 'Click a supplier row to view details. This is useful before ordering or making payments.',
        targetSelector: 'button:has(svg.lucide-eye)',
        tooltipPosition: 'right',
      },
      // ── Payment Form ──
      {
        id: 'suppliers-payment-open',
        title: 'Recording a Supplier Payment',
        description: 'When you pay a supplier, record the payment here. Select the purchase order, enter the amount, and choose the payment method.',
        instruction: 'Click "Record Payment" on a supplier\'s profile. We\'ll fill in the payment details.',
        targetSelector: 'button:has(svg.lucide-credit-card)',
        tooltipPosition: 'left',
      },
      {
        id: 'suppliers-add-dialog',
        title: 'Supplier Payment Form',
        description: 'The Supplier Payment form records payments with payment date, amount, method, and reference information.',
        instruction: 'This form has fields for entering the necessary information. Take a moment to review the layout before we fill in each field step by step.',
        targetSelector: '[data-slot="dialog-content"]',
        tooltipPosition: 'top',
      },
      {
        id: 'suppliers-payment-date',
        title: 'Payment Date',
        description: 'Set the date the payment was made. This affects financial period reporting.',
        instruction: 'Select the actual payment date (e.g. 2026-06-01) from the date picker.',
        targetSelector: 'input[data-slot="input"][type="date"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'suppliers-payment-amount',
        title: 'Payment Amount',
        description: 'Enter the amount paid. You can pay against a specific purchase order or as a general payment.',
        instruction: 'Type the amount (e.g. 100000 ETB). Select a specific purchase order to track which invoices are paid.',
        targetSelector: 'input[data-slot="input"][type="number"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'suppliers-payment-method',
        title: 'Payment Method & Reference',
        description: 'Select how the payment was made and enter a reference number for tracking.',
        instruction: 'Choose the method: Cash, Bank Transfer, Mobile Money, Check, or Other. Enter a reference number like the transaction ID.',
        targetSelector: 'select',
        tooltipPosition: 'bottom',
      },
      {
        id: 'suppliers-payment-submit',
        title: 'Saving the Payment',
        description: 'Click "Save" to record the payment. The supplier\'s balance updates immediately.',
        instruction: 'Add optional notes. Click "Save" to confirm the payment.',
        targetSelector: 'button[type="submit"]',
        tooltipPosition: 'right',
      },
      // ── Price Check Form ──
      {
        id: 'suppliers-price-check',
        title: 'Scheduling a Price Check',
        description: 'Set up recurring price checks for suppliers. The system will remind you to verify and compare prices.',
        instruction: 'Click "Schedule Price Check". Select the supplier, optionally a specific item, frequency (weekly/biweekly/monthly), and add notes.',
        targetSelector: 'button:has(svg.lucide-bell)',
        tooltipPosition: 'left',
      },
      {
        id: 'suppliers-best-practices',
        title: 'Supplier Best Practices',
        description: 'Build strong supplier relationships.',
        instruction: '• Maintain multiple suppliers for key items\n• Track supplier performance (on-time delivery, quality)\n• Keep payment terms and contact info current\n• Review supplier pricing periodically\n• Schedule regular price checks for competitive pricing',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // CONTACTS — Add/Edit Contact form (Dialog)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-contacts',
    screenPath: '/contacts',
    screenName: 'Contacts',
    title: 'Contact Management',
    description: 'Learn how to manage business contacts including customers, suppliers, and other stakeholders.',
    estimatedDuration: 7,
    steps: [
      {
        id: 'contacts-welcome',
        title: 'Managing Contacts',
        description: 'The Contacts screen stores all your business contacts in one place, including customers, suppliers, and service providers.',
        instruction: 'This is your contact management hub. From here you can browse all business contacts, add new ones, search and filter by type, and keep your network organized. Take a moment to explore the layout before we begin.',
        tooltipPosition: 'center',
      },
      {
        id: 'contacts-search',
        title: 'Searching & Filtering Contacts',
        description: 'Use the search bar to find contacts by name or phone number. Category filter pills let you narrow by type: Supplier, Worker, Service, or Other.',
        instruction: 'Type in the search box to filter contacts in real time. Click on a category pill (Supplier, Worker, etc.) to show only contacts of that type.',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      // ── Contact Form ──
      {
        id: 'contacts-add-open',
        title: 'Adding a Contact',
        description: 'Click "Add Contact" to open the dialog form. Enter the contact\'s details.',
        instruction: 'Click "Add Contact" to begin. We\'ll walk through the form.',
        targetSelector: 'button:has(svg.lucide-plus)',
        tooltipPosition: 'left',
      },
      {
        id: 'contacts-add-dialog',
        title: 'Add Contact Form',
        description: 'The Add Contact form stores business contacts with name, phone, category, and optional notes.',
        instruction: 'This form has fields for entering the necessary information. Take a moment to review the layout before we fill in each field step by step.',
        targetSelector: '[data-slot="dialog-content"]',
        tooltipPosition: 'top',
      },
      {
        id: 'contacts-add-name',
        title: 'Contact Name (Required)',
        description: 'Enter the contact\'s full name. This is how they\'ll appear throughout the system.',
        instruction: 'Type the full name (e.g. "Abebe Kebede").',
        targetSelector: 'input[required]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'contacts-add-phone',
        title: 'Phone Number (Required)',
        description: 'Enter the contact\'s phone number. This is the primary way to reach them.',
        instruction: 'Enter phone number with area code (e.g. "+251 911 234 567").',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'contacts-add-category',
        title: 'Category & Subcategory',
        description: 'Classify the contact by category (Customer, Supplier, Partner, etc.) and optionally a subcategory.',
        instruction: 'Select a category from the dropdown — this helps with filtering and organization. Add a subcategory for more detail, e.g. "Wholesale Buyer" or "Raw Materials Supplier".',
        targetSelector: 'button[data-slot="select-trigger"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'contacts-add-notes',
        title: 'Notes (Optional)',
        description: 'Add notes about the contact — preferences, special terms, or any relevant information.',
        instruction: 'Type any relevant notes (e.g. "Prefers delivery on Tuesdays").',
        targetSelector: 'textarea[data-slot="textarea"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'contacts-add-submit',
        title: 'Saving the Contact',
        description: 'Review and click "Save" to add the contact to your list.',
        instruction: 'Verify the details. Click "Save" to create the contact. They\'ll immediately appear in the contact list.',
        targetSelector: 'button[type="submit"]',
        tooltipPosition: 'right',
      },
      {
        id: 'contacts-best-practices',
        title: 'Contact Best Practices',
        description: 'Keep your contact list valuable.',
        instruction: '• Update contact information regularly\n• Use the notes field for important details\n• Classify contacts correctly for better filtering\n• Remove or archive inactive contacts periodically\n• Export contacts as backup regularly',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // REPORTS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-reports',
    screenPath: '/reports',
    screenName: 'Reports',
    title: 'Business Reports',
    description: 'Learn how to generate and export business reports for insights, analysis, and stakeholder communication.',
    estimatedDuration: 4,
    steps: [
      {
        id: 'reports-welcome',
        title: 'Generating Reports',
        description: 'The Reports screen lets you generate comprehensive business reports covering sales, inventory, and customer activities.',
        instruction: 'This is where you generate business reports. Choose from different report types covering sales, inventory, and customers to gain insights into your performance. Take a moment to explore the layout before we begin.',
        tooltipPosition: 'center',
      },
      {
        id: 'reports-generate',
        title: 'Creating a Report',
        description: 'Select the report type, set the date range, and generate your report. Data is presented in clear tables and charts.',
        instruction: 'Select a report type and date range, then click "Generate". Review the data before exporting.',
        targetSelector: 'button:has(svg.lucide-bar-chart-3)',
        tooltipPosition: 'right',
      },
      {
        id: 'reports-export',
        title: 'Exporting Reports',
        description: 'Export reports as PDF for presentations or CSV for data analysis in spreadsheet software.',
        instruction: 'Use the export buttons to download your report. PDF is best for sharing, CSV is best for further analysis.',
        targetSelector: 'button:has(svg.lucide-download)',
        tooltipPosition: 'left',
      },
      {
        id: 'reports-best-practices',
        title: 'Reports Best Practices',
        description: 'Get the most from your reports.',
        instruction: '• Generate monthly reports consistently\n• Compare reports month-over-month for trends\n• Export PDFs for management meetings\n• Use CSV exports for deep data analysis\n• Schedule regular report reviews',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // AUDIT LOGS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-audit-logs',
    screenPath: '/audit-logs',
    screenName: 'Audit Logs',
    title: 'Audit Logs',
    description: 'Learn how to review system activity logs for security, compliance, and troubleshooting.',
    estimatedDuration: 3,
    steps: [
      {
        id: 'audit-welcome',
        title: 'Reviewing Audit Logs',
        description: 'Audit Logs track every action in the system — who did what and when. Use this for security monitoring and troubleshooting.',
        instruction: 'This is your system audit log. Every action in the system is recorded here — who did what and when. Use filters to investigate specific events. Take a moment to explore the layout before we begin.',
        tooltipPosition: 'center',
      },
      {
        id: 'audit-filter',
        title: 'Filtering Audit Logs',
        description: 'Filter logs by date range, user, or action type to find specific events quickly.',
        instruction: 'Use filters to narrow down log entries. This is especially useful during investigations.',
        targetSelector: 'select',
        tooltipPosition: 'bottom',
      },
      {
        id: 'audit-best-practices',
        title: 'Audit Best Practices',
        description: 'Maintain good security practices.',
        instruction: '• Review audit logs weekly for unusual activity\n• Investigate failed login attempts\n• Keep logs for at least 90 days\n• Use filters to focus on critical actions\n• Export logs periodically for backup',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // USERS / EMPLOYEES — Employee, Account, Role forms (full version)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-users',
    screenPath: '/users',
    screenName: 'Users',
    title: 'User & Employee Management',
    description: 'Learn how to manage system users, employees, roles, permissions, and accounts.',
    estimatedDuration: 11,
    steps: [
      {
        id: 'users-welcome',
        title: 'Managing Users & Employees',
        description: 'This screen combines employee management with system accounts. Add employees, assign roles, and create login credentials.',
        instruction: 'This is the user and employee management hub. Tabs let you switch between Employees, Accounts, and Roles. Only administrators can access this screen. Take a moment to explore the layout before we begin.',
        tooltipPosition: 'center',
      },
      // ── Full Employee Form ──
      {
        id: 'users-employee-open',
        title: 'Adding a New Employee',
        description: 'Click "Add Employee" on the Employees tab. Enter comprehensive employee information.',
        instruction: 'Click "Add Employee" to open the form with all fields.',
        targetSelector: 'button:has(svg.lucide-user-plus)',
        tooltipPosition: 'left',
      },
      {
        id: 'users-add-dialog',
        title: 'Add Employee Form',
        description: 'The Add Employee form captures comprehensive employee information including personal details, employment, and emergency contact info.',
        instruction: 'This form has fields for entering the necessary information. Take a moment to review the layout before we fill in each field step by step.',
        targetSelector: '[data-slot="dialog-content"]',
        tooltipPosition: 'top',
      },
      {
        id: 'users-employee-details',
        title: 'Employee Details',
        description: 'Fill in personal information: first name, last name, phone, email, role, and department.',
        instruction: 'Enter first name and last name (e.g. "Biruk Alemu"). Add phone, email, select a role, and optional department.',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'users-employee-employment',
        title: 'Employment & Location',
        description: 'Set employment status, gender, date of birth, hire date, and assign a warehouse.',
        instruction: 'Select employment status (Active/Inactive/Suspended). Optionally set gender, DOB, hire date, and warehouse assignment.',
        targetSelector: 'select',
        tooltipPosition: 'bottom',
      },
      {
        id: 'users-employee-emergency',
        title: 'Emergency Contact & Address',
        description: 'Record emergency contact info and residential address for HR purposes.',
        instruction: 'Enter emergency contact name (e.g. "Sara Tadesse")/number. Add the employee\'s residential address and any HR notes.',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'users-employee-submit',
        title: 'Creating the Employee',
        description: 'Click "Create Employee" to save the record. Then switch to the Accounts tab to create login credentials.',
        instruction: 'Review all details. Click "Create Employee" to save. The employee will appear in the list.',
        targetSelector: 'button[data-slot="button"]',
        tooltipPosition: 'right',
      },
      // ── Account Form ──
      {
        id: 'users-account-open',
        title: 'Creating a Login Account',
        description: 'Switch to the Accounts tab. Click "Add Account" to create login credentials for an employee.',
        instruction: 'Click the "Accounts" tab, then "Add Account".',
        targetSelector: 'button:has(svg.lucide-user-cog)',
        tooltipPosition: 'left',
      },
      {
        id: 'users-account-form',
        title: 'Account Credentials',
        description: 'Select the employee, set a unique username, and assign a PIN. Optionally force a password change on next login.',
        instruction: 'Select the employee from the dropdown. Enter a username (e.g. "johndoe") and set a 4-digit PIN. Check "Force password change" for first-time users.',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'users-account-submit',
        title: 'Creating the Account',
        description: 'Click "Create Account" to finalize. The employee can now log in.',
        instruction: 'Click "Create Account" to create the login credentials. Share credentials securely with the employee.',
        targetSelector: 'button[data-slot="button"]',
        tooltipPosition: 'right',
      },
      // ── Role Form ──
      {
        id: 'users-role-open',
        title: 'Managing Roles',
        description: 'Switch to the Roles tab. Create roles with specific permission sets for different job functions.',
        instruction: 'Click the "Roles" tab, then "Add Role".',
        targetSelector: 'button:has(svg.lucide-shield)',
        tooltipPosition: 'left',
      },
      {
        id: 'users-role-form',
        title: 'Role Name & Permissions',
        description: 'Name the role and select permissions from organized groups. Each permission controls access to a specific feature.',
        instruction: 'Enter a role name (e.g. "Cashier"). Select permissions by clicking permission chips. Use "Select All" for full access.',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'users-role-submit',
        title: 'Saving the Role',
        description: 'Click "Create Role" to save. Roles are available throughout the system for assignment.',
        instruction: 'Review selected permissions. Click "Create Role" to save.',
        targetSelector: 'button[data-slot="button"]',
        tooltipPosition: 'right',
      },
      {
        id: 'users-best-practices',
        title: 'User Management Best Practices',
        description: 'Keep your system secure.',
        instruction: '• Follow the principle of least privilege\n• Remove access immediately when employees leave\n• Use strong PINs for all users\n• Review user activity in audit logs\n• Review permissions quarterly\n• Keep employee information current',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SUBSCRIPTION
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-subscription',
    screenPath: '/subscription',
    screenName: 'Subscription',
    title: 'Subscription Management',
    description: 'Learn how to view and manage your subscription plan, billing, and premium features.',
    estimatedDuration: 3,
    steps: [
      {
        id: 'subscription-welcome',
        title: 'Your Subscription',
        description: 'The Subscription Dashboard shows your current plan, billing details, and premium feature access.',
        instruction: 'This is your subscription dashboard. Review your current plan, renewal date, and available premium features. Compare plans to upgrade and unlock more capabilities. Take a moment to explore the layout before we begin.',
        tooltipPosition: 'center',
      },
      {
        id: 'subscription-plans',
        title: 'Comparing Plans',
        description: 'Compare available plans and their features. Choose the plan that best matches your business needs.',
        instruction: 'Browse the available plans. Consider your current needs and future growth when choosing a plan.',
        targetSelector: 'button[data-slot="tabs-trigger"][value="plans"]',
        tooltipPosition: 'right',
      },
      {
        id: 'subscription-best-practices',
        title: 'Subscription Tips',
        description: 'Get the most from your subscription.',
        instruction: '• Evaluate your needs before upgrading\n• Take advantage of premium features you\'re paying for\n• Monitor your subscription renewal date\n• Contact support if you need a custom plan',
        tooltipPosition: 'center',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SUBSCRIPTION PAYMENT — Plan selection, form, confirmation
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tutorial-subscription-payment',
    screenPath: '/subscription/payment',
    screenName: 'Subscription Payment',
    title: 'Subscription Payment & Billing',
    description: 'Learn how to choose a subscription plan, make payments via Telebirr, and track payment status.',
    estimatedDuration: 6,
    steps: [
      {
        id: 'payment-welcome',
        title: 'Subscription Payment Overview',
        description: 'The Payment screen guides you through three steps: selecting a plan, making a Telebirr payment, and confirming submission.',
        instruction: 'Start by choosing a plan that fits your business. Basic plans offer core features, Premium plans unlock advanced functionality.',
        tooltipPosition: 'center',
      },
      {
        id: 'payment-choose-plan',
        title: 'Choosing a Plan',
        description: 'Compare Basic and Premium plans side by side. Each card shows the plan name, price, and description.',
        instruction: 'Click on a plan card to select it. Premium plans have an amber highlight and a "Premium" badge. The price is shown in ETB per month.',
        targetSelector: 'div.grid.grid-cols-2.gap-6',
        tooltipPosition: 'bottom',
      },
      {
        id: 'payment-telebirr',
        title: 'Paying via Telebirr',
        description: 'After selecting a plan, you\'ll see payment instructions. Transfer the exact amount to the Shega Telebirr number shown.',
        instruction: 'Open your Telebirr app, send the exact amount shown to the displayed number. Click "Copy" to copy the number to your clipboard.',
        targetSelector: 'div[data-slot="card"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'payment-add-dialog',
        title: 'Payment Submission Form',
        description: 'The Payment Submission form collects Telebirr transaction details including transaction ID, business name, phone number, and payment date.',
        instruction: 'This form has fields for entering the necessary information. Take a moment to review the layout before we fill in each field step by step.',
        targetSelector: '[data-slot="dialog-content"]',
        tooltipPosition: 'top',
      },
      {
        id: 'payment-form',
        title: 'Submitting Payment Details',
        description: 'Fill in the transaction details: the Telebirr transaction ID, your business name, phone number, and payment date.',
        instruction: 'Enter the transaction ID from your Telebirr receipt (e.g. "ABC123456"). Add your business name and phone number so we can verify the payment. Date defaults to today.',
        targetSelector: 'input[data-slot="input"]',
        tooltipPosition: 'bottom',
      },
      {
        id: 'payment-confirmation',
        title: 'Payment Confirmation',
        description: 'After submitting, you\'ll see a confirmation screen. Your payment is pending verification by the Shega team.',
        instruction: 'Wait for verification (typically within 24 hours). You can return to the Subscription Dashboard or submit another payment.',
        tooltipPosition: 'center',
      },
      {
        id: 'payment-best-practices',
        title: 'Payment Best Practices',
        description: 'Ensure smooth payments with these tips.',
        instruction: '• Double-check the Telebirr number before transferring\n• Save your transaction ID for reference\n• Use your registered business name for easy verification\n• Contact support if your payment isn\'t verified within 48 hours\n• Keep your Telebirr receipt as proof of payment',
        tooltipPosition: 'center',
      },
    ],
  },
];

const fallbackTutorial: ScreenTutorial = {
  id: 'tutorial-generic',
  screenPath: '*',
  screenName: 'General',
  title: 'Screen Overview',
  description: 'Learn about the key features available on this screen.',
  estimatedDuration: 2,
  steps: [
    {
      id: 'generic-welcome',
      title: 'Getting Started',
      description: 'This screen provides tools and information to help you manage your business. Each section is designed for specific tasks.',
      instruction: 'Explore the interface. Look for buttons, tabs, and data tables that help you accomplish your tasks.',
      tooltipPosition: 'center',
    },
    {
      id: 'generic-actions',
      title: 'Available Actions',
      description: 'Look for action buttons like Add, Edit, Delete, and Export. These let you manage data on this screen.',
      instruction: 'Buttons are typically at the top of the screen. Look for the Plus icon to add new items.',
      tooltipPosition: 'center',
    },
    {
      id: 'generic-best-practices',
      title: 'Need More Help?',
      description: 'For detailed guidance, check the documentation or contact support. Every screen is designed to be intuitive.',
      instruction: 'If you\'re unsure about a feature, try it with sample data. You can always cancel or undo most actions.',
      tooltipPosition: 'center',
    },
  ],
};

export function getTutorialForPath(path: string): ScreenTutorial | undefined {
  const normalizedPath = path.split('?')[0].split('#')[0];
  const tutorial = tutorials.find((t) => {
    if (t.screenPath === normalizedPath) return true;
    if (t.screenPath.endsWith('/') && t.screenPath.length > 1) {
      return normalizedPath.startsWith(t.screenPath);
    }
    if (t.screenPath.endsWith('*')) {
      const base = t.screenPath.slice(0, -1);
      return normalizedPath.startsWith(base);
    }
    return false;
  });
  return tutorial;
}

export function getTutorialById(id: string): ScreenTutorial | undefined {
  return tutorials.find((t) => t.id === id);
}

export function getAllTutorials(): ScreenTutorial[] {
  return tutorials;
}

export { fallbackTutorial, tutorials };
