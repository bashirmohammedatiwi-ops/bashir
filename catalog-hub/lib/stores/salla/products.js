import { cacheGet, cacheSet } from '../../core/cache.js';
import { splitBilingualText } from '../../core/bilingual.js';
import { absImage, DEFAULT_TTL, formatSallaPrice } from './client.js';

function stripHtml(html = '') {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** إزالة التطويل العربي (ـ) والمسافات الزائدة للمقارنة */
function normalizeArabic(text = '') {
  return String(text || '')
    .replace(/ـ/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function productImage(product = {}) {
  if (product.image && typeof product.image === 'object') return absImage(product.image.url);
  return absImage(product.image || product.image_url || product.original_image || product.thumbnail);
}

function productImages(product = {}) {
  const images = [
    productImage(product),
    absImage(product.original_image),
  ].filter(Boolean);
  return [...new Set(images)];
}

/** استخراج المعرّف الرقمي من رابط المنتج (.../p1082984279) */
function extractNumericIdFromUrl(url = '') {
  const m = String(url || '').match(/\/p(\d{5,})(?:\/|$|\?|#)/i);
  return m?.[1] || '';
}

function resolveProductId(product = {}) {
  const raw = String(product.id || '').trim();
  if (/^\d{5,}$/.test(raw)) return raw;
  const fromUrl = extractNumericIdFromUrl(product.url);
  if (fromUrl) return fromUrl;
  return raw;
}

function mapListProduct(product = {}) {
  const { ar, en } = splitBilingualText(product.name, { mode: 'name' });
  const brand = String(product.brand?.name || '').trim();
  const sku = String(product.sku || '').trim();
  const barcode = String(product.gtin || sku || '').replace(/\D/g, '');
  const id = resolveProductId(product);

  // نتائج /products/search تعيد price كنص رقمي بدون عملة
  let price = formatSallaPrice(product);
  if (!price && product.price != null && product.price !== '') {
    const n = Number(product.price);
    price = Number.isFinite(n)
      ? `${n.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ر.س`
      : String(product.price);
  }

  return {
    id,
    slug: String(product.id || id),
    nameAr: ar || en || String(product.name || '').trim(),
    nameEn: en,
    brandAr: brand,
    brandEn: brand,
    thumb: productImage(product),
    price,
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

/** اسم قسم Salla غالباً «شانيل_Chanel» أو «ميسوني-Missoni» — استخرج أفضل كلمة بحث */
export function categorySearchQuery(name = '') {
  const raw = normalizeArabic(name);
  if (!raw) return '';
  if (/^جميع\s*المنتجات$/i.test(raw) || /^all\s*products$/i.test(raw)) return '';

  const parts = String(name || '').split(/[-_–—|/]+/).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return raw;
  const latin = parts.find((p) => /[A-Za-z]{2,}/.test(p));
  if (latin) return latin.replace(/[^\w\s&.]/g, ' ').replace(/\s+/g, ' ').trim();
  return normalizeArabic(parts[0]);
}

function parseCursorToken(nextUrl = '') {
  try {
    const u = new URL(String(nextUrl));
    return {
      cursor: u.searchParams.get('cursor') || '',
      page: Number(u.searchParams.get('page')) || undefined,
    };
  } catch {
    return { cursor: '', page: undefined };
  }
}

function digitsEqual(a, b) {
  const x = String(a || '').replace(/\D/g, '');
  const y = String(b || '').replace(/\D/g, '');
  return x.length >= 8 && x === y;
}

export function createSallaProductsApi(client) {
  const { sallaFetch, cachePrefix } = client;

  /** البحث الحقيقي في واجهة المتجر العامة — /products يتجاهل keyword */
  async function searchStore(query, { page = 1, limit = 30, categoryId = '' } = {}) {
    const q = String(query || '').trim();
    if (!q) return { data: [], hasMore: false };

    const params = {
      query: q,
      page,
      per_page: Math.min(limit, 60),
    };
    if (categoryId) params.category = categoryId;

    const res = await sallaFetch('/products/search', { params, ttl: DEFAULT_TTL });
    const data = Array.isArray(res.data) ? res.data : [];
    return {
      data,
      hasMore: data.length >= Math.min(limit, 60),
      total: data.length,
    };
  }

  /** قائمة عامة مع ترقيم cursor (لا تدعم فلترة قسم/كلمة) */
  async function listAllProducts({ page = 1, limit = 30, cursor = '' } = {}) {
    const params = { per_page: Math.min(limit, 60), page };
    if (cursor) params.cursor = cursor;

    const res = await sallaFetch('/products', { params, ttl: DEFAULT_TTL });
    const data = Array.isArray(res.data) ? res.data : [];
    const next = parseCursorToken(res.cursor?.next || '');
    return {
      data,
      hasMore: Boolean(res.cursor?.next) || data.length >= Math.min(limit, 60),
      nextCursor: next.cursor,
      nextPage: next.page || page + 1,
      total: data.length,
    };
  }

  async function resolveCategoryName(categoryId) {
    const id = String(categoryId || '').trim();
    if (!id) return '';

    const cacheKey = `${cachePrefix}:catname:${id}`;
    const cached = cacheGet(cacheKey, DEFAULT_TTL * 6);
    if (cached) return cached;

    try {
      const { data } = await sallaFetch(`/products/categories/${encodeURIComponent(id)}`, {
        ttl: DEFAULT_TTL * 6,
      });
      const name = String(data?.name || '').trim();
      if (name) {
        cacheSet(cacheKey, name);
        return name;
      }
    } catch { /* ignore */ }
    return '';
  }

  /** إثراء نتيجة بحث مختصرة بتفاصيل المنتج الكاملة عند الحاجة */
  async function hydrateSearchHit(hit) {
    const mapped = mapListProduct(hit);
    if (mapped.sku || mapped.brandAr) return mapped;

    const slug = String(hit.id || '').trim();
    const numericId = mapped.id;

    try {
      if (slug && !/^\d+$/.test(slug)) {
        const { data } = await sallaFetch(`/products/${encodeURIComponent(slug)}/details`, {
          ttl: DEFAULT_TTL,
        });
        if (data?.id || data?.name) return mapListProduct(data);
      }
    } catch { /* fallback below */ }

    if (numericId && /^\d+$/.test(numericId)) {
      const detail = await fetchProductDetail(numericId, { light: true }).catch(() => null);
      if (detail) return detail;
    }

    return mapped;
  }

  async function listCategoryProducts(categoryId, { page = 1, limit = 30, cursor = '' } = {}) {
    const id = String(categoryId || '').trim();
    const name = await resolveCategoryName(id);
    const query = categorySearchQuery(name);

    // «جميع المنتجات» أو قسم بلا اسم قابل للبحث → قائمة عامة
    if (!query) {
      const listed = await listAllProducts({ page, limit, cursor });
      return {
        items: listed.data.map(mapListProduct),
        page,
        pageSize: limit,
        total: listed.total,
        hasMore: listed.hasMore,
        nextCursor: listed.nextCursor || '',
      };
    }

    // تصفح قسم ماركة: ابحث باسم الماركة (الفلاتر على /products لا تعمل في الـ Store API)
    const searched = await searchStore(query, { page, limit });
    return {
      items: searched.data.map(mapListProduct),
      page,
      pageSize: limit,
      total: searched.total,
      hasMore: searched.hasMore,
      nextCursor: '',
    };
  }

  async function searchProducts(query, { page = 1, limit = 30, categoryId = '' } = {}) {
    const q = String(query || '').trim();
    if (!q) {
      return listCategoryProducts(categoryId || '', { page, limit });
    }

    const searched = await searchStore(q, { page, limit, categoryId });
    return {
      items: searched.data.map(mapListProduct),
      page,
      pageSize: limit,
      total: searched.total,
      hasMore: searched.hasMore,
    };
  }

  async function fetchProductDetail(id, { light = false } = {}) {
    const pid = String(id || '').trim();
    if (!pid) return null;

    const cacheKey = `${cachePrefix}:product:${pid}:${light ? 'light' : 'full'}`;
    const cached = cacheGet(cacheKey, DEFAULT_TTL);
    if (cached) return cached;

    // slug نصي → /products/{slug}/details
    if (pid && !/^\d+$/.test(pid)) {
      try {
        const { data } = await sallaFetch(`/products/${encodeURIComponent(pid)}/details`);
        if (data?.id || data?.name) {
          const mapped = mapDetailProduct(data, { light });
          cacheSet(cacheKey, mapped);
          return mapped;
        }
      } catch { /* جرّب ids[] */ }
    }

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

    // نتيجة واحدة كافية — البحث بالباركود في Salla دقيق، ولا نُبطئ بإثراء 8 منتجات
    const { data = [] } = await searchStore(digits, { page: 1, limit: 5 });
    if (!data.length) return [];

    const first = await hydrateSearchHit(data[0]);
    const exact = digitsEqual(first.sku, digits) || digitsEqual(first.barcode, digits);

    return [{
      ...first,
      barcode: digits,
      matchType: exact ? 'sku' : 'keyword',
    }];
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
