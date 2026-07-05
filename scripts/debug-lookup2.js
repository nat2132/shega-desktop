const fs = require('fs');
const c = fs.readFileSync('scripts/translate-sections.js', 'utf8');
const start = c.indexOf('const amTiTranslations = {') + 'const amTiTranslations = {'.length;
let depth = 1;
let end = start;
while (depth > 0 && end < c.length) {
  if (c[end] === '{') depth++;
  else if (c[end] === '}') depth--;
  end++;
}
const translationsText = c.slice(start, end - 1);

// Extract lines from the dict region
const lines = translationsText.split('\n').filter(l => l.trim().startsWith('"') || l.trim().startsWith("'"));
const withDoubleQuotes = lines.filter(l => l.trim().startsWith('"'));
const withSingleQuotes = lines.filter(l => l.trim().startsWith("'"));

console.log('Lines starting with double quotes:', withDoubleQuotes.length);
console.log('Lines starting with single quotes:', withSingleQuotes.length);

// Show the first few double-quoted keys
console.log('\nFirst 5 double-quoted keys:');
withDoubleQuotes.slice(0, 5).forEach(l => console.log('  ' + l.trim()));

// Now test the actual regex the script uses for matching
function allPairs(text) {
  // Same regex as allPairs but matching both quote types
  const re_single = /'([a-zA-Z_][a-zA-Z0-9_.]*)':\s*'((?:[^'\\]|\\.)*)'/g;
  const r = {}; let m;
  while ((m = re_single.exec(text)) !== null) r[m[1]] = m[2];
  return r;
}

// Check the allPairs extraction from EN block
const ts = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');
const markers = { en: '  },\r\n  am: {', am: '  },\r\n  om: {', om: '  },\r\n  ti: {', ti: '  }\r\n};' };
const enBlock = ts.slice(
  ts.indexOf('en: {') + 'en: {'.length,
  ts.indexOf(markers.en)
);
const enPairs = allPairs(enBlock);

// Now let's see what the debug regex actually matches from amTiTranslations
// The regex in debug-lookup.js: /'((?:[^'\\]|\\.)*)':\s*\{[^}]*\}/g
const re2 = /'((?:[^'\\]|\\.)*)':\s*\{[^}]*\}/g;
let m2;
const matched = [];
while ((m2 = re2.exec(translationsText)) !== null) {
  matched.push(m2[1]);
}
console.log('\nKeys matched by single-quote regex from amTiTranslations:', matched.length);
console.log('First 5:', matched.slice(0, 5));
console.log('Contains "PIN":', matched.includes('PIN'));
console.log('Contains "Value":', matched.includes('Value'));

// Now test with double-quote regex also
const re3 = /"((?:[^"\\]|\\.)*)":\s*\{[^}]*\}/g;
let m3;
const matchedDq = [];
while ((m3 = re3.exec(translationsText)) !== null) {
  matchedDq.push(m3[1]);
}
console.log('\nKeys matched by double-quote regex from amTiTranslations:', matchedDq.length);
console.log('First 5:', matchedDq.slice(0, 5));
console.log('Contains "Today\\\\\'s Attendance":', matchedDq.includes("Today\\'s Attendance"));
