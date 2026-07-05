const fs = require('fs');
const content = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');
const lines = content.split('\n');

let sections = {};
let currentLang = null;
let depthStack = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  const langMatch = line.match(/^\s{2}([a-z]+):\s*\{$/);
  if (langMatch) {
    currentLang = langMatch[1];
    sections[currentLang] = { start: i, keys: new Set(), nestedSections: {} };
    continue;
  }
  
  if (!currentLang) continue;
  
  const nestedMatch = line.match(/^\s{4}(\w+):\s*\{$/);
  if (nestedMatch) {
    depthStack.push(nestedMatch[1]);
    continue;
  }
  
  if (depthStack.length > 0) {
    const closingMatch = line.match(/^\s{4}\},?$/);
    if (closingMatch) {
      depthStack.pop();
      continue;
    }
    const keyMatch = line.match(/^\s{6}(\w+):\s+'/);
    if (keyMatch) {
      const sectionName = depthStack[depthStack.length - 1];
      sections[currentLang].keys.add(sectionName + '.' + keyMatch[1]);
      if (!sections[currentLang].nestedSections[sectionName]) {
        sections[currentLang].nestedSections[sectionName] = new Set();
      }
      sections[currentLang].nestedSections[sectionName].add(keyMatch[1]);
      continue;
    }
  } else {
    const flatMatch = line.match(/^\s{4}'([^']+)':/);
    if (flatMatch) {
      sections[currentLang].keys.add(flatMatch[1]);
    }
  }
}

console.log('=== SECTIONS FOUND ===');
Object.keys(sections).forEach(lang => {
  console.log(lang + ': ' + sections[lang].keys.size + ' keys');
});

const enKeys = sections['en'].keys;
const omKeys = sections['om'].keys;
const tiKeys = sections['ti'].keys;

const missingInOm = Array.from(enKeys).filter(k => !omKeys.has(k));
const missingInTi = Array.from(enKeys).filter(k => !tiKeys.has(k));

console.log('\n=== MISSING IN OM (' + missingInOm.length + ') ===');
missingInOm.sort().forEach(k => console.log(k));

console.log('\n=== MISSING IN TI (' + missingInTi.length + ') ===');
missingInTi.sort().forEach(k => console.log(k));

// Show which nested sections exist in each
console.log('\n=== NESTED SECTIONS ===');
for (const lang of ['en', 'om', 'ti']) {
  console.log('--- ' + lang + ' ---');
  const nested = sections[lang].nestedSections || {};
  Object.keys(nested).sort().forEach(s => {
    console.log('  ' + s + ': [' + Array.from(nested[s]).join(', ') + ']');
  });
}
