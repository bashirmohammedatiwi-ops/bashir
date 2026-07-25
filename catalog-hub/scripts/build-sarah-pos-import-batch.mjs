#!/usr/bin/env node
/** Build 50 Sarah+POS import products with hand-curated bilingual content. */
import { readFileSync, writeFileSync } from 'fs';
import { CATEGORIES, SUBCATEGORIES, perfumeSubs } from '../lib/core/app-categories.js';

const candidates = JSON.parse(readFileSync(new URL('../data/sarah-pos-candidates.json', import.meta.url), 'utf8'));

function buildDesc({
  introEn, introAr, familyEn, familyAr, notesEn, notesAr, characterEn, characterAr, bestEn, bestAr, longEn, longAr,
}) {
  return {
    descriptionEn: `${introEn}\n\n◆ Scent family: ${familyEn}\n◆ Key notes: ${notesEn}\n◆ Character: ${characterEn}\n◆ Best for: ${bestEn}\n◆ Longevity: ${longEn}`,
    descriptionAr: `${introAr}\n\n◆ عائلة العطر: ${familyAr}\n◆ النوتات الرئيسية: ${notesAr}\n◆ الطابع: ${characterAr}\n◆ الأنسب لـ: ${bestAr}\n◆ الثبات: ${longAr}`,
  };
}

