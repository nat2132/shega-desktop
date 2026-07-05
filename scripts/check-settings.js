const fs = require('fs');
const c = fs.readFileSync('src/renderer/src/i18n/translations.ts', 'utf8');

function findBlock(text, lang) {
  const markers = {
    en: { start: 'en: {', end: '  },\r\n  am: {' },
    am: { start: 'am: {', end: '  },\r\n  om: {' },
    om: { start: 'om: {', end: '  },\r\n  ti: {' },
    ti: { start: 'ti: {', end: '  }\r\n};' }
  };
  const s = text.indexOf(markers[lang].start) + markers[lang].start.length;
  const e = text.indexOf(markers[lang].end, s);
  return { text: text.slice(s, e), start: s, end: e };
}

const keys = ['settings.time_system', 'settings.time_system_desc', 'settings.device_time', 'settings.ethiopian_time', 'settings.support'];
for (const lang of ['en', 'am', 'om', 'ti']) {
  const block = findBlock(c, lang);
  const missing = keys.filter(k => !block.text.includes("'" + k + "'"));
  console.log(lang + ': missing ' + missing.join(', '));
}
