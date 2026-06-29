/**
 * Amazon Cosmetics — قسم Makeup (node=3760911) · عربي amazon.sa + إنجليزي amazon.com
 */
const AMAZON_COM = 'https://www.amazon.com';
const AMAZON_SA = 'https://www.amazon.sa';
export const COSMETICS_ROOT_NODE = '3760911';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const HUB_PREFIX = process.env.CATALOG_HUB_PUBLIC_PREFIX || '';

/** شجرة ثنائية اللغة لقسم Makeup على Amazon (node 3760911) */
const CATEGORY_DEFS = [
  {
    id: COSMETICS_ROOT_NODE,
    nodeId: COSMETICS_ROOT_NODE,
    nameAr: 'مكياج ومستحضرات تجميل',
    nameEn: 'Makeup & Cosmetics',
    keyword: 'cosmetics',
    keywordAr: 'مستحضرات تجميل',
    children: [
      { id: '11058331', nodeId: '11058331', nameAr: 'مكياج العيون', nameEn: 'Eyes', keyword: 'eye makeup', keywordAr: 'مكياج عيون' },
      { id: '11058691', nodeId: '11058691', nameAr: 'مكياج الوجه', nameEn: 'Face', keyword: 'face makeup', keywordAr: 'مكياج وجه' },
      { id: '11059031', nodeId: '11059031', nameAr: 'مكياج الشفاه', nameEn: 'Lips', keyword: 'lip makeup', keywordAr: 'مكياج شفاه' },
      { id: '3761351', nodeId: '3761351', nameAr: 'عناية الشفاه', nameEn: 'Lip Care', keyword: 'lip care', keywordAr: 'عناية شفاه' },
      { id: '11060521', nodeId: '11060521', nameAr: 'مكياج الجسم', nameEn: 'Body', keyword: 'body makeup', keywordAr: 'مكياج جسم' },
      { id: '11060711', nodeId: '11060711', nameAr: 'أساسات وبودرة', nameEn: 'Face Base', keyword: 'foundation powder', keywordAr: 'أساس بودرة' },
      { id: '11056931', nodeId: '11056931', nameAr: 'مكياج نسائي', nameEn: "Women's Makeup", keyword: 'women makeup', keywordAr: 'مكياج نسائي' },
      { id: '11056761', nodeId: '11056761', nameAr: 'عناية رجالية', nameEn: "Men's Grooming", keyword: 'men grooming', keywordAr: 'عناية رجالية' },
      { id: '11056891', nodeId: '11056891', nameAr: 'مجموعات مكياج', nameEn: 'Makeup Sets', keyword: 'makeup set', keywordAr: 'مجموعة مكياج' },
      { id: '3736391', nodeId: '3736391', nameAr: 'مزيل مكياج', nameEn: 'Makeup Remover', keyword: 'makeup remover', keywordAr: 'مزيل مكياج' },
      { id: '3784921', nodeId: '3784921', nameAr: 'أدوات وحقائب', nameEn: 'Tools & Bags', keyword: 'makeup tools', keywordAr: 'أدوات مكياج' },
      { id: '3777891', nodeId: '3777891', nameAr: 'ظلال عيون', nameEn: 'Eyeshadow', keyword: 'eyeshadow', keywordAr: 'ظلال عيون' },
      { id: '3777761', nodeId: '3777761', nameAr: 'أساسات', nameEn: 'Foundation', keyword: 'foundation', keywordAr: 'أساس' },
      { id: '3777851', nodeId: '3777851', nameAr: 'أحمر شفاه', nameEn: 'Lipstick', keyword: 'lipstick', keywordAr: 'أحمر شفاه' },
    ],
  },
];

function publicPath(p) {
  const path = p.startsWith('/') ? p : `/${p}`;
  return HUB_PREFIX ? `${HUB_PREFIX}${path}` : path;
}

export function proxyAmazonImage(url = '') {
  const u = String(url || '').trim();
  if (!u) return '';
  if (u.startsWith('/api/amazon/img')) return u;
  if (!u.includes('media-amazon.com') && !u.includes('images-amazon.com')) return u;
  return publicPath(`/api/amazon/img?u=${encodeURIComponent(u)}`);
}

function acceptLang(locale = 'en') {
  return locale === 'ar' ? 'ar-AE,ar;q=0.9,en;q=0.8' : 'en-US,en;q=0.9';
}

