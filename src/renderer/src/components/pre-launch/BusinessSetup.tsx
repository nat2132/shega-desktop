import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface BusinessSetupProps {
  onComplete: () => void;
}

const BusinessSetup: React.FC<BusinessSetupProps> = ({ onComplete }) => {
  const { t, refreshBusiness } = useSettings();
  const [form, setForm] = useState({ businessName: '', storeName: '', currency: 'ETB' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName.trim() || !form.storeName.trim()) return;
    const created = await window.api?.businessCreate({
      businessName: form.businessName.trim(),
      storeName: form.storeName.trim(),
      currency: form.currency || 'ETB',
    });
    await refreshBusiness();
    if (created?.id) {
      await window.api?.updateBusiness(created.id, form);
    }
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: '#0B0705' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.02]"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
        />
      </div>

      <div className={`w-full max-w-2xl px-10 py-12 relative z-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="text-center mb-10">
          <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
            <Building2 className="h-8 w-8 text-white/40" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">{t('setup.header')}</h2>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-white/30 mt-2">
            {t('setup.create_first')}
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-black uppercase tracking-widest text-white/30 px-1">{t('setup.legal_name')}</label>
            <input
              type="text" value={form.businessName}
              onChange={e => setForm({ ...form, businessName: e.target.value })}
              className="w-full bg-white/5 rounded-2xl text-sm px-6 py-4 font-bold border-2 border-transparent focus:border-white/20 transition-all outline-none text-white placeholder:text-white/15"
              placeholder={t('setup.legal_name')} autoFocus
            />
          </div>
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-black uppercase tracking-widest text-white/30 px-1">{t('setup.branch_name')}</label>
            <input
              type="text" value={form.storeName}
              onChange={e => setForm({ ...form, storeName: e.target.value })}
              className="w-full bg-white/5 rounded-2xl text-sm px-6 py-4 font-bold border-2 border-transparent focus:border-white/20 transition-all outline-none text-white placeholder:text-white/15"
              placeholder={t('setup.branch_name')}
            />
          </div>
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-black uppercase tracking-widest text-white/30 px-1">{t('setup.currency')}</label>
            <input
              type="text" value={form.currency}
              onChange={e => setForm({ ...form, currency: e.target.value })}
              className="w-full bg-white/5 rounded-2xl text-sm px-6 py-4 font-bold border-2 border-transparent focus:border-white/20 transition-all outline-none text-white placeholder:text-white/15"
              placeholder={t('setup.currency')}
            />
          </div>
          <button type="submit"
            className="w-full py-5 bg-white text-[#0B0705] rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            {t('setup.create_continue')}
          </button>
          <button type="button" onClick={onComplete}
            className="w-full text-xs font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors py-2"
          >
            {t('setup.skip')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BusinessSetup;
