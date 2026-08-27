import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Package, ShoppingCart, Users, Truck, Receipt, PiggyBank, Hash, Warehouse, ClipboardList, Bell, FileEdit, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/input';
import { useSettings } from '../context/SettingsContext';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; labelKey: string }> = {
  item: { icon: Package, color: 'text-blue-500', labelKey: 'global_search.type_item' },
  sale: { icon: ShoppingCart, color: 'text-green-500', labelKey: 'global_search.type_sale' },
  customer: { icon: Users, color: 'text-purple-500', labelKey: 'global_search.type_customer' },
  supplier: { icon: Truck, color: 'text-orange-500', labelKey: 'global_search.type_supplier' },
  expense: { icon: Receipt, color: 'text-red-500', labelKey: 'global_search.type_expense' },
  budget: { icon: PiggyBank, color: 'text-emerald-500', labelKey: 'global_search.type_budget' },
  category: { icon: Hash, color: 'text-cyan-500', labelKey: 'global_search.type_category' },
  warehouse: { icon: Warehouse, color: 'text-amber-500', labelKey: 'global_search.type_warehouse' },
  purchase: { icon: ClipboardList, color: 'text-indigo-500', labelKey: 'global_search.type_purchase' },
  adjustment: { icon: ArrowRight, color: 'text-rose-500', labelKey: 'global_search.type_adjustment' },
  notification: { icon: Bell, color: 'text-yellow-500', labelKey: 'global_search.type_notification' },
  draft: { icon: FileEdit, color: 'text-slate-500', labelKey: 'global_search.type_draft' },
};

interface GlobalSearchProps {
  placeholder?: string;
  onSelect?: () => void;
}

export function GlobalSearch({ placeholder, onSelect }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { t } = useSettings();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

  const groupedResults = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const r of results) {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    }
    return groups;
  }, [results]);

  const handleSearch = useCallback(async (q: string) => {
    if (!q || q.trim().length < 1) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setIsOpen(true);
    try {
      const data = await window.api?.globalSearch(q.trim()) || [];
      setResults(data);
    } catch (e) {
      console.error('Global search error:', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => handleSearch(query), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, handleSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: any) => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    if (result.route) {
      if (result.route.includes(':id')) {
        navigate(result.route.replace(':id', String(result.detail)));
      } else {
        navigate(result.route);
      }
    }
    if (onSelect) onSelect();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const typeOrder = ['item', 'sale', 'customer', 'supplier', 'expense', 'budget', 'purchase', 'adjustment', 'warehouse', 'category', 'notification', 'draft'];

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('global_search.placeholder')}
          className="pl-9 pr-4 h-9 w-64 rounded-xl bg-muted/50 border-none text-sm focus-visible:ring-1 focus-visible:ring-primary/30"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-popover border rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {typeOrder.map(type => {
            const items = groupedResults[type];
            if (!items || items.length === 0) return null;
            const config = TYPE_CONFIG[type] || { icon: Search, color: 'text-muted-foreground' };
            const Icon = config.icon;
            return (
              <div key={type}>
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 sticky top-0">
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {t(config.labelKey)}
                  </span>
                  <span className="text-xs text-muted-foreground/50 ml-auto">{items.length}</span>
                </div>
                {items.slice(0, 5).map((result: any, idx: number) => (
                  <button
                    key={`${result.type}-${result.id}-${idx}`}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left border-t border-border/30"
                  >
                    <div className={`h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-0.5 ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{result.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{result.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
          {results.length === 0 && query.trim().length > 0 && !loading && (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">{t('global_search.no_results')}</p>
              <p className="text-[11px] mt-1">{t('global_search.try_different')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
