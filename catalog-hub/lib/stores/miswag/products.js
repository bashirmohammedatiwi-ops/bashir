import {
  miswagFetch,
  typesenseSearch,
  formatPrice,
  absImage,
  parseTitle,
  DETAIL_TTL,
  cacheGet,
  cacheSet,
} from './client.js';
import {
  fetchV2BarcodesForIds,
  fetchV2Barcode,
  isValidEan,
} from './v2-barcode.js';
import { isMiswagInternalId } from './ids.js';
import { searchByMiswagId } from './id-lookup.js';
import { mapTypesenseHit } from './categories.js';
import { gtinEqual, findBarcodeIndexEntry, upsertBarcodeIndex } from '../../core/barcode-index.js';
import { resolveBilingualDescription, resolveBilingualName, splitBilingualText } from '../../core/bilingual.js';
import { isUsableBarcodeMeta, buildMetaHintQueries, lookupBarcodeProductMeta } from '../../core/barcode-meta.js';
import { guessBrandsByCountryPrefix, learnPrefixBrand, lookupBrandByPrefix, BEAUTY_BRAND_SWEEP } from '../../core/gs1-prefixes.js';

function extractEan(v = {}) {
  for (const key of ['barcode', 'ean', 'upc', 'gtin', 'isbn']) {
    const val = String(v?.[key] || '').replace(/\D/g, '');
    if (isValidEan(val)) return val;
  }
  return '';
}

/** رقم مسواگ للتدرج = معرّف variation.id (ليس باركود EAN) */
function extractMiswagShadeId(v = {}) {
  const id = String(v?.id || v?.variation_id || '').replace(/\D/g, '');
  return id || '';
}

function parseColorValue(raw = '') {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (s.startsWith('#')) return s;
  if (/^[0-9a-fA-F]{3,8}$/.test(s)) return `#${s}`;
  return s;
}

function isDefaultTitle(title = '') {
  const s = String(title || '').trim().toLowerCase();
  return !s || s === 'default' || s === 'افتراضي';
}

function mapVariation(v, optionGroup = '') {
  const miswagId = extractMiswagShadeId(v);
  const ean = extractEan(v);
  const hex = parseColorValue(v.color || v.hex);
  const { ar, en } = splitBilingualText(v.title);
  const title = String(v.title || '').trim();
  return {
    name: ar || en || title,
    nameAr: ar || (/[\u0600-\u06FF]/.test(title) ? title : ''),
    nameEn: en || (/[A-Za-z]/.test(title) && !/[\u0600-\u06FF]/.test(title) ? title : ''),
    sku: miswagId,
    optionId: miswagId,
    miswagId,
    barcode: ean,
    ean,
    hex,
    image: absImage(v.image),
    price: formatPrice(v.price),
    optionGroup,
    inStock: v.is_available !== false,
  };
}

/** جلب كل صفحات التدرجات */
async function fetchAllVariations(pid) {
  const cacheKey = `miswag:vars:${pid}`;
  const cached = cacheGet(cacheKey, DETAIL_TTL);
  if (cached) return cached;

  const allVariations = [];
  const sizeMap = new Map();
  let varInfo = {};
  let cursor = null;
  let pages = 0;

  do {
    const chunk = await miswagFetch(`/content/v1/items/${encodeURIComponent(pid)}/variations`, {
      params: cursor ? { cursor } : {},
    }).catch(() => null);
    if (!chunk) break;

    const info = chunk.info || chunk;
    varInfo = {
      ...varInfo,
      variation_title: info.variation_title || varInfo.variation_title || 'الألوان',
      size_title: info.size_title || varInfo.size_title || 'الحجم',
    };
    for (const v of info.variations || []) allVariations.push(v);
    for (const s of info.sizes || []) sizeMap.set(String(s.id), s);
    cursor = chunk.pagination?.cursor || null;
    pages += 1;
  } while (cursor && pages < 30);

  const out = {
    variation_title: varInfo.variation_title || 'الألوان',
    size_title: varInfo.size_title || 'الحجم',
    variations: allVariations,
    sizes: [...sizeMap.values()],
  };
  cacheSet(cacheKey, out);
  return out;
}

function shouldKeepVariation(shade = {}) {
  if (!isDefaultTitle(shade.name)) return true;
  return !!(shade.hex || shade.image || shade.miswagId);
}

