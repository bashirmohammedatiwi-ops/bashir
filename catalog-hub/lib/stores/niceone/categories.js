import {
  CATEGORY_TTL,
  fetchPageHtml,
  findCategoriesArrayIndex,
  parseNuxtPayload,
  revivePayloadNode,
} from './client.js';

function walkCategory(cat, { parentId = 'root', depth = 0, leaves = [] }) {
  if (!cat) return leaves;
  const id = String(cat.seo_name || cat.category_id || '').trim().replace(/\/+$/g, '');
  if (!id) return leaves;

  leaves.push({
    id,
    nameAr: String(cat.name || '').trim(),
    nameEn: String(cat.en_name || cat.name || '').trim(),
    parentId,
    depth,
  });

  for (const child of cat.categories || []) {
    walkCategory(child, { parentId: id, depth: depth + 1, leaves });
  }
  return leaves;
}

export async function fetchCategoryTree() {
  const html = await fetchPageHtml('', { lang: 'ar', ttl: CATEGORY_TTL, cacheKey: 'niceone:home:categories' });
  const payload = parseNuxtPayload(html);
  const catsIndex = findCategoriesArrayIndex(payload);
  if (catsIndex < 0) {
    return { tree: [], leaves: [] };
  }

  const categories = revivePayloadNode(payload, catsIndex) || [];
  const leaves = [];
  for (const cat of categories) {
    walkCategory(cat, { leaves });
  }

  const tree = [
    {
      id: 'root',
      nameAr: 'نايس ون Nice One',
      nameEn: 'Nice One',
      children: leaves.filter((l) => l.parentId === 'root').map((l) => l.id),
    },
    ...leaves.map((leaf) => ({
      id: leaf.id,
      nameAr: leaf.nameAr,
      nameEn: leaf.nameEn,
      parentId: leaf.parentId,
      children: leaves.filter((l) => l.parentId === leaf.id).map((l) => l.id),
    })),
  ];

  return { tree, leaves };
}
