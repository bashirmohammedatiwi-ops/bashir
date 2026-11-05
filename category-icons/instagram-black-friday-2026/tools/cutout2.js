// قصّ المنتج بنموذج BRIA RMBG-1.4 (أدق بكثير للصور التجارية) مع حواف ناعمة.
// usage: node cutout2.js <inDir(.png من trim)> <outDir> <id,id,...> [--rect=id,..] [--hull=id,..]
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const RECT = new Set();
const HULL = new Set();

let model, processor, RawImage;
async function load() {
  const t = await import('@huggingface/transformers');
  RawImage = t.RawImage;
  model = await t.AutoModel.from_pretrained('briaai/RMBG-1.4', { config: { model_type: 'custom' }, dtype: 'fp32' });
  processor = await t.AutoProcessor.from_pretrained('briaai/RMBG-1.4', {
    config: {
      do_normalize: true, do_pad: false, do_rescale: true, do_resize: true,
      image_mean: [0.5, 0.5, 0.5], image_std: [1, 1, 1], resample: 2, rescale_factor: 0.00392156862745098,
      size: { width: 1024, height: 1024 }, feature_extractor_type: 'ImageFeatureExtractor',
    },
  });
}

async function maskOf(file, w, h) {
  const image = await RawImage.read(file);
  const { pixel_values } = await processor(image);
  const { output } = await model({ input: pixel_values });
  const m = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(w, h);
  return Uint8Array.from(m.data);
}

/** يملأ الثقوب داخل حدود المنتج (بكسل له منتج يميناً ويساراً وفوقاً وتحتاً). */
function fillInside(a, w, h, thr = 128) {
  const L = new Int32Array(h).fill(-1), R = new Int32Array(h).fill(-1), T = new Int32Array(w).fill(-1), B = new Int32Array(w).fill(-1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (a[y * w + x] >= thr) { if (L[y] < 0) L[y] = x; R[y] = x; if (T[x] < 0) T[x] = y; B[x] = y; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (L[y] >= 0 && x > L[y] && x < R[y] && T[x] >= 0 && y > T[x] && y < B[x]) a[i] = Math.max(a[i], 255);
  }
  return { L, R };
}

/** يُبقي أكبر مكوّن (ومن يقاربه) ويحذف الذرّات المتفرقة. */
function keepMain(a, w, h, thr = 128) {
  const label = new Int32Array(w * h), sizes = [0], st = [];
  for (let s = 0; s < w * h; s++) {
    if (a[s] < thr || label[s]) continue;
    const id = sizes.length; let n = 0; st.push(s); label[s] = id;
    while (st.length) {
      const i = st.pop(); n++;
      const x = i % w, y = (i / w) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1])
        if (j >= 0 && a[j] >= thr && !label[j]) { label[j] = id; st.push(j); }
    }
    sizes.push(n);
  }
  const big = Math.max(...sizes);
  for (let i = 0; i < w * h; i++) if (a[i] >= thr && sizes[label[i]] < big * 0.03) a[i] = 0;
  // البكسلات الضعيفة البعيدة عن أي مكوّن كبير تُحذف أيضاً
  for (let i = 0; i < w * h; i++) if (a[i] < thr && a[i] > 0) {
    const x = i % w, y = (i / w) | 0;
    let near = false;
    for (let dy = -3; dy <= 3 && !near; dy++) for (let dx = -3; dx <= 3; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < w && yy < h && label[yy * w + xx] && sizes[label[yy * w + xx]] >= big * 0.03) { near = true; break; }
    }
    if (!near) a[i] = 0;
  }
}

function hullFill(a, w, h, thr = 128) {
  const pts = [];
  for (let y = 0; y < h; y++) { let l = -1, r = -1; for (let x = 0; x < w; x++) if (a[y * w + x] >= thr) { if (l < 0) l = x; r = x; } if (l >= 0) pts.push([l, y], [r, y]); }
  pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const cross = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
  const lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let k = pts.length - 1; k >= 0; k--) { const p = pts[k]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  const hull = lo.slice(0, -1).concat(up.slice(0, -1));
  for (let y = 0; y < h; y++) {
    const xs = [];
    for (let k = 0; k < hull.length; k++) {
      const [x1, y1] = hull[k], [x2, y2] = hull[(k + 1) % hull.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
    }
    if (xs.length < 2) continue;
    for (let x = Math.max(0, Math.floor(Math.min(...xs))); x <= Math.min(w - 1, Math.ceil(Math.max(...xs))); x++) a[y * w + x] = 255;
  }
}

(async () => {
  const args = process.argv.slice(2);
  for (const a of args) {
    if (a.startsWith('--rect=')) a.slice(7).split(',').forEach((x) => RECT.add(x));
    if (a.startsWith('--hull=')) a.slice(7).split(',').forEach((x) => HULL.add(x));
  }
  const [inDir, outDir, only] = args.filter((a) => !a.startsWith('--'));
  fs.mkdirSync(outDir, { recursive: true });
  const ids = only.split(',').filter(Boolean);
  const metaPath = path.join(outDir, 'meta.json');
  const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
  await load();
  for (const id of ids) {
    try {
      const src = path.join(inDir, id + '.png');
      const base = await sharp(src).resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .extend({ top: 30, bottom: 30, left: 30, right: 30, background: '#ffffff' }).flatten({ background: '#ffffff' }).png().toBuffer();
      const tmp = path.join(outDir, `.${id}.in.png`);
      fs.writeFileSync(tmp, base);
      const { data: rgb, info } = await sharp(base).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const w = info.width, h = info.height;
      const a = await maskOf(tmp, w, h);
      fs.rmSync(tmp, { force: true });
      if (RECT.has(id)) {
        let x0 = w, x1 = -1, y0 = h, y1 = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (a[y * w + x] >= 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        a.fill(0);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) a[y * w + x] = 255;
      } else {
        keepMain(a, w, h);
        if (HULL.has(id)) hullFill(a, w, h);
        else fillInside(a, w, h);
      }
      // حافة ناعمة بعرض بكسل تقريباً، بلا هالة: نشدّ المنحنى قليلاً
      const soft = await sharp(Buffer.from(a), { raw: { width: w, height: h, channels: 1 } }).blur(0.6).extractChannel(0).raw().toBuffer();
      const rgba = Buffer.alloc(w * h * 4);
      for (let i = 0; i < w * h; i++) {
        rgba[i * 4] = rgb[i * 3]; rgba[i * 4 + 1] = rgb[i * 3 + 1]; rgba[i * 4 + 2] = rgb[i * 3 + 2];
        const v = soft[i];
        rgba[i * 4 + 3] = v < 20 ? 0 : v > 235 ? 255 : Math.round(((v - 20) / 215) * 255);
      }
      const out = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer({ resolveWithObject: true });
      fs.writeFileSync(path.join(outDir, id + '.png'), out.data);
      meta[id] = { w: out.info.width, h: out.info.height, ratio: +(out.info.width / out.info.height).toFixed(3), engine: 'rmbg14' };
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 1));
      console.log('cut', id.slice(0, 8), out.info.width + 'x' + out.info.height);
    } catch (e) {
      console.log('fail', id.slice(0, 8), e.message);
    }
  }
})();
