const fs = require('fs');
const esb = require('esbuild');
const p = 'src/main/sync/websocket-server.ts';
const src = fs.readFileSync(p, 'utf8');
const L = src.split(/\n/);
function brace(s) {
  return (s.match(/{/g) || []).length - (s.match(/}/g) || []).length;
}
const m371 = L.slice(370, 390).join('\n');       // lines 371..390 handleDeviceJoinStatus
const m394 = L.slice(393, 402).join('\n');       // lines 394..402 handlePeripheralRegister start
console.log('METHOD-371-390 braceDelta=' + brace(m371));
console.log('METHOD-371-390 send' + 'Responses=' + (m371.match(/DEVICE_JOIN_MSG\.RESPONSE/g) || []).length);
console.log('METHOD-371-390 rawLines:');
m371.split(/\n/).forEach((x, i) => console.log('  ' + (371 + i) + '|' + JSON.stringify(x)));
const wrapped = 'class Probe {\n' + m371 + '\n' + m394 + '\n}\n';
esb.transform(wrapped, { loader: 'ts', sourcefile: 'probe.ts' })
  .then((r) => {
    console.log('WRAPPED-TRANSFORM-OK');
  })
  .catch((e) => {
    console.log('WRAPPED-TRANSFORM-FAIL');
    (e.errors || []).forEach((x) => {
      const l = x.location;
      console.log((l ? l.file + ':' + l.line + ':' + l.column + ' ' : '') + x.text);
    });
  });
const full = src;
esb.transform(full, { loader: 'ts', sourcefile: 'websocket-server.ts' })
  .then((r) => {
    console.log('FULL-TRANSFORM-OK jsLines=' + r.code.split(/\n/).length);
  })
  .catch((e) => {
    console.log('FULL-TRANSFORM-FAIL');
    (e.errors || []).forEach((x) => {
      const l = x.location;
      console.log((l ? l.file + ':' + l.line + ':' + l.column + ' ' : '') + x.text);
    });
  });
