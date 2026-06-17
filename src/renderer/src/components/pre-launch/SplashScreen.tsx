import React, { useEffect, useState } from 'react';
import { BrandedLogo } from '../branded-logo';
import { useSettings } from '../../context/SettingsContext';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { t } = useSettings();
  const [progress, setProgress] = useState(0);
  const [showTitle, setShowTitle] = useState(false);
  const [logoReady, setLogoReady] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLogoReady(true), 300);
    const t2 = setTimeout(() => setShowTitle(true), 800);
    const t3 = setTimeout(() => onComplete(), 2800);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 2;
      });
    }, 50);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearInterval(interval); };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: '#0B0705' }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
        />
      </div>

      {/* Logo */}
      <div className={`transition-all duration-1000 ease-out ${logoReady ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
        <BrandedLogo size="lg" className="border-white/10" />
      </div>

      {/* Title */}
      <div className={`mt-10 text-center transition-all duration-700 ease-out ${showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Shega OS</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 mt-2">{t('auth.terminal_desc')}</p>
      </div>

      {/* Progress */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48">
        <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/30 rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 text-center mt-3">
          {t('splash.initializing')}
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
