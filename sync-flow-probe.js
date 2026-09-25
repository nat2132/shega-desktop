const fs = require('fs');

function walk(dir, out) {
  for (const f of fs.readdirSync(dir)) {
    const p = dir + '/' + f;
    let st;
    try { st = fs.statSync(p); } catch { continue; }
    if (st.isDirectory()) { if (!/node_modules|\.git|out|build|dist|\.next/.test(f)) walk(p, out); }
    else if (/\.ts$/.test(f)) out.push(p);
  }
}

function snip(file, pattern, ctx = 1) {
  const s = fs.readFileSync(file, 'utf8');
  const lines = s.split(/\n/);
  const res = [];
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      const from = Math.max(0, i - ctx), to = Math.min(lines.length - 1, i + ctx);
      for (let j = from; j <= to; j++) res.push(file.replace(/^.*\\src/, 'src') + ':' + (j + 1) + ' | ' + lines[j].trim());
    }
  }
  return res;
}

console.log('########## DESKTOP hub: HTTP/WS listen + bind host ##########');
const desktop = [];
walk('src', desktop);
const desktopSync = desktop.filter(p => /sync/.test(p.replace(/\\/g, '/')));
for (const p of desktopSync) {
  const s = fs.readFileSync(p, 'utf8');
  const lines = s.split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/\.listen\(|createServer|createHttpsServer|0\.0\.0\.0|127\.0\.0\.1|::1|localhost|host\s*[:=]\s*['"`]/.test(l)) {
      console.log(p.replace(/^.*\\src/, 'src') + ':' + (i + 1) + ' | ' + l.trim());
    }
  }
}

console.log('\n########## DESKTOP: join/submit + join/status + pair endpoints served WHERE? ##########');
for (const pat of [/join\/submit/, /join\/status/, /join\/resolve/, /sync\/invitations/, /approve/, /decide/, /sync\/join/]) {
  console.log('--- pattern ' + pat + ' ---');
  const seen = new Set();
  for (const p of desktopSync) {
    const s = fs.readFileSync(p, 'utf8');
    const lines = s.split(/\n/);
    for (let i = 0; i < lines.length; i++) {
      if (pat.test(lines[i]) && /app\.(get|post|put)|\.get\(|\.post\(|\.use\(|if \(pathname|==\s*['"`]\/sync|endsWith\(['"`]\/sync/.test(lines[i])) {
        const k = p + i;
        if (!seen.has(k)) { seen.add(k); console.log(p.replace(/^.*\\src/, 'src') + ':' + (i + 1) + ' | ' + lines[i].trim()); }
      }
    }
  }
}

console.log('\n########## DESKTOP hub file that starts the HTTP listener ##########');
const hubFiles = desktopSync.filter(p => /desktop-hub|sync-hub|hub-http|websocket-server|device-requests|device-join|join-hub/.test(p));
for (const p of hubFiles) {
  const s = fs.readFileSync(p, 'utf8');
  const lines = s.split(/\n/);
  const listens = [];
  for (let i = 0; i < lines.length; i++) {
    if (/.listen\(|createServer\(/.test(lines[i])) listens.push(i);
  }
  if (listens.length) {
    console.log('\n== ' + p.replace(/^.*\\src/, 'src') + ' has ' + listens.length + ' listen/createServer ==");
    for (const i of listens) {
      const from = Math.max(0, i - 3), to = Math.min(lines.length - 1, i + 3);
      for (let j = from; j <= to; j++) console.log('  ' + (j + 1) + ' | ' + lines[j].trim());
    }
  }
}
