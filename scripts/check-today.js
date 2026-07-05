const fs = require('fs');
const c = fs.readFileSync('scripts/translate-sections.js', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (l.includes("Today")) {
    console.log('Line ' + (i+1) + ': ' + JSON.stringify(l));
  }
});
