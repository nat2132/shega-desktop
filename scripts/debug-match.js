const fs = require('fs');
const c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');
const markers = { en: '  },\r\n  am: {', am: '  },\r\n  om: {', om: '  },\r\n  ti: {', ti: '  }\r\n};' };
function allPairs(text) {
  const re = /'([a-zA-Z_][a-zA-Z0-9_.]*)':\s*'((?:[^'\\]|\\.)*)'/g;
  const r = {}; let m;
  while ((m = re.exec(text)) !== null) r[m[1]] = m[2];
  return r;
}
const blocks = {};
for (const lang of ['en', 'am', 'om', 'ti']) {
  const s = c.indexOf(lang + ': {') + (lang + ': {').length;
  const e = c.indexOf(markers[lang], s);
  blocks[lang] = c.slice(s, e);
}
const enPairs = allPairs(blocks.en.text);

// Check the key
const v = enPairs['employees.today_attendance'];
console.log('EN value for employees.today_attendance:');
console.log('  chars:', JSON.stringify(v));
console.log('  length:', v.length);
console.log('  codes:', [...v].map(c => c.charCodeAt(0)).join(','));

// Check in AM text
const pattern = `'employees.today_attendance': '${v}'`;
console.log('Pattern:', JSON.stringify(pattern));
console.log('Pattern length:', pattern.length);
const found = blocks.am.text.includes(pattern);
console.log('Found in AM text:', found);

// If not found, print the AM lines with this key
if (!found) {
  const amLines = blocks.am.text.split('\n').filter(l => l.includes('today_attendance'));
  console.log('AM lines with today_attendance:');
  amLines.forEach((l, i) => console.log('  ' + i + ': ' + JSON.stringify(l)));
}
