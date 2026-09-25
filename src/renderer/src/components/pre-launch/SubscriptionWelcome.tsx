import React, { useState, useEffect } from 'react';
import {
  Sparkles, ArrowRight, Check, Crown, Monitor, Smartphone, TabletSmartphone,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface SubscriptionWelcomeProps {
  onComplete: () => void;
}

/**
 * The canonical plan structure. `edition` is what is sent to the backend when
 * starting the trial, so the trial runs on the plan the user actually picked.
 */
type Edition = 'mobile' | 'desktop' | 'both';

interface PlanOption {
  edition: Edition;
  price: string;
  shared: string[];
  exclusive: string[];
}

const PLANS: PlanOption[] = [
  {
    edition: 'mobile',
    price: '4,500',
    shared: ['subscription.feature_inventory', 'subscription.feature_sales'],
    exclusive: [],
  },
  {
    edition: 'desktop',
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
  {
    edition: 'both',
    price: '10,000',
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

const EDITION_ICONS: Record<Edition, React.ComponentType<{ size?: number; className?: string }>> = {
  mobile: Smartphone,
  desktop: Monitor,
  both: TabletSmartphone,
};

const SubscriptionWelcome: React.FC<SubscriptionWelcomeProps> = ({ onComplete }) => {
  const { t } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [starting, setStarting] = useState<Edition | null>(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const finish = async () => {
    try {
      await window.api?.setSetting('subscription_welcome_completed', true);
    } catch (_) { /* setting is best-effort */ }
    onComplete();
  };

  const handleStartTrial = async (edition: Edition) => {
    setStarting(edition);
    try {
      await window.api?.startTrial(edition);
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

  if (showPlans) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto" style={{ background: '#0B0705' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.015]"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
          />
        </div>

        <div className={`w-full max-w-5xl px-10 py-10 relative z-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-white/5 border border-white/10 mb-4">
              <Crown className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">
              {t('subscription.welcome_title')}
            </h1>
            <p className="text-sm text-white/40">{t('subscription.welcome_subtitle')}</p>
          </div>

          <div className="grid grid-cols-3 gap-5 mb-8">
            {PLANS.map((plan) => {
              const Icon = EDITION_ICONS[plan.edition];
              const featured = plan.edition === 'both';
              return (
                <div
                  key={plan.edition}
                  className={`relative p-6 rounded-3xl border transition-all ${
                    featured
                      ? 'border-amber-500/30 bg-gradient-to-b from-amber-500/[0.04] to-transparent'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  {featured && (
                    <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-amber-500 text-xs font-black uppercase tracking-widest text-[#0B0705]">
                      {t('subscription.most_popular')}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={14} className={featured ? 'text-amber-400' : 'text-white/40'} />
                    <p className={`text-xs font-black uppercase tracking-[0.3em] ${featured ? 'text-amber-400' : 'text-white/40'}`}>
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
                        {plan.exclusive.map((f, i) => featureRow(f, featured, i))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleStartTrial(plan.edition)}
                    disabled={starting !== null}
                    className={`mt-6 w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                      featured
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-[#0B0705] hover:from-amber-400 hover:to-amber-500'
                        : 'bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    {starting === plan.edition ? (
                      <>{t('subscription.loading')}</>
                    ) : (
                      <>
                        {t('subscription.welcome_start_trial')} <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-6 max-w-2xl mx-auto text-center">
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
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: '#0B0705' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.02]"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
        />
      </div>

      <div className={`w-full max-w-3xl px-10 py-8 relative z-10 text-center transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/20 mb-6">
          <Crown className="h-10 w-10 text-amber-400" />
        </div>

        <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-4">
          {t('subscription.welcome_title')}
        </h1>

        <p className="text-base text-white/50 leading-relaxed mb-10 max-w-lg mx-auto">
          {t('subscription.welcome_subtitle')}
        </p>

        {/* Plan overview cards */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {PLANS.map((plan) => {
            const Icon = EDITION_ICONS[plan.edition];
            const featured = plan.edition === 'both';
            return (
              <div
                key={plan.edition}
                className={`p-5 rounded-3xl text-left ${featured ? 'bg-gradient-to-b from-amber-500/[0.06] to-transparent border border-amber-500/20' : 'bg-white/[0.03] border border-white/10'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className={featured ? 'text-amber-400' : 'text-white/40'} />
                  <p className={`text-xs font-black uppercase tracking-[0.3em] ${featured ? 'text-amber-400' : 'text-white/30'}`}>
                    {t(`subscription.plan_${plan.edition}`)}
                  </p>
                </div>
                <p className="text-white mb-1 text-lg font-black">
                  {plan.price} <span className="text-[12px] text-white/30 font-bold">{t('subscription.etb')}{t('subscription.per_month')}</span>
                </p>
                <p className="text-white/60 text-[12px] leading-relaxed">
                  {t(`subscription.plan_${plan.edition}_desc`)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-8 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 text-amber-400 mb-1">
            <Sparkles size={14} />
            <span className="text-xs font-black uppercase tracking-widest">{t('subscription.trial_heading')}</span>
          </div>
          <p className="text-[11px] text-white/30">{t('subscription.welcome_trial_desc')}</p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setShowPlans(true)}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-[#0B0705] font-black uppercase tracking-widest text-xs hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            {t('subscription.welcome_start_trial')} <ArrowRight size={14} />
          </button>
          <button
            onClick={handleSkip}
            className="px-8 py-4 rounded-2xl bg-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/15 active:scale-[0.98] transition-all"
          >
            {t('setup.skip')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionWelcome;
