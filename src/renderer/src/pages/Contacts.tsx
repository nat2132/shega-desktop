import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Plus, Search, Phone, Pencil, Trash2, Users, Copy, Building2, HardHat,
  Wrench, User, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

import { useSettings } from '../context/SettingsContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog';

const CATEGORIES = ['supplier', 'worker', 'service', 'other'] as const;
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  supplier: <Building2 className="h-4 w-4" />,
  worker: <HardHat className="h-4 w-4" />,
  service: <Wrench className="h-4 w-4" />,
  other: <User className="h-4 w-4" />,
};

interface Contact {
  id: number;
  name: string;
  phone: string;
  category: string;
  subCategory: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  phone: string;
  category: string;
  subCategory: string;
  notes: string;
}

const DEFAULT_FORM: FormData = {
  name: '', phone: '', category: '', subCategory: '', notes: '',
};

const Contacts: React.FC = () => {
  const { t } = useSettings();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const result: any = await window.api.getContacts({
        search: search || undefined,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        limit: 10000, offset: 0,
      });
      const rows: Contact[] = result.rows || result || [];
      setContacts(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      toast.error(e.message || t('contacts.load_error'));
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const filtered = useMemo(() => {
    let list = contacts;
    if (categoryFilter !== 'all') {
      list = list.filter(c => c.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.subCategory || '').toLowerCase().includes(q) ||
        (c.notes || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [contacts, categoryFilter, search]);

  const openAddForm = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (contact: Contact) => {
    setForm({
      name: contact.name,
      phone: contact.phone,
      category: contact.category,
      subCategory: contact.subCategory || '',
      notes: contact.notes || '',
    });
    setEditingId(contact.id);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t('contacts.name_required'));
      return;
    }
    if (!form.phone.trim()) {
      toast.error(t('contacts.phone_required'));
      return;
    }
    if (!form.category) {
      toast.error(t('contacts.category_required'));
      return;
    }
    try {
      if (editingId) {
        await window.api.updateContact(editingId, form);
        toast.success(t('contacts.contact_updated'));
      } else {
        await window.api.insertContact(form);
        toast.success(t('contacts.contact_added'));
      }
      setShowForm(false);
      setForm(DEFAULT_FORM);
      setEditingId(null);
      loadContacts();
    } catch (e: any) {
      toast.error(e.message || t('contacts.save_error'));
    }
  };

  const handleDeleteClick = (contact: Contact) => {
    setDeleteTarget(contact);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await window.api.deleteContact(deleteTarget.id);
      toast.success(t('contacts.contact_deleted'));
      setShowDeleteAlert(false);
      setDeleteTarget(null);
      loadContacts();
    } catch (e: any) {
      toast.error(e.message || t('contacts.delete_error'));
    }
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    toast.success(t('contacts.phone_copied'));
  };

  const categoryBadge = (cat: string) => {
    const variantMap: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      supplier: 'default',
      worker: 'secondary',
      service: 'outline',
      other: 'destructive',
    };
    const labelMap: Record<string, string> = {
      supplier: t('contacts.supplier'),
      worker: t('contacts.worker'),
      service: t('contacts.service'),
      other: t('contacts.other'),
    };
    return (
      <Badge variant={variantMap[cat] || 'outline'} className="text-xs gap-1">
        {CATEGORY_ICONS[cat]}
        {labelMap[cat] || cat}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in px-4 lg:px-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />{t('contacts.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('contacts.subtitle')}</p>
        </div>
        <Button size="sm" onClick={openAddForm}>
          <Plus className="h-4 w-4 mr-1" />{t('contacts.add_contact')}
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('common.search') + '...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button variant="ghost" size="icon" onClick={loadContacts}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-1 flex-wrap">
        {['all', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
              categoryFilter === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
            }`}
          >
            {cat === 'all'
              ? t('common.all')
              : CATEGORY_ICONS[cat]
              ? <span className="flex items-center gap-1.5">{CATEGORY_ICONS[cat]}{t(`contacts.${cat}`)}</span>
              : t(`contacts.${cat}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">{t('contacts.no_contacts')}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={openAddForm}>
            <Plus className="h-4 w-4 mr-1" />{t('contacts.add_contact')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(contact => (
            <Card key={contact.id} className="rounded-3xl overflow-hidden group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      {CATEGORY_ICONS[contact.category] || <User className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{contact.name}</h3>
                      <div className="mt-0.5">{categoryBadge(contact.category)}</div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditForm(contact)}
                      title={t('common.edit')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteClick(contact)}
                      title={t('common.delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <button
                  onClick={() => handleCopyPhone(contact.phone)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 w-full text-left"
                  title={t('contacts.copy_phone')}
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{contact.phone}</span>
                  <Copy className="h-3 w-3 ml-auto shrink-0 opacity-40" />
                </button>

                {contact.subCategory && (
                  <div className="text-xs text-muted-foreground mb-1">
                    <span className="text-xs font-black uppercase tracking-widest">
                      {t('contacts.sub_category')}:
                    </span>{' '}
                    {contact.subCategory}
                  </div>
                )}

                {contact.notes && (
                  <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2 italic border-t pt-2 border-border/40">
                    {contact.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t('contacts.edit_contact') : t('contacts.add_contact')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {t('contacts.name')} *
              </Label>
              <Input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={t('contacts.name')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {t('contacts.phone')} *
              </Label>
              <Input
                required
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder={t('contacts.phone_placeholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {t('contacts.category')} *
              </Label>
              <Select
                value={form.category}
                onValueChange={v => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('contacts.select_category')} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      <span className="flex items-center gap-2">
                        {CATEGORY_ICONS[cat]}
                        {t(`contacts.${cat}`)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {t('contacts.sub_category')}
              </Label>
              <Input
                value={form.subCategory}
                onChange={e => setForm({ ...form, subCategory: e.target.value })}
                placeholder={t('contacts.sub_category_placeholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {t('contacts.notes')}
              </Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder={t('contacts.notes_placeholder')}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); setEditingId(null); }}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit">{editingId ? t('contacts.edit_contact') : t('common.save')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('contacts.delete_contact')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('contacts.confirm_delete')} <strong>{deleteTarget?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              {t('contacts.delete_contact')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Contacts;
