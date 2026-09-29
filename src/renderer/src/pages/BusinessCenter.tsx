import React, { useEffect, useState, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import {
  Store as RegisterIcon, MapPin, Smartphone, Plus, Edit2, Trash2,
  Lock, Unlock, Pencil, LayoutDashboard, CircleDollarSign, Coins,
  PackageSearch, Users, RefreshCw, CheckCircle2, Wallet, ShoppingCart,
  TrendingUp, Building2, Check, Star, Archive, QrCode, Link2, UserPlus,
  KeyRound, Ban, Power, Clock,
  XCircle, AlertCircle, Building, Loader2, ArrowRight
} from 'lucide-react';
import type { Business } from '@shega/shared';
import Modal from '../components/Modal';
import ApprovalConfig from '../components/JoinApprovalConfig';

interface CloudBusiness {
  id: number;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string | null;
}

const BusinessCenter: React.FC = () => {
  const { t } = useSettings();
  const { subscription, refresh } = useSubscription();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [cloudBusinesses, setCloudBusinesses] = useState<CloudBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState<number | null>(null);
  const [newBusinessName, setNewBusinessName] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [localRes, syncRes] = await Promise.all([
        window.api.getBusinessList?.(),
        window.api.backendSync(),
      ]);
      if (localRes) setBusinesses(localRes);
      if (syncRes?.success) {
        setCloudBusinesses(syncRes.businesses || []);
      }
    } catch (err) {
      console.error('Failed to load businesses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSwitch = async (businessId: number) => {
    setSwitching(businessId);
    try {
      const res = await window.api.switchBusiness(businessId);
      if (res) {
        toast.success('Switched business');
        await refresh();
        await loadData();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to switch');
    } finally {
      setSwitching(null);
    }
  };

  const handleCreateLocal = async () => {
    if (!newBusinessName.trim()) { toast.error('Enter a business name'); return; }
    setCreating(true);
    try {
      const res = await window.api.createBusiness({ businessName: newBusinessName.trim() });
      if (res) {
        toast.success('Business created locally');
        setNewBusinessName('');
        await loadData();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateCloud = async () => {
    // `licenseId`, not `planId`: the backend resolves this path against the
    // license table, so passing the plan id 404s on a linked account.
    const licenseId = subscription?.licenseId ?? null;
    if (!licenseId) { toast.error('No active license'); return; }
    if (!newBusinessName.trim()) { toast.error('Enter a business name'); return; }
    setCreating(true);
    try {
      const res = await window.api.backendCreateBusiness({
        licenseId,
        name: newBusinessName.trim(),
        idempotency_key: `business-${licenseId}-${newBusinessName}-${Date.now()}`,
      });
      if (res?.success) {
        toast.success('Business creation requested (pending approval)');
        setNewBusinessName('');
        await refresh();
        await loadData();
      } else {
        toast.error(res?.error || 'Failed to request');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to request');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (b: CloudBusiness) => {
    switch (b.status) {
      case 'approved':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
            {t('subscription.approved')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-2.5 w-2.5 mr-1" />
            {t('subscription.rejected')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            <AlertCircle className="h-2.5 w-2.5 mr-1" />
            {t('subscription.pending_approval')}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black uppercase tracking-tight">{t('subscription.business_center')}</h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('subscription.business_center_desc')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="rounded-xl text-xs font-black uppercase tracking-widest">
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </Button>
      </div>

      {/* Local Businesses */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Building className="h-3 w-3" />
            {t('subscription.local_businesses')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-4">
              <Building className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No local businesses</p>
            </div>
          ) : (
            <div className="space-y-2">
              {businesses.map((biz) => (
                <div key={biz.id} className={`flex items-center justify-between p-3 rounded-xl border ${
                  biz.isActive ? 'border-primary/20 bg-primary/5' : 'border-border/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{biz.businessName}</p>
                      <p className="text-[11px] text-muted-foreground">{biz.storeName}</p>
                      <p className="text-[10px] text-muted-foreground">Created {new Date(biz.createdAt).toLocaleDateString()}</p>
                    </div>
                    {biz.isDefault && (
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border-primary/20">
                        {t('subscription.default')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!biz.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSwitch(biz.id)}
                        disabled={switching === biz.id}
                        className="rounded-xl text-xs font-black uppercase tracking-widest"
                      >
                        {switching === biz.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <ArrowRight className="h-3 w-3 mr-1" />
                            {t('subscription.switch')}
                          </>
                        )}
                      </Button>
                    )} else {
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        {t('subscription.active')}
                      </Badge>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cloud Businesses (Pending/Approved) */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Building2 className="h-3 w-3" />
            {t('subscription.cloud_businesses')}
          </CardTitle>
          <CardDescription className="text-xs">
            {t('subscription.cloud_businesses_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {cloudBusinesses.length === 0 ? (
            <div className="text-center py-4">
              <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No cloud business requests</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cloudBusinesses.map((biz) => (
                <div key={biz.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border/50">
                  <div className="p-2 rounded-full bg-violet-500/10">
                    <Building2 className="h-4 w-4 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{biz.name}</p>
                    <p className="text-[11px] text-muted-foreground">Requested {new Date(biz.created_at).toLocaleDateString()}</p>
                    {biz.reviewed_at && (
                      <p className="text-[10px] text-muted-foreground">
                        Reviewed {new Date(biz.reviewed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(biz)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New Business */}
      <Card className="rounded-2xl border-primary/20 bg-primary/5">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
            <Plus className="h-3 w-3" />
            {t('subscription.create_new_business')}
          </CardTitle>
          <CardDescription className="text-xs">{t('subscription.create_new_business_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={newBusinessName}
              onChange={e => setNewBusinessName(e.target.value)}
              placeholder={t('subscription.business_name_placeholder')}
              className="flex-1 text-xs"
            />
            <Button
              onClick={handleCreateLocal}
              disabled={creating || !newBusinessName.trim()}
              className="rounded-xl text-xs font-black uppercase tracking-widest"
            >
              {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : t('subscription.create_local')}
            </Button>
          </div>
          {subscription?.cloudStatus && (
            <div className="flex items-center gap-2">
              <Input
                value={newBusinessName}
                onChange={e => setNewBusinessName(e.target.value)}
                placeholder={t('subscription.business_name_placeholder')}
                className="flex-1 text-xs"
              />
              <Button
                variant="outline"
                onClick={handleCreateCloud}
                disabled={creating || !newBusinessName.trim() || !subscription.licenseId}
                className="rounded-xl text-xs font-black uppercase tracking-widest"
              >
                {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : t('subscription.request_cloud')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessCenter;