import { r as reactExports, g as useSettings, j as jsxRuntimeExports, aY as EyeOff, a0 as Eye } from "./index-wvHtiMql.js";
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = reactExports.useState(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  const setValue = reactExports.useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);
  return [storedValue, setValue];
}
function KpiVisibility({ storageKey, children }) {
  const { t } = useSettings();
  const [visible, setVisible] = useLocalStorage(`shega.kpi.${storageKey}`, false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => setVisible((v) => !v),
        className: "inline-flex items-center gap-1.5 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-widest transition-colors hover:text-foreground",
        children: [
          visible ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "size-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "size-3.5" }),
          visible ? t("kpi.hide") || "Hide KPIs" : t("kpi.show") || "Show KPIs"
        ]
      }
    ) }),
    children(visible)
  ] });
}
export {
  KpiVisibility as K
};
