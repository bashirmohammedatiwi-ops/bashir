import { miraayaGraphql } from './client.js';

const TREE_QUERY = `
  query CategoryTree {
    categories {
      items {
        id name url_key product_count position
        children {
          id name url_key product_count position
          children {
            id name url_key product_count position
            children {
              id name url_key product_count position
            }
          }
        }
      }
    }
  }
`;

/** أقسام رئيسية ميرايا — احتياط عند فشل GraphQL */
export const MIRAAYA_TOP_CATEGORIES = [
  { id: '51', nameAr: 'المكياج', nameEn: 'Makeup', urlKey: 'Makeup', position: 2 },
  { id: '52', nameAr: 'العناية بالبشرة', nameEn: 'Skincare', urlKey: 'Skincare', position: 3 },
  { id: '50', nameAr: 'العناية بالشعر', nameEn: 'Hair Care', urlKey: 'hair-care', position: 5 },
  { id: '934', nameAr: 'واقي شمس', nameEn: 'Sun Screen', urlKey: 'sun-screen', position: 4 },
  { id: '1417', nameAr: 'وصل حديثاً', nameEn: 'New Arrivals', urlKey: 'new-arrivalss', position: 1 },
];

function indexById(nodes = [], map = new Map()) {
  for (const node of nodes || []) {
    if (!node?.id) continue;
    map.set(String(node.id), node);
    indexById(node.children, map);
  }
  return map;
}

function buildNode(arNode, enNode, level, parentId) {
  const id = String(arNode.id);
  const kids = [...(arNode.children || [])]
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
    .map((child) => {
      const enChild = enNode?.children?.find((c) => String(c.id) === String(child.id)) || null;
      return buildNode(child, enChild, level + 1, id);
    });

  const nameAr = String(arNode.name || '').trim();
  const nameEn = String(enNode?.name || nameAr).trim();

  return {
    id,
    slug: String(arNode.url_key || id).trim(),
    name: nameAr || nameEn || id,
    nameEn: nameEn || nameAr,
    parentId,
    level,
    isLeaf: kids.length === 0,
    productCount: Number(arNode.product_count || 0) || null,
    children: kids,
  };
}

function attachPaths(nodes = [], parentPath = '') {
  for (const node of nodes) {
    node.path = parentPath ? `${parentPath} › ${node.name}` : node.name;
    if (node.children?.length) attachPaths(node.children, node.path);
  }
  return nodes;
}

function collectLeaves(nodes = [], out = []) {
  for (const node of nodes) {
    if (node.isLeaf) out.push(node);
    if (node.children?.length) collectLeaves(node.children, out);
  }
  return out;
}

function fallbackTree() {
  const leaves = MIRAAYA_TOP_CATEGORIES
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
    .map((c) => ({
      id: c.id,
      slug: c.urlKey,
      name: c.nameAr,
      nameEn: c.nameEn,
      parentId: 'root',
      level: 1,
      isLeaf: true,
      productCount: null,
      children: [],
      path: c.nameAr,
    }));

  return { tree: leaves, leaves };
}

export async function fetchCategoryTree() {
  const cacheKey = 'miraaya:categories:tree:v2';
  try {
    const [arData, enData] = await Promise.all([
      miraayaGraphql(TREE_QUERY, { lang: 'ar', ttl: 30 * 60 * 1000, cacheKey: `${cacheKey}:ar` }),
      miraayaGraphql(TREE_QUERY, { lang: 'en', ttl: 30 * 60 * 1000, cacheKey: `${cacheKey}:en` }),
    ]);

    const arRoot = arData?.categories?.items?.[0];
    const enRoot = enData?.categories?.items?.[0];
    const arTop = [...(arRoot?.children || [])].sort(
      (a, b) => Number(a.position || 0) - Number(b.position || 0),
    );

    if (!arTop.length) return fallbackTree();

    const enById = indexById(enRoot?.children || []);
    const tree = attachPaths(
      arTop.map((node) => buildNode(node, enById.get(String(node.id)) || null, 1, 'root')),
    );
    const leaves = collectLeaves(tree, []);

    return { tree, leaves };
  } catch (err) {
    console.warn('miraaya categories:', err.message);
    return fallbackTree();
  }
}
