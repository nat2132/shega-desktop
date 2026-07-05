const fs = require('fs');
const c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');
const markers = {
  en: '  },\r\n  am: {', am: '  },\r\n  om: {', om: '  },\r\n  ti: {', ti: '  }\r\n};'
};
const blocks = {};
for (const lang of ['en', 'am', 'om', 'ti']) {
  const s = c.indexOf(lang + ': {') + (lang + ': {').length;
  const e = c.indexOf(markers[lang], s);
  blocks[lang] = { text: c.slice(s, e) };
}
function allPairs(t) {
  const re = /'([a-zA-Z_][a-zA-Z0-9_.]*)':\s*'((?:[^'\\]|\\.)*)'/g;
  const r = {}; let m;
  while ((m = re.exec(t)) !== null) r[m[1]] = m[2];
  return r;
}
const en = allPairs(blocks.en.text);
const am = allPairs(blocks.am.text);
const ti = allPairs(blocks.ti.text);

// Build glossary from ACTUAL existing translations
const gloss = {};
for (const [key, enVal] of Object.entries(en)) {
  const amVal = am[key];
  const tiVal = ti[key];
  if (amVal && amVal !== enVal) { if (!gloss[enVal]) gloss[enVal] = {}; gloss[enVal].am = amVal; }
  if (tiVal && tiVal !== enVal) { if (!gloss[enVal]) gloss[enVal] = {}; gloss[enVal].ti = tiVal; }
}
console.log('Glossary entries:', Object.keys(gloss).length);

// Find all untranslated keys with their English phrases
const sections = ['reports', 'reminders', 'audit_logs', 'contacts', 'orders', 'debt', 'expense', 'budgets', 'nav'];
for (const section of sections) {
  const enSection = Object.entries(en).filter(([k]) => k.startsWith(section + '.'));
  for (const [k, v] of enSection) {
    const a = am[k], t = ti[k];
    if ((!a || a === v) && (!t || t === v)) {
      const inGloss = gloss[v] ? ` (glossary: ${gloss[v].am || '?'}/${gloss[v].ti || '?'})` : ' (NOT in glossary)';
      console.log(`  '${k}': '${v}'${inGloss}`);
    }
  }
}
