const fs = require('fs');
const c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');
const markers = {
  en: '  },\r\n  am: {',
  am: '  },\r\n  om: {',
  om: '  },\r\n  ti: {',
  ti: '  }\r\n};'
};
for (const lang of ['en', 'am', 'om', 'ti']) {
  const s = c.indexOf(lang + ': {');
  if (s === -1) { console.log(lang + ': marker not found'); continue; }
  const start = s + (lang + ': {').length;
  const end = c.indexOf(markers[lang], start);
  if (end === -1) { console.log(lang + ': end marker not found'); continue; }
  const text = c.slice(start, end);
  const pairs = text.match(/'([a-zA-Z_][a-zA-Z0-9_.]*)':\s*'((?:[^'\\]|\\.)*)'/g);
  console.log(lang + ': ' + (pairs ? pairs.length : 0) + ' flat keys, length=' + text.length);
}
