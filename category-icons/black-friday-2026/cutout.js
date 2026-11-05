// قصّ المنتج بشفافية حقيقية: قناع النموذج ∪ قناع «ليس خلفية بيضاء متصلة بالحافة».
// النموذج وحده يجعل العبوات الفاتحة شبه شفافة؛ والتعبئة من الحواف وحدها تأكل الأغطية البيضاء الملاصقة للخلفية.
// usage: node cutout.js <inDir(.png من trim)> <outDir> [id,id...] [--force]
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { removeBackground } = require('@imgly/background-removal-node');

const HULL = new Set();
const RECT = new Set();

async function modelAlpha(buf, w, h) {
  const blob = await removeBackground(new Blob([buf], { type: 'image/png' }), { model: 'medium', output: { format: 'image/png', quality: 1 } });
  const png = Buffer.from(await blob.arrayBuffer());
  const { data } = await sharp(png).resize(w, h, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const a = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = data[i * 4 + 3];
  return a;
}

/** خلفية = بكسلات قريبة من الأبيض ومتصلة بحافة الصورة. */
function floodBackground(rgb, w, h) {
  const bg = new Uint8Array(w * h);
  const near = (i) => {
    const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
    return mn > 236 && mx - mn < 14;
  };
  const stack = [];
  for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1); }
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] || !near(i)) continue;
    bg[i] = 1;
    const x = i % w, y = (i / w) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }
  return bg;
}

(async () => {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const hullArg = args.find((a) => a.startsWith('--hull='));
  if (hullArg) hullArg.slice(7).split(',').forEach((x) => HULL.add(x));
  const rectArg = args.find((a) => a.startsWith('--rect='));
  if (rectArg) rectArg.slice(7).split(',').forEach((x) => RECT.add(x));
  const [inDir, outDir, only] = args.filter((a) => !a.startsWith('--'));
  fs.mkdirSync(outDir, { recursive: true });
  const ids = only ? only.split(',') : fs.readdirSync(inDir).filter((f) => f.endsWith('.png')).map((f) => f.replace('.png', ''));
  const metaPath = path.join(outDir, 'meta.json');
  const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
  for (const id of ids) {
    const out = path.join(outDir, id + '.png');
    if (!force && fs.existsSync(out) && meta[id]) continue;
    try {
      const src = path.join(inDir, id + '.png');
      // هامش أبيض حول المنتج حتى تبدأ التعبئة من خلفية حقيقية
      const base = await sharp(src).resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
        .extend({ top: 24, bottom: 24, left: 24, right: 24, background: '#ffffff' }).flatten({ background: '#ffffff' }).png().toBuffer();
      const { data: rgb, info } = await sharp(base).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const w = info.width, h = info.height;
      const ma = await modelAlpha(base, w, h);
      const bg = floodBackground(rgb, w, h);
      // صلب = النموذج واثق، أو ليس خلفية بيضاء وللنموذج فيه وزن (يستبعد ظلال الصورة الرمادية)
      const solid = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) solid[i] = ma[i] > 128 || (!bg[i] && ma[i] > 16) ? 1 : 0;
      // نُبقي المكوّنات الكبيرة فقط (≥3% من أكبرها): ذرات الظل المتفرقة توسّع سدّ الثقوب إلى مستطيلات
      {
        const label = new Int32Array(w * h);
        const sizes = [0];
        const st = [];
        for (let s = 0; s < w * h; s++) {
          if (!solid[s] || label[s]) continue;
          const id = sizes.length;
          let n = 0;
          st.push(s);
          label[s] = id;
          while (st.length) {
            const i = st.pop();
            n++;
            const x = i % w, y = (i / w) | 0;
            const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
            for (const j of nb) if (j >= 0 && solid[j] && !label[j]) { label[j] = id; st.push(j); }
          }
          sizes.push(n);
        }
        const biggest = Math.max(...sizes);
        for (let i = 0; i < w * h; i++) if (solid[i] && sizes[label[i]] < biggest * 0.03) solid[i] = 0;
      }
      // سدّ الثقوب داخل حدود المنتج: بكسل له منتج يميناً ويساراً وفوقاً وتحتاً
      const L = new Int32Array(h).fill(-1), R = new Int32Array(h).fill(-1), T = new Int32Array(w).fill(-1), B = new Int32Array(w).fill(-1);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (solid[y * w + x]) { if (L[y] < 0) L[y] = x; R[y] = x; if (T[x] < 0) T[x] = y; B[x] = y; }
      const alpha = new Uint8Array(w * h);
      if (RECT.has(id)) {
        // علبة واحدة بمواجهة الكاميرا: المستطيل المحيط بالمنتج كله
        let x0 = w, x1 = -1, y0 = h, y1 = -1;
        for (let y = 0; y < h; y++) if (L[y] >= 0) { y0 = Math.min(y0, y); y1 = y; x0 = Math.min(x0, L[y]); x1 = Math.max(x1, R[y]); }
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) alpha[y * w + x] = 255;
      } else if (HULL.has(id)) {
        // عبوات محدّبة (علب/أنابيب بيضاء): نملأ الغلاف المحدّب لنقاط حدود المنتج
        const pts = [];
        for (let y = 0; y < h; y++) if (L[y] >= 0) { pts.push([L[y], y], [R[y], y]); }
        pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
        const lower = [], upper = [];
        for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
        for (let k = pts.length - 1; k >= 0; k--) { const p = pts[k]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
        const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
        for (let y = 0; y < h; y++) {
          const xs = [];
          for (let k = 0; k < hull.length; k++) {
            const [x1, y1] = hull[k], [x2, y2] = hull[(k + 1) % hull.length];
            if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
          }
          if (xs.length < 2) continue;
          const a0 = Math.max(0, Math.floor(Math.min(...xs))), a1 = Math.min(w - 1, Math.ceil(Math.max(...xs)));
          for (let x = a0; x <= a1; x++) alpha[y * w + x] = 255;
        }
      } else {
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = y * w + x;
          const inside = L[y] >= 0 && x > L[y] && x < R[y] && T[x] >= 0 && y > T[x] && y < B[x];
          alpha[i] = solid[i] || inside ? 255 : 0;
        }
      }
      // حواف ناعمة: تآكل بكسل واحد ثم تنعيم خفيف
      const soft = await sharp(Buffer.from(alpha), { raw: { width: w, height: h, channels: 1 } }).blur(0.9).extractChannel(0).raw().toBuffer();
      if (soft.length !== w * h) throw new Error('alpha size ' + soft.length + ' != ' + w * h);
      const rgba = Buffer.alloc(w * h * 4);
      for (let i = 0; i < w * h; i++) {
        rgba[i * 4] = rgb[i * 3]; rgba[i * 4 + 1] = rgb[i * 3 + 1]; rgba[i * 4 + 2] = rgb[i * 3 + 2];
        rgba[i * 4 + 3] = soft[i] < 24 ? 0 : soft[i];
      }
      const trimmed = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer({ resolveWithObject: true });
      fs.writeFileSync(out, trimmed.data);
      meta[id] = { w: trimmed.info.width, h: trimmed.info.height, ratio: +(trimmed.info.width / trimmed.info.height).toFixed(3) };
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 1));
      console.log('cut', id.slice(0, 8), trimmed.info.width + 'x' + trimmed.info.height);
    } catch (e) {
      console.log('fail', id.slice(0, 8), e.message);
    }
  }
})();
