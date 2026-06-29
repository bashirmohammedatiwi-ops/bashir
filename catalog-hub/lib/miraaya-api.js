const GRAPHQL_URL = 'https://magadmin.miraaya.com/graphql';
import { mapPool } from './category-scope.js';
const REST_AR = 'https://magadmin.miraaya.com/rest/ar/V1';
const REST_EN = 'https://magadmin.miraaya.com/rest/default/V1';
const STORE_AR = 'ar';
const STORE_EN = 'default';
const SITE = 'https://miraaya.com';
const MEDIA = 'https://magadmin.miraaya.com/media/catalog/product';

const CATEGORY_TREE_QUERY = `
  query CategoryTree {
    category(id: 2) {
      id
      name
      children {
        id
        name
        url_path
        product_count
        level
        children {
          id
          name
          url_path
          product_count
          level
          children {
            id
            name
            url_path
            product_count
            level
            children {
              id
              name
              url_path
              product_count
              level
            }
          }
        }
      }
    }
  }
`;

const PRODUCT_LIST_FRAGMENT = `
  fragment ProductListCard on ProductInterface {
    id
    uid
    sku
    name
    url_key
    stock_status
    __typename
    price_range {
      minimum_price {
        final_price { value currency }
        regular_price { value currency }
      }
    }
    image { url label }
  }
`;

const PRODUCT_DETAIL_FRAGMENT = `
  fragment ProductDetailCard on ProductInterface {
    id
    uid
    sku
    name
    url_key
    stock_status
    __typename
    price_range {
      minimum_price {
        final_price { value currency }
        regular_price { value currency }
      }
    }
    image { url label }
    media_gallery { url label }
    ... on ConfigurableProduct {
      configurable_options {
        attribute_code
        label
        values { label value_index swatch_data { value } }
      }
      variants {
        attributes { code value_index label }
        product {
          id
          sku
          name
          stock_status
          image { url }
          price_range {
            minimum_price { final_price { value currency } }
          }
        }
      }
    }
  }
`;

const PRODUCT_DETAIL_QUERY = `
  ${PRODUCT_DETAIL_FRAGMENT}
  query ProductDetail($sku: String!) {
    products(filter: { sku: { eq: $sku } }, pageSize: 1) {
      items { ...ProductDetailCard }
    }
  }
`;

const PRODUCTS_LIST_QUERY = `
  ${PRODUCT_LIST_FRAGMENT}
  query CategoryProducts($id: String!, $page: Int!, $pageSize: Int!, $sort: ProductAttributeSortInput) {
    products(
      filter: { category_id: { eq: $id } }
      currentPage: $page
      pageSize: $pageSize
      sort: $sort
    ) {
      total_count
      items { ...ProductListCard }
    }
  }
`;

const CATEGORY_COUNT_QUERY = `
  query CategoryCount($id: String!) {
    products(filter: { category_id: { eq: $id } }, pageSize: 1) {
      total_count
    }
  }
`;

const SEARCH_QUERY = `
  ${PRODUCT_LIST_FRAGMENT}
  query SearchProducts($q: String!, $page: Int!, $pageSize: Int!) {
    products(search: $q, currentPage: $page, pageSize: $pageSize, sort: { relevance: DESC }) {
      total_count
      items { ...ProductListCard }
    }
  }
`;

const PRODUCTS_BY_SKUS_QUERY = `
  ${PRODUCT_LIST_FRAGMENT}
  query ProductsBySkus($skus: [String!]!, $pageSize: Int!) {
    products(filter: { sku: { in: $skus } }, pageSize: $pageSize) {
      items { ...ProductListCard }
    }
  }
`;

export async function gql(query, variables = {}, store = STORE_AR) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Store: store,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors?.length) {
    const msg = json.errors?.map((e) => e.message).join('; ') || `Miraaya API ${res.status}`;
    throw new Error(msg);
  }
  return json.data;
}

export function attrsMap(product = {}) {
  if (product._restAttrs) return { ...product._restAttrs };
  const map = {};
  const items = product.custom_attributesV2?.items || [];
  for (const item of items) {
    if (item?.code && item.value !== undefined && item.value !== null) {
      map[item.code] = String(item.value);
    }
  }
  return map;
}

function restBaseForStore(store) {
  return store === STORE_EN ? REST_EN : REST_AR;
}

