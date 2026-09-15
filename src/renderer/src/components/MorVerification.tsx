import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, ShieldAlert, ShieldX, RefreshCw, ShieldQuestion } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  isVerificationFresh, isMorVerified, verificationAgeLabel,
  type MorVerification,
} from '@shega/shared';

const reasonText: Record<string, string> = {
  mor_integration_not_configured: 'No Ministry of Revenues integration is configured for Shega yet.',
  backend_link_required: 'Link your Shega account (Cloud Sync settings) to enable verification.',
  backend_unreachable: 'Shega backend is unreachable right now — showing the last cached answer.',
  backend_rejected: 'The backend rejected the request. Check the TIN and try again.',
  invalid_tin: 'Enter a valid 8–12 digit TIN first.',
  mor_unreachable: 'Ministry of Revenues service is unreachable.',
  mor_down: 'Ministry of Revenues is temporarily unavailable.',
  mor_rejected: 'Ministry of Revenues rejected the request.',
  mor_unrecognised_response: 'Ministry of Revenues returned an unrecognised response.',
};

/** Honest status chip for a MoR verification record. Never fabricates a pass. */
export function MorStatusBadge({ verification }: { verification?: MorVerification | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!verification) {
    return (
      <Badge variant="outline" className="gap-1 bg-muted/50 text-muted-foreground">
        <ShieldQuestion className="h-3.5 w-3.5" /> Not verified
      </Badge>
    );
  }

  if (isMorVerified(verification)) {
    const stale = !isVerificationFresh(verification, now);
    return (
      <Badge className={`gap-1 ${stale ? 'bg-amber-500/15 text-amber-600' : 'bg-green-500/15 text-green-600'}`}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        {stale ? 'Verified · refresh recommended' : 'Verified by Ministry of Revenues'}
        {isVerificationFresh(verification, now) && verification.cachedAt
          ? ` · ${verificationAgeLabel(verification.cachedAt, now)}`
          : ''}
      </Badge>
    );
  }

  if (verification.status === 'unavailable') {
    return (
      <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-600">
        <ShieldAlert className="h-3.5 w-3.5" /> Verification unavailable
      </Badge>
    );
  }

  if (verification.status === 'failed') {
    return (
      <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-600">
        <ShieldX className="h-3.5 w-3.5" /> Verification failed
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 bg-muted/50 text-muted-foreground">
      <ShieldX className="h-3.5 w-3.5" /> No MoR match
    </Badge>
  );
}

/**
 * Smart verification flow — Enter TIN → Verify with MoR → Review → Save.
 * Mutates nothing: returns the result via callbacks so the caller keeps control
 * of the review-then-save step (Section U: never silently overwrite data).
 */
export function MorVerifyAction({
  tin,
  subTin,
  onResult,
  label = 'Verify with MoR',
  className,
}: {
  tin: string;
  subTin?: string | null;
  onResult?: (verification: MorVerification) => void;
  label?: string;
  className?: string;
}) {
  const [verification, setVerification] = useState<MorVerification | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupCached = useCallback(async () => {
    const flat = (tin || '').replace(/[\s-]/g, '');
    if (!flat) return;
    const cached = await window.api.morGet(flat, subTin).catch(() => null);
    if (cached) setVerification(cached);
  }, [tin, subTin]);

  useEffect(() => { lookupCached(); }, [lookupCached]);

  const verify = async (force: boolean) => {
    const flat = (tin || '').replace(/[\s-]/g, '');
    if (!flat) return;
    setBusy(true);
    setError(null);
    try {
      const res = await window.api.morVerify(flat, subTin, force);
      setVerification(res);
      onResult?.(res);
    } catch (e: any) {
      setError(e?.message || 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1.5">
      {verification && (
        <div className="flex flex-wrap items-center gap-2">
          <MorStatusBadge verification={verification} />
          {verification.taxpayerName && (
            <span className="text-sm font-medium text-muted-foreground">{verification.taxpayerName}</span>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={verification ? 'outline' : 'default'}
          disabled={busy || !(tin || '').trim()}
          onClick={() => verify(Boolean(verification))}
          className={className}
        >
          {busy ? (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <ShieldQuestion className="mr-1.5 h-3.5 w-3.5" />
          )}
          {verification ? 'Refresh from MoR' : label}
        </Button>
        {verification && (
          <span className="text-xs text-muted-foreground">
            {verification.status === 'unavailable' || verification.status === 'failed'
              ? reasonText[verification.reason || ''] || verification.reason
              : isVerificationFresh(verification)
                ? `Cached ${verificationAgeLabel(verification.cachedAt)} from MoR`
                : 'Cached answer is stale — refresh from MoR to confirm'}
          </span>
        )}
      </div>
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}