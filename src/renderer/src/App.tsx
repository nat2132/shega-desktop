import React, { useEffect, useState, useCallback, Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

function lazyWithRetry<T extends React.ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      const key = 'shega_chunk_reload_' + window.location.pathname;
      const retried = sessionStorage.getItem(key);
      if (!retried) {
        sessionStorage.setItem(key, 'true');
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });
}

const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'))
const Inventory = lazyWithRetry(() => import('./pages/Inventory'))
const Sales = lazyWithRetry(() => import('./pages/Sales'))
const SaleDetail = lazyWithRetry(() => import('./pages/SaleDetail'))
const Customers = lazyWithRetry(() => import('./pages/Customers'))
const Analytics = lazyWithRetry(() => import('./pages/Analytics'))
const Settings = lazyWithRetry(() => import('./pages/Settings'))
const Warehouses = lazyWithRetry(() => import('./pages/Warehouses'))
const Employees = lazyWithRetry(() => import('./pages/Employees'))
const Shipments = lazyWithRetry(() => import('./pages/Shipments'))
const AuditLogs = lazyWithRetry(() => import('./pages/AuditLogs'))
const UsersEmployees = lazyWithRetry(() => import('./pages/UsersEmployees'))
const Suppliers = lazyWithRetry(() => import('./pages/Suppliers'))
const DebtManagement = lazyWithRetry(() => import('./pages/DebtManagement'))
const Reports = lazyWithRetry(() => import('./pages/Reports'))
const SubscriptionDashboard = lazyWithRetry(() => import('./pages/SubscriptionDashboard'))
const SubscriptionPayment = lazyWithRetry(() => import('./pages/SubscriptionPayment'))
const AddBusiness = lazyWithRetry(() => import('./pages/AddBusiness'))
const ConnectedDevices = lazyWithRetry(() => import('./pages/ConnectedDevices'))
const BusinessCenter = lazyWithRetry(() => import('./pages/BusinessCenter'))
const Register = lazyWithRetry(() => import('./pages/Register'))
const CashierLayout = lazyWithRetry(() => import('./layouts/CashierLayout'))
const CashierPOS = lazyWithRetry(() => import('./pages/cashier/CashierPOS'))
const CashierMySales = lazyWithRetry(() => import('./pages/cashier/CashierMySales'))
import { useAuth } from './context/AuthContext'
import { useSettings } from './context/SettingsContext'
import { SubscriptionProvider, useSubscription } from './context/SubscriptionContext'
import ErrorBoundary from './components/ErrorBoundary'
import DeviceLockOverlay from './components/DeviceLockOverlay'
import { useViewOnlyNotice } from './lib/viewOnly'
import PinApprovalProvider from './components/PinApprovalProvider'
import { initSound, playSound } from './utils/sound'

// Pre-launch screens
import SplashScreen from './components/pre-launch/SplashScreen'
import AuthScreen, { type OwnerProfile } from './components/pre-launch/AuthScreen'
import RecoveryKeyDisplay from './components/pre-launch/RecoveryKeyDisplay'
import BusinessSetup from './components/pre-launch/BusinessSetup'
import PinChangeScreen from './components/pre-launch/PinChangeScreen'
import OnboardingWizard from './components/pre-launch/OnboardingWizard'
import SubscriptionWelcome from './components/pre-launch/SubscriptionWelcome'
import { onboardingEditionFor } from '@shega/shared'
import LoadingScreen from './components/pre-launch/LoadingScreen'
import GuidedTour, { TOUR_DONE_KEY as GuidedTourTourKey } from './components/GuidedTour'
import ErrorScreen from './components/pre-launch/ErrorScreen'


import { TooltipProvider } from './components/ui/tooltip'
import { SidebarProvider, SidebarInset } from './components/ui/sidebar'
import { AppSidebar } from './components/app-sidebar'
import { SiteHeader } from './components/site-header'
import { ViewOnlyBanner } from './components/ViewOnlyBanner'
import { Toaster } from './components/ui/sonner'
import { toast } from 'sonner'
import NotificationBanners from './components/NotificationBanners'
import NotificationModal from './components/NotificationModal'
type AppPhase = 'splash' | 'auth' | 'pin-change' | 'recovery-key' | 'business-setup' | 'onboarding' | 'subscription-welcome' | 'subscription-payment' | 'loading' | 'ready' | 'error'

