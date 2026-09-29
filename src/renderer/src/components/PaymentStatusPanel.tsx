import React from 'react';
import { Hourglass, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import type { CustomerPayment } from '../hooks/usePaymentStatus';

const TYPE_LABELS: Record<string, string> = {
  subscription: 'Subscription',
  renewal: 'Subscription renewal',
  additional_mobile_device: 'Additional mobile device',
  additional_desktop_device: 'Additional desktop device',
  additional_business: 'Additional business',
};

const label = (p: CustomerPayment) => {
  const base = TYPE_LABELS[String(p.payment_type)] || 'Payment';
  const qty = p.quantity && Number(p.quantity) > 1 ? ` × ${p.quantity}` : '';
  return `${base}${qty}`;
};

const money = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? `ETB ${n.toLocaleString()}` : '';
};

const when = (v?: string | null) => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
};

const stamp = (p: CustomerPayment) => new Date(p.reviewed_at || p.created_at || 0).getTime();

/**
 * The endpoint returns the customer's whole payment history, so a settled
 * payment from months ago must not be re-announced as news on every visit.
 * Only the most recent one, and only while it is fresh, is worth a banner.
 */
function announce<T extends CustomerPayment>(list: T[], windowMs: number): T[] {
  const cutoff = Date.now() - windowMs;
  const newest = [...list].sort((a, b) => stamp(b) - stamp(a))[0];
  if (!newest) return [];
  const at = stamp(newest);
  if (!Number.isFinite(at) || at < cutoff) return [];
  return [newest];
}

const APPROVAL_WINDOW_MS = 24 * 60 * 60 * 1000;
const REJECTION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function Row({ p }: { p: CustomerPayment }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-foreground/90">{label(p)}</span>
        <span className="text-[11px] font-bold text-foreground/60">{money(p.amount)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {p.transaction_id && (
          <span>
            Transaction ID:{' '}
            <span className="font-mono font-bold text-foreground">{p.transaction_id}</span>
          </span>
        )}
        {p.payment_method && <span>via {p.payment_method}</span>}
        {when(p.created_at) && <span>Submitted {when(p.created_at)}</span>}
      </div>
      {p.admin_notes && (
        <p className="text-[11px] text-amber-400/90">Note from admin: {p.admin_notes}</p>
      )}
    </div>
  );
}

/**
 * The status block on the Subscription page.
 *
 * A submission is not a self-approval: until an admin reviews it the requested
 * capacity stays inactive, so this states that plainly and blocks a second
 * submission of the same thing while the first is still open.
 */
export const PaymentStatusPanel: React.FC<{
  pending: CustomerPayment[];
  approved: CustomerPayment[];
  rejected: CustomerPayment[];
  onRefresh: () => void | Promise<void>;
  refreshing?: boolean;
  /** Human label for the plan being bought, shown in the pending header. */
  planName?: string | null;
}> = ({ pending, approved, rejected, onRefresh, refreshing, planName }) => {
  if (!pending.length && !approved.length && !rejected.length) return null;

  // Announcements are one-shot: dismissed so the banner does not return on
  // every re-render or poll, and limited to recent activity so settled history
  // is not presented as news.
  const [dismissed, setDismissed] = React.useState<string[]>([]);
  const seen = (p: CustomerPayment) => !dismissed.includes(String(p.id));
  const freshApprovals = announce(approved, APPROVAL_WINDOW_MS).filter(seen);
  const freshRejections = announce(rejected, REJECTION_WINDOW_MS).filter(seen);

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Hourglass className="h-5 w-5 shrink-0 text-amber-400" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black uppercase tracking-tight text-amber-300">
                Payment Pending — Waiting for Admin Approval
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
                {planName
                  ? `Your payment for ${planName} has been received and is awaiting review. `
                  : 'Your payment has been received and is awaiting review. '}
                Your subscription and any requested extra capacity stay inactive until an admin approves it.
                You do not need to submit the transaction again.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 rounded-lg text-[11px] font-black uppercase tracking-widest"
              onClick={() => void onRefresh()}
              disabled={refreshing}
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="space-y-2">
            {pending.map((p) => (
              <Row key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}

      {freshApprovals.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black uppercase tracking-tight text-emerald-300">
                Payment Approved — Subscription Activated
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-emerald-200/80">
                Your payment was approved and your subscription is now active.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {freshApprovals.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <Row p={p} />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0 rounded-lg text-[11px] font-black uppercase tracking-widest"
                  onClick={() => setDismissed((d) => [...d, String(p.id)])}
                >
                  Dismiss
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {freshRejections.length > 0 && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 shrink-0 text-red-400" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black uppercase tracking-tight text-red-300">
                Payment Rejected
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-red-200/80">
                An admin could not verify this payment. You can submit a corrected transaction below.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {freshRejections.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <Row p={p} />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0 rounded-lg text-[11px] font-black uppercase tracking-widest"
                  onClick={() => setDismissed((d) => [...d, String(p.id)])}
                >
                  Dismiss
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentStatusPanel;
