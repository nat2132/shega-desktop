import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, KeyRound, ArrowLeft, UserRound, Users, Store } from 'lucide-react';
import { useSettings, Language } from '../../context/SettingsContext';
import { BrandedLogo } from '../branded-logo';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { RadarPulse, type RadarPeer, type RadarTone } from '../RadarPulse';

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
  isFirstTime: boolean;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onLoginByUser, onRegister, onJoin, hasAdmins, isFirstTime }) => {
  const { t, language, setLanguage } = useSettings();
  // First-run wins over admin-count: an interrupted prior setup (owner account
  // created, but onboarding never completed) must still offer account creation,
  // not a login gate. Only a fully-set-up install goes straight to login.
  const [mode, setMode] = useState<'login' | 'register'>(hasAdmins && !isFirstTime ? 'login' : 'register');
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
  // Join Mode is a waiting/radar screen: 'searching' until a nearby owner with
  // an open invite appears, then 'connecting', and 'notfound' after the search
  // window elapses with nothing on the network.
  const [joinPhase, setJoinPhase] = useState<'searching' | 'connecting' | 'notfound'>('searching');
  const [selfDeviceName, setSelfDeviceName] = useState('This device');
  const autoJoinedRef = React.useRef<Set<string>>(new Set());
  // Bluetooth-style discovery list: nearby owners broadcasting pairing beacons.
  const [nearbyOwners, setNearbyOwners] = useState<Array<{ beacon: { businessId: string; businessName: string; code: string; role?: string; owner: { deviceName: string; platform: string }; expiresAt: string } }>>([]);

  // Real device name so Join Mode can show who this terminal is, exactly like
  // peers see it from a discovery beacon.
  useEffect(() => {
    window.api?.deviceName?.().then((n) => { if (n) setSelfDeviceName(n); }).catch(() => {});
  }, []);

  // Auto-discovery on entering Joining Mode: this device starts searching for
  // nearby owners AND becomes visible to them (mutual discoverability), and
  // the nearby list refreshes live — no button press needed.
  useEffect(() => {
    if (joinMode !== 'form') return;
    let stopped = false;
    (async () => {
      try { await window.api.pairBeaconDiscoverable?.(true, undefined, 'team'); } catch { /* ignore */ }
      try { await window.api.pairBeaconNearby?.(); } catch { /* ignore */ }
      while (!stopped) {
        try {
          const list = await window.api.pairBeaconNearby?.();
          if (!stopped) setNearbyOwners(Array.isArray(list) ? list : []);
        } catch { /* ignore */ }
        await new Promise((r) => setTimeout(r, 2500));
      }
    })();
    return () => {
      stopped = true;
      window.api.pairBeaconDiscoverable?.(false).catch(() => {});
    };
  }, [joinMode]);

  // ---- Join Mode: resolve a discovered invite and submit, in one motion ----
  const submitJoinWithCode = async (code: string) => {
    const name = selfDeviceName || 'Team Member';
    await window.api.joinAccept({
      code: code.trim(),
      // Deterministic pairing identity — the owner's approval is the real
      // authorization, and they assign name/role/avatar on their side.
      email: `join+${code.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@shega.local`,
      password: `${code.trim()}-shega-pairing`,
      name,
      deviceName: selfDeviceName || undefined,
    });
    setJoinStarted(true);
    setJoinNote('submitted');
    setJoinMode('waiting');
    setError('');
  };

  /** Find the business behind a code, then request to join it — no typing. */
  const resolveAndJoin = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;
    setJoinCode(code);
    setJoinPhase('connecting');
    setError('');
    setLoading(true);
    try {
      const data = await window.api.joinLookup(code);
      setJoinPreview(data);
      await submitJoinWithCode(code);
    } catch (err: any) {
      setError(err?.message || 'That invitation is no longer available. Searching again…');
      setJoinPhase('searching');
      setJoinPreview(null);
    }
    setLoading(false);
  };

  // Auto-connect: the first nearby owner with an open invite is joined with no
  // further input — each code is attempted once so failures don't loop.
  useEffect(() => {
    if (joinMode !== 'form' || joinStarted || loading) return;
    const withInvite = nearbyOwners.find((o) => !!o.beacon.code && !autoJoinedRef.current.has(o.beacon.code));
    if (!withInvite) return;
    autoJoinedRef.current.add(withInvite.beacon.code);
    void resolveAndJoin(withInvite.beacon.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearbyOwners, joinMode, joinStarted]);

  // Search window: if nothing shows up, say so (and keep retrying) instead of
  // leaving the user staring at a silent radar.
  useEffect(() => {
    if (joinMode !== 'form' || joinStarted) return;
    const timer = setTimeout(() => {
      if (!joinStarted) setJoinPhase((p) => (p === 'connecting' ? p : 'notfound'));
    }, 30_000);
    return () => clearTimeout(timer);
  }, [joinMode, joinStarted]);
  const [joinEmail, setJoinEmail] = useState('');
  const [joinPass, setJoinPass] = useState('');
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

  // The login-vs-register decision comes from hasAdmins, which App resolves
  // asynchronously before showing this screen. Recompute when it settles so a
  // brand-new install (zero admins, or a leftover admin from an interrupted
  // first run that never completed onboarding) always lands on account
  // creation, even if that value arrived after this component's first render.
  useEffect(() => {
    setMode(hasAdmins && !isFirstTime ? 'login' : 'register');
  }, [hasAdmins, isFirstTime]);

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
              else { setError(result.error || 'Could not finish signing in'); setJoinPhase('searching'); setJoinMode('form'); }
            }
          } else {
            setJoinMode('pin');
          }
          return;
        }
        if (res.phase === 'rejected' || res.phase === 'cancelled' || res.phase === 'expired') {
          setError(res.phase === 'rejected' ? 'The owner declined this device.' : res.phase === 'cancelled' ? 'The invitation was cancelled.' : 'This invitation has expired.');
          setJoinPhase('searching');
          setJoinMode('form');
          try { await window.api.joinCancel(); } catch { /* best-effort */ }
          return;
        }
        if (res.phase === 'error' && ++attempts >= 5) {
          setError(res.error || 'Lost contact with the server.');
          setJoinPhase('searching');
          setJoinMode('form');
          return;
        }
      } catch (err: any) {
        if (cancelled) return;
        if (++attempts >= 5) {
          setError(err?.message || 'Lost contact with the server.');
          setJoinPhase('searching');
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
    setJoinPin('');
    setJoinConfirmPin('');
    setJoinStarted(false);
    setJoinNote('');
    setJoinPhase('searching');
    setError('');
    setIntent(i => (i === 'join' ? 'welcome' : i));
    setPickedUser(null);
    setUserPin('');
    setUserError('');
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

  // Nearby owners → radar rows (business name + owning device).
  const radarPeers = nearbyOwners.map((o, i) => ({
    peer: {
      id: String(i),
      name: o.beacon.businessName || 'Nearby business',
      platform: o.beacon.owner?.platform,
      detail: `${o.beacon.role === 'team' ? 'Team' : 'Owner'} · ${o.beacon.owner?.deviceName || 'device'}${o.beacon.code ? ' · ready to connect' : ' · waiting for owner'}`,
      disabled: !o.beacon.code,
    } as RadarPeer,
    code: o.beacon.code,
  }));
  const joinTone: RadarTone = joinPhase === 'notfound' ? 'failed' : (joinPhase === 'connecting' || loading) ? 'connecting' : 'searching';
  const joinStatusText = joinPhase === 'connecting'
    ? `Connecting to ${joinPreview?.business_name || 'business'}…`
    : joinPhase === 'notfound' ? 'No device found nearby' : 'Waiting for connection…';

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
                  {joinMode === 'waiting' ? 'Wait for the owner to approve' : joinMode === 'pin' ? 'Approved — create your terminal PIN' : 'Ready to join'}
                </p>
              </div>
            </div>

            {joinMode === 'form' ? (
              <div className="space-y-5">
                <RadarPulse
                  deviceName={selfDeviceName}
                  status={joinStatusText}
                  tone={joinTone}
                  peers={radarPeers.map((p) => p.peer)}
                  onPickPeer={(p) => {
                    const hit = radarPeers[Number(p.id)];
                    if (hit?.code) void resolveAndJoin(hit.code);
                  }}
                  emptyHint="Keep both devices on the same Wi-Fi, then open Add Team on the other device — it will appear here automatically."
                />

                {joinPreview?.business_name && (
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                    {joinPreview.business_name} — your request is pending approval.
                  </p>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-xs font-black uppercase tracking-widest">{error}</p>
                  </div>
                )}

                {/* Fallback only after the automatic search has given up. */}
                {joinPhase === 'notfound' && !joinStarted && (
                  <div className="space-y-3 pt-1">
                    <p className="text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">
                      Still searching. You can enter an invitation code instead.
                    </p>
                    <input
                      type="text" maxLength={12} value={joinCode}
                      onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError(''); }}
                      className="w-full bg-muted/50 rounded-2xl text-center text-lg tracking-[0.25em] py-4 font-black border-2 border-transparent focus:border-foreground/20 transition-all outline-none text-foreground placeholder:text-muted-foreground/30"
                      placeholder="INVITATION CODE"
                    />
                    <button type="button" disabled={loading || !joinCode.trim()} onClick={() => void resolveAndJoin(joinCode)}
                      className="w-full py-4 bg-foreground text-background rounded-2xl font-black uppercase tracking-[0.3em] text-xs hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-30"
                    >
                      Connect
                    </button>
                  </div>
                )}
              </div>
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
              <div className="space-y-5 py-2">
                <RadarPulse
                  deviceName={selfDeviceName}
                  status={joinNote === 'owner-approved' ? 'Approved — setting up…' : 'Waiting for owner approval…'}
                  tone={joinNote === 'owner-approved' ? 'connected' : 'connecting'}
                />
                <div>
                  <p className="text-sm font-black text-foreground tracking-tight uppercase">{joinPreview?.business_name || 'Request sent'}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mt-1">
                    The owner reviews this device and assigns your name, role and permissions. This screen updates the moment they approve.
                  </p>
                </div>
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
<button type="button" onClick={() => { setJoinMode('form'); setJoinPhase('searching'); setError(''); }}
              className="w-full text-center text-xs font-black uppercase tracking-widest text-foreground/60 hover:text-foreground/90 transition-colors py-2"
            >
              Join an existing business
            </button>
            {hasAdmins && isFirstTime && (
              <button type="button" onClick={() => { setMode('login'); setError(''); }}
                className="w-full text-center text-xs font-black uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors py-2"
              >
                I've set up this terminal before — Sign in
              </button>
            )}
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
            <button type="button" onClick={() => { setJoinMode('form'); setJoinPhase('searching'); setError(''); }}
              className="w-full text-center text-xs font-black uppercase tracking-widest text-foreground/60 hover:text-foreground/90 transition-colors py-2"
            >
              Join an existing business
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
            <button type="button" onClick={() => { setIntent('join'); setJoinMode('form'); setJoinPhase('searching'); setError(''); }}
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
            <button type="button" onClick={() => { setJoinMode('form'); setJoinPhase('searching'); setError(''); }}
              className="w-full text-center text-xs font-black uppercase tracking-widest text-foreground/60 hover:text-foreground/90 transition-colors py-2"
            >
              Join an existing business
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
