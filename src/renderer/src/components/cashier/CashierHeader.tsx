import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, Lock, LogOut, Receipt, Store, CircleDollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCashier } from '../../context/CashierContext';
import { BrandedLogo } from '../branded-logo';
import { useSettings } from '../../context/SettingsContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { resolveAvatar } from '../../lib/avatar';

interface CashierHeaderProps {
  onOpenShiftUi: () => void;
  onCloseShiftUi: () => void;
}

export function CashierHeader({ onOpenShiftUi, onCloseShiftUi }: CashierHeaderProps) {
  const { currentAdmin, logout } = useAuth();
  const { register, registers, setRegister, shift, shiftLoading } = useCashier();
  const { t, currentBusiness } = useSettings();
  const [synced, setSynced] = useState(true);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const st = await window.api?.syncStatus?.();
        if (mounted && st) setSynced(!st.offline);
      } catch {
        if (mounted) setSynced(true);
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const initials = (currentAdmin?.name || 'C')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = currentAdmin?.isEmployee
    ? (currentAdmin.roleKey || currentAdmin.role || 'cashier').replace(/_/g, ' ').toUpperCase()
    : t('common.profile', 'Cashier');

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-xl sticky top-0 z-40 px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
            <BrandedLogo size="xs" logoSrc={currentBusiness?.logo} />
          </div>
          <span className="text-sm font-bold tracking-tight hidden sm:block">
            {currentBusiness?.businessName || 'Shega'}
          </span>
        </div>
      </div>

      {/* Register selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="ml-2 h-9 gap-1.5 rounded-full border-border/60 text-xs font-semibold">
            <Store className="size-3.5 text-muted-foreground" />
            {register?.name || 'No Register'}
            <ChevronDown className="size-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 rounded-xl">
          <DropdownMenuLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {t('cashier.select_register', 'Select Register')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {registers.map((r) => (
            <DropdownMenuItem key={r.id} onClick={() => setRegister(r)} className="gap-2">
              <Store className="size-4" />
              <span className="flex-1">{r.name}</span>
              {register?.id === r.id && <Badge className="h-5 px-1.5 text-[10px]">✓</Badge>}
            </DropdownMenuItem>
          ))}
          {registers.length === 0 && (
            <DropdownMenuItem disabled className="text-sm text-muted-foreground">
              No registers configured
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sync status */}
      <Badge
        variant="outline"
        className="ml-2 h-6 gap-1.5 rounded-full text-[11px] font-semibold border-border/60"
      >
        <span className={`size-1.5 rounded-full ${synced ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        {synced ? 'Synced' : 'Offline'}
      </Badge>

      {/* Shift status */}
      {!shiftLoading && (
        shift ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCloseShiftUi}
            className="ml-1 h-9 gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-semibold"
          >
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Shift Open
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenShiftUi}
            className="ml-1 h-9 gap-1.5 rounded-full text-xs font-semibold"
          >
            <CircleDollarSign className="size-3.5" />
            Open Shift
          </Button>
        )
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="size-9 rounded-full text-muted-foreground">
          <Bell className="size-[18px]" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-accent/60 transition-colors">
              <Avatar className="size-7 rounded-full">
                <AvatarImage src={resolveAvatar(currentAdmin?.avatar)} />
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-[11px] font-bold tracking-tight">{currentAdmin?.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{roleLabel}</p>
              </div>
              <ChevronDown className="size-3 text-muted-foreground hidden md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-xl">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-bold">{currentAdmin?.name}</span>
              <span className="text-xs text-muted-foreground">@{currentAdmin?.username}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {register && (
              <div className="px-3 py-2 text-xs">
                <p className="font-bold uppercase tracking-widest text-muted-foreground">{register.name}</p>
                <p className="mt-0.5">
                  {shift
                    ? `Shift open since ${new Date(shift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'No open shift'}
                </p>
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => (shift ? onCloseShiftUi() : onOpenShiftUi())} className="gap-2">
              <CircleDollarSign className="size-4" />
              {shift ? t('cashier.close_shift', 'Close Shift') : t('cashier.open_shift', 'Open Shift')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive"
              onClick={logout}
            >
              <LogOut className="size-4" />
              {t('auth.logout', 'Logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}