async function fetchRestAttrs(sku, store = STORE_AR) {
  if (!sku) return {};
  try {
    const res = await fetch(`${restBaseForStore(store)}/products/${encodeURIComponent(sku)}`, {
      headers: { Accept: 'application/json', Store: store },
    });
    if (!res.ok) return {};
    const json = await res.json();
    const map = {};
    for (const item of json.custom_attributes || []) {
      if (item?.attribute_code && item.value !== undefined && item.value !== null) {
        map[item.attribute_code] = String(item.value);
      }
    }
    return map;
  } catch {
    return {};
  }
}

async function enrichProductAttrs(product, store = STORE_AR) {
  if (!product) return product;
  product._restAttrs = await fetchRestAttrs(product.sku, store);
  if (product.__typename === 'ConfigurableProduct' && product.variants?.length) {
    await Promise.all(
      product.variants.map(async (variant) => {
        const child = variant?.product;
        if (child?.sku) child._restAttrs = await fetchRestAttrs(child.sku, store);
      }),
    );
  }
  return product;
}

async function fetchEnglishListMap(skus = []) {
  const unique = [...new Set(skus.filter(Boolean))];
  if (!unique.length) return new Map();
  const data = await gql(PRODUCTS_BY_SKUS_QUERY, {
    skus: unique,
    pageSize: unique.length,
  }, STORE_EN);
  return new Map((data?.products?.items || []).map((p) => [p.sku, p]));
}

async function fetchRestBrandsMap(skus = [], store = STORE_AR) {
  const unique = [...new Set(skus.filter(Boolean))];
  if (!unique.length) return new Map();
  const params = new URLSearchParams({
    'searchCriteria[pageSize]': String(unique.length),
    'searchCriteria[filterGroups][0][filters][0][field]': 'sku',
    'searchCriteria[filterGroups][0][filters][0][value]': unique.join(','),
    'searchCriteria[filterGroups][0][filters][0][condition_type]': 'in',
  });
  try {
    const res = await fetch(`${restBaseForStore(store)}/products?${params}`, {
      headers: { Accept: 'application/json', Store: store },
    });
    if (!res.ok) return new Map();
    const json = await res.json();
    const map = new Map();
    for (const item of json.items || []) {
      const brand = (item.custom_attributes || []).find((a) => a.attribute_code === 'brand')?.value || '';
      if (item.sku) map.set(item.sku, brand);
    }
    return map;
  } catch {
    return new Map();
  }
}

async function attachEnglishToListItems(items = [], { light = true } = {}) {
  const skus = items.map((p) => p.sku);
  const enMap = await fetchEnglishListMap(skus);
  if (light) {
    return items.map((p) => ({
      ...p,
      _en: enMap.get(p.sku) || null,
    }));
  }
  const [brandAr, brandEn] = await Promise.all([
    fetchRestBrandsMap(skus, STORE_AR),
    fetchRestBrandsMap(skus, STORE_EN),
  ]);
  return items.map((p) => ({
    ...p,
    _en: enMap.get(p.sku) || null,
    _brandAr: brandAr.get(p.sku) || '',
    _brandEn: brandEn.get(p.sku) || '',
  }));
}

function indexCategoriesById(nodes, map = new Map()) {
  for (const node of nodes || []) {
    map.set(String(node.id), node);
    if (node.children?.length) indexCategoriesById(node.children, map);
  }
  return map;
}

export function extractBarcode(product = {}, attrs = {}) {
  const ean = String(attrs.ean || attrs.gtin || attrs.barcode || product.barcode || '').trim();
  if (/^\d{8,14}$/.test(ean)) return ean;
  const skuPart = String(product.sku || '').split('-')[0].trim();
  if (/^\d{8,14}$/.test(skuPart)) return skuPart;
  return ean || '';
}

export function extractBrand(attrs = {}, product = {}) {
  return attrs.brand || product.brand || '';
}

export function formatIqd(product = {}) {
  const fp = product.price_range?.minimum_price?.final_price;
  const rp = product.price_range?.minimum_price?.regular_price;
  if (!fp?.value) return '';
  const cur = fp.currency === 'IQD' ? 'د.ع' : (fp.currency || 'د.ع');
  const final = Math.round(fp.value).toLocaleString('ar-IQ');
  if (rp?.value && rp.value > fp.value) {
    const was = Math.round(rp.value).toLocaleString('ar-IQ');
    return `${final} ${cur} (كان ${was} ${cur})`;
  }
  return `${final} ${cur}`;
}

