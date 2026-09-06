import { c as createLucideIcon, b as useSettings, a9 as useIsMobile, r as reactExports, t as toEthiopianDate, h as getEthiopianMonthName, j as jsxRuntimeExports, i as Badge, e as Button, s as Trash2, aa as ChartPie, ab as TrendingDown, H as FileText, M as Modal, J as Input, Q as toast } from "./index-BcwudWUj.js";
import { A as AlertDialog, h as AlertDialogTrigger, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-C1TWaOqF.js";
import { S as SectionCards } from "./section-cards-Bcpy-CNd.js";
import { D as DataTable } from "./data-table-BzhAI6-U.js";
import { e as exportCSV, a as exportPDF } from "./export-utils-BJtlVyly.js";
import { c as computeTrend } from "./trend-utils-D_UP5BUt.js";
import { C as Card, a as CardHeader, b as CardTitle, d as CardDescription, e as CardAction, c as CardContent } from "./card-9E0A8T1M.js";
import { T as ToggleGroup, b as ToggleGroupItem, C as ChartContainer, c as ChartTooltip, a as ChartTooltipContent } from "./toggle-group-CtcG2zZK.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BztXyn8Q.js";
import { A as AreaChart, a as Area, B as Briefcase } from "./AreaChart-DW_CgFBI.js";
import { al as CartesianGrid, am as XAxis } from "./CartesianChart-CDIsnLQX.js";
import { D as DatePicker } from "./DatePicker-CMW7pRtV.js";
import { S as Switch } from "./switch-3s3jb4Xj.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CC5EZ-HS.js";
import { S as SquarePen } from "./square-pen-B1VoyGj1.js";
import { W as Wallet } from "./wallet-DmTaMWjz.js";
import { R as Repeat } from "./repeat-DyQdORU5.js";
import { P as Plus } from "./plus-D_60Nm0z.js";
import "./trending-up-dKgiNxJ3.js";
import "./label-CKZ6ezue.js";
import "./table-D9Fbg3F6.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const List = createLucideIcon("List", [
  ["path", { d: "M3 12h.01", key: "nlz23k" }],
  ["path", { d: "M3 18h.01", key: "1tta3j" }],
  ["path", { d: "M3 6h.01", key: "1rqtza" }],
  ["path", { d: "M8 12h13", key: "1za7za" }],
  ["path", { d: "M8 18h13", key: "1lx6n3" }],
  ["path", { d: "M8 6h13", key: "ik3vkj" }]
]);
function getGregorianMonthName(m, lang) {
  const names = {
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    am: ["ጃን", "ፌብ", "ማር", "ኤፕ", "ሜይ", "ጁን", "ጁል", "ኦገ", "ሴፕ", "ኦክቶ", "ኖቬ", "ዲሴ"],
    om: ["Amajj", "Gurra", "Bito", "Eebil", "Caams", "Waxa", "Adoo", "Hagay", "Fulb", "Onko", "Sada", "Mudd"],
    ti: ["ጥሪ", "ለካ", "መጋ", "ሚያ", "ግን", "ሰነ", "ሓም", "ነሓ", "መስ", "ጥቅ", "ሕዳ", "ታሕ"]
  };
  return (names[lang] || names.en)[m] || names.en[m];
}
function getGregorianDayName(d, lang) {
  const names = {
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    am: ["እሁድ", "ሰኞ", "ማክሰ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ"],
    om: ["Dil", "Wix", "Saa", "Roo", "Kam", "Jim", "San"],
    ti: ["ሰን", "ሰኑ", "ሰሉ", "ረቡ", "ሓሙ", "ዓር", "ቀዳ"]
  };
  return (names[lang] || names.en)[d] || names.en[d];
}
function ChartAreaInteractive({
  data,
  config,
  title,
  description: description2,
  dataKey = "revenue",
  xAxisKey = "date"
}) {
  const { formatDate, calendarType, language } = useSettings();
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = reactExports.useState("90d");
  reactExports.useEffect(() => {
    if (isMobile && !timeRange.startsWith("this-")) {
      setTimeRange("7d");
    }
  }, [isMobile]);
  const isEthiopian = calendarType === "ethiopian";
  const displayData = reactExports.useMemo(() => {
    const raw = data.filter((item) => {
      const date = new Date(item[xAxisKey]);
      if (isNaN(date.getTime())) return true;
      const ref = /* @__PURE__ */ new Date();
      let start;
      if (timeRange === "this-week") {
        start = new Date(ref);
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
      } else if (timeRange === "this-month") {
        start = new Date(ref.getFullYear(), ref.getMonth(), 1);
      } else if (timeRange === "this-year") {
        start = new Date(ref.getFullYear(), 0, 1);
      } else {
        start = new Date(ref);
        let d = 90;
        if (timeRange === "30d") d = 30;
        else if (timeRange === "7d") d = 7;
        start.setDate(start.getDate() - d);
      }
      return date >= start;
    });
    if (timeRange === "this-week") {
      const now = /* @__PURE__ */ new Date();
      const todayDow = now.getDay();
      const groups = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      raw.forEach((item) => {
        const d = new Date(item[xAxisKey]);
        if (isNaN(d.getTime())) return;
        const dow = d.getDay();
        groups[dow] = (groups[dow] || 0) + (item[dataKey] || 0);
      });
      return [0, 1, 2, 3, 4, 5, 6].map((dow) => ({
        label: getGregorianDayName(dow, language),
        [dataKey]: groups[dow] || 0,
        isCurrent: dow === todayDow
      }));
    }
    if (timeRange === "this-month") {
      const now = /* @__PURE__ */ new Date();
      const ref = isEthiopian ? toEthiopianDate(now) : null;
      const currentDay = isEthiopian ? ref.day : now.getDate();
      const currentWeekNum = Math.ceil(currentDay / 7);
      const groups = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      raw.forEach((item) => {
        const d = new Date(item[xAxisKey]);
        if (isNaN(d.getTime())) return;
        const day = isEthiopian ? toEthiopianDate(d).day : d.getDate();
        const wn = Math.min(Math.ceil(day / 7), 5);
        groups[wn] = (groups[wn] || 0) + (item[dataKey] || 0);
      });
      const wkLabel = language === "am" ? "ሳም" : language === "om" ? "Tor" : language === "ti" ? "ሳም" : "Wk";
      return [1, 2, 3, 4, 5].map((wn) => ({
        label: `${wkLabel} ${wn}`,
        [dataKey]: groups[wn] || 0,
        isCurrent: wn === currentWeekNum
      }));
    }
    if (timeRange === "this-year") {
      const now = /* @__PURE__ */ new Date();
      let currentMonth;
      let monthCount;
      if (isEthiopian) {
        const et = toEthiopianDate(now);
        currentMonth = et.month - 1;
        monthCount = 13;
      } else {
        currentMonth = now.getMonth();
        monthCount = 12;
      }
      const groups = {};
      for (let i = 0; i < monthCount; i++) groups[i] = 0;
      raw.forEach((item) => {
        const d = new Date(item[xAxisKey]);
        if (isNaN(d.getTime())) return;
        let mi;
        if (isEthiopian) {
          mi = toEthiopianDate(d).month - 1;
        } else {
          mi = d.getMonth();
        }
        groups[mi] = (groups[mi] || 0) + (item[dataKey] || 0);
      });
      const result = [];
      for (let i = 0; i < monthCount; i++) {
        let label;
        if (isEthiopian) {
          label = getEthiopianMonthName(i, language).slice(0, 4);
        } else {
          label = getGregorianMonthName(i, language);
        }
        result.push({
          label,
          [dataKey]: groups[i] || 0,
          isCurrent: i === currentMonth
        });
      }
      return result;
    }
    return raw.map((item, _i) => {
      const d = new Date(item[xAxisKey]);
      const now = /* @__PURE__ */ new Date();
      const isToday = !isNaN(d.getTime()) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
      return { ...item, isCurrent: isToday };
    });
  }, [data, timeRange, xAxisKey, dataKey, isEthiopian, language]);
  const isGrouped = timeRange.startsWith("this-");
  const xKey = isGrouped ? "label" : xAxisKey;
  const showHighlight = isGrouped;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "@container/card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden @[540px]/card:block", children: description2 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "@[540px]/card:hidden", children: description2 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardAction, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          ToggleGroup,
          {
            type: "single",
            value: timeRange,
            onValueChange: setTimeRange,
            variant: "outline",
            className: "hidden *:data-[slot=toggle-group-item]:px-3! @[767px]/card:flex",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleGroupItem, { value: "this-week", children: "This Week" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleGroupItem, { value: "this-month", children: "This Month" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleGroupItem, { value: "this-year", children: "This Year" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: timeRange, onValueChange: setTimeRange, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SelectTrigger,
            {
              className: "flex w-44 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden",
              size: "sm",
              "aria-label": "Select a value",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Last 3 months" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-xl", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "this-week", className: "rounded-lg font-bold text-primary", children: "This Week" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "this-month", className: "rounded-lg font-bold text-primary", children: "This Month" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "this-year", className: "rounded-lg font-bold text-primary", children: "This Year" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t my-1 mx-2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "90d", className: "rounded-lg", children: "Last 3 months" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "30d", className: "rounded-lg", children: "Last 30 days" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "7d", className: "rounded-lg", children: "Last 7 days" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "px-2 pt-4 sm:px-6 sm:pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      ChartContainer,
      {
        config,
        className: "aspect-auto h-[250px] w-full",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AreaChart, { data: displayData, margin: { left: 10, right: 10, bottom: 0 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("defs", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "fillPrimary", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "5%", stopColor: "var(--primary)", stopOpacity: 0.4 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "95%", stopColor: "var(--primary)", stopOpacity: 0.08 })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "fillCurrent", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "5%", stopColor: "var(--chart-2, #f59e0b)", stopOpacity: 0.5 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "95%", stopColor: "var(--chart-2, #f59e0b)", stopOpacity: 0.1 })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { vertical: false, stroke: "var(--border)", strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            XAxis,
            {
              dataKey: xKey,
              tickLine: false,
              axisLine: false,
              tickMargin: 8,
              interval: 0,
              minTickGap: 0,
              tick: { fontSize: 11, fontWeight: 600, fill: "var(--muted-foreground)" },
              tickFormatter: (value) => {
                if (xKey === "label") return value;
                const d = new Date(value);
                if (isNaN(d.getTime())) return value;
                return formatDate(d, { month: "short", day: "numeric" });
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsxRuntimeExports.jsx(
                ChartTooltipContent,
                {
                  labelFormatter: (value) => {
                    if (xKey === "label") return value;
                    const d = new Date(value);
                    if (isNaN(d.getTime())) return value;
                    return formatDate(d, { month: "short", day: "numeric" });
                  },
                  indicator: "dot"
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Area,
            {
              dataKey,
              type: "natural",
              fill: "url(#fillPrimary)",
              stroke: "var(--primary)",
              strokeWidth: 2,
              dot: showHighlight ? (props) => {
                const { cx, cy, payload } = props;
                if (payload.isCurrent) {
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx, cy, r: 8, fill: "var(--chart-2, #f59e0b)", stroke: "white", strokeWidth: 3, opacity: 0.25 }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx, cy, r: 5, fill: "var(--chart-2, #f59e0b)", stroke: "white", strokeWidth: 2 })
                  ] });
                }
                return /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx, cy, r: 3, fill: "var(--primary)", opacity: 0.5 });
              } : false,
              activeDot: { r: 5, stroke: "white", strokeWidth: 2, fill: "var(--primary)" }
            }
          )
        ] })
      }
    ) })
  ] });
}
const Expenses = () => {
  const { t, formatDate } = useSettings();
  const [expenses, setExpenses] = reactExports.useState([]);
  const [analytics, setAnalytics] = reactExports.useState(null);
  const [showModal, setShowModal] = reactExports.useState(false);
  const [editingExpense, setEditingExpense] = reactExports.useState(null);
  const [searchQuery] = reactExports.useState("");
  const [formData, setFormData] = reactExports.useState({
    name: "",
    amount: "",
    category: "Other",
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    isRecurring: false,
    frequency: "monthly",
    startDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    nextBillingDate: "",
    budgetId: ""
  });
  const [activeTab, setActiveTab] = reactExports.useState("expenses");
  const [budgets, setBudgets] = reactExports.useState([]);
  const [activeBudgetId, setActiveBudgetId] = reactExports.useState(null);
  const [budgetModal, setBudgetModal] = reactExports.useState(false);
  const [budgetPrompt, setBudgetPrompt] = reactExports.useState(false);
  const [monthExpenses, setMonthExpenses] = reactExports.useState([]);
  const [budgetFormData, setBudgetFormData] = reactExports.useState({
    category: "Other",
    amount: "",
    period: "monthly",
    customCategory: ""
  });
  reactExports.useEffect(() => {
    loadData();
  }, [searchQuery]);
  reactExports.useEffect(() => {
    loadBudgets();
  }, []);
  reactExports.useEffect(() => {
    if (activeTab === "budget") loadBudgets();
  }, [activeTab]);
  const loadData = async () => {
    const [expData, anData] = await Promise.all([
      window.api?.getExpenses({ search: searchQuery }) || Promise.resolve([]),
      window.api?.getAnalytics("month") || Promise.resolve(null)
    ]);
    setExpenses(expData);
    setAnalytics(anData);
  };
  const loadBudgets = async () => {
    const [budgetData, monthData] = await Promise.all([
      window.api?.getBudgets({ period: "monthly" }) || Promise.resolve([]),
      window.api?.getExpenses({}) || Promise.resolve([])
    ]);
    setBudgets(budgetData);
    setMonthExpenses(monthData);
    setActiveBudgetId(
      (prev) => prev && budgetData.some((b) => b.id === prev) ? prev : budgetData[0]?.id ?? null
    );
  };
  const getBudgetById = (id) => budgets.find((b) => String(b.id) === String(id));
  const getBudgetForCategory = (category) => budgets.find((b) => b.category === category);
  const getSpentForCategory = (category) => {
    const now = /* @__PURE__ */ new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    return monthExpenses.filter((e) => {
      const d = new Date(e.date);
      return e.category === category && d.getMonth() === curMonth && d.getFullYear() === curYear;
    }).reduce((sum, e) => sum + e.amount, 0);
  };
  const resetBudgetForm = () => {
    setBudgetFormData({ category: "Other", amount: "", period: "monthly", customCategory: "" });
  };
  const handleSetBudget = async (e) => {
    e.preventDefault();
    if (!budgetFormData.amount || parseFloat(budgetFormData.amount) <= 0) {
      toast.error(t("budgets.budget_amount_error") || "Please enter a valid budget amount");
      return;
    }
    const isCustomCategory = budgetFormData.category === "__custom__";
    const category = isCustomCategory ? budgetFormData.customCategory.trim() : budgetFormData.category;
    if (isCustomCategory && !category) {
      toast.error(t("expense.custom_category_required") || "Please enter a category name");
      return;
    }
    try {
      const result = await window.api?.setBudget({
        category,
        amount: parseFloat(budgetFormData.amount),
        period: budgetFormData.period
      });
      if (result?.success) toast.success(t("budgets.budget_set") || "Budget saved");
      setBudgetModal(false);
      resetBudgetForm();
      loadBudgets();
    } catch {
      toast.error(t("budgets.budget_save_error") || "Failed to save budget");
    }
  };
  const handleDeleteBudget = async (id) => {
    try {
      await window.api?.deleteBudget(id);
      toast.success(t("budgets.budget_deleted") || "Budget deleted");
      loadBudgets();
    } catch {
      toast.error(t("budgets.budget_delete_error") || "Failed to delete budget");
    }
  };
  const kpiCards = reactExports.useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const recurring = expenses.filter((e) => e.isRecurring).reduce((s, e) => s + e.amount, 0);
    const average = total / (expenses.length || 1);
    const outflowTrend = computeTrend(expenses, "date", (e) => e.amount);
    const recurringTrend = computeTrend(expenses.filter((e) => e.isRecurring), "date", (e) => e.amount);
    const avgTrend = computeTrend(expenses, "date", () => 1);
    const peakCat = [...new Set(expenses.map((e) => e.category))].reduce((best, cat) => {
      const sum = expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
      return sum > best.sum ? { cat, sum } : best;
    }, { cat: t("expense.salaries"), sum: 0 });
    return [
      {
        title: t("expense.outflow"),
        value: `${t("common.etb")} ${total.toLocaleString()}`,
        ...outflowTrend,
        footerTitle: t("expense.growth"),
        footerSub: t("expense.since_last")
      },
      {
        title: t("expense.recurring"),
        value: `${t("common.etb")} ${recurring.toLocaleString()}`,
        ...recurringTrend,
        footerTitle: t("expense.fixed"),
        footerSub: t("expense.sub_bills")
      },
      {
        title: t("expense.average"),
        value: `${t("common.etb")} ${average.toLocaleString(void 0, { maximumFractionDigits: 0 })}`,
        ...avgTrend,
        footerTitle: t("expense.per_trans"),
        footerSub: t("expense.efficiency")
      },
      {
        title: t("expense.peak"),
        value: peakCat.cat,
        trend: t("dashboard.trend_high"),
        trendType: "up",
        footerTitle: t("expense.largest"),
        footerSub: t("expense.operational_focus")
      }
    ];
  }, [expenses]);
  const insightData = reactExports.useMemo(() => {
    if (expenses.length === 0) return null;
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const byCat = /* @__PURE__ */ new Map();
    for (const e of expenses) {
      const cur = byCat.get(e.category) || { sum: 0, count: 0 };
      cur.sum += e.amount;
      cur.count += 1;
      byCat.set(e.category, cur);
    }
    const entries = [...byCat.entries()].sort((a, b) => b[1].sum - a[1].sum);
    const [category, info] = entries[0];
    const share = total > 0 ? info.sum / total * 100 : 0;
    const budget = budgets.find((b) => b.category === category);
    const spent = budget ? budget.spent ?? getSpentForCategory(category) : info.sum;
    const remaining = budget ? budget.remaining ?? budget.amount - spent : 0;
    const status = budget ? spent > budget.amount ? "critical" : spent > budget.amount * 0.8 ? "warning" : "healthy" : "none";
    return { category, sum: info.sum, count: info.count, share, budget, spent, remaining, status };
  }, [expenses, budgets]);
  const chartData = reactExports.useMemo(() => {
    if (!analytics?.expenseData) return [];
    return analytics.expenseData.map((d) => ({
      date: d.date,
      outflow: d.amount
    }));
  }, [analytics]);
  const chartConfig = {
    outflow: { label: t("expense.outflow"), color: "hsl(var(--primary))" }
  };
  const EXPENSE_CATEGORIES = [
    { id: "Rent", label: t("expense.rent") },
    { id: "Utilities", label: t("expense.utilities") },
    { id: "Salaries", label: t("expense.salaries") },
    { id: "Transport", label: t("expense.transport") },
    { id: "Supplies", label: t("expense.supplies") },
    { id: "Other", label: t("expense.other") }
  ];
  const BUDGET_CATEGORIES = [
    { id: "Utilities", label: t("expense.utilities") },
    { id: "Rent", label: t("expense.rent") },
    { id: "Salaries", label: t("expense.salaries") },
    { id: "Marketing", label: t("expense.marketing") || "Marketing" },
    { id: "Maintenance", label: t("expense.maintenance") || "Maintenance" },
    { id: "Transport", label: t("expense.transport") },
    { id: "Office Supplies", label: t("expense.office_supplies") || "Office Supplies" },
    { id: "Taxes", label: t("expense.taxes") || "Taxes" },
    { id: "Insurance", label: t("expense.insurance") || "Insurance" },
    { id: "Other", label: t("expense.other") }
  ];
  const categoryOptions = reactExports.useMemo(() => {
    const merged = [...EXPENSE_CATEGORIES];
    budgets.forEach((b) => {
      if (b?.category && !merged.some((c) => c.id === b.category)) {
        merged.push({ id: b.category, label: b.category });
      }
    });
    return merged;
  }, [budgets, EXPENSE_CATEGORIES]);
  const selectedFormBudget = getBudgetById(formData.budgetId);
  const columns = [
    {
      accessorKey: "name",
      header: t("expense.primary_narrative"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Briefcase, { className: "h-5 w-5 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: row.original.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground uppercase font-bold tracking-widest", children: [
            EXPENSE_CATEGORIES.find((c) => c.id === row.original.category)?.label || row.original.category,
            " • ",
            formatDate(row.original.date)
          ] })
        ] })
      ] })
    },
    {
      accessorKey: "amount",
      header: () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right", children: t("common.amount") }),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right font-black text-primary", children: [
        t("common.etb"),
        " ",
        row.original.amount.toLocaleString()
      ] })
    },
    {
      accessorKey: "isRecurring",
      header: t("common.status"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: row.original.isRecurring ? "default" : "outline", className: "uppercase text-xs font-bold", children: row.original.isRecurring ? t("expense.recurring") : t("expense.one_time") })
    },
    {
      id: "actions",
      header: () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right", children: t("common.actions") }),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => openEdit(row.original), title: t("common.edit"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "text-destructive hover:bg-destructive/10", title: t("common.delete"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { className: "rounded-[32px] bg-background border-border shadow-2xl", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { className: "text-xl font-black uppercase tracking-tight", children: t("expense.void_title") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { className: "text-xs font-medium text-muted-foreground leading-relaxed", children: t("expense.void_desc") })
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
  const handleDelete = async (id) => {
    await window.api?.deleteExpense(id);
    loadData();
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(t("expense.name_required") || "Expense name is required");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error(t("expense.amount_required") || "Valid amount is required");
      return;
    }
    const expense = {
      ...formData,
      amount: parseFloat(formData.amount),
      isRecurring: formData.isRecurring ? 1 : 0,
      startDate: formData.isRecurring ? formData.startDate : null,
      nextBillingDate: formData.isRecurring ? formData.nextBillingDate : null
    };
    if (editingExpense) await window.api?.updateExpense(editingExpense.id, expense);
    else await window.api?.insertExpense(expense);
    setShowModal(false);
    setEditingExpense(null);
    resetForm();
    loadData();
  };
  const resetForm = () => {
    setFormData({
      name: "",
      amount: "",
      category: "Other",
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      isRecurring: false,
      frequency: "monthly",
      startDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      nextBillingDate: "",
      budgetId: ""
    });
  };
  const openEdit = (expense) => {
    const matched = getBudgetForCategory(expense.category);
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date,
      isRecurring: Boolean(expense.isRecurring),
      frequency: expense.frequency || "monthly",
      startDate: expense.startDate || expense.date,
      nextBillingDate: expense.nextBillingDate || "",
      budgetId: matched ? String(matched.id) : ""
    });
    setShowModal(true);
  };
  const openAddExpense = () => {
    if (budgets.length === 0) {
      setBudgetPrompt(true);
      return;
    }
    resetForm();
    setEditingExpense(null);
    setShowModal(true);
    const defId = activeBudgetId ?? budgets[0]?.id ?? null;
    if (defId) {
      const def = budgets.find((b) => b.id === defId);
      setFormData((f) => ({
        ...f,
        budgetId: String(defId),
        category: def ? def.category : f.category
      }));
    }
  };
  const onCategoryChange = (val) => {
    const matched = getBudgetForCategory(val);
    setFormData((f) => ({ ...f, category: val, budgetId: matched ? String(matched.id) : f.budgetId }));
  };
  const onBudgetChange = (val) => {
    if (!val) {
      setFormData((f) => ({ ...f, budgetId: "" }));
      return;
    }
    const b = getBudgetById(val);
    setFormData((f) => ({ ...f, budgetId: val, category: b ? b.category : f.category }));
  };
  const exportExpensesCSV = () => {
    const h = [t("expense.export_name") || "Name", t("expense.export_amount") || "Amount", t("expense.export_category") || "Category", t("expense.export_date") || "Date", t("expense.export_recurring") || "Recurring", t("expense.export_frequency") || "Frequency"];
    const r = expenses.map((e) => [e.name, e.amount, e.category, e.date, e.isRecurring ? t("expense.export_yes") || "Yes" : t("expense.export_no") || "No", e.frequency || ""]);
    exportCSV(h, r, "expenses");
  };
  const exportExpensesPDF = () => {
    const h = [t("expense.export_name") || "Name", t("expense.export_amount") || "Amount", t("expense.export_category") || "Category", t("expense.export_date") || "Date", t("expense.export_recurring") || "Recurring", t("expense.export_frequency") || "Frequency"];
    const r = expenses.map((e) => [e.name, String(e.amount), e.category, e.date, e.isRecurring ? t("expense.export_yes") || "Yes" : t("expense.export_no") || "No", e.frequency || ""]);
    exportPDF(t("data_transfer.expenses_report"), h, r, "expenses");
    toast.success(t("reports.report_generated"));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-2 max-w-sm bg-muted/50 p-1 rounded-2xl h-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "expenses", className: "rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-black text-xs uppercase tracking-widest", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "w-4 h-4 mr-2" }),
          " ",
          t("expense.header")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "budget", className: "rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-black text-xs uppercase tracking-widest", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChartPie, { className: "w-4 h-4 mr-2" }),
          " ",
          t("budgets.tab_budgets")
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "expenses", className: "mt-6 space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCards, { cards: kpiCards }),
        (() => {
          const activeBudget = getBudgetById(activeBudgetId);
          if (!activeBudget) return null;
          const spent = activeBudget.spent ?? getSpentForCategory(activeBudget.category);
          const remaining = activeBudget.remaining ?? activeBudget.amount - spent;
          const percent = activeBudget.usagePercent ?? (activeBudget.amount > 0 ? Math.round(spent / activeBudget.amount * 100) : 0);
          const isOver = spent > activeBudget.amount;
          return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-3xl border border-border/50 bg-card shadow-xl space-y-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartPie, { className: "h-6 w-6 text-primary" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-[0.3em] text-muted-foreground", children: t("expense.budget_overview") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-black tracking-tight", children: activeBudget.category })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: String(activeBudget.id), onValueChange: (v) => setActiveBudgetId(Number(v)), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-64 h-10 bg-muted/20 border-none rounded-xl text-xs font-bold uppercase tracking-widest", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl", children: budgets.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: String(b.id), children: [
                  b.category,
                  " • ",
                  t("common.etb"),
                  " ",
                  b.amount.toLocaleString()
                ] }, b.id)) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("budgets.budget") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-black", children: [
                  t("common.etb"),
                  " ",
                  activeBudget.amount.toLocaleString()
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("budgets.spent") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-lg font-black ${isOver ? "text-destructive" : ""}`, children: [
                  t("common.etb"),
                  " ",
                  spent.toLocaleString()
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("budgets.remaining") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-lg font-black ${remaining < 0 ? "text-destructive" : "text-green-600"}`, children: [
                  t("common.etb"),
                  " ",
                  Math.max(0, remaining).toLocaleString()
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-muted rounded-full h-3 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "h-full rounded-full transition-all duration-700 ease-out",
                  style: {
                    width: `${Math.min(percent, 100)}%`,
                    background: isOver ? "linear-gradient(90deg, #ef4444, #dc2626)" : "linear-gradient(90deg, #22c55e, #3b82f6)"
                  }
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs font-bold text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("budgets.percent_used", { percent: Math.round(percent) }) }),
                isOver && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive", children: t("expense.budget_overage", { percent: Math.round(percent - 100) }) })
              ] })
            ] })
          ] }) });
        })(),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6 space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            ChartAreaInteractive,
            {
              data: chartData,
              config: chartConfig,
              title: t("expense.operational_focus"),
              description: t("expense.since_last"),
              dataKey: "outflow"
            }
          ) }),
          (() => {
            const insight = insightData;
            if (!insight) return null;
            const categoryLabel = categoryOptions.find((c) => c.id === insight.category)?.label || insight.category;
            const statusStyles = {
              healthy: "bg-green-500/10 text-green-600 border-green-500/20",
              warning: "bg-orange-500/10 text-orange-600 border-orange-500/20",
              critical: "bg-red-500/10 text-red-600 border-red-500/20",
              none: "bg-muted text-muted-foreground border-border"
            };
            const isOver = insight.budget && insight.spent > insight.budget.amount;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 rounded-[32px] border border-border/50 bg-card shadow-xl flex items-center justify-between relative overflow-hidden group", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-0 top-1/2 -translate-y-1/2 p-8 opacity-5 group-hover:opacity-10 transition-opacity", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { className: "h-32 w-32" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-8 relative z-10", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartPie, { className: "h-10 w-10 text-primary" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-[0.3em] text-muted-foreground", children: t("expense.category_insight") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-4xl font-black tracking-tighter uppercase", children: categoryLabel }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-2 flex-wrap", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: `${statusStyles[insight.status]} font-black uppercase text-xs`, children: insight.budget ? t(`budgets.status_${insight.status}`) : t("expense.no_budget_found") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-medium", children: t("expense.insight_share", { percent: Math.round(insight.share) }) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-medium", children: insight.budget ? t("expense.insight_vs_budget", {
                    spent: `${t("common.etb")} ${insight.spent.toLocaleString()}`,
                    budget: `${t("common.etb")} ${insight.budget.amount.toLocaleString()}`
                  }) : t("expense.insight_transactions", { count: insight.count }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right pr-12 hidden md:block", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground opacity-40 mb-1", children: isOver ? t("expense.budget_over") : t("expense.projected_savings") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-2xl font-black ${isOver ? "text-red-600" : "text-green-600"}`, children: [
                  t("common.etb"),
                  " ",
                  Math.max(0, insight.remaining).toLocaleString(),
                  insight.budget && !isOver ? ` ${t("expense.savings_potential")}` : ""
                ] })
              ] })
            ] });
          })()
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            DataTable,
            {
              columns,
              data: expenses,
              title: t("expense.header")
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 justify-end mt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: exportExpensesCSV, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 14, className: "mr-1" }),
              " ",
              t("reports.export_csv")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: exportExpensesPDF, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 14, className: "mr-1" }),
              " ",
              t("reports.export_pdf")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showModal, onClose: () => setShowModal(false), title: editingExpense ? t("expense.modify") : t("expense.new"), size: "lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-8 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2", children: t("expense.primary_narrative") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("expense.desc_payee") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { required: true, value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "h-12 bg-card rounded-xl font-bold", placeholder: t("expense.placeholder_name") || "e.g. Office Rent - May" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: [
                  t("common.amount"),
                  " (",
                  t("common.etb"),
                  ")"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { required: true, type: "number", value: formData.amount, onChange: (e) => setFormData({ ...formData, amount: e.target.value }), className: "h-12 bg-card rounded-xl font-black text-lg", placeholder: t("expense.placeholder_amount") || "0.00" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2", children: t("expense.fiscal_logistics") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("expense.classification") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: formData.category, onValueChange: onCategoryChange, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-12 bg-muted/30 border-border/50 rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl", children: categoryOptions.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: cat.id, children: cat.label }, cat.id)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("expense.trans_date") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: formData.date, onChange: (e) => setFormData({ ...formData, date: e }), className: "h-12 bg-card rounded-xl" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("expense.budget_select") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: formData.budgetId, onValueChange: onBudgetChange, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-12 bg-muted/30 border-border/50 rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("expense.budget_select_placeholder") }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl", children: budgets.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: String(b.id), children: [
                  b.category,
                  " • ",
                  t("common.etb"),
                  " ",
                  b.amount.toLocaleString()
                ] }, b.id)) })
              ] }),
              selectedFormBudget && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-medium text-muted-foreground flex items-center gap-1.5 pt-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-3.5 w-3.5" }),
                t("expense.budget_remaining", {
                  amount: `${t("common.etb")} ${Math.max(0, selectedFormBudget.remaining ?? selectedFormBudget.amount - getSpentForCategory(selectedFormBudget.category)).toLocaleString()}`
                })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-[24px] border border-border/50 bg-card space-y-4 shadow-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-2 rounded-lg transition-colors ${formData.isRecurring ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Repeat, { className: "h-5 w-5" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest", children: t("expense.recurring_comm") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground font-medium", children: t("expense.auto_log") })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
                formData.isRecurring && /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: formData.frequency, onValueChange: (v) => setFormData({ ...formData, frequency: v }), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-32 h-10 bg-muted/20 border-none rounded-lg text-xs font-bold uppercase tracking-widest", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-lg", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "daily", children: t("expense.daily") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "weekly", children: t("expense.weekly") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "monthly", children: t("expense.monthly") })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: formData.isRecurring, onCheckedChange: (c) => setFormData({ ...formData, isRecurring: c }) })
              ] })
            ] }),
            formData.isRecurring && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 pt-2 border-t border-border/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("common.start_date") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: formData.startDate, onChange: (e) => setFormData({ ...formData, startDate: e }), className: "h-10 bg-card rounded-xl text-xs w-full" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("expense.next_billing") || "Next Billing" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: formData.nextBillingDate, onChange: (e) => setFormData({ ...formData, nextBillingDate: e }), className: "h-10 bg-card rounded-xl text-xs w-full" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-md pb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg", children: t("expense.commit") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", onClick: () => setShowModal(false), className: "py-6 font-bold uppercase tracking-widest opacity-40 hover:bg-transparent", children: t("common.abort") })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "budget", className: "mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6 space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black tracking-tight", children: t("budgets.title") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-medium", children: t("expense.budget_subtitle") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                onClick: () => {
                  resetBudgetForm();
                  setBudgetModal(true);
                },
                className: "h-11 text-xs font-black uppercase tracking-widest rounded-2xl",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
                  " ",
                  t("budgets.set_budget")
                ]
              }
            )
          ] }),
          (() => {
            const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
            const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
            const budgetPercent = totalBudget > 0 ? Math.min(100, totalSpent / totalBudget * 100) : 0;
            const cx = 50, cy = 50, r = 40, sw = 8, circ = 2 * Math.PI * r;
            const offset = circ - budgetPercent / 100 * circ;
            const isOver = budgetPercent >= 100;
            const gradientId = "budgetRingGradient";
            return totalBudget > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-3xl border border-border/50 bg-card shadow-xl flex items-center gap-8", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "120", height: "120", viewBox: "0 0 100 100", className: "shrink-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: gradientId, x1: "0%", y1: "0%", x2: "100%", y2: "0%", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: isOver ? "#ef4444" : "#22c55e" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: isOver ? "#dc2626" : "#3b82f6" })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx, cy, r, fill: "none", stroke: "hsl(var(--muted))", strokeWidth: sw }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "circle",
                  {
                    cx,
                    cy,
                    r,
                    fill: "none",
                    stroke: `url(#${gradientId})`,
                    strokeWidth: sw,
                    strokeLinecap: "round",
                    strokeDasharray: circ,
                    strokeDashoffset: offset,
                    transform: "rotate(-90 50 50)",
                    className: "transition-all duration-700 ease-out"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "text",
                  {
                    x: "50",
                    y: "50",
                    textAnchor: "middle",
                    dominantBaseline: "central",
                    className: "text-lg font-black fill-foreground",
                    children: [
                      Math.round(budgetPercent),
                      "%"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-[0.3em] text-muted-foreground", children: isOver ? t("expense.budget_over") : t("expense.budget_health") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-black tracking-tight", children: [
                  t("expense.budget_spent"),
                  " ",
                  t("common.etb"),
                  " ",
                  totalSpent.toLocaleString()
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-medium", children: t("expense.budget_of", { amount: `${t("common.etb")} ${totalBudget.toLocaleString()}` }) })
              ] })
            ] }) : null;
          })(),
          budgets.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-12 rounded-3xl border border-border/50 bg-card flex flex-col items-center justify-center text-center space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-16 rounded-3xl bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartPie, { className: "h-8 w-8 text-muted-foreground" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-black", children: t("expense.budget_no_budgets") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground max-w-md", children: t("expense.budget_create_first") })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: budgets.map((budget) => {
            const spent = getSpentForCategory(budget.category);
            const percentage = budget.amount > 0 ? spent / budget.amount * 100 : 0;
            const remaining = budget.amount - spent;
            const isOver = spent > budget.amount;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-3xl border border-border/50 bg-card shadow-xl space-y-4 relative overflow-hidden group", children: [
              isOver && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "destructive", className: "rounded-bl-2xl rounded-tr-3xl text-xs font-black uppercase px-3 py-1.5", children: t("expense.budget_over") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-5 w-5 text-primary" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-base", children: budget.category }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground uppercase font-bold tracking-widest", children: t("expense.budget_period", { period: budget.period }) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "text-destructive hover:bg-destructive/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { className: "rounded-[32px] bg-background border-border shadow-2xl", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { className: "text-xl font-black uppercase tracking-tight", children: t("expense.budget_delete_title") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { className: "text-xs font-medium text-muted-foreground leading-relaxed", children: t("expense.budget_delete_confirm", { category: budget.category }) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { className: "gap-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { className: "rounded-xl border-border h-11 text-xs font-black uppercase tracking-widest", children: t("common.cancel") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        AlertDialogAction,
                        {
                          onClick: () => handleDeleteBudget(budget.id),
                          className: "rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-xs font-black uppercase tracking-widest",
                          children: t("common.delete")
                        }
                      )
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("budgets.budget") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-black", children: [
                    t("common.etb"),
                    " ",
                    budget.amount.toLocaleString()
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("budgets.spent") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-lg font-black ${isOver ? "text-destructive" : ""}`, children: [
                    t("common.etb"),
                    " ",
                    spent.toLocaleString()
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("budgets.remaining") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-lg font-black ${remaining < 0 ? "text-destructive" : "text-green-600"}`, children: [
                    t("common.etb"),
                    " ",
                    Math.max(0, remaining).toLocaleString()
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-muted rounded-full h-3 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: "h-full rounded-full transition-all duration-700 ease-out",
                    style: {
                      width: `${Math.min(percentage, 100)}%`,
                      background: isOver ? "linear-gradient(90deg, #ef4444, #dc2626)" : "linear-gradient(90deg, #22c55e, #3b82f6)"
                    }
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs font-bold text-muted-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("budgets.percent_used", { percent: Math.round(percentage) }) }),
                  isOver && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive", children: t("expense.budget_overage", { percent: Math.round(percentage - 100) }) })
                ] })
              ] })
            ] }, budget.id);
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: budgetModal, onClose: () => setBudgetModal(false), title: t("budgets.set_budget"), size: "lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSetBudget, className: "space-y-8 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2", children: t("expense.budget_details") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("budgets.category") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: budgetFormData.category, onValueChange: (val) => setBudgetFormData({ ...budgetFormData, category: val }), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-12 bg-muted/30 border-border/50 rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-xl", children: [
                    BUDGET_CATEGORIES.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: cat.id, children: cat.label }, cat.id)),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__custom__", children: t("expense.custom_category") || "Custom…" })
                  ] })
                ] })
              ] }),
              budgetFormData.category === "__custom__" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 md:col-span-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("expense.custom_category_label") || "Custom Category" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: budgetFormData.customCategory,
                    onChange: (e) => setBudgetFormData({ ...budgetFormData, customCategory: e.target.value }),
                    className: "h-12 bg-card rounded-xl font-bold",
                    placeholder: t("expense.custom_category_placeholder") || "e.g. Equipment"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: [
                  t("budgets.amount"),
                  " (",
                  t("common.etb"),
                  ")"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { required: true, type: "number", value: budgetFormData.amount, onChange: (e) => setBudgetFormData({ ...budgetFormData, amount: e.target.value }), className: "h-12 bg-card rounded-xl font-black text-lg", placeholder: t("expense.placeholder_amount") || "0.00" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("budgets.period") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: budgetFormData.period, onValueChange: (val) => setBudgetFormData({ ...budgetFormData, period: val }), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-12 bg-muted/30 border-border/50 rounded-xl max-w-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-xl", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "monthly", children: t("budgets.monthly") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "quarterly", children: t("budgets.quarterly") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "yearly", children: t("budgets.yearly") })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-md pb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg", children: t("expense.budget_save") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", onClick: () => setBudgetModal(false), className: "py-6 font-bold uppercase tracking-widest opacity-40 hover:bg-transparent", children: t("common.cancel") })
          ] })
        ] }) })
      ] })
    ] }) }),
    activeTab === "expenses" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        className: "fixed bottom-8 right-8 h-20 w-20 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-all z-[9999] flex flex-col gap-1 items-center justify-center border-4 border-primary-foreground/20 group",
        "data-tutorial-section": "add-expense-fab",
        onClick: openAddExpense,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-8 w-8 group-hover:rotate-90 transition-transform duration-300", strokeWidth: 4 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-black uppercase tracking-tighter", children: t("expense.post") })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: budgetPrompt, onOpenChange: setBudgetPrompt, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { className: "rounded-[32px] bg-background border-border shadow-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { className: "text-xl font-black uppercase tracking-tight", children: t("expense.budget_required_title") || "Set Up a Budget First" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { className: "text-xs font-medium text-muted-foreground leading-relaxed", children: t("expense.budget_required_desc") || "You must create at least one budget before recording expenses. Set a spending limit to unlock expense tracking." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { className: "gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { className: "rounded-xl border-border h-11 text-xs font-black uppercase tracking-widest", children: t("common.abort") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AlertDialogAction,
          {
            onClick: () => {
              setBudgetPrompt(false);
              setActiveTab("budget");
            },
            className: "rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-xs font-black uppercase tracking-widest",
            children: t("expense.go_to_budget") || "Go to Budgets"
          }
        )
      ] })
    ] }) })
  ] });
};
export {
  Expenses as default
};
