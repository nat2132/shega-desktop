import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';
import { formatDate as formatEtDate } from '../utils/ethiopian-calendar';

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
  currentBusiness: any | null;
  refreshBusiness: () => Promise<void>;
  t: (key: string, params?: Record<string, any>) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [calendarType, setCalendarType] = useState<CalendarType>('ethiopian');
  const [timeSystem, setTimeSystem] = useState<TimeSystem>('device');
  const [theme, setTheme] = useState<Theme>('dark');
  const [currentBusiness, setCurrentBusiness] = useState<any | null>(null);

  const refreshBusiness = async () => {
    try {
      const biz = await window.api.getActiveBusiness();
      setCurrentBusiness(biz);
    } catch (err) {
      console.error('Failed to fetch business:', err);
    }
  };

  // Load settings from DB on mount
  useEffect(() => {
    window.api.getSetting('app_settings').then((settings) => {
      if (settings) {
        if (settings.language) setLanguage(settings.language);
        if (settings.calendarType) setCalendarType(settings.calendarType);
        if (settings.timeSystem) setTimeSystem(settings.timeSystem);
        if (settings.theme) setTheme(settings.theme);
      }
    });
    refreshBusiness();
  }, []);

  // Save settings when they change
  useEffect(() => {
    window.api.setSetting('app_settings', { language, calendarType, timeSystem, theme });
  }, [language, calendarType, timeSystem, theme]);

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

  const t = (key: string, params?: Record<string, any>): string => {
    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    let translation = getNestedValue(translations[language], key) || getNestedValue(translations['en'], key) || key;
    
    // Fallback for flat keys if nested not found
    if (translation === key) {
      translation = translations[language]?.[key] || translations['en']?.[key] || key;
    }
    
    if (!params || typeof translation !== 'string') return String(translation);
    
    let result = translation;
    Object.entries(params).forEach(([k, v]) => {
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

  const formatTime = (date: Date): string => {
    if (timeSystem === 'ethiopian') {
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
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
    return date.toLocaleTimeString(language === 'en' ? 'en-US' : language === 'am' ? 'am-ET' : language === 'om' ? 'om-ET' : 'ti-ET', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SettingsContext.Provider value={{ 
      language, setLanguage, 
      calendarType, setCalendarType,
      timeSystem, setTimeSystem,
      theme, setTheme,
      currentBusiness, refreshBusiness,
      t, formatDate, formatTime
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
