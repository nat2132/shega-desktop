import React, { useEffect, useState } from 'react';
import { Plus, Bell, BellOff, CheckCircle, Clock, Calendar, Trash2, ChevronDown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { useSettings } from '../context/SettingsContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { DatePicker } from '../components/DatePicker';

type ReminderType = 'once' | 'daily' | 'weekly' | 'monthly';
type ReminderStatus = 'active' | 'completed' | 'snoozed';

interface Reminder {
  id: number;
  title: string;
  message: string;
  type: ReminderType;
  status: ReminderStatus;
  triggerAt: string;
  lastTriggered: string | null;
  snoozedUntil: string | null;
}

const REMINDER_TYPES: ReminderType[] = ['once', 'daily', 'weekly', 'monthly'];

const MOCK_REMINDERS: Reminder[] = [
  { id: 1, title: 'Stock Check', message: 'Review low stock items', type: 'weekly', status: 'active', triggerAt: new Date(Date.now() + 86400000).toISOString(), lastTriggered: null, snoozedUntil: null },
  { id: 2, title: 'Supplier Payment', message: 'Pay ABC Supplies', type: 'monthly', status: 'active', triggerAt: new Date(Date.now() + 172800000).toISOString(), lastTriggered: null, snoozedUntil: null },
  { id: 3, title: 'Inventory Count', message: 'End of month count', type: 'monthly', status: 'completed', triggerAt: new Date(Date.now() - 604800000).toISOString(), lastTriggered: new Date(Date.now() - 604800000).toISOString(), snoozedUntil: null },
];

const initialFormState = {
  title: '',
  message: '',
  type: 'once' as ReminderType,
  triggerDate: new Date().toISOString().split('T')[0],
  triggerTime: '09:00',
};

const ReminderHistory: React.FC = () => {
  const { t, formatDate } = useSettings();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeTab, setActiveTab] = useState<string>('active');
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ ...initialFormState });

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const data = await window.api?.getReminders();
      if (data && Array.isArray(data)) {
        const mapped: Reminder[] = data.map((r: any) => ({
          id: r.id,
          title: r.title,
          message: r.message || '',
          type: (r.repeatInterval || 'once') as ReminderType,
          status: (r.status === 'pending' ? 'active' : r.status) as ReminderStatus,
          triggerAt: r.triggerDate,
          lastTriggered: r.lastTriggeredAt || null,
          snoozedUntil: r.snoozedUntil || null,
        }));
        setReminders(mapped);
      } else {
        setReminders(MOCK_REMINDERS);
      }
    } catch {
      setReminders(MOCK_REMINDERS);
    }
  };

  const filteredReminders = reminders.filter(r => r.status === (activeTab === 'all' ? r.status : activeTab));

  const resetForm = () => {
    setFormData({ ...initialFormState });
    setEditingReminder(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      message: reminder.message,
      type: reminder.type,
      triggerDate: reminder.triggerAt.split('T')[0] || new Date().toISOString().split('T')[0],
      triggerTime: reminder.triggerAt.split('T')[1]?.slice(0, 5) || '09:00',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const triggerDate = `${formData.triggerDate}T${formData.triggerTime}:00`;
    const repeatInterval = formData.type === 'once' ? null : formData.type;
    const payload = { title: formData.title.trim(), message: formData.message.trim(), repeatInterval, triggerDate };

    if (editingReminder) {
      try {
        await window.api?.updateReminder(editingReminder.id, payload);
        toast.success(t('reminders.edit_reminder'));
      } catch {
        toast.error('Failed to update reminder');
      }
    } else {
      try {
        await window.api?.createReminder(payload);
        toast.success(t('reminders.new_reminder'));
      } catch {
        toast.error('Failed to create reminder');
      }
    }

    setShowModal(false);
    resetForm();
    loadReminders();
  };

  const handleDelete = async (id: number) => {
    try {
      await window.api?.deleteReminder(id);
    } catch {
      console.log('deleteReminder', id);
    }
    setDeleteId(null);
    loadReminders();
  };

  const handleSnooze = async (id: number, hours: number) => {
    try {
      const untilIso = new Date(Date.now() + hours * 3600000).toISOString();
      await window.api?.snoozeReminder(id, untilIso);
      toast.success(t('reminders.snoozed'));
    } catch {
      console.log('snoozeReminder', id, hours);
    }
    loadReminders();
  };

  const handleComplete = async (id: number) => {
    try {
      await window.api?.completeReminder(id);
    } catch {
      console.log('completeReminder', id);
    }
    loadReminders();
  };

  const getTypeLabel = (type: ReminderType) => {
    const keyMap: Record<ReminderType, string> = { once: 'reminders.once', daily: 'reminders.daily', weekly: 'reminders.weekly', monthly: 'reminders.monthly' };
    return t(keyMap[type]);
  };

  const getStatusBadge = (status: ReminderStatus) => {
    const config: Record<ReminderStatus, { label: string; variant: 'default' | 'outline' | 'secondary' | 'destructive' }> = {
      active: { label: t('reminders.status_active'), variant: 'default' },
      completed: { label: t('reminders.status_completed'), variant: 'secondary' },
      snoozed: { label: t('reminders.status_snoozed'), variant: 'outline' },
    };
    const c = config[status];
    return <Badge variant={c.variant} className="uppercase text-[9px] font-bold">{c.label}</Badge>;
  };

  return (
    <>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
        <div className="px-4 lg:px-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">{t('reminders.title')}</h1>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">{t('reminders.subtitle')}</p>
          </div>
          <Button onClick={openCreate} className="h-11 px-5 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            {t('reminders.new_reminder')}
          </Button>
        </div>

        <div className="px-4 lg:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="active">{t('reminders.active')}</TabsTrigger>
              <TabsTrigger value="completed">{t('reminders.completed')}</TabsTrigger>
              <TabsTrigger value="snoozed">{t('reminders.snoozed')}</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-3 mt-0">
              {filteredReminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <BellOff className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">{t('reminders.no_reminders')}</p>
                  <p className="text-[10px] text-muted-foreground font-bold mt-1">{t('reminders.create_first')}</p>
                  <Button onClick={openCreate} variant="outline" size="sm" className="mt-4 h-9 text-[9px] font-black uppercase tracking-widest rounded-lg">
                    <Plus className="h-3 w-3 mr-1.5" />
                    {t('reminders.new_reminder')}
                  </Button>
                </div>
              ) : (
                filteredReminders.map(reminder => (
                  <div key={reminder.id} className="p-5 rounded-2xl border bg-card hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Bell className="h-4 w-4 text-primary shrink-0" />
                          <h3 className="font-black text-sm truncate">{reminder.title}</h3>
                        </div>
                        {reminder.message && (
                          <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">{reminder.message}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <Badge variant="outline" className="uppercase text-[9px] font-bold">{getTypeLabel(reminder.type)}</Badge>
                          {getStatusBadge(reminder.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{t('reminders.trigger_at')}: {formatDate(reminder.triggerAt)}</span>
                          </div>
                          {reminder.lastTriggered && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{t('reminders.last_triggered')}: {formatDate(reminder.lastTriggered)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {reminder.status === 'active' && (
                          <div className="relative group/snooze">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={t('reminders.snooze_1h')}>
                              <Clock className="h-4 w-4" />
                            </Button>
                            <div className="absolute right-0 top-full mt-1 hidden group-hover/snooze:flex flex-col bg-popover border rounded-xl shadow-xl p-1 z-10 min-w-[100px]">
                              <Button variant="ghost" size="sm" className="h-7 justify-start text-[9px] font-black uppercase tracking-widest rounded-lg" onClick={() => handleSnooze(reminder.id, 1)}>{t('reminders.snooze_1h')}</Button>
                              <Button variant="ghost" size="sm" className="h-7 justify-start text-[9px] font-black uppercase tracking-widest rounded-lg" onClick={() => handleSnooze(reminder.id, 24)}>{t('reminders.snooze_1d')}</Button>
                              <Button variant="ghost" size="sm" className="h-7 justify-start text-[9px] font-black uppercase tracking-widest rounded-lg" onClick={() => handleSnooze(reminder.id, 168)}>{t('reminders.snooze_1w')}</Button>
                            </div>
                          </div>
                        )}
                        {reminder.status === 'active' && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600" onClick={() => handleComplete(reminder.id)} title={t('reminders.mark_complete')}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => setDeleteId(reminder.id)} title={t('reminders.delete_reminder')}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingReminder ? t('reminders.edit_reminder') : t('reminders.new_reminder')} size="lg">
          <form onSubmit={handleSubmit} className="space-y-8 py-4">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2">{t('reminders.reminder_title')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('reminders.reminder_title')}</label>
                  <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-12 bg-card rounded-xl font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('reminders.reminder_type')}</label>
                  <Select value={formData.type} onValueChange={val => setFormData({...formData, type: val as ReminderType})}>
                    <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {REMINDER_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{getTypeLabel(type)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('reminders.reminder_message')}</label>
              <Textarea value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="min-h-[80px] bg-card rounded-xl" />
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2">{t('reminders.trigger_at')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('reminders.trigger_at')}</label>
                  <DatePicker value={formData.triggerDate} onChange={v => setFormData({...formData, triggerDate: v})} className="h-12 bg-card rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('reminders.trigger_at')}</label>
                  <Input required type="time" value={formData.triggerTime} onChange={e => setFormData({...formData, triggerTime: e.target.value})} className="h-12 bg-card rounded-xl" />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-md pb-2">
              <Button type="submit" className="flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg">{editingReminder ? t('reminders.edit_reminder') : t('reminders.new_reminder')}</Button>
              <Button type="button" variant="ghost" onClick={() => { setShowModal(false); resetForm(); }} className="py-6 font-bold uppercase tracking-widest opacity-40 hover:bg-transparent">{t('common.abort')}</Button>
            </div>
          </form>
        </Modal>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-[32px] bg-background border-border shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">{t('reminders.confirm_delete')}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium text-muted-foreground leading-relaxed">
              {t('reminders.confirm_delete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl border-border h-11 text-[10px] font-black uppercase tracking-widest">{t('common.abort')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-[10px] font-black uppercase tracking-widest">
              {t('reminders.delete_reminder')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button
        className="fixed bottom-8 right-8 h-20 w-20 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-all z-[9999] flex flex-col gap-1 items-center justify-center border-4 border-primary-foreground/20 group"
        onClick={openCreate}
      >
        <Plus className="h-8 w-8 group-hover:rotate-90 transition-transform duration-300" strokeWidth={4} />
        <span className="text-[8px] font-black uppercase tracking-tighter">{t('reminders.new_reminder')}</span>
      </Button>
    </>
  );
};

export default ReminderHistory;
