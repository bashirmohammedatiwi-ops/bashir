/** شجرة أقسام FACES — cgid من SFCC Search-Show */
export const FACES_CATEGORIES = [
  { id: 'perfume', nameAr: 'العطور', nameEn: 'Fragrances' },
  { id: 'makeup', nameAr: 'المكياج', nameEn: 'Makeup' },
  { id: 'skincare', nameAr: 'البشرة', nameEn: 'Skincare' },
  { id: 'haircare', nameAr: 'الشعر', nameEn: 'Hair' },
  { id: 'body-care', nameAr: 'الجسم', nameEn: 'Body' },
  { id: 'men-beauty-products', nameAr: 'للرجال', nameEn: 'Men' },
  { id: 'gifts', nameAr: 'مجموعات الهدايا', nameEn: 'Gifts' },
  { id: 'bestsellers', nameAr: 'الأكثر مبيعاً', nameEn: 'Bestsellers' },
];

export async function fetchCategoryTree() {
  const leaves = FACES_CATEGORIES.map((c) => ({
    id: c.id,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
    parentId: 'root',
    depth: 1,
  }));

  const tree = [
    {
      id: 'root',
      nameAr: 'وجوه FACES',
      nameEn: 'FACES',
      children: leaves.map((l) => l.id),
    },
    ...leaves,
  ];

  return { tree, leaves };
}
