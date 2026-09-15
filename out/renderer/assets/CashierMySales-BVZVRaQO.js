import { c as createLucideIcon, O as useAuth, r as reactExports, j as jsxRuntimeExports, am as Receipt, N as cn } from "./index-wvHtiMql.js";
import { u as useCashier } from "./CashierContext-qCHEWQh3.js";
import { T as TrendingUp } from "./trending-up-B1IsTNPA.js";
import { C as CalendarRange } from "./calendar-range-qJ41Q2Qh.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const PackageCheck = createLucideIcon("PackageCheck", [
  ["path", { d: "m16 16 2 2 4-4", key: "gfu2re" }],
  [
    "path",
    {
      d: "M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14",
      key: "e7tb2h"
    }
  ],
  ["path", { d: "m7.5 4.27 9 5.15", key: "1c824w" }],
  ["polyline", { points: "3.29 7 12 12 20.71 7", key: "ousv84" }],
  ["line", { x1: "12", x2: "12", y1: "22", y2: "12", key: "a4e8g8" }]
]);
const RANGES = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "all", label: "All time" }
];
function CashierMySales() {
  const { currentAdmin } = useAuth();
  const { refreshShift } = useCashier();
  const [rangeId, setRangeId] = reactExports.useState("today");
  const [rows, setRows] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const range = reactExports.useMemo(() => {
    const now = /* @__PURE__ */ new Date();
    const start = new Date(now);
    if (rangeId === "today") start.setHours(0, 0, 0, 0);
    else if (rangeId === "yesterday") start.setDate(now.getDate() - 1), start.setHours(0, 0, 0, 0);
    else if (rangeId === "7d") start.setDate(now.getDate() - 7);
    else if (rangeId === "30d") start.setDate(now.getDate() - 30);
    return {
      start: start.toISOString(),
      end: (/* @__PURE__ */ new Date()).toISOString(),
      allTime: rangeId === "all"
    };
  }, [rangeId]);
  reactExports.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await window.api?.getSales({
          createdBy: currentAdmin?.name,
          ...range.allTime ? {} : { startDate: range.start, endDate: range.end }
        });
        setRows(data || []);
      } catch (e) {
        console.error("Failed to load my sales", e);
        setRows([]);
      } finally {
        setLoading(false);
      }
      await refreshShift();
    })();
  }, [currentAdmin?.name, range, refreshShift]);
  const summary = reactExports.useMemo(() => {
    const total = rows.reduce((s, r) => s + (r.totalPrice || 0), 0);
    const qty = rows.reduce((s, r) => s + (r.quantity || 0), 0);
    const cash = rows.filter((r) => r.paymentMethod === "cash").reduce((s, r) => s + (r.totalPrice || 0), 0);
    return { total, qty, cash };
  }, [rows]);
  const grouped = reactExports.useMemo(() => {
    const buckets = /* @__PURE__ */ new Map();
    for (const r of rows) {
      const d = new Date(r.createdAt);
      const day = d.toDateString();
      if (!buckets.has(day)) buckets.set(day, /* @__PURE__ */ new Map());
      const saleKey = Math.floor(d.getTime() / 5e3);
      const dayMap = buckets.get(day);
      if (!dayMap.has(saleKey)) dayMap.set(saleKey, []);
      dayMap.get(saleKey).push(r);
    }
    const out = [];
    for (const [day, dayMap] of buckets) {
      const sales = [...dayMap.entries()].map(([key, saleRows]) => ({
        time: new Date(key * 5e3).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        rows: saleRows.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
        total: saleRows.reduce((s, r) => s + (r.totalPrice || 0), 0),
        items: saleRows.reduce((s, r) => s + (r.quantity || 0), 0)
      })).sort((a, b) => a.time < b.time ? 1 : -1);
      out.push({ day, sales });
    }
    return out.sort((a, b) => new Date(a.day) < new Date(b.day) ? 1 : -1);
  }, [rows]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-h-0 flex-col bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 border-b border-border/60 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "size-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-sm font-black uppercase tracking-widest", children: "My Sales" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary", children: rows.length })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1.5 overflow-x-auto", children: RANGES.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setRangeId(r.id),
          className: cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors",
            rangeId === r.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
          ),
          children: r.label
        },
        r.id
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3 border-b border-border/60 bg-card px-4 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-muted/30 px-4 py-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs font-bold text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "size-3.5" }),
          " Revenue"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-lg font-black tracking-tight", children: [
          summary.total.toLocaleString(),
          " ETB"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-muted/30 px-4 py-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs font-bold text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(PackageCheck, { className: "size-3.5" }),
          " Items"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-lg font-black tracking-tight", children: summary.qty })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-muted/30 px-4 py-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs font-bold text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarRange, { className: "size-3.5" }),
          " Cash"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-lg font-black tracking-tight", children: [
          summary.cash.toLocaleString(),
          " ETB"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-y-auto p-4", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" }) }) : grouped.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full flex-col items-center justify-center gap-3 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "size-12 opacity-30" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "No sales in this period" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-3xl space-y-6", children: grouped.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground", children: new Date(b.day).toLocaleDateString(void 0, { weekday: "short", month: "short", day: "numeric" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: b.sales.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border/60 bg-card p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-bold text-muted-foreground", children: s.time }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary", children: [
              s.items,
              " item",
              s.items > 1 ? "s" : ""
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-black", children: [
            s.total.toLocaleString(),
            " ETB"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex flex-wrap gap-1.5", children: s.rows.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-xs font-medium", children: [
          r.itemImage ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: r.itemImage, alt: "", className: "h-4 w-4 rounded object-cover" }) : null,
          r.itemName || `#${r.itemId}`,
          " × ",
          r.quantity,
          r.paymentMethod === "cash" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ms-1 text-muted-foreground", children: [
            "($",
            r.paymentMethod,
            ")"
          ] })
        ] }, i)) })
      ] }, s.time)) })
    ] }, b.day)) }) })
  ] });
}
export {
  CashierMySales as default
};
