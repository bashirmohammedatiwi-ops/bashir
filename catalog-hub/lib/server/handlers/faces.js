import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  fetchCategoryTreeRaw as fetchFacesCategoriesRaw,
  fetchCategoryProducts as fetchFacesCategoryProducts,
  searchProductsIncludingBarcode as searchFacesProductsIncludingBarcode,
  fetchProductById as fetchFacesProductById,
  normalizeProductSummary as normalizeFacesProductSummary,
  normalizeProductDetailFromRaw as normalizeFacesProductDetail,
  sortProductsClient as sortFacesProductsClient,
  fetchBrandsCatalog as fetchFacesBrands,
  fetchBrandProducts as fetchFacesBrandProducts,
  fetchCategoryProductCounts as fetchFacesCategoryCounts,
} from '../../faces-api.js';
import { applyProductCounts } from '../../category-scope.js';
import { CACHE_MS, sendJson, parseQuery } from '../http.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FACES_CAT_CACHE_FILE = path.join(__dirname, '..', '..', '..', 'data', 'faces-category-cache.json');

let facesCategoryCache = { tree: null, leaves: null, all: null, fetchedAt: 0 };
let facesCategoryInflight = null;
let facesBrandsCache = { brands: null, fetchedAt: 0 };

export function loadFacesCategoryDiskCache() {
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

export async function handleFacesApi(req, res, url) {
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
