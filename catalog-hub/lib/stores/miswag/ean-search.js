import { typesenseSearch, typesenseMultiSearch } from './client.js';
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
  matchBarcodeOnMiswagProduct,
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
  if (detail?.id) {
    let shade = null;
    if (entry.shadeName && detail.shades?.length) {
      shade = detail.shades.find((s) => shadeNamesMatch(s.nameAr || s.name, entry.shadeName));
    }
    return formatEanHit(detail, digits, entry.matchType || 'index', shade);
  }

  // الفهرس يعرف المنتج لكن جلب التفاصيل فشل — تحقق مباشرة عبر v2
  const match = await matchBarcodeOnMiswagProduct(String(entry.productId), digits).catch(() => null);
  if (match) return resolveV2Match(digits, match, entry.matchType || 'index');

  return null;
}

async function resolveV2Match(digits, match, matchType = 'v2_scan') {
  const detail = await fetchProductDetail(match.productId, { light: false }).catch(() => null);
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

    const hit = formatEanHit(detail, digits, shade ? 'v2_shade' : matchType, shade);
    learnHit(digits, hit, {});
    return hit;
  }

  // مسواگ API مشغول — أعد النتيجة من Typesense بدل الفشل الصامت
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

/** مسح v2 لكل منتجات ماركة معيّنة (أدق من التخمين عبر hints فقط) */
async function searchByBrandCatalogV2(digits, meta) {
  const brand = String(meta?.brand || '').trim();
  if (!brand) return null;

  try {
    const filterBy = brandTypesenseFilter(brand);
    const [result = {}] = await typesenseMultiSearch([{
      q: '*',
      query_by: 'title_AR',
      filter_by: filterBy,
      per_page: 100,
      page: 1,
    }]);
    const ids = (result.hits || [])
      .map((hit) => String(hit.document?.id || ''))
      .filter(Boolean);
    if (!ids.length) return null;

    // الأحدث أولاً — يقلّل طلبات API ويُسرّع إيجاد المنتجات الحديثة
    return searchByV2Scan([...ids].reverse(), digits, { limit: ids.length, concurrency: 5 });
  } catch {
    return null;
  }
}

/** باركودات خليجية (628/629) بلا metadata خارجية — مسح ماركات عطور محلية شائعة */
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

async function searchByGulfBrandV2Sweep(digits, budgetLeft = () => 60_000) {
  if (!/^(628|629)/.test(digits)) return null;

  const priority = ['IBRAQ', 'ابراهيم القرشي', 'Ibraheem Al Qurashi', 'عساف', 'Rasasi', 'رصاصي'];
  const seen = new Set(priority);
  const brands = [...priority, ...GULF_PERFUME_BRANDS.filter((b) => !seen.has(b))].slice(0, 8);

  for (const brand of brands) {
    if (budgetLeft() < 3000) return null;
    const hit = await searchByBrandCatalogV2(digits, { brand });
    if (hit) return hit;
  }
  return null;
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
  const v2Hit = await searchByV2Scan(candidateIds, digits, { limit: 25, concurrency: 5 });
  if (v2Hit) return [v2Hit];

  // ثم مسح كامل لمنتجات الماركة (للباركودات التي لا تظهر في hints)
  const brandHit = await searchByBrandCatalogV2(digits, meta);
  if (brandHit) return [brandHit];

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

// كاش سلبي — لا يُعاد تشغيل البايبلاين الكامل لباركود فشل مؤخراً
const missCache = new Map();
const MISS_TTL_MS = 30 * 60 * 1000;

// ميزانية وقت — البحث يتوقف عند أول مرحلة تتجاوزها بدل الاستمرار لدقيقة
const TIME_BUDGET_MS = 25_000;

/**
 * بحث بالباركود العالمي (EAN/UPC) — ليس رقم مسواگ الداخلي.
 */
export async function searchByEan(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return [];

  // 1) فهرس محلي (يُبنى تلقائياً بعد أول نجاح) — لا تمنعه ميزانية الوقت
  const indexed = await resolveFromIndex(digits);
  if (indexed) return [indexed];

  const missAt = missCache.get(digits);
  if (missAt && Date.now() - missAt < MISS_TTL_MS) return [];

  const startedAt = Date.now();
  const budgetLeft = () => TIME_BUDGET_MS - (Date.now() - startedAt);

  const meta = await resolveProductMeta(digits);

  // 2) metadata → مرشّحين → مسح v2 (الطريقة الأدق — من أول مرة)
  if ((meta?.brand || meta?.title) && budgetLeft() > 0) {
    const hinted = await searchByMetaHints(digits, meta);
    if (hinted.length) return hinted;
  }

  // 3) Typesense variations → مسح v2
  if (budgetLeft() > 0) {
    const fromVariations = await searchByTypesenseVariationScan(digits);
    if (fromVariations) return [fromVariations];
  }

  // 4) روابط miswag.com من الويب → مسح v2
  if (budgetLeft() > 3000) {
    const fromWeb = await searchFromWebLinks(digits);
    if (fromWeb.length) return fromWeb;
  }

  // 5) باركودات خليجية بلا UPC — مسح ماركات عطور محلية عبر v2
  if (budgetLeft() > 5000) {
    const gulfHit = await searchByGulfBrandV2Sweep(digits, budgetLeft);
    if (gulfHit) return [gulfHit];
  }

  missCache.set(digits, Date.now());
  return [];
}
