import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Users, Phone, DollarSign,
  AlertTriangle, ShieldAlert,
  CheckCircle, UserCircle, Printer, FileText,
  Pencil, Trash2, X, Mail, MapPin, Building,
  CreditCard, Tag, MessageSquare, History, Save, Filter
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

import { useSettings } from '../context/SettingsContext';
import { SectionCards, SectionCardData } from '../components/section-cards';
import { DataTable } from '../components/data-table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import Modal from '../components/Modal';
import { computeTrend } from '../lib/trend-utils';
import { addPdfHeader } from '../lib/export-utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetClose, SheetFooter } from '../components/ui/sheet';

interface Customer {
  id: number;
  customerName: string;
  createdAt: string;
  phone: string;
  secondaryPhone: string;
  email: string;
  address: string;
  city: string;
  company: string;
  taxNumber: string;
  groupName: string;
  creditLimit: number;
  notes: string;
  isActive: number;
  salesStats: {
    transactionCount?: number;
    totalDebt?: number;
    totalPaid?: number;
    outstanding?: number;
    totalSales?: number;
    overdueCount?: number;
  };
}

interface DebtSale {
  id: number;
  itemName: string;
  totalPrice: number;
  paidAmount: number;
  quantity: number;
  createdAt: string;
  dueDate: string;
  paymentStatus: string;
}

interface CustomerNote {
  id: number;
  customerId: number;
  note: string;
  createdBy: string;
  createdAt: string;
}

const CUSTOMER_GROUPS = ['general', 'vip', 'wholesale', 'retail', 'corporate'];

const emptyCustomer: Customer = {
  id: 0, customerName: '', createdAt: '', phone: '', secondaryPhone: '', email: '',
  address: '', city: '', company: '', taxNumber: '', groupName: 'general',
  creditLimit: 0, notes: '', isActive: 1, salesStats: {}
};

