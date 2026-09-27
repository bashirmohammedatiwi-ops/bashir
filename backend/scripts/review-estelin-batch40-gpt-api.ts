/**
 * GPT review — Estelin batch 40 (28 products)
 * Reviews Arabic/English names, descriptions, and category assignment; PATCHes API.
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/review-estelin-batch40-gpt-api.ts
 * Optional: DRY_RUN=1 (GPT only, no PATCH)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const DRY_RUN = process.env.DRY_RUN === "1";
const GPT_MODEL = process.env.GPT_MODEL ?? "gpt-4o";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const CARE_FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const SUN_CARE = "25dc8086-bffa-47af-aaf7-64d503e58a9f";
const FACE_MOISTURIZER = "21801439-d0e9-4106-b5e8-dfdd70ffeb8d";
const CLEANSERS = "05028a17-da64-4c66-b25f-73c758acc2f8";
const SUNSCREEN = "ad2a9e6b-5e20-4393-849a-e5e6c6cc97e2";

type ProductType = "toner" | "cream" | "serum" | "sunscreen" | "cleanser";

type SourceProduct = {
  barcode: string;
  posName?: string;
  productType: ProductType;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

type GptProduct = {
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
  const tertiary =
    type === "toner" || type === "cleanser" ? CLEANSERS : FACE_MOISTURIZER;
  return {
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: tertiary,
    subcategoryIds: [CARE_FACE],
    tertiaryCategoryIds: [tertiary],
  };
}

const SOURCE_PRODUCTS: SourceProduct[] = [
  {
    barcode: "6971764157658",
    posName: "ESTELIN AHA TONER 400ML",
    productType: "toner",
    nameAr: "إستيلين - تونر للوجه بأحماض AHA للتقشير والتنعيم 400 مل",
    nameEn: "Estelin AHA Exfoliating Facial Toner 400ml",
    descriptionAr:
      "تونر إستيلين بأحماض AHA يقشّر بلطف ويهيّئ البشرة لامتصاص الخطوات التالية في روتين العناية.\n\n• تقشير لطيف بأحماض AHA\n• يهيّئ البشرة بعد الغسول\n• يساعد على تنعيم ملمس البشرة\n• مناسب للاستخدام اليومي\n• 400 مل",
    descriptionEn:
      "Estelin AHA Facial Toner gently exfoliates and preps skin for the next steps in your skincare routine.\n\n• Gentle AHA exfoliation\n• Preps skin after cleansing\n• Helps smooth skin texture\n• Suitable for daily use\n• 400ml",
  },
  {
    barcode: "6971764157610",
    posName: "ESTELIN TONER HYA 400ML",
    productType: "toner",
    nameAr: "إستيلين - تونر هيالورونيك مرطّب للوجه 400 مل",
    nameEn: "Estelin Hyaluronic Acid Hydrating Facial Toner 400ml",
    descriptionAr:
      "تونر إستيلين بالهيالورونيك يرطّب بعمق ويمنح البشرة امتلاءً ونعومة بعد التنظيف.\n\n• ترطيب عميق بالهيالورونيك\n• يرفع مستوى الترطيب بعد الغسول\n• ينعّم ويهيّئ البشرة\n• مناسب لكل أنواع البشرة\n• 400 مل",
    descriptionEn:
      "Estelin Hyaluronic Acid Toner delivers deep hydration for plumper, smoother-looking skin after cleansing.\n\n• Deep hyaluronic hydration\n• Boosts moisture after cleansing\n• Softens and preps skin\n• Suitable for all skin types\n• 400ml",
  },
  {
    barcode: "6971764157665",
    posName: "ESTELIN RETINOL TONER 400ML",
    productType: "toner",
    nameAr: "إستيلين - تونر ريتينول لتجديد البشرة 400 مل",
    nameEn: "Estelin Retinol Skin Renewal Facial Toner 400ml",
    descriptionAr:
      "تونر إستيلين بالريتينول يدعم تجديد البشرة ويساعد على تقليل مظهر الخطوط الدقيقة والبهتان.\n\n• يدعم تجديد البشرة\n• يساعد على تقليل الخطوط الدقيقة\n• يهيّئ البشرة للسيروم والكريم\n• للاستخدام ضمن روتين ليلي أو يومي\n• 400 مل",
    descriptionEn:
      "Estelin Retinol Toner supports skin renewal and helps reduce the look of fine lines and dullness.\n\n• Supports skin renewal\n• Helps reduce fine lines\n• Preps skin for serum and cream\n• For daily or evening routines\n• 400ml",
  },
  {
    barcode: "6971764157627",
    posName: "ESTELIN V.C TONER 400ML",
    productType: "toner",
    nameAr: "إستيلين - تونر فيتامين C للإشراق والتوحيد 400 مل",
    nameEn: "Estelin Vitamin C Brightening Facial Toner 400ml",
    descriptionAr:
      "تونر إستيلين بفيتامين C يفتّح ويوحّد لون البشرة ويمنح إشراقة طبيعية بعد الغسول.\n\n• إشراقة بفيتامين C\n• يساعد على توحيد لون البشرة\n• يرطّب ويهيّئ البشرة\n• مناسب للاستخدام اليومي\n• 400 مل",
    descriptionEn:
      "Estelin Vitamin C Toner brightens and evens skin tone for a naturally radiant complexion.\n\n• Vitamin C radiance\n• Helps even skin tone\n• Hydrates and preps skin\n• Suitable for daily use\n• 400ml",
  },
  {
    barcode: "6971764157641",
    posName: "ESTELIN REPAIR TONER 400ML",
    productType: "toner",
    nameAr: "إستيلين - تونر مُرمّم لإصلاح البشرة 400 مل",
    nameEn: "Estelin Repair Restoring Facial Toner 400ml",
    descriptionAr:
      "تونر إستيلين المُرمّم يعزّز إصلاح البشرة ويرطّبها بعد التنظيف لروتين أكثر توازناً.\n\n• يعزّز إصلاح البشرة\n• يرطّب بعد الغسول\n• يهيّئ البشرة للخطوات التالية\n• مناسب للبشرة المتضررة\n• 400 مل",
    descriptionEn:
      "Estelin Repair Toner supports skin recovery and hydration after cleansing.\n\n• Supports skin repair\n• Hydrates after cleansing\n• Preps skin for next steps\n• Ideal for stressed skin\n• 400ml",
  },
  {
    barcode: "6971764157634",
    posName: "ESTELIN ARBUTIN TONER 400ML",
    productType: "toner",
    nameAr: "إستيلين - تونر أربوتين للتفتيح والتوحيد 400 مل",
    nameEn: "Estelin Alpha Arbutin Brightening Facial Toner 400ml",
    descriptionAr:
      "تونر إستيلين بأربوتين يساعد على تفتيح البشرة وتقليل البقع وتوحيد اللون بعد الغسول.\n\n• أربوتين للتفتيح\n• يساعد على تقليل البقع\n• يوحّد لون البشرة\n• يرطّب ويهيّئ البشرة\n• 400 مل",
    descriptionEn:
      "Estelin Arbutin Toner helps brighten skin, reduce dark spots and even out tone after cleansing.\n\n• Alpha arbutin brightening\n• Helps reduce dark spots\n• Evens skin tone\n• Hydrates and preps skin\n• 400ml",
  },
  {
    barcode: "6971764157962",
    posName: "ESTELIN RETINOL CREAM 200G",
    productType: "cream",
    nameAr: "إستيلين - كريم ريتينول لتجديد البشرة 200 جم",
    nameEn: "Estelin Retinol Skin Renewal Face Cream 200g",
    descriptionAr:
      "كريم إستيلين بالريتينول يدعم تجديد البشرة ويساعد على تقليل مظهر الخطوط الدقيقة والبهتان.\n\n• ريتينول لتجديد البشرة\n• يساعد على تقليل الخطوط الدقيقة\n• يرطّب وينعّم\n• تركيبة كريمية غنية\n• 200 جم",
    descriptionEn:
      "Estelin Retinol Cream supports skin renewal and helps reduce the appearance of fine lines and dullness.\n\n• Retinol for skin renewal\n• Helps reduce fine lines\n• Moisturises and softens\n• Rich cream texture\n• 200g",
  },
  {
    barcode: "6971764157979",
    posName: "ESTELIN PEPTIDE+COLLAGEN CREAM 200G",
    productType: "cream",
    nameAr: "إستيلين - كريم ببتيد + كولاجين للشد والمرونة 200 جم",
    nameEn: "Estelin Peptide + Collagen Firming Face Cream 200g",
    descriptionAr:
      "كريم إستيلين بالببتيد والكولاجين يعزّز مرونة البشرة ويساعد على شدها وترطيبها بعمق.\n\n• ببتيد + كولاجين للشد\n• يعزّز مرونة البشرة\n• يرطّب بعمق\n• ينعّم ملمس البشرة\n• 200 جم",
    descriptionEn:
      "Estelin Peptide + Collagen Cream boosts elasticity, firms skin and delivers deep nourishment.\n\n• Peptide + collagen firming\n• Boosts skin elasticity\n• Deep hydration\n• Smooths skin texture\n• 200g",
  },
  {
    barcode: "6971764157931",
    posName: "ESTELIN TURMERIC + VIT.C CREAM 200G",
    productType: "cream",
    nameAr: "إستيلين - كريم كركم + فيتامين C للتفتيح 200 جم",
    nameEn: "Estelin Turmeric + Vitamin C Brightening Face Cream 200g",
    descriptionAr:
      "كريم إستيلين بالكركم وفيتامين C يفتّح البشرة ويوحّد اللون ويرطّبها لإشراقة صحية.\n\n• كركم + فيتامين C للإشراق\n• يساعد على توحيد اللون\n• يرطّب وينعّم\n• مناسب للاستخدام اليومي\n• 200 جم",
    descriptionEn:
      "Estelin Turmeric + Vitamin C Cream brightens, evens tone and hydrates for a healthy glow.\n\n• Turmeric + vitamin C glow\n• Helps even skin tone\n• Moisturises and softens\n• Suitable for daily use\n• 200g",
  },
  {
    barcode: "6971764157986",
    posName: "ESTELIN CERAMID CREAM 200G",
    productType: "cream",
    nameAr: "إستيلين - كريم سيراميد لترطيب البشرة وحماية الحاجز 200 جم",
    nameEn: "Estelin Ceramide Barrier Moisturising Face Cream 200g",
    descriptionAr:
      "كريم إستيلين بالسيراميد يقوّي حاجز البشرة ويرطّبها بعمق لبشرة أكثر نعومة ومرونة.\n\n• سيراميد لحماية الحاجز\n• ترطيب عميق وطويل\n• ينعّم البشرة الجافة\n• مناسب للاستخدام اليومي\n• 200 جم",
    descriptionEn:
      "Estelin Ceramide Cream strengthens the skin barrier and delivers lasting moisture for softer skin.\n\n• Ceramide barrier support\n• Long-lasting deep hydration\n• Softens dry skin\n• Suitable for daily use\n• 200g",
  },
  {
    barcode: "6971764157290",
    posName: "ESTELIN UVA/UVB SPF +50",
    productType: "sunscreen",
    nameAr: "إستيلين - واقي شمس UVA/UVB بعامل SPF 50+ 50 جم",
    nameEn: "Estelin UVA/UVB Broad Spectrum Sunscreen SPF 50+ 50g",
    descriptionAr:
      "واقي شمس إستيلين يوفر حماية واسعة من أشعة UVA وUVB مع تركيبة مناسبة للاستخدام اليومي على الوجه.\n\n• حماية UVA/UVB\n• مناسب للاستخدام اليومي\n• خطوة أخيرة في روتين الصباح\n• للوجه والمناطق المعرّضة\n• تركيبة واقية يومية",
    descriptionEn:
      "Estelin UVA/UVB Sunscreen provides broad-spectrum daily protection for the face.\n\n• UVA/UVB protection\n• Suitable for daily use\n• Final step in morning routine\n• For face and exposed areas\n• Daily sun defence formula",
  },
  {
    barcode: "6971764157276",
    posName: "ESTELIN SUPER MOISTURIZING SUNSCREEN LOTION SPF 50 75ML",
    productType: "sunscreen",
    nameAr: "إستيلين - لوشن واقي شمس مرطّب SPF 50 75 مل",
    nameEn: "Estelin Super Moisturizing Sunscreen Lotion SPF 50 75ml",
    descriptionAr:
      "لوشن واقي شمس إستيلين المرطّب يحمي من الشمس ويرطّب البشرة بتركيبة خفيفة مناسبة تحت المكياج.\n\n• SPF 50 حماية يومية\n• ترطيب مكثّف\n• خفيف وسريع الامتصاص\n• مناسب تحت المكياج\n• 75 مل",
    descriptionEn:
      "Estelin Super Moisturizing Sunscreen Lotion SPF 50 hydrates and protects with a lightweight daily formula.\n\n• SPF 50 daily protection\n• Intensive hydration\n• Lightweight fast-absorbing\n• Works under makeup\n• 75ml",
  },
  {
    barcode: "6971764157948",
    posName: "ESTELIN ALPHA ARBUTIN + NIACINAMIDE WHITENING CREAM 200G",
    productType: "cream",
    nameAr: "إستيلين - كريم ألفا أربوتين + نياسيناميد للتفتيح 200 جم",
    nameEn: "Estelin Alpha Arbutin + Niacinamide Brightening Face Cream 200g",
    descriptionAr:
      "كريم إستيلين بألفا أربوتين والنياسيناميد يفتّح البشرة ويقلّل البقع ويوحّد اللون بترطيب عميق.\n\n• ألفا أربوتين + نياسيناميد\n• يساعد على تفتيح البشرة\n• يقلّل مظهر البقع\n• يرطّب وينعّم\n• 200 جم",
    descriptionEn:
      "Estelin Alpha Arbutin + Niacinamide Cream brightens skin, fades spots and evens tone with deep moisture.\n\n• Alpha arbutin + niacinamide\n• Brightens skin\n• Helps fade dark spots\n• Moisturises and softens\n• 200g",
  },
  {
    barcode: "6971764157955",
    posName: "ESTELIN HYALURONIC + POLYGLUTAMIC MOISTURISING CREAM 200G",
    productType: "cream",
    nameAr: "إستيلين - كريم هيالورونيك + بوليغلوتاميك مرطّب 200 جم",
    nameEn: "Estelin Hyaluronic + Polyglutamic Acid Moisturising Cream 200g",
    descriptionAr:
      "كريم إستيلين بالهيالورونيك وبوليغلوتاميك يرطّب بعمق ويحبس الرطوبة لبشرة أكثر امتلاءً ونعومة.\n\n• هيالورونيك + بوليغلوتاميك\n• ترطيب عميق ومكثّف\n• يحبس الرطوبة\n• ينعّم البشرة الجافة\n• 200 جم",
    descriptionEn:
      "Estelin Hyaluronic + Polyglutamic Acid Cream locks in moisture for plumper, smoother skin.\n\n• Hyaluronic + polyglutamic acid\n• Deep intensive hydration\n• Locks in moisture\n• Softens dry skin\n• 200g",
  },
  {
    barcode: "6971764154558",
    posName: "ESTELIN ULTRA-LIGHT INVISIBLE SUNSCREEN SPF 50 PA+++ 50G",
    productType: "sunscreen",
    nameAr: "إستيلين - واقي شمس فائق الخفة مرطّب SPF 50 PA+++ 50 جم",
    nameEn: "Estelin Ultra-Light Hydrating Invisible Sunscreen SPF 50 PA+++ 50g",
    descriptionAr:
      "واقي شمس إستيلين فائق الخفة بتركيبة مرطّبة وشفافة بدون بقعة بيضاء — حماية SPF 50 PA+++ يومية.\n\n• SPF 50 PA+++\n• شفاف بدون بقعة بيضاء\n• خفيف وغير دهني\n• مرطّب للبشرة\n• 50 جم",
    descriptionEn:
      "Estelin Ultra-Light Hydrating Invisible Sunscreen SPF 50 PA+++ 50g — weightless, invisible daily UV defence.\n\n• SPF 50 PA+++\n• Invisible no white cast\n• Ultra-light non-greasy\n• Hydrating formula\n• 50g",
  },
  {
    barcode: "6971764154565",
    posName: "ESTELIN ULTRA-LIGHT INVISIBLE SUNSCREEN SPF 80 PA+++ 100G",
    productType: "sunscreen",
    nameAr: "إستيلين - واقي شمس فائق الخفة مرطّب SPF 80 PA+++ 100 جم",
    nameEn: "Estelin Ultra-Light Hydrating Invisible Sunscreen SPF 80 PA+++ 100g",
    descriptionAr:
      "واقي شمس إستيلين فائق الخفة بحماية SPF 80 PA+++ وترطيب للوجه والجسم بحجم اقتصادي 100 جم.\n\n• SPF 80 PA+++\n• حجم 100 جم\n• شفاف وسريع الامتصاص\n• مناسب للوجه والجسم\n• غير دهني",
    descriptionEn:
      "Estelin Ultra-Light Hydrating Invisible Sunscreen SPF 80 PA+++ 100g — high protection, invisible finish.\n\n• SPF 80 PA+++\n• 100g size\n• Invisible fast-absorbing\n• For face and body\n• Non-greasy",
  },
  {
    barcode: "6971764159997",
    posName: "ESTELIN RETINOL + FULLERENE AGE DEFYING CREAM 200G",
    productType: "cream",
    nameAr: "إستيلين - كريم ريتينول + فوليرين مضاد للتقدّم في السن 200 جم",
    nameEn: "Estelin Retinol + Fullerene Age Defying Face Cream 200g",
    descriptionAr:
      "كريم إستيلين بالريتينول والفوليرين يعزّز تجديد البشرة ويحميها من علامات التقدّم في السن والخطوط الدقيقة.\n\n• ريتينول + فوليرين\n• مضاد للتقدّم في السن\n• يعزّز مرونة البشرة\n• يرطّب بعمق\n• 200 جم",
    descriptionEn:
      "Estelin Retinol + Fullerene Age Defying Cream renews skin and helps fight signs of ageing and fine lines.\n\n• Retinol + fullerene\n• Anti-ageing care\n• Boosts skin firmness\n• Deep hydration\n• 200g",
  },
  {
    barcode: "6942686400863",
    posName: "ESTELIN COLLAGEN BOUNCY & FIRM FACE SERUM 50ML",
    productType: "serum",
    nameAr: "إستيلين - سيروم كولاجين مرن ومشد للوجه 50 مل",
    nameEn: "Estelin Collagen Bouncy & Firm Face Serum 50ml",
    descriptionAr:
      "سيروم إستيلين بالكولاجين يعزّز مرونة البشرة ويساعد على شدها وملء الخطوط الدقيقة لبشرة أكثر شباباً.\n\n• كولاجين للشد والمرونة\n• يعزّز امتلاء البشرة\n• خفيف وسريع الامتصاص\n• مناسب صباحاً ومساءً\n• 50 مل",
    descriptionEn:
      "Estelin Collagen Bouncy & Firm Face Serum boosts elasticity and helps firm skin for a youthful look.\n\n• Collagen firming\n• Boosts skin plumpness\n• Lightweight fast-absorbing\n• AM and PM use\n• 50ml",
  },
  {
    barcode: "6942686400870",
    posName: "ESTELIN RETINOL AGE PERFECT FACE SERUM 50ML",
    productType: "serum",
    nameAr: "إستيلين - سيروم ريتينول Age Perfect للوجه 50 مل",
    nameEn: "Estelin Retinol Age Perfect Face Serum 50ml",
    descriptionAr:
      "سيروم إستيلين بالريتينول يدعم تجديد البشرة ويساعد على تقليل الخطوط الدقيقة وتحسين ملمس الوجه.\n\n• ريتينول لتجديد البشرة\n• يساعد على تقليل الخطوط الدقيقة\n• يحسّن ملمس البشرة\n• يُستخدم قبل الكريم\n• 50 مل",
    descriptionEn:
      "Estelin Retinol Age Perfect Face Serum supports renewal and helps reduce fine lines and improve texture.\n\n• Retinol skin renewal\n• Helps reduce fine lines\n• Improves skin texture\n• Apply before moisturiser\n• 50ml",
  },
  {
    barcode: "6971764160108",
    posName: "ESTELIN MOISTURE BARRIER REPAIR SUNSCREEN SPF 50 PA++ 50G",
    productType: "sunscreen",
    nameAr: "إستيلين - واقي شمس لإصلاح حاجز البشرة SPF 50 PA++ 50 جم",
    nameEn: "Estelin Moisture Barrier Repair Sunscreen SPF 50 PA++ 50g",
    descriptionAr:
      "واقي شمس إستيلين لإصلاح حاجز البشرة بتركيبة سيراميد — حماية SPF 50 PA++ مع ترطيب يومي.\n\n• SPF 50 PA++\n• إصلاح حاجز البشرة\n• تركيبة مرطّبة\n• مناسب للاستخدام اليومي\n• 50 جم",
    descriptionEn:
      "Estelin Moisture Barrier Repair Sunscreen SPF 50 PA++ 50g — ceramide barrier repair with daily UV defence.\n\n• SPF 50 PA++\n• Barrier repair formula\n• Hydrating care\n• Suitable for daily use\n• 50g",
  },
  {
    barcode: "6971764160115",
    posName: "ESTELIN MOISTURE BARRIER REPAIR SUNSCREEN SPF 90 PA++ 100ML",
    productType: "sunscreen",
    nameAr: "إستيلين - واقي شمس لإصلاح حاجز البشرة SPF 90 PA++ 100 مل",
    nameEn: "Estelin Moisture Barrier Repair Sunscreen SPF 90 PA++ 100ml",
    descriptionAr:
      "واقي شمس إستيلين عالي الحماية SPF 90 PA++ مع إصلاح حاجز البشرة — حجم 100 مل للاستخدام اليومي.\n\n• SPF 90 PA++\n• إصلاح حاجز البشرة\n• حجم 100 مل\n• حماية يومية عالية\n• مناسب للوجه",
    descriptionEn:
      "Estelin Moisture Barrier Repair Sunscreen SPF 90 PA++ 100ml — high protection with barrier repair care.\n\n• SPF 90 PA++\n• Barrier repair care\n• 100ml size\n• High daily protection\n• For face",
  },
  {
    barcode: "6971764158082",
    posName: "ESTELIN WATER BANK HYALURONIC ACID DAY CREAM 50G",
    productType: "cream",
    nameAr: "إستيلين Water Bank - كريم نهاري بالهيالورونيك 50 جم",
    nameEn: "Estelin Water Bank Hyaluronic Acid Day Cream 50g",
    descriptionAr:
      "كريم إستيلين Water Bank النهاري بالهيالورونيك يرطّب بعمق ويحمي حاجز البشرة طوال اليوم.\n\n• هيالورونيك للترطيب اليومي\n• يحمي حاجز البشرة\n• خفيف وسريع الامتصاص\n• قاعدة مثالية قبل واقي الشمس\n• 50 جم",
    descriptionEn:
      "Estelin Water Bank Hyaluronic Acid Day Cream deeply hydrates and protects the skin barrier all day.\n\n• Hyaluronic daily hydration\n• Protects skin barrier\n• Lightweight fast-absorbing\n• Ideal base before sunscreen\n• 50g",
  },
  {
    barcode: "6971764158099",
    posName: "ESTELIN WATER BANK HYALURONIC ACID NIGHT CREAM 50G",
    productType: "cream",
    nameAr: "إستيلين Water Bank - كريم ليلي بالهيالورونيك 50 جم",
    nameEn: "Estelin Water Bank Hyaluronic Acid Night Cream 50g",
    descriptionAr:
      "كريم إستيلين Water Bank الليلي بالهيالورونيك يعيد ترطيب البشرة أثناء النوم وينعّم الخطوط الدقيقة.\n\n• ترطيب ليلي مكثّف\n• يعيد نعومة البشرة\n• يدعم حاجز البشرة\n• للاستخدام كل ليلة\n• 50 جم",
    descriptionEn:
      "Estelin Water Bank Hyaluronic Acid Night Cream replenishes moisture overnight and softens fine lines.\n\n• Intensive overnight hydration\n• Restores skin softness\n• Supports skin barrier\n• Nightly use\n• 50g",
  },
  {
    barcode: "6971764158501",
    posName: "ESTELIN WATER BANK HYALURONIC FACIAL CLEANSER 120G",
    productType: "cleanser",
    nameAr: "إستيلين Water Bank - غسول وجه بالهيالورونيك 120 جم",
    nameEn: "Estelin Water Bank Hyaluronic Acid Facial Cleanser 120g",
    descriptionAr:
      "غسول إستيلين Water Bank بالهيالورونيك ينظّف البشرة بلطف دون تجفيف ويحافظ على الترطيب.\n\n• ينظّف بلطف\n• هيالورونيك مرطّب\n• لا يجفّف البشرة\n• مناسب للاستخدام اليومي\n• 120 جم",
    descriptionEn:
      "Estelin Water Bank Hyaluronic Acid Facial Cleanser gently cleanses without stripping moisture.\n\n• Gentle cleanse\n• Hyaluronic hydration\n• Does not dry skin\n• Suitable for daily use\n• 120g",
  },
  {
    barcode: "6971764158518",
    posName: "ESTELIN ALPHA ARBUTIN FACE WHITENING CREAM 200G",
    productType: "cream",
    nameAr: "إستيلين - كريم ألفا أربوتين لتفتيح الوجه 200 جم",
    nameEn: "Estelin Alpha Arbutin Brightening Face Cream 200g",
    descriptionAr:
      "كريم إستيلين بألفا أربوتين يفتّح البشرة ويقلّل التصبغات ويرطّبها لبشرة أكثر إشراقاً وتوحيداً.\n\n• ألفا أربوتين للتفتيح\n• يساعد على تقليل التصبغات\n• يرطّب وينعّم\n• مناسب للوجه يومياً\n• 200 جم",
    descriptionEn:
      "Estelin Alpha Arbutin Face Brightening Cream brightens skin, reduces pigmentation and deeply moisturises.\n\n• Alpha arbutin brightening\n• Helps reduce pigmentation\n• Moisturises and softens\n• Daily face care\n• 200g",
  },
  {
    barcode: "6971764158525",
    posName: "ESTELIN WATER BANK HYALURONIC SUNSCREEN SPF 50 PA+++ 60G",
    productType: "sunscreen",
    nameAr: "إستيلين Water Bank - واقي شمس هيالورونيك SPF 50 PA+++ 60 جم",
    nameEn: "Estelin Water Bank Hyaluronic Acid Sunscreen SPF 50 PA+++ 60g",
    descriptionAr:
      "واقي شمس إستيلين Water Bank بالهيالورونيك — حماية SPF 50 PA+++ مع ترطيب وبدون بقعة بيضاء.\n\n• SPF 50 PA+++\n• هيالورونيك مرطّب\n• حماية UVA/UVB\n• شفاف بدون بقعة بيضاء\n• 60 جم",
    descriptionEn:
      "Estelin Water Bank Hyaluronic Acid Sunscreen SPF 50 PA+++ 60g — hydrating invisible UV protection.\n\n• SPF 50 PA+++\n• Hyaluronic hydration\n• UVA/UVB protection\n• Invisible no white cast\n• 60g",
  },
  {
    barcode: "6971764158532",
    posName: "ESTELIN ULTRA-LIGHT HYDRATING SUNSCREEN SPF 50 50G",
    productType: "sunscreen",
    nameAr: "إستيلين - واقي شمس فائق الخفة SPF 50 50 جم",
    nameEn: "Estelin Ultra-Light Hydrating Sunscreen SPF 50 50g",
    descriptionAr:
      "واقي شمس إستيلين فائق الخفة بحماية SPF 50 — تركيبة مرطّبة شفافة مناسبة للاستخدام اليومي.\n\n• SPF 50\n• خفيف وشفاف\n• مرطّب غير دهني\n• مناسب تحت المكياج\n• 50 جم",
    descriptionEn:
      "Estelin Ultra-Light Hydrating Sunscreen SPF 50 50g — lightweight invisible daily sun protection.\n\n• SPF 50\n• Ultra-light invisible\n• Non-greasy hydration\n• Works under makeup\n• 50g",
  },
  {
    barcode: "6971764158549",
    posName: "ESTELIN NIACINAMIDE + GLUTATHIONE SUNSCREEN SPF 50",
    productType: "sunscreen",
    nameAr: "إستيلين - واقي شمس نياسيناميد + غلوتاثيون SPF 50 50 جم",
    nameEn: "Estelin Niacinamide + Glutathione Sunscreen SPF 50 50g",
    descriptionAr:
      "واقي شمس إستيلين بالنياسيناميد والغلوتاثيون يحمي من الشمس ويساعد على إشراق البشرة وتوحيد اللون.\n\n• SPF 50\n• نياسيناميد + غلوتاثيون\n• حماية وإشراق\n• مناسب للاستخدام اليومي\n• تركيبة خفيفة",
    descriptionEn:
      "Estelin Niacinamide + Glutathione Sunscreen SPF 50 50g protects skin and supports bright, even-toned complexion.\n\n• SPF 50\n• Niacinamide + glutathione\n• Protection and radiance\n• Suitable for daily use\n• Lightweight formula",
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

async function findProductId(barcode: string): Promise<string> {
  const check = await api<{ exists: boolean; product?: { id: string } }>(
    `/products/barcode-check?barcode=${barcode}`,
  );
  if (!check.exists || !check.product?.id) throw new Error(`Product not found: ${barcode}`);
  return check.product.id;
}

async function callGpt(products: SourceProduct[]): Promise<GptProduct[]> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required");

  const systemPrompt = `You are a senior cosmetics catalog editor for an Iraqi beauty e-commerce app (Al Hayaa / ديمة الحياة).

Review and improve product listings for Estelin (إستيلين) skincare — 28 separate single-SKU products.

RULES:
1. Arabic names: start with "إستيلين" then dash and expressive Iraqi-market Arabic. Include exact size (مل/جم). Natural Iraqi Arabic, not stiff translation.
2. English names: "Estelin" + clear product type + key actives + size. Use "Brightening" not "Whitening". Keep official line names like "Water Bank" when relevant.
3. Descriptions: One intro sentence/paragraph, then blank line, then 4-6 bullet points starting with "• ". Arabic and English must match meaning. Mention usage tips where helpful (e.g. retinol at night, SPF in morning).
4. productType must be one of: toner, cream, serum, sunscreen, cleanser — keep same as input unless clearly wrong.
5. Do NOT invent ingredients not implied by POS/product name. Do NOT change barcode.
6. Toners = toner, face washes = cleanser, serums = serum, sunscreens = sunscreen, face creams = cream.
7. Include SPF/PA rating in names when product is sunscreen.
8. High accuracy — these are real retail barcodes.

Return JSON: { "products": [ { "barcode", "productType", "nameAr", "nameEn", "descriptionAr", "descriptionEn" } ] }`;

  const userPrompt = JSON.stringify(
    products.map((p) => ({
      barcode: p.barcode,
      posName: p.posName,
      productType: p.productType,
      currentNameAr: p.nameAr,
      currentNameEn: p.nameEn,
      currentDescriptionAr: p.descriptionAr,
      currentDescriptionEn: p.descriptionEn,
    })),
    null,
    2,
  );

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GPT_MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Review and improve all products:\n${userPrompt}` },
      ],
    }),
  });

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(json.error?.message ?? `OpenAI HTTP ${res.status}`);

  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty GPT response");

  const parsed = JSON.parse(content) as { products?: GptProduct[] };
  if (!parsed.products?.length) throw new Error("GPT returned no products");

  const byBarcode = new Map(parsed.products.map((p) => [p.barcode, p]));
  const missing = products.filter((p) => !byBarcode.has(p.barcode));
  if (missing.length) throw new Error(`GPT missing barcodes: ${missing.map((p) => p.barcode).join(", ")}`);

  return products.map((p) => {
    const g = byBarcode.get(p.barcode)!;
    return {
      barcode: p.barcode,
      productType: g.productType ?? p.productType,
      nameAr: g.nameAr.trim(),
      nameEn: g.nameEn.trim(),
      descriptionAr: g.descriptionAr.trim(),
      descriptionEn: g.descriptionEn.trim(),
    };
  });
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`GPT model: ${GPT_MODEL}`);
  console.log(`Products: ${SOURCE_PRODUCTS.length}`);
  console.log(`DRY_RUN: ${DRY_RUN}\n`);

  const reviewed = await callGpt(SOURCE_PRODUCTS);
  const outPath = join(__dirname, "estelin-batch40-gpt-reviewed.json");
  writeFileSync(outPath, JSON.stringify(reviewed, null, 2), "utf8");
  console.log(`GPT review saved: ${outPath}\n`);

  if (DRY_RUN) {
    for (const p of reviewed) {
      console.log(`--- ${p.barcode} ---`);
      console.log(`  AR: ${p.nameAr}`);
      console.log(`  EN: ${p.nameEn}`);
      console.log(`  Type: ${p.productType}`);
    }
    return;
  }

  await login();
  console.log("Logged in.\n");

  let updated = 0;
  for (const p of reviewed) {
    const productId = await findProductId(p.barcode);
    const cats = categoryFor(p.productType);
    console.log(`--- ${p.barcode} ---`);
    console.log(`  ${p.nameAr}`);

    await api(`/products/${productId}`, "PATCH", {
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      categoryId: cats.categoryId,
      subcategoryId: cats.subcategoryId,
      tertiaryCategoryId: cats.tertiaryCategoryId,
      subcategoryIds: cats.subcategoryIds,
      tertiaryCategoryIds: cats.tertiaryCategoryIds,
    });

    console.log(`  ✓ Updated (${p.productType})\n`);
    updated += 1;
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`Done — updated: ${updated}/${reviewed.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
