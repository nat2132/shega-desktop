import React, { useState, useEffect } from 'react';
import {
  Palette, Globe, Building2,
  CheckCircle, UploadCloud,
  ShieldCheck, Database, Sun, Moon, Trash2, Upload, Bell, HardDrive, RotateCcw, FileText,
  Sparkles, Leaf, Flame, Gem, Coffee, Clock, Headphones,
  Phone, HeartPulse, Info, RefreshCw, Download,
  Printer, Server, Percent
} from 'lucide-react';

import { useSettings, Language } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { cn } from '../utils/shadcn';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import NotificationSettings from '../components/NotificationSettings';
import DataTransferModal from '../components/DataTransferModal';
import { BusinessHealthScore } from '../components/BusinessHealthScore';
import { UpdateDialog } from '../components/UpdateDialog';
import DeviceSettings from '../components/DeviceSettings';
import P2pSyncStatus from '../components/P2pSyncStatus';
import SyncSettings from '../components/SyncSettings';

import companyLogo from '../assets/company.png';
import { resolveAvatar, AVATAR_OPTIONS, avatarFileNameFrom } from '../lib/avatar';

const LANGUAGES: { id: Language; nameKey: string; native: string }[] = [
  { id: 'en', nameKey: 'settings.lang_en', native: 'English' },
  { id: 'am', nameKey: 'settings.lang_am', native: 'አማርኛ' },
  { id: 'om', nameKey: 'settings.lang_om', native: 'Afaan Oromo' },
  { id: 'ti', nameKey: 'settings.lang_ti', native: 'ትግርኛ' },
];

