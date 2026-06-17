import React, { useEffect, useState, useCallback, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Inventory = lazy(() => import('./pages/Inventory'))
const Sales = lazy(() => import('./pages/Sales'))
const SaleDetail = lazy(() => import('./pages/SaleDetail'))
const Expenses = lazy(() => import('./pages/Expenses'))
const Customers = lazy(() => import('./pages/Customers'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Settings = lazy(() => import('./pages/Settings'))
const Adjustments = lazy(() => import('./pages/Adjustments'))
const Warehouses = lazy(() => import('./pages/Warehouses'))
const Employees = lazy(() => import('./pages/Employees'))
const Shipments = lazy(() => import('./pages/Shipments'))
const ActivityLogs = lazy(() => import('./pages/ActivityLogs'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))
const UsersEmployees = lazy(() => import('./pages/UsersEmployees'))
const Suppliers = lazy(() => import('./pages/Suppliers'))
const AdminManagement = lazy(() => import('./pages/AdminManagement'))
const DebtManagement = lazy(() => import('./pages/DebtManagement'))
const ReminderHistory = lazy(() => import('./pages/ReminderHistory'))
const Reports = lazy(() => import('./pages/Reports'))
const Contacts = lazy(() => import('./pages/Contacts'))
import { useAuth } from './context/AuthContext'
import { initSound, playSound } from './utils/sound'

// Pre-launch screens
import SplashScreen from './components/pre-launch/SplashScreen'
import AuthScreen from './components/pre-launch/AuthScreen'
import BusinessSetup from './components/pre-launch/BusinessSetup'
import OnboardingWizard from './components/pre-launch/OnboardingWizard'
import LoadingScreen from './components/pre-launch/LoadingScreen'
import ErrorScreen from './components/pre-launch/ErrorScreen'


import { TooltipProvider } from './components/ui/tooltip'
import { SidebarProvider, SidebarInset } from './components/ui/sidebar'
import { AppSidebar } from './components/app-sidebar'
import { SiteHeader } from './components/site-header'
import { Toaster } from './components/ui/sonner'
import NotificationBanners from './components/NotificationBanners'
import NotificationModal from './components/NotificationModal'

type AppPhase = 'splash' | 'auth' | 'business-setup' | 'onboarding' | 'loading' | 'ready' | 'error'

function ProtectedRoute({ children, permission }: { children: React.ReactNode; permission?: string }) {
  const { hasPermission } = useAuth();
  
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin } = useAuth();
  
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const { isAuthenticated, login, currentAdmin } = useAuth();
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [hasAdmins, setHasAdmins] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Check system state on mount
  useEffect(() => {
    checkSystemState();
    initSound().then(() => playSound('start'));
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

  const handleRegister = async (name: string, username: string, pin: string) => {
    try {
      const allPermissions = [
        'dashboard', 'inventory', 'sales', 'expenses',
        'customers', 'analytics', 'adjustments', 'settings',
        'warehouses', 'employees', 'shipments', 'activity_logs'
      ];
      await window.api?.insertAdmin({
        name, username, pin, role: 'super_admin', permissions: allPermissions
      });
      // Auto-login after registration
      const loginResult = await login(username, pin);
      if (loginResult.success) {
        setHasAdmins(true);
        setPhase('business-setup');
      }
      return loginResult;
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const handleBusinessSetupComplete = () => {
    setPhase('onboarding');
  };

  const handleOnboardingComplete = () => {
    setPhase('loading');
  };

  const handleLoadingComplete = useCallback(() => {
    setPhase('ready');
  }, []);

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
        onRegister={handleRegister}
        hasAdmins={hasAdmins}
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

  // Phase: Loading
  if (phase === 'loading') {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  // Phase: Ready — main app
  return (
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
          <main className="flex flex-1 flex-col overflow-y-auto">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <Suspense fallback={<div className="flex items-center justify-center h-full py-32"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
              <Routes>
                <Route path="/" element={<ProtectedRoute permission="dashboard"><Dashboard /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute permission="inventory"><Inventory /></ProtectedRoute>} />
                <Route path="/sales" element={<ProtectedRoute permission="sales"><Sales /></ProtectedRoute>} />
                <Route path="/sales/:id" element={<ProtectedRoute permission="sales"><SaleDetail /></ProtectedRoute>} />
                <Route path="/expenses" element={<ProtectedRoute permission="expenses"><Expenses /></ProtectedRoute>} />
                <Route path="/customers" element={<ProtectedRoute permission="customers"><Customers /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute permission="analytics"><Analytics /></ProtectedRoute>} />
                <Route path="/adjustments" element={<ProtectedRoute permission="adjustments"><Adjustments /></ProtectedRoute>} />
                <Route path="/warehouses" element={<ProtectedRoute permission="warehouses"><Warehouses /></ProtectedRoute>} />
                <Route path="/employees" element={<ProtectedRoute permission="employees"><Employees /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute permission="employees"><UsersEmployees /></ProtectedRoute>} />
                <Route path="/shipments" element={<ProtectedRoute permission="shipments"><Shipments /></ProtectedRoute>} />
                <Route path="/suppliers" element={<ProtectedRoute permission="suppliers"><Suppliers /></ProtectedRoute>} />
                <Route path="/activity-logs" element={<ProtectedRoute permission="activity_logs"><ActivityLogs /></ProtectedRoute>} />
                <Route path="/audit-logs" element={<ProtectedRoute permission="audit.view"><AuditLogs /></ProtectedRoute>} />
                <Route path="/debt-management" element={<ProtectedRoute permission="customers"><DebtManagement /></ProtectedRoute>} />
                <Route path="/reminders" element={<ProtectedRoute permission="dashboard"><ReminderHistory /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute permission="analytics"><Reports /></ProtectedRoute>} />
                <Route path="/contacts" element={<ProtectedRoute permission="customers"><Contacts /></ProtectedRoute>} />
                <Route path="/admin-management" element={<SuperAdminRoute><AdminManagement /></SuperAdminRoute>} />
                <Route path="/settings" element={<ProtectedRoute permission="settings"><Settings /></ProtectedRoute>} />
              </Routes>
              </Suspense>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <NotificationModal />
    </TooltipProvider>
  )
}

export default App
