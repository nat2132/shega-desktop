const fs = require('fs');
const lines = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8').split('\n');
let depth = 0, inStr = false, inTmpl = false, esc = false;
// Only show lines near block endings and where depth doesn't return to expected
for (let li = 0; li < lines.length; li++) {
  const line = lines[li];
  const prevDepth = depth;
  for (const ch of line) {
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === "'" && !inTmpl) { inStr = !inStr; continue; }
    if (ch === '`' && !inStr) { inTmpl = !inTmpl; continue; }
    if (inStr || inTmpl) continue;
    if (ch === '{') depth++;
    if (ch === '}') depth--;
  }
  // Show lines that look like block ends (contain '}' as first non-blank) or depth anomalies
  const trimmed = line.trim();
  if (trimmed === '}' || trimmed === '};' || trimmed.match(/^\},?\s*$/) || trimmed.match(/^\}\s*,\s*$/)) {
    console.log(`Line ${li+1}: depth ${prevDepth}->${depth}: ${trimmed}`);
  }
  if (depth < 0) {
    console.log(`NEGATIVE depth at line ${li+1}: ${trimmed}`);
  }
}
console.log('Final depth:', depth);
