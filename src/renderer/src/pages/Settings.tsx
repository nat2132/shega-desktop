import React, { useState, useEffect } from 'react';
import { 
  Palette, Globe, Calendar, Bell, User, Lock, Database, 
  Download, Trash2, Shield, Moon, Sun, Droplets, TreePine, 
  Sunset, Crown, Building2, Mail, Phone, MapPin,
  Globe2, Landmark, Percent, Users2, ShieldCheck, 
  Key, LogOut, CheckCircle, Smartphone, HardDrive,
  RefreshCcw, UploadCloud, ChevronRight, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings, Language, CalendarType, Theme } from '../context/SettingsContext';
import Header from '../components/Header';
import Modal from '../components/Modal';

const LANGUAGES: { id: Language; name: string; native: string }[] = [
  { id: 'en', name: 'English', native: 'English' },
  { id: 'am', name: 'Amharic', native: 'አማርኛ' },
  { id: 'om', name: 'Oromo', native: 'Afaan Oromo' },
  { id: 'ti', name: 'Tigrinya', native: 'ትግርኛ' },
];

const Settings: React.FC = () => {
  const { t, language, setLanguage, calendarType, setCalendarType, theme, setTheme } = useSettings();
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'system' | 'security' | 'data'>('profile');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinData, setPinData] = useState({ current: '', newPin: '', confirm: '' });
  const [pinEnabled, setPinEnabled] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [companyInfo, setCompanyInfo] = useState({
    name: 'Shega Enterprise',
    email: 'contact@shega.app',
    phone: '+251 900 0000',
    address: 'Addis Ababa, Ethiopia',
    taxId: '8273645'
  });

  useEffect(() => {
    window.api.getSetting('pin_enabled').then((v: boolean | null) => {
      if (v !== null) setPinEnabled(v);
    });
  }, []);

  const handlePinSave = async () => {
    if (pinData.newPin !== pinData.confirm || pinData.newPin.length !== 4) return;
    await window.api.setSetting('pin_code', pinData.newPin);
    await window.api.setSetting('pin_enabled', true);
    setPinEnabled(true);
    setShowPinModal(false);
    setPinData({ current: '', newPin: '', confirm: '' });
  };

  const handleRemovePin = async () => {
    await window.api.setSetting('pin_enabled', false);
    await window.api.setSetting('pin_code', null);
    setPinEnabled(false);
  };

  const handleExport = async () => {
    const data = await window.api.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shega-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleReset = async () => {
    await window.api.resetData();
    setShowResetConfirm(false);
    window.location.reload();
  };

  const tabs = [
    { id: 'profile' as const, label: 'Enterprise Profile', icon: Building2 },
    { id: 'system' as const, label: 'Localization Engine', icon: Globe },
    { id: 'security' as const, label: 'Security Protocols', icon: ShieldCheck },
    { id: 'data' as const, label: 'Core Database', icon: Database },
  ];

  return (
    <div className="fade-in pb-24 relative min-h-screen">
      <Header 
        title="Command Settings" 
        subtitle="Manage localized preferences, security protocols, and operational workflows."
      />



      {/* Explicit Spacer for Sticky Header */}
      <div className="h-12 md:h-16 w-full shrink-0"></div>

      <div className="px-8 md:px-16 lg:px-24 max-w-[1800px] mx-auto flex flex-col gap-y-8">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Navigation Sidebar */}
          <div className="col-span-12 lg:col-span-3 space-y-2">
             <p className="text-xs font-black text-retail-gray-300 uppercase tracking-[0.3em] mb-4 px-4">Configuration Map</p>
             {tabs.map(tab => (
              <motion.button
                key={tab.id}
                whileHover={{ x: 4 }}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${
                  activeTab === tab.id 
                    ? 'bg-retail-black text-white shadow-2xl shadow-black/20' 
                    : 'text-retail-gray-300 hover:text-retail-black hover:bg-retail-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon size={18} strokeWidth={activeTab === tab.id ? 3 : 2} />
                  <span className="font-black text-xs uppercase tracking-widest">{tab.label}</span>
                </div>
                {activeTab === tab.id && <div className="w-1.5 h-1.5 rounded-full bg-retail-orange" />}
              </motion.button>
            ))}
            
            <div className="mt-8 p-6 rounded-[32px] bg-retail-gray-100 border-2 border-transparent">
               <div className="flex items-center gap-3 mb-3">
                  <Shield size={18} className="text-retail-orange" />
                  <span className="text-xs font-black uppercase tracking-widest text-retail-black">Environment</span>
               </div>
               <p className="text-[10px] text-retail-gray-300 font-black uppercase tracking-widest leading-relaxed">Local-first production build v2.4.0 (Enterprise Retail Suite)</p>
            </div>
          </div>

          {/* Content Pane */}
          <div className="col-span-12 lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/40 backdrop-blur-2xl saturate-150 p-8 rounded-[32px] border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] shadow-xl shadow-black/5 min-h-[500px] relative z-10"
              >
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-black text-retail-black tracking-tighter mb-2 flex items-center gap-3">
                        <Building2 className="text-retail-orange" size={28} /> Enterprise Profile
                      </h3>
                      <p className="text-retail-gray-300 text-xs font-black uppercase tracking-widest">Master identity used for all fiscal reporting and invoices.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-5">
                         <div className="space-y-2">
                            <label className="block text-xs font-black text-retail-gray-300 uppercase tracking-widest">Organization Name</label>
                            <input className="w-full px-5 py-3.5 bg-retail-gray-100 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-retail-black transition-all" value={companyInfo.name} onChange={e => setCompanyInfo({...companyInfo, name: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                            <label className="block text-xs font-black text-retail-gray-300 uppercase tracking-widest">Primary Contact</label>
                            <div className="relative">
                              <input className="w-full px-5 py-3.5 bg-retail-gray-100 rounded-2xl font-bold text-sm outline-none" value={companyInfo.phone} />
                              <Phone size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-retail-gray-200" />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="block text-xs font-black text-retail-gray-300 uppercase tracking-widest">Tax ID (TIN)</label>
                            <input className="w-full px-5 py-3.5 bg-retail-gray-100 rounded-2xl font-bold text-sm outline-none" value={companyInfo.taxId} />
                         </div>
                      </div>
                      <div className="space-y-5">
                         <div className="p-8 rounded-[32px] bg-retail-gray-100 border-4 border-dashed border-retail-gray-200 flex flex-col items-center justify-center gap-4 text-center group cursor-pointer hover:bg-retail-gray-200 transition-all">
                            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-retail-black shadow-lg group-hover:scale-110 transition-transform">
                               <UploadCloud size={28} />
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-retail-black">Master Branding (Logo)</p>
                              <p className="text-[10px] text-retail-gray-300 font-black uppercase tracking-[0.2em] mt-1">Recommended: SVG or high-res PNG</p>
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="block text-xs font-black text-retail-gray-300 uppercase tracking-widest">Official Address</label>
                            <textarea className="w-full px-5 py-3.5 bg-retail-gray-100 rounded-2xl font-bold text-sm outline-none h-28 resize-none" value={companyInfo.address} />
                         </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'system' && (
                  <div className="space-y-8">
                     <section>
                        <h4 className="text-xs font-black text-retail-gray-300 uppercase tracking-[0.3em] mb-6">Localization Core</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {LANGUAGES.map(lang => (
                            <button
                              key={lang.id}
                              onClick={() => setLanguage(lang.id)}
                              className={`p-5 rounded-2xl flex items-center justify-between transition-all border-2 ${
                                language === lang.id ? 'border-retail-black bg-retail-black text-white shadow-2xl shadow-black/20' : 'border-retail-gray-100 hover:border-retail-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <span className={`text-xl font-black w-8 ${language === lang.id ? 'text-retail-orange' : 'text-retail-gray-200'}`}>{lang.id.toUpperCase()}</span>
                                <div className="text-left">
                                  <p className="font-black text-sm uppercase tracking-tighter">{lang.name}</p>
                                  <p className={`text-xs font-black uppercase tracking-widest mt-1 ${language === lang.id ? 'text-white/40' : 'text-retail-gray-300'}`}>{lang.native}</p>
                                </div>
                              </div>
                              {language === lang.id && <CheckCircle size={20} className="text-retail-orange" />}
                            </button>
                          ))}
                        </div>
                     </section>

                     <section>
                        <h4 className="text-xs font-black text-retail-gray-300 uppercase tracking-[0.3em] mb-6">Operational Protocols</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-6 rounded-[32px] bg-retail-gray-100 border-2 border-transparent">
                             <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-xl bg-white text-retail-black shadow-sm">
                                  <Calendar size={20} />
                                </div>
                                <div className="flex bg-white p-1 rounded-xl shadow-sm">
                                  <button onClick={() => setCalendarType('ethiopian')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${calendarType === 'ethiopian' ? 'bg-retail-black text-white shadow-lg' : 'text-retail-gray-300'}`}>ET</button>
                                  <button onClick={() => setCalendarType('gregorian')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${calendarType === 'gregorian' ? 'bg-retail-black text-white shadow-lg' : 'text-retail-gray-300'}`}>GR</button>
                                </div>
                             </div>
                             <p className="font-black text-sm uppercase tracking-widest text-retail-black">Calendar Engine</p>
                             <p className="text-xs text-retail-gray-300 font-black uppercase tracking-widest mt-1">Primary date formatting for all ledgers.</p>
                          </div>
                          <div className="p-6 rounded-[32px] bg-retail-gray-100 border-2 border-transparent">
                             <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-xl bg-white text-green-500 shadow-sm">
                                  <Percent size={20} />
                                </div>
                                <span className="text-lg font-black text-retail-black tracking-tighter">15.0%</span>
                             </div>
                             <p className="font-black text-sm uppercase tracking-widest text-retail-black">Fiscal Tax Rate (VAT)</p>
                             <div className="flex items-center gap-3 mt-1">
                                <input type="number" defaultValue={15} className="bg-transparent border-none outline-none text-xs text-retail-gray-300 font-black uppercase tracking-widest" />
                                <ChevronRight size={14} className="text-retail-gray-200" />
                             </div>
                          </div>
                        </div>
                     </section>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                     <div>
                      <h3 className="text-2xl font-black text-retail-black tracking-tighter mb-2 flex items-center gap-3">
                        <ShieldCheck className="text-retail-orange" size={28} /> Security Studio
                      </h3>
                      <p className="text-retail-gray-300 text-xs font-black uppercase tracking-widest">Master gatekeeper protocols and access control.</p>
                    </div>

                    <div className="bg-retail-gray-100 rounded-[32px] p-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-retail-black shadow-sm">
                             <Key size={20} />
                          </div>
                          <div>
                            <p className="font-black text-base tracking-tight text-retail-black">Master Entry Shield</p>
                            <p className="text-xs text-retail-gray-300 font-black uppercase tracking-widest mt-1">Require cryptographic PIN for app initialization.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {pinEnabled ? (
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-black text-green-500 bg-white px-3 py-1.5 rounded-full shadow-sm">SHIELD ACTIVE</span>
                              <button onClick={() => setShowPinModal(true)} className="text-xs font-black text-retail-black uppercase tracking-widest hover:underline">Reconfigure</button>
                              <button onClick={handleRemovePin} className="text-xs font-black text-red-500 uppercase tracking-widest hover:underline">Deactivate</button>
                            </div>
                          ) : (
                            <button onClick={() => setShowPinModal(true)} className="px-6 py-3 bg-retail-black text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all">Enable Protection</button>
                          )}
                        </div>
                      </div>

                      <div className="h-px bg-retail-gray-200" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-retail-gray-300 shadow-sm">
                             <Smartphone size={20} />
                          </div>
                          <div>
                            <p className="font-black text-base tracking-tight text-retail-black">Session Persistence</p>
                            <p className="text-xs text-retail-gray-300 font-black uppercase tracking-widest mt-1">Automatic logout on system suspension.</p>
                          </div>
                        </div>
                        <div 
                          className={`w-12 h-6 rounded-full p-0.5 cursor-pointer transition-all ${pinEnabled ? 'bg-retail-orange' : 'bg-retail-gray-300'}`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${pinEnabled ? 'translate-x-6' : ''}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'data' && (
                  <div className="space-y-6">
                     <div>
                      <h3 className="text-2xl font-black text-retail-black tracking-tighter mb-2 flex items-center gap-3">
                        <Database className="text-retail-orange" size={28} /> Operational Data
                      </h3>
                      <p className="text-retail-gray-300 text-xs font-black uppercase tracking-widest">Master database archives, migration, and purge controls.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <motion.div 
                        whileHover={{ scale: 1.02 }}
                        onClick={handleExport}
                        className="p-8 rounded-[32px] bg-retail-gray-100 border-2 border-transparent hover:border-retail-black transition-all cursor-pointer group"
                       >
                          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-retail-black shadow-sm mb-6 group-hover:scale-110 transition-transform">
                             <Download size={20} />
                          </div>
                          <p className="font-black text-lg text-retail-black uppercase tracking-tight">Full Archive Export</p>
                          <p className="text-xs text-retail-gray-300 font-black uppercase tracking-widest mt-3 leading-relaxed">Cryptographically signed JSON dump of all organizational data.</p>
                       </motion.div>
                       
                       <motion.div 
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setShowResetConfirm(true)}
                        className="p-8 rounded-[32px] bg-retail-gray-100 border-2 border-transparent hover:border-red-500 transition-all cursor-pointer group"
                       >
                          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-red-500 shadow-sm mb-6 group-hover:rotate-180 transition-transform duration-700">
                             <RefreshCcw size={20} />
                          </div>
                          <p className="font-black text-lg text-retail-black uppercase tracking-tight">System Purge</p>
                          <p className="text-xs text-retail-gray-300 font-black uppercase tracking-widest mt-3 leading-relaxed">Permanently delete all localized ledgers and factory reset the suite.</p>
                       </motion.div>
                    </div>

                    <div className="p-6 rounded-[32px] bg-retail-black/70 backdrop-blur-2xl saturate-150 text-white flex gap-4 border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] shadow-xl shadow-black/5">
                       <AlertCircle className="text-retail-orange flex-shrink-0" size={24} />
                       <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] mb-1">Redundancy Protocol</p>
                          <p className="text-xs text-white/40 font-black uppercase tracking-widest leading-relaxed">Maintain secondary off-site backups for complete disaster recovery capability.</p>
                       </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Modal isOpen={showPinModal} onClose={() => setShowPinModal(false)} title="Shield Configuration" size="sm">
        <div className="space-y-10">
          <div className="flex items-center gap-6 p-6 rounded-[32px] bg-retail-gray-100 text-retail-black">
             <Shield size={24} className="text-retail-orange" />
             <p className="text-[10px] font-black uppercase tracking-widest leading-tight">PIN is locally hashed and cannot be recovered via cloud services.</p>
          </div>
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-retail-gray-300 uppercase tracking-widest">Master 4-Digit PIN</label>
              <input 
                type="password" 
                maxLength={4} 
                className="w-full bg-retail-gray-100 rounded-[24px] text-center text-5xl tracking-[0.6em] py-8 font-black border-4 border-transparent focus:border-retail-black transition-all outline-none" 
                placeholder="0000"
                value={pinData.newPin} 
                onChange={e => setPinData({...pinData, newPin: e.target.value.replace(/\D/g, '')})} 
              />
            </div>
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-retail-gray-300 uppercase tracking-widest text-center">Verify Master PIN</label>
              <input 
                type="password" 
                maxLength={4} 
                className="w-full bg-retail-gray-100 rounded-[24px] text-center text-5xl tracking-[0.6em] py-8 font-black border-4 border-transparent focus:border-retail-black transition-all outline-none" 
                placeholder="0000"
                value={pinData.confirm} 
                onChange={e => setPinData({...pinData, confirm: e.target.value.replace(/\D/g, '')})} 
              />
            </div>
          </div>
          <button onClick={handlePinSave} className="w-full py-6 bg-retail-black text-white rounded-[24px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-black/20 active:scale-95">Enable entry shield</button>
        </div>
      </Modal>

      <Modal isOpen={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="Destructive Wipe Protocol" size="sm">
        <div className="space-y-10 py-4">
          <div className="w-24 h-24 rounded-[32px] bg-red-100 flex items-center justify-center text-red-500 mx-auto">
             <Trash2 size={48} strokeWidth={3} />
          </div>
          <div className="text-center space-y-4">
            <h4 className="text-2xl font-black text-retail-black tracking-tighter">System Purge?</h4>
            <p className="text-retail-gray-300 text-[10px] font-black uppercase tracking-widest leading-relaxed">This will permanently delete all organizational ledgers, assets, and history. This action is <span className="text-red-500 underline">IMMEDIATE AND FINAL</span>.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={handleReset} className="flex-1 py-6 bg-red-500 hover:bg-red-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-red-500/20">Wipe Database</button>
            <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-6 bg-retail-gray-100 text-retail-gray-300 hover:text-retail-black rounded-[24px] font-black uppercase tracking-widest transition-all">Abort</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