function buildShadesFromVarInfo(varInfo = {}) {
  const optionGroup = String(varInfo.variation_title || 'الألوان').trim();
  const colors = (varInfo.variations || []).map((v) => mapVariation(v, optionGroup));
  const realColors = colors.filter(shouldKeepVariation);

  if (realColors.length) return realColors;

  if (colors.length === 1 && (varInfo.sizes || []).length > 1) {
    const sizeGroup = String(varInfo.size_title || 'الحجم').trim();
    const base = colors[0];
    return (varInfo.sizes || []).map((s) => ({
      name: String(s.title || s.id || '').trim(),
      nameAr: String(s.title || s.id || '').trim(),
      nameEn: String(s.title || s.id || '').trim(),
      barcode: extractEan(s),
      miswagId: extractMiswagShadeId(s) || base.miswagId,
      image: base.image,
      hex: base.hex,
      sku: String(s.id || ''),
      optionId: `${base.optionId}-${s.id}`,
      optionGroup: sizeGroup,
      price: base.price,
      inStock: s.is_available !== false,
    }));
  }
  return colors;
}

function collectBlocks(content = []) {
  const blocks = [];
  for (const block of content || []) {
    if (block?.type) blocks.push(block);
    if (block?.content) blocks.push(...collectBlocks(block.content));
  }
  return blocks;
}

function extractGalleryImages(blocks = []) {
  const urls = [];
  for (const b of blocks) {
    if (b.type === 'gallery' && Array.isArray(b.items)) {
      for (const it of b.items) {
        const u = absImage(it.url || it.image || it.src);
        if (u) urls.push(u);
      }
    }
    if (b.type === 'image') {
      const u = absImage(b.url || b.image);
      if (u) urls.push(u);
    }
  }
  return [...new Set(urls)];
}

async function fetchTypesenseDoc(pid) {
  try {
    const safeId = String(pid || '').replace(/`/g, '').trim();
    if (!safeId) return null;
    // الحقل product_id غير موجود في مخطط Typesense — استخدامه يكسر الفلتر بالكامل
    const { hits } = await typesenseSearch('*', {
      perPage: 1,
      filterBy: `id:=\`${safeId}\``,
    });
    return hits[0]?.document || null;
  } catch {
    return null;
  }
}

