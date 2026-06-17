import { useState, useMemo } from "react"
import {
  User as UserIcon,
  CreditCard,
  Bell,
  LogOut,
  MoreVertical,
  ShieldCheck,
  Crown,
  Camera,
  Check
} from "lucide-react"

import { useAuth } from "../context/AuthContext"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@renderer/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@renderer/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@renderer/components/ui/sidebar"
import { Badge } from "@renderer/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@renderer/components/ui/dialog"
import { Button } from "@renderer/components/ui/button"

// Import profile images
const profileImages = import.meta.glob('../assets/profile/*.png', { eager: true, import: 'default' });
const AVATAR_OPTIONS = Object.values(profileImages) as string[];

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { logout, currentAdmin, isSuperAdmin, refreshAdmin } = useAuth()
  const [isAvatarOpen, setIsAvatarOpen] = useState(false)
  const [showSecurity, setShowSecurity] = useState(false)
  const [showPriority, setShowPriority] = useState(false)

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Helper to resolve avatar path (either full path or filename)
  const resolveAvatar = (avatarValue: string | null | undefined) => {
    const val = avatarValue || user.avatar;
    if (!val) return "/avatars/admin.jpg";
    
    // If it's already a full path/URL from Vite or a base path, return it
    if (val.includes('/') || val.includes('data:')) return val;
    
    // If it's just a filename, find it in our options
    const found = AVATAR_OPTIONS.find(opt => opt.toLowerCase().includes(val.toLowerCase()));
    return found || "/avatars/admin.jpg";
  };

  const currentAvatar = useMemo(() => resolveAvatar(currentAdmin?.avatar), [currentAdmin?.avatar, user.avatar]);

  const handleAvatarSelect = async (avatarPath: string) => {
    if (!currentAdmin) return;
    try {
      // Save just the filename for better persistence across sessions
      const filename = avatarPath.split('/').pop()?.split('?')[0]; 
      if (!filename) return;
      
      await window.api.updateAdmin(currentAdmin.id, { avatar: filename });
      await refreshAdmin();
      setIsAvatarOpen(false);
    } catch (err) {
      console.error('Failed to update avatar:', err);
    }
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group"
              >
                <Avatar className="h-8 w-8 rounded-lg transition-all duration-500 border border-border/50 shadow-sm group-hover:scale-105">
                  <AvatarImage src={currentAvatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold text-[10px] uppercase tracking-widest">{user.name}</span>
                    {isSuperAdmin && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
                  </div>
                  <span className="truncate text-[8px] text-muted-foreground uppercase tracking-widest">
                    {user.email}
                  </span>
                </div>
                <MoreVertical className="ml-auto size-4 text-muted-foreground" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 px-3 py-2.5 text-left text-sm">
                  <Avatar className="h-9 w-9 rounded-lg grayscale">
                    <AvatarImage src={currentAvatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-black">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-semibold text-[10px] uppercase tracking-widest">{user.name}</span>
                      {isSuperAdmin && <Crown className="h-3 w-3 text-amber-500" />}
                    </div>
                    <span className="truncate text-[8px] text-muted-foreground uppercase tracking-widest">
                      @{currentAdmin?.username || 'unknown'}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-3 py-2">
                <Badge 
                  variant={isSuperAdmin ? "default" : "outline"} 
                  className="text-[8px] font-black uppercase tracking-widest w-full justify-center py-1"
                >
                  {isSuperAdmin ? '★ Super Admin' : currentAdmin?.isEmployee ? currentAdmin.role : 'Admin'}
                </Badge>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  className="text-[10px] font-medium uppercase tracking-widest cursor-pointer"
                  onClick={() => setIsAvatarOpen(true)}
                >
                  <Camera className="size-4 mr-2" />
                  Update Profile Image
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[10px] font-medium uppercase tracking-widest" onClick={() => setShowSecurity(true)}>
                  <UserIcon className="size-4 mr-2" />
                  Security Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[10px] font-medium uppercase tracking-widest" onClick={() => setShowPriority(true)}>
                  <Bell className="size-4 mr-2" />
                  Priority Alerts
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-[10px] font-medium uppercase tracking-widest text-destructive cursor-pointer"
                onClick={logout}
              >
                <LogOut className="size-4 mr-2" />
                Terminate Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={isAvatarOpen} onOpenChange={setIsAvatarOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest">Select Profile Identity</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Choose an avatar that reflects your security clearance.
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
            <Button 
              variant="outline" 
              onClick={() => setIsAvatarOpen(false)}
              className="text-[10px] font-black uppercase tracking-widest h-8"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSecurity} onOpenChange={setShowSecurity}>
        <DialogContent className="sm:max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tight">Security Profile</DialogTitle>
            <DialogDescription className="text-xs font-medium">
              Manage your account security settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm">
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
              <span className="font-bold">Two-Factor Authentication</span>
              <span className="text-xs text-muted-foreground">Coming soon</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
              <span className="font-bold">Session Management</span>
              <span className="text-xs text-muted-foreground">Coming soon</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
              <span className="font-bold">Audit Log</span>
              <span className="text-xs text-muted-foreground">Track account activity</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPriority} onOpenChange={setShowPriority}>
        <DialogContent className="sm:max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tight">Priority Alerts</DialogTitle>
            <DialogDescription className="text-xs font-medium">
              Configure which alerts you want to receive.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm">
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
              <div>
                <p className="font-bold">Low Stock Alerts</p>
                <p className="text-[10px] text-muted-foreground">When items run below threshold</p>
              </div>
              <div className="w-9 h-5 rounded-full bg-primary" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
              <div>
                <p className="font-bold">Overdue Payments</p>
                <p className="text-[10px] text-muted-foreground">When debts pass due date</p>
              </div>
              <div className="w-9 h-5 rounded-full bg-primary" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
              <div>
                <p className="font-bold">Expiry Reminders</p>
                <p className="text-[10px] text-muted-foreground">Items approaching expiry</p>
              </div>
              <div className="w-9 h-5 rounded-full bg-muted" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
