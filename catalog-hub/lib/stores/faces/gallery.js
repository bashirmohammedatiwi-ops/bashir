import { Jimp } from 'jimp';
import { absUrl } from './client.js';
import { upgradeImageUrl } from '../../core/images.js';

const WHITE_THRESHOLD = 0.62;
const SWATCH_RE = /\/swatch\//i;

/** روابط معرض وجوه بترتيب العرض — من مصفوفة images.large كما في الموقع */
export function orderedGalleryUrls(product = {}) {
  const images = product?.images || {};
  const urls = [];

  const large = images.large;
  if (Array.isArray(large)) {
    for (const item of large) {
      const url = upgradeFacesGalleryUrl(absUrl(item?.url || item?.absUrl || ''));
      if (url && !SWATCH_RE.test(url)) urls.push(url);
    }
  } else if (large) {
    const url = upgradeFacesGalleryUrl(absUrl(large.url || large.absUrl || large));
    if (url && !SWATCH_RE.test(url)) urls.push(url);
  }

  if (!urls.length) {
    const hires = images['hi-res'];
    if (Array.isArray(hires)) {
      for (const item of hires) {
        const url = upgradeFacesGalleryUrl(absUrl(item?.url || item?.absUrl || ''));
        if (url && !SWATCH_RE.test(url)) urls.push(url);
      }
    }
  }

  return dedupePreserveOrder(urls);
}

export function upgradeFacesGalleryUrl(url = '') {
  let u = upgradeImageUrl(String(url || '').trim());
  if (!u) return '';
  try {
    const parsed = new URL(u);
    for (const key of ['sw', 'sh', 'sm', 'sfrm']) parsed.searchParams.delete(key);
    u = parsed.toString();
  } catch { /* keep */ }
  return u;
}

function dedupePreserveOrder(urls = []) {
  const seen = new Set();
  const out = [];
  for (const url of urls) {
    const key = normUrlKey(url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(url);
  }
  return out;
}

function normUrlKey(url = '') {
  return String(url)
    .replace(/\?.*$/, '')
    .replace(/\/(?:large|small|hi-res)\//gi, '/')
    .toLowerCase();
}

function isNearWhite(r, g, b, a = 255) {
  if (a < 64) return true;
  return r >= 235 && g >= 235 && b >= 235;
}

/** نسبة البكسلات البيضاء على حواف الصورة (خلفية بيضاء للمنتج) */
export async function scoreWhiteBackground(url) {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'image/*' },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return 0;
    const buf = Buffer.from(await res.arrayBuffer());
    const image = await Jimp.read(buf);
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    if (!w || !h) return 0;

    let white = 0;
    let total = 0;
    const margin = Math.max(2, Math.floor(Math.min(w, h) * 0.08));

    const sample = (x, y) => {
      const rgba = image.getPixelColor(x, y);
      const r = (rgba >> 24) & 0xff;
      const g = (rgba >> 16) & 0xff;
      const b = (rgba >> 8) & 0xff;
      const a = rgba & 0xff;
      total += 1;
      if (isNearWhite(r, g, b, a)) white += 1;
    };

    for (let x = 0; x < w; x += 2) {
      for (let y = 0; y < margin; y += 2) sample(x, y);
      for (let y = h - margin; y < h; y += 2) sample(x, y);
    }
    for (let y = margin; y < h - margin; y += 2) {
      for (let x = 0; x < margin; x += 2) sample(x, y);
      for (let x = w - margin; x < w; x += 2) sample(x, y);
    }

    return total ? white / total : 0;
  } catch {
    return 0;
  }
}

/**
 * يرتّب المعرض: أول صورة بخلفية بيضاء تصبح الرئيسية، ثم باقي الصور بترتيب وجوه.
 */
export async function orderGalleryWhiteBgFirst(urls = []) {
  if (urls.length <= 1) return urls;

  // وجوه يضع عادةً لقطة المنتج على خلفية بيضاء كأول صورة (_1)
  if (/_1(?:[._-]|\.(?:png|jpe?g|webp))/i.test(urls[0])) return urls;

  const firstScore = await scoreWhiteBackground(urls[0]);
  if (firstScore >= WHITE_THRESHOLD) return urls;

  let firstWhite = -1;
  for (let i = 1; i < urls.length; i += 1) {
    const score = await scoreWhiteBackground(urls[i]);
    if (score >= WHITE_THRESHOLD) {
      firstWhite = i;
      break;
    }
  }

  if (firstWhite <= 0) return urls;

  const ordered = [...urls];
  const [hero] = ordered.splice(firstWhite, 1);
  ordered.unshift(hero);
  return ordered;
}
