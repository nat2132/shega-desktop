const fs = require('fs');
const c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');

// Check if audit_logs is nested or flat
const enStart = c.indexOf('en: {') + 'en: {'.length;
const enEnd = c.indexOf('  },\r\n  am: {', enStart);
const enBlock = c.slice(enStart, enEnd);

// Check format
const auditLines = enBlock.split('\n').filter(l => l.includes('audit_logs'));
console.log('audit_logs lines in EN:');
auditLines.forEach((l, i) => console.log('  ' + l));
