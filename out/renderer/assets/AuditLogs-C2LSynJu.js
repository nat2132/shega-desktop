import { b as useSettings, r as reactExports, j as jsxRuntimeExports, ar as Shield, W as ShieldAlert, e as Button, R as RefreshCw, a9 as Search, V as Input, F as Filter, g as Badge, x as Eye, q as RotateCcw, _ as toast } from "./index-fMHJoXSU.js";
import { D as DatePicker } from "./DatePicker-B456wUn8.js";
import { S as ShieldCheck } from "./shield-check-NlOo1HX0.js";
import { U as Undo2 } from "./undo-2-cYDpQSD0.js";
import "./select-n7mzR4VO.js";
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
  if ((log.action === "soft_delete" || log.action === "archive") && (log.entityType === "item" || log.entityType === "customer")) return true;
  if (log.action === "restore_item" || log.action === "restore_customer" || log.action === "restore") return true;
  if ((log.action === "update" || log.action === "insert") && log.fieldName && log.oldValue !== null) return true;
  return false;
};
const reverseLabel = (log, t) => {
  if (log.action === "soft_delete" || log.action === "archive") return log.entityType === "item" ? t("audit_logs.restore_item") : t("audit_logs.restore_customer");
  if (log.action === "restore_item" || log.action === "restore" && log.entityType === "item") return t("audit_logs.redelete_item");
  if (log.action === "restore_customer" || log.action === "restore" && log.entityType === "customer") return t("audit_logs.redelete_customer");
  return t("audit_logs.undo_change");
};
const AuditLogs = () => {
  const { t, formatDateTime } = useSettings();
  const [logs, setLogs] = reactExports.useState([]);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [entityFilter, setEntityFilter] = reactExports.useState("");
  const [actionFilter, setActionFilter] = reactExports.useState("");
  const [fromDate, setFromDate] = reactExports.useState("");
  const [toDate, setToDate] = reactExports.useState("");
  const [reversingId, setReversingId] = reactExports.useState(null);
  const [chain, setChain] = reactExports.useState(null);
  const [checkingChain, setCheckingChain] = reactExports.useState(false);
  reactExports.useEffect(() => {
    loadLogs();
  }, []);
  const checkChain = async () => {
    setCheckingChain(true);
    try {
      const result = await window.api.verifyAuditChain();
      setChain(result);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingChain(false);
    }
  };
  reactExports.useEffect(() => {
    checkChain();
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
      toast.success(t("audit_logs.reverse_success"));
      loadLogs();
    } catch (err) {
      toast.error(err?.message || t("audit_logs.reverse_error"));
    } finally {
      setReversingId(null);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 18 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-black uppercase tracking-tight", children: t("audit_logs.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-bold uppercase", children: t("audit_logs.subtitle") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: chain && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-2xl border p-4 flex items-center gap-3 ${chain.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5"}`, children: [
      chain.ok ? /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 18, className: chain.ok ? "text-emerald-600" : "text-red-600" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { size: 18, className: "text-red-600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs font-black uppercase tracking-widest ${chain.ok ? "text-emerald-700" : "text-red-700"}`, children: chain.ok ? t("audit_logs.chain_ok") : t("audit_logs.chain_broken") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-semibold text-muted-foreground", children: [
          t("audit_logs.chain_count"),
          " ",
          chain.count,
          !chain.ok && chain.brokenAt && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            " · ",
            t("audit_logs.chain_broken_at"),
            " #",
            chain.brokenAt
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "h-8 text-xs font-black uppercase tracking-widest", onClick: checkChain, disabled: checkingChain, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 12, className: `mr-2 ${checkingChain ? "animate-spin" : ""}` }),
        " ",
        t("audit_logs.chain_check")
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
            className: "h-9 px-3 rounded-xl border bg-background text-xs font-bold",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("audit_logs.all_actions") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "void_sale", children: t("audit_logs.action_void_sale") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "reverse_payment", children: t("audit_logs.action_reverse_payment") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "reverse_adjustment", children: t("audit_logs.action_reverse_adjustment") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "restore", children: t("audit_logs.action_restore") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "soft_delete", children: t("audit_logs.action_soft_delete") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "delete", children: t("audit_logs.action_delete") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "update", children: t("audit_logs.action_update") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "insert", children: t("audit_logs.action_insert") })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: entityFilter,
            onChange: (e) => setEntityFilter(e.target.value),
            className: "h-9 px-3 rounded-xl border bg-background text-xs font-bold",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("audit_logs.all_entities") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "sale", children: t("audit_logs.entity_sale") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "item", children: t("audit_logs.entity_item") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "customer", children: t("audit_logs.entity_customer") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "supplier", children: t("audit_logs.entity_supplier") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "payment", children: t("audit_logs.entity_payment") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "adjustment", children: t("audit_logs.entity_adjustment") })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "h-9 text-xs font-black uppercase tracking-widest", onClick: loadLogs, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { size: 14, className: "mr-2" }),
          " ",
          t("audit_logs.filter")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "h-9 text-xs font-black uppercase tracking-widest", onClick: loadLogs, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, className: "mr-2" }),
          " ",
          t("audit_logs.refresh")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-16 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("audit_logs.from") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: fromDate, onChange: (e) => setFromDate(e), className: "h-9 text-xs rounded-xl w-36" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("audit_logs.to") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: toDate, onChange: (e) => setToDate(e), className: "h-9 text-xs rounded-xl w-36" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border bg-card/40 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "divide-y divide-border/20", children: [
      logs.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-16 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 36, className: "mx-auto mb-3 text-muted-foreground/30" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("audit_logs.no_logs") })
      ] }),
      logs.map((log, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 hover:bg-muted/10 transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 rounded-lg bg-muted/20 flex items-center justify-center shrink-0 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 14 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: actionVariants[log.action] || "outline", className: "text-xs font-black uppercase", children: log.action }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase", children: log.entityType || "-" }),
            log.entityId && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold text-muted-foreground", children: [
              "#",
              log.entityId
            ] }),
            log.reversedAt && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs font-black uppercase", children: t("audit_logs.reversed") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground ml-auto", children: log.createdAt ? formatDateTime(log.createdAt) : "" })
          ] }),
          log.fieldName ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-bold uppercase tracking-wide text-muted-foreground", children: log.fieldName }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "line-through text-destructive", children: log.oldValue || t("audit_logs.empty_value") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 12, className: "text-muted-foreground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-600 font-semibold", children: log.newValue || t("audit_logs.empty_value") })
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold mt-1.5 break-words", children: log.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1.5 mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground font-medium", children: [
            t("audit_logs.by"),
            " ",
            log.changedBy || t("common.unknown")
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start gap-1 shrink-0", children: canReverse(log) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            disabled: reversingId === log.id,
            onClick: () => handleReverse(log),
            className: "h-7 text-xs font-black uppercase tracking-widest rounded-lg border-amber-500/30 text-amber-600 hover:bg-amber-500/10",
            children: [
              reversingId === log.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 11, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Undo2, { size: 11, className: "mr-1" }),
              reverseLabel(log, t)
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
