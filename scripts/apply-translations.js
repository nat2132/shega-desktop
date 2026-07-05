const fs = require('fs');
let c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');

const blocks = {};
const markers = {
  en: '  },\r\n  am: {',
  am: '  },\r\n  om: {',
  om: '  },\r\n  ti: {',
  ti: '  }\r\n};'
};

for (const lang of ['en', 'am', 'om', 'ti']) {
  const start = c.indexOf(lang + ': {') + (lang + ': {').length;
  const end = c.indexOf(markers[lang], start);
  blocks[lang] = { start, end, text: c.slice(start, end) };
}

function extractPairs(text) {
  const re = /'([a-zA-Z_][a-zA-Z0-9_.]*)':\s*'((?:[^'\\]|\\.)*)'/g;
  const pairs = [];
  for (const m of text.matchAll(re)) {
    pairs.push({ key: m[1], value: m[2], idx: m.index, len: m[0].length });
  }
  return pairs;
}

const enPairs = extractPairs(blocks.en.text);

const glossary = {};
for (const lang of ['am', 'ti']) {
  for (const p of extractPairs(blocks[lang].text)) {
    const en = enPairs.find(x => x.key === p.key);
    if (en && p.value !== en.value && p.value) {
      if (!glossary[en.value]) glossary[en.value] = {};
      glossary[en.value][lang] = p.value;
    }
  }
}

let modified = false;
let amCount = 0, tiCount = 0;

for (const lang of ['am', 'ti']) {
  const block = blocks[lang];
  const pairs = extractPairs(block.text);
  
  for (const p of pairs) {
    const en = enPairs.find(x => x.key === p.key);
    if (!en || p.value !== en.value) continue;
    const trans = glossary[en.value]?.[lang];
    if (!trans) continue;
    
    const oldStr = `'${p.key}': '${p.value}'`;
    const newStr = `'${p.key}': '${trans}'`;
    const globalStart = block.start + p.idx;
    const before = c.slice(0, globalStart);
    const after = c.slice(globalStart + oldStr.length);
    if (c.slice(globalStart, globalStart + oldStr.length) === oldStr) {
      c = before + newStr + after;
      modified = true;
      if (lang === 'am') amCount++; else tiCount++;
    }
  }
}

console.log(`AM translated: ${amCount}`);
console.log(`TI translated: ${tiCount}`);

if (modified) {
  fs.writeFileSync('src/renderer/src/i18n/translations.ts', c, 'utf8');
  console.log('File updated.');
} else {
  console.log('No changes needed.');
}
