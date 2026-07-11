import { fetchShopHtml } from './client.js';
import { parseCategorySidebar } from './parse.js';
import { splitBilingualText } from '../../core/bilingual.js';

const FALLBACK_CATEGORIES = [
  { id: '6', nameAr: 'عطور', nameEn: 'Perfumes' },
  { id: '35', nameAr: 'مكياج', nameEn: 'Makeup' },
  { id: '19', nameAr: 'مزيل عرق', nameEn: 'Deodorant' },
  { id: '38', nameAr: 'عناية بالفم', nameEn: 'Oral care' },
  { id: '55', nameAr: 'صابون', nameEn: 'Soap' },
  { id: '18', nameAr: 'شامبو ومكيف', nameEn: 'Shampoo' },
  { id: '30', nameAr: 'شور جسم', nameEn: 'Body wash' },
  { id: '28', nameAr: 'العناية بالوجه', nameEn: 'Face Care' },
  { id: '29', nameAr: 'العناية بالجسم', nameEn: 'Body care' },
  { id: '22', nameAr: 'العناية بالشعر', nameEn: 'Hair care' },
  { id: '21', nameAr: 'صبغات للشعر', nameEn: 'Hair color' },
  { id: '180', nameAr: 'صبغات شعر سلكي', nameEn: 'Silky hair color' },
  { id: '84', nameAr: 'صبغات للشعر خالية من الامونيا', nameEn: 'Ammonia-free hair color' },
  { id: '148', nameAr: 'معطر جو', nameEn: 'Air freshener' },
  { id: '149', nameAr: 'منظفات', nameEn: 'Cleaners' },
];

async function loadCategories() {
  try {
    const [arHtml, enHtml] = await Promise.all([
      fetchShopHtml({ lang: 'ar' }),
      fetchShopHtml({ lang: 'en' }),
    ]);
    const arCats = parseCategorySidebar(arHtml);
    const enCats = parseCategorySidebar(enHtml);
    const enMap = new Map(enCats.map((c) => [c.id, c.label]));
    if (arCats.length) {
      return arCats.map((c) => ({
        id: c.id,
        nameAr: c.label,
        nameEn: enMap.get(c.id) || splitBilingualText(c.label, { mode: 'name' }).en || c.label,
      }));
    }
  } catch {
    /* fallback */
  }
  return FALLBACK_CATEGORIES;
}

export async function fetchCategoryTree() {
  const cats = await loadCategories();
  const leaves = cats.map((c) => ({
    id: c.id,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
    parentId: 'root',
    depth: 1,
  }));

  return {
    tree: [
      {
        id: 'root',
        nameAr: 'بيوتي وي Beauty Way',
        nameEn: 'Beauty Way',
        children: leaves.map((l) => l.id),
      },
      ...leaves,
    ],
    leaves,
  };
}
