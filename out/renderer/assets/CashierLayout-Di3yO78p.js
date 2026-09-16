import { c as createLucideIcon, O as useAuth, g as useSettings, r as reactExports, j as jsxRuntimeExports, bg as BrandedLogo, ay as DropdownMenu, az as DropdownMenuTrigger, i as Button, aA as ChevronDown, aB as DropdownMenuContent, bh as DropdownMenuLabel, bi as DropdownMenuSeparator, a$ as DropdownMenuItem, m as Badge, B as Bell, bj as Avatar, bk as AvatarImage, _ as resolveAvatar, bl as AvatarFallback, bm as LogOut, w as ShoppingCart, am as Receipt, U as Users, bn as NavLink, N as cn, Q as useLocation, aq as Dialog, ar as DialogContent, as as DialogHeader, at as DialogTitle, au as DialogDescription, H as toast, C as CircleCheck } from "./index-CqMtuUke.js";
import { u as useCashier, C as CashierProvider } from "./CashierContext-CjO_pK2c.js";
import { S as Store } from "./store-BKu7DJ5M.js";
import { C as CircleDollarSign } from "./circle-dollar-sign-DYjd5ZpJ.js";
import { B as Banknote } from "./banknote-CcpJx6pJ.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const CalendarClock = createLucideIcon("CalendarClock", [
  ["path", { d: "M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5", key: "1osxxc" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M3 10h5", key: "r794hk" }],
  ["path", { d: "M17.5 17.5 16 16.3V14", key: "akvzfd" }],
  ["circle", { cx: "16", cy: "16", r: "6", key: "qoo3c4" }]
]);
function CashierHeader({ onOpenShiftUi, onCloseShiftUi }) {
  const { currentAdmin, logout } = useAuth();
  const { register, registers, setRegister, shift, shiftLoading } = useCashier();
  const { t, currentBusiness } = useSettings();
  const [synced, setSynced] = reactExports.useState(true);
  reactExports.useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const st = await window.api?.syncStatus?.();
        if (mounted && st) setSynced(!st.offline);
      } catch {
        if (mounted) setSynced(true);
      }
    };
    check();
    const id = setInterval(check, 15e3);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);
  const initials = (currentAdmin?.name || "C").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const roleLabel = currentAdmin?.isEmployee ? (currentAdmin.roleKey || currentAdmin.role || "cashier").replace(/_/g, " ").toUpperCase() : t("common.profile", "Cashier");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-xl sticky top-0 z-40 px-4 lg:px-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-8 items-center justify-center rounded-xl bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BrandedLogo, { size: "xs", logoSrc: currentBusiness?.logo }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold tracking-tight hidden sm:block", children: currentBusiness?.businessName || "Shega" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "ml-2 h-9 gap-1.5 rounded-full border-border/60 text-xs font-semibold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Store, { className: "size-3.5 text-muted-foreground" }),
        register?.name || "No Register",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "size-3 text-muted-foreground" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "start", className: "w-56 rounded-xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuLabel, { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("cashier.select_register", "Select Register") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
        registers.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => setRegister(r), className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Store, { className: "size-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1", children: r.name }),
          register?.id === r.id && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "h-5 px-1.5 text-[10px]", children: "✓" })
        ] }, r.id)),
        registers.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuItem, { disabled: true, className: "text-sm text-muted-foreground", children: "No registers configured" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Badge,
      {
        variant: "outline",
        className: "ml-2 h-6 gap-1.5 rounded-full text-[11px] font-semibold border-border/60",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `size-1.5 rounded-full ${synced ? "bg-emerald-500" : "bg-amber-500"}` }),
          synced ? "Synced" : "Offline"
        ]
      }
    ),
    !shiftLoading && (shift ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "ghost",
        size: "sm",
        onClick: onCloseShiftUi,
        className: "ml-1 h-9 gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-semibold",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-1.5 rounded-full bg-emerald-500 animate-pulse" }),
          "Shift Open"
        ]
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "outline",
        size: "sm",
        onClick: onOpenShiftUi,
        className: "ml-1 h-9 gap-1.5 rounded-full text-xs font-semibold",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleDollarSign, { className: "size-3.5" }),
          "Open Shift"
        ]
      }
    )),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-auto flex items-center gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "size-9 rounded-full text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "size-[18px]" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "ml-1 flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-accent/60 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "size-7 rounded-full", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: resolveAvatar(currentAdmin?.avatar) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "bg-primary text-primary-foreground text-[10px] font-bold", children: initials })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden md:block text-left leading-tight", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-bold tracking-tight", children: currentAdmin?.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground uppercase tracking-widest", children: roleLabel })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "size-3 text-muted-foreground hidden md:block" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", className: "w-60 rounded-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuLabel, { className: "flex flex-col gap-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold", children: currentAdmin?.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
              "@",
              currentAdmin?.username
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
          register && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 py-2 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold uppercase tracking-widest text-muted-foreground", children: register.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5", children: shift ? `Shift open since ${new Date(shift.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "No open shift" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => shift ? onCloseShiftUi() : onOpenShiftUi(), className: "gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleDollarSign, { className: "size-4" }),
            shift ? t("cashier.close_shift", "Close Shift") : t("cashier.open_shift", "Open Shift")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            DropdownMenuItem,
            {
              className: "gap-2 text-destructive",
              onClick: logout,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "size-4" }),
                t("auth.logout", "Logout")
              ]
            }
          )
        ] })
      ] })
    ] })
  ] });
}
const POS_ICON_SIZE = 24;
const navItems = [
  { id: "pos", label: "POS", path: "/pos", icon: ShoppingCart, permission: "sales.create" },
  { id: "mySales", label: "My Sales", path: "/cashier/sales", icon: Receipt, permission: "sales.viewOwn" },
  { id: "customers", label: "Customers", path: "/cashier/customers", icon: Users, permission: "customers.view", module: "customers" }
];
function CashierNav() {
  const { hasPermission } = useAuth();
  const { isModuleEnabled } = useSettings();
  const filtered = navItems.filter((item) => {
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.module && !isModuleEnabled(item.module)) return false;
    return true;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "hidden md:flex w-20 shrink-0 flex-col items-center gap-3 border-r bg-background/60 py-4", children: filtered.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(RailButton, { item }, item.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "md:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch border-t bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]", children: filtered.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(MobileTab, { item }, item.id)) })
  ] });
}
function RailButton({ item }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    NavLink,
    {
      to: item.path,
      className: ({ isActive }) => cn(
        "relative flex size-14 items-center justify-center rounded-2xl transition-all duration-200",
        isActive ? "bg-foreground text-background shadow-lg shadow-foreground/20" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      ),
      children: ({ isActive }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { size: POS_ICON_SIZE, strokeWidth: isActive ? 2.4 : 2 }),
        isActive && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -left-1 h-5 w-1 rounded-full bg-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: item.label })
      ] })
    }
  );
}
function MobileTab({ item }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    NavLink,
    {
      to: item.path,
      className: cn(
        "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
        isActive ? "text-foreground" : "text-muted-foreground"
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { size: 22, strokeWidth: isActive ? 2.4 : 2 }),
        item.label
      ]
    }
  );
}
const QUICK_FLOATS = [0, 500, 1e3, 2e3, 5e3, 1e4];
function ShiftOpenModal({ open, onClose }) {
  const { register, openShift } = useCashier();
  const { currentAdmin } = useAuth();
  const [float, setFloat] = reactExports.useState("");
  const [submitting, setSubmitting] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (open) setFloat("");
  }, [open]);
  const greeting = (() => {
    const h = (/* @__PURE__ */ new Date()).getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();
  const handleOpen = async () => {
    setSubmitting(true);
    const res = await openShift(parseFloat(float) || 0);
    setSubmitting(false);
    if (res.success) {
      toast.success("Shift opened");
      onClose();
    } else {
      toast.error(res.error || "Failed to open shift");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: (o) => !o && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "rounded-3xl max-w-sm p-8 bg-card border-border/60", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarClock, { className: "size-7 text-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "text-2xl font-black tracking-tight", children: [
        greeting,
        ", ",
        currentAdmin?.name?.split(" ")[0]
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { className: "text-sm font-medium text-muted-foreground", children: [
        register?.name || "Main Register",
        " · Open a new shift"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: "Opening Cash" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleDollarSign, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "number",
              inputMode: "decimal",
              min: 0,
              value: float,
              onChange: (e) => setFloat(e.target.value),
              placeholder: "0",
              autoFocus: true,
              className: "h-12 w-full rounded-2xl border border-input bg-background pl-9 pr-4 text-lg font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: QUICK_FLOATS.map((q) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setFloat(String(q)),
          className: `h-9 rounded-xl border px-3 text-xs font-bold transition-colors ${parseFloat(float) === q ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50"}`,
          children: q.toLocaleString()
        },
        q
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "w-full h-12 rounded-2xl text-sm font-black uppercase tracking-[0.2em]", onClick: handleOpen, disabled: submitting, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Store, { className: "size-4" }),
        submitting ? "Opening…" : "Open Shift"
      ] })
    ] })
  ] }) });
}
const QUICK_COUNTS = [500, 1e3, 2e3, 5e3, 1e4];
function ShiftCloseModal({ open, onClose }) {
  const { shift, closeShift } = useCashier();
  const [counted, setCounted] = reactExports.useState("");
  const [summary, setSummary] = reactExports.useState(null);
  const [submitting, setSubmitting] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (open && shift) {
      setCounted("");
      setSummary(null);
      window.api?.shiftSummary?.(shift.id).then(setSummary).catch(() => setSummary(null));
    }
  }, [open, shift]);
  const expected = summary?.cashDrawer?.expected ?? shift?.expectedCash ?? 0;
  const countedNum = parseFloat(counted) || 0;
  const difference = countedNum - expected;
  const handleClose = async () => {
    setSubmitting(true);
    const res = await closeShift(countedNum);
    setSubmitting(false);
    if (res.success) {
      toast.success("Shift closed");
      onClose();
    } else {
      toast.error(res.error || "Failed to close shift");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: (o) => !o && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "rounded-3xl max-w-sm p-8 bg-card border-border/60", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { className: "size-7 text-amber-500" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-2xl font-black tracking-tight", children: "Close Shift" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { className: "text-sm font-medium text-muted-foreground", children: "Count the cash in the drawer and enter it below" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-4 py-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: "Expected Cash" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-lg font-black", children: [
          expected.toLocaleString(),
          " ETB"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: "Counted Cash" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "number",
            inputMode: "decimal",
            min: 0,
            value: counted,
            onChange: (e) => setCounted(e.target.value),
            placeholder: "0",
            autoFocus: true,
            className: "mt-1.5 h-12 w-full rounded-2xl border border-input bg-background px-4 text-lg font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: QUICK_COUNTS.map((q) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setCounted(String(q)),
          className: `h-9 rounded-xl border px-3 text-xs font-bold transition-colors ${countedNum === q ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`,
          children: q.toLocaleString()
        },
        q
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `flex items-center justify-between rounded-2xl border px-4 py-3 ${Number.isFinite(difference) && difference !== 0 ? difference < 0 ? "border-red-500/30 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5" : "border-border/60 bg-muted/30"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: "Difference" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-lg font-black ${difference < 0 ? "text-red-500" : difference > 0 ? "text-emerald-600" : ""}`, children: Number.isFinite(difference) ? `${difference >= 0 ? "+" : ""}${difference.toLocaleString()} ETB` : "—" })
          ]
        }
      ),
      summary && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-xs font-medium text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between py-0.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Sales" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: summary.counts?.sales ?? 0 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between py-0.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Revenue" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold", children: [
            (summary.totals?.total ?? 0).toLocaleString(),
            " ETB"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "w-full h-12 rounded-2xl text-sm font-black uppercase tracking-[0.2em]", onClick: handleClose, disabled: submitting, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-4" }),
        submitting ? "Closing…" : "Close Shift"
      ] })
    ] })
  ] }) });
}
function CashierLayout({ children }) {
  const [shiftModal, setShiftModal] = reactExports.useState(null);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CashierProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen w-full flex-col overflow-hidden bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      CashierHeader,
      {
        onOpenShiftUi: () => setShiftModal("open"),
        onCloseShiftUi: () => setShiftModal("close")
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CashierNav, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 overflow-y-auto scrollbar-apple pb-16 md:pb-0", children })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ShiftOpenModal, { open: shiftModal === "open", onClose: () => setShiftModal(null) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ShiftCloseModal, { open: shiftModal === "close", onClose: () => setShiftModal(null) })
  ] }) });
}
export {
  CashierLayout,
  CashierLayout as default
};
