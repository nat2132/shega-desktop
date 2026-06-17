import { b as useSettings, j as jsxRuntimeExports, Q as Dialog, U as DialogContent, V as DialogClose, X, W as DialogHeader, Y as DialogTitle, Z as DialogDescription, _ as DialogFooter, e as Button, N as ShoppingCart, r as reactExports, $ as User, g as Badge, w as Eye, h as Trash2, S as Sheet, x as SheetTrigger, F as Filter, y as SheetContent, z as SheetHeader, A as SheetTitle, D as SheetDescription, G as SheetFooter, H as SheetClose, J as FileText, M as Modal, a0 as React, a1 as Search, K as Input, O as playSound } from "./index-KcbOuwlA.js";
import { E, e as exportCSV, a as exportPDF } from "./export-utils-Dojrgpyy.js";
import { S as SectionCards } from "./section-cards-Dy4aaYvC.js";
import { D as DataTable } from "./data-table-DznN-uuJ.js";
import { D as DatePicker } from "./DatePicker-oD7Ou9XD.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-YJnyGvXs.js";
import { c as computeTrend } from "./trend-utils-D_UP5BUt.js";
import { A as AlertDialog, h as AlertDialogTrigger, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-Ke03lX1F.js";
import { C as CircleCheckBig } from "./circle-check-big-BWNplmKs.js";
import { P as Printer } from "./printer-BScWGauP.js";
import { S as ShoppingBag } from "./shopping-bag-D_z-KuGg.js";
import { S as SquarePen } from "./square-pen-Ddvf5fqh.js";
import { U as Undo2 } from "./undo-2-D31bSI1Y.js";
import { P as Plus } from "./plus-pdN_V3Af.js";
import { P as Phone } from "./phone-Be_nLvzt.js";
import "./label-BI69aa1I.js";
import "./table-Cnor9ZKG.js";
import "./tabs-Llxhc1yS.js";
const SaleSuccessModal = ({ open, onClose, sale }) => {
  const { t } = useSettings();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: (open2) => !open2 && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "rounded-3xl bg-background border-border shadow-2xl max-w-sm p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogClose, { className: "absolute right-4 top-4 rounded-full opacity-70 hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center text-center space-y-6 pt-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-16 w-16 text-green-500", strokeWidth: 1.5 }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-2xl font-black tracking-tight", children: "Sale Complete" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { className: "text-sm text-muted-foreground font-medium", children: "The sale has been recorded successfully" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full space-y-3 bg-muted/30 rounded-2xl p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-medium", children: "Item" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: sale?.name || sale?.item_name || "-" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-medium", children: "Quantity" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: sale?.quantity ?? "-" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-medium", children: "Total" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-black text-lg", children: [
            t("common.etb"),
            " ",
            (sale?.total_price ?? sale?.amount ?? 0).toLocaleString()
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-medium", children: "Payment" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold capitalize", children: sale?.payment_method || "-" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-medium", children: "Customer" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: sale?.customer_name || "Walk-in" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "flex-col gap-3 sm:flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: () => window.api?.printReceipt(sale),
          className: "w-full py-6 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "w-4 h-4 mr-2" }),
            " Print Receipt"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: onClose,
          variant: "outline",
          className: "w-full py-6 text-xs font-black uppercase tracking-[0.2em] rounded-2xl border-border",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "w-4 h-4 mr-2" }),
            " New Sale"
          ]
        }
      )
    ] })
  ] }) });
};
const Sales = () => {
  const { t, formatDate, currentBusiness } = useSettings();
  const [sales, setSales] = reactExports.useState([]);
  const [items, setItems] = reactExports.useState([]);
  const [showModal, setShowModal] = reactExports.useState(false);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [categories, setCategories] = reactExports.useState([]);
  const [filterStartDate, setFilterStartDate] = reactExports.useState("");
  const [filterEndDate, setFilterEndDate] = reactExports.useState("");
  const [filterCategory, setFilterCategory] = reactExports.useState("All");
  const [isFilterOpen, setIsFilterOpen] = reactExports.useState(false);
  const [formData, setFormData] = reactExports.useState({
    itemId: "",
    quantity: "1",
    unitType: "base",
    discount: "0",
    vat: "0",
    paymentMethod: t("sales.cash"),
    paymentStatus: t("sales.paid"),
    customerName: "",
    customerPhone: "",
    dueDate: ""
  });
  const [selectedItem, setSelectedItem] = reactExports.useState(null);
  const [cart, setCart] = reactExports.useState([]);
  const [customerInfo, setCustomerInfo] = reactExports.useState({ name: "", phone: "" });
  const [paymentInfo, setPaymentInfo] = reactExports.useState({ method: t("sales.cash"), status: t("sales.paid"), dueDate: "", isDebt: false });
  const [globalDiscount, setGlobalDiscount] = reactExports.useState("0");
  const [globalVAT, setGlobalVAT] = reactExports.useState("0");
  const [viewingSale, setViewingSale] = reactExports.useState(null);
  const [showReceiptModal, setShowReceiptModal] = reactExports.useState(false);
  const [currentStep, setCurrentStep] = reactExports.useState(1);
  const [itemSearchQuery, setItemSearchQuery] = reactExports.useState("");
  const [showReturnModal, setShowReturnModal] = reactExports.useState(false);
  const [returnSale, setReturnSale] = reactExports.useState(null);
  const [returnQty, setReturnQty] = reactExports.useState("");
  const [returnReason, setReturnReason] = reactExports.useState("");
  const [returnRefund, setReturnRefund] = reactExports.useState("");
  const [drafts, setDrafts] = reactExports.useState([]);
  const [showDraftsModal, setShowDraftsModal] = reactExports.useState(false);
  const [showSuccessModal, setShowSuccessModal] = reactExports.useState(false);
  const [lastSale, setLastSale] = reactExports.useState(null);
  reactExports.useEffect(() => {
    loadData();
  }, [searchQuery, filterCategory, filterStartDate, filterEndDate]);
  const loadData = async () => {
    const [salesData, itemsData, catsData] = await Promise.all([
      window.api?.getSales({ search: searchQuery, category: filterCategory, startDate: filterStartDate, endDate: filterEndDate }) || Promise.resolve([]),
      window.api?.getItems({}) || Promise.resolve([]),
      window.api?.getCategories() || Promise.resolve([])
    ]);
    setSales(salesData);
    setItems(itemsData);
    setCategories(Array.isArray(catsData) ? catsData : []);
  };
  const kpiCards = reactExports.useMemo(() => {
    const total = sales.reduce((sum, s) => sum + s.totalPrice, 0);
    const profit = sales.reduce((sum, s) => {
      const cost = (s.basePurchasePrice || 0) * (s.unitType === "pack" ? s.quantity * (s.unitsPerPack || 1) : s.quantity);
      return sum + (s.totalPrice - cost);
    }, 0);
    const outDebt = sales.filter((s) => s.paymentStatus === "Debt" || s.paymentStatus === t("sales.debt"));
    const totalOutstanding = outDebt.reduce((sum, s) => sum + (s.totalPrice - s.paidAmount), 0);
    const revenueTrend = computeTrend(sales, "createdAt", (s) => s.totalPrice);
    const profitTrend = computeTrend(sales, "createdAt", (s) => {
      const cost = (s.basePurchasePrice || 0) * (s.unitType === "pack" ? s.quantity * (s.unitsPerPack || 1) : s.quantity);
      return s.totalPrice - cost;
    });
    const txTrend = computeTrend(sales, "createdAt", () => 1);
    const outTrend = computeTrend(outDebt, "createdAt", (s) => s.totalPrice - s.paidAmount);
    return [
      {
        title: t("sales.revenue"),
        value: `${t("common.etb")} ${total.toLocaleString()}`,
        ...revenueTrend,
        footerTitle: t("sales.transactions"),
        footerSub: t("customers.last_30")
      },
      {
        title: t("sales.profit"),
        value: `${t("common.etb")} ${profit.toLocaleString()}`,
        ...profitTrend,
        footerTitle: t("inventory.margin"),
        footerSub: t("sales.healthy_growth")
      },
      {
        title: t("sales.transactions"),
        value: sales.length,
        ...txTrend,
        footerTitle: t("sales.order_freq"),
        footerSub: t("sales.high_activity")
      },
      {
        title: t("sales.outstanding"),
        value: `${t("common.etb")} ${totalOutstanding.toLocaleString()}`,
        ...outTrend,
        footerTitle: t("sales.debt"),
        footerSub: t("customers.active_ledgers")
      }
    ];
  }, [sales]);
  const columns = [
    {
      accessorKey: "itemName",
      header: t("sales.transaction_details"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { className: "h-5 w-5 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: row.original.itemName }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-muted-foreground uppercase font-bold tracking-widest", children: [
            formatDate(row.original.createdAt),
            " • ",
            row.original.quantity,
            " ",
            row.original.unit
          ] })
        ] })
      ] })
    },
    {
      accessorKey: "customerName",
      header: t("sales.customer"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-7 w-7 rounded-full bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-4 w-4 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm", children: row.original.customerName || t("sales.walk_in") })
      ] })
    },
    {
      accessorKey: "totalPrice",
      header: () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right", children: t("common.total") }),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right font-bold", children: [
        t("common.etb"),
        " ",
        row.original.totalPrice.toLocaleString()
      ] })
    },
    {
      accessorKey: "paymentStatus",
      header: t("sales.payment_status"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: row.original.paymentStatus === "Paid" || row.original.paymentStatus === t("sales.paid") ? "default" : "destructive", className: "uppercase text-[9px] font-bold", children: row.original.paymentStatus === "Paid" || row.original.paymentStatus === t("sales.paid") ? t("sales.paid") : t("sales.debt") }),
        row.original.status === "Voided" && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "destructive", className: "text-[8px] font-black uppercase", children: "Voided" })
      ] })
    },
    {
      id: "actions",
      header: () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right", children: t("common.actions") }),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => {
          setViewingSale(row.original);
          setShowReceiptModal(true);
        }, title: t("common.view"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => generateReceipt(row.original), title: t("common.print"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleEdit(row.original), title: t("common.edit"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "text-amber-500 hover:bg-amber-500/10", onClick: () => openReturn(row.original), title: "Return", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Undo2, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "text-destructive hover:bg-destructive/10", title: t("common.delete"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { className: "rounded-[32px] bg-background border-border shadow-2xl", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { className: "text-xl font-black uppercase tracking-tight", children: t("sales.revoke_title") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { className: "text-xs font-medium text-muted-foreground leading-relaxed", children: t("sales.revoke_desc") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { className: "gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { className: "rounded-xl border-border h-11 text-[10px] font-black uppercase tracking-widest", children: t("common.abort") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                AlertDialogAction,
                {
                  onClick: () => handleDelete(row.original.id),
                  className: "rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-[10px] font-black uppercase tracking-widest",
                  children: t("common.confirm")
                }
              )
            ] })
          ] })
        ] })
      ] })
    }
  ];
  const addToCart = (itemId) => {
    const item = items.find((i) => i.id === parseInt(itemId));
    if (!item) return;
    const existing = cart.find((c) => c.itemId === item.id);
    const unitType = existing ? existing.unitType : item.allowSellByBaseUnit ? "base" : "pack";
    const maxQty = unitType === "pack" ? item.totalPackQuantity : item.totalBaseQuantity;
    if (existing) {
      if (existing.quantity + 1 > maxQty) return;
      updateCartItem(item.id, { quantity: existing.quantity + 1 });
      return;
    }
    if (1 > maxQty) return;
    const newItem = {
      itemId: item.id,
      name: item.name,
      quantity: 1,
      unitType: item.allowSellByBaseUnit ? "base" : "pack",
      unit: item.allowSellByBaseUnit ? item.baseUnit : item.purchaseUnit,
      price: item.allowSellByBaseUnit ? item.baseSellingPrice : item.packSellingPrice,
      discount: 0,
      vat: 0,
      total: item.allowSellByBaseUnit ? item.baseSellingPrice : item.packSellingPrice
    };
    setCart([...cart, newItem]);
  };
  const updateCartItem = (itemId, updates) => {
    setCart(cart.map((c) => {
      if (c.itemId === itemId) {
        const item = items.find((i) => i.id === itemId);
        const updated = { ...c, ...updates };
        if (item) {
          const maxQty = updated.unitType === "pack" ? item.totalPackQuantity : item.totalBaseQuantity;
          if (updated.quantity > maxQty) {
            updated.quantity = maxQty;
          }
        }
        const price = updated.unitType === "pack" ? item?.packSellingPrice : item?.baseSellingPrice;
        updated.price = price || 0;
        updated.unit = updated.unitType === "pack" ? item?.purchaseUnit : item?.baseUnit;
        updated.total = updated.quantity * updated.price - updated.discount + updated.vat;
        return updated;
      }
      return c;
    }));
  };
  const removeFromCart = (itemId) => {
    setCart(cart.filter((c) => c.itemId !== itemId));
  };
  const totals = reactExports.useMemo(() => {
    const subtotal = cart.reduce((sum, c) => sum + c.quantity * c.price, 0);
    const itemDiscounts = cart.reduce((sum, c) => sum + (parseFloat(c.discount) || 0), 0);
    const totalDiscount = subtotal > 0 ? itemDiscounts + (parseFloat(globalDiscount) || 0) : 0;
    const vatRate = parseFloat(globalVAT) || 0;
    const totalVAT = (subtotal - totalDiscount) * (vatRate / 100);
    const finalTotal = subtotal - totalDiscount + totalVAT;
    return { subtotal, totalDiscount, totalVAT, finalTotal };
  }, [cart, globalDiscount, globalVAT]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    const salesToInsert = cart.map((c) => ({
      itemId: c.itemId,
      quantity: c.quantity,
      unit: c.unit,
      unitType: c.unitType,
      discount: c.discount + parseFloat(globalDiscount) / cart.length,
      vat: c.vat + parseFloat(globalVAT) / cart.length,
      totalPrice: c.quantity * c.price - c.discount + c.vat - parseFloat(globalDiscount) / cart.length + parseFloat(globalVAT) / cart.length,
      paymentMethod: paymentInfo.method,
      paymentStatus: paymentInfo.isDebt ? "Debt" : "Paid",
      customerName: customerInfo.name?.trim() || null,
      customerPhone: customerInfo.phone?.trim() || null,
      dueDate: paymentInfo.isDebt ? paymentInfo.dueDate : null,
      paidAmount: paymentInfo.isDebt ? 0 : c.quantity * c.price - c.discount + c.vat - parseFloat(globalDiscount) / cart.length + parseFloat(globalVAT) / cart.length
    }));
    await window.api?.insertSalesBatch(salesToInsert);
    playSound("nice");
    setShowModal(false);
    resetForm();
    loadData();
    setLastSale(salesToInsert[0]);
    setShowSuccessModal(true);
  };
  const [editingId, setEditingId] = reactExports.useState(null);
  const handleEdit = (sale) => {
    setEditingId(sale.id);
    const item = items.find((i) => i.id === sale.itemId);
    if (item) {
      setCart([{
        itemId: item.id,
        name: item.name,
        quantity: sale.quantity,
        unitType: sale.unitType,
        unit: sale.unit,
        price: sale.unitType === "pack" ? item.packSellingPrice : item.baseSellingPrice,
        discount: sale.discount,
        vat: sale.vat,
        total: sale.totalPrice
      }]);
      setCustomerInfo({ name: sale.customerName || "", phone: sale.customerPhone || "" });
      setPaymentInfo({
        method: sale.paymentMethod,
        status: sale.paymentStatus,
        dueDate: sale.dueDate || "",
        isDebt: sale.paymentStatus === "Debt" || sale.paymentStatus === t("sales.debt")
      });
      setShowModal(true);
    }
  };
  const handleDelete = async (id) => {
    await window.api?.deleteSale(id);
    loadData();
  };
  const resetForm = () => {
    setCart([]);
    setCustomerInfo({ name: "", phone: "" });
    setPaymentInfo({ method: t("sales.cash"), status: t("sales.paid"), dueDate: "", isDebt: false });
    setGlobalDiscount("0");
    setGlobalVAT("0");
    setEditingId(null);
    setCurrentStep(1);
    setItemSearchQuery("");
  };
  const generateReceipt = (sale) => {
    const doc = new E({ unit: "mm", format: [80, 200] });
    const pageWidth = 80;
    let y = 5;
    if (currentBusiness?.businessName) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(currentBusiness.businessName, pageWidth / 2, y, { align: "center" });
      y += 5;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("RECEIPT", pageWidth / 2, y, { align: "center" });
    y += 7;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`#REC-${sale.id}`, pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.setDrawColor(0);
    doc.line(3, y, pageWidth - 3, y);
    y += 4;
    doc.setFontSize(7);
    doc.text(`Date: ${new Date(sale.createdAt).toLocaleString()}`, 3, y);
    y += 4;
    doc.text(`Customer: ${sale.customerName || "Walk-in"}`, 3, y);
    y += 4;
    if (sale.customerPhone) {
      doc.text(`Phone: ${sale.customerPhone}`, 3, y);
      y += 4;
    }
    doc.line(3, y, pageWidth - 3, y);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Item", 3, y);
    doc.text("Qty", 40, y);
    doc.text("Price", 55, y);
    doc.text("Total", 68, y, { align: "right" });
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const unitPrice = sale.totalPrice / sale.quantity;
    doc.text(sale.itemName, 3, y);
    doc.text(String(sale.quantity), 40, y);
    doc.text(unitPrice.toFixed(2), 55, y);
    doc.text(sale.totalPrice.toFixed(2), 68, y, { align: "right" });
    y += 6;
    doc.setDrawColor(0);
    doc.line(3, y, pageWidth - 3, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Total: ETB ${sale.totalPrice.toFixed(2)}`, 3, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Payment: ${sale.paymentMethod}`, 3, y);
    y += 4;
    doc.text(`Paid: ETB ${(sale.paidAmount || sale.totalPrice).toFixed(2)}`, 3, y);
    y += 4;
    if (sale.paymentStatus === "Debt") {
      doc.text(`Due: ETB ${(sale.totalPrice - (sale.paidAmount || 0)).toFixed(2)}`, 3, y);
      y += 4;
    }
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Thank you for your business!", pageWidth / 2, y, { align: "center" });
    doc.save(`receipt-${sale.id}.pdf`);
  };
  const openReturn = (sale) => {
    setReturnSale(sale);
    setReturnQty(String(sale.quantity));
    setReturnRefund("0");
    setReturnReason("");
    setShowReturnModal(true);
  };
  const handleReturn = async (e) => {
    e.preventDefault();
    if (!returnSale) return;
    const result = await window.api?.createReturn({
      saleId: returnSale.id,
      quantity: parseFloat(returnQty),
      refundAmount: parseFloat(returnRefund) || 0,
      reason: returnReason
    });
    if (result?.success) {
      toast.success("Return processed successfully");
      setShowReturnModal(false);
      loadData();
    } else {
      toast.error(result?.error || "Return failed");
    }
  };
  const loadDrafts = async () => {
    const data = await window.api?.getDraftSales() || [];
    setDrafts(data);
    setShowDraftsModal(true);
  };
  const resumeDraft = async (id) => {
    const draft = await window.api?.getDraftSale(id);
    if (!draft) return;
    resetForm();
    const parsedItems = typeof draft.items === "string" ? JSON.parse(draft.items) : draft.items || [];
    setCart(parsedItems);
    setCustomerInfo({ name: draft.customerName || "", phone: "" });
    setGlobalDiscount(String(draft.discount || "0"));
    setGlobalVAT(String(draft.vat || "0"));
    setShowDraftsModal(false);
    setShowModal(true);
  };
  const handleSaveDraft = async () => {
    if (cart.length === 0) return;
    await window.api?.saveDraftSale({
      items: cart,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      discount: parseFloat(globalDiscount) || 0,
      vat: parseFloat(globalVAT) || 0
    });
    toast.success("Draft saved");
    setShowModal(false);
    resetForm();
  };
  const deleteDraft = async (id) => {
    await window.api?.deleteDraftSale(id);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };
  const exportSalesCSV = () => {
    exportCSV(
      ["ID", "Item", "Qty", "Unit", "Total", "Payment", "Status", "Customer", "Date"],
      sales.map((s) => [s.id, s.itemName, s.quantity, s.unit, s.totalPrice, s.paymentMethod, s.paymentStatus, s.customerName || "Walk-in", s.createdAt]),
      "sales-report"
    );
  };
  const exportSalesPDF = () => {
    exportPDF(
      "Sales Report",
      ["ID", "Item", "Qty", "Unit", "Total", "Payment", "Status", "Customer", "Date"],
      sales.map((s) => [s.id, s.itemName, s.quantity, s.unit, s.totalPrice, s.paymentMethod, s.paymentStatus, s.customerName || "Walk-in", s.createdAt]),
      "sales-report",
      ["", "", "", "", sales.reduce((sum, s) => sum + s.totalPrice, 0).toLocaleString(), "", "", "", ""]
    );
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCards, { cards: kpiCards }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Sheet, { open: isFilterOpen, onOpenChange: setIsFilterOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: `h-8 px-3 transition-all ${filterCategory !== "All" && filterCategory !== t("common.all") || filterStartDate || filterEndDate ? "border-primary text-primary bg-primary/5 shadow-sm" : "border-border/60 hover:bg-muted/50"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { className: "mr-1.5 h-3.5 w-3.5" }),
            t("common.filters"),
            " ",
            (filterCategory !== "All" || filterStartDate || filterEndDate) && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "ml-1.5 h-4 px-1 text-[9px] rounded-full", children: t("inventory.active") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { side: "right", className: "w-[400px] sm:w-[540px] border-l-border/40 p-0 flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetHeader, { className: "border-b border-border/50 p-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { className: "text-2xl font-black uppercase tracking-tight", children: t("common.filters") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SheetDescription, { className: "text-[10px] font-bold text-muted-foreground uppercase tracking-widest", children: t("sales.filter_desc") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8 p-6 flex-1 overflow-y-auto", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-primary", children: t("sales.classification") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filterCategory, onValueChange: setFilterCategory, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-12 bg-muted/30 border-border/50 rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("sales.all_categories") }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-xl", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "All", children: t("sales.all_categories") }),
                    categories.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c.name, children: c.name }, c.id))
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-primary", children: t("sales.timeframe") }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("sales.start_date") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: filterStartDate, onChange: setFilterStartDate, className: "h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("sales.end_date") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: filterEndDate, onChange: setFilterEndDate, className: "h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-muted-foreground italic mt-1 leading-tight", children: t("sales.date_desc") })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SheetFooter, { className: "p-6 border-t border-border/50 bg-background/80 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 w-full", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outline",
                  className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl",
                  onClick: () => {
                    setFilterCategory(t("common.all"));
                    setFilterStartDate("");
                    setFilterEndDate("");
                  },
                  children: t("common.reset")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SheetClose, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl", children: t("common.apply") }) })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: loadDrafts, className: "h-8 text-[10px] font-bold uppercase tracking-widest px-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "mr-1.5 h-3.5 w-3.5" }),
          " ",
          t("sales.drafts") || "Drafts"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => {
          resetForm();
          setShowModal(true);
        }, className: "h-8 text-[10px] font-bold uppercase tracking-widest px-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-3.5 w-3.5" }),
          " ",
          t("sales.new_btn")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        DataTable,
        {
          columns,
          data: sales,
          title: t("sales.header")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 justify-end", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => exportSalesCSV(), className: "h-7 text-[10px] font-bold uppercase tracking-widest px-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 11, className: "mr-1" }),
          " CSV"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => exportSalesPDF(), className: "h-7 text-[10px] font-bold uppercase tracking-widest px-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 11, className: "mr-1" }),
          " PDF"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showModal, onClose: () => setShowModal(false), title: editingId ? t("sales.modify_transaction") : t("sales.new_session"), size: "xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col min-h-[60vh]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center gap-4 py-6 px-12 shrink-0 border-b border-border/40 bg-muted/5", children: [1, 2, 3].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs(React.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-10 w-10 rounded-full flex items-center justify-center font-black transition-all duration-300 ${currentStep === s ? "bg-primary text-primary-foreground shadow-lg scale-110" : currentStep > s ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`, children: currentStep > s ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-5 w-5" }) : s }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[10px] font-black uppercase tracking-widest ${currentStep === s ? "text-primary" : "text-muted-foreground"}`, children: s === 1 ? t("common.selection") : s === 2 ? t("common.review") : t("common.settlement") })
        ] }),
        s < 3 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-0.5 w-16 transition-colors duration-500 ${currentStep > s ? "bg-green-500" : "bg-muted"}` })
      ] }, s)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-hidden flex flex-col", children: [
        currentStep === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 p-8 space-y-6 flex flex-col items-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-xl space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground", children: t("sales.discovery") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "font-black text-[9px] h-5", children: [
                cart.length,
                " ",
                t("common.in_session")
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  placeholder: t("common.search_placeholder"),
                  className: "h-14 pl-12 bg-card rounded-2xl border-border shadow-sm text-lg",
                  value: itemSearchQuery,
                  onChange: (e) => setItemSearchQuery(e.target.value)
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 w-full max-w-xl rounded-3xl border border-border bg-muted/10 overflow-hidden flex flex-col", children: itemSearchQuery ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-2 custom-scrollbar", children: [
            items.filter((i) => i.name.toLowerCase().includes(itemSearchQuery.toLowerCase())).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => {
                  addToCart(String(item.id));
                  setItemSearchQuery("");
                },
                className: "w-full text-left p-4 rounded-xl hover:bg-card hover:shadow-sm transition-all border border-transparent hover:border-border group flex justify-between items-center",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-sm group-hover:text-primary", children: item.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" })
                ]
              },
              item.id
            )),
            items.filter((i) => i.name.toLowerCase().includes(itemSearchQuery.toLowerCase())).length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest", children: t("common.no_match") })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-16 rounded-full bg-card shadow-inner flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "h-8 w-8 text-primary/30" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-[0.2em] text-primary", children: t("sales.quick_selection") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground/60 leading-relaxed font-medium", children: t("sales.search_instantly") })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-xl pt-4 flex gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                className: "flex-1 py-3 text-xs font-black uppercase tracking-widest shadow-lg rounded-xl",
                disabled: cart.length === 0,
                onClick: () => setCurrentStep(2),
                children: [
                  t("sales.review_ledger"),
                  " (",
                  cart.length,
                  ")"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                className: "py-3 text-[10px] font-black uppercase tracking-widest rounded-xl",
                disabled: cart.length === 0,
                onClick: handleSaveDraft,
                children: t("sales.save_draft") || "Draft"
              }
            )
          ] })
        ] }),
        currentStep === 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 p-8 space-y-6 flex flex-col items-center overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-4xl flex items-center justify-between shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground", children: t("sales.ledger") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-black text-primary uppercase tracking-widest", children: [
              t("sales.subtotal"),
              ": ",
              t("common.etb"),
              " ",
              totals.subtotal.toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full max-w-5xl flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1.5", children: cart.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group p-2 px-4 rounded-xl border border-border/60 bg-card/50 hover:bg-card transition-all flex items-center gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { className: "h-3.5 w-3.5 text-primary/30" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-[200px]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[11px] leading-tight whitespace-nowrap overflow-visible", children: item.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5", children: [
                t("common.etb"),
                " ",
                item.price,
                " / ",
                item.unit
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center border border-border/40 rounded-lg bg-muted/20 overflow-hidden h-7", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => updateCartItem(item.itemId, { quantity: Math.max(1, item.quantity - 1) }), className: "px-2 hover:bg-muted text-[10px] font-bold", children: "-" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    className: "w-10 h-full text-center text-[10px] font-black bg-transparent border-none focus-visible:ring-0 px-0",
                    value: item.quantity,
                    onChange: (e) => updateCartItem(item.itemId, { quantity: parseFloat(e.target.value) || 0 })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => updateCartItem(item.itemId, { quantity: item.quantity + 1 }), className: "px-2 hover:bg-muted text-[10px] font-bold", children: "+" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: item.unitType,
                  onValueChange: (val) => updateCartItem(item.itemId, { unitType: val }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-7 w-20 text-[9px] font-black uppercase tracking-widest rounded-lg border-border/40 bg-card px-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "base", className: "text-[9px] uppercase font-bold", children: t("sales.individual") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "pack", className: "text-[9px] uppercase font-bold", children: t("sales.pack") })
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 text-right shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-black text-[11px] whitespace-nowrap", children: [
              t("common.etb"),
              " ",
              item.total.toLocaleString()
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => removeFromCart(item.itemId), className: "text-destructive/30 hover:text-destructive h-6 w-6 p-0 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" }) })
          ] }, item.itemId)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-4xl pt-4 flex gap-3 shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 h-10 text-[10px] font-black uppercase tracking-widest border-2 rounded-xl", onClick: () => setCurrentStep(1), children: t("sales.add_more") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", className: "h-10 text-[10px] font-black uppercase tracking-widest rounded-xl", onClick: handleSaveDraft, children: t("sales.save_draft") || "Draft" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 h-10 text-[10px] font-black uppercase tracking-widest shadow-lg rounded-xl", onClick: () => setCurrentStep(3), children: t("sales.proceed_settlement") })
          ] })
        ] }),
        currentStep === 3 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar flex flex-col items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-3xl space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2", children: t("sales.financial_adjustments") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-6 p-4 rounded-2xl bg-card border border-border shadow-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60", children: t("sales.discount_flat") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-10 bg-muted/10 font-bold border-none", placeholder: "0.00", type: "number", value: globalDiscount, onChange: (e) => setGlobalDiscount(e.target.value) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60", children: t("sales.vat_percent") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-10 bg-muted/10 font-bold border-none", placeholder: "15", type: "number", value: globalVAT, onChange: (e) => setGlobalVAT(e.target.value) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2", children: t("sales.customer_identity") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: t("sales.customer_name"), className: "h-10 pl-10 text-xs font-bold bg-card rounded-xl", value: customerInfo.name, onChange: (e) => setCustomerInfo({ ...customerInfo, name: e.target.value }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: t("sales.phone_number"), className: "h-10 pl-10 text-xs font-bold bg-card rounded-xl", value: customerInfo.phone, onChange: (e) => setCustomerInfo({ ...customerInfo, phone: e.target.value }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex bg-muted p-1 rounded-xl w-full md:col-span-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: !paymentInfo.isDebt ? "default" : "ghost", size: "sm", onClick: () => setPaymentInfo({ ...paymentInfo, isDebt: false }), className: "flex-1 h-8 text-[9px] font-black uppercase tracking-widest rounded-lg", children: t("sales.settled") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: paymentInfo.isDebt ? "destructive" : "ghost", size: "sm", onClick: () => {
                    const d = /* @__PURE__ */ new Date();
                    d.setDate(d.getDate() + 5);
                    setPaymentInfo({ ...paymentInfo, isDebt: true, dueDate: paymentInfo.dueDate || d.toISOString().split("T")[0] });
                  }, className: "flex-1 h-8 text-[9px] font-black uppercase tracking-widest rounded-lg", children: t("sales.debt") })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2", children: t("sales.payment_logistics") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: paymentInfo.method, onValueChange: (val) => setPaymentInfo({ ...paymentInfo, method: val }), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 bg-card text-xs font-bold rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-xl", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t("sales.cash"), children: t("sales.cash") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t("sales.bank_transfer"), children: t("sales.bank_transfer") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t("sales.check"), children: t("sales.check") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t("sales.other"), children: t("sales.other") })
                  ] })
                ] }),
                paymentInfo.isDebt && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { className: "h-10 bg-card border-destructive/20 rounded-xl text-xs", value: paymentInfo.dueDate, onChange: (e) => setPaymentInfo({ ...paymentInfo, dueDate: e }) }) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-6 p-6 rounded-[28px] bg-primary text-primary-foreground shadow-xl border border-primary-foreground/10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold uppercase tracking-[0.2em] text-primary-foreground/60", children: t("sales.subtotal") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-bold opacity-80", children: [
                t("common.etb"),
                " ",
                totals.subtotal.toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-px bg-primary-foreground/20" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end gap-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-black uppercase tracking-[0.2em] text-primary-foreground/60", children: t("sales.total_settlement") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-3xl font-black tracking-tight", children: [
                t("common.etb"),
                " ",
                totals.finalTotal.toLocaleString()
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-2 flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSubmit, className: "w-full h-10 text-xs font-black uppercase tracking-[0.2em] shadow-lg rounded-xl", disabled: cart.length === 0 || paymentInfo.isDebt && (!customerInfo.name || !customerInfo.phone || !paymentInfo.dueDate), children: t("sales.authorize") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: handleSaveDraft, className: "w-full h-9 text-[10px] font-black uppercase tracking-widest rounded-xl", disabled: cart.length === 0, children: t("sales.save_draft") || "Save as Draft" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: () => setCurrentStep(2), className: "w-full text-[9px] font-bold uppercase tracking-widest opacity-40 hover:bg-transparent h-7", children: t("sales.back_to_cart") })
          ] })
        ] }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showReceiptModal, onClose: () => setShowReceiptModal(false), title: t("sales.transaction_receipt"), size: "md", children: viewingSale && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-1 border-b border-dashed border-border pb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black tracking-tight uppercase", children: t("sales.receipt_header") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: [
          "ID: #REC-",
          viewingSale.id
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: new Date(viewingSale.createdAt).toLocaleString() })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-end border-b border-border/50 pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("sales.item_details") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-sm", children: viewingSale.itemName })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-black text-lg", children: [
            t("common.etb"),
            " ",
            viewingSale.totalPrice.toLocaleString()
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 text-xs font-medium", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-card border border-border/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1", children: t("sales.customer") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: viewingSale.customerName || t("sales.walk_in") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-card border border-border/50 text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1", children: t("sales.payment") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
              viewingSale.paymentMethod,
              " • ",
              viewingSale.paymentStatus
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => generateReceipt(viewingSale), className: "flex-1 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "mr-1.5 h-3.5 w-3.5" }),
          " ",
          t("common.print")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: () => setShowReceiptModal(false), className: "py-2.5 font-bold uppercase tracking-widest text-xs", children: t("common.done") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showReturnModal, onClose: () => setShowReturnModal(false), title: "Process Return", size: "sm", children: returnSale && /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleReturn, className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-muted/30 text-sm space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold", children: returnSale.itemName }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "Sale #",
          returnSale.id,
          " · ",
          returnSale.customerName || "Walk-in"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs", children: [
          "Original qty: ",
          returnSale.quantity,
          " · Total: ",
          t("common.etb"),
          " ",
          returnSale.totalPrice.toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Quantity to Return *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            required: true,
            type: "number",
            min: "1",
            max: returnSale.quantity,
            value: returnQty,
            onChange: (e) => setReturnQty(e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: [
          "Refund Amount (",
          t("common.etb"),
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "number",
            min: "0",
            value: returnRefund,
            onChange: (e) => setReturnRefund(e.target.value)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground", children: "Set to 0 for no refund (exchange only)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Reason" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: returnReason,
            onChange: (e) => setReturnReason(e.target.value),
            placeholder: "Defective, wrong item, customer request..."
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", className: "flex-1 h-9 text-[10px] font-bold uppercase tracking-widest", onClick: () => setShowReturnModal(false), children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "flex-1 h-9 text-[10px] font-bold uppercase tracking-widest", disabled: !returnQty || parseFloat(returnQty) < 1, children: "Process Return" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showDraftsModal, onClose: () => setShowDraftsModal(false), title: t("sales.draft_sales") || "Draft Sales", size: "lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: drafts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-12 text-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold uppercase tracking-widest text-xs", children: t("sales.no_drafts") || "No draft sales" }) }) : drafts.map((draft) => {
      const items2 = draft.items || [];
      const subtotal = items2.reduce((sum, c) => sum + c.quantity * c.price, 0);
      const totalDiscount = subtotal > 0 ? parseFloat(draft.discount) || 0 : 0;
      const vatRate = parseFloat(draft.vat) || 0;
      const totalVAT = (subtotal - totalDiscount) * (vatRate / 100);
      const total = subtotal - totalDiscount + totalVAT;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card/50 hover:bg-card transition-all", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-sm", children: draft.customerName || t("sales.walk_in") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5", children: [
            items2.length,
            " ",
            t("common.items") || "items",
            " · ",
            t("common.etb"),
            " ",
            total.toLocaleString()
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-muted-foreground mt-0.5", children: formatDate(draft.createdAt) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5 shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", onClick: () => resumeDraft(draft.id), className: "h-7 text-[9px] font-bold uppercase tracking-widest px-2", children: t("sales.resume") || "Resume" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "destructive", onClick: () => deleteDraft(draft.id), className: "h-7 w-7 p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" }) })
        ] })
      ] }, draft.id);
    }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SaleSuccessModal, { open: showSuccessModal, onClose: () => setShowSuccessModal(false), sale: lastSale })
  ] });
};
export {
  Sales as default
};