function parseTypesenseVariations(doc) {
  if (!doc) return [];
  try {
    const raw = typeof doc.variations === 'string' ? JSON.parse(doc.variations) : doc.variations;
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function typesenseImageUrl(filename = '', fallback = '') {
  const f = String(filename || '').trim();
  if (!f) return fallback;
  if (f.startsWith('http')) return absImage(f);
  return absImage(`https://cdn.miswag.me/images/images/${f}`);
}

function mapTypesenseVariation(v, optionGroup = '', fallbackImage = '') {
  const miswagId = String(v.id || v.variation_id || '').trim();
  const rawName = String(v.color || v.title || v.name || miswagId).trim();
  const { ar, en } = splitBilingualText(rawName);
  const name = ar || en || rawName;
  const extra = Array.isArray(v.additional_images) ? v.additional_images[0] : '';
  return {
    name,
    nameAr: ar || (/[\u0600-\u06FF]/.test(rawName) ? rawName : ''),
    nameEn: en || (/[A-Za-z]/.test(rawName) && !/[\u0600-\u06FF]/.test(rawName) ? rawName : ''),
    sku: miswagId,
    optionId: miswagId,
    miswagId,
    barcode: extractEan(v),
    ean: extractEan(v),
    hex: parseColorValue(v.color_code || v.hex || v.color),
    image: typesenseImageUrl(extra, fallbackImage),
    price: '',
    optionGroup,
    inStock: true,
  };
}

/** إضافة تدرجات موجودة في Typesense وغير مُرجعة من API التدرجات */
function mergeShadesFromTypesense(shades = [], tsVars = [], optionGroup = '', fallbackImage = '') {
  if (!tsVars.length) return shades;

  const byId = new Map(shades.map((s) => [String(s.sku || s.miswagId || s.optionId || ''), s]));
  const merged = [...shades];

  for (const v of tsVars) {
    const id = String(v.id || v.variation_id || '');
    if (!id || byId.has(id)) continue;
    const shade = mapTypesenseVariation(v, optionGroup, fallbackImage);
    byId.set(id, shade);
    merged.push(shade);
  }

  return merged;
}

/** دمج باركود/لون من Typesense عند غيابها في API التفاصيل */
async function enrichShadesFromTypesense(pid, shades = []) {
  if (!shades.length) return shades;
  const doc = await fetchTypesenseDoc(pid);
  const tsVars = parseTypesenseVariations(doc);
  if (!tsVars.length) return shades;

  const byId = new Map(tsVars.map((v) => [String(v.id || v.variation_id || ''), v]));
  const byColor = new Map(
    tsVars
      .filter((v) => v.color || v.hex)
      .map((v) => [String(v.color || v.hex).toLowerCase(), v]),
  );

  return shades.map((shade) => {
    const hit =
      byId.get(String(shade.sku || shade.optionId || '')) ||
      (shade.hex ? byColor.get(shade.hex.toLowerCase()) : null);
    if (!hit) return shade;
    const ean = extractEan(hit) || shade.barcode;
    const miswagId = extractMiswagShadeId(hit) || shade.miswagId || shade.sku;
    const hex = parseColorValue(hit.color || hit.hex) || shade.hex;
    return {
      ...shade,
      barcode: ean,
      miswagId,
      sku: miswagId || shade.sku,
      optionId: miswagId || shade.optionId,
      ean,
      name: shade.name && !/^\d+$/.test(shade.name) ? shade.name : String(hit.title || hit.name || shade.name || '').trim(),
      nameAr: shade.nameAr && !/^\d+$/.test(shade.nameAr)
        ? shade.nameAr
        : splitBilingualText(hit.title || hit.name || shade.nameAr || '').ar,
      nameEn: shade.nameEn && !/^\d+$/.test(shade.nameEn)
        ? shade.nameEn
        : splitBilingualText(hit.title || hit.name || shade.nameEn || '').en,
      image: shade.image || absImage(hit.image),
    };
  });
}


/** جلب باركود EAN الحقيقي من API v2 (رمز المنتج في تطبيق مسواگ) */
async function enrichShadesWithV2Barcodes(productId, shades = []) {
  if (!shades.length) {
    const barcode = await fetchV2Barcode(productId);
    return barcode ? { shades, productBarcode: barcode } : { shades, productBarcode: '' };
  }

  const ids = shades.map((s) => String(s.miswagId || s.sku || s.optionId || '')).filter(Boolean);
  const barcodeMap = await fetchV2BarcodesForIds([...new Set([productId, ...ids])]);

  const productBarcode = barcodeMap.get(String(productId)) || '';
  const enriched = shades.map((shade) => {
    const vid = String(shade.miswagId || shade.sku || shade.optionId || '');
    const fromV2 = vid ? barcodeMap.get(vid) : '';
    const barcode = fromV2 || (shades.length === 1 ? productBarcode : '') || shade.barcode;
    if (!isValidEan(barcode)) {
      return { ...shade, barcode: '', ean: '' };
    }
    return { ...shade, barcode, ean: barcode };
  });

  const fromShade = enriched.find((s) => s.barcode)?.barcode || '';
  return { shades: enriched, productBarcode: productBarcode || fromShade };
}

async function fetchTypesenseFallback(pid, { withShades = true } = {}) {
  try {
    const doc = await fetchTypesenseDoc(pid);
    if (!doc) return null;
    const names = resolveBilingualName(doc.title_AR, doc.title_EN);
    const brand = splitBilingualText(doc.brand || '');
    const thumb = absImage(doc.image || doc.image_url);
    const tsVars = withShades ? parseTypesenseVariations(doc) : [];
    const shades = tsVars
      .map((v) => mapTypesenseVariation(v, 'الألوان', thumb))
      .filter(shouldKeepVariation);
    return {
      id: String(doc.id || pid),
      sku: String(doc.alias || pid),
      nameAr: names.ar || names.en,
      nameEn: names.en || names.ar,
      brandAr: brand.ar || String(doc.brand || '').trim(),
      brandEn: brand.en || String(doc.brand || '').trim(),
      descriptionAr: '',
      descriptionEn: '',
      price: formatPrice({
        value: doc.price_numeric_value ?? doc.price_value,
        original_value: doc.price_original_value,
        currency: doc.price_currency || 'IQD',
      }),
      thumb,
      images: thumb ? [thumb] : [],
      shades,
      shadeCount: shades.length,
      hasOptions: shades.length > 1,
      barcode: '',
      miswagId: String(doc.id || pid),
      productUrl: doc.url || `https://miswag.com/products/${pid}`,
      category: [doc.l1_division_ar, doc.l2_division_ar, doc.l3_division_ar].filter(Boolean).join(' › '),
      inStock: doc.availability !== false,
    };
  } catch {
    return null;
  }
}

/** تفاصيل منتج كاملة مع كل التدرجات */
export async function fetchProductDetail(id, { light = false } = {}) {
  const pid = String(id || '').trim();
  if (!pid) return null;

  const cacheKey = `miswag:detail:${pid}:${light ? 'light' : 'full'}`;
  const cached = cacheGet(cacheKey, DETAIL_TTL);
  if (cached) return cached;

  let detail;
  let varInfo = { variations: [], sizes: [] };
  let apiFailed = false;

  try {
    [detail, varInfo] = await Promise.all([
      miswagFetch(`/content/v1/items/${encodeURIComponent(pid)}`),
      light ? Promise.resolve({ variations: [], sizes: [] }) : fetchAllVariations(pid),
    ]);
  } catch {
    apiFailed = true;
    detail = null;
  }

  if (apiFailed || !detail?.info) {
    // احتياطي Typesense — يعمل حتى لو حُظر ganesh-lama من السيرفر
    const fallback = await fetchTypesenseFallback(pid, { withShades: true });
    if (!fallback) return null;

    if (!light && fallback.shades?.length) {
      try {
        const { shades: withBarcodes, productBarcode } = await enrichShadesWithV2Barcodes(
          fallback.id,
          fallback.shades,
        );
        fallback.shades = withBarcodes;
        fallback.shadeCount = withBarcodes.length;
        fallback.hasOptions = withBarcodes.length > 1;
        if (productBarcode) fallback.barcode = productBarcode;
      } catch { /* v2 اختياري */ }
    }

    cacheSet(cacheKey, fallback);
    return fallback;
  }

  const meta = detail.info?.meta || {};
  const blocks = collectBlocks(detail.content || []);
  const images = extractGalleryImages(blocks);
  if (meta.image_url) {
    const main = absImage(meta.image_url);
    if (main && !images.includes(main)) images.unshift(main);
  }

  const thumb = absImage(meta.image_url);
  let shades = light ? [] : buildShadesFromVarInfo(varInfo);
  let tsDoc = null;
  let productBarcode = '';

  if (light) {
    try {
      productBarcode = await fetchV2Barcode(String(meta.product_id || pid));
    } catch { /* optional */ }
  }

  if (!light) {
    tsDoc = await fetchTypesenseDoc(String(meta.product_id || pid));
    const tsVars = parseTypesenseVariations(tsDoc);
    const optionGroup = String(varInfo.variation_title || 'الألوان').trim();
    shades = mergeShadesFromTypesense(shades, tsVars, optionGroup, thumb);
    shades = await enrichShadesFromTypesense(pid, shades);
    const { shades: withBarcodes, productBarcode } = await enrichShadesWithV2Barcodes(
      String(meta.product_id || pid),
      shades,
    );
    shades = withBarcodes;
    if (productBarcode) {
      meta._v2ProductBarcode = productBarcode;
    }
  }

  const brand = String(meta.brand || '').trim();
  const brandNames = splitBilingualText(brand);
  const names = resolveBilingualName(meta.name, tsDoc?.title_AR, tsDoc?.title_EN);
  const descriptions = resolveBilingualDescription(meta.description);

  const product = {
    id: String(meta.product_id || pid),
    sku: String(meta.product_id || pid),
    nameAr: names.ar || names.en,
    nameEn: names.en || names.ar,
    brandAr: brandNames.ar || brand,
    brandEn: brandNames.en || brand,
    descriptionAr: descriptions.ar,
    descriptionEn: descriptions.en,
    price: formatPrice({ value: meta.price, original_value: meta.original_price, currency: meta.currency || 'IQD' }),
    thumb: images[0] || absImage(meta.image_url),
    images,
    shades,
    shadeCount: shades.length,
    hasOptions: shades.length > 1 || (varInfo.sizes?.length > 1),
    barcode: productBarcode || meta._v2ProductBarcode || extractEan(meta) || shades.find((s) => s.barcode)?.barcode || '',
    miswagId: String(meta.product_id || pid),
    productUrl: meta.url || meta.share_link || `https://miswag.com/products/${meta.product_id || pid}`,
    category: String(meta.category || '').trim(),
    inStock: detail.info?.size?.is_available !== false,
  };

  cacheSet(cacheKey, product);

  // حفظ الباركودات تلقائياً في الكاش المحلي — بحث الباركود يصبح فورياً في المرات القادمة
  if (!light) {
    const pid = product.id;
    if (product.barcode) {
      upsertBarcodeIndex(product.barcode, { store: 'miswag', productId: pid });
    }
    for (const shade of product.shades || []) {
      if (shade.barcode) {
        upsertBarcodeIndex(shade.barcode, {
          store: 'miswag',
          productId: pid,
          shadeName: shade.nameAr || shade.name || '',
        });
      }
    }
  }

  return product;
}

function toBarcodeHit(item, digits, matchType, extra = {}) {
  return {
    id: item.id,
    nameAr: item.nameAr,
    nameEn: item.nameEn,
    brandAr: item.brandAr,
    brandEn: item.brandEn,
    thumb: item.thumb,
    price: item.price,
    shadeCount: item.shadeCount,
    hasOptions: item.hasOptions,
    shadeName: extra.shadeName || '',
    barcode: digits,
    matchType,
  };
}

function withDeadline(promise, ms, fallback) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      () => { clearTimeout(timer); resolve(fallback); },
    );
  });
}

