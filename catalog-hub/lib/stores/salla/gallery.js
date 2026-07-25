import { upgradeImageUrl } from '../../core/images.js';

const GALLERY_RE = /https:\/\/cdn\.salla\.sa\/mvKj\/[a-f0-9-]+-\d+x\d+-[a-zA-Z0-9]+\.(?:png|jpe?g|webp|gif|avif)/gi;
const ORIGINAL_RE = /https:\/\/cdn\.salla\.sa\/mvKj\/[a-zA-Z0-9]+\.(?:png|jpe?g|webp|gif|avif)/gi;

function galleryKey(url = '') {
  const u = String(url);
  const m = u.match(/-(\d+x\d+)-([a-zA-Z0-9]+)\.(?:png|jpe?g|webp|gif|avif)/i);
  if (m) return m[2].toLowerCase();
  const base = u.match(/\/mvKj\/([a-zA-Z0-9]+)\./i);
  return base?.[1]?.toLowerCase() || u.toLowerCase();
}

function scoreUrl(url = '') {
  let score = 0;
  const u = String(url);
  if (/1000x1000/.test(u)) score += 100;
  else if (/800x800/.test(u)) score += 80;
  else if (/500x500/.test(u)) score += 50;
  else score += 30;
  if (/\.webp$/i.test(u)) score += 2;
  if (/\.pdf$/i.test(u)) score -= 1000;
  return score;
}

/** استخراج معرض الصور من HTML صفحة منتج سلا */
export function extractGalleryFromHtml(html = '') {
  const best = new Map();

  const push = (raw) => {
    const url = upgradeImageUrl(String(raw || '').trim());
    if (!url || !/cdn\.salla\.sa/i.test(url) || /\.pdf$/i.test(url)) return;
    const key = galleryKey(url);
    const prev = best.get(key);
    if (!prev || scoreUrl(url) > scoreUrl(prev)) best.set(key, url);
  };

  for (const m of String(html).matchAll(GALLERY_RE)) push(m[0]);
  for (const m of String(html).matchAll(ORIGINAL_RE)) push(m[0]);

  return [...best.values()].sort((a, b) => scoreUrl(b) - scoreUrl(a));
}

/** جلب كل صور المنتج من صفحة المتجر */
export async function fetchGalleryFromPage(productUrl = '') {
  const url = String(productUrl || '').trim();
  if (!url.startsWith('http')) return [];

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'catalog-hub/2.0',
        'Accept-Language': 'ar,en;q=0.9',
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    return extractGalleryFromHtml(html);
  } catch {
    return [];
  }
}

/** دمج صور API + صفحة المنتج مع إزالة التكرار */
export function mergeGalleryUrls(apiImages = [], pageImages = []) {
  const best = new Map();
  for (const raw of [...apiImages, ...pageImages]) {
    const url = upgradeImageUrl(raw);
    if (!url) continue;
    const key = galleryKey(url);
    const prev = best.get(key);
    if (!prev || scoreUrl(url) > scoreUrl(prev)) best.set(key, url);
  }
  return [...best.values()].sort((a, b) => scoreUrl(b) - scoreUrl(a));
}
