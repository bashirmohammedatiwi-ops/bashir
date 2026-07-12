#!/usr/bin/env node
/**
 * بناء فهرس باركود واحة عطر — يُشغَّل من جهاز يصل لـ waheteter.com (ليس VPS المحجوب).
 * Usage: node scripts/build-waheteter-index.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { waheteterFetch } from '../lib/stores/waheteter/client.js';
import { mapDetailProduct, mapListProduct } from '../lib/stores/waheteter/map.js';
import { variantBarcode } from '../lib/stores/waheteter/client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'data', 'waheteter-barcode-index.json');

const index = { entries: {}, products: {}, meta: { builtAt: 0, productCount: 0, barcodes: 0 } };

function gtinKey(digits) {
  const d = String(digits || '').replace(/\D/g, '');
  return d.replace(/^0+/, '') || d;
}

function upsertBarcode(barcode, row) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return;
  const key = gtinKey(digits);
  index.entries[key] = { ...index.entries[key], ...row, barcode: digits, store: 'waheteter' };
}

function slugFromProduct(raw = {}) {
  const slug = String(raw.slug || '').trim();
  if (slug && !slug.includes('%')) return slug;
  const url = String(raw.permalink || '').trim();
  const m = url.match(/\/product\/([^/?#]+)/i);
  return m ? decodeURIComponent(m[1]) : slug;
}

async function fetchVariationRows(product = {}) {
  const stubs = Array.isArray(product.variations) ? product.variations : [];
  if (!stubs.length) return product.type === 'simple' ? [product] : [];
  const rows = await Promise.all(stubs.map(async (stub) => {
    const vid = String(stub?.id || '').trim();
    if (!vid) return null;
    try {
      const { data } = await waheteterFetch(`/products/${encodeURIComponent(vid)}`, { ttl: 0 });
      return data?.id ? data : null;
    } catch {
      return null;
    }
  }));
  return rows.filter(Boolean);
}

async function main() {
  let page = 1;
  let total = 0;
  while (page <= 40) {
    const { data, meta } = await waheteterFetch('/products', {
      params: { page, per_page: 100 },
      ttl: 0,
    });
    const rows = Array.isArray(data) ? data : [];
    if (!rows.length) break;
    if (page === 1) total = meta.total || rows.length;

    for (const raw of rows) {
      if (raw.type === 'variation') continue;
      const pid = String(raw.id || '');
      if (!pid || index.products[pid]) continue;

      let variationRows = [];
      try {
        variationRows = await fetchVariationRows(raw);
      } catch {
        variationRows = [];
      }

      const detail = mapDetailProduct(raw, variationRows, { light: false });
      const slug = slugFromProduct(raw);
      index.products[pid] = {
        ...detail,
        productUrl: detail.productUrl || `https://waheteter.com/product/${slug}/`,
      };

      for (const shade of detail.shades || []) {
        const bc = String(shade.barcode || '').replace(/\D/g, '');
        if (!/^\d{8,14}$/.test(bc)) continue;
        upsertBarcode(bc, {
          productId: pid,
          variationId: String(shade.id || ''),
          slug,
          shadeName: shade.nameAr || shade.nameEn || '',
        });
      }

      const listBc = variantBarcode(raw);
      if (listBc) {
        upsertBarcode(listBc, { productId: pid, variationId: '', slug, shadeName: '' });
      }
    }

    process.stdout.write(`\rpage ${page} products ${Object.keys(index.products).length} barcodes ${Object.keys(index.entries).length}`);
    if (rows.length < 100) break;
    page += 1;
  }

  index.meta = {
    builtAt: Date.now(),
    productCount: Object.keys(index.products).length,
    barcodes: Object.keys(index.entries).length,
    sourceTotal: total,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(index));
  console.log(`\nWrote ${OUT}`);
  console.log(index.meta);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
