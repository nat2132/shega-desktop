import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Trash2, Activity, Database, Zap, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface ProgressData {
  phase: string;
  current: number;
  total: number;
  message: string;
  totalCreated: number;
  overallPercent: number;
}

type GeneratorPhase = 'idle' | 'generating' | 'deleting' | 'measuring' | 'done';

const PHASE_LABELS: Record<string, string> = {
  categories: 'Categories',
  items: 'Products/Items',
  suppliers: 'Suppliers',
  sales: 'Sales',
  expenses: 'Expenses',
  employees: 'Employees',
  stock_movements: 'Stock Movements',
  notifications: 'Notifications',
  activity_logs: 'Activity Logs',
};

const TestDataGenerator: React.FC = () => {
  const [phase, setPhase] = useState<GeneratorPhase>('idle');
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [perfReport, setPerfReport] = useState<Record<string, number> | null>(null);
  const [dbSize, setDbSize] = useState<number>(0);
  const [generationResult, setGenerationResult] = useState<{ totalCreated: number; duration: number; phases: { name: string; count: number; time: number }[] } | null>(null);
  const [showConfirm, setShowConfirm] = useState<number | null>(null);

  useEffect(() => {
    window.api.onTestDataProgress(setProgress);
    return () => { window.api.removeTestDataProgressListener(); };
  }, []);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleGenerate = useCallback(async (count: number) => {
    if (count >= 1000) { setShowConfirm(count); return; }
    await doGenerate(count);
  }, []);

  const doGenerate = async (count: number) => {
    setShowConfirm(null);
    setPhase('generating');
    setGenerationResult(null);
    setPerfReport(null);
    try {
      const result = await window.api.generateTestData(count);
      setGenerationResult(result);
      toast.success(`Generated ${result.totalCreated.toLocaleString()} records in ${formatDuration(result.duration)}`);
    } catch (e: any) {
      toast.error(e.message || 'Generation failed');
    } finally {
      setPhase('idle');
      setProgress(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete ALL test data? This will remove all records created by the test data generator.')) return;
    setPhase('deleting');
    try {
      const result = await window.api.clearTestData();
      toast.success(`Deleted ${result.deleted.toLocaleString()} test records in ${formatDuration(result.duration)}`);
      setGenerationResult(null);
      setPerfReport(null);
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    } finally {
      setPhase('idle');
    }
  };

  const handleMeasure = async () => {
    setPhase('measuring');
    try {
      const [perf, size] = await Promise.all([
        window.api.measurePerformance(),
        window.api.getDatabaseSize()
      ]);
      setPerfReport(perf);
      setDbSize(size);
      toast.success('Performance measurement complete');
    } catch (e: any) {
      toast.error(e.message || 'Measurement failed');
    } finally {
      setPhase('idle');
    }
  };

  const isBusy = phase === 'generating' || phase === 'deleting' || phase === 'measuring';

  return (
    <Card className="border-dashed border-amber-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-sm font-black uppercase tracking-widest">
              Test Data Generator
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-amber-500/50 text-amber-600">
            Dev Tool
          </Badge>
        </div>
        <CardDescription className="text-[10px]">
          Generate realistic test data for performance testing and debugging
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        {phase === 'generating' && progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
              <span className="text-muted-foreground">
                {PHASE_LABELS[progress.phase] || progress.phase}
                <span className="ml-1">({progress.current}/{progress.total})</span>
              </span>
              <span className="text-amber-600">{progress.overallPercent}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${progress.overallPercent}%` }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground">{progress.message} · {progress.totalCreated.toLocaleString()} records created</p>
          </div>
        )}

        {phase === 'deleting' && (
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-destructive">
            <Activity className="h-3 w-3 animate-spin" />
            Deleting test data...
          </div>
        )}

        {phase === 'measuring' && (
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-500">
            <Activity className="h-3 w-3 animate-spin" />
            Measuring performance...
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {[10, 100, 1000, 10000].map(n => (
            <Button
              key={n}
              size="sm"
              variant={n >= 1000 ? 'destructive' : 'outline'}
              disabled={isBusy}
              onClick={() => handleGenerate(n)}
              className="text-[10px] font-black uppercase tracking-widest"
            >
              Generate {n.toLocaleString()}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            disabled={isBusy}
            onClick={handleDelete}
            className="text-[10px] font-black uppercase tracking-widest text-destructive"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete Test Data
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={handleMeasure}
            className="text-[10px] font-black uppercase tracking-widest"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Measure Performance
          </Button>
        </div>

        {/* Generation result */}
        {generationResult && (
          <div className="rounded-lg border bg-card/40 p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-green-600">
              <Database className="h-3 w-3" />
              Generation Complete
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <span className="text-muted-foreground">Total Records:</span>
              <span className="font-bold text-right">{generationResult.totalCreated.toLocaleString()}</span>
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-bold text-right">{formatDuration(generationResult.duration)}</span>
              <span className="text-muted-foreground">Avg Rate:</span>
              <span className="font-bold text-right">
                {generationResult.duration > 0
                  ? `${Math.round(generationResult.totalCreated / (generationResult.duration / 1000))} rec/s`
                  : '-'}
              </span>
            </div>
            {generationResult.phases.filter(p => p.count > 0).map(p => (
              <div key={p.name} className="flex items-center justify-between text-[9px] text-muted-foreground">
                <span>{PHASE_LABELS[p.name] || p.name}: <strong>{p.count.toLocaleString()}</strong> records</span>
                <span>{formatDuration(p.time)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Performance report */}
        {perfReport && (
          <div className="rounded-lg border bg-card/40 p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-500">
              <Activity className="h-3 w-3" />
              Performance Report
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <span className="text-muted-foreground">DB Size:</span>
              <span className="font-bold text-right">{formatSize(dbSize)}</span>
              <span className="text-muted-foreground">Items Count:</span>
              <span className="font-bold text-right">{perfReport.itemsCount}ms</span>
              <span className="text-muted-foreground">Sales Count:</span>
              <span className="font-bold text-right">{perfReport.salesCount}ms</span>
              <span className="text-muted-foreground">Customers Query:</span>
              <span className="font-bold text-right">{perfReport.customersQuery}ms</span>
              <span className="text-muted-foreground">Suppliers Count:</span>
              <span className="font-bold text-right">{perfReport.suppliersCount}ms</span>
              <span className="text-muted-foreground">Categories Count:</span>
              <span className="font-bold text-right">{perfReport.categoriesCount}ms</span>
              <span className="text-muted-foreground">Expenses Count:</span>
              <span className="font-bold text-right">{perfReport.expensesCount}ms</span>
              <span className="text-muted-foreground">Employees Count:</span>
              <span className="font-bold text-right">{perfReport.employeesCount}ms</span>
              <span className="text-muted-foreground">Items List Query:</span>
              <span className="font-bold text-right">{perfReport.itemsListQuery}ms</span>
              <span className="text-muted-foreground">Sales List Query:</span>
              <span className="font-bold text-right">{perfReport.salesListQuery}ms</span>
              <span className="text-muted-foreground">Dashboard Agg Query:</span>
              <span className="font-bold text-right">{perfReport.dashboardAggQuery}ms</span>
            </div>
          </div>
        )}

        {/* Confirmation dialog */}
        {showConfirm !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-2xl border bg-background p-6 max-w-sm shadow-2xl space-y-4 mx-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-sm uppercase tracking-widest">Generate {showConfirm.toLocaleString()} Records?</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                This will create approximately {showConfirm >= 10000 ? '25,000+' : showConfirm >= 1000 ? '2,500+' : ''} records across all system tables.
                The process may take {showConfirm >= 10000 ? 'a minute or more' : 'several seconds'}.
              </p>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setShowConfirm(null)} className="text-xs">Cancel</Button>
                <Button size="sm" variant="destructive" onClick={() => doGenerate(showConfirm)} className="text-xs">Generate</Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestDataGenerator;