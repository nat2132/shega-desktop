import { c as createLucideIcon, b as useSettings, r as reactExports, j as jsxRuntimeExports, a5 as History, a1 as Search, K as Input, e as Button, F as Filter, R as RefreshCw, q as Truck, aJ as Warehouse, aK as SlidersHorizontal, s as Receipt, N as ShoppingCart, P as Package, g as Badge, $ as User } from "./index-1f1mrYRP.js";
import { D as DatePicker } from "./DatePicker-C65BnIqD.js";
import "./select-Dv9k0wjk.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Tags = createLucideIcon("Tags", [
  ["path", { d: "m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19", key: "1cbfv1" }],
  [
    "path",
    {
      d: "M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z",
      key: "135mg7"
    }
  ],
  ["circle", { cx: "6.5", cy: "9.5", r: ".5", fill: "currentColor", key: "5pm5xn" }]
]);
const ACTION_TYPES = ["insert", "update", "delete"];
const ENTITY_TYPES = ["item", "category", "sale", "expense", "adjustment", "inventory", "transfer"];
const entityIcons = {
  item: Package,
  category: Tags,
  sale: ShoppingCart,
  expense: Receipt,
  adjustment: SlidersHorizontal,
  inventory: Warehouse,
  transfer: Truck
};
const ActionBadge = ({ action }) => {
  const variants = {
    insert: "default",
    update: "secondary",
    delete: "destructive"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: variants[action] || "outline", className: "text-[8px] font-black uppercase", children: action });
};
const ActivityLogs = () => {
  const { t, formatDate, formatTime, formatDateTime } = useSettings();
  const [logs, setLogs] = reactExports.useState([]);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [actionFilter, setActionFilter] = reactExports.useState("");
  const [entityFilter, setEntityFilter] = reactExports.useState("");
  const [fromDate, setFromDate] = reactExports.useState("");
  const [toDate, setToDate] = reactExports.useState("");
  reactExports.useEffect(() => {
    loadLogs();
  }, []);
  const loadLogs = async () => {
    try {
      const opts = { limit: 500 };
      if (actionFilter) opts.action = actionFilter;
      if (entityFilter) opts.entityType = entityFilter;
      if (fromDate) opts.fromDate = fromDate;
      if (toDate) opts.toDate = toDate;
      const data = await window.api.getActivityLogs(opts) || [];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        setLogs(data.filter(
          (l) => (l.details || "").toLowerCase().includes(q) || (l.firstName || "").toLowerCase().includes(q) || (l.lastName || "").toLowerCase().includes(q) || (l.entityType || "").toLowerCase().includes(q) || (l.action || "").toLowerCase().includes(q)
        ));
      } else {
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const formatDetails = (log) => {
    const txt = log.details || "";
    const idx = txt.indexOf(" — by ");
    if (idx !== -1) return txt.substring(0, idx);
    return txt;
  };
  const getActor = (log) => {
    const txt = log.details || "";
    const idx = txt.indexOf(" — by ");
    if (idx !== -1) return txt.substring(idx + 6);
    if (log.firstName) return `${log.firstName} ${log.lastName}`;
    return "unknown";
  };
  const entityColors = {
    item: "text-blue-500",
    category: "text-purple-500",
    sale: "text-green-500",
    expense: "text-orange-500",
    adjustment: "text-yellow-500",
    inventory: "text-cyan-500",
    transfer: "text-indigo-500"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(History, { size: 18 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-black uppercase tracking-tight", children: t("activity_logs.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-muted-foreground font-bold uppercase", children: t("activity_logs.subtitle") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1 max-w-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: t("activity_logs.search"),
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "h-9 pl-9 text-xs rounded-xl"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: actionFilter,
            onChange: (e) => setActionFilter(e.target.value),
            className: "h-9 px-3 rounded-xl border bg-background text-[10px] font-bold",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("activity_logs.all_actions") }),
              ACTION_TYPES.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: a, children: a }, a))
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: entityFilter,
            onChange: (e) => setEntityFilter(e.target.value),
            className: "h-9 px-3 rounded-xl border bg-background text-[10px] font-bold",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("activity_logs.all_entities") }),
              ENTITY_TYPES.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: e, children: e }, e))
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "h-9 text-[10px] font-black uppercase tracking-widest", onClick: loadLogs, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { size: 14, className: "mr-2" }),
          " ",
          t("activity_logs.filter")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "h-9 text-[10px] font-black uppercase tracking-widest", onClick: loadLogs, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, className: "mr-2" }),
          " ",
          t("activity_logs.refresh")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-16 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[8px] font-black uppercase tracking-widest text-muted-foreground", children: t("activity_logs.from") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: fromDate, onChange: (e) => setFromDate(e), className: "h-9 text-[10px] rounded-xl w-36" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[8px] font-black uppercase tracking-widest text-muted-foreground", children: t("activity_logs.to") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: toDate, onChange: (e) => setToDate(e), className: "h-9 text-[10px] rounded-xl w-36" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border bg-card/40 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "divide-y divide-border/20", children: [
      logs.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-16 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(History, { size: 36, className: "mx-auto mb-3 text-muted-foreground/30" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("activity_logs.no_logs") })
      ] }),
      logs.map((log, i) => {
        const EntityIcon = entityIcons[log.entityType] || History;
        const colorClass = entityColors[log.entityType] || "text-muted-foreground";
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 hover:bg-muted/10 transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-8 w-8 rounded-lg bg-muted/20 flex items-center justify-center shrink-0 ${colorClass}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(EntityIcon, { size: 14 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBadge, { action: log.action }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[8px] font-black uppercase", children: log.entityType || "-" }),
              log.entityId && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[9px] font-bold text-muted-foreground", children: [
                "#",
                log.entityId
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground ml-auto", children: formatDateTime(log.createdAt) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold mt-1.5 break-words", children: formatDetails(log) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 mt-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(User, { size: 10, className: "text-muted-foreground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground font-medium", children: getActor(log) })
            ] })
          ] })
        ] }) }, log.id || i);
      })
    ] }) }) })
  ] });
};
export {
  ActivityLogs as default
};
