import React from 'react';
import { Sparkles, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

const PremiumUpsellModal: React.FC<PremiumUpsellModalProps> = ({ open, onClose, feature }) => {
  const { t } = useSettings();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/subscription');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <Badge variant="secondary" className="text-xs font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border-amber-500/20">
              {t('premium.badge')}
            </Badge>
          </div>
          <DialogTitle className="text-lg font-black uppercase tracking-widest">
            {t('premium.locked_title')}
          </DialogTitle>
          <DialogDescription className="text-[11px] text-muted-foreground">
            {feature ? t('premium.feature_locked', `"${feature}" is a Premium feature.`) : t('premium.locked_desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-amber-500/[0.04] to-transparent border border-amber-500/10">
            <div className="p-2 rounded-full bg-amber-500/10">
              <Crown className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-500">{t('premium.get_premium')}</p>
              <p className="text-xs text-muted-foreground">{t('premium.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs font-black uppercase tracking-widest flex-1">
            {t('contact_us') || 'Close'}
          </Button>
          <Button
            size="sm"
            onClick={handleUpgrade}
            className="rounded-xl text-xs font-black uppercase tracking-widest flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          >
            {t('premium.locked_upgrade')} <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumUpsellModal;
