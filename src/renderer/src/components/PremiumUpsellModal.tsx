import React from 'react';
import { Sparkles, Check, ArrowRight, BarChart3, Building2, Cloud, Headphones, Palette } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface PremiumUpsellModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

const premiumFeatures = [
  { key: 'feature_1', icon: BarChart3 },
  { key: 'feature_2', icon: Building2 },
  { key: 'feature_3', icon: Cloud },
  { key: 'feature_4', icon: Headphones },
  { key: 'feature_5', icon: Palette },
];

const PremiumUpsellModal: React.FC<PremiumUpsellModalProps> = ({ open, onClose, feature }) => {
  const { t } = useSettings();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border-amber-500/20">
              {t('premium.coming_soon')}
            </Badge>
          </div>
          <DialogTitle className="text-lg font-black uppercase tracking-widest">
            {t('premium.title')}
          </DialogTitle>
          <DialogDescription className="text-[11px] text-muted-foreground">
            {feature ? `"${feature}" is a Premium feature.` : t('premium.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t('premium.features')}
          </p>
          {premiumFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.key} className="flex items-center gap-3">
                <div className="p-1 rounded-full bg-emerald-500/10">
                  <Check className="h-3 w-3 text-emerald-500" />
                </div>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-medium">{t(`premium.${feat.key}`)}</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-[10px] font-black uppercase tracking-widest flex-1">
            {t('contact_us') || 'Close'}
          </Button>
          <Button size="sm" className="rounded-xl text-[10px] font-black uppercase tracking-widest flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
            {t('premium.learn_more')} <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumUpsellModal;
