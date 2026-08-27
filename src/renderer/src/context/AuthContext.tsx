import React, { createContext, useContext, useState } from 'react';

export interface Admin {
  id: number;
  name: string;
  username: string;
  role: string;
  permissions: string[];
  isActive: number;
  avatar?: string;
  isEmployee?: boolean;
}

interface AuthContextType {
  currentAdmin: Admin | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  login: (username: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (perm: string | null) => boolean;
  refreshAdmin: () => Promise<void>;
}

// Maps granular permission prefixes (and module names) to the module-level permission that grants them.
const PERMISSION_MODULE: Record<string, string> = {
  dashboard: 'dashboard',
  inventory: 'inventory',
  purchases: 'inventory',
  sales: 'sales',
  orders: 'sales',
  payments: 'sales',
  expenses: 'expenses',
  budgets: 'expenses',
  customers: 'customers',
  contacts: 'customers',
  analytics: 'analytics',
  reports: 'analytics',
  adjustments: 'adjustments',
  settings: 'settings',
  notifications: 'settings',
  employees: 'employees',
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

  const logout = () => {
    setCurrentAdmin(null);
  };

  const hasPermission = (perm: string | null): boolean => {
    if (!currentAdmin) return false;
    if (!perm) return true;
    if (currentAdmin.role === 'super_admin') return true;
    const perms = currentAdmin.permissions || [];
    if (perms.includes('*') || perms.includes(perm)) return true;
    const prefix = perm.split('.')[0];
    const modulePerm = PERMISSION_MODULE[prefix] || prefix;
    const effective = perms.map(p => PERMISSION_MODULE[p.split('.')[0]] || p);
    if (effective.includes(modulePerm)) return true;
    return false;
  };

  const refreshAdmin = async () => {
    if (!currentAdmin) return;
    if (currentAdmin.isEmployee) return;
    try {
      const admin = await window.api.getCurrentAdmin(currentAdmin.id);
      if (admin) {
        setCurrentAdmin(admin);
      }
    } catch (error) {
      console.error('Failed to refresh admin:', error);
    }
  };

  const isAuthenticated = currentAdmin !== null;
  const isSuperAdmin = currentAdmin?.role === 'super_admin' && !currentAdmin?.isEmployee;

  return (
    <AuthContext.Provider value={{
      currentAdmin,
      isAuthenticated,
      isSuperAdmin,
      login,
      logout,
      hasPermission,
      refreshAdmin
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
