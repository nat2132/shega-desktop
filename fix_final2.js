const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'renderer', 'src', 'i18n', 'translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Find where the ti expense_reminder section ends, then ensure clean closing
// The correct ending should be:
//     },
//   },
// };

// Find the last "overdue_by: '{days} days'" which is the last unique content line
const lastContentMarker = "overdue_by: 'Overdue by {days} days'";
const lastContentIdx = content.lastIndexOf(lastContentMarker);
if (lastContentIdx >= 0) {
  // Find the end of that line
  const lineEnd = content.indexOf('\n', lastContentIdx);
  if (lineEnd >= 0) {
    // Keep everything up to and including this line
    const beforeCut = content.substring(0, lineEnd + 1);
    // Add proper closing braces
    const correctEnding = beforeCut + '    },\n  },\n};\n';
    fs.writeFileSync(filePath, correctEnding, 'utf8');
    
    const newContent = fs.readFileSync(filePath, 'utf8');
    const openCount = (newContent.match(/{/g) || []).length;
    const closeCount = (newContent.match(/}/g) || []).length;
    const lastLines = newContent.trimEnd().split('\n').slice(-5);
    console.log('Final 5 lines:', lastLines);
    console.log('Braces: opens=' + openCount + ', closes=' + closeCount + ', diff=' + (openCount - closeCount));
  }
}
