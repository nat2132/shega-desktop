import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Package, AlertTriangle, TrendingUp,
  DollarSign, Users, Truck, BarChart3,
  Clock, CalendarDays, CalendarRange, Lightbulb, Activity, RefreshCw,
  Loader2, Zap, ArrowRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import {
  Card, CardContent, CardHeader, CardTitle
} from './ui/card';
import { useSettings } from '../context/SettingsContext';

const INSIGHT_CONFIG: Record<string, { icon: React.ElementType; gradient: string }> = {
  low_stock: { icon: Package, gradient: 'from-amber-500/20 to-amber-600/10' },
  out_of_stock: { icon: AlertTriangle, gradient: 'from-red-500/20 to-red-600/10' },
  best_sellers: { icon: TrendingUp, gradient: 'from-green-500/20 to-green-600/10' },
  top_profit: { icon: DollarSign, gradient: 'from-emerald-500/20 to-emerald-600/10' },
  slow_moving: { icon: Activity, gradient: 'from-orange-500/20 to-orange-600/10' },
  overstocked: { icon: Package, gradient: 'from-blue-500/20 to-blue-600/10' },
  sales_decline: { icon: BarChart3, gradient: 'from-red-500/20 to-red-600/10' },
  top_customers: { icon: Users, gradient: 'from-purple-500/20 to-purple-600/10' },
  supplier_performance: { icon: Truck, gradient: 'from-orange-500/20 to-orange-600/10' },
  daily_summary: { icon: Clock, gradient: 'from-sky-500/20 to-sky-600/10' },
  weekly_summary: { icon: CalendarDays, gradient: 'from-indigo-500/20 to-indigo-600/10' },
  monthly_summary: { icon: CalendarRange, gradient: 'from-violet-500/20 to-violet-600/10' },
  profit_suggestion: { icon: Lightbulb, gradient: 'from-yellow-500/20 to-yellow-600/10' },
  cash_flow: { icon: DollarSign, gradient: 'from-teal-500/20 to-teal-600/10' },
  seasonal_trend: { icon: Zap, gradient: 'from-cyan-500/20 to-cyan-600/10' },
};

const SEVERITY_BADGE: Record<string, { variant: 'destructive' | 'default' | 'secondary' | 'outline'; labelKey: string }> = {
  critical: { variant: 'destructive', labelKey: 'business_assistant.severity_critical' },
  warning: { variant: 'default', labelKey: 'business_assistant.severity_warning' },
  success: { variant: 'secondary', labelKey: 'business_assistant.severity_insight' },
  info: { variant: 'outline', labelKey: 'business_assistant.severity_info' },
};

export function BusinessAssistant() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.api?.getBusinessInsights() || [];
      setInsights(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInsights(); }, []);

  const criticalCount = insights.filter(i => i.severity === 'critical').length;
  const warningCount = insights.filter(i => i.severity === 'warning').length;

  return (
    <Card className="border-2 border-primary/10 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">{t('business_assistant.title')}</CardTitle>
              <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">
                {t('business_assistant.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 h-5">
                {t('business_assistant.critical_count', '{count} critical').replace('{count}', String(criticalCount))}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="default" className="text-xs px-1.5 h-5 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30">
                {t('business_assistant.alerts_count', '{count} alerts').replace('{count}', String(warningCount))}
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={loadInsights} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
            <Button variant="outline" size="sm" onClick={loadInsights} className="mt-2 text-xs">
              <RefreshCw className="h-3 w-3 mr-1" /> {t('business_assistant.retry')}
            </Button>
          </Alert>
        ) : insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Sparkles className="h-8 w-8 mb-3 opacity-30" />
            <p className="text-sm font-medium">{t('business_assistant.no_insights')}</p>
            <p className="text-xs mt-1">{t('business_assistant.no_insights_desc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight: any, idx: number) => {
              const cfg = INSIGHT_CONFIG[insight.type] || { icon: Sparkles, gradient: 'from-primary/10 to-primary/5' };
              const badge = SEVERITY_BADGE[insight.severity] || SEVERITY_BADGE.info;
              const Icon = cfg.icon;

              return (
                <div
                  key={idx}
                  className={`group relative p-4 rounded-xl border bg-gradient-to-br ${cfg.gradient} hover:shadow-md transition-all cursor-pointer`}
                  onClick={() => {
                    if (insight.action?.route) {
                      navigate(insight.action.route);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-background/80 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-bold truncate">{insight.title}</p>
                        <Badge variant={badge.variant} className="text-xs h-4 px-1 shrink-0">
                          {t(badge.labelKey)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{insight.message}</p>
                      {insight.action && (
                        <div className="mt-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          {insight.action.label}
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
