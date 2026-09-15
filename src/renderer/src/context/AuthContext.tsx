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

interface AuthContextType {
  currentAdmin: Admin | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isCashier: boolean;
  login: (username: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  loginByUser: (source: 'admin' | 'employee' | 'roster', id: number, pin: string) => Promise<{ success: boolean; error?: string }>;
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

  const login = async (username: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await window.api.login(username, pin);
      if (result.success) {
        setCurrentAdmin(result.admin);
        return { success: true };
      }
      return { success: false, error: result.error || 'Invalid credentials' };
    } catch (error) {
      return { success: false, error: 'Authentication failed' };
    }
  };

  /** PIN-only login for a picked profile (Who's using Shega? / Switch User). */
  const loginByUser = async (source: 'admin' | 'employee' | 'roster', id: number, pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await window.api.loginByUser(source, id, pin);
      if (result?.success) {
        setCurrentAdmin(result.admin);
        return { success: true };
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
