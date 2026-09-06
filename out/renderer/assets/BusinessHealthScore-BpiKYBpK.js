import { c as createLucideIcon, b as useSettings, r as reactExports, j as jsxRuntimeExports, L as LoaderCircle, T as TriangleAlert, e as Button, R as RefreshCw, ab as TrendingDown } from "./index-BcwudWUj.js";
import { A as Alert, a as AlertDescription, L as Lightbulb } from "./alert-MBWTmhU1.js";
import { C as CircleCheckBig } from "./circle-check-big-B3bZDL0M.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const HeartPulse = createLucideIcon("HeartPulse", [
  [
    "path",
    {
      d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
      key: "c3ymky"
    }
  ],
  ["path", { d: "M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27", key: "1uw2ng" }]
]);
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const QrCode = createLucideIcon("QrCode", [
  ["rect", { width: "5", height: "5", x: "3", y: "3", rx: "1", key: "1tu5fj" }],
  ["rect", { width: "5", height: "5", x: "16", y: "3", rx: "1", key: "1v8r4q" }],
  ["rect", { width: "5", height: "5", x: "3", y: "16", rx: "1", key: "1x03jg" }],
  ["path", { d: "M21 16h-3a2 2 0 0 0-2 2v3", key: "177gqh" }],
  ["path", { d: "M21 21v.01", key: "ents32" }],
  ["path", { d: "M12 7v3a2 2 0 0 1-2 2H7", key: "8crl2c" }],
  ["path", { d: "M3 12h.01", key: "nlz23k" }],
  ["path", { d: "M12 3h.01", key: "n36tog" }],
  ["path", { d: "M12 16v.01", key: "133mhm" }],
  ["path", { d: "M16 12h1", key: "1slzba" }],
  ["path", { d: "M21 12v.01", key: "1lwtk9" }],
  ["path", { d: "M12 21v-1", key: "1880an" }]
]);
const STATUS_CONFIG = {
  good: { color: "text-green-500", bg: "bg-green-500/10", labelKey: "health.status_good" },
  warning: { color: "text-amber-500", bg: "bg-amber-500/10", labelKey: "health.status_warning" },
  critical: { color: "text-red-500", bg: "bg-red-500/10", labelKey: "health.status_critical" }
};
function BusinessHealthScore() {
  const { t } = useSettings();
  const [data, setData] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.api?.getBusinessHealthScore();
      setData(result);
    } catch (e) {
      setError(e.message || "Failed to load health score");
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    loadData();
  }, []);
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-emerald-400";
    if (score >= 40) return "text-amber-500";
    return "text-red-500";
  };
  const getScoreRing = (score) => {
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - score / 100 * circumference;
    let strokeColor = "#22c55e";
    if (score < 40) strokeColor = "#ef4444";
    else if (score < 60) strokeColor = "#f59e0b";
    else if (score < 80) strokeColor = "#10b981";
    return { circumference, offset, strokeColor };
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-muted-foreground" }) });
  }
  if (error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDescription, { children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: loadData, className: "mt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4 mr-1" }),
        " ",
        t("health.refresh")
      ] })
    ] });
  }
  if (!data) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(HeartPulse, { className: "h-12 w-12 mb-4 opacity-30" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-medium", children: t("health.no_data") })
    ] });
  }
  const ring = getScoreRing(data.score);
  const colorClass = getScoreColor(data.score);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-black tracking-tight", children: t("health.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground uppercase font-black tracking-widest", children: t("health.subtitle") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 rounded-2xl border bg-card/50 flex flex-col items-center text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-32 h-32 mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "w-32 h-32 -rotate-90", viewBox: "0 0 120 120", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "60", cy: "60", r: "54", fill: "none", stroke: "currentColor", strokeWidth: "8", className: "text-muted/20" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "circle",
              {
                cx: "60",
                cy: "60",
                r: "54",
                fill: "none",
                stroke: ring.strokeColor,
                strokeWidth: "8",
                strokeLinecap: "round",
                strokeDasharray: ring.circumference,
                strokeDashoffset: ring.offset,
                className: "transition-all duration-1000 ease-out"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-4xl font-black ${colorClass}`, children: data.score }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: "/ 100" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider ${data.score >= 80 ? "bg-green-500/10 text-green-500" : data.score >= 60 ? "bg-emerald-400/10 text-emerald-400" : data.score >= 40 ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"}`, children: data.rating })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-black uppercase tracking-widest text-muted-foreground", children: t("health.score_factors") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-3", children: data.factors.map((factor, idx) => {
          const statusCfg = STATUS_CONFIG[factor.status] || STATUS_CONFIG.warning;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl border bg-card/40 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-6 w-6 rounded-lg ${statusCfg.bg} ${statusCfg.color} flex items-center justify-center`, children: factor.status === "good" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3.5 w-3.5" }) : factor.status === "warning" ? /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { className: "h-3.5 w-3.5" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold", children: factor.name })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 h-1.5 bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: `h-full rounded-full transition-all ${factor.score >= 80 ? "bg-green-500" : factor.score >= 60 ? "bg-emerald-400" : factor.score >= 40 ? "bg-amber-500" : "bg-red-500"}`,
                    style: { width: `${factor.score}%` }
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-black ${getScoreColor(factor.score)} w-8 text-right`, children: factor.score })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: factor.detail })
          ] }, idx);
        }) })
      ] })
    ] }),
    data.recommendations.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Lightbulb, { className: "h-4 w-4 text-amber-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-black uppercase tracking-widest text-muted-foreground", children: t("health.recommendations") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: data.recommendations.map((rec, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 rounded-xl border-l-4 border-l-amber-500 bg-card/40 space-y-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-relaxed", children: rec }) }, idx)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: loadData, className: "text-xs font-black uppercase tracking-widest", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5 mr-1.5" }),
      " ",
      t("health.refresh")
    ] })
  ] });
}
export {
  BusinessHealthScore as B,
  HeartPulse as H,
  QrCode as Q
};
