import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from '../i18n/translations';
import { TUTORIAL_TRANSLATIONS } from '../i18n/tutorial-translations';
import { formatDate as formatEtDate } from '../utils/ethiopian-calendar';
import { ALL_MODULES } from '../utils/feature-modules';

// Merge tutorial translations into main translations
const mergedTranslations: Record<string, Record<string, string>> = {};
for (const lang of ['en', 'am', 'om', 'ti'] as const) {
  mergedTranslations[lang] = {
    ...(translations[lang] || {}),
    ...(TUTORIAL_TRANSLATIONS[lang] || {}),
  };
}

export type Language = 'en' | 'am' | 'om' | 'ti';
export type CalendarType = 'ethiopian' | 'gregorian';
export type TimeSystem = 'device' | 'ethiopian';
export type Theme = 'light' | 'dark' | 'midnight' | 'emerald' | 'charcoal' | 'slate' | 'cocoa';

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  calendarType: CalendarType;
  setCalendarType: (type: CalendarType) => void;
  timeSystem: TimeSystem;
  setTimeSystem: (type: TimeSystem) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  taxEnabled: boolean;
  setTaxEnabled: (enabled: boolean) => void;
  taxRate: number;
  setTaxRate: (rate: number) => void;
  currentBusiness: any | null;
  refreshBusiness: () => Promise<void>;
  businesses: any[];
  refreshBusinesses: () => Promise<void>;
  switchBusiness: (id: number) => Promise<boolean>;
  t: (key: string, fallbackOrParams?: string | Record<string, any>, params?: Record<string, any>) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string | number) => string;
  formatDateTime: (date: Date | string | number) => string;
  enabledModules: string[];
  setEnabledModules: (modules: string[]) => void;
  isModuleEnabled: (moduleId: string) => boolean;
  settingsLoaded: boolean;
  currency: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [calendarType, setCalendarType] = useState<CalendarType>('ethiopian');
  const [timeSystem, setTimeSystem] = useState<TimeSystem>('device');
  const [theme, setTheme] = useState<Theme>('dark');
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState<number>(15);
  const [currentBusiness, setCurrentBusiness] = useState<any | null>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [enabledModules, setEnabledModulesState] = useState<string[]>([...ALL_MODULES]);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const refreshBusiness = async () => {
    try {
      const biz = await window.api.getActiveBusiness();
      setCurrentBusiness(biz);
    } catch (err) {
      console.error('Failed to fetch business:', err);
    }
  };

  const refreshBusinesses = async () => {
    try {
      const list = await window.api.businessList();
      setBusinesses(list || []);
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
    }
  };

  const switchBusiness = useCallback(async (id: number): Promise<boolean> => {
    try {
      await window.api.businessSwitch(id);
      await Promise.all([refreshBusiness(), refreshBusinesses()]);
      return true;
    } catch (err: any) {
      console.error('Failed to switch business:', err);
      return false;
    }
  }, []);

  const setEnabledModules = useCallback((modules: string[]) => {
    setEnabledModulesState(modules);
    window.api.setSetting('enabled_modules', modules).catch(() => {});
  }, []);

  const isModuleEnabled = useCallback((moduleId: string): boolean => {
    return enabledModules.includes(moduleId);
  }, [enabledModules]);

  // Load settings from DB on mount
  useEffect(() => {
    Promise.all([
      window.api.getSetting('app_settings'),
      window.api.getSetting('enabled_modules'),
    ]).then(([appSettings, savedModules]) => {
      if (appSettings) {
        if (appSettings.language) setLanguage(appSettings.language);
        if (appSettings.calendarType) setCalendarType(appSettings.calendarType);
        if (appSettings.timeSystem) setTimeSystem(appSettings.timeSystem);
        if (appSettings.theme) setTheme(appSettings.theme);
        if (typeof appSettings.taxEnabled === 'boolean') setTaxEnabled(appSettings.taxEnabled);
        if (typeof appSettings.taxRate === 'number') setTaxRate(appSettings.taxRate);
      }
      if (savedModules && Array.isArray(savedModules)) {
        setEnabledModulesState(savedModules);
      }
      setSettingsLoaded(true);
    }).catch((err) => {
      console.error('Failed to load settings:', err);
      setSettingsLoaded(true);
    });
    refreshBusiness();
    refreshBusinesses();
  }, []);

  // Save settings when they change
  useEffect(() => {
    window.api.setSetting('app_settings', { language, calendarType, timeSystem, theme, taxEnabled, taxRate }).catch(() => {});
  }, [language, calendarType, timeSystem, theme, taxEnabled, taxRate]);

  // Apply theme & language to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('lang', language);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, language]);

  const t = (key: string, fallbackOrParams?: string | Record<string, any>, params?: Record<string, any>): string => {
    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    // Determine if second arg is a fallback string or interpolation params
    let fallback: string | undefined;
    let interpolateParams: Record<string, any> | undefined;

    if (typeof fallbackOrParams === 'string') {
      fallback = fallbackOrParams;
      interpolateParams = params;
    } else if (typeof fallbackOrParams === 'object') {
      interpolateParams = fallbackOrParams;
    }

    let translation = getNestedValue(mergedTranslations[language], key);
    
    // Fallback to flat keys before trying English
    if (!translation) {
      translation = mergedTranslations[language]?.[key];
    }
    
    // Try English nested
    if (!translation) {
      translation = getNestedValue(mergedTranslations['en'], key);
    }
    
    // Try English flat key
    if (!translation) {
      translation = mergedTranslations['en']?.[key];
    }

    // Use fallback if no translation found
    if (!translation) {
      return fallback ?? key;
    }

    if (typeof translation !== 'string') return String(translation);
    
    if (!interpolateParams) return translation;
    
    let result = translation;
    Object.entries(interpolateParams).forEach(([k, v]) => {
      result = result.replace(`{${k}}`, String(v));
    });
    return result;
  };

  const formatDate = (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);

    try {
      // Use the dedicated utility for consistent ethiopian/gregorian formatting
      return formatEtDate(d, calendarType, language, options);
    } catch (err) {
      console.error('Date formatting failed:', err);
      return d.toLocaleDateString();
    }
  };

  const formatTime = (date: Date | string | number): string => {
    const d = typeof date === 'object' && date !== null ? date : new Date(date);
    if (isNaN(d.getTime())) return String(date);
    if (timeSystem === 'ethiopian') {
      const hours = d.getUTCHours();
      const minutes = d.getUTCMinutes();
      // Ethiopian time: 6 AM UTC = 12:00 (start of day), 12 PM UTC = 6:00, 6 PM UTC = 12:00 (night)
      let ethHours = (hours + 6) % 24;
      const period = ethHours >= 12 ? 'PM' : 'AM';
      ethHours = ethHours % 12 || 12;
      const periodLabel = language === 'am' ? (period === 'AM' ? 'ጠዋት' : 'ማታ') :
        language === 'om' ? (period === 'AM' ? 'Ganama' : 'Galgal') :
        language === 'ti' ? (period === 'AM' ? 'ንጋት' : 'ምሸት') :
        period;
      return `${ethHours}:${minutes.toString().padStart(2, '0')} ${periodLabel}`;
    }
    return d.toLocaleTimeString(language === 'en' ? 'en-US' : language === 'am' ? 'am-ET' : language === 'om' ? 'om-ET' : 'ti-ET', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (date: Date | string | number): string => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    try {
      return `${formatDate(d)} ${formatTime(d)}`;
    } catch {
      return d.toLocaleString();
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      language, setLanguage, 
      calendarType, setCalendarType,
      timeSystem, setTimeSystem,
      theme, setTheme,
      currentBusiness, refreshBusiness, businesses, refreshBusinesses, switchBusiness,
      t, formatDate, formatTime, formatDateTime,
      enabledModules, setEnabledModules, isModuleEnabled, settingsLoaded,
      currency: currentBusiness?.currency || 'ETB'
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
