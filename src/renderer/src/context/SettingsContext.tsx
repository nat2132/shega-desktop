import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

export type Language = 'en' | 'am' | 'om' | 'ti';
export type CalendarType = 'ethiopian' | 'gregorian';
export type Theme = 'midnight' | 'light' | 'ocean' | 'forest' | 'sunset' | 'royal' | 'minimal';

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  calendarType: CalendarType;
  setCalendarType: (type: CalendarType) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [calendarType, setCalendarType] = useState<CalendarType>('ethiopian');
  const [theme, setTheme] = useState<Theme>('light');

  // Load settings from DB on mount
  useEffect(() => {
    window.api.getSetting('app_settings').then((settings) => {
      if (settings) {
        if (settings.language) setLanguage(settings.language);
        if (settings.calendarType) setCalendarType(settings.calendarType);
        if (settings.theme) setTheme(settings.theme);
      }
    });
  }, []);

  // Save settings when they change
  useEffect(() => {
    window.api.setSetting('app_settings', { language, calendarType, theme });
  }, [language, calendarType, theme]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const t = (key: string, params?: Record<string, any>): string => {
    const translation = translations[language]?.[key] || translations['en']?.[key] || key;
    
    if (!params) return translation;
    
    let result = translation;
    Object.entries(params).forEach(([k, v]) => {
      result = result.replace(`{${k}}`, String(v));
    });
    return result;
  };

  return (
    <SettingsContext.Provider value={{ 
      language, setLanguage, 
      calendarType, setCalendarType, 
      theme, setTheme,
      t 
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
