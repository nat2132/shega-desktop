/**
 * Desktop "Create Your Business" onboarding — 8-step wizard mirroring the
 * Shega Mobile flow exactly:
 *
 *   1. Business information (name + optional profile image)
 *   2. Business type (predefined + Other → free text)
 *   3. Business location (city only — country is Ethiopia)
 *   4. Owner information (name, email, password)
 *   5. Date system (Ethiopian / Gregorian calendar)
 *   6. Sales tax (VAT / TOT / No tax)
 *   7. Multiple locations (Yes → configure warehouses)
 *   8. Team setup (nearby-device discovery over LAN/P2P + assign member
 *      name, profile picture, role and permissions)
 *
 * Persisted through the same settings keys the rest of the desktop app
 * reads, so the chosen configuration applies app-wide.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2, CalendarDays, Check, ChevronRight, ImagePlus, MapPin,
  Receipt, Search, Store, Trash2, Users, Warehouse,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import ApprovalConfig from '../JoinApprovalConfig';
import { RadarPulse } from '../RadarPulse';

interface BusinessSetupProps {
  onComplete: () => void;
}

const BUSINESS_TYPES = [
  { id: 'retail', label: 'Retail', emoji: '🛍️' },
  { id: 'grocery', label: 'Grocery', emoji: '🥬' },
  { id: 'pharmacy', label: 'Pharmacy', emoji: '💊' },
  { id: 'wholesale', label: 'Wholesale', emoji: '📦' },
  { id: 'distributor', label: 'Distributor', emoji: '🚚' },
  { id: 'electronics', label: 'Electronics', emoji: '🔌' },
  { id: 'clothing', label: 'Clothing', emoji: '👕' },
  { id: 'restaurant', label: 'Restaurant', emoji: '🍽️' },
  { id: 'other', label: 'Other', emoji: '🏪' },
];

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const BusinessSetup: React.FC<BusinessSetupProps> = ({ onComplete }) => {
  const { t, refreshBusiness, calendarType, setCalendarType } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [bizId, setBizId] = useState<number | null>(null);

  // Step 1 — business info
  const [businessName, setBusinessName] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  // Step 2 — type
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [businessTypeCustom, setBusinessTypeCustom] = useState('');
  // Step 3 — location
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  // Step 4 — owner
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  // Step 6 — tax
  const [taxMode, setTaxMode] = useState<'VAT' | 'TOT' | 'None'>('VAT');
  const [taxRate, setTaxRate] = useState('15');
  // Step 7 — locations
  const [multiLocation, setMultiLocation] = useState<boolean | null>(null);
  const [locations, setLocations] = useState<Array<{ name: string; city: string }>>([]);
  const [locName, setLocName] = useState('');
  const [locCity, setLocCity] = useState('');
  // Step 8 — team
  const [teamMode, setTeamMode] = useState<'now' | 'later' | null>(null);
  const [nearbyDevices, setNearbyDevices] = useState<Array<{ deviceId: string; deviceName: string; platform: string; role?: string; hasInvite: boolean; code?: string }>>([]);
  const [invite, setInvite] = useState<any | null>(null);
  const [selfName, setSelfName] = useState('This computer');
  const [configuringDevice, setConfiguringDevice] = useState<{ deviceId: string; deviceName: string; platform: string; code: string } | null>(null);

  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  const locationText = useMemo(
    () => [address.trim(), city.trim(), 'Ethiopia'].filter(Boolean).join(', '),
    [address, city],
  );

  const pickLogoFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { setLogo(String(reader.result || '')); setError(''); };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const next = () => { setError(''); setStep((s) => (s < 8 ? ((s + 1) as Step) : s)); };
  const back = () => { setError(''); setStep((s) => (s > 1 ? ((s - 1) as Step) : s)); };

  /** Create the business once (step 4 → 5) — idempotent on revisit. */
  const createNow = async (): Promise<number | null> => {
    if (bizId) return bizId;
    if (!businessName.trim()) { setError('Enter the business name'); return null; }
    if (!ownerName.trim() || !ownerPassword.trim()) { setError('Enter your name and a password'); return null; }
    setBusy(true);
    try {
      const created = await window.api.businessCreate({
        businessName: businessName.trim(),
        storeName: businessName.trim(),
        logo,
        address: locationText,
        email: ownerEmail.trim() || null,
        currency: 'ETB',
      });
      const id = created?.id ?? null;
      setBizId(id);
      // Shared business metadata (type / city / country) + owner identity.
      if (id) {
        await window.api.updateBusiness(id, {
          address: locationText,
          businessType: businessType === 'other' ? (businessTypeCustom.trim() || 'other') : businessType,
          country: 'Ethiopia',
          city: city.trim(),
        }).catch(() => {});
      }
      await window.api.setSetting('setup_business_type', businessType === 'other' ? (businessTypeCustom.trim() || 'other') : (businessType || ''));
      await window.api.setSetting('setup_business_city', city.trim());
      await window.api.setSetting('setup_business_country', 'Ethiopia');
      await window.api.setSetting('setup_owner_name', ownerName.trim());
      await window.api.setSetting('setup_owner_email', ownerEmail.trim());
      // Date system (step 5) is applied through SettingsContext on change.
      await refreshBusiness().catch(() => {});
      return id;
    } catch (e: any) {
      setError(e?.message || 'Could not create the business');
      return null;
    } finally {
      setBusy(false);
    }
  };

  // Step 8: automatic nearby-device discovery over LAN/P2P while the step is
  // open, plus a discoverable beacon advertising this business as an owner
  // so joiners can see this device by name even before any invite exists.
  useEffect(() => {
    if (step !== 8 || teamMode !== 'now' || !bizId) return;
    let stopped = false;
    void window.api?.pairBeaconDiscoverable?.(true, businessName, 'owner').catch(() => {});
    window.api?.deviceName?.().then((n) => { if (n) setSelfName(n); }).catch(() => {});
    const scan = async () => {
      try {
        const list = await window.api.pairBeaconNearby?.();
        if (!stopped && Array.isArray(list)) {
          setNearbyDevices(list.map((e: any) => ({
            deviceId: e.beacon?.owner?.deviceId || e.host || Math.random().toString(36).slice(2),
            deviceName: e.beacon?.owner?.deviceName || 'Nearby device',
            platform: e.beacon?.owner?.platform || 'desktop',
            role: e.beacon?.role,
            hasInvite: !!e.beacon?.code,
            code: e.beacon?.code || undefined,
          })));
        }
      } catch { /* discovery unavailable */ }
    };
    scan();
    const timer = setInterval(scan, 4000);
    return () => {
      stopped = true;
      clearInterval(timer);
      void window.api?.pairBeaconDiscoverable?.(false).catch(() => {});
    };
  }, [step, teamMode, bizId, businessName]);

  const generateInvite = async () => {
    if (!bizId) return null;
    try {
      const inv = await window.api.inviteCreate?.({ suggestedRole: 'cashier' });
      if (inv?.code) {
        await window.api.pairBeaconStart?.(inv).catch(() => {});
        setInvite(inv);
        return inv;
      }
    } catch { /* invites unavailable */ }
    return null;
  };

  const finish = async () => {
    setBusy(true);
    try {
      // Tax configuration (step 6) — the app-wide sale tax behavior.
      const settings = await window.api.getSetting?.('app_settings');
      const merged = { ...(typeof settings === 'object' && settings ? settings : {}) };
      merged.taxEnabled = taxMode !== 'None';
      merged.taxRate = taxMode === 'None' ? 0 : (parseFloat(taxRate) || (taxMode === 'TOT' ? 2 : 15));
      merged.taxMode = taxMode;
      merged.calendarType;
      await window.api.setSetting('app_settings', merged);
      await window.api.setSetting('sale_tax_mode', taxMode);
      // Multiple locations (step 7): create the configured warehouses.
      if (multiLocation === true) {
        for (const loc of locations) {
          await window.api.businessAddLocation?.(loc.name, [loc.city, 'Ethiopia'].filter(Boolean).join(', ')).catch(() => {});
        }
      }
      await refreshBusiness().catch(() => {});
    } catch { /* best-effort persistence */ }
    onComplete();
  };

  const card = 'w-full text-left p-4 rounded-xl border-2 border-transparent bg-white/5 hover:bg-white/10 transition-all';
  const cardActive = 'w-full text-left p-4 rounded-xl border-2 border-emerald-500/60 bg-emerald-500/5 transition-all';
  const inputCls = 'w-full bg-white/5 rounded-2xl text-sm px-6 py-4 font-bold border-2 border-transparent focus:border-white/20 transition-all outline-none text-white placeholder:text-white/15';
  const labelCls = 'text-xs font-black uppercase tracking-widest text-white/30 px-1';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto" style={{ background: '#0B0705' }}>
      <div className={`w-full max-w-2xl px-10 py-12 relative z-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-7 w-7 text-white/40" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">{t('setup.header')}</h2>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white/30 mt-2">Step {step} of 8</p>
          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className={`h-1 rounded-full transition-all ${i < step ? 'bg-white w-6' : 'bg-white/15 w-3'}`} />
            ))}
          </div>
        </div>

        {/* ── Step 1: Business information ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <button type="button" onClick={pickLogoFile}
                className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 grid place-items-center bg-white/5 hover:bg-white/10 transition-all shrink-0">
                {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-white/40" />}
              </button>
              <div className="flex-1 space-y-1.5">
                <label className={labelCls}>{t('setup.legal_name')}</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                  className={inputCls} placeholder="e.g. Natoli Electronics" autoFocus />
                <p className="text-[11px] font-bold text-white/30 px-1">Tap the square to add a business image (optional).</p>
              </div>
            </div>
            <ContinueBtn disabled={!businessName.trim()} onClick={next} />
          </div>
        )}

        {/* ── Step 2: Business type ── */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-center text-lg font-black text-white">What type of business do you run?</p>
            <div className="grid grid-cols-3 gap-2.5">
              {BUSINESS_TYPES.map((bt) => (
                <button key={bt.id} type="button" onClick={() => setBusinessType(bt.id)}
                  className={`${businessType === bt.id ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-transparent bg-white/5 hover:bg-white/10'} rounded-xl border-2 p-4 text-center transition-all`}>
                  <span className="text-2xl block">{bt.emoji}</span>
                  <span className="text-xs font-black text-white mt-1 block">{bt.label}</span>
                </button>
              ))}
            </div>
            {businessType === 'other' && (
              <input type="text" value={businessTypeCustom} onChange={(e) => setBusinessTypeCustom(e.target.value)}
                className={inputCls} placeholder="Describe your business type (e.g. Auto Garage)" />
            )}
            <ContinueBtn onClick={next} onBack={back} />
          </div>
        )}

        {/* ── Step 3: Business location (city only, Ethiopia) ── */}
        {step === 3 && (
          <div className="space-y-5">
            <p className="text-center text-lg font-black text-white">Where is your business located?</p>
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white">🇪🇹 Ethiopia</span>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                className={inputCls} placeholder="City (e.g. Addis Ababa)" />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Street address (optional)</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                className={inputCls} placeholder="Street / landmark" />
            </div>
            <ContinueBtn onClick={next} onBack={back} />
          </div>
        )}

        {/* ── Step 4: Owner information ── */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-center text-lg font-black text-white">Owner information</p>
            <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={inputCls} placeholder="Your full name (e.g. Abebe Kebede)" />
            <input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} className={inputCls} placeholder="Email" />
            <input type="password" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} className={inputCls} placeholder="Password (min 4 characters)" />
            {!!error && <p className="text-xs font-bold text-red-400 text-center">{error}</p>}
            <button type="button" disabled={busy}
              onClick={() => createNow().then((id) => { if (id) next(); })}
              className="w-full py-5 bg-white text-[#0B0705] rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50">
              {busy ? 'Creating…' : 'Create Business & Continue'}
            </button>
            <button type="button" onClick={back} className="w-full text-xs font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors py-2">Back</button>
          </div>
        )}

        {/* ── Step 5: Date system ── */}
        {step === 5 && (
          <div className="space-y-4">
            <p className="text-center text-lg font-black text-white">Choose your date system</p>
            {(['ethiopian', 'gregorian'] as const).map((c) => (
              <button key={c} type="button" onClick={() => setCalendarType(c)}
                className={`${calendarType === c ? cardActive : card} flex items-center gap-3`}>
                <CalendarDays className="h-4 w-4 text-white/50" />
                <span className="flex-1 text-sm font-black text-white">{c === 'ethiopian' ? 'Ethiopian Calendar' : 'Gregorian Calendar'}</span>
                {calendarType === c && <Check className="h-4 w-4 text-emerald-400" />}
              </button>
            ))}
            <ContinueBtn onClick={next} onBack={back} />
          </div>
        )}

        {/* ── Step 6: Sales tax ── */}
        {step === 6 && (
          <div className="space-y-4">
            <p className="text-center text-lg font-black text-white">Do you charge tax on your sales?</p>
            {([
              { id: 'VAT', label: 'VAT', sub: 'Value Added Tax — added to every sale (default 15%)' },
              { id: 'TOT', label: 'TOT', sub: 'Turnover Tax — a flat 2% on monthly turnover' },
              { id: 'None', label: 'No Tax', sub: "Don't charge tax on sales" },
            ] as const).map((o) => (
              <button key={o.id} type="button"
                onClick={() => { setTaxMode(o.id); if (o.id === 'TOT') setTaxRate('2'); if (o.id === 'VAT' && taxRate === '2') setTaxRate('15'); }}
                className={`${taxMode === o.id ? cardActive : card} flex items-center gap-3`}>
                <Receipt className="h-4 w-4 text-white/50" />
                <span className="flex-1">
                  <span className="block text-sm font-black text-white">{o.label}</span>
                  <span className="block text-xs font-bold text-white/40">{o.sub}</span>
                </span>
                {taxMode === o.id && <Check className="h-4 w-4 text-emerald-400" />}
              </button>
            ))}
            {taxMode !== 'None' && (
              <input type="text" value={taxRate} onChange={(e) => setTaxRate(e.target.value.replace(/[^\d.]/g, ''))}
                className={inputCls} placeholder={`${taxMode} rate (%)`} />
            )}
            <ContinueBtn onClick={next} onBack={back} />
          </div>
        )}

        {/* ── Step 7: Multiple locations ── */}
        {step === 7 && (
          <div className="space-y-4">
            <p className="text-center text-lg font-black text-white">Do you have multiple business locations?</p>
            <button type="button" onClick={() => setMultiLocation(true)} className={`${multiLocation === true ? cardActive : card} flex items-center gap-3`}>
              <Warehouse className="h-4 w-4 text-white/50" />
              <span className="flex-1 text-left">
                <span className="block text-sm font-black text-white">Yes</span>
                <span className="block text-xs font-bold text-white/40">Add and configure your warehouses/branches</span>
              </span>
              {multiLocation === true && <Check className="h-4 w-4 text-emerald-400" />}
            </button>
            <button type="button" onClick={() => setMultiLocation(false)} className={`${multiLocation === false ? cardActive : card} flex items-center gap-3`}>
              <Store className="h-4 w-4 text-white/50" />
              <span className="flex-1 text-left">
                <span className="block text-sm font-black text-white">No</span>
                <span className="block text-xs font-bold text-white/40">Just one location</span>
              </span>
              {multiLocation === false && <Check className="h-4 w-4 text-emerald-400" />}
            </button>
            {multiLocation === true && (
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
                {locations.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm font-bold text-white">
                    <MapPin className="h-3.5 w-3.5 text-white/40" />
                    <span className="flex-1">{l.name}{l.city ? ` — ${l.city}` : ''}</span>
                    <button type="button" onClick={() => setLocations((ls) => ls.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input type="text" value={locName} onChange={(e) => setLocName(e.target.value)} className={inputCls} placeholder="Location name (e.g. Bole Branch)" />
                  <input type="text" value={locCity} onChange={(e) => setLocCity(e.target.value)} className={inputCls} placeholder="City (optional)" />
                </div>
                <button type="button" onClick={() => { if (!locName.trim()) return; setLocations((ls) => [...ls, { name: locName.trim(), city: locCity.trim() }]); setLocName(''); setLocCity(''); }}
                  className="w-full py-3 rounded-xl border border-white/15 text-xs font-black uppercase tracking-widest text-white/70 hover:bg-white/10 transition-all">
                  + Add this location
                </button>
              </div>
            )}
            <ContinueBtn onClick={next} onBack={back} />
          </div>
        )}

        {/* ── Step 8: Team setup ── */}
        {step === 8 && (
          <div className="space-y-4">
            <p className="text-center text-lg font-black text-white">Set up your team</p>
            <p className="text-center text-xs font-bold text-white/40 -mt-2">
              Nearby devices running Shega appear automatically over LAN/P2P. Tap one to invite it with a name, photo, role and permissions.
            </p>
            {teamMode === null && (
              <>
                <button type="button" onClick={() => { setTeamMode('now'); generateInvite(); }} className={`${card} flex items-center gap-3`}>
                  <Users className="h-4 w-4 text-white/50" />
                  <span className="flex-1 text-left text-sm font-black text-white">Set up my team now</span>
                </button>
                <button type="button" onClick={() => { setTeamMode('later'); }} className={`${card} flex items-center gap-3`}>
                  <span className="flex-1 text-left text-sm font-black text-white/60">Do this later</span>
                </button>
              </>
            )}
            {teamMode === 'now' && (
              <>
                {/* Discovery radar — no QR and no invite code are shown. */}
                <RadarPulse
                  deviceName={selfName}
                  status={nearbyDevices.length > 0 ? `${nearbyDevices.length} device${nearbyDevices.length === 1 ? '' : 's'} found` : 'Searching for nearby devices…'}
                  tone={nearbyDevices.length > 0 ? 'found' : 'searching'}
                  compact
                  peers={nearbyDevices.map((d) => ({
                    id: d.deviceId,
                    name: d.deviceName,
                    platform: d.platform,
                    detail: `${d.role === 'owner' ? 'Owner' : 'Team'} · ${d.hasInvite ? 'tap to invite' : 'no open invite yet'}`,
                    disabled: !(d.hasInvite && d.code),
                  }))}
                  onPickPeer={(p) => {
                    const d = nearbyDevices.find((x) => x.deviceId === p.id);
                    if (d?.hasInvite && d.code) {
                      setConfiguringDevice({ deviceId: d.deviceId, deviceName: d.deviceName, platform: d.platform, code: d.code });
                    }
                  }}
                  emptyHint="Keep both devices on the same Wi-Fi with Shega open."
                />
                <button type="button" onClick={() => generateInvite()} className="w-full py-3 rounded-xl border border-white/15 text-xs font-black uppercase tracking-widest text-white/70 hover:bg-white/10 transition-all">
                  Scan again
                </button>
              </>
            )}
            {!!error && <p className="text-xs font-bold text-red-400 text-center">{error}</p>}
            <button type="button" disabled={busy} onClick={finish}
              className="w-full py-5 bg-white text-[#0B0705] rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50">
              Start Using Shega
            </button>
            <button type="button" onClick={back} className="w-full text-xs font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors py-2">Back</button>
          </div>
        )}

        {/* Member configuration (name / photo / role / permissions) for the selected device */}
        {configuringDevice && (
          <div className="fixed inset-0 z-[210] bg-black/60 grid place-items-center p-8" onClick={() => setConfiguringDevice(null)}>
            <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-[#14100c] border border-white/10 p-6" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm font-black text-white mb-3">Invite {configuringDevice.deviceName}</p>
              <ApprovalConfig
                applicantName={configuringDevice.deviceName}
                busy={false}
                onConfirm={async (cfg) => {
                  const target = configuringDevice;
                  setConfiguringDevice(null);
                  try {
                    const inv = invite?.code ? invite : await generateInvite();
                    if (!inv?.code) { setError('Could not create the invite'); return; }
                    // Stage the assigned identity so the joining device is
                    // provisioned with the exact name/avatar/role/permissions.
                    await window.api.setSetting(`join_cfg_${inv.code}`, JSON.stringify({
                      deviceId: target.deviceId, name: cfg.name, avatar: cfg.avatar,
                      role: cfg.role, permissions: cfg.permissions,
                    }));
                    await window.api.pairBeaconStart?.(inv).catch(() => {});
                    setInvite(inv);
                  } catch { /* best-effort */ }
                }}
                onDecline={() => setConfiguringDevice(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ContinueBtn: React.FC<{ onClick: () => void; onBack?: () => void; disabled?: boolean }> = ({ onClick, onBack, disabled }) => (
  <>
    <button type="button" onClick={onClick} disabled={disabled}
      className="w-full py-5 bg-white text-[#0B0705] rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2">
      Continue <ChevronRight className="h-4 w-4" />
    </button>
    {onBack && (
      <button type="button" onClick={onBack}
        className="w-full text-xs font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors py-2">
        Back
      </button>
    )}
  </>
);

export default BusinessSetup;
