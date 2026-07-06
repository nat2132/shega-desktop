import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const { t } = useSettings();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const loadingSteps = [
    { label: t('loading.step_1'), delay: 400 },
    { label: t('loading.step_2'), delay: 800 },
    { label: t('loading.step_3'), delay: 1200 },
    { label: t('loading.step_4'), delay: 1800 },
  ];
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);

    loadingSteps.forEach((step, i) => {
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, i]);
      }, step.delay);
    });

    setTimeout(() => onCompleteRef.current(), 2400);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: '#0B0705' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] rounded-full opacity-[0.02]"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
        />
      </div>

      <div className={`w-full max-w-sm px-10 relative z-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="text-center mb-10">
          <h2 className="text-xl font-black text-white tracking-tighter uppercase">{t('loading.preparing')}</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mt-2">{t('loading.wait')}</p>
        </div>

        <div className="space-y-3">
          {loadingSteps.map((step, i) => {
            const isCompleted = completedSteps.includes(i);
            const isActive = !isCompleted && (i === 0 || completedSteps.includes(i - 1));

            return (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                isCompleted ? 'bg-white/[0.04]' : 'bg-transparent'
              }`}>
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isCompleted ? 'bg-white/10' : 'bg-white/[0.03]'
                }`}>
                  {isCompleted ? (
                    <Check size={14} className="text-white/60" />
                  ) : isActive ? (
                    <Loader2 size={14} className="text-white/30 animate-spin" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                  )}
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
                  isCompleted ? 'text-white/50' : 'text-white/15'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-8 h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/20 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(completedSteps.length / loadingSteps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
