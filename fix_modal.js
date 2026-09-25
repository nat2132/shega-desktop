const fs = require('fs');
let s = fs.readFileSync('src/renderer/src/pages/UsersEmployees.tsx', 'utf8');
const start = s.indexOf('{/* ============ ADD TEAM MEMBER');
const modalEnd = s.indexOf('      </Modal>', s.indexOf('{/* ============ ADD TEAM MEMBER'));
if (start >= 0 && modalEnd > start) {
  const before = s.slice(0, start);
  const after = s.slice(modalEnd + 12);
  const replacement = '{/* ============ ADD TEAM MEMBER (discovery radar, no QR/code) ============ */}\n      <Modal\n        isOpen={showInviteModal}\n        onClose={() => { setShowInviteModal(false); setSetupFor(null); }}\n        title={setupFor ? t("employees.setup_member", "Set up team member") : t("employees.invite_title", "Add Team Member")}\n        size="sm"\n      >\n        {modalContent}\n      </Modal>';
  fs.writeFileSync('src/renderer/src/pages/UsersEmployees.tsx', before + replacement + after);
  console.log('Replaced successfully');
} else {
  console.log('Not found, start=' + start);
}