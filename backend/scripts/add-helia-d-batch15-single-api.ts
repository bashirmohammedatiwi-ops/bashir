/**
 * Helia-D — 15 separate single-SKU skincare products (no shades, with images).
 * Source: helia-d.com (verified names, descriptions, images)
 * Usage: npx tsx scripts/add-helia-d-batch15-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const CARE_FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const SUN_CARE = "25dc8086-bffa-47af-aaf7-64d503e58a9f";
const HANDS = "01ad1f0d-7c15-469c-bf86-85abd135e68f";

const FACE_MOISTURIZER = "21801439-d0e9-4106-b5e8-dfdd70ffeb8d";
const EYE_CARE = "09bedca5-0c6c-4a71-9b03-4bf29cecaf53";
const SUNSCREEN = "ad2a9e6b-5e20-4393-849a-e5e6c6cc97e2";
const CLEANSERS = "05028a17-da64-4c66-b25f-73c758acc2f8";

const IMG = "https://www.helia-d.com/wp-content/uploads";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId?: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrls: string[];
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "5999569022736",
    slug: "helia-d-hydramax-spf50-facial-sun-protection-40ml",
    sku: "HLD-SPF-022736",
    price: 12000,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: SUN_CARE,
    tertiaryCategoryId: SUNSCREEN,
    nameAr: "هيليا-دي هايدراماكس - كريم واقي من الشمس للوجه SPF 50+ 40 مل",
    nameEn: "Helia-D Hydramax SPF 50+ Facial Sun Protection 40ml",
    descriptionAr:
      "كريم واقي من الشمس للوجه من هيليا-دي هايدراماكس — حماية SPF 50+ واسعة الطيف من أشعة UVA وUVB بتركيبة ناعمة سريعة الامتصاص بدون لزوجة.\n\n" +
      "• حماية SPF 50+ من أشعة UVA وUVB.\n• تركيبة مرطّبة ناعمة تُمتَص بسرعة.\n• يقوّي حاجز البشرة ويرطّبها.\n• يساعد على الوقاية من علامات الشيخوخة الناتجة عن الشمس.\n• يُطبّق على الوجه والرقبة على بشرة نظيفة.",
    descriptionEn:
      "Helia-D Hydramax SPF 50+ Facial Sun Protection — broad-spectrum UVA/UVB sunscreen with a soft, fast-absorbing, non-sticky texture.\n\n" +
      "• SPF 50+ protection against UVA and UVB rays.\n• Soft, moisturising formula absorbs quickly.\n• Helps strengthen the skin barrier.\n• Helps prevent sun-induced premature ageing.\n• Apply to cleansed face and neck.",
    imageUrls: [`${IMG}/2023/03/Helia-D_hydramax_SPF_product-900x900.jpg`, `${IMG}/2023/03/Helia-D_hydramax_SPF_product.jpg`],
  },
  {
    barcode: "5999569023467",
    slug: "helia-d-pro-active-retinol-eye-serum-15ml",
    sku: "HLD-RES-023467",
    price: 10500,
    originalPrice: 12000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: EYE_CARE,
    nameAr: "هيليا-دي برو أكتيف - سيروم ريتinol للعناية بمحيط العين 15 مل",
    nameEn: "Helia-D Pro Active Retinol Eye Serum 15ml",
    descriptionAr:
      "سيروم ريتinol لمحيط العين من هيليا-دي برو أكتيف — تركيبة سريعة الامتصاص بالريتinol والجليسرين مع applicator roll-on يبرد وينشّط منطقة العين.\n\n" +
      "• يحتوي على ريتinol وجليسرين لترطيب محيط العين.\n• applicator roll-on ذكي لتبريد وتدليك المنطقة.\n• مناسب للاستخدام اليومي على البشرة العادية.\n• تركيبة نباتية (Vegan) — مختبر جلدياً.\n• يُطبّق مساءً؛ صباحاً استخدمي واقي SPF 20 على الأقل.",
    descriptionEn:
      "Helia-D Pro Active Retinol Eye Serum — fast-absorbing formula with retinol and glycerin plus a cooling roll-on applicator.\n\n" +
      "• Retinol and glycerin to hydrate the eye area.\n• Smart roll-on applicator cools and stimulates.\n• For daily use on normal skin.\n• Vegan and dermatologically tested.\n• Apply in the evening; use SPF 20+ in the morning.",
    imageUrls: [`${IMG}/2024/09/serum-rollon-retinol-900x900.jpg`, `${IMG}/2024/09/serum-rollon-retinol.jpg`],
  },
  {
    barcode: "5999569022361",
    slug: "helia-d-hydra-concept-hyaluron-serum-50ml",
    sku: "HLD-HCH-022361",
    price: 13500,
    originalPrice: 15000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "هيليا-دي هايدرا كونسبت - سيروم هيالورونيك للوجه 50 مل",
    nameEn: "Helia-D Hydra Concept Hyaluron Serum 50ml",
    descriptionAr:
      "سيروم هيالورونيك للوجه من هيليا-دي أوفيسينا هايدرا كونسبت — ترطيب فوري وطويل المفعول بفضل تركيبة Officina Hydra Complex الفريدة.\n\n" +
      "• هيالورونيك أسيد لترطيب مكثّف وفوري.\n• يُنعش البشرة ويمنحها مظهراً مشرقاً.\n• قوام خفيف سريع الامتصاص بدون طبقة دهنية.\n• مناسب لجميع أنواع البشرة.\n• ضعي بضع قطرات صباحاً و/أو مساءً على بشرة نظيفة.",
    descriptionEn:
      "Helia-D Officina Hydra Concept Hyaluron Serum — instant and long-lasting hydration with the unique Officina Hydra Complex.\n\n" +
      "• Hyaluronic acid for intensive, instant hydration.\n• Revitalises skin for a healthy, radiant look.\n• Lightweight, fast-absorbing, non-greasy formula.\n• Suitable for all skin types.\n• Apply a few drops morning and/or evening on cleansed skin.",
    imageUrls: [`${IMG}/2021/09/Hydra_Concept_Hyaluron_serum-1-900x900.jpg`, `${IMG}/2021/09/Hydra_Concept_Hyaluron_serum-1.jpg`],
  },
  {
    barcode: "5999569023528",
    slug: "helia-d-pro-active-collagen-eye-serum-15ml",
    sku: "HLD-CES-023528",
    price: 10500,
    originalPrice: 12000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: EYE_CARE,
    nameAr: "هيليا-دي برو أكتيف - سيروم كولاجين لمحيط العين 15 مل",
    nameEn: "Helia-D Pro Active Collagen Eye Serum 15ml",
    descriptionAr:
      "سيروم كولاجين لمحيط العين من هيليا-دي برو أكتيف — كولاجين بحري ذائب يمنح إحساساً بامتلاء ونعومة أكبر لمحيط العين.\n\n" +
      "• كولاجين بحري ذائب عالي الارتباط بالماء.\n• جليسرين لترطيب محيط العين.\n• applicator roll-on يبرد وينشّط المنطقة.\n• مناسب لجميع أنواع البشرة.\n• يُطبّق على محيط العين والجبهة وفوق الشفاه.",
    descriptionEn:
      "Helia-D Pro Active Collagen Eye Serum — marine soluble collagen for a fuller, smoother, more even eye area.\n\n" +
      "• Marine-origin soluble collagen with excellent water-binding.\n• Glycerin promotes hydration.\n• Roll-on applicator cools and stimulates.\n• Suitable for all skin types.\n• Apply to eye area, forehead and mouth area.",
    imageUrls: [`${IMG}/2024/09/serum-rollon-collagen-900x900.jpg`, `${IMG}/2024/09/serum-rollon-collagen.jpg`],
  },
  {
    barcode: "5999569023405",
    slug: "helia-d-pro-active-hyaluron-eye-serum-15ml",
    sku: "HLD-HES-023405",
    price: 10500,
    originalPrice: 12000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: EYE_CARE,
    nameAr: "هيليا-دي برو أكتيف - سيروم هيالورونيك لمحيط العين 15 مل",
    nameEn: "Helia-D Pro Active Hyaluron Eye Serum 15ml",
    descriptionAr:
      "سيروم هيالورونيك لمحيط العين من هيليا-دي برو أكتيف — هيالورونيك أسيد عالي الوزن الجزيئي مع جليسرين لترطيب ونعومة فورية.\n\n" +
      "• هيالورونيك أسيد + جليسرين لترطيب مكثّف.\n• يمنح محيط العين نعومة وإشراقة.\n• applicator roll-on للتبريد والتدليك.\n• مناسب لجميع أنواع البشرة.\n• تركيبة نباتية (Vegan) — مختبر جلدياً.",
    descriptionEn:
      "Helia-D Pro Active Hyaluron Eye Serum — high molecular weight hyaluronic acid and glycerin for perfect hydration and smoothness.\n\n" +
      "• Hyaluronic acid + glycerin for intensive hydration.\n• Leaves the eye area soft and refreshed.\n• Roll-on applicator for cooling and massage.\n• Suitable for all skin types.\n• Vegan and dermatologically tested.",
    imageUrls: [`${IMG}/2024/09/serum-rollon-hyaluron-900x900.jpg`, `${IMG}/2024/09/serum-rollon-hyaluron.jpg`],
  },
  {
    barcode: "5999569023481",
    slug: "helia-d-pro-active-collagen-shot-serum-50ml",
    sku: "HLD-CCS-023481",
    price: 13500,
    originalPrice: 15000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "هيليا-دي برو أكتيف - سيروم كولاجين مركّز للوجه 50 مل",
    nameEn: "Helia-D Pro Active Collagen Shot Serum 50ml",
    descriptionAr:
      "سيروم كولاجين مركّز للوجه من هيليا-دي برو أكتيف — كولاجين بحري ذائب يعزّز مرونة البشرة ويمنحها مظهراً أكثر امتلاءً ونعومة.\n\n" +
      "• كولاجين بحري طبيعي عالي الارتباط بالماء.\n• جليسرين لترطيب إضافي.\n• يحسّن مرونة البشرة وتوحيد لونها.\n• قوام خفيف سريع الامتصاص.\n• مناسب لجميع أنواع البشرة — للاستخدام اليومي.",
    descriptionEn:
      "Helia-D Pro Active Collagen Shot Serum — marine soluble collagen to boost elasticity and a smoother, more even complexion.\n\n" +
      "• Natural marine soluble collagen with excellent moisture binding.\n• Glycerin for added hydration.\n• Improves skin elasticity and even tone.\n• Light, fast-absorbing formula.\n• For all skin types — daily use.",
    imageUrls: [`${IMG}/2024/09/serum-collagen-900x900.jpg`, `${IMG}/2024/09/serum-collagen.jpg`],
  },
  {
    barcode: "5999569023368",
    slug: "helia-d-pro-active-hyaluron-shot-serum-50ml",
    sku: "HLD-HSS-023368",
    price: 13500,
    originalPrice: 15000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "هيليا-دي برو أكتيف - سيروم هيالورونيك مركّز للوجه 50 مل",
    nameEn: "Helia-D Pro Active Hyaluron Shot Serum 50ml",
    descriptionAr:
      "سيروم هيالورونيك مركّز للوجه من هيليا-دي برو أكتيف — ترطيب عميق بفضل هيالورونيك أسيد عالي الوزن الجزيئي وجليسرين.\n\n" +
      "• هيالورونيك أسيد + جليسرين لترطيب ممتاز.\n• يمنح البشرة نعومة وإشراقة فورية.\n• قوام خفيف يناسب الاستخدام اليومي.\n• مناسب لجميع أنواع البشرة.\n• تركيبة نباتية (Vegan) — مختبر جلدياً.",
    descriptionEn:
      "Helia-D Pro Active Hyaluron Shot Serum — deep hydration with high molecular weight hyaluronic acid and glycerin.\n\n" +
      "• Hyaluronic acid + glycerin for excellent hydration.\n• Instant smoothness and radiance.\n• Lightweight formula for daily use.\n• Suitable for all skin types.\n• Vegan and dermatologically tested.",
    imageUrls: [`${IMG}/2024/09/serum-hyaluron-900x900.jpg`, `${IMG}/2024/09/serum-hyaluron.jpg`],
  },
  {
    barcode: "5999569023429",
    slug: "helia-d-pro-active-retinol-shot-serum-50ml",
    sku: "HLD-RSS-023429",
    price: 13500,
    originalPrice: 15000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "هيليا-دي برو أكتيف - سيروم ريتinol مركّز للوجه 50 مل",
    nameEn: "Helia-D Pro Active Retinol Shot Serum 50ml",
    descriptionAr:
      "سيروم ريتinol مركّز للوجه من هيليا-دي برو أكتيف — ريتinol وجليسرين لترطيب البشرة وتحسين ملمسها بتركيبة خفيفة سريعة الامتصاص.\n\n" +
      "• يحتوي على ريتinol وجليسرين.\n• يحسّن ملمس البشرة ويرطّبها.\n• أدخلي الريتinol تدريجياً في روتينك.\n• للاستخدام المسائي على بشرة نظيفة.\n• صباحاً استخدمي واقي SPF 20 على الأقل.",
    descriptionEn:
      "Helia-D Pro Active Retinol Shot Serum — retinol and glycerin in a light, fast-absorbing daily serum for normal skin.\n\n" +
      "• Formulated with retinol and glycerin.\n• Promotes hydration and refines skin texture.\n• Introduce retinol gradually into your routine.\n• Apply in the evening on cleansed skin.\n• Use SPF 20+ face cream in the morning.",
    imageUrls: [`${IMG}/2024/09/serum-retinol-900x900.jpg`, `${IMG}/2024/09/serum-retinol.jpg`],
  },
  {
    barcode: "5999569022712",
    slug: "helia-d-hydramax-deep-moisturizing-night-cream-gel-50ml",
    sku: "HLD-NCG-022712",
    price: 12000,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "هيليا-دي هايدراماكس - كريم-جل ليلي مرطّب بعمق 50 مل",
    nameEn: "Helia-D Hydramax Deep Moisturizing Night Cream Gel 50ml",
    descriptionAr:
      "كريم-جل ليلي مرطّب بعمق من هيليا-دي هايدراماكس — ثلاثة أنواع من هيالورونيك أسيد وببتيدات وزيوت مغذّية لتجديد البشرة أثناء النوم.\n\n" +
      "• 3 أنواع هيالورونيك أسيد + ببتيدات.\n• زيت بذور المشمش والعنب وفيتامين E وبانثenol.\n• ترطيب يدوم حتى 24 ساعة.\n• مناسب لجميع أنواع البشرة.\n• يُطبّق مساءً على الوجه والرقبة بعد التنظيف.",
    descriptionEn:
      "Helia-D Hydramax Deep Moisturizing Night Cream Gel — three hyaluronic acids, peptides and nourishing oils to renew skin overnight.\n\n" +
      "• Triple hyaluronic acid + peptides.\n• Apricot and grape seed oils, vitamin E and panthenol.\n• Up to 24 hours hydration.\n• Suitable for all skin types.\n• Apply every evening on cleansed face and neck.",
    imageUrls: [`${IMG}/2023/04/Helia-D_hydramax_night_product-900x900.jpg`, `${IMG}/2023/04/Helia-D_hydramax_night_product.jpg`],
  },
  {
    barcode: "5999569023443",
    slug: "helia-d-pro-active-retinol-face-cream-50ml",
    sku: "HLD-RFC-023443",
    price: 12000,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "هيليا-دي برو أكتيف - كريم وجه بالريتinol 50 مل",
    nameEn: "Helia-D Pro Active Retinol Face Cream 50ml",
    descriptionAr:
      "كريم وجه بالريتinol من هيليا-دي برو أكتيف — ريتinol وجليسرين وألانتoin لترطيب البشرة العادية بتركيبة سريعة الامتصاص.\n\n" +
      "• ريتinol + جليسرين + ألانتoin.\n• يرطّب ويُنعّم البشرة.\n• أدخلي الريتinol تدريجياً في روتينك.\n• للاستخدام المسائي على بشرة نظيفة.\n• صباحاً استخدمي واقي SPF 20 على الأقل.",
    descriptionEn:
      "Helia-D Pro Active Retinol Face Cream — retinol, glycerin and allantoin for normal skin in a fast-absorbing daily cream.\n\n" +
      "• Retinol + glycerin + allantoin.\n• Promotes hydration and comfort.\n• Introduce retinol gradually.\n• Apply every evening after cleansing.\n• Use SPF 20+ in the morning.",
    imageUrls: [`${IMG}/2024/09/retinol-jar-900x900.jpg`, `${IMG}/2024/09/retinol-jar.jpg`],
  },
  {
    barcode: "5999569022699",
    slug: "helia-d-hydramax-deep-moisturizing-cream-gel-sensitive-skin-50ml",
    sku: "HLD-SCG-022699",
    price: 12000,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "هيليا-دي هايدراماكس - كريم-جل مرطّب بعمق للبشرة الحساسة 50 مل",
    nameEn: "Helia-D Hydramax Deep Moisturizing Cream Gel For Sensitive Skin 50ml",
    descriptionAr:
      "كريم-جل مرطّب بعمق للبشرة الحساسة من هيليا-دي هايدراماكس — تركيبة لطيفة خالية من العطر مع 3 أنواع هيالورونيك أسيد وببتيدات.\n\n" +
      "• مخصّص للبشرة الحساسة — خالٍ من العطر.\n• 3 أنواع هيالورونيك أسيد + ببتيدات.\n• زيت بذور الكشمش الأسود وسqualane وbisabolol.\n• ترطيب يدوم حتى 24 ساعة.\n• يُطبّق يومياً على الوجه والرقبة بعد التنظيف.",
    descriptionEn:
      "Helia-D Hydramax Deep Moisturizing Cream Gel For Sensitive Skin — gentle fragrance-free formula with triple hyaluronic acid and peptides.\n\n" +
      "• For sensitive skin — fragrance-free.\n• Triple hyaluronic acid + peptides.\n• Black currant seed oil, squalane and bisabolol.\n• Up to 24 hours hydration.\n• Apply daily on cleansed face and neck.",
    imageUrls: [`${IMG}/2023/04/Helia-D_hydramax_sensitive_product.jpg`],
  },
  {
    barcode: "5999569023566",
    slug: "helia-d-pro-active-vitamin-c-face-cream-50ml",
    sku: "HLD-VCF-023566",
    price: 12000,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "هيليا-دي برو أكتيف - كريم وجه بفيتامين C 50 مل",
    nameEn: "Helia-D Pro Active Vitamin C Face Cream 50ml",
    descriptionAr:
      "كريم وجه بفيتامين C من هيليا-دي برو أكتيف — تركيبة سريعة الامتصاص للاستخدام اليومي، تساعد على توحيد لون البشرة ومنحها إشراقة طبيعية مع حماية مضادات الأكسدة.\n\n" +
      "• فيتامين C (Ascorbyl Glucoside) لمظهر أكثر إشراقاً وتوحيد لون البشرة.\n" +
      "• مضاد أكسدة قوي يحمي البشرة من العوامل البيئية الضارة.\n" +
      "• جليسرين والألانتoin لترطيب البشرة وتهدئتها.\n" +
      "• لجميع أنواع البشرة — يُطبّق يومياً على الوجه والرقبة بعد التنظيف.\n" +
      "• تركيبة نباتية (Vegan) — مختبر جلدياً.",
    descriptionEn:
      "Helia-D Pro Active Vitamin C Face Cream — fast-absorbing daily face cream with vitamin C for a more even, radiant complexion and antioxidant protection.\n\n" +
      "• Vitamin C (ascorbyl glucoside) helps brighten and even skin tone.\n" +
      "• Strong antioxidant barrier against harmful environmental effects.\n" +
      "• Glycerin and allantoin promote hydration and comfort.\n" +
      "• For all skin types — apply daily on cleansed face and neck.\n" +
      "• Vegan and dermatologically tested.",
    imageUrls: [`${IMG}/2024/09/vit-c-jar-900x900.jpg`, `${IMG}/2024/09/vit-c-jar.jpg`],
  },
  {
    barcode: "5999569023801",
    slug: "helia-d-hydramax-micellar-makeup-remover-water-400ml",
    sku: "HLD-MMW-023801",
    price: 11000,
    originalPrice: 12500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "هيليا-دي هايدراماكس - ماء ميسيلار لإزالة المكياج 400 مل",
    nameEn: "Helia-D Hydramax Micellar Make-up Remover Water 400ml",
    descriptionAr:
      "ماء ميسيلار لإزالة المكياج من هيليا-دي هايدراماكس — ينظّف البشرة ويزيل المكياج والشوائب بلطف دون الحاجة للشطف.\n\n" +
      "• يزيل المكياج من الوجه والعينين والشفاه.\n• بروفيتامين B5 وجليسرين وbetaine لترطيب البشرة.\n• خالٍ من العطر — مناسب للبشرة الحساسة.\n• لا يحتاج شطفاً — للاستخدام صباحاً ومساءً.\n• يُطبّق بقطنة على الوجه والعينين والشفاه.",
    descriptionEn:
      "Helia-D Hydramax Micellar Make-up Remover Water — gently cleanses and removes makeup and impurities with no rinsing required.\n\n" +
      "• Removes makeup from face, eyes and lips.\n• Provitamin B5, glycerin and betaine maintain moisture.\n• Fragrance-free — suitable for sensitive skin.\n• No rinse needed — morning and evening use.\n• Apply with a cotton pad on face, eyes and lips.",
    imageUrls: [`${IMG}/2024/10/micellas-viz.jpg`],
  },
  {
    barcode: "5999569023825",
    slug: "helia-d-skin-selection-quick-moisture-hand-cream-100ml",
    sku: "HLD-QHC-023825",
    price: 8500,
    originalPrice: 9500,
    categoryId: CARE,
    subcategoryId: HANDS,
    nameAr: "هيليا-دي سكين سيلكشن - كريم يدين للترطيب السريع 100 مل",
    nameEn: "Helia-D Skin Selection Quick Moisture Hand Cream 100ml",
    descriptionAr:
      "كريم يدين للترطيب السريع من هيليا-دي سكين سيلكشن — يرطّب اليدين فوراً ويتركهما ناعمتين بدون لزوجة.\n\n" +
      "• ترطيب سريع وفوري لليدين.\n• قوام خفيف يُمتَص بسرعة.\n• للاستخدام اليومي على يدين نظيفتين.\n• يُدلّك على اليدين حسب الحاجة.\n• تركيبة نباتية (Vegan).",
    descriptionEn:
      "Helia-D Skin Selection Quick Moisture Hand Cream — instant hydration for soft, comfortable hands without greasiness.\n\n" +
      "• Quick, instant hand hydration.\n• Lightweight, fast-absorbing texture.\n• For daily use on clean hands.\n• Massage in as often as required.\n• Vegan formula.",
    imageUrls: [`${IMG}/2024/11/skin_selection_gyorshidratalo_kezkrem-900x900.jpg`, `${IMG}/2024/11/skin_selection_gyorshidratalo_kezkrem.jpg`],
  },
  {
    barcode: "5999569023863",
    slug: "helia-d-skin-selection-repairing-hand-cream-100ml",
    sku: "HLD-RHC-023863",
    price: 8500,
    originalPrice: 9500,
    categoryId: CARE,
    subcategoryId: HANDS,
    nameAr: "هيليا-دي سكين سيلكشن - كريم يدين مُجدّد ومرمّم 100 مل",
    nameEn: "Helia-D Skin Selection Repairing Hand Cream 100ml",
    descriptionAr:
      "كريم يدين مُجدّد من هيليا-دي سكين سيلكشن — جليسرين وألانتoin وزبدة الشيا لترميم اليدين الجافة والمتضررة.\n\n" +
      "• جليسرين وألانتoin وزبدة الشيا.\n• يرطّب ويُنعّم البشرة المتضررة.\n• للاستخدام اليومي على يدين نظيفتين.\n• يُدلّك على اليدين حسب الحاجة.\n• تركيبة نباتية (Vegan).",
    descriptionEn:
      "Helia-D Skin Selection Repairing Hand Cream — glycerin, allantoin and shea butter to repair dry, damaged hands.\n\n" +
      "• Glycerin, allantoin and shea butter.\n• Moisturises and softens damaged skin.\n• For daily use on clean hands.\n• Massage in as often as required.\n• Vegan formula.",
    imageUrls: [`${IMG}/2024/11/skin_selection_regeneralo_kezkrem-900x900.jpg`, `${IMG}/2024/11/skin_selection_regeneralo_kezkrem.jpg`],
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
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: "هيليا-دي",
    brandEn: "Helia-D",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Helia-D brand");
  console.log(`Brand: Helia-D (${brandId})${resolved.created ? " [created]" : ""}\n`);
  return brandId;
}

async function uploadImage(url: string, alt: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*", "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)" },
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 1024) throw new Error("empty image");

    const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!contentType.startsWith("image/")) throw new Error(`not an image (${contentType || "unknown"})`);

    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const blob = new Blob([buffer], { type: contentType });
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
  console.log(`Products: ${PRODUCTS.length} (with images, no shades)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();
  let added = 0;
  let skipped = 0;

  for (const product of PRODUCTS) {
    console.log(`--- ${product.barcode} ---`);
    const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
      `/products/barcode-check?barcode=${product.barcode}`,
    );
    if (check.exists) {
      console.log(`  skip — exists | ${check.product?.nameAr ?? "?"}\n`);
      skipped += 1;
      continue;
    }

    const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
      `/products?search=${encodeURIComponent(product.slug)}&status=all&limit=5`,
    );
    const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
    if (rows.some((p) => p.slug === product.slug)) {
      console.log(`  skip — slug exists (${product.slug})\n`);
      skipped += 1;
      continue;
    }

    console.log(`  uploading image...`);
    const imageIds: string[] = [];
    for (let i = 0; i < product.imageUrls.length; i++) {
      try {
        imageIds.push(await uploadImage(product.imageUrls[i], `${product.slug}-${i + 1}`));
      } catch (err) {
        console.log(`  image ${i + 1} failed: ${(err as Error).message}`);
      }
    }
    if (!imageIds.length) throw new Error(`No images uploaded for ${product.barcode}`);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      ...(product.tertiaryCategoryId ? { tertiaryCategoryId: product.tertiaryCategoryId } : {}),
      subcategoryIds: [product.subcategoryId],
      tertiaryCategoryIds: product.tertiaryCategoryId ? [product.tertiaryCategoryId] : [],
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: 0,
      isActive: true,
      imageIds,
    });

    console.log(`  ✓ ${product.nameAr}`);
    console.log(`    EN: ${product.nameEn}`);
    console.log(`    ID: ${created.id} | images: ${imageIds.length} | ${product.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Done — added: ${added}/${PRODUCTS.length} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
