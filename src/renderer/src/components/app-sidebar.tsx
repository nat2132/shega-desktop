import * as React from "react"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  Warehouse,
  Truck,
  Building2,
  Shield,
  PiggyBank,
  FileText,
  Sparkles,
  Crown,
  UserCog,
  Plus,
  ChevronDown,
  History,
  Boxes,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { useAuth } from "../context/AuthContext"
import { useSettings } from "../context/SettingsContext"
import { useSubscription } from "../context/SubscriptionContext"
import { NavUser } from "@renderer/components/nav-user"
import PremiumBadge from "@renderer/components/PremiumBadge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@renderer/components/ui/sidebar"
import { BrandedLogo } from "./branded-logo"
import { cn } from "@renderer/utils/shadcn"

type NavLinkItem = {
  title: string
  url: string
  icon: LucideIcon
  permission: string | null
  module?: string
  premium?: string
  superAdminOnly?: boolean
  adminOrEmployees?: boolean
  external?: boolean
}

type NavSection = {
  id: string
  title: string
  icon: LucideIcon
  defaultUrl: string
  items: NavLinkItem[]
}

const navSections: NavSection[] = [
  {
    id: 'home',
    title: 'home',
    icon: LayoutDashboard,
    defaultUrl: '/',
    items: [{ title: 'business', url: '/', icon: LayoutDashboard, permission: 'dashboard' }],
  },
  {
    id: 'sales',
    title: 'sales',
    icon: ShoppingCart,
    defaultUrl: '/sales',
    items: [
      { title: 'new_sale', url: '/register', icon: Plus, permission: 'sales.create', module: 'sales' },
      { title: 'sales_history', url: '/sales', icon: History, permission: 'sales', module: 'sales' },
    ],
  },
  {
    id: 'inventory',
    title: 'inventory',
    icon: Package,
    defaultUrl: '/inventory',
    items: [
      { title: 'products', url: '/inventory', icon: Boxes, permission: 'inventory', module: 'inventory' },
      { title: 'warehouses', url: '/warehouses', icon: Warehouse, permission: 'warehouses', module: 'warehouses' },
      { title: 'shipments', url: '/shipments', icon: Truck, permission: 'shipments', module: 'shipments', premium: 'shipments' },
      { title: 'suppliers', url: '/suppliers', icon: Building2, permission: 'suppliers', module: 'suppliers', premium: 'suppliers' },
    ],
  },
  {
    id: 'customers',
    title: 'customers',
    icon: Users,
    defaultUrl: '/customers',
    items: [
      { title: 'customers', url: '/customers', icon: Users, permission: 'customers', module: 'customers' },
      { title: 'debt_management', url: '/debt-management', icon: PiggyBank, permission: 'customers', module: 'customers' },
    ],
  },
  {
    id: 'reports',
    title: 'reports',
    icon: FileText,
    defaultUrl: '/reports',
    items: [
      { title: 'reports', url: '/reports', icon: FileText, permission: 'analytics', module: 'analytics', premium: 'reports' },
      { title: 'analytics', url: '/analytics', icon: BarChart3, permission: 'analytics', module: 'analytics' },
    ],
  },
  {
    id: 'settings',
    title: 'settings',
    icon: Settings,
    defaultUrl: '/settings',
    items: [
      { title: 'team', url: '/users', icon: UserCog, permission: 'employees', module: 'employees', premium: 'users', adminOrEmployees: true },
      { title: 'app_settings', url: '/settings', icon: Settings, permission: 'settings' },
      { title: 'subscription', url: '/subscription', icon: Crown, permission: 'dashboard' },
      { title: 'audit_logs', url: '/audit-logs', icon: Shield, permission: 'audit.view', premium: 'audit' },
      { title: 'get_help', url: 'https://shega.tech/support', icon: HelpCircle, permission: null, external: true },
    ],
  },
]

const GROUPS_STORAGE_KEY = 'shega.sidebar.groups'

