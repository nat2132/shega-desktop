import { c as createLucideIcon, g as useSettings, O as useAuth, r as reactExports, U as Users, aV as UserCog, aH as Shield, o as Clock, j as jsxRuntimeExports, i as Button, aW as Hourglass, D as Check, X, ai as Search, G as Input, n as RefreshCw, ae as ShieldAlert, _ as resolveAvatar, aX as Crown, m as Badge, a0 as Eye, y as Trash2, x as Plus, l as CircleAlert, z as Lock, K as KeyRound, H as toast, aN as Copy, M as Modal, aQ as AVATAR_OPTIONS, aR as avatarFileNameFrom, aY as EyeOff, aZ as __vitePreload } from "./index-wvHtiMql.js";
import { D as DatePicker } from "./DatePicker-CvIVrW74.js";
import { Q as QrCode } from "./qr-code-DiJDQd1v.js";
import { U as UserPlus } from "./user-plus-BfhiCD0Q.js";
import { S as SquarePen } from "./square-pen-BLvI5a8Q.js";
import { P as Power, L as LockOpen } from "./power-MT3Xfvlf.js";
import { U as Upload } from "./upload-CDHPPpdk.js";
import "./select-iyCsL0f8.js";
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
const ADMIN_PERMISSIONS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "inventory", label: "Inventory", icon: "📦" },
  { id: "sales", label: "Sales", icon: "🛒" },
  { id: "customers", label: "Customers", icon: "👥" },
  { id: "analytics", label: "Analytics", icon: "📈" },
  { id: "settings", label: "Settings", icon: "🔧" }
];
const PERMISSION_GROUPS = [
  { key: "dashboard", label: "Dashboard", permissions: ["dashboard"] },
  { key: "inventory", label: "Inventory", permissions: ["inventory.view", "inventory.add", "inventory.edit", "inventory.delete", "inventory.adjust", "inventory.transfer"] },
  { key: "sales", label: "Sales", permissions: ["sales.create", "sales.edit", "sales.cancel", "sales.returns", "sales.invoices"] },
  { key: "purchases", label: "Purchases", permissions: ["purchases.create", "purchases.edit", "purchases.approve", "purchases.receive"] },
  { key: "customers", label: "Customers", permissions: ["customers.view", "customers.add", "customers.edit", "customers.delete"] },
  { key: "suppliers", label: "Suppliers", permissions: ["suppliers.view", "suppliers.add", "suppliers.edit", "suppliers.delete", "suppliers"] },
  { key: "shipments", label: "Logistics", permissions: ["shipments"] },
  { key: "warehouses", label: "Warehouses", permissions: ["warehouses.view", "warehouses.create", "warehouses.edit", "warehouses.transfer"] },
  { key: "employees", label: "Employees", permissions: ["employees.view", "employees.add", "employees.edit", "employees.delete", "employees.attendance", "employees.performance"] },
  { key: "settings", label: "System", permissions: ["settings.manage", "settings.users", "settings.roles", "settings.backup"] }
];
const UsersEmployees = () => {
  const { t, formatDate, formatTime, isModuleEnabled } = useSettings();
  const { isSuperAdmin, currentAdmin, refreshAdmin } = useAuth();
  const [activeTab, setActiveTab] = reactExports.useState("directory");
  const [employees, setEmployees] = reactExports.useState([]);
  const [admins, setAdmins] = reactExports.useState([]);
  const [roles, setRoles] = reactExports.useState([]);
  const [accounts, setAccounts] = reactExports.useState([]);
  const [attendance, setAttendance] = reactExports.useState([]);
  const [warehouses, setWarehouses] = reactExports.useState([]);
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
    notes: "",
    avatar: ""
  });
  const [showAdminModal, setShowAdminModal] = reactExports.useState(false);
  const [editAdmin, setEditAdmin] = reactExports.useState(null);
  const [adminForm, setAdminForm] = reactExports.useState({
    name: "",
    username: "",
    pin: "",
    confirmPin: "",
    permissions: [],
    avatar: ""
  });
  const [showPin, setShowPin] = reactExports.useState(false);
  const [adminError, setAdminError] = reactExports.useState("");
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
  const [attendanceFilter, setAttendanceFilter] = reactExports.useState({ fromDate: "", toDate: "", employeeId: "" });
  const [todayAtt, setTodayAtt] = reactExports.useState([]);
  const loadData = async () => {
    try {
      const [emps, rls, accts, whs, adms] = await Promise.all([
        window.api?.getEmployees({ search, roleId: filterRole || void 0, employmentStatus: filterStatus || void 0 }) || [],
        window.api?.getEmployeeRoles() || [],
        window.api?.getEmployeeAccounts() || [],
        window.api?.getWarehouses() || [],
        window.api?.getAdmins() || []
      ]);
      setEmployees(emps);
      setRoles(rls);
      setAccounts(accts);
      setWarehouses(whs);
      setAdmins(adms);
    } catch (err) {
      console.error(err);
    }
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
  const [showInviteModal, setShowInviteModal] = reactExports.useState(false);
  const [invite, setInvite] = reactExports.useState(null);
  const [inviteQr, setInviteQr] = reactExports.useState("");
  const [invites, setInvites] = reactExports.useState([]);
  const [inviteRoleChoice, setInviteRoleChoice] = reactExports.useState({});
  const [copied, setCopied] = reactExports.useState(false);
  const loadInvites = async () => {
    try {
      setInvites(await window.api?.inviteList?.() || []);
    } catch (_) {
    }
  };
  const openInviteModal = async () => {
    try {
      const inv = await window.api.inviteCreate({});
      const QR = await __vitePreload(() => import("./browser-CE5k0Ixp.js").then((n) => n.b), true ? [] : void 0, import.meta.url);
      setInviteQr(await QR.toDataURL(JSON.stringify({ t: "shega-invite", c: inv.code }), { width: 240, margin: 1 }));
      setInvite(inv);
      setCopied(false);
      setShowInviteModal(true);
    } catch (_) {
      toast.error(t("employees.invite_failed", "Could not create invitation"));
    }
  };
  const decideInvite = async (inviteId, decision) => {
    try {
      await window.api.inviteDecide(inviteId, decision, { role: inviteRoleChoice[inviteId] || "cashier" });
      toast.success(decision === "approved" ? t("employees.invite_approved", "User approved") : t("employees.invite_rejected", "Request rejected"));
      loadInvites();
      loadData();
    } catch (_) {
      toast.error(t("employees.invite_failed", "Action failed"));
    }
  };
  reactExports.useEffect(() => {
    if (!showInviteModal) return;
    loadInvites();
    const id = setInterval(loadInvites, 4e3);
    return () => clearInterval(id);
  }, [showInviteModal]);
  reactExports.useEffect(() => {
    loadData();
    loadInvites();
  }, [search, filterRole, filterStatus]);
  reactExports.useEffect(() => {
    if (activeTab === "attendance") loadAttendance();
  }, [activeTab, attendanceFilter]);
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
        notes: emp.notes || "",
        avatar: emp.avatar || ""
      });
    } else {
      setEditEmployee(null);
      setEmpForm({ firstName: "", lastName: "", phone: "", email: "", address: "", emergencyContact: "", gender: "", dateOfBirth: "", roleId: "", department: "", warehouseId: "", employmentStatus: "active", hireDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0], notes: "", avatar: "" });
    }
    setShowEmployeeModal(true);
  };
  const saveEmployee = async () => {
    if (!empForm.firstName || !empForm.lastName) {
      toast.error(t("employees.name_required", "Name is required"));
      return;
    }
    try {
      if (editEmployee) {
        await window.api?.updateEmployee(editEmployee.id, { ...empForm, roleId: empForm.roleId ? parseInt(empForm.roleId) : null, warehouseId: empForm.warehouseId ? parseInt(empForm.warehouseId) : null });
        toast.success(t("employees.emp_updated", "Employee updated"));
      } else {
        await window.api?.insertEmployee({ ...empForm, roleId: empForm.roleId ? parseInt(empForm.roleId) : null, warehouseId: empForm.warehouseId ? parseInt(empForm.warehouseId) : null });
        toast.success(t("employees.emp_created", "Employee created"));
      }
      setShowEmployeeModal(false);
      loadData();
      if (currentAdmin?.isEmployee && editEmployee && editEmployee.id === currentAdmin.id) {
        await refreshAdmin();
      }
    } catch {
      toast.error(t("employees.emp_save_failed", "Failed to save employee"));
    }
  };
  const handlePhotoUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("employees.photo_invalid", "Please select an image file"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEmpForm({ ...empForm, avatar: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
  };
  const openAdminModal = (admin) => {
    if (admin) {
      setEditAdmin(admin);
      setAdminForm({
        name: admin.name || "",
        username: admin.username || "",
        pin: "",
        confirmPin: "",
        permissions: admin.permissions ? [...admin.permissions] : [],
        avatar: admin.avatar || ""
      });
    } else {
      setEditAdmin(null);
      setAdminForm({ name: "", username: "", pin: "", confirmPin: "", permissions: [], avatar: "" });
    }
    setAdminError("");
    setShowPin(false);
    setShowAdminModal(true);
  };
  const toggleAdminPermission = (perm) => {
    setAdminForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm) ? prev.permissions.filter((p) => p !== perm) : [...prev.permissions, perm]
    }));
  };
  const selectAllAdminPermissions = () => {
    setAdminForm((prev) => ({ ...prev, permissions: ADMIN_PERMISSIONS.map((p) => p.id) }));
  };
  const clearAllAdminPermissions = () => {
    setAdminForm((prev) => ({ ...prev, permissions: [] }));
  };
  const handleAdminPhotoUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("employees.photo_invalid", "Please select an image file"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAdminForm({ ...adminForm, avatar: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
  };
  const saveAdmin = async () => {
    if (!adminForm.name.trim() || !adminForm.username.trim()) {
      setAdminError(t("admin.required_fields", "Name and username are required"));
      return;
    }
    if (!editAdmin && (!adminForm.pin || adminForm.pin.length !== 4)) {
      setAdminError(t("admin.pin_error", "PIN must be exactly 4 digits"));
      return;
    }
    if (adminForm.pin && adminForm.pin !== adminForm.confirmPin) {
      setAdminError(t("admin.pin_mismatch", "PINs do not match"));
      return;
    }
    try {
      if (editAdmin) {
        const updateData = {
          name: adminForm.name.trim(),
          username: adminForm.username.trim(),
          permissions: adminForm.permissions,
          avatar: adminForm.avatar || void 0
        };
        if (adminForm.pin) updateData.pin = adminForm.pin;
        const res = await window.api?.updateAdmin(editAdmin.id, updateData);
        if (res && !res.success) {
          setAdminError(res.error || "Update failed");
          return;
        }
        toast.success(t("admin.updated", "Admin updated"));
      } else {
        const res = await window.api?.insertAdmin({
          name: adminForm.name.trim(),
          username: adminForm.username.trim(),
          pin: adminForm.pin,
          role: "admin",
          permissions: adminForm.permissions,
          avatar: adminForm.avatar || null
        });
        if (res && !res.success) {
          setAdminError(res.error || "Creation failed");
          return;
        }
        toast.success(t("admin.created", "Admin created"));
      }
      setShowAdminModal(false);
      loadData();
      if (editAdmin && editAdmin.id === currentAdmin?.id && !currentAdmin?.isEmployee) {
        await refreshAdmin();
      }
    } catch {
      toast.error(t("admin.save_failed", "Failed to save admin"));
    }
  };
  const toggleAdminActive = async (admin) => {
    try {
      await window.api?.updateAdmin(admin.id, { isActive: admin.isActive ? 0 : 1 });
      toast.success(admin.isActive ? t("admin.deactivated", "Admin deactivated") : t("admin.activated", "Admin activated"));
      loadData();
    } catch {
      toast.error(t("admin.update_failed", "Failed to update admin"));
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
      toast.error(t("employees.username_required", "Username is required"));
      return;
    }
    if (!editAccount && !acctForm.pin) {
      toast.error(t("employees.pin_required", "PIN is required"));
      return;
    }
    if (acctForm.pin && acctForm.pin !== acctForm.confirmPin) {
      toast.error(t("employees.pin_mismatch", "PINs do not match"));
      return;
    }
    if (acctForm.pin && acctForm.pin.length < 4) {
      toast.error(t("employees.pin_min_length", "PIN must be at least 4 characters"));
      return;
    }
    try {
      if (editAccount) {
        await window.api?.updateEmployeeAccount(editAccount.id, { ...acctForm, employeeId: parseInt(acctForm.employeeId), pin: acctForm.pin || void 0 });
        toast.success(t("employees.account_updated", "Account updated"));
      } else {
        await window.api?.insertEmployeeAccount({ ...acctForm, employeeId: parseInt(acctForm.employeeId) });
        toast.success(t("employees.account_created", "Account created"));
      }
      setShowAccountModal(false);
      loadData();
    } catch {
      toast.error(t("employees.acct_save_failed", "Failed to save account"));
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
      toast.error(t("employees.role_name_required", "Role name is required"));
      return;
    }
    const selectedPerms = Object.entries(rolePerms).filter(([, v]) => v).map(([k]) => k);
    try {
      if (editRole) {
        await window.api?.updateEmployeeRole(editRole.id, { ...roleForm, permissions: selectedPerms });
        toast.success(t("employees.role_updated", "Role updated"));
      } else {
        await window.api?.insertEmployeeRole({ ...roleForm, permissions: selectedPerms });
        toast.success(t("employees.role_created", "Role created"));
      }
      setShowRoleModal(false);
      loadData();
    } catch {
      toast.error(t("employees.role_save_failed", "Failed to save role"));
    }
  };
  const copyRole = async (id) => {
    await window.api?.duplicateEmployeeRole(id);
    toast.success(t("employees.role_duplicated", "Role duplicated"));
    loadData();
  };
  const deleteItem = async () => {
    if (!showDeleteConfirm) return;
    try {
      const { type, id } = showDeleteConfirm;
      if (type === "employee") await window.api?.deleteEmployee(id);
      else if (type === "account") await window.api?.deleteEmployeeAccount(id);
      else if (type === "role") await window.api?.deleteEmployeeRole(id);
      else if (type === "admin") await window.api?.deleteAdmin(id);
      toast.success(type === "employee" ? t("employees.emp_deleted", "Employee deleted") : type === "account" ? t("employees.account_deleted", "Account deleted") : type === "role" ? t("employees.role_deleted", "Role deleted") : t("admin.deleted", "Admin deleted"));
      setShowDeleteConfirm(null);
      loadData();
    } catch {
      toast.error(t("employees.delete_failed", "Delete failed"));
    }
  };
  const handleClockIn = async (empId) => {
    try {
      await window.api?.clockIn(empId);
      toast.success(t("employees.clock_in", "Clocked in"));
      loadAttendance();
    } catch {
      toast.error(t("employees.already_clocked_in", "Already clocked in today"));
    }
  };
  const handleClockOut = async (empId) => {
    try {
      await window.api?.clockOut(empId);
      toast.success(t("employees.clock_out", "Clocked out"));
      loadAttendance();
    } catch {
      toast.error(t("employees.clock_out_failed", "Clock out failed"));
    }
  };
  const handleLockAccount = async (id, lock) => {
    try {
      if (lock) {
        await window.api?.lockUserAccount(id);
      } else {
        await window.api?.unlockUserAccount(id);
      }
      toast.success(lock ? t("employees.lock_account", "Account locked") : t("employees.unlock_account", "Account unlocked"));
      loadData();
    } catch {
      toast.error(t("employees.account_update_failed", "Failed to update account"));
    }
  };
  const handleForcePinChange = async (id) => {
    try {
      await window.api?.forcePinChange(id);
      toast.success(t("employees.force_pin_change_set", "Force PIN change set for next login"));
      loadData();
    } catch {
      toast.error(t("employees.force_pin_change_failed", "Failed to force PIN change"));
    }
  };
  const handleGenerateRecoveryKey = async (acct) => {
    try {
      const result = await window.api?.generateRecoveryKey("employee", acct.employeeId);
      if (result?.recoveryKey) {
        const fullKey = result.recoveryKey;
        const blob = new Blob([`Shega OS Recovery Key
${t("employees.username", "Username")}: ${acct.username}
Key: ${fullKey}
`], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `shega-recovery-${acct.username}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t("employees.recovery_key_generated", "Recovery key generated and downloaded"));
      }
    } catch {
      toast.error(t("employees.recovery_key_failed", "Failed to generate recovery key"));
    }
  };
  const handleResetPin = async (id) => {
    const newPin = prompt(t("employees.pin_prompt", "Enter new PIN (min 4 characters):"));
    if (!newPin || newPin.length < 4) {
      toast.error(t("employees.pin_min_length", "PIN must be at least 4 characters"));
      return;
    }
    const confirmPin = prompt(t("employees.confirm_pin_prompt", "Confirm new PIN:"));
    if (newPin !== confirmPin) {
      toast.error(t("employees.pin_mismatch", "PINs do not match"));
      return;
    }
    try {
      await window.api?.resetEmployeePassword(id, newPin);
      toast.success(t("employees.pin_reset_success", "PIN reset successful"));
      loadData();
    } catch {
      toast.error(t("employees.pin_reset_failed", "Failed to reset PIN"));
    }
  };
  const getStatusBadge = (status) => {
    const variants = { active: "success", inactive: "secondary", suspended: "destructive", pending: "warning" };
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: variants[status] || "outline", className: "text-xs font-black uppercase tracking-widest", children: status });
  };
  const tabs = [
    { id: "directory", label: t("employees.directory", "Directory"), icon: Users },
    { id: "accounts", label: t("employees.accounts", "Accounts"), icon: UserCog },
    { id: "roles", label: t("employees.roles", "Roles"), icon: Shield },
    { id: "attendance", label: t("employees.attendance", "Attendance"), icon: Clock }
  ];
  const directoryRows = [
    ...employees.map((emp) => ({ type: "employee", ...emp })),
    ...admins.filter((ad) => {
      if (filterRole) return false;
      if (search && !`${ad.name} ${ad.username} ${ad.role}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus === "active" && !ad.isActive) return false;
      if (filterStatus === "inactive" && ad.isActive) return false;
      if (filterStatus === "suspended") return false;
      return true;
    }).map((ad) => ({
      type: "admin",
      id: ad.id,
      firstName: ad.name,
      lastName: "",
      email: `@${ad.username}`,
      phone: "",
      employeeCode: ad.username,
      roleName: ad.role === "super_admin" ? t("admin.super_admins", "Super Admin") : t("common.operator", "Admin"),
      department: "",
      employmentStatus: ad.isActive ? "active" : "inactive",
      isActive: ad.isActive,
      avatar: ad.avatar,
      username: ad.username,
      adminRole: ad.role
    }))
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6 flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-black tracking-tight", children: t("employees.heading", "Users & Employees") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-black uppercase tracking-widest mt-1", children: t("employees.subtitle", "Unified workforce management") })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 p-1 rounded-xl bg-muted/50 w-fit border", children: tabs.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: activeTab === tab.id ? "default" : "ghost",
        size: "sm",
        onClick: () => setActiveTab(tab.id),
        className: "h-8 px-4 text-xs font-black uppercase tracking-widest gap-1.5",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(tab.icon, { size: 12 }),
          tab.label
        ]
      },
      tab.id
    )) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6", children: [
      activeTab === "directory" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        invites.filter((i) => i.status === "pending").length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-amber-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Hourglass, { size: 14 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-black uppercase tracking-widest", children: t("employees.pending_requests", "Pending user requests") })
          ] }),
          invites.filter((i) => i.status === "pending").map((inv) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background/60 px-3 py-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold", children: inv.joinerName || t("employees.unknown_user", "Unknown user") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground font-black uppercase tracking-widest", children: inv.code })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                className: "h-8 rounded-lg border bg-background px-2 text-xs",
                value: inviteRoleChoice[inv.id] || inv.suggestedRole || "cashier",
                onChange: (e) => setInviteRoleChoice((m) => ({ ...m, [inv.id]: e.target.value })),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "cashier", children: "Cashier" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "operator", children: t("common.operator", "Operator") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "admin", children: t("admin.admins", "Admin") }),
                  roles.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: String(r.name || r.id), children: r.name }, r.id))
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "h-8 px-3 gap-1 text-xs font-black uppercase tracking-widest", onClick: () => decideInvite(inv.id, "approved"), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 12 }),
                " ",
                t("employees.approve", "Approve")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "destructive", className: "h-8 px-3", onClick: () => decideInvite(inv.id, "rejected"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 12 }) })
            ] })
          ] }, inv.id))
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1 max-w-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: t("employees.search", "Search users..."), className: "pl-8 h-9 text-xs", value: search, onChange: (e) => setSearch(e.target.value) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "h-9 rounded-lg border bg-background px-3 text-xs", value: filterRole, onChange: (e) => setFilterRole(e.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("employees.all_roles", "All Roles") }),
            roles.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r.id, children: r.name }, r.id))
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "h-9 rounded-lg border bg-background px-3 text-xs", value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("employees.all_status", "All Status") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "active", children: t("employees.active", "Active") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "inactive", children: t("employees.inactive", "Inactive") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "suspended", children: t("employees.suspended", "Suspended") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", onClick: () => loadData(), className: "h-9 px-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: openInviteModal, className: "h-9 px-4 gap-1.5 text-xs font-black uppercase tracking-widest", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(QrCode, { size: 14 }),
            " ",
            t("employees.invite_qr", "Invite via QR")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => openEmployeeModal(), className: "h-9 px-4 gap-1.5 text-xs font-black uppercase tracking-widest", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { size: 14 }),
            " ",
            t("employees.add_team", "Add Team")
          ] }),
          isSuperAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => openAdminModal(), className: "h-9 px-4 gap-1.5 text-xs font-black uppercase tracking-widest", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { size: 14 }),
            " ",
            t("admin.add", "Add Admin")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border bg-card/40 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b bg-muted/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.employee", "Team") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.code", "Code") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.role", "Role") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.department", "Department") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.phone", "Contact") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.status", "Status") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-3 text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.actions", "Actions") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
            directoryRows.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 7, className: "p-8 text-center text-xs text-muted-foreground", children: t("employees.no_users", "No users found") }) }),
            directoryRows.map((emp) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b hover:bg-muted/10 transition-colors", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
                emp.avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: resolveAvatar(emp.avatar), alt: emp.firstName, className: "h-8 w-8 rounded-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary", children: [
                  emp.firstName?.[0],
                  emp.lastName?.[0]
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-bold text-xs", children: [
                      emp.firstName,
                      " ",
                      emp.lastName
                    ] }),
                    emp.type === "admin" && emp.adminRole === "super_admin" && /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { size: 11, className: "text-amber-500" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: emp.email || t("employees.no_email", "No email") })
                ] })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-xs bg-muted px-1.5 py-0.5 rounded", children: emp.employeeCode || "—" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: emp.type === "admin" && emp.adminRole === "super_admin" ? "default" : "outline", className: "text-xs font-bold", children: emp.roleName || "—" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-muted-foreground", children: emp.department || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs", children: emp.phone || emp.username || "—" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: getStatusBadge(emp.employmentStatus || (emp.isActive ? "active" : "inactive")) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                emp.type === "employee" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: () => setShowDetail(emp), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 12 }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: () => openEmployeeModal(emp), children: /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { size: 12 }) })
                ] }),
                emp.type === "admin" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: isSuperAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", title: emp.isActive ? t("admin.deactivate", "Deactivate") : t("admin.activate", "Activate"), onClick: () => toggleAdminActive(emp), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Power, { size: 12, className: emp.isActive ? "text-green-600" : "text-muted-foreground" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: () => openAdminModal(emp), children: /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { size: 12 }) })
                ] }) }),
                !isSuperAdmin && emp.type === "admin" ? null : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0 text-destructive", onClick: () => setShowDeleteConfirm(emp.type === "admin" ? { type: "admin", id: emp.id, name: emp.firstName } : { type: "employee", id: emp.id, name: `${emp.firstName} ${emp.lastName}` }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 12 }) })
              ] }) })
            ] }, `${emp.type}-${emp.id}`))
          ] })
        ] }) }) })
      ] }),
      activeTab === "accounts" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-black uppercase tracking-widest", children: t("employees.accounts_count", "{count} accounts", { count: accounts.length + admins.length }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => openAccountModal(), className: "h-9 px-4 gap-1.5 text-xs font-black uppercase tracking-widest", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14 }),
            " ",
            t("employees.create_account_btn", "Create Account")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: [
          accounts.map((acct) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-4 space-y-3 hover:shadow-md transition-shadow", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden", children: acct.avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: resolveAvatar(acct.avatar), alt: acct.firstName, className: "h-8 w-8 rounded-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(UserCog, { size: 14, className: "text-primary" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold", children: [
                    acct.firstName,
                    " ",
                    acct.lastName
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                    "@",
                    acct.username
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: acct.isActive ? "success" : "secondary", className: "text-xs h-4 px-1.5", children: acct.isActive ? t("employees.active", "Active") : t("employees.inactive", "Inactive") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs", children: acct.roleName || t("employees.no_role", "No role") }),
              acct.lastLogin && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Last: ",
                formatDate(acct.lastLogin)
              ] })
            ] }),
            acct.lockedUntil && new Date(acct.lockedUntil) > /* @__PURE__ */ new Date() && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs text-destructive font-bold", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 10 }),
              " Locked until ",
              formatTime(acct.lockedUntil)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1 pt-1 border-t", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs px-2 gap-1", onClick: () => openAccountModal(acct), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { size: 10 }),
                " ",
                t("employees.edit", "Edit")
              ] }),
              acct.isActive ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs px-2 gap-1 text-destructive", onClick: () => handleLockAccount(acct.id, true), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { size: 10 }),
                " ",
                t("employees.lock_account", "Lock")
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs px-2 gap-1 text-green-600", onClick: () => handleLockAccount(acct.id, false), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LockOpen, { size: 10 }),
                " ",
                t("employees.unlock_account", "Unlock")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs px-2 gap-1", onClick: () => handleResetPin(acct.id), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Key, { size: 10 }),
                " ",
                t("employees.reset_pin_btn", "Reset PIN")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs px-2 gap-1", onClick: () => handleForcePinChange(acct.id), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { size: 10 }),
                " ",
                t("employees.force_change_btn", "Force Change")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs px-2 gap-1", onClick: () => handleGenerateRecoveryKey(acct), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { size: 10 }),
                " ",
                t("employees.recovery_key_btn", "Recovery Key")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs px-2 gap-1 text-destructive", onClick: () => setShowDeleteConfirm({ type: "account", id: acct.id, name: acct.username }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 10 }) })
            ] })
          ] }, `emp-${acct.id}`)),
          admins.map((ad) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-4 space-y-3 hover:shadow-md transition-shadow", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden", children: ad.avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: resolveAvatar(ad.avatar), alt: ad.name, className: "h-8 w-8 rounded-full object-cover" }) : ad.role === "super_admin" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { size: 14, className: "text-amber-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { size: 14, className: "text-primary" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold", children: ad.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                    "@",
                    ad.username
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: ad.isActive ? "success" : "secondary", className: "text-xs h-4 px-1.5", children: ad.isActive ? t("employees.active", "Active") : t("employees.inactive", "Inactive") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: ad.role === "super_admin" ? "default" : "outline", className: "text-xs font-bold", children: ad.role === "super_admin" ? t("admin.super_admins", "Super Admin") : t("common.operator", "Operator") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 pt-1 border-t", children: isSuperAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs px-2 gap-1", onClick: () => openAdminModal(ad), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { size: 10 }),
                " ",
                t("employees.edit", "Edit")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs px-2 gap-1", onClick: () => {
                const newPin = prompt(t("employees.pin_prompt", "Enter new PIN (min 4 characters):"));
                if (newPin && newPin.length >= 4) {
                  const cp = prompt(t("employees.confirm_pin_prompt", "Confirm PIN:"));
                  if (newPin === cp) window.api?.updateAdmin(ad.id, { pin: newPin }).then(() => loadData());
                  else toast.error(t("employees.pin_mismatch", "PINs do not match"));
                }
              }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Key, { size: 10 }),
                " ",
                t("employees.reset_pin_btn", "Reset PIN")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs px-2 gap-1", onClick: () => toggleAdminActive(ad), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Power, { size: 10 }),
                " ",
                ad.isActive ? t("employees.lock_account", "Deactivate") : t("employees.unlock_account", "Activate")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs px-2 gap-1 text-destructive", onClick: () => setShowDeleteConfirm({ type: "admin", id: ad.id, name: ad.name }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 10 }) })
            ] }) })
          ] }, `admin-${ad.id}`)),
          accounts.length === 0 && admins.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-span-full p-12 text-center text-xs text-muted-foreground", children: t("employees.no_accounts_created", "No accounts created yet") })
        ] })
      ] }),
      activeTab === "roles" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-black uppercase tracking-widest", children: t("employees.roles_count", "{count} roles", { count: roles.length }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => openRoleModal(), className: "h-9 px-4 gap-1.5 text-xs font-black uppercase tracking-widest", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14 }),
            " ",
            t("employees.create_role_btn", "Create Role")
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
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: role.description || "" })
                ] })
              ] }),
              role.isSystem ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: t("employees.system", "System") }) : null
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1", children: [
              perms.slice(0, 5).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[7px] px-1.5 py-0", children: p.split(".")[1] || p }, p)),
              perms.length > 5 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "text-[7px]", children: [
                "+",
                perms.length - 5
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 pt-1 border-t", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs px-2 gap-1", onClick: () => openRoleModal(role), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { size: 10 }),
                " ",
                t("employees.edit", "Edit")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs px-2 gap-1", onClick: () => copyRole(role.id), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 10 }),
                " ",
                t("employees.copy", "Copy")
              ] }),
              !role.isSystem && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs px-2 gap-1 text-destructive", onClick: () => setShowDeleteConfirm({ type: "role", id: role.id, name: role.name }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 10 }) })
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
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black uppercase tracking-widest mb-3", children: t("employees.today_attendance", "Today's Attendance") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              todayAtt.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("employees.no_one_clocked_in", "No one clocked in yet today.") }),
              todayAtt.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-2 rounded-lg bg-muted/20", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0", children: a.avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: resolveAvatar(a.avatar), alt: a.firstName, className: "h-6 w-6 rounded-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-primary", children: a.firstName?.[0] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold", children: [
                      a.firstName,
                      " ",
                      a.lastName
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                      t("employees.in", "In"),
                      ": ",
                      a.clockIn ? formatTime(a.clockIn) : "—",
                      " | ",
                      t("employees.out", "Out"),
                      ": ",
                      a.clockOut ? formatTime(a.clockOut) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-500", children: t("employees.active_status", "Active") })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: a.status === "present" ? "success" : a.status === "partial" ? "warning" : "secondary", className: "text-xs", children: a.status })
              ] }, a.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black uppercase tracking-widest mb-3", children: t("employees.quick_clock", "Quick Clock") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-3", children: t("employees.clock_in_out_desc", "Clock in/out for employees") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 max-h-64 overflow-y-auto", children: employees.filter((e) => e.isActive).map((emp) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-2 rounded-lg bg-muted/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0", children: emp.avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: resolveAvatar(emp.avatar), alt: emp.firstName, className: "h-6 w-6 rounded-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-primary", children: emp.firstName?.[0] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold", children: [
                  emp.firstName,
                  " ",
                  emp.lastName
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", className: "h-6 text-xs px-2", onClick: () => handleClockIn(emp.id), children: t("employees.clock_in", "Clock In") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", className: "h-6 text-xs px-2", onClick: () => handleClockOut(emp.id), children: t("employees.clock_out", "Clock Out") })
              ] })
            ] }, emp.id)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border bg-card/40 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b bg-muted/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.employee", "Employee") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.date", "Date") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.clock_in", "Clock In") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.clock_out", "Clock Out") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.status", "Status") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
            attendance.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b hover:bg-muted/10", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0", children: a.avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: resolveAvatar(a.avatar), alt: a.firstName, className: "h-6 w-6 rounded-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-primary", children: a.firstName?.[0] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold", children: [
                  a.firstName,
                  " ",
                  a.lastName
                ] })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: a.date }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: a.clockIn ? formatTime(a.clockIn) : "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: a.clockOut ? formatTime(a.clockOut) : "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: getStatusBadge(a.status) })
            ] }, a.id)),
            attendance.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "p-8 text-center text-muted-foreground", children: t("employees.no_attendance_records", "No attendance records") }) })
          ] })
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Modal, { isOpen: showEmployeeModal, onClose: () => setShowEmployeeModal(false), title: editEmployee ? t("employees.edit_team", "Edit Team") : t("employees.new_team", "Add Team"), size: "lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 mb-5", children: [
        empForm.avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: resolveAvatar(empForm.avatar), alt: "avatar", className: "h-16 w-16 rounded-full object-cover border" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-lg font-black text-primary", children: [
          empForm.firstName?.[0],
          empForm.lastName?.[0]
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "cursor-pointer inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-black uppercase tracking-widest hover:bg-muted/10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { size: 13 }),
            " ",
            t("employees.upload_photo", "Upload Photo"),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: (e) => handlePhotoUpload(e.target.files?.[0]) })
          ] }),
          empForm.avatar && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-9 w-9 p-0 text-destructive", onClick: () => setEmpForm({ ...empForm, avatar: "" }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14 }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-2", children: t("employees.preset_avatar", "Choose profile image") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: AVATAR_OPTIONS.map((src, idx) => {
          const filename = avatarFileNameFrom(src);
          const isSelected = empForm.avatar === filename || resolveAvatar(empForm.avatar) === src;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              onClick: () => setEmpForm({ ...empForm, avatar: filename }),
              className: `relative w-11 h-11 rounded-full border-2 overflow-hidden cursor-pointer transition-all hover:scale-105 ${isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"}`,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, alt: t("employees.preset_avatar", "Profile image"), className: "w-full h-full object-cover" })
            },
            idx
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.first_name_label", "First Name *") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: empForm.firstName, onChange: (e) => setEmpForm({ ...empForm, firstName: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.last_name_label", "Last Name *") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: empForm.lastName, onChange: (e) => setEmpForm({ ...empForm, lastName: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.phone_label_form", "Phone") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: empForm.phone, onChange: (e) => setEmpForm({ ...empForm, phone: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.email_label_form", "Email") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: empForm.email, onChange: (e) => setEmpForm({ ...empForm, email: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.role_label", "Role") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "w-full h-9 rounded-lg border bg-background px-3 text-xs", value: empForm.roleId, onChange: (e) => setEmpForm({ ...empForm, roleId: e.target.value }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("employees.select_role", "No Role") }),
            roles.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r.id, children: r.name }, r.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.department_label", "Department") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: empForm.department, onChange: (e) => setEmpForm({ ...empForm, department: e.target.value }) })
        ] }),
        isModuleEnabled("warehouses") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.warehouse_label", "Warehouse") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "w-full h-9 rounded-lg border bg-background px-3 text-xs", value: empForm.warehouseId, onChange: (e) => setEmpForm({ ...empForm, warehouseId: e.target.value }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("employees.select_warehouse", "None") }),
            warehouses.map((w) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: w.id, children: w.name }, w.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.employment_status_label", "Employment Status") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "w-full h-9 rounded-lg border bg-background px-3 text-xs", value: empForm.employmentStatus, onChange: (e) => setEmpForm({ ...empForm, employmentStatus: e.target.value }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "active", children: t("employees.active", "Active") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "inactive", children: t("employees.inactive", "Inactive") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "suspended", children: t("employees.suspended", "Suspended") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.gender_label_form", "Gender") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "w-full h-9 rounded-lg border bg-background px-3 text-xs", value: empForm.gender, onChange: (e) => setEmpForm({ ...empForm, gender: e.target.value }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("employees.prefer_not_to_say_option", "Prefer not to say") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "male", children: t("employees.male_option", "Male") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "female", children: t("employees.female_option", "Female") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.date_of_birth_label", "Date of Birth") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: empForm.dateOfBirth, onChange: (v) => setEmpForm({ ...empForm, dateOfBirth: v }), className: "h-9 text-xs" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.hire_date_label", "Hire Date") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: empForm.hireDate, onChange: (v) => setEmpForm({ ...empForm, hireDate: v }), className: "h-9 text-xs" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.emergency_contact_label_form", "Emergency Contact") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: empForm.emergencyContact, onChange: (e) => setEmpForm({ ...empForm, emergencyContact: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.address_label_form", "Address") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: empForm.address, onChange: (e) => setEmpForm({ ...empForm, address: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.notes_label_form", "Notes") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: empForm.notes, onChange: (e) => setEmpForm({ ...empForm, notes: e.target.value }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 h-10 text-xs font-black uppercase tracking-widest", onClick: saveEmployee, children: editEmployee ? t("employees.update_team", "Update Team") : t("employees.create_team", "Add Team") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "h-10 text-xs font-black uppercase tracking-widest", onClick: () => setShowEmployeeModal(false), children: t("employees.cancel", "Cancel") })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showAdminModal, onClose: () => setShowAdminModal(false), title: editAdmin ? t("admin.modify", "Modify Admin") : t("admin.create", "Create Admin"), size: "lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: (e) => {
      e.preventDefault();
      saveAdmin();
    }, className: "space-y-5 py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 mb-2", children: [
        adminForm.avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: resolveAvatar(adminForm.avatar), alt: "avatar", className: "h-16 w-16 rounded-full object-cover border" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-lg font-black text-primary", children: adminForm.name?.[0]?.toUpperCase() || /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { size: 20 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "cursor-pointer inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-black uppercase tracking-widest hover:bg-muted/10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { size: 13 }),
            " ",
            t("employees.upload_photo", "Upload Photo"),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: (e) => handleAdminPhotoUpload(e.target.files?.[0]) })
          ] }),
          adminForm.avatar && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-9 w-9 p-0 text-destructive", type: "button", onClick: () => setAdminForm({ ...adminForm, avatar: "" }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14 }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-2", children: t("employees.preset_avatar", "Choose profile image") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: AVATAR_OPTIONS.map((src, idx) => {
          const filename = avatarFileNameFrom(src);
          const isSelected = adminForm.avatar === filename || resolveAvatar(adminForm.avatar) === src;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              onClick: () => setAdminForm({ ...adminForm, avatar: filename }),
              className: `relative w-11 h-11 rounded-full border-2 overflow-hidden cursor-pointer transition-all hover:scale-105 ${isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"}`,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, alt: t("employees.preset_avatar", "Profile image"), className: "w-full h-full object-cover" })
            },
            idx
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("admin.display_name", "Display Name *") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: adminForm.name, onChange: (e) => setAdminForm({ ...adminForm, name: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("admin.username", "Username *") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: adminForm.username, onChange: (e) => setAdminForm({ ...adminForm, username: e.target.value.toLowerCase().replace(/\s/g, "") }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: editAdmin ? t("admin.pin_reset", "New PIN (leave blank to keep)") : t("admin.pin_code", "PIN *") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: showPin ? "text" : "password", maxLength: 4, className: "h-9 text-xs pr-10", value: adminForm.pin, onChange: (e) => setAdminForm({ ...adminForm, pin: e.target.value.replace(/\D/g, "") }), placeholder: "••••" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowPin(!showPin), className: "absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground", children: showPin ? /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 14 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { size: 14 }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("admin.confirm_pin", "Confirm PIN") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: showPin ? "text" : "password", maxLength: 4, className: "h-9 text-xs", value: adminForm.confirmPin, onChange: (e) => setAdminForm({ ...adminForm, confirmPin: e.target.value.replace(/\D/g, "") }), placeholder: "••••" })
        ] })
      ] }),
      (!editAdmin || editAdmin.role !== "super_admin") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("admin.access_permissions", "Access Permissions") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: selectAllAdminPermissions, className: "text-xs font-black uppercase tracking-widest text-primary hover:underline", children: t("employees.select_all", "Select All") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground/30", children: "|" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: clearAllAdminPermissions, className: "text-xs font-black uppercase tracking-widest text-muted-foreground hover:underline", children: t("employees.deselect_all", "Deselect All") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: ADMIN_PERMISSIONS.map((perm) => {
          const isActive = adminForm.permissions.includes(perm.id);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => toggleAdminPermission(perm.id),
              className: `p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${isActive ? "border-primary bg-primary/5" : "border-transparent bg-muted/30 hover:border-muted-foreground/20"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg", children: perm.icon }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-black uppercase tracking-widest ${isActive ? "text-primary" : "text-muted-foreground"}`, children: t(`tabs.${perm.id}`, perm.label) })
              ]
            },
            perm.id
          );
        }) })
      ] }),
      editAdmin?.role === "super_admin" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl border bg-primary/5 border-primary/20 flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { size: 18, className: "text-amber-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold", children: t("admin.super_admin_desc", "Super Admin has full access.") })
      ] }),
      adminError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 rounded-xl bg-destructive/10 border border-destructive/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-destructive text-xs font-bold", children: adminError }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 mt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "flex-1 h-10 text-xs font-black uppercase tracking-widest", children: editAdmin ? t("settings.commit_changes", "Save Changes") : t("admin.create", "Create Admin") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "h-10 text-xs font-black uppercase tracking-widest", type: "button", onClick: () => setShowAdminModal(false), children: t("employees.cancel", "Cancel") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Modal, { isOpen: showAccountModal, onClose: () => setShowAccountModal(false), title: editAccount ? t("employees.edit_account", "Edit Account") : t("employees.new_account", "New Account"), size: "md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.employee_required", "Employee *") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "w-full h-9 rounded-lg border bg-background px-3 text-xs", value: acctForm.employeeId, onChange: (e) => setAcctForm({ ...acctForm, employeeId: e.target.value }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("employees.select_employee_placeholder", "Select employee...") }),
            employees.filter((e) => !editAccount || e.id === editAccount.employeeId).map((emp) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: emp.id, children: [
              emp.firstName,
              " ",
              emp.lastName,
              " ",
              emp.hasAccount ? t("employees.has_account_suffix", "(has account)") : ""
            ] }, emp.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.username_label", "Username *") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: acctForm.username, onChange: (e) => setAcctForm({ ...acctForm, username: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: editAccount ? t("employees.pin_label_edit", "New PIN (leave blank to keep)") : t("employees.pin_label_create", "PIN *") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", className: "h-9 text-xs", value: acctForm.pin, onChange: (e) => setAcctForm({ ...acctForm, pin: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.confirm_pin", "Confirm PIN") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", className: "h-9 text-xs", value: acctForm.confirmPin, onChange: (e) => setAcctForm({ ...acctForm, confirmPin: e.target.value }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: acctForm.forcePasswordChange, onChange: (e) => setAcctForm({ ...acctForm, forcePasswordChange: e.target.checked }) }),
          t("employees.force_password_change", "Force password change on next login")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 h-10 text-xs font-black uppercase tracking-widest", onClick: saveAccount, children: editAccount ? t("employees.update_account_btn", "Update Account") : t("employees.create_account_btn", "Create Account") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "h-10 text-xs font-black uppercase tracking-widest", onClick: () => setShowAccountModal(false), children: t("employees.cancel", "Cancel") })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Modal, { isOpen: showRoleModal, onClose: () => setShowRoleModal(false), title: editRole ? t("employees.edit_role", "Edit Role") : t("employees.new_role", "New Role"), size: "lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.role_name_label", "Role Name *") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: roleForm.name, onChange: (e) => setRoleForm({ ...roleForm, name: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("employees.description_label", "Description") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-9 text-xs", value: roleForm.description, onChange: (e) => setRoleForm({ ...roleForm, description: e.target.value }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-3", children: t("employees.permissions_label", "Permissions") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1", children: PERMISSION_GROUPS.map((g) => {
            const allSelected = g.permissions.every((p) => rolePerms[p]);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl border bg-muted/10 space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-widest", children: t(`tabs.${g.key}`, g.label) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-5 text-xs px-1.5", onClick: () => toggleGroup(g.permissions, !allSelected), children: allSelected ? t("employees.deselect_all", "Deselect all") : t("employees.select_all", "Select all") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1", children: g.permissions.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => togglePerm(p),
                  className: `text-xs px-2 py-0.5 rounded-full border transition-all ${rolePerms[p] ? "bg-primary text-primary-foreground border-primary" : "bg-background border-muted-foreground/20 hover:border-muted-foreground/40"}`,
                  children: p.split(".")[1] || p
                },
                p
              )) })
            ] }, g.key);
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 h-10 text-xs font-black uppercase tracking-widest", onClick: saveRole, children: editRole ? t("employees.update_role_btn", "Update Role") : t("employees.create_role_btn", "Create Role") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "h-10 text-xs font-black uppercase tracking-widest", onClick: () => setShowRoleModal(false), children: t("employees.cancel", "Cancel") })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: !!showDeleteConfirm, onClose: () => setShowDeleteConfirm(null), title: t("employees.confirm_delete_title", "Delete {type}", { type: showDeleteConfirm?.type || "" }), size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 24 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold", children: t("employees.confirm_delete_question", 'Delete "{name}"?', { name: showDeleteConfirm?.name || "" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("employees.cannot_undo", "This action cannot be undone.") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "destructive", className: "flex-1", onClick: deleteItem, children: t("employees.delete_btn", "Delete") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1", onClick: () => setShowDeleteConfirm(null), children: t("employees.cancel", "Cancel") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Modal, { isOpen: !!showDetail, onClose: () => setShowDetail(null), title: t("employees.employee_details", "Employee Details"), size: "md", children: [
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
              showDetail.roleName || t("employees.no_role", "No role"),
              " ",
              showDetail.department && `· ${showDetail.department}`
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-bold uppercase tracking-widest", children: t("employees.code", "Code") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.employeeCode || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-bold uppercase tracking-widest", children: t("employees.status", "Status") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: getStatusBadge(showDetail.employmentStatus || (showDetail.isActive ? "active" : "inactive")) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-bold uppercase tracking-widest", children: t("employees.phone", "Phone") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.phone || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-bold uppercase tracking-widest", children: t("employees.email_label", "Email") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.email || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-bold uppercase tracking-widest", children: t("employees.gender", "Gender") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.gender || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-bold uppercase tracking-widest", children: t("employees.dob", "DOB") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.dateOfBirth || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-bold uppercase tracking-widest", children: t("employees.hire_date", "Hire Date") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.hireDate || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-bold uppercase tracking-widest", children: t("employees.warehouse", "Warehouse") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.warehouseName || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-bold uppercase tracking-widest", children: t("employees.address", "Address") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.address || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-bold uppercase tracking-widest", children: t("employees.emergency_contact", "Emergency Contact") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.emergencyContact || "—" })
          ] }),
          showDetail.notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-bold uppercase tracking-widest", children: t("employees.notes", "Notes") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: showDetail.notes })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-3 mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 h-10 text-xs font-black uppercase tracking-widest", onClick: () => setShowDetail(null), children: t("employees.close_btn", "Close") }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showInviteModal, onClose: () => setShowInviteModal(false), title: t("employees.invite_title", "Invite a New User"), size: "sm", children: invite && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("employees.invite_scan_hint", "Have your teammate open Shega Mobile → Join a Business, then scan this code.") }),
      inviteQr && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: inviteQr, alt: "Invite QR", className: "mx-auto rounded-xl border bg-white p-2", width: 220, height: 220 }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => {
            navigator.clipboard.writeText(invite.code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          },
          className: "mx-auto flex items-center gap-2 rounded-lg border px-4 py-2 font-mono text-lg font-black tracking-widest hover:bg-muted/50 transition-colors",
          children: [
            invite.code,
            copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14, className: "text-emerald-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 14, className: "text-muted-foreground" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground font-black uppercase tracking-widest", children: t("employees.invite_expires", "Valid for 24 hours") }),
      (() => {
        const pending = invites.filter((i) => i.status === "pending");
        if (pending.length === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-amber-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Hourglass, { size: 14 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-black uppercase tracking-widest", children: t("employees.pending_requests", "Pending user requests") })
          ] }),
          pending.map((inv) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold", children: inv.joinerName || t("employees.unknown_user", "Unknown user") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "h-7 px-2.5 text-[10px] font-black uppercase tracking-widest", onClick: () => decideInvite(inv.id, "approved"), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 11 }),
                " ",
                t("employees.approve", "Approve")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "destructive", className: "h-7 px-2.5", onClick: () => decideInvite(inv.id, "rejected"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 11 }) })
            ] })
          ] }, inv.id))
        ] });
      })(),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "w-full h-10 text-xs font-black uppercase tracking-widest", onClick: () => setShowInviteModal(false), children: t("employees.close_btn", "Close") })
    ] }) })
  ] });
};
export {
  UsersEmployees as default
};
