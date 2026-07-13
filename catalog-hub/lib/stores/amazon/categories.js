import { cacheGet, cacheSet } from '../../core/cache.js';
import {
  AMAZON_ALL_CATEGORY,
  BEAUTY_ROOT_NODE,
  DEFAULT_TTL,
  amazonCredentials,
  paapiRequest,
} from './client.js';
import { mapBrowseNode } from './map.js';

const BEAUTY_CHILDREN = [
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
];

/** أقسام أمازون الرئيسية — https://www.amazon.com/ */
export const AMAZON_SEED_TREE = [
  {
    id: AMAZON_ALL_CATEGORY,
    name: 'جميع الأقسام',
    nameEn: 'All Departments',
    children: [
      {
        id: BEAUTY_ROOT_NODE,
        name: 'الجمال والعناية الشخصية',
        nameEn: 'Beauty & Personal Care',
        children: BEAUTY_CHILDREN,
      },
      { id: '172282', name: 'إلكترونيات', nameEn: 'Electronics' },
      { id: '2335752011', name: 'هواتف وإكسسوارات', nameEn: 'Cell Phones & Accessories' },
      { id: '541966', name: 'كمبيوتر', nameEn: 'Computers' },
      { id: '1055398', name: 'منزل ومطبخ', nameEn: 'Home & Kitchen' },
      { id: '7141123011', name: 'ملابس وأزياء', nameEn: 'Clothing & Fashion' },
      { id: '3375251', name: 'رياضة', nameEn: 'Sports & Outdoors' },
      { id: '165793011', name: 'ألعاب', nameEn: 'Toys & Games' },
      { id: '283155', name: 'كتب', nameEn: 'Books' },
      { id: '16310101', name: 'بقالة', nameEn: 'Grocery' },
      { id: '3760901', name: 'صحة ومنزل', nameEn: 'Health & Household' },
      { id: '2619533011', name: 'حيوانات أليفة', nameEn: 'Pet Supplies' },
      { id: '15690151', name: 'سيارات', nameEn: 'Automotive' },
      { id: '228013', name: 'أدوات وتحسين المنزل', nameEn: 'Tools & Home Improvement' },
      { id: '1064954', name: 'مكتب', nameEn: 'Office Products' },
      { id: '165796011', name: 'أطفال', nameEn: 'Baby' },
      { id: '468642', name: 'ألعاب فيديو', nameEn: 'Video Games' },
      { id: '11091801', name: 'آلات موسيقية', nameEn: 'Musical Instruments' },
      { id: '2972638011', name: 'فناء وحديقة', nameEn: 'Patio & Garden' },
      { id: '16310091', name: 'صناعي', nameEn: 'Industrial & Scientific' },
    ],
  },
];

/** توافق مع الكود القديم */
export const BEAUTY_SEED_TREE = AMAZON_SEED_TREE;

function collectLeaves(nodes = [], out = []) {
  for (const n of nodes) {
    if (n.isLeaf) out.push(n);
    if (n.children?.length) collectLeaves(n.children, out);
  }
  return out;
}

function seedToTree() {
  const root = AMAZON_SEED_TREE[0];
  const rootName = root.name;

  const children = root.children.map((dept) => {
    if (dept.children?.length) {
      const subChildren = dept.children.map((c) => ({
        id: c.id,
        slug: c.id,
        name: c.name,
        nameEn: c.nameEn,
        level: 4,
        isLeaf: true,
        children: [],
        productCount: null,
        path: `${rootName} › ${dept.name} › ${c.name}`,
      }));
      return {
        id: dept.id,
        slug: dept.id,
        name: dept.name,
        nameEn: dept.nameEn,
        level: 3,
        isLeaf: false,
        children: subChildren,
        productCount: null,
        path: `${rootName} › ${dept.name}`,
      };
    }
    return {
      id: dept.id,
      slug: dept.id,
      name: dept.name,
      nameEn: dept.nameEn,
      level: 3,
      isLeaf: true,
      children: [],
      productCount: null,
      path: `${rootName} › ${dept.name}`,
    };
  });

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

  return { tree, leaves: collectLeaves(tree) };
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
  const cacheKey = 'amazon:full-tree';
  const cached = cacheGet(cacheKey, DEFAULT_TTL * 6);
  if (cached) return cached;

  const seeded = seedToTree();
  const creds = amazonCredentials();

  if (creds.configured) {
    try {
      const beautyDept = seeded.tree[0].children.find((c) => c.id === BEAUTY_ROOT_NODE);
      if (beautyDept) {
        const liveChildren = await fetchChildNodes(BEAUTY_ROOT_NODE);
        if (liveChildren.length) {
          const arById = new Map(BEAUTY_CHILDREN.map((c) => [c.id, c]));
          const rootName = seeded.tree[0].name;
          const deptName = beautyDept.name;

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
            child.path = `${rootName} › ${deptName} › ${child.name}`;
            child.level = 4;

            const grands = i < grandBatches.length ? grandBatches[i] : [];
            if (grands.length) {
              child.children = grands.map((g) => ({
                ...g,
                nameEn: g.name,
                path: `${child.path} › ${g.name}`,
                isLeaf: true,
                level: 5,
              }));
              child.isLeaf = false;
            } else {
              child.isLeaf = true;
              child.children = [];
            }
          }
          beautyDept.children = liveChildren;
          beautyDept.isLeaf = false;
          seeded.leaves = collectLeaves(seeded.tree);
        }
      }
    } catch {
      // أبقِ الشجرة المبذورة
    }
  }

  cacheSet(cacheKey, seeded);
  return seeded;
}
