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
  blocks[lang] = { start, end, text: c.slice(start, end) };
}

function extractPairs(text) {
  const re = /'([a-zA-Z_][a-zA-Z0-9_.]*)':\s*'((?:[^'\\]|\\.)*)'/g;
  const pairs = [];
  let m;
  while ((m = re.exec(text)) !== null) pairs.push({ key: m[1], value: m[2] });
  return pairs;
}

const enPairs = extractPairs(blocks.en.text);
const amPairs = extractPairs(blocks.am.text);
const tiPairs = extractPairs(blocks.ti.text);
const omPairs = extractPairs(blocks.om.text);

const en = {}; for (const p of enPairs) en[p.key] = p.value;
const am = {}; for (const p of amPairs) am[p.key] = p.value;
const ti = {}; for (const p of tiPairs) ti[p.key] = p.value;
const om = {}; for (const p of omPairs) om[p.key] = p.value;

// Build glossary from existing translations
const glossary = {};
for (const p of enPairs) {
  const amVal = am[p.key];
  const tiVal = ti[p.key];
  if (amVal && amVal !== p.value) {
    if (!glossary[p.value]) glossary[p.value] = {};
    glossary[p.value].am = amVal;
  }
  if (tiVal && tiVal !== p.value) {
    if (!glossary[p.value]) glossary[p.value] = {};
    glossary[p.value].ti = tiVal;
  }
}

const sections = ['reports', 'reminders', 'audit_logs', 'contacts', 'orders', 'debt', 'expense', 'budgets'];
const navSections = ['nav', 'sidebar', 'tabs', 'header'];

console.log('=== UNTRANSLATED KEYS IN TARGET SECTIONS ===\n');

for (const section of [...sections, ...navSections]) {
  const sectionKeys = enPairs.filter(p => p.key.startsWith(section + '.') || p.key === section);
  if (sectionKeys.length === 0) continue;
  
  let translated = 0;
  let untranslated = 0;
  const untranslatedList = [];
  
  for (const p of sectionKeys) {
    const amNeedsTrans = !am[p.key] || am[p.key] === p.value;
    const tiNeedsTrans = !ti[p.key] || ti[p.key] === p.value;
    
    if (amNeedsTrans || tiNeedsTrans) {
      untranslated++;
      const amGlossary = glossary[p.value];
      untranslatedList.push({
        key: p.key,
        en: p.value,
        amTransl: amGlossary?.am || null,
        tiTransl: amGlossary?.ti || null,
        amUntranslated: amNeedsTrans,
        tiUntranslated: tiNeedsTrans
      });
    } else {
      translated++;
    }
  }
  
  if (untranslatedList.length > 0) {
    console.log(`\n## ${section} (${sectionKeys.length} total keys, ${translated} translated, ${untranslated} untranslated)`);
    for (const u of untranslatedList) {
      const amStatus = u.amTransl ? `→ "${u.amTransl}"` : '(NO GLOSSARY)';
      const tiStatus = u.tiTransl ? `→ "${u.tiTransl}"` : '(NO GLOSSARY)';
      console.log(`  ${u.key}: "${u.en}"`);
      console.log(`    AM: ${amStatus}`);
      console.log(`    TI: ${tiStatus}`);
    }
  }
}
