/**
 * Mon Reve — 13 separate SKUs (no shades), with product images.
 * High-accuracy bilingual AR/EN names & descriptions for Iraqi market.
 *
 * Sources: monrevecosmetics.com, Pharm24, Thomas Parfums, Beautyfree, Prettyspot
 *
 * Usage: npx tsx scripts/add-mon-reve-batch-aug5-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const MASCARA = "e1032b57-c1af-49e3-a408-130468f22736";
const EYESHADOW = "07f14763-7a8b-4646-a057-8748e2b18bd4";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const POWDER = "828bbfd2-d611-417a-bdca-0f5424a61171";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";
const HIGHLIGHTER = "774d62c3-8119-4c0c-983b-2513fc46df24";
const POWDER_HIGHLIGHTER = "7480a30f-ed2b-41a8-9349-dd67edb010b6";
const TOOLS = "c7a90d6f-6fd4-40df-9b02-4cb33b8efce1";
const FACE_BRUSHES = "575c78b2-000c-4311-8c69-3694995a3565";
const EYE_BRUSHES = "0ab0d6d2-4550-4b3b-9ac3-91df6e90b70a";

const MR = "https://monrevecosmetics.com/media/images/products";
const P24 = "https://cdn.pharm24.gr/images/515x515-90";
const TP = "https://thomasparfums.gr";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice?: number;
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
    barcode: "5201641031247",
    slug: "mon-reve-cosmic-mascara-01-black-12ml",
    sku: "MON-COSMIC-031247",
    price: 9000,
    originalPrice: 10500,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "مون ريف - ماسكارا Cosmic Mascara 01 أسود لتكثيف وإطالة الرموش 12 مل",
    nameEn: "Mon Reve Cosmic Mascara 01 Black Volume & Length 12ml",
    descriptionAr:
      "ماسكارا Cosmic من مون ريف — فرشاة بشعيرات مزدوجة الخطّاف ترفع وتفصل كل رمش، فتعطي كثافة درامية وطولاً واضحاً ولوناً أسود غنياً من أول مسحة.\n\n" +
      "• فرشاة مخروطية تصل حتى أصغر رموش الزوايا دون تكتّل.\n" +
      "• تركيبة غنية ببروفيتامين B5 لتقذية وتقوية الرموش مع ثبات مرن يدوم.\n" +
      "• مناسبة للإطلالة اليومية والسهرات — خالية من البارابين والغلوتين، مختبرة جلدياً وطبّياً للعين، وغير مجرّبة على الحيوانات.\n" +
      "• 12 مل — درجة 01 أسود كلاسيكي.\n\n" +
      "طريقة الاستخدام: من جذور الرموش العلوية بحركة متعرّجة خفيفة ثم اسحبي للأعلى. للسفلى استخدمي طرف الفرشاة بكمية قليلة.",
    descriptionEn:
      "Mon Reve Cosmic Mascara — a high-tech brush with tiny double-hook bristles that lifts, separates and defines every lash for dramatic curl, spectacular volume, impressive length and rich intense black in one stroke.\n\n" +
      "• Tapered brush reaches even the tiniest corner lashes with no clumps or smudges.\n" +
      "• Infused with Pro-Vitamin B5 to nourish lashes; flexible long-wear hold you can build layer by layer.\n" +
      "• Day-to-night essential — paraben-free, gluten-free, dermatologically & ophthalmologically tested, cruelty-free.\n" +
      "• 12ml — shade 01 Black.\n\n" +
      "How to use: Zigzag from the outer roots of upper lashes, then sweep upward. For lower lashes, gently swipe with the tip — avoid excess product.",
    imageUrls: [
      `${MR}/2025/03/mon_reve_cosmic_mascara_2.jpg`,
      `${MR}/2025/03/mon_reve_cosmic_mascara_1.jpg`,
      `${P24}/5201641031247.jpg`,
    ],
  },
  {
    barcode: "5201641030561",
    slug: "mon-reve-shiny-lips-01-clear-lip-gloss-8ml",
    sku: "MON-SHINY-030561",
    price: 7000,
    originalPrice: 8500,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
    nameAr: "مون ريف - ملمع شفاه Shiny Lips 01 Clear شفاف لامع مرطب 8 مل",
    nameEn: "Mon Reve Shiny Lips 01 Clear Moisturizing Ultra-Shine Lip Gloss 8ml",
    descriptionAr:
      "ملمع شفاه Shiny Lips من مون ريف — لمعة شفافة نقية متعددة الأبعاد مع لمسة نهائية لامعة تدوم، دون شعور لزج مزعج.\n\n" +
      "• غني بمرطبات وزيت البابونج لتهدئة الشفاه وحبس رطوبتها الطبيعية.\n" +
      "• لآلئ بأحجام مختلفة لأثر ثلاثي الأبعاد ولمعة كثيفة.\n" +
      "• أداة تطبيق جامبو بتجويف يجمع كمية أوفر ويوزّعها بمسحة واحدة.\n" +
      "• مثالي وحده فوق البلسم أو فوق أحمر الشفاه لإطلالة يومية لامعة في السوق العراقي.\n" +
      "• 8 مل — درجة 01 Clear شفافة للّمعة النقية.",
    descriptionEn:
      "Mon Reve Shiny Lips — a moisture-rich, ultra-shiny lip gloss with multidimensional glow and a uniquely long-lasting glossy finish — without sticky feel.\n\n" +
      "• Enriched with moisturizers and chamomile oil to soothe and lock in natural lip moisture.\n" +
      "• Multi-sized pearls for an intense 3D volume-and-shine effect.\n" +
      "• Jumbo applicator with a product pocket for richer, even application in one swipe.\n" +
      "• Wear alone, over balm, or over lipstick for everyday high-shine lips.\n" +
      "• 8ml — shade 01 Clear for pure transparent shine.",
    imageUrls: [
      `${MR}/2023/10/mon_reve_shiny_lips_01_01.jpg`,
      `${P24}/5201641030561.jpg`,
      `${TP}/10027-large_default/mon-reve-shiny-lips-01-clear-lip-gloss-.jpg`,
    ],
  },
  {
    barcode: "5201641038901",
    slug: "mon-reve-shiny-lips-09-clear-volume-lip-gloss-8ml",
    sku: "MON-SHINY-038901",
    price: 7000,
    originalPrice: 8500,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
    nameAr: "مون ريف - ملمع شفاه Shiny Lips 09 Clear Volume شفاف مكثّف الحجم 8 مل",
    nameEn: "Mon Reve Shiny Lips 09 Clear Volume Plumping Clear Lip Gloss 8ml",
    descriptionAr:
      "ملمع شفاه Shiny Lips 09 Clear Volume من مون ريف — لمعان شفاف مع مفعول تكثيف خفيف يمنح الشفاه مظهراً أكثر امتلاءً وإشراقاً.\n\n" +
      "• صيغة Volumizing بعامل تدفئة لطيف ينشّط الدورة الدقيقة لامتلاء مؤقت دون تهيّج.\n" +
      "• صبغة تتفاعل مع درجة حموضة الشفاه لتبرز لونها الطبيعي بلمعان صافٍ.\n" +
      "• مرطّب بزيت البابونج ولآلئ ثلاثية الأبعاد — غير لزج وسهل التوزيع.\n" +
      "• مثالي لمن تريد لمعاناً شفافاً مع إحساس امتلاء خفيف مناسب للإطلالات اليومية.\n" +
      "• 8 مل — درجة 09 Clear Volume.",
    descriptionEn:
      "Mon Reve Shiny Lips 09 Clear Volume — a clear volumizing gloss for pure shine with a fuller-looking lip effect.\n\n" +
      "• Volumizing formula with a gentle warming agent that boosts micro-circulation for temporary plumpness without irritation.\n" +
      "• pH-activating pigment enhances your natural lip tone under a crystal-clear shine.\n" +
      "• Chamomile oil + multi-sized pearls for comfort and a 3D glossy finish — non-sticky.\n" +
      "• Perfect everyday clear gloss when you want shine plus a subtle plump look.\n" +
      "• 8ml — shade 09 Clear Volume.",
    imageUrls: [
      `${MR}/2024/05/Mon_reve_Shiny_lips_09_01.jpg`,
      `${TP}/11342-large_default/mon-reve-shiny-lips-09-clear-volume-lip-gloss-.jpg`,
      `${TP}/11343-large_default/mon-reve-shiny-lips-09-clear-volume-lip-gloss-.jpg`,
    ],
  },
  {
    barcode: "5201641031124",
    slug: "mon-reve-lip-balm-moisturizing-5g",
    sku: "MON-LB-031124",
    price: 5500,
    originalPrice: 6500,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
    nameAr: "مون ريف - بلسم شفاه مرطب عميق Lip Balm لحماية وتنعيم الشفاه 5 غرام",
    nameEn: "Mon Reve Lip Balm Deep Moisturizing & Protective Lip Balm 5g",
    descriptionAr:
      "بلسم شفاه Lip Balm من مون ريف — يغذّي ويحمي الشفاه بعمق ويتركها ناعمة ومريحة طوال اليوم.\n\n" +
      "• تركيبة مرطّبة تحمي من الجفاف والتشقّق — مثالية لمناخ العراق.\n" +
      "• ملمس ناعم سهل التطبيق يعيد الرطوبة دون ثِقل.\n" +
      "• يُستخدم وحده يومياً أو كقاعدة قبل أحمر الشفاه والملمع.\n" +
      "• 5 غرام — حجم عملي للحقيبة وإعادة الترطيب في أي وقت.",
    descriptionEn:
      "Mon Reve Lip Balm — a deeply nourishing balm that moisturizes and protects lips, leaving them soft and comfortable all day.\n\n" +
      "• Protective formula helps fight dryness and chapping — ideal for everyday Iraqi climate care.\n" +
      "• Smooth, easy texture that restores moisture without heaviness.\n" +
      "• Wear alone daily or as a base under lipstick and gloss.\n" +
      "• 5g — handy size for bag touch-ups anytime.",
    imageUrls: [`${P24}/5201641031124.jpg`],
  },
  {
    barcode: "5201641013496",
    slug: "mon-reve-121-all-over-eyeshadow-brush",
    sku: "MON-BR121-013496",
    price: 5500,
    originalPrice: 6500,
    subcategoryId: TOOLS,
    tertiaryCategoryId: EYE_BRUSHES,
    nameAr: "مون ريف - فرشاة ظلال عيون 121 All Over Eyeshadow Brush لتطبيق ودمج اللون",
    nameEn: "Mon Reve 121 All Over Eyeshadow Brush for Applying & Blending Shadow",
    descriptionAr:
      "فرشاة 121 All Over Eyeshadow من مون ريف — فرشاة عملية ناعمة بما يكفي للدمج وثابتة بما يكفي للتحكّم الكامل.\n\n" +
      "• مثالية لتطبيق لون ظلال واحد على الجفن بتغطية عالية وتوزيع متساوٍ.\n" +
      "• شعيرات صناعية نباتية سهلة الاستخدام مع الظلال البودرة والكريمية.\n" +
      "• تُثبّت اللون وتدمجه بسلاسة حتى للدرجات القوية.\n" +
      "• رفيقة يومية لإطلالات عيون واضحة من الصباح للمساء.",
    descriptionEn:
      "Mon Reve 121 All Over Eyeshadow Brush — fluffy enough to blend seamlessly, yet firm enough for full control.\n\n" +
      "• Ideal for one-colour eyeshadow application across the lid with high-impact payoff.\n" +
      "• Soft synthetic vegan bristles that deposit, blend and smooth even stubborn powder shadows.\n" +
      "• Easy everyday tool for polished eye looks from morning to night.\n" +
      "• Perfect companion for Mon Reve eyeshadow palettes.",
    imageUrls: [`${P24}/5201641013496_1.jpg`],
  },
  {
    barcode: "5201641753323",
    slug: "mon-reve-blush-on-trio-palette-02-earthy-9-9g",
    sku: "MON-BLUSHON-753323",
    price: 9500,
    originalPrice: 11000,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    nameAr: "مون ريف - باليت أحمر خدود ثلاثي Blush On! 02 Earthy مات ولامع 9.9 غرام",
    nameEn: "Mon Reve Blush On! Trio Blush Palette 02 Earthy Matte & Iridescent 9.9g",
    descriptionAr:
      "باليت Blush On! 02 Earthy من مون ريف — ثلاث درجات ترابية مات ولامعة قابلة للمزج لإطلالة خدود طبيعية حتى الجريئة.\n\n" +
      "• استخدمي كل درجة وحدها أو امزجيها لصياغة لونك الخاص.\n" +
      "• معادن طبيعية وعوامل ملطّفة وفيتامين E لنعومة ومرونة البشرة.\n" +
      "• قوام بودرة مضغوطة حريرية سهلة التوزيع والثبات.\n" +
      "• 9.9 غرام (3×3.3 غرام) — درجة 02 Earthy بتدرجات دافئة تناسب البشرة الفاتحة إلى السمراء.\n\n" +
      "طريقة الاستخدام: فرشاة أحمر خدود ناعمة على تفاحة الخد نحو الصدغ.",
    descriptionEn:
      "Mon Reve Blush On! 02 Earthy — a unique blush trio of lovely blendable matte and iridescent shades for natural to standout cheeks.\n\n" +
      "• Use shades alone or mix them to create your personal flush.\n" +
      "• Natural mineral ingredients, skin conditioners and Vitamin E for smooth, elastic, fresh-looking skin.\n" +
      "• Silky pressed-powder texture that blends evenly and wears beautifully.\n" +
      "• 9.9g (3×3.3g) — shade 02 Earthy with warm earthy tones that flatter fair to deeper complexions.\n\n" +
      "How to use: Sweep a soft blush brush on the apples of the cheeks toward the temples.",
    imageUrls: [
      `${MR}/2020/06/Mon_Reve_blush_On__2_a.jpg`,
      `${MR}/2020/06/Mon_Reve_blush_On__2_b.jpg`,
      `${P24}/5201641753323_1.jpg`,
    ],
  },
  {
    barcode: "5201641753316",
    slug: "mon-reve-blush-on-trio-palette-01-peachy-9-9g",
    sku: "MON-BLUSHON-753316",
    price: 9500,
    originalPrice: 11000,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    nameAr: "مون ريف - باليت أحمر خدود ثلاثي Blush On! 01 Peachy مات ولامع 9.9 غرام",
    nameEn: "Mon Reve Blush On! Trio Blush Palette 01 Peachy Matte & Iridescent 9.9g",
    descriptionAr:
      "باليت Blush On! 01 Peachy من مون ريف — ثلاث درجات خوخية وردية مات ولامعة لمنح الخدود نضارة دافئة وإشراقة صحية.\n\n" +
      "• درجات قابلة للمزج من الإطلالة الطبيعية حتى المظهر الجريء.\n" +
      "• معادن طبيعية وفيتامين E لترطيب ونعومة الملمس.\n" +
      "• مثالية للبشرة الفاتحة والمتوسطة ولمظهر «خدود حية» يومي.\n" +
      "• 9.9 غرام (3×3.3 غرام) — درجة 01 Peachy.",
    descriptionEn:
      "Mon Reve Blush On! 01 Peachy — a blush trio of soft peachy-pink matte and iridescent shades for a warm, healthy flush.\n\n" +
      "• Blendable tones from natural everyday colour to a bolder cheek look.\n" +
      "• Natural minerals, conditioners and Vitamin E for a smooth, fresh finish.\n" +
      "• Ideal for fair to medium complexions and a lively daytime glow.\n" +
      "• 9.9g (3×3.3g) — shade 01 Peachy.",
    imageUrls: [
      `${MR}/2020/06/Mon_Reve_blush_On__1_a.jpg`,
      `${MR}/2020/06/Mon_Reve_blush_On__1_b.jpg`,
      `${MR}/2020/06/Mon_Reve_blush_On__1_c.jpg`,
      `${P24}/5201641753316_1.jpg`,
    ],
  },
  {
    barcode: "5201641005736",
    slug: "mon-reve-happy-palettes-01-moroccan-nights-eyeshadow-15g",
    sku: "MON-HP-005736",
    price: 11000,
    originalPrice: 13000,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "مون ريف - باليت ظلال عيون Happy Palettes 01 Moroccan Nights بتسع درجات 15 غرام",
    nameEn: "Mon Reve Happy Palettes 01 Moroccan Nights 9-Shade Eyeshadow Palette 15g",
    descriptionAr:
      "باليت Happy Palettes 01 Moroccan Nights من مون ريف — تسع ظلال عالية الصبغة بأجواء شرقية دافئة من البيج والذهبي والبني مع رملي ووردي خشبي وماجنتا وبوردو فاتح.\n\n" +
      "• قوام مات وساتان للدمج السلس وإطلالات من الصباح حتى السهرة.\n" +
      "• ثبات لوني غني وتطبيق متساوٍ بدون تكتّل.\n" +
      "• درجات دافئة تناسب العيون البنية والسوداء الشائعة في السوق العراقي.\n" +
      "• 15 غرام — باليت يومية متعددة الاستخدام.\n\n" +
      "نصيحة: الفاتح للزاوية الداخلية وتحت الحاجب، المتوسط للثنية، والغامق لتحديد الجفن وإطلالة سموكي.",
    descriptionEn:
      "Mon Reve Happy Palettes 01 Moroccan Nights — nine highly pigmented eyeshadows in an ethnic warm story of beige, gold and brown harmonised with sand, rosewood pink, deep magenta and light bordeaux.\n\n" +
      "• Matte and satin textures for endless day-to-night looks.\n" +
      "• Rich long-lasting colour with even, blendable application.\n" +
      "• Warm tones that flatter brown and dark eyes beautifully.\n" +
      "• 15g — a versatile everyday palette.\n\n" +
      "Tip: Lights on the inner corner/under brow, mediums for transitions, darks on the lid and lower lash line for depth and smokey eyes.",
    imageUrls: [
      "https://prettyspot.gr/cdn/shop/files/mon-reve-happy-palettes-moroccan-nights.jpg",
    ],
  },
  {
    barcode: "5201641019481",
    slug: "mon-reve-happy-palettes-09-pillow-fight-eyeshadow-15g",
    sku: "MON-HP-019481",
    price: 11000,
    originalPrice: 13000,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "مون ريف - باليت ظلال عيون Happy Palettes 09 Pillow Fight بتسع درجات 15 غرام",
    nameEn: "Mon Reve Happy Palettes 09 Pillow Fight 9-Shade Eyeshadow Palette 15g",
    descriptionAr:
      "باليت Happy Palettes 09 Pillow Fight من مون ريف — تسع ظلال حالمة بدرجات كاكاو دافئ وتيراكوتا محمّصة وكافي أو ليه مع وردي بودري وشامبانيا لامع وكريمي مشرق.\n\n" +
      "• مزيج مات ولامع ومعدني سهل التطبيق والدمج.\n" +
      "• مناسبة لكل ألوان العيون — من مظهر طبيعي رومانسي إلى سموكي أنيق.\n" +
      "• صبغة عالية وثبات لساعات — باليت يومية أساسية.\n" +
      "• 15 غرام / ~14 غرام صافي — درجة 09 Pillow Fight.\n\n" +
      "خالٍ من العطور والبارابين، مختبر جلدياً وغير مجرّب على الحيوانات.",
    descriptionEn:
      "Mon Reve Happy Palettes 09 Pillow Fight — nine dreamy eyeshadows in warm cocoa, burnt terracotta and elegant café-au-lait matched with powder pink, sparkling champagne and bright cream.\n\n" +
      "• Rich matte, shimmery and metallic textures that apply and blend evenly.\n" +
      "• Flatters all eye colours — from romantic no-makeup looks to glamorous smokey eyes.\n" +
      "• Highly pigmented colour that lasts for hours — a true everyday must-have.\n" +
      "• 15g / ~14g net — shade 09 Pillow Fight.\n\n" +
      "Fragrance-free, paraben-free, dermatologically tested, cruelty-free.",
    imageUrls: [
      `${MR}/2022/09/5201641019481_1.jpg`,
      `${MR}/2022/09/5201641019481_3.jpg`,
      `${MR}/2022/09/5201641019481_4.jpg`,
      `${P24}/5201641019481.jpg`,
    ],
  },
  {
    barcode: "5201641013373",
    slug: "mon-reve-111-powder-brush",
    sku: "MON-BR111-013373",
    price: 14000,
    originalPrice: 16000,
    subcategoryId: TOOLS,
    tertiaryCategoryId: FACE_BRUSHES,
    nameAr: "مون ريف - فرشاة بودرة وجه 111 Powder Brush كبيرة ناعمة لتثبيت المكياج",
    nameEn: "Mon Reve 111 Powder Brush Large Soft Face Powder & Setting Brush",
    descriptionAr:
      "فرشاة 111 Powder Brush من مون ريف — فرشاة كبيرة مستديرة بشعيرات صناعية فائقة النعومة والانتفاخ لتوزيع البودرة السائبة والمضغوطة بسهولة.\n\n" +
      "• تطبيق متساوٍ يثبّت المكياج بإطلالة ناعمة كالهواء.\n" +
      "• تساعد على تنعيم النتيجة النهائية وإخفاء أي عدم تجانس.\n" +
      "• مناسبة للوجه والرقبة والديكوليتيه وحتى الجسم.\n" +
      "• نباتية (Vegan) — رفيقة يومية لتثبيت الفاونديشن والكونسيلر.",
    descriptionEn:
      "Mon Reve 111 Powder Brush — a large rounded brush with incredibly soft, fluffy synthetic bristles for easy loose and compact powder application.\n\n" +
      "• Evenly applies and sets makeup for a flawless, airbrushed finish.\n" +
      "• Helps smooth the overall makeup result.\n" +
      "• Perfect for all-over face powder and also suitable for neck, décolletage and body.\n" +
      "• Vegan — your everyday setting essential from morning to night.",
    imageUrls: [`${P24}/5201641013373_1.jpg`],
  },
  {
    barcode: "5201641038833",
    slug: "mon-reve-stellar-powder-highlighter-02-golden-sand-8g",
    sku: "MON-STPOW-038833",
    price: 7500,
    originalPrice: 9000,
    subcategoryId: HIGHLIGHTER,
    tertiaryCategoryId: POWDER_HIGHLIGHTER,
    nameAr: "مون ريف - هايلايتر بودرة Stellar Powder 02 Golden Sand لإشراقة فورية 8 غرام",
    nameEn: "Mon Reve Stellar Powder Highlighter 02 Golden Sand Instant Glow 8g",
    descriptionAr:
      "هايلايتر بودرة Stellar 02 Golden Sand من مون ريف — لمعان السائل Stellar بسهولة البودرة، بتركيبة مرطّبة تندمج كبشرة ثانية.\n\n" +
      "• شدة قابلة للبناء: من لؤلؤ خفيف إلى لمعان مبلّل مبهر.\n" +
      "• درجة Golden Sand ذهبية رملية دافئة تناسب البشرة المتوسطة إلى السمراء والإطلالة المشرقة.\n" +
      "• علبة أنيقة بمغناطيس ومرآة — مثالية للحقيبة.\n" +
      "• للوجه والجسم (الكتفين، الترقوة، الساقين).\n" +
      "• 8 غرام — فيغن، خالٍ من العطور والغلوتين، مختبر جلدياً.",
    descriptionEn:
      "Mon Reve Stellar Powder Highlighter 02 Golden Sand — the beloved liquid Stellar glow in easy powder form, with a hydrating formula that feels like second skin.\n\n" +
      "• Buildable intensity from subtle pearl to wet-shine brilliance.\n" +
      "• Warm golden-sand tone ideal for medium to deeper complexions and sunlit glow.\n" +
      "• Sleek magnetic compact with mirror — perfect on-the-go.\n" +
      "• Face and body (shoulders, collarbones, legs).\n" +
      "• 8g — vegan, fragrance-free, gluten-free, dermatologically tested.",
    imageUrls: [
      `${MR}/2024/09/mon_reve_stellar_powder_highlighter_02_4.jpg`,
      `${MR}/2024/09/mon_reve_stellar_powder_highlighter_closed_2.jpg`,
      `${TP}/11628-large_default/mon-reve-stellar-powder-highlighter-02-golden-sand.jpg`,
      `${TP}/11627-large_default/mon-reve-stellar-powder-highlighter-02-golden-sand.jpg`,
      `${P24}/5201641038833_1.jpg`,
    ],
  },
  {
    barcode: "5201641038826",
    slug: "mon-reve-stellar-powder-highlighter-01-lumen-8g",
    sku: "MON-STPOW-038826",
    price: 7500,
    originalPrice: 9000,
    subcategoryId: HIGHLIGHTER,
    tertiaryCategoryId: POWDER_HIGHLIGHTER,
    nameAr: "مون ريف - هايلايتر بودرة Stellar Powder 01 Lumen لإشراقة لؤلؤية فاتحة 8 غرام",
    nameEn: "Mon Reve Stellar Powder Highlighter 01 Lumen Pearly Instant Glow 8g",
    descriptionAr:
      "هايلايتر بودرة Stellar 01 Lumen من مون ريف — إشراقة لؤلؤية فاتحة فورية بتركيبة مرطّبة سهلة الدمج على الوجه والجسم.\n\n" +
      "• درجة Lumen فاتحة لؤلؤية مثالية للبشرة الفاتحة إلى المتوسطة ولمسة ندى طبيعية.\n" +
      "• شدة قابلة للبناء من لمسة خفيفة إلى لمعان واضح.\n" +
      "• علبة رفيعة بمغناطيس ومرآة محمولة.\n" +
      "• يُطبَّق بفرشاة على عظام الخدين، عظمة الحاجب، جسر الأنف وقوس كيوبيد.\n" +
      "• 8 غرام — فيغن، خالٍ من العطور والزيوت المعدنية، مختبر جلدياً.",
    descriptionEn:
      "Mon Reve Stellar Powder Highlighter 01 Lumen — instant pearly glow in a hydrating powder that melts into skin on face and body.\n\n" +
      "• Light luminous Lumen shade ideal for fair to medium complexions and a natural dewy highlight.\n" +
      "• Buildable from soft pearl to beaming shine.\n" +
      "• Slim magnetic compact with mirror for touch-ups.\n" +
      "• Brush onto cheekbones, brow bone, bridge of the nose and cupid’s bow.\n" +
      "• 8g — vegan, fragrance-free, mineral-oil-free, dermatologically tested.",
    imageUrls: [
      `${MR}/2024/09/mon_reve_stellar_powder_highlighter_01_4.jpg`,
      `${MR}/2024/09/mon_reve_stellar_powder_highlighter_01_3.jpg`,
      `${MR}/2024/09/mon_reve_stellar_powder_highlighter_closed_2_u6FARyA.jpg`,
      `${TP}/11625-large_default/mon-reve-stellar-powder-highlighter-01-lumen.jpg`,
      `${TP}/11624-large_default/mon-reve-stellar-powder-highlighter-01-lumen.jpg`,
      `${P24}/5201641038826_1.jpg`,
    ],
  },
  {
    barcode: "5201641751022",
    slug: "mon-reve-matte-skin-compact-powder-105-spf15-12g",
    sku: "MON-MSP-751022",
    price: 10000,
    originalPrice: 12000,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    nameAr: "مون ريف - بودرة مضغوطة مات Matte Skin Compact Powder 105 بحماية SPF15 وزن 12 غرام",
    nameEn: "Mon Reve Matte Skin Compact Powder 105 Mattifying SPF15 12g",
    descriptionAr:
      "بودرة Matte Skin المضغوطة من مون ريف — تغطية ناعمة لموازنة لون البشرة مع مظهر مات مخملي وحماية SPF 15.\n\n" +
      "• تخفي العيوب وتوحّد اللون دون ثِقل — مثالية فوق الفاونديشن أو وحدها.\n" +
      "• فيتامين E يحمي من الجفاف؛ مناسبة لكل أنواع البشرة.\n" +
      "• درجة 105 (رقم 5) بدرجة متوسطة دافئة تناسب كثيراً من درجات البشرة في العراق.\n" +
      "• 12 غرام مع إسفنجة — مثالية لإعادة اللمسة طوال اليوم.\n\n" +
      "طريقة الاستخدام: بإسفنجة جافة أو فرشاة بودرة على كامل الوجه أو مناطق اللمعان.",
    descriptionEn:
      "Mon Reve Matte Skin Compact Powder — perfect coverage with a matte velvety finish and SPF 15 against sun rays and free radicals.\n\n" +
      "• Evens skin tone and softens imperfections without heaviness — over foundation or alone.\n" +
      "• Vitamin E helps protect against dehydration; ideal for all skin types.\n" +
      "• Shade 105 (No.5) — a medium warm tone that flatters many Iraqi complexions.\n" +
      "• 12g with sponge — ideal for fresh touch-ups all day.\n\n" +
      "How to use: Apply with the included dry sponge or a powder brush over the face or shiny areas.",
    imageUrls: [
      `${MR}/2019/11/mon-reve-compact-powder05b.jpg`,
      `${MR}/2019/11/mon-reve-compact-powder-closed.jpg`,
      `${TP}/5736-large_default/mon-reve-matte-skin-compact-powder-105.jpg`,
      `${TP}/5737-large_default/mon-reve-matte-skin-compact-powder-105.jpg`,
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
  const search = await api<
    { data?: Array<{ id: string; name?: string; nameEn?: string }> } | Array<{ id: string; name?: string; nameEn?: string }>
  >(`/brands?search=${encodeURIComponent("Mon Reve")}&limit=20`);
  const rows = Array.isArray(search) ? search : (search.data ?? []);
  const exact = rows.find((b) => {
    const n = `${b.name ?? ""} ${b.nameEn ?? ""}`.toLowerCase();
    return n.includes("mon reve") || n.includes("mon rêve") || n.includes("مون ريف");
  });
  if (exact?.id) {
    console.log(`Brand: Mon Reve (${exact.id}) [exact search]`);
    return exact.id;
  }
  const created = await api<{ id: string }>("/brands", "POST", {
    name: "Mon Reve",
    nameAr: "مون ريف",
    nameEn: "Mon Reve",
  });
  console.log(`Brand: Mon Reve (${created.id}) [created]`);
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

async function deleteIfExists(barcode: string) {
  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${barcode}`,
  );
  if (!check.exists || !check.product?.id) return;
  console.log(`  deleting existing: ${check.product.nameAr ?? check.product.id}`);
  await api(`/products/${check.product.id}`, "DELETE");
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length} (separate SKUs, no shades)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();
  console.log("");

  let added = 0;
  const results: Array<{ barcode: string; id: string; nameEn: string; images: number }> = [];

  for (const product of PRODUCTS) {
    console.log(`--- ${product.barcode} | ${product.nameEn} ---`);
    await deleteIfExists(product.barcode);

    console.log(`  uploading ${product.imageUrls.length} images...`);
    const imageIds: string[] = [];
    for (let i = 0; i < product.imageUrls.length; i++) {
      try {
        const id = await uploadImage(product.imageUrls[i], `${product.slug}-${i + 1}`);
        imageIds.push(id);
        console.log(`    ✓ img ${i + 1}/${product.imageUrls.length}`);
      } catch (err) {
        console.log(`    ✗ img ${i + 1} skipped: ${err instanceof Error ? err.message : err}`);
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    if (imageIds.length === 0) throw new Error(`No images uploaded for ${product.barcode}`);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId,
      categoryId: MAKEUP,
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
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Done — added ${added}/${PRODUCTS.length}\n`);
  for (const r of results) {
    console.log(`${r.barcode} → ${r.id} | ${r.images} imgs | ${r.nameEn}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
