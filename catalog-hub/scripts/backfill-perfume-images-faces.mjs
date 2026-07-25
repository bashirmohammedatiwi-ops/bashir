#!/usr/bin/env node
/**
 * رفع صور العطور من Faces — كل الصور بترتيب العرض، والخلفية البيضاء أولاً.
 */
import { searchBarcode, searchProducts, fetchProductDetail } from '../lib/stores/faces/products.js';
import { fetchProductVariation } from '../lib/stores/faces/client.js';
import { orderedGalleryUrls, orderGalleryWhiteBgFirst } from '../lib/stores/faces/gallery.js';
import { CATEGORIES } from '../lib/core/app-categories.js';
import { lookupBarcodeProductMeta, buildMetaHintQueries } from '../lib/core/barcode-meta.js';

const API_BASE = (process.env.API_BASE || 'http://187.127.88.146/api/v1').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alhayaa.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '000000';
const PERFUMES_CATEGORY = CATEGORIES.perfumes;
const CONCURRENCY = Number(process.env.CONCURRENCY || 3);
const MAX_IMAGES = Number(process.env.MAX_IMAGES || 8);
const LIMIT = Number(process.env.LIMIT || 0);

function bcMatch(a, b) {
  const x = String(a || '').replace(/\D/g, '');
  const y = String(b || '').replace(/\D/g, '');
  return x === y || x.endsWith(y.slice(-8)) || y.endsWith(x.slice(-8));
}

function hasRealImages(product = {}) {
  return (product.images || []).some((img) => {
    if (!img?.id || img.id === 'placeholder' || img?.media?.id === 'placeholder') return false;
    if (img?.media?.hash === 'alhayaa-product-placeholder-v1') return false;
    if (img?.media?.storagePath === 'placeholder') return false;
    return true;
  });
}

