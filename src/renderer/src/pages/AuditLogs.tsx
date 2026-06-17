import React, { useState, useEffect } from 'react';
import {
  Shield, Search, RefreshCw, Filter, Eye
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DatePicker } from '../components/DatePicker';
import { Badge } from '../components/ui/badge';

const actionVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  void_sale: 'default',
  reverse_payment: 'default',
  reverse_adjustment: 'default',
  restore: 'default',
  soft_delete: 'secondary',
  delete: 'destructive',
};

const AuditLogs: React.FC = () => {
  const { t } = useSettings();
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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
            <option value="void_sale">Void Sale</option>
            <option value="reverse_payment">Reverse Payment</option>
            <option value="reverse_adjustment">Reverse Adjustment</option>
            <option value="restore">Restore</option>
            <option value="soft_delete">Soft Delete</option>
            <option value="delete">Delete</option>
            <option value="update">Update</option>
            <option value="insert">Insert</option>
          </select>
          <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border bg-background text-[10px] font-bold">
            <option value="">{t('audit_logs.all_entities')}</option>
            <option value="sale">Sale</option>
            <option value="item">Item</option>
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
            <option value="payment">Payment</option>
            <option value="adjustment">Adjustment</option>
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
                      <span className="text-[9px] text-muted-foreground ml-auto">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                      </span>
                    </div>
                    {log.fieldName ? (
                      <div className="mt-1.5 space-y-1">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{log.fieldName}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="line-through text-destructive">{log.oldValue || '(empty)'}</span>
                          <Eye size={12} className="text-muted-foreground" />
                          <span className="text-green-600 font-semibold">{log.newValue || '(empty)'}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold mt-1.5 break-words">{log.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] text-muted-foreground font-medium">{t('audit_logs.by')} {log.changedBy || 'unknown'}</span>
                    </div>
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
