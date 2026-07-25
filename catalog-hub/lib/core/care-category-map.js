import { resolveOverrideCategories } from './care-content-overrides.js';
export const CARE_CATEGORY_ID = '9f99dbf3-15c4-4561-8f53-1499a8743a47';

export const CARE_SUB_SLUGS = {
  'care-derma-hub': '09146169-f9c4-4649-a365-ca1b8cda365f',
  'care-korean-skincare-6': '7d2bfaec-d963-404b-b9b5-04b64a82bf29',
  'care-mouth-teeth-care': 'bbf672bf-58cf-4cd3-8b17-46a7ddcc1c27',
  'care-skin-and-body-care': '23aaaa07-91ee-4937-847e-d7866a9e937a',
  'care-hair-care': '150a633e-80a7-4cb3-8f2d-8eab90a99190',
  'care-face-care': '07661898-571a-4a88-aa6c-76dcdbf53029',
  'care-hand-care': '01ad1f0d-7c15-469c-bf86-85abd135e68f',
  'care-foot-care': '905db637-498a-49bc-83e8-b3d0a335d5b6',
  'care-sun-care': '25dc8086-bffa-47af-aaf7-64d503e58a9f',
  'care-women-care': '6ffcfb0e-645f-47d0-8fb9-4ef88b2b4e60',
  'care-mom-baby': '0daef5a1-9dfb-44ac-89ca-b2ac80dffbef',
  'care-men-care': '01300f8f-9b4d-4d15-904c-e045383c9b97',
};

export const CARE_TERTIARY_SLUGS = {
  'care-korean-skincare-6-skin-care': '2cf78dfc-8e8f-4f48-b75f-59eb445ba269',
  'care-mouth-teeth-care-toothpaste': 'cc1aa9c2-85a2-4776-80b8-e332394e2bad',
  'care-mouth-teeth-care-toothbrush': '8ca9add6-b014-4637-8398-7f50597b7f24',
  'care-mouth-teeth-care-teeth-whitening': '3945cf7d-65c6-49cb-8268-0b71dfb0dc75',
  'care-mouth-teeth-care-flossing-essentials': '1e56bafe-0d29-4442-afd6-aeba39f1c058',
  'care-mouth-teeth-care-mouthwash': 'af91b47d-cfb0-4ee5-b9c3-d1661cc68cc3',
  'care-mouth-teeth-care-mouth-fresheners': '784a2619-a67a-48c0-aa75-f7720953d607',
  'care-skin-and-body-care-shapewear': 'b6a3b2c8-7b2d-450f-9884-493bc3992d3f',
  'care-skin-and-body-care-deodorant': '9464c921-9650-421f-8e2b-6a172f7524c5',
  'care-skin-and-body-care-body-scrub': '15e1a2c3-9924-4fd3-a7d9-b66d9adaddce',
  'care-skin-and-body-care-body-whitening': '5ab05504-516e-4104-a934-6d23666ffdca',
  'care-skin-and-body-care-body-oil': 'a898f04c-03d4-4ab6-baa7-bb64cf0d2e3e',
  'care-skin-and-body-care-body-moisturizer': 'fcd86b22-a0fd-47b9-ba4c-c76164dadab2',
  'care-skin-and-body-care-body-cleansers': '35be991e-3062-4fbd-8f0a-2393bf806524',
  'care-skin-and-body-care-body-powder': '7623cbaa-3a0d-4231-b8d7-283d7c24b2a9',
  'care-skin-and-body-care-shower-essentials': '89c0752d-b2c7-45fe-9e7f-41adccc7e200',
  'care-hair-care-hair-treatment': 'ee39d6a6-5074-43b6-a80c-a7c1b23c3bd1',
  'care-hair-care-hair-brushes-accessories': '50d4a6f9-efc9-4411-9b27-711f93cb754c',
  'care-hair-care-hair-coloring': '04b359b4-e4fb-45d0-aae1-8fef65af84f8',
  'care-hair-care-oil-masks': 'ab7c66e4-4df6-474f-b9d2-dd059dd60bfc',
  'care-hair-care-shampoo-conditioners': '25b4613e-cbf3-47cc-98b1-c94b398d51f4',
  'care-hair-care-hair-styling': 'c508347a-8844-4068-b508-9653ede66b8b',
  'care-face-care-cleansers-toners': '05028a17-da64-4c66-b25f-73c758acc2f8',
  'care-face-care-face-moisturizer': '21801439-d0e9-4106-b5e8-dfdd70ffeb8d',
  'care-face-care-eye-care': '09bedca5-0c6c-4a71-9b03-4bf29cecaf53',
  'care-face-care-face-masks': '5a89a7d0-16d9-47d6-8575-2961289fc526',
  'care-face-care-face-scrubs': '13e79b55-2eba-4289-ba14-4b5e8c32ac85',
  'care-face-care-face-tools': '4e096506-7890-437c-a8a4-6d5a36217f09',
  'care-face-care-lip-care': 'e932381d-8469-4099-b66e-ce1a7eec9b60',
  'care-hand-care-hand-soaps': '37616187-67dc-4ae5-9dc3-06ec3161bfa1',
  'care-hand-care-hand-moisturizer': '3cdb4e43-e28d-4cac-8677-6415ea069d4f',
  'care-hand-care-hand-tools': 'fe8b8c4b-008c-4ac7-a17f-6c96c886210b',
  'care-foot-care-foot-tools': 'd673c77a-0a03-4f06-a73f-af5616313715',
  'care-foot-care-foot-cream': 'd2cf1ce9-fd36-4292-80f3-9fb90c759a3c',
  'care-sun-care-sunscreen': 'ad2a9e6b-5e20-4393-849a-e5e6c6cc97e2',
  'care-sun-care-tanning-oils-lotions': '5c16af2a-c0dd-4a8c-9d52-b28f238bf8b8',
  'care-women-care-pantyliner': '71ef62ac-3e95-4ca9-aa33-a73a8ca0e8be',
  'care-women-care-women-hair-removal': '5d4e7ee3-9107-4beb-b0b5-e5cf81963e13',
  'care-mom-baby-mommy-care': '7ce8e10e-791d-4263-868e-fc4501f61461',
  'care-mom-baby-baby-care': 'fbacb6e2-33ed-4071-ae78-21d77aaa476c',
  'care-men-care-beard-care': '2858a6c7-8a12-4277-a0a3-a06c0b0719d7',
  'care-men-care-shaving-grooming': '1a192be8-a3b7-453b-81ae-b840a69227e9',
  'care-men-care-shaving-machines': '8dd445d7-e0ca-42f7-aa11-97599760eb8a',
};

