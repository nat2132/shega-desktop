import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Crown, Sparkles, Shield, Clock, Calendar, CreditCard, ArrowRight, Check,
  RefreshCw, ChevronUp, FileText, HelpCircle, Star, AlertTriangle, Loader2,
  Phone, Building2, User, Hash, CalendarDays, MessageSquare, CheckCircle2,
  XCircle, Hourglass, Gift, Mail, Lock, Cloud, LogOut, Link2, Server,
  DollarSign, Smartphone, Monitor
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useSubscription } from '../context/SubscriptionContext';
import PremiumBadge from '../components/PremiumBadge';
import { SubscriptionAddonsCard } from '../components/SubscriptionAddonsCard';
import PaymentStatusPanel from '../components/PaymentStatusPanel';
import { usePaymentStatus } from '../hooks/usePaymentStatus';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { parsePlanEdition } from '@shega/shared';
import { toast } from 'sonner';
interface Plan {
  id: number;
  name: string;
  /** Which platforms the edition unlocks: mobile | desktop | both. */
  tier: string;
  durationMonths: number;
  price: number;
  description: string;
  features: string;
}

/**
 * The canonical plan structure. `tier` on a plan now carries the EDITION, so
 * the plan grid groups by platform instead of the retired basic/premium split.
 */
const PLAN_EDITIONS = [
  { key: 'mobile', labelKey: 'subscription.plan_mobile', highlight: false },
  { key: 'desktop', labelKey: 'subscription.plan_desktop', highlight: false },
  { key: 'both', labelKey: 'subscription.plan_both', highlight: true },
] as const;

/**
 * Legacy plan rows may still carry the old words; the shared parser maps them
 * onto the canonical edition so this page groups identically to Mobile.
 */
function planEdition(tier: string | null | undefined): string {
  return parsePlanEdition(tier) ?? 'both';
}

interface CostBreakdown {
  base: {
    name: string;
    price: number;
    included: { mobile: number; desktop: number; businesses: number };
  };
  addons: {
    mobile: { owned: number; active: number; unit_price: number; monthly_total: number };
    desktop: { owned: number; active: number; unit_price: number; monthly_total: number };
    businesses: { owned: number; active: number; unit_price: number; monthly_total: number };
  };
  total_monthly: number;
}