function loadCollapsed(): string[] {
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

const isRouteActive = (url: string, pathname: string) =>
  url === '/' ? pathname === '/' : pathname === url || pathname.startsWith(url + '/')

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { state } = useSidebar();
  const { currentAdmin, hasPermission, isSuperAdmin } = useAuth();
  const { t, currentBusiness, isModuleEnabled } = useSettings();
  const { isPremium, isTrial } = useSubscription();

  const [collapsedIds, setCollapsedIds] = React.useState<string[]>(loadCollapsed);
  const [appVersion, setAppVersion] = React.useState('');

  React.useEffect(() => {
    window.api?.getAppVersion().then(setAppVersion).catch(() => {});
  }, []);

  React.useEffect(() => {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(collapsedIds));
  }, [collapsedIds]);

  // Auto-expand the section that contains the active route.
  React.useEffect(() => {
    const active = navSections.find((s) => s.items.some((i) => !i.external && isRouteActive(i.url, location.pathname)));
    if (active) {
      setCollapsedIds((prev) => prev.filter((id) => id !== active.id));
    }
  }, [location.pathname]);

  const visibleSections = React.useMemo(
    () =>
      navSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => {
            if (item.superAdminOnly) return isSuperAdmin;
            if (item.adminOrEmployees) {
              if (isSuperAdmin) return true;
              if (item.permission && !hasPermission(item.permission)) return false;
              if (item.module && !isModuleEnabled(item.module)) return false;
              return true;
            }
            if (item.permission && !hasPermission(item.permission)) return false;
            if (item.module && !isModuleEnabled(item.module)) return false;
            return true;
          }),
        }))
        .filter((section) => section.items.length > 0),
    [hasPermission, isModuleEnabled, isSuperAdmin]
  );

  const user = {
    name: currentAdmin?.name || t('common.unknown'),
    email: currentAdmin?.isEmployee
      ? (currentAdmin.role || t('common.employee'))
      : currentAdmin?.role === 'super_admin'
        ? t('common.super_admin')
        : t('common.admin'),
    avatar: currentAdmin?.avatar || "",
  };

  const sectionActive = (section: NavSection) =>
    section.items.some((item) => !item.external && isRouteActive(item.url, location.pathname));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/" className="gap-3">
                <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
                  <BrandedLogo size="xs" logoSrc={currentBusiness?.logo} />
                </div>
                <div className="flex flex-col gap-0 leading-none group-data-[collapsible=icon]:hidden">
                  <span className="text-xs font-semibold tracking-tight">{currentBusiness?.businessName || t('common.app_name')}</span>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">{t('common.terminal_version', { version: appVersion })}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        </SidebarHeader>

      <SidebarContent className="px-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <SidebarMenu className="gap-3 py-2">
            {visibleSections.map((section) => {
              const isOpen = !collapsedIds.includes(section.id);
              const active = sectionActive(section);
              const label = t(`tabs.${section.title}`);

              // Icon mode: sections become single navigation icons.
              if (state === 'collapsed') {
                return (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton asChild size="default" isActive={active} tooltip={label} className="transition-all duration-200 hover:bg-accent/30">
                      <Link to={section.defaultUrl} aria-label={label}>
                        <section.icon className="size-[18px]" />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              return (
                <SidebarMenuItem key={section.id}>
                  <SidebarMenuButton
                    size="default"
                    onClick={() => setCollapsedIds((prev) => (isOpen ? [...prev, section.id] : prev.filter((id) => id !== section.id)))}
                    isActive={active}
                    className={cn(
                      'relative overflow-hidden transition-all duration-200',
                      active && 'bg-accent/60 font-medium',
                      !active && 'hover:bg-accent/30'
                    )}
                  >
                    <section.icon className="size-[18px]" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/90">{label}</span>
                    <ChevronDown className={cn('ml-auto size-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200', !isOpen && '-rotate-90')} />
                  </SidebarMenuButton>

                  {isOpen && (
                    <SidebarMenuSub className="mt-1">
                      {section.items.map((item) => {
                        const isLocked = item.premium && !isPremium && !isTrial;
                        const itemActive = !item.external && isRouteActive(item.url, location.pathname);
                        const itemLabel = t(`tabs.${item.title}`);
                        const inner = item.external ? (
                          <button onClick={() => window.api.openExternal(item.url)} className="flex w-full items-center gap-2 text-left">
                            <item.icon className="size-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{itemLabel}</span>
                          </button>
                        ) : (
                          <Link to={item.url} className="flex w-full items-center gap-2">
                            <item.icon className="size-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{itemLabel}</span>
                            {isLocked && <PremiumBadge size="sm" showIcon={false} className="ml-auto" />}
                            {item.title === 'subscription' && (isPremium || isTrial) && (
                              <Sparkles className="ml-auto h-3 w-3 text-amber-500" />
                            )}
                          </Link>
                        );
                        return (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild size="sm" isActive={itemActive} className={cn(isLocked && 'opacity-60')}>
                              {inner}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </motion.div>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/30">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}