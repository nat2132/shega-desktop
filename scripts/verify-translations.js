const fs = require('fs');
const c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');
const markers = {
  en: '  },\r\n  am: {',
  am: '  },\r\n  om: {',
  om: '  },\r\n  ti: {',
  ti: '  }\r\n};'
};
const blocks = {};
for (const lang of ['en', 'am', 'om', 'ti']) {
  const s = c.indexOf(lang + ': {') + (lang + ': {').length;
  const e = c.indexOf(markers[lang], s);
  blocks[lang] = { start: s, end: e, text: c.slice(s, e) };
}
const lens = Object.fromEntries(Object.entries(blocks).map(([k, v]) => [k, v.text.length]));
console.log('Block lengths:', JSON.stringify(lens));

function allPairs(text) {
  const re = /'([a-zA-Z_][a-zA-Z0-9_.]*)':\s*'((?:[^'\\]|\\.)*)'/g;
  const r = {}; let m;
  while ((m = re.exec(text)) !== null) r[m[1]] = m[2];
  return r;
}

const en = allPairs(blocks.en.text);
const am = allPairs(blocks.am.text);
const ti = allPairs(blocks.ti.text);
console.log(`EN keys: ${Object.keys(en).length}`);
console.log(`AM keys: ${Object.keys(am).length}`);
console.log(`TI keys: ${Object.keys(ti).length}`);

// Count how many AM/TI keys differ from EN
let amTranslated = 0, tiTranslated = 0;
for (const [k, v] of Object.entries(en)) {
  if (am[k] && am[k] !== v) amTranslated++;
  if (ti[k] && ti[k] !== v) tiTranslated++;
}
console.log(`AM different from EN: ${amTranslated}`);
console.log(`TI different from EN: ${tiTranslated}`);

// Check specific sections
const sections = ['reports', 'reminders', 'audit_logs', 'contacts', 'orders', 'debt', 'expense', 'budgets', 'nav'];
for (const section of sections) {
  const enSection = Object.entries(en).filter(([k]) => k.startsWith(section + '.'));
  const amSectionUntranslated = enSection.filter(([k, v]) => am[k] === v);
  const tiSectionUntranslated = enSection.filter(([k, v]) => ti[k] === v);
  console.log(`\n${section}: total=${enSection.length}`);
  console.log(`  AM untranslated: ${amSectionUntranslated.length}`);
  console.log(`  TI untranslated: ${tiSectionUntranslated.length}`);
}

// Verify col_gross_profit
console.log('\n--- col_gross_profit ---');
for (const lang of ['en', 'am', 'om', 'ti']) {
  const val = allPairs(blocks[lang].text)['reports.col_gross_profit'];
  console.log(`  ${lang}: ${val}`);
}
