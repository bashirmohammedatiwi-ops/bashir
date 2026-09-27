/**
 * GOSH Copenhagen — 19 separate single-SKU products (no shades).
 * Source: goshcopenhagen.com + POS (verified names, descriptions, images)
 * Note: barcode 5711914217488 skipped — not found on goshcopenhagen.com; POS name corrupted.
 * Usage: npx tsx scripts/add-gosh-batch-20-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";

const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CARE_FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const HIGHLIGHTER = "774d62c3-8119-4c0c-983b-2513fc46df24";

const FACE_PRIMER = "d179ae24-9cf5-4a70-8dbd-bedd0cfbef0b";
const MASCARA = "e1032b57-c1af-49e3-a408-130468f22736";
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";
const LIQUID_HIGHLIGHTER = "6fed608e-80d7-4449-9427-fc2848b091be";
const FACE_MASKS = "5a89a7d0-16d9-47d6-8575-2961289fc526";
const FACE_MOISTURIZER = "21801439-d0e9-4106-b5e8-dfdd70ffeb8d";
const LIP_CARE = "e932381d-8469-4099-b66e-ce1a7eec9b60";

const CDN = "https://goshcopenhagen.com/cdn/shop/files";

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
    barcode: "5701278609968",
    slug: "gosh-boombastic-xxl-volume-mascara-black",
    sku: "GSH-BXXL-609968",
    price: 11250,
    originalPrice: 12500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "كوش - ماسكارا بومباستيك XXL لحجم وطول فائق أسود",
    nameEn: "GOSH Copenhagen - Boombastic XXL Volume Mascara Black",
    descriptionAr:
      "ماسكارا بومباستيك XXL من كوش — حجم وطول استثنائيان برفيع مطاطي كبير يفصل الرموش دون تكتّل.\n\n" +
      "• حجم وطول وتعريف مكثّف للرموش.\n" +
      "• فرشاة مطاطية ضخمة تغطي كل رمشة من الجذور للأطراف.\n" +
      "• تبني حجماً وطولاً ملحوظاً بسهولة.\n" +
      "• خالية من العطر — مناسبة للعيون الحساسة.",
    descriptionEn:
      "GOSH Copenhagen Boombastic XXL Volume Mascara — extreme volume and length with a large rubber brush that separates lashes.\n\n" +
      "• Volume, length and definition in one.\n" +
      "• Huge rubber brush coats every lash from root to tip.\n" +
      "• Builds massive volume and length without clumping.\n" +
      "• Perfume-free.",
    imageUrls: [
      `${CDN}/5701278609968_1_3f168fb3-1ae6-4456-a5ec-0121b522bee2.jpg`,
      `${CDN}/5701278609968_1_1_c08461cf-3d3b-44bd-a9ca-678edbdae5b7.jpg`,
    ],
  },
  {
    barcode: "5711914126780",
    slug: "gosh-boombastic-crazy-mascara-001-extreme-black",
    sku: "GSH-BCM-126780",
    price: 11475,
    originalPrice: 12750,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "كوش - ماسكارا بومباستيك كريزي 001 إكستريم بلاك",
    nameEn: "GOSH Copenhagen - Boombastic Crazy Mascara 001 Extreme Black",
    descriptionAr:
      "ماسكارا بومباستيك كريزي 001 إكستريم بلاك من كوش — لون أسود قوي مع حجم وطول استثنائيين.\n\n" +
      "• لون أسود جريء مع حجم وطول فائقين.\n" +
      "• تفصل الرموش دون تكتّل.\n" +
      "• ثبات طويل طوال اليوم.\n" +
      "• معتمدة Allergy Certified — خالية من العطر.",
    descriptionEn:
      "GOSH Copenhagen Boombastic Crazy Mascara 001 Extreme Black — bold black colour with extreme volume and length.\n\n" +
      "• Crazy coloured lashes with extreme volume.\n" +
      "• Separates lashes without clumping.\n" +
      "• Long-lasting wear.\n" +
      "• Allergy Certified and fragrance-free.",
    imageUrls: [`${CDN}/5711914126780.jpg`, `${CDN}/5711914126780_1_1.jpg`],
  },
  {
    barcode: "5711914165147",
    slug: "gosh-boombastic-crazy-mascara-002-crazy-blue",
    sku: "GSH-BCM-165147",
    price: 11475,
    originalPrice: 12750,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "كوش - ماسكارا بومباستيك كريزي 002 أزرق جريء",
    nameEn: "GOSH Copenhagen - Boombastic Crazy Mascara 002 Crazy Blue",
    descriptionAr:
      "ماسكارا بومباستيك كريزي 002 أزرق جريء من كوش — لون أزرق صارخ مع حجم وطول ملفتين.\n\n" +
      "• لون أزرق جريء يبرز الرموش بشكل مميز.\n" +
      "• حجم وطول استثنائيان دون تكتّل.\n" +
      "• تغطية متساوية من الجذور للأطراف.\n" +
      "• معتمدة Allergy Certified — خالية من العطر.",
    descriptionEn:
      "GOSH Copenhagen Boombastic Crazy Mascara 002 Crazy Blue — bold blue colour with extreme volume and length.\n\n" +
      "• Stand-out crazy blue lashes.\n" +
      "• Extreme volume and length without clumping.\n" +
      "• Even application from root to tip.\n" +
      "• Allergy Certified and fragrance-free.",
    imageUrls: [
      `${CDN}/5711914165147_1_4f296488-247d-4974-bf5d-e3a53c842cc8.jpg`,
      `${CDN}/5711914165147_1_1.jpg`,
    ],
  },
  {
    barcode: "5711914182595",
    slug: "gosh-boombastic-crazy-mascara-005-chocolate-brown",
    sku: "GSH-BCM-182595",
    price: 11475,
    originalPrice: 12750,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "كوش - ماسكارا بومباستيك كريزي 005 شوكولاتة بني",
    nameEn: "GOSH Copenhagen - Boombastic Crazy Mascara 005 Chocolate Brown",
    descriptionAr:
      "ماسكارا بومباستيك كريزي 005 شوكولاتة بني من كوش — لون بني شوكولاتة دافئ مع حجم وطول فائقين.\n\n" +
      "• لون بني شوكولاتة ناعم وأنيق للإطلالة اليومية.\n" +
      "• حجم وطول استثنائيان دون تكتّل.\n" +
      "• ثبات طويل.\n" +
      "• معتمدة Allergy Certified — خالية من العطر.",
    descriptionEn:
      "GOSH Copenhagen Boombastic Crazy Mascara 005 Chocolate Brown — warm chocolate brown with extreme volume and length.\n\n" +
      "• Soft chocolate brown for an everyday look.\n" +
      "• Extreme volume and length without clumping.\n" +
      "• Long-lasting wear.\n" +
      "• Allergy Certified and fragrance-free.",
    imageUrls: [
      `${CDN}/5711914182595_1_387523d7-2443-4bf4-b03f-31f4eae094b2.jpg`,
      `${CDN}/5711914182595_1.jpg`,
    ],
  },
  {
    barcode: "5711914182625",
    slug: "gosh-boombastic-crazy-mascara-006-dusty-violet",
    sku: "GSH-BCM-182625",
    price: 11475,
    originalPrice: 12750,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "كوش - ماسكارا بومباستيك كريزي 006 بنفسجي داستي",
    nameEn: "GOSH Copenhagen - Boombastic Crazy Mascara 006 Dusty Violet",
    descriptionAr:
      "ماسكارا بومباستيك كريزي 006 بنفسجي داستي من كوش — لون بنفسجي ناعم مع حجم وطول جريئين.\n\n" +
      "• لون بنفسجي داكن مميز يبرز العيون.\n" +
      "• حجم وطول استثنائيان دون تكتّل.\n" +
      "• تغطية متساوية لكل رمشة.\n" +
      "• معتمدة Allergy Certified — خالية من العطر.",
    descriptionEn:
      "GOSH Copenhagen Boombastic Crazy Mascara 006 Dusty Violet — dusty violet colour with extreme volume and length.\n\n" +
      "• Unique dusty violet shade for standout lashes.\n" +
      "• Extreme volume and length without clumping.\n" +
      "• Coats every lash from root to tip.\n" +
      "• Allergy Certified and fragrance-free.",
    imageUrls: [`${CDN}/5711914182625_6.jpg`, `${CDN}/5711914182625_1_1.jpg`],
  },
  {
    barcode: "5711914197506",
    slug: "gosh-boombastic-crazy-mascara-007-crazy-green",
    sku: "GSH-BCM-197506",
    price: 11475,
    originalPrice: 12750,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "كوش - ماسكارا بومباستيك كريزي 007 أخضر جريء",
    nameEn: "GOSH Copenhagen - Boombastic Crazy Mascara 007 Crazy Green",
    descriptionAr:
      "ماسكارا بومباستيك كريزي 007 أخضر جريء من كوش — لون أخضر صارخ مع حجم وطول استثنائيين.\n\n" +
      "• لون أخضر جريء لإطلالة عيون مميزة.\n" +
      "• حجم وطول فائقان دون تكتّل.\n" +
      "• ثبات طويل.\n" +
      "• معتمدة Allergy Certified — خالية من العطر.",
    descriptionEn:
      "GOSH Copenhagen Boombastic Crazy Mascara 007 Crazy Green — bold green colour with extreme volume and length.\n\n" +
      "• Stand-out crazy green lashes.\n" +
      "• Extreme volume and length without clumping.\n" +
      "• Long-lasting wear.\n" +
      "• Allergy Certified and fragrance-free.",
    imageUrls: [`${CDN}/5711914197506.jpg`, `${CDN}/5711914197506_1.jpg`],
  },
  {
    barcode: "5711914172794",
    slug: "gosh-just-click-it-volume-mascara-black",
    sku: "GSH-JCI-172794",
    price: 13275,
    originalPrice: 14750,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "كوش - ماسكارا جست كليك إت للحجم والطول أسود",
    nameEn: "GOSH Copenhagen - Just Click It! Volume Mascara Black",
    descriptionAr:
      "ماسكارا جست كليك إت من كوش — عبوة ذكية تُغلق كقلم حبر؛ حجم وطول فوريان دون تكتّل.\n\n" +
      "• غطاء كليكي سهل الاستخدام — أغلقيه وابدئي التطبيق.\n" +
      "• فرشاة رفيعة تعطي حجماً وطولاً من أول طبقة.\n" +
      "• تركيبة شمعية خفيفة لا تثقل الرموش.\n" +
      "• معتمدة Allergy Certified — خالية من العطر.",
    descriptionEn:
      "GOSH Copenhagen Just Click It! Volume Mascara — click-down cap design for instant volume and length.\n\n" +
      "• Insta-friendly click-down packaging — just click and apply.\n" +
      "• Thin bristle brush delivers volume and length without clumping.\n" +
      "• Lightweight wax blend that does not weigh lashes down.\n" +
      "• Allergy Certified and fragrance-free.",
    imageUrls: [`${CDN}/5711914172794_0241427b-936e-485f-a483-4d7013e71f2e.jpg`],
  },
  {
    barcode: "5711914179458",
    slug: "gosh-just-click-it-water-resistant-mascara-black",
    sku: "GSH-JCI-179458",
    price: 13275,
    originalPrice: 14750,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "كوش - ماسكارا جست كليك إت مقاومة للماء أسود",
    nameEn: "GOSH Copenhagen - Just Click It! Water-Resistant Mascara Black",
    descriptionAr:
      "ماسكارا جست كليك إت المقاومة للماء من كوش — تحمي رموشك من الرطوبة والدموع والعرق طوال اليوم.\n\n" +
      "• مقاومة للماء — لا تذوب ولا تتلطخ.\n" +
      "• عبوة كليكي سهلة الاستخدام.\n" +
      "• تمنح الرموش حجماً وكثافة دون تكتّل.\n" +
      "• مثالية للأيام الطويلة والطقس الرطب.\n" +
      "• معتمدة Allergy Certified — خالية من العطر.",
    descriptionEn:
      "GOSH Copenhagen Just Click It! Water-Resistant Mascara — protects lashes from moisture, sweat and tears all day.\n\n" +
      "• Water-resistant formula — no smudging or panda eyes.\n" +
      "• Click-down packaging for easy application.\n" +
      "• Adds volume and thickness without clumping.\n" +
      "• Perfect for long days and humid weather.\n" +
      "• Allergy Certified and fragrance-free.",
    imageUrls: [
      `${CDN}/wp_gosh_09-12-20_some8615_648b6905-0eb1-46fd-b173-fcb9509dc956.jpg`,
      `${CDN}/5711914179458_1.jpg`,
    ],
  },
  {
    barcode: "5711914160036",
    slug: "gosh-catchy-eyes-drama-mascara-black",
    sku: "GSH-CED-160036",
    price: 11700,
    originalPrice: 13000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "كوش - ماسكارا كاتشي آيز دراما للرموش الكثيفة أسود",
    nameEn: "GOSH Copenhagen - Catchy Eyes Drama Mascara Black",
    descriptionAr:
      "ماسكارا كاتشي آيز دراما من كوش — تركيبة متطورة تمنح رموشاً معرّفة وكثيفة تتحمل المطر والعرق والدموع.\n\n" +
      "• تصل لأصغر الرموش وتمنحها حجماً وطولاً.\n" +
      "• فرشاة منحنية تطيل وتكثّف الرموش.\n" +
      "• ثبات قوي ضد المطر والعرق والدموع.\n" +
      "• عبوة من بلاستيك النفايات البحرية — نباتية.\n" +
      "• معتمدة Allergy Certified — خالية من العطر.",
    descriptionEn:
      "GOSH Copenhagen Catchy Eyes Drama Mascara — breakthrough formula for beautiful, defined lashes that hold up to rain, sweat and tears.\n\n" +
      "• Curved brush lengthens and reaches even the smallest lashes.\n" +
      "• Fantastic performance — no clumping.\n" +
      "• Holds up to rain, sweat and tears.\n" +
      "• Packaging made from Ocean Waste Plastic — vegan.\n" +
      "• Allergy Certified and fragrance-free.",
    imageUrls: [
      `${CDN}/5711914160036_74516c7a-fb72-45b5-87f1-15999dc6f354.jpg`,
      `${CDN}/5711914160036_1.jpg`,
    ],
  },
  {
    barcode: "5711914188276",
    slug: "gosh-lip-filler-001-baby",
    sku: "GSH-LF-188276",
    price: 14400,
    originalPrice: 16000,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
    nameAr: "كوش - ملمع شفاه ليب فيلر لتكبير الشفاه 001 بيبي وردي",
    nameEn: "GOSH Copenhagen - Lip Filler 001 Baby Pink",
    descriptionAr:
      "ملمع ليب فيلر 001 بيبي من كوش — تكبير فوري للشفاه بلون وردي ناعم ولمعة جذابة.\n\n" +
      "• يكبّر الشفاه من أول طبقة بفضل InstaPlump™ وWakapamp.\n" +
      "• يملأ الخطوط الدقيقة ويرطّب بحمض الهيالورونيك.\n" +
      "• لمعان جميل وملمس ناعم غير لزج.\n" +
      "• لون 001 بيبي وردي — الأكثر مبيعاً.",
    descriptionEn:
      "GOSH Copenhagen Lip Filler 001 Baby — instant lip plumping gloss with a soft pink tint and beautiful shine.\n\n" +
      "• Plumps lips after the first layer with InstaPlump™ and Wakapamp.\n" +
      "• Fills fine lines and moisturises with hyaluronic acid.\n" +
      "• Beautiful glossy finish — soft and non-sticky.\n" +
      "• Shade 001 Baby — bestseller pink.",
    imageUrls: [
      `${CDN}/5711914188276_33f847d5-955b-41e3-9c6c-3220a35307eb.jpg`,
      `${CDN}/5711914188276_1.jpg`,
    ],
  },
  {
    barcode: "5711914194697",
    slug: "gosh-lip-filler-002-ice",
    sku: "GSH-LF-194697",
    price: 14400,
    originalPrice: 16000,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
    nameAr: "كوش - ملمع شفاه ليب فيلر لتكبير الشفاه 002 آيس منعش",
    nameEn: "GOSH Copenhagen - Lip Filler 002 Ice",
    descriptionAr:
      "ملمع ليب فيلر 002 آيس من كوش — تكبير فوري للشفاه مع إحساس منعش وبارد بفضل المنثول.\n\n" +
      "• يكبّر الشفاه من أول طبقة بفضل InstaPlump™ وWakapamp.\n" +
      "• إحساس منعش وبارد (آيس) يعزّز تأثير التكبير.\n" +
      "• يرطّب ويغذّي الشفاه بحمض الهيالورونيك.\n" +
      "• لمعان شفاف مع لمسة باردة منعشة.",
    descriptionEn:
      "GOSH Copenhagen Lip Filler 002 Ice — plumping lip gloss with a fresh, cooling menthol sensation.\n\n" +
      "• Plumps lips after the first layer with InstaPlump™ and Wakapamp.\n" +
      "• Cooling Ice effect thanks to menthol.\n" +
      "• Moisturises and nourishes with hyaluronic acid.\n" +
      "• Clear glossy finish with a refreshing tingle.",
    imageUrls: [`${CDN}/5711914194697.jpg`, `${CDN}/5711914194697_1.jpg`],
  },
  {
    barcode: "5711914153489",
    slug: "gosh-lip-gloss-0017",
    sku: "GSH-LG-153489",
    price: 9675,
    originalPrice: 10750,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
    nameAr: "كوش - ملمع شفاه ليب غلوس لمعان فائق رقم 0017",
    nameEn: "GOSH Copenhagen - Lip Gloss 0017",
    descriptionAr:
      "ملمع شفاه ليب غلوس 0017 من كوش — لمعان فائق يجعل الشفاه تبدو أكثر امتلاءً ونعومة لساعات.\n\n" +
      "• لمعان استثنائي بقوام غير لزج.\n" +
      "• يرطّب وينعّم الشفاه.\n" +
      "• يُستخدم وحده أو فوق أحمر الشفاه.\n" +
      "• سهل التطبيق — خالٍ من العطر.",
    descriptionEn:
      "GOSH Copenhagen Lip Gloss 0017 — ultimate shine that makes lips appear fuller and softer for hours.\n\n" +
      "• Ultimate shine with a non-sticky texture.\n" +
      "• Moisturises and softens lips.\n" +
      "• Wear alone or on top of lipstick.\n" +
      "• Easy to apply — perfume-free.",
    imageUrls: [
      `${CDN}/5711914153489_0c5d660e-fa54-4f08-9768-f17e622d8c2c.jpg`,
      `${CDN}/5711914153489_1.jpg`,
    ],
  },
  {
    barcode: "5711914201418",
    slug: "gosh-oh-my-glow-002-dewy-drops",
    sku: "GSH-OMG-201418",
    price: 19800,
    originalPrice: 22000,
    categoryId: MAKEUP,
    subcategoryId: HIGHLIGHTER,
    tertiaryCategoryId: LIQUID_HIGHLIGHTER,
    nameAr: "كوش - قطرات إشراق أوه ماي غلو 002 ديوي دروبس للوجه",
    nameEn: "GOSH Copenhagen - Oh My Glow 002 Dewy Drops",
    descriptionAr:
      "قطرات أوه ماي غلو 002 ديوي دروبس من كوش — توهج ندّي صحي يمنح البشرة إطلالة Pearl Skin المشرقة.\n\n" +
      "• تأثير بشرة لؤلؤية (Pearl Skin) بلمعان عاكس للضوء.\n" +
      "• تندمج مع المرطب أو الفاونديشن أو تُستخدم وحدها.\n" +
      "• مريحة على البشرة ومناسبة للاستخدام اليومي.\n" +
      "• خالية من العطر — معتمدة Allergy Certified.",
    descriptionEn:
      "GOSH Copenhagen Oh My Glow 002 Dewy Drops — healthy dewy glow for a luminous Pearl Skin finish.\n\n" +
      "• Pearl skin effect with light-reflecting highlights.\n" +
      "• Blends with day cream, foundation or worn alone.\n" +
      "• Comfortable on skin for everyday wear.\n" +
      "• Perfume-free and Allergy Certified.",
    imageUrls: [
      `${CDN}/5711914201418_1.jpg`,
      `${CDN}/5711914201418_1_2ba05a1b-0c0f-42f8-9aac-e12d9a6eefb6.jpg`,
    ],
  },
  {
    barcode: "5711914215033",
    slug: "gosh-primer-plus-005-chameleon",
    sku: "GSH-PP-215033",
    price: 18000,
    originalPrice: 18000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_PRIMER,
    nameAr: "كوش - برايمر بلس 005 شاميليون يتكيف مع لون البشرة",
    nameEn: "GOSH Copenhagen - Primer+ 005 Chameleon Skin Adaptor",
    descriptionAr:
      "برايمر بلس 005 شاميليون من كوش — برايمر متعدد الوظائف يتكيف مع درجة بشرتك ويحمي من التلوث.\n\n" +
      "• صبغات محمية تتكيف مع عدة درجات بشرة.\n" +
      "• يمنح إشراقة صحية ومتساوية.\n" +
      "• يرطّب وينعّم البشرة طوال اليوم.\n" +
      "• يحتوي على CITYGUARD+ للحماية من التلوث.",
    descriptionEn:
      "GOSH Copenhagen Primer+ 005 Chameleon — multifunctional primer that adapts to your skin tone with anti-pollution protection.\n\n" +
      "• Encapsulated pigments adapt to multiple skin tones.\n" +
      "• Fresh, healthy, even glow.\n" +
      "• Moisturises, energises and protects all day.\n" +
      "• Contains CITYGUARD+ anti-pollution complex.",
    imageUrls: [
      `${CDN}/5711914215033_fe3a8337-33fc-450f-9058-2e635fd1c546.jpg`,
      `${CDN}/5711914215033_1_be17ea57-2d4f-4bce-a647-435266df8265.jpg`,
    ],
  },
  {
    barcode: "5711914130558",
    slug: "gosh-primer-plus-006-filler",
    sku: "GSH-PP-130558",
    price: 16650,
    originalPrice: 18500,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_PRIMER,
    nameAr: "كوش - برايمر بلس 006 فيلر لملء المسام والخطوط",
    nameEn: "GOSH Copenhagen - Primer+ 006 Pore & Wrinkle Minimizer Filler",
    descriptionAr:
      "برايمر بلس 006 فيلر من كوش — يملأ المسام والخطوط الدقيقة ويمنح قاعدة مطفية مثالية للمكياج.\n\n" +
      "• يملأ المسام والخطوط الدقيقة فوراً.\n" +
      "• لمسة مطفية خالية من العيوب تدوم طوال اليوم.\n" +
      "• مثالي للبشرة الدهنية.\n" +
      "• يثبّت المكياج ويمنحه ثباتاً أطول.",
    descriptionEn:
      "GOSH Copenhagen Primer+ 006 Filler — pore and wrinkle minimizer for a flawless matte makeup base.\n\n" +
      "• Fills pores and fine lines instantly.\n" +
      "• Matte, flawless finish that lasts all day.\n" +
      "• Perfect for oily skin.\n" +
      "• Keeps makeup flawless for longer.",
    imageUrls: [
      `${CDN}/5711914130558_2_8d49b4af-4291-462c-aef7-d24b60a4fa95.jpg`,
      `${CDN}/5711914130558_1_c9982935-6c76-4164-93a4-5d38d25bb6a7.jpg`,
    ],
  },
  {
    barcode: "5711914198725",
    slug: "gosh-skin-care-vitamin-c-booster-30ml",
    sku: "GSH-VCB-198725",
    price: 25200,
    originalPrice: 28000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "كوش - سيروم فيتامين سي لتفتيح وتوحيد لون البشرة 30 مل",
    nameEn: "GOSH Copenhagen - Skin Care Vitamin C Booster Serum 30ml",
    descriptionAr:
      "سيروم فيتامين سي بوستر من كوش — تفتيح فوري وتوحيد لون البشرة وتحفيز إنتاج الكولاجين.\n\n" +
      "• يفتّح البشرة الباهتة والمتعبة فوراً.\n" +
      "• يقلل التصبغات ويوحّد لون البشرة.\n" +
      "• يحفّز إنتاج الكولاجين — يُمتص بسرعة.\n" +
      "• يترك البشرة مرطّبة ومشرقة.\n" +
      "• معتمد Allergy Certified.",
    descriptionEn:
      "GOSH Copenhagen Vitamin C Booster Face Serum — instant brightening, even skin tone and collagen stimulation.\n\n" +
      "• Brightens dull, tired and uneven skin tone.\n" +
      "• Minimises pigment spots for a more even complexion.\n" +
      "• Stimulates collagen production — fast-absorbing.\n" +
      "• Leaves skin moisturised, fresh and radiant.\n" +
      "• Allergy Certified.",
    imageUrls: [
      `${CDN}/5711914198725_d27ebe8c-a0ac-4825-9b50-80bfd216149a.jpg`,
      `${CDN}/5711914198725_1_68e39a9d-ba39-4f9d-92f4-b0ed05e4c670.jpg`,
    ],
  },
  {
    barcode: "5711914187859",
    slug: "gosh-skin-care-collagen-booster-serum-30ml",
    sku: "GSH-CBS-187859",
    price: 25200,
    originalPrice: 28000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "كوش - سيروم كولاجين لتجديد البشرة ومكافحة التجاعيد 30 مل",
    nameEn: "GOSH Copenhagen - Skin Care Collagen Booster Serum 30ml",
    descriptionAr:
      "سيروم كولاجين بوستر من كوش — فيتامين يومي لبشرتك يملأ الخطوط ويؤخر علامات الشيخوخة.\n\n" +
      "• تركيبة كولاجين قوية تنعّم الخطوط الدقيقة والتجاعيد.\n" +
      "• يرطّب ويغذّي فوراً بـ MultiMoist وفيتامين E.\n" +
      "• يمنح البشرة توهجاً صحياً ومنتعشاً.\n" +
      "• يؤخر ظهور علامات التقدّم في السن.\n" +
      "• معتمد Allergy Certified.",
    descriptionEn:
      "GOSH Copenhagen Collagen Booster Face Serum — daily skin vitamin that smooths lines and delays signs of ageing.\n\n" +
      "• Powerful collagen formula smooths fine lines and wrinkles.\n" +
      "• Instantly moisturises with MultiMoist and Vitamin E.\n" +
      "• Creates a fresh, healthy glow.\n" +
      "• Delays further signs of ageing.\n" +
      "• Allergy Certified.",
    imageUrls: [
      `${CDN}/5711914187859_7354a9e0-8c42-497c-a56b-e6c7e595ee02.jpg`,
      `${CDN}/5711914187859_1_1_5e1cef0d-a718-4083-8dbd-11f782d21fbb.jpg`,
    ],
  },
  {
    barcode: "5711914198671",
    slug: "gosh-skin-care-overnight-mask-50ml",
    sku: "GSH-SOM-198671",
    price: 25200,
    originalPrice: 28000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MASKS,
    nameAr: "كوش - ماسك ليلي للوجه ترطيب عميق 72 ساعة 50 مل",
    nameEn: "GOSH Copenhagen - Skin Care Overnight Face Mask 50ml",
    descriptionAr:
      "ماسك ليلي للوجه من كوش — رفاهية مسائية تمنح البشرة ترطيباً يدوم حتى 72 ساعة.\n\n" +
      "• ترطيب فائق يستمر حتى 72 ساعة.\n" +
      "• مكونات فعّالة تُحبس الرطوبة داخل البشرة.\n" +
      "• تستيقظين ببشرة ناعمة حريرية ومنعشة.\n" +
      "• مناسب لجميع فصول السنة.\n" +
      "• معتمد Allergy Certified.",
    descriptionEn:
      "GOSH Copenhagen Overnight Face Mask — ultra-moisturising night cream for up to 72 hours of hydration.\n\n" +
      "• Up to 72 hours of uninterrupted hydration.\n" +
      "• Active ingredients lock moisture into the skin.\n" +
      "• Wake up with fresh, silky-smooth skin.\n" +
      "• Ready for all seasons, wind and weather.\n" +
      "• Allergy Certified.",
    imageUrls: [
      `${CDN}/5711914198671_22b2cbd7-d0db-40b5-8b8b-86448127d507.jpg`,
      `${CDN}/5711914198671_1_a53e20b0-a93d-4780-b71f-66bb27936441.jpg`,
    ],
  },
  {
    barcode: "5711914198794",
    slug: "gosh-skin-care-overnight-lip-mask-15ml",
    sku: "GSH-SOLM-198794",
    price: 16200,
    originalPrice: 18000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: LIP_CARE,
    nameAr: "كوش - ماسك ليلي للشفاه ترطيب وإصلاح عميق 15 مل",
    nameEn: "GOSH Copenhagen - Skin Care Overnight Lip Mask 15ml",
    descriptionAr:
      "ماسك ليلي للشفاه من كوش — سبا لشفاهك أثناء النوم لشفاه ناعمة ومترطبة صباحاً.\n\n" +
      "• ترطيب مكثّف وعلاج للشفاه الجافة والمتشققة.\n" +
      "• يُصلح الشفاه المتهيجة أثناء النوم.\n" +
      "• يترك لمعاناً جميلاً على الشفاه.\n" +
      "• أفضل المكونات الفعّالة لأعلى جودة.\n" +
      "• معتمد Allergy Certified.",
    descriptionEn:
      "GOSH Copenhagen Overnight Lip Mask — spa treatment for your lips while you sleep.\n\n" +
      "• Ultimate hydration and care overnight.\n" +
      "• Intensive treatment repairs dry and irritated lips.\n" +
      "• Leaves a beautiful glossy shine.\n" +
      "• Premium active ingredients for maximum effect.\n" +
      "• Allergy Certified.",
    imageUrls: [
      `${CDN}/5711914198794_34d93b82-7cd8-4ac5-b4a3-44d57c8a1787.jpg`,
      `${CDN}/5711914198794_1_45a73eda-bf31-49c9-abf3-0d3849d67b3a.jpg`,
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
    brandAr: "كوش",
    brandEn: "GOSH Copenhagen",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve GOSH Copenhagen brand");
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
  console.log(`Products: ${PRODUCTS.length} (no shades)\n`);
  console.log("SKIP: 5711914217488 — not found on goshcopenhagen.com (POS name corrupted)\n");
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();
  console.log(`Brand: كوش (${brandId})\n`);

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

    console.log(`  uploading ${product.imageUrls.length} images...`);
    const imageIds: string[] = [];
    for (let i = 0; i < product.imageUrls.length; i++) {
      imageIds.push(await uploadImage(product.imageUrls[i], `${product.slug}-${i + 1}`));
    }

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