function ProtectedRoute({ children, permission, moduleId }: { children: React.ReactNode; permission?: string; moduleId?: string }) {
  const { hasPermission } = useAuth();
  const { isModuleEnabled } = useSettings();
  const { isReadOnly } = useSubscription();
  
  if (moduleId && !isModuleEnabled(moduleId)) {
    return <Navigate to="/" replace />;
  }
  
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }
  
  if (isReadOnly) {
    return (
      <>
        <ViewOnlyBanner />
        {children}
      </>
    );
  }
  
  return <>{children}</>;
}

function TeamAdminRoute({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, hasPermission } = useAuth();
  const { isModuleEnabled } = useSettings();
  const { isPremium, isTrial, isReadOnly } = useSubscription();
  const location = useLocation();

  if (isSuperAdmin) return <>{children}</>;
  if (isPremium || isTrial) {
    if (!isModuleEnabled('employees')) return <Navigate to="/" replace />;
    if (!hasPermission('employees')) return <Navigate to="/" replace />;
    return <>{children}</>;
  }
  if (isReadOnly) {
    return (
      <>
        <ViewOnlyBanner />
        {children}
      </>
    );
  }
  return <Navigate to="/subscription" state={{ lockedFeature: 'users', from: location }} replace />;
}

function PremiumRoute({ children, premiumFeature }: { children: React.ReactNode; premiumFeature: string }) {
  const { isPremium, isTrial, isReadOnly } = useSubscription();
  const location = useLocation();

  if (isPremium || isTrial) return <>{children}</>;

  // If read-only (trial expired / no active subscription), allow viewing but show view-only banner
  if (isReadOnly) {
    return (
      <>
        <ViewOnlyBanner />
        {children}
      </>
    );
  }

  // If not premium and not read-only (shouldn't happen), redirect to subscription
  return <Navigate to="/subscription" state={{ lockedFeature: premiumFeature, from: location }} replace />;
}

