/**
 * Desktop first-time guided tour — 4 skippable steps, shown once after
 * onboarding completes. Never forced; "Skip Tour" closes it permanently.
 */

import React, { useState } from 'react';
import { BarChart3, Package, QrCode, ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { useSettings } from '../context/SettingsContext';

export const TOUR_DONE_KEY = 'guided_tour_done';

const STEPS = [
  { icon: Package, title: 'Inventory', body: 'Add and manage your products — names, prices, stock and barcodes.' },
  { icon: ShoppingCart, title: 'Sales / POS', body: 'Scan or search for products and complete sales in seconds.' },
  { icon: QrCode, title: 'POS Hub', body: 'Connect your phone, desktop, and other devices to sync live.' },
  { icon: BarChart3, title: 'Reports', body: 'Understand how your business is performing.' },
];

export const GuidedTour: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { t } = useSettings();
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const Icon = s.icon;

  const close = () => {
    window.api?.setSetting(TOUR_DONE_KEY, true).catch(() => {});
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-3xl border border-border bg-background p-10 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-black tracking-tight">{s.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>

        <div className="mt-6 flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        <div className="mt-8 space-y-3">
          <Button className="w-full rounded-full py-6 font-black uppercase tracking-widest" onClick={close}>
            {step < STEPS.length - 1 ? t('common.next', 'Next') : t('tour.got_it', 'Got it')}
          </Button>
          <button
            type="button"
            onClick={close}
            className="w-full text-center text-xs font-black uppercase tracking-widest text-muted-foreground/60 hover:text-muted-foreground transition-colors py-2"
          >
            {t('tour.skip', 'Skip Tour')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuidedTour;
