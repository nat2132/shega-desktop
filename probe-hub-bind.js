'use strict';

const fs = require('fs');
const path = require('path');

const CANDIDATES = {
  desktop: [
    'C:/Users/Natol/Desktop/Projects/shega-desktop/src/main',
    'C:/Users/Natol/Desktop/Projects/shega-desktop/src/main',
    'C:/Users/Natol/Desktop/Projects/shega-desktop/src/main',
    'C:/Users/Natol/Desktop/Projects/shega-desktop/src/main',
  ],
  mobile: [
    'C:/Users/Natol/Desktop/Projects/shega-mobile/src',
    'C:/Users/Natol/Desktop/Projects/shega-mobile/src',
    'C:/Users/Natol/Desktop/Projects/shega-mobile/src',
  ],
};

function pickRoots(kind) {
  const found = [];
  for (const r of (CANDIDATES[kind] || [])) {
    let st;
    try { st = fs.statSync(r); } catch { continue; }
    if (found.indexOf(r) === -1) found.push(r);
  }
  return found;
}

function walk(dir, out) {
  let entries;
  try { entries = fs.readdirSync(dir); } catch { return; }
  for (const f of entries) {
    const p = path.join(dir, f);
    let st;
    try { st = fs.statSync(p); } catch { continue; }
    if (st.isDirectory()) {
      if (!/^(node_modules|\.git|out|dist|build|\.vite|\.next|coverage|\.cache|\.jenkins)$/.test(f)) walk(p, out);
    } else if (/\.ts$/.test(f) && !/\.test\./.test(f)) {
      out.push(p);
    }
  }
}

function scan(files, needles, label) {
  let printed = false;
  for (const f of files) {
    let s;
    try { s = fs.readFileSync(f, 'utf8'); } catch { continue; }
    const lines = s.split(/\n/);
    let hit = false;
    for (let i = 0; i < lines.length; i++) {
      if (needles.some((n) => lines[i].indexOf(n) !== -1)) {
        if (!printed) { printed = true; console.log('\n===== ' + label + ' ====='); }
        if (!hit) { hit = true; console.log('  [' + f.replace(/^.*\\src/, 'src') + ']'); }
        console.log('    ' + (i + 1) + '| ' + lines[i].trim());
      }
    }
  }
  if (!printed) console.log('\n===== ' + label + ' : (no matches) =====');
}

const dRoots = pickRoots('desktop');
const mRoots = pickRoots('mobile');
console.log('DESKTOP roots found: ' + JSON.stringify(dRoots));
console.log('MOBILE roots found:  ' + JSON.stringify(mRoots));

const dFiles = [];
const mFiles = [];
dRoots.forEach((r) => walk(r, dFiles));
mRoots.forEach((r) => walk(r, mFiles));

// Desktop HTTP hub: who calls createServer/listen and on what HOST (=> is it LAN-reachable?)
scan(dFiles, ['createServer(', ".listen(", "0.0.0.0", "127.0.0.1", "::1", "localhost", "host: '", "host: \"", "WEB_SYNC_PORT", "SYNC_PORT", "hubPort", "HUB_PORT"], 'DESKTOP HTTP-hub bind host/port');

// Desktop WS hub: who calls start() / listen() and with what bind host
scan(dFiles, [".listen(", "createWsServer", "WsSocketServer", "WebSocketServer.", "start(", "WS_SYNC_PORT", "5758", "port: "], 'DESKTOP WS-hub bind');

// Desktop joiner HTTP client: which host:port does pollJoinStatusOnDesktopHub target
scan(dFiles, ["join/status", "join/submit", '/sync/join', "hubTarget", "DESKTOP_HUB_PORT", "hubHost", "target.host", "target.port"], 'DESKTOP joiner HTTP poll target');

// Mobile joiner: which host:port + endpoint does join-existing/directJoinClient target for the hub HTTP submit+status
scan(mFiles, ["join/status", "join/submit", "/sync/join", "hubTarget", "DESKTOP_HUB_PORT", "HUB_PORT", "hubHost", "ownerHost", "lanHost", "target.host", "target.port", "5757", "serverUrl", "hubUrl"], 'MOBILE joiner HTTP submit/status target');
