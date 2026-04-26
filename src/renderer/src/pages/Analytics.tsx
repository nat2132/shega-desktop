import React, { useEffect, useState, useMemo } from 'react';
import { 
  TrendingUp, Activity, 
  DollarSign, Briefcase, Boxes, CreditCard, 
  Zap, Users, ChevronRight,
  Shield, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import Header from '../components/Header';
import { useSettings } from '../context/SettingsContext';

interface AnalyticsData {
  salesData: { date: string; revenue: number; units: number }[];
  expenseData: { date: string; amount: number }[];
  topItems: { name: string; totalQty: number; totalRevenue: number }[];
  categoryBreakdown: { name: string; saleCount: number; revenue: number }[];
}

const COLORS = ['#FF4D00', '#1A1B1F', '#F1F1F4', '#A1A1AA', '#22C55E', '#EF4444'];

const Analytics: React.FC = () => {
  useSettings();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    const [anData, dbStats, items, custs, adjs] = await Promise.all([
      window.api.getAnalytics(period),
      window.api.getDashboardStats(),
      window.api.getItems({}),
      window.api.getCustomers(),
      window.api.getAdjustments({ limit: 50 })
    ]);
    setData(anData);
    setDashboardStats(dbStats);
    setInventoryValue(items.reduce((s: number, i: any) => s + (i.totalBaseQuantity * i.basePurchasePrice), 0));
    setTopCustomers(custs.slice(0, 5));
    setAdjustments(adjs);
  };

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.salesData.map(s => {
      const expense = data.expenseData.find(e => e.date === s.date)?.amount || 0;
      return {
        name: s.date.split('-').slice(1).join('/'),
        revenue: s.revenue,
        expense: expense,
        profit: s.revenue - expense
      };
    });
  }, [data]);

  const insights = useMemo(() => {
    if (!data || !dashboardStats) return null;
    const bestProduct = data.topItems[0];
    const totalRev = data.salesData.reduce((s, d) => s + d.revenue, 0);
    const totalExp = data.expenseData.reduce((s, d) => s + d.amount, 0);
    const growth = dashboardStats.yesterdayRevenue > 0 
      ? ((dashboardStats.todayRevenue - dashboardStats.yesterdayRevenue) / dashboardStats.yesterdayRevenue * 100).toFixed(1)
      : '0';
    const damageLoss = adjustments.filter(a => a.type === 'damage').reduce((s, a) => s + (a.oldValue || 0), 0);
    return { bestProduct, totalRev, totalExp, netProfit: totalRev - totalExp, growth, damageLoss };
  }, [data, dashboardStats, adjustments]);

  return (
    <div className="fade-in pb-24 relative min-h-screen">
      <Header 
        title="Command Intelligence" 
        subtitle="Full-spectrum organizational performance and data analytics." 
      />



      {/* Explicit Spacer for Sticky Header */}
      <div className="h-12 md:h-16 w-full shrink-0"></div>

      <div className="px-8 md:px-16 lg:px-24 max-w-[1800px] mx-auto flex flex-col gap-y-6">
        
        {/* Executive Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex bg-retail-gray-100 p-1 rounded-2xl w-fit border border-retail-gray-200">
            {(['week', 'month', 'year'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  period === p 
                    ? 'bg-retail-black text-white shadow-xl shadow-black/20' 
                    : 'text-retail-gray-300 hover:text-retail-black'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-retail-gray-300 uppercase tracking-widest">Growth Velocity</p>
              <div className="flex items-center justify-end gap-2 text-green-500 font-black text-lg">
                <TrendingUp size={20} />
                {insights?.growth || 0}%
              </div>
            </div>
            <div className="h-8 w-px bg-retail-gray-200 mx-2" />
            <button className="p-3 bg-retail-black text-white rounded-2xl shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all">
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Gross Revenue', value: insights?.totalRev || 0, icon: DollarSign, color: 'bg-retail-black/70 border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]', textColor: 'text-white' },
            { label: 'Operating Cost', value: insights?.totalExp || 0, icon: Briefcase, color: 'bg-white/40 border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)]' },
            { label: 'Net Earnings', value: insights?.netProfit || 0, icon: Activity, color: 'bg-retail-orange/70 border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]', textColor: 'text-white' },
            { label: 'Debt Exposure', value: dashboardStats?.activeDebts || 0, icon: CreditCard, color: 'bg-white/40 border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)]' },
            { label: 'Asset Valuation', value: inventoryValue, icon: Boxes, color: 'bg-retail-black/70 border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]', textColor: 'text-white' },
            { label: 'Profit Today', value: dashboardStats?.todayProfit || 0, icon: Zap, color: 'bg-white/40 border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)]' },
          ].map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`${s.color} backdrop-blur-2xl saturate-150 rounded-[24px] p-4 flex flex-col relative overflow-hidden shadow-xl shadow-black/5 border group`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <div className={`p-2 rounded-lg ${s.textColor === 'text-white' ? 'bg-white/10' : 'bg-retail-gray-100'}`}>
                  <s.icon size={14} className={s.textColor || 'text-retail-black'} />
                </div>
              </div>
              <p className={`${s.textColor === 'text-white' ? 'text-white/40' : 'text-retail-gray-300'} text-[10px] font-black uppercase tracking-widest`}>{s.label}</p>
              <h3 className={`text-sm font-black mt-0.5 tracking-tighter truncate ${s.textColor || 'text-retail-black'}`}>ETB {(s.value || 0).toLocaleString()}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          
          {/* Central Analytics Hub */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            
            {/* Financial Trajectory Chart */}
            <div className="bg-white/40 backdrop-blur-2xl saturate-150 rounded-[28px] p-6 border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-black text-retail-black tracking-tighter">Financial Trajectory</h3>
                  <p className="text-retail-gray-300 text-xs uppercase font-black tracking-widest mt-0.5">Cross-referencing Revenue & Expenses Flow</p>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-retail-orange" />
                    <span className="text-[10px] font-black text-retail-black uppercase tracking-widest">Revenue</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-retail-black" />
                    <span className="text-[10px] font-black text-retail-gray-300 uppercase tracking-widest">Expenses</span>
                  </div>
                </div>
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="anRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF4D00" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#FF4D00" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="anExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1A1B1F" stopOpacity={0.05}/>
                        <stop offset="95%" stopColor="#1A1B1F" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1B1F', border: 'none', borderRadius: '24px', padding: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#FF4D00" fillOpacity={1} fill="url(#anRev)" strokeWidth={5} />
                    <Area type="monotone" dataKey="expense" stroke="#1A1B1F" fillOpacity={1} fill="url(#anExp)" strokeWidth={3} strokeDasharray="8 8" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Secondary Visualizations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Profit Density */}
               <div className="bg-retail-black/70 backdrop-blur-2xl saturate-150 rounded-[28px] p-6 text-white border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] shadow-xl shadow-black/5 relative overflow-hidden">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-black tracking-tight">Earnings Flow</h3>
                      <p className="text-white/30 text-xs uppercase font-black tracking-widest mt-0.5">Operational Efficiency</p>
                    </div>
                    <div className="bg-retail-orange p-2 rounded-xl">
                      <Zap size={16} />
                    </div>
                 </div>
                 <div className="h-32 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#FF4D00' : '#ffffff20'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                 </div>
                 <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-xs font-black text-white/40 uppercase tracking-widest">Projected Daily ROI</span>
                    <span className="text-lg font-black text-white">ETB {(insights?.netProfit ? insights.netProfit / 30 : 0).toFixed(0)}</span>
                 </div>
               </div>

               {/* SKU Market Share */}
               <div className="bg-white/40 backdrop-blur-2xl saturate-150 rounded-[28px] p-6 border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5 flex flex-col">
                  <h3 className="text-sm font-black text-retail-black uppercase tracking-widest mb-4">Market Dominance</h3>
                  <div className="space-y-4 flex-1">
                    {(data?.topItems || []).slice(0, 4).map((item, i) => (
                      <div key={i} className="space-y-3">
                         <div className="flex justify-between items-end">
                            <span className="text-xs font-black text-retail-black uppercase tracking-tight">{item.name}</span>
                            <span className="text-[10px] font-black text-retail-orange">ETB {(item.totalRevenue || 0).toLocaleString()}</span>
                         </div>
                         <div className="h-2 w-full bg-retail-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${((item.totalRevenue || 0) / (insights?.totalRev || 1) * 100).toFixed(0)}%` }} 
                              className="h-full bg-retail-black rounded-full" 
                            />
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            
            {/* Executive Summary AI */}
            <div className="bg-retail-black/70 backdrop-blur-2xl saturate-150 rounded-[28px] p-6 text-white relative overflow-hidden border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] shadow-xl shadow-black/5">
              <h3 className="text-base font-black mb-4 flex items-center gap-3">
                 <Shield size={20} />
                 Executive Audit
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-white mt-2 flex-shrink-0" />
                  <p className="text-xs text-white/80 font-bold leading-relaxed">
                    <span className="font-black text-white uppercase tracking-widest mr-2">Lead SKU:</span> 
                    {insights?.bestProduct?.name || '—'} dominates the ledger with ETB {(insights?.bestProduct?.totalRevenue || 0).toLocaleString()} in captured value.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-white mt-2 flex-shrink-0" />
                  <p className="text-xs text-white/80 font-bold leading-relaxed">
                    <span className="font-black text-white uppercase tracking-widest mr-2">Profit Alert:</span> 
                    Operating with a net profitability of ETB {(insights?.netProfit || 0).toLocaleString()}. Resource allocation is optimal.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-white mt-2 flex-shrink-0" />
                  <p className="text-xs text-white/80 font-bold leading-relaxed">
                    <span className="font-black text-white uppercase tracking-widest mr-2">Critical Loss:</span> 
                    Detected ETB {(insights?.damageLoss || 0).toLocaleString()} in valuation depletion due to inventory damage reports.
                  </p>
                </div>
              </div>
              <div className="absolute top-[-40px] right-[-40px] w-48 h-48 bg-white/10 blur-[80px] rounded-full" />
            </div>

            {/* Top Debtor Accounts */}
            <div className="bg-white/40 backdrop-blur-2xl saturate-150 rounded-[28px] p-6 border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-black text-retail-black uppercase tracking-widest">Prime Debtors</h4>
                <div className="p-2 bg-retail-gray-100 rounded-xl">
                  <Users size={16} className="text-retail-gray-300" />
                </div>
              </div>
              <div className="space-y-4">
                {topCustomers.map((cust, i) => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-retail-gray-100 flex items-center justify-center text-xs font-black text-retail-gray-300 group-hover:bg-retail-black group-hover:text-white transition-all">
                         {cust.customerName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-black text-retail-black group-hover:text-retail-orange transition-colors">{cust.customerName || 'Unknown'}</p>
                        <p className="text-[10px] text-retail-gray-300 font-black uppercase tracking-widest">{cust.transactionCount || 0} OPERATIONS</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-retail-orange">ETB {(cust.outstanding || 0).toLocaleString()}</p>
                      <ChevronRight size={14} className="text-retail-gray-200 ml-auto mt-1" />
                    </div>
                  </div>
                ))}
                {topCustomers.length === 0 && <p className="text-[10px] text-retail-gray-300 font-black uppercase text-center italic tracking-widest">No active debtor accounts found.</p>}
              </div>
              <button className="w-full mt-6 py-4 bg-retail-gray-100 text-retail-gray-300 hover:text-retail-black hover:bg-retail-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                 View Full Ledger
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
