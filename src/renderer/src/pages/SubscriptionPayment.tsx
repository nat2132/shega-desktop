import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, ArrowLeft, Check, Loader2, Phone,
  Building2, Hash, CalendarDays, MessageSquare, Smartphone,
  Copy, CheckCheck, AlertTriangle
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useSubscription } from '../context/SubscriptionContext';
import PremiumBadge from '../components/PremiumBadge';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '../components/ui/card';
import { toast } from 'sonner';

interface Plan {
  id: number;
  name: string;
  /** Edition: mobile | desktop | both (legacy plan rows may say basic/premium). */
  tier: string;
  edition?: string;
  durationMonths: number;
  price: number;
  description: string;
  features: string;
}

/** Resolve an edition from a plan's `edition`/`tier`/`name`, tolerating old rows. */
function planEditionFromTier(value: string | null | undefined): 'mobile' | 'desktop' | 'both' {
  const blob = String(value ?? '').toLowerCase();
  if (blob.includes('desktop') && blob.includes('mobile')) return 'both';
  if (blob.includes('premium')) return 'both';
  if (blob.includes('desktop')) return 'desktop';
  if (blob.includes('mobile') || blob.includes('basic')) return 'mobile';
  return 'both';
}

const SubscriptionPayment: React.FC = () => {
  const { t, formatDate } = useSettings();
  const navigate = useNavigate();
  const { subscription, refresh } = useSubscription();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cloudPlans, setCloudPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedServerPlanId, setSelectedServerPlanId] = useState<number | null>(null);
  const [step, setStep] = useState<'select' | 'pay' | 'submit' | 'done'>('select');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    transactionId: '',
    businessName: '',
    phoneNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    window.api.getSubscriptionPlans().then(setPlans);
    // When this desktop is linked to a Shega account the server plans are the
    // source of truth for what can be purchased (Mobile / Desktop / Both).
    (async () => {
      try {
        const session = await window.api.backendSession();
        if (!session?.linked) return;
        const res = await window.api.backendPlans();
        const src = (res?.success && res?.plans) || [];
        setCloudPlans(src.map((p: any) => ({
          id: Number(p.id),
          name: p.display_name || p.name,
          edition: p.edition || p.name,
          tier: planEditionFromTier(p.edition || p.name),
          durationMonths: Number(p.duration_months) || 1,
          price: Number(p.price) || 0,
          description: '',
          features: '',
        })));
      } catch (_) { /* offline or not linked — keep local plans */ }
    })();
  }, []);

  const handleSelectPlan = (plan: Plan, serverPlanId?: number) => {
    setSelectedPlan(plan);
    setSelectedServerPlanId(serverPlanId ?? null);
    setForm(prev => ({ ...prev, businessName: '', phoneNumber: '' }));
    setStep('pay');
  };

  const handleSubmit = async () => {
    if (!form.transactionId.trim() || !form.businessName.trim() || !form.phoneNumber.trim()) {
      toast.error(t('subscription.please_fill_required'));
      return;
    }
    if (!selectedPlan) return;

    setSubmitting(true);
    try {
      const result = selectedServerPlanId
        ? await window.api.backendSubmitPayment({
            planId: selectedServerPlanId,
            transactionId: form.transactionId.trim(),
            paymentMethod: 'telebirr',
            description: form.notes.trim() || 'Desktop payment submission',
          })
        : await window.api.submitPayment({
            transactionId: form.transactionId.trim(),
            businessName: form.businessName.trim(),
            phoneNumber: form.phoneNumber.trim(),
            selectedPlan: selectedPlan.name,
            amount: selectedPlan.price,
            paymentDate: form.paymentDate,
            notes: form.notes.trim() || undefined,
          });

      if (result.success) {
        setStep('done');
        toast.success(t('subscription.payment_submitted'));
        await refresh();
      }
    } catch (err: any) {
      toast.error(err.message || t('subscription.submission_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const copyNumber = () => {
    navigator.clipboard.writeText('09XX XXX XXX');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Plan Selection Step
  if (step === 'select') {
    return (
      <div className="space-y-6 p-6">
        <button onClick={() => navigate('/subscription')} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" />
          {t('common.go_back')}
        </button>

        <div>
          <h1 className="text-lg font-black uppercase tracking-tight">{t('subscription.pricing')}</h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('subscription.compare_plans')}</p>
        </div>

        <div className="space-y-6">
          {/* Server plans (account linked) — the canonical editions. */}
          {cloudPlans.length > 0 && (
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
                {t('subscription.pricing')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {cloudPlans.map((plan) => {
                  const edition = planEditionFromTier(plan.edition ?? plan.name);
                  const featured = edition === 'both';
                  return (
                    <Card
                      key={plan.id}
                      className={`rounded-2xl cursor-pointer transition-all ${featured ? 'border-amber-500/20 bg-gradient-to-b from-amber-500/[0.02] to-transparent hover:border-amber-500/40' : 'border-border/50 hover:border-primary/30'}`}
                      onClick={() => handleSelectPlan(plan, plan.id)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-xs font-black uppercase tracking-widest ${featured ? 'text-amber-500' : 'text-muted-foreground'}`}>
                            {t(`subscription.plan_${edition}`)}
                          </p>
                          {featured && <PremiumBadge size="sm" />}
                        </div>
                        <p className="text-3xl font-black">
                          {plan.price.toLocaleString()} <span className="text-sm text-muted-foreground font-bold">{t('subscription.etb')}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-2">
                          {t(`subscription.plan_${edition}_desc`)}
                        </p>
                        <Button size="sm" className={`mt-4 rounded-xl text-xs font-black uppercase tracking-widest w-full ${featured ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700' : ''}`}>
                          {t('subscription.choose_plan')}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Local plans (offline / not linked) — same three editions. */}
          <div className="grid grid-cols-2 gap-4">
            {plans.map((plan) => {
              const edition = planEditionFromTier(plan.tier || plan.name);
              const featured = edition === 'both';
              return (
                <Card
                  key={plan.id}
                  className={`rounded-2xl cursor-pointer transition-all ${featured ? 'border-amber-500/20 bg-gradient-to-b from-amber-500/[0.02] to-transparent hover:border-amber-500/40' : 'border-border/50 hover:border-primary/30'}`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-xs font-black uppercase tracking-widest ${featured ? 'text-amber-500' : 'text-muted-foreground'}`}>
                        {t(`subscription.plan_${edition}`)}
                      </p>
                      {featured && <PremiumBadge size="sm" />}
                    </div>
                    <p className="text-3xl font-black">
                      {plan.price.toLocaleString()} <span className="text-sm text-muted-foreground font-bold">{t('subscription.etb')}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-2">{plan.description}</p>
                    <Button size="sm" className={`mt-4 rounded-xl text-xs font-black uppercase tracking-widest w-full ${featured ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700' : ''}`}>
                      {t('subscription.choose_plan')}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Payment Instructions Step
  if (step === 'pay') {
    return (
      <div className="space-y-6 p-6 max-w-2xl mx-auto">
        <button onClick={() => setStep('select')} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" />
          {t('common.go_back')}
        </button>

        <div>
          <h1 className="text-lg font-black uppercase tracking-tight">{t('subscription.billing')}</h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{selectedPlan?.name}</p>
        </div>

        {/* Payment Instructions */}
        <Card className="rounded-2xl border-border/50 bg-gradient-to-b from-primary/[0.02] to-transparent">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10">
                <Smartphone className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest">{t('subscription.telebirr')}</p>
                <p className="text-xs text-muted-foreground">{t('subscription.payment_instruction_desc')}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('subscription.payment_method')}</p>
                <Badge variant="outline" className="text-xs font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  {t('subscription.telebirr')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-black">{selectedPlan?.price.toLocaleString()} {t('subscription.etb')}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedPlan?.name}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-medium">{t('subscription.telebirr_number')}</span>
                </div>
                <button onClick={copyNumber} className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors">
                  {copied ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? t('subscription.copied') : t('subscription.copy')}
                </button>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/20 border border-border/50">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-[11px] font-medium">{t('subscription.telebirr_name')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Payment Info */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              {t('subscription.submit_payment')}
            </CardTitle>
            <CardDescription className="text-xs">{t('subscription.pending_verification')}</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">{t('subscription.transaction_id')} *</p>
              <Input
                placeholder={t('subscription.transaction_id_placeholder')}
                value={form.transactionId}
                onChange={e => setForm(prev => ({ ...prev, transactionId: e.target.value }))}
                className="rounded-xl text-[11px]"
              />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">{t('subscription.business_name')} *</p>
              <Input
                placeholder={t('subscription.business_name_placeholder')}
                value={form.businessName}
                onChange={e => setForm(prev => ({ ...prev, businessName: e.target.value }))}
                className="rounded-xl text-[11px]"
              />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">{t('subscription.phone_number')} *</p>
              <Input
                placeholder={t('subscription.phone_placeholder')}
                value={form.phoneNumber}
                onChange={e => setForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="rounded-xl text-[11px]"
              />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">{t('subscription.payment_date')}</p>
              <Input
                type="date"
                value={form.paymentDate}
                onChange={e => setForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                className="rounded-xl text-[11px]"
              />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">{t('subscription.optional_notes')}</p>
              <Input
                placeholder={t('subscription.optional_notes')}
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                className="rounded-xl text-[11px]"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 mt-2"
            >
              {submitting ? (
                <><Loader2 className="h-3 w-3 animate-spin mr-1" /> {t('subscription.cancelling')}</>
              ) : (
                <><Check className="h-3 w-3 mr-1" /> {t('subscription.submit')}</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Done Step
  return (
    <div className="space-y-6 p-6 max-w-lg mx-auto text-center">
      <div className="pt-16">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-500/10 mb-6">
          <Check className="h-10 w-10 text-emerald-500" />
        </div>
        <h1 className="text-xl font-black uppercase tracking-tight mb-2">{t('subscription.payment_submitted')}</h1>
        <p className="text-[11px] text-muted-foreground mb-2">{t('subscription.approval_notification')}</p>
        <p className="text-xs text-amber-500 font-bold">{t('subscription.pending_verification')}</p>

        <div className="flex gap-3 justify-center mt-8">
          <Button
            variant="outline"
            onClick={() => navigate('/subscription')}
            className="rounded-xl text-xs font-black uppercase tracking-widest"
          >
            {t('subscription.subscription_management')}
          </Button>
          <Button
            onClick={() => { setStep('select'); setSelectedPlan(null); setForm({ transactionId: '', businessName: '', phoneNumber: '', paymentDate: new Date().toISOString().split('T')[0], notes: '' }); }}
            className="rounded-xl text-xs font-black uppercase tracking-widest"
          >
            {t('subscription.submit_payment')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPayment;
