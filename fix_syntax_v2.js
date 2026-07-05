const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'renderer', 'src', 'i18n', 'translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

let fixCount = 0;

// Fix missing comma after "closed_sunday: 'Sunday (Closed)'"
// Target the exact lines without a trailing comma
const patterns = [
  // Pattern: closed_sunday without trailing comma, followed by }
  ["closed_sunday: 'Sunday (Closed)'\n    }\n\n    orders:", "closed_sunday: 'Sunday (Closed)',\n    },\n\n    orders:"],
];

for (const [oldStr, newStr] of patterns) {
  const count = (content.match(new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  if (count > 0) {
    content = content.replaceAll(oldStr, newStr);
    fixCount += count;
    console.log(`Fixed ${count} occurrence(s) of: ${oldStr.substring(0, 50)}...`);
  } else {
    console.log(`Pattern not found: ${oldStr.substring(0, 50)}...`);
  }
}

// Also fix any remaining instances of just "closed_sunday: 'Sunday (Closed)'" without comma
// (that aren't already fixed by the above)
const lsCount = (content.match(/closed_sunday: 'Sunday \(Closed\)'[^,]/g) || []).length;
if (lsCount > 0) {
  content = content.replace(/closed_sunday: 'Sunday \(Closed\)'(?=[^,\n])/g, "closed_sunday: 'Sunday (Closed)',");
  fixCount += lsCount;
  console.log(`Fixed ${lsCount} additional closed_sunday comma issues`);
}

if (fixCount > 0) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`\nTotal fixes applied: ${fixCount}`);
} else {
  console.log('\nNo fixes were applied');
}