export async function fetchAmazonHtml(url, locale = 'en') {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept-Language': acceptLang(locale),
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cache-Control': 'no-cache',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Amazon ${res.status}`);
  return res.text();
}

function findCategoryDef(id) {
  const key = String(id || '').trim();
  for (const root of CATEGORY_DEFS) {
    if (String(root.id) === key) return root;
    for (const child of root.children || []) {
      if (String(child.id) === key) return child;
    }
  }
  return null;
}

function mapTreeNode(def, parentPathAr = '', parentPathEn = '') {
  const nameAr = def.nameAr || def.nameEn || '';
  const nameEn = def.nameEn || def.nameAr || '';
  const pathAr = parentPathAr ? `${parentPathAr} › ${nameAr}` : nameAr;
  const pathEn = parentPathEn ? `${parentPathEn} › ${nameEn}` : nameEn;
  const children = (def.children || []).map((c) => mapTreeNode(c, pathAr, pathEn));
  const isLeaf = !children.length;
  return {
    id: def.id,
    slug: def.id,
    nodeId: def.nodeId || def.id,
    name: nameAr,
    nameAr,
    nameEn,
    path: pathAr,
    pathEn,
    keyword: def.keyword || 'cosmetics',
    keywordAr: def.keywordAr || def.keyword || 'مستحضرات تجميل',
    isLeaf: children.length ? false : true,
    children,
  };
}

export function buildCategoryTree() {
  const tree = CATEGORY_DEFS.map((d) => mapTreeNode(d));
  const leaves = [];
  const all = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      all.push(n);
      if (n.isLeaf) leaves.push(n);
      else walk(n.children || []);
    }
  };
  walk(tree);
  return { tree, leaves, all };
}

export function parseSearchResults(html) {
  const products = [];
  const seen = new Set();
  const re = /data-asin="([A-Z0-9]{10})"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const asin = m[1];
    if (seen.has(asin)) continue;
    seen.add(asin);
    const start = m.index;
    const next = html.indexOf('data-asin="', start + 20);
    const block = next > 0 ? html.slice(start, next) : html.slice(start, start + 10_000);
    const name =
      block.match(/<h2[^>]*><span[^>]*>([^<]+)/)?.[1]?.trim() ||
      block.match(/alt="([^"]{5,220})"/)?.[1]?.trim();
    if (!name) continue;
    const thumb =
      block.match(/class="s-image"[^>]*src="([^"]+)"/)?.[1] ||
      block.match(/src="(https:\/\/m\.media-amazon\.com\/images\/[^"]+)"/)?.[1];
    const price =
      block.match(/class="a-offscreen">\$([^<]+)</)?.[1]?.trim() ||
      block.match(/class="a-offscreen">([^<]{1,20})<\/span>/)?.[1]?.trim() ||
      '';
    const rating = block.match(/a-icon-alt">([0-9.]+) out of/)?.[1];
    const reviews = block.match(/a-size-base s-underline-text">\(?([0-9,.Kk]+)\)?</)?.[1];
    products.push({ asin, name, thumb, price, rating, reviews });
  }
  return products;
}

function buildBrowseUrl(nodeId, keyword, page, locale) {
  const p = Math.max(1, Number(page) || 1);
  if (locale === 'ar') {
    const params = new URLSearchParams();
    params.set('k', keyword || 'cosmetics');
    params.set('i', 'beauty');
    params.set('page', String(p));
    return `${AMAZON_SA}/s?${params}`;
  }
  const params = new URLSearchParams();
  if (keyword) params.set('k', keyword);
  params.set('rh', `n:${nodeId || COSMETICS_ROOT_NODE}`);
  params.set('page', String(p));
  return `${AMAZON_COM}/s?${params}`;
}

function buildSearchUrl(query, page, locale) {
  const p = Math.max(1, Number(page) || 1);
  const params = new URLSearchParams();
  params.set('k', String(query || '').trim());
  params.set('page', String(p));
  if (locale === 'ar') {
    params.set('i', 'beauty');
    return `${AMAZON_SA}/s?${params}`;
  }
  params.set('rh', `n:${COSMETICS_ROOT_NODE}`);
  return `${AMAZON_COM}/s?${params}`;
}

