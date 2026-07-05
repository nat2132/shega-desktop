const fs = require('fs');

const filePath = 'src/renderer/src/i18n/translations.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings for reliable matching
const hasCRLF = content.includes('\r\n');
const originalContent = content;
if (hasCRLF) content = content.replace(/\r\n/g, '\n');

let changes = 0;

// ====== 1. AM section - Add audit_logs keys ======
const amActivityTarget = `    'activity_logs.no_logs': '\u121d\u1295\u121d \u12e8\u12a5\u1295\u1245\u1235\u1243\u1234 \u1218\u12dd\u1308\u1265 \u12a0\u120d\u1270\u1308\u1298\u121d',\n    'auth.sign_in': '\u130d\u1261\u1233',`;
const amActivityReplace = `    'activity_logs.no_logs': '\u121d\u1295\u121d \u12e8\u12a5\u1295\u1245\u1235\u1243\u1234 \u1218\u12dd\u1308\u1265 \u12a0\u120d\u1270\u1308\u1298\u121d',\n    'audit_logs.title': '\u12e8\u12a6\u12f0\u1275 \u1218\u12dd\u1308\u1265',\n    'audit_logs.subtitle': '\u12e8\u121b\u12ed\u1208\u12c8\u1295\u130d \u12e8\u1209\u1209\u121d \u1208\u12cd\u133c\u1275 \u12a6\u12f0\u1275 \u12f1\u12ab',\n    'audit_logs.search': '\u12e8\u12a6\u12f0\u1275 \u1218\u12dd\u1308\u1265 \u1348\u120d\u130d...',\n    'audit_logs.refresh': '\u12a0\u12f5\u1235',\n    'audit_logs.filter': '\u12a0\u1323\u122b',\n    'audit_logs.all_actions': '\u1209\u1209\u121d \u12f5\u122d\u130a\u1275\u12cb',\n    'audit_logs.all_entities': '\u1209\u1209\u121d \u12a0\u12ab\u120b\u1275',\n    'audit_logs.from': '\u12a8',\n    'audit_logs.to': '\u12c8\u12f0',\n    'audit_logs.by': '\u1260',\n    'audit_logs.no_logs': '\u121d\u1295\u121d \u12e8\u12a6\u12f0\u1275 \u1218\u12dd\u1308\u1265 \u12a0\u120d\u1270\u1308\u1298\u121d',\n    'auth.sign_in': '\u130d\u1261\u1233',`;

if (content.includes(amActivityTarget) && !content.includes(`'audit_logs.title': '\u12e8\u12a6\u12f0\u1275 \u1218\u12dd\u1308\u1265'`)) {
  content = content.replace(amActivityTarget, amActivityReplace);
  changes++;
  console.log('Added AM audit_logs keys');
}

