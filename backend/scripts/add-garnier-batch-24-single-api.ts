/**
 * Garnier — 24 separate single-SKU hair products (no shades).
 * Source: retailer pages + Open Beauty Facts + official Garnier media
 * Usage: npx tsx scripts/add-garnier-batch-24-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const OIL_MASKS = "ab7c66e4-4df6-474f-b9d2-dd059dd60bfc";
const HAIR_TREATMENT = "ee39d6a6-5074-43b6-a80c-a7c1b23c3bd1";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice: number;
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
    barcode: "3600542265645",
    slug: "garnier-botanic-therapy-castor-oil-hair-milk-mask-250ml",
    sku: "GRN-BTCM-265645",
    price: 8750,
    originalPrice: 9750,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "غارنييه بوتانيك ثيرابي - قناع حليب شعر بزيت الخروع المقوي 250 مل",
    nameEn: "Garnier Botanic Therapy Fortifying Castor Oil Hair Milk Mask 250ml",
    descriptionAr:
      "قناع حليب شعر بوتانيك ثيرابي من غارنييه — تركيبة مغذية بزيت الخروع وحليب اللوز والعسل لتقوية الشعر التالف والضعيف.\n\n" +
      "• يغذّي الشعر بعمق ويقلّل التقصف والتكسر.\n" +
      "• زيت الخروع يقوّي الجذور ويحفّز على نمو أقوى.\n" +
      "• حليب اللوز والعسل ينعّمان ويلمّعان الخصلات.\n" +
      "• قناع حليب خفيف الوزن — سهل التوزيع والشطف.\n" +
      "• مناسب للشعر الجاف والمتضرر والمتقصف.",
    descriptionEn:
      "Garnier Botanic Therapy Fortifying Castor Oil Hair Milk Mask — nourishing mask with castor oil, almond milk and honey for damaged, fragile hair.\n\n" +
      "• Deeply nourishes and helps reduce breakage.\n" +
      "• Castor oil strengthens roots and supports healthier growth.\n" +
      "• Almond milk and honey soften and add shine.\n" +
      "• Lightweight milk-mask texture — easy to apply and rinse.\n" +
      "• Ideal for dry, damaged and brittle hair.",
    imageUrls: ["https://public.cosmetify.com/images/products/5126310.webp"],
  },
  {
    barcode: "3600541510531",
    slug: "garnier-ultra-doux-honey-treasures-repairing-shampoo-400ml",
    sku: "GRN-UDHT-510531",
    price: 4000,
    originalPrice: 4500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو كنوز العسل - شامبو إصلاحي للشعر التالف والضعيف 400 مل",
    nameEn: "Garnier Ultra Doux Honey Treasures Repairing Shampoo 400ml",
    descriptionAr:
      "شامبو ألترا دو كنوز العسل من غارنييه — وصفة إصلاحية بالعسل والغذاء الملكي والبروبوليس للشعر التالف والضعيف.\n\n" +
      "• يغذّي الشعر ويحميه ويصلّح الأطراف المتقصفة.\n" +
      "• الغذاء الملكي يقوّي الشعر من الجذور.\n" +
      "• البروبوليس يحمي الألياف من التلف اليومي.\n" +
      "• العسل ينعّم ويلمّع الخصلات.\n" +
      "• خالٍ من السيليكون — مناسب للاستخدام اليومي.",
    descriptionEn:
      "Garnier Ultra Doux Honey Treasures Repairing Shampoo — repairing formula with honey, royal jelly and propolis for fragile, damaged hair.\n\n" +
      "• Nourishes, protects and helps repair split ends.\n" +
      "• Royal jelly strengthens hair from the roots.\n" +
      "• Propolis helps protect fibres from daily damage.\n" +
      "• Honey softens and adds shine.\n" +
      "• Silicone-free — suitable for daily use.",
    imageUrls: [
      "https://d1aq4ubbxe020v.cloudfront.net/image/product/14277/45794900_1759655498_6d1d23966aca9291e92ad08573203e73.png",
      "https://images.openbeautyfacts.org/images/products/360/054/151/0531/1.400.jpg",
    ],
  },
  {
    barcode: "3610340668913",
    slug: "garnier-ultra-doux-honey-treasures-repairing-conditioner-360ml",
    sku: "GRN-UDHT-668913",
    price: 5000,
    originalPrice: 5500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو كنوز العسل - بلسم إصلاحي للشعر التالف 360 مل",
    nameEn: "Garnier Ultra Doux Honey Treasures Repairing Conditioner 360ml",
    descriptionAr:
      "بلسم ألترا دو كنوز العسل من غارنييه — يكمّل روتين الإصلاح بالعسل والغذاء الملكي والبروبوليس.\n\n" +
      "• يسهّل التمشيط ويقلّل التشابك بعد الشامبو.\n" +
      "• يغذّي الألياف ويصلّح التلف الظاهري.\n" +
      "• يترك الشعر أنعم وأقوى وأكثر لمعاناً.\n" +
      "• مكمّل مثالي لشامبو كنوز العسل من نفس السلسلة.\n" +
      "• خالٍ من السيليكون.",
    descriptionEn:
      "Garnier Ultra Doux Honey Treasures Repairing Conditioner — completes the repair routine with honey, royal jelly and propolis.\n\n" +
      "• Detangles and smooths after shampooing.\n" +
      "• Nourishes fibres and helps repair visible damage.\n" +
      "• Leaves hair softer, stronger and shinier.\n" +
      "• Perfect partner to Honey Treasures Shampoo.\n" +
      "• Silicone-free.",
    imageUrls: [
      "https://cdn.salla.sa/RrKRy/0a802b02-e563-463e-ab3c-0764591f5e0b-500x500-yugVBngMpqKJGPZTS2fgYFlh6DrWpklsXaN66JS1.jpg",
    ],
  },
  {
    barcode: "3600542267205",
    slug: "garnier-ultra-doux-honey-treasures-leave-in-cream-200ml",
    sku: "GRN-UDHT-267205",
    price: 7000,
    originalPrice: 7750,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "غارنييه ألترا دو كنوز العسل - كريم بلسم بدون شطف للشعر التالف 200 مل",
    nameEn: "Garnier Ultra Doux Honey Treasures Leave-In Cream 200ml",
    descriptionAr:
      "كريم بلسم بدون شطف ألترا دو كنوز العسل من غارنييه — عناية مستمرة بالعسل والغذاء الملكي والبروبوليس.\n\n" +
      "• يغذّي ويحمي الشعر طوال اليوم دون شطف.\n" +
      "• يسهّل التصفيف ويقلّل الهيشان والتقصف.\n" +
      "• يترك الشعر ناعماً ولامعاً وأسهل في التمشيط.\n" +
      "• مناسب للشعر التالف والضعيف والمتقصف.\n" +
      "• يُطبَّق على الشعر المبلل أو الجاف.",
    descriptionEn:
      "Garnier Ultra Doux Honey Treasures Leave-In Cream — continuous care with honey, royal jelly and propolis, no rinse.\n\n" +
      "• Nourishes and protects all day without rinsing.\n" +
      "• Eases styling and helps reduce frizz and breakage.\n" +
      "• Leaves hair soft, shiny and manageable.\n" +
      "• Ideal for damaged, fragile and brittle hair.\n" +
      "• Apply to damp or dry hair.",
    imageUrls: [
      "https://m.media-amazon.com/images/I/51Ta7xGQZ4L._AC_SL1500_.jpg",
      "https://images.openbeautyfacts.org/images/products/360/054/226/7205/1.400.jpg",
    ],
  },
  {
    barcode: "3600542499149",
    slug: "garnier-ultra-doux-avocado-shea-nourishing-shampoo-1000ml",
    sku: "GRN-UDAS-499149",
    price: 7750,
    originalPrice: 8500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو - شامبو مغذي بزيت الأفوكادو وزبدة الشيا 1 لتر",
    nameEn: "Garnier Ultra Doux Avocado Oil & Shea Butter Nourishing Shampoo 1000ml",
    descriptionAr:
      "شامبو ألترا دو بزيت الأفوكادو وزبدة الشيا من غارنييه — حجم عائلي 1 لتر للشعر الجاف جداً والمجعد.\n\n" +
      "• يغذّي بعمق من الجذور حتى الأطراف.\n" +
      "• زيت الأفوكادو ينعّم وزبدة الشيا تغذّي الألياف.\n" +
      "• يقلّل الهيشان ويترك الشعر لامعاً وناعماً.\n" +
      "• خالٍ من البارابين والسيليكون.\n" +
      "• حجم اقتصادي مناسب للعائلة.",
    descriptionEn:
      "Garnier Ultra Doux Avocado Oil & Shea Butter Nourishing Shampoo 1000ml — family size for very dry or frizzy hair.\n\n" +
      "• Deeply nourishes from roots to tips.\n" +
      "• Avocado oil softens, shea butter nourishes fibres.\n" +
      "• Reduces frizz for shiny, smooth hair.\n" +
      "• Paraben and silicone free.\n" +
      "• Economical 1 litre family size.",
    imageUrls: [
      "https://media.zid.store/thumbs/0cd60bb9-2c75-403f-b4b2-53e643da1ba9/37f167e9-c79c-4893-9411-c2d5f489ea0f-thumbnail-1000x1000-70.webp",
    ],
  },
  {
    barcode: "3600542499194",
    slug: "garnier-ultra-doux-honey-treasures-repairing-shampoo-1000ml",
    sku: "GRN-UDHT-499194",
    price: 7750,
    originalPrice: 8500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو كنوز العسل - شامبو إصلاحي للشعر التالف 1 لتر",
    nameEn: "Garnier Ultra Doux Honey Treasures Repairing Shampoo 1000ml",
    descriptionAr:
      "شامبو ألترا دو كنوز العسل من غارنييه بحجم 1 لتر — إصلاح وتغذية للشعر التالف والضعيف.\n\n" +
      "• وصفة بالعسل والغذاء الملكي والبروبوليس.\n" +
      "• يقوّي الشعر ويصلّح الأطراف المتقصفة.\n" +
      "• يغذّي الألياف ويحميها من التلف اليومي.\n" +
      "• حجم عائلي اقتصادي.\n" +
      "• خالٍ من السيليكون.",
    descriptionEn:
      "Garnier Ultra Doux Honey Treasures Repairing Shampoo 1000ml — family size repair for damaged, fragile hair.\n\n" +
      "• Honey, royal jelly and propolis formula.\n" +
      "• Strengthens hair and helps repair split ends.\n" +
      "• Nourishes and protects fibres from daily damage.\n" +
      "• Economical 1 litre family size.\n" +
      "• Silicone-free.",
    imageUrls: [
      "https://ecombe.nahdionline.com/media/catalog/product/u/l/ultra-doux-honey-treasures-shampoo-1000ml-0jjpg.jpg",
    ],
  },
  {
    barcode: "3600542639026",
    slug: "garnier-fructis-keratin-sleek-mask-370ml",
    sku: "GRN-FRKS-639026",
    price: 13500,
    originalPrice: 15000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "غارنييه فروكتيس كيراتين سليك - ماسك تنعيم بالكيراتين وزيت الأرغان 370 مل",
    nameEn: "Garnier Fructis Keratin Sleek Mask 370ml",
    descriptionAr:
      "ماسك كيراتين سليك من غارنييه فروكتيس — تنعيم عميق للشعر المجعد والجاف والمعرّض للهيشان.\n\n" +
      "• كيراتين نباتي وزيت أرغان لتنعيم الألياف.\n" +
      "• يقلّل الهيشان ويمنح لمعاناً حريرياً.\n" +
      "• يغذّي الشعر بعمق ويسهّل التصفيف.\n" +
      "• يُترك 3–5 دقائق ثم يُشطف.\n" +
      "• مثالي للشعر المجعد والويفي والجاف.",
    descriptionEn:
      "Garnier Fructis Keratin Sleek Mask — deep smoothing for frizzy, dry and unruly hair.\n\n" +
      "• Plant keratin and argan oil smooth fibres.\n" +
      "• Reduces frizz for silky shine.\n" +
      "• Deeply nourishes and eases styling.\n" +
      "• Leave on 3–5 minutes, then rinse.\n" +
      "• Ideal for curly, wavy and dry hair.",
    imageUrls: [
      "https://beautyfree.gr/76609-large_default/garnier-fructis-keratin-sleek-mask-370ml.jpg",
      "https://trendscyprus.com/wp-content/uploads/2025/05/3600542639026.jpg",
    ],
  },
  {
    barcode: "3600542225373",
    slug: "garnier-fructis-goodbye-damage-10in1-leave-in-cream-400ml",
    sku: "GRN-FRGD-225373",
    price: 9000,
    originalPrice: 10000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "غارنييه فروكتيس وداعاً للتلف - كريم بلسم 10 في 1 بدون شطف 400 مل",
    nameEn: "Garnier Fructis Goodbye Damage 10-in-1 Leave-In Cream 400ml",
    descriptionAr:
      "كريم بلسم وداعاً للتلف 10 في 1 من غارنييه فروكتيس — عناية شاملة بدون شطف للشعر المتضرر.\n\n" +
      "• 10 فوائد: تغذية، لمعان، حماية حرارية، تمشيط، تقليل تقصف وأكثر.\n" +
      "• بزيت الأملا والكيراتين النباتي لإصلاح التلف.\n" +
      "• فيتامينات B3 و B6 لتقوية الألياف.\n" +
      "• يحمي من الحرارة حتى 230°م.\n" +
      "• يُطبَّق على الشعر المبلل أو الجاف — بدون شطف.",
    descriptionEn:
      "Garnier Fructis Goodbye Damage 10-in-1 Leave-In Cream — all-in-one no-rinse care for damaged hair.\n\n" +
      "• 10 benefits: nourishment, shine, heat protection, detangling, anti-breakage and more.\n" +
      "• Amla oil and plant keratin help repair damage.\n" +
      "• Vitamins B3 and B6 strengthen fibres.\n" +
      "• Heat protection up to 230°C.\n" +
      "• Apply to damp or dry hair — no rinse.",
    imageUrls: [
      "https://cdn.wasserman.eu/generated/images/s960/1197927/garnier-fructis-goodbye-damage-hair-cream-10in1-400ml",
      "https://images.openbeautyfacts.org/images/products/360/054/222/5373/1.400.jpg",
    ],
  },
  {
    barcode: "3600542202244",
    slug: "garnier-fructis-hydra-ricci-air-dry-cream-400ml",
    sku: "GRN-FRHR-202244",
    price: 9750,
    originalPrice: 10750,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "غارنييه فروكتيس هيدرا ريتشي - كريم تجفيف طبيعي للشعر المموج والمجعد 400 مل",
    nameEn: "Garnier Fructis Hydra Ricci Air Dry Cream 400ml",
    descriptionAr:
      "كريم هيدرا ريتشي للتجفيف الطبيعي من غارنييه فروكتيس — يعرّف التموجات والمجعد بدون سشوار.\n\n" +
      "• زيت الفستق وبكتين الفاكهة لتغذية وتعريف التموجات.\n" +
      "• يمنح تموجات ومجعدات محددة ومرطبة.\n" +
      "• بدون شطف — يُطبَّق على الشعر المبلل ويُترك يجف طبيعياً.\n" +
      "• يقلّل الهيشان ولا يثقل الشعر.\n" +
      "• مثالي للشعر المموج والمجعد.",
    descriptionEn:
      "Garnier Fructis Hydra Ricci Air Dry Cream — defines waves and curls without a hair dryer.\n\n" +
      "• Pistachio oil and fruit pectin nourish and define curls.\n" +
      "• Gives defined, hydrated waves and curls.\n" +
      "• No rinse — apply to damp hair and air dry.\n" +
      "• Reduces frizz without weighing hair down.\n" +
      "• Ideal for wavy and curly hair.",
    imageUrls: ["https://images.openbeautyfacts.org/images/products/360/054/220/2244/1.400.jpg"],
  },
  {
    barcode: "3600542408264",
    slug: "garnier-fructis-grow-strong-10in1-niacinamide-leave-in-400ml",
    sku: "GRN-FRGS-408264",
    price: 9000,
    originalPrice: 10000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "غارنييه فروكتيس القوة والنمو - كريم بلسم 10 في 1 بالنياسيناميد 400 مل",
    nameEn: "Garnier Fructis Grow Strong 10-in-1 Niacinamide Leave-In 400ml",
    descriptionAr:
      "كريم بلسم القوة والنمو 10 في 1 من غارنييه فروكتيس — تقوية شاملة بالنياسيناميد وخلاصة التفاح.\n\n" +
      "• 10 فوائد: تقوية، لمعان، حماية حرارية، تمشيط، تقليل التقصف.\n" +
      "• النياسيناميد وخلاصة التفاح يقوّيان الألياف من الجذور.\n" +
      "• يقلّل التقصف ويحمي من الحرارة حتى 230°م.\n" +
      "• خالٍ من البارابين والفثالات.\n" +
      "• يُطبَّق بدون شطف على الشعر المبلل أو الجاف.",
    descriptionEn:
      "Garnier Fructis Grow Strong 10-in-1 Niacinamide Leave-In — all-in-one strengthening with niacinamide and apple extract.\n\n" +
      "• 10 benefits: strength, shine, heat protection, detangling, anti-breakage.\n" +
      "• Niacinamide and apple extract fortify fibres from root to tip.\n" +
      "• Reduces breakage, heat protection up to 230°C.\n" +
      "• No parabens or phthalates.\n" +
      "• No rinse — apply to damp or dry hair.",
    imageUrls: [
      "https://cdn.wasserman.eu/generated/images/s960/1203549/fructis-grow-strong-hair-cream-conditioner-10in1-without-rinsing-400ml",
    ],
  },
  {
    barcode: "3600542638937",
    slug: "garnier-fructis-keratin-sleek-shampoo-200ml",
    sku: "GRN-FRKS-638937",
    price: 13500,
    originalPrice: 15000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه فروكتيس كيراتين سليك - شامبو تنعيم بالكيراتين وزيت الأرغان 200 مل",
    nameEn: "Garnier Fructis Keratin Sleek Shampoo 200ml",
    descriptionAr:
      "شامبو كيراتين سليك من غارنييه فروكتيس — تنظيف لطيف مع تنعيم للشعر المجعد والجاف.\n\n" +
      "• كيراتين نباتي وزيت أرغان لتنعيم الألياف.\n" +
      "• ينظّف بلطف دون تجفيف الشعر.\n" +
      "• يقلّل الهيشان ويمنح لمعاناً.\n" +
      "• مكمّل مثالي لماسك وبلسم كيراتين سليك.\n" +
      "• حجم 200 مل — مثالي للسفر.",
    descriptionEn:
      "Garnier Fructis Keratin Sleek Shampoo — gentle cleanse with smoothing for frizzy, dry hair.\n\n" +
      "• Plant keratin and argan oil smooth fibres.\n" +
      "• Cleanses gently without stripping moisture.\n" +
      "• Reduces frizz and adds shine.\n" +
      "• Perfect partner to Keratin Sleek Mask and Conditioner.\n" +
      "• 200ml travel-friendly size.",
    imageUrls: [
      "https://www.garnier.co.uk/-/media/project/loreal/brand-sites/garnier/emea/uk/en-gb/prd-haircare/keratin-sleek/shampoo/shampoo.png",
      "https://trendscyprus.com/wp-content/uploads/2025/05/3600542638937.jpg",
    ],
  },
  {
    barcode: "3600542639118",
    slug: "garnier-fructis-keratin-sleek-conditioner-200ml",
    sku: "GRN-FRKS-639118",
    price: 13500,
    originalPrice: 15000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه فروكتيس كيراتين سليك - بلسم تنعيم بالكيراتين وزيت الأرغان 200 مل",
    nameEn: "Garnier Fructis Keratin Sleek Conditioner 200ml",
    descriptionAr:
      "بلسم كيراتين سليك من غارنييه فروكتيس — تنعيم وتغذية للشعر المجعد والجاف.\n\n" +
      "• كيراتين نباتي وزيت أرغان ينعّمان الألياف.\n" +
      "• يسهّل التمشيط ويقلّل الهيشان.\n" +
      "• يترك الشعر ناعماً ولامعاً وأسهل في التصفيف.\n" +
      "• مكمّل لشامبو وماسك كيراتين سليك.\n" +
      "• حجم 200 مل.",
    descriptionEn:
      "Garnier Fructis Keratin Sleek Conditioner — smoothing nourishment for frizzy, dry hair.\n\n" +
      "• Plant keratin and argan oil smooth fibres.\n" +
      "• Detangles and reduces frizz.\n" +
      "• Leaves hair soft, shiny and easy to style.\n" +
      "• Pairs with Keratin Sleek Shampoo and Mask.\n" +
      "• 200ml size.",
    imageUrls: [
      "https://www.garnier.co.uk/-/media/project/loreal/brand-sites/garnier/emea/uk/en-gb/prd-haircare/keratin-sleek/conditioner/conditioner.png",
    ],
  },
  {
    barcode: "3600542444705",
    slug: "garnier-fructis-vitamins-strength-anti-hair-fall-serum-125ml",
    sku: "GRN-FRVS-444705",
    price: 12250,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "غارنييه فروكتيس فيتامين وقوة - سيروم مضاد لتساقط الشعر 125 مل",
    nameEn: "Garnier Fructis Vitamins & Strength Anti-Hair Fall Serum 125ml",
    descriptionAr:
      "سيروم فيتامين وقوة مضاد لتساقط الشعر من غارنييه فروكتيس — علاج مكثّف للشعر الضعيف.\n\n" +
      "• فيتامين سي والبيوتين وخلاصة الجريب فروت.\n" +
      "• يقوّي الجذور ويقلّل التساقط مع الاستخدام المنتظم.\n" +
      "• يغذّي فروة الرأس ويحفّز على نمو أقوى.\n" +
      "• قوام خفيف سريع الامتصاص — لا يثقل الشعر.\n" +
      "• يُطبَّق على فروة الرأس والشعر يومياً أو عند الحاجة.",
    descriptionEn:
      "Garnier Fructis Vitamins & Strength Anti-Hair Fall Serum — intensive treatment for weak, thinning hair.\n\n" +
      "• Vitamin C, biotin and grapefruit extract.\n" +
      "• Strengthens roots and helps reduce hair fall with regular use.\n" +
      "• Nourishes the scalp for stronger growth.\n" +
      "• Lightweight, fast-absorbing — no weigh down.\n" +
      "• Apply to scalp and hair daily or as needed.",
    imageUrls: [
      "https://cdn.cocopanda.se/Media/Product/Image/300/d806a674-df71-4b11-811f-a138e08a7810_4.jpeg",
    ],
  },
  {
    barcode: "3600541970816",
    slug: "garnier-fructis-fresh-strengthening-shampoo-400ml",
    sku: "GRN-FRFS-970816",
    price: 7750,
    originalPrice: 8500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه فروكتيس فرش - شامبو تقوية وتنشيط للشعر الدهني والعادي 400 مل",
    nameEn: "Garnier Fructis Fresh Strengthening Shampoo 400ml",
    descriptionAr:
      "شامبو فرش المقوي من غارنييه فروكتيس — تنظيف وتقوية للشعر الدهني والعادي بسرعة.\n\n" +
      "• خلاصة الخيار وفيتامينات B3 و B6.\n" +
      "• ينظّف فروة الرأس ويقلّل الدهون الزائدة.\n" +
      "• يمنح إحساساً بالانتعاش والنظافة لفترة أطول.\n" +
      "• يقوّي الألياف ويترك الشعر صحياً ولامعاً.\n" +
      "• خالٍ من البارابين — مناسب للاستخدام اليومي.",
    descriptionEn:
      "Garnier Fructis Fresh Strengthening Shampoo — cleanse and strengthen for normal to oily hair.\n\n" +
      "• Cucumber extract plus vitamins B3 and B6.\n" +
      "• Cleanses scalp and helps reduce excess sebum.\n" +
      "• Keeps hair feeling fresh and clean for longer.\n" +
      "• Strengthens fibres for healthy-looking shine.\n" +
      "• Paraben-free — suitable for daily use.",
    imageUrls: ["https://m.media-amazon.com/images/I/71rYbd1PKIL._AC_SL1500_.jpg"],
  },
  {
    barcode: "3600541970861",
    slug: "garnier-fructis-cucumber-fresh-shampoo-400ml",
    sku: "GRN-FRCF-970861",
    price: 6250,
    originalPrice: 7000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه فروكتيس منعش الخيار - شامبو تنقية للشعر الدهني 400 مل",
    nameEn: "Garnier Fructis Cucumber Fresh Shampoo 400ml",
    descriptionAr:
      "شامبو منعش الخيار من غارنييه فروكتيس — تنقية عميقة للشعر الدهني بسرعة.\n\n" +
      "• ماء الخيار وحمض الساليسيليك لتنظيف عميق.\n" +
      "• يزيل الدهون الزائدة ويبقّي الشعر نظيفاً لفترة أطول.\n" +
      "• يمنح إحساساً بالانتعاش والخفة.\n" +
      "• يقوّي الألياف دون تجفيف مفرط.\n" +
      "• خالٍ من السيليكون — مناسب للشعر الدهني.",
    descriptionEn:
      "Garnier Fructis Cucumber Fresh Shampoo — deep purifying care for oily hair.\n\n" +
      "• Cucumber water and salicylic acid for deep cleansing.\n" +
      "• Removes excess sebum, keeps hair cleaner for longer.\n" +
      "• Fresh, lightweight feel after every wash.\n" +
      "• Strengthens fibres without over-drying.\n" +
      "• Silicone-free — ideal for oily hair.",
    imageUrls: ["https://beautyfree.gr/55760-large_default/garnier-fructis-cucumber-fresh-400ml.jpg"],
  },
  {
    barcode: "3600542061193",
    slug: "garnier-fructis-strength-shine-2in1-shampoo-400ml",
    sku: "GRN-FRSS-061193",
    price: 7750,
    originalPrice: 8500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه فروكتيس القوة واللمعان - شامبو 2 في 1 تقوية ولمعان 400 مل",
    nameEn: "Garnier Fructis Strength & Shine 2-in-1 Shampoo 400ml",
    descriptionAr:
      "شامبو القوة واللمعان 2 في 1 من غارنييه فروكتيس — تنظيف وتغذية للشعر العادي الباهت.\n\n" +
      "• خلاصة الجريب فروت وفيتامينات B3 و B6 والنياسيناميد.\n" +
      "• يعيد القوة والطاقة للشعر الباهت.\n" +
      "• يمنح لمعاناً طبيعياً و3 أضعاف التألق.\n" +
      "• صيغة 2 في 1 — شامبو وبلسم في خطوة واحدة.\n" +
      "• خالٍ من السيليكون والبارابين.",
    descriptionEn:
      "Garnier Fructis Strength & Shine 2-in-1 Shampoo — cleanse and nourish for dull, normal hair.\n\n" +
      "• Grapefruit extract, vitamins B3 and B6, niacinamide.\n" +
      "• Restores strength and energy to dull hair.\n" +
      "• Natural shine — up to 3x more brilliance.\n" +
      "• 2-in-1 shampoo and conditioner in one step.\n" +
      "• Silicone and paraben free.",
    imageUrls: ["https://m.media-amazon.com/images/I/71cObNf7fJL._AC_SL1500_.jpg"],
  },
  {
    barcode: "3600542061278",
    slug: "garnier-fructis-anti-dandruff-2in1-shampoo-400ml",
    sku: "GRN-FRAD-061278",
    price: 7750,
    originalPrice: 8500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه فروكتيس مضاد للقشرة - شامبو 2 في 1 تقوية ومضاد قشرة 400 مل",
    nameEn: "Garnier Fructis Anti-Dandruff 2-in-1 Fortifying Shampoo 400ml",
    descriptionAr:
      "شامبو مضاد للقشرة 2 في 1 من غارنييه فروكتيس — يقضي على القشرة ويقوّي الشعر.\n\n" +
      "• بيروكتون أولامين وخلاصة الشاي الأخضر.\n" +
      "• يزيل علامات القشرة المرئية من أول الاستخدام.\n" +
      "• يهدئ فروة الرأس ويقلّل الحكة.\n" +
      "• فيتامينات B3 و B6 لتقوية الألياف.\n" +
      "• صيغة 2 في 1 — تنظيف وتغذية معاً.",
    descriptionEn:
      "Garnier Fructis Anti-Dandruff 2-in-1 Fortifying Shampoo — fights dandruff while strengthening hair.\n\n" +
      "• Piroctone olamine and green tea extract.\n" +
      "• Removes visible dandruff from first use.\n" +
      "• Soothes scalp and reduces itchiness.\n" +
      "• Vitamins B3 and B6 strengthen fibres.\n" +
      "• 2-in-1 cleanse and condition formula.",
    imageUrls: ["https://m.media-amazon.com/images/I/71Qh3u57wCL._AC_SL1500_.jpg"],
  },
  {
    barcode: "3600542061032",
    slug: "garnier-fructis-grow-strong-strengthening-shampoo-400ml",
    sku: "GRN-FRGS-061032",
    price: 7750,
    originalPrice: 8500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه فروكتيس القوة والنمو - شامبو تقوية بخلاصة التفاح والنياسيناميد 400 مل",
    nameEn: "Garnier Fructis Grow Strong Strengthening Shampoo 400ml",
    descriptionAr:
      "شامبو القوة والنمو من غارنييه فروكتيس — تقوية للشعر الضعيف والمتقصف.\n\n" +
      "• خلاصة التفاح والنياسيناميد لتقوية الألياف.\n" +
      "• يقلّل التقصف ويقاوم التكسر.\n" +
      "• يغذّي الشعر من الجذور حتى الأطراف.\n" +
      "• يترك الشعر أقوى وأكثر مرونة.\n" +
      "• خالٍ من البارابين والفثالات.",
    descriptionEn:
      "Garnier Fructis Grow Strong Strengthening Shampoo — fortifying care for weak, breakage-prone hair.\n\n" +
      "• Apple extract and niacinamide strengthen fibres.\n" +
      "• Helps reduce breakage and split ends.\n" +
      "• Nourishes from roots to tips.\n" +
      "• Leaves hair stronger and more resilient.\n" +
      "• No parabens or phthalates.",
    imageUrls: [
      "https://cdn.wasserman.eu/generated/images/s960/1195915/fructis-grow-strong-strengthening-hair-shampoo-400ml",
    ],
  },
  {
    barcode: "3600542118019",
    slug: "garnier-fructis-aloe-hydra-bomb-shampoo-400ml",
    sku: "GRN-FRAH-118019",
    price: 6250,
    originalPrice: 7000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه فروكتيس بومب الألوفيرا المرطبة - شامبو ترطيب بالألوفيرا وحمض الهيالورونيك 400 مل",
    nameEn: "Garnier Fructis Aloe Hydra Bomb Hydrating Shampoo 400ml",
    descriptionAr:
      "شامبو بومب الألوفيرا المرطبة من غارنييه فروكتيس — ترطيب مكثّف للشعر الجاف.\n\n" +
      "• جل الألوفيرا وحمض الهيالورونيك لترطيب عميق.\n" +
      "• ينظّف بلطف مع الحفاظ على رطوبة الشعر.\n" +
      "• يترك الشعر ناعماً ومرطباً ولامعاً.\n" +
      "• مناسب للشعر الجاف والعطشان للماء.\n" +
      "• خالٍ من السيليكون.",
    descriptionEn:
      "Garnier Fructis Aloe Hydra Bomb Hydrating Shampoo — intensive hydration for dry hair.\n\n" +
      "• Aloe vera gel and hyaluronic acid for deep moisture.\n" +
      "• Gently cleanses while retaining hair moisture.\n" +
      "• Leaves hair soft, hydrated and shiny.\n" +
      "• Ideal for dry, thirsty hair.\n" +
      "• Silicone-free.",
    imageUrls: ["https://beautyfree.gr/55758-large_default/garnier-fructis-aloe-hydra-bomb-400ml.jpg"],
  },
  {
    barcode: "3600542060790",
    slug: "garnier-fructis-color-resist-shampoo-400ml",
    sku: "GRN-FRCR-060790",
    price: 7750,
    originalPrice: 8500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه فروكتيس حماية اللون - شامبو للشعر المصبوغ والمشَعر 400 مل",
    nameEn: "Garnier Fructis Color Resist Shampoo 400ml",
    descriptionAr:
      "شامبو حماية اللون من غارنييه فروكتيس — يحافظ على لون الشعر المصبوغ والمشَعر.\n\n" +
      "• خلاصة التوت البري ومضادات الأكسدة وفلاتر UV.\n" +
      "• يحمي اللون من البهتان والتلاشي.\n" +
      "• يقوّي ويغذّي الألياف المصبوغة.\n" +
      "• يمنح لمعاناً وحيوية للون.\n" +
      "• مناسب للشعر المصبوغ والمشَعر والمُلوَّن.",
    descriptionEn:
      "Garnier Fructis Color Resist Shampoo — protects colour for dyed and highlighted hair.\n\n" +
      "• Acai berry extract, antioxidants and UV filters.\n" +
      "• Helps protect colour from fading.\n" +
      "• Strengthens and nourishes coloured fibres.\n" +
      "• Adds shine and vibrancy to colour.\n" +
      "• Ideal for coloured, highlighted and dyed hair.",
    imageUrls: ["https://m.media-amazon.com/images/I/71yPu4wfYTL._AC_SL1500_.jpg"],
  },
  {
    barcode: "3600541970519",
    slug: "garnier-fructis-hydra-fresh-shampoo-400ml",
    sku: "GRN-FRHF-970519",
    price: 7750,
    originalPrice: 8500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه فروكتيس هيدرا فرش - شامبو تنظيف لشعر دهني مع أطراف جافة 400 مل",
    nameEn: "Garnier Fructis Hydra Fresh Shampoo 400ml",
    descriptionAr:
      "شامبو هيدرا فرش من غارنييه فروكتيس — توازن مثالي للشعر الدهني مع أطراف جافة.\n\n" +
      "• ماء جوز الهند وعوامل التنظيف لتنظيف فروة الرأس.\n" +
      "• بروتينات الليمون وفيتامينات B3 و B6 للتقوية.\n" +
      "• ينظّف الجذور ويرطّب الأطراف.\n" +
      "• يترك الشعر منعشاً وخفيفاً ومرطباً.\n" +
      "• خالٍ من البارابين والسيليكون.",
    descriptionEn:
      "Garnier Fructis Hydra Fresh Shampoo — balanced care for oily roots with dry ends.\n\n" +
      "• Coconut water and cleansing agents for scalp purity.\n" +
      "• Lemon proteins, vitamins B3 and B6 for strength.\n" +
      "• Cleanses roots while moisturising ends.\n" +
      "• Fresh, light, hydrated feel.\n" +
      "• Paraben and silicone free.",
    imageUrls: [
      "https://cdn.wasserman.eu/generated/images/s960/1489376/fructis-hydra-fresh-shampoo-for-oily-hair-with-dry-ends-400ml",
    ],
  },
  {
    barcode: "3600541970595",
    slug: "garnier-fructis-coconut-water-purifying-shampoo-400ml",
    sku: "GRN-FRCW-970595",
    price: 6250,
    originalPrice: 7000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه فروكتيس ماء جوز الهند - شامبو تنقية وتنظيف عميق 400 مل",
    nameEn: "Garnier Fructis Coconut Water Purifying Shampoo 400ml",
    descriptionAr:
      "شامبو ماء جوز الهند من غارنييه فروكتيس — تنقية عميقة للشعر الدهني بسرعة.\n\n" +
      "• ماء جوز الهند النقي وحمض الساليسيليك.\n" +
      "• ينظّف فروة الرأس ويزيل الدهون الزائدة.\n" +
      "• يمنح إحساساً بالنظافة والانتعاش لفترة أطول.\n" +
      "• يقوّي الألياف دون تجفيف.\n" +
      "• خالٍ من السيليكون — للشعر الدهني.",
    descriptionEn:
      "Garnier Fructis Coconut Water Purifying Shampoo — deep purifying care for oily hair.\n\n" +
      "• Pure coconut water and salicylic acid.\n" +
      "• Cleanses scalp and removes excess oil.\n" +
      "• Keeps hair feeling clean and fresh for longer.\n" +
      "• Strengthens fibres without over-drying.\n" +
      "• Silicone-free — for oily hair.",
    imageUrls: ["https://beautyfree.gr/55759-large_default/garnier-fructis-coconut-water-400ml.jpg"],
  },
  {
    barcode: "3600542038584",
    slug: "garnier-fructis-goodbye-damage-repairing-shampoo-400ml",
    sku: "GRN-FRGD-038584",
    price: 6250,
    originalPrice: 7000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه فروكتيس وداعاً للتلف - شامبو إصلاحي بزيت الأملا والكيراتين النباتي 400 مل",
    nameEn: "Garnier Fructis Goodbye Damage Repairing Shampoo 400ml",
    descriptionAr:
      "شامبو وداعاً للتلف من غارنييه فروكتيس — إصلاح للشعر المتضرر والباهت.\n\n" +
      "• زيت الأملا والكيراتين النباتي لإصلاح التلف من الداخل.\n" +
      "• يصلّح سطح الألياف ويملأ التقصف.\n" +
      "• يترك الشعر حريرياً ولامعاً وصحياً المظهر.\n" +
      "• يحمي من التلف الناتج عن الحرارة والتمشيط.\n" +
      "• خالٍ من السيليكون.",
    descriptionEn:
      "Garnier Fructis Goodbye Damage Repairing Shampoo — repair for damaged, lifeless hair.\n\n" +
      "• Amla oil and plant keratin repair from within.\n" +
      "• Helps repair surface damage and fill in breakage.\n" +
      "• Leaves hair silky, shiny and healthy-looking.\n" +
      "• Protects against heat and brushing damage.\n" +
      "• Silicone-free.",
    imageUrls: ["https://beautyfree.gr/55762-large_default/garnier-fructis-goodbye-damage-400ml.jpg"],
  },
  {
    barcode: "3600542431149",
    slug: "garnier-fructis-vitamin-strength-shampoo-400ml",
    sku: "GRN-FRVS-431149",
    price: 6250,
    originalPrice: 7000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه فروكتيس فيتامين وقوة - شامبو تقوية ضد التساقط بالبيوتين وفيتامين سي 400 مل",
    nameEn: "Garnier Fructis Vitamin & Strength Shampoo 400ml",
    descriptionAr:
      "شامبو فيتامين وقوة من غارنييه فروكتيس — تقوية ضد التساقط للشعر الضعيف.\n\n" +
      "• البيوتين وفيتامين سي وخلاصة الجريب فروت.\n" +
      "• يقوّي الجذور ويقلّل التساقط.\n" +
      "• يغذّي الألياف ويمنح لمعاناً.\n" +
      "• يترك الشعر أقوى وأكثف المظهر.\n" +
      "• مكمّل مثالي لسيروم فيتامين وقوة.",
    descriptionEn:
      "Garnier Fructis Vitamin & Strength Shampoo — anti-hair-fall strengthening for weak hair.\n\n" +
      "• Biotin, vitamin C and grapefruit extract.\n" +
      "• Strengthens roots and helps reduce hair fall.\n" +
      "• Nourishes fibres and adds shine.\n" +
      "• Leaves hair looking stronger and fuller.\n" +
      "• Perfect partner to Vitamins & Strength Serum.",
    imageUrls: [
      "https://beautyfree.gr/48120-large_default/3600542431149-fructis-sampoyan-vitamin-strength-sagkoyini-400ml.jpg",
    ],
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
  const resolved = await api<{ brand?: { id: string } }>("/brands/resolve", "POST", {
    brandAr: "غارنييه",
    brandEn: "Garnier",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Garnier brand");
  return brandId;
}

async function uploadImage(url: string, alt: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "image/*",
        "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)",
        Referer: "https://www.google.com/",
      },
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
  console.log(`Products: ${PRODUCTS.length} (no shades)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();
  console.log(`Brand: غارنييه (${brandId})\n`);

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

    console.log(`  uploading images (candidates: ${product.imageUrls.length})...`);
    const imageIds: string[] = [];
    for (let i = 0; i < product.imageUrls.length; i++) {
      try {
        imageIds.push(await uploadImage(product.imageUrls[i], `${product.slug}-${imageIds.length + 1}`));
      } catch {
        console.log(`    ! skip image: ${product.imageUrls[i].slice(0, 70)}`);
      }
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
      originalPrice: product.originalPrice,
      stock: 0,
      isActive: true,
      imageIds,
    });

    const verify = await api<{ shades?: unknown[] }>(`/products/${created.id}`);
    console.log(`  ✓ ${product.nameAr}`);
    console.log(`    ID: ${created.id} | ${product.price} IQD\n`);
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Product ${product.barcode} has shades`);
    added += 1;
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Done — added: ${added}/${PRODUCTS.length} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
