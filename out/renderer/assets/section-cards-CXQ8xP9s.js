import { r as reactExports, j as jsxRuntimeExports, g as Badge } from "./index-DPdLjKpV.js";
import { C as Card, a as CardHeader, d as CardDescription, b as CardTitle, e as CardAction, f as CardFooter } from "./card-C6dz2yia.js";
/**
 * @license @tabler/icons-react v3.44.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
var defaultAttributes = {
  outline: {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  },
  filled: {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    stroke: "none"
  }
};
/**
 * @license @tabler/icons-react v3.44.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const createReactComponent = (type, iconName, iconNamePascal, iconNode) => {
  const Component = reactExports.forwardRef(
    ({ color = "currentColor", size = 24, stroke = 2, title, className, children, ...rest }, ref) => reactExports.createElement(
      "svg",
      {
        ref,
        ...defaultAttributes[type],
        width: size,
        height: size,
        className: [`tabler-icon`, `tabler-icon-${iconName}`, className].join(" "),
        ...{
          strokeWidth: stroke,
          stroke: color
        },
        ...rest
      },
      [
        title && reactExports.createElement("title", { key: "svg-title" }, title),
        ...iconNode.map(([tag, attrs]) => reactExports.createElement(tag, attrs)),
        ...Array.isArray(children) ? children : [children]
      ]
    )
  );
  Component.displayName = `${iconNamePascal}`;
  return Component;
};
/**
 * @license @tabler/icons-react v3.44.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [["path", { "d": "M3 7l6 6l4 -4l8 8", "key": "svg-0" }], ["path", { "d": "M21 10l0 7l-7 0", "key": "svg-1" }]];
const IconTrendingDown = createReactComponent("outline", "trending-down", "TrendingDown", __iconNode$1);
/**
 * @license @tabler/icons-react v3.44.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [["path", { "d": "M3 17l6 -6l4 4l8 -8", "key": "svg-0" }], ["path", { "d": "M14 7l7 0l0 7", "key": "svg-1" }]];
const IconTrendingUp = createReactComponent("outline", "trending-up", "TrendingUp", __iconNode);
function SectionCards({ cards }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card", children: cards.map((card, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "@container/card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: card.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-2xl font-semibold tabular-nums @[250px]/card:text-3xl", children: card.value }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardAction, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", children: [
        card.trendType === "up" ? /* @__PURE__ */ jsxRuntimeExports.jsx(IconTrendingUp, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(IconTrendingDown, {}),
        card.trend
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardFooter, { className: "flex-col items-start gap-1.5 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "line-clamp-1 flex gap-2 font-medium", children: [
        card.footerTitle,
        " ",
        card.trendType === "up" ? /* @__PURE__ */ jsxRuntimeExports.jsx(IconTrendingUp, { className: "size-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(IconTrendingDown, { className: "size-4" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: card.footerSub })
    ] })
  ] }, i)) });
}
export {
  SectionCards as S,
  createReactComponent as c
};
