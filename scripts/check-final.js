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
const en = allPairs(blocks.en);
const am = allPairs(blocks.am);
const ti = allPairs(blocks.ti);

const sections = ['employees', 'contacts', 'debt', 'budgets'];
for (const section of sections) {
  const enKeys = Object.entries(en).filter(([k]) => k.startsWith(section + '.'));
  console.log('--- ' + section + ' ---');
  let found = false;
  for (const [k, v] of enKeys) {
    const a = am[k], t = ti[k];
    if (a === undefined || a === v || t === undefined || t === v) {
      console.log('  ' + k + ': EN="' + v + '" | AM="' + (a||'MISS') + '" | TI="' + (t||'MISS') + '"');
      found = true;
    }
  }
  if (!found) console.log('  All translated!');
}
