/**
 * Lierac — 24 separate skincare products (no shades, no images).
 * Sources: lierac.com, go-upc.com, pharmacy retailers
 * Usage: npx tsx scripts/add-lierac-batch24-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const CARE_FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const SUN_CARE = "25dc8086-bffa-47af-aaf7-64d503e58a9f";
const FACE_MOIST = "21801439-d0e9-4106-b5e8-dfdd70ffeb8d";
const EYE = "09bedca5-0c6c-4a71-9b03-4bf29cecaf53";
const CLEANSERS = "05028a17-da64-4c66-b25f-73c758acc2f8";
const SUNSCREEN = "ad2a9e6b-5e20-4393-849a-e5e6c6cc97e2";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId?: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "3701436917890",
    slug: "lierac-premium-la-creme-voluptueuse-50ml",
    sku: "LRC-917890",
    price: 42000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "لييراك بريميوم - كريم La Crème Voluptueuse الغني المضاد للشيخوخة 50 مل",
    nameEn: "Lierac Premium - La Crème Voluptueuse Anti-Aging Rich Cream 50ml",
    descriptionAr:
      "كريم بريميوم فاخر مضاد للشيخوخة من لييراك — يصحّح التجاعيد والبقع والترهل.\n\n" +
      "• تقنية [F.G.N.] مع هيالورونيك أسيد ونياسيناميد.\n• زبدة الشيا لترطيب عميق ونعومة.\n• 95% مكونات طبيعية — للبشرة العادية والجافة والحساسة.\n• 50 مل — صنع في فرنسا.",
    descriptionEn:
      "Lierac Premium La Crème Voluptueuse — luxurious anti-aging cream correcting wrinkles, spots and loss of firmness.\n\n" +
      "• [F.G.N.] technology with hyaluronic acid and niacinamide.\n• Shea butter for deep nourishment.\n• 95% natural ingredients — normal to dry and sensitive skin.\n• 50ml — Made in France.",
  },
  {
    barcode: "3701436917876",
    slug: "lierac-premium-the-silky-cream-50ml",
    sku: "LRC-917876",
    price: 42000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "لييراك بريميوم - كريم The Silky Cream الحريري 50 مل",
    nameEn: "Lierac Premium - The Silky Cream 50ml",
    descriptionAr:
      "كريم بريميوم حريري مضاد للشيخوخة — قوام خفيف لامع للبشرة المختلطة والعادية.\n\n" +
      "• يصحّح جميع علامات التقدّم في العمر.\n• تركيبة حريرية سريعة الامتصاص.\n• للبشرة العادية إلى المختلطة.\n• 50 مل.",
    descriptionEn:
      "Lierac Premium The Silky Cream — silky lightweight anti-aging face cream.\n\n" +
      "• Corrects all signs of aging.\n• Silky fast-absorbing texture.\n• For normal to combination skin.\n• 50ml.",
  },
  {
    barcode: "3701436917913",
    slug: "lierac-premium-the-eye-cream-20ml",
    sku: "LRC-917913",
    price: 28000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: EYE,
    nameAr: "لييراك بريميوم - كريم العيون Premium Yeux 20 مل",
    nameEn: "Lierac Premium - The Eye Cream 20ml",
    descriptionAr:
      "كريم عيون بريميوم مضاد للشيخوخة — للهالات والتجاعيد وترهل الجفن.\n\n" +
      "• يصحّح علامات التقدّم حول العين.\n• تركيبة فاخرة لطيفة على البشرة الحساسة.\n• صباحاً ومساءً.\n• 20 مل.",
    descriptionEn:
      "Lierac Premium The Eye Cream — anti-aging eye care for dark circles, wrinkles and eyelid sagging.\n\n" +
      "• Corrects signs of aging around the eyes.\n• Luxurious gentle formula.\n• AM/PM use.\n• 20ml.",
  },
  {
    barcode: "3701436933517",
    slug: "lierac-premium-voluptuous-cream-refill-set",
    sku: "LRC-933517",
    price: 55000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "لييراك بريميوم - طقم La Crème Voluptueuse مع عبوة إعادة التعبئة",
    nameEn: "Lierac Premium - La Crème Voluptueuse + Refill Set",
    descriptionAr:
      "طقم هدايا بريميوم — كريم La Crème Voluptueuse 50 مل + عبوة إعادة تعبئة 50 مل.\n\n" +
      "• نفس تركيبة الكريم الفاخر المضاد للشيخوخة.\n• عبوة قابلة لإعادة التعبئة — صديقة للبيئة.\n• 50 مل + 50 مل إعادة تعبئة.",
    descriptionEn:
      "Lierac Premium gift set — La Crème Voluptueuse 50ml + 50ml refill.\n\n" +
      "• Same luxurious anti-aging formula.\n• Refillable sustainable format.\n• 50ml + 50ml refill.",
  },
  {
    barcode: "3701436917920",
    slug: "lierac-premium-the-absolute-serum-30ml",
    sku: "LRC-917920",
    price: 45000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "لييراك بريميوم - سيروم The Absolute Serum 30 مل",
    nameEn: "Lierac Premium - The Absolute Serum 30ml",
    descriptionAr:
      "سيروم بريميوم مركّز مضاد للشيخوخة — أقصى فعالية من خط Premium.\n\n" +
      "• يصحّح التجاعيد والبقع وفقدان الكثافة.\n• تركيبة مركّزة قبل الكريم.\n• للبشرة الناضجة.\n• 30 مل.",
    descriptionEn:
      "Lierac Premium The Absolute Serum — concentrated premium anti-aging serum.\n\n" +
      "• Corrects wrinkles, spots and loss of density.\n• Apply before cream.\n• For mature skin.\n• 30ml.",
  },
  {
    barcode: "3701436917500",
    slug: "lierac-sunissime-velvety-sun-fluid-spf50-40ml",
    sku: "LRC-917500",
    price: 28000,
    categoryId: CARE,
    subcategoryId: SUN_CARE,
    tertiaryCategoryId: SUNSCREEN,
    nameAr: "لييراك سونيسيم - سائل واقي شمس مخملي SPF 50+ للوجه 40 مل",
    nameEn: "Lierac Sunissime - The Velvety Sun Fluid SPF50+ 40ml",
    descriptionAr:
      "سائل واقي شمس مخملي SPF 50+ للوجه من خط Sunissime.\n\n" +
      "• حماية عالية UVA/UVB بقوام مخملي خفيف.\n• يحمي ويرطّب دون لمعان.\n• للاستخدام اليومي على الوجه.\n• 40 مل.",
    descriptionEn:
      "Lierac Sunissime Velvety Sun Fluid SPF50+ — high protection with velvety finish.\n\n" +
      "• Broad UVA/UVB protection.\n• Lightweight non-greasy formula.\n• Daily facial use.\n• 40ml.",
  },
  {
    barcode: "3701436926311",
    slug: "lierac-protocole-eclat-vitamin-c-concentrated-serum-set",
    sku: "LRC-926311",
    price: 45000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "لييراك بروتوكول إكلار - طقم سيروم فيتامين C المركّز 20%",
    nameEn: "Lierac Protocole Éclat - The Concentrated Serum 20% Vitamin C Set",
    descriptionAr:
      "طقم سيروم إشراق بفيتامين C نقي 20% من خط Protocole Éclat.\n\n" +
      "• سيروم 30 مل + 14 كيس فيتامين C نقي 0.2 غ.\n• يفتّح ويوحّد لون البشرة ويمنح إشراقاً فورياً.\n• للبشرة الباهتة والمصابة بالتصبغات.\n• طقم علاجي مركّز.",
    descriptionEn:
      "Lierac Protocole Éclat Concentrated Serum — 20% pure vitamin C radiance set.\n\n" +
      "• 30ml serum + 14 × 0.2g pure vitamin C sachets.\n• Brightens and evens skin tone.\n• For dull and hyperpigmented skin.\n• Intensive treatment set.",
  },
  {
    barcode: "3701436917548",
    slug: "lierac-sunissime-protective-sun-stick-spf50-10g",
    sku: "LRC-917548",
    price: 20000,
    categoryId: CARE,
    subcategoryId: SUN_CARE,
    tertiaryCategoryId: SUNSCREEN,
    nameAr: "لييراك سونيسيم - ستيك واقي شمس SPF 50+ 10 غ",
    nameEn: "Lierac Sunissime - Protective Sun Stick SPF50+ 10g",
    descriptionAr:
      "ستيك واقي شمس SPF 50+ — للوجه والمناطق الحساسة.\n\n" +
      "• حماية عالية في شكل عملي للتطبيق السريع.\n• للأنف والشفاه والمناطق المعرضة للشمس.\n• 10 غ.",
    descriptionEn:
      "Lierac Sunissime Protective Sun Stick SPF50+ — practical high protection.\n\n" +
      "• Easy application for face and sensitive areas.\n• For nose, lips and sun-exposed zones.\n• 10g.",
  },
  {
    barcode: "3701436928780",
    slug: "lierac-sunissime-tinted-velvety-sun-fluid-spf50-40ml",
    sku: "LRC-928780",
    price: 30000,
    categoryId: CARE,
    subcategoryId: SUN_CARE,
    tertiaryCategoryId: SUNSCREEN,
    nameAr: "لييراك سونيسيم - سائل واقي شمس ملوّن مخملي SPF 50+ 40 مل",
    nameEn: "Lierac Sunissime - The Tinted Velvety Sun Fluid SPF50+ 40ml",
    descriptionAr:
      "سائل واقي شمس ملوّن مخملي SPF 50+ — يوحّد لون البشرة مع الحماية.\n\n" +
      "• تغطية خفيفة ملوّنة مع SPF 50+.\n• قوام مخملي غير لامع.\n• للوجه يومياً.\n• 40 مل.",
    descriptionEn:
      "Lierac Sunissime Tinted Velvety Sun Fluid SPF50+ — sun protection with light tint.\n\n" +
      "• Light tinted coverage with SPF 50+.\n• Velvety matte finish.\n• Daily facial use.\n• 40ml.",
  },
  {
    barcode: "3701436926236",
    slug: "lierac-protocole-anti-imperfections-the-peeling-100ml",
    sku: "LRC-926236",
    price: 26000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "لييراك بروتوكول أنتي-إمبيرفكشن - تقشير Le Peeling 100 مل",
    nameEn: "Lierac Protocole Anti-Imperfections - The Peeling 100ml",
    descriptionAr:
      "تقشير كيميائي من خط Protocole Anti-Imperfections — للبشرة مع حب الشباب.\n\n" +
      "• يقشر بلطف وينظّف المسام.\n• يقلّل العيوب واللمعان.\n• 1–2 مرات أسبوعياً.\n• 100 مل.",
    descriptionEn:
      "Lierac Protocole Anti-Imperfections The Peeling — chemical exfoliant for acne-prone skin.\n\n" +
      "• Gently exfoliates and unclogs pores.\n• Reduces blemishes and shine.\n• Use 1–2 times per week.\n• 100ml.",
  },
  {
    barcode: "3701436926298",
    slug: "lierac-protocole-anti-taches-anti-spot-serum-30ml",
    sku: "LRC-926298",
    price: 32000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "لييراك بروتوكول أنتي-تاش - سيروم مضاد للبقع الداكنة 30 مل",
    nameEn: "Lierac Protocole Anti-Taches - The Anti-Spot Serum 30ml",
    descriptionAr:
      "سيروم مضاد للبقع الداكنة بنياسيناميد نقي من خط Protocole Anti-Taches.\n\n" +
      "• يفتّح التصبغات ويوحّد لون البشرة.\n• تركيبة مركّزة للبقع العنيدة.\n• صباحاً ومساءً.\n• 30 مل.",
    descriptionEn:
      "Lierac Protocole Anti-Taches Anti-Spot Serum — pure niacinamide dark spot treatment.\n\n" +
      "• Lightens hyperpigmentation and evens tone.\n• Concentrated formula for stubborn spots.\n• AM/PM use.\n• 30ml.",
  },
  {
    barcode: "3701436922108",
    slug: "lierac-diopti-dark-circle-correction-fluid-15ml",
    sku: "LRC-922108",
    price: 22000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: EYE,
    nameAr: "لييراك ديوبتي - سائل تصحيح الهالات السوداء 15 مل",
    nameEn: "Lierac Diopti - Dark Circle Correction Fluid 15ml",
    descriptionAr:
      "سائل تصحيح الهالات السوداء من خط Diopti.\n\n" +
      "• يقلّل الهالات والانتفاخ حول العين.\n• قوام سائل خفيف سريع الامتصاص.\n• للاستخدام صباحاً.\n• 15 مل.",
    descriptionEn:
      "Lierac Diopti Dark Circle Correction Fluid — targets dark circles and puffiness.\n\n" +
      "• Reduces under-eye dark circles and bags.\n• Lightweight fluid texture.\n• Morning use.\n• 15ml.",
  },
  {
    barcode: "3701436910952",
    slug: "lierac-hydragenist-rehydrating-serum-30ml",
    sku: "LRC-910952",
    price: 28000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "لييراك هايدراجينيست - سيروم إعادة الترطيب 30 مل",
    nameEn: "Lierac Hydragenist - The Rehydrating Serum 30ml",
    descriptionAr:
      "سيروم إعادة الترطيب من خط Hydragenist — للبشرة الجافة والمجهدة.\n\n" +
      "• ترطيب مكثّف بهيالورونيك أسيد.\n• يعيد نضارة البشرة ومرونتها.\n• قبل الكريم صباحاً ومساءً.\n• 30 مل.",
    descriptionEn:
      "Lierac Hydragenist Rehydrating Serum — intensive hydration for dehydrated skin.\n\n" +
      "• Hyaluronic acid deep hydration.\n• Restores radiance and elasticity.\n• Apply before cream AM/PM.\n• 30ml.",
  },
  {
    barcode: "3701436926281",
    slug: "lierac-protocole-anti-taches-tinted-stick-spf50",
    sku: "LRC-926281",
    price: 22000,
    categoryId: CARE,
    subcategoryId: SUN_CARE,
    tertiaryCategoryId: SUNSCREEN,
    nameAr: "لييراك بروتوكول أنتي-تاش - ستيك ملوّن SPF 50 ضد البقع 2.7 غ",
    nameEn: "Lierac Protocole Anti-Taches - Le Stick Teinté SPF50 2.7g",
    descriptionAr:
      "ستيك ملوّن SPF 50 من خط Protocole Anti-Taches — يغطّي البقع ويحمي من الشمس.\n\n" +
      "• تغطية ملوّنة مع حماية SPF 50.\n• للبقع الداكنة والمناطق الحساسة.\n• للتطبيق السريع.\n• 2.7 غ.",
    descriptionEn:
      "Lierac Protocole Anti-Taches Tinted Stick SPF50 — covers spots with sun protection.\n\n" +
      "• Tinted coverage with SPF 50.\n• For dark spots and sensitive areas.\n• Quick touch-up application.\n• 2.7g.",
  },
  {
    barcode: "3701436926229",
    slug: "lierac-protocole-anti-imperfections-stop-spots-15ml",
    sku: "LRC-926229",
    price: 18000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "لييراك بروتوكول أنتي-إمبيرفكشن - علاج Stop-Boutons للحبوب 15 مل",
    nameEn: "Lierac Protocole Anti-Imperfections - Le Stop-Boutons 15ml",
    descriptionAr:
      "علاج موضعي للحبوب من خط Protocole Anti-Imperfections.\n\n" +
      "• يهدّئ ويختفي الحبوب بسرعة.\n• للتطبيق الموضعي على البثور.\n• للبشرة الدهنية مع حب الشباب.\n• 15 مل.",
    descriptionEn:
      "Lierac Protocole Anti-Imperfections Stop-Boutons — targeted spot treatment.\n\n" +
      "• Quickly calms and reduces blemishes.\n• Apply locally on spots.\n• For oily acne-prone skin.\n• 15ml.",
  },
  {
    barcode: "3701436908676",
    slug: "lierac-the-scrub-mask-75ml",
    sku: "LRC-908676",
    price: 18000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "لييراك - ماسك The Scrub Mask التقشيري 75 مل",
    nameEn: "Lierac The - Scrub Mask Exfoliating 75ml",
    descriptionAr:
      "ماسك تقشير 2 في 1 من لييراك — مقشر وماسك في منتج واحد.\n\n" +
      "• يزيل خلايا الجلد الميتة وينعّم البشرة.\n• للاستخدام 1–2 مرات أسبوعياً.\n• 75 مل.",
    descriptionEn:
      "Lierac The Scrub Mask — 2-in-1 exfoliating mask.\n\n" +
      "• Removes dead cells and smooths skin.\n• Use 1–2 times per week.\n• 75ml.",
  },
  {
    barcode: "3701436908348",
    slug: "lierac-the-cleansing-foam-150ml",
    sku: "LRC-908348",
    price: 16000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "لييراك - رغوة The Cleansing Foam المنظفة 150 مل",
    nameEn: "Lierac The - Cleansing Foam 150ml",
    descriptionAr:
      "رغوة تنظيف لطيفة من لييراك — للوجه اليومي.\n\n" +
      "• تنظف بلطف دون جفاف.\n• تزيل الشوائب والمكياج الخفيف.\n• للاستخدام صباحاً ومساءً.\n• 150 مل.",
    descriptionEn:
      "Lierac The Cleansing Foam — gentle daily face cleanser.\n\n" +
      "• Cleanses without drying.\n• Removes impurities and light makeup.\n• Daily AM/PM use.\n• 150ml.",
  },
  {
    barcode: "3701436910969",
    slug: "lierac-hydragenist-rehydrating-eye-care-15ml",
    sku: "LRC-910969",
    price: 24000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: EYE,
    nameAr: "لييراك هايدراجينيست - جل العيون المرطّب 15 مل",
    nameEn: "Lierac Hydragenist - The Rehydrating Eye Care 15ml",
    descriptionAr:
      "جل عيون مرطّب من خط Hydragenist — للمنطقة الجافة حول العين.\n\n" +
      "• ترطيب مكثّف للهالات والجفاف.\n• قوام جل منعش سريع الامتصاص.\n• صباحاً ومساءً.\n• 15 مل.",
    descriptionEn:
      "Lierac Hydragenist Rehydrating Eye Care — hydrating eye gel.\n\n" +
      "• Intensive hydration for dry eye area.\n• Refreshing gel texture.\n• AM/PM use.\n• 15ml.",
  },
  {
    barcode: "3701436925390",
    slug: "lierac-lift-integral-neck-decollete-cream-50ml",
    sku: "LRC-925390",
    price: 32000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "لييراك ليفت إنتيغرال - كريم الرقبة ومنطقة الديكولتيه 50 مل",
    nameEn: "Lierac Lift Integral - Neck & Décolleté Cream 50ml",
    descriptionAr:
      "كريم مشدّد للرقبة ومنطقة الديكولتيه من خط Lift Intégral.\n\n" +
      "• يشدّ ويرفع البشرة المترهلة.\n• يحسّن مرونة الرقبة والصدر.\n• للاستخدام صباحاً ومساءً.\n• 50 مل.",
    descriptionEn:
      "Lierac Lift Integral Neck & Décolleté Cream — firming care for neck and chest.\n\n" +
      "• Firms and lifts sagging skin.\n• Improves neck and décolleté elasticity.\n• AM/PM use.\n• 50ml.",
  },
  {
    barcode: "3701436910945",
    slug: "lierac-hydragenist-rehydrating-radiance-cream-gel-50ml",
    sku: "LRC-910945",
    price: 26000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "لييراك هايدراجينيست - كريم-جل الإشراق المرطّب 50 مل",
    nameEn: "Lierac Hydragenist - The Rehydrating Radiance Cream Gel 50ml",
    descriptionAr:
      "كريم-جل مرطّب ومشرق من خط Hydragenist — للبشرة العادية والمختلطة.\n\n" +
      "• ترطيب خفيف مع إشراق فوري.\n• قوام جل-كريم منعش.\n• للاستخدام اليومي.\n• 50 مل.",
    descriptionEn:
      "Lierac Hydragenist Rehydrating Radiance Cream Gel — lightweight hydrating gel-cream.\n\n" +
      "• Light hydration with instant radiance.\n• Refreshing gel-cream texture.\n• Daily use.\n• 50ml.",
  },
  {
    barcode: "3701436910938",
    slug: "lierac-hydragenist-radiance-rehydrating-cream-50ml",
    sku: "LRC-910938",
    price: 26000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "لييراك هايدراجينيست - كريم الإشراق المرطّب 50 مل",
    nameEn: "Lierac Hydragenist - Radiance Rehydrating Cream 50ml",
    descriptionAr:
      "كريم إشراق مرطّب من خط Hydragenist — للبشرة الجافة.\n\n" +
      "• ترطيب عميق وإشراق للبشرة الباهتة.\n• قوام كريمي غني.\n• للاستخدام اليومي.\n• 50 مل.",
    descriptionEn:
      "Lierac Hydragenist Radiance Rehydrating Cream — rich hydrating cream for dry skin.\n\n" +
      "• Deep hydration and radiance for dull skin.\n• Rich creamy texture.\n• Daily use.\n• 50ml.",
  },
  {
    barcode: "3701436908942",
    slug: "lierac-lift-integral-firming-day-cream-50ml",
    sku: "LRC-908942",
    price: 32000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "لييراك ليفت إنتيغرال - كريم النهار المشدّد 50 مل",
    nameEn: "Lierac Lift Integral - Firming Day Cream 50ml",
    descriptionAr:
      "كريم نهاري مشدّد من خط Lift Intégral — لمكافحة الترهل.\n\n" +
      "• يشدّ البشرة ويحسّن الكثافة.\n• للبشرة الناضجة المترهلة.\n• للاستخدام صباحاً.\n• 50 مل.",
    descriptionEn:
      "Lierac Lift Integral Firming Day Cream — anti-sagging day moisturizer.\n\n" +
      "• Firms skin and improves density.\n• For mature sagging skin.\n• Morning use.\n• 50ml.",
  },
  {
    barcode: "3701436919627",
    slug: "lierac-micellar-water-400ml",
    sku: "LRC-919627",
    price: 18000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "لييراك - ماء ميسيلار 400 مل",
    nameEn: "Lierac The - Micellar Water 400ml",
    descriptionAr:
      "ماء ميسيلار من لييراك — ينظف ويزيل المكياج بلطف.\n\n" +
      "• للوجه والعينين والشفاه.\n• بدون شطف — للبشرة الحساسة.\n• 400 مل.",
    descriptionEn:
      "Lierac Micellar Water — gentle cleanse and makeup removal.\n\n" +
      "• For face, eyes and lips.\n• No-rinse formula for sensitive skin.\n• 400ml.",
  },
  {
    barcode: "3701436908645",
    slug: "lierac-micellar-water-200ml",
    sku: "LRC-908645",
    price: 14000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "لييراك - ماء ميسيلار 200 مل",
    nameEn: "Lierac The - Micellar Water 200ml",
    descriptionAr:
      "ماء ميسيلار من لييراك — ينظف ويزيل المكياج بلطف.\n\n" +
      "• للوجه والعينين والشفاه.\n• بدون شطف — للبشرة الحساسة.\n• 200 مل.",
    descriptionEn:
      "Lierac Micellar Water — gentle cleanse and makeup removal.\n\n" +
      "• For face, eyes and lips.\n• No-rinse formula for sensitive skin.\n• 200ml.",
  },
];

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Login failed: ${JSON.stringify(json)}`);
  token = (json as { data?: { accessToken?: string }; accessToken?: string }).data?.accessToken ??
    (json as { accessToken?: string }).accessToken ?? "";
  if (!token) throw new Error("No access token");
}

async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (json as { message?: string; error?: { message?: string } })?.error?.message ??
      (json as { message?: string })?.message ??
      res.statusText;
    throw new Error(`${method} ${path}: ${msg}`);
  }
  return ((json as { data?: T }).data ?? json) as T;
}

async function resolveBrand(): Promise<string> {
  const resolved = await api<{ brand?: { id: string } }>("/brands/resolve", "POST", {
    brandAr: "لييراك",
    brandEn: "Lierac",
    createIfMissing: true,
  });
  const id = resolved.brand?.id;
  if (!id) throw new Error("Could not resolve Lierac brand");
  return id;
}

async function barcodeExists(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean }>(`/products/barcode-check?barcode=${barcode}`);
  return check.exists;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length} (no shades, no images)\n`);
  await login();
  const brandId = await resolveBrand();
  console.log(`Brand: Lierac (${brandId})\n`);

  let added = 0;
  let skipped = 0;

  for (const product of PRODUCTS) {
    console.log(`--- ${product.barcode} ---`);
    if (await barcodeExists(product.barcode)) {
      console.log(`  skip — barcode already exists\n`);
      skipped += 1;
      continue;
    }

    const created = await api<{ id: string }>("/products", "POST", {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      subcategoryIds: [product.subcategoryId],
      tertiaryCategoryId: product.tertiaryCategoryId,
      tertiaryCategoryIds: product.tertiaryCategoryId ? [product.tertiaryCategoryId] : [],
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price: product.price,
      originalPrice: product.price,
      stock: 0,
      isActive: true,
      imageIds: [] as string[],
    });

    const verify = await api<{ shades?: unknown[] }>(`/products/${created.id}`);
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Product ${product.barcode} has shades`);
    console.log(`  ✓ ${product.nameAr}`);
    console.log(`    ID: ${created.id} | ${product.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Done — added: ${added}/${PRODUCTS.length} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
