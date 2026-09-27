/**
 * Seventeen — 35 separate SKUs (NO shades), high-accuracy bilingual AR/EN
 * for Iraqi market + product images.
 *
 * Sources: seventeencosmetics.com, beautyfree.gr, epharmadora, wecare, listex, orisun
 *
 * Usage: npx tsx scripts/add-seventeen-batch-aug5-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";
const POWDER = "828bbfd2-d611-417a-bdca-0f5424a61171";
const MAKEUP_SPRAY = "afb26abb-e48f-4ced-8863-2c3ba1333505";
const MAKEUP_REMOVERS = "a53f7b8d-1b45-4fa8-9055-d5de6fac6ab8";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const MASCARA = "e1032b57-c1af-49e3-a408-130468f22736";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";
const EYESHADOW = "07f14763-7a8b-4646-a057-8748e2b18bd4";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";
const HIGHLIGHTER = "774d62c3-8119-4c0c-983b-2513fc46df24";
const POWDER_HL = "7480a30f-ed2b-41a8-9349-dd67edb010b6";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const CARE_FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const CLEANSERS = "05028a17-da64-4c66-b25f-73c758acc2f8";
const FACE_MOIST = "21801439-d0e9-4106-b5e8-dfdd70ffeb8d";
const EYE_CARE = "09bedca5-0c6c-4a71-9b03-4bf29cecaf53";
const FACE_MASKS = "5a89a7d0-16d9-47d6-8575-2961289fc526";

const OFF = "https://seventeencosmetics.com/media/images/products";
const BF = "https://beautyfree.gr";
const EPH = "https://epharmadora.com/mediastream/w640/files/products";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrls: string[];
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "5201641725955",
    slug: "seventeen-stimulating-lotion-200ml",
    sku: "SVN-STIMLOT-725955",
    price: 14500,
    originalPrice: 16500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "سفنتين - لوشن منشط Stimulating Lotion تونر مرطب لجميع أنواع البشرة 200 مل",
    nameEn: "Seventeen Stimulating Lotion Alcohol-Free Toning Lotion All Skin Types 200ml",
    descriptionAr:
      "لوشن Stimulating Lotion من سفنتين — تونر منعش خالٍ من الكحول يكمل تنظيف الوجه ويهيّئ البشرة للكريم، مع ترطيب وتهدئة تناسب أجواء العراق.\n\n" +
      "• يزيل بقايا المكياج والغسول بلطف ويوازن درجة حموضة البشرة.\n" +
      "• مستخلص أوراق الزيتون العضوي والبابونج لترطيب وتهدئة.\n" +
      "• بريبايوتكس لدعم الدفاعات الطبيعية للبشرة.\n" +
      "• لجميع أنواع البشرة — مختبر جلدياً ونباتي.\n" +
      "• 200 مل — عبوة قابلة لإعادة التدوير.\n\n" +
      "طريقة الاستخدام: بعد التنظيف صباحاً ومساءً، امسحي الوجه والرقبة بقطنة ثم ضعي الكريم المرطب.",
    descriptionEn:
      "Seventeen Stimulating Lotion — an alcohol-free refreshing toner that clears makeup/cleanser residue, balances pH and preps skin so your cream works better.\n\n" +
      "• Organic olive leaf + chamomile for restore, hydrate and soothe.\n" +
      "• Prebiotics to support the skin’s natural defenses.\n" +
      "• Suitable for all skin types — dermatologically tested, vegan, recyclable bottle.\n" +
      "• 200ml.\n\n" +
      "How to use: After cleansing, morning and night, sweep over face and neck with a cotton pad before moisturizer.",
    imageUrls: [
      `${OFF}/2025/10/Stimulating_Lotion.png`,
      "https://myoras.com/cdn/shop/files/seventeen-stimulating-lotion-all-skin-types-oras-official.jpg?v=1686920938&width=1200",
    ],
  },
  {
    barcode: "5201641022757",
    slug: "seventeen-gentle-restore-exfoliating-toner-150ml",
    sku: "SVN-GREXT-022757",
    price: 18500,
    originalPrice: 21000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "سفنتين - تونر تقشير لطيف Gentle Restore Exfoliating Toner بأحماض PHA 150 مل",
    nameEn: "Seventeen Gentle Restore Exfoliating Toner PHA Leave-On 150ml",
    descriptionAr:
      "تونر Gentle Restore Exfoliating من سفنتين — تقشير لطيف بأحماض PHA دون شطف، يجدد المظهر ويُنعّم الخطوط الدقيقة مع ترطيب عميق حتى للبشرة الحساسة.\n\n" +
      "• غلوكونولاكتون ولاكتوبيونيك أسيد (PHA) لتحسين الملمس وتوحيد اللون بلطف.\n" +
      "• إنزيمات الرمان لإشراقة، و4 أوزان جزيئية من الهيالورونيك للترطيب الفوري والمستمر.\n" +
      "• كفير الماء لدعم التجديد — مثالي للبشرة الجافة/الحساسة في المناخ العراقي.\n" +
      "• 150 مل — لا يُشطف.\n\n" +
      "طريقة الاستخدام: على بشرة نظيفة صباحاً أو مساءً (تجنّبي العينين والشفتين). نهاراً أكملي بواقي شمس عالي الحماية.",
    descriptionEn:
      "Seventeen Gentle Restore Exfoliating Toner — a leave-on PHA toner that restores glow, softens texture and hydrates — gentle enough for dry and sensitive skin.\n\n" +
      "• Gluconolactone + lactobionic acid (PHA) for refined tone.\n" +
      "• Pomegranate enzymes + multi-weight hyaluronic acid + water kefir.\n" +
      "• 150ml — do not rinse.\n\n" +
      "How to use: Apply to cleansed face and neck morning and/or night, avoiding eyes and lips. Always finish with SPF by day.",
    imageUrls: [`${BF}/61598-large_default/seventeen-restore-exfoliating-toner-150ml.jpg`],
  },
  {
    barcode: "5201641728581",
    slug: "seventeen-clear-skin-foaming-gel-cleanser-200ml",
    sku: "SVN-CSFGEL-728581",
    price: 12500,
    originalPrice: 14500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "سفنتين - غسول جل رغوي Clear Skin Foaming Gel للبشرة الدهنية والمعرّضة لحب الشباب 200 مل",
    nameEn: "Seventeen Clear Skin Foaming Gel Cleanser Oily/Acne-Prone 200ml",
    descriptionAr:
      "غسول Clear Skin Foaming Gel من سفنتين — تنظيف عميق بزيت شجرة الشاي للبشرة الدهنية والمعرّضة لحب الشباب دون جفاف مزعج.\n\n" +
      "• يزيل الدهون الزائدة والملوثات ويقلّل ظهور البثور.\n" +
      "• فعل مضاد للبكتيريا مع الحفاظ على راحة البشرة.\n" +
      "• مثالي للروتين اليومي في الجو الحار والرطب.\n" +
      "• 200 مل.\n\n" +
      "طريقة الاستخدام: صباحاً ومساءً على بشرة مبللة، دلكي بلطف ثم اشطفي جيداً. أكملي بسلسلة Clear Skin.",
    descriptionEn:
      "Seventeen Clear Skin Foaming Gel Cleanser — tea-tree powered deep cleanse for oily/acne-prone skin without harsh dryness.\n\n" +
      "• Removes excess sebum and pollution; helps prevent breakouts.\n" +
      "• Antibacterial care that doesn’t strip the skin.\n" +
      "• 200ml.\n\n" +
      "How to use: Morning and evening on damp skin, massage gently, rinse well. Pair with the Clear Skin range.",
    imageUrls: [`${OFF}/2025/07/seventeen_clear_skin_foaming_gel_cleanser_100ml.jpg`],
  },
  {
    barcode: "5201641725962",
    slug: "seventeen-oil-control-lotion-200ml",
    sku: "SVN-OILCTL-725962",
    price: 14500,
    originalPrice: 16500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "سفنتين - لوشن Oil Control تونر موازنة الدهون للبشرة الدهنية 200 مل",
    nameEn: "Seventeen Oil Control Lotion Regulating Toner for Oily Skin 200ml",
    descriptionAr:
      "لوشن Oil Control من سفنتين — تونر موازنة للبشرة الدهنية يكمّل التنظيف ويقلّل الدهون ومظهر المسام لمظهر مات نقي.\n\n" +
      "• مركّب الخميرة والفطر الحيوي لتنظيم الإفراز الدهني.\n" +
      "• مستخلص إكليل الجبل لمقاومة علامات التعب.\n" +
      "• يوازن الـ pH ويهيّئ البشرة لكريم الموازنة.\n" +
      "• 200 مل — للبشرة الدهنية.\n\n" +
      "طريقة الاستخدام: بعد التنظيف صباحاً ومساءً بقطنة على الوجه والرقبة قبل الكريم.",
    descriptionEn:
      "Seventeen Oil Control Lotion — a regulating toner for oily skin that finishes cleansing, balances sebum and minimizes the look of pores for a purified matte base.\n\n" +
      "• Yeast & mushroom biological complex + rosemary extract.\n" +
      "• Balances pH and primes oil-control creams.\n" +
      "• 200ml.\n\n" +
      "How to use: After cleansing, morning and night, apply with a cotton pad before cream.",
    imageUrls: [`${OFF}/2025/10/Oil_Control_AMG5gLC.png`],
  },
  {
    barcode: "5201641009475",
    slug: "seventeen-ideal-de-makeup-micellar-100ml",
    sku: "SVN-IDEAL-009475",
    price: 11000,
    originalPrice: 13000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: MAKEUP_REMOVERS,
    nameAr: "سفنتين - مزيل مكياج Ideal De-Makeup Micellar ثنائي الطور للعينين والشفتين 100 مل",
    nameEn: "Seventeen Ideal De-Makeup Micellar Bi-Phase Eye & Lip Remover 100ml",
    descriptionAr:
      "مزيل Ideal De-Makeup Micellar من سفنتين — لوسيون ثنائي الطور يزيل حتى المكياج المقاوم للماء عن العينين والشفتين دون حرقة.\n\n" +
      "• مستخلصات زيتون عضوي وبابونج وألوفيرا لترطيب المنطقة الحساسة.\n" +
      "• يحمي الرموش ولا يهيّج العينين — مناسب للاستخدام اليومي.\n" +
      "• 100 مل — حجم عملي للحقيبة.\n\n" +
      "طريقة الاستخدام: رجّي جيداً، بلّلي قطنة وامسحي بلطف حتى يزول المكياج.",
    descriptionEn:
      "Seventeen Ideal De-Makeup Micellar — a bi-phase remover that takes off even waterproof eye and lip makeup without sting.\n\n" +
      "• Organic olive, chamomile and aloe to hydrate the delicate eye/lip area.\n" +
      "• Protects lashes and is gentle on eyes.\n" +
      "• 100ml.\n\n" +
      "How to use: Shake well, soak a cotton pad and gently wipe until makeup is gone.",
    imageUrls: [
      `${BF}/56036-large_default/seventeen-ideal-de-makeup-micellar-for-face-eyes-lips-100ml.jpg`,
    ],
  },
  {
    barcode: "5201641007532",
    slug: "seventeen-one-step-micellar-water-200ml",
    sku: "SVN-ONESTEP-007532",
    price: 14000,
    originalPrice: 16000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "سفنتين - ماء ميسيلار One Step Micellar Water لتنظيف الوجه والعينين بخطوة واحدة 200 مل",
    nameEn: "Seventeen One Step Micellar Water Face & Eyes Cleanser 200ml",
    descriptionAr:
      "ماء ميسيلار One Step من سفنتين — تنظيف الوجه والعينين والشفتين بخطوة واحدة مع ترطيب وتهدئة، مناسب لمرتدي العدسات.\n\n" +
      "• ميسيلات نشطة تلتقط الأوساخ والمكياج والدهون.\n" +
      "• ألوفيرا وورد وبابونج وإبِيسكوس لتوازن البشرة وإشراقتها.\n" +
      "• لا يترك شعوراً بالشد — مثالي للاستخدام اليومي في العراق.\n" +
      "• 200 مل.\n\n" +
      "طريقة الاستخدام: بلّلي قطنة وامسحي الوجه والعينين والرقبة، ثم أكملي بالتونر المناسب من سفنتين.",
    descriptionEn:
      "Seventeen One Step Micellar Water — cleanse face, eyes and lips in one easy step while hydrating and soothing. Suitable for contact-lens wearers.\n\n" +
      "• Active micelles trap dirt, makeup and oil.\n" +
      "• Aloe, rose, chamomile and hibiscus extracts.\n" +
      "• 200ml.\n\n" +
      "How to use: Dampen a cotton pad and cleanse face, eyes and neck. Follow with the matching Seventeen toner.",
    imageUrls: [`${OFF}/2024/06/seventeen_one_step_micellar_water_200ml.jpg`],
  },
  {
    barcode: "5201641022689",
    slug: "seventeen-micellar-gentle-cleansing-milk-200ml",
    sku: "SVN-MICMILK-022689",
    price: 13500,
    originalPrice: 15500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "سفنتين - حليب تنظيف ميسيلار لطيف Micellar Gentle Cleansing Milk لجميع أنواع البشرة 200 مل",
    nameEn: "Seventeen Micellar Gentle Cleansing Milk All Skin Types 200ml",
    descriptionAr:
      "حليب تنظيف ميسيلار لطيف من سفنتين — ينظّف بعمق من الملوثات والمكياج ويمنح بشرة ناعمة مشرقة دون جفاف.\n\n" +
      "• زيت زيتون عضوي وزيت مشمش لملمس حريري ورائحة لطيفة.\n" +
      "• يزيل الدهون الزائدة دون سحب الرطوبة.\n" +
      "• خالٍ من البارابين — مختبر جلدياً.\n" +
      "• 200 مل — لجميع أنواع البشرة.\n\n" +
      "طريقة الاستخدام: دلكي على بشرة جافة أو رطبة ثم اشطفي أو أزيلي بقطنة مبللة.",
    descriptionEn:
      "Seventeen Micellar Gentle Cleansing Milk — deep yet gentle cleanse from pollution and makeup for a bright, soft finish without dehydration.\n\n" +
      "• Organic olive oil + apricot oil; pleasant texture and scent.\n" +
      "• Paraben-free, dermatologically tested — all skin types.\n" +
      "• 200ml.\n\n" +
      "How to use: Massage onto dry or damp skin, then rinse or wipe with a damp cotton pad.",
    imageUrls: [`${BF}/60950-large_default/seventeen-micellar-gentle-cleansing-milk-200ml.jpg`],
  },
  {
    barcode: "5201641725979",
    slug: "seventeen-purifying-foam-150ml",
    sku: "SVN-PURFOAM-725979",
    price: 13000,
    originalPrice: 15000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "سفنتين - رغوة تنظيف Purifying Foam لطيفة لجميع أنواع البشرة 150 مل",
    nameEn: "Seventeen Purifying Foam Cleanser All Skin Types 150ml",
    descriptionAr:
      "رغوة Purifying Foam من سفنتين — تنظيف عميق لطيف من المكياج والملوثات والدهون مع الحفاظ على رطوبة البشرة دون حرقة للعينين.\n\n" +
      "• مستخلص التين الشوكي لتوازن الرطوبة دون شد.\n" +
      "• زيتون عضوي وألوفيرا للنعومة والإشراقة.\n" +
      "• لجميع أنواع البشرة — خالٍ من البارابين ومختبر جلدياً.\n" +
      "• 150 مل.\n\n" +
      "طريقة الاستخدام: صباحاً ومساءً على الوجه والعينين والرقبة بحركات دائرية صاعدة ثم اشطفي.",
    descriptionEn:
      "Seventeen Purifying Foam — a lightweight cleansing foam that deeply removes makeup, pollution and sebum while keeping moisture balanced — no eye sting.\n\n" +
      "• Prickly pear + organic olive + aloe for softness and glow.\n" +
      "• All skin types — paraben-free, dermatologically tested.\n" +
      "• 150ml.\n\n" +
      "How to use: Morning and night, massage face, eyes and neck with upward circles, then rinse.",
    imageUrls: [`${BF}/34375-large_default/seventeen-purifying-foam-150ml.jpg`],
  },
  {
    barcode: "5201641726013",
    slug: "seventeen-true-balance-cream-spf15-50ml",
    sku: "SVN-TRUEBAL-726013",
    price: 22000,
    originalPrice: 25000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "سفنتين - كريم True Balance مرطب موازن لمنطقة T للبشرة العادية والمختلطة SPF15 سعة 50 مل",
    nameEn: "Seventeen True Balance Cream SPF15 Normal & Combination Skin 50ml",
    descriptionAr:
      "كريم True Balance من سفنتين — ترطيب خفيف سريع الامتصاص يسيطر على لمعان منطقة T ويمنح بشرة متوازنة مع حماية SPF15.\n\n" +
      "• ببتيدات مضادة للشيخوخة لنعومة الخطوط وتحسين المرونة.\n" +
      "• عصير بتلات الورد ومستخلص Imperata للترطيب والتهدئة.\n" +
      "• فيتامين E للحماية — مثالي كقاعدة مكياج في النهار العراقي.\n" +
      "• 50 مل — للبشرة العادية والمختلطة.\n\n" +
      "طريقة الاستخدام: صباحاً ومساءً على وجه ورقبة نظيفين بعد التونر.",
    descriptionEn:
      "Seventeen True Balance Cream SPF15 — lightweight, fast-absorbing hydration that tames T-zone shine for normal and combination skin.\n\n" +
      "• Peptides, rose petal juice, Imperata extract and Vitamin E.\n" +
      "• Can be used as moisturizer or makeup base.\n" +
      "• 50ml.\n\n" +
      "How to use: Apply daily morning and night on cleansed, toned face and neck.",
    imageUrls: [`${OFF}/2025/10/True_Balance.png`],
  },
  {
    barcode: "5201641726020",
    slug: "seventeen-vital-restore-treatment-cream-spf15-50ml",
    sku: "SVN-VITAL-726020",
    price: 22000,
    originalPrice: 25000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "سفنتين - كريم Vital Restore العلاجي للبشرة الجافة والحساسة SPF15 سعة 50 مل",
    nameEn: "Seventeen Vital Restore Treatment Cream SPF15 Dry & Sensitive 50ml",
    descriptionAr:
      "كريم Vital Restore من سفنتين — عناية مركّزة للبشرة الجافة والحساسة يرطّب بعمق، يهدّئ الجفاف ويحسّن المرونة مع SPF15.\n\n" +
      "• زيت زيتون عضوي وزبدة الشيا وببتيدات (ماتريكين) لإصلاح وإشراقة.\n" +
      "• بابونج وفيتامين E للتهدئة، ومستخلص العشب الأحمر لخزانات رطوبة.\n" +
      "• يصلح كقاعدة مكياج نهاراً.\n" +
      "• 50 مل.\n\n" +
      "طريقة الاستخدام: صباحاً ومساءً بعد التنظيف والتونر على الوجه والرقبة.",
    descriptionEn:
      "Seventeen Vital Restore Treatment Cream SPF15 — intensive care for dry and sensitive skin: deep moisture, comfort and improved elasticity.\n\n" +
      "• Organic olive oil, shea butter, peptides, chamomile and Vitamin E.\n" +
      "• Wear as day cream or makeup base.\n" +
      "• 50ml.\n\n" +
      "How to use: Apply morning and evening after cleansing and toning.",
    imageUrls: [`${OFF}/2025/10/Vital_Restore.png`],
  },
  {
    barcode: "5201641041567",
    slug: "seventeen-moisture-reload-hydrating-serum-30ml",
    sku: "SVN-MOISTSER-041567",
    price: 24000,
    originalPrice: 27000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "سفنتين - سيروم Moisture Reload Hydrating للترطيب الكثيف متعدد المستويات 30 مل",
    nameEn: "Seventeen Moisture Reload Hydrating Serum Multi-Level Moisture 30ml",
    descriptionAr:
      "سيروم Moisture Reload من سفنتين — ترطيب مكثّف متعدد المستويات يملأ البشرة ويملأ الخطوط الناتجة عن الجفاف بسرعة امتصاص دون دهن.\n\n" +
      "• هيالورونيك عالي ومنخفض الجزيء + بوليجلوتاميك أسيد لحبس الرطوبة.\n" +
      "• نياسيناميد (فيتامين B3) لتوحيد اللون والإشراقة.\n" +
      "• لجميع أنواع البشرة — كسيروم أو مرطب يومي أو قاعدة مكياج.\n" +
      "• 30 مل.\n\n" +
      "طريقة الاستخدام: 2–3 قطرات صباحاً ومساءً على الوجه والرقبة والديكولتيه.",
    descriptionEn:
      "Seventeen Moisture Reload Hydrating Serum — multi-level intensive hydration that plumps, smooths dehydration lines and absorbs fast without oiliness.\n\n" +
      "• Dual hyaluronic acids + polyglutamic acid + niacinamide.\n" +
      "• All skin types — serum, daily moisturizer or makeup base.\n" +
      "• 30ml.\n\n" +
      "How to use: Apply 2–3 drops morning and night on face, neck and décolleté.",
    imageUrls: [`${BF}/76948-large_default/seventeen-moisture-reload-hydrating-serum30ml.jpg`],
  },
  {
    barcode: "5201641737347",
    slug: "seventeen-clear-skin-rescue-mask-50ml",
    sku: "SVN-CSMASK-737347",
    price: 16000,
    originalPrice: 18500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MASKS,
    nameAr: "سفنتين - ماسك Clear Skin Rescue Mask لتنقية البشرة الدهنية والمعرّضة لحب الشباب 50 مل",
    nameEn: "Seventeen Clear Skin Rescue Mask Oily/Acne-Prone 50ml",
    descriptionAr:
      "ماسك Clear Skin Rescue من سفنتين — ماسك منعش ينظّم الدهون، يقلّل الرؤوس السوداء ويصغّر مظهر المسام مع ترطيب وانتعاش.\n\n" +
      "• زيت شجرة الشاي لتهدئة مناطق البثور ومقاومة البكتيريا.\n" +
      "• ينقّي البشرة الدهنية دون قسوة مفرطة.\n" +
      "• 50 مل.\n\n" +
      "طريقة الاستخدام: طبّقي طبقة متجانسة على بشرة نظيفة، اتركي حسب الإرشادات ثم اشطفي.",
    descriptionEn:
      "Seventeen Clear Skin Rescue Mask — clinically oriented rescue mask that helps regulate sebum, clear blackheads and refine pores while moisturizing and refreshing oily/acne-prone skin.\n\n" +
      "• Tea tree oil for antibacterial comfort around blemishes.\n" +
      "• 50ml.\n\n" +
      "How to use: Apply evenly on cleansed skin, leave as directed, then rinse.",
    imageUrls: [
      `${EPH}/c2c82716849c7130dc8fbe427205eaf1.jpg.webp`,
      "https://www.storeakmedia.com/storeak-erp/Storeas/326/images/items/583/044/497753a1-0018-478d-ac64-82e00f45085b_View.jpeg",
    ],
  },
  {
    barcode: "5201641737309",
    slug: "seventeen-radiance-express-mask-50ml",
    sku: "SVN-RADMASK-737309",
    price: 16000,
    originalPrice: 18500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MASKS,
    nameAr: "سفنتين - ماسك Radiance Express Mask للإشراقة الفورية وإنعاش البشرة الباهتة 50 مل",
    nameEn: "Seventeen Radiance Express Mask Instant Glow Boost 50ml",
    descriptionAr:
      "ماسك Radiance Express من سفنتين — ماسك سريع يمنح إشراقة فورية وينعش البشرة الباهتة لتعود أكثر نضارة ونعومة.\n\n" +
      "• مثالي قبل المناسبات أو كعناية أسبوعية سريعة.\n" +
      "• يترك البشرة مشرقة ومنتعشة دون ثِقل.\n" +
      "• 50 مل.\n\n" +
      "طريقة الاستخدام: على بشرة نظيفة، اتركي المدة الموصى بها ثم اشطفي جيداً.",
    descriptionEn:
      "Seventeen Radiance Express Mask — a fast radiance-boosting mask that refreshes dull skin for a brighter, softer look.\n\n" +
      "• Ideal before events or as a quick weekly treat.\n" +
      "• 50ml.\n\n" +
      "How to use: Apply on cleansed skin, leave as directed, rinse thoroughly.",
    imageUrls: [
      `${OFF}/2025/10/Radiance_Express.png`,
      `${BF}/34350-large_default/seventeen-radiance-express-mask-50ml.jpg`,
    ],
  },
  {
    barcode: "5201641749586",
    slug: "seventeen-skin-repair-cream-50ml",
    sku: "SVN-SKINREP-749586",
    price: 18500,
    originalPrice: 21000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "سفنتين - كريم Skin Repair لإصلاح وتهدئة البشرة المجهدة للوجه والجسم 50 مل",
    nameEn: "Seventeen Skin Repair Cream Face & Body Soothing Repair 50ml",
    descriptionAr:
      "كريم Skin Repair من سفنتين — يهدّئ ويصلح البشرة المجهدة من البرد والرياح والشمس، ويساعد على تخفيف البقع الداكنة مع إحساس انتعاش.\n\n" +
      "• ألوفيرا وتين شوكي وImperata لاستعادة التوازن.\n" +
      "• مستخلص الأعشاب البحرية والرمان وفيتامين E لمقاومة الأكسدة والبقع.\n" +
      "• زنجبيل ونعناع لإحساس انتعاش — للوجه والجسم.\n" +
      "• 50 مل — خالٍ من البارابين والسيليكون والغلوتين.\n\n" +
      "طريقة الاستخدام: عند الحاجة على المناطق الجافة أو المتهيّجة.",
    descriptionEn:
      "Seventeen Skin Repair Cream — soothes and restores stressed skin exposed to cold, wind and sun, while helping fade dark spots with a cooling fresh feel.\n\n" +
      "• Aloe, prickly pear, seaweed oligosaccharide, pomegranate complex and Vitamin E.\n" +
      "• For face and body — paraben-, silicone- and gluten-free.\n" +
      "• 50ml.\n\n" +
      "How to use: Apply as needed on dry or irritated areas.",
    imageUrls: ["https://fnet.gr/wp-content/uploads/Skin-Repair-Cream-50ml-5201641749586.jpg"],
  },
  {
    barcode: "5201641031391",
    slug: "seventeen-vibrant-eyes-quad-palette-05-rosy-nude",
    sku: "SVN-VEQP-031391",
    price: 16500,
    originalPrice: 19000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "سفنتين - باليت ظلال عيون Vibrant Eyes رباعية 05 Rosy Nude وردي نود ثابت",
    nameEn: "Seventeen Vibrant Eyes Quad Palette 05 Rosy Nude Eyeshadow",
    descriptionAr:
      "باليت Vibrant Eyes 05 Rosy Nude من سفنتين — أربع درجات وردية نود (ماتة ولامعة) تمتزج بسهولة لإطلالات يومية وسهرة تناسب ألوان العيون والبشرة العراقية.\n\n" +
      "• أداء لون قوي وثبات طوال اليوم دون بهتان.\n" +
      "• ملمس خفيف ناعم للتطبيق والدمج المتقن.\n" +
      "• درجة واحدة ماتة وثلاث لامعة للمزج بلا حدود.\n\n" +
      "طريقة الاستخدام: ثبّتي بفرشاة أو أصابع وامزجي بين الدرجات حسب الإطلالة.",
    descriptionEn:
      "Seventeen Vibrant Eyes Quad 05 Rosy Nude — four flattering rosy-nude shades (1 matte + 3 luminous) that blend beautifully for countless day-to-night looks.\n\n" +
      "• Strong color payoff and all-day hold.\n" +
      "• Soft, light texture for even application.\n\n" +
      "How to use: Apply with brush or fingertips and mix & match the four shades.",
    imageUrls: [`${EPH}/1386c93a2d4254f376fdf896e956b10d.jpg.webp`],
  },
  {
    barcode: "5201641032701",
    slug: "seventeen-magic-glow-highlighter-06-golden-rays",
    sku: "SVN-MGHL-032701",
    price: 15500,
    originalPrice: 18000,
    categoryId: MAKEUP,
    subcategoryId: HIGHLIGHTER,
    tertiaryCategoryId: POWDER_HL,
    nameAr: "سفنتين - هايلايتر Magic Glow 06 Golden Rays بودرة إضاءة ذهبية متعددة الاستخدام",
    nameEn: "Seventeen Magic Glow Highlighter 06 Golden Rays Powder 12.5g",
    descriptionAr:
      "هايلايتر Magic Glow 06 Golden Rays من سفنتين — إضاءة ذهبية متعددة الأبعاد بملمس ناعم يُبنى تدريجياً للوجه والخدود وحتى كظل عيون.\n\n" +
      "• لآلئ قزحية للّمعة الساحرة دون تكتّل.\n" +
      "• أداء لون ممتاز وتطبيق متجانس.\n" +
      "• مناسب لجميع أنواع البشرة.\n\n" +
      "طريقة الاستخدام: بفرشاة على أعلى الخدود وقصبة الأنف ونقاط الإضاءة، أو كظل عيون.",
    descriptionEn:
      "Seventeen Magic Glow Highlighter 06 Golden Rays — multidimensional golden glow with a fine velvet texture you can build as highlighter, blush accent or eyeshadow.\n\n" +
      "• Iridescent pearls for long-lasting shimmer.\n" +
      "• Excellent payoff and even blend — all skin types.\n\n" +
      "How to use: Sweep with a brush on high points of the face, or use on eyes.",
    imageUrls: [`${OFF}/2024/06/glow_magic_4_3_Ml9Uisc_bxTQAae.jpeg`],
  },
  {
    barcode: "5201641032695",
    slug: "seventeen-magic-glow-highlighter-05-riviera-glam",
    sku: "SVN-MGHL-032695",
    price: 15500,
    originalPrice: 18000,
    categoryId: MAKEUP,
    subcategoryId: HIGHLIGHTER,
    tertiaryCategoryId: POWDER_HL,
    nameAr: "سفنتين - هايلايتر Magic Glow 05 Riviera Glam بودرة إضاءة ساحرة 12.5 غ",
    nameEn: "Seventeen Magic Glow Highlighter 05 Riviera Glam Powder 12.5g",
    descriptionAr:
      "هايلايتر Magic Glow 05 Riviera Glam من سفنتين — درجة ساحرة متعددة الأبعاد بملمس ناعم مخملي تمنح توهجاً فاخراً ويمكن استخدامها كظل عيون أيضاً.\n\n" +
      "• لآلئ قزحية لمظهر مضيء يدوم.\n" +
      "• يُبنى بسهولة من لمعة يومية إلى إطلالة سهرات.\n" +
      "• 12.5 غ.\n\n" +
      "طريقة الاستخدام: بفرشاة سفنتين على نقاط الإضاءة أو الجفن.",
    descriptionEn:
      "Seventeen Magic Glow Highlighter 05 Riviera Glam — a glamorous multidimensional highlighter with fine velvet texture — also wearable as eyeshadow.\n\n" +
      "• Iridescent pearls for lasting luminous glow.\n" +
      "• Buildable from soft daylight shimmer to evening glam.\n" +
      "• 12.5g.\n\n" +
      "How to use: Apply with a makeup brush on face high points or lids.",
    imageUrls: [`${EPH}/f6f2243d430208f98eb4c4e20c0b21fb.jpg.webp`],
  },
  {
    barcode: "5201641003589",
    slug: "seventeen-fiber-volume-mascara-01-black-15ml",
    sku: "SVN-FIBVOL-003589",
    price: 15500,
    originalPrice: 17500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "سفنتين - ماسكارا Fiber Volume 01 أسود لتكثيف الرموش بألياف مبتكرة 15 مل",
    nameEn: "Seventeen Fiber Volume Mascara 01 Black Fiber Volume 15ml",
    descriptionAr:
      "ماسكارا Fiber Volume من سفنتين — ألياف تلتصق بالرموش لكثافة استثنائية مع زبدة الأرغان وزيت التسوباكي لنعومة ومرونة.\n\n" +
      "• فرشاة مخروطية بشعيرات قصيرة كثيفة لفصل وتكثيف متساوٍ.\n" +
      "• درجة 01 أسود كلاسيكي — 15 مل.\n" +
      "• مثالية لإطلالة عيون واضحة طوال اليوم.\n\n" +
      "طريقة الاستخدام: من الجذور للأعلى بحركة متعرّجة؛ ابنِ الكثافة بطبقة ثانية قبل الجفاف الكامل.",
    descriptionEn:
      "Seventeen Fiber Volume Mascara 01 Black — innovative fibers cling to lashes for unmatched volume while argan butter and tsubaki oil keep lashes smooth and flexible.\n\n" +
      "• Conical short-bristle brush for even density and separation.\n" +
      "• 15ml — shade 01 Black.\n\n" +
      "How to use: Zigzag from roots upward; build a second coat before the first fully dries.",
    imageUrls: [`${EPH}/d809cb0f25a486ff370d0c3a8d2cd15f.jpg.webp`],
  },
  {
    barcode: "5201641041307",
    slug: "seventeen-aqua-glow-blush-02-lila-5ml",
    sku: "SVN-AQUAGLOW-041307",
    price: 15000,
    originalPrice: 17000,
    categoryId: MAKEUP,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    nameAr: "سفنتين - بلاشر سائل Aqua Glow 02 Lila ندي ثابت متعدد الاستخدام 5 مل",
    nameEn: "Seventeen Aqua Glow Translucent Blush 02 Lila Dewy 5ml",
    descriptionAr:
      "بلاشر سائل Aqua Glow 02 Lila من سفنتين — لون ندي طويل الثبات يمنح خدوداً صحية ولمعة طبيعية، ويصلح للخدود والعيون والشفاه.\n\n" +
      "• 7 مستخلصات مرطّبة (ياسمين، بيني، كرز، نيرولي، لافندر، إلدر، ورد).\n" +
      "• يندمج بسهولة وكثافة قابلة للبناء.\n" +
      "• أداة دو فوت دقيقة — 5 مل — درجة 02 Lila.\n\n" +
      "طريقة الاستخدام: نقطة صغيرة بالأداه ثم امزجي بفرشاة أو إسفنجة أو أصابع.",
    descriptionEn:
      "Seventeen Aqua Glow 02 Lila — a long-wear dewy liquid blush for a healthy flush; wearable on cheeks, eyes and lips.\n\n" +
      "• 7 hydrating botanical extracts; blendable and buildable.\n" +
      "• Doe-foot applicator — 5ml — shade 02 Lila.\n\n" +
      "How to use: Apply a small amount and blend with brush, sponge or fingers.",
    imageUrls: [`${OFF}/2025/11/Aqua_Glow_02.png`],
  },
  {
    barcode: "5201641729021",
    slug: "seventeen-lash-elegance-mascara-01-black-13ml",
    sku: "SVN-LASHELEG-729021",
    price: 15500,
    originalPrice: 17500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "سفنتين - ماسكارا Lash Elegance 01 أسود بأثر الرموش الصناعية 13 مل",
    nameEn: "Seventeen Lash Elegance Mascara 01 Black False-Lash Effect 13ml",
    descriptionAr:
      "ماسكارا Lash Elegance 01 أسود من سفنتين — حجم وطول وفصل من أول مسحة بمظهر يشبه الرموش الصناعية دون تكتّل.\n\n" +
      "• فرشاة ثلاثية الأبعاد فريدة للتغطية والفصل في آن.\n" +
      "• خالية من العطر — مختبرة طبّياً للعين.\n" +
      "• تُزال بسهولة بمزيل Ideal Make-up.\n" +
      "• 13 مل — درجة 01 Black.\n\n" +
      "طريقة الاستخدام: لفّي الفرشاة أثناء التطبيق لتغليف الرموش من كل الجهات.",
    descriptionEn:
      "Seventeen Lash Elegance Mascara 01 Black — spectacular volume, length and separation for a false-lash look without clumps.\n\n" +
      "• Unique multi-dimensional brush for intensity + perfect separation.\n" +
      "• Fragrance-free, ophthalmologically tested; removes easily with Ideal Make-up Remover.\n" +
      "• 13ml — shade 01 Black.\n\n" +
      "How to use: Rotate the wand as you apply so every side coats the lashes.",
    imageUrls: [`${BF}/34555-large_default/seventeen-lash-elegance-mascara.jpg`],
  },
  {
    barcode: "5201641706077",
    slug: "seventeen-high-precision-waterproof-eyeliner-01-carbon-black",
    sku: "SVN-HPELINER-706077",
    price: 12500,
    originalPrice: 14500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    nameAr: "سفنتين - آيلاينر سائل High Precision مقاوم للماء 01 Carbon Black قلم دقة",
    nameEn: "Seventeen High Precision Waterproof Eyeliner 01 Carbon Black",
    descriptionAr:
      "آيلاينر High Precision من سفنتين — قلم سائل مقاوم للماء بفرشاة دقة لرسم خطوط رفيعة أو عريضة بلون غني يدوم حتى 24 ساعة.\n\n" +
      "• يجف بسرعة ويترك لمعة رطبة دون تلطّخ.\n" +
      "• عبوة أنيقة بنمط القلم — درجة 01 Carbon Black.\n" +
      "• مثالي للسهم الكلاسيكي والإطلالات اليومية.\n\n" +
      "طريقة الاستخدام: ارسمي على خط الرموش من الداخل للخارج؛ ابنِ السمك حسب الرغبة.",
    descriptionEn:
      "Seventeen High Precision Waterproof Eyeliner 01 Carbon Black — pen-style liquid liner with a precision brush for thin or bold lines, rich color and up to 24h wear.\n\n" +
      "• Quick-dry glossy finish that won’t smudge.\n" +
      "• Modern pen packaging.\n\n" +
      "How to use: Trace along the lash line; build thickness as desired.",
    imageUrls: [`${BF}/34540-large_default/seventeen-high-precision-waterproof-eyeliner.jpg`],
  },
  {
    barcode: "5201641696262",
    slug: "seventeen-proliner-liquid-eyeliner-07-very-black-2-5ml",
    sku: "SVN-PROLINER-696262",
    price: 11000,
    originalPrice: 13000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    nameAr: "سفنتين - آيلاينر سائل Proliner 07 Very Black بفرشاة ماركر 2.5 مل",
    nameEn: "Seventeen Proliner Liquid Eye Liner 07 Very Black Marker Tip 2.5ml",
    descriptionAr:
      "آيلاينر Proliner 07 Very Black من سفنتين — تركيبة سريعة الجفاف بلون أسود فاحم وفرشاة ماركر تسهّل رسم السهم المثالي.\n\n" +
      "• ثبات لون عالي وتطبيق سهل للمبتدئات والمحترفات.\n" +
      "• خالٍ من الغلوتين — 2.5 مل.\n" +
      "• درجة 07 Very Black.\n\n" +
      "طريقة الاستخدام: ارسمي محيط العين من منتصف الجفن نحو الزاوية الخارجية لإطلالة مجنّحة.",
    descriptionEn:
      "Seventeen Proliner 07 Very Black — quick-dry liquid eyeliner with a marker-shaped tip for effortless winged looks and vivid lasting color.\n\n" +
      "• Gluten-free — 2.5ml — shade 07 Very Black.\n\n" +
      "How to use: Line from mid-lid outward to create a clean wing.",
    imageUrls: [`${BF}/34374-large_default/seventeen-proliner-no-7-black.jpg`],
  },
  {
    barcode: "5201641746400",
    slug: "seventeen-mattifying-setting-mist-125ml",
    sku: "SVN-SETMIST-746400",
    price: 15500,
    originalPrice: 17500,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: MAKEUP_SPRAY,
    nameAr: "سفنتين - رذاذ تثبيت Mattifying Setting Mist لمظهر مات وانتعاش المكياج 125 مل",
    nameEn: "Seventeen Mattifying Setting Mist Prime Set Refresh 125ml",
    descriptionAr:
      "رذاذ Mattifying Setting Mist من سفنتين — ثلاثة أدوار: برايمر قبل المكياج، مثبت بعده، ومنعش أثناء اليوم لإزالة اللمعان غير المرغوب.\n\n" +
      "• خالٍ من السيليكون والغلوتين وغير دهني.\n" +
      "• مختبر جلدياً — مثالي للبشرة المختلطة/الدهنية في الصيف العراقي.\n" +
      "• 125 مل.\n\n" +
      "طريقة الاستخدام: أبعدي الزجاجة 15–20 سم ورشّي 2–4 بخّات متساوية.",
    descriptionEn:
      "Seventeen Mattifying Setting Mist — prime before makeup, set after, and refresh midday to kill unwanted shine.\n\n" +
      "• Silicone-free, gluten-free, non-oily, dermatologically tested.\n" +
      "• 125ml.\n\n" +
      "How to use: Hold 15–20 cm away and mist 2–4 even sprays.",
    imageUrls: [`${BF}/34352-large_default/seventeen-mattifying-setting-mist-125ml.jpg`],
  },
  {
    barcode: "5201641652978",
    slug: "seventeen-time-plus-foundation-spf15-04-medium-beige-35ml",
    sku: "SVN-TIMEPLUS-652978",
    price: 17500,
    originalPrice: 20000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: FOUNDATION,
    nameAr: "سفنتين - فاونديشن Time Plus طويل الثبات SPF15 درجة 04 Medium Beige 35 مل",
    nameEn: "Seventeen Time Plus Long Lasting Foundation SPF15 04 Medium Beige 35ml",
    descriptionAr:
      "فاونديشن Time Plus درجة 04 Medium Beige من سفنتين — تغطية ثابتة طويلة الأمد مع حماية SPF15 تناسب درجات البشرة المتوسطة الشائعة في السوق العراقي.\n\n" +
      "• مظهر متجانس يدوم طوال اليوم.\n" +
      "• مناسب لجميع أنواع البشرة.\n" +
      "• 35 مل — درجة 04 Medium Beige.\n\n" +
      "طريقة الاستخدام: وزّعي بفرشاة أو إسفنجة من وسط الوجه نحو الخارج وامزجي مع الرقبة.",
    descriptionEn:
      "Seventeen Time Plus Foundation SPF15 shade 04 Medium Beige — long-lasting coverage with sun protection for medium beige complexions.\n\n" +
      "• All-day wear for all skin types.\n" +
      "• 35ml — shade 04 Medium Beige.\n\n" +
      "How to use: Blend outward from the center of the face with brush or sponge, down the neck.",
    imageUrls: ["https://icf.listex.info/med/2b6c3e39-c597-0314-ae12-06c8ce2388c3.jpg"],
  },
  {
    barcode: "5201641003565",
    slug: "seventeen-fiber-extense-mascara-01-black",
    sku: "SVN-FIBEXT-003565",
    price: 15500,
    originalPrice: 17500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "سفنتين - ماسكارا Fiber Extense 01 أسود لإطالة وتكثيف الرموش بألياف",
    nameEn: "Seventeen Fiber Extense Mascara 01 Black Length & Volume",
    descriptionAr:
      "ماسكارا Fiber Extense 01 من سفنتين — ألياف لإطالة وتكثيف مبهِر يمنح الرموش حضوراً قوياً من أول تطبيق.\n\n" +
      "• تأثير مثير للإعجاب مناسب للسهرات والإطلالة اليومية الجريئة.\n" +
      "• درجة 01 أسود.\n\n" +
      "طريقة الاستخدام: من الجذور للأطراف؛ كرّري لبناء الطول والكثافة.",
    descriptionEn:
      "Seventeen Fiber Extense Mascara 01 Black — fiber technology for impressive length and volume that makes lashes stand out.\n\n" +
      "• Bold everyday or evening lash look — shade 01 Black.\n\n" +
      "How to use: Coat from root to tip; layer to build length and volume.",
    imageUrls: [`${BF}/41016-large_default/sev-fiber-extense-mascara-1.jpg`],
  },
  {
    barcode: "5201641741085",
    slug: "seventeen-glam-mascara-01-black-13ml",
    sku: "SVN-GLAM-741085",
    price: 14000,
    originalPrice: 16000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "سفنتين - ماسكارا Glam 01 أسود لفصل الرموش وحجم إضافي 13 مل",
    nameEn: "Seventeen Glam Mascara 01 Black Definition & Extra Volume 13ml",
    descriptionAr:
      "ماسكارا Glam 01 أسود من سفنتين — فصل رمش بِرمش مع حجم إضافي لإطلالة كاملة وأنيقة تُبنى من الطبيعي إلى الجريء.\n\n" +
      "• مركّب شموع فريد لتطبيق سهل قابل للبناء.\n" +
      "• فرشاة فايبر بشكل ساعة رملية للحجم والتعريف.\n" +
      "• خالية من العطر والبارابين والشاي — مختبرة طبّياً للعين.\n" +
      "• 13 مل — درجة 01 Black.\n\n" +
      "طريقة الاستخدام: امسحي من الجذور للأعلى؛ أضيفي طبقة ثانية للـ glam الكامل.",
    descriptionEn:
      "Seventeen Glam Mascara 01 Black — defines lashes one by one with extra volume for a full glam look you can build from natural to bold.\n\n" +
      "• Unique wax complex + hourglass fiber brush.\n" +
      "• Fragrance-free, paraben- & tea-free, ophthalmologically tested.\n" +
      "• 13ml — shade 01 Black.\n\n" +
      "How to use: Sweep from roots up; add a second coat for full glam.",
    imageUrls: [`${BF}/34523-large_default/seventeen-glam-mascara.jpg`],
  },
  {
    barcode: "5201641002667",
    slug: "seventeen-ultra-black-jet-liner-1ml",
    sku: "SVN-JETLINER-002667",
    price: 12500,
    originalPrice: 14500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    nameAr: "سفنتين - آيلاينر Ultra Black Jet Liner أسود فاحم مقاوم للماء tip ناعم 1 مل",
    nameEn: "Seventeen Ultra Black Jet Liner Waterproof Ultra-Black Marker 1ml",
    descriptionAr:
      "آيلاينر Ultra Black Jet Liner من سفنتين — طرف ناعم لدقة فائقة على كل أشكال العيون، بلون أسود فاحم مقاوم للماء يثبت حتى 24 ساعة دون تلطّخ.\n\n" +
      "• يجف بسرعة ويسمح ببناء شدة الإطلالة.\n" +
      "• أسهل آيلاينر للاستخدام اليومي والسهم الجريء.\n" +
      "• 1 مل.\n\n" +
      "طريقة الاستخدام: ارسمي على خط الرموش؛ ابنِ السمك تدريجياً.",
    descriptionEn:
      "Seventeen Ultra Black Jet Liner — soft-tip waterproof marker for ultra-precise lines on every eye shape, intense ultra-black wear up to 24 hours without smudging.\n\n" +
      "• Quick-dry, buildable intensity — the easiest everyday liner.\n" +
      "• 1ml.\n\n" +
      "How to use: Trace the lash line and build thickness as desired.",
    imageUrls: [`${BF}/34372-large_default/seventeen-ultra-black-jet-liner-1ml.jpg`],
  },
  {
    barcode: "5201641012567",
    slug: "seventeen-loose-face-powder-01-natural",
    sku: "SVN-LFP-012567",
    price: 14500,
    originalPrice: 16500,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    nameAr: "سفنتين - بودرة سائبة Loose Face Powder 01 Natural لتثبيت ومات خفيف للبشرة الفاتحة",
    nameEn: "Seventeen Loose Face Powder 01 Natural Semi-Sheer Setting Powder",
    descriptionAr:
      "بودرة سائبة Loose Face Powder 01 Natural من سفنتين — تثبيت خفيف شبه شفاف يمنح مظهراً ماتّاً دون إثقال، مثالية للدرجات الفاتحة.\n\n" +
      "• تمتص اللمعان وتثبّت الفاونديشن طوال اليوم.\n" +
      "• ملمس مخملي يناسب حتى البشرة الجافة والحساسة.\n" +
      "• درجة 01 Natural.\n\n" +
      "طريقة الاستخدام: بعد الفاونديشن أو فوق الكريم بفرشاة أو الإسفنجة المرفقة.",
    descriptionEn:
      "Seventeen Loose Face Powder 01 Natural — lightweight semi-sheer setting powder that mattifies without weighing skin down — ideal for lighter tones.\n\n" +
      "• Controls shine and locks makeup all day.\n" +
      "• Velvet feel suitable even for dry/sensitive skin.\n" +
      "• Shade 01 Natural.\n\n" +
      "How to use: Dust over foundation or skincare with puff or powder brush.",
    imageUrls: [`${EPH}/1fc322e6058257da9bf0451f58ded075.jpg.webp`],
  },
  {
    barcode: "5201641012581",
    slug: "seventeen-loose-face-powder-06",
    sku: "SVN-LFP-012581",
    price: 14500,
    originalPrice: 16500,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    nameAr: "سفنتين - بودرة سائبة Loose Face Powder 06 Golden Beige لتثبيت ومات للدرجات الأدكن",
    nameEn: "Seventeen Loose Face Powder 06 Golden Beige Semi-Sheer Setting Powder",
    descriptionAr:
      "بودرة سائبة Loose Face Powder 06 Golden Beige من سفنتين — تغطية شبه شفافة ماتّة بلون ذهبي بيج للدرجات الأدكن لتثبيت المكياج وامتصاص اللمعان دون شحوب.\n\n" +
      "• ملمس مخملي خفيف لجميع أنواع البشرة.\n" +
      "• تثبّت الإطلالة طوال اليوم في الجو الحار.\n" +
      "• درجة 06 Golden Beige.\n\n" +
      "طريقة الاستخدام: بعد الفاونديشن بفرشاة أو الإسفنجة على كامل الوجه أو مناطق اللمعان.",
    descriptionEn:
      "Seventeen Loose Face Powder 06 Golden Beige — semi-sheer mattifying setting powder for deeper skin tones that locks makeup and controls shine without ashing out.\n\n" +
      "• Featherlight velvet texture for all skin types.\n" +
      "• Shade 06 Golden Beige.\n\n" +
      "How to use: Apply after foundation with puff or brush over face or oily zones.",
    imageUrls: [
      `${EPH}/3bbfcf8886bd2749b71b26cfd3799838.jpg.webp`,
      "https://www.brocard.ua/media/catalog/product/5/2/5201641012581_1.jpg",
    ],
  },
  {
    barcode: "5201641714454",
    slug: "seventeen-x-traordinaire-mascara-01-black",
    sku: "SVN-XTRA-714454",
    price: 14500,
    originalPrice: 16500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "سفنتين - ماسكارا X-Traordinaire 01 أسود لحجم ورفع ثلاثي الأبعاد",
    nameEn: "Seventeen X-Traordinaire Mascara 01 Black 3D Volume & Curl",
    descriptionAr:
      "ماسكارا X-Traordinaire 01 أسود من سفنتين — حجم استثنائي ورفع مثالي بفرشاة بلاستيكية خاصة تمنح الرموش مظهراً ثلاثي الأبعاد يشبه الرموش الصناعية.\n\n" +
      "• تبرز الرموش بقوة من أول طبقة.\n" +
      "• درجة 01 Black.\n\n" +
      "طريقة الاستخدام: امسحي من الجذور للأعلى مع التركيز على الرفع عند القاعدة.",
    descriptionEn:
      "Seventeen X-Traordinaire Mascara 01 Black — exceptional volume and perfect curl with a special plastic brush for a 3D false-lash effect.\n\n" +
      "• Makes lashes stand out from the first coat — shade 01 Black.\n\n" +
      "How to use: Sweep upward from the roots, focusing on lift at the base.",
    imageUrls: [`${BF}/34403-large_default/seventeen-x-traordinaire-mascara-no-1-black.jpg`],
  },
  {
    barcode: "5201641727775",
    slug: "seventeen-whitening-cream-spf15-30ml",
    sku: "SVN-WHITE-727775",
    price: 19500,
    originalPrice: 22000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "سفنتين - كريم تفتيح Whitening Cream SPF15 لتوحيد اللون وتقليل البقع 30 مل",
    nameEn: "Seventeen Whitening Cream SPF15 Brightening & Spot Care 30ml",
    descriptionAr:
      "كريم Whitening Cream SPF15 من سفنتين — يوحّد لون البشرة ويزيد إشراقتها ويقلّل البقع الداكنة مع حماية نهارية SPF15.\n\n" +
      "• ألفا أربوتين ومستخلص جذر الكركم وفيتامين C طبيعي لتثبيط مراحل تصبّغ الميلانين.\n" +
      "• مكوّنات من إفراز الحلزون لتغذية وتجديد.\n" +
      "• فيتامينات E وC لترطيب ومقاومة أكسدة ونعومة الخطوط.\n" +
      "• ملمس خفيف يومي — لجميع أنواع البشرة — 30 مل.\n\n" +
      "طريقة الاستخدام: صباحاً ومساءً على بشرة نظيفة؛ نهاراً لا تتخلي عن واقي إضافي عند التعرض الطويل للشمس.",
    descriptionEn:
      "Seventeen Whitening Cream SPF15 — brightens, evens tone and helps fade dark spots while offering SPF15 day protection.\n\n" +
      "• a-Arbutin, turmeric root extract and natural Vitamin C to target melanogenesis.\n" +
      "• Snail secretion actives + Vitamins E & C for nourish, renew and antioxidant care.\n" +
      "• Lightweight daily texture — all skin types — 30ml.\n\n" +
      "How to use: Morning and night on cleansed skin; add extra SPF for prolonged sun.",
    imageUrls: [`${BF}/34402-large_default/seventeen-whitening-cream-spf-15-30ml.jpg`],
  },
  {
    barcode: "5201641736395",
    slug: "seventeen-eye-area-anti-puffing-gel-25ml",
    sku: "SVN-EYEGEL-736395",
    price: 18500,
    originalPrice: 21000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: EYE_CARE,
    nameAr: "سفنتين - جل منطقة العين Anti-Puffing Gel ضد الانتفاخ والهالات 25 مل",
    nameEn: "Seventeen Eye Area Anti-Puffing Gel Depuff & Dark Circles 25ml",
    descriptionAr:
      "جل Anti-Puffing لمنطقة العين من سفنتين — يقلّل الانتفاخ والهالات ويرطّب المنطقة الحساسة مع إحساس شد فوري دون لزوجة.\n\n" +
      "• تترابيبتيات ومركّب نباتي ضد الانتفاخ والهالات.\n" +
      "• زيتون عضوي وخيار وفيتامينات A وE وبوليساكاريد لترطيب عميق.\n" +
      "• يصلح للجفن العلوي كاملاً دون تهيّج — مختبر طبّياً وجلدياً.\n" +
      "• خالٍ من البارابين — 25 مل.\n\n" +
      "طريقة الاستخدام: صباحاً ومساءً برفق حول العينين وعلى الجفن العلوي.",
    descriptionEn:
      "Seventeen Eye Area Anti-Puffing Gel — targets under-eye bags, puffiness and dark circles with deep hydration and an instant tightening feel that won’t stick.\n\n" +
      "• Tetrapeptides + botanical complex; organic olive, cucumber, Vitamins A & E.\n" +
      "• Safe on the full upper eyelid — ophthalmologically & dermatologically tested, paraben-free.\n" +
      "• 25ml.\n\n" +
      "How to use: Gently morning and night around the eyes and on the upper lid.",
    imageUrls: [`${BF}/34333-large_default/seventeen-eye-area-anti-puffing-gel-25ml.jpg`],
  },
  {
    barcode: "5201641736418",
    slug: "seventeen-eye-area-restoring-cream-25ml",
    sku: "SVN-EYECREAM-736418",
    price: 19500,
    originalPrice: 22000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: EYE_CARE,
    nameAr: "سفنتين - كريم عين Restoring Cream شدّ وترميم للهالات والتجاعيد 25 مل",
    nameEn: "Seventeen Eye Area Restoring Cream Firming Anti-Wrinkle 25ml",
    descriptionAr:
      "كريم عين Restoring من سفنتين — تركيبة متقدمة تستعيد تماسك الجفن العلوي، تقلّل التجاعيد والهالات وتحارب الانتفاخ مع ترطيب عميق.\n\n" +
      "• مستخلصات Albizia julibrissin وأعشاب مقدّسة لرفع طبيعي.\n" +
      "• إسسين ضد الانتفاخ، زيت زيتون عضوي للمرونة، ومستخلص العشب الأحمر لخزانات رطوبة.\n" +
      "• آمن للجفن العلوي — مختبر طبّياً وجلدياً وخالٍ من البارابين.\n" +
      "• 25 مل.\n\n" +
      "طريقة الاستخدام: صباحاً ومساءً حول العينين والجفن العلوي بحركات لطيفة.",
    descriptionEn:
      "Seventeen Eye Area Restoring Cream — advanced care that restores upper-lid tone, softens wrinkles and dark circles, and fights puffiness with deep moisture reserves.\n\n" +
      "• Albizia julibrissin & sacred herb extracts, escin, organic olive oil, red grass extract.\n" +
      "• Safe on the full upper eyelid — ophthalmologically & dermatologically tested, paraben-free.\n" +
      "• 25ml.\n\n" +
      "How to use: Morning and night around the eyes and upper lid with gentle motions.",
    imageUrls: [`${BF}/34334-large_default/seventeen-eye-area-restoring-cream-25ml.jpg`],
  },
  {
    barcode: "5201641737248",
    slug: "seventeen-intensive-care-oils-youth-recapture-30ml",
    sku: "SVN-YOUTHOIL-737248",
    price: 25000,
    originalPrice: 28000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "سفنتين - زيت Intensive Care Youth Recapture لتجديد البشرة الجافة والحساسة 30 مل",
    nameEn: "Seventeen Intensive Care Oils Youth Recapture Dry/Sensitive 30ml",
    descriptionAr:
      "زيت Youth Recapture من سفنتين — مزيج زيوت طبيعية عميق التغذية للبشرة الجافة/الحساسة: يرطّب، يشدّ، يهدّئ الاحمرار ويُنعّم التجاعيد.\n\n" +
      "• زيتون عضوي، باشن فلاور، صويا، مشمش، Plukenetia، قهوة خضراء وفيتامين E.\n" +
      "• للوجه والرقبة والديكولتيه — يعزّز مفعول الكريم.\n" +
      "• مختبر جلدياً — خالٍ من الغلوتين — 30 مل.\n\n" +
      "طريقة الاستخدام: 2–3 قطرات صباحاً ومساءً على بشرة نظيفة ثم الكريم، أو 3–4 قطرات ليلاً وحده مع تدليك خفيف.",
    descriptionEn:
      "Seventeen Intensive Care Oils Youth Recapture — a precious blend of natural oils for dry/sensitive skin: hydrate, firm, calm redness and soften wrinkles.\n\n" +
      "• Organic olive, passiflora, soya, apricot, Plukenetia, green coffee and Vitamin E.\n" +
      "• Face, neck and décolleté — boosts your cream’s results.\n" +
      "• Dermatologically tested, gluten-free — 30ml.\n\n" +
      "How to use: 2–3 drops morning and night before cream, or 3–4 drops alone at night with a gentle massage.",
    imageUrls: [
      `${OFF}/2025/10/Youth_Recapture.png`,
      `${BF}/34347-large_default/seventeen-intensive-care-oils-youth-recapture-30ml.jpg`,
    ],
  },
  {
    barcode: "5201641737262",
    slug: "seventeen-intensive-care-oils-youth-balance-30ml",
    sku: "SVN-BALOIL-737262",
    price: 25000,
    originalPrice: 28000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "سفنتين - زيت Intensive Care Youth & Balance لتوازن وتغذية البشرة العادية والمختلطة 30 مل",
    nameEn: "Seventeen Intensive Care Oils Youth & Balance Normal/Combination 30ml",
    descriptionAr:
      "زيت Youth & Balance من سفنتين — مزيج زيوت طبيعية يُغذّي ويعيد التوازن للبشرة العادية/المختلطة: ترطيب، تهدئة احمرار، وتنظيم دهون خفيف.\n\n" +
      "• زيتون عضوي، سمسم، قمح، بندق، Plukenetia، قهوة خضراء، عصفر وفيتامين E.\n" +
      "• يمنح مظهراً صحياً مشرقاً فوراً ويعزّز الكريم.\n" +
      "• مختبر جلدياً — خالٍ من البارابين والغلوتين — 30 مل.\n\n" +
      "طريقة الاستخدام: 2–3 قطرات صباحاً ومساءً على وجه ورقبة وديكولتيه نظيفين ثم الكريم، أو وحده ليلاً.",
    descriptionEn:
      "Seventeen Intensive Care Oils Youth & Balance — natural oil blend that nourishes and rebalances normal/combination skin: hydrate, calm redness and gently regulate sebum.\n\n" +
      "• Organic olive, sesame, wheat, hazelnut, Plukenetia, green coffee, safflower and Vitamin E.\n" +
      "• Instant healthy glow; boosts cream performance.\n" +
      "• Dermatologically tested, paraben- and gluten-free — 30ml.\n\n" +
      "How to use: 2–3 drops morning and night on cleansed face, neck and décolleté before cream, or alone at night.",
    imageUrls: [`${BF}/34349-large_default/seventeen-intensive-care-oils-youth-balance-30ml.jpg`],
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

async function resolveBrandId(): Promise<string> {
  const KNOWN = "f133215c-8cb8-4686-9960-0ab79390a6bb";
  try {
    const b = await api<{ id: string; nameEn?: string; nameAr?: string }>(`/brands/${KNOWN}`);
    if (b?.id) {
      console.log(`Brand: Seventeen / سفنتين (${b.id})`);
      return b.id;
    }
  } catch {
    /* search fallback */
  }
  const search = await api<
    { data?: Array<{ id: string; name?: string; nameEn?: string; nameAr?: string }> } | Array<{ id: string; name?: string; nameEn?: string }>
  >(`/brands?search=${encodeURIComponent("Seventeen")}&limit=20`);
  const rows = Array.isArray(search) ? search : (search.data ?? []);
  const exact = rows.find((b) => {
    const n = `${b.name ?? ""} ${b.nameEn ?? ""}`.toLowerCase();
    return n.includes("seventeen") || n.includes("سفنتين");
  });
  if (exact?.id) return exact.id;
  const created = await api<{ id: string }>("/brands", "POST", {
    name: "Seventeen",
    nameAr: "سفنتين",
    nameEn: "Seventeen",
  });
  return created.id;
}

