/**
 * Feel Free COSMOS — 20 separate single-SKU skincare products (no shades, with images).
 * Source: feelfreebio.com + verified retailer barcodes (Biobranding S.L., Spain)
 * Usage: npx tsx scripts/add-feel-free-batch20-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const CARE_FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const HANDS = "01ad1f0d-7c15-469c-bf86-85abd135e68f";

const FACE_MOISTURIZER = "21801439-d0e9-4106-b5e8-dfdd70ffeb8d";
const EYE_CARE = "09bedca5-0c6c-4a71-9b03-4bf29cecaf53";
const CLEANSERS = "05028a17-da64-4c66-b25f-73c758acc2f8";
const FACE_MASKS = "5a89a7d0-16d9-47d6-8575-2961289fc526";

const IMG = "https://feelfreebio.com/wp-content/uploads";

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
    barcode: "8437017754053",
    slug: "feel-free-vitamin-c-facial-cream-50ml",
    sku: "FFL-754053",
    price: 13500,
    originalPrice: 15000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "فيل فري - كريم فيتامين C للوجه 50 مل (COSMOS Natural)",
    nameEn: "Feel Free Vitamin C Facial Cream 50ml",
    descriptionAr:
      "كريم فيتامين C للوجه من فيل فري — ترطيب عميق وإشراق فوري للبشرة الباهتة والمتعبة.\n\n" +
      "• فيتامين C نقي مع مستخلص التوت لمحاربة الجذور الحرة.\n• هيالورونيك أسيد لترطيب مكثّف وتنعيم البشرة.\n• يوحّد لون البشرة ويقلّل ظهور علامات التقدّم في السن.\n• تركيبة طبيعية معتمدة COSMOS Natural — مناسبة للاستخدام اليومي.\n• يُطبّق صباحاً و/أو مساءً على بشرة نظيفة؛ ننصح باستخدام واقي شمس صباحاً.",
    descriptionEn:
      "Feel Free Vitamin C Facial Cream deeply hydrates and brightens dull skin while evening tone and reducing signs of aging.\n\n" +
      "• Pure vitamin C with raspberry extract for antioxidant protection.\n• Hyaluronic acid for intensive hydration.\n• Helps fight oxidative damage and skin imperfections.\n• COSMOS Natural certified formula for daily use.\n• Apply morning and/or evening on cleansed skin; use SPF in the morning.",
    imageUrls: [`${IMG}/2024/10/00456-COSMOS-VITAMIN-C-FACIAL-CREAM-FEEL-FREE-50ML-EN-ES-1.webp`],
  },
  {
    barcode: "8437017754206",
    slug: "feel-free-bakuchiol-facial-moisturizing-cream-50ml",
    sku: "FFL-754206",
    price: 14000,
    originalPrice: 15500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "فيل فري - كريم باكوشيول المرطّب للوجه 50 مل (COSMOS Natural)",
    nameEn: "Feel Free Bakuchiol Facial Moisturizing Cream 50ml",
    descriptionAr:
      "كريم باكوشيول المرطّب للوجه من فيل فري — بديل نباتي للريتinol يغذّي البشرة ويحسّن مرونتها.\n\n" +
      "• باكوشيول يحفّز إنتاج الكولاجين ويقلّل علامات الشيخوخة.\n• مستخلص الواكame والخيار لترطيب منعش ومظهر مشرق.\n• زيت الزيتون والصبار والاسكوالان لحماية حاجز البشرة.\n• مثالي للبشرة الناضجة والجافة والحساسة.\n• يُطبّق صباحاً ومساءً على بشرة نظيفة.",
    descriptionEn:
      "Feel Free Bakuchiol Moisturizing Cream nourishes, hydrates, and improves firmness with plant-based bakuchiol, wakame, and cucumber.\n\n" +
      "• Bakuchiol stimulates collagen and helps reduce signs of aging.\n• Wakame and cucumber for refreshing hydration and radiance.\n• Olive oil, aloe vera and squalane support the skin barrier.\n• Ideal for mature, dry or blemished sensitive skin.\n• Apply morning and evening on cleansed skin.",
    imageUrls: [`${IMG}/2024/10/00467-COSMOS-BAKUCHIOL-FACIAL-CREAM-FF-50-ML-EN-ES-3.webp`],
  },
  {
    barcode: "8437017753681",
    slug: "feel-free-rose-berries-aqua-bouncy-mask-50ml",
    sku: "FFL-753681",
    price: 11000,
    originalPrice: 12500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MASKS,
    nameAr: "فيل فري - ماسك Rose & Berries Aqua Bouncy المشرق للوجه 50 مل",
    nameEn: "Feel Free Rose & Berries Aqua Bouncy Mask 50ml",
    descriptionAr:
      "ماسك Rose & Berries Aqua Bouncy من فيل فري — قناع مائي يمنح البشرة إشراقاً فورياً وترطيباً منعشاً.\n\n" +
      "• ماء الورد ومستخلص التوت لإضاءة البشرة ومنحها مظهراً حيوياً.\n• هيالورونيك أسيد لترطيب عميق وملمس ناعم.\n• مستخلصات التوت البري والكركديه لتغذية البشرة.\n• مناسب لجميع أنواع البشرة — خاصة البشرة الباهتة والجافة.\n• يُوزّع طبقة على الوجه ثم يُشطف بعد 5–10 دقائق.",
    descriptionEn:
      "Feel Free Rose & Berries Aqua Bouncy Mask boosts radiance and gives skin a fresh, hydrated look.\n\n" +
      "• Rose water and raspberry extract for instant brightness.\n• Hyaluronic acid for deep, bouncy hydration.\n• Cranberry powder and hibiscus extract nourish the skin.\n• Suitable for all skin types, especially dull or dry skin.\n• Apply a layer to the face and rinse after 5–10 minutes.",
    imageUrls: [
      "https://apimp.wizaz.pl/img/png/800/800/resize/catalog/product/3/8/389a86a2d75f3c81e5258941c1778329_4929634.webp",
    ],
  },
  {
    barcode: "8437017754985",
    slug: "feel-free-sensitive-skin-facial-cream-50ml",
    sku: "FFL-754985",
    price: 13000,
    originalPrice: 14500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "فيل فري - كريم الوجه للبشرة الحساسة 50 مل (COSMOS Natural)",
    nameEn: "Feel Free Sensitive Skin Facial Cream 50ml",
    descriptionAr:
      "كريم الوجه للبشرة الحساسة من فيل فري — يرطّب ويهدّئ البشرة الرقيقة ويقلّل الاحمرار.\n\n" +
      "• مستخلص دم التنين (Dragon's Blood) لتهدئة وإصلاح البشرة.\n• زيت الجojoba ومستخلص التوت لترطيب لطيف وحماية.\n• تركيبة COSMOS Natural مناسبة للبشرة الجافة والمتهيجة.\n• يقوّي حاجز البشرة للاستخدام اليومي.\n• يُطبّق صباحاً ومساءً على بشرة نظيفة.",
    descriptionEn:
      "Feel Free Sensitive Skin Facial Cream soothes, protects and hydrates delicate skin while helping reduce redness and irritation.\n\n" +
      "• Dragon's blood extract to calm and repair sensitive skin.\n• Jojoba oil and raspberry extract for gentle moisture.\n• COSMOS Natural formula for dry or irritated skin.\n• Strengthens the skin barrier for daily use.\n• Apply morning and evening on cleansed skin.",
    imageUrls: [`${IMG}/2024/10/Clasicas_Pieles_Sensibles.webp`],
  },
  {
    barcode: "8437017754275",
    slug: "feel-free-hyaluronic-acid-eye-contour-30ml",
    sku: "FFL-754275",
    price: 12000,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: EYE_CARE,
    nameAr: "فيل فري - كريم محيط العين بالهيالورونيك أسيد 30 مل",
    nameEn: "Feel Free Hyaluronic Acid Eye Contour 30ml",
    descriptionAr:
      "كريم محيط العين بالهيالورونيك أسيد من فيل فري — ترطيب مكثّف ومرونة أكبر لمنطقة العين.\n\n" +
      "• نوعان من الهيالورونيك أسيد لترطيب عميق وسطحي.\n• مستخلص الكيوي لإشراق محيط العين وتفتيح المظهر.\n• الشاي الأخضر والصبار لتهدئة وتقليل الانتفاخ.\n• قوام سيروم خفيف سريع الامتصاص.\n• يُطبّق صباحاً ومساءً على محيط العين بحركات تربيت لطيفة.",
    descriptionEn:
      "Feel Free Hyaluronic Acid Eye Contour hydrates and improves firmness around the eyes with a lightweight serum-like texture.\n\n" +
      "• Two types of hyaluronic acid for deep and surface hydration.\n• Kiwi extract brightens the eye area.\n• Green tea and aloe vera soothe and reduce puffiness.\n• Fast-absorbing formula for daily use.\n• Apply morning and evening with gentle tapping motions.",
    imageUrls: [`${IMG}/2024/10/00474-COSMOS-HA-EYE-CONTOUR-FEEL-FREE-30ML-EN-ES-1.webp`],
  },
  {
    barcode: "8437017754626",
    slug: "feel-free-glowing-toner-7-glycolic-acid-100ml",
    sku: "FFL-754626",
    price: 11500,
    originalPrice: 13000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "فيل فري - تونر Glowing Acid 7% جلايكوليك 100 مل",
    nameEn: "Feel Free Glowing Toner 7% Glycolic Acid 100ml",
    descriptionAr:
      "تونر Glowing Acid من فيل فري — تونر مقشّر لطيف بتركيز 7% جلايكوليك أسيد لإشراق البشرة.\n\n" +
      "• حمض الجلايكوليك 7% لإزالة الخلايا الميتة وتنعيم ملمس البشرة.\n• يساعد على تفتيح البقع الداكنة وآثار حب الشباب.\n• الصبار والسentella Asiatica لتهدئة البشرة بعد التقشير.\n• يُستخدم مساءً بعد التنظيف؛ ضروري استخدام واقي شمس نهاراً.\n• مناسب لمعظم أنواع البشرة ما عدا الحساسة جداً.",
    descriptionEn:
      "Feel Free Glowing Toner with 7% Glycolic Acid gently exfoliates, brightens and evens skin tone.\n\n" +
      "• 7% glycolic acid removes dead cells for smoother skin.\n• Helps reduce dark spots and acne marks.\n• Aloe vera and centella asiatica soothe after exfoliation.\n• Use in the evening after cleansing; always wear SPF by day.\n• Suitable for most skin types except very sensitive.",
    imageUrls: [`${IMG}/2024/10/Glowing_toner.webp`],
  },
  {
    barcode: "8437017754619",
    slug: "feel-free-aha-3-brighten-gel-cleanser-100ml",
    sku: "FFL-754619",
    price: 10500,
    originalPrice: 12000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "فيل فري - غسول جل AHA 3% Brighten لتفتيح البشرة 100 مل",
    nameEn: "Feel Free AHA 3% Brighten Gel Cleanser 100ml",
    descriptionAr:
      "غسول جل AHA 3% Brighten من فيل فري — منظّف مقشّر لطيف يفتّح البشرة وينظّف المسام.\n\n" +
      "• مزيج AHA (ستريك + لactic + جلايكوليك) لتقشير لطيف يومي.\n• يقلّل البقع الداكنة وآثار الحبوب ويوحّد لون البشرة.\n• مستخلص الشاي الأخضر لتهدئة البشرة الدهنية.\n• مثالي للبشرة الدهنية والمختلطة ومعرضة للحبوب.\n• يُستخدم صباحاً و/أو مساءً مع تجنّب منطقة العين.",
    descriptionEn:
      "Feel Free AHA 3% Brighten Gel Cleanser combines citric, lactic and glycolic acids to gently exfoliate and brighten.\n\n" +
      "• AHA blend removes dead cells and clears imperfections.\n• Helps reduce acne marks and dark spots.\n• Green tea extract soothes oily and combination skin.\n• Ideal for oily, combination and acne-prone skin.\n• Use morning and/or evening; avoid the eye area.",
    imageUrls: [`${IMG}/2024/10/The_Range_Acidos_Gel_Cleanser.webp`],
  },
  {
    barcode: "8437017754046",
    slug: "feel-free-vitamin-c-facial-serum-30ml",
    sku: "FFL-754046",
    price: 12500,
    originalPrice: 14000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "فيل فري - سيروم فيتامين C للوجه 30 مل (COSMOS Natural)",
    nameEn: "Feel Free Vitamin C Facial Serum 30ml",
    descriptionAr:
      "سيروم فيتامين C للوجه من فيل فري — إشراق فوري وحماية مضادّة للأكسدة للبشرة الباهتة.\n\n" +
      "• فيتامين C نقي مع 6 مستخلصات نباتية آسيوية (Oriental Tea Complex).\n• هيالورونيك أسيد وصبار لترطيب عميق ونعومة.\n• يحفّز الكولاجين ويوحّد لون البشرة.\n• قوام سيروم خفيف سريع الامتصاص.\n• ضعي 3–4 قطرات صباحاً ومساءً؛ استخدمي واقي شمس صباحاً.",
    descriptionEn:
      "Feel Free Vitamin C Facial Serum hydrates, brightens and reduces signs of aging with vitamin C and six exotic plant extracts.\n\n" +
      "• Pure vitamin C with Oriental Tea Complex (6 plant extracts).\n• Hyaluronic acid and aloe for deep hydration.\n• Activates collagen synthesis and evens skin tone.\n• Lightweight, fast-absorbing serum texture.\n• Apply 3–4 drops morning and evening; use SPF in the morning.",
    imageUrls: [`${IMG}/2024/10/00455-COSMOS-VITAMIN-C-FACIAL-SERUM-FEEL-FREE-30ML-EN-ES-1.webp`],
  },
  {
    barcode: "8437017754251",
    slug: "feel-free-hyaluronic-acid-facial-serum-30ml",
    sku: "FFL-754251",
    price: 12000,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "فيل فري - سيروم هيالورونيك أسيد للوجه 30 مل (COSMOS Natural)",
    nameEn: "Feel Free Hyaluronic Acid Facial Serum 30ml",
    descriptionAr:
      "سيروم هيالورونيك أسيد للوجه من فيل فري — ترطيب مكثّف ومرونة فورية لجميع أنواع البشرة.\n\n" +
      "• هيالورونيك أسيد لترطيب عميق وملء الخطوط الدقيقة.\n• شاي الماتcha ومستخلص الكيوي لتنشيط البشرة ومضادات الأكسدة.\n• يحسّن مرونة البشرة ويمنحها مظهراً حيوياً.\n• قوام خفيف غير لزج — مثالي قبل الكريm.\n• ضعي بضع قطرات صباحاً ومساءً على بشرة رطبة.",
    descriptionEn:
      "Feel Free Hyaluronic Acid Facial Serum intensely hydrates, revitalises and improves skin elasticity.\n\n" +
      "• Hyaluronic acid for deep hydration and plumping effect.\n• Matcha tea and kiwi extract for antioxidant vitality.\n• Improves elasticity and restores a healthy glow.\n• Lightweight, non-sticky formula — ideal before moisturiser.\n• Apply a few drops morning and evening on damp skin.",
    imageUrls: [`${IMG}/2024/10/00472-COSMOS-HA-FACIAL-SERUM-FEEL-FREE-30ML-EN-ES-1.webp`],
  },
  {
    barcode: "8437017754237",
    slug: "feel-free-plant-collagen-facial-serum-30ml",
    sku: "FFL-754237",
    price: 12000,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "فيل فري - سيروم الكولاجين النباتي للوجه 30 مل (COSMOS Natural)",
    nameEn: "Feel Free Plant Collagen Facial Serum 30ml",
    descriptionAr:
      "سيروم الكولاجين النباتي للوجه من فيل فري — شدّ مبكر وترطيب عميق للبشرة الشابة.\n\n" +
      "• كولاجين نباتي مع مستخلص الرمان والطماطم.\n• يقلّل الخطوط الدقيقة الأولى ويحسّن المرونة.\n• يرطّب البشرة ويحسّن ملمسها.\n• مناسب للبشرة التي تبدأ بإظهار علامات التقدّم.\n• ضعي 3–4 قطرات صباحاً ومساءً على بشرة نظيفة.",
    descriptionEn:
      "Feel Free Plant Collagen Facial Serum reduces early wrinkles and loss of elasticity with plant-based collagen.\n\n" +
      "• Plant collagen with pomegranate and tomato extracts.\n• Helps reduce first fine lines and improve firmness.\n• Deep hydration with smoother skin texture.\n• Perfect for young skin showing first signs of aging.\n• Apply 3–4 drops morning and evening on cleansed skin.",
    imageUrls: [`${IMG}/2024/10/00470-COSMOS-VEGETABLE-COLLAGEN-FACIAL-SERUM-FF-30ML-EN-ES-1.webp`],
  },
  {
    barcode: "8437017754633",
    slug: "feel-free-ha-argireline-prebiotics-serum-30ml",
    sku: "FFL-754633",
    price: 13000,
    originalPrice: 14500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "فيل فري - سيروم HA + Argireline + Prebiotics للوجه 30 مل",
    nameEn: "Feel Free HA + Argireline + Prebiotics Serum 30ml",
    descriptionAr:
      "سيروم HA + Argireline + Prebiotics من فيل فري — ترطيب وتجعيد وتجديد توازن البشرة.\n\n" +
      "• هيالورونيك أسيد + ببتيد Argireline لتقليل خطوط التعبير.\n• Prebiotics (زبادي) لدعم Microbiome البشرة.\n• زيت الأرgan والصبار لترطيب وتغذية.\n• مثالي للبشرة الناضجة وجميع الأنواع.\n• ضعي 3 قطرات صباحاً ومساءً على بشرة نظيفة.",
    descriptionEn:
      "Feel Free HA + Argireline + Prebiotics Serum hydrates, reduces wrinkles and improves firmness.\n\n" +
      "• Hyaluronic acid and Argireline peptide for expression lines.\n• Yogurt prebiotics balance the skin microbiome.\n• Argan oil and aloe for nourishment and hydration.\n• Suitable for all skin types, especially mature skin.\n• Apply 3 drops morning and evening on cleansed skin.",
    imageUrls: [`${IMG}/2024/10/The_Range_Peptides_Hyaluronic_Argireline.webp`],
  },
  {
    barcode: "8437017753629",
    slug: "feel-free-hemp-liposome-calming-serum-30ml",
    sku: "FFL-753629",
    price: 12500,
    originalPrice: 14000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "فيل فري - سيروم Hemp Liposome المهدّئ للوجه 30 مل",
    nameEn: "Feel Free Hemp Liposome Calming Serum 30ml",
    descriptionAr:
      "سيروم Hemp Liposome المهدّئ من فيل فري — ترطيب خفيف غير دهني مع مستخلص القنّب اللiposomal.\n\n" +
      "• مستخلص Cannabis Sativa liposomal لتهدئة البشرة وتقوية حاجزها.\n• هيالورونيك أسيد + Gluconolactone + Phospholipids للترطيب العميق.\n• السentella Asiatica والخيار لتهدئة البشرة المتهيجة.\n• قوام خفيف مناسب لجميع أنواع البشرة.\n• ضعي بضع قطرات ودلّكي حتى الامتصاص الكامل.",
    descriptionEn:
      "Feel Free Hemp Liposome Calming Serum provides comfortable, non-oily hydration with liposomal Cannabis sativa extract.\n\n" +
      "• Liposomal hemp extract soothes skin and supports barrier function.\n• Hyaluronic acid, gluconolactone and phospholipids hydrate deeply.\n• Centella asiatica and cucumber calm irritated skin.\n• Lightweight formula for all skin types.\n• Apply a few drops and massage until fully absorbed.",
    imageUrls: [
      "https://www.rohe.ee/media/rohegroup/.product-image/large/product/Tibrette/Feel%20Free/Rahustav%20seerum%20kanepi.jpg",
    ],
  },
  {
    barcode: "8437017753162",
    slug: "feel-free-repairing-hand-cream-75ml",
    sku: "FFL-753162",
    price: 9000,
    originalPrice: 10000,
    categoryId: CARE,
    subcategoryId: HANDS,
    nameAr: "فيل فري - كريم يدين مُرمّم ومرطّب 75 مل",
    nameEn: "Feel Free Repairing Hand Cream 75ml",
    descriptionAr:
      "كريم يدين مُ repairing من فيل فري — يرمّم اليدين الجافة والمتشققة ويتركهما ناعمتين.\n\n" +
      "• زيت اللوز الحلو ومستخلص البرتقal لترطيب عميق.\n• البابونج للتهدئة — مثالي لليدين الجافة جداً.\n• فيتامين E والصبار لحماية ونعومة.\n• قوام خفيف سريع الامتصاص.\n• يُدلّk على اليدين حسب الحاجة، خاصة بعد الغسيل.",
    descriptionEn:
      "Feel Free Repairing Hand Cream repairs and revitalises dry or cracked hands with natural oils.\n\n" +
      "• Sweet almond oil and orange extract for deep hydration.\n• Chamomile soothes very dry or irritated hands.\n• Vitamin E and aloe protect and soften skin.\n• Lightweight, fast-absorbing texture.\n• Massage into hands as often as needed, especially after washing.",
    imageUrls: [`${IMG}/2024/10/Clasica_crema_manos.webp`],
  },
  {
    barcode: "8437017753452",
    slug: "feel-free-mineral-clay-mask-85ml",
    sku: "FFL-753452",
    price: 11000,
    originalPrice: 12500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MASKS,
    nameAr: "فيل فري - ماسك الطين المعدني Mineral Clay للوجه 85 مل",
    nameEn: "Feel Free Mineral Clay Mask 85ml",
    descriptionAr:
      "ماسك الطين المعدني Mineral Clay من فيل فري — ينظّف المسام ويوحّد لون البشرة.\n\n" +
      "• طين معدني (Bentonite + Kaolin) لتنظيف وتنعيم ملمس البشرة.\n• مستخلصات الكاكao والعرقسوس لإشراق وتفتيح.\n• زيت Cyperus Esculentus (Tigernut) لترطيب عميق.\n• مناسب للبشرة الحساسة والناضجة.\n• يُطبّق طبقة رقيقة، يُترك 7–10 دقائق ثم يُشطف.",
    descriptionEn:
      "Feel Free Mineral Clay Mask revitalises, refines texture and protects skin with mineral clay and botanical extracts.\n\n" +
      "• Bentonite and kaolin clay cleanse and refine pores.\n• Cocoa and licorice extracts even tone and add radiance.\n• Tigernut oil deeply moisturises the skin.\n• Suitable for sensitive and mature skin.\n• Apply a thin layer, leave 7–10 minutes and rinse with warm water.",
    imageUrls: [`${IMG}/2024/10/image.png`],
  },
  {
    barcode: "8437017753407",
    slug: "feel-free-biphasic-eye-makeup-remover-100ml",
    sku: "FFL-753407",
    price: 9500,
    originalPrice: 11000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "فيل فري - مزيل مكياج العين ثنائي الطور 100 مل",
    nameEn: "Feel Free Biphasic Eye Makeup Remover 100ml",
    descriptionAr:
      "مزيل مكياج العين ثنائي الطور من فيل فري — يزيل المكياج المقاوم بلطف دون تهيّج.\n\n" +
      "• تركيبة ثنائية الطور (زيت + ماء) لل mascara والآيلiner الثابت.\n• زيت Jojoba وزيت الورد للترطيب والعناية.\n• ماء اللavender والصبار لتهدئة محيط العين.\n• مناسب للبشرة الحساسة — لا يحتاج شطفاً.\n• رجّي الزجاجة ثم استخدمي قطنة على العينين والشفاه.",
    descriptionEn:
      "Feel Free Biphasic Eye Makeup Remover effectively removes even waterproof eye and lip makeup without irritation.\n\n" +
      "• Dual-phase oil-and-water formula for stubborn makeup.\n• Jojoba and rosehip oils hydrate the delicate eye area.\n• Lavender water and aloe soothe sensitive skin.\n• No rinsing required — shake well before use.\n• Apply with a cotton pad on eyes and lips.",
    imageUrls: [`${IMG}/2024/10/Clasica_Desmaquillante.webp`],
  },
  {
    barcode: "8437017753148",
    slug: "feel-free-refreshing-facial-toner-200ml",
    sku: "FFL-753148",
    price: 9500,
    originalPrice: 11000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "فيل فري - تونر الوجه المنعش Refreshing 200 مل",
    nameEn: "Feel Free Refreshing Facial Toner 200ml",
    descriptionAr:
      "تونر الوجه المنعش Refreshing من فيل فري — ينشّط البشرة ويوازن pH بعد التنظيف.\n\n" +
      "• مستخلص الليمون والزعتر والبابونج لإنعاش فوري.\n• يحفّز تجديد الخلاia وتركيب الكولاجين.\n• البابونج يهدّئ البشرة الحساسة.\n• مناسب لجميع أنواع البشرة بما فيها الناضجة.\n• يُطبّق بقطنة على الوجه بعد الغسول صباحاً ومساءً.",
    descriptionEn:
      "Feel Free Refreshing Facial Toner revitalises, hydrates and tones skin after cleansing.\n\n" +
      "• Lemon, thyme and chamomile extracts for instant freshness.\n• Stimulates cell renewal and collagen synthesis.\n• Chamomile calms sensitive and mature skin.\n• Suitable for all skin types.\n• Apply with a cotton pad morning and evening after cleansing.",
    imageUrls: [`${IMG}/2024/10/Clasicas_Refreshing_Facial_toner.webp`],
  },
  {
    barcode: "8437017753384",
    slug: "feel-free-hydro-comfort-micellar-water-200ml",
    sku: "FFL-753384",
    price: 9500,
    originalPrice: 11000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "فيل فري - ماء ميسيلار Hydro Comfort للوجه 200 مل",
    nameEn: "Feel Free Hydro Comfort Micellar Water 200ml",
    descriptionAr:
      "ماء ميسيلار Hydro Comfort من فيل فري — ينظّف ويزيل المكياج ويرطّب في خطوة واحدة.\n\n" +
      "• مicelles لإزالة الشوائب والمكياج بلطف دون شطف.\n• مستخلص الليمون والتفاح والمرmary لإشراق وتقوية.\n• الصبار لترطيب البشرة أثناء التنظيف.\n• مناسب لجميع أنواع البشرة بما فيها الحساسة.\n• يُطبّق بقطنة على الوجه والعينين والشفاه.",
    descriptionEn:
      "Feel Free Hydro Comfort Micellar Water cleanses, removes makeup and hydrates in one step.\n\n" +
      "• Micelles lift impurities and makeup without rinsing.\n• Lemon, apple and sage extracts revitalise the skin.\n• Aloe vera maintains moisture during cleansing.\n• Suitable for all skin types including sensitive.\n• Apply with a cotton pad on face, eyes and lips.",
    imageUrls: [`${IMG}/2024/10/Hydro_confort_Micellar_water.webp`],
  },
  {
    barcode: "8437017753155",
    slug: "feel-free-cleansing-facial-milk-200ml",
    sku: "FFL-753155",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "فيل فري - حليب تنظيف الوجه Cleansing Facial Milk 200 مل",
    nameEn: "Feel Free Cleansing Facial Milk 200ml",
    descriptionAr:
      "حليب تنظيف الوجه Cleansing Facial Milk من فيل فري — ينظّف بلطف ويرطّب البشرة الجافة والحساسة.\n\n" +
      "• زيت Jojoba والزيتون والسمسم لإزالة المكياج وترطيب.\n• البابونج العضوي لتهدئة البشرة الحsاسة.\n• المرmary والليمون كمضادات أكسدة طبيعية.\n• مناسب للبشرة الجافة والناضجة.\n• يُدلّk على وجه رطب ثم يُزال بقطنة أو يُشطف.",
    descriptionEn:
      "Feel Free Cleansing Facial Milk deeply cleanses, hydrates and balances skin with natural oils.\n\n" +
      "• Jojoba, olive and sesame oils remove makeup and moisturise.\n• Organic chamomile soothes sensitive skin.\n• Sage and lemon provide natural antioxidant care.\n• Suitable for dry, sensitive and mature skin.\n• Massage onto damp face, remove with cotton pad or rinse.",
    imageUrls: [`${IMG}/2024/10/Clasica_Leche_Facial.webp`],
  },
  {
    barcode: "8437017753391",
    slug: "feel-free-purifying-gel-cleanser-200ml",
    sku: "FFL-753391",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "فيل فري - غسول جل Purifying لتنظيف عميق 200 مل",
    nameEn: "Feel Free Purifying Gel Cleanser 200ml",
    descriptionAr:
      "غسول جل Purifying من فيل فري — ينظّف عميقاً دون جفاف البشرة.\n\n" +
      "• عوامل تنظيف لطيفة من جوز الهند.\n• Centella Asiatica وGinkgo Biloba لترطيب وتجديد الخلاia.\n• الزعتر والليمون لموازنة الدهون.\n• يترك البشرة منعشة ومريحة.\n• يُستخدم صباحاً ومساءً على بشرة رطبة ثم يُشطف.",
    descriptionEn:
      "Feel Free Purifying Gel Cleanser deeply cleanses without drying the skin.\n\n" +
      "• Gentle coconut-derived cleansing agents.\n• Centella asiatica and ginkgo biloba hydrate and regenerate.\n• Thyme and lemon help balance excess oil.\n• Leaves skin fresh, balanced and comfortable.\n• Use morning and evening on damp skin, then rinse.",
    imageUrls: [`${IMG}/2025/03/Gel_Limpiador.webp`],
  },
  {
    barcode: "8437017753193",
    slug: "feel-free-foaming-facial-cleanser-150ml",
    sku: "FFL-753193",
    price: 9500,
    originalPrice: 11000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "فيل فري - غسول وجه رغوي Foaming Facial Cleanser 150 مل",
    nameEn: "Feel Free Foaming Facial Cleanser 150ml",
    descriptionAr:
      "غسول الوجه الرغوي Foaming من فيل فري — ينظّف بلطف وينعّش البشرة يومياً.\n\n" +
      "• مستخلص التفاح للحفاظ على ترطيب البشرة.\n• الليمون ينظّف ويتحكّm بالإفرازات الدهنية.\n• العرقسوس يمنع الأكسدة وعلامات التقدّم.\n• رغوة ناعمة مناسبة لجميع أنواع البشرة.\n• يُطبّق على وجه رطب، يُدلّk ثم يُشطف بالماء.",
    descriptionEn:
      "Feel Free Foaming Facial Cleanser gently removes impurities and revitalises the skin.\n\n" +
      "• Apple extract maintains skin hydration.\n• Lemon cleanses and helps control excess sebum.\n• Licorice helps prevent oxidation and aging signs.\n• Soft foam suitable for all skin types.\n• Apply to damp face, massage and rinse with water.",
    imageUrls: [`${IMG}/2024/10/Clasica_espuma_limpiadora.webp`],
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
    brandAr: "فيل فري",
    brandEn: "Feel Free",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Feel Free brand");
  console.log(`Brand: Feel Free (${brandId})${resolved.created ? " [created]" : ""}\n`);
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
