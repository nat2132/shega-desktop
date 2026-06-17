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
  hasPermission: (perm: string) => boolean;
  refreshAdmin: () => Promise<void>;
}

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

  const hasPermission = (perm: string): boolean => {
    if (!currentAdmin) return false;
    if (currentAdmin.role === 'super_admin') return true;
    return currentAdmin.permissions.includes(perm);
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
