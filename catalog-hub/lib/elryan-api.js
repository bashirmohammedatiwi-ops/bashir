const SITE = 'https://www.elryan.com';
import { collectDescendantIds, mapPool } from './category-scope.js';

export const BEAUTY_ROOT_ID = 54;
const BEAUTY_PATH = '1/2/54';

const LOCALES = {
  ar: {
    esIndex: 'vue_storefront_magento_ar',
    storePath: 'ar',
    numberLocale: 'ar-IQ',
    currencySuffix: 'د.ع',
    wasLabel: 'كان',
    sortLocale: 'ar',
  },
  en: {
    esIndex: 'vue_storefront_magento_en',
    storePath: 'en',
    numberLocale: 'en-IQ',
    currencySuffix: 'IQD',
    wasLabel: 'was',
    sortLocale: 'en',
  },
};

const PRODUCT_LIST_SOURCE = [
  'id', 'name', 'sku', 'barcode', 'type_id', 'price', 'iqd_price', 'final_price',
  'special_price', 'original_price', 'image', 'small_image', 'url_path', 'stock',
  'brand', 'brand_details', 'category',
  'configurable_children.id', 'configurable_children.sku', 'configurable_children.barcode',
  'configurable_children.name', 'configurable_children.price', 'configurable_children.iqd_price',
  'configurable_children.image', 'configurable_children.stock', 'configurable_children.perfumes_size',
  'configurable_options',
];

const PRODUCT_DETAIL_SOURCE = [
  ...PRODUCT_LIST_SOURCE,
  'description', 'short_description', 'media_gallery', 'configurable_children',
];

const IMG = `${SITE}/img/400/400/resize/catalog/product`;

export function isBeautyPath(path = '') {
  return path === BEAUTY_PATH || path.startsWith(`${BEAUTY_PATH}/`);
}

