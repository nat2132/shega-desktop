const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'renderer', 'src', 'i18n', 'translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

let count = 0;

// 1. Fix missing trailing comma after support object closing brace (before orders)
// Pattern: "    }\n\n    orders: {"  => "    },\n\n    orders: {"
// This occurs in en, om, and ti sections
const supportPattern1 = "    }\n\n    orders: {";
const supportReplacement1 = "    },\n\n    orders: {";
if (content.includes(supportPattern1)) {
  content = content.replaceAll(supportPattern1, supportReplacement1);
  count++;
  console.log("Fix 1: Added comma after support closing brace");
} else {
  console.log("Fix 1: Pattern not found for support closing brace");
}

// 2. Fix missing comma after 'ክምችት ሙላ' (restock_confirm in am inventory)
const restockPattern = "restock_confirm: 'ክምችት ሙላ'\n      pack_cost_short";
const restockReplacement = "restock_confirm: 'ክምችት ሙላ',\n      pack_cost_short";
if (content.includes(restockPattern)) {
  content = content.replace(restockPattern, restockReplacement);
  count++;
  console.log("Fix 2: Added comma after restock_confirm");
} else {
  console.log("Fix 2: Pattern not found for restock_confirm");
}

// 3. Fix double comma in om audit_logs.no_logs
if (content.includes("hin argamne',,\n")) {
  content = content.replace("hin argamne',,\n", "hin argamne',\n");
  count++;
  console.log("Fix 3: Fixed double comma in om audit_logs.no_logs");
} else {
  console.log("Fix 3: Pattern not found for om double comma");
}

// 4. Fix double comma in ti audit_logs.no_logs
if (content.includes("ኣይተረኽበን',,\n")) {
  content = content.replace("ኣይተረኽበን',,\n", "ኣይተረኽበን',\n");
  count++;
  console.log("Fix 4: Fixed double comma in ti audit_logs.no_logs");
} else {
  console.log("Fix 4: Pattern not found for ti double comma");
}

if (count > 0) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`\nTotal fixes applied: ${count}`);
} else {
  console.log('\nNo fixes were applied - patterns not found');
}
