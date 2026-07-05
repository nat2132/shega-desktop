const fs = require('fs');

const filePath = 'src/renderer/src/i18n/translations.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings
const hasCRLF = content.includes('\r\n');
if (hasCRLF) content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');
const newLines = [];
let changes = 0;

function findLineContaining(lines, searchStr) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchStr)) return i;
  }
  return -1;
}

function insertAfter(lines, searchStr, insertLines) {
  const idx = findLineContaining(lines, searchStr);
  if (idx === -1) { console.log('  NOT FOUND: ' + searchStr); return false; }
  // Check if already has the content
  for (const ins of insertLines) {
    const existing = findLineContaining(lines, ins.trim().substring(0, 30));
    if (existing !== -1) { console.log('  Already exists: ' + ins.trim().substring(0, 40)); return false; }
  }
  lines.splice(idx + 1, 0, ...insertLines);
  console.log('  Inserted after line ' + (idx + 1) + ': ' + searchStr);
  return true;
}

console.log('=== Adding AM audit_logs keys ===');
const amAlResult = insertAfter(lines, "'activity_logs.no_logs': 'ምንም የእንቅስቃሴ መዝገብ አልተገኘም'", [
  "    'audit_logs.title': 'የኦዲት መዝገብ',",
  "    'audit_logs.subtitle': 'የማይለወጥ የሁሉም ለውጦች ኦዲት ዱካ',",
  "    'audit_logs.search': 'የኦዲት መዝገብ ፈልግ...',",
  "    'audit_logs.refresh': 'አድስ',",
  "    'audit_logs.filter': 'አጣራ',",
  "    'audit_logs.all_actions': 'ሁሉም ድርጊቶች',",
  "    'audit_logs.all_entities': 'ሁሉም አካላት',",
  "    'audit_logs.from': 'ከ',",
  "    'audit_logs.to': 'ወደ',",
  "    'audit_logs.by': 'በ',",
  "    'audit_logs.no_logs': 'ምንም የኦዲት መዝገብ አልተገኘም',",
]);
if (amAlResult) changes++;

console.log('=== Adding AM settings keys ===');
const amSetResult = insertAfter(lines, "'settings.system_check_desc': 'መተግበሪያው በሚሰራበት ጊዜ ስርዓቱ በየ2 ደቂቃው አዳዲስ ማንቂያዎችን ይፈትሻል።'", [
  "    'settings.time_system': 'የሰዓት ስርዓት',",
  "    'settings.time_system_desc': 'በመሳሪያ ሰዓት እና በኢትዮጵያ ሰዓት (6 AM = 12:00) መካከል ይምረጡ።',",
  "    'settings.device_time': 'መሳሪያ',",
  "    'settings.ethiopian_time': 'ኢትዮጵያዊ',",
  "    'settings.support': 'የድጋፍ ማእከል',",
  "    'settings.support_desc': 'እርዳታ ያግኙ፣ ችግሮችን ሪፖርት ያድርጉ እና የ Shega ቡድንን ያነጋግሩ።',",
  "    'settings.avatar_title': 'የመገለጫ ስዕል',",
  "    'settings.avatar_desc': 'ለአስተዳዳሪ መለያዎ የመገለጫ ስዕል ይምረጡ።',",
  "    'settings.avatar_none': 'ምንም',",
  "    'settings.avatar_upload': 'ፎቶ ጫን',",
  "    'settings.avatar_saved': 'አምሳያ ተዘምኗል',",
]);
if (amSetResult) changes++;

