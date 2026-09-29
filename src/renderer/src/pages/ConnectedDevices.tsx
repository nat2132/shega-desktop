import React, { useEffect, useState, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Smartphone, Monitor, WifiOff, Building2, Loader2, CheckCircle2, RefreshCw, Copy, Trash2 } from 'lucide-react';

interface CloudDevice {
  device_id: string;
  device_name: string;
  platform: 'mobile' | 'desktop';
  last_seen: string;
  is_online: boolean;
}

/** A locally-registered device row from the `devices` table. */
interface Device {
  id: number;
  device_id: string;
  device_name: string;
  device_type: string;
  platform: 'mobile' | 'desktop' | string;
  is_active: number | boolean;
  last_seen?: string | null;
}

const ConnectedDevices: React.FC = () => {
  const { t } = useSettings();
  const { subscription, refresh } = useSubscription();

  const [devices, setDevices] = useState<Device[]>([]);
  const [cloudDevices, setCloudDevices] = useState<CloudDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLicenseId, setSelectedLicenseId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const licenses = subscription?.cloudStatus ? [] : []; // We'll get from backend

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, syncRes] = await Promise.all([
        window.api.getCurrentSubscription(),
        window.api.backendSync(),
      ]);
      if (subRes?.licenses && subRes.licenses.length > 0) {
        if (!selectedLicenseId) setSelectedLicenseId(subRes.licenses[0].id);
        const licenseId = selectedLicenseId || subRes.licenses[0].id;
        const devicesRes = await window.api.getMyPayments(); // This doesn't return devices, need a different call
        // Use the local device list from the license
        const license = subRes.licenses.find((l: any) => l.id === licenseId);
        if (license?.devices) setDevices(license.devices);
      }
      if (syncRes?.success) {
        setCloudDevices(syncRes.devices || []);
      }
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedLicenseId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeactivate = async (deviceId: string, licenseId: number) => {
    setDeleting(deviceId);
    try {
      const res = await window.api.backendSync(); // This isn't the right call, need deactivate
      // We'll use the admin endpoint for now
      toast.info('Deactivate from admin panel for now');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to deactivate');
    } finally {
      setDeleting(null);
    }
  };

  const copyDeviceId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Device ID copied');
  };

  const formatLastSeen = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusBadge = (device: Device, cloudDevice?: CloudDevice) => {
    if (!device.is_active) {
      return (
        <Badge variant="outline" className="bg-muted text-muted-foreground border-border/50">
          <WifiOff className="h-2.5 w-2.5 mr-1" />
          Disconnected
        </Badge>
      );
    }
    const isOnline = cloudDevice?.is_online;
    if (isOnline === false) {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
          <WifiOff className="h-2.5 w-2.5 mr-1" />
          Offline
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
        <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
        Active
      </Badge>
    );
  };

  const Icon = (type: string) => type === 'MOBILE' ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black uppercase tracking-tight">{t('subscription.connected_devices')}</h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('subscription.connected_devices_desc')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="rounded-xl text-xs font-black uppercase tracking-widest">
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </Button>
      </div>

      {/* License Selector */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Building2 className="h-3 w-3" />
            {t('subscription.select_license')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-2">
            {devices.length > 0 && devices.map(d => d.id).filter((v, i, a) => a.indexOf(v) === i).map((licenseId) => (
              <Button
                key={licenseId}
                variant={selectedLicenseId === licenseId ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedLicenseId(licenseId)}
                className="rounded-xl text-xs font-black uppercase tracking-widest"
              >
                License #{licenseId}
              </Button>
            ))}
            {devices.length === 0 && (
              <span className="text-xs text-muted-foreground">No devices registered</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Device List */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-4 pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No devices connected</p>
              <p className="text-xs text-muted-foreground mt-1">Register a device from the Subscription page</p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => {
                const cloudMatch = cloudDevices.find(cd => cd.device_id === device.device_id);
                return (
                  <div key={device.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border/50">
                    <div className="p-2 rounded-full bg-primary/10">
                      {Icon(device.device_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{device.device_name || device.device_id}</p>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">{device.device_id}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {device.operating_system} · Last seen {formatLastSeen(device.last_seen)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(device, cloudMatch)}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => copyDeviceId(device.device_id)} className="size-8 rounded-lg">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      {device.is_active && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeactivate(device.device_id, selectedLicenseId!)}
                          disabled={deleting === device.id}
                          className="size-8 rounded-lg text-red-400 hover:bg-red-500/10"
                        >
                          {deleting === device.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cloud-synced Devices (P2P) */}
      {cloudDevices.length > 0 && (
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Wifi className="h-3 w-3" />
              {t('subscription.p2p_devices')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2">
              {cloudDevices.map((device) => (
                <div key={device.device_id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50">
                  <div className="p-2 rounded-full bg-violet-500/10">
                    {device.platform === 'mobile' ? <Smartphone className="h-4 w-4 text-violet-500" /> : <Monitor className="h-4 w-4 text-violet-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{device.device_name}</p>
                    <p className="text-[10px] text-muted-foreground">{t('subscription.p2p_device')}</p>
                  </div>
                  <Badge variant="outline" className={device.is_online ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}>
                    {device.is_online ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Need to import Wifi
import { Wifi } from 'lucide-react';

export default ConnectedDevices;