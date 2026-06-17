import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, UserCog, Shield, Clock, History, FileText,
  Search, MoreHorizontal, Edit, Trash2, Lock, Unlock, Key,
  CheckCircle, XCircle, AlertCircle, Download, Copy, Plus,
  ArrowUpDown, Filter, RefreshCw, Eye, Archive, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { DatePicker } from '../components/DatePicker';

type Tab = 'directory' | 'accounts' | 'roles' | 'attendance' | 'logs';

const PERMISSION_GROUPS: { key: string; label: string; permissions: string[] }[] = [
  { key: 'dashboard', label: 'Dashboard', permissions: ['dashboard'] },
  { key: 'inventory', label: 'Inventory', permissions: ['inventory.view', 'inventory.add', 'inventory.edit', 'inventory.delete', 'inventory.adjust', 'inventory.transfer'] },
  { key: 'sales', label: 'Sales', permissions: ['sales.create', 'sales.edit', 'sales.cancel', 'sales.returns', 'sales.invoices'] },
  { key: 'purchases', label: 'Purchases', permissions: ['purchases.create', 'purchases.edit', 'purchases.approve', 'purchases.receive'] },
  { key: 'customers', label: 'Customers', permissions: ['customers.view', 'customers.add', 'customers.edit', 'customers.delete'] },
  { key: 'suppliers', label: 'Suppliers', permissions: ['suppliers.view', 'suppliers.add', 'suppliers.edit', 'suppliers.delete', 'suppliers'] },
  { key: 'shipments', label: 'Logistics', permissions: ['shipments'] },
  { key: 'warehouses', label: 'Warehouses', permissions: ['warehouses.view', 'warehouses.create', 'warehouses.edit', 'warehouses.transfer'] },
  { key: 'expenses', label: 'Finances', permissions: ['expenses.view', 'expenses.add', 'expenses.edit', 'expenses.delete', 'reports.view', 'reports.profits'] },
  { key: 'employees', label: 'Employees', permissions: ['employees.view', 'employees.add', 'employees.edit', 'employees.delete', 'employees.attendance', 'employees.performance'] },
  { key: 'settings', label: 'System', permissions: ['settings.manage', 'settings.users', 'settings.roles', 'settings.backup'] },
];

