import { Jimp } from 'jimp';

function intToRGBA(int) {
  return {
    r: (int >> 24) & 0xff,
    g: (int >> 16) & 0xff,
    b: (int >> 8) & 0xff,
    a: int & 0xff,
  };
}

function rgbToHex(r, g, b) {
  const h = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function saturationOf(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

function parseHex(hex = '') {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

/** يقيّم مدى ملاءمة اللون كسواتش أحمر شفاه (يُفضّل ألوان مشبعة غير بيضاء/سوداء) */
export function scoreLipstickHex(hex = '') {
  const rgb = parseHex(hex);
  if (!rgb) return -1;
  const { r, g, b } = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = saturationOf(r, g, b);
  const lum = (r + g + b) / 3;

  if (max < 28 || min > 245) return -1;
  if (sat < 0.06 && lum > 45 && lum < 215) return sat * 0.2;

  let score = sat * 2.2;
  if (lum >= 55 && lum <= 210) score += 0.45;
  if (max < 55) score -= 0.9;
  if (sat > 0.35) score += 0.25;
  return score;
}

function sampleRect(image, x0, y0, x1, y1) {
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  const buckets = new Map();
  let fallbackR = 0;
  let fallbackG = 0;
  let fallbackB = 0;
  let fallbackN = 0;

  const xStart = Math.max(0, Math.floor(x0 * w));
  const xEnd = Math.min(w, Math.ceil(x1 * w));
  const yStart = Math.max(0, Math.floor(y0 * h));
  const yEnd = Math.min(h, Math.ceil(y1 * h));

  for (let y = yStart; y < yEnd; y += 1) {
    for (let x = xStart; x < xEnd; x += 1) {
      const rgba = intToRGBA(image.getPixelColor(x, y));
      if (rgba.a < 64) continue;
      const { r, g, b } = rgba;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = saturationOf(r, g, b);

      fallbackR += r;
      fallbackG += g;
      fallbackB += b;
      fallbackN += 1;

      if (min > 232) continue;
      if (max < 28) continue;
      if (sat < 0.1 && max > 55 && max < 205) continue;

      const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
      const prev = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0, score: 0 };
      prev.r += r;
      prev.g += g;
      prev.b += b;
      prev.n += 1;
      prev.score += 1 + sat * 3;
      buckets.set(key, prev);
    }
  }

  if (buckets.size) {
    let best = null;
    for (const bucket of buckets.values()) {
      if (!best || bucket.score > best.score) best = bucket;
    }
    if (best?.n) {
      return rgbToHex(best.r / best.n, best.g / best.n, best.b / best.n);
    }
  }

  return fallbackN
    ? rgbToHex(fallbackR / fallbackN, fallbackG / fallbackN, fallbackB / fallbackN)
    : '';
}

function sampleColorFromBitmap(image) {
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  const portrait = h > w * 1.05;

  const regions = portrait
    ? [
      [0.18, 0.32, 0.82, 0.88],
      [0.22, 0.42, 0.78, 0.94],
      [0.12, 0.18, 0.88, 0.92],
      [0, 0, 1, 1],
    ]
    : [
      [0.1, 0.1, 0.9, 0.9],
      [0, 0, 1, 1],
    ];

  let bestHex = '';
  let bestScore = -1;
  for (const region of regions) {
    const hex = sampleRect(image, ...region);
    const score = scoreLipstickHex(hex);
    if (score > bestScore) {
      bestScore = score;
      bestHex = hex;
    }
  }
  return bestHex;
}

/** يستخرج اللون الغالب من صورة سواتش/منتج */
export async function averageColorFromImageUrl(url = '') {
  const src = String(url || '').trim();
  if (!src) return '';

  try {
    const res = await fetch(src, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CatalogHub/2.0)',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return '';
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return '';
    const image = await Jimp.read(buf);
    const hex = sampleColorFromBitmap(image);
    return hex.startsWith('#') ? hex : '';
  } catch {
    return '';
  }
}

function normalizeHex(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const h = raw.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  return '';
}

function pickBestHex(candidates = []) {
  let best = '';
  let bestScore = -1;
  for (const raw of candidates) {
    const hex = normalizeHex(raw);
    if (!hex) continue;
    const score = scoreLipstickHex(hex);
    if (score > bestScore) {
      bestScore = score;
      best = hex;
    }
  }
  return best;
}

/** يختار أفضل لون من الموجود + عينات الصور */
export async function resolveShadeColorHex(shade = {}) {
  const existing = normalizeHex(shade.colorHex || shade.hex || '');
  const urls = [...new Set([
    String(shade.swatchImage || shade.swatchUrl || '').trim(),
    String(shade.image || shade.imageUrl || '').trim(),
  ].filter(Boolean))];

  const sampled = await Promise.all(urls.map((url) => averageColorFromImageUrl(url)));
  const best = pickBestHex([existing, ...sampled]);

  if (!best) return existing || '';
  if (!existing) return best;

  const existingScore = scoreLipstickHex(existing);
  const bestScore = scoreLipstickHex(best);
  if (bestScore >= existingScore + 0.12) return best;
  if (existingScore < 0.35 && bestScore > existingScore) return best;
  return existing;
}

/** يُثري colorHex لكل التدرجات — يُفضّل لون السواتش الصحيح */
export async function enrichShadeColorsFromImages(shades = [], { concurrency = 6 } = {}) {
  const out = shades.map((s) => ({ ...s }));
  const queue = out.map((shade, index) => ({ index, shade }));

  for (let i = 0; i < queue.length; i += concurrency) {
    const chunk = queue.slice(i, i + concurrency);
    const parts = await Promise.all(chunk.map(async ({ index, shade }) => {
      const hex = await resolveShadeColorHex(shade);
      return { index, hex };
    }));
    for (const p of parts) {
      if (p.hex) out[p.index].colorHex = p.hex;
    }
  }
  return out;
}
