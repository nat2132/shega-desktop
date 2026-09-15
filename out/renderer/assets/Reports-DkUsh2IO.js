import { g as useSettings, r as reactExports, j as jsxRuntimeExports, p as Truck, am as Receipt, i as Button, L as LoaderCircle, q as ChartColumn, l as CircleAlert, n as RefreshCw, an as Separator, T as TriangleAlert, s as Package, G as Input, y as Trash2, ab as FileText, ad as Boxes, m as Badge, ao as CreditCard, b9 as PiggyBank, ac as Download, H as toast } from "./index-wvHtiMql.js";
import { E } from "./jspdf.es.min-BFulL-Sj.js";
import { b as addPdfHeader, c as autoTable, e as exportCSV, a as exportPDF } from "./export-utils-DxRsu4JU.js";
import { C as Card, c as CardContent, a as CardHeader, b as CardTitle, d as CardDescription } from "./card-BnskyD18.js";
import { L as Label } from "./label-CVXISaaQ.js";
import { D as DatePicker } from "./DatePicker-CvIVrW74.js";
import { T as Tabs, a as TabsList, b as TabsTrigger } from "./tabs-DerxGOpk.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CnJV7hxz.js";
import { C as Calendar } from "./calendar-CzPOudN_.js";
import { B as Banknote } from "./banknote-Cqg-BzUB.js";
import { D as DollarSign } from "./dollar-sign-DW91CCEw.js";
import { T as TrendingUp } from "./trending-up-B1IsTNPA.js";
import "./select-iyCsL0f8.js";
const Reports = () => {
  const { t, formatDate, currentBusiness } = useSettings();
  const [activeTab, setActiveTab] = reactExports.useState("sales");
  const [period, setPeriod] = reactExports.useState("month");
  const [dateRange, setDateRange] = reactExports.useState({ start: "", end: "" });
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [analytics, setAnalytics] = reactExports.useState(null);
  const [items, setItems] = reactExports.useState([]);
  const [reportGenerated, setReportGenerated] = reactExports.useState(false);
  const [lowStockItems, setLowStockItems] = reactExports.useState([]);
  const [lowStockFetched, setLowStockFetched] = reactExports.useState(false);
  const [lowStockLoading, setLowStockLoading] = reactExports.useState(false);
  const [supplierSummary, setSupplierSummary] = reactExports.useState([]);
  const [supplierTransactions, setSupplierTransactions] = reactExports.useState([]);
  const [supplierPayments, setSupplierPayments] = reactExports.useState([]);
  const currentRange = reactExports.useMemo(() => {
    if (period === "custom") return dateRange;
    const now = /* @__PURE__ */ new Date();
    const end = now.toISOString().split("T")[0];
    let start = end;
    if (period === "week") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split("T")[0];
    } else if (period === "month") {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      start = d.toISOString().split("T")[0];
    } else if (period === "year") {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      start = d.toISOString().split("T")[0];
    }
    return { start, end };
  }, [period, dateRange]);
  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const range = currentRange;
      switch (activeTab) {
        case "sales": {
          const anData = await window.api.getAnalytics(period, range);
          setAnalytics(anData);
          break;
        }
        case "valuation": {
          const itemsData = await window.api.getItems({});
          setItems(Array.isArray(itemsData) ? itemsData : []);
          break;
        }
        case "pnl": {
          const anData = await window.api.getAnalytics(period, range);
          setAnalytics(anData);
          break;
        }
        case "catalog": {
          const itemsData = await window.api.getItems({});
          setItems(Array.isArray(itemsData) ? itemsData : []);
          break;
        }
        case "supplier_summary": {
          const data = await window.api.getSupplierReportSummary();
          setSupplierSummary(Array.isArray(data) ? data : []);
          break;
        }
        case "supplier_transactions": {
          const data = await window.api.getSupplierTransactionReport({});
          setSupplierTransactions(Array.isArray(data.rows) ? data.rows : []);
          setSupplierPayments(Array.isArray(data.payments) ? data.payments : []);
          break;
        }
      }
      setReportGenerated(true);
    } catch (e) {
      setError(e.message || t("reports.gen_failed"));
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    if (period !== "custom" || dateRange.start && dateRange.end) {
      setReportGenerated(false);
    }
  }, [activeTab, period, dateRange]);
  useDataChangedRefresh(() => {
    fetchLowStock();
  });
  const fetchLowStock = async () => {
    setLowStockLoading(true);
    setError(null);
    try {
      const data = await window.api.getReorderSuggestions();
      const list = Array.isArray(data) ? data : [];
      setLowStockItems(list.map((i) => ({
        ...i,
        orderQty: Math.max(1, Number(i.suggestedQty) || (i.unitsPerPack || 1) * 3)
      })));
      setLowStockFetched(true);
    } catch (e) {
      setError(e.message || t("reports.low_stock_failed"));
    } finally {
      setLowStockLoading(false);
    }
  };
  const updateLowStockQty = (id, qty) => {
    setLowStockItems((prev) => prev.map(
      (i) => i.id === id ? { ...i, orderQty: Math.max(1, qty) } : i
    ));
  };
  const removeLowStockItem = (id) => {
    setLowStockItems((prev) => prev.filter((i) => i.id !== id));
  };
  const generateOrderPDF = () => {
    const doc = new E();
    const y0 = addPdfHeader(doc, currentBusiness, 8);
    const date = formatDate(/* @__PURE__ */ new Date());
    let y = y0 + 4;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(t("reports.reorder_request") || "REORDER REQUEST", 105, y, { align: "center" });
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${t("common.date")}: ${date}`, 190, y, { align: "right" });
    const tableData = lowStockItems.map((item, index) => [
      index + 1,
      item.name,
      item.supplierName || "—",
      `${item.totalBaseQuantity} ${item.baseUnit}`,
      String(item.orderQty),
      `${(item.basePurchasePrice || 0).toLocaleString()}`,
      `${(item.orderQty * (item.basePurchasePrice || 0)).toLocaleString()}`
    ]);
    const totalCost = lowStockItems.reduce((sum, item) => sum + item.orderQty * (item.basePurchasePrice || 0), 0);
    autoTable(doc, {
      startY: y + 4,
      head: [["#", t("reports.item_name"), t("suppliers.supplier"), t("reports.qty"), t("inventory.order_qty"), t("inventory.unit_cost"), t("inventory.subtotal")]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [0, 0, 0] },
      foot: [["", "", "", "", "", t("reports.total"), `${totalCost.toLocaleString()}`]],
      footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: "bold" }
    });
    doc.save(`ReOrder_${date.replace(/\//g, "-")}.pdf`);
  };
  const exportSalesCSV = () => {
    if (!analytics) return;
    const headers = [t("reports.header_date"), t("reports.header_revenue"), t("reports.header_units_sold"), t("reports.header_profit")];
    const rows = analytics.salesData.map((s) => [s.date, s.revenue, s.units, s.profit]);
    exportCSV(headers, rows, "sales-performance");
  };
  const exportSalesPDF = () => {
    if (!analytics) return;
    const headers = [t("reports.header_date"), t("reports.header_revenue"), t("reports.header_units_sold"), t("reports.header_profit")];
    const rows = analytics.salesData.map((s) => [s.date, String(s.revenue), String(s.units), String(s.profit)]);
    const totalUnits = analytics.salesData.reduce((a, s) => a + s.units, 0);
    exportPDF(t("reports.report_sales_performance"), headers, rows, "sales-performance", ["", t("common.total"), String(totalUnits), String(analytics.summary.totalProfit)], void 0, currentBusiness);
    toast.success(t("reports.report_exported"));
  };
  const exportValuationCSV = () => {
    const headers = [t("reports.header_product"), t("reports.header_category"), t("reports.header_base_qty"), t("reports.header_unit"), t("reports.header_unit_cost"), t("reports.header_total_value")];
    const rows = items.map((i) => [i.name, i.categoryName || "", i.totalBaseQuantity, i.baseUnit, i.basePurchasePrice, (i.totalBaseQuantity * i.basePurchasePrice).toLocaleString()]);
    exportCSV(headers, rows, "stock-valuation");
  };
  const exportValuationPDF = () => {
    const headers = [t("reports.header_product"), t("reports.header_category"), t("reports.header_base_qty"), t("reports.header_unit"), t("reports.header_unit_cost"), t("reports.header_total_value")];
    const rows = items.map((i) => [i.name, i.categoryName || "", String(i.totalBaseQuantity), i.baseUnit, String(i.basePurchasePrice), String(i.totalBaseQuantity * i.basePurchasePrice)]);
    const total = items.reduce((s, i) => s + i.totalBaseQuantity * i.basePurchasePrice, 0);
    exportPDF(t("reports.report_stock_valuation"), headers, rows, "stock-valuation", ["", "", "", "", t("reports.header_total_value"), String(total)], void 0, currentBusiness);
    toast.success(t("reports.report_exported"));
  };
  const exportPNLCSV = () => {
    if (!analytics) return;
    const headers = [t("reports.col_metric"), t("reports.col_value")];
    const rows = [
      [t("reports.col_total_revenue"), analytics.summary.totalRevenue],
      [t("reports.col_gross_profit"), analytics.summary.totalProfit],
      [t("reports.col_net_profit"), analytics.summary.netProfit]
    ];
    exportCSV(headers, rows, "profit-loss");
  };
  const exportPNLPDF = () => {
    if (!analytics) return;
    const headers = [t("reports.col_metric"), t("reports.col_value")];
    const rows = [
      [t("reports.col_total_revenue"), String(analytics.summary.totalRevenue)],
      [t("reports.col_gross_profit"), String(analytics.summary.totalProfit)],
      [t("reports.col_net_profit"), String(analytics.summary.netProfit)]
    ];
    exportPDF(t("reports.report_pnl"), headers, rows, "profit-loss", void 0, void 0, currentBusiness);
    toast.success(t("reports.report_exported"));
  };
  const exportCatalogCSV = () => {
    const headers = [t("reports.header_product"), t("reports.header_category"), t("reports.header_brand"), t("reports.header_base_qty"), t("reports.header_unit"), t("reports.header_selling_price"), t("reports.header_purchase_price")];
    const rows = items.map((i) => [i.name, i.categoryName || "", i.companyName || "", i.totalBaseQuantity, i.baseUnit, i.baseSellingPrice, i.basePurchasePrice]);
    exportCSV(headers, rows, "product-catalog");
  };
  const exportCatalogPDF = () => {
    const headers = [t("reports.header_product"), t("reports.header_category"), t("reports.header_brand"), t("reports.header_base_qty"), t("reports.header_unit"), t("reports.header_selling_price"), t("reports.header_purchase_price")];
    const rows = items.map((i) => [i.name, i.categoryName || "", i.companyName || "", String(i.totalBaseQuantity), i.baseUnit, String(i.baseSellingPrice), String(i.basePurchasePrice)]);
    exportPDF(t("reports.report_catalog"), headers, rows, "product-catalog", void 0, void 0, currentBusiness);
    toast.success(t("reports.report_exported"));
  };
  const exportSupplierSummaryCSV = () => {
    const headers = [t("reports.header_supplier"), t("reports.header_total_purchases"), t("reports.header_total_payments"), t("reports.header_outstanding_balance")];
    const rows = supplierSummary.map((r) => [r.supplierName, r.totalPurchases, r.totalPayments, r.outstandingBalance]);
    exportCSV(headers, rows, "supplier-summary");
  };
  const exportSupplierSummaryPDF = () => {
    const headers = [t("reports.header_supplier"), t("reports.header_total_purchases"), t("reports.header_total_payments"), t("reports.header_outstanding_balance")];
    const rows = supplierSummary.map((r) => [r.supplierName, String(r.totalPurchases), String(r.totalPayments), String(r.outstandingBalance)]);
    const totalPurchases = supplierSummary.reduce((s, r) => s + (r.totalPurchases || 0), 0);
    const totalPayments = supplierSummary.reduce((s, r) => s + (r.totalPayments || 0), 0);
    const totalOutstanding = supplierSummary.reduce((s, r) => s + (r.outstandingBalance || 0), 0);
    exportPDF(t("reports.report_supplier_summary"), headers, rows, "supplier-summary", [t("common.total"), String(totalPurchases), String(totalPayments), String(totalOutstanding)], void 0, currentBusiness);
    toast.success(t("reports.report_exported"));
  };
  const exportSupplierTransactionsCSV = () => {
    const headers = [t("reports.header_supplier"), t("reports.header_order_num"), t("reports.header_date"), t("reports.header_total_amount"), t("reports.header_paid_amount"), t("reports.header_balance"), t("reports.header_status")];
    const rows = supplierTransactions.map((r) => [r.supplierName, r.purchaseNumber || `#${r.id}`, r.purchaseDate, r.totalAmount, r.paidAmount, r.remainingBalance, r.status]);
    exportCSV(headers, rows, "supplier-transactions");
  };
  const exportSupplierTransactionsPDF = () => {
    const headers = [t("reports.header_supplier"), t("reports.header_order_num"), t("reports.header_date"), t("reports.header_total_amount"), t("reports.header_paid_amount"), t("reports.header_balance"), t("reports.header_status")];
    const rows = supplierTransactions.map((r) => [r.supplierName, r.purchaseNumber || `#${r.id}`, r.purchaseDate, String(r.totalAmount), String(r.paidAmount), String(r.remainingBalance), r.status]);
    exportPDF(t("reports.report_supplier_transactions"), headers, rows, "supplier-transactions", [], void 0, currentBusiness);
    toast.success(t("reports.report_exported"));
  };
  const formattedRange = reactExports.useMemo(() => {
    if (!currentRange.start) return "";
    if (currentRange.start === currentRange.end) return formatDate(currentRange.start);
    return `${formatDate(currentRange.start)} - ${formatDate(currentRange.end)}`;
  }, [currentRange, formatDate]);
  const handleCustomSearch = () => {
    if (dateRange.start && dateRange.end) {
      generateReport();
    }
  };
  const totalValue = reactExports.useMemo(
    () => items.reduce((s, i) => s + i.totalBaseQuantity * i.basePurchasePrice, 0),
    [items]
  );
  const renderKPIs = () => {
    switch (activeTab) {
      case "sales":
        if (!analytics) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @4xl/main:grid-cols-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: formattedRange })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("summary.total_sales") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              (analytics.summary.totalRevenue || 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: t("reports.profit") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("summary.total_sales") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              (analytics.summary.totalProfit || 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PiggyBank, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: t("reports.net") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("summary.net_cashflow") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: `text-2xl font-black tracking-tight ${(analytics.summary.netProfit || 0) >= 0 ? "text-green-500" : "text-red-500"}`, children: [
              t("common.etb"),
              " ",
              (analytics.summary.netProfit || 0).toLocaleString()
            ] })
          ] }) })
        ] });
      case "valuation":
        if (items.length === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 @xl/main:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Boxes, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: t("reports.total_skus") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("reports.total_skus") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight", children: items.length })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: t("reports.inventory_value") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("reports.inventory_value") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              totalValue.toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: t("reports.avg_value") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("reports.avg_value") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              (items.length > 0 ? totalValue / items.length : 0).toLocaleString()
            ] })
          ] }) })
        ] });
      case "pnl":
        if (!analytics) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @4xl/main:grid-cols-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: formattedRange })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("summary.total_sales") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              (analytics.summary.totalRevenue || 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: t("reports.gross_profit") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("reports.gross_profit") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: `text-2xl font-black tracking-tight ${(analytics.summary.totalProfit || 0) >= 0 ? "text-green-500" : "text-red-500"}`, children: [
              t("common.etb"),
              " ",
              (analytics.summary.totalProfit || 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PiggyBank, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: t("reports.margin") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("reports.net_margin") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: `text-2xl font-black tracking-tight ${(analytics.summary.netProfit || 0) >= 0 ? "text-green-500" : "text-red-500"}`, children: analytics.summary.totalRevenue > 0 ? `${(analytics.summary.netProfit / analytics.summary.totalRevenue * 100).toFixed(1)}%` : "0%" })
          ] }) })
        ] });
      case "supplier_summary":
        if (supplierSummary.length === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 @xl/main:grid-cols-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: t("reports.total") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("suppliers.title") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight", children: supplierSummary.length })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: t("reports.total") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("suppliers.stat_total") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              supplierSummary.reduce((s, r) => s + (r.totalPurchases || 0), 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: t("reports.total") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("suppliers.stat_paid") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              supplierSummary.reduce((s, r) => s + (r.totalPayments || 0), 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: t("reports.outstanding_badge") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("suppliers.stat_outstanding") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight text-red-600", children: [
              t("common.etb"),
              " ",
              supplierSummary.reduce((s, r) => s + (r.outstandingBalance || 0), 0).toLocaleString()
            ] })
          ] }) })
        ] });
      case "supplier_transactions":
        if (supplierTransactions.length === 0 && supplierPayments.length === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 @xl/main:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: supplierTransactions.length })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("suppliers.section_purchases") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              supplierTransactions.reduce((s, r) => s + (r.totalAmount || 0), 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: supplierPayments.length })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("suppliers.section_payments") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              supplierPayments.reduce((s, r) => s + (r.amount || 0), 0).toLocaleString()
            ] })
          ] }) })
        ] });
      case "catalog":
        if (items.length === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 @xl/main:grid-cols-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Boxes, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: t("reports.total_skus") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("reports.total_skus") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight", children: items.length })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: t("reports.categories") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("reports.categories") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight", children: new Set(items.map((i) => i.categoryName).filter(Boolean)).size })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: t("reports.inventory_value") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("reports.inventory_value") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              totalValue.toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest", children: t("reports.low_stock") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-black uppercase tracking-widest mb-1", children: t("reports.low_stock") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight text-amber-500", children: items.filter((i) => i.totalBaseQuantity > 0 && i.totalBaseQuantity < 10).length })
          ] }) })
        ] });
      default:
        return null;
    }
  };
  const renderDataTable = () => {
    switch (activeTab) {
      case "sales":
        if (!analytics || analytics.salesData.length === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-3xl border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: t("reports.sales_data") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: formattedRange })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("reports.date") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("common.revenue") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("reports.units") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("common.profit") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: analytics.salesData.map((row, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: formatDate(row.date) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right", children: [
                t("common.etb"),
                " ",
                row.revenue.toLocaleString()
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: row.units }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: `text-right font-bold ${row.profit >= 0 ? "text-green-500" : "text-red-500"}`, children: [
                t("common.etb"),
                " ",
                row.profit.toLocaleString()
              ] })
            ] }, i)) })
          ] }) })
        ] });
      case "valuation":
        if (items.length === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-3xl border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: t("reports.valuation_table") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: [
              t("reports.as_of_date"),
              " ",
              formatDate(/* @__PURE__ */ new Date())
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("inventory.product") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("common.category") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("inventory.qty") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("inventory.unit_cost") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("inventory.total_value") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: item.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground", children: item.categoryName || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right", children: [
                item.totalBaseQuantity,
                " ",
                item.baseUnit
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right", children: [
                t("common.etb"),
                " ",
                item.basePurchasePrice.toLocaleString()
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right font-bold", children: [
                t("common.etb"),
                " ",
                (item.totalBaseQuantity * item.basePurchasePrice).toLocaleString()
              ] })
            ] }, item.id)) })
          ] }) })
        ] });
      case "pnl":
        if (!analytics) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-3xl border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: t("reports.pnl_statement") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: formattedRange })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("reports.metric") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("common.amount") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TableBody, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: t("summary.total_sales") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right font-bold", children: [
                  t("common.etb"),
                  " ",
                  (analytics.summary.totalRevenue || 0).toLocaleString()
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium text-green-500", children: t("reports.gross_profit") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right font-bold text-green-500", children: [
                  t("common.etb"),
                  " ",
                  (analytics.summary.totalProfit || 0).toLocaleString()
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "border-t-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-black text-base", children: t("summary.net_cashflow") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: `text-right font-black text-base ${(analytics.summary.netProfit || 0) >= 0 ? "text-green-500" : "text-red-500"}`, children: [
                  t("common.etb"),
                  " ",
                  (analytics.summary.netProfit || 0).toLocaleString()
                ] })
              ] }),
              analytics.summary.totalRevenue > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium text-muted-foreground", children: t("reports.margin") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right font-bold text-muted-foreground", children: [
                  (analytics.summary.netProfit / analytics.summary.totalRevenue * 100).toFixed(1),
                  "%"
                ] })
              ] })
            ] })
          ] }) })
        ] });
      case "catalog":
        if (items.length === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-3xl border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: t("reports.catalog_data") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: [
              t("reports.as_of_date"),
              " ",
              formatDate(/* @__PURE__ */ new Date())
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("inventory.product") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("common.category") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("inventory.brand") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("inventory.stock") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("inventory.selling_price") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("inventory.purchase_price") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: item.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground", children: item.categoryName || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground", children: item.companyName || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right", children: [
                item.totalBaseQuantity,
                " ",
                item.baseUnit
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right", children: [
                t("common.etb"),
                " ",
                item.baseSellingPrice.toLocaleString()
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right", children: [
                t("common.etb"),
                " ",
                item.basePurchasePrice.toLocaleString()
              ] })
            ] }, item.id)) })
          ] }) })
        ] });
      case "supplier_summary":
        if (supplierSummary.length === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-3xl border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: t("reports.supplier_summary_card") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: [
              t("reports.as_of_date"),
              " ",
              formatDate(/* @__PURE__ */ new Date())
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("suppliers.col_supplier") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("suppliers.stat_total") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("suppliers.stat_paid") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("suppliers.stat_outstanding") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: supplierSummary.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: row.supplierName }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right", children: [
                t("common.etb"),
                " ",
                (row.totalPurchases || 0).toLocaleString()
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right text-green-600", children: [
                t("common.etb"),
                " ",
                (row.totalPayments || 0).toLocaleString()
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right font-bold", style: { color: (row.outstandingBalance || 0) > 0 ? "var(--destructive)" : "var(--green-600)" }, children: [
                t("common.etb"),
                " ",
                (row.outstandingBalance || 0).toLocaleString()
              ] })
            ] }, row.id)) })
          ] }) })
        ] });
      case "supplier_transactions":
        if (supplierTransactions.length === 0 && supplierPayments.length === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-3xl border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: t("reports.purchase_transactions_card") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("suppliers.col_supplier") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("suppliers.col_purchase_no") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("suppliers.col_date") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("suppliers.col_total") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("suppliers.col_paid") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("suppliers.col_balance") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("suppliers.col_status") })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: supplierTransactions.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: row.supplierName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-xs", children: row.purchaseNumber || `#${row.id}` }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: formatDate(row.purchaseDate) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right", children: [
                  t("common.etb"),
                  " ",
                  (row.totalAmount || 0).toLocaleString()
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right text-green-600", children: [
                  t("common.etb"),
                  " ",
                  (row.paidAmount || 0).toLocaleString()
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right font-bold", style: { color: (row.remainingBalance || 0) > 0 ? "var(--destructive)" : "var(--green-600)" }, children: [
                  t("common.etb"),
                  " ",
                  (row.remainingBalance || 0).toLocaleString()
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: row.status === "received" ? "default" : "secondary", className: "text-xs", children: row.status }) })
              ] }, row.id)) })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-3xl border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: t("reports.payment_transactions_card") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("suppliers.col_supplier") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("suppliers.col_date") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("suppliers.col_amount") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("suppliers.col_method") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("suppliers.col_reference") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("suppliers.col_purchase_no") })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: supplierPayments.map((row, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: row.supplierName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: formatDate(row.paymentDate) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right font-semibold text-green-600", children: [
                  t("common.etb"),
                  " ",
                  (row.amount || 0).toLocaleString()
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs", children: row.paymentMethod }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-xs", children: row.referenceNumber || "-" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-xs", children: row.purchaseNumber || "-" })
              ] }, row.id || i)) })
            ] }) })
          ] })
        ] });
      default:
        return null;
    }
  };
  const renderExportButtons = () => {
    let showCSV = false;
    let showPDF = false;
    let csvHandler = () => {
    };
    let pdfHandler = () => {
    };
    switch (activeTab) {
      case "sales":
        showCSV = showPDF = !!analytics;
        csvHandler = exportSalesCSV;
        pdfHandler = exportSalesPDF;
        break;
      case "valuation":
        showCSV = showPDF = items.length > 0;
        csvHandler = exportValuationCSV;
        pdfHandler = exportValuationPDF;
        break;
      case "pnl":
        showCSV = showPDF = !!analytics;
        csvHandler = exportPNLCSV;
        pdfHandler = exportPNLPDF;
        break;
      case "catalog":
        showCSV = showPDF = items.length > 0;
        csvHandler = exportCatalogCSV;
        pdfHandler = exportCatalogPDF;
        break;
      case "supplier_summary":
        showCSV = showPDF = supplierSummary.length > 0;
        csvHandler = exportSupplierSummaryCSV;
        pdfHandler = exportSupplierSummaryPDF;
        break;
      case "supplier_transactions":
        showCSV = showPDF = supplierTransactions.length > 0;
        csvHandler = exportSupplierTransactionsCSV;
        pdfHandler = exportSupplierTransactionsPDF;
        break;
    }
    if (!showCSV && !showPDF) return null;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 justify-end", children: [
      showCSV && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: csvHandler, className: "text-xs font-bold uppercase tracking-widest", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 14, className: "mr-1" }),
        " ",
        t("reports.csv")
      ] }),
      showPDF && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: pdfHandler, className: "text-xs font-bold uppercase tracking-widest", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 14, className: "mr-1" }),
        " ",
        t("reports.pdf")
      ] })
    ] });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 py-4 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl md:text-3xl font-black tracking-tight uppercase", children: t("reports.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("reports.subtitle") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Tabs, { value: activeTab, onValueChange: (v) => {
        setActiveTab(v);
        setReportGenerated(false);
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "bg-muted p-1 rounded-xl h-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "sales", className: "text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg", children: t("reports.sales") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "valuation", className: "text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg", children: t("reports.valuation") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "pnl", className: "text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg", children: t("reports.pnl") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "catalog", className: "text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg", children: t("reports.catalog") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "supplier_summary", className: "text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { className: "h-3 w-3 mr-1" }),
          t("reports.tab_suppliers")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "supplier_transactions", className: "text-xs font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "h-3 w-3 mr-1" }),
          t("reports.tab_transactions")
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-2xl border-border bg-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-3 flex flex-col lg:flex-row items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex bg-muted p-1 rounded-xl w-fit border border-border", children: ["today", "week", "month", "year", "custom"].map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setPeriod(p),
              className: `px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${period === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`,
              children: t(`analytics.${p}`)
            },
            p
          )) }),
          period === "custom" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 bg-muted/50 p-2 rounded-xl border border-border animate-in fade-in slide-in-from-left-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 px-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase text-muted-foreground", children: t("analytics.start_date") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                DatePicker,
                {
                  value: dateRange.start,
                  onChange: (v) => setDateRange((prev) => ({ ...prev, start: v })),
                  className: "w-auto bg-background border-none text-xs font-bold"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 px-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase text-muted-foreground", children: t("analytics.end_date") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                DatePicker,
                {
                  value: dateRange.end,
                  onChange: (v) => setDateRange((prev) => ({ ...prev, end: v })),
                  className: "w-auto bg-background border-none text-xs font-bold"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: handleCustomSearch,
                className: "self-end p-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 14 })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: generateReport, disabled: loading, className: "h-9 px-6 text-xs font-bold uppercase tracking-widest shadow-xs", children: [
          loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mr-1" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { size: 14, className: "mr-1" }),
          t("reports.generate")
        ] })
      ] }) })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-destructive/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex items-center gap-3 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-5 w-5 text-destructive shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-destructive", children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setError(null), className: "ml-auto shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4 mr-1" }),
        " ",
        t("common.dismiss")
      ] })
    ] }) }) }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-muted-foreground" }) }) : reportGenerated ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6 space-y-6", children: [
      renderKPIs(),
      renderDataTable(),
      renderExportButtons()
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "h-12 w-12 mb-4 opacity-30" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-medium", children: t("reports.select_params") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-widest mt-1", children: t("reports.click_generate") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, { className: "my-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-black uppercase tracking-widest text-foreground", children: t("reports.low_stock_builder") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground mt-0.5", children: t("reports.order_builder_desc") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: fetchLowStock, disabled: lowStockLoading, variant: "outline", size: "sm", className: "text-xs font-bold uppercase tracking-widest", children: [
            lowStockLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mr-1" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 14, className: "mr-1" }),
            t("reports.fetch_low")
          ] })
        ] }),
        lowStockFetched && lowStockItems.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-8 flex flex-col items-center justify-center text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-10 w-10 mb-3 opacity-30" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: t("reports.no_low_stock") })
        ] }) }),
        lowStockItems.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("inventory.product") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("inventory.po_col_brand") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("suppliers.col_supplier") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("inventory.order_qty") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("common.amount") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("common.actions") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: lowStockItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-amber-500 shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-sm", children: item.name })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground text-xs", children: item.companyName || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground text-xs", children: item.supplierName || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    className: "w-20 h-8 font-bold text-center text-xs",
                    value: item.orderQty,
                    onChange: (e) => updateLowStockQty(item.id, parseInt(e.target.value) || 1),
                    min: 1
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold uppercase text-muted-foreground", children: [
                  item.baseUnit,
                  "s"
                ] })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right font-bold", children: [
                t("common.etb"),
                " ",
                (item.orderQty * (item.basePurchasePrice || 0)).toLocaleString()
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => removeLowStockItem(item.id), className: "text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) }) })
            ] }, item.id)) })
          ] }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: [
                t("inventory.total_items"),
                ": ",
                lowStockItems.length
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-black", children: [
                t("inventory.est_total_cost"),
                ": ",
                t("common.etb"),
                " ",
                lowStockItems.reduce((sum, item) => sum + item.orderQty * (item.basePurchasePrice || 0), 0).toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: generateOrderPDF, className: "text-xs font-bold uppercase tracking-widest shadow-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 14, className: "mr-1" }),
              " ",
              t("reports.gen_order_pdf")
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
};
export {
  Reports as default
};
