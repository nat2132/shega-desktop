import { c as createLucideIcon, b as useSettings, r as reactExports, t as toEthiopianDate, o as getEthiopianMonthName, j as jsxRuntimeExports, e as Button, ag as ChartPie, k as ChartColumn, Q as FileText, h as Clock, T as TriangleAlert, g as Badge, ay as Copy, x as Eye, y as Trash2, Z as Download, M as Modal, V as Input, _ as toast, b7 as fromEthiopianDate } from "./index-fMHJoXSU.js";
import { S as SectionCards } from "./section-cards-Bqgbso3Z.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-n7mzR4VO.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-fXD-jcqv.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent, d as CardDescription } from "./card-MDpMDtbv.js";
import { e as exportCSV, a as exportPDF } from "./export-utils-3HNJ-KOe.js";
import { W as Wallet } from "./wallet-Dt9BVCeU.js";
import { P as Plus } from "./plus-DnJWnBIF.js";
import { T as TrendingUp } from "./trending-up-_Lu774B_.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const RefreshCcw = createLucideIcon("RefreshCcw", [
  ["path", { d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "14sxne" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }],
  ["path", { d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16", key: "1hlbsb" }],
  ["path", { d: "M16 16h5v5", key: "ccwih5" }]
]);
const BUDGET_CATEGORY_VALUES = [
  "Employee Salaries/Labor",
  "Rent",
  "Utilities (Electricity, Water, Internet)",
  "Transportation",
  "Inventory Purchases",
  "Marketing & Advertising",
  "Maintenance & Repairs",
  "Taxes & Government Fees",
  "Loan Repayments",
  "Miscellaneous Expenses"
];
const BUDGET_CATEGORY_KEYS = [
  "budgets.category_employee_salaries",
  "budgets.category_rent",
  "budgets.category_utilities",
  "budgets.category_transportation",
  "budgets.category_inventory_purchases",
  "budgets.category_marketing",
  "budgets.category_maintenance",
  "budgets.category_taxes",
  "budgets.category_loan",
  "budgets.category_misc"
];
const BUDGET_TYPES = [
  { id: "business", label: "budgets.type_business" },
  { id: "department", label: "budgets.type_department" },
  { id: "project", label: "budgets.type_project" },
  { id: "branch", label: "budgets.type_branch" }
];
const PERIODS = [
  { id: "monthly", label: "budgets.monthly" },
  { id: "quarterly", label: "budgets.quarterly" },
  { id: "yearly", label: "budgets.yearly" }
];
const statusConfig = {
  healthy: { color: "text-green-600", bg: "bg-green-100", labelKey: "budgets.status_healthy" },
  warning: { color: "text-yellow-600", bg: "bg-yellow-100", labelKey: "budgets.status_warning" },
  critical: { color: "text-red-600", bg: "bg-red-100", labelKey: "budgets.status_critical" }
};
const BudgetManagement = () => {
  const { t, formatDate, currentBusiness, calendarType } = useSettings();
  const [budgets, setBudgets] = reactExports.useState([]);
  const [alerts, setAlerts] = reactExports.useState([]);
  const [adjustments] = reactExports.useState([]);
  const [report, setReport] = reactExports.useState(null);
  const [forecast, setForecast] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [activeTab, setActiveTab] = reactExports.useState("dashboard");
  const isEthiopian = calendarType === "ethiopian";
  const [period, setPeriod] = reactExports.useState("monthly");
  const [budgetType, setBudgetType] = reactExports.useState("business");
  const [selectedMonth, setSelectedMonth] = reactExports.useState(String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0"));
  const [selectedYear, setSelectedYear] = reactExports.useState(String((/* @__PURE__ */ new Date()).getFullYear()));
  const [ethMonth, setEthMonth] = reactExports.useState(String(toEthiopianDate(/* @__PURE__ */ new Date()).month).padStart(2, "0"));
  const [ethYear, setEthYear] = reactExports.useState(String(toEthiopianDate(/* @__PURE__ */ new Date()).year));
  const [showBudgetModal, setShowBudgetModal] = reactExports.useState(false);
  const [showAdjustModal, setShowAdjustModal] = reactExports.useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = reactExports.useState(false);
  const [editingBudget, setEditingBudget] = reactExports.useState(null);
  const [detailBudget, setDetailBudget] = reactExports.useState(null);
  const [detailExpenses, setDetailExpenses] = reactExports.useState([]);
  const [detailAdjustments, setDetailAdjustments] = reactExports.useState([]);
  const [detailAlerts, setDetailAlerts] = reactExports.useState([]);
  const [detailLoading, setDetailLoading] = reactExports.useState(false);
  const [formData, setFormData] = reactExports.useState({
    category: BUDGET_CATEGORY_VALUES[0],
    amount: "",
    period: "monthly",
    month: String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0"),
    year: String((/* @__PURE__ */ new Date()).getFullYear()),
    budgetType: "business",
    referenceName: "",
    isRecurring: false,
    notes: ""
  });
  const ethToGreg = (ethM, ethY) => {
    const g = fromEthiopianDate(parseInt(ethY), parseInt(ethM), 1);
    return { month: String(g.getMonth() + 1).padStart(2, "0"), year: String(g.getFullYear()) };
  };
  const gregToEth = (gM, gY) => {
    const gDate = new Date(parseInt(gY), parseInt(gM) - 1, 1);
    const e = toEthiopianDate(gDate);
    return { month: String(e.month).padStart(2, "0"), year: String(e.year) };
  };
  const handleMonthChange = (val) => {
    if (isEthiopian) {
      setEthMonth(val);
      const g = ethToGreg(val, ethYear);
      setSelectedMonth(g.month);
      setSelectedYear(g.year);
    } else {
      setSelectedMonth(val);
    }
  };
  const handleYearChange = (val) => {
    if (isEthiopian) {
      setEthYear(val);
      const g = ethToGreg(ethMonth, val);
      setSelectedMonth(g.month);
      setSelectedYear(g.year);
    } else {
      setSelectedYear(val);
    }
  };
  const monthOptions = isEthiopian ? Array.from({ length: 13 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    return { value: m, label: getEthiopianMonthName(i) };
  }) : Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    const monthKeys2 = ["budgets.month_jan", "budgets.month_feb", "budgets.month_mar", "budgets.month_apr", "budgets.month_may", "budgets.month_jun", "budgets.month_jul", "budgets.month_aug", "budgets.month_sep", "budgets.month_oct", "budgets.month_nov", "budgets.month_dec"];
    return { value: m, label: t(monthKeys2[i]) };
  });
  const displayMonth = isEthiopian ? ethMonth : selectedMonth;
  const displayYear = isEthiopian ? ethYear : selectedYear;
  const monthKeys = ["budgets.month_jan", "budgets.month_feb", "budgets.month_mar", "budgets.month_apr", "budgets.month_may", "budgets.month_jun", "budgets.month_jul", "budgets.month_aug", "budgets.month_sep", "budgets.month_oct", "budgets.month_nov", "budgets.month_dec"];
  const periodLabel = isEthiopian ? `${getEthiopianMonthName(parseInt(displayMonth) - 1)} ${displayYear}` : `${t(monthKeys[parseInt(selectedMonth) - 1])} ${selectedYear}`;
  const loadData = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const [budgetsData, alertsData, reportData, forecastData] = await Promise.all([
        window.api?.getBudgets({ period, month: selectedMonth, year: selectedYear, budgetType }) || Promise.resolve([]),
        window.api?.getBudgetAlerts({ acknowledged: false, limit: 20 }) || Promise.resolve([]),
        window.api?.getBudgetReport({ month: selectedMonth, year: selectedYear }) || Promise.resolve({}),
        window.api?.getBudgetForecast({ months: 3 }) || Promise.resolve([])
      ]);
      setBudgets(budgetsData);
      setAlerts(alertsData);
      setReport(reportData);
      setForecast(forecastData);
    } catch (err) {
      console.error("Failed to load budget data:", err);
    }
    setLoading(false);
  }, [period, selectedMonth, selectedYear, budgetType]);
  reactExports.useEffect(() => {
    loadData();
  }, [loadData]);
  const handleSetBudget = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error(t("budgets.budget_amount_error"));
      return;
    }
    await window.api?.setBudget({
      category: formData.category,
      amount: parseFloat(formData.amount),
      period: formData.period,
      month: formData.month,
      year: formData.year,
      budgetType: formData.budgetType,
      referenceName: formData.referenceName || null,
      isRecurring: formData.isRecurring,
      notes: formData.notes || null
    });
    toast.success(editingBudget ? t("budgets.budget_updated") : t("budgets.budget_set_success"));
    setShowBudgetModal(false);
    setEditingBudget(null);
    resetForm();
    loadData();
  };
  const handleDeleteBudget = async (id) => {
    await window.api?.deleteBudget(id);
    toast.success(t("budgets.budget_deleted_msg"));
    loadData();
  };
  const handleDuplicate = async () => {
    const targetMonth = document.getElementById("dupMonth");
    const targetYear = document.getElementById("dupYear");
    const toMonth = targetMonth?.value || selectedMonth;
    const toYear = targetYear?.value || selectedYear;
    const result = await window.api?.duplicateBudget(
      { month: selectedMonth, year: selectedYear },
      toMonth,
      toYear
    );
    if (result?.count && result.count > 0) {
      toast.success(t("budgets.duplicate_count", { count: result.count }));
      setShowDuplicateModal(false);
      loadData();
    } else {
      toast(t("budgets.duplicate_exists"));
    }
  };
  const handleCreateAdjustment = async () => {
    if (!showAdjustModal) return;
    const reason = document.getElementById("adjReason")?.value;
    if (!reason) {
      toast.error(t("budgets.adjust_reason_required"));
      return;
    }
    const newAmount = parseFloat(document.getElementById("adjAmount")?.value);
    if (!newAmount || newAmount <= 0) {
      toast.error(t("budgets.adjust_amount_required"));
      return;
    }
    await window.api?.createBudgetAdjustment({
      budgetId: showAdjustModal.id,
      previousAmount: showAdjustModal.amount,
      newAmount,
      reason,
      status: "approved",
      requestedBy: "Admin"
    });
    toast.success(t("budgets.budget_adjusted"));
    setShowAdjustModal(null);
    loadData();
  };
  const handleExport = (type) => {
    if (!report?.categories) return;
    const headers = [
      t("budgets.col_category"),
      t("budgets.col_planned"),
      t("budgets.col_actual"),
      t("budgets.col_remaining"),
      t("budgets.col_used_percent"),
      t("budgets.col_status")
    ];
    const rows = report.categories.map((c) => [
      c.category,
      `${t("common.etb")} ${c.planned.toLocaleString()}`,
      `${t("common.etb")} ${c.actual.toLocaleString()}`,
      `${t("common.etb")} ${c.remaining.toLocaleString()}`,
      `${c.usagePercent}%`,
      c.status
    ]);
    const filename = `budget-report-${periodLabel.replace(/\s+/g, "-")}`;
    if (type === "csv") {
      exportCSV(headers, rows, filename);
    } else {
      exportPDF(t("budgets.report_title", { period: periodLabel }), headers, rows, filename, void 0, void 0, currentBusiness);
    }
    toast.success(t("budgets.export_success", { type: type.toUpperCase() }));
  };
  const resetForm = () => {
    setFormData({
      category: BUDGET_CATEGORY_VALUES[0],
      amount: "",
      period: "monthly",
      month: String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0"),
      year: String((/* @__PURE__ */ new Date()).getFullYear()),
      budgetType: "business",
      referenceName: "",
      isRecurring: false,
      notes: ""
    });
  };
  const openEditBudget = (budget) => {
    setFormData({
      category: budget.category,
      amount: String(budget.amount),
      period: budget.period,
      month: budget.month || selectedMonth,
      year: budget.year || selectedYear,
      budgetType: budget.budgetType || "business",
      referenceName: budget.referenceName || "",
      isRecurring: !!budget.isRecurring,
      notes: budget.notes || ""
    });
    setEditingBudget(budget);
    setShowBudgetModal(true);
  };
  const openBudgetDetails = async (budget) => {
    setDetailBudget(budget);
    setDetailLoading(true);
    try {
      const [exps, adjs, alerts2] = await Promise.all([
        window.api?.getExpenses({ category: budget.category, limit: 200 }) || Promise.resolve([]),
        window.api?.getBudgetAdjustments(budget.id) || Promise.resolve([]),
        window.api?.getBudgetAlerts({ acknowledged: false, limit: 50 }) || Promise.resolve([])
      ]);
      setDetailExpenses(exps);
      setDetailAdjustments(adjs);
      setDetailAlerts((alerts2 || []).filter((a) => a.category === budget.category));
    } catch (err) {
      console.error("Failed to load budget details:", err);
      setDetailExpenses([]);
      setDetailAdjustments([]);
      setDetailAlerts([]);
    }
    setDetailLoading(false);
  };
  const detailTrend = reactExports.useMemo(() => {
    if (!detailBudget) return [];
    const map = {};
    for (const e of detailExpenses) {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + e.amount;
    }
    const now = /* @__PURE__ */ new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const max = map[key] || 0;
      return {
        key,
        label: `${t(monthKeys[d.getMonth()])}`,
        total: max,
        max,
        height: Math.max(8, Math.min(100, max / Math.max(...Object.values(map), 1) * 100))
      };
    });
  }, [detailBudget, detailExpenses, t, monthKeys]);
  const healthScore = report ? Math.max(0, Math.min(100, Math.round(100 - (report.usagePercent || 0)))) : 100;
  const dashboardCards = reactExports.useMemo(() => [
    {
      title: t("budgets.total_budget"),
      value: `${t("common.etb")} ${(report?.totalPlanned || 0).toLocaleString()}`,
      trend: "0%",
      trendType: "up",
      footerTitle: t("budgets.planned_budget"),
      footerSub: t("budgets.for_period", { period: periodLabel })
    },
    {
      title: t("budgets.total_spent"),
      value: `${t("common.etb")} ${(report?.totalSpent || 0).toLocaleString()}`,
      trend: `${report?.usagePercent || 0}%`,
      trendType: (report?.usagePercent || 0) > 50 ? "up" : "down",
      footerTitle: t("budgets.budget_used"),
      footerSub: t("budgets.percent_of_total", { percent: report?.usagePercent || 0 })
    },
    {
      title: t("budgets.remaining"),
      value: `${t("common.etb")} ${(report?.remaining || 0).toLocaleString()}`,
      trend: report?.remaining > 0 ? "+" + (report.remaining / (report.totalPlanned || 1) * 100).toFixed(1) + "%" : "0%",
      trendType: report?.remaining > 0 ? "up" : "down",
      footerTitle: report?.remaining > 0 ? t("budgets.under_budget") : t("budgets.over_budget"),
      footerSub: `${Math.abs(report?.remaining || 0) > 0 ? t("budgets.remaining_funds") : t("budgets.no_funds")}`
    },
    {
      title: t("budgets.budget_health"),
      value: `${healthScore}%`,
      trend: healthScore >= 50 ? t("budgets.healthy") : t("budgets.critical"),
      trendType: healthScore >= 50 ? "up" : "down",
      footerTitle: healthScore >= 50 ? t("budgets.good_shape") : t("budgets.needs_attention"),
      footerSub: healthScore >= 50 ? t("budgets.within_targets") : t("budgets.review_spending")
    }
  ], [report, healthScore, t, periodLabel]);
  if (loading && budgets.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-full py-32", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-black tracking-tight", children: t("budgets.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-medium", children: t("budgets.subtitle") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: displayMonth, onValueChange: handleMonthChange, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-36 h-9 text-xs font-bold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: monthOptions.map(({ value, label }) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value, children: label }, value)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: displayYear, onValueChange: handleYearChange, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-28 h-9 text-xs font-bold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: Array.from({ length: isEthiopian ? 5 : 5 }, (_, i) => {
              const base = isEthiopian ? parseInt(ethYear) - 2 : (/* @__PURE__ */ new Date()).getFullYear() - 2;
              const y = String(base + i);
              return /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: y, children: isEthiopian ? t("budgets.ethiopian_year", { year: y }) : y }, y);
            }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: period, onValueChange: setPeriod, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-28 h-9 text-xs font-bold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PERIODS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, children: t(p.label) }, p.id)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: loadData, className: "h-9", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCcw, { className: "h-3.5 w-3.5 mr-1.5" }),
          " ",
          t("budgets.refresh")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "rounded-2xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "dashboard", className: "text-xs font-bold uppercase tracking-widest rounded-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChartPie, { className: "h-3.5 w-3.5 mr-1.5" }),
          " ",
          t("budgets.tab_dashboard")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "budgets", className: "text-xs font-bold uppercase tracking-widest rounded-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-3.5 w-3.5 mr-1.5" }),
          " ",
          t("budgets.tab_budgets")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "reports", className: "text-xs font-bold uppercase tracking-widest rounded-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "h-3.5 w-3.5 mr-1.5" }),
          " ",
          t("budgets.tab_reports")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "adjustments", className: "text-xs font-bold uppercase tracking-widest rounded-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-3.5 w-3.5 mr-1.5" }),
          " ",
          t("budgets.tab_adjustments")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "forecast", className: "text-xs font-bold uppercase tracking-widest rounded-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3.5 w-3.5 mr-1.5" }),
          " ",
          t("budgets.tab_forecast")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "dashboard", className: "space-y-6 mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCards, { cards: dashboardCards }),
        alerts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-yellow-200 bg-yellow-50/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm font-black uppercase tracking-widest flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-yellow-600" }),
            " ",
            t("budgets.active_alerts", { count: alerts.length })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-2", children: alerts.slice(0, 5).map((alert) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-xl bg-white/60 border border-yellow-200", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold", children: [
                alert.category,
                " - ",
                alert.alertType
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: alert.message })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", className: "h-7 text-xs font-bold", onClick: async () => {
              await window.api?.acknowledgeBudgetAlert(alert.id);
              loadData();
            }, children: t("budgets.dismiss") })
          ] }, alert.id)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: t("budgets.category_breakdown") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            report?.categories?.sort((a, b) => b.actual - a.actual).slice(0, 8).map((cat) => {
              const st = statusConfig[cat.status] || statusConfig.healthy;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold", children: cat.category }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold text-muted-foreground", children: [
                      t("common.etb"),
                      cat.actual.toLocaleString(),
                      " / ",
                      t("common.etb"),
                      cat.planned.toLocaleString()
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `${st.bg} ${st.color} text-xs font-black border-0`, children: t(st.labelKey) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: `h-full rounded-full transition-all ${cat.status === "exceeded" ? "bg-red-500" : cat.status === "warning" ? "bg-yellow-500" : "bg-green-500"}`,
                    style: { width: `${Math.min(cat.usagePercent, 100)}%` }
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-medium", children: t("budgets.percent_used", { percent: cat.usagePercent }) })
              ] }, cat.category);
            }),
            (!report?.categories || report.categories.length === 0) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground text-center py-8", children: t("budgets.no_budgets_period") })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "budgets", className: "space-y-6 mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: budgetType, onValueChange: setBudgetType, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-44 h-9 text-xs font-bold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: BUDGET_TYPES.map((bt) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: bt.id, children: t(bt.label) }, bt.id)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => setShowDuplicateModal(true), className: "h-9 text-xs font-bold", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3.5 w-3.5 mr-1.5" }),
              " ",
              t("budgets.duplicate_from_previous")
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => {
            setEditingBudget(null);
            resetForm();
            setShowBudgetModal(true);
          }, className: "h-9 text-xs font-bold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3.5 w-3.5 mr-1.5" }),
            " ",
            t("budgets.set_budget")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3", children: budgets.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-16 text-sm text-muted-foreground font-medium", children: t("budgets.empty_state") }) : budgets.map((budget) => {
          const st = budget.usagePercent > 100 ? statusConfig.critical : budget.usagePercent >= 80 ? statusConfig.warning : statusConfig.healthy;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "hover:shadow-md transition-shadow", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-sm", children: budget.category }),
                budget.isRecurring ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black h-4 border-blue-200 text-blue-600 bg-blue-50", children: t("budgets.recurring") }) : null,
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `${st.bg} ${st.color} text-xs font-black border-0`, children: t(st.labelKey) })
              ] }),
              budget.referenceName && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: budget.referenceName })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-medium", children: t("budgets.budget") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-black", children: [
                  t("common.etb"),
                  budget.amount.toLocaleString()
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-medium", children: t("budgets.spent") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-black", children: [
                  t("common.etb"),
                  (budget.spent || 0).toLocaleString()
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-medium", children: t("budgets.remaining") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `font-black ${budget.remaining < 0 ? "text-red-600" : ""}`, children: [
                  t("common.etb"),
                  (budget.remaining || 0).toLocaleString()
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-24", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: `h-full rounded-full transition-all ${budget.usagePercent >= 100 ? "bg-red-500" : budget.usagePercent >= 80 ? "bg-yellow-500" : "bg-green-500"}`,
                    style: { width: `${Math.min(budget.usagePercent, 100)}%` }
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-medium", children: t("budgets.percent_used", { percent: budget.usagePercent }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", className: "h-8 w-8 p-0", onClick: () => openBudgetDetails(budget), title: t("budgets.view_details"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3.5 w-3.5" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", className: "h-8 w-8 p-0", onClick: () => openEditBudget(budget), children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-3.5 w-3.5" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", className: "h-8 w-8 p-0 text-red-500", onClick: () => handleDeleteBudget(budget.id), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", className: "h-8 w-8 p-0", onClick: () => setShowAdjustModal(budget), title: t("budgets.adjust_btn_title"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3.5 w-3.5" }) })
              ] })
            ] })
          ] }) }) }, budget.id);
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "reports", className: "space-y-6 mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-black uppercase tracking-widest", children: t("budgets.planned_vs_actual", { period: periodLabel }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleExport("csv"), className: "h-9 text-xs font-bold", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3.5 w-3.5 mr-1.5" }),
              " ",
              t("budgets.export_csv")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleExport("pdf"), className: "h-9 text-xs font-bold", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-3.5 w-3.5 mr-1.5" }),
              " ",
              t("budgets.export_pdf")
            ] })
          ] })
        ] }),
        report?.categories && report.categories.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 text-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("budgets.total_planned") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xl font-black mt-1", children: [
                t("common.etb"),
                report.totalPlanned.toLocaleString()
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 text-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("budgets.total_spent") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xl font-black mt-1", children: [
                t("common.etb"),
                report.totalSpent.toLocaleString()
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 text-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("budgets.remaining") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-xl font-black mt-1 ${report.remaining < 0 ? "text-red-600" : "text-green-600"}`, children: [
                t("common.etb"),
                report.remaining.toLocaleString()
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 text-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("budgets.usage") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xl font-black mt-1", children: [
                report.usagePercent,
                "%"
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: t("budgets.category_breakdown") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left py-3 px-2 font-black uppercase tracking-widest text-xs text-muted-foreground", children: t("budgets.col_category") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right py-3 px-2 font-black uppercase tracking-widest text-xs text-muted-foreground", children: t("budgets.col_planned") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right py-3 px-2 font-black uppercase tracking-widest text-xs text-muted-foreground", children: t("budgets.col_actual") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right py-3 px-2 font-black uppercase tracking-widest text-xs text-muted-foreground", children: t("budgets.col_remaining") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right py-3 px-2 font-black uppercase tracking-widest text-xs text-muted-foreground", children: t("budgets.col_used_percent") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right py-3 px-2 font-black uppercase tracking-widest text-xs text-muted-foreground", children: t("budgets.col_status") })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: report.categories.map((cat) => {
                const st = statusConfig[cat.status] || statusConfig.healthy;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border/50 hover:bg-muted/20", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-2 font-bold", children: cat.category }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "py-3 px-2 text-right", children: [
                    t("common.etb"),
                    cat.planned.toLocaleString()
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "py-3 px-2 text-right", children: [
                    t("common.etb"),
                    cat.actual.toLocaleString()
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: `py-3 px-2 text-right font-bold ${cat.remaining < 0 ? "text-red-600" : ""}`, children: [
                    t("common.etb"),
                    cat.remaining.toLocaleString()
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-2 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-1.5 rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-full rounded-full ${cat.status === "exceeded" ? "bg-red-500" : cat.status === "warning" ? "bg-yellow-500" : "bg-green-500"}`, style: { width: `${Math.min(cat.usagePercent, 100)}%` } }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      cat.usagePercent,
                      "%"
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-2 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `${st.bg} ${st.color} text-xs font-black border-0`, children: t(st.labelKey) }) })
                ] }, cat.category);
              }) })
            ] }) }) })
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-16 text-sm text-muted-foreground font-medium", children: t("budgets.no_data_period") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "adjustments", className: "space-y-6 mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: t("budgets.adjustment_history") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: t("budgets.adjustment_history_desc") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: adjustments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center py-8 text-sm text-muted-foreground font-medium", children: t("budgets.no_adjustments") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: adjustments.map((adj) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 rounded-xl border border-border bg-card/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold", children: adj.reason }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
              t("common.etb"),
              adj.previousAmount.toLocaleString(),
              " → ",
              t("common.etb"),
              adj.newAmount.toLocaleString(),
              adj.approvedBy ? ` • ${t("budgets.approved_by", { name: adj.approvedBy })}` : ""
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `text-xs font-black border-0 ${adj.status === "approved" ? "bg-green-100 text-green-700" : adj.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`, children: adj.status === "approved" ? t("budgets.status_approved") : adj.status === "pending" ? t("budgets.status_pending") : t("budgets.status_rejected") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: formatDate(adj.createdAt) })
          ] })
        ] }, adj.id)) }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "forecast", className: "space-y-6 mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: t("budgets.forecast_title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: t("budgets.forecast_desc") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: forecast.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center py-8 text-sm text-muted-foreground font-medium", children: t("budgets.forecast_no_data") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-4", children: forecast.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-l-4 border-l-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: f.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-medium", children: t("budgets.budgeted_label") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold", children: [
                t("common.etb"),
                f.planned.toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-medium", children: t("budgets.estimated_label") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold", children: [
                t("common.etb"),
                f.estimated.toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-medium", children: t("budgets.variance_label") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `font-bold ${f.planned - f.estimated < 0 ? "text-red-600" : "text-green-600"}`, children: [
                t("common.etb"),
                (f.planned - f.estimated).toLocaleString()
              ] })
            ] })
          ] })
        ] }) }, `${f.month}-${f.year}`)) }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: showBudgetModal,
        onClose: () => {
          setShowBudgetModal(false);
          setEditingBudget(null);
        },
        title: editingBudget ? t("budgets.edit_budget") : t("budgets.set_budget"),
        size: "md",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("budgets.budget_type") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.budgetType,
                onValueChange: (v) => setFormData({ ...formData, budgetType: v }),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full h-10 text-xs font-bold rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: BUDGET_TYPES.map((bt) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: bt.id, children: t(bt.label) }, bt.id)) })
                ]
              }
            )
          ] }),
          formData.budgetType !== "business" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: formData.budgetType === "department" ? t("budgets.department_name") : formData.budgetType === "project" ? t("budgets.project_name") : t("budgets.branch_name") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: formData.referenceName,
                onChange: (e) => setFormData({ ...formData, referenceName: e.target.value }),
                placeholder: t("budgets.enter_name_placeholder", { type: formData.budgetType }),
                className: "h-10 text-xs font-medium rounded-xl"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("budgets.category") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: formData.category,
                onValueChange: (v) => setFormData({ ...formData, category: v }),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full h-10 text-xs font-bold rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: BUDGET_CATEGORY_VALUES.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c, children: t(BUDGET_CATEGORY_KEYS[i]) }, c)) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("budgets.planned_amount") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "number",
                value: formData.amount,
                onChange: (e) => setFormData({ ...formData, amount: e.target.value }),
                placeholder: t("budgets.amount_placeholder"),
                className: "h-10 text-sm font-bold rounded-xl"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("budgets.period") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: formData.period,
                  onValueChange: (v) => setFormData({ ...formData, period: v }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full h-10 text-xs font-bold rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PERIODS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, children: t(p.label) }, p.id)) })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("budgets.period_month") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: isEthiopian ? gregToEth(formData.month, formData.year).month : formData.month,
                  onValueChange: (v) => {
                    if (isEthiopian) {
                      const g = ethToGreg(v, gregToEth(formData.month, formData.year).year);
                      setFormData({ ...formData, month: g.month, year: g.year });
                    } else {
                      setFormData({ ...formData, month: v });
                    }
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full h-10 text-xs font-bold rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: (isEthiopian ? monthOptions : Array.from({ length: 12 }, (_, i) => {
                      const m = String(i + 1).padStart(2, "0");
                      const mk = ["budgets.month_jan", "budgets.month_feb", "budgets.month_mar", "budgets.month_apr", "budgets.month_may", "budgets.month_jun", "budgets.month_jul", "budgets.month_aug", "budgets.month_sep", "budgets.month_oct", "budgets.month_nov", "budgets.month_dec"];
                      return { value: m, label: t(mk[i]) };
                    })).map(({ value, label }) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value, children: label }, value)) })
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                id: "isRecurring",
                checked: formData.isRecurring,
                onChange: (e) => setFormData({ ...formData, isRecurring: e.target.checked }),
                className: "rounded border-border"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "isRecurring", className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("budgets.recurring_label") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("budgets.notes_label") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                value: formData.notes,
                onChange: (e) => setFormData({ ...formData, notes: e.target.value }),
                placeholder: t("budgets.notes_placeholder"),
                className: "w-full h-20 px-3 py-2 text-xs font-medium rounded-xl border border-border bg-background resize-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 pt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSetBudget, className: "flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] rounded-xl", children: editingBudget ? t("budgets.update_budget") : t("budgets.set_budget") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => {
              setShowBudgetModal(false);
              setEditingBudget(null);
            }, className: "py-6 text-xs font-black uppercase tracking-[0.2em] rounded-xl", children: t("common.cancel") })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: !!showAdjustModal,
        onClose: () => setShowAdjustModal(null),
        title: t("budgets.adjust_budget_title", { category: showAdjustModal?.category || "" }),
        size: "sm",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-muted/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-medium", children: t("budgets.current_budget") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-black text-lg", children: [
              t("common.etb"),
              (showAdjustModal?.amount || 0).toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("budgets.new_amount") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "adjAmount",
                type: "number",
                defaultValue: showAdjustModal?.amount || 0,
                className: "h-10 text-sm font-bold rounded-xl"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("budgets.adjustment_reason") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                id: "adjReason",
                placeholder: t("budgets.adjustment_reason_placeholder"),
                className: "w-full h-24 px-3 py-2 text-xs font-medium rounded-xl border border-border bg-background resize-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 pt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleCreateAdjustment, className: "flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] rounded-xl", children: t("budgets.apply_adjustment") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setShowAdjustModal(null), className: "py-6 text-xs font-black uppercase tracking-[0.2em] rounded-xl", children: t("common.cancel") })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: showDuplicateModal,
        onClose: () => setShowDuplicateModal(false),
        title: t("budgets.duplicate_title"),
        size: "sm",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("budgets.duplicate_desc", { period: periodLabel }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("budgets.target_month") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "select",
                {
                  id: "dupMonth",
                  defaultValue: selectedMonth,
                  className: "w-full h-10 px-3 text-xs font-bold rounded-xl border border-border bg-background",
                  children: Array.from({ length: 12 }, (_, i) => {
                    const m = String(i + 1).padStart(2, "0");
                    const mk = ["budgets.month_jan", "budgets.month_feb", "budgets.month_mar", "budgets.month_apr", "budgets.month_may", "budgets.month_jun", "budgets.month_jul", "budgets.month_aug", "budgets.month_sep", "budgets.month_oct", "budgets.month_nov", "budgets.month_dec"];
                    return /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: m, children: t(mk[i]) }, m);
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("budgets.target_year") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "select",
                {
                  id: "dupYear",
                  defaultValue: selectedYear,
                  className: "w-full h-10 px-3 text-xs font-bold rounded-xl border border-border bg-background",
                  children: Array.from({ length: 5 }, (_, i) => {
                    const y = String((/* @__PURE__ */ new Date()).getFullYear() - 1 + i);
                    return /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: y, children: y }, y);
                  })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 pt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleDuplicate, className: "flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] rounded-xl", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3.5 w-3.5 mr-1.5" }),
              " ",
              t("budgets.duplicate_btn")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setShowDuplicateModal(false), className: "py-6 text-xs font-black uppercase tracking-[0.2em] rounded-xl", children: t("common.cancel") })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: !!detailBudget,
        onClose: () => setDetailBudget(null),
        title: t("budgets.details_title"),
        size: "lg",
        children: detailBudget && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6 py-4", children: (() => {
          const st = detailBudget.usagePercent > 100 ? statusConfig.critical : detailBudget.usagePercent >= 80 ? statusConfig.warning : statusConfig.healthy;
          const spent = detailBudget.spent || 0;
          const remaining = detailBudget.remaining ?? detailBudget.amount - spent;
          const avgMonthly = detailTrend.length > 0 ? detailTrend.reduce((s, m) => s + m.total, 0) / detailTrend.length : 0;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-2xl border border-border/50 bg-card space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-5 w-5 text-primary" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-black tracking-tight", children: detailBudget.category }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground font-medium uppercase tracking-widest", children: [
                      detailBudget.referenceName ? `${detailBudget.referenceName} • ` : "",
                      t(BUDGET_TYPES.find((bt) => bt.id === detailBudget.budgetType)?.label || "budgets.type_business")
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `${st.bg} ${st.color} text-xs font-black border-0`, children: t(st.labelKey) }),
                  detailBudget.isRecurring ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black h-4 border-blue-200 text-blue-600 bg-blue-50", children: t("budgets.recurring") }) : null
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("budgets.budget") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-black", children: [
                    t("common.etb"),
                    detailBudget.amount.toLocaleString()
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("budgets.spent") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-lg font-black ${spent > detailBudget.amount ? "text-red-600" : ""}`, children: [
                    t("common.etb"),
                    spent.toLocaleString()
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("budgets.remaining") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-lg font-black ${remaining < 0 ? "text-red-600" : "text-green-600"}`, children: [
                    t("common.etb"),
                    Math.max(0, remaining).toLocaleString()
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("budgets.usage") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-lg font-black ${detailBudget.usagePercent >= 100 ? "text-red-600" : ""}`, children: [
                    detailBudget.usagePercent,
                    "%"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-full bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: `h-full rounded-full transition-all ${detailBudget.usagePercent >= 100 ? "bg-red-500" : detailBudget.usagePercent >= 80 ? "bg-yellow-500" : "bg-green-500"}`,
                  style: { width: `${Math.min(detailBudget.usagePercent, 100)}%` }
                }
              ) }),
              detailBudget.notes && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-medium italic", children: detailBudget.notes })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-2xl border border-border/50 bg-card space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4 text-primary" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-widest", children: t("budgets.monthly_trend") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end gap-3 h-32 pt-4", children: detailTrend.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col items-center gap-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-black text-muted-foreground", children: [
                  t("common.etb"),
                  m.total > 999 ? `${(m.total / 1e3).toFixed(1)}k` : Math.round(m.total)
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: "w-full rounded-t-md bg-gradient-to-t from-primary/30 to-primary",
                    style: { height: `${m.height}%` },
                    title: `${m.label}: ${t("common.etb")} ${m.total.toLocaleString()}`
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase text-muted-foreground", children: m.label })
              ] }, m.key)) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs font-bold text-muted-foreground pt-1 border-t border-border/50", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("budgets.avg_monthly") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  t("common.etb"),
                  Math.round(avgMonthly).toLocaleString()
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-2xl border border-border/50 bg-card space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-widest", children: t("budgets.recent_expenses") }),
              detailLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" }) }) : detailExpenses.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-medium text-center py-6", children: t("budgets.no_expenses") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 max-h-56 overflow-y-auto", children: detailExpenses.slice(0, 8).map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-xl bg-muted/30", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold", children: e.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground font-medium", children: formatDate(e.date) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-black", children: [
                  t("common.etb"),
                  Number(e.amount).toLocaleString()
                ] })
              ] }, e.id)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-2xl border border-border/50 bg-card space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-widest", children: t("budgets.adjustment_history") }),
              detailAdjustments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-medium text-center py-4", children: t("budgets.no_adjustments") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: detailAdjustments.map((adj) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-xl bg-muted/30", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold", children: adj.reason }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground font-medium", children: formatDate(adj.createdAt) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-black", children: [
                  t("common.etb"),
                  adj.previousAmount.toLocaleString(),
                  " → ",
                  t("common.etb"),
                  adj.newAmount.toLocaleString()
                ] })
              ] }, adj.id)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-2xl border border-border/50 bg-card space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-xs font-black uppercase tracking-widest flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-yellow-600" }),
                " ",
                t("budgets.related_alerts")
              ] }),
              detailAlerts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-medium text-center py-4", children: t("budgets.no_alerts") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: detailAlerts.slice(0, 5).map((alert) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-yellow-50 border border-yellow-200", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold", children: alert.message }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground font-medium", children: formatDate(alert.createdAt) })
              ] }, alert.id)) })
            ] })
          ] });
        })() })
      }
    )
  ] });
};
export {
  BudgetManagement as default
};
