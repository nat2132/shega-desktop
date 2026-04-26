import React, { useEffect, useState, useMemo } from 'react';
import { 
  Users, Phone, DollarSign, CreditCard, CheckCircle, 
  Search, Filter, ArrowUpRight, ArrowDownRight, 
  Clock, AlertTriangle, ShieldAlert, ChevronRight,
  MoreVertical, Activity, UserPlus, Mail, Calendar,
  CreditCard as PaymentIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import Header from '../components/Header';
import Modal from '../components/Modal';

interface Customer {
  customerName: string;
  customerPhone: string;
  transactionCount: number;
  totalDebt: number;
  totalPaid: number;
  outstanding: number;
  overdueCount?: number;
}

interface DebtSale {
  id: number;
  itemName: string;
  totalPrice: number;
  paidAmount: number;
  quantity: number;
  createdAt: string;
  dueDate: string;
}

const Customers: React.FC = () => {
  const { t, calendarType, language } = useSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<DebtSale[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedSale, setSelectedSale] = useState<DebtSale | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    window.api.getCustomers().then((data: Customer[]) => setCustomers(data));
  };

  const viewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    window.api.getCustomerSales(customer.customerName).then((data: DebtSale[]) => {
      setCustomerSales(data);
    });
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale || !paymentAmount) return;
    await window.api.payDebt(selectedSale.id, parseFloat(paymentAmount));
    setShowPaymentModal(false);
    setPaymentAmount('');
    setSelectedSale(null);
    if (selectedCustomer) viewCustomer(selectedCustomer);
    loadCustomers();
  };

  const openPayment = (sale: DebtSale) => {
    setSelectedSale(sale);
    setPaymentAmount(String(sale.totalPrice - sale.paidAmount));
    setShowPaymentModal(true);
  };

  const filteredCustomers = customers.filter(c => 
    c.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.customerPhone?.includes(searchQuery)
  );

  const stats = useMemo(() => {
    const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstanding || 0), 0);
    const totalPaid = customers.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
    const overdueTotal = customers.length > 0 ? (totalOutstanding * 0.3) : 0; 
    return { totalOutstanding, totalPaid, overdueTotal };
  }, [customers]);

  const getDayDiff = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  return (
    <div className="fade-in pb-24 relative min-h-screen">
      <Header 
        title="Credit Command" 
        subtitle="Analyze customer debt, collection health, and payment history."
        onSearch={setSearchQuery}
      />



      {/* Explicit Spacer for Sticky Header */}
      <div className="h-12 md:h-16 w-full shrink-0"></div>

      <div className="px-6 md:px-12 lg:px-20 flex flex-col gap-y-6">
        
        {/* Credit Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Total Outstanding', value: `ETB ${(stats.totalOutstanding || 0).toLocaleString()}`, icon: AlertTriangle, color: 'bg-retail-orange/70 border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]', textColor: 'text-white' },
            { label: 'Reconciled Balance', value: `ETB ${(stats.totalPaid || 0).toLocaleString()}`, icon: CheckCircle, color: 'bg-retail-black/70 border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]', textColor: 'text-white' },
            { label: 'Est. Overdue Risk', value: `ETB ${(stats.overdueTotal || 0).toLocaleString()}`, icon: ShieldAlert, color: 'bg-retail-gray-100/50 border-white/40 shadow-[inset_0_0_20px_rgba(255,255,255,0.4)]' },
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

        <div className="grid grid-cols-12 gap-6">
          {/* Debtor Pool List */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-retail-black uppercase tracking-widest px-2">Debtor Pool</h3>
              <span className="text-xs font-black text-retail-orange">{filteredCustomers.length} ACTIVE LEDGERS</span>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredCustomers.length === 0 ? (
                <div className="bg-retail-gray-100 p-8 rounded-[28px] text-center italic text-xs font-black uppercase text-retail-gray-300 tracking-widest">No debtor records found.</div>
              ) : (
                filteredCustomers.map((customer, idx) => (
                  <motion.div 
                    key={idx}
                    layout
                    onClick={() => viewCustomer(customer)}
                    className={`bg-white/40 backdrop-blur-2xl saturate-150 p-5 rounded-[24px] cursor-pointer transition-all border-2 group relative overflow-hidden shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] ${
                      selectedCustomer?.customerName === customer.customerName 
                      ? 'border-retail-black shadow-2xl scale-[1.02]' 
                      : 'border-white/60 hover:border-retail-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl bg-retail-gray-100 flex items-center justify-center group-hover:bg-retail-orange group-hover:text-white transition-all`}>
                          <Users size={20} />
                        </div>
                        <div>
                          <p className="font-black text-sm text-retail-black tracking-tight">{customer.customerName}</p>
                          <p className="text-xs text-retail-gray-300 font-black uppercase tracking-widest flex items-center gap-2 mt-0.5">
                             <Phone size={10} /> {customer.customerPhone || 'PRIVATE'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-retail-orange">ETB {(customer.outstanding || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-retail-gray-300 font-black uppercase tracking-widest mt-0.5">{customer.transactionCount} OPS</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Ledger Details */}
          <div className="col-span-12 lg:col-span-8">
            <AnimatePresence mode="wait">
              {selectedCustomer ? (
                <motion.div 
                  key={selectedCustomer.customerName}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="bg-retail-black/70 backdrop-blur-2xl saturate-150 p-8 rounded-[28px] text-white relative overflow-hidden border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] shadow-xl shadow-black/5">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                         <div className="p-3.5 rounded-2xl bg-white/10 text-retail-orange">
                            <Activity size={24} />
                         </div>
                         <div className="text-right">
                            <p className="text-white/30 text-xs font-black uppercase tracking-widest">Master Ledger ID</p>
                            <p className="text-sm font-black text-retail-orange uppercase tracking-widest">#SHEGA-{selectedCustomer.customerName.replace(/\s+/g, '').toUpperCase()}</p>
                         </div>
                      </div>
                      <h2 className="text-3xl font-black tracking-tighter mb-3">{selectedCustomer.customerName}</h2>
                      <div className="flex gap-6 items-center">
                         <div className="flex items-center gap-2 text-white/40 text-xs font-black uppercase tracking-widest">
                            <Phone size={12} className="text-retail-orange" />
                            {selectedCustomer.customerPhone || '-'}
                         </div>
                         <div className="flex items-center gap-2 text-white/40 text-xs font-black uppercase tracking-widest">
                            <Calendar size={12} className="text-retail-orange" />
                            Ledger Status: ACTIVE
                         </div>
                      </div>
                    </div>
                    {/* Abstract design elements */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-retail-orange/20 blur-[120px] rounded-full" />
                    <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 blur-[60px] rounded-full" />
                  </div>

                  <div className="bg-white/40 backdrop-blur-2xl saturate-150 rounded-[28px] overflow-hidden border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5 relative z-0">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-retail-gray-100/50 border-b border-retail-gray-200">
                          <th className="px-8 py-6 text-xs font-black text-retail-gray-300 uppercase tracking-[0.2em]">Asset/Item</th>
                          <th className="px-8 py-6 text-xs font-black text-retail-gray-300 uppercase tracking-[0.2em]">Balance</th>
                          <th className="px-8 py-6 text-xs font-black text-retail-gray-300 uppercase tracking-[0.2em]">Collection health</th>
                          <th className="px-8 py-6 text-xs font-black text-retail-gray-300 uppercase tracking-[0.2em] text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-retail-gray-100">
                        {customerSales.length === 0 ? (
                          <tr><td colSpan={4} className="p-24 text-center text-retail-gray-300 font-black uppercase text-[10px] tracking-widest italic">No active debt items in this ledger.</td></tr>
                        ) : (
                          customerSales.map((sale) => {
                            const remaining = sale.totalPrice - sale.paidAmount;
                            const dayDiff = getDayDiff(sale.dueDate);
                            const isOverdue = dayDiff < 0;
                            return (
                              <tr key={sale.id} className={`hover:bg-retail-gray-100/50 transition-all group ${isOverdue ? 'bg-red-50/30' : ''}`}>
                                <td className="p-8">
                                  <div className="flex flex-col">
                                    <span className="font-black text-base text-retail-black tracking-tight">{sale.itemName}</span>
                                    <span className="text-[10px] text-retail-gray-300 font-black uppercase tracking-widest mt-1">
                                      Op Date: {new Date(sale.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-8">
                                  <div className="flex flex-col">
                                    <span className="text-base font-black text-retail-black">ETB {remaining.toLocaleString()}</span>
                                    <span className="text-[9px] text-retail-gray-300 font-black uppercase tracking-widest mt-0.5">Valuation: ETB {sale.totalPrice}</span>
                                  </div>
                                </td>
                                <td className="p-8">
                                  {isOverdue ? (
                                    <div className="flex flex-col">
                                      <span className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-[9px] font-black tracking-widest uppercase w-fit shadow-lg shadow-red-500/20">OVERDUE</span>
                                      <span className="text-[10px] text-red-600 font-black mt-2 tracking-widest uppercase">{Math.abs(dayDiff)} DAYS CRITICAL</span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col">
                                      <span className="px-3 py-1.5 rounded-xl bg-retail-black text-white text-[9px] font-black tracking-widest uppercase w-fit">ACTIVE TERM</span>
                                      <span className="text-[10px] text-retail-gray-300 font-black mt-2 tracking-widest uppercase">{dayDiff} DAYS REMAINING</span>
                                    </div>
                                  )}
                                </td>
                                <td className="p-8 text-right">
                                  <button 
                                    onClick={() => openPayment(sale)}
                                    className="px-6 py-3 rounded-2xl bg-retail-gray-100 hover:bg-retail-orange hover:text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                  >
                                    Reconcile
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center space-y-8 bg-retail-gray-100/50 rounded-[48px] border-2 border-dashed border-retail-gray-200">
                   <div className="w-40 h-40 rounded-full border-4 border-dashed border-retail-gray-200 flex items-center justify-center">
                      <Users size={64} className="text-retail-gray-200" />
                   </div>
                   <div className="text-center max-w-xs px-6">
                      <h3 className="text-xl font-black text-retail-gray-300 uppercase tracking-[0.2em] mb-4">Select Ledger</h3>
                      <p className="text-[10px] font-black text-retail-gray-300 uppercase tracking-widest leading-relaxed">Please select a customer from the pool to view their outstanding financial obligations.</p>
                   </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Balance Reconciliation" size="sm">
        {selectedSale && (
          <form onSubmit={handlePayment} className="space-y-10">
            <div className="p-8 rounded-[32px] bg-retail-gray-100 space-y-6">
              <div className="flex justify-between items-center border-b border-retail-gray-200 pb-4">
                 <p className="text-[10px] font-black text-retail-gray-300 uppercase tracking-widest">Active SKU</p>
                 <span className="text-sm font-black text-retail-black">{selectedSale.itemName}</span>
              </div>
              <div className="grid grid-cols-2 gap-8 pt-2">
                <div>
                  <p className="text-[10px] font-black text-retail-gray-300 uppercase mb-2 tracking-widest">Total Valuation</p>
                  <p className="text-lg font-black text-retail-black">ETB {selectedSale.totalPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-retail-orange uppercase mb-2 tracking-widest">Current Debt</p>
                  <p className="text-lg font-black text-retail-orange">ETB {(selectedSale.totalPrice - selectedSale.paidAmount).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-retail-gray-300 uppercase tracking-[0.4em] mb-4 block">Reconciliation Amount</label>
              <div className="relative">
                 <input 
                  required 
                  type="number" 
                  step="0.01" 
                  max={selectedSale.totalPrice - selectedSale.paidAmount}
                  className="w-full px-8 py-6 bg-retail-gray-100 rounded-[24px] text-3xl font-black text-retail-black outline-none border-4 border-transparent focus:border-retail-black transition-all" 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                />
                <DollarSign size={24} className="absolute right-8 top-1/2 -translate-y-1/2 text-retail-gray-200" />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-retail-gray-100">
              <button type="submit" className="flex-1 py-6 bg-retail-black text-white rounded-[24px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3">
                <CheckCircle size={24} strokeWidth={3} /> Post Payment
              </button>
              <button type="button" onClick={() => setShowPaymentModal(false)} className="px-10 py-6 bg-retail-gray-100 text-retail-gray-300 hover:text-retail-black rounded-[24px] font-black uppercase tracking-widest transition-all">
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Customers;
