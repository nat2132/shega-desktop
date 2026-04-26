import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isLocked: boolean;
  unlock: (pin: string) => boolean;
  lock: () => void;
  hasPin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [pinCode, setPinCode] = useState<string | null>(null);

  useEffect(() => {
    window.api.getSetting('pin_enabled').then((enabled: boolean | null) => {
      window.api.getSetting('pin_code').then((code: string | null) => {
        setHasPin(!!enabled && !!code);
        setPinCode(code);
        if (enabled && code) {
          setIsLocked(true);
        }
      });
    });
  }, []);

  const unlock = (pin: string): boolean => {
    if (pin === pinCode) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const lock = () => {
    if (hasPin) {
      setIsLocked(true);
    }
  };

  return (
    <AuthContext.Provider value={{ isLocked, unlock, lock, hasPin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
