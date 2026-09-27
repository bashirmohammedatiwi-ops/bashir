/**
 * Mixed batch — 32 separate products (Bio Balance, Natura House, Unicorn/Turquaz, Cathy Doll).
 * No shade variants in API; GPT for naming only; no images.
 * Usage: npx tsx scripts/add-mixed-batch32-single-api.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { estimateCostUsd, researchProductNameWithGpt } from "./lib/gpt-barcode-import/openai";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

function loadEnvFile(): void {
  const envPath = join(__dirname, "../.env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnvFile();

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const CARE_FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const BODY = "23aaaa07-91ee-4937-847e-d7866a9e937a";
const HAIR = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const FOOT = "905db637-498a-49bc-83e8-b3d0a335d5b6";
const SUN_CARE = "25dc8086-bffa-47af-aaf7-64d503e58a9f";
const HANDS = "01ad1f0d-7c15-469c-bf86-85abd135e68f";
const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE_MK = "2bbecee1-084d-446c-b4fd-65f769130de9";

const FACE_MOISTURIZER = "21801439-d0e9-4106-b5e8-dfdd70ffeb8d";
const CLEANSERS = "05028a17-da64-4c66-b25f-73c758acc2f8";
const EYE_CARE = "09bedca5-0c6c-4a71-9b03-4bf29cecaf53";
const FACE_MASKS = "5a89a7d0-16d9-47d6-8575-2961289fc526";
const SUNSCREEN = "ad2a9e6b-5e20-4393-849a-e5e6c6cc97e2";
const SHAMPOO = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const FOOT_CREAM = "d2cf1ce9-fd36-4292-80f3-9fb90c759a3c";
const BODY_SCRUB = "15e1a2c3-9924-4fd3-a7d9-b66d9adaddce";
const BODY_LOTION = "fcd86b22-a0fd-47b9-ba4c-c76164dadab2";
const BODY_WHITENING = "5ab05504-516e-4104-a934-6d23666ffdca";
const BODY_WASH = "35be991e-3062-4fbd-8f0a-2393bf806524";
const SHOWER = "89c0752d-b2c7-45fe-9e7f-41adccc7e200";
const BB_CC = "7f6f5a87-4736-49e7-963f-4736b6b7aeb0";
const MAKEUP_REMOVERS = "a53f7b8d-1b45-4fa8-9055-d5de6fac6ab8";

type BrandKey = "bio-balance" | "natura-house" | "unicorn" | "cathy-doll";

type ProductMeta = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  brandKey: BrandKey;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId?: string;
  shadeEn?: string;
  shadeAr?: string;
  sizeEn?: string;
  sizeAr?: string;
  descriptionAr: string;
  descriptionEn: string;
};

const BRANDS: Record<
  BrandKey,
  { brandAr: string; brandEn: string; prefix: string }
> = {
  "bio-balance": { brandAr: "بايو بالانس", brandEn: "Bio Balance", prefix: "BB" },
  "natura-house": { brandAr: "ناتورا هاوس", brandEn: "Natura House", prefix: "NH" },
  unicorn: { brandAr: "يونيكورن توركواز", brandEn: "Unicorn by Turquaz", prefix: "UNI" },
  "cathy-doll": { brandAr: "كاثي دول", brandEn: "Cathy Doll", prefix: "CD" },
};

const CURATED_NAMES: Record<string, { nameAr: string; nameEn: string }> = {
  "8697711700057": {
    nameAr: "بايو بالانس – كريم تفتيح الوجه النهاري SPF30 55 مل",
    nameEn: "Bio Balance Facial Whitening Day Cream SPF30 – 55 ml",
  },
  "8697711700064": {
    nameAr: "بايو بالانس – كريم تفتيح تحت العين 15 مل",
    nameEn: "Bio Balance Brightening Eye Cream – 15 ml",
  },
  "8697711700231": {
    nameAr: "بايو بالانس – كريم إزالة علامات التمدد 60 مل",
    nameEn: "Bio Balance Stretch Mark Remover Cream – 60 ml",
  },
  "8697711700026": {
    nameAr: "بايو بالانس – بلسم الكعب المتشقق والقدم 60 مل",
    nameEn: "Bio Balance Cracked Heel & Foot Balm – 60 ml",
  },
  "8697711701078": {
    nameAr: "بايو بالانس – كريم Derma-Age لتجديد البشرة 55 مل",
    nameEn: "Bio Balance Derma-Age Rejuvenating Skin Care Cream – 55 ml",
  },
  "8697711701016": {
    nameAr: "بايو بالانس – جل غسول الوجه DermaSoothe 250 مل",
    nameEn: "Bio Balance DermaSoothe Facial Cleansing Gel – 250 ml",
  },
  "8697711700187": {
    nameAr: "بايو بالانس – شامبو الألوفيرا العضوي 330 مل",
    nameEn: "Bio Balance Organic Aloe Vera Shampoo – 330 ml",
  },
  "8697711700156": {
    nameAr: "بايو بالانس – شامبو اللافندر العضوي 330 مل",
    nameEn: "Bio Balance Organic Lavender Shampoo – 330 ml",
  },
  "8697711700170": {
    nameAr: "بايو بالانس – شامبو التطهير بالحمضيات وإكليل الجبل 330 مل",
    nameEn: "Bio Balance Organic Citrus & Rosemary Purifying Shampoo – 330 ml",
  },
  "8697711700163": {
    nameAr: "بايو بالانس – شامبو الرمان العضوي 330 مل",
    nameEn: "Bio Balance Organic Pomegranate Shampoo – 330 ml",
  },
  "8000921210627": {
    nameAr: "ناتورا هاوس – كونسيرتر سوبر مكثّف White Perfection 15 مل",
    nameEn: "Natura House White Perfection Super Intensive Concentrate – 15 ml",
  },
  "8000921210603": {
    nameAr: "ناتورا هاوس – كريم تفتيح الوجه White Perfection 50 مل",
    nameEn: "Natura House White Perfection Lightening Facial Cream – 50 ml",
  },
  "6297000898582": {
    nameAr: "يونيكورن توركواز – واقي شمس مرطب SPF50 50 مل",
    nameEn: "Unicorn by Turquaz Hydrating Sun Block SPF50 – 50 ml",
  },
  "6297000898131": {
    nameAr: "يونيكورن توركواز – تونر وبخاخ مرطب 155 مل",
    nameEn: "Unicorn by Turquaz Toner & Hydrating Mist – 155 ml",
  },
  "6297000898827": {
    nameAr: "يونيكورن – كريم الوجه بفيتامين سي Smooth & Radiant 100 مل",
    nameEn: "Unicorn Vitamin C Face Cream Smooth & Radiant Skin – 100 ml",
  },
  "8809962370372": {
    nameAr: "كاثي دول – سيروم الجسم فيتامين سي وألوفيرا المرطّب 175 غ",
    nameEn: "Cathy Doll Vit C & Aloe Vera Soothing Body Serum – 175 g",
  },
  "8809962371492": {
    nameAr: "كاثي دول – موس غسول المناطق الحساسة Come On Baby بالكولاجين 150 مل",
    nameEn: "Cathy Doll Come On Baby Feminine Intimate Mousse Collagen – 150 ml",
  },
  "8858842029923": {
    nameAr: "كاثي دول – غسول فوم Fiber White X 100 غ",
    nameEn: "Cathy Doll Fiber White X Cleansing Foam – 100 g",
  },
  "8858842070659": {
    nameAr: "كاثي دول – غسول فوم تفتيح Ready 2 White 100 مل",
    nameEn: "Cathy Doll Ready 2 White Lightening Foam Cleanser – 100 ml",
  },
  "8858842011676": {
    nameAr: "كاثي دول – كريم L-Glutathione Magic SPF50 60 مل",
    nameEn: "Cathy Doll L-Glutathione Magic Cream SPF50 – 60 ml",
  },
  "8809396174744": {
    nameAr: "كاثي دول – كريم Ready 2 White White Boosting 75 مل",
    nameEn: "Cathy Doll Ready 2 White White Boosting Cream – 75 ml",
  },
  "8858842013380": {
    nameAr: "كاثي دول – ماسك اليدين 2% هايلورون Grape Jelly 60 غ",
    nameEn: "Cathy Doll 2% Hyaluron Grape Jelly Hand Mask – 60 g",
  },
  "8809396174058": {
    nameAr: "كاثي دول – لوشن الجسم Ready 2 White Whitener 150 مل",
    nameEn: "Cathy Doll Ready 2 White Whitener Body Lotion – 150 ml",
  },
  "8858842010044": {
    nameAr: "كاثي دول – سي سي كريم Speed White SPF50 أخضر #02 50 مل",
    nameEn: "Cathy Doll Speed White CC Cream SPF50 PA+++ #02 Green – 50 ml",
  },
  "8858842056172": {
    nameAr: "كاثي دول – سي سي كريم Speed Cover SPF50 بيج فاتح #01 50 مل",
    nameEn: "Cathy Doll Speed Cover CC Cream SPF50 PA+++ #01 Light Beige – 50 ml",
  },
  "8858842010037": {
    nameAr: "كاثي دول – سي سي كريم Speed White SPF50 بيج فاتح #01 50 مل",
    nameEn: "Cathy Doll Speed White CC Cream SPF50 PA+++ #01 Light Beige – 50 ml",
  },
  "8858842022047": {
    nameAr: "كاثي دول – غسول فوم مزيل مكياج تونر وسيروم 100 مل",
    nameEn: "Cathy Doll Make Up Remover Toner & Serum Foam Cleanser – 100 ml",
  },
  "8858842013731": {
    nameAr: "كاثي دول – مقشر الجسم L-Glutathione Shower 400 مل",
    nameEn: "Cathy Doll L-Glutathione Shower Body Scrub – 400 ml",
  },
  "8858842037928": {
    nameAr: "كاثي دول – كريم استحمام الجسم White Milk Shine 450 مل",
    nameEn: "Cathy Doll White Milk Shine Body Bath Cream – 450 ml",
  },
  "8858842056363": {
    nameAr: "كاثي دول – كريم استحماج Glutathione Magic Shower",
    nameEn: "Cathy Doll Glutathione Magic Shower Cream",
  },
  "8858842051528": {
    nameAr: "كاثي دول – كريم استحمام الجسم Ready 2 White Pearl & Rose 500 مل",
    nameEn: "Cathy Doll Ready 2 White Body Bath Cream Pearl & Rose Serum – 500 ml",
  },
  "8858842037911": {
    nameAr: "كاثي دول – مقشر الجسم White Milk Shine Peeling 320 مل",
    nameEn: "Cathy Doll White Milk Shine Peeling Body Scrub – 320 ml",
  },
  "8858842087435": {
    nameAr: "كاثي دول – لوشن الجسم Vit C Arbutin B3",
    nameEn: "Cathy Doll Vit C Arbutin Body Lotion – B3",
  },
  "8858842068328": {
    nameAr: "كاثي دول – سائل واقي شمس Ultra Light Sun Fluid SPF50 40 مل",
    nameEn: "Cathy Doll Ultra Light Sun Fluid SPF50 PA++++ – 40 ml",
  },
};

const PRODUCT_META: ProductMeta[] = [
  {
    barcode: "8697711700057",
    slug: "bio-balance-facial-whitening-day-cream-spf30-55ml",
    sku: "BB-700057",
    price: 16000,
    brandKey: "bio-balance",
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    sizeEn: "55 ml",
    sizeAr: "55 مل",
    descriptionAr:
      "كريم تفتيح الوجه النهاري SPF30 من بايو بالانس — يرطّب ويوحّد لون البشرة ويقلّل البقع الداكنة مع حماية من الشمس.\n\n" +
      "• نياسيناميد، فيتامين C ومستخلص عرق السوس لتفتيح وإشراق البشرة.\n" +
      "• فلاتر UVA/UVB فوتوثابتة لحماية يومية من أشعة الشمس.\n" +
      "• يقلّل ظهور البقع، الكلف والتصبغات ويمنع تعمق اللون.\n" +
      "• خالٍ من الهيدروكينون والبارابين والبتروليوم.\n" +
      "• يُدلّك على الوجه والرقبة صباحاً ومساءً بعد التنظيف.\n" +
      "• 55 مل.",
    descriptionEn:
      "Bio Balance Facial Whitening Day Cream SPF30 brightens, moisturises and helps fade dark spots with daily sun protection.\n\n" +
      "• Niacinamide, vitamin C and licorice root extract for radiance and even tone.\n" +
      "• Photostable UVA/UVB filters for everyday sun defence.\n" +
      "• Helps reduce spots, freckles and hyperpigmentation.\n" +
      "• Free from hydroquinone, parabens and petroleum jelly.\n" +
      "• Massage onto face and neck morning and evening after cleansing.\n" +
      "• 55 ml.",
  },
  {
    barcode: "8697711700064",
    slug: "bio-balance-brightening-eye-cream-15ml",
    sku: "BB-700064",
    price: 12000,
    brandKey: "bio-balance",
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: EYE_CARE,
    sizeEn: "15 ml",
    sizeAr: "15 مل",
    descriptionAr:
      "كريم تفتيح تحت العين من بايو بالانس — يهدّئ منطقة العين ويقلّل الهالات والتصبغات.\n\n" +
      "• تركيبة مرطّبة خفيفة مناسبة للبشرة الرقيقة حول العين.\n" +
      "• يساعد على توحيد لون البشرة وتقليل البقع الداكنة.\n" +
      "• يمنح إشراقة طبيعية للمنطقة المحيطة بالعين.\n" +
      "• يُطبّق برفق صباحاً ومساءً على بشرة نظيفة.\n" +
      "• 15 مل.",
    descriptionEn:
      "Bio Balance Brightening Eye Cream soothes the delicate eye area and helps reduce dark circles and discoloration.\n\n" +
      "• Lightweight moisturising formula for the thin skin around the eyes.\n" +
      "• Helps even skin tone and fade dark spots.\n" +
      "• Leaves a natural brightened look.\n" +
      "• Apply gently morning and evening on cleansed skin.\n" +
      "• 15 ml.",
  },
  {
    barcode: "8697711700231",
    slug: "bio-balance-stretch-mark-remover-60ml",
    sku: "BB-700231",
    price: 14000,
    brandKey: "bio-balance",
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_LOTION,
    sizeEn: "60 ml",
    sizeAr: "60 مل",
    descriptionAr:
      "كريم إزالة علامات التمدد من بايو بالانس — يحسّن مرونة البشرة ويساعد على تلطيف خطوط التمدد.\n\n" +
      "• بالميتويل كارنيتين لدعم مرونة الجلد ومنع علامات جديدة.\n" +
      "• مستخلصات سنتيلا آسياتيكا والعرقسوس لتلطيف البقع والتصبغ.\n" +
      "• بانثينول، زبدة الشيا وفيتامين E لترطيب عميق.\n" +
      "• فيتامين C لتفتيح ودعم إنتاج الكولاجين.\n" +
      "• للحوامل من الشهر الثالث أو بعد الولادة والتغيرات السريعة في الوزن.\n" +
      "• 60 مل.",
    descriptionEn:
      "Bio Balance Stretch Mark Remover improves elasticity and helps fade stretch marks on body areas prone to stretching.\n\n" +
      "• Palmitoyl carnitine supports skin elasticity.\n" +
      "• Centella asiatica and licorice extracts soothe marks and uneven tone.\n" +
      "• Panthenol, shea butter and vitamin E for deep moisture.\n" +
      "• Vitamin C brightens and supports collagen.\n" +
      "• Ideal during pregnancy (from month 3) or after weight changes.\n" +
      "• 60 ml.",
  },
  {
    barcode: "8697711700026",
    slug: "bio-balance-cracked-heel-foot-balm-60ml",
    sku: "BB-700026",
    price: 10000,
    brandKey: "bio-balance",
    categoryId: CARE,
    subcategoryId: FOOT,
    tertiaryCategoryId: FOOT_CREAM,
    sizeEn: "60 ml",
    sizeAr: "60 مل",
    descriptionAr:
      "بلسم الكعب المتشقق والقدم من بايو بالانس — يعالج الجفاف الشديد والتشققات بعمق.\n\n" +
      "• تركيبة غنية ترطّب الكعبين والقدمين المتشققة.\n" +
      "• ينعّم الجلد الجاف والمتصلب ويساعد على إصلاحه.\n" +
      "• مناسب للاستخدام اليومي خاصة قبل النوم.\n" +
      "• يُدلّك على الكعبين والمناطق الجافة حتى الامتصاص.\n" +
      "• 60 مل.",
    descriptionEn:
      "Bio Balance Cracked Heel & Foot Balm deeply nourishes dry, cracked heels and feet.\n\n" +
      "• Rich balm texture for intensive foot hydration.\n" +
      "• Softens rough, hardened skin and supports repair.\n" +
      "• Ideal for nightly use on dry areas.\n" +
      "• Massage onto heels and dry zones until absorbed.\n" +
      "• 60 ml.",
  },
  {
    barcode: "8697711701078",
    slug: "bio-balance-derma-age-rejuvenating-cream-55ml",
    sku: "BB-701078",
    price: 18000,
    brandKey: "bio-balance",
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    sizeEn: "55 ml",
    sizeAr: "55 مل",
    descriptionAr:
      "كريم Derma-Age لتجديد البشرة من بايو بالانس — يعيد حيوية البشرة الناضجة ويحسّن مرونتها.\n\n" +
      "• تركيبة مضادة للشيخوخة ترطّب وتنعّم البشرة.\n" +
      "• يساعد على تقليل علامات التقدّم في السن وتحسين الملمس.\n" +
      "• يدعم مرونة البشرة ويمنحها إشراقة صحية.\n" +
      "• يُطبّق صباحاً ومساءً على بشرة نظيفة.\n" +
      "• 55 مل.",
    descriptionEn:
      "Bio Balance Derma-Age Rejuvenating Skin Care Cream revives mature skin and improves firmness and radiance.\n\n" +
      "• Anti-ageing moisturising formula for smoother skin.\n" +
      "• Helps reduce signs of ageing and refine texture.\n" +
      "• Supports elasticity and a healthy glow.\n" +
      "• Apply morning and evening on cleansed skin.\n" +
      "• 55 ml.",
  },
  {
    barcode: "8697711701016",
    slug: "bio-balance-dermasoothe-facial-cleansing-gel-250ml",
    sku: "BB-701016",
    price: 14000,
    brandKey: "bio-balance",
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    sizeEn: "250 ml",
    sizeAr: "250 مل",
    descriptionAr:
      "جل غسول الوجه DermaSoothe من بايو بالانس — ينظّف بلطف دون جفاف أو تهيّج.\n\n" +
      "• يزيل الشوائب والمكياج مع الحفاظ على توازن البشرة.\n" +
      "• تركيبة مهدّئة مناسبة للبشرة الحساسة والمتهيجة.\n" +
      "• يترك البشرة نظيفة، ناعمة ومريحة.\n" +
      "• يُدلّك على الوجه برغوة خفيفة ثم يُشطف بالماء.\n" +
      "• 250 مل.",
    descriptionEn:
      "Bio Balance DermaSoothe Facial Cleansing Gel gently cleanses without stripping or irritating the skin.\n\n" +
      "• Removes impurities and makeup while respecting skin balance.\n" +
      "• Soothing formula suitable for sensitive skin.\n" +
      "• Leaves skin clean, soft and comfortable.\n" +
      "• Massage onto damp face, rinse with water.\n" +
      "• 250 ml.",
  },
  {
    barcode: "8697711700187",
    slug: "bio-balance-organic-aloe-vera-shampoo-330ml",
    sku: "BB-700187",
    price: 12000,
    brandKey: "bio-balance",
    categoryId: CARE,
    subcategoryId: HAIR,
    tertiaryCategoryId: SHAMPOO,
    sizeEn: "330 ml",
    sizeAr: "330 مل",
    descriptionAr:
      "شامبو الألوفيرا العضوي من بايو بالانس — ينظّف الشعر بلطف ويرطّب فروة الرأس.\n\n" +
      "• مستخلص الألوفيرا العضوي لترطيب وتنعيم الشعر.\n" +
      "• ينظّف دون إزالة الترطيب الطبيعي.\n" +
      "• مناسب للاستخدام اليومي لجميع أنواع الشعر.\n" +
      "• يُوزّع على الشعر المبلل، يُدلّك ثم يُشطف.\n" +
      "• 330 مل.",
    descriptionEn:
      "Bio Balance Organic Aloe Vera Shampoo gently cleanses and hydrates hair and scalp.\n\n" +
      "• Organic aloe vera extract for moisture and softness.\n" +
      "• Cleanses without stripping natural hydration.\n" +
      "• Suitable for daily use on all hair types.\n" +
      "• Apply to wet hair, massage and rinse.\n" +
      "• 330 ml.",
  },
  {
    barcode: "8697711700156",
    slug: "bio-balance-organic-lavender-shampoo-330ml",
    sku: "BB-700156",
    price: 12000,
    brandKey: "bio-balance",
    categoryId: CARE,
    subcategoryId: HAIR,
    tertiaryCategoryId: SHAMPOO,
    sizeEn: "330 ml",
    sizeAr: "330 مل",
    descriptionAr:
      "شامبو اللافندر العضوي من بايو بالانس — ينظّف الشعر ويمنحه رائحة منعشة وملمس ناعم.\n\n" +
      "• مستخلص اللافندر العضوي لتهدئة فروة الرأس.\n" +
      "• تركيبة لطيفة للاستخدام اليومي.\n" +
      "• يترك الشعر نظيفاً ومعطراً بلطف.\n" +
      "• يُوزّع على الشعر المبلل، يُدلّك ثم يُشطف.\n" +
      "• 330 مل.",
    descriptionEn:
      "Bio Balance Organic Lavender Shampoo cleanses hair with a fresh lavender scent and soft finish.\n\n" +
      "• Organic lavender extract to soothe the scalp.\n" +
      "• Gentle formula for daily use.\n" +
      "• Leaves hair clean and lightly fragranced.\n" +
      "• Apply to wet hair, massage and rinse.\n" +
      "• 330 ml.",
  },
  {
    barcode: "8697711700170",
    slug: "bio-balance-organic-citrus-rosemary-shampoo-330ml",
    sku: "BB-700170",
    price: 12000,
    brandKey: "bio-balance",
    categoryId: CARE,
    subcategoryId: HAIR,
    tertiaryCategoryId: SHAMPOO,
    sizeEn: "330 ml",
    sizeAr: "330 مل",
    descriptionAr:
      "شامبو التطهير بالحمضيات وإكليل الجبل العضوي من بايو بالانس — ينظّف فروة الرأس ويمنح الشعر انتعاشاً.\n\n" +
      "• مستخلصات الحمضيات وإكليل الجبل لتطهير فروة الرأس.\n" +
      "• يزيل البناء والزيوت الزائدة بلطف.\n" +
      "• مناسب للشعر الذي يحتاج تنظيفاً منعشاً.\n" +
      "• يُوزّع على الشعر المبلل، يُدلّك ثم يُشطف.\n" +
      "• 330 مل.",
    descriptionEn:
      "Bio Balance Organic Citrus & Rosemary Purifying Shampoo refreshes scalp and cleanses hair gently.\n\n" +
      "• Citrus and rosemary extracts for a purifying cleanse.\n" +
      "• Helps remove buildup and excess oil.\n" +
      "• Ideal for hair that needs a fresh, clean feel.\n" +
      "• Apply to wet hair, massage and rinse.\n" +
      "• 330 ml.",
  },
  {
    barcode: "8697711700163",
    slug: "bio-balance-organic-pomegranate-shampoo-330ml",
    sku: "BB-700163",
    price: 12000,
    brandKey: "bio-balance",
    categoryId: CARE,
    subcategoryId: HAIR,
    tertiaryCategoryId: SHAMPOO,
    sizeEn: "330 ml",
    sizeAr: "330 مل",
    descriptionAr:
      "شامبو الرمان العضوي من بايو بالانس — يغذّي الشعر ويمنحه لمعاناً وقوة.\n\n" +
      "• مستخلص الرمان العضوي غني بمضادات الأكسدة.\n" +
      "• ينظّف ويحمي الشعر من الإجهاد البيئي.\n" +
      "• يترك الشعر ناعماً ولامعاً.\n" +
      "• يُوزّع على الشعر المبلل، يُدلّك ثم يُشطف.\n" +
      "• 330 مل.",
    descriptionEn:
      "Bio Balance Organic Pomegranate Shampoo nourishes hair and adds shine and strength.\n\n" +
      "• Organic pomegranate extract rich in antioxidants.\n" +
      "• Cleanses and helps protect hair from environmental stress.\n" +
      "• Leaves hair soft and glossy.\n" +
      "• Apply to wet hair, massage and rinse.\n" +
      "• 330 ml.",
  },
  {
    barcode: "8000921210627",
    slug: "natura-house-white-perfection-concentrate-15ml",
    sku: "NH-210627",
    price: 28000,
    brandKey: "natura-house",
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    sizeEn: "15 ml",
    sizeAr: "15 مل",
    descriptionAr:
      "كونسيرتر سوبر مكثّف White Perfection من ناتورا هاوس — يركّز على البقع الداكنة ويوحّد لون البشرة.\n\n" +
      "• تركيبة طبيعية عالية الأداء لتصحيح التصبغات.\n" +
      "• مستخلص Rumex occidentalis وفيتامين C لتفتيح البقع.\n" +
      "• يقلّل شدة البقع البنية ويعيد إشراقة البشرة.\n" +
      "• يُطبّق على البقع أو كسيروم قبل الكريم صباحاً ومساءً.\n" +
      "• خالٍ من البارافين والسيليكون والبارابين.\n" +
      "• 15 مل.",
    descriptionEn:
      "Natura House White Perfection Super Intensive Concentrate targets dark spots and uneven pigmentation.\n\n" +
      "• High-performance natural formula for spot correction.\n" +
      "• Rumex occidentalis extract and vitamin C for brightening.\n" +
      "• Helps reduce brown spot intensity and restore radiance.\n" +
      "• Apply to spots or as serum before cream morning and evening.\n" +
      "• Free from paraffins, silicones and parabens.\n" +
      "• 15 ml.",
  },
  {
    barcode: "8000921210603",
    slug: "natura-house-white-perfection-lightening-cream-50ml",
    sku: "NH-210603",
    price: 35000,
    brandKey: "natura-house",
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    sizeEn: "50 ml",
    sizeAr: "50 مل",
    descriptionAr:
      "كريم تفتيح الوجه White Perfection من ناتورا هاوس — يوحّد لون البشرة ويقلّل التصبغات.\n\n" +
      "• فلاتر شمسية فيزيائية لمنع البقع الجديدة.\n" +
      "• Rumex occidentalis وفيتامين C لتفتيح البقع الموجودة.\n" +
      "• كريستالات بيوميمتيكية لتحسين امتصاص المكوّنات.\n" +
      "• نسيج خفيف سريع الامتصاص — مثالي تحت المكياج.\n" +
      "• يُستخدم 3–4 أسابيع لنتائج واضحة صباحاً ومساءً.\n" +
      "• 50 مل.",
    descriptionEn:
      "Natura House White Perfection Lightening Facial Cream evens tone and reduces pigmentation on face and décolletage.\n\n" +
      "• Physical sun filters help prevent new spots.\n" +
      "• Rumex occidentalis and vitamin C brighten existing marks.\n" +
      "• Bio-mimetic crystals enhance ingredient absorption.\n" +
      "• Light fast-absorbing texture — ideal under makeup.\n" +
      "• Use morning and evening for 3–4 weeks for visible results.\n" +
      "• 50 ml.",
  },
  {
    barcode: "6297000898582",
    slug: "unicorn-hydrating-sun-block-spf50-50ml",
    sku: "UNI-898582",
    price: 19000,
    brandKey: "unicorn",
    categoryId: CARE,
    subcategoryId: SUN_CARE,
    tertiaryCategoryId: SUNSCREEN,
    sizeEn: "50 ml",
    sizeAr: "50 مل",
    descriptionAr:
      "واقي شمس مرطب SPF50 من يونيكورن توركواز — حماية عالية بتركيبة كريمية لا تترك أثراً.\n\n" +
      "• عامل حماية 50 ضد الأشعة فوق البنفسجية.\n" +
      "• تركيبة مرطّبة مقاومة للماء والعرق.\n" +
      "• لا يترك طبقة بيضاء على البشرة.\n" +
      "• يُطبّق قبل التعرض للشمس بـ15 دقيقة ويُجدّد كل ساعتين.\n" +
      "• 50 مل.",
    descriptionEn:
      "Unicorn by Turquaz Hydrating Sun Block SPF50 offers high UV protection with a moisturising no-white-cast cream formula.\n\n" +
      "• SPF50 broad-spectrum sun defence.\n" +
      "• Hydrating formula resistant to water and sweat.\n" +
      "• Leaves no visible white residue.\n" +
      "• Apply 15 minutes before sun exposure; reapply every 2 hours.\n" +
      "• 50 ml.",
  },
  {
    barcode: "6297000898131",
    slug: "unicorn-toner-hydrating-mist-155ml",
    sku: "UNI-898131",
    price: 15000,
    brandKey: "unicorn",
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    sizeEn: "155 ml",
    sizeAr: "155 مل",
    descriptionAr:
      "تونر وبخاخ مرطب من يونيكورن توركواز — يرطّب البشرة ويمنحها انتعاشاً فورياً.\n\n" +
      "• بخاخ مرطّب يعمل كتونر للوجه.\n" +
      "• يعزّز ترطيب البشرة ويُهيّئها للعناية التالية.\n" +
      "• يُرشّ على الوجه من مسافة مناسبة على بشرة نظيفة.\n" +
      "• مناسب للاستخدام اليومي صباحاً ومساءً.\n" +
      "• 155 مل.",
    descriptionEn:
      "Unicorn by Turquaz Toner & Hydrating Mist instantly hydrates and refreshes the skin.\n\n" +
      "• Moisturising facial spray toner.\n" +
      "• Boosts hydration and preps skin for next steps.\n" +
      "• Mist onto clean face from a comfortable distance.\n" +
      "• Suitable for daily morning and evening use.\n" +
      "• 155 ml.",
  },
  {
    barcode: "6297000898827",
    slug: "unicorn-vitamin-c-face-cream-100ml",
    sku: "UNI-898827",
    price: 23000,
    brandKey: "unicorn",
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    sizeEn: "100 ml",
    sizeAr: "100 مل",
    descriptionAr:
      "كريم الوجه بفيتامين سي Smooth & Radiant من يونيكورن — ترطيب عميق وإشراقة طبيعية.\n\n" +
      "• غني بفيتامين C لتفتيح البشرة وتوحيد اللون.\n" +
      "• يرطّب بعمق ويمنح البشرة نعومة ولمعة صحية.\n" +
      "• مناسب للاستخدام اليومي صباحاً ومساءً.\n" +
      "• يُطبّق على بشرة نظيفة مع تدليك خفيف.\n" +
      "• 100 مل.",
    descriptionEn:
      "Unicorn Vitamin C Face Cream Smooth & Radiant Skin delivers deep hydration and a natural glow.\n\n" +
      "• Enriched with vitamin C to brighten and even skin tone.\n" +
      "• Deeply moisturises for soft, radiant skin.\n" +
      "• Suitable for daily morning and evening use.\n" +
      "• Apply to cleansed skin with gentle massage.\n" +
      "• 100 ml.",
  },
  {
    barcode: "8809962370372",
    slug: "cathy-doll-vit-c-aloe-vera-body-serum-175g",
    sku: "CD-370372",
    price: 15000,
    brandKey: "cathy-doll",
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_LOTION,
    sizeEn: "175 g",
    sizeAr: "175 غ",
    descriptionAr:
      "سيروم الجسم فيتامين سي وألوفيرا من كاثي دول — يفتّح ويرطّب ويهدّئ البشرة من الرأس إلى القدم.\n\n" +
      "• فيتامين C ومستخلص الألوفيرا لإشراقة وتفتيح البشرة.\n" +
      "• نياسيناميد وحمض الهيالورونيك لترطيب عميق.\n" +
      "• يقلّل البقع الداكنة ويوحّد لون الجسم.\n" +
      "• يُطبّق بعد الاستحمام على بشرة نظيفة مع تدليك حتى الامتصاص.\n" +
      "• 175 غ.",
    descriptionEn:
      "Cathy Doll Vit C & Aloe Vera Soothing Body Serum brightens, hydrates and soothes skin all over the body.\n\n" +
      "• Vitamin C and aloe vera for radiance and brightening.\n" +
      "• Niacinamide and hyaluronic acid for deep hydration.\n" +
      "• Helps fade dark spots and even body tone.\n" +
      "• Apply after bathing on clean skin; massage until absorbed.\n" +
      "• 175 g.",
  },
  {
    barcode: "8809962371492",
    slug: "cathy-doll-come-on-baby-intimate-mousse-150ml",
    sku: "CD-371492",
    price: 10000,
    brandKey: "cathy-doll",
    categoryId: CARE,
    subcategoryId: BODY,
    descriptionAr:
      "موس غسول المناطق الحساسة Come On Baby من كاثي دول — تنظيف لطيف بالكولاجين ومستخلص الرمان.\n\n" +
      "• فوم ناعم ينظّف المنطقة الحساسة دون جفاف.\n" +
      "• كولاجين وفيتامين C ومستخلص الرمان للتنعيم والتفتيح.\n" +
      "• يحافظ على توازن البشرة ويقلّل الروائغ غير المرغوبة.\n" +
      "• خالٍ من البارابين والسيليكون والSLS.\n" +
      "• يُضخّ على اليد ويُطبّق خارجياً ثم يُشطف بالماء.\n" +
      "• 150 مل.",
    descriptionEn:
      "Cathy Doll Come On Baby Feminine Intimate Mousse gently cleanses the intimate area with collagen and pomegranate.\n\n" +
      "• Soft foam cleanses without over-drying.\n" +
      "• Collagen, vitamin C and pomegranate for softening and brightening.\n" +
      "• Helps maintain skin balance and freshness.\n" +
      "• Free from parabens, silicone and SLS.\n" +
      "• Pump onto palm, apply externally and rinse with water.\n" +
      "• 150 ml.",
    sizeEn: "150 ml",
    sizeAr: "150 مل",
  },
  {
    barcode: "8858842029923",
    slug: "cathy-doll-fiber-white-x-cleansing-foam-100g",
    sku: "CD-029923",
    price: 12000,
    brandKey: "cathy-doll",
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    sizeEn: "100 g",
    sizeAr: "100 غ",
    descriptionAr:
      "غسول فوم Fiber White X من كاثي دول — ينظّف البشرة ويساعد على تفتيحها.\n\n" +
      "• فوم غني يزيل الشوائب والمكياج بلطف.\n" +
      "• تركيبة تفتيح للبشرة الباهتة والمجهدة.\n" +
      "• يترك البشرة نظيفة ومشرقة.\n" +
      "• يُدلّك على الوجه برغوة ثم يُشطف بالماء.\n" +
      "• 100 غ.",
    descriptionEn:
      "Cathy Doll Fiber White X Cleansing Foam cleanses and helps brighten dull skin.\n\n" +
      "• Rich foam removes impurities and makeup gently.\n" +
      "• Brightening formula for tired, uneven skin.\n" +
      "• Leaves skin clean and refreshed.\n" +
      "• Massage onto damp face, rinse with water.\n" +
      "• 100 g.",
  },
  {
    barcode: "8858842070659",
    slug: "cathy-doll-ready-2-white-lightening-foam-cleanser-100ml",
    sku: "CD-070659",
    price: 12000,
    brandKey: "cathy-doll",
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    sizeEn: "100 ml",
    sizeAr: "100 مل",
    descriptionAr:
      "غسول فوم تفتيح Ready 2 White من كاثي دول — ينظّف عميقاً ويساعد على إشراق البشرة.\n\n" +
      "• يزيل الشوائب والزيوت الزائدة بلطف.\n" +
      "• مكوّنات تفتيح لتقليل البهتان والتصبغ.\n" +
      "• فوم ناعم مناسب للاستخدام اليومي.\n" +
      "• يُدلّك على الوجه ثم يُشطف بالماء.\n" +
      "• 100 مل.",
    descriptionEn:
      "Cathy Doll Ready 2 White Lightening Foam Cleanser deeply cleanses and brightens the complexion.\n\n" +
      "• Removes impurities and excess oil gently.\n" +
      "• Brightening actives help reduce dullness and spots.\n" +
      "• Soft foam suitable for daily use.\n" +
      "• Massage onto face and rinse with water.\n" +
      "• 100 ml.",
  },
  {
    barcode: "8858842011676",
    slug: "cathy-doll-l-glutathione-magic-cream-spf50-60ml",
    sku: "CD-011676",
    price: 18000,
    brandKey: "cathy-doll",
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    sizeEn: "60 ml",
    sizeAr: "60 مل",
    descriptionAr:
      "كريم L-Glutathione Magic SPF50 من كاثي دول — تفتيح وحماية من الشمس في خطوة واحدة.\n\n" +
      "• غلوتاثيون لتفتيح البشرة وتوحيد اللون.\n" +
      "• SPF50 لحماية من أشعة UVA/UVB.\n" +
      "• يرطّب ويمنح البشرة إشراقة طبيعية.\n" +
      "• يُطبّق صباحاً على بشرة نظيفة.\n" +
      "• 60 مل.",
    descriptionEn:
      "Cathy Doll L-Glutathione Magic Cream SPF50 brightens skin and provides sun protection.\n\n" +
      "• Glutathione helps brighten and even tone.\n" +
      "• SPF50 protects against UVA/UVB rays.\n" +
      "• Moisturises for a natural radiant finish.\n" +
      "• Apply in the morning on cleansed skin.\n" +
      "• 60 ml.",
  },
  {
    barcode: "8809396174744",
    slug: "cathy-doll-ready-2-white-boosting-cream-75ml",
    sku: "CD-174744",
    price: 16000,
    brandKey: "cathy-doll",
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    sizeEn: "75 ml",
    sizeAr: "75 مل",
    descriptionAr:
      "كريم Ready 2 White White Boosting من كاثي دول — يعزّز إشراقة البشرة ويوحّد اللون.\n\n" +
      "• تركيبة تفتيح لتقليل البهتان والبقع.\n" +
      "• يرطّب وينعّم ملمس البشرة.\n" +
      "• مناسب للاستخدام اليومي صباحاً ومساءً.\n" +
      "• يُطبّق على الوجه والرقبة بعد التنظيف.\n" +
      "• 75 مل.",
    descriptionEn:
      "Cathy Doll Ready 2 White White Boosting Cream boosts radiance and evens skin tone.\n\n" +
      "• Brightening formula reduces dullness and spots.\n" +
      "• Moisturises and refines skin texture.\n" +
      "• Suitable for daily morning and evening use.\n" +
      "• Apply to face and neck after cleansing.\n" +
      "• 75 ml.",
  },
  {
    barcode: "8858842013380",
    slug: "cathy-doll-hyaluron-grape-jelly-hand-mask-60g",
    sku: "CD-013380",
    price: 10000,
    brandKey: "cathy-doll",
    categoryId: CARE,
    subcategoryId: HANDS,
    sizeEn: "60 g",
    sizeAr: "60 غ",
    descriptionAr:
      "ماسك اليدين 2% هايلورون Grape Jelly من كاثي دول — ترطيب عميق ونعومة لليدين.\n\n" +
      "• 2% هيالورونيك أسيد لترطيب مكثّف.\n" +
      "• مستخلص العنب لإشراقة وتنعيم البشرة.\n" +
      "• قناع جيلي يُترك 10–15 دقيقة ثم يُشطف أو يُمسح.\n" +
      "• يترك اليدين ناعمة ومرطّبة.\n" +
      "• 60 غ.",
    descriptionEn:
      "Cathy Doll 2% Hyaluron Grape Jelly Hand Mask delivers intensive hydration for soft hands.\n\n" +
      "• 2% hyaluronic acid for deep moisture.\n" +
      "• Grape extract for brightness and softness.\n" +
      "• Jelly mask — leave 10–15 minutes then rinse or wipe.\n" +
      "• Leaves hands smooth and hydrated.\n" +
      "• 60 g.",
  },
  {
    barcode: "8809396174058",
    slug: "cathy-doll-ready-2-white-whitener-body-lotion-150ml",
    sku: "CD-174058",
    price: 15000,
    brandKey: "cathy-doll",
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_WHITENING,
    sizeEn: "150 ml",
    sizeAr: "150 مل",
    descriptionAr:
      "لوشن الجسم Ready 2 White Whitener من كاثي دول — يفتّح ويرطّب بشرة الجسم.\n\n" +
      "• تركيبة تفتيح لتوحيد لون الجسم.\n" +
      "• يرطّب بعمق دون ثقل أو دهنية.\n" +
      "• يُطبّق يومياً على بشرة نظيفة مع تدليك حتى الامتصاص.\n" +
      "• مناسب للذراعين والساقين والجسم.\n" +
      "• 150 مل.",
    descriptionEn:
      "Cathy Doll Ready 2 White Whitener Body Lotion brightens and moisturises body skin.\n\n" +
      "• Brightening formula for even body tone.\n" +
      "• Deep hydration without greasy feel.\n" +
      "• Apply daily on clean skin; massage until absorbed.\n" +
      "• Suitable for arms, legs and full body.\n" +
      "• 150 ml.",
  },
  {
    barcode: "8858842010044",
    slug: "cathy-doll-speed-white-cc-cream-green-02-50ml",
    sku: "CD-010044",
    price: 22000,
    brandKey: "cathy-doll",
    categoryId: MAKEUP,
    subcategoryId: FACE_MK,
    tertiaryCategoryId: BB_CC,
    shadeEn: "#02 Green",
    shadeAr: "أخضر #02",
    sizeEn: "50 ml",
    sizeAr: "50 مل",
    descriptionAr:
      "سي سي كريم Speed White أخضر #02 من كاثي دول — يصحّح الاحمرار ويوحّد لون البشرة مع SPF50.\n\n" +
      "• اللون الأخضر يقلّل ظهور الاحمرار والبقع الحمراء.\n" +
      "• هيالورونيك أسيد ومستخلصات الروزماري والبابونج للترطيب.\n" +
      "• SPF50 PA+++ حماية من الشمس.\n" +
      "• نسيج خفيف طبيعي للاستخدام اليومي.\n" +
      "• 50 مل.",
    descriptionEn:
      "Cathy Doll Speed White CC Cream SPF50 PA+++ #02 Green colour-corrects redness and evens tone.\n\n" +
      "• Green shade neutralises redness and irritation.\n" +
      "• Hyaluronic acid, rosemary and chamomile for hydration.\n" +
      "• SPF50 PA+++ sun protection.\n" +
      "• Lightweight natural finish for daily wear.\n" +
      "• 50 ml.",
  },
  {
    barcode: "8858842056172",
    slug: "cathy-doll-speed-cover-cc-cream-light-beige-01-50ml",
    sku: "CD-056172",
    price: 22000,
    brandKey: "cathy-doll",
    categoryId: MAKEUP,
    subcategoryId: FACE_MK,
    tertiaryCategoryId: BB_CC,
    shadeEn: "#01 Light Beige",
    shadeAr: "بيج فاتح #01",
    sizeEn: "50 ml",
    sizeAr: "50 مل",
    descriptionAr:
      "سي سي كريم Speed Cover بيج فاتح #01 من كاثي دول — تغطية فورية كاملة مع SPF50.\n\n" +
      "• 8 أنواع هيالورونيك أسيد و8 ببتيدات لترطيب وتنعيم.\n" +
      "• بيتا-غلوكان وألفا أربوتين لتفتيح ومكافحة التجاعيد.\n" +
      "• يخفّي البقع، الاحمرار والتصبغات بلمسة طبيعية.\n" +
      "• SPF50 PA+++ حماية يومية من الشمس.\n" +
      "• 50 مل.",
    descriptionEn:
      "Cathy Doll Speed Cover CC Cream SPF50 PA+++ #01 Light Beige delivers instant full coverage.\n\n" +
      "• 8 hyaluronic acids and 8 peptides for hydration and plumpness.\n" +
      "• Beta-glucan and alpha arbutin for brightening and anti-wrinkle care.\n" +
      "• Blurs spots, redness and pigmentation naturally.\n" +
      "• SPF50 PA+++ daily sun protection.\n" +
      "• 50 ml.",
  },
  {
    barcode: "8858842010037",
    slug: "cathy-doll-speed-white-cc-cream-light-beige-01-50ml",
    sku: "CD-010037",
    price: 22000,
    brandKey: "cathy-doll",
    categoryId: MAKEUP,
    subcategoryId: FACE_MK,
    tertiaryCategoryId: BB_CC,
    shadeEn: "#01 Light Beige",
    shadeAr: "بيج فاتح #01",
    sizeEn: "50 ml",
    sizeAr: "50 مل",
    descriptionAr:
      "سي سي كريم Speed White بيج فاتح #01 من كاثي دول — إشراقة فورية وتفتيح مع SPF50.\n\n" +
      "• Chromabright وأربوتين لتفتيح البشرة الباهتة.\n" +
      "• تقنية Water Drop لترطيب طويل الأمد دون دهنية.\n" +
      "• يوحّد لون البشرة ويقلّل البقع الداكنة.\n" +
      "• SPF50 PA+++ حماية من الشمس.\n" +
      "• 50 مل.",
    descriptionEn:
      "Cathy Doll Speed White CC Cream SPF50 PA+++ #01 Light Beige instantly brightens and evens complexion.\n\n" +
      "• Chromabright and arbutin for dullness correction.\n" +
      "• Water Drop technology for long-lasting hydration.\n" +
      "• Evens tone and helps fade dark spots.\n" +
      "• SPF50 PA+++ sun protection.\n" +
      "• 50 ml.",
  },
  {
    barcode: "8858842022047",
    slug: "cathy-doll-makeup-remover-toner-serum-foam-100ml",
    sku: "CD-022047",
    price: 14000,
    brandKey: "cathy-doll",
    categoryId: MAKEUP,
    subcategoryId: FACE_MK,
    tertiaryCategoryId: MAKEUP_REMOVERS,
    sizeEn: "100 ml",
    sizeAr: "100 مل",
    descriptionAr:
      "غسول فوم مزيل مكياج تونر وسيروم من كاثي دول — يزيل المكياج وينظّف البشرة بخطوة واحدة.\n\n" +
      "• فوم غني يذيب المكياج والشوائب بلطف.\n" +
      "• يعمل كمزيل مكياج، تونر وسيروم منظّف.\n" +
      "• يترك البشرة نظيفة ومرطّبة دون جفاف.\n" +
      "• يُدلّك على الوجه ثم يُشطف بالماء.\n" +
      "• 100 مل.",
    descriptionEn:
      "Cathy Doll Make Up Remover Toner & Serum Foam Cleanser removes makeup and cleanses in one step.\n\n" +
      "• Rich foam dissolves makeup and impurities gently.\n" +
      "• Works as makeup remover, toner and cleansing serum.\n" +
      "• Leaves skin clean and hydrated without dryness.\n" +
      "• Massage onto face and rinse with water.\n" +
      "• 100 ml.",
  },
  {
    barcode: "8858842013731",
    slug: "cathy-doll-l-glutathione-shower-body-scrub-400ml",
    sku: "CD-013731",
    price: 16000,
    brandKey: "cathy-doll",
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_SCRUB,
    sizeEn: "400 ml",
    sizeAr: "400 مل",
    descriptionAr:
      "مقشر الجسم L-Glutathione Shower من كاثي دول — يقشّر بلطف ويفتّح بشرة الجسم.\n\n" +
      "• غلوتاثيون لتفتيح وتوحيد لون الجسم.\n" +
      "• يزيل خلايا الجلد الميتة وينعّم الملمس.\n" +
      "• يُستخدم أثناء الاستحمام مع تدليك خفيف.\n" +
      "• يترك البشرة ناعمة ومشرقة.\n" +
      "• 400 مل.",
    descriptionEn:
      "Cathy Doll L-Glutathione Shower Body Scrub gently exfoliates and brightens body skin.\n\n" +
      "• Glutathione helps brighten and even body tone.\n" +
      "• Removes dead skin cells and refines texture.\n" +
      "• Use in the shower with gentle massage.\n" +
      "• Leaves skin soft and radiant.\n" +
      "• 400 ml.",
  },
  {
    barcode: "8858842037928",
    slug: "cathy-doll-white-milk-shine-body-bath-cream-450ml",
    sku: "CD-037928",
    price: 16000,
    brandKey: "cathy-doll",
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_WASH,
    sizeEn: "450 ml",
    sizeAr: "450 مل",
    descriptionAr:
      "كريم استحمام الجسم White Milk Shine من كاثي دول — ينظّف ويرطّب ويمنح البشرة لمعاناً.\n\n" +
      "• تركيبة حليبية لتفتيح ونعومة البشرة.\n" +
      "• ينظّف بلطف مع ترطيب عميق.\n" +
      "• يُستخدم أثناء الاستحمام على الجسم المبلل.\n" +
      "• يترك البشرة ناعمة ومضيئة.\n" +
      "• 450 مل.",
    descriptionEn:
      "Cathy Doll White Milk Shine Body Bath Cream cleanses, moisturises and adds a luminous glow.\n\n" +
      "• Milky brightening formula for soft skin.\n" +
      "• Gently cleanses with deep hydration.\n" +
      "• Use in the shower on wet skin.\n" +
      "• Leaves skin soft and radiant.\n" +
      "• 450 ml.",
  },
  {
    barcode: "8858842056363",
    slug: "cathy-doll-glutathione-magic-shower-cream",
    sku: "CD-056363",
    price: 16000,
    brandKey: "cathy-doll",
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: SHOWER,
    descriptionAr:
      "كريم استحماج Glutathione Magic من كاثي دول — تنظيف الجسم مع تفتيح وترطيب.\n\n" +
      "• غلوتاثيون لتفتيح بشرة الجسم.\n" +
      "• ينظّف ويرطّب أثناء الاستحمام.\n" +
      "• يُطبّق على الجسم المبلل ويُشطف بالماء.\n" +
      "• يترك البشرة ناعمة ومشرقة.",
    descriptionEn:
      "Cathy Doll Glutathione Magic Shower Cream cleanses the body while brightening and moisturising.\n\n" +
      "• Glutathione helps brighten body skin.\n" +
      "• Cleanses and hydrates in the shower.\n" +
      "• Apply on wet body and rinse with water.\n" +
      "• Leaves skin soft and radiant.",
  },
  {
    barcode: "8858842051528",
    slug: "cathy-doll-ready-2-white-body-bath-pearl-rose-500ml",
    sku: "CD-051528",
    price: 16000,
    brandKey: "cathy-doll",
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_WASH,
    sizeEn: "500 ml",
    sizeAr: "500 مل",
    descriptionAr:
      "كريم استحمام الجسم Ready 2 White Pearl & Rose من كاثي دول — تفتيح وترطيب برائحة الورد.\n\n" +
      "• سيروم Pearl & Rose لتفتيح وإشراقة البشرة.\n" +
      "• ينظّف بلطف ويرطّب بعمق.\n" +
      "• يُستخدم أثناء الاستحمام على الجسم المبلل.\n" +
      "• يترك البشرة ناعمة ومعطّرة برائحة ناعمة.\n" +
      "• 500 مل.",
    descriptionEn:
      "Cathy Doll Ready 2 White Body Bath Cream Pearl & Rose Serum brightens and moisturises with a delicate rose scent.\n\n" +
      "• Pearl & rose serum for brightening and radiance.\n" +
      "• Gently cleanses with deep hydration.\n" +
      "• Use in the shower on wet skin.\n" +
      "• Leaves skin soft with a delicate fragrance.\n" +
      "• 500 ml.",
  },
  {
    barcode: "8858842037911",
    slug: "cathy-doll-white-milk-shine-peeling-body-scrub-320ml",
    sku: "CD-037911",
    price: 15000,
    brandKey: "cathy-doll",
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_SCRUB,
    sizeEn: "320 ml",
    sizeAr: "320 مل",
    descriptionAr:
      "مقشر الجسم White Milk Shine Peeling من كاثي دول — يقشّر بلطف ويفتّح بشرة الجسم.\n\n" +
      "• تركيبة حليبية لتفتيح وتنعيم البشرة.\n" +
      "• يزيل خلايا الجلد الميتة ويحسّن الملمس.\n" +
      "• يُستخدم أثناء الاستحمام مع تدليك خفيف.\n" +
      "• يترك البشرة ناعمة ومشرقة.\n" +
      "• 320 مل.",
    descriptionEn:
      "Cathy Doll White Milk Shine Peeling Body Scrub gently exfoliates and brightens body skin.\n\n" +
      "• Milky formula brightens and softens skin.\n" +
      "• Removes dead cells and refines texture.\n" +
      "• Use in the shower with gentle massage.\n" +
      "• Leaves skin soft and radiant.\n" +
      "• 320 ml.",
  },
  {
    barcode: "8858842087435",
    slug: "cathy-doll-vit-c-arbutin-body-lotion-b3",
    sku: "CD-087435",
    price: 15000,
    brandKey: "cathy-doll",
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_WHITENING,
    shadeEn: "B3",
    shadeAr: "B3",
    descriptionAr:
      "لوشن الجسم Vit C Arbutin B3 من كاثي دول — تفتيح وترطيب لبشرة الجسم.\n\n" +
      "• فيتامين C وأربوتين لتوحيد لون الجسم.\n" +
      "• يرطّب بعمق دون ثقل.\n" +
      "• يُطبّق يومياً على بشرة نظيفة مع تدليك.\n" +
      "• مناسب للذراعين والساقين والجسم.",
    descriptionEn:
      "Cathy Doll Vit C Arbutin Body Lotion B3 brightens and moisturises body skin.\n\n" +
      "• Vitamin C and arbutin for even body tone.\n" +
      "• Deep hydration without heaviness.\n" +
      "• Apply daily on clean skin with massage.\n" +
      "• Suitable for arms, legs and full body.",
  },
  {
    barcode: "8858842068328",
    slug: "cathy-doll-ultra-light-sun-fluid-spf50-40ml",
    sku: "CD-068328",
    price: 18000,
    brandKey: "cathy-doll",
    categoryId: CARE,
    subcategoryId: SUN_CARE,
    tertiaryCategoryId: SUNSCREEN,
    sizeEn: "40 ml",
    sizeAr: "40 مل",
    descriptionAr:
      "سائل واقي شمس Ultra Light Sun Fluid SPF50 من كاثي دول — حماية خفيفة فائقة للوجه.\n\n" +
      "• SPF50 PA++++ حماية عالية من أشعة الشمس.\n" +
      "• نسيج سائل خفيف سريع الامتصاص.\n" +
      "• لا يترك طبقة بيضاء أو دهنية.\n" +
      "• يُطبّق قبل التعرض للشمس ويُجدّد كل ساعتين.\n" +
      "• 40 مل.",
    descriptionEn:
      "Cathy Doll Ultra Light Sun Fluid SPF50 PA++++ offers ultra-light high protection for the face.\n\n" +
      "• SPF50 PA++++ broad-spectrum sun defence.\n" +
      "• Fluid texture absorbs quickly.\n" +
      "• No white cast or greasy finish.\n" +
      "• Apply before sun exposure; reapply every 2 hours.\n" +
      "• 40 ml.",
  },
];

const SKIP_GPT = process.env.SKIP_GPT === "1";
const ONLY_BARCODES = process.env.ONLY_BARCODES
  ? new Set(process.env.ONLY_BARCODES.split(/[\s,]+/).filter(Boolean))
  : null;

const PRODUCT_LIST = ONLY_BARCODES
  ? PRODUCT_META.filter((p) => ONLY_BARCODES.has(p.barcode))
  : PRODUCT_META;

function normalizeGptNames(
  gptAr: string,
  gptEn: string,
  meta: ProductMeta,
): { nameAr: string; nameEn: string } {
  const brand = BRANDS[meta.brandKey];

  let nameEn = gptEn.trim();
  let nameAr = gptAr.trim();

  // GPT sometimes returns "بيو بالانس" instead of "بايو بالانس"
  nameAr = nameAr.replace(/^بيو\s*بالانس/i, brand.brandAr);
  nameAr = nameAr.replace(new RegExp(`^${brand.brandAr}\\s*–\\s*${brand.brandAr}`, "i"), brand.brandAr);
  nameAr = nameAr.replace(new RegExp(`^${brand.brandAr}\\s*–\\s*بيو\\s*بالانس`, "i"), brand.brandAr);

  if (!nameEn.toLowerCase().includes(brand.brandEn.toLowerCase().split(" ")[0])) {
    nameEn = `${brand.brandEn} ${nameEn.replace(new RegExp(`^${brand.brandEn}\\s*`, "i"), "")}`;
  }
  nameEn = nameEn.replace(/\s+/g, " ").trim();

  if (!nameAr.includes(brand.brandAr.split(" ")[0])) {
    nameAr = `${brand.brandAr} – ${nameAr}`;
  } else if (!nameAr.includes("–")) {
    nameAr = nameAr.replace(new RegExp(`^${brand.brandAr}\\s*`, "i"), `${brand.brandAr} – `);
  }

  if (meta.shadeEn && !nameEn.toLowerCase().includes(meta.shadeEn.toLowerCase().split(" ")[0])) {
    nameEn = `${nameEn.replace(/\s*–\s*[\d.]+\s*(ml|g|oz).*$/i, "").trim()} – ${meta.shadeEn}`;
  }
  if (meta.shadeAr && !nameAr.includes(meta.shadeAr.split(" ")[0])) {
    nameAr = `${nameAr.replace(/\s*[\d.]+\s*(مل|غرام|غ).*$/i, "").trim()} ${meta.shadeAr}`;
  }

  if (meta.sizeEn && !new RegExp(meta.sizeEn.replace(".", "\\."), "i").test(nameEn)) {
    nameEn = `${nameEn.replace(/\s*–\s*[\d.]+\s*(ml|g|oz).*$/i, "").trim()} – ${meta.sizeEn}`;
  }
  if (meta.sizeAr && !nameAr.includes(meta.sizeAr.split(" ")[0])) {
    if (!nameAr.includes(meta.sizeAr)) {
      nameAr = `${nameAr.trim()} ${meta.sizeAr}`;
    }
  }

  return { nameAr: nameAr.trim(), nameEn: nameEn.trim() };
}

let token = "";

async function login(): Promise<void> {
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

async function resolveBrandId(brandKey: BrandKey): Promise<string> {
  const brand = BRANDS[brandKey];
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: brand.brandAr,
    brandEn: brand.brandEn,
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error(`Could not resolve brand ${brand.brandEn}`);
  console.log(`Brand: ${brand.brandEn} (${brandId})${resolved.created ? " [created]" : ""}`);
  return brandId;
}

async function barcodeExists(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean }>(`/products/barcode-check?barcode=${barcode}`);
  return check.exists;
}

type ResolvedProduct = ProductMeta & { nameAr: string; nameEn: string; brandId: string };

async function gptWithRetry(barcode: string, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await researchProductNameWithGpt(barcode, false);
    } catch (err) {
      if (i >= attempts) throw err;
      console.log(`  retry ${i}/${attempts - 1}: ${(err as Error).message}`);
      await new Promise((r) => setTimeout(r, i * 2000));
    }
  }
  throw new Error("gptWithRetry unreachable");
}

async function resolveNamesWithGpt(): Promise<Omit<ResolvedProduct, "brandId">[]> {
  const resolved: Omit<ResolvedProduct, "brandId">[] = [];
  let totalInput = 0;
  let totalOutput = 0;
  let totalSearches = 0;

  console.log(`GPT naming for ${PRODUCT_LIST.length} barcodes...\n`);

  for (const meta of PRODUCT_LIST) {
    console.log(`--- GPT ${meta.barcode} ---`);
    const curated = CURATED_NAMES[meta.barcode];
    let nameAr: string;
    let nameEn: string;

    if (SKIP_GPT && curated) {
      nameAr = curated.nameAr;
      nameEn = curated.nameEn;
      console.log(`  → curated (SKIP_GPT)`);
    } else if (SKIP_GPT) {
      throw new Error(`SKIP_GPT set but no curated name for ${meta.barcode}`);
    } else {
      try {
        const { research, usage } = await gptWithRetry(meta.barcode);
        totalInput += usage.input_tokens;
        totalOutput += usage.output_tokens;
        totalSearches += usage.web_search_count;

        console.log(`  GPT raw AR: ${research.product_name_ar}`);
        console.log(`  GPT raw EN: ${research.product_name_en}`);
        if (research.needs_review) console.log(`  ⚠ needs_review (confidence ${research.confidence})`);

        const useCurated =
          curated &&
          (research.needs_review || research.confidence < 60 || !research.product_name_ar || !research.product_name_en);

        if (useCurated) {
          console.log(`  → using curated fallback`);
          nameAr = curated.nameAr;
          nameEn = curated.nameEn;
        } else {
          const normalized = normalizeGptNames(research.product_name_ar, research.product_name_en, meta);
          nameAr = normalized.nameAr;
          nameEn = normalized.nameEn;
        }
      } catch (err) {
        console.log(`  GPT failed: ${(err as Error).message}`);
        if (!curated) throw err;
        console.log(`  → using curated fallback`);
        nameAr = curated.nameAr;
        nameEn = curated.nameEn;
      }
    }

    console.log(`  → AR: ${nameAr}`);
    console.log(`  → EN: ${nameEn}\n`);

    resolved.push({ ...meta, nameAr, nameEn });
    if (!SKIP_GPT) await new Promise((r) => setTimeout(r, 400));
  }

  const cost = estimateCostUsd(totalInput, totalOutput, totalSearches);
  console.log(
    `GPT total: ${totalInput}+${totalOutput} tokens, ${totalSearches} searches, ~$${cost.toFixed(4)}\n`,
  );

  return resolved;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCT_LIST.length} (no shades, no images)\n`);

  const named = await resolveNamesWithGpt();

  await login();

  const brandIds: Partial<Record<BrandKey, string>> = {};
  for (const key of Object.keys(BRANDS) as BrandKey[]) {
    brandIds[key] = await resolveBrandId(key);
  }
  console.log("");

  let added = 0;
  let skipped = 0;

  for (const product of named) {
    const brandId = brandIds[product.brandKey];
    if (!brandId) throw new Error(`Missing brandId for ${product.brandKey}`);

    console.log(`--- ${product.barcode} ---`);
    if (await barcodeExists(product.barcode)) {
      console.log(`  skip — barcode already exists\n`);
      skipped += 1;
      continue;
    }

    const created = await api<{ id: string }>("/products", "POST", {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      subcategoryIds: [product.subcategoryId],
      tertiaryCategoryId: product.tertiaryCategoryId,
      tertiaryCategoryIds: product.tertiaryCategoryId ? [product.tertiaryCategoryId] : [],
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price: product.price,
      originalPrice: product.price,
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

  console.log(`Done — added: ${added}/${named.length} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
