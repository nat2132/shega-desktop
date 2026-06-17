import { Button } from "@renderer/components/ui/button"
import { Separator } from "@renderer/components/ui/separator"
import { SidebarTrigger } from "@renderer/components/ui/sidebar"
import {
  Sun, Moon,
  Building2
} from "lucide-react"
import { useSettings } from "../context/SettingsContext"
import { useLocation } from "react-router-dom"
import NotificationCenter from "./NotificationCenter"

export function SiteHeader() {
  const { theme, setTheme, currentBusiness, t } = useSettings();
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

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-muted/20">
          <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Building2 size={12} strokeWidth={3} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-black uppercase tracking-tight truncate max-w-[100px] lg:max-w-[150px]">{currentBusiness?.businessName}</span>
            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-muted-foreground truncate">{currentBusiness?.storeName}</span>
          </div>
        </div>

        <div className="ml-4 flex flex-col hidden sm:flex">
          <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">{getPageTitle()}</h1>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('header.terminal_active')}</p>
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