const SubscriptionCostBreakdown: React.FC<{ licenseId: number }> = ({ licenseId }) => {
  const { t } = useSettings();
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await window.api.backendCostBreakdown({ licenseId });
        if (res?.success) setBreakdown(res.breakdown);
      } catch (_) { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [licenseId]);

  if (loading) return null;
  if (!breakdown) return null;

  const formatETB = (n: number) => n.toLocaleString() + ' ' + t('subscription.etb');

  return (
    <Card className="rounded-2xl border-primary/20 bg-gradient-to-r from-primary/[0.04] to-transparent">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <DollarSign className="h-3 w-3" />
          {t('subscription.cost_breakdown')}
        </CardTitle>
        <CardDescription className="text-xs">{t('subscription.cost_breakdown_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {/* Base Plan */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wide text-primary">{t('subscription.base_plan')}</span>
            <span className="text-sm font-bold text-primary">{formatETB(breakdown.base.price)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1"><Smartphone className="h-3 w-3" /> {t('subscription.mobile')}: {breakdown.base.included.mobile}</div>
            <div className="flex items-center gap-1"><Monitor className="h-3 w-3" /> {t('subscription.desktop')}: {breakdown.base.included.desktop}</div>
            <div className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {t('subscription.businesses')}: {breakdown.base.included.businesses}</div>
          </div>
        </div>

        {/* Add-ons */}
        <div className="space-y-2">
          {breakdown.addons.mobile.owned > 0 && (
            <div className="rounded-xl border border-border/50 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-blue-500/10"><Smartphone className="h-3 w-3 text-blue-500" /></div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide">{t('subscription.add_mobile_device')}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {t('subscription.owned')}: {breakdown.addons.mobile.owned} · {t('subscription.active')}: {breakdown.addons.mobile.active}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold">{formatETB(breakdown.addons.mobile.unit_price)} × {breakdown.addons.mobile.owned}</p>
                <p className="text-[11px] font-bold text-primary">{formatETB(breakdown.addons.mobile.monthly_total)}/mo</p>
              </div>
            </div>
          )}
          {breakdown.addons.desktop.owned > 0 && (
            <div className="rounded-xl border border-border/50 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-green-500/10"><Monitor className="h-3 w-3 text-green-500" /></div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide">{t('subscription.add_desktop_device')}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {t('subscription.owned')}: {breakdown.addons.desktop.owned} · {t('subscription.active')}: {breakdown.addons.desktop.active}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold">{formatETB(breakdown.addons.desktop.unit_price)} × {breakdown.addons.desktop.owned}</p>
                <p className="text-[11px] font-bold text-primary">{formatETB(breakdown.addons.desktop.monthly_total)}/mo</p>
              </div>
            </div>
          )}
          {breakdown.addons.businesses.owned > 0 && (
            <div className="rounded-xl border border-border/50 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-violet-500/10"><Building2 className="h-3 w-3 text-violet-500" /></div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide">{t('subscription.add_business')}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {t('subscription.owned')}: {breakdown.addons.businesses.owned} · {t('subscription.active')}: {breakdown.addons.businesses.active}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold">{formatETB(breakdown.addons.businesses.unit_price)} × {breakdown.addons.businesses.owned}</p>
                <p className="text-[11px] font-bold text-primary">{formatETB(breakdown.addons.businesses.monthly_total)}/mo</p>
              </div>
            </div>
          )}
          {(breakdown.addons.mobile.owned === 0 && breakdown.addons.desktop.owned === 0 && breakdown.addons.businesses.owned === 0) && (
            <p className="text-xs text-muted-foreground text-center py-2">{t('subscription.no_addons')}</p>
          )}
        </div>

        {/* Total */}
        <div className="rounded-xl border-2 border-primary/30 bg-primary/10 p-3 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest">{t('subscription.monthly_total')}</span>
          <span className="text-lg font-black text-primary">{formatETB(breakdown.total_monthly)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

const SubscriptionDashboard: React.FC = () => {
  const { t, formatDate } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const { subscription, renewalInfo, isPremium, isTrial, daysRemaining, refresh } = useSubscription();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const lockedFeature = (location.state as any)?.lockedFeature;

  const [cloud, setCloud] = useState<any>(null);
  const [cloudForm, setCloudForm] = useState({ username: '', password: '' });
  const [cloudBusy, setCloudBusy] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [savingServer, setSavingServer] = useState(false);

  // The backend owns whether a submission is still under review, so the pending
  // state is re-read from the API rather than remembered by this component.
  const paymentsApi = usePaymentStatus({ linked: !!cloud?.linked });

  const handleRefreshAll = useCallback(async () => {
    await Promise.all([refresh(), paymentsApi.refresh()]);
  }, [refresh, paymentsApi]);

  useEffect(() => {
    void handleRefreshAll();
  }, [handleRefreshAll]);

  const loadSession = async () => {
    try {
      const session = await window.api.backendSession();
      setCloud(session);
      setServerUrl(session?.baseUrl ?? '');
    } catch (_) { /* preload may not expose it yet */ }
  };

  const handleSaveServer = async () => {
    setSavingServer(true);
    try {
      const res = await window.api.setBackendUrl(serverUrl);
      if (res?.success) {
        setServerUrl(res.baseUrl ?? serverUrl);
        toast.success('Shega server URL updated.');
      } else {
        toast.error(res?.error || 'Could not update the server URL.');
      }
    } catch (_) {
      toast.error('Could not update the server URL.');
    } finally {
      setSavingServer(false);
    }
  };

  useEffect(() => {
    loadData();
    loadSession();
  }, []);

  const handleLink = async () => {
    if (!cloudForm.username.trim() || !cloudForm.password) {
      toast.error('Enter the Shega account email and password.');
      return;
    }
    setCloudBusy(true);
    try {
      const res = await window.api.backendLogin({ username: cloudForm.username.trim(), password: cloudForm.password });
      if (!res.success) {
        toast.error(res.error || 'Could not link the account.');
        return;
      }
      setCloudForm({ username: '', password: '' });
      await loadSession();
      await refresh();
      toast.success(`Linked to ${res.email || cloudForm.username}. Subscription status synced.`);
    } catch (err: any) {
      toast.error(err.message || 'Could not link the account.');
    } finally {
      setCloudBusy(false);
    }
  };

  const handleLogout = async () => {
    setCloudBusy(true);
    try {
      await window.api.backendLogout();
      setCloud(null);
      await refresh();
      toast.success('Unlinked from the Shega account.');
    } catch (err: any) {
      toast.error(err.message || 'Could not unlink.');
    } finally {
      setCloudBusy(false);
    }
  };

  const handleSync = async () => {
    setCloudBusy(true);
    try {
      const res = await window.api.backendSync();
      if (!res.success) {
        toast.error(res.error || 'Could not refresh the status.');
        return;
      }
      await loadSession();
      await refresh();
      toast.success('Subscription status refreshed from the server.');
    } catch (err: any) {
      toast.error(err.message || 'Could not refresh the status.');
    } finally {
      setCloudBusy(false);
    }
  };

  const cloudStatusBadge = (status: string | null) => {
    const variants: Record<string, { color: string; icon: any; label: string }> = {
      active: { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2, label: 'Active' },
      trial: { color: 'bg-violet-500/10 text-violet-500 border-violet-500/20', icon: Gift, label: 'Trial' },
      pending_payment: { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Hourglass, label: 'Pending approval' },
      payment_rejected: { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle, label: 'Payment rejected' },
      expired: { color: 'bg-muted text-muted-foreground border-border/50', icon: AlertTriangle, label: 'Expired' },
      none: { color: 'bg-muted text-muted-foreground border-border/50', icon: Cloud, label: 'No subscription' },
    };
    const v = variants[status || 'none'] || variants.none;
    const Icon = v.icon;
    return (
      <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${v.color}`}>
        <Icon className="h-2.5 w-2.5 mr-1" />
        {v.label}
      </Badge>
    );
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, h] = await Promise.all([
        window.api.getSubscriptionPlans(),
        window.api.getSubscriptionHistory(),
      ]);
      setPlans(p || []);
      // Local subscription history only tracks tier changes.
      // The authoritative payment list (including add-ons) comes from the backend
      // via usePaymentStatus. We merge both into a unified timeline below.
      setHistory(h || []);
    } catch (err) {
      console.error('Failed to load subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

const statusBadge = (status: string) => {
      const variants: Record<string, { color: string; icon: any; label: string }> = {
        approved: { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2, label: t('subscription.payment_approved', 'Approved') },
        pending: { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Hourglass, label: t('subscription.payment_pending') },
        rejected: { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle, label: t('subscription.payment_rejected') },
        cancelled: { color: 'bg-muted text-muted-foreground border-border/50', icon: XCircle, label: t('subscription.payment_cancelled', 'Cancelled') },
      };
      const v = variants[status] || variants.approved;
      const Icon = v.icon;
      return (
        <Badge variant="outline" className={`text-xs font-black uppercase tracking-widest ${v.color}`}>
          <Icon className="h-2.5 w-2.5 mr-1" />
          {v.label}
        </Badge>
      );
    };

  // Unified history: merge local subscription tier changes with backend payments (including add-ons)
  const unifiedHistory = React.useMemo(() => {
    const local = (history || []).map((h: any) => ({
      id: `local-${h.id}`,
      date: h.createdAt,
      type: 'subscription',
      action: h.action?.replace(/_/g, ' ') || 'Subscription change',
      details: h.details || '',
      tier: { old: h.oldTier, new: h.newTier },
    }));
    const backend = (paymentsApi.payments || []).map((p: any) => ({
      id: `pay-${p.id}`,
      date: p.created_at,
      type: 'payment',
      action: p.status === 'approved' ? 'Payment Approved' : p.status === 'rejected' ? 'Payment Rejected' : 'Payment Submitted',
      details: `${p.description || p.payment_type || 'Payment'} · ${p.transaction_id || '—'}`,
      amount: p.amount,
      status: p.status,
      payment_type: p.payment_type,
    }));
    return [...local, ...backend].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history, paymentsApi.payments]);

    if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('subscription.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-black uppercase tracking-tight">{t('subscription.title')}</h1>
            {isPremium && <PremiumBadge size="md" />}
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('subscription.subtitle')}</p>
        </div>
        {daysRemaining > 0 && daysRemaining <= 7 && !isTrial && !paymentsApi.hasPendingSubscription && (
          <Button
            onClick={() => navigate('/subscription/payment')}
            className="rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          >
            {t('subscription.renew')} <RefreshCw className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>

      {/* Locked Feature Redirect Banner */}
      {lockedFeature && (
        <Card className="rounded-2xl border-amber-500/20 bg-gradient-to-r from-amber-500/[0.04] to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/10">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-amber-500">
                {t('premium.locked_title')}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('premium.locked_desc')} {t('subscription.upgrade_access', { feature: lockedFeature }).replace('{{feature}}', lockedFeature)}
              </p>
            </div>
            <Button
              onClick={() => setActiveTab('plans')}
              size="sm"
              className="rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-amber-600"
            >
              {t('subscription.compare_plans')}
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="rounded-2xl">
          <TabsTrigger value="overview" className="text-xs font-black uppercase tracking-widest rounded-xl">
            {t('subscription.current_plan')}
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs font-black uppercase tracking-widest rounded-xl">
            {t('subscription.payment_history')}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs font-black uppercase tracking-widest rounded-xl">
            {t('subscription.subscription_history')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Crown className="h-3 w-3" />
                  {t('subscription.plan')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black">
                    {isTrial
                      ? t('subscription.trial_plan')
                      : subscription?.tier === 'mobile'
                        ? t('subscription.plan_mobile')
                        : subscription?.tier === 'desktop'
                          ? t('subscription.plan_desktop')
                          : t('subscription.plan_both')}
                  </span>
                  {isPremium && <PremiumBadge size="sm" />}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Shield className="h-3 w-3" />
                  {t('subscription.status')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {statusBadge(subscription?.status || 'expired')}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {t('subscription.days_remaining')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <span className="text-lg font-black">
                  {isTrial ? trialDaysLeft : daysRemaining}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  {t('premium.days_remaining', { days: String(isTrial ? trialDaysLeft : daysRemaining) })}
                </span>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {t('subscription.expiry_date')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <span className="text-sm font-bold">
                  {subscription?.expiresAt ? formatDate(subscription.expiresAt) : '--'}
                </span>
              </CardContent>
            </Card>
          </div>

          {/*
            Payment status comes from the server's payment list, not from the
            single `pending_payment` summary on the status payload: that field
            only reports the newest submission, so a renewal and a device add-on
            awaiting review together would hide one of them. It also replaces the
            old banner that claimed access "remains active" during review, which
            is wrong for a first subscription and misleading for a renewal.
          */}
          <PaymentStatusPanel
            pending={paymentsApi.pending}
            approved={paymentsApi.approved}
            rejected={paymentsApi.rejected}
            onRefresh={handleRefreshAll}
            refreshing={paymentsApi.loading}
            planName={cloud?.planName || subscription?.planName || null}
          />

          {/* Shega Cloud Account — the backend is the source of truth */}
          <Card className="rounded-2xl border-primary/20 bg-gradient-to-r from-primary/[0.04] to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Cloud className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-widest">Shega Account</p>
                  <p className="text-[11px] text-muted-foreground">
                    {cloud?.linked
                      ? `Linked as ${cloud.email}`
                      : 'Link your Shega account so this desktop shares the same backend subscription as Shega Mobile and Shega Admin.'}
                  </p>
                </div>
                {cloud?.linked && (
                  <div className="flex items-center gap-3">
                    {cloudStatusBadge(cloud.status)}
                    {cloud.planName && (
                      <span className="text-[11px] font-bold text-muted-foreground">{cloud.planName}</span>
                    )}
                    <Button size="sm" variant="outline" onClick={handleSync} disabled={cloudBusy} className="rounded-xl text-[10px] font-black uppercase tracking-widest">
                      <RefreshCw className={`h-3 w-3 mr-1 ${cloudBusy ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleLogout} disabled={cloudBusy} className="rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400">
                      <LogOut className="h-3 w-3 mr-1" />
                      Unlink
                    </Button>
                  </div>
                )}
              </div>

              {!cloud && (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-[11px] text-muted-foreground">Checking account link…</p>
                </div>
              )}

              {cloud && !cloud.linked && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <Mail className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Account email"
                      value={cloudForm.username}
                      onChange={e => setCloudForm(prev => ({ ...prev, username: e.target.value }))}
                      className="pl-9 rounded-xl text-[11px]"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <Lock className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={cloudForm.password}
                      onChange={e => setCloudForm(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-9 rounded-xl text-[11px]"
                    />
                  </div>
                  <Button onClick={handleLink} disabled={cloudBusy} className="rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {cloudBusy ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Link2 className="h-3 w-3 mr-1" />}
                    Link account
                  </Button>
                </div>
              )}

              {cloud?.linked && !cloud.status && (
                <p className="text-[11px] text-muted-foreground">
                  No subscription on the server yet — the desktop stays in its current local state until the backend reports one.
                </p>
              )}

              {/* The backend URL is configuration: point the desktop at a testing
                  tunnel or a self-hosted deployment without rebuilding. */}
              <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-2">
                <Server className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Input
                  value={serverUrl}
                  onChange={e => setServerUrl(e.target.value)}
                  placeholder="https://your-shega-backend"
                  className="h-8 flex-1 rounded-xl text-[11px]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveServer}
                  disabled={savingServer}
                  className="rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  {savingServer ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Cost Breakdown */}
          {cloud?.linked && subscription?.licenseId && (
            <SubscriptionCostBreakdown licenseId={subscription.licenseId} />
          )}

          {/* Capacity Add-ons — the server prices and grants these */}
          <SubscriptionAddonsCard
            linked={!!cloud?.linked}
            planId={subscription?.planId ?? null}
            hasFullAccess={isPremium || isTrial}
          />

          {/* Trial Banner */}
          {isTrial && (
            <Card className="rounded-2xl border-amber-500/20 bg-gradient-to-r from-amber-500/[0.04] to-transparent">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-500/10">
                    <Gift className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-amber-500">{t('subscription.trial_heading')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('premium.trial_ends', { date: subscription?.trialEndsAt ? formatDate(subscription.trialEndsAt) : '--' })}
                    </p>
                  </div>
                </div>
                {!paymentsApi.hasPendingSubscription && (
                  <Button
                    onClick={() => navigate('/subscription/payment')}
                    className="rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                  >
                    {t('subscription.upgrade_now')} <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Expiry Warning */}
          {daysRemaining <= 7 && daysRemaining > 0 && !isTrial && (
            <Card className="rounded-2xl border-red-500/20 bg-gradient-to-r from-red-500/[0.04] to-transparent">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-red-500">
                    {t('subscription.expires_soon', {
                      plan:
                        subscription?.tier === 'mobile'
                          ? t('subscription.plan_mobile')
                          : subscription?.tier === 'desktop'
                            ? t('subscription.plan_desktop')
                            : t('subscription.plan_both'),
                      days: String(daysRemaining),
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('subscription.renew_desc')}</p>
                </div>
                <Button
                  onClick={() => navigate('/subscription/payment')}
                  variant="outline"
                  size="sm"
                  className="ml-auto rounded-xl text-xs font-black uppercase tracking-widest"
                >
                  {t('subscription.renew')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Expired Message */}
          {subscription?.status === 'expired' && (
            <Card className="rounded-2xl border-red-500/20 bg-gradient-to-r from-red-500/[0.04] to-transparent">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-xs font-bold text-red-500">{t('subscription.expired_message')}</p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className={`grid gap-4 ${paymentsApi.hasPendingSubscription ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {!paymentsApi.hasPendingSubscription && (
              <Card className="rounded-2xl border-border/50 cursor-pointer hover:bg-muted/30 transition-all" onClick={() => navigate('/subscription/payment')}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-500/10">
                    <CreditCard className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest">{t('subscription.billing')}</p>
                    <p className="text-xs text-muted-foreground">{t('subscription.renew')} / {t('subscription.upgrade')}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </CardContent>
              </Card>
            )}

            <Card className="rounded-2xl border-border/50 cursor-pointer hover:bg-muted/30 transition-all">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">{t('subscription.support')}</p>
                  <p className="text-xs text-muted-foreground">{t('subscription.support_url')}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('subscription.transaction_history')}</p>
            {!paymentsApi.hasPendingSubscription && (
              <Button
                onClick={() => navigate('/subscription/payment')}
                size="sm"
                className="rounded-xl text-xs font-black uppercase tracking-widest"
              >
                <CreditCard className="h-3 w-3 mr-1" />
                {t('subscription.submit_payment')}
              </Button>
            )}
          </div>

{paymentsApi.payments.length === 0 ? (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-8 text-center">
                <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('subscription.no_transactions')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {paymentsApi.payments.map(tx => (
                <div key={tx.id} className="p-4 rounded-2xl border border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      tx.status === 'approved' ? 'bg-emerald-500/10' :
                      tx.status === 'rejected' ? 'bg-red-500/10' :
                      'bg-amber-500/10'
                    }`}>
                      {tx.status === 'approved' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                       tx.status === 'rejected' ? <XCircle className="h-4 w-4 text-red-500" /> :
                       <Hourglass className="h-4 w-4 text-amber-500" />}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest">{tx.description || tx.payment_type || 'Payment'}</p>
                      <p className="text-xs text-muted-foreground">{tx.transaction_id} · {formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold">{tx.amount != null ? Number(tx.amount).toLocaleString() : '—'} {t('subscription.etb')}</p>
                    {statusBadge(tx.status)}
                    {tx.admin_notes && tx.status === 'rejected' && (
                      <p className="text-xs text-red-400 mt-0.5">{tx.admin_notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
<TabsContent value="history" className="space-y-4">
            {unifiedHistory.length === 0 ? (
              <Card className="rounded-2xl border-border/50">
                <CardContent className="p-8 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('subscription.no_subscription_history')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-1">
                {unifiedHistory.map((h: any) => (
                  <div key={h.id} className="p-3 rounded-xl border border-border/50 flex items-center gap-3">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                      h.type === 'payment' && h.status === 'approved' ? 'bg-emerald-500/10' :
                      h.type === 'payment' && h.status === 'rejected' ? 'bg-red-500/10' :
                      h.type === 'payment' ? 'bg-amber-500/10' :
                      'bg-muted'
                    }`}>
                      {h.type === 'payment' && h.status === 'approved' ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> :
                       h.type === 'payment' && h.status === 'rejected' ? <XCircle className="h-3 w-3 text-red-500" /> :
                       h.type === 'payment' ? <Hourglass className="h-3 w-3 text-amber-500" /> :
                       <Clock className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">{h.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{h.details}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {h.amount != null && (
                        <p className="text-xs font-bold text-emerald-500">{Number(h.amount).toLocaleString()} {t('subscription.etb')}</p>
                      )}
                      {h.status && h.type === 'payment' && (
                        <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${
                          h.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          h.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {h.status}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground shrink-0">{formatDate(h.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionDashboard;
