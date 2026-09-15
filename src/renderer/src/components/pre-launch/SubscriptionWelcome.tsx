import React, { useState, useEffect } from 'react';
import {
  Package, ShoppingCart, Users, SlidersHorizontal, Sparkles, ArrowRight, Check,
  UserCog, Shield, Truck, Building2, BarChart3, FileText, Crown
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface SubscriptionWelcomeProps {
  onComplete: () => void;
}

const basicFeatureKeys = ['subscription.feature_inventory', 'subscription.feature_sales'];
const premiumFeatureKeys = ['subscription.feature_user_mgmt', 'subscription.feature_employee_mgmt', 'subscription.feature_audit_logs', 'subscription.feature_supplier_mgmt', 'subscription.feature_shipment_mgmt', 'subscription.feature_advanced_reports'];

const SubscriptionWelcome: React.FC<SubscriptionWelcomeProps> = ({ onComplete }) => {
  const { t } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const handleStartTrial = async () => {
    setStarting(true);
    try {
      await window.api?.startTrial();
      await window.api?.setSetting('subscription_welcome_completed', true);
    } catch (_) {}
    onComplete();
  };

  const handleStartBasic = async () => {
    await window.api?.setSetting('subscription_welcome_completed', true);
    onComplete();
  };

  if (showPlans) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: '#0B0705' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.015]"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
          />
        </div>

        <div className={`w-full max-w-4xl px-10 py-8 relative z-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-white/5 border border-white/10 mb-4">
              <Crown className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">
              {t('subscription.welcome_title')}
            </h1>
            <p className="text-sm text-white/40">{t('subscription.welcome_subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Basic Plan */}
            <div className="relative p-6 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-white/30 mb-3">{t('subscription.basic_plan')}</p>
              <p className="text-3xl font-black text-white mb-1">2,499 <span className="text-sm text-white/30 font-bold">{t('subscription.etb')}</span></p>
              <p className="text-[11px] text-white/30 mb-4">/ {t('subscription.month')}</p>
              <p className="text-[12px] text-white/50 mb-4">{t('subscription.basic_desc')}</p>
              <div className="space-y-2 mb-6">
                {basicFeatureKeys.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="h-4 w-4 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Check size={9} className="text-white/40" />
                    </div>
                    <span className="text-[11px] text-white/40">{t(f)}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleStartBasic}
                disabled={starting}
                className="w-full py-3.5 rounded-2xl bg-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/15 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {t('subscription.welcome_basic')}
              </button>
            </div>

            {/* Premium Plan */}
            <div className="relative p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.04] to-transparent">
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-amber-500 text-xs font-black uppercase tracking-widest text-[#0B0705]">
                {t('subscription.most_popular')}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-400">{t('subscription.premium_plan')}</p>
                <Sparkles size={12} className="text-amber-400" />
              </div>
              <p className="text-3xl font-black text-white mb-1">4,499 <span className="text-sm text-white/30 font-bold">{t('subscription.etb')}</span></p>
              <p className="text-[11px] text-white/30 mb-4">/ {t('subscription.month')}</p>
              <p className="text-[12px] text-white/50 mb-4">{t('subscription.premium_desc')}</p>
              <div className="space-y-2 mb-4">
                {basicFeatureKeys.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="h-4 w-4 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Check size={9} className="text-white/40" />
                    </div>
                    <span className="text-[11px] text-white/40">{t(f)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-4 mb-6">
                <p className="text-xs font-black uppercase tracking-widest text-amber-400/60 mb-2">{t('subscription.premium_features')}</p>
                <div className="space-y-2">
                  {premiumFeatureKeys.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="h-4 w-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                        <Check size={9} className="text-amber-400" />
                      </div>
                      <span className="text-[11px] text-white/40">{t(f)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 mb-4">
                <p className="text-xs font-black uppercase tracking-widest text-amber-400/60 mb-1">{t('subscription.trial_heading')}</p>
                <p className="text-[11px] text-white/30">{t('subscription.welcome_trial_desc')}</p>
              </div>
              <button
                onClick={handleStartTrial}
                disabled={starting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-[#0B0705] font-black uppercase tracking-widest text-xs hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {starting ? (
                  <>{t('subscription.loading')}</>
                ) : (
                  <>{t('subscription.welcome_premium')} <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-white/20">
            {t('subscription.welcome_basic_desc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: '#0B0705' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.02]"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
        />
      </div>

      <div className={`w-full max-w-2xl px-10 py-8 relative z-10 text-center transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/20 mb-6">
          <Crown className="h-10 w-10 text-amber-400" />
        </div>

        <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-4">
          {t('subscription.welcome_title')}
        </h1>

        <p className="text-base text-white/50 leading-relaxed mb-10 max-w-lg mx-auto">
          {t('subscription.welcome_subtitle')}
        </p>

        {/* Plan Overview Cards */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 text-left">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-white/30 mb-2">{t('subscription.basic_plan')}</p>
            <p className="text-white/60 text-sm leading-relaxed mb-3">{t('subscription.basic_desc')}</p>
            <div className="flex items-center gap-2 text-white/30">
              <Package size={14} />
              <span className="text-xs">{t('subscription.basic_features')}</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-b from-amber-500/[0.06] to-transparent border border-amber-500/20 text-left">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-400">{t('subscription.premium_plan')}</p>
              <Sparkles size={12} className="text-amber-400" />
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-3">{t('subscription.premium_desc')}</p>
            <div className="flex items-center gap-2 text-amber-400/60">
              <Crown size={14} />
              <span className="text-xs">{t('subscription.premium_features')}</span>
            </div>
          </div>
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
            {t('subscription.welcome_premium')} <ArrowRight size={14} />
          </button>
          <button
            onClick={handleStartBasic}
            className="px-8 py-4 rounded-2xl bg-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/15 active:scale-[0.98] transition-all"
          >
            {t('subscription.welcome_basic')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionWelcome;
