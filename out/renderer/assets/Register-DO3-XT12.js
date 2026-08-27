import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, ap as cn, b as useSettings, g as Badge, a9 as Search, e as Button, X, v as Receipt, ae as CreditCard } from "./index-fMHJoXSU.js";
import { P as Plus } from "./plus-DnJWnBIF.js";
import { Z as Zap } from "./zap-Bd36I3YH.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Coins = createLucideIcon("Coins", [
  ["circle", { cx: "8", cy: "8", r: "6", key: "3yglwk" }],
  ["path", { d: "M18.09 10.37A6 6 0 1 1 10.34 18", key: "t5s6rm" }],
  ["path", { d: "M7 6h1v4", key: "1obek4" }],
  ["path", { d: "m16.71 13.88.7.71-2.82 2.82", key: "1rbuyh" }]
]);
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Minus = createLucideIcon("Minus", [["path", { d: "M5 12h14", key: "1ays0h" }]]);
const variantStyles = {
  display: "text-4xl font-black tracking-tight",
  h1: "text-3xl font-black tracking-tight",
  h2: "text-2xl font-bold tracking-tight",
  h3: "text-xl font-bold tracking-tight",
  h4: "text-lg font-bold tracking-tight",
  h5: "text-base font-bold tracking-tight",
  h6: "text-sm font-bold tracking-tight",
  title: "text-lg font-bold",
  body: "text-base",
  "body-sm": "text-sm",
  caption: "text-xs text-muted-foreground",
  label: "text-sm font-medium text-muted-foreground"
};
const weightStyles = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold"
};
const alignStyles = {
  left: "text-left",
  center: "text-center",
  right: "text-right"
};
const AppText = reactExports.forwardRef(
  ({
    variant = "body",
    weight = "normal",
    color,
    numberOfLines,
    align,
    className,
    style,
    children,
    ...props
  }, ref) => {
    const lineClampStyle = numberOfLines ? {
      display: "-webkit-box",
      WebkitLineClamp: numberOfLines,
      WebkitBoxOrient: "vertical",
      overflow: "hidden"
    } : {};
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        ref,
        className: cn(
          "inline-block",
          variantStyles[variant],
          weightStyles[weight],
          align && alignStyles[align],
          className
        ),
        style: {
          ...lineClampStyle,
          color,
          ...style
        },
        ...props,
        children
      }
    );
  }
);
AppText.displayName = "AppText";
const CATEGORIES = [
  { id: 0, name: "All" },
  { id: 1, name: "Beverages" },
  { id: 2, name: "Snacks" },
  { id: 3, name: "Dairy" },
  { id: 4, name: "Bakery" },
  { id: 5, name: "Produce" },
  { id: 6, name: "Household" }
];
const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: Cash, shortcut: "F4" },
  { id: "card", label: "Card", icon: CreditCard, shortcut: "F5" },
  { id: "mobile", label: "Mobile", icon: Zap, shortcut: "F6" }
];
function Register() {
  const { t, colors } = useSettings();
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [selectedCategory, setSelectedCategory] = reactExports.useState(0);
  const [cart, setCart] = reactExports.useState([]);
  const [paymentMethod, setPaymentMethod] = reactExports.useState("cash");
  const [cashTendered, setCashTendered] = reactExports.useState("");
  const [items, setItems] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [showPayment, setShowPayment] = reactExports.useState(false);
  const searchInputRef = reactExports.useRef(null);
  const barcodeInputRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    loadItems();
  }, []);
  const loadItems = async () => {
    try {
      const result = await window.api?.getItems?.({ limit: 500 });
      if (result?.data) {
        setItems(result.data);
      } else if (Array.isArray(result)) {
        setItems(result);
      }
    } catch (e) {
      console.error("Failed to load items:", e);
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case "F2":
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case "F4":
          e.preventDefault();
          if (cart.length > 0) {
            setShowPayment(true);
            setPaymentMethod("cash");
          }
          break;
        case "F5":
          e.preventDefault();
          if (cart.length > 0) {
            setShowPayment(true);
            setPaymentMethod("card");
          }
          break;
        case "F6":
          e.preventDefault();
          if (cart.length > 0) {
            setShowPayment(true);
            setPaymentMethod("mobile");
          }
          break;
        case "Escape":
          if (showPayment) {
            setShowPayment(false);
          }
          break;
        case "Enter":
          if (barcodeInputRef.current === document.activeElement) {
            handleBarcodeScan();
          }
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart.length, showPayment]);
  const filteredItems = reactExports.useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) || item.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 0 || item.categoryId === selectedCategory;
      return matchesSearch && matchesCategory && item.totalBaseQuantity > 0;
    });
  }, [items, searchQuery, selectedCategory]);
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        if (existing.qty >= item.totalBaseQuantity) return prev;
        return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, {
        ...item,
        qty: 1,
        discount: 0,
        taxRate: 0.15
      }];
    });
    setSearchQuery("");
    searchInputRef.current?.focus();
  };
  const updateQty = (itemId, delta) => {
    setCart((prev) => prev.map((c) => {
      if (c.id !== itemId) return c;
      const newQty = Math.max(1, c.qty + delta);
      const itemData = items.find((i) => i.id === itemId);
      if (itemData && newQty > itemData.totalBaseQuantity) return c;
      return { ...c, qty: newQty };
    }));
  };
  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((c) => c.id !== itemId));
  };
  const updateDiscount = (itemId, discount) => {
    setCart((prev) => prev.map((c) => c.id === itemId ? { ...c, discount: Math.max(0, discount) } : c));
  };
  const subtotal = cart.reduce((sum, item) => sum + (item.baseSalePrice - item.discount) * item.qty, 0);
  const tax = cart.reduce((sum, item) => sum + (item.baseSalePrice - item.discount) * item.qty * item.taxRate, 0);
  const total = subtotal + tax;
  const change = paymentMethod === "cash" ? Math.max(0, parseFloat(cashTendered) - total) : 0;
  const handleBarcodeScan = () => {
    const barcode = barcodeInputRef.current?.value?.trim();
    if (!barcode) return;
    const item = items.find((i) => i.barcode === barcode || i.sku === barcode);
    if (item) {
      addToCart(item);
      barcodeInputRef.current.value = "";
    }
  };
  const handlePayment = async () => {
    if (cart.length === 0) return;
    try {
      const saleItems = cart.map((item) => ({
        itemId: item.id,
        qty: item.qty,
        unitPrice: item.baseSalePrice,
        discount: item.discount,
        taxRate: item.taxRate
      }));
      const result = await window.api?.createSale?.({
        items: saleItems,
        paymentMethod,
        cashTendered: paymentMethod === "cash" ? parseFloat(cashTendered) : void 0
      });
      if (result?.success) {
        setCart([]);
        setCashTendered("");
        setShowPayment(false);
      }
    } catch (e) {
      console.error("Sale failed:", e);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full flex-col bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b bg-card sticky top-0 z-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AppText, { variant: "h4", weight: "bold", className: "text-foreground", children: t("register.title") || "POS Register" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", className: "text-xs", children: [
          cart.length,
          " ",
          t("register.items") || "items"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden md:flex items-center gap-1 px-2 py-1 bg-muted rounded-lg text-xs text-muted-foreground font-mono", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("kbd", { className: "px-1.5 py-0.5 bg-background rounded border", children: "F2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Search" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("kbd", { className: "px-1.5 py-0.5 bg-background rounded border", children: "F4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Cash" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("kbd", { className: "px-1.5 py-0.5 bg-background rounded border", children: "F5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Card" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("kbd", { className: "px-1.5 py-0.5 bg-background rounded border", children: "F6" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Mobile" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-b bg-card flex flex-col gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground", size: 20 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: searchInputRef,
                type: "text",
                placeholder: t("register.search_placeholder") || "Search items, scan barcode...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "w-full pl-10 pr-4 py-3 bg-background border rounded-xl text-lg focus:ring-2 focus:ring-primary focus:border-transparent",
                autoFocus: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 overflow-x-auto pb-2", children: CATEGORIES.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setSelectedCategory(cat.id),
              className: `px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat.id ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted text-muted-foreground hover:bg-muted/80"}`,
              children: cat.name
            },
            cat.id
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto p-4", children: filteredItems.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-full text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-12 w-12 mb-4 opacity-30" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AppText, { variant: "body", weight: "medium", children: searchQuery ? t("register.no_results") || "No items found" : t("register.no_items") || "No items available" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3", children: filteredItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => addToCart(item),
            disabled: item.totalBaseQuantity <= 0,
            className: `relative p-3 rounded-xl border-2 transition-all text-left ${item.totalBaseQuantity <= 0 ? "bg-muted/50 border-muted text-muted-foreground opacity-50 cursor-not-allowed" : "bg-card border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-base mb-1 line-clamp-1", children: item.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground mb-2", children: item.categoryName }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AppText, { variant: "h5", weight: "bold", className: "text-foreground", children: [
                  item.baseSalePrice.toLocaleString(),
                  " ETB"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                  "Stock: ",
                  item.totalBaseQuantity
                ] })
              ] }),
              item.totalBaseQuantity <= 10 && item.totalBaseQuantity > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-2 right-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "destructive", className: "text-xs", children: "Low Stock" }) })
            ]
          },
          item.id
        )) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full md:w-96 lg:w-[380px] xl:w-[420px] border-l bg-card flex flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-b flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AppText, { variant: "h4", weight: "bold", children: t("register.cart") || "Cart" }),
          cart.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => setCart([]), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto p-4", children: cart.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-full text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "h-12 w-12 mb-4 opacity-30" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AppText, { variant: "body", weight: "medium", className: "text-center px-4", children: t("register.empty_cart") || "Cart is empty. Tap items to add." })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: cart.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 p-3 bg-background rounded-xl border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AppText, { variant: "body", weight: "medium", className: "truncate", children: item.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AppText, { variant: "caption", className: "text-muted-foreground", children: [
                item.baseSalePrice.toLocaleString(),
                " ETB × ",
                item.qty
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AppText, { variant: "body", weight: "bold", className: "text-foreground whitespace-nowrap", children: [
              (item.baseSalePrice - item.discount) * item.qty,
              " ETB"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "icon",
                className: "h-8 w-8",
                onClick: () => updateQty(item.id, -1),
                disabled: item.qty <= 1,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-12 text-center font-mono text-lg", children: item.qty }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "icon",
                className: "h-8 w-8",
                onClick: () => updateQty(item.id, 1),
                disabled: items.find((i) => i.id === item.id)?.totalBaseQuantity <= item.qty,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                min: "0",
                step: "0.01",
                max: item.baseSalePrice * item.qty,
                value: item.discount,
                onChange: (e) => updateDiscount(item.id, parseFloat(e.target.value) || 0),
                className: "w-24 px-2 py-1 text-sm bg-background border rounded-lg text-right focus:ring-2 focus:ring-primary",
                placeholder: "Disc."
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                className: "h-8 w-8 text-destructive hover:text-destructive",
                onClick: () => removeFromCart(item.id),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
              }
            )
          ] })
        ] }, item.id)) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-t space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: t("register.subtotal") || "Subtotal" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                subtotal.toLocaleString(),
                " ETB"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: t("register.tax") || "Tax (15%)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                tax.toLocaleString(),
                " ETB"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-lg font-bold border-t pt-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("register.total") || "Total" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-primary", children: [
                total.toLocaleString(),
                " ETB"
              ] })
            ] })
          ] }),
          cart.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                className: "w-full h-12 text-lg",
                onClick: () => {
                  setShowPayment(true);
                  setPaymentMethod("cash");
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Coins, { className: "h-5 w-5 mr-2" }),
                  t("register.pay_cash") || "Pay Cash",
                  " — F4"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                className: "w-full h-12 text-lg",
                onClick: () => {
                  setShowPayment(true);
                  setPaymentMethod("card");
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-5 w-5 mr-2" }),
                  t("register.pay_card") || "Pay Card",
                  " — F5"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                className: "w-full h-12 text-lg",
                onClick: () => {
                  setShowPayment(true);
                  setPaymentMethod("mobile");
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-5 w-5 mr-2" }),
                  t("register.pay_mobile") || "Mobile Pay",
                  " — F6"
                ]
              }
            )
          ] }),
          showPayment && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-4 space-y-4 animate-slide-down", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AppText, { variant: "h5", weight: "bold", children: t("register.payment") || "Payment" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowPayment(false), className: "p-1 hover:bg-muted rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: PAYMENT_METHODS.map((pm) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setPaymentMethod(pm.id),
                className: `flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 transition-all ${paymentMethod === pm.id ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border hover:border-primary/50"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(pm.icon, { className: "h-5 w-5" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: pm.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("kbd", { className: "px-1.5 py-0.5 bg-background/50 rounded text-xs", children: pm.shortcut })
                ]
              },
              pm.id
            )) }),
            paymentMethod === "cash" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-1", children: t("register.cash_tendered") || "Cash Tendered" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "number",
                  step: "0.01",
                  min: total,
                  value: cashTendered,
                  onChange: (e) => setCashTendered(e.target.value),
                  className: "w-full px-4 py-3 text-2xl font-bold text-center bg-background border rounded-xl focus:ring-2 focus:ring-primary",
                  placeholder: total.toLocaleString(),
                  autoFocus: true
                }
              ),
              cashTendered && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 p-3 bg-green-50 border border-green-200 rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-800", children: t("register.change") || "Change" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-green-800", children: [
                  change.toFixed(2),
                  " ETB"
                ] })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                className: "w-full h-12 text-lg",
                onClick: handlePayment,
                disabled: paymentMethod === "cash" && parseFloat(cashTendered) < total,
                children: t("register.complete_sale") || "Complete Sale"
              }
            )
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  Register as default
};
