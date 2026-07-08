import { cacheGet, cacheSet } from '../../core/cache.js';
import {
  BEAUTY_ROOT_NODE,
  DEFAULT_TTL,
  amazonCredentials,
  paapiRequest,
} from './client.js';
import { mapBrowseNode } from './map.js';

/**
 * شجرة Beauty الثابتة + أبناء حيّة من PA-API عند توفر المفاتيح.
 * المصدر: https://www.amazon.com/b?node=3760911
 */
export const BEAUTY_SEED_TREE = [
  {
    id: '3760911',
    name: 'الجمال والعناية الشخصية',
    nameEn: 'Beauty & Personal Care',
    children: [
      { id: '11058281', name: 'مكياج', nameEn: 'Makeup' },
      { id: '11060451', name: 'بشرة', nameEn: 'Skin Care' },
      { id: '11057241', name: 'شعر', nameEn: 'Hair Care' },
      { id: '11056381', name: 'عطور', nameEn: 'Fragrance' },
      { id: '3777891', name: 'أدوات وعناية شخصية', nameEn: 'Tools & Accessories' },
      { id: '3778591', name: 'رجال', nameEn: "Men's Grooming" },
      { id: '11062741', name: 'أظافر', nameEn: 'Nail Care' },
      { id: '10677469011', name: 'عناية فموية', nameEn: 'Oral Care' },
      { id: '3777331', name: 'استحمام وجسم', nameEn: 'Bath & Body' },
      { id: '11058331', name: 'عيون', nameEn: 'Eye Makeup' },
      { id: '11058691', name: 'شفاه', nameEn: 'Lip Makeup' },
      { id: '11059831', name: 'وجه', nameEn: 'Face Makeup' },
    ],
  },
];

function seedToTree() {
  const root = BEAUTY_SEED_TREE[0];
  const children = root.children.map((c) => mapBrowseNode({
    Id: c.id,
    DisplayName: c.name,
  }, []));
  for (let i = 0; i < children.length; i++) {
    children[i].name = root.children[i].name;
    children[i].nameEn = root.children[i].nameEn;
    children[i].path = `${root.name} › ${root.children[i].name}`;
    children[i].isLeaf = true;
    children[i].level = 3;
  }
  const tree = [{
    id: root.id,
    slug: root.id,
    name: root.name,
    nameEn: root.nameEn,
    level: 2,
    isLeaf: false,
    children,
    productCount: null,
    path: root.name,
  }];
  return { tree, leaves: children };
}

function collectLeaves(nodes = [], out = []) {
  for (const n of nodes) {
    if (n.isLeaf) out.push(n);
    if (n.children?.length) collectLeaves(n.children, out);
  }
  return out;
}

async function fetchChildNodes(parentId) {
  try {
    const data = await paapiRequest('GetBrowseNodes', {
      BrowseNodeIds: [String(parentId)],
      Resources: [
        'BrowseNodes.Ancestor',
        'BrowseNodes.Children',
      ],
      LanguagesOfPreference: ['en_US'],
    }, { ttl: DEFAULT_TTL * 6, cacheKey: `amazon:browsenode:${parentId}` });

    const node = data?.BrowseNodesResult?.BrowseNodes?.[0];
    const children = node?.Children || [];
    return children.map((c) => mapBrowseNode(c, []));
  } catch {
    return [];
  }
}

export async function fetchCategoryTree() {
  const cacheKey = 'amazon:beauty-tree';
  const cached = cacheGet(cacheKey, DEFAULT_TTL * 6);
  if (cached) return cached;

  const seeded = seedToTree();
  const creds = amazonCredentials();

  // إن توفرت المفاتيح، أثْرِ الأقسام الرئيسية + أحفادها من Amazon
  if (creds.configured) {
    try {
      const liveChildren = await fetchChildNodes(BEAUTY_ROOT_NODE);
      if (liveChildren.length) {
        const arById = new Map(
          BEAUTY_SEED_TREE[0].children.map((c) => [c.id, c]),
        );
        const rootName = BEAUTY_SEED_TREE[0].name;

        // اجلب مستوى أعمق بالتوازي (حد أقصى 8 أقسام) لتغطية أوسع في الزحف
        const deepTargets = liveChildren.slice(0, 8);
        const grandBatches = await Promise.all(
          deepTargets.map((c) => fetchChildNodes(c.id).catch(() => [])),
        );

        for (let i = 0; i < liveChildren.length; i++) {
          const child = liveChildren[i];
          const seed = arById.get(child.id);
          if (seed) {
            child.name = seed.name;
            child.nameEn = seed.nameEn || child.nameEn;
          } else {
            child.nameEn = child.name;
          }
          child.path = `${rootName} › ${child.name}`;
          child.level = 3;

          const grands = i < grandBatches.length ? grandBatches[i] : [];
          if (grands.length) {
            child.children = grands.map((g) => ({
              ...g,
              nameEn: g.name,
              path: `${child.path} › ${g.name}`,
              isLeaf: true,
              level: 4,
            }));
            child.isLeaf = false;
          } else {
            child.isLeaf = true;
            child.children = [];
          }
        }
        seeded.tree[0].children = liveChildren;
        seeded.leaves = collectLeaves(seeded.tree);
      }
    } catch {
      // أبقِ الشجرة المبذورة
    }
  }

  cacheSet(cacheKey, seeded);
  return seeded;
}
