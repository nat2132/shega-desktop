import { Eye, EyeOff } from 'lucide-react';
import { ReactNode } from 'react';

import { useLocalStorage } from '@renderer/hooks/useLocalStorage';
import { useSettings } from '../context/SettingsContext';

interface KpiVisibilityProps {
  storageKey: string;
  children: (visible: boolean) => ReactNode;
}

export function KpiVisibility({ storageKey, children }: KpiVisibilityProps) {
  const { t } = useSettings();
  const [visible, setVisible] = useLocalStorage<boolean>(`shega.kpi.${storageKey}`, false);

  return (
    <div className="flex flex-col gap-3">
      <div className="px-4 lg:px-6 flex justify-end">
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="inline-flex items-center gap-1.5 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-widest transition-colors hover:text-foreground"
        >
          {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          {visible ? t('kpi.hide') || 'Hide KPIs' : t('kpi.show') || 'Show KPIs'}
        </button>
      </div>
      {children(visible)}
    </div>
  );
}