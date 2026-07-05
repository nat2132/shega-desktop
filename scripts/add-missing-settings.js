const fs = require('fs');
let c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');
const eol = '\r\n';

const markers = {
  en: { start: 'en: {', end: '  },\r\n  am: {' },
  am: { start: 'am: {', end: '  },\r\n  om: {' },
  om: { start: 'om: {', end: '  },\r\n  ti: {' },
  ti: { start: 'ti: {', end: '  }\r\n};' }
};

// Keys to add: flat key name -> value
const adding = {
  'settings.time_system': 'Time System',
  'settings.time_system_desc': 'Choose between device time and Ethiopian time (6 AM = 12:00).',
  'settings.device_time': 'Device',
  'settings.ethiopian_time': 'Ethiopian',
  'settings.support': 'Support Center',
  'settings.support_desc': 'Get help, report issues, and contact the Shega team.',
  'settings.avatar_title': 'Avatar',
  'settings.avatar_desc': 'Choose a profile image for your account',
  'settings.avatar_none': 'No Avatar',
  'settings.avatar_upload': 'Upload Photo',
  'settings.avatar_saved': 'Avatar saved'
};

// AM translations
const amTrans = {
  'settings.time_system': 'የሰዓት ስርዓት',
  'settings.time_system_desc': 'በመሳሪያ ሰዓት እና በኢትዮጵያ ሰዓት መካከል ይምረጡ (6 AM = 12:00)።',
  'settings.device_time': 'መሳሪያ',
  'settings.ethiopian_time': 'ኢትዮጵያዊ',
  'settings.support': 'የድጋፍ ማእከል',
  'settings.support_desc': 'እገዛ ያግኙ፣ ችግሮችን ሪፖርት ያድርጉ፣ እና የሼጋ ቡድንን ያነጋግሩ።',
  'settings.avatar_title': 'አላታሪ',
  'settings.avatar_desc': 'ለመለያዎ የመገለጫ ምስል ይምረጡ',
  'settings.avatar_none': 'አላታሪ የለም',
  'settings.avatar_upload': 'ፎቶ ስቀል',
  'settings.avatar_saved': 'አላታሪ ተቀምጧል'
};

// TI translations
const tiTrans = {
  'settings.time_system': 'ስርአት ሰዓት',
  'settings.time_system_desc': 'ኣብ መንጎ ሰዓት መሳርሒ ንመንጎ ሰዓት ኢትዮጵያ ምረጽ (6 AM = 12:00)።',
  'settings.device_time': 'መሳርሒ',
  'settings.ethiopian_time': 'ኢትዮጵያዊ',
  'settings.support': 'ማእከል ደገፍ',
  'settings.support_desc': 'ሓገዝ ርኸቡ፣ ጸገማት ሪፖርት ግበሩ፣ ንቡድን ሼጋ ሕተቱ።',
  'settings.avatar_title': 'ኣላታሪ',
  'settings.avatar_desc': 'ንመለያካ ስእሊ መግለጺ ምረጽ',
  'settings.avatar_none': 'ኣላታሪ የለን',
  'settings.avatar_upload': 'ስእሊ ጸዓን',
  'settings.avatar_saved': 'ኣላታሪ ተቐሚጡ'
};

// Add keys to each block
for (const [lang, marker] of Object.entries(markers)) {
  const s = c.indexOf(marker.start) + marker.start.length;
  const e = c.indexOf(marker.end, s);
  const block = c.slice(s, e);

  // Find all flat keys already in the block
  const existing = new Set();
  const flatRe = /'([a-zA-Z_][a-zA-Z0-9_.]*)':/g;
  let m;
  while ((m = flatRe.exec(block)) !== null) existing.add(m[1]);

  // Build flat key lines for missing keys
  const lines = [];
  for (const [key, enVal] of Object.entries(adding)) {
    if (existing.has(key)) continue; // skip existing keys

    let val = enVal;
    if (lang === 'am' && amTrans[key]) val = amTrans[key];
    if (lang === 'ti' && tiTrans[key]) val = tiTrans[key];
    // OM: use the EN value as-is (Latin script, identity is fine)

    const escapedVal = val.replace(/'/g, "\\'");
    lines.push("    '" + key + "': '" + escapedVal + "'");
  }

  if (lines.length === 0) {
    console.log(lang + ': no new keys to add');
    continue;
  }

  // Insert before the marker at end of block - just add newlines + keys (each key already ends with comma)
  const insertionText = eol + lines.join(eol) + eol;
  const result = c.slice(0, e) + insertionText + c.slice(e);
  c = result;
  console.log(lang + ': added ' + lines.length + ' missing settings keys');
}

fs.writeFileSync('src/renderer/src/i18n/translations.ts', c, 'utf8');
console.log('\nDone');
