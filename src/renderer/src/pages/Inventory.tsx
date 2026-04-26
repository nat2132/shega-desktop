import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, Trash2, Edit2, Package, AlertTriangle, 
  Search, Filter, ArrowUpRight, ArrowDownRight, 
  Boxes, DollarSign, Activity, History, 
  ChevronRight, ChevronDown, MoreVertical, CheckCircle, X,
  ShieldAlert, RefreshCcw, TrendingUp, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { formatDate } from '../utils/ethiopian-calendar';

interface Item {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  companyName: string;
  purchaseUnit: string;
  baseUnit: string;
  unitsPerPack: number;
  totalPackQuantity: number;
  totalBaseQuantity: number;
  packPurchasePrice: number;
  basePurchasePrice: number;
  baseSellingPrice: number;
  packSellingPrice: number;
  allowSellByBaseUnit: number;
  allowSellByPackUnit: number;
  expiryDate: string;
  qualityGrade: string;
  notes: string;
  isCredit: number;
  supplierPhone: string;
  supplierAccount: string;
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Adjustment {
  id: number;
  type: string;
  oldValue: number;
  newValue: number;
  reason: string;
  date: string;
  quantity: number;
}

const Inventory: React.FC = () => {
  const { t, calendarType, language } = useSettings();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyItem, setHistoryItem] = useState<Item | null>(null);
  const [itemHistory, setItemHistory] = useState<Adjustment[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');

  const [formData, setFormData] = useState({
    name: '', categoryId: '', companyName: '', purchaseUnit: 'Box', baseUnit: 'Piece',
    unitsPerPack: '1', totalPackQuantity: '0', totalBaseQuantity: '0',
    packPurchasePrice: '0', basePurchasePrice: '0', baseSellingPrice: '', packSellingPrice: '0',
    allowSellByBaseUnit: true, allowSellByPackUnit: false,
    expiryDate: '', qualityGrade: '', notes: '', isCredit: false,
    supplierPhone: '', supplierAccount: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsData, catsData] = await Promise.all([
        window.api.getItems({ search: searchQuery, category: selectedCategory === 'All' ? undefined : selectedCategory }),
        window.api.getCategories()
      ]);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
    } catch (error) {
      console.error("Failed to load inventory data:", error);
      setItems([]);
      setCategories([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (stockFilter === 'Low') return item.totalBaseQuantity > 0 && item.totalBaseQuantity < 10;
      if (stockFilter === 'Out') return item.totalBaseQuantity <= 0;
      if (stockFilter === 'Healthy') return item.totalBaseQuantity >= 10;
      return true;
    });
  }, [items, stockFilter]);

  const stats = useMemo(() => {
    const totalValue = items.reduce((sum, item) => sum + (item.totalBaseQuantity * item.basePurchasePrice), 0);
    const lowStock = items.filter(i => i.totalBaseQuantity > 0 && i.totalBaseQuantity < 10).length;
    const outOfStock = items.filter(i => i.totalBaseQuantity <= 0).length;
    return { totalValue, lowStock, outOfStock, totalItems: items.length };
  }, [items]);

