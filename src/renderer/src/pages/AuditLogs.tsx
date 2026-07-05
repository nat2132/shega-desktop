import React, { useState, useEffect } from 'react';
import {
  Shield, Search, RefreshCw, Filter, Eye, Undo2, RotateCcw
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DatePicker } from '../components/DatePicker';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const actionVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  void_sale: 'default',
  reverse_payment: 'default',
  reverse_adjustment: 'default',
  restore: 'default',
  soft_delete: 'secondary',
  delete: 'destructive',
};

const canReverse = (log: any): boolean => {
  if (log.reversedAt) return false;
  if ((log.action === 'soft_delete' || log.action === 'archive') && (log.entityType === 'item' || log.entityType === 'customer')) return true;
  if (log.action === 'restore_item' || log.action === 'restore_customer' || log.action === 'restore') return true;
  if ((log.action === 'update' || log.action === 'insert') && log.fieldName && log.oldValue !== null) return true;
  return false;
};

const reverseLabel = (log: any, t: (key: string) => string): string => {
  if (log.action === 'soft_delete' || log.action === 'archive') return log.entityType === 'item' ? t('audit_logs.restore_item') : t('audit_logs.restore_customer');
  if (log.action === 'restore_item' || (log.action === 'restore' && log.entityType === 'item')) return t('audit_logs.redelete_item');
  if (log.action === 'restore_customer' || (log.action === 'restore' && log.entityType === 'customer')) return t('audit_logs.redelete_customer');
  return t('audit_logs.undo_change');
};

const AuditLogs: React.FC = () => {
  const { t, formatDateTime } = useSettings();
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reversingId, setReversingId] = useState<number | null>(null);

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    try {
      const opts: any = { limit: 500 };
      if (entityFilter) opts.entityType = entityFilter;
      if (actionFilter) opts.action = actionFilter;
      if (fromDate) opts.fromDate = fromDate;
      if (toDate) opts.toDate = toDate;
      const data = await window.api.getAuditLogs(opts) || [];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        setLogs(data.filter((l: any) =>
          (l.description || '').toLowerCase().includes(q) ||
          (l.changedBy || '').toLowerCase().includes(q) ||
          (l.entityType || '').toLowerCase().includes(q) ||
          (l.fieldName || '').toLowerCase().includes(q)
        ));
      } else {
        setLogs(data);
      }
    } catch (err) { console.error(err); }
  };

  const handleReverse = async (log: any) => {
    setReversingId(log.id);
    try {
      await window.api.reverseAuditLogEntry({ logId: log.id });
      toast.success(t('audit_logs.reverse_success'));
      loadLogs();
    } catch (err: any) {
      toast.error(err?.message || t('audit_logs.reverse_error'));
    } finally {
      setReversingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
      <div className="px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Shield size={18} />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-tight">{t('audit_logs.title')}</p>
            <p className="text-[9px] text-muted-foreground font-bold uppercase">{t('audit_logs.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('audit_logs.search')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs rounded-xl"
            />
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border bg-background text-[10px] font-bold">
            <option value="">{t('audit_logs.all_actions')}</option>
            <option value="void_sale">{t('audit_logs.action_void_sale')}</option>
            <option value="reverse_payment">{t('audit_logs.action_reverse_payment')}</option>
            <option value="reverse_adjustment">{t('audit_logs.action_reverse_adjustment')}</option>
            <option value="restore">{t('audit_logs.action_restore')}</option>
            <option value="soft_delete">{t('audit_logs.action_soft_delete')}</option>
            <option value="delete">{t('audit_logs.action_delete')}</option>
            <option value="update">{t('audit_logs.action_update')}</option>
            <option value="insert">{t('audit_logs.action_insert')}</option>
          </select>
          <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border bg-background text-[10px] font-bold">
            <option value="">{t('audit_logs.all_entities')}</option>
            <option value="sale">{t('audit_logs.entity_sale')}</option>
            <option value="item">{t('audit_logs.entity_item')}</option>
            <option value="customer">{t('audit_logs.entity_customer')}</option>
            <option value="supplier">{t('audit_logs.entity_supplier')}</option>
            <option value="payment">{t('audit_logs.entity_payment')}</option>
            <option value="adjustment">{t('audit_logs.entity_adjustment')}</option>
          </select>
          <Button size="sm" variant="outline" className="h-9 text-[10px] font-black uppercase tracking-widest" onClick={loadLogs}>
            <Filter size={14} className="mr-2" /> {t('audit_logs.filter')}
          </Button>
          <Button size="sm" variant="outline" className="h-9 text-[10px] font-black uppercase tracking-widest" onClick={loadLogs}>
            <RefreshCw size={14} className="mr-2" /> {t('audit_logs.refresh')}
          </Button>
        </div>
        <div className="flex items-center gap-16 flex-wrap">
          <div className="flex items-center gap-3">
            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{t('audit_logs.from')}</label>
            <DatePicker value={fromDate} onChange={e => setFromDate(e)} className="h-9 text-[10px] rounded-xl w-36" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{t('audit_logs.to')}</label>
            <DatePicker value={toDate} onChange={e => setToDate(e)} className="h-9 text-[10px] rounded-xl w-36" />
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-2xl border bg-card/40 overflow-hidden">
          <div className="divide-y divide-border/20">
            {logs.length === 0 && (
              <div className="p-16 text-center">
                <Shield size={36} className="mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('audit_logs.no_logs')}</p>
              </div>
            )}
            {logs.map((log, i) => (
              <div key={log.id || i} className="p-4 hover:bg-muted/10 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-lg bg-muted/20 flex items-center justify-center shrink-0 text-muted-foreground">
                    <Shield size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={actionVariants[log.action] || 'outline'} className="text-[8px] font-black uppercase">{log.action}</Badge>
                      <Badge variant="outline" className="text-[8px] font-black uppercase">{log.entityType || '-'}</Badge>
                      {log.entityId && (
                        <span className="text-[9px] font-bold text-muted-foreground">#{log.entityId}</span>
                      )}
                      {log.reversedAt && (
                        <Badge variant="secondary" className="text-[8px] font-black uppercase">{t('audit_logs.reversed')}</Badge>
                      )}
                      <span className="text-[9px] text-muted-foreground ml-auto">
                        {log.createdAt ? formatDateTime(log.createdAt) : ''}
                      </span>
                    </div>
                    {log.fieldName ? (
                      <div className="mt-1.5 space-y-1">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{log.fieldName}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="line-through text-destructive">{log.oldValue || t('audit_logs.empty_value')}</span>
                          <Eye size={12} className="text-muted-foreground" />
                          <span className="text-green-600 font-semibold">{log.newValue || t('audit_logs.empty_value')}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold mt-1.5 break-words">{log.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] text-muted-foreground font-medium">{t('audit_logs.by')} {log.changedBy || t('common.unknown')}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1 shrink-0">
                    {canReverse(log) && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={reversingId === log.id}
                        onClick={() => handleReverse(log)}
                        className="h-7 text-[8px] font-black uppercase tracking-widest rounded-lg border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                      >
                        {reversingId === log.id ? (
                          <RotateCcw size={11} className="animate-spin" />
                        ) : (
                          <Undo2 size={11} className="mr-1" />
                        )}
                        {reverseLabel(log, t)}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
