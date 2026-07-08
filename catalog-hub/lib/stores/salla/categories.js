import { cacheGet, cacheSet } from '../../core/cache.js';
import { splitBilingualText } from '../../core/bilingual.js';
import { DEFAULT_TTL } from './client.js';

function mapCategoryNode(cat, { level = 1, parentPath = '' } = {}) {
  const id = String(cat.id_ || cat.id || '').trim();
  const name = String(cat.name || '').trim();
  const path = parentPath ? `${parentPath} › ${name}` : name;
  const children = (cat.sub_categories || [])
    .map((sub) => mapCategoryNode(sub, { level: level + 1, parentPath: path }))
    .filter((node) => node.id);

  return {
    id,
    slug: String(cat.id || id),
    name,
    nameEn: splitBilingualText(name, { mode: 'name' }).en || name,
    level,
    isLeaf: children.length === 0,
    children,
    productCount: null,
    path,
  };
}

function collectLeaves(nodes = [], out = []) {
  for (const node of nodes) {
    if (node.isLeaf) out.push(node);
    if (node.children?.length) collectLeaves(node.children, out);
  }
  return out;
}

export function createSallaCategoriesApi(client) {
  const { sallaFetch, cachePrefix } = client;

  async function fetchCategoryTree() {
    const cacheKey = `${cachePrefix}:tree`;
    const cached = cacheGet(cacheKey, DEFAULT_TTL * 3);
    if (cached) return cached;

    const { data = [] } = await sallaFetch('/categories');
    const tree = data
      .map((cat) => mapCategoryNode(cat))
      .filter((node) => node.id);
    const result = { tree, leaves: collectLeaves(tree) };
    cacheSet(cacheKey, result);
    return result;
  }

  return { fetchCategoryTree };
}
