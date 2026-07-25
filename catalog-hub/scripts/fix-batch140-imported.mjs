#!/usr/bin/env node
/** Fix brands, names, descriptions, and categories for batch140 hair imports. */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CARE_SUB_SLUGS, resolveCareCategories } from '../lib/core/care-category-map.js';
import { getCareOverride } from '../lib/core/care-content-overrides.js';
import { buildCareContent } from '../lib/core/care-content.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, '../data/care-batch140-import-state.json');

const BRAND_SPECS = {
  'Nashi Argan': { slug: 'nashi-argan', nameEn: 'Nashi Argan', nameAr: 'ناشي أرغان', fallbackSlug: 'nashi' },
  "L'Oréal Professionnel": { slug: 'loreal', nameEn: "L'Oreal", nameAr: 'لوريال', fallbackSlug: 'loreal-paris' },
  "L'Oréal Paris Elvive": { slug: 'loreal', nameEn: "L'Oreal", nameAr: 'لوريال', fallbackSlug: 'loreal-paris' },
  "L'Oreal": { slug: 'loreal', nameEn: "L'Oreal", nameAr: 'لوريال', fallbackSlug: 'loreal-paris' },
  'Garnier Ultra Doux': { slug: 'garnier-ultra-doux', nameEn: 'Garnier Ultra Doux', nameAr: 'غارنييه ألترا دو', fallbackSlug: 'garnier' },
  'Kérastase': { slug: 'kerastase', nameEn: 'Kérastase', nameAr: 'كيراستاس', fallbackSlug: 'kerastase' },
  Hairburst: { slug: 'hairburst', nameEn: 'Hairburst', nameAr: 'هيربيرست' },
  ELEBVA: { slug: 'elebva', nameEn: 'ELEBVA', nameAr: 'إليفا' },
  NOOK: { slug: 'nook-difference', nameEn: 'NOOK', nameAr: 'NOOK' },
};

function brandSlug(name = '') {
  return String(name).toLowerCase().trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function loadBrandCache() {
  const brands = await api('/brands?limit=300');
  const list = Array.isArray(brands) ? brands : brands?.items || [];
  const bySlug = new Map();
  for (const b of list) {
    if (b.slug) bySlug.set(b.slug.toLowerCase(), b);
  }
  return { list, bySlug };
}

async function ensureBrand(cache, brandEn = '') {
  const spec = BRAND_SPECS[brandEn];
  if (!spec) throw new Error(`Unknown brand spec: ${brandEn}`);

  for (const slug of [spec.slug, spec.fallbackSlug].filter(Boolean)) {
    const hit = cache.bySlug.get(slug);
    if (hit?.id) return hit.id;
  }

  const exact = cache.list.find((b) => {
    const names = [b.nameEn, b.nameAr, b.name].filter(Boolean).map((s) => s.trim().toLowerCase());
    return names.includes(spec.nameEn.toLowerCase()) || names.includes(spec.nameAr);
  });
  if (exact?.id) return exact.id;

  const created = await api('/brands', {
    method: 'POST',
    body: { name: spec.nameEn, slug: spec.slug },
  });
  cache.bySlug.set(spec.slug, created);
  cache.list.push(created);
  return created.id;
}

async function main() {
  await getToken();
  const state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  const barcodes = Object.keys(state.imported || {});
  const brandCache = await loadBrandCache();

  let ok = 0;
  let fail = 0;
  const brandFixed = {};

  for (const barcode of barcodes) {
    const meta = state.imported[barcode];
    try {
      const override = getCareOverride(barcode);
      if (!override?.brandEn) throw new Error('no override');

      const brandId = await ensureBrand(brandCache, override.brandEn);
      brandFixed[override.brandEn] = brandId;

      const content = buildCareContent({
        barcode,
        brandEn: override.brandEn,
        brandAr: override.brandAr,
        categoryEn: 'Hair care',
        categoryAr: 'العناية بالشعر',
        leaf: '',
      });

      const { subcategoryIds, tertiaryCategoryIds } = resolveCareCategories('', {
        barcode,
        brandEn: override.brandEn,
        brandAr: override.brandAr,
        typeKey: content.typeKey,
      });

      await api(`/products/${meta.id}`, {
        method: 'PATCH',
        body: {
          brandId,
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
      console.log(`OK ${barcode} | ${override.brandEn} | ${content.nameEn?.slice(0, 55)}`);
    } catch (err) {
      fail += 1;
      console.log(`FAIL ${barcode} — ${err.message}`);
    }
  }

  console.log(`\nBrands used: ${Object.keys(brandFixed).length}`);
  for (const [name, id] of Object.entries(brandFixed)) console.log(`  ${name} → ${id}`);
  console.log(`Fixed: OK=${ok} FAIL=${fail}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
