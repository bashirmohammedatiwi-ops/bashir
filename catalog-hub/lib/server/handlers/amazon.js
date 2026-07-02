import {
  buildCategoryTree as buildAmazonCategoryTree,
  fetchCategoryProducts as fetchAmazonCategoryProducts,
  searchProducts as searchAmazonProducts,
  fetchProductByAsin as fetchAmazonProductByAsin,
  normalizeProductSummary as normalizeAmazonProductSummary,
  sortProductsClient as sortAmazonProductsClient,
} from '../../amazon-api.js';
import { sendJson, parseQuery } from '../http.js';

function getAmazonCategoryTree() {
  return buildAmazonCategoryTree();
}

export async function handleAmazonApi(req, res, url) {
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
