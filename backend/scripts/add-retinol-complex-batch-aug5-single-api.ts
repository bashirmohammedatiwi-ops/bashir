/**
 * Retinol Complex — 35 separate SKUs (NO shades, NO images).
 * High-accuracy bilingual AR/EN names & descriptions for Iraqi market.
 *
 * Usage: npx tsx scripts/add-retinol-complex-batch-aug5-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const CARE_FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const CLEANSERS = "05028a17-da64-4c66-b25f-73c758acc2f8";
const FACE_MOIST = "21801439-d0e9-4106-b5e8-dfdd70ffeb8d";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const OIL_MASKS = "ab7c66e4-4df6-474f-b9d2-dd059dd60bfc";
const HAIR_TREATMENT = "ee39d6a6-5074-43b6-a80c-a7c1b23c3bd1";
const BODY = "23aaaa07-91ee-4937-847e-d7866a9e937a";
const FOOT = "905db637-498a-49bc-83e8-b3d0a335d5b6";
const FOOT_CREAM = "d2cf1ce9-fd36-4292-80f3-9fb90c759a3c";
const DEODORANT = "9464c921-9650-421f-8e2b-6a172f7524c5";

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
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "8057190174440",
    slug: "retinol-complex-color-protection-shampoo-henna-keratin-collagen-500ml",
    sku: "RCT-174440",
    price: 15000,
    originalPrice: 17000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريتينول كومبلكس - شامبو حماية اللون Henna Keratin Collagen 500 مل",
    nameEn: "Retinol Complex - Color Protection Shampoo Henna Keratin Collagen 500ml",
    descriptionAr:
      "شامبو حماية اللون من ريتينول كومبلكس — يحمي لون الشعر المصبوغ ويمنحه لمعاناً صحياً مع تركيبة غنية بالحناء والكيراتين والكولاجين.\n\n" +
      "• ينظّف بلطف دون سحب اللون أو بهتانه — مثالي للشعر الملوّن والهايلايت.\n" +
      "• الكيراتين والكولاجين يعزّزان قوة الألياف ويقلّلان التقصف.\n" +
      "• مستخلص الحناء يدعم ثبات اللون ويمنح لمعاناً طبيعياً.\n" +
      "• 500 مل — للاستخدام اليومي أو بالتناوب مع بلسم السلسلة.",
    descriptionEn:
      "Retinol Complex Color Protection Shampoo — gently cleanses coloured and highlighted hair while protecting vibrancy with henna, keratin and collagen.\n\n" +
      "• Mild formula that won't strip or fade colour.\n" +
      "• Keratin and collagen strengthen fibres and reduce breakage.\n" +
      "• Henna extract supports colour longevity and healthy shine.\n" +
      "• 500ml — use daily or alternate with the matching conditioner.",
  },
  {
    barcode: "8057190174488",
    slug: "retinol-complex-intensive-anti-yellow-shampoo-keratin-camellia-500ml",
    sku: "RCT-174488",
    price: 15500,
    originalPrice: 17500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريتينول كومبلكس - شامبو مكثّف ضد الاصفرار Keratin Camellia 500 مل",
    nameEn: "Retinol Complex - Intensive Anti-Yellow Shampoo Keratin Camellia 500ml",
    descriptionAr:
      "شامبو مكثّف ضد الاصفرار من ريتينول كومبلكس — يزيل البقع الصفراء والبرتقالية من الشعر الأشقر والرمادي والأبيض مع كيراتين وزهر الكاميليا.\n\n" +
      "• يوحّد درجة اللون ويعيد الباردة والنقاء للشعر المصبوغ.\n" +
      "• الكيراتين يقوّي الألياف والكاميليا تغذّي وتنعّم.\n" +
      "• مثالي للشعر البلاتيني والرمادي في المناخ الحار.\n" +
      "• 500 مل — استخدميه 1–2 مرات أسبوعياً أو حسب الحاجة.",
    descriptionEn:
      "Retinol Complex Intensive Anti-Yellow Shampoo — neutralises brassy yellow and orange tones on blonde, grey and white hair with keratin and camellia.\n\n" +
      "• Restores cool, clean tone to bleached and highlighted hair.\n" +
      "• Keratin strengthens; camellia nourishes and softens.\n" +
      "• Ideal for platinum, silver and ash blonde maintenance.\n" +
      "• 500ml — use 1–2 times weekly or as needed.",
  },
  {
    barcode: "8057190174358",
    slug: "retinol-complex-purifying-anti-dandruff-shampoo-nettle-keratin-500ml",
    sku: "RCT-174358",
    price: 14000,
    originalPrice: 16000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريتينول كومبلكس - شامبو منقّي ضد القشرة Nettle Keratin 500 مل",
    nameEn: "Retinol Complex - Purifying Anti-Dandruff Shampoo Nettle Keratin 500ml",
    descriptionAr:
      "شامبو منقّي ضد القشرة من ريتينول كومبلكس — ينظّف فروة الرأس بعمق ويقلّل القشرة والحكة مع مستخلص القراص والكيراتين.\n\n" +
      "• يوازن فروة الرأس الدهنية أو المتهيّجة دون جفاف مفرط.\n" +
      "• القراص يهدّئ وينقّي؛ الكيراتين يعزّز قوة الشعر.\n" +
      "• مناسب للاستخدام المنتظم في فصل الشتاء والصيف العراقي.\n" +
      "• 500 مل — دلكي فروة الرأس بلطف ثم اشطفي جيداً.",
    descriptionEn:
      "Retinol Complex Purifying Anti-Dandruff Shampoo — deep-cleanses the scalp and helps reduce flakes and itch with nettle extract and keratin.\n\n" +
      "• Balances oily or irritated scalps without over-drying.\n" +
      "• Nettle soothes and purifies; keratin strengthens hair.\n" +
      "• Suitable for regular use year-round.\n" +
      "• 500ml — massage into scalp, rinse thoroughly.",
  },
  {
    barcode: "8057190174303",
    slug: "retinol-complex-intensive-anti-frizz-shampoo-flaxseed-collagen-aloe-500ml",
    sku: "RCT-174303",
    price: 14500,
    originalPrice: 16500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريتينول كومبلكس - شامبو مكثّف ضد الهيشان Flaxseed Collagen Aloe 500 مل",
    nameEn: "Retinol Complex - Intensive Anti-Frizz Shampoo Flaxseed Collagen Aloe 500ml",
    descriptionAr:
      "شامبو مكثّف ضد الهيشان من ريتينول كومبلكس — يسيطر على التجعد والهيشان ويمنح شعراً ناعماً قابلاً للتمشيط مع بذور الكتان والكولاجين والألوفيرا.\n\n" +
      "• يرطّب الألياف ويغلّفها بطبقة حماية ضد الرطوبة.\n" +
      "• الكولاجين يعزّز المرونة؛ الألوفيرا يهدّئ وينعّم.\n" +
      "• مثالي للشعر المجعد والجاف والمعرّض للرطوبة.\n" +
      "• 500 مل — أكملي ببلسم أو ماسك السلسلة.",
    descriptionEn:
      "Retinol Complex Intensive Anti-Frizz Shampoo — tames frizz and flyaways for smoother, more manageable hair with flaxseed, collagen and aloe.\n\n" +
      "• Hydrates fibres and helps shield against humidity.\n" +
      "• Collagen boosts elasticity; aloe soothes and softens.\n" +
      "• Ideal for curly, dry and humidity-prone hair.\n" +
      "• 500ml — follow with the matching conditioner or mask.",
  },
  {
    barcode: "8057190174501",
    slug: "retinol-complex-anti-hair-loss-shampoo-panthenol-ceramides-nettle-500ml",
    sku: "RCT-174501",
    price: 16000,
    originalPrice: 18000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريتينول كومبلكس - شامبو ضد تساقط الشعر Panthenol Ceramides Nettle 500 مل",
    nameEn: "Retinol Complex - Anti-Hair-Loss Shampoo Panthenol Ceramides Nettle 500ml",
    descriptionAr:
      "شامبو ضد تساقط الشعر من ريتينول كومبلكس — يقوّي الجذور ويقلّل التساقط مع بانثينول وسيراميدات ومستخلص القراص.\n\n" +
      "• ينظّف فروة الرأس بلطف ويحفّز بيئة صحية للنمو.\n" +
      "• السيراميدات تعيد بناء حاجز الرطوبة؛ البانثينول يرطّب ويهدّئ.\n" +
      "• مناسب للتساقط الموسمي والشعر الضعيف بعد الصبغ.\n" +
      "• 500 مل — للاستخدام المنتظم مع سيروم أو أمبولات السلسلة.",
    descriptionEn:
      "Retinol Complex Anti-Hair-Loss Shampoo — strengthens roots and helps reduce shedding with panthenol, ceramides and nettle extract.\n\n" +
      "• Gently cleanses scalp for a healthier growth environment.\n" +
      "• Ceramides rebuild moisture barrier; panthenol hydrates and soothes.\n" +
      "• Ideal for seasonal shedding and weakened, colour-treated hair.\n" +
      "• 500ml — use regularly with the matching serum or ampoules.",
  },
  {
    barcode: "8057190174402",
    slug: "retinol-complex-volumizing-shampoo-collagen-quinoa-500ml",
    sku: "RCT-174402",
    price: 14500,
    originalPrice: 16500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريتينول كومبلكس - شامبو تكثيف الحجم Collagen Quinoa 500 مل",
    nameEn: "Retinol Complex - Volumizing Shampoo Collagen Quinoa 500ml",
    descriptionAr:
      "شامبو تكثيف الحجم من ريتينول كومبلكس — يمنح الشعر الخفيف والرقيق مظهراً أكثر امتلاءً ورفعاً من الجذور مع الكولاجين والكينوا.\n\n" +
      "• ينظّف دون إثقال — يترك خصلات خفيفة ومنتفخة.\n" +
      "• الكولاجين يدعم قوة الألياف؛ الكينوا تغذّي ببروتينات نباتية.\n" +
      "• مثالي للشعر الناعم والمسطح الذي يفقد الحجم بسرعة.\n" +
      "• 500 مل — جفّفي بالتصويب من الجذور للأطراف.",
    descriptionEn:
      "Retinol Complex Volumizing Shampoo — gives fine, flat hair a fuller, lifted look from the roots with collagen and quinoa.\n\n" +
      "• Cleanses without weighing hair down.\n" +
      "• Collagen supports fibre strength; quinoa delivers plant proteins.\n" +
      "• Ideal for limp, volume-lacking hair.\n" +
      "• 500ml — blow-dry lifting from roots for best results.",
  },
  {
    barcode: "8057190174518",
    slug: "retinol-complex-anti-hair-loss-conditioner-ceramides-panthenol-nettle-500ml",
    sku: "RCT-174518",
    price: 15500,
    originalPrice: 17500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريتينول كومبلكس - بلسم ضد تساقط الشعر Ceramides Panthenol Nettle 500 مل",
    nameEn: "Retinol Complex - Anti-Hair-Loss Conditioner Ceramides Panthenol Nettle 500ml",
    descriptionAr:
      "بلسم ضد تساقط الشعر من ريتينول كومبلكس — يكمل علاج التساقط بترطيب عميق وتقوية للألياف مع سيراميدات وبانثينول وقراص.\n\n" +
      "• يسهّل التمشيط ويقلّل التكسر بعد الاستحمام.\n" +
      "• يعزّز مرونة الشعر ويحمي الأطراف الهشة.\n" +
      "• مكمّل مثالي لشامبو Anti-Hair-Loss من نفس العلامة.\n" +
      "• 500 مل — اتركيه 2–3 دقائق ثم اشطفي.",
    descriptionEn:
      "Retinol Complex Anti-Hair-Loss Conditioner — complements the anti-loss routine with deep moisture and fibre strengthening via ceramides, panthenol and nettle.\n\n" +
      "• Detangles and helps reduce post-wash breakage.\n" +
      "• Boosts elasticity and protects fragile ends.\n" +
      "• Perfect partner to the Anti-Hair-Loss Shampoo.\n" +
      "• 500ml — leave on 2–3 minutes, then rinse.",
  },
  {
    barcode: "8057190174419",
    slug: "retinol-complex-volumizing-conditioner-collagen-brown-algae-quinoa-500ml",
    sku: "RCT-174419",
    price: 15000,
    originalPrice: 17000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريتينول كومبلكس - بلسم تكثيف الحجم Collagen Brown Algae Quinoa 500 مل",
    nameEn: "Retinol Complex - Volumizing Conditioner Collagen Brown Algae Quinoa 500ml",
    descriptionAr:
      "بلسم تكثيف الحجم من ريتينول كومبلكس — يمنح الشعر الخفيف حجمًا ونعومة دون ثقل مع كولاجين وأعشاب بنية وكينوا.\n\n" +
      "• يرطّب ويفك التشابك مع إحساس خفيف ومرن.\n" +
      "• الأعشاب البحرية تغذّي؛ الكولاجين يدعم البنية.\n" +
      "• مثالي بعد شامبو Volumizing لإطلالة أكثر امتلاءً.\n" +
      "• 500 مل — ركّزي على الأطوال والأطراف.",
    descriptionEn:
      "Retinol Complex Volumizing Conditioner — adds body and softness to fine hair without heaviness, with collagen, brown algae and quinoa.\n\n" +
      "• Moisturises and detangles with a lightweight, bouncy feel.\n" +
      "• Brown algae nourish; collagen supports structure.\n" +
      "• Best paired with the Volumizing Shampoo.\n" +
      "• 500ml — focus on mid-lengths and ends.",
  },
  {
    barcode: "8057190175546",
    slug: "retinol-complex-intensive-anti-yellow-conditioner-keratin-collagen-camellia-500ml",
    sku: "RCT-175546",
    price: 15500,
    originalPrice: 17500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريتينول كومبلكس - بلسم مكثّف ضد الاصفرار Keratin Collagen Camellia 500 مل",
    nameEn: "Retinol Complex - Intensive Anti-Yellow Conditioner Keratin Collagen Camellia 500ml",
    descriptionAr:
      "بلسم مكثّف ضد الاصفرار من ريتينول كومبلكس — يكمّل الشامبو المضاد للاصفرار بترطيب وتنعيم مع الحفاظ على درجة اللون الباردة.\n\n" +
      "• كيراتين وكولاجين لتقوية الشعر الأشقر والرمادي.\n" +
      "• زهر الكاميليا يغذّي ويمنح لمعاناً حريرياً.\n" +
      "• يقلّل الهيشان ويحسّن قابلية التصفيف.\n" +
      "• 500 مل — استخدميه بعد الشامبو المضاد للاصفرار.",
    descriptionEn:
      "Retinol Complex Intensive Anti-Yellow Conditioner — pairs with the anti-yellow shampoo to hydrate, smooth and maintain cool blonde/grey tones.\n\n" +
      "• Keratin and collagen strengthen bleached and silver hair.\n" +
      "• Camellia nourishes for silky shine.\n" +
      "• Reduces frizz and improves manageability.\n" +
      "• 500ml — use after the Anti-Yellow Shampoo.",
  },
  {
    barcode: "8057190174310",
    slug: "retinol-complex-anti-frizz-conditioner-shea-ginseng-flaxseed-500ml",
    sku: "RCT-174310",
    price: 15000,
    originalPrice: 17000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريتينول كومبلكس - بلسم ضد الهيشان Shea Ginseng Flaxseed 500 مل",
    nameEn: "Retinol Complex - Anti-Frizz Conditioner Shea Ginseng Flaxseed 500ml",
    descriptionAr:
      "بلسم ضد الهيشان من ريتينول كومبلكس — يرطّب بعمق ويسيطر على التجعد مع زبدة الشيا والجينسنغ وبذور الكتان.\n\n" +
      "• يفك التشابك ويمنح ملمساً ناعماً حريرياً.\n" +
      "• الجينسنغ ينشّط فروة الرأس؛ الشيا تغلّف بالرطوبة.\n" +
      "• مثالي للشعر المجعد والجاف والمعرّض للرطوبة.\n" +
      "• 500 مل — اتركيه دقيقتين ثم اشطفي جيداً.",
    descriptionEn:
      "Retinol Complex Anti-Frizz Conditioner — deep moisture and frizz control with shea butter, ginseng and flaxseed.\n\n" +
      "• Detangles for a silky, smooth finish.\n" +
      "• Ginseng energises scalp; shea seals in hydration.\n" +
      "• Ideal for curly, dry and humidity-prone hair.\n" +
      "• 500ml — leave 2 minutes, rinse well.",
  },
  {
    barcode: "8057190174365",
    slug: "retinol-complex-purifying-anti-dandruff-conditioner-nettle-eucalyptus-sage-500ml",
    sku: "RCT-174365",
    price: 14500,
    originalPrice: 16500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريتينول كومبلكس - بلسم منقّي ضد القشرة Nettle Eucalyptus Sage 500 مل",
    nameEn: "Retinol Complex - Purifying Anti-Dandruff Conditioner Nettle Eucalyptus Sage 500ml",
    descriptionAr:
      "بلسم منقّي ضد القشرة من ريتينول كومبلكس — يهدّئ فروة الرأس ويرطّب الأطوال دون إثقال مع قراص وكاوبرتس ومرمرية.\n\n" +
      "• يكمّل شامبو Anti-Dandruff لروتين متكامل ضد القشرة.\n" +
      "• الأوكالبتوس ينعش وينقّي؛ المرمرية توازن الدهون.\n" +
      "• يقلّل الحكة ويترك شعراً ناعماً قابلاً للتمشيط.\n" +
      "• 500 مل — تجنّبي وضعه مباشرة على فروة الرأس الحساسة جداً.",
    descriptionEn:
      "Retinol Complex Purifying Anti-Dandruff Conditioner — soothes scalp and hydrates lengths with nettle, eucalyptus and sage.\n\n" +
      "• Completes the anti-dandruff shampoo routine.\n" +
      "• Eucalyptus refreshes; sage helps balance scalp oils.\n" +
      "• Reduces itch and leaves hair soft and manageable.\n" +
      "• 500ml — focus on lengths; avoid very irritated scalp if sensitive.",
  },
  {
    barcode: "8057190174457",
    slug: "retinol-complex-color-protection-conditioner-henna-collagen-500ml",
    sku: "RCT-174457",
    price: 15000,
    originalPrice: 17000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريتينول كومبلكس - بلسم حماية اللون Henna Collagen 500 مل",
    nameEn: "Retinol Complex - Color Protection Conditioner Henna Collagen 500ml",
    descriptionAr:
      "بلسم حماية اللون من ريتينول كومبلكس — يحافظ على حيوية اللون ويرطّب الشعر المصبوغ مع حناء وكولاجين.\n\n" +
      "• يغلّف الألياف بطبقة واقية ضد بهتان اللون.\n" +
      "• يسهّل التمشيط ويقلّل التقصف على الأطراف.\n" +
      "• مكمّل أساسي لشامبو Color Protection.\n" +
      "• 500 مل — للاستخدام بعد كل غسلة.",
    descriptionEn:
      "Retinol Complex Color Protection Conditioner — locks in colour vibrancy and hydrates treated hair with henna and collagen.\n\n" +
      "• Protective coating helps prevent colour fade.\n" +
      "• Detangles and reduces split ends.\n" +
      "• Essential partner to the Color Protection Shampoo.\n" +
      "• 500ml — use after every wash.",
  },
  {
    barcode: "8057190174327",
    slug: "retinol-complex-nourishing-anti-frizz-hair-mask-flaxseed-collagen-aloe-300ml",
    sku: "RCT-174327",
    price: 17000,
    originalPrice: 19500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "ريتينول كومبلكس - ماسك شعر مغذّي ضد الهيشان Flaxseed Collagen Aloe 300 مل",
    nameEn: "Retinol Complex - Nourishing Anti-Frizz Hair Mask Flaxseed Collagen Aloe 300ml",
    descriptionAr:
      "ماسك شعر مغذّي ضد الهيشان من ريتينول كومبلكس — علاج مكثّف يرطّب ويغذّي الشعر الجاف والمجعد مع بذور الكتان والكولاجين والألوفيرا.\n\n" +
      "• يعيد النعومة والمرونة ويسيطر على التجعد لفترة أطول.\n" +
      "• مثالي أسبوعياً أو بعد التعرض للشمس والكلور.\n" +
      "• يترك شعراً لامعاً حريرياً دون ثقل.\n" +
      "• 300 مل — اتركيه 5–10 دقائق ثم اشطفي.",
    descriptionEn:
      "Retinol Complex Nourishing Anti-Frizz Hair Mask — intensive treatment that nourishes dry, frizzy hair with flaxseed, collagen and aloe.\n\n" +
      "• Restores softness, elasticity and long-lasting frizz control.\n" +
      "• Use weekly or after sun, chlorine or heat exposure.\n" +
      "• Leaves hair silky and shiny without heaviness.\n" +
      "• 300ml — leave 5–10 minutes, rinse thoroughly.",
  },
  {
    barcode: "8057190174372",
    slug: "retinol-complex-anti-dandruff-balancing-hair-mask-hydrolyzed-keratin-300ml",
    sku: "RCT-174372",
    price: 16500,
    originalPrice: 19000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "ريتينول كومبلكس - ماسك شعر موازن ضد القشرة Hydrolyzed Keratin 300 مل",
    nameEn: "Retinol Complex - Anti-Dandruff Balancing Hair Mask Hydrolyzed Keratin 300ml",
    descriptionAr:
      "ماسك شعر موازن ضد القشرة من ريتينول كومبلكس — يهدّئ فروة الرأس ويعيد توازنها مع كيراتين متحلّل للأطوال.\n\n" +
      "• يقلّل القشرة والحكة مع ترطيب الألياف.\n" +
      "• الكيراتين المتحلّل يعزّز قوة الشعر الضعيف.\n" +
      "• علاج أسبوعي مكمّل لروتين Anti-Dandruff.\n" +
      "• 300 مل — دلكي فروة الرأس بلطف واتركي 5–10 دقائق.",
    descriptionEn:
      "Retinol Complex Anti-Dandruff Balancing Hair Mask — soothes and rebalances the scalp while hydrolyzed keratin strengthens lengths.\n\n" +
      "• Helps reduce flakes and itch with fibre hydration.\n" +
      "• Hydrolyzed keratin reinforces weakened hair.\n" +
      "• Weekly treatment to boost the anti-dandruff routine.\n" +
      "• 300ml — massage into scalp, leave 5–10 minutes.",
  },
  {
    barcode: "8057190174525",
    slug: "retinol-complex-anti-hair-loss-hair-mask-ceramides-panthenol-nettle-500ml",
    sku: "RCT-174525",
    price: 18500,
    originalPrice: 21000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "ريتينول كومبلكس - ماسك شعر ضد التساقط Ceramides Panthenol Nettle 500 مل",
    nameEn: "Retinol Complex - Anti-Hair-Loss Hair Mask Ceramides Panthenol Nettle 500ml",
    descriptionAr:
      "ماسك شعر ضد التساقط من ريتينول كومبلكس — علاج مكثّف يقوّي الجذور ويغذّي الألياف بسيراميدات وبانثينول وقراص.\n\n" +
      "• يقلّل التكسر ويحسّن كثافة مظهر الشعر مع الاستخدام المنتظم.\n" +
      "• يرطّب بعمق دون إثقال فروة الرأس.\n" +
      "• مثالي مرة إلى مرتين أسبوعياً مع شامبو وبلسم السلسلة.\n" +
      "• 500 مل — اتركيه 10–15 دقيقة ثم اشطفي.",
    descriptionEn:
      "Retinol Complex Anti-Hair-Loss Hair Mask — intensive root-to-tip treatment with ceramides, panthenol and nettle to strengthen and nourish.\n\n" +
      "• Helps reduce breakage and improve the look of density over time.\n" +
      "• Deep hydration without weighing down the scalp.\n" +
      "• Use 1–2 times weekly with the matching shampoo and conditioner.\n" +
      "• 500ml — leave 10–15 minutes, rinse well.",
  },
  {
    barcode: "8057190175522",
    slug: "retinol-complex-anti-yellow-hair-mask-collagen-keratin-300ml",
    sku: "RCT-175522",
    price: 17000,
    originalPrice: 19500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "ريتينول كومبلكس - ماسك شعر ضد الاصفرار Collagen Keratin 300 مل",
    nameEn: "Retinol Complex - Anti-Yellow Hair Mask Collagen Keratin 300ml",
    descriptionAr:
      "ماسك شعر ضد الاصفرار من ريتينول كومبلكس — يعيد اللمعان البارد للشعر الأشقر والرمادي مع كولاجين وكيراتين.\n\n" +
      "• يوحّد اللون ويقلّل البقع الصفراء والبرتقالية.\n" +
      "• ينعّم ويقوّي الشعر المصبوغ والمبيّض.\n" +
      "• علاج أسبوعي مثالي مع شامبو وبلسم Anti-Yellow.\n" +
      "• 300 مل — اتركيه 5–10 دقائق حسب شدة الاصفرار.",
    descriptionEn:
      "Retinol Complex Anti-Yellow Hair Mask — restores cool shine to blonde and grey hair with collagen and keratin.\n\n" +
      "• Neutralises yellow and brassy tones.\n" +
      "• Smooths and strengthens bleached, highlighted hair.\n" +
      "• Weekly boost to the Anti-Yellow shampoo and conditioner.\n" +
      "• 300ml — leave 5–10 minutes depending on brassiness.",
  },
  {
    barcode: "8057190174464",
    slug: "retinol-complex-color-protection-hair-mask-collagen-keratin-300ml",
    sku: "RCT-174464",
    price: 17000,
    originalPrice: 19500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "ريتينول كومبلكس - ماسك شعر حماية اللون Collagen Keratin 300 مل",
    nameEn: "Retinol Complex - Color Protection Hair Mask Collagen Keratin 300ml",
    descriptionAr:
      "ماسك شعر حماية اللون من ريتينول كومبلكس — يثبّت اللون ويرطّب الشعر المصبوغ بعمق مع كولاجين وكيراتين.\n\n" +
      "• يعيد اللمعان ويقلّل الجفاف الناتج عن الصبغ المتكرر.\n" +
      "• يقوّي الألياف ويحمي من التقصف.\n" +
      "• استخدميه أسبوعياً مع شامبو وبلسم Color Protection.\n" +
      "• 300 مل — اتركيه 5–10 دقائق على الأطوال والأطراف.",
    descriptionEn:
      "Retinol Complex Color Protection Hair Mask — locks in colour and deeply hydrates treated hair with collagen and keratin.\n\n" +
      "• Restores shine and fights dryness from frequent colouring.\n" +
      "• Strengthens fibres and helps prevent breakage.\n" +
      "• Weekly treatment with the Color Protection range.\n" +
      "• 300ml — leave 5–10 minutes on mid-lengths and ends.",
  },
  {
    barcode: "8057190171340",
    slug: "retinol-complex-10-in-1-hair-treatment-leave-in-100ml",
    sku: "RCT-171340",
    price: 16000,
    originalPrice: 18000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "ريتينول كومبلكس - علاج شعر 10 في 1 بدون شطف Leave-In 100 مل",
    nameEn: "Retinol Complex - 10-in-1 Hair Treatment Leave-In 100ml",
    descriptionAr:
      "علاج شعر 10 في 1 بدون شطف من ريتينول كومبلكس — حل متكامل للتغذية والحماية والتصفيف بخطوة واحدة.\n\n" +
      "• يرطّب، ينعّم، يقلّل الهيشان، يحمي من الحرارة ويسهّل التمشيط.\n" +
      "• لا يُشطف — مثالي بعد الاستحمام على الشعر الرطب أو الجاف.\n" +
      "• خفيف الوزن ولا يثقل الشعر — مناسب للاستخدام اليومي.\n" +
      "• 100 مل — رشّي أو وزّعي كمية صغيرة على الأطوال.",
    descriptionEn:
      "Retinol Complex 10-in-1 Leave-In Hair Treatment — all-in-one care for nourishment, protection and styling in a single step.\n\n" +
      "• Hydrates, smooths, fights frizz, eases detangling and helps heat protection.\n" +
      "• No-rinse formula — apply after shower on damp or dry hair.\n" +
      "• Lightweight for daily use without buildup.\n" +
      "• 100ml — spray or distribute a small amount through lengths.",
  },
  {
    barcode: "8057190170794",
    slug: "retinol-complex-keratin-hair-anti-hair-loss-ampoules-6x10ml",
    sku: "RCT-170794",
    price: 22000,
    originalPrice: 25000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "ريتينول كومبلكس - أمبولات شعر كيراتين ضد التساقط 6×10 مل",
    nameEn: "Retinol Complex - Keratin Hair Anti-Hair-Loss Ampoules 6x10ml",
    descriptionAr:
      "أمبولات شعر كيراتين ضد التساقط من ريتينول كومبلكس — علاج مكثّف لفروة الرأس والجذور في دورة 6 أمبولات.\n\n" +
      "• تركيز عالٍ من الكيراتين ومكوّنات مقاومة التساقط.\n" +
      "• تُوزّع على فروة الرأس بعد الغسيل ولا تُشطف.\n" +
      "• مثالية للتساقط الموسمي والشعر الضعيف بعد الإجهاد.\n" +
      "• 6 أمبولات × 10 مل — دورة كاملة أسبوعية أو كل 3 أيام.",
    descriptionEn:
      "Retinol Complex Keratin Anti-Hair-Loss Ampoules — concentrated scalp and root treatment in a 6-ampoule course.\n\n" +
      "• High keratin concentration with anti-loss actives.\n" +
      "• Apply to scalp after washing; do not rinse.\n" +
      "• Ideal for seasonal shedding and stressed, weakened hair.\n" +
      "• 6 ampoules x 10ml — complete course weekly or every 3 days.",
  },
  {
    barcode: "8057190170787",
    slug: "retinol-complex-keratin-hair-purifying-anti-dandruff-ampoules-6x10ml",
    sku: "RCT-170787",
    price: 21000,
    originalPrice: 24000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "ريتينول كومبلكس - أمبولات شعر كيراتين منقّية ضد القشرة 6×10 مل",
    nameEn: "Retinol Complex - Keratin Hair Purifying Anti-Dandruff Ampoules 6x10ml",
    descriptionAr:
      "أمبولات شعر كيراتين منقّية ضد القشرة من ريتينول كومبلكس — علاج موضعي مكثّف لفروة الرأس المعرّضة للقشرة.\n\n" +
      "• تنقّي وتهدّئ فروة الرأس وتقلّل الحكة والقشرة.\n" +
      "• الكيراتين يدعم قوة الشعر أثناء العلاج.\n" +
      "• تُطبّق على فروة الرأس النظيفة دون شطف.\n" +
      "• 6 أمبولات × 10 مل — دورة علاجية مع شامبو Anti-Dandruff.",
    descriptionEn:
      "Retinol Complex Keratin Purifying Anti-Dandruff Ampoules — targeted intensive scalp treatment for flaky, irritated scalps.\n\n" +
      "• Purifies, soothes and helps reduce dandruff and itch.\n" +
      "• Keratin supports hair strength during treatment.\n" +
      "• Apply to clean scalp; do not rinse.\n" +
      "• 6 ampoules x 10ml — course alongside Anti-Dandruff Shampoo.",
  },
  {
    barcode: "8057190170770",
    slug: "retinol-complex-keratin-hair-restructuring-ampoules-6x10ml",
    sku: "RCT-170770",
    price: 21000,
    originalPrice: 24000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "ريتينول كومبلكس - أمبولات شعر كيراتين لإعادة البناء 6×10 مل",
    nameEn: "Retinol Complex - Keratin Hair Restructuring Ampoules 6x10ml",
    descriptionAr:
      "أمبولات شعر كيراتين لإعادة البناء من ريتينول كومبلكس — تعيد هيكلة الألياف التالفة والجافة بعد الصبغ والحرارة.\n\n" +
      "• كيراتين مركّز يملأ التلف ويعيد المرونة.\n" +
      "• تُوزّع على الشعر الرطب أو الجاف مع تدليك خفيف.\n" +
      "• مثالية بعد الصبغ أو التسوية أو التعرض للشمس.\n" +
      "• 6 أمبولات × 10 مل — لا تُشطف؛ جفّفي كالمعتاد.",
    descriptionEn:
      "Retinol Complex Keratin Restructuring Ampoules — rebuilds damaged, dry fibres after colouring, heat and chemical treatments.\n\n" +
      "• Concentrated keratin fills damage and restores elasticity.\n" +
      "• Apply to damp or dry hair with gentle massage.\n" +
      "• Ideal after colour, straightening or sun exposure.\n" +
      "• 6 ampoules x 10ml — no rinse; style as usual.",
  },
  {
    barcode: "8057190173382",
    slug: "retinol-complex-exfoliating-shampoo-scrub-hyaluronic-acid-400ml",
    sku: "RCT-173382",
    price: 15500,
    originalPrice: 17500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريتينول كومبلكس - شامبو سكراب مقشّر للفروة Hyaluronic Acid 400 مل",
    nameEn: "Retinol Complex - Exfoliating Shampoo Scrub Hyaluronic Acid 400ml",
    descriptionAr:
      "شامبو سكراب مقشّر للفروة من ريتينول كومبلكس — ينظّف ويقشّر فروة الرأس بلطف مع هيالورونيك أسيد للترطيب.\n\n" +
      "• يزيل تراكم المنتجات والخلايا الميتة والدهون الزائدة.\n" +
      "• يحفّز الدورة الدموية ويمنح إحساساً بالانتعاش.\n" +
      "• مثالي مرة أسبوعياً للشعر الدهني أو فروة الرأس المتهيّجة.\n" +
      "• 400 مل — دلكي بحركات دائرية ثم اشطفي جيداً.",
    descriptionEn:
      "Retinol Complex Exfoliating Shampoo Scrub — gently exfoliates and cleanses the scalp with hyaluronic acid for balanced hydration.\n\n" +
      "• Removes product buildup, dead cells and excess oil.\n" +
      "• Stimulates microcirculation for a fresh, clean feel.\n" +
      "• Use weekly for oily scalp or congested roots.\n" +
      "• 400ml — massage in circular motions, rinse thoroughly.",
  },
  {
    barcode: "8057190174471",
    slug: "retinol-complex-color-protection-hair-serum-henna-collagen-100ml",
    sku: "RCT-174471",
    price: 18000,
    originalPrice: 20500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "ريتينول كومبلكس - سيروم شعر حماية اللون Henna Collagen 100 مل",
    nameEn: "Retinol Complex - Color Protection Hair Serum Henna Collagen 100ml",
    descriptionAr:
      "سيروم شعر حماية اللون من ريتينول كومبلكس — يثبّت اللون ويمنح لمعاناً فورياً مع حناء وكولاجين.\n\n" +
      "• يحمي من بهتان اللون والحرارة والرطوبة.\n" +
      "• ينعّم الأطراف ويقلّل التقصف على الشعر المصبوغ.\n" +
      "• يُطبّق على الشعر الرطب أو الجاف قبل التصفيف.\n" +
      "• 100 مل — بضع قطرات على الأطوال والأطراف.",
    descriptionEn:
      "Retinol Complex Color Protection Hair Serum — locks in colour and delivers instant shine with henna and collagen.\n\n" +
      "• Helps shield against fade, heat and humidity.\n" +
      "• Smooths ends and reduces breakage on coloured hair.\n" +
      "• Apply to damp or dry hair before styling.\n" +
      "• 100ml — a few drops through mid-lengths and ends.",
  },
  {
    barcode: "8057190174433",
    slug: "retinol-complex-volumizing-hair-serum-collagen-rice-proteins-moringa-100ml",
    sku: "RCT-174433",
    price: 17500,
    originalPrice: 20000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "ريتينول كومبلكس - سيروم شعر تكثيف الحجم Collagen Rice Proteins Moringa 100 مل",
    nameEn: "Retinol Complex - Volumizing Hair Serum Collagen Rice Proteins Moringa 100ml",
    descriptionAr:
      "سيروم شعر تكثيف الحجم من ريتينول كومبلكس — يمنح الشعر الخفيف حجمًا ورفعاً من الجذور مع كولاجين وبروتينات الأرز والمورينجا.\n\n" +
      "• خفيف الوزن ولا يثقل الخصلات.\n" +
      "• يعزّز التماسك والمرونة مع لمعان صحي.\n" +
      "• مثالي قبل التجفيف للحصول على حجم أقصى.\n" +
      "• 100 مل — وزّعي على الجذور والأطوال.",
    descriptionEn:
      "Retinol Complex Volumizing Hair Serum — boosts body and root lift on fine hair with collagen, rice proteins and moringa.\n\n" +
      "• Lightweight formula won't weigh hair down.\n" +
      "• Improves hold, elasticity and healthy shine.\n" +
      "• Apply before blow-drying for maximum volume.\n" +
      "• 100ml — distribute at roots and through lengths.",
  },
  {
    barcode: "8057190174334",
    slug: "retinol-complex-anti-frizz-hair-serum-spray-flaxseed-collagen-shea-100ml",
    sku: "RCT-174334",
    price: 17500,
    originalPrice: 20000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "ريتينول كومبلكس - سيروم شعر بخاخ ضد الهيشان Flaxseed Collagen Shea 100 مل",
    nameEn: "Retinol Complex - Anti-Frizz Hair Serum Spray Flaxseed Collagen Shea 100ml",
    descriptionAr:
      "سيروم شعر بخاخ ضد الهيشان من ريتينول كومبلكس — يسيطر على التجعد فوراً مع بذور الكتان والكولاجين وزبدة الشيا.\n\n" +
      "• صيغة بخاخ سهلة التطبيق على الشعر الجاف أو الرطب.\n" +
      "• يغلّف الألياف ويحمي من الرطوبة والحرارة.\n" +
      "• مثالي للشعر المجعد والجاف في الجو الحار.\n" +
      "• 100 مل — رشّي من مسافة 20 سم ووزّعي بالأصابع.",
    descriptionEn:
      "Retinol Complex Anti-Frizz Hair Serum Spray — instant frizz control with flaxseed, collagen and shea in an easy spray format.\n\n" +
      "• Quick application on dry or damp hair.\n" +
      "• Coats fibres to help shield against humidity and heat.\n" +
      "• Ideal for curly, dry hair in hot, humid weather.\n" +
      "• 100ml — spray 20 cm away, distribute with fingers.",
  },
  {
    barcode: "8057190174389",
    slug: "retinol-complex-purifying-anti-dandruff-hair-serum-nettle-eucalyptus-arnica-100ml",
    sku: "RCT-174389",
    price: 18000,
    originalPrice: 20500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "ريتينول كومبلكس - سيروم شعر منقّي ضد القشرة Nettle Eucalyptus Arnica 100 مل",
    nameEn: "Retinol Complex - Purifying Anti-Dandruff Hair Serum Nettle Eucalyptus Arnica 100ml",
    descriptionAr:
      "سيروم شعر منقّي ضد القشرة من ريتينول كومبلكس — علاج موضعي يهدّئ فروة الرأس مع قراص وأوكالبتوس وأرنيكا.\n\n" +
      "• يقلّل الحكة والقشرة بين غسلات الشعر.\n" +
      "• ينعش فروة الرأس دون جفاف مفرط.\n" +
      "• مكمّل مثالي لشامبو وبلسم Anti-Dandruff.\n" +
      "• 100 مل — طبّقي على فروة الرأس الجافة أو الرطبة.",
    descriptionEn:
      "Retinol Complex Purifying Anti-Dandruff Hair Serum — targeted scalp serum that soothes with nettle, eucalyptus and arnica.\n\n" +
      "• Helps reduce itch and flakes between washes.\n" +
      "• Refreshes scalp without over-drying.\n" +
      "• Perfect boost to the Anti-Dandruff shampoo and conditioner.\n" +
      "• 100ml — apply to dry or damp scalp.",
  },
  {
    barcode: "8057190175539",
    slug: "retinol-complex-anti-yellow-hair-serum-keratin-collagen-camellia-100ml",
    sku: "RCT-175539",
    price: 18500,
    originalPrice: 21000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "ريتينول كومبلكس - سيروم شعر ضد الاصفرار Keratin Collagen Camellia 100 مل",
    nameEn: "Retinol Complex - Anti-Yellow Hair Serum Keratin Collagen Camellia 100ml",
    descriptionAr:
      "سيروم شعر ضد الاصفرار من ريتينول كومبلكس — يحافظ على درجة اللون الباردة ويمنح لمعاناً للشعر الأشقر والرمادي.\n\n" +
      "• كيراتين وكولاجين للتقوية؛ كاميليا للتغذية.\n" +
      "• يقلّل البقع الصفراء بين الغسلات.\n" +
      "• يُطبّق على الشعر الرطب أو الجاف قبل التصفيف.\n" +
      "• 100 مل — بضع قطرات على الأطوال.",
    descriptionEn:
      "Retinol Complex Anti-Yellow Hair Serum — maintains cool blonde and grey tones with keratin, collagen and camellia.\n\n" +
      "• Keratin and collagen strengthen; camellia nourishes.\n" +
      "• Helps fight brassiness between washes.\n" +
      "• Apply to damp or dry hair before styling.\n" +
      "• 100ml — a few drops through lengths.",
  },
  {
    barcode: "8057190174532",
    slug: "retinol-complex-anti-hair-loss-serum-panthenol-ceramides-birch-100ml",
    sku: "RCT-174532",
    price: 19000,
    originalPrice: 21500,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "ريتينول كومبلكس - سيروم شعر ضد التساقط Panthenol Ceramides Birch 100 مل",
    nameEn: "Retinol Complex - Anti-Hair-Loss Serum Panthenol Ceramides Birch 100ml",
    descriptionAr:
      "سيروم شعر ضد التساقط من ريتينول كومبلكس — يقوّي الجذور ويحفّز فروة الرأس ببانثينول وسيراميدات ومستخلص البتولا.\n\n" +
      "• علاج يومي موضعي للتساقط الموسمي والمزمن.\n" +
      "• يرطّب فروة الرأس ويحسّن بيئة النمو.\n" +
      "• مكمّل لشامبو وبلسم وماسك Anti-Hair-Loss.\n" +
      "• 100 مل — دلكي فروة الرأس مرة إلى مرتين يومياً.",
    descriptionEn:
      "Retinol Complex Anti-Hair-Loss Serum — daily scalp treatment with panthenol, ceramides and birch extract to strengthen roots.\n\n" +
      "• Targeted care for seasonal and chronic shedding.\n" +
      "• Hydrates scalp and supports a healthier growth environment.\n" +
      "• Complements the full Anti-Hair-Loss range.\n" +
      "• 100ml — massage into scalp once or twice daily.",
  },
  {
    barcode: "8057190173221",
    slug: "retinol-complex-foot-and-shoe-deodorant-spray-100ml",
    sku: "RCT-173221",
    price: 9000,
    originalPrice: 10500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ريتينول كومبلكس - بخاخ مزيل عرق للقدم والحذاء 100 مل",
    nameEn: "Retinol Complex - Foot and Shoe Deodorant Spray 100ml",
    descriptionAr:
      "بخاخ مزيل عرق للقدم والحذاء من ريتينول كومبلكس — يقضي على الرائحة الكريهة ويمنح انتعاشاً طويل الأمد.\n\n" +
      "• يُستخدم على القدمين والجوارب والحذاء من الداخل.\n" +
      "• يجف بسرعة ولا يترك بقعاً على الجلد أو القماش.\n" +
      "• مثالي للصيف والرياضة والأحذية المغلقة.\n" +
      "• 100 مل — رشّ من مسافة 15 سم صباحاً وعند الحاجة.",
    descriptionEn:
      "Retinol Complex Foot and Shoe Deodorant Spray — eliminates unpleasant odour for long-lasting freshness on feet and footwear.\n\n" +
      "• Spray on feet, socks and inside shoes.\n" +
      "• Quick-dry formula; won't stain skin or fabric.\n" +
      "• Ideal for summer, sports and closed shoes.\n" +
      "• 100ml — spray 15 cm away morning and as needed.",
  },
  {
    barcode: "8057190176680",
    slug: "retinol-complex-sos-dark-spot-facial-cleansing-gel-100ml",
    sku: "RCT-176680",
    price: 15000,
    originalPrice: 17000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "ريتينول كومبلكس - جل منظف للوجه SOS Dark-Spot 100 مل",
    nameEn: "Retinol Complex - SOS Dark-Spot Facial Cleansing Gel 100ml",
    descriptionAr:
      "جل منظف للوجه SOS Dark-Spot من ريتينول كومبلكس — ينظّف بعمق ويهيّئ البشرة لعلاج البقع الداكنة والتصبغات.\n\n" +
      "• يزيل الأوساخ والمكياج والدهون الزائدة بلطف.\n" +
      "• صيغة جل منعشة مناسبة للبشرة العادية والمختلطة.\n" +
      "• الخطوة الأولى في روتين SOS Dark-Spot للتفتيح.\n" +
      "• 100 مل — صباحاً ومساءً على بشرة مبللة ثم اشطفي.",
    descriptionEn:
      "Retinol Complex SOS Dark-Spot Facial Cleansing Gel — deep yet gentle cleanse that preps skin for dark-spot and pigmentation care.\n\n" +
      "• Removes dirt, makeup and excess sebum.\n" +
      "• Refreshing gel texture for normal and combination skin.\n" +
      "• First step in the SOS Dark-Spot brightening routine.\n" +
      "• 100ml — use morning and evening on damp skin, rinse.",
  },
  {
    barcode: "8057190172491",
    slug: "retinol-complex-cosmetic-castor-oil-100ml",
    sku: "RCT-172491",
    price: 10000,
    originalPrice: 12000,
    categoryId: CARE,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "ريتينول كومبلكس - زيت الخروع التجميلي Cosmetic Castor Oil 100 مل",
    nameEn: "Retinol Complex - Cosmetic Castor Oil 100ml",
    descriptionAr:
      "زيت الخروع التجميلي من ريتينول كومبلكس — زيت خالص متعدد الاستخدامات للشعر والرموش والحواجب والبشرة الجافة.\n\n" +
      "• يغذّي ويرطّب ويعزّز مظهر كثافة الشعر والرموش.\n" +
      "• يُستخدم كماسك ليلي للشعر أو تدليك لفروة الرأس.\n" +
      "• مناسب أيضاً للأظافر الجافة والجلد المتشقق.\n" +
      "• 100 مل — كمية قليلة تكفي؛ دلكي بلطف حتى الامتصاص.",
    descriptionEn:
      "Retinol Complex Cosmetic Castor Oil — pure multi-use oil for hair, lashes, brows and dry skin patches.\n\n" +
      "• Nourishes, moisturises and supports the look of thicker hair and lashes.\n" +
      "• Use as an overnight hair mask or scalp massage oil.\n" +
      "• Also ideal for dry nails and cracked skin.\n" +
      "• 100ml — a little goes a long way; massage gently until absorbed.",
  },
  {
    barcode: "8057190176673",
    slug: "retinol-complex-sos-dark-spot-imperfection-facial-serum-30ml",
    sku: "RCT-176673",
    price: 21000,
    originalPrice: 24000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "ريتينول كومبلكس - سيروم وجه SOS Dark-Spot Imperfection 30 مل",
    nameEn: "Retinol Complex - SOS Dark-Spot Imperfection Facial Serum 30ml",
    descriptionAr:
      "سيروم وجه SOS Dark-Spot Imperfection من ريتينول كومبلكس — يستهدف البقع الداكنة وآثار الحبوب ويوحّد لون البشرة.\n\n" +
      "• تركيبة مركّزة لتفتيح التصبغات وتحسين وضوح البشرة.\n" +
      "• قوام خفيف سريع الامتصاص — مثالي قبل الكريم.\n" +
      "• مكمّل لجل التنظيف وكريم SOS Dark-Spot.\n" +
      "• 30 مل — 2–3 قطرات صباحاً ومساءً؛ استخدمي واقي شمس نهاراً.",
    descriptionEn:
      "Retinol Complex SOS Dark-Spot Imperfection Facial Serum — targets dark spots, blemish marks and uneven tone.\n\n" +
      "• Concentrated brightening formula for clearer-looking skin.\n" +
      "• Lightweight, fast-absorbing serum before moisturiser.\n" +
      "• Pairs with SOS Dark-Spot Cleansing Gel and Cream.\n" +
      "• 30ml — 2–3 drops morning and night; always use SPF by day.",
  },
  {
    barcode: "8057190173214",
    slug: "retinol-complex-dry-cracked-heel-repair-cream-150ml",
    sku: "RCT-173214",
    price: 13000,
    originalPrice: 15000,
    categoryId: CARE,
    subcategoryId: FOOT,
    tertiaryCategoryId: FOOT_CREAM,
    nameAr: "ريتينول كومبلكس - كريم إصلاح الكعب الجاف والمتشقق 150 مل",
    nameEn: "Retinol Complex - Dry Cracked Heel Repair Cream 150ml",
    descriptionAr:
      "كريم إصلاح الكعب الجاف والمتشقق من ريتينول كومبلكس — يعالج الجفاف الشديد والتشققات بعمق.\n\n" +
      "• تركيبة غنية تنعّم الجلد المتصلب وتساعد على الإصلاح.\n" +
      "• مثالي قبل النوم مع جوارب قطنية للامتصاص الأفضل.\n" +
      "• مناسب أيضاً للكوعين والركبتين الجافين.\n" +
      "• 150 مل — دلكي يومياً على الكعبين حتى الامتصاص.",
    descriptionEn:
      "Retinol Complex Dry Cracked Heel Repair Cream — intensive care for severely dry, cracked heels and feet.\n\n" +
      "• Rich formula softens hardened skin and supports repair.\n" +
      "• Best applied at night with cotton socks for deeper absorption.\n" +
      "• Also suitable for dry elbows and knees.\n" +
      "• 150ml — massage daily onto heels until absorbed.",
  },
  {
    barcode: "8057190176666",
    slug: "retinol-complex-sos-dark-spot-brightening-facial-cream-niacinamide-50ml",
    sku: "RCT-176666",
    price: 23000,
    originalPrice: 26000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "ريتينول كومبلكس - كريم وجه SOS Dark-Spot Brightening بنياسيناميد 50 مل",
    nameEn: "Retinol Complex - SOS Dark-Spot Brightening Facial Cream Niacinamide 50ml",
    descriptionAr:
      "كريم وجه SOS Dark-Spot Brightening من ريتينول كومبلكس — يفتّح البقع الداكنة ويرطّب مع نياسيناميد لبشرة أكثر إشراقاً.\n\n" +
      "• نياسيناميد يوحّد اللون ويقلّل مظهر التصبغات.\n" +
      "• ترطيب يومي خفيف مناسب للبشرة العادية والمختلطة.\n" +
      "• الخطوة الأخيرة في روتين SOS Dark-Spot.\n" +
      "• 50 مل — صباحاً ومساءً؛ واقي شمس إلزامي نهاراً.",
    descriptionEn:
      "Retinol Complex SOS Dark-Spot Brightening Facial Cream — brightens dark spots and hydrates with niacinamide for a more radiant complexion.\n\n" +
      "• Niacinamide helps even tone and fade the look of pigmentation.\n" +
      "• Lightweight daily moisture for normal and combination skin.\n" +
      "• Final step in the SOS Dark-Spot routine.\n" +
      "• 50ml — morning and evening; SPF is essential by day.",
  },
  {
    barcode: "8057190172866",
    slug: "retinol-complex-face-and-eye-cleansing-gel-200ml",
    sku: "RCT-172866",
    price: 14500,
    originalPrice: 16500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "ريتينول كومبلكس - جل منظف للوجه والعين 200 مل",
    nameEn: "Retinol Complex - Face and Eye Cleansing Gel 200ml",
    descriptionAr:
      "جل منظف للوجه والعين من ريتينول كومبلكس — ينظّف بلطف الوجه ومنطقة العين دون حرقة أو جفاف.\n\n" +
      "• صيغة لطيفة مناسبة للبشرة الحساسة ومرتدي العدسات.\n" +
      "• يزيل المكياج الخفيف والأوساخ اليومية بخطوة واحدة.\n" +
      "• حجم عائلي 200 مل — قيمة ممتازة للاستخدام اليومي.\n" +
      "• صباحاً ومساءً على بشرة مبللة ثم اشطفي جيداً.",
    descriptionEn:
      "Retinol Complex Face and Eye Cleansing Gel — gentle daily cleanser for face and eye area without sting or dryness.\n\n" +
      "• Mild formula suitable for sensitive skin and contact-lens wearers.\n" +
      "• Removes light makeup and daily impurities in one step.\n" +
      "• Family-size 200ml — great everyday value.\n" +
      "• Use morning and evening on damp skin, rinse well.",
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
    { data?: Array<{ id: string; name?: string; nameEn?: string; nameAr?: string }> } | Array<{ id: string; name?: string; nameEn?: string; nameAr?: string }>
  >(`/brands?search=${encodeURIComponent("Retinol Complex")}&limit=20`);
  const rows = Array.isArray(search) ? search : (search.data ?? []);
  const exact = rows.find((b) => {
    const n = `${b.name ?? ""} ${b.nameEn ?? ""} ${b.nameAr ?? ""}`.toLowerCase();
    return n.includes("retinol complex") || n.includes("ريتينول كومبلكس");
  });
  if (exact?.id) {
    console.log(`Brand: Retinol Complex / ريتينول كومبلكس (${exact.id}) [search]`);
    return exact.id;
  }
  const created = await api<{ id: string }>("/brands", "POST", {
    name: "Retinol Complex",
    nameAr: "ريتينول كومبلكس",
    nameEn: "Retinol Complex",
  });
  console.log(`Brand: Retinol Complex / ريتينول كومبلكس (${created.id}) [created]`);
  return created.id;
}

async function deleteIfExists(barcode: string): Promise<void> {
  const check = await api<{ exists: boolean; product?: { id: string; nameEn?: string } }>(
    `/products/barcode-check?barcode=${barcode}`,
  );
  if (!check.exists || !check.product?.id) return;
  console.log(`  deleting existing: ${check.product.id} (${check.product.nameEn ?? ""})`);
  await api(`/products/${check.product.id}`, "DELETE");
}

async function createProduct(product: ProductDef, brandId: string): Promise<{ id: string }> {
  return api<{ id: string }>("/products", "POST", {
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
    imageIds: [] as string[],
  });
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
  const brandId = await resolveBrandId();
  console.log("");

  const results: Array<{ barcode: string; id: string; nameEn: string }> = [];
  const failures: Array<{ barcode: string; error: string }> = [];

  for (const product of PRODUCTS) {
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
  console.log("─".repeat(80));
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
