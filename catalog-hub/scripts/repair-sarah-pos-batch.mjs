#!/usr/bin/env node
/**
 * Repair imported Sarah POS batch products (metadata + images).
 * Usage:
 *   BATCH=18 node scripts/repair-sarah-pos-batch.mjs
 *   BATCH=17,18 LIMIT=5 node scripts/repair-sarah-pos-batch.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSallaClient } from '../lib/stores/salla/client.js';
import { createSallaProductsApi } from '../lib/stores/salla/products.js';
import { fetchGalleryFromPage, mergeGalleryUrls } from '../lib/stores/salla/gallery.js';
import { filterSallaImages } from '../lib/stores/salla/image-filters.js';
import { searchBarcode as niceoneSearchBarcode, fetchProductDetail as fetchNiceoneDetail } from '../lib/stores/niceone/products.js';
import { fetchProductDetail as fetchWaheteterDetail, searchBarcode as waheteterSearchBarcode } from '../lib/stores/waheteter/products.js';
import { fetchProductJs } from '../lib/stores/orisdi/client.js';
import { mapDetailProduct } from '../lib/stores/orisdi/map.js';
import { searchBarcode as miswagSearchBarcode, fetchProductDetail as miswagFetchDetail } from '../lib/stores/miswag/products.js';
import { dedupeImagesPreferLargest, upgradeImageUrl } from '../lib/core/images.js';
import { CATEGORIES, SUBCATEGORIES } from '../lib/core/app-categories.js';
import { CARE_CATEGORY_ID, resolveCareCategories } from '../lib/core/care-category-map.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BATCHES = String(process.env.BATCH || '17,18').split(',').map((b) => b.trim()).filter(Boolean);
const LIMIT = Number(process.env.LIMIT || 0);
const DELAY_MS = Number(process.env.DELAY_MS || 700);
const MAX_IMAGES = Number(process.env.MAX_IMAGES || 8);
const METADATA_ONLY = process.env.METADATA_ONLY === '1';
const DRY_RUN = process.env.DRY_RUN === '1';

const sallaClient = createSallaClient(process.env.SALLA_STORE || 'sarahmakeup37.com', { cachePrefix: `repair-${Date.now()}` });
const salla = createSallaProductsApi(sallaClient);

const META_CACHE = existsSync(path.join(__dirname, '../data/barcode-meta-cache.json'))
  ? JSON.parse(readFileSync(path.join(__dirname, '../data/barcode-meta-cache.json'), 'utf8'))
  : {};

const ORISDI_INDEX = new Map();
const orisdiPath = path.join(__dirname, '../data/orisdi-barcode-index.json');
if (existsSync(orisdiPath)) {
  for (const entry of Object.values(JSON.parse(readFileSync(orisdiPath, 'utf8')).entries || {})) {
    if (entry?.barcode) ORISDI_INDEX.set(entry.barcode, entry);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function bcMatch(a, b) {
  const x = String(a || '').replace(/\D/g, '');
  const y = String(b || '').replace(/\D/g, '');
  if (x.length < 8 || y.length < 8) return false;
  return x === y || x.endsWith(y.slice(-8)) || y.endsWith(x.slice(-8));
}

function cleanPos(s = '') {
  return String(s).replace(/[\u200e\u200f\u202a-\u202e\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim();
}

function slugFromUrl(url = '', fallback = '') {
  return String(url).match(/\/ar\/([^/?#]+)/)?.[1] || fallback;
}

function isBadName(name = '') {
  const n = cleanPos(name).replace(/&#\d+;/g, "'");
  if (!n || n.length < 4) return true;
  if (/^[\d_\s©]+$/.test(n)) return true;
  if (/^[\u0600-\u06FF]\s*\d{2,4}$/.test(n)) return true;
  if (/^[^A-Za-z\u0600-\u06FF]*$/.test(n)) return true;
  if (/^(BOURJOIS|MAYBELLINE|NYX|CLARINS|ADIDAS|FINO|OGX|LANCOM|HUDA|CHANEL|GUERLAIN|PHYTO|SVR)$/i.test(n)) return true;
  if (/^NYX A$/i.test(n)) return true;
  if (/^Adidas \d+$/i.test(n)) return true;
  if (/^IRISH \d+$/i.test(n)) return true;
  if (/^[\d]{2,4}$/.test(n)) return true;
  if (/^[_\s©]+/.test(n)) return true;
  const words = n.split(/\s+/).filter(Boolean);
  if (words.length === 1 && n.length < 18) return true;
  return false;
}

function realImageCount(product = {}) {
  return (product.images || []).filter((img) => {
    if (!img?.id || img.id === 'placeholder') return false;
    if (img?.media?.hash === 'alhayaa-product-placeholder-v1') return false;
    return true;
  }).length;
}

function metaFromCache(barcode) {
  const hit = META_CACHE[`meta|${barcode}`] || META_CACHE[`web|${barcode}`];
  if (!hit?.title && !hit?.brand) return null;
  let raw = `${hit.brand || ''} ${hit.title || ''}`.replace(new RegExp(`^${barcode}\\s*`, 'i'), '').trim();
  raw = raw.replace(/\s*-\s*Jomashop.*/i, '').replace(/\s*\(P\d+\)\s*/gi, ' ').replace(/\s+/g, ' ').trim();
  const m = raw.match(/^([A-Za-z][A-Za-z0-9&.'\- ]{1,24}?)\s+(.+)$/);
  if (m) {
    return { brandEn: m[1].trim(), title: m[2].trim(), productEn: m[2].trim() };
  }
  return { brandEn: hit.brand || '', title: raw, productEn: raw };
}

const PREFIXES = [
  ['HUDA BEAUTY', 'Huda Beauty', 'هدى بيوتي'],
  ['HUDABEAUTY', 'Huda Beauty', 'هدى بيوتي'],
  ['BOURJOIS', 'Bourjois', 'بورجو'],
  ['CLARINS', 'Clarins', 'كلارنس'],
  ['CLAR-', 'Clarins', 'كلارنس'],
  ['KERASTASE', 'Kérastase', 'كérastase'],
  ['PALMERS', "Palmer's", 'بالمرز'],
  ['PALMER', "Palmer's", 'بالمرز'],
  ['PHYTO', 'Phyto', 'فيتo'],
  ['NYX', 'NYX', 'نيكس'],
  ['MAYBELLINE', 'Maybelline', 'ميبلين'],
  ['FINO', 'FINO', 'فينو'],
  ['OGX', 'OGX', 'OGX'],
  ['ADIDAS', 'Adidas', 'أديداس'],
  ['LANCOME', 'Lancôme', 'لancome'],
  ['LA ROCHE', 'La Roche-Posay', 'لaroche-posay'],
  ['LOREAL', "L'Oréal Paris", 'لoréal'],
];

function parsePos(pos = '') {
  const u = cleanPos(pos).toUpperCase();
  for (const [prefix, brandEn, brandAr] of PREFIXES) {
    if (u.startsWith(prefix)) {
      const rest = cleanPos(pos).slice(prefix.length).trim();
      return { brandEn, brandAr, productEn: rest || cleanPos(pos) };
    }
  }
  const m = cleanPos(pos).match(/^([A-Z][A-Za-z0-9&.'\- ]{1,28}?)\s+(.+)$/);
  if (m) return { brandEn: m[1].trim(), brandAr: m[1].trim(), productEn: m[2].trim() };
  return null;
}

function titleCase(s = '') {
  return String(s).replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\bMl\b/g, 'ml').replace(/\bSpf\b/g, 'SPF');
}

function titleFromSlug(slug = '') {
  return String(slug)
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function inferKind(text = '') {
  const t = text.toLowerCase();
  if (/مكياج|ماسكارا|بودرة|باليت|ظلال|آيلاين|كحل|lipstick|mascara|palette|eyeshadow|foundation|concealer|blush|makeup|superstay|ink liquid/.test(t)) return 'makeup';
  if (/عناية|كريم|سيروم|غسول|تونر|شامبو|بلسم|مرطب|hair mask|sunscreen|cleanser|serum|shampoo|conditioner|deodorant|spf|uv plus|fondamental/.test(t)) return 'care';
  if (/عطر|perfume|parfum|cologne|edp|edt|oud|eau de/.test(t)) return 'perfume';
  return 'care';
}

function inferMakeupSub(text = '') {
  const t = text.toLowerCase();
  if (/lip|شفاه|lipstick|tint|gloss|ink liquid|superstay/.test(t)) return SUBCATEGORIES.lips;
  if (/mascara|eyeshadow|palette|eye|kohl|liner|ظلال|رموش|عيون/.test(t)) return SUBCATEGORIES.eyes;
  return SUBCATEGORIES.face;
}

function resolveCategories(kind, row) {
  const text = `${row.nameEn || ''} ${row.nameAr || ''} ${row.posName || ''}`;
  if (kind === 'makeup') {
    return {
      categoryId: CATEGORIES.makeup,
      subcategoryIds: [inferMakeupSub(text)],
      tertiaryCategoryIds: [],
    };
  }
  if (kind === 'perfume') {
    return {
      categoryId: CATEGORIES.perfumes,
      subcategoryIds: [],
      tertiaryCategoryIds: [],
    };
  }
  const { subcategoryIds, tertiaryCategoryIds } = resolveCareCategories('', {
    barcode: row.barcode,
    brandEn: row.brandEn || '',
    brandAr: row.brandAr || '',
    posName: row.posName || row.nameEn || '',
    typeKey: 'cream',
  });
  return { categoryId: CARE_CATEGORY_ID, subcategoryIds, tertiaryCategoryIds };
}

function makeupDesc(nameEn, nameAr) {
  return {
    descriptionEn: `${nameEn} delivers reliable makeup performance for everyday looks.\n\n◆ Category: Makeup\n◆ Product type: Eye/Face/Lip makeup\n◆ Key benefits: Easy application · Buildable result · Everyday wear\n◆ Suitable for: Daily makeup`,
    descriptionAr: `${nameAr} — منتج مكياج عملي لإطلالات يومية.\n\n◆ التصنيف: مكياج\n◆ نوع المنتج: مكياج\n◆ الفوائد الرئيسية: سهل التطبيق · تغطية قابلة للبناء · للاستخدام اليومي\n◆ الأنسب لـ: إطلالات يومية`,
  };
}

function careDesc(nameEn, nameAr) {
  return {
    descriptionEn: `${nameEn} supports daily care with a trusted formula for regular use.\n\n◆ Category: Skincare\n◆ Key benefits: Daily care · Trusted formula · Regular use\n◆ Suitable for: Daily care routines`,
    descriptionAr: `${nameAr} — منتج عناية يومي بتركيبة موثوقة.\n\n◆ التصنيف: العناية\n◆ الفوائد الرئيسية: عناية يومية · تركيبة موثوقة · للاستخدام المنتظم\n◆ الأنسب لـ: الروتين اليومي`,
  };
}

function isUploadableImageUrl(url = '') {
  const u = String(url).toLowerCase();
  if (!u.startsWith('http') || /\s/.test(u)) return false;
  // الخادم لا يستطيع تحميل صور waheteter (403)
  if (/waheteter\.com/i.test(u)) return false;
  return !/placeholder|no[_-]?image|data:image/i.test(u);
}

function normalizeImages(urls = []) {
  return dedupeImagesPreferLargest(
    urls.map((url) => upgradeImageUrl(String(url || ''))).filter(isUploadableImageUrl),
  ).slice(0, MAX_IMAGES);
}

async function resolveSarahByName(nameEn = '') {
  const q = cleanPos(nameEn).replace(/&#\d+;/g, ' ').replace(/[^\w\s\u0600-\u06FF-'']/g, ' ').replace(/\s+/g, ' ').trim();
  if (q.length < 8) return null;

  const { data = [] } = await sallaClient.sallaFetch('/products/search', {
    params: { query: q.slice(0, 70), per_page: 8 },
    ttl: 0,
  }).catch(() => ({ data: [] }));

  for (const row of data) {
    const slug = slugFromUrl(row.url || '', String(row.id || ''));
    const detail = await salla.fetchProductDetail(slug).catch(() => null);
    if (!detail) continue;
    const pageImages = await fetchGalleryFromPage(row.url || detail.productUrl);
    const images = filterSallaImages(mergeGalleryUrls(detail.images || [], pageImages));
    if (!images.length) continue;
    return {
      source: 'sarah-name',
      sarahId: slug,
      url: row.url || detail.productUrl || '',
      brandEn: detail.brandEn || '',
      brandAr: detail.brandAr || '',
      nameEn: detail.nameEn || '',
      nameAr: detail.nameAr || '',
      images,
    };
  }
  return null;
}

async function resolveSarah(barcode, posName = '') {
  const hits = await salla.searchBarcode(barcode).catch(() => []);
  let hit = Array.isArray(hits) ? hits[0] : hits;
  if (!hit && posName) {
    const q = cleanPos(posName).replace(/[^\w\s\u0600-\u06FF-]/g, ' ').slice(0, 60);
    if (q.length >= 6) {
      const { data = [] } = await sallaClient.sallaFetch('/products/search', { params: { query: q, per_page: 5 }, ttl: 0 }).catch(() => ({ data: [] }));
      for (const row of data) {
        const slug = slugFromUrl(row.url || '', String(row.id || ''));
        const detail = await salla.fetchProductDetail(slug).catch(() => null);
        if (detail && bcMatch(detail.barcode || detail.sku, barcode)) {
          hit = { ...detail, url: row.url || detail.productUrl, id: slug };
          break;
        }
      }
    }
  }
  if (!hit) return null;

  const slug = slugFromUrl(hit.url || hit.productUrl || '', hit.sarahId || hit.id || hit.slug || '');
  const detail = hit.nameAr ? hit : await salla.fetchProductDetail(slug).catch(() => hit);
  const pageImages = await fetchGalleryFromPage(hit.url || detail?.productUrl);
  const images = filterSallaImages(mergeGalleryUrls(detail?.images || [], pageImages));
  return {
    source: 'sarah',
    sarahId: slug,
    url: hit.url || detail?.productUrl || '',
    brandEn: detail?.brandEn || '',
    brandAr: detail?.brandAr || '',
    nameEn: detail?.nameEn || '',
    nameAr: detail?.nameAr || '',
    images,
  };
}

async function resolveOrisdi(barcode) {
  const hit = ORISDI_INDEX.get(barcode);
  if (!hit?.handle) return null;

  const [arProduct, enProduct] = await Promise.all([
    fetchProductJs(hit.handle, { lang: 'ar' }).catch(() => null),
    fetchProductJs(hit.handle, { lang: 'en' }).catch(() => null),
  ]);
  if (!arProduct?.id) return null;

  const detail = mapDetailProduct(arProduct, enProduct);
  const shade = (detail.shades || []).find((s) => bcMatch(s.barcode, barcode));
  const images = normalizeImages([
    ...(shade?.image ? [shade.image] : []),
    ...(detail.images || []),
    detail.thumb,
  ]);

  return {
    source: 'orisdi',
    brandEn: detail.brandEn || detail.brandAr || '',
    brandAr: detail.brandAr || detail.brandEn || '',
    nameEn: detail.nameEn || '',
    nameAr: detail.nameAr || '',
    images,
  };
}

async function resolveMiswag(barcode) {
  const hits = await miswagSearchBarcode(barcode).catch(() => []);
  const hit = hits[0];
  if (!hit?.id) return null;
  const detail = await miswagFetchDetail(hit.id).catch(() => null);
  if (!detail || !bcMatch(detail.barcode, barcode)) return null;
  const shade = (detail.shades || []).find((s) => bcMatch(s.barcode, barcode));
  const shadeImages = shade ? [shade.image, ...(shade.additional_images || [])] : [];
  const images = normalizeImages([...(detail.images || []), ...shadeImages, detail.thumb]);
  return {
    source: 'miswag',
    brandEn: detail.brandEn || '',
    brandAr: detail.brandAr || '',
    nameEn: detail.nameEn || '',
    nameAr: detail.nameAr || '',
    images,
  };
}

async function resolveNiceone(barcode) {
  const hits = await niceoneSearchBarcode(barcode).catch(() => []);
  const hit = hits[0];
  if (!hit?.id) return null;
  const detail = await fetchNiceoneDetail(hit.id).catch(() => null);
  if (!detail || !bcMatch(detail.barcode, barcode)) return null;
  const shade = (detail.shades || []).find((s) => bcMatch(s.barcode, barcode));
  const shadeImages = shade ? [shade.image, ...(shade.additional_images || [])] : [];
  const images = normalizeImages([...(detail.images || []), ...shadeImages, detail.thumb]);
  return {
    source: 'niceone',
    brandEn: detail.brandEn || detail.brand || '',
    brandAr: detail.brandAr || '',
    nameEn: detail.nameEn || detail.name || '',
    nameAr: detail.nameAr || '',
    images,
  };
}

async function resolveWaheteter(barcode, slugHint = '') {
  if (slugHint) {
    const detail = await fetchWaheteterDetail(slugHint, { slug: slugHint }).catch(() => null);
    if (detail && bcMatch(detail.barcode, barcode)) {
      return {
        source: 'waheteter',
        brandEn: detail.brandEn || '',
        brandAr: detail.brandAr || '',
        nameEn: (detail.nameEn || '').replace(/&#\d+;/g, "'"),
        nameAr: detail.nameAr || '',
        images: [],
      };
    }
  }
  const hits = await waheteterSearchBarcode(barcode).catch(() => []);
  const hit = hits[0];
  if (!hit) return null;
  const detail = await fetchWaheteterDetail(hit.id, { slug: hit.slug || hit.productUrl }).catch(() => hit);
  if (!detail || !bcMatch(detail.barcode, barcode)) return null;
  return {
    source: 'waheteter',
    brandEn: detail.brandEn || '',
    brandAr: detail.brandAr || '',
    nameEn: (detail.nameEn || '').replace(/&#\d+;/g, "'"),
    nameAr: detail.nameAr || '',
    images: [],
  };
}

function buildFromCandidate(candidate = {}) {
  let nameEn = cleanPos(candidate.nameEn || '');
  if (!nameEn || nameEn.length < 8) nameEn = titleFromSlug(candidate.slugHint || '');
  if (!nameEn || nameEn.length < 6) return null;
  nameEn = titleCase(nameEn);
  if (isBadName(nameEn)) return null;

  const parsed = parsePos(nameEn) || parsePos(titleFromSlug(candidate.slugHint || ''));
  const brandEn = parsed?.brandEn || nameEn.split(/\s+/).slice(0, 2).join(' ');
  const productPart = parsed?.productEn || nameEn.replace(new RegExp(`^${brandEn}\\s*`, 'i'), '').trim();
  const fullName = productPart && !nameEn.toLowerCase().startsWith(brandEn.toLowerCase())
    ? `${brandEn} ${titleCase(productPart)}`.trim()
    : nameEn;
  const brandAr = parsed?.brandAr || brandEn;
  const nameAr = candidate.nameAr && !isBadName(candidate.nameAr)
    ? candidate.nameAr
    : `${brandAr} - ${fullName.replace(new RegExp(`^${brandEn}\\s*`, 'i'), '').trim() || fullName}`;

  return {
    source: 'candidate',
    brandEn,
    brandAr,
    nameEn: fullName,
    nameAr,
    images: [],
  };
}

function buildFromPos(candidate = {}, product = {}) {
  const pos = cleanPos(candidate.posName || product.nameEn || '');
  const parsed = parsePos(pos);
  const cached = metaFromCache(product.barcode);
  if (!parsed && !cached) return null;

  const brandEn = parsed?.brandEn || cached?.brandEn || product.brandEn || '';
  let productEn = parsed?.productEn || cached?.productEn || cached?.title || pos;
  productEn = productEn.replace(/\s*-\s*Jomashop.*/i, '').replace(/\s*\(P\d+\)\s*/gi, ' ').trim();
  const nameEn = productEn.includes(brandEn) ? titleCase(productEn) : titleCase(`${brandEn} ${productEn}`.trim());
  const brandAr = parsed?.brandAr || brandEn;
  const nameAr = `${brandAr} - ${nameEn.replace(new RegExp(`^${brandEn}\\s*`, 'i'), '').trim() || nameEn}`;
  return { brandEn, brandAr, nameEn, nameAr, images: [], source: 'pos' };
}

function buildFromProductJson(product = {}) {
  if (!product.nameEn || isBadName(product.nameEn)) return null;
  return {
    source: 'local',
    sarahId: product.sarahId || '',
    url: product.url || '',
    brandEn: product.brandEn || '',
    brandAr: product.brandAr || '',
    nameEn: product.nameEn || '',
    nameAr: product.nameAr || '',
    descriptionEn: product.descriptionEn || '',
    descriptionAr: product.descriptionAr || '',
    categoryId: product.categoryId,
    subcategoryIds: product.subcategoryIds || [],
    tertiaryCategoryIds: product.tertiaryCategoryIds || [],
    images: [],
  };
}

function pickBestMeta(sources) {
  const priority = ['sarah', 'sarah-name', 'orisdi', 'niceone', 'miswag', 'candidate', 'waheteter', 'local', 'pos'];
  for (const key of priority) {
    const hit = sources.find((s) => s?.source === key);
    if (hit?.nameEn && !isBadName(hit.nameEn)) return hit;
  }
  return sources.find(Boolean);
}

function mergeResolved(product, candidate, sources) {
  const row = { barcode: product.barcode, posName: candidate?.posName || '' };
  const meta = pickBestMeta(sources.filter((s) => s && s.source !== 'images-only'));
  const imageSource = sources
    .filter((s) => s?.images?.length)
    .sort((a, b) => b.images.length - a.images.length)[0];
  const best = meta || buildFromPos(candidate, product);
  if (!best) return null;

  let { brandEn, brandAr, nameEn, nameAr, images = [], sarahId = '', url = '', source } = best;
  if (imageSource?.images?.length) {
    images = imageSource.images;
    if (!sarahId && imageSource.sarahId) sarahId = imageSource.sarahId;
    if (!url && imageSource.url) url = imageSource.url;
  }
  if (isBadName(nameEn)) {
    const fallback = buildFromCandidate(candidate) || buildFromPos(candidate, product);
    if (fallback) {
      ({ brandEn, brandAr, nameEn, nameAr } = fallback);
      source = `${source}+${fallback.source}`;
    }
  }
  if (!nameAr || isBadName(nameAr)) nameAr = nameEn;
  if (!brandAr) brandAr = brandEn;

  const kind = inferKind(`${nameEn} ${nameAr} ${row.posName}`);
  const cats = best.categoryId
    ? { categoryId: best.categoryId, subcategoryIds: best.subcategoryIds || [], tertiaryCategoryIds: best.tertiaryCategoryIds || [] }
    : resolveCategories(kind, { ...row, brandEn, brandAr, nameEn, nameAr });
  const desc = best.descriptionEn && best.descriptionAr
    ? { descriptionEn: best.descriptionEn, descriptionAr: best.descriptionAr }
    : (kind === 'makeup' ? makeupDesc(nameEn, nameAr) : careDesc(nameEn, nameAr));

  return {
    source,
    sarahId,
    url,
    brandEn,
    brandAr,
    nameEn,
    nameAr,
    images,
    kind,
    ...cats,
    ...desc,
  };
}

async function resolveBrandId(brandEn, brandAr) {
  if (!brandEn && !brandAr) return null;
  try {
    const resolved = await api('/brands/resolve', {
      method: 'POST',
      body: { brandEn, brandAr, name: brandEn || brandAr, createIfMissing: true },
    });
    return resolved?.id || null;
  } catch {
    return null;
  }
}

async function uploadImages(urls) {
  const ids = [];
  for (const url of urls) {
    try {
      const data = await api('/media/upload-from-url', { method: 'POST', body: { url, purpose: 'PRODUCT' } });
      const id = data?.id || data?.media?.id;
      if (id && id !== 'placeholder') ids.push(id);
    } catch { /* skip */ }
  }
  return ids;
}

function loadBatch(batchNum) {
  const productsFile = path.join(__dirname, `../data/sarah-pos-import-products-batch${batchNum}.json`);
  const stateFile = path.join(__dirname, `../data/sarah-pos-import-state-batch${batchNum}.json`);
  const candidatesFile = path.join(__dirname, `../data/sarah-pos-candidates-care-batch${batchNum}.json`);
  return {
    batchNum,
    products: JSON.parse(readFileSync(productsFile, 'utf8')),
    state: JSON.parse(readFileSync(stateFile, 'utf8')),
    candidates: existsSync(candidatesFile)
      ? new Map(JSON.parse(readFileSync(candidatesFile, 'utf8')).map((c) => [c.barcode, c]))
      : new Map(),
  };
}

async function repairOne(product, candidate, liveId, stats) {
  const posName = candidate?.posName || product.nameEn || '';
  const orisdi = await resolveOrisdi(product.barcode).catch(() => null);
  const sarah = await resolveSarah(product.barcode, posName).catch(() => null);
  await sleep(250);
  const niceone = await resolveNiceone(product.barcode).catch(() => null);
  await sleep(200);
  const miswag = await resolveMiswag(product.barcode).catch(() => null);
  const waheteter = sarah?.nameEn && !isBadName(sarah.nameEn)
    ? null
    : await resolveWaheteter(product.barcode, candidate?.slugHint).catch(() => null);

  let sources = [sarah, orisdi, niceone, miswag, buildFromCandidate(candidate), buildFromProductJson(product), waheteter].filter(Boolean);
  let merged = mergeResolved(product, candidate, sources);
  if (merged && !merged.images?.length && merged.nameEn) {
    const byName = await resolveSarahByName(merged.nameEn).catch(() => null);
    if (byName) {
      sources = [...sources, byName];
      merged = mergeResolved(product, candidate, sources);
    }
  }
  if (!merged) {
    stats.skip += 1;
    console.log(`SKIP ${product.barcode} — could not resolve metadata`);
    return;
  }

  product.sarahId = merged.sarahId || product.sarahId;
  product.url = merged.url || product.url;
  Object.assign(product, merged);

  const brandId = await resolveBrandId(merged.brandEn, merged.brandAr);
  const patch = {
    name: merged.nameAr,
    nameAr: merged.nameAr,
    nameEn: merged.nameEn,
    description: merged.descriptionAr,
    descriptionAr: merged.descriptionAr,
    descriptionEn: merged.descriptionEn,
    categoryId: merged.categoryId,
    subcategoryIds: merged.subcategoryIds,
    tertiaryCategoryIds: merged.tertiaryCategoryIds,
  };
  if (brandId) patch.brandId = brandId;

  let imageIds = [];
  if (!METADATA_ONLY && merged.images?.length) {
    imageIds = await uploadImages(merged.images);
  }

  if (DRY_RUN) {
    console.log(`DRY ${product.barcode} [${merged.source}] ${merged.nameEn.slice(0, 55)} imgs=${imageIds.length || merged.images.length}`);
    stats.ok += 1;
    return;
  }

  await api(`/products/${liveId}`, { method: 'PATCH', body: patch });
  if (imageIds.length) {
    await api(`/products/${liveId}`, { method: 'PATCH', body: { imageIds } });
  }

  stats.ok += 1;
  console.log(`OK ${product.barcode} [${merged.source}] ${merged.nameEn.slice(0, 55)} imgs=${imageIds.length}`);
}

async function main() {
  await getToken();
  const stats = { ok: 0, skip: 0, fail: 0 };
  let total = 0;

  for (const batchStr of BATCHES) {
    const batchNum = Number(batchStr);
    const { products, state, candidates } = loadBatch(batchNum);
    const byBarcode = new Map(products.map((p) => [p.barcode, p]));
    const entries = Object.entries(state.imported || {});

    console.log(`\n=== Batch ${batchNum}: ${entries.length} products ===\n`);

    for (const [barcode, meta] of entries) {
      if (LIMIT > 0 && total >= LIMIT) break;
      total += 1;
      if (total > 1) await sleep(DELAY_MS);

      const product = byBarcode.get(barcode);
      if (!product) {
        stats.skip += 1;
        console.log(`SKIP ${barcode} — missing from products file`);
        continue;
      }

      try {
        const live = await api(`/products/${meta.id}`);
        const needsMeta = isBadName(live.nameEn) || isBadName(live.nameAr);
        if (!METADATA_ONLY && !needsMeta && realImageCount(live) > 0) {
          stats.skip += 1;
          console.log(`SKIP ${barcode} — already OK`);
          continue;
        }
        await repairOne(product, candidates.get(barcode), meta.id, stats);
      } catch (err) {
        stats.fail += 1;
        console.log(`FAIL ${barcode} — ${err.message}`);
      }
    }

    writeFileSync(
      path.join(__dirname, `../data/sarah-pos-import-products-batch${batchNum}.json`),
      `${JSON.stringify([...byBarcode.values()], null, 2)}\n`,
    );
  }

  console.log(`\nDone: OK=${stats.ok} SKIP=${stats.skip} FAIL=${stats.fail}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
