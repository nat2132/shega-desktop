import React, { useEffect, useState, useMemo } from 'react';
import { 
  RefreshCcw, ShieldAlert, 
  History, Package, DollarSign, TrendingDown,
  CheckCircle, ChevronRight, AlertCircle, Info,
  Zap, Database, Activity, User, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { formatDate } from '../utils/ethiopian-calendar';

interface Item {
  id: number;
  name: string;
  baseUnit: string;
  purchaseUnit: string;
  totalBaseQuantity: number;
  baseSellingPrice: number;
  packSellingPrice: number;
  basePurchasePrice: number;
}

interface Adjustment {
  id: number;
  itemId: number;
  itemName: string;
  type: string;
  oldValue: number;
  newValue: number;
  quantity: number;
  reason: string;
  date: string;
  createdAt: string;
}

const Adjustments: React.FC = () => {
  const { t, calendarType, language } = useSettings();
  const [items, setItems] = useState<Item[]>([]);
  const [history, setHistory] = useState<Adjustment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'price_change' | 'damage'>('price_change');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFabMenu, setShowFabMenu] = useState(false);

  const [formData, setFormData] = useState({
    itemId: '',
    unitType: 'base' as 'base' | 'pack',
    type: 'price_increase',
    newValue: '',
    quantity: '1',
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsData, historyData] = await Promise.all([
        window.api.getItems({}),
        window.api.getAdjustments({})
      ]);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error('Failed to load adjustment data:', error);
      setItems([]);
      setHistory([]);
    }
  };

  const handleItemSelect = (id: string) => {
    const item = items.find(i => i.id === parseInt(id));
    setSelectedItem(item || null);
    setFormData({
      ...formData,
      itemId: id,
      newValue: item ? String(formData.unitType === 'base' ? item.baseSellingPrice : item.packSellingPrice) : ''
    });
  };

  const stats = useMemo(() => {
    const totalLoss = history
      .filter(h => h.type === 'damage')
      .reduce((sum, h) => sum + (h.quantity * (items.find(i => i.id === h.itemId)?.basePurchasePrice || 0)), 0);
    const priceChanges = history.filter(h => h.type.includes('price')).length;
    return { totalLoss, priceChanges };
  }, [history, items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const adjustment = {
      itemId: selectedItem.id,
      type: adjustmentType === 'damage' ? 'damage' : formData.type,
      oldValue: formData.unitType === 'base' ? selectedItem.baseSellingPrice : selectedItem.packSellingPrice,
      newValue: adjustmentType === 'damage' ? 0 : parseFloat(formData.newValue),
      quantity: adjustmentType === 'damage' ? parseFloat(formData.quantity) : null,
      unitType: formData.unitType,
      reason: formData.reason,
      date: formData.date
    };
    await window.api.insertAdjustment(adjustment);
    setShowModal(false);
    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({
      itemId: '', unitType: 'base', type: 'price_increase',
      newValue: '', quantity: '1', reason: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSelectedItem(null);
  };

  return (
    <div className="fade-in pb-24 relative min-h-screen">
      <Header 
        title="Admin Logistics" 
        subtitle="Manage price shifts, damaged inventory, and stock reconciliation."
        onSearch={setSearchQuery}
      />



      {/* Explicit Spacer for Sticky Header */}
      <div className="h-12 md:h-16 w-full shrink-0"></div>

      <div className="px-8 md:px-16 lg:px-24 max-w-[1800px] mx-auto flex flex-col gap-y-6">
        
        <div className="grid grid-cols-12 gap-6">
          {/* Audit Log Timeline */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <div className="bg-white/40 backdrop-blur-2xl saturate-150 rounded-[28px] p-6 border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5 relative z-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-retail-black flex items-center gap-3">
                  <History className="text-retail-gray-200" size={18} />
                  Operational Audit Log
                </h3>
                <span className="px-3 py-1 rounded-full bg-retail-gray-100 text-xs font-black uppercase tracking-widest text-retail-gray-300">
                  LIVE SESSION LOG
                </span>
              </div>
              
              <div className="space-y-4 relative before:absolute before:left-6 before:top-3 before:bottom-3 before:w-px before:bg-retail-gray-100">
                {history.length === 0 ? (
                  <div className="py-16 text-center text-retail-gray-200 font-black uppercase text-[10px] tracking-widest italic">No operational adjustments recorded.</div>
                ) : (
                  history.map((entry, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={entry.id} 
                      className="relative pl-14 group"
                    >
                      <div className={`absolute left-4 top-2.5 w-3.5 h-3.5 rounded-full border-[3px] border-white z-10 ${
                        entry.type === 'damage' ? 'bg-red-500 shadow-md shadow-red-500/30' : 
                        entry.type === 'price_increase' ? 'bg-green-500 shadow-md shadow-green-500/30' :
                        'bg-retail-orange shadow-md shadow-retail-orange/30'
                      }`} />
                      
                      <div className="bg-retail-gray-100/50 hover:bg-retail-gray-100 rounded-2xl p-5 transition-all flex flex-col md:flex-row items-center justify-between gap-4 border border-transparent hover:border-retail-gray-200">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-retail-gray-200 group-hover:scale-105 transition-transform">
                            <Package size={20} className="text-retail-gray-300" />
                          </div>
                          <div>
                            <p className="font-black text-sm text-retail-black tracking-tight">{entry.itemName}</p>
                            <p className="text-[10px] text-retail-gray-300 font-black uppercase tracking-widest mt-0.5">
                              {formatDate(new Date(entry.date || Date.now()), calendarType, language)} • {entry.reason || 'MANUAL RECONCILIATION'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-center md:items-end">
                          {entry.type === 'damage' ? (
                            <div className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md shadow-red-500/20">-{entry.quantity} UNITS LOSS</div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-retail-gray-300 font-black line-through">ETB {entry.oldValue}</span>
                              <ChevronRight size={12} className="text-retail-gray-200" />
                              <span className={`text-sm font-black ${entry.type === 'price_increase' ? 'text-green-500' : 'text-retail-orange'}`}>
                                ETB {entry.newValue}
                              </span>
                            </div>
                          )}
                          <p className="text-[8px] text-retail-gray-300 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                            <User size={10} /> MASTER ADMIN
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Audit Insights Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-retail-orange/70 backdrop-blur-2xl saturate-150 rounded-[28px] p-6 text-white relative overflow-hidden border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.3)] shadow-xl shadow-black/5">
              <TrendingDown className="text-white mb-4" size={28} strokeWidth={3} />
              <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em] mb-1">Inventory Depletion</p>
              <h3 className="text-2xl font-black tracking-tighter">ETB {(stats.totalLoss || 0).toLocaleString()}</h3>
              <div className="mt-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/5">
                <div className="flex items-center gap-2 text-white/80 text-xs font-black uppercase tracking-widest mb-2">
                  <Info size={12} />
                  Valuation Drift Analysis
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    className="h-full bg-white rounded-full" 
                  />
                </div>
                <p className="text-[9px] font-bold text-white/40 mt-2 italic">Calculated loss based on purchase price parity.</p>
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-2xl saturate-150 border border-white/60 rounded-[28px] p-6 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5 relative overflow-hidden">
              <Activity className="text-retail-black mb-4" size={24} strokeWidth={3} />
              <p className="text-retail-gray-300 text-xs font-black uppercase tracking-[0.3em] mb-1">Market Volatility</p>
              <h3 className="text-2xl font-black text-retail-black tracking-tighter">{stats.priceChanges} EVENTS</h3>
              <p className="text-xs text-retail-gray-300 font-black uppercase tracking-widest mt-3 border-t border-retail-gray-100 pt-3">Recorded market adaptation events in current fiscal cycle.</p>
            </div>

            <div className="p-6 rounded-[28px] bg-retail-black/70 backdrop-blur-2xl saturate-150 text-white border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] shadow-xl shadow-black/5">
              <h4 className="text-sm font-black mb-2 flex items-center gap-2">
                 <Database size={16} className="text-retail-orange" />
                 Audit Integrity
              </h4>
              <p className="text-white/40 text-xs font-black uppercase tracking-widest leading-loose">
                Every state change is captured immutably. Discrepancies are flagged for immediate reconciliation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Adjustment Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={adjustmentType === 'damage' ? 'Log Asset Depletion' : 'Price Point Adjustment'} 
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-retail-gray-300 uppercase tracking-[0.2em] block">Target SKU Identification</label>
            <select 
              required 
              className="w-full px-5 py-4 bg-retail-gray-100 rounded-2xl font-black uppercase tracking-widest text-xs outline-none focus:ring-4 ring-retail-orange/5 transition-all" 
              value={formData.itemId} 
              onChange={e => handleItemSelect(e.target.value)}
            >
              <option value="">Select Item to Adjust...</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          {selectedItem && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="grid grid-cols-2 gap-4 p-6 rounded-2xl bg-retail-gray-100"
             >
                <div>
                  <p className="text-[8px] text-retail-gray-300 font-black uppercase tracking-[0.3em] mb-1.5">Book Value (SRP)</p>
                  <p className="text-lg font-black text-retail-black">{formData.unitType === 'base' ? selectedItem.baseSellingPrice : selectedItem.packSellingPrice} ETB</p>
                </div>
                <div>
                  <p className="text-[8px] text-retail-orange font-black uppercase tracking-[0.3em] mb-1.5">Projected State</p>
                  <p className="text-lg font-black text-retail-orange uppercase">
                    {adjustmentType === 'damage' ? 'Stock Reduction' : `${formData.newValue || '0'} ETB`}
                  </p>
                </div>
             </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adjustmentType === 'price_change' ? (
              <>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-retail-gray-300 uppercase tracking-[0.2em]">Shift Type</label>
                  <select className="w-full px-5 py-3.5 bg-retail-gray-100 rounded-2xl font-bold outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="price_increase">Inflation Increase</option>
                    <option value="price_decrease">Promotional Markdown</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-retail-gray-300 uppercase tracking-[0.2em]">New Price Point</label>
                  <div className="relative">
                    <input required type="number" step="0.01" className="w-full px-5 py-3.5 bg-retail-gray-100 rounded-2xl font-black outline-none border-2 border-transparent focus:border-retail-black transition-all" value={formData.newValue} onChange={e => setFormData({...formData, newValue: e.target.value})} />
                    <DollarSign size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-retail-gray-200" />
                  </div>
                </div>
              </>
            ) : (
              <div className="col-span-1 md:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-retail-gray-300 uppercase tracking-[0.2em]">Asset Volume Depleted</label>
                <input required type="number" step="0.01" className="w-full px-5 py-3.5 bg-retail-gray-100 rounded-2xl font-black outline-none border-2 border-transparent focus:border-retail-black transition-all" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-retail-gray-300 uppercase tracking-[0.2em]">Operational Rationale</label>
            <input required placeholder="Brief justification for audit log *" className="w-full px-5 py-3.5 bg-retail-gray-100 rounded-2xl font-bold outline-none" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
          </div>

          <div className="flex gap-3 pt-4 border-t border-retail-gray-100">
            <button 
              type="submit" 
              className={`flex-1 py-4 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${
                adjustmentType === 'damage' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-retail-black hover:bg-black shadow-black/20'
              }`}
            >
              <CheckCircle size={20} strokeWidth={3} /> {adjustmentType === 'damage' ? 'Audit Loss Record' : 'Apply Price Shift'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 bg-retail-gray-100 text-retail-gray-300 hover:text-retail-black rounded-2xl font-black uppercase tracking-widest transition-all">
              Discard
            </button>
          </div>
        </form>
      </Modal>
 
      {/* Floating Action Hub */}
      <div className="fixed bottom-10 right-10 flex flex-col items-end gap-4 z-[100]">
        <AnimatePresence>
          {showFabMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="flex flex-col items-end gap-3 mb-2"
            >
              <motion.button
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setAdjustmentType('price_change'); resetForm(); setShowModal(true); setShowFabMenu(false); }}
                className="bg-retail-black text-white pl-4 pr-10 py-5 rounded-[28px] shadow-2xl shadow-black/40 flex items-center gap-4 group transition-all border border-white/10"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-retail-orange group-hover:rotate-180 transition-transform duration-700">
                  <RefreshCcw size={22} strokeWidth={3} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] leading-none mb-1">Stock Value</p>
                  <p className="text-sm font-black uppercase tracking-widest">Price Shift</p>
                </div>
              </motion.button>
 
              <motion.button
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setAdjustmentType('damage'); resetForm(); setShowModal(true); setShowFabMenu(false); }}
                className="bg-white text-retail-black pl-4 pr-10 py-5 rounded-[28px] shadow-2xl shadow-black/10 flex items-center gap-4 group transition-all border border-retail-gray-200"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-red-500/20">
                  <ShieldAlert size={22} strokeWidth={3} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-retail-gray-300 uppercase tracking-[0.2em] leading-none mb-1">Asset Loss</p>
                  <p className="text-sm font-black uppercase tracking-widest">Audit Record</p>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
 
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowFabMenu(!showFabMenu)}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
            showFabMenu ? 'bg-retail-orange text-white rotate-45' : 'bg-retail-black text-white'
          }`}
        >
          {showFabMenu ? <X size={32} strokeWidth={3} /> : <Zap size={32} strokeWidth={3} className="fill-retail-orange text-retail-orange" />}
        </motion.button>
      </div>
    </div>
  );
};

export default Adjustments;
