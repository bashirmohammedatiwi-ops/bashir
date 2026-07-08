import { typesenseSearch, typesenseMultiSearch } from './client.js';
import { mapTypesenseHit } from './categories.js';
import { fetchProductDetail } from './products.js';
import {
  findBarcodeIndexEntry,
  findBarcodeIndexSiblings,
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
  matchBarcodeOnMiswagProduct,
  scanMiswagProductsForBarcode,
  scanParentBarcodesForBarcode,
  searchTypesenseByVariationBarcode,
} from './barcode-scan.js';
import { learnPrefixBrand, lookupBrandByPrefix } from '../../core/gs1-prefixes.js';

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
  clearMiss(digits);
  learnBrandPrefixFromProduct(digits, hit.id).catch(() => {});
}

async function learnBrandPrefixFromProduct(digits, productId) {
  const [result = {}] = await typesenseMultiSearch([{
    q: '*',
    query_by: 'title_AR',
    filter_by: `id:=${String(productId)}`,
    per_page: 1,
    page: 1,
  }]);
  const brand = String(result.hits?.[0]?.document?.brand || '').trim();
  if (brand) learnPrefixBrand(digits, brand);
}

/** فهرس محلي سريع — light أولاً ثم تحقق v2 عند الحاجة فقط */
async function resolveFromIndex(digits) {
  const entry = findBarcodeIndexEntry(digits);
  if (!entry?.productId) return null;

  // مسار سريع: Typesense stub + light detail
  try {
    const [tsResult = {}] = await typesenseMultiSearch([{
      q: '*',
      query_by: 'title_AR',
      filter_by: `id:=${String(entry.productId)}`,
      per_page: 1,
      page: 1,
    }]);
    const mapped = mapTypesenseHit(tsResult.hits?.[0]?.document || {});
    if (mapped?.id) {
      const shadeStub = entry.shadeName
        ? { name: entry.shadeName, nameAr: entry.shadeName, image: mapped.thumb }
        : null;
      // إن كان الفهرس حديثاً وموثوقاً — أعد فوراً دون v2 كامل
      const age = Date.now() - Number(entry.updatedAt || 0);
      if (age < 7 * 24 * 60 * 60 * 1000) {
        return formatEanHit(mapped, digits, entry.matchType || 'index', shadeStub);
      }
    }
  } catch { /* تابع للتحقق */ }

  const detail = await fetchProductDetail(String(entry.productId), { light: true }).catch(() => null);
  if (detail?.id) {
    let shade = null;
    if (entry.shadeName && detail.shades?.length) {
      shade = detail.shades.find((s) => shadeNamesMatch(s.nameAr || s.name, entry.shadeName));
    }
    return formatEanHit(detail, digits, entry.matchType || 'index', shade);
  }

  const match = await matchBarcodeOnMiswagProduct(String(entry.productId), digits).catch(() => null);
  if (match) return resolveV2Match(digits, match, entry.matchType || 'index');
  return null;
}

async function resolveV2Match(digits, match, matchType = 'v2_scan') {
  // light أولاً للسرعة — يكفي للعرض في نتائج البحث
  let detail = await fetchProductDetail(match.productId, { light: true }).catch(() => null);
  if (!detail?.id) {
    detail = await fetchProductDetail(match.productId, { light: false }).catch(() => null);
  }

  if (detail?.id) {
    let shade = null;
    if (match.shadeId && detail.shades?.length) {
      shade = detail.shades.find(
        (s) => String(s.miswagId || s.sku || s.optionId) === String(match.shadeId),
      );
      if (!shade && match.shadeName) {
        shade = detail.shades.find((s) => shadeNamesMatch(s.nameAr || s.name, match.shadeName));
      }
    }
    // إن لم تُحمَّل التدرجات في light — استخدم اسم التدرج من المسح
    if (!shade && match.shadeName) {
      shade = { name: match.shadeName, nameAr: match.shadeName, image: detail.thumb };
    }

    const hit = formatEanHit(detail, digits, shade ? 'v2_shade' : matchType, shade);
    learnHit(digits, hit, {});
    return hit;
  }

  try {
    const [tsResult = {}] = await typesenseMultiSearch([{
      q: '*',
      query_by: 'title_AR',
      filter_by: `id:=${String(match.productId)}`,
      per_page: 1,
      page: 1,
    }]);
    const mapped = mapTypesenseHit(tsResult.hits?.[0]?.document || {});
    if (!mapped?.id) return null;

    const shadeStub = match.shadeName
      ? { name: match.shadeName, nameAr: match.shadeName, image: mapped.thumb }
      : null;
    const hit = formatEanHit(mapped, digits, shadeStub ? 'v2_shade' : matchType, shadeStub);
    learnHit(digits, hit, {});
    return hit;
  } catch {
    return null;
  }
}

