import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Admin {
  id: number;
  name: string;
  username: string;
  role: string;
  permissions: string[];
  isActive: number;
  avatar?: string;
  isEmployee?: boolean;
  roleKey?: string | null;
  sharedPermissions?: Record<string, boolean | string> | null;
}

// A legacy account (pre-6-digit PIN) still authenticates, but it must pick a new
// 6-digit PIN before the app opens. `requiresPinChange` carries that gate.
export interface LoginResult {
  success: boolean;
  error?: string;
  requiresPinChange?: boolean;
  pinError?: string;
  /**
   * Row the main process issued the one-time upgrade grant for. Present only
   * when `requiresPinChange` is true; the renderer must hand these back to
   * `setOwnPin` unchanged rather than guessing which account it belongs to.
   */
  pinChangeSource?: 'admin' | 'employee' | 'roster';
  pinChangeId?: number;
}

interface AuthContextType {
  currentAdmin: Admin | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isCashier: boolean;
  login: (username: string, pin: string) => Promise<LoginResult>;
  loginByUser: (source: 'admin' | 'employee' | 'roster', id: number, pin: string) => Promise<LoginResult>;
  logout: () => void;
  hasPermission: (perm: string | null) => boolean;
  refreshAdmin: () => Promise<void>;
  hasRole: (roleKey: string) => boolean;
}

// Maps granular permission prefixes (and module names) to the module-level permission that grants them.
const PERMISSION_MODULE: Record<string, string> = {
  dashboard: 'dashboard',
  inventory: 'inventory',
  purchases: 'inventory',
  sales: 'sales',
  payments: 'sales',
  customers: 'customers',
  contacts: 'customers',
  analytics: 'analytics',
  reports: 'analytics',
  adjustments: 'adjustments',
  settings: 'settings',
  notifications: 'settings',
  employees: 'employees',
  team: 'employees',
  shipments: 'shipments',
  suppliers: 'suppliers',
  warehouses: 'warehouses',
  audit: 'audit',
  records: 'audit',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);

  const login = async (username: string, pin: string): Promise<LoginResult> => {
    try {
      const result = await window.api.login(username, pin);
      if (result.success) {
        setCurrentAdmin(result.admin);
        // A legacy account signs in but is gated until it sets a new 6-digit PIN.
        // Pass the flag through instead of dropping it, or a pre-6-digit PIN
        // would keep working forever with no way to upgrade.
        return { success: true, requiresPinChange: !!result.requiresPinChange, pinError: result.pinError };
      }
      return { success: false, error: result.error || 'Invalid credentials' };
    } catch (error) {
      return { success: false, error: 'Authentication failed' };
    }
  };

  /** PIN-only login for a picked profile (Who's using Shega? / Switch User). */
  const loginByUser = async (source: 'admin' | 'employee' | 'roster', id: number, pin: string): Promise<LoginResult> => {
    try {
      const result = await window.api.loginByUser(source, id, pin);
      if (result?.success) {
        setCurrentAdmin(result.admin);
        return { success: true, requiresPinChange: !!result.requiresPinChange, pinError: result.pinError };
      }
      return { success: false, error: result?.error || 'Wrong PIN' };
    } catch {
      return { success: false, error: 'Authentication failed' };
    }
  };

  // App.tsx dispatches this event after a login-by-user so both paths (picker
  // + switch-user) hydrate the context identically.
  useEffect(() => {
    const onLoginByUser = (e: Event) => {
      const admin = (e as CustomEvent).detail;
      if (admin) setCurrentAdmin(admin);
    };
    window.addEventListener('shega:login-by-user', onLoginByUser);
    return () => window.removeEventListener('shega:login-by-user', onLoginByUser);
  }, []);

  const logout = () => {
    // Clear the main-process session too. Renderer state alone left the
    // previous user's id/role/permissions live in the main process, so the
    // next person to sign in on this terminal could act on that session.
    void window.api?.clearSession?.();
    setCurrentAdmin(null);
  };

  const hasPermission = (perm: string | null): boolean => {
    if (!currentAdmin) return false;
    if (!perm) return true;
    if (currentAdmin.role === 'super_admin') return true;
    const perms = currentAdmin.permissions || [];
    if (perms.includes('*') || perms.includes(perm)) return true;
    // Canonical @shega/shared grant (mirrors main's requirePermission).
    const shared = currentAdmin.sharedPermissions;
    if (shared && typeof shared === 'object' && (shared as any)[perm] === true) return true;
    const prefix = perm.split('.')[0];
    const modulePerm = PERMISSION_MODULE[prefix] || prefix;
    const effective = perms.map(p => PERMISSION_MODULE[p.split('.')[0]] || p);
    if (effective.includes(modulePerm)) return true;
    return false;
  };

  const hasRole = (roleKey: string): boolean => {
    if (!currentAdmin) return false;
    if (currentAdmin.role === 'super_admin') return true;
    return (currentAdmin.roleKey || currentAdmin.role || '').toLowerCase() === roleKey.toLowerCase();
  };

  const refreshAdmin = async () => {
    if (!currentAdmin) return;
    try {
      const admin = await window.api.getCurrentAdmin(currentAdmin.id, currentAdmin.isEmployee);
      if (admin) {
        setCurrentAdmin(admin);
      }
    } catch (error) {
      console.error('Failed to refresh admin:', error);
    }
  };

  const isAuthenticated = currentAdmin !== null;
  const isSuperAdmin = currentAdmin?.role === 'super_admin' && !currentAdmin?.isEmployee;
  const isCashier = currentAdmin?.role !== 'super_admin' && (currentAdmin?.roleKey || currentAdmin?.role || '').toLowerCase() === 'cashier';

  return (
    <AuthContext.Provider value={{
      currentAdmin,
      isAuthenticated,
      isSuperAdmin,
      isCashier,
      login,
      loginByUser,
      logout,
      hasPermission,
      refreshAdmin,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
