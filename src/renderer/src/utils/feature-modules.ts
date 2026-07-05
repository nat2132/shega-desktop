export const ALL_MODULES = [
  'inventory',
  'sales',
  'expenses',
  'customers',
  'analytics',
  'warehouses',
  'employees',
  'shipments',
  'suppliers',
  'adjustments',
] as const;

export type FeatureModuleId = (typeof ALL_MODULES)[number];

export const PREMIUM_FEATURES = [
  'employees',
  'users',
  'audit',
  'suppliers',
  'shipments',
  'reports',
] as const;

export type PremiumFeatureId = (typeof PREMIUM_FEATURES)[number];

export interface ModuleMeta {
  id: FeatureModuleId;
  iconName: string;
  nameKey: string;
  descKey: string;
  benefitKey: string;
  isPremium?: boolean;
}

export const MODULE_META: ModuleMeta[] = [
  { id: 'inventory', iconName: 'Package', nameKey: 'onboarding.module.inventory.name', descKey: 'onboarding.module.inventory.desc', benefitKey: 'onboarding.module.inventory.benefit' },
  { id: 'sales', iconName: 'ShoppingCart', nameKey: 'onboarding.module.sales.name', descKey: 'onboarding.module.sales.desc', benefitKey: 'onboarding.module.sales.benefit' },
  { id: 'expenses', iconName: 'Receipt', nameKey: 'onboarding.module.expenses.name', descKey: 'onboarding.module.expenses.desc', benefitKey: 'onboarding.module.expenses.benefit' },
  { id: 'customers', iconName: 'Users', nameKey: 'onboarding.module.customers.name', descKey: 'onboarding.module.customers.desc', benefitKey: 'onboarding.module.customers.benefit' },
  { id: 'analytics', iconName: 'BarChart3', nameKey: 'onboarding.module.analytics.name', descKey: 'onboarding.module.analytics.desc', benefitKey: 'onboarding.module.analytics.benefit', isPremium: true },
  { id: 'warehouses', iconName: 'Warehouse', nameKey: 'onboarding.module.warehouses.name', descKey: 'onboarding.module.warehouses.desc', benefitKey: 'onboarding.module.warehouses.benefit' },
  { id: 'employees', iconName: 'UserCog', nameKey: 'onboarding.module.employees.name', descKey: 'onboarding.module.employees.desc', benefitKey: 'onboarding.module.employees.benefit', isPremium: true },
  { id: 'shipments', iconName: 'Truck', nameKey: 'onboarding.module.shipments.name', descKey: 'onboarding.module.shipments.desc', benefitKey: 'onboarding.module.shipments.benefit', isPremium: true },
  { id: 'suppliers', iconName: 'Building2', nameKey: 'onboarding.module.suppliers.name', descKey: 'onboarding.module.suppliers.desc', benefitKey: 'onboarding.module.suppliers.benefit', isPremium: true },
  { id: 'adjustments', iconName: 'SlidersHorizontal', nameKey: 'onboarding.module.adjustments.name', descKey: 'onboarding.module.adjustments.desc', benefitKey: 'onboarding.module.adjustments.benefit' },
];

export const NAV_ITEM_MODULE: Record<string, string> = {
  inventory: 'inventory',
  sales: 'sales',
  orders: 'sales',
  expense: 'expenses',
  customers: 'customers',
  debt_management: 'customers',
  analytics: 'analytics',
  warehouses: 'warehouses',
  users_employees: 'employees',
  employees: 'employees',
  shipments: 'shipments',
  suppliers: 'suppliers',
  logistics: 'adjustments',
  reports: 'analytics',
  budgets: 'expenses',
  contacts: 'customers',
};

export const NAV_ITEM_PREMIUM: Record<string, string> = {
  employees: 'employees',
  users: 'users',
  shipments: 'shipments',
  suppliers: 'suppliers',
  reports: 'reports',
};

export const ROUTE_MODULE: Record<string, string> = {
  '/inventory': 'inventory',
  '/sales': 'sales',
  '/sales/:id': 'sales',
  '/orders': 'sales',
  '/orders/:id': 'sales',
  '/expenses': 'expenses',
  '/customers': 'customers',
  '/analytics': 'analytics',
  '/adjustments': 'adjustments',
  '/warehouses': 'warehouses',
  '/employees': 'employees',
  '/users': 'employees',
  '/shipments': 'shipments',
  '/suppliers': 'suppliers',
  '/debt-management': 'customers',
  '/reports': 'analytics',
  '/budgets': 'expenses',
  '/contacts': 'customers',
};

export const ROUTE_PREMIUM: Record<string, string> = {
  '/employees': 'employees',
  '/users': 'users',
  '/shipments': 'shipments',
  '/suppliers': 'suppliers',
  '/reports': 'reports',
};
