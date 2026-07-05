import React, { useState, useEffect } from 'react';
import {
  Truck, Search, RefreshCw, MapPin, User, Phone,
  CalendarDays, Edit2, Trash2, X, Clock,
  CheckCircle, XCircle, ArrowRight, Navigation
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { DatePicker } from '../components/DatePicker';

const STATUSES = ['pending', 'in_transit', 'delivered', 'cancelled'] as const;

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ElementType }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  in_transit: { label: 'In Transit', variant: 'default', icon: Navigation },
  delivered: { label: 'Delivered', variant: 'default', icon: CheckCircle },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
};

const Shipments: React.FC = () => {
  const { t, formatDate, formatDateTime } = useSettings();
  const [shipments, setShipments] = useState<any[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editingShipment, setEditingShipment] = useState<any>(null);

  const [form, setForm] = useState({
    origin: '', destination: '', driverName: '', driverPhone: '',
    vehicleInfo: '', notes: '', scheduledDate: ''
  });

  useEffect(() => { loadShipments(); }, []);

  const loadShipments = async () => {
    try {
      const opts: any = {};
      if (searchQuery) opts.search = searchQuery;
      if (statusFilter) opts.status = statusFilter;
      setShipments(await window.api.getShipments(opts) || []);
    } catch (err) { console.error(err); }
  };

  const openCreate = () => {
    setEditingShipment(null);
    setForm({ origin: '', destination: '', driverName: '', driverPhone: '', vehicleInfo: '', notes: '', scheduledDate: '' });
    setShowShipmentModal(true);
  };

  const openEdit = (s: any) => {
    setEditingShipment(s);
    setForm({
      origin: s.origin || '', destination: s.destination, driverName: s.driverName || '',
      driverPhone: s.driverPhone || '', vehicleInfo: s.vehicleInfo || '',
      notes: s.notes || '', scheduledDate: s.scheduledDate || ''
    });
    setShowShipmentModal(true);
  };

  const openDetail = async (id: number) => {
    try {
      const detail = await window.api.getShipment(id);
      setSelectedShipment(detail);
      setShowDetailModal(true);
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    if (!form.destination.trim()) return toast.error(t('shipments.fill_required'));
    try {
      if (editingShipment) {
        await window.api.updateShipment(editingShipment.id, form);
        toast.success(t('shipments.shipment_updated'));
      } else {
        await window.api.insertShipment(form);
        toast.success(t('shipments.shipment_created'));
      }
      setShowShipmentModal(false);
      loadShipments();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await window.api.updateShipmentStatus(id, status);
      toast.success(t('shipments.status_updated'));
      loadShipments();
      if (selectedShipment?.id === id) openDetail(id);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await window.api.deleteShipment(deleteTarget.id);
      toast.success(t('shipments.shipment_deleted'));
      setDeleteTarget(null);
      loadShipments();
    } catch (err: any) { toast.error(err.message); }
  };

  const nextStatus = (current: string): string | null => {
    if (current === 'pending') return 'in_transit';
    if (current === 'in_transit') return 'delivered';
    return null;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="text-[9px] font-black uppercase gap-1">
        <Icon size={10} /> {t(`shipments.status_${status}`)}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in">
      {/* Header */}
      <div className="px-4 lg:px-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('shipments.search')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-xs rounded-xl"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border bg-background text-xs font-bold"
          >
            <option value="">{t('shipments.all_statuses')}</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{t(`shipments.status_${s}`)}</option>
            ))}
          </select>
          <Button size="sm" variant="outline" className="h-9 text-[10px] font-black uppercase tracking-widest" onClick={loadShipments}>
            <RefreshCw size={14} className="mr-2" /> {t('shipments.refresh')}
          </Button>
          <Button size="sm" className="h-9 px-5 text-[10px] font-black uppercase tracking-widest" onClick={openCreate}>
            <Truck size={14} className="mr-2" /> {t('shipments.new_shipment')}
          </Button>
        </div>
      </div>

      {/* Shipment Cards */}
      <div className="px-4 lg:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shipments.map(s => (
            <div key={s.id} className="p-5 rounded-2xl border-2 bg-card/40 border-muted hover:border-muted-foreground/30 transition-all group cursor-pointer overflow-hidden" onClick={() => openDetail(s.id)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Truck size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">{s.destination}</p>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">
                      {s.origin || t('shipments.no_origin')}
                    </p>
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="mt-4 space-y-1.5">
                {s.driverName && (
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                    <User size={12} /> {s.driverName}
                  </div>
                )}
                {s.driverPhone && (
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                    <Phone size={12} /> {s.driverPhone}
                  </div>
                )}
                {s.vehicleInfo && (
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                    <Truck size={12} /> {s.vehicleInfo}
                  </div>
                )}
                {s.scheduledDate && (
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                    <CalendarDays size={12} /> {formatDate(s.scheduledDate)}
                  </div>
                )}
              </div>
              {s.notes && (
                <p className="mt-3 text-[9px] text-muted-foreground line-clamp-2">{s.notes}</p>
              )}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                <p className="text-[9px] text-muted-foreground font-bold">{formatDate(s.createdAt)}</p>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  {!['delivered', 'cancelled'].includes(s.status) && (
                    <Button variant="outline" size="sm" className="h-7 text-[8px] font-black uppercase tracking-widest" onClick={() => {
                      const next = nextStatus(s.status);
                      if (next) handleStatusChange(s.id, next);
                    }}>
                      <ArrowRight size={11} className="mr-1" /> {s.status === 'pending' ? t('shipments.mark_in_transit') : t('shipments.mark_delivered')}
                    </Button>
                  )}
                  {s.status === 'pending' && (
                    <Button variant="outline" size="sm" className="h-7 text-[8px] font-black uppercase tracking-widest text-destructive" onClick={() => handleStatusChange(s.id, 'cancelled')}>
                      <X size={11} className="mr-1" /> {t('shipments.cancel')}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 text-[8px] font-black uppercase tracking-widest" onClick={() => openEdit(s)}>
                    <Edit2 size={11} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[8px] font-black uppercase tracking-widest text-destructive" onClick={() => { setDeleteTarget(s); }}>
                    <Trash2 size={11} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {shipments.length === 0 && (
            <div className="col-span-full p-12 text-center">
              <Truck size={32} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('shipments.no_shipments')}</p>
              <Button size="sm" className="mt-4" onClick={openCreate}>{t('shipments.create_first')}</Button>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showShipmentModal} onClose={() => setShowShipmentModal(false)} title={editingShipment ? t('shipments.edit_shipment') : t('shipments.new_shipment')} size="md">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('shipments.origin')}</label>
              <Input value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} placeholder={t('shipments.origin_placeholder')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('shipments.destination')} *</label>
              <Input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder={t('shipments.destination_placeholder')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('shipments.driver_name')}</label>
              <Input value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} placeholder={t('shipments.driver_placeholder')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('shipments.driver_phone')}</label>
              <Input value={form.driverPhone} onChange={e => setForm({ ...form, driverPhone: e.target.value })} placeholder="e.g. +251..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('shipments.vehicle')}</label>
              <Input value={form.vehicleInfo} onChange={e => setForm({ ...form, vehicleInfo: e.target.value })} placeholder={t('shipments.vehicle_placeholder')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('shipments.scheduled_date')}</label>
              <DatePicker value={form.scheduledDate} onChange={v => setForm({ ...form, scheduledDate: v })} className="h-10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('shipments.notes')}</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full h-20 px-3 py-2 rounded-xl border bg-background text-xs font-semibold resize-none"
              placeholder={t('shipments.notes_placeholder')}
            />
          </div>
          <div className="flex gap-4 pt-2">
            <Button className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest" onClick={handleSave}>
              {editingShipment ? t('shipments.update') : t('shipments.create')}
            </Button>
            <Button variant="outline" className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest" onClick={() => setShowShipmentModal(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={t('shipments.shipment_details')} size="lg">
        {selectedShipment && (
          <div className="space-y-6">
            {/* Status & Actions */}
            <div className="flex items-center justify-between">
              <StatusBadge status={selectedShipment.status} />
              <div className="flex gap-2">
                {!['delivered', 'cancelled'].includes(selectedShipment.status) && (
                  <Button size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest" onClick={() => {
                    const next = nextStatus(selectedShipment.status);
                    if (next) handleStatusChange(selectedShipment.id, next);
                  }}>
                    <ArrowRight size={12} className="mr-1" />
                    {selectedShipment.status === 'pending' ? t('shipments.mark_in_transit') : t('shipments.mark_delivered')}
                  </Button>
                )}
                {selectedShipment.status === 'pending' && (
                  <Button size="sm" variant="destructive" className="h-8 text-[9px] font-black uppercase tracking-widest" onClick={() => handleStatusChange(selectedShipment.id, 'cancelled')}>
                    <X size={12} className="mr-1" /> {t('shipments.cancel')}
                  </Button>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3 p-4 rounded-xl bg-muted/20">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('shipments.route')}</p>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <MapPin size={14} className="text-primary" />
                  <span>{selectedShipment.origin || t('shipments.no_origin')}</span>
                  <ArrowRight size={14} className="text-muted-foreground mx-1" />
                  <MapPin size={14} className="text-destructive" />
                  <span>{selectedShipment.destination}</span>
                </div>
              </div>
              <div className="space-y-3 p-4 rounded-xl bg-muted/20">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('shipments.driver_info')}</p>
                {selectedShipment.driverName ? (
                  <>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <User size={14} /> {selectedShipment.driverName}
                    </div>
                    {selectedShipment.driverPhone && (
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <Phone size={14} /> {selectedShipment.driverPhone}
                      </div>
                    )}
                    {selectedShipment.vehicleInfo && (
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <Truck size={14} /> {selectedShipment.vehicleInfo}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">{t('shipments.no_driver')}</p>
                )}
              </div>
            </div>

            {selectedShipment.scheduledDate && (
              <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                <CalendarDays size={14} /> {t('shipments.scheduled')}: {formatDate(selectedShipment.scheduledDate)}
              </div>
            )}

            {selectedShipment.deliveredAt && (
              <div className="flex items-center gap-2 text-[10px] font-semibold text-green-600">
                <CheckCircle size={14} /> {t('shipments.delivered_at')}: {formatDateTime(selectedShipment.deliveredAt)}
              </div>
            )}

            {selectedShipment.notes && (
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('shipments.notes')}</p>
                <p className="text-xs">{selectedShipment.notes}</p>
              </div>
            )}

            {/* History */}
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('shipments.history')}</p>
              <div className="space-y-1">
                {(selectedShipment.history || []).map((h: any) => (
                  <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/10">
                    <StatusBadge status={h.status} />
                    <span className="text-[9px] text-muted-foreground">{formatDateTime(h.createdAt)}</span>
                    {h.notes && <span className="text-[9px] text-muted-foreground">— {h.notes}</span>}
                  </div>
                ))}
                {(!selectedShipment.history || selectedShipment.history.length === 0) && (
                  <p className="text-[10px] text-muted-foreground">{t('shipments.no_history')}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setDeleteTarget(null); }}>
          <div className="p-6 rounded-2xl bg-card border shadow-xl max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black uppercase tracking-widest">{t('shipments.delete_title')}</h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-3">
              {t('shipments.delete_desc').replace('{destination}', deleteTarget.destination)}
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="destructive" className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest" onClick={handleDelete}>
                {t('shipments.delete')}
              </Button>
              <Button variant="outline" className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest" onClick={() => { setDeleteTarget(null); }}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shipments;
