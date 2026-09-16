import { Button } from "@renderer/components/ui/button"
import { Separator } from "@renderer/components/ui/separator"
import { SidebarTrigger } from "@renderer/components/ui/sidebar"
import {
  Sun, Moon,
} from "lucide-react"
import { useSettings } from "../context/SettingsContext"
import { useLocation } from "react-router-dom"
import NotificationCenter from "./NotificationCenter"
import { GlobalSearch } from "./GlobalSearch"
import { BusinessSwitcher } from "./BusinessSwitcher"

export function SiteHeader() {
  const { theme, setTheme, t } = useSettings();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return t('tabs.dashboard');
    const segment = path.split('/')[1];
    return t('tabs.' + segment) || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

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
