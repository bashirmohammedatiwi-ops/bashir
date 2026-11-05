// usage: node run.js [slideNumber]
// يولّد شرائح بوست كريجي (2160×2700 JPG) في مجلد على سطح المكتب.
// يحتاج playwright: NODE_PATH=<مجلد node_modules فيه playwright>
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { page, count, W, H } = require('./kit');

const only = process.argv[2] ? Number(process.argv[2]) : null;
const outDir = process.env.OUT_DIR || 'C:/Users/Future of Technology/Desktop/Instagram GRIGI كريجي';
const htmlDir = path.join(__dirname, 'html');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(htmlDir, { recursive: true });
for (let i = 0; i < count; i++) {
  const n = i + 1;
  if (only && only !== n) continue;
  const h = path.join(htmlDir, `${n}.html`);
  fs.writeFileSync(h, page(i));
  const out = path.join(outDir, `${String(n).padStart(2, '0')}.jpg`);
  execFileSync('node', [path.join(__dirname, 'tools', 'shot.js'), h, out, String(W), String(H), 'view', '2'], { stdio: 'inherit' });
  console.log('rendered', n);
}