/**
 * بحث Typesense بلا قيد قسم — للباركود نبحث في كل كتالوج مسواگ
 * (المستحضرات في "beauty"، العطور في "perfumes"، العناية في "personal-care"...).
 */
async function typesenseBroadSearch(q, perPage = 20) {
  const { hits = [] } = await typesenseSearch(q, {
    perPage,
    strict: false,
    usePreset: false,
  }).catch(() => ({ hits: [] }));
  return hits.map((h) => mapTypesenseHit(h.document || h)).filter((p) => p.id);
}

/**
 * تجميع مرشّحين محتملين للباركود — بلا أرشيف محلي:
 * 1) بادئة GS1 (شركة الباركود) → اسم ماركة معروف/متعلَّم → بحث Typesense فوري.
 * 2) استعلام metadata خارجي (UPC/OpenBeautyFacts/ويب) بالتوازي — يعطي اسم/ماركة المنتج الحقيقي.
 * كلاهما يعملان بالتوازي، فلا يُبطئ أحدهما الآخر.
 */
/**
 * كم نتيجة نجلب لكل ماركة — نرفع الحد كلّما قلّ عدد الماركات المستهدفة
 * حتى نغطي المنتجات ذات التقييم المنخفض التي لا تظهر في أعلى النتائج.
 */
