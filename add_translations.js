const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'renderer', 'src', 'i18n', 'translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

// ==============================================
// OM SECTION - Add dashboard.gross_profit
// ==============================================
content = content.replace(
  "    'dashboard.active_debts': 'Idaa jiru',\n    'dashboard.total_items': 'Meeshaalee Waliigalaa',",
  "    'dashboard.active_debts': 'Idaa jiru',\n    'dashboard.gross_profit': 'Bu'aa Waliigalaa',\n    'dashboard.total_items': 'Meeshaalee Waliigalaa',"
);

// ==============================================
// OM SECTION - Add audit_logs keys (after activity_logs)
// ==============================================
const omAuditLogsBlock = [
  "    'audit_logs.title': 'Galmee Qorannoo',",
  "    'audit_logs.subtitle': 'Seenaa qorannoo jijjiirama hundaa',",
  "    'audit_logs.search': 'Galmee qorannoo barbaadi...',",
  "    'audit_logs.refresh': 'Haaromsi',",
  "    'audit_logs.filter': 'Filadhu',",
  "    'audit_logs.all_actions': 'Gochaalee hunda',",
  "    'audit_logs.all_entities': 'Qaamolee hunda',",
  "    'audit_logs.from': 'Irraa',",
  "    'audit_logs.to': 'Gara',",
  "    'audit_logs.by': 'Nama/Qaama raawwate',",
  "    'audit_logs.no_logs': 'Galmeen qorannoo hin argamne',",
].join('\n');

content = content.replace(
  "    'activity_logs.no_logs': 'Galmeen sochii hin argamne',\n    'auth.sign_in': 'Seeni',",
  `    'activity_logs.no_logs': 'Galmeen sochii hin argamne',\n${omAuditLogsBlock},\n    'auth.sign_in': 'Seeni',`
);

// ==============================================
// OM SECTION - Add missing settings keys
// ==============================================
const omSettingsBlock = [
  "    'settings.time_system': 'Sirna Yeroo',",
  "    'settings.time_system_desc': 'Yeroo meeshaa ykn yeroo Itiyoophiyaa (6:00 = 12:00) filadhu.',",
  "    'settings.device_time': 'Meeshaa',",
  "    'settings.ethiopian_time': 'Itiyoophiyaa',",
  "    'settings.support': 'Giddugala Gargaarsaa',",
  "    'settings.support_desc': 'Gargaarsa argadhu, rakkoo gabaasi, fi garee Shega dubbisi.',",
  "    'settings.avatar_title': 'Fakkii Biroofayilii',",
  "    'settings.avatar_desc': 'Fakkii biroofayilii keetiif filadhu.',",
  "    'settings.avatar_none': 'Hin jiru',",
  "    'settings.avatar_upload': 'Fakkii fe'i',",
  "    'settings.avatar_saved': 'Fakkii biroofayilii haaromeera',",
].join('\n');

content = content.replace(
  "    'settings.system_check_desc': 'Sirni kun yeroo mteeggabichi hojjetutti daqiiqaa 2 hunda beeksisa haaraa ni sakatta'a.',\n    'settings.security_studio': 'Stuudiyoo Nageenyaa',",
  `    'settings.system_check_desc': 'Sirni kun yeroo mteeggabichi hojjetutti daqiiqaa 2 hunda beeksisa haaraa ni sakatta'a.',\n${omSettingsBlock},\n    'settings.security_studio': 'Stuudiyoo Nageenyaa',`
);

// ==============================================
// TI SECTION - Add audit_logs keys
// First find where activity_logs ends and auth begins in TI
// ==============================================
// Get the line for the activity_logs block ending in TI section
// We need to read the TI section to find the right spot
// Let's find 'activity_logs.no_logs' in TI section (after ti: line)

// Find the ti section start
const tiStartIdx = content.indexOf("\n  ti: {");