const Settings: React.FC = () => {
  const { 
    language, setLanguage,
    calendarType, setCalendarType,
    timeSystem, setTimeSystem,
    theme, setTheme,
    taxEnabled, setTaxEnabled,
    taxRate, setTaxRate,
    currentBusiness, refreshBusiness,
    t
  } = useSettings();
  const { currentAdmin, refreshAdmin } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'system' | 'tax' | 'notifications' | 'data' | 'devices' | 'sync' | 'support' | 'health' | 'about'>('profile');
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateDialogAction, setUpdateDialogAction] = useState<'check' | 'auto'>('auto');
  const [appVersion, setAppVersion] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDataTransfer, setShowDataTransfer] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const currentAvatar = avatar ?? (currentAdmin?.avatar && currentAdmin.avatar.startsWith('profile') ? currentAdmin.avatar : null);
  const [backups, setBackups] = useState<any[]>([]);
  const [showBackups, setShowBackups] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);
  const [backupResult, setBackupResult] = useState<{ name: string; size: number; path: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [bizForm, setBizForm] = useState({
    businessName: '',
    storeName: '',
    email: '',
    phone: '',
    address: '',
    currency: 'ETB',
    logo: ''
  });

  React.useEffect(() => {
    window.api.getAppVersion?.().then(setAppVersion).catch(() => {});
    // (Notification preferences are now loaded by the NotificationSettings component)
  }, []);

  React.useEffect(() => {
    if (currentBusiness) {
      setBizForm({
        businessName: currentBusiness.businessName,
        storeName: currentBusiness.storeName,
        email: currentBusiness.email || '',
        phone: currentBusiness.phone || '',
        address: currentBusiness.address || '',
        currency: currentBusiness.currency || 'ETB',
        logo: currentBusiness.logo || ''
      });
    }
  }, [currentBusiness]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBizForm(prev => ({ ...prev, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleUpdateBiz = async () => {
    if (!currentBusiness) return;
    if (!bizForm.businessName.trim()) { toast.error(t('settings.business_name_required', 'Business name is required')); return; }
    if (!bizForm.storeName.trim()) { toast.error(t('settings.store_name_required', 'Store name is required')); return; }
    try {
      await window.api?.updateBusiness(currentBusiness.id, bizForm);
      await refreshBusiness();
      toast.success(t('settings.commit_success'));
    } catch {
      toast.error(t('settings.commit_error'));
    }
  };

  const handleUpdateAvatar = async (filename: string | null) => {
    if (!currentAdmin) return;
    try {
      await window.api.updateAdmin(currentAdmin.id, { avatar: filename });
      await refreshAdmin();
      setAvatar(filename);
      toast.success(t('settings.avatar_updated', 'Profile image updated'));
    } catch (e: any) {
      toast.error(e.message || t('settings.avatar_error', 'Failed to update avatar'));
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!currentAdmin) return;
      try {
        await window.api.updateAdmin(currentAdmin.id, { avatar: dataUrl });
        await refreshAdmin();
        setAvatar(dataUrl);
        toast.success(t('settings.avatar_upload_success', 'Profile image uploaded'));
      } catch (err: any) {
        toast.error(err.message || t('settings.avatar_error', 'Failed to update avatar'));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetBackup = async () => {
    const result = await window.api?.createBackup();
    if (result?.success) {
      setBackupResult(result);
      toast.success(t('settings.backup_created'));
    } else {
      toast.error(result?.error || t('settings.backup_error'));
    }
  };

  const handleConfirmReset = async () => {
    try {
      await window.api?.resetData('all');
      setShowResetConfirm(false);
      setBackupResult(null);
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || t('settings.wipe_error', 'Wipe failed'));
    }
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    const result = await window.api?.createBackup();
    setBackupLoading(false);
    if (result?.success) {
      toast.success(t('settings.backup_created'));
      loadBackups();
    } else {
      toast.error(result?.error || t('settings.backup_error'));
    }
  };

  const handleRestoreBackup = async (name: string) => {
    const result = await window.api?.restoreBackup(name);
    setShowRestoreConfirm(null);
    if (result?.success) {
      toast.success(t('settings.restore_success'));
      setTimeout(() => window.location.reload(), 1500);
    } else {
      toast.error(result?.error || t('settings.restore_error'));
    }
  };

  const handleDeleteBackup = async (name: string) => {
    await window.api?.deleteBackup(name);
    loadBackups();
  };

  const loadBackups = async () => {
    const list = await window.api?.listBackups();
    setBackups(list || []);
  };

  const handleToggleBackups = () => {
    if (!showBackups) loadBackups();
    setShowBackups(!showBackups);
  };

  const tabs = [
    { id: 'profile' as const, label: t('settings.enterprise_profile'), icon: Building2 },
    { id: 'appearance' as const, label: t('settings.visual_interface'), icon: Palette },
    { id: 'system' as const, label: t('settings.localization_engine'), icon: Globe },
    { id: 'tax' as const, label: t('settings.tax', 'Tax'), icon: Percent },
    { id: 'notifications' as const, label: t('settings.notifications'), icon: Bell },
    { id: 'data' as const, label: t('settings.core_database'), icon: Database },
    { id: 'devices' as const, label: 'Devices', icon: Printer },
    { id: 'sync' as const, label: 'Sync Hub', icon: Server },
    { id: 'support' as const, label: t('settings.support'), icon: Headphones },
    { id: 'health' as const, label: 'Health Score', icon: HeartPulse },
    { id: 'about' as const, label: 'About', icon: Info },
  ];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
      <div className="px-4 lg:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
           <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] mb-4 px-2">{t('settings.header')}</p>
           <div className="flex flex-col gap-1">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full h-12 justify-between px-4 rounded-xl transition-all",
                  activeTab === tab.id ? "shadow-md" : "text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <tab.icon size={16} strokeWidth={activeTab === tab.id ? 3 : 2} />
                  <span className="font-black text-xs uppercase tracking-widest">{tab.label}</span>
                </div>
                {activeTab === tab.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </Button>
            ))}
           </div>
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-9">
           <div className="rounded-2xl border bg-card/40 p-8 min-h-[500px]">
               {activeTab === 'profile' && (
                <div className="space-y-8">
                   <div className="space-y-1">
                      <h4 className="text-sm font-black uppercase tracking-widest">{t('settings.org_identity')}</h4>
                      <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">{t('settings.org_desc')} {currentBusiness?.businessName}.</p>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-5">
                         <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('settings.corporate_name')}</label>
                            <Input value={bizForm.businessName} onChange={e => setBizForm({...bizForm, businessName: e.target.value})} />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('settings.store_name')}</label>
                            <Input value={bizForm.storeName} onChange={e => setBizForm({...bizForm, storeName: e.target.value})} />
                         </div>

                          <Button className="w-full h-12 text-xs tracking-widest mt-4 shadow-xl shadow-primary/20" onClick={handleUpdateBiz}>
                            {t('settings.commit_changes')}
                         </Button>
                      </div>

                      <div className="space-y-5">
                          <div className="space-y-1.5">
                             <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('settings.org_branding')}</label>
                             <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                             <div onClick={() => fileInputRef.current?.click()} className="aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/30 transition-all group/upload bg-muted/10 relative overflow-hidden">
                                {bizForm.logo ? (
                                  <img src={bizForm.logo} alt={t('settings.logo_alt', 'Logo')} className="absolute inset-0 w-full h-full object-contain p-4" />
                                ) : (
                                  <>
                                    <img src={companyLogo} alt={t('settings.logo_alt', 'Logo')} className="absolute inset-0 w-full h-full object-contain p-4 opacity-40" />
                                    <div className="relative z-10 flex flex-col items-center justify-center gap-3">
                                      <div className="h-12 w-12 rounded-full bg-card flex items-center justify-center shadow-md group-hover/upload:scale-110 transition-transform">
                                         <UploadCloud size={20} className="text-muted-foreground" />
                                      </div>
                                      <div className="text-center">
                                         <p className="text-xs font-black uppercase tracking-widest">{t('settings.drop_asset')}</p>
                                         <p className="text-xs text-muted-foreground font-black uppercase mt-1">{t('settings.asset_desc')}</p>
                                      </div>
                                    </div>
                                  </>
                                )}
                             </div>
                           </div>
                       </div>
                    </div>
                    {/* Profile Avatar */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">{t('settings.avatar_title')}</h4>
                      <div className="flex flex-wrap gap-3">
                        {AVATAR_OPTIONS.map((src, idx) => {
                          const filename = avatarFileNameFrom(src);
                          const isSelected = currentAvatar === filename || resolveAvatar(avatar ?? currentAdmin?.avatar) === src;
                          return (
                            <div
                              key={idx}
                              onClick={() => handleUpdateAvatar(filename)}
                              className={`relative w-14 h-14 rounded-2xl border-2 overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                                isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                              }`}
                            >
                              <img src={src} alt={t('settings.avatar_alt', 'Avatar {n}', { n: idx + 1 })} className="w-full h-full object-cover" />
                            </div>
                          );
                        })}
                        <label className="relative w-14 h-14 rounded-2xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all hover:scale-105">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} />
                        </label>
                      </div>
                    </div>
                 </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-8">
                   <div className="space-y-1">
                      <h3 className="text-xl font-black tracking-tight">{t('settings.visual_interface')}</h3>
                      <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">{t('settings.appearance_desc')}</p>
                   </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                       {[
                          { id: 'light', name: t('settings.light_mode'), icon: Sun, desc: t('settings.theme_light_desc', 'Clean & bright') },
                          { id: 'dark', name: t('settings.dark_mode'), icon: Moon, desc: t('settings.theme_dark_desc', 'Classic dark') },
                          { id: 'midnight', name: t('settings.theme_midnight', 'Midnight'), icon: Sparkles, desc: t('settings.theme_midnight_desc', 'Blue + gold') },
                          { id: 'emerald', name: t('settings.theme_emerald', 'Emerald'), icon: Leaf, desc: t('settings.theme_emerald_desc', 'Green + sand') },
                          { id: 'charcoal', name: t('settings.theme_charcoal', 'Charcoal'), icon: Flame, desc: t('settings.theme_charcoal_desc', 'Red + amber') },
                          { id: 'slate', name: t('settings.theme_slate', 'Slate'), icon: Gem, desc: t('settings.theme_slate_desc', 'Violet + gold') },
                          { id: 'cocoa', name: t('settings.theme_cocoa', 'Cocoa'), icon: Coffee, desc: t('settings.theme_cocoa_desc', 'Copper + cream') },
                        ].map((t_item) => (
                         <div 
                           key={t_item.id}
                           onClick={() => setTheme(t_item.id as any)}
                           className={cn(
                             "p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 text-center",
                             theme === t_item.id ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-muted/20 hover:border-muted-foreground/30"
                           )}
                         >
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                              theme === t_item.id ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                            )}>
                               <t_item.icon size={16} />
                            </div>
                            <div>
                              <span className="text-xs font-black uppercase tracking-widest block">{t_item.name}</span>
                              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t_item.desc}</span>
                            </div>
                            {theme === t_item.id && <Badge variant="default" className="text-xs h-4 px-1.5">{t('settings.active')}</Badge>}
                         </div>
                       ))}
                    </div>
                    <div className="p-4 rounded-2xl border bg-muted/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest">{t('settings.time_system')}</p>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t('settings.time_system_desc')}</p>
                        </div>
                      </div>
                      <div className="flex bg-card p-1 rounded-lg border">
                        <Button size="sm" variant={timeSystem === 'device' ? 'default' : 'ghost'} onClick={() => setTimeSystem('device')} className="h-7 px-3 text-xs">{t('settings.device_time')}</Button>
                        <Button size="sm" variant={timeSystem === 'ethiopian' ? 'default' : 'ghost'} onClick={() => setTimeSystem('ethiopian')} className="h-7 px-3 text-xs">{t('settings.ethiopian_time')}</Button>
                      </div>
                    </div>
                </div>
              )}

              {activeTab === 'system' && (
                <div className="space-y-8">
                   <div className="space-y-1">
                      <h3 className="text-xl font-black tracking-tight">{t('settings.localization_engine')}</h3>
                      <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">{t('settings.date_formatting')}</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {LANGUAGES.map(lang => (
                        <Button
                          key={lang.id}
                          variant={language === lang.id ? "default" : "outline"}
                          onClick={() => setLanguage(lang.id)}
                          className="h-16 justify-between px-5 rounded-xl border-2"
                        >
                           <div className="flex items-center gap-4">
                              <span className="text-lg font-black opacity-30">{lang.id.toUpperCase()}</span>
                              <div className="text-left">
                                  <p className="text-xs font-black uppercase tracking-widest">{t(lang.nameKey, lang.native)}</p>
                                 <p className="text-xs opacity-60">{lang.native}</p>
                              </div>
                           </div>
                           {language === lang.id && <CheckCircle size={16} />}
                        </Button>
                      ))}
                   </div>
                   <div className="p-6 rounded-xl border bg-muted/20 flex items-center justify-between">
                      <div>
                         <p className="text-xs font-black uppercase tracking-widest">{t('settings.calendar_protocol')}</p>
                         <p className="text-xs text-muted-foreground font-bold uppercase">{t('settings.date_formatting')}</p>
                      </div>
