import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  fetchHomeCategories,
  buildBilingualCategoryTree,
  fetchCategoryProducts,
  fetchProductDetail,
  searchProducts,
  normalizeProductSummary,
  normalizeProductDetail,
  extractBarcode,
  enrichShades,
  fetchManufacturersCatalog,
  fetchManufacturerProducts,
  mapClientSort,
  sortProductsClient,
} from './lib/api.js';
import {
  enrichShadesDeep,
  enrichShadesCached,
  enrichShadesFromDatabase,
  enrichShadesLookup,
  saveProductToIndex,
  resolveProductBarcodesBatch,
  shadeStats,
  getBarcodeCacheStats,
} from './lib/barcodes.js';
import {
  fetchCategories as fetchVanillaCategories,
  buildCategoryTree as buildVanillaCategoryTree,
  fetchCategoryProducts as fetchVanillaCategoryProducts,
  searchProducts as searchVanillaProducts,
  fetchProductDetail as fetchVanillaProductDetail,
  normalizeProductSummary as normalizeVanillaProductSummary,
  normalizeProductDetail as normalizeVanillaProductDetail,
} from './lib/vanilla-api.js';
import {
  buildBilingualCategoryTree as buildElryanCategoryTree,
  fetchBeautyCategoriesBilingual,
  enrichProductList,
  fetchProductByIdBilingual,
  sortProductsClientBilingual,
  elryanAr,
} from './lib/elryan-api.js';
import {
  fetchCategoryTreeRaw as fetchMiraayaCategoriesRaw,
  buildCategoryTree as buildMiraayaCategoryTree,
  fetchCategoryProducts as fetchMiraayaCategoryProducts,
  searchProducts as searchMiraayaProducts,
  fetchProductById as fetchMiraayaProductById,
  fetchProductBySku as fetchMiraayaProductBySku,
  normalizeProductSummary as normalizeMiraayaProductSummary,
  normalizeProductDetail as normalizeMiraayaProductDetail,
  sortProductsClient as sortMiraayaProductsClient,
  fetchBrandsCatalog as fetchMiraayaBrands,
  fetchBrandProducts as fetchMiraayaBrandProducts,
} from './lib/miraaya-api.js';
import {
  fetchCategoryTreeRaw as fetchFacesCategoriesRaw,
  fetchCategoryProducts as fetchFacesCategoryProducts,
  searchProducts as searchFacesProducts,
  searchProductsIncludingBarcode as searchFacesProductsIncludingBarcode,
  fetchProductById as fetchFacesProductById,
  normalizeProductSummary as normalizeFacesProductSummary,
  normalizeProductDetailFromRaw as normalizeFacesProductDetail,
  sortProductsClient as sortFacesProductsClient,
  fetchBrandsCatalog as fetchFacesBrands,
  fetchBrandProducts as fetchFacesBrandProducts,
  fetchCategoryProductCounts as fetchFacesCategoryCounts,
} from './lib/faces-api.js';
import {
  buildCategoryTree as buildAmazonCategoryTree,
  fetchCategoryProducts as fetchAmazonCategoryProducts,
  searchProducts as searchAmazonProducts,
  fetchProductByAsin as fetchAmazonProductByAsin,
  normalizeProductSummary as normalizeAmazonProductSummary,
  sortProductsClient as sortAmazonProductsClient,
} from './lib/amazon-api.js';
import {
  fetchCategoryTree as fetchMiswagCategoryTree,
  fetchCategoryProducts as fetchMiswagCategoryProducts,
  searchProducts as searchMiswagProducts,
  fetchProductDetail as fetchMiswagProductDetail,
  normalizeProductSummary as normalizeMiswagProductSummary,
  normalizeProductDetail as normalizeMiswagProductDetail,
  sortProductsClient as sortMiswagProductsClient,
  fetchBrands as fetchMiswagBrands,
} from './lib/miswag-api.js';
import {
  fetchCategoryTree as fetchOrisdiCategoryTree,
  fetchCategoryProducts as fetchOrisdiCategoryProducts,
  searchProducts as searchOrisdiProducts,
  fetchProductDetail as fetchOrisdiProductDetail,
  normalizeProductSummary as normalizeOrisdiProductSummary,
  sortProductsClient as sortOrisdiProductsClient,
  warmupOrisdiFeed,
} from './lib/orisdi-api.js';
import {
  fetchCategoryTree as fetchBeautywayCategoryTree,
  fetchCategoryProducts as fetchBeautywayCategoryProducts,
  searchProducts as searchBeautywayProducts,
  fetchProductDetail as fetchBeautywayProductDetail,
  normalizeProductSummary as normalizeBeautywayProductSummary,
  normalizeProductDetail as normalizeBeautywayProductDetail,
  sortProductsClient as sortBeautywayProductsClient,
} from './lib/beautyway-api.js';
import {
  fetchCategoryTree as fetchNajdCategoryTree,
  fetchCategoryProducts as fetchNajdCategoryProducts,
  searchProducts as searchNajdProducts,
  fetchProductDetail as fetchNajdProductDetail,
  normalizeProductSummary as normalizeNajdProductSummary,
  normalizeProductDetail as normalizeNajdProductDetail,
  sortProductsClient as sortNajdProductsClient,
} from './lib/najd-api.js';
import { collectDescendantIds, findCategoryNode, applyProductCounts } from './lib/category-scope.js';
import { searchBarcodeAllStores, searchBarcodeAllStoresStreaming, warmupBarcodeSearch } from './lib/barcode-search.js';
import { searchImportByBarcode, searchImportByBarcodeStream, fetchImportProduct, fetchImportSummary } from './lib/catalog-import.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 10000;
const HOST = process.env.HOST || '0.0.0.0';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const VIEWER_ROOT = path.join(__dirname, 'viewer');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

let categoryCache = { tree: null, leaves: null, fetchedAt: 0 };
let vanillaCategoryCache = { tree: null, leaves: null, all: null, fetchedAt: 0 };
let elryanCategoryCache = { tree: null, leaves: null, all: null, ids: null, fetchedAt: 0 };
let elryanBrandsCache = { brands: null, fetchedAt: 0 };
let miraayaCategoryCache = { tree: null, leaves: null, all: null, fetchedAt: 0 };
let facesCategoryCache = { tree: null, leaves: null, all: null, fetchedAt: 0 };
let miswagCategoryCache = { tree: null, leaves: null, fetchedAt: 0 };
let orisdiCategoryCache = { tree: null, leaves: null, fetchedAt: 0 };
let beautywayCategoryCache = { tree: null, leaves: null, fetchedAt: 0 };
let vaneersaCategoryCache = { tree: null, leaves: null, fetchedAt: 0 };
let najdCategoryCache = { tree: null, leaves: null, fetchedAt: 0 };
let facesCategoryInflight = null;
let niceoneBrandsCache = { brands: null, fetchedAt: 0 };
let miraayaBrandsCache = { brands: null, fetchedAt: 0 };
let facesBrandsCache = { brands: null, fetchedAt: 0 };
const CACHE_MS = 30 * 60 * 1000;
const FACES_CAT_CACHE_FILE = path.join(__dirname, 'data', 'faces-category-cache.json');

function loadFacesCategoryDiskCache() {
  try {
    const raw = JSON.parse(fs.readFileSync(FACES_CAT_CACHE_FILE, 'utf8'));
    if (raw?.tree?.length) {
      facesCategoryCache = {
        tree: raw.tree,
        leaves: raw.leaves || [],
        all: raw.all || [],
        fetchedAt: raw.fetchedAt || Date.now(),
      };
    }
  } catch {
    /* no disk cache yet */
  }
}

function saveFacesCategoryDiskCache() {
  if (!facesCategoryCache.tree?.length) return;
  try {
    fs.mkdirSync(path.dirname(FACES_CAT_CACHE_FILE), { recursive: true });
    fs.writeFileSync(FACES_CAT_CACHE_FILE, JSON.stringify({
      tree: facesCategoryCache.tree,
      leaves: facesCategoryCache.leaves,
      all: facesCategoryCache.all,
      fetchedAt: facesCategoryCache.fetchedAt,
    }));
  } catch (err) {
    console.warn('Faces category disk cache:', err.message);
  }
}

