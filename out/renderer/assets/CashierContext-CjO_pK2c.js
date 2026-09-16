import { r as reactExports, O as useAuth, j as jsxRuntimeExports } from "./index-CqMtuUke.js";
const CashierContext = reactExports.createContext(void 0);
const CashierProvider = ({ children }) => {
  const { currentAdmin } = useAuth();
  const [registers, setRegisters] = reactExports.useState([]);
  const [registersLoading, setRegistersLoading] = reactExports.useState(true);
  const [register, setRegisterState] = reactExports.useState(null);
  const [shift, setShift] = reactExports.useState(null);
  const [shiftLoading, setShiftLoading] = reactExports.useState(false);
  const loadRegisters = reactExports.useCallback(async () => {
    try {
      const list = await window.api?.businessListRegisters?.();
      const active = (list || []).filter((r) => r.isActive !== 0);
      setRegisters(active);
      const saved = localStorage.getItem("cashier:selected-register");
      const savedMatch = saved ? active.find((r) => String(r.id) === saved) : void 0;
      if (savedMatch) {
        setRegisterState(savedMatch);
      } else if (active.length > 0) {
        setRegisterState(active[0]);
      } else {
        setRegisterState(null);
      }
    } catch (e) {
      console.error("Failed to load registers:", e);
    } finally {
      setRegistersLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    loadRegisters();
  }, [loadRegisters]);
  const refreshShift = reactExports.useCallback(async () => {
    if (!register) {
      setShift(null);
      return;
    }
    try {
      setShiftLoading(true);
      const active = await window.api?.shiftActive?.(register.id);
      setShift(active || null);
    } catch (e) {
      console.error("Failed to load shift:", e);
      setShift(null);
    } finally {
      setShiftLoading(false);
    }
  }, [register]);
  reactExports.useEffect(() => {
    refreshShift();
  }, [refreshShift]);
  const setRegister = (r) => {
    setRegisterState(r);
    localStorage.setItem("cashier:selected-register", String(r.id));
  };
  const openShift = async (openingFloat) => {
    if (!register || !currentAdmin) return { success: false, error: "No register selected" };
    try {
      const shiftId = await window.api?.shiftOpen({
        registerId: register.id,
        cashierId: currentAdmin.id,
        openingFloat: openingFloat || 0
      });
      await refreshShift();
      return { success: true, shiftId };
    } catch (e) {
      return { success: false, error: e.message || "Failed to open shift" };
    }
  };
  const closeShift = async (closingCash, cashDrawerCounts, notes) => {
    if (!shift) return { success: false, error: "No active shift" };
    try {
      const summary = await window.api?.shiftClose(shift.id, {
        closingCash,
        cashDrawerCounts: cashDrawerCounts || [],
        notes
      });
      setShift(null);
      return { success: true, summary };
    } catch (e) {
      return { success: false, error: e.message || "Failed to close shift" };
    }
  };
  const value = reactExports.useMemo(
    () => ({
      registers,
      registersLoading,
      register,
      setRegister,
      shift,
      shiftLoading,
      refreshShift,
      openShift,
      closeShift
    }),
    [registers, registersLoading, register, shift, shiftLoading, refreshShift, openShift, closeShift]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CashierContext.Provider, { value, children });
};
const useCashier = () => {
  const context = reactExports.useContext(CashierContext);
  if (!context) throw new Error("useCashier must be used within CashierProvider");
  return context;
};
export {
  CashierProvider as C,
  useCashier as u
};
