'use strict';

const fs = require('fs');
const path = require('path');

const ROOT_GROUPS = {
  desktop: [],
  mobile: []
};
// Populate from candidates that actually exist
function addRoot(rootsArr, r) {
  let st; try { st = fs.statSync(r); } catch (e) { return; }
  if (st.isDirectory() && rootsArr.indexOf(r) === -1) rootsArr.push(r);
}
[
  'C:/Users/Natol/Desktop/Projects/shega-desktop/src/main',
  'C:/Users/Natol/Desktop/Projects/shega-desktop/src/main',
  'C:/Users/Natol/Desktop/Projects/shega-desktop/src/main'
].forEach((r) => addRoot(ROOT_GROUPS.desktop, r));
[
  'C:/Users/Natol/Desktop/Projects/shega-mobile/src',
  'C:/Users/Natol/Desktop/Projects/shega-mobile/src',
  'C:/Users/Natol/Desktop/Projects/shega-mobile/src'
].forEach((r) => addRoot(ROOT_GROUPS.mobile, r));

function walkTree(dir, out) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    let st; try { st = fs.statSync(p); } catch (e) { continue; }
    if (st.isDirectory()) {
      if (/^(node_modules|\.git|out|dist|build|\.vite|\.swc|\.cache|coverage)$/.test(f)) continue;
      walkTree(p, out);
    } else if (/\.ts$/.test(f) && !/\.(test|spec)\.ts$/.test(f)) {
      out.push(p);
    }
  }
}

function dumpHits(files, needles, label, lineTest, showAll) {
  let printedHead = false;
  for (const f of files) {
    let s; try { s = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
    const lines = s.split(/\n/);
    let printedFile = false;
    lines.forEach((ln, i) => {
      const t = (inlineRemover([ln])[0] || '').trim();
      let ok = lineTest ? lineTest(t) : needles.some((n) => t.indexOf(n) !== -1);
      if (ok) {
        if (!printedHead) { console.log('\n------------------ ' + label + ' ------------------'); printedHead = true; }
        if (!printedFile) { console.log('== ' + f.replace(/^.*(?:Projects[\\/])/, '')); printedFile = true; }
        console.log('   ' + String(i + 1).padStart(5) + '| ' + t.slice(0, 140));
      }
    });
  }
}

// local helper: strip leading whitespace but keep indentation for reading
function inlineRemover(lines) { return lines.map((l) => l.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/, '')); }

const dFiles = [];
ROOT_GROUPS.desktop.forEach((r) => walkTree(r, dFiles));
const mFiles = [];
ROOT_GROUPS.mobile.forEach((r) => walkTree(r, mFiles));

console.log('DESKTOP roots: ' + JSON.stringify(ROOT_GROUPS.desktop));
console.log('MOBILE roots : ' + JSON.stringify(ROOT_GROUPS.mobile));
console.log('DESKTOP ts files = ' + dFiles.length + ', MOBILE ts files = ' + mFiles.length);

// A) DESKTOP: where the HTTP+WS hubs bind (LAN reachable?) and their ports
dumpHits(dFiles, [], 'DESKTOP hub BIND (host + port)', (t) => {
  return /(createServer|\.listen\(|0\.0\.0\.0|::1|127\.0\.0\.1|localhost|Server\.on\('error|port\s*=|5757|5758)/.test(t);
}, false);

// B) DESKTOP: HTTP routes handling joiner submit + status (exact path strings)
dumpHits(dFiles, [], 'DESKTOP joiner HTTP routes (join submit/status/resolve)', (t) => {
  return /('\/sync\/join|\/sync\/invitations|\/sync\/resolve|\.post\(|\.get\(|handleDeviceJoinSubmit|handleDeviceJoinStatus|resolveInvite|joinerDeviceId\b)/.test(t);
}, false);

// C) DESKTOP joiner poll client: which host:port + path do we POST to?
dumpHits(dFiles, [], 'DESKTOP joiner poll (target host/port/path)', (t) => {
  return /(pollJoinStatusOnDesktopHub|directJoinStatus|subscribeJoin|DEVICE JOIN|join\/status|5757|hubTarget|joinerDeviceId)/.test(t);
}, false);
