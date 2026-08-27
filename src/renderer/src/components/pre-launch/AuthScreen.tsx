import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import { useSettings, Language } from '../../context/SettingsContext';
import { BrandedLogo } from '../branded-logo';

const LANGUAGES: { id: Language; name: string; native: string }[] = [
  { id: 'en', name: 'English', native: 'English' },
  { id: 'am', name: 'Amharic', native: 'አማርኛ' },
  { id: 'om', name: 'Oromo', native: 'Afaan Oromo' },
  { id: 'ti', name: 'Tigrinya', native: 'ትግርኛ' },
];

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Owner (Super Admin)', description: 'Full system access including admin management' },
  { value: 'admin', label: 'Administrator', description: 'Can access all modules but cannot manage other admins' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'dashboard', 'inventory', 'sales', 'expenses',
    'customers', 'analytics', 'adjustments', 'settings',
    'warehouses', 'employees', 'shipments'
  ],
  admin: [
    'dashboard', 'inventory', 'sales', 'expenses',
    'customers', 'analytics', 'adjustments', 'settings',
    'warehouses', 'employees', 'shipments'
  ],
};

interface AuthScreenProps {
  onLogin: (username: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (name: string, username: string, pin: string, role: string, permissions: string[]) => Promise<{ success: boolean; error?: string }>;
  hasAdmins: boolean;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister, hasAdmins }) => {
  const { t, language, setLanguage } = useSettings();
  const [mode] = useState<'login' | 'register'>(hasAdmins ? 'login' : 'register');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedRole, setSelectedRole] = useState(ROLE_OPTIONS[0].value);
  const [recoveryMode, setRecoveryMode] = useState<'idle' | 'verify' | 'reset' | 'done'>('idle');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !pin.trim()) { setError(t('auth.fields_required')); return; }
    setLoading(true); setError('');
    const result = await onLogin(username.trim(), pin);
    setLoading(false);
    if (!result.success) { setError(result.error || t('auth.login_failed')); setPin(''); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !pin.trim()) { setError(t('auth.fields_required')); return; }
    if (pin !== confirmPin) { setError(t('auth.pin_mismatch')); return; }
    if (pin.length < 4) { setError(t('auth.pin_length')); return; }
    setLoading(true); setError('');
    const permissions = ROLE_PERMISSIONS[selectedRole] || ROLE_PERMISSIONS.admin;
    const result = await onRegister(name.trim(), username.trim(), pin, selectedRole, permissions);
    setLoading(false);
    if (!result.success) { setError(result.error || t('auth.reg_failed')); }
  };

  const handleForgotPin = () => {
    setError('');
    setRecoveryKey('');
    setUsername('');
    setRecoveryMode('verify');
  };

  const handleVerifyRecoveryKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !recoveryKey.trim()) { setError(t('auth.username_recovery_required')); return; }
    setLoading(true); setError('');
    try {
      const result = await window.api.verifyRecoveryKey(username.trim(), recoveryKey.trim());
      if (result.valid) {
        setRecoveryMode('reset');
        setError('');
      } else {
        setError(result.error || t('auth.invalid_recovery_key'));
        setRecoveryKey('');
      }
    } catch (err: any) {
      setError(err.message || t('auth.verification_failed'));
    }
    setLoading(false);
  };

  const handleRecoveryReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || newPin.length < 4) { setError(t('auth.pin_min_length')); return; }
    if (newPin !== confirmNewPin) { setError(t('auth.pins_no_match')); return; }
    setLoading(true); setError('');
    try {
      const result = await window.api.resetPinWithRecovery(username.trim(), recoveryKey.trim(), newPin);
      if (result.success) {
        setRecoveryMode('done');
        setRecoverySuccess(t('auth.pin_reset_success'));
        setPin('');
        setNewPin('');
        setConfirmNewPin('');
      } else {
        setError(result.error || t('auth.failed_reset_pin'));
      }
    } catch (err: any) {
      setError(err.message || t('auth.reset_failed'));
    }
    setLoading(false);
  };

  const handleBackToLogin = () => {
    setRecoveryMode('idle');
    setRecoveryKey('');
    setNewPin('');
    setConfirmNewPin('');
    setError('');
    setRecoverySuccess('');
    setUsername('');
    setPin('');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
      {/* Ambient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, var(--foreground) 0%, transparent 70%)' }}
        />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, var(--foreground) 0%, transparent 70%)' }}
        />
      </div>

      <div className={`w-full max-w-md p-10 text-center space-y-6 relative z-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        

        <div className="flex justify-center">
          <BrandedLogo size="md" className="border-border/50" />
        </div>

        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">Shega OS</h1>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground/70 mt-1">
            {mode === 'login' ? t('auth.terminal_desc') : t('auth.system_init')}
          </p>
        </div>

        {/* Mode toggle - Hidden per user request to prevent redundant registration */}
        {/* The component already initializes 'mode' based on hasAdmins */}

        {mode === 'login' && recoveryMode === 'idle' ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">{t('auth.username')}</label>
              <input
                type="text" value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                className="w-full bg-muted/50 rounded-2xl text-sm px-6 py-4 font-bold border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/40"
                placeholder={t('auth.username')} autoFocus
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">{t('auth.pin_code')}</label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'} maxLength={4} value={pin}
                  onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                  className="w-full bg-muted/50 rounded-2xl text-center text-3xl tracking-[0.5em] py-5 font-black border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/30"
                  placeholder="••••"
                />
                <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors">
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-xs font-black uppercase tracking-widest">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-5 bg-foreground text-background rounded-2xl font-black uppercase tracking-[0.3em] text-sm hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-30"
            >
              {loading ? t('auth.authenticating') : t('auth.access_terminal')}
            </button>
            <button type="button" onClick={handleForgotPin}
              className="w-full text-center text-xs font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors py-2"
            >
              <KeyRound size={10} className="inline mr-1.5 -mt-0.5" />
              {t('auth.forgot_pin')}
            </button>
          </form>
        ) : recoveryMode === 'verify' ? (
          <form onSubmit={handleVerifyRecoveryKey} className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <button type="button" onClick={handleBackToLogin}
                className="text-muted-foreground/60 hover:text-muted-foreground/90 transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="text-left">
                <h2 className="text-sm font-black text-foreground tracking-tight uppercase">{t('auth.recover_pin')}</h2>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">{t('auth.enter_recovery_key')}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">{t('auth.username_label')}</label>
              <input
                type="text" value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                className="w-full bg-muted/50 rounded-2xl text-sm px-6 py-4 font-bold border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/40"
                placeholder={t('auth.username_placeholder')} autoFocus
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">{t('auth.recovery_key_label')}</label>
              <input
                type="text" value={recoveryKey}
                onChange={e => { setRecoveryKey(e.target.value.replace(/\s/g, '')); setError(''); }}
                className="w-full bg-muted/50 rounded-2xl text-sm px-6 py-4 font-mono font-bold border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/40"
                placeholder={t('auth.recovery_key_placeholder')}
              />
            </div>
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-xs font-black uppercase tracking-widest">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-5 bg-foreground text-background rounded-2xl font-black uppercase tracking-[0.3em] text-sm hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-30"
            >
              {loading ? t('auth.verifying') : t('auth.verify_recovery_key')}
            </button>
          </form>
        ) : recoveryMode === 'reset' ? (
          <form onSubmit={handleRecoveryReset} className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <button type="button" onClick={handleBackToLogin}
                className="text-muted-foreground/60 hover:text-muted-foreground/90 transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="text-left">
                <h2 className="text-sm font-black text-foreground tracking-tight uppercase">{t('auth.create_new_pin')}</h2>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">{t('auth.key_verified')}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">{t('auth.new_pin')}</label>
              <input
                type={showPin ? 'text' : 'password'} maxLength={4} value={newPin}
                onChange={e => { setNewPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                className="w-full bg-muted/50 rounded-2xl text-center text-3xl tracking-[0.5em] py-5 font-black border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/30"
                placeholder="••••" autoFocus
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">{t('auth.confirm_new_pin')}</label>
              <input
                type={showPin ? 'text' : 'password'} maxLength={4} value={confirmNewPin}
                onChange={e => { setConfirmNewPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                className="w-full bg-muted/50 rounded-2xl text-center text-3xl tracking-[0.5em] py-5 font-black border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/30"
                placeholder="••••"
              />
            </div>
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-xs font-black uppercase tracking-widest">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-5 bg-foreground text-background rounded-2xl font-black uppercase tracking-[0.3em] text-sm hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-30"
            >
              {loading ? t('auth.resetting') : t('auth.reset_pin')}
            </button>
          </form>
        ) : recoveryMode === 'done' ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <button type="button" onClick={handleBackToLogin}
                className="text-muted-foreground/60 hover:text-muted-foreground/90 transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="text-left">
                <h2 className="text-sm font-black text-foreground tracking-tight uppercase">{t('auth.pin_reset_complete')}</h2>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">{t('common.success')}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-400 text-xs font-black uppercase tracking-widest leading-relaxed">
                {recoverySuccess}
              </p>
            </div>
            <button type="button" onClick={handleBackToLogin}
              className="w-full py-5 bg-foreground text-background rounded-2xl font-black uppercase tracking-[0.3em] text-sm hover:bg-foreground/90 active:scale-[0.98] transition-all"
            >
              {t('auth.back_to_login')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">{t('auth.full_name')}</label>
              <input
                type="text" value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                className="w-full bg-muted/50 rounded-2xl text-sm px-6 py-4 font-bold border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/40"
                placeholder={t('auth.full_name')} autoFocus
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">{t('auth.username')}</label>
              <input
                type="text" value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                className="w-full bg-muted/50 rounded-2xl text-sm px-6 py-4 font-bold border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/40"
                placeholder={t('auth.username')}
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">{t('employees.role', 'Role')}</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedRole(opt.value)}
                    className={`text-left px-4 py-3 rounded-2xl border-2 transition-all ${
                      selectedRole === opt.value
                        ? 'bg-muted/80 border-foreground/30 text-foreground'
                        : 'bg-muted/30 border-transparent text-muted-foreground/60 hover:text-foreground/70 hover:bg-muted/50'
                    }`}
                  >
                    <div className="text-[11px] font-black leading-tight">{opt.label}</div>
                    <div className="text-xs font-bold mt-1 leading-tight opacity-60">{opt.description}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">{t('common.pin')}</label>
                <input
                  type={showPin ? 'text' : 'password'} maxLength={4} value={pin}
                  onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                  className="w-full bg-muted/50 rounded-2xl text-center text-2xl tracking-[0.4em] py-4 font-black border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/30"
                  placeholder="••••"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">{t('auth.confirm_pin')}</label>
                <input
                  type={showPin ? 'text' : 'password'} maxLength={4} value={confirmPin}
                  onChange={e => { setConfirmPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                  className="w-full bg-muted/50 rounded-2xl text-center text-2xl tracking-[0.4em] py-4 font-black border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/30"
                  placeholder="••••"
                />
              </div>
            </div>
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-xs font-black uppercase tracking-widest">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-5 bg-foreground text-background rounded-2xl font-black uppercase tracking-[0.3em] text-sm hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-30"
            >
              {loading ? t('auth.creating_account') : t('auth.initialize_admin')}
            </button>
          </form>
        )}

        {recoveryMode === 'idle' && (
          <p className="text-xs text-muted-foreground/40 font-black uppercase tracking-[0.2em]">{t('auth.authorized_only')}</p>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
