import React, { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface ErrorScreenProps {
  message?: string;
  onRetry: () => void;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ message, onRetry }) => {
  const { t } = useSettings();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      onRetry();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: '#0B0705' }}>
      <div className="w-full max-w-sm px-10 text-center">
        <div className="h-20 w-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8">
          <AlertTriangle className="h-10 w-10 text-red-400" />
        </div>

        <h2 className="text-xl font-black text-white tracking-tighter uppercase mb-2">
          {t('error.title')}
        </h2>
        <p className="text-[11px] text-white/30 leading-relaxed mb-2">
          {message || t('error.desc')}
        </p>
        <p className="text-[9px] font-black uppercase tracking-widest text-white/15 mb-8">
          Error Code: SYS_INIT_FAIL
        </p>

        <button
          onClick={handleRetry}
          disabled={retrying}
          className="w-full py-5 bg-white text-[#0B0705] rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
        >
          {retrying ? (
            <><RefreshCw size={16} className="animate-spin" /> {t('error.retrying')}</>
          ) : (
            <><RefreshCw size={16} /> {t('error.retry')}</>
          )}
        </button>

        <p className="text-[9px] text-white/10 font-black uppercase tracking-[0.2em] mt-6">
          {t('error.support')}
        </p>
      </div>
    </div>
  );
};

export default ErrorScreen;
