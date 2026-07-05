const fs = require('fs');
const path = require('path');

const srcDir = 'src/renderer/src';

function walkDir(dir) {
  const results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('i18n') && !item.includes('.git')) {
        results.push(...walkDir(fullPath));
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        results.push(fullPath);
      }
    }
  } catch (e) { /* ignore */ }
  return results;
}

const files = walkDir(srcDir);

// Read all existing translation keys
const transContent = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');

function allPairs(text) {
  const re = /'([a-zA-Z_][a-zA-Z0-9_.]*)':\s*'((?:[^'\\]|\\.)*)'/g;
  const r = {}; let m;
  while ((m = re.exec(text)) !== null) r[m[1]] = m[2];
  return r;
}

const enStart = transContent.indexOf('en: {');
const enEnd = transContent.indexOf('},\r\n  am: {');
const enBlock = transContent.slice(enStart + 5, enEnd);
const enFlat = allPairs(enBlock);

// Nested keys
function extractNestedKeys(text) {
  const result = {};
  const sectionRe = /\n    ([a-zA-Z_]\w*): \{([\s\S]*?)\n    \},/g;
  let m;
  while ((m = sectionRe.exec(text)) !== null) {
    const section = m[1];
    const props = m[2];
    const propRe = /^\s{6}([a-zA-Z_]\w*):\s*'/gm;
    let p;
    while ((p = propRe.exec(props)) !== null) {
      result[section + '.' + p[1]] = true;
    }
  }
  return result;
}
const nestedKeys = extractNestedKeys(enBlock);
const allExisting = new Set([...Object.keys(enFlat), ...Object.keys(nestedKeys)]);

// Collect all used keys from source
const usedKeys = {};

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const re = /t\(\s*['"]([a-zA-Z_][a-zA-Z0-9_.]*)['"]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const key = m[1];
    if (!usedKeys[key]) usedKeys[key] = [];
    usedKeys[key].push(file);
  }
}

// Find missing
const missing = {};
for (const [key, srcFiles] of Object.entries(usedKeys)) {
  if (!allExisting.has(key)) {
    missing[key] = srcFiles;
  }
}

// Group by section
const bySection = {};
for (const [key, srcFiles] of Object.entries(missing)) {
  const section = key.includes('.') ? key.split('.')[0] : 'root';
  if (!bySection[section]) bySection[section] = {};
  bySection[section][key] = srcFiles;
}

console.log('=== MISSING TRANSLATION KEYS (in source code but not in translations.ts) ===\n');
let total = 0;
let uniquePhrases = new Set();
for (const [section, keys] of Object.entries(bySection).sort()) {
  console.log(`--- ${section} (${Object.keys(keys).length} keys) ---`);
  for (const [key, srcFiles] of Object.entries(keys)) {
    console.log(`  ${key}`);
    total++;
  }
  console.log('');
}
console.log(`Total missing keys: ${total}`);