const UsersEmployees: React.FC = () => {
  const { t, formatDate, formatTime, formatDateTime } = useSettings();
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('directory');

  const [employees, setEmployees] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [empForm, setEmpForm] = useState<any>({
    firstName: '', lastName: '', phone: '', email: '', address: '',
    emergencyContact: '', gender: '', dateOfBirth: '', roleId: '',
    department: '', warehouseId: '', employmentStatus: 'active', hireDate: '', notes: ''
  });

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editAccount, setEditAccount] = useState<any>(null);
  const [acctForm, setAcctForm] = useState<any>({ employeeId: '', username: '', pin: '', confirmPin: '', forcePasswordChange: true });

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editRole, setEditRole] = useState<any>(null);
  const [roleForm, setRoleForm] = useState<any>({ name: '', description: '', permissions: [] as string[] });
  const [rolePerms, setRolePerms] = useState<Record<string, boolean>>({});

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: string; id: number; name: string } | null>(null);
  const [showDetail, setShowDetail] = useState<any>(null);

  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [logFilter, setLogFilter] = useState({ action: '', entityType: '', fromDate: '', toDate: '' });
  const [attendanceFilter, setAttendanceFilter] = useState({ fromDate: '', toDate: '', employeeId: '' });
  const [todayAtt, setTodayAtt] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [emps, rls, accts, whs] = await Promise.all([
        window.api?.getEmployees({ search, roleId: filterRole || undefined, employmentStatus: filterStatus || undefined }) || [],
        window.api?.getEmployeeRoles() || [],
        window.api?.getEmployeeAccounts() || [],
        window.api?.getWarehouses() || [],
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
        window.api?.getAttendance({ fromDate: attendanceFilter.fromDate || undefined, toDate: attendanceFilter.toDate || undefined, employeeId: attendanceFilter.employeeId || undefined }) || [],
        window.api?.getTodayAttendance() || [],
      ]);
      setAttendance(att);
      setTodayAtt(today);
    } catch (_) {}
  };

  const loadLogs = async () => {
    try {
      const data = await window.api?.getActivityLogs({
        action: logFilter.action || undefined,
        entityType: logFilter.entityType || undefined,
        fromDate: logFilter.fromDate || undefined,
        toDate: logFilter.toDate || undefined,
        limit: 200
      }) || [];
      setLogs(data);
    } catch (_) {}
  };

  useEffect(() => { loadData(); }, [search, filterRole, filterStatus]);
  useEffect(() => { if (activeTab === 'attendance') loadAttendance(); }, [activeTab, attendanceFilter]);
  useEffect(() => { if (activeTab === 'logs') loadLogs(); }, [activeTab, logFilter]);

  const openEmployeeModal = (emp?: any) => {
    if (emp) {
      setEditEmployee(emp);
      setEmpForm({
        firstName: emp.firstName || '', lastName: emp.lastName || '', phone: emp.phone || '',
        email: emp.email || '', address: emp.address || '', emergencyContact: emp.emergencyContact || '',
        gender: emp.gender || '', dateOfBirth: emp.dateOfBirth || '', roleId: emp.roleId?.toString() || '',
        department: emp.department || '', warehouseId: emp.warehouseId?.toString() || '',
        employmentStatus: emp.employmentStatus || 'active', hireDate: emp.hireDate || '', notes: emp.notes || ''
      });
    } else {
      setEditEmployee(null);
      setEmpForm({ firstName: '', lastName: '', phone: '', email: '', address: '', emergencyContact: '', gender: '', dateOfBirth: '', roleId: '', department: '', warehouseId: '', employmentStatus: 'active', hireDate: new Date().toISOString().split('T')[0], notes: '' });
    }
    setShowEmployeeModal(true);
  };

  const saveEmployee = async () => {
    if (!empForm.firstName || !empForm.lastName) { toast.error('Name is required'); return; }
    try {
      if (editEmployee) {
        await window.api?.updateEmployee(editEmployee.id, { ...empForm, roleId: empForm.roleId ? parseInt(empForm.roleId) : null, warehouseId: empForm.warehouseId ? parseInt(empForm.warehouseId) : null });
        toast.success('Employee updated');
      } else {
        await window.api?.insertEmployee({ ...empForm, roleId: empForm.roleId ? parseInt(empForm.roleId) : null, warehouseId: empForm.warehouseId ? parseInt(empForm.warehouseId) : null });
        toast.success('Employee created');
      }
      setShowEmployeeModal(false);
      loadData();
    } catch { toast.error('Failed to save employee'); }
  };

  const openAccountModal = (acct?: any) => {
    if (acct) {
      setEditAccount(acct);
      setAcctForm({ employeeId: acct.employeeId?.toString() || '', username: acct.username || '', pin: '', confirmPin: '', forcePasswordChange: false });
    } else {
      setEditAccount(null);
      setAcctForm({ employeeId: '', username: '', pin: '', confirmPin: '', forcePasswordChange: true });
    }
    setShowAccountModal(true);
  };

  const saveAccount = async () => {
    if (!acctForm.username) { toast.error('Username is required'); return; }
    if (!editAccount && !acctForm.pin) { toast.error('PIN is required'); return; }
    if (acctForm.pin && acctForm.pin !== acctForm.confirmPin) { toast.error('PINs do not match'); return; }
    if (acctForm.pin && acctForm.pin.length < 4) { toast.error('PIN must be at least 4 characters'); return; }
    try {
      if (editAccount) {
        await window.api?.updateEmployeeAccount(editAccount.id, { ...acctForm, employeeId: parseInt(acctForm.employeeId), pin: acctForm.pin || undefined });
        toast.success('Account updated');
      } else {
        await window.api?.insertEmployeeAccount({ ...acctForm, employeeId: parseInt(acctForm.employeeId) });
        toast.success('Account created');
      }
      setShowAccountModal(false);
      loadData();
    } catch { toast.error('Failed to save account'); }
  };

  const openRoleModal = (role?: any) => {
    if (role) {
      setEditRole(role);
      const perms = role.permissions ? (typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions) : [];
      setRoleForm({ name: role.name, description: role.description || '', permissions: perms });
      const permMap: Record<string, boolean> = {};
      for (const g of PERMISSION_GROUPS) {
        for (const p of g.permissions) permMap[p] = perms.includes(p);
      }
      setRolePerms(permMap);
    } else {
      setEditRole(null);
      setRoleForm({ name: '', description: '', permissions: [] });
      const permMap: Record<string, boolean> = {};
      for (const g of PERMISSION_GROUPS) {
        for (const p of g.permissions) permMap[p] = false;
      }
      setRolePerms(permMap);
    }
    setShowRoleModal(true);
  };

  const togglePerm = (perm: string) => {
    setRolePerms(prev => ({ ...prev, [perm]: !prev[perm] }));
  };

  const toggleGroup = (perms: string[], value: boolean) => {
    const updated = { ...rolePerms };
    for (const p of perms) updated[p] = value;
    setRolePerms(updated);
  };

  const saveRole = async () => {
    if (!roleForm.name) { toast.error('Role name is required'); return; }
    const selectedPerms = Object.entries(rolePerms).filter(([, v]) => v).map(([k]) => k);
    try {
      if (editRole) {
        await window.api?.updateEmployeeRole(editRole.id, { ...roleForm, permissions: selectedPerms });
        toast.success('Role updated');
      } else {
        await window.api?.insertEmployeeRole({ ...roleForm, permissions: selectedPerms });
        toast.success('Role created');
      }
      setShowRoleModal(false);
      loadData();
    } catch { toast.error('Failed to save role'); }
  };

  const copyRole = async (id: number) => {
    await window.api?.duplicateEmployeeRole(id);
    toast.success('Role duplicated');
    loadData();
  };

  const deleteItem = async () => {
    if (!showDeleteConfirm) return;
    try {
      const { type, id } = showDeleteConfirm;
      if (type === 'employee') await window.api?.deleteEmployee(id);
      else if (type === 'account') await window.api?.deleteEmployeeAccount(id);
      else if (type === 'role') await window.api?.deleteEmployeeRole(id);
      toast.success(`${type} deleted`);
      setShowDeleteConfirm(null);
      loadData();
    } catch { toast.error('Delete failed'); }
  };

  const handleClockIn = async (empId: number) => {
    try {
      await window.api?.clockIn(empId);
      toast.success('Clocked in');
      loadAttendance();
    } catch { toast.error('Already clocked in today'); }
  };

  const handleClockOut = async (empId: number) => {
    try {
      await window.api?.clockOut(empId);
      toast.success('Clocked out');
      loadAttendance();
    } catch { toast.error('Clock out failed'); }
  };

  const handleArchive = async (id: number, archive: boolean) => {
    if (archive) await window.api?.archiveEmployee(id);
    else await window.api?.reactivateEmployee(id);
    toast.success(archive ? 'Employee archived' : 'Employee reactivated');
    loadData();
  };

  const handleLockAccount = async (id: number, lock: boolean) => {
    if (lock) await window.api?.lockEmployeeAccount(id);
    else await window.api?.unlockEmployeeAccount(id);
    toast.success(lock ? 'Account locked' : 'Account unlocked');
    loadData();
  };

  const handleResetPin = async (id: number) => {
    const newPin = prompt('Enter new PIN (min 4 characters):');
    if (!newPin || newPin.length < 4) { toast.error('PIN must be at least 4 characters'); return; }
    await window.api?.resetEmployeePassword(id, newPin);
    toast.success('PIN reset successful');
    loadData();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = { active: 'success', inactive: 'secondary', suspended: 'destructive', pending: 'warning' };
    return <Badge variant={variants[status] || 'outline'} className="text-[9px] font-black uppercase tracking-widest">{status}</Badge>;
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'directory', label: 'Directory', icon: Users },
    { id: 'accounts', label: 'Accounts', icon: UserCog },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'logs', label: 'Activity', icon: History },
  ];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
      <div className="px-4 lg:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight">Users & Employees</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Unified workforce management</p>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50 w-fit border">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="h-8 px-4 text-[9px] font-black uppercase tracking-widest gap-1.5"
            >
              <tab.icon size={12} />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="px-4 lg:px-6">
        {/* ============ DIRECTORY TAB ============ */}
        {activeTab === 'directory' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search employees..." className="pl-8 h-9 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="h-9 rounded-lg border bg-background px-3 text-xs" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                <option value="">All Roles</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select className="h-9 rounded-lg border bg-background px-3 text-xs" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <Button size="sm" variant="outline" onClick={() => loadData()} className="h-9 px-3"><RefreshCw size={14} /></Button>
              <Button size="sm" onClick={() => openEmployeeModal()} className="h-9 px-4 gap-1.5 text-[9px] font-black uppercase tracking-widest">
                <UserPlus size={14} /> Add Employee
              </Button>
            </div>
            <div className="rounded-xl border bg-card/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Employee</th>
                      <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Code</th>
                      <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Role</th>
                      <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Department</th>
                      <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Contact</th>
                      <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                      <th className="text-right p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length === 0 && (
                      <tr><td colSpan={7} className="p-8 text-center text-xs text-muted-foreground">No employees found</td></tr>
                    )}
                    {employees.map(emp => (
                      <tr key={emp.id} className="border-b hover:bg-muted/10 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                              {emp.firstName?.[0]}{emp.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-bold text-xs">{emp.firstName} {emp.lastName}</p>
                              <p className="text-[9px] text-muted-foreground">{emp.email || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3"><code className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{emp.employeeCode || '—'}</code></td>
                        <td className="p-3"><Badge variant="outline" className="text-[9px] font-bold">{emp.roleName || '—'}</Badge></td>
                        <td className="p-3 text-muted-foreground">{emp.department || '—'}</td>
                        <td className="p-3">
                          <p className="text-[10px]">{emp.phone || '—'}</p>
                        </td>
                        <td className="p-3">{getStatusBadge(emp.employmentStatus || (emp.isActive ? 'active' : 'inactive'))}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowDetail(emp)}><Eye size={12} /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEmployeeModal(emp)}><Edit size={12} /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setShowDeleteConfirm({ type: 'employee', id: emp.id, name: `${emp.firstName} ${emp.lastName}` })}><Trash2 size={12} /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============ ACCOUNTS TAB ============ */}
        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{accounts.length} accounts</p>
              <Button size="sm" onClick={() => openAccountModal()} className="h-9 px-4 gap-1.5 text-[9px] font-black uppercase tracking-widest">
                <Plus size={14} /> Create Account
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {accounts.map(acct => (
                <div key={acct.id} className="rounded-xl border bg-card/40 p-4 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCog size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{acct.firstName} {acct.lastName}</p>
                        <p className="text-[9px] text-muted-foreground">@{acct.username}</p>
                      </div>
                    </div>
                    <Badge variant={acct.isActive ? 'success' : 'secondary'} className="text-[8px] h-4 px-1.5">
                      {acct.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                    <Badge variant="outline" className="text-[8px]">{acct.roleName || 'No role'}</Badge>
                    {acct.lastLogin && <span>Last: {formatDate(acct.lastLogin)}</span>}
                  </div>
                  {acct.lockedUntil && new Date(acct.lockedUntil) > new Date() && (
                    <div className="flex items-center gap-1.5 text-[9px] text-destructive font-bold">
                      <AlertCircle size={10} /> Locked until {formatTime(acct.lockedUntil)}
                    </div>
                  )}
                  <div className="flex gap-1 pt-1 border-t">
                    <Button variant="ghost" size="sm" className="h-7 text-[9px] px-2 gap-1" onClick={() => openAccountModal(acct)}><Edit size={10} /> Edit</Button>
                    {acct.isActive ? (
                      <Button variant="ghost" size="sm" className="h-7 text-[9px] px-2 gap-1 text-destructive" onClick={() => handleLockAccount(acct.id, true)}><Lock size={10} /> Lock</Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-7 text-[9px] px-2 gap-1 text-green-600" onClick={() => handleLockAccount(acct.id, false)}><Unlock size={10} /> Unlock</Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 text-[9px] px-2 gap-1" onClick={() => handleResetPin(acct.id)}><Key size={10} /> Reset PIN</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[9px] px-2 gap-1 text-destructive" onClick={() => setShowDeleteConfirm({ type: 'account', id: acct.id, name: acct.username })}><Trash2 size={10} /></Button>
                  </div>
                </div>
              ))}
              {accounts.length === 0 && (
                <div className="col-span-full p-12 text-center text-xs text-muted-foreground">No accounts created yet</div>
              )}
            </div>
          </div>
        )}

        {/* ============ ROLES TAB ============ */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{roles.length} roles</p>
              <Button size="sm" onClick={() => openRoleModal()} className="h-9 px-4 gap-1.5 text-[9px] font-black uppercase tracking-widest">
                <Plus size={14} /> Create Role
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {roles.map(role => {
                const perms = role.permissions ? (typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions) : [];
                return (
                  <div key={role.id} className="rounded-xl border bg-card/40 p-4 space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-primary" />
                        <div>
                          <p className="text-xs font-bold">{role.name}</p>
                          <p className="text-[8px] text-muted-foreground">{role.description || ''}</p>
                        </div>
                      </div>
                      {role.isSystem ? <Badge variant="secondary" className="text-[8px]">System</Badge> : null}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {perms.slice(0, 5).map((p: string) => (
                        <Badge key={p} variant="outline" className="text-[7px] px-1.5 py-0">{p.split('.')[1] || p}</Badge>
                      ))}
                      {perms.length > 5 && <Badge variant="outline" className="text-[7px]">+{perms.length - 5}</Badge>}
                    </div>
                    <div className="flex gap-1 pt-1 border-t">
                      <Button variant="ghost" size="sm" className="h-7 text-[9px] px-2 gap-1" onClick={() => openRoleModal(role)}><Edit size={10} /> Edit</Button>
                      <Button variant="ghost" size="sm" className="h-7 text-[9px] px-2 gap-1" onClick={() => copyRole(role.id)}><Copy size={10} /> Copy</Button>
                      {!role.isSystem && (
                        <Button variant="ghost" size="sm" className="h-7 text-[9px] px-2 gap-1 text-destructive" onClick={() => setShowDeleteConfirm({ type: 'role', id: role.id, name: role.name })}><Trash2 size={10} /></Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============ ATTENDANCE TAB ============ */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <DatePicker value={attendanceFilter.fromDate} onChange={v => setAttendanceFilter(prev => ({ ...prev, fromDate: v }))} className="w-full sm:w-36 h-9 text-xs" />
              <DatePicker value={attendanceFilter.toDate} onChange={v => setAttendanceFilter(prev => ({ ...prev, toDate: v }))} className="w-full sm:w-36 h-9 text-xs" />
            </div>
            <Button size="sm" variant="outline" onClick={loadAttendance} className="h-9 px-3"><RefreshCw size={14} /></Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border bg-card/40 p-4">
                <h3 className="text-[9px] font-black uppercase tracking-widest mb-3">Today's Attendance</h3>
                <div className="space-y-2">
                  {todayAtt.length === 0 && <p className="text-xs text-muted-foreground">No one clocked in yet today.</p>}
                  {todayAtt.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                      <div>
                        <p className="text-xs font-bold">{a.firstName} {a.lastName}</p>
                        <p className="text-[9px] text-muted-foreground">
                          In: {a.clockIn ? formatTime(a.clockIn) : '—'} | Out: {a.clockOut ? formatTime(a.clockOut) : <span className="text-green-500">Active</span>}
                        </p>
                      </div>
                      <Badge variant={a.status === 'present' ? 'success' : a.status === 'partial' ? 'warning' : 'secondary'} className="text-[8px]">{a.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border bg-card/40 p-4">
                <h3 className="text-[9px] font-black uppercase tracking-widest mb-3">Quick Clock</h3>
                <p className="text-[9px] text-muted-foreground mb-3">Clock in/out for employees</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {employees.filter(e => e.isActive).map(emp => (
                    <div key={emp.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
                          {emp.firstName?.[0]}
                        </div>
                        <p className="text-[10px] font-bold">{emp.firstName} {emp.lastName}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-6 text-[8px] px-2" onClick={() => handleClockIn(emp.id)}>Clock In</Button>
                        <Button size="sm" variant="outline" className="h-6 text-[8px] px-2" onClick={() => handleClockOut(emp.id)}>Clock Out</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Employee</th>
                      <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                      <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Clock In</th>
                      <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Clock Out</th>
                      <th className="text-left p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(a => (
                      <tr key={a.id} className="border-b hover:bg-muted/10">
                        <td className="p-3 font-bold">{a.firstName} {a.lastName}</td>
                        <td className="p-3">{a.date}</td>
                        <td className="p-3">{a.clockIn ? formatTime(a.clockIn) : '—'}</td>
                        <td className="p-3">{a.clockOut ? formatTime(a.clockOut) : '—'}</td>
                        <td className="p-3">{getStatusBadge(a.status)}</td>
                      </tr>
                    ))}
                    {attendance.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No attendance records</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============ LOGS TAB ============ */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <select className="h-9 rounded-lg border bg-background px-3 text-xs" value={logFilter.action} onChange={e => setLogFilter(prev => ({ ...prev, action: e.target.value }))}>
                <option value="">All Actions</option>
                <option value="insert">Created</option>
                <option value="update">Updated</option>
                <option value="delete">Deleted</option>
              </select>
              <select className="h-9 rounded-lg border bg-background px-3 text-xs" value={logFilter.entityType} onChange={e => setLogFilter(prev => ({ ...prev, entityType: e.target.value }))}>
                <option value="">All Entities</option>
                <option value="employee">Employee</option>
                <option value="account">Account</option>
                <option value="role">Role</option>
                <option value="item">Item</option>
                <option value="sale">Sale</option>
                <option value="expense">Expense</option>
                <option value="adjustment">Adjustment</option>
                <option value="inventory">Inventory</option>
                <option value="transfer">Transfer</option>
              </select>
              <div className="flex flex-col gap-1">
                <DatePicker value={logFilter.fromDate} onChange={v => setLogFilter(prev => ({ ...prev, fromDate: v }))} className="w-36 h-9 text-xs" />
                <DatePicker value={logFilter.toDate} onChange={v => setLogFilter(prev => ({ ...prev, toDate: v }))} className="w-36 h-9 text-xs" />
              </div>
              <Button size="sm" variant="outline" onClick={loadLogs} className="h-9 px-3"><RefreshCw size={14} /></Button>
            </div>
            <div className="rounded-xl border bg-card/40 overflow-hidden">
              <div className="divide-y">
                {logs.length === 0 && <div className="p-8 text-center text-xs text-muted-foreground">No activity logs found</div>}
                {logs.map((log: any) => (
                  <div key={log.id} className="p-3 flex items-start gap-3 hover:bg-muted/10 transition-colors">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <History size={12} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={log.action === 'insert' ? 'success' : log.action === 'delete' ? 'destructive' : 'secondary'} className="text-[8px] px-1.5 h-4">
                          {log.action}
                        </Badge>
                        {log.entityType && <Badge variant="outline" className="text-[8px] px-1.5 h-4">{log.entityType}</Badge>}
                        <span className="text-[9px] text-muted-foreground ml-auto flex-shrink-0">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-[10px] mt-1 truncate">{log.details || '—'}</p>
                      <p className="text-[8px] text-muted-foreground mt-0.5">
                        by {log.firstName || 'System'} {log.lastName || ''}
                        {log.employeeCode && ` (${log.employeeCode})`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============ EMPLOYEE MODAL ============ */}
      <Modal isOpen={showEmployeeModal} onClose={() => setShowEmployeeModal(false)} title={editEmployee ? 'Edit Employee' : 'Add Employee'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">First Name *</label>
            <Input className="h-9 text-xs" value={empForm.firstName} onChange={e => setEmpForm({ ...empForm, firstName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Last Name *</label>
            <Input className="h-9 text-xs" value={empForm.lastName} onChange={e => setEmpForm({ ...empForm, lastName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Phone</label>
            <Input className="h-9 text-xs" value={empForm.phone} onChange={e => setEmpForm({ ...empForm, phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Email</label>
            <Input className="h-9 text-xs" value={empForm.email} onChange={e => setEmpForm({ ...empForm, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Role</label>
            <select className="w-full h-9 rounded-lg border bg-background px-3 text-xs" value={empForm.roleId} onChange={e => setEmpForm({ ...empForm, roleId: e.target.value })}>
              <option value="">No Role</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Department</label>
            <Input className="h-9 text-xs" value={empForm.department} onChange={e => setEmpForm({ ...empForm, department: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Warehouse</label>
            <select className="w-full h-9 rounded-lg border bg-background px-3 text-xs" value={empForm.warehouseId} onChange={e => setEmpForm({ ...empForm, warehouseId: e.target.value })}>
              <option value="">None</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Employment Status</label>
            <select className="w-full h-9 rounded-lg border bg-background px-3 text-xs" value={empForm.employmentStatus} onChange={e => setEmpForm({ ...empForm, employmentStatus: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Gender</label>
            <select className="w-full h-9 rounded-lg border bg-background px-3 text-xs" value={empForm.gender} onChange={e => setEmpForm({ ...empForm, gender: e.target.value })}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Date of Birth</label>
            <DatePicker value={empForm.dateOfBirth} onChange={v => setEmpForm({ ...empForm, dateOfBirth: v })} className="h-9 text-xs" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Hire Date</label>
            <DatePicker value={empForm.hireDate} onChange={v => setEmpForm({ ...empForm, hireDate: v })} className="h-9 text-xs" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Emergency Contact</label>
            <Input className="h-9 text-xs" value={empForm.emergencyContact} onChange={e => setEmpForm({ ...empForm, emergencyContact: e.target.value })} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Address</label>
            <Input className="h-9 text-xs" value={empForm.address} onChange={e => setEmpForm({ ...empForm, address: e.target.value })} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Notes</label>
            <Input className="h-9 text-xs" value={empForm.notes} onChange={e => setEmpForm({ ...empForm, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest" onClick={saveEmployee}>
            {editEmployee ? 'Update Employee' : 'Create Employee'}
          </Button>
          <Button variant="outline" className="h-10 text-[10px] font-black uppercase tracking-widest" onClick={() => setShowEmployeeModal(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* ============ ACCOUNT MODAL ============ */}
      <Modal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} title={editAccount ? 'Edit Account' : 'Create Account'} size="md">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Employee *</label>
            <select className="w-full h-9 rounded-lg border bg-background px-3 text-xs" value={acctForm.employeeId} onChange={e => setAcctForm({ ...acctForm, employeeId: e.target.value })}>
              <option value="">Select employee...</option>
              {employees.filter(e => !editAccount || e.id === editAccount.employeeId).map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} {emp.hasAccount ? '(has account)' : ''}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Username *</label>
            <Input className="h-9 text-xs" value={acctForm.username} onChange={e => setAcctForm({ ...acctForm, username: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{editAccount ? 'New PIN (leave blank to keep)' : 'PIN *'}</label>
              <Input type="password" className="h-9 text-xs" value={acctForm.pin} onChange={e => setAcctForm({ ...acctForm, pin: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Confirm PIN</label>
              <Input type="password" className="h-9 text-xs" value={acctForm.confirmPin} onChange={e => setAcctForm({ ...acctForm, confirmPin: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={acctForm.forcePasswordChange} onChange={e => setAcctForm({ ...acctForm, forcePasswordChange: e.target.checked })} />
            Force password change on next login
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <Button className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest" onClick={saveAccount}>
            {editAccount ? 'Update Account' : 'Create Account'}
          </Button>
          <Button variant="outline" className="h-10 text-[10px] font-black uppercase tracking-widest" onClick={() => setShowAccountModal(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* ============ ROLE MODAL ============ */}
      <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title={editRole ? 'Edit Role' : 'Create Role'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Role Name *</label>
              <Input className="h-9 text-xs" value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Description</label>
              <Input className="h-9 text-xs" value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} />
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">Permissions</p>
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1">
              {PERMISSION_GROUPS.map(g => {
                const allSelected = g.permissions.every(p => rolePerms[p]);
                const someSelected = g.permissions.some(p => rolePerms[p]);
                return (
                  <div key={g.key} className="p-3 rounded-xl border bg-muted/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest">{g.label}</p>
                      <Button variant="ghost" size="sm" className="h-5 text-[8px] px-1.5" onClick={() => toggleGroup(g.permissions, !allSelected)}>
                        {allSelected ? 'Deselect all' : 'Select all'}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {g.permissions.map(p => (
                        <button
                          key={p}
                          onClick={() => togglePerm(p)}
                          className={`text-[8px] px-2 py-0.5 rounded-full border transition-all ${
                            rolePerms[p] ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-muted-foreground/20 hover:border-muted-foreground/40'
                          }`}
                        >
                          {p.split('.')[1] || p}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest" onClick={saveRole}>
            {editRole ? 'Update Role' : 'Create Role'}
          </Button>
          <Button variant="outline" className="h-10 text-[10px] font-black uppercase tracking-widest" onClick={() => setShowRoleModal(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* ============ DELETE CONFIRM ============ */}
      <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title={`Delete ${showDeleteConfirm?.type || ''}`} size="sm">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mx-auto">
            <Trash2 size={24} />
          </div>
          <p className="text-sm font-bold">Delete "{showDeleteConfirm?.name}"?</p>
          <p className="text-[10px] text-muted-foreground">This action cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="destructive" className="flex-1" onClick={deleteItem}>Delete</Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ============ EMPLOYEE DETAIL ============ */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Employee Details" size="md">
        {showDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-black text-primary">
                {showDetail.firstName?.[0]}{showDetail.lastName?.[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold">{showDetail.firstName} {showDetail.lastName}</h3>
                <p className="text-xs text-muted-foreground">{showDetail.roleName || 'No role'} {showDetail.department && `· ${showDetail.department}`}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Code</span><p>{showDetail.employeeCode || '—'}</p></div>
              <div><span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Status</span><p>{getStatusBadge(showDetail.employmentStatus || (showDetail.isActive ? 'active' : 'inactive'))}</p></div>
              <div><span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Phone</span><p>{showDetail.phone || '—'}</p></div>
              <div><span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Email</span><p>{showDetail.email || '—'}</p></div>
              <div><span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Gender</span><p>{showDetail.gender || '—'}</p></div>
              <div><span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">DOB</span><p>{showDetail.dateOfBirth || '—'}</p></div>
              <div><span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Hire Date</span><p>{showDetail.hireDate || '—'}</p></div>
              <div><span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Warehouse</span><p>{showDetail.warehouseName || '—'}</p></div>
              <div className="col-span-2"><span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Address</span><p>{showDetail.address || '—'}</p></div>
              <div className="col-span-2"><span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Emergency Contact</span><p>{showDetail.emergencyContact || '—'}</p></div>
              {showDetail.notes && <div className="col-span-2"><span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Notes</span><p>{showDetail.notes}</p></div>}
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest" onClick={() => setShowDetail(null)}>Close</Button>
        </div>
      </Modal>
    </div>
  );
};

export default UsersEmployees;
