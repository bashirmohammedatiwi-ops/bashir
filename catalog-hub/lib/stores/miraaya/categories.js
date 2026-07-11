import { miraayaGraphql } from './client.js';

const TREE_QUERY = `
  query CategoryTree {
    categories {
      items {
        id name url_key product_count
        children {
          id name url_key product_count
          children {
            id name url_key product_count
          }
        }
      }
    }
  }
`;

/** أقسام رئيسية ميرايا */
export const MIRAAYA_TOP_CATEGORIES = [
  { id: '51', nameAr: 'المكياج', nameEn: 'Makeup', urlKey: 'Makeup' },
  { id: '52', nameAr: 'العناية بالبشرة', nameEn: 'Skincare', urlKey: 'Skincare' },
  { id: '50', nameAr: 'العناية بالشعر', nameEn: 'Hair Care', urlKey: 'hair-care' },
  { id: '934', nameAr: 'واقي شمس', nameEn: 'Sun Screen', urlKey: 'sun-screen' },
  { id: '1417', nameAr: 'وصل حديثاً', nameEn: 'New Arrivals', urlKey: 'new-arrivalss' },
];

function flattenCategories(nodes = [], parentId = 'root', depth = 1, out = []) {
  for (const node of nodes) {
    if (!node?.id) continue;
    const id = String(node.id);
    out.push({
      id,
      nameAr: String(node.name || ''),
      nameEn: String(node.name || ''),
      parentId,
      depth,
      productCount: Number(node.product_count || 0),
      urlKey: node.url_key || '',
    });
    if (node.children?.length) {
      flattenCategories(node.children, id, depth + 1, out);
    }
  }
  return out;
}

export async function fetchCategoryTree() {
  const cacheKey = 'miraaya:categories:tree';
  try {
    const [arData, enData] = await Promise.all([
      miraayaGraphql(TREE_QUERY, { lang: 'ar', ttl: 30 * 60 * 1000, cacheKey: `${cacheKey}:ar` }),
      miraayaGraphql(TREE_QUERY, { lang: 'en', ttl: 30 * 60 * 1000, cacheKey: `${cacheKey}:en` }),
    ]);

    const arRoot = arData?.categories?.items?.[0];
    const enRoot = enData?.categories?.items?.[0];
    const arLeaves = flattenCategories(arRoot?.children || []);
    const enById = new Map(flattenCategories(enRoot?.children || []).map((c) => [c.id, c]));

    const leaves = arLeaves.map((leaf) => {
      const en = enById.get(leaf.id);
      return {
        ...leaf,
        nameAr: leaf.nameAr,
        nameEn: en?.nameEn || leaf.nameAr,
      };
    });

    if (leaves.length) {
      const tree = [
        { id: 'root', nameAr: 'ميرايا Miraaya', nameEn: 'Miraaya', children: leaves.filter((l) => l.depth === 1).map((l) => l.id) },
        ...leaves,
      ];
      return { tree, leaves };
    }
  } catch (err) {
    console.warn('miraaya categories:', err.message);
  }

  const leaves = MIRAAYA_TOP_CATEGORIES.map((c) => ({
    id: c.id,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
    parentId: 'root',
    depth: 1,
    productCount: 0,
    urlKey: c.urlKey,
  }));

  return {
    tree: [
      { id: 'root', nameAr: 'ميرايا Miraaya', nameEn: 'Miraaya', children: leaves.map((l) => l.id) },
      ...leaves,
    ],
    leaves,
  };
}
