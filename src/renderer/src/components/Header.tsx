import { Search, Bell, ChevronDown, User, LogOut, Settings, Moon, Sun } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { Button } from './ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSearch?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = () => {
  const { theme, setTheme, t } = useSettings();

  return (
    <header className="h-24 flex items-center justify-between px-8 md:px-16 lg:px-24 max-w-[1800px] mx-auto bg-card/40 backdrop-blur-2xl saturate-150 border-b border-white/10 shadow-2xl sticky top-0 z-30 transition-all">
      
      <div className="flex items-center gap-4">
        <h1 className="text-xl md:text-2xl font-black tracking-tighter text-foreground flex items-center gap-2">
          {t('header.title_part1', 'Retail')} <span className="text-muted-foreground font-medium">{t('header.title_part2', 'Inventory')}</span>
        </h1>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Currency/Region Selector */}
        <div className="hidden sm:flex items-center gap-3 px-4 py-2 h-10 rounded-xl bg-muted/50 border border-transparent cursor-pointer hover:border-border transition-all">
          <Avatar className="w-5 h-5">
             <AvatarImage src="https://flagcdn.com/w40/us.png" alt="USA" />
             <AvatarFallback>US</AvatarFallback>
          </Avatar>
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground">USD</span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </div>

        {/* Action Grid */}
        <div className="flex items-center gap-1 md:gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-xl hover:bg-muted"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? <Moon size={18} className="text-foreground" /> : <Sun size={18} className="text-foreground" />}
          </Button>

          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted">
            <Search size={18} className="text-foreground" />
          </Button>
          
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted relative">
            <Bell size={18} className="text-foreground" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[8px] font-black border-2 border-background">
              2
            </Badge>
          </Button>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-border/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="w-10 h-10 rounded-xl cursor-pointer hover:ring-4 ring-primary/10 transition-all">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl p-2">
              <DropdownMenuLabel className="px-3 py-2">
                <p className="text-xs font-black uppercase tracking-widest text-foreground">{t('header.master_admin', 'Master Admin')}</p>
                <p className="text-[10px] font-medium text-muted-foreground">admin@shega.app</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50 mx-2" />
              <DropdownMenuItem className="rounded-xl px-3 py-2.5 focus:bg-primary focus:text-primary-foreground cursor-pointer transition-colors mt-1">
                <User className="mr-3 h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('header.my_profile', 'My Profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-3 py-2.5 focus:bg-primary focus:text-primary-foreground cursor-pointer transition-colors">
                <Settings className="mr-3 h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('header.preferences', 'Preferences')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50 mx-2" />
              <DropdownMenuItem className="rounded-xl px-3 py-2.5 focus:bg-destructive focus:text-destructive-foreground cursor-pointer transition-colors text-destructive">
                <LogOut className="mr-3 h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('nav_user.terminate_session', 'Terminate Session')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