export function absImage(path = '') {
  if (!path || path === 'no_selection') return '';
  if (path.startsWith('http')) return path;
  return `${IMG}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function absBrandImage(filename = '') {
  if (!filename) return '';
  return `${SITE}/img/200/200/resize/amasty/shopby/option_images/slider/${filename}`;
}

export function extractBarcode(product = {}) {
  const raw = String(product.barcode ?? '').trim();
  if (/^\d{8,14}$/.test(raw)) return raw;
  const sku = String(product.sku ?? '').split('-')[0].trim();
  if (/^\d{8,14}$/.test(sku)) return sku;
  return raw || '';
}

function createElryanApi(locale = 'ar') {
  const cfg = LOCALES[locale] ?? LOCALES.ar;
  const ES_URL = `${SITE}/api/catalog/${cfg.esIndex}`;

  function formatIqd(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return '';
    const formatted = Math.round(n).toLocaleString(cfg.numberLocale);
    return `${formatted} ${cfg.currencySuffix}`;
  }

  function pickPrice(p = {}) {
    let iqd = p.iqd_price;
    if (!iqd && p.configurable_children?.length) {
      const prices = p.configurable_children.map((c) => c.iqd_price).filter(Boolean);
      if (prices.length) iqd = Math.min(...prices);
    }
    if (iqd) return formatIqd(iqd);
    const special = Number(p.special_price);
    const base = Number(p.final_price ?? p.price);
    if (special > 0 && special < base) {
      return `${formatIqd(special)} (${cfg.wasLabel} ${formatIqd(base)})`;
    }
    return formatIqd(base) || '';
  }

  function pickThumb(p = {}) {
    const img = p.image || p.small_image || p.media_gallery?.[0]?.image;
    return absImage(img);
  }

  async function esSearch(type, body) {
    const res = await fetch(`${ES_URL}/${type}/_search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      const reason =
        (typeof json.error === 'object' && json.error?.reason) ||
        (typeof json.error === 'string' ? json.error : null) ||
        (typeof json.result === 'string' ? json.result : null);
      throw new Error(reason || `El Ryan API ${res.status}`);
    }
    return json;
  }

  /** Elasticsearch يحدّ الإجمالي عند 10000 بدون track_total_hits */
  function parseEsTotal(total) {
    if (total == null) return 0;
    if (typeof total === 'number') return total;
    return total.value ?? 0;
  }

  function withExactTotal(body) {
    return { track_total_hits: true, ...body };
  }

  async function fetchBeautyCategoriesRaw() {
    const data = await esSearch('category', {
      size: 500,
      query: { wildcard: { path: '*54*' } },
      sort: [{ level: 'asc' }, { position: 'asc' }],
      _source: [
        'id', 'name', 'slug', 'url_path', 'parent_id', 'level', 'children_count',
        'path', 'position', 'is_active', 'product_count',
      ],
    });
    return (data.hits?.hits || [])
      .map((h) => h._source)
      .filter((c) => c.is_active !== false && isBeautyPath(c.path));
  }

  function sortClause(sort = 'default') {
    switch (sort) {
      case 'name_asc': return [{ 'name.keyword': 'asc' }];
      case 'name_desc': return [{ 'name.keyword': 'desc' }];
      case 'price_asc': return [{ price: 'asc' }];
      case 'price_desc': return [{ price: 'desc' }];
      default: return [{ number_of_sales: 'desc' }, { _score: 'desc' }];
    }
  }

  function beautyFilter(beautyIds = []) {
    if (!beautyIds.length) return [];
    return [{ terms: { category_ids: beautyIds } }];
  }

  function categoryScopeFilter(scopeIds = [], categoryId) {
    const ids = (scopeIds?.length ? scopeIds : [Number(categoryId)])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));
    if (!ids.length) return [{ term: { category_ids: Number(categoryId) } }];
    return [{ terms: { category_ids: ids } }];
  }

  async function countProductsInScope(scopeIds = [], beautyIds = []) {
    const ids = scopeIds.map((id) => Number(id)).filter((id) => Number.isFinite(id));
    if (!ids.length) return 0;
    const data = await esSearch('product', withExactTotal({
      size: 0,
      query: {
        bool: {
          must: [
            { terms: { category_ids: ids } },
            { term: { status: 1 } },
            ...beautyFilter(beautyIds),
          ],
        },
      },
    }));
    return parseEsTotal(data.hits?.total);
  }

  async function fetchCategoryProductCounts(all = [], beautyIds = []) {
    return mapPool(all, async (node) => {
      const scopeIds = collectDescendantIds(node);
      return countProductsInScope(scopeIds, beautyIds);
    }, 10);
  }

  async function fetchCategoryProducts(categoryId, { page = 1, limit = 30, sort = 'default', beautyIds = [], scopeIds = [] } = {}) {
    const from = (page - 1) * limit;
    const must = [
      ...categoryScopeFilter(scopeIds, categoryId),
      { term: { status: 1 } },
      ...beautyFilter(beautyIds),
    ];
    const data = await esSearch('product', withExactTotal({
      from,
      size: limit,
      query: { bool: { must } },
      sort: sortClause(sort),
      _source: PRODUCT_LIST_SOURCE,
    }));
    return {
      items: (data.hits?.hits || []).map((h) => h._source),
      total: parseEsTotal(data.hits?.total),
      page,
      pageSize: limit,
    };
  }

  async function searchProducts(query, page = 1, limit = 30, beautyIds = []) {
    const from = (page - 1) * limit;
    const data = await esSearch('product', withExactTotal({
      from,
      size: limit,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['name^4', 'sku^3', 'barcode^2', 'brand_details.title^2'],
                fuzziness: 'AUTO',
              },
            },
            { term: { status: 1 } },
            ...beautyFilter(beautyIds),
          ],
        },
      },
      sort: [{ _score: 'desc' }, { number_of_sales: 'desc' }],
      _source: PRODUCT_LIST_SOURCE,
    }));
    return {
      items: (data.hits?.hits || []).map((h) => h._source),
      total: parseEsTotal(data.hits?.total),
      page,
      pageSize: limit,
    };
  }

  async function fetchProductById(id) {
    const data = await esSearch('product', {
      size: 1,
      query: { term: { id: Number(id) } },
      _source: PRODUCT_DETAIL_SOURCE,
    });
    return data.hits?.hits?.[0]?._source || null;
  }

  async function fetchProductBySku(sku) {
    const key = String(sku || '').trim();
    if (!key) return null;
    const data = await esSearch('product', {
      size: 1,
      query: {
        bool: {
          should: [
            { term: { 'sku.keyword': key } },
            { term: { sku: key } },
          ],
          minimum_should_match: 1,
        },
      },
      _source: PRODUCT_DETAIL_SOURCE,
    });
    return data.hits?.hits?.[0]?._source || null;
  }

  async function fetchProductByKey(key) {
    const k = String(key || '').trim();
    if (!k) return null;
    if (/^\d+$/.test(k)) {
      const byId = await fetchProductById(k);
      if (byId?.id) return byId;
    }
    return fetchProductBySku(k);
  }

  function normalizeBrandDoc(doc = {}, productCount = 0) {
    const title = String(doc.title || '').trim();
    if (!title || /^no brand$/i.test(title)) return null;
    return {
      id: String(doc.value || doc.id || ''),
      slug: doc.url_alias || String(doc.value || ''),
      name: title,
      nameEn: title,
      image: absBrandImage(doc.slider_image || doc.image),
      productCount,
      url: doc.url_alias ? `${SITE}/${cfg.storePath}/brands/${doc.url_alias}` : '',
    };
  }

  async function fetchBeautyBrands(beautyIds = []) {
    const aggData = await esSearch('product', {
      size: 0,
      query: {
        bool: {
          must: [
            { term: { status: 1 } },
            { term: { category_ids: BEAUTY_ROOT_ID } },
            ...beautyFilter(beautyIds),
          ],
        },
      },
      aggs: {
        brands: { terms: { field: 'brand', size: 500 } },
      },
    });
    const buckets = aggData.aggregations?.brands?.buckets || [];
    if (!buckets.length) return [];

    const brandValues = buckets.map((b) => String(b.key));
    const countMap = new Map(buckets.map((b) => [String(b.key), b.doc_count]));

    const brandData = await esSearch('brand', {
      size: brandValues.length,
      query: { terms: { value: brandValues } },
      sort: [{ 'title.keyword': 'asc' }],
      _source: ['id', 'title', 'value', 'url_alias', 'image', 'slider_image', 'is_featured'],
    });

    const brands = (brandData.hits?.hits || [])
      .map((h) => normalizeBrandDoc(h._source, countMap.get(String(h._source?.value)) || 0))
      .filter(Boolean);

    brands.sort((a, b) => {
      if (b.productCount !== a.productCount) return b.productCount - a.productCount;
      return a.name.localeCompare(b.name, cfg.sortLocale);
    });
    return brands;
  }

  async function fetchBrandProducts(brandId, { page = 1, limit = 30, sort = 'default', beautyIds = [] } = {}) {
    const from = (page - 1) * limit;
    const must = [
      { term: { brand: Number(brandId) } },
      { term: { status: 1 } },
      ...beautyFilter(beautyIds),
    ];
    const data = await esSearch('product', withExactTotal({
      from,
      size: limit,
      query: { bool: { must } },
      sort: sortClause(sort),
      _source: PRODUCT_LIST_SOURCE,
    }));
    return {
      items: (data.hits?.hits || []).map((h) => h._source),
      total: parseEsTotal(data.hits?.total),
      page,
      pageSize: limit,
    };
  }

  function optionLabel(configurableOptions = [], child = {}) {
    for (const opt of configurableOptions) {
      const code = opt.attribute_code;
      const val = child[code];
      if (val === undefined || val === null) continue;
      const match = (opt.values || []).find((v) => v.value_index === val || v.value === val);
      if (match?.label) return match.label;
    }
    return '';
  }

  function normalizeShade(child, product = {}) {
    const variant = optionLabel(product.configurable_options, child) || child.name || '';
    const name = variant.trim() || String(child.id);
    return {
      optionId: String(child.id),
      name,
      sku: child.sku || '',
      barcode: extractBarcode(child),
      image: absImage(child.image || child.small_image),
      price: pickPrice(child),
      inStock: child.stock?.is_in_stock !== false,
      quantity: child.stock?.qty,
    };
  }

  function normalizeProductSummary(p, meta = {}) {
    const hasOptions = p.type_id === 'configurable' && (p.configurable_children?.length > 0);
    return {
      id: String(p.id),
      name: (p.name || '').trim(),
      manufacturer: p.brand_details?.title || '',
      manufacturerId: p.brand ? String(p.brand) : '',
      sku: p.sku || '',
      barcode: extractBarcode(p),
      slug: p.url_path || p.url_key || '',
      price: pickPrice(p),
      thumb: pickThumb(p),
      hasOptions,
      inStock: p.stock?.is_in_stock !== false,
      category: meta.path || meta.name || '',
    };
  }

  function normalizeProductDetail(p) {
    const images = (p.media_gallery || [])
      .map((m) => absImage(m.image))
      .filter(Boolean);
    const thumb = pickThumb(p);
    if (thumb && !images.includes(thumb)) images.unshift(thumb);

    let shades = [];
    if (p.type_id === 'configurable' && p.configurable_children?.length) {
      shades = p.configurable_children.map((c) => normalizeShade(c, p));
    }

    const categories = Array.isArray(p.category)
      ? p.category.map((c) => c.name).filter(Boolean).join(' › ')
      : '';

    return {
      id: String(p.id),
      name: (p.name || '').trim(),
      manufacturer: p.brand_details?.title || '',
      manufacturerId: p.brand ? String(p.brand) : '',
      sku: p.sku || '',
      barcode: extractBarcode(p),
      slug: p.url_path || '',
      price: pickPrice(p),
      thumb,
      images: images.length ? images : (thumb ? [thumb] : []),
      description: p.description || p.short_description || '',
      inStock: p.stock?.is_in_stock !== false,
      quantity: p.stock?.qty,
      hasOptions: shades.length > 0,
      shades,
      category: categories,
      productUrl: p.url_path ? `${SITE}/${cfg.storePath}/${p.url_path}` : '',
    };
  }

  function sortProductsClient(products = [], sort = 'default') {
    if (!sort || sort === 'default') return products;
    const priceOf = (p) => Number(String(p.price || '').replace(/[^\d.]/g, '')) || 0;
    const nameOf = (p) => (p.name || '').trim();
    return [...products].sort((a, b) => {
      if (sort === 'price_asc' || sort === 'price_desc') {
        const diff = priceOf(a) - priceOf(b);
        return sort === 'price_asc' ? diff : -diff;
      }
      if (sort === 'name_asc' || sort === 'name_desc') {
        const diff = nameOf(a).localeCompare(nameOf(b), cfg.sortLocale, { sensitivity: 'base' });
        return sort === 'name_asc' ? diff : -diff;
      }
      return 0;
    });
  }

  async function fetchProductsByIds(ids = [], { detail = false } = {}) {
    const unique = [...new Set(ids.map((id) => Number(id)).filter((id) => id > 0))];
    if (!unique.length) return new Map();
    const data = await esSearch('product', withExactTotal({
      size: Math.min(unique.length, 500),
      query: { terms: { id: unique } },
      _source: detail ? PRODUCT_DETAIL_SOURCE : PRODUCT_LIST_SOURCE,
    }));
    return new Map((data.hits?.hits || []).map((h) => [String(h._source.id), h._source]));
  }

  return {
    locale,
    fetchBeautyCategoriesRaw,
    fetchCategoryProducts,
    searchProducts,
    fetchProductById,
    fetchProductBySku,
    fetchProductByKey,
    fetchProductsByIds,
    fetchBeautyBrands,
    fetchBrandProducts,
    normalizeProductSummary,
    normalizeProductDetail,
    sortProductsClient,
    countProductsInScope,
    fetchCategoryProductCounts,
    normalizeShade,
    optionLabel,
    pickPrice,
    pickThumb,
    formatIqd,
  };
}