function buildSearchQueries(nameEn = '', nameAr = '', barcode = '', meta = null) {
  const clean = String(nameEn || nameAr || '')
    .replace(/Yves Saint Laurent/gi, 'YSL')
    .replace(/Emporio Armani|Giorgio Armani/gi, 'Armani')
    .replace(/Lancôme|Lancome/gi, 'Lancome')
    .replace(/Eau de Parfum|Eau de Toilette|EDP|EDT/gi, '')
    .replace(/\d+\s*ml/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const hints = meta ? buildMetaHintQueries(meta) : [];
  return [...new Set([
    ...hints,
    clean,
    clean.split(' ').slice(0, 6).join(' '),
    clean.split(' ').slice(0, 4).join(' '),
    barcode,
  ].filter((q) => q && (q.length >= 8 || /\d{8,}/.test(q))))];
}

async function searchBarcodeWithTimeout(barcode, ms = 45_000) {
  return Promise.race([
    searchBarcode(barcode),
    new Promise((resolve) => setTimeout(() => resolve([]), ms)),
  ]);
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

async function galleryForBarcode(detail, barcode) {
  const shade = (detail?.shades || []).find((s) => bcMatch(s.barcode, barcode));
  const variantId = shade?.id || shade?.sku || detail?.sku || detail?.id;
  if (!variantId) return [];

  const variation = await fetchProductVariation(variantId, { lang: 'ar' }).catch(() => null)
    || await fetchProductVariation(variantId, { lang: 'en' }).catch(() => null);
  if (!variation) return orderedGalleryUrls(detail);

  const gallery = orderedGalleryUrls(variation);
  return gallery.length ? gallery : orderedGalleryUrls(detail);
}

async function resolveFacesImages(barcode, nameEn, nameAr) {
  let detail = null;
  let facesId = null;
  const meta = await lookupBarcodeProductMeta(barcode).catch(() => null);

  for (const q of buildSearchQueries(nameEn, nameAr, barcode, meta).slice(0, 5)) {
    const { items } = await searchProducts(q, { page: 1, limit: 10 }).catch(() => ({ items: [] }));
    for (const item of items.slice(0, 6)) {
      const d = await fetchProductDetail(item.id, { light: true }).catch(() => null);
      if (!d) continue;
      const barcodes = [d.barcode, ...(d.shades || []).map((s) => s.barcode)].filter(Boolean);
      if (barcodes.some((b) => bcMatch(b, barcode))) {
        detail = d;
        facesId = item.id;
        break;
      }
    }
    if (detail) break;
  }

  if (!detail) {
    const hits = await searchBarcodeWithTimeout(barcode);
    if (hits[0]?.id) {
      facesId = hits[0].id;
      detail = await fetchProductDetail(facesId, { light: true }).catch(() => null);
    }
  }

  if (!detail) return null;

  if (!(detail.shades || []).some((s) => bcMatch(s.barcode, barcode))) {
    const full = await fetchProductDetail(facesId || detail.id).catch(() => null);
    if (full) detail = full;
  }

  const rawGallery = await galleryForBarcode(detail, barcode);
  if (!rawGallery.length) return null;

  const images = await orderGalleryWhiteBgFirst(rawGallery);
  return { facesId, images: images.slice(0, MAX_IMAGES) };
}

async function uploadFromUrl(token, url) {
  const data = await api('/media/upload-from-url', {
    method: 'POST',
    token,
    body: { url, purpose: 'PRODUCT' },
  });
  return data?.id || data?.media?.id || null;
}

async function uploadImages(token, urls) {
  const ids = [];
  for (const url of urls) {
    const id = await uploadFromUrl(token, url).catch(() => null);
    if (id && id !== 'placeholder') ids.push(id);
  }
  return ids;
}

async function processProduct(token, product) {
  const { barcode, id, nameEn, nameAr } = product;
  const resolved = await resolveFacesImages(barcode, nameEn, nameAr);
  if (!resolved?.images?.length) {
    return { barcode, status: 'skip', reason: 'no faces images' };
  }

  const imageIds = await uploadImages(token, resolved.images);
  if (!imageIds.length) {
    return { barcode, status: 'fail', reason: 'upload failed', facesId: resolved.facesId };
  }

  await api(`/products/${id}`, { method: 'PATCH', token, body: { imageIds } });
  return { barcode, status: 'ok', facesId: resolved.facesId, count: imageIds.length };
}

async function mapWithConcurrency(items, worker, limit = 3) {
  const results = [];
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length || 1) }, run));
  return results;
}

async function main() {
  const token = (await api('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })).accessToken;

  const targets = [];
  for (let page = 1; page <= 50; page++) {
    const items = await api(`/products?limit=100&page=${page}`, { token });
    if (!items?.length) break;
    for (const p of items) {
      if (p.categoryId !== PERFUMES_CATEGORY || !p.barcode) continue;
      if (hasRealImages(p)) continue;
      targets.push({
        id: p.id,
        barcode: p.barcode,
        nameEn: p.nameEn || '',
        nameAr: p.nameAr || p.name || '',
      });
    }
  }

  console.log(`Faces perfume backfill: ${targets.length} products without real images\n`);

  const work = LIMIT > 0 ? targets.slice(0, LIMIT) : targets;
  const results = await mapWithConcurrency(
    work,
    (product) => processProduct(token, product).then((r) => {
      if (r.status === 'ok') {
        console.log(`OK ${r.barcode} -> ${r.count} img [faces:${r.facesId}]`);
      } else {
        console.log(`${r.status === 'skip' ? 'SKIP' : 'FAIL'} ${r.barcode} — ${r.reason}`);
      }
      return r;
    }),
    CONCURRENCY,
  );

  const ok = results.filter((r) => r.status === 'ok').length;
  const skip = results.filter((r) => r.status === 'skip').length;
  const fail = results.filter((r) => r.status === 'fail').length;
  console.log(`\nDone: ${ok} updated, ${skip} skipped, ${fail} failed (${work.length} processed / ${targets.length} total)`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
