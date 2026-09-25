'use strict';
const fs = require('fs');
const path = require('path');

const apps = {
  desktop: { root: 'C:/Users/Natol/Desktop/Projects/shega-desktop/src/main', tag: 'DESKTOP' },
  mobileSync: { root: 'C:/Users/Natol/Desktop/Projects/shega-mobile/src/services', tag: 'MOBILE' },
  mobileScreen: { root: 'C:/Users/Natol/Desktop/Projects/shega-mobile/src/screens/onboarding', tag: 'MOBILE_SCREEN' },
};

function walk(dir, out) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    let st;
    try { st = fs.statSync(p); } catch (e) { continue; }
    if (st.isDirectory()) {
      if (!/^(node_modules|\.git|out|dist|build|\.vite|\.cache|coverage)$/.test(f)) walk(p, out);
    } else if (/\.ts$/.test(f) && !/\.test\.ts$/.test(f)) {
      out.push(p);
    }
  }
}

const files = Object.values(apps).reduce((m, a) => {
  const fs2 = [];
  walk(a.root, fs2);
  m[a.tag] = fs2;
  return m;
}, {});

function scan(list, needles, label) {
  let shown = false;
  for (const f of list) {
    let src;
    try { src = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
    const lines = src.split(/\n/);
    let fshown = false;
    lines.forEach((l, i) => {
      const t = l.trim();
      if (needles.some((n) => t.includes(n))) {
        if (!shown) { console.log('\n== ' + label + ' =='); shown = true; }
        if (!fshown) { console.log('  [' + f.replace(/^.*?Projects[\\/]/, '') + ']'); fshown = true; }
        console.log('   ' + (i + 1) + '| ' + t.slice(0, 130));
      }
    });
  }
  if (!shown) console.log('\n== ' + label + ' == (no static matches)');
}

// -- 1. HTTP hub route map on desktop (which paths exist, which handler) --
console.log('############ DESKTOP HTTP hub: route registration ############');
const dFiles = [];
walk(apps.desktop.root, dFiles);
const routes = [
  '/sync/device-requests',
  '/sync/device-requests/',
  '/sync/joins',
  '/sync/join',
  '/sync/joins/',
  'device-requests/:id',
  '/sync/device-requests/status',
  '/sync/join/status',
  '/sync/join/submit',
  '/sync/invitations',
  '/sync/invitations/resolve',
];
scan(dFiles, routes.concat(['app.post(', 'app.get(', 'router.post(', 'router.get(', "case '/sync", 'switch (path', 'url.pathname']), 'desktop HTTP join routes');

// -- 2. Mobile joiner: which endpoint + target does it hit for submit and status --
console.log('\n############ MOBILE joiner: submit + status poll targets ############');
scan(files['MOBILE'], ['/sync/device-requests', '/sync/join', '/sync/joins', 'joins', 'pushJoinHub', 'submitJoinHub', 'join/status', 'join/submit', 'device-request', 'pairingToken', '5757', '5759', 'hubTarget', 'resolveCodeLess', 'codeLess', 'lanDirectTarget'], 'mobile joiner submit/status');

// -- 3. Mobile joiner screen: what actually happens on "join existing business" tap (name of the submit function called) --
console.log('\n############ MOBILE joiner screen: submit call ############');
scan(files['MOBILE_SCREEN'], ['submitJoin', 'submit', 'joinHub', 'resolveInviteCode', 'resolveInvitation', 'submitDeviceJoin', 'joinExistingBusiness', 'code', 'LAN', 'discover', 'peer', 'onSubmit', 'handleSubmit'], 'join-existing screen submit wiring');

// -- 4. Cross-check: mobile owner (owner taps joiner on radar) — which endpoint writes the approval --
console.log('\n############ MOBILE owner radar: approval path ############');
scan(files['MOBILE'], ['.decideDeviceJoinRequest', 'decideDeviceJoin', 'approved', 'approveJoin', 'approveDevice', '/sync/device-requests/', 'ownerApprove', 'ownerTap', 'tapAdmit'], 'mobile owner approval');