function parseFeatureBullets(html) {
  const section =
    html.match(/id="feature-bullets"[\s\S]*?<\/ul>/i)?.[0] ||
    html.match(/feature-bullets[\s\S]{0,12_000}?<\/ul>/i)?.[0];
  if (!section) return [];
  return [...section.matchAll(/<span class="a-list-item">\s*([^<]{5,400})/g)]
    .map((m) => m[1].trim())
    .filter((t) => t && !/اذهب إلى|مشترياتك|الإرجاع|استرداد|return|refund/i.test(t));
}

function parseDimensionValuesDisplayData(html) {
  const start = String(html || '').indexOf('dimensionValuesDisplayData');
  if (start < 0) return {};
  const chunk = html.slice(start, start + 12_000);
  const jsonMatch = chunk.match(/dimensionValuesDisplayData"\s*:\s*(\{[\s\S]*?\})\s*,\s*"/);
  if (!jsonMatch) return {};
  try {
    return JSON.parse(jsonMatch[1]);
  } catch {
    return {};
  }
}

/**
 * خريطة ASIN → صورة المتغيّر (السواتش) من بيانات twister في صفحة أمازون.
 * كل متغيّر يأتي بالشكل: "imageAttribute":{...,"url":"..."},...,"defaultAsin":"ASIN"
 */
function parseVariationImageMap(html = '') {
  const map = {};
  if (!html) return map;
  for (const m of html.matchAll(
    /"imageAttribute"\s*:\s*\{[^}]*?"url"\s*:\s*"(https:\/\/[^"]+)"\}[^{]*?"defaultAsin"\s*:\s*"(B0[A-Z0-9]{8})"/g,
  )) {
    const url = m[1];
    const asin = m[2];
    if (asin && url && !map[asin]) map[asin] = url;
  }
  // احتياطي: صور hiRes/large مرتبطة مباشرة بـ ASIN
  for (const m of html.matchAll(
    /"(B0[A-Z0-9]{8})"\s*:\s*\{[^}]*?"(?:hiRes|large)"\s*:\s*"(https:\/\/[^"]+)"/g,
  )) {
    if (!map[m[1]]) map[m[1]] = m[2];
  }
  return map;
}

/** ترقية رابط صورة السواتش الصغير إلى نسخة أكبر مناسبة للعرض */
function upscaleAmazonImage(url = '') {
  return String(url || '').replace(/\._[A-Z0-9_,]+_\.(jpg|png|webp)/i, '._AC_SL500_.$1');
}

function parseAmazonVariations(htmlAr, htmlEn) {
  const arMap = parseDimensionValuesDisplayData(htmlAr);
  const enMap = parseDimensionValuesDisplayData(htmlEn);
  const imgEn = parseVariationImageMap(htmlEn);
  const imgAr = parseVariationImageMap(htmlAr);
  const asins = new Set([...Object.keys(arMap), ...Object.keys(enMap)]);
  const shades = [];
  for (const asin of asins) {
    const nameAr = String((arMap[asin] || [])[0] || '').trim();
    const nameEn = String((enMap[asin] || [])[0] || '').trim();
    if (!nameAr && !nameEn) continue;
    const swatchUrl = imgEn[asin] || imgAr[asin] || '';
    const displayUrl = swatchUrl ? upscaleAmazonImage(swatchUrl) : '';
    shades.push({
      optionId: asin,
      name: nameAr || nameEn,
      nameAr,
      nameEn,
      sku: asin,
      // صورة العرض المرتبطة باللون (نسخة أكبر)
      rawImage: displayUrl,
      image: displayUrl ? proxyAmazonImage(displayUrl) : '',
      thumb: displayUrl ? proxyAmazonImage(displayUrl) : '',
      // صورة السواتش الأصلية (مربّع اللون) — أدقّ لاستخراج قيمة اللون
      swatchImage: swatchUrl ? proxyAmazonImage(swatchUrl) : '',
      colorSourceImage: swatchUrl || displayUrl || '',
    });
  }
  return shades.sort((a, b) => (a.nameEn || a.nameAr).localeCompare(b.nameEn || b.nameAr, 'en'));
}

function hasArabicText(text = '') {
  return /[\u0600-\u06FF]/.test(String(text || ''));
}

