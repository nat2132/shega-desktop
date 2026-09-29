import { Button } from "@renderer/components/ui/button"
import { Separator } from "@renderer/components/ui/separator"
import { SidebarTrigger } from "@renderer/components/ui/sidebar"
import {
  Sun, Moon, AlertTriangle, Clock, Crown,
} from "lucide-react"
import { useSettings } from "../context/SettingsContext"
import { useLocation, useNavigate } from "react-router-dom"
import NotificationCenter from "./NotificationCenter"
import { GlobalSearch } from "./GlobalSearch"
import { BusinessSwitcher } from "./BusinessSwitcher"
import { useSubscription } from "../context/SubscriptionContext"

export function SiteHeader() {
  const { theme, setTheme, t } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const { isReadOnly, isTrial, isExpired, daysRemaining, status, renewalInfo } = useSubscription();

  // A payment that has been submitted but not yet confirmed lands in a pending
  // status. While that is true we must not keep sending the user to the payment
  // screen, which would let them pay twice.
  const hasPendingSubscription = renewalInfo?.status === 'pending';

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return t('tabs.dashboard');
    const segment = path.split('/')[1];
    if (!segment) return t('tabs.dashboard');
    const label = t('tabs.' + segment);
    return label || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const banner = (() => {
    if (location.pathname.startsWith('/subscription')) return null;
    if (isTrial) {
      return {
        icon: Crown,
        tone: 'text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20',
        text: 'Trial Active',
        action: 'Upgrade Now',
      };
    }
    if (isReadOnly || isExpired) {
      return {
        icon: AlertTriangle,
        tone: 'text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20',
        text: 'Subscription Expired',
        action: 'Renew Now',
      };
    }
    if (daysRemaining <= 7 && daysRemaining > 0) {
      return {
        icon: Clock,
        tone: 'text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20',
        text: `${daysRemaining} Days Left`,
        action: 'Renew',
      };
    }
    return null;
  })();

  return (
    <header className="apple-frost flex h-(--header-height) shrink-0 items-center gap-2 sticky top-0 z-30 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-1 data-[orientation=vertical]:h-5"
        />

        <div className="flex flex-col">
          <h1 className="text-xs font-semibold tracking-tight text-foreground">{getPageTitle()}</h1>
          <p className="text-xs font-medium text-muted-foreground/60">{t('header.terminal_active')}</p>
        </div>

        {banner && (
          <button
            onClick={() => navigate(banner.action && !hasPendingSubscription ? '/subscription/payment' : '/subscription')}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-wider ${banner.tone} transition-all shadow-sm`}
          >
            <banner.icon className="size-3.5 shrink-0" />
            <span>{banner.text}</span>
            {banner.action && (
              <span className="bg-amber-500 text-black px-2 py-0.5 rounded-md text-[10px] font-extrabold ml-1 shadow-sm">
                {banner.action}
              </span>
            )}
          </button>
        )}

        <BusinessSwitcher />

        <div className="mx-3 flex-1 max-w-sm">
          <GlobalSearch />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <NotificationCenter />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="size-8 rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-accent/50"
          >
            {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
