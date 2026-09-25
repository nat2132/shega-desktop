import { Button } from "@renderer/components/ui/button"
import { Separator } from "@renderer/components/ui/separator"
import { SidebarTrigger } from "@renderer/components/ui/sidebar"
import {
  Sun, Moon, AlertTriangle, Clock, Hourglass, XCircle,
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
  const { isReadOnly, isTrial, daysRemaining, status } = useSubscription();

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
    if (!isReadOnly && !isTrial) return null;
    if (isTrial) {
      return { icon: Clock, tone: 'text-violet-500 bg-violet-500/10', text: t('subscription.trial_banner', 'Trial active') };
    }
    if (status === 'pending_payment') {
      return { icon: Hourglass, tone: 'text-amber-500 bg-amber-500/10', text: t('subscription.payment_pending', 'Payment pending approval') };
    }
    if (status === 'payment_rejected') {
      return { icon: XCircle, tone: 'text-red-500 bg-red-500/10', text: t('subscription.payment_rejected', 'Payment rejected') };
    }
    return {
      icon: AlertTriangle,
      tone: 'text-amber-500 bg-amber-500/10',
      text: daysRemaining > 0
        ? t('subscription.read_only_expiring', `View only — ${daysRemaining} days left, renew to edit`)
        : t('subscription.read_only', 'View only — renew to edit'),
    };
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
            onClick={() => navigate('/subscription')}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-widest ${banner.tone} hover:opacity-80 transition-opacity`}
          >
            <banner.icon className="size-3.5" />
            <span className="max-w-[220px] truncate">{banner.text}</span>
            <span className="underline underline-offset-2">
              {isTrial ? t('subscription.upgrade', 'Upgrade') : t('subscription.renew', 'Renew')}
            </span>
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