function walkLeavesBilingual(node, enMap, leaves, all, pathAr = '', pathEn = '') {
  const nameAr = node.name || '';
  const nameEn = enMap.get(node.id)?.name || nameAr;
  const fullPathAr = pathAr ? `${pathAr} › ${nameAr}` : nameAr;
  const fullPathEn = pathEn ? `${pathEn} › ${nameEn}` : nameEn;
  const children = (node.children || []).map((c) => walkLeavesBilingual(c, enMap, leaves, all, fullPathAr, fullPathEn));
  const mapped = {
    id: node.id,
    slug: String(node.id),
    name: nameAr,
    nameEn,
    path: fullPathAr,
    pathEn: fullPathEn,
    productCount: node.product_count ?? 0,
    level: node.level,
    isLeaf: !children.length,
    children,
  };
  all.push(mapped);
  if (mapped.isLeaf) leaves.push(mapped);
  return mapped;
}

export function buildBilingualCategoryTree(itemsAr = [], itemsEn = []) {
  const enById = new Map(itemsEn.map((c) => [c.id, c]));
  const byId = new Map(itemsAr.map((c) => [c.id, { ...c, children: [] }]));
  for (const cat of byId.values()) {
    if (cat.parent_id && byId.has(cat.parent_id)) {
      byId.get(cat.parent_id).children.push(cat);
    }
  }
  const root = byId.get(BEAUTY_ROOT_ID);
  if (!root) {
    return { tree: [], leaves: [], all: [], ids: [] };
  }
  const leaves = [];
  const all = [];
  const tree = [walkLeavesBilingual(root, enById, leaves, all)];
  const ids = all.map((c) => c.id);
  return { tree, leaves, all, ids };
}

