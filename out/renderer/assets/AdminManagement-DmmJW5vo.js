import { c as createLucideIcon, o as useAuth, b as useSettings, r as reactExports, j as jsxRuntimeExports, an as cn, aX as Crown, g as Badge, e as Button, n as Trash2, M as Modal, Q as Input, aY as EyeOff, x as Eye } from "./index-DoaPTPLA.js";
import { A as AlertDialog, h as AlertDialogTrigger, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-CAXFI8Ai.js";
import { S as SectionCards } from "./section-cards-CHIlg7qj.js";
import { D as DataTable } from "./data-table-DBQNsdRD.js";
import { P as Pencil } from "./pencil-BW7VK2r1.js";
import { P as Plus } from "./plus-ClRw4fRK.js";
import "./card-C2UHyBgb.js";
import "./label-9m1zGceD.js";
import "./select-BsHDszHT.js";
import "./table-CWhyIvlh.js";
import "./tabs-sqIKqPQW.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Power = createLucideIcon("Power", [
  ["path", { d: "M12 2v10", key: "mnfbl" }],
  ["path", { d: "M18.4 6.6a9 9 0 1 1-12.77.04", key: "obofu9" }]
]);
const ALL_PERMISSIONS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "inventory", label: "Inventory", icon: "📦" },
  { id: "sales", label: "Sales", icon: "🛒" },
  { id: "expenses", label: "Expenses", icon: "💰" },
  { id: "customers", label: "Customers", icon: "👥" },
  { id: "analytics", label: "Analytics", icon: "📈" },
  { id: "adjustments", label: "Adjustments", icon: "⚙️" },
  { id: "settings", label: "Settings", icon: "🔧" }
];
const AdminManagement = () => {
  const { currentAdmin } = useAuth();
  const { t } = useSettings();
  const [admins, setAdmins] = reactExports.useState([]);
  const [showModal, setShowModal] = reactExports.useState(false);
  const [editingAdmin, setEditingAdmin] = reactExports.useState(null);
  const [showPin, setShowPin] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const [formData, setFormData] = reactExports.useState({
    name: "",
    username: "",
    pin: "",
    confirmPin: "",
    permissions: []
  });
  reactExports.useEffect(() => {
    loadAdmins();
  }, []);
  const loadAdmins = async () => {
    try {
      const data = await window.api?.getAdmins();
      setAdmins(data || []);
    } catch (error2) {
      console.error("Failed to load admins:", error2);
    }
  };
  const kpiCards = reactExports.useMemo(() => {
    const total = admins.length;
    const active = admins.filter((a) => a.isActive).length;
    const superAdmins = admins.filter((a) => a.role === "super_admin").length;
    const avgPerms = active > 0 ? Math.round(admins.filter((a) => a.role !== "super_admin").reduce((sum, a) => sum + a.permissions.length, 0) / Math.max(admins.filter((a) => a.role !== "super_admin").length, 1)) : 0;
    return [
      {
        title: t("admin.total_operators"),
        value: total,
        trend: t("settings.active"),
        trendType: "up",
        footerTitle: t("admin.system_accounts"),
        footerSub: t("admin.all_admins")
      },
      {
        title: t("admin.active_sessions"),
        value: active,
        trend: `${total - active} ${t("admin.inactive")}`,
        trendType: "up",
        footerTitle: t("admin.operational_capacity"),
        footerSub: t("admin.currently_enabled")
      },
      {
        title: t("admin.super_admins"),
        value: superAdmins,
        trend: t("admin.protected"),
        trendType: "up",
        footerTitle: t("admin.root_access"),
        footerSub: t("admin.highest_privilege")
      },
      {
        title: t("admin.avg_permissions"),
        value: avgPerms,
        trend: `${t("admin.of_total")} ${ALL_PERMISSIONS.length}`,
        trendType: "up",
        footerTitle: t("admin.access_breadth"),
        footerSub: t("admin.per_account")
      }
    ];
  }, [admins]);
  const togglePermission = (perm) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm) ? prev.permissions.filter((p) => p !== perm) : [...prev.permissions, perm]
    }));
  };
  const selectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: ALL_PERMISSIONS.map((p) => p.id)
    }));
  };
  const clearAllPermissions = () => {
    setFormData((prev) => ({ ...prev, permissions: [] }));
  };
  const resetForm = () => {
    setFormData({ name: "", username: "", pin: "", confirmPin: "", permissions: [] });
    setEditingAdmin(null);
    setError("");
    setShowPin(false);
  };
  const openEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      username: admin.username,
      pin: "",
      confirmPin: "",
      permissions: [...admin.permissions]
    });
    setError("");
    setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.name.trim() || !formData.username.trim()) {
      setError(t("admin.required_fields"));
      return;
    }
    if (!editingAdmin && (!formData.pin || formData.pin.length !== 4)) {
      setError(t("admin.pin_error"));
      return;
    }
    if (formData.pin && formData.pin !== formData.confirmPin) {
      setError(t("admin.pin_mismatch"));
      return;
    }
    try {
      if (editingAdmin) {
        const updateData = {
          name: formData.name.trim(),
          username: formData.username.trim(),
          permissions: formData.permissions
        };
        if (formData.pin) {
          updateData.pin = formData.pin;
        }
        const result = await window.api?.updateAdmin(editingAdmin.id, updateData);
        if (!result?.success) {
          setError(result?.error || "Update failed");
          return;
        }
      } else {
        const result = await window.api?.insertAdmin({
          name: formData.name.trim(),
          username: formData.username.trim(),
          pin: formData.pin,
          role: "admin",
          permissions: formData.permissions
        });
        if (!result?.success) {
          setError(result?.error || "Creation failed");
          return;
        }
      }
      setShowModal(false);
      resetForm();
      loadAdmins();
    } catch (err) {
      setError(t("common.error"));
    }
  };
  const handleDelete = async (id) => {
    const result = await window.api?.deleteAdmin(id);
    if (result?.success) {
      loadAdmins();
    }
  };
  const handleToggleActive = async (admin) => {
    await window.api?.updateAdmin(admin.id, { isActive: admin.isActive ? 0 : 1 });
    loadAdmins();
  };
  const columns = [
    {
      accessorKey: "name",
      header: t("admin.identity"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
          "flex h-10 w-10 items-center justify-center rounded-xl font-black text-sm",
          row.original.role === "super_admin" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        ), children: row.original.name.charAt(0).toUpperCase() }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: row.original.name }),
            row.original.role === "super_admin" && /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-3.5 w-3.5 text-amber-500" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-muted-foreground uppercase font-bold tracking-widest", children: [
            "@",
            row.original.username
          ] })
        ] })
      ] })
    },
    {
      accessorKey: "role",
      header: t("common.category"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        Badge,
        {
          variant: row.original.role === "super_admin" ? "default" : "outline",
          className: "uppercase text-[9px] font-bold",
          children: row.original.role === "super_admin" ? t("admin.super_admins") : t("common.operator")
        }
      )
    },
    {
      accessorKey: "permissions",
      header: t("admin.access_scope"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 max-w-[200px]", children: row.original.role === "super_admin" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[8px] font-bold bg-primary/5 border-primary/20 text-primary", children: t("admin.full_access") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        row.original.permissions.slice(0, 3).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[8px] font-bold", children: p }, p)),
        row.original.permissions.length > 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "text-[8px] font-bold", children: [
          "+",
          row.original.permissions.length - 3
        ] })
      ] }) })
    },
    {
      accessorKey: "isActive",
      header: t("common.status"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        Badge,
        {
          variant: row.original.isActive ? "default" : "destructive",
          className: "uppercase text-[9px] font-bold",
          children: row.original.isActive ? t("settings.active") : t("admin.inactive")
        }
      )
    },
    {
      id: "actions",
      header: () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right", children: t("common.actions") }),
      cell: ({ row }) => {
        const isSelf = row.original.id === currentAdmin?.id;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => handleToggleActive(row.original),
              disabled: isSelf,
              title: row.original.isActive ? t("admin.deactivate") : t("admin.activate"),
              className: row.original.isActive ? "text-green-600 hover:bg-green-50" : "text-muted-foreground",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Power, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => openEdit(row.original), title: t("common.edit"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" }) }),
          !isSelf && /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                className: "text-destructive hover:bg-destructive/10",
                title: t("common.delete"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { className: "rounded-[32px] bg-background border-border shadow-2xl", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { className: "text-xl font-black uppercase tracking-tight", children: t("admin.remove_title") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { className: "text-xs font-medium text-muted-foreground leading-relaxed", children: [
                  t("admin.remove_desc"),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-retail-black", children: row.original.name }),
                  "."
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { className: "gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { className: "rounded-xl border-border h-11 text-[10px] font-black uppercase tracking-widest", children: t("common.abort") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  AlertDialogAction,
                  {
                    onClick: () => handleDelete(row.original.id),
                    className: "rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-[10px] font-black uppercase tracking-widest",
                    children: t("admin.confirm_removal")
                  }
                )
              ] })
            ] })
          ] })
        ] });
      }
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCards, { cards: kpiCards }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        DataTable,
        {
          columns,
          data: admins,
          title: t("admin.directory")
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showModal, onClose: () => {
        setShowModal(false);
        resetForm();
      }, title: editingAdmin ? t("admin.modify") : t("admin.create"), size: "lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-8 py-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2", children: t("admin.identity") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("admin.display_name") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  required: true,
                  value: formData.name,
                  onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                  className: "h-12 bg-card rounded-xl font-bold",
                  placeholder: "e.g. John Doe"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("admin.username") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  required: true,
                  value: formData.username,
                  onChange: (e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, "") }),
                  className: "h-12 bg-card rounded-xl font-bold",
                  placeholder: "e.g. johndoe"
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2", children: editingAdmin ? t("admin.pin_reset") : t("admin.security_pin") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("admin.pin_code") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: showPin ? "text" : "password",
                    maxLength: 4,
                    value: formData.pin,
                    onChange: (e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, "") }),
                    className: "h-12 bg-card rounded-xl font-black text-center text-2xl tracking-[0.5em] pr-12",
                    placeholder: "••••",
                    required: !editingAdmin
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setShowPin(!showPin),
                    className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors",
                    children: showPin ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: t("admin.confirm_pin") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: showPin ? "text" : "password",
                  maxLength: 4,
                  value: formData.confirmPin,
                  onChange: (e) => setFormData({ ...formData, confirmPin: e.target.value.replace(/\D/g, "") }),
                  className: "h-12 bg-card rounded-xl font-black text-center text-2xl tracking-[0.5em]",
                  placeholder: "••••",
                  required: !editingAdmin && !!formData.pin
                }
              )
            ] })
          ] })
        ] }),
        (!editingAdmin || editingAdmin.role !== "super_admin") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-border/50 pb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground", children: t("admin.access_permissions") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: selectAllPermissions, className: "text-[9px] font-black uppercase tracking-widest text-primary hover:underline", children: t("common.max") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground/30", children: "|" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: clearAllPermissions, className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:underline", children: t("common.abort") })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: ALL_PERMISSIONS.map((perm) => {
            const isActive = formData.permissions.includes(perm.id);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => togglePermission(perm.id),
                className: cn(
                  "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 group",
                  isActive ? "border-primary bg-primary/5 shadow-md" : "border-transparent bg-muted/30 hover:border-muted-foreground/20"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl", children: perm.icon }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
                    "text-[9px] font-black uppercase tracking-widest",
                    isActive ? "text-primary" : "text-muted-foreground"
                  ), children: t(`tabs.${perm.id}`) }),
                  isActive && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-primary" })
                ]
              },
              perm.id
            );
          }) })
        ] }),
        editingAdmin?.role === "super_admin" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-2xl border bg-primary/5 border-primary/20 flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-6 w-6 text-retail-orange" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest", children: t("admin.super_admins") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-muted-foreground font-bold", children: t("admin.super_admin_desc") })
          ] })
        ] }),
        error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 rounded-xl bg-destructive/10 border border-destructive/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-destructive text-[10px] font-black uppercase tracking-widest", children: error }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-md pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg", children: editingAdmin ? t("settings.commit_changes") : t("admin.create") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", onClick: () => {
            setShowModal(false);
            resetForm();
          }, className: "py-6 font-bold uppercase tracking-widest opacity-40 hover:bg-transparent", children: t("common.abort") })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        className: "fixed bottom-8 right-8 h-20 w-20 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-all z-[9999] flex flex-col gap-1 items-center justify-center border-4 border-primary-foreground/20 group",
        onClick: () => {
          resetForm();
          setShowModal(true);
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-8 w-8 group-hover:rotate-90 transition-transform duration-300", strokeWidth: 4 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] font-black uppercase tracking-tighter", children: t("common.operator") })
        ]
      }
    )
  ] });
};
export {
  AdminManagement as default
};
