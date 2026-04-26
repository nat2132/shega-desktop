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
  language: Language = 'en'
) => {
  if (!date || isNaN(date.getTime())) date = new Date();

  if (calendarType === 'gregorian') {
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'am-ET', {
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
    
    return `${monthName} ${day}, ${year}`;
  }
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