async function getCategoryTree() {
  if (categoryCache.tree && Date.now() - categoryCache.fetchedAt < CACHE_MS) {
    return categoryCache;
  }
  const [rawAr, rawEn] = await Promise.all([
    fetchHomeCategories('ar'),
    fetchHomeCategories('en'),
  ]);
  const { tree, leaves } = buildBilingualCategoryTree(rawAr, rawEn);
  categoryCache = { tree, leaves, fetchedAt: Date.now() };
  return categoryCache;
}

async function getVanillaCategoryTree() {
  if (vanillaCategoryCache.tree && Date.now() - vanillaCategoryCache.fetchedAt < CACHE_MS) {
    return vanillaCategoryCache;
  }
  const items = await fetchVanillaCategories();
  const { tree, leaves, all } = buildVanillaCategoryTree(items);
  vanillaCategoryCache = { tree, leaves, all, fetchedAt: Date.now() };
  return vanillaCategoryCache;
}

async function getElryanCategoryTree() {
  if (elryanCategoryCache.tree && Date.now() - elryanCategoryCache.fetchedAt < CACHE_MS) {
    return elryanCategoryCache;
  }
  const { itemsAr, itemsEn } = await fetchBeautyCategoriesBilingual();
  const { tree, leaves, all, ids } = buildElryanCategoryTree(itemsAr, itemsEn);
  elryanCategoryCache = { tree, leaves, all, ids, fetchedAt: Date.now() };
  scheduleElryanCountEnrich();
  return elryanCategoryCache;
}

function scheduleElryanCountEnrich() {
  if (elryanCategoryCache.countsEnriching) return;
  elryanCategoryCache.countsEnriching = true;
  elryanAr.fetchCategoryProductCounts(elryanCategoryCache.all, elryanCategoryCache.ids)
    .then((countMap) => applyProductCounts(elryanCategoryCache.all, countMap))
    .catch((err) => console.warn('Elryan category counts:', err.message))
    .finally(() => { elryanCategoryCache.countsEnriching = false; });
}

async function getMiraayaCategoryTree() {
  if (miraayaCategoryCache.tree && Date.now() - miraayaCategoryCache.fetchedAt < CACHE_MS) {
    return miraayaCategoryCache;
  }
  const bilingualRoots = await fetchMiraayaCategoriesRaw();
  const { tree, leaves, all } = buildMiraayaCategoryTree(bilingualRoots);
  miraayaCategoryCache = { tree, leaves, all, fetchedAt: Date.now() };
  return miraayaCategoryCache;
}

async function getFacesCategoryTree({ force = false } = {}) {
  const hasTree = Boolean(facesCategoryCache.tree?.length);
  const fresh = hasTree && Date.now() - facesCategoryCache.fetchedAt < CACHE_MS;
  if (!force && fresh) return facesCategoryCache;
  if (!force && hasTree && !facesCategoryInflight) {
    getFacesCategoryTree({ force: true }).catch((err) => console.warn('Faces category refresh:', err.message));
    return facesCategoryCache;
  }
  if (facesCategoryInflight) return facesCategoryInflight;
  facesCategoryInflight = (async () => {
    try {
      const { tree, leaves, all } = await fetchFacesCategoriesRaw();
      facesCategoryCache = { tree, leaves, all, fetchedAt: Date.now() };
      saveFacesCategoryDiskCache();
      scheduleFacesCountEnrich();
      return facesCategoryCache;
    } finally {
      facesCategoryInflight = null;
    }
  })();
  return facesCategoryInflight;
}

function scheduleFacesCountEnrich() {
  if (facesCategoryCache.countsEnriching) return;
  facesCategoryCache.countsEnriching = true;
  fetchFacesCategoryCounts(facesCategoryCache.all)
    .then((countMap) => applyProductCounts(facesCategoryCache.all, countMap))
    .catch((err) => console.warn('Faces category counts:', err.message))
    .finally(() => { facesCategoryCache.countsEnriching = false; });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function sendJson(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...corsHeaders(),
  });
  res.end(JSON.stringify(data));
}

function sendSseEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function startSseResponse(res) {
  res.writeHead(200, {
    ...corsHeaders(),
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');
}

function parseQuery(url) {
  const q = {};
  for (const [k, v] of url.searchParams) q[k] = v;
  return q;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

async function handleApi(req, res, url) {
  try {
    const q = parseQuery(url);

    if (url.pathname === '/api/products/barcodes' && req.method === 'POST') {
      const body = await readBody(req);
      const ids = Array.isArray(body.ids) ? body.ids : [];
      const deep = body.deep === true;
      if (!ids.length) return sendJson(res, 400, { error: 'ids required' });
      const barcodes = await resolveProductBarcodesBatch(ids, { deep, concurrency: 4 });
      return sendJson(res, 200, { barcodes });
    }

    if (url.pathname === '/api/health') {
      return sendJson(res, 200, { ok: true, source: 'api.niceonesa.com' });
    }

    if (url.pathname === '/api/barcodes/stats') {
      return sendJson(res, 200, getBarcodeCacheStats());
    }

    if (url.pathname === '/api/categories') {
      const { tree, leaves } = await getCategoryTree();
      return sendJson(res, 200, { tree, leaves, totalLeaves: leaves.length });
    }

    if (url.pathname === '/api/brands') {
      if (niceoneBrandsCache.brands == null || Date.now() - niceoneBrandsCache.fetchedAt > CACHE_MS) {
        niceoneBrandsCache = { brands: await fetchManufacturersCatalog(), fetchedAt: Date.now() };
      }
      return sendJson(res, 200, { brands: niceoneBrandsCache.brands, total: niceoneBrandsCache.brands.length });
    }

    const niceoneBrandMatch = url.pathname.match(/^\/api\/brands\/([^/]+)\/products$/);
    if (niceoneBrandMatch) {
      const brandId = decodeURIComponent(niceoneBrandMatch[1]);
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const brand = (niceoneBrandsCache.brands || []).find((b) => String(b.id) === String(brandId));
      const data = await fetchManufacturerProducts(brandId, { page, limit, sort });
      const meta = {
        brandId,
        path: brand ? `علامة: ${brand.name}` : `علامة: ${brandId}`,
        pathEn: brand ? `Brand: ${brand.name}` : `Brand: ${brandId}`,
        name: brand?.name || brandId,
        nameEn: brand?.nameEn || brand?.name || brandId,
        totalCount: data.total ?? data.product_total ?? null,
      };
      let products = (data.products || []).map((p) => normalizeProductSummary(p, meta));
      if (sort !== 'default') products = sortProductsClient(products, sort);
      const itemsCount = products.length;
      return sendJson(res, 200, {
        meta,
        products,
        page,
        limit,
        hasMore: meta.totalCount != null ? page * limit < meta.totalCount : itemsCount >= limit,
      });
    }

    const catMatch = url.pathname.match(/^\/api\/categories\/([^/]+)\/products$/);
    if (catMatch) {
      const slug = decodeURIComponent(catMatch[1]);
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const search = q.search || '';
      const manufacturerIds = q.manufacturers || q.manufacturer_ids || '';
      const apiSort = mapClientSort(sort);

      const data = await fetchCategoryProducts(slug, {
        page,
        limit,
        sort: apiSort,
        search,
        manufacturerIds,
        attributeIds: q.filters || q.attribute_ids || '',
      });

      const leaf = (await getCategoryTree()).leaves.find((c) => c.slug === slug);
      const meta = {
        slug,
        path: leaf?.path || data.category || slug,
        pathEn: leaf?.pathEn || leaf?.path || slug,
        categoryInfo: data.data || null,
        hierarchy: data.category_hierarchy || [],
        filters: data.filters || null,
      };

      const products = (data.products || []).map((p) => normalizeProductSummary(p, meta));
      const totalCount = data.total ?? data.product_total ?? null;
      const hasMore = totalCount != null ? page * limit < totalCount : products.length >= limit;

      return sendJson(res, 200, {
        meta: { ...meta, totalCount },
        products,
        page,
        limit,
        hasMore,
      });
    }

    if (url.pathname === '/api/search') {
      const query = q.q || q.search || '';
      if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const data = await searchProducts(query, page, limit);
      let products = (data.products || []).map((p) => normalizeProductSummary(p, { slug: 'search', path: `بحث: ${query}`, pathEn: `Search: ${query}` }));
      if (sort !== 'default') products = sortProductsClient(products, sort);
      const totalCount = data.total ?? data.product_total ?? null;
      return sendJson(res, 200, {
        meta: { slug: 'search', path: `بحث: ${query}`, pathEn: `Search: ${query}`, query, totalCount },
        products,
        page,
        limit,
        hasMore: totalCount != null ? page * limit < totalCount : products.length >= limit,
      });
    }

    const productMatch = url.pathname.match(/^\/api\/products\/(\d+)$/);
    if (productMatch) {
      const id = productMatch[1];
      const optionId = q.option_id || q.optionId || null;
      const productOptionId = q.product_option_id || q.productOptionId || null;
      let optionSelection = null;
      if (productOptionId && optionId) {
        optionSelection = { [productOptionId]: optionId };
      } else if (optionId) {
        optionSelection = optionId;
      }
      const [detail, detailEn] = await Promise.all([
        fetchProductDetail(id, optionSelection),
        fetchProductDetail(id, optionSelection, { lang: 'en' }),
      ]);
      if (!detail?.id) return sendJson(res, 404, { error: 'Product not found' });

      const normalized = normalizeProductDetail(detail, detailEn);
      if (normalized.shades?.length) {
        normalized.shades = await enrichShadesFromDatabase(detail);
        normalized.shadeCount = normalized.shades.length;
        saveProductToIndex(id, detail, normalized.shades);
      }
      const productBarcode = extractBarcode(detail);
      normalized.barcode = productBarcode || normalized.barcode;

      if (optionId) {
        const active = normalized.shades.find((s) => s.optionId === String(optionId)) || null;
        normalized.activeShade = active;
        normalized.sku = active?.sku || detail.sku || normalized.sku;
        normalized.barcode = active?.ean || extractBarcode(detail) || normalized.barcode;
      }
      return sendJson(res, 200, { product: normalized });
    }

    const shadesMatch = url.pathname.match(/^\/api\/products\/(\d+)\/shades$/);
    if (shadesMatch) {
      const id = shadesMatch[1];
      const base = await fetchProductDetail(id);
      const deep = q.deep === '1' || q.deep === 'true';
      const lookup = q.lookup === '1' || q.lookup === 'true';
      const maxLookups = Math.min(Number(q.max) || 8, 15);

      let shades;
      let lookupMeta = null;

      if (lookup) {
        const result = await enrichShadesLookup(base, { maxLookups });
        shades = result.shades;
        lookupMeta = { looked: result.looked, complete: result.done };
      } else if (deep) {
        shades = await enrichShadesDeep(base);
      } else {
        shades = await enrichShadesFromDatabase(base);
      }

      return sendJson(res, 200, {
        productId: id,
        barcode: extractBarcode(base),
        shades,
        stats: shadeStats(shades),
        deep,
        lookup: lookupMeta,
      });
    }

    return sendJson(res, 404, { error: 'Unknown API route' });
  } catch (err) {
    console.error('API error:', err.message);
    return sendJson(res, 502, { error: err.message });
  }
}

async function handleVanillaApi(req, res, url) {
  try {
    const q = parseQuery(url);

    if (url.pathname === '/api/vanilla/health') {
      return sendJson(res, 200, { ok: true, source: 'vanillacosmetics.com' });
    }

    if (url.pathname === '/api/vanilla/categories') {
      const { tree, leaves } = await getVanillaCategoryTree();
      return sendJson(res, 200, { tree, leaves, totalLeaves: leaves.length });
    }

    const catMatch = url.pathname.match(/^\/api\/vanilla\/categories\/(\d+)\/products$/);
    if (catMatch) {
      const categoryId = catMatch[1];
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const search = q.search || '';

      const data = await fetchVanillaCategoryProducts(categoryId, { page, limit, search, sort });
      const { all } = await getVanillaCategoryTree();
      const cat = all.find((c) => String(c.id) === String(categoryId) || c.slug === categoryId);

      const products = (data.items || []).map((p) =>
        normalizeVanillaProductSummary(p, { path: cat?.path, name: cat?.name })
      );

      const itemsCount = (data.items || []).length;
      const hasMore = itemsCount >= limit;

      return sendJson(res, 200, {
        meta: {
          categoryId: Number(categoryId),
          path: cat?.path || categoryId,
          name: cat?.name || '',
          totalCount: data.totalCount || cat?.productCount || null,
        },
        products,
        page: data.pageNumber || page,
        limit: data.pageSize || limit,
        hasMore,
        totalPages: data.totalPages,
      });
    }

    if (url.pathname === '/api/vanilla/search') {
      const query = q.q || q.search || '';
      if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const data = await searchVanillaProducts(query, page, limit);
      const products = (data.items || []).map((p) =>
        normalizeVanillaProductSummary(p, { path: `بحث: ${query}` })
      );
      const itemsCount = (data.items || []).length;
      return sendJson(res, 200, {
        meta: { query, path: `بحث: ${query}` },
        products,
        page: data.pageNumber || page,
        limit: data.pageSize || limit,
        hasMore: itemsCount >= limit,
      });
    }

    const productMatch = url.pathname.match(/^\/api\/vanilla\/products\/(\d+)$/);
    if (productMatch) {
      const id = productMatch[1];
      const detail = await fetchVanillaProductDetail(id);
      if (!detail?.id) return sendJson(res, 404, { error: 'Product not found' });
      const normalized = await normalizeVanillaProductDetail(detail);
      return sendJson(res, 200, { product: normalized });
    }

    return sendJson(res, 404, { error: 'Unknown Vanilla API route' });
  } catch (err) {
    console.error('Vanilla API error:', err.message);
    return sendJson(res, 502, { error: err.message });
  }
}

async function getMiswagCategoryTree() {
  if (miswagCategoryCache.tree && Date.now() - miswagCategoryCache.fetchedAt < CACHE_MS) {
    return miswagCategoryCache;
  }
  const { tree, leaves } = await fetchMiswagCategoryTree();
  miswagCategoryCache = { tree, leaves, fetchedAt: Date.now() };
  return miswagCategoryCache;
}

async function handleMiswagApi(req, res, url) {
  try {
    const q = parseQuery(url);

    if (url.pathname === '/api/miswag/health') {
      return sendJson(res, 200, { ok: true, source: 'miswag.com', scope: 'beauty', bilingual: true });
    }

    if (url.pathname === '/api/miswag/categories') {
      const { tree, leaves } = await getMiswagCategoryTree();
      return sendJson(res, 200, { tree, leaves, totalLeaves: leaves.length });
    }

    if (url.pathname === '/api/miswag/brands') {
      const query = q.q || q.query || '';
      const limit = Math.min(Number(q.limit) || 30, 60);
      const data = await fetchMiswagBrands({ query, cursor: q.cursor || '', limit });
      return sendJson(res, 200, data);
    }

    const catMatch = url.pathname.match(/^\/api\/miswag\/categories\/([^/]+)\/products$/);
    if (catMatch) {
      const categoryId = decodeURIComponent(catMatch[1]);
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const data = await fetchMiswagCategoryProducts(categoryId, { page, limit, sort });
      const products = (data.items || []).map((p) => normalizeMiswagProductSummary(p));

      let name = categoryId;
      let path = categoryId;
      try {
        const { leaves, tree } = await getMiswagCategoryTree();
        const node = [...(leaves || []), ...(tree || [])].find((n) => n.slug === categoryId || n.id === categoryId);
        if (node) { name = node.name || categoryId; path = node.name || categoryId; }
      } catch { /* keep alias */ }

      return sendJson(res, 200, {
        meta: { categoryId, path, name },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: !!data.hasMore,
        total: data.total ?? null,
        cursor: data.cursor || null,
      });
    }

    if (url.pathname === '/api/miswag/search') {
      const query = q.q || q.search || '';
      if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const data = await searchMiswagProducts(query, page, limit);
      let products = (data.items || []).map((p) => normalizeMiswagProductSummary(p));
      const sort = q.sort || 'default';
      if (sort !== 'default') products = sortMiswagProductsClient(products, sort);
      return sendJson(res, 200, {
        meta: { query, path: `بحث: ${query}`, fallback: !!data.fallback },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: (data.items || []).length >= limit,
        total: data.total ?? null,
      });
    }

    const productMatch = url.pathname.match(/^\/api\/miswag\/products\/(\d+)$/);
    if (productMatch) {
      const id = productMatch[1];
      const detail = await fetchMiswagProductDetail(id);
      if (!detail?.id) return sendJson(res, 404, { error: 'Product not found' });
      const normalized = normalizeMiswagProductDetail(detail);
      return sendJson(res, 200, { product: normalized });
    }

    return sendJson(res, 404, { error: 'Unknown Miswag API route' });
  } catch (err) {
    console.error('Miswag API error:', err.message);
    return sendJson(res, 502, { error: err.message });
  }
}

async function getOrisdiCategoryTree() {
  if (orisdiCategoryCache.tree && Date.now() - orisdiCategoryCache.fetchedAt < CACHE_MS) {
    return orisdiCategoryCache;
  }
  const { tree, leaves } = await fetchOrisdiCategoryTree();
  orisdiCategoryCache = { tree, leaves, fetchedAt: Date.now() };
  return orisdiCategoryCache;
}

async function handleOrisdiApi(req, res, url) {
  try {
    const q = parseQuery(url);

    if (url.pathname === '/api/orisdi/health') {
      return sendJson(res, 200, { ok: true, source: 'orisdi.com', scope: 'beauty-perfumes-makeup', bilingual: true });
    }

    if (url.pathname === '/api/orisdi/categories') {
      const { tree, leaves } = await getOrisdiCategoryTree();
      return sendJson(res, 200, { tree, leaves, totalLeaves: leaves.length });
    }

    const catMatch = url.pathname.match(/^\/api\/orisdi\/categories\/([^/]+)\/products$/);
    if (catMatch) {
      const categoryId = decodeURIComponent(catMatch[1]);
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const data = await fetchOrisdiCategoryProducts(categoryId, { page, limit });
      let products = (data.items || []).map((p) => normalizeOrisdiProductSummary(p));
      if (sort !== 'default') products = sortOrisdiProductsClient(products, sort);
      return sendJson(res, 200, {
        meta: { categoryId, path: categoryId, name: categoryId },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: !!data.hasMore,
      });
    }

    if (url.pathname === '/api/orisdi/search') {
      const query = q.q || q.search || '';
      if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const data = await searchOrisdiProducts(query, page, limit);
      let products = (data.items || []).map((p) => normalizeOrisdiProductSummary(p));
      const sort = q.sort || 'default';
      if (sort !== 'default') products = sortOrisdiProductsClient(products, sort);
      return sendJson(res, 200, {
        meta: { query, path: `بحث: ${query}` },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: !!data.hasMore,
        total: data.total ?? null,
      });
    }

    const productMatch = url.pathname.match(/^\/api\/orisdi\/products\/(\d+)$/);
    if (productMatch) {
      const id = productMatch[1];
      const product = await fetchOrisdiProductDetail(id, { barcode: q.barcode || '' });
      if (!product?.id) return sendJson(res, 404, { error: 'Product not found' });
      return sendJson(res, 200, { product });
    }

    return sendJson(res, 404, { error: 'Unknown Orisdi API route' });
  } catch (err) {
    console.error('Orisdi API error:', err.message);
    return sendJson(res, 502, { error: err.message });
  }
}

async function getBeautywayCategoryTree() {
  if (beautywayCategoryCache.tree && Date.now() - beautywayCategoryCache.fetchedAt < CACHE_MS) {
    return beautywayCategoryCache;
  }
  const { tree, leaves } = await fetchBeautywayCategoryTree();
  beautywayCategoryCache = { tree, leaves, fetchedAt: Date.now() };
  return beautywayCategoryCache;
}

async function getVaneersaCategoryTree() {
  if (vaneersaCategoryCache.tree && Date.now() - vaneersaCategoryCache.fetchedAt < CACHE_MS) {
    return vaneersaCategoryCache;
  }
  const { tree, leaves } = await fetchVaneersaCategoryTree();
  vaneersaCategoryCache = { tree, leaves, fetchedAt: Date.now() };
  return vaneersaCategoryCache;
}

async function handleBeautywayApi(req, res, url) {
  try {
    const q = parseQuery(url);

    if (url.pathname === '/api/beautyway/health') {
      return sendJson(res, 200, { ok: true, source: 'beautyway-iq.com', scope: 'beauty-perfumes-makeup', bilingual: true });
    }

    if (url.pathname === '/api/beautyway/categories') {
      const { tree, leaves } = await getBeautywayCategoryTree();
      return sendJson(res, 200, { tree, leaves, totalLeaves: leaves.length });
    }

    const catMatch = url.pathname.match(/^\/api\/beautyway\/categories\/([^/]+)\/products$/);
    if (catMatch) {
      const categoryId = decodeURIComponent(catMatch[1]);
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const data = await fetchBeautywayCategoryProducts(categoryId, { page, limit });
      let products = (data.items || []).map((p) => normalizeBeautywayProductSummary(p));
      if (sort !== 'default') products = sortBeautywayProductsClient(products, sort);
      return sendJson(res, 200, {
        meta: { categoryId, path: categoryId, name: categoryId },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: !!data.hasMore,
      });
    }

    if (url.pathname === '/api/beautyway/search') {
      const query = q.q || q.search || '';
      if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const data = await searchBeautywayProducts(query, page, limit);
      let products = (data.items || []).map((p) => normalizeBeautywayProductSummary(p));
      const sort = q.sort || 'default';
      if (sort !== 'default') products = sortBeautywayProductsClient(products, sort);
      return sendJson(res, 200, {
        meta: { query, path: `بحث: ${query}` },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: !!data.hasMore,
      });
    }

    const productMatch = url.pathname.match(/^\/api\/beautyway\/products\/(\d+)$/);
    if (productMatch) {
      const id = productMatch[1];
      const product = await fetchBeautywayProductDetail(id, { slug: q.slug || '' });
      if (!product?.id) return sendJson(res, 404, { error: 'Product not found' });
      return sendJson(res, 200, { product });
    }

    return sendJson(res, 404, { error: 'Unknown Beauty Way API route' });
  } catch (err) {
    console.error('Beauty Way API error:', err.message);
    return sendJson(res, 502, { error: err.message });
  }
}

async function getNajdCategoryTree() {
  if (najdCategoryCache.tree && Date.now() - najdCategoryCache.fetchedAt < CACHE_MS) {
    return najdCategoryCache;
  }
  const { tree, leaves } = await fetchNajdCategoryTree();
  najdCategoryCache = { tree, leaves, fetchedAt: Date.now() };
  return najdCategoryCache;
}

async function handleNajdApi(req, res, url) {
  try {
    const q = parseQuery(url);

    if (url.pathname === '/api/najd/health') {
      return sendJson(res, 200, {
        ok: true,
        source: 'najdalatheyah.com',
        scope: 'perfumes-niche-global',
        bilingual: true,
      });
    }

    if (url.pathname === '/api/najd/categories') {
      const { tree, leaves } = await getNajdCategoryTree();
      return sendJson(res, 200, { tree, leaves, totalLeaves: leaves.length });
    }

    const catMatch = url.pathname.match(/^\/api\/najd\/categories\/([^/]+)\/products$/);
    if (catMatch) {
      const categoryId = decodeURIComponent(catMatch[1]);
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const { tree, leaves } = await getNajdCategoryTree();
      const node = findCategoryNode(tree, categoryId) || leaves.find((c) => c.id === categoryId);
      const data = await fetchNajdCategoryProducts(categoryId, { page, limit });
      let products = (data.items || []).map((p) =>
        normalizeNajdProductSummary(p, { name: node?.name, nameEn: node?.nameEn }),
      );
      if (sort !== 'default') products = sortNajdProductsClient(products, sort);
      return sendJson(res, 200, {
        meta: { categoryId, path: node?.path || categoryId, name: node?.name || categoryId },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: !!data.hasMore,
      });
    }

    if (url.pathname === '/api/najd/search') {
      const query = q.q || q.search || '';
      if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const data = await searchNajdProducts(query, page, limit);
      let products = (data.items || []).map((p) => normalizeNajdProductSummary(p));
      const sort = q.sort || 'default';
      if (sort !== 'default') products = sortNajdProductsClient(products, sort);
      return sendJson(res, 200, {
        meta: { query, path: `بحث: ${query}` },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: !!data.hasMore,
      });
    }

    const productMatch = url.pathname.match(/^\/api\/najd\/products\/(\d+)$/);
    if (productMatch) {
      const id = productMatch[1];
      const product = await fetchNajdProductDetail(id, { barcode: q.barcode || '' });
      if (!product?.id) return sendJson(res, 404, { error: 'Product not found' });
      return sendJson(res, 200, { product: normalizeNajdProductDetail(product) });
    }

    return sendJson(res, 404, { error: 'Unknown Najd API route' });
  } catch (err) {
    console.error('Najd API error:', err.message);
    return sendJson(res, 502, { error: err.message });
  }
}

async function handleVaneersaApi(req, res, url) {
  try {
    const q = parseQuery(url);

    if (url.pathname === '/api/vaneersa/health') {
      return sendJson(res, 200, { ok: true, source: 'vaneersa.com', scope: 'beauty-skincare-makeup', bilingual: true });
    }

    if (url.pathname === '/api/vaneersa/categories') {
      const { tree, leaves } = await getVaneersaCategoryTree();
      return sendJson(res, 200, { tree, leaves, totalLeaves: leaves.length });
    }

    const catMatch = url.pathname.match(/^\/api\/vaneersa\/categories\/([^/]+)\/products$/);
    if (catMatch) {
      const categoryId = decodeURIComponent(catMatch[1]);
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const data = await fetchVaneersaCategoryProducts(categoryId, { page, limit });
      let products = (data.items || []).map((p) => normalizeVaneersaProductSummary(p));
      if (sort !== 'default') products = sortVaneersaProductsClient(products, sort);
      return sendJson(res, 200, {
        meta: { categoryId, path: categoryId, name: categoryId },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: !!data.hasMore,
      });
    }

    if (url.pathname === '/api/vaneersa/search') {
      const query = q.q || q.search || '';
      if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const data = await searchVaneersaProducts(query, page, limit);
      let products = (data.items || []).map((p) => normalizeVaneersaProductSummary(p));
      const sort = q.sort || 'default';
      if (sort !== 'default') products = sortVaneersaProductsClient(products, sort);
      return sendJson(res, 200, {
        meta: { query, path: `بحث: ${query}` },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: !!data.hasMore,
      });
    }

    const productMatch = url.pathname.match(/^\/api\/vaneersa\/products\/(\d+)$/);
    if (productMatch) {
      const id = productMatch[1];
      const product = await fetchVaneersaProductDetail(id, { barcode: q.barcode || '' });
      if (!product?.id) return sendJson(res, 404, { error: 'Product not found' });
      return sendJson(res, 200, { product: normalizeVaneersaProductDetail(product) });
    }

    return sendJson(res, 404, { error: 'Unknown Vaneersa API route' });
  } catch (err) {
    console.error('Vaneersa API error:', err.message);
    return sendJson(res, 502, { error: err.message });
  }
}

async function handleElryanApi(req, res, url) {
  try {
    const q = parseQuery(url);
    const { ids: beautyIds } = await getElryanCategoryTree();

    if (url.pathname === '/api/elryan/health') {
      return sendJson(res, 200, { ok: true, source: 'elryan.com', scope: 'beauty-fragrances', bilingual: true });
    }

    if (url.pathname === '/api/elryan/categories') {
      const { tree, leaves, all } = await getElryanCategoryTree();
      return sendJson(res, 200, { tree, leaves, all, totalLeaves: leaves.length });
    }

    if (url.pathname === '/api/elryan/brands') {
      if (elryanBrandsCache.brands == null || Date.now() - elryanBrandsCache.fetchedAt > CACHE_MS) {
        elryanBrandsCache = { brands: await elryanAr.fetchBeautyBrands(beautyIds), fetchedAt: Date.now() };
      }
      return sendJson(res, 200, { brands: elryanBrandsCache.brands, total: elryanBrandsCache.brands.length });
    }

    const elryanBrandMatch = url.pathname.match(/^\/api\/elryan\/brands\/([^/]+)\/products$/);
    if (elryanBrandMatch) {
      const brandId = decodeURIComponent(elryanBrandMatch[1]);
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const data = await elryanAr.fetchBrandProducts(brandId, { page, limit, sort, beautyIds });
      const brand = (elryanBrandsCache.brands || []).find((b) => String(b.id) === String(brandId));
      const meta = {
        path: brand ? `علامة: ${brand.name}` : `علامة: ${brandId}`,
        pathEn: brand ? `Brand: ${brand.nameEn || brand.name}` : `Brand: ${brandId}`,
        name: brand?.name || '',
        nameEn: brand?.nameEn || brand?.name || '',
      };
      let products = await enrichProductList(data.items || [], meta);
      if (sort !== 'default') products = sortProductsClientBilingual(products, sort);
      const itemsCount = (data.items || []).length;
      return sendJson(res, 200, {
        meta: { brandId, ...meta, totalCount: data.total ?? null },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: data.total != null ? page * limit < data.total : itemsCount >= limit,
      });
    }

    const catMatch = url.pathname.match(/^\/api\/elryan\/categories\/(\d+)\/products$/);
    if (catMatch) {
      const categoryId = catMatch[1];
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';

      const { all } = await getElryanCategoryTree();
      const cat = findCategoryNode(all, categoryId);

      const data = await elryanAr.fetchCategoryProducts(categoryId, {
        page,
        limit,
        sort,
        beautyIds,
        scopeIds: collectDescendantIds(cat),
      });

      const meta = {
        path: cat?.path || categoryId,
        pathEn: cat?.pathEn || '',
        name: cat?.name || '',
        nameEn: cat?.nameEn || '',
      };
      let products = await enrichProductList(data.items || [], meta);
      if (sort !== 'default') products = sortProductsClientBilingual(products, sort);
      const itemsCount = (data.items || []).length;
      const pageLimit = data.pageSize || limit;

      return sendJson(res, 200, {
        meta: {
          categoryId: Number(categoryId),
          ...meta,
          totalCount: data.total ?? null,
        },
        products,
        page: data.page || page,
        limit: pageLimit,
        hasMore: data.total != null ? page * pageLimit < data.total : itemsCount >= pageLimit,
      });
    }

    if (url.pathname === '/api/elryan/search') {
      const query = q.q || q.search || '';
      if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const data = await elryanAr.searchProducts(query, page, limit, beautyIds);
      const meta = { path: `بحث: ${query}`, pathEn: `Search: ${query}` };
      let products = await enrichProductList(data.items || [], meta);
      if (sort !== 'default') products = sortProductsClientBilingual(products, sort);
      const itemsCount = (data.items || []).length;
      return sendJson(res, 200, {
        meta: { query, ...meta, pathEn: `Search: ${query}` },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: data.total != null ? page * limit < data.total : itemsCount >= limit,
      });
    }

    const productMatch = url.pathname.match(/^\/api\/elryan\/products\/(\d+)$/);
    if (productMatch) {
      const id = productMatch[1];
      const product = await fetchProductByIdBilingual(id);
      if (!product?.id) return sendJson(res, 404, { error: 'Product not found' });
      return sendJson(res, 200, { product });
    }

    return sendJson(res, 404, { error: 'Unknown Elryan API route' });
  } catch (err) {
    console.error('Elryan API error:', err.message);
    return sendJson(res, 502, { error: err.message });
  }
}

async function handleMiraayaApi(req, res, url) {
  try {
    const q = parseQuery(url);

    if (url.pathname === '/api/miraaya/health') {
      return sendJson(res, 200, { ok: true, source: 'miraaya.com', api: 'magadmin.miraaya.com/graphql' });
    }

    if (url.pathname === '/api/miraaya/categories') {
      const { tree, leaves, all } = await getMiraayaCategoryTree();
      return sendJson(res, 200, { tree, leaves, all, totalLeaves: leaves.length });
    }

    const catMatch = url.pathname.match(/^\/api\/miraaya\/categories\/(\d+)\/products$/);
    if (catMatch) {
      const categoryId = catMatch[1];
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';

      const data = await fetchMiraayaCategoryProducts(categoryId, { page, limit, sort });
      const { all } = await getMiraayaCategoryTree();
      const cat = all.find((c) => String(c.id) === String(categoryId));

      let products = (data.items || []).map((p) =>
        normalizeMiraayaProductSummary(p, {
          path: cat?.path,
          pathEn: cat?.pathEn,
          name: cat?.name,
          nameEn: cat?.nameEn,
        })
      );
      if (sort !== 'default') {
        products = sortMiraayaProductsClient(products, sort);
      }

      const itemsCount = (data.items || []).length;
      const pageLimit = data.pageSize || limit;
      return sendJson(res, 200, {
        meta: {
          categoryId: Number(categoryId),
          path: cat?.path || categoryId,
          pathEn: cat?.pathEn || '',
          name: cat?.name || '',
          nameEn: cat?.nameEn || '',
          totalCount: data.total ?? null,
        },
        products,
        page: data.page || page,
        limit: pageLimit,
        hasMore: data.total != null ? page * pageLimit < data.total : itemsCount >= pageLimit,
      });
    }

    if (url.pathname === '/api/miraaya/brands') {
      const stale = Date.now() - miraayaBrandsCache.fetchedAt > CACHE_MS;
      if (miraayaBrandsCache.brands == null || stale || !miraayaBrandsCache.brands.length) {
        const brands = await fetchMiraayaBrands({ maxPages: 15, pageSize: 100 });
        miraayaBrandsCache = { brands, fetchedAt: Date.now() };
      }
      return sendJson(res, 200, { brands: miraayaBrandsCache.brands, total: miraayaBrandsCache.brands.length });
    }

    const miraayaBrandMatch = url.pathname.match(/^\/api\/miraaya\/brands\/([^/]+)\/products$/);
    if (miraayaBrandMatch) {
      const brandId = decodeURIComponent(miraayaBrandMatch[1]);
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const brand = (miraayaBrandsCache.brands || []).find((b) => String(b.id) === String(brandId));
      const brandName = brand?.name || brandId;
      const data = await fetchMiraayaBrandProducts(brandName, { page, limit, sort });
      let products = (data.items || []).map((p) =>
        normalizeMiraayaProductSummary(p, { path: `علامة: ${brandName}`, pathEn: `Brand: ${brand?.nameEn || brandName}` })
      );
      if (sort !== 'default') products = sortMiraayaProductsClient(products, sort);
      const itemsCount = (data.items || []).length;
      const pageLimit = data.pageSize || limit;
      return sendJson(res, 200, {
        meta: {
          brandId,
          path: `علامة: ${brandName}`,
          pathEn: `Brand: ${brand?.nameEn || brandName}`,
          name: brandName,
          nameEn: brand?.nameEn || '',
          totalCount: data.total ?? null,
        },
        products,
        page: data.page || page,
        limit: pageLimit,
        hasMore: data.total != null ? page * pageLimit < data.total : itemsCount >= pageLimit,
      });
    }

    if (url.pathname === '/api/miraaya/search') {
      const query = q.q || q.search || '';
      if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const data = await searchMiraayaProducts(query, page, limit);
      const products = (data.items || []).map((p) =>
        normalizeMiraayaProductSummary(p, { path: `بحث: ${query}`, pathEn: `Search: ${query}` })
      );
      const itemsCount = (data.items || []).length;
      return sendJson(res, 200, {
        meta: { query, path: `بحث: ${query}`, pathEn: `Search: ${query}` },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: itemsCount >= limit,
      });
    }

    const productMatch = url.pathname.match(/^\/api\/miraaya\/products\/([^/]+)$/);
    if (productMatch) {
      const key = decodeURIComponent(productMatch[1]);
      let detail = null;
      if (/^\d+$/.test(key)) {
        detail = await fetchMiraayaProductById(key);
      } else {
        detail = await fetchMiraayaProductBySku(key);
      }
      if (!detail?.id && !detail?.sku) return sendJson(res, 404, { error: 'Product not found' });
      const normalized = normalizeMiraayaProductDetail(detail);
      return sendJson(res, 200, { product: normalized });
    }

    return sendJson(res, 404, { error: 'Unknown Miraaya API route' });
  } catch (err) {
    console.error('Miraaya API error:', err.message);
    return sendJson(res, 502, { error: err.message });
  }
}

async function handleFacesApi(req, res, url) {
  try {
    const q = parseQuery(url);

    if (url.pathname === '/api/faces/health') {
      return sendJson(res, 200, { ok: true, source: 'faces.ae', api: 'Salesforce Commerce Cloud' });
    }

    if (url.pathname === '/api/faces/img') {
      const raw = q.u || q.url || '';
      let imgUrl = decodeURIComponent(raw).replace(/&amp;/g, '&');
      if (!imgUrl.startsWith('https://www.faces.ae/')) {
        return sendJson(res, 400, { error: 'Invalid image URL' });
      }
      const fetchImg = async (url) => fetch(url, {
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          Referer: 'https://www.faces.ae/',
          'User-Agent': 'Mozilla/5.0 (compatible; CatalogHub/1.0)',
        },
        redirect: 'follow',
      });
      let imgRes = await fetchImg(imgUrl);
      if (!imgRes.ok && imgUrl.includes('/BJSM_STG/')) {
        imgRes = await fetchImg(imgUrl.replace(/\/BJSM_STG\//g, '/BJSM_PRD/'));
      }
      if (!imgRes.ok) {
        return sendJson(res, imgRes.status, { error: `Image fetch failed: ${imgRes.status}` });
      }
      const ct = imgRes.headers.get('content-type') || 'image/jpeg';
      const buf = Buffer.from(await imgRes.arrayBuffer());
      res.writeHead(200, {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=604800',
      });
      return res.end(buf);
    }

    if (url.pathname === '/api/faces/categories') {
      const { tree, leaves, all } = await getFacesCategoryTree();
      return sendJson(res, 200, { tree, leaves, all, totalLeaves: leaves.length });
    }

    if (url.pathname === '/api/faces/brands') {
      if (facesBrandsCache.brands == null || Date.now() - facesBrandsCache.fetchedAt > CACHE_MS) {
        const brands = await fetchFacesBrands();
        facesBrandsCache = { brands, fetchedAt: Date.now() };
      }
      return sendJson(res, 200, { brands: facesBrandsCache.brands, total: facesBrandsCache.brands.length });
    }

    const facesBrandMatch = url.pathname.match(/^\/api\/faces\/brands\/([^/]+)\/products$/);
    if (facesBrandMatch) {
      const brandId = decodeURIComponent(facesBrandMatch[1]);
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const brand = (facesBrandsCache.brands || []).find((b) => String(b.id) === String(brandId));
      const brandName = brand?.name || brandId;
      const data = await fetchFacesBrandProducts(brandName, { page, limit });
      let products = (data.items || []).map((p) =>
        normalizeFacesProductSummary(p, { path: `علامة: ${brandName}`, pathEn: `Brand: ${brandName}` })
      );
      if (sort !== 'default') products = sortFacesProductsClient(products, sort);
      const itemsCount = (data.items || []).length;
      const pageLimit = data.pageSize || limit;
      const currentPage = data.page || page;
      const hasMore = data.total != null
        ? currentPage * pageLimit < data.total
        : itemsCount >= pageLimit;
      return sendJson(res, 200, {
        meta: {
          brandId,
          path: `علامة: ${brandName}`,
          pathEn: `Brand: ${brandName}`,
          name: brandName,
          nameEn: brand?.nameEn || brandName,
          totalCount: data.total ?? null,
        },
        products,
        page: currentPage,
        limit: pageLimit,
        hasMore,
      });
    }

    const catMatch = url.pathname.match(/^\/api\/faces\/categories\/([^/]+)\/products$/);
    if (catMatch) {
      const categoryId = decodeURIComponent(catMatch[1]);
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';

      const data = await fetchFacesCategoryProducts(categoryId, { page, limit, sort });
      const { all } = await getFacesCategoryTree();
      const cat = all.find((c) => String(c.id) === String(categoryId));

      let products = (data.items || []).map((p) =>
        normalizeFacesProductSummary(p, {
          path: cat?.path,
          pathEn: cat?.pathEn,
          name: cat?.name,
          nameEn: cat?.nameEn,
        })
      );
      if (sort !== 'default') {
        products = sortFacesProductsClient(products, sort);
      }

      const itemsCount = (data.items || []).length;
      const currentPage = data.page || page;
      const pageLimit = data.pageSize || limit;
      const hasMore = data.total != null
        ? currentPage * pageLimit < data.total
        : itemsCount >= pageLimit;
      return sendJson(res, 200, {
        meta: {
          categoryId,
          path: cat?.path || categoryId,
          pathEn: cat?.pathEn || '',
          name: cat?.name || '',
          nameEn: cat?.nameEn || '',
          totalCount: data.total ?? null,
        },
        products,
        page: currentPage,
        limit: pageLimit,
        hasMore,
      });
    }

    if (url.pathname === '/api/faces/search') {
      const query = q.q || q.search || '';
      if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const data = await searchFacesProductsIncludingBarcode(query, page, limit);
      let products = (data.items || []).map((p) =>
        normalizeFacesProductSummary(p, { path: `بحث: ${query}`, pathEn: `Search: ${query}` })
      );
      if (sort !== 'default') {
        products = sortFacesProductsClient(products, sort);
      }
      const itemsCount = (data.items || []).length;
      const currentPage = data.page || page;
      const pageLimit = data.pageSize || limit;
      const hasMore = data.total != null
        ? currentPage * pageLimit < data.total
        : itemsCount >= pageLimit;
      return sendJson(res, 200, {
        meta: { query, path: `بحث: ${query}`, pathEn: `Search: ${query}`, totalCount: data.total ?? null },
        products,
        page: currentPage,
        limit: pageLimit,
        hasMore,
      });
    }

    const productMatch = url.pathname.match(/^\/api\/faces\/products\/([^/]+)$/);
    if (productMatch) {
      const key = decodeURIComponent(productMatch[1]);
      const detail = await fetchFacesProductById(key);
      if (!detail?.id) return sendJson(res, 404, { error: 'Product not found' });
      const normalized = normalizeFacesProductDetail(detail);
      return sendJson(res, 200, { product: normalized });
    }

    return sendJson(res, 404, { error: 'Unknown Faces API route' });
  } catch (err) {
    console.error('Faces API error:', err.message);
    return sendJson(res, 502, { error: err.message });
  }
}

function getAmazonCategoryTree() {
  return buildAmazonCategoryTree();
}

async function handleAmazonApi(req, res, url) {
  try {
    const q = parseQuery(url);

    if (url.pathname === '/api/amazon/health') {
      return sendJson(res, 200, {
        ok: true,
        source: 'amazon.com / amazon.sa',
        scope: 'cosmetics-node-3760911',
        bilingual: true,
      });
    }

    if (url.pathname === '/api/amazon/img') {
      const raw = q.u || q.url || '';
      let imgUrl = decodeURIComponent(raw).replace(/&amp;/g, '&');
      if (
        !imgUrl.startsWith('https://m.media-amazon.com/') &&
        !imgUrl.startsWith('https://images-na.ssl-images-amazon.com/')
      ) {
        return sendJson(res, 400, { error: 'Invalid image URL' });
      }
      const imgRes = await fetch(imgUrl, {
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          Referer: 'https://www.amazon.com/',
          'User-Agent': 'Mozilla/5.0 (compatible; CatalogHub/1.0)',
        },
        redirect: 'follow',
      });
      if (!imgRes.ok) {
        return sendJson(res, imgRes.status, { error: `Image fetch failed: ${imgRes.status}` });
      }
      const ct = imgRes.headers.get('content-type') || 'image/jpeg';
      const buf = Buffer.from(await imgRes.arrayBuffer());
      res.writeHead(200, {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=604800',
      });
      return res.end(buf);
    }

    if (url.pathname === '/api/amazon/categories') {
      const { tree, leaves, all } = getAmazonCategoryTree();
      return sendJson(res, 200, { tree, leaves, all, totalLeaves: leaves.length });
    }

    const catMatch = url.pathname.match(/^\/api\/amazon\/categories\/([^/]+)\/products$/);
    if (catMatch) {
      const categoryId = decodeURIComponent(catMatch[1]);
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const search = q.search || '';
      const { all } = getAmazonCategoryTree();
      const cat = all.find((c) => String(c.id) === String(categoryId) || c.slug === categoryId);
      const data = await fetchAmazonCategoryProducts(categoryId, { page, limit, search });
      let products = (data.items || []).map((p) =>
        normalizeAmazonProductSummary(p, {
          path: cat?.path || categoryId,
          pathEn: cat?.pathEn || '',
          name: cat?.name || '',
          nameEn: cat?.nameEn || '',
        }),
      );
      if (sort !== 'default') products = sortAmazonProductsClient(products, sort);
      const itemsCount = (data.items || []).length;
      return sendJson(res, 200, {
        meta: {
          categoryId,
          path: cat?.path || categoryId,
          pathEn: cat?.pathEn || '',
          name: cat?.name || '',
          nameEn: cat?.nameEn || '',
          totalCount: data.totalCount ?? null,
        },
        products,
        page: data.page || page,
        limit,
        hasMore: data.hasMore ?? itemsCount >= limit,
      });
    }

    if (url.pathname === '/api/amazon/search') {
      const query = q.q || q.search || '';
      if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const data = await searchAmazonProducts(query, page, limit);
      let products = (data.items || []).map((p) =>
        normalizeAmazonProductSummary(p, { path: `بحث: ${query}`, pathEn: `Search: ${query}` }),
      );
      if (sort !== 'default') products = sortAmazonProductsClient(products, sort);
      const itemsCount = (data.items || []).length;
      return sendJson(res, 200, {
        meta: { query, path: `بحث: ${query}`, pathEn: `Search: ${query}` },
        products,
        page: data.page || page,
        limit,
        hasMore: data.hasMore ?? itemsCount >= limit,
      });
    }

    const productMatch = url.pathname.match(/^\/api\/amazon\/products\/([A-Z0-9]{10})$/i);
    if (productMatch) {
      const asin = productMatch[1].toUpperCase();
      const product = await fetchAmazonProductByAsin(asin);
      if (!product?.id) return sendJson(res, 404, { error: 'Product not found' });
      return sendJson(res, 200, { product });
    }

    return sendJson(res, 404, { error: 'Unknown Amazon API route' });
  } catch (err) {
    console.error('Amazon API error:', err.message);
    return sendJson(res, 502, { error: err.message });
  }
}

const APP_PREFIXES = [
  ['/niceone', path.join(VIEWER_ROOT, 'niceone')],
  ['/vanilla', path.join(VIEWER_ROOT, 'vanilla')],
  ['/elryan', path.join(VIEWER_ROOT, 'elryan')],
  ['/miraaya', path.join(VIEWER_ROOT, 'miraaya')],
  ['/faces', path.join(VIEWER_ROOT, 'faces')],
  ['/amazon', path.join(VIEWER_ROOT, 'amazon')],
  ['/miswag', path.join(VIEWER_ROOT, 'miswag')],
  ['/orisdi', path.join(VIEWER_ROOT, 'orisdi')],
  ['/beautyway', path.join(VIEWER_ROOT, 'beautyway')],
  ['/vaneersa', path.join(VIEWER_ROOT, 'vaneersa')],
  ['/najd', path.join(VIEWER_ROOT, 'najd')],
];

function serveStatic(req, res, urlPath) {
  let root = VIEWER_ROOT;
  let relative = urlPath;

  for (const [prefix, dir] of APP_PREFIXES) {
    if (urlPath === prefix || urlPath.startsWith(`${prefix}/`)) {
      root = dir;
      relative = urlPath.slice(prefix.length) || '/';
      break;
    }
  }

  if (relative === '/') relative = '/index.html';
  const file = path.join(root, relative);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end('Not found');
  }
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname.startsWith('/shared/')) {
    const rel = url.pathname.slice('/shared/'.length) || 'store-ui.css';
    const file = path.join(VIEWER_ROOT, 'shared', rel);
    if (!file.startsWith(path.join(VIEWER_ROOT, 'shared')) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    return fs.createReadStream(file).pipe(res);
  }
  if (url.pathname.startsWith('/api/faces/')) {
    return handleFacesApi(req, res, url);
  }
  if (url.pathname.startsWith('/api/amazon/')) {
    return handleAmazonApi(req, res, url);
  }
  if (url.pathname === '/api/import/search/stream') {
    try {
      const q = parseQuery(url);
      const query = q.q || q.barcode || '';
      const store = q.store || '';
      const stores = store ? store.split(',').map((s) => s.trim()).filter(Boolean) : null;
      let hintHits = [];
      if (q.hints) {
        try {
          hintHits = JSON.parse(decodeURIComponent(q.hints));
        } catch {
          hintHits = [];
        }
      }
      startSseResponse(res);
      await searchImportByBarcodeStream(query, (event) => {
        sendSseEvent(res, event.type, event);
      }, { stores, hintHits });
      res.end();
    } catch (err) {
      console.error('Import search stream error:', err.message);
      if (!res.headersSent) {
        return sendJson(res, 502, { error: err.message });
      }
      sendSseEvent(res, 'error', { error: err.message });
      res.end();
    }
    return;
  }
  if (url.pathname === '/api/import/search') {
    try {
      const q = parseQuery(url);
      const query = q.q || q.barcode || '';
      const fast = q.fast === '1' || q.fast === 'true';
      const store = q.store || '';
      const stores = store ? store.split(',').map((s) => s.trim()).filter(Boolean) : null;
      let hintHits = [];
      if (q.hints) {
        try {
          hintHits = JSON.parse(decodeURIComponent(q.hints));
        } catch {
          hintHits = [];
        }
      }
      const data = await searchImportByBarcode(query, { fast, stores, hintHits });
      if (data.error) return sendJson(res, 400, data);
      return sendJson(res, 200, data);
    } catch (err) {
      console.error('Import search error:', err.message);
      return sendJson(res, 502, { error: err.message });
    }
  }
  if (url.pathname === '/api/import/product') {
    try {
      const q = parseQuery(url);
      const store = q.store || '';
      const sourceId = q.id || q.sourceId || '';
      const hubOrigin = q.hubOrigin || `http://${req.headers.host || `localhost:${PORT}`}`;
      const barcode = q.barcode || '';
      const data = await fetchImportProduct(store, sourceId, { hubOrigin, barcode });
      if (data.error) return sendJson(res, 404, data);
      return sendJson(res, 200, data);
    } catch (err) {
      console.error('Import product error:', err.message);
      return sendJson(res, 502, { error: err.message });
    }
  }
  if (url.pathname === '/api/import/summary') {
    try {
      const q = parseQuery(url);
      const store = q.store || '';
      const sourceId = q.id || q.sourceId || '';
      const hubOrigin = q.hubOrigin || `http://${req.headers.host || `localhost:${PORT}`}`;
      const barcode = q.barcode || '';
      const data = await fetchImportSummary(store, sourceId, { hubOrigin, barcode });
      if (data.error) return sendJson(res, 404, data);
      return sendJson(res, 200, data);
    } catch (err) {
      console.error('Import summary error:', err.message);
      return sendJson(res, 502, { error: err.message });
    }
  }
  if (url.pathname === '/api/search/barcode/stream') {
    try {
      const q = parseQuery(url);
      const query = q.q || q.barcode || '';
      startSseResponse(res);
      await searchBarcodeAllStoresStreaming(query, (event) => {
        sendSseEvent(res, event.type, event);
      });
      res.end();
    } catch (err) {
      console.error('Barcode search stream error:', err.message);
      if (!res.headersSent) {
        return sendJson(res, 502, { error: err.message });
      }
      sendSseEvent(res, 'error', { error: err.message });
      res.end();
    }
    return;
  }
  if (url.pathname === '/api/search/barcode') {
    try {
      const q = parseQuery(url);
      const query = q.q || q.barcode || '';
      const data = await searchBarcodeAllStores(query);
      if (data.error) return sendJson(res, 400, data);
      return sendJson(res, 200, data);
    } catch (err) {
      console.error('Barcode search error:', err.message);
      return sendJson(res, 502, { error: err.message });
    }
  }
  if (url.pathname.startsWith('/api/miraaya/')) {
    return handleMiraayaApi(req, res, url);
  }
  if (url.pathname.startsWith('/api/elryan/')) {
    return handleElryanApi(req, res, url);
  }
  if (url.pathname.startsWith('/api/vanilla/')) {
    return handleVanillaApi(req, res, url);
  }
  if (url.pathname.startsWith('/api/miswag/')) {
    return handleMiswagApi(req, res, url);
  }
  if (url.pathname.startsWith('/api/orisdi/')) {
    return handleOrisdiApi(req, res, url);
  }
  if (url.pathname.startsWith('/api/beautyway/')) {
    return handleBeautywayApi(req, res, url);
  }
  if (url.pathname.startsWith('/api/vaneersa/')) {
    return handleVaneersaApi(req, res, url);
  }
  if (url.pathname.startsWith('/api/najd/')) {
    return handleNajdApi(req, res, url);
  }
  if (url.pathname.startsWith('/api/')) {
    return handleApi(req, res, url);
  }
  serveStatic(req, res, decodeURIComponent(url.pathname));
});

loadFacesCategoryDiskCache();
warmupBarcodeSearch();
warmupOrisdiFeed();

server.listen(PORT, HOST, () => {
  console.log(`Catalog Hub: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`  Nice One  → /niceone/  (api.niceonesa.com)`);
  console.log(`  Vanilla     → /vanilla/  (vanillacosmetics.com)`);
  console.log(`  Elryan      → /elryan/   (elryan.com — عطور وتجميل · AR+EN)`);
  console.log(`  Miraaya     → /miraaya/  (miraaya.com)`);
  console.log(`  Faces       → /faces/    (faces.ae — الإمارات)`);
  console.log(`  Amazon      → /amazon/   (amazon.com/sa — Cosmetics node 3760911 · AR+EN)`);
  console.log(`  Miswag      → /miswag/   (miswag.com — الجمال والعناية · AR+EN)`);
  console.log(`  Orisdi      → /orisdi/   (orisdi.com — أورزدي · مكياج وعطور · AR+EN)`);
  console.log(`  Beauty Way  → /beautyway/ (beautyway-iq.com — بيوتي وي · عطور وتجميل · AR+EN)`);
  console.log(`  Vaneersa    → /vaneersa/  (vaneersa.com — ڤانير · عناية ومكياج · AR+EN)`);
  console.log(`  Najd        → /najd/      (najdalatheyah.com — نجد العذية · عطور · Salla)`);
  if (facesCategoryCache.tree?.length) {
    console.log(`  Faces cache: ${facesCategoryCache.leaves?.length || 0} تصنيف جاهز من القرص`);
  } else {
    getFacesCategoryTree().catch((err) => console.warn('Faces warmup:', err.message));
  }
});
