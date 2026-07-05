const fs = require('fs');
const c = fs.readFileSync('scripts/translate-sections.js', 'utf8');

// Extract the amTiTranslations object
const start = c.indexOf('const amTiTranslations = {') + 'const amTiTranslations = {'.length;
// Find the matching closing brace
let depth = 1;
let end = start;
while (depth > 0 && end < c.length) {
  if (c[end] === '{') depth++;
  else if (c[end] === '}') depth--;
  end++;
}
const translationsText = c.slice(start, end - 1);
console.log('Translations text length:', translationsText.length);

// Parse keys from the translations text
// Match: 'English text': { am: 'Amharic', ti: 'Tigrinya' }
const re = /'((?:[^'\\]|\\.)*)':\s*\{[^}]*\}/g;
const dict = {};
let m;
while ((m = re.exec(translationsText)) !== null) {
  dict[m[1]] = true;
}

// Check specific keys
const searchKeys = [
  "Today's Attendance",        // Without backslash idea
  "Today\\'s Attendance",       // With backslash  
  "Value",
  "PIN",
  "Phone is required",
  "Enter phone...",
  "Payment note...",
  "{{month}} {{year}}"
];

for (const key of searchKeys) {
  const found = dict[key] === true;
  console.log('Key ' + JSON.stringify(key) + ' found: ' + found);
}

// Now check what the actual enPairs value is from translations.ts
const ts = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');
const markers = { en: '  },\r\n  am: {', am: '  },\r\n  om: {', om: '  },\r\n  ti: {', ti: '  }\r\n};' };
function allPairs(text) {
  const re2 = /'([a-zA-Z_][a-zA-Z0-9_.]*)':\s*'((?:[^'\\]|\\.)*)'/g;
  const r = {}; let m2;
  while ((m2 = re2.exec(text)) !== null) r[m2[1]] = m2[2];
  return r;
}
const enBlock = ts.slice(
  ts.indexOf('en: {') + 'en: {'.length,
  ts.indexOf(markers.en)
);
const enPairs = allPairs(enBlock);

const testKeys = ['employees.today_attendance', 'reports.value_badge', 'employees.pin_label_create', 'contacts.phone_required'];
for (const k of testKeys) {
  const enVal = enPairs[k];
  console.log('\nKey ' + k + ':');
  console.log('  EN value: ' + JSON.stringify(enVal));
  const inDict = dict[enVal] === true;
  console.log('  In amTiTranslations: ' + inDict);
  // Try without the backslash
  if (enVal) {
    const withoutBackslash = enVal.replace(/\\'/g, "'");
    const inDict2 = dict[withoutBackslash] === true;
    console.log('  Without backslash: ' + JSON.stringify(withoutBackslash) + ' -> found: ' + inDict2);
  }
}
