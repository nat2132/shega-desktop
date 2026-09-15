import { useMemo } from "react"
import { LogOut, MoreVertical, Crown, UserRoundCog } from "lucide-react"

import { useAuth } from "../context/AuthContext"
import { useSettings } from "../context/SettingsContext"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@renderer/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
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
import { resolveAvatar } from "../lib/avatar"

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
  const { logout, currentAdmin, isSuperAdmin } = useAuth()
  const { t } = useSettings()

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const currentAvatar = useMemo(
    () => resolveAvatar(currentAdmin?.avatar, user.avatar),
    [currentAdmin?.avatar, user.avatar]
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group"
            >
              <Avatar className="h-8 w-8 rounded-full transition-all duration-500 border border-border/80 ring-1 ring-sidebar-foreground/10 shadow-sm group-hover:scale-105">
                <AvatarImage src={currentAvatar} alt={user.name} />
                <AvatarFallback className="rounded-full bg-primary text-primary-foreground font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-semibold text-xs uppercase tracking-widest">{user.name}</span>
                  {isSuperAdmin && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
                </div>
                <span className="truncate text-xs text-muted-foreground uppercase tracking-widest">
                  {user.email}
                </span>
              </div>
              <MoreVertical className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
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
                <Avatar className="h-9 w-9 rounded-full grayscale ring-1 ring-sidebar-border">
                  <AvatarImage src={currentAvatar} alt={user.name} />
                  <AvatarFallback className="rounded-full bg-primary text-primary-foreground font-black">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold text-xs uppercase tracking-widest">{user.name}</span>
                    {isSuperAdmin && <Crown className="h-3 w-3 text-amber-500" />}
                  </div>
                  <span className="truncate text-xs text-muted-foreground uppercase tracking-widest">
                    @{currentAdmin?.username || t('common.unknown', 'Unknown')}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-3 py-2">
              <Badge
                variant={isSuperAdmin ? "default" : "outline"}
                className="text-xs font-black uppercase tracking-widest w-full justify-center py-1"
              >
                {isSuperAdmin ? '★ ' + t('common.super_admin', 'Super Admin') : currentAdmin?.isEmployee ? currentAdmin.role : t('common.admin', 'Admin')}
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs font-medium uppercase tracking-widest cursor-pointer"
              onClick={logout}
            >
              <UserRoundCog className="size-4 mr-2" />
              {t('nav_user.switch_user', 'Switch User')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs font-medium uppercase tracking-widest text-destructive cursor-pointer"
              onClick={logout}
            >
              <LogOut className="size-4 mr-2" />
              {t('nav_user.terminate_session', 'Terminate Session')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}