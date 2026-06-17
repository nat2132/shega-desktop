/**
 * Ethiopian Calendar Utility
 * Ported from Shega Mobile and expanded with Oromo support.
 */

const ETHIOPIAN_MONTHS = [
  'Meskerem', 'Tikimit', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miazia', 'Ginbot', 'Senie', 'Hamlie', 'Nehase', 'Pagumen'
];

const ETHIOPIAN_MONTHS_AM = [
  'መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
];

const ETHIOPIAN_MONTHS_OM = [
  'Fulbaana', 'Onkololeessa', 'Sadaasa', 'Muddee', 'Amajjii', 'Gurraandhala',
  'Bitootessa', 'Eebila', 'Caamsaa', 'Waxabajjii', 'Adoolessa', 'Hagayya', 'Qaammee'
];

const ETHIOPIAN_MONTHS_TI = [
  'መስከረም', 'ጥቅምቲ', 'ሕዳር', 'ታሕሳስ', 'ጥሪ', 'ለካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰነ', 'ሓምለ', 'ነሓሰ', 'ጳጉሜን'
];

const ETHIOPIAN_DAYS = [
  'Eud', 'Segno', 'Maksegno', 'Rob', 'Hamus', 'Arb', 'Kidame'
];

const ETHIOPIAN_DAYS_AM = [
  'እሁድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'አርብ', 'ቅዳሜ'
];

const ETHIOPIAN_DAYS_OM = [
  'Dilbata', 'Wiixata', 'Saafila', 'Roobii', 'Kamisa', 'Jimaata', 'Sanbata'
];

const ETHIOPIAN_DAYS_TI = [
  'ሰንበት', 'ሰኑይ', 'ሰሉስ', 'ረቡዕ', 'ሓሙስ', 'ዓርቢ', 'ቀዳም'
];

export type CalendarType = 'ethiopian' | 'gregorian';
export type Language = 'en' | 'am' | 'om' | 'ti';

export const toEthiopianDate = (date: Date) => {
  if (!date || isNaN(date.getTime())) date = new Date();

  const ethiopicEpoch = 1723856;
  const yr = date.getFullYear();
  const mo = date.getMonth() + 1;
  const dy = date.getDate();

  const a = Math.floor((14 - mo) / 12);
  const y = yr + 4800 - a;
  const m = mo + 12 * a - 3;
  const jdn = dy + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  const r = (jdn - ethiopicEpoch) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  
  const year = 4 * Math.floor((jdn - ethiopicEpoch) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  
  return { year: year + 1, month, day };
};

export const formatDate = (
  date: Date, 
  calendarType: CalendarType, 
  language: Language = 'en',
  options?: Intl.DateTimeFormatOptions
) => {
  if (!date || isNaN(date.getTime())) date = new Date();

  if (calendarType === 'gregorian') {
    const locale = language === 'en' ? 'en-US' : language === 'am' ? 'am-ET' : language === 'om' ? 'om-ET' : 'ti-ET';
    return date.toLocaleDateString(locale, options || {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } else {
    const { year, month, day } = toEthiopianDate(date);
    let monthName = ETHIOPIAN_MONTHS[month - 1];
    if (language === 'am') monthName = ETHIOPIAN_MONTHS_AM[month - 1];
    if (language === 'om') monthName = ETHIOPIAN_MONTHS_OM[month - 1];
    if (language === 'ti') monthName = ETHIOPIAN_MONTHS_TI[month - 1];
    
    // Basic support for options in Ethiopian calendar
    if (options?.month === '2-digit') {
      const mStr = month < 10 ? `0${month}` : `${month}`;
      const dStr = day < 10 ? `0${day}` : `${day}`;
      return `${dStr}/${mStr}/${year}`;
    }

    return `${monthName} ${day}, ${year}`;
  }
};

const JDN_ETHIOPIC_EPOCH = 1723856;

export const fromEthiopianDate = (year: number, month: number, day: number): Date => {
  const jdn = JDN_ETHIOPIC_EPOCH + 365 * (year - 1) + Math.floor((year - 1) / 4) + 30 * (month - 1) + day - 1;
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor(146097 * b / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor(1461 * d / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const gDay = e - Math.floor((153 * m + 2) / 5) + 1;
  const gMonth = m + 3 - 12 * Math.floor(m / 10);
  const gYear = 100 * b + d - 4800 + Math.floor(m / 10);
  return new Date(gYear, gMonth - 1, gDay);
};

/** Get localized Ethiopian day name. dayOfWeek: 0=Sun … 6=Sat (matches JS getDay()) */
export const getEthiopianDayName = (dayOfWeek: number, language: Language = 'en'): string => {
  const i = dayOfWeek % 7;
  if (language === 'am') return ETHIOPIAN_DAYS_AM[i];
  if (language === 'om') return ETHIOPIAN_DAYS_OM[i];
  if (language === 'ti') return ETHIOPIAN_DAYS_TI[i];
  return ETHIOPIAN_DAYS[i];
};

/** Get localized Ethiopian month name. monthIndex 0-based (0=Meskerem, 12=Pagumen) */
export const getEthiopianMonthName = (monthIndex: number, language: Language = 'en'): string => {
  const i = Math.max(0, Math.min(monthIndex, 12));
  if (language === 'am') return ETHIOPIAN_MONTHS_AM[i];
  if (language === 'om') return ETHIOPIAN_MONTHS_OM[i];
  if (language === 'ti') return ETHIOPIAN_MONTHS_TI[i];
  return ETHIOPIAN_MONTHS[i];
};

export const formatDateTime = (
  date: Date,
  calendarType: CalendarType,
  language: Language = 'en',
  timeSystem?: TimeSystem
) => {
  if (!date || isNaN(date.getTime())) return '';
  const dateStr = formatDate(date, calendarType, language);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
};

export type TimeSystem = 'device' | 'ethiopian';

export const formatTime = (
  date: Date,
  timeSystem?: TimeSystem,
  language: Language = 'en'
) => {
  if (!date || isNaN(date.getTime())) return '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const getFriendlyDate = (
  date: Date,
  calendarType: CalendarType,
  language: Language = 'en'
) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    if (language === 'am') return 'ዛሬ';
    if (language === 'om') return 'Har\'a';
    if (language === 'ti') return 'ሎሚ';
    return 'Today';
  } else if (diffDays === 1) {
    if (language === 'am') return 'ትላንት';
    if (language === 'om') return 'Kaleessa';
    if (language === 'ti') return 'ትማሊ';
    return 'Yesterday';
  } else {
    return formatDate(date, calendarType, language);
  }
};
