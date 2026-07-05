import { b as useSettings, m as useAuth, d as useNavigate, r as reactExports, j as jsxRuntimeExports, e as Button, a4 as Search, N as Input, x as Sheet, y as SheetTrigger, F as Filter, g as Badge, z as SheetContent, A as SheetHeader, D as SheetTitle, G as SheetDescription, H as SheetFooter, J as SheetClose, aV as DropdownMenu, aW as DropdownMenuTrigger, aX as DropdownMenuContent, aZ as DropdownMenuItem, b3 as DropdownMenuSeparator, a8 as CreditCard, a$ as PiggyBank, M as Modal, X, t as toast } from "./index-DPdLjKpV.js";
import { S as SectionCards } from "./section-cards-CXQ8xP9s.js";
import { L as Label } from "./label-CSHlh50h.js";
import { T as Textarea } from "./textarea-CC7ZGe6_.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-DhYsHDwr.js";
import { D as DatePicker } from "./DatePicker-Dtitjvwl.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-gkIIFj18.js";
import { P as Plus } from "./plus-BL0YjAi2.js";
import { E as Ellipsis } from "./ellipsis-B_KmQhXE.js";
import { A as ArrowRight } from "./arrow-right-RQ5PBEXv.js";
import { B as Ban } from "./ban-BcaS5OQd.js";
import { C as CircleCheckBig } from "./circle-check-big-BradCQu7.js";
import "./card-C6dz2yia.js";
const Orders = () => {
  const { t, formatDate } = useSettings();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = reactExports.useState([]);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("All");
  const [filterStartDate, setFilterStartDate] = reactExports.useState("");
  const [filterEndDate, setFilterEndDate] = reactExports.useState("");
  const [isFilterOpen, setIsFilterOpen] = reactExports.useState(false);
  const [showCreateModal, setShowCreateModal] = reactExports.useState(false);
  const [customerName, setCustomerName] = reactExports.useState("");
  const [customerPhone, setCustomerPhone] = reactExports.useState("");
  const [orderNotes, setOrderNotes] = reactExports.useState("");
  const [cart, setCart] = reactExports.useState([]);
  const [searchItem, setSearchItem] = reactExports.useState("");
  const [items, setItems] = reactExports.useState([]);
  const [showConvertSale, setShowConvertSale] = reactExports.useState(null);
  const [salePaymentMethod, setSalePaymentMethod] = reactExports.useState("Cash");
  const [showConvertDebt, setShowConvertDebt] = reactExports.useState(null);
  const [debtDueDate, setDebtDueDate] = reactExports.useState("");
  const [showCancelDialog, setShowCancelDialog] = reactExports.useState(null);
  const [cancelReason, setCancelReason] = reactExports.useState("");
  reactExports.useEffect(() => {
    loadOrders();
    loadItems();
  }, []);
  const loadOrders = () => {
    const opts = {};
    if (searchTerm) opts.search = searchTerm;
    if (statusFilter !== "All") opts.status = statusFilter;
    if (filterStartDate) opts.startDate = filterStartDate;
    if (filterEndDate) opts.endDate = filterEndDate;
    window.api?.getOrders(opts).then(setOrders);
  };
  const loadItems = async () => {
    const data = await window.api?.getItems({ limit: 500 });
    setItems(data || []);
  };
  const filteredOrders = reactExports.useMemo(() => {
    let result = orders;
    const q = searchTerm.toLowerCase();
    if (q) {
      result = result.filter(
        (o) => o.orderNumber.toLowerCase().includes(q) || o.customerName && o.customerName.toLowerCase().includes(q) || o.customerPhone && o.customerPhone.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") {
      result = result.filter((o) => o.status === statusFilter);
    }
    return result;
  }, [orders, searchTerm, statusFilter]);
  const kpiCards = reactExports.useMemo(() => {
    const activeOrders = orders.filter((o) => o.status === "Order");
    const totalActive = activeOrders.reduce((s, o) => s + o.totalAmount, 0);
    const convertedCount = orders.filter((o) => o.status === "Converted").length;
    const cancelledCount = orders.filter((o) => o.status === "Cancelled").length;
    return [
      {
        title: t("orders.active_orders"),
        value: activeOrders.length,
        trend: activeOrders.length > 0 ? "up" : "neutral",
        trendType: "up",
        trendText: `${t("common.etb")} ${totalActive.toLocaleString()}`,
        footerTitle: t("orders.total_value"),
        footerSub: t("orders.pending_fulfillment")
      },
      {
        title: t("orders.converted"),
        value: convertedCount,
        trend: "up",
        trendType: "up",
        trendText: `${Math.round(convertedCount / (orders.length || 1) * 100)}%`,
        footerTitle: t("orders.of_total"),
        footerSub: t("orders.fulfilled")
      },
      {
        title: t("orders.cancelled"),
        value: cancelledCount,
        trend: cancelledCount > 0 ? "down" : "neutral",
        trendType: cancelledCount > 0 ? "down" : "up",
        trendText: `${Math.round(cancelledCount / (orders.length || 1) * 100)}%`,
        footerTitle: t("orders.cancellation_rate"),
        footerSub: t("orders.last_30_days")
      },
      {
        title: t("orders.total_orders"),
        value: orders.length,
        trend: "up",
        trendType: "up",
        trendText: t("orders.all_time"),
        footerTitle: t("orders.total_revenue"),
        footerSub: `${t("common.etb")} ${orders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}`
      }
    ];
  }, [orders]);
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item.id);
      if (existing) {
        return prev.map((c) => c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, {
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
        unit: item.baseUnit || t("common.pcs"),
        unitType: "base",
        unitPrice: item.baseSellingPrice || 0
      }];
    });
  };
  const updateCartItem = (itemId, field, value) => {
    setCart((prev) => prev.map((c) => c.itemId === itemId ? { ...c, [field]: value } : c));
  };
  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((c) => c.itemId !== itemId));
  };
  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      toast.error(t("orders.cart_empty"));
      return;
    }
    try {
      await window.api?.insertOrder({
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        notes: orderNotes || null,
        items: cart.map((c) => ({
          itemId: c.itemId,
          itemName: c.itemName,
          quantity: c.quantity,
          unit: c.unit,
          unitType: c.unitType,
          unitPrice: c.unitPrice
        }))
      });
      toast.success(t("orders.created"));
      setShowCreateModal(false);
      resetForm();
      loadOrders();
    } catch (err) {
      toast.error(err.message || t("orders.create_error"));
    }
  };
  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setOrderNotes("");
    setCart([]);
    setSearchItem("");
  };
  const handleConvertToSale = async () => {
    if (!showConvertSale) return;
    try {
      const result = await window.api?.convertOrderToSale({
        orderId: showConvertSale.id,
        paymentMethod: salePaymentMethod
      });
      if (result?.success) {
        toast.success(t("orders.converted_to_sale"));
        setShowConvertSale(null);
        loadOrders();
      }
    } catch (err) {
      toast.error(err.message || t("orders.convert_error"));
    }
  };
  const handleConvertToDebt = async () => {
    if (!showConvertDebt) return;
    try {
      const result = await window.api?.convertOrderToDebt({
        orderId: showConvertDebt.id,
        dueDate: debtDueDate || void 0,
        paymentMethod: "Credit"
      });
      if (result?.success) {
        toast.success(t("orders.converted_to_debt"));
        setShowConvertDebt(null);
        setDebtDueDate("");
        loadOrders();
      }
    } catch (err) {
      toast.error(err.message || t("orders.convert_error"));
    }
  };
  const handleCancelOrder = async () => {
    if (!showCancelDialog) return;
    try {
      await window.api?.cancelOrder({
        orderId: showCancelDialog.id,
        reason: cancelReason || void 0
      });
      toast.success(t("orders.cancelled"));
      setShowCancelDialog(null);
      setCancelReason("");
      loadOrders();
    } catch (err) {
      toast.error(err.message || t("orders.cancel_error"));
    }
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case "Order":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-blue-500/15 text-blue-500 border-blue-500/30", children: t("orders.status_order") });
      case "Converted":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-green-500/15 text-green-500 border-green-500/30", children: t("orders.status_converted") });
      case "Cancelled":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-red-500/15 text-red-500 border-red-500/30", children: t("orders.status_cancelled") });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { children: status });
    }
  };
  const hasActiveFilters = filterStartDate || filterEndDate || statusFilter !== "All";
  const filteredItems = items.filter(
    (i) => !i.is_deleted && i.name.toLowerCase().includes(searchItem.toLowerCase())
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tighter uppercase", children: t("orders.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("orders.subtitle") })
      ] }),
      hasPermission("orders.create") && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setShowCreateModal(true), className: "h-10 px-5 font-black uppercase tracking-widest rounded-xl shadow-xl text-xs gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 16 }),
        t("orders.create")
      ] })
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
            hasActiveFilters && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "ml-1.5 h-4 px-1 text-[9px] rounded-full", children: t("inventory.active") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { side: "right", className: "w-[400px] sm:w-[540px] border-l-border/40 p-0 flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetHeader, { className: "border-b border-border/50 p-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { className: "text-2xl font-black uppercase tracking-tight", children: t("orders.filter_title") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SheetDescription, { className: "text-[10px] font-bold text-muted-foreground uppercase tracking-widest", children: t("orders.filter_desc") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8 p-6 flex-1 overflow-y-auto", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-primary", children: t("orders.status") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 bg-muted/30 border-border/50 rounded-xl text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "All", children: t("orders.all") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Order", children: t("orders.status_order") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Converted", children: t("orders.status_converted") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Cancelled", children: t("orders.status_cancelled") })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-primary", children: t("inventory.timeframe") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("inventory.start_date") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: filterStartDate, onChange: setFilterStartDate, className: "h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("inventory.end_date") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: filterEndDate, onChange: setFilterEndDate, className: "h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SheetFooter, { className: "p-6 border-t border-border/50 bg-background/80 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 w-full", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl", onClick: () => {
                setFilterStartDate("");
                setFilterEndDate("");
                setStatusFilter("All");
              }, children: t("inventory.reset_all") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SheetClose, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl", children: t("inventory.apply_filters") }) })
            ] }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded-[32px] overflow-hidden bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50 text-[10px] font-black uppercase tracking-widest", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-4", children: t("orders.order_number") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-4", children: t("orders.customer") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-4 text-right", children: t("orders.total") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-4", children: t("orders.status") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-4", children: t("orders.date") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-4", children: t("orders.created_by") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-4 text-right", children: t("common.actions") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "text-sm", children: [
          filteredOrders.map((order) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border/40 hover:bg-muted/20 transition-colors cursor-pointer", onClick: () => navigate(`/orders/${order.id}`), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4 font-mono text-xs font-bold", children: order.orderNumber }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: order.customerName || t("orders.walk_in") }),
              order.customerPhone && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground", children: order.customerPhone })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-4 text-right font-bold", children: [
              t("common.etb"),
              " ",
              order.totalAmount.toLocaleString()
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4", children: getStatusBadge(order.status) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4 text-muted-foreground text-xs", children: formatDate(order.createdAt) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4 text-muted-foreground text-xs", children: order.createdByName || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { size: 16 }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", className: "min-w-[180px] rounded-xl", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => navigate(`/orders/${order.id}`), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { size: 14, className: "mr-2" }),
                  t("orders.view_details")
                ] }),
                order.status === "Order" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
                  hasPermission("orders.convert") && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => {
                      setShowConvertSale(order);
                      setSalePaymentMethod("Cash");
                    }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { size: 14, className: "mr-2" }),
                      t("orders.convert_to_sale")
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => {
                      setShowConvertDebt(order);
                      setDebtDueDate("");
                    }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(PiggyBank, { size: 14, className: "mr-2" }),
                      t("orders.convert_to_debt")
                    ] })
                  ] }),
                  hasPermission("orders.cancel") && /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => {
                    setShowCancelDialog(order);
                    setCancelReason("");
                  }, className: "text-destructive", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { size: 14, className: "mr-2" }),
                    t("orders.cancel_order")
                  ] })
                ] })
              ] })
            ] }) }) })
          ] }, order.id)),
          filteredOrders.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 7, className: "px-5 py-12 text-center text-muted-foreground", children: t("orders.no_orders") }) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showCreateModal, onClose: () => {
      setShowCreateModal(false);
      resetForm();
    }, title: t("orders.create_order"), size: "lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("orders.customer_name") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: customerName, onChange: (e) => setCustomerName(e.target.value), placeholder: t("orders.customer_name_placeholder"), className: "h-10 bg-muted/30 border-border/50 rounded-xl text-xs" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("orders.customer_phone") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: customerPhone, onChange: (e) => setCustomerPhone(e.target.value), placeholder: t("orders.customer_phone_placeholder"), className: "h-10 bg-muted/30 border-border/50 rounded-xl text-xs" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("orders.notes") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: orderNotes, onChange: (e) => setOrderNotes(e.target.value), placeholder: t("orders.notes_placeholder"), className: "bg-muted/30 border-border/50 rounded-xl text-xs resize-none", rows: 2 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border/50 pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-widest", children: t("orders.items") }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: searchItem,
              onChange: (e) => setSearchItem(e.target.value),
              placeholder: t("orders.search_items"),
              className: "pl-9 h-10 bg-muted/30 border-border/50 rounded-xl text-xs"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-40 overflow-y-auto space-y-1 mb-3 custom-scrollbar", children: [
          filteredItems.slice(0, 20).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-2 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer", onClick: () => addToCart(item), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold", children: item.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
                t("common.etb"),
                " ",
                item.baseSellingPrice?.toLocaleString() || 0,
                " / ",
                item.baseUnit || t("common.pcs")
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0 rounded-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14 }) })
          ] }, item.id)),
          filteredItems.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground text-center py-4", children: t("orders.no_items_found") })
        ] }),
        cart.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 border rounded-xl p-3 bg-muted/10", children: [
          cart.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold truncate", children: item.itemName }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                value: item.quantity,
                onChange: (e) => updateCartItem(item.itemId, "quantity", Math.max(1, Number(e.target.value))),
                className: "h-8 w-20 text-xs text-center bg-muted/30 border-border/50 rounded-lg",
                min: 1
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                value: item.unitPrice,
                onChange: (e) => updateCartItem(item.itemId, "unitPrice", Math.max(0, Number(e.target.value))),
                className: "h-8 w-24 text-xs text-right bg-muted/30 border-border/50 rounded-lg",
                min: 0,
                step: 0.01
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold w-20 text-right", children: [
              t("common.etb"),
              " ",
              (item.quantity * item.unitPrice).toLocaleString()
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0 text-destructive", onClick: () => removeFromCart(item.itemId), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14 }) })
          ] }, item.itemId)),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center pt-2 border-t border-border/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-black uppercase tracking-widest", children: t("orders.total") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-black", children: [
              t("common.etb"),
              " ",
              cart.reduce((s, c) => s + c.quantity * c.unitPrice, 0).toLocaleString()
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 pt-4 border-t border-border/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl", onClick: () => {
          setShowCreateModal(false);
          resetForm();
        }, children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl", onClick: handleCreateOrder, disabled: cart.length === 0, children: t("orders.create_order") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: !!showConvertSale, onClose: () => setShowConvertSale(null), title: t("orders.convert_to_sale"), size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl bg-muted/20 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("orders.order_number") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono font-bold", children: showConvertSale?.orderNumber }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          t("orders.total"),
          ": ",
          t("common.etb"),
          " ",
          showConvertSale?.totalAmount.toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("orders.payment_method") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: salePaymentMethod, onValueChange: setSalePaymentMethod, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 bg-muted/30 border-border/50 rounded-xl text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Cash", children: t("suppliers.payment_cash") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Bank Transfer", children: t("suppliers.payment_bank") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Mobile Money", children: t("suppliers.payment_mobile") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Check", children: t("suppliers.payment_check") })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("orders.convert_sale_warning") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl", onClick: () => setShowConvertSale(null), children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl", onClick: handleConvertToSale, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { size: 16, className: "mr-2" }),
          t("orders.confirm_convert")
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: !!showConvertDebt, onClose: () => setShowConvertDebt(null), title: t("orders.convert_to_debt"), size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl bg-muted/20 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("orders.order_number") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono font-bold", children: showConvertDebt?.orderNumber }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          t("orders.customer"),
          ": ",
          showConvertDebt?.customerName
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          t("orders.total"),
          ": ",
          t("common.etb"),
          " ",
          showConvertDebt?.totalAmount.toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("orders.due_date") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: debtDueDate, onChange: setDebtDueDate, className: "h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("orders.convert_debt_warning") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl", onClick: () => setShowConvertDebt(null), children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl", onClick: handleConvertToDebt, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(PiggyBank, { size: 16, className: "mr-2" }),
          t("orders.confirm_convert")
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: !!showCancelDialog, onOpenChange: (open) => {
      if (!open) setShowCancelDialog(null);
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { className: "rounded-[32px] max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { className: "text-2xl font-black uppercase tracking-tight", children: t("orders.cancel_order") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { className: "text-xs text-muted-foreground", children: [
          t("orders.cancel_warning"),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-bold", children: showCancelDialog?.orderNumber })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("orders.cancel_reason") }),
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
  Orders as default
};