// ====== 2. AM section - Add settings keys ======
const amSettingsTarget = `    'settings.system_check_desc': '\u1218\u1270\u130d\u1261\u122d\u12ea\u12eb\u12cd \u1265\u121a\u1230\u122b\u1275 \u1265\u12d8 \u1323\u12f0\u12cd \u1235\u122d\u12d3\u1275 \u12a0\u1265 \u1230\u12e8\u1275 2 \u12f0\u1245\u1218\u12cd \u12a0\u12f3\u12f2\u1235 \u121b\u1295\u1241\u12eb\u12cb\u1295 \u12ed\u1348\u1275\u122d \u123d\u121d\u1363',\n    'settings.security_studio': '\u12e8\u12f0\u1205\u1295\u1200\u1275 \u1235\u1275\u12f0\u12ee\u12ed\u12ee',`;
const amSettingsReplace = `    'settings.system_check_desc': '\u1218\u1270\u130d\u1261\u122d\u12ea\u12eb\u12cd \u1265\u121a\u1230\u122b\u1275 \u1265\u12d8 \u1323\u12f0\u12cd \u1235\u122d\u12d3\u1275 \u12a0\u1265 \u1230\u12e8\u1275 2 \u12f0\u1245\u1218\u12cd \u12a0\u12f3\u12f2\u1235 \u121b\u1295\u1241\u12eb\u12cb\u1295 \u12ed\u1348\u1275\u122d \u123d\u121d\u1363',\n    'settings.time_system': '\u12e8\u1230\u12e8\u1275 \u1235\u122d\u12d3\u1275',\n    'settings.time_system_desc': '\u1260\u1218\u1233\u122d\u12ea \u1230\u12e8\u1275 \u12a5\u1293\u1265 \u1265\u12a2\u1276\u1353\u12eb \u1230\u12e8\u1275 (6 AM = 12:00) \u1218\u12ab\u12a8\u120d \u12ed\u121d\u1228\u1321\u1363',\n    'settings.device_time': '\u1218\u1233\u122d\u12ea',\n    'settings.ethiopian_time': '\u12a2\u1276\u1353\u12eb\u12cb',\n    'settings.support': '\u12e8\u12f5\u130d\u134d \u121b\u12a5\u12a8\u120d',\n    'settings.support_desc': '\u12a5\u122d\u12f3\u1274 \u12eb\u130d\u1295\u1363 \u1275\u130d\u122d\u12cb\u1295 \u122a\u1356\u122d\u1275 \u12eb\u12f5\u122d\u1301 \u12a5\u1293\u1265 \u12e8 Shega \u1261\u12f5\u1295\u1295 \u12eb\u1290\u130d\u130d\u1229\u1363',\n    'settings.avatar_title': '\u12e8\u1218\u1308\u1208\u134b \u1235\u12d5\u120d',\n    'settings.avatar_desc': '\u1208\u12a0\u1235\u1270\u12f3\u12f3\u122a \u1218\u1208\u12eb\u12eb\u12eb \u12e8\u1218\u1308\u1208\u134b \u1235\u12d5\u120d \u12ed\u121d\u1228\u1321\u1363',\n    'settings.avatar_none': '\u121d\u1295\u121d',\n    'settings.avatar_upload': '\u134d\u1276 \u130b\u1295',\n    'settings.avatar_saved': '\u12a0\u121d\u1233\u12eb \u1270\u12dd\u121d\u12d7\u120d',\n    'settings.security_studio': '\u12e8\u12f0\u1205\u1295\u1200\u1275 \u1235\u1275\u12f0\u12ee\u12ed\u12ee',`;

if (content.includes(amSettingsTarget) && !content.includes(`'settings.time_system': '\u12e8\u1230\u12e8\u1275 \u1235\u122d\u12d3\u1275'`)) {
  content = content.replace(amSettingsTarget, amSettingsReplace);
  changes++;
  console.log('Added AM settings keys');
}

// ====== 3. OM section - Add audit_logs keys ======
const omActivityTarget = `    'activity_logs.no_logs': 'Galmeen sochii hin argamne',\n    'auth.sign_in': 'Seeni',`;
const omActivityReplace = `    'activity_logs.no_logs': 'Galmeen sochii hin argamne',\n    'audit_logs.title': 'Galmee Qormaata',\n    'audit_logs.subtitle': 'Iskuuddardii jijjiirama hunda kan hin jijjiiramne',\n    'audit_logs.search': 'Galmee qormaata barbaadi...',\n    'audit_logs.refresh': 'Haaromsi',\n    'audit_logs.filter': 'Calmaansi',\n    'audit_logs.all_actions': 'Gochaalee Hunda',\n    'audit_logs.all_entities': 'Uumamoota Hunda',\n    'audit_logs.from': 'Irraa',\n    'audit_logs.to': 'Gara',\n    'audit_logs.by': 'Kan raawwate',\n    'audit_logs.no_logs': 'Galmee qormaata hin argamne',\n    'auth.sign_in': 'Seeni',`;

if (content.includes(omActivityTarget) && !content.includes(`'audit_logs.title': 'Galmee Qormaata'`)) {
  content = content.replace(omActivityTarget, omActivityReplace);
  changes++;
  console.log('Added OM audit_logs keys');
}

