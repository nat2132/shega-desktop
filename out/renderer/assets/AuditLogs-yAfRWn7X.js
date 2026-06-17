import { b as useSettings, r as reactExports, j as jsxRuntimeExports, ag as Shield, a1 as Search, K as Input, e as Button, F as Filter, R as RefreshCw, g as Badge, w as Eye, t as toast } from "./index-BzfzhNvZ.js";
import { D as DatePicker } from "./DatePicker-CnRj8BWX.js";
import { R as RotateCcw } from "./rotate-ccw-ChGNMEtv.js";
import { U as Undo2 } from "./undo-2-C3JTJWff.js";
import "./select-CSULIuhp.js";
const actionVariants = {
  void_sale: "default",
  reverse_payment: "default",
  reverse_adjustment: "default",
  restore: "default",
  soft_delete: "secondary",
  delete: "destructive"
};
const canReverse = (log) => {
  if (log.reversedAt) return false;
  if (log.action === "soft_delete" && (log.entityType === "item" || log.entityType === "customer")) return true;
  if (log.action === "restore_item" || log.action === "restore_customer") return true;
  if ((log.action === "update" || log.action === "insert") && log.fieldName && log.oldValue !== null) return true;
  return false;
};
const reverseLabel = (log) => {
  if (log.action === "soft_delete") return log.entityType === "item" ? "Restore Item" : "Restore Customer";
  if (log.action === "restore_item") return "Re-delete Item";
  if (log.action === "restore_customer") return "Re-delete Customer";
  return "Undo Change";
};
const AuditLogs = () => {
  const { t, formatDate, formatTime, formatDateTime } = useSettings();
  const [logs, setLogs] = reactExports.useState([]);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [entityFilter, setEntityFilter] = reactExports.useState("");
  const [actionFilter, setActionFilter] = reactExports.useState("");
  const [fromDate, setFromDate] = reactExports.useState("");
  const [toDate, setToDate] = reactExports.useState("");
  const [reversingId, setReversingId] = reactExports.useState(null);
  reactExports.useEffect(() => {
    loadLogs();
  }, []);
  const loadLogs = async () => {
    try {
      const opts = { limit: 500 };
      if (entityFilter) opts.entityType = entityFilter;
      if (actionFilter) opts.action = actionFilter;
      if (fromDate) opts.fromDate = fromDate;
      if (toDate) opts.toDate = toDate;
      const data = await window.api.getAuditLogs(opts) || [];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        setLogs(data.filter(
          (l) => (l.description || "").toLowerCase().includes(q) || (l.changedBy || "").toLowerCase().includes(q) || (l.entityType || "").toLowerCase().includes(q) || (l.fieldName || "").toLowerCase().includes(q)
        ));
      } else {
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleReverse = async (log) => {
    setReversingId(log.id);
    try {
      await window.api.reverseAuditLogEntry({ logId: log.id });
      toast.success("Change reversed successfully");
      loadLogs();
    } catch (err) {
      toast.error(err?.message || "Failed to reverse");
    } finally {
      setReversingId(null);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 18 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-black uppercase tracking-tight", children: t("audit_logs.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-muted-foreground font-bold uppercase", children: t("audit_logs.subtitle") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1 max-w-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: t("audit_logs.search"),
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
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("audit_logs.all_actions") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "void_sale", children: "Void Sale" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "reverse_payment", children: "Reverse Payment" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "reverse_adjustment", children: "Reverse Adjustment" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "restore", children: "Restore" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "soft_delete", children: "Soft Delete" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "delete", children: "Delete" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "update", children: "Update" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "insert", children: "Insert" })
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
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("audit_logs.all_entities") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "sale", children: "Sale" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "item", children: "Item" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "customer", children: "Customer" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "supplier", children: "Supplier" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "payment", children: "Payment" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "adjustment", children: "Adjustment" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "h-9 text-[10px] font-black uppercase tracking-widest", onClick: loadLogs, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { size: 14, className: "mr-2" }),
          " ",
          t("audit_logs.filter")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "h-9 text-[10px] font-black uppercase tracking-widest", onClick: loadLogs, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, className: "mr-2" }),
          " ",
          t("audit_logs.refresh")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-16 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[8px] font-black uppercase tracking-widest text-muted-foreground", children: t("audit_logs.from") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: fromDate, onChange: (e) => setFromDate(e), className: "h-9 text-[10px] rounded-xl w-36" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[8px] font-black uppercase tracking-widest text-muted-foreground", children: t("audit_logs.to") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: toDate, onChange: (e) => setToDate(e), className: "h-9 text-[10px] rounded-xl w-36" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border bg-card/40 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "divide-y divide-border/20", children: [
      logs.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-16 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 36, className: "mx-auto mb-3 text-muted-foreground/30" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("audit_logs.no_logs") })
      ] }),
      logs.map((log, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 hover:bg-muted/10 transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 rounded-lg bg-muted/20 flex items-center justify-center shrink-0 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 14 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: actionVariants[log.action] || "outline", className: "text-[8px] font-black uppercase", children: log.action }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[8px] font-black uppercase", children: log.entityType || "-" }),
            log.entityId && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[9px] font-bold text-muted-foreground", children: [
              "#",
              log.entityId
            ] }),
            log.reversedAt && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-[8px] font-black uppercase", children: "Reversed" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground ml-auto", children: log.createdAt ? formatDateTime(log.createdAt) : "" })
          ] }),
          log.fieldName ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-bold uppercase tracking-wide text-muted-foreground", children: log.fieldName }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "line-through text-destructive", children: log.oldValue || "(empty)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 12, className: "text-muted-foreground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-600 font-semibold", children: log.newValue || "(empty)" })
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold mt-1.5 break-words", children: log.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1.5 mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[9px] text-muted-foreground font-medium", children: [
            t("audit_logs.by"),
            " ",
            log.changedBy || "unknown"
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start gap-1 shrink-0", children: canReverse(log) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            disabled: reversingId === log.id,
            onClick: () => handleReverse(log),
            className: "h-7 text-[8px] font-black uppercase tracking-widest rounded-lg border-amber-500/30 text-amber-600 hover:bg-amber-500/10",
            children: [
              reversingId === log.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 11, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Undo2, { size: 11, className: "mr-1" }),
              reverseLabel(log)
            ]
          }
        ) })
      ] }) }, log.id || i))
    ] }) }) })
  ] });
};
export {
  AuditLogs as default
};
