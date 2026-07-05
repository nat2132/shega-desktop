const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'renderer', 'src', 'i18n', 'translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Check what the file currently ends with
const lastLine = content.trimEnd().split('\n').pop();
console.log('Last line:', JSON.stringify(lastLine));
console.log('File ends with:', JSON.stringify(content.slice(-30)));

// The file is truncated - missing the closing braces for ti section and main object.
// The expense_reminder object at indent 4 (12 spaces in original) ends with:
//     },   (closing expense_reminder)
// But then we need:
//   },     (closing ti section)
// };      (closing main translations object)

// The file ends with:
//       overdue_by: 'Overdue by {days} days',
//     },

// After the last '    },' we need to add:
//   },
// };

// Let's append the missing closing braces
content = content.trimEnd() + '\n  },\n};\n';

fs.writeFileSync(filePath, content, 'utf8');
console.log('Added missing closing braces');
