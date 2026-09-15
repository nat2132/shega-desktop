import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ShoppingCart, Receipt, Users, LayoutGrid } from 'lucide-react';
import { cn } from '../../utils/shadcn';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const POS_ICON_SIZE = 24;

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  permission: string | null;
  module?: string;
}

const navItems: NavItem[] = [
  { id: 'pos', label: 'POS', path: '/pos', icon: ShoppingCart, permission: 'sales.create' },
  { id: 'mySales', label: 'My Sales', path: '/cashier/sales', icon: Receipt, permission: 'sales.viewOwn' },
  { id: 'customers', label: 'Customers', path: '/cashier/customers', icon: Users, permission: 'customers.view', module: 'customers' },
];

export function CashierNav() {
  const { hasPermission } = useAuth();
  const { isModuleEnabled } = useSettings();

  const filtered = navItems.filter((item) => {
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.module && !isModuleEnabled(item.module)) return false;
    return true;
  });

  return (
    <>
      {/* Desktop rail */}
      <nav className="hidden md:flex w-20 shrink-0 flex-col items-center gap-3 border-r bg-background/60 py-4">
        {filtered.map((item) => (
          <RailButton key={item.id} item={item} />
        ))}
      </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch border-t bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        {filtered.map((item) => (
          <MobileTab key={item.id} item={item} />
        ))}
      </nav>
    </>
  );
}

function RailButton({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        cn(
          'relative flex size-14 items-center justify-center rounded-2xl transition-all duration-200',
          isActive
            ? 'bg-foreground text-background shadow-lg shadow-foreground/20'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon size={POS_ICON_SIZE} strokeWidth={isActive ? 2.4 : 2} />
          {isActive && <span className="absolute -left-1 h-5 w-1 rounded-full bg-foreground" />}
          <span className="sr-only">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function MobileTab({ item }: { item: NavItem }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  return (
    <NavLink
      to={item.path}
      className={cn(
        'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors',
        isActive ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      <item.icon size={22} strokeWidth={isActive ? 2.4 : 2} />
      {item.label}
    </NavLink>
  );
}