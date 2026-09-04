import { aa as useParams, d as useNavigate, b as useSettings, n as useAuth, r as reactExports, _ as toast, j as jsxRuntimeExports, T as TriangleAlert, e as Button, ab as ArrowLeft, ae as CreditCard, P as PiggyBank, m as Package, Q as FileText, a7 as User, h as Clock, M as Modal, g as Badge, s as ShoppingBag } from "./index-D0em7kRt.js";
import { L as Label } from "./label-BY5hKnMF.js";
import { T as Textarea } from "./textarea-DCtXuZEG.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-D9ZBWN4s.js";
import { D as DatePicker } from "./DatePicker-Cwt8y7qq.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-CXuVPKuV.js";
import { B as Ban } from "./ban-CpRWeY5L.js";
import { H as History } from "./history-PR-LuE8w.js";
import { P as Phone } from "./phone-B2Zw7qXS.js";
import { C as CircleCheckBig } from "./circle-check-big-Dl2I80yP.js";
const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, formatDateTime } = useSettings();
  const { hasPermission } = useAuth();
  const [order, setOrder] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [showConvertSale, setShowConvertSale] = reactExports.useState(false);
  const [salePaymentMethod, setSalePaymentMethod] = reactExports.useState("Cash");
  const [showConvertDebt, setShowConvertDebt] = reactExports.useState(false);
  const [debtDueDate, setDebtDueDate] = reactExports.useState("");
  const [showCancelDialog, setShowCancelDialog] = reactExports.useState(false);
  const [cancelReason, setCancelReason] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (id) loadOrder(Number(id));
  }, [id]);
  const loadOrder = async (orderId) => {
    setLoading(true);
    try {
      const data = await window.api?.getOrder(orderId);
      setOrder(data);
    } catch (err) {
      toast.error(t("orders.load_error", "Failed to load order"));
    } finally {
      setLoading(false);
    }
  };
  const handleConvertToSale = async () => {
    if (!order) return;
    try {
      const result = await window.api?.convertOrderToSale({
        orderId: order.id,
        paymentMethod: salePaymentMethod
      });
      if (result?.success) {
        toast.success(t("orders.converted_to_sale"));
        setShowConvertSale(false);
        loadOrder(order.id);
      }
    } catch (err) {
      toast.error(err.message || t("orders.convert_error"));
    }
  };
  const handleConvertToDebt = async () => {
    if (!order) return;
    try {
      const result = await window.api?.convertOrderToDebt({
        orderId: order.id,
        dueDate: debtDueDate || void 0,
        paymentMethod: "Credit"
      });
      if (result?.success) {
        toast.success(t("orders.converted_to_debt"));
        setShowConvertDebt(false);
        setDebtDueDate("");
        loadOrder(order.id);
      }
    } catch (err) {
      toast.error(err.message || t("orders.convert_error"));
    }
  };
  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      await window.api?.cancelOrder({
        orderId: order.id,
        reason: cancelReason || void 0
      });
      toast.success(t("orders.cancelled"));
      setShowCancelDialog(false);
      setCancelReason("");
      loadOrder(order.id);
    } catch (err) {
      toast.error(err.message || t("orders.cancel_error"));
    }
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case "Order":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-blue-500/15 text-blue-500 border-blue-500/30 text-xs px-3 py-1", children: t("orders.status_order") });
      case "Converted":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-green-500/15 text-green-500 border-green-500/30 text-xs px-3 py-1", children: t("orders.status_converted") });
      case "Cancelled":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-red-500/15 text-red-500 border-red-500/30 text-xs px-3 py-1", children: t("orders.status_cancelled") });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { children: status });
    }
  };
  const getHistoryIcon = (action) => {
    switch (action) {
      case "created":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { size: 14, className: "text-blue-500" });
      case "converted_to_sale":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { size: 14, className: "text-green-500" });
      case "converted_to_debt":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(PiggyBank, { size: 14, className: "text-yellow-500" });
      case "cancelled":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { size: 14, className: "text-red-500" });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 14 });
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-full py-32", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" }) });
  }
  if (!order) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-full gap-4 py-32", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 48, className: "text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: t("orders.not_found") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => navigate("/orders"), children: t("orders.go_back") })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 py-4 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6 flex items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0 rounded-full", onClick: () => navigate("/orders"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 16 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tighter uppercase font-mono", children: order.orderNumber }),
          getStatusBadge(order.status)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("orders.detail_subtitle") })
      ] }),
      order.status === "Order" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        hasPermission("orders.convert") && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setShowConvertSale(true), className: "h-9 px-4 font-black uppercase tracking-widest rounded-xl shadow-xl text-xs gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { size: 14 }),
            t("orders.convert_to_sale")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setShowConvertDebt(true), variant: "outline", className: "h-9 px-4 font-black uppercase tracking-widest rounded-xl text-xs gap-2 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(PiggyBank, { size: 14 }),
            t("orders.convert_to_debt")
          ] })
        ] }),
        hasPermission("orders.cancel") && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setShowCancelDialog(true), variant: "outline", className: "h-9 px-4 font-black uppercase tracking-widest rounded-xl text-xs gap-2 border-destructive/30 text-destructive hover:bg-destructive/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { size: 14 }),
          t("orders.cancel_order")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6 grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-[32px] overflow-hidden bg-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 border-b border-border/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-xs font-black uppercase tracking-widest flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { size: 14 }),
            " ",
            t("orders.items")
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50 text-xs font-black uppercase tracking-widest", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3", children: t("inventory.product") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-right", children: t("orders.qty") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-right", children: t("orders.unit_price") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-right", children: t("orders.total") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "text-sm", children: order.items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border/40", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 font-bold", children: item.itemName }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-6 py-4 text-right", children: [
                item.quantity,
                " ",
                item.unit
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-6 py-4 text-right", children: [
                t("common.etb"),
                " ",
                item.unitPrice.toLocaleString()
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-6 py-4 text-right font-bold", children: [
                t("common.etb"),
                " ",
                item.totalPrice.toLocaleString()
              ] })
            ] }, item.id)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tfoot", { className: "bg-muted/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 3, className: "px-6 py-4 text-right text-xs font-black uppercase tracking-widest", children: t("orders.total") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-6 py-4 text-right font-black text-lg", children: [
                t("common.etb"),
                " ",
                order.totalAmount.toLocaleString()
              ] })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-[32px] overflow-hidden bg-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 border-b border-border/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-xs font-black uppercase tracking-widest flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(History, { size: 14 }),
            " ",
            t("orders.history")
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: order.history.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center", children: getHistoryIcon(entry.action) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px flex-1 bg-border/40 mt-2" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 pb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold uppercase tracking-widest", children: [
                  entry.action === "created" && t("orders.history_created"),
                  entry.action === "converted_to_sale" && t("orders.history_converted_sale"),
                  entry.action === "converted_to_debt" && t("orders.history_converted_debt"),
                  entry.action === "cancelled" && t("orders.history_cancelled")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: formatDateTime(entry.createdAt) })
              ] }),
              entry.performedBy && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
                t("orders.by"),
                " ",
                entry.performedBy
              ] }),
              entry.notes && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground/70 mt-0.5 italic", children: entry.notes })
            ] })
          ] }, entry.id)) }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-[32px] overflow-hidden bg-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 border-b border-border/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-xs font-black uppercase tracking-widest flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 14 }),
          " ",
          t("orders.order_info")
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-1", children: t("orders.status") }),
            getStatusBadge(order.status)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-1", children: t("orders.customer") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(User, { size: 14, className: "text-muted-foreground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold", children: order.customerName || t("orders.walk_in") })
            ] }),
            order.customerPhone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 14, className: "text-muted-foreground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: order.customerPhone })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-1", children: t("orders.created_by") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold", children: order.createdByName || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-1", children: t("orders.created_at") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 14, className: "text-muted-foreground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: formatDateTime(order.createdAt) })
            ] })
          ] }),
          order.convertedAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-1", children: t("orders.converted_at") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { size: 14, className: "text-green-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: formatDateTime(order.convertedAt) })
            ] }),
            order.convertedBy && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
              t("orders.by"),
              " ",
              order.convertedBy
            ] })
          ] }),
          order.cancelledAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-1", children: t("orders.cancelled_at") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { size: 14, className: "text-red-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: formatDateTime(order.cancelledAt) })
            ] }),
            order.cancelledBy && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
              t("orders.by"),
              " ",
              order.cancelledBy
            ] }),
            order.cancelReason && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground/70 mt-0.5 italic", children: [
              t("orders.reason"),
              ": ",
              order.cancelReason
            ] })
          ] }),
          order.notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-1", children: t("orders.notes") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: order.notes })
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showConvertSale, onClose: () => setShowConvertSale(false), title: t("orders.convert_to_sale"), size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl bg-muted/20 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("orders.order_number") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono font-bold", children: order.orderNumber }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          t("orders.total"),
          ": ",
          t("common.etb"),
          " ",
          order.totalAmount.toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("orders.payment_method") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: salePaymentMethod, onValueChange: setSalePaymentMethod, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 bg-muted/30 border-border/50 rounded-xl text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Cash", children: t("suppliers.payment_cash", "Cash") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Bank Transfer", children: t("suppliers.payment_bank", "Bank Transfer") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Mobile Money", children: t("suppliers.payment_mobile", "Mobile Money") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Check", children: t("suppliers.payment_check", "Check") })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl", onClick: () => setShowConvertSale(false), children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl", onClick: handleConvertToSale, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { size: 16, className: "mr-2" }),
          t("orders.confirm_convert")
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showConvertDebt, onClose: () => setShowConvertDebt(false), title: t("orders.convert_to_debt"), size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl bg-muted/20 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("orders.order_number") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono font-bold", children: order.orderNumber }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          t("orders.customer"),
          ": ",
          order.customerName
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          t("orders.total"),
          ": ",
          t("common.etb"),
          " ",
          order.totalAmount.toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("orders.due_date") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: debtDueDate, onChange: setDebtDueDate, className: "h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl", onClick: () => setShowConvertDebt(false), children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl", onClick: handleConvertToDebt, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(PiggyBank, { size: 16, className: "mr-2" }),
          t("orders.confirm_convert")
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: showCancelDialog, onOpenChange: (open) => {
      if (!open) setShowCancelDialog(false);
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { className: "rounded-[32px] max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { className: "text-2xl font-black uppercase tracking-tight", children: t("orders.cancel_order") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { className: "text-xs text-muted-foreground", children: [
          t("orders.cancel_warning"),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-bold", children: order.orderNumber })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("orders.cancel_reason") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: cancelReason, onChange: (e) => setCancelReason(e.target.value), placeholder: t("orders.cancel_reason_placeholder"), className: "bg-muted/30 border-border/50 rounded-xl text-xs resize-none", rows: 3 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { className: "gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { className: "rounded-xl font-black uppercase tracking-widest text-xs", children: t("common.go_back") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogAction, { onClick: handleCancelOrder, className: "rounded-xl bg-destructive hover:bg-destructive/90 font-black uppercase tracking-widest text-xs shadow-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { size: 14, className: "mr-2" }),
          t("orders.confirm_cancel")
        ] })
      ] })
    ] }) })
  ] });
};
export {
  OrderDetail as default
};
