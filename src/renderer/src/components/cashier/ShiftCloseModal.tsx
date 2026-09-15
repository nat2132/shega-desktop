import React, { useState, useEffect } from 'react';
import { Banknote, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { useCashier } from '../../context/CashierContext';
import { toast } from 'sonner';

const QUICK_COUNTS = [500, 1000, 2000, 5000, 10000];

export function ShiftCloseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { shift, closeShift } = useCashier();
  const [counted, setCounted] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && shift) {
      setCounted('');
      setSummary(null);
      window.api?.shiftSummary?.(shift.id).then(setSummary).catch(() => setSummary(null));
    }
  }, [open, shift]);

  const expected = summary?.cashDrawer?.expected ?? shift?.expectedCash ?? 0;
  const countedNum = parseFloat(counted) || 0;
  const difference = countedNum - expected;

  const handleClose = async () => {
    setSubmitting(true);
    const res = await closeShift(countedNum);
    setSubmitting(false);
    if (res.success) {
      toast.success('Shift closed');
      onClose();
    } else {
      toast.error(res.error || 'Failed to close shift');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl max-w-sm p-8 bg-card border-border/60">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-500/10">
            <Banknote className="size-7 text-amber-500" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight">Close Shift</DialogTitle>
          <DialogDescription className="text-sm font-medium text-muted-foreground">
            Count the cash in the drawer and enter it below
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Expected Cash</span>
            <span className="text-lg font-black">{expected.toLocaleString()} ETB</span>
          </div>

          <div>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Counted Cash</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={counted}
                onChange={(e) => setCounted(e.target.value)}
                placeholder="0"
                autoFocus
                className="mt-1.5 h-12 w-full rounded-2xl border border-input bg-background px-4 text-lg font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_COUNTS.map((q) => (
              <button
                key={q}
                onClick={() => setCounted(String(q))}
                className={`h-9 rounded-xl border px-3 text-xs font-bold transition-colors ${
                  countedNum === q ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50'
                }`}
              >
                {q.toLocaleString()}
              </button>
            ))}
          </div>

          <div
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
              Number.isFinite(difference) && difference !== 0
                ? difference < 0
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-border/60 bg-muted/30'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Difference</span>
            <span className={`text-lg font-black ${difference < 0 ? 'text-red-500' : difference > 0 ? 'text-emerald-600' : ''}`}>
              {Number.isFinite(difference) ? `${difference >= 0 ? '+' : ''}${difference.toLocaleString()} ETB` : '—'}
            </span>
          </div>

          {summary && (
            <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-xs font-medium text-muted-foreground">
              <div className="flex justify-between py-0.5"><span>Sales</span><span className="font-bold">{summary.counts?.sales ?? 0}</span></div>
              <div className="flex justify-between py-0.5"><span>Revenue</span><span className="font-bold">{(summary.totals?.total ?? 0).toLocaleString()} ETB</span></div>
            </div>
          )}

          <Button className="w-full h-12 rounded-2xl text-sm font-black uppercase tracking-[0.2em]" onClick={handleClose} disabled={submitting}>
            <CheckCircle2 className="size-4" />
            {submitting ? 'Closing…' : 'Close Shift'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}