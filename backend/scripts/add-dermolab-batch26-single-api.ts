/**
 * Dermolab — 26 separate skincare products (no shades, no images).
 * Sources: dermolab.it, go-upc.com, melonistore.com, pharmacy retailers
 * Usage: npx tsx scripts/add-dermolab-batch26-single-api.ts
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
    barcode: "8009518249736",
    slug: "dermolab-anti-aging-replumping-serum-50ml",
    sku: "DML-249736",
    price: 25000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "ديرمولاب - سيروم Anti-Età Star لإعادة امتلاء البشرة 50 مل",
    nameEn: "Dermolab - Anti-Età Star Replumping Serum 50ml",
    descriptionAr:
      "سيروم مضاد للشيخوخة من خط Anti-Età Star — يعيد امتلاء البشرة ويملأ التجاعيد بفضل هيالورونيك أسيد متعدد الطبقات.\n\n" +
      "• تأثير filler يملأ الخطوط الدقيقة.\n• يحسّن مرونة البشرة ويمنحها مظهراً أكثر شباباً.\n• للبشرة الناضجة والجافة.\n• 50 مل — صنع في إيطاليا.",
    descriptionEn:
      "Dermolab Anti-Età Star Replumping Serum — multi-weight hyaluronic acid replumps skin and fills fine lines.\n\n" +
      "• Filler effect on wrinkles.\n• Improves elasticity for a youthful look.\n• For mature and dry skin.\n• 50ml — Made in Italy.",
  },
  {
    barcode: "8009518363326",
    slug: "dermolab-anti-aging-volumizing-lifting-booster-serum-30ml",
    sku: "DML-363326",
    price: 28000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "ديرمولاب - سيروم Booster لرفع وامتلاء البشرة 30 مل",
    nameEn: "Dermolab - Anti-Aging Volumizing Lifting Booster Serum 30ml",
    descriptionAr:
      "سيروم Booster مركّز لرفع وامتلاء البشرة — تركيبة مضادة للشيخوخة بفعالية عالية.\n\n" +
      "• يعزّز حجم البشرة ويمنح تأثير lifting.\n• يقلّل التجاعيد ويحسّن الكثافة.\n• للاستخدام قبل الكريم صباحاً ومساءً.\n• 30 مل.",
    descriptionEn:
      "Dermolab Volumizing Lifting Booster Serum — concentrated anti-aging formula for lift and volume.\n\n" +
      "• Enhances skin volume with lifting effect.\n• Reduces wrinkles and improves density.\n• Apply before cream AM/PM.\n• 30ml.",
  },
  {
    barcode: "8009518363340",
    slug: "dermolab-72h-ultra-hydrating-gel-50ml",
    sku: "DML-363340",
    price: 20000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "ديرمولاب - جل الترطيب الفائق 72 ساعة 50 مل",
    nameEn: "Dermolab - 72H Ultra-Hydrating Gel 50ml",
    descriptionAr:
      "جل ترطيب فائق يدوم حتى 72 ساعة — من خط Hydrating.\n\n" +
      "• ترطيب عميق متعدد الطبقات بهيالورونيك أسيد.\n• قوام جل خفيف سريع الامتصاص.\n• للبشرة الجافة والمجهدة.\n• 50 مل.",
    descriptionEn:
      "Dermolab 72H Ultra-Hydrating Gel — long-lasting deep hydration up to 72 hours.\n\n" +
      "• Multi-layer hyaluronic acid hydration.\n• Lightweight fast-absorbing gel texture.\n• For dry and dehydrated skin.\n• 50ml.",
  },
  {
    barcode: "8009518247244",
    slug: "dermolab-anti-aging-redensifying-night-cream-50ml",
    sku: "DML-247244",
    price: 22000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "ديرمولاب - كريم ليلي مضاد للشيخوخة لإعادة كثافة البشرة 50 مل",
    nameEn: "Dermolab - Anti-Aging Redensifying Night Cream 50ml",
    descriptionAr:
      "كريم ليلي مضاد للشيخوخة — يعيد كثافة البشرة أثناء النوم بفضل RIGIN™ tetrapeptide وهيالورونيك أسيد.\n\n" +
      "• يملأ التجاعيد ويحسّن المرونة.\n• تركيبة غنية غير دهنية سريعة الامتصاص.\n• للوجه والرقبة.\n• 50 مل.",
    descriptionEn:
      "Dermolab Anti-Aging Redensifying Night Cream — RIGIN™ tetrapeptide and hyaluronic acids restore density overnight.\n\n" +
      "• Fills wrinkles and improves elasticity.\n• Rich non-greasy fast-absorbing formula.\n• For face and neck.\n• 50ml.",
  },
  {
    barcode: "8009518247107",
    slug: "dermolab-soothing-hydrating-cream-spf15-50ml",
    sku: "DML-247107",
    price: 20000,
    categoryId: CARE,
    subcategoryId: SUN_CARE,
    tertiaryCategoryId: SUNSCREEN,
    nameAr: "ديرمولاب - كريم مرطب مهدئ SPF 15 50 مل",
    nameEn: "Dermolab - Soothing Hydrating Cream SPF 15 50ml",
    descriptionAr:
      "كريم مرطب مهدئ مع حماية SPF 15 — للبشرة الحساسة والجافة.\n\n" +
      "• يرطّب ويهدّئ مع حماية يومية من الشمس.\n• تركيبة لطيفة مناسبة للاستخدام اليومي.\n• للوجه والرقبة.\n• 50 مل.",
    descriptionEn:
      "Dermolab Soothing Hydrating Cream SPF 15 — daily moisturizer with sun protection for sensitive skin.\n\n" +
      "• Hydrates and soothes with SPF 15.\n• Gentle formula for daily use.\n• For face and neck.\n• 50ml.",
  },
  {
    barcode: "8009518354065",
    slug: "dermolab-anti-age-plus-face-neck-night-cream-50ml",
    sku: "DML-354065",
    price: 24000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "ديرمولاب - كريم ليلي Anti-Età Plus للوجه والرقبة 50 مل",
    nameEn: "Dermolab - Anti-Età Plus Face & Neck Night Cream 50ml",
    descriptionAr:
      "كريم ليلي متقدم من خط Anti-Età Plus — للوجه والرقبة.\n\n" +
      "• يعيد تجديد البشرة أثناء النوم.\n• يحارب علامات التقدّم في العمر والترهل.\n• تركيبة غنية للبشرة الناضجة.\n• 50 مل.",
    descriptionEn:
      "Dermolab Anti-Età Plus Face & Neck Night Cream — advanced overnight renewal.\n\n" +
      "• Regenerates skin during sleep.\n• Fights signs of aging and sagging.\n• Rich formula for mature skin.\n• 50ml.",
  },
  {
    barcode: "8009518247121",
    slug: "dermolab-firming-anti-wrinkle-day-cream-spf10-50ml",
    sku: "DML-247121",
    price: 20000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "ديرمولاب - كريم نهاري مشدّد مضاد للتجاعيد SPF 10 50 مل",
    nameEn: "Dermolab - Firming Anti-Wrinkle Day Cream SPF 10 50ml",
    descriptionAr:
      "كريم نهاري مشدّد مضاد للتجاعيد مع SPF 10.\n\n" +
      "• يشدّ البشرة ويقلّل التجاعيد.\n• حماية يومية خفيفة من الشمس.\n• للوجه والرقبة صباحاً.\n• 50 مل.",
    descriptionEn:
      "Dermolab Firming Anti-Wrinkle Day Cream SPF 10 — daily firming anti-wrinkle care.\n\n" +
      "• Firms skin and reduces wrinkles.\n• Light daily sun protection.\n• Apply to face and neck in the morning.\n• 50ml.",
  },
  {
    barcode: "8009518247077",
    slug: "dermolab-mattifying-moisturizing-cream-50ml",
    sku: "DML-247077",
    price: 18000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "ديرمولاب - كريم مرطب مطفي 50 مل",
    nameEn: "Dermolab - Mattifying Moisturizing Cream 50ml",
    descriptionAr:
      "كريم مرطب مطفي — للبشرة الدهنية والمختلطة.\n\n" +
      "• يرطّب دون لمعان ويتحكم في الزهم.\n• قوام خفيف مناسب تحت المكياج.\n• للاستخدام اليومي.\n• 50 مل.",
    descriptionEn:
      "Dermolab Mattifying Moisturizing Cream — for oily and combination skin.\n\n" +
      "• Hydrates without shine, controls sebum.\n• Lightweight base under makeup.\n• For daily use.\n• 50ml.",
  },
  {
    barcode: "8009518339499",
    slug: "dermolab-whitening-anti-dark-spot-night-cream-50ml",
    sku: "DML-339499",
    price: 22000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "ديرمولاب - كريم ليلي للتفتيح ومكافحة البقع الداكنة 50 مل",
    nameEn: "Dermolab - Whitening & Anti Dark Spot Night Cream 50ml",
    descriptionAr:
      "كريم ليلي للتفتيح ومكافحة البقع الداكنة — من خط Whitening.\n\n" +
      "• يفتّح البقع ويوحّد لون البشرة أثناء النوم.\n• يقلّل التصبغات والبهتان.\n• للوجه والرقبة مساءً.\n• 50 مل.",
    descriptionEn:
      "Dermolab Whitening & Anti Dark Spot Night Cream — brightens and evens tone overnight.\n\n" +
      "• Lightens spots and hyperpigmentation.\n• Reduces dullness while you sleep.\n• Apply to face and neck at night.\n• 50ml.",
  },
  {
    barcode: "8009518434538",
    slug: "dermolab-botox-like-rich-filler-effect-cream-50ml",
    sku: "DML-434538",
    price: 28000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "ديرمولاب - كريم Botox-Like Effect الغني بتأثير الفيلر 50 مل",
    nameEn: "Dermolab - Botox-Like Effect Rich Filler-Effect Cream 50ml",
    descriptionAr:
      "كريم غني من خط Botox-Like Effect — تأثير فيلر فوري مع lifting.\n\n" +
      "• يملأ التجاعيد ويشدّ الملامح.\n• تركيبة غنية للبشرة الناضجة.\n• نتائج مرئية فورية.\n• 50 مل.",
    descriptionEn:
      "Dermolab Botox-Like Effect Rich Filler-Effect Cream — instant filler and lifting action.\n\n" +
      "• Fills wrinkles and smooths facial features.\n• Rich formula for mature skin.\n• Visible immediate results.\n• 50ml.",
  },
  {
    barcode: "8009518434354",
    slug: "dermolab-botox-like-filler-booster-serum-10ml",
    sku: "DML-434354",
    price: 22000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "ديرمولاب - سيروم Booster Botox-Like Effect 10 مل",
    nameEn: "Dermolab - Botox-Like Effect Filler Booster Serum 10ml",
    descriptionAr:
      "سيروم Booster مركّز من خط Botox-Like Effect — تأثير فيلر مكثّف.\n\n" +
      "• يملأ التجاعيد ويشدّ البشرة فوراً.\n• تركيبة مركّزة 10 مل.\n• يُستخدم قبل الكريم أو وحده.\n• 10 مل.",
    descriptionEn:
      "Dermolab Botox-Like Effect Filler Booster Serum — concentrated filler serum.\n\n" +
      "• Instant wrinkle filling and firming.\n• Concentrated 10ml formula.\n• Use before cream or alone.\n• 10ml.",
  },
  {
    barcode: "8009518466911",
    slug: "dermolab-botox-like-lip-plumping-treatment-5ml",
    sku: "DML-466911",
    price: 16000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "ديرمولاب - علاج Botox-Like Effect لنفخ الشفاه 5 مل",
    nameEn: "Dermolab - Botox-Like Effect Lip Plumping Treatment 5ml",
    descriptionAr:
      "علاج نفخ الشفاه من خط Botox-Like Effect.\n\n" +
      "• يمنح الشفاه مظهراً ممتلئاً وأكثر حيوية.\n• يرطّب ويملأ الخطوط الدقيقة حول الفم.\n• للاستخدام اليومي على الشفاه.\n• 5 مل.",
    descriptionEn:
      "Dermolab Botox-Like Effect Lip Plumping Treatment — plumping lip care.\n\n" +
      "• Fuller, more voluminous lips.\n• Hydrates and fills fine lines around mouth.\n• Daily lip application.\n• 5ml.",
  },
  {
    barcode: "8009518486216",
    slug: "dermolab-botox-like-eye-contour-filler-cream-15ml",
    sku: "DML-486216",
    price: 22000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: EYE,
    nameAr: "ديرمولاب - كريم Botox-Like Effect لمنطقة العين 15 مل",
    nameEn: "Dermolab - Botox-Like Effect Eye Contour Filler-Effect Cream 15ml",
    descriptionAr:
      "كريم منطقة العين من خط Botox-Like Effect — تأثير فيلر للهالات والتجاعيد.\n\n" +
      "• يملأ تجاعيد العين ويشدّ الجفن.\n• يقلّل الهالات والانتفاخ.\n• للاستخدام صباحاً ومساءً.\n• 15 مل.",
    descriptionEn:
      "Dermolab Botox-Like Effect Eye Contour Filler-Effect Cream — filler action for eye area.\n\n" +
      "• Fills eye wrinkles and firms eyelids.\n• Reduces dark circles and puffiness.\n• AM/PM use.\n• 15ml.",
  },
  {
    barcode: "8009518339475",
    slug: "dermolab-whitening-anti-dark-spot-day-cream-spf20-50ml",
    sku: "DML-339475",
    price: 22000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "ديرمولاب - كريم نهاري للتفتيح ومكافحة البقع SPF 20 50 مل",
    nameEn: "Dermolab - Whitening & Anti Dark Spot Day Cream SPF 20 50ml",
    descriptionAr:
      "كريم نهاري للتفتيح ومكافحة البقع الداكنة مع SPF 20.\n\n" +
      "• يفتّح ويوحّد لون البشرة مع حماية من الشمس.\n• للبشرة المصابة بالتصبغات.\n• للوجه والرقبة صباحاً.\n• 50 مل.",
    descriptionEn:
      "Dermolab Whitening & Anti Dark Spot Day Cream SPF 20 — brightening daily care with sun protection.\n\n" +
      "• Lightens and evens tone with SPF 20.\n• For hyperpigmented skin.\n• Apply to face and neck in the morning.\n• 50ml.",
  },
  {
    barcode: "8009518389944",
    slug: "dermolab-anti-age-plus-face-neck-booster-serum-30ml",
    sku: "DML-389944",
    price: 28000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "ديرمولاب - سيروم Booster Anti-Età Plus للوجه والرقبة 30 مل",
    nameEn: "Dermolab - Anti-Età Plus Face & Neck Booster Serum 30ml",
    descriptionAr:
      "سيروم Booster متقدم من خط Anti-Età Plus — للوجه والرقبة.\n\n" +
      "• يعزّز تجديد البشرة ويحارب الترهل.\n• تركيبة مركّزة قبل الكريم.\n• للبشرة الناضجة.\n• 30 مل.",
    descriptionEn:
      "Dermolab Anti-Età Plus Face & Neck Booster Serum — advanced regenerating concentrate.\n\n" +
      "• Boosts skin renewal and fights sagging.\n• Apply before cream.\n• For mature skin.\n• 30ml.",
  },
  {
    barcode: "8009518354102",
    slug: "dermolab-anti-age-plus-eye-lip-contour-cream-15ml",
    sku: "DML-354102",
    price: 20000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: EYE,
    nameAr: "ديرمولاب - كريم Anti-Età Plus لمنطقة العين والشفاه 15 مل",
    nameEn: "Dermolab - Anti-Età Plus Eye and Lip Contour Cream 15ml",
    descriptionAr:
      "كريم منطقة العين والشفاه من خط Anti-Età Plus.\n\n" +
      "• يقلّل تجاعيد العين والخطوط حول الفم.\n• يرطّب ويشدّ المناطق الحساسة.\n• للاستخدام صباحاً ومساءً.\n• 15 مل.",
    descriptionEn:
      "Dermolab Anti-Età Plus Eye and Lip Contour Cream — targeted anti-aging care.\n\n" +
      "• Reduces eye wrinkles and lip lines.\n• Hydrates and firms delicate areas.\n• AM/PM use.\n• 15ml.",
  },
  {
    barcode: "8009518363302",
    slug: "dermolab-energizing-anti-wrinkle-illuminating-booster-serum-30ml",
    sku: "DML-363302",
    price: 28000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "ديرمولاب - سيروم Booster المنشّط المضاد للتجاعيد والمشرق 30 مل",
    nameEn: "Dermolab - Energizing Anti-Wrinkle Illuminating Booster Serum 30ml",
    descriptionAr:
      "سيروم Booster منشّط ومشرق مضاد للتجاعيد.\n\n" +
      "• يمنح البشرة إشراقاً فورياً وطاقة.\n• يقلّل التجاعيد ويحسّن مظهر البشرة الباهتة.\n• للاستخدام قبل الكريم.\n• 30 مل.",
    descriptionEn:
      "Dermolab Energizing Anti-Wrinkle Illuminating Booster Serum — energizing radiance concentrate.\n\n" +
      "• Instant glow and skin energy.\n• Reduces wrinkles on dull skin.\n• Apply before cream.\n• 30ml.",
  },
  {
    barcode: "8009518247381",
    slug: "dermolab-gentle-exfoliating-scrub-150ml",
    sku: "DML-247381",
    price: 14000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "ديرمولاب - مقشر لطيف للوجه 150 مل",
    nameEn: "Dermolab - Gentle Exfoliating Scrub 150ml",
    descriptionAr:
      "مقشر لطيف للوجه — يزيل خلايا الجلد الميتة بلطف.\n\n" +
      "• يقشر دون تهيّج وينعّم ملمس البشرة.\n• يحضّر البشرة لامتصاص المنتجات.\n• 1–2 مرات أسبوعياً.\n• 150 مل.",
    descriptionEn:
      "Dermolab Gentle Exfoliating Scrub — mild face exfoliator.\n\n" +
      "• Removes dead cells without irritation.\n• Smooths skin texture.\n• Use 1–2 times per week.\n• 150ml.",
  },
  {
    barcode: "8009518491753",
    slug: "dermolab-sun-cream-face-body-spf50-200ml",
    sku: "DML-491753",
    price: 20000,
    categoryId: CARE,
    subcategoryId: SUN_CARE,
    tertiaryCategoryId: SUNSCREEN,
    nameAr: "ديرمولاب - كريم واقي شمس للوجه والجسم SPF 50 200 مل",
    nameEn: "Dermolab - Sun Cream Face and Body SPF 50 200ml",
    descriptionAr:
      "كريم واقي شمس للوجه والجسم SPF 50 — حماية عالية.\n\n" +
      "• حماية واسعة UVA/UVB.\n• قوام خفيف مناسب للوجه والجسم.\n• للاستخدام اليومي في الشمس.\n• 200 مل.",
    descriptionEn:
      "Dermolab Sun Cream Face and Body SPF 50 — high broad-spectrum protection.\n\n" +
      "• Broad UVA/UVB protection.\n• Lightweight for face and body.\n• Daily sun exposure.\n• 200ml.",
  },
  {
    barcode: "8009518247329",
    slug: "dermolab-moisturizing-cleansing-gel-150ml",
    sku: "DML-247329",
    price: 14000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "ديرمولاب - جل غسول مرطب للوجه 150 مل",
    nameEn: "Dermolab - Moisturizing Cleansing Gel 150ml",
    descriptionAr:
      "جل غسول مرطب للوجه — ينظف دون جفاف.\n\n" +
      "• يزيل الشوائب والمكياج بلطف.\n• يحافظ على رطوبة البشرة.\n• للاستخدام اليومي صباحاً ومساءً.\n• 150 مل.",
    descriptionEn:
      "Dermolab Moisturizing Cleansing Gel — gentle cleanse without dryness.\n\n" +
      "• Removes impurities and makeup gently.\n• Maintains skin moisture.\n• Daily AM/PM use.\n• 150ml.",
  },
  {
    barcode: "8009518443639",
    slug: "dermolab-dense-hydrating-cleansing-oil-120ml",
    sku: "DML-443639",
    price: 16000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "ديرمولاب - زيت تنظيف مرطب كثيف للوجه والعينين والشفاه 120 مل",
    nameEn: "Dermolab - Dense Hydrating Cleansing Oil 120ml",
    descriptionAr:
      "زيت تنظيف مرطب كثيف — للوجه والعينين والشفاه.\n\n" +
      "• يذيب المكياج المقاوم للماء بلطف.\n• ينظف ويرطّب في خطوة واحدة.\n• للبشرة الجافة.\n• 120 مل.",
    descriptionEn:
      "Dermolab Dense Hydrating Cleansing Oil — face, eyes and lips.\n\n" +
      "• Gently dissolves waterproof makeup.\n• Cleanses and hydrates in one step.\n• For dry skin.\n• 120ml.",
  },
  {
    barcode: "8009518247305",
    slug: "dermolab-moisturizing-tonic-lotion-200ml",
    sku: "DML-247305",
    price: 14000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "ديرمولاب - تونر مرطب 200 مل",
    nameEn: "Dermolab - Moisturizing Tonic Lotion 200ml",
    descriptionAr:
      "تونر مرطب — يوازن ويرطّب البشرة بعد الغسيل.\n\n" +
      "• يحضّر البشرة لامتصاص السيروم والكريم.\n• ينعش ويرطّب دون جفاف.\n• للاستخدام بعد التنظيف.\n• 200 مل.",
    descriptionEn:
      "Dermolab Moisturizing Tonic Lotion — balances and hydrates after cleansing.\n\n" +
      "• Preps skin for serum and cream.\n• Refreshes without drying.\n• Use after cleansing.\n• 200ml.",
  },
  {
    barcode: "8009518249873",
    slug: "dermolab-anti-aging-tonic-lotion-200ml",
    sku: "DML-249873",
    price: 15000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "ديرمولاب - تونر مضاد للشيخوخة 200 مل",
    nameEn: "Dermolab - Anti-Aging Tonic Lotion 200ml",
    descriptionAr:
      "تونر مضاد للشيخوخة — يحضّر البشرة الناضجة للعناية.\n\n" +
      "• يعزّز فعالية منتجات Anti-Aging.\n• ينعش ويوحّد ملمس البشرة.\n• بعد الغسول وقبل السيروم.\n• 200 مل.",
    descriptionEn:
      "Dermolab Anti-Aging Tonic Lotion — preps mature skin for anti-aging care.\n\n" +
      "• Enhances anti-aging product efficacy.\n• Refreshes and evens texture.\n• After cleanser, before serum.\n• 200ml.",
  },
  {
    barcode: "8009518389326",
    slug: "dermolab-ultra-gentle-micellar-water-6in1-400ml",
    sku: "DML-389326",
    price: 16000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "ديرمولاب - ماء ميسيلار لطيف فائق 6 في 1 400 مل",
    nameEn: "Dermolab - Ultra Gentle Micellar Water 6-in-1 400ml",
    descriptionAr:
      "ماء ميسيلار لطيف فائق 6 في 1 — تنظيف وإزالة مكياج وتونر وترطيب.\n\n" +
      "• للوجه والعينين والشفاه.\n• مناسب للبشرة الحساسة.\n• بدون شطف.\n• 400 مل.",
    descriptionEn:
      "Dermolab Ultra Gentle Micellar Water 6-in-1 — cleanse, remove makeup, tone and hydrate.\n\n" +
      "• For face, eyes and lips.\n• Suitable for sensitive skin.\n• No-rinse formula.\n• 400ml.",
  },
  {
    barcode: "8009518363401",
    slug: "dermolab-anti-age-micellar-water-6in1-400ml",
    sku: "DML-363401",
    price: 16000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "ديرمولاب - ماء ميسيلار مضاد للشيخوخة 6 في 1 400 مل",
    nameEn: "Dermolab - Anti-Age Micellar Water 6-in-1 400ml",
    descriptionAr:
      "ماء ميسيلار مضاد للشيخوخة 6 في 1 — للبشرة الناضجة.\n\n" +
      "• ينظف ويزيل المكياج مع مكونات anti-aging.\n• للوجه والعينين.\n• بدون شطف.\n• 400 مل.",
    descriptionEn:
      "Dermolab Anti-Age Micellar Water 6-in-1 — cleansing with anti-aging actives.\n\n" +
      "• Cleanses and removes makeup.\n• For face and eyes.\n• No-rinse formula.\n• 400ml.",
  },
  {
    barcode: "8009518363425",
    slug: "dermolab-hydrating-micellar-cleansing-milk-250ml",
    sku: "DML-363425",
    price: 14000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "ديرمولاب - حليب ميسيلار مرطب للتنظيف 250 مل",
    nameEn: "Dermolab - Hydrating Micellar Cleansing Milk 250ml",
    descriptionAr:
      "حليب ميسيلار مرطب للتنظيف — للبشرة الجافة والحساسة.\n\n" +
      "• ينظف ويزيل المكياج بلطف.\n• يترك البشرة ناعمة ومرطبة.\n• للوجه والعينين.\n• 250 مل.",
    descriptionEn:
      "Dermolab Hydrating Micellar Cleansing Milk — gentle cleanse for dry sensitive skin.\n\n" +
      "• Cleanses and removes makeup gently.\n• Leaves skin soft and moisturized.\n• For face and eyes.\n• 250ml.",
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
    brandAr: "ديرمولاب",
    brandEn: "Dermolab",
    createIfMissing: true,
  });
  const id = resolved.brand?.id;
  if (!id) throw new Error("Could not resolve Dermolab brand");
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
  console.log(`Brand: Dermolab (${brandId})\n`);

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
