import React, { useState, useEffect } from 'react';
import {
  History, Search, RefreshCw, Filter, Download,
  Package, ShoppingCart, Receipt, SlidersHorizontal, Tags,
  Warehouse, Truck, User, Users, LogIn
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DatePicker } from '../components/DatePicker';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const ACTION_TYPES = ['insert', 'update', 'delete'];
const ENTITY_TYPES = ['item', 'category', 'sale', 'expense', 'adjustment', 'inventory', 'transfer'];

const actionIcons: Record<string, React.ElementType> = {
  insert: Package, update: ShoppingCart, delete: Receipt,
};

const entityIcons: Record<string, React.ElementType> = {
  item: Package, category: Tags, sale: ShoppingCart, expense: Receipt,
  adjustment: SlidersHorizontal, inventory: Warehouse, transfer: Truck,
};

const ActionBadge = ({ action }: { action: string }) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
    insert: 'default', update: 'secondary', delete: 'destructive',
  };
  return (
    <Badge variant={variants[action] || 'outline'} className="text-[8px] font-black uppercase">
      {action}
    </Badge>
  );
};

const ActivityLogs: React.FC = () => {
  const { t } = useSettings();
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    try {
      const opts: any = { limit: 500 };
      if (actionFilter) opts.action = actionFilter;
      if (entityFilter) opts.entityType = entityFilter;
      if (fromDate) opts.fromDate = fromDate;
      if (toDate) opts.toDate = toDate;
      const data = await window.api.getActivityLogs(opts) || [];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        setLogs(data.filter((l: any) =>
          (l.details || '').toLowerCase().includes(q) ||
          (l.firstName || '').toLowerCase().includes(q) ||
          (l.lastName || '').toLowerCase().includes(q) ||
          (l.entityType || '').toLowerCase().includes(q) ||
          (l.action || '').toLowerCase().includes(q)
        ));
      } else {
        setLogs(data);
      }
    } catch (err) { console.error(err); }
  };

  const formatDetails = (log: any) => {
    const txt = log.details || '';
    const idx = txt.indexOf(' — by ');
    if (idx !== -1) return txt.substring(0, idx);
    return txt;
  };

  const getActor = (log: any) => {
    const txt = log.details || '';
    const idx = txt.indexOf(' — by ');
    if (idx !== -1) return txt.substring(idx + 6);
    if (log.firstName) return `${log.firstName} ${log.lastName}`;
    return 'unknown';
  };

  const entityColors: Record<string, string> = {
    item: 'text-blue-500', category: 'text-purple-500', sale: 'text-green-500',
    expense: 'text-orange-500', adjustment: 'text-yellow-500', inventory: 'text-cyan-500',
    transfer: 'text-indigo-500',
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
      {/* Header */}
      <div className="px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <History size={18} />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-tight">{t('activity_logs.title')}</p>
            <p className="text-[9px] text-muted-foreground font-bold uppercase">{t('activity_logs.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 lg:px-6 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('activity_logs.search')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs rounded-xl"
            />
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border bg-background text-[10px] font-bold">
            <option value="">{t('activity_logs.all_actions')}</option>
            {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border bg-background text-[10px] font-bold">
            <option value="">{t('activity_logs.all_entities')}</option>
            {ENTITY_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <Button size="sm" variant="outline" className="h-9 text-[10px] font-black uppercase tracking-widest" onClick={loadLogs}>
            <Filter size={14} className="mr-2" /> {t('activity_logs.filter')}
          </Button>
          <Button size="sm" variant="outline" className="h-9 text-[10px] font-black uppercase tracking-widest" onClick={loadLogs}>
            <RefreshCw size={14} className="mr-2" /> {t('activity_logs.refresh')}
          </Button>
        </div>
        <div className="flex items-center gap-16 flex-wrap">
          <div className="flex items-center gap-3">
            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{t('activity_logs.from')}</label>
            <DatePicker value={fromDate} onChange={e => setFromDate(e)} className="h-9 text-[10px] rounded-xl w-36" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{t('activity_logs.to')}</label>
            <DatePicker value={toDate} onChange={e => setToDate(e)} className="h-9 text-[10px] rounded-xl w-36" />
          </div>
        </div>
      </div>

      {/* Log Feed */}
      <div className="px-4 lg:px-6">
        <div className="rounded-2xl border bg-card/40 overflow-hidden">
          <div className="divide-y divide-border/20">
            {logs.length === 0 && (
              <div className="p-16 text-center">
                <History size={36} className="mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('activity_logs.no_logs')}</p>
              </div>
            )}
            {logs.map((log, i) => {
              const EntityIcon = entityIcons[log.entityType] || History;
              const colorClass = entityColors[log.entityType] || 'text-muted-foreground';
              return (
                <div key={log.id || i} className="p-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`h-8 w-8 rounded-lg bg-muted/20 flex items-center justify-center shrink-0 ${colorClass}`}>
                      <EntityIcon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ActionBadge action={log.action} />
                        <Badge variant="outline" className="text-[8px] font-black uppercase">{log.entityType || '-'}</Badge>
                        {log.entityId && (
                          <span className="text-[9px] font-bold text-muted-foreground">#{log.entityId}</span>
                        )}
                        <span className="text-[9px] text-muted-foreground ml-auto">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs font-semibold mt-1.5 break-words">{formatDetails(log)}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <User size={10} className="text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground font-medium">{getActor(log)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
