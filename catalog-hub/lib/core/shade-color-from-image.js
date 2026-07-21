import { Jimp } from 'jimp';

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

function sampleColorFromBitmap(image) {
  const size = Math.min(48, image.bitmap.width, image.bitmap.height);
  image.resize({ w: size, h: size });

  const buckets = new Map();
  let fallbackR = 0;
  let fallbackG = 0;
  let fallbackB = 0;
  let fallbackN = 0;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const rgba = Jimp.intToRGBA(image.getPixelColor(x, y));
      if (rgba.a < 64) continue;
      const { r, g, b } = rgba;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = saturationOf(r, g, b);

      fallbackR += r;
      fallbackG += g;
      fallbackB += b;
      fallbackN += 1;

      if (min > 222) continue;
      if (max < 32) continue;
      if (sat < 0.12 && max > 60 && max < 210) continue;

      const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
      const prev = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0, score: 0 };
      prev.r += r;
      prev.g += g;
      prev.b += b;
      prev.n += 1;
      prev.score += 1 + sat * 2;
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
      signal: AbortSignal.timeout(10_000),
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

/** يُثري colorHex للتدرجات الناقصة من صورها */
export async function enrichShadeColorsFromImages(shades = [], { concurrency = 6 } = {}) {
  const out = shades.map((s) => ({ ...s }));
  const queue = out
    .map((s, index) => ({ index, url: String(s.swatchImage || s.image || '').trim() }))
    .filter((row) => row.url && !normalizeHex(out[row.index].colorHex));

  for (let i = 0; i < queue.length; i += concurrency) {
    const chunk = queue.slice(i, i + concurrency);
    const parts = await Promise.all(chunk.map(async ({ index, url }) => {
      const hex = await averageColorFromImageUrl(url);
      return { index, hex };
    }));
    for (const p of parts) {
      if (p.hex) out[p.index].colorHex = p.hex;
    }
  }
  return out;
}

function normalizeHex(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const h = raw.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  return '';
}
