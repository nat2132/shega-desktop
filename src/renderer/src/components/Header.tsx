import { useState } from 'react';
import { Search, Bell, ChevronDown, User, LogOut, Settings, Moon, Sun, Camera, Check } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';
import defaultAvatar from "../assets/company.png"

// Import profile images
const profileImages = (import.meta as any).glob('../assets/profile/*.png', { eager: true, import: 'default' });
const AVATAR_OPTIONS = Object.values(profileImages) as string[];

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSearch?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = () => {
  const { theme, setTheme, t } = useSettings();
  const { currentAdmin, isSuperAdmin, logout, refreshAdmin } = useAuth();
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);

  const initials = (currentAdmin?.name || currentAdmin?.username || 'Admin')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const resolveAvatar = (avatarValue: string | null | undefined) => {
    const val = avatarValue || "";
    if (!val) return defaultAvatar;
    if (val.includes('/') || val.includes('data:')) return val;
    const found = AVATAR_OPTIONS.find(opt => opt.toLowerCase().includes(val.toLowerCase()));
    return found || defaultAvatar;
  };

  const currentAvatar = resolveAvatar(currentAdmin?.avatar);

  const handleAvatarSelect = async (avatarPath: string) => {
    if (!currentAdmin) return;
    try {
      const filename = avatarPath.split('/').pop()?.split('?')[0];
      if (!filename) return;
      await window.api.updateAdmin(currentAdmin.id, { avatar: filename });
      await refreshAdmin();
      setIsAvatarOpen(false);
      toast.success(t('settings.avatar_updated', 'Profile image updated'));
    } catch (err) {
      console.error('Failed to update avatar:', err);
      toast.error(t('settings.avatar_error', 'Failed to update avatar'));
    }
  };

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
          <span className="text-xs font-black uppercase tracking-widest text-foreground">USD</span>
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
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs font-black border-2 border-background">
              2
            </Badge>
          </Button>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-border/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="w-10 h-10 rounded-full cursor-pointer hover:ring-4 ring-primary/10 transition-all">
                <AvatarImage src={currentAvatar} alt={initials} />
                <AvatarFallback className="rounded-full bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl p-2">
              <DropdownMenuLabel className="px-3 py-2">
                <p className="text-xs font-black uppercase tracking-widest text-foreground">{currentAdmin?.name || 'Master Admin'}</p>
                <p className="text-xs font-medium text-muted-foreground">@{currentAdmin?.username || 'admin'}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50 mx-2" />
              <DropdownMenuItem onClick={() => setIsAvatarOpen(true)} className="rounded-xl px-3 py-2.5 focus:bg-primary focus:text-primary-foreground cursor-pointer transition-colors mt-1">
                <Camera className="mr-3 h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">{t('nav_user.update_profile_image', 'Update Profile Image')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-3 py-2.5 focus:bg-primary focus:text-primary-foreground cursor-pointer transition-colors">
                <Settings className="mr-3 h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">{t('header.preferences', 'Preferences')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50 mx-2" />
              <DropdownMenuItem onClick={logout} className="rounded-xl px-3 py-2.5 focus:bg-destructive focus:text-destructive-foreground cursor-pointer transition-colors text-destructive">
                <LogOut className="mr-3 h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">{t('nav_user.terminate_session', 'Terminate Session')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={isAvatarOpen} onOpenChange={setIsAvatarOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest">{t('nav_user.select_avatar', 'Select Profile Identity')}</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('nav_user.avatar_description', 'Choose an avatar that reflects your security clearance.')}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto px-1">
            <div className="grid grid-cols-5 gap-3 py-4">
              {AVATAR_OPTIONS.map((avatar, idx) => {
                const isSelected = currentAvatar === avatar;
                return (
                  <div
                    key={idx}
                    onClick={() => handleAvatarSelect(avatar)}
                    className={`
                      relative group cursor-pointer aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300
                      ${isSelected ? 'border-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]' : 'border-border/50 hover:border-primary/50'}
                    `}
                  >
                    <img
                      src={avatar}
                      alt={`Avatar ${idx + 1}`}
                      className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${isSelected ? '' : 'grayscale group-hover:grayscale-0'}`}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="text-primary-foreground size-5" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-border/20">
            <Button variant="outline" onClick={() => setIsAvatarOpen(false)} className="text-xs font-black uppercase tracking-widest h-8">
              {t('common.cancel', 'Cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;