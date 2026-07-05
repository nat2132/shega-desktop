const fs = require('fs');
const c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');

const amStart = c.indexOf('am: {') + 'am: {'.length;
const amEnd = c.indexOf('  },\r\n  om: {');
const amText = c.slice(amStart, amEnd);

const key = 'reports.col_gross_profit';
const search = `'${key}': `;
const idx = amText.indexOf(search);
console.log('Found at idx:', idx);
if (idx >= 0) {
  const context = amText.slice(idx, idx + 100);
  console.log('Context:', JSON.stringify(context));
  const valStart = idx + search.length;
  console.log('Char at valStart:', JSON.stringify(amText[valStart]));
  const quote = amText[valStart];
  if (quote === "'") {
    const valEnd = amText.indexOf(quote, valStart + 1);
    console.log('Value from', valStart, 'to', valEnd);
    console.log('Old value:', amText.slice(valStart, valEnd + 1));
  }
}