/** روابط GraphQL تستخدم cache hash مكسور (404) — نحوّلها للمسار الأصلي أو webp */
export function fixProductImageUrl(url = '') {
  if (!url) return '';
  let u = url;
  if (!u.startsWith('http')) {
    u = u.startsWith('/') ? `${MEDIA}${u}` : `${MEDIA}/${u}`;
  }
  u = u.replace(/\/media\/catalog\/product\/cache\/[a-f0-9]+\//i, '/media/catalog/product/');
  const webp = u.replace(
    /\/media\/catalog\/product\/(.+)\.(jpe?g|png)(\?.*)?$/i,
    '/media/catalog/product/cache/optimized/webp/$1.webp',
  );
  return webp !== u ? webp : u;
}

export function absImage(url = '') {
  return fixProductImageUrl(url);
}

function sortInput(sort = 'default') {
  switch (sort) {
    case 'name_asc': return { name: 'ASC' };
    case 'name_desc': return { name: 'DESC' };
    default: return { position: 'DESC' };
  }
}

function walkLeaves(nodeAr, enMap, leaves, all, pathAr = '', pathEn = '') {
  const nameAr = nodeAr.name || '';
  const nameEn = enMap.get(String(nodeAr.id))?.name || nameAr;
  const fullPathAr = pathAr ? `${pathAr} › ${nameAr}` : nameAr;
  const fullPathEn = pathEn ? `${pathEn} › ${nameEn}` : nameEn;
  const children = (nodeAr.children || []).map((c) => walkLeaves(c, enMap, leaves, all, fullPathAr, fullPathEn));
  const mapped = {
    id: nodeAr.id,
    slug: String(nodeAr.id),
    name: nameAr,
    nameEn,
    path: fullPathAr,
    pathEn: fullPathEn,
    productCount: nodeAr.product_count ?? 0,
    level: nodeAr.level,
    isLeaf: !children.length,
    children,
  };
  all.push(mapped);
  if (mapped.isLeaf) leaves.push(mapped);
  return mapped;
}

export async function fetchCategoryTreeRaw() {
  const [dataAr, dataEn] = await Promise.all([
    gql(CATEGORY_TREE_QUERY, {}, STORE_AR),
    gql(CATEGORY_TREE_QUERY, {}, STORE_EN),
  ]);
  return {
    rootsAr: dataAr?.category?.children || [],
    rootsEn: dataEn?.category?.children || [],
  };
}

export function buildCategoryTree({ rootsAr = [], rootsEn = [] } = {}) {
  const enMap = indexCategoriesById(rootsEn);
  const leaves = [];
  const all = [];
  const tree = rootsAr.map((r) => walkLeaves(r, enMap, leaves, all));
  return { tree, leaves, all, ids: all.map((c) => c.id) };
}

function normalizeHexColor(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s.toLowerCase()}`;
  if (/^[0-9a-fA-F]{3}$/.test(s)) return `#${s.toLowerCase()}`;
  const match = s.match(/#[0-9a-fA-F]{6}\b/);
  return match ? match[0].toLowerCase() : '';
}

function splitVariantTitle(fullName = '') {
  const parts = String(fullName).split(/\s*[-–—]\s*/);
  if (parts.length >= 2) {
    return { title: parts[0].trim(), shade: parts.slice(1).join(' - ').trim() };
  }
  return { title: String(fullName || '').trim(), shade: '' };
}

function extractColorFromVariantAttrs(attrs = [], parent = {}, { enAttrs = [] } = {}) {
  const map = new Map(attrs.map((a) => [String(a.code || '').toLowerCase(), a]));
  const enMap = new Map(enAttrs.map((a) => [String(a.code || '').toLowerCase(), a]));
  const shadeAttr = map.get('shade') || map.get('color_hex') || map.get('hex');
  const colorAttr = map.get('color') || map.get('colour');
  const enColorAttr = enMap.get('color') || enMap.get('colour');

  let hex = normalizeHexColor(shadeAttr?.label);
  let nameEn = (enColorAttr?.label || colorAttr?.label || '').trim();
  let colorCode = (colorAttr?.label || shadeAttr?.label || '').trim();

  if (!hex && shadeAttr?.label && /^[0-9a-fA-F]{3,6}$/i.test(shadeAttr.label.trim())) {
    hex = normalizeHexColor(shadeAttr.label);
  }

  if (!hex) {
    for (const opt of parent.configurable_options || []) {
      const code = String(opt.attribute_code || '').toLowerCase();
      if (code !== 'color' && code !== 'shade') continue;
      const ref = code === 'shade' ? shadeAttr : colorAttr;
      if (!ref?.value_index) continue;
      const val = (opt.values || []).find((v) => v.value_index === ref.value_index);
      if (val?.swatch_data?.value) hex = normalizeHexColor(val.swatch_data.value);
      if (!nameEn && val?.label && !/^[0-9a-fA-F]{3,6}$/i.test(val.label)) nameEn = val.label;
    }
  }

  if (colorAttr?.label && /^[0-9a-fA-F]{3,6}$/i.test(colorAttr.label.trim()) && !hex) {
    hex = normalizeHexColor(colorAttr.label);
  }

  return { nameEn, hex, colorCode };
}

function variantLabel(product = {}, parent = {}, variantAttrs = []) {
  for (const attr of variantAttrs) {
    const code = attr.code;
    const match = (parent.configurable_options || [])
      .find((opt) => opt.attribute_code === code)
      ?.values?.find((v) => v.value_index === attr.value_index);
    if (match?.label && !/^[0-9a-fA-F]{3,6}$/i.test(match.label)) return match.label;
    if (attr.label && !/^[0-9a-fA-F]{3,6}$/i.test(attr.label)) return attr.label;
  }
  for (const opt of parent.configurable_options || []) {
    const code = opt.attribute_code;
    const val = product[code];
    if (val === undefined || val === null) continue;
    const match = (opt.values || []).find((v) => v.value_index === val || v.value === val);
    if (match?.label) return match.label;
  }
  const attrs = attrsMap(product);
  if (attrs.size_ml) return `${attrs.size_ml} مل`;
  return (product.name || '').trim();
}

function normalizeShade(
  variantAr,
  parentAr,
  variantEn = null,
  parentEn = null,
  variantAttrs = [],
  enVariantAttrs = [],
) {
  const attrs = attrsMap(variantAr);
  const attrsEn = variantEn ? attrsMap(variantEn) : {};
  const color = extractColorFromVariantAttrs(variantAttrs, parentAr, { enAttrs: enVariantAttrs });
  const arFromName = splitVariantTitle(variantAr.name || '').shade;
  const enFromName = variantEn ? splitVariantTitle(variantEn.name || '').shade : '';
  const nameAr = arFromName || color.nameEn || (variantAr.name || '').trim() || variantAr.sku;
  const nameEn = enFromName || color.nameEn || '';
  return {
    optionId: String(variantAr.id || variantAr.sku),
    name: nameAr,
    nameEn,
    hex: color.hex,
    colorCode: color.colorCode,
    sku: variantAr.sku || '',
    barcode: extractBarcode(variantAr, attrs),
    image: fixProductImageUrl(variantAr.image?.url || ''),
    price: formatIqd(variantAr),
    inStock: variantAr.stock_status === 'IN_STOCK',
    brand: extractBrand(attrs, variantAr),
    brandEn: extractBrand(attrsEn, variantEn || {}),
  };
}

export function normalizeProductSummary(p, meta = {}) {
  const attrs = attrsMap(p);
  const en = p._en || null;
  const hasOptions = p.__typename === 'ConfigurableProduct';
  const price = formatIqd(p);
  const barcode = extractBarcode(p, attrs);
  const nameAr = (p.name || attrs.arabic_name || '').trim();
  const nameEn = (en?.name || '').trim();

  return {
    id: String(p.id),
    sku: p.sku || '',
    name: nameAr,
    nameEn,
    manufacturer: extractBrand(attrs, p) || p._brandAr || '',
    manufacturerEn: p._brandEn || '',
    barcode,
    slug: p.url_key || '',
    slugEn: en?.url_key || '',
    price,
    thumb: fixProductImageUrl(p.image?.url || ''),
    hasOptions,
    inStock: p.stock_status === 'IN_STOCK',
    category: meta.path || meta.name || '',
    categoryEn: meta.pathEn || meta.nameEn || '',
  };
}

export function normalizeProductDetail(p) {
  const pEn = p._enProduct || null;
  const attrs = attrsMap(p);
  const attrsEn = pEn ? attrsMap(pEn) : {};
  const images = (p.media_gallery || []).map((m) => fixProductImageUrl(m.url)).filter(Boolean);
  const thumb = fixProductImageUrl(p.image?.url || '');
  if (thumb && !images.includes(thumb)) images.unshift(thumb);

  const enVariantsBySku = new Map();
  const enAttrsBySku = new Map();
  if (pEn?.variants?.length) {
    for (const variant of pEn.variants) {
      if (variant?.product?.sku) {
        enVariantsBySku.set(variant.product.sku, variant.product);
        enAttrsBySku.set(variant.product.sku, variant.attributes || []);
      }
    }
  }

  let shades = [];
  if (p.__typename === 'ConfigurableProduct' && p.variants?.length) {
    shades = p.variants.map((v) => normalizeShade(
      v.product,
      p,
      enVariantsBySku.get(v.product?.sku),
      pEn,
      v.attributes || [],
      enAttrsBySku.get(v.product?.sku) || [],
    ));
  }

  const nameAr = (p.name || attrs.arabic_name || '').trim();
  const nameEn = (pEn?.name || '').trim();
  const descAr = attrs.product_description || attrs.arabic_description || attrs.description || '';
  const descEn = attrsEn.product_description || attrsEn.description || '';

  return {
    id: String(p.id),
    sku: p.sku || '',
    name: nameAr,
    nameEn,
    manufacturer: extractBrand(attrs, p),
    manufacturerEn: extractBrand(attrsEn, pEn || {}),
    barcode: extractBarcode(p, attrs),
    slug: p.url_key || '',
    slugEn: pEn?.url_key || '',
    price: formatIqd(p) || (shades[0]?.price ?? ''),
    thumb,
    images: images.length ? images : (thumb ? [thumb] : []),
    description: descAr,
    descriptionEn: descEn,
    inStock: p.stock_status === 'IN_STOCK',
    hasOptions: shades.length > 0,
    shades,
    category: '',
    categoryEn: '',
    productUrl: p.url_key ? `${SITE}/ar/${p.url_key}` : '',
    productUrlEn: pEn?.url_key ? `${SITE}/en/${pEn.url_key}` : '',
    ean: attrs.ean || '',
  };
}

export function sortProductsClient(products = [], sort = 'default') {
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

export async function fetchCategoryProductCounts(all = []) {
  return mapPool(all, async (node) => {
    const data = await gql(CATEGORY_COUNT_QUERY, { id: String(node.id) }, STORE_AR);
    return data?.products?.total_count ?? 0;
  }, 8);
}

export async function fetchCategoryProducts(categoryId, { page = 1, limit = 30, sort = 'default', light = true } = {}) {
  const data = await gql(PRODUCTS_LIST_QUERY, {
    id: String(categoryId),
    page,
    pageSize: limit,
    sort: sortInput(sort),
  });
  let items = await attachEnglishToListItems(data?.products?.items || [], { light });
  return {
    items,
    total: data?.products?.total_count ?? 0,
    page,
    pageSize: limit,
  };
}

export async function searchProducts(query, page = 1, limit = 30, { light = true } = {}) {
  const data = await gql(SEARCH_QUERY, { q: query, page, pageSize: limit });
  const items = await attachEnglishToListItems(data?.products?.items || [], { light });
  return {
    items,
    total: data?.products?.total_count ?? 0,
    page,
    pageSize: limit,
  };
}

export async function fetchProductBySku(sku) {
  if (!sku) return null;
  const [dataAr, dataEn] = await Promise.all([
    gql(PRODUCT_DETAIL_QUERY, { sku: String(sku) }, STORE_AR),
    gql(PRODUCT_DETAIL_QUERY, { sku: String(sku) }, STORE_EN),
  ]);
  const product = dataAr?.products?.items?.[0] || null;
  const productEn = dataEn?.products?.items?.[0] || null;
  if (!product) return null;
  await Promise.all([
    enrichProductAttrs(product, STORE_AR),
    productEn ? enrichProductAttrs(productEn, STORE_EN) : Promise.resolve(),
  ]);
  product._enProduct = productEn;
  return product;
}

export async function fetchProductById(id) {
  const res = await fetch(
    `${REST_AR}/products?searchCriteria[filterGroups][0][filters][0][field]=entity_id&` +
    `searchCriteria[filterGroups][0][filters][0][value]=${encodeURIComponent(id)}&` +
    `searchCriteria[pageSize]=1`,
    { headers: { Accept: 'application/json', Store: STORE_AR } },
  );
  if (!res.ok) return null;
  const json = await res.json();
  const sku = json?.items?.[0]?.sku;
  if (!sku) return null;
  return fetchProductBySku(sku);
}

const FIND_BY_VARIANT_QUERY = `
  query FindByVariant($q: String!, $pageSize: Int!) {
    products(search: $q, pageSize: $pageSize) {
      items {
        id
        sku
        name
        __typename
        ... on ConfigurableProduct {
          variants {
            product { id sku name }
          }
        }
      }
    }
  }
`;

/** يحلّ باركود/‏SKU تدرّج إلى المنتج الأب (Configurable) مع كل التدرجات */
export async function resolveProductByBarcode(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!digits) return null;

  const direct = await fetchProductBySku(digits);
  if (direct) return direct;

  const data = await gql(FIND_BY_VARIANT_QUERY, { q: digits, pageSize: 24 }, STORE_AR);
  for (const item of data?.products?.items || []) {
    if (item.__typename !== 'ConfigurableProduct') continue;
    const hasVariant = (item.variants || []).some((v) => String(v.product?.sku || '') === digits);
    if (hasVariant) return fetchProductBySku(item.sku);
  }

  return null;
}

const BROWSE_PRODUCTS_QUERY = `
  ${PRODUCT_LIST_FRAGMENT}
  query BrowseProducts($page: Int!, $pageSize: Int!) {
    products(
      filter: { category_id: { eq: "2" } }
      currentPage: $page
      pageSize: $pageSize
      sort: { name: ASC }
    ) {
      total_count
      items { ...ProductListCard }
    }
  }
`;

export async function fetchBrandsCatalog({ maxPages = 20, pageSize = 100 } = {}) {
  const map = new Map();
  for (let page = 1; page <= maxPages; page++) {
    const data = await gql(BROWSE_PRODUCTS_QUERY, { page, pageSize }, STORE_AR);
    const items = data?.products?.items || [];
    if (!items.length) break;
    const enriched = await attachEnglishToListItems(items, { light: false });
    for (const p of enriched) {
      const attrs = attrsMap(p);
      const nameAr = extractBrand(attrs, p) || p._brandAr || '';
      const nameEn = p._brandEn || '';
      const name = String(nameAr || nameEn || '').trim();
      if (!name || name.length < 2) continue;
      const key = name.toLowerCase();
      const thumb = fixProductImageUrl(p.image?.url || '');
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          slug: key,
          name: nameAr || nameEn,
          nameEn: nameEn || nameAr,
          image: thumb,
          productCount: 1,
        });
      } else {
        const b = map.get(key);
        b.productCount += 1;
        if (!b.image && thumb) b.image = thumb;
      }
    }
    if (items.length < pageSize) break;
  }
  const brands = [...map.values()];
  brands.sort((a, b) => {
    if (b.productCount !== a.productCount) return b.productCount - a.productCount;
    return a.name.localeCompare(b.name, 'ar');
  });
  return brands;
}