// Find the activity_logs section in ti
const tiActivityLogsNoLogsStr = "'activity_logs.no_logs'";
const tiActivityStart = content.indexOf(tiActivityLogsNoLogsStr, tiStartIdx);
const tiAuthStart = content.indexOf("'auth.sign_in'", tiActivityStart);

// Extract the exact strings for replacement
const tiActivityLogsEnd = content.substring(tiActivityStart, tiActivityStart + 60).split('\n')[0];
const tiAuthStartLine = content.substring(tiAuthStart, tiAuthStart + 40).split('\n')[0];

const tiAuditLogsBlock = [
  "    'audit_logs.title': 'የምርመራ መዝገብ',",
  "    'audit_logs.subtitle': 'ቅያረ ዘይክኣል መዝገብ ኩለንትናዊ ለውጥ',",
  "    'audit_logs.search': 'ምርመራ መዝገብ ድለ...',",
  "    'audit_logs.refresh': 'ኣሐድስ',",
  "    'audit_logs.filter': 'መረጻ',",
  "    'audit_logs.all_actions': 'ኩሉ ተግባራት',",
  "    'audit_logs.all_entities': 'ኩሉ ክፍልታት',",
  "    'audit_logs.from': 'ካብ',",
  "    'audit_logs.to': 'ናብ',",
  "    'audit_logs.by': 'ብ',",
  "    'audit_logs.no_logs': 'ምርመራ መዝገብ ኣይተረኽበን',",
].join('\n');

const tiOldStr = tiActivityLogsEnd + '\n    ' + tiAuthStartLine;
const tiNewStr = tiActivityLogsEnd + '\n' + tiAuditLogsBlock + ',\n    ' + tiAuthStartLine;
content = content.replace(tiOldStr, tiNewStr);

// ==============================================
// TI SECTION - Add missing settings keys
// Find system_check_desc and security_studio in TI section
// ==============================================
const tiSystemCheckStr = "'settings.system_check_desc'";
const tiSecurityStudioStr = "'settings.security_studio'";

const tiSystemCheckIdx = content.indexOf(tiSystemCheckStr, tiStartIdx);
const tiSecurityStudioIdx = content.indexOf(tiSecurityStudioStr, tiSystemCheckIdx);

const tiSystemCheckLine = content.substring(tiSystemCheckIdx, tiSystemCheckIdx + 80).split('\n')[0];
const tiSecurityStudioLine = content.substring(tiSecurityStudioIdx, tiSecurityStudioIdx + 60).split('\n')[0];

const tiSettingsBlock = [
  "    'settings.time_system': 'ስርዓት ግዜ',",
  "    'settings.time_system_desc': 'ኣብ መንጎ መሳርሒ ግዜን ግዜ ኢትዮጵያን ምረጹ።',",
  "    'settings.device_time': 'መሳርሒ',",
  "    'settings.ethiopian_time': 'ኢትዮጵያዊ',",
  "    'settings.support': 'ማእከል ሓገዝ',",
  "    'settings.support_desc': 'ሓገዝ ረኽቡ፡ ጸገማት ጸብጽቡ፡ ምስ ጋንታ Shega ተራኸቡ።',",
  "    'settings.avatar_title': 'ናይ መግለጺ ስእሊ',",
  "    'settings.avatar_desc': 'ንኣድሚን ኣካውንትኩም ስእሊ ምረጹ።',",
  "    'settings.avatar_none': 'ባዶ',",
  "    'settings.avatar_upload': 'ስእሊ ስቐል',",
  "    'settings.avatar_saved': 'ስእሊ ተዘሚኑ',",
].join('\n');

const tiOldSettingsStr = tiSystemCheckLine + '\n    ' + tiSecurityStudioLine;
const tiNewSettingsStr = tiSystemCheckLine + '\n' + tiSettingsBlock + ',\n    ' + tiSecurityStudioLine;
content = content.replace(tiOldSettingsStr, tiNewSettingsStr);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');
console.log('Translations added successfully!');
