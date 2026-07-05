const fs = require('fs');
let c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');
const markers = { en: '  },\r\n  am: {', am: '  },\r\n  om: {', om: '  },\r\n  ti: {', ti: '  }\r\n};' };

// Get EN block
const enStart = c.indexOf('en: {') + 'en: {'.length;
const enEnd = c.indexOf(markers.en, enStart);
const enBlock = c.slice(enStart, enEnd);

// Find the analytics.most_used line end
const search = "'analytics.most_used': 'Most used'";
const idx = enBlock.indexOf(search);
if (idx === -1) { console.log('Not found!'); process.exit(1); }

// Find end of line after most_used
const lineEnd = enBlock.indexOf('\n', idx);
const afterLine = enBlock.indexOf('\n', lineEnd + 1);
console.log('Found at offset', idx, 'in EN block');
console.log('Line ends at', lineEnd);
console.log('Next line starts at', afterLine);
console.log('Current next line:', JSON.stringify(enBlock.slice(lineEnd + 1, afterLine + 40)));

// Create the insertion
const insertion = "\n    'analytics.prime_debtor_pool': 'Prime Debtors',\n" +
    "    'analytics.high_value_collections': 'High Value Collections',\n" +
    "    'analytics.view_all_receivables': 'View All Receivables',\n" +
    "    'analytics.export_intel': 'Export Intel',\n" +
    "    'analytics.velocity': 'Velocity',\n" +
    "    'analytics.revenue_yield': 'Revenue Yield',";

const newEnBlock = enBlock.slice(0, lineEnd) + insertion + enBlock.slice(lineEnd);
const result = c.slice(0, enStart) + newEnBlock + c.slice(enEnd);

fs.writeFileSync('src/renderer/src/i18n/translations.ts', result, 'utf8');
console.log('Added 6 orphan keys to EN block');
