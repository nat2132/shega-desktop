import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, aS as Presence, ae as composeEventHandlers, aQ as useComposedRefs, ad as Primitive, af as createContextScope, aT as useCallbackRef, aU as useLayoutEffect2, ah as useDirection, ak as cn, b as useSettings, g as useAuth, P as Package, J as Input, i as Badge, e as Button, aV as ChevronRight, T as TriangleAlert, Q as toast } from "./index-BcwudWUj.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CC5EZ-HS.js";
import { C as Card, a as CardHeader, b as CardTitle, d as CardDescription, c as CardContent } from "./card-9E0A8T1M.js";
import { L as Label } from "./label-CKZ6ezue.js";
import { e as clamp, S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BztXyn8Q.js";
import { T as Textarea } from "./textarea-BC2v4KKf.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-C1TWaOqF.js";
import { H as History } from "./history-DcGba9PN.js";
import { D as DollarSign } from "./dollar-sign-BgllAvTM.js";
import { B as Ban } from "./ban-EAHR1hHj.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Blocks = createLucideIcon("Blocks", [
  ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1", key: "6d4xhi" }],
  [
    "path",
    {
      d: "M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3",
      key: "1fpvtg"
    }
  ]
]);
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function useStateMachine(initialState, machine) {
  return reactExports.useReducer((state, event) => {
    const nextState = machine[state][event];
    return nextState ?? state;
  }, initialState);
}
__name(useStateMachine, "useStateMachine");
var SCROLL_AREA_NAME = "ScrollArea";
var [createScrollAreaContext, createScrollAreaScope] = createContextScope(SCROLL_AREA_NAME);
var [ScrollAreaProvider, useScrollAreaContext] = createScrollAreaContext(SCROLL_AREA_NAME);
var ScrollArea$1 = /* @__PURE__ */ reactExports.forwardRef(
  /* @__PURE__ */ __name(function ScrollArea2(props, forwardedRef) {
    const {
      __scopeScrollArea,
      type = "hover",
      dir,
      scrollHideDelay = 600,
      ...scrollAreaProps
    } = props;
    const [scrollArea, setScrollArea] = reactExports.useState(null);
    const [viewport, setViewport] = reactExports.useState(null);
    const [content, setContent] = reactExports.useState(null);
    const [scrollbarX, setScrollbarX] = reactExports.useState(null);
    const [scrollbarY, setScrollbarY] = reactExports.useState(null);
    const [cornerWidth, setCornerWidth] = reactExports.useState(0);
    const [cornerHeight, setCornerHeight] = reactExports.useState(0);
    const [scrollbarXEnabled, setScrollbarXEnabled] = reactExports.useState(false);
    const [scrollbarYEnabled, setScrollbarYEnabled] = reactExports.useState(false);
    const composedRefs = useComposedRefs(forwardedRef, setScrollArea);
    const direction = useDirection(dir);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      ScrollAreaProvider,
      {
        scope: __scopeScrollArea,
        type,
        dir: direction,
        scrollHideDelay,
        scrollArea,
        viewport,
        onViewportChange: setViewport,
        content,
        onContentChange: setContent,
        scrollbarX,
        onScrollbarXChange: setScrollbarX,
        scrollbarXEnabled,
        onScrollbarXEnabledChange: setScrollbarXEnabled,
        scrollbarY,
        onScrollbarYChange: setScrollbarY,
        scrollbarYEnabled,
        onScrollbarYEnabledChange: setScrollbarYEnabled,
        onCornerWidthChange: setCornerWidth,
        onCornerHeightChange: setCornerHeight,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.div,
          {
            dir: direction,
            ...scrollAreaProps,
            ref: composedRefs,
            style: {
              position: "relative",
              // Pass corner sizes as CSS vars to reduce re-renders of context consumers
              "--radix-scroll-area-corner-width": cornerWidth + "px",
              "--radix-scroll-area-corner-height": cornerHeight + "px",
              ...props.style
            }
          }
        )
      }
    );
  }, "ScrollArea")
);
var VIEWPORT_NAME = "ScrollAreaViewport";
var ScrollAreaViewport = /* @__PURE__ */ reactExports.forwardRef(
  // blank line to reduce diff noise
  /* @__PURE__ */ __name(function ScrollAreaViewport2(props, forwardedRef) {
    const { __scopeScrollArea, children, nonce, ...viewportProps } = props;
    const context = useScrollAreaContext(VIEWPORT_NAME, __scopeScrollArea);
    const ref = reactExports.useRef(null);
    const composedRefs = useComposedRefs(forwardedRef, ref, context.onViewportChange);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollAreaViewportStyle, { nonce }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Primitive.div,
        {
          "data-radix-scroll-area-viewport": "",
          ...viewportProps,
          ref: composedRefs,
          style: {
            /**
             * We don't support `visible` because the intention is to have at least one scrollbar
             * if this component is used and `visible` will behave like `auto` in that case
             * https://developer.mozilla.org/en-US/docs/Web/CSS/overflow#description
             *
             * We don't handle `auto` because the intention is for the native implementation
             * to be hidden if using this component. We just want to ensure the node is scrollable
             * so could have used either `scroll` or `auto` here. We picked `scroll` to prevent
             * the browser from having to work out whether to render native scrollbars or not,
             * we tell it to with the intention of hiding them in CSS.
             */
            overflowX: context.scrollbarXEnabled ? "scroll" : "hidden",
            overflowY: context.scrollbarYEnabled ? "scroll" : "hidden",
            ...props.style
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: context.onContentChange, style: { minWidth: "100%", display: "table" }, children })
        }
      )
    ] });
  }, "ScrollAreaViewport")
);
var ScrollAreaViewportStyle = /* @__PURE__ */ reactExports.memo(
  /* @__PURE__ */ __name(function ScrollAreaViewportStyle2({ nonce }) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "style",
      {
        dangerouslySetInnerHTML: {
          __html: `[data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}`
        },
        nonce
      }
    );
  }, "ScrollAreaViewportStyle"),
  (prevProps, nextProps) => prevProps.nonce === nextProps.nonce
);
var SCROLLBAR_NAME = "ScrollAreaScrollbar";
var ScrollAreaScrollbar = /* @__PURE__ */ reactExports.forwardRef(
  // blank line to reduce diff noise
  /* @__PURE__ */ __name(function ScrollAreaScrollbar2(props, forwardedRef) {
    const { forceMount, ...scrollbarProps } = props;
    const context = useScrollAreaContext(SCROLLBAR_NAME, props.__scopeScrollArea);
    const { onScrollbarXEnabledChange, onScrollbarYEnabledChange } = context;
    const isHorizontal = props.orientation === "horizontal";
    reactExports.useEffect(() => {
      isHorizontal ? onScrollbarXEnabledChange(true) : onScrollbarYEnabledChange(true);
      return () => {
        isHorizontal ? onScrollbarXEnabledChange(false) : onScrollbarYEnabledChange(false);
      };
    }, [isHorizontal, onScrollbarXEnabledChange, onScrollbarYEnabledChange]);
    return context.type === "hover" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollAreaScrollbarHover, { ...scrollbarProps, ref: forwardedRef, forceMount }) : context.type === "scroll" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollAreaScrollbarScroll, { ...scrollbarProps, ref: forwardedRef, forceMount }) : context.type === "auto" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollAreaScrollbarAuto, { ...scrollbarProps, ref: forwardedRef, forceMount }) : context.type === "always" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollAreaScrollbarVisible, { ...scrollbarProps, ref: forwardedRef, "data-state": "visible" }) : null;
  }, "ScrollAreaScrollbar")
);
var ScrollAreaScrollbarHover = /* @__PURE__ */ reactExports.forwardRef(/* @__PURE__ */ __name(function ScrollAreaScrollbarHover2(props, forwardedRef) {
  const { forceMount, ...scrollbarProps } = props;
  const context = useScrollAreaContext(SCROLLBAR_NAME, props.__scopeScrollArea);
  const [visible, setVisible] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const scrollArea = context.scrollArea;
    let hideTimer = 0;
    if (scrollArea) {
      const handlePointerEnter = /* @__PURE__ */ __name(() => {
        window.clearTimeout(hideTimer);
        setVisible(true);
      }, "handlePointerEnter");
      const handlePointerLeave = /* @__PURE__ */ __name(() => {
        hideTimer = window.setTimeout(() => setVisible(false), context.scrollHideDelay);
      }, "handlePointerLeave");
      scrollArea.addEventListener("pointerenter", handlePointerEnter);
      scrollArea.addEventListener("pointerleave", handlePointerLeave);
      return () => {
        window.clearTimeout(hideTimer);
        scrollArea.removeEventListener("pointerenter", handlePointerEnter);
        scrollArea.removeEventListener("pointerleave", handlePointerLeave);
      };
    }
  }, [context.scrollArea, context.scrollHideDelay]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || visible, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    ScrollAreaScrollbarAuto,
    {
      "data-state": visible ? "visible" : "hidden",
      ...scrollbarProps,
      ref: forwardedRef
    }
  ) });
}, "ScrollAreaScrollbarHover"));
var ScrollAreaScrollbarScroll = /* @__PURE__ */ reactExports.forwardRef(/* @__PURE__ */ __name(function ScrollAreaScrollbarScroll2(props, forwardedRef) {
  const { forceMount, ...scrollbarProps } = props;
  const context = useScrollAreaContext(SCROLLBAR_NAME, props.__scopeScrollArea);
  const isHorizontal = props.orientation === "horizontal";
  const debounceScrollEnd = useDebounceCallback(() => send("SCROLL_END"), 100);
  const [state, send] = useStateMachine("hidden", {
    hidden: {
      SCROLL: "scrolling"
    },
    scrolling: {
      SCROLL_END: "idle",
      POINTER_ENTER: "interacting"
    },
    interacting: {
      SCROLL: "interacting",
      POINTER_LEAVE: "idle"
    },
    idle: {
      HIDE: "hidden",
      SCROLL: "scrolling",
      POINTER_ENTER: "interacting"
    }
  });
  reactExports.useEffect(() => {
    if (state === "idle") {
      const hideTimer = window.setTimeout(() => send("HIDE"), context.scrollHideDelay);
      return () => window.clearTimeout(hideTimer);
    }
  }, [state, context.scrollHideDelay, send]);
  reactExports.useEffect(() => {
    const viewport = context.viewport;
    const scrollDirection = isHorizontal ? "scrollLeft" : "scrollTop";
    if (viewport) {
      let prevScrollPos = viewport[scrollDirection];
      const handleScroll = /* @__PURE__ */ __name(() => {
        const scrollPos = viewport[scrollDirection];
        const hasScrollInDirectionChanged = prevScrollPos !== scrollPos;
        if (hasScrollInDirectionChanged) {
          send("SCROLL");
          debounceScrollEnd();
        }
        prevScrollPos = scrollPos;
      }, "handleScroll");
      viewport.addEventListener("scroll", handleScroll);
      return () => viewport.removeEventListener("scroll", handleScroll);
    }
  }, [context.viewport, isHorizontal, send, debounceScrollEnd]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || state !== "hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    ScrollAreaScrollbarVisible,
    {
      "data-state": state === "hidden" ? "hidden" : "visible",
      ...scrollbarProps,
      ref: forwardedRef,
      onPointerEnter: composeEventHandlers(props.onPointerEnter, () => send("POINTER_ENTER")),
      onPointerLeave: composeEventHandlers(props.onPointerLeave, () => send("POINTER_LEAVE"))
    }
  ) });
}, "ScrollAreaScrollbarScroll"));
var ScrollAreaScrollbarAuto = /* @__PURE__ */ reactExports.forwardRef(/* @__PURE__ */ __name(function ScrollAreaScrollbarAuto2(props, forwardedRef) {
  const context = useScrollAreaContext(SCROLLBAR_NAME, props.__scopeScrollArea);
  const { forceMount, ...scrollbarProps } = props;
  const [visible, setVisible] = reactExports.useState(false);
  const isHorizontal = props.orientation === "horizontal";
  const handleResize = useDebounceCallback(() => {
    if (context.viewport) {
      const isOverflowX = context.viewport.offsetWidth < context.viewport.scrollWidth;
      const isOverflowY = context.viewport.offsetHeight < context.viewport.scrollHeight;
      setVisible(isHorizontal ? isOverflowX : isOverflowY);
    }
  }, 10);
  useResizeObserver(context.viewport, handleResize);
  useResizeObserver(context.content, handleResize);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || visible, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    ScrollAreaScrollbarVisible,
    {
      "data-state": visible ? "visible" : "hidden",
      ...scrollbarProps,
      ref: forwardedRef
    }
  ) });
}, "ScrollAreaScrollbarAuto"));
var ScrollAreaScrollbarVisible = /* @__PURE__ */ reactExports.forwardRef(/* @__PURE__ */ __name(function ScrollAreaScrollbarVisible2(props, forwardedRef) {
  const { orientation = "vertical", ...scrollbarProps } = props;
  const context = useScrollAreaContext(SCROLLBAR_NAME, props.__scopeScrollArea);
  const thumbRef = reactExports.useRef(null);
  const pointerOffsetRef = reactExports.useRef(0);
  const [sizes, setSizes] = reactExports.useState({
    content: 0,
    viewport: 0,
    scrollbar: { size: 0, paddingStart: 0, paddingEnd: 0 }
  });
  const thumbRatio = getThumbRatio(sizes.viewport, sizes.content);
  const commonProps = {
    ...scrollbarProps,
    sizes,
    onSizesChange: setSizes,
    hasThumb: Boolean(thumbRatio > 0 && thumbRatio < 1),
    onThumbChange: /* @__PURE__ */ __name((thumb) => thumbRef.current = thumb, "onThumbChange"),
    onThumbPointerUp: /* @__PURE__ */ __name(() => pointerOffsetRef.current = 0, "onThumbPointerUp"),
    onThumbPointerDown: /* @__PURE__ */ __name((pointerPos) => pointerOffsetRef.current = pointerPos, "onThumbPointerDown")
  };
  function getScrollPosition(pointerPos, dir) {
    return getScrollPositionFromPointer(pointerPos, pointerOffsetRef.current, sizes, dir);
  }
  __name(getScrollPosition, "getScrollPosition");
  if (orientation === "horizontal") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      ScrollAreaScrollbarX,
      {
        ...commonProps,
        ref: forwardedRef,
        onThumbPositionChange: () => {
          if (context.viewport && thumbRef.current) {
            const scrollPos = context.viewport.scrollLeft;
            const offset = getThumbOffsetFromScroll(scrollPos, sizes, context.dir);
            thumbRef.current.style.transform = `translate3d(${offset}px, 0, 0)`;
          }
        },
        onWheelScroll: (scrollPos) => {
          if (context.viewport) context.viewport.scrollLeft = scrollPos;
        },
        onDragScroll: (pointerPos) => {
          if (context.viewport) {
            context.viewport.scrollLeft = getScrollPosition(pointerPos, context.dir);
          }
        }
      }
    );
  }
  if (orientation === "vertical") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      ScrollAreaScrollbarY,
      {
        ...commonProps,
        ref: forwardedRef,
        onThumbPositionChange: () => {
          if (context.viewport && thumbRef.current) {
            const scrollPos = context.viewport.scrollTop;
            const offset = getThumbOffsetFromScroll(scrollPos, sizes);
            thumbRef.current.style.transform = `translate3d(0, ${offset}px, 0)`;
          }
        },
        onWheelScroll: (scrollPos) => {
          if (context.viewport) context.viewport.scrollTop = scrollPos;
        },
        onDragScroll: (pointerPos) => {
          if (context.viewport) context.viewport.scrollTop = getScrollPosition(pointerPos);
        }
      }
    );
  }
  return null;
}, "ScrollAreaScrollbarVisible"));
var ScrollAreaScrollbarX = /* @__PURE__ */ reactExports.forwardRef(/* @__PURE__ */ __name(function ScrollAreaScrollbarX2(props, forwardedRef) {
  const { sizes, onSizesChange, ...scrollbarProps } = props;
  const context = useScrollAreaContext(SCROLLBAR_NAME, props.__scopeScrollArea);
  const [computedStyle, setComputedStyle] = reactExports.useState();
  const ref = reactExports.useRef(null);
  const composeRefs = useComposedRefs(forwardedRef, ref, context.onScrollbarXChange);
  reactExports.useEffect(() => {
    if (ref.current) setComputedStyle(getComputedStyle(ref.current));
  }, [ref]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ScrollAreaScrollbarImpl,
    {
      "data-orientation": "horizontal",
      ...scrollbarProps,
      ref: composeRefs,
      sizes,
      style: {
        bottom: 0,
        left: context.dir === "rtl" ? "var(--radix-scroll-area-corner-width)" : 0,
        right: context.dir === "ltr" ? "var(--radix-scroll-area-corner-width)" : 0,
        "--radix-scroll-area-thumb-width": getThumbSize(sizes) + "px",
        ...props.style
      },
      onThumbPointerDown: (pointerPos) => props.onThumbPointerDown(pointerPos.x),
      onDragScroll: (pointerPos) => props.onDragScroll(pointerPos.x),
      onWheelScroll: (event, maxScrollPos) => {
        if (context.viewport) {
          const scrollPos = context.viewport.scrollLeft + event.deltaX;
          props.onWheelScroll(scrollPos);
          if (isScrollingWithinScrollbarBounds(scrollPos, maxScrollPos)) {
            event.preventDefault();
          }
        }
      },
      onResize: () => {
        if (ref.current && context.viewport && computedStyle) {
          onSizesChange({
            content: context.viewport.scrollWidth,
            viewport: context.viewport.offsetWidth,
            scrollbar: {
              size: ref.current.clientWidth,
              paddingStart: toInt(computedStyle.paddingLeft),
              paddingEnd: toInt(computedStyle.paddingRight)
            }
          });
        }
      }
    }
  );
}, "ScrollAreaScrollbarX"));
var ScrollAreaScrollbarY = /* @__PURE__ */ reactExports.forwardRef(/* @__PURE__ */ __name(function ScrollAreaScrollbarY2(props, forwardedRef) {
  const { sizes, onSizesChange, ...scrollbarProps } = props;
  const context = useScrollAreaContext(SCROLLBAR_NAME, props.__scopeScrollArea);
  const [computedStyle, setComputedStyle] = reactExports.useState();
  const ref = reactExports.useRef(null);
  const composeRefs = useComposedRefs(forwardedRef, ref, context.onScrollbarYChange);
  reactExports.useEffect(() => {
    if (ref.current) setComputedStyle(getComputedStyle(ref.current));
  }, [ref]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ScrollAreaScrollbarImpl,
    {
      "data-orientation": "vertical",
      ...scrollbarProps,
      ref: composeRefs,
      sizes,
      style: {
        top: 0,
        right: context.dir === "ltr" ? 0 : void 0,
        left: context.dir === "rtl" ? 0 : void 0,
        bottom: "var(--radix-scroll-area-corner-height)",
        "--radix-scroll-area-thumb-height": getThumbSize(sizes) + "px",
        ...props.style
      },
      onThumbPointerDown: (pointerPos) => props.onThumbPointerDown(pointerPos.y),
      onDragScroll: (pointerPos) => props.onDragScroll(pointerPos.y),
      onWheelScroll: (event, maxScrollPos) => {
        if (context.viewport) {
          const scrollPos = context.viewport.scrollTop + event.deltaY;
          props.onWheelScroll(scrollPos);
          if (isScrollingWithinScrollbarBounds(scrollPos, maxScrollPos)) {
            event.preventDefault();
          }
        }
      },
      onResize: () => {
        if (ref.current && context.viewport && computedStyle) {
          onSizesChange({
            content: context.viewport.scrollHeight,
            viewport: context.viewport.offsetHeight,
            scrollbar: {
              size: ref.current.clientHeight,
              paddingStart: toInt(computedStyle.paddingTop),
              paddingEnd: toInt(computedStyle.paddingBottom)
            }
          });
        }
      }
    }
  );
}, "ScrollAreaScrollbarY"));
var [ScrollbarProvider, useScrollbarContext] = createScrollAreaContext(SCROLLBAR_NAME);
var ScrollAreaScrollbarImpl = /* @__PURE__ */ reactExports.forwardRef(/* @__PURE__ */ __name(function ScrollAreaScrollbarImpl2(props, forwardedRef) {
  const {
    __scopeScrollArea,
    sizes,
    hasThumb,
    onThumbChange,
    onThumbPointerUp,
    onThumbPointerDown,
    onThumbPositionChange,
    onDragScroll,
    onWheelScroll,
    onResize,
    ...scrollbarProps
  } = props;
  const context = useScrollAreaContext(SCROLLBAR_NAME, __scopeScrollArea);
  const [scrollbar, setScrollbar] = reactExports.useState(null);
  const composeRefs = useComposedRefs(forwardedRef, setScrollbar);
  const rectRef = reactExports.useRef(null);
  const prevWebkitUserSelectRef = reactExports.useRef("");
  const viewport = context.viewport;
  const maxScrollPos = sizes.content - sizes.viewport;
  const handleWheelScroll = useCallbackRef(onWheelScroll);
  const handleThumbPositionChange = useCallbackRef(onThumbPositionChange);
  const handleResize = useDebounceCallback(onResize, 10);
  function handleDragScroll(event) {
    if (rectRef.current) {
      const x = event.clientX - rectRef.current.left;
      const y = event.clientY - rectRef.current.top;
      onDragScroll({ x, y });
    }
  }
  __name(handleDragScroll, "handleDragScroll");
  reactExports.useEffect(() => {
    const handleWheel = /* @__PURE__ */ __name((event) => {
      const element = event.target;
      const isScrollbarWheel = scrollbar?.contains(element);
      if (isScrollbarWheel) handleWheelScroll(event, maxScrollPos);
    }, "handleWheel");
    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => document.removeEventListener("wheel", handleWheel, { passive: false });
  }, [viewport, scrollbar, maxScrollPos, handleWheelScroll]);
  reactExports.useEffect(handleThumbPositionChange, [sizes, handleThumbPositionChange]);
  useResizeObserver(scrollbar, handleResize);
  useResizeObserver(context.content, handleResize);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ScrollbarProvider,
    {
      scope: __scopeScrollArea,
      scrollbar,
      hasThumb,
      onThumbChange: useCallbackRef(onThumbChange),
      onThumbPointerUp: useCallbackRef(onThumbPointerUp),
      onThumbPositionChange: handleThumbPositionChange,
      onThumbPointerDown: useCallbackRef(onThumbPointerDown),
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Primitive.div,
        {
          ...scrollbarProps,
          ref: composeRefs,
          style: { position: "absolute", ...scrollbarProps.style },
          onPointerDown: composeEventHandlers(props.onPointerDown, (event) => {
            const mainPointer = 0;
            if (event.button === mainPointer) {
              const element = event.target;
              element.setPointerCapture(event.pointerId);
              rectRef.current = scrollbar.getBoundingClientRect();
              prevWebkitUserSelectRef.current = document.body.style.webkitUserSelect;
              document.body.style.webkitUserSelect = "none";
              if (context.viewport) context.viewport.style.scrollBehavior = "auto";
              handleDragScroll(event);
            }
          }),
          onPointerMove: composeEventHandlers(props.onPointerMove, handleDragScroll),
          onPointerUp: composeEventHandlers(props.onPointerUp, (event) => {
            const element = event.target;
            if (element.hasPointerCapture(event.pointerId)) {
              element.releasePointerCapture(event.pointerId);
            }
            document.body.style.webkitUserSelect = prevWebkitUserSelectRef.current;
            if (context.viewport) context.viewport.style.scrollBehavior = "";
            rectRef.current = null;
          })
        }
      )
    }
  );
}, "ScrollAreaScrollbarImpl"));
var THUMB_NAME = "ScrollAreaThumb";
var ScrollAreaThumb = /* @__PURE__ */ reactExports.forwardRef(
  // blank line to reduce diff noise
  /* @__PURE__ */ __name(function ScrollAreaThumb2(props, forwardedRef) {
    const { forceMount, ...thumbProps } = props;
    const scrollbarContext = useScrollbarContext(THUMB_NAME, props.__scopeScrollArea);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || scrollbarContext.hasThumb, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollAreaThumbImpl, { ref: forwardedRef, ...thumbProps }) });
  }, "ScrollAreaThumb")
);
var ScrollAreaThumbImpl = /* @__PURE__ */ reactExports.forwardRef(
  // blank line to reduce diff noise
  /* @__PURE__ */ __name(function ScrollAreaThumbImpl2(props, forwardedRef) {
    const { __scopeScrollArea, style, ...thumbProps } = props;
    const scrollAreaContext = useScrollAreaContext(THUMB_NAME, __scopeScrollArea);
    const scrollbarContext = useScrollbarContext(THUMB_NAME, __scopeScrollArea);
    const { onThumbPositionChange } = scrollbarContext;
    const composedRef = useComposedRefs(forwardedRef, scrollbarContext.onThumbChange);
    const removeUnlinkedScrollListenerRef = reactExports.useRef(void 0);
    const debounceScrollEnd = useDebounceCallback(() => {
      if (removeUnlinkedScrollListenerRef.current) {
        removeUnlinkedScrollListenerRef.current();
        removeUnlinkedScrollListenerRef.current = void 0;
      }
    }, 100);
    reactExports.useEffect(() => {
      const viewport = scrollAreaContext.viewport;
      if (viewport) {
        const handleScroll = /* @__PURE__ */ __name(() => {
          debounceScrollEnd();
          if (!removeUnlinkedScrollListenerRef.current) {
            const listener = addUnlinkedScrollListener(viewport, onThumbPositionChange);
            removeUnlinkedScrollListenerRef.current = listener;
            onThumbPositionChange();
          }
        }, "handleScroll");
        onThumbPositionChange();
        viewport.addEventListener("scroll", handleScroll);
        return () => viewport.removeEventListener("scroll", handleScroll);
      }
    }, [scrollAreaContext.viewport, debounceScrollEnd, onThumbPositionChange]);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.div,
      {
        "data-state": scrollbarContext.hasThumb ? "visible" : "hidden",
        ...thumbProps,
        ref: composedRef,
        style: {
          width: "var(--radix-scroll-area-thumb-width)",
          height: "var(--radix-scroll-area-thumb-height)",
          ...style
        },
        onPointerDownCapture: composeEventHandlers(props.onPointerDownCapture, (event) => {
          const thumb = event.target;
          const thumbRect = thumb.getBoundingClientRect();
          const x = event.clientX - thumbRect.left;
          const y = event.clientY - thumbRect.top;
          scrollbarContext.onThumbPointerDown({ x, y });
        }),
        onPointerUp: composeEventHandlers(props.onPointerUp, scrollbarContext.onThumbPointerUp)
      }
    );
  }, "ScrollAreaThumbImpl")
);
var CORNER_NAME = "ScrollAreaCorner";
var ScrollAreaCorner = /* @__PURE__ */ reactExports.forwardRef(
  // blank line to reduce diff noise
  /* @__PURE__ */ __name(function ScrollAreaCorner2(props, forwardedRef) {
    const context = useScrollAreaContext(CORNER_NAME, props.__scopeScrollArea);
    const hasBothScrollbarsVisible = Boolean(context.scrollbarX && context.scrollbarY);
    const hasCorner = context.type !== "scroll" && hasBothScrollbarsVisible;
    return hasCorner ? /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollAreaCornerImpl, { ...props, ref: forwardedRef }) : null;
  }, "ScrollAreaCorner")
);
var ScrollAreaCornerImpl = /* @__PURE__ */ reactExports.forwardRef(/* @__PURE__ */ __name(function ScrollAreaCornerImpl2(props, forwardedRef) {
  const { __scopeScrollArea, ...cornerProps } = props;
  const context = useScrollAreaContext(CORNER_NAME, __scopeScrollArea);
  const [width, setWidth] = reactExports.useState(0);
  const [height, setHeight] = reactExports.useState(0);
  const hasSize = Boolean(width && height);
  const { onCornerWidthChange, onCornerHeightChange } = context;
  useResizeObserver(context.scrollbarX, () => {
    const height2 = context.scrollbarX?.offsetHeight || 0;
    context.onCornerHeightChange(height2);
    setHeight(height2);
  });
  useResizeObserver(context.scrollbarY, () => {
    const width2 = context.scrollbarY?.offsetWidth || 0;
    context.onCornerWidthChange(width2);
    setWidth(width2);
  });
  reactExports.useEffect(() => {
    return () => {
      onCornerWidthChange(0);
      onCornerHeightChange(0);
    };
  }, [onCornerWidthChange, onCornerHeightChange]);
  return hasSize ? /* @__PURE__ */ jsxRuntimeExports.jsx(
    Primitive.div,
    {
      ...cornerProps,
      ref: forwardedRef,
      style: {
        width,
        height,
        position: "absolute",
        right: context.dir === "ltr" ? 0 : void 0,
        left: context.dir === "rtl" ? 0 : void 0,
        bottom: 0,
        ...props.style
      }
    }
  ) : null;
}, "ScrollAreaCornerImpl"));
function toInt(value) {
  return value ? parseInt(value, 10) : 0;
}
__name(toInt, "toInt");
function getThumbRatio(viewportSize, contentSize) {
  const ratio = viewportSize / contentSize;
  return isNaN(ratio) ? 0 : ratio;
}
__name(getThumbRatio, "getThumbRatio");
function getThumbSize(sizes) {
  const ratio = getThumbRatio(sizes.viewport, sizes.content);
  const scrollbarPadding = sizes.scrollbar.paddingStart + sizes.scrollbar.paddingEnd;
  const thumbSize = (sizes.scrollbar.size - scrollbarPadding) * ratio;
  return Math.max(thumbSize, 18);
}
__name(getThumbSize, "getThumbSize");
function getScrollPositionFromPointer(pointerPos, pointerOffset, sizes, dir = "ltr") {
  const thumbSizePx = getThumbSize(sizes);
  const thumbCenter = thumbSizePx / 2;
  const offset = pointerOffset || thumbCenter;
  const thumbOffsetFromEnd = thumbSizePx - offset;
  const minPointerPos = sizes.scrollbar.paddingStart + offset;
  const maxPointerPos = sizes.scrollbar.size - sizes.scrollbar.paddingEnd - thumbOffsetFromEnd;
  const maxScrollPos = sizes.content - sizes.viewport;
  const scrollRange = dir === "ltr" ? [0, maxScrollPos] : [maxScrollPos * -1, 0];
  const interpolate = linearScale([minPointerPos, maxPointerPos], scrollRange);
  return interpolate(pointerPos);
}
__name(getScrollPositionFromPointer, "getScrollPositionFromPointer");
function getThumbOffsetFromScroll(scrollPos, sizes, dir = "ltr") {
  const thumbSizePx = getThumbSize(sizes);
  const scrollbarPadding = sizes.scrollbar.paddingStart + sizes.scrollbar.paddingEnd;
  const scrollbar = sizes.scrollbar.size - scrollbarPadding;
  const maxScrollPos = sizes.content - sizes.viewport;
  const maxThumbPos = scrollbar - thumbSizePx;
  const scrollClampRange = dir === "ltr" ? [0, maxScrollPos] : [maxScrollPos * -1, 0];
  const scrollWithoutMomentum = clamp(scrollPos, scrollClampRange);
  const interpolate = linearScale([0, maxScrollPos], [0, maxThumbPos]);
  return interpolate(scrollWithoutMomentum);
}
__name(getThumbOffsetFromScroll, "getThumbOffsetFromScroll");
function linearScale(input, output) {
  return (value) => {
    if (input[0] === input[1] || output[0] === output[1]) return output[0];
    const ratio = (output[1] - output[0]) / (input[1] - input[0]);
    return output[0] + ratio * (value - input[0]);
  };
}
__name(linearScale, "linearScale");
function isScrollingWithinScrollbarBounds(scrollPos, maxScrollPos) {
  return scrollPos > 0 && scrollPos < maxScrollPos;
}
__name(isScrollingWithinScrollbarBounds, "isScrollingWithinScrollbarBounds");
var addUnlinkedScrollListener = /* @__PURE__ */ __name((node, handler = () => {
}) => {
  let prevPosition = { left: node.scrollLeft, top: node.scrollTop };
  let rAF = 0;
  (/* @__PURE__ */ __name(function loop() {
    const position = { left: node.scrollLeft, top: node.scrollTop };
    const isHorizontalScroll = prevPosition.left !== position.left;
    const isVerticalScroll = prevPosition.top !== position.top;
    if (isHorizontalScroll || isVerticalScroll) handler();
    prevPosition = position;
    rAF = window.requestAnimationFrame(loop);
  }, "loop"))();
  return () => window.cancelAnimationFrame(rAF);
}, "addUnlinkedScrollListener");
function useDebounceCallback(callback, delay) {
  const handleCallback = useCallbackRef(callback);
  const debounceTimerRef = reactExports.useRef(0);
  reactExports.useEffect(() => () => window.clearTimeout(debounceTimerRef.current), []);
  return reactExports.useCallback(() => {
    window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(handleCallback, delay);
  }, [handleCallback, delay]);
}
__name(useDebounceCallback, "useDebounceCallback");
function useResizeObserver(element, onResize) {
  const handleResize = useCallbackRef(onResize);
  useLayoutEffect2(() => {
    let rAF = 0;
    if (element) {
      const resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(rAF);
        rAF = window.requestAnimationFrame(handleResize);
      });
      resizeObserver.observe(element);
      return () => {
        window.cancelAnimationFrame(rAF);
        resizeObserver.unobserve(element);
      };
    }
  }, [element, handleResize]);
}
__name(useResizeObserver, "useResizeObserver");
var Root = ScrollArea$1;
var Viewport = ScrollAreaViewport;
var Corner = ScrollAreaCorner;
const ScrollArea = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Root,
  {
    ref,
    "data-slot": "scroll-area",
    className: cn("relative overflow-hidden", className),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Viewport,
        {
          "data-slot": "scroll-area-viewport",
          className: "scrollbar-apple h-full w-full rounded-[inherit] outline-none transition-[color,box-shadow] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
          children
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollBar, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Corner, {})
    ]
  }
));
ScrollArea.displayName = Root.displayName;
const ScrollBar = reactExports.forwardRef(({ className, orientation = "vertical", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  ScrollAreaScrollbar,
  {
    ref,
    "data-slot": "scroll-area-scrollbar",
    orientation,
    className: cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-px",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-px",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      ScrollAreaThumb,
      {
        "data-slot": "scroll-area-thumb",
        className: "relative flex-1 rounded-full bg-border/60 hover:bg-border"
      }
    )
  }
));
ScrollBar.displayName = ScrollAreaScrollbar.displayName;
const Adjustments = () => {
  const { t, formatDate, formatTime } = useSettings();
  const { hasPermission } = useAuth();
  const [items, setItems] = reactExports.useState([]);
  const [history, setHistory] = reactExports.useState([]);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [activeTab, setActiveTab] = reactExports.useState("history");
  const [stockItem, setStockItem] = reactExports.useState(null);
  const [stockType, setStockType] = reactExports.useState("add_stock");
  const [stockQty, setStockQty] = reactExports.useState("");
  const [stockReason, setStockReason] = reactExports.useState("");
  const [priceItem, setPriceItem] = reactExports.useState(null);
  const [priceUnitType, setPriceUnitType] = reactExports.useState("base");
  const [newPrice, setNewPrice] = reactExports.useState("");
  const [priceReason, setPriceReason] = reactExports.useState("");
  const [bulkCategory, setBulkCategory] = reactExports.useState("all");
  const [bulkValue, setBulkValue] = reactExports.useState("");
  const [bulkType, setBulkType] = reactExports.useState("percentage");
  const [bulkUnitType, setBulkUnitType] = reactExports.useState("base");
  const [bulkReason, setBulkReason] = reactExports.useState("");
  const [reverseTarget, setReverseTarget] = reactExports.useState(null);
  const [reverseReason, setReverseReason] = reactExports.useState("");
  reactExports.useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      const [itemsData, historyData] = await Promise.all([
        window.api.getItems({}),
        window.api.getAdjustments({})
      ]);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error("Failed to load adjustment data:", error);
      setItems([]);
      setHistory([]);
    }
  };
  const categories = reactExports.useMemo(() => {
    const cats = new Set(items.map((i) => i.category || t("inventory.uncategorized")));
    return Array.from(cats);
  }, [items, t]);
  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!stockItem || !stockQty) return;
    const adjustment = {
      itemId: stockItem.id,
      type: stockType,
      oldValue: stockItem.totalBaseQuantity,
      newValue: stockType === "add_stock" ? stockItem.totalBaseQuantity + parseFloat(stockQty) : stockItem.totalBaseQuantity - parseFloat(stockQty),
      quantity: parseFloat(stockQty),
      unitType: "base",
      reason: stockReason,
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    };
    await window.api.insertAdjustment(adjustment);
    setStockItem(null);
    setStockQty("");
    setStockReason("");
    loadData();
    setActiveTab("history");
  };
  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    if (!priceItem || !newPrice) return;
    const oldPrice = priceUnitType === "base" ? priceItem.baseSellingPrice : priceItem.packSellingPrice;
    const nPrice = parseFloat(newPrice);
    const type = nPrice > oldPrice ? "price_increase" : "price_decrease";
    const adjustment = {
      itemId: priceItem.id,
      type,
      oldValue: oldPrice,
      newValue: nPrice,
      quantity: null,
      unitType: priceUnitType,
      reason: priceReason,
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    };
    await window.api.insertAdjustment(adjustment);
    setPriceItem(null);
    setNewPrice("");
    setPriceReason("");
    loadData();
    setActiveTab("history");
  };
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkValue) return;
    const targetItems = bulkCategory === "all" ? items : items.filter((i) => (i.category || t("inventory.uncategorized")) === bulkCategory);
    if (targetItems.length === 0) return;
    const adjustments = targetItems.map((item) => {
      const oldPrice = bulkUnitType === "base" ? item.baseSellingPrice : item.packSellingPrice;
      let nPrice = oldPrice;
      const val = parseFloat(bulkValue);
      if (bulkType === "percentage") {
        nPrice = oldPrice + oldPrice * (val / 100);
      } else {
        nPrice = oldPrice + val;
      }
      const type = nPrice > oldPrice ? "price_increase" : "price_decrease";
      return {
        itemId: item.id,
        type,
        oldValue: oldPrice,
        newValue: nPrice,
        quantity: null,
        unitType: bulkUnitType,
        reason: bulkReason || `Bulk adjustment applied (${bulkType})`,
        date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      };
    });
    await window.api.insertBulkAdjustments(adjustments);
    setBulkValue("");
    setBulkReason("");
    loadData();
    setActiveTab("history");
  };
  const handleReverseAdjustment = async () => {
    if (!reverseTarget) return;
    try {
      await window.api.reverseAdjustment({ adjustmentId: reverseTarget.id, reason: reverseReason });
      toast.success(t("adjustments.toast_reverse_success") || "Adjustment reversed successfully");
      setReverseTarget(null);
      setReverseReason("");
      loadData();
    } catch (error) {
      toast.error(t("adjustments.toast_reverse_error") || "Failed to reverse adjustment");
    }
  };
  const calculatePriceChange = () => {
    if (!priceItem || !newPrice) return null;
    const oldP = priceUnitType === "base" ? priceItem.baseSellingPrice : priceItem.packSellingPrice;
    const newP = parseFloat(newPrice);
    if (oldP === 0) return { diff: newP, perc: 100 };
    return {
      diff: newP - oldP,
      perc: (newP - oldP) / oldP * 100
    };
  };
  const getBadgeType = (type) => {
    switch (type) {
      case "add_stock":
        return { text: t("adjustments.add_stock") };
      case "damage":
        return { text: t("adjustments.record_damage") };
      case "loss":
        return { text: t("adjustments.record_loss") };
      case "price_increase":
        return { text: t("adjustments.price_up") };
      case "price_decrease":
        return { text: t("adjustments.price_down") };
      default:
        return { text: type };
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fade-in pb-24 relative min-h-screen bg-background text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 md:px-8 lg:px-12 max-w-[1600px] mx-auto flex flex-col gap-y-8 pt-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tighter", children: t("adjustments.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-muted-foreground", children: t("adjustments.subtitle") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-4 max-w-2xl bg-muted/50 p-1 rounded-2xl h-14", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "history", className: "rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "w-4 h-4 mr-2" }),
          " ",
          t("adjustments.history")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "stock", className: "rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "w-4 h-4 mr-2" }),
          " ",
          t("adjustments.stock")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "price", className: "rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "w-4 h-4 mr-2" }),
          " ",
          t("adjustments.price")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "bulk", className: "rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Blocks, { className: "w-4 h-4 mr-2" }),
          " ",
          t("adjustments.bulk")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "history", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border shadow-sm rounded-3xl overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "bg-muted/30 border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("adjustments.audit_log") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: t("adjustments.audit_desc") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                placeholder: t("adjustments.search_placeholder"),
                className: "max-w-xs bg-background",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value)
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm text-left", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "text-xs uppercase bg-muted/50 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 font-black", children: t("adjustments.date") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 font-black", children: t("adjustments.item") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 font-black", children: t("adjustments.type") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 font-black text-right", children: t("adjustments.change") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 font-black", children: t("adjustments.reason") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 font-black", children: t("adjustments.user") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 font-black text-center", children: t("common.actions") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
              history.filter((h) => h.itemName.toLowerCase().includes(searchQuery.toLowerCase())).map((h, i) => {
                const badge = getBadgeType(h.type);
                const isPrice = h.type.includes("price");
                return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border hover:bg-muted/30 transition-colors", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-6 py-4 font-medium whitespace-nowrap text-foreground", children: [
                    formatDate(h.date),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: formatTime(h.createdAt ? new Date(h.createdAt) : /* @__PURE__ */ new Date()) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 font-bold text-foreground", children: h.itemName }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: `font-bold bg-muted text-foreground border-border`, children: badge.text }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-right", children: isPrice ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-black text-foreground", children: [
                      t("common.etb"),
                      " ",
                      h.newValue.toLocaleString()
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground line-through", children: [
                      t("common.etb"),
                      " ",
                      h.oldValue.toLocaleString()
                    ] })
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `font-black text-foreground`, children: [
                      h.type === "add_stock" ? "+" : "-",
                      h.quantity,
                      " ",
                      h.unitType
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
                      t("adjustments.now"),
                      ": ",
                      h.newValue
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-muted-foreground", children: h.reason || "-" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 font-medium text-foreground", children: t("common.operator") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-center", children: h.reversalId ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "bg-muted/50 text-muted-foreground border-border font-bold text-xs", children: t("adjustments.reversed_badge") || "Reversed" }) : hasPermission("adjustments.reverse") ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "sm",
                      className: "h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10",
                      onClick: () => {
                        setReverseTarget(h);
                        setReverseReason("");
                      },
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { size: 14 })
                    }
                  ) : null })
                ] }, i);
              }),
              history.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 7, className: "px-6 py-12 text-center text-muted-foreground font-bold", children: t("adjustments.no_adjustments") }) })
            ] })
          ] }) }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "stock", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border shadow-sm rounded-3xl", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("adjustments.stock_form_title") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: t("adjustments.stock_form_desc") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleStockSubmit, className: "space-y-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("adjustments.action_type") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: stockType, onValueChange: (v) => setStockType(v), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("adjustments.select_type") }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "add_stock", children: t("adjustments.add_stock") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "damage", children: t("adjustments.record_damage") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "loss", children: t("adjustments.record_loss") })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("adjustments.select_item") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: stockItem?.id.toString(), onValueChange: (id) => setStockItem(items.find((i) => i.id === parseInt(id)) || null), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("adjustments.choose_item") }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-[200px]", children: items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: item.id.toString(), children: item.name }, item.id)) }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("adjustments.qty_change") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    min: "0.01",
                    step: "any",
                    required: true,
                    value: stockQty,
                    onChange: (e) => setStockQty(e.target.value),
                    className: "bg-background font-bold text-lg",
                    placeholder: t("adjustments.placeholder_qty") || "e.g. 5"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("adjustments.reason_req") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Textarea,
                  {
                    required: true,
                    value: stockReason,
                    onChange: (e) => setStockReason(e.target.value),
                    className: "bg-background resize-none"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full h-12 rounded-xl font-bold", disabled: !stockItem || !stockQty || !stockReason, children: t("adjustments.submit_adj") })
            ] }) })
          ] }),
          stockItem && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border shadow-sm rounded-3xl bg-muted/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("adjustments.impact_preview") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center p-4 bg-background rounded-2xl border border-border", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-muted-foreground", children: t("adjustments.current_stock") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-black", children: [
                    stockItem.totalBaseQuantity,
                    " ",
                    stockItem.baseUnit
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "text-muted-foreground" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-muted-foreground", children: t("adjustments.new_stock") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-2xl font-black text-foreground`, children: [
                    stockType === "add_stock" ? stockItem.totalBaseQuantity + (parseFloat(stockQty) || 0) : Math.max(0, stockItem.totalBaseQuantity - (parseFloat(stockQty) || 0)),
                    " ",
                    stockItem.baseUnit
                  ] })
                ] })
              ] }),
              stockType !== "add_stock" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-muted rounded-2xl border border-border flex items-start gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "text-foreground shrink-0 mt-1", size: 20 }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-bold text-foreground", children: t("adjustments.financial_loss") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
                    t("adjustments.financial_loss_desc"),
                    " ",
                    t("common.etb"),
                    " ",
                    ((parseFloat(stockQty) || 0) * stockItem.basePurchasePrice).toLocaleString()
                  ] })
                ] })
              ] })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "price", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border shadow-sm rounded-3xl", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("adjustments.price_form_title") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: t("adjustments.price_form_desc") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handlePriceSubmit, className: "space-y-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("adjustments.select_item") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: priceItem?.id.toString(), onValueChange: (id) => setPriceItem(items.find((i) => i.id === parseInt(id)) || null), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("adjustments.choose_item") }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-[200px]", children: items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: item.id.toString(), children: item.name }, item.id)) }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("adjustments.unit_type") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: priceUnitType, onValueChange: (v) => setPriceUnitType(v), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "base", children: t("adjustments.base_unit") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "pack", children: t("adjustments.pack_unit") })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { children: [
                    t("adjustments.new_price"),
                    " (",
                    t("common.etb"),
                    ")"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "number",
                      min: "0",
                      step: "any",
                      required: true,
                      value: newPrice,
                      onChange: (e) => setNewPrice(e.target.value),
                      className: "bg-background font-bold text-lg",
                      placeholder: t("adjustments.placeholder_price") || "e.g. 150"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("adjustments.reason_opt") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Textarea,
                  {
                    value: priceReason,
                    onChange: (e) => setPriceReason(e.target.value),
                    className: "bg-background resize-none"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full h-12 rounded-xl font-bold", disabled: !priceItem || !newPrice, children: t("adjustments.apply_price") })
            ] }) })
          ] }),
          priceItem && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border shadow-sm rounded-3xl bg-muted/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("adjustments.impact_preview") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center p-4 bg-background rounded-2xl border border-border", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-muted-foreground", children: t("adjustments.old_price") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-black text-foreground", children: [
                    t("common.etb"),
                    " ",
                    (priceUnitType === "base" ? priceItem.baseSellingPrice : priceItem.packSellingPrice).toLocaleString()
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "text-muted-foreground" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-muted-foreground", children: t("adjustments.new_price") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-black text-foreground", children: [
                    t("common.etb"),
                    " ",
                    parseFloat(newPrice) ? parseFloat(newPrice).toLocaleString() : "0"
                  ] })
                ] })
              ] }),
              newPrice && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-background rounded-2xl border border-border flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-foreground", children: t("adjustments.difference") }),
                (() => {
                  const change = calculatePriceChange();
                  if (!change) return null;
                  const isPositive = change.diff > 0;
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: `text-sm py-1 font-bold bg-muted text-foreground border-border`, children: [
                    isPositive ? "+" : "",
                    (change.perc || 0).toFixed(1),
                    "% (",
                    t("common.etb"),
                    " ",
                    Math.abs(change.diff || 0).toLocaleString(),
                    ")"
                  ] });
                })()
              ] })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "bulk", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border shadow-sm rounded-3xl", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("adjustments.bulk_form_title") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: t("adjustments.bulk_form_desc") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleBulkSubmit, className: "space-y-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("adjustments.target_category") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: bulkCategory, onValueChange: setBulkCategory, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("adjustments.select_category") }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: t("adjustments.all_items") }),
                    categories.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c, children: c }, i))
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("adjustments.unit_type") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: bulkUnitType, onValueChange: (v) => setBulkUnitType(v), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "base", children: t("adjustments.base_unit") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "pack", children: t("adjustments.pack_unit") })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("adjustments.adj_type") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: bulkType, onValueChange: (v) => setBulkType(v), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "percentage", children: t("adjustments.percentage") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: "fixed", children: [
                        t("adjustments.fixed_amount"),
                        " (",
                        t("common.etb"),
                        ")"
                      ] })
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("adjustments.adj_value") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    step: "any",
                    required: true,
                    value: bulkValue,
                    onChange: (e) => setBulkValue(e.target.value),
                    className: "bg-background font-bold text-lg"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("adjustments.reason") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Textarea,
                  {
                    value: bulkReason,
                    onChange: (e) => setBulkReason(e.target.value),
                    className: "bg-background resize-none"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", className: "w-full h-12 rounded-xl font-bold", disabled: !bulkValue, children: [
                t("adjustments.apply_to"),
                " ",
                bulkCategory === "all" ? items.length : items.filter((i) => (i.category || t("inventory.uncategorized")) === bulkCategory).length
              ] })
            ] }) })
          ] }),
          bulkValue && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border shadow-sm rounded-3xl bg-muted/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("adjustments.bulk_impact") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: t("adjustments.bulk_impact_desc") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-[400px] pr-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              items.filter((i) => bulkCategory === "all" || (i.category || t("inventory.uncategorized")) === bulkCategory).slice(0, 50).map((item) => {
                const oldP = bulkUnitType === "base" ? item.baseSellingPrice : item.packSellingPrice;
                const val = parseFloat(bulkValue) || 0;
                const newP = bulkType === "percentage" ? oldP + oldP * (val / 100) : oldP + val;
                const diff = newP - oldP;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-background rounded-xl border border-border flex justify-between items-center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-sm truncate max-w-[150px]", children: item.name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                      t("common.etb"),
                      " ",
                      oldP.toLocaleString(),
                      " → ",
                      t("common.etb"),
                      " ",
                      newP.toLocaleString()
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: `font-bold bg-muted text-foreground border-border`, children: [
                    diff > 0 ? "+" : "",
                    diff.toLocaleString()
                  ] })
                ] }, item.id);
              }),
              items.filter((i) => bulkCategory === "all" || (i.category || t("inventory.uncategorized")) === bulkCategory).length > 50 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-xs text-muted-foreground mt-4 font-bold", children: t("adjustments.and_more").replace("{count}", (items.filter((i) => bulkCategory === "all" || (i.category || t("inventory.uncategorized")) === bulkCategory).length - 50).toString()) })
            ] }) }) })
          ] })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: reverseTarget !== null, onOpenChange: (open) => {
      if (!open) {
        setReverseTarget(null);
        setReverseReason("");
      }
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("adjustments.reverse_title") || "Reverse Adjustment" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: t("adjustments.reverse_confirm", { itemName: reverseTarget?.itemName }) || `Are you sure you want to reverse this adjustment for ${reverseTarget?.itemName}?` })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("adjustments.reason_req") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            required: true,
            value: reverseReason,
            onChange: (e) => setReverseReason(e.target.value),
            className: "bg-background resize-none",
            placeholder: t("adjustments.reverse_reason_placeholder") || "Reason for reversal..."
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: t("common.cancel") || "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          AlertDialogAction,
          {
            variant: "destructive",
            disabled: !reverseReason,
            onClick: handleReverseAdjustment,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { size: 14, className: "mr-1" }),
              " ",
              t("adjustments.reverse_action") || "Reverse"
            ]
          }
        )
      ] })
    ] }) })
  ] }) });
};
export {
  Adjustments as default
};
