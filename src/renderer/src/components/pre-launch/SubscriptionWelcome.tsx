import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Check, Crown, Monitor } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { onboardingEditionFor, type PlanEdition } from '@shega/shared';

interface SubscriptionWelcomeProps {
  onComplete: () => void;
  /**
   * "Pay Now" — skip the trial and go straight into the payment flow with this
   * platform's plan already selected, so the customer confirms the plan and
   * price, submits their transaction, and waits for admin approval.
   */
  onPayNow?: () => void;
}

/**
 * This build is Shega Desktop, so onboarding is Desktop-scoped: a Desktop
 * signup is offered the Desktop plan and a Desktop trial, and is never asked to
 * buy the Mobile plan (or the combined edition) before they have used the
 * product. The combined Mobile + Desktop plan stays available as an upgrade
 * from the Subscription section, where adding the other platform is a
 * deliberate choice.
 *
 * The edition is derived from the platform via `@shega/shared` rather than
 * hardcoded, so this screen and the Subscription page cannot disagree.
 */
const PLATFORM = 'desktop' as const;
const EDITION: PlanEdition = onboardingEditionFor(PLATFORM);

interface PlanOption {
  edition: PlanEdition;
  price: string;
  shared: string[];
  exclusive: string[];
}

const PLANS: PlanOption[] = [
  {
    edition: EDITION,
    price: '7,500',
    shared: ['subscription.feature_inventory', 'subscription.feature_sales'],
    exclusive: [
      'subscription.feature_user_mgmt',
      'subscription.feature_employee_mgmt',
      'subscription.feature_audit_logs',
      'subscription.feature_supplier_mgmt',
      'subscription.feature_shipment_mgmt',
      'subscription.feature_advanced_reports',
    ],
  },
];

const SubscriptionWelcome: React.FC<SubscriptionWelcomeProps> = ({ onComplete, onPayNow }) => {
  const { t } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const finish = async () => {
    try {
      await window.api?.setSetting('subscription_welcome_completed', true);
    } catch (_) { /* setting is best-effort */ }
    onComplete();
  };

  const handleStartTrial = async () => {
    setStarting(true);
    try {
      await window.api?.startTrial(EDITION);
    } catch (_) { /* the subscription page surfaces any failure */ }
    await finish();
  };

  const handleSkip = async () => {
    await finish();
  };

  const featureRow = (key: string, highlight: boolean, index: number) => (
    <div key={`${key}-${index}`} className="flex items-center gap-2.5">
      <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${highlight ? 'bg-amber-500/20' : 'bg-white/10'}`}>
        <Check size={9} className={highlight ? 'text-amber-400' : 'text-white/40'} />
      </div>
      <span className="text-[11px] text-white/40">{t(key)}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto" style={{ background: '#0B0705' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.015]"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
        />
      </div>

      <div className="min-h-full flex flex-col items-center justify-center p-6 sm:p-10">
        <div className={`w-full max-w-2xl px-6 sm:px-10 py-8 relative z-10 text-center transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-white/5 border border-white/10 mb-4">
          <Crown className="h-8 w-8 text-amber-400" />
        </div>

        <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">
          {t('subscription.welcome_title')}
        </h1>
        <p className="text-sm text-white/40">{t('subscription.welcome_subtitle')}</p>

        {/* The one plan offered at Desktop signup. */}
        <div className="grid grid-cols-1 gap-5 my-8 max-w-md mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.edition}
              className="relative p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.04] to-transparent text-left"
            >
              <div className="flex items-center gap-2 mb-3">
                <Monitor size={14} className="text-amber-400" />
                <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-400">
                  {t(`subscription.plan_${plan.edition}`)}
                </p>
              </div>
              <p className="text-3xl font-black text-white mb-1">
                {plan.price} <span className="text-sm text-white/30 font-bold">{t('subscription.etb')}</span>
              </p>
              <p className="text-[11px] text-white/30 mb-4">/ {t('subscription.month')}</p>
              <p className="text-[12px] text-white/50 mb-4">{t(`subscription.plan_${plan.edition}_desc`)}</p>

              <div className="space-y-2">
                {plan.shared.map((f, i) => featureRow(f, false, i))}
                {plan.exclusive.length > 0 && (
                  <div className="border-t border-white/10 pt-3 mt-3 space-y-2">
                    {plan.exclusive.map((f, i) => featureRow(f, true, i))}
                  </div>
                )}
              </div>

              {/* Two ways forward: the free trial, or pay now for the same plan.
                  Both lead to the same subscription — only the start differs. */}
              <div className="mt-6 space-y-2.5">
                <button
                  onClick={handleStartTrial}
                  disabled={starting}
                  className="w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-[#0B0705] hover:from-amber-400 hover:to-amber-500"
                >
                  {starting ? (
                    <>{t('subscription.loading')}</>
                  ) : (
                    <>
                      {t('subscription.start_free_trial')} <ArrowRight size={14} />
                    </>
                  )}
                </button>

                {onPayNow ? (
                  <button
                    onClick={onPayNow}
                    disabled={starting}
                    className="w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-white/10 text-white hover:bg-white/15"
                  >
                    {t('subscription.pay_now')} <ArrowRight size={14} />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-6 max-w-md mx-auto text-center">
          <div className="flex items-center justify-center gap-2 text-amber-400 mb-1">
            <Sparkles size={14} />
            <span className="text-xs font-black uppercase tracking-widest">{t('subscription.trial_heading')}</span>
          </div>
          <p className="text-[11px] text-white/30">{t('subscription.welcome_trial_desc')}</p>
        </div>

        <div className="text-center">
          <button
            onClick={handleSkip}
            className="text-xs font-bold uppercase tracking-widest text-white/30 hover:text-white/60 transition-all"
          >
            {t('setup.skip')}
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};

export default SubscriptionWelcome;
