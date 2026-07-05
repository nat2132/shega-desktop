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
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-30 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        <div className="flex flex-col hidden sm:flex">
          <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">{getPageTitle()}</h1>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('header.terminal_active')}</p>
        </div>

        <div className="mx-4 flex-1 max-w-md">
          <GlobalSearch />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <NotificationCenter />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="size-8 rounded-lg hover:bg-muted/50"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
