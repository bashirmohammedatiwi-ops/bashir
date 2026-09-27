/**
 * Estelin — 28 separate skincare products (no shades, no images).
 * Sources: POS names, estelin.pk, buybetter.ng, sliquebeautylimited.com, lamifragrance.com
 * Usage: npx tsx scripts/add-estelin-batch40-single-api.ts
 * Optional: ONLY_BARCODES=6971764157658 npx tsx scripts/add-estelin-batch40-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const CARE_FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const SUN_CARE = "25dc8086-bffa-47af-aaf7-64d503e58a9f";

const FACE_MOISTURIZER = "21801439-d0e9-4106-b5e8-dfdd70ffeb8d";
const CLEANSERS = "05028a17-da64-4c66-b25f-73c758acc2f8";
const SUNSCREEN = "ad2a9e6b-5e20-4393-849a-e5e6c6cc97e2";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId: string;
  subcategoryIds: string[];
  tertiaryCategoryIds: string[];
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

function slugify(nameEn: string, barcode: string): string {
  const base = nameEn
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${barcode.slice(-6)}`;
}

function cream(
  barcode: string,
  nameAr: string,
  nameEn: string,
  descAr: string,
  descEn: string,
  benefitsAr: string[],
  benefitsEn: string[],
  price = 6500,
): ProductDef {
  const descriptionAr = `${descAr}\n\n${benefitsAr.map((b) => `• ${b}`).join("\n")}`;
  const descriptionEn = `${descEn}\n\n${benefitsEn.map((b) => `• ${b}`).join("\n")}`;
  return {
    barcode,
    slug: slugify(nameEn, barcode),
    sku: `EST-${barcode.slice(-6)}`,
    price,
    originalPrice: Math.round((price * 1.1) / 250) * 250,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    subcategoryIds: [CARE_FACE],
    tertiaryCategoryIds: [FACE_MOISTURIZER],
    nameAr,
    nameEn,
    descriptionAr,
    descriptionEn,
  };
}

function toner(
  barcode: string,
  nameAr: string,
  nameEn: string,
  descAr: string,
  descEn: string,
  benefitsAr: string[],
  benefitsEn: string[],
  price = 6000,
): ProductDef {
  const descriptionAr = `${descAr}\n\n${benefitsAr.map((b) => `• ${b}`).join("\n")}`;
  const descriptionEn = `${descEn}\n\n${benefitsEn.map((b) => `• ${b}`).join("\n")}`;
  return {
    barcode,
    slug: slugify(nameEn, barcode),
    sku: `EST-${barcode.slice(-6)}`,
    price,
    originalPrice: Math.round((price * 1.1) / 250) * 250,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    subcategoryIds: [CARE_FACE],
    tertiaryCategoryIds: [CLEANSERS],
    nameAr,
    nameEn,
    descriptionAr,
    descriptionEn,
  };
}

function serum(
  barcode: string,
  nameAr: string,
  nameEn: string,
  descAr: string,
  descEn: string,
  benefitsAr: string[],
  benefitsEn: string[],
  price = 5500,
): ProductDef {
  const descriptionAr = `${descAr}\n\n${benefitsAr.map((b) => `• ${b}`).join("\n")}`;
  const descriptionEn = `${descEn}\n\n${benefitsEn.map((b) => `• ${b}`).join("\n")}`;
  return {
    barcode,
    slug: slugify(nameEn, barcode),
    sku: `EST-${barcode.slice(-6)}`,
    price,
    originalPrice: Math.round((price * 1.1) / 250) * 250,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    subcategoryIds: [CARE_FACE],
    tertiaryCategoryIds: [FACE_MOISTURIZER],
    nameAr,
    nameEn,
    descriptionAr,
    descriptionEn,
  };
}

function sunscreen(
  barcode: string,
  nameAr: string,
  nameEn: string,
  descAr: string,
  descEn: string,
  benefitsAr: string[],
  benefitsEn: string[],
  price = 7000,
): ProductDef {
  const descriptionAr = `${descAr}\n\n${benefitsAr.map((b) => `• ${b}`).join("\n")}`;
  const descriptionEn = `${descEn}\n\n${benefitsEn.map((b) => `• ${b}`).join("\n")}`;
  return {
    barcode,
    slug: slugify(nameEn, barcode),
    sku: `EST-${barcode.slice(-6)}`,
    price,
    originalPrice: Math.round((price * 1.1) / 250) * 250,
    categoryId: CARE,
    subcategoryId: SUN_CARE,
    tertiaryCategoryId: SUNSCREEN,
    subcategoryIds: [CARE_FACE, SUN_CARE],
    tertiaryCategoryIds: [SUNSCREEN],
    nameAr,
    nameEn,
    descriptionAr,
    descriptionEn,
  };
}

function cleanser(
  barcode: string,
  nameAr: string,
  nameEn: string,
  descAr: string,
  descEn: string,
  benefitsAr: string[],
  benefitsEn: string[],
  price = 5500,
): ProductDef {
  const descriptionAr = `${descAr}\n\n${benefitsAr.map((b) => `• ${b}`).join("\n")}`;
  const descriptionEn = `${descEn}\n\n${benefitsEn.map((b) => `• ${b}`).join("\n")}`;
  return {
    barcode,
    slug: slugify(nameEn, barcode),
    sku: `EST-${barcode.slice(-6)}`,
    price,
    originalPrice: Math.round((price * 1.1) / 250) * 250,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    subcategoryIds: [CARE_FACE],
    tertiaryCategoryIds: [CLEANSERS],
    nameAr,
    nameEn,
    descriptionAr,
    descriptionEn,
  };
}

const PRODUCTS: ProductDef[] = [
  toner(
    "6971764157658",
    "إستيلين - تونر للوجه بأحماض AHA للتقشير والتنعيم 400 مل",
    "Estelin AHA Exfoliating Facial Toner 400ml",
    "تونر إستيلين بأحماض AHA يقشّر بلطف ويهيّئ البشرة لامتصاص الخطوات التالية في روتين العناية.",
    "Estelin AHA Facial Toner gently exfoliates and preps skin for the next steps in your skincare routine.",
    ["تقشير لطيف بأحماض AHA", "يهيّئ البشرة بعد الغسول", "يساعد على تنعيم ملمس البشرة", "مناسب للاستخدام اليومي", "400 مل"],
    ["Gentle AHA exfoliation", "Preps skin after cleansing", "Helps smooth skin texture", "Suitable for daily use", "400ml"],
  ),
  toner(
    "6971764157610",
    "إستيلين - تونر هيالورونيك مرطّب للوجه 400 مل",
    "Estelin Hyaluronic Acid Hydrating Facial Toner 400ml",
    "تونر إستيلين بالهيالورونيك يرطّب بعمق ويمنح البشرة امتلاءً ونعومة بعد التنظيف.",
    "Estelin Hyaluronic Acid Toner delivers deep hydration for plumper, smoother-looking skin after cleansing.",
    ["ترطيب عميق بالهيالورونيك", "يرفع مستوى الترطيب بعد الغسول", "ينعّم ويهيّئ البشرة", "مناسب لكل أنواع البشرة", "400 مل"],
    ["Deep hyaluronic hydration", "Boosts moisture after cleansing", "Softens and preps skin", "Suitable for all skin types", "400ml"],
  ),
  toner(
    "6971764157665",
    "إستيلين - تونر ريتينول لتجديد البشرة 400 مل",
    "Estelin Retinol Skin Renewal Facial Toner 400ml",
    "تونر إستيلين بالريتينول يدعم تجديد البشرة ويساعد على تقليل مظهر الخطوط الدقيقة والبهتان.",
    "Estelin Retinol Toner supports skin renewal and helps reduce the look of fine lines and dullness.",
    ["يدعم تجديد البشرة", "يساعد على تقليل الخطوط الدقيقة", "يهيّئ البشرة للسيروم والكريم", "للاستخدام ضمن روتين ليلي أو يومي", "400 مل"],
    ["Supports skin renewal", "Helps reduce fine lines", "Preps skin for serum and cream", "For daily or evening routines", "400ml"],
  ),
  toner(
    "6971764157627",
    "إستيلين - تونر فيتامين C للإشراق والتوحيد 400 مل",
    "Estelin Vitamin C Brightening Facial Toner 400ml",
    "تونر إستيلين بفيتامين C يفتّح ويوحّد لون البشرة ويمنح إشراقة طبيعية بعد الغسول.",
    "Estelin Vitamin C Toner brightens and evens skin tone for a naturally radiant complexion.",
    ["إشراقة بفيتامين C", "يساعد على توحيد لون البشرة", "يرطّب ويهيّئ البشرة", "مناسب للاستخدام اليومي", "400 مل"],
    ["Vitamin C radiance", "Helps even skin tone", "Hydrates and preps skin", "Suitable for daily use", "400ml"],
  ),
  toner(
    "6971764157641",
    "إستيلين - تونر مُرمّم لإصلاح البشرة 400 مل",
    "Estelin Repair Restoring Facial Toner 400ml",
    "تونر إستيلين المُرمّم يعزّز إصلاح البشرة ويرطّبها بعد التنظيف لروتين أكثر توازناً.",
    "Estelin Repair Toner supports skin recovery and hydration after cleansing.",
    ["يعزّز إصلاح البشرة", "يرطّب بعد الغسول", "يهيّئ البشرة للخطوات التالية", "مناسب للبشرة المتضررة", "400 مل"],
    ["Supports skin repair", "Hydrates after cleansing", "Preps skin for next steps", "Ideal for stressed skin", "400ml"],
  ),
  toner(
    "6971764157634",
    "إستيلين - تونر أربوتين للتفتيح والتوحيد 400 مل",
    "Estelin Alpha Arbutin Brightening Facial Toner 400ml",
    "تونر إستيلين بأربوتين يساعد على تفتيح البشرة وتقليل البقع وتوحيد اللون بعد الغسول.",
    "Estelin Arbutin Toner helps brighten skin, reduce dark spots and even out tone after cleansing.",
    ["أربوتين للتفتيح", "يساعد على تقليل البقع", "يوحّد لون البشرة", "يرطّب ويهيّئ البشرة", "400 مل"],
    ["Alpha arbutin brightening", "Helps reduce dark spots", "Evens skin tone", "Hydrates and preps skin", "400ml"],
  ),
  cream(
    "6971764157962",
    "إستيلين - كريم ريتينول لتجديد البشرة 200 جم",
    "Estelin Retinol Skin Renewal Face Cream 200g",
    "كريم إستيلين بالريتينول يدعم تجديد البشرة ويساعد على تقليل مظهر الخطوط الدقيقة والبهتان.",
    "Estelin Retinol Cream supports skin renewal and helps reduce the appearance of fine lines and dullness.",
    ["ريتينول لتجديد البشرة", "يساعد على تقليل الخطوط الدقيقة", "يرطّب وينعّم", "تركيبة كريمية غنية", "200 جم"],
    ["Retinol for skin renewal", "Helps reduce fine lines", "Moisturises and softens", "Rich cream texture", "200g"],
  ),
  cream(
    "6971764157979",
    "إستيلين - كريم ببتيد + كولاجين للشد والمرونة 200 جم",
    "Estelin Peptide + Collagen Firming Face Cream 200g",
    "كريم إستيلين بالببتيد والكولاجين يعزّز مرونة البشرة ويساعد على شدها وترطيبها بعمق.",
    "Estelin Peptide + Collagen Cream boosts elasticity, firms skin and delivers deep nourishment.",
    ["ببتيد + كولاجين للشد", "يعزّز مرونة البشرة", "يرطّب بعمق", "ينعّم ملمس البشرة", "200 جم"],
    ["Peptide + collagen firming", "Boosts skin elasticity", "Deep hydration", "Smooths skin texture", "200g"],
  ),
  cream(
    "6971764157931",
    "إستيلين - كريم كركم + فيتامين C للتفتيح 200 جم",
    "Estelin Turmeric + Vitamin C Brightening Face Cream 200g",
    "كريم إستيلين بالكركم وفيتامين C يفتّح البشرة ويوحّد اللون ويرطّبها لإشراقة صحية.",
    "Estelin Turmeric + Vitamin C Cream brightens, evens tone and hydrates for a healthy glow.",
    ["كركم + فيتامين C للإشراق", "يساعد على توحيد اللون", "يرطّب وينعّم", "مناسب للاستخدام اليومي", "200 جم"],
    ["Turmeric + vitamin C glow", "Helps even skin tone", "Moisturises and softens", "Suitable for daily use", "200g"],
  ),
  cream(
    "6971764157986",
    "إستيلين - كريم سيراميد لترطيب البشرة وحماية الحاجز 200 جم",
    "Estelin Ceramide Barrier Moisturising Face Cream 200g",
    "كريم إستيلين بالسيراميد يقوّي حاجز البشرة ويرطّبها بعمق لبشرة أكثر نعومة ومرونة.",
    "Estelin Ceramide Cream strengthens the skin barrier and delivers lasting moisture for softer skin.",
    ["سيراميد لحماية الحاجز", "ترطيب عميق وطويل", "ينعّم البشرة الجافة", "مناسب للاستخدام اليومي", "200 جم"],
    ["Ceramide barrier support", "Long-lasting deep hydration", "Softens dry skin", "Suitable for daily use", "200g"],
  ),
  sunscreen(
    "6971764157290",
    "إستيلين - واقي شمس UVA/UVB بعامل SPF 50+ 50 جم",
    "Estelin UVA/UVB Broad Spectrum Sunscreen SPF 50+",
    "واقي شمس إستيلين يوفر حماية واسعة من أشعة UVA وUVB مع تركيبة مناسبة للاستخدام اليومي على الوجه.",
    "Estelin UVA/UVB Sunscreen provides broad-spectrum daily protection for the face.",
    ["حماية UVA/UVB", "مناسب للاستخدام اليومي", "خطوة أخيرة في روتين الصباح", "للوجه والمناطق المعرّضة", "تركيبة واقية يومية"],
    ["UVA/UVB protection", "Suitable for daily use", "Final step in morning routine", "For face and exposed areas", "Daily sun defence formula"],
  ),
  sunscreen(
    "6971764157276",
    "إستيلين - لوشن واقي شمس مرطّب SPF 50 75 جم",
    "Estelin Super Moisturizing Sunscreen Lotion SPF 50 75ml",
    "لوشن واقي شمس إستيلين المرطّب يحمي من الشمس ويرطّب البشرة بتركيبة خفيفة مناسبة تحت المكياج.",
    "Estelin Super Moisturizing Sunscreen Lotion SPF 50 hydrates and protects with a lightweight daily formula.",
    ["SPF 50 حماية يومية", "ترطيب مكثّف", "خفيف وسريع الامتصاص", "مناسب تحت المكياج", "75 مل"],
    ["SPF 50 daily protection", "Intensive hydration", "Lightweight fast-absorbing", "Works under makeup", "75ml"],
  ),
  cream(
    "6971764157948",
    "إستيلين - كريم ألفا أربوتين + نياسيناميد للتفتيح 200 جم",
    "Estelin Alpha Arbutin + Niacinamide Whitening Face Cream 200g",
    "كريم إستيلين بألفا أربوتين والنياسيناميد يفتّح البشرة ويقلّل البقع ويوحّد اللون بترطيب عميق.",
    "Estelin Alpha Arbutin + Niacinamide Cream brightens skin, fades spots and evens tone with deep moisture.",
    ["ألفا أربوتين + نياسيناميد", "يساعد على تفتيح البشرة", "يقلّل مظهر البقع", "يرطّب وينعّم", "200 جم"],
    ["Alpha arbutin + niacinamide", "Brightens skin", "Helps fade dark spots", "Moisturises and softens", "200g"],
  ),
  cream(
    "6971764157955",
    "إستيلين - كريم هيالورونيك + بوليغلوتاميك مرطّب 200 جم",
    "Estelin Hyaluronic + Polyglutamic Acid Moisturising Cream 200g",
    "كريم إستيلين بالهيالورونيك وبوليغلوتاميك يرطّب بعمق ويحبس الرطوبة لبشرة أكثر امتلاءً ونعومة.",
    "Estelin Hyaluronic + Polyglutamic Acid Cream locks in moisture for plumper, smoother skin.",
    ["هيالورونيك + بوليغلوتاميك", "ترطيب عميق ومكثّف", "يحبس الرطوبة", "ينعّم البشرة الجافة", "200 جم"],
    ["Hyaluronic + polyglutamic acid", "Deep intensive hydration", "Locks in moisture", "Softens dry skin", "200g"],
  ),
  sunscreen(
    "6971764154558",
    "إستيلين - واقي شمس فائق الخفة مرطّب SPF 50 PA+++ 50 جم",
    "Estelin Ultra-Light Hydrating Invisible Sunscreen SPF 50 PA+++ 50g",
    "واقي شمس إستيلين فائق الخفة بتركيبة مرطّبة وشفافة بدون بقعة بيضاء — حماية SPF 50 PA+++ يومية.",
    "Estelin Ultra-Light Hydrating Invisible Sunscreen SPF 50 PA+++ 50g — weightless, invisible daily UV defence.",
    ["SPF 50 PA+++", "شفاف بدون بقعة بيضاء", "خفيف وغير دهني", "مرطّب للبشرة", "50 جم"],
    ["SPF 50 PA+++", "Invisible no white cast", "Ultra-light non-greasy", "Hydrating formula", "50g"],
  ),
  sunscreen(
    "6971764154565",
    "إستيلين - واقي شمس فائق الخفة مرطّب SPF 80 PA+++ 100 جم",
    "Estelin Ultra-Light Hydrating Invisible Sunscreen SPF 80 PA+++ 100g",
    "واقي شمس إستيلين فائق الخفة بحماية SPF 80 PA+++ وترطيب للوجه والجسم بحجم اقتصادي 100 جم.",
    "Estelin Ultra-Light Hydrating Invisible Sunscreen SPF 80 PA+++ 100g — high protection, invisible finish.",
    ["SPF 80 PA+++", "حجم 100 جم", "شفاف وسريع الامتصاص", "مناسب للوجه والجسم", "غير دهني"],
    ["SPF 80 PA+++", "100g size", "Invisible fast-absorbing", "For face and body", "Non-greasy"],
  ),
  cream(
    "6971764159997",
    "إستيلين - كريم ريتينول + فوليرين مضاد للتقدّم في السن 200 جم",
    "Estelin Retinol + Fullerene Age Defying Face Cream 200g",
    "كريم إستيلين بالريتينول والفوليرين يعزّز تجديد البشرة ويحميها من علامات التقدّم في السن والخطوط الدقيقة.",
    "Estelin Retinol + Fullerene Age Defying Cream renews skin and helps fight signs of ageing and fine lines.",
    ["ريتينول + فوليرين", "مضاد للتقدّم في السن", "يعزّز مرونة البشرة", "يرطّب بعمق", "200 جم"],
    ["Retinol + fullerene", "Anti-ageing care", "Boosts skin firmness", "Deep hydration", "200g"],
  ),
  serum(
    "6942686400863",
    "إستيلين - سيروم كولاجين مرن ومشد للوجه 50 مل",
    "Estelin Collagen Bouncy & Firm Face Serum 50ml",
    "سيروم إستيلين بالكولاجين يعزّز مرونة البشرة ويساعد على شدها وملء الخطوط الدقيقة لبشرة أكثر شباباً.",
    "Estelin Collagen Bouncy & Firm Face Serum boosts elasticity and helps firm skin for a youthful look.",
    ["كولاجين للشد والمرونة", "يعزّز امتلاء البشرة", "خفيف وسريع الامتصاص", "مناسب صباحاً ومساءً", "50 مل"],
    ["Collagen firming", "Boosts skin plumpness", "Lightweight fast-absorbing", "AM and PM use", "50ml"],
  ),
  serum(
    "6942686400870",
    "إستيلين - سيروم ريتينول Age Perfect للوجه 50 مل",
    "Estelin Retinol Age Perfect Face Serum 50ml",
    "سيروم إستيلين بالريتينول يدعم تجديد البشرة ويساعد على تقليل الخطوط الدقيقة وتحسين ملمس الوجه.",
    "Estelin Retinol Age Perfect Face Serum supports renewal and helps reduce fine lines and improve texture.",
    ["ريتينول لتجديد البشرة", "يساعد على تقليل الخطوط الدقيقة", "يحسّن ملمس البشرة", "يُستخدم قبل الكريم", "50 مل"],
    ["Retinol skin renewal", "Helps reduce fine lines", "Improves skin texture", "Apply before moisturiser", "50ml"],
  ),
  sunscreen(
    "6971764160108",
    "إستيلين - واقي شمس لإصلاح حاجز البشرة SPF 50 PA++ 50 جم",
    "Estelin Moisture Barrier Repair Sunscreen SPF 50 PA++ 50g",
    "واقي شمس إستيلين لإصلاح حاجز البشرة بتركيبة سيراميد — حماية SPF 50 PA++ مع ترطيب يومي.",
    "Estelin Moisture Barrier Repair Sunscreen SPF 50 PA++ 50g — ceramide barrier repair with daily UV defence.",
    ["SPF 50 PA++", "إصلاح حاجز البشرة", "تركيبة مرطّبة", "مناسب للاستخدام اليومي", "50 جم"],
    ["SPF 50 PA++", "Barrier repair formula", "Hydrating care", "Suitable for daily use", "50g"],
  ),
  sunscreen(
    "6971764160115",
    "إستيلين - واقي شمس لإصلاح حاجز البشرة SPF 90 PA++ 100 مل",
    "Estelin Moisture Barrier Repair Sunscreen SPF 90 PA++ 100ml",
    "واقي شمس إستيلين عالي الحماية SPF 90 PA++ مع إصلاح حاجز البشرة — حجم 100 مل للاستخدام اليومي.",
    "Estelin Moisture Barrier Repair Sunscreen SPF 90 PA++ 100ml — high protection with barrier repair care.",
    ["SPF 90 PA++", "إصلاح حاجز البشرة", "حجم 100 مل", "حماية يومية عالية", "مناسب للوجه"],
    ["SPF 90 PA++", "Barrier repair care", "100ml size", "High daily protection", "For face"],
  ),
  cream(
    "6971764158082",
    "إستيلين Water Bank - كريم نهاري بالهيالورونيك 50 جم",
    "Estelin Water Bank Hyaluronic Acid Day Cream 50g",
    "كريم إستيلين Water Bank النهاري بالهيالورونيك يرطّب بعمق ويحمي حاجز البشرة طوال اليوم.",
    "Estelin Water Bank Hyaluronic Acid Day Cream deeply hydrates and protects the skin barrier all day.",
    ["هيالورونيك للترطيب اليومي", "يحمي حاجز البشرة", "خفيف وسريع الامتصاص", "قاعدة مثالية قبل واقي الشمس", "50 جم"],
    ["Hyaluronic daily hydration", "Protects skin barrier", "Lightweight fast-absorbing", "Ideal base before sunscreen", "50g"],
  ),
  cream(
    "6971764158099",
    "إستيلين Water Bank - كريم ليلي بالهيالورونيك 50 جم",
    "Estelin Water Bank Hyaluronic Acid Night Cream 50g",
    "كريم إستيلين Water Bank الليلي بالهيالورونيك يعيد ترطيب البشرة أثناء النوم وينعّم الخطوط الدقيقة.",
    "Estelin Water Bank Hyaluronic Acid Night Cream replenishes moisture overnight and softens fine lines.",
    ["ترطيب ليلي مكثّف", "يعيد نعومة البشرة", "يدعم حاجز البشرة", "للاستخدام كل ليلة", "50 جم"],
    ["Intensive overnight hydration", "Restores skin softness", "Supports skin barrier", "Nightly use", "50g"],
  ),
  cleanser(
    "6971764158501",
    "إستيلين Water Bank - غسول وجه بالهالورونيك 120 جم",
    "Estelin Water Bank Hyaluronic Acid Facial Cleanser 120g",
    "غسول إستيلين Water Bank بالهيالورونيك ينظّف البشرة بلطف دون تجفيف ويحافظ على الترطيب.",
    "Estelin Water Bank Hyaluronic Acid Facial Cleanser gently cleanses without stripping moisture.",
    ["ينظّف بلطف", "هيالورونيك مرطّب", "لا يجفّف البشرة", "مناسب للاستخدام اليومي", "120 جم"],
    ["Gentle cleanse", "Hyaluronic hydration", "Does not dry skin", "Suitable for daily use", "120g"],
  ),
  cream(
    "6971764158518",
    "إستيلين - كريم ألفا أربوتين لتفتيح الوجه 200 جم",
    "Estelin Alpha Arbutin Face Whitening Cream 200g",
    "كريم إستيلين بألفا أربوتين يفتّح البشرة ويقلّل التصبغات ويرطّبها لبشرة أكثر إشراقاً وتوحيداً.",
    "Estelin Alpha Arbutin Face Whitening Cream brightens skin, reduces pigmentation and deeply moisturises.",
    ["ألفا أربوتين للتفتيح", "يساعد على تقليل التصبغات", "يرطّب وينعّم", "مناسب للوجه يومياً", "200 جم"],
    ["Alpha arbutin brightening", "Helps reduce pigmentation", "Moisturises and softens", "Daily face care", "200g"],
  ),
  sunscreen(
    "6971764158525",
    "إستيلين Water Bank - واقي شمس هيالورونيك SPF 50 PA+++ 60 جم",
    "Estelin Water Bank Hyaluronic Acid Sunscreen SPF 50 PA+++ 60g",
    "واقي شمس إستيلين Water Bank بالهيالورونيك — حماية SPF 50 PA+++ مع ترطيب وبدون بقعة بيضاء.",
    "Estelin Water Bank Hyaluronic Acid Sunscreen SPF 50 PA+++ 60g — hydrating invisible UV protection.",
    ["SPF 50 PA+++", "هيالورونيك مرطّب", "حماية UVA/UVB", "شفاف بدون بقعة بيضاء", "60 جم"],
    ["SPF 50 PA+++", "Hyaluronic hydration", "UVA/UVB protection", "Invisible no white cast", "60g"],
  ),
  sunscreen(
    "6971764158532",
    "إستيلين - واقي شمس فائق الخفة SPF 50 50 جم",
    "Estelin Ultra-Light Hydrating Sunscreen SPF 50 50g",
    "واقي شمس إستيلين فائق الخفة بحماية SPF 50 — تركيبة مرطّبة شفافة مناسبة للاستخدام اليومي.",
    "Estelin Ultra-Light Hydrating Sunscreen SPF 50 50g — lightweight invisible daily sun protection.",
    ["SPF 50", "خفيف وشفاف", "مرطّب غير دهني", "مناسب تحت المكياج", "50 جم"],
    ["SPF 50", "Ultra-light invisible", "Non-greasy hydration", "Works under makeup", "50g"],
  ),
  sunscreen(
    "6971764158549",
    "إستيلين - واقي شمس نياسيناميد + غلوتاثيون SPF 50",
    "Estelin Niacinamide + Glutathione Sunscreen SPF 50",
    "واقي شمس إستيلين بالنياسيناميد والغلوتاثيون يحمي من الشمس ويساعد على إشراق البشرة وتوحيد اللون.",
    "Estelin Niacinamide + Glutathione Sunscreen SPF 50 protects skin and supports bright, even-toned complexion.",
    ["SPF 50", "نياسيناميد + غلوتاثيون", "حماية وإشراق", "مناسب للاستخدام اليومي", "تركيبة خفيفة"],
    ["SPF 50", "Niacinamide + glutathione", "Protection and radiance", "Suitable for daily use", "Lightweight formula"],
  ),
];

const ONLY_BARCODES = process.env.ONLY_BARCODES?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const FILTERED = ONLY_BARCODES?.length
  ? PRODUCTS.filter((p) => ONLY_BARCODES.includes(p.barcode))
  : PRODUCTS;

let token = "";
let brandId = "";

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

async function resolveBrand(): Promise<string> {
  if (brandId) return brandId;
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: "إستيلين",
    brandEn: "Estelin",
    createIfMissing: true,
  });
  const id = resolved.brand?.id;
  if (!id) throw new Error("Could not resolve Estelin brand");
  brandId = id;
  console.log(`Brand: Estelin (${id})${resolved.created ? " [created]" : ""}\n`);
  return id;
}

async function deleteByBarcode(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string; slug?: string } }>(
    `/products/barcode-check?barcode=${barcode}`,
  );
  if (!check.exists || !check.product?.id) return false;
  await api(`/products/${check.product.id}`, "DELETE");
  console.log(`  deleted: ${check.product.nameAr ?? check.product.slug ?? check.product.id}`);
  return true;
}

async function deleteOrphanSlug(slug: string) {
  const existing = await api<{ data?: Array<{ id: string; slug?: string }> } | Array<{ id: string; slug?: string }>>(
    `/products?search=${encodeURIComponent(slug)}&status=all&limit=10`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  for (const row of rows.filter((p) => p.slug === slug)) {
    await api(`/products/${row.id}`, "DELETE");
    console.log(`  deleted orphan slug: ${slug}`);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${FILTERED.length} (no shades, no images, delete+readd)\n`);
  await login();
  console.log("Logged in.\n");

  const resolvedBrandId = await resolveBrand();
  let added = 0;
  let deleted = 0;

  for (const product of FILTERED) {
    console.log(`--- ${product.barcode} ---`);
    if (await deleteByBarcode(product.barcode)) deleted += 1;
    await deleteOrphanSlug(product.slug);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId: resolvedBrandId,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      tertiaryCategoryId: product.tertiaryCategoryId,
      subcategoryIds: product.subcategoryIds,
      tertiaryCategoryIds: product.tertiaryCategoryIds,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price: product.price,
      originalPrice: product.originalPrice,
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

  console.log(`Done — added: ${added}/${FILTERED.length} | deleted: ${deleted}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