// ====== 4. OM section - Add settings keys ======
// The OM system_check_desc contains an apostrophe, so we need to handle it carefully
const omSettingsTarget = `    'settings.system_check_desc': 'Sirni kun yeroo mteeggabichi hojjetutti daqiiqaa 2 hunda beeksisa haaraa ni sakatta'a.',\n    'settings.security_studio': 'Stuudiyoo Nageenyaa',`;
const omSettingsReplace = `    'settings.system_check_desc': 'Sirni kun yeroo mteeggabichi hojjetutti daqiiqaa 2 hunda beeksisa haaraa ni sakatta'a.',\n    'settings.time_system': 'Sirna Yeroo',\n    'settings.time_system_desc': 'Giddugala yeroo meeshaa fi yeroo Itoophiyaa (6 WA = 12:00) gidduu filadhu.',\n    'settings.device_time': 'Meeshaa',\n    'settings.ethiopian_time': 'Itoophiyaa',\n    'settings.support': 'Giddugala Gargaarsaa',\n    'settings.support_desc': 'Gargaarsa argachuu, rakkoolee gabaasuu, fi garee Shega wajjin quunnamii.',\n    'settings.avatar_title': 'Suuraa Kaarta Bifaati',\n    'settings.avatar_desc': 'Suuraa kaarta amala teessoo herrega gulaalaa keetiif filadhu.',\n    'settings.avatar_none': 'Homaa',\n    'settings.avatar_upload': 'Suuraa Feedi',\n    'settings.avatar_saved': 'Suuraa haaromfame',\n    'settings.security_studio': 'Stuudiyoo Nageenyaa',`;

if (content.includes(omSettingsTarget) && !content.includes(`'settings.time_system': 'Sirna Yeroo'`)) {
  content = content.replace(omSettingsTarget, omSettingsReplace);
  changes++;
  console.log('Added OM settings keys');
}

// ====== 5. TI section - Add audit_logs keys ======
const tiActivityTarget = `    'activity_logs.no_logs': '\u1218\u12dd\u1308\u1265 \u1295\u1345\u1295\u1270\u1275 \u12a3\u12ed\u1270\u1228\u1295\u1295\u1265\u1264\u1295',\n    'auth.sign_in': '\u12a5\u1276',`;
const tiActivityReplace = `    'activity_logs.no_logs': '\u1218\u12dd\u1308\u1265 \u1295\u1345\u1295\u1270\u1275 \u12a3\u12ed\u1270\u1228\u1295\u1295\u1265\u1264\u1295',\n    'audit_logs.title': '\u1218\u12dd\u1308\u1265 \u121d\u122d\u1218\u122b',\n    'audit_logs.subtitle': '\u12a3\u120d\u1270\u1208\u12c8\u1309\u1275\u12cd \u12f1\u12ab \u121d\u122d\u1218\u122b \u12a8\u1209\u1209 \u1208\u12cd\u1325\u1275\u12cd',\n    'audit_logs.search': '\u1218\u12dd\u1308\u1265 \u121d\u122d\u1218\u122b \u12f5\u1208\u12eb...',\n    'audit_logs.refresh': '\u12a3\u13f5\u12f5\u1235',\n    'audit_logs.filter': '\u134d\u1228\u12ed',\n    'audit_logs.all_actions': '\u12a8\u1209\u1209 \u1270\u130d\u1263\u122b\u1275',\n    'audit_logs.all_entities': '\u12a8\u1209\u1209 \u12a3\u12ab\u120b\u1275',\n    'audit_logs.from': '\u12ab\u1265',\n    'audit_logs.to': '\u1293\u1265',\n    'audit_logs.by': '\u1265',\n    'audit_logs.no_logs': '\u1218\u12dd\u1308\u1265 \u121d\u122d\u1218\u122b \u12a3\u12ed\u1270\u1228\u1295\u1275\u1265\u1295',\n    'auth.sign_in': '\u12a5\u1276',`;

if (content.includes(tiActivityTarget) && !content.includes(`'audit_logs.title': '\u1218\u12dd\u1308\u1265 \u121d\u122d\u1218\u122b'`)) {
  content = content.replace(tiActivityTarget, tiActivityReplace);
  changes++;
  console.log('Added TI audit_logs keys');
}

