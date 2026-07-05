const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, 'src', 'renderer', 'src', 'i18n', 'translations.ts'), 'utf8');
const lines = content.split('\n');

// Show lines around om settings section
console.log('=== OM SETTINGS AROUND system_check_desc ===');
for (let i = 3315; i < 3330; i++) {
  if (lines[i]) console.log((i+1) + ': ' + lines[i]);
}

console.log('\n=== OM ACTIVITY_LOGS SECTION ===');
for (let i = 3690; i < 3710; i++) {
  if (lines[i]) console.log((i+1) + ': ' + lines[i]);
}

console.log('\n=== OM DASHBOARD SECTION (around active_debts) ===');
for (let i = 3203; i < 3213; i++) {
  if (lines[i]) console.log((i+1) + ': ' + lines[i]);
}
