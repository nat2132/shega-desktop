import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, Trash2, Edit2, Repeat, TrendingDown, 
  DollarSign, PieChart, Calendar, Search, 
  ArrowUpRight, ArrowDownRight, CreditCard, 
  Briefcase, Utensils, Home, Settings,
  Activity, BarChart2, Filter, X, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, Tooltip, ResponsiveContainer 
} from 'recharts';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { useSettings } from '../context/SettingsContext';
import { formatDate } from '../utils/ethiopian-calendar';

interface Expense {
  id: number;
  name: string;
  amount: number;
  category: string;
  date: string;
  isRecurring: number;
  frequency: string;
  nextBillingDate: string;
}

const EXPENSE_CATEGORIES = [
  { name: 'Rent', icon: Home },
  { name: 'Utilities', icon: Settings },
  { name: 'Salaries', icon: Briefcase },
  { name: 'Transport', icon: Activity },
  { name: 'Supplies', icon: Settings },
  { name: 'Other', icon: CreditCard },
];

const Expenses: React.FC = () => {
  const { t, calendarType, language } = useSettings();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [formData, setFormData] = useState({
    name: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0],
    isRecurring: false, frequency: 'monthly', nextBillingDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [expData, anData] = await Promise.all([
      window.api.getExpenses({}),
      window.api.getAnalytics('month')
    ]);
    setExpenses(expData);
    setAnalytics(anData);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      window.api.getExpenses({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined
      }).then(setExpenses);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, dateRange]);

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const thisMonth = expenses.filter(e => e.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((s, e) => s + e.amount, 0);
    const recurring = expenses.filter(e => e.isRecurring).reduce((s, e) => s + e.amount, 0);
    return { total, thisMonth, recurring };
  }, [expenses]);

  const chartData = useMemo(() => {
    if (!analytics?.expenseData) return [];
    return analytics.expenseData.map(d => ({
      date: d.date.split('-').slice(2).join('/'),
      amount: d.amount
    }));
  }, [analytics]);

  const filteredList = expenses.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const expense = {
      ...formData,
      amount: parseFloat(formData.amount),
      isRecurring: formData.isRecurring ? 1 : 0,
      nextBillingDate: formData.isRecurring ? formData.nextBillingDate : null
    };
    if (editingExpense) await window.api.updateExpense(editingExpense.id, expense);
    else await window.api.insertExpense(expense);
    setShowModal(false);
    setEditingExpense(null);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Permanently delete this expense record?')) {
      await window.api.deleteExpense(id);
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0],
      isRecurring: false, frequency: 'monthly', nextBillingDate: ''
    });
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name, amount: String(expense.amount), category: expense.category,
      date: expense.date, isRecurring: Boolean(expense.isRecurring),
      frequency: expense.frequency || 'monthly', nextBillingDate: expense.nextBillingDate || ''
    });
    setShowModal(true);
  };

  return (
    <div className="fade-in pb-24 relative min-h-screen">
      <Header 
        title="Expense Studio" 
        subtitle="Manage operational overhead, payroll, and cash outflow."
        onSearch={setSearchQuery}
      />



      {/* Explicit Spacer for Sticky Header */}
      <div className="h-12 md:h-16 w-full shrink-0"></div>

      <div className="px-8 md:px-16 lg:px-24 max-w-[1800px] mx-auto flex flex-col gap-y-6">
        
        <div className="grid grid-cols-12 gap-6">
          {/* Main Chart Column */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-retail-black/70 backdrop-blur-2xl saturate-150 p-8 rounded-[28px] text-white border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] shadow-xl shadow-black/5 relative overflow-hidden h-[360px] flex flex-col group">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em] mb-1">Outflow Velocity</p>
                  <h3 className="text-3xl font-black tracking-tighter">ETB {(stats.thisMonth || 0).toLocaleString()}</h3>
                  <p className="text-retail-orange text-xs font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                    <TrendingDown size={14} /> Peak outflow this month
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                   <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-0.5">Average Daily</p>
                   <p className="text-base font-black">ETB {(stats.thisMonth / 30).toFixed(0)}</p>
                </div>
              </div>
              
              <div className="flex-1 w-full translate-y-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF4D00" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FF4D00" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1B1F', border: 'none', borderRadius: '16px', padding: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 900 }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#FF4D00" fillOpacity={1} fill="url(#colorExp)" strokeWidth={4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="absolute top-0 right-0 w-64 h-64 bg-retail-orange/10 blur-[100px] rounded-full" />
            </div>
          </div>

          {/* KPI Sidebar Column */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-retail-orange/70 backdrop-blur-2xl saturate-150 rounded-[28px] p-6 text-white border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.3)] shadow-xl shadow-black/5 relative overflow-hidden transition-all group">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-white/20">
                    <Repeat size={20} />
                  </div>
                  <ArrowUpRight size={16} className="text-white/40" />
               </div>
               <p className="text-white/40 text-xs font-black uppercase tracking-widest">Recurring Bills</p>
               <h3 className="text-xl font-black mt-1">ETB {(stats.recurring || 0).toLocaleString()}</h3>
            </div>

            <div className="bg-white/40 backdrop-blur-2xl saturate-150 border-2 border-white/60 rounded-[28px] p-6 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5 relative overflow-hidden transition-all group">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-retail-gray-100">
                    <Briefcase size={20} className="text-retail-black" />
                  </div>
                  <ArrowUpRight size={16} className="text-retail-gray-300" />
               </div>
               <p className="text-retail-gray-300 text-xs font-black uppercase tracking-widest">Operating Total</p>
               <h3 className="text-xl font-black mt-1 text-retail-black">ETB {(stats.total || 0).toLocaleString()}</h3>
            </div>

            <button 
              onClick={() => { resetForm(); setEditingExpense(null); setShowModal(true); }}
              className="w-full py-5 bg-retail-black text-white rounded-[28px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-black/20 hover:bg-black transition-all group"
            >
               <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
               Log Expense
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white/40 backdrop-blur-2xl saturate-150 rounded-[28px] p-5 border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5 flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex bg-retail-gray-100 p-1 rounded-2xl gap-1">
              {['All', 'Rent', 'Salaries', 'Transport'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    selectedCategory === cat ? 'bg-retail-black text-white shadow-xl' : 'text-retail-gray-300 hover:text-retail-black'
                  }`}
                >
                  {cat}
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
        </div>

        {/* Expense Card Column */}
        <div className="flex flex-col gap-4 relative z-0">
          {filteredList.length === 0 ? (
            <div className="bg-white/40 backdrop-blur-2xl saturate-150 rounded-[28px] p-24 text-center border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5">
              <p className="text-retail-gray-300 font-black uppercase text-[10px] tracking-widest italic">No cash outflows recorded for this selection.</p>
            </div>
          ) : (
            filteredList.map((expense) => {
              const category = EXPENSE_CATEGORIES.find(c => c.name === expense.category) || EXPENSE_CATEGORIES[5];
              return (
                <motion.div 
                  layout
                  key={expense.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/40 backdrop-blur-2xl saturate-150 rounded-[28px] p-6 border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5 hover:shadow-black/10 transition-all flex flex-wrap md:flex-nowrap items-center justify-between gap-6 group"
                >
                  <div className="flex items-center gap-6 min-w-[280px]">
                    <div className="w-16 h-16 rounded-2xl bg-retail-gray-100 flex items-center justify-center group-hover:bg-retail-black group-hover:text-white transition-all shrink-0">
                      <category.icon size={26} />
                    </div>
                    <div>
                      <p className="font-black text-lg text-retail-black tracking-tighter">{expense.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-retail-black text-white">
                          {expense.category}
                        </span>
                        <p className="text-[10px] text-retail-gray-300 font-black uppercase tracking-widest">
                          {expense.isRecurring ? 'Recurring' : 'One-time'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-12 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-left md:text-center space-y-1">
                      <p className="text-[9px] text-retail-gray-300 font-black uppercase tracking-widest">Entry Date</p>
                      <p className="text-xs font-bold text-retail-black">{formatDate(new Date(expense.date), calendarType, language)}</p>
                    </div>

                    <div className="text-left md:text-right space-y-1">
                      <p className="text-[9px] text-retail-gray-300 font-black uppercase tracking-widest">Outflow Value</p>
                      <p className={`text-xl font-black ${expense.amount >= 10000 ? 'text-retail-orange' : 'text-retail-black'}`}>
                        ETB {expense.amount.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pl-6 border-l border-retail-gray-100">
                      <button 
                        onClick={() => { setEditingExpense(expense); setFormData({ ...expense, date: expense.date.split('T')[0] }); setShowModal(true); }}
                        className="p-3.5 rounded-xl bg-retail-gray-100 text-retail-gray-300 hover:text-retail-black hover:bg-retail-gray-200 transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(expense.id)}
                        className="p-3.5 rounded-xl bg-red-50 text-red-300 hover:text-red-500 hover:bg-red-100 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Expense Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Expense Profiling" size="lg">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <label className="text-xs font-black text-retail-gray-300 uppercase tracking-widest block">Expense Details</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Description / Name *</p>
                  <input required placeholder="Enter expense name" className="w-full px-7 py-4 bg-retail-gray-100 rounded-xl font-bold outline-none border border-transparent focus:border-retail-orange focus:bg-white transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-retail-black uppercase tracking-widest ml-2">Outflow Amount *</p>
                  <div className="relative">
                    <input required type="number" step="0.01" className="w-full px-7 py-4 bg-retail-gray-100 rounded-xl font-black outline-none border border-transparent focus:border-retail-orange focus:bg-white transition-all" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-retail-gray-300 uppercase tracking-widest">ETB</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 col-span-1 md:col-span-2">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Business Classification</p>
                <select className="w-full px-7 py-4 bg-retail-gray-100 rounded-xl font-bold outline-none border border-transparent focus:border-retail-orange focus:bg-white transition-all appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Operation Date</p>
                <input required type="date" className="w-full px-7 py-4 bg-retail-gray-100 rounded-xl font-bold outline-none border border-transparent focus:border-retail-orange focus:bg-white transition-all" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>
            
            <div className="flex items-center gap-6 p-6 rounded-[24px] bg-retail-gray-100 border-2 border-transparent hover:border-retail-black/5 transition-all">
              <div 
                className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all ${formData.isRecurring ? 'bg-retail-orange shadow-lg shadow-retail-orange/20' : 'bg-retail-gray-300'}`}
                onClick={() => setFormData({...formData, isRecurring: !formData.isRecurring})}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${formData.isRecurring ? 'translate-x-6' : ''}`} />
              </div>
              <div>
                <p className="text-[10px] font-black text-retail-black uppercase tracking-widest">Recurring Commitment</p>
                <p className="text-[8px] text-retail-gray-300 uppercase font-black tracking-widest mt-0.5">Automated billing profile</p>
              </div>
            </div>

            <AnimatePresence>
              {formData.isRecurring && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-[32px] bg-retail-black text-white relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full" />
                  <div className="space-y-1.5 relative z-10">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">Cycle Interval</p>
                    <select className="w-full px-7 py-4 bg-white/10 rounded-xl font-bold outline-none text-white border border-white/10 focus:border-white/30 transition-all appearance-none" value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})}>
                      <option value="daily">Daily Cycle</option>
                      <option value="weekly">Weekly Cycle</option>
                      <option value="monthly">Monthly Cycle</option>
                      <option value="yearly">Yearly Cycle</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 relative z-10">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">Projected Next Date</p>
                    <input type="date" className="w-full px-7 py-4 bg-white/10 rounded-xl font-bold outline-none text-white border border-white/10 focus:border-white/30 transition-all" value={formData.nextBillingDate} onChange={e => setFormData({...formData, nextBillingDate: e.target.value})} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-4 pt-6 border-t border-retail-gray-100">
            <button type="submit" className="flex-1 py-6 bg-retail-black text-white rounded-[24px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3">
              <CheckCircle size={24} strokeWidth={3} /> {editingExpense ? 'Refine Record' : 'Confirm & Post'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="px-10 py-6 bg-retail-gray-100 text-retail-gray-300 hover:text-retail-black rounded-[24px] font-black uppercase tracking-widest transition-all">
              Discard
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;
