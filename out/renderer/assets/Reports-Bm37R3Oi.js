import { b as useSettings, r as reactExports, j as jsxRuntimeExports, q as Truck, s as Receipt, P as Package, e as Button, L as LoaderCircle, i as ChartColumn, f as CircleAlert, R as RefreshCw, a3 as Separator, T as TriangleAlert, g as Badge, K as Input, h as Trash2, J as FileText, a4 as CreditCard, aU as PiggyBank } from "./index-ym3eqgeD.js";
import { E, b as addPdfHeader, c as autoTable, e as exportCSV, a as exportPDF } from "./export-utils-CD8bvI2z.js";
import { C as Card, c as CardContent, L as Label, a as CardHeader, b as CardTitle, d as CardDescription } from "./label-DrbGdDFZ.js";
import { D as DatePicker } from "./DatePicker-D2bBCjpA.js";
import { T as Tabs, a as TabsList, b as TabsTrigger } from "./tabs-nLkAYW2x.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-zJbNveHv.js";
import { B as Ban } from "./ban-B1z94ABo.js";
import { R as RotateCcw } from "./rotate-ccw-CfuNW0OG.js";
import { C as Calendar } from "./calendar-BW8JAjre.js";
import { D as DollarSign } from "./dollar-sign-D_nhoQjA.js";
import { B as Boxes } from "./boxes-C7xxoU0I.js";
import { B as Banknote } from "./banknote-D95F4sVj.js";
import { T as TrendingUp } from "./trending-up-DdibX3P7.js";
import { D as Download } from "./download-BtcCF-M9.js";
import "./select-t5N9kU1h.js";
const Reports = () => {
  const { t, formatDate, currentBusiness } = useSettings();
  const [activeTab, setActiveTab] = reactExports.useState("sales");
  const [period, setPeriod] = reactExports.useState("month");
  const [dateRange, setDateRange] = reactExports.useState({ start: "", end: "" });
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [analytics, setAnalytics] = reactExports.useState(null);
  const [items, setItems] = reactExports.useState([]);
  const [expenses, setExpenses] = reactExports.useState([]);
  const [reportGenerated, setReportGenerated] = reactExports.useState(false);
  const [lowStockItems, setLowStockItems] = reactExports.useState([]);
  const [lowStockFetched, setLowStockFetched] = reactExports.useState(false);
  const [lowStockLoading, setLowStockLoading] = reactExports.useState(false);
  const [supplierSummary, setSupplierSummary] = reactExports.useState([]);
  const [supplierTransactions, setSupplierTransactions] = reactExports.useState([]);
  const [supplierPayments, setSupplierPayments] = reactExports.useState([]);
  const [inventoryBySupplier, setInventoryBySupplier] = reactExports.useState([]);
  const [voidedSales, setVoidedSales] = reactExports.useState([]);
  const [reversalData, setReversalData] = reactExports.useState([]);
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
        case "expenses": {
          const [expData, anData] = await Promise.all([
            window.api.getExpenses({ startDate: range.start, endDate: range.end }),
            window.api.getAnalytics(period, range)
          ]);
          setExpenses(Array.isArray(expData) ? expData : []);
          setAnalytics(anData);
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
        case "inventory_by_supplier": {
          const data = await window.api.getInventoryBySupplierReport();
          setInventoryBySupplier(Array.isArray(data) ? data : []);
          break;
        }
        case "voided_sales": {
          const vs = await window.api.getVoidedSales({ startDate: range.start, endDate: range.end });
          setVoidedSales(Array.isArray(vs) ? vs : []);
          break;
        }
        case "reversals": {
          const dp = await window.api.getAuditLogs({ action: "reverse_payment" });
          const sa = await window.api.getAuditLogs({ action: "reverse_adjustment" });
          setReversalData([...Array.isArray(dp) ? dp : [], ...Array.isArray(sa) ? sa : []]);
          break;
        }
      }
      setReportGenerated(true);
    } catch (e) {
      setError(e.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    if (period !== "custom" || dateRange.start && dateRange.end) {
      setReportGenerated(false);
    }
  }, [activeTab, period, dateRange]);
  const fetchLowStock = async () => {
    setLowStockLoading(true);
    setError(null);
    try {
      const data = await window.api.getLowStockItems();
      const list = Array.isArray(data) ? data : [];
      setLowStockItems(list.map((i) => ({
        ...i,
        orderQty: (i.unitsPerPack || 1) * 3
      })));
      setLowStockFetched(true);
    } catch (e) {
      setError(e.message || "Failed to fetch low stock items");
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
    const headers = ["Date", "Revenue", "Units Sold", "Profit"];
    const rows = analytics.salesData.map((s) => [s.date, s.revenue, s.units, s.profit]);
    exportCSV(headers, rows, "sales-performance");
  };
  const exportSalesPDF = () => {
    if (!analytics) return;
    const headers = ["Date", "Revenue", "Units Sold", "Profit"];
    const rows = analytics.salesData.map((s) => [s.date, String(s.revenue), String(s.units), String(s.profit)]);
    const totalUnits = analytics.salesData.reduce((a, s) => a + s.units, 0);
    exportPDF("Sales Performance Report", headers, rows, "sales-performance", ["", "Total", String(totalUnits), String(analytics.summary.totalProfit)], void 0, currentBusiness);
  };
  const exportValuationCSV = () => {
    const headers = ["Product", "Category", "Base Qty", "Unit", "Unit Cost", "Total Value"];
    const rows = items.map((i) => [i.name, i.categoryName || "", i.totalBaseQuantity, i.baseUnit, i.basePurchasePrice, (i.totalBaseQuantity * i.basePurchasePrice).toLocaleString()]);
    exportCSV(headers, rows, "stock-valuation");
  };
  const exportValuationPDF = () => {
    const headers = ["Product", "Category", "Base Qty", "Unit", "Unit Cost", "Total Value"];
    const rows = items.map((i) => [i.name, i.categoryName || "", String(i.totalBaseQuantity), i.baseUnit, String(i.basePurchasePrice), String(i.totalBaseQuantity * i.basePurchasePrice)]);
    const total = items.reduce((s, i) => s + i.totalBaseQuantity * i.basePurchasePrice, 0);
    exportPDF("Stock Valuation Report", headers, rows, "stock-valuation", ["", "", "", "", "Grand Total", String(total)], void 0, currentBusiness);
  };
  const exportExpenseCSV = () => {
    const headers = ["Date", "Name", "Category", "Amount"];
    const rows = expenses.map((e) => [e.date, e.name, e.category, e.amount]);
    exportCSV(headers, rows, "expense-report");
  };
  const exportExpensePDF = () => {
    const headers = ["Date", "Name", "Category", "Amount"];
    const rows = expenses.map((e) => [e.date, e.name, e.category, String(e.amount)]);
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    exportPDF("Expense Report", headers, rows, "expense-report", ["", "", "Total", String(total)], void 0, currentBusiness);
  };
  const exportPNLCSV = () => {
    if (!analytics) return;
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Revenue", analytics.summary.totalRevenue],
      ["Total Expenses", analytics.summary.totalExpenses],
      ["Gross Profit", analytics.summary.totalProfit],
      ["Net Profit", analytics.summary.netProfit]
    ];
    exportCSV(headers, rows, "profit-loss");
  };
  const exportPNLPDF = () => {
    if (!analytics) return;
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Revenue", String(analytics.summary.totalRevenue)],
      ["Total Expenses", String(analytics.summary.totalExpenses)],
      ["Gross Profit", String(analytics.summary.totalProfit)],
      ["Net Profit", String(analytics.summary.netProfit)]
    ];
    exportPDF("Profit & Loss Report", headers, rows, "profit-loss", void 0, void 0, currentBusiness);
  };
  const exportCatalogCSV = () => {
    const headers = ["Product", "Category", "Brand", "Base Qty", "Unit", "Selling Price", "Purchase Price"];
    const rows = items.map((i) => [i.name, i.categoryName || "", i.companyName || "", i.totalBaseQuantity, i.baseUnit, i.baseSellingPrice, i.basePurchasePrice]);
    exportCSV(headers, rows, "product-catalog");
  };
  const exportCatalogPDF = () => {
    const headers = ["Product", "Category", "Brand", "Base Qty", "Unit", "Selling Price", "Purchase Price"];
    const rows = items.map((i) => [i.name, i.categoryName || "", i.companyName || "", String(i.totalBaseQuantity), i.baseUnit, String(i.baseSellingPrice), String(i.basePurchasePrice)]);
    exportPDF("Product Catalog Report", headers, rows, "product-catalog", void 0, void 0, currentBusiness);
  };
  const exportSupplierSummaryCSV = () => {
    const headers = ["Supplier", "Total Purchases", "Total Payments", "Outstanding Balance"];
    const rows = supplierSummary.map((r) => [r.supplierName, r.totalPurchases, r.totalPayments, r.outstandingBalance]);
    exportCSV(headers, rows, "supplier-summary");
  };
  const exportSupplierSummaryPDF = () => {
    const headers = ["Supplier", "Total Purchases", "Total Payments", "Outstanding Balance"];
    const rows = supplierSummary.map((r) => [r.supplierName, String(r.totalPurchases), String(r.totalPayments), String(r.outstandingBalance)]);
    const totalPurchases = supplierSummary.reduce((s, r) => s + (r.totalPurchases || 0), 0);
    const totalPayments = supplierSummary.reduce((s, r) => s + (r.totalPayments || 0), 0);
    const totalOutstanding = supplierSummary.reduce((s, r) => s + (r.outstandingBalance || 0), 0);
    exportPDF("Supplier Summary Report", headers, rows, "supplier-summary", ["Total", String(totalPurchases), String(totalPayments), String(totalOutstanding)], void 0, currentBusiness);
  };
  const exportSupplierTransactionsCSV = () => {
    const headers = ["Supplier", "Order#", "Date", "Total Amount", "Paid Amount", "Balance", "Status"];
    const rows = supplierTransactions.map((r) => [r.supplierName, r.purchaseNumber || `#${r.id}`, r.purchaseDate, r.totalAmount, r.paidAmount, r.remainingBalance, r.status]);
    exportCSV(headers, rows, "supplier-transactions");
  };
  const exportSupplierTransactionsPDF = () => {
    const headers = ["Supplier", "Order#", "Date", "Total Amount", "Paid Amount", "Balance", "Status"];
    const rows = supplierTransactions.map((r) => [r.supplierName, r.purchaseNumber || `#${r.id}`, r.purchaseDate, String(r.totalAmount), String(r.paidAmount), String(r.remainingBalance), r.status]);
    exportPDF("Supplier Transaction Report", headers, rows, "supplier-transactions", [], void 0, currentBusiness);
  };
  const exportInventoryBySupplierCSV = () => {
    const headers = ["Supplier", "Product Count", "Stock Quantity", "Inventory Value", "Last Supply Date"];
    const rows = inventoryBySupplier.map((r) => [r.supplierName, r.productCount, r.totalStockQuantity, r.inventoryValue, r.lastSupplyDate || ""]);
    exportCSV(headers, rows, "inventory-by-supplier");
  };
  const exportInventoryBySupplierPDF = () => {
    const headers = ["Supplier", "Product Count", "Stock Quantity", "Inventory Value", "Last Supply Date"];
    const rows = inventoryBySupplier.map((r) => [r.supplierName, String(r.productCount), String(r.totalStockQuantity), String(r.inventoryValue), r.lastSupplyDate || ""]);
    exportPDF("Inventory by Supplier Report", headers, rows, "inventory-by-supplier", [], void 0, currentBusiness);
  };
  const exportVoidedSalesCSV = () => {
    const headers = ["Sale #", "Product", "Amount", "Reason", "Voided By", "Date"];
    const rows = voidedSales.map((r) => [r.id, r.name || `Item #${r.itemId}`, r.totalPrice, r.voidReason || "", r.voidedBy || "", r.voidedAt || ""]);
    exportCSV(headers, rows, "voided-sales");
  };
  const exportVoidedSalesPDF = () => {
    const headers = ["Sale #", "Product", "Amount", "Reason", "Voided By", "Date"];
    const rows = voidedSales.map((r) => [String(r.id), r.name || `Item #${r.itemId}`, String(r.totalPrice), r.voidReason || "", r.voidedBy || "", r.voidedAt || ""]);
    exportPDF("Voided Sales Report", headers, rows, "voided-sales", [], void 0, currentBusiness);
  };
  const exportReversalsCSV = () => {
    const headers = ["Action", "Entity", "Entity ID", "Description", "Changed By", "Date"];
    const rows = reversalData.map((r) => [r.action, r.entityType || "", String(r.entityId || ""), r.description || "", r.changedBy || "", r.createdAt || ""]);
    exportCSV(headers, rows, "reversals");
  };
  const exportReversalsPDF = () => {
    const headers = ["Action", "Entity", "Entity ID", "Description", "Changed By", "Date"];
    const rows = reversalData.map((r) => [r.action, r.entityType || "", String(r.entityId || ""), r.description || "", r.changedBy || "", r.createdAt || ""]);
    exportPDF("Reversals Report", headers, rows, "reversals", [], void 0, currentBusiness);
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
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: formattedRange })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("summary.total_sales") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              (analytics.summary.totalRevenue || 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.profit") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("summary.total_sales") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              (analytics.summary.totalProfit || 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.expenses") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("summary.total_expenses") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              (analytics.summary.totalExpenses || 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PiggyBank, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.net") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("summary.net_cashflow") }),
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
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.total_skus") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("reports.total_skus") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight", children: items.length })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.inventory_value") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("reports.inventory_value") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              totalValue.toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.avg_value") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("reports.avg_value") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              (items.length > 0 ? totalValue / items.length : 0).toLocaleString()
            ] })
          ] }) })
        ] });
      case "expenses":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 @xl/main:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: formattedRange })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("summary.total_expenses") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.count") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("reports.entries") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight", children: expenses.length })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.categories") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("reports.categories") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight", children: new Set(expenses.map((e) => e.category)).size })
          ] }) })
        ] });
      case "pnl":
        if (!analytics) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @4xl/main:grid-cols-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: formattedRange })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("summary.total_sales") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              (analytics.summary.totalRevenue || 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.expenses") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("summary.total_expenses") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              (analytics.summary.totalExpenses || 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.gross_profit") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("reports.gross_profit") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: `text-2xl font-black tracking-tight ${(analytics.summary.totalProfit || 0) >= 0 ? "text-green-500" : "text-red-500"}`, children: [
              t("common.etb"),
              " ",
              (analytics.summary.totalProfit || 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PiggyBank, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.margin") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("reports.net_margin") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: `text-2xl font-black tracking-tight ${(analytics.summary.netProfit || 0) >= 0 ? "text-green-500" : "text-red-500"}`, children: analytics.summary.totalRevenue > 0 ? `${(analytics.summary.netProfit / analytics.summary.totalRevenue * 100).toFixed(1)}%` : "0%" })
          ] }) })
        ] });
      case "supplier_summary":
        if (supplierSummary.length === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 @xl/main:grid-cols-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.total") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("suppliers.title") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight", children: supplierSummary.length })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.total") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("suppliers.stat_total") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              supplierSummary.reduce((s, r) => s + (r.totalPurchases || 0), 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.total") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("suppliers.stat_paid") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              supplierSummary.reduce((s, r) => s + (r.totalPayments || 0), 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: "Outstanding" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("suppliers.stat_outstanding") }),
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
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: supplierTransactions.length })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("suppliers.section_purchases") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              supplierTransactions.reduce((s, r) => s + (r.totalAmount || 0), 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: supplierPayments.length })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("suppliers.section_payments") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              supplierPayments.reduce((s, r) => s + (r.amount || 0), 0).toLocaleString()
            ] })
          ] }) })
        ] });
      case "inventory_by_supplier":
        if (inventoryBySupplier.length === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 @xl/main:grid-cols-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: inventoryBySupplier.length })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("suppliers.title") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight", children: inventoryBySupplier.filter((r) => r.productCount > 0).length })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("inventory.total") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("reports.total_skus") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight", children: inventoryBySupplier.reduce((s, r) => s + (r.productCount || 0), 0) })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Boxes, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("inventory.qty") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: "Total Stock" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight", children: Math.round(inventoryBySupplier.reduce((s, r) => s + (r.totalStockQuantity || 0), 0)).toLocaleString() })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: "Value" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("inventory.total_value") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              Math.round(inventoryBySupplier.reduce((s, r) => s + (r.inventoryValue || 0), 0)).toLocaleString()
            ] })
          ] }) })
        ] });
      case "catalog":
        if (items.length === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 @xl/main:grid-cols-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Boxes, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.total_skus") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("reports.total_skus") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight", children: items.length })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.categories") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("reports.categories") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight", children: new Set(items.map((i) => i.categoryName).filter(Boolean)).size })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.inventory_value") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("reports.inventory_value") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              totalValue.toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.low_stock") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("reports.low_stock") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight text-amber-500", children: items.filter((i) => i.totalBaseQuantity > 0 && i.totalBaseQuantity < 10).length })
          ] }) })
        ] });
      case "voided_sales":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 @xl/main:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: formattedRange })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("reports.voided_sales") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight text-destructive", children: voidedSales.length })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.total_amount") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("reports.total_amount") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-black tracking-tight", children: [
              t("common.etb"),
              " ",
              voidedSales.reduce((s, v) => s + (v.totalPrice || 0), 0).toLocaleString()
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.unique_voiders") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("reports.unique_voiders") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight", children: new Set(voidedSales.map((v) => v.voidedBy).filter(Boolean)).size })
          ] }) })
        ] });
      case "reversals":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 @xl/main:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: formattedRange })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("reports.total_reversals") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tight", children: reversalData.length })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border bg-gradient-to-t from-primary/5 to-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: t("reports.types") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1", children: t("reports.types") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-black tracking-tight", children: [
              "Payments: ",
              reversalData.filter((r) => r.action === "reverse_payment").length,
              " / Adjustments: ",
              reversalData.filter((r) => r.action === "reverse_adjustment").length
            ] })
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
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground", children: formattedRange })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("reports.date") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("common.revenue") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("reports.units") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("common.profit") })
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
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground", children: [
              t("reports.as_of_date"),
              " ",
              formatDate(/* @__PURE__ */ new Date())
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("inventory.product") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("common.category") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("inventory.qty") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("inventory.unit_cost") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("inventory.total_value") })
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
      case "expenses":
        if (expenses.length === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-3xl border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: t("reports.expense_data") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground", children: formattedRange })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("reports.date") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("common.name") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("common.category") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("common.amount") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: expenses.map((exp) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: formatDate(exp.date) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: exp.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest", children: exp.category }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right font-bold", children: [
                t("common.etb"),
                " ",
                exp.amount.toLocaleString()
              ] })
            ] }, exp.id)) })
          ] }) })
        ] });
      case "pnl":
        if (!analytics) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-3xl border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: t("reports.pnl_statement") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground", children: formattedRange })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("reports.metric") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("common.amount") })
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
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: t("summary.total_expenses") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right text-red-500 font-bold", children: [
                  t("common.etb"),
                  " -",
                  (analytics.summary.totalExpenses || 0).toLocaleString()
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
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground", children: [
              t("reports.as_of_date"),
              " ",
              formatDate(/* @__PURE__ */ new Date())
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("inventory.product") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("common.category") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("inventory.brand") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("inventory.stock") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("inventory.selling_price") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("inventory.purchase_price") })
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
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: "Supplier Summary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground", children: [
              t("reports.as_of_date"),
              " ",
              formatDate(/* @__PURE__ */ new Date())
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("suppliers.col_supplier") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("suppliers.stat_total") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("suppliers.stat_paid") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("suppliers.stat_outstanding") })
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
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: "Purchase Transactions" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("suppliers.col_supplier") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("suppliers.col_purchase_no") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("suppliers.col_date") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("suppliers.col_total") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("suppliers.col_paid") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("suppliers.col_balance") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("suppliers.col_status") })
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
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: row.status === "received" ? "default" : "secondary", className: "text-[10px]", children: row.status }) })
              ] }, row.id)) })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-3xl border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: "Payment Transactions" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("suppliers.col_supplier") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("suppliers.col_date") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("suppliers.col_amount") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("suppliers.col_method") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("suppliers.col_reference") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("suppliers.col_purchase_no") })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: supplierPayments.map((row, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: row.supplierName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: formatDate(row.paymentDate) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right font-semibold text-green-600", children: [
                  t("common.etb"),
                  " ",
                  (row.amount || 0).toLocaleString()
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[10px]", children: row.paymentMethod }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-xs", children: row.referenceNumber || "-" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-xs", children: row.purchaseNumber || "-" })
              ] }, row.id || i)) })
            ] }) })
          ] })
        ] });
      case "inventory_by_supplier":
        if (inventoryBySupplier.length === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-3xl border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: "Inventory by Supplier" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground", children: [
              t("reports.as_of_date"),
              " ",
              formatDate(/* @__PURE__ */ new Date())
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("suppliers.col_supplier") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("reports.total_skus") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("inventory.stock") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("inventory.total_value") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("suppliers.col_last_date") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: inventoryBySupplier.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: row.supplierName }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: row.productCount || 0 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: Math.round(row.totalStockQuantity || 0).toLocaleString() }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right font-bold", children: [
                t("common.etb"),
                " ",
                Math.round(row.inventoryValue || 0).toLocaleString()
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: row.lastSupplyDate ? formatDate(row.lastSupplyDate) : "-" })
            ] }, row.supplierId)) })
          ] }) })
        ] });
      case "voided_sales":
        if (voidedSales.length === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-3xl border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: t("reports.voided_sales") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground", children: formattedRange })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: "#" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("inventory.product") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("common.amount") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("reports.void_reason") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("reports.voided_by") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("common.date") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: voidedSales.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-xs", children: row.id }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: row.name || `Item #${row.itemId}` }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right font-bold text-destructive", children: [
                t("common.etb"),
                " ",
                (row.totalPrice || 0).toLocaleString()
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs max-w-[200px] truncate", children: row.voidReason || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: row.voidedBy || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right text-xs text-muted-foreground", children: row.voidedAt ? formatDate(row.voidedAt) : "-" })
            ] }, row.id)) })
          ] }) })
        ] });
      case "reversals":
        if (reversalData.length === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-3xl border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: t("reports.reversals") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground", children: formattedRange })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("reports.action") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("reports.entity") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: "ID" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("reports.description") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("audit_logs.by") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("common.date") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: reversalData.map((row, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: row.action === "reverse_payment" ? "default" : "secondary", className: "text-[8px] font-black uppercase", children: row.action === "reverse_payment" ? "Payment" : "Adjustment" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs", children: row.entityType || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right font-mono text-xs", children: row.entityId || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs max-w-[250px] truncate", children: row.description || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs", children: row.changedBy || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right text-xs text-muted-foreground", children: row.createdAt ? formatDate(row.createdAt) : "-" })
            ] }, row.id || i)) })
          ] }) })
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
      case "expenses":
        showCSV = showPDF = expenses.length > 0;
        csvHandler = exportExpenseCSV;
        pdfHandler = exportExpensePDF;
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
      case "inventory_by_supplier":
        showCSV = showPDF = inventoryBySupplier.length > 0;
        csvHandler = exportInventoryBySupplierCSV;
        pdfHandler = exportInventoryBySupplierPDF;
        break;
      case "voided_sales":
        showCSV = showPDF = voidedSales.length > 0;
        csvHandler = exportVoidedSalesCSV;
        pdfHandler = exportVoidedSalesPDF;
        break;
      case "reversals":
        showCSV = showPDF = reversalData.length > 0;
        csvHandler = exportReversalsCSV;
        pdfHandler = exportReversalsPDF;
        break;
    }
    if (!showCSV && !showPDF) return null;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 justify-end", children: [
      showCSV && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: csvHandler, className: "text-[10px] font-bold uppercase tracking-widest", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 14, className: "mr-1" }),
        " CSV"
      ] }),
      showPDF && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: pdfHandler, className: "text-[10px] font-bold uppercase tracking-widest", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 14, className: "mr-1" }),
        " PDF"
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
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "sales", className: "text-[10px] font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg", children: t("reports.sales") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "valuation", className: "text-[10px] font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg", children: t("reports.valuation") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "expenses", className: "text-[10px] font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg", children: t("reports.expenses") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "pnl", className: "text-[10px] font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg", children: t("reports.pnl") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "catalog", className: "text-[10px] font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg", children: t("reports.catalog") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "supplier_summary", className: "text-[10px] font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { className: "h-3 w-3 mr-1" }),
          "Suppliers"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "supplier_transactions", className: "text-[10px] font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "h-3 w-3 mr-1" }),
          "Transactions"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "inventory_by_supplier", className: "text-[10px] font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-3 w-3 mr-1" }),
          "By Supplier"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "voided_sales", className: "text-[10px] font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { className: "h-3 w-3 mr-1" }),
          t("reports.voided_sales")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "reversals", className: "text-[10px] font-bold uppercase tracking-wider px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-3 w-3 mr-1" }),
          t("reports.reversals")
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-2xl border-border bg-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-3 flex flex-col lg:flex-row items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex bg-muted p-1 rounded-xl w-fit border border-border", children: ["today", "week", "month", "year", "custom"].map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setPeriod(p),
              className: `px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${period === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`,
              children: t(`analytics.${p}`)
            },
            p
          )) }),
          period === "custom" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 bg-muted/50 p-2 rounded-xl border border-border animate-in fade-in slide-in-from-left-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 px-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[9px] font-bold uppercase text-muted-foreground", children: t("analytics.start_date") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                DatePicker,
                {
                  value: dateRange.start,
                  onChange: (v) => setDateRange((prev) => ({ ...prev, start: v })),
                  className: "h-7 w-32 bg-background border-none text-[10px] font-bold grow"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 px-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[9px] font-bold uppercase text-muted-foreground", children: t("analytics.end_date") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                DatePicker,
                {
                  value: dateRange.end,
                  onChange: (v) => setDateRange((prev) => ({ ...prev, end: v })),
                  className: "h-7 w-32 bg-background border-none text-[10px] font-bold grow"
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
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: generateReport, disabled: loading, className: "h-9 px-6 text-[10px] font-bold uppercase tracking-widest shadow-xs", children: [
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
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5", children: t("reports.order_builder_desc") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: fetchLowStock, disabled: lowStockLoading, variant: "outline", size: "sm", className: "text-[10px] font-bold uppercase tracking-widest", children: [
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
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("inventory.product") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest", children: t("suppliers.col_supplier") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("inventory.in_stock") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("inventory.order_qty") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("common.amount") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-[10px] font-black uppercase tracking-widest text-right", children: t("common.actions") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: lowStockItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-amber-500 shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-sm", children: item.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground uppercase font-bold tracking-widest", children: item.companyName || "" })
                ] })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground text-xs", children: item.supplierName || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: item.totalBaseQuantity <= 0 ? "destructive" : "outline", className: "text-[9px] font-black uppercase", children: [
                item.totalBaseQuantity,
                " ",
                item.baseUnit
              ] }) }),
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
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold uppercase text-muted-foreground", children: [
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
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: [
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
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: generateOrderPDF, className: "text-[10px] font-bold uppercase tracking-widest shadow-xs", children: [
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
