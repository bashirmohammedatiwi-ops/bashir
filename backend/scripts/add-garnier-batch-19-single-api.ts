/**
 * Garnier — 19 separate single-SKU hair products (no shades).
 * Usage: npx tsx scripts/add-garnier-batch-19-single-api.ts
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
    barcode: "3610340668944",
    slug: "garnier-ultra-doux-avocado-shea-nourishing-conditioner-360ml",
    sku: "GRN-UDAS-668944",
    price: 6250,
    originalPrice: 7000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو - بلسم تغذية عميقة بزيت الأفوكادو وزبدة الشيا للشعر الجاف والمجعد 360 مل",
    nameEn: "Garnier Ultra Doux Avocado Oil & Shea Butter Nourishing Conditioner 360ml",
    descriptionAr:
      "بلسم ألترا دو التغذية العميقة من غارنييه — تركيبة غنية بزيت الأفوكادو وزبدة الشيا للشعر الجاف والمجعد والهيشان.\n\n" +
      "• يغذّي الألياف بعمق ويسهّل التمشيط بعد الشامبو.\n" +
      "• زيت الأفوكادو ينعّم الخصلات وزبدة الشيا تغلّف الشعر بالرطوبة.\n" +
      "• يقلّل التشابك ويترك الشعر أنعم وأكثر لمعاناً.\n" +
      "• خالٍ من السيليكون — مناسب للاستخدام اليومي.\n" +
      "• مكمّل مثالي لشامبو الأفوكادو وزبدة الشيا من نفس السلسلة.",
    descriptionEn:
      "Garnier Ultra Doux Avocado Oil & Shea Butter Nourishing Conditioner — rich formula with avocado oil and shea butter for dry, frizzy hair.\n\n" +
      "• Deeply nourishes fibres and detangles after shampooing.\n" +
      "• Avocado oil softens strands; shea butter locks in moisture.\n" +
      "• Reduces tangling and leaves hair softer and shinier.\n" +
      "• Silicone-free — suitable for daily use.\n" +
      "• Perfect partner to Avocado & Shea Butter Shampoo.",
    imageUrls: [
      "https://images.openbeautyfacts.org/images/products/361/034/066/8944/1.400.jpg",
      "https://images.openbeautyfacts.org/images/products/361/034/066/8944/front_en.12.400.jpg",
    ],
  },
  {
    barcode: "3600541177741",
    slug: "garnier-ultra-doux-avocado-shea-rich-nourishing-shampoo-400ml",
    sku: "GRN-UDAS-177741",
    price: 4750,
    originalPrice: 5250,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو - شامبو تغذية غنية بزيت الأفوكادو وزبدة الشيا للشعر الجاف 400 مل",
    nameEn: "Garnier Ultra Doux Avocado Oil & Shea Butter Rich Nourishing Shampoo 400ml",
    descriptionAr:
      "شامبو ألترا دو التغذية الغنية من غارنييه — ينظف بلطف ويغذّي الشعر الجاف والمجعد بزيت الأفوكادو وزبدة الشيا.\n\n" +
      "• يغسل الشعر دون أن يجفّفه أو يثقله.\n" +
      "• زيت الأفوكادو يرطّب وزبدة الشيا تغذّي الألياف.\n" +
      "• يترك الشعر ناعماً ولامعاً وأسهل في التصفيف.\n" +
      "• خالٍ من البارابين والسيليكون.\n" +
      "• مناسب للشعر الجاف جداً والمجعد والهيشان.",
    descriptionEn:
      "Garnier Ultra Doux Avocado Oil & Shea Butter Rich Nourishing Shampoo — gently cleanses and nourishes dry, frizzy hair.\n\n" +
      "• Cleanses without stripping or weighing hair down.\n" +
      "• Avocado oil hydrates; shea butter nourishes fibres.\n" +
      "• Leaves hair soft, shiny and easier to style.\n" +
      "• Paraben-free and silicone-free.\n" +
      "• Ideal for very dry, frizzy and unruly hair.",
    imageUrls: ["https://images.openbeautyfacts.org/images/products/360/054/117/7741/1.400.jpg"],
  },
  {
    barcode: "3610340668937",
    slug: "garnier-ultra-doux-mythic-olive-replenishing-conditioner-360ml",
    sku: "GRN-UDMO-668937",
    price: 6750,
    originalPrice: 7500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو زيتونة أسطورية - بلسم إعادة البنية بزيت الزيتون البكر للشعر الجاف والتالف 360 مل",
    nameEn: "Garnier Ultra Doux Mythic Olive Replenishing Conditioner 360ml",
    descriptionAr:
      "بلسم زيتونة أسطورية من غارنييه ألترا دو — يعيد بناء الشعر الجاف والمتضرر بزيت الزيتون البكر وخلاصة ثمار الزيتون.\n\n" +
      "• يغذّي الألياف بعمق ويصلّح التلف الظاهري.\n" +
      "• زيت الزيتون البكر يقوّي ويرطّب الشعر الباهت.\n" +
      "• يسهّل التمشيط ويقلّل التقصف.\n" +
      "• خالٍ من السيليكون.\n" +
      "• مكمّل مثالي لشامبو زيتونة أسطورية من نفس السلسلة.",
    descriptionEn:
      "Garnier Ultra Doux Mythic Olive Replenishing Conditioner — rebuilds dry, damaged hair with virgin olive oil and olive fruit extract.\n\n" +
      "• Deeply nourishes fibres and helps repair visible damage.\n" +
      "• Virgin olive oil strengthens and hydrates dull hair.\n" +
      "• Detangles and helps reduce breakage.\n" +
      "• Silicone-free.\n" +
      "• Perfect partner to Mythic Olive Shampoo.",
    imageUrls: [
      "https://magadmin.miraaya.com/media/catalog/product/cache/optimized/webp/3/6/3610340668937_1.webp",
      "https://cdn.salla.sa/onqKZz/19d4fbbe-589e-421a-b271-b71f3d55abb8-750x1000-MEXR0Wagz16prEqmTYWTTr9eQoTHfRTAaITrChxU.jpg",
    ],
  },
  {
    barcode: "3610340027130",
    slug: "garnier-ultra-doux-mythic-olive-shampoo-400ml",
    sku: "GRN-UDMO-027130",
    price: 4250,
    originalPrice: 4750,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو زيتونة أسطورية - شامبو مغذٍ بزيت الزيتون للشعر الجاف والمتضرر 400 مل",
    nameEn: "Garnier Ultra Doux Mythic Olive Shampoo 400ml",
    descriptionAr:
      "شامبو زيتونة أسطورية من غارنييه ألترا دو — وصفة مغذية بزيت الزيتون البكر لشعر جاف ومتضرر وباهت.\n\n" +
      "• ينظف بلطف دون أن يجفّف الشعر.\n" +
      "• زيت الزيتون البكر يغذّي ويعيد الحيوية للألياف.\n" +
      "• يترك الشعر أنعم وأقوى وأكثر لمعاناً.\n" +
      "• مناسب للشعر الجاف جداً والمتقصف.\n" +
      "• يكمّل روتين العناية مع بلسم زيتونة أسطورية.",
    descriptionEn:
      "Garnier Ultra Doux Mythic Olive Shampoo — nourishing formula with virgin olive oil for dry, damaged and dull hair.\n\n" +
      "• Gently cleanses without drying hair out.\n" +
      "• Virgin olive oil nourishes and revitalises fibres.\n" +
      "• Leaves hair softer, stronger and shinier.\n" +
      "• Ideal for very dry and brittle hair.\n" +
      "• Complete the routine with Mythic Olive Conditioner.",
    imageUrls: ["https://images.openbeautyfacts.org/images/products/361/034/002/7130/1.400.jpg"],
  },
  {
    barcode: "3610340668920",
    slug: "garnier-ultra-doux-black-charcoal-nigella-conditioner-360ml",
    sku: "GRN-UDCN-668920",
    price: 6500,
    originalPrice: 7250,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو - بلسم تنظيف ولمعان بالفحم الأسود وزيت الحبة السوداء 360 مل",
    nameEn: "Garnier Ultra Doux Black Charcoal & Nigella Seed Oil Purifying Conditioner 360ml",
    descriptionAr:
      "بلسم ألترا دو بالفحم الأسود وزيت الحبة السوداء من غارنييه — عناية تنقية ولمعان للفروة الدهنية والشعر الباهت.\n\n" +
      "• الفحم الأسود يمتص الشوائب وينقّي فروة الرأس.\n" +
      "• زيت الحبة السوداء يغذّي ويعيد اللمعان للخصلات.\n" +
      "• يسهّل التمشيط ويترك الشعر ناعماً وخفيفاً.\n" +
      "• خالٍ من السيليكون.\n" +
      "• مكمّل مثالي لشامبو الفحم والحبة السوداء.",
    descriptionEn:
      "Garnier Ultra Doux Black Charcoal & Nigella Seed Oil Purifying Conditioner — purifying shine care for oily scalp and dull hair.\n\n" +
      "• Black charcoal helps absorb impurities and purify the scalp.\n" +
      "• Nigella seed oil nourishes and restores shine.\n" +
      "• Detangles and leaves hair soft and light.\n" +
      "• Silicone-free.\n" +
      "• Perfect partner to Black Charcoal & Nigella Shampoo.",
    imageUrls: [
      "https://www.garnierarabia.com/-/media/project/loreal/brand-sites/garnier/apac/mena-hub/new-pdp/ultra-doux-black-charcoal-nigella-seed/ultra-doux-black-charcoal-conditioner.png",
      "https://cdn.salla.sa/RrKRy/0229c254-8b84-4c98-aa94-3b88e9b9eb05-1000x881.66666666667-zsbJUnlaGOk2D188lEvVLhhIPWQYSd6z3hzfESYG.png",
    ],
  },
  {
    barcode: "3610340652349",
    slug: "garnier-ultra-doux-black-charcoal-nigella-shampoo-400ml",
    sku: "GRN-UDCN-652349",
    price: 4500,
    originalPrice: 5000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو - شامبو تنقية ولمعان بالفحم الأسود وزيت الحبة السوداء 400 مل",
    nameEn: "Garnier Ultra Doux Black Charcoal & Nigella Seed Oil Purifying Shampoo 400ml",
    descriptionAr:
      "شامبو ألترا دو بالفحم الأسود وزيت الحبة السوداء من غارنييه — ينظف فروة الرأس الدهنية ويعيد لمعان الشعر الباهت.\n\n" +
      "• الفحم الأسود ينقّي ويمتص الزيوت الزائدة.\n" +
      "• زيت الحبة السوداء يغذّي ويحمي الألياف.\n" +
      "• يترك الشعر نظيفاً وخفيفاً ولامعاً.\n" +
      "• خالٍ من السيليكون.\n" +
      "• مناسب للفروة الدهنية والشعر الباهت.",
    descriptionEn:
      "Garnier Ultra Doux Black Charcoal & Nigella Seed Oil Purifying Shampoo — cleanses oily scalp and revives dull hair.\n\n" +
      "• Black charcoal purifies and absorbs excess oil.\n" +
      "• Nigella seed oil nourishes and protects fibres.\n" +
      "• Leaves hair clean, light and shiny.\n" +
      "• Silicone-free.\n" +
      "• Ideal for oily scalp and dull hair.",
    imageUrls: [
      "https://images.openbeautyfacts.org/images/products/361/034/065/2349/1.400.jpg",
      "https://incibeauty.com/images/produits/3610340652349.jpg",
    ],
  },
  {
    barcode: "3610340668906",
    slug: "garnier-ultra-doux-almond-milk-hydrating-conditioner-360ml",
    sku: "GRN-UDAM-668906",
    price: 5500,
    originalPrice: 6000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو - بلسم ترطيب يومي بحليب اللوز العضوي وخلاصة الأغاف 360 مل",
    nameEn: "Garnier Ultra Doux Almond Milk Hydrating Conditioner 360ml",
    descriptionAr:
      "بلسم ألترا دو بحليب اللوز من غارنييه — ترطيب يومي لطيف بحليب اللوز العضوي وخلاصة الأغاف.\n\n" +
      "• يرطّب الشعر دون أن يثقله.\n" +
      "• حليب اللوز العضوي يغذّي وينعّم الألياف.\n" +
      "• يسهّل التمشيط ويترك الشعر ناعماً ومرناً.\n" +
      "• تركيبة نباتية خالية من السيليكون.\n" +
      "• مناسب للاستخدام اليومي على الشعر العادي والجاف قليلاً.",
    descriptionEn:
      "Garnier Ultra Doux Almond Milk Hydrating Conditioner — gentle daily hydration with organic almond milk and agave nectar.\n\n" +
      "• Hydrates without weighing hair down.\n" +
      "• Organic almond milk nourishes and softens fibres.\n" +
      "• Detangles and leaves hair soft and supple.\n" +
      "• Plant-based, silicone-free formula.\n" +
      "• Suitable for daily use on normal to slightly dry hair.",
    imageUrls: ["https://images.openbeautyfacts.org/images/products/361/034/066/8906/1.400.jpg"],
  },
  {
    barcode: "3610340634185",
    slug: "garnier-ultra-doux-almond-milk-daily-hydrating-shampoo-400ml",
    sku: "GRN-UDAM-634185",
    price: 4250,
    originalPrice: 4750,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو شامبو مرطب يومي بحليب اللوز 400 مل",
    nameEn: "Garnier Ultra Doux Almond Milk Daily Hydrating Shampoo 400ml",
    descriptionAr:
      "شامبو ألترا دو بحليب اللوز من غارنييه — ينظف بلطف ويرطّب الشعر بتركيبة مغذية بحليب اللوز العضوي.\n\n" +
      "• تنظيف لطيف مناسب للاستخدام اليومي.\n" +
      "• حليب اللوز يغذّي ويرطّب دون أن يثقل الشعر.\n" +
      "• يترك الخصلات ناعمة ولامعة وسهلة التصفيف.\n" +
      "• مناسب للشعر العادي والجاف قليلاً.\n" +
      "• مكمّل مثالي لبلسم حليب اللوز.",
    descriptionEn:
      "Garnier Ultra Doux Almond Milk Daily Hydrating Shampoo — gently cleanses and hydrates with nourishing organic almond milk.\n\n" +
      "• Gentle cleansing suitable for daily use.\n" +
      "• Almond milk nourishes and hydrates without weighing down.\n" +
      "• Leaves strands soft, shiny and easy to style.\n" +
      "• Ideal for normal to slightly dry hair.\n" +
      "• Perfect partner to Almond Milk Conditioner.",
    imageUrls: ["https://images.openbeautyfacts.org/images/products/361/034/063/4185/1.400.jpg"],
  },
  {
    barcode: "3610340668890",
    slug: "garnier-ultra-doux-castor-almond-healing-conditioner-360ml",
    sku: "GRN-UDCA-668890",
    price: 6000,
    originalPrice: 6750,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو حمام زيت - بلسم إصلاحي بزيت الخروع وحليب اللوز للشعر الضعيف 360 مل",
    nameEn: "Garnier Ultra Doux Healing Castor & Almond Oils Conditioner 360ml",
    descriptionAr:
      "بلسم حمام زيت بزيت الخروع وحليب اللوز من غارنييه ألترا دو — عناية إصلاحية للشعر الضعيف المعرّض للتساقط.\n\n" +
      "• زيت الخروع يقوّي الجذور ويحفّز على نمو أقوى.\n" +
      "• حليب اللوز ينعّم ويغذّي الألياف التالفة.\n" +
      "• يسهّل التمشيط ويقلّل التقصف.\n" +
      "• من سلسلة حمام زيت المستوحاة من تقاليد العناية بالشعر.\n" +
      "• مكمّل مثالي لشامبو الخروع وحليب اللوز.",
    descriptionEn:
      "Garnier Ultra Doux Healing Castor & Almond Oils Conditioner — repairing care for weak hair prone to fall.\n\n" +
      "• Castor oil strengthens roots and supports healthier growth.\n" +
      "• Almond milk softens and nourishes damaged fibres.\n" +
      "• Detangles and helps reduce breakage.\n" +
      "• From the Hammam Zeit oil-bath inspired range.\n" +
      "• Perfect partner to Castor & Almond Oils Shampoo.",
    imageUrls: [
      "https://www.garnierarabia.com/-/media/project/loreal/brand-sites/garnier/apac/mena-hub/new-pdp/ultra-doux-castor-almond/ultra-doux-castor-oil--almond-conditioner.png",
    ],
  },
  {
    barcode: "3610340078781",
    slug: "garnier-ultra-doux-castor-almond-healing-shampoo-400ml",
    sku: "GRN-UDCA-078781",
    price: 4250,
    originalPrice: 4750,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو حمام زيت - شامبو تقوية بزيت الخروع وحليب اللوز للشعر الضعيف 400 مل",
    nameEn: "Garnier Ultra Doux Healing Castor & Almond Oils Shampoo 400ml",
    descriptionAr:
      "شامبو حمام زيت بزيت الخروع وحليب اللوز من غارنييه ألترا دو — يقوّي الشعر الضعيف المعرّض للتساقط والتقصف.\n\n" +
      "• زيت الخروع يعزّز قوة الجذور.\n" +
      "• حليب اللوز ينظّف بلطف ويغذّي الألياف.\n" +
      "• يترك الشعر أقوى وأنعم وأسهل في التمشيط.\n" +
      "• من سلسلة حمام زيت المستوحاة من تقاليد العناية بالشعر.\n" +
      "• مكمّل مثالي لبلسم الخروع وحليب اللوز.",
    descriptionEn:
      "Garnier Ultra Doux Healing Castor & Almond Oils Shampoo — strengthens weak hair prone to fall and breakage.\n\n" +
      "• Castor oil boosts root strength.\n" +
      "• Almond milk gently cleanses and nourishes fibres.\n" +
      "• Leaves hair stronger, softer and easier to detangle.\n" +
      "• From the Hammam Zeit oil-bath inspired range.\n" +
      "• Perfect partner to Castor & Almond Oils Conditioner.",
    imageUrls: ["https://images.openbeautyfacts.org/images/products/361/034/007/8781/1.400.jpg"],
  },
  {
    barcode: "3610340675423",
    slug: "garnier-ultra-doux-grape-moisture-hydrating-shampoo-400ml",
    sku: "GRN-UDGM-675423",
    price: 4250,
    originalPrice: 4750,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو ترطيب العنب - شامبو ترطيب وتجديد بماء العنب وزيت بذور العنب 400 مل",
    nameEn: "Garnier Ultra Doux Grape Moisture Hydrating Regenerative Shampoo 400ml",
    descriptionAr:
      "شامبو ترطيب العنب من غارنييه ألترا دو — يرطّب الشعر الجاف والعطشان بماء العنب وزيت بذور العنب الغني بمضادات الأكسدة.\n\n" +
      "• ماء العنب يرطّب ويجدّد حيوية الشعر.\n" +
      "• زيت بذور العنب يحمي ويغذّي الألياف.\n" +
      "• يمنح ترطيباً يدوم حتى 4 أيام.\n" +
      "• ينظف بلطف دون أن يجفّف الشعر.\n" +
      "• مناسب للشعر الجاف والباهت والمتعب.",
    descriptionEn:
      "Garnier Ultra Doux Grape Moisture Hydrating Regenerative Shampoo — hydrates thirsty hair with grape water and antioxidant grapeseed oil.\n\n" +
      "• Grape water hydrates and revitalises hair.\n" +
      "• Grapeseed oil protects and nourishes fibres.\n" +
      "• Provides hydration for up to 4 days.\n" +
      "• Gently cleanses without drying out.\n" +
      "• Ideal for dry, dull and tired hair.",
    imageUrls: [
      "https://images.openbeautyfacts.org/images/products/361/034/067/5423/1.400.jpg",
      "https://ecombe.nahdionline.com/media/catalog/product/1/0/103915300_a32acb4bb4376d0a2_68834.jpg",
    ],
  },
  {
    barcode: "3610340671265",
    slug: "garnier-ultra-doux-rice-water-conditioner-360ml",
    sku: "GRN-UDRW-671265",
    price: 6750,
    originalPrice: 7500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو بلسم بخلاصة ماء الأرز 360 مل",
    nameEn: "Garnier Ultra Doux Rice Water Conditioner 360ml",
    descriptionAr:
      "بلسم ألترا دو بماء الأرز من غارنييه — يفك التشابك وينعش الشعر الباهت بخلاصة ماء الأرز الطبيعية.\n\n" +
      "• ماء الأرز ينعّم ويعيد الحيوية للألياف.\n" +
      "• يسهّل التمشيط بعد الشامبو.\n" +
      "• يترك الشعر لامعاً وناعماً وخفيفاً.\n" +
      "• تركيبة لطيفة مناسبة للشعر الضعيف والباهت.\n" +
      "• مكمّل مثالي لشامبو ماء الأرز.",
    descriptionEn:
      "Garnier Ultra Doux Rice Water Conditioner — detangles and revitalises dull hair with natural rice water extract.\n\n" +
      "• Rice water softens and revives fibres.\n" +
      "• Eases detangling after shampooing.\n" +
      "• Leaves hair shiny, soft and light.\n" +
      "• Gentle formula for fine, dull hair.\n" +
      "• Perfect partner to Rice Water Shampoo.",
    imageUrls: ["https://images.openbeautyfacts.org/images/products/361/034/067/1265/1.400.jpg"],
  },
  {
    barcode: "3610340670909",
    slug: "garnier-ultra-doux-rice-water-shampoo-400ml",
    sku: "GRN-UDRW-670909",
    price: 4250,
    originalPrice: 4750,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو شامبو بخلاصة ماء الأرز 400 مل",
    nameEn: "Garnier Ultra Doux Rice Water Shampoo 400ml",
    descriptionAr:
      "شامبو ألترا دو بماء الأرز من غارنييه — ينظف بلطف وينعش مظهر الشعر الباهت بخلاصة ماء الأرز وحليب الشوفان.\n\n" +
      "• ماء الأرز يجدّد حيوية الشعر دون أن يثقله.\n" +
      "• تنظيف لطيف مناسب للشعر الضعيف والعادي.\n" +
      "• يترك الخصلات ناعمة ولامعة.\n" +
      "• تركيبة نباتية.\n" +
      "• مكمّل مثالي لبلسم ماء الأرز.",
    descriptionEn:
      "Garnier Ultra Doux Rice Water Shampoo — gently cleanses and revitalises dull hair with rice water and oat milk.\n\n" +
      "• Rice water revives hair without weighing it down.\n" +
      "• Gentle cleansing for fine and normal hair.\n" +
      "• Leaves strands soft and shiny.\n" +
      "• Plant-based formula.\n" +
      "• Perfect partner to Rice Water Conditioner.",
    imageUrls: ["https://images.openbeautyfacts.org/images/products/361/034/067/0909/1.400.jpg"],
  },
  {
    barcode: "3600541217904",
    slug: "garnier-ultimate-blends-hair-food-coconut-macadamia-shampoo-350ml",
    sku: "GRN-UBHF-217904",
    price: 4750,
    originalPrice: 5250,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألتيميت بلاندز هير فود - شامبو جوز الهند والماكاداميا لتنعيم الشعر المجعد والجاف 350 مل",
    nameEn: "Garnier Ultimate Blends Hair Food Coconut & Macadamia Shampoo 350ml",
    descriptionAr:
      "شامبو هير فود بجوز الهند والماكاداميا من غارنييه ألتيميت بلاندز — ينعّم وينظّف الشعر المجعد والجاف والمعرّض للهيشان.\n\n" +
      "• جوز الهند وزيت الماكاداميا يغذّيان وينعّمان الألياف.\n" +
      "• يقلّل الهيشان ويمنح نعومة تدوم حتى 48 ساعة.\n" +
      "• تركيبة نباتية 96% من مكونات طبيعية.\n" +
      "• خالٍ من السيليكون — ملمس طبيعي.\n" +
      "• مناسب للشعر الجاف والمجعد والهيشان.",
    descriptionEn:
      "Garnier Ultimate Blends Hair Food Coconut & Macadamia Shampoo — smooths and cleanses frizz-prone dry and curly hair.\n\n" +
      "• Coconut and macadamia oils nourish and soften fibres.\n" +
      "• Helps reduce frizz with up to 48H smoothness.\n" +
      "• 96% natural origin ingredients.\n" +
      "• Silicone-free for a natural feel.\n" +
      "• Ideal for dry, curly and frizzy hair.",
    imageUrls: [
      "https://www.garnier.co.uk/-/media/project/loreal/brand-sites/garnier/emea/uk/en-gb/prd-haircare/hair-food/coconut/coconut-shampoo/37_gar_othr_refresh_hairfood_coconut_shampoo_packshot_front_2026_3600542342858_en_3000x3000.jpg",
    ],
  },
  {
    barcode: "3600542442367",
    slug: "garnier-ultimate-blends-coconut-aloe-hydrating-leave-in-conditioner-200ml",
    sku: "GRN-UBCA-442367",
    price: 9000,
    originalPrice: 10000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "غارنييه ألتيميت بلاندز - بلسم ليف إن مرطب بجوز الهند والألوفيرا بدون شطف 200 مل",
    nameEn: "Garnier Ultimate Blends Coconut & Aloe Vera Hydrating Leave-In Conditioner 200ml",
    descriptionAr:
      "بلسم ليف إن بجوز الهند والألوفيرا من غارنييه ألتيميت بلاندز — ترطيب مكثّف بدون شطف للشعر الجاف والعطشان.\n\n" +
      "• زيت جوز الهند والألوفيرا يرطّبان ويغذّيان الألياف.\n" +
      "• يفك التشابك فوراً دون الحاجة للشطف.\n" +
      "• تركيبة 98% من مكونات طبيعية خالية من السيليكون.\n" +
      "• يترك الشعر ناعماً ولامعاً دون بقايا.\n" +
      "• يُطبَّق على الشعر المبلل بعد الشامبو ثم يُجفَّف.",
    descriptionEn:
      "Garnier Ultimate Blends Coconut & Aloe Vera Hydrating Leave-In Conditioner — intensive no-rinse hydration for dry, dehydrated hair.\n\n" +
      "• Coconut oil and aloe vera hydrate and nourish fibres.\n" +
      "• Instantly detangles with no rinsing required.\n" +
      "• 98% natural origin, silicone-free formula.\n" +
      "• Leaves hair soft and shiny with no residue.\n" +
      "• Apply to wet hair after shampoo, then dry and style.",
    imageUrls: ["https://static.thcdn.com/productimg/original/13422431-6785085423198243.jpg"],
  },
  {
    barcode: "3600542267199",
    slug: "garnier-ultra-doux-mythic-olive-leave-in-cream-200ml",
    sku: "GRN-UDMO-267199",
    price: 8500,
    originalPrice: 9500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "غارنييه ألترا دو زيتونة أسطورية - كريم ليف إن مغذٍ بزيت الزيتون للشعر الجاف 200 مل",
    nameEn: "Garnier Ultra Doux Mythic Olive Leave-In Cream 200ml",
    descriptionAr:
      "كريم ليف إن زيتونة أسطورية من غارنييه ألترا دو — عناية مستمرة بزيت الزيتون البكر للشعر الجاف والتالف دون شطف.\n\n" +
      "• يغذّي ويحمي الشعر طوال اليوم.\n" +
      "• زيت الزيتون البكر يعيد النعومة واللمعان.\n" +
      "• يسهّل التصفيف ويقلّل الهيشان.\n" +
      "• مناسب للشعر الجاف جداً والمتضرر.\n" +
      "• يُطبَّق على الشعر المبلل أو الجاف.",
    descriptionEn:
      "Garnier Ultra Doux Mythic Olive Leave-In Cream — continuous virgin olive oil care for dry, damaged hair, no rinse.\n\n" +
      "• Nourishes and protects hair all day.\n" +
      "• Virgin olive oil restores softness and shine.\n" +
      "• Eases styling and helps reduce frizz.\n" +
      "• Ideal for very dry and damaged hair.\n" +
      "• Apply to damp or dry hair.",
    imageUrls: ["https://images.openbeautyfacts.org/images/products/360/054/226/7199/1.400.jpg"],
  },
  {
    barcode: "3600542630672",
    slug: "garnier-ultra-doux-avocado-shea-hair-scalp-oil-120ml",
    sku: "GRN-UDAS-630672",
    price: 16500,
    originalPrice: 18500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "غارنييه ألترا دو - زيت شعر وفروة الرأس بزيت الأفوكادو وزبدة الشيا 120 مل",
    nameEn: "Garnier Ultra Doux Avocado Oil & Shea Butter Hair & Scalp Oil 120ml",
    descriptionAr:
      "زيت شعر وفروة الرأس بزيت الأفوكادو وزبدة الشيا من غارنييه ألترا دو — عناية ثلاثية الاستخدام للشعر الجاف.\n\n" +
      "• يُستخدم يومياً أو قبل الغسيل أو كمعزّز للقناع.\n" +
      "• زيت الأفوكادو وزبدة الشيا يغذّيان الشعر والفروة.\n" +
      "• ملمس خفيف غير دهني يمتص بسرعة.\n" +
      "• يقلّل الجفاف والهيشان ويعيد اللمعان.\n" +
      "• مناسب للشعر الجاف والمجعد والمتضرر.",
    descriptionEn:
      "Garnier Ultra Doux Avocado Oil & Shea Butter Hair & Scalp Oil — 3-in-1 care for dry hair and scalp.\n\n" +
      "• Use daily, as a pre-wash treatment or mask booster.\n" +
      "• Avocado oil and shea butter nourish hair and scalp.\n" +
      "• Lightweight, non-greasy texture absorbs quickly.\n" +
      "• Helps reduce dryness, frizz and restores shine.\n" +
      "• Ideal for dry, curly and damaged hair.",
    imageUrls: ["https://images.openbeautyfacts.org/images/products/360/054/263/0672/1.400.jpg"],
  },
  {
    barcode: "3600542571296",
    slug: "garnier-fructis-damage-eraser-keratin-filler-treatment-200ml",
    sku: "GRN-FRDE-571296",
    price: 8000,
    originalPrice: 9000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "غارنييه فروكتيس دامج إيريزر - علاج إصلاحي بكيراتين ملء الشعر للشعر التالف 200 مل",
    nameEn: "Garnier Fructis Damage Eraser Keratin Filler Rinse-Out Treatment 200ml",
    descriptionAr:
      "علاج كيراتين ملء الشعر من غارنييه فروكتيس دامج إيريزر — إصلاح مكثّف للشعر التالف والمتقصف.\n\n" +
      "• مركّب الكيراتين يملأ الفجوات داخل الألياف.\n" +
      "• زيت المارولا يغذّي ويحمي من التلف.\n" +
      "• يُطبَّق بعد الشامبو ويُشطف — علاج أسبوعي مكثّف.\n" +
      "• يترك الشعر أقوى وأنعم وأكثر مقاومة للتكسر.\n" +
      "• تركيبة نباتية خالية من السيليكون.",
    descriptionEn:
      "Garnier Fructis Damage Eraser Keratin Filler Rinse-Out Treatment — intensive repair for damaged, brittle hair.\n\n" +
      "• Keratin repair complex fills gaps within fibres.\n" +
      "• Marula oil nourishes and helps protect from damage.\n" +
      "• Apply after shampoo and rinse — weekly intensive treatment.\n" +
      "• Leaves hair stronger, smoother and more breakage-resistant.\n" +
      "• Plant-based, silicone-free formula.",
    imageUrls: [
      "https://www.garnier.com.au/-/media/project/loreal/brand-sites/garnier/apac/au/products/haircare/fructis/damage-eraser-keratin-filler-rinse-out-treatment/3600542617215.png",
      "https://beautyfree.gr/66683-large_default/garnier-fructis-keratin-filler-200ml.jpg",
    ],
  },
  {
    barcode: "3600540539397",
    slug: "garnier-ultra-doux-avocado-shea-leave-in-cream-200ml",
    sku: "GRN-UDAS-539397",
    price: 8500,
    originalPrice: 9500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "غارنييه ألترا دو كريم شعر ليف إن بزيت الأفوكادو وزبدة الشيا 200 مل",
    nameEn: "Garnier Ultra Doux Avocado Oil & Shea Butter Leave-In Cream 200ml",
    descriptionAr:
      "كريم ليف إن بزيت الأفوكادو وزبدة الشيا من غارنييه ألترا دو — يغذّي الشعر الجاف والمجعد دون شطف.\n\n" +
      "• يغذّي ويحمي الشعر طوال اليوم.\n" +
      "• زيت الأفوكادو وزبدة الشيا ينعّمان ويرطّبان الألياف.\n" +
      "• يسهّل التصفيف ويقلّل الهيشان والتقصف.\n" +
      "• مناسب للشعر الجاف جداً والمجعد.\n" +
      "• يُطبَّق على الشعر المبلل أو الجاف.",
    descriptionEn:
      "Garnier Ultra Doux Avocado Oil & Shea Butter Leave-In Cream — nourishes dry, frizzy hair without rinsing.\n\n" +
      "• Nourishes and protects hair all day.\n" +
      "• Avocado oil and shea butter soften and hydrate fibres.\n" +
      "• Eases styling and helps reduce frizz and breakage.\n" +
      "• Ideal for very dry and frizzy hair.\n" +
      "• Apply to damp or dry hair.",
    imageUrls: ["https://images.openbeautyfacts.org/images/products/360/054/053/9397/1.400.jpg"],
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