const KOREAN_BRANDS = [
  'cosrx', 'beauty of joseon', 'anua', 'skin1004', 'torriden', 'laneige', 'innisfree',
  'sulwhasoo', 'missha', 'etude', 'some by mi', 'round lab', 'isntree', 'mixsoon',
  'numbuzin', 'medicube', 'biodance', 'haruharu', 'klairs', 'purito', 'axis-y',
  "i'm from", 'im from', 'beplain', 'tirtir', 'abib', 'dear klairs', 'ekel', 'k-secret',
];

const DERMA_BRANDS = [
  'cerave', 'la roche-posay', 'la roche posay', 'eucerin', 'qv', 'avene', 'avène',
  'bioderma', 'vichy', 'ducray', 'uriage', 'panoxyl', 'embryolisse', 'a-derma',
  'isdin', 'svr', 'topicrem', 'mustela', 'sebamed', 'cetaphil', 'neutrogena',
  'aveeno', 'physiogel', 'bepanthen', 'bepanthol', 'acm', 'roche-posay',
];

const LEAF_SUB_MAP = {
  'care/derma-hub': ['care-derma-hub', 'care-face-care'],
  'care/korean-skincare-6': ['care-korean-skincare-6', 'care-face-care'],
  'care/korean-skincare-6/skin-care': ['care-korean-skincare-6', 'care-face-care'],
  'care/mouth--teeth-care/toothpaste': ['care-mouth-teeth-care'],
  'care/mouth--teeth-care/toothbrush': ['care-mouth-teeth-care'],
  'care/mouth--teeth-care/teeth-whitening': ['care-mouth-teeth-care'],
  'care/mouth--teeth-care/flossing-essentials': ['care-mouth-teeth-care'],
  'care/mouth--teeth-care/mouthwash': ['care-mouth-teeth-care'],
  'care/mouth--teeth-care/mouth-fresheners': ['care-mouth-teeth-care'],
  'care/skin-and-body-care/shapewear': ['care-skin-and-body-care'],
  'care/skin-and-body-care/deodorant': ['care-skin-and-body-care'],
  'care/skin-and-body-care/body-scrub': ['care-skin-and-body-care'],
  'care/skin-and-body-care/body-whitening': ['care-skin-and-body-care'],
  'care/skin-and-body-care/body-oil': ['care-skin-and-body-care'],
  'care/skin-and-body-care/body-moisturizer': ['care-skin-and-body-care', 'care-derma-hub'],
  'care/skin-and-body-care/body-cleansers': ['care-skin-and-body-care'],
  'care/skin-and-body-care/body-powder': ['care-skin-and-body-care'],
  'care/skin-and-body-care/shower-essentials': ['care-skin-and-body-care'],
  'care/hair-care/hair-treatment': ['care-hair-care'],
  'care/hair-care/hair-brushes-accessories': ['care-hair-care'],
  'care/hair-care/hair-coloring': ['care-hair-care'],
  'care/hair-care/oil--masks': ['care-hair-care'],
  'care/hair-care/shampoo-conditioners': ['care-hair-care'],
  'care/hair-care/hair-styling': ['care-hair-care'],
  'care/face-care/cleansers--toners': ['care-face-care', 'care-derma-hub'],
  'care/face-care/face-moisturizer': ['care-face-care', 'care-derma-hub'],
  'care/face-care/eye-care': ['care-face-care', 'care-derma-hub'],
  'care/face-care/face-masks': ['care-face-care', 'care-korean-skincare-6'],
  'care/face-care/face-scrubs': ['care-face-care', 'care-derma-hub'],
  'care/face-care/face-tools': ['care-face-care'],
  'care/face-care/lip-care': ['care-face-care', 'care-korean-skincare-6'],
  'care/hand-care/hand-soaps': ['care-hand-care', 'care-skin-and-body-care'],
  'care/hand-care/hand-moisturizer': ['care-hand-care', 'care-skin-and-body-care', 'care-derma-hub'],
  'care/hand-care/hand-tools': ['care-hand-care'],
  'care/foot-care/foot-tools': ['care-foot-care'],
  'care/foot-care/foot-cream': ['care-foot-care', 'care-skin-and-body-care'],
  'care/sun-care/sunscreen': ['care-sun-care', 'care-face-care', 'care-korean-skincare-6'],
  'care/sun-care/tanning-oils-lotions': ['care-sun-care', 'care-skin-and-body-care'],
  'care/women-care/pantyliner': ['care-women-care'],
  'care/women-care/women-hair-removal': ['care-women-care'],
  'care/mom--baby/mommy-care': ['care-mom-baby'],
  'care/mom--baby/baby-care': ['care-mom-baby'],
  'care/men-care/beard-care': ['care-men-care'],
  'care/men-care/shaving-grooming': ['care-men-care'],
  'care/men-care/shaving-machines': ['care-men-care'],
};

