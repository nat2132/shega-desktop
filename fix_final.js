const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'renderer', 'src', 'i18n', 'translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

// The file should end with:
//     },
//   },
// };
// And nothing after.

// Find the last occurrence of "};" as the main closing
const lastSemiClose = content.lastIndexOf('};');
const afterMainClose = content.substring(lastSemiClose + 2).trim();

if (afterMainClose.length > 0) {
  console.log('Content after main closing brace:', JSON.stringify(afterMainClose));
  // Remove any content after the main }; 
  content = content.substring(0, lastSemiClose + 2) + '\n';
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Removed extra content after main closing');
}

// Verify brace balance
const newContent = fs.readFileSync(filePath, 'utf8');
const openCount = (newContent.match(/{/g) || []).length;
const closeCount = (newContent.match(/}/g) || []).length;
const lastLines = newContent.trimEnd().split('\n').slice(-5);
console.log('Final 5 lines:', lastLines);
console.log('Braces: opens=' + openCount + ', closes=' + closeCount + ', diff=' + (openCount - closeCount));