export async function fetchBrandProducts(brandName, { page = 1, limit = 30, sort = 'default' } = {}) {
  const q = String(brandName || '').trim();
  if (!q) return { items: [], total: 0, page, pageSize: limit };

  const pageSize = Math.min(Math.max(limit, 1), 60);
  const params = new URLSearchParams({
    'searchCriteria[pageSize]': String(pageSize),
    'searchCriteria[currentPage]': String(Math.max(page, 1)),
    'searchCriteria[filterGroups][0][filters][0][field]': 'brand',
    'searchCriteria[filterGroups][0][filters][0][value]': q,
    'searchCriteria[filterGroups][0][filters][0][condition_type]': 'eq',
  });

  const res = await fetch(`${REST_AR}/products?${params}`, {
    headers: { Accept: 'application/json', Store: STORE_AR },
  });
  if (!res.ok) throw new Error(`Miraaya REST ${res.status}`);
  const json = await res.json();
  const total = json.total_count ?? 0;
  const skus = (json.items || []).map((item) => item.sku).filter(Boolean);
  if (!skus.length) return { items: [], total, page, pageSize };

  const data = await gql(PRODUCTS_BY_SKUS_QUERY, { skus, pageSize: skus.length }, STORE_AR);
  const bySku = new Map((data?.products?.items || []).map((p) => [p.sku, p]));
  let items = skus.map((sku) => bySku.get(sku)).filter(Boolean);

  items = await attachEnglishToListItems(items);
  items = items.map((p) => ({ ...p, _brandAr: q }));

  if (sort === 'price_asc' || sort === 'price_desc' || sort === 'name_asc' || sort === 'name_desc') {
    const normalized = items.map((p) => normalizeProductSummary(p));
    const sorted = sortProductsClient(normalized, sort);
    const byId = new Map(items.map((p) => [String(p.id), p]));
    items = sorted.map((n) => byId.get(String(n.id))).filter(Boolean);
  }

  return { items, total, page, pageSize };
}
