// يقصّ الهوامش البيضاء حول المنتج ويحفظ PNG مع أبعاده (للتحجيم المتناسق في التصاميم).
// usage: node trim.js <inDir> <outDir>
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

(async () => {
  const [inDir, outDir] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  const meta = {};
  for (const f of fs.readdirSync(inDir).filter((f) => f.endsWith('.img'))) {
    const id = f.replace('.img', '');
    try {
      const img = sharp(path.join(inDir, f)).flatten({ background: '#ffffff' }).toColourspace('srgb');
      const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
      const { width: W, height: H, channels: C } = info;
      // خلفية: نأخذ لون الزوايا (بعض الصور رمادية فاتحة لا بيضاء)
      const px = (x, y) => { const i = (y * W + x) * C; return [data[i], data[i + 1], data[i + 2]]; };
      const corners = [px(2, 2), px(W - 3, 2), px(2, H - 3), px(W - 3, H - 3)];
      const bg = [0, 1, 2].map((c) => Math.round(corners.reduce((s, p) => s + p[c], 0) / 4));
      const isBg = (i) => Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) < 36;
      let x0 = W, y0 = H, x1 = 0, y1 = 0;
      for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
        if (!isBg((y * W + x) * C)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      if (x1 <= x0 || y1 <= y0) { console.log('empty', id); continue; }
      const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.015);
      const left = Math.max(0, x0 - pad), top = Math.max(0, y0 - pad);
      const w = Math.min(W - left, x1 - x0 + 2 * pad), h = Math.min(H - top, y1 - y0 + 2 * pad);
      await sharp(path.join(inDir, f)).flatten({ background: '#ffffff' }).extract({ left, top, width: w, height: h }).png().toFile(path.join(outDir, id + '.png'));
      const bgLum = (bg[0] + bg[1] + bg[2]) / 3;
      meta[id] = { w, h, ratio: +(w / h).toFixed(3), bg: `rgb(${bg.join(',')})`, bgLum: Math.round(bgLum), src: W + 'x' + H };
    } catch (e) {
      console.log('fail', id, e.message);
    }
  }
  fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 1));
  const vals = Object.values(meta);
  console.log('trimmed', vals.length, 'non-white bg', vals.filter((m) => m.bgLum < 245).length);
})();
