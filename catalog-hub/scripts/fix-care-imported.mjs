#!/usr/bin/env node
/** Fix names, descriptions, subcategories, and tertiary categories for imported care products. */
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveCareCategories } from '../lib/core/care-category-map.js';
import { buildCareContent } from '../lib/core/care-content.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE = (process.env.API_BASE || 'http://187.127.88.146/api/v1').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alhayaa.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '000000';
const STATE_FILE = path.join(__dirname, '../data/care-pos-import-state.json');

async function api(pathname, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${pathname}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || res.statusText;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
  }
  return json?.data ?? json;
}

async function main() {
  if (!existsSync(STATE_FILE)) {
    console.log('No care import state found.');
    return;
  }

  const state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  const barcodes = Object.keys(state.imported || {});
  if (!barcodes.length) {
    console.log('No imported care products to fix.');
    return;
  }

  const token = (await api('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })).accessToken;

  let ok = 0;
  let fail = 0;

  for (const barcode of barcodes) {
    const meta = state.imported[barcode];
    try {
      const lookup = await api('/sync/inventory/lookup-barcodes', {
        method: 'POST',
        token,
        body: { barcodes: [barcode] },
      });
      const hit = lookup.items?.[barcode];
      let product = null;
      if (meta.id) {
        try {
          product = await api(`/products/${meta.id}`, { token });
        } catch { /* fallback to search */ }
      }
      if (!product?.id) {
        const products = await api(`/products?limit=1&search=${barcode}`, { token });
        product = (Array.isArray(products) ? products : products?.items || [])[0];
      }
      if (!product?.id) {
        console.log(`SKIP ${barcode} — not in catalog`);
        continue;
      }

      const content = buildCareContent({
        barcode,
        brandEn: product.brand?.nameEn || product.brand?.name,
        brandAr: product.brand?.nameAr,
        posName: hit?.pos?.name,
        leaf: meta.leaf,
      });

      const { subcategoryIds, tertiaryCategoryIds } = resolveCareCategories(meta.leaf, {
        barcode,
        brandEn: content.brandEn,
        brandAr: product.brand?.nameAr,
        posName: hit?.pos?.name,
        typeKey: content.typeKey,
      });

      await api(`/products/${product.id}`, {
        method: 'PATCH',
        token,
        body: {
          name: content.nameAr,
          nameAr: content.nameAr,
          nameEn: content.nameEn,
          description: content.descriptionAr,
          descriptionAr: content.descriptionAr,
          descriptionEn: content.descriptionEn,
          subcategoryIds,
          tertiaryCategoryIds,
        },
      });

      ok += 1;
      console.log(`OK ${barcode}`);
      console.log(`  → ${content.nameAr}`);
      console.log(`  → فرعي: ${subcategoryIds.length} | ثانوي: ${tertiaryCategoryIds.length}`);
    } catch (err) {
      fail += 1;
      console.log(`FAIL ${barcode} — ${err.message}`);
    }
  }

  console.log(`\nFixed: OK=${ok} FAIL=${fail}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
