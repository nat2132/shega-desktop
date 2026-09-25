"use strict";
const fs = require('fs');
const path = require('path');

function walk(dir, out) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    let st;
    try { st = fs.statSync(p); } catch { continue; }
    if (st.isDirectory()) {
      if (!/^(node_modules|\.git|out|dist|build|\.vite|\.cache)$/.test(f)) walk(p, out);
    } else if (/\.ts$/.test(f)) {
      out.push(p);
    }
  }
}

function contains(line, needles) {
  return needles.some((n) => line.includes(n));
}

function report(file, needles, tag, lines) {
  let s;
  try { s = fs.readFileSync(file, 'utf8'); } catch { return; }
  const arr = s.split(/\n/);
  const out = [];
  arr.forEach((l, i) => {
    if (contains(l, needles)) out.push((i + 1) + '| ' + l.trim());
  });
  if (out.length) {
    console.log('== ' + file.replace(/^.*?\\src/, 'src') + '  [' + tag + '] ==');
    out.forEach((x) => console.log('   ' + x));
    if (lines) {
      console.log('-- ' + tag + ' context: total lines ' + arr.length);
    }
  }
}

const syncDir = 'src/main/sync';
const files = [];
walk(syncDir, filesapse);
const add = (p) => { try { if (fs.statSync(p).isFile()) files.push(p); } catch {} };

// desktop hub HTTP listeners + WS hub
add('src/main/sync-hub.ts');
add('src/main/sync-hub-http.ts');

// 1) where does desktop create an HTTP server and what host:port?
console.log('###################### DESKTOP: HTTP server bind + WS hub bind ######################');
const bindNeedles = ['createServer', '.listen(', '0.0.0.0', '127.0.0.1', '::1', "host: '", 'host: "'];
files.forEach((f) => report(f, bindNeedles, 'bind'));

// 2) where are the desktop HTTP endpoints for join submit/status?
console.log('\n###################### DESKTOP: join HTTP endpoints served ######################');
const srvNeedles = ['/sync/joins', '/sync/device-joins', 'join-submit', 'join/status', "path === '/sync", "path === \"/sync", 'DEVICE_JOIN_MSG', 'invitations', 'invitations/resolve', 'join/resolve', 'pairingToken', 'decideDeviceJoin'];
files.forEach((f) => report(f, srvNeedles, 'endpoints'));

// 3) WS hub start: where is it invoked and with what host?
console.log('\n###################### DESKTOP: WS hub start invocation + host ######################');
const startNeedles = ['.start(', 'new WsSyncServer', 'new WebsocketServer', 'startSyncServer', 'startWebSocket']);
files.forEach((f) => report(f, startNeedles, 'start'));

// 4) mobile: what does the mobile joiner POST to, and to what host:port? which url?
console.log('\n###################### MOBILE joiner: submit/status target + hub port ######################');
const mobileRoot = 'C:/Users/Natol/Desktop/Projects/shega-mobile';
const mfiles = [];
walk(mobileRoot, mfiles);
const mNeedles = ['/sync/join', 'join/submit', 'join/status', 'invitations/resolve', 'DESKTOP_HUB_PORT', 'HUB_PORT', '5757', 'baseUrl', 'hubBase', 'hubUrl', 'resolveInvitation', 'submitJoin', 'deviceId'];
mfiles.forEach((f) => report(f, mNeedles, 'mobile-join'));

// Which file is the mobileSet the joiner actually resolves a desktop hub to?
console.log('\n###################### MOBILE: where joiner picks desktop vs mobile owner ######################');
const pickNeedles = ['platform ===', "'desktop'", "'mobile'", 'desktopSyncServer', 'mobileSyncServer', 'lanTarget', 'discovered', 'peers', 'beacons'];
mfiles.forEach((f) => report(f, pickNeedles, 'pick'));