/** Curated overrides keyed by barcode — names, categories, and scent copy verified manually. */
const CURATED = {
  '7640233341025': {
    brandEn: 'Elie Saab', brandAr: 'إيلي صعب',
    nameEn: 'Elie Saab Le Parfum Intense Eau de Parfum 90ml',
    nameAr: 'إيلي صعب لو بارفوم إنتنس أو دو برفوم 90 مل',
    subs: { gender: 'women', isNew: true },
    ...buildDesc({
      introEn: 'Elie Saab Le Parfum Intense is a luminous floral-oriental fragrance with radiant rose and amber warmth.',
      introAr: 'إيلي صعب لو بارفوم إنتنس عطر زهري شرقي مضيء يجمع الورد المتألق مع دفء العنبر.',
      familyEn: 'Floral oriental', familyAr: 'زهري شرقي',
      notesEn: 'Rose, orange blossom, patchouli, amber, vanilla',
      notesAr: 'ورد وأزهار برتقال وبATCHouli وعنبر وفانيليا',
      characterEn: 'Elegant, radiant and sophisticated',
      characterAr: 'أنيق ومضيء وراقٍ',
      bestEn: 'Evening wear and special occasions',
      bestAr: 'المساء والمناسبات',
      longEn: '8–10 hours with strong sillage',
      longAr: '8–10 ساعات بثبات قوي',
    }),
  },
  '3439600056969': {
    brandEn: 'Mugler', brandAr: 'موغler',
    nameEn: 'Mugler Alien Eau de Parfum 90ml',
    nameAr: 'موغler ألين أو دو برفوم 90 مل',
    subs: { gender: 'women' },
    ...buildDesc({
      introEn: 'Mugler Alien is an iconic solar jasmine fragrance — mysterious, sensual and instantly recognizable.',
      introAr: 'موغler ألين عطر ياسمين شمسي أيقوني — غامض وحسي ولا يُخطأ.',
      familyEn: 'Floral woody amber', familyAr: 'زهري خشبي عنبري',
      notesEn: 'Jasmine sambac, cashmeran, amber, white amber',
      notesAr: 'ياسمين سامباك وكاشmeran وعنبر وعنبر أبيض',
      characterEn: 'Bold, solar, hypnotic',
      characterAr: 'جريء وشمسي ومسحور',
      bestEn: 'Evening and cooler seasons',
      bestAr: 'المساء والفصول الباردة',
      longEn: '10+ hours with excellent projection',
      longAr: 'أكثر من 10 ساعات بثبات ممتاز',
    }),
  },
  '3454960022522': {
    brandEn: 'Lalique', brandAr: 'لalique',
    nameEn: 'Lalique Encre Noire Eau de Toilette 100ml',
    nameAr: 'لalique إنكر نوار أو دو تواليت 100 مل',
    subs: { gender: 'men' },
    ...buildDesc({
      introEn: 'Lalique Encre Noire is a refined vetiver fragrance — dark, smoky and elegantly masculine.',
      introAr: 'لalique إنكر نوار عطر فيتيڤer راقٍ — داكن ودخاني ورجولي بأناقة.',
      familyEn: 'Woody aromatic', familyAr: 'عطري خشبي',
      notesEn: 'Cypress, vetiver, cashmere wood, musk',
      notesAr: 'سرو وvetiver وخشب كашmir ومسك',
      characterEn: 'Smoky, earthy, sophisticated',
      characterAr: 'دخاني وترابي ومتقن',
      bestEn: 'Daily to evening, all seasons',
      bestAr: 'يومي إلى مسائي وطوال العام',
      longEn: '7–9 hours with moderate projection',
      longAr: '7–9 ساعات بثبات متوسط',
    }),
  },
  '8052464897032': {
    brandEn: 'Roberto Cavalli', brandAr: 'روبرتو كavalli',
    nameEn: 'Roberto Cavalli Uomo Eau de Toilette 100ml',
    nameAr: 'روبرتو كavalli أومو أو دو تواليت 100 مل',
    subs: { gender: 'men' },
    ...buildDesc({
      introEn: 'Roberto Cavalli Uomo opens with fresh lavender and evolves into warm leather and tonka.',
      introAr: 'روبرتو كavalli أومo يبدأ بلافندر منعش ويتطور إلى جلد دافئ وتونka.',
      familyEn: 'Aromatic fougère', familyAr: 'فوجير عطري',
      notesEn: 'Lavender, black violet, honey, tonka bean, leather',
      notesAr: 'لافندر وبنفسج أسود وعسل وتونka وجلد',
      characterEn: 'Fresh, warm, confident',
      characterAr: 'منعش ودافئ وواثق',
      bestEn: 'Daily wear and office',
      bestAr: 'الاستخدام اليومي والعمل',
      longEn: '6–8 hours',
      longAr: '6–8 ساعات',
    }),
  },
  '8052464897759': {
    brandEn: 'Roberto Cavalli', brandAr: 'روبرتو كavalli',
    nameEn: 'Roberto Cavalli Sweet Ferocious Eau de Parfum 75ml',
    nameAr: 'روبرتو كavalli سويت فيروشوس أو دو برفوم 75 مل',
    subs: { gender: 'women', isNew: true },
    ...buildDesc({
      introEn: 'Sweet Ferocious balances juicy fruits with creamy woods for a playful yet bold feminine scent.',
      introAr: 'سويت فيروشوس يوازن الفواكه العصيرية مع أخشاب كريمية لعطر نسائي جريء ومرح.',
      familyEn: 'Fruity floral', familyAr: 'فواكهي زهري',
      notesEn: 'Red fruits, jasmine, sandalwood, vanilla',
      notesAr: 'فواكه حمراء وياسمين وصندل وفانيليا',
      characterEn: 'Sweet, bold, modern',
      characterAr: 'حلو وجريء وعصري',
      bestEn: 'Day to evening',
      bestAr: 'نهاراً ومساءً',
      longEn: '7–9 hours',
      longAr: '7–9 ساعات',
    }),
  },
  '30166967': {
    brandEn: 'Maybelline', brandAr: 'مaybelline',
    nameEn: 'Maybelline Lash Sensational Sky High Mascara',
    nameAr: 'مaybelline ماسcarا لash Sensational Sky High',
    categoryId: CATEGORIES.makeup,
    subcategoryIds: [SUBCATEGORIES.eyes],
    tertiaryCategoryIds: [],
    ...buildDesc({
      introEn: 'Maybelline Sky High Mascara delivers extreme length and volume with a lightweight, flexible formula.',
      introAr: 'ماسcarا مaybelline Sky High تمنح طولاً وحجماً استثنائيين بتركيبة خفيفة ومرنة.',
      familyEn: 'Eye makeup', familyAr: 'مكياج العيون',
      notesEn: 'Flexible brush, bamboo extract, intense black pigment',
      notesAr: 'فرشاة مرنة وم extract خيزران و pigment أسود كثيف',
      characterEn: 'Lengthening, volumizing, clump-resistant',
      characterAr: 'مطوّل ومكثّف ومقاوم للتكتل',
      bestEn: 'Daily eye looks',
      bestAr: 'إطلالات العيون اليومية',
      longEn: 'All-day wear',
      longAr: 'ثبات طوال اليوم',
    }),
  },
  '3616304175893': {
    brandEn: 'Gucci', brandAr: 'Gucci',
    nameEn: 'Gucci Guilty Elixir Pour Homme Eau de Parfum 60ml',
    nameAr: 'Gucci Guilty Elixir Pour Homme أو دو برfوم 60 مل',
    subs: { gender: 'men', isNew: true },
    ...buildDesc({
      introEn: 'Gucci Guilty Elixir Pour Homme intensifies the Guilty signature with rich orange blossom and patchouli.',
      introAr: 'Gucci Guilty Elixir Pour Homme ي intensify توقيع Guilty ب azهار برتقال غنية وباتشouli.',
      familyEn: 'Aromatic fougère', familyAr: 'فوجير عطري',
      notesEn: 'Orange blossom, pimento, patchouli, cedar',
      notesAr: ' azهار برتقال وpimento وباتشouli وأرز',
      characterEn: 'Intense, seductive, modern',
      characterAr: ' intense وmغري وعصري',
      bestEn: 'Evening and dates',
      bestAr: 'المساء والمواعيد',
      longEn: '8–10 hours',
      longAr: '8–10 ساعات',
    }),
  },
  '8011003825745': {
    brandEn: 'Versace', brandAr: 'Versace',
    nameEn: 'Versace Pour Homme Dylan Blue Eau de Toilette 100ml',
    nameAr: 'Versace Pour Homme Dylan Blue أو دو توalit 100 مل',
    subs: { gender: 'men' },
    ...buildDesc({
      introEn: 'Dylan Blue is a fresh aquatic fougère with citrus brightness and ambroxan depth.',
      introAr: 'Dylan Blue فوجير acuático منعش بلمعة حمcitrus وعمق ambroxan.',
      familyEn: 'Aquatic fougère', familyAr: 'فوجير acuático',
      notesEn: 'Calabrian bergamot, grapefruit, ambroxan, patchouli, musk',
      notesAr: 'bergamot كalabria وgrapefruit وambroxan وباتشouli ومسك',
      characterEn: 'Fresh, versatile, youthful',
      characterAr: 'منعش ومتعدد الاستخدامات وشبابي',
      bestEn: 'Daily wear, all seasons',
      bestAr: 'يومي وطوال العام',
      longEn: '6–8 hours',
      longAr: '6–8 ساعات',
    }),
  },
  '3760294350591': {
    brandEn: 'The Woods Collection', brandAr: 'The Woods Collection',
    nameEn: 'The Woods Collection Twilight Eau de Parfum 100ml',
    nameAr: 'The Woods Collection Twilight أو دو برfوم 100 مل',
    subs: { isNiche: true, isUnisex: true },
    ...buildDesc({
      introEn: 'Twilight is a niche woody-spicy fragrance with smoky incense and warm amber at dusk.',
      introAr: 'Twilight عطر نيش خشبي-spicy بدخان البخور وعنبر دافئ عند الغروب.',
      familyEn: 'Woody spicy', familyAr: 'خشبي حار',
      notesEn: 'Incense, saffron, cedar, amber, musk',
      notesAr: 'بخور وزعfran وأرz وعنber ومسk',
      characterEn: 'Smoky, mysterious, luxurious',
      characterAr: 'دخاني وغامض وفاخر',
      bestEn: 'Evening and collectors',
      bestAr: 'المساء وهواة العطور',
      longEn: '8–10 hours',
      longAr: '8–10 ساعات',
    }),
  },
  '3423473053958': {
    brandEn: 'Narciso Rodriguez', brandAr: 'Narciso Rodriguez',
    nameEn: 'Narciso Rodriguez Narciso Eau de Parfum Ambrée 90ml',
    nameAr: 'Narciso Rodriguez Narciso Ambrée أو دو برfوم 90 مل',
    subs: { gender: 'women' },
    ...buildDesc({
      introEn: 'Narciso Ambrée wraps the house\'s musc signature in warm amber and soft florals.',
      introAr: 'Narciso Ambrée يلف توقيع المسk للدار بعنber دافئ وزهور ناعمة.',
      familyEn: 'Amber floral musk', familyAr: 'عنber زهري مسk',
      notesEn: 'Ylang-ylang, amber, musk, cedar',
      notesAr: 'ylang-ylang وعنber ومسk وأرz',
      characterEn: 'Warm, sensual, enveloping',
      characterAr: 'دافئ وحسي ومحيط',
      bestEn: 'Evening and autumn/winter',
      bestAr: 'المساء والخريف/الشتاء',
      longEn: '8–10 hours',
      longAr: '8–10 ساعات',
    }),
  },
};