function perBrandLimit(brandsCount) {
  if (brandsCount <= 1) return 100;
  if (brandsCount <= 2) return 60;
  if (brandsCount <= 4) return 40;
  if (brandsCount <= 8) return 30;
  return 20;
}

async function collectBarcodeCandidates(digits) {
  const seen = new Map();
  const addAll = (items) => {
    for (const item of items) if (item?.id) seen.set(item.id, item);
  };

  const knownBrand = lookupBrandByPrefix(digits);
  const guessedBrands = knownBrand ? [knownBrand] : guessBrandsByCountryPrefix(digits);
  const limit = perBrandLimit(guessedBrands.length);

  const brandSearch = Promise.all(
    guessedBrands.map((brand) => typesenseBroadSearch(brand, limit)),
  ).then((lists) => lists.flat());

  // مهلة قصوى لبحث الميتاداتا الخارجي — لا يعطّل السرعة الإجمالية إن تأخرت مصادره
  const metaPromise = withDeadline(lookupBarcodeProductMeta(digits).catch(() => null), 7_000, null);

  const [brandHits, meta] = await Promise.all([brandSearch, metaPromise]);
  addAll(brandHits);

  if (meta && isUsableBarcodeMeta(meta)) {
    const queries = buildMetaHintQueries(meta).slice(0, 3);
    const metaHits = (await Promise.all(queries.map((q) => typesenseBroadSearch(q, 20)))).flat();
    addAll(metaHits);
  }

  // احتياط أخير — قد يظهر الباركود حرفياً في نص المنتج (نادر لكن رخيص)
  if (!seen.size) {
    addAll(await typesenseBroadSearch(digits, 8));
  }

  // لا بادئة معروفة ولا metadata مفيدة — مسح موجّه لأشهر الماركات (محدود بمهلة)
  if (!seen.size && !guessedBrands.length) {
    const sweepHits = await withDeadline(
      Promise.all(BEAUTY_BRAND_SWEEP.map((brand) => typesenseBroadSearch(brand, 15))).then((l) => l.flat()),
      9_000,
      [],
    );
    addAll(sweepHits);
  }

  // سقف أمان — يمنع مهلة تحقّق v2 من الانفجار عند مسح ماركات واسع
  return { candidates: [...seen.values()].slice(0, 200), meta };
}

