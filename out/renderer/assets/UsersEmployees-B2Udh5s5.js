import { c as createLucideIcon, b as useSettings, m as useAuth, r as reactExports, j as jsxRuntimeExports, as as Users, ar as UserCog, ag as Shield, p as Clock, a5 as History, e as Button, a1 as Search, K as Input, R as RefreshCw, g as Badge, w as Eye, h as Trash2, f as CircleAlert, M as Modal, t as toast } from "./index-KcbOuwlA.js";
import { D as DatePicker } from "./DatePicker-oD7Ou9XD.js";
import { U as UserPlus } from "./user-plus-BLwkqDQ1.js";
import { S as SquarePen } from "./square-pen-Ddvf5fqh.js";
import { P as Plus } from "./plus-pdN_V3Af.js";
import { C as Copy } from "./copy-DT3O2gpw.js";
import "./select-YJnyGvXs.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Key = createLucideIcon("Key", [
  ["path", { d: "m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4", key: "g0fldk" }],
  ["path", { d: "m21 2-9.6 9.6", key: "1j0ho8" }],
  ["circle", { cx: "7.5", cy: "15.5", r: "5.5", key: "yqb3hr" }]
]);
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const LockOpen = createLucideIcon("LockOpen", [
  ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2", key: "1w4ew1" }],
  ["path", { d: "M7 11V7a5 5 0 0 1 9.9-1", key: "1mm8w8" }]
]);
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Lock = createLucideIcon("Lock", [
  ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2", key: "1w4ew1" }],
  ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4", key: "fwvmzm" }]
]);
const PERMISSION_GROUPS = [
  { key: "dashboard", label: "Dashboard", permissions: ["dashboard"] },
  { key: "inventory", label: "Inventory", permissions: ["inventory.view", "inventory.add", "inventory.edit", "inventory.delete", "inventory.adjust", "inventory.transfer"] },
  { key: "sales", label: "Sales", permissions: ["sales.create", "sales.edit", "sales.cancel", "sales.returns", "sales.invoices"] },
  { key: "purchases", label: "Purchases", permissions: ["purchases.create", "purchases.edit", "purchases.approve", "purchases.receive"] },
  { key: "customers", label: "Customers", permissions: ["customers.view", "customers.add", "customers.edit", "customers.delete"] },
  { key: "suppliers", label: "Suppliers", permissions: ["suppliers.view", "suppliers.add", "suppliers.edit", "suppliers.delete", "suppliers"] },
  { key: "shipments", label: "Logistics", permissions: ["shipments"] },
  { key: "warehouses", label: "Warehouses", permissions: ["warehouses.view", "warehouses.create", "warehouses.edit", "warehouses.transfer"] },
  { key: "expenses", label: "Finances", permissions: ["expenses.view", "expenses.add", "expenses.edit", "expenses.delete", "reports.view", "reports.profits"] },
  { key: "employees", label: "Employees", permissions: ["employees.view", "employees.add", "employees.edit", "employees.delete", "employees.attendance", "employees.performance"] },
  { key: "settings", label: "System", permissions: ["settings.manage", "settings.users", "settings.roles", "settings.backup"] }
];
const UsersEmployees = () => {
  const { t } = useSettings();
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = reactExports.useState("directory");
  const [employees, setEmployees] = reactExports.useState([]);
  const [roles, setRoles] = reactExports.useState([]);
  const [accounts, setAccounts] = reactExports.useState([]);
  const [attendance, setAttendance] = reactExports.useState([]);
  const [logs, setLogs] = reactExports.useState([]);
  const [warehouses, setWarehouses] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [search, setSearch] = reactExports.useState("");
  const [showEmployeeModal, setShowEmployeeModal] = reactExports.useState(false);
  const [editEmployee, setEditEmployee] = reactExports.useState(null);
  const [empForm, setEmpForm] = reactExports.useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    emergencyContact: "",
    gender: "",
    dateOfBirth: "",
    roleId: "",
    department: "",
    warehouseId: "",
    employmentStatus: "active",
    hireDate: "",
    notes: ""
  });
  const [showAccountModal, setShowAccountModal] = reactExports.useState(false);
  const [editAccount, setEditAccount] = reactExports.useState(null);
  const [acctForm, setAcctForm] = reactExports.useState({ employeeId: "", username: "", pin: "", confirmPin: "", forcePasswordChange: true });
  const [showRoleModal, setShowRoleModal] = reactExports.useState(false);
  const [editRole, setEditRole] = reactExports.useState(null);
  const [roleForm, setRoleForm] = reactExports.useState({ name: "", description: "", permissions: [] });
  const [rolePerms, setRolePerms] = reactExports.useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = reactExports.useState(null);
  const [showDetail, setShowDetail] = reactExports.useState(null);
  const [filterRole, setFilterRole] = reactExports.useState("");
  const [filterStatus, setFilterStatus] = reactExports.useState("");
  const [logFilter, setLogFilter] = reactExports.useState({ action: "", entityType: "", fromDate: "", toDate: "" });
  const [attendanceFilter, setAttendanceFilter] = reactExports.useState({ fromDate: "", toDate: "", employeeId: "" });
  const [todayAtt, setTodayAtt] = reactExports.useState([]);
  const loadData = async () => {
    setLoading(true);
    try {
      const [emps, rls, accts, whs] = await Promise.all([
        window.api?.getEmployees({ search, roleId: filterRole || void 0, employmentStatus: filterStatus || void 0 }) || [],
        window.api?.getEmployeeRoles() || [],
        window.api?.getEmployeeAccounts() || [],
        window.api?.getWarehouses() || []
      ]);
      setEmployees(emps);
      setRoles(rls);
      setAccounts(accts);
      setWarehouses(whs);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };
  const loadAttendance = async () => {
    try {
      const [att, today] = await Promise.all([
        window.api?.getAttendance({ fromDate: attendanceFilter.fromDate || void 0, toDate: attendanceFilter.toDate || void 0, employeeId: attendanceFilter.employeeId || void 0 }) || [],
        window.api?.getTodayAttendance() || []
      ]);
      setAttendance(att);
      setTodayAtt(today);
    } catch (_) {
    }
  };
  const loadLogs = async () => {
    try {
      const data = await window.api?.getActivityLogs({
        action: logFilter.action || void 0,
        entityType: logFilter.entityType || void 0,
        fromDate: logFilter.fromDate || void 0,
        toDate: logFilter.toDate || void 0,
        limit: 200
      }) || [];
      setLogs(data);
    } catch (_) {
    }
  };
  reactExports.useEffect(() => {
    loadData();
  }, [search, filterRole, filterStatus]);
  reactExports.useEffect(() => {
    if (activeTab === "attendance") loadAttendance();
  }, [activeTab, attendanceFilter]);
  reactExports.useEffect(() => {
    if (activeTab === "logs") loadLogs();
  }, [activeTab, logFilter]);
  const openEmployeeModal = (emp) => {
    if (emp) {
      setEditEmployee(emp);
      setEmpForm({
        firstName: emp.firstName || "",
        lastName: emp.lastName || "",
        phone: emp.phone || "",
        email: emp.email || "",
        address: emp.address || "",
        emergencyContact: emp.emergencyContact || "",
        gender: emp.gender || "",
        dateOfBirth: emp.dateOfBirth || "",
        roleId: emp.roleId?.toString() || "",
        department: emp.department || "",
        warehouseId: emp.warehouseId?.toString() || "",
        employmentStatus: emp.employmentStatus || "active",
        hireDate: emp.hireDate || "",
        notes: emp.notes || ""
      });
    } else {
      setEditEmployee(null);
      setEmpForm({ firstName: "", lastName: "", phone: "", email: "", address: "", emergencyContact: "", gender: "", dateOfBirth: "", roleId: "", department: "", warehouseId: "", employmentStatus: "active", hireDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0], notes: "" });
    }
    setShowEmployeeModal(true);
  };
  const saveEmployee = async () => {
    if (!empForm.firstName || !empForm.lastName) {
      toast.error("Name is required");
      return;
    }
    try {
      if (editEmployee) {
        await window.api?.updateEmployee(editEmployee.id, { ...empForm, roleId: empForm.roleId ? parseInt(empForm.roleId) : null, warehouseId: empForm.warehouseId ? parseInt(empForm.warehouseId) : null });
        toast.success("Employee updated");
      } else {
        await window.api?.insertEmployee({ ...empForm, roleId: empForm.roleId ? parseInt(empForm.roleId) : null, warehouseId: empForm.warehouseId ? parseInt(empForm.warehouseId) : null });
        toast.success("Employee created");
      }
      setShowEmployeeModal(false);
      loadData();
    } catch {
      toast.error("Failed to save employee");
    }
  };
  const openAccountModal = (acct) => {
    if (acct) {
      setEditAccount(acct);
      setAcctForm({ employeeId: acct.employeeId?.toString() || "", username: acct.username || "", pin: "", confirmPin: "", forcePasswordChange: false });
    } else {
      setEditAccount(null);
      setAcctForm({ employeeId: "", username: "", pin: "", confirmPin: "", forcePasswordChange: true });
    }
    setShowAccountModal(true);
  };
  const saveAccount = async () => {
    if (!acctForm.username) {
      toast.error("Username is required");
      return;
    }
    if (!editAccount && !acctForm.pin) {
      toast.error("PIN is required");
      return;
    }
    if (acctForm.pin && acctForm.pin !== acctForm.confirmPin) {
      toast.error("PINs do not match");
      return;
    }
    if (acctForm.pin && acctForm.pin.length < 4) {
      toast.error("PIN must be at least 4 characters");
      return;
    }
    try {
      if (editAccount) {
        await window.api?.updateEmployeeAccount(editAccount.id, { ...acctForm, employeeId: parseInt(acctForm.employeeId), pin: acctForm.pin || void 0 });
        toast.success("Account updated");
      } else {
        await window.api?.insertEmployeeAccount({ ...acctForm, employeeId: parseInt(acctForm.employeeId) });
        toast.success("Account created");
      }
      setShowAccountModal(false);
      loadData();
    } catch {
      toast.error("Failed to save account");
    }
  };
  const openRoleModal = (role) => {
    if (role) {
      setEditRole(role);
      const perms = role.permissions ? typeof role.permissions === "string" ? JSON.parse(role.permissions) : role.permissions : [];
      setRoleForm({ name: role.name, description: role.description || "", permissions: perms });
      const permMap = {};
      for (const g of PERMISSION_GROUPS) {
        for (const p of g.permissions) permMap[p] = perms.includes(p);
      }
      setRolePerms(permMap);
    } else {
      setEditRole(null);
      setRoleForm({ name: "", description: "", permissions: [] });
      const permMap = {};
      for (const g of PERMISSION_GROUPS) {
        for (const p of g.permissions) permMap[p] = false;
      }
      setRolePerms(permMap);
    }
    setShowRoleModal(true);
  };
  const togglePerm = (perm) => {
    setRolePerms((prev) => ({ ...prev, [perm]: !prev[perm] }));
  };
  const toggleGroup = (perms, value) => {
    const updated = { ...rolePerms };
    for (const p of perms) updated[p] = value;
    setRolePerms(updated);
  };
  const saveRole = async () => {
    if (!roleForm.name) {
      toast.error("Role name is required");
      return;
    }
    const selectedPerms = Object.entries(rolePerms).filter(([, v]) => v).map(([k]) => k);
    try {
      if (editRole) {
        await window.api?.updateEmployeeRole(editRole.id, { ...roleForm, permissions: selectedPerms });
        toast.success("Role updated");
      } else {
        await window.api?.insertEmployeeRole({ ...roleForm, permissions: selectedPerms });
        toast.success("Role created");
      }
      setShowRoleModal(false);
      loadData();
    } catch {
      toast.error("Failed to save role");
    }
  };
  const copyRole = async (id) => {
    await window.api?.duplicateEmployeeRole(id);
    toast.success("Role duplicated");
    loadData();
  };
  const deleteItem = async () => {
    if (!showDeleteConfirm) return;
    try {
      const { type, id } = showDeleteConfirm;
      if (type === "employee") await window.api?.deleteEmployee(id);
      else if (type === "account") await window.api?.deleteEmployeeAccount(id);
      else if (type === "role") await window.api?.deleteEmployeeRole(id);
      toast.success(`${type} deleted`);
      setShowDeleteConfirm(null);
      loadData();
    } catch {
      toast.error("Delete failed");
    }
  };
  const handleClockIn = async (empId) => {
    try {
      await window.api?.clockIn(empId);
      toast.success("Clocked in");
      loadAttendance();
    } catch {
      toast.error("Already clocked in today");
    }
  };
  const handleClockOut = async (empId) => {
    try {
      await window.api?.clockOut(empId);
      toast.success("Clocked out");
      loadAttendance();
    } catch {
      toast.error("Clock out failed");
    }
  };
  const handleLockAccount = async (id, lock) => {
    if (lock) await window.api?.lockEmployeeAccount(id);
    else await window.api?.unlockEmployeeAccount(id);
    toast.success(lock ? "Account locked" : "Account unlocked");
    loadData();
  };
  const handleResetPin = async (id) => {
    const newPin = prompt("Enter new PIN (min 4 characters):");
    if (!newPin || newPin.length < 4) {
      toast.error("PIN must be at least 4 characters");
      return;
    }
    await window.api?.resetEmployeePassword(id, newPin);
    toast.success("PIN reset successful");
    loadData();
  };
  const getStatusBadge = (status) => {
    const variants = { active: "success", inactive: "secondary", suspended: "destructive", pending: "warning" };
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: variants[status] || "outline", className: "text-[9px] font-black uppercase tracking-widest", children: status });
  };
  const tabs = [
    { id: "directory", label: "Directory", icon: Users },
    { id: "accounts", label: "Accounts", icon: UserCog },
    { id: "roles", label: "Roles", icon: Shield },
    { id: "attendance", label: "Attendance", icon: Clock },
    { id: "logs", label: "Activity", icon: History }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6 flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-black tracking-tight", children: "Users & Employees" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1", children: "Unified workforce management" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 p-1 rounded-xl bg-muted/50 w-fit border", children: tabs.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: activeTab === tab.id ? "default" : "ghost",
        size: "sm",
        onClick: () => setActiveTab(tab.id),
        className: "h-8 px-4 text-[9px] font-black uppercase tracking-widest gap-1.5",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(tab.icon, { size: 12 }),
          tab.label
        ]
      },
      tab.id
    )) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6", children: [
      activeTab === "directory" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1 max-w-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Search employees...", className: "pl-8 h-9 text-xs", value: search, onChange: (e) => setSearch(e.target.value) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "h-9 rounded-lg border bg-background px-3 text-xs", value: filterRole, onChange: (e) => setFilterRole(e.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "All Roles" }),
            roles.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r.id, children: r.name }, r.id))
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "h-9 rounded-lg border bg-background px-3 text-xs", value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "All Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "active", children: "Active" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "inactive", children: "Inactive" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "suspended", children: "Suspended" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", onClick: () => loadData(), className: "h-9 px-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => openEmployeeModal(), className: "h-9 px-4 gap-1.5 text-[9px] font-black uppercase tracking-widest", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { size: 14 }),
            " Add Employee"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border bg-card/40 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b bg-muted/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Employee" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Code" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Role" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Department" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Contact" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
            employees.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 7, className: "p-8 text-center text-xs text-muted-foreground", children: "No employees found" }) }),
            employees.map((emp) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b hover:bg-muted/10 transition-colors", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary", children: [
                  emp.firstName?.[0],
                  emp.lastName?.[0]
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-bold text-xs", children: [
                    emp.firstName,
                    " ",
                    emp.lastName
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-muted-foreground", children: emp.email || "No email" })
                ] })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-[9px] bg-muted px-1.5 py-0.5 rounded", children: emp.employeeCode || "—" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-bold", children: emp.roleName || "—" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-muted-foreground", children: emp.department || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px]", children: emp.phone || "—" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: getStatusBadge(emp.employmentStatus || (emp.isActive ? "active" : "inactive")) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: () => setShowDetail(emp), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 12 }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: () => openEmployeeModal(emp), children: /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { size: 12 }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0 text-destructive", onClick: () => setShowDeleteConfirm({ type: "employee", id: emp.id, name: `${emp.firstName} ${emp.lastName}` }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 12 }) })
              ] }) })
            ] }, emp.id))
          ] })
        ] }) }) })
      ] }),
      activeTab === "accounts" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-muted-foreground font-black uppercase tracking-widest", children: [
            accounts.length,
            " accounts"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => openAccountModal(), className: "h-9 px-4 gap-1.5 text-[9px] font-black uppercase tracking-widest", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14 }),
            " Create Account"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: [
          accounts.map((acct) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-4 space-y-3 hover:shadow-md transition-shadow", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserCog, { size: 14, className: "text-primary" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold", children: [
                    acct.firstName,
                    " ",
                    acct.lastName
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] text-muted-foreground", children: [
                    "@",
                    acct.username
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: acct.isActive ? "success" : "secondary", className: "text-[8px] h-4 px-1.5", children: acct.isActive ? "Active" : "Inactive" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[9px] text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[8px]", children: acct.roleName || "No role" }),
              acct.lastLogin && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Last: ",
                new Date(acct.lastLogin).toLocaleDateString()
              ] })
            ] }),
            acct.lockedUntil && new Date(acct.lockedUntil) > /* @__PURE__ */ new Date() && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-[9px] text-destructive font-bold", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 10 }),
              " Locked until ",
              new Date(acct.lockedUntil).toLocaleTimeString()
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 pt-1 border-t", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-[9px] px-2 gap-1", onClick: () => openAccountModal(acct), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { size: 10 }),
                " Edit"
              ] }),
              acct.isActive ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-[9px] px-2 gap-1 text-destructive", onClick: () => handleLockAccount(acct.id, true), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { size: 10 }),
                " Lock"
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-[9px] px-2 gap-1 text-green-600", onClick: () => handleLockAccount(acct.id, false), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LockOpen, { size: 10 }),
                " Unlock"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-[9px] px-2 gap-1", onClick: () => handleResetPin(acct.id), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Key, { size: 10 }),
                " Reset PIN"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 text-[9px] px-2 gap-1 text-destructive", onClick: () => setShowDeleteConfirm({ type: "account", id: acct.id, name: acct.username }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 10 }) })
            ] })
          ] }, acct.id)),
          accounts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-span-full p-12 text-center text-xs text-muted-foreground", children: "No accounts created yet" })
        ] })
      ] }),
      activeTab === "roles" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-muted-foreground font-black uppercase tracking-widest", children: [
            roles.length,
            " roles"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => openRoleModal(), className: "h-9 px-4 gap-1.5 text-[9px] font-black uppercase tracking-widest", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14 }),
            " Create Role"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: roles.map((role) => {
          const perms = role.permissions ? typeof role.permissions === "string" ? JSON.parse(role.permissions) : role.permissions : [];
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-4 space-y-3 hover:shadow-md transition-shadow", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 16, className: "text-primary" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold", children: role.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[8px] text-muted-foreground", children: role.description || "" })
                ] })
              ] }),
              role.isSystem ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-[8px]", children: "System" }) : null
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1", children: [
              perms.slice(0, 5).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[7px] px-1.5 py-0", children: p.split(".")[1] || p }, p)),
              perms.length > 5 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "text-[7px]", children: [
                "+",
                perms.length - 5
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 pt-1 border-t", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-[9px] px-2 gap-1", onClick: () => openRoleModal(role), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { size: 10 }),
                " Edit"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-[9px] px-2 gap-1", onClick: () => copyRole(role.id), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 10 }),
                " Copy"
              ] }),
              !role.isSystem && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 text-[9px] px-2 gap-1 text-destructive", onClick: () => setShowDeleteConfirm({ type: "role", id: role.id, name: role.name }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 10 }) })
            ] })
          ] }, role.id);
        }) })
      ] }),
      activeTab === "attendance" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: attendanceFilter.fromDate, onChange: (v) => setAttendanceFilter((prev) => ({ ...prev, fromDate: v })), className: "w-full sm:w-36 h-9 text-xs" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: attendanceFilter.toDate, onChange: (v) => setAttendanceFilter((prev) => ({ ...prev, toDate: v })), className: "w-full sm:w-36 h-9 text-xs" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", onClick: loadAttendance, className: "h-9 px-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[9px] font-black uppercase tracking-widest mb-3", children: "Today's Attendance" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              todayAtt.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "No one clocked in yet today." }),
              todayAtt.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-2 rounded-lg bg-muted/20", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold", children: [
                    a.firstName,
                    " ",
                    a.lastName
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] text-muted-foreground", children: [
                    "In: ",
                    a.clockIn ? new Date(a.clockIn).toLocaleTimeString() : "—",
                    " | Out: ",
                    a.clockOut ? new Date(a.clockOut).toLocaleTimeString() : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-500", children: "Active" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: a.status === "present" ? "success" : a.status === "partial" ? "warning" : "secondary", className: "text-[8px]", children: a.status })
              ] }, a.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[9px] font-black uppercase tracking-widest mb-3", children: "Quick Clock" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-muted-foreground mb-3", children: "Clock in/out for employees" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 max-h-64 overflow-y-auto", children: employees.filter((e) => e.isActive).map((emp) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-2 rounded-lg bg-muted/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary", children: emp.firstName?.[0] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-bold", children: [
                  emp.firstName,
                  " ",
                  emp.lastName
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", className: "h-6 text-[8px] px-2", onClick: () => handleClockIn(emp.id), children: "Clock In" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", className: "h-6 text-[8px] px-2", onClick: () => handleClockOut(emp.id), children: "Clock Out" })
              ] })
            ] }, emp.id)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border bg-card/40 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b bg-muted/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Employee" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Date" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Clock In" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Clock Out" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Status" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
            attendance.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b hover:bg-muted/10", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3 font-bold", children: [
                a.firstName,
                " ",
                a.lastName
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: a.date }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: a.clockIn ? new Date(a.clockIn).toLocaleTimeString() : "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: a.clockOut ? new Date(a.clockOut).toLocaleTimeString() : "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: getStatusBadge(a.status) })
            ] }, a.id)),
            attendance.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "p-8 text-center text-muted-foreground", children: "No attendance records" }) })
          ] })
        ] }) }) })
      ] }),
      activeTab === "logs" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "h-9 rounded-lg border bg-background px-3 text-xs", value: logFilter.action, onChange: (e) => setLogFilter((prev) => ({ ...prev, action: e.target.value })), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "All Actions" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "insert", children: "Created" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "update", children: "Updated" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "delete", children: "Deleted" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "h-9 rounded-lg border bg-background px-3 text-xs", value: logFilter.entityType, onChange: (e) => setLogFilter((prev) => ({ ...prev, entityType: e.target.value })), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "All Entities" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "employee", children: "Employee" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "account", children: "Account" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "role", children: "Role" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "item", children: "Item" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "sale", children: "Sale" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "expense", children: "Expense" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "adjustment", children: "Adjustment" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "inventory", children: "Inventory" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "transfer", children: "Transfer" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: logFilter.fromDate, onChange: (v) => setLogFilter((prev) => ({ ...prev, fromDate: v })), className: "w-36 h-9 text-xs" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: logFilter.toDate, onChange: (v) => setLogFilter((prev) => ({ ...prev, toDate: v })), className: "w-36 h-9 text-xs" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", onClick: loadLogs, className: "h-9 px-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14 }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border bg-card/40 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "divide-y", children: [
          logs.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-xs text-muted-foreground", children: "No activity logs found" }),
          logs.map((log) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 flex items-start gap-3 hover:bg-muted/10 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(History, { size: 12, className: "text-primary" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: log.action === "insert" ? "success" : log.action === "delete" ? "destructive" : "secondary", className: "text-[8px] px-1.5 h-4", children: log.action }),
                log.entityType && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[8px] px-1.5 h-4", children: log.entityType }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground ml-auto flex-shrink-0", children: new Date(log.createdAt).toLocaleString() })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] mt-1 truncate", children: log.details || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[8px] text-muted-foreground mt-0.5", children: [
                "by ",
                log.firstName || "System",
                " ",
                log.lastName || "",
                log.employeeCode && ` (${log.employeeCode})`
              ] })
            ] })
          ] }, log.id))
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Modal, { isOpen: showEmployeeModal, onClose: () => setShowEmployeeModal(false), title: editEmployee ? "Edit Employee" : "Add Employee", size: "lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "First Name *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: empForm.firstName, onChange: (e) => setEmpForm({ ...empForm, firstName: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Last Name *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: empForm.lastName, onChange: (e) => setEmpForm({ ...empForm, lastName: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Phone" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: empForm.phone, onChange: (e) => setEmpForm({ ...empForm, phone: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: empForm.email, onChange: (e) => setEmpForm({ ...empForm, email: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Role" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "w-full h-9 rounded-lg border bg-background px-3 text-xs", value: empForm.roleId, onChange: (e) => setEmpForm({ ...empForm, roleId: e.target.value }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "No Role" }),
            roles.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r.id, children: r.name }, r.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Department" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: empForm.department, onChange: (e) => setEmpForm({ ...empForm, department: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Warehouse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "w-full h-9 rounded-lg border bg-background px-3 text-xs", value: empForm.warehouseId, onChange: (e) => setEmpForm({ ...empForm, warehouseId: e.target.value }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "None" }),
            warehouses.map((w) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: w.id, children: w.name }, w.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Employment Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "w-full h-9 rounded-lg border bg-background px-3 text-xs", value: empForm.employmentStatus, onChange: (e) => setEmpForm({ ...empForm, employmentStatus: e.target.value }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "active", children: "Active" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "inactive", children: "Inactive" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "suspended", children: "Suspended" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Gender" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "w-full h-9 rounded-lg border bg-background px-3 text-xs", value: empForm.gender, onChange: (e) => setEmpForm({ ...empForm, gender: e.target.value }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Prefer not to say" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "male", children: "Male" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "female", children: "Female" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Date of Birth" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: empForm.dateOfBirth, onChange: (v) => setEmpForm({ ...empForm, dateOfBirth: v }), className: "h-9 text-xs" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Hire Date" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: empForm.hireDate, onChange: (v) => setEmpForm({ ...empForm, hireDate: v }), className: "h-9 text-xs" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Emergency Contact" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: empForm.emergencyContact, onChange: (e) => setEmpForm({ ...empForm, emergencyContact: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Address" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: empForm.address, onChange: (e) => setEmpForm({ ...empForm, address: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Notes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: empForm.notes, onChange: (e) => setEmpForm({ ...empForm, notes: e.target.value }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 h-10 text-[10px] font-black uppercase tracking-widest", onClick: saveEmployee, children: editEmployee ? "Update Employee" : "Create Employee" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "h-10 text-[10px] font-black uppercase tracking-widest", onClick: () => setShowEmployeeModal(false), children: "Cancel" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Modal, { isOpen: showAccountModal, onClose: () => setShowAccountModal(false), title: editAccount ? "Edit Account" : "Create Account", size: "md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Employee *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "w-full h-9 rounded-lg border bg-background px-3 text-xs", value: acctForm.employeeId, onChange: (e) => setAcctForm({ ...acctForm, employeeId: e.target.value }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select employee..." }),
            employees.filter((e) => !editAccount || e.id === editAccount.employeeId).map((emp) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: emp.id, children: [
              emp.firstName,
              " ",
              emp.lastName,
              " ",
              emp.hasAccount ? "(has account)" : ""
            ] }, emp.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Username *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: acctForm.username, onChange: (e) => setAcctForm({ ...acctForm, username: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: editAccount ? "New PIN (leave blank to keep)" : "PIN *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", className: "h-9 text-xs", value: acctForm.pin, onChange: (e) => setAcctForm({ ...acctForm, pin: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Confirm PIN" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", className: "h-9 text-xs", value: acctForm.confirmPin, onChange: (e) => setAcctForm({ ...acctForm, confirmPin: e.target.value }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: acctForm.forcePasswordChange, onChange: (e) => setAcctForm({ ...acctForm, forcePasswordChange: e.target.checked }) }),
          "Force password change on next login"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 h-10 text-[10px] font-black uppercase tracking-widest", onClick: saveAccount, children: editAccount ? "Update Account" : "Create Account" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "h-10 text-[10px] font-black uppercase tracking-widest", onClick: () => setShowAccountModal(false), children: "Cancel" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Modal, { isOpen: showRoleModal, onClose: () => setShowRoleModal(false), title: editRole ? "Edit Role" : "Create Role", size: "lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Role Name *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: roleForm.name, onChange: (e) => setRoleForm({ ...roleForm, name: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: "Description" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: roleForm.description, onChange: (e) => setRoleForm({ ...roleForm, description: e.target.value }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3", children: "Permissions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1", children: PERMISSION_GROUPS.map((g) => {
            const allSelected = g.permissions.every((p) => rolePerms[p]);
            g.permissions.some((p) => rolePerms[p]);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl border bg-muted/10 space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-widest", children: g.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-5 text-[8px] px-1.5", onClick: () => toggleGroup(g.permissions, !allSelected), children: allSelected ? "Deselect all" : "Select all" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1", children: g.permissions.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => togglePerm(p),
                  className: `text-[8px] px-2 py-0.5 rounded-full border transition-all ${rolePerms[p] ? "bg-primary text-primary-foreground border-primary" : "bg-background border-muted-foreground/20 hover:border-muted-foreground/40"}`,
                  children: p.split(".")[1] || p
                },
                p
              )) })
            ] }, g.key);
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 h-10 text-[10px] font-black uppercase tracking-widest", onClick: saveRole, children: editRole ? "Update Role" : "Create Role" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "h-10 text-[10px] font-black uppercase tracking-widest", onClick: () => setShowRoleModal(false), children: "Cancel" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: !!showDeleteConfirm, onClose: () => setShowDeleteConfirm(null), title: `Delete ${showDeleteConfirm?.type || ""}`, size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 24 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-bold", children: [
        'Delete "',
        showDeleteConfirm?.name,
        '"?'
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground", children: "This action cannot be undone." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "destructive", className: "flex-1", onClick: deleteItem, children: "Delete" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1", onClick: () => setShowDeleteConfirm(null), children: "Cancel" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Modal, { isOpen: !!showDetail, onClose: () => setShowDetail(null), title: "Employee Details", size: "md", children: [
      showDetail && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-black text-primary", children: [
            showDetail.firstName?.[0],
            showDetail.lastName?.[0]
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-bold", children: [
              showDetail.firstName,
              " ",
              showDetail.lastName
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              showDetail.roleName || "No role",
              " ",
              showDetail.department && `· ${showDetail.department}`
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground font-bold uppercase tracking-widest", children: "Code" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.employeeCode || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground font-bold uppercase tracking-widest", children: "Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: getStatusBadge(showDetail.employmentStatus || (showDetail.isActive ? "active" : "inactive")) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground font-bold uppercase tracking-widest", children: "Phone" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.phone || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground font-bold uppercase tracking-widest", children: "Email" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.email || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground font-bold uppercase tracking-widest", children: "Gender" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.gender || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground font-bold uppercase tracking-widest", children: "DOB" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.dateOfBirth || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground font-bold uppercase tracking-widest", children: "Hire Date" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.hireDate || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground font-bold uppercase tracking-widest", children: "Warehouse" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.warehouseName || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground font-bold uppercase tracking-widest", children: "Address" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.address || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground font-bold uppercase tracking-widest", children: "Emergency Contact" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.emergencyContact || "—" })
          ] }),
          showDetail.notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground font-bold uppercase tracking-widest", children: "Notes" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.notes })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-3 mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 h-10 text-[10px] font-black uppercase tracking-widest", onClick: () => setShowDetail(null), children: "Close" }) })
    ] })
  ] });
};
export {
  UsersEmployees as default
};
