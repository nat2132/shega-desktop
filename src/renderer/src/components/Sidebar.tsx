import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, 
  Receipt, Users, BarChart3, Settings, 
  LogOut, RefreshCcw
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from '@renderer/utils/shadcn';
import logo from '../assets/logo.svg';

const Sidebar = () => {
  const { t } = useSettings();
  
  const navItems = [
    { id: 'dashboard', path: '/', icon: LayoutDashboard },
    { id: 'inventory', path: '/inventory', icon: Package },
    { id: 'sales', path: '/sales', icon: ShoppingCart },
    { id: 'logistics', path: '/adjustments', icon: RefreshCcw },
    { id: 'customers', path: '/customers', icon: Users },
    { id: 'analytics', path: '/analytics', icon: BarChart3 },
    { id: 'expense', path: '/expenses', icon: Receipt },
  ];

  return (
    <aside className="w-[80px] hidden md:flex flex-col h-full border-r bg-card/40 backdrop-blur-2xl saturate-150 border-white/10 shadow-2xl flex-shrink-0 z-40 transition-all duration-300">
      
      {/* Brand Logo */}
      <div className="pt-8 pb-12 flex justify-center">
        <div className="w-12 h-12 bg-white dark:bg-zinc-950 rounded-[14px] flex items-center justify-center shadow-lg shadow-primary/10 group cursor-pointer hover:rotate-6 transition-transform border border-border/50">
          <img src={logo} alt="Logo" className="w-8 h-8 object-contain dark:invert" />
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-4">
        {navItems.map((item) => (
          <Tooltip key={item.path} delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink
                to={item.path}
                className={({ isActive }) => cn(
                  "w-14 h-14 mx-auto flex items-center justify-center rounded-[18px] transition-all duration-300 group relative",
                  isActive 
                    ? "bg-foreground text-background shadow-xl scale-105" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon size={22} strokeWidth={2.5} className="transition-transform group-hover:scale-110" />
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-foreground text-background font-black text-[10px] uppercase tracking-widest border-none px-3 py-1.5 shadow-2xl">
              {t(`tabs.${item.id}`)}
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>

      <div className="pb-8 pt-4 space-y-4 px-3">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <NavLink
              to="/settings"
              className={({ isActive }) => cn(
                "w-14 h-14 mx-auto flex items-center justify-center rounded-[18px] transition-all duration-300 group relative",
                isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Settings size={22} strokeWidth={2.5} />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-foreground text-background font-black text-[10px] uppercase tracking-widest border-none px-3 py-1.5 shadow-2xl">
            {t('tabs.settings')}
          </TooltipContent>
        </Tooltip>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-14 h-14 mx-auto flex items-center justify-center rounded-[18px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all group"
        >
          <LogOut size={22} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
