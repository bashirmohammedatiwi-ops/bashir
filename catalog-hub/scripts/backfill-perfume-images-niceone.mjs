#!/usr/bin/env node
import { searchBarcode, fetchProductDetail, searchProducts } from '../lib/stores/niceone/products.js';
import { lookupBarcodeProductMeta } from '../lib/core/barcode-meta.js';
import { findBarcodeIndexEntry } from '../lib/core/barcode-index.js';

const API_BASE = (process.env.API_BASE || 'http://187.127.88.146/api/v1').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alhayaa.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '000000';

const PERFUME_BRANDS = new Set([
  'b610d576-9fb9-4b21-a6a2-74e71b471474', // YSL
  '6260d08f-b87d-4d87-a4ca-fce8ee81a2b4', // Emporio Armani
  'bca2c344-538c-4ef1-ae91-9d12f789d8fa', // Lancôme
]);
const PERFUMES_CATEGORY = '975e0e23-edd2-4181-ad6d-ecade6452b95';

/** معرفات Niceone المعروفة مسبقاً لتسريع الجلب */
const NICEONE_ID_HINTS = {
  '3365440003866': '1873',
  '3365440037281': '7931',
  '3365440316560': '1881',
  '3365440332546': '17626',
  '3365440621053': '1872',
  '3614271990013': '7936',
  '3614272051010': '7944',
  '3614272225671': '11189',
  '3614272648333': '30379',
  '3614272824973': '13442',
  '3614272890626': '30376',
  '3614272899711': '30382',
  '3614273628983': '19460',
  '3614273762120': '23570',
  '3614273863360': '30372',
  '3614273898478': '22500',
  '3614274076202': '28089',
  '3614274151701': '29665',
  '3614274184631': '33414',
  '3614274184792': '39428',
  '3614274219579': '33876',
  '3614274241006': '36125',
  '3614274624380': '40351',
  '3614274747058': '40496',
  '3614274752717': '40494',
  '3614272225718': '11195',
};

function normUrl(url = '') {
  return String(url).replace(/\?.*$/, '').replace(/width=\d+/i, '');
}

