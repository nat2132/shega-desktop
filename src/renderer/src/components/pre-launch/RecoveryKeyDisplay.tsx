import React, { useState } from 'react';
import { ShieldAlert, Copy, Check, Download, Eye, EyeOff } from 'lucide-react';
import { BrandedLogo } from '../branded-logo';

interface RecoveryKeyDisplayProps {
  recoveryKey: string;
  username: string;
  onAcknowledged: () => void;
}

const RecoveryKeyDisplay: React.FC<RecoveryKeyDisplayProps> = ({ recoveryKey, username, onAcknowledged }) => {
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = `Shega OS Recovery Key
==============================
Username: ${username}
Recovery Key: ${recoveryKey}
Generated: ${new Date().toLocaleString()}
==============================
Keep this key safe. It is the ONLY way to recover your PIN.
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shega-recovery-${username}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maskedKey = recoveryKey.slice(0, 8) + '••••••••••••••••••••••••••••••' + recoveryKey.slice(-4);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: '#0B0705' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.02]"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)' }}
        />
      </div>

      <div className="w-full max-w-lg p-10 text-center space-y-6 relative z-10">
        <div className="flex justify-center">
          <BrandedLogo size="md" className="border-white/10" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Recovery Key</h1>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-400/80 mt-2">
            <ShieldAlert size={12} className="inline mr-1.5 -mt-0.5" />
            Save this key — you cannot retrieve it later
          </p>
        </div>

        <div className="bg-amber-500/5 border-2 border-amber-500/20 rounded-2xl p-6 space-y-4">
          <div className="text-left">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Username</p>
            <p className="text-sm font-bold text-white">{username}</p>
          </div>

          <div className="text-left">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Recovery Key</p>
            <div className="relative">
              <div className="w-full bg-black/40 rounded-xl px-4 py-3 font-mono text-xs break-all select-all
                border border-white/10 text-amber-300/90"
              >
                {showKey ? recoveryKey : maskedKey}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setShowKey(!showKey)}
              className="flex-1 py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white/60 hover:bg-white/10 transition-all"
            >
              {showKey ? <EyeOff size={14} className="inline mr-1.5" /> : <Eye size={14} className="inline mr-1.5" />}
              {showKey ? 'Hide' : 'Reveal'}
            </button>
            <button type="button" onClick={handleCopy}
              className="flex-1 py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white/60 hover:bg-white/10 transition-all"
            >
              {copied ? <Check size={14} className="inline mr-1.5" /> : <Copy size={14} className="inline mr-1.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button type="button" onClick={handleDownload}
              className="flex-1 py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white/60 hover:bg-white/10 transition-all"
            >
              <Download size={14} className="inline mr-1.5" />
              Save
            </button>
          </div>
        </div>

        <label className="flex items-start gap-3 text-left cursor-pointer group">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={e => setAcknowledged(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-white"
          />
          <span className="text-[10px] font-bold leading-relaxed text-white/40 group-hover:text-white/60 transition-colors">
            I have saved my recovery key. I understand that if I lose this key, I may not be able to recover my PIN.
          </span>
        </label>

        <button
          type="button"
          disabled={!acknowledged}
          onClick={onAcknowledged}
          className="w-full py-5 bg-white text-[#0B0705] rounded-2xl font-black uppercase tracking-[0.3em] text-sm hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          Continue to Setup
        </button>
      </div>
    </div>
  );
};

export default RecoveryKeyDisplay;