const TYPE_TERTIARY = {
  sunscreen: ['care-sun-care-sunscreen'],
  shampoo: ['care-hair-care-shampoo-conditioners'],
  conditioner: ['care-hair-care-shampoo-conditioners'],
  'hair-mask': ['care-hair-care-oil-masks'],
  'hair-oil': ['care-hair-care-oil-masks'],
  'hair-spray': ['care-hair-care-hair-styling'],
  'heat-protectant': ['care-hair-care-hair-styling'],
  'leave-in': ['care-hair-care-hair-treatment'],
  moisturizer: ['care-face-care-face-moisturizer'],
  cream: ['care-face-care-face-moisturizer'],
  lotion: ['care-face-care-face-moisturizer'],
  serum: ['care-face-care-face-moisturizer'],
  cleanser: ['care-face-care-cleansers-toners'],
  toner: ['care-face-care-cleansers-toners'],
  'acne-wash': ['care-face-care-cleansers-toners'],
  scrub: ['care-face-care-face-scrubs'],
  'face-mask': ['care-face-care-face-masks'],
  patch: ['care-face-care-face-tools'],
  'lip-mask': ['care-face-care-lip-care'],
  'lip-balm': ['care-face-care-lip-care'],
  'eye-cream': ['care-face-care-eye-care'],
  'body-cream': ['care-skin-and-body-care-body-moisturizer'],
  'body-wash': ['care-skin-and-body-care-body-cleansers'],
  deodorant: ['care-skin-and-body-care-deodorant'],
  'hand-cream': ['care-hand-care-hand-moisturizer'],
  toothpaste: ['care-mouth-teeth-care-toothpaste'],
  mouthwash: ['care-mouth-teeth-care-mouthwash'],
  baby: ['care-mom-baby-baby-care'],
  beard: ['care-men-care-beard-care'],
};