  const loadHistory = async (item: Item) => {
    setHistoryItem(item);
    const history = await window.api.getAdjustments({ itemId: item.id });
    setItemHistory(history);
    setShowHistoryModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = {
      ...formData,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
      unitsPerPack: parseFloat(formData.unitsPerPack) || 1,
      totalPackQuantity: parseFloat(formData.totalPackQuantity) || 0,
      totalBaseQuantity: parseFloat(formData.totalBaseQuantity) || 0,
      packPurchasePrice: parseFloat(formData.packPurchasePrice) || 0,
      basePurchasePrice: parseFloat(formData.basePurchasePrice) || 0,
      baseSellingPrice: parseFloat(formData.baseSellingPrice) || 0,
      packSellingPrice: parseFloat(formData.packSellingPrice) || 0
    };

    if (editingItem) {
      await window.api.updateItem(editingItem.id, item);
    } else {
      await window.api.insertItem(item);
    }

    setShowModal(false);
    setEditingItem(null);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Permanently delete this product? This action cannot be undone.')) {
      await window.api.deleteItem(id);
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', categoryId: '', companyName: '', purchaseUnit: 'Box', baseUnit: 'Piece',
      unitsPerPack: '1', totalPackQuantity: '0', totalBaseQuantity: '0',
      packPurchasePrice: '0', basePurchasePrice: '0', baseSellingPrice: '', packSellingPrice: '0',
      allowSellByBaseUnit: true, allowSellByPackUnit: false,
      expiryDate: '', qualityGrade: '', notes: '', isCredit: false,
      supplierPhone: '', supplierAccount: ''
    });
  };

  const openEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryId: String(item.categoryId || ''),
      companyName: item.companyName || '',
      purchaseUnit: item.purchaseUnit || 'Box',
      baseUnit: item.baseUnit || 'Piece',
      unitsPerPack: String(item.unitsPerPack || 1),
      totalPackQuantity: String(item.totalPackQuantity || 0),
      totalBaseQuantity: String(item.totalBaseQuantity || 0),
      packPurchasePrice: String(item.packPurchasePrice || 0),
      basePurchasePrice: String(item.basePurchasePrice || 0),
      baseSellingPrice: String(item.baseSellingPrice || 0),
      packSellingPrice: String(item.packSellingPrice || 0),
      allowSellByBaseUnit: !!item.allowSellByBaseUnit,
      allowSellByPackUnit: !!item.allowSellByPackUnit,
      expiryDate: item.expiryDate || '',
      qualityGrade: item.qualityGrade || '',
      notes: item.notes || '',
      isCredit: !!item.isCredit,
      supplierPhone: item.supplierPhone || '',
      supplierAccount: item.supplierAccount || ''
    });
    setShowModal(true);
  };

  return (
    <div className="fade-in pb-24 relative min-h-screen">
      <Header 
        title="Stock Intelligence" 
        subtitle="Manage products, supply chain, and inventory health."
        onSearch={setSearchQuery}
      />



      {/* Explicit Spacer for Sticky Header */}
      <div className="h-12 md:h-16 w-full shrink-0"></div>

      <div className="px-8 md:px-16 lg:px-24 max-w-[1800px] mx-auto flex flex-col gap-y-6">
        
        {/* Hero Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Inventory Value', value: `ETB ${(stats.totalValue || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-retail-black/70 border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]', textColor: 'text-white' },
            { label: 'Low Stock Items', value: stats.lowStock, icon: AlertTriangle, color: 'bg-retail-orange/70 border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]', textColor: 'text-white' },
            { label: 'Out of Stock', value: stats.outOfStock, icon: ShieldAlert, color: 'bg-white/40 border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)]' },
            { label: 'Total SKUs', value: stats.totalItems, icon: Boxes, color: 'bg-retail-gray-100/50 border-white/40 shadow-[inset_0_0_20px_rgba(255,255,255,0.4)]' },
          ].map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${s.color} ${s.border || ''} backdrop-blur-2xl saturate-150 rounded-[28px] p-6 flex flex-col relative overflow-hidden shadow-xl shadow-black/5 border group`}
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

        {/* Controls */}
        <div className="bg-white/40 backdrop-blur-2xl saturate-150 rounded-[28px] p-5 border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5 flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex bg-retail-gray-100 p-1.5 rounded-[25px] gap-2.5">
              {['All', 'Low', 'Out'].map(f => (
                <button 
                  key={f}
                  onClick={() => setStockFilter(f)}
                  className={`rounded-3xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                    stockFilter === f 
                      ? 'bg-retail-black text-white shadow-2xl px-10 py-5' 
                      : 'text-retail-gray-300 hover:text-retail-black px-6 py-4'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="h-8 w-px bg-retail-gray-200 mx-2" />
            <div className="relative group">
              <select 
                className="bg-transparent text-xs font-black uppercase tracking-widest text-retail-gray-300 outline-none cursor-pointer group-hover:text-retail-black transition-colors appearance-none pr-8 pl-2"
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-retail-gray-300 pointer-events-none" />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-5 bg-retail-gray-100 text-retail-black rounded-2xl hover:bg-retail-gray-200 transition-all">
              <Download size={22} />
            </button>
            <button 
              onClick={() => { resetForm(); setEditingItem(null); setShowModal(true); }}
              className="px-10 py-5 bg-retail-orange text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-retail-orange/20 hover:scale-105 active:scale-95"
            >
              <Plus size={18} strokeWidth={3} /> Add Product
            </button>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white/40 backdrop-blur-2xl saturate-150 rounded-[28px] overflow-hidden border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5 relative z-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-retail-gray-100/50 border-b border-retail-gray-200 ">
                  <th className="px-8 py-6 text-xs font-black text-retail-gray-300 uppercase tracking-[0.2em]">Product Details</th>
                  <th className="px-8 py-6 text-xs font-black text-retail-gray-300 uppercase tracking-[0.2em]">Stock Level</th>
                  <th className="px-8 py-6 text-xs font-black text-retail-gray-300 uppercase tracking-[0.2em]">Financials</th>
                  <th className="px-8 py-6 text-xs font-black text-retail-gray-300 uppercase tracking-[0.2em]">Quality & Origin</th>
                  <th className="px-8 py-6 text-xs font-black text-retail-gray-300 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-retail-gray-100">
                {filteredItems.length === 0 ? (
                  <tr><td colSpan={5} className="p-24 text-center text-retail-gray-300 italic font-medium uppercase text-[10px] tracking-widest">No matching products found.</td></tr>
                ) : (
                  filteredItems.map((item) => {
                    const margin = item.basePurchasePrice > 0 
                      ? ((item.baseSellingPrice - item.basePurchasePrice) / item.basePurchasePrice * 100).toFixed(1)
                      : '0';
                    return (
                      <motion.tr 
                        layout
                        key={item.id} 
                        className="hover:bg-retail-gray-100/50 transition-all group"
                      >
                        <td className="p-8">
                          <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-3xl bg-retail-gray-100 flex items-center justify-center border border-retail-gray-200 group-hover:bg-white group-hover:shadow-lg transition-all">
                              <Package size={28} className="text-retail-gray-300 group-hover:text-retail-orange transition-colors" />
                            </div>
                            <div>
                              <p className="font-black text-lg text-retail-black tracking-tighter">{item.name}</p>
                              <p className="text-[10px] text-retail-gray-300 font-black uppercase tracking-widest mt-0.5">{item.categoryName || 'General'} • {item.companyName || 'No Brand'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-8">
                          <div className="w-48 space-y-3">
                            <div className="flex justify-between items-end">
                              <span className="text-sm font-black text-retail-black">{item.totalBaseQuantity} {item.baseUnit}</span>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${item.totalBaseQuantity < 10 ? 'text-red-500' : 'text-green-500'}`}>
                                {item.totalBaseQuantity <= 0 ? 'Out of Stock' : item.totalBaseQuantity < 10 ? 'Refill' : 'Optimal'}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-retail-gray-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (item.totalBaseQuantity / 50) * 100)}%` }}
                                className={`h-full rounded-full ${item.totalBaseQuantity < 10 ? 'bg-retail-orange' : 'bg-retail-black'}`}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-8">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <p className="text-base font-black text-retail-black">ETB {(item.baseSellingPrice || 0).toLocaleString()}</p>
                              <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
                                +{margin}%
                              </span>
                            </div>
                            <p className="text-[10px] text-retail-gray-300 font-black uppercase tracking-widest">Cost: ETB {item.basePurchasePrice}</p>
                          </div>
                        </td>
                        <td className="p-8">
                          <p className="text-xs font-bold text-retail-black">{item.supplierPhone || '-'}</p>
                          <p className="text-[10px] text-retail-gray-300 uppercase font-black tracking-widest mt-1">{item.qualityGrade || 'Standard Grade'}</p>
                        </td>
                        <td className="p-8 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <button 
                              onClick={() => loadHistory(item)}
                              className="w-12 h-12 rounded-2xl bg-retail-gray-100 hover:bg-retail-black hover:text-white transition-all flex items-center justify-center"
                              title="Stock History"
                            >
                              <History size={20} />
                            </button>
                            <button 
                              onClick={() => openEdit(item)}
                              className="w-12 h-12 rounded-2xl bg-retail-gray-100 hover:bg-retail-orange hover:text-white transition-all flex items-center justify-center"
                            >
                              <Edit2 size={20} />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)}
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

      {/* Inventory Edit/Add Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? 'Edit Product' : 'Initialize Product'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <label className="text-xs font-black text-retail-gray-300 uppercase tracking-widest block">Basic Information</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Product Name *</p>
                  <input required placeholder="Enter name" className="w-full px-7 py-4 bg-retail-gray-100 rounded-xl font-bold outline-none border border-transparent focus:border-retail-orange focus:bg-white transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Category</p>
                  <select className="w-full px-7 py-4 bg-retail-gray-100 rounded-xl font-bold outline-none appearance-none border border-transparent focus:border-retail-orange focus:bg-white transition-all" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Brand / Maker</p>
                <input placeholder="Optional" className="w-full px-7 py-4 bg-retail-gray-100 rounded-xl font-bold outline-none border border-transparent focus:border-retail-orange focus:bg-white transition-all" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Quality Grade</p>
                <input placeholder="e.g. Premium" className="w-full px-7 py-4 bg-retail-gray-100 rounded-xl font-bold outline-none border border-transparent focus:border-retail-orange focus:bg-white transition-all" value={formData.qualityGrade} onChange={e => setFormData({...formData, qualityGrade: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Expiry Date</p>
                <input type="date" className="w-full px-7 py-4 bg-retail-gray-100 rounded-xl font-bold outline-none border border-transparent focus:border-retail-orange focus:bg-white transition-all" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 p-6 rounded-[28px] bg-retail-gray-100 border border-retail-gray-200">
              <label className="text-xs font-black text-retail-gray-300 uppercase tracking-widest block mb-4">Stock & Inventory Control</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Bulk Unit</p>
                  <input placeholder="e.g. Box" className="w-full px-7 py-4 bg-white rounded-xl font-bold outline-none border border-transparent focus:border-retail-orange transition-all" value={formData.purchaseUnit} onChange={e => setFormData({...formData, purchaseUnit: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Base Unit</p>
                  <input placeholder="e.g. Piece" className="w-full px-7 py-4 bg-white rounded-xl font-bold outline-none border border-transparent focus:border-retail-orange transition-all" value={formData.baseUnit} onChange={e => setFormData({...formData, baseUnit: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Units Per Bulk</p>
                  <input type="number" placeholder="0" className="w-full px-7 py-4 bg-white rounded-xl font-bold outline-none border border-transparent focus:border-retail-orange transition-all" value={formData.unitsPerPack} onChange={e => setFormData({...formData, unitsPerPack: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-retail-gray-400 uppercase tracking-widest ml-2">Current Bulk Count</p>
                  <input type="number" step="0.01" placeholder="0.00" className="w-full px-7 py-4 bg-white rounded-xl font-bold outline-none border border-transparent focus:border-retail-orange transition-all" value={formData.totalPackQuantity} onChange={e => setFormData({...formData, totalPackQuantity: e.target.value})} />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-1.5">
                  <p className="text-[10px] font-black text-retail-black uppercase tracking-widest ml-2">Total Individual Units (Calculated)</p>
                  <input type="number" step="0.01" placeholder="0.00" className="w-full px-7 py-4 bg-white rounded-xl font-black outline-none border-2 border-retail-black" value={formData.totalBaseQuantity} onChange={e => setFormData({...formData, totalBaseQuantity: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-[28px] bg-retail-black text-white shadow-2xl shadow-black/20">
              <div className="space-y-4">
                <label className="text-xs font-black text-white uppercase tracking-widest block">Retail Pricing (Base Unit)</label>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/80 uppercase tracking-widest ml-2">Purchase Cost</p>
                    <input type="number" placeholder="0.00" className="w-full px-7 py-4 bg-white/5 border border-white/20 rounded-xl font-bold outline-none text-white focus:bg-white/10 focus:border-white/30 transition-all" value={formData.basePurchasePrice} onChange={e => setFormData({...formData, basePurchasePrice: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/80 uppercase tracking-widest ml-2">Selling Price *</p>
                    <input required type="number" placeholder="0.00" className="w-full px-7 py-4 bg-retail-orange rounded-xl font-bold outline-none text-white placeholder:text-white/80 border border-white/30 focus:scale-[1.02] transition-all" value={formData.baseSellingPrice} onChange={e => setFormData({...formData, baseSellingPrice: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-black text-white uppercase tracking-widest block">Wholesale Pricing (Bulk)</label>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/80 uppercase tracking-widest ml-2">Bulk Purchase Cost</p>
                    <input type="number" placeholder="0.00" className="w-full px-7 py-4 bg-white/5 border border-white/20 rounded-xl font-bold outline-none text-white focus:bg-white/10 focus:border-white/30 transition-all" value={formData.packPurchasePrice} onChange={e => setFormData({...formData, packPurchasePrice: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/80 uppercase tracking-widest ml-2">Bulk Selling Price</p>
                    <input type="number" placeholder="0.00" className="w-full px-7 py-4 bg-white/5 border border-white/20 rounded-xl font-bold outline-none text-white focus:bg-white/10 focus:border-white/30 transition-all" value={formData.packSellingPrice} onChange={e => setFormData({...formData, packSellingPrice: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-8 border-t border-retail-gray-100">
            <button type="submit" className="flex-[2] px-14 py-6 bg-retail-black text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95">
              {editingItem ? 'Update Product' : 'Confirm & Save'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-10 py-6 bg-retail-gray-100 text-retail-gray-300 rounded-2xl font-black uppercase tracking-widest transition-all hover:text-retail-black hover:bg-retail-gray-200">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title={`Stock History: ${historyItem?.name}`} size="lg">
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {itemHistory.length === 0 ? (
            <div className="p-20 text-center text-retail-gray-300 font-black uppercase text-[10px] tracking-widest italic bg-retail-gray-100 rounded-4xl">No historical data available.</div>
          ) : (
            itemHistory.map((adj) => (
              <div key={adj.id} className="p-6 rounded-[32px] bg-retail-gray-100 border border-transparent hover:border-retail-gray-200 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    adj.type === 'damage' ? 'bg-red-100 text-red-500' : 'bg-retail-black text-white'
                  }`}>
                    {adj.type === 'damage' ? <ShieldAlert size={24} /> : <RefreshCcw size={24} />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-retail-black uppercase tracking-tight">{(adj.type || '').replace('_', ' ')}</p>
                    <p className="text-[10px] text-retail-gray-300 font-black uppercase tracking-widest mt-1">{formatDate(new Date(adj.date || Date.now()), calendarType, language)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-3 font-black mb-1">
                    <span className="text-xs text-retail-gray-300 line-through">{adj.oldValue}</span>
                    <ChevronRight size={14} className="text-retail-gray-200" />
                    <span className="text-lg text-retail-black">{adj.newValue}</span>
                  </div>
                  <p className="text-[10px] text-retail-gray-300 font-bold italic tracking-widest">{adj.reason}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Inventory;
