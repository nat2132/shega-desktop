// PinApprovalModal — Desktop equivalent of Mobile's §15 second-factor prompt.
// A presentational dialog that captures a manager/owner PIN. Verification is
// performed in the main process (see src/main/approval.ts); this component only
// collects the PIN and reports success/error/loading/cancel.

import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Lock, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';

export interface PinApprovalModalProps {
  open: boolean;
  title?: string;
  message?: string;
  approverName?: string;
  error?: string | null;
  verifying?: boolean;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
}

const MAX_PIN_LENGTH = 8;

const PinApprovalModal: React.FC<PinApprovalModalProps> = ({
  open,
  title,
  message,
  approverName,
  error,
  verifying,
  onConfirm,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPin('');
      const id = window.setTimeout(() => inputRef.current?.focus(), 150);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const submit = () => {
    if (pin.length > 0 && !verifying) onConfirm(pin);
  };

  const numeric = (v: string) => v.replace(/[^0-9]/g, '').slice(0, MAX_PIN_LENGTH);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight">
                {title ?? 'Manager approval required'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {message ?? 'This action requires manager approval. Enter the manager PIN.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Manager PIN
            </label>
          </div>
          <Input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            placeholder="••••••••"
            className="h-11 text-center text-lg tracking-[0.5em] font-bold"
            value={pin}
            maxLength={MAX_PIN_LENGTH}
            disabled={verifying}
            onChange={(e) => setPin(numeric(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') onCancel();
            }}
          />
          {approverName ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Approver: <span className="font-semibold text-foreground">{approverName}</span>
            </p>
          ) : null}
          {error ? <p className="mt-2 text-xs font-semibold text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={verifying} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={pin.length === 0 || verifying}
            onClick={submit}
            className="min-w-28"
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying…
              </>
            ) : (
              'Approve'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

PinApprovalModal.displayName = 'PinApprovalModal';

export default PinApprovalModal;
