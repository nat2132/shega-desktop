import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, C as CircleCheck, N as cn, i as Button, n as RefreshCw, T as TriangleAlert, F as Archive, H as toast, O as useAuth, g as useSettings, ah as React, ai as Search, X, x as Plus, w as ShoppingCart, am as Receipt, y as Trash2, ao as CreditCard, G as Input } from "./index-CqMtuUke.js";
import { u as useDataChangedRefresh } from "./useDataChangedRefresh-BQRADQai.js";
import { S as ScanLine, P as Percent } from "./scan-line-C_z41Gpr.js";
import { S as Smartphone } from "./smartphone-CtjJ4yya.js";
import { C as CircleX } from "./circle-x-Bx950W_i.js";
import { u as useCashier } from "./CashierContext-CjO_pK2c.js";
import { S as SaleSuccessModal } from "./SaleSuccessModal-BAXrOa3G.js";
import { D as DatePicker } from "./DatePicker-Dr3PGhek.js";
import { P as PackageSearch } from "./package-search-ClUV3gCY.js";
import { M as Minus } from "./minus-B7ZyYxpC.js";
import { B as Banknote } from "./banknote-CcpJx6pJ.js";
import { Z as Zap } from "./zap-D34YHcWw.js";
import "./jspdf.es.min-C-KvxjzZ.js";
import "./circle-check-big-B-nfalbZ.js";
import "./select-DbRJaTXm.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ArchiveRestore = createLucideIcon("ArchiveRestore", [
  ["rect", { width: "20", height: "5", x: "2", y: "3", rx: "1", key: "1wp1u1" }],
  ["path", { d: "M4 8v11a2 2 0 0 0 2 2h2", key: "tvwodi" }],
  ["path", { d: "M20 8v11a2 2 0 0 1-2 2h-2", key: "1gkqxj" }],
  ["path", { d: "m9 15 3-3 3 3", key: "1pd0qc" }],
  ["path", { d: "M12 12v9", key: "192myk" }]
]);
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Settings2 = createLucideIcon("Settings2", [
  ["path", { d: "M20 7h-9", key: "3s1dr2" }],
  ["path", { d: "M14 17H5", key: "gfn3mx" }],
  ["circle", { cx: "17", cy: "17", r: "3", key: "18b49y" }],
  ["circle", { cx: "7", cy: "7", r: "3", key: "dfmy0x" }]
]);
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Wallet = createLucideIcon("Wallet", [
  [
    "path",
    {
      d: "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1",
      key: "18etb6"
    }
  ],
  ["path", { d: "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4", key: "xoc0q4" }]
]);
const SCANNER_MODE_KEY = "shega.pos.scannerMode";
const SETUP_DONE_KEY = "shega.pos.setupDone";
function getScannerMode() {
  try {
    return localStorage.getItem(SCANNER_MODE_KEY) || "physical";
  } catch {
    return "physical";
  }
}
function setScannerMode(mode) {
  try {
    localStorage.setItem(SCANNER_MODE_KEY, mode);
  } catch {
  }
}
function isSetupDone() {
  try {
    return localStorage.getItem(SETUP_DONE_KEY) === "1";
  } catch {
    return false;
  }
}
function markSetupDone() {
  try {
    localStorage.setItem(SETUP_DONE_KEY, "1");
  } catch {
  }
}
async function probeDevices() {
  const status = [];
  status.push({
    id: "scanner",
    label: "Barcode Scanner",
    state: "ok",
    detail: getScannerMode() === "physical" ? "Wedge scanner active — scan into search box" : "Standby (using phone scanner)"
  });
  let phoneOk = false;
  try {
    const phones = await window.api?.peripheralPhones?.() || [];
    phoneOk = phones.length > 0;
    status.push({
      id: "mobile-scanner",
      label: "Mobile Scanner",
      state: phoneOk ? "ok" : "warn",
      detail: phoneOk ? `${phones[0].name || "Phone"} connected` : "No phone connected — open Shega Mobile on the same Wi-Fi"
    });
  } catch {
    status.push({ id: "mobile-scanner", label: "Mobile Scanner", state: "warn", detail: "Not connected" });
  }
  try {
    const ps = await window.api?.getPrintStatus?.();
    const enabled = !!ps?.enabled;
    const width = ps?.paperWidth === 58 ? "58mm" : "80mm";
    const online = !!ps?.online;
    status.push({
      id: ps?.paperWidth === 58 ? "printer-58" : "printer-80",
      label: `Thermal Printer ${width}`,
      state: enabled ? online ? "ok" : "warn" : "off",
      detail: !enabled ? "Disabled — enable in Devices settings" : online ? ps?.simulate ? "Simulate mode — prints to file" : `Ready (${ps.host}:${ps.port})` : `Unreachable (${ps.host}:${ps.port})`
    });
    status.push({
      id: "label",
      label: "Label Printer",
      state: enabled ? online ? "ok" : "warn" : "off",
      detail: enabled ? "Uses the thermal printer" : "Disabled"
    });
    status.push({
      id: "drawer",
      label: "Cash Drawer",
      state: enabled && ps?.autoOpenDrawer ? "ok" : "off",
      detail: enabled && ps?.autoOpenDrawer ? `Opens on sale (pin ${ps.drawerPin})` : "Not configured"
    });
  } catch {
    status.push({ id: "printer-80", label: "Thermal Printer", state: "warn", detail: "Status unavailable" });
  }
  return status;
}
function ScannerSetupModal({ open, onClose }) {
  const [mode, setMode] = reactExports.useState(getScannerMode());
  const [testing, setTesting] = reactExports.useState(false);
  const test = async () => {
    setTesting(true);
    try {
      if (mode === "phone") {
        const phones = await window.api?.peripheralPhones?.() || [];
        if (!phones.length) {
          toast.error("No phone connected yet — open Shega Mobile on the same Wi-Fi, then tap Test again.");
          return;
        }
        toast.success(`Phone found: ${phones[0].name || "Mobile"} — it will scan into the POS.`);
      } else {
        toast.success("Wedge scanner is active — scan any barcode into the search box to test.", { duration: 5e3 });
      }
    } finally {
      setTesting(false);
    }
  };
  const save = () => {
    setScannerMode(mode);
    markSetupDone();
    toast.success(`Scanner set to ${mode === "phone" ? "Mobile phone" : "Physical barcode scanner"}. You can change this anytime in Devices.`);
    onClose();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6", !open && "hidden"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-bold text-foreground", children: "How do you want to scan products?" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "You can change this anytime in Settings → Devices." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setMode("physical"),
          className: cn(
            "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
            mode === "physical" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ScanLine, { className: "mt-0.5 size-5 text-primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-bold text-foreground", children: "Barcode Scanner" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-muted-foreground", children: "USB / Bluetooth scanner that types into the POS. Auto-detected — no driver needed." })
            ] }),
            mode === "physical" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-4 text-primary" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setMode("phone"),
          className: cn(
            "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
            mode === "phone" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "mt-0.5 size-5 text-primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-bold text-foreground", children: "Use Mobile as Barcode Scanner" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-muted-foreground", children: "Cashier's phone scans and sends the barcode to this POS over Wi-Fi. Works offline on the same network." })
            ] }),
            mode === "phone" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-4 text-primary" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", onClick: test, disabled: testing, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: cn("mr-1 size-3.5", testing && "animate-spin") }),
        " Test"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: save, children: "Save & Start Selling" })
    ] })
  ] }) });
}
function PosDeviceStrip({ onOpenSetup }) {
  const [devices, setDevices] = reactExports.useState([]);
  const [expanded, setExpanded] = reactExports.useState(false);
  const refresh = reactExports.useCallback(async () => {
    setDevices(await probeDevices());
  }, []);
  reactExports.useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15e3);
    return () => clearInterval(t);
  }, [refresh]);
  const summary = (() => {
    const scanner = devices.find((d) => d.id === "scanner");
    const printer = devices.find((d) => d.id === "printer-58" || d.id === "printer-80");
    const phone = devices.find((d) => d.id === "mobile-scanner");
    return [
      { label: "Scanner", state: scanner?.state ?? "warn", detail: scanner?.state === "ok" ? "Connected" : "Not connected" },
      { label: "Printer", state: printer?.state === "ok" ? "ok" : printer?.state === "warn" ? "warn" : "off", detail: printer?.detail ?? "Unknown" },
      { label: "Mobile", state: phone?.state ?? "warn", detail: phone?.state === "ok" ? "Connected" : "Not connected" }
    ];
  })();
  const problems = devices.filter((d) => d.state !== "ok");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-border/60 bg-card px-4 py-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "span",
        {
          className: cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
            problems.length === 0 ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"
          ),
          children: [
            problems.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-3" }),
            problems.length === 0 ? "POS Ready" : `${problems.length} device${problems.length === 1 ? "" : "s"} need attention`
          ]
        }
      ),
      summary.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "hidden items-center gap-1 text-[11px] font-medium text-muted-foreground sm:inline-flex", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("inline-block size-1.5 rounded-full", s.state === "ok" ? "bg-green-500" : s.state === "warn" ? "bg-amber-500" : "bg-gray-400") }),
        s.label,
        ": ",
        s.detail
      ] }, s.label)),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-auto flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setExpanded((e) => !e),
            className: "rounded-full p-1.5 text-muted-foreground hover:bg-muted",
            title: "Device status",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Archive, { className: "size-3.5" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onOpenSetup, className: "rounded-full p-1.5 text-muted-foreground hover:bg-muted", title: "Scanner setup", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { className: "size-3.5" }) })
      ] })
    ] }),
    expanded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 space-y-1.5 border-t border-border/60 pt-2", children: devices.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
      d.state === "ok" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-3.5 text-green-500" }) : d.state === "warn" ? /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-3.5 text-amber-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "size-3.5 text-gray-400" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-foreground", children: d.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
        "— ",
        d.detail
      ] }),
      d.id === "mobile-scanner" && d.state !== "ok" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "ml-auto h-6 px-2 text-[10px]", onClick: async () => {
        const phones = await window.api?.peripheralPhones?.().catch(() => []);
        toast[phones?.length ? "success" : "error"](
          phones?.length ? `Reconnected: ${phones[0].name}` : "No phone found — open Shega Mobile on this Wi-Fi, then retry."
        );
        refresh();
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-1 size-3" }),
        " Reconnect"
      ] }),
      (d.id === "printer-58" || d.id === "printer-80") && d.state !== "off" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "ml-auto h-6 px-2 text-[10px]", onClick: async () => {
        const r = await window.api?.printTestPage?.();
        toast[r?.success ? "success" : "error"](r?.success ? "Test page printed" : `Test failed: ${r?.error}`);
        refresh();
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArchiveRestore, { className: "mr-1 size-3" }),
        " Test print"
      ] })
    ] }, d.id)) })
  ] });
}
const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "mobile", label: "Mobile", icon: Zap },
  { id: "debt", label: "Debt", icon: Wallet }
];
const QUICK_CASH = [100, 200, 500, 1e3, 2e3, 5e3];
const round2 = (n) => Math.round(n * 100) / 100;
function CashierPOS() {
  const { shift } = useCashier();
  const { hasRole } = useAuth();
  const { taxEnabled, taxRate } = useSettings();
  const [products, setProducts] = reactExports.useState([]);
  const [categories, setCategories] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [search, setSearch] = reactExports.useState("");
  const [cat, setCat] = reactExports.useState("all");
  const [cart, setCart] = reactExports.useState([]);
  const [showCheckout, setShowCheckout] = reactExports.useState(false);
  const [method, setMethod] = reactExports.useState("cash");
  const [tendered, setTendered] = reactExports.useState("");
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [lastSale, setLastSale] = reactExports.useState(null);
  const [debtCustomerName, setDebtCustomerName] = reactExports.useState("");
  const [debtCustomerPhone, setDebtCustomerPhone] = reactExports.useState("");
  const [debtDueDate, setDebtDueDate] = reactExports.useState("");
  const scanRef = reactExports.useRef(null);
  const loadPosData = React.useCallback(async () => {
    try {
      const [items, cats] = await Promise.all([
        window.api?.posProducts?.(),
        window.api?.posCategories?.()
      ]);
      setProducts((items || []).map((p) => ({
        ...p,
        baseSellingPrice: Number(p.baseSellingPrice) || 0,
        packSellingPrice: Number(p.packSellingPrice) || 0,
        totalBaseQuantity: Number(p.totalBaseQuantity) || 0,
        totalPackQuantity: Number(p.totalPackQuantity) || 0
      })));
      setCategories(cats || []);
    } catch (e) {
      console.error("Failed to load POS products", e);
      toast.error("Could not load products");
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    loadPosData();
  }, [loadPosData]);
  useDataChangedRefresh(() => {
    loadPosData();
  });
  const visible = reactExports.useMemo(() => {
    let list = products;
    if (cat !== "all") list = list.filter((p) => p.categoryId === cat);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q) || p.categoryName?.toLowerCase().includes(q)
      );
    }
    return list.filter((p) => p.totalBaseQuantity > 0 || p.totalPackQuantity > 0);
  }, [products, cat, search]);
  const totals = reactExports.useMemo(() => {
    const subtotal = round2(cart.reduce((s, c) => s + c.price * c.qty, 0));
    const discount = round2(cart.reduce((s, c) => s + c.discount, 0));
    const vat = taxEnabled ? round2((subtotal - discount) * (taxRate / 100)) : 0;
    const total = round2(subtotal - discount + vat);
    return { subtotal, discount, vat, total };
  }, [cart, taxEnabled, taxRate]);
  const addToCart = reactExports.useCallback((p) => {
    setCart((prev) => {
      const price = p.baseSellingPrice;
      const unit = p.baseUnit || "pcs";
      const unitType = "base";
      const stock = p.totalBaseQuantity;
      const existing = prev.find((c) => c.itemId === p.id);
      if (existing) {
        if (existing.qty >= stock) return prev;
        return prev.map((c) => c.itemId === p.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { itemId: p.id, name: p.name, price, unit, unitType, qty: 1, discount: 0, stock }];
    });
    setSearch("");
    scanRef.current?.focus();
  }, []);
  const changeQty = (itemId, unitType, delta) => {
    setCart(
      (prev) => prev.map((c) => {
        if (c.itemId !== itemId || c.unitType !== unitType) return c;
        const next = c.qty + delta;
        if (delta < 0 && next < 1) return prev.filter((c2) => !(c2.itemId === itemId && c2.unitType === unitType));
        if (next > c.stock) return c;
        return { ...c, qty: next };
      })
    );
  };
  const setLineDiscount = (itemId, unitType, value) => {
    setCart(
      (prev) => prev.map((c) => {
        if (c.itemId !== itemId || c.unitType !== unitType) return c;
        const max = c.price * c.qty;
        return { ...c, discount: Math.max(0, Math.min(value || 0, max)) };
      })
    );
  };
  const clearCart = () => setCart([]);
  const handleScanOrEnter = (e) => {
    e.preventDefault();
    const q = search.trim().toLowerCase();
    if (!q) return;
    const product = products.find((p) => p.barcode && p.barcode.toLowerCase() === q || p.sku && p.sku.toLowerCase() === q);
    if (product) addToCart(product);
    else toast.error("No item found for that code");
  };
  const [scanningPhone, setScanningPhone] = reactExports.useState(null);
  const [showSetup, setShowSetup] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!isSetupDone()) setShowSetup(true);
  }, []);
  const handlePhoneScan = async () => {
    try {
      const phones = await window.api?.peripheralPhones?.() || [];
      if (!phones.length) {
        toast.error("No phone connected. Open Shega on your phone and connect to this POS.");
        return;
      }
      const phone = phones[0];
      setScanningPhone(phone.name);
      const res = await window.api.peripheralScan(phone.deviceId);
      setScanningPhone(null);
      if (!res.barcode) {
        toast.info("Scan cancelled on the phone.");
        return;
      }
      const product = products.find((p) => p.barcode && p.barcode.toLowerCase() === res.barcode.toLowerCase() || p.sku && p.sku.toLowerCase() === res.barcode.toLowerCase());
      if (product) {
        addToCart(product);
        toast.success(`Added ${product.name} via phone scan`);
      } else {
        toast.error(`No item found for ${res.barcode}`);
      }
    } catch (err) {
      setScanningPhone(null);
      if (err?.message !== "cancelled") toast.error(err?.message || "Phone scan failed — check the phone is connected.");
    }
  };
  const completeSale = async () => {
    if (cart.length === 0 || submitting) return;
    if (method === "debt" && !debtCustomerName.trim()) {
      toast.error("Customer name is required for debt sales");
      return;
    }
    setSubmitting(true);
    try {
      const isDebt = method === "debt";
      const lines = cart.map((c) => {
        const lineSub = round2(c.price * c.qty - c.discount);
        const vat = taxEnabled ? round2(lineSub * (taxRate / 100)) : 0;
        const total = round2(lineSub + vat);
        return {
          itemId: c.itemId,
          quantity: c.qty,
          unit: c.unit,
          unitType: c.unitType,
          discount: c.discount,
          vat,
          totalPrice: total,
          paymentMethod: isDebt ? "Cash" : method,
          paymentStatus: isDebt ? "Debt" : "Paid",
          customerName: isDebt ? debtCustomerName.trim() : null,
          customerPhone: isDebt ? debtCustomerPhone.trim() || null : null,
          dueDate: isDebt && debtDueDate ? debtDueDate : null,
          paidAmount: isDebt ? 0 : total
        };
      });
      const ids = await window.api?.insertSalesBatch(lines);
      if (!ids) throw new Error("Sale failed");
      if (shift?.id && !isDebt) {
        for (let i = 0; i < lines.length; i++) {
          try {
            await window.api?.shiftRecordTransaction({
              shiftId: shift.id,
              saleId: ids[i],
              paymentMethod: lines[i].paymentMethod,
              amount: lines[i].totalPrice
            });
          } catch (e) {
            console.error("Shift transaction record failed", e);
          }
        }
      }
      setLastSale({
        id: ids[0] || Date.now(),
        totalPrice: lines.reduce((s, l) => s + l.totalPrice, 0),
        itemCount: lines.reduce((s, l) => s + l.quantity, 0),
        paymentMethod: method,
        paymentStatus: method === "debt" ? "Debt" : "Paid",
        paidAmount: method === "debt" ? 0 : lines.reduce((s, l) => s + l.totalPrice, 0),
        customerName: method === "debt" ? debtCustomerName.trim() : "Walk-in",
        items: cart.map((c) => ({ name: c.name, quantity: c.qty, price: c.price }))
      });
      setCart([]);
      setTendered("");
      setDebtCustomerName("");
      setDebtCustomerPhone("");
      setDebtDueDate("");
      setShowCheckout(false);
      toast.success("Sale completed");
    } catch (e) {
      toast.error(e?.message || "Sale failed");
    } finally {
      setSubmitting(false);
    }
  };
  const change = method === "cash" ? round2((parseFloat(tendered) || 0) - totals.total) : 0;
  const canPay = method === "debt" ? !!debtCustomerName.trim() : method !== "cash" || parseFloat(tendered) >= totals.total;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-h-0 flex-col bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ScannerSetupModal, { open: showSetup, onClose: () => setShowSetup(false) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(PosDeviceStrip, { onOpenSetup: () => setShowSetup(true) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-0 flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-1 flex-col border-r border-border/60", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 border-b border-border/60 bg-card px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleScanOrEnter, className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: scanRef,
                value: search,
                onChange: (e) => setSearch(e.target.value),
                placeholder: "Search name, SKU, or scan barcode…",
                autoFocus: true,
                className: "h-11 w-full rounded-2xl border border-input bg-background pl-9 pr-9 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              }
            ),
            search && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setSearch(""),
                className: "absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: handlePhoneScan,
              disabled: !!scanningPhone,
              className: "inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20 disabled:opacity-60",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: cn("size-3.5", scanningPhone && "animate-pulse") }),
                scanningPhone ? `Waiting for ${scanningPhone} — approve on the phone…` : "Scan with Phone"
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5 overflow-x-auto pb-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setCat("all"),
                className: cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-colors",
                  cat === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                ),
                children: "All"
              }
            ),
            categories.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setCat(c.id),
                className: cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-colors",
                  cat === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                ),
                children: c.name
              },
              c.id
            ))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-y-auto p-4", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" }) }) : visible.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full flex-col items-center justify-center gap-3 text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(PackageSearch, { className: "size-12 opacity-40" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "No products found" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5", children: visible.map((p) => {
          const price = p.baseSellingPrice;
          const stock = p.totalBaseQuantity;
          const out = stock <= 0;
          const low = !out && stock <= 10;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => addToCart(p),
              disabled: out,
              className: cn(
                "group flex flex-col rounded-2xl border bg-card p-2.5 text-left transition-all",
                out ? "cursor-not-allowed border-border/40 opacity-50" : "border-border/60 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-2.5 aspect-square w-full overflow-hidden rounded-xl bg-muted", children: [
                  p.image ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "img",
                    {
                      src: p.image,
                      alt: p.name,
                      className: "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105",
                      onError: (e) => {
                        e.target.style.display = "none";
                      }
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full w-full items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PackageSearch, { className: "size-8 text-muted-foreground/30" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: cn(
                        "absolute bottom-1.5 right-1.5 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide shadow-sm backdrop-blur-sm",
                        out ? "bg-muted/90 text-muted-foreground" : low ? "bg-red-500/90 text-white" : "bg-emerald-500/90 text-white"
                      ),
                      children: out ? "Out of Stock" : low ? `${stock} left` : "In Stock"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate px-0.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: p.categoryName || "Uncategorized" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate px-0.5 text-sm font-bold leading-snug", title: p.name, children: p.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex w-full items-center justify-between px-0.5 pb-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-black tracking-tight", children: [
                    price.toLocaleString(),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-0.5 text-[9px] font-bold text-muted-foreground", children: "ETB" })
                  ] }),
                  !out && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3.5", strokeWidth: 3 }) })
                ] })
              ]
            },
            p.id
          );
        }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full flex-col border-l border-border/60 bg-card md:w-[380px] xl:w-[420px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-border/60 px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "size-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-black uppercase tracking-widest", children: "Cart" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary", children: cart.length })
          ] }),
          cart.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: clearCart, className: "text-xs font-bold text-muted-foreground hover:text-destructive", children: "Clear" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-y-auto p-3", children: cart.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full flex-col items-center justify-center gap-3 text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "size-12 opacity-30" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-6 text-center text-sm font-medium", children: shift ? "Tap products to add them here" : "Open a shift first to start selling" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: cart.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border/60 bg-background p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-sm font-bold", children: c.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                c.price.toLocaleString(),
                " ETB × ",
                c.qty,
                " ",
                c.unit
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-black whitespace-nowrap", children: round2(c.price * c.qty).toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 rounded-full border border-border/60 p-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => changeQty(c.itemId, c.unitType, -1),
                  className: "rounded-full p-1.5 hover:bg-muted",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "size-3.5" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-8 text-center font-mono text-sm font-bold", children: c.qty }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => changeQty(c.itemId, c.unitType, 1),
                  disabled: c.qty >= c.stock,
                  className: "rounded-full p-1.5 hover:bg-muted disabled:opacity-30",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3.5" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative ml-auto", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Percent, { className: "absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "number",
                  min: 0,
                  step: 0.01,
                  value: c.discount || "",
                  placeholder: "Disc",
                  onChange: (e) => setLineDiscount(c.itemId, c.unitType, parseFloat(e.target.value) || 0),
                  className: "h-8 w-20 rounded-xl border border-input bg-background pl-7 pr-2 text-right text-xs font-bold outline-none focus:border-primary"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => changeQty(c.itemId, c.unitType, -c.qty),
                className: "rounded-full p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-destructive",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5" })
              }
            )
          ] })
        ] }, `${c.itemId}-${c.unitType}`)) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 border-t border-border/60 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Subtotal" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold", children: [
                totals.subtotal.toLocaleString(),
                " ETB"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Discount" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold", style: { color: totals.discount ? "var(--destructive)" : void 0 }, children: [
                "−",
                totals.discount.toLocaleString(),
                " ETB"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "VAT (15%)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold", children: [
                totals.vat.toLocaleString(),
                " ETB"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-black uppercase tracking-widest text-primary", children: "Total" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xl font-black tracking-tight text-primary", children: [
              totals.total.toLocaleString(),
              " ETB"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              size: "lg",
              disabled: cart.length === 0,
              onClick: () => {
                setMethod("cash");
                setTendered("");
                setShowCheckout(true);
              },
              className: "h-13 w-full rounded-2xl py-4",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "mr-2 size-5" }),
                cart.length === 0 ? "Cart empty" : `Charge ${totals.total.toLocaleString()} ETB`
              ]
            }
          )
        ] })
      ] })
    ] }),
    showCheckout && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center", onClick: () => !submitting && setShowCheckout(false), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md rounded-t-3xl border border-border/60 bg-card p-6 shadow-2xl sm:rounded-3xl", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-black tracking-tight", children: "Checkout" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowCheckout(false), disabled: submitting, className: "rounded-full p-1.5 hover:bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 grid grid-cols-4 gap-2", children: PAYMENT_METHODS.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setMethod(m.id),
          className: cn(
            "flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 transition-all",
            method === m.id ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:border-primary/40"
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(m.icon, { className: "size-5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold", children: m.label })
          ]
        },
        m.id
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: "Total" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xl font-black tracking-tight", children: [
            totals.total.toLocaleString(),
            " ETB"
          ] })
        ] }),
        method === "cash" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
            QUICK_CASH.map((q) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setTendered(String(q + totals.total)),
                className: "rounded-xl border border-border/60 px-3 py-1.5 text-xs font-bold hover:border-primary/50",
                children: [
                  "+",
                  q.toLocaleString()
                ]
              },
              q
            )),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setTendered(String(totals.total)),
                className: "rounded-xl border border-primary bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20",
                children: "Exact"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "number",
              inputMode: "decimal",
              min: 0,
              value: tendered,
              placeholder: "Cash received",
              onChange: (e) => setTendered(e.target.value),
              autoFocus: true,
              className: "h-14 w-full rounded-2xl border border-input bg-background px-4 text-center text-2xl font-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: cn(
                "flex items-center justify-between rounded-2xl px-4 py-3",
                change >= 0 ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-600"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold uppercase tracking-widest", children: "Change" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-lg font-black", children: [
                  Math.abs(change).toLocaleString(),
                  " ETB"
                ] })
              ]
            }
          )
        ] }),
        method === "debt" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground", children: "Customer name *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: debtCustomerName,
                onChange: (e) => setDebtCustomerName(e.target.value),
                placeholder: "Enter customer name",
                autoFocus: true,
                className: "h-12 w-full rounded-2xl border-input bg-background px-4 text-base font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground", children: "Phone (optional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: debtCustomerPhone,
                onChange: (e) => setDebtCustomerPhone(e.target.value),
                placeholder: "Phone number",
                inputMode: "tel",
                className: "h-12 w-full rounded-2xl border-input bg-background px-4 text-base font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground", children: "Due date (optional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: debtDueDate, onChange: setDebtDueDate, className: "w-full" })
          ] })
        ] }),
        hasRole("cashier") && !shift && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "rounded-2xl bg-amber-500/10 px-4 py-3 text-center text-xs font-bold text-amber-600", children: "You have no open shift — sales won't be attributed to a shift." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: completeSale, disabled: !canPay || submitting, className: "h-13 w-full rounded-2xl py-4 text-base font-black", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mr-2 size-5" }),
          submitting ? "Processing…" : "Complete Sale"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SaleSuccessModal, { open: !!lastSale, onClose: () => setLastSale(null), sale: lastSale })
  ] });
}
export {
  CashierPOS as default
};