<div className="flex bg-card p-1 rounded-lg border">
                          <Button size="sm" variant={calendarType === 'ethiopian' ? 'default' : 'ghost'} onClick={() => setCalendarType('ethiopian')} className="h-7 px-4 text-xs">{t('common.ethiopian')}</Button>
                          <Button size="sm" variant={calendarType === 'gregorian' ? 'default' : 'ghost'} onClick={() => setCalendarType('gregorian')} className="h-7 px-4 text-xs">{t('common.gregorian')}</Button>
                       </div>
</div>
                </div>
              )}

{activeTab === 'tax' && (
                <div className="space-y-8">
                   <div className="space-y-1">
                      <h3 className="text-xl font-black tracking-tight">{t('settings.tax', 'Tax')}</h3>
                      <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">{t('settings.tax_desc', 'Set how tax is applied to your sales')}</p>
                   </div>
                   <div className="p-6 rounded-2xl border bg-muted/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Percent size={20} className="text-foreground" />
                         <div>
                            <p className="text-sm font-black uppercase tracking-widest">{t('settings.tax_enable', 'Enable Tax')}</p>
                            <p className="text-xs text-muted-foreground font-bold uppercase mt-0.5">{t('settings.tax_enable_desc', 'Apply tax to new sales')}</p>
                         </div>
                      </div>
                      <Switch checked={taxEnabled} onCheckedChange={setTaxEnabled} />
                   </div>
                   <div className={`p-6 rounded-2xl border bg-muted/20 transition-opacity ${taxEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
                      <div className="flex items-center gap-3 mb-4">
                         <ShieldCheck size={20} className="text-foreground" />
                         <div>
                            <p className="text-sm font-black uppercase tracking-widest">{t('settings.tax_rate', 'Tax Rate')}</p>
                            <p className="text-xs text-muted-foreground font-bold uppercase mt-0.5">{t('settings.tax_rate_desc', 'Percentage applied to the subtotal')}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3 max-w-xs">
                         <Input
                           type="number"
                           min="0"
                           max="100"
                           step="0.5"
                           value={String(taxRate)}
                           onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                           className="h-12 text-lg font-black text-center rounded-xl"
                         />
                         <span className="text-2xl font-black text-muted-foreground">%</span>
                      </div>
                   </div>
                </div>
               )}

{activeTab === 'notifications' && (
                <div className="space-y-8">
                   <div className="space-y-1">
                      <h3 className="text-xl font-black tracking-tight">{t('settings.notifications')}</h3>
                      <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">{t('settings.notif_desc')}</p>
                   </div>
                   <NotificationSettings />
                </div>
               )}

               {activeTab === 'data' && (
                <div className="space-y-8">
                   <div className="space-y-1">
                      <h3 className="text-xl font-black tracking-tight">{t('settings.core_database')}</h3>
                      <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">{t('settings.purge_desc')}</p>
                   </div>
                   <div className="p-6 rounded-2xl border bg-muted/20">
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <HardDrive size={20} className="text-foreground" />
                            <div>
                               <p className="text-sm font-black uppercase tracking-widest">{t('settings.backup_title')}</p>
                               <p className="text-xs text-muted-foreground font-bold uppercase mt-0.5">{t('settings.backup_desc')}</p>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <Button size="sm" variant="default" onClick={handleCreateBackup} disabled={backupLoading} className="h-8 px-3 text-xs">
                               <Upload size={12} className="mr-1.5" />
                               {t('settings.backup_create')}
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleToggleBackups} className="h-8 px-3 text-xs">
                               <FileText size={12} className="mr-1.5" />
                               {t('settings.backup_list')}
                            </Button>
                         </div>
                      </div>
                      {showBackups && (
                        <div className="space-y-2 mt-4 pt-4 border-t">
                          {backups.length === 0 ? (
                            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest text-center py-4">{t('settings.backup_none')}</p>
                          ) : (
                            backups.map(b => (
                              <div key={b.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                                <div className="flex items-center gap-3">
                                   <FileText size={14} className="text-muted-foreground" />
                                   <div>
                                      <p className="text-xs font-black uppercase tracking-widest">{b.name.replace('.db', '').replace('shega-backup-', '')}</p>
                                      <p className="text-xs text-muted-foreground font-bold">{(b.size / 1024).toFixed(1)} KB</p>
                                   </div>
                                </div>
                                <div className="flex gap-1">
                                   <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowRestoreConfirm(b.name)} title={t('settings.backup_restore')}>
                                      <RotateCcw size={12} />
                                   </Button>
                                   <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteBackup(b.name)} title={t('settings.backup_delete')}>
                                      <Trash2 size={12} />
                                   </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                   </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 rounded-2xl border bg-muted/20 hover:border-primary transition-all cursor-pointer group" onClick={() => setShowDataTransfer(true)}>
                           <Upload size={24} className="mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
                           <p className="text-sm font-black uppercase tracking-widest">{t('settings.data_transfer') || 'Data Transfer'}</p>
                           <p className="text-xs text-muted-foreground font-bold uppercase mt-2">{t('settings.data_transfer_desc') || 'Import/export your data'}</p>
                        </div>
                       <div className="p-8 rounded-2xl border bg-muted/20 hover:border-destructive transition-all cursor-pointer group" onClick={() => setShowResetConfirm(true)}>
                          <Trash2 size={24} className="mb-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                          <p className="text-sm font-black uppercase tracking-widest">{t('settings.purge_system')}</p>
                          <p className="text-xs text-muted-foreground font-bold uppercase mt-2">{t('settings.purge_desc')}</p>
                       </div>
                    </div>
                </div>
              )}

{activeTab === 'devices' && (
              <>
                <P2pSyncStatus />
                <div className="mt-4">
                  <DeviceSettings />
                </div>
              </>
            )}
            {activeTab === 'sync' && (
              <SyncSettings />
            )}

               {activeTab === 'health' && (
                <BusinessHealthScore />
               )}

               {activeTab === 'about' && (
                 <div className="space-y-8">
                   <div className="space-y-1">
                     <h3 className="text-xl font-black tracking-tight">About Shega</h3>
                     <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Application information & updates</p>
                   </div>

                   <div className="rounded-2xl border bg-muted/20 p-6 flex flex-col items-center text-center gap-4">
                     <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                       <Building2 size={28} className="text-primary" />
                     </div>
                     <div>
                       <p className="text-lg font-black tracking-tight">Shega</p>
                       <p className="text-xs text-muted-foreground">Offline Inventory & Sales Management</p>
                     </div>
                     <Badge variant="outline" className="text-xs font-mono px-3 py-1">
                       v{appVersion || '1.0.0'}
                     </Badge>
                     <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                       App ID: com.shega.inventory
                     </p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Button
                       onClick={() => {
                         setUpdateDialogAction('check');
                         setShowUpdateDialog(true);
                       }}
                       className="h-14 rounded-2xl font-black uppercase text-xs tracking-widest"
                     >
                       <RefreshCw size={14} />
                       Check for Updates
                     </Button>

                     <Button
                       variant="outline"
                       onClick={() => window.api?.openExternal?.('https://github.com/nat2132/shega-desktop/releases')}
                       className="h-14 rounded-2xl font-black uppercase text-xs tracking-widest"
                     >
                       <Download size={14} />
                       View Releases
                     </Button>
                   </div>

                   <div className="rounded-2xl border bg-muted/10 p-4 space-y-2">
                     <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Technical Details</p>
                     <div className="grid grid-cols-2 gap-2 text-xs">
                       <div>
                         <span className="text-muted-foreground">Version: </span>
                         <span className="font-mono">{appVersion || '1.0.0'}</span>
                       </div>
                       <div>
                         <span className="text-muted-foreground">Platform: </span>
                         <span className="font-mono">Windows (NSIS)</span>
                       </div>
                       <div>
                         <span className="text-muted-foreground">Electron: </span>
                         <span className="font-mono">41.x</span>
                       </div>
                       <div>
                         <span className="text-muted-foreground">Channel: </span>
                         <span className="font-mono">Stable</span>
                       </div>
                     </div>
                   </div>

                   <UpdateDialog
                     open={showUpdateDialog}
                     onOpenChange={setShowUpdateDialog}
                     initialAction={updateDialogAction}
                   />
                 </div>
               )}

{activeTab === 'support' && (
                  <div className="space-y-8">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black tracking-tight">{t('settings.support')}</h3>
                      <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">{t('settings.support_desc')}</p>
                    </div>
                    <div className="grid grid-cols-1 max-w-md">
                      <a href="tel:+251925319901" className="p-8 rounded-2xl border bg-muted/20 hover:bg-primary/5 hover:border-primary/30 transition-all group">
                        <Phone size={28} className="mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <p className="text-sm font-black uppercase tracking-widest">{t('support.call_us')}</p>
                        <p className="text-lg font-bold mt-2 text-primary">+251925319901</p>
                      </a>
                    </div>
                  </div>
                )}
            </div>
        </div>
      </div>

      <Modal isOpen={showResetConfirm} onClose={() => { setShowResetConfirm(false); setBackupResult(null); }} title={t('settings.wipe_protocol')} size="sm">
         <div className="text-center space-y-6">
           {!backupResult ? (
             <>
              <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mx-auto">
                 <Trash2 size={32} />
              </div>
              <div className="space-y-2">
                 <h4 className="text-lg font-black tracking-tight">{t('settings.initialize_purge')}</h4>
                 <p className="text-xs font-black uppercase tracking-widest text-muted-foreground leading-relaxed">
                    {t('settings.wipe_warning')}
                 </p>
              </div>
              <div className="flex gap-4">
                 <Button variant="destructive" className="flex-1" onClick={handleResetBackup}>{t('settings.wipe_create_backup', 'Create Backup & Reset')}</Button>
                 <Button variant="outline" className="flex-1" onClick={() => { setShowResetConfirm(false); setBackupResult(null); }}>{t('common.abort')}</Button>
              </div>
             </>
           ) : (
             <>
              <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mx-auto">
                 <ShieldCheck size={32} />
              </div>
              <div className="space-y-2">
                 <h4 className="text-lg font-black tracking-tight">{t('settings.backup_created_title', 'Backup Created')}</h4>
                 <div className="text-xs text-left space-y-1 bg-muted/30 p-4 rounded-xl">
                   <p><span className="font-bold">{t('settings.backup_name', 'Name')}:</span> {backupResult.name}</p>
                   <p><span className="font-bold">{t('settings.backup_size', 'Size')}:</span> {(backupResult.size / 1024).toFixed(1)} KB</p>
                 </div>
                 <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                   {t('settings.wipe_after_backup', 'A backup was created. Proceed with data reset?')}
                 </p>
              </div>
              <div className="flex gap-4">
                 <Button variant="destructive" className="flex-1" onClick={handleConfirmReset}>{t('settings.wipe_confirm')}</Button>
                 <Button variant="outline" className="flex-1" onClick={() => { setShowResetConfirm(false); setBackupResult(null); }}>{t('common.abort')}</Button>
              </div>
             </>
           )}
         </div>
      </Modal>

      <Modal isOpen={!!showRestoreConfirm} onClose={() => setShowRestoreConfirm(null)} title={t('settings.backup_restore_title')} size="sm">
         <div className="text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-warning/10 flex items-center justify-center text-warning mx-auto">
               <RotateCcw size={32} />
            </div>
            <div className="space-y-2">
               <h4 className="text-lg font-black tracking-tight">{t('settings.backup_restore_title')}</h4>
               <p className="text-xs font-black uppercase tracking-widest text-muted-foreground leading-relaxed">
                  {t('settings.backup_restore_warn')}
               </p>
            </div>
            <div className="flex gap-4">
               <Button variant="default" className="flex-1" onClick={() => showRestoreConfirm && handleRestoreBackup(showRestoreConfirm)}>{t('settings.backup_restore_confirm')}</Button>
               <Button variant="outline" className="flex-1" onClick={() => setShowRestoreConfirm(null)}>{t('common.abort')}</Button>
            </div>
         </div>
      </Modal>
      <DataTransferModal open={showDataTransfer} onClose={() => setShowDataTransfer(false)} />
    </div>
  );
};

export default Settings;