const Customers: React.FC = () => {
  const { t, formatDate, currentBusiness } = useSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<DebtSale[]>([]);
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedSale, setSelectedSale] = useState<DebtSale | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer>({ ...emptyCustomer });
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterGroup, setFilterGroup] = useState('All');
  const [filterCity, setFilterCity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    window.api?.getCustomers().then((data: any[]) => {
      setCustomers(data);
    });
  };

  const uniqueGroups = useMemo(() => ['All', ...new Set(customers.map(c => c.groupName).filter(Boolean))], [customers]);
  const uniqueCities = useMemo(() => ['All', ...new Set(customers.map(c => c.city).filter(Boolean))], [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (filterGroup !== 'All' && c.groupName !== filterGroup) return false;
      if (filterCity !== 'All' && c.city !== filterCity) return false;
      if (filterStatus !== 'All' && (filterStatus === 'Active' ? !c.isActive : c.isActive)) return false;
      return true;
    });
  }, [customers, filterGroup, filterCity, filterStatus]);

  const viewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    window.api?.getCustomerSales(customer.customerName).then((data: DebtSale[]) => {
      setCustomerSales(data);
    });
    window.api?.getCustomerNotes(customer.id).then((data: CustomerNote[]) => {
      setCustomerNotes(data || []);
    });
    setNewNote('');
    setShowProfileModal(true);
  };

  const openNewCustomer = () => {
    setEditingCustomer({ ...emptyCustomer });
    setIsEditing(false);
    setShowFormModal(true);
  };

  const openEditCustomer = (customer: Customer) => {
    setEditingCustomer({ ...customer });
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = editingCustomer.customerName.trim();
    if (!trimmedName) return;
    const payload = { ...editingCustomer, customerName: trimmedName };
    let result;
    if (isEditing) {
      result = await window.api?.updateCustomer(payload);
    } else {
      result = await window.api?.insertCustomer(payload);
    }
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEditing ? 'Customer updated' : 'Customer created');
    setShowFormModal(false);
    loadCustomers();
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    const result = await window.api?.deleteCustomer(customer.id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Customer deactivated');
    loadCustomers();
    if (selectedCustomer?.id === customer.id) setShowProfileModal(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedCustomer) return;
    await window.api?.addCustomerNote(selectedCustomer.id, newNote, 'Admin');
    setNewNote('');
    const notes = await window.api?.getCustomerNotes(selectedCustomer.id);
    setCustomerNotes(notes || []);
  };

  const openPayment = (sale: DebtSale) => {
    setSelectedSale(sale);
    setPaymentAmount(String(sale.totalPrice - sale.paidAmount));
    setShowPaymentModal(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale || !paymentAmount) return;
    await window.api?.payDebt(selectedSale.id, parseFloat(paymentAmount));
    setShowPaymentModal(false);
    setPaymentAmount('');
    setSelectedSale(null);
    if (selectedCustomer) viewCustomer(selectedCustomer);
    loadCustomers();
  };

  const generateInvoicePDF = (sale: DebtSale) => {
    const doc = new jsPDF();
    const y0 = addPdfHeader(doc, currentBusiness, 8);
    const date = formatDate(new Date());
    let y = y0 + 4;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t('customers.invoice').toUpperCase(), 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t('common.date')}: ${date}`, 190, y, { align: 'right' });
    doc.text(`${t('sales.customer')}: ${selectedCustomer?.customerName}`, 15, y);
    y += 7;
    doc.text(`${t('sales.phone_number')}: ${selectedCustomer?.phone || 'N/A'}`, 15, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [[t('inventory.product'), t('common.quantity'), t('common.price'), t('common.total'), t('sales.paid'), t('sales.outstanding')]],
      body: [[
        sale.itemName, sale.quantity,
        `${t('common.etb')} ${(sale.totalPrice / sale.quantity).toLocaleString()}`,
        `${t('common.etb')} ${sale.totalPrice.toLocaleString()}`,
        `${t('common.etb')} ${sale.paidAmount.toLocaleString()}`,
        `${t('common.etb')} ${(sale.totalPrice - sale.paidAmount).toLocaleString()}`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] }
    });
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Shega Enterprise OS - Official Invoice", 105, 280, { align: 'center' });
    doc.save(`Invoice_${selectedCustomer?.customerName}_${sale.id}.pdf`);
  };

  const generateStatementPDF = (customer: Customer, sales: DebtSale[]) => {
    const doc = new jsPDF();
    const y0 = addPdfHeader(doc, currentBusiness, 8);
    const date = formatDate(new Date());
    let y = y0 + 4;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t('customers.statement').toUpperCase(), 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t('common.date')}: ${date}`, 190, y, { align: 'right' });
    doc.text(`${t('sales.customer')}: ${customer.customerName}`, 15, y);
    y += 7;
    doc.text(`${t('sales.phone_number')}: ${customer.phone || 'N/A'}`, 15, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [[t('common.date'), t('inventory.product'), t('common.total'), t('sales.paid'), t('sales.outstanding')]],
      body: sales.map(s => [
        formatDate(s.createdAt), s.itemName,
        s.totalPrice.toLocaleString(), s.paidAmount.toLocaleString(),
        (s.totalPrice - s.paidAmount).toLocaleString()
      ]),
      theme: 'striped',
      headStyles: { fillColor: [0, 0, 0] },
      foot: [['', 'TOTAL', customer.salesStats?.totalDebt?.toLocaleString() || '0',
        customer.salesStats?.totalPaid?.toLocaleString() || '0',
        (customer.salesStats?.outstanding || 0).toLocaleString()]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Shega Enterprise OS - Customer Statement", 105, 280, { align: 'center' });
    doc.save(`Statement_${customer.customerName}_${date.replace(/\//g, '-')}.pdf`);
  };

  const kpiCards: SectionCardData[] = useMemo(() => {
    const totalOutstanding = customers.reduce((sum, c) => sum + (c.salesStats?.outstanding || 0), 0);
    const totalPaid = customers.reduce((sum, c) => sum + (c.salesStats?.totalPaid || 0), 0);
    const debtCount = customers.filter(c => (c.salesStats?.outstanding || 0) > 0).length;
    const overdueAmt = totalOutstanding * 0.15;

    const outTrend = computeTrend(customers, 'createdAt', c => c.salesStats?.outstanding || 0);
    const colTrend = computeTrend(customers, 'createdAt', c => c.salesStats?.totalPaid || 0);
    const activeTrend = computeTrend(customers, 'createdAt', c => (c.salesStats?.outstanding || 0) > 0 ? 1 : 0);
    const overdueTrend = computeTrend(customers, 'createdAt', c => (c.salesStats?.outstanding || 0) * 0.15);

    return [
      { title: t('customers.outstanding'), value: `${t('common.etb')} ${totalOutstanding.toLocaleString()}`,
        ...outTrend, footerTitle: t('customers.credit_volume'), footerSub: t('customers.last_30') },
      { title: t('customers.collected'), value: `${t('common.etb')} ${totalPaid.toLocaleString()}`,
        ...colTrend, footerTitle: t('customers.recovery_rate'), footerSub: t('customers.high_efficiency') },
      { title: t('customers.active'), value: debtCount, ...activeTrend,
        footerTitle: t('customers.entity_count'), footerSub: t('customers.active_ledgers') },
      { title: t('customers.overdue'), value: `${t('common.etb')} ${overdueAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        ...overdueTrend, footerTitle: t('customers.est_risk'), footerSub: t('customers.action_req') },
    ];
  }, [customers]);

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "customerName",
      header: t('customers.identity'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <UserCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold">{row.original.customerName}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{row.original.phone || t('sales.walk_in')}</span>
              {row.original.groupName !== 'general' && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1">{row.original.groupName}</Badge>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      accessorKey: "salesStats.outstanding",
      header: () => <div className="text-right">{t('customers.outstanding')}</div>,
      cell: ({ row }) => (
        <div className="text-right font-black text-destructive">
          {t('common.etb')} {(row.original.salesStats?.outstanding || 0).toLocaleString()}
        </div>
      )
    },
    {
      accessorKey: "salesStats.transactionCount",
      header: t('customers.activity'),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold">{row.original.salesStats?.transactionCount || 0} {t('sales.transactions')}</span>
          <div className="h-1 w-20 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${Math.min(100, (row.original.salesStats?.transactionCount || 0) * 10)}%` }} />
          </div>
        </div>
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t('common.actions')}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => viewCustomer(row.original)}>{t('customers.view_ledger')}</Button>
          <Button variant="ghost" size="icon" onClick={() => openEditCustomer(row.original)} title="Edit Profile">
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => {
            window.api?.getCustomerSales(row.original.customerName).then((sales: DebtSale[]) => {
              generateStatementPDF(row.original, sales);
            });
          }} title={t('customers.statement')}>
            <Printer size={14} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
      <SectionCards cards={kpiCards} />

      <div className="px-4 lg:px-6 space-y-4">
        <div className="flex items-center justify-between">
          <div />
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className={`h-8 px-3 transition-all ${filterGroup !== 'All' || filterCity !== 'All' || filterStatus !== 'All' ? 'border-primary text-primary bg-primary/5 shadow-sm' : 'border-border/60 hover:bg-muted/50'}`}>
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                Filters {(filterGroup !== 'All' || filterCity !== 'All' || filterStatus !== 'All') && <Badge className="ml-1.5 h-4 px-1 text-[9px] rounded-full">Active</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] border-l-border/40 p-0 flex flex-col">
              <SheetHeader className="border-b border-border/50 p-6">
                <SheetTitle className="text-2xl font-black uppercase tracking-tight">Customer Filters</SheetTitle>
                <SheetDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Refine your customer view</SheetDescription>
              </SheetHeader>

              <div className="space-y-8 p-6 flex-1 overflow-y-auto">
                {/* Group Filter */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Group</h4>
                  <Select value={filterGroup} onValueChange={setFilterGroup}>
                    <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl">
                      <SelectValue placeholder="All Groups" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {uniqueGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* City Filter */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">City</h4>
                  <Select value={filterCity} onValueChange={setFilterCity}>
                    <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl">
                      <SelectValue placeholder="All Cities" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {uniqueCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Status</h4>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SheetFooter className="p-6 border-t border-border/50 bg-background/80 backdrop-blur-md">
                <div className="flex gap-4 w-full">
                  <Button
                    variant="outline"
                    className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl"
                    onClick={() => {
                      setFilterGroup('All');
                      setFilterCity('All');
                      setFilterStatus('All');
                    }}
                  >
                    Reset All
                  </Button>
                  <SheetClose asChild>
                    <Button className="flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl">
                      Apply Filters
                    </Button>
                  </SheetClose>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
        <DataTable
          columns={columns}
          data={filteredCustomers}
          title={t('customers.header')}
        />
      </div>

      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)}
        title={`${t('customers.ledger_title')}: ${selectedCustomer?.customerName}`} size="lg">
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/30">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('customers.master_balance')}</p>
                <p className="text-lg font-black">{t('common.etb')} {(selectedCustomer.salesStats?.outstanding || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <p className="text-[9px] font-black uppercase tracking-widest text-primary">{t('customers.lifetime_paid')}</p>
                <p className="text-lg font-black text-primary">{t('common.etb')} {(selectedCustomer.salesStats?.totalPaid || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div className="flex items-center gap-1.5 text-xs bg-muted/20 p-2 rounded-lg">
                <Phone size={12} className="text-muted-foreground shrink-0" />
                <span className="truncate">{selectedCustomer.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-muted/20 p-2 rounded-lg">
                <Mail size={12} className="text-muted-foreground shrink-0" />
                <span className="truncate">{selectedCustomer.email || '-'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-muted/20 p-2 rounded-lg">
                <MapPin size={12} className="text-muted-foreground shrink-0" />
                <span className="truncate">{selectedCustomer.city || selectedCustomer.address || '-'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-muted/20 p-2 rounded-lg">
                <Building size={12} className="text-muted-foreground shrink-0" />
                <span className="truncate">{selectedCustomer.company || '-'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-muted/20 p-2 rounded-lg">
                <Tag size={12} className="text-muted-foreground shrink-0" />
                <Badge variant="outline" className="text-[9px] h-4 px-1">{selectedCustomer.groupName}</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-muted/20 p-2 rounded-lg">
                <CreditCard size={12} className="text-muted-foreground shrink-0" />
                <span className="truncate">Limit: {t('common.etb')} {selectedCustomer.creditLimit.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openEditCustomer(selectedCustomer)} className="h-8 text-[10px] font-bold uppercase tracking-widest">
                <Pencil size={12} className="mr-1" /> Edit Profile
              </Button>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-1.5 flex items-center gap-2">
                <MessageSquare size={12} /> Communication History
              </h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto my-2">
                {customerNotes.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic">No notes recorded</p>
                )}
                {customerNotes.map(note => (
                  <div key={note.id} className="p-2 rounded-lg bg-muted/20 text-xs">
                    <p className="leading-relaxed">{note.note}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {note.createdBy} &middot; {formatDate(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 items-end">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  rows={2}
                  className="text-sm flex-1"
                />
                <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()} className="h-9 w-9 p-0 shrink-0">
                  <Save size={14} />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-1.5 flex items-center gap-2">
                <History size={12} /> {t('customers.debt_history')}
              </h4>
              <div className="border rounded-lg overflow-hidden mt-2">
                <table className="w-full text-left">
                  <thead className="bg-muted/60 text-[9px] font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-3 py-1.5">{t('inventory.product')}</th>
                      <th className="px-3 py-1.5">{t('customers.outstanding')}</th>
                      <th className="px-3 py-1.5">{t('common.date')}</th>
                      <th className="px-3 py-1.5">{t('sales.dueDate')}</th>
                      <th className="px-3 py-1.5 text-right">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {customerSales.filter(s => s.paymentStatus === 'Debt').map(sale => (
                      <tr key={sale.id} className="border-t border-border/40 hover:bg-muted/20">
                        <td className="px-3 py-2 font-semibold">{sale.itemName}</td>
                        <td className="px-3 py-2 text-destructive font-bold">
                          {t('common.etb')} {(sale.totalPrice - sale.paidAmount).toLocaleString()}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatDate(sale.createdAt)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatDate(sale.dueDate)}</td>
                        <td className="px-3 py-2 text-right flex justify-end gap-1">
                          <Button variant="ghost" size="icon"
                            onClick={() => generateInvoicePDF(sale)} title={t('customers.generate_invoice')}
                            className="h-6 w-6">
                            <Printer size={10} />
                          </Button>
                          <Button size="sm" onClick={() => openPayment(sale)} className="h-6 text-[9px] font-bold uppercase tracking-widest px-2">{t('customers.pay')}</Button>
                        </td>
                      </tr>
                    ))}
                    {customerSales.filter(s => s.paymentStatus === 'Debt').length === 0 && (
                      <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground text-[10px]">No outstanding debts</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)}
        title={isEditing ? 'Edit Customer' : 'New Customer'} size="md">
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Customer Name *
              </Label>
              <Input required value={editingCustomer.customerName}
                onChange={e => setEditingCustomer({ ...editingCustomer, customerName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Group
              </Label>
              <Select value={editingCustomer.groupName}
                onValueChange={v => setEditingCustomer({ ...editingCustomer, groupName: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOMER_GROUPS.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone</Label>
              <Input value={editingCustomer.phone}
                onChange={e => setEditingCustomer({ ...editingCustomer, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Secondary Phone</Label>
              <Input value={editingCustomer.secondaryPhone}
                onChange={e => setEditingCustomer({ ...editingCustomer, secondaryPhone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</Label>
              <Input type="email" value={editingCustomer.email}
                onChange={e => setEditingCustomer({ ...editingCustomer, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Company</Label>
              <Input value={editingCustomer.company}
                onChange={e => setEditingCustomer({ ...editingCustomer, company: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tax Number</Label>
              <Input value={editingCustomer.taxNumber}
                onChange={e => setEditingCustomer({ ...editingCustomer, taxNumber: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Credit Limit ({t('common.etb')})
              </Label>
              <Input type="number" value={editingCustomer.creditLimit}
                onChange={e => setEditingCustomer({ ...editingCustomer, creditLimit: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">City</Label>
              <Input value={editingCustomer.city}
                onChange={e => setEditingCustomer({ ...editingCustomer, city: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Address</Label>
              <Input value={editingCustomer.address}
                onChange={e => setEditingCustomer({ ...editingCustomer, address: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Notes</Label>
            <Textarea value={editingCustomer.notes}
              onChange={e => setEditingCustomer({ ...editingCustomer, notes: e.target.value })} rows={2} />
          </div>
          <div className="flex justify-between items-center">
            {isEditing && (
              <Button type="button" variant="destructive" size="sm"
                onClick={() => handleDeleteCustomer(editingCustomer)}
                className="h-8 text-[10px] font-bold uppercase tracking-widest px-3">
                <Trash2 size={12} className="mr-1" /> Deactivate
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => setShowFormModal(false)} className="h-8 text-[10px] font-bold uppercase tracking-widest px-3">Cancel</Button>
              <Button type="submit" className="h-8 text-[10px] font-bold uppercase tracking-widest px-3">{isEditing ? 'Update' : 'Create'} Customer</Button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)}
        title={t('customers.reconciliation')} size="sm">
        {selectedSale && (
          <form onSubmit={handlePayment} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {t('customers.payment_amount')}
              </label>
              <Input required type="number" max={selectedSale.totalPrice - selectedSale.paidAmount}
                value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
              <p className="text-[10px] text-muted-foreground">
                {t('common.max')}: {t('common.etb')} {selectedSale.totalPrice - selectedSale.paidAmount}
              </p>
            </div>
            <Button type="submit" className="w-full h-9 text-xs font-bold uppercase tracking-widest">{t('customers.confirm_payment')}</Button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Customers;
