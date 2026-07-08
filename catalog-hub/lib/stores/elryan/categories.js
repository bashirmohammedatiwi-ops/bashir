import { cacheGet, cacheSet } from '../../core/cache.js';
import { hitsOf, searchIndex, TREE_TTL } from './client.js';
import { mapCategoryNode } from './map.js';

function collectLeaves(nodes = [], out = []) {
  for (const node of nodes) {
    if (node.isLeaf) out.push(node);
    if (node.children?.length) collectLeaves(node.children, out);
  }
  return out;
}

function attachPaths(nodes = [], parentPath = '') {
  for (const node of nodes) {
    node.path = parentPath ? `${parentPath} › ${node.name}` : node.name;
    if (node.children?.length) attachPaths(node.children, node.path);
  }
  return nodes;
}

/** بناء شجرة أقسام من قائمة مسطّحة */
function buildTree(rows = []) {
  const byId = new Map();
  for (const src of rows) {
    const id = String(src.id || '');
    if (!id) continue;
    byId.set(id, { src, children: [] });
  }

  const roots = [];
  for (const { src, children } of byId.values()) {
    const parentId = String(src.parent_id || '');
    const parent = byId.get(parentId);
    if (parent && parentId !== String(src.id)) {
      parent.children.push({ src, children });
    } else if (Number(src.level) <= 2) {
      roots.push({ src, children });
    }
  }

  // إن لم نجد جذوراً بالمستوى 2، خذ كل ما ليس له أب معروف
  if (!roots.length) {
    for (const entry of byId.values()) {
      const parentId = String(entry.src.parent_id || '');
      if (!byId.has(parentId)) roots.push(entry);
    }
  }

  function toNode(entry) {
    const kids = (entry.children || [])
      .sort((a, b) => Number(a.src.position || 0) - Number(b.src.position || 0))
      .map(toNode);
    return mapCategoryNode(entry.src, kids);
  }

  return attachPaths(
    roots
      .sort((a, b) => Number(a.src.position || 0) - Number(b.src.position || 0))
      .map(toNode),
  );
}

export async function fetchCategoryTree() {
  const cacheKey = 'elryan:category-tree';
  const cached = cacheGet(cacheKey, TREE_TTL);
  if (cached) return cached;

  // جلب كل الأقسام النشطة دفعة واحدة (أسرع من التصفح المتكرر)
  const pageSize = 500;
  const rows = [];
  let from = 0;
  let guard = 0;

  while (guard < 20) {
    const result = await searchIndex('ar', 'category', {
      from,
      size: pageSize,
      track_total_hits: true,
      query: {
        bool: {
          filter: [
            { term: { is_active: true } },
            { range: { level: { gte: 2 } } },
          ],
        },
      },
      sort: [{ level: 'asc' }, { position: 'asc' }],
      _source: ['id', 'parent_id', 'name', 'level', 'position', 'url_key', 'slug', 'is_active', 'children_count', 'product_count', 'path'],
    }, { ttl: TREE_TTL, cacheKey: `elryan:cats:page:${from}` });

    const batch = hitsOf(result).map((h) => h._source).filter(Boolean);
    rows.push(...batch);
    from += batch.length;
    const total = typeof result.hits?.total === 'number' ? result.hits.total : result.hits?.total?.value || 0;
    if (!batch.length || from >= total) break;
    guard += 1;
  }

  // دمج أسماء إنجليزية للمستوى الأعلى فقط (خفيف)
  const enRoots = await searchIndex('en', 'category', {
    size: 50,
    query: { bool: { filter: [{ term: { is_active: true } }, { term: { level: 2 } }] } },
    _source: ['id', 'name'],
  }, { ttl: TREE_TTL, cacheKey: 'elryan:cats:en-roots' }).catch(() => null);

  const enNameById = new Map(
    hitsOf(enRoots).map((h) => [String(h._source?.id), String(h._source?.name || '').trim()]),
  );

  const tree = buildTree(rows);
  for (const node of tree) {
    const en = enNameById.get(node.id);
    if (en) node.nameEn = en;
  }

  const result = { tree, leaves: collectLeaves(tree) };
  cacheSet(cacheKey, result);
  return result;
}
