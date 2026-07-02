import {
  fetchHomeCategories,
  buildBilingualCategoryTree,
  fetchCategoryProducts,
  fetchProductDetail,
  searchProducts,
  normalizeProductSummary,
  normalizeProductDetail,
  extractBarcode,
  fetchManufacturersCatalog,
  fetchManufacturerProducts,
  mapClientSort,
  sortProductsClient,
} from '../../api.js';
import {
  enrichShadesDeep,
  enrichShadesFromDatabase,
  enrichShadesLookup,
  saveProductToIndex,
  resolveProductBarcodesBatch,
  shadeStats,
  getBarcodeCacheStats,
} from '../../barcodes.js';
import { CACHE_MS, sendJson, parseQuery, readBody } from '../http.js';

let categoryCache = { tree: null, leaves: null, fetchedAt: 0 };
let niceoneBrandsCache = { brands: null, fetchedAt: 0 };

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

export async function handleNiceoneApi(req, res, url) {
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
