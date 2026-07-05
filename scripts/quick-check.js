const fs = require('fs');
const c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');
// Simple: just count all braces in vs out of strings
let depth = 0, inStr = false, bad = false;
for (let i = 0; i < c.length; i++) {
  const ch = c[i];
  if (ch === "'") { inStr = !inStr; continue; }
  if (inStr) continue;
  if (ch === '{') depth++;
  if (ch === '}') depth--;
}
console.log('Simple (no escape handling):', depth);

// Check if string mode ever ends incorrectly
inStr = false; bad = false;
for (let i = 0; i < c.length; i++) {
  const ch = c[i];
  if (ch === "'") inStr = !inStr;
}
console.log('String mode at end:', inStr, '(should be false)');
