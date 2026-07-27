/** تصنيفات التطبيق — تُقرأ من API وتُحدَّث هنا عند تغيّر الشجرة */
export const CATEGORIES = {
  makeup: 'd3c24d19-dde5-41e5-b0a9-bede45393795',
  perfumes: '975e0e23-edd2-4181-ad6d-ecade6452b95',
  premium: '09f69d8a-f6d4-41f5-8fb5-a3b0e7e302d5',
  care: '9f99dbf3-15c4-4561-8f53-1499a8743a47',
};

export const SUBCATEGORIES = {
  // Perfumes
  menPerfume: '8dca642a-1194-4101-b5cc-486ca1664e89',
  womenPerfume: '1ba9f472-af81-4708-9304-07f3435b6b24',
  unisexPerfume: 'bcbfcf49-4e64-4d25-9c8e-9b9c8387bf8a',
  nichePerfume: '92a95f2e-d855-4943-9875-b85e684f746a',
  newPerfume: '07d0e8c3-3369-47b7-bb34-d430ca4a26d4',
  oudPerfume: '0bb891c1-2aa0-4e4a-ace8-f07f6b53f241',
  bodyPerfume: '453c027d-0022-455b-91a9-d4299479ec62',
  giftSetPerfume: '13754665-184a-48c6-8dd3-b36b9c0e5f28',
  miniPerfume: '59c4dabd-4e87-46e8-a6ce-e5e51a7e901b',
  // Premium
  luxuryMakeup: 'd12c04fd-ad76-420c-81b0-708c020b346b',
  luxuryPerfume: '764abc71-a54c-4aec-9cd8-9869b9afdd0d',
  luxuryCare: '8d0236dc-9c36-4bd7-a0d0-2e78d4d9268a',
  // Makeup
  lips: '56da5b82-c847-4e9b-9cea-cc901236189f',
  face: '2bbecee1-084d-446c-b4fd-65f769130de9',
  eyes: 'be0ba95f-62a6-4245-8012-5f6943ea5cab',
  // Premium
  luxuryPerfume: '764abc71-a54c-4aec-9cd8-9869b9afdd0d',
};

export const TERTIARY = {
  lipTint: '5c279f28-2833-42d7-9211-8f72f2c4522f',
  lipstick: 'eaa06284-281e-475f-937b-b01ee24192df',
  liquidLipstick: 'b53dd3be-ae16-47a4-a306-238f2060b8d8',
};

/** عطور مصممة عادية: جنس + جديد إن لزم. نيش فقط لخطوط الهوت بارفومري */
export function perfumeSubs({ gender = 'men', isNew = false, isNiche = false, isUnisex = false } = {}) {
  const ids = [];
  if (isNiche) ids.push(SUBCATEGORIES.nichePerfume);
  if (isUnisex) {
    ids.push(SUBCATEGORIES.unisexPerfume);
  } else if (gender === 'women') {
    ids.push(SUBCATEGORIES.womenPerfume);
  } else {
    ids.push(SUBCATEGORIES.menPerfume);
  }
  if (isNew) ids.push(SUBCATEGORIES.newPerfume);
  return [...new Set(ids)];
}

/** مكياج شفاه — قسم فرعي + ثانوي حسب النوع */
export function lipMakeupSubs({ type = 'lipTint' } = {}) {
  const tertiary = {
    lipTint: TERTIARY.lipTint,
    lipstick: TERTIARY.lipstick,
    liquidLipstick: TERTIARY.liquidLipstick,
  }[type] || TERTIARY.lipTint;
  return {
    categoryId: CATEGORIES.makeup,
    subcategoryIds: [SUBCATEGORIES.lips],
    tertiaryCategoryIds: [tertiary],
  };
}