// ====== 6. TI section - Add settings keys ======
const tiSettingsTarget = `    'settings.system_check_desc': '\u12a5\u1271 \u1218\u1270\u130d\u1261\u122a \u12a3\u1265 \u12dd\u1230\u122d\u134d\u1209\u130d \u130d\u12dc \u1235\u122d\u12d3\u1275 \u12a3\u1265 \u1230\u12e8\u1275 2 \u12f0\u1245\u1218\u12cd \u134d\u12f5\u1235\u1271 \u1218\u130d\u1295\u1275\u1264\u1275\u1275 \u12ed\u134d\u1275\u123d\u1363',\n    'settings.security_studio': '\u1235\u1275\u12f0\u12ee\u12ed\u12ee \u133d\u133d\u1273',`;
const tiSettingsReplace = `    'settings.system_check_desc': '\u12a5\u1271 \u1218\u1270\u130d\u1261\u122a \u12a3\u1265 \u12dd\u1230\u122d\u134d\u1209\u130d \u130d\u12dc \u1235\u122d\u12d3\u1275 \u12a3\u1265 \u1230\u12e8\u1275 2 \u12f0\u1245\u1218\u12cd \u134d\u12f5\u1235\u1271 \u1218\u130d\u1295\u1275\u1264\u1275\u1275 \u12ed\u134d\u1275\u123d\u1363',\n    'settings.time_system': '\u1235\u122d\u12d3\u1270 \u130d\u12dc',\n    'settings.time_system_desc': '\u12a3\u1265 \u1218\u1295\u130d\u12ee \u130d\u12dc \u121c\u120b \u12a2\u1276\u1353\u12eb\u12cb \u130d\u12dc (6 AM = 12:00) \u121d\u1228\u1321\u1363',\n    'settings.device_time': '\u1218\u1233\u122d\u134b',\n    'settings.ethiopian_time': '\u12a2\u1276\u1353\u12eb\u12cb',\n    'settings.support': '\u1218\u12a5\u12a8\u120d \u12f0\u130d\u134d',\n    'settings.support_desc': '\u134d\u1308\u12dd\u12cd \u122d\u12a8\u1271\u1363 \u133d\u130d\u121b\u1275 \u122a\u1356\u122d\u1275 \u130d\u1261\u1229\u1363 \u1295\u1261\u12f5\u1295 Shega \u12a3\u1290\u130d\u130d\u1229\u1363',\n    'settings.avatar_title': '\u121d\u1235\u120a \u1218\u1308\u1208\u1332',\n    'settings.avatar_desc': '\u1295\u1218\u1208\u12eb \u12a3\u1235\u1270\u12f3\u12f3\u122a\u12bb \u121d\u1235\u120a \u1218\u1308\u1208\u1332 \u121d\u1228\u133d\u1363',\n    'settings.avatar_none': '\u12e8\u120d\u1265\u12cb\u1295',\n    'settings.avatar_upload': '\u1235\u12d5\u120a \u1338\u12e0\u1295',\n    'settings.avatar_saved': '\u121d\u1235\u120a \u1270\u12db\u1218\u12f0',\n    'settings.security_studio': '\u1235\u1275\u12f0\u12ee\u12ed\u12ee \u133d\u133d\u1273',`;

if (content.includes(tiSettingsTarget) && !content.includes(`'settings.time_system': '\u1235\u122d\u12d3\u1270 \u130d\u12dc'`)) {
  content = content.replace(tiSettingsTarget, tiSettingsReplace);
  changes++;
  console.log('Added TI settings keys');
}

// Write the modified content back
if (changes > 0) {
  // Restore original line endings if needed
  if (hasCRLF) {
    content = content.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`\nApplied ${changes} changes to translations.ts`);
} else {
  console.log('No changes were applied. Checking if keys already exist...');
  console.log('AM audit_logs exists:', content.includes(`'audit_logs.title'`) && content.includes(`\u12e8\u12a6\u12f0\u1275 \u1218\u12dd\u1308\u1265`));
  console.log('OM audit_logs exists:', content.includes(`'audit_logs.title': 'Galmee Qormaata'`));
  console.log('TI audit_logs exists:', content.includes(`'audit_logs.title': '\u1218\u12dd\u1308\u1265 \u121d\u122d\u1218\u122b'`));
  console.log('AM settings.time_system exists:', content.includes(`'settings.time_system': '\u12e8\u1230\u12e8\u1275 \u1235\u122d\u12d3\u1275'`));
  console.log('OM settings.time_system exists:', content.includes(`'settings.time_system': 'Sirna Yeroo'`));
  console.log('TI settings.time_system exists:', content.includes(`'settings.time_system': '\u1235\u122d\u12d3\u1270 \u130d\u12dc'`));
}
