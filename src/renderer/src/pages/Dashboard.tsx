import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  TrendingUp, TrendingDown, ShoppingBag, Users, DollarSign, 
  ArrowUpRight, ArrowDownRight, Activity, Percent, 
  ChevronRight, Calendar, Filter, Share2, MoreHorizontal,
  ChevronDown, MapPin, Globe, Download, Plus, 
  AlertTriangle, Receipt, CreditCard, Package,
  History, PieChart as PieIcon, BarChart2,
  Clock, ArrowRight, Wallet, CheckCircle2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { useSettings } from '../context/SettingsContext';
import Header from '../components/Header';

const COLORS = ['#FF4D00', '#1A1B1F', '#F1F1F4', '#A1A1AA'];

const AnimatedNumber: React.FC<{ value: number; prefix?: string; suffix?: string }> = ({ value, prefix = '', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
};

const Dashboard: React.FC = () => {
  const { theme, t } = useSettings();
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [period, setPeriod] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Month');
  const [revenueToggle, setRevenueToggle] = useState<'today' | 'month'>('month');
  const [isFABOpen, setIsFABOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    const [statData, anData] = await Promise.all([
      window.api?.getDashboardStats() || Promise.resolve({}),
      window.api?.getAnalytics(period.toLowerCase()) || Promise.resolve({ salesData: [], topItems: [] })
    ]);
    setStats(statData);
    setAnalytics(anData);
  };

  const chartData = useMemo(() => {
    const formatDateLabel = (dateStr: string, currentPeriod: string) => {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      if (currentPeriod === 'Week') {
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      }
      if (currentPeriod === 'Month') {
        const day = date.getDate();
        if (day <= 7) return 'Week 1';
        if (day <= 14) return 'Week 2';
        if (day <= 21) return 'Week 3';
        return 'Week 4';
      }
      if (currentPeriod === 'Year') {
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
      }
      return dateStr;
    };

    if (!analytics?.salesData || analytics.salesData.length === 0) {
      const labels = period === 'Week' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] :
                     period === 'Month' ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'] :
                     ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      return labels.map(l => ({
        name: l,
        revenue: Math.floor(Math.random() * 50000) + 10000,
        expenses: Math.floor(Math.random() * 20000) + 5000,
        sales: Math.floor(Math.random() * 100) + 20,
        profit: Math.floor(Math.random() * 30000) + 5000
      }));
    }

    return analytics.salesData.map((d: any) => ({
      name: formatDateLabel(d.date, period),
      revenue: d.revenue || 0,
      expenses: d.expenses || 0,
      sales: d.units || 0,
      profit: (d.revenue || 0) - (d.expenses || 0)
    }));
  }, [analytics, period]);

  const recentActivity = [
    { id: 1, type: 'sale', title: 'Wholesale Order #892', amount: '+ ETB 12,450', time: '14 mins ago', status: 'Completed', icon: ShoppingBag, color: 'text-retail-black', bg: 'bg-retail-gray-100' },
    { id: 2, type: 'payment', title: 'Debt Payment: Abebe K.', amount: '+ ETB 5,000', time: '1 hour ago', status: 'Verified', icon: Wallet, color: 'text-retail-black', bg: 'bg-retail-gray-100' },
    { id: 3, type: 'stock', title: 'Restock: Nike Air Jordan', amount: '45 Units Added', time: '3 hours ago', status: 'Updated', icon: Package, color: 'text-retail-black', bg: 'bg-retail-gray-100' },
    { id: 4, type: 'sale', title: 'Retail Sale #891', amount: '+ ETB 1,200', time: '5 hours ago', status: 'Completed', icon: ShoppingBag, color: 'text-retail-black', bg: 'bg-retail-gray-100' },
  ];

  const lowStockItems = [
    { name: 'Adidas UltraBoost', current: 4, target: 50, trend: 'down' },
    { name: 'Puma Suede Classic', current: 2, target: 30, trend: 'down' },
    { name: 'Reebok Club C', current: 8, target: 40, trend: 'stable' },
  ];

  const fabActions = [
    { label: 'New Transaction', icon: Plus, color: 'bg-retail-orange' },
    { label: 'Inventory Intake', icon: Package, color: 'bg-retail-black' },
    { label: 'Record Recovery', icon: Receipt, color: 'bg-white', textColor: 'text-retail-black' },
  ];

  return (
    <div className="fade-in pb-24 relative min-h-screen">
      <Header 
        title="Retail Intelligence" 
        subtitle="Executive overview of organizational performance"
      />
      


      {/* Explicit Spacer for Sticky Header */}
      <div className="h-12 md:h-16 w-full shrink-0"></div>
      
      <div className="px-8 md:px-16 lg:px-24 max-w-[1800px] mx-auto flex flex-col gap-y-6">
        
        {/* TOP ROW: KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: 'Total Revenue', value: 894500, prefix: 'ETB ', icon: DollarSign, trend: '+12%', color: 'bg-retail-black/70 border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]', textColor: 'text-white' },
            { label: 'Net Profit', value: 342000, prefix: 'ETB ', icon: Activity, trend: '+8%', color: 'bg-white/40 border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)]', textColor: 'text-retail-black' },
            { label: 'Total Sales', value: 1420, icon: ShoppingBag, trend: '+24%', color: 'bg-retail-orange/70 border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]', textColor: 'text-white' },
            { label: 'Expenses', value: 125400, prefix: 'ETB ', icon: TrendingDown, trend: '-5%', color: 'bg-white/40 border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)]', textColor: 'text-retail-black' },
            { label: 'Outstanding', value: 45000, prefix: 'ETB ', icon: CreditCard, trend: '+2%', color: 'bg-white/40 border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)]', textColor: 'text-retail-black' },
            { label: 'Low Stock', value: 12, suffix: ' Items', icon: AlertTriangle, color: 'bg-white/40 border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)]', textColor: 'text-retail-black' },
          ].map((kpi, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${kpi.color} backdrop-blur-2xl saturate-150 rounded-[28px] p-6 flex flex-col relative overflow-hidden shadow-xl shadow-black/5 border group`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${kpi.textColor === 'text-white' ? 'bg-white/10' : 'bg-retail-gray-100'}`}>
                  <kpi.icon size={18} className={kpi.textColor || 'text-retail-black'} />
                </div>
                {kpi.trend && (
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${kpi.textColor === 'text-white' ? 'bg-white/10 text-white' : 'bg-retail-black text-white shadow-lg shadow-black/10'}`}>
                    {kpi.trend}
                  </span>
                )}
              </div>
              <p className={`${kpi.textColor === 'text-white' ? 'text-white/50' : 'text-retail-gray-400'} text-xs font-bold uppercase tracking-widest`}>{kpi.label}</p>
              <h3 className={`text-xl font-black mt-1.5 tracking-tight ${kpi.textColor || 'text-retail-black'}`}>
                <AnimatedNumber value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} />
              </h3>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 blur-3xl rounded-full" />
            </motion.div>
          ))}
        </div>

        {/* MIDDLE SECTION: CHARTS IN 3 COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Performance Matrix */}
          <div className="w-full bg-white/40 backdrop-blur-2xl saturate-150 rounded-[28px] pt-8 pb-6 px-8 border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5 relative overflow-hidden flex flex-col">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-retail-black">Performance Matrix</h3>
                <p className="text-retail-gray-400 text-xs mt-0.5">Real-time revenue</p>
              </div>
              <div className="flex items-center gap-1 bg-retail-gray-100 p-3 rounded-2xl">
                {['Week', 'Month', 'Year'].map(p => (
                  <button 
                    key={p}
                    onClick={() => setPeriod(p as any)}
                    className={`px-6 py-4 rounded-xl text-[10px] font-bold uppercase transition-all ${period === p ? 'bg-retail-black text-white shadow-lg' : 'text-retail-gray-400 hover:text-retail-black'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF4D00" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#FF4D00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 10 }} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1B1F', border: 'none', borderRadius: '16px', padding: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                    itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}
                    cursor={{ stroke: '#FF4D00', strokeWidth: 2, strokeDasharray: '5 5' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#FF4D00" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                  <Area type="monotone" dataKey="profit" stroke="#1A1B1F" fillOpacity={0} strokeWidth={2} strokeDasharray="8 8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Financial Balance */}
          <div className="w-full bg-white/40 backdrop-blur-2xl saturate-150 rounded-[28px] p-6 border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-black text-retail-black">Financial Balance</h4>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-retail-orange" />
                  <span className="text-[10px] text-retail-gray-400">Inflow</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-retail-black" />
                  <span className="text-[10px] text-retail-gray-400">Outflow</span>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.slice(-6)} barGap={4}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={5} />
                  <Tooltip cursor={{ fill: '#F5F6F8', radius: 8 }} />
                  <Bar dataKey="revenue" fill="#FF4D00" radius={[6, 6, 0, 0]} barSize={16} />
                  <Bar dataKey="expenses" fill="#1A1B1F" radius={[6, 6, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Performers */}
          <div className="w-full bg-retail-black/70 backdrop-blur-2xl saturate-150 rounded-[28px] p-6 text-white border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] shadow-xl shadow-black/5 relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h4 className="text-sm font-black text-white/60">Top Performers</h4>
              <BarChart2 size={20} className="text-retail-orange" />
            </div>
            <div className="space-y-4 relative z-10 flex-1 flex flex-col justify-center">
              {[
                { name: 'Nike Air Max', value: 85, color: '#FF4D00' },
                { name: 'iPhone 15 Pro', value: 72, color: '#FFFFFF' },
                { name: 'MacBook M3', value: 64, color: '#A1A1AA' },
                { name: 'Sony WH-1000XM5', value: 48, color: '#FFFFFF40' }
              ].map((p, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/80">{p.name}</span>
                    <span className="text-white/60">{p.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${p.value}%` }} transition={{ duration: 1, delay: i * 0.2 }} className="h-full rounded-full" style={{ backgroundColor: p.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-retail-orange/10 blur-[70px] rounded-full" />
          </div>
        </div>

        {/* BOTTOM SECTION: RECENT ACTIVITY */}
        <div className="bg-white/40 backdrop-blur-2xl saturate-150 rounded-[28px] p-6 border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-lg font-black text-retail-black">Recent Activity</h4>
              <p className="text-xs text-retail-gray-400 mt-0.5">Real-time organizational events</p>
            </div>
            <History size={20} className="text-retail-gray-300" />
          </div>
          
          <div className="flex flex-col gap-4">
            {recentActivity.map((activity, i) => (
              <div key={activity.id} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-retail-gray-50 transition-all group cursor-pointer border border-transparent hover:border-retail-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${activity.bg} ${activity.color} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                    <activity.icon size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-retail-black">{activity.title}</p>
                    <span className="text-xs text-retail-gray-400 mt-0.5 block">{activity.time}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-retail-black">{activity.amount}</p>
                  <span className="text-xs text-retail-gray-400 font-bold uppercase tracking-wide mt-0.5 block">{activity.status}</span>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-6 py-3 bg-white border-2 border-retail-gray-100 text-retail-black hover:bg-retail-black hover:text-white hover:border-retail-black rounded-xl text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 group shadow-sm hover:shadow-lg">
            View Complete Audit Log 
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* FLOATING ACTION BUTTON (FAB) & OVERLAY (Rendered in Portal) */}
      {createPortal(
        <>
          <div className="fixed bottom-10 right-10 z-[60]">
            <AnimatePresence>
              {isFABOpen && (
                <div className="flex flex-col gap-4 mb-6 items-end">
                  {fabActions.map((action, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.8 }}
                      transition={{ delay: (fabActions.length - 1 - i) * 0.1 }}
                      className="flex items-center gap-4 group cursor-pointer"
                    >
                      <span className="px-5 py-2.5 rounded-2xl bg-retail-black text-white text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        {action.label}
                      </span>
                      <div className={`w-16 h-16 ${action.color} ${action.textColor || 'text-white'} rounded-[24px] flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95`}>
                        <action.icon size={26} strokeWidth={2.5} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
            
            <motion.button
              onClick={() => setIsFABOpen(!isFABOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-20 h-20 rounded-[30px] flex items-center justify-center shadow-2xl transition-all duration-300 ${isFABOpen ? 'bg-retail-black rotate-45' : 'bg-retail-orange rotate-0'} text-white`}
            >
              {isFABOpen ? <X size={32} strokeWidth={2.5} /> : <Plus size={40} strokeWidth={2.5} />}
            </motion.button>
          </div>

          {/* OVERLAY FOR FAB */}
          <AnimatePresence>
            {isFABOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFABOpen(false)}
                className="fixed inset-0 bg-white/20 backdrop-blur-sm z-[55]"
              />
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  );
};

export default Dashboard;
