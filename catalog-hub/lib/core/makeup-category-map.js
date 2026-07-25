import { CATEGORIES, SUBCATEGORIES, TERTIARY } from './app-categories.js';

/** تعيين يدوي: قسم نايس وان → أقسام التطبيق */
const LEAF_MAP = {
  'makeup/face/foundation': { sub: 'face' },
  'makeup/face/concealers-and-correctors': { sub: 'face' },
  'makeup/face/powder': { sub: 'face' },
  'makeup/face/face-primer': { sub: 'face' },
  'makeup/face/makeup-spray': { sub: 'face' },
  'makeup/face/bb--cc-cream': { sub: 'face' },
  'makeup/face/face-sets': { sub: 'face' },
  'makeup/face/makeup-removers': { sub: 'face' },
  'makeup/korean-makeup-1': { sub: 'face' },
  'makeup/lips/lip-tint': { sub: 'lips', tertiary: 'lipTint' },
  'makeup/lips/lipstick': { sub: 'lips', tertiary: 'lipstick' },
  'makeup/lips/liquid-lipstick': { sub: 'lips', tertiary: 'liquidLipstick' },
  'makeup/lips/lip-gloss': { sub: 'lips' },
  'makeup/lips/lip-liner': { sub: 'lips' },
  'makeup/lips/lip-sets': { sub: 'lips' },
  'makeup/eyes/mascara': { sub: 'eyes' },
  'makeup/eyes/eyeliner': { sub: 'eyes' },
  'makeup/eyes/eyeshadow': { sub: 'eyes' },
  'makeup/eyes/eye-primer': { sub: 'eyes' },
  'makeup/eyebrow/eyebrow-gel': { sub: 'eyes' },
  'makeup/eyebrow/eyebrow-pencil': { sub: 'eyes' },
  'makeup/eyebrow/eyebrow-mascara': { sub: 'eyes' },
  'makeup/eyebrow/eyebrow-sets': { sub: 'eyes' },
  'makeup/cheek/blush': { sub: 'face' },
  'makeup/cheek/contour': { sub: 'face' },
  'makeup/cheek/bronzer': { sub: 'face' },
  'makeup/highlighter/powder-highlighter': { sub: 'face' },
  'makeup/highlighter/liquid-highlighter': { sub: 'face' },
  'makeup/highlighter/palette--set': { sub: 'face' },
  'makeup/brushes--tools/face-brushes': { sub: 'face' },
  'makeup/brushes--tools/eye-brushes': { sub: 'eyes' },
  'makeup/brushes--tools/eyebrow-brushes': { sub: 'eyes' },
  'makeup/brushes--tools/lip-brushes': { sub: 'lips' },
  'makeup/brushes--tools/sponges': { sub: 'face' },
  'makeup/brushes--tools/brush-sets': { sub: 'face' },
  'makeup/brushes--tools/makeup-tools': { sub: 'face' },
};

const SUB_ID = {
  face: SUBCATEGORIES.face,
  eyes: SUBCATEGORIES.eyes,
  lips: SUBCATEGORIES.lips,
};

const TERTIARY_ID = {
  lipTint: TERTIARY.lipTint,
  lipstick: TERTIARY.lipstick,
  liquidLipstick: TERTIARY.liquidLipstick,
};

export function collectMakeupLeaves(categoriesJson) {
  const leaves = [];
  const roots = categoriesJson.tree || categoriesJson.categories || categoriesJson;
  const walk = (nodes = [], underMakeup = false) => {
    for (const node of nodes) {
      const id = node.niceoneId || '';
      const inMakeup = underMakeup || id === 'makeup' || id.startsWith('makeup/');
      if (!inMakeup) continue;
      if (node.children?.length) walk(node.children, true);
      else if (id.startsWith('makeup/')) leaves.push(id);
    }
  };
  walk(Array.isArray(roots) ? roots : [roots]);
  return [...new Set(leaves)];
}

function inferFromText(text = '') {
  const t = text.toLowerCase();
  if (/lip|شفاه|أحمر شفاه|lipstick|gloss|tint/.test(t)) return { sub: 'lips' };
  if (/mascara|eyeshadow|eyeliner|eye|عيون|رموش|ظلال|حواجب|brow/.test(t)) return { sub: 'eyes' };
  return { sub: 'face' };
}

/** تصنيف يدوي حسب قسم نايس وان مع احتياطي من النص */
export function resolveMakeupCategories(leaf, detail = {}) {
  const mapped = LEAF_MAP[leaf] || inferFromText(`${detail.nameAr || ''} ${detail.nameEn || ''} ${detail.category || ''}`);
  const subcategoryIds = [SUB_ID[mapped.sub] || SUBCATEGORIES.face];
  const tertiaryCategoryIds = mapped.tertiary && TERTIARY_ID[mapped.tertiary]
    ? [TERTIARY_ID[mapped.tertiary]]
    : [];
  return {
    categoryId: CATEGORIES.makeup,
    subcategoryIds,
    tertiaryCategoryIds,
    makeupSub: mapped.sub,
    leaf,
  };
}

export { CATEGORIES as MAKEUP_ROOT_CATEGORY };