/** استبعاد حزم/مجموعات (مثل NYX + wet n wild) من نتائج الباركود */
export function isAmazonBundleListing(nameEn = '', nameAr = '') {
  const t = `${nameEn} ${nameAr}`.toLowerCase();
  if (/\b(pack of|عبوة|قطعتين|قطعة\s*2|2\s*قطع|-piece|\d+\s*count|bundle|مجموعة|with.*bonus)\b/i.test(t)) return true;
  if (/\bpack\s+of\s+\d+\b/i.test(t)) return true;
  if (/\band\b/i.test(nameEn) && /\b(wet n wild|maybelline|e\.l\.f|revlon|l'oreal)\b/i.test(t)) return true;
  return false;
}

function parseAmazonBarcodeFromHtml(html = '') {
  const patterns = [
    /UPC[\s\S]{0,200}?voyager-ns-desktop-table-value[^0-9]*([0-9]{8,14})/i,
    /EAN[\s\S]{0,200}?voyager-ns-desktop-table-value[^0-9]*([0-9]{8,14})/i,
    /UPC[\s\S]{0,120}?([0-9]{8,14})/i,
    /EAN[\s\S]{0,120}?([0-9]{8,14})/i,
    /"gtin[^"]*":"([0-9]{8,14})"/i,
  ];
  for (const re of patterns) {
    const m = String(html || '').match(re);
    if (m?.[1]) return m[1];
  }
  return '';
}

function parseProductDetail(html, asin) {
  const titleMatch = html.match(/id="productTitle"[^>]*>\s*([^<]+)/);
  const title = titleMatch?.[1]?.trim() || '';
  const brandMatch =
    html.match(/"brand":"([^"]+)"/)?.[1]?.trim() ||
    html.match(/Visit the ([^<]+) Store/i)?.[1]?.trim();
  const brand = brandMatch || '';
  const hiRes = html.match(/"hiRes":"([^"]+)"/)?.[1];
  const large = html.match(/"large":"([^"]+)"/)?.[1];
  const landingMatch =
    html.match(/id="landingImage"[^>]*data-old-hires="([^"]+)"/)?.[1] ||
    html.match(/id="landingImage"[^>]*src="([^"]+)"/)?.[1];
  const landing = landingMatch || '';
  const thumb = hiRes || large || landing || '';
  const descHtml = html.match(/id="productDescription"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || '';
  let desc = descHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const bullets = parseFeatureBullets(html);
  if (!desc || /الإرجاع|مشترياتك|return/i.test(desc)) {
    desc = bullets.join('\n');
  } else if (bullets.length) {
    desc = [desc, ...bullets].filter(Boolean).join('\n');
  }
  const priceWhole = html.match(/class="a-price-whole">([^<]+)/)?.[1]?.replace(/[,\s]/g, '');
  const priceFrac = html.match(/class="a-price-fraction">([^<]+)/)?.[1];
  const price = priceWhole ? `${priceWhole}${priceFrac ? `.${priceFrac}` : ''}` : '';
  const barcode = parseAmazonBarcodeFromHtml(html);
  const images = [...new Set([...html.matchAll(/"hiRes":"(https:\/\/[^"]+)"/g)].map((x) => x[1]))];
  const finalThumb = hiRes || large || landing || images[0] || '';
  if (!images.length && finalThumb) images.push(finalThumb);
  return {
    asin,
    title,
    brand,
    thumb: finalThumb,
    images,
    description: desc || bullets.join('\n'),
    price,
    barcode,
    bullets,
  };
}

function formatPrice(amount, locale = 'en', currency = '') {
  const n = Number(String(amount).replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return String(amount || '').trim();
  if (locale === 'ar') return `${n.toLocaleString('ar-SA')} ${currency || 'ر.س'}`;
  return `$${n.toLocaleString('en-US')}`;
}

/** استخراج العلامة من عنوان المنتج عند غياب حقل brand في HTML */
function inferBrandFromTitle(title = '') {
  const t = String(title || '').trim();
  if (!t) return '';
  const fromStore = t.match(/(?:Visit the|تسوق من)\s+(.+?)\s+(?:Store|متجر)/i)?.[1]?.trim();
  if (fromStore && fromStore.length <= 40) return fromStore;
  const enLead = t.match(/^([A-Z][A-Za-z0-9&.'-]+)/);
  if (enLead) return enLead[1].trim();
  const arLead = t.match(/^([\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+){0,1})/);
  if (arLead && arLead[1].length <= 24) return arLead[1].trim();
  return '';
}

function resolveBrands(ar = {}, en = {}) {
  let brandEn = en.brand || ar.brand || '';
  let brandAr = ar.brand || en.brand || '';
  if (!brandEn) brandEn = inferBrandFromTitle(en.title) || inferBrandFromTitle(ar.title);
  if (!brandAr) brandAr = inferBrandFromTitle(ar.title) || brandEn;
  return { brandAr, brandEn };
}

export function isUsableAmazonProduct(detail = {}) {
  const nameAr = String(detail.nameAr || detail.name || '').trim();
  const nameEn = String(detail.nameEn || '').trim();
  const thumb = String(detail.thumb || '').trim();
  const images = detail.images || [];
  return Boolean((nameAr || nameEn) && (thumb || images.length));
}

function productCompletenessScore(detail = {}) {
  let score = 0;
  if (detail.nameAr && hasArabicText(detail.nameAr)) score += 6;
  else if (detail.nameAr) score += 2;
  if (detail.nameEn) score += 3;
  if (detail.thumb) score += 4;
  if (detail.images?.length) score += Math.min(detail.images.length, 5);
  if (detail.brandAr || detail.brandEn) score += 2;
  if (detail.description && hasArabicText(detail.description)) score += 3;
  if (detail.descriptionEn) score += 1;
  if (detail.barcode) score += 1;
  if (detail.shades?.length > 1) score += 4;
  if (isAmazonBundleListing(detail.nameEn, detail.nameAr)) score -= 20;
  return score;
}

function buildDetailFromParsed(asin, ar, en, listing = {}, htmlAr = '', htmlEn = '') {
  const { brandAr, brandEn } = resolveBrands(ar, en);
  const images = [...new Set([...(ar.images || []), ...(en.images || [])])].map(proxyAmazonImage).filter(Boolean);
  const listThumb = listing.thumb ? proxyAmazonImage(listing.thumb) : '';
  const thumb = proxyAmazonImage(ar.thumb || en.thumb || listThumb || images[0] || '');
  if (listThumb && !images.includes(listThumb)) images.unshift(listThumb);
  const shades = parseAmazonVariations(htmlAr, htmlEn);
  return {
    id: asin,
    asin,
    sku: asin,
    name: ar.title || en.title || listing.nameEn || listing.nameAr || listing.name || '',
    nameAr: ar.title || listing.nameAr || listing.name || '',
    nameEn: en.title || listing.nameEn || listing.name || '',
    manufacturer: brandAr || brandEn,
    manufacturerEn: brandEn || brandAr,
    brandAr,
    brandEn,
    description: ar.description,
    descriptionEn: en.description,
    price: ar.price ? formatPrice(ar.price, 'ar') : en.price ? formatPrice(en.price, 'en') : listing.price || '',
    priceEn: en.price ? formatPrice(en.price, 'en') : '',
    thumb,
    images,
    barcode: ar.barcode || en.barcode || '',
    productUrl: `${AMAZON_SA}/dp/${asin}`,
    productUrlEn: `${AMAZON_COM}/dp/${asin}`,
    shades,
    shadeCount: shades.length,
    hasOptions: shades.length > 1,
  };
}

export function normalizeProductSummary(raw, meta = {}) {
  const asin = raw.asin || raw.id;
  const nameAr = raw.nameAr || meta.nameAr || raw.name || '';
  const nameEn = raw.nameEn || meta.nameEn || raw.name || '';
  const thumb = proxyAmazonImage(raw.thumb || '');
  return {
    id: asin,
    asin,
    sku: asin,
    name: nameAr || nameEn,
    nameAr,
    nameEn,
    manufacturer: raw.brandAr || raw.brand || '',
    manufacturerEn: raw.brandEn || raw.brand || '',
    brandAr: raw.brandAr || raw.brand || '',
    brandEn: raw.brandEn || raw.brand || '',
    price: raw.price || '',
    thumb,
    rating: raw.rating || '',
    reviews: raw.reviews || '',
    barcode: raw.barcode || '',
    category: meta.path || meta.name || '',
    categoryEn: meta.pathEn || meta.nameEn || '',
    productUrl: `${AMAZON_SA}/dp/${asin}`,
    productUrlEn: `${AMAZON_COM}/dp/${asin}`,
    hasOptions: (raw.shades?.length || 0) > 1,
    shadeCount: raw.shadeCount ?? raw.shades?.length ?? 0,
  };
}

export async function normalizeProductDetailBilingual(asin, listing = {}) {
  const [htmlAr, htmlEnSa] = await Promise.all([
    fetchAmazonHtml(`${AMAZON_SA}/dp/${asin}`, 'ar').catch(() => ''),
    fetchAmazonHtml(`${AMAZON_SA}/-/en/dp/${asin}`, 'en').catch(() => ''),
  ]);
  let ar = htmlAr ? parseProductDetail(htmlAr, asin) : { asin, title: '', brand: '', thumb: '', images: [], description: '', price: '', barcode: '' };
  let en = htmlEnSa ? parseProductDetail(htmlEnSa, asin) : { asin, title: '', brand: '', thumb: '', images: [], description: '', price: '', barcode: '' };
  let htmlCom = '';

  const needsComFallback = !(ar.title || en.title) || !(ar.thumb || en.thumb || ar.images?.length || en.images?.length);
  if (needsComFallback) {
    htmlCom = await fetchAmazonHtml(`${AMAZON_COM}/dp/${asin}`, 'en').catch(() => '');
    if (htmlCom) {
      const com = parseProductDetail(htmlCom, asin);
      if (!en.title && com.title) en = com;
      if (!ar.title && com.title) ar = { ...ar, title: com.title };
      if (!en.thumb && com.thumb) {
        en = { ...en, thumb: com.thumb, images: com.images?.length ? com.images : en.images };
      }
      if (!en.description && com.description) en = { ...en, description: com.description };
      if (!en.barcode && com.barcode) en = { ...en, barcode: com.barcode };
    }
  }

  const htmlEn = htmlEnSa || htmlCom;
  return buildDetailFromParsed(asin, ar, en, listing, htmlAr, htmlEn);
}

async function fetchBrowseMerged(nodeId, { page = 1, keyword, keywordAr } = {}) {
  const cat = findCategoryDef(nodeId) || { nodeId, keyword: keyword || 'cosmetics', keywordAr: keywordAr || 'مستحضرات تجميل' };
  const kwEn = keyword || cat.keyword || 'cosmetics';
  const kwAr = keywordAr || cat.keywordAr || cat.keyword || 'مستحضرات تجميل';
  const [htmlEn, htmlAr] = await Promise.all([
    fetchAmazonHtml(buildBrowseUrl(cat.nodeId || nodeId, kwEn, page, 'en'), 'en'),
    fetchAmazonHtml(buildBrowseUrl(cat.nodeId || nodeId, kwAr, page, 'ar'), 'ar'),
  ]);
  const enList = parseSearchResults(htmlEn);
  const arList = parseSearchResults(htmlAr);
  const arByAsin = new Map(arList.map((p) => [p.asin, p]));
  return enList.map((p) => {
    const ar = arByAsin.get(p.asin);
    return {
      ...p,
      nameAr: ar?.name || p.name,
      nameEn: p.name,
      brandAr: '',
      brandEn: '',
    };
  });
}

export async function fetchCategoryProducts(categoryId, { page = 1, limit = 30, search = '' } = {}) {
  const cat = findCategoryDef(categoryId);
  if (!cat) throw new Error(`Unknown category: ${categoryId}`);
  let items = [];
  if (search?.trim()) {
    const [htmlEn, htmlAr] = await Promise.all([
      fetchAmazonHtml(buildSearchUrl(search, page, 'en'), 'en'),
      fetchAmazonHtml(buildSearchUrl(search, page, 'ar'), 'ar'),
    ]);
    const enList = parseSearchResults(htmlEn);
    const arByAsin = new Map(parseSearchResults(htmlAr).map((p) => [p.asin, p]));
    items = enList.map((p) => ({ ...p, nameAr: arByAsin.get(p.asin)?.name || p.name, nameEn: p.name }));
  } else {
    items = await fetchBrowseMerged(cat.nodeId || categoryId, {
      page,
      keyword: cat.keyword,
      keywordAr: cat.keywordAr,
    });
  }
  const slice = items.slice(0, Math.min(limit, 60));
  return {
    items: slice,
    page,
    hasMore: items.length >= 24,
    totalCount: null,
  };
}

export async function searchProducts(query, page = 1, limit = 30) {
  const [htmlEn, htmlAr] = await Promise.all([
    fetchAmazonHtml(buildSearchUrl(query, page, 'en'), 'en'),
    fetchAmazonHtml(buildSearchUrl(query, page, 'ar'), 'ar'),
  ]);
  const enList = parseSearchResults(htmlEn);
  const arByAsin = new Map(parseSearchResults(htmlAr).map((p) => [p.asin, p]));
  const items = enList.map((p) => ({
    ...p,
    nameAr: arByAsin.get(p.asin)?.name || p.name,
    nameEn: p.name,
  }));
  return {
    items: items.slice(0, Math.min(limit, 60)),
    page,
    hasMore: items.length >= 24,
  };
}

export async function fetchProductByAsin(asin, listing = {}) {
  const id = String(asin || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(id)) return null;
  const detail = await normalizeProductDetailBilingual(id, listing);
  if (isAmazonBundleListing(detail.nameEn, detail.nameAr)) {
    return null;
  }
  if (!isUsableAmazonProduct(detail)) {
    return null;
  }
  return detail;
}

/** بحث باركود ASIN لدرجة معينة */
export async function lookupAmazonVariantByAsin(asin) {
  const id = String(asin || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(id)) return null;
  const [htmlCom, htmlSa] = await Promise.all([
    fetchAmazonHtml(`${AMAZON_COM}/dp/${id}`, 'en').catch(() => ''),
    fetchAmazonHtml(`${AMAZON_SA}/dp/${id}`, 'en').catch(() => ''),
  ]);
  for (const html of [htmlCom, htmlSa]) {
    if (!html) continue;
    const parsed = parseProductDetail(html, id);
    if (parsed.barcode) {
      return {
        ean: parsed.barcode,
        brand: parsed.brand || '',
        title: parsed.title || '',
        source: `amazon-variant:${id}`,
      };
    }
  }
  return null;
}

async function enrichAmazonShadeAsinsParallel(shades = [], concurrency = 4) {
  const tasks = shades
    .filter((s) => !s.barcode && !s.ean)
    .map((shade) => ({
      shade,
      asin: String(shade.sku || shade.optionId || '').trim().toUpperCase(),
    }))
    .filter((t) => /^[A-Z0-9]{10}$/.test(t.asin));

  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    await Promise.all(batch.map(async ({ shade, asin }) => {
      const variant = await lookupAmazonVariantByAsin(asin).catch(() => null);
      if (!variant?.ean) return;
      const digits = String(variant.ean).replace(/\D/g, '');
      if (!/^\d{8,14}$/.test(digits)) return;
      shade.barcode = digits;
      shade.ean = digits;
      shade.barcodeSource = variant.source || 'amazon-variant';
    }));
  }
}

/** بحث Amazon نصّي بالتلميحات (ماركة + اسم المنتج) عند فشل البحث بالباركود */
async function searchAmazonByMetaHint(meta, digits) {
  const { buildMetaHintQueries, scoreStoreHintMatch } = await import('./barcodes.js');
  const queries = buildMetaHintQueries(meta).slice(0, 3);

  for (const q of queries) {
    const html = await fetchAmazonHtml(buildSearchUrl(q, 1, 'en'), 'en').catch(() => '');
    const list = parseSearchResults(html);
    if (!list.length) continue;

    const settled = await Promise.allSettled(
      list.slice(0, 3).map((p) => normalizeProductDetailBilingual(p.asin, {
        nameEn: p.name,
        nameAr: p.name,
        thumb: p.thumb,
        price: p.price,
      })),
    );

    const scored = [];
    for (const outcome of settled) {
      if (outcome.status !== 'fulfilled') continue;
      const detail = outcome.value;
      if (!isUsableAmazonProduct(detail)) continue;
      if (isAmazonBundleListing(detail.nameEn, detail.nameAr)) continue;
      const item = {
        id: detail.asin,
        name: detail.nameAr || detail.nameEn,
        nameEn: detail.nameEn,
        manufacturer: detail.brandAr || detail.brand || '',
        manufacturerEn: detail.brandEn || detail.brand || '',
        shadeName: '',
      };
      const score = scoreStoreHintMatch(item, meta);
      if (score < 14) continue;
      if (!detail.barcode) detail.barcode = digits;
      detail.matchType = 'hint';
      detail.matchScore = score;
      detail.source = meta.source || 'meta-hint';
      scored.push({ detail, score });
    }

    if (scored.length) {
      scored.sort((a, b) => b.score - a.score);
      return [scored[0].detail];
    }
  }
  return [];
}

export async function searchProductsByBarcode(barcode, { getMeta } = {}) {
  const digits = String(barcode).replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return [];

  // ⚡ صفحتا البحث EN + AR بالتوازي بدل التسلسل
  const saEnUrl = `${AMAZON_SA}/-/en/s?${new URLSearchParams({ k: digits, i: 'beauty', page: '1' })}`;
  const [htmlEnCom, htmlAr] = await Promise.all([
    fetchAmazonHtml(buildSearchUrl(digits, 1, 'en'), 'en').catch(() => ''),
    fetchAmazonHtml(buildSearchUrl(digits, 1, 'ar'), 'ar').catch(() => ''),
  ]);

  let enList = parseSearchResults(htmlEnCom);
  if (!enList.length) {
    const htmlSaEn = await fetchAmazonHtml(saEnUrl, 'en').catch(() => '');
    enList = parseSearchResults(htmlSaEn);
  }

  const arByAsin = new Map(parseSearchResults(htmlAr).map((p) => [p.asin, p]));
  const listingByAsin = new Map();
  for (const p of enList) {
    const ar = arByAsin.get(p.asin);
    listingByAsin.set(p.asin, {
      nameEn: p.name,
      nameAr: ar?.name || p.name,
      thumb: p.thumb || ar?.thumb,
      price: p.price || ar?.price,
    });
  }

  // ⚡ جلب تفاصيل أعلى 3 ASIN بالتوازي بدل 5 بالتسلسل
  const asinOrder = enList.map((p) => p.asin).filter(Boolean);
  const settled = await Promise.allSettled(
    asinOrder.slice(0, 3).map((asin) =>
      normalizeProductDetailBilingual(asin, listingByAsin.get(asin) || {}),
    ),
  );

  const results = [];
  for (const outcome of settled) {
    if (outcome.status !== 'fulfilled') continue;
    const detail = outcome.value;
    if (!isUsableAmazonProduct(detail)) continue;
    if (isAmazonBundleListing(detail.nameEn, detail.nameAr)) continue;
    const bc = String(detail.barcode || '').replace(/\D/g, '');
    const barcodeMatch = !bc || bc === digits || bc.endsWith(digits) || digits.endsWith(bc);
    if (!barcodeMatch && asinOrder.length > 1) continue;
    if (!detail.barcode) detail.barcode = digits;
    results.push(detail);
  }

  if (results.length) {
    return results
      .sort((a, b) => productCompletenessScore(b) - productCompletenessScore(a))
      .slice(0, 1);
  }

  // احتياطي: البحث بالماركة + اسم المنتج عند عدم وجود الباركود مباشرة على Amazon
  if (getMeta) {
    const meta = await getMeta().catch(() => null);
    if (meta?.brand || meta?.title) {
      const hinted = await searchAmazonByMetaHint(meta, digits).catch(() => []);
      if (hinted.length) return hinted;
    }
  }

  return [];
}

export function sortProductsClient(products = [], sort = 'default') {
  const list = [...products];
  const priceNum = (p) => Number(String(p.price || '').replace(/[^\d.]/g, '')) || 0;
  switch (sort) {
    case 'name_asc':
      return list.sort((a, b) => (a.nameAr || a.name || '').localeCompare(b.nameAr || b.name || '', 'ar'));
    case 'name_desc':
      return list.sort((a, b) => (b.nameAr || b.name || '').localeCompare(a.nameAr || a.name || '', 'ar'));
    case 'price_asc':
      return list.sort((a, b) => priceNum(a) - priceNum(b));
    case 'price_desc':
      return list.sort((a, b) => priceNum(b) - priceNum(a));
    default:
      return list;
  }
}

/** إثراء باركود الدرجات — جلب باركود كل ASIN بالتوازي ثم مصادر خارجية */
export async function enrichAmazonShadeBarcodes(product, {
  light = false,
  barcodeHint = '',
  maxLookups = 12,
  timeoutMs = 45_000,
} = {}) {
  const { enrichShadesForImport } = await import('./barcodes.js');
  const shades = [...(product.shades || [])];
  if (!shades.length) return shades;

  const hint = String(barcodeHint || product.barcode || '').replace(/\D/g, '');
  if (hint) product.barcode = hint;

  const run = async () => {
    if (light) return shades;
    await enrichAmazonShadeAsinsParallel(shades, 4);
    return enrichShadesForImport(
      { ...product, shades },
      { maxLookups: Math.max(maxLookups, shades.length), barcodeHint: hint, light: false },
    );
  };

  if (timeoutMs > 0) {
    return Promise.race([
      run(),
      new Promise((resolve) => setTimeout(() => resolve(shades), timeoutMs)),
    ]);
  }
  return run();
}
