const fs = require('fs');
const c = fs.readFileSync('scripts/translate-sections.js', 'utf8');
const issues = [];
const lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.match(/am: [^'"{\s]/)) issues.push({line: i+1, text: line.trim()});
  if (line.match(/ti: [^'"{\s]/)) issues.push({line: i+1, text: line.trim()});
}
if (issues.length === 0) {
  console.log('All AM/TI values properly quoted!');
} else {
  issues.forEach(i => console.log('Line ' + i.line + ': ' + i.text));
}
