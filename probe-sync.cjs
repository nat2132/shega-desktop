'use strict';
const fs = require('fs');
const path = require('path');

const ROOTS = {
  desktop: 'C:/Users/Natol/Desktop/Projects/shega-desktop',
  mobile: 'C:/Users/Natol/Desktop/Projects/shega-mobile'
};

function rootsFor(kind) {
  const r = ROOTS[kind];
  let st;
  try { st = fs.statSync(r); } catch (e) { return []; }
  if (st.isDirectory()) return [r];
  return [];
}

function walk(dir, out) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    let st;
    try { st = fs.statSync(p); } catch (e) { continue; }
    if (st.isDirectory()) {
      if (!/^(node_modules|\.git|out|dist|build|\.vite|\.cache|coverage|\.swc|\.expo)$/.test(f)) walk(p, out);
    } else if (/\.ts$/.test(f) && !/\.test\.ts$/.test(f)) {
      out.push(p);
    }
  }
}

function scan(files, needles, label) {
  let shown = false;
  for (const f of files) {
    let src;
    try { src = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
    const lines = src.split(/\n/);
    let fshown = false;
    lines.forEach((l, i) => {
      const t = l.trim();
      if (needles.some((n) => t.indexOf(n) !== -1)) {
        if (!shown) { console.log('\n== ' + label + ' =='); shown = true; }
        if (!fshown) { console.log('  [' + f.replace(/^.*?Projects[\\/]/, '').replace(/[\\]/g, '/') + ']'); fshown = true; }
        console.log('    ' + (i + 1) + '| ' + t.slice(0, 130));
      }
    });
  }
}

const dFiles = [];
const mFiles = [];
rootsFor('desktop').forEach((r) => walk(r, dFiles));
rootsFor('mobile').forEach((r) => walk(r, mFiles));
console.log('desktop files: ' + dFiles.length + ', mobile files: ' + mFiles.length);

// 1. Desktop: where does the HTTP hub server bind? (host 0.0.0.0 vs loopback)
scan(dFiles, ['createServer(', '.listen(', "listen(SYNC_PORT", "listen(DESKTOP_HUB_PORT", "0.0.0.0", "127.0.0.1", "'::1'", '"::1"'], 'DESKTOP: HTTP hub bind host');

// 2. Desktop: which handlers implement join submit + status + resolve
scan(dFiles, ["sync/joins/submit", "sync/joins/status", "sync/joins/resolve", "/joins/submit", "/joins/status", "submitDeviceJoin", "getDeviceJoinRequestByDevice", "decideDeviceJoin", "approveDeviceJoin"], 'DESKTOP: HTTP join submit/status/resolve routes');

// 3. Desktop WS: which handlers for joiner status/decode (the code-less one)
scan(dFiles, ["handleDeviceJoinStatus", "handleJoinStatus", "getDeviceJoinRequestBy(", "getDeviceJoinRequestByDevice("], 'DESKTOP WS: join status handler');
