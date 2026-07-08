import { cacheGet, cacheSet } from '../../core/cache.js';
import { splitBilingualText } from '../../core/bilingual.js';
import { absImage, DEFAULT_TTL, formatSallaPrice } from './client.js';

function stripHtml(html = '') {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function productImage(product = {}) {
  if (product.image && typeof product.image === 'object') return absImage(product.image.url);
  return absImage(product.image || product.original_image || product.thumbnail);
}

function productImages(product = {}) {
  const images = [
    productImage(product),
    absImage(product.original_image),
  ].filter(Boolean);
  return [...new Set(images)];
}

function mapListProduct(product = {}) {
  const { ar, en } = splitBilingualText(product.name, { mode: 'name' });
  const brand = String(product.brand?.name || '').trim();
  const sku = String(product.sku || '').trim();
  const barcode = String(product.gtin || sku || '').replace(/\D/g, '');

  return {
    id: String(product.id || ''),
    nameAr: ar || en || String(product.name || '').trim(),
    nameEn: en,
    brandAr: brand,
    brandEn: brand,
    thumb: productImage(product),
    price: formatSallaPrice(product),
    shadeCount: product.has_options ? 2 : 1,
    hasOptions: !!product.has_options,
    category: String(product.category?.name || '').trim(),
    sku,
    barcode,
    productUrl: String(product.url || '').trim(),
    inStock: product.is_out_of_stock !== true && product.is_available !== false,
  };
}

function mapDetailProduct(product = {}, { light = false } = {}) {
  const base = mapListProduct(product);
  if (light) return base;

  const description = stripHtml(product.description || '');
  const { ar: descAr, en: descEn } = splitBilingualText(description, { mode: 'description' });
  const images = productImages(product);
  const barcode = String(product.gtin || product.sku || '').replace(/\D/g, '');

  const shades = [{
    id: '0',
    nameAr: base.nameAr,
    nameEn: base.nameEn,
    sku: base.sku || base.id,
    barcode,
    image: images[0] || '',
    price: base.price,
    inStock: base.inStock,
    optionGroup: '',
  }];

  return {
    ...base,
    descriptionAr: descAr || description,
    descriptionEn: descEn,
    images,
    barcode,
    shades,
    shadeCount: shades.length,
    manufacturer: base.brandAr,
    manufacturerEn: base.brandEn,
  };
}

export function createSallaProductsApi(client) {
  const { sallaFetch, cachePrefix } = client;

  async function fetchProducts(params = {}) {
    return sallaFetch('/products', { params, ttl: DEFAULT_TTL });
  }

  async function listCategoryProducts(categoryId, { page = 1, limit = 30 } = {}) {
    const { data = [], cursor } = await fetchProducts({
      category_id: categoryId,
      page,
      per_page: Math.min(limit, 60),
    });

    return {
      items: data.map(mapListProduct),
      page,
      pageSize: limit,
      total: data.length,
      hasMore: Boolean(cursor?.next) || data.length >= limit,
    };
  }

  async function searchProducts(query, { page = 1, limit = 30, categoryId = '' } = {}) {
    const params = {
      keyword: String(query || '').trim(),
      page,
      per_page: Math.min(limit, 60),
    };
    if (categoryId) params.category_id = categoryId;

    const { data = [], cursor } = await fetchProducts(params);
    return {
      items: data.map(mapListProduct),
      page,
      pageSize: limit,
      total: data.length,
      hasMore: Boolean(cursor?.next) || data.length >= limit,
    };
  }

  async function fetchProductDetail(id, { light = false } = {}) {
    const pid = String(id || '').trim();
    if (!pid) return null;

    const cacheKey = `${cachePrefix}:product:${pid}:${light ? 'light' : 'full'}`;
    const cached = cacheGet(cacheKey, DEFAULT_TTL);
    if (cached) return cached;

    const { data = [] } = await sallaFetch('/products', { params: { 'ids[]': pid } });
    const product = data.find((item) => String(item.id) === pid) || data[0];
    if (!product?.id) return null;

    const mapped = mapDetailProduct(product, { light });
    cacheSet(cacheKey, mapped);
    return mapped;
  }

  async function searchBarcode(code) {
    const digits = String(code || '').replace(/\D/g, '');
    if (digits.length < 8) return [];

    const { data = [] } = await fetchProducts({ keyword: digits, page: 1, per_page: 30 });
    const exact = data.filter((product) => {
      const sku = String(product.sku || '').replace(/\D/g, '');
      const gtin = String(product.gtin || '').replace(/\D/g, '');
      return sku === digits || gtin === digits;
    });

    const hits = (exact.length ? exact : data.slice(0, 8)).map((product) => {
      const item = mapListProduct(product);
      return {
        ...item,
        barcode: digits,
        matchType: exact.includes(product) ? 'sku' : 'keyword',
      };
    });

    return hits;
  }

  function sortProductsClient(items = [], sort = 'default') {
    const list = [...items];
    if (sort === 'price_asc') {
      list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sort === 'price_desc') {
      list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    } else if (sort === 'name') {
      list.sort((a, b) => (a.nameAr || '').localeCompare(b.nameAr || '', 'ar'));
    }
    return list;
  }

  return {
    listCategoryProducts,
    searchProducts,
    fetchProductDetail,
    searchBarcode,
    sortProductsClient,
  };
}

function parsePrice(price = '') {
  const n = Number(String(price).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
