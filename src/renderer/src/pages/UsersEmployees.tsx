import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, UserCog, Shield, Clock,
  Search, Edit, Trash2, Lock, Unlock, Key,
  AlertCircle, Copy, Plus,
  RefreshCw, Eye,
  ShieldAlert, KeyRound
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { useSettings } from '../context/SettingsContext';
import { DatePicker } from '../components/DatePicker';

type Tab = 'directory' | 'accounts' | 'roles' | 'attendance';

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
  const { t, formatDate, formatTime } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>('directory');

  const [employees, setEmployees] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
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
  const [attendanceFilter, setAttendanceFilter] = useState({ fromDate: '', toDate: '', employeeId: '' });
  const [todayAtt, setTodayAtt] = useState<any[]>([]);

  const loadData = async () => {
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

  useEffect(() => { loadData(); }, [search, filterRole, filterStatus]);
  useEffect(() => { if (activeTab === 'attendance') loadAttendance(); }, [activeTab, attendanceFilter]);

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
    if (!empForm.firstName || !empForm.lastName) { toast.error(t('employees.name_required', 'Name is required')); return; }
    try {
      if (editEmployee) {
        await window.api?.updateEmployee(editEmployee.id, { ...empForm, roleId: empForm.roleId ? parseInt(empForm.roleId) : null, warehouseId: empForm.warehouseId ? parseInt(empForm.warehouseId) : null });
        toast.success(t('employees.emp_updated', 'Employee updated'));
      } else {
        await window.api?.insertEmployee({ ...empForm, roleId: empForm.roleId ? parseInt(empForm.roleId) : null, warehouseId: empForm.warehouseId ? parseInt(empForm.warehouseId) : null });
        toast.success(t('employees.emp_created', 'Employee created'));
      }
      setShowEmployeeModal(false);
      loadData();
    } catch { toast.error(t('employees.emp_save_failed', 'Failed to save employee')); }
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
    if (!acctForm.username) { toast.error(t('employees.username_required', 'Username is required')); return; }
    if (!editAccount && !acctForm.pin) { toast.error(t('employees.pin_required', 'PIN is required')); return; }
    if (acctForm.pin && acctForm.pin !== acctForm.confirmPin) { toast.error(t('employees.pin_mismatch', 'PINs do not match')); return; }
    if (acctForm.pin && acctForm.pin.length < 4) { toast.error(t('employees.pin_min_length', 'PIN must be at least 4 characters')); return; }
    try {
      if (editAccount) {
        await window.api?.updateEmployeeAccount(editAccount.id, { ...acctForm, employeeId: parseInt(acctForm.employeeId), pin: acctForm.pin || undefined });
        toast.success(t('employees.account_updated', 'Account updated'));
      } else {
        await window.api?.insertEmployeeAccount({ ...acctForm, employeeId: parseInt(acctForm.employeeId) });
        toast.success(t('employees.account_created', 'Account created'));
      }
      setShowAccountModal(false);
      loadData();
    } catch { toast.error(t('employees.acct_save_failed', 'Failed to save account')); }
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
    if (!roleForm.name) { toast.error(t('employees.role_name_required', 'Role name is required')); return; }
    const selectedPerms = Object.entries(rolePerms).filter(([, v]) => v).map(([k]) => k);
    try {
      if (editRole) {
        await window.api?.updateEmployeeRole(editRole.id, { ...roleForm, permissions: selectedPerms });
        toast.success(t('employees.role_updated', 'Role updated'));
      } else {
        await window.api?.insertEmployeeRole({ ...roleForm, permissions: selectedPerms });
        toast.success(t('employees.role_created', 'Role created'));
      }
      setShowRoleModal(false);
      loadData();
    } catch { toast.error(t('employees.role_save_failed', 'Failed to save role')); }
  };

  const copyRole = async (id: number) => {
    await window.api?.duplicateEmployeeRole(id);
    toast.success(t('employees.role_duplicated', 'Role duplicated'));
    loadData();
  };

  const deleteItem = async () => {
    if (!showDeleteConfirm) return;
    try {
      const { type, id } = showDeleteConfirm;
      if (type === 'employee') await window.api?.deleteEmployee(id);
      else if (type === 'account') await window.api?.deleteEmployeeAccount(id);
      else if (type === 'role') await window.api?.deleteEmployeeRole(id);
      toast.success(type === 'employee' ? t('employees.emp_deleted', 'Employee deleted') : type === 'account' ? t('employees.account_deleted', 'Account deleted') : t('employees.role_deleted', 'Role deleted'));
      setShowDeleteConfirm(null);
      loadData();
    } catch { toast.error(t('employees.delete_failed', 'Delete failed')); }
  };

  const handleClockIn = async (empId: number) => {
    try {
      await window.api?.clockIn(empId);
      toast.success(t('employees.clock_in', 'Clocked in'));
      loadAttendance();
    } catch { toast.error(t('employees.already_clocked_in', 'Already clocked in today')); }
  };

  const handleClockOut = async (empId: number) => {
    try {
      await window.api?.clockOut(empId);
      toast.success(t('employees.clock_out', 'Clocked out'));
      loadAttendance();
    } catch { toast.error(t('employees.clock_out_failed', 'Clock out failed')); }
  };

  const handleLockAccount = async (id: number, lock: boolean) => {
    try {
      if (lock) {
        await window.api?.lockUserAccount(id);
      } else {
        await window.api?.unlockUserAccount(id);
      }
      toast.success(lock ? t('employees.lock_account', 'Account locked') : t('employees.unlock_account', 'Account unlocked'));
      loadData();
    } catch { toast.error(t('employees.account_update_failed', 'Failed to update account')); }
  };

  const handleForcePinChange = async (id: number) => {
    try {
      await window.api?.forcePinChange(id);
      toast.success(t('employees.force_pin_change_set', 'Force PIN change set for next login'));
      loadData();
    } catch { toast.error(t('employees.force_pin_change_failed', 'Failed to force PIN change')); }
  };

  const handleGenerateRecoveryKey = async (acct: any) => {
    try {
      const result = await window.api?.generateRecoveryKey('employee', acct.employeeId);
      if (result?.recoveryKey) {
        const fullKey = result.recoveryKey;
        const blob = new Blob([`Shega OS Recovery Key\n${t('employees.username', 'Username')}: ${acct.username}\nKey: ${fullKey}\n`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shega-recovery-${acct.username}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t('employees.recovery_key_generated', 'Recovery key generated and downloaded'));
      }
    } catch { toast.error(t('employees.recovery_key_failed', 'Failed to generate recovery key')); }
  };

  const handleResetPin = async (id: number) => {
    const newPin = prompt(t('employees.pin_prompt', 'Enter new PIN (min 4 characters):'));
    if (!newPin || newPin.length < 4) { toast.error(t('employees.pin_min_length', 'PIN must be at least 4 characters')); return; }
    const confirmPin = prompt(t('employees.confirm_pin_prompt', 'Confirm new PIN:'));
    if (newPin !== confirmPin) { toast.error(t('employees.pin_mismatch', 'PINs do not match')); return; }
    try {
      await window.api?.resetEmployeePassword(id, newPin);
      toast.success(t('employees.pin_reset_success', 'PIN reset successful'));
      loadData();
    } catch { toast.error(t('employees.pin_reset_failed', 'Failed to reset PIN')); }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = { active: 'success', inactive: 'secondary', suspended: 'destructive', pending: 'warning' };
    return <Badge variant={variants[status] || 'outline'} className="text-xs font-black uppercase tracking-widest">{status}</Badge>;
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'directory', label: t('employees.directory', 'Directory'), icon: Users },
    { id: 'accounts', label: t('employees.accounts', 'Accounts'), icon: UserCog },
    { id: 'roles', label: t('employees.roles', 'Roles'), icon: Shield },
    { id: 'attendance', label: t('employees.attendance', 'Attendance'), icon: Clock },
  ];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
      <div className="px-4 lg:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight">{t('employees.heading', 'Users & Employees')}</h1>
          <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-1">{t('employees.subtitle', 'Unified workforce management')}</p>
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
              className="h-8 px-4 text-xs font-black uppercase tracking-widest gap-1.5"
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
                <Input placeholder={t('employees.search', 'Search employees...')} className="pl-8 h-9 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="h-9 rounded-lg border bg-background px-3 text-xs" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                <option value="">{t('employees.all_roles', 'All Roles')}</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select className="h-9 rounded-lg border bg-background px-3 text-xs" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">{t('employees.all_status', 'All Status')}</option>
                <option value="active">{t('employees.active', 'Active')}</option>
                <option value="inactive">{t('employees.inactive', 'Inactive')}</option>
                <option value="suspended">{t('employees.suspended', 'Suspended')}</option>
              </select>
              <Button size="sm" variant="outline" onClick={() => loadData()} className="h-9 px-3"><RefreshCw size={14} /></Button>
              <Button size="sm" onClick={() => openEmployeeModal()} className="h-9 px-4 gap-1.5 text-xs font-black uppercase tracking-widest">
                <UserPlus size={14} /> {t('employees.add_employee', 'Add Employee')}
              </Button>
            </div>
            <div className="rounded-xl border bg-card/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.employee', 'Employee')}</th>
                      <th className="text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.code', 'Code')}</th>
                      <th className="text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.role', 'Role')}</th>
                      <th className="text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.department', 'Department')}</th>
                      <th className="text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.phone', 'Contact')}</th>
                      <th className="text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.status', 'Status')}</th>
                      <th className="text-right p-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length === 0 && (
                      <tr><td colSpan={7} className="p-8 text-center text-xs text-muted-foreground">{t('employees.no_employees', 'No employees found')}</td></tr>
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
                              <p className="text-xs text-muted-foreground">{emp.email || t('employees.no_email', 'No email')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{emp.employeeCode || '—'}</code></td>
                        <td className="p-3"><Badge variant="outline" className="text-xs font-bold">{emp.roleName || '—'}</Badge></td>
                        <td className="p-3 text-muted-foreground">{emp.department || '—'}</td>
                        <td className="p-3">
                          <p className="text-xs">{emp.phone || '—'}</p>
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
              <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">{t('employees.accounts_count', '{count} accounts', { count: accounts.length })}</p>
              <Button size="sm" onClick={() => openAccountModal()} className="h-9 px-4 gap-1.5 text-xs font-black uppercase tracking-widest">
                <Plus size={14} /> {t('employees.create_account_btn', 'Create Account')}
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
                        <p className="text-xs text-muted-foreground">@{acct.username}</p>
                      </div>
                    </div>
                    <Badge variant={acct.isActive ? 'success' : 'secondary'} className="text-xs h-4 px-1.5">
                      {acct.isActive ? t('employees.active', 'Active') : t('employees.inactive', 'Inactive')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">{acct.roleName || t('employees.no_role', 'No role')}</Badge>
                    {acct.lastLogin && <span>Last: {formatDate(acct.lastLogin)}</span>}
                  </div>
                  {acct.lockedUntil && new Date(acct.lockedUntil) > new Date() && (
                    <div className="flex items-center gap-1.5 text-xs text-destructive font-bold">
                      <AlertCircle size={10} /> Locked until {formatTime(acct.lockedUntil)}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 pt-1 border-t">
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1" onClick={() => openAccountModal(acct)}><Edit size={10} /> {t('employees.edit', 'Edit')}</Button>
                    {acct.isActive ? (
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1 text-destructive" onClick={() => handleLockAccount(acct.id, true)}><Lock size={10} /> {t('employees.lock_account', 'Lock')}</Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1 text-green-600" onClick={() => handleLockAccount(acct.id, false)}><Unlock size={10} /> {t('employees.unlock_account', 'Unlock')}</Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1" onClick={() => handleResetPin(acct.id)}><Key size={10} /> {t('employees.reset_pin_btn', 'Reset PIN')}</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1" onClick={() => handleForcePinChange(acct.id)}><ShieldAlert size={10} /> {t('employees.force_change_btn', 'Force Change')}</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1" onClick={() => handleGenerateRecoveryKey(acct)}><KeyRound size={10} /> {t('employees.recovery_key_btn', 'Recovery Key')}</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1 text-destructive" onClick={() => setShowDeleteConfirm({ type: 'account', id: acct.id, name: acct.username })}><Trash2 size={10} /></Button>
                  </div>
                </div>
              ))}
              {accounts.length === 0 && (
                <div className="col-span-full p-12 text-center text-xs text-muted-foreground">{t('employees.no_accounts_created', 'No accounts created yet')}</div>
              )}
            </div>
          </div>
        )}

        {/* ============ ROLES TAB ============ */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">{t('employees.roles_count', '{count} roles', { count: roles.length })}</p>
              <Button size="sm" onClick={() => openRoleModal()} className="h-9 px-4 gap-1.5 text-xs font-black uppercase tracking-widest">
                <Plus size={14} /> {t('employees.create_role_btn', 'Create Role')}
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
                          <p className="text-xs text-muted-foreground">{role.description || ''}</p>
                        </div>
                      </div>
                      {role.isSystem ? <Badge variant="secondary" className="text-xs">{t('employees.system', 'System')}</Badge> : null}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {perms.slice(0, 5).map((p: string) => (
                        <Badge key={p} variant="outline" className="text-[7px] px-1.5 py-0">{p.split('.')[1] || p}</Badge>
                      ))}
                      {perms.length > 5 && <Badge variant="outline" className="text-[7px]">+{perms.length - 5}</Badge>}
                    </div>
                    <div className="flex gap-1 pt-1 border-t">
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1" onClick={() => openRoleModal(role)}><Edit size={10} /> {t('employees.edit', 'Edit')}</Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1" onClick={() => copyRole(role.id)}><Copy size={10} /> {t('employees.copy', 'Copy')}</Button>
                      {!role.isSystem && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1 text-destructive" onClick={() => setShowDeleteConfirm({ type: 'role', id: role.id, name: role.name })}><Trash2 size={10} /></Button>
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
                <h3 className="text-xs font-black uppercase tracking-widest mb-3">{t('employees.today_attendance', "Today's Attendance")}</h3>
                <div className="space-y-2">
                  {todayAtt.length === 0 && <p className="text-xs text-muted-foreground">{t('employees.no_one_clocked_in', 'No one clocked in yet today.')}</p>}
                  {todayAtt.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                      <div>
                        <p className="text-xs font-bold">{a.firstName} {a.lastName}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('employees.in', 'In')}: {a.clockIn ? formatTime(a.clockIn) : '—'} | {t('employees.out', 'Out')}: {a.clockOut ? formatTime(a.clockOut) : <span className="text-green-500">{t('employees.active_status', 'Active')}</span>}
                        </p>
                      </div>
                      <Badge variant={a.status === 'present' ? 'success' : a.status === 'partial' ? 'warning' : 'secondary'} className="text-xs">{a.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border bg-card/40 p-4">
                <h3 className="text-xs font-black uppercase tracking-widest mb-3">{t('employees.quick_clock', 'Quick Clock')}</h3>
                <p className="text-xs text-muted-foreground mb-3">{t('employees.clock_in_out_desc', 'Clock in/out for employees')}</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {employees.filter(e => e.isActive).map(emp => (
                    <div key={emp.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {emp.firstName?.[0]}
                        </div>
                        <p className="text-xs font-bold">{emp.firstName} {emp.lastName}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => handleClockIn(emp.id)}>{t('employees.clock_in', 'Clock In')}</Button>
                        <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => handleClockOut(emp.id)}>{t('employees.clock_out', 'Clock Out')}</Button>
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
                      <th className="text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.employee', 'Employee')}</th>
                      <th className="text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.date', 'Date')}</th>
                      <th className="text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.clock_in', 'Clock In')}</th>
                      <th className="text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.clock_out', 'Clock Out')}</th>
                      <th className="text-left p-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.status', 'Status')}</th>
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
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t('employees.no_attendance_records', 'No attendance records')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============ EMPLOYEE MODAL ============ */}
      <Modal isOpen={showEmployeeModal} onClose={() => setShowEmployeeModal(false)} title={editEmployee ? t('employees.edit_employee', 'Edit Employee') : t('employees.new_employee', 'New Employee')} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.first_name_label', 'First Name *')}</label>
            <Input className="h-9 text-xs" value={empForm.firstName} onChange={e => setEmpForm({ ...empForm, firstName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.last_name_label', 'Last Name *')}</label>
            <Input className="h-9 text-xs" value={empForm.lastName} onChange={e => setEmpForm({ ...empForm, lastName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.phone_label_form', 'Phone')}</label>
            <Input className="h-9 text-xs" value={empForm.phone} onChange={e => setEmpForm({ ...empForm, phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.email_label_form', 'Email')}</label>
            <Input className="h-9 text-xs" value={empForm.email} onChange={e => setEmpForm({ ...empForm, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.role_label', 'Role')}</label>
            <select className="w-full h-9 rounded-lg border bg-background px-3 text-xs" value={empForm.roleId} onChange={e => setEmpForm({ ...empForm, roleId: e.target.value })}>
              <option value="">{t('employees.select_role', 'No Role')}</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.department_label', 'Department')}</label>
            <Input className="h-9 text-xs" value={empForm.department} onChange={e => setEmpForm({ ...empForm, department: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.warehouse_label', 'Warehouse')}</label>
            <select className="w-full h-9 rounded-lg border bg-background px-3 text-xs" value={empForm.warehouseId} onChange={e => setEmpForm({ ...empForm, warehouseId: e.target.value })}>
              <option value="">{t('employees.select_warehouse', 'None')}</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.employment_status_label', 'Employment Status')}</label>
            <select className="w-full h-9 rounded-lg border bg-background px-3 text-xs" value={empForm.employmentStatus} onChange={e => setEmpForm({ ...empForm, employmentStatus: e.target.value })}>
              <option value="active">{t('employees.active', 'Active')}</option>
              <option value="inactive">{t('employees.inactive', 'Inactive')}</option>
              <option value="suspended">{t('employees.suspended', 'Suspended')}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.gender_label_form', 'Gender')}</label>
            <select className="w-full h-9 rounded-lg border bg-background px-3 text-xs" value={empForm.gender} onChange={e => setEmpForm({ ...empForm, gender: e.target.value })}>
              <option value="">{t('employees.prefer_not_to_say_option', 'Prefer not to say')}</option>
              <option value="male">{t('employees.male_option', 'Male')}</option>
              <option value="female">{t('employees.female_option', 'Female')}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.date_of_birth_label', 'Date of Birth')}</label>
            <DatePicker value={empForm.dateOfBirth} onChange={v => setEmpForm({ ...empForm, dateOfBirth: v })} className="h-9 text-xs" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.hire_date_label', 'Hire Date')}</label>
            <DatePicker value={empForm.hireDate} onChange={v => setEmpForm({ ...empForm, hireDate: v })} className="h-9 text-xs" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.emergency_contact_label_form', 'Emergency Contact')}</label>
            <Input className="h-9 text-xs" value={empForm.emergencyContact} onChange={e => setEmpForm({ ...empForm, emergencyContact: e.target.value })} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.address_label_form', 'Address')}</label>
            <Input className="h-9 text-xs" value={empForm.address} onChange={e => setEmpForm({ ...empForm, address: e.target.value })} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.notes_label_form', 'Notes')}</label>
            <Input className="h-9 text-xs" value={empForm.notes} onChange={e => setEmpForm({ ...empForm, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button className="flex-1 h-10 text-xs font-black uppercase tracking-widest" onClick={saveEmployee}>
            {editEmployee ? t('employees.update_employee', 'Update Employee') : t('employees.create_employee', 'Create Employee')}
          </Button>
          <Button variant="outline" className="h-10 text-xs font-black uppercase tracking-widest" onClick={() => setShowEmployeeModal(false)}>{t('employees.cancel', 'Cancel')}</Button>
        </div>
      </Modal>

      {/* ============ ACCOUNT MODAL ============ */}
      <Modal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} title={editAccount ? t('employees.edit_account', 'Edit Account') : t('employees.new_account', 'New Account')} size="md">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.employee_required', 'Employee *')}</label>
            <select className="w-full h-9 rounded-lg border bg-background px-3 text-xs" value={acctForm.employeeId} onChange={e => setAcctForm({ ...acctForm, employeeId: e.target.value })}>
              <option value="">{t('employees.select_employee_placeholder', 'Select employee...')}</option>
              {employees.filter(e => !editAccount || e.id === editAccount.employeeId).map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} {emp.hasAccount ? t('employees.has_account_suffix', '(has account)') : ''}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.username_label', 'Username *')}</label>
            <Input className="h-9 text-xs" value={acctForm.username} onChange={e => setAcctForm({ ...acctForm, username: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{editAccount ? t('employees.pin_label_edit', 'New PIN (leave blank to keep)') : t('employees.pin_label_create', 'PIN *')}</label>
              <Input type="password" className="h-9 text-xs" value={acctForm.pin} onChange={e => setAcctForm({ ...acctForm, pin: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.confirm_pin', 'Confirm PIN')}</label>
              <Input type="password" className="h-9 text-xs" value={acctForm.confirmPin} onChange={e => setAcctForm({ ...acctForm, confirmPin: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={acctForm.forcePasswordChange} onChange={e => setAcctForm({ ...acctForm, forcePasswordChange: e.target.checked })} />
            {t('employees.force_password_change', 'Force password change on next login')}
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <Button className="flex-1 h-10 text-xs font-black uppercase tracking-widest" onClick={saveAccount}>
            {editAccount ? t('employees.update_account_btn', 'Update Account') : t('employees.create_account_btn', 'Create Account')}
          </Button>
          <Button variant="outline" className="h-10 text-xs font-black uppercase tracking-widest" onClick={() => setShowAccountModal(false)}>{t('employees.cancel', 'Cancel')}</Button>
        </div>
      </Modal>

      {/* ============ ROLE MODAL ============ */}
      <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title={editRole ? t('employees.edit_role', 'Edit Role') : t('employees.new_role', 'New Role')} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.role_name_label', 'Role Name *')}</label>
              <Input className="h-9 text-xs" value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('employees.description_label', 'Description')}</label>
              <Input className="h-9 text-xs" value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} />
            </div>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">{t('employees.permissions_label', 'Permissions')}</p>
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1">
              {PERMISSION_GROUPS.map(g => {
                const allSelected = g.permissions.every(p => rolePerms[p]);
                return (
                  <div key={g.key} className="p-3 rounded-xl border bg-muted/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-widest">{t(`tabs.${g.key}`, g.label)}</p>
                      <Button variant="ghost" size="sm" className="h-5 text-xs px-1.5" onClick={() => toggleGroup(g.permissions, !allSelected)}>
                        {allSelected ? t('employees.deselect_all', 'Deselect all') : t('employees.select_all', 'Select all')}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {g.permissions.map(p => (
                        <button
                          key={p}
                          onClick={() => togglePerm(p)}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
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
          <Button className="flex-1 h-10 text-xs font-black uppercase tracking-widest" onClick={saveRole}>
            {editRole ? t('employees.update_role_btn', 'Update Role') : t('employees.create_role_btn', 'Create Role')}
          </Button>
          <Button variant="outline" className="h-10 text-xs font-black uppercase tracking-widest" onClick={() => setShowRoleModal(false)}>{t('employees.cancel', 'Cancel')}</Button>
        </div>
      </Modal>

      {/* ============ DELETE CONFIRM ============ */}
      <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title={t('employees.confirm_delete_title', 'Delete {type}', { type: showDeleteConfirm?.type || '' })} size="sm">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mx-auto">
            <Trash2 size={24} />
          </div>
          <p className="text-sm font-bold">{t('employees.confirm_delete_question', 'Delete "{name}"?', { name: showDeleteConfirm?.name || '' })}</p>
          <p className="text-xs text-muted-foreground">{t('employees.cannot_undo', 'This action cannot be undone.')}</p>
          <div className="flex gap-3">
            <Button variant="destructive" className="flex-1" onClick={deleteItem}>{t('employees.delete_btn', 'Delete')}</Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(null)}>{t('employees.cancel', 'Cancel')}</Button>
          </div>
        </div>
      </Modal>

      {/* ============ EMPLOYEE DETAIL ============ */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={t('employees.employee_details', 'Employee Details')} size="md">
        {showDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-black text-primary">
                {showDetail.firstName?.[0]}{showDetail.lastName?.[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold">{showDetail.firstName} {showDetail.lastName}</h3>
                <p className="text-xs text-muted-foreground">{showDetail.roleName || t('employees.no_role', 'No role')} {showDetail.department && `· ${showDetail.department}`}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t('employees.code', 'Code')}</span><p>{showDetail.employeeCode || '—'}</p></div>
              <div><span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t('employees.status', 'Status')}</span><p>{getStatusBadge(showDetail.employmentStatus || (showDetail.isActive ? 'active' : 'inactive'))}</p></div>
              <div><span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t('employees.phone', 'Phone')}</span><p>{showDetail.phone || '—'}</p></div>
              <div><span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t('employees.email_label', 'Email')}</span><p>{showDetail.email || '—'}</p></div>
              <div><span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t('employees.gender', 'Gender')}</span><p>{showDetail.gender || '—'}</p></div>
              <div><span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t('employees.dob', 'DOB')}</span><p>{showDetail.dateOfBirth || '—'}</p></div>
              <div><span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t('employees.hire_date', 'Hire Date')}</span><p>{showDetail.hireDate || '—'}</p></div>
              <div><span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t('employees.warehouse', 'Warehouse')}</span><p>{showDetail.warehouseName || '—'}</p></div>
              <div className="col-span-2"><span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t('employees.address', 'Address')}</span><p>{showDetail.address || '—'}</p></div>
              <div className="col-span-2"><span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t('employees.emergency_contact', 'Emergency Contact')}</span><p>{showDetail.emergencyContact || '—'}</p></div>
              {showDetail.notes && <div className="col-span-2"><span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t('employees.notes', 'Notes')}</span><p>{showDetail.notes}</p></div>}
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1 h-10 text-xs font-black uppercase tracking-widest" onClick={() => setShowDetail(null)}>{t('employees.close_btn', 'Close')}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default UsersEmployees;
