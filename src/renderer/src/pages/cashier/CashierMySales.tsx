import React, { useState, useEffect, useMemo } from 'react';
import { CalendarRange, Receipt, TrendingUp, PackageCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCashier } from '../../context/CashierContext';
import { cn } from '../../utils/shadcn';

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'all', label: 'All time' },
] as const;

type RangeId = (typeof RANGES)[number]['id'];

export default function CashierMySales() {
  const { currentAdmin } = useAuth();
  const { refreshShift } = useCashier();
  const [rangeId, setRangeId] = useState<RangeId>('today');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    if (rangeId === 'today') start.setHours(0, 0, 0, 0);
    else if (rangeId === 'yesterday') start.setDate(now.getDate() - 1), start.setHours(0, 0, 0, 0);
    else if (rangeId === '7d') start.setDate(now.getDate() - 7);
    else if (rangeId === '30d') start.setDate(now.getDate() - 30);
    return {
      start: start.toISOString(),
      end: new Date().toISOString(),
      allTime: rangeId === 'all',
    };
  }, [rangeId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await window.api?.getSales({
          createdBy: currentAdmin?.name,
          ...(range.allTime ? {} : { startDate: range.start, endDate: range.end }),
        });
        setRows(data || []);
      } catch (e) {
        console.error('Failed to load my sales', e);
        setRows([]);
      } finally {
        setLoading(false);
      }
      await refreshShift();
    })();
  }, [currentAdmin?.name, range, refreshShift]);

  const summary = useMemo(() => {
    const total = rows.reduce((s, r) => s + (r.totalPrice || 0), 0);
    const qty = rows.reduce((s, r) => s + (r.quantity || 0), 0);
    const cash = rows.filter((r) => r.paymentMethod === 'cash').reduce((s, r) => s + (r.totalPrice || 0), 0);
    return { total, qty, cash };
  }, [rows]);

  const grouped = useMemo(() => {
    const buckets = new Map<string, Map<number, any[]>>();
    for (const r of rows) {
      const d = new Date(r.createdAt);
      const day = d.toDateString();
      if (!buckets.has(day)) buckets.set(day, new Map());
      const saleKey = Math.floor(d.getTime() / 5000);
      const dayMap = buckets.get(day)!;
      if (!dayMap.has(saleKey)) dayMap.set(saleKey, []);
      dayMap.get(saleKey)!.push(r);
    }
    const out: { day: string; sales: { time: string; rows: any[]; total: number; items: number }[] }[] = [];
    for (const [day, dayMap] of buckets) {
      const sales = [...dayMap.entries()]
        .map(([key, saleRows]) => ({
          time: new Date(key * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rows: saleRows.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
          total: saleRows.reduce((s, r) => s + (r.totalPrice || 0), 0),
          items: saleRows.reduce((s, r) => s + (r.quantity || 0), 0),
        }))
        .sort((a, b) => (a.time < b.time ? 1 : -1));
      out.push({ day, sales });
    }
    return out.sort((a, b) => (new Date(a.day) < new Date(b.day) ? 1 : -1));
  }, [rows]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex flex-col gap-3 border-b border-border/60 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="size-4" />
          <h1 className="text-sm font-black uppercase tracking-widest">My Sales</h1>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{rows.length}</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRangeId(r.id)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors',
                rangeId === r.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-b border-border/60 bg-card px-4 py-3">
        <div className="rounded-2xl bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <TrendingUp className="size-3.5" /> Revenue
          </div>
          <div className="mt-1 text-lg font-black tracking-tight">{summary.total.toLocaleString()} ETB</div>
        </div>
        <div className="rounded-2xl bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <PackageCheck className="size-3.5" /> Items
          </div>
          <div className="mt-1 text-lg font-black tracking-tight">{summary.qty}</div>
        </div>
        <div className="rounded-2xl bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <CalendarRange className="size-3.5" /> Cash
          </div>
          <div className="mt-1 text-lg font-black tracking-tight">{summary.cash.toLocaleString()} ETB</div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <Receipt className="size-12 opacity-30" />
            <p className="text-sm font-medium">No sales in this period</p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {grouped.map((b) => (
              <div key={b.day}>
                <div className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                  {new Date(b.day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="space-y-2">
                  {b.sales.map((s) => (
                    <div key={s.time} className="rounded-2xl border border-border/60 bg-card p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-muted-foreground">{s.time}</span>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                            {s.items} item{s.items > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-sm font-black">{s.total.toLocaleString()} ETB</div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {s.rows.map((r, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-xs font-medium">
                            {r.itemImage ? (
                              <img src={r.itemImage} alt="" className="h-4 w-4 rounded object-cover" />
                            ) : null}
                            {r.itemName || `#${r.itemId}`} × {r.quantity}
                            {r.paymentMethod === 'cash' && <span className="ms-1 text-muted-foreground">(${r.paymentMethod})</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}