#!/usr/bin/env node
/** Build care-batch49-products.json — 49 verified barcode overrides. */
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function arabicSize(size) {
  if (size === 'طقم') return 'طقم';
  if (size === 'حسب المنتج') return 'حسب المنتج';
  return String(size)
    .replace(/\s*ml\b/gi, ' مل')
    .replace(/\s*g\b/gi, ' جم')
    .replace(/\s*mg\b/gi, ' مج');
}

function fixArabic(text) {
  return String(text)
    .replace(/جel/g, 'جل')
    .replace(/بريbiotic/gi, 'بروبيوتيك')
    .replace(/كولagen/gi, 'كولاجين')
    .replace(/Collagen Glow/gi, 'كولاجين غلو')
    .replace(/botanic/gi, 'نباتية')
    .replace(/anti-age/gi, 'مضاد للشيخوخة')
    .replace(/Anti-Age/gi, 'مضاد للشيخوخة')
    .replace(/ميسellar/gi, 'ميسيلار')
    .replace(/بانثينol/gi, 'بانثينول')
    .replace(/niacinamide/gi, 'نياسيناميد')
    .replace(/\bpH\b/g, 'درجة الحموضة')
    .replace(/Aqua Bomb/gi, 'أكوا بومب')
    .replace(/Drying Lotion/gi, 'لوشن التجفيف')
    .replace(/Adaptogens/gi, 'المكيّفات')
    .replace(/Adaptogen/gi, 'مكيّف')
    .replace(/Hyaluronic Acid Memory/gi, 'مرطّب حمض الهيالورونيك')
    .replace(/الهيaluronic Acid Memory/gi, 'مرطّب حمض الهيالورونيك')
    .replace(/Hyaluronic Acid/gi, 'حمض الهيالورونيك')
    .replace(/Hyaluronic/gi, 'الهيالورونيك')
    .replace(/hyaluronic/gi, 'الهيالورونيك')
    .replace(/الهيaluronic/gi, 'الهيالورونيك')
    .replace(/\bAcid\b/gi, '')
    .replace(/Moisture/gi, 'مرطّب')
    .replace(/Memory/gi, 'مرطّب')
    .replace(/Pore Perfecting Berry Burst/gi, 'تفتيح المسام بنكهة التوت')
    .replace(/Berry Burst/gi, 'نكهة التوت')
    .replace(/فا[iy]?an[kك]?ou/gi, 'فايانكو')
    .replace(/إليزavecca/gi, 'إليزافيكا')
    .replace(/ماريo/g, 'ماريو')
    .replace(/الأloe/g, 'الصبار')
    .replace(/Aloe/gi, 'الصبار')
    .replace(/اللافender/g, 'الخزامى')
    .replace(/Lavender/gi, 'الخزامى')
    .replace(/retinoic acid/gi, 'حمض الريتينويك')
    .replace(/retinoic/gi, 'الريتينويك')
    .replace(/retinol/gi, 'ريتينول')
    .replace(/Retinol/gi, 'ريتينول')
    .replace(/glutathione/gi, 'جلوتاثيون')
    .replace(/Glutathione/gi, 'جلوتاثيون')
    .replace(/Arbutin White/gi, 'أربوتين للتفتيح')
    .replace(/arbutin/gi, 'أربوتين')
    .replace(/Arbutin/gi, 'أربوتين')
    .replace(/تفتi/g, 'تفتيح')
    .replace(/فايانكou/g, 'فايانكو')
    .replace(/ريتinol/gi, 'ريتينول')
    .replace(/لavender/gi, 'الخزامى')
    .replace(/مضi/g, 'مُضيء')
    .replace(/بالشd/g, 'بالشد');
}

function desc({ introEn, introAr, catEn, catAr, typeEn, typeAr, benefitsEn, benefitsAr, size }) {
  const sizeAr = arabicSize(size);
  return {
    descriptionEn: `${introEn}\n\n◆ Category: ${catEn}\n◆ Product type: ${typeEn}\n◆ Key benefits: ${benefitsEn.join(' · ')}\n◆ Suitable for: Daily care routines\n◆ Size: ${size}`,
    descriptionAr: `${fixArabic(introAr)}\n\n◆ التصنيف: ${catAr}\n◆ نوع المنتج: ${fixArabic(typeAr)}\n◆ الفوائد الرئيسية: ${benefitsAr.map(fixArabic).join(' · ')}\n◆ الأنسب لـ: الاستخدام اليومي ضمن روتين العناية\n◆ الحجم: ${sizeAr}`,
  };
}

function item(o) {
  return {
    barcode: String(o.barcode),
    brandEn: o.brandEn,
    brandAr: fixArabic(o.brandAr),
    nameEn: o.nameEn,
    nameAr: fixArabic(o.nameAr),
    typeKey: o.typeKey,
    subcategorySlugs: o.sub,
    tertiarySlugs: o.tert,
    ...desc(o),
  };
}

