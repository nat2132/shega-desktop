import { c as createLucideIcon, r as reactExports, u as useControllableState, j as jsxRuntimeExports, P as Primitive, a as composeEventHandlers, b as createContextScope, d as createRovingFocusGroupScope, e as useDirection, R as Root$1, I as Item, f as useNotifications, g as useSettings, h as useNavigate, B as Bell, i as Button, E as ExternalLink, X, C as CircleCheck, k as Info, l as CircleAlert, T as TriangleAlert, S as Sparkles, m as Badge, n as RefreshCw, L as LoaderCircle, o as Clock, p as Truck, U as Users, q as ChartColumn, s as Package, A as ArrowRight, t as LayoutDashboard, v as Building2, w as ShoppingCart, x as Plus, y as Trash2, z as Lock, K as KeyRound, D as Check, F as Archive, M as Modal, G as Input, H as toast, J as cva, N as cn, O as useAuth, Q as useLocation, V as toEthiopianDate, W as getEthiopianMonthName, Y as motion, Z as BusinessSwitcher, _ as resolveAvatar, $ as getEthiopianDayName } from "./index-CqMtuUke.js";
import { u as useDataChangedRefresh } from "./useDataChangedRefresh-BQRADQai.js";
import { S as SectionCards } from "./section-cards-CGnkT6UE.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent, d as CardDescription, e as CardAction } from "./card-B5B59TB7.js";
import { A as Alert, a as AlertDescription, L as Lightbulb, B as BusinessHealthScore } from "./BusinessHealthScore-Cvi0Ndrb.js";
import { Z as Zap } from "./zap-D34YHcWw.js";
import { D as DollarSign } from "./dollar-sign-BqR9HoKF.js";
import { C as CalendarRange } from "./calendar-range-Zd-YY3xE.js";
import { C as CalendarDays } from "./calendar-days-B3irc6BF.js";
import { A as Activity, C as ChartContainer, B as BarChart, a as CartesianGrid, X as XAxis, Y as YAxis, b as ChartTooltip, c as ChartTooltipContent, d as Bar, e as Cell } from "./chart-BVBkvXun.js";
import { T as TrendingUp } from "./trending-up-Co1HEDW7.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-D1HMu340.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-DbRJaTXm.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-DPg8ap4S.js";
import { S as Store } from "./store-BKu7DJ5M.js";
import { M as MapPin } from "./map-pin-BwYrIVBL.js";
import { S as Smartphone } from "./smartphone-CtjJ4yya.js";
import { C as CircleDollarSign } from "./circle-dollar-sign-DYjd5ZpJ.js";
import { C as Coins } from "./coins-pdMwXpG6.js";
import { P as PackageSearch } from "./package-search-ClUV3gCY.js";
import { P as Pen } from "./pen-KoTERSfy.js";
import { P as Pencil } from "./pencil-CNZngZY-.js";
import { L as LockOpen, P as Power } from "./power-8h65h-BC.js";
import { Q as QrCode } from "./qr-code-CarCfy_m.js";
import { B as Ban } from "./ban-ChGc2Bld.js";
import "./kpi-visibility-Cnq1TnVQ.js";
import "./circle-check-big-B-nfalbZ.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Link2 = createLucideIcon("Link2", [
  ["path", { d: "M9 17H7A5 5 0 0 1 7 7h2", key: "8i5ue5" }],
  ["path", { d: "M15 7h2a5 5 0 1 1 0 10h-2", key: "1b9ql8" }],
  ["line", { x1: "8", x2: "16", y1: "12", y2: "12", key: "1jonct" }]
]);
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Star = createLucideIcon("Star", [
  [
    "path",
    {
      d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
      key: "r04s7s"
    }
  ]
]);
var __defProp$1 = Object.defineProperty;
var __name$1 = (target, value) => __defProp$1(target, "name", { value, configurable: true });
var NAME = "Toggle";
var Toggle$1 = /* @__PURE__ */ reactExports.forwardRef(
  /* @__PURE__ */ __name$1(function Toggle2(props, forwardedRef) {
    const { pressed: pressedProp, defaultPressed, onPressedChange, ...buttonProps } = props;
    const [pressed, setPressed] = useControllableState({
      prop: pressedProp,
      onChange: onPressedChange,
      defaultProp: defaultPressed ?? false,
      caller: NAME
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.button,
      {
        type: "button",
        "aria-pressed": pressed,
        "data-state": pressed ? "on" : "off",
        "data-disabled": props.disabled ? "" : void 0,
        ...buttonProps,
        ref: forwardedRef,
        onClick: composeEventHandlers(props.onClick, () => {
          if (!props.disabled) {
            setPressed(!pressed);
          }
        })
      }
    );
  }, "Toggle")
);
var Root = Toggle$1;
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var TOGGLE_GROUP_NAME = "ToggleGroup";
var [createToggleGroupContext, createToggleGroupScope] = createContextScope(TOGGLE_GROUP_NAME, [
  createRovingFocusGroupScope
]);
var useRovingFocusGroupScope = createRovingFocusGroupScope();
var ToggleGroup$1 = /* @__PURE__ */ reactExports.forwardRef(/* @__PURE__ */ __name(function ToggleGroup2(props, forwardedRef) {
  const { type, ...toggleGroupProps } = props;
  if (type === "single") {
    const singleProps = toggleGroupProps;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleGroupImplSingle, { role: "radiogroup", ...singleProps, ref: forwardedRef });
  }
  if (type === "multiple") {
    const multipleProps = toggleGroupProps;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleGroupImplMultiple, { role: "toolbar", ...multipleProps, ref: forwardedRef });
  }
  throw new Error(`Missing prop \`type\` expected on \`${TOGGLE_GROUP_NAME}\``);
}, "ToggleGroup"));
var [ToggleGroupValueProvider, useToggleGroupValueContext] = createToggleGroupContext(TOGGLE_GROUP_NAME);
var ToggleGroupImplSingle = /* @__PURE__ */ reactExports.forwardRef(/* @__PURE__ */ __name(function ToggleGroupImplSingle2(props, forwardedRef) {
  const {
    value: valueProp,
    defaultValue,
    onValueChange = /* @__PURE__ */ __name(() => {
    }, "onValueChange"),
    ...toggleGroupSingleProps
  } = props;
  const [value, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue ?? "",
    onChange: onValueChange,
    caller: TOGGLE_GROUP_NAME
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ToggleGroupValueProvider,
    {
      scope: props.__scopeToggleGroup,
      type: "single",
      value: reactExports.useMemo(() => value ? [value] : [], [value]),
      onItemActivate: setValue,
      onItemDeactivate: reactExports.useCallback(() => setValue(""), [setValue]),
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleGroupImpl, { ...toggleGroupSingleProps, ref: forwardedRef })
    }
  );
}, "ToggleGroupImplSingle"));
var ToggleGroupImplMultiple = /* @__PURE__ */ reactExports.forwardRef(/* @__PURE__ */ __name(function ToggleGroupImplMultiple2(props, forwardedRef) {
  const {
    value: valueProp,
    defaultValue,
    onValueChange = /* @__PURE__ */ __name(() => {
    }, "onValueChange"),
    ...toggleGroupMultipleProps
  } = props;
  const [value, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue ?? [],
    onChange: onValueChange,
    caller: TOGGLE_GROUP_NAME
  });
  const handleButtonActivate = reactExports.useCallback(
    (itemValue) => setValue((prevValue = []) => [...prevValue, itemValue]),
    [setValue]
  );
  const handleButtonDeactivate = reactExports.useCallback(
    (itemValue) => setValue((prevValue = []) => prevValue.filter((value2) => value2 !== itemValue)),
    [setValue]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ToggleGroupValueProvider,
    {
      scope: props.__scopeToggleGroup,
      type: "multiple",
      value,
      onItemActivate: handleButtonActivate,
      onItemDeactivate: handleButtonDeactivate,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleGroupImpl, { ...toggleGroupMultipleProps, ref: forwardedRef })
    }
  );
}, "ToggleGroupImplMultiple"));
var [ToggleGroupContext$1, useToggleGroupContext] = createToggleGroupContext(TOGGLE_GROUP_NAME);
var ToggleGroupImpl = /* @__PURE__ */ reactExports.forwardRef(
  // blank line to reduce diff noise
  /* @__PURE__ */ __name(function ToggleGroupImpl2(props, forwardedRef) {
    const {
      __scopeToggleGroup,
      disabled = false,
      rovingFocus = true,
      orientation,
      dir,
      loop = true,
      ...toggleGroupProps
    } = props;
    const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeToggleGroup);
    const direction = useDirection(dir);
    const commonProps = { dir: direction, ...toggleGroupProps };
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleGroupContext$1, { scope: __scopeToggleGroup, rovingFocus, disabled, children: rovingFocus ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      Root$1,
      {
        asChild: true,
        ...rovingFocusGroupScope,
        orientation,
        dir: direction,
        loop,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Primitive.div, { ...commonProps, ref: forwardedRef })
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(Primitive.div, { ...commonProps, ref: forwardedRef }) });
  }, "ToggleGroupImpl")
);
var ITEM_NAME = "ToggleGroupItem";
var ToggleGroupItem$1 = /* @__PURE__ */ reactExports.forwardRef(
  // blank line to reduce diff noise
  /* @__PURE__ */ __name(function ToggleGroupItem2(props, forwardedRef) {
    const valueContext = useToggleGroupValueContext(ITEM_NAME, props.__scopeToggleGroup);
    const context = useToggleGroupContext(ITEM_NAME, props.__scopeToggleGroup);
    const rovingFocusGroupScope = useRovingFocusGroupScope(props.__scopeToggleGroup);
    const pressed = valueContext.value.includes(props.value);
    const disabled = context.disabled || props.disabled;
    const commonProps = { ...props, pressed, disabled };
    const ref = reactExports.useRef(null);
    return context.rovingFocus ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      Item,
      {
        asChild: true,
        ...rovingFocusGroupScope,
        focusable: !disabled,
        active: pressed,
        ref,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleGroupItemImpl, { ...commonProps, ref: forwardedRef })
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleGroupItemImpl, { ...commonProps, ref: forwardedRef });
  }, "ToggleGroupItem")
);
var ToggleGroupItemImpl = /* @__PURE__ */ reactExports.forwardRef(
  // blank line to reduce diff noise
  /* @__PURE__ */ __name(function ToggleGroupItemImpl2(props, forwardedRef) {
    const { __scopeToggleGroup, value, ...itemProps } = props;
    const valueContext = useToggleGroupValueContext(ITEM_NAME, __scopeToggleGroup);
    const singleProps = { role: "radio", "aria-checked": props.pressed, "aria-pressed": void 0 };
    const typeProps = valueContext.type === "single" ? singleProps : void 0;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Toggle$1,
      {
        ...typeProps,
        ...itemProps,
        ref: forwardedRef,
        onPressedChange: (pressed) => {
          if (pressed) {
            valueContext.onItemActivate(value);
          } else {
            valueContext.onItemDeactivate(value);
          }
        }
      }
    );
  }, "ToggleGroupItemImpl")
);
const SEVERITY_STYLES = {
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-5 w-5 text-amber-600" }) },
  error: { bg: "bg-red-500/10", border: "border-red-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-5 w-5 text-red-600" }) },
  info: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-5 w-5 text-blue-600" }) },
  success: { bg: "bg-green-500/10", border: "border-green-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-5 w-5 text-green-600" }) }
};
const DashboardAlerts = ({ maxItems = 6, showHeader = true }) => {
  const { dashboardAlerts, dismissAlert } = useNotifications();
  const { t } = useSettings();
  const navigate = useNavigate();
  if (dashboardAlerts.length === 0) return null;
  const visible = dashboardAlerts.slice(0, maxItems);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "@container/card", children: [
    showHeader && /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4" }),
      t("notifications.alerts_title"),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground ml-2", children: [
        dashboardAlerts.length,
        " ",
        t("notifications.alerts_active")
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-2", children: visible.map((a) => {
      const style = SEVERITY_STYLES[a.type] || SEVERITY_STYLES.info;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `flex items-start gap-3 p-3 rounded-lg border ${style.bg} ${style.border}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 mt-0.5", children: style.icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: a.title }),
                a.count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-background/60", children: a.count })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: a.message }),
              a.actionUrl && a.actionLabel && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: () => navigate(a.actionUrl),
                  className: "h-6 mt-2 text-xs",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3 mr-1" }),
                    a.actionLabel
                  ]
                }
              )
            ] }),
            a.dismissible && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => dismissAlert(a.id),
                className: "h-6 w-6 flex-shrink-0",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
              }
            )
          ]
        },
        a.id
      );
    }) })
  ] });
};
const INSIGHT_CONFIG = {
  low_stock: { icon: Package, gradient: "from-amber-500/20 to-amber-600/10" },
  out_of_stock: { icon: TriangleAlert, gradient: "from-red-500/20 to-red-600/10" },
  best_sellers: { icon: TrendingUp, gradient: "from-green-500/20 to-green-600/10" },
  top_profit: { icon: DollarSign, gradient: "from-emerald-500/20 to-emerald-600/10" },
  slow_moving: { icon: Activity, gradient: "from-orange-500/20 to-orange-600/10" },
  overstocked: { icon: Package, gradient: "from-blue-500/20 to-blue-600/10" },
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
const STATUS_BADGE = {
  active: { label: "Active", cls: "bg-green-500/15 text-green-600" },
  locked: { label: "Locked", cls: "bg-red-500/15 text-red-600" },
  disabled: { label: "Disabled", cls: "bg-gray-500/15 text-gray-500" },
  pending: { label: "Pending", cls: "bg-amber-500/15 text-amber-600" }
};
const fmt = (n) => (n ?? 0).toLocaleString(void 0, { maximumFractionDigits: 2 });
const BusinessCenter = ({ initialTab }) => {
  const { currentBusiness, switchBusiness } = useSettings();
  const [tab, setTab] = reactExports.useState(initialTab || "overview");
  const [registers, setRegisters] = reactExports.useState([]);
  const [locations, setLocations] = reactExports.useState([]);
  const [devices, setDevices] = reactExports.useState([]);
  const [businesses, setBusinesses] = reactExports.useState([]);
  const [roles, setRoles] = reactExports.useState({ builtin: [], order: [], custom: [] });
  const [people, setPeople] = reactExports.useState([]);
  const [access, setAccess] = reactExports.useState({});
  const [loading, setLoading] = reactExports.useState(true);
  const [business, setBusiness] = reactExports.useState(null);
  const [stats, setStats] = reactExports.useState(null);
  const [lowStock, setLowStock] = reactExports.useState([]);
  const [debtSales, setDebtSales] = reactExports.useState([]);
  const [syncInfo, setSyncInfo] = reactExports.useState(null);
  const [cloudInfo, setCloudInfo] = reactExports.useState(null);
  const [showBizModal, setShowBizModal] = reactExports.useState(false);
  const [bizForm, setBizForm] = reactExports.useState({ businessName: "", storeName: "", currency: "ETB" });
  const [archiveTarget, setArchiveTarget] = reactExports.useState(null);
  const [defaultTarget, setDefaultTarget] = reactExports.useState(null);
  const [bizBusy, setBizBusy] = reactExports.useState(false);
  const [showRegModal, setShowRegModal] = reactExports.useState(false);
  const [regForm, setRegForm] = reactExports.useState({ name: "", locationId: "", hasDrawer: false });
  const [editingReg, setEditingReg] = reactExports.useState(null);
  const [deleteTarget, setDeleteTarget] = reactExports.useState(null);
  const [showLocModal, setShowLocModal] = reactExports.useState(false);
  const [locForm, setLocForm] = reactExports.useState({ name: "", address: "" });
  const [renaming, setRenaming] = reactExports.useState(null);
  const [renameValue, setRenameValue] = reactExports.useState("");
  const [replacing, setReplacing] = reactExports.useState(null);
  const [replacementName, setReplacementName] = reactExports.useState("");
  const [replacementPlatform, setReplacementPlatform] = reactExports.useState("desktop");
  const [replacingBusy, setReplacingBusy] = reactExports.useState(false);
  const [pairingInfo, setPairingInfo] = reactExports.useState({ linked: false, email: null, businessName: null });
  const [invites, setInvites] = reactExports.useState([]);
  const [showLinkModal, setShowLinkModal] = reactExports.useState(false);
  const [linkForm, setLinkForm] = reactExports.useState({ email: "", password: "" });
  const [linking, setLinking] = reactExports.useState(false);
  const [showPairModal, setShowPairModal] = reactExports.useState(false);
  const [pairForm, setPairForm] = reactExports.useState({ employeeName: "", role: "cashier", register: "", location: "" });
  const [pairing, setPairing] = reactExports.useState(false);
  const [qrInvite, setQrInvite] = reactExports.useState(null);
  const [now, setNow] = reactExports.useState(Date.now());
  const [deciding, setDeciding] = reactExports.useState(null);
  const [personBusy, setPersonBusy] = reactExports.useState(null);
  const isOwner = access["*"] === true || access["business.manage"] === true;
  const isTeamManager = isOwner || access["team.manage"] === true;
  const pairingRoles = reactExports.useMemo(() => [
    ...(roles.builtin || []).filter((r) => r.key !== "owner"),
    ...roles.custom || []
  ], [roles]);
  const load = async () => {
    setLoading(true);
    try {
      const [regs, locs, devs, rols, ppl, bizs] = await Promise.all([
        window.api.businessListRegisters(),
        window.api.businessListLocations(),
        window.api.businessListDevices(),
        window.api.businessRoles(),
        window.api.businessListPeople(),
        window.api.businessList().catch(() => [])
      ]);
      setRegisters(regs || []);
      setLocations(locs || []);
      setDevices(devs || []);
      setRoles(rols || { builtin: [], order: [], custom: [] });
      setPeople(ppl || []);
      setBusinesses(bizs || []);
    } catch (err) {
      console.error("Failed to load business model", err);
      toast.error("Failed to load business data");
    } finally {
      setLoading(false);
    }
  };
  const loadOverview = async () => {
    try {
      const [biz, statsRes, lowStk, debts, sync, cloud] = await Promise.all([
        window.api.getActiveBusiness().catch(() => null),
        window.api.getDashboardStats().catch(() => null),
        window.api.getLowStockItems().catch(() => []),
        window.api.getDebtSales().catch(() => []),
        window.api.syncStatus().catch(() => null),
        window.api.cloudStatus().catch(() => null)
      ]);
      setBusiness(biz || null);
      setStats(statsRes || null);
      setLowStock(lowStk || []);
      setDebtSales(debts || []);
      setSyncInfo(sync || null);
      setCloudInfo(cloud || null);
    } catch {
    }
  };
  const loadPairing = async () => {
    try {
      const info = await window.api.pairingStatus();
      setPairingInfo(info);
      if (info.linked) void refreshInvites();
    } catch {
    }
  };
  const refreshInvites = async () => {
    try {
      const list = await window.api.pairingList();
      setInvites(list || []);
    } catch (e) {
      toast.error(e?.message || "Failed to load pairing requests");
      setPairingInfo((p) => ({ ...p, linked: false }));
    }
  };
  const linkAccount = async () => {
    if (!linkForm.email.trim() || !linkForm.password) return toast.error("Email and password are required");
    setLinking(true);
    try {
      const info = await window.api.pairingLinkAccount(linkForm.email, linkForm.password);
      setPairingInfo((p) => ({ ...p, linked: true, email: info.email, businessName: info.businessName }));
      setShowLinkModal(false);
      setLinkForm({ email: "", password: "" });
      toast.success("Shega account linked for pairing");
      void refreshInvites();
    } catch (e) {
      toast.error(e?.message || "Link failed — check email and password");
    } finally {
      setLinking(false);
    }
  };
  const openPairModal = (person) => {
    setPairForm({ employeeName: person?.name ?? "", role: person?.roleKey ?? "cashier", register: "", location: "" });
    setShowPairModal(true);
  };
  const issueQr = async () => {
    if (!pairForm.employeeName.trim()) return toast.error("Employee name is required");
    setPairing(true);
    try {
      const res = await window.api.pairingInvite({
        employeeName: pairForm.employeeName.trim(),
        role: pairForm.role,
        register: pairForm.register || void 0,
        location: pairForm.location || void 0
      });
      const qr = await window.api.pairingQrCode(res.qr_uri ?? `shega://join?t=${res.token}`);
      setQrInvite({ id: res.id, code: res.code, expiresAt: res.expires_at, qr, form: { ...pairForm } });
      setShowPairModal(false);
      setPairForm({ employeeName: "", role: "cashier", register: "", location: "" });
      void refreshInvites();
    } catch (e) {
      toast.error(e?.message || "Issue failed — is the Shega account linked?");
    } finally {
      setPairing(false);
    }
  };
  const regenerateQr = async () => {
    if (!qrInvite) return;
    setPairing(true);
    try {
      await window.api.pairingRevoke(qrInvite.id).catch(() => {
      });
      const res = await window.api.pairingInvite({
        employeeName: qrInvite.form.employeeName,
        role: qrInvite.form.role,
        register: qrInvite.form.register || void 0,
        location: qrInvite.form.location || void 0
      });
      const qr = await window.api.pairingQrCode(res.qr_uri ?? `shega://join?t=${res.token}`);
      setQrInvite({ id: res.id, code: res.code, expiresAt: res.expires_at, qr, form: qrInvite.form });
      void refreshInvites();
      toast.success("New invitation issued");
    } catch (e) {
      toast.error(e?.message || "Regenerate failed");
    } finally {
      setPairing(false);
    }
  };
  const revokeQr = async () => {
    if (!qrInvite) return;
    try {
      await window.api.pairingRevoke(qrInvite.id);
      toast.success("Invitation revoked");
      setQrInvite(null);
      void refreshInvites();
    } catch (e) {
      toast.error(e?.message || "Revoke failed");
    }
  };
  const decide = async (id, decision, role, permissions) => {
    setDeciding(id);
    try {
      await window.api.pairingDecide(id, decision, role, permissions);
      toast.success(decision === "approve" ? `Member approved${role ? ` as ${role}` : ""}` : "Request rejected");
      void refreshInvites();
    } catch (e) {
      toast.error(e?.message || `Failed to ${decision} request`);
    } finally {
      setDeciding(null);
    }
  };
  const decideWithRole = (id, name) => {
    const choice = window.prompt(`Assign role for ${name}:

owner — full equal owner
cashier — point of sale access
custom — type a role key (manager, inventory, accountant, reports, warehouse)`, "cashier");
    if (choice === null) return;
    const role = choice.trim().toLowerCase();
    if (!role) return;
    void decide(id, "approve", role);
  };
  const applyRole = async (p, roleKey) => {
    setPersonBusy(p.id);
    try {
      await window.api.businessSetPersonRole(p.id, roleKey);
      toast.success(`${p.name}'s role updated`);
      await load();
    } catch (e) {
      toast.error(e?.message || "Role update failed");
    } finally {
      setPersonBusy(null);
    }
  };
  const changeRole = (p, roleKey) => {
    const wasOwner = p.roleKey === "owner" || !!p.isOwner;
    if (roleKey === "owner" && !wasOwner) {
      if (window.confirm(`${p.name} will become an equal OWNER with full control over the business, team and devices. Continue?`)) {
        void applyRole(p, roleKey);
      }
      return;
    }
    if (wasOwner && roleKey !== "owner") {
      if (window.confirm(`${p.name} will lose OWNER access across all their devices. Continue?`)) {
        void applyRole(p, roleKey);
      }
      return;
    }
    void applyRole(p, roleKey);
  };
  const deactivatePerson = async (p) => {
    const isOwnerPerson = p.roleKey === "owner" || !!p.isOwner;
    if (isOwnerPerson && !window.confirm(`${p.name} is an OWNER. Deactivating removes their access on all their devices. Continue?`)) return;
    setPersonBusy(p.id);
    try {
      await window.api.businessSetPersonActive(p.id, false);
      toast.success(`${p.name} deactivated`);
      await load();
    } catch (e) {
      toast.error(e?.message || "Deactivate failed");
    } finally {
      setPersonBusy(null);
    }
  };
  const approveDevice = async (d) => {
    try {
      await window.api.businessSetDeviceStatus(d.device_id ?? d.id, "active");
      toast.success(`Device ${d.name || d.deviceName || ""} approved`);
      await Promise.all([load(), loadOverview()]);
    } catch (e) {
      toast.error(e?.message || "Failed to approve device");
    }
  };
  reactExports.useEffect(() => {
    load();
    loadOverview();
    window.api.businessCan("*").then((r) => setAccess((a) => ({ ...a, "*": r.allowed }))).catch(() => {
    });
    window.api.businessCan("business.manage").then((r) => setAccess((a) => ({ ...a, "business.manage": r.allowed }))).catch(() => {
    });
    window.api.businessCan("team.manage").then((r) => setAccess((a) => ({ ...a, "team.manage": r.allowed }))).catch(() => {
    });
    loadPairing();
  }, []);
  useDataChangedRefresh(() => {
    load();
    loadOverview();
    loadPairing();
  });
  reactExports.useEffect(() => {
    if (!qrInvite) return;
    const t = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(t);
  }, [qrInvite]);
  const qrRemaining = qrInvite ? Math.max(0, new Date(qrInvite.expiresAt).getTime() - now) : 0;
  const qrMins = Math.floor(qrRemaining / 6e4);
  const qrSecs = Math.floor(qrRemaining % 6e4 / 1e3);
  const kpi = reactExports.useMemo(() => {
    const activeRegs = registers.filter((r) => r.isActive).length;
    const activeDevs = devices.filter((d) => (d.status || "active") === "active").length;
    return [
      { title: "Registers", value: registers.length, sub: `${activeRegs} active` },
      { title: "Locations", value: locations.length, sub: "branches" },
      { title: "Devices", value: devices.length, sub: `${activeDevs} online` },
      { title: "People", value: people.length, sub: `${roles.builtin.length} canonical roles` }
    ];
  }, [registers, locations, devices, people, roles]);
  const openCreateReg = () => {
    setEditingReg(null);
    setRegForm({ name: "", locationId: "", hasDrawer: false });
    setShowRegModal(true);
  };
  const openEditReg = (r) => {
    setEditingReg(r);
    setRegForm({ name: r.name, locationId: r.locationId ? String(r.locationId) : "", hasDrawer: !!r.hasDrawer });
    setShowRegModal(true);
  };
  const saveRegister = async () => {
    if (!regForm.name.trim()) return toast.error("Register name is required");
    try {
      if (editingReg) {
        await window.api.businessUpdateRegister(editingReg.id, {
          name: regForm.name.trim(),
          locationId: regForm.locationId ? Number(regForm.locationId) : null,
          hasDrawer: regForm.hasDrawer
        });
        toast.success("Register updated");
      } else {
        await window.api.businessAddRegister(regForm.name.trim(), regForm.locationId ? Number(regForm.locationId) : void 0);
        toast.success("Register created");
      }
      setShowRegModal(false);
      load();
    } catch (e) {
      toast.error(e?.message || "Failed to save register");
    }
  };
  const deleteRegister = async () => {
    if (!deleteTarget) return;
    await window.api.businessDeleteRegister(deleteTarget.id);
    toast.success("Register removed");
    setDeleteTarget(null);
    load();
  };
  const saveLocation = async () => {
    if (!locForm.name.trim()) return toast.error("Location name is required");
    await window.api.businessAddLocation(locForm.name.trim(), locForm.address || void 0);
    toast.success("Location added");
    setShowLocModal(false);
    setLocForm({ name: "", address: "" });
    load();
  };
  const toggleDeviceStatus = async (d) => {
    const next = (d.status || "active") === "active" ? "locked" : "active";
    await window.api.businessSetDeviceStatus(d.device_id ?? d.id, next);
    toast.success(`Device ${next === "active" ? "unlocked" : "locked"}`);
    load();
  };
  const confirmRename = async () => {
    if (!renaming || !renameValue.trim()) return;
    await window.api.businessRenameDevice(renaming.device_id ?? renaming.id, renameValue.trim());
    toast.success("Device renamed");
    setRenaming(null);
    load();
  };
  const confirmReplace = async () => {
    if (!replacing || !replacementName.trim()) return;
    if (!confirm(`Replace "${replacing.name || replacing.device_id}" with a new device named "${replacementName.trim()}"? The original device will be marked as removed and its user/role/register will move to the new device.`)) return;
    setReplacingBusy(true);
    try {
      await window.api.businessReplaceDevice({
        oldDeviceId: replacing.device_id ?? replacing.id,
        name: replacementName.trim(),
        platform: replacementPlatform,
        setThisAsReplacement: true
      });
      toast.success("Device replaced");
      setReplacing(null);
      setReplacementName("");
      setReplacementPlatform("desktop");
      load();
    } catch (e) {
      toast.error(e?.message || "Replace failed");
    } finally {
      setReplacingBusy(false);
    }
  };
  const createBusiness = async () => {
    if (!bizForm.businessName.trim()) return toast.error("Business name is required");
    setBizBusy(true);
    try {
      const created = await window.api.businessCreate({
        businessName: bizForm.businessName.trim(),
        storeName: bizForm.storeName?.trim() || bizForm.businessName.trim(),
        currency: bizForm.currency || "ETB"
      });
      toast.success(`Business "${created?.businessName}" created`);
      setShowBizModal(false);
      setBizForm({ businessName: "", storeName: "", currency: "ETB" });
      await switchBusiness(created?.id);
      load();
    } catch (e) {
      toast.error(e?.message || "Failed to create business");
    } finally {
      setBizBusy(false);
    }
  };
  const confirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      await window.api.businessArchive(archiveTarget.id);
      toast.success(`Business "${archiveTarget.businessName}" archived`);
      setArchiveTarget(null);
      await Promise.all([load(), switchBusiness(currentBusiness?.id)].filter(Boolean));
    } catch (e) {
      toast.error(e?.message || "Failed to archive business");
    }
  };
  const confirmSetDefault = async () => {
    if (!defaultTarget) return;
    try {
      await window.api.businessSetDefault(defaultTarget.id);
      toast.success(`"${defaultTarget.businessName}" is now the default business`);
      setDefaultTarget(null);
      load();
    } catch (e) {
      toast.error(e?.message || "Failed to set default business");
    }
  };
  const renderField = (label, value) => value === null || value === void 0 || value === "" ? null : /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-foreground/70", children: [
      label,
      ":"
    ] }),
    " ",
    value
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 space-y-6", children: [
    loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-16 text-center text-muted-foreground", children: "Loading business model…" }),
    !loading && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: kpi.map((k) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: k.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold mt-1", children: k.value }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: k.sub })
      ] }) }, k.title)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: tab, onValueChange: (v) => setTab(v), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "overview", className: "gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutDashboard, { className: "h-4 w-4" }),
            " Overview"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "registers", className: "gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Store, { className: "h-4 w-4" }),
            " Registers"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "locations", className: "gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4" }),
            " Locations"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "devices", className: "gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "h-4 w-4" }),
            " Devices"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "team", className: "gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" }),
            " Team"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "businesses", className: "gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-4 w-4" }),
            " Businesses"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "overview", className: "space-y-6 mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 -mt-10 flex items-start gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-8 w-8" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 pt-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold tracking-tight", children: business?.businessName || business?.storeName || "My Business" }),
                  business?.businessCode && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: business.businessCode })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground", children: [
                  business?.currency && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "Currency: ",
                    business.currency
                  ] }),
                  business?.phone && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: business.phone }),
                  business?.email && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: business.email }),
                  business?.address && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: business.address })
                ] })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "h-4 w-4" }),
                " Sales Today"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold mt-1", children: stats?.todaySales ?? 0 }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
                "vs ",
                stats?.yesterdaySales ?? 0,
                " yesterday"
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleDollarSign, { className: "h-4 w-4" }),
                " Revenue Today"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold mt-1", children: fmt(stats?.todayRevenue ?? 0) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
                "vs ",
                fmt(stats?.yesterdayRevenue ?? 0),
                " yesterday"
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4" }),
                " Net Profit Today"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold mt-1", children: fmt(stats?.todayProfit ?? 0) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
                "vs ",
                fmt(stats?.yesterdayProfit ?? 0),
                " yesterday"
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Coins, { className: "h-4 w-4" }),
                " Outstanding Debt"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold mt-1", children: fmt(stats?.activeDebts ?? 0) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
                debtSales.length,
                " open credit sales"
              ] })
            ] }) })
          ] }),
          (() => {
            const pending = devices.filter((d) => (d.status || "") === "pending");
            if (pending.length === 0) return null;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-amber-500/40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5 space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "h-4 w-4 text-amber-500" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-semibold", children: [
                  pending.length,
                  " device",
                  pending.length > 1 ? "s" : "",
                  " awaiting approval"
                ] })
              ] }),
              pending.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-lg border p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: d.name || d.deviceName || "Unnamed device" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                    d.platform || "Device",
                    d.device_id ? ` · ${d.device_id}` : ""
                  ] })
                ] }),
                isOwner && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => approveDevice(d), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 mr-1" }),
                  " Approve"
                ] })
              ] }, d.id ?? d.device_id))
            ] }) });
          })(),
          /* @__PURE__ */ jsxRuntimeExports.jsx(BusinessHealthScore, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex-row items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(PackageSearch, { className: "h-4 w-4" }),
                  " Inventory Health"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", children: [
                  stats?.totalItems ?? 0,
                  " items"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                  lowStock.length,
                  " item",
                  lowStock.length === 1 ? "" : "s",
                  " below reorder point"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-2", children: [
                  lowStock.slice(0, 5).map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate pr-2", children: i.name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-red-500/15 text-red-600", children: [
                      fmt(i.totalBaseQuantity),
                      " left"
                    ] })
                  ] }, i.id)),
                  lowStock.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "No items are running low." })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" }),
                " Team"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-1 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "People" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: people.length })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Canonical roles" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: roles.builtin.length })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Custom roles" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: roles.custom?.length ?? 0 })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Devices" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: devices.length })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4" }),
                " Sync Status"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-2 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "LAN hub" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: syncInfo?.running ? "Running" : "Stopped" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Pending outbox" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: syncInfo?.pendingOutbox ?? 0 })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Connected peers" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: (syncInfo?.peers ?? []).length })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Cloud relay" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: cloudInfo?.ok ? cloudInfo.enabled ? "Enabled" : "Offline" : "Unconfigured" })
                ] }),
                (syncInfo?.conflicts ?? 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-amber-600", children: [
                  syncInfo.conflicts,
                  " conflict(s) detected"
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "registers", className: "space-y-4 mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
              registers.length,
              " registers on the shared model"
            ] }),
            isOwner && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openCreateReg, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
              " Add Register"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [
            registers.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex-row items-start justify-between gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Store, { className: "h-4 w-4" }),
                    " ",
                    r.name
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: r.isActive ? "bg-green-500/15 text-green-600" : "bg-gray-500/15 text-gray-500", children: r.isActive ? "Active" : "Inactive" })
                ] }),
                isOwner && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => openEditReg(r), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { className: "h-4 w-4" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => setDeleteTarget(r), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 text-red-500" }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-1", children: [
                renderField("Location", locations.find((l) => l.id === r.locationId)?.name),
                renderField("Drawer", r.hasDrawer ? "Yes" : "No"),
                renderField("Printer", r.printerName)
              ] })
            ] }, r.id)),
            registers.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground col-span-full", children: "No registers yet." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "locations", className: "space-y-4 mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
              locations.length,
              " locations"
            ] }),
            isOwner && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setShowLocModal(true), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
              " Add Location"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [
            locations.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5 flex items-start gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-5 w-5 text-primary mt-0.5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: l.name }),
                renderField("Address", l.address)
              ] })
            ] }) }, l.id)),
            locations.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground col-span-full", children: "No locations yet." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "devices", className: "space-y-4 mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [
          devices.map((d) => {
            const st = STATUS_BADGE[d.status || "active"] || STATUS_BADGE.active;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5 space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "h-5 w-5 text-primary" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: d.name || d.deviceName || "Unnamed device" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: st.cls, children: st.label })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground space-y-1", children: [
                renderField("Platform", d.platform),
                renderField("Role", d.role),
                renderField("App", d.appVersion),
                renderField("Primary", d.isPrimary ? "Yes" : "No"),
                renderField("ID", d.device_id)
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 pt-2", children: isOwner && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => {
                  setRenaming(d);
                  setRenameValue(d.name || "");
                }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5 mr-1" }),
                  " Rename"
                ] }),
                st.label !== "Removed" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => {
                  setReplacing(d);
                  setReplacementName("");
                  setReplacementPlatform(d.platform || "desktop");
                }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5 mr-1" }),
                  " Replace"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: st.label === "Active" ? "outline" : "secondary", onClick: () => toggleDeviceStatus(d), children: st.label === "Active" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-3.5 w-3.5 mr-1" }),
                  " Lock"
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LockOpen, { className: "h-3.5 w-3.5 mr-1" }),
                  " Unlock"
                ] }) })
              ] }) })
            ] }) }, d.id ?? d.device_id);
          }),
          devices.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground col-span-full", children: "No devices registered yet." })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "team", className: "space-y-4 mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
              people.length,
              " people on the roster",
              pairingInfo.linked && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-muted-foreground/70", children: [
                "· pairing linked as ",
                pairingInfo.email
              ] })
            ] }),
            isTeamManager && pairingInfo.linked && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => openPairModal(), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(QrCode, { className: "h-4 w-4 mr-2" }),
                " Pair Employee"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => refreshInvites(), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4 mr-2" }),
                " Refresh"
              ] })
            ] })
          ] }),
          !pairingInfo.linked && isTeamManager && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-dashed", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5 flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-5 w-5 text-primary shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "Link your Shega account to manage employee pairing" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Employee QR invitations and join approvals are managed from your Shega business account. Link it once here to invite employees by QR and approve their join requests." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setShowLinkModal(true), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "h-4 w-4 mr-2" }),
              " Link account"
            ] })
          ] }) }),
          (() => {
            const pending = invites.filter((i) => i.status === "used" && i.device_status === "pending");
            if (pending.length === 0) return null;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-amber-500/40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5 space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4 text-amber-500" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-semibold", children: [
                  pending.length,
                  " pairing request",
                  pending.length > 1 ? "s" : "",
                  " awaiting approval"
                ] })
              ] }),
              pending.map((inv) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-lg border p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: inv.employee_name || "New employee" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                    inv.role,
                    inv.register ? ` · ${inv.register}` : "",
                    inv.location ? ` · ${inv.location}` : "",
                    inv.device_id ? ` · ${inv.device_id}` : "",
                    inv.device_status ? ` · device ${inv.device_status}` : ""
                  ] })
                ] }),
                isTeamManager && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", disabled: deciding === inv.id, onClick: () => decideWithRole(inv.id, inv.employee_name || "New member"), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5 mr-1" }),
                    " Approve & Assign Role"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "text-red-500 hover:text-red-600", disabled: deciding === inv.id, onClick: () => decide(inv.id, "reject"), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { className: "h-3.5 w-3.5 mr-1" }),
                    " Reject"
                  ] })
                ] })
              ] }, inv.id))
            ] }) });
          })(),
          (() => {
            const issued = invites.filter((i) => i.status === "pending");
            if (issued.length === 0) return null;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5 space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4 text-muted-foreground" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-semibold", children: [
                  issued.length,
                  " invitation",
                  issued.length > 1 ? "s" : "",
                  " waiting to be scanned"
                ] })
              ] }),
              issued.map((inv) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-lg border p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: inv.employee_name || "Unnamed employee" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                    inv.role,
                    inv.register ? ` · ${inv.register}` : "",
                    inv.location ? ` · ${inv.location}` : "",
                    ` · expires ${new Date(inv.expires_at).toLocaleTimeString()}`
                  ] })
                ] }),
                isTeamManager && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", disabled: deciding === inv.id, onClick: () => decide(inv.id, "reject"), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { className: "h-3.5 w-3.5 mr-1" }),
                  " Revoke"
                ] })
              ] }, inv.id))
            ] }) });
          })(),
          (() => {
            const handled = invites.filter((i) => i.status === "used" && i.device_status !== "pending");
            if (handled.length === 0) return null;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5 space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold", children: "Recently handled" }),
              handled.map((inv) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-lg border p-2.5 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium truncate", children: inv.employee_name || "Employee" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
                  inv.device_status === "active" ? "Approved" : "Rejected",
                  inv.accepted_by ? ` by ${inv.accepted_by}` : ""
                ] })
              ] }, inv.id))
            ] }) });
          })(),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex-row items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" }),
                " Team roster"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", children: [
                people.length,
                " active"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: people.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground px-5 py-4", children: "No people on the roster yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y", children: people.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-5 py-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium truncate", children: p.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground truncate", children: p.phone || p.email || "—" })
              ] }),
              isTeamManager && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: p.roleKey, onValueChange: (v) => changeRole(p, v), disabled: personBusy === p.id, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-44", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    roles.builtin.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: r.key, children: r.name }, r.key)),
                    roles.custom?.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: r.id, children: r.name }, r.id))
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", disabled: personBusy === p.id || !pairingInfo.linked, onClick: () => openPairModal(p), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(QrCode, { className: "h-3.5 w-3.5 mr-1" }),
                  " QR Pair"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "ghost", className: "text-red-500 hover:text-red-600", disabled: personBusy === p.id, onClick: () => deactivatePerson(p), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Power, { className: "h-3.5 w-3.5 mr-1" }),
                  " Deactivate"
                ] })
              ] })
            ] }, p.id)) }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "businesses", className: "space-y-4 mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
              businesses.length,
              " business",
              businesses.length === 1 ? "" : "es",
              " on this installation"
            ] }),
            isOwner && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setShowBizModal(true), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
              " New Business"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [
            businesses.map((b) => {
              const isCurrent = currentBusiness?.id === b.id;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: isCurrent ? "ring-1 ring-primary/40" : "", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "flex-row items-start justify-between gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-5 w-5 text-primary" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
                      b.businessName,
                      isCurrent && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: "Active" }),
                      b.isDefault === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-amber-500/15 text-amber-600", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3 w-3 mr-1" }),
                        " Default"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                      b.currency || "ETB",
                      " · created ",
                      String(b.createdAt || "").slice(0, 10)
                    ] })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs text-muted-foreground", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      b.employeeCount ?? 0,
                      " employees"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      b.registerCount ?? 0,
                      " registers"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      b.locationCount ?? 0,
                      " locations"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      b.deviceCount ?? 0,
                      " devices"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2", children: [
                    !isCurrent && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: async () => {
                      await switchBusiness(b.id);
                      load();
                    }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5 mr-1" }),
                      " Switch"
                    ] }),
                    isOwner && b.isDefault !== 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => setDefaultTarget(b), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3.5 w-3.5 mr-1" }),
                      " Set default"
                    ] }),
                    isOwner && !isCurrent && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "text-red-500 hover:text-red-600", onClick: () => setArchiveTarget(b), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Archive, { className: "h-3.5 w-3.5 mr-1" }),
                      " Archive"
                    ] })
                  ] })
                ] })
              ] }, b.id);
            }),
            businesses.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground col-span-full", children: "No businesses yet." })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showRegModal, onClose: () => setShowRegModal(false), title: editingReg ? "Edit Register" : "Add Register", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: regForm.name, onChange: (e) => setRegForm({ ...regForm, name: e.target.value }), placeholder: "Register name" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Location" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: regForm.locationId, onValueChange: (v) => setRegForm({ ...regForm, locationId: v }), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "No location" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: locations.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: String(l.id), children: l.name }, l.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: regForm.hasDrawer, onChange: (e) => setRegForm({ ...regForm, hasDrawer: e.target.checked }) }),
        "Has cash drawer"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full", onClick: saveRegister, children: editingReg ? "Save" : "Create" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showLocModal, onClose: () => setShowLocModal(false), title: "Add Location", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: locForm.name, onChange: (e) => setLocForm({ ...locForm, name: e.target.value }), placeholder: "Location name" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Address" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: locForm.address, onChange: (e) => setLocForm({ ...locForm, address: e.target.value }), placeholder: "Address (optional)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full", onClick: saveLocation, children: "Add" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: !!renaming, onClose: () => setRenaming(null), title: "Rename Device", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: renameValue, onChange: (e) => setRenameValue(e.target.value), placeholder: "Device name", autoFocus: true }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full", onClick: confirmRename, children: "Rename" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: !!replacing, onClose: () => setReplacing(null), title: "Replace Device", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
        "Registering a replacement for ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground/80 font-medium", children: replacing?.name || replacing?.device_id }),
        ". The original device is marked as removed and its user, role and register are carried over to the new device."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: replacementName, onChange: (e) => setReplacementName(e.target.value), placeholder: "New device name", autoFocus: true }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: replacementPlatform, onChange: (e) => setReplacementPlatform(e.target.value), placeholder: "Platform (e.g. desktop, mobile)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full", disabled: replacingBusy, onClick: confirmReplace, children: replacingBusy ? "Replacing…" : "Replace Device" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showBizModal, onClose: () => setShowBizModal(false), title: "Create Business", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Business name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: bizForm.businessName, onChange: (e) => setBizForm({ ...bizForm, businessName: e.target.value }), placeholder: "Legal / business name" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Store name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: bizForm.storeName, onChange: (e) => setBizForm({ ...bizForm, storeName: e.target.value }), placeholder: "Store / branch name" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Currency" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: bizForm.currency, onChange: (e) => setBizForm({ ...bizForm, currency: e.target.value }), placeholder: "ETB" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full", disabled: bizBusy, onClick: createBusiness, children: bizBusy ? "Creating…" : "Create Business" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: !!archiveTarget, onOpenChange: (o) => !o && setArchiveTarget(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Archive business?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
          '"',
          archiveTarget?.businessName,
          '" will be archived (soft-deleted) and hidden. Its data is retained and sync tombstones propagate to other devices. This can be reversed by restoring from the database.'
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: confirmArchive, className: "bg-red-600 hover:bg-red-700", children: "Archive" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: !!defaultTarget, onOpenChange: (o) => !o && setDefaultTarget(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Set default business?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
          '"',
          defaultTarget?.businessName,
          '" will become the default business for new installs and fresh logins. Only platform administrators can change this.'
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: confirmSetDefault, children: "Set default" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: !!deleteTarget, onOpenChange: (o) => !o && setDeleteTarget(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Remove register?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
          'This action cannot be undone. The register "',
          deleteTarget?.name,
          '" will be removed.'
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: deleteRegister, className: "bg-red-600 hover:bg-red-700", children: "Remove" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showLinkModal, onClose: () => setShowLinkModal(false), title: "Link Shega account", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Sign in with the Shega account that owns or manages this business. The credentials are used only to obtain a pairing token, stored locally on this computer." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Email" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: linkForm.email, onChange: (e) => setLinkForm({ ...linkForm, email: e.target.value }), placeholder: "owner@example.com", autoFocus: true })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Password" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", value: linkForm.password, onChange: (e) => setLinkForm({ ...linkForm, password: e.target.value }), placeholder: "Account password" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full", disabled: linking, onClick: linkAccount, children: linking ? "Linking…" : "Link account" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showPairModal, onClose: () => setShowPairModal(false), title: "Pair employee (QR invite)", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Employee name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: pairForm.employeeName, onChange: (e) => setPairForm({ ...pairForm, employeeName: e.target.value }), placeholder: "e.g. Sara Tadesse", autoFocus: true })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Role" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: pairForm.role, onValueChange: (v) => setPairForm({ ...pairForm, role: v }), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: pairingRoles.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: r.key, children: r.name }, r.key)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Register" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: pairForm.register, onValueChange: (v) => setPairForm({ ...pairForm, register: v }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Optional" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: registers.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: r.name, children: r.name }, r.id)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Location" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: pairForm.location, onValueChange: (v) => setPairForm({ ...pairForm, location: v }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Optional" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: locations.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: l.name, children: l.name }, l.id)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full", disabled: pairing, onClick: issueQr, children: pairing ? "Issuing…" : "Generate QR" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: !!qrInvite, onClose: () => setQrInvite(null), title: qrInvite ? `Pair ${qrInvite.form?.employeeName || "employee"} via QR` : "QR invite", children: qrInvite && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto w-fit rounded-lg border bg-white p-3", children: qrInvite.qr ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: qrInvite.qr, alt: "Pairing QR code", className: "h-56 w-56" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-56 w-56 grid place-items-center text-xs text-muted-foreground", children: "Rendering…" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-mono font-bold tracking-[0.3em]", children: qrInvite.code }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "or enter the code manually" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
        "The employee scans this from Shega Mobile (Scan QR & Join) to accept the pairing. Single use — ",
        qrRemaining === 0 ? "expired, regenerate to issue a new code." : `expires in ${qrMins}m ${qrSecs}s`
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "flex-1", disabled: pairing, onClick: regenerateQr, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4 mr-2" }),
          " Regenerate"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "flex-1", variant: "outline", disabled: pairing, onClick: revokeQr, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { className: "h-4 w-4 mr-2" }),
          " Revoke"
        ] })
      ] })
    ] }) })
  ] });
};
const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 outline-none hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground data-[state=on]:font-semibold [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-border bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground"
      },
      size: {
        default: "h-9 px-3 min-w-9",
        sm: "h-8 px-2.5 min-w-8",
        lg: "h-10 px-4 min-w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Toggle = reactExports.forwardRef(({ className, variant, size, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Root,
  {
    ref,
    "data-slot": "toggle",
    className: cn(toggleVariants({ variant, size, className })),
    ...props
  }
));
Toggle.displayName = Root.displayName;
const ToggleGroupContext = reactExports.createContext({
  size: "default",
  variant: "default"
});
function ToggleGroup({
  className,
  variant,
  size,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ToggleGroup$1,
    {
      "data-slot": "toggle-group",
      "data-variant": variant,
      "data-size": size,
      className: cn(
        "group/toggle-group inline-flex items-center rounded-xl bg-muted/40 p-1",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleGroupContext.Provider, { value: { variant, size }, children })
    }
  );
}
function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}) {
  const context = reactExports.useContext(ToggleGroupContext);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ToggleGroupItem$1,
    {
      "data-slot": "toggle-group-item",
      "data-variant": context.variant || variant,
      "data-size": context.size || size,
      className: cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size
        }),
        "rounded-lg data-[state=on]:bg-card data-[state=on]:shadow-sm data-[state=on]:font-semibold",
        className
      ),
      ...props,
      children
    }
  );
}
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06
    }
  }
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.28, 0, 0.22, 1]
    }
  }
};
const Dashboard = () => {
  const { t, formatDate, formatTime, calendarType, language } = useSettings();
  const { currentAdmin } = useAuth();
  const location = useLocation();
  const queryTab = reactExports.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("tab");
  }, [location.search]);
  const [activeTab, setActiveTab] = reactExports.useState(location.pathname === "/business" ? "business" : "dashboard");
  const [stats, setStats] = reactExports.useState(null);
  const [analytics, setAnalytics] = reactExports.useState(null);
  const [empStats, setEmpStats] = reactExports.useState(null);
  const [recentActivity, setRecentActivity] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [revPeriod, setRevPeriod] = reactExports.useState("week");
  const greeting = reactExports.useMemo(() => {
    const hour = (/* @__PURE__ */ new Date()).getHours();
    if (hour < 12) return "good_morning";
    if (hour < 17) return "good_afternoon";
    return "good_evening";
  }, []);
  reactExports.useEffect(() => {
    loadData();
  }, []);
  useDataChangedRefresh(() => {
    loadData();
  });
  reactExports.useEffect(() => {
    window.api?.getAnalytics(revPeriod === "week" ? "month" : revPeriod).then((data) => setAnalytics(data || { salesData: [] }));
  }, [revPeriod]);
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statData, anData, employees, activity] = await Promise.all([
        window.api?.getDashboardStats() || Promise.resolve({}),
        window.api?.getAnalytics("month") || Promise.resolve({ salesData: [], topItems: [] }),
        window.api?.getEmployeeStats() || Promise.resolve(null),
        window.api?.getRecentActivity(10) || Promise.resolve([])
      ]);
      setStats(statData);
      setAnalytics(anData);
      setEmpStats(employees);
      setRecentActivity(activity);
    } catch (e) {
      setError(e.message || t("dashboard.load_error"));
    } finally {
      setLoading(false);
    }
  };
  const revenueChartData = reactExports.useMemo(() => {
    if (!analytics?.salesData) return [];
    const salesData = analytics.salesData;
    if (revPeriod === "week") {
      const now = /* @__PURE__ */ new Date();
      const todayStr = now.toISOString().split("T")[0];
      const sun = new Date(now);
      sun.setDate(now.getDate() - now.getDay());
      sun.setHours(0, 0, 0, 0);
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(sun);
        d.setDate(sun.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        const sale = salesData.find((s) => s.date === dateStr);
        let label;
        if (calendarType === "ethiopian") {
          label = getEthiopianDayName(i, language);
        } else {
          const loc = language === "am" ? "am-ET" : language === "om" ? "om-ET" : language === "ti" ? "ti-ET" : "en-US";
          label = d.toLocaleDateString(loc, { weekday: "short" });
        }
        days.push({ label, revenue: sale?.revenue || 0, isToday: dateStr === todayStr });
      }
      return days;
    }
    if (revPeriod === "month") {
      const now = /* @__PURE__ */ new Date();
      const todayStr = now.toISOString().split("T")[0];
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const weeks = [];
      let ws = new Date(first);
      let wn = 1;
      while (ws <= last && wn <= 5) {
        const we = new Date(ws);
        we.setDate(ws.getDate() + 6);
        if (we > last) we.setTime(last.getTime());
        let rev = 0;
        salesData.forEach((s) => {
          const sd = new Date(s.date);
          if (sd >= ws && sd <= we) rev += s.revenue;
        });
        const weStr = we.toISOString().split("T")[0];
        const wsStr = ws.toISOString().split("T")[0];
        weeks.push({ label: `${t("analytics.week")} ${wn}`, revenue: rev, isToday: todayStr >= wsStr && todayStr <= weStr });
        ws = new Date(we);
        ws.setDate(ws.getDate() + 1);
        wn++;
      }
      return weeks;
    }
    if (calendarType === "ethiopian") {
      const ethNow = toEthiopianDate(/* @__PURE__ */ new Date());
      const months = [];
      for (let m = 1; m <= 13; m++) {
        let rev = 0;
        salesData.forEach((s) => {
          const eth = toEthiopianDate(new Date(s.date));
          if (eth.month === m) rev += s.revenue;
        });
        months.push({ label: getEthiopianMonthName(m - 1, language), revenue: rev, isToday: m === ethNow.month });
      }
      return months;
    } else {
      const now = /* @__PURE__ */ new Date();
      const curMonth = now.getMonth();
      const loc = language === "am" ? "am-ET" : language === "om" ? "om-ET" : language === "ti" ? "ti-ET" : "en-US";
      const months = [];
      for (let m = 0; m < 12; m++) {
        const md = new Date(now.getFullYear(), m, 1);
        let rev = 0;
        salesData.forEach((s) => {
          const sd = new Date(s.date);
          if (sd.getMonth() === m && sd.getFullYear() === now.getFullYear()) rev += s.revenue;
        });
        months.push({ label: md.toLocaleDateString(loc, { month: "short" }), revenue: rev, isToday: m === curMonth });
      }
      return months;
    }
  }, [analytics, revPeriod, calendarType, language]);
  const chartConfig = {
    revenue: { label: t("sales.revenue"), color: "var(--primary)" }
  };
  const kpiCards = reactExports.useMemo(() => [
    {
      title: t("sales.revenue"),
      value: `${t("common.etb")} ${(stats?.todayRevenue || 0).toLocaleString()}`,
      trend: stats?.yesterdayRevenue > 0 ? `${((Number(stats.todayRevenue || 0) - Number(stats.yesterdayRevenue || 0)) / Number(stats.yesterdayRevenue || 0) * 100).toFixed(1)}%` : "0%",
      trendType: Number(stats?.todayRevenue || 0) >= Number(stats?.yesterdayRevenue || 0) ? "up" : "down",
      footerTitle: t("dashboard.today_revenue"),
      footerSub: `${t("dashboard.yesterday")}: ${t("common.etb")} ${(stats?.yesterdayRevenue || 0).toLocaleString()}`
    },
    {
      title: t("sales.profit"),
      value: `${t("common.etb")} ${(stats?.todayProfit || 0).toLocaleString()}`,
      trend: stats?.yesterdayProfit > 0 ? `${((Number(stats.todayProfit || 0) - Number(stats.yesterdayProfit || 0)) / Number(stats.yesterdayProfit || 0) * 100).toFixed(1)}%` : "0%",
      trendType: Number(stats?.todayProfit || 0) >= Number(stats?.yesterdayProfit || 0) ? "up" : "down",
      footerTitle: t("dashboard.gross_profit"),
      footerSub: `${t("dashboard.yesterday")}: ${t("common.etb")} ${(stats?.yesterdayProfit || 0).toLocaleString()}`
    },
    {
      title: t("sales.transactions"),
      value: (stats?.todaySales || 0).toLocaleString(),
      trend: stats?.yesterdaySales > 0 ? `${((Number(stats.todaySales || 0) - Number(stats.yesterdaySales || 0)) / Number(stats.yesterdaySales || 0) * 100).toFixed(1)}%` : "0%",
      trendType: Number(stats?.todaySales || 0) >= Number(stats?.yesterdaySales || 0) ? "up" : "down",
      footerTitle: t("dashboard.units_sold"),
      footerSub: `${t("dashboard.yesterday")}: ${stats?.yesterdaySales || 0}`
    },
    {
      title: t("inventory.low"),
      value: stats?.lowStock || 0,
      trend: stats?.lowStock > 5 ? t("dashboard.trend_high") : t("dashboard.trend_normal"),
      trendType: stats?.lowStock > 5 ? "up" : "down",
      footerTitle: t("dashboard.low_stock"),
      footerSub: t("inventory.refill_needed")
    }
  ], [stats]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    motion.div,
    {
      className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6",
      variants: containerVariants,
      initial: "hidden",
      animate: "visible",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: activeTab, onValueChange: (v) => setActiveTab(v), className: "space-y-4 md:space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { variants: itemVariants, className: "px-4 lg:px-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-xl md:text-2xl font-semibold tracking-tight", children: [
                t(`dashboard.${greeting}`),
                ", ",
                currentAdmin?.name?.split(" ")[0] || "Admin"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground/70 mt-0.5", children: t("dashboard.welcome") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(BusinessSwitcher, { onChanged: loadData }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden md:flex items-center gap-2 text-xs text-muted-foreground/60", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium tabular-nums", children: formatDate(/* @__PURE__ */ new Date(), { weekday: "long", month: "long", day: "numeric", year: "numeric" }) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "mt-4 h-auto rounded-xl p-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "dashboard", className: "gap-2 rounded-lg px-4 py-2 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutDashboard, { className: "h-4 w-4" }),
              " ",
              t("tabs.dashboard")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "business", className: "gap-2 rounded-lg px-4 py-2 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-4 w-4" }),
              " ",
              t("tabs.business")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "dashboard", className: "space-y-4 md:space-y-6", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-muted-foreground" }) }) : error ? /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { variants: itemVariants, className: "px-4 lg:px-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { variant: "destructive", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDescription, { children: error })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: loadData, className: "mt-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4 mr-1" }),
            " ",
            t("common.retry")
          ] })
        ] }) : !stats ? /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { variants: itemVariants, className: "flex flex-col items-center justify-center py-20 text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-12 w-12 mb-4 opacity-20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base font-medium", children: t("common.no_data") })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: itemVariants, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCards, { cards: kpiCards }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: itemVariants, className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardAlerts, {}) }),
          empStats && /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: itemVariants, className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-tutorial-section": "employee-stats", className: "grid grid-cols-2 md:grid-cols-5 gap-3", children: [
            { label: t("dashboard.total_employees"), value: empStats.total || 0, color: "text-foreground" },
            { label: t("common.active"), value: empStats.active || 0, color: "text-emerald-600" },
            { label: t("dashboard.online_now"), value: empStats.online || 0, color: "text-primary" },
            { label: t("dashboard.clocked_in"), value: empStats.clockedIn || 0, color: "text-amber-600" },
            { label: t("common.pending"), value: empStats.pendingApprovals || 0, color: "text-destructive" }
          ].map((item, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border/40 bg-card/50 p-4 space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground/70", children: item.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-2xl font-semibold tracking-tight tabular-nums ${item.color}`, children: item.value })
          ] }, idx)) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { "data-tutorial-section": "business-assistant", variants: itemVariants, className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BusinessAssistant, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: itemVariants, className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-tutorial-section": "revenue-chart", className: "@container/card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("dashboard.revenue_intelligence") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden @[540px]/card:block", children: t("dashboard.performance_analysis") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "@[540px]/card:hidden", children: t("dashboard.performance_analysis") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardAction, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                ToggleGroup,
                {
                  type: "single",
                  value: revPeriod,
                  onValueChange: (v) => v && setRevPeriod(v),
                  className: "*:data-[slot=toggle-group-item]:px-4!",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleGroupItem, { value: "week", children: t("analytics.week") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleGroupItem, { value: "month", children: t("analytics.month") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleGroupItem, { value: "year", children: t("analytics.year") })
                  ]
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "px-2 pt-4 sm:px-6 sm:pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartContainer, { config: chartConfig, className: "aspect-auto h-[250px] w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: revenueChartData, barGap: 4, barCategoryGap: "20%", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { vertical: false, strokeDasharray: "3 3", stroke: "var(--border)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                XAxis,
                {
                  dataKey: "label",
                  tickLine: false,
                  axisLine: false,
                  tickMargin: 8,
                  className: "text-xs"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                YAxis,
                {
                  tickLine: false,
                  axisLine: false,
                  tickFormatter: (v) => (v ?? 0) >= 1e3 ? `${((v ?? 0) / 1e3).toFixed(0)}k` : `${v ?? 0}`,
                  width: 40,
                  className: "text-xs"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ChartTooltip,
                {
                  cursor: { fill: "var(--muted)", opacity: 0.3 },
                  content: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltipContent, { indicator: "dot" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Bar,
                {
                  dataKey: "revenue",
                  radius: [8, 8, 0, 0],
                  maxBarSize: 48,
                  children: revenueChartData.map((entry, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Cell,
                    {
                      fill: entry.isToday ? "var(--primary)" : "var(--primary)",
                      opacity: entry.isToday ? 1 : 0.3
                    },
                    idx
                  ))
                }
              )
            ] }) }) })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: itemVariants, className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-tutorial-section": "recent-activity", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("analytics.recent_activity") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: t("dashboard.recent_activity_desc", "Latest actions across your team") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: recentActivity.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { size: 24, className: "mb-2 opacity-20" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-wider", children: t("analytics.no_activity") })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-y-auto pr-2 custom-scrollbar max-h-[400px]", children: recentActivity.map((activity, i) => {
              const isSale = activity.type === "sale";
              const isMoney = isSale;
              const isClock = activity.type === "clock_in" || activity.type === "clock_out";
              const typeKey = isClock ? `employees.${activity.type}` : `dashboard.${activity.type}`;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 py-3 border-b border-border last:border-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative mt-0.5 h-fit", children: (isSale || activity.type === "adjustment") && activity.itemImage ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "img",
                    {
                      src: activity.itemImage,
                      alt: activity.description || "Product",
                      className: "h-8 w-8 rounded-lg object-cover ring-1 ring-border"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted text-foreground ring-1 ring-border",
                      children: isSale ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 9 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { size: 9 })
                    }
                  )
                ] }) : activity.userAvatar ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "img",
                    {
                      src: resolveAvatar(activity.userAvatar),
                      alt: activity.userName || "User",
                      className: "h-8 w-8 rounded-full object-cover"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted text-foreground ring-1 ring-border",
                      children: isSale ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 9 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { size: 9 })
                    }
                  )
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-1.5 rounded-lg bg-muted text-foreground", children: isSale ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 12 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { size: 12 }) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-0.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold truncate max-w-[140px] capitalize text-foreground", children: t(typeKey) }),
                    isMoney ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold text-foreground", children: [
                      isSale ? "+" : "-",
                      t("common.etb"),
                      " ",
                      (activity.amount || 0).toLocaleString()
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-black uppercase tracking-wider text-muted-foreground", children: formatTime(activity.date) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground line-clamp-1", children: activity.description || activity.extra || t("analytics.system_update") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-medium text-muted-foreground mt-0.5 flex items-center gap-1.5", children: [
                    activity.userName && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "img",
                        {
                          src: resolveAvatar(activity.userAvatar),
                          alt: "",
                          className: "h-4 w-4 rounded-full object-cover"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary font-bold", children: activity.userName })
                    ] }),
                    activity.userName ? " · " : "",
                    formatTime(activity.date),
                    " · ",
                    formatDate(activity.date)
                  ] })
                ] })
              ] }, i);
            }) }) })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "business", className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BusinessCenter, { initialTab: queryTab }, queryTab || "overview") })
      ] })
    }
  );
};
export {
  Dashboard as default
};
