import { c as createLucideIcon, b as useSettings, a6 as useIsMobile, r as reactExports, n as toEthiopianDate, o as getEthiopianMonthName, j as jsxRuntimeExports, g as Badge, e as Button, h as Trash2, a7 as TrendingDown, J as FileText, M as Modal, K as Input, t as toast } from "./index-KcbOuwlA.js";
import { A as AlertDialog, h as AlertDialogTrigger, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-Ke03lX1F.js";
import { S as SectionCards } from "./section-cards-Dy4aaYvC.js";
import { D as DataTable } from "./data-table-DznN-uuJ.js";
import { e as exportCSV, a as exportPDF } from "./export-utils-Dojrgpyy.js";
import { c as computeTrend } from "./trend-utils-D_UP5BUt.js";
import { C as Card, a as CardHeader, b as CardTitle, d as CardDescription, e as CardAction, c as CardContent } from "./label-BI69aa1I.js";
import { T as ToggleGroup, b as ToggleGroupItem, C as ChartContainer, c as ChartTooltip, a as ChartTooltipContent } from "./toggle-group-BpdCTWah.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-YJnyGvXs.js";
import { A as AreaChart, a as Area, B as Briefcase, C as ChartPie } from "./AreaChart-yz-zUHl2.js";
import { ag as CartesianGrid, ah as XAxis } from "./CartesianChart-ljR0iKyw.js";
import { D as DatePicker } from "./DatePicker-oD7Ou9XD.js";
import { S as Switch } from "./switch-DpWwBQjK.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-Llxhc1yS.js";
import { S as SquarePen } from "./square-pen-Ddvf5fqh.js";
import { R as Repeat } from "./repeat-DDa1TDiq.js";
import { P as Plus } from "./plus-pdN_V3Af.js";
import "./table-Cnor9ZKG.js";
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
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Wallet = createLucideIcon("Wallet", [
  [
    "path",
    {
      d: "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1",
      key: "18etb6"
    }
  ],
  ["path", { d: "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4", key: "xoc0q4" }]
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
    return raw.map((item, i) => {
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
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [formData, setFormData] = reactExports.useState({
    name: "",
    amount: "",
    category: "Other",
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    isRecurring: false,
    frequency: "monthly",
    startDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    nextBillingDate: ""
  });
  const [activeTab, setActiveTab] = reactExports.useState("expenses");
  const [budgets, setBudgets] = reactExports.useState([]);
  const [budgetModal, setBudgetModal] = reactExports.useState(false);
  const [monthExpenses, setMonthExpenses] = reactExports.useState([]);
  const [budgetFormData, setBudgetFormData] = reactExports.useState({
    category: "Other",
    amount: "",
    period: "monthly"
  });
  reactExports.useEffect(() => {
    loadData();
  }, [searchQuery]);
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
  };
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
    setBudgetFormData({ category: "Other", amount: "", period: "monthly" });
  };
  const handleSetBudget = async (e) => {
    e.preventDefault();
    if (!budgetFormData.amount || parseFloat(budgetFormData.amount) <= 0) {
      toast.error("Valid budget amount is required");
      return;
    }
    try {
      const result = await window.api?.setBudget({
        category: budgetFormData.category,
        amount: parseFloat(budgetFormData.amount),
        period: budgetFormData.period
      });
      if (result?.success) toast.success("Budget saved");
      setBudgetModal(false);
      resetBudgetForm();
      loadBudgets();
    } catch {
      toast.error("Failed to save budget");
    }
  };
  const handleDeleteBudget = async (id) => {
    try {
      await window.api?.deleteBudget(id);
      toast.success("Budget deleted");
      loadBudgets();
    } catch {
      toast.error("Failed to delete budget");
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
    }, { cat: "Salaries", sum: 0 });
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
        trend: "High",
        trendType: "up",
        footerTitle: t("expense.largest"),
        footerSub: t("expense.operational_focus")
      }
    ];
  }, [expenses]);
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
    { id: "Utilities", label: "Utilities" },
    { id: "Rent", label: "Rent" },
    { id: "Salaries", label: "Salaries" },
    { id: "Marketing", label: "Marketing" },
    { id: "Maintenance", label: "Maintenance" },
    { id: "Transport", label: "Transport" },
    { id: "Office Supplies", label: "Office Supplies" },
    { id: "Taxes", label: "Taxes" },
    { id: "Insurance", label: "Insurance" },
    { id: "Other", label: "Other" }
  ];
  const columns = [
    {
      accessorKey: "name",
      header: t("expense.primary_narrative"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Briefcase, { className: "h-5 w-5 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: row.original.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-muted-foreground uppercase font-bold tracking-widest", children: [
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
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: row.original.isRecurring ? "default" : "outline", className: "uppercase text-[9px] font-bold", children: row.original.isRecurring ? t("expense.recurring") : t("expense.one_time") })
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
  const handleDelete = async (id) => {
    await window.api?.deleteExpense(id);
    loadData();
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Expense name is required");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Valid amount is required");
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
      nextBillingDate: ""
    });
  };
  const openEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date,
      isRecurring: Boolean(expense.isRecurring),
      frequency: expense.frequency || "monthly",
      startDate: expense.startDate || expense.date,
      nextBillingDate: expense.nextBillingDate || ""
    });
    setShowModal(true);
  };
  const exportExpensesCSV = () => {
    const h = ["Name", "Amount", "Category", "Date", "Recurring", "Frequency"];
    const r = expenses.map((e) => [e.name, e.amount, e.category, e.date, e.isRecurring ? "Yes" : "No", e.frequency || ""]);
    exportCSV(h, r, "expenses");
  };
  const exportExpensesPDF = () => {
    const h = ["Name", "Amount", "Category", "Date", "Recurring", "Frequency"];
    const r = expenses.map((e) => [e.name, String(e.amount), e.category, e.date, e.isRecurring ? "Yes" : "No", e.frequency || ""]);
    exportPDF("Expenses Report", h, r, "expenses");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-2 max-w-sm bg-muted/50 p-1 rounded-2xl h-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "expenses", className: "rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-black text-[10px] uppercase tracking-widest", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "w-4 h-4 mr-2" }),
          " ",
          t("expense.header")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "budget", className: "rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-black text-[10px] uppercase tracking-widest", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChartPie, { className: "w-4 h-4 mr-2" }),
          " Budget"
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "expenses", className: "mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCards, { cards: kpiCards }),
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
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 rounded-[32px] border border-border/50 bg-card shadow-xl flex items-center justify-between relative overflow-hidden group", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-0 top-1/2 -translate-y-1/2 p-8 opacity-5 group-hover:opacity-10 transition-opacity", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { className: "h-32 w-32" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-8 relative z-10", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartPie, { className: "h-10 w-10 text-primary" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground", children: t("expense.category_insight") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-4xl font-black tracking-tighter uppercase", children: t("expense.salaries") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "bg-orange-500/10 text-orange-600 border-orange-500/20 font-black uppercase text-[9px]", children: t("expense.critical_sector") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-medium", children: t("expense.consumption_desc") })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right pr-12 hidden md:block", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40 mb-1", children: t("expense.projected_savings") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-black text-green-600", children: [
                "-12% ",
                t("expense.savings_potential")
              ] })
            ] })
          ] })
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
              " CSV"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: exportExpensesPDF, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 14, className: "mr-1" }),
              " PDF"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showModal, onClose: () => setShowModal(false), title: editingExpense ? t("expense.modify") : t("expense.new"), size: "lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-8 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2", children: t("expense.primary_narrative") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("expense.desc_payee") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { required: true, value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "h-12 bg-card rounded-xl font-bold", placeholder: "e.g. Office Rent - May" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: [
                  t("common.amount"),
                  " (",
                  t("common.etb"),
                  ")"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { required: true, type: "number", value: formData.amount, onChange: (e) => setFormData({ ...formData, amount: e.target.value }), className: "h-12 bg-card rounded-xl font-black text-lg", placeholder: "0.00" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2", children: t("expense.fiscal_logistics") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("expense.classification") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: formData.category, onValueChange: (val) => setFormData({ ...formData, category: val }), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-12 bg-muted/30 border-border/50 rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl", children: EXPENSE_CATEGORIES.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: cat.id, children: cat.label }, cat.id)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("expense.trans_date") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: formData.date, onChange: (e) => setFormData({ ...formData, date: e }), className: "h-12 bg-card rounded-xl" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-[24px] border border-border/50 bg-card space-y-4 shadow-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-2 rounded-lg transition-colors ${formData.isRecurring ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Repeat, { className: "h-5 w-5" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest", children: t("expense.recurring_comm") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground font-medium", children: t("expense.auto_log") })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
                formData.isRecurring && /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: formData.frequency, onValueChange: (v) => setFormData({ ...formData, frequency: v }), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-32 h-10 bg-muted/20 border-none rounded-lg text-[10px] font-bold uppercase tracking-widest", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
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
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-bold uppercase tracking-widest text-muted-foreground", children: t("common.start_date") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: formData.startDate, onChange: (e) => setFormData({ ...formData, startDate: e }), className: "h-10 bg-card rounded-xl text-xs w-full" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-bold uppercase tracking-widest text-muted-foreground", children: t("expense.next_billing") || "Next Billing" }),
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
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black tracking-tight", children: "Budget Management" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-medium", children: "Set and monitor spending limits" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                onClick: () => {
                  resetBudgetForm();
                  setBudgetModal(true);
                },
                className: "h-11 text-[10px] font-black uppercase tracking-widest rounded-2xl",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
                  " Set Budget"
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
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground", children: isOver ? "Over Budget" : "Budget Health" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-black tracking-tight", children: [
                  "Spent ",
                  t("common.etb"),
                  " ",
                  totalSpent.toLocaleString()
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground font-medium", children: [
                  "of ",
                  t("common.etb"),
                  " ",
                  totalBudget.toLocaleString(),
                  " budget"
                ] })
              ] })
            ] }) : null;
          })(),
          budgets.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-12 rounded-3xl border border-border/50 bg-card flex flex-col items-center justify-center text-center space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-16 rounded-3xl bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartPie, { className: "h-8 w-8 text-muted-foreground" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-black", children: "No Budgets Set" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground max-w-md", children: "Create your first budget to start tracking spending limits across categories." })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: budgets.map((budget) => {
            const spent = getSpentForCategory(budget.category);
            const percentage = budget.amount > 0 ? spent / budget.amount * 100 : 0;
            const remaining = budget.amount - spent;
            const isOver = spent > budget.amount;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-3xl border border-border/50 bg-card shadow-xl space-y-4 relative overflow-hidden group", children: [
              isOver && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "destructive", className: "rounded-bl-2xl rounded-tr-3xl text-[9px] font-black uppercase px-3 py-1.5", children: "Over Budget" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-5 w-5 text-primary" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-base", children: budget.category }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-muted-foreground uppercase font-bold tracking-widest", children: [
                      budget.period,
                      " budget"
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "text-destructive hover:bg-destructive/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { className: "rounded-[32px] bg-background border-border shadow-2xl", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { className: "text-xl font-black uppercase tracking-tight", children: "Delete Budget" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { className: "text-xs font-medium text-muted-foreground leading-relaxed", children: [
                        "Are you sure you want to delete the budget for ",
                        budget.category,
                        "?"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { className: "gap-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { className: "rounded-xl border-border h-11 text-[10px] font-black uppercase tracking-widest", children: "Cancel" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        AlertDialogAction,
                        {
                          onClick: () => handleDeleteBudget(budget.id),
                          className: "rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-[10px] font-black uppercase tracking-widest",
                          children: "Delete"
                        }
                      )
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Budget" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-black", children: [
                    t("common.etb"),
                    " ",
                    budget.amount.toLocaleString()
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Spent" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-lg font-black ${isOver ? "text-destructive" : ""}`, children: [
                    t("common.etb"),
                    " ",
                    spent.toLocaleString()
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Remaining" }),
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
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-[10px] font-bold text-muted-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    Math.round(percentage),
                    "% used"
                  ] }),
                  isOver && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-destructive", children: [
                    Math.round(percentage - 100),
                    "% over"
                  ] })
                ] })
              ] })
            ] }, budget.id);
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: budgetModal, onClose: () => setBudgetModal(false), title: "Set Budget", size: "lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSetBudget, className: "space-y-8 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2", children: "Budget Details" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Category" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: budgetFormData.category, onValueChange: (val) => setBudgetFormData({ ...budgetFormData, category: val }), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-12 bg-muted/30 border-border/50 rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl", children: BUDGET_CATEGORIES.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: cat.id, children: cat.label }, cat.id)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: [
                  "Amount (",
                  t("common.etb"),
                  ")"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { required: true, type: "number", value: budgetFormData.amount, onChange: (e) => setBudgetFormData({ ...budgetFormData, amount: e.target.value }), className: "h-12 bg-card rounded-xl font-black text-lg", placeholder: "0.00" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Period" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: budgetFormData.period, onValueChange: (val) => setBudgetFormData({ ...budgetFormData, period: val }), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-12 bg-muted/30 border-border/50 rounded-xl max-w-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-xl", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "monthly", children: "Monthly" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "quarterly", children: "Quarterly" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "yearly", children: "Yearly" })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-md pb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg", children: "Save Budget" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", onClick: () => setBudgetModal(false), className: "py-6 font-bold uppercase tracking-widest opacity-40 hover:bg-transparent", children: "Cancel" })
          ] })
        ] }) })
      ] })
    ] }) }),
    activeTab === "expenses" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        className: "fixed bottom-8 right-8 h-20 w-20 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-all z-[9999] flex flex-col gap-1 items-center justify-center border-4 border-primary-foreground/20 group",
        onClick: () => {
          resetForm();
          setEditingExpense(null);
          setShowModal(true);
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-8 w-8 group-hover:rotate-90 transition-transform duration-300", strokeWidth: 4 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] font-black uppercase tracking-tighter", children: t("expense.post") })
        ]
      }
    )
  ] });
};
export {
  Expenses as default
};