/**
 * بحث بالباركود — خروج مبكر عند أول تطابق (لا ننتظر كل المرشحين).
 * دُفعات متتالية من 12 مرشحاً بالتوازي: الكسب الأول يُوقف البحث فوراً.
 */
export async function searchBarcode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (!digits) return [];

  if (isMiswagInternalId(digits)) {
    return searchByMiswagId(digits);
  }

  if (!isValidEan(digits)) {
    console.log(`[miswag/barcode] rejected digits="${digits}" — failed isValidEan`);
    return [];
  }

  // ── كاش محلي: O(1) — كل منتج تُفتح تفاصيله يُحفظ باركوده تلقائياً ──
  const cached = findBarcodeIndexEntry(digits);
  if (cached?.store === 'miswag' && cached.productId) {
    console.log(`[miswag/barcode] cache hit productId=${cached.productId}`);
    const item = await fetchProductDetail(cached.productId, { light: false }).catch(() => null);
    if (item) {
      if (item.barcode && gtinEqual(item.barcode, digits)) {
        learnPrefixBrand(digits, item.brandAr || item.brandEn);
        return [toBarcodeHit(item, digits, 'ean')];
      }
      const shade = (item.shades || []).find((s) => s.barcode && gtinEqual(s.barcode, digits));
      if (shade) {
        learnPrefixBrand(digits, item.brandAr || item.brandEn);
        return [toBarcodeHit(item, digits, 'ean', { shadeName: shade.nameAr || shade.name })];
      }
    }
  }

  const { candidates } = await collectBarcodeCandidates(digits);
  console.log(`[miswag/barcode] digits="${digits}" candidates=${candidates.length}`);
  if (!candidates.length) return [];

  // 1) فحص المستوى الأول (الأب) — دُفعات 12 مع خروج مبكر
  const BATCH = 12;
  for (let i = 0; i < candidates.length; i += BATCH) {
    const batch = candidates.slice(i, i + BATCH);
    const barcodeMap = await fetchV2BarcodesForIds(batch.map((c) => c.id), { concurrency: BATCH });
    for (const item of batch) {
      const bc = barcodeMap.get(String(item.id));
      if (bc && gtinEqual(bc, digits)) {
        learnPrefixBrand(digits, item.brandAr || item.brandEn);
        console.log(`[miswag/barcode] ✓ parent match id=${item.id} barcode=${bc}`);
        return [toBarcodeHit(item, digits, 'ean')];
      }
    }
  }

  // 2) لم يُطابق مستوى الأب — فحص التدرجات لأفضل 8 مرشحين
  const top = candidates.slice(0, 8);
  const details = await Promise.all(
    top.map((item) => fetchProductDetail(item.id, { light: false }).catch(() => null)),
  );

  for (const detail of details) {
    if (!detail) continue;
    if (detail.barcode && gtinEqual(detail.barcode, digits)) {
      learnPrefixBrand(digits, detail.brandAr || detail.brandEn);
      return [toBarcodeHit(detail, digits, 'ean')];
    }
    const shade = (detail.shades || []).find((s) => s.barcode && gtinEqual(s.barcode, digits));
    if (shade) {
      learnPrefixBrand(digits, detail.brandAr || detail.brandEn);
      return [toBarcodeHit(detail, digits, 'ean', { shadeName: shade.nameAr || shade.name })];
    }
  }

  console.log(`[miswag/barcode] ✗ no match for digits="${digits}"`);
  return [];
}
