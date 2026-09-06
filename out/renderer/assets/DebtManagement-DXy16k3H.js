import { b as useSettings, g as useAuth, r as reactExports, j as jsxRuntimeExports, a3 as Search, J as Input, v as Sheet, w as SheetTrigger, e as Button, F as Filter, i as Badge, x as SheetContent, y as SheetHeader, z as SheetTitle, A as SheetDescription, D as SheetFooter, G as SheetClose, a2 as React, b5 as DropdownMenu, b6 as DropdownMenuTrigger, b7 as DropdownMenuContent, b9 as DropdownMenuItem, T as TriangleAlert, M as Modal, X, Q as toast } from "./index-C0Jx5v6F.js";
import { S as SectionCards } from "./section-cards-BaMZJRZ5.js";
import { L as Label } from "./label-PBX5Yn39.js";
import { T as Textarea } from "./textarea-CY8EFjwR.js";
import { f as ChevronUp, C as ChevronDown, S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dx0ONkN1.js";
import { D as DatePicker } from "./DatePicker-Bu376zBZ.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-BqNqq2Wo.js";
import { c as computeTrend } from "./trend-utils-D_UP5BUt.js";
import { E as Ellipsis } from "./ellipsis-C2X7rkEe.js";
import { C as CircleDollarSign } from "./circle-dollar-sign-ABJ-BqPh.js";
import { H as History } from "./history-UnzZMKRL.js";
import { B as Banknote } from "./banknote-B-fp4-4X.js";
import { B as Ban } from "./ban-_WEbtLRm.js";
import "./card-CjgAuJMU.js";
import "./trending-up-Dh0JhE0R.js";
const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Mobile Money", "Check"];
function daysOverdue(dueDate) {
  const due = new Date(dueDate);
  const now = /* @__PURE__ */ new Date();
  const diff = now.getTime() - due.getTime();
  return Math.max(0, Math.floor(diff / (1e3 * 60 * 60 * 24)));
}
const DebtManagement = () => {
  const { t, formatDate } = useSettings();
  const { hasPermission } = useAuth();
  const [debts, setDebts] = reactExports.useState([]);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [selectedDebt, setSelectedDebt] = reactExports.useState(null);
  const [showPaymentModal, setShowPaymentModal] = reactExports.useState(false);
  const [paymentAmount, setPaymentAmount] = reactExports.useState("");
  const [paymentMethod, setPaymentMethod] = reactExports.useState("Cash");
  const [paymentNote, setPaymentNote] = reactExports.useState("");
  const [showLossDialog, setShowLossDialog] = reactExports.useState(false);
  const [lossTarget, setLossTarget] = reactExports.useState(null);
  const [expandedHistory, setExpandedHistory] = reactExports.useState(null);
  const [paymentHistories, setPaymentHistories] = reactExports.useState({});
  const [loadingHistory, setLoadingHistory] = reactExports.useState(null);
  const [isFilterOpen, setIsFilterOpen] = reactExports.useState(false);
  const [filterStartDate, setFilterStartDate] = reactExports.useState("");
  const [filterEndDate, setFilterEndDate] = reactExports.useState("");
  const [reversePaymentTarget, setReversePaymentTarget] = reactExports.useState(null);
  const [reversePaymentReason, setReversePaymentReason] = reactExports.useState("");
  const paymentMethodKeys = {
    Cash: "debt.payment_cash",
    "Bank Transfer": "debt.payment_bank_transfer",
    "Mobile Money": "debt.payment_mobile_money",
    Check: "debt.payment_check"
  };
  reactExports.useEffect(() => {
    loadDebts();
  }, []);
  const loadDebts = () => {
    window.api?.getSales({ paymentStatus: "Debt" }).then((data) => {
      setDebts(data || []);
    });
  };
  const openPaymentModal = (debt) => {
    setSelectedDebt(debt);
    setPaymentAmount(String(debt.totalPrice - debt.paidAmount));
    setPaymentMethod("Cash");
    setPaymentNote("");
    setShowPaymentModal(true);
  };
  const handlePayment = async (e) => {
    e.preventDefault();
    if (!selectedDebt || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      toast.error(t("debt.amount_positive"));
      return;
    }
    const result = await window.api?.payDebt(selectedDebt.id, amount);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t("debt.confirm_payment"));
    setShowPaymentModal(false);
    setSelectedDebt(null);
    setPaymentAmount("");
    loadDebts();
  };
  const openLossDialog = (debt) => {
    setLossTarget(debt);
    setShowLossDialog(true);
  };
  const handleMarkAsLoss = async () => {
    if (!lossTarget) return;
    const result = await window.api?.payDebt(lossTarget.id, lossTarget.totalPrice - lossTarget.paidAmount, { type: "loss", note: t("debt.marked_as_loss") });
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t("debt.mark_loss"));
    setShowLossDialog(false);
    setLossTarget(null);
    loadDebts();
  };
  const handleReverseDebtPayment = async () => {
    if (!reversePaymentTarget) return;
    try {
      await window.api.reverseDebtPayment({ paymentId: reversePaymentTarget.id, reason: reversePaymentReason });
      toast.success(t("debt.payment_reversed"));
      const saleId = reversePaymentTarget.saleId;
      setReversePaymentTarget(null);
      setReversePaymentReason("");
      if (expandedHistory) {
        const data = await window.api.getDebtPayments(saleId);
        setPaymentHistories((prev) => ({ ...prev, [saleId]: data || [] }));
      }
      loadDebts();
    } catch (error) {
      toast.error(t("debt.reverse_error"));
    }
  };
  const toggleHistory = async (debtId) => {
    if (expandedHistory === debtId) {
      setExpandedHistory(null);
      return;
    }
    setExpandedHistory(debtId);
    if (!paymentHistories[debtId]) {
      setLoadingHistory(debtId);
      const data = await window.api?.getDebtPayments(debtId);
      setPaymentHistories((prev) => ({ ...prev, [debtId]: data || [] }));
      setLoadingHistory(null);
    }
  };
  const filteredDebts = reactExports.useMemo(() => {
    let result = debts;
    const q = searchTerm.toLowerCase();
    if (q) {
      result = result.filter(
        (d) => d.customerName.toLowerCase().includes(q) || d.itemName.toLowerCase().includes(q) || d.customerPhone?.toLowerCase().includes(q)
      );
    }
    if (filterStartDate) {
      const start = new Date(filterStartDate);
      result = result.filter((d) => new Date(d.createdAt) >= start);
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((d) => new Date(d.createdAt) <= end);
    }
    return result;
  }, [debts, searchTerm, filterStartDate, filterEndDate]);
  const kpiCards = reactExports.useMemo(() => {
    const totalOutstanding = debts.reduce((sum, d) => sum + (d.totalPrice - d.paidAmount), 0);
    const totalCollected = debts.reduce((sum, d) => sum + d.paidAmount, 0);
    const activeDebtors = new Set(debts.filter((d) => d.totalPrice > d.paidAmount).map((d) => d.customerName)).size;
    const overdueAmt = debts.filter((d) => daysOverdue(d.dueDate) > 0).reduce((sum, d) => sum + (d.totalPrice - d.paidAmount), 0);
    const outTrend = computeTrend(debts, "createdAt", (d) => d.totalPrice - d.paidAmount);
    const colTrend = computeTrend(debts, "createdAt", (d) => d.paidAmount);
    const activeTrend = computeTrend(debts, "createdAt", (d) => d.totalPrice > d.paidAmount ? 1 : 0);
    const overdueTrend = computeTrend(debts, "createdAt", (d) => daysOverdue(d.dueDate) > 0 ? d.totalPrice - d.paidAmount : 0);
    return [
      {
        title: t("debt.total_outstanding"),
        value: `${t("common.etb")} ${totalOutstanding.toLocaleString()}`,
        ...outTrend,
        footerTitle: t("customers.credit_volume"),
        footerSub: t("customers.last_30")
      },
      {
        title: t("debt.total_collected"),
        value: `${t("common.etb")} ${totalCollected.toLocaleString()}`,
        ...colTrend,
        footerTitle: t("customers.recovery_rate"),
        footerSub: t("customers.high_efficiency")
      },
      {
        title: t("debt.active_debtors"),
        value: activeDebtors,
        ...activeTrend,
        footerTitle: t("customers.entity_count"),
        footerSub: t("customers.active_ledgers")
      },
      {
        title: t("debt.overdue_amount"),
        value: `${t("common.etb")} ${overdueAmt.toLocaleString(void 0, { maximumFractionDigits: 0 })}`,
        ...overdueTrend,
        footerTitle: t("customers.est_risk"),
        footerSub: t("customers.action_req")
      }
    ];
  }, [debts]);
  const getOverdueBadge = (dueDate) => {
    const overdue = daysOverdue(dueDate);
    if (overdue === 0) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-green-500/15 text-green-500 border-green-500/30", children: t("debt.on_track") });
    }
    if (overdue <= 7) {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30", children: [
        overdue,
        "d ",
        t("debt.overdue")
      ] });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-red-500/15 text-red-500 border-red-500/30", children: [
      overdue,
      "d ",
      t("debt.overdue")
    ] });
  };
  const hasActiveFilters = filterStartDate || filterEndDate;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tighter uppercase", children: t("debt.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("debt.subtitle") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCards, { cards: kpiCards }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1 max-w-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: `${t("common.search")}...`,
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className: "pl-9"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Sheet, { open: isFilterOpen, onOpenChange: setIsFilterOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: `h-8 px-3 transition-all ${hasActiveFilters ? "border-primary text-primary bg-primary/5 shadow-sm" : "border-border/60 hover:bg-muted/50"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { className: "mr-1.5 h-3.5 w-3.5" }),
            t("inventory.filters"),
            " ",
            hasActiveFilters && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "ml-1.5 h-4 px-1 text-xs rounded-full", children: t("inventory.active") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { side: "right", className: "w-[400px] sm:w-[540px] border-l-border/40 p-0 flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetHeader, { className: "border-b border-border/50 p-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { className: "text-2xl font-black uppercase tracking-tight", children: t("debt.filter_title") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SheetDescription, { className: "text-xs font-bold text-muted-foreground uppercase tracking-widest", children: t("inventory.refine_view") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-8 p-6 flex-1 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-primary", children: t("inventory.timeframe") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("inventory.start_date") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: filterStartDate, onChange: setFilterStartDate, className: "h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("inventory.end_date") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: filterEndDate, onChange: setFilterEndDate, className: "h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" })
                ] })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SheetFooter, { className: "p-6 border-t border-border/50 bg-background/80 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 w-full", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outline",
                  className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl",
                  onClick: () => {
                    setFilterStartDate("");
                    setFilterEndDate("");
                  },
                  children: t("inventory.reset_all")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SheetClose, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl", children: t("inventory.apply_filters") }) })
            ] }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded-[32px] overflow-hidden bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50 text-xs font-black uppercase tracking-widest", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-4", children: t("debt.customer") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-4", children: t("inventory.product") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-4 text-right", children: t("debt.amount") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-4 text-right", children: t("customers.paid") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-4 text-right", children: t("sales.outstanding") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-4", children: t("debt.due_date") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-4", children: t("debt.status") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-4 text-right", children: t("common.actions") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "text-sm", children: [
          filteredDebts.map((debt) => {
            const outstanding = debt.totalPrice - debt.paidAmount;
            const isSettled = outstanding === 0;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(React.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border/40 hover:bg-muted/20 transition-colors", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: debt.customerName }),
                  debt.customerPhone && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: debt.customerPhone })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4 font-medium", children: debt.itemName }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-4 text-right font-bold", children: [
                  t("common.etb"),
                  " ",
                  debt.totalPrice.toLocaleString()
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-4 text-right text-muted-foreground", children: [
                  t("common.etb"),
                  " ",
                  debt.paidAmount.toLocaleString()
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-4 text-right font-black text-destructive", children: [
                  t("common.etb"),
                  " ",
                  outstanding.toLocaleString()
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4 text-muted-foreground", children: formatDate(debt.dueDate) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4", children: isSettled ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-green-500/15 text-green-500 border-green-500/30", children: t("debt.settled") }) : getOverdueBadge(debt.dueDate) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { size: 16 }) }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", className: "min-w-[160px] rounded-xl", children: [
                    !isSettled && /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => openPaymentModal(debt), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleDollarSign, { size: 14, className: "mr-2" }),
                      t("debt.mark_paid")
                    ] }),
                    !isSettled && /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => openLossDialog(debt), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 14, className: "mr-2" }),
                      t("debt.mark_loss")
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => toggleHistory(debt.id), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(History, { size: 14, className: "mr-2" }),
                      t("debt.payment_history"),
                      expandedHistory === debt.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { size: 14, className: "ml-auto" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 14, className: "ml-auto" })
                    ] })
                  ] })
                ] }) }) })
              ] }),
              expandedHistory === debt.id && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-muted/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 8, className: "px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-background/50 p-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(History, { size: 12 }),
                  " ",
                  t("debt.payment_history")
                ] }),
                loadingHistory === debt.id ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("common.loading") }) : paymentHistories[debt.id] && paymentHistories[debt.id].length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: paymentHistories[debt.id].map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/20", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-full bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { size: 14, className: "text-primary" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-bold", children: [
                        t("common.etb"),
                        " ",
                        p.amount.toLocaleString()
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t(paymentMethodKeys[p.paymentMethod] || p.paymentMethod) })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: formatDate(p.createdAt) }),
                      p.note && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: p.note })
                    ] }),
                    !p.reversalId && hasPermission("payments.reverse") && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        variant: "ghost",
                        size: "sm",
                        className: "h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10",
                        onClick: () => {
                          setReversePaymentTarget(p);
                          setReversePaymentReason("");
                        },
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { size: 12 })
                      }
                    )
                  ] })
                ] }, p.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("common.no_data") })
              ] }) }) })
            ] }, debt.id);
          }),
          filteredDebts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 8, className: "px-5 py-12 text-center text-muted-foreground", children: t("common.no_data") }) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: showPaymentModal,
        onClose: () => setShowPaymentModal(false),
        title: t("debt.record_payment"),
        size: "sm",
        children: selectedDebt && /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handlePayment, className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl bg-muted/20 space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("debt.customer") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold", children: selectedDebt.customerName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: selectedDebt.itemName })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("debt.payment_amount") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                required: true,
                type: "number",
                min: 0,
                max: selectedDebt.totalPrice - selectedDebt.paidAmount,
                step: 0.01,
                value: paymentAmount,
                onChange: (e) => setPaymentAmount(e.target.value)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              t("common.max"),
              ": ",
              t("common.etb"),
              " ",
              (selectedDebt.totalPrice - selectedDebt.paidAmount).toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("debt.payment_method") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: paymentMethod, onValueChange: setPaymentMethod, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PAYMENT_METHODS.map((m) => {
                const methodKey = { Cash: "suppliers.payment_cash", "Bank Transfer": "suppliers.payment_bank", "Mobile Money": "suppliers.payment_mobile", Check: "suppliers.payment_check" };
                return /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: m, children: t(methodKey[m] || m) }, m);
              }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("debt.payment_note") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: paymentNote,
                onChange: (e) => setPaymentNote(e.target.value),
                placeholder: t("debt.payment_note_placeholder")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", className: "flex-1", onClick: () => setShowPaymentModal(false), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14, className: "mr-1" }),
              " ",
              t("common.cancel")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleDollarSign, { size: 14, className: "mr-1" }),
              " ",
              t("debt.confirm_payment")
            ] })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: reversePaymentTarget !== null, onOpenChange: (open) => {
      if (!open) {
        setReversePaymentTarget(null);
        setReversePaymentReason("");
      }
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("debt.reverse_payment") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: t("debt.reverse_payment_confirm", { amount: `${t("common.etb")} ${reversePaymentTarget?.amount.toLocaleString()}` }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("adjustments.reason_req") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            required: true,
            value: reversePaymentReason,
            onChange: (e) => setReversePaymentReason(e.target.value),
            className: "bg-background resize-none",
            placeholder: t("debt.reverse_reason_placeholder")
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          AlertDialogAction,
          {
            variant: "destructive",
            disabled: !reversePaymentReason,
            onClick: handleReverseDebtPayment,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { size: 14, className: "mr-1" }),
              " ",
              t("debt.reverse")
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: showLossDialog, onOpenChange: setShowLossDialog, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("debt.mark_as_loss_confirm") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
          t("debt.mark_as_loss_desc"),
          lossTarget && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "block mt-2 font-bold text-foreground", children: [
            lossTarget.customerName,
            " - ",
            t("common.etb"),
            " ",
            (lossTarget.totalPrice - lossTarget.paidAmount).toLocaleString()
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogAction, { variant: "destructive", onClick: handleMarkAsLoss, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 14, className: "mr-1" }),
          " ",
          t("debt.mark_loss")
        ] })
      ] })
    ] }) })
  ] });
};
export {
  DebtManagement as default
};
