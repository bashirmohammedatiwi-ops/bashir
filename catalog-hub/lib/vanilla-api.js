const API_BASE = 'https://vanillacosmetics.com/api/v1';
const CDN = 'https://cdn.vanillacosmetics.com';

const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'Accept-Language': 'ar',
};

export async function vanillaGet(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set('languageCode', 'ar');
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url, { headers: DEFAULT_HEADERS });
  if (!res.ok) {
    throw new Error(`Vanilla API ${res.status}: ${path}`);
  }
  return res.json();
}

export function absUrl(url = '') {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  return `${CDN}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function formatPrice(amount, symbol = 'د.ع') {
  if (amount === undefined || amount === null || amount === '') return '';
  const n = Number(amount);
  if (Number.isNaN(n)) return String(amount);
  return `${n.toLocaleString('ar-IQ')} ${symbol}`;
}

export function isEan(value) {
  const s = String(value ?? '').trim();
  return s && s !== 'null' && /^\d{8,14}$/.test(s);
}

/** فصل باركود EAN القياسي عن المرجع الداخلي الطويل في API Vanilla */
export function parseVanillaBarcode(raw = '') {
  const value = String(raw ?? '').trim();
  if (!value || value === 'null') {
    return { barcode: '', vanillaRef: '', hasRetailBarcode: false };
  }
  if (isEan(value)) {
    return { barcode: value, vanillaRef: '', hasRetailBarcode: true };
  }
  return { barcode: '', vanillaRef: value, hasRetailBarcode: false };
}

export async function fetchCategories() {
  const data = await vanillaGet('/categories');
  return data.items || [];
}

export function buildCategoryTree(items = []) {
  const byId = new Map(items.map((c) => [c.id, { ...c, children: [] }]));
  const roots = [];

  for (const cat of byId.values()) {
    if (cat.parentCategoryId && byId.has(cat.parentCategoryId)) {
      byId.get(cat.parentCategoryId).children.push(cat);
    } else {
      roots.push(cat);
    }
  }

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => (b.displayOrder ?? 0) - (a.displayOrder ?? 0) || a.name.localeCompare(b.name, 'ar'));
    for (const n of nodes) {
      if (n.children?.length) sortNodes(n.children);
    }
  };
  sortNodes(roots);

  function mapNode(node, path = '') {
    const name = node.name || '';
    const fullPath = path ? `${path} › ${name}` : name;
    const children = (node.children || []).map((c) => mapNode(c, fullPath));
    const isLeaf = !children.length;
    return {
      id: node.id,
      slug: String(node.id),
      name,
      path: fullPath,
      productCount: node.productCount ?? 0,
      thumbnailUrl: absUrl(node.thumbnailUrl),
      isLeaf,
      children,
    };
  }

  const tree = roots.map((r) => mapNode(r));
  const leaves = [];
  const all = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      all.push(n);
      if (n.isLeaf) leaves.push(n);
      else walk(n.children || []);
    }
  };
  walk(tree);
  return { tree, leaves, all };
}

export async function fetchCategoryProducts(categoryId, { page = 1, limit = 30, search = '', sort = 'default' } = {}) {
  const params = {
    categoryIds: categoryId,
    pageNumber: page,
    pageSize: limit,
  };
  if (search) params.searchTerm = search;
  if (sort === 'name_asc') {
    params.sortBy = 'name';
    params.sortDirection = 'asc';
  } else if (sort === 'name_desc') {
    params.sortBy = 'name';
    params.sortDirection = 'desc';
  } else if (sort === 'price_asc') {
    params.sortBy = 'price';
    params.sortDirection = 'asc';
  } else if (sort === 'price_desc') {
    params.sortBy = 'price';
    params.sortDirection = 'desc';
  }

  return vanillaGet('/products', params);
}

export async function searchProducts(query, page = 1, limit = 30) {
  return vanillaGet('/products', {
    searchTerm: query,
    pageNumber: page,
    pageSize: limit,
  });
}

export async function fetchProductDetail(productId) {
  return vanillaGet(`/products/${productId}`);
}

export async function fetchProductVariations(productId) {
  try {
    const data = await vanillaGet(`/products/${productId}/variations`);
    return Array.isArray(data) ? data : data.items || [];
  } catch {
    return [];
  }
}

function pickThumb(images = [], fallback = '') {
  const main = images.find((i) => i.isMain) || images[0];
  return absUrl(main?.thumbnailUrl || main?.imageUrl || fallback);
}

function pickImages(images = []) {
  return images
    .filter((i) => i.isActive !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((i) => absUrl(i.imageUrl || i.thumbnailUrl))
    .filter(Boolean);
}

export function normalizeVariation(v, product = {}) {
  const symbol = v.currencySymbol || product.currencySymbol || 'د.ع';
  const price = v.salePrice ?? v.price ?? product.salePrice ?? product.price;
  const name = v.shortDescription || v.displayName || v.description || v.name || String(v.id);
  const bc = parseVanillaBarcode(v.barcode);
  return {
    optionId: String(v.id),
    name,
    sku: v.sku || '',
    ...bc,
    image: absUrl(v.imageUrl),
    price: formatPrice(price, symbol),
    inStock: v.inStock !== false,
    quantity: v.stockQuantity,
    hex: '',
    optionGroup: 'الدرجات / المتغيرات',
  };
}

export function normalizeProductSummary(p, meta = {}) {
  const symbol = p.currencySymbol || 'د.ع';
  const price = p.onSale && p.salePrice != null ? p.salePrice : p.price;
  const original = p.onSale && p.originalPrice != null ? p.originalPrice : null;
  const thumb = pickThumb(p.images, p.lowestVarientImage);
  const hasOptions = Boolean(p.hasVariations || p.listingUsesVariation);
  const bc = parseVanillaBarcode(p.barcode);

  return {
    id: String(p.id),
    name: p.name || '',
    manufacturer: p.brandName || '',
    sku: p.sku || '',
    ...bc,
    slug: p.slug || '',
    price: original && original !== price
      ? `${formatPrice(price, symbol)} (كان ${formatPrice(original, symbol)})`
      : formatPrice(price, symbol),
    thumb,
    hasOptions,
    inStock: p.inStock !== false && (p.listingIsInStock !== false),
    category: meta.path || meta.name || '',
  };
}

export async function normalizeProductDetail(p) {
  const symbol = p.currencySymbol || 'د.ع';
  const price = p.onSale && p.salePrice != null ? p.salePrice : p.price;
  const images = pickImages(p.images);
  const thumb = images[0] || pickThumb(p.images);

  let shades = [];
  if (p.hasVariations || p.listingUsesVariation) {
    const variations = await fetchProductVariations(p.id);
    shades = variations.map((v) => normalizeVariation(v, p));
  }

  const categories = Array.isArray(p.categories)
    ? p.categories.map((c) => c.name).filter(Boolean).join(' › ')
    : '';

  const bc = parseVanillaBarcode(p.barcode);

  return {
    id: String(p.id),
    name: p.name || '',
    manufacturer: p.brandName || '',
    sku: p.sku || '',
    ...bc,
    price: formatPrice(price, symbol),
    thumb,
    images: images.length ? images : thumb ? [thumb] : [],
    description: p.description || p.shortDescription || '',
    quantity: p.stockQuantity,
    inStock: p.inStock !== false,
    rating: p.averageRating || null,
    reviews: p.reviewCount || 0,
    hasOptions: shades.length > 0,
    shades,
    shadeCount: shades.length,
    category: categories,
    slug: p.slug || '',
    attributes: [],
  };
}
