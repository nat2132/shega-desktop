import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, Layers, Loader2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

/**
 * Business scope selector for the desktop app.
 *
 * Lists every business the signed-in account can access plus a combined
 * "All Businesses" scope. Switching persists main-process side
 * (`business:switch`) and emits `business-changed` so every open page can
 * reload its data immediately — no stale records from the previous business.
 */
export const ALL_BUSINESSES = '__all__';

interface BusinessRow {
  id: number;
  businessName: string;
  isDefault?: number;
  employeeCount?: number;
}

export function BusinessSwitcher({ onChanged }: { onChanged?: () => void }) {
  const { t } = useSettings();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<BusinessRow[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [switching, setSwitching] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const rows = (await (window as any).api?.businessList?.()) || [];
      setList(rows);
      const active = rows.find((r: any) => r.isActive) || rows.find((r: any) => r.isDefault) || rows[0];
      setCurrentId(active?.id ?? null);
    } catch {
      setList([]);
    }
  };

  useEffect(() => {
    load();
    const onChangedElsewhere = () => load();
    window.addEventListener('business-changed', onChangedElsewhere);
    return () => window.removeEventListener('business-changed', onChangedElsewhere);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const canSwitch = list.length > 1;
  const current = useMemo(
    () => list.find((b) => b.id === currentId),
    [list, currentId],
  );

  const switchTo = async (id: number | typeof ALL_BUSINESSES) => {
    if (switching) return;
    setOpen(false);
    if (id === ALL_BUSINESSES) {
      // Aggregate scope is a renderer-side filter; pages read all businesses
      // they can access. Notify without touching the persisted active id.
      window.dispatchEvent(new CustomEvent('business-changed', { detail: { scope: ALL_BUSINESSES } }));
      onChanged?.();
      return;
    }
    if (id === currentId) return;
    setSwitching(true);
    try {
      await (window as any).api?.businessSwitch?.(id);
      setCurrentId(id);
      window.dispatchEvent(new CustomEvent('business-changed', { detail: { scope: id } }));
      onChanged?.();
    } finally {
      setSwitching(false);
    }
  };

  if (!canSwitch) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs font-semibold text-foreground/80">
        <Building2 className="h-3.5 w-3.5 text-primary" />
        <span className="max-w-[220px] truncate">{current?.businessName || t('tabs.business')}</span>
      </span>
    );
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs font-semibold text-foreground/80 transition-colors hover:bg-accent/10"
        disabled={switching}
      >
        {switching ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        ) : (
          <Building2 className="h-3.5 w-3.5 text-primary" />
        )}
        <span className="max-w-[220px] truncate">{current?.businessName || t('tabs.business')}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border bg-popover p-2 shadow-lg">
          <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t('business_scope.pick')}
          </p>
          <button
            onClick={() => switchTo(ALL_BUSINESSES)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-accent/10"
          >
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">
              <span className="block text-sm font-semibold">{t('business_scope.all')}</span>
              <span className="block text-xs text-muted-foreground">{t('business_scope.all_sub')}</span>
            </span>
          </button>
          <div className="my-1 h-px bg-border" />
          {list.map((b) => (
            <button
              key={b.id}
              onClick={() => switchTo(b.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-accent/10 ${
                b.id === currentId ? 'bg-primary/10' : ''
              }`}
            >
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">
                <span className="block truncate text-sm font-semibold">{b.businessName}</span>
                {b.isDefault ? (
                  <span className="block text-xs text-muted-foreground">{t('business_scope.default')}</span>
                ) : null}
              </span>
              {b.id === currentId && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
