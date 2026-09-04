import { c as createLucideIcon, b as useSettings, n as useAuth, r as reactExports, j as jsxRuntimeExports, i as Truck, e as Button, Z as Download, B as Bell, U as Users, a9 as Search, V as Input, R as RefreshCw, g as Badge, x as Eye, aY as Archive, q as RotateCcw, y as Trash2, aZ as ChevronLeft, aW as ChevronRight, ae as CreditCard, az as Building2, h as Clock, M as Modal, _ as toast } from "./index-D0em7kRt.js";
import { E, b as addPdfHeader, c as autoTable } from "./export-utils-UNhTk_Ak.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-CXuVPKuV.js";
import { L as Label } from "./label-BY5hKnMF.js";
import { T as Textarea } from "./textarea-DCtXuZEG.js";
import { D as DatePicker } from "./DatePicker-Cwt8y7qq.js";
import { C as Card, c as CardContent, a as CardHeader, b as CardTitle } from "./card-BfGvUZ57.js";
import { P as Printer } from "./printer-CWZfV16x.js";
import { P as Plus } from "./plus-C617I_e3.js";
import { C as CircleCheckBig } from "./circle-check-big-Dl2I80yP.js";
import { D as DollarSign } from "./dollar-sign-CvQgKi6T.js";
import { T as TrendingUp } from "./trending-up-C2WkiYxx.js";
import { S as SquarePen } from "./square-pen-6l_TlOyD.js";
import { P as Phone } from "./phone-B2Zw7qXS.js";
import { M as Mail } from "./mail-DyL2xS1o.js";
import { M as MapPin } from "./map-pin-Dlwc8E80.js";
import { B as Ban } from "./ban-CpRWeY5L.js";
import { C as Calendar } from "./calendar-CJUwBmhR.js";
import "./select-D9ZBWN4s.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Heart = createLucideIcon("Heart", [
  [
    "path",
    {
      d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
      key: "c3ymky"
    }
  ]
]);
const PAYMENT_METHODS = ["cash", "bank_transfer", "mobile_money", "check", "other"];
const PAYMENT_METHOD_LABELS = {
  cash: "payment_cash",
  bank_transfer: "payment_bank",
  mobile_money: "payment_mobile",
  check: "payment_check",
  other: "payment_other"
};
const ROWS_PER_PAGE = 50;
const DEFAULT_FORM = {
  supplierName: "",
  companyName: "",
  contactPerson: "",
  phone: "",
  secondaryPhone: "",
  email: "",
  address: "",
  city: "",
  country: "Ethiopia",
  taxNumber: "",
  paymentTerms: "Net 30",
  creditLimit: 0,
  notes: "",
  status: "active"
};
const Suppliers = () => {
  const { t, formatDate, currency, currentBusiness } = useSettings();
  const { hasPermission } = useAuth();
  const [view, setView] = reactExports.useState("list");
  const [suppliers, setSuppliers] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [page, setPage] = reactExports.useState(0);
  const [search, setSearch] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("active");
  const [balanceFilter, setBalanceFilter] = reactExports.useState("all");
  const [sortBy, setSortBy] = reactExports.useState("name");
  const [selected, setSelected] = reactExports.useState(null);
  const [selectedProducts, setSelectedProducts] = reactExports.useState([]);
  const [form, setForm] = reactExports.useState(DEFAULT_FORM);
  const [editingId, setEditingId] = reactExports.useState(null);
  const [toastState, setToastState] = reactExports.useState(null);
  const [showPaymentModal, setShowPaymentModal] = reactExports.useState(false);
  const [editingPayment, setEditingPayment] = reactExports.useState(null);
  const [paymentForm, setPaymentForm] = reactExports.useState({
    paymentDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    referenceNumber: "",
    amount: "",
    paymentMethod: "cash",
    notes: "",
    purchaseId: ""
  });
  const [selectedSupplierPayments, setSelectedSupplierPayments] = reactExports.useState([]);
  const [selectedSupplierPurchases, setSelectedSupplierPurchases] = reactExports.useState([]);
  const [dashboardStats, setDashboardStats] = reactExports.useState(null);
  const [supplierActivity, setSupplierActivity] = reactExports.useState([]);
  const [selectedIds, setSelectedIds] = reactExports.useState([]);
  const searchInputRef = reactExports.useRef(null);
  const [priceChecks, setPriceChecks] = reactExports.useState([]);
  const [showPriceCheckModal, setShowPriceCheckModal] = reactExports.useState(false);
  const [items, setItems] = reactExports.useState([]);
  const [priceCheckForm, setPriceCheckForm] = reactExports.useState({
    supplierId: 0,
    itemId: "",
    frequency: "weekly",
    notes: "",
    active: true
  });
  const cur = currency || "ETB";
  const [reversePaymentTarget, setReversePaymentTarget] = reactExports.useState(null);
  const [reversePaymentReason, setReversePaymentReason] = reactExports.useState("");
  const showToast = reactExports.useCallback((message, type = "success") => {
    setToastState({ message, type });
    setTimeout(() => setToastState(null), 3500);
  }, []);
  const loadSuppliers = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.api.getSuppliers({
        search: search || void 0,
        status: statusFilter === "all" ? void 0 : statusFilter,
        limit: 1e4,
        offset: 0
      });
      let rows = result.rows || [];
      if (balanceFilter === "paid") rows = rows.filter((s) => (s.outstandingBalance || 0) <= 0);
      if (balanceFilter === "unpaid") rows = rows.filter((s) => (s.outstandingBalance || 0) >= (s.totalPurchases || 0) && (s.totalPurchases || 0) > 0);
      if (balanceFilter === "partial") rows = rows.filter((s) => (s.outstandingBalance || 0) > 0 && (s.outstandingBalance || 0) < (s.totalPurchases || 0));
      if (sortBy === "name") rows.sort((a, b) => a.supplierName.localeCompare(b.supplierName));
      if (sortBy === "volume") rows.sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0));
      if (sortBy === "recent") rows.sort((a, b) => (b.lastPurchaseDate || "").localeCompare(a.lastPurchaseDate || ""));
      setSuppliers(rows);
    } catch (e) {
      showToast(e.message || t("suppliers.toast_load_failed", "Failed to load suppliers"), "error");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, balanceFilter, sortBy, showToast]);
  const loadDashboardStats = reactExports.useCallback(async () => {
    try {
      const stats = await window.api.getSupplierDashboardStats();
      setDashboardStats(stats);
    } catch (_) {
    }
  }, []);
  const loadPriceChecks = reactExports.useCallback(async (supplierId) => {
    try {
      const data = await window.api.getSupplierPriceChecks(supplierId);
      setPriceChecks(data || []);
    } catch (_) {
    }
  }, []);
  const loadItems = reactExports.useCallback(async () => {
    try {
      const data = await window.api.getItems({ limit: 1e4 });
      setItems(data || []);
    } catch (_) {
    }
  }, []);
  reactExports.useEffect(() => {
    loadSuppliers();
    loadDashboardStats();
  }, [loadSuppliers, loadDashboardStats]);
  reactExports.useEffect(() => {
    setPage(0);
  }, [search, statusFilter, balanceFilter, sortBy]);
  reactExports.useEffect(() => {
    const handler = (e) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && view !== "list") {
        setView("list");
        setSelected(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view]);
  const totalPages = Math.max(1, Math.ceil(suppliers.length / ROWS_PER_PAGE));
  const paged = reactExports.useMemo(() => suppliers.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE), [suppliers, page]);
  const handleSave = async () => {
    if (!form.supplierName.trim()) {
      showToast(t("suppliers.name_required", "Supplier name is required"), "error");
      return;
    }
    try {
      if (editingId) {
        await window.api.updateSupplier(editingId, form);
        showToast(t("suppliers.toast_updated"));
      } else {
        await window.api.insertSupplier(form);
        showToast(t("suppliers.toast_created"));
      }
      setView("list");
      setForm(DEFAULT_FORM);
      setEditingId(null);
      loadSuppliers();
      loadDashboardStats();
    } catch (e) {
      showToast(e.message || t("suppliers.toast_save_failed", "Save failed"), "error");
    }
  };
  const handleArchive = async (s) => {
    if (!window.confirm(t("suppliers.confirm_archive"))) return;
    try {
      await window.api.archiveSupplier(s.id);
      showToast(t("suppliers.toast_archived"));
      loadSuppliers();
      loadDashboardStats();
    } catch (e) {
      showToast(e.message, "error");
    }
  };
  const handleRestore = async (s) => {
    try {
      await window.api.restoreSupplier(s.id);
      showToast(t("suppliers.toast_restored"));
      loadSuppliers();
      loadDashboardStats();
    } catch (e) {
      showToast(e.message, "error");
    }
  };
  const handleDelete = async (s) => {
    if (!window.confirm(t("suppliers.confirm_delete"))) return;
    try {
      await window.api.deleteSupplier(s.id);
      showToast(t("suppliers.toast_deleted"));
      loadSuppliers();
      loadDashboardStats();
    } catch (e) {
      showToast(e.message, "error");
    }
  };
  const handleToggleFavorite = async (id) => {
    try {
      await window.api.toggleSupplierFavorite(id);
      loadSuppliers();
    } catch (e) {
      showToast(e.message, "error");
    }
  };
  const openDetail = async (s) => {
    try {
      const fresh = await window.api.getSupplier(s.id);
      if (!fresh) {
        showToast(t("suppliers.toast_not_found", "Supplier not found"), "error");
        return;
      }
      setSelected(fresh);
      const [purchases, payments, products, activity] = await Promise.all([
        window.api.getSupplierPurchases({ supplierId: s.id, limit: 1e3, offset: 0 }),
        window.api.getSupplierPayments({ supplierId: s.id, limit: 1e3, offset: 0 }),
        window.api.getSupplierProducts(s.id),
        window.api.getSupplierActivityLog(s.id, 20)
      ]);
      setSelectedSupplierPurchases(purchases.rows || []);
      setSelectedSupplierPayments(payments.rows || []);
      setSelectedProducts(products || []);
      setSupplierActivity(activity || []);
      loadPriceChecks(s.id);
      loadItems();
      setView("detail");
    } catch (e) {
      showToast(e.message, "error");
    }
  };
  const openForm = (s) => {
    if (s) {
      setForm({
        supplierName: s.supplierName || "",
        companyName: s.companyName || "",
        contactPerson: s.contactPerson || "",
        phone: s.phone || "",
        secondaryPhone: s.secondaryPhone || "",
        email: s.email || "",
        address: s.address || "",
        city: s.city || "",
        country: s.country || "Ethiopia",
        taxNumber: s.taxNumber || "",
        paymentTerms: s.paymentTerms || "Net 30",
        creditLimit: s.creditLimit || 0,
        notes: s.notes || "",
        status: s.status || "active"
      });
      setEditingId(s.id);
    } else {
      setForm(DEFAULT_FORM);
      setEditingId(null);
    }
    setView("form");
  };
  const handleSavePayment = async () => {
    if (!selected) return;
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      showToast(t("common.amount") + " is required", "error");
      return;
    }
    if (!paymentForm.paymentMethod) {
      showToast(t("suppliers.payment_method_required", "Payment method is required"), "error");
      return;
    }
    try {
      const payload = {
        supplierId: selected.id,
        purchaseId: paymentForm.purchaseId ? Number(paymentForm.purchaseId) : null,
        paymentDate: paymentForm.paymentDate,
        referenceNumber: paymentForm.referenceNumber,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes
      };
      if (editingPayment) {
        await window.api.updateSupplierPayment(editingPayment.id, payload);
        showToast(t("suppliers.toast_payment_updated"));
      } else {
        await window.api.insertSupplierPayment(payload);
        showToast(t("suppliers.toast_payment_recorded"));
      }
      setShowPaymentModal(false);
      setEditingPayment(null);
      setPaymentForm({ paymentDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0], referenceNumber: "", amount: "", paymentMethod: "cash", notes: "", purchaseId: "" });
      const fresh = await window.api.getSupplier(selected.id);
      setSelected(fresh);
      const [purchases, payments] = await Promise.all([
        window.api.getSupplierPurchases({ supplierId: selected.id, limit: 1e3, offset: 0 }),
        window.api.getSupplierPayments({ supplierId: selected.id, limit: 1e3, offset: 0 })
      ]);
      setSelectedSupplierPurchases(purchases.rows || []);
      setSelectedSupplierPayments(payments.rows || []);
      loadSuppliers();
    } catch (e) {
      showToast(e.message, "error");
    }
  };
  const handleDeletePayment = async (p) => {
    if (!window.confirm(t("suppliers.confirm_delete_payment"))) return;
    try {
      await window.api.deleteSupplierPayment(p.id);
      showToast(t("suppliers.toast_payment_deleted"));
      if (selected) {
        const fresh = await window.api.getSupplier(selected.id);
        setSelected(fresh);
        const payments = await window.api.getSupplierPayments({ supplierId: selected.id, limit: 1e3, offset: 0 });
        setSelectedSupplierPayments(payments.rows || []);
      }
      loadSuppliers();
    } catch (e) {
      showToast(e.message, "error");
    }
  };
  const handleReverseSupplierPayment = async () => {
    if (!reversePaymentTarget) return;
    try {
      await window.api.reverseSupplierPayment({ paymentId: reversePaymentTarget.id, reason: reversePaymentReason });
      showToast(t("suppliers.toast_payment_reversed", "Payment reversed successfully"));
      setReversePaymentTarget(null);
      setReversePaymentReason("");
      if (selected) {
        const fresh = await window.api.getSupplier(selected.id);
        setSelected(fresh);
        const payments = await window.api.getSupplierPayments({ supplierId: selected.id, limit: 1e3, offset: 0 });
        setSelectedSupplierPayments(payments.rows || []);
      }
      loadSuppliers();
    } catch (e) {
      showToast(e.message, "error");
    }
  };
  const handleSavePriceCheck = async () => {
    try {
      const payload = {
        supplierId: priceCheckForm.supplierId,
        frequency: priceCheckForm.frequency,
        notes: priceCheckForm.notes,
        active: priceCheckForm.active
      };
      if (priceCheckForm.itemId) payload.itemId = Number(priceCheckForm.itemId);
      const result = await window.api.saveSupplierPriceCheck(payload);
      if (result.success) {
        showToast(t("suppliers.toast_price_check_scheduled", "Price check scheduled"));
        setShowPriceCheckModal(false);
        setPriceCheckForm({ supplierId: 0, itemId: "", frequency: "weekly", notes: "", active: true });
        if (selected) loadPriceChecks(selected.id);
        else loadPriceChecks();
      }
    } catch (e) {
      showToast(e.message, "error");
    }
  };
  const handleDeletePriceCheck = async (id) => {
    if (!window.confirm(t("suppliers.confirm_delete_price_check", "Delete this price check reminder?"))) return;
    try {
      await window.api.deleteSupplierPriceCheck(id);
      showToast(t("suppliers.toast_price_check_deleted", "Price check deleted"));
      if (selected) loadPriceChecks(selected.id);
      else loadPriceChecks();
    } catch (e) {
      showToast(e.message, "error");
    }
  };
  const handleTogglePriceCheckActive = async (pc) => {
    try {
      await window.api.saveSupplierPriceCheck({ ...pc, active: !pc.active });
      if (selected) loadPriceChecks(selected.id);
      else loadPriceChecks();
    } catch (e) {
      showToast(e.message, "error");
    }
  };
  const exportPDF = () => {
    const doc = new E();
    const y0 = addPdfHeader(doc, currentBusiness, 8);
    let y = y0 + 4;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(t("suppliers.pdf_title", "Suppliers Report"), 14, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(t("suppliers.pdf_generated", "Generated") + ": " + formatDate(/* @__PURE__ */ new Date()), 14, y);
    const headers = [[
      t("suppliers.col_name", "Name"),
      t("suppliers.col_company", "Company"),
      t("suppliers.col_phone", "Phone"),
      t("suppliers.col_total", "Total Purchases"),
      t("suppliers.col_outstanding", "Outstanding"),
      t("suppliers.col_status", "Status")
    ]];
    const data = suppliers.map((s) => [
      s.supplierName,
      s.companyName || "-",
      s.phone || "-",
      `${cur} ${(s.totalPurchases || 0).toLocaleString()}`,
      `${cur} ${(s.outstandingBalance || 0).toLocaleString()}`,
      s.isActive ? t("suppliers.status_active", "Active") : t("suppliers.status_inactive", "Inactive")
    ]);
    autoTable(doc, { head: headers, body: data, startY: y + 4, styles: { fontSize: 8 } });
    doc.save("suppliers-report.pdf");
    showToast(t("suppliers.toast_pdf_exported", "PDF exported"));
    toast.success(t("suppliers.toast_report_exported", "Report exported successfully"));
  };
  const exportCSV = () => {
    const headers = [
      t("suppliers.col_name", "Name"),
      t("suppliers.col_company", "Company"),
      t("suppliers.col_phone", "Phone"),
      t("suppliers.col_email", "Email"),
      t("suppliers.col_total", "Total Purchases"),
      t("suppliers.col_outstanding", "Outstanding"),
      t("suppliers.col_status", "Status")
    ];
    const rows = suppliers.map((s) => [
      s.supplierName,
      s.companyName || "",
      s.phone || "",
      s.email || "",
      s.totalPurchases || 0,
      s.outstandingBalance || 0,
      s.isActive ? t("suppliers.status_active", "Active") : t("suppliers.status_inactive", "Inactive")
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "suppliers.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast(t("suppliers.toast_csv_exported", "CSV exported"));
  };
  const toggleSelectAll = () => {
    if (selectedIds.length === paged.length) setSelectedIds([]);
    else setSelectedIds(paged.map((s) => s.id));
  };
  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  if (view === "list") {
    const totalOutstanding = suppliers.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);
    const totalPurchases = suppliers.reduce((sum, s) => sum + (s.totalPurchases || 0), 0);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-2 fade-in", children: [
      toastState && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `fixed bottom-4 right-4 z-50 px-4 py-2 rounded shadow ${toastState.type === "success" ? "bg-green-600" : "bg-red-600"} text-white text-sm`, children: toastState.message }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-bold flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { className: "h-6 w-6" }),
            t("suppliers.title")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("suppliers.subtitle") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: exportPDF, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4 mr-1" }),
            t("suppliers.export_pdf", "PDF")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: exportCSV, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "h-4 w-4 mr-1" }),
            t("suppliers.export_csv", "CSV")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
            loadItems();
            setPriceCheckForm({ supplierId: 0, itemId: "", frequency: "weekly", notes: "", active: true });
            setShowPriceCheckModal(true);
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4 mr-1" }),
            t("suppliers.price_checks", "Price Checks")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => openForm(), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-1" }),
            t("suppliers.add_supplier")
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" }),
            t("suppliers.stat_total")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: dashboardStats?.totalSuppliers || suppliers.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4 text-green-500" }),
            t("suppliers.stat_active")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-green-600", children: dashboardStats?.activeSuppliers || suppliers.filter((s) => s.isActive).length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-4 w-4 text-red-500" }),
            t("suppliers.stat_outstanding")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xl font-bold text-red-600", children: [
            cur,
            " ",
            totalOutstanding.toLocaleString()
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4" }),
            t("suppliers.stat_total")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xl font-bold", children: [
            cur,
            " ",
            totalPurchases.toLocaleString()
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1 min-w-[200px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              ref: searchInputRef,
              className: "pl-9",
              placeholder: t("common.search") + "...",
              value: search,
              onChange: (e) => setSearch(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "border rounded px-2 py-1.5 bg-background text-sm", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: t("suppliers.filter_all") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "active", children: t("suppliers.filter_active") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "inactive", children: t("suppliers.filter_inactive") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "border rounded px-2 py-1.5 bg-background text-sm", value: balanceFilter, onChange: (e) => setBalanceFilter(e.target.value), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: t("suppliers.filter_balance_all") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "paid", children: t("suppliers.filter_paid") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "unpaid", children: t("suppliers.filter_unpaid") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "partial", children: t("suppliers.filter_partial") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "border rounded px-2 py-1.5 bg-background text-sm", value: sortBy, onChange: (e) => setSortBy(e.target.value), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "name", children: t("suppliers.sort_name") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "volume", children: t("suppliers.sort_volume") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "recent", children: t("suppliers.sort_recent") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => loadSuppliers(), children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-8 w-8 animate-spin text-muted-foreground" }) }) : suppliers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { className: "h-12 w-12 mb-3 opacity-30" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: t("suppliers.empty_list") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "mt-2", onClick: () => openForm(), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-1" }),
          t("suppliers.add_supplier")
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 w-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: selectedIds.length === paged.length && paged.length > 0, onChange: toggleSelectAll }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2", children: t("suppliers.col_name") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2 hidden md:table-cell", children: t("suppliers.col_company") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2 hidden lg:table-cell", children: t("suppliers.col_phone") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: t("suppliers.col_purchases") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: t("suppliers.col_balance") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2 hidden xl:table-cell", children: t("suppliers.col_products") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2 hidden xl:table-cell", children: t("suppliers.col_last") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2", children: t("suppliers.col_status") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: t("suppliers.col_actions") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: paged.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: `border-t hover:bg-muted/20 ${selectedIds.includes(s.id) ? "bg-muted/30" : ""}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: selectedIds.includes(s.id), onChange: () => toggleSelect(s.id) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "font-medium text-left hover:underline cursor-pointer flex items-center gap-1", onClick: () => openDetail(s), children: [
            s.isFavorite ? /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "h-3 w-3 text-red-500 fill-red-500" }) : null,
            s.supplierName
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-muted-foreground hidden md:table-cell", children: s.companyName || "-" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-muted-foreground hidden lg:table-cell", children: s.phone || "-" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2 text-right", children: [
            cur,
            " ",
            (s.totalPurchases || 0).toLocaleString()
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: `p-2 text-right font-semibold ${(s.outstandingBalance || 0) > 0 ? "text-red-600" : "text-green-600"}`, children: [
            cur,
            " ",
            (s.outstandingBalance || 0).toLocaleString()
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 hidden xl:table-cell", children: s.productCount || 0 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs hidden xl:table-cell", children: s.lastPurchaseDate ? formatDate(s.lastPurchaseDate) : "-" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: s.isActive ? "default" : "secondary", className: "text-xs", children: s.isActive ? t("suppliers.status_active") : t("suppliers.status_inactive") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => openDetail(s), title: t("common.view"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3.5 w-3.5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => openForm(s), title: t("common.edit"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "h-3.5 w-3.5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleToggleFavorite(s.id), title: t("suppliers.toggle_favorite"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: `h-3.5 w-3.5 ${s.isFavorite ? "fill-red-500 text-red-500" : ""}` }) }),
            s.isActive ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleArchive(s), title: t("suppliers.archive"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Archive, { className: "h-3.5 w-3.5" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleRestore(s), title: t("suppliers.restore"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-3.5 w-3.5 text-green-600" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleDelete(s), title: t("common.delete"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 text-red-500" }) })
          ] }) })
        ] }, s.id)) })
      ] }) }) }) }),
      suppliers.length > ROWS_PER_PAGE && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          suppliers.length,
          " ",
          t("common.total")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", disabled: page === 0, onClick: () => setPage((p) => p - 1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }) }),
          Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const start = Math.max(0, Math.min(page - 4, totalPages - 10));
            const p = start + i;
            if (p >= totalPages) return null;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: p === page ? "default" : "outline", size: "sm", onClick: () => setPage(p), children: p + 1 }, p);
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", disabled: page >= totalPages - 1, onClick: () => setPage((p) => p + 1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" }) })
        ] })
      ] })
    ] });
  }
  if (view === "form") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-2 max-w-2xl fade-in", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => {
          setView("list");
          setForm(DEFAULT_FORM);
          setEditingId(null);
        }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: editingId ? t("suppliers.edit_supplier") : t("suppliers.add_supplier") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-sm font-medium", children: [
              t("suppliers.field_name"),
              " *"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.supplierName, onChange: (e) => setForm({ ...form, supplierName: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: t("suppliers.field_company") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.companyName, onChange: (e) => setForm({ ...form, companyName: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: t("suppliers.field_contact") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.contactPerson, onChange: (e) => setForm({ ...form, contactPerson: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-sm font-medium", children: [
              t("suppliers.field_phone"),
              " *"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }), placeholder: t("suppliers.phone_placeholder", "+251...") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: t("suppliers.field_alt_phone") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.secondaryPhone, onChange: (e) => setForm({ ...form, secondaryPhone: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: t("suppliers.field_email") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "email", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: t("suppliers.field_tax") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.taxNumber, onChange: (e) => setForm({ ...form, taxNumber: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: t("suppliers.field_city") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.city, onChange: (e) => setForm({ ...form, city: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: t("suppliers.field_address") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { className: "w-full border rounded px-3 py-2 bg-background min-h-[60px]", value: form.address, onChange: (e) => setForm({ ...form, address: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: t("suppliers.field_notes") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { className: "w-full border rounded px-3 py-2 bg-background min-h-[60px]", value: form.notes, onChange: (e) => setForm({ ...form, notes: e.target.value }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 justify-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => {
            setView("list");
            setForm(DEFAULT_FORM);
            setEditingId(null);
          }, children: t("common.cancel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSave, children: t("common.save") })
        ] })
      ] }) })
    ] });
  }
  if (view === "detail" && selected) {
    const balance = selected.outstandingBalance || 0;
    const overduePurchases = selectedSupplierPurchases.filter((p) => {
      if (!p.dueDate) return false;
      return new Date(p.dueDate) < /* @__PURE__ */ new Date() && p.totalAmount - (p.paidAmount || 0) > 0 && p.status !== "cancelled";
    });
    const overdueTotal = overduePurchases.reduce((sum, p) => sum + (p.totalAmount - (p.paidAmount || 0)), 0);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-2 fade-in", children: [
      toastState && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `fixed bottom-4 right-4 z-50 px-4 py-2 rounded shadow ${toastState.type === "success" ? "bg-green-600" : "bg-red-600"} text-white text-sm`, children: toastState.message }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => setView("list"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-bold flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { className: "h-6 w-6" }),
            selected.supplierName
          ] }),
          selected.isFavorite ? /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "h-5 w-5 text-red-500 fill-red-500" }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: selected.isActive ? "default" : "secondary", children: selected.status || (selected.isActive ? t("suppliers.status_active", "Active") : t("suppliers.status_inactive", "Inactive")) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => openForm(selected), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "h-4 w-4 mr-1" }),
            t("common.edit")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
            setEditingPayment(null);
            setShowPaymentModal(true);
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-4 w-4 mr-1" }),
            t("suppliers.record_payment")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleToggleFavorite(selected.id), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: `h-4 w-4 mr-1 ${selected.isFavorite ? "fill-red-500 text-red-500" : ""}` }),
            selected.isFavorite ? t("suppliers.remove_favorite") : t("suppliers.add_favorite")
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-4 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-semibold flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-4 w-4" }),
            t("suppliers.section_info")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                t("suppliers.field_company"),
                ":"
              ] }),
              " ",
              selected.companyName || "-"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                t("suppliers.field_contact"),
                ":"
              ] }),
              " ",
              selected.contactPerson || "-"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-3 w-3 text-muted-foreground" }),
              " ",
              selected.phone || "-"
            ] }),
            selected.secondaryPhone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-3 w-3 text-muted-foreground" }),
              " ",
              selected.secondaryPhone
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-3 w-3 text-muted-foreground" }),
              " ",
              selected.email || "-"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3 w-3 mt-0.5 text-muted-foreground" }),
              " ",
              [selected.address, selected.city, selected.country].filter(Boolean).join(", ") || "-"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                t("suppliers.field_tax"),
                ":"
              ] }),
              " ",
              selected.taxNumber || "-"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                t("suppliers.field_terms"),
                ":"
              ] }),
              " ",
              selected.paymentTerms || "-"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                t("suppliers.field_credit"),
                ":"
              ] }),
              " ",
              cur,
              " ",
              (selected.creditLimit || 0).toLocaleString()
            ] }),
            selected.notes && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-2 border-t text-muted-foreground italic", children: selected.notes })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: t("suppliers.stat_total") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xl font-bold", children: [
              cur,
              " ",
              (selected.totalPurchases || 0).toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: t("suppliers.stat_paid") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xl font-bold text-green-600", children: [
              cur,
              " ",
              (selected.totalPaid || 0).toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: t("suppliers.stat_outstanding") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xl font-bold text-red-600", children: [
              cur,
              " ",
              balance.toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: t("suppliers.stat_avg") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-lg font-bold", children: [
              cur,
              " ",
              Math.round(selected.avgPurchase || 0).toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: t("suppliers.stat_products") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold", children: selected.productCount || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: t("suppliers.stat_last") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold text-sm", children: selected.lastPurchaseDate ? formatDate(selected.lastPurchaseDate) : "-" })
          ] })
        ] })
      ] }),
      balance > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-red-200 dark:border-red-900", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-4 w-4 text-red-500" }),
          t("suppliers.debt_management")
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3 mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 bg-red-50 dark:bg-red-950 rounded", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: t("suppliers.current_balance") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-lg font-bold text-red-600", children: [
                cur,
                " ",
                balance.toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 bg-amber-50 dark:bg-amber-950 rounded", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: t("suppliers.overdue_amount") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-lg font-bold text-amber-600", children: [
                cur,
                " ",
                overdueTotal.toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 bg-green-50 dark:bg-green-950 rounded", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: t("suppliers.upcoming_payments") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold text-green-600", children: selectedSupplierPurchases.filter((p) => p.dueDate && new Date(p.dueDate) >= /* @__PURE__ */ new Date() && p.totalAmount - (p.paidAmount || 0) > 0).length })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: selectedSupplierPurchases.filter((p) => p.totalAmount - (p.paidAmount || 0) > 0).slice(0, 3).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
            setPaymentForm({ ...paymentForm, purchaseId: String(p.id) });
            setShowPaymentModal(true);
          }, children: [
            t("suppliers.pay"),
            " ",
            p.purchaseNumber || `#${p.id}`,
            ": ",
            cur,
            " ",
            ((p.totalAmount || 0) - (p.paidAmount || 0)).toLocaleString()
          ] }, p.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm", children: [
            t("suppliers.section_purchases"),
            " (",
            selectedSupplierPurchases.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: async () => {
            if (!selected) return;
            if (selectedProducts.length === 0) {
              alert(t("suppliers.empty_products"));
              return;
            }
            const totalAmount = selectedProducts.reduce((s, p) => s + (p.lastPurchasePrice || 0) * 5, 0);
            try {
              await window.api?.insertSupplierPurchase({
                supplierId: selected.id,
                purchaseDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
                totalAmount,
                items: selectedProducts.map((p) => ({
                  itemId: p.productId,
                  itemName: p.itemName,
                  quantity: 5,
                  unit: "pcs",
                  unitPrice: p.lastPurchasePrice || 0
                }))
              });
              showToast(t("suppliers.toast_purchase_created", "Purchase created"), "success");
              openDetail(selected);
            } catch (err) {
              showToast(err.message || t("suppliers.toast_purchase_failed", "Purchase failed"), "error");
            }
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-1" }),
            t("suppliers.add_purchase", "Purchase")
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: selectedSupplierPurchases.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground p-4 text-center", children: t("suppliers.empty_purchases") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2", children: t("suppliers.col_purchase_no") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2", children: t("suppliers.col_date") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: t("suppliers.col_products") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: t("suppliers.col_total") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: t("suppliers.col_paid") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: t("suppliers.col_balance") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2", children: t("suppliers.col_status") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2", children: t("suppliers.col_due") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: selectedSupplierPurchases.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t hover:bg-muted/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono text-xs", children: p.purchaseNumber || `#${p.id}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: formatDate(p.purchaseDate) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-right", children: p.productCount || 0 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2 text-right", children: [
              cur,
              " ",
              (p.totalAmount || 0).toLocaleString()
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2 text-right text-green-600", children: [
              cur,
              " ",
              (p.paidAmount || 0).toLocaleString()
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2 text-right font-semibold", style: { color: p.totalAmount - (p.paidAmount || 0) > 0 ? "var(--destructive)" : "var(--green-600)" }, children: [
              cur,
              " ",
              ((p.totalAmount || 0) - (p.paidAmount || 0)).toLocaleString()
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: p.status === "received" ? "default" : "secondary", className: "text-xs", children: p.status }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs", children: p.dueDate ? formatDate(p.dueDate) : "-" })
          ] }, p.id)) })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm", children: [
            t("suppliers.section_payments"),
            " (",
            selectedSupplierPayments.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => {
            setEditingPayment(null);
            setShowPaymentModal(true);
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-1" }),
            t("suppliers.record_payment")
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: selectedSupplierPayments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground p-4 text-center", children: t("suppliers.empty_payments") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2", children: t("suppliers.col_date") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: t("suppliers.col_amount") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2", children: t("suppliers.col_method") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2", children: t("suppliers.col_reference") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2", children: t("suppliers.col_purchase_no") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2", children: t("suppliers.field_notes") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: selectedSupplierPayments.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t hover:bg-muted/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: formatDate(p.paymentDate) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2 text-right font-semibold text-green-600", children: [
              cur,
              " ",
              (p.amount || 0).toLocaleString()
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs", children: p.paymentMethod }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono text-xs", children: p.referenceNumber || "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono text-xs", children: p.purchaseNumber || "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs text-muted-foreground", children: p.notes || "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2 text-right", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => {
                setEditingPayment(p);
                setPaymentForm({ paymentDate: p.paymentDate, referenceNumber: p.referenceNumber || "", amount: String(p.amount), paymentMethod: p.paymentMethod, notes: p.notes || "", purchaseId: String(p.purchaseId || "") });
                setShowPaymentModal(true);
              }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "h-3 w-3" }) }),
              !p.reversalId && hasPermission("payments.reverse") && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => {
                setReversePaymentTarget(p);
                setReversePaymentReason("");
              }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { className: "h-3 w-3 text-destructive" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleDeletePayment(p), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3 text-red-500" }) })
            ] })
          ] }, p.id)) })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm", children: [
          t("suppliers.section_products"),
          " (",
          selectedProducts.length,
          ")"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: selectedProducts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground p-4 text-center", children: t("suppliers.empty_products") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2", children: t("suppliers.col_item") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2", children: t("common.sku", "SKU") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: t("suppliers.col_stock") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: t("suppliers.col_last_price") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: t("suppliers.col_avg_price") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: t("suppliers.col_total_purchased") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2", children: t("suppliers.col_last_date") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: selectedProducts.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t hover:bg-muted/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: p.itemName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono text-xs", children: p.sku || "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-right", children: p.currentStock || 0 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2 text-right", children: [
              cur,
              " ",
              (p.lastPurchasePrice || 0).toLocaleString()
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2 text-right", children: [
              cur,
              " ",
              (p.avgPurchasePrice || p.lastPurchasePrice || 0).toLocaleString()
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-right", children: p.totalPurchased || 0 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: p.lastPurchaseDate ? formatDate(p.lastPurchaseDate) : "-" })
          ] }, i)) })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4" }),
            t("suppliers.price_checks", "Price Checks"),
            " (",
            priceChecks.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => {
            setPriceCheckForm({ supplierId: selected.id, itemId: "", frequency: "weekly", notes: "", active: true });
            setShowPriceCheckModal(true);
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-1" }),
            t("suppliers.schedule", "Schedule")
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: priceChecks.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground py-4 text-center", children: t("suppliers.no_price_checks", "No price check reminders scheduled") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: priceChecks.map((pc) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-3xl border border-border bg-card p-4 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-sm", children: pc.itemName || t("suppliers.label_all_items", "All Items") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleTogglePriceCheckActive(pc), className: `relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${pc.active ? "bg-green-600" : "bg-muted"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${pc.active ? "translate-x-[18px]" : "translate-x-[3px]"}` }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3 w-3" }),
            pc.frequency
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground uppercase tracking-widest", children: t("suppliers.label_last", "Last") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: pc.lastCheckedDate ? formatDate(pc.lastCheckedDate) : t("suppliers.label_never", "Never") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground uppercase tracking-widest", children: t("suppliers.label_next", "Next") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: pc.nextCheckDate ? formatDate(pc.nextCheckDate) : t("suppliers.label_na", "N/A") })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: pc.supplierName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleDeletePriceCheck(pc.id), className: "h-7 w-7 p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 text-red-500" }) })
          ] })
        ] }, pc.id)) }) })
      ] }),
      supplierActivity.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: t("suppliers.activity_timeline") }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: supplierActivity.map((a, _i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1", children: a.action === "created" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3 text-green-500" }) : a.action === "payment" ? /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-3 w-3 text-blue-500" }) : a.action === "updated" ? /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "h-3 w-3 text-amber-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3 text-muted-foreground" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: a.description || a.action }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground ml-2", children: formatDate(a.createdAt) })
          ] })
        ] }, a.id)) }) })
      ] }),
      showPaymentModal && /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showPaymentModal, title: editingPayment ? t("suppliers.edit_payment") : t("suppliers.record_payment"), onClose: () => {
        setShowPaymentModal(false);
        setEditingPayment(null);
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-3 min-w-[420px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold", children: editingPayment ? t("suppliers.edit_payment") : t("suppliers.record_payment") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-sm font-medium", children: [
            t("suppliers.col_date"),
            " *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: paymentForm.paymentDate, onChange: (e) => setPaymentForm({ ...paymentForm, paymentDate: e }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-sm font-medium", children: [
            t("suppliers.col_amount"),
            " *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: "0", step: "0.01", value: paymentForm.amount, onChange: (e) => setPaymentForm({ ...paymentForm, amount: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: t("suppliers.col_purchase_no") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              className: "w-full border rounded px-2 py-1.5 bg-background text-sm",
              value: paymentForm.purchaseId,
              onChange: (e) => setPaymentForm({ ...paymentForm, purchaseId: e.target.value }),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "", children: [
                  "-- ",
                  t("suppliers.no_purchase"),
                  " --"
                ] }),
                selectedSupplierPurchases.filter((p) => p.totalAmount - (p.paidAmount || 0) > 0 || String(p.id) === paymentForm.purchaseId).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: String(p.id), children: [
                  p.purchaseNumber || `#${p.id}`,
                  " — ",
                  cur,
                  " ",
                  ((p.totalAmount || 0) - (p.paidAmount || 0)).toLocaleString(),
                  " ",
                  t("suppliers.stat_remaining")
                ] }, p.id))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-sm font-medium", children: [
            t("suppliers.col_method"),
            " *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { className: "w-full border rounded px-2 py-1.5 bg-background text-sm", value: paymentForm.paymentMethod, onChange: (e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value }), children: PAYMENT_METHODS.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: m, children: t("suppliers." + PAYMENT_METHOD_LABELS[m], m.replace("_", " ")) }, m)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: t("suppliers.col_reference") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: paymentForm.referenceNumber, onChange: (e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: t("suppliers.field_notes") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { className: "w-full border rounded px-2 py-1.5 bg-background min-h-[60px] text-sm", value: paymentForm.notes, onChange: (e) => setPaymentForm({ ...paymentForm, notes: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 justify-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => {
            setShowPaymentModal(false);
            setEditingPayment(null);
          }, children: t("common.cancel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSavePayment, children: t("common.save") })
        ] })
      ] }) }),
      showPriceCheckModal && /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showPriceCheckModal, title: t("suppliers.price_check_title", "Schedule Price Check"), onClose: () => setShowPriceCheckModal(false), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 min-w-[420px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium uppercase tracking-widest text-muted-foreground", children: t("suppliers.select_supplier", "Supplier") }),
          selected ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded px-3 py-2 bg-background text-sm mt-1", children: selected.supplierName }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              className: "w-full border rounded px-2 py-1.5 bg-background text-sm mt-1",
              value: priceCheckForm.supplierId,
              onChange: (e) => setPriceCheckForm({ ...priceCheckForm, supplierId: Number(e.target.value) }),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 0, children: t("suppliers.select_supplier", "Select supplier") }),
                suppliers.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s.id, children: s.supplierName }, s.id))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium uppercase tracking-widest text-muted-foreground", children: t("suppliers.item_optional", "Item (optional)") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              className: "w-full border rounded px-2 py-1.5 bg-background text-sm mt-1",
              value: priceCheckForm.itemId,
              onChange: (e) => setPriceCheckForm({ ...priceCheckForm, itemId: e.target.value }),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("suppliers.label_all_items", "All items") }),
                items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: item.id, children: item.name }, item.id))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium uppercase tracking-widest text-muted-foreground", children: t("suppliers.frequency", "Frequency") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              className: "w-full border rounded px-2 py-1.5 bg-background text-sm mt-1",
              value: priceCheckForm.frequency,
              onChange: (e) => setPriceCheckForm({ ...priceCheckForm, frequency: e.target.value }),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "weekly", children: t("suppliers.weekly", "Weekly") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "biweekly", children: t("suppliers.biweekly", "Bi-weekly") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "monthly", children: t("suppliers.monthly", "Monthly") })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium uppercase tracking-widest text-muted-foreground", children: t("suppliers.field_notes", "Notes") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              className: "w-full border rounded px-2 py-1.5 bg-background min-h-[60px] text-sm mt-1",
              value: priceCheckForm.notes,
              onChange: (e) => setPriceCheckForm({ ...priceCheckForm, notes: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              id: "pc-active",
              checked: priceCheckForm.active,
              onChange: (e) => setPriceCheckForm({ ...priceCheckForm, active: e.target.checked })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "pc-active", className: "text-sm", children: t("common.active", "Active") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 justify-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setShowPriceCheckModal(false), children: t("common.cancel", "Cancel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSavePriceCheck, children: t("common.save", "Save") })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: reversePaymentTarget !== null, onOpenChange: (open) => {
        if (!open) {
          setReversePaymentTarget(null);
          setReversePaymentReason("");
        }
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("suppliers.reverse_payment_title", "Reverse Payment") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
            t("suppliers.reverse_payment_confirm", "Are you sure you want to reverse this payment of"),
            " ",
            cur,
            " ",
            reversePaymentTarget?.amount.toLocaleString(),
            "?"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-medium", children: t("suppliers.reason_for_reversal", "Reason for reversal *") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              required: true,
              value: reversePaymentReason,
              onChange: (e) => setReversePaymentReason(e.target.value),
              className: "bg-background resize-none",
              placeholder: t("suppliers.reason_for_reversal_placeholder", "Reason for reversal...")
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
              onClick: handleReverseSupplierPayment,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { size: 14, className: "mr-1" }),
                " ",
                t("suppliers.action_reverse", "Reverse")
              ]
            }
          )
        ] })
      ] }) })
    ] });
  }
  return null;
};
export {
  Suppliers as default
};
