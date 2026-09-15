import React, { useState, useEffect } from 'react';
import { CalendarClock, Store, CircleDollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { useCashier } from '../../context/CashierContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const QUICK_FLOATS = [0, 500, 1000, 2000, 5000, 10000];

export function ShiftOpenModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, openShift } = useCashier();
  const { currentAdmin } = useAuth();
  const [float, setFloat] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setFloat('');
  }, [open]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const handleOpen = async () => {
    setSubmitting(true);
    const res = await openShift(parseFloat(float) || 0);
    setSubmitting(false);
    if (res.success) {
      toast.success('Shift opened');
      onClose();
    } else {
      toast.error(res.error || 'Failed to open shift');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl max-w-sm p-8 bg-card border-border/60">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <CalendarClock className="size-7 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight">
            {greeting}, {currentAdmin?.name?.split(' ')[0]}
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-muted-foreground">
            {register?.name || 'Main Register'} · Open a new shift
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Opening Cash
            </span>
            <div className="mt-1.5 relative">
              <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={float}
                onChange={(e) => setFloat(e.target.value)}
                placeholder="0"
                autoFocus
                className="h-12 w-full rounded-2xl border border-input bg-background pl-9 pr-4 text-lg font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </label>

          <div className="flex flex-wrap gap-2">
            {QUICK_FLOATS.map((q) => (
              <button
                key={q}
                onClick={() => setFloat(String(q))}
                className={`h-9 rounded-xl border px-3 text-xs font-bold transition-colors ${
                  parseFloat(float) === q
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:border-primary/50'
                }`}
              >
                {q.toLocaleString()}
              </button>
            ))}
          </div>

          <Button className="w-full h-12 rounded-2xl text-sm font-black uppercase tracking-[0.2em]" onClick={handleOpen} disabled={submitting}>
            <Store className="size-4" />
            {submitting ? 'Opening…' : 'Open Shift'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}