import { typesenseSearch } from './client.js';
import { mapTypesenseHit } from './categories.js';
import { fetchProductDetail } from './products.js';
import {
  findBarcodeIndexEntry,
  upsertBarcodeIndex,
} from '../../core/barcode-index.js';
import {
  buildMetaHintQueries,
  findMiswagIdsFromWeb,
  lookupBarcodeProductMeta,
  normalizeBarcodeMeta,
  parseBarcodeMetaFields,
  scoreStoreHintMatch,
} from '../../core/barcode-meta.js';

function shadeNamesMatch(a = '', b = '') {
  const na = String(a || '').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, ' ').trim();
  const nb = String(b || '').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, ' ').trim();
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function formatEanHit(item, digits, matchType, shade = null) {
  return {
    id: item.id,
    nameAr: item.nameAr,
    nameEn: item.nameEn,
    brandAr: item.brandAr,
    brandEn: item.brandEn,
    thumb: shade?.image || item.thumb,
    price: shade?.price || item.price,
    shadeCount: item.shadeCount,
    hasOptions: item.hasOptions,
    shadeName: shade?.nameAr || shade?.name || '',
    barcode: digits,
    matchType,
  };
}

function learnHit(digits, hit, meta = {}) {
  if (!hit?.id || !digits) return;
  upsertBarcodeIndex(digits, {
    store: 'miswag',
    productId: String(hit.id),
    name: hit.nameAr || hit.nameEn || meta.title || '',
    brand: hit.brandAr || meta.brand || '',
    shadeName: hit.shadeName || meta.shade || '',
    matchType: hit.matchType || 'ean',
  });
}

async function resolveFromIndex(digits) {
  const entry = findBarcodeIndexEntry(digits);
  if (!entry?.productId) return null;

  const detail = await fetchProductDetail(String(entry.productId), { light: false }).catch(() => null);
  if (!detail?.id) return null;

  let shade = null;
  if (entry.shadeName && detail.shades?.length) {
    shade = detail.shades.find((s) => shadeNamesMatch(s.nameAr || s.name, entry.shadeName));
  }

  return formatEanHit(detail, digits, entry.matchType || 'index', shade);
}

async function confirmHintHit(productId, digits, meta) {
  const detail = await fetchProductDetail(String(productId), { light: false }).catch(() => null);
  if (!detail?.id) return null;

  const parsed = parseBarcodeMetaFields(meta);
  if (parsed.shade && detail.shades?.length) {
    const shade = detail.shades.find((s) => shadeNamesMatch(s.nameAr || s.name, parsed.shade));
    if (shade) return formatEanHit(detail, digits, 'shade', shade);
  }

  const hay = `${detail.nameAr} ${detail.nameEn} ${detail.brandAr}`.toLowerCase();
  const score = scoreStoreHintMatch(detail, meta);
  const words = parsed.productWords.filter((w) => w.length >= 4);
  const wordHits = words.filter((w) => hay.includes(w.toLowerCase())).length;

  if (score >= 20 || (words.length && wordHits >= Math.min(2, words.length))) {
    return formatEanHit(detail, digits, 'hint', null);
  }
  return null;
}

async function searchByMetaHints(digits, meta) {
  if (!meta?.brand && !meta?.title) return [];

  const queries = buildMetaHintQueries(meta);
  const scored = [];
  const seenIds = new Set();

  for (const q of queries) {
    try {
      const { hits } = await typesenseSearch(q, { perPage: 20 });
      for (const hit of hits || []) {
        const mapped = mapTypesenseHit(hit.document || hit);
        const idKey = String(mapped.id || '');
        if (!idKey || seenIds.has(idKey)) continue;
        seenIds.add(idKey);

        const score = scoreStoreHintMatch(mapped, meta);
        if (score < 10) continue;
        scored.push({ mapped, score });
      }
    } catch { /* next query */ }
  }

  scored.sort((a, b) => b.score - a.score);
  const results = [];

  for (const { mapped, score } of scored.slice(0, 6)) {
    const confirmed = await confirmHintHit(mapped.id, digits, meta);
    if (confirmed) {
      confirmed.matchScore = score;
      results.push(confirmed);
      if (score >= 30) break;
    }
  }

  return results;
}

async function searchFromWebLinks(digits) {
  const ids = await findMiswagIdsFromWeb(digits);
  const results = [];
  for (const id of ids.slice(0, 3)) {
    const detail = await fetchProductDetail(id, { light: false }).catch(() => null);
    if (detail?.id) {
      results.push(formatEanHit(detail, digits, 'web_link', null));
    }
  }
  return results;
}

/**
 * بحث بالباركود العالمي (EAN/UPC) — ليس رقم مسواگ الداخلي.
 */
export async function searchByEan(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return [];

  // 1) فهرس محلي
  const indexed = await resolveFromIndex(digits);
  if (indexed) return [indexed];

  // 2) metadata → بحث تلميحات في Typesense
  const meta = await lookupBarcodeProductMeta(digits).catch(() => null);
  if (meta?.brand || meta?.title) {
    const hinted = await searchByMetaHints(digits, normalizeBarcodeMeta(meta));
    if (hinted.length) {
      learnHit(digits, hinted[0], meta);
      return hinted;
    }
  }

  // 3) روابط miswag.com من نتائج الويب
  const fromWeb = await searchFromWebLinks(digits);
  if (fromWeb.length) {
    learnHit(digits, fromWeb[0], meta || {});
    return fromWeb;
  }

  return [];
}
