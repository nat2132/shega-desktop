import { useCallback, useEffect, useSyncExternalStore } from 'react';

/**
 * Tracks the customer's payments against the backend, which is the only source
 * of truth for whether a submission is still being reviewed.
 *
 * Everything here is deliberately server-derived rather than held in component
 * state: the pending flag has to survive closing the app, signing out and back
 * in, and opening a second authorised device. A local flag would reset on all
 * three and let the customer submit the same transaction repeatedly.
 *
 * The state lives in a module-level store rather than in a provider because the
 * upgrade entry points are scattered — the Subscription page, the header, the
 * locked-feature modal and the upsell modal — and all of them must agree about
 * whether a payment is already open. A store keeps one poller and one request
 * per interval no matter how many components ask, without every consumer having
 * to sit under a shared provider.
 */

export type PaymentType =
  | 'subscription'
  | 'renewal'
  | 'additional_business'
  | (string & {});

export interface CustomerPayment {
  id: number;
  status: string;
  amount?: number | string | null;
  transaction_id?: string | null;
  payment_method?: string | null;
  payment_type?: PaymentType | null;
  quantity?: number | null;
  description?: string | null;
  created_at?: string | null;
  reviewed_at?: string | null;
  admin_notes?: string | null;
}

// Adding a business is the only paid capacity add-on. Devices connect for free,
// so there is no "additional device" payment type any more.
export const ADDON_PAYMENT_TYPES: PaymentType[] = ['additional_business'];

/** Payments that pay for capacity rather than the subscription itself. */
export function isAddonPayment(p: Pick<CustomerPayment, 'payment_type'>): boolean {
  return ADDON_PAYMENT_TYPES.includes(p.payment_type as PaymentType);
}

const REFRESH_INTERVAL_MS = 60_000;

interface Snapshot {
  payments: CustomerPayment[];
  loading: boolean;
  error: string | null;
  /** False once the main process reports there is no Shega session to ask. */
  linked: boolean;
}

let snapshot: Snapshot = { payments: [], loading: false, error: null, linked: true };
let inflight: Promise<CustomerPayment[]> | null = null;
let unlinked = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let focusHandler: (() => void) | null = null;
let subscribers = 0;
let pollMs = REFRESH_INTERVAL_MS;

const listeners = new Set<() => void>();

const emit = () => {
  for (const l of listeners) l();
};

const setSnapshot = (patch: Partial<Snapshot>) => {
  snapshot = { ...snapshot, ...patch };
  emit();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => snapshot;

async function fetchPayments(): Promise<CustomerPayment[]> {
  if (inflight) return inflight;
  setSnapshot({ loading: true });
  inflight = (async () => {
    try {
      const res = await window.api?.backendMyPayments?.();
      if (res?.success && Array.isArray(res.payments)) {
        unlinked = false;
        setSnapshot({ payments: res.payments, error: null, linked: true });
        return res.payments;
      }
      const msg = res?.error || null;
      // No Shega account means there is nothing to poll for. Stop the timer and
      // stop reporting an error, but keep the focus listener so linking an
      // account later is picked up without a reload.
      if (msg && /not linked/i.test(msg)) {
        unlinked = true;
        setSnapshot({ payments: [], error: null, linked: false });
      } else {
        setSnapshot({ error: msg });
      }
      return [] as CustomerPayment[];
    } catch (e: any) {
      setSnapshot({ error: e?.message ?? String(e) });
      return [] as CustomerPayment[];
    } finally {
      inflight = null;
      setSnapshot({ loading: false });
    }
  })();
  return inflight;
}

function start() {
  void fetchPayments();
  if (!pollTimer) {
    pollTimer = setInterval(() => {
      // While unlinked there is nothing to poll; a re-check happens on window
      // focus or an explicit refresh() instead of burning requests.
      if (!unlinked) void fetchPayments();
    }, pollMs);
  }
  if (!focusHandler) {
    focusHandler = () => void fetchPayments();
    window.addEventListener('focus', focusHandler);
  }
}

function stop() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (focusHandler) {
    window.removeEventListener('focus', focusHandler);
    focusHandler = null;
  }
  subscribers = 0;
}

export function usePaymentStatus(options?: { linked?: boolean; pollMs?: number }) {
  const linked = options?.linked ?? true;
  const interval = options?.pollMs ?? REFRESH_INTERVAL_MS;

  useEffect(() => {
    if (!linked) return;
    pollMs = interval;
    subscribers += 1;
    if (subscribers === 1) start();
    return () => {
      subscribers -= 1;
      if (subscribers <= 0) stop();
    };
  }, [linked, interval]);

  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const payments = current.payments;
  const pending = payments.filter((p) => p.status === 'pending');
  const pendingSubscription = pending.filter((p) => !isAddonPayment(p));
  const pendingAddons = pending.filter((p) => isAddonPayment(p));
  const rejected = payments.filter((p) => p.status === 'rejected');
  const approved = payments.filter((p) => p.status === 'approved');

  /** True when this add-on already has a submission awaiting review. */
  const hasPendingAddon = useCallback(
    (type: PaymentType) => pendingAddons.some((p) => p.payment_type === type),
    [pendingAddons],
  );

  return {
    payments,
    pending,
    pendingSubscription,
    pendingAddons,
    rejected,
    approved,
    hasPendingAddon,
    /** True when a subscription or renewal is already awaiting review. */
    hasPendingSubscription: pendingSubscription.length > 0,
    loading: current.loading,
    error: current.error,
    linked: current.linked,
    refresh: fetchPayments,
  };
}
