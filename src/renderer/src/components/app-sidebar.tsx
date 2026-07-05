import * as React from "react"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ShoppingBag,
  Receipt,
  Users,
  BarChart3,
  SlidersHorizontal,
  Settings,
  HelpCircle,
  Warehouse,
  Truck,
  Building2,
  Shield,
  PiggyBank,
  Bell,
  FileText,
  Contact,
  PieChart,
  Sparkles,
  Crown,
  UserCog,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { useAuth } from "../context/AuthContext"
import { useSettings } from "../context/SettingsContext"
import { useSubscription } from "../context/SubscriptionContext"
import { NAV_ITEM_MODULE, NAV_ITEM_PREMIUM } from "../utils/feature-modules"
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
} from "@renderer/components/ui/sidebar"

const navMain = [
  { title: "dashboard", url: "/", icon: LayoutDashboard, permission: "dashboard" },
  { title: "inventory", url: "/inventory", icon: Package, permission: "inventory" },
  { title: "sales", url: "/sales", icon: ShoppingCart, permission: "sales" },
  { title: "expense", url: "/expenses", icon: Receipt, permission: "expenses" },
  { title: "customers", url: "/customers", icon: Users, permission: "customers" },
  { title: "orders", url: "/orders", icon: ShoppingBag, permission: "orders.view" },
  { title: "debt_management", url: "/debt-management", icon: PiggyBank, permission: "customers" },
  { title: "analytics", url: "/analytics", icon: BarChart3, permission: "analytics" },
  { title: "warehouses", url: "/warehouses", icon: Warehouse, permission: "warehouses" },
  { title: "users_employees", url: "/users", icon: Users, permission: "employees" },
  { title: "employees", url: "/employees", icon: UserCog, permission: "employees" },
  { title: "shipments", url: "/shipments", icon: Truck, permission: "shipments" },
  { title: "suppliers", url: "/suppliers", icon: Building2, permission: "suppliers" },
  { title: "logistics", url: "/adjustments", icon: SlidersHorizontal, permission: "adjustments" },
  { title: "reports", url: "/reports", icon: FileText, permission: "analytics" },
  { title: "budgets", url: "/budgets", icon: PieChart, permission: "expenses" },
  { title: "contacts", url: "/contacts", icon: Contact, permission: "customers" },
  { title: "subscription", url: "/subscription", icon: Crown, permission: "dashboard" },
]

const navSecondary = [
  { title: "reminders", url: "/reminders", icon: Bell, permission: "dashboard" },
  { title: "audit_logs", url: "/audit-logs", icon: Shield, permission: "audit.view" },
  { title: "settings", url: "/settings", icon: Settings, permission: "settings" },
  { title: "get_help", url: "https://shega.tech/support", icon: HelpCircle, permission: null },
]

import { BrandedLogo } from "./branded-logo"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { currentAdmin, hasPermission } = useAuth();
  const { t, currentBusiness, isModuleEnabled } = useSettings();
  const { isPremium, isTrial } = useSubscription();

  const filteredMain = navMain.filter(item => {
    if (!hasPermission(item.permission)) return false;
    const moduleId = NAV_ITEM_MODULE[item.title];
    return !moduleId || isModuleEnabled(moduleId);
  });
  const filteredSecondary = navSecondary.filter(item => {
    if (item.permission && !hasPermission(item.permission)) return false;
    return true;
  });

  const user = {
    name: currentAdmin?.name || t('common.unknown'),
    email: currentAdmin?.isEmployee
      ? (currentAdmin.role || t('common.employee'))
      : currentAdmin?.role === 'super_admin'
        ? t('common.super_admin')
        : t('common.admin'),
    avatar: currentAdmin?.avatar || "/avatars/admin.jpg",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props} className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <BrandedLogo size="sm" logoSrc={currentBusiness?.logo} />
                <div className="flex flex-col gap-0.5 leading-none ml-2">
                  <span className="font-bold uppercase tracking-tighter text-sm">{currentBusiness?.businessName || t('common.app_name')}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{t('common.terminal_version')}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarMenu>
          <div className="space-y-1 py-4">
            <p className="px-4 text-[9px] font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-2">{t('tabs.main_terminal')}</p>
            {filteredMain.map((item) => {
              const isPremiumItem = NAV_ITEM_PREMIUM[item.title];
              const isLocked = isPremiumItem && !isPremium && !isTrial;
              return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={location.pathname === item.url}
                  className={`transition-all duration-200 hover:bg-muted/50 active:scale-95 ${isLocked ? 'opacity-60' : ''}`}
                >
                  <Link to={item.url} className="flex items-center gap-3">
                    <item.icon className="size-4" />
                    <span className="text-[10px] font-medium uppercase tracking-widest">{t(`tabs.${item.title}` as any)}</span>
                    {isPremiumItem && !isPremium && !isTrial && (
                      <PremiumBadge size="sm" showIcon={false} className="ml-auto" />
                    )}
                    {item.title === 'subscription' && (isPremium || isTrial) && (
                      <Sparkles className="h-2.5 w-2.5 text-amber-500 ml-auto" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )})}
          </div>

          <div className="space-y-1 py-4">
            <p className="px-4 text-[9px] font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-2">{t('tabs.system_config')}</p>
            {filteredSecondary.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={location.pathname === item.url}
                  className="transition-all duration-200 hover:bg-muted/50 active:scale-95"
                >
                  {item.url.startsWith('http') ? (
                    <button onClick={() => window.api.openExternal(item.url)} className="flex items-center gap-3 w-full">
                      <item.icon className="size-4" />
                      <span className="text-[10px] font-medium uppercase tracking-widest">{t(`tabs.${item.title}` as any)}</span>
                    </button>
                  ) : (
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="size-4" />
                      <span className="text-[10px] font-medium uppercase tracking-widest">{t(`tabs.${item.title}` as any)}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </div>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border/50">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