function leafToTertiarySlug(leaf = '') {
  if (!leaf || leaf === 'care/derma-hub') return null;
  return leaf.replace(/\//g, '-').replace(/--+/g, '-');
}

function inferSubsFromPath(path = '') {
  if (path.includes('face-care') || path.includes('derma')) return ['care-face-care'];
  if (path.includes('hair-care')) return ['care-hair-care'];
  if (path.includes('sun-care')) return ['care-sun-care'];
  if (path.includes('body-care') || path.includes('skin-and-body')) return ['care-skin-and-body-care'];
  if (path.includes('korean')) return ['care-korean-skincare-6', 'care-face-care'];
  if (path.includes('men-care')) return ['care-men-care'];
  if (path.includes('mom') || path.includes('baby')) return ['care-mom-baby'];
  if (path.includes('mouth') || path.includes('teeth')) return ['care-mouth-teeth-care'];
  if (path.includes('hand-care')) return ['care-hand-care'];
  if (path.includes('foot-care')) return ['care-foot-care'];
  if (path.includes('women-care')) return ['care-women-care'];
  return ['care-face-care'];
}

function slugsToIds(slugs, map) {
  return [...new Set(slugs.map((s) => map[s]).filter(Boolean))];
}

function normBrand(text = '') {
  return String(text).toLowerCase().replace(/['']/g, '').trim();
}

function matchesBrandList(text = '', list = []) {
  const n = normBrand(text);
  return list.some((b) => n.includes(b) || b.includes(n));
}

function isFaceType(typeKey = '') {
  return ['serum', 'toner', 'cleanser', 'moisturizer', 'cream', 'face-mask', 'eye-cream', 'scrub', 'sunscreen', 'acne-wash', 'lip-mask', 'lip-balm', 'lotion'].includes(typeKey);
}

function isBodyType(typeKey = '') {
  return ['deodorant', 'body-wash', 'body-cream'].includes(typeKey);
}

function isHairType(typeKey = '') {
  return ['shampoo', 'conditioner', 'hair-mask', 'hair-oil', 'hair-spray', 'heat-protectant', 'leave-in'].includes(typeKey);
}

export function resolveCareSubcategorySlugs(niceoneLeaf, ctx = {}) {
  const slugs = new Set(LEAF_SUB_MAP[niceoneLeaf] || inferSubsFromPath(niceoneLeaf));
  const brandText = [ctx.brandEn, ctx.brandAr, ctx.posName].filter(Boolean).join(' ');
  const typeKey = ctx.typeKey || '';

  if (matchesBrandList(brandText, KOREAN_BRANDS)) {
    slugs.add('care-korean-skincare-6');
    if (isFaceType(typeKey) || niceoneLeaf.includes('korean') || niceoneLeaf.includes('face') || niceoneLeaf.includes('derma')) {
      slugs.add('care-face-care');
    }
  }

  if (matchesBrandList(brandText, DERMA_BRANDS)) {
    slugs.add('care-derma-hub');
    if (isFaceType(typeKey) || niceoneLeaf.includes('face') || niceoneLeaf.includes('derma')) slugs.add('care-face-care');
    if (isBodyType(typeKey) || niceoneLeaf.includes('body') || niceoneLeaf.includes('skin-and-body')) slugs.add('care-skin-and-body-care');
  }

  if (typeKey === 'sunscreen') {
    slugs.add('care-sun-care');
    slugs.add('care-face-care');
  }

  if (typeKey === 'hand-cream' || niceoneLeaf.includes('hand-care')) slugs.add('care-hand-care');
  if (isHairType(typeKey) || niceoneLeaf.includes('hair-care')) {
    slugs.add('care-hair-care');
    slugs.delete('care-face-care');
    slugs.delete('care-sun-care');
  }

  if (niceoneLeaf.includes('mouth') || niceoneLeaf.includes('teeth')) slugs.add('care-mouth-teeth-care');
  if (niceoneLeaf.includes('men-care')) slugs.add('care-men-care');
  if (niceoneLeaf.includes('mom') || niceoneLeaf.includes('baby')) slugs.add('care-mom-baby');
  if (niceoneLeaf.includes('women-care')) slugs.add('care-women-care');
  if (niceoneLeaf.includes('foot-care')) slugs.add('care-foot-care');

  return [...slugs];
}

export function resolveCareTertiarySlugs(niceoneLeaf, ctx = {}) {
  const slugs = new Set();
  const typeKey = ctx.typeKey || '';
  const brandText = [ctx.brandEn, ctx.brandAr, ctx.posName].filter(Boolean).join(' ');

  const leafTertiary = leafToTertiarySlug(niceoneLeaf);
  if (leafTertiary && CARE_TERTIARY_SLUGS[leafTertiary]) slugs.add(leafTertiary);

  if (niceoneLeaf === 'care/derma-hub' || niceoneLeaf === 'care/korean-skincare-6/skin-care') {
    for (const t of TYPE_TERTIARY[typeKey] || ['care-face-care-face-moisturizer']) slugs.add(t);
    if (niceoneLeaf.includes('korean')) slugs.add('care-korean-skincare-6-skin-care');
  }

  if (matchesBrandList(brandText, KOREAN_BRANDS) && (niceoneLeaf.includes('korean') || niceoneLeaf.includes('face') || niceoneLeaf.includes('derma'))) {
    slugs.add('care-korean-skincare-6-skin-care');
  }

  if (typeKey === 'sunscreen') slugs.add('care-sun-care-sunscreen');
  if (typeKey === 'eye-cream') slugs.add('care-face-care-eye-care');
  if (typeKey === 'lip-mask' || typeKey === 'lip-balm') slugs.add('care-face-care-lip-care');
  if (typeKey === 'face-mask') slugs.add('care-face-care-face-masks');
  if (typeKey === 'hand-cream') slugs.add('care-hand-care-hand-moisturizer');

  if (isHairType(typeKey)) {
    slugs.delete('care-face-care-face-moisturizer');
    slugs.delete('care-face-care-cleansers-toners');
    slugs.delete('care-korean-skincare-6-skin-care');
  }

  return [...slugs].filter((s) => CARE_TERTIARY_SLUGS[s]);
}

export function resolveCareCategories(niceoneLeaf, ctx = {}) {
  const overrideCats = ctx.barcode ? resolveOverrideCategories(ctx.barcode) : null;
  if (overrideCats?.subcategorySlugs?.length) {
    return {
      subcategoryIds: slugsToIds(overrideCats.subcategorySlugs, CARE_SUB_SLUGS),
      tertiaryCategoryIds: slugsToIds(overrideCats.tertiarySlugs || [], CARE_TERTIARY_SLUGS),
    };
  }

  const subcategoryIds = slugsToIds(resolveCareSubcategorySlugs(niceoneLeaf, ctx), CARE_SUB_SLUGS);
  const tertiaryCategoryIds = slugsToIds(resolveCareTertiarySlugs(niceoneLeaf, ctx), CARE_TERTIARY_SLUGS);
  return { subcategoryIds, tertiaryCategoryIds };
}

export function subcategoryIdsForLeaf(niceoneLeaf, ctx = {}) {
  return resolveCareCategories(niceoneLeaf, ctx).subcategoryIds;
}

export function tertiaryCategoryIdsForLeaf(niceoneLeaf, ctx = {}) {
  return resolveCareCategories(niceoneLeaf, ctx).tertiaryCategoryIds;
}

export function collectCareLeaves(categoriesJson) {
  const leaves = [];
  const roots = categoriesJson.tree || categoriesJson.categories || categoriesJson;
  const walk = (nodes = []) => {
    for (const node of nodes) {
      if (!node.niceoneId?.startsWith('care')) continue;
      if (node.children?.length) walk(node.children);
      else leaves.push(node.niceoneId);
    }
  };
  walk(Array.isArray(roots) ? roots : [roots]);
  return [...new Set(leaves)];
}
