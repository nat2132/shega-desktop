"use strict";
const fs = require('fs');

function walk(dir, out) {
  for (const f of fs.readdirSync(dir)) {
    const p = dir + '\\' + f;
    let st;
    try { st = fs.statSync(p); } catch { continue; }
    if (st.isDirectory()) {
      if (!/node_modules|\.git|out|dist|build|\.next/.test(f)) walk(p, out);
    } else if (/\.ts$/.test(f)) {
      out.push(p);
    }
  }
}

function scan(file, regex, patterns) {
  let s;
  try { s = fs.readFileSync(file, 'utf8'); } catch { return; }
  const lines = s.split(/\n/);
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    if (regex.test(lines[i]) && (patterns.length === 0 || patterns.some((p) => p.test(lines[i])))) {
      if (!found) { console.log('== ' + file.replace(/^.*?\\src/, 'src') + ' =='); found = true; }
      console.log('  ' + (i + 1) + ' | ' + lines[i].trim());
    }
  }
}

const roots = [
  'C:\\Users\\Natol\\Desktop\\Projects\\shega-desktop\\src\\main\\sync',
  'C:\\Users\\Natol\\Desktop\\Projects\\shega-desktop\\src\\main\\sync-hub.ts',
];

console.log('################## DESKTOP: HTTP/WS hub BIND + join-endpoint handlers ##################');
const map = {};
for (const r of roots) {
  if (/\.ts$/.test(r)) map[r.replace(/\\/g, '/')] = r;
  else walk(r, ([]))
}
for (const key of Object.keys(require('path'))) {}
