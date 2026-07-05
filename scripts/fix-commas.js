const fs = require('fs');
let c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');

// Fix missing trailing commas on settings lines in AM, OM, TI blocks
// Pattern: 'settings.xxx': 'value' should be 'settings.xxx': 'value',
const lines = c.split('\n');
let fixed = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Match: 4 spaces, 'settings.xxx': 'value' (no trailing comma)
  if (/^\s{4}'settings\.\w+':\s*'[^']*'$/.test(line.trimRight())) {
    lines[i] = line.trimRight() + ',';
    fixed++;
  }
}
c = lines.join('\n');
fs.writeFileSync('src/renderer/src/i18n/translations.ts', c, 'utf8');
console.log('Fixed ' + fixed + ' lines');