function uniqImages(urls = []) {
  const seen = new Set();
  return urls.filter((url) => {
    const key = normUrl(url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function bcMatch(a, b) {
  const x = String(a || '').replace(/\D/g, '');
  const y = String(b || '').replace(/\D/g, '');
  return x === y || x.endsWith(y.slice(-8)) || y.endsWith(x.slice(-8));
}

function hiRes(url = '') {
  return `${String(url).split('?')[0]}?format=auto`;
}

function scoreImage(url = '', barcode = '') {
  const u = String(url).toLowerCase();
  let score = 0;
  if (/\s/.test(u)) score += 50;
  if (u.includes('/image/product/')) score -= 20;
  if (u.includes('/image/catalog/product/')) score -= 10;
  if (barcode && u.includes(barcode)) score -= 15;
  return score;
}

function pickImages(images = [], barcode = '') {
  const uniq = uniqImages(images.map(hiRes));
  if (!uniq.length) return [];

  const uploadable = uniq.filter((url) => !/\s/.test(url));
  const pool = uploadable.length ? uploadable : uniq;
  const sorted = [...pool].sort((a, b) => scoreImage(a, barcode) - scoreImage(b, barcode));
  const bottle = sorted[0];
  const box = sorted.find((url) => normUrl(url) !== normUrl(bottle)) || sorted[1];

  return [bottle, box].filter(Boolean)
    .filter((url, i, arr) => arr.findIndex((u) => normUrl(u) === normUrl(url)) === i)
    .slice(0, 2);
}

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || res.statusText;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
  }
  return json?.data ?? json;
}

async function resolveNiceoneImages(barcode, hint = '') {
  let productId = NICEONE_ID_HINTS[barcode] || null;

  if (!productId) {
    const idx = findBarcodeIndexEntry(barcode);
    if (idx?.store === 'niceone' && idx.productId) productId = idx.productId;
  }
  if (!productId) {
    const hits = await searchBarcode(barcode).catch(() => []);
    productId = hits[0]?.id || null;
  }

  const queries = [
    hint,
    hint.replace(/Yves Saint Laurent|Emporio Armani|Giorgio Armani|Lancôme|Lancome/gi, '').trim(),
    hint.split(' ').slice(-5).join(' '),
  ].filter((q, i, arr) => q && q.length > 3 && arr.indexOf(q) === i);

  if (!productId) {
    for (const q of queries) {
      const { items } = await searchProducts(q, { page: 1, limit: 8 }).catch(() => ({ items: [] }));
      for (const item of items.slice(0, 4)) {
        const detail = await fetchProductDetail(item.id).catch(() => null);
        if (!detail) continue;
        const barcodes = [detail.barcode, ...(detail.shades || []).map((s) => s.barcode)].filter(Boolean);
        if (barcodes.some((b) => bcMatch(b, barcode))) {
          productId = item.id;
          break;
        }
      }
      if (productId) break;
    }
  }

  if (!productId) {
    const meta = await lookupBarcodeProductMeta(barcode).catch(() => null);
    const q = String(meta?.title || '').replace(/ at Nordstrom.*/i, '').slice(0, 70);
    if (q) {
      const { items } = await searchProducts(q, { page: 1, limit: 6 }).catch(() => ({ items: [] }));
      for (const item of items.slice(0, 4)) {
        const detail = await fetchProductDetail(item.id).catch(() => null);
        const barcodes = [detail?.barcode, ...(detail?.shades || []).map((s) => s.barcode)].filter(Boolean);
        if (barcodes.some((b) => bcMatch(b, barcode))) {
          productId = item.id;
          break;
        }
      }
    }
  }

  if (!productId) return null;

  const detail = await fetchProductDetail(productId).catch(() => null);
  const images = pickImages(detail?.images || [], barcode);
  if (!images.length) return null;

  return { productId, images };
}

async function uploadFromUrl(token, url) {
  const data = await api('/media/upload-from-url', {
    method: 'POST',
    token,
    body: { url, purpose: 'PRODUCT' },
  });
  return data?.id || data?.media?.id || null;
}

function hasRealImages(product = {}) {
  const imgs = product.images || [];
  return imgs.some((img) => img?.id && img.id !== 'placeholder' && img?.media?.id !== 'placeholder');
}

async function main() {
  const token = (await api('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })).accessToken;

  const targets = [];
  for (let page = 1; page <= 30; page++) {
    const items = await api(`/products?limit=100&page=${page}`, { token });
    if (!items?.length) break;
    for (const p of items) {
      if (!PERFUME_BRANDS.has(p.brandId) || p.categoryId !== PERFUMES_CATEGORY) continue;
      if (hasRealImages(p)) continue;
      targets.push({ id: p.id, barcode: p.barcode, nameEn: p.nameEn || p.nameAr || '' });
    }
  }

  console.log(`Found ${targets.length} perfume products without real images\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const product of targets) {
    const { barcode, id, nameEn } = product;
    try {
      const resolved = await resolveNiceoneImages(barcode, nameEn);
      if (!resolved?.images?.length) {
        skipped += 1;
        console.log(`SKIP ${barcode} — no Niceone images`);
        continue;
      }

      const imageIds = [];
      for (const url of resolved.images) {
        const mediaId = await uploadFromUrl(token, url);
        if (mediaId) imageIds.push(mediaId);
      }

      if (!imageIds.length) {
        failed += 1;
        console.error(`FAIL ${barcode} — upload failed`);
        continue;
      }

      await api(`/products/${id}`, {
        method: 'PATCH',
        token,
        body: { imageIds },
      });

      updated += 1;
      console.log(`OK ${barcode} -> ${imageIds.length} image(s) [niceone:${resolved.productId}]`);
    } catch (err) {
      failed += 1;
      console.error(`FAIL ${barcode}: ${err.message}`);
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped (no Niceone), ${failed} failed`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
