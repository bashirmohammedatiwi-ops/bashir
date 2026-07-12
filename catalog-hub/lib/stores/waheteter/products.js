import { cacheGet, cacheSet } from '../../core/cache.js';
import {
  DEFAULT_TTL,
  DETAIL_TTL,
  fetchHtml,
  searchHtmlUrl,
  waheteterFetch,
} from './client.js';
import {
  findWaheteterBarcode,
  getWaheteterProductSnapshot,
  isWaheteterIndexFresh,
  rememberWaheteterDetail,
  searchWaheteterProducts,
  upsertWaheteterProduct,
  waheteterBarcodeIndexStats,
} from './barcode-index.js';
import { htmlSearchHasBarcode, parseProductPageHtml, parseSearchHtml } from './html.js';
import { mapDetailProduct, mapListProduct, toBarcodeHit } from './map.js';

function pageResult(items, { page, limit, total = 0 } = {}) {
  const safeTotal = total || items.length;
  return {
    items: items.slice(0, limit),
    page,
    pageSize: limit,
    total: safeTotal,
    hasMore: page * limit < safeTotal,
  };
}

function parsePrice(price = '') {
  const n = Number(String(price).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function decodeSlug(slug = '') {
  const raw = String(slug || '').trim();
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function mapHtmlListItem(item = {}) {
  return {
    id: String(item.id || ''),
    nameAr: item.nameAr || '',
    nameEn: item.nameEn || '',
    brandAr: '',
    brandEn: '',
    thumb: item.thumb || '',
    price: item.price || '',
    shadeCount: item.shadeCount || 1,
    hasOptions: item.hasOptions || false,
    category: '',
    sku: String(item.id || ''),
    barcode: '',
    productUrl: item.productUrl || '',
    inStock: item.inStock !== false,
  };
}

function mapHtmlDetail(item = {}) {
  return {
    id: String(item.id || ''),
    nameAr: item.nameAr || '',
    nameEn: item.nameEn || '',
    brandAr: item.brandAr || '',
    brandEn: item.brandEn || '',
    descriptionAr: item.descriptionAr || '',
    descriptionEn: item.descriptionEn || '',
    thumb: item.thumb || '',
    price: item.price || '',
    images: item.images || [],
    barcode: item.barcode || '',
    shades: item.shades || [],
    shadeCount: item.shadeCount || 1,
    hasOptions: item.hasOptions || false,
    productUrl: item.productUrl || '',
    inStock: item.inStock !== false,
    category: item.category || '',
    sku: String(item.id || ''),
    manufacturer: item.brandAr || '',
    manufacturerEn: item.brandEn || '',
  };
}

function barcodeHitFromIndex(digits, hit) {
  const detail = getWaheteterProductSnapshot(hit.productId);
  if (!detail) return null;
  const shade = (detail.shades || []).find((s) => String(s.barcode || '') === digits);
  return toBarcodeHit(detail, digits, {
    shadeName: shade?.nameAr || shade?.nameEn || hit.shadeName || '',
  });
}

async function searchHtmlProducts(query, { page = 1, limit = 30 } = {}) {
  const q = String(query || '').trim();
  const cacheKey = `waheteter:html-search:${q}:${page}:${limit}`;
  const cached = cacheGet(cacheKey, DEFAULT_TTL);
  if (cached) return cached;

  const htmlUrl = page > 1 ? `${searchHtmlUrl(q)}&paged=${page}` : searchHtmlUrl(q);
  const html = await fetchHtml(htmlUrl, {
    ttl: DEFAULT_TTL,
    cacheKey: `waheteter:html:${q}:${page}`,
  });
  const rows = parseSearchHtml(html).map(mapHtmlListItem);
  const out = { items: rows, total: rows.length, page, pageSize: limit };
  cacheSet(cacheKey, out, DEFAULT_TTL);
  return out;
}

async function fetchProductPage({ page = 1, limit = 30, categoryId = '', search = '', sku = '' } = {}) {
  const perPage = Math.min(Math.max(limit, 1), 100);
  const params = { page, per_page: perPage };
  if (categoryId) params.category = categoryId;
  if (search) params.search = search;
  if (sku) params.sku = sku;

  const cacheKey = `waheteter:products:${JSON.stringify(params)}`;
  const cached = cacheGet(cacheKey, DEFAULT_TTL);
  if (cached) return cached;

  try {
    const { data, meta } = await waheteterFetch('/products', {
      params,
      ttl: DEFAULT_TTL,
      cacheKey: `waheteter:raw:${cacheKey}`,
    });
    const rows = Array.isArray(data) ? data : [];
    const out = {
      items: rows.map(mapListProduct),
      total: meta.total || rows.length,
      page: Number(page),
      pageSize: perPage,
    };
    cacheSet(cacheKey, out, DEFAULT_TTL);
    return out;
  } catch {
    if (sku) {
      const hit = findWaheteterBarcode(sku);
      if (hit) {
        const mapped = barcodeHitFromIndex(sku, hit);
        const out = {
          items: mapped ? [{
            id: mapped.id,
            nameAr: mapped.nameAr,
            nameEn: mapped.nameEn,
            brandAr: mapped.brandAr,
            brandEn: mapped.brandEn,
            thumb: mapped.thumb,
            price: mapped.price,
            shadeCount: mapped.shadeCount,
            hasOptions: mapped.hasOptions,
            category: '',
            sku,
            barcode: sku,
            productUrl: '',
            inStock: true,
          }] : [],
          total: mapped ? 1 : 0,
          page: 1,
          pageSize: perPage,
        };
        cacheSet(cacheKey, out, DEFAULT_TTL);
        return out;
      }
    }
    if (search && isWaheteterIndexFresh()) {
      const rows = searchWaheteterProducts(search, { limit: perPage }).map((p) => ({
        id: p.id,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        brandAr: p.brandAr,
        brandEn: p.brandEn,
        thumb: p.thumb,
        price: p.price,
        shadeCount: p.shadeCount,
        hasOptions: p.hasOptions,
        category: p.category,
        sku: p.sku,
        barcode: p.barcode,
        productUrl: p.productUrl,
        inStock: p.inStock !== false,
      }));
      const out = { items: rows, total: rows.length, page, pageSize: perPage };
      cacheSet(cacheKey, out, DEFAULT_TTL);
      return out;
    }
    if (search) {
      try {
        const htmlOut = await searchHtmlProducts(search, { page, limit: perPage });
        cacheSet(cacheKey, htmlOut, DEFAULT_TTL);
        return htmlOut;
      } catch {
        return { items: [], total: 0, page, pageSize: perPage };
      }
    }
    return { items: [], total: 0, page, pageSize: perPage };
  }
}

async function fetchVariationRows(product = {}) {
  const stubs = Array.isArray(product.variations) ? product.variations : [];
  if (!stubs.length) return product.type === 'simple' ? [product] : [];

  const rows = await Promise.all(stubs.map(async (stub) => {
    const vid = String(stub?.id || '').trim();
    if (!vid) return null;
    try {
      const { data } = await waheteterFetch(`/products/${encodeURIComponent(vid)}`, {
        ttl: DETAIL_TTL,
        cacheKey: `waheteter:var:${vid}`,
      });
      return data?.id ? data : null;
    } catch {
      return null;
    }
  }));
  return rows.filter(Boolean);
}

async function fetchProductDetailHtml(id, { slug = '' } = {}) {
  const pid = String(id || '').trim();
  const productSlug = decodeSlug(slug);
  const path = productSlug
    ? `/product/${encodeURIComponent(productSlug)}/`
    : (pid ? `/?p=${encodeURIComponent(pid)}` : '');
  if (!path) return null;

  const html = await fetchHtml(path, {
    ttl: DETAIL_TTL,
    cacheKey: `waheteter:html-detail:${productSlug || pid}`,
  });
  const parsed = parseProductPageHtml(html, { slug: productSlug, id: pid });
  return parsed?.id ? mapHtmlDetail(parsed) : null;
}

export async function listCategoryProducts(categoryId, { page = 1, limit = 30 } = {}) {
  const category = String(categoryId || '').trim();
  const { items, total, pageSize } = await fetchProductPage({
    page,
    limit,
    categoryId: category && category !== 'root' ? category : '',
  });
  return pageResult(items, { page, limit: pageSize, total });
}

export async function searchProducts(query, { page = 1, limit = 30 } = {}) {
  const q = String(query || '').trim();
  const { items, total, pageSize } = await fetchProductPage({ page, limit, search: q });
  return pageResult(items, { page, limit: pageSize, total });
}

export async function fetchProductDetail(id, { light = false, slug = '' } = {}) {
  const pid = String(id || '').trim();
  if (!pid) return null;

  const cacheKey = `waheteter:detail:${pid}:${light ? 'light' : 'full'}`;
  const cached = cacheGet(cacheKey, DETAIL_TTL);
  if (cached) return cached;

  const indexed = getWaheteterProductSnapshot(pid);
  if (indexed) {
    cacheSet(cacheKey, indexed, DETAIL_TTL);
    return indexed;
  }

  let product;
  try {
    const { data } = await waheteterFetch(`/products/${encodeURIComponent(pid)}`, {
      ttl: DETAIL_TTL,
      cacheKey: `waheteter:raw:detail:${pid}`,
    });
    product = data;
  } catch {
    const htmlDetail = await fetchProductDetailHtml(pid, { slug }).catch(() => null);
    if (htmlDetail) {
      upsertWaheteterProduct(pid, htmlDetail);
      cacheSet(cacheKey, htmlDetail, DETAIL_TTL);
      return htmlDetail;
    }
    return null;
  }
  if (!product?.id) return null;

  if (product.type === 'variation' && product.parent) {
    return fetchProductDetail(String(product.parent), { light });
  }

  const variationRows = light ? [] : await fetchVariationRows(product);
  const mapped = mapDetailProduct(product, variationRows, { light });
  rememberWaheteterDetail(mapped);
  cacheSet(cacheKey, mapped, DETAIL_TTL);
  return mapped;
}

export async function searchBarcode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (digits.length < 8) return [];

  const indexHit = findWaheteterBarcode(digits);
  if (indexHit) {
    const hit = barcodeHitFromIndex(digits, indexHit);
    if (hit) return [hit];
  }

  let rows = [];
  try {
    const { data } = await waheteterFetch('/products', {
      params: { sku: digits, per_page: 5 },
      ttl: DEFAULT_TTL,
      cacheKey: `waheteter:sku:${digits}`,
    });
    rows = Array.isArray(data) ? data : [];
  } catch {
    rows = [];
  }

  if (!rows.length) {
    try {
      const html = await fetchHtml(searchHtmlUrl(digits), {
        ttl: DEFAULT_TTL,
        cacheKey: `waheteter:html-barcode:${digits}`,
      });
      if (htmlSearchHasBarcode(html, digits)) {
        const cards = parseSearchHtml(html);
        for (const card of cards.slice(0, 5)) {
          const slug = decodeSlug(card.slug);
          const detailHtml = await fetchHtml(`/product/${encodeURIComponent(slug)}/`, {
            ttl: DETAIL_TTL,
            cacheKey: `waheteter:html-product:${slug}`,
          });
          const parsed = parseProductPageHtml(detailHtml, { slug, id: card.id });
          const shade = (parsed.shades || []).find((s) => String(s.barcode || '') === digits);
          if (shade) {
            const detail = mapHtmlDetail(parsed);
            rememberWaheteterDetail(detail);
            return [toBarcodeHit(detail, digits, { shadeName: shade.nameAr || shade.nameEn || '' })];
          }
        }
      }
    } catch {
      // VPS may block HTML — rely on local index
    }
    return [];
  }

  const row = rows[0];
  const parentId = Number(row.parent || 0) > 0 ? String(row.parent) : String(row.id);
  const detail = await fetchProductDetail(parentId);
  if (!detail) {
    return [toBarcodeHit(mapListProduct(row), digits, { shadeName: variationLabel(row) })];
  }

  const shade = (detail.shades || []).find((s) => String(s.barcode || '') === digits);
  return [toBarcodeHit(detail, digits, {
    shadeName: shade?.nameAr || shade?.nameEn || row.variation || '',
  })];
}

function variationLabel(row = {}) {
  const attrs = row.attributes || [];
  if (attrs.length) {
    return attrs.map((a) => String(a.value || a.name || '').trim()).filter(Boolean).join(' · ');
  }
  return String(row.variation || '').trim();
}

export async function countProducts() {
  const stats = waheteterBarcodeIndexStats();
  if (stats.products > 0) return stats.productCount || stats.products;

  try {
    const { meta } = await waheteterFetch('/products', {
      params: { per_page: 1, page: 1 },
      ttl: DEFAULT_TTL,
      cacheKey: 'waheteter:products:count',
    });
    if (meta.total) return meta.total;
  } catch {
    // fall through
  }

  try {
    const html = await fetchHtml('/shop/', { ttl: DEFAULT_TTL, cacheKey: 'waheteter:html-shop' });
    const cards = parseSearchHtml(html);
    if (cards.length) return cards.length;
  } catch {
    // blocked
  }

  return stats.barcodes || 0;
}

export function sortProductsClient(items = [], sort = 'default') {
  const list = [...items];
  if (sort === 'price_asc') {
    list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  } else if (sort === 'price_desc') {
    list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
  } else if (sort === 'name') {
    list.sort((a, b) => (a.nameAr || a.nameEn || '').localeCompare(b.nameAr || b.nameEn || '', 'ar'));
  }
  return list;
}

export { waheteterBarcodeIndexStats };
