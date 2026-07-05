import { c as createLucideIcon, b as useSettings, r as reactExports, j as jsxRuntimeExports, l as TrendingDown, T as TriangleAlert, g as Badge, ae as ChartPie, ac as CreditCard, m as Package, ap as Shield, h as Clock, k as ChartColumn } from "./index-BQyt5yx7.js";
import { C as Card, c as CardContent } from "./card-BckdbOp1.js";
import { L as Label } from "./label-CL7PYlTT.js";
import { D as DatePicker } from "./DatePicker-DBKmFwF1.js";
import { C as Calendar } from "./calendar-BL8kAN_u.js";
import { T as TrendingUp } from "./trending-up-DB-i0stY.js";
import { D as DollarSign } from "./dollar-sign-CnYcdMha.js";
import { B as Briefcase, A as AreaChart, a as Area } from "./AreaChart-DUisj8_u.js";
import { Z as Zap, Y as YAxis, B as BarChart, c as Bar, A as Activity } from "./BarChart-Drxf4lS6.js";
import { B as Banknote } from "./banknote-BWmB4toc.js";
import { A as ArrowRightLeft } from "./arrow-right-left-DQD90fw7.js";
import { ai as ResponsiveContainer, ag as CartesianGrid, ah as XAxis, af as Tooltip } from "./CartesianChart-CtFYKNPV.js";
import { B as Boxes } from "./boxes-BofsSR8o.js";
import "./select-DvFPMP5U.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ArrowUpRight = createLucideIcon("ArrowUpRight", [
  ["path", { d: "M7 7h10v10", key: "1tivn9" }],
  ["path", { d: "M7 17 17 7", key: "1vkiza" }]
]);
const Analytics = () => {
  const { t, formatDate, formatTime, language } = useSettings();
  const [period, setPeriod] = reactExports.useState("month");
  const [dateRange, setDateRange] = reactExports.useState({ start: "", end: "" });
  const [data, setData] = reactExports.useState(null);
  const [dashboardStats, setDashboardStats] = reactExports.useState(null);
  const [inventoryValue, setInventoryValue] = reactExports.useState(0);
  const [lowStockItems, setLowStockItems] = reactExports.useState([]);
  const [recentActivity, setRecentActivity] = reactExports.useState([]);
  const [rawSales, setRawSales] = reactExports.useState([]);
  const currentRange = reactExports.useMemo(() => {
    if (period === "custom") return dateRange;
    const now = /* @__PURE__ */ new Date();
    let end = now.toISOString().split("T")[0];
    let start = "";
    if (period === "today") {
      start = end;
    } else if (period === "week") {
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
  reactExports.useEffect(() => {
    if (period !== "custom" || dateRange.start && dateRange.end) {
      loadData();
    }
  }, [period]);
  const loadData = async (customRange) => {
    const range = customRange || currentRange;
    try {
      const [anData, dbStats, items, activity, sales] = await Promise.all([
        window.api.getAnalytics(period, range),
        window.api.getDashboardStats(),
        window.api.getItems({}),
        window.api.getRecentActivity(10, range),
        window.api.getSales({ startDate: range.start, endDate: range.end })
      ]);
      setData(anData);
      setDashboardStats(dbStats);
      setRecentActivity(activity || []);
      setRawSales(sales || []);
      if (items) {
        const val = items.reduce(
          (s, i) => s + i.totalBaseQuantity * i.basePurchasePrice,
          0
        );
        setInventoryValue(val);
        const lowStock = items.filter((i) => i.totalBaseQuantity <= 10).sort((a, b) => a.totalBaseQuantity - b.totalBaseQuantity);
        setLowStockItems(lowStock);
      }
    } catch (e) {
      console.error(e.message || "Failed to load analytics");
    }
  };
  const chartData = reactExports.useMemo(() => {
    if (!data) return [];
    return data.salesData.map((s) => {
      const expense = data.expenseData.find((e) => e.date === s.date)?.amount || 0;
      let name = s.date;
      try {
        const d = new Date(s.date);
        if (period === "year" && !dateRange.start) {
          name = d.toLocaleDateString(language, { month: "short" });
        } else if (period === "today") {
          name = d.toLocaleTimeString(language, {
            hour: "2-digit",
            minute: "2-digit"
          });
        } else {
          name = d.toLocaleDateString(language, {
            month: "short",
            day: "numeric"
          });
        }
      } catch (e) {
      }
      return {
        name,
        revenue: s.revenue,
        expense,
        profit: s.profit
      };
    });
  }, [data, period, language, dateRange]);
  const salesDistribution = reactExports.useMemo(() => {
    if (!rawSales.length) return { title: "", subtitle: "", data: [], dataKey: "" };
    const range = currentRange;
    const start = range.start ? new Date(range.start) : null;
    const end = range.end ? new Date(range.end) : null;
    const daySpan = start && end ? Math.ceil((end.getTime() - start.getTime()) / 864e5) : 0;
    let granularity = "daily";
    if (period === "today") granularity = "hourly";
    else if (period === "week") granularity = "daily";
    else if (period === "month") granularity = "weekly";
    else if (period === "year") granularity = "monthly";
    else if (period === "custom") {
      if (daySpan <= 1) granularity = "hourly";
      else if (daySpan <= 14) granularity = "daily";
      else if (daySpan <= 60) granularity = "weekly";
      else granularity = "monthly";
    }
    if (granularity === "hourly") {
      const hourly = Array.from({ length: 24 }, (_, i) => ({ label: `${i.toString().padStart(2, "0")}:00`, revenue: 0, count: 0 }));
      rawSales.forEach((s) => {
        const h = new Date(s.createdAt).getHours();
        hourly[h].revenue += s.totalPrice || 0;
        hourly[h].count += 1;
      });
      return { title: t("analytics.by_hour") || "Sales by Hour", subtitle: t("analytics.by_hour_desc") || "Peak revenue hours", data: hourly, dataKey: "label" };
    }
    if (granularity === "daily") {
      const dayNames = [t("analytics.day_sun"), t("analytics.day_mon"), t("analytics.day_tue"), t("analytics.day_wed"), t("analytics.day_thu"), t("analytics.day_fri"), t("analytics.day_sat")];
      const days = dayNames.map((n) => ({ label: n, revenue: 0, count: 0 }));
      rawSales.forEach((s) => {
        const d = new Date(s.createdAt).getDay();
        days[d].revenue += s.totalPrice || 0;
        days[d].count += 1;
      });
      return { title: t("analytics.by_day") || "Sales by Day", subtitle: t("analytics.by_day_desc") || "Daily revenue pattern", data: days, dataKey: "label" };
    }
    if (granularity === "weekly") {
      const weeks = Array.from({ length: 5 }, (_, i) => ({ label: t("analytics.week_label", { week: i + 1 }), revenue: 0, count: 0 }));
      rawSales.forEach((s) => {
        const d = new Date(s.createdAt);
        const day = d.getDate();
        const weekIdx = Math.min(Math.floor((day - 1) / 7), 4);
        weeks[weekIdx].revenue += s.totalPrice || 0;
        weeks[weekIdx].count += 1;
      });
      return { title: t("analytics.by_week") || "Sales by Week", subtitle: t("analytics.by_week_desc") || "Weekly revenue pattern", data: weeks, dataKey: "label" };
    }
    const months = [t("budgets.month_jan"), t("budgets.month_feb"), t("budgets.month_mar"), t("budgets.month_apr"), t("budgets.month_may"), t("budgets.month_jun"), t("budgets.month_jul"), t("budgets.month_aug"), t("budgets.month_sep"), t("budgets.month_oct"), t("budgets.month_nov"), t("budgets.month_dec")];
    const monthly = months.map((n) => ({ label: n, revenue: 0, count: 0 }));
    rawSales.forEach((s) => {
      const m = new Date(s.createdAt).getMonth();
      monthly[m].revenue += s.totalPrice || 0;
      monthly[m].count += 1;
    });
    return { title: t("analytics.by_month") || "Sales by Month", subtitle: t("analytics.by_month_desc") || "Monthly revenue pattern", data: monthly, dataKey: "label" };
  }, [rawSales, period, currentRange, language]);
  const paymentMethodBreakdown = reactExports.useMemo(() => {
    if (!rawSales.length) return [];
    const groups = {};
    rawSales.forEach((sale) => {
      const method = (sale.paymentMethod || "cash").toLowerCase();
      groups[method] = (groups[method] || 0) + (sale.totalPrice || 0);
    });
    const total = Object.values(groups).reduce((s, v) => s + v, 0);
    return Object.entries(groups).map(([method, amount]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1),
      amount,
      percentage: total > 0 ? amount / total * 100 : 0
    })).sort((a, b) => b.percentage - a.percentage);
  }, [rawSales]);
  const insights = reactExports.useMemo(() => {
    if (!data || !dashboardStats) return null;
    const todayRev = dashboardStats.todayRevenue || 0;
    const yestRev = dashboardStats.yesterdayRevenue || 0;
    let growth = 0;
    if (yestRev > 0) {
      growth = (todayRev - yestRev) / yestRev * 100;
    } else if (todayRev > 0) {
      growth = 100;
    }
    return {
      growth: (growth || 0).toFixed(1),
      isGrowthPositive: growth >= 0
    };
  }, [data, dashboardStats]);
  const handleCustomSearch = () => {
    if (dateRange.start && dateRange.end) {
      loadData(dateRange);
    }
  };
  const formattedRange = reactExports.useMemo(() => {
    if (!currentRange.start) return "";
    if (currentRange.start === currentRange.end)
      return formatDate(currentRange.start);
    return `${formatDate(currentRange.start)} - ${formatDate(currentRange.end)}`;
  }, [currentRange, formatDate]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fade-in pb-24 relative min-h-screen bg-background text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 md:px-8 lg:px-12 max-w-[1800px] mx-auto flex flex-col gap-y-8 pt-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col md:flex-row items-center justify-between gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: t("tabs.analytics") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-muted-foreground", children: t("analytics.subtitle") }),
        formattedRange && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1 h-1 rounded-full bg-muted-foreground/30" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-primary uppercase tracking-wider", children: formattedRange })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-2xl shadow-sm border-border bg-card text-card-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-3 flex flex-col lg:flex-row items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex bg-muted p-1 rounded-xl w-fit border border-border", children: ["today", "week", "month", "year", "custom"].map(
          (p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setPeriod(p),
              className: `px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${period === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`,
              children: t(`analytics.${p}`)
            },
            p
          )
        ) }),
        period === "custom" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 bg-muted/50 p-2 rounded-xl border border-border animate-in fade-in slide-in-from-left-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 px-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: "start",
                className: "text-[9px] font-bold uppercase text-muted-foreground",
                children: t("analytics.start_date")
              }
            ),
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
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: "end",
                className: "text-[9px] font-bold uppercase text-muted-foreground",
                children: t("analytics.end_date")
              }
            ),
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
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        insights && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: `px-3 py-2 rounded-xl flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase bg-muted text-foreground border border-border`,
            children: [
              insights.isGrowthPositive ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 14 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { size: 14 }),
              t("analytics.today_vs_yesterday"),
              ":",
              " ",
              Math.abs(Number(insights.growth)),
              "%",
              " ",
              insights.isGrowthPositive ? t("analytics.increase") : t("analytics.decrease")
            ]
          }
        ),
        lowStockItems.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 py-2 rounded-xl flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase bg-muted text-foreground border border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 14 }),
          t("analytics.low_on"),
          " ",
          lowStockItems.length,
          " ",
          t("analytics.products")
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col relative overflow-hidden group border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 20 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: "outline",
              className: "text-[9px] font-bold uppercase tracking-widest",
              children: t(`analytics.${period}`)
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1", children: t("common.sales") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-bold tracking-tight text-foreground", children: [
          t("common.etb"),
          " ",
          (data?.summary?.totalRevenue || 0).toLocaleString()
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col relative overflow-hidden group border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 20 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: "outline",
              className: "text-[9px] font-bold uppercase tracking-widest",
              children: t(`analytics.${period}`)
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1", children: t("common.profit") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-bold tracking-tight text-foreground", children: [
          t("common.etb"),
          " ",
          (data?.summary?.totalProfit || 0).toLocaleString()
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col relative overflow-hidden group border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Briefcase, { size: 20 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: "outline",
              className: "text-[9px] font-bold uppercase tracking-widest",
              children: t(`analytics.${period}`)
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1", children: t("analytics.expenses_today").replace(
          "Today",
          t(`analytics.${period}`)
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-bold tracking-tight text-foreground", children: [
          t("common.etb"),
          " ",
          (data?.summary?.totalExpenses || 0).toLocaleString()
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col relative overflow-hidden group border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3 relative z-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 20 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: "outline",
              className: "text-[9px] font-bold uppercase tracking-widest",
              children: t(`analytics.${period}`)
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1 relative z-10", children: t("analytics.net_today").replace(
          "Today",
          t(`analytics.${period}`)
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-bold tracking-tight text-foreground relative z-10", children: [
          t("common.etb"),
          " ",
          (data?.summary?.netProfit || 0).toLocaleString()
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm border-border bg-gradient-to-t from-primary/5 to-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted text-foreground rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartPie, { size: 20 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold tracking-tight text-foreground", children: t("analytics.payment_methods") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: paymentMethodBreakdown.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center text-center text-muted-foreground py-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChartPie, { size: 24, className: "mb-2 opacity-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-wider", children: t("analytics.no_sales_data") })
      ] }) : paymentMethodBreakdown.map((pm, i) => {
        const isPredominant = i === 0 && pm.percentage > 50;
        const icon = pm.method === "Cash" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { size: 14 }) : pm.method === "Transfer" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRightLeft, { size: 14 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { size: 14 });
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: `p-1 rounded-lg ${isPredominant ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`,
                  children: icon
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: `text-xs font-bold ${isPredominant ? "text-foreground" : "text-muted-foreground"}`,
                  children: pm.method
                }
              ),
              isPredominant && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold uppercase text-primary tracking-wider", children: t("analytics.most_used") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "span",
                {
                  className: `text-xs font-bold ${isPredominant ? "text-foreground" : ""}`,
                  children: [
                    t("common.etb"),
                    " ",
                    pm.amount.toLocaleString()
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold text-muted-foreground ml-2", children: [
                "(",
                pm.percentage.toFixed(1),
                "%)"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-2 bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `h-full rounded-full transition-all duration-500 ${isPredominant ? "bg-primary" : "bg-muted-foreground/30"}`,
              style: { width: `${pm.percentage}%` }
            }
          ) })
        ] }, pm.method);
      }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 md:p-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold tracking-tight text-foreground", children: t("analytics.sales_trend") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[10px] uppercase font-bold tracking-wider", children: t("analytics.performance_over_time") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1 h-1 rounded-full bg-muted-foreground/30" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-bold text-primary uppercase tracking-wider", children: formattedRange })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-foreground uppercase tracking-wider", children: t("common.sales") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-muted-foreground uppercase tracking-wider", children: t("common.profit") })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-h-[300px] w-full", children: chartData.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 32, className: "mb-2 opacity-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest", children: t("analytics.no_sales_data") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] mt-1 opacity-60", children: t("analytics.no_trend") })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        AreaChart,
        {
          data: chartData,
          margin: { top: 10, right: 10, left: -20, bottom: 0 },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("defs", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "colorSales", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "stop",
                  {
                    offset: "5%",
                    stopColor: "var(--foreground)",
                    stopOpacity: 0.1
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "stop",
                  {
                    offset: "95%",
                    stopColor: "var(--foreground)",
                    stopOpacity: 0
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "linearGradient",
                {
                  id: "colorProfit",
                  x1: "0",
                  y1: "0",
                  x2: "0",
                  y2: "1",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "stop",
                      {
                        offset: "5%",
                        stopColor: "var(--muted-foreground)",
                        stopOpacity: 0.15
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "stop",
                      {
                        offset: "95%",
                        stopColor: "var(--muted-foreground)",
                        stopOpacity: 0
                      }
                    )
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              CartesianGrid,
              {
                strokeDasharray: "3 3",
                vertical: false,
                stroke: "var(--border)"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              XAxis,
              {
                dataKey: "name",
                axisLine: false,
                tickLine: false,
                tick: {
                  fontSize: 9,
                  fill: "var(--muted-foreground)",
                  fontWeight: 700
                },
                dy: 10
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              YAxis,
              {
                axisLine: false,
                tickLine: false,
                tick: {
                  fontSize: 9,
                  fill: "var(--muted-foreground)",
                  fontWeight: 700
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Tooltip,
              {
                contentStyle: {
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
                },
                itemStyle: {
                  color: "var(--foreground)",
                  fontSize: "12px",
                  fontWeight: 700
                },
                labelStyle: {
                  color: "var(--muted-foreground)",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  marginBottom: "6px"
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Area,
              {
                type: "monotone",
                dataKey: "revenue",
                name: t("common.sales"),
                stroke: "var(--foreground)",
                fillOpacity: 1,
                fill: "url(#colorSales)",
                strokeWidth: 3
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Area,
              {
                type: "monotone",
                dataKey: "profit",
                name: t("common.profit"),
                stroke: "var(--muted-foreground)",
                fillOpacity: 1,
                fill: "url(#colorProfit)",
                strokeWidth: 2
              }
            )
          ]
        }
      ) }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col justify-between relative overflow-hidden border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 md:p-8 flex flex-col h-full justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted text-foreground rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { size: 20 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold tracking-tight text-foreground", children: t("analytics.debt_summary") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[10px] uppercase font-bold tracking-wider mt-0.5", children: t("analytics.critical_metrics") })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { size: 12, className: "text-foreground" }),
                t("analytics.customers_owe")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-3xl font-bold tracking-tight text-foreground", children: [
                t("common.etb"),
                " ",
                (dashboardStats?.activeDebts || 0).toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px w-full bg-border" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TrendingDown,
                  {
                    size: 12,
                    className: "text-muted-foreground"
                  }
                ),
                t("analytics.you_owe")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-3xl font-bold tracking-tight text-muted-foreground", children: [
                t("common.etb"),
                " 0"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 p-4 bg-muted rounded-2xl border border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1", children: t("analytics.inventory_value") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-base font-bold text-foreground", children: [
            t("common.etb"),
            " ",
            inventoryValue.toLocaleString()
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col h-full border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 flex flex-col h-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted text-foreground rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { size: 20 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold tracking-tight uppercase tracking-wider text-foreground", children: t("analytics.inventory_status") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar max-h-[300px]", children: lowStockItems.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 24, className: "mb-2 opacity-20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-wider", children: t("analytics.all_healthy") })
        ] }) : lowStockItems.slice(0, 15).map((item, i) => {
          const isOut = item.totalBaseQuantity <= 0;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: `w-1.5 h-1.5 rounded-full ${isOut ? "bg-foreground" : "bg-muted-foreground"}`
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold truncate max-w-[150px] text-foreground", children: item.name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground", children: [
                      item.totalBaseQuantity,
                      " ",
                      t("analytics.left_in_stock")
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Badge,
                  {
                    variant: "outline",
                    className: `text-[9px] font-bold bg-muted text-foreground border-border`,
                    children: isOut ? t("analytics.out") : t("analytics.low")
                  }
                )
              ]
            },
            i
          );
        }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col border-border bg-gradient-to-t from-primary/5 to-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 md:p-8 flex flex-col h-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted text-foreground rounded-xl", children: period === "today" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 20 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 20 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold tracking-tight text-foreground", children: salesDistribution.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[10px] uppercase font-bold tracking-wider mt-0.5", children: salesDistribution.subtitle })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-h-[250px] w-full", children: salesDistribution.data.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { size: 32, className: "mb-2 opacity-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest", children: t("analytics.no_sales_data") })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        BarChart,
        {
          data: salesDistribution.data,
          margin: { top: 10, right: 10, left: -20, bottom: 0 },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "colorDist", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "5%", stopColor: "var(--primary)", stopOpacity: 0.9 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "95%", stopColor: "var(--primary)", stopOpacity: 0.3 })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "var(--border)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              XAxis,
              {
                dataKey: salesDistribution.dataKey,
                axisLine: false,
                tickLine: false,
                tick: { fontSize: 9, fill: "var(--muted-foreground)", fontWeight: 700 },
                dy: 10,
                interval: salesDistribution.data.length > 12 ? 2 : 0
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              YAxis,
              {
                axisLine: false,
                tickLine: false,
                tick: { fontSize: 9, fill: "var(--muted-foreground)", fontWeight: 700 }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Tooltip,
              {
                contentStyle: {
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
                },
                itemStyle: { color: "var(--foreground)", fontSize: "12px", fontWeight: 700 },
                labelStyle: {
                  color: "var(--muted-foreground)",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  marginBottom: "6px"
                },
                formatter: (value) => [`${t("common.etb")} ${(value ?? 0).toLocaleString()}`, t("analytics.revenue")]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "revenue", name: t("analytics.revenue"), fill: "url(#colorDist)", radius: [4, 4, 0, 0], maxBarSize: 30 })
          ]
        }
      ) }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 flex flex-col h-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted text-foreground rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 20 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold tracking-tight uppercase tracking-wider text-foreground", children: t("analytics.top_products") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-[9px] font-bold", children: formattedRange })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar max-h-[400px]", children: (data?.topItems || []).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Boxes, { size: 24, className: "mb-2 opacity-20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-wider", children: t("analytics.no_sales_data") })
        ] }) : (data?.topItems || []).slice(0, 8).map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors border border-border", children: [
            "#",
            i + 1
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold truncate text-foreground", children: item.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground", children: [
              item.totalQty,
              " ",
              t("analytics.units_sold")
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold text-foreground", children: [
            t("common.etb"),
            " ",
            item.totalRevenue.toLocaleString()
          ] }) })
        ] }, i)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 flex flex-col h-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted text-foreground rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 20 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold tracking-tight uppercase tracking-wider text-foreground", children: t("analytics.recent_activity") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-[9px] font-bold", children: formattedRange })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto space-y-0 pr-2 custom-scrollbar max-h-[400px]", children: recentActivity.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { size: 24, className: "mb-2 opacity-20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-wider", children: t("analytics.no_activity") })
        ] }) : recentActivity.map((activity, i) => {
          const isSale = activity.type === "sale";
          const isExpense = activity.type === "expense";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex gap-4 py-3 border-b border-border last:border-0",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: `mt-0.5 p-1.5 rounded-lg h-fit bg-muted text-foreground`,
                    children: isSale ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 12 }) : isExpense ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { size: 12 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { size: 12 })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-0.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold truncate max-w-[140px] capitalize text-foreground", children: t("dashboard." + activity.type) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "span",
                      {
                        className: `text-xs font-bold text-foreground`,
                        children: [
                          isSale ? "+" : "-",
                          t("common.etb"),
                          " ",
                          activity.amount.toLocaleString()
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground line-clamp-1", children: activity.description || activity.extra || t("analytics.system_update") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[8px] font-medium text-muted-foreground mt-0.5", children: [
                    formatTime(activity.date),
                    " ",
                    "· ",
                    formatDate(activity.date)
                  ] })
                ] })
              ]
            },
            i
          );
        }) })
      ] }) })
    ] })
  ] }) });
};
export {
  Analytics as default
};