async function uploadImage(url: string, alt: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*", "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)" },
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 1024) throw new Error("empty image");
    const contentType = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim().toLowerCase();
    if (!contentType.startsWith("image/") && !contentType.includes("octet-stream")) {
      throw new Error(`not an image (${contentType || "unknown"})`);
    }
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const blob = new Blob([buffer], { type: contentType.startsWith("image/") ? contentType : "image/jpeg" });
    const form = new FormData();
    form.append("file", blob, `${alt.replace(/[^\w.-]+/g, "_")}.${ext}`);
    form.append("purpose", "PRODUCT");
    const uploadRes = await fetch(`${API_BASE}/media/upload`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: form,
    });
    const json = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      const msg =
        (json as { message?: string; error?: { message?: string } })?.error?.message ??
        (json as { message?: string })?.message ??
        uploadRes.statusText;
      throw new Error(msg);
    }
    const media = ((json as { data?: { id: string } }).data ?? json) as { id: string };
    if (!media?.id) throw new Error(`No media id for ${alt}`);
    return media.id;
  } catch (err) {
    if (attempt >= 3) throw err;
    await new Promise((r) => setTimeout(r, attempt * 800));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length} separate SKUs (no shades)\n`);
  await login();
  console.log("Logged in.\n");
  const brandId = await resolveBrandId();
  console.log("");

  let added = 0;
  let skipped = 0;
  const results: Array<{ barcode: string; id: string; nameEn: string; images: number }> = [];
  const failures: Array<{ barcode: string; error: string }> = [];

  for (const product of PRODUCTS) {
    console.log(`--- ${product.barcode} | ${product.nameEn} ---`);
    try {
      const check = await api<{ exists: boolean; product?: { id: string; nameEn?: string } }>(
        `/products/barcode-check?barcode=${product.barcode}`,
      );
      if (check.exists && check.product?.id) {
        console.log(`  SKIP existing ${check.product.id} (${check.product.nameEn ?? ""})\n`);
        skipped += 1;
        results.push({
          barcode: product.barcode,
          id: check.product.id,
          nameEn: check.product.nameEn ?? product.nameEn,
          images: 0,
        });
        continue;
      }

      const fallbackImgs = [
        ...product.imageUrls,
        `https://www.brocard.ua/media/catalog/product/5/2/${product.barcode}_1.jpg`,
        `https://cdn.pharm24.gr/images/515x515-90/${product.barcode}.jpg`,
        `https://www.ansargallery.com/media/catalog/product/5/2/${product.barcode}_1.jpg`,
      ];
      const uniqUrls = [...new Set(fallbackImgs)];
      console.log(`  uploading up to ${uniqUrls.length} image candidates...`);
      const imageIds: string[] = [];
      for (let i = 0; i < uniqUrls.length; i++) {
        if (imageIds.length >= 3) break;
        try {
          const id = await uploadImage(uniqUrls[i], `${product.slug}-${imageIds.length + 1}`);
          imageIds.push(id);
          console.log(`    ✓ img ${imageIds.length} from candidate ${i + 1}`);
        } catch (err) {
          console.log(`    ✗ candidate ${i + 1} skipped: ${err instanceof Error ? err.message : err}`);
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      if (imageIds.length === 0) throw new Error(`No images uploaded for ${product.barcode}`);

      const created = await api<{ id: string }>("/products", "POST", {
        sku: product.sku,
        barcode: product.barcode,
        slug: product.slug,
        brandId,
        categoryId: product.categoryId,
        subcategoryId: product.subcategoryId,
        tertiaryCategoryId: product.tertiaryCategoryId,
        subcategoryIds: [product.subcategoryId],
        tertiaryCategoryIds: [product.tertiaryCategoryId],
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        descriptionAr: product.descriptionAr,
        descriptionEn: product.descriptionEn,
        price: product.price,
        originalPrice: product.originalPrice ?? product.price,
        stock: 0,
        isActive: true,
        imageIds,
      });

      const verify = await api<{ shades?: unknown[]; images?: unknown[] }>(`/products/${created.id}`);
      const shadeCount = verify.shades?.length ?? 0;
      console.log(`  ✓ ID ${created.id} | images ${imageIds.length} | shades ${shadeCount} | ${product.price} IQD\n`);
      if (shadeCount > 0) throw new Error(`Product ${product.barcode} unexpectedly has shades`);

      results.push({ barcode: product.barcode, id: created.id, nameEn: product.nameEn, images: imageIds.length });
      added += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ✗ FAILED: ${msg}\n`);
      failures.push({ barcode: product.barcode, error: msg });
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`Done — added ${added}, skipped ${skipped}, failed ${failures.length} / ${PRODUCTS.length}\n`);
  for (const r of results) {
    console.log(`${r.barcode} → ${r.id} | ${r.images} imgs | ${r.nameEn}`);
  }
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`${f.barcode}: ${f.error}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
