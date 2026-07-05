const fs = require('fs');
const c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');
const eol = '\r\n';

const markers = [
  { lang: 'en', start: 'en: {', end: '  },\r\n  am: {' },
  { lang: 'am', start: 'am: {', end: '  },\r\n  om: {' },
  { lang: 'om', start: 'om: {', end: '  },\r\n  ti: {' },
  { lang: 'ti', start: 'ti: {', end: '  }\r\n};' }
];

function extractBlock(content, langInfo) {
  const s = content.indexOf(langInfo.start) + langInfo.start.length;
  const e = content.indexOf(langInfo.end, s);
  return { text: content.slice(s, e), start: s, end: e };
}

function deduplicateBlock(text) {
  // Split into lines
  const lines = text.split(eol);
  const seen = new Set();
  const result = [];
  let dupCount = 0;

  for (const line of lines) {
    // Extract key name from flat key pattern
    const match = line.match(/^\s{4}'([a-zA-Z_][a-zA-Z0-9_.]*)':/);
    if (match) {
      const key = match[1];
      if (seen.has(key)) {
        dupCount++;
        continue; // skip duplicate
      }
      seen.add(key);
      result.push(line);
    } else {
      result.push(line);
    }
  }

  return { text: result.join(eol), dupCount };
}

let content = c;
const totalDuplicates = {};

for (const langInfo of markers) {
  const block = extractBlock(content, langInfo);
  const deduped = deduplicateBlock(block.text);

  if (deduped.dupCount > 0) {
    // Reassemble content
    content = content.slice(0, block.start) +
              deduped.text +
              content.slice(block.end);
    totalDuplicates[langInfo.lang] = deduped.dupCount;
    console.log(langInfo.lang + ': removed ' + deduped.dupCount + ' duplicates');
  } else {
    console.log(langInfo.lang + ': no duplicates');
  }
}

if (Object.keys(totalDuplicates).length > 0) {
  fs.writeFileSync('src/renderer/src/i18n/translations.ts', content, 'utf8');
  console.log('\nFile updated. Total duplicates removed: ' + Object.values(totalDuplicates).reduce((a, b) => a + b, 0));
} else {
  console.log('\nNo changes needed.');
}