export function buildCategoryTree(items = []) {
  return buildBilingualCategoryTree(items, items);
}

export async function fetchBeautyCategoriesBilingual() {
  const [itemsAr, itemsEn] = await Promise.all([
    elryanAr.fetchBeautyCategoriesRaw(),
    elryanEn.fetchBeautyCategoriesRaw(),
  ]);
  return { itemsAr, itemsEn };
}

function shadeFromProducts(childAr, productAr, childEn, productEn) {
  const variantAr = elryanAr.optionLabel(productAr.configurable_options, childAr) || childAr.name || '';
  const variantEn = childEn
    ? (elryanEn.optionLabel(productEn?.configurable_options, childEn) || childEn.name || '')
    : '';
  const name = variantAr.trim() || String(childAr.id);
  const nameEn = variantEn.trim() || name;
  return {
    optionId: String(childAr.id),
    name,
    nameEn,
    sku: childAr.sku || '',
    barcode: extractBarcode(childAr),
    image: absImage(childAr.image || childAr.small_image),
    price: elryanAr.pickPrice(childAr),
    inStock: childAr.stock?.is_in_stock !== false,
    quantity: childAr.stock?.qty,
  };
}

export function normalizeBilingualSummary(pAr, pEn = null, meta = {}) {
  const base = elryanAr.normalizeProductSummary(pAr, meta);
  const categoriesEn = Array.isArray(pEn?.category)
    ? pEn.category.map((c) => c.name).filter(Boolean).join(' › ')
    : '';
  return {
    ...base,
    nameEn: (pEn?.name || '').trim(),
    manufacturerEn: pEn?.brand_details?.title || base.manufacturer,
    categoryEn: meta.pathEn || meta.nameEn || categoriesEn || '',
    slugEn: pEn?.url_path || pEn?.url_key || '',
    productUrlEn: pEn?.url_path ? `${SITE}/en/${pEn.url_path}` : '',
  };
}

