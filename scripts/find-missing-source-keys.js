const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Read all translation keys from translations.ts
function allPairs(text) {
  const re = /'([a-zA-Z_][a-zA-Z0-9_.]*)':\s*'((?:[^'\\]|\\.)*)'/g;
  const r = {}; let m;
  while ((m = re.exec(text)) !== null) r[m[1]] = m[2];
  return r;
}

const transFile = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');
const enStart = transFile.indexOf('en: {');
const enEnd = transFile.indexOf('},\r\n  am: {');
const enBlock = transFile.slice(enStart + 5, enEnd);
const enFlat = allPairs(enBlock);

// Also extract nested object keys from EN
function extractNestedKeys(text) {
  const result = {};
  // Match section objects like: sectionName: { ... props ... },
  const sectionRe = /\n    ([a-zA-Z_]\w*): \{([\s\S]*?)\n    \},/g;
  let m;
  while ((m = sectionRe.exec(text)) !== null) {
    const section = m[1];
    const props = m[2];
    // Match property names within the section
    const propRe = /^\s{6}([a-zA-Z_]\w*):\s*'/gm;
    let p;
    while ((p = propRe.exec(props)) !== null) {
      result[section + '.' + p[1]] = true;
    }
  }
  return result;
}

const nestedKeys = extractNestedKeys(enBlock);

// Combine all existing keys
const allExistingKeys = new Set([...Object.keys(enFlat), ...Object.keys(nestedKeys)]);

// Now scan source code for t('key') patterns
const srcDir = 'src/renderer/src';
const files = glob.sync(srcDir + '/**/*.{tsx,ts}', { nodir: true, ignore: ['**/node_modules/**', '**/i18n/**'] });

const usedKeys = {};
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  // Find t('something') patterns
  const re = /t\(['"]([a-zA-Z_][a-zA-Z0-9_.]*)['"]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const key = m[1];
    if (!usedKeys[key]) usedKeys[key] = [];
    usedKeys[key].push(file);
  }
}

// Find missing keys
const missing = {};
for (const [key, files] of Object.entries(usedKeys)) {
  if (!allExistingKeys.has(key)) {
    missing[key] = files;
  }
}

// Group by section prefix
const bySection = {};
for (const [key, files] of Object.entries(missing)) {
  const section = key.includes('.') ? key.split('.')[0] : 'root';
  if (!bySection[section]) bySection[section] = {};
  bySection[section][key] = files;
}

console.log('=== MISSING TRANSLATION KEYS (used in code but not in translations.ts) ===\n');
let total = 0;
for (const [section, keys] of Object.entries(bySection).sort()) {
  console.log(`--- ${section} (${Object.keys(keys).length} keys) ---`);
  for (const [key, files] of Object.entries(keys)) {
    console.log(`  ${key}`);
    total++;
  }
  console.log('');
}
console.log(`Total missing keys: ${total}`);
