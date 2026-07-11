import { khatonFetch, DEFAULT_TTL } from './client.js';

const CATEGORY_TTL = 30 * 60 * 1000;

async function fetchCategoryNode(id) {
  if (!id || id === 'root') {
    const data = await khatonFetch('/categories', {
      ttl: CATEGORY_TTL,
      cacheKey: 'khaton:categories:root',
    });
    return data.data || [];
  }

  const data = await khatonFetch(`/categories/${encodeURIComponent(id)}`, {
    ttl: CATEGORY_TTL,
    cacheKey: `khaton:categories:${id}`,
  });
  return data.data?.sub_categories || [];
}

async function walkCategories(parentId = 'root', depth = 0, maxDepth = 4) {
  const rows = await fetchCategoryNode(parentId);
  const leaves = [];

  for (const row of rows) {
    const id = String(row.id || '').trim();
    if (!id) continue;
    const title = String(row.title || '').trim();
    const node = {
      id,
      nameAr: title,
      nameEn: title,
      parentId: parentId === 'root' ? 'root' : String(parentId),
      depth: depth + 1,
    };
    leaves.push(node);

    if (row.has_children && depth + 1 < maxDepth) {
      const children = await walkCategories(id, depth + 1, maxDepth);
      leaves.push(...children);
    }
  }

  return leaves;
}

export async function fetchCategoryTree() {
  const leaves = await walkCategories('root', 0, 4);
  const tree = [
    {
      id: 'root',
      nameAr: 'خاتون بيوتي Khaton Beauty',
      nameEn: 'Khaton Beauty',
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
