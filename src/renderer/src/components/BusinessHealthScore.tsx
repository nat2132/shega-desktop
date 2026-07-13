import { useEffect, useState } from 'react';
import { HeartPulse, TrendingDown, AlertTriangle, CheckCircle, Lightbulb, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { useSettings } from '../context/SettingsContext';

const STATUS_CONFIG: Record<string, { color: string; bg: string; labelKey: string }> = {
  good: { color: 'text-green-500', bg: 'bg-green-500/10', labelKey: 'health.status_good' },
  warning: { color: 'text-amber-500', bg: 'bg-amber-500/10', labelKey: 'health.status_warning' },
  critical: { color: 'text-red-500', bg: 'bg-red-500/10', labelKey: 'health.status_critical' },
};

export function BusinessHealthScore() {
  const { t } = useSettings();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.api?.getBusinessHealthScore();
      setData(result);
    } catch (e: any) {
      setError(e.message || 'Failed to load health score');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-emerald-400';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreRing = (score: number) => {
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (score / 100) * circumference;
    let strokeColor = '#22c55e';
    if (score < 40) strokeColor = '#ef4444';
    else if (score < 60) strokeColor = '#f59e0b';
    else if (score < 80) strokeColor = '#10b981';
    return { circumference, offset, strokeColor };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
        <Button variant="outline" size="sm" onClick={loadData} className="mt-2">
          <RefreshCw className="h-4 w-4 mr-1" /> {t('health.refresh')}
        </Button>
      </Alert>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <HeartPulse className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-lg font-medium">{t('health.no_data')}</p>
      </div>
    );
  }

  const ring = getScoreRing(data.score);
  const colorClass = getScoreColor(data.score);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h3 className="text-xl font-black tracking-tight">{t('health.title')}</h3>
        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
          {t('health.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Score Gauge */}
        <div className="lg:col-span-1">
          <div className="p-8 rounded-2xl border bg-card/50 flex flex-col items-center text-center">
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke={ring.strokeColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ring.circumference}
                  strokeDashoffset={ring.offset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-black ${colorClass}`}>{data.score}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
              data.score >= 80 ? 'bg-green-500/10 text-green-500' :
              data.score >= 60 ? 'bg-emerald-400/10 text-emerald-400' :
              data.score >= 40 ? 'bg-amber-500/10 text-amber-500' :
              'bg-red-500/10 text-red-500'
            }`}>
              {data.rating}
            </div>
          </div>
        </div>

        {/* Factors Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">{t('health.score_factors')}</h4>
          <div className="grid grid-cols-1 gap-3">
            {data.factors.map((factor: any, idx: number) => {
              const statusCfg = STATUS_CONFIG[factor.status] || STATUS_CONFIG.warning;
              return (
                <div key={idx} className="p-4 rounded-xl border bg-card/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-6 w-6 rounded-lg ${statusCfg.bg} ${statusCfg.color} flex items-center justify-center`}>
                        {factor.status === 'good' ? <CheckCircle className="h-3.5 w-3.5" /> :
                         factor.status === 'warning' ? <AlertTriangle className="h-3.5 w-3.5" /> :
                         <TrendingDown className="h-3.5 w-3.5" />}
                      </div>
                      <span className="text-xs font-bold">{factor.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            factor.score >= 80 ? 'bg-green-500' :
                            factor.score >= 60 ? 'bg-emerald-400' :
                            factor.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${factor.score}%` }}
                        />
                      </div>
                      <span className={`text-xs font-black ${getScoreColor(factor.score)} w-8 text-right`}>
                        {factor.score}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{factor.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">{t('health.recommendations')}</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.recommendations.map((rec: string, idx: number) => (
              <div key={idx} className="p-4 rounded-xl border-l-4 border-l-amber-500 bg-card/40 space-y-1">
                <p className="text-xs leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button variant="outline" size="sm" onClick={loadData} className="text-[10px] font-black uppercase tracking-widest">
        <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> {t('health.refresh')}
      </Button>
    </div>
  );
}
