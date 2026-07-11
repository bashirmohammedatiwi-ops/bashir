import { cacheGet, cacheSet } from '../../core/cache.js';
import { shopifyFetch } from './client.js';

const CATEGORY_TTL = 60 * 60 * 1000;
const CACHE_KEY = 'orisdi:category-tree:v1';

const NAV_COLLECTIONS = [
  { handle: 'عطور', nameAr: 'العطور', nameEn: 'Perfumes' },
  { handle: 'العطور-العربية', nameAr: 'العطور العربية', nameEn: 'Arabic Perfumes' },
  { handle: 'عطور-النيش', nameAr: 'عطور النيش', nameEn: 'Niche Perfumes' },
  { handle: 'مكياج', nameAr: 'مكياج', nameEn: 'Makeup' },
  { handle: 'الوجه', nameAr: 'الوجه', nameEn: 'Face' },
  { handle: 'العين', nameAr: 'العين', nameEn: 'Eyes' },
  { handle: 'الحواجب', nameAr: 'الحواجب', nameEn: 'Eyebrows' },
  { handle: 'احمر-شفاه', nameAr: 'أحمر شفاه', nameEn: 'Lipstick' },
  { handle: 'كريم-اساس', nameAr: 'كريم أساس', nameEn: 'Foundation' },
  { handle: 'ماسكارا', nameAr: 'ماسكارا', nameEn: 'Mascara' },
  { handle: 'غسول', nameAr: 'غسول', nameEn: 'Cleanser' },
  { handle: 'خصومات-حصرية', nameAr: 'خصومات حصرية', nameEn: 'Exclusive Discounts' },
];

async function loadNavFromHomepage() {
  try {
    const res = await fetch('https://orisdi.com/', {
      headers: { 'User-Agent': 'catalog-hub/2.0 (orisdi)', Accept: 'text/html' },
      signal: AbortSignal.timeout(12_000),
    });
    const html = await res.text();
    const handles = [...new Set(html.match(/\/collections\/([^"'?#]+)/g) || [])]
      .map((s) => decodeURIComponent(s.replace('/collections/', '')))
      .filter((h) => !h.startsWith('size-') && !/^\d/.test(h) && h.length < 60);

    const leaves = [];
    for (const handle of handles) {
      if (leaves.some((l) => l.id === handle)) continue;
      try {
        const data = await shopifyFetch(`/collections/${encodeURIComponent(handle)}.json`, {
          ttl: CATEGORY_TTL,
          cacheKey: `orisdi:collection:${handle}`,
        });
        const title = String(data.collection?.title || handle).trim();
        const hasArabic = /[\u0600-\u06FF]/.test(title);
        leaves.push({
          id: handle,
          nameAr: hasArabic ? title : handle,
          nameEn: hasArabic ? handle : title,
          parentId: 'root',
          depth: 1,
        });
      } catch {
        /* skip */
      }
      if (leaves.length >= 40) break;
    }
    if (leaves.length >= 8) return leaves;
  } catch {
    /* fallback */
  }
  return NAV_COLLECTIONS.map((c) => ({
    id: c.handle,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
    parentId: 'root',
    depth: 1,
  }));
}

export async function fetchCategoryTree() {
  const cached = cacheGet(CACHE_KEY, CATEGORY_TTL);
  if (cached) return cached;

  const leaves = await loadNavFromHomepage();
  const tree = [
    {
      id: 'root',
      nameAr: 'أورزدي Orisdi',
      nameEn: 'Orisdi',
      children: leaves.map((l) => l.id),
    },
    ...leaves.map((leaf) => ({
      id: leaf.id,
      nameAr: leaf.nameAr,
      nameEn: leaf.nameEn,
      parentId: 'root',
      children: [],
    })),
  ];

  const out = { tree, leaves };
  cacheSet(CACHE_KEY, out, CATEGORY_TTL);
  return out;
}
