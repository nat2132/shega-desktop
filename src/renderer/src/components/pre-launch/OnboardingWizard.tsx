import React, { useState, useEffect } from 'react';
import { 
  Package, ShoppingCart, Receipt, TrendingDown, 
  UserCog, CreditCard, ChevronRight, Check, SkipForward,
  Warehouse, Truck, Users, BarChart3, SlidersHorizontal, Building2
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { ALL_MODULES, MODULE_META } from '../../utils/feature-modules';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Package, ShoppingCart, Receipt, TrendingDown,
  UserCog, CreditCard, Warehouse, Truck,
  Users, BarChart3, SlidersHorizontal, Building2,
};

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { t } = useSettings();
  
  const educationSteps = [
    {
      icon: Package,
      title: t('onboarding.title_1'),
      subtitle: t('onboarding.sub_1'),
      description: t('onboarding.desc_1'),
      features: [
        t('onboarding.feat_categories'), t('onboarding.feat_pricing'), t('onboarding.feat_stock_tracking'), t('onboarding.feat_expiry')
      ],
    },
    {
      icon: ShoppingCart,
      title: t('onboarding.title_2'),
      subtitle: t('onboarding.sub_2'),
      description: t('onboarding.desc_2'),
      features: [
        t('onboarding.feat_cart'), t('onboarding.feat_discount_vat'), t('onboarding.feat_receipt'), t('onboarding.feat_debt_tracking')
      ],
    },
    {
      icon: Receipt,
      title: t('onboarding.title_3'),
      subtitle: t('onboarding.sub_3'),
      description: t('onboarding.desc_3'),
      features: [
        t('onboarding.feat_expense_categories'), t('onboarding.feat_recurring'), t('onboarding.feat_date_tracking'), t('onboarding.feat_budget_insights')
      ],
    },
    {
      icon: TrendingDown,
      title: t('onboarding.title_4'),
      subtitle: t('onboarding.sub_4'),
      description: t('onboarding.desc_4'),
      features: [
        t('onboarding.feat_price_change'), t('onboarding.feat_damaged'), t('onboarding.feat_adjustment_history'), t('onboarding.feat_reconciliation')
      ],
    },
    {
      icon: UserCog,
      title: t('onboarding.title_5'),
      subtitle: t('onboarding.sub_5'),
      description: t('onboarding.desc_5'),
      features: [
        t('onboarding.feat_multiple_admins'), t('onboarding.feat_permissions'), t('onboarding.feat_pin_security'), t('onboarding.feat_activity')
      ],
    },
    {
      icon: CreditCard,
      title: t('onboarding.title_6'),
      subtitle: t('onboarding.sub_6'),
      description: t('onboarding.desc_6'),
      features: [
        t('onboarding.feat_cash_bank'), t('onboarding.feat_check_payments'), t('onboarding.feat_debt_management'), t('onboarding.feat_payment_history')
      ],
    },
  ];

  const totalSteps = educationSteps.length + 1; // 6 education + 1 feature selection
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [stepTransition, setStepTransition] = useState(true);
  const [selectedModules, setSelectedModules] = useState<string[]>([...ALL_MODULES]);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const goToStep = (step: number) => {
    setStepTransition(false);
    setTimeout(() => {
      setCurrentStep(step);
      setStepTransition(true);
    }, 200);
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(m => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      goToStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    await Promise.all([
      window.api?.setSetting('enabled_modules', selectedModules),
      window.api?.setSetting('onboarding_completed', true),
    ]);
    onComplete();
  };

  const isSelectionStep = currentStep === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: '#0B0705' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.02]"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
        />
      </div>

      <div className={`w-full max-w-3xl px-10 py-8 relative z-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-10">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-white/5">
              <div className={`h-full rounded-full transition-all duration-500 ${
                i < currentStep ? 'bg-white/40 w-full' : i === currentStep ? 'bg-white w-full' : 'w-0'
              }`} />
            </div>
          ))}
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white/30">
            {t('onboarding.step')} {currentStep + 1} {t('onboarding.of')} {totalSteps}
          </p>
          <button onClick={handleComplete}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
          >
            <SkipForward size={14} /> {t('onboarding.skip_all')}
          </button>
        </div>

        {/* Content */}
        <div className={`transition-all duration-300 ease-out ${stepTransition ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
          {isSelectionStep ? (
            /* Feature Selection Step */
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Check className="h-5 w-5 text-white/50" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-white/30 mb-1">{t('onboarding.feature_subtitle')}</p>
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase">{t('onboarding.feature_title')}</h2>
                </div>
              </div>
              <p className="text-sm text-white/40 leading-relaxed mb-2">{t('onboarding.feature_desc')}</p>
              <p className="text-[11px] text-white/20 font-bold mb-6">
                {selectedModules.length} {t('onboarding.of')} {ALL_MODULES.length} {t('onboarding.feature_selected')}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                {MODULE_META.map((meta) => {
                  const Icon = ICON_MAP[meta.iconName];
                  const isEnabled = selectedModules.includes(meta.id);
                  return (
                    <button
                      key={meta.id}
                      onClick={() => toggleModule(meta.id)}
                      className={`text-left p-4 rounded-2xl border transition-all ${
                        isEnabled
                          ? 'bg-white/[0.04] border-white/15 hover:bg-white/[0.06]'
                          : 'bg-white/[0.01] border-white/5 opacity-40 hover:opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isEnabled ? 'bg-white/10' : 'bg-white/5'
                        }`}>
                          <Icon className={`h-4 w-4 ${isEnabled ? 'text-white/60' : 'text-white/30'}`} />
                        </div>
                        <div className={`h-5 w-10 rounded-full border transition-colors ${
                          isEnabled ? 'bg-white/20 border-white/20' : 'bg-white/5 border-white/10'
                        }`}>
                          <div className={`h-full w-1/2 rounded-full transition-all duration-200 ${
                            isEnabled ? 'bg-white translate-x-full ml-0.5' : 'bg-white/30 translate-x-0 ml-0.5'
                          }`} />
                        </div>
                      </div>
                      <p className={`text-[11px] font-black uppercase tracking-wider mb-1 ${isEnabled ? 'text-white/80' : 'text-white/40'}`}>
                        {t(meta.nameKey)}
                      </p>
                      <p className={`text-xs leading-relaxed ${isEnabled ? 'text-white/30' : 'text-white/20'}`}>
                        {t(meta.descKey)}
                      </p>
                      <p className={`text-xs font-bold mt-1.5 uppercase tracking-wider ${isEnabled ? 'text-white/20' : 'text-white/10'}`}>
                        {t('onboarding.benefits')}: {t(meta.benefitKey)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Education Step */
            (() => {
              const step = educationSteps[currentStep];
              return (
                <>
                  <div className="flex items-start gap-6 mb-8">
                    <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <step.icon className="h-8 w-8 text-white/50" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-white/30 mb-1">{step.subtitle}</p>
                      <h2 className="text-2xl font-black text-white tracking-tighter uppercase">{step.title}</h2>
                    </div>
                  </div>

                  <p className="text-sm text-white/40 leading-relaxed mb-8">{step.description}</p>

                  <div className="grid grid-cols-2 gap-3 mb-10">
                    {step.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                          <Check size={10} className="text-white/50" />
                        </div>
                        <span className="text-[11px] font-bold text-white/40">{feature}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {currentStep > 0 && (
            <button onClick={() => goToStep(currentStep - 1)}
              className="px-6 py-4 bg-white/5 text-white/40 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
            >
              {t('onboarding.back')}
            </button>
          )}
          <button onClick={handleNext}
            className="flex-1 py-5 bg-white text-[#0B0705] rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
              {currentStep < totalSteps - 1 ? (
                <>{t('onboarding.continue')} <ChevronRight size={16} /></>
              ) : (
                t('onboarding.launch')
              )}
          </button>
          {currentStep < totalSteps - 1 && (
            <button onClick={() => goToStep(currentStep + 1)}
              className="px-6 py-4 bg-white/5 text-white/40 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
            >
              {t('onboarding.skip')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
