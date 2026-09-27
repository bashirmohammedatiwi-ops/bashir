/**
 * Manual expert review — Estelin batch 40 (28 products)
 * Updates Arabic/English names, descriptions, and categories via PATCH.
 * Usage: npx tsx scripts/fix-estelin-batch40-copy-api.ts
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

type ProductType = "toner" | "cream" | "serum" | "sunscreen" | "cleanser";

type Fix = {
  barcode: string;
  productType: ProductType;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

function categoryFor(type: ProductType) {
  if (type === "sunscreen") {
    return {
      categoryId: CARE,
      subcategoryId: SUN_CARE,
      tertiaryCategoryId: SUNSCREEN,
      subcategoryIds: [CARE_FACE, SUN_CARE],
      tertiaryCategoryIds: [SUNSCREEN],
    };
  }
  const tertiary = type === "toner" || type === "cleanser" ? CLEANSERS : FACE_MOISTURIZER;
  return {
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: tertiary,
    subcategoryIds: [CARE_FACE],
    tertiaryCategoryIds: [tertiary],
  };
}

const FIXES: Fix[] = [
  {
    barcode: "6971764157658",
    productType: "toner",
    nameAr: "إستيلين - تونر للوجه بأحماض AHA للتقشير اللطيف 400 مل",
    nameEn: "Estelin AHA Exfoliating Facial Toner 400ml",
    descriptionAr:
      "تونر إستيلين بأحماض AHA يقشّر البشرة بلطف بعد الغسول ويهيّئها لامتصاص السيروم والكريم بفعالية أكبر.\n\n" +
      "• أحماض AHA لتقشير لطيف وإزالة خلايا الجلد الميتة.\n• يساعد على تنعيم ملمس البشرة وتوحيد المظهر.\n• يرطّب ويهيّئ البشرة بعد التنظيف.\n• يُستخدم مساءً بعد الغسول؛ استخدمي واقي شمس نهاراً.\n• حجم اقتصادي 400 مل — مناسب لمعظم أنواع البشرة ما عدا الحساسة جداً.",
    descriptionEn:
      "Estelin AHA Facial Toner gently exfoliates after cleansing and preps skin for better serum and moisturiser absorption.\n\n" +
      "• AHA acids for gentle exfoliation and dead cell removal.\n• Helps smooth texture and refine skin appearance.\n• Hydrates and preps skin after cleansing.\n• Use in the evening after cleansing; wear SPF by day.\n• Economical 400ml size — suitable for most skin types except very sensitive.",
  },
  {
    barcode: "6971764157610",
    productType: "toner",
    nameAr: "إستيلين - تونر هيالورونيك أسيد مرطّب للوجه 400 مل",
    nameEn: "Estelin Hyaluronic Acid Hydrating Facial Toner 400ml",
    descriptionAr:
      "تونر إستيلين بالهيالورونيك أسيد يعزّز الترطيب مباشرة بعد الغسول ويمنح البشرة امتلاءً ونعومة طوال اليوم.\n\n" +
      "• هيالورونيك أسيد لترطيب عميق وسريع.\n• يرفع مستوى الرطوبة بعد خطوة التنظيف.\n• ينعّم البشرة ويهيّئها للسيروم والكريم.\n• خفيف وسريع الامتصاص — مناسب لكل أنواع البشرة.\n• 400 مل — للاستخدام صباحاً ومساءً.",
    descriptionEn:
      "Estelin Hyaluronic Acid Facial Toner boosts moisture right after cleansing for plumper, softer-looking skin.\n\n" +
      "• Hyaluronic acid for deep, fast hydration.\n• Restores moisture levels after cleansing.\n• Softens skin and preps for serum and cream.\n• Lightweight, fast-absorbing — all skin types.\n• 400ml — use morning and evening.",
  },
  {
    barcode: "6971764157665",
    productType: "toner",
    nameAr: "إستيلين - تونر ريتينول لتجديد البشرة ومكافحة الشيخوخة 400 مل",
    nameEn: "Estelin Retinol Skin Renewal Facial Toner 400ml",
    descriptionAr:
      "تونر إستيلين بالريتينول يدعم تجديد البشرة ويساعد على تقليل مظهر الخطوط الدقيقة والبهتان بعد الغسول.\n\n" +
      "• ريتينول لتجديد خلايا البشرة وتحسين الملمس.\n• يساعد على تقليل مظهر الخطوط الدقيقة والبهتان.\n• يهيّئ البشرة لخطوات السيروم والكريم الليلي.\n• يُفضّل استخدامه مساءً ضمن روتين العناية.\n• 400 مل — استخدمي واقي شمس SPF 30+ صباحاً.",
    descriptionEn:
      "Estelin Retinol Facial Toner supports skin renewal and helps reduce the look of fine lines and dullness after cleansing.\n\n" +
      "• Retinol supports cell renewal and texture improvement.\n• Helps reduce the appearance of fine lines and dullness.\n• Preps skin for evening serum and cream steps.\n• Best used in the evening skincare routine.\n• 400ml — always use SPF 30+ in the morning.",
  },
  {
    barcode: "6971764157627",
    productType: "toner",
    nameAr: "إستيلين - تونر فيتامين C للإشراق وتوحيد لون البشرة 400 مل",
    nameEn: "Estelin Vitamin C Brightening Facial Toner 400ml",
    descriptionAr:
      "تونر إستيلين بفيتامين C يمنح البشرة إشراقة طبيعية ويساعد على توحيد اللون بعد خطوة الغسول.\n\n" +
      "• فيتامين C لمظهر أكثر إشراقاً وحيوية.\n• يساعد على تقليل البهتان وتوحيد لون البشرة.\n• يرطّب ويهيّئ البشرة لامتصاص الخطوات التالية.\n• مناسب للاستخدام اليومي صباحاً ومساءً.\n• 400 مل — مثالي ضمن روتين التفتيح والإشراق.",
    descriptionEn:
      "Estelin Vitamin C Facial Toner brightens complexion and helps even skin tone after cleansing.\n\n" +
      "• Vitamin C for a naturally radiant, energised look.\n• Helps reduce dullness and uneven tone.\n• Hydrates and preps skin for next skincare steps.\n• Suitable for daily morning and evening use.\n• 400ml — ideal for brightening and radiance routines.",
  },
  {
    barcode: "6971764157641",
    productType: "toner",
    nameAr: "إستيلين - تونر مُرمّم لإصلاح وترميم البشرة 400 مل",
    nameEn: "Estelin Repair Restoring Facial Toner 400ml",
    descriptionAr:
      "تونر إستيلين المُرمّم يعزّز إصلاح البشرة المتضررة ويرطّبها بعد الغسول لروتين عناية أكثر توازناً.\n\n" +
      "• يدعم ترميم البشرة المتأثرة بالجفاف أو التقشير.\n• يرطّب ويهدّئ البشرة بعد التنظيف.\n• يهيّئ البشرة لامتصاص الكريم والسيروم.\n• مناسب للبشرة الجافة والمتضررة والحساسة.\n• 400 مل — للاستخدام اليومي صباحاً ومساءً.",
    descriptionEn:
      "Estelin Repair Restoring Facial Toner supports recovery of stressed skin and hydrates after cleansing.\n\n" +
      "• Helps repair skin affected by dryness or exfoliation.\n• Hydrates and comforts skin after cleansing.\n• Preps skin for serum and moisturiser absorption.\n• Ideal for dry, damaged and sensitive skin.\n• 400ml — daily morning and evening use.",
  },
  {
    barcode: "6971764157634",
    productType: "toner",
    nameAr: "إستيلين - تونر ألفا أربوتين للتفتيح وتوحيد اللون 400 مل",
    nameEn: "Estelin Alpha Arbutin Brightening Facial Toner 400ml",
    descriptionAr:
      "تونر إستيلين بألفا أربوتين يساعد على تفتيح البشرة وتقليل البقع الداكنة وتوحيد اللون بعد الغسول.\n\n" +
      "• ألفا أربوتين لمظهر أكثر إشراقاً وتوحيداً.\n• يساعد على تقليل مظهر البقع والتصبغات.\n• يرطّب ويهيّئ البشرة للخطوات التالية.\n• مناسب لروتين التفتيح اليومي.\n• 400 مل — استخدمي واقي شمس نهاراً لحماية أفضل.",
    descriptionEn:
      "Estelin Alpha Arbutin Facial Toner helps brighten skin, fade dark spots and even tone after cleansing.\n\n" +
      "• Alpha arbutin for a brighter, more even look.\n• Helps reduce the appearance of spots and pigmentation.\n• Hydrates and preps skin for next steps.\n• Suitable for daily brightening routines.\n• 400ml — wear sunscreen daily for best results.",
  },
  {
    barcode: "6971764157962",
    productType: "cream",
    nameAr: "إستيلين - كريم وجه بالريتينول لتجديد البشرة 200 جم",
    nameEn: "Estelin Retinol Skin Renewal Face Cream 200g",
    descriptionAr:
      "كريم إستيلين بالريتينول يدعم تجديد البشرة ويساعد على تقليل مظهر الخطوط الدقيقة والبهتان بتركيبة كريمية غنية.\n\n" +
      "• ريتينول لتجديد خلايا البشرة وتحسين الملمس.\n• يساعد على تقليل مظهر الخطوط الدقيقة وعلامات التقدّم في السن.\n• يرطّب وينعّم البشرة بعمق.\n• يُفضّل استخدامه مساءً على بشرة نظيفة.\n• 200 جم — استخدمي واقي شمس SPF 30+ صباحاً.",
    descriptionEn:
      "Estelin Retinol Face Cream supports skin renewal and helps reduce the appearance of fine lines and dullness in a rich cream formula.\n\n" +
      "• Retinol supports cell renewal and texture improvement.\n• Helps reduce fine lines and early signs of ageing.\n• Deeply moisturises and softens skin.\n• Best applied in the evening on cleansed skin.\n• 200g — always use SPF 30+ sunscreen in the morning.",
  },
  {
    barcode: "6971764157979",
    productType: "cream",
    nameAr: "إستيلين - كريم وجه ببتيد + كولاجين للشد والمرونة 200 جم",
    nameEn: "Estelin Peptide + Collagen Firming Face Cream 200g",
    descriptionAr:
      "كريم إستيلين بالببتيد والكولاجين يعزّز مرونة البشرة ويساعد على شدها وترطيبها بعمق لبشرة أكثر شباباً.\n\n" +
      "• ببتيد + كولاجين لدعم مرونة وشد البشرة.\n• يساعد على تحسين امتلاء البشرة وملمسها.\n• ترطيب عميق ينعّم البشرة الجافة والمجهدة.\n• مناسب للاستخدام اليومي صباحاً ومساءً.\n• 200 جم — مثالي لروتين مكافحة الشيخوخة.",
    descriptionEn:
      "Estelin Peptide + Collagen Face Cream boosts elasticity, firms skin and delivers deep nourishment for a more youthful look.\n\n" +
      "• Peptide + collagen support firmness and elasticity.\n• Helps improve skin plumpness and texture.\n• Deep hydration softens dry, tired skin.\n• Suitable for daily morning and evening use.\n• 200g — ideal for anti-ageing skincare routines.",
  },
  {
    barcode: "6971764157931",
    productType: "cream",
    nameAr: "إستيلين - كريم وجه بكركم + فيتامين C للإشراق والتفتيح 200 جم",
    nameEn: "Estelin Turmeric + Vitamin C Brightening Face Cream 200g",
    descriptionAr:
      "كريم إستيلين بالكركم وفيتامين C يفتّح البشرة ويوحّد اللون ويرطّبها لإشراقة صحية ومتوازنة.\n\n" +
      "• كركم + فيتامين C لمظهر أكثر إشراقاً وحيوية.\n• يساعد على توحيد لون البشرة وتقليل البهتان.\n• يرطّب وينعّم بتركيبة كريمية مريحة.\n• مناسب للاستخدام اليومي على الوجه والرقبة.\n• 200 جم — استخدمي واقي شمس نهاراً.",
    descriptionEn:
      "Estelin Turmeric + Vitamin C Face Cream brightens, evens tone and hydrates for a healthy, balanced glow.\n\n" +
      "• Turmeric + vitamin C for radiant, energised skin.\n• Helps even skin tone and reduce dullness.\n• Moisturises and softens with a comfortable cream texture.\n• Suitable for daily use on face and neck.\n• 200g — wear sunscreen during the day.",
  },
  {
    barcode: "6971764157986",
    productType: "cream",
    nameAr: "إستيلين - كريم وجه بالسيراميد لترطيب وحماية حاجز البشرة 200 جم",
    nameEn: "Estelin Ceramide Barrier Moisturising Face Cream 200g",
    descriptionAr:
      "كريم إستيلين بالسيراميد يقوّي حاجز البشرة ويرطّبها بعمق لبشرة أكثر نعومة ومرونة — مثالي للبشرة الجافة.\n\n" +
      "• سيراميد لدعم وحماية حاجز البشرة الطبيعي.\n• ترطيب عميق وطويل المفعول.\n• ينعّم البشرة الجافة والمتهيجة.\n• مناسب للاستخدام اليومي صباحاً ومساءً.\n• 200 جم — قاعدة مثالية قبل واقي الشمس.",
    descriptionEn:
      "Estelin Ceramide Face Cream strengthens the skin barrier and delivers lasting moisture for softer, more resilient skin — ideal for dry skin.\n\n" +
      "• Ceramides support and protect the natural skin barrier.\n• Long-lasting deep hydration.\n• Softens dry and irritated skin.\n• Suitable for daily morning and evening use.\n• 200g — ideal base before sunscreen.",
  },
  {
    barcode: "6971764157290",
    productType: "sunscreen",
    nameAr: "إستيلين - واقي شمس للوجه UVA/UVB بعامل SPF 50+ 50 جم",
    nameEn: "Estelin UVA/UVB Broad Spectrum Face Sunscreen SPF 50+ 50g",
    descriptionAr:
      "واقي شمس إستيلين للوجه يوفر حماية واسعة من أشعة UVA وUVB بعامل SPF 50+ لاستخدام يومي على البشرة.\n\n" +
      "• حماية SPF 50+ من أشعة UVA وUVB.\n• تركيبة مناسبة للوجه والمناطق المعرّضة للشمس.\n• خطوة أساسية في روتين الصباح بعد الكريم.\n• يساعد على الوقاية من أضرار الشمس والتصبغات.\n• 50 جم — للاستخدام اليومي طوال العام.",
    descriptionEn:
      "Estelin UVA/UVB Face Sunscreen SPF 50+ provides broad-spectrum daily protection for face and exposed areas.\n\n" +
      "• SPF 50+ protection against UVA and UVB rays.\n• Suitable for face and sun-exposed areas.\n• Essential final step in your morning routine after moisturiser.\n• Helps prevent sun damage and pigmentation.\n• 50g — for year-round daily use.",
  },
  {
    barcode: "6971764157276",
    productType: "sunscreen",
    nameAr: "إستيلين - لوشن واقي شمس مرطّب للوجه SPF 50 75 مل",
    nameEn: "Estelin Super Moisturizing Sunscreen Lotion SPF 50 75ml",
    descriptionAr:
      "لوشن واقي شمس إستيلين المرطّب يجمع بين الحماية من الشمس والترطيب بتركيبة خفيفة سريعة الامتصاص.\n\n" +
      "• SPF 50 حماية يومية من أشعة الشمس.\n• ترطيب مكثّف — مناسب للبشرة الجافة.\n• خفيف وسريع الامتصاص ولا يترك طبقة دهنية.\n• يعمل جيداً تحت المكياج.\n• 75 مل — للوجه والجسم.",
    descriptionEn:
      "Estelin Super Moisturizing Sunscreen Lotion SPF 50 combines sun protection with intensive hydration in a lightweight formula.\n\n" +
      "• SPF 50 daily sun protection.\n• Intensive moisture — ideal for dry skin.\n• Lightweight, fast-absorbing, non-greasy finish.\n• Works well under makeup.\n• 75ml — for face and body.",
  },
  {
    barcode: "6971764157948",
    productType: "cream",
    nameAr: "إستيلين - كريم وجه ألفا أربوتين + نياسيناميد للتفتيح 200 جم",
    nameEn: "Estelin Alpha Arbutin + Niacinamide Brightening Face Cream 200g",
    descriptionAr:
      "كريم إستيلين بألفا أربوتين والنياسيناميد يفتّح البشرة ويقلّل البقع ويوحّد اللون مع ترطيب عميق.\n\n" +
      "• ألفا أربوتين + نياسيناميد لتوحيد اللون والإشراق.\n• يساعد على تقليل مظهر البقع الداكنة والتصبغات.\n• يرطّب وينعّم البشرة بتركيبة كريمية غنية.\n• مناسب للاستخدام اليومي صباحاً ومساءً.\n• 200 جم — استخدمي واقي شمس نهاراً.",
    descriptionEn:
      "Estelin Alpha Arbutin + Niacinamide Face Cream brightens skin, fades spots and evens tone with deep moisture.\n\n" +
      "• Alpha arbutin + niacinamide for radiance and even tone.\n• Helps reduce dark spots and pigmentation.\n• Rich cream texture moisturises and softens.\n• Suitable for daily morning and evening use.\n• 200g — wear sunscreen during the day.",
  },
  {
    barcode: "6971764157955",
    productType: "cream",
    nameAr: "إستيلين - كريم وجه هيالورونيك + بوليغلوتاميك مرطّب 200 جم",
    nameEn: "Estelin Hyaluronic + Polyglutamic Acid Moisturising Face Cream 200g",
    descriptionAr:
      "كريم إستيلين بالهيالورونيك وبوليغلوتاميك يرطّب بعمق ويحبس الرطوبة لبشرة أكثر امتلاءً ونعومة.\n\n" +
      "• هيالورونيك + بوليغلوتاميك لترطيب مكثّف ومتعدد المستويات.\n• يحبس الرطوبة داخل البشرة لفترة أطول.\n• ينعّم البشرة الجافة والمجهدة.\n• قوام كريمي مريح — مناسب لكل أنواع البشرة.\n• 200 جم — للاستخدام اليومي صباحاً ومساءً.",
    descriptionEn:
      "Estelin Hyaluronic + Polyglutamic Acid Face Cream locks in moisture for plumper, smoother, deeply hydrated skin.\n\n" +
      "• Hyaluronic + polyglutamic acid for multi-level hydration.\n• Helps lock moisture in for longer-lasting comfort.\n• Softens dry and tired skin.\n• Comfortable cream texture — all skin types.\n• 200g — daily morning and evening use.",
  },
  {
    barcode: "6971764154558",
    productType: "sunscreen",
    nameAr: "إستيلين - واقي شمس فائق الخفة مرطّب SPF 50 PA+++ 50 جم",
    nameEn: "Estelin Ultra-Light Hydrating Invisible Sunscreen SPF 50 PA+++ 50g",
    descriptionAr:
      "واقي شمس إستيلين فائق الخفة بتركيبة مرطّبة وشفافة بدون بقعة بيضاء — حماية SPF 50 PA+++ للاستخدام اليومي.\n\n" +
      "• SPF 50 PA+++ حماية عالية من أشعة UVA وUVB.\n• شفاف بدون بقعة بيضاء — مناسب لكل درجات البشرة.\n• خفيف وغير دهني وسريع الامتصاص.\n• يرطّب البشرة ويعمل جيداً تحت المكياج.\n• 50 جم — للوجه يومياً في الصباح.",
    descriptionEn:
      "Estelin Ultra-Light Hydrating Invisible Sunscreen SPF 50 PA+++ 50g — weightless, invisible daily UV defence with hydration.\n\n" +
      "• SPF 50 PA+++ high UVA/UVB protection.\n• Invisible finish with no white cast — all skin tones.\n• Ultra-light, non-greasy, fast-absorbing.\n• Hydrating formula works well under makeup.\n• 50g — apply to face every morning.",
  },
  {
    barcode: "6971764154565",
    productType: "sunscreen",
    nameAr: "إستيلين - واقي شمس فائق الخفة مرطّب SPF 80 PA+++ 100 جم",
    nameEn: "Estelin Ultra-Light Hydrating Invisible Sunscreen SPF 80 PA+++ 100g",
    descriptionAr:
      "واقي شمس إستيلين فائق الخفة بحماية SPF 80 PA+++ وترطيب — حجم اقتصادي 100 جم للوجه والجسم.\n\n" +
      "• SPF 80 PA+++ حماية عالية جداً من أشعة الشمس.\n• تركيبة شفافة خفيفة بدون بقعة بيضاء.\n• سريع الامتصاص وغير دهني.\n• مناسب للوجه والجسم والاستخدام اليومي.\n• 100 جم — حجم اقتصادي للعائلة.",
    descriptionEn:
      "Estelin Ultra-Light Hydrating Invisible Sunscreen SPF 80 PA+++ 100g — very high protection with an invisible, lightweight finish.\n\n" +
      "• SPF 80 PA+++ very high sun protection.\n• Invisible lightweight formula with no white cast.\n• Fast-absorbing and non-greasy.\n• For face, body and daily use.\n• 100g — economical family size.",
  },
  {
    barcode: "6971764159997",
    productType: "cream",
    nameAr: "إستيلين - كريم وجه ريتينول + فوليرين مضاد للشيخوخة 200 جم",
    nameEn: "Estelin Retinol + Fullerene Age Defying Face Cream 200g",
    descriptionAr:
      "كريم إستيلين بالريتينول والفوليرين يعزّز تجديد البشرة ويساعد على مكافحة علامات التقدّم في السن والخطوط الدقيقة.\n\n" +
      "• ريتينول + فوليرين لروتين مضاد للشيخوخة.\n• يدعم تجديد البشرة وتحسين مرونتها.\n• يساعد على تقليل مظهر الخطوط الدقيقة والبهتان.\n• يرطّب بعمق بتركيبة كريمية فاخرة.\n• 200 جم — يُستخدم مساءً؛ واقي شمس SPF 30+ صباحاً.",
    descriptionEn:
      "Estelin Retinol + Fullerene Age Defying Face Cream renews skin and helps fight signs of ageing and fine lines.\n\n" +
      "• Retinol + fullerene for advanced anti-ageing care.\n• Supports skin renewal and improved firmness.\n• Helps reduce fine lines and dullness.\n• Deep hydration in a rich cream formula.\n• 200g — use in the evening; SPF 30+ sunscreen by day.",
  },
  {
    barcode: "6942686400863",
    productType: "serum",
    nameAr: "إستيلين - سيروم كولاجين مرن ومشد للوجه 50 مل",
    nameEn: "Estelin Collagen Bouncy & Firm Face Serum 50ml",
    descriptionAr:
      "سيروم إستيلين بالكولاجين يعزّز مرونة البشرة ويساعد على شدها وملء الخطوط الدقيقة لبشرة أكثر شباباً وامتلاءً.\n\n" +
      "• كولاجين لدعم الشد والمرونة والامتلاء.\n• يساعد على تحسين ملمس البشرة ونعومتها.\n• قوام سيروم خفيف سريع الامتصاص.\n• يُطبّق على بشرة نظيفة قبل الكريم.\n• 50 مل — صباحاً ومساءً.",
    descriptionEn:
      "Estelin Collagen Bouncy & Firm Face Serum boosts elasticity and helps firm skin for a plumper, more youthful look.\n\n" +
      "• Collagen supports firmness, elasticity and plumpness.\n• Helps improve skin texture and softness.\n• Lightweight serum texture absorbs quickly.\n• Apply on cleansed skin before moisturiser.\n• 50ml — morning and evening use.",
  },
  {
    barcode: "6942686400870",
    productType: "serum",
    nameAr: "إستيلين - سيروم ريتينول Age Perfect لتجديد البشرة 50 مل",
    nameEn: "Estelin Retinol Age Perfect Face Serum 50ml",
    descriptionAr:
      "سيروم إستيلين بالريتينول يدعم تجديد البشرة ويساعد على تقليل الخطوط الدقيقة وتحسين ملمس الوجه بتركيبة مركّزة.\n\n" +
      "• ريتينول لتجديد البشرة ومكافحة علامات الشيخوخة.\n• يساعد على تقليل مظهر الخطوط الدقيقة.\n• يحسّن ملمس البشرة ونعومتها.\n• يُطبّق مساءً قبل الكريم الليلي.\n• 50 مل — استخدمي واقي شمس SPF 30+ صباحاً.",
    descriptionEn:
      "Estelin Retinol Age Perfect Face Serum supports renewal and helps reduce fine lines with a concentrated formula.\n\n" +
      "• Retinol supports renewal and anti-ageing care.\n• Helps reduce the appearance of fine lines.\n• Improves skin texture and softness.\n• Apply in the evening before night cream.\n• 50ml — use SPF 30+ sunscreen in the morning.",
  },
  {
    barcode: "6971764160108",
    productType: "sunscreen",
    nameAr: "إستيلين - واقي شمس لإصلاح حاجز البشرة SPF 50 PA++ 50 جم",
    nameEn: "Estelin Moisture Barrier Repair Sunscreen SPF 50 PA++ 50g",
    descriptionAr:
      "واقي شمس إستيلين لإصلاح حاجز البشرة بتركيبة سيراميد — حماية SPF 50 PA++ مع ترطيب يومي للبشرة الجافة والحساسة.\n\n" +
      "• SPF 50 PA++ حماية من أشعة UVA وUVB.\n• يدعم إصلاح وترميم حاجز البشرة.\n• تركيبة مرطّبة مريحة للبشرة الجافة.\n• مناسب للاستخدام اليومي في الصباح.\n• 50 جم — للوجه والرقبة.",
    descriptionEn:
      "Estelin Moisture Barrier Repair Sunscreen SPF 50 PA++ 50g — ceramide barrier repair with daily UV defence for dry, sensitive skin.\n\n" +
      "• SPF 50 PA++ UVA/UVB protection.\n• Supports barrier repair and recovery.\n• Hydrating formula comforts dry skin.\n• Suitable for daily morning use.\n• 50g — for face and neck.",
  },
  {
    barcode: "6971764160115",
    productType: "sunscreen",
    nameAr: "إستيلين - واقي شمس لإصلاح حاجز البشرة SPF 90 PA++ 100 مل",
    nameEn: "Estelin Moisture Barrier Repair Sunscreen SPF 90 PA++ 100ml",
    descriptionAr:
      "واقي شمس إستيلين عالي الحماية SPF 90 PA++ مع إصلاح حاجز البشرة — حجم 100 مل للاستخدام اليومي المكثّف.\n\n" +
      "• SPF 90 PA++ حماية عالية جداً من أشعة الشمس.\n• يدعم إصلاح حاجز البشرة وترطيبه.\n• مناسب للبشرة الجافة والمتضررة.\n• تركيبة مريحة للاستخدام اليومي.\n• 100 مل — للوجه والمناطق المعرّضة.",
    descriptionEn:
      "Estelin Moisture Barrier Repair Sunscreen SPF 90 PA++ 100ml — very high protection with barrier repair care.\n\n" +
      "• SPF 90 PA++ very high sun protection.\n• Supports barrier repair and hydration.\n• Ideal for dry and damaged skin.\n• Comfortable formula for daily use.\n• 100ml — for face and exposed areas.",
  },
  {
    barcode: "6971764158082",
    productType: "cream",
    nameAr: "إستيلين ووتربانك - كريم نهاري بالهيالورونيك 50 جم",
    nameEn: "Estelin Water Bank Hyaluronic Acid Day Cream 50g",
    descriptionAr:
      "كريم إستيلين ووتربانك النهاري بالهيالورونيك يرطّب بعمق ويحمي حاجز البشرة طوال اليوم بتركيبة خفيفة سريعة الامتصاص.\n\n" +
      "• هيالورونيك أسيد لترطيب يومي مكثّف.\n• يدعم حاجز البشرة ويمنحها نعومة طوال اليوم.\n• خفيف وسريع الامتصاص — قاعدة مثالية قبل المكياج.\n• يُطبّق صباحاً على بشرة نظيفة.\n• 50 جم — ضعي واقي شمس بعده في روتين الصباح.",
    descriptionEn:
      "Estelin Water Bank Hyaluronic Acid Day Cream deeply hydrates and protects the skin barrier all day in a lightweight formula.\n\n" +
      "• Hyaluronic acid for intensive daily hydration.\n• Supports the skin barrier for all-day softness.\n• Lightweight, fast-absorbing — ideal makeup base.\n• Apply in the morning on cleansed skin.\n• 50g — follow with sunscreen in your morning routine.",
  },
  {
    barcode: "6971764158099",
    productType: "cream",
    nameAr: "إستيلين ووتربانك - كريم ليلي بالهيالورونيك 50 جم",
    nameEn: "Estelin Water Bank Hyaluronic Acid Night Cream 50g",
    descriptionAr:
      "كريم إستيلين ووتربانك الليلي بالهيالورونيك يعيد ترطيب البشرة أثناء النوم وينعّم الخطوط الدقيقة بتركيبة مغذية.\n\n" +
      "• ترطيب ليلي مكثّف بالهيالورونيك أسيد.\n• يعيد نعومة البشرة ويدعم حاجزها أثناء النوم.\n• يساعد على تقليل مظهر الجفاف والخطوط الدقيقة.\n• يُطبّق مساءً كخطوة أخيرة في روتين العناية.\n• 50 جم — مناسب لكل أنواع البشرة.",
    descriptionEn:
      "Estelin Water Bank Hyaluronic Acid Night Cream replenishes moisture overnight and softens fine lines with a nourishing formula.\n\n" +
      "• Intensive overnight hyaluronic hydration.\n• Restores softness and supports the skin barrier while you sleep.\n• Helps reduce the look of dryness and fine lines.\n• Apply in the evening as the final skincare step.\n• 50g — suitable for all skin types.",
  },
  {
    barcode: "6971764158501",
    productType: "cleanser",
    nameAr: "إستيلين ووتربانك - غسول وجه بالهيالورونيك 120 جم",
    nameEn: "Estelin Water Bank Hyaluronic Acid Facial Cleanser 120g",
    descriptionAr:
      "غسول إستيلين ووتربانك بالهيالورونيك ينظّف البشرة بلطف دون تجفيف ويحافظ على رطوبتها الطبيعية.\n\n" +
      "• ينظّف الوجه من الأتربة والمكياج الخفيف بلطف.\n• هيالورونيك أسيد يحافظ على ترطيب البشرة أثناء الغسول.\n• لا يجفّف البشرة — مناسب للاستخدام اليومي.\n• يُستخدم صباحاً ومساءً على بشرة مبللة ثم يُشطف.\n• 120 جم — مثالي لخط ووتربانك المرطّب.",
    descriptionEn:
      "Estelin Water Bank Hyaluronic Acid Facial Cleanser gently cleanses without stripping moisture from the skin.\n\n" +
      "• Gently removes dirt and light makeup from the face.\n• Hyaluronic acid helps maintain moisture while cleansing.\n• Does not dry skin — suitable for daily use.\n• Use morning and evening on damp skin, then rinse.\n• 120g — perfect first step in the Water Bank routine.",
  },
  {
    barcode: "6971764158518",
    productType: "cream",
    nameAr: "إستيلين - كريم وجه ألفا أربوتين للتفتيح والإشراق 200 جم",
    nameEn: "Estelin Alpha Arbutin Brightening Face Cream 200g",
    descriptionAr:
      "كريم إستيلين بألفا أربوتين يفتّح البشرة ويقلّل التصبغات ويرطّبها لبشرة أكثر إشراقاً وتوحيداً في اللون.\n\n" +
      "• ألفا أربوتين لمظهر أكثر إشراقاً وتوحيداً.\n• يساعد على تقليل مظهر التصبغات والبقع.\n• يرطّب وينعّم بتركيبة كريمية غنية.\n• مناسب للوجه يومياً صباحاً ومساءً.\n• 200 جم — استخدمي واقي شمس نهاراً.",
    descriptionEn:
      "Estelin Alpha Arbutin Brightening Face Cream brightens skin, reduces pigmentation and deeply moisturises for an even, radiant look.\n\n" +
      "• Alpha arbutin for brighter, more even-toned skin.\n• Helps reduce the appearance of pigmentation and spots.\n• Rich cream texture moisturises and softens.\n• Daily face care morning and evening.\n• 200g — wear sunscreen during the day.",
  },
  {
    barcode: "6971764158525",
    productType: "sunscreen",
    nameAr: "إستيلين ووتربانك - واقي شمس هيالورونيك SPF 50 PA+++ 60 جم",
    nameEn: "Estelin Water Bank Hyaluronic Acid Sunscreen SPF 50 PA+++ 60g",
    descriptionAr:
      "واقي شمس إستيلين ووتربانك بالهيالورونيك — حماية SPF 50 PA+++ مع ترطيب وبدون بقعة بيضاء.\n\n" +
      "• SPF 50 PA+++ حماية عالية من أشعة UVA وUVB.\n• هيالورونيك أسيد لترطيب مكثّف أثناء الحماية.\n• شفاف بدون بقعة بيضاء — مناسب لكل درجات البشرة.\n• خفيف وسريع الامتصاص ويعمل تحت المكياج.\n• 60 جم — للاستخدام اليومي في الصباح.",
    descriptionEn:
      "Estelin Water Bank Hyaluronic Acid Sunscreen SPF 50 PA+++ 60g — hydrating invisible UV protection with no white cast.\n\n" +
      "• SPF 50 PA+++ high UVA/UVB protection.\n• Hyaluronic acid for intensive hydration while protecting.\n• Invisible finish with no white cast — all skin tones.\n• Lightweight, fast-absorbing, works under makeup.\n• 60g — apply every morning.",
  },
  {
    barcode: "6971764158532",
    productType: "sunscreen",
    nameAr: "إستيلين - واقي شمس فائق الخفة مرطّب SPF 50 50 جم",
    nameEn: "Estelin Ultra-Light Hydrating Sunscreen SPF 50 50g",
    descriptionAr:
      "واقي شمس إستيلين فائق الخفة بحماية SPF 50 — تركيبة مرطّبة شفافة مناسبة للاستخدام اليومي على الوجه.\n\n" +
      "• SPF 50 حماية يومية من أشعة الشمس.\n• تركيبة خفيفة شفافة وسريعة الامتصاص.\n• يرطّب البشرة دون طبقة دهنية.\n• مناسب تحت المكياج والاستخدام اليومي.\n• 50 جم — للوجه والرقبة كل صباح.",
    descriptionEn:
      "Estelin Ultra-Light Hydrating Sunscreen SPF 50 50g — lightweight invisible daily sun protection with hydration.\n\n" +
      "• SPF 50 daily sun protection.\n• Ultra-light invisible fast-absorbing formula.\n• Hydrates without a greasy feel.\n• Works under makeup for daily wear.\n• 50g — apply to face and neck every morning.",
  },
  {
    barcode: "6971764158549",
    productType: "sunscreen",
    nameAr: "إستيلين - واقي شمس نياسيناميد + غلوتاثيون SPF 50 50 جم",
    nameEn: "Estelin Niacinamide + Glutathione Sunscreen SPF 50 50g",
    descriptionAr:
      "واقي شمس إستيلين بالنياسيناميد والغلوتاثيون يحمي من الشمس ويساعد على إشراق البشرة وتوحيد لونها بتركيبة خفيفة.\n\n" +
      "• SPF 50 حماية يومية من أشعة الشمس.\n• نياسيناميد + غلوتاثيون لدعم الإشراق وتوحيد اللون.\n• يساعد على تقليل مظهر البقع والتصبغات.\n• تركيبة خفيفة مناسبة للاستخدام اليومي.\n• 50 جم — للوجه صباحاً بعد الكريم.",
    descriptionEn:
      "Estelin Niacinamide + Glutathione Sunscreen SPF 50 50g protects skin and supports a bright, even-toned complexion.\n\n" +
      "• SPF 50 daily sun protection.\n• Niacinamide + glutathione for radiance and even tone.\n• Helps reduce the appearance of spots and pigmentation.\n• Lightweight formula for daily use.\n• 50g — apply to face in the morning after moisturiser.",
  },
];

const ONLY_BARCODES = process.env.ONLY_BARCODES?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const FILTERED = ONLY_BARCODES?.length
  ? FIXES.filter((f) => ONLY_BARCODES.includes(f.barcode))
  : FIXES;

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

async function findProductId(barcode: string): Promise<string> {
  const check = await api<{ exists: boolean; product?: { id: string } }>(
    `/products/barcode-check?barcode=${barcode}`,
  );
  if (!check.exists || !check.product?.id) throw new Error(`Product not found: ${barcode}`);
  return check.product.id;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Fixing ${FILTERED.length} Estelin products...\n`);
  await login();
  console.log("Logged in.\n");

  let updated = 0;
  for (const fix of FILTERED) {
    const productId = await findProductId(fix.barcode);
    const cats = categoryFor(fix.productType);
    console.log(`--- ${fix.barcode} ---`);
    console.log(`  ${fix.nameAr}`);

    await api(`/products/${productId}`, "PATCH", {
      nameAr: fix.nameAr,
      nameEn: fix.nameEn,
      descriptionAr: fix.descriptionAr,
      descriptionEn: fix.descriptionEn,
      categoryId: cats.categoryId,
      subcategoryId: cats.subcategoryId,
      tertiaryCategoryId: cats.tertiaryCategoryId,
      subcategoryIds: cats.subcategoryIds,
      tertiaryCategoryIds: cats.tertiaryCategoryIds,
    });

    console.log(`  ✓ Updated (${fix.productType})\n`);
    updated += 1;
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`Done — updated: ${updated}/${FILTERED.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
