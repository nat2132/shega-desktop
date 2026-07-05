const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'renderer', 'src', 'i18n', 'translations.ts');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Track brace depth and find where unmatched opens are
let depth = 0;
let maxDepth = 0;
let lastOpenLine = 0;
let openSites = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/{/g) || []).length;
  const closes = (line.match(/}/g) || []).length;
  
  for (let j = 0; j < opens; j++) {
    openSites.push({ line: i + 1, depth: depth + j, text: line.trim().substring(0, 60) });
  }
  
  depth = depth + opens - closes;
  
  if (opens > 0) {
    lastOpenLine = i + 1;
  }
}

console.log('Total lines:', lines.length);
console.log('Final depth:', depth);
console.log('Max depth:', Math.max(...lines.map((_, i) => {
  let d = 0;
  for (let j = 0; j <= i; j++) {
    d += (lines[j].match(/{/g) || []).length - (lines[j].match(/}/g) || []).length;
  }
  return d;
})));

// Show the last few "open" sites (most recently opened objects)
console.log('\nLast 10 open sites (most recently opened objects):');
for (let i = Math.max(0, openSites.length - 10); i < openSites.length; i++) {
  console.log(`  Line ${openSites[i].line}: "${openSites[i].text}"`);
}

// If depth > 0, add the missing closing braces
if (depth > 0) {
  console.log(`\nNeed to add ${depth} closing braces`);
  content = content.trimEnd() + '\n';
  for (let i = 0; i < depth; i++) {
    const indent = '  '.repeat(Math.max(0, depth - i - 1));
    if (i < depth - 1) {
      content += indent + '},\n';
    } else {
      content += '};\n';
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Added missing closing braces');
}

// Also verify brace count now
const newContent = fs.readFileSync(filePath, 'utf8');
const openCount = (newContent.match(/{/g) || []).length;
const closeCount = (newContent.match(/}/g) || []).length;
console.log(`\nVerification: opens=${openCount}, closes=${closeCount}, diff=${openCount - closeCount}`);
