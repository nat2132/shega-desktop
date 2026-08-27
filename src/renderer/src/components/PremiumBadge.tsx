import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '../utils/shadcn';
import { useSettings } from '../context/SettingsContext';

interface PremiumBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({ className, size = 'sm', showIcon = true }) => {
  const { t } = useSettings();
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-xs px-2 py-0.5 gap-1',
    lg: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-black uppercase tracking-widest',
        'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-500 border border-amber-500/30',
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Sparkles className={cn(size === 'sm' ? 'h-2.5 w-2.5' : size === 'md' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />}
      {t('premium.badge_text')}
    </span>
  );
};

export default PremiumBadge;
