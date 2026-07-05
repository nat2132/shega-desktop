const fs = require('fs');
const c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');
const markers = { en: '  },\r\n  am: {', am: '  },\r\n  om: {', om: '  },\r\n  ti: {', ti: '  }\r\n};' };

function allPairs(text) {
  const re = /'([a-zA-Z_][a-zA-Z0-9_.]*)':\s*'((?:[^'\\]|\\.)*)'/g;
  const r = {}; let m;
  while ((m = re.exec(text)) !== null) {
    console.log('REGEX MATCHED key="' + m[1] + '" value="' + m[2] + '"');
    r[m[1]] = m[2];
  }
  return r;
}

for (const lang of ['en', 'am', 'om', 'ti']) {
  const s = c.indexOf(lang + ': {') + (lang + ': {').length;
  const e = c.indexOf(markers[lang], s);
  const blockText = c.slice(s, e);
  const todayLines = blockText.split('\n').filter(l => l.includes('today_attendance'));
  console.log('--- ' + lang + ' block, line count: ' + todayLines.length + ' ---');
  todayLines.forEach((l, i) => console.log('  ' + i + ': ' + JSON.stringify(l)));
}

// Test allPairs on just the EN block
const enBlock = c.slice(
  c.indexOf('en: {') + 'en: {'.length,
  c.indexOf(markers.en)
);
console.log('\n--- Testing allPairs on EN block ---');
const pairs = allPairs(enBlock);
console.log('\nTotal keys found: ' + Object.keys(pairs).length);
