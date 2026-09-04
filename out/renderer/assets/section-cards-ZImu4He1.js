import { j as jsxRuntimeExports, p as motion, g as Badge, l as TrendingDown } from "./index-D0em7kRt.js";
import { C as Card, a as CardHeader, d as CardDescription, b as CardTitle, e as CardAction, f as CardFooter } from "./card-BfGvUZ57.js";
import { T as TrendingUp } from "./trending-up-C2WkiYxx.js";
function SectionCards({ cards }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-tutorial-section": "kpi-cards", className: "grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/[0.02] *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4", children: cards.map((card, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    motion.div,
    {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.4, delay: i * 0.05, ease: [0.28, 0, 0.22, 1] },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "@container/card relative overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/[0.03] to-transparent rounded-bl-full" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-[11px] font-medium uppercase tracking-wider", children: card.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-2xl font-semibold tabular-nums tracking-tight @[250px]/card:text-3xl", children: card.value }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardAction, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: card.trendType === "up" ? "success" : "warning", className: "gap-1 text-xs", children: [
            card.trendType === "up" ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "size-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { className: "size-3" }),
            card.trend
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardFooter, { className: "flex-col items-start gap-1 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "line-clamp-1 flex gap-2 font-medium text-foreground/70", children: card.footerTitle }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground/60 text-[11px]", children: card.footerSub })
        ] })
      ] })
    },
    i
  )) });
}
export {
  SectionCards as S
};
