const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'renderer', 'src', 'i18n', 'translations.ts');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Count opens and closes
let opens = 0, closes = 0;
for (const line of lines) {
  opens += (line.match(/{/g) || []).length;
  closes += (line.match(/}/g) || []).length;
}
console.log(`Before: opens=${opens} closes=${closes} diff=${opens - closes}`);

// The file should end with OVERDUE_BY, then }, }, };
// Find the CORRECT endpoint: last overdue_by line
const lastOverdueIdx = content.lastIndexOf("overdue_by: 'Overdue by {days} days'");
if (lastOverdueIdx >= 0) {
  // Find end of this line (next \n)
  const lineEnd = content.indexOf('\n', lastOverdueIdx);
  if (lineEnd >= 0) {
    // Keep everything up to AND INCLUDING this line
    const cleanContent = content.substring(0, lineEnd + 1);
    // Add the correct closing structure
    const fixedContent = cleanContent + '    },\n  },\n};\n';
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    
    const newContent = fs.readFileSync(filePath, 'utf8');
    const newLines = newContent.split('\n');
    const newOpens = (newContent.match(/{/g) || []).length;
    const newCloses = (newContent.match(/}/g) || []).length;
    
    console.log(`After: lines=${newLines.length} opens=${newOpens} closes=${newCloses} diff=${newOpens - newCloses}`);
    console.log('Last 4 lines:', newLines.slice(-5));
  }
}
