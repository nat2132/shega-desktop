import { c as createLucideIcon, a8 as useParams, d as useNavigate, b as useSettings, o as useAuth, r as reactExports, t as toast, j as jsxRuntimeExports, e as Button, a9 as ArrowLeft, aa as Hash, g as Badge, n as Trash2, v as Receipt, ab as Separator, a5 as User, ac as CreditCard, s as ShoppingBag, _ as Dialog, $ as DialogContent, a1 as DialogHeader, a2 as DialogTitle, a3 as DialogDescription, Q as Input, a4 as DialogFooter, a0 as DialogClose, M as Modal } from "./index-DoaPTPLA.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent, d as CardDescription } from "./card-C2UHyBgb.js";
import { L as Label } from "./label-9m1zGceD.js";
import { A as AlertDialog, h as AlertDialogTrigger, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-CAXFI8Ai.js";
import { P as Printer } from "./printer-qXq9sdf4.js";
import { S as SquarePen } from "./square-pen-DZp7XN85.js";
import { U as Undo2 } from "./undo-2-CPiKksil.js";
import { B as Ban } from "./ban-Cdt72Xj1.js";
import { C as Calendar } from "./calendar-ksYuJE-Z.js";
import { P as Phone } from "./phone-sURmOwFy.js";
import { B as Banknote } from "./banknote-CMWRbi6B.js";
import { H as History } from "./history-BheiHo-w.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const BadgePercent = createLucideIcon("BadgePercent", [
  [
    "path",
    {
      d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",
      key: "3c2336"
    }
  ],
  ["path", { d: "m15 9-6 6", key: "1uzhvr" }],
  ["path", { d: "M9 9h.01", key: "1q5me6" }],
  ["path", { d: "M15 15h.01", key: "lqbp3k" }]
]);
const SaleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, formatDate } = useSettings();
  const { hasPermission } = useAuth();
  const [sale, setSale] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [paymentHistory, setPaymentHistory] = reactExports.useState([]);
  const [showEditDialog, setShowEditDialog] = reactExports.useState(false);
  const [editForm, setEditForm] = reactExports.useState({
    customerName: "",
    customerPhone: "",
    discount: 0,
    vat: 0,
    quantity: 0
  });
  const [showReturnModal, setShowReturnModal] = reactExports.useState(false);
  const [returnQty, setReturnQty] = reactExports.useState("");
  const [returnRefund, setReturnRefund] = reactExports.useState("");
  const [returnReason, setReturnReason] = reactExports.useState("");
  const [showDeleteDialog, setShowDeleteDialog] = reactExports.useState(false);
  const [deleting, setDeleting] = reactExports.useState(false);
  const [saving, setSaving] = reactExports.useState(false);
  const [voidReason, setVoidReason] = reactExports.useState("");
  reactExports.useEffect(() => {
    loadSale();
  }, [id]);
  const loadSale = async () => {
    setLoading(true);
    try {
      const saleData = await window.api?.getSale(Number(id));
      if (!saleData) {
        toast.error(t("sale_detail.not_found"));
        navigate("/sales");
        return;
      }
      setSale(saleData);
      setEditForm({
        customerName: saleData.customerName || "",
        customerPhone: saleData.customerPhone || "",
        discount: saleData.discount || 0,
        vat: saleData.vat || 0,
        quantity: saleData.quantity
      });
      if (saleData.paymentStatus === "Debt" || saleData.paymentStatus === t("sales.debt")) {
        const payments = await window.api?.getDebtPayments(saleData.id) || [];
        setPaymentHistory(payments);
      }
    } catch (err) {
      toast.error(t("sale_detail.load_error"));
      navigate("/sales");
    } finally {
      setLoading(false);
    }
  };
  const openReturn = () => {
    if (!sale) return;
    setReturnQty(String(sale.quantity));
    setReturnRefund("0");
    setReturnReason("");
    setShowReturnModal(true);
  };
  const handleReturn = async (e) => {
    e.preventDefault();
    if (!sale) return;
    const result = await window.api?.createReturn({
      saleId: sale.id,
      quantity: parseFloat(returnQty),
      refundAmount: parseFloat(returnRefund) || 0,
      reason: returnReason
    });
    if (result?.success) {
      toast.success(t("sale_detail.return_processed"));
      setShowReturnModal(false);
      loadSale();
    } else {
      toast.error(result?.error || t("sale_detail.return_failed"));
    }
  };
  const handleEdit = async () => {
    if (!sale) return;
    setSaving(true);
    try {
      const result = await window.api?.updateSale(sale.id, {
        customerName: editForm.customerName || null,
        customerPhone: editForm.customerPhone || null,
        discount: editForm.discount,
        vat: editForm.vat,
        quantity: editForm.quantity
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(t("sale_detail.updated"));
        setShowEditDialog(false);
        loadSale();
      }
    } catch {
      toast.error(t("sale_detail.update_error"));
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!sale) return;
    setDeleting(true);
    try {
      await window.api?.deleteSale(sale.id);
      toast.success(t("sale_detail.deleted"));
      navigate("/sales");
    } catch {
      toast.error(t("sale_detail.delete_error"));
      setDeleting(false);
    }
  };
  const handlePrint = () => {
    if (!sale) return;
    window.api?.printReceipt(sale);
  };
  const handleVoidSale = async () => {
    if (!sale || !voidReason.trim()) return;
    try {
      await window.api?.voidSale({ saleId: sale.id, reason: voidReason.trim() });
      toast.success(t("sale_detail.voided", { id: sale.id }));
      setVoidReason("");
      loadSale();
    } catch (err) {
      toast.error(err.message || t("sale_detail.void_error"));
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-[60vh]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" }) });
  }
  if (!sale) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-[60vh]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm font-bold uppercase tracking-widest", children: t("sale_detail.not_found") }) });
  }
  const isDebt = sale.paymentStatus === "Debt" || sale.paymentStatus === t("sales.debt");
  const outstanding = sale.totalPrice - sale.paidAmount;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 py-4 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => navigate("/sales"), className: "h-9 w-9 p-0 rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-black tracking-tighter uppercase flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Hash, { className: "h-5 w-5 text-muted-foreground" }),
              t("sales.sale"),
              " #",
              sale.id
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: isDebt ? "destructive" : "default", className: "uppercase text-[9px] font-bold tracking-widest", children: isDebt ? t("sales.debt") : t("sales.paid") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5 font-medium", children: [
            t("reports.date"),
            ": ",
            formatDate(sale.createdAt)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: handlePrint, className: "h-9 text-[10px] font-black uppercase tracking-widest rounded-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "h-3.5 w-3.5 mr-1.5" }),
          " ",
          t("common.print")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setShowEditDialog(true), className: "h-9 text-[10px] font-black uppercase tracking-widest rounded-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "h-3.5 w-3.5 mr-1.5" }),
          " ",
          t("common.edit")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: openReturn, className: "h-9 text-[10px] font-black uppercase tracking-widest rounded-xl text-amber-500 border-amber-500/30 hover:bg-amber-500/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Undo2, { className: "h-3.5 w-3.5 mr-1.5" }),
          " ",
          t("common.return")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setShowDeleteDialog(true), className: "h-9 text-[10px] font-black uppercase tracking-widest rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 mr-1.5" }),
          " ",
          t("common.delete")
        ] }),
        hasPermission("sales.void") && sale && sale.status !== "Voided" && /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "destructive", size: "sm", className: "h-8 text-[10px] font-black uppercase tracking-widest", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { size: 14, className: "mr-2" }),
            " ",
            t("sale_detail.void_sale")
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("sale_detail.void_title", { id: sale.id }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: t("sale_detail.void_description") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block", children: t("sale_detail.void_reason_label") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  className: "w-full h-24 px-3 py-2 rounded-xl border bg-background text-xs resize-none",
                  placeholder: t("sale_detail.void_reason_placeholder"),
                  value: voidReason,
                  onChange: (e) => setVoidReason(e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: t("common.cancel") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                AlertDialogAction,
                {
                  disabled: !voidReason.trim(),
                  onClick: handleVoidSale,
                  className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                  children: t("sale_detail.confirm_void")
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6 grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-[32px] border-border/60 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border/40 pb-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "h-3.5 w-3.5" }),
          " ",
          t("sales.transaction_info")
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-5 space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-4 w-4 text-muted-foreground" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("reports.date") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold", children: formatDate(sale.createdAt) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, { className: "bg-border/40" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-4 w-4 text-muted-foreground" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("sales.customer") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold", children: sale.customerName || t("sales.walk_in") }),
              sale.customerPhone && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-3 w-3" }),
                " ",
                sale.customerPhone
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, { className: "bg-border/40" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-4 w-4 text-muted-foreground" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("sales.payment_method") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold", children: sale.paymentMethod })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, { className: "bg-border/40" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BadgePercent, { className: "h-4 w-4 text-muted-foreground" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("sales.payment_status") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: isDebt ? "destructive" : "default", className: "uppercase text-[9px] font-bold tracking-widest", children: isDebt ? t("sales.debt") : t("sales.paid") })
            ] })
          ] }),
          isDebt && sale.dueDate && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, { className: "bg-border/40" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-4 w-4 text-muted-foreground" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("sales.due_date") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-destructive", children: formatDate(sale.dueDate) })
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-[32px] border-border/60 shadow-sm lg:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border/40 pb-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { className: "h-3.5 w-3.5" }),
          " ",
          t("sales.item_details")
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-border/50 bg-muted/10 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-[10px] font-black uppercase tracking-widest", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3.5", children: t("inventory.product") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3.5 text-right", children: t("inventory.quantity") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3.5 text-right", children: t("inventory.unit") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3.5 text-right", children: t("sales.unit_price") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3.5 text-right", children: t("common.total") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 rounded-lg bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { className: "h-4 w-4 text-muted-foreground" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-sm", children: sale.itemName })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4 text-right font-bold", children: sale.quantity }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4 text-right text-muted-foreground text-sm", children: sale.unit }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-4 text-right text-muted-foreground text-sm", children: [
              t("common.etb"),
              " ",
              (sale.totalPrice / sale.quantity).toFixed(2)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-4 text-right font-black", children: [
              t("common.etb"),
              " ",
              sale.totalPrice.toLocaleString()
            ] })
          ] }) })
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-[32px] border-border/60 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border/40 pb-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { className: "h-3.5 w-3.5" }),
        " ",
        t("sales.financial_summary")
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-2xl bg-muted/20 border border-border/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1", children: t("sales.subtotal") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-black", children: [
              t("common.etb"),
              " ",
              (sale.totalPrice + sale.discount - sale.vat).toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-2xl bg-muted/20 border border-border/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1", children: t("sales.discount") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-black text-destructive", children: [
              "-",
              t("common.etb"),
              " ",
              sale.discount.toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-2xl bg-muted/20 border border-border/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1", children: t("sales.vat") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-black text-amber-500", children: [
              t("common.etb"),
              " ",
              sale.vat.toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-2xl bg-primary/10 border border-primary/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-primary mb-1", children: t("sales.total_price") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xl font-black text-primary", children: [
              t("common.etb"),
              " ",
              sale.totalPrice.toLocaleString()
            ] })
          ] }),
          isDebt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-2xl bg-destructive/10 border border-destructive/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-destructive mb-1", children: t("sales.due_amount") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xl font-black text-destructive", children: [
              t("common.etb"),
              " ",
              outstanding.toLocaleString()
            ] })
          ] }),
          !isDebt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-2xl bg-green-500/10 border border-green-500/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-green-500 mb-1", children: t("sales.paid_amount") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xl font-black text-green-500", children: [
              t("common.etb"),
              " ",
              sale.paidAmount.toLocaleString()
            ] })
          ] })
        ] }),
        isDebt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-green-500 mb-1", children: t("sales.paid_amount") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-black text-green-500", children: [
            t("common.etb"),
            " ",
            sale.paidAmount.toLocaleString()
          ] })
        ] })
      ] })
    ] }) }),
    isDebt && paymentHistory.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-[32px] border-border/60 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "border-b border-border/40 pb-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "h-3.5 w-3.5" }),
          " ",
          t("sales.payment_history")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { className: "text-[10px] font-bold text-muted-foreground uppercase tracking-widest", children: [
          paymentHistory.length,
          " ",
          t("customers.transactions")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-border/50 bg-muted/10 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-[10px] font-black uppercase tracking-widest", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3.5", children: t("reports.date") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3.5 text-right", children: t("debt.amount") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3.5", children: t("debt.payment_method") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3.5", children: t("debt.payment_note") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: paymentHistory.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border/40 hover:bg-muted/20 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: formatDate(p.createdAt) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-3.5 text-right font-bold text-green-500", children: [
            t("common.etb"),
            " ",
            p.amount.toLocaleString()
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 text-sm text-muted-foreground", children: p.paymentMethod }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 text-sm text-muted-foreground", children: p.note || "-" })
        ] }, p.id)) })
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showEditDialog, onOpenChange: setShowEditDialog, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "bg-background rounded-[32px] border-border shadow-2xl sm:max-w-xl p-0 gap-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { className: "p-6 border-b border-border/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-xl font-black uppercase tracking-tight", children: t("sales.modify_transaction") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { className: "text-[10px] font-bold text-muted-foreground uppercase tracking-widest", children: [
          t("inventory.product"),
          ": ",
          sale.itemName
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 space-y-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("sales.customer_name") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: editForm.customerName,
                onChange: (e) => setEditForm((f) => ({ ...f, customerName: e.target.value })),
                className: "h-10 rounded-xl bg-muted/20 border-border/50",
                placeholder: t("sales.walk_in")
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("sales.phone_number") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: editForm.customerPhone,
                onChange: (e) => setEditForm((f) => ({ ...f, customerPhone: e.target.value })),
                className: "h-10 rounded-xl bg-muted/20 border-border/50"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("inventory.quantity") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                min: "1",
                value: editForm.quantity,
                onChange: (e) => setEditForm((f) => ({ ...f, quantity: parseFloat(e.target.value) || 0 })),
                className: "h-10 rounded-xl bg-muted/20 border-border/50 font-bold"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: [
              t("sales.discount"),
              " (",
              t("common.etb"),
              ")"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                min: "0",
                value: editForm.discount,
                onChange: (e) => setEditForm((f) => ({ ...f, discount: parseFloat(e.target.value) || 0 })),
                className: "h-10 rounded-xl bg-muted/20 border-border/50 font-bold"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: [
              t("sales.vat"),
              " (",
              t("common.etb"),
              ")"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                min: "0",
                value: editForm.vat,
                onChange: (e) => setEditForm((f) => ({ ...f, vat: parseFloat(e.target.value) || 0 })),
                className: "h-10 rounded-xl bg-muted/20 border-border/50 font-bold"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "p-6 border-t border-border/50 flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogClose, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "rounded-xl h-11 text-[10px] font-black uppercase tracking-widest flex-1", children: t("common.cancel") }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleEdit, disabled: saving || editForm.quantity < 1, className: "rounded-xl h-11 text-[10px] font-black uppercase tracking-widest flex-1 shadow-lg", children: saving ? t("common.saving") : t("common.confirm") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showReturnModal, onClose: () => setShowReturnModal(false), title: t("common.return"), size: "sm", children: sale && /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleReturn, className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-muted/30 text-sm space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold", children: sale.itemName }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          t("sales.sale"),
          " #",
          sale.id,
          " · ",
          sale.customerName || t("sales.walk_in")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs", children: [
          t("inventory.quantity"),
          ": ",
          sale.quantity,
          " · ",
          t("common.total"),
          ": ",
          t("common.etb"),
          " ",
          sale.totalPrice.toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: [
          t("sales.return_qty"),
          " *"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            required: true,
            type: "number",
            min: "1",
            max: sale.quantity,
            value: returnQty,
            onChange: (e) => setReturnQty(e.target.value),
            className: "h-10 rounded-xl bg-muted/20 border-border/50"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: [
          t("sales.refund_amount"),
          " (",
          t("common.etb"),
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "number",
            min: "0",
            value: returnRefund,
            onChange: (e) => setReturnRefund(e.target.value),
            className: "h-10 rounded-xl bg-muted/20 border-border/50"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground", children: t("sales.refund_hint") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("sales.return_reason") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: returnReason,
            onChange: (e) => setReturnReason(e.target.value),
            placeholder: t("sales.return_reason_placeholder"),
            className: "h-10 rounded-xl bg-muted/20 border-border/50"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", className: "flex-1 rounded-xl h-11 text-[10px] font-black uppercase tracking-widest", onClick: () => setShowReturnModal(false), children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "flex-1 rounded-xl h-11 text-[10px] font-black uppercase tracking-widest shadow-lg", disabled: !returnQty || parseFloat(returnQty) < 1, children: t("common.process") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: showDeleteDialog, onOpenChange: setShowDeleteDialog, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { className: "rounded-[32px] bg-background border-border shadow-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { className: "text-xl font-black uppercase tracking-tight", children: t("sales.revoke_title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { className: "text-xs font-medium text-muted-foreground leading-relaxed", children: [
          t("sales.revoke_desc"),
          sale && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "block mt-2 font-bold text-foreground", children: [
            t("inventory.product"),
            ": ",
            sale.itemName,
            " · ",
            t("common.etb"),
            " ",
            sale.totalPrice.toLocaleString()
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { className: "gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { className: "rounded-xl border-border h-11 text-[10px] font-black uppercase tracking-widest", children: t("common.abort") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AlertDialogAction,
          {
            onClick: handleDelete,
            disabled: deleting,
            className: "rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-[10px] font-black uppercase tracking-widest",
            children: deleting ? t("common.deleting") : t("common.confirm")
          }
        )
      ] })
    ] }) })
  ] });
};
export {
  SaleDetail as default
};
