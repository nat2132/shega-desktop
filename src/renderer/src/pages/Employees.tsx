import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, ShieldCheck, KeyRound,
  Search, Plus, Edit2, Trash2, RefreshCw, LogIn
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { DatePicker } from '../components/DatePicker';

type Tab = 'employees' | 'roles' | 'accounts';

const Employees: React.FC = () => {
  const { t, formatDateTime } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>('employees');

  const [employees, setEmployees] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<number | ''>('');

  // Modals
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const [empForm, setEmpForm] = useState({ employeeCode: '', firstName: '', lastName: '', phone: '', email: '', roleId: 0, hireDate: '' });
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] as string[] });
  const [accountForm, setAccountForm] = useState({ employeeId: 0, username: '', pin: '' });

  useEffect(() => {
    loadEmployees();
    loadRoles();
  }, []);

  useEffect(() => {
    if (activeTab === 'accounts') loadAccounts();
  }, [activeTab]);

  const loadEmployees = async () => {
    try {
      const opts: any = {};
      if (searchQuery) opts.search = searchQuery;
      if (roleFilter !== '') opts.roleId = roleFilter;
      setEmployees(await window.api.getEmployees(opts) || []);
    } catch (err) { console.error(err); }
  };

  const loadRoles = async () => {
    try { setRoles(await window.api.getEmployeeRoles() || []); } catch (err) { console.error(err); }
  };

  const loadAccounts = async () => {
    try { setAccounts(await window.api.getEmployeeAccounts() || []); } catch (err) { console.error(err); }
  };

  // Employee CRUD
  const openCreateEmployee = () => {
    setEditingEmployee(null);
    setEmpForm({ employeeCode: '', firstName: '', lastName: '', phone: '', email: '', roleId: 0, hireDate: '' });
    setShowEmployeeModal(true);
  };

  const openEditEmployee = (emp: any) => {
    setEditingEmployee(emp);
    setEmpForm({
      employeeCode: emp.employeeCode || '',
      firstName: emp.firstName,
      lastName: emp.lastName,
      phone: emp.phone || '',
      email: emp.email || '',
      roleId: emp.roleId || 0,
      hireDate: emp.hireDate || ''
    });
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = async () => {
    if (!empForm.firstName.trim() || !empForm.lastName.trim()) {
      return toast.error(t('employees.fill_required'));
    }
    try {
      if (editingEmployee) {
        await window.api.updateEmployee(editingEmployee.id, empForm);
        toast.success(t('employees.emp_updated'));
      } else {
        await window.api.insertEmployee(empForm);
        toast.success(t('employees.emp_created'));
      }
      setShowEmployeeModal(false);
      loadEmployees();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteEmployee = async () => {
    if (!deleteTarget) return;
    try {
      await window.api.deleteEmployee(deleteTarget.id);
      toast.success(t('employees.emp_deleted'));
      setDeleteTarget(null);
      loadEmployees();
    } catch (err: any) { toast.error(err.message); }
  };

  // Role CRUD
  const openCreateRole = () => {
    setEditingRole(null);
    setRoleForm({ name: '', description: '', permissions: [] });
    setShowRoleModal(true);
  };

  const openEditRole = (role: any) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissions: JSON.parse(role.permissions || '[]')
    });
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) return toast.error(t('employees.fill_required'));
    try {
      if (editingRole) {
        await window.api.updateEmployeeRole(editingRole.id, roleForm);
        toast.success(t('employees.role_updated'));
      } else {
        await window.api.insertEmployeeRole(roleForm);
        toast.success(t('employees.role_created'));
      }
      setShowRoleModal(false);
      loadRoles();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteRole = async (id: number) => {
    try {
      await window.api.deleteEmployeeRole(id);
      toast.success(t('employees.role_deleted'));
      loadRoles();
    } catch (err: any) { toast.error(err.message); }
  };

  // Account CRUD
  const openCreateAccount = () => {
    setEditingAccount(null);
    setAccountForm({ employeeId: 0, username: '', pin: '' });
    setShowAccountModal(true);
  };

  const openEditAccount = (acct: any) => {
    setEditingAccount(acct);
    setAccountForm({ employeeId: acct.employeeId, username: acct.username, pin: '' });
    setShowAccountModal(true);
  };

  const handleSaveAccount = async () => {
    if (!accountForm.employeeId || !accountForm.username.trim()) {
      return toast.error(t('employees.fill_required'));
    }
    try {
      if (editingAccount) {
        await window.api.updateEmployeeAccount(editingAccount.id, accountForm);
        toast.success(t('employees.account_updated'));
      } else {
        if (!accountForm.pin) return toast.error(t('employees.fill_required'));
        await window.api.insertEmployeeAccount(accountForm);
        toast.success(t('employees.account_created'));
      }
      setShowAccountModal(false);
      loadAccounts();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteAccount = async (id: number) => {
    try {
      await window.api.deleteEmployeeAccount(id);
      toast.success(t('employees.account_deleted'));
      loadAccounts();
    } catch (err: any) { toast.error(err.message); }
  };

  const tabs = [
    { id: 'employees' as Tab, label: t('employees.employees'), icon: Users },
    { id: 'roles' as Tab, label: t('employees.roles'), icon: ShieldCheck },
    { id: 'accounts' as Tab, label: t('employees.accounts'), icon: KeyRound },
  ];

  const allPermissionOptions = [
    'dashboard', 'inventory', 'sales', 'expenses',
    'customers', 'analytics', 'adjustments', 'settings',
    'warehouses', 'employees'
  ];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
      {/* Tabs */}
      <div className="px-4 lg:px-6">
        <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border w-fit">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg"
            >
              <tab.icon size={14} className="mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="px-4 lg:px-6">
        {/* EMPLOYEES TAB */}
        {activeTab === 'employees' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 max-w-xs">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('employees.search')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 text-xs rounded-xl"
                  />
                </div>
              </div>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value === '' ? '' : Number(e.target.value))}
                className="h-9 px-3 rounded-xl border bg-background text-xs font-bold"
              >
                <option value="">{t('employees.all_roles')}</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <Button size="sm" variant="outline" className="h-9 text-[10px] font-black uppercase tracking-widest" onClick={loadEmployees}>
                <RefreshCw size={14} className="mr-2" /> {t('employees.refresh')}
              </Button>
              <Button size="sm" className="h-9 px-5 text-[10px] font-black uppercase tracking-widest" onClick={openCreateEmployee}>
                <UserPlus size={14} className="mr-2" /> {t('employees.add')}
              </Button>
            </div>
            <div className="rounded-2xl border bg-card/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/50 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      <th className="p-4">{t('employees.code')}</th>
                      <th className="p-4">{t('employees.name')}</th>
                      <th className="p-4">{t('employees.phone')}</th>
                      <th className="p-4">{t('employees.role')}</th>
                      <th className="p-4">{t('employees.account')}</th>
                      <th className="p-4">{t('employees.status')}</th>
                      <th className="p-4">{t('employees.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => (
                      <tr key={emp.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                        <td className="p-4 text-[10px] font-semibold">{emp.employeeCode || '-'}</td>
                        <td className="p-4">
                          <p className="text-xs font-black uppercase tracking-tight">{emp.firstName} {emp.lastName}</p>
                          {emp.email && <p className="text-[9px] text-muted-foreground">{emp.email}</p>}
                        </td>
                        <td className="p-4 text-[10px] font-semibold">{emp.phone || '-'}</td>
                        <td className="p-4">
                          <Badge variant="secondary" className="text-[9px] font-black">{emp.roleName || '-'}</Badge>
                        </td>
                        <td className="p-4">
                          {emp.hasAccount ? (
                            <Badge variant="default" className="text-[9px] font-black"><LogIn size={10} className="mr-1" /> {t('employees.has_account')}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-black">{t('employees.no_account')}</Badge>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge variant={emp.isActive ? 'default' : 'secondary'} className="text-[9px] font-black uppercase">
                            {emp.isActive ? t('employees.active') : t('employees.inactive')}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest" onClick={() => openEditEmployee(emp)}>
                              <Edit2 size={11} className="mr-1" /> {t('employees.edit')}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest text-destructive" onClick={() => { setDeleteTarget(emp); }}>
                              <Trash2 size={11} className="mr-1" /> {t('employees.delete')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {employees.length === 0 && (
                      <tr><td colSpan={7} className="p-12 text-center"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('employees.no_employees')}</p></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ROLES TAB */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{roles.length} {t('employees.roles')}</p>
              <Button size="sm" className="h-9 px-5 text-[10px] font-black uppercase tracking-widest" onClick={openCreateRole}>
                <Plus size={14} className="mr-2" /> {t('employees.add')}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {roles.map(role => {
                const perms = JSON.parse(role.permissions || '[]');
                return (
                  <div key={role.id} className="p-5 rounded-2xl border-2 bg-card/40 border-muted hover:border-muted-foreground/30 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight">{role.name}</p>
                          {role.description && <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">{role.description}</p>}
                        </div>
                      </div>
                      {role.isSystem ? (
                        <Badge variant="outline" className="text-[7px] font-black uppercase">{t('employees.system')}</Badge>
                      ) : null}
                    </div>
                    {perms.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1">
                        {perms.map((p: string) => (
                          <Badge key={p} variant="secondary" className="text-[7px] font-black uppercase">{p}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-4 pt-3 border-t border-border/30">
                      <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest" onClick={() => openEditRole(role)}>
                        <Edit2 size={11} className="mr-1" /> {t('employees.edit')}
                      </Button>
                      {!role.isSystem && (
                        <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest text-destructive" onClick={() => handleDeleteRole(role.id)}>
                          <Trash2 size={11} className="mr-1" /> {t('employees.delete')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {roles.length === 0 && (
                <div className="col-span-full p-12 text-center">
                  <ShieldCheck size={32} className="mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('employees.no_roles')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ACCOUNTS TAB */}
        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{accounts.length} {t('employees.accounts')}</p>
              <Button size="sm" className="h-9 px-5 text-[10px] font-black uppercase tracking-widest" onClick={openCreateAccount}>
                <KeyRound size={14} className="mr-2" /> {t('employees.add')}
              </Button>
            </div>
            <div className="rounded-2xl border bg-card/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/50 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      <th className="p-4">{t('employees.employee')}</th>
                      <th className="p-4">{t('employees.username')}</th>
                      <th className="p-4">{t('employees.last_login')}</th>
                      <th className="p-4">{t('employees.status')}</th>
                      <th className="p-4">{t('employees.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map(acct => (
                      <tr key={acct.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <p className="text-xs font-black uppercase tracking-tight">{acct.firstName} {acct.lastName}</p>
                          <p className="text-[9px] text-muted-foreground">{acct.employeeCode || ''}</p>
                        </td>
                        <td className="p-4 text-[10px] font-semibold">{acct.username}</td>
                        <td className="p-4 text-[10px] font-semibold">{acct.lastLogin ? formatDateTime(acct.lastLogin) : '-'}</td>
                        <td className="p-4">
                          <Badge variant={acct.isActive ? 'default' : 'secondary'} className="text-[9px] font-black uppercase">
                            {acct.isActive ? t('employees.active') : t('employees.inactive')}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest" onClick={() => openEditAccount(acct)}>
                              <Edit2 size={11} className="mr-1" /> {t('employees.edit')}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest text-destructive" onClick={() => handleDeleteAccount(acct.id)}>
                              <Trash2 size={11} className="mr-1" /> {t('employees.delete')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {accounts.length === 0 && (
                      <tr><td colSpan={5} className="p-12 text-center"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('employees.no_accounts')}</p></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Employee Modal */}
      <Modal isOpen={showEmployeeModal} onClose={() => setShowEmployeeModal(false)} title={editingEmployee ? t('employees.edit_employee') : t('employees.new_employee')} size="md">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('employees.first_name')} *</label>
              <Input value={empForm.firstName} onChange={e => setEmpForm({ ...empForm, firstName: e.target.value })} placeholder="e.g. John" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('employees.last_name')} *</label>
              <Input value={empForm.lastName} onChange={e => setEmpForm({ ...empForm, lastName: e.target.value })} placeholder="e.g. Doe" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('employees.employee_code')}</label>
              <Input value={empForm.employeeCode} onChange={e => setEmpForm({ ...empForm, employeeCode: e.target.value })} placeholder="e.g. EMP-001" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('employees.role')}</label>
              <select
                value={empForm.roleId}
                onChange={e => setEmpForm({ ...empForm, roleId: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-bold"
              >
                <option value={0}>--</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('employees.phone')}</label>
              <Input value={empForm.phone} onChange={e => setEmpForm({ ...empForm, phone: e.target.value })} placeholder="e.g. +251..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('employees.email_label')}</label>
              <Input value={empForm.email} onChange={e => setEmpForm({ ...empForm, email: e.target.value })} placeholder="e.g. employee@shega.tech" type="email" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('employees.hire_date')}</label>
            <DatePicker value={empForm.hireDate} onChange={v => setEmpForm({ ...empForm, hireDate: v })} className="h-10" />
          </div>
          <div className="flex gap-4 pt-2">
            <Button className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest" onClick={handleSaveEmployee}>
              {editingEmployee ? t('employees.update') : t('employees.create')}
            </Button>
            <Button variant="outline" className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest" onClick={() => setShowEmployeeModal(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Role Modal */}
      <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title={editingRole ? t('employees.edit_role') : t('employees.new_role')} size="md">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('employees.role_name')} *</label>
            <Input value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} placeholder="e.g. Cashier" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('employees.description')}</label>
            <textarea
              value={roleForm.description}
              onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
              className="w-full h-20 px-3 py-2 rounded-xl border bg-background text-xs font-semibold resize-none"
              placeholder={t('employees.description_placeholder')}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('employees.permissions')}</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded-xl border">
              {allPermissionOptions.map(p => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roleForm.permissions.includes(p)}
                    onChange={() => {
                      setRoleForm({
                        ...roleForm,
                        permissions: roleForm.permissions.includes(p)
                          ? roleForm.permissions.filter(x => x !== p)
                          : [...roleForm.permissions, p]
                      });
                    }}
                    className="rounded border-muted-foreground/30"
                  />
                  <span className="text-[10px] font-semibold uppercase">{p}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-4 pt-2">
            <Button className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest" onClick={handleSaveRole}>
              {editingRole ? t('employees.update') : t('employees.create')}
            </Button>
            <Button variant="outline" className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest" onClick={() => setShowRoleModal(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Account Modal */}
      <Modal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} title={editingAccount ? t('employees.edit_account') : t('employees.new_account')} size="sm">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('employees.employee')} *</label>
            <select
              value={accountForm.employeeId}
              onChange={e => setAccountForm({ ...accountForm, employeeId: Number(e.target.value) })}
              className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-bold"
              disabled={!!editingAccount}
            >
              <option value={0}>{t('employees.select_employee')}</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('employees.username')} *</label>
            <Input value={accountForm.username} onChange={e => setAccountForm({ ...accountForm, username: e.target.value })} placeholder="e.g. johndoe" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('employees.pin')} {editingAccount ? `(${t('employees.leave_blank')})` : '*'}</label>
            <Input value={accountForm.pin} onChange={e => setAccountForm({ ...accountForm, pin: e.target.value })} type="password" maxLength={10} placeholder="****" />
          </div>
          <div className="flex gap-4 pt-2">
            <Button className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest" onClick={handleSaveAccount}>
              {editingAccount ? t('employees.update') : t('employees.create')}
            </Button>
            <Button variant="outline" className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest" onClick={() => setShowAccountModal(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setDeleteTarget(null); }}>
          <div className="p-6 rounded-2xl bg-card border shadow-xl max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black uppercase tracking-widest">{t('employees.delete_title')}</h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-3">
              {t('employees.delete_desc').replace('{name}', `${deleteTarget.firstName} ${deleteTarget.lastName}`)}
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="destructive" className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest" onClick={handleDeleteEmployee}>
                {t('employees.delete')}
              </Button>
              <Button variant="outline" className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest" onClick={() => { setDeleteTarget(null); }}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