export function normalizeBilingualDetail(pAr, pEn = null) {
  const base = elryanAr.normalizeProductDetail(pAr);
  const enChildren = new Map((pEn?.configurable_children || []).map((c) => [String(c.id), c]));
  const shades = (pAr.configurable_children || []).map((c) =>
    shadeFromProducts(c, pAr, enChildren.get(String(c.id)), pEn)
  );
  const categoriesEn = Array.isArray(pEn?.category)
    ? pEn.category.map((c) => c.name).filter(Boolean).join(' › ')
    : '';
  const descEn = pEn?.description || pEn?.short_description || '';
  return {
    ...base,
    nameEn: (pEn?.name || '').trim(),
    manufacturerEn: pEn?.brand_details?.title || base.manufacturer,
    descriptionEn: descEn,
    categoryEn: categoriesEn,
    slugEn: pEn?.url_path || '',
    productUrlEn: pEn?.url_path ? `${SITE}/en/${pEn.url_path}` : '',
    shades: shades.length ? shades : base.shades,
  };
}

export async function enrichProductList(itemsAr = [], meta = {}) {
  const ids = itemsAr.map((p) => p.id);
  const enMap = await elryanEn.fetchProductsByIds(ids);
  return itemsAr.map((p) => normalizeBilingualSummary(p, enMap.get(String(p.id)), meta));
}

export async function fetchProductByIdBilingual(id) {
  const [pAr, pEn] = await Promise.all([
    elryanAr.fetchProductByKey(id),
    elryanEn.fetchProductByKey(id),
  ]);
  if (!pAr?.id) return null;
  return normalizeBilingualDetail(pAr, pEn);
}

export function sortProductsClientBilingual(products = [], sort = 'default') {
  if (!sort || sort === 'default') return products;
  const priceOf = (p) => Number(String(p.price || '').replace(/[^\d.]/g, '')) || 0;
  const nameOf = (p) => (p.name || p.nameEn || '').trim();
  return [...products].sort((a, b) => {
    if (sort === 'price_asc' || sort === 'price_desc') {
      const diff = priceOf(a) - priceOf(b);
      return sort === 'price_asc' ? diff : -diff;
    }
    if (sort === 'name_asc' || sort === 'name_desc') {
      const diff = nameOf(a).localeCompare(nameOf(b), 'ar', { sensitivity: 'base' });
      return sort === 'name_asc' ? diff : -diff;
    }
    return 0;
  });
}

export const elryanAr = createElryanApi('ar');
export const elryanEn = createElryanApi('en');

export const {
  fetchBeautyCategoriesRaw,
  fetchCategoryProducts,
  searchProducts,
  fetchProductById,
  fetchProductBySku,
  fetchProductByKey,
  fetchBeautyBrands,
  fetchBrandProducts,
  normalizeProductSummary,
  normalizeProductDetail,
  sortProductsClient,
} = elryanAr;

export { createElryanApi };
