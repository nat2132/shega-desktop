import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

interface Register {
  id: number;
  name: string;
  locationId?: number | null;
  isActive?: number;
}

export interface Shift {
  id: number;
  businessId: number;
  registerId: number;
  cashierId: number;
  openingFloat: number;
  expectedCash: number;
  countedCash: number;
  variance: number;
  status: 'open' | 'mid_audit' | 'blind_count' | 'closed';
  openedAt: string;
  closedAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface CashierContextType {
  registers: Register[];
  registersLoading: boolean;
  register: Register | null;
  setRegister: (r: Register) => void;
  shift: Shift | null;
  shiftLoading: boolean;
  refreshShift: () => Promise<void>;
  openShift: (openingFloat: number) => Promise<{ success: boolean; error?: string; shiftId?: number }>;
  closeShift: (closingCash: number, cashDrawerCounts?: any[], notes?: string) => Promise<{ success: boolean; error?: string; summary?: any }>;
}

const CashierContext = createContext<CashierContextType | undefined>(undefined);

export const CashierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentAdmin } = useAuth();
  const [registers, setRegisters] = useState<Register[]>([]);
  const [registersLoading, setRegistersLoading] = useState(true);
  const [register, setRegisterState] = useState<Register | null>(null);
  const [shift, setShift] = useState<Shift | null>(null);
  const [shiftLoading, setShiftLoading] = useState(false);

  const loadRegisters = useCallback(async () => {
    try {
      const list = await window.api?.businessListRegisters?.();
      const active = (list || []).filter((r: any) => r.isActive !== 0);
      setRegisters(active);
      const saved = localStorage.getItem('cashier:selected-register');
      const savedMatch = saved ? active.find((r: any) => String(r.id) === saved) : undefined;
      if (savedMatch) {
        setRegisterState(savedMatch);
      } else if (active.length > 0) {
        setRegisterState(active[0]);
      } else {
        setRegisterState(null);
      }
    } catch (e) {
      console.error('Failed to load registers:', e);
    } finally {
      setRegistersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegisters();
  }, [loadRegisters]);

  const refreshShift = useCallback(async () => {
    if (!register) {
      setShift(null);
      return;
    }
    try {
      setShiftLoading(true);
      const active = await window.api?.shiftActive?.(register.id);
      setShift(active || null);
    } catch (e) {
      console.error('Failed to load shift:', e);
      setShift(null);
    } finally {
      setShiftLoading(false);
    }
  }, [register]);

  useEffect(() => {
    refreshShift();
  }, [refreshShift]);

  const setRegister = (r: Register) => {
    setRegisterState(r);
    localStorage.setItem('cashier:selected-register', String(r.id));
  };

  const openShift = async (openingFloat: number) => {
    if (!register || !currentAdmin) return { success: false, error: 'No register selected' };
    try {
      const shiftId = await window.api?.shiftOpen({
        registerId: register.id,
        cashierId: currentAdmin.id,
        openingFloat: openingFloat || 0,
      });
      await refreshShift();
      return { success: true, shiftId };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to open shift' };
    }
  };

  const closeShift = async (closingCash: number, cashDrawerCounts?: any[], notes?: string) => {
    if (!shift) return { success: false, error: 'No active shift' };
    try {
      const summary = await window.api?.shiftClose(shift.id, {
        closingCash,
        cashDrawerCounts: cashDrawerCounts || [],
        notes,
      });
      setShift(null);
      return { success: true, summary };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to close shift' };
    }
  };

  const value = useMemo(
    () => ({
      registers,
      registersLoading,
      register,
      setRegister,
      shift,
      shiftLoading,
      refreshShift,
      openShift,
      closeShift,
    }),
    [registers, registersLoading, register, shift, shiftLoading, refreshShift, openShift, closeShift]
  );

  return <CashierContext.Provider value={value}>{children}</CashierContext.Provider>;
};

export const useCashier = () => {
  const context = useContext(CashierContext);
  if (!context) throw new Error('useCashier must be used within CashierProvider');
  return context;
};