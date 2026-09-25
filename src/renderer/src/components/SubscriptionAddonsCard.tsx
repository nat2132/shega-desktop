import React, { useCallback, useEffect, useState } from 'react';
import { Smartphone, Monitor, Building2, Minus, Plus, Loader2, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useSettings } from '../context/SettingsContext';
import { toast } from 'sonner';

type AddonKey = 'additional_mobile_device' | 'additional_desktop_device' | 'additional_business';

interface ServerPlan {
  id: number;
  display_name?: string;
  name?: string;
  addon_mobile_price?: number;
  addon_desktop_price?: number;
  addon_business_price?: number;
}

interface CloudStatus {
  status?: string;
  plan_id?: number | null;
  devices?: {
    mobile?: { allocated?: number; used?: number };
    desktop?: { allocated?: number; used?: number };
  };
  businesses?: { allocated?: number; used?: number };
}

const ADDONS: Array<{
  key: AddonKey;
  titleKey: string;
  descKey: string;
  priceKey: 'addon_mobile_price' | 'addon_desktop_price' | 'addon_business_price';
  Icon: typeof Smartphone;
  allocation: (s: CloudStatus) => { allocated: number; used: number };
}> = [
  {
    key: 'additional_mobile_device',
    titleKey: 'subscription.add_mobile_device',
    descKey: 'subscription.add_mobile_device_desc',
    priceKey: 'addon_mobile_price',
    Icon: Smartphone,
    allocation: (s) => ({ allocated: s.devices?.mobile?.allocated ?? 0, used: s.devices?.mobile?.used ?? 0 }),
  },
  {
    key: 'additional_desktop_device',
    titleKey: 'subscription.add_desktop_device',
    descKey: 'subscription.add_desktop_device_desc',
    priceKey: 'addon_desktop_price',
    Icon: Monitor,
    allocation: (s) => ({ allocated: s.devices?.desktop?.allocated ?? 0, used: s.devices?.desktop?.used ?? 0 }),
  },
  {
    key: 'additional_business',
    titleKey: 'subscription.add_business',
    descKey: 'subscription.add_business_desc',
    priceKey: 'addon_business_price',
    Icon: Building2,
    allocation: (s) => ({ allocated: s.businesses?.allocated ?? 0, used: s.businesses?.used ?? 0 }),
  },
];

/**
 * Capacity add-ons. The server owns pricing and grants the extra allocation
 * only after the Telebirr payment is approved, so this only submits a payment.
 */
export const SubscriptionAddonsCard: React.FC<{
  linked: boolean;
  planId?: number | null;
  hasFullAccess: boolean;
}> = ({ linked, planId, hasFullAccess }) => {
  const { t } = useSettings();
  const [plans, setPlans] = useState<ServerPlan[]>([]);
  const [status, setStatus] = useState<CloudStatus | null>(null);
  const [qty, setQty] = useState<Record<AddonKey, number>>({
    additional_mobile_device: 1,
    additional_desktop_device: 1,
    additional_business: 1,
  });
  const [transactionId, setTransactionId] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!linked) return;
    try {
      const [plansRes, syncRes] = await Promise.all([
        window.api.backendPlans(),
        window.api.backendSync(),
      ]);
      if (plansRes?.success && Array.isArray(plansRes.plans)) setPlans(plansRes.plans);
      if (syncRes?.success) setStatus(syncRes.status || null);
    } catch (_) { /* keep the card quiet when the server is unreachable */ }
  }, [linked]);

  useEffect(() => { load(); }, [load]);

  if (!linked) return null;

  const currentPlan = plans.find((p) => p.id === (status?.plan_id ?? planId));
  // The server computes the amount from its own plan row, so never invent a
  // price: without the server's add-on price the card stays disabled.
  const priceOf = (key: AddonKey) => {
    const value = currentPlan?.[ADDONS.find((a) => a.key === key)!.priceKey];
    return typeof value === 'number' && value > 0 ? value : null;
  };

  const submit = async (key: AddonKey) => {
    if (!transactionId.trim()) {
      toast.error(t('subscription.addons_txn_label'));
      return;
    }
    const plan = currentPlan?.id ?? planId;
    if (!plan) {
      toast.error(t('subscription.addons_active_required'));
      return;
    }
    setBusy(true);
    try {
      const res = await window.api.backendSubmitPayment({
        planId: plan,
        transactionId: transactionId.trim(),
        paymentMethod: 'telebirr',
        paymentType: key,
        quantity: qty[key],
        description: t(ADDONS.find((a) => a.key === key)!.titleKey),
      });
      if (res?.success) {
        toast.success(t('subscription.addons_success'));
        setTransactionId('');
        await load();
      } else {
        toast.error(res?.error || t('subscription.payment_rejected'));
      }
    } catch (err: any) {
      toast.error(err?.message || t('subscription.payment_rejected'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <CreditCard className="h-3 w-3" />
          {t('subscription.addons_title')}
        </CardTitle>
        <CardDescription className="text-xs">{t('subscription.addons_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {!hasFullAccess && (
          <p className="text-xs font-semibold text-amber-500">{t('subscription.addons_active_required')}</p>
        )}

        {ADDONS.map(({ key, titleKey, descKey, Icon, allocation }) => {
          const { allocated, used } = allocation(status || {});
          const unit = priceOf(key);
          const count = qty[key];
          return (
            <div key={key} className="flex flex-wrap items-center gap-3 rounded-xl border border-border/50 p-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-[180px] flex-1">
                <p className="text-xs font-black uppercase tracking-wide">{t(titleKey)}</p>
                <p className="text-[11px] text-muted-foreground">{t(descKey)}</p>
                <p className="text-[11px] font-semibold text-amber-500">
                  {unit == null
                    ? t('subscription.addons_price_unavailable', 'Price unavailable')
                    : `${(unit * count).toLocaleString()} ${t('subscription.etb')} / month (${unit.toLocaleString()} × ${count})`}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t('subscription.addons_usage', { used: String(used), allocated: String(allocated) })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 rounded-lg"
                  onClick={() => setQty((q) => ({ ...q, [key]: Math.max(1, q[key] - 1) }))}
                  disabled={!hasFullAccess || unit == null}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center text-sm font-black">{count}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 rounded-lg"
                  onClick={() => setQty((q) => ({ ...q, [key]: Math.min(10, q[key] + 1) }))}
                  disabled={!hasFullAccess || unit == null}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder={t('subscription.addons_txn_placeholder')}
                  className="h-8 w-44 text-xs"
                  disabled={!hasFullAccess || unit == null}
                />
                <Button
                  size="sm"
                  className="rounded-lg text-[11px] font-black uppercase tracking-widest"
                  disabled={!hasFullAccess || busy || unit == null}
                  onClick={() => submit(key)}
                >
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : t('subscription.addons_submit')}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default SubscriptionAddonsCard;
