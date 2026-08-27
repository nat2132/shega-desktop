import React from 'react';
import { Sparkles, Lock, ArrowRight, Users, Shield, Truck, Building2, FileSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useSubscription } from '../context/SubscriptionContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const FEATURE_INFO: Record<string, { icon: any; whatKey: string; whyKey: string; benefitsKey: string }> = {
  employees: {
    icon: Users,
    whatKey: 'locked.employees_what',
    whyKey: 'locked.employees_why',
    benefitsKey: 'locked.employees_benefits',
  },
  users: {
    icon: Users,
    whatKey: 'locked.users_what',
    whyKey: 'locked.users_why',
    benefitsKey: 'locked.users_benefits',
  },
  audit: {
    icon: Shield,
    whatKey: 'locked.audit_what',
    whyKey: 'locked.audit_why',
    benefitsKey: 'locked.audit_benefits',
  },
  suppliers: {
    icon: Building2,
    whatKey: 'locked.suppliers_what',
    whyKey: 'locked.suppliers_why',
    benefitsKey: 'locked.suppliers_benefits',
  },
  shipments: {
    icon: Truck,
    whatKey: 'locked.shipments_what',
    whyKey: 'locked.shipments_why',
    benefitsKey: 'locked.shipments_benefits',
  },
  reports: {
    icon: FileSearch,
    whatKey: 'locked.reports_what',
    whyKey: 'locked.reports_why',
    benefitsKey: 'locked.reports_benefits',
  },
};

interface LockedFeatureModalProps {
  open: boolean;
  onClose: () => void;
  feature: string;
  featureName?: string;
}

const LockedFeatureModal: React.FC<LockedFeatureModalProps> = ({ open, onClose, feature, featureName }) => {
  const { t } = useSettings();
  const navigate = useNavigate();
  const { isTrial } = useSubscription();
  const info = FEATURE_INFO[feature] || {
    icon: Lock,
    whatKey: 'locked.default_what',
    whyKey: 'locked.default_why',
    benefitsKey: 'locked.default_benefits',
  };
  const Icon = info.icon;

  const handleUpgrade = () => {
    onClose();
    navigate('/subscription');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-3xl border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <Badge variant="secondary" className="text-xs font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border-amber-500/20">
              {t('premium.badge')}
            </Badge>
          </div>
          <DialogTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-500" />
            {featureName || t('premium.locked_title')}
          </DialogTitle>
          <DialogDescription className="text-[11px] text-muted-foreground">
            {t('premium.locked_desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <Icon className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {t('premium.locked_what')}
                </p>
                <p className="text-xs font-medium mt-0.5">{t(info.whatKey)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-muted/20 border border-border/50">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                {t('premium.locked_why')}
              </p>
              <p className="text-[11px] leading-relaxed">{t(info.whyKey)}</p>
            </div>
            <div className="p-3 rounded-2xl bg-muted/20 border border-border/50">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                {t('premium.locked_benefits')}
              </p>
              <div className="space-y-1">
                {t(info.benefitsKey).split(', ').map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-xs">{b}</span>
                  </div>
                ))}
              </div>
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
            {isTrial ? t('premium.trial_available') : t('premium.locked_upgrade')} <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LockedFeatureModal;
