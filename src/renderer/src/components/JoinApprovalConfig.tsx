/**
 * Owner-side join approval configuration.
 *
 * When a device requests to join the business, the owner assigns the member:
 *   • a display name and optional profile picture (image file → data URI)
 *   • a role: Owner, Cashier, or Custom
 *   • for Custom: a custom role name plus individual permissions from the
 *     shared PERMISSION_CATALOG (same catalog as Mobile)
 *
 * Confirming sends the full configuration with the approval so the joiner is
 * provisioned with the assigned identity, role and permissions.
 */

import React, { useMemo, useRef, useState } from 'react';
import { ImagePlus, Search, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  PERMISSION_CATALOG,
  SCOPE_LABELS,
} from '@shega/shared';

export interface JoinApprovalConfig {
  name: string;
  avatar: string | null;
  role: string;
  permissions?: Record<string, unknown>;
}

interface Props {
  applicantName: string;
  busy: boolean;
  onConfirm: (cfg: JoinApprovalConfig) => void;
  onDecline: () => void;
}

type RoleKind = 'cashier' | 'owner' | 'custom';

const ApprovalConfig: React.FC<Props> = ({ applicantName, busy, onConfirm, onDecline }) => {
  const [name, setName] = useState(applicantName || '');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [roleKind, setRoleKind] = useState<RoleKind>('cashier');
  const [customRoleName, setCustomRoleName] = useState('');
  const [permSearch, setPermSearch] = useState('');
  const [permPicks, setPermPicks] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = permSearch.trim().toLowerCase();
    if (!q) return PERMISSION_CATALOG;
    return PERMISSION_CATALOG.filter(
      (p) => p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q) || p.scope.includes(q),
    );
  }, [permSearch]);

  const grouped = useMemo(() => {
    const g = new Map<string, typeof PERMISSION_CATALOG>();
    for (const p of filtered) {
      const list = g.get(p.scope) || [];
      list.push(p);
      g.set(p.scope, list);
    }
    return Array.from(g.entries());
  }, [filtered]);

  const pickedCount = Object.values(permPicks).filter(Boolean).length;

  const pickAvatarFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const confirm = () => {
    const finalName = name.trim() || applicantName || 'Team Member';
    let role = roleKind;
    let permissions: Record<string, unknown> | undefined;
    if (roleKind === 'custom') {
      role = customRoleName.trim().toLowerCase().replace(/\s+/g, '-') || 'custom';
      permissions = Object.fromEntries(
        Object.entries(permPicks).filter(([, v]) => v),
      );
    }
    onConfirm({ name: finalName, avatar, role, permissions });
  };

  return (
    <div className="space-y-4">
      {/* Identity: name + avatar */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-dashed border-muted-foreground/30 grid place-items-center bg-muted/40 hover:bg-muted/70 transition-all shrink-0"
          title="Choose profile picture"
        >
          {avatar ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={20} className="text-muted-foreground/60" />
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickAvatarFile(e.target.files?.[0])}
        />
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Member name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={applicantName || 'e.g. Abebe Adugna'} />
          {avatar && (
            <button type="button" onClick={() => setAvatar(null)} className="text-[11px] font-bold text-red-500 hover:text-red-600 inline-flex items-center gap-1">
              <Trash2 size={11} /> Remove picture
            </button>
          )}
        </div>
      </div>

      {/* Role selection */}
      <div className="grid gap-2">
        {([
          { key: 'owner', label: 'Owner', desc: 'Full equal owner — manage everything' },
          { key: 'cashier', label: 'Cashier', desc: 'Point-of-sale and daily sales operations' },
          { key: 'custom', label: 'Custom', desc: 'Name the role and pick exact permissions' },
        ] as const).map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setRoleKind(o.key)}
            className={`text-left p-3 rounded-xl border-2 transition-all ${roleKind === o.key ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-transparent bg-muted/40 hover:bg-muted/70'}`}
          >
            <p className="text-sm font-black text-foreground">{o.label}</p>
            <p className="text-xs font-bold text-muted-foreground/70">{o.desc}</p>
          </button>
        ))}
      </div>

      {/* Custom role: name + permission picks */}
      {roleKind === 'custom' && (
        <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Custom role name</label>
          <Input value={customRoleName} onChange={(e) => setCustomRoleName(e.target.value)} placeholder="e.g. Store Supervisor" />
          <div className="flex items-center justify-between pt-1">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Permissions ({pickedCount} selected)</label>
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                placeholder="Search…"
                className="pl-7 pr-2 py-1 text-xs rounded-lg border bg-background w-36"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1">
            {grouped.map(([scope, perms]) => (
              <div key={scope}>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 sticky top-0 bg-transparent">
                  {SCOPE_LABELS[scope as keyof typeof SCOPE_LABELS] || scope}
                </p>
                {perms.map((p) => (
                  <label key={p.key} className="flex items-center gap-2 py-1 cursor-pointer group" title={p.description}>
                    <input
                      type="checkbox"
                      checked={!!permPicks[p.key]}
                      onChange={(e) => setPermPicks((prev) => ({ ...prev, [p.key]: e.target.checked }))}
                      className="h-3.5 w-3.5 accent-emerald-500"
                    />
                    <span className="text-xs font-bold text-foreground group-hover:text-emerald-600">{p.label}</span>
                  </label>
                ))}
              </div>
            ))}
            {grouped.length === 0 && <p className="text-xs text-muted-foreground py-2">No permissions match your search.</p>}
          </div>
        </div>
      )}

      <Button className="w-full" onClick={confirm} disabled={busy}>
        ✓ Confirm Invitation & Sync
      </Button>
      <Button variant="outline" className="w-full text-red-500 hover:text-red-600" onClick={onDecline}>
        Decline request
      </Button>
    </div>
  );
};

export default ApprovalConfig;
