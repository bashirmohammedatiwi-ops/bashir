// usage: node sheet.js <folderName> <out.jpg>  — ورقة مراجعة لكل شرائح براند
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { execFileSync } = require('child_process');

const dir = path.join('C:/Users/Future of Technology/Desktop/Instagram Black Friday 2026', process.argv[2]);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).sort();
const cells = files
  .map((f) => `<div><img src="${pathToFileURL(path.join(dir, f)).href}" style="width:100%;display:block">${f}</div>`)
  .join('');
const h = `<html><body style="margin:0;background:#2a2a2e;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:10px;font:18px sans-serif;color:#fff">${cells}</body></html>`;
const hp = path.join(__dirname, 'html', 'sheet_' + Date.now() + '.html');
fs.mkdirSync(path.dirname(hp), { recursive: true });
fs.writeFileSync(hp, h);
execFileSync('node', [path.join(__dirname, '..', 'pw', 'shot.js'), hp, process.argv[3], '2000', '900', 'full', '1'], { stdio: 'inherit' });
