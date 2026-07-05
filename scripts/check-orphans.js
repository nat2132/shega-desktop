const fs = require('fs');
const c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');

// Check for analytics orphan keys in AM/TI/OM but not EN
const orphans = [
  'analytics.prime_debtor_pool',
  'analytics.high_value_collections',
  'analytics.view_all_receivables',
  'analytics.export_intel',
  'analytics.velocity',
  'analytics.revenue_yield'
];

// Check in which blocks each key exists
const blocks = {
  en: [c.indexOf('en: {') + 'en: {'.length, c.indexOf('  },\r\n  am: {')],
  am: [c.indexOf('am: {') + 'am: {'.length, c.indexOf('  },\r\n  om: {')],
  om: [c.indexOf('om: {') + 'om: {'.length, c.indexOf('  },\r\n  ti: {')],
  ti: [c.indexOf('ti: {') + 'ti: {'.length, c.indexOf('  }\r\n};')]
};

for (const key of orphans) {
  const foundIn = [];
  for (const [lang, [start, end]] of Object.entries(blocks)) {
    const text = c.slice(start, end);
    const re = new RegExp("'" + key.replace('.', '\\.') + "':\\s*'");
    if (re.test(text)) foundIn.push(lang);
  }
  console.log(key + ': found in ' + foundIn.join(', '));
}

// Find the English values for the orphans by looking at source code t() calls
// These keys exist in AM/TI/OM but not EN - we need to add them to EN
