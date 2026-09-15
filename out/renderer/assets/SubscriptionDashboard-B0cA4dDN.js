import { c as createLucideIcon, g as useSettings, h as useNavigate, Q as useLocation, ba as useSubscription, r as reactExports, j as jsxRuntimeExports, L as LoaderCircle, bb as PremiumBadge, i as Button, n as RefreshCw, S as Sparkles, aX as Crown, aH as Shield, o as Clock, A as ArrowRight, T as TriangleAlert, ao as CreditCard, bc as CircleHelp, m as Badge, C as CircleCheck, aW as Hourglass } from "./index-wvHtiMql.js";
import { C as Card, c as CardContent, a as CardHeader, b as CardTitle } from "./card-BnskyD18.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-DerxGOpk.js";
import { C as Calendar } from "./calendar-CzPOudN_.js";
import { C as CircleX } from "./circle-x-B7R5IuPx.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Gift = createLucideIcon("Gift", [
  ["rect", { x: "3", y: "8", width: "18", height: "4", rx: "1", key: "bkv52" }],
  ["path", { d: "M12 8v13", key: "1c76mn" }],
  ["path", { d: "M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7", key: "6wjy6b" }],
  [
    "path",
    {
      d: "M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5",
      key: "1ihvrl"
    }
  ]
]);
const SubscriptionDashboard = () => {
  const { t, formatDate } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const { subscription, renewalInfo, isPremium, isTrial, daysRemaining, refresh } = useSubscription();
  const [plans, setPlans] = reactExports.useState([]);
  const [transactions, setTransactions] = reactExports.useState([]);
  const [history, setHistory] = reactExports.useState([]);
  const [activeTab, setActiveTab] = reactExports.useState("overview");
  const [loading, setLoading] = reactExports.useState(true);
  const lockedFeature = location.state?.lockedFeature;
  reactExports.useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    setLoading(true);
    try {
      const [p, tx, h] = await Promise.all([
        window.api.getSubscriptionPlans(),
        window.api.getPaymentTransactions(),
        window.api.getSubscriptionHistory()
      ]);
      setPlans(p || []);
      setTransactions(tx || []);
      setHistory(h || []);
    } catch (err) {
      console.error("Failed to load subscription data:", err);
    } finally {
      setLoading(false);
    }
  };
  const trialDaysLeft = subscription?.trialEndsAt ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1e3 * 60 * 60 * 24))) : 0;
  const statusBadge = (status) => {
    const variants = {
      active: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CircleCheck, label: t("premium.active") },
      pending: { color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Hourglass, label: t("subscription.payment_pending") },
      rejected: { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: CircleX, label: t("subscription.payment_rejected") },
      expired: { color: "bg-muted text-muted-foreground border-border/50", icon: TriangleAlert, label: t("premium.expired") }
    };
    const v = variants[status] || variants.active;
    const Icon = v.icon;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: `text-xs font-black uppercase tracking-widest ${v.color}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-2.5 w-2.5 mr-1" }),
      v.label
    ] });
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-full py-32", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("subscription.loading") })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-black uppercase tracking-tight", children: t("subscription.title") }),
          isPremium && /* @__PURE__ */ jsxRuntimeExports.jsx(PremiumBadge, { size: "md" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-widest text-muted-foreground", children: t("subscription.subtitle") })
      ] }),
      daysRemaining > 0 && daysRemaining <= 7 && !isTrial && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: () => navigate("/subscription/payment"),
          className: "rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
          children: [
            t("subscription.renew"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3 w-3 ml-1" })
          ]
        }
      )
    ] }),
    lockedFeature && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-2xl border-amber-500/20 bg-gradient-to-r from-amber-500/[0.04] to-transparent", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-full bg-amber-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-5 w-5 text-amber-500" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-amber-500", children: t("premium.locked_title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
          t("premium.locked_desc"),
          " ",
          t("subscription.upgrade_access", { feature: lockedFeature }).replace("{{feature}}", lockedFeature)
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: () => setActiveTab("plans"),
          size: "sm",
          className: "rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-amber-600",
          children: t("subscription.compare_plans")
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "rounded-2xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "overview", className: "text-xs font-black uppercase tracking-widest rounded-xl", children: t("subscription.current_plan") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "plans", className: "text-xs font-black uppercase tracking-widest rounded-xl", children: t("subscription.pricing") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "payments", className: "text-xs font-black uppercase tracking-widest rounded-xl", children: t("subscription.payment_history") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "history", className: "text-xs font-black uppercase tracking-widest rounded-xl", children: t("subscription.subscription_history") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "overview", className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-2xl border-border/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "p-4 pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-3 w-3" }),
              t("subscription.plan")
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4 pt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-black", children: isTrial ? t("subscription.trial_plan") : isPremium ? t("subscription.premium_plan") : t("subscription.basic_plan") }),
              isPremium && /* @__PURE__ */ jsxRuntimeExports.jsx(PremiumBadge, { size: "sm" })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-2xl border-border/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "p-4 pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-3 w-3" }),
              t("subscription.status")
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4 pt-0", children: statusBadge(subscription?.status || "expired") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-2xl border-border/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "p-4 pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
              t("subscription.days_remaining")
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 pt-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-black", children: isTrial ? trialDaysLeft : daysRemaining }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground ml-1", children: t("premium.days_remaining", { days: String(isTrial ? trialDaysLeft : daysRemaining) }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-2xl border-border/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "p-4 pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3 w-3" }),
              t("subscription.expiry_date")
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4 pt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold", children: subscription?.expiresAt ? formatDate(subscription.expiresAt) : "--" }) })
          ] })
        ] }),
        isTrial && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-2xl border-amber-500/20 bg-gradient-to-r from-amber-500/[0.04] to-transparent", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-full bg-amber-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Gift, { className: "h-5 w-5 text-amber-500" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-amber-500", children: t("subscription.trial_heading") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: t("premium.trial_ends", { date: subscription?.trialEndsAt ? formatDate(subscription.trialEndsAt) : "--" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => navigate("/subscription/payment"),
              className: "rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
              children: [
                t("subscription.upgrade_now"),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3 ml-1" })
              ]
            }
          )
        ] }) }),
        daysRemaining <= 7 && daysRemaining > 0 && !isTrial && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-2xl border-red-500/20 bg-gradient-to-r from-red-500/[0.04] to-transparent", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-full bg-red-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-5 w-5 text-red-500" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-red-500", children: t("subscription.expires_soon", { plan: isPremium ? t("subscription.premium_plan") : t("subscription.basic_plan"), days: String(daysRemaining) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: t("subscription.renew_desc") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: () => navigate("/subscription/payment"),
              variant: "outline",
              size: "sm",
              className: "ml-auto rounded-xl text-xs font-black uppercase tracking-widest",
              children: t("subscription.renew")
            }
          )
        ] }) }),
        subscription?.status === "expired" && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-2xl border-red-500/20 bg-gradient-to-r from-red-500/[0.04] to-transparent", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-full bg-red-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-5 w-5 text-red-500" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-red-500", children: t("subscription.expired_message") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-2xl border-border/50 cursor-pointer hover:bg-muted/30 transition-all", onClick: () => navigate("/subscription/payment"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-full bg-amber-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-5 w-5 text-amber-500" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest", children: t("subscription.billing") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                t("subscription.renew"),
                " / ",
                t("subscription.upgrade")
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 text-muted-foreground ml-auto" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-2xl border-border/50 cursor-pointer hover:bg-muted/30 transition-all", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleHelp, { className: "h-5 w-5 text-muted-foreground" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest", children: t("subscription.support") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("subscription.support_url") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 text-muted-foreground ml-auto" })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "plans", className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("subscription.basic_plan") }),
          plans.filter((p) => p.tier === "basic").map((plan) => {
            const isCurrent = subscription?.planId === plan.id || !isPremium && !isTrial;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: `rounded-2xl border-border/50 transition-all ${isCurrent ? "ring-1 ring-primary/20" : ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: plan.name }),
                isCurrent && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-emerald-500/20", children: t("subscription.current") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-black", children: [
                plan.price.toLocaleString(),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground font-bold", children: t("subscription.etb") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: plan.description }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  onClick: () => navigate("/subscription/payment"),
                  variant: isCurrent ? "outline" : "default",
                  size: "sm",
                  className: "mt-3 rounded-xl text-xs font-black uppercase tracking-widest w-full",
                  children: isCurrent ? t("subscription.current") : t("subscription.choose_plan")
                }
              )
            ] }) }, plan.id);
          })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-amber-500", children: t("subscription.premium_plan") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3 text-amber-500" })
          ] }),
          plans.filter((p) => p.tier === "premium").map((plan) => {
            const isCurrent = subscription?.planId === plan.id;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: `rounded-2xl border-amber-500/20 bg-gradient-to-b from-amber-500/[0.02] to-transparent transition-all ${isCurrent ? "ring-1 ring-amber-500/30" : ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-amber-500", children: plan.name }),
                isCurrent ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-emerald-500/20", children: t("subscription.current") }) : /* @__PURE__ */ jsxRuntimeExports.jsx(PremiumBadge, { size: "sm" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-black", children: [
                plan.price.toLocaleString(),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground font-bold", children: t("subscription.etb") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: plan.description }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  onClick: () => navigate("/subscription/payment"),
                  size: "sm",
                  className: "mt-3 rounded-xl text-xs font-black uppercase tracking-widest w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
                  children: isCurrent ? t("subscription.current") : t("subscription.choose_plan")
                }
              )
            ] }) }, plan.id);
          })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "payments", className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("subscription.transaction_history") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => navigate("/subscription/payment"),
              size: "sm",
              className: "rounded-xl text-xs font-black uppercase tracking-widest",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-3 w-3 mr-1" }),
                t("subscription.submit_payment")
              ]
            }
          )
        ] }),
        transactions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-2xl border-border/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-8 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-8 w-8 text-muted-foreground mx-auto mb-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("subscription.no_transactions") })
        ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: transactions.map((tx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-2xl border border-border/50 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-2 rounded-full ${tx.status === "approved" ? "bg-emerald-500/10" : tx.status === "rejected" ? "bg-red-500/10" : "bg-amber-500/10"}`, children: tx.status === "approved" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 text-emerald-500" }) : tx.status === "rejected" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4 text-red-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Hourglass, { className: "h-4 w-4 text-amber-500" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest", children: tx.selectedPlan }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                tx.transactionId,
                " · ",
                formatDate(tx.createdAt)
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] font-bold", children: [
              tx.amount.toLocaleString(),
              " ",
              t("subscription.etb")
            ] }),
            statusBadge(tx.status),
            tx.adminNotes && tx.status === "rejected" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-red-400 mt-0.5", children: tx.adminNotes })
          ] })
        ] }, tx.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "history", className: "space-y-4", children: history.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-2xl border-border/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-8 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-8 w-8 text-muted-foreground mx-auto mb-2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("subscription.no_subscription_history") })
      ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: history.map((h) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl border border-border/50 flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold", children: h.action.replace(/_/g, " ") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground truncate", children: h.details })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground shrink-0", children: formatDate(h.createdAt) })
      ] }, h.id)) }) })
    ] })
  ] });
};
export {
  SubscriptionDashboard as default
};
