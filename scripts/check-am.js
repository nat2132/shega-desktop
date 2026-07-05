const fs = require('fs');
const c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');
const markers = { en: '  },\r\n  am: {', am: '  },\r\n  om: {', om: '  },\r\n  ti: {', ti: '  }\r\n};' };

function allPairs(text) {
  const re = /'([a-zA-Z_][a-zA-Z0-9_.]*)':\s*'((?:[^'\\]|\\.)*)'/g;
  const r = {}; let m;
  while ((m = re.exec(text)) !== null) r[m[1]] = m[2];
  return r;
}

// Get AM block
const amStart = c.indexOf('am: {') + 'am: {'.length;
const amEnd = c.indexOf(markers.am, amStart);
const amText = c.slice(amStart, amEnd);
const amPairs = allPairs(amText);

// Check the specific keys
const keys = [
  'employees.today_attendance',
  'employees.pin_label_create',
  'contacts.phone_required',
  'contacts.category_required',
  'contacts.phone_placeholder',
  'debt.payment_note_placeholder',
  'budgets.period_month'
];

for (const key of keys) {
  const v = amPairs[key];
  console.log(key + ': ' + (v === undefined ? 'MISSING' : JSON.stringify(v)));
}

// Now check TI block
const tiStart = c.indexOf('ti: {') + 'ti: {'.length;
const tiEnd = c.indexOf(markers.ti, tiStart);
const tiText = c.slice(tiStart, tiEnd);
const tiPairs = allPairs(tiText);

console.log('\n--- TI ---');
for (const key of keys) {
  const v = tiPairs[key];
  console.log(key + ': ' + (v === undefined ? 'MISSING' : JSON.stringify(v)));
}

// Also EN for reference
const enStart = c.indexOf('en: {') + 'en: {'.length;
const enEnd = c.indexOf(markers.en, enStart);
const enText = c.slice(enStart, enEnd);
const enPairs = allPairs(enText);

console.log('\n--- EN ---');
for (const key of keys) {
  const v = enPairs[key];
  console.log(key + ': ' + (v === undefined ? 'MISSING' : JSON.stringify(v)));
}
