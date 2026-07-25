#!/usr/bin/env node
/**
 * يستخرج colorHex من صور التدرجات ويحدّث منتجاً موجوداً.
 * Usage:
 *   API_BASE=... ADMIN_EMAIL=... ADMIN_PASSWORD=... \
 *   node scripts/fix-product-shade-colors.mjs <productId>
 */
import { averageColorFromImageUrl, resolveShadeColorHex } from '../lib/core/shade-color-from-image.js';
import { sortShadesByNumber } from '../lib/core/product.js';

const API_BASE = (process.env.API_BASE || 'http://127.0.0.1:3000/api/v1').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const productId = process.argv[2] || process.env.PRODUCT_ID || '';

function mediaJpgUrl(media = {}) {
  const v = media?.variants || {};
  return v.medium?.formats?.jpg
    || v.small?.formats?.jpg
    || v.large?.formats?.jpg
    || v.thumb?.formats?.jpg
    || '';
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

async function mapWithConcurrency(items, worker, limit = 6) {
  const out = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      out[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return out;
}

async function main() {
  if (!productId) throw new Error('Usage: node scripts/fix-product-shade-colors.mjs <productId>');
  const token = (await api('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })).accessToken;
  if (!token) throw new Error('Login failed');

  const product = await api(`/products/${productId}`, { token });
  const shades = product.shades || [];
  if (!shades.length) throw new Error('No shades on product');

  console.log(`Fixing ${shades.length} shades on ${product.nameAr || product.name}...`);

  const updated = sortShadesByNumber(await mapWithConcurrency(shades, async (shade) => {
    const url = mediaJpgUrl(shade.image);
    const hex = await resolveShadeColorHex({
      colorHex: shade.colorHex,
      imageUrl: url,
      swatchUrl: url,
    });
    return {
      name: shade.name,
      colorHex: colorHex || '#CCCCCC',
      barcode: shade.barcode || undefined,
      imageId: shade.imageId || undefined,
      position: shade.position ?? 0,
      stock: shade.stock ?? 0,
      price: shade.price ?? undefined,
      originalPrice: shade.originalPrice ?? 0,
      discountPercent: shade.discountPercent ?? 0,
    };
  }, 6));

  const withColor = updated.filter((s) => s.colorHex && s.colorHex !== '#CCCCCC').length;
  console.log(`Extracted colors: ${withColor}/${updated.length}`);

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
