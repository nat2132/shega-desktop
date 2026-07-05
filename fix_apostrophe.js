const fs = require('fs');
const filePath = 'src/renderer/src/i18n/translations.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the unescaped apostrophe in 'Bu'aa Waliigalaa'
const oldStr = "'dashboard.gross_profit': 'Bu'aa Waliigalaa'";
const newStr = "'dashboard.gross_profit': 'Bu\\'aa Waliigalaa'";
content = content.replace(oldStr, newStr);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Fixed apostrophe in Bu'aa Waliigalaa");
