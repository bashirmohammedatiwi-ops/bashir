#!/usr/bin/env node
/**
 * يبحث عن باركود كل تدرج (برقم التدرج) ويحدّث منتجاً موجوداً.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadVariantCache } from '../lib/stores/amazon/variant-cache.js';
import { sortShadesByNumber } from '../lib/core/product.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.join(__dirname, '..', 'data', 'amazon-barcode-seeds.json');
const PARENT_ASIN = process.env.PARENT_ASIN || 'B081TQWK89';

const API_BASE = (process.env.API_BASE || 'http://127.0.0.1:3000/api/v1').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const productId = process.argv[2] || process.env.PRODUCT_ID || '';

const UPC_MIN_INTERVAL_MS = 2500;
let lastUpcAt = 0;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normBarcode(v = '') {
  return String(v || '').replace(/\D/g, '');
}

function shadeKey(v = '') {
  const raw = String(v || '').trim();
  if (!raw) return '';
  const n = Number(raw);
  return Number.isFinite(n) ? String(n) : raw.replace(/^0+/, '') || raw;
}

function loadSeeds() {
  try {
    return JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  } catch {
    return { products: {} };
  }
}

function seedBarcode(shadeNumber = '') {
  const by = loadSeeds().products?.[PARENT_ASIN]?.byShadeNumber || {};
  const key = shadeKey(shadeNumber);
  return normBarcode(by[key] || by[String(key).padStart(2, '0')] || '');
}

function cacheBarcode(shadeNumber = '') {
  const shades = loadVariantCache().products?.[PARENT_ASIN]?.shades || [];
  const key = shadeKey(shadeNumber);
  const hit = shades.find((s) => shadeKey(s.shadeNumber) === key && normBarcode(s.barcode).length >= 8);
  return hit ? normBarcode(hit.barcode) : '';
}

function titleMatchesShade(title = '', shadeNumber = '') {
  const t = String(title || '').toLowerCase();
  const num = shadeKey(shadeNumber);
  if (!num || !/super\s*stay\s*matte\s*ink/i.test(t)) return false;
  if (/crayon|vinyl\s*ink|unlimited|lifter/i.test(t)) return false;
  const re = new RegExp(`(?:^|[^0-9])0*${num.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[^0-9]|$)`);
  return re.test(t);
}

async function searchUpcForShade(shadeNumber = '') {
  const num = shadeKey(shadeNumber);
  if (!num) return '';

  const wait = Math.max(0, UPC_MIN_INTERVAL_MS - (Date.now() - lastUpcAt));
  if (wait) await sleep(wait);
  lastUpcAt = Date.now();

  const q = encodeURIComponent(`Maybelline SuperStay Matte Ink ${num}`);
  try {
    const res = await fetch(`https://api.upcitemdb.com/prod/trial/search?s=${q}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'catalog-hub/2.0' },
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json();
    if (data.code === 'TOO_FAST' || data.code === 'EXCEED_LIMIT') {
      await sleep(4000);
      return searchUpcForShade(shadeNumber);
    }
    if (data.code !== 'OK' || !data.items?.length) return '';

    for (const item of data.items) {
      if (!titleMatchesShade(item.title, num)) continue;
      const bc = normBarcode(item.ean || item.upc);
      if (bc.length >= 8) return bc;
    }
  } catch { /* ignore */ }
  return '';
}

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || res.statusText;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
  }
  return json?.data ?? json;
}

async function main() {
  if (!productId) throw new Error('Usage: node scripts/update-product-shade-barcodes.mjs <productId>');

  const token = (await api('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })).accessToken;
  if (!token) throw new Error('Login failed');

  const product = await api(`/products/${productId}`, { token });
  const shades = product.shades || [];
  if (!shades.length) throw new Error('No shades');

  const uniqueNums = [...new Set(shades.map((s) => shadeKey(s.name)).filter(Boolean))];
  console.log(`Looking up barcodes for ${uniqueNums.length} unique shade numbers...`);

  const byNumber = new Map();
  for (const num of uniqueNums) {
    let bc = cacheBarcode(num) || seedBarcode(num);
    let source = bc ? (cacheBarcode(num) ? 'cache' : 'seed') : '';
    if (!bc) {
      bc = await searchUpcForShade(num);
      source = bc ? 'upcitemdb' : 'missing';
    }
    byNumber.set(num, bc);
    console.log(`${num}: ${bc || '—'} (${source || 'none'})`);
  }

  const updated = sortShadesByNumber(shades.map((shade) => {
    const num = shadeKey(shade.name);
    const barcode = byNumber.get(num) || undefined;
    return {
      name: shade.name,
      colorHex: shade.colorHex || '#CCCCCC',
      barcode: barcode || undefined,
      imageId: shade.imageId || undefined,
      position: shade.position ?? 0,
      stock: shade.stock ?? 0,
      price: shade.price ?? undefined,
      originalPrice: shade.originalPrice ?? 0,
      discountPercent: shade.discountPercent ?? 0,
    };
  }));

  const withBc = updated.filter((s) => normBarcode(s.barcode).length >= 8).length;
  console.log(`Updating product: ${withBc}/${updated.length} shades with barcode`);

  await api(`/products/${productId}`, {
    method: 'PATCH',
    token,
    body: { shades: updated },
  });

  console.log('Done.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
