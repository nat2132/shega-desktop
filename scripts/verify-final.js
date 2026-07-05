const fs = require('fs');
const c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');
const markers = { en: '  },\r\n  am: {', am: '  },\r\n  om: {', om: '  },\r\n  ti: {', ti: '  }\r\n};' };
function allPairs(text) {
  const re = /'([a-zA-Z_][a-zA-Z0-9_.]*)':\s*'((?:[^'\\]|\\.)*)'/g;
  const r = {}; let m;
  while ((m = re.exec(text)) !== null) r[m[1]] = m[2];
  return r;
}
for (const lang of ['en', 'am', 'om', 'ti']) {
  const s = c.indexOf(lang + ': {') + (lang + ': {').length;
  const e = c.indexOf(markers[lang], s);
  const pairs = allPairs(c.slice(s, e));
  console.log(lang + ': ' + Object.keys(pairs).length + ' keys');
  // Check for any MISSING keys
  if (lang === 'en') {
    const enKeys = Object.keys(pairs);
    for (const other of ['am', 'om', 'ti']) {
      const s2 = c.indexOf(other + ': {') + (other + ': {').length;
      const e2 = c.indexOf(markers[other], s2);
      const otherPairs = allPairs(c.slice(s2, e2));
      const missing = enKeys.filter(k => otherPairs[k] === undefined);
      const extra = Object.keys(otherPairs).filter(k => pairs[k] === undefined);
      if (missing.length) console.log('  Keys in EN but missing in ' + other + ': ' + missing.slice(0, 5).join(', ') + (missing.length > 5 ? '...' : ''));
      if (extra.length) console.log('  Keys in ' + other + ' but extra vs EN: ' + extra.slice(0, 5).join(', ') + (extra.length > 5 ? '...' : ''));
    }
  }
}
