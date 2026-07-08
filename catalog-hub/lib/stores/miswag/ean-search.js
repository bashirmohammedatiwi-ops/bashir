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
  lookupUpcByBarcode,
  normalizeBarcodeMeta,
  parseBarcodeMetaFields,
  scoreStoreHintMatch,
} from '../../core/barcode-meta.js';
import {
  scanMiswagProductsForBarcode,
  searchTypesenseByVariationBarcode,
} from './barcode-scan.js';

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

async function resolveV2Match(digits, match, matchType = 'v2_scan') {
  const detail = await fetchProductDetail(match.productId, { light: false }).catch(() => null);
  if (!detail?.id) return null;

  let shade = null;
  if (match.shadeId && detail.shades?.length) {
    shade = detail.shades.find(
      (s) => String(s.miswagId || s.sku || s.optionId) === String(match.shadeId),
    );
    if (!shade && match.shadeName) {
      shade = detail.shades.find((s) => shadeNamesMatch(s.nameAr || s.name, match.shadeName));
    }
  }

  const hit = formatEanHit(detail, digits, shade ? 'v2_shade' : matchType, shade);
  learnHit(digits, hit, {});
  return hit;
}

/** جمع معرّفات منتجات مرشّحة من metadata الباركود */
async function collectCandidateIdsFromMeta(meta, { perQuery = 15, maxQueries = 6 } = {}) {
  if (!meta?.brand && !meta?.title) return [];

  const queries = buildMetaHintQueries(meta).slice(0, maxQueries);
  const scored = [];
  const seen = new Set();

  for (const q of queries) {
    try {
      const { hits } = await typesenseSearch(q, { perPage: perQuery });
      for (const hit of hits || []) {
        const mapped = mapTypesenseHit(hit.document || hit);
        const id = String(mapped.id || '');
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const score = scoreStoreHintMatch(mapped, meta);
        scored.push({ id, score });
      }
    } catch { /* next */ }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.id);
}

async function searchByV2Scan(productIds, digits) {
  const match = await scanMiswagProductsForBarcode(productIds, digits);
  if (!match) return null;
  return resolveV2Match(digits, match);
}

async function searchByTypesenseVariationScan(digits) {
  const hits = await searchTypesenseByVariationBarcode(digits);
  const ids = hits.map((h) => String(h.document?.id || h.document?.product_id || '')).filter(Boolean);
  return searchByV2Scan(ids, digits);
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

  if (score >= 28 && wordHits >= 1) {
    return formatEanHit(detail, digits, 'hint', null);
  }
  return null;
}

async function searchByMetaHints(digits, meta) {
  const candidateIds = await collectCandidateIdsFromMeta(meta);

  // التحقق الدقيق عبر v2 — يعمل من أول بحث دون انتظار الفهرس
  const v2Hit = await searchByV2Scan(candidateIds, digits);
  if (v2Hit) return [v2Hit];

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
        if (score < 14) continue;
        scored.push({ mapped, score });
      }
    } catch { /* next query */ }
  }

  scored.sort((a, b) => b.score - a.score);

  if (scored.length >= 2) {
    const top = scored[0];
    const second = scored[1];
    if (top.score - second.score < 12) return [];
  }

  for (const { mapped, score } of scored.slice(0, 3)) {
    const confirmed = await confirmHintHit(mapped.id, digits, meta);
    if (confirmed && score >= 28) {
      confirmed.matchScore = score;
      learnHit(digits, confirmed, meta);
      return [confirmed];
    }
  }

  return [];
}

async function searchFromWebLinks(digits) {
  const ids = await findMiswagIdsFromWeb(digits);
  const v2Hit = await searchByV2Scan(ids, digits);
  if (v2Hit) return [v2Hit];

  const results = [];
  for (const id of ids.slice(0, 3)) {
    const detail = await fetchProductDetail(id, { light: false }).catch(() => null);
    if (detail?.id) {
      const hit = formatEanHit(detail, digits, 'web_link', null);
      learnHit(digits, hit, {});
      results.push(hit);
    }
  }
  return results;
}

async function resolveProductMeta(digits) {
  let meta = await lookupBarcodeProductMeta(digits).catch(() => null);
  if (meta?.brand || meta?.title) return normalizeBarcodeMeta(meta);

  const upc = await lookupUpcByBarcode(digits).catch(() => null);
  if (upc?.brand || upc?.title) return normalizeBarcodeMeta(upc);
  return null;
}

/**
 * بحث بالباركود العالمي (EAN/UPC) — ليس رقم مسواگ الداخلي.
 */
export async function searchByEan(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return [];

  // 1) فهرس محلي (يُبنى تلقائياً بعد أول نجاح)
  const indexed = await resolveFromIndex(digits);
  if (indexed) return [indexed];

  const meta = await resolveProductMeta(digits);

  // 2) metadata → مرشّحين → مسح v2 (الطريقة الأدق — من أول مرة)
  if (meta?.brand || meta?.title) {
    const hinted = await searchByMetaHints(digits, meta);
    if (hinted.length) return hinted;
  }

  // 3) Typesense variations → مسح v2
  const fromVariations = await searchByTypesenseVariationScan(digits);
  if (fromVariations) return [fromVariations];

  // 4) روابط miswag.com من الويب → مسح v2
  const fromWeb = await searchFromWebLinks(digits);
  if (fromWeb.length) return fromWeb;

  return [];
}