function App() {
  const { isAuthenticated, login, isCashier } = useAuth();
  const location = useLocation();
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [hasAdmins, setHasAdmins] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [recoveryKeyData, setRecoveryKeyData] = useState<{ key: string; username: string } | null>(null);
  // Owner identity collected once at signup. Handed to BusinessSetup so the
  // onboarding wizard never re-asks for a name, email or password.
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const [showTour, setShowTour] = React.useState(false);
  // A legacy (pre-6-digit) account authenticates but is held here until it picks
  // a new 6-digit PIN. `null` means no upgrade is pending.
  const [pinChangeTarget, setPinChangeTarget] = React.useState<{ source: 'admin' | 'employee' | 'roster'; id: number; message?: string } | null>(null);

  // A write rejected by the main process (view-only account) becomes a toast and
  // a redirect to the renew screen, wherever the write was attempted from.
  useViewOnlyNotice();

  // Check system state on mount
  useEffect(() => {
    checkSystemState();
    initSound().then(() => playSound('start'));

    // Business switched elsewhere (Settings/BusinessCenter): reload the
    // current route so no data from the previous business stays visible.
    const onBizChanged = () => {
      try { window.location.reload(); } catch {}
    };
    window.api?.onBusinessChanged?.(onBizChanged);
    window.addEventListener('business-changed', onBizChanged);

    let wasOnline = navigator.onLine;
    const handleOnline = () => {
      if (!wasOnline) {
        toast.success('Internet Connection Restored', {
          description: 'You are back online.',
        });
      }
      wasOnline = true;
    };

    const handleOffline = () => {
      if (wasOnline) {
        toast.error('No Internet Connection', {
          description: 'This feature requires an internet connection. Please connect to the internet and try again.',
        });
      }
      wasOnline = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('business-changed', onBizChanged);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkSystemState = async () => {
    try {
      const admins = await window.api?.getAdmins();
      setHasAdmins(admins && admins.length > 0);

      const onboardingDone = await window.api?.getSetting('onboarding_completed');
      setIsFirstTime(!onboardingDone);
    } catch (err) {
      console.error('System check failed:', err);
      // If the state probe fails we can't prove admins exist — never strand a
      // fresh install on a login screen; fall back to the create-account flow.
      setHasAdmins(false);
    }
  };

  const handleSplashComplete = useCallback(async () => {
    // Resolve the system state BEFORE the auth screen mounts: AuthScreen picks
    // login-vs-register from hasAdmins, and a brand-new install has zero admins.
    await checkSystemState();
    setPhase('auth');
  }, []);

  const handleLogin = async (username: string, pin: string) => {
    const result = await login(username, pin);
    if (result.success) {
      // A legacy account signed in but must not reach the app yet. Route to the
      // forced PIN replacement instead of loading, and remember which row the
      // main process issued the upgrade grant for.
      if (result.requiresPinChange) {
        setPinChangeTarget({ source: result.pinChangeSource, id: result.pinChangeId, message: result.pinError });
        setPhase('pin-change');
        return result;
      }
      // If first time, go through setup flow; otherwise go to loading
      if (isFirstTime) {
        setPhase('business-setup');
      } else {
        setPhase('loading');
      }
    }
    return result;
  };

  /** PIN-only login for a picked profile (Who's using Shega?). */
  const handleLoginByUser = async (source: 'admin' | 'employee' | 'roster', id: number, pin: string) => {
    const result = await window.api.loginByUser(source, id, pin);
    if (result?.success) {
      setCurrentAdminFromResult(result);
      if (result.requiresPinChange) {
        setPinChangeTarget({ source, id, message: result.pinError });
        setPhase('pin-change');
        return result;
      }
      if (isFirstTime) {
        setPhase('business-setup');
      } else {
        setPhase('loading');
      }
    }
    return result;
  };

  /** Replacement committed: drop the gate and continue as normal. */
  const handlePinChangeComplete = () => {
    setPinChangeTarget(null);
    setPhase(isFirstTime ? 'business-setup' : 'loading');
  };

  /**
   * Replacement abandoned. The main process already considers this person signed
   * in, so the session has to be torn down — otherwise a cancelled upgrade would
   * leave a live session behind while the UI shows the profile picker again.
   */
  const handlePinChangeCancel = async () => {
    await window.api?.clearSession?.();
    setPinChangeTarget(null);
    setPhase('auth');
  };

  /** Apply a login-by-user result to the auth context (mirrors useAuth.login). */
  const setCurrentAdminFromResult = (result: any) => {
    // The AuthContext is updated by the useAuth().loginByUser below via
    // window event; simplest reliable path is dispatching a login event the
    // context listens to. See AuthContext loginByUser implementation.
    window.dispatchEvent(new CustomEvent('shega:login-by-user', { detail: result.admin }));
  };

  const handleRegister = async (name: string, username: string, pin: string, role: string = 'super_admin', permissions: string[] = [], profile?: OwnerProfile) => {
    try {
      const result = await window.api?.insertAdmin({
        name, username, pin, role, permissions
      });
      // Generate recovery key
      let recoveryKey = '';
      if (result?.id) {
        const keyData = await window.api?.generateRecoveryKey('admin', result.id);
        recoveryKey = keyData?.recoveryKey || '';
      }
      // Auto-login after registration
      const loginResult = await login(username, pin);
      if (loginResult.success) {
        setHasAdmins(true);
        if (profile) setOwnerProfile(profile);
        if (recoveryKey) {
          setRecoveryKeyData({ key: recoveryKey, username });
          setPhase('recovery-key');
        } else {
          setPhase('business-setup');
        }
      }
      return loginResult;
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  // Employee joined an existing business on this desktop: the main process has
  // already created the local PIN identity + cloud config once the owner
  // approved. Sign them in and go straight to the app (no first-run wizard).
  const handleJoin = async (username: string, pin: string) => {
    try { await window.api?.setSetting('onboarding_completed', 'true'); } catch (err) { /* non-fatal */ }
    const result = await login(username, pin);
    if (result.success) setPhase('loading');
    return result;
  };

  const handleRecoveryKeyAcknowledged = () => {
    setRecoveryKeyData(null);
    setPhase('business-setup');
  };

  const handleBusinessSetupComplete = () => {
    setPhase('onboarding');
  };

  const handleOnboardingComplete = () => {
    setPhase('subscription-welcome');
  };

  const handleSubscriptionWelcomeComplete = () => {
    setPhase('loading');
  };

  // "Pay Now" from the onboarding plan step: the Desktop plan is already
  // selected, so this opens straight on the payment confirmation. The backend
  // keeps the payment pending until an admin approves it.
  const handleSubscriptionWelcomePayNow = () => {
    setPhase('subscription-payment');
  };

  const handleSubscriptionPaymentComplete = () => {
    setPhase('loading');
  };

  const { settingsLoaded, currentBusiness } = useSettings();

  const handleLoadingComplete = useCallback(() => {
    if (settingsLoaded) {
      setPhase('ready');
    }
  }, [settingsLoaded]);

  useEffect(() => {
    if (phase === 'loading' && settingsLoaded) {
      setPhase('ready');
    }
  }, [settingsLoaded, phase]);

  // First-time guided tour — once per install, skippable, never forced.
  useEffect(() => {
    if (phase === 'ready' && !isFirstTime) {
      window.api?.getSetting(GuidedTourTourKey).then((done) => {
        if (!done) setShowTour(true);
      }).catch(() => {});
    }
  }, [phase, isFirstTime]);

  const handleRetry = () => {
    setPhase('splash');
    setErrorMsg('');
    checkSystemState();
  };

  // Phase: Splash
  if (phase === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Phase: Error
  if (phase === 'error') {
    return <ErrorScreen message={errorMsg} onRetry={handleRetry} />;
  }

  // Phase: Forced PIN replacement (legacy, pre-6-digit account).
  // This MUST be checked before the `phase === 'auth' || !isAuthenticated` branch
  // below: a legacy user already counts as authenticated at this point, so that
  // branch would otherwise bounce them back to the profile picker and the
  // upgrade would be silently skippable.
  if (phase === 'pin-change' && pinChangeTarget) {
    return (
      <PinChangeScreen
        source={pinChangeTarget.source}
        id={pinChangeTarget.id}
        message={pinChangeTarget.message}
        onComplete={handlePinChangeComplete}
        onCancel={handlePinChangeCancel}
      />
    );
  }

  // Phase: Auth (login or register)
  if (phase === 'auth' || !isAuthenticated) {
    // The state probe may not have resolved yet (e.g. a slow first run);
    // keep the splash up rather than mounting AuthScreen with an unknown
    // hasAdmins — its login-vs-register mode depends on that value.
    if (hasAdmins === null) {
      return <SplashScreen onComplete={handleSplashComplete} />;
    }
    return (
      <AuthScreen
        onLogin={handleLogin}
        onLoginByUser={handleLoginByUser}
        onRegister={handleRegister}
        onJoin={handleJoin}
        onProfileCaptured={setOwnerProfile}
        hasAdmins={hasAdmins}
        isFirstTime={isFirstTime}
      />
    );
  }

  // Phase: Recovery Key Display
  if (phase === 'recovery-key' && recoveryKeyData) {
    return (
      <RecoveryKeyDisplay
        recoveryKey={recoveryKeyData.key}
        username={recoveryKeyData.username}
        onAcknowledged={handleRecoveryKeyAcknowledged}
      />
    );
  }

  // Phase: Business Setup
  if (phase === 'business-setup') {
    return <BusinessSetup ownerProfile={ownerProfile} onComplete={handleBusinessSetupComplete} />;
  }

  // Phase: Onboarding
  if (phase === 'onboarding') {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  // Phase: Subscription Welcome
  if (phase === 'subscription-welcome') {
    return <SubscriptionWelcome onComplete={handleSubscriptionWelcomeComplete} onPayNow={handleSubscriptionWelcomePayNow} />;
  }

  // Phase: Pay Now during onboarding
  if (phase === 'subscription-payment') {
    return (
      <SubscriptionProvider>
      <TooltipProvider>
        <Toaster />
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
          <SubscriptionPayment
            initialEdition={onboardingEditionFor('desktop')}
            onComplete={handleSubscriptionPaymentComplete}
          />
        </Suspense>
      </TooltipProvider>
      </SubscriptionProvider>
    );
  }

  // Phase: Loading
  if (phase === 'loading') {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  // Phase: Ready — cashier uses a dedicated POS-first shell
  if (isCashier) {
    return (
      <TooltipProvider>
        <Toaster />
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
          <CashierLayout>
            {(() => {
              if (location.pathname.startsWith('/cashier')) {
                return (
                  <Routes>
                    <Route path="/cashier/sales" element={<CashierMySales />} />
                    <Route path="/cashier/customers" element={<ProtectedRoute permission="customers" moduleId="customers"><Customers /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/pos" replace />} />
                  </Routes>
                );
              }
              return (
                <Routes>
                  <Route path="/" element={<Navigate to="/pos" replace />} />
                  <Route path="/pos" element={<ProtectedRoute permission="sales.create"><CashierPOS /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/pos" replace />} />
                </Routes>
              );
            })()}
          </CashierLayout>
        </Suspense>
        <PinApprovalProvider />
        {showTour && <GuidedTour onDone={() => setShowTour(false)} />}
      <DeviceLockOverlay />
      </TooltipProvider>
    );
  }

  // Phase: Ready — main app
  return (
    <SubscriptionProvider>
    <TooltipProvider>
      <Toaster />
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <NotificationBanners />
          <main className="flex-1 overflow-y-auto scrollbar-apple p-4 md:p-6 min-h-0">
            <div className="@container/main flex flex-1 flex-col gap-2 min-h-full">
              <Suspense fallback={<div className="flex items-center justify-center h-full py-32"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${location.pathname}:${currentBusiness?.id ?? 'none'}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.28, 0, 0.22, 1] }}
                  className="min-h-full flex flex-col flex-1"
                >
                  <Routes location={location}>
                    <Route path="/" element={<ProtectedRoute permission="dashboard"><Dashboard /></ProtectedRoute>} />
                    <Route path="/register" element={<ProtectedRoute permission="sales.create" moduleId="sales"><Register /></ProtectedRoute>} />
                    <Route path="/inventory" element={<ProtectedRoute permission="inventory" moduleId="inventory"><Inventory /></ProtectedRoute>} />
                    <Route path="/sales" element={<ProtectedRoute permission="sales" moduleId="sales"><Sales /></ProtectedRoute>} />
                    <Route path="/sales/:id" element={<ProtectedRoute permission="sales" moduleId="sales"><SaleDetail /></ProtectedRoute>} />
                    <Route path="/customers" element={<ProtectedRoute permission="customers" moduleId="customers"><Customers /></ProtectedRoute>} />
                    <Route path="/analytics" element={<ProtectedRoute permission="analytics" moduleId="analytics"><Analytics /></ProtectedRoute>} />
                    <Route path="/warehouses" element={<ProtectedRoute permission="warehouses" moduleId="warehouses"><Warehouses /></ProtectedRoute>} />
                    <Route path="/employees" element={<PremiumRoute premiumFeature="employees"><ProtectedRoute permission="employees" moduleId="employees"><Employees /></ProtectedRoute></PremiumRoute>} />
                    <Route path="/users" element={<TeamAdminRoute><UsersEmployees /></TeamAdminRoute>} />
                    <Route path="/business" element={<ProtectedRoute permission="dashboard"><Dashboard /></ProtectedRoute>} />
                    <Route path="/shipments" element={<PremiumRoute premiumFeature="shipments"><ProtectedRoute permission="shipments" moduleId="shipments"><Shipments /></ProtectedRoute></PremiumRoute>} />
                    <Route path="/suppliers" element={<PremiumRoute premiumFeature="suppliers"><ProtectedRoute permission="suppliers" moduleId="suppliers"><Suppliers /></ProtectedRoute></PremiumRoute>} />
                    <Route path="/audit-logs" element={<PremiumRoute premiumFeature="audit"><ProtectedRoute permission="audit.view"><AuditLogs /></ProtectedRoute></PremiumRoute>} />
                    <Route path="/debt-management" element={<ProtectedRoute permission="customers" moduleId="customers"><DebtManagement /></ProtectedRoute>} />
                    <Route path="/reports" element={<PremiumRoute premiumFeature="reports"><ProtectedRoute permission="analytics" moduleId="analytics"><Reports /></ProtectedRoute></PremiumRoute>} />
                    <Route path="/subscription" element={<ProtectedRoute permission="dashboard"><SubscriptionDashboard /></ProtectedRoute>} />
                    <Route path="/subscription/payment" element={<ProtectedRoute permission="dashboard"><SubscriptionPayment /></ProtectedRoute>} />
                    <Route path="/subscription/add-business" element={<ProtectedRoute permission="dashboard"><AddBusiness /></ProtectedRoute>} />
                    <Route path="/subscription/devices" element={<ProtectedRoute permission="dashboard"><ConnectedDevices /></ProtectedRoute>} />
                    <Route path="/subscription/business-center" element={<ProtectedRoute permission="dashboard"><BusinessCenter /></ProtectedRoute>} />
                    <Route path="/admin-management" element={<Navigate to="/users" replace />} />
                    <Route path="/settings" element={<ProtectedRoute permission="settings"><Settings /></ProtectedRoute>} />
                  </Routes>
                </motion.div>
              </AnimatePresence>
              </Suspense>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <NotificationModal />
      <DeviceLockOverlay />
      <PinApprovalProvider />
    </TooltipProvider>
    </SubscriptionProvider>
  )
}

export default App
