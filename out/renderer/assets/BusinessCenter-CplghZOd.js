import { c as createLucideIcon, b as useSettings, r as reactExports, j as jsxRuntimeExports, aZ as LayoutDashboard, a_ as Store, ax as Building2, i as Badge, N as ShoppingCart, e as Button, C as CircleCheck, au as Users, R as RefreshCw, s as Trash2, aY as Lock, as as Check, a$ as Archive, M as Modal, J as Input, Q as toast } from "./index-C0Jx5v6F.js";
import { C as Card, c as CardContent, a as CardHeader, b as CardTitle } from "./card-CjgAuJMU.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-Br1nI3Mr.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dx0ONkN1.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-BqNqq2Wo.js";
import { B as BusinessHealthScore } from "./BusinessHealthScore-DMzA9z-J.js";
import { B as BusinessAssistant } from "./BusinessAssistant-CslXxDev.js";
import { M as MapPin } from "./map-pin-CsxxaOFS.js";
import { S as Smartphone } from "./smartphone-jSzF44Vo.js";
import { C as CircleDollarSign } from "./circle-dollar-sign-ABJ-BqPh.js";
import { T as TrendingUp } from "./trending-up-Dh0JhE0R.js";
import { C as Coins } from "./coins-DnSVdrx-.js";
import { P as Plus } from "./plus-6p1sfnA0.js";
import { P as Pen } from "./pen-Bq1nMlzs.js";
import { P as Pencil } from "./pencil-Dwitwm_k.js";
import { L as LockOpen } from "./lock-open-BhRX5v-r.js";
import "./alert-BeFK4pGw.js";
import "./circle-check-big-CjPYRZco.js";
import "./zap-DaPSO8cA.js";
import "./dollar-sign-Bl7iAsRL.js";
import "./calendar-days-CpZqd9Cn.js";
import "./activity-a96wrjtR.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const PackageSearch = createLucideIcon("PackageSearch", [
  [
    "path",
    {
      d: "M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14",
      key: "e7tb2h"
    }
  ],
  ["path", { d: "m7.5 4.27 9 5.15", key: "1c824w" }],
  ["polyline", { points: "3.29 7 12 12 20.71 7", key: "ousv84" }],
  ["line", { x1: "12", x2: "12", y1: "22", y2: "12", key: "a4e8g8" }],
  ["circle", { cx: "18.5", cy: "15.5", r: "2.5", key: "b5zd12" }],
  ["path", { d: "M20.27 17.27 22 19", key: "1l4muz" }]
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
const STATUS_BADGE = {
  active: { label: "Active", cls: "bg-green-500/15 text-green-600" },
  locked: { label: "Locked", cls: "bg-red-500/15 text-red-600" },
  disabled: { label: "Disabled", cls: "bg-gray-500/15 text-gray-500" },
  pending: { label: "Pending", cls: "bg-amber-500/15 text-amber-600" }
};
const fmt = (n) => (n ?? 0).toLocaleString(void 0, { maximumFractionDigits: 2 });
const BusinessCenter = () => {
  const { currentBusiness, switchBusiness } = useSettings();
  const [tab, setTab] = reactExports.useState("overview");
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
  const isOwner = access["*"] === true || access["business.manage"] === true;
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
  }, []);
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
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BusinessHealthScore, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx(BusinessAssistant, {})
          ] }),
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
    ] }) })
  ] });
};
export {
  BusinessCenter as default
};
