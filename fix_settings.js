const fs = require('fs');

const filePath = 'src/renderer/src/i18n/translations.ts';
let content = fs.readFileSync(filePath, 'utf8');
const hasCRLF = content.includes('\r\n');
if (hasCRLF) content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

// Find system_check_desc lines and insert settings after them
// but only if the next line is security_studio (meaning no settings keys exist yet)
const newSettings = {
  am: [
    "    'settings.time_system': '\\u12e8\\u1230\\u12e8\\u1275 \\u1235\\u122d\\u12d3\\u1275',",
    "    'settings.time_system_desc': '\\u1260\\u1218\\u1233\\u122d\\u12ea \\u1230\\u12e8\\u1275 \\u12a5\\u1293\\u1265 \\u1265\\u12a2\\u1276\\u1353\\u12eb \\u1230\\u12e8\\u1275 (6 AM = 12:00) \\u1218\\u12ab\\u12a8\\u120d \\u12ed\\u121d\\u1228\\u1321\\u1363',",
    "    'settings.device_time': '\\u1218\\u1233\\u122d\\u12ea',",
    "    'settings.ethiopian_time': '\\u12a2\\u1276\\u1353\\u12eb\\u12cb',",
    "    'settings.support': '\\u12e8\\u12f5\\u130d\\u134d \\u121b\\u12a5\\u12a8\\u120d',",
    "    'settings.support_desc': '\\u12a5\\u122d\\u12f3\\u1274 \\u12eb\\u130d\\u1295\\u1363 \\u1275\\u130d\\u122d\\u12cb\\u1295 \\u122a\\u1356\\u122d\\u1275 \\u12eb\\u12f5\\u122d\\u1301 \\u12a5\\u1293\\u1265 \\u12e8 Shega \\u1261\\u12f5\\u1295\\u1295 \\u12eb\\u1290\\u130d\\u130d\\u1229\\u1363',",
    "    'settings.avatar_title': '\\u12e8\\u1218\\u1308\\u1208\\u134b \\u1235\\u12d5\\u120d',",
    "    'settings.avatar_desc': '\\u1208\\u12a0\\u1235\\u1270\\u12f3\\u12f3\\u122a \\u1218\\u1208\\u12eb\\u12eb\\u12eb \\u12e8\\u1218\\u1308\\u1208\\u134b \\u1235\\u12d5\\u120d \\u12ed\\u121d\\u1228\\u1321\\u1363',",
    "    'settings.avatar_none': '\\u121d\\u1295\\u121d',",
    "    'settings.avatar_upload': '\\u134d\\u1276 \\u130b\\u1295',",
    "    'settings.avatar_saved': '\\u12a0\\u121d\\u1233\\u12eb \\u1270\\u12dd\\u121d\\u12d7\\u120d',",
  ],
  om: [
    "    'settings.time_system': 'Sirna Yeroo',",
    "    'settings.time_system_desc': 'Giddugala yeroo meeshaa fi yeroo Itoophiyaa (6 WA = 12:00) gidduu filadhu.',",
    "    'settings.device_time': 'Meeshaa',",
    "    'settings.ethiopian_time': 'Itoophiyaa',",
    "    'settings.support': 'Giddugala Gargaarsaa',",
    "    'settings.support_desc': 'Gargaarsa argachuu, rakkoolee gabaasuu, fi garee Shega wajjin quunnamii.',",
    "    'settings.avatar_title': 'Suuraa Kaarta Bifaati',",
    "    'settings.avatar_desc': 'Suuraa kaarta amala teessoo herrega gulaalaa keetiif filadhu.',",
    "    'settings.avatar_none': 'Homaa',",
    "    'settings.avatar_upload': 'Suuraa Feedi',",
    "    'settings.avatar_saved': 'Suuraa haaromfame',",
  ],
  ti: [
    "    'settings.time_system': '\\u1235\\u122d\\u12d3\\u1270 \\u130d\\u12dc',",
    "    'settings.time_system_desc': '\\u12a3\\u1265 \\u1218\\u1295\\u130d\\u12ee \\u130d\\u12dc \\u121c\\u120b \\u12a2\\u1276\\u1353\\u12eb\\u12cb \\u130d\\u12dc (6 AM = 12:00) \\u121d\\u1228\\u1321\\u1363',",
    "    'settings.device_time': '\\u1218\\u1233\\u122d\\u134b',",
    "    'settings.ethiopian_time': '\\u12a2\\u1276\\u1353\\u12eb\\u12cb',",
    "    'settings.support': '\\u1218\\u12a5\\u12a8\\u120d \\u12f0\\u130d\\u134d',",
    "    'settings.support_desc': '\\u134d\\u1308\\u12dd\\u12cd \\u122d\\u12a8\\u1271\\u1363 \\u133d\\u130d\\u121b\\u1275 \\u122a\\u1356\\u122d\\u1275 \\u130d\\u1261\\u1229\\u1363 \\u1295\\u1261\\u12f5\\u1295 Shega \\u12a3\\u1290\\u130d\\u130d\\u1229\\u1363',",
    "    'settings.avatar_title': '\\u121d\\u1235\\u120a \\u1218\\u1308\\u1208\\u1332',",
    "    'settings.avatar_desc': '\\u1295\\u1218\\u1208\\u12eb \\u12a3\\u1235\\u1270\\u12f3\\u12f3\\u122a\\u12bb \\u121d\\u1235\\u120a \\u1218\\u1308\\u1208\\u1332 \\u121d\\u1228\\u133d\\u1363',",
    "    'settings.avatar_none': '\\u12e8\\u120d\\u1265\\u12cb\\u1295',",
    "    'settings.avatar_upload': '\\u1235\\u12d5\\u120a \\u1338\\u12e0\\u1295',",
    "    'settings.avatar_saved': '\\u121d\\u1235\\u120a \\u1270\\u12db\\u1218\\u12f0',",
  ],
};

let changes = 0;

for (let i = 0; i < lines.length - 1; i++) {
  const line = lines[i];
  const nextLine = lines[i + 1];
  
  // Check if this line is system_check_desc and the next is security_studio (meaning no settings keys between)
  if (line.includes('settings.system_check_desc') && 
      nextLine.includes('settings.security_studio')) {
    
    let lang = null;
    if (line.includes('መተግበሪያው')) lang = 'am';
    else if (line.includes('mteeggabichi') || line.includes('sakatta')) lang = 'om';
    else if (line.includes('እቲ መተግበሪ') || line.includes('ሰርሓሉ')) lang = 'ti';
    
    if (lang && newSettings[lang]) {
      lines.splice(i + 1, 0, ...newSettings[lang]);
      changes++;
      console.log(`Added settings for ${lang} after line ${i + 1}`);
    }
  }
}

if (changes > 0) {
  const result = lines.join('\n');
  fs.writeFileSync(filePath, hasCRLF ? result.replace(/\n/g, '\r\n') : result, 'utf8');
  console.log(`\nTotal: ${changes} changes applied`);
} else {
  console.log('No changes applied. Checking patterns...');
  const scLines = lines.filter(l => l.includes('system_check_desc'));
  console.log(`Found ${scLines.length} system_check_desc lines`);
  scLines.forEach((l, idx) => {
    const idx2 = lines.indexOf(l);
    const next = idx2 < lines.length - 1 ? lines[idx2 + 1] : 'N/A';
    console.log(`  ${idx+1}. ${l.substring(0, 60)}...`);
    console.log(`     Next: ${next.substring(0, 50)}...`);
  });
}
