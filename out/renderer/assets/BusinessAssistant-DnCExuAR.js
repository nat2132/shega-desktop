import { c as createLucideIcon, d as useNavigate, b as useSettings, r as reactExports, j as jsxRuntimeExports, aA as Sparkles, i as Badge, e as Button, R as RefreshCw, L as LoaderCircle, T as TriangleAlert, k as Clock, n as Truck, au as Users, an as ChartColumn, b0 as PiggyBank, ab as TrendingDown, P as Package, aX as ArrowRight } from "./index-BcwudWUj.js";
import { A as Alert, a as AlertDescription, L as Lightbulb } from "./alert-MBWTmhU1.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from "./card-9E0A8T1M.js";
import { Z as Zap } from "./zap-5PtaI4ct.js";
import { D as DollarSign } from "./dollar-sign-BgllAvTM.js";
import { C as CalendarDays } from "./calendar-days-Bkyrlr_G.js";
import { A as Activity } from "./activity-vy-udaQQ.js";
import { T as TrendingUp } from "./trending-up-dKgiNxJ3.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const CalendarRange = createLucideIcon("CalendarRange", [
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["path", { d: "M3 10h18", key: "8toen8" }],
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M17 14h-6", key: "bkmgh3" }],
  ["path", { d: "M13 18H7", key: "bb0bb7" }],
  ["path", { d: "M7 14h.01", key: "1qa3f1" }],
  ["path", { d: "M17 18h.01", key: "1bdyru" }]
]);
const INSIGHT_CONFIG = {
  low_stock: { icon: Package, gradient: "from-amber-500/20 to-amber-600/10" },
  out_of_stock: { icon: TriangleAlert, gradient: "from-red-500/20 to-red-600/10" },
  best_sellers: { icon: TrendingUp, gradient: "from-green-500/20 to-green-600/10" },
  top_profit: { icon: DollarSign, gradient: "from-emerald-500/20 to-emerald-600/10" },
  slow_moving: { icon: Activity, gradient: "from-orange-500/20 to-orange-600/10" },
  overstocked: { icon: Package, gradient: "from-blue-500/20 to-blue-600/10" },
  expense_increase: { icon: TrendingDown, gradient: "from-red-500/20 to-red-600/10" },
  budget_overrun: { icon: PiggyBank, gradient: "from-rose-500/20 to-rose-600/10" },
  sales_decline: { icon: ChartColumn, gradient: "from-red-500/20 to-red-600/10" },
  top_customers: { icon: Users, gradient: "from-purple-500/20 to-purple-600/10" },
  supplier_performance: { icon: Truck, gradient: "from-orange-500/20 to-orange-600/10" },
  daily_summary: { icon: Clock, gradient: "from-sky-500/20 to-sky-600/10" },
  weekly_summary: { icon: CalendarDays, gradient: "from-indigo-500/20 to-indigo-600/10" },
  monthly_summary: { icon: CalendarRange, gradient: "from-violet-500/20 to-violet-600/10" },
  profit_suggestion: { icon: Lightbulb, gradient: "from-yellow-500/20 to-yellow-600/10" },
  cash_flow: { icon: DollarSign, gradient: "from-teal-500/20 to-teal-600/10" },
  seasonal_trend: { icon: Zap, gradient: "from-cyan-500/20 to-cyan-600/10" }
};
const SEVERITY_BADGE = {
  critical: { variant: "destructive", labelKey: "business_assistant.severity_critical" },
  warning: { variant: "default", labelKey: "business_assistant.severity_warning" },
  success: { variant: "secondary", labelKey: "business_assistant.severity_insight" },
  info: { variant: "outline", labelKey: "business_assistant.severity_info" }
};
function BusinessAssistant() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const [insights, setInsights] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.api?.getBusinessInsights() || [];
      setInsights(data);
    } catch (e) {
      setError(e.message || "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    loadInsights();
  }, []);
  const criticalCount = insights.filter((i) => i.severity === "critical").length;
  const warningCount = insights.filter((i) => i.severity === "warning").length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-2 border-primary/10 shadow-lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: t("business_assistant.title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-black uppercase tracking-widest", children: t("business_assistant.subtitle") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        criticalCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "destructive", className: "text-xs px-1.5 h-5", children: t("business_assistant.critical_count", "{count} critical").replace("{count}", String(criticalCount)) }),
        warningCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "default", className: "text-xs px-1.5 h-5 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30", children: t("business_assistant.alerts_count", "{count} alerts").replace("{count}", String(warningCount)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: loadInsights, disabled: loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-3.5 w-3.5 ${loading ? "animate-spin" : ""}` }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" }) }) : error ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDescription, { children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: loadInsights, className: "mt-2 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3 w-3 mr-1" }),
        " ",
        t("business_assistant.retry")
      ] })
    ] }) : insights.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-10 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-8 w-8 mb-3 opacity-30" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: t("business_assistant.no_insights") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs mt-1", children: t("business_assistant.no_insights_desc") })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: insights.map((insight, idx) => {
      const cfg = INSIGHT_CONFIG[insight.type] || { icon: Sparkles, gradient: "from-primary/10 to-primary/5" };
      const badge = SEVERITY_BADGE[insight.severity] || SEVERITY_BADGE.info;
      const Icon = cfg.icon;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `group relative p-4 rounded-xl border bg-gradient-to-br ${cfg.gradient} hover:shadow-md transition-all cursor-pointer`,
          onClick: () => {
            if (insight.action?.route) {
              navigate(insight.action.route);
            }
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 rounded-lg bg-background/80 flex items-center justify-center shrink-0 mt-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 text-foreground" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold truncate", children: insight.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: badge.variant, className: "text-xs h-4 px-1 shrink-0", children: t(badge.labelKey) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: insight.message }),
              insight.action && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity", children: [
                insight.action.label,
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3" })
              ] })
            ] })
          ] })
        },
        idx
      );
    }) }) })
  ] });
}
export {
  BusinessAssistant as B
};
