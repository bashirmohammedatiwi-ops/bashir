/**
 * تجميع وترقية روابط الصور — دقة أعلى عند الجلب والاستيراد.
 */

const SIZE_SUFFIX_RE = /-(\d+)x(\d+)(@2x)?(?=\.(jpe?g|png|webp|gif|avif|bmp)(\?|#|$))/i;
const SHOPIFY_SIZE_RE = /_(?:pico|icon|thumb|small|compact|medium|large|grande|original|\d+x\d+|\d+x)(@2x)?(?=\.(jpe?g|png|webp|gif)(\?|#|$))/i;
const AMAZON_HOST_RE = /media-amazon\.com|images-amazon\.com/i;
const IMPORT_SIZE = 1500;
const THUMB_SIZE = 800;

function stripQueryParams(url = '', keys = []) {
  try {
    const u = new URL(url);
    for (const key of keys) u.searchParams.delete(key);
    const out = u.toString();
    return out.endsWith('?') ? out.slice(0, -1) : out;
  } catch {
    return url;
  }
}

function imageBaseKey(url = '') {
  const u = String(url || '').trim();
  if (!u) return '';
  let key = u
    .replace(/^https?:\/\//i, '')
    .replace(/\?.*$/, '')
    .replace(/#.*$/, '');

  const amazonId = key.match(/\/images\/I\/([A-Za-z0-9%+-]+)/i)?.[1];
  if (amazonId) return `amazon:${amazonId.replace(/\._[^.]+$/, '')}`;

  key = key
    .replace(/-(\d+)x(\d+)(@2x)?(?=\.(jpe?g|png|webp|gif|avif|bmp))/i, '')
    .replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|original|\d+x\d+|\d+x)(@2x)?(?=\.(jpe?g|png|webp|gif))/i, '')
    .replace(/\/img\/\d+\/\d+\/resize\//i, '/media/')
    .replace(/\/cache\/(?!optimized\/webp\/)[^/]+\//i, '/')
    .replace(/\/(small|thumbnail|thumb|mini)_image\//i, '/');

  return key.toLowerCase();
}

function inferredPixels(url = '') {
  const u = String(url || '');
  let score = u.length;

  const woo = u.match(/-(\d+)x(\d+)(@2x)?\./i);
  if (woo) score = Math.max(score, Number(woo[1]) * Number(woo[2]) * (woo[3] ? 4 : 1));

  const shopify = u.match(/_(\d+)x(\d+)(@2x)?\./i);
  if (shopify) score = Math.max(score, Number(shopify[1]) * Number(shopify[2]) * (shopify[3] ? 4 : 1));

  const magento = u.match(/\/img\/(\d+)\/(\d+)\/resize\//i);
  if (magento) {
    const w = Number(magento[1]);
    const h = Number(magento[2]);
    score = Math.max(score, w > 0 && h > 0 ? w * h : (w === 0 && h === 0 ? 4_000_000 : 0));
  }

  const amazon = u.match(/\._AC_(?:SL|SX|SY|UX|UY)(\d+)_/i);
  if (amazon) score = Math.max(score, Number(amazon[1]) ** 2);

  const width = u.match(/[?&](?:width|w)=(\d+)/i)?.[1];
  if (width) score = Math.max(score, Number(width) ** 2);

  if (/\/original[_/]|_grande\.|\/large\//i.test(u)) score += 50_000;
  if (/\/small[_/]|thumbnail|thumb|mini/i.test(u)) score = Math.min(score, 10_000);

  return score;
}

export function normalizeAmazonImageUrl(url = '', size = IMPORT_SIZE) {
  const raw = String(url || '').trim();
  if (!raw || !AMAZON_HOST_RE.test(raw)) return raw;
  const dim = Math.max(400, Math.min(2000, Number(size) || IMPORT_SIZE));

  const id = raw.match(/\/images\/I\/([A-Za-z0-9%+-]+)/i)?.[1]
    || raw.match(/\/I\/([A-Za-z0-9%+-]+)\./i)?.[1];
  if (id) {
    const cleanId = id.replace(/\._[^.]+$/, '');
    return `https://m.media-amazon.com/images/I/${cleanId}._AC_SL${dim}_.jpg`;
  }

  return raw
    .replace(/\._(?:AC_)?(?:US|SS|SX|SY|UX|UY|CR|UL|SL)\d+(?:,\d+)*(?:_CR[,\d]+)?_/gi, `._AC_SL${dim}_`)
    .replace(/\._SL\d+_/g, `._AC_SL${dim}_`);
}

function upgradeShortPixel(url = '') {
  const m = String(url || '').match(/shortpixel\.ai\/spai\/[^/]+\/(https?:\/\/[^?#]+)/i);
  if (!m) return url;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

function upgradeWooCommerce(url = '') {
  let u = String(url || '').trim();
  if (!u) return u;
  u = u.replace(/-(\d+)x(\d+)(@2x)?(?=\.(jpe?g|png|webp|gif|avif|bmp)(\?|#|$))/i, '');
  return u;
}

function upgradeShopify(url = '') {
  let u = String(url || '').trim();
  if (!u) return u;
  u = u.replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|original|\d+x\d+|\d+x)(@2x)?(?=\.(jpe?g|png|webp|gif)(\?|#|$))/i, '');
  u = u.replace(/_(\d+)x(\d+)(@2x)?(?=\.(jpe?g|png|webp|gif)(\?|#|$))/i, '');
  if (/cdn\.shopify\.com/i.test(u)) {
    u = stripQueryParams(u, ['width', 'height', 'w', 'h']);
    if (!/[?&]width=/i.test(u)) {
      u += (u.includes('?') ? '&' : '?') + 'width=2048';
    }
  }
  return u;
}

function upgradeMagento(url = '') {
  let u = String(url || '').trim();
  if (!u) return u;

  const brokenCache = u.match(/\/media\/catalog\/product\/cache\/(?!optimized\/webp\/)[^/]+\/(.+)$/i);
  if (brokenCache) {
    const sub = brokenCache[1];
    if (/\.(jpe?g|png|webp|gif|avif)$/i.test(sub)) {
      return `${u.split('/media/')[0]}/media/catalog/product/${sub}`;
    }
    return `${u.split('/media/')[0]}/media/catalog/product/cache/optimized/webp/${sub.replace(/\.(jpe?g|png)$/i, '')}.webp`;
  }

  const resize = u.match(/^(https?:\/\/[^/]+)\/img\/(\d+)\/(\d+)\/resize\/(.+)$/i);
  if (resize) {
    const [, origin, w, h, rest] = resize;
    if (Number(w) > 0 && Number(h) > 0 && (Number(w) < 800 || Number(h) < 800)) {
      return `${origin}/img/0/0/resize/${rest}`;
    }
  }

  return u;
}

function upgradeMiswag(url = '') {
  const u = String(url || '').trim();
  if (!u || !/cdn\.miswag\.me/i.test(u)) return u;
  return stripQueryParams(u, ['w', 'h', 'width', 'height', 'fit']);
}

function upgradeSalla(url = '') {
  let u = String(url || '').trim();
  if (!u) return u;
  u = upgradeWooCommerce(u);
  if (/cdn\.salla\.sa|salla\.sa\/cdn/i.test(u)) {
    u = stripQueryParams(u, ['w', 'h', 'width', 'height']);
  }
  return u;
}

function upgradeFaces(url = '') {
  let u = String(url || '').trim();
  if (!u || !/demandware\.net|faces\.com/i.test(u)) return u;
  if (/\/(?:small|swatch)\//i.test(u) && !/\/(?:large|hi-res)\//i.test(u)) {
    u = u.replace(/\/small\//i, '/large/').replace(/\/swatch\//i, '/large/');
  }
  u = stripQueryParams(u, ['sw', 'sh', 'sm', 'sfrm']);
  return u;
}

/** ترقية رابط صورة واحد حسب مصدر المتجر */
export function upgradeImageUrl(url = '', { size = IMPORT_SIZE } = {}) {
  let u = String(url || '').trim();
  if (!u) return '';
  if (u.startsWith('//')) u = `https:${u}`;

  u = upgradeShortPixel(u);
  if (AMAZON_HOST_RE.test(u)) return normalizeAmazonImageUrl(u, size);
  if (/waheteter\.com|woocommerce/i.test(u)) u = upgradeWooCommerce(u);
  if (/cdn\.shopify\.com|orisdi\.com/i.test(u)) u = upgradeShopify(u);
  if (/elryan\.com|miraaya\.com|magadmin\.miraaya/i.test(u)) u = upgradeMagento(u);
  if (/cdn\.miswag\.me/i.test(u)) u = upgradeMiswag(u);
  if (/cdn\.salla\.sa|salla\.sa/i.test(u)) u = upgradeSalla(u);
  if (/demandware\.net|faces\.com/i.test(u)) u = upgradeFaces(u);
  if (/khaton\.beauty/i.test(u)) u = upgradeWooCommerce(u);

  return u;
}

/** إزالة التكرار مع الإبقاء على أعلى دقة لكل صورة */
export function dedupeImagesPreferLargest(urls = []) {
  const best = new Map();
  for (const raw of urls) {
    const url = upgradeImageUrl(raw);
    if (!url) continue;
    const key = imageBaseKey(url);
    const prev = best.get(key);
    if (!prev || inferredPixels(url) > inferredPixels(prev)) {
      best.set(key, url);
    }
  }
  return [...best.values()];
}

/**
 * تجميع روابط صور فريدة من مصادر متعددة (نصوص، كائنات، مصفوفات).
 */
export function collectImageUrls(...sources) {
  const out = [];

  const visit = (val) => {
    if (!val) return;
    if (typeof val === 'string') {
      const s = val.trim();
      if (s.startsWith('http') || s.startsWith('//')) out.push(s);
      return;
    }
    if (Array.isArray(val)) {
      for (const item of val) visit(item);
      return;
    }
    if (typeof val === 'object') {
      visit(
        val.url || val.absUrl || val.src || val.href || val.image || val.file
          || val.original || val.large || val.full_src || val.fullSrc
          || val.data_large_image || val.thumbnail_image || val.thumbnail,
      );
      if (Array.isArray(val.images)) visit(val.images);
      if (Array.isArray(val.media_gallery)) visit(val.media_gallery);
    }
  };

  for (const src of sources) visit(src);
  return dedupeImagesPreferLargest(out);
}

export { IMPORT_SIZE, THUMB_SIZE };
