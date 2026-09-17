import React, { useEffect, useState, useCallback, Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Inventory = lazy(() => import('./pages/Inventory'))
const Sales = lazy(() => import('./pages/Sales'))
const SaleDetail = lazy(() => import('./pages/SaleDetail'))
const Customers = lazy(() => import('./pages/Customers'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Settings = lazy(() => import('./pages/Settings'))
const Warehouses = lazy(() => import('./pages/Warehouses'))
const Employees = lazy(() => import('./pages/Employees'))
const Shipments = lazy(() => import('./pages/Shipments'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))
const UsersEmployees = lazy(() => import('./pages/UsersEmployees'))
const Suppliers = lazy(() => import('./pages/Suppliers'))
const DebtManagement = lazy(() => import('./pages/DebtManagement'))
const Reports = lazy(() => import('./pages/Reports'))
const SubscriptionDashboard = lazy(() => import('./pages/SubscriptionDashboard'))
const SubscriptionPayment = lazy(() => import('./pages/SubscriptionPayment'))
const Register = lazy(() => import('./pages/Register'))
const CashierLayout = lazy(() => import('./layouts/CashierLayout'))
const CashierPOS = lazy(() => import('./pages/cashier/CashierPOS'))
const CashierMySales = lazy(() => import('./pages/cashier/CashierMySales'))
import { useAuth } from './context/AuthContext'
import { useSettings } from './context/SettingsContext'
import { SubscriptionProvider, useSubscription } from './context/SubscriptionContext'
import ErrorBoundary from './components/ErrorBoundary'
import DeviceLockOverlay from './components/DeviceLockOverlay'
import PinApprovalProvider from './components/PinApprovalProvider'
import { initSound, playSound } from './utils/sound'

// Pre-launch screens
import SplashScreen from './components/pre-launch/SplashScreen'
import AuthScreen from './components/pre-launch/AuthScreen'
import RecoveryKeyDisplay from './components/pre-launch/RecoveryKeyDisplay'
import BusinessSetup from './components/pre-launch/BusinessSetup'
import OnboardingWizard from './components/pre-launch/OnboardingWizard'
import SubscriptionWelcome from './components/pre-launch/SubscriptionWelcome'
import LoadingScreen from './components/pre-launch/LoadingScreen'
import GuidedTour, { TOUR_DONE_KEY as GuidedTourTourKey } from './components/GuidedTour'
import ErrorScreen from './components/pre-launch/ErrorScreen'


import { TooltipProvider } from './components/ui/tooltip'
import { SidebarProvider, SidebarInset } from './components/ui/sidebar'
import { AppSidebar } from './components/app-sidebar'
import { SiteHeader } from './components/site-header'
import { Toaster } from './components/ui/sonner'
import NotificationBanners from './components/NotificationBanners'
import NotificationModal from './components/NotificationModal'
type AppPhase = 'splash' | 'auth' | 'recovery-key' | 'business-setup' | 'onboarding' | 'subscription-welcome' | 'loading' | 'ready' | 'error'

function ProtectedRoute({ children, permission, moduleId }: { children: React.ReactNode; permission?: string; moduleId?: string }) {
  const { hasPermission } = useAuth();
  const { isModuleEnabled } = useSettings();
  
  if (moduleId && !isModuleEnabled(moduleId)) {
    return <Navigate to="/" replace />;
  }
  
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function TeamAdminRoute({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, hasPermission } = useAuth();
  const { isModuleEnabled } = useSettings();
  const { isPremium, isTrial } = useSubscription();
  const location = useLocation();

  if (isSuperAdmin) return <>{children}</>;
  if (isPremium || isTrial) {
    if (!isModuleEnabled('employees')) return <Navigate to="/" replace />;
    if (!hasPermission('employees')) return <Navigate to="/" replace />;
    return <>{children}</>;
  }
  return <Navigate to="/subscription" state={{ lockedFeature: 'users', from: location }} replace />;
}

function PremiumRoute({ children, premiumFeature }: { children: React.ReactNode; premiumFeature: string }) {
  const { isPremium, isTrial } = useSubscription();
  const [showLocked, setShowLocked] = React.useState(false);
  const location = useLocation();

  if (isPremium || isTrial) return <>{children}</>;

  // If not premium, redirect to subscription page
  return <Navigate to="/subscription" state={{ lockedFeature: premiumFeature, from: location }} replace />;
}

function App() {
  const { isAuthenticated, login, isCashier } = useAuth();
  const location = useLocation();
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [hasAdmins, setHasAdmins] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [recoveryKeyData, setRecoveryKeyData] = useState<{ key: string; username: string } | null>(null);
  const [showTour, setShowTour] = React.useState(false);

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
    return () => {
      window.removeEventListener('business-changed', onBizChanged);
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
    }
  };

  const handleSplashComplete = useCallback(() => {
    setPhase('auth');
  }, []);

  const handleLogin = async (username: string, pin: string) => {
    const result = await login(username, pin);
    if (result.success) {
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
      if (isFirstTime) {
        setPhase('business-setup');
      } else {
        setPhase('loading');
      }
    }
    return result;
  };

  /** Apply a login-by-user result to the auth context (mirrors useAuth.login). */
  const setCurrentAdminFromResult = (result: any) => {
    // The AuthContext is updated by the useAuth().loginByUser below via
    // window event; simplest reliable path is dispatching a login event the
    // context listens to. See AuthContext loginByUser implementation.
    window.dispatchEvent(new CustomEvent('shega:login-by-user', { detail: result.admin }));
  };

  const handleRegister = async (name: string, username: string, pin: string, role: string = 'super_admin', permissions: string[] = []) => {
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

  // Phase: Auth (login or register)
  if (phase === 'auth' || !isAuthenticated) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        onLoginByUser={handleLoginByUser}
        onRegister={handleRegister}
        onJoin={handleJoin}
        hasAdmins={hasAdmins}
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
    return <BusinessSetup onComplete={handleBusinessSetupComplete} />;
  }

  // Phase: Onboarding
  if (phase === 'onboarding') {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  // Phase: Subscription Welcome
  if (phase === 'subscription-welcome') {
    return <SubscriptionWelcome onComplete={handleSubscriptionWelcomeComplete} />;
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
          <main className="flex flex-1 flex-col overflow-y-auto scrollbar-apple">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <Suspense fallback={<div className="flex items-center justify-center h-full py-32"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${location.pathname}:${currentBusiness?.id ?? 'none'}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.28, 0, 0.22, 1] }}
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
