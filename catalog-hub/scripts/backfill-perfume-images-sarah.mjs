#!/usr/bin/env node
/**
 * رفع صور العطور من ساره ستور (sarahmakeup37.com) — منتج بمنتج فوراً.
 * يبحث بالباركود ثم باسم البراند، ويرفع كل صور المنتج بترتيب سلا.
 */
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { fetchGalleryFromPage, mergeGalleryUrls } from '../lib/stores/salla/gallery.js';
import { CATEGORIES } from '../lib/core/app-categories.js';

const API_BASE = (process.env.API_BASE || 'http://187.127.88.146/api/v1').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alhayaa.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '000000';
const PERFUMES_CATEGORY = CATEGORIES.perfumes;
const STORE_ID = process.env.SALLA_STORE || 'sarahmakeup37.com';
const MAX_IMAGES = Number(process.env.MAX_IMAGES || 12);
const REFRESH = process.env.REFRESH === '1';
const MIN_IMAGES = Number(process.env.MIN_IMAGES || 2);

const client = createSallaClient(STORE_ID, { cachePrefix: 'sarah' });
const salla = createSallaProductsApi(client);

function bcMatch(a, b) {
  const x = String(a || '').replace(/\D/g, '');
  const y = String(b || '').replace(/\D/g, '');
  if (x.length < 8 || y.length < 8) return false;
  return x === y || x.endsWith(y.slice(-8)) || y.endsWith(x.slice(-8));
}

function realImageCount(product = {}) {
  return (product.images || []).filter((img) => {
    if (!img?.id || img.id === 'placeholder' || img?.media?.id === 'placeholder') return false;
    if (img?.media?.hash === 'alhayaa-product-placeholder-v1') return false;
    if (img?.media?.storagePath === 'placeholder') return false;
    return true;
  }).length;
}

function shouldProcess(product = {}) {
  const count = realImageCount(product);
  if (REFRESH) return count === 0 || count < MIN_IMAGES;
  return count === 0;
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

async function findSarahProduct(barcode) {
  const { data: hits = [] } = await client.sallaFetch('/products/search', {
    params: { query: barcode, per_page: 5 },
    ttl: 0,
  }).catch(() => ({ data: [] }));

  if (!hits.length) return null;

  for (const hit of hits.slice(0, 3)) {
    const detail = await salla.fetchProductDetail(hit.id);
    if (!detail || !bcMatch(detail.barcode || detail.sku, barcode)) continue;

    const pageImages = await fetchGalleryFromPage(hit.url || detail.productUrl);
    const images = mergeGalleryUrls(detail.images || [], pageImages);
    if (!images.length) continue;

    return { ...detail, images, productUrl: hit.url || detail.productUrl };
  }

  return null;
}

async function uploadImages(token, urls) {
  const ids = [];
  for (const url of urls.slice(0, MAX_IMAGES)) {
    try {
      const data = await api('/media/upload-from-url', {
        method: 'POST',
        token,
        body: { url, purpose: 'PRODUCT' },
      });
      const id = data?.id || data?.media?.id;
      if (id && id !== 'placeholder') ids.push(id);
    } catch { /* next image */ }
  }
  return ids;
}

async function processOne(token, product) {
  const { id, barcode, nameEn, nameAr } = product;
  const sarah = await findSarahProduct(barcode);
  if (!sarah?.images?.length) {
    return { barcode, status: 'skip', reason: 'not on sarah store' };
  }

  const imageIds = await uploadImages(token, sarah.images);
  if (!imageIds.length) {
    return { barcode, status: 'fail', reason: 'upload failed' };
  }

  await api(`/products/${id}`, { method: 'PATCH', token, body: { imageIds } });
  return {
    barcode,
    status: 'ok',
    count: imageIds.length,
    sarahId: sarah.id,
    name: sarah.nameAr?.slice(0, 50),
  };
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
      if (!shouldProcess(p)) continue;
      targets.push({
        id: p.id,
        barcode: p.barcode,
        nameEn: p.nameEn || '',
        nameAr: p.nameAr || p.name || '',
        hadImages: realImageCount(p),
      });
    }
  }

  console.log(`Sarah perfume backfill: ${targets.length} products (${STORE_ID}) refresh=${REFRESH} min=${MIN_IMAGES}\n`);

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const product of targets) {
    const t0 = Date.now();
    try {
      const r = await processOne(token, product);
      const ms = Date.now() - t0;
      if (r.status === 'ok') {
        ok += 1;
        console.log(`OK ${r.barcode} -> ${r.count} img (was ${product.hadImages}) [${r.sarahId}] ${r.name} (${ms}ms)`);
      } else if (r.status === 'skip') {
        skip += 1;
        console.log(`SKIP ${r.barcode} — ${r.reason} (${ms}ms)`);
      } else {
        fail += 1;
        console.log(`FAIL ${r.barcode} — ${r.reason} (${ms}ms)`);
      }
    } catch (err) {
      fail += 1;
      console.log(`FAIL ${product.barcode} — ${err.message}`);
    }
  }

  console.log(`\nDone: ${ok} updated, ${skip} skipped, ${fail} failed (${targets.length} total)`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
