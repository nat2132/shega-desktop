import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, KeyRound, ArrowLeft, UserRound, Users, Store } from 'lucide-react';
import { useSettings, Language } from '../../context/SettingsContext';
import { BrandedLogo } from '../branded-logo';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

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
    'dashboard', 'inventory', 'sales',
    'customers', 'analytics', 'adjustments', 'settings',
    'warehouses', 'employees', 'shipments'
  ],
  admin: [
    'dashboard', 'inventory', 'sales',
    'customers', 'analytics', 'adjustments', 'settings',
    'warehouses', 'employees', 'shipments'
  ],
};

interface AuthScreenProps {
  onLogin: (username: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  onLoginByUser: (source: 'admin' | 'employee' | 'roster', id: number, pin: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (name: string, username: string, pin: string, role: string, permissions: string[]) => Promise<{ success: boolean; error?: string }>;
  onJoin: (username: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  hasAdmins: boolean;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onLoginByUser, onRegister, onJoin, hasAdmins }) => {
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
  const [intent, setIntent] = useState<'welcome' | 'create' | 'join'>('welcome');
  const [recoveryMode, setRecoveryMode] = useState<'idle' | 'verify' | 'reset' | 'done'>('idle');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  // Join-an-existing-business sub-flow
  const [joinMode, setJoinMode] = useState<'idle' | 'form' | 'waiting' | 'pin'>('idle');
  // Who's-using-Shega profile picker (PIN-only login)
  const [loginUsers, setLoginUsers] = useState<Array<{ key: string; source: 'admin' | 'employee' | 'roster'; id: number; name: string; role: string; roleName: string; avatar: string | null; isOwner: boolean }>>([]);
  const [pickedUser, setPickedUser] = useState<typeof loginUsers[number] | null>(null);
  const [userPin, setUserPin] = useState('');
  const [showUserPin, setShowUserPin] = useState(false);
  const [userError, setUserError] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinPass, setJoinPass] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinDeviceName, setJoinDeviceName] = useState('');
  const [joinPin, setJoinPin] = useState('');
  const [joinConfirmPin, setJoinConfirmPin] = useState('');
  const [joinPreview, setJoinPreview] = useState<any>(null);
  const [joinStarted, setJoinStarted] = useState(false);
  const [joinNote, setJoinNote] = useState('');

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
    // Load the device's authorized profiles once — the picker is the primary
    // login surface; username entry is gone.
    window.api?.getLoginUsers?.().then((list) => setLoginUsers(list || [])).catch(() => setLoginUsers([]));
  }, []);

  const handlePickUser = (u: typeof loginUsers[number]) => {
    setPickedUser(u);
    setUserPin('');
    setUserError('');
  };

  const handleUserPinLogin = async (pinValue?: string) => {
    if (!pickedUser) return;
    const pinToUse = pinValue ?? userPin;
    if (!/^\d{4}$/.test(pinToUse)) { setUserError('Enter your 4-digit PIN'); return; }
    setUserLoading(true);
    setUserError('');
    try {
      const result = await onLoginByUser(pickedUser.source, pickedUser.id, pinToUse);
      if (!result?.success) {
        setUserError(result?.error || 'Wrong PIN');
        setUserPin('');
      }
      // On success App flips isAuthenticated and unmounts this screen.
    } catch {
      setUserError('Sign-in failed. Try again.');
    } finally {
      setUserLoading(false);
    }
  };

  // Resume a join after restart: the pairing request lives on the backend, so
  // on mount we recover Waiting-for-Approval (pending), or — when the owner
  // approved while this app was closed — drop straight into the PIN step that
  // finishes the activation locally. Rejected/cancelled/expired are surfaced
  // once on the login card and the stale join state is cleared, so they don't
  // hijack startup a second time. The one-time code is never re-issued here.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await window.api.joinStatus();
        if (cancelled || !res || res.phase === 'none') return;
        if (res.phase === 'pending') {
          setJoinEmail(res?.email ?? '');
          setJoinPreview({ business_name: res?.business_name ?? null });
          setJoinStarted(true);
          setJoinNote('submitted');
          setJoinMode('waiting');
          return;
        }
        if (res.phase === 'approved') {
          setJoinEmail(res?.email ?? '');
          setJoinPreview({ business_name: res?.business_name ?? null });
          setJoinStarted(true);
          setJoinNote('owner-approved');
          setJoinMode('pin');
          return;
        }
        // rejected / cancelled / expired
        setError(res.phase === 'rejected' ? 'The owner declined this device.'
          : res.phase === 'cancelled' ? 'The invitation was cancelled.'
          : 'This invitation has expired.');
        try { await window.api.joinCancel(); } catch { /* best-effort */ }
      } catch (err: any) {
        if (!cancelled) console.error('join resume check failed:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Poll the backend for owner approval while waiting.
  useEffect(() => {
    if (joinMode !== 'waiting') return;
    let cancelled = false;
    let attempts = 0;
    const check = async () => {
      if (cancelled) return;
      try {
        const res = await window.api.joinStatus();
        if (cancelled) return;
        if (res.phase === 'approved') {
          setJoinNote('owner-approved');
          // A live session still holds the PIN chosen on the join form. After a
          // restart it does not — ask for a terminal PIN before activating.
          if (joinPin && joinPin.length === 4) {
            await window.api.joinActivate(joinPin);
            if (cancelled) return;
            const result = await onJoin(joinEmail.trim().toLowerCase(), joinPin);
            if (!cancelled) {
              if (result.success) setJoinMode('idle');
              else { setError(result.error || 'Could not finish signing in'); setJoinMode('form'); }
            }
          } else {
            setJoinMode('pin');
          }
          return;
        }
        if (res.phase === 'rejected' || res.phase === 'cancelled' || res.phase === 'expired') {
          setError(res.phase === 'rejected' ? 'The owner declined this device.' : res.phase === 'cancelled' ? 'The invitation was cancelled.' : 'This invitation has expired.');
          setJoinMode('form');
          try { await window.api.joinCancel(); } catch { /* best-effort */ }
          return;
        }
        if (res.phase === 'error' && ++attempts >= 5) {
          setError(res.error || 'Lost contact with the server.');
          setJoinMode('form');
          return;
        }
      } catch (err: any) {
        if (cancelled) return;
        if (++attempts >= 5) {
          setError(err?.message || 'Lost contact with the server.');
          setJoinMode('form');
        }
      }
    };
    check();
    const timer = setInterval(check, 4000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [joinMode, joinPin, joinEmail, onJoin]);

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

  const handleBackToJoinLogin = () => {
    setJoinMode('idle');
    setJoinPreview(null);
    setJoinCode('');
    setJoinEmail('');
    setJoinPass('');
    setJoinName('');
    setJoinDeviceName('');
    setJoinPin('');
    setJoinConfirmPin('');
    setJoinStarted(false);
    setJoinNote('');
    setError('');
    setIntent(i => (i === 'join' ? 'welcome' : i));
    setPickedUser(null);
    setUserPin('');
    setUserError('');
  };

  const handleCheckJoinCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) { setError(t('auth.fields_required')); return; }
    setLoading(true); setError('');
    try {
      const data = await window.api.joinLookup(joinCode.trim());
      setJoinPreview(data);
      setError('');
    } catch (err: any) {
      setError(err?.message || 'That code was not recognised. It may have expired.');
    }
    setLoading(false);
  };

  const handleSubmitJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !joinEmail.trim() || !joinPass.trim()) { setError(t('auth.fields_required')); return; }
    if (!joinPin || joinPin.length < 4) { setError(t('auth.pin_length')); return; }
    if (joinPin !== joinConfirmPin) { setError(t('auth.pin_mismatch')); return; }
    setLoading(true); setError('');
    try {
      const result = await window.api.joinAccept({
        code: joinCode.trim(),
        email: joinEmail.trim(),
        password: joinPass,
        name: joinName.trim() || undefined,
        deviceName: joinDeviceName.trim() || undefined,
      });
      setJoinStarted(true);
      setJoinNote('submitted');
      setJoinMode('waiting');
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Could not submit the join request.');
    }
    setLoading(false);
  };

  // Owner already approved (e.g. while this app was closed): the backend does
  // not remember the terminal PIN, so ask for a fresh one to activate locally.
  const handleActivateJoinPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinPin || joinPin.length < 4) { setError(t('auth.pin_length')); return; }
    if (joinPin !== joinConfirmPin) { setError(t('auth.pin_mismatch')); return; }
    setLoading(true); setError('');
    try {
      await window.api.joinActivate(joinPin);
      const result = await onJoin(joinEmail.trim().toLowerCase(), joinPin);
      if (result.success) setJoinMode('idle');
      else setError(result.error || 'Could not finish signing in');
    } catch (err: any) {
      setError(err?.message || 'Could not activate this terminal.');
    }
    setLoading(false);
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

        {joinMode !== 'idle' ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <button type="button" onClick={handleBackToJoinLogin}
                className="text-muted-foreground/60 hover:text-muted-foreground/90 transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="text-left">
                <h2 className="text-sm font-black text-foreground tracking-tight uppercase">Join an existing business</h2>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
                  {joinMode === 'waiting' ? 'Wait for the owner to approve' : joinMode === 'pin' ? 'Approved — create your terminal PIN' : 'Enter the 6-digit code from your owner'}
                </p>
              </div>
            </div>

            {joinMode === 'form' ? (
              <form onSubmit={joinPreview ? handleSubmitJoin : handleCheckJoinCode} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">6-digit code</label>
                  <input
                    type="text" maxLength={6} value={joinCode} disabled={!!joinStarted}
                    onChange={e => { setJoinCode(e.target.value.replace(/\D/g, '')); setError(''); setJoinPreview(null); }}
                    className="w-full bg-muted/50 rounded-2xl text-center text-2xl tracking-[0.5em] py-4 font-black border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/30 disabled:opacity-40"
                    placeholder="000000" autoFocus
                  />
                </div>

                {joinPreview && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-left space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-400">{joinPreview.business_name}</p>
                    <p className="text-sm font-bold text-foreground">{joinPreview.employee_name || 'Employee'}</p>
                    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Role: {String(joinPreview.role || 'cashier').toUpperCase()}
                    </p>
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">Your email</label>
                  <input
                    type="email" value={joinEmail} disabled={!!joinStarted}
                    onChange={e => { setJoinEmail(e.target.value); setError(''); }}
                    className="w-full bg-muted/50 rounded-2xl text-sm px-6 py-4 font-bold border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/40 disabled:opacity-40"
                    placeholder="you@example.com"
                  />
                </div>
                {joinStarted && joinPreview && (
                  <p className="text-xs text-muted-foreground/50 text-left px-1">
                    {joinPreview.business_name} — your request is pending approval.
                  </p>
                )}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">Password</label>
                  <input
                    type="password" value={joinPass} disabled={!!joinStarted}
                    onChange={e => { setJoinPass(e.target.value); setError(''); }}
                    className="w-full bg-muted/50 rounded-2xl text-sm px-6 py-4 font-bold border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/40 disabled:opacity-40"
                    placeholder="Your Shega account password"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">Full name</label>
                    <input
                      type="text" value={joinName} disabled={!!joinStarted}
                      onChange={e => { setJoinName(e.target.value); setError(''); }}
                      className="w-full bg-muted/50 rounded-2xl text-sm px-4 py-4 font-bold border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/40 disabled:opacity-40"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">Terminal name</label>
                    <input
                      type="text" value={joinDeviceName} disabled={!!joinStarted}
                      onChange={e => { setJoinDeviceName(e.target.value); setError(''); }}
                      className="w-full bg-muted/50 rounded-2xl text-sm px-4 py-4 font-bold border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/40 disabled:opacity-40"
                      placeholder="e.g. Front Desk"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">Terminal PIN</label>
                    <input
                      type={showPin ? 'text' : 'password'} maxLength={4} value={joinPin} disabled={!!joinStarted}
                      onChange={e => { setJoinPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                      className="w-full bg-muted/50 rounded-2xl text-center text-2xl tracking-[0.4em] py-4 font-black border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/30 disabled:opacity-40"
                      placeholder="••••"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">Confirm PIN</label>
                    <input
                      type={showPin ? 'text' : 'password'} maxLength={4} value={joinConfirmPin} disabled={!!joinStarted}
                      onChange={e => { setJoinConfirmPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                      className="w-full bg-muted/50 rounded-2xl text-center text-2xl tracking-[0.4em] py-4 font-black border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/30 disabled:opacity-40"
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
                  {loading ? 'Working…' : joinPreview ? 'Submit & wait for owner approval' : 'Check code'}
                </button>
              </form>
            ) : joinMode === 'pin' ? (
              <form onSubmit={handleActivateJoinPin} className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-left space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Owner approved your device</p>
                  <p className="text-sm font-bold text-foreground">{joinPreview?.business_name || 'Your business'}</p>
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Set a 4-digit PIN to unlock this terminal.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">Terminal PIN</label>
                    <input
                      type={showPin ? 'text' : 'password'} maxLength={4} value={joinPin}
                      onChange={e => { setJoinPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                      className="w-full bg-muted/50 rounded-2xl text-center text-2xl tracking-[0.4em] py-4 font-black border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/30 disabled:opacity-40"
                      placeholder="••••" autoFocus
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">Confirm PIN</label>
                    <input
                      type={showPin ? 'text' : 'password'} maxLength={4} value={joinConfirmPin}
                      onChange={e => { setJoinConfirmPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                      className="w-full bg-muted/50 rounded-2xl text-center text-2xl tracking-[0.4em] py-4 font-black border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/30 disabled:opacity-40"
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
                  {loading ? 'Working…' : 'Activate this terminal'}
                </button>
              </form>
            ) : (
              <div className="space-y-5 py-6">
                <div className="flex justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground tracking-tight uppercase">{joinPreview?.business_name || 'Submission received'}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mt-1">
                    Waiting for the owner to approve this device. The approval shows up on their phone and in Cloud Devices.
                  </p>
                </div>
                {joinNote === 'owner-approved' && (
                  <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">Approved — setting up this terminal…</p>
                )}
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-xs font-black uppercase tracking-widest">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : mode === 'login' && recoveryMode === 'idle' ? (
          loginUsers.length > 0 ? (
            /* ---- Who's using Shega? profile picker + PIN-only login ---- */
            !pickedUser ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={16} className="text-muted-foreground" />
                  <h2 className="text-sm font-black text-foreground tracking-tight uppercase">Who&apos;s using Shega?</h2>
                </div>
                <div className="grid gap-2 max-h-80 overflow-y-auto">
                  {loginUsers.map((u) => (
                    <button
                      key={u.key}
                      type="button"
                      onClick={() => handlePickUser(u)}
                      className="flex items-center gap-3 w-full rounded-2xl border border-transparent bg-muted/40 hover:bg-muted/70 hover:border-foreground/10 px-4 py-3 text-left transition-all active:scale-[0.99]"
                    >
                      <Avatar className="h-11 w-11 rounded-full">
                        {u.avatar ? <AvatarImage src={u.avatar} alt={u.name} /> : null}
                        <AvatarFallback className="rounded-full bg-primary text-primary-foreground font-black text-sm">
                          {u.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || <UserRound size={16} />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{u.name}</p>
                        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">{u.isOwner ? '👑 Owner' : u.roleName}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => { setJoinMode('form'); setError(''); }}
                  className="w-full text-center text-xs font-black uppercase tracking-widest text-foreground/60 hover:text-foreground/90 transition-colors py-2 border-t border-border/40"
                >
                  Join an existing business with a 6-digit code
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col items-center gap-2 mb-1">
                  <Avatar className="h-16 w-16 rounded-full ring-2 ring-foreground/10">
                    {pickedUser.avatar ? <AvatarImage src={pickedUser.avatar} alt={pickedUser.name} /> : null}
                    <AvatarFallback className="rounded-full bg-primary text-primary-foreground font-black">
                      {pickedUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || <UserRound size={20} />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="text-base font-black text-foreground">{pickedUser.name}</p>
                    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">{pickedUser.isOwner ? '👑 Owner' : pickedUser.roleName}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-1">Enter your PIN</label>
                  <div className="relative">
                    <input
                      type={showUserPin ? 'text' : 'password'} maxLength={4} value={userPin} autoFocus
                      onChange={e => { setUserPin(e.target.value.replace(/\D/g, '')); setUserError(''); }}
                      onKeyDown={e => { if (e.key === 'Enter') void handleUserPinLogin(); }}
                      className="w-full bg-muted/50 rounded-2xl text-center text-3xl tracking-[0.5em] py-5 font-black border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/30"
                      placeholder="••••"
                    />
                    <button type="button" onClick={() => setShowUserPin(!showUserPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors">
                      {showUserPin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {userError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-xs font-black uppercase tracking-widest">{userError}</p>
                  </div>
                )}
                <button type="button" disabled={userLoading} onClick={() => void handleUserPinLogin()}
                  className="w-full py-5 bg-foreground text-background rounded-2xl font-black uppercase tracking-[0.3em] text-sm hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-30"
                >
                  {userLoading ? t('auth.authenticating') : t('auth.access_terminal')}
                </button>
                <button type="button" onClick={() => { setPickedUser(null); setUserPin(''); setUserError(''); }}
                  className="w-full text-center text-xs font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors py-2"
                >
                  <ArrowLeft size={10} className="inline mr-1.5 -mt-0.5" />
                  Not you? Choose another profile
                </button>
              </div>
            )
          ) : (
            /* ---- Fallback: no profiles on this device yet (first run) ---- */
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
            <button type="button" onClick={() => { setJoinMode('form'); setError(''); }}
              className="w-full text-center text-xs font-black uppercase tracking-widest text-foreground/60 hover:text-foreground/90 transition-colors py-2"
            >
              Join an existing business with a 6-digit code
            </button>
          </form>
          )
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
        ) : intent === 'welcome' ? (
          <div className="space-y-3 py-3">
            <div className="text-left space-y-1 mb-2">
              <h2 className="text-sm font-black text-foreground tracking-tight uppercase">Welcome to Shega</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
                Start a new business or join one with a 6-digit code
              </p>
            </div>
            <button type="button" onClick={() => setIntent('create')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 bg-muted/40 hover:bg-muted/70 border-transparent hover:border-foreground/10 text-left transition-all active:scale-[0.99]"
            >
              <div className="h-11 w-11 rounded-xl bg-foreground text-background flex items-center justify-center shrink-0">
                <Store size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-foreground">Start a new business</p>
                <p className="text-xs font-bold text-muted-foreground/70">Set up this terminal as a brand-new Shega business</p>
              </div>
            </button>
            <button type="button" onClick={() => { setIntent('join'); setJoinMode('form'); setError(''); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 bg-muted/40 hover:bg-muted/70 border-transparent hover:border-foreground/10 text-left transition-all active:scale-[0.99]"
            >
              <div className="h-11 w-11 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-foreground">Join an existing business</p>
                <p className="text-xs font-bold text-muted-foreground/70">Pair this terminal using a 6-digit code from your owner</p>
              </div>
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
            <button type="button" onClick={() => { setIntent('welcome'); setError(''); }}
              className="w-full text-center text-xs font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors py-1"
            >
              <ArrowLeft size={10} className="inline mr-1.5 -mt-0.5" />
              Back to choice
            </button>
            <button type="button" onClick={() => { setJoinMode('form'); setError(''); }}
              className="w-full text-center text-xs font-black uppercase tracking-widest text-foreground/60 hover:text-foreground/90 transition-colors py-2"
            >
              Join an existing business with a 6-digit code
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
