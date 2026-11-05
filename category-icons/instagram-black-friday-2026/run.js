// usage: node run.js <brand-config-name> [slideNumber]
// يقرأ brands/<name>.json ويصدّر 6 شرائح JPG (2160×2700) إلى مجلد سطح المكتب.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { page, W, H } = require('./kit');

const name = process.argv[2];
const only = process.argv[3] ? Number(process.argv[3]) : null;
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'brands', name + '.json'), 'utf8'));
const OUT_ROOT = 'C:/Users/Future of Technology/Desktop/Instagram Black Friday 2026';
const outDir = path.join(OUT_ROOT, cfg.folder);
const htmlDir = path.join(__dirname, 'html', name);
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(htmlDir, { recursive: true });
const SHOT = path.join(__dirname, '..', 'pw', 'shot.js');

cfg.slides.forEach((slide, i) => {
  const n = i + 1;
  if (only && only !== n) return;
  const h = path.join(htmlDir, `${n}.html`);
  fs.writeFileSync(h, page(cfg.brand, slide));
  const out = path.join(outDir, `${String(n).padStart(2, '0')}.jpg`);
  execFileSync('node', [SHOT, h, out, String(W), String(H), 'view', '2'], { stdio: 'inherit' });
  console.log('rendered', cfg.folder, n, slide.type);
});
