import React from 'react';
import { CreditCard, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useViewOnly } from '../context/ViewOnlyContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';

/**
 * Banner shown at the top of view-only pages explaining the restriction
 * and offering a direct path to the subscription page.
 */
export const ViewOnlyBanner: React.FC = () => {
  const { t } = useSettings();
  const navigate = useNavigate();
  const { isViewOnly, message } = useViewOnly();

  if (!isViewOnly) return null;

  return (
    <Card
      className="border-amber-500/30 bg-amber-500/10 mb-4"
      style={{ borderLeft: '4px solid #f59e0b' }}
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-amber-500">
                {t('view_only.title', 'View-Only Mode')}
              </p>
              <p className="text-xs text-amber-200 mt-0.5">
                {message}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-[11px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 border-amber-500/20">
              {t('view_only.badge', 'View Only')}
            </Badge>
            <Button
              size="sm"
              className="rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              onClick={() => navigate('/subscription', { replace: true })}
            >
              <CreditCard className="h-3 w-3 mr-1" />
              {t('view_only.subscribe', 'Subscribe / Pay Now')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Small inline indicator for use in headers/tables where the full banner
 * would be too large.
 */
export const ViewOnlyBadge: React.FC = () => {
  const { isViewOnly } = useViewOnly();
  if (!isViewOnly) return null;
  return (
    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 border-amber-500/20 ml-2">
      View Only
    </Badge>
  );
};

export default ViewOnlyBanner;