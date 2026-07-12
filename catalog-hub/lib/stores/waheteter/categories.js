import { waheteterFetch } from './client.js';

const CATEGORY_TTL = 30 * 60 * 1000;

async function fetchAllCategories() {
  const all = [];
  for (let page = 1; page <= 40; page += 1) {
    try {
      const { data } = await waheteterFetch('/products/categories', {
        params: { per_page: 100, page },
        ttl: CATEGORY_TTL,
        cacheKey: `waheteter:categories:page:${page}`,
      });
      const rows = Array.isArray(data) ? data : [];
      if (!rows.length) break;
      all.push(...rows);
      if (rows.length < 100) break;
    } catch {
      break;
    }
  }
  return all;
}

export async function fetchCategoryTree() {
  const rows = await fetchAllCategories();
  const leaves = rows
    .filter((row) => Number(row.count || 0) > 0)
    .map((row) => ({
      id: String(row.id),
      nameAr: String(row.name || '').trim(),
      nameEn: String(row.name || '').trim(),
      parentId: Number(row.parent || 0) > 0 ? String(row.parent) : 'root',
      depth: 0,
    }));

  const tree = [
    {
      id: 'root',
      nameAr: 'واحة عطر Wahet Eter',
      nameEn: 'Wahet Eter',
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