async function collectCandidateIdsFromMeta(meta, { perQuery = 12, maxQueries = 4 } = {}) {
  if (!meta?.brand && !meta?.title) return [];

  const queries = buildMetaHintQueries(meta).slice(0, maxQueries);
  const scored = [];
  const seen = new Set();

  // استعلامات Typesense بالتوازي بدل التسلسل
  const batches = await Promise.all(
    queries.map((q) => typesenseSearch(q, { perPage: perQuery }).catch(() => ({ hits: [] }))),
  );

  for (const { hits } of batches) {
    for (const hit of hits || []) {
      const mapped = mapTypesenseHit(hit.document || hit);
      const id = String(mapped.id || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      scored.push({ id, score: scoreStoreHintMatch(mapped, meta) });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.id);
}

async function searchByV2Scan(productIds, digits, scanOpts = {}) {
  const match = await scanMiswagProductsForBarcode(productIds, digits, scanOpts);
  if (!match) return null;
  return resolveV2Match(digits, match);
}

function brandTypesenseFilter(brand = '') {
  const value = String(brand || '').trim().replace(/`/g, '');
  if (!value) return '';
  return `brand:=\`${value}\``;
}

function brandTokens(value = '') {
  return String(value || '').toLowerCase().split(/[^a-z0-9\u0600-\u06FF]+/).filter((t) => t.length >= 2);
}

async function resolveCanonicalBrands(brand) {
  const value = String(brand || '').trim();
  if (!value) return [];

  try {
    const [result = {}] = await typesenseMultiSearch([{
      q: value,
      query_by: 'brand',
      per_page: 40,
      page: 1,
    }]);
    const found = [...new Set(
      (result.hits || []).map((h) => String(h.document?.brand || '').trim()).filter(Boolean),
    )];

    const wanted = brandTokens(value);
    const scored = found
      .map((b) => {
        const tokens = brandTokens(b);
        const overlap = wanted.filter((t) => tokens.includes(t)).length;
        const exact = b.toLowerCase() === value.toLowerCase() ? 100 : 0;
        return { brand: b, score: exact + overlap };
      })
      .filter((x) => x.score >= Math.min(wanted.length, 2))
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 3).map((x) => x.brand);
  } catch {
    return [];
  }
}

async function searchByBrandCatalogV2(digits, meta, { deadline = 0 } = {}) {
  const rawBrand = String(meta?.brand || '').trim();
  if (!rawBrand) return null;

  const canonical = meta?.exactBrand ? [rawBrand] : await resolveCanonicalBrands(rawBrand);
  const brands = canonical.length ? canonical : [rawBrand];

  for (const brand of brands) {
    if (deadline && Date.now() > deadline) return null;
    try {
      const [result = {}] = await typesenseMultiSearch([{
        q: '*',
        query_by: 'title_AR',
        filter_by: brandTypesenseFilter(brand),
        per_page: 250,
        page: 1,
      }]);
      const ids = (result.hits || [])
        .map((hit) => String(hit.document?.id || ''))
        .filter(Boolean);
      if (!ids.length) continue;

      ids.sort((a, b) => Number(b) - Number(a));

      const parentMatch = await scanParentBarcodesForBarcode(ids, digits, { deadline, concurrency: 20 });
      if (parentMatch) {
        learnPrefixBrand(digits, brand);
        const resolved = await resolveV2Match(digits, parentMatch, 'v2_scan');
        if (resolved) return resolved;
      }

      const hit = await searchByV2Scan(
        ids,
        digits,
        { limit: 30, concurrency: 8, deadline },
      );
      if (hit) {
        learnPrefixBrand(digits, brand);
        return hit;
      }
    } catch { /* الماركة التالية */ }
  }

  return null;
}

async function searchByKnownPrefix(digits, { deadline = 0 } = {}) {
  const brand = lookupBrandByPrefix(digits);
  if (!brand) return null;
  return searchByBrandCatalogV2(digits, { brand, exactBrand: true }, { deadline });
}

async function searchBySiblingPrefix(digits, { deadline = 0 } = {}) {
  const siblings = findBarcodeIndexSiblings(digits);
  if (!siblings.length) return null;

  const ids = [...new Set(siblings.map((s) => String(s.productId || '')).filter(Boolean))];
  if (!ids.length) return null;
  return searchByV2Scan(ids, digits, { limit: ids.length, concurrency: 8, deadline });
}

const GULF_PERFUME_BRANDS = [
  'IBRAQ',
  'ابراهيم القرشي',
  'Ibraheem Al Qurashi',
  'عساف',
  'العربية للعود',
  'Rasasi',
  'رصاصي',
  'LATTAFA',
  'لطافة',
  'Lattafa',
  'Al Wataniah',
  'الوطنية',
  'Nabeel',
  'نبيل',
  'Ajmal',
  'أجمل',
];

async function searchByGulfBrandV2Sweep(digits, budgetLeft = () => 60_000, deadline = 0) {
  if (!/^(628|629)/.test(digits)) return null;

  const priority = ['IBRAQ', 'ابراهيم القرشي', 'Ibraheem Al Qurashi', 'عساف', 'Rasasi', 'رصاصي'];
  const seen = new Set(priority);
  const brands = [...priority, ...GULF_PERFUME_BRANDS.filter((b) => !seen.has(b))].slice(0, 6);

  for (const brand of brands) {
    if (budgetLeft() < 2500) return null;
    const hit = await searchByBrandCatalogV2(digits, { brand }, { deadline });
    if (hit) return hit;
  }
  return null;
}

async function searchByTypesenseVariationScan(digits, { deadline = 0 } = {}) {
  const hits = await searchTypesenseByVariationBarcode(digits);
  const ids = hits.map((h) => String(h.document?.id || h.document?.product_id || '')).filter(Boolean);
  if (!ids.length) return null;
  return searchByV2Scan(ids, digits, { limit: 20, concurrency: 8, deadline });
}

async function confirmHintHit(productId, digits, meta) {
  const detail = await fetchProductDetail(String(productId), { light: true }).catch(() => null);
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

async function searchByMetaHints(digits, meta, { deadline = 0 } = {}) {
  const candidateIds = await collectCandidateIdsFromMeta(meta);

  const v2Hit = await searchByV2Scan(candidateIds, digits, { limit: 20, concurrency: 8, deadline });
  if (v2Hit) return [v2Hit];

  const brandHit = await searchByBrandCatalogV2(digits, meta, { deadline });
  if (brandHit) return [brandHit];

  const queries = buildMetaHintQueries(meta).slice(0, 4);
  const scored = [];
  const seenIds = new Set();

  const batches = await Promise.all(
    queries.map((q) => typesenseSearch(q, { perPage: 15 }).catch(() => ({ hits: [] }))),
  );

  for (const { hits } of batches) {
    for (const hit of hits || []) {
      const mapped = mapTypesenseHit(hit.document || hit);
      const idKey = String(mapped.id || '');
      if (!idKey || seenIds.has(idKey)) continue;
      seenIds.add(idKey);
      const score = scoreStoreHintMatch(mapped, meta);
      if (score < 14) continue;
      scored.push({ mapped, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  if (scored.length >= 2) {
    const top = scored[0];
    const second = scored[1];
    if (top.score - second.score < 12) return [];
  }

  for (const { mapped, score } of scored.slice(0, 3)) {
    if (deadline && Date.now() > deadline) break;
    const confirmed = await confirmHintHit(mapped.id, digits, meta);
    if (confirmed && score >= 28) {
      confirmed.matchScore = score;
      learnHit(digits, confirmed, meta);
      return [confirmed];
    }
  }

  return [];
}

async function searchFromWebLinks(digits, { deadline = 0 } = {}) {
  const ids = await findMiswagIdsFromWeb(digits);
  const v2Hit = await searchByV2Scan(ids, digits, { limit: 8, concurrency: 6, deadline });
  if (v2Hit) return [v2Hit];
  return [];
}

async function resolveProductMeta(digits) {
  let meta = await lookupBarcodeProductMeta(digits).catch(() => null);
  if (meta?.brand || meta?.title) return normalizeBarcodeMeta(meta);

  const upc = await lookupUpcByBarcode(digits).catch(() => null);
  if (upc?.brand || upc?.title) return normalizeBarcodeMeta(upc);
  return null;
}

// كاش سلبي قصير — لا يمنع إعادة المحاولة لساعات
const missCache = new Map();
const MISS_TTL_MS = 90 * 1000;

function clearMiss(digits) {
  missCache.delete(String(digits || '').replace(/\D/g, ''));
}

// ميزانية أقصر للمسار السريع — المراحل الثقيلة تُقطع مبكراً
const TIME_BUDGET_MS = 18_000;

/**
 * بحث بالباركود العالمي (EAN/UPC) — مسار سريع أولاً ثم عميق.
 *
 * الترتيب:
 * 1) فهرس محلي (فوري)
 * 2) Typesense variations (رخيص)
 * 3) أشقاء GS1 + بادئة معروفة
 * 4) metadata + مسح v2 موجّه
 * 5) ويب / خليجي (احتياطي)
 */
export async function searchByEan(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return [];

  // 1) فهرس محلي — لا تمنعه ميزانية الوقت ولا الكاش السلبي
  const indexed = await resolveFromIndex(digits);
  if (indexed) return [indexed];

  const missAt = missCache.get(digits);
  if (missAt && Date.now() - missAt < MISS_TTL_MS) return [];

  const startedAt = Date.now();
  const budgetLeft = () => TIME_BUDGET_MS - (Date.now() - startedAt);
  const deadline = startedAt + TIME_BUDGET_MS;

  // 2) Typesense variations أولاً — غالباً أسرع من metadata الخارجية
  if (budgetLeft() > 0) {
    const fromVariations = await searchByTypesenseVariationScan(digits, { deadline });
    if (fromVariations) return [fromVariations];
  }

  // 3) أشقاء GS1 + بادئة معروفة — بالتوازي
  if (budgetLeft() > 0) {
    const [siblingHit, prefixHit] = await Promise.all([
      searchBySiblingPrefix(digits, { deadline }),
      searchByKnownPrefix(digits, { deadline }),
    ]);
    if (siblingHit) return [siblingHit];
    if (prefixHit) return [prefixHit];
  }

  // 4) metadata خارجية + مسح موجّه
  const meta = budgetLeft() > 2000
    ? await resolveProductMeta(digits)
    : null;

  if ((meta?.brand || meta?.title) && budgetLeft() > 0) {
    const hinted = await searchByMetaHints(digits, meta, { deadline });
    if (hinted.length) return hinted;
  }

  // 5) روابط miswag.com من الويب
  if (budgetLeft() > 4000) {
    const fromWeb = await searchFromWebLinks(digits, { deadline });
    if (fromWeb.length) return fromWeb;
  }

  // 6) باركودات خليجية بلا UPC
  if (budgetLeft() > 5000) {
    const gulfHit = await searchByGulfBrandV2Sweep(digits, budgetLeft, deadline);
    if (gulfHit) return [gulfHit];
  }

  missCache.set(digits, Date.now());
  return [];
}

/** إلغاء الكاش السلبي لباركود (يُستدعى عند فهرسة ناجحة) */
export function clearEanMissCache(barcode) {
  clearMiss(barcode);
}
