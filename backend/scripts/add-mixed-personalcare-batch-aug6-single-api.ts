/**
 * Mixed personal care — 42 separate SKUs (NO shades, NO images).
 * Deodorants, body sprays/mists, oral care, face makeup & skincare.
 *
 * Usage: npx tsx scripts/add-mixed-personalcare-batch-aug6-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const CARE_FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const CLEANSERS = "05028a17-da64-4c66-b25f-73c758acc2f8";
const FACE_MOIST = "21801439-d0e9-4106-b5e8-dfdd70ffeb8d";
const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";
const BODY = "23aaaa07-91ee-4937-847e-d7866a9e937a";
const DEODORANT = "9464c921-9650-421f-8e2b-6a172f7524c5";
const PERFUME = "975e0e23-edd2-4181-ad6d-ecade6452b95";
const BODY_PERFUMES = "453c027d-0022-455b-91a9-d4299479ec62";
const ORAL_CARE = "bbf672bf-58cf-4cd3-8b17-46a7ddcc1c27";
const TOOTHPASTE = "cc1aa9c2-85a2-4776-80b8-e332394e2bad";

type BrandKey =
  | "dermaflora"
  | "franckolivier"
  | "hot"
  | "secret"
  | "fa"
  | "rutoz"
  | "ossum"
  | "signal"
  | "armhammer"
  | "lacalut"
  | "parodontax"
  | "sensodyne"
  | "styledeo"
  | "no7"
  | "makebeauty"
  | "tklab";

type ProductDef = {
  barcode: string;
  brandKey: BrandKey;
  price: number;
  originalPrice?: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId?: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const BRANDS: Record<BrandKey, { brandAr: string; brandEn: string; prefix: string }> = {
  dermaflora: { brandAr: "ديرمافلورا", brandEn: "Dermaflora", prefix: "DRF" },
  franckolivier: { brandAr: "فرانك أوليفييه", brandEn: "Franck Olivier", prefix: "FOL" },
  hot: { brandAr: "هوت", brandEn: "Hot", prefix: "HOT" },
  secret: { brandAr: "سيكريت", brandEn: "Secret", prefix: "SCR" },
  fa: { brandAr: "فا", brandEn: "Fa", prefix: "FA" },
  rutoz: { brandAr: "روتوز", brandEn: "Rutoz", prefix: "RTZ" },
  ossum: { brandAr: "أوسوم", brandEn: "Ossum", prefix: "OSS" },
  signal: { brandAr: "سيغنال", brandEn: "Signal", prefix: "SIG" },
  armhammer: { brandAr: "آرم آند هامر", brandEn: "Arm & Hammer", prefix: "AHM" },
  lacalut: { brandAr: "لاكالوت", brandEn: "Lacalut", prefix: "LCL" },
  parodontax: { brandAr: "بارودونتكس", brandEn: "Parodontax", prefix: "PRD" },
  sensodyne: { brandAr: "سنسوداين", brandEn: "Sensodyne", prefix: "SND" },
  styledeo: { brandAr: "ستايل ديو", brandEn: "Style Deo", prefix: "STD" },
  no7: { brandAr: "نو7", brandEn: "No7", prefix: "NO7" },
  makebeauty: { brandAr: "ميك بيوتي", brandEn: "MAKE Beauty", prefix: "MKB" },
  tklab: { brandAr: "تي كي لاب", brandEn: "TKLAB", prefix: "TKL" },
};

const PRODUCTS: ProductDef[] = [
  // ── Dermaflora deodorants ──
  {
    barcode: "5997001715758",
    brandKey: "dermaflora",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بخاخ مزيل عرق طبيعي ديرمافلورا 0% للرجال Intensity 150 مل",
    nameEn: "Dermaflora - 0% For Him Intensity Natural Deodorant Spray 150ml",
    descriptionAr:
      "بخاخ مزيل عرق طبيعي من ديرمافلورا بتركيبة 0% للرجال برائحة Intensity — حماية يومية من العرق والرائحة بمكوّنات لطيفة على البشرة.\n\n" +
      "• تركيبة طبيعية خالية من الألومنيوم والكحول — مناسبة للبشرة الحساسة تحت الإبط.\n" +
      "• رائحة رجالية منعشة ثابتة طوال اليوم في الجو الحار.\n" +
      "• 150 مل — يُرشّ على بشرة نظيفة وجافة صباحاً وعند الحاجة.",
    descriptionEn:
      "Dermaflora 0% For Him Intensity Natural Deodorant Spray — gentle, aluminium-free daily protection with a fresh masculine scent.\n\n" +
      "• Natural formula kind to sensitive underarm skin.\n" +
      "• Long-lasting freshness for active days in hot weather.\n" +
      "• 150ml — spray on clean, dry skin morning and as needed.",
  },
  {
    barcode: "5997001715772",
    brandKey: "dermaflora",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بخاخ مزيل عرق طبيعي ديرمافلورا 0% بثمر الورد 150 مل",
    nameEn: "Dermaflora - 0% Rosehip Natural Deodorant Spray 150ml",
    descriptionAr:
      "بخاخ مزيل عرق طبيعي من ديرمافلورا بتركيبة 0% برائحة بثمر الورد — عناية لطيفة مع حماية من العرق والرائحة طوال اليوم.\n\n" +
      "• مستخلص بثمر الورد يهدّئ ويرطّب منطقة الإبط دون إحساس باللزوجة.\n" +
      "• خالٍ من الألومنيوم والكحول — مثالي للبشرة الحساسة.\n" +
      "• 150 مل — انتعاش ناعم وطبيعي للاستخدام اليومي.",
    descriptionEn:
      "Dermaflora 0% Rosehip Natural Deodorant Spray — gentle, aluminium-free protection with a soft rosehip scent.\n\n" +
      "• Rosehip extract soothes and moisturises underarms.\n" +
      "• Alcohol-free formula suitable for sensitive skin.\n" +
      "• 150ml — everyday natural freshness.",
  },
  {
    barcode: "5997001715741",
    brandKey: "dermaflora",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بخاخ مزيل عرق طبيعي ديرمافلورا للرجال Serenity 150 مل",
    nameEn: "Dermaflora - For Him Serenity Natural Deodorant Spray 150ml",
    descriptionAr:
      "بخاخ مزيل عرق طبيعي Serenity للرجال من ديرمافلورا — حماية مريحة من العرق برائحة هادئة ومنعشة.\n\n" +
      "• تركيبة طبيعية لطيفة على البشرة مع ثبات يدوم طوال اليوم.\n" +
      "• رائحة Serenity رجالية أنيقة — مناسبة للعمل والرياضة.\n" +
      "• 150 مل — يجف بسرعة ولا يترك بقعاً على الملابس.",
    descriptionEn:
      "Dermaflora For Him Serenity Natural Deodorant Spray — comfortable daily protection with a calm, refreshing masculine scent.\n\n" +
      "• Natural, skin-friendly formula with all-day wear.\n" +
      "• Elegant Serenity fragrance for work, sport and everyday use.\n" +
      "• 150ml — quick-dry, non-staining spray.",
  },
  // ── Fragrance / body sprays ──
  {
    barcode: "3516641921613",
    brandKey: "franckolivier",
    price: 12000,
    originalPrice: 14000,
    categoryId: PERFUME,
    subcategoryId: BODY_PERFUMES,
    nameAr: "بخاخ عطر جسم فرانك أوليفييه عود فانيلا للجنسين 250 مل",
    nameEn: "Franck Olivier - Oud Vanille Unisex Perfumed Body Spray 250ml",
    descriptionAr:
      "بخاخ عطر جسم Oud Vanille من فرانك أوليفييه — مزيج فاخر من العود والفانيلا للجنسين يمنح الجسم عطراً دافئاً وجذاباً.\n\n" +
      "• رائحة شرقية فاخرة تناسب المناسبات والاستخدام اليومي.\n" +
      "• تركيبة خفيفة تُرشّ على الجسم والملابس بسهولة.\n" +
      "• 250 مل — حجم عائلي بقيمة ممتازة.",
    descriptionEn:
      "Franck Olivier Oud Vanille Unisex Perfumed Body Spray — a luxurious oud and vanilla blend for warm, captivating body fragrance.\n\n" +
      "• Rich oriental scent for daily wear or special occasions.\n" +
      "• Lightweight mist for skin and clothes.\n" +
      "• 250ml — generous family size.",
  },
  {
    barcode: "3325158510025",
    brandKey: "hot",
    price: 10000,
    originalPrice: 12000,
    categoryId: PERFUME,
    subcategoryId: BODY_PERFUMES,
    nameAr: "بخاخ عطر جسم هوت بلاك للرجال 200 مل",
    nameEn: "Hot - Black Men's Perfumed Body Spray 200ml",
    descriptionAr:
      "بخاخ عطر جسم Hot Black للرجال — رائحة قوية وجريئة تمنح ثقة وانتعاشاً يدوم طوال اليوم.\n\n" +
      "• عطر جسم رجالي كلاسيكي بثبات جيد في الجو الحار.\n" +
      "• يُرشّ على الجسم والملابس بعد الاستحمام.\n" +
      "• 200 مل — مثالي للاستخدام اليومي والمناسبات.",
    descriptionEn:
      "Hot Black Men's Perfumed Body Spray — a bold, confident fragrance for all-day freshness.\n\n" +
      "• Classic masculine body scent with good longevity.\n" +
      "• Spray on skin and clothes after showering.\n" +
      "• 200ml — ideal for daily and evening wear.",
  },
  {
    barcode: "7500435180665",
    brandKey: "secret",
    price: 11000,
    originalPrice: 13000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بخاخ مضاد تعرق سيكريت برائحة زهر البرتقال 93 غرام",
    nameEn: "Secret - Orange Blossom Antiperspirant Deodorant Spray 93g",
    descriptionAr:
      "بخاخ مضاد تعرق من سيكريت برائحة زهر البرتقال — حماية فعّالة من التعرق والرائحة مع عطر زهري منعش.\n\n" +
      "• صيغة مضادة للتعرق توفر حماية طويلة في الأيام الحارة.\n" +
      "• رائحة Orange Blossom نسائية خفيفة وأنيقة.\n" +
      "• 93 غرام — يجف بسرعة ولا يترك آثاراً بيضاء.",
    descriptionEn:
      "Secret Orange Blossom Antiperspirant Deodorant Spray — effective sweat and odour protection with a fresh floral scent.\n\n" +
      "• Antiperspirant formula for long-lasting protection.\n" +
      "• Light, elegant orange blossom fragrance.\n" +
      "• 93g — quick-dry, no white marks.",
  },
  {
    barcode: "8410436437561",
    brandKey: "fa",
    price: 9000,
    originalPrice: 10500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بخاخ مزيل عرق فا سبورت 150 مل",
    nameEn: "Fa - Sport Deodorant Body Spray 150ml",
    descriptionAr:
      "بخاخ مزيل عرق فا سبورت — حماية من العرق والرائحة مع انتعاش رياضي منعش يناسب نمط الحياة النشط.\n\n" +
      "• صيغة Sport مصممة للأنشطة اليومية والتمرين.\n" +
      "• يجف بسرعة ويمنح إحساساً بالبرودة والانتعاش.\n" +
      "• 150 مل — للاستخدام بعد الاستحمام أو قبل النشاط البدني.",
    descriptionEn:
      "Fa Sport Deodorant Body Spray — sporty freshness with reliable odour protection for active lifestyles.\n\n" +
      "• Designed for daily activity and workouts.\n" +
      "• Quick-dry formula with a cooling, fresh feel.\n" +
      "• 150ml — use after shower or before exercise.",
  },
  // ── Rutoz body mists ──
  {
    barcode: "3700134310446",
    brandKey: "rutoz",
    price: 14000,
    originalPrice: 16000,
    categoryId: PERFUME,
    subcategoryId: BODY_PERFUMES,
    nameAr: "رذاذ جسم روتوز أستر Aster 250 مل",
    nameEn: "Rutoz - Aster Body Mist 250ml",
    descriptionAr:
      "رذاذ جسم روتوز أستر Aster — ميست فرنسي برائحة زهرية منعشة خفيفة تدوم على البشرة.\n\n" +
      "• رائحة Aster الرسمية من مجموعة رذاذ الجسم روتوز.\n" +
      "• لطيف على البشرة ومثالي بعد الاستحمام أو لتجديد الانتعاش خلال اليوم.\n" +
      "• 250 مل — حجم عملي للمنزل والحقيبة.",
    descriptionEn:
      "Rutoz Aster Body Mist — a fresh floral body mist made in France for everyday lightness and long-lasting softness on the skin.\n\n" +
      "• Official Aster scent from the Rutoz body mist range.\n" +
      "• Gentle on skin and ideal after shower or for a midday refresh.\n" +
      "• 250ml — layerable mist for home and on the go.",
  },
  {
    barcode: "3700134310415",
    brandKey: "rutoz",
    price: 14000,
    originalPrice: 16000,
    categoryId: PERFUME,
    subcategoryId: BODY_PERFUMES,
    nameAr: "رذاذ جسم روتوز بيورتي Purity 250 مل",
    nameEn: "Rutoz - Purity Body Mist 250ml",
    descriptionAr:
      "رذاذ جسم روتوز بيورتي Purity — ميست ناعم بنفحات زهرية نظيفة يمنح إحساساً بالنقاء والانتعاش.\n\n" +
      "• رائحة Purity الرسمية من روتوز.\n" +
      "• خفيف ومناسب للصباح والمساء.\n" +
      "• 250 مل — يُرشّ على الجسم والملابس دون إثقال.",
    descriptionEn:
      "Rutoz Purity Body Mist — a clean, soft floral mist that leaves a pure and fresh feeling all day.\n\n" +
      "• Official Purity scent from Rutoz.\n" +
      "• Light enough for morning and evening wear.\n" +
      "• 250ml — spritz on skin and clothes without heaviness.",
  },
  {
    barcode: "3700134310422",
    brandKey: "rutoz",
    price: 14500,
    originalPrice: 16500,
    categoryId: PERFUME,
    subcategoryId: BODY_PERFUMES,
    nameAr: "رذاذ جسم روتوز لاكي Lucky 250 مل",
    nameEn: "Rutoz - Lucky Body Mist 250ml",
    descriptionAr:
      "رذاذ جسم روتوز لاكي Lucky — عطر يومي جذاب من مجموعة ميست روتوز الرسمية بثبات وانتعاش لطيف.\n\n" +
      "• رائحة Lucky الرسمية.\n" +
      "• مناسب للعمل والخروجات والاستخدام اليومي.\n" +
      "• 250 مل — رذاذ خفيف يمكن تكراره خلال اليوم.",
    descriptionEn:
      "Rutoz Lucky Body Mist — an attractive everyday scent with lasting freshness from the official Rutoz mist collection.\n\n" +
      "• Official Lucky fragrance.\n" +
      "• Soft body mist for daily confidence and outings.\n" +
      "• 250ml — made for frequent light sprays.",
  },
  {
    barcode: "3700134310453",
    brandKey: "rutoz",
    price: 14000,
    originalPrice: 16000,
    categoryId: PERFUME,
    subcategoryId: BODY_PERFUMES,
    nameAr: "رذاذ جسم روتوز سوفت تاتش Soft-Touch 250 مل",
    nameEn: "Rutoz - Soft-Touch Body Mist 250ml",
    descriptionAr:
      "رذاذ جسم روتوز سوفت تاتش Soft-Touch — ميست ناعم يلامس البشرة بلطف ويمنح انتعاشاً دون قسوة.\n\n" +
      "• رائحة Soft-Touch الرسمية من روتوز.\n" +
      "• خفيف ومناسب للاستخدام المتكرر.\n" +
      "• 250 مل — مثالي بعد الاستحمام وطوال اليوم.",
    descriptionEn:
      "Rutoz Soft-Touch Body Mist — a gentle, soft-feeling fragrance mist that refreshes skin without harshness.\n\n" +
      "• Official Soft-Touch scent from Rutoz.\n" +
      "• Light and skin-friendly for frequent use.\n" +
      "• 250ml — perfect after shower and through the day.",
  },
  {
    barcode: "3700124340507",
    brandKey: "rutoz",
    price: 11000,
    originalPrice: 13000,
    categoryId: PERFUME,
    subcategoryId: BODY_PERFUMES,
    nameAr: "معطر جسم روتوز فرنش سبيشل Proud للرجال 200 مل",
    nameEn: "Rutoz - French Special Freshener Proud for Men 200ml",
    descriptionAr:
      "معطر جسم روتوز فرنش سبيشل Proud للرجال — بخاخ معطر رجالي برائحة كلاسيكية واثقة.\n\n" +
      "• رائحة Proud الرسمية من خط French Special Freshener.\n" +
      "• معطر جسم رجالي (ليس ميست نسائي).\n" +
      "• 200 مل — يُرشّ على الجسم والملابس بعد الاستحمام.",
    descriptionEn:
      "Rutoz French Special Freshener Proud for Men — a masculine body freshener spray with a confident classic scent.\n\n" +
      "• Official Proud scent from the French Special Freshener line.\n" +
      "• Body freshener spray (not a body mist) for men.\n" +
      "• 200ml — spray on body and clothes after showering.",
  },
  // ── Ossum body sprays ──
  {
    barcode: "6297000842219",
    brandKey: "ossum",
    price: 12000,
    originalPrice: 14000,
    categoryId: PERFUME,
    subcategoryId: BODY_PERFUMES,
    nameAr: "بخاخ عطر جسم أوسوم Desire 120 مل",
    nameEn: "Ossum - Desire Perfumed Body Spray 120ml",
    descriptionAr:
      "بخاخ عطر جسم Desire من أوسوم — رائحة جذابة وعاطفية تمنح الجسم عطراً دافئاً يدوم طوال اليوم.\n\n" +
      "• عطر جسم بثبات جيد وسعر مناسب للاستخدام اليومي.\n" +
      "• رائحة Desire — مزيج منعش وجذاب للجنسين.\n" +
      "• 120 مل — حجم عملي للحقيبة والسفر.",
    descriptionEn:
      "Ossum Desire Perfumed Body Spray — an alluring, warm body fragrance for all-day appeal.\n\n" +
      "• Good longevity at an everyday-friendly price.\n" +
      "• Desire scent — fresh and captivating.\n" +
      "• 120ml — practical travel-friendly size.",
  },
  {
    barcode: "6297000842202",
    brandKey: "ossum",
    price: 12000,
    originalPrice: 14000,
    categoryId: PERFUME,
    subcategoryId: BODY_PERFUMES,
    nameAr: "بخاخ عطر جسم نسائي أوسوم Teaser 120 مل",
    nameEn: "Ossum - Teaser Women's Fragrance Body Spray 120ml",
    descriptionAr:
      "بخاخ عطر جسم نسائي Teaser من أوسوم — رائحة لعوبة ومنعشة تمنح إطلالة أنثوية جذابة.\n\n" +
      "• عطر جسم نسائي خفيف ومناسب للاستخدام اليومي.\n" +
      "• Teaser — نوتات فوّاحة تلفت الانتباه بلطف.\n" +
      "• 120 مل — للرشّ على الجسم والملابس.",
    descriptionEn:
      "Ossum Teaser Women's Fragrance Body Spray — a playful, fresh feminine scent for everyday charm.\n\n" +
      "• Light women's body fragrance for daily wear.\n" +
      "• Teaser — flirty, attention-catching notes.\n" +
      "• 120ml — spritz on skin and clothes.",
  },
  {
    barcode: "6297000842233",
    brandKey: "ossum",
    price: 12000,
    originalPrice: 14000,
    categoryId: PERFUME,
    subcategoryId: BODY_PERFUMES,
    nameAr: "بخاخ عطر جسم نسائي أوسوم Cherish 120 مل",
    nameEn: "Ossum - Cherish Fragrance Body Spray for Women 120ml",
    descriptionAr:
      "بخاخ عطر جسم Cherish من أوسوم — رائحة نسائية دافئة ورقيقة تعبّر عن الأنوثة والأناقة.\n\n" +
      "• عطر جسم ناعم مناسب للعمل والمناسبات اليومية.\n" +
      "• Cherish — نوتات زهرية وفواكهية متوازنة.\n" +
      "• 120 مل — ثبات جيد بسعر ممتاز.",
    descriptionEn:
      "Ossum Cherish Fragrance Body Spray for Women — a warm, delicate feminine scent full of elegance.\n\n" +
      "• Soft body fragrance for work and daily occasions.\n" +
      "• Cherish — balanced floral and fruity notes.\n" +
      "• 120ml — good lasting power at great value.",
  },
  {
    barcode: "6297001034019",
    brandKey: "ossum",
    price: 12000,
    originalPrice: 14000,
    categoryId: PERFUME,
    subcategoryId: BODY_PERFUMES,
    nameAr: "بخاخ عطر جسم نسائي أوسوم Fantasy 120 مل",
    nameEn: "Ossum - Fantasy Fragrance Body Spray for Women 120ml",
    descriptionAr:
      "بخاخ عطر جسم Fantasy من أوسوم — عطر حالم وخيالي يمنح الجسم رائحة ساحرة ومميزة.\n\n" +
      "• رائحة Fantasy — مزيج منعش من الزهور والفواكه.\n" +
      "• مثالي للفتيات والنساء اللواتي يفضّلن العطور الخفيفة.\n" +
      "• 120 مل — للاستخدام اليومي بعد الاستحمام.",
    descriptionEn:
      "Ossum Fantasy Fragrance Body Spray for Women — a dreamy, enchanting scent for a magical everyday fragrance.\n\n" +
      "• Fantasy — fresh blend of florals and fruits.\n" +
      "• Ideal for those who love light, whimsical scents.\n" +
      "• 120ml — use daily after showering.",
  },
  {
    barcode: "6297000842226",
    brandKey: "ossum",
    price: 12000,
    originalPrice: 14000,
    categoryId: PERFUME,
    subcategoryId: BODY_PERFUMES,
    nameAr: "بخاخ عطر جسم نسائي أوسوم Appeal 120 مل",
    nameEn: "Ossum - Appeal Fragrance Body Spray for Women 120ml",
    descriptionAr:
      "بخاخ عطر جسم Appeal من أوسوم — رائحة نسائية جذابة تمنح ثقة وإشراقاً طوال اليوم.\n\n" +
      "• Appeal — عطر أنيق يناسب كل الفصول والمناسبات.\n" +
      "• تركيبة خفيفة تُرشّ بسهولة على الجسم والملابس.\n" +
      "• 120 مل — من مجموعة أوسوم النسائية المميزة.",
    descriptionEn:
      "Ossum Appeal Fragrance Body Spray for Women — an attractive feminine scent for confidence and radiance.\n\n" +
      "• Appeal — elegant fragrance for all seasons.\n" +
      "• Lightweight mist for skin and clothes.\n" +
      "• 120ml — from Ossum's signature women's range.",
  },
  {
    barcode: "6297001034002",
    brandKey: "ossum",
    price: 12000,
    originalPrice: 14000,
    categoryId: PERFUME,
    subcategoryId: BODY_PERFUMES,
    nameAr: "بخاخ عطر جسم نسائي أوسوم Passion 120 مل",
    nameEn: "Ossum - Passion Fragrance Body Spray for Women 120ml",
    descriptionAr:
      "بخاخ عطر جسم Passion من أوسوم — رائحة عاطفية وقوية تعبّر عن الشغف والأنوثة.\n\n" +
      "• Passion — نوتات دافئة وجريئة للمساء والمناسبات.\n" +
      "• عطر جسم بثبات جيد وسعر مناسب.\n" +
      "• 120 مل — يُكمّل إطلالتك بثقة وجاذبية.",
    descriptionEn:
      "Ossum Passion Fragrance Body Spray for Women — a passionate, bold scent that expresses femininity.\n\n" +
      "• Passion — warm, daring notes for evenings and occasions.\n" +
      "• Good-lasting body fragrance at great value.\n" +
      "• 120ml — completes your look with confidence.",
  },
  // ── Oral care ──
  {
    barcode: "3014230002625",
    brandKey: "signal",
    price: 12000,
    originalPrice: 14000,
    categoryId: CARE,
    subcategoryId: ORAL_CARE,
    tertiaryCategoryId: TOOTHPASTE,
    nameAr: "معجون أسنان سيغنال إنتيغرال 8 نفس نقي مع موزع 100 مل",
    nameEn: "Signal - Integral 8 Pure Breath Toothpaste with Dispenser 100ml",
    descriptionAr:
      "معجون أسنان Signal Integral 8 نفس نقي من سيغنال — حماية شاملة لثمانية احتياجات مع موزع عملي للاستخدام اليومي.\n\n" +
      "• يحمي من التسوس ويقوّي مينا الأسنان ويمنح نفساً منعشاً.\n" +
      "• يأتي مع موزع — مثالي للعائلة والاستخدام المنظم.\n" +
      "• 100 مل — للتنظيف مرتين يومياً صباحاً ومساءً.",
    descriptionEn:
      "Signal Integral 8 Pure Breath Toothpaste with Dispenser — 8-in-1 oral care with a convenient dispenser.\n\n" +
      "• Helps protect against cavities, strengthen enamel and freshen breath.\n" +
      "• Includes dispenser — practical for family use.\n" +
      "• 100ml — brush twice daily morning and night.",
  },
  {
    barcode: "5410373124008",
    brandKey: "signal",
    price: 10000,
    originalPrice: 12000,
    categoryId: CARE,
    subcategoryId: ORAL_CARE,
    tertiaryCategoryId: TOOTHPASTE,
    nameAr: "معجون أسنان سيغنال لحماية التسوس بالكالسيوم الدقيق والفلورايد 100 مل",
    nameEn: "Signal - Caries Protection Toothpaste Micro-Calcium Active Fluoride 100ml",
    descriptionAr:
      "معجون أسنان سيغنال لحماية التسوس — تركيبة بالكالسيوم الدقيق والفلورايد النشط لتقوية مينا الأسنان.\n\n" +
      "• Micro-Calcium يساعد على إعادة تعدين الأسنان ضد الحمض.\n" +
      "• فلورايد نشط لحماية فعّالة من التسوس.\n" +
      "• 100 مل — للاستخدام اليومي مع فرشاة ناعمة.",
    descriptionEn:
      "Signal Caries Protection Toothpaste — micro-calcium and active fluoride formula to strengthen tooth enamel.\n\n" +
      "• Micro-Calcium helps remineralise teeth against acid attack.\n" +
      "• Active fluoride for effective cavity protection.\n" +
      "• 100ml — use daily with a soft toothbrush.",
  },
  {
    barcode: "5010724534847",
    brandKey: "armhammer",
    price: 11000,
    originalPrice: 13000,
    categoryId: CARE,
    subcategoryId: ORAL_CARE,
    tertiaryCategoryId: TOOTHPASTE,
    nameAr: "معجون أسنان آرم آند هامر أدفانس وايت برو مبيّض 75 مل",
    nameEn: "Arm & Hammer - Advance White Pro Whitening Toothpaste 75ml",
    descriptionAr:
      "معجون أسنان Arm & Hammer Advance White Pro — تبييض احترافي بقوة بيكربونات الصوديوم لتلميع الأسنان بلطف.\n\n" +
      "• يزيل البقع السطحية ويمنح ابتسامة أكثر إشراقاً.\n" +
      "• صيغة Pro للتبييض مع حماية من التسوس.\n" +
      "• 75 مل — للاستخدام مرتين يومياً لنتائج أفضل.",
    descriptionEn:
      "Arm & Hammer Advance White Pro Whitening Toothpaste — professional whitening powered by baking soda.\n\n" +
      "• Gently removes surface stains for a brighter smile.\n" +
      "• Pro whitening formula with cavity protection.\n" +
      "• 75ml — use twice daily for best results.",
  },
  {
    barcode: "5010724517123",
    brandKey: "armhammer",
    price: 9000,
    originalPrice: 10500,
    categoryId: CARE,
    subcategoryId: ORAL_CARE,
    tertiaryCategoryId: TOOTHPASTE,
    nameAr: "معجون أسنان آرم آند هامر إكسترا وايت بصودا الخبز 125 غرام",
    nameEn: "Arm & Hammer - Extra White Baking Soda Toothpaste 125g",
    descriptionAr:
      "معجون أسنان Arm & Hammer Extra White — تبييض طبيعي بصودا الخبز لتنظيف عميق وابتسامة أكثر بياضاً.\n\n" +
      "• بيكربونات الصوديوم تنظّف بلطف وتزيل البقع اليومية.\n" +
      "• نكهة منعشة مع حماية من التسوس.\n" +
      "• 125 غرام — حجم عائلي بقيمة ممتازة.",
    descriptionEn:
      "Arm & Hammer Extra White Baking Soda Toothpaste — natural whitening with deep, gentle cleaning.\n\n" +
      "• Baking soda removes everyday stains gently.\n" +
      "• Fresh taste with cavity protection.\n" +
      "• 125g — great family-size value.",
  },
  {
    barcode: "5010724517147",
    brandKey: "armhammer",
    price: 9500,
    originalPrice: 11000,
    categoryId: CARE,
    subcategoryId: ORAL_CARE,
    tertiaryCategoryId: TOOTHPASTE,
    nameAr: "معجون أسنان آرم آند هامر سنسيتف كير للأسنان الحساسة 125 غرام",
    nameEn: "Arm & Hammer - Sensitive Care Baking Soda Toothpaste 125g",
    descriptionAr:
      "معجون أسنان Arm & Hammer Sensitive Care — عناية لطيفة للأسنان الحساسة مع قوة بيكربونات الصوديوم.\n\n" +
      "• يقلّل الحساسية تجاه البارد والساخن والحلو.\n" +
      "• ينظّف بلطف دون إزعاج للثة والأسنان الحساسة.\n" +
      "• 125 غرام — للاستخدام اليومي صباحاً ومساءً.",
    descriptionEn:
      "Arm & Hammer Sensitive Care Baking Soda Toothpaste — gentle care for sensitive teeth with baking soda power.\n\n" +
      "• Helps reduce sensitivity to hot, cold and sweet.\n" +
      "• Gentle cleaning without irritating sensitive gums.\n" +
      "• 125g — use morning and night daily.",
  },
  {
    barcode: "4016369846261",
    brandKey: "lacalut",
    price: 13000,
    originalPrice: 15000,
    categoryId: CARE,
    subcategoryId: ORAL_CARE,
    tertiaryCategoryId: TOOTHPASTE,
    nameAr: "معجون أسنان لاكالوت مالتي إفكت 5 في 1 75 مل",
    nameEn: "Lacalut - Multi-Effect 5-in-1 Toothpaste 75ml",
    descriptionAr:
      "معجون أسنان Lacalut Multi-Effect 5 في 1 — حماية متكاملة للأسنان واللثة في عبوة واحدة.\n\n" +
      "• يحمي من التسوس ويقوّي المينا ويهدّئ اللثة وينعّش النفس.\n" +
      "• علامة Lacalut الألمانية الموثوقة في العناية بالفم.\n" +
      "• 75 مل — للتنظيف المنتظم مرتين يومياً.",
    descriptionEn:
      "Lacalut Multi-Effect 5-in-1 Toothpaste — complete oral care in one tube.\n\n" +
      "• Helps protect against cavities, strengthen enamel, soothe gums and freshen breath.\n" +
      "• Trusted German Lacalut oral care expertise.\n" +
      "• 75ml — brush twice daily.",
  },
  {
    barcode: "4016369616949",
    brandKey: "lacalut",
    price: 12000,
    originalPrice: 14000,
    categoryId: CARE,
    subcategoryId: ORAL_CARE,
    tertiaryCategoryId: TOOTHPASTE,
    nameAr: "معجون أسنان لاكالوت أكتيف هيربال عشبي 75 مل",
    nameEn: "Lacalut - Aktiv Herbal Toothpaste 75ml",
    descriptionAr:
      "معجون أسنان Lacalut Aktiv Herbal — تركيبة عشبية طبيعية لصحة اللثة والأسنان.\n\n" +
      "• مستخلصات عشبية تهدّئ اللثة وتنظّف بلطف.\n" +
      "• مثالي للثة المتهيّجة والحساسة.\n" +
      "• 75 مل — نكهة عشبية منعشة للاستخدام اليومي.",
    descriptionEn:
      "Lacalut Aktiv Herbal Toothpaste — natural herbal formula for gum and tooth health.\n\n" +
      "• Herbal extracts soothe gums and cleanse gently.\n" +
      "• Ideal for irritated or sensitive gums.\n" +
      "• 75ml — refreshing herbal taste for daily use.",
  },
  {
    barcode: "4010439211430",
    brandKey: "lacalut",
    price: 12500,
    originalPrice: 14500,
    categoryId: CARE,
    subcategoryId: ORAL_CARE,
    tertiaryCategoryId: TOOTHPASTE,
    nameAr: "معجون أسنان لاكالوت أكتيف لحماية اللثة 75 مل",
    nameEn: "Lacalut - Aktiv Gum Protection Toothpaste 75ml",
    descriptionAr:
      "معجون أسنان Lacalut Aktiv لحماية اللثة — يعزّز صحة اللثة ويقلّل النزيف والالتهاب.\n\n" +
      "• تركيبة Aktiv المتخصصة في العناية باللثة.\n" +
      "• ينظّف الأسنان بلطف مع حماية من التسوس.\n" +
      "• 75 مل — للاستخدام المنتظم مع تدليك خفيف للثة.",
    descriptionEn:
      "Lacalut Aktiv Gum Protection Toothpaste — strengthens gum health and helps reduce bleeding.\n\n" +
      "• Aktiv formula specially designed for gum care.\n" +
      "• Gentle cleaning with cavity protection.\n" +
      "• 75ml — use regularly with light gum massage.",
  },
  {
    barcode: "6223013531260",
    brandKey: "parodontax",
    price: 14000,
    originalPrice: 16000,
    categoryId: CARE,
    subcategoryId: ORAL_CARE,
    tertiaryCategoryId: TOOTHPASTE,
    nameAr: "معجون أسنان بارودونتكس إكسترا فريش للعناية باللثة 75 مل",
    nameEn: "Parodontax - Extra Fresh Gum Care Toothpaste 75ml",
    descriptionAr:
      "معجون أسنان Parodontax Extra Fresh — عناية متخصصة باللثة مع نفس منعش يدوم.\n\n" +
      "• يساعد على إيقاف نزيف اللثة مع الاستخدام المنتظم.\n" +
      "• تركيبة Extra Fresh لانتعاش إضافي طوال اليوم.\n" +
      "• 75 مل — للتنظيف مرتين يومياً لمدة أسبوعين على الأقل.",
    descriptionEn:
      "Parodontax Extra Fresh Gum Care Toothpaste — specialist gum care with lasting fresh breath.\n\n" +
      "• Helps stop bleeding gums with regular use.\n" +
      "• Extra Fresh formula for added all-day freshness.\n" +
      "• 75ml — brush twice daily for at least two weeks.",
  },
  {
    barcode: "6223013530232",
    brandKey: "parodontax",
    price: 13000,
    originalPrice: 15000,
    categoryId: CARE,
    subcategoryId: ORAL_CARE,
    tertiaryCategoryId: TOOTHPASTE,
    nameAr: "معجون أسنان بارودونتكس الأصلي للعناية باللثة 75 مل",
    nameEn: "Parodontax - Original Gum Care Fluoride Toothpaste 75ml",
    descriptionAr:
      "معجون أسنان Parodontax الأصلي — الصيغة الكلاسيكية للعناية باللثة المعرّضة للنزيف.\n\n" +
      "• يحتوي على فلورايد لحماية الأسنان من التسوس.\n" +
      "• 4 مرات أكثر فعالية من معجون الأسنان العادي في إيقاف نزيف اللثة.\n" +
      "• 75 مل — للاستخدام اليومي كجزء من روتين العناية بالفم.",
    descriptionEn:
      "Parodontax Original Gum Care Fluoride Toothpaste — the classic formula for bleeding gums.\n\n" +
      "• Contains fluoride for cavity protection.\n" +
      "• Clinically proven to help stop bleeding gums.\n" +
      "• 75ml — daily use as part of your oral care routine.",
  },
  {
    barcode: "6223013530263",
    brandKey: "parodontax",
    price: 14500,
    originalPrice: 16500,
    categoryId: CARE,
    subcategoryId: ORAL_CARE,
    tertiaryCategoryId: TOOTHPASTE,
    nameAr: "معجون أسنان بارودونتكس الحماية الكاملة إكسترا فريش 75 مل",
    nameEn: "Parodontax - Complete Protection Extra Fresh Toothpaste 75ml",
    descriptionAr:
      "معجون أسنان Parodontax Complete Protection Extra Fresh — حماية شاملة للأسنان واللثة والنفس.\n\n" +
      "• يجمع بين عناية اللثة والحماية من التسوس والتبييض اللطيف.\n" +
      "• Extra Fresh لنفس منعش طوال اليوم.\n" +
      "• 75 مل — للاستخدام المنتظم صباحاً ومساءً.",
    descriptionEn:
      "Parodontax Complete Protection Extra Fresh Toothpaste — all-round care for teeth, gums and breath.\n\n" +
      "• Combines gum care, cavity protection and gentle whitening.\n" +
      "• Extra Fresh for all-day breath confidence.\n" +
      "• 75ml — use morning and night regularly.",
  },
  {
    barcode: "6223013530256",
    brandKey: "parodontax",
    price: 13500,
    originalPrice: 15500,
    categoryId: CARE,
    subcategoryId: ORAL_CARE,
    tertiaryCategoryId: TOOTHPASTE,
    nameAr: "معجون أسنان بارودونتكس جل بالفلورايد لحماية اللثة 75 مل",
    nameEn: "Parodontax - Fluoride Gel Toothpaste for Gum Protection 75ml",
    descriptionAr:
      "معجون أسنان Parodontax جل بالفلورايد — صيغة جل لطيفة لحماية اللثة والأسنان.\n\n" +
      "• قوام جل ينظّف بلطف ويصل إلى خط اللثة.\n" +
      "• فلورايد لتقوية المينا وحماية من التسوس.\n" +
      "• 75 مل — مثالي للثة الحساسة والمتهيّجة.",
    descriptionEn:
      "Parodontax Fluoride Gel Toothpaste for Gum Protection — gentle gel formula for gums and teeth.\n\n" +
      "• Gel texture cleans gently along the gum line.\n" +
      "• Fluoride strengthens enamel and protects against cavities.\n" +
      "• 75ml — ideal for sensitive, irritated gums.",
  },
  {
    barcode: "6223013530386",
    brandKey: "sensodyne",
    price: 15000,
    originalPrice: 17000,
    categoryId: CARE,
    subcategoryId: ORAL_CARE,
    tertiaryCategoryId: TOOTHPASTE,
    nameAr: "معجون أسنان سنسوداين رابيد ريليف إكسترا فريش للحساسية 75 مل",
    nameEn: "Sensodyne - Rapid Relief Extra Fresh Sensitive Toothpaste 75ml",
    descriptionAr:
      "معجون أسنان Sensodyne Rapid Relief Extra Fresh — تخفيف سريع لحساسية الأسنان مع نفس منعش.\n\n" +
      "• يبدأ العمل بسرعة عند التلامس مع الأسنان الحساسة.\n" +
      "• Extra Fresh لانتعاش إضافي مع حماية يومية.\n" +
      "• 75 مل — للتنظيف مرتين يومياً وللتطبيق الموضعي عند الحاجة.",
    descriptionEn:
      "Sensodyne Rapid Relief Extra Fresh Sensitive Toothpaste — fast sensitivity relief with extra freshness.\n\n" +
      "• Starts working quickly on contact with sensitive teeth.\n" +
      "• Extra Fresh breath with daily protection.\n" +
      "• 75ml — brush twice daily; apply directly for fast relief.",
  },
  {
    barcode: "6223013530423",
    brandKey: "sensodyne",
    price: 15000,
    originalPrice: 17000,
    categoryId: CARE,
    subcategoryId: ORAL_CARE,
    tertiaryCategoryId: TOOTHPASTE,
    nameAr: "معجون أسنان سنسوداين رابيد ريليف إكسترا فريش للحساسية 75 مل",
    nameEn: "Sensodyne - Rapid Relief Extra Fresh Sensitive Toothpaste 75ml",
    descriptionAr:
      "معجون أسنان Sensodyne Rapid Relief Extra Fresh — تخفيف سريع لحساسية الأسنان مع نفس منعش (باركود إقليمي).\n\n" +
      "• نفس التركيبة الفعّالة Rapid Relief بباركود مختلف للتوزيع الإقليمي.\n" +
      "• مثالي للأسنان الحساسة تجاه البارد والساخن والحلو.\n" +
      "• 75 مل — للاستخدام اليومي مرتين صباحاً ومساءً.",
    descriptionEn:
      "Sensodyne Rapid Relief Extra Fresh Sensitive Toothpaste — fast sensitivity relief (regional barcode variant).\n\n" +
      "• Same effective Rapid Relief formula with a different regional barcode.\n" +
      "• Ideal for sensitivity to hot, cold and sweet.\n" +
      "• 75ml — brush twice daily morning and night.",
  },
  {
    barcode: "6223013530850",
    brandKey: "sensodyne",
    price: 14500,
    originalPrice: 16500,
    categoryId: CARE,
    subcategoryId: ORAL_CARE,
    tertiaryCategoryId: TOOTHPASTE,
    nameAr: "معجون أسنان سنسوداين مفعول سريع انتعاش إضافي 75 مل",
    nameEn: "Sensodyne - Rapid Action Extra Fresh Toothpaste 75ml",
    descriptionAr:
      "معجون أسنان Sensodyne Rapid Action Extra Fresh — مفعول سريع ضد حساسية الأسنان مع انتعاش إضافي.\n\n" +
      "• يعمل بسرعة لتهدئة الألم الناتج عن الحساسية.\n" +
      "• يحمي من التسوس ويقوّي المينا مع نكهة منعشة.\n" +
      "• 75 مل — للتنظيف المنتظم وللتطبيق على المناطق الحساسة.",
    descriptionEn:
      "Sensodyne Rapid Action Extra Fresh Toothpaste — fast action against tooth sensitivity with extra freshness.\n\n" +
      "• Works quickly to soothe sensitivity pain.\n" +
      "• Cavity protection and enamel care with a fresh taste.\n" +
      "• 75ml — regular brushing plus targeted application on sensitive spots.",
  },
  // ── Style Deo sticks ──
  {
    barcode: "6251036502424",
    brandKey: "styledeo",
    price: 8000,
    originalPrice: 9500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "مزيل عرق ستايل ديو California Breeze 50 غرام",
    nameEn: "Style Deo - California Breeze Deodorant 50g",
    descriptionAr:
      "مزيل عرق Style Deo California Breeze — عصاة مزيل عرق برائحة نسائية منعشة مستوحاة من نسيم كاليفورنيا.\n\n" +
      "• صيغة عصاة سهلة التطبيق وثابتة طوال اليوم.\n" +
      "• رائحة California Breeze — خفيفة ومنعشة للصيف.\n" +
      "• 50 غرام — للاستخدام اليومي بعد الاستحمام.",
    descriptionEn:
      "Style Deo California Breeze Deodorant — stick deodorant with a fresh, breezy feminine scent.\n\n" +
      "• Easy-to-apply stick formula for all-day protection.\n" +
      "• California Breeze — light, summery fragrance.\n" +
      "• 50g — use daily after showering.",
  },
  {
    barcode: "6251036502431",
    brandKey: "styledeo",
    price: 8000,
    originalPrice: 9500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "مزيل عرق ستايل ديو Romantic Rose 50 غرام",
    nameEn: "Style Deo - Romantic Rose Deodorant 50g",
    descriptionAr:
      "مزيل عرق Style Deo Romantic Rose — عصاة مزيل عرق برائحة ورد رومانسية أنيقة.\n\n" +
      "• حماية من العرق والرائحة برائحة زهرية ناعمة.\n" +
      "• Romantic Rose — مثالي للمناسبات والاستخدام اليومي.\n" +
      "• 50 غرام — يجف بسرعة ولا يترك بقعاً.",
    descriptionEn:
      "Style Deo Romantic Rose Deodorant — stick deodorant with an elegant romantic rose scent.\n\n" +
      "• Odour protection with a soft floral fragrance.\n" +
      "• Romantic Rose — perfect for daily wear and occasions.\n" +
      "• 50g — quick-dry, non-staining formula.",
  },
  {
    barcode: "6251036502417",
    brandKey: "styledeo",
    price: 8000,
    originalPrice: 9500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "مزيل عرق ستايل ديو Soft Lilac 50 غرام",
    nameEn: "Style Deo - Soft Lilac Deodorant 50g",
    descriptionAr:
      "مزيل عرق Style Deo Soft Lilac — عصاة مزيل عرق برائحة بنفسج لطيفة وناعمة.\n\n" +
      "• Soft Lilac — رائحة هادئة ومناسبة للبشرة الحساسة.\n" +
      "• صيغة عصاة عملية للحقيبة والاستخدام السريع.\n" +
      "• 50 غرام — للاستخدام صباحاً وعند الحاجة.",
    descriptionEn:
      "Style Deo Soft Lilac Deodorant — stick deodorant with a gentle, soft lilac fragrance.\n\n" +
      "• Soft Lilac — calm scent suitable for sensitive skin.\n" +
      "• Practical stick format for bag and quick application.\n" +
      "• 50g — use morning and as needed.",
  },
  {
    barcode: "6251036502448",
    brandKey: "styledeo",
    price: 8000,
    originalPrice: 9500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "مزيل عرق ستايل ديو Berry Blossom 50 غرام",
    nameEn: "Style Deo - Berry Blossom Deodorant 50g",
    descriptionAr:
      "مزيل عرق Style Deo Berry Blossom — عصاة مزيل عرق برائحة توت وزهور منعشة.\n\n" +
      "• Berry Blossom — مزيج فواكه وزهور لانتعاش حلو ومنعش.\n" +
      "• حماية يومية من العرق برائحة شبابية.\n" +
      "• 50 غرام — مثالي للفتيات والنساء.",
    descriptionEn:
      "Style Deo Berry Blossom Deodorant — stick deodorant with a fresh berry and floral scent.\n\n" +
      "• Berry Blossom — sweet, fruity-floral freshness.\n" +
      "• Daily odour protection with a youthful fragrance.\n" +
      "• 50g — ideal for teens and women.",
  },
  {
    barcode: "6251036502493",
    brandKey: "styledeo",
    price: 8000,
    originalPrice: 9500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "مزيل عرق ستايل ديو Tropical Pink 50 غرام",
    nameEn: "Style Deo - Tropical Pink Deodorant 50g",
    descriptionAr:
      "مزيل عرق Style Deo Tropical Pink — عصاة مزيل عرق برائحة استوائية وردية منعشة.\n\n" +
      "• Tropical Pink — نوتات فواكه استوائية مع لمسة وردية.\n" +
      "• صيغة عصاة ثابتة للاستخدام في الجو الحار.\n" +
      "• 50 غرام — للاستخدام اليومي بعد الاستحمام.",
    descriptionEn:
      "Style Deo Tropical Pink Deodorant — stick deodorant with a tropical pink fruity fragrance.\n\n" +
      "• Tropical Pink — exotic fruit notes with a pink twist.\n" +
      "• Reliable stick protection for hot weather.\n" +
      "• 50g — daily use after showering.",
  },
  // ── Face makeup / skincare ──
  {
    barcode: "703674511420",
    brandKey: "no7",
    price: 28000,
    originalPrice: 32000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: FOUNDATION,
    nameAr: "كريم بي بي نو7 بيوتي بالم الملون SPF15 درجة Rich 40 مل",
    nameEn: "No7 - Beauty Balm Tinted Skin Veil BB Cream SPF15 Rich 40ml",
    descriptionAr:
      "كريم بي بي Beauty Balm Tinted Skin Veil من نو7 — تغطية خفيفة ملونة مع SPF15 وعناية بالبشرة في خطوة واحدة.\n\n" +
      "• درجة Rich للبشرة المتوسطة إلى الداكنة — توحيد لون طبيعي.\n" +
      "• صيغة BB Cream ترطّب وتنعّم وتمنح إشراقاً صحياً.\n" +
      "• 40 مل — للاستخدام اليومي مع واقي شمس مدمج SPF15.",
    descriptionEn:
      "No7 Beauty Balm Tinted Skin Veil BB Cream SPF15 Rich — light coverage, skincare and sun protection in one.\n\n" +
      "• Rich shade for medium to deep skin tones — natural even finish.\n" +
      "• BB formula hydrates, smooths and adds healthy radiance.\n" +
      "• 40ml — daily use with built-in SPF15.",
  },
  {
    barcode: "749876071003",
    brandKey: "makebeauty",
    price: 22000,
    originalPrice: 25000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: CONCEALER,
    nameAr: "كونسيلر ميك بيوتي Skin Mimetic درجة 07 Medium N",
    nameEn: "MAKE Beauty - Skin Mimetic Concealer 07 Medium N",
    descriptionAr:
      "كونسيلر Skin Mimetic من ميك بيوتي درجة 07 Medium N — تغطية طبيعية للعيوب والهالات بملمس يحاكي البشرة.\n\n" +
      "• صيغة Mimetic تندمج مع لون البشرة دون خطوط واضحة.\n" +
      "• درجة 07 Medium N للبشرة المتوسطة بندرتها محايدة.\n" +
      "• للتطبيق تحت العين وعلى البقع بفرشاة أو إصبع.",
    descriptionEn:
      "MAKE Beauty Skin Mimetic Concealer 07 Medium N — natural-looking coverage that mimics real skin.\n\n" +
      "• Mimetic formula blends seamlessly without obvious lines.\n" +
      "• Shade 07 Medium N for medium skin with neutral undertone.\n" +
      "• Apply under eyes and on blemishes with brush or finger.",
  },
  {
    barcode: "6824637105983",
    brandKey: "tklab",
    price: 19000,
    originalPrice: 22000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "كريم تي كي لاب Goat Multi Recovery متعدد الفوائد 50 غرام",
    nameEn: "TKLAB - Goat Multi Recovery Cream 50g",
    descriptionAr:
      "كريم TKLAB Goat Multi Recovery — كريم وجه متعدد الفوائد بمستخلص حليب الماعز لترميم وترطيب البشرة.\n\n" +
      "• يعزّز مرونة البشرة ويقلّل الجفاف والتشقق.\n" +
      "• صيغة كورية غنية بالمغذّيات للبشرة المتعبة.\n" +
      "• 50 غرام — للاستخدام صباحاً ومساءً على الوجه والرقبة.",
    descriptionEn:
      "TKLAB Goat Multi Recovery Cream — multi-benefit face cream with goat milk extract for repair and hydration.\n\n" +
      "• Boosts skin elasticity and helps reduce dryness.\n" +
      "• Nutrient-rich Korean formula for tired, stressed skin.\n" +
      "• 50g — use morning and evening on face and neck.",
  },
  {
    barcode: "6824637105990",
    brandKey: "tklab",
    price: 20000,
    originalPrice: 23000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "كريم تي كي لاب Goat Multi Recovery الغني للبشرة الجافة 50 غرام",
    nameEn: "TKLAB - Goat Multi Recovery Cream Dry Skin Rich Formula 50g",
    descriptionAr:
      "كريم TKLAB Goat Multi Recovery الغني — صيغة مركّزة للبشرة الجافة والحساسة بمستخلص حليب الماعز.\n\n" +
      "• تركيبة Rich Formula تغلّف البشرة بالرطوبة لفترة أطول.\n" +
      "• يهدّئ الجفاص ويعيد النعومة والمرونة.\n" +
      "• 50 غرام — مثالي للبشرة الجافة في فصل الشتاء والصيف العراقي.",
    descriptionEn:
      "TKLAB Goat Multi Recovery Cream Dry Skin Rich Formula — intensive moisture for dry, sensitive skin.\n\n" +
      "• Rich Formula seals in hydration for longer-lasting comfort.\n" +
      "• Soothes tightness and restores softness and elasticity.\n" +
      "• 50g — ideal for dry skin in harsh weather.",
  },
];

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = (await res.json()) as { data?: { accessToken?: string }; accessToken?: string; message?: string };
  if (!res.ok) throw new Error(json?.message ?? `Login failed HTTP ${res.status}`);
  token = json.data?.accessToken ?? json.accessToken ?? "";
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

async function resolveBrandId(key: BrandKey): Promise<string> {
  const b = BRANDS[key];
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: b.brandAr,
    brandEn: b.brandEn,
    createIfMissing: true,
  });
  if (!resolved.brand?.id) throw new Error(`Brand resolve failed: ${b.brandEn}`);
  console.log(`Brand: ${b.brandEn} / ${b.brandAr} (${resolved.brand.id})${resolved.created ? " [created]" : ""}`);
  return resolved.brand.id;
}

async function deleteIfExists(barcode: string): Promise<void> {
  const check = await api<{ exists: boolean; product?: { id: string; nameEn?: string } }>(
    `/products/barcode-check?barcode=${encodeURIComponent(barcode)}`,
  );
  if (!check.exists || !check.product?.id) return;
  console.log(`  deleting existing: ${check.product.id} (${check.product.nameEn ?? ""})`);
  await api(`/products/${check.product.id}`, "DELETE");
}

function slugify(nameEn: string, barcode: string): string {
  const base = nameEn
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base}-${barcode.slice(-6)}`;
}

async function createProduct(product: ProductDef, brandId: string): Promise<{ id: string }> {
  const brand = BRANDS[product.brandKey];
  const payload: Record<string, unknown> = {
    sku: `${brand.prefix}-${product.barcode.slice(-6)}`,
    barcode: product.barcode,
    slug: slugify(product.nameEn, product.barcode),
    brandId,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
    subcategoryIds: [product.subcategoryId],
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    descriptionAr: product.descriptionAr,
    descriptionEn: product.descriptionEn,
    price: product.price,
    originalPrice: product.originalPrice ?? product.price,
    stock: 0,
    isActive: true,
    imageIds: [] as string[],
  };
  if (product.tertiaryCategoryId) {
    payload.tertiaryCategoryId = product.tertiaryCategoryId;
    payload.tertiaryCategoryIds = [product.tertiaryCategoryId];
  }
  return api<{ id: string }>("/products", "POST", payload);
}

async function processProduct(
  product: ProductDef,
  brandId: string,
): Promise<{ barcode: string; id: string; nameEn: string }> {
  await deleteIfExists(product.barcode);
  const created = await createProduct(product, brandId);
  const verify = await api<{ shades?: unknown[] }>(`/products/${created.id}`);
  if ((verify.shades?.length ?? 0) > 0) throw new Error(`Product ${product.barcode} unexpectedly has shades`);
  return { barcode: product.barcode, id: created.id, nameEn: product.nameEn };
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length} separate SKUs (no shades, no images)\n`);
  await login();
  console.log("Logged in.\n");

  const needed = new Set(PRODUCTS.map((p) => p.brandKey));
  const brandIds: Partial<Record<BrandKey, string>> = {};
  for (const key of needed) brandIds[key] = await resolveBrandId(key);
  console.log("");

  const results: Array<{ barcode: string; id: string; nameEn: string }> = [];
  const failures: Array<{ barcode: string; error: string }> = [];

  for (const product of PRODUCTS) {
    const brandId = brandIds[product.brandKey]!;
    console.log(`--- ${product.barcode} | ${product.nameEn} ---`);
    try {
      const result = await processProduct(product, brandId);
      console.log(`  ✓ ID ${result.id} | ${product.price} IQD\n`);
      results.push(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ✗ FAILED: ${msg} — retrying once...`);
      try {
        await new Promise((r) => setTimeout(r, 800));
        const result = await processProduct(product, brandId);
        console.log(`  ✓ RETRY OK ID ${result.id} | ${product.price} IQD\n`);
        results.push(result);
      } catch (retryErr) {
        const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
        console.log(`  ✗ RETRY FAILED: ${retryMsg}\n`);
        failures.push({ barcode: product.barcode, error: retryMsg });
      }
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nDone — added ${results.length}, failed ${failures.length} / ${PRODUCTS.length}\n`);
  console.log("barcode → product ID → nameEn");
  console.log("─".repeat(100));
  for (const r of results) {
    console.log(`${r.barcode} → ${r.id} → ${r.nameEn}`);
  }
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`${f.barcode}: ${f.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