console.log('=== Adding OM audit_logs keys ===');
// Check if already exists first
const omAuditExists = findLineContaining(lines, "'audit_logs.title': 'Galmee Qormaata'");
if (omAuditExists !== -1) {
  console.log('  OM audit_logs already exists');
} else {
  const omAlResult = insertAfter(lines, "'activity_logs.no_logs': 'Galmeen sochii hin argamne'", [
    "    'audit_logs.title': 'Galmee Qormaata',",
    "    'audit_logs.subtitle': 'Iskuuddardii jijjiirama hunda kan hin jijjiiramne',",
    "    'audit_logs.search': 'Galmee qormaata barbaadi...',",
    "    'audit_logs.refresh': 'Haaromsi',",
    "    'audit_logs.filter': 'Calmaansi',",
    "    'audit_logs.all_actions': 'Gochaalee Hunda',",
    "    'audit_logs.all_entities': 'Uumamoota Hunda',",
    "    'audit_logs.from': 'Irraa',",
    "    'audit_logs.to': 'Gara',",
    "    'audit_logs.by': 'Kan raawwate',",
    "    'audit_logs.no_logs': 'Galmee qormaata hin argamne',",
  ]);
  if (omAlResult) changes++;
}

console.log('=== Adding OM settings keys ===');
const omSetResult = insertAfter(lines, "'settings.system_check_desc': 'Sirni kun yeroo mteeggabichi hojjetutti daqiiqaa 2 hunda beeksisa haaraa ni sakatta'a.'", [
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
]);
if (omSetResult) changes++;

console.log('=== Adding TI audit_logs keys ===');
const tiAlResult = insertAfter(lines, "'activity_logs.no_logs': 'መዝገብ ንቅንቐት ኣይተረኽበን'", [
  "    'audit_logs.title': 'መዝገብ ምርመራ',",
  "    'audit_logs.subtitle': 'ኣልተለወጢ ዱካ ምርመራ ኩሉ ለውጢ',",
  "    'audit_logs.search': 'መዝገብ ምርመራ ድለዩ...',",
  "    'audit_logs.refresh': 'ኣሓድስ',",
  "    'audit_logs.filter': 'ፍረይ',",
  "    'audit_logs.all_actions': 'ኩሉ ተግባራት',",
  "    'audit_logs.all_entities': 'ኩሉ ኣካላት',",
  "    'audit_logs.from': 'ካብ',",
  "    'audit_logs.to': 'ናብ',",
  "    'audit_logs.by': 'ብ',",
  "    'audit_logs.no_logs': 'መዝገብ ምርመራ ኣይተረኽበን',",
]);
if (tiAlResult) changes++;

console.log('=== Adding TI settings keys ===');
const tiSetResult = insertAfter(lines, "'settings.system_check_desc': 'እቲ መተግበሪ ኣብ ዝሰርሓሉ ግዜ ስርዓት ኣብ ሰዓት 2 ደቂቃ ሓደስቲ መጠንቀቕታታት ይፍትሽ።'", [
  "    'settings.time_system': 'ስርዓተ ግዜ',",
  "    'settings.time_system_desc': 'ኣብ መንጎ ግዜ ሜላ ኢትዮጵያዊ ግዜ (6 AM = 12:00) ምረጹ።',",
  "    'settings.device_time': 'መሳርሒ',",
  "    'settings.ethiopian_time': 'ኢትዮጵያዊ',",
  "    'settings.support': 'መእከል ደገፍ',",
  "    'settings.support_desc': 'ሓገዝ ርኸቡ፣ ጸገማት ሪፖርት ግበሩ፣ ንቡድን Shega ኣነጋግሩ።',",
  "    'settings.avatar_title': 'ምስሊ መገለጺ',",
  "    'settings.avatar_desc': 'ንመለያ ኣስተዳዳሪኻ ምስሊ መገለጺ ምረጽ።',",
  "    'settings.avatar_none': 'የልቦን',",
  "    'settings.avatar_upload': 'ስዕሊ ጸዓን',",
  "    'settings.avatar_saved': 'ምስሊ ተዛመደ',",
]);
if (tiSetResult) changes++;

if (changes > 0) {
  const result = lines.join('\n');
  // Restore CRLF if needed
  fs.writeFileSync(filePath, hasCRLF ? result.replace(/\n/g, '\r\n') : result, 'utf8');
  console.log(`\nTotal: ${changes} changes applied successfully`);
} else {
  console.log('\nNo changes applied');
}
