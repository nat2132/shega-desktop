const fs = require('fs');
const c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');
const lines = c.split('\n');
const todayLines = lines.filter(l => l.includes('today_attendance'));
todayLines.forEach((l, i) => {
  console.log('Line ' + (lines.indexOf(l) + 1) + ': ' + JSON.stringify(l));
});
