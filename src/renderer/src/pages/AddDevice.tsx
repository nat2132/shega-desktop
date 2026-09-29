import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Smartphone, Monitor, Loader2, CheckCircle, XCircle, AlertCircle, Copy, Check, Server } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

import { toast } from 'sonner';
import PremiumBadge from '../components/PremiumBadge';

interface License {
  id: number;
  license_key: string;
  max_mobile_devices: number;
  max_desktop_devices: number;
  plan: { name: string; edition?: string } | null;
}

interface CloudStatus {
  plan_id?: number | null;
  devices?: {
    mobile?: { allocated?: number; used?: number };
    desktop?: { allocated?: number; used?: number };
  };
}

type DeviceType = 'MOBILE' | 'DESKTOP';

const AddDevice: React.FC = () => {
  const { t } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const { subscription, refresh } = useSubscription();

  const [licenses, setLicenses] = useState<License[]>([]);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [deviceType, setDeviceType] = useState<DeviceType>('MOBILE');
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [operatingSystem, setOperatingSystem] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'idle' | 'checking' | 'pending' | 'approved' | 'rejected' | 'error'>('idle');
  const [entitlementInfo, setEntitlementInfo] = useState<any>(null);
  const [generatedDeviceId, setGeneratedDeviceId] = useState('');

  const handleBack = () => {
    if (location.state?.onComplete) {
      location.state.onComplete();
    } else {
      navigate('/subscription', { replace: true });
    }
  };

  const loadLicenses = useCallback(async () => {
    try {
      const res = await window.api.getCurrentSubscription();
      if (res?.licenses) setLicenses(res.licenses);
    } catch (_) { /* ignore */ }
  }, []);

  useEffect(() => { loadLicenses(); }, [loadLicenses]);

  useEffect(() => {
    if (!subscription?.cloudStatus) return;
    const checkCloud = async () => {
      try {
        const syncRes = await window.api.backendSync();
        if (syncRes?.success) setCloudStatus(syncRes.status || null);
      } catch (_) { /* ignore */ }
    };
    checkCloud();
  }, [subscription?.cloudStatus]);

  const checkEntitlement = async () => {
    if (!selectedLicense) return;
    setStatus('checking');
    try {
      const res = await window.api.backendDeviceEntitlements({ licenseId: selectedLicense.id });
      if (res?.success) {
        const entitlements = res.entitlements || [];
        const matching = entitlements.filter((e: any) => e.device_type === deviceType && e.status === 'available');
        if (matching.length > 0) {
          const totalAvailable = matching.reduce((sum: number, e: any) => sum + e.quantity, 0);
          setEntitlementInfo({ available: totalAvailable, entitlements: matching });
          setStatus('idle');
        } else {
          setEntitlementInfo({ available: 0, entitlements: [] });
          setStatus('idle');
        }
      }
    } catch (_) {
      setStatus('error');
    }
  };

  useEffect(() => {
    if (selectedLicense && deviceType) {
      checkEntitlement();
    }
  }, [selectedLicense, deviceType]);

  const generateDeviceId = () => {
    const prefix = deviceType === 'MOBILE' ? 'MOB' : 'DSK';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const id = `${prefix}-${timestamp}-${random}`;
    setGeneratedDeviceId(id);
    setDeviceId(id);
    toast.success('Device ID generated. You can edit it if needed.');
  };

  const copyDeviceId = () => {
    navigator.clipboard.writeText(deviceId || generatedDeviceId);
    toast.success('Device ID copied');
  };

  const handleSubmit = async () => {
    if (!selectedLicense) { toast.error('Select a license first'); return; }
    if (!deviceId.trim()) { toast.error('Enter or generate a Device ID'); return; }

    const entitlement = entitlementInfo?.available ?? 0;
    if (entitlement <= 0) {
      toast.error(`No available ${deviceType} device entitlement. Purchase an add-on first.`);
      return;
    }

    setBusy(true);
    try {
      const idempotencyKey = `device-${selectedLicense.id}-${deviceId}-${Date.now()}`;
      const res = await window.api.backendRegisterDevice({
        licenseId: selectedLicense.id,
        device_id: deviceId.trim(),
        device_name: deviceName.trim() || `Shega ${deviceType}`,
        operating_system: operatingSystem.trim() || navigator.platform,
        device_type: deviceType,
        idempotency_key: idempotencyKey,
      });
      if (res?.success) {
        toast.success('Device registered successfully!');
        setStatus('approved');
        await refresh();
        await loadLicenses();
        setDeviceId('');
        setDeviceName('');
        setOperatingSystem('');
        setGeneratedDeviceId('');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('rejected');
        toast.error(res?.error || 'Registration failed');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (err: any) {
      setStatus('rejected');
      toast.error(err?.message || 'Registration failed');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setBusy(false);
    }
  };

  // Match on the License row id. This used to compare against `planId`, which is
  // a *Plan* id, so the match essentially never hit and the first license in the
  // list was used regardless — registering against the wrong license.
  const currentLicense = licenses.find(l => l.id === subscription?.licenseId) || licenses[0];

  return (
    <div className="w-full h-full min-h-full overflow-y-auto space-y-6 p-6 max-w-2xl mx-auto pb-24">
      <button onClick={handleBack} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('common.go_back')}
      </button>

      <div>
        <h1 className="text-lg font-black uppercase tracking-tight">{t('subscription.add_device')}</h1>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('subscription.add_device_desc')}</p>
      </div>

      <Card className="rounded-2xl border-border/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Server className="h-3 w-3" />
            {t('subscription.select_license')}
          </CardTitle>
          <CardDescription className="text-xs">{t('subscription.select_license_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-3">
            {licenses.map((license) => (
              <button
                key={license.id}
                onClick={() => setSelectedLicense(license)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  selectedLicense?.id === license.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border/50 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-widest">
                    {license.plan?.name || license.plan?.edition || 'License'}
                  </span>
                  {license.plan?.edition && <PremiumBadge size="sm" />}
                </div>
                <p className="text-[11px] font-mono text-muted-foreground">{license.license_key}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Mobile: {license.max_mobile_devices} · Desktop: {license.max_desktop_devices}
                </p>
              </button>
            ))}
            {licenses.length === 0 && (
              <div className="col-span-2 text-center py-4 text-xs text-muted-foreground">
                No licenses found. Link your Shega account on the Subscription page.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Smartphone className="h-3 w-3" />
            {t('subscription.device_type')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDeviceType('MOBILE')}
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                deviceType === 'MOBILE' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'
              }`}
            >
              <Smartphone className="h-6 w-6" />
              <span className="text-xs font-black uppercase tracking-wide">{t('subscription.mobile_device')}</span>
            </button>
            <button
              onClick={() => setDeviceType('DESKTOP')}
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                deviceType === 'DESKTOP' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'
              }`}
            >
              <Monitor className="h-6 w-6" />
              <span className="text-xs font-black uppercase tracking-wide">{t('subscription.desktop_device')}</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {selectedLicense && (
        <>
          <Card className={`rounded-2xl ${
            status === 'checking' ? 'border-blue-500/30 bg-blue-500/5' :
            status === 'idle' && entitlementInfo?.available > 0 ? 'border-emerald-500/30 bg-emerald-500/5' :
            'border-amber-500/30 bg-amber-500/5'
          }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {status === 'checking' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
              {status === 'idle' && entitlementInfo?.available > 0 && <CheckCircle className="h-5 w-5 text-emerald-500" />}
              {status === 'idle' && entitlementInfo?.available === 0 && <AlertCircle className="h-5 w-5 text-amber-500" />}
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-wide">
                  {status === 'checking' ? t('subscription.checking_entitlement') :
                   entitlementInfo?.available > 0 ? t('subscription.entitlement_available') :
                   t('subscription.no_entitlement')}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {entitlementInfo?.available > 0
                    ? `${entitlementInfo.available} ${deviceType} device slot${entitlementInfo.available > 1 ? 's' : ''} available`
                    : 'Purchase an add-on on the Subscription page to unlock device registration.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Copy className="h-3 w-3" />
              {t('subscription.device_details')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="flex items-center gap-2">
              <label className="w-24 text-xs font-black uppercase tracking-wide text-muted-foreground">{t('subscription.device_id')}</label>
            <Input
              value={deviceId}
              onChange={e => setDeviceId(e.target.value)}
              placeholder={t('subscription.device_id_placeholder')}
              className="flex-1 font-mono text-sm"
            />
            <Button variant="outline" size="icon" onClick={generateDeviceId} className="size-8 rounded-lg">
              <Loader2 className="h-3.5 w-3.5" />
            </Button>
            {deviceId && (
              <Button variant="ghost" size="icon" onClick={copyDeviceId} className="size-8 rounded-lg">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs font-black uppercase tracking-wide text-muted-foreground">{t('subscription.device_name')}</label>
            <Input
              value={deviceName}
              onChange={e => setDeviceName(e.target.value)}
              placeholder={t('subscription.device_name_placeholder')}
              className="flex-1 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs font-black uppercase tracking-wide text-muted-foreground">{t('subscription.os')}</label>
            <Input
              value={operatingSystem}
              onChange={e => setOperatingSystem(e.target.value)}
              placeholder={navigator.platform}
              className="flex-1 text-xs"
            />
          </div>
        </CardContent>
      </Card>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={busy || !selectedLicense || entitlementInfo?.available === 0 || status === 'checking'}
          className="w-full rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
        >
          {busy ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              {t('subscription.registering')}
            </>
          ) : status === 'approved' ? (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              {t('subscription.registered')}
            </>
          ) : (
            <>
              <Check className="h-3 w-3 mr-1" />
              {t('subscription.register_device')}
            </>
          )}
        </Button>

        {/* Status Result */}
        {status === 'rejected' && (
          <Card className="rounded-2xl border-red-500/30 bg-red-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="h-4 w-4" />
                <p className="text-xs font-black uppercase tracking-wide">Registration Failed</p>
              </div>
            </CardContent>
          </Card>
        )}

        {status === 'approved' && (
          <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                <p className="text-xs font-black uppercase tracking-wide">Device Registered Successfully</p>
              </div>
              <p className="text-xs text-emerald-200 mt-1">The device can now sign in with the license key.</p>
            </CardContent>
          </Card>
        )}
        </>

      )}

      {(!selectedLicense || status === 'rejected' || status === 'approved') && (
        <Card className="rounded-2xl border-red-500/30 bg-red-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-wide">Registration Failed</p>
            </div>
          </CardContent>
        </Card>
      )}

      {status === 'approved' && (
        <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-wide">Device Registered Successfully</p>
            </div>
            <p className="text-xs text-emerald-200 mt-1">The device can now sign in with the license key.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddDevice;