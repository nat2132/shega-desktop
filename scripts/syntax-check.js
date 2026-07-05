const fs = require('fs');
const c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');
// Strip TypeScript type annotations to get plain JS
const js = c
  .replace(/:\s*(?:[a-zA-Z_$][\w$<>[\]',\s]*(?:\[key: string\]:\s*string)?)\s*=\s*/g, '=')
  .replace(/(?:as\s+const|as\s+string|as\s+[A-Za-z<>[\],\s]+)\s*;/, ';');
try {
  new Function(js);
  console.log('VALID');
} catch (e) {
  console.log('SYNTAX ERROR:', e.message.substring(0, 200));
}
