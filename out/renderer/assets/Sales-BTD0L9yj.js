import { g as useSettings, r as reactExports, O as useAuth, j as jsxRuntimeExports, m as Badge, i as Button, a0 as Eye, y as Trash2, a2 as Sheet, a3 as SheetTrigger, a4 as Filter, a5 as SheetContent, a6 as SheetHeader, a7 as SheetTitle, a8 as SheetDescription, a9 as SheetFooter, aa as SheetClose, ab as FileText, x as Plus, M as Modal, ah as React, ai as Search, G as Input, w as ShoppingCart, X, H as toast, ag as playSound } from "./index-CqMtuUke.js";
import { E } from "./jspdf.es.min-C-KvxjzZ.js";
import { e as exportCSV, a as exportPDF } from "./export-utils-BkxDP03v.js";
import { u as useDataChangedRefresh } from "./useDataChangedRefresh-BQRADQai.js";
import { S as SectionCards } from "./section-cards-CGnkT6UE.js";
import { D as DataTable } from "./data-table-68iPNufp.js";
import { D as DatePicker } from "./DatePicker-Dr3PGhek.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-DbRJaTXm.js";
import { S as ShoppingBag, g as getDiscountCap, O as OVERRIDE_REASONS, R as RETURN_REASONS } from "./approvalPolicy-DnHRDIzj.js";
import "./field-normalize-B9pvaCC_.js";
import { c as computeTrend } from "./trend-utils-D_UP5BUt.js";
import { A as AlertDialog, h as AlertDialogTrigger, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-DPg8ap4S.js";
import { S as SaleSuccessModal } from "./SaleSuccessModal-BAXrOa3G.js";
import { U as User } from "./user-BMSsEqB4.js";
import { P as Printer } from "./printer-AHuaxysw.js";
import { S as SquarePen } from "./square-pen-CtGKYlEa.js";
import { U as Undo2 } from "./undo-2-6AaxRWRq.js";
import { C as CircleCheckBig } from "./circle-check-big-B-nfalbZ.js";
import { P as Phone } from "./phone-twt7eYfj.js";
import "./card-B5B59TB7.js";
import "./kpi-visibility-Cnq1TnVQ.js";
import "./trending-up-Co1HEDW7.js";
import "./label-Cf1pW99b.js";
import "./table-BU-EfSOq.js";
import "./tabs-D1HMu340.js";
let buffer = "";
let lastKeyTime = 0;
let active = false;
const MAX_GAP_MS = 60;
const MIN_LENGTH = 3;
function handler(e) {
  const now = Date.now();
  if (now - lastKeyTime > MAX_GAP_MS) buffer = "";
  lastKeyTime = now;
  if (e.key === "Enter") {
    const code = buffer;
    buffer = "";
    if (code.length >= MIN_LENGTH && active) {
      window.dispatchEvent(new CustomEvent("shega:barcode-scan", { detail: code }));
    }
    return;
  }
  if (e.key.length === 1) buffer += e.key;
}
function startBarcodeWedge() {
  if (active) return;
  active = true;
  window.addEventListener("keydown", handler);
}
function stopBarcodeWedge() {
  if (!active) return;
  active = false;
  window.removeEventListener("keydown", handler);
}
const Sales = () => {
  const { t, formatDate, formatDateTime, currentBusiness, isModuleEnabled, taxEnabled, taxRate } = useSettings();
  const [sales, setSales] = reactExports.useState([]);
  const [items, setItems] = reactExports.useState([]);
  const [isLoading, setIsLoading] = reactExports.useState(true);
  const [showModal, setShowModal] = reactExports.useState(false);
  const [searchQuery] = reactExports.useState("");
  const [categories, setCategories] = reactExports.useState([]);
  const [filterStartDate, setFilterStartDate] = reactExports.useState("");
  const [filterEndDate, setFilterEndDate] = reactExports.useState("");
  const [filterCategory, setFilterCategory] = reactExports.useState("All");
  const [isFilterOpen, setIsFilterOpen] = reactExports.useState(false);
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
  const [returnCustomReason, setReturnCustomReason] = reactExports.useState("");
  const [returnRefund, setReturnRefund] = reactExports.useState("");
  const [drafts, setDrafts] = reactExports.useState([]);
  const [showDraftsModal, setShowDraftsModal] = reactExports.useState(false);
  const [showSuccessModal, setShowSuccessModal] = reactExports.useState(false);
  const [lastSale, setLastSale] = reactExports.useState(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = reactExports.useState(false);
  const { currentAdmin, isCashier } = useAuth();
  const [overrideReason, setOverrideReason] = reactExports.useState("");
  reactExports.useEffect(() => {
    loadData();
  }, [searchQuery, filterCategory, filterStartDate, filterEndDate]);
  useDataChangedRefresh(() => {
    loadData();
  });
  reactExports.useEffect(() => {
    startBarcodeWedge();
    const onScan = (e) => {
      const code = e.detail;
      if (!code) return;
      window.api?.getItemByBarcode(code).then((item) => {
        if (!item) {
          toast.error(`Product not found for barcode ${code}`, { description: "Search manually or add the product in Inventory." });
          return;
        }
        addToCart(String(item.id));
        toast.success(`${item.name} added to cart`);
      });
    };
    window.addEventListener("shega:barcode-scan", onScan);
    return () => {
      stopBarcodeWedge();
      window.removeEventListener("shega:barcode-scan", onScan);
    };
  }, [cart, items]);
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [salesData, itemsData, catsData] = await Promise.all([
        window.api?.getSales({ search: searchQuery, category: filterCategory, startDate: filterStartDate, endDate: filterEndDate }) || Promise.resolve([]),
        window.api?.getItems({}) || Promise.resolve([]),
        window.api?.getCategories() || Promise.resolve([])
      ]);
      setSales(salesData);
      setItems(itemsData);
      setCategories(Array.isArray(catsData) ? catsData : []);
    } finally {
      setIsLoading(false);
    }
  };
  const kpiCards = reactExports.useMemo(() => {
    const total = sales.reduce((sum, s) => sum + s.totalPrice, 0);
    const profit = sales.reduce((sum, s) => {
      const cost = s.costAtTimeOfSale || (s.basePurchasePrice || 0) * s.quantity;
      return sum + (s.totalPrice - (s.discount || 0) - (s.vat || 0) - cost);
    }, 0);
    const outDebt = sales.filter((s) => s.paymentStatus === "Debt" || s.paymentStatus === t("sales.debt"));
    const totalOutstanding = outDebt.reduce((sum, s) => sum + (s.totalPrice - s.paidAmount), 0);
    const revenueTrend = computeTrend(sales, "createdAt", (s) => s.totalPrice);
    const profitTrend = computeTrend(sales, "createdAt", (s) => {
      const cost = s.costAtTimeOfSale || (s.basePurchasePrice || 0) * s.quantity;
      return s.totalPrice - (s.discount || 0) - (s.vat || 0) - cost;
    });
    const txTrend = computeTrend(sales, "createdAt", () => 1);
    const outTrend = computeTrend(outDebt, "createdAt", (s) => s.totalPrice - s.paidAmount);
    return [
      ...!isCashier ? [{
        title: t("sales.revenue"),
        value: `${t("common.etb")} ${total.toLocaleString()}`,
        ...revenueTrend,
        footerTitle: t("sales.transactions"),
        footerSub: t("customers.last_30")
      }] : [],
      ...!isCashier ? [{
        title: t("sales.profit"),
        value: `${t("common.etb")} ${profit.toLocaleString()}`,
        ...profitTrend,
        footerTitle: t("inventory.margin"),
        footerSub: t("sales.healthy_growth")
      }] : [],
      {
        title: t("sales.transactions"),
        value: sales.length,
        ...txTrend,
        footerTitle: t("sales.order_freq"),
        footerSub: t("sales.high_activity")
      },
      ...isModuleEnabled("customers") ? [{
        title: t("sales.outstanding"),
        value: `${t("common.etb")} ${totalOutstanding.toLocaleString()}`,
        ...outTrend,
        footerTitle: t("sales.debt"),
        footerSub: t("customers.active_ledgers")
      }] : []
    ];
  }, [sales, isModuleEnabled, isCashier]);
  const columns = [
    {
      accessorKey: "itemName",
      header: t("sales.transaction_details"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-muted overflow-hidden", children: row.original.itemImage ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: row.original.itemImage, alt: "", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { className: "h-5 w-5 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: row.original.itemName }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground uppercase font-bold tracking-widest", children: [
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
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: row.original.paymentStatus === "Paid" || row.original.paymentStatus === t("sales.paid") ? "default" : "destructive", className: "uppercase text-xs font-bold", children: row.original.paymentStatus === "Paid" || row.original.paymentStatus === t("sales.paid") ? t("sales.paid") : t("sales.debt") }),
        row.original.status === "Voided" && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "destructive", className: "text-xs font-black uppercase", children: t("sales.voided_badge", "Voided") })
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
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "text-amber-500 hover:bg-amber-500/10", onClick: () => openReturn(row.original), title: t("common.return"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Undo2, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "text-destructive hover:bg-destructive/10", title: t("common.delete"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { className: "rounded-[32px] bg-background border-border shadow-2xl", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { className: "text-xl font-black uppercase tracking-tight", children: t("sales.revoke_title") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { className: "text-xs font-medium text-muted-foreground leading-relaxed", children: t("sales.revoke_desc") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { className: "gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { className: "rounded-xl border-border h-11 text-xs font-black uppercase tracking-widest", children: t("common.abort") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                AlertDialogAction,
                {
                  onClick: () => handleDelete(row.original.id),
                  className: "rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-xs font-black uppercase tracking-widest",
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
    const maxQty = item.totalBaseQuantity;
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
      unitType: "base",
      unit: item.baseUnit,
      price: item.baseSellingPrice,
      baseSellingPrice: item.baseSellingPrice,
      discount: 0,
      vat: 0,
      total: item.baseSellingPrice
    };
    setCart([...cart, newItem]);
  };
  const updateCartItem = (itemId, updates) => {
    setCart(cart.map((c) => {
      if (c.itemId === itemId) {
        const item = items.find((i) => i.id === itemId);
        const updated = { ...c, ...updates };
        if (item) {
          if (updated.quantity > item.totalBaseQuantity) {
            updated.quantity = item.totalBaseQuantity;
          }
        }
        const price = item?.baseSellingPrice;
        updated.price = price || 0;
        updated.unit = item?.baseUnit;
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
  const isApprover = ["Owner", "Administrator", "Manager", "super_admin", "admin"].includes(currentAdmin?.role || "");
  const discountCap = isApprover ? null : getDiscountCap((currentAdmin?.role || "").toLowerCase());
  const overCapLines = reactExports.useMemo(() => {
    if (discountCap === null) return [];
    const cartSub = cart.reduce((sum, c) => sum + (c.quantity * c.price - c.discount + c.vat), 0);
    const globalDisc = parseFloat(globalDiscount) || 0;
    return cart.map((c) => {
      const itemSubtotal = c.quantity * c.price - c.discount + c.vat;
      const ratio = cartSub > 0 ? itemSubtotal / cartSub : 0;
      const effDisc = (parseFloat(c.discount) || 0) + ratio * globalDisc;
      const basePrice = c.baseSellingPrice || c.price;
      const pct = basePrice > 0 ? effDisc / (c.quantity * basePrice) * 100 : 0;
      return { itemId: c.itemId, name: c.name, pct, disc: effDisc };
    }).filter((l) => l.disc > 0 && l.pct > discountCap);
  }, [cart, globalDiscount, discountCap]);
  const overCapRequired = overCapLines.length > 0;
  const overCapMaxPct = overCapLines.reduce((max, l) => Math.max(max, l.pct), 0);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    const cartSubtotal = cart.reduce((sum, c) => sum + (c.quantity * c.price - c.discount + c.vat), 0);
    const globalDiscVal = parseFloat(globalDiscount) || 0;
    const globalVATVal = parseFloat(globalVAT) || 0;
    const salesToInsert = cart.map((c) => {
      const itemSubtotal = c.quantity * c.price - c.discount + c.vat;
      const ratio = cartSubtotal > 0 ? itemSubtotal / cartSubtotal : 0;
      const propDiscount = ratio * globalDiscVal;
      const propVAT = ratio * globalVATVal;
      return {
        itemId: c.itemId,
        quantity: c.quantity,
        unit: c.unit,
        unitType: c.unitType,
        discount: c.discount + propDiscount,
        vat: c.vat + propVAT,
        totalPrice: itemSubtotal - propDiscount + propVAT,
        paymentMethod: paymentInfo.method,
        paymentStatus: paymentInfo.isDebt ? "Debt" : "Paid",
        customerName: customerInfo.name?.trim() || null,
        customerPhone: customerInfo.phone?.trim() || null,
        dueDate: paymentInfo.isDebt ? paymentInfo.dueDate : null,
        paidAmount: paymentInfo.isDebt ? 0 : itemSubtotal - propDiscount + propVAT,
        overrideReason: overCapRequired ? overrideReason || "Over-limit discount" : void 0
      };
    });
    const insertedIds = await window.api?.insertSalesBatch(salesToInsert);
    playSound("nice");
    setShowModal(false);
    resetForm();
    loadData();
    const totalPrice = salesToInsert.reduce((sum, s) => sum + s.totalPrice, 0);
    const itemCount = salesToInsert.reduce((sum, s) => sum + s.quantity, 0);
    setLastSale({
      id: insertedIds?.[0] || Date.now(),
      totalPrice,
      itemCount,
      paymentMethod: paymentInfo.method,
      paymentStatus: paymentInfo.isDebt ? "Debt" : "Paid",
      paidAmount: paymentInfo.isDebt ? 0 : totalPrice,
      customerName: customerInfo.name?.trim() || t("summary.walk_in"),
      items: cart.map((c) => ({ name: c.name, quantity: c.quantity, price: c.price }))
    });
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
        price: item.baseSellingPrice,
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
    setGlobalVAT(taxEnabled ? String(taxRate) : "0");
    setOverrideReason("");
    setEditingId(null);
    setCurrentStep(1);
    setItemSearchQuery("");
  };
  const handleModalClose = () => {
    if (cart.length > 0) {
      setShowDiscardConfirm(true);
    } else {
      setShowModal(false);
    }
  };
  const confirmDiscard = () => {
    setShowDiscardConfirm(false);
    resetForm();
    setShowModal(false);
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
    doc.text(t("pdf.receipt", "RECEIPT"), pageWidth / 2, y, { align: "center" });
    y += 7;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(t("pdf.receipt_id", "#REC-{id}", { id: sale.id }), pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.setDrawColor(0);
    doc.line(3, y, pageWidth - 3, y);
    y += 4;
    doc.setFontSize(7);
    doc.text(t("pdf.date", "Date: {date}", { date: formatDateTime(sale.createdAt) }), 3, y);
    y += 4;
    doc.text(t("pdf.customer", "Customer: {name}", { name: sale.customerName || t("sales.walk_in") }), 3, y);
    y += 4;
    if (sale.customerPhone) {
      doc.text(t("pdf.phone", "Phone: {phone}", { phone: sale.customerPhone }), 3, y);
      y += 4;
    }
    doc.line(3, y, pageWidth - 3, y);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text(t("pdf.item", "Item"), 3, y);
    doc.text(t("pdf.qty", "Qty"), 40, y);
    doc.text(t("pdf.price", "Price"), 55, y);
    doc.text(t("pdf.total", "Total"), 68, y, { align: "right" });
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
    doc.text(t("pdf.total_label", "Total: {currency} {amount}", { currency: t("common.etb"), amount: sale.totalPrice.toFixed(2) }), 3, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(t("pdf.payment", "Payment: {method}", { method: sale.paymentMethod }), 3, y);
    y += 4;
    doc.text(t("pdf.paid", "Paid: {currency} {amount}", { currency: t("common.etb"), amount: (sale.paidAmount || sale.totalPrice).toFixed(2) }), 3, y);
    y += 4;
    if (sale.paymentStatus === "Debt") {
      doc.text(t("pdf.due", "Due: {currency} {amount}", { currency: t("common.etb"), amount: (sale.totalPrice - (sale.paidAmount || 0)).toFixed(2) }), 3, y);
      y += 4;
    }
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text(t("pdf.thanks", "Thank you for your business!"), pageWidth / 2, y, { align: "center" });
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
    const reason = returnReason === "other" && returnCustomReason.trim() ? returnCustomReason.trim() : returnReason;
    if (!reason) {
      toast.error(t("sales.return_reason_required", "A reason is required for a return"));
      return;
    }
    const result = await window.api?.createReturn({
      saleId: returnSale.id,
      quantity: parseFloat(returnQty),
      refundAmount: parseFloat(returnRefund) || 0,
      reason
    });
    if (result?.success) {
      toast.success(t("sales.return_success", "Return processed successfully"));
      setShowReturnModal(false);
      loadData();
    } else {
      toast.error(result?.error || t("sales.return_failed", "Return failed"));
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
    let parsedItems = [];
    try {
      parsedItems = typeof draft.items === "string" ? JSON.parse(draft.items) : draft.items || [];
    } catch {
      console.error("Failed to parse draft items, draft may be corrupted");
      toast.error("Failed to load draft sale");
      return;
    }
    if (!Array.isArray(parsedItems)) {
      console.error("Parsed draft items is not an array");
      toast.error("Failed to load draft sale");
      return;
    }
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
    toast.success(t("sales.draft_saved", "Draft saved"));
    setShowModal(false);
    resetForm();
  };
  const deleteDraft = async (id) => {
    await window.api?.deleteDraftSale(id);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };
  const exportSalesCSV = () => {
    exportCSV(
      [t("common.id"), t("common.item", "Item"), t("inventory.qty"), t("inventory.unit"), t("common.total"), t("sales.payment"), t("common.status"), t("sales.customer"), t("common.date")],
      sales.map((s) => [s.id, s.itemName, s.quantity, s.unit, s.totalPrice, s.paymentMethod, s.paymentStatus, s.customerName || t("sales.walk_in"), s.createdAt]),
      "sales-report"
    );
  };
  const exportSalesPDF = () => {
    exportPDF(
      t("data_transfer.sales_report"),
      [t("common.id"), t("common.item", "Item"), t("inventory.qty"), t("inventory.unit"), t("common.total"), t("sales.payment"), t("common.status"), t("sales.customer"), t("common.date")],
      sales.map((s) => [s.id, s.itemName, s.quantity, s.unit, s.totalPrice, s.paymentMethod, s.paymentStatus, s.customerName || t("sales.walk_in"), s.createdAt]),
      "sales-report",
      ["", "", "", "", sales.reduce((sum, s) => sum + s.totalPrice, 0).toLocaleString(), "", "", "", ""]
    );
    toast.success(t("sales.export_success", "Report exported successfully"));
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCards, { cards: kpiCards, storageKey: "sales" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Sheet, { open: isFilterOpen, onOpenChange: setIsFilterOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: `h-8 px-3 transition-all ${filterCategory !== "All" && filterCategory !== t("common.all") || filterStartDate || filterEndDate ? "border-primary text-primary bg-primary/5 shadow-sm" : "border-border/60 hover:bg-muted/50"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { className: "mr-1.5 h-3.5 w-3.5" }),
            t("common.filters"),
            " ",
            (filterCategory !== "All" || filterStartDate || filterEndDate) && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "ml-1.5 h-4 px-1 text-xs rounded-full", children: t("inventory.active") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { side: "right", className: "w-[400px] sm:w-[540px] border-l-border/40 p-0 flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetHeader, { className: "border-b border-border/50 p-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { className: "text-2xl font-black uppercase tracking-tight", children: t("common.filters") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SheetDescription, { className: "text-xs font-bold text-muted-foreground uppercase tracking-widest", children: t("sales.filter_desc") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8 p-6 flex-1 overflow-y-auto", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-primary", children: t("sales.classification") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filterCategory, onValueChange: setFilterCategory, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-12 bg-muted/30 border-border/50 rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("sales.all_categories") }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-xl", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "All", children: t("sales.all_categories") }),
                    categories.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c.name, children: c.name }, c.id))
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-primary", children: t("sales.timeframe") }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("sales.start_date") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: filterStartDate, onChange: setFilterStartDate, className: "h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("sales.end_date") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: filterEndDate, onChange: setFilterEndDate, className: "h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground italic mt-1 leading-tight", children: t("sales.date_desc") })
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
              /* @__PURE__ */ jsxRuntimeExports.jsx(SheetClose, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 py-3 tracking-widest rounded-xl shadow-xl", children: t("common.apply") }) })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: loadDrafts, className: "h-8 text-xs font-bold tracking-widest px-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "mr-1.5 h-3.5 w-3.5" }),
          " ",
          t("sales.drafts")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => {
          resetForm();
          setShowModal(true);
        }, className: "h-8 text-xs font-bold tracking-widest px-3", children: [
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
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => exportSalesCSV(), className: "h-7 text-xs font-bold tracking-widest px-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 11, className: "mr-1" }),
          " ",
          t("reports.csv")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => exportSalesPDF(), className: "h-7 text-xs font-bold tracking-widest px-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 11, className: "mr-1" }),
          " ",
          t("reports.pdf")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showModal, onClose: handleModalClose, title: editingId ? t("sales.modify_transaction") : t("sales.new_session"), size: "xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col min-h-[60vh]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center gap-4 py-6 px-12 shrink-0 border-b border-border/40 bg-muted/5", children: [1, 2, 3].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs(React.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-10 w-10 rounded-full flex items-center justify-center font-black transition-all duration-300 ${currentStep === s ? "bg-primary text-primary-foreground shadow-lg scale-110" : currentStep > s ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`, children: currentStep > s ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-5 w-5" }) : s }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-black uppercase tracking-widest ${currentStep === s ? "text-primary" : "text-muted-foreground"}`, children: s === 1 ? t("common.selection") : s === 2 ? t("common.review") : t("common.settlement") })
        ] }),
        s < 3 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-0.5 w-16 transition-colors duration-500 ${currentStep > s ? "bg-green-500" : "bg-muted"}` })
      ] }, s)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-hidden flex flex-col", children: [
        currentStep === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 p-8 space-y-6 flex flex-col items-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-xl space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-muted-foreground", children: t("sales.discovery") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "font-black text-xs h-5", children: [
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
            items.filter((i) => i.name.toLowerCase().includes(itemSearchQuery.toLowerCase())).map((item) => {
              const isOutOfStock = item.totalBaseQuantity === 0;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => {
                    if (!isOutOfStock) {
                      addToCart(String(item.id));
                      setItemSearchQuery("");
                    }
                  },
                  className: `w-full text-left p-4 rounded-xl transition-all border flex justify-between items-center ${isOutOfStock ? "opacity-40 cursor-not-allowed" : "hover:bg-card hover:shadow-sm border-transparent hover:border-border group"}`,
                  disabled: isOutOfStock,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `font-bold text-sm ${isOutOfStock ? "text-muted-foreground" : "group-hover:text-primary"}`, children: item.name }),
                    isOutOfStock ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("sales.out_of_stock", "Out of Stock") }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" })
                  ]
                },
                item.id
              );
            }),
            items.filter((i) => i.name.toLowerCase().includes(itemSearchQuery.toLowerCase())).length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest", children: t("common.no_match") })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-16 rounded-full bg-card shadow-inner flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "h-8 w-8 text-primary/30" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-[0.2em] text-primary", children: t("sales.quick_selection") }),
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
                className: "py-3 text-xs font-black uppercase tracking-widest rounded-xl",
                disabled: cart.length === 0,
                onClick: handleSaveDraft,
                children: t("sales.save_draft")
              }
            )
          ] })
        ] }),
        currentStep === 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 p-8 space-y-6 flex flex-col items-center overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-4xl flex items-center justify-between shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-muted-foreground", children: t("sales.ledger") }),
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
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5", children: [
                t("common.etb"),
                " ",
                item.price,
                " / ",
                item.unit
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center border border-border/40 rounded-lg bg-muted/20 overflow-hidden h-7", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => updateCartItem(item.itemId, { quantity: Math.max(1, item.quantity - 1) }), className: "px-2 hover:bg-muted text-xs font-bold", children: "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  className: "w-10 h-full text-center text-xs font-black bg-transparent border-none focus-visible:ring-0 px-0",
                  value: item.quantity,
                  onChange: (e) => updateCartItem(item.itemId, { quantity: parseFloat(e.target.value) || 0 })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => updateCartItem(item.itemId, { quantity: item.quantity + 1 }), className: "px-2 hover:bg-muted text-xs font-bold", children: "+" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 text-right shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-black text-[11px] whitespace-nowrap", children: [
              t("common.etb"),
              " ",
              item.total.toLocaleString()
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => removeFromCart(item.itemId), className: "text-destructive/30 hover:text-destructive h-6 w-6 p-0 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" }) })
          ] }, item.itemId)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-4xl pt-4 flex gap-3 shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 h-10 text-xs tracking-widest border-2 rounded-xl", onClick: () => setCurrentStep(1), children: t("sales.add_more") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", className: "h-10 text-xs tracking-widest rounded-xl", onClick: handleSaveDraft, children: t("sales.save_draft") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 h-10 text-xs tracking-widest shadow-lg rounded-xl", onClick: () => setCurrentStep(3), children: t("sales.proceed_settlement") })
          ] })
        ] }),
        currentStep === 3 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar flex flex-col items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-3xl space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2", children: t("sales.financial_adjustments") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-6 p-4 rounded-2xl bg-card border border-border shadow-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60", children: t("sales.discount_flat") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-10 bg-muted/10 font-bold border-none", placeholder: "0.00", type: "number", value: globalDiscount, onChange: (e) => setGlobalDiscount(e.target.value) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60", children: t("sales.vat_percent") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-10 bg-muted/10 font-bold border-none", placeholder: "15", type: "number", value: globalVAT, onChange: (e) => setGlobalVAT(e.target.value), disabled: !taxEnabled }),
                  !taxEnabled && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60", children: t("sales.tax_disabled_hint", "Tax is disabled in Settings") }),
                  taxEnabled && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60", children: t("sales.tax_default_hint", "Default {rate}% from Settings", { rate: String(taxRate) }) })
                ] })
              ] })
            ] }),
            isModuleEnabled("customers") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2", children: t("sales.customer_identity") }),
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
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: !paymentInfo.isDebt ? "default" : "ghost", size: "sm", onClick: () => setPaymentInfo({ ...paymentInfo, isDebt: false }), className: "flex-1 h-8 text-xs tracking-widest rounded-lg", children: t("sales.settled") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: paymentInfo.isDebt ? "destructive" : "ghost", size: "sm", onClick: () => {
                    const d = /* @__PURE__ */ new Date();
                    d.setDate(d.getDate() + 5);
                    setPaymentInfo({ ...paymentInfo, isDebt: true, dueDate: paymentInfo.dueDate || d.toISOString().split("T")[0] });
                  }, className: "flex-1 h-8 text-xs font-black uppercase tracking-widest rounded-lg", children: t("sales.debt") })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2", children: t("sales.payment_logistics") }),
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
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-6 p-6 rounded-[28px] bg-primary text-primary-foreground shadow-xl border border-primary-foreground/10", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/60", children: t("sales.subtotal") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-bold opacity-80", children: [
                  t("common.etb"),
                  " ",
                  totals.subtotal.toLocaleString()
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-px bg-primary-foreground/20" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end gap-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-black uppercase tracking-[0.2em] text-primary-foreground/60", children: t("sales.total_settlement") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-3xl font-black tracking-tight", children: [
                  t("common.etb"),
                  " ",
                  totals.finalTotal.toLocaleString()
                ] })
              ] })
            ] }),
            overCapRequired && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl leading-none", children: "⚠" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] leading-relaxed text-amber-700", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-black uppercase tracking-widest", children: t("sales.discount_limit_title", "Discount Above Limit") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: t("sales.discount_limit_desc", "Your discount of {pct}% exceeds the {cap}% limit for your role. Manager approval will be required at checkout.", { pct: Math.round(overCapMaxPct), cap: discountCap }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: overrideReason || OVERRIDE_REASONS[0].value, onValueChange: setOverrideReason, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full h-9 bg-card text-xs rounded-xl border-amber-500/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("sales.override_reason_placeholder", "Select override reason…") }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: OVERRIDE_REASONS.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: r.value, children: r.label }, r.value)) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-2 flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSubmit, className: "w-full h-10 text-xs tracking-[0.2em] shadow-lg rounded-xl", disabled: cart.length === 0 || paymentInfo.isDebt && (!customerInfo.name || !customerInfo.phone || !paymentInfo.dueDate), children: t("sales.authorize") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: handleSaveDraft, className: "w-full h-9 text-xs tracking-widest rounded-xl", disabled: cart.length === 0, children: t("sales.save_draft") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: () => setCurrentStep(2), className: "w-full text-xs font-bold tracking-widest opacity-40 hover:bg-transparent h-7", children: t("sales.back_to_cart") })
          ] })
        ] }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: showDiscardConfirm, onOpenChange: setShowDiscardConfirm, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { className: "rounded-[32px] bg-background border-border shadow-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { className: "text-xl font-black uppercase tracking-tight", children: t("sales.discard_title", "Discard Sale?") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { className: "text-xs font-medium text-muted-foreground leading-relaxed", children: t("sales.discard_desc", "You have items in your cart. Are you sure you want to discard this sale?") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { className: "gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { className: "rounded-xl border-border h-11 text-xs font-black uppercase tracking-widest", children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AlertDialogAction,
          {
            onClick: confirmDiscard,
            className: "rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-xs font-black uppercase tracking-widest",
            children: t("common.discard", "Discard")
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showReceiptModal, onClose: () => setShowReceiptModal(false), title: t("sales.transaction_receipt"), size: "md", children: viewingSale && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-1 border-b border-dashed border-border pb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black tracking-tight uppercase", children: t("sales.receipt_header") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("sales.receipt_id_label", "ID: #REC-{id}", { id: viewingSale.id }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: formatDateTime(viewingSale.createdAt) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-end border-b border-border/50 pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("sales.item_details") }),
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
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-1", children: t("sales.customer") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: viewingSale.customerName || t("sales.walk_in") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-card border border-border/50 text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-1", children: t("sales.payment") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
              viewingSale.paymentMethod,
              " • ",
              viewingSale.paymentStatus
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => generateReceipt(viewingSale), className: "flex-1 py-2.5 rounded-xl font-bold tracking-widest text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "mr-1.5 h-3.5 w-3.5" }),
          " ",
          t("common.print")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: () => setShowReceiptModal(false), className: "py-2.5 font-bold tracking-widest text-xs", children: t("common.done") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showReturnModal, onClose: () => setShowReturnModal(false), title: t("sales.process_return", "Process Return"), size: "sm", children: returnSale && /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleReturn, className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-muted/30 text-sm space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold", children: returnSale.itemName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("sales.return_sale_info", "Sale #{id} · {customer}", { id: returnSale.id, customer: returnSale.customerName || t("sales.walk_in") }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs", children: t("sales.original_qty_total", "Original qty: {qty} · Total: {total}", { qty: returnSale.quantity, total: `${t("common.etb")} ${returnSale.totalPrice.toLocaleString()}` }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: [
          t("sales.quantity_to_return", "Quantity to Return"),
          " *"
        ] }),
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
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("sales.refund_amount") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "number",
            min: "0",
            value: returnRefund,
            onChange: (e) => setReturnRefund(e.target.value)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("sales.return_refund_hint", "Set to 0 for no refund (exchange only)") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: [
          t("sales.return_reason_label", "Reason"),
          " *"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: returnReason, onValueChange: (v) => {
          setReturnReason(v);
          if (v !== "other") setReturnCustomReason("");
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("sales.return_reason_placeholder", "Select a reason…") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: RETURN_REASONS.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: r.value, children: r.label }, r.value)) })
        ] }),
        returnReason === "other" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: returnCustomReason,
            onChange: (e) => setReturnCustomReason(e.target.value),
            placeholder: t("sales.return_reason_other", "Describe the reason…")
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", className: "flex-1 h-9 text-xs font-bold tracking-widest", onClick: () => setShowReturnModal(false), children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "flex-1 h-9 text-xs font-bold tracking-widest", disabled: !returnQty || parseFloat(returnQty) < 1 || !returnReason || returnReason === "other" && !returnCustomReason.trim(), children: t("sales.process_return", "Process Return") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showDraftsModal, onClose: () => setShowDraftsModal(false), title: t("sales.draft_sales"), size: "lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: drafts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-12 text-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold uppercase tracking-widest text-xs", children: t("sales.no_drafts") }) }) : drafts.map((draft) => {
      const items2 = draft.items || [];
      const subtotal = items2.reduce((sum, c) => sum + c.quantity * c.price, 0);
      const totalDiscount = subtotal > 0 ? parseFloat(draft.discount) || 0 : 0;
      const vatRate = parseFloat(draft.vat) || 0;
      const totalVAT = (subtotal - totalDiscount) * (vatRate / 100);
      const total = subtotal - totalDiscount + totalVAT;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card/50 hover:bg-card transition-all", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-sm", children: draft.customerName || t("sales.walk_in") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground font-bold uppercase tracking-widest mt-0.5", children: [
            items2.length,
            " ",
            t("common.items"),
            " · ",
            t("common.etb"),
            " ",
            total.toLocaleString()
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: formatDate(draft.createdAt) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5 shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", onClick: () => resumeDraft(draft.id), className: "h-7 text-xs font-bold tracking-widest px-2", children: t("sales.resume") }),
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