const FC = { sub: ['care-face-care'], catEn: 'Face care', catAr: 'العناية بالوجه' };
const CL = { ...FC, tert: ['care-face-care-cleansers-toners'] };
const MO = { ...FC, tert: ['care-face-care-face-moisturizer'] };
const EC = { ...FC, tert: ['care-face-care-eye-care'] };
const SU = { sub: ['care-face-care', 'care-sun-care'], tert: ['care-sun-care-sunscreen'], catEn: 'Sun protection', catAr: 'حماية من الشمس' };
const BD = { sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-moisturizer'], catEn: 'Body care', catAr: 'العناية بالجسم' };
const HC = { sub: ['care-hand-care'], tert: ['care-hand-care-hand-moisturizer'], catEn: 'Hand care', catAr: 'العناية باليدين' };
const FT = { sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-foot-care'], catEn: 'Foot care', catAr: 'العناية بالقدمين' };
const HR = { sub: ['care-hair-care'], tert: ['care-hair-care-hair-treatment'], catEn: 'Hair care', catAr: 'العناية بالشعر' };
const KR = { sub: ['care-korean-skincare-6', 'care-face-care'], tert: ['care-korean-skincare-6-skin-care', 'care-face-care-face-moisturizer'], catEn: 'Korean skincare', catAr: 'العناية الكورية' };
const KR_CL = { sub: ['care-korean-skincare-6', 'care-face-care'], tert: ['care-korean-skincare-6-skin-care', 'care-face-care-cleansers-toners'], catEn: 'Korean skincare', catAr: 'العناية الكورية' };
const SC = { ...FC, tert: ['care-face-care-face-scrubs'] };
const IG = { sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-cleansers'], catEn: 'Body care', catAr: 'العناية بالجسم' };
const SET = { sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'], catEn: 'Face care', catAr: 'العناية بالوجه' };

const DR = { brandEn: 'Dr.Clinic', brandAr: 'دكتور كلينيك' };
const TBS = { brandEn: 'The Body Shop', brandAr: 'ذا بودي شوب' };
const ELI = { brandEn: 'Elizavecca', brandAr: 'إليزافيكا' };
const MB = { brandEn: 'Mario Badescu', brandAr: 'ماريو بديسكو' };
const OLAY = { brandEn: 'Olay', brandAr: 'أولاي' };
const FYK = { brandEn: 'Fayankou', brandAr: 'فاyanكou' };
const SAD = { brandEn: 'Sadoer', brandAr: 'سادور' };
const MOO = { brandEn: 'Mooyam', brandAr: 'مويام' };

const products = [
  item({ barcode: '8680923345116', ...DR, ...CL, typeKey: 'cleanser',
    nameEn: 'Dr.Clinic Prebiotic Face Wash Gel Salicylic Acid 250ml',
    nameAr: 'دكتور كلينيك غسول وجه جel بريbiotic بحمض الساليسيليك 250 مل',
    typeEn: 'Facial cleansing gel', typeAr: 'جل غسول للوجه', size: '250 ml',
    introEn: 'Dr.Clinic Prebiotic Face Wash Gel with salicylic acid cleanses oily and blemish-prone skin while supporting the skin barrier.',
    introAr: 'جل غسول دكتور كلينيك بريbiotic بحمض الساليسيليك ينظف البشرة الدهنية والمعرضة للحبوب مع دعم حاجز البشرة.',
    benefitsEn: ['Salicylic acid cleanse', 'Prebiotic support', 'Fresh clean feel'],
    benefitsAr: ['تنظيف بحمض الساليسيليك', 'دعم بريbiotic', 'إحساس نظافة وانتعاش'],
  }),
  item({ barcode: '8680923345086', ...DR, ...MO, typeKey: 'cream',
    nameEn: 'Dr.Clinic Vitamin C Facial Day Cream 50ml',
    nameAr: 'دكتور كلينيك كريم نهاري للوجه بفيتامين سي 50 مل',
    typeEn: 'Vitamin C day cream', typeAr: 'كريم نهاري بفيتامين سي', size: '50 ml',
    introEn: 'Dr.Clinic Vitamin C Facial Day Cream brightens dull skin and delivers daily hydration with antioxidant care.',
    introAr: 'كريم دكتور كلينيك النهاري بفيتامين سي يضيء البشرة الباهتة ويمنح ترطيباً يومياً بعناية مضادة للأكسدة.',
    benefitsEn: ['Vitamin C radiance', 'Daily hydration', 'Antioxidant protection'],
    benefitsAr: ['إشراقة فيتامين سي', 'ترطيب يومي', 'حماية مضادة للأكسدة'],
  }),
  item({ barcode: '8680923345093', ...DR, ...EC, typeKey: 'serum',
    nameEn: 'Dr.Clinic Eyelash & Brow Enhancer Serum 6ml',
    nameAr: 'دكتور كلينيك سيروم معزز للرموش والحواجب 6 مل',
    typeEn: 'Lash and brow serum', typeAr: 'سيروم للرموش والحواجب', size: '6 ml',
    introEn: 'Dr.Clinic Eyelash & Brow Enhancer Serum nourishes lashes and brows for a fuller healthier appearance.',
    introAr: 'سيروم دكتور كلينيك المعزز للرموش والحواجب يغذي الرموش والحواجب لمظهر أكثر كثافة وصحة.',
    benefitsEn: ['Lash nourishment', 'Brow care', 'Daily enhancement'],
    benefitsAr: ['تغذية الرموش', 'عناية بالحواجب', 'تعزيز يومي'],
  }),
  item({ barcode: '8680923353234', ...DR, ...BD, typeKey: 'body-cream',
    nameEn: 'Dr.Clinic Moisturizing Body Lotion Normal Skin 250ml',
    nameAr: 'دكتور كلينيك لوشن مرطب للجسم للبشرة العادية 250 مل',
    typeEn: 'Body moisturizing lotion', typeAr: 'لوشن مرطب للجسم', size: '250 ml',
    introEn: 'Dr.Clinic Moisturizing Body Lotion for normal skin keeps body skin soft and comfortably hydrated all day.',
    introAr: 'لوشن دكتور كلينيك المرطب للبشرة العادية يحافظ على نعومة وترطيب بشرة الجسم طوال اليوم.',
    benefitsEn: ['Daily body hydration', 'Soft skin feel', 'Normal skin formula'],
    benefitsAr: ['ترطيب يومي للجسم', 'بشرة ناعمة', 'تركيبة للبشرة العادية'],
  }),
  item({ barcode: '8680923353227', ...DR, ...BD, typeKey: 'body-cream',
    nameEn: 'Dr.Clinic Moisturizing Body Lotion Tea Tree 250ml',
    nameAr: 'دكتور كلينيك لوشن مرطب للجسم بشجرة الشاي 250 مل',
    typeEn: 'Tea tree body lotion', typeAr: 'لوشن جسم بشجرة الشاي', size: '250 ml',
    introEn: 'Dr.Clinic Tea Tree Body Lotion refreshes and moisturizes body skin with purifying tea tree care.',
    introAr: 'لوشن دكتور كلينيك بشجرة الشاي ينعش ويرطب بشرة الجسم بعناية منقية.',
    benefitsEn: ['Tea tree freshness', 'Body hydration', 'Purifying care'],
    benefitsAr: ['انتعاش شجرة الشاي', 'ترطيب الجسم', 'عناية منقية'],
  }),
  item({ barcode: '8680923353210', ...DR, ...BD, typeKey: 'body-cream',
    nameEn: 'Dr.Clinic Moisturizing Body Lotion Dry & Sensitive Skin 250ml',
    nameAr: 'دكتور كلينيك لوشن مرطب للجسم للبشرة الجافة والحساسة 250 مل',
    typeEn: 'Body lotion for dry skin', typeAr: 'لوشن جسم للبشرة الجافة', size: '250 ml',
    introEn: 'Dr.Clinic Body Lotion for dry and sensitive skin delivers gentle long-lasting moisture and comfort.',
    introAr: 'لوشن دكتور كلينيك للبشرة الجافة والحساسة يمنح ترطيباً لطيفاً يدوم ويمنح راحة للبشرة.',
    benefitsEn: ['Gentle hydration', 'Sensitive skin care', 'Soft comfortable finish'],
    benefitsAr: ['ترطيب لطيف', 'عناية للبشرة الحساسة', 'لمسة مريحة'],
  }),
  item({ barcode: '8680923360317', ...DR, ...CL, typeKey: 'cleanser',
    nameEn: 'Dr.Clinic Prebiotic Face Wash Gel 250ml',
    nameAr: 'دكتور كلينيك غسول وجه جel بريbiotic 250 مل',
    typeEn: 'Prebiotic cleansing gel', typeAr: 'جل غسول بريbiotic', size: '250 ml',
    introEn: 'Dr.Clinic Prebiotic Face Wash Gel gently cleanses while supporting a balanced healthy skin microbiome.',
    introAr: 'جل غسول دكتور كلينيك بريbiotic ينظف بلطف مع دعم توازن ميكروبيوم البشرة.',
    benefitsEn: ['Prebiotic cleanse', 'Balanced skin feel', 'Daily face wash'],
    benefitsAr: ['تنظيف بريbiotic', 'إحساس متوازن', 'غسول يومي للوجه'],
  }),
  item({ barcode: '8680923334806', ...DR, ...MO, typeKey: 'cream',
    nameEn: 'Dr.Clinic Collagen Intense Cream 50ml',
    nameAr: 'دكتور كلينيك كريم كولagen مكثف 50 مل',
    typeEn: 'Collagen face cream', typeAr: 'كريم وجه بالكولagen', size: '50 ml',
    introEn: 'Dr.Clinic Collagen Intense Cream firms and nourishes skin with intensive collagen-rich daily care.',
    introAr: 'كريم دكتور كلينيك الكولagen المكثف يشد ويغذي البشرة بعناية يومية غنية بالكولagen.',
    benefitsEn: ['Collagen nourishment', 'Firming care', 'Rich daily moisture'],
    benefitsAr: ['تغذية بالكولagen', 'عناية بالشد', 'ترطيب يومي غني'],
  }),
  item({ barcode: '8680923356228', ...DR, ...CL, typeKey: 'cleanser',
    nameEn: 'Dr.Clinic Prebiotic Face Cleansing Foam Oily Skin 160ml',
    nameAr: 'دكتور كلينيك رغوة تنظيف الوجه بريbiotic للبشرة الدهنية 160 مل',
    typeEn: 'Foaming cleanser', typeAr: 'غسول رغوي', size: '160 ml',
    introEn: 'Dr.Clinic Prebiotic Cleansing Foam for oily skin removes excess sebum without over-drying.',
    introAr: 'رغوة دكتور كلينيك بريbiotic للبشرة الدهنية تزيل الزيوت الزائدة دون جفاف مفرط.',
    benefitsEn: ['Oil control cleanse', 'Prebiotic balance', 'Refreshing foam'],
    benefitsAr: ['تنظيف يتحكم بالدهون', 'توازن بريbiotic', 'رغوة منعشة'],
  }),
  item({ barcode: '8680923356211', ...DR, ...CL, typeKey: 'cleanser',
    nameEn: 'Dr.Clinic Prebiotic Face Cleansing Foam Anti-Acne 160ml',
    nameAr: 'دكتور كلينيك رغوة تنظيف الوجه بريbiotic مضادة للحبوب 160 مل',
    typeEn: 'Anti-acne foaming cleanser', typeAr: 'غسول رغوي مضاد للحبوب', size: '160 ml',
    introEn: 'Dr.Clinic Anti-Acne Cleansing Foam targets blemish-prone skin with a purifying prebiotic formula.',
    introAr: 'رغوة دكتور كلينيك المضادة للحبوب تستهدف البشرة المعرضة للبثور بتركيبة بريbiotic منقية.',
    benefitsEn: ['Anti-acne cleanse', 'Purifying foam', 'Prebiotic support'],
    benefitsAr: ['تنظيف مضاد للحبوب', 'رغوة منقية', 'دعم بريbiotic'],
  }),
  item({ barcode: '8680923336367', ...DR, ...CL, typeKey: 'cleanser',
    nameEn: 'Dr.Clinic Prebiotic Deep Cleansing Foam 160ml',
    nameAr: 'دكتور كلينيك رغوة تنظيف عميق بريbiotic 160 مل',
    typeEn: 'Deep cleansing foam', typeAr: 'رغوة تنظيف عميق', size: '160 ml',
    introEn: 'Dr.Clinic Prebiotic Deep Cleansing Foam removes impurities and makeup residue for a fresh clean feel.',
    introAr: 'رغوة دكتور كلينيك للتنظيف العميق بريbiotic تزيل الشوائب وبقايا المكياج لإحساس نظافة وانتعاش.',
    benefitsEn: ['Deep pore cleanse', 'Makeup removal', 'Prebiotic care'],
    benefitsAr: ['تنظيف عميق للمسام', 'إزالة المكياج', 'عناية بريbiotic'],
  }),
  item({ barcode: '8680923345864', ...DR, ...CL, typeKey: 'cleanser',
    nameEn: 'Dr.Clinic Tea Tree Face Wash 200ml',
    nameAr: 'دكتور كلينيك غسول وجه بشجرة الشاي 200 مل',
    typeEn: 'Tea tree face wash', typeAr: 'غسول وجه بشجرة الشاي', size: '200 ml',
    introEn: 'Dr.Clinic Tea Tree Face Wash purifies oily and congested skin with refreshing botanical care.',
    introAr: 'غسول دكتور كلينيك بشجرة الشاي ينقي البشرة الدهنية والمسدودة بعناية botanic منعشة.',
    benefitsEn: ['Tea tree purify', 'Fresh cleanse', 'Oily skin support'],
    benefitsAr: ['تنقية شجرة الشاي', 'تنظيف منعش', 'دعم البشرة الدهنية'],
  }),
  item({ barcode: '8680923352206', ...DR, ...CL, typeKey: 'cleanser',
    nameEn: 'Dr.Clinic Anti-Age Face Wash Gel 150ml',
    nameAr: 'دكتور كلينيك غسول وجه جel مضاد للشيخوخة 150 مل',
    typeEn: 'Anti-aging cleansing gel', typeAr: 'جل غسول مضاد للشيخوخة', size: '150 ml',
    introEn: 'Dr.Clinic Anti-Age Face Wash Gel cleanses mature skin while supporting a smoother refreshed complexion.',
    introAr: 'جل غسول دكتور كلينيك المضاد للشيخوخة ينظف البشرة الناضجة ويدعم مظهراً أنعم وأكثر انتعاشاً.',
    benefitsEn: ['Anti-age cleanse', 'Gentle gel formula', 'Refreshed skin'],
    benefitsAr: ['تنظيف anti-age', 'تركيبة جel لطيفة', 'بشرة منتعشة'],
  }),
  item({ barcode: '8680923349411', ...DR, ...CL, typeKey: 'cleanser',
    nameEn: 'Dr.Clinic Double Phase Cleansing Water 400ml',
    nameAr: 'دكتور كلينيك ماء تنظيف ثنائي المراحل 400 مل',
    typeEn: 'Dual-phase cleansing water', typeAr: 'ماء تنظيف ثنائي المراحل', size: '400 ml',
    introEn: 'Dr.Clinic Double Phase Cleansing Water dissolves waterproof makeup and sunscreen in one gentle step.',
    introAr: 'ماء التنظيف ثنائي المراحل من دكتور كلينيك يذيب المكياج المقاوم للماء وواقي الشمس بلطف.',
    benefitsEn: ['Makeup melting cleanse', 'Two-phase formula', 'No-rinse option'],
    benefitsAr: ['إذابة المكياج', 'تركيبة ثنائية', 'بدون شطف'],
  }),
  item({ barcode: '8680923346090', ...DR, ...CL, typeKey: 'cleanser',
    nameEn: 'Dr.Clinic Prebiotic Micellar Water Panthenol Normal Skin 400ml',
    nameAr: 'دكتور كلينيك ماء ميسellar بريbiotic بالبانثينol للبشرة العادية 400 مل',
    typeEn: 'Micellar cleansing water', typeAr: 'ماء ميسellar للتنظيف', size: '400 ml',
    introEn: 'Dr.Clinic Panthenol Micellar Water gently removes makeup and impurities while soothing normal skin.',
    introAr: 'ماء ميسellar دكتور كلينيك بالبانثينol يزيل المكياج والشوائب بلطف مع تهدئة البشرة العادية.',
    benefitsEn: ['Panthenol soothe', 'Micellar cleanse', 'Normal skin formula'],
    benefitsAr: ['تهدئة بالبانثينol', 'تنظيف ميسellar', 'تركيبة للبشرة العادية'],
  }),
  item({ barcode: '8680923346106', ...DR, ...CL, typeKey: 'cleanser',
    nameEn: 'Dr.Clinic Prebiotic Micellar Water Niacinamide Oily Skin 400ml',
    nameAr: 'دكتور كلينيك ماء ميسellar بريbiotic بالniacinamide للبشرة الدهنية 400 مل',
    typeEn: 'Micellar cleansing water', typeAr: 'ماء ميسellar للتنظيف', size: '400 ml',
    introEn: 'Dr.Clinic Niacinamide Micellar Water cleanses oily skin and helps refine the look of pores.',
    introAr: 'ماء ميسellar دكتور كلينيك بالniacinamide ينظف البشرة الدهنية ويساعد على تحسين مظهر المسام.',
    benefitsEn: ['Niacinamide care', 'Oil-control cleanse', 'Pore-refining feel'],
    benefitsAr: ['عناية niacinamide', 'تنظيف يتحكم بالدهون', 'تحسين مظهر المسام'],
  }),
  item({ barcode: '8680923346151', ...DR, ...IG, typeKey: 'cleanser',
    nameEn: 'Dr.Clinic Intimate Gel 300ml',
    nameAr: 'دكتور كلينيك جel للعناية الحميمة 300 مل',
    typeEn: 'Intimate cleansing gel', typeAr: 'جل للعناية الحميمة', size: '300 ml',
    introEn: 'Dr.Clinic Intimate Gel provides gentle daily cleansing with a pH-balanced formula for intimate care.',
    introAr: 'جل دكتور كلينيك للعناية الحميمة يمنح تنظيفاً يومياً لطيفاً بتركيبة متوازنة pH.',
    benefitsEn: ['Gentle intimate cleanse', 'pH-balanced care', 'Daily freshness'],
    benefitsAr: ['تنظيف حميمي لطيف', 'عناية متوازنة pH', 'انتعاش يومي'],
  }),
  item({ barcode: '8680923357218', ...DR, ...HR, typeKey: 'serum',
    nameEn: 'Dr.Clinic Hair Serum 30ml',
    nameAr: 'دكتور كلينيك سيروم الشعر 30 مل',
    typeEn: 'Hair treatment serum', typeAr: 'سيروم علاج للشعر', size: '30 ml',
    introEn: 'Dr.Clinic Hair Serum nourishes dry or damaged hair and adds smoothness and shine.',
    introAr: 'سيروم دكتور كلينيك للشعر يغذي الشعر الجاف أو التالف ويضيف نعومة ولمعاناً.',
    benefitsEn: ['Hair nourishment', 'Smooth finish', 'Daily treatment'],
    benefitsAr: ['تغذية الشعر', 'لمسة ناعمة', 'علاج يومي'],
  }),
  item({ barcode: '8680923337456', ...DR, ...SU, typeKey: 'sunscreen',
    nameEn: 'Dr.Clinic SPF 50+ Illuminating Sun Cream 50ml',
    nameAr: 'دكتور كلينيك كريم شمس SPF 50+ مضيء 50 مل',
    typeEn: 'Illuminating sunscreen', typeAr: 'واقي شمس مضiء', size: '50 ml',
    introEn: 'Dr.Clinic SPF 50+ Illuminating Sun Cream protects against UV rays while adding a radiant glow.',
    introAr: 'كريم شمس دكتور كلينيك SPF 50+ المضiء يحمي من الأشعة فوق البنفسجية ويضيف إشراقة.',
    benefitsEn: ['SPF 50+ protection', 'Radiant finish', 'Daily sun defense'],
    benefitsAr: ['حماية SPF 50+', 'لمسة مضiئة', 'دفاع يومي من الشمس'],
  }),
  item({ barcode: '8680923353753', ...DR, ...SU, typeKey: 'sunscreen',
    nameEn: 'Dr.Clinic Pink Sunscreen SPF 50+ Tone Equalizing 50ml',
    nameAr: 'دكتور كلينيك واقي شمس وردي SPF 50+ لتوحيد اللون 50 مل',
    typeEn: 'Tone-correcting sunscreen', typeAr: 'واقي شمس لتوحيد اللون', size: '50 ml',
    introEn: 'Dr.Clinic Pink Sunscreen SPF 50+ evens skin tone while delivering high broad-spectrum protection.',
    introAr: 'واقي الشمس الوردي من دكتور كلينيك SPF 50+ يوحّد لون البشرة مع حماية واسعة الطيف.',
    benefitsEn: ['SPF 50+ protection', 'Tone equalizing tint', 'Daily wear'],
    benefitsAr: ['حماية SPF 50+', 'توحيد اللون', 'استخدام يومي'],
  }),
  item({ barcode: '8680923344850', ...DR, ...HC, typeKey: 'cream',
    nameEn: 'Dr.Clinic Repairing Hand and Face Cream 50ml',
    nameAr: 'دكتور كلينيك كريم مرمِّم لليدين والوجه 50 مل',
    typeEn: 'Repairing hand cream', typeAr: 'كريم مرمِّم لليدين', size: '50 ml',
    introEn: 'Dr.Clinic Repairing Hand and Face Cream restores moisture to dry hands and face with a nourishing formula.',
    introAr: 'كريم دكتور كلينيك المرمِّم لليدين والوجه يعيد الترطيب لليدين والوجه الجافين بتركيبة مغذية.',
    benefitsEn: ['Hand and face repair', 'Deep moisture', 'Daily comfort'],
    benefitsAr: ['إصلاح اليدين والوجه', 'ترطيب عميق', 'راحة يومية'],
  }),
  item({ barcode: '8680923344867', ...DR, ...FT, typeKey: 'cream',
    nameEn: 'Dr.Clinic Foot Care Cream 50ml',
    nameAr: 'دكتور كلينيك كريم العناية بالقدمين 50 مل',
    typeEn: 'Foot care cream', typeAr: 'كريم للقدمين', size: '50 ml',
    introEn: 'Dr.Clinic Foot Care Cream softens rough dry feet and helps restore comfortable smooth skin.',
    introAr: 'كريم دكتور كلينيك للقدمين ينعّم القدمين الجافة الخشنة ويساعد على استعادة نعومة مريحة.',
    benefitsEn: ['Softens rough feet', 'Intensive moisture', 'Daily foot care'],
    benefitsAr: ['تنعيم القدمين الخشنة', 'ترطيب مكثف', 'عناية يومية للقدمين'],
  }),
  item({ barcode: '8680923359922', ...DR, ...SET, typeKey: 'moisturizer',
    nameEn: 'Dr.Clinic Collagen Glow Set',
    nameAr: 'دكتور كلينيك طقم كولاجين غلو',
    typeEn: 'Skincare set', typeAr: 'طقم عناية بالبشرة', size: 'طقم',
    introEn: 'Dr.Clinic Collagen Glow Set combines collagen care essentials for a brighter firmer-looking routine.',
    introAr: 'طقم كولاجين غلو من دكتور كلينيك يجمع أساسيات العناية بالكولاجين لروتين أكثر إشراقاً وشداً.',
    benefitsEn: ['Collagen routine set', 'Glow boost', 'Complete face care'],
    benefitsAr: ['طقم روتين كولاجين', 'تعزيز الإشراق', 'عناية وجه متكاملة'],
  }),
  item({ barcode: '8680923335162', ...DR, ...MO, typeKey: 'serum',
    nameEn: 'Dr.Clinic Collagen Intense Serum 30ml',
    nameAr: 'دكتور كلينيك سيروم كولagen مكثف 30 مل',
    typeEn: 'Collagen serum', typeAr: 'سيروم كولagen', size: '30 ml',
    introEn: 'Dr.Clinic Collagen Intense Serum delivers concentrated collagen support for firmer smoother-looking skin.',
    introAr: 'سيروم دكتور كلينيك الكولاجين المكثف يقدم دعماً مركزاً بالكولاجين لبشرة أكثر شدّاً ونعومة.',
    benefitsEn: ['Intense collagen', 'Firming serum', 'Daily anti-age step'],
    benefitsAr: ['كولاجين مكثف', 'سيروم للشد', 'خطوة مضادة للشيخوخة'],
  }),
  item({ barcode: '8680923356242', ...DR, ...SC, typeKey: 'scrub',
    nameEn: 'Dr.Clinic Solutions Exfoliating Facial Peeling AHA 10% + BHA 2% Salicylic Acid 30ml',
    nameAr: 'دكتور كلينيك سيروم تقشير الوجه AHA 10% + BHA 2% بحمض الساليسيليك 30 مل',
    typeEn: 'Exfoliating peeling serum', typeAr: 'سيروم تقشير', size: '30 ml',
    introEn: 'Dr.Clinic AHA + BHA Peeling Serum chemically exfoliates to renew skin, unclog pores and improve texture and tone.',
    introAr: 'سيروم دكتور كلينيك للتقشير بـ AHA و BHA يقشّر كيميائياً لتجديد البشرة وتنظيف المسام وتحسين الملمس واللون.',
    benefitsEn: ['10% AHA exfoliation', '2% BHA pore care', 'Smoother even tone'],
    benefitsAr: ['تقشير AHA 10%', 'عناية BHA 2% بالمسام', 'ملمس ولون أكثر تجانساً'],
  }),
  item({ barcode: '8680923353296', ...DR, ...MO, typeKey: 'serum',
    nameEn: 'Dr.Clinic Anti-Age Serum 30ml',
    nameAr: 'دكتور كلينيك سيروم مضاد للشيخوخة 30 مل',
    typeEn: 'Anti-aging serum', typeAr: 'سيروم مضاد للشيخوخة', size: '30 ml',
    introEn: 'Dr.Clinic Anti-Age Serum targets fine lines and loss of firmness for a more youthful complexion.',
    introAr: 'سيروم دكتور كلينيك المضاد للشيخوخة يستهدف الخطوط الدقيقة وفقدان الشد لمظهر أكثر شباباً.',
    benefitsEn: ['Anti-aging care', 'Fine line support', 'Firming serum'],
    benefitsAr: ['عناية anti-age', 'دعم الخطوط الدقيقة', 'سيروم للشد'],
  }),
  item({ barcode: '8680923334790', ...DR, ...EC, typeKey: 'cream',
    nameEn: 'Dr.Clinic Anti-Wrinkle Eye Care Cream 15ml',
    nameAr: 'دكتور كلينيك كريم العناية بالعين مضاد للتجاعيد 15 مل',
    typeEn: 'Anti-wrinkle eye cream', typeAr: 'كريم عين مضاد للتجاعيد', size: '15 ml',
    introEn: 'Dr.Clinic Anti-Wrinkle Eye Care Cream hydrates the delicate eye area and helps reduce the look of wrinkles.',
    introAr: 'كريم دكتور كلينيك للعناية بالعين مضاد للتجاعيد يرطب محيط العين الرقيق ويساعد على تقليل مظهر التجاعيد.',
    benefitsEn: ['Eye area hydration', 'Wrinkle care', 'Gentle daily formula'],
    benefitsAr: ['ترطيب محيط العين', 'عناية بالتجاعيد', 'تركيبة يومية لطيفة'],
  }),
  item({ barcode: '8680923343174', ...DR, ...MO, typeKey: 'serum',
    nameEn: 'Dr.Clinic Anti-Acne Gel 15ml',
    nameAr: 'دكتور كلينيك جel مضاد للحبوب 15 مل',
    typeEn: 'Anti-acne spot gel', typeAr: 'جل موضعي مضاد للحبوب', size: '15 ml',
    introEn: 'Dr.Clinic Anti-Acne Gel targets blemishes with a focused formula for clearer-looking skin.',
    introAr: 'جل دكتور كلينيك المضاد للحبوب يستهدف البثور بتركيبة مركزة لبشرة أوضح.',
    benefitsEn: ['Spot blemish care', 'Purifying gel', 'Targeted treatment'],
    benefitsAr: ['عناية موضعية بالبثور', 'جل منقٍ', 'علاج مركّز'],
  }),
  item({ barcode: '8680923335148', ...DR, ...EC, typeKey: 'serum',
    nameEn: 'Dr.Clinic Lash & Brow Enhancer Serum 6ml',
    nameAr: 'دكتور كلينيك سيروم معزز للرموش والحواجب 6 مل',
    typeEn: 'Lash and brow serum', typeAr: 'سيروم للرموش والحواجب', size: '6 ml',
    introEn: 'Dr.Clinic Lash & Brow Enhancer Serum strengthens and nourishes lashes and brows for fuller definition.',
    introAr: 'سيروم دكتور كلينيك المعزز للرموش والحواجب يقوي ويغذي الرموش والحواجب لتعريف أكثر كثافة.',
    benefitsEn: ['Lash strengthening', 'Brow definition', 'Daily serum care'],
    benefitsAr: ['تقوية الرموش', 'تعريف الحواجب', 'عناية سيروم يومية'],
  }),
  item({ barcode: '8680923344935', ...DR, ...MO, typeKey: 'moisturizer',
    nameEn: 'Dr.Clinic Aqua Bomb Moisture Tank Cream 50ml',
    nameAr: 'دكتور كلينيك كريم Aqua Bomb المرطب 50 مل',
    typeEn: 'Hydrating face cream', typeAr: 'كريم وجه مرطب', size: '50 ml',
    introEn: 'Dr.Clinic Aqua Bomb Moisture Tank Cream floods skin with lightweight hydration for a plump dewy finish.',
    introAr: 'كريم دكتور كلينيك Aqua Bomb المرطب يغمر البشرة بترطيب خفيف لإحساس ممتلئ وندي.',
    benefitsEn: ['Intense hydration', 'Lightweight texture', 'Dewy moisture boost'],
    benefitsAr: ['ترطيب مكثف', 'قوام خفيف', 'دفعة رطوبة ندية'],
  }),

  item({ barcode: '5028197269586', ...TBS, ...CL, typeKey: 'cleanser',
    nameEn: 'The Body Shop Tea Tree Foaming Facial Wash 150ml',
    nameAr: 'ذا بودي شوب غسول وجه رغوي بشجرة الشاي 150 مل',
    typeEn: 'Foaming facial wash', typeAr: 'غسول وجه رغوي', size: '150 ml',
    introEn: 'The Body Shop Tea Tree Foaming Facial Wash deeply cleanses blemish-prone skin with refreshing tea tree.',
    introAr: 'غسول ذا بودي شوب الرغوي بشجرة الشاي ينظف بعمق البشرة المعرضة للحبوب بانتعاش شجرة الشاي.',
    benefitsEn: ['Tea tree cleanse', 'Purifying foam', 'Blemish-prone skin'],
    benefitsAr: ['تنظيف شجرة الشاي', 'رغوة منقية', 'للبشرة المعرضة للحبوب'],
  }),
  item({ barcode: '5028197334277', ...TBS, ...CL, typeKey: 'toner',
    nameEn: 'The Body Shop Tea Tree Toner 250ml',
    nameAr: 'ذا بودي شوب تونر شجرة الشاي 250 مل',
    typeEn: 'Facial toner', typeAr: 'تونر للوجه', size: '250 ml',
    introEn: 'The Body Shop Tea Tree Toner refreshes skin after cleansing and helps reduce the look of pores.',
    introAr: 'تونر ذا بودي شوب بشجرة الشاي ينعش البشرة بعد التنظيف ويساعد على تقليل مظهر المسام.',
    benefitsEn: ['Pore-refining toner', 'Tea tree freshness', 'Post-cleanse prep'],
    benefitsAr: ['تونر للمسام', 'انتعاش شجرة الشاي', 'تجهيز بعد التنظيف'],
  }),

  item({ barcode: '8809624500079', ...ELI, ...MO, typeKey: 'cream',
    nameEn: 'Elizavecca Moisture Hyaluronic Acid Memory Cream 100g',
    nameAr: 'إليزavecca كريم Moisture Hyaluronic Acid Memory 100 جم',
    typeEn: 'Hyaluronic face cream', typeAr: 'كريم وجه بالهيaluronic', size: '100 g',
    introEn: 'Elizavecca Hyaluronic Acid Memory Cream delivers bouncy hydration with a cushiony moisture-rich texture.',
    introAr: 'كريم إليزavecca بالهيaluronic Acid Memory يمنح ترطيباً مرناً بقوام غني بالرطوبة.',
    benefitsEn: ['Hyaluronic hydration', 'Memory texture', 'Plump moisture'],
    benefitsAr: ['ترطيب hyaluronic', 'قوام Memory', 'رطوبة ممتلئة'],
  }),

  item({ barcode: '785364130081', ...MB, ...MO, typeKey: 'serum',
    nameEn: 'Mario Badescu Drying Lotion 29ml',
    nameAr: 'ماريو بديسكو Drying Lotion 29 مل',
    typeEn: 'Spot drying treatment', typeAr: 'علاج موضعي للبثور', size: '29 ml',
    introEn: 'Mario Badescu Drying Lotion is a cult-favorite overnight spot treatment for whiteheads and surface blemishes.',
    introAr: 'Drying Lotion من ماريو بديسكو علاج ليلي كلاسيكي للرؤوس البيضاء والبثور السطحية.',
    benefitsEn: ['Overnight spot care', 'Dries blemishes', 'Targeted treatment'],
    benefitsAr: ['عناية ليلية موضعية', 'يجفف البثور', 'علاج مركّز'],
  }),
  item({ barcode: '785364130531', ...MB, ...CL, typeKey: 'toner',
    nameEn: 'Mario Badescu Facial Spray Aloe Adaptogens & Coconut Water 118ml',
    nameAr: 'ماريo بديسكو بخاخ وجه بالأloe والAdaptogens وماء جوز الهند 118 مل',
    typeEn: 'Facial mist toner', typeAr: 'بخاخ تونر للوجه', size: '118 ml',
    introEn: 'Mario Badescu Facial Spray with aloe, adaptogens and coconut water refreshes and hydrates skin on the go.',
    introAr: 'بخاخ ماريo بديسكو بالأloe والAdaptogens وماء جوز الهند ينعش ويرطب البشرة في أي وقت.',
    benefitsEn: ['Hydrating facial mist', 'Adaptogen care', 'Makeup refresh'],
    benefitsAr: ['بخاخ مرطب', 'عناية Adaptogen', 'تنشيط المكياج'],
  }),
  item({ barcode: '785364130357', ...MB, ...CL, typeKey: 'toner',
    nameEn: 'Mario Badescu Facial Spray Aloe Cucumber & Green Tea 118ml',
    nameAr: 'ماريo بديسكو بخاخ وجه بالأloe والخيار والشاي الأخضر 118 مل',
    typeEn: 'Facial mist toner', typeAr: 'بخاخ تونر للوجه', size: '118 ml',
    introEn: 'Mario Badescu Cucumber & Green Tea Facial Spray cools and soothes skin with a refreshing botanical mist.',
    introAr: 'بخاخ ماريo بديسكو بالأloe والخيار والشاي الأخضر يبرد ويهدئ البشرة برذاذ botanic منعش.',
    benefitsEn: ['Cooling cucumber', 'Green tea soothe', 'Instant refresh'],
    benefitsAr: ['تبريد بالخيار', 'تهدئة بالشاي الأخضر', 'انتعاش فوري'],
  }),
  item({ barcode: '785364130388', ...MB, ...CL, typeKey: 'toner',
    nameEn: 'Mario Badescu Facial Spray Aloe Chamomile & Lavender 118ml',
    nameAr: 'ماريo بديسكو بخاخ وجه بالأloe والبابونج واللافender 118 مل',
    typeEn: 'Facial mist toner', typeAr: 'بخاخ تونر للوجه', size: '118 ml',
    introEn: 'Mario Badescu Chamomile & Lavender Facial Spray calms sensitive skin with a gentle soothing mist.',
    introAr: 'بخاخ ماريo بديسكو بالأloe والبابونج واللافender يهدئ البشرة الحساسة برذاذ لطيف.',
    benefitsEn: ['Chamomile calm', 'Lavender soothe', 'Sensitive skin friendly'],
    benefitsAr: ['تهدئة بالبابونج', 'الخزامى مهدئ', 'مناسب للحساسة'],
  }),
  item({ barcode: '785364130098', ...MB, ...CL, typeKey: 'toner',
    nameEn: 'Mario Badescu Facial Spray Aloe Herbs & Rosewater 118ml',
    nameAr: 'ماريo بديسكو بخاخ وجه بالأloe والأعشاب وماء الورد 118 مل',
    typeEn: 'Facial mist toner', typeAr: 'بخاخ تونر للوجه', size: '118 ml',
    introEn: 'Mario Badescu Herbs & Rosewater Facial Spray revives dull skin with a classic rose-infused refresh.',
    introAr: 'بخاخ ماريo بديسكو بالأloe والأعشاب وماء الورد ينعش البشرة الباهتة بلمسة ورد كلاسيكية.',
    benefitsEn: ['Rosewater refresh', 'Herbal mist', 'Daily hydration boost'],
    benefitsAr: ['انتعاش ماء الورد', 'رذاذ أعشاب', 'دفعة ترطيب يومية'],
  }),

  item({ barcode: '8001841762869', ...OLAY, ...SC, typeKey: 'scrub',
    nameEn: 'Olay Scrubs Pore Perfecting Berry Burst 150ml',
    nameAr: 'أولاي مقشر Pore Perfecting Berry Burst 150 مل',
    typeEn: 'Facial scrub', typeAr: 'مقشر للوجه', size: '150 ml',
    introEn: 'Olay Pore Perfecting Berry Burst Scrub gently exfoliates to refine pores and reveal smoother skin.',
    introAr: 'مقشر أولاي Pore Perfecting Berry Burst يقشّر بلطف لتحسين المسام وإظهار بشرة أنعم.',
    benefitsEn: ['Pore refining scrub', 'Berry burst formula', 'Smoother texture'],
    benefitsAr: ['مقشر للمسام', 'تركيبة Berry Burst', 'ملمس أنعم'],
  }),

  item({ barcode: '6942349717048', ...FYK, ...KR, typeKey: 'cream',
    nameEn: 'Fayankou Collagen Moisturize Whiten Cream 150ml',
    nameAr: 'فاyanكou كريم كولagen مرطب ومبيّض 150 مل',
    typeEn: 'Brightening moisturizer', typeAr: 'مرطب مبيّض', size: '150 ml',
    introEn: 'Fayankou Collagen Moisturize Whiten Cream hydrates while supporting a brighter even-looking complexion.',
    introAr: 'كريم فاyanكou بالكولagen المرطب والمبيّض يرطب ويدعم مظهراً أكثر إشراقاً وتجانساً.',
    benefitsEn: ['Collagen moisture', 'Brightening care', 'Even tone support'],
    benefitsAr: ['ترطيب كولagen', 'عناية تفتiح', 'دعم توحيد اللون'],
  }),
  item({ barcode: '6942349717031', ...FYK, ...KR_CL, typeKey: 'cleanser',
    nameEn: 'Fayankou Retinol Cleanser',
    nameAr: 'فاyanكou غسول ريتinol',
    typeEn: 'Retinol cleanser', typeAr: 'غسول ريتinol', size: 'حسب المنتج',
    introEn: 'Fayankou Retinol Cleanser gently cleanses while supporting skin renewal with retinol care.',
    introAr: 'غسول فاyanكou بالريتinol ينظف بلطف مع دعم تجديد البشرة بعناية الريتinol.',
    benefitsEn: ['Retinol cleanse', 'Gentle renewal', 'Daily face wash'],
    benefitsAr: ['تنظيف ريتinol', 'تجديد لطيف', 'غسول يومي'],
  }),
  item({ barcode: '6942349717079', ...FYK, ...KR, typeKey: 'serum',
    nameEn: 'Fayankou Retinol Serum 30ml',
    nameAr: 'فاyanكou سيروم ريتinol 30 مل',
    typeEn: 'Retinol serum', typeAr: 'سيروم ريتinol', size: '30 ml',
    introEn: 'Fayankou Retinol Serum helps refine texture and reduce signs of aging with nightly renewal care.',
    introAr: 'سيروم فاyanكou بالريتinol يساعد على تحسين الملمس وتقليل علامات التقدم بعناية تجديد ليلية.',
    benefitsEn: ['Retinol renewal', 'Texture refinement', 'Anti-aging serum'],
    benefitsAr: ['تجديد ريتinol', 'تحسين الملمس', 'سيروم anti-age'],
  }),
  item({ barcode: '6942349717611', ...FYK, ...KR, typeKey: 'serum',
    nameEn: 'Fayankou Hyaluronic Acid Serum 30ml',
    nameAr: 'فاyanكou سيروم حمض الهيaluronic 30 مل',
    typeEn: 'Hyaluronic acid serum', typeAr: 'سيروم حمض الهيaluronic', size: '30 ml',
    introEn: 'Fayankou Hyaluronic Acid Serum delivers deep hydration for plump dewy-looking skin.',
    introAr: 'سيروم فاyanكou بحمض الهيaluronic يمنح ترطيباً عميقاً لبشرة ممتلئة وندية.',
    benefitsEn: ['Deep hydration', 'Plumping serum', 'Lightweight absorb'],
    benefitsAr: ['ترطيب عميق', 'سيروم مملِّس', 'امتصاص خفيف'],
  }),
  item({ barcode: '6942349717628', ...FYK, ...KR, typeKey: 'serum',
    nameEn: 'Fayankou Niacinamide Serum 30ml',
    nameAr: 'فاyanكou سيروم niacinamide 30 مل',
    typeEn: 'Niacinamide serum', typeAr: 'سيروم niacinamide', size: '30 ml',
    introEn: 'Fayankou Niacinamide Serum helps minimize pores and balance uneven tone for clearer skin.',
    introAr: 'سيروم فاyanكou بالniacinamide يساعد على تصغير المسام وتوازن اللون غير المتجانس لبشرة أوضح.',
    benefitsEn: ['Niacinamide balance', 'Pore care', 'Tone refining'],
    benefitsAr: ['توازن niacinamide', 'عناية بالمسام', 'تحسين اللون'],
  }),
  item({ barcode: '6942349717642', ...FYK, ...KR, typeKey: 'serum',
    nameEn: 'Fayankou Vitamin C Serum 30ml',
    nameAr: 'فاyanكou سيروم فيتامين سي 30 مل',
    typeEn: 'Vitamin C serum', typeAr: 'سيروم فيتامين سي', size: '30 ml',
    introEn: 'Fayankou Vitamin C Serum brightens dull skin and supports antioxidant protection.',
    introAr: 'سيروم فاyanكou بفيتامين سي يضiء البشرة الباهتة ويدعم الحماية المضادة للأكسدة.',
    benefitsEn: ['Vitamin C glow', 'Antioxidant care', 'Brightening serum'],
    benefitsAr: ['إشراقة فيتامين سي', 'عناية مضادة للأكسدة', 'سيروم تفتiح'],
  }),
  item({ barcode: '6942349717659', ...FYK, ...KR, typeKey: 'serum',
    nameEn: 'Fayankou Retinoic Acid Serum 30ml',
    nameAr: 'فاyanكou سيروم retinoic acid 30 مل',
    typeEn: 'Retinoic acid serum', typeAr: 'سيروم retinoic acid', size: '30 ml',
    introEn: 'Fayankou Retinoic Acid Serum supports advanced skin renewal for smoother firmer-looking skin.',
    introAr: 'سيروم فاyanكou بـ retinoic acid يدعم تجديداً متقدماً للبشرة لمظهر أنعم وأكثر شدّاً.',
    benefitsEn: ['Retinoic renewal', 'Firming care', 'Advanced anti-age'],
    benefitsAr: ['تجديد retinoic', 'عناية بالشd', 'anti-age متقدم'],
  }),

  item({ barcode: '6940824131082', ...MOO, ...MO, typeKey: 'serum',
    nameEn: 'Mooyam Glutathione 2% Serum 30ml',
    nameAr: 'مويام سيروم glutathione 2% 30 مل',
    typeEn: 'Brightening serum', typeAr: 'سيروم مضiء', size: '30 ml',
    introEn: 'Mooyam Glutathione 2% Serum helps brighten uneven tone and supports antioxidant skin defense.',
    introAr: 'سيروم مويام بـ glutathione 2% يساعد على تفتiح اللون غير المتجانس ويدعم دفاع البشرة المضاد للأكسدة.',
    benefitsEn: ['2% glutathione', 'Brightening care', 'Antioxidant support'],
    benefitsAr: ['glutathione 2%', 'عناية تفتiح', 'دعم مضاد للأكسدة'],
  }),

  item({ barcode: '6942349742491', ...SAD, ...MO, typeKey: 'serum',
    nameEn: 'Sadoer Salicylic Acid Serum 30ml',
    nameAr: 'سادور سيروم حمض الساليسيليك 30 مل',
    typeEn: 'Salicylic acid serum', typeAr: 'سيروم حمض الساليسيليك', size: '30 ml',
    introEn: 'Sadoer Salicylic Acid Serum helps clear congested pores and refine blemish-prone skin.',
    introAr: 'سيروم سادور بحمض الساليسيليك يساعد على تنظيف المسام المسدودة وتحسين البشرة المعرضة للحبوب.',
    benefitsEn: ['Salicylic exfoliation', 'Pore clearing', 'Blemish care'],
    benefitsAr: ['تقشير ساليسيليك', 'تنظيف المسام', 'عناية بالحبوب'],
  }),
  item({ barcode: '6941349389132', ...SAD, ...MO, typeKey: 'serum',
    nameEn: 'Sadoer Arbutin White Serum 30ml',
    nameAr: 'سادور سيروم أربوتين للتفتيح 30 مل',
    typeEn: 'Brightening serum', typeAr: 'سيروم تفتيح', size: '30 ml',
    introEn: 'Sadoer Arbutin White Serum targets dark spots and dullness for a brighter even complexion.',
    introAr: 'سيروم سادور أربوتين White يستهدف البقع والبهتان لبشرة أكثر إشراقاً وتجانساً.',
    benefitsEn: ['Arbutin brightening', 'Dark spot care', 'Even tone'],
    benefitsAr: ['تفتيح أربوتين', 'عناية بالبقع', 'توحيد اللون'],
  }),
  item({ barcode: '6942349712081', ...SAD, ...MO, typeKey: 'serum',
    nameEn: 'Sadoer Niacinamide Serum 30ml',
    nameAr: 'سادور سيروم niacinamide 30 مل',
    typeEn: 'Niacinamide serum', typeAr: 'سيروم niacinamide', size: '30 ml',
    introEn: 'Sadoer Niacinamide Serum balances oil and helps improve the appearance of pores and uneven tone.',
    introAr: 'سيروم سادور بالniacinamide يوازن الزيوت ويساعد على تحسين مظهر المسام واللون غير المتجانس.',
    benefitsEn: ['Niacinamide balance', 'Oil control', 'Pore refining'],
    benefitsAr: ['توازن niacinamide', 'تحكم بالدهون', 'تحسين المسام'],
  }),
];

if (products.length !== 50) {
  throw new Error(`Expected 50 products, got ${products.length}`);
}

const out = path.join(__dirname, '../data/care-batch49-products.json');
writeFileSync(out, `${JSON.stringify(products, null, 2)}\n`);
console.log(`Wrote ${products.length} products → ${out}`);
