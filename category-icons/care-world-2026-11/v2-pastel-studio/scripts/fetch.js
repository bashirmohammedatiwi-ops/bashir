// يجلب منتجات مرشّحة لكل لوحة: صورة الكتالوج (خلفية بيضاء) مقصوصة الهوامش فقط — بلا قص للمنتج.
// usage: node fetch.js  → prod/<id>.jpg + cands.json
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const HERE = __dirname;
const OUT = path.join(HERE, 'prod');
fs.mkdirSync(OUT, { recursive: true });
const API = 'https://deemaalhayat.com/api/v1';

const Q = JSON.parse(fs.readFileSync(path.join(HERE, 'queries.json'), 'utf8'));

async function list(q, n) {
  const r = await fetch(`${API}/products?${q}&limit=${n * 3}`);
  const j = await r.json();
  return (j.data || []).filter((p) => p.isActive && p.stock > 0 && p.images?.[0]?.media);
}

async function grab(p) {
  const f = path.join(OUT, p.id + '.jpg');
  const m = p.images[0].media;
  if (!fs.existsSync(f)) {
    const u = m.variants?.large?.formats?.jpg || m.variants?.large?.formats?.webp;
    const buf = Buffer.from(await (await fetch(u)).arrayBuffer());
    // خلفية بيضاء مسطّحة ثم قص الهوامش البيضاء فقط
    const flat = await sharp(buf).flatten({ background: '#ffffff' }).toBuffer();
    const t = await sharp(flat).trim({ background: '#ffffff', threshold: 18 }).jpeg({ quality: 92 }).toBuffer({ resolveWithObject: true });
    fs.writeFileSync(f, t.data);
  }
  const meta = await sharp(f).metadata();
  // هل الحواف بيضاء فعلاً؟ (صور الكتالوج القياسية) — نقيس متوسط إطار 6px
  const { data, info } = await sharp(f).extend({ top: 0 }).raw().toBuffer({ resolveWithObject: true });
  let s = 0, c = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (x > 5 && x < info.width - 6 && y > 5 && y < info.height - 6) continue;
    const i = (y * info.width + x) * info.channels; s += (data[i] + data[i + 1] + data[i + 2]) / 3; c++;
  }
  return { id: p.id, name: p.nameAr || p.name, en: p.nameEn, brand: p.brand?.name, slug: p.brand?.slug, price: p.price, orig: p.originalPrice, pct: p.discountPercent,
    w: meta.width, h: meta.height, edge: Math.round(s / c), src: m.originalName };
}

(async () => {
  const out = {};
  for (const [key, q, n] of Q) {
    const ps = await list(q, n);
    out[key] = [];
    for (const p of ps) {
      try { const g = await grab(p); if (g.edge >= (process.env.EDGE ? +process.env.EDGE : 238)) out[key].push(g); } catch (e) { console.log('fail', p.id, e.message); }
      if (out[key].length >= n) break;
    }
    console.log(key, out[key].length);
  }
  fs.writeFileSync(path.join(HERE, 'cands.json'), JSON.stringify(out, null, 1));
})();
