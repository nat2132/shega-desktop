import { c as createLucideIcon, g as useSettings, r as reactExports, U as Users, aO as ShieldCheck, K as KeyRound, j as jsxRuntimeExports, i as Button, ai as Search, G as Input, n as RefreshCw, m as Badge, y as Trash2, x as Plus, M as Modal, H as toast } from "./index-wvHtiMql.js";
import { D as DatePicker } from "./DatePicker-CvIVrW74.js";
import { U as UserPlus } from "./user-plus-BfhiCD0Q.js";
import { P as Pen } from "./pen-B_K8zPmU.js";
import "./select-iyCsL0f8.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const LogIn = createLucideIcon("LogIn", [
  ["path", { d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", key: "u53s6r" }],
  ["polyline", { points: "10 17 15 12 10 7", key: "1ail0h" }],
  ["line", { x1: "15", x2: "3", y1: "12", y2: "12", key: "v6grx8" }]
]);
const Employees = () => {
  const { t, formatDateTime } = useSettings();
  const [activeTab, setActiveTab] = reactExports.useState("employees");
  const [employees, setEmployees] = reactExports.useState([]);
  const [roles, setRoles] = reactExports.useState([]);
  const [accounts, setAccounts] = reactExports.useState([]);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [roleFilter, setRoleFilter] = reactExports.useState("");
  const [showEmployeeModal, setShowEmployeeModal] = reactExports.useState(false);
  const [showRoleModal, setShowRoleModal] = reactExports.useState(false);
  const [showAccountModal, setShowAccountModal] = reactExports.useState(false);
  const [deleteTarget, setDeleteTarget] = reactExports.useState(null);
  const [editingEmployee, setEditingEmployee] = reactExports.useState(null);
  const [editingRole, setEditingRole] = reactExports.useState(null);
  const [editingAccount, setEditingAccount] = reactExports.useState(null);
  const [empForm, setEmpForm] = reactExports.useState({ employeeCode: "", firstName: "", lastName: "", phone: "", email: "", roleId: 0, hireDate: "" });
  const [roleForm, setRoleForm] = reactExports.useState({ name: "", description: "", permissions: [] });
  const [accountForm, setAccountForm] = reactExports.useState({ employeeId: 0, username: "", pin: "" });
  reactExports.useEffect(() => {
    loadEmployees();
    loadRoles();
  }, []);
  reactExports.useEffect(() => {
    if (activeTab === "accounts") loadAccounts();
  }, [activeTab]);
  const loadEmployees = async () => {
    try {
      const opts = {};
      if (searchQuery) opts.search = searchQuery;
      if (roleFilter !== "") opts.roleId = roleFilter;
      setEmployees(await window.api.getEmployees(opts) || []);
    } catch (err) {
      console.error(err);
    }
  };
  const loadRoles = async () => {
    try {
      setRoles(await window.api.getEmployeeRoles() || []);
    } catch (err) {
      console.error(err);
    }
  };
  const loadAccounts = async () => {
    try {
      setAccounts(await window.api.getEmployeeAccounts() || []);
    } catch (err) {
      console.error(err);
    }
  };
  const openCreateEmployee = () => {
    setEditingEmployee(null);
    setEmpForm({ employeeCode: "", firstName: "", lastName: "", phone: "", email: "", roleId: 0, hireDate: "" });
    setShowEmployeeModal(true);
  };
  const openEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setEmpForm({
      employeeCode: emp.employeeCode || "",
      firstName: emp.firstName,
      lastName: emp.lastName,
      phone: emp.phone || "",
      email: emp.email || "",
      roleId: emp.roleId || 0,
      hireDate: emp.hireDate || ""
    });
    setShowEmployeeModal(true);
  };
  const handleSaveEmployee = async () => {
    if (!empForm.firstName.trim() || !empForm.lastName.trim()) {
      return toast.error(t("employees.fill_required"));
    }
    try {
      if (editingEmployee) {
        await window.api.updateEmployee(editingEmployee.id, empForm);
        toast.success(t("employees.emp_updated"));
      } else {
        await window.api.insertEmployee(empForm);
        toast.success(t("employees.emp_created"));
      }
      setShowEmployeeModal(false);
      loadEmployees();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const handleDeleteEmployee = async () => {
    if (!deleteTarget) return;
    try {
      await window.api.deleteEmployee(deleteTarget.id);
      toast.success(t("employees.emp_deleted"));
      setDeleteTarget(null);
      loadEmployees();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const openCreateRole = () => {
    setEditingRole(null);
    setRoleForm({ name: "", description: "", permissions: [] });
    setShowRoleModal(true);
  };
  const openEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || "",
      permissions: JSON.parse(role.permissions || "[]")
    });
    setShowRoleModal(true);
  };
  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) return toast.error(t("employees.fill_required"));
    try {
      if (editingRole) {
        await window.api.updateEmployeeRole(editingRole.id, roleForm);
        toast.success(t("employees.role_updated"));
      } else {
        await window.api.insertEmployeeRole(roleForm);
        toast.success(t("employees.role_created"));
      }
      setShowRoleModal(false);
      loadRoles();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const handleDeleteRole = async (id) => {
    try {
      await window.api.deleteEmployeeRole(id);
      toast.success(t("employees.role_deleted"));
      loadRoles();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const openCreateAccount = () => {
    setEditingAccount(null);
    setAccountForm({ employeeId: 0, username: "", pin: "" });
    setShowAccountModal(true);
  };
  const openEditAccount = (acct) => {
    setEditingAccount(acct);
    setAccountForm({ employeeId: acct.employeeId, username: acct.username, pin: "" });
    setShowAccountModal(true);
  };
  const handleSaveAccount = async () => {
    if (!accountForm.employeeId || !accountForm.username.trim()) {
      return toast.error(t("employees.fill_required"));
    }
    try {
      if (editingAccount) {
        await window.api.updateEmployeeAccount(editingAccount.id, accountForm);
        toast.success(t("employees.account_updated"));
      } else {
        if (!accountForm.pin) return toast.error(t("employees.fill_required"));
        await window.api.insertEmployeeAccount(accountForm);
        toast.success(t("employees.account_created"));
      }
      setShowAccountModal(false);
      loadAccounts();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const handleDeleteAccount = async (id) => {
    try {
      await window.api.deleteEmployeeAccount(id);
      toast.success(t("employees.account_deleted"));
      loadAccounts();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const tabs = [
    { id: "employees", label: t("employees.employees"), icon: Users },
    { id: "roles", label: t("employees.roles"), icon: ShieldCheck },
    { id: "accounts", label: t("employees.accounts"), icon: KeyRound }
  ];
  const allPermissionOptions = [
    "dashboard",
    "inventory",
    "sales",
    "customers",
    "analytics",
    "adjustments",
    "settings",
    "warehouses",
    "employees"
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 p-1 rounded-xl bg-muted/30 border w-fit", children: tabs.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: activeTab === tab.id ? "default" : "ghost",
        size: "sm",
        onClick: () => setActiveTab(tab.id),
        className: "h-8 px-4 text-xs font-black uppercase tracking-widest rounded-lg",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(tab.icon, { size: 14, className: "mr-2" }),
          tab.label
        ]
      },
      tab.id
    )) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6", children: [
      activeTab === "employees" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 max-w-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                placeholder: t("employees.search"),
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "h-9 pl-9 text-xs rounded-xl"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: roleFilter,
              onChange: (e) => setRoleFilter(e.target.value === "" ? "" : Number(e.target.value)),
              className: "h-9 px-3 rounded-xl border bg-background text-xs font-bold",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("employees.all_roles") }),
                roles.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r.id, children: r.name }, r.id))
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "h-9 text-xs font-black uppercase tracking-widest", onClick: loadEmployees, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, className: "mr-2" }),
            " ",
            t("employees.refresh")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "h-9 px-5 text-xs font-black uppercase tracking-widest", onClick: openCreateEmployee, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { size: 14, className: "mr-2" }),
            " ",
            t("employees.add")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border bg-card/40 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border/50 text-xs font-black uppercase tracking-widest text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("employees.code") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("employees.name") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("employees.phone") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("employees.role") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("employees.account") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("employees.status") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("employees.actions") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
            employees.map((emp) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border/20 hover:bg-muted/20 transition-colors", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-xs font-semibold", children: emp.employeeCode || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-black uppercase tracking-tight", children: [
                  emp.firstName,
                  " ",
                  emp.lastName
                ] }),
                emp.email && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: emp.email })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-xs font-semibold", children: emp.phone || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs font-black", children: emp.roleName || "-" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: emp.hasAccount ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "default", className: "text-xs font-black", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LogIn, { size: 10, className: "mr-1" }),
                " ",
                t("employees.has_account")
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-black", children: t("employees.no_account") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: emp.isActive ? "default" : "secondary", className: "text-xs font-black uppercase", children: emp.isActive ? t("employees.active") : t("employees.inactive") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs font-black uppercase tracking-widest", onClick: () => openEditEmployee(emp), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { size: 11, className: "mr-1" }),
                  " ",
                  t("employees.edit")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs font-black uppercase tracking-widest text-destructive", onClick: () => {
                  setDeleteTarget(emp);
                }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 11, className: "mr-1" }),
                  " ",
                  t("employees.delete")
                ] })
              ] }) })
            ] }, emp.id)),
            employees.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 7, className: "p-12 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.no_employees") }) }) })
          ] })
        ] }) }) })
      ] }),
      activeTab === "roles" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: [
            roles.length,
            " ",
            t("employees.roles")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "h-9 px-5 text-xs font-black uppercase tracking-widest", onClick: openCreateRole, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14, className: "mr-2" }),
            " ",
            t("employees.add")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", children: [
          roles.map((role) => {
            const perms = JSON.parse(role.permissions || "[]");
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-2xl border-2 bg-card/40 border-muted hover:border-muted-foreground/30 transition-all group", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 20 }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-tight", children: role.name }),
                    role.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-bold uppercase mt-0.5", children: role.description })
                  ] })
                ] }),
                role.isSystem ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[7px] font-black uppercase", children: t("employees.system") }) : null
              ] }),
              perms.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex flex-wrap gap-1", children: perms.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-[7px] font-black uppercase", children: p }, p)) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mt-4 pt-3 border-t border-border/30", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "h-7 text-xs font-black uppercase tracking-widest", onClick: () => openEditRole(role), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { size: 11, className: "mr-1" }),
                  " ",
                  t("employees.edit")
                ] }),
                !role.isSystem && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "h-7 text-xs font-black uppercase tracking-widest text-destructive", onClick: () => handleDeleteRole(role.id), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 11, className: "mr-1" }),
                  " ",
                  t("employees.delete")
                ] })
              ] })
            ] }, role.id);
          }),
          roles.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-full p-12 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 32, className: "mx-auto mb-3 text-muted-foreground/30" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.no_roles") })
          ] })
        ] })
      ] }),
      activeTab === "accounts" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: [
            accounts.length,
            " ",
            t("employees.accounts")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "h-9 px-5 text-xs font-black uppercase tracking-widest", onClick: openCreateAccount, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { size: 14, className: "mr-2" }),
            " ",
            t("employees.add")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border bg-card/40 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border/50 text-xs font-black uppercase tracking-widest text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("employees.employee") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("employees.username") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("employees.last_login") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("employees.status") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("employees.actions") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
            accounts.map((acct) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border/20 hover:bg-muted/20 transition-colors", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-black uppercase tracking-tight", children: [
                  acct.firstName,
                  " ",
                  acct.lastName
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: acct.employeeCode || "" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-xs font-semibold", children: acct.username }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-xs font-semibold", children: acct.lastLogin ? formatDateTime(acct.lastLogin) : "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: acct.isActive ? "default" : "secondary", className: "text-xs font-black uppercase", children: acct.isActive ? t("employees.active") : t("employees.inactive") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs font-black uppercase tracking-widest", onClick: () => openEditAccount(acct), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { size: 11, className: "mr-1" }),
                  " ",
                  t("employees.edit")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs font-black uppercase tracking-widest text-destructive", onClick: () => handleDeleteAccount(acct.id), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 11, className: "mr-1" }),
                  " ",
                  t("employees.delete")
                ] })
              ] }) })
            ] }, acct.id)),
            accounts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "p-12 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.no_accounts") }) }) })
          ] })
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showEmployeeModal, onClose: () => setShowEmployeeModal(false), title: editingEmployee ? t("employees.edit_employee") : t("employees.new_employee"), size: "md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: [
            t("employees.first_name"),
            " *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: empForm.firstName, onChange: (e) => setEmpForm({ ...empForm, firstName: e.target.value }), placeholder: "e.g. John" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: [
            t("employees.last_name"),
            " *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: empForm.lastName, onChange: (e) => setEmpForm({ ...empForm, lastName: e.target.value }), placeholder: "e.g. Doe" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.employee_code") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: empForm.employeeCode, onChange: (e) => setEmpForm({ ...empForm, employeeCode: e.target.value }), placeholder: "e.g. EMP-001" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.role") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: empForm.roleId,
              onChange: (e) => setEmpForm({ ...empForm, roleId: Number(e.target.value) }),
              className: "w-full h-10 px-3 rounded-xl border bg-background text-xs font-bold",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 0, children: "--" }),
                roles.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r.id, children: r.name }, r.id))
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.phone") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: empForm.phone, onChange: (e) => setEmpForm({ ...empForm, phone: e.target.value }), placeholder: "e.g. +251..." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.email_label") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: empForm.email, onChange: (e) => setEmpForm({ ...empForm, email: e.target.value }), placeholder: "e.g. employee@shega.tech", type: "email" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.hire_date") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: empForm.hireDate, onChange: (v) => setEmpForm({ ...empForm, hireDate: v }), className: "h-10" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 h-12 font-black uppercase text-xs tracking-widest", onClick: handleSaveEmployee, children: editingEmployee ? t("employees.update") : t("employees.create") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 h-12 font-black uppercase text-xs tracking-widest", onClick: () => setShowEmployeeModal(false), children: t("common.cancel") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showRoleModal, onClose: () => setShowRoleModal(false), title: editingRole ? t("employees.edit_role") : t("employees.new_role"), size: "md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: [
          t("employees.role_name"),
          " *"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: roleForm.name, onChange: (e) => setRoleForm({ ...roleForm, name: e.target.value }), placeholder: "e.g. Cashier" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.description") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: roleForm.description,
            onChange: (e) => setRoleForm({ ...roleForm, description: e.target.value }),
            className: "w-full h-20 px-3 py-2 rounded-xl border bg-background text-xs font-semibold resize-none",
            placeholder: t("employees.description_placeholder")
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.permissions") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded-xl border", children: allPermissionOptions.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: roleForm.permissions.includes(p),
              onChange: () => {
                setRoleForm({
                  ...roleForm,
                  permissions: roleForm.permissions.includes(p) ? roleForm.permissions.filter((x) => x !== p) : [...roleForm.permissions, p]
                });
              },
              className: "rounded border-muted-foreground/30"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase", children: p })
        ] }, p)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 h-12 font-black uppercase text-xs tracking-widest", onClick: handleSaveRole, children: editingRole ? t("employees.update") : t("employees.create") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 h-12 font-black uppercase text-xs tracking-widest", onClick: () => setShowRoleModal(false), children: t("common.cancel") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showAccountModal, onClose: () => setShowAccountModal(false), title: editingAccount ? t("employees.edit_account") : t("employees.new_account"), size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: [
          t("employees.employee"),
          " *"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: accountForm.employeeId,
            onChange: (e) => setAccountForm({ ...accountForm, employeeId: Number(e.target.value) }),
            className: "w-full h-10 px-3 rounded-xl border bg-background text-xs font-bold",
            disabled: !!editingAccount,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 0, children: t("employees.select_employee") }),
              employees.map((emp) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: emp.id, children: [
                emp.firstName,
                " ",
                emp.lastName
              ] }, emp.id))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: [
          t("employees.username"),
          " *"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: accountForm.username, onChange: (e) => setAccountForm({ ...accountForm, username: e.target.value }), placeholder: "e.g. johndoe" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: [
          t("employees.pin"),
          " ",
          editingAccount ? `(${t("employees.leave_blank")})` : "*"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: accountForm.pin, onChange: (e) => setAccountForm({ ...accountForm, pin: e.target.value }), type: "password", maxLength: 10, placeholder: "****" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 h-12 font-black uppercase text-xs tracking-widest", onClick: handleSaveAccount, children: editingAccount ? t("employees.update") : t("employees.create") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 h-12 font-black uppercase text-xs tracking-widest", onClick: () => setShowAccountModal(false), children: t("common.cancel") })
      ] })
    ] }) }),
    deleteTarget && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", onClick: () => {
      setDeleteTarget(null);
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-2xl bg-card border shadow-xl max-w-sm w-full mx-4", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-black uppercase tracking-widest", children: t("employees.delete_title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-muted-foreground mt-3", children: t("employees.delete_desc").replace("{name}", `${deleteTarget.firstName} ${deleteTarget.lastName}`) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "destructive", className: "flex-1 h-11 text-xs font-black uppercase tracking-widest", onClick: handleDeleteEmployee, children: t("employees.delete") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 h-11 text-xs font-black uppercase tracking-widest", onClick: () => {
          setDeleteTarget(null);
        }, children: t("common.cancel") })
      ] })
    ] }) })
  ] });
};
export {
  Employees as default
};
