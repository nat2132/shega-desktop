import { c as createLucideIcon, b as useSettings, d as useNavigate, by as useSubscription, r as reactExports, j as jsxRuntimeExports, ab as ArrowLeft, e as Button, S as Sparkles, bz as PremiumBadge, g as Badge, bC as CheckCheck, ay as Copy, az as Building2, ae as CreditCard, V as Input, L as LoaderCircle, aw as Check, _ as toast } from "./index-fMHJoXSU.js";
import { C as Card, c as CardContent, a as CardHeader, b as CardTitle, d as CardDescription } from "./card-MDpMDtbv.js";
import { P as Phone } from "./phone-BVCbc8eV.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Smartphone = createLucideIcon("Smartphone", [
  ["rect", { width: "14", height: "20", x: "5", y: "2", rx: "2", ry: "2", key: "1yt0o3" }],
  ["path", { d: "M12 18h.01", key: "mhygvu" }]
]);
const SubscriptionPayment = () => {
  const { t, formatDate } = useSettings();
  const navigate = useNavigate();
  const { subscription, refresh } = useSubscription();
  const [plans, setPlans] = reactExports.useState([]);
  const [selectedPlan, setSelectedPlan] = reactExports.useState(null);
  const [step, setStep] = reactExports.useState("select");
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [copied, setCopied] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({
    transactionId: "",
    businessName: "",
    phoneNumber: "",
    paymentDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    notes: ""
  });
  reactExports.useEffect(() => {
    window.api.getSubscriptionPlans().then(setPlans);
  }, []);
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setForm((prev) => ({ ...prev, businessName: "", phoneNumber: "" }));
    setStep("pay");
  };
  const handleSubmit = async () => {
    if (!form.transactionId.trim() || !form.businessName.trim() || !form.phoneNumber.trim()) {
      toast.error(t("subscription.please_fill_required"));
      return;
    }
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      const result = await window.api.submitPayment({
        transactionId: form.transactionId.trim(),
        businessName: form.businessName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        selectedPlan: selectedPlan.name,
        amount: selectedPlan.price,
        paymentDate: form.paymentDate,
        notes: form.notes.trim() || void 0
      });
      if (result.success) {
        setStep("done");
        toast.success(t("subscription.payment_submitted"));
        await refresh();
      }
    } catch (err) {
      toast.error(err.message || t("subscription.submission_failed"));
    } finally {
      setSubmitting(false);
    }
  };
  const copyNumber = () => {
    navigator.clipboard.writeText("09XX XXX XXX");
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  if (step === "select") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => navigate("/subscription"), className: "flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-3 w-3" }),
        t("common.go_back")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-black uppercase tracking-tight", children: t("subscription.pricing") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-widest text-muted-foreground", children: t("subscription.compare_plans") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("subscription.basic_plan") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground mb-2", children: t("subscription.basic_desc") }),
          plans.filter((p) => p.tier === "basic").map((plan) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-2xl border-border/50 cursor-pointer hover:border-primary/30 transition-all", onClick: () => handleSelectPlan(plan), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-1", children: plan.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-3xl font-black", children: [
              plan.price.toLocaleString(),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground font-bold", children: t("subscription.etb") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground mt-2", children: plan.description }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", className: "mt-4 rounded-xl text-xs font-black uppercase tracking-widest w-full", children: t("subscription.choose_plan") })
          ] }) }, plan.id))
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-amber-500", children: t("subscription.premium_plan") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3 text-amber-500" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground mb-2", children: t("subscription.premium_desc") }),
          plans.filter((p) => p.tier === "premium").map((plan) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-2xl border-amber-500/20 bg-gradient-to-b from-amber-500/[0.02] to-transparent cursor-pointer hover:border-amber-500/40 transition-all", onClick: () => handleSelectPlan(plan), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-amber-500", children: plan.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(PremiumBadge, { size: "sm" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-3xl font-black", children: [
              plan.price.toLocaleString(),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground font-bold", children: t("subscription.etb") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground mt-2", children: plan.description }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", className: "mt-4 rounded-xl text-xs font-black uppercase tracking-widest w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700", children: t("subscription.choose_plan") })
          ] }) }, plan.id))
        ] })
      ] })
    ] });
  }
  if (step === "pay") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 p-6 max-w-2xl mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setStep("select"), className: "flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-3 w-3" }),
        t("common.go_back")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-black uppercase tracking-tight", children: t("subscription.billing") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-widest text-muted-foreground", children: selectedPlan?.name })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-2xl border-border/50 bg-gradient-to-b from-primary/[0.02] to-transparent", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2.5 rounded-xl bg-emerald-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "h-5 w-5 text-emerald-500" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest", children: t("subscription.telebirr") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("subscription.payment_instruction_desc") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-2xl bg-muted/30 border border-border/50 mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("subscription.payment_method") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-emerald-500/20", children: t("subscription.telebirr") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xl font-black", children: [
              selectedPlan?.price.toLocaleString(),
              " ",
              t("subscription.etb")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground", children: selectedPlan?.name })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-3.5 w-3.5 text-muted-foreground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-medium", children: t("subscription.telebirr_number") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: copyNumber, className: "flex items-center gap-1 text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors", children: [
              copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCheck, { className: "h-3 w-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3 w-3" }),
              copied ? t("subscription.copied") : t("subscription.copy")
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 rounded-xl bg-muted/20 border border-border/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-3.5 w-3.5 text-muted-foreground shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-medium", children: t("subscription.telebirr_name") })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-2xl border-border/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "p-5 pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-xs font-black uppercase tracking-widest flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-3.5 w-3.5" }),
            t("subscription.submit_payment")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-xs", children: t("subscription.pending_verification") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5 pt-2 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5", children: [
              t("subscription.transaction_id"),
              " *"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                placeholder: t("subscription.transaction_id_placeholder"),
                value: form.transactionId,
                onChange: (e) => setForm((prev) => ({ ...prev, transactionId: e.target.value })),
                className: "rounded-xl text-[11px]"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5", children: [
              t("subscription.business_name"),
              " *"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                placeholder: t("subscription.business_name_placeholder"),
                value: form.businessName,
                onChange: (e) => setForm((prev) => ({ ...prev, businessName: e.target.value })),
                className: "rounded-xl text-[11px]"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5", children: [
              t("subscription.phone_number"),
              " *"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                placeholder: t("subscription.phone_placeholder"),
                value: form.phoneNumber,
                onChange: (e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value })),
                className: "rounded-xl text-[11px]"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5", children: t("subscription.payment_date") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "date",
                value: form.paymentDate,
                onChange: (e) => setForm((prev) => ({ ...prev, paymentDate: e.target.value })),
                className: "rounded-xl text-[11px]"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5", children: t("subscription.optional_notes") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                placeholder: t("subscription.optional_notes"),
                value: form.notes,
                onChange: (e) => setForm((prev) => ({ ...prev, notes: e.target.value })),
                className: "rounded-xl text-[11px]"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: handleSubmit,
              disabled: submitting,
              className: "w-full rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 mt-2",
              children: submitting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 animate-spin mr-1" }),
                " ",
                t("subscription.cancelling")
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3 mr-1" }),
                " ",
                t("subscription.submit")
              ] })
            }
          )
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6 p-6 max-w-lg mx-auto text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-16", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-500/10 mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-10 w-10 text-emerald-500" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-black uppercase tracking-tight mb-2", children: t("subscription.payment_submitted") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground mb-2", children: t("subscription.approval_notification") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-500 font-bold", children: t("subscription.pending_verification") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 justify-center mt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          onClick: () => navigate("/subscription"),
          className: "rounded-xl text-xs font-black uppercase tracking-widest",
          children: t("subscription.subscription_management")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: () => {
            setStep("select");
            setSelectedPlan(null);
            setForm({ transactionId: "", businessName: "", phoneNumber: "", paymentDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0], notes: "" });
          },
          className: "rounded-xl text-xs font-black uppercase tracking-widest",
          children: t("subscription.submit_payment")
        }
      )
    ] })
  ] }) });
};
export {
  SubscriptionPayment as default
};
