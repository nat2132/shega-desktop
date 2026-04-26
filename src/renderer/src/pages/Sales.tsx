import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, Trash2, CreditCard, User, Calendar, CheckCircle, 
  Search, Filter, Download, Printer, ArrowUpRight, 
  TrendingUp, DollarSign, ShoppingBag, ChevronRight, X, Clock,
  MoreVertical, FileText, AlertCircle, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useSettings } from '../context/SettingsContext';
import Header from '../components/Header';
import Modal from '../components/Modal';

interface Sale {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  unit: string;
  unitType: string;
  discount: number;
  vat: number;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  customerName: string;
  customerPhone: string;
  dueDate: string;
  paidAmount: number;
  createdAt: string;
  basePurchasePrice?: number;
  unitsPerPack?: number;
}

interface Item {
  id: number;
  name: string;
  baseUnit: string;
  purchaseUnit: string;
  unitsPerPack: number;
  totalBaseQuantity: number;
  baseSellingPrice: number;
  packSellingPrice: number;
  allowSellByBaseUnit: number;
  allowSellByPackUnit: number;
  basePurchasePrice: number;
}

const Sales: React.FC = () => {
  const { t, calendarType, language } = useSettings();
  const [sales, setSales] = useState<Sale[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [formData, setFormData] = useState({
    itemId: '',
    quantity: '1',
    unitType: 'base' as 'base' | 'pack',
    discount: '0',
    vat: '0',
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    customerName: '',
    customerPhone: '',
    dueDate: ''
  });

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [salesData, itemsData] = await Promise.all([
      window.api.getSales({ search: searchQuery }),
      window.api.getItems({})
    ]);
    setSales(salesData);
    setItems(itemsData);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      window.api.getSales({ 
        search: searchQuery, 
        paymentStatus: statusFilter === 'All' ? undefined : statusFilter,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined
      }).then(setSales);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, dateRange]);

  const stats = useMemo(() => {
    const total = sales.reduce((sum, s) => sum + s.totalPrice, 0);
    const profit = sales.reduce((sum, s) => {
      const cost = (s.basePurchasePrice || 0) * (s.unitType === 'pack' ? (s.quantity * (s.unitsPerPack || 1)) : s.quantity);
      return sum + (s.totalPrice - cost);
    }, 0);
    return { total, profit, count: sales.length };
  }, [sales]);

  const handleItemChange = (itemId: string) => {
    const item = items.find(i => i.id === parseInt(itemId));
    setSelectedItem(item || null);
    setFormData(prev => ({
      ...prev,
      itemId,
      unitType: item?.allowSellByBaseUnit ? 'base' : 'pack'
    }));
  };

  const calculateTotal = () => {
    if (!selectedItem) return 0;
    const qty = parseFloat(formData.quantity) || 0;
    const price = formData.unitType === 'pack' 
      ? (selectedItem.packSellingPrice || 0) 
      : (selectedItem.baseSellingPrice || 0);
    const discount = parseFloat(formData.discount) || 0;
    const vat = parseFloat(formData.vat) || 0;
    return (qty * price) - discount + vat;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const sale = {
      itemId: parseInt(formData.itemId),
      quantity: parseFloat(formData.quantity),
      unit: formData.unitType === 'pack' ? selectedItem.purchaseUnit : selectedItem.baseUnit,
      unitType: formData.unitType,
      discount: parseFloat(formData.discount) || 0,
      vat: parseFloat(formData.vat) || 0,
      totalPrice: calculateTotal(),
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentStatus,
      customerName: formData.customerName || null,
      customerPhone: formData.customerPhone || null,
      dueDate: formData.paymentStatus === 'Debt' ? formData.dueDate : null,
      paidAmount: formData.paymentStatus === 'Paid' ? calculateTotal() : 0
    };

    await window.api.insertSale(sale);
    setShowModal(false);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this sale record? Stock will be restored.')) {
      await window.api.deleteSale(id);
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({
      itemId: '', quantity: '1', unitType: 'base', discount: '0', vat: '0',
      paymentMethod: 'Cash', paymentStatus: 'Paid', customerName: '', customerPhone: '', dueDate: ''
    });
    setSelectedItem(null);
  };

  const generateInvoice = (sale: Sale) => {
    const doc = new jsPDF() as any;
    doc.setFontSize(22);
    doc.text('RETAIL INVOICE', 14, 22);
    doc.setFontSize(10);
    doc.text(`Invoice ID: #INV-${sale.id}`, 14, 30);
    doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString()}`, 14, 35);
    doc.text(`Customer: ${sale.customerName || 'Walk-in'}`, 14, 50);
    doc.autoTable({
      startY: 70,
      head: [['Product', 'Quantity', 'Unit Price', 'Discount', 'Subtotal']],
      body: [[sale.itemName, `${sale.quantity} ${sale.unit}`, `ETB ${(sale.totalPrice / sale.quantity).toFixed(2)}`, `ETB ${sale.discount}`, `ETB ${sale.totalPrice.toLocaleString()}`]],
      theme: 'grid',
      headStyles: { fillColor: [26, 27, 31] }
    });
    doc.save(`Invoice_${sale.id}.pdf`);
  };

  return (
    <div className="fade-in pb-24 relative min-h-screen">
      <Header 
        title="Sales Command" 
        subtitle="Manage transactions, revenue flow, and customer credit."
        onSearch={setSearchQuery}
      />



      {/* Explicit Spacer for Sticky Header */}
      <div className="h-12 md:h-16 w-full shrink-0"></div>

      <div className="px-8 md:px-16 lg:px-24 max-w-[1800px] mx-auto flex flex-col gap-y-6">
        
        {/* Sales Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Net Revenue', value: `ETB ${(stats.total || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-retail-black/70 border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]', textColor: 'text-white' },
            { label: 'Gross Profit', value: `ETB ${(stats.profit || 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-retail-orange/70 border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]', textColor: 'text-white' },
            { label: 'Transaction Count', value: stats.count, icon: ShoppingBag, color: 'bg-retail-gray-100/50 border-white/40 shadow-[inset_0_0_20px_rgba(255,255,255,0.4)]' },
          ].map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${s.color} backdrop-blur-2xl saturate-150 rounded-[28px] p-6 flex flex-col relative overflow-hidden shadow-xl shadow-black/5 border group`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl ${s.textColor === 'text-white' ? 'bg-white/10' : 'bg-retail-black/5'}`}>
                  <s.icon size={20} className={s.textColor || 'text-retail-black'} />
                </div>
                <ArrowUpRight size={16} className={s.textColor || 'text-retail-gray-300'} />
              </div>
              <p className={`${s.textColor === 'text-white' ? 'text-white/40' : 'text-retail-gray-300'} text-xs font-black uppercase tracking-widest`}>{s.label}</p>
              <h3 className={`text-xl font-black mt-1 tracking-tight ${s.textColor || 'text-retail-black'}`}>{s.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Filter & Action Bar */}
        <div className="bg-white/40 backdrop-blur-2xl saturate-150 rounded-[28px] p-5 border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5 flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex bg-retail-gray-100 p-2 rounded-[22px] gap-4">
              {['All', 'Paid', 'Debt'].map(s => (
                <button 
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    statusFilter === s ? 'bg-retail-black text-white shadow-xl' : 'text-retail-gray-300 hover:text-retail-black'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="h-8 w-px bg-retail-gray-200 mx-2" />
            <div className="flex items-center gap-4">
              <Calendar size={16} className="text-retail-gray-300" />
              <input type="date" className="bg-transparent text-xs font-black uppercase text-retail-gray-400 outline-none" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
              <span className="text-retail-gray-200 text-xs font-black">TO</span>
              <input type="date" className="bg-transparent text-xs font-black uppercase text-retail-gray-400 outline-none" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
            </div>
          </div>
          
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-6 py-3 bg-retail-orange text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-retail-orange/20 hover:scale-[1.02] active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> New Transaction
          </button>
        </div>

        {/* Sales Table */}
        <div className="bg-white/40 backdrop-blur-2xl saturate-150 rounded-[28px] overflow-hidden border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5 relative z-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="bg-retail-gray-100/50 border-b border-retail-gray-200">
                  <th className="px-8 py-6 text-xs font-black text-retail-gray-300 uppercase tracking-[0.2em]">Transaction ID</th>
                  <th className="px-8 py-6 text-xs font-black text-retail-gray-300 uppercase tracking-[0.2em]">Customer / Entity</th>
                  <th className="px-8 py-6 text-xs font-black text-retail-gray-300 uppercase tracking-[0.2em]">Date</th>
                  <th className="px-8 py-6 text-xs font-black text-retail-gray-300 uppercase tracking-[0.2em]">Financial Velocity</th>
                  <th className="px-8 py-6 text-xs font-black text-retail-gray-300 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-retail-gray-100">
                {sales.length === 0 ? (
                  <tr><td colSpan={6} className="p-24 text-center text-retail-gray-300 italic font-black uppercase text-[10px] tracking-widest">No transaction records found.</td></tr>
                ) : (
                  sales.map((sale) => {
                    const cost = (sale.basePurchasePrice || 0) * (sale.unitType === 'pack' ? (sale.quantity * (sale.unitsPerPack || 1)) : sale.quantity);
                    const profit = sale.totalPrice - cost;
                    return (
                      <motion.tr 
                        layout
                        key={sale.id} 
                        className="hover:bg-retail-gray-100/50 transition-all group"
                      >
                        <td className="p-8">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-retail-gray-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-lg transition-all">
                              <ShoppingBag size={24} className="text-retail-gray-300 group-hover:text-retail-black" />
                            </div>
                            <div>
                              <p className="font-black text-base text-retail-black tracking-tighter">{sale.itemName}</p>
                              <p className="text-[10px] text-retail-gray-300 font-black uppercase tracking-widest mt-0.5">{new Date(sale.createdAt).toLocaleDateString()} • {sale.quantity} {sale.unit}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-retail-gray-100 flex items-center justify-center">
                              <User size={16} className="text-retail-gray-300" />
                            </div>
                            <span className="text-sm font-bold text-retail-black">{sale.customerName || 'Walk-in Customer'}</span>
                          </div>
                        </td>
                        <td className="p-8">
                          <p className={`text-base font-black ${sale.totalPrice >= 50000 ? 'text-retail-orange' : 'text-retail-black'}`}>
                            ETB {sale.totalPrice.toLocaleString()}
                          </p>
                        </td>
                        <td className="p-8">
                          <div className="flex items-center gap-2 text-green-500 font-black text-xs uppercase tracking-tight">
                            <TrendingUp size={16} />
                            ETB {profit.toLocaleString()}
                          </div>
                        </td>
                        <td className="p-8">
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                            sale.paymentStatus === 'Paid' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {sale.paymentStatus}
                          </span>
                        </td>
                        <td className="p-8 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <button 
                              onClick={() => generateInvoice(sale)}
                              className="w-12 h-12 rounded-2xl bg-retail-gray-100 hover:bg-retail-black hover:text-white transition-all flex items-center justify-center"
                            >
                              <FileText size={20} />
                            </button>
                            <button 
                              onClick={() => handleDelete(sale.id)}
                              className="w-12 h-12 rounded-2xl bg-retail-gray-100 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sale Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Point of Sale" size="lg">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <label className="text-xs font-black text-retail-gray-300 uppercase tracking-widest block">Product Acquisition</label>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Inventory Source *</p>
                <select 
                  required 
                  className="w-full px-7 py-4 bg-retail-gray-100 rounded-xl font-bold outline-none border border-transparent focus:border-retail-orange focus:bg-white transition-all appearance-none" 
                  value={formData.itemId} 
                  onChange={e => handleItemChange(e.target.value)}
                >
                  <option value="">Select product from stock...</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{item.name} ({item.totalBaseQuantity} {item.baseUnit} Available)</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedItem && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-1 md:col-span-2 p-6 rounded-[28px] bg-retail-gray-100 border border-retail-gray-200 grid grid-cols-3 gap-4 text-center shadow-inner"
              >
                <div className="space-y-1">
                  <p className="text-[9px] text-retail-gray-400 uppercase font-black tracking-widest">Retail SRP</p>
                  <p className="text-lg font-black text-retail-black tracking-tighter">ETB {selectedItem.baseSellingPrice}</p>
                </div>
                <div className="space-y-1 border-x border-retail-gray-200">
                  <p className="text-[9px] text-retail-gray-400 uppercase font-black tracking-widest">Wholesale SRP</p>
                  <p className="text-lg font-black text-retail-orange tracking-tighter">ETB {selectedItem.packSellingPrice || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-retail-gray-400 uppercase font-black tracking-widest">Current Stock</p>
                  <p className="text-lg font-black text-retail-black tracking-tighter">{selectedItem.totalBaseQuantity} {selectedItem.baseUnit}</p>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 col-span-1 md:col-span-2">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Sale Mode</p>
                <select 
                  className="w-full px-7 py-4 bg-retail-gray-100 rounded-xl font-bold outline-none border border-transparent focus:border-retail-orange focus:bg-white transition-all appearance-none" 
                  value={formData.unitType} 
                  onChange={e => setFormData({...formData, unitType: e.target.value as 'base' | 'pack'})}
                >
                  {selectedItem?.allowSellByBaseUnit !== 0 && <option value="base">Individual / Retail ({selectedItem?.baseUnit})</option>}
                  {selectedItem?.allowSellByPackUnit !== 0 && <option value="pack">Bulk / Wholesale ({selectedItem?.purchaseUnit})</option>}
                </select>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-retail-black uppercase tracking-widest ml-2">Quantity *</p>
                <input required type="number" step="0.01" min="0.01" className="w-full px-7 py-4 bg-retail-gray-100 rounded-xl font-black outline-none border border-transparent focus:border-retail-orange focus:bg-white transition-all" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 col-span-1 md:col-span-2">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Discount (ETB)</p>
                <input placeholder="0.00" type="number" className="w-full px-7 py-4 bg-retail-gray-100 rounded-xl font-bold outline-none border border-transparent focus:border-retail-orange focus:bg-white transition-all" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Tax / VAT (%)</p>
                <input placeholder="0%" type="number" className="w-full px-7 py-4 bg-retail-gray-100 rounded-xl font-bold outline-none border border-transparent focus:border-retail-orange focus:bg-white transition-all" value={formData.vat} onChange={e => setFormData({...formData, vat: e.target.value})} />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-4">
              <label className="text-xs font-black text-retail-gray-300 uppercase tracking-widest block">Payment Intelligence</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Payment Method</p>
                  <select className="w-full px-7 py-4 bg-retail-gray-100 rounded-xl font-bold outline-none border border-transparent focus:border-retail-orange focus:bg-white transition-all appearance-none" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                    <option value="Cash">Physical Cash</option>
                    <option value="Digital Bank">Bank / CBE</option>
                    <option value="Telebirr">Telebirr</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Order Status</p>
                  <select 
                    className={`w-full px-7 py-4 rounded-xl font-black uppercase text-xs tracking-widest outline-none transition-all border-2 ${
                      formData.paymentStatus === 'Paid' ? 'bg-green-500/10 border-green-500 text-green-700' : 'bg-red-500/10 border-red-500 text-red-700'
                    }`} 
                    value={formData.paymentStatus} 
                    onChange={e => setFormData({...formData, paymentStatus: e.target.value})}
                  >
                    <option value="Paid">Order Fully Settled</option>
                    <option value="Debt">Credit / Deferred Debt</option>
                  </select>
                </div>
              </div>
            </div>

            {formData.paymentStatus === 'Debt' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-1 md:col-span-2 space-y-6 p-6 rounded-[28px] bg-red-50/50 border border-red-200"
              >
                <label className="text-xs font-black text-red-500 uppercase tracking-widest block">Customer Credit Profiling</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-red-400 uppercase tracking-widest ml-2">Customer Name *</p>
                    <input required placeholder="Enter name" className="w-full px-5 py-3 bg-white rounded-xl font-bold outline-none border border-red-200 focus:border-red-500 transition-all" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-red-400 uppercase tracking-widest ml-2">Phone Contact</p>
                    <input placeholder="09..." className="w-full px-5 py-3 bg-white rounded-xl font-bold outline-none border border-red-200 focus:border-red-500 transition-all" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-red-400 uppercase tracking-widest ml-2">Payment Due Date *</p>
                    <input required type="date" className="w-full px-5 py-3 bg-white rounded-xl font-bold outline-none border border-red-200 focus:border-red-500 transition-all" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="p-8 rounded-[32px] bg-retail-black text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-black/40 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-retail-orange/10 blur-[100px] rounded-full" />
            <div className="text-center md:text-left space-y-1 relative z-10">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Payable Transaction Value</p>
              <h2 className="text-5xl font-black tracking-tighter">ETB {calculateTotal().toLocaleString()}</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="px-10 py-5 text-white/40 hover:text-white font-black uppercase tracking-widest transition-all text-xs"
              >
                Discard
              </button>
              <button 
                type="submit" 
                className="flex-1 px-14 py-6 bg-retail-orange text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl shadow-retail-orange/30 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 whitespace-nowrap"
              >
                <CheckCircle size={24} strokeWidth={3} /> Finalize Order
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Sales;
