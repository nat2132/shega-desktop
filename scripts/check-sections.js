const fs = require('fs');
const c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');

const blocks = {};
const markers = {
  en: '  },\r\n  am: {',
  am: '  },\r\n  om: {',
  om: '  },\r\n  ti: {',
  ti: '  }\r\n};'
};

for (const lang of ['en', 'am', 'om', 'ti']) {
  const start = c.indexOf(lang + ': {') + (lang + ': {').length;
  const end = c.indexOf(markers[lang], start);
  blocks[lang] = { text: c.slice(start, end) };
}

function extractPairs(text) {
  const re = /'([a-zA-Z_][a-zA-Z0-9_.]*)':\s*'((?:[^'\\]|\\.)*)'/g;
  const pairs = [];
  let m;
  while ((m = re.exec(text)) !== null) pairs.push({ key: m[1], value: m[2] });
  return pairs;
}

const en = {}; for (const p of extractPairs(blocks.en.text)) en[p.key] = p.value;
const am = {}; for (const p of extractPairs(blocks.am.text)) am[p.key] = p.value;
const ti = {}; for (const p of extractPairs(blocks.ti.text)) ti[p.key] = p.value;

const sections = ['reports', 'reminders', 'audit_logs', 'contacts', 'orders', 'debt', 'expense', 'budgets', 'nav', 'sidebar', 'tabs', 'header'];
let totalTotal = 0;
let totalUntranslated = 0;

for (const section of sections) {
  const keys = Object.keys(en).filter(k => k.startsWith(section + '.') || k === section);
  if (keys.length === 0) continue;
  let untranslated = 0;
  for (const k of keys) {
    if ((!am[k] || am[k] === en[k]) || (!ti[k] || ti[k] === en[k])) untranslated++;
  }
  const translated = keys.length - untranslated;
  totalTotal += keys.length;
  totalUntranslated += untranslated;
  const pct = keys.length > 0 ? Math.round(translated / keys.length * 100) : 0;
  console.log(`${section}: ${translated}/${keys.length} translated (${pct}%)`);
}

console.log(`\nTotal: ${totalTotal - totalUntranslated}/${totalTotal} translated (${Math.round((totalTotal - totalUntranslated) / totalTotal * 100)}%)`);