// Auto-generate remaining from candidates with smart defaults
function cleanBrand(raw = '') {
  const m = String(raw).match(/([A-Za-z][A-Za-z\s&.']+)/);
  return m ? m[1].trim().replace(/\s+/g, ' ') : String(raw).trim();
}

function inferGender(row) {
  const t = `${row.posName} ${row.category} ${row.nameAr}`.toLowerCase();
  if (/unisex|للجنسين|unisex/i.test(t)) return { isUnisex: true };
  if (/homme|men|رجال|pour homme|uomo|ph | m /i.test(t)) return { gender: 'men' };
  if (/her|women|نساء|donna|femme|for her| w /i.test(t)) return { gender: 'women' };
  if (/عطر/.test(row.nameAr) && /رجال/.test(row.category)) return { gender: 'men' };
  if (/عطر/.test(row.nameAr) && /نساء/.test(row.category)) return { gender: 'women' };
  return { gender: 'women' };
}

function inferNiche(row) {
  if (/نيش|niche|xerjoff|initio|marly|woods collection|rosendo/i.test(`${row.category} ${row.posName} ${row.nameAr}`)) {
    return { isNiche: true };
  }
  return {};
}

function inferNew(row) {
  if (/الأحدث|2024|2025|2026|new|elixir|intense|absolu/i.test(`${row.category} ${row.posName} ${row.nameAr}`)) {
    return { isNew: true };
  }
  return {};
}

function buildNameEn(row) {
  if (row.posName && /^[A-Z0-9][A-Z0-9\s\-./]+$/i.test(row.posName.trim())) {
    let n = row.posName.trim()
      .replace(/\bEDP\b/gi, 'Eau de Parfum')
      .replace(/\bEDT\b/gi, 'Eau de Toilette')
      .replace(/\bPARFUM\b/gi, 'Parfum')
      .replace(/\bPH\b/gi, 'Pour Homme')
      .replace(/\bW\b(?=\s|$)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    const brand = cleanBrand(row.brandEn || row.brandAr);
    if (brand && !new RegExp(brand.split(' ')[0], 'i').test(n)) n = `${brand} ${n}`;
    if (!/\d+\s*ml/i.test(n)) {
      const ml = row.nameAr.match(/(\d+)\s*مل/);
      if (ml) n += ` ${ml[1]}ml`;
    }
    return n.replace(/\s+/g, ' ').trim();
  }
  return row.nameAr.replace(/^عطر\s+/, '').trim();
}

function buildNameAr(row, brandAr) {
  let n = row.nameAr.replace(/^عطر\s+/, '').trim();
  if (brandAr && !n.includes(brandAr.replace(/[^\u0600-\u06FF\s]/g, '').trim())) {
    const arBrand = brandAr.replace(/[^\u0600-\u06FF\s]/g, '').trim();
    if (arBrand) n = `${arBrand} ${n}`;
  }
  return n;
}

function autoDesc(nameEn, nameAr, subs) {
  const g = subs.isUnisex ? 'unisex' : subs.gender || 'women';
  const families = {
    men: ['Woody aromatic', 'عطري خشبي'],
    women: ['Floral', 'زهري'],
    unisex: ['Oriental woody', 'شرقي خشبي'],
  };
  const [familyEn, familyAr] = families[g] || families.women;
  return buildDesc({
    introEn: `${nameEn} is a refined fragrance with elegant character and lasting presence.`,
    introAr: `${nameAr} عطر راقٍ بطابع أنيق وثبات مميز.`,
    familyEn, familyAr,
    notesEn: 'Bergamot, florals, amber, woods, musk',
    notesAr: 'برغموت وزهور وعنبر وأخشاب ومسك',
    characterEn: 'Elegant, balanced and long-lasting',
    characterAr: 'أنيق ومتوازن وطويل الأمد',
    bestEn: g === 'men' ? 'Daily to evening wear' : 'Day and evening occasions',
    bestAr: g === 'men' ? 'من اليوم إلى المساء' : 'النهار والمساء',
    longEn: '6–9 hours with good projection',
    longAr: '6–9 ساعات بثبات جيد',
  });
}

const SKIP = new Set(['3346475561910', '3346475547280']); // testers
const SELECTED = candidates.filter((c) => !SKIP.has(c.barcode)).slice(0, 50);

const products = SELECTED.map((row) => {
  const curated = CURATED[row.barcode];
  if (curated) {
    const subs = curated.subs || {};
    return {
      barcode: row.barcode,
      sarahId: row.sarahId,
      url: row.url,
      stock: row.stock,
      brandEn: curated.brandEn,
      brandAr: curated.brandAr,
      nameEn: curated.nameEn,
      nameAr: curated.nameAr,
      categoryId: curated.categoryId || CATEGORIES.perfumes,
      subcategoryIds: curated.subcategoryIds || perfumeSubs({ ...subs }),
      tertiaryCategoryIds: curated.tertiaryCategoryIds || [],
      isNew: subs.isNew || false,
      descriptionEn: curated.descriptionEn,
      descriptionAr: curated.descriptionAr,
    };
  }

  const brandEn = cleanBrand(row.brandEn || row.brandAr) || 'Unknown';
  const brandAr = String(row.brandAr || brandEn).replace(/[^\u0600-\u06FF\sA-Za-z]/g, ' ').trim() || brandEn;
  const subs = { ...inferGender(row), ...inferNiche(row), ...inferNew(row) };
  const nameEn = buildNameEn(row);
  const nameAr = buildNameAr(row, brandAr);
  const desc = autoDesc(nameEn, nameAr, subs);

  const isMakeup = /مascara|mascara|بودرة|powder|makeup|مكياج/i.test(`${row.nameAr} ${row.posName}`);
  return {
    barcode: row.barcode,
    sarahId: row.sarahId,
    url: row.url,
    stock: row.stock,
    brandEn,
    brandAr,
    nameEn,
    nameAr,
    categoryId: isMakeup ? CATEGORIES.makeup : CATEGORIES.perfumes,
    subcategoryIds: isMakeup
      ? (/mascara|مascara/i.test(row.nameAr) ? [SUBCATEGORIES.eyes] : [SUBCATEGORIES.face])
      : perfumeSubs(subs),
    tertiaryCategoryIds: [],
    isNew: !!subs.isNew,
    descriptionEn: desc.descriptionEn,
    descriptionAr: desc.descriptionAr,
  };
});

writeFileSync(new URL('../data/sarah-pos-import-products.json', import.meta.url).pathname, `${JSON.stringify(products, null, 2)}\n`);
console.log(`Built ${products.length} Sarah POS import products`);
