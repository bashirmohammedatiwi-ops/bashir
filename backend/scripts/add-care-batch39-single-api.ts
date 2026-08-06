/**
 * Care batch 39 — L'Oreal Paris Elvive (no shades, no images).
 * Deletes existing products by barcode then re-adds.
 * Usage: npx tsx scripts/add-care-batch39-single-api.ts
 * Optional: ONLY_BARCODES=3610340649653,3600521453315 npx tsx scripts/add-care-batch39-single-api.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const OIL_MASKS = "ab7c66e4-4df6-474f-b9d2-dd059dd60bfc";
const HAIR_TREATMENT = "ee39d6a6-5074-43b6-a80c-a7c1b23c3bd1";

const BARCODES = [
  "3600521453315", "3610340649653", "3600520838014", "3600520837963", "3610340673801",
  "3610340020025", "7509552843026", "3610340636691", "3610340653650", "7509552848021",
  "7509552848007", "7509552847550", "7509552847505", "7509552847598", "7509552847529",
  "3610340667237", "3610340667282", "3610340673849", "3610340667275", "3600524016234",
  "3600523955015", "3610340687662", "7509552817409", "3610340670978", "3610340687488",
  "3610340687679", "3600524016265", "3600524074739", "3600524135720", "3600524074876",
  "3600524075651", "3600524087593", "3600524127961", "3600521852972", "3600524228040",
  "3610340673887", "3600524004538", "3600524034931", "3600523944354",
];

type Batch140Product = {
  barcode: string;
  brandEn: string;
  nameEn: string;
  nameAr: string;
  typeKey: string;
  introEn: string;
  introAr: string;
  benefitsEn: string[];
  benefitsAr: string[];
  descriptionEn: string;
  descriptionAr: string;
};

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice: number;
  brandKey: "loreal" | "garnier";
  tertiaryCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const batch140: Batch140Product[] = JSON.parse(
  readFileSync(join(ROOT, "../catalog-hub/data/care-batch140-products.json"), "utf8"),
);
const posLookup: Array<{ barcode: string; pos?: { price?: number } }> = JSON.parse(
  readFileSync(join(ROOT, "../catalog-hub/data/care-batch140-pos-lookup.json"), "utf8"),
);
const posPrice = new Map(posLookup.map((r) => [r.barcode, r.pos?.price]));

function slugify(nameEn: string, barcode: string): string {
  const base = nameEn
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${barcode.slice(-6)}`;
}

function bullets(descAr: string, descEn: string, benefitsAr: string[], benefitsEn: string[]) {
  return {
    descriptionAr: `${descAr}\n\n${benefitsAr.map((b) => `• ${b}`).join("\n")}`,
    descriptionEn: `${descEn}\n\n${benefitsEn.map((b) => `• ${b}`).join("\n")}`,
  };
}

function tertiaryFor(typeKey: string): string {
  if (typeKey === "hair-mask") return OIL_MASKS;
  if (typeKey === "leave-in" || typeKey === "serum") return HAIR_TREATMENT;
  if (typeKey === "shampoo" || typeKey === "conditioner") return SHAMPOO_CONDITIONER;
  return HAIR_TREATMENT;
}

/** High-quality Iraqi-market names + missing product definitions */
const OVERRIDES: Record<
  string,
  {
    nameAr: string;
    nameEn: string;
    brandKey: "loreal" | "garnier";
    typeKey: string;
    price?: number;
    descAr: string;
    descEn: string;
    benefitsAr: string[];
    benefitsEn: string[];
  }
> = {
  "3600521453315": {
    nameAr: "لوريال باريس إلفيف ري-نيوتريشن - شامبو مغذٍ للشعر الجاف 400 مل",
    nameEn: "L'Oreal Paris Elvive Re-Nutrition Nourishing Shampoo 400ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف ري-نيوتريشن — يغذّي الشعر الجاف بتركيبة غذاء ملكي ويعيد المرونة والنعومة.",
    descEn: "L'Oreal Paris Elvive Re-Nutrition Nourishing Shampoo — nourishes dry hair with royal jelly for softness and elasticity.",
    benefitsAr: ["تركيبة مغذية بالغذاء الملكي", "للشعر الجاف", "يرطّب وينعّم", "ينظّف بلطف", "400 مل"],
    benefitsEn: ["Royal jelly nourishment", "For dry hair", "Hydrates and softens", "Gentle cleanse", "400ml"],
  },
  "3610340649653": {
    nameAr: "لوريال باريس إلفيف فول ريزست - شامبو تقوية ضد التساقط 400 مل",
    nameEn: "L'Oreal Paris Elvive Full Resist Reinforcing Shampoo 400ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف فول ريزست — يقوّي الشعر الضعيف المعرّض للتساقط بتركيبة Biotin و Arginine و Vitamin B5.",
    descEn: "L'Oreal Paris Elvive Full Resist Reinforcing Shampoo — strengthens weak, breakage-prone hair with biotin, arginine and vitamin B5.",
    benefitsAr: ["ضد التساقط", "يقوّي الألياف", "للشعر الضعيف", "ينظّف ويغذّي", "400 مل"],
    benefitsEn: ["Anti hair fall", "Strengthens fibres", "For weak hair", "Cleanses and nourishes", "400ml"],
  },
  "3600520838014": {
    nameAr: "لوريال باريس إلفيف إكستراورديناري أويل - بلسم مغذٍ بالزيوت للشعر الجاف 400 مل",
    nameEn: "L'Oreal Paris Elvive Extraordinary Oil Nourishing Conditioner 400ml",
    brandKey: "loreal",
    typeKey: "conditioner",
    descAr: "بلسم إلفيف إكستراورديناري أويل — تركيبة غنية بالزيوت للشعر الجاف والباهت.",
    descEn: "L'Oreal Paris Elvive Extraordinary Oil Nourishing Conditioner — oil-rich formula for dry, dull hair.",
    benefitsAr: ["زيت الزهور المغذي", "يرطّب بعمق", "ينعّم الألياف", "يلمع الشعر", "مناسب للشعر الجاف"],
    benefitsEn: ["Flower oil nourishment", "Deep hydration", "Softens fibres", "Adds shine", "Ideal for dry hair"],
  },
  "3600520837963": {
    nameAr: "لوريال باريس إلفيف غليكوليك جلوس - شامبو للمعان والنعومة 400 مل",
    nameEn: "L'Oreal Paris Elvive Glycolic Gloss Shampoo 400ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف غليكوليك جلوس — ينظّف ويعزّز لمعان الشعر بتركيبة حمض الجليكوليك.",
    descEn: "L'Oreal Paris Elvive Glycolic Gloss Shampoo — cleanses and boosts shine with glycolic acid complex.",
    benefitsAr: ["تركيبة جليكوليك للمعان", "ينظف بلطف", "ينعّم قشرة الشعر", "يلمع الشعر", "مناسب للاستخدام اليومي"],
    benefitsEn: ["Glycolic gloss complex", "Gentle cleanse", "Smooths cuticles", "Boosts shine", "Suitable for daily use"],
  },
  "3610340673801": {
    nameAr: "لوريال باريس إلفيف غليكوليك جلوس - شامبو للمعان والنعومة 400 مل",
    nameEn: "L'Oreal Paris Elvive Glycolic Gloss Shampoo 400ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    price: 4750,
    descAr: "شامبو إلفيف غليكوليك جلوس — ينظّف ويعزّز لمعان الشعر بتركيبة حمض الجليكوليك.",
    descEn: "L'Oreal Paris Elvive Glycolic Gloss Shampoo — cleanses and boosts shine with glycolic acid complex.",
    benefitsAr: ["تركيبة جليكوليك للمعان", "ينظف بلطف", "ينعّم قشرة الشعر", "يلمع الشعر", "مناسب للاستخدام اليومي"],
    benefitsEn: ["Glycolic gloss complex", "Gentle cleanse", "Smooths cuticles", "Boosts shine", "Suitable for daily use"],
  },
  "3610340020025": {
    nameAr: "لوريال باريس إلفيف إكستراورديناري أويل - شامبو مغذٍ بالزيوت للشعر الجاف 400 مل",
    nameEn: "L'Oreal Paris Elvive Extraordinary Oil Nourishing Shampoo 400ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف إكستراورديناري أويل — ينظّف ويغذّي الشعر الجاف والباهت بتركيبة الزيوت المغذية.",
    descEn: "L'Oreal Paris Elvive Extraordinary Oil Nourishing Shampoo — cleanses and nourishes dry, dull hair with precious oils.",
    benefitsAr: ["زيوت مغذية", "للشعر الجاف", "يرطّب ويلمع", "ينظّف بلطف", "400 مل"],
    benefitsEn: ["Nourishing oils", "For dry hair", "Hydrates and shines", "Gentle cleanse", "400ml"],
  },
  "7509552843026": {
    nameAr: "لوريال باريس إلفيف دريم لونج - شامبو للشعر الطويل والأملس 400 مل",
    nameEn: "L'Oreal Paris Elvive Dream Long Straight Shampoo 400ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف دريم لونج — ينظّف ويحمي الشعر الطويل من التقصف والتلف.",
    descEn: "L'Oreal Paris Elvive Dream Long Straight Shampoo — cleanses and protects long hair from breakage.",
    benefitsAr: ["للشعر الطويل والأملس", "يقلّل التقصف", "يقوّي الأطراف", "ينظف بلطف", "يترك الشعر ناعماً"],
    benefitsEn: ["For long, straight hair", "Helps reduce breakage", "Strengthens ends", "Gentle cleanse", "Leaves hair soft"],
  },
  "3610340636691": {
    nameAr: "لوريال باريس إلفيف دريم لونج - شامبو ترميمي للشعر الطويل والتالف 400 مل",
    nameEn: "L'Oreal Paris Elvive Dream Long Restoring Shampoo 400ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف دريم لونج — ينظّف ويرمّم الشعر الطويل بتركيبة Keratin والفيتamins وزيت الخروع.",
    descEn: "L'Oreal Paris Elvive Dream Long Restoring Shampoo — cleanses and restores long hair with keratin, vitamins and castor oil.",
    benefitsAr: ["للشعر الطويل", "يرمّم ويقوّي", "يقلّل ظهور الأطراف المتقصفة", "ينظّف بلطف", "400 مل"],
    benefitsEn: ["For long hair", "Restores and strengthens", "Helps reduce visible split ends", "Gentle cleanse", "400ml"],
  },
  "3610340653650": {
    nameAr: "لوريال باريس إلفيف Keratin Straight - شامبو لتمليس الشعر الطويل والمجعد 400 مل",
    nameEn: "L'Oreal Paris Elvive Keratin & Black Seed Oil Straightening Shampoo 400ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف Keratin Straight — يملّس الشعر المجعد والطويل بتركيبة Keratin وزيت حبة البركة حتى 72 ساعة.",
    descEn: "L'Oreal Paris Elvive Keratin & Black Seed Oil Straightening Shampoo — smooths frizzy long hair for up to 72 hours.",
    benefitsAr: ["Keratin وزيت حبة البركة", "يقلّل الهيشan", "للشعر الطويل والمجعد", "ينظّف ويملّس", "400 مل"],
    benefitsEn: ["Keratin and black seed oil", "Helps reduce frizz", "For long, frizzy hair", "Cleanses and smooths", "400ml"],
  },
  "7509552848021": {
    nameAr: "لوريال باريس إلفيف إكستراورديناري كيرلز - شامبو مغذٍ للشعر المجعد 370 مل",
    nameEn: "L'Oreal Paris Elvive Extraordinary Curls Nourishing Shampoo 370ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف إكستراورديناري كيرلز — يغذّي ويعرّف التموجات والمجعد.",
    descEn: "L'Oreal Paris Elvive Extraordinary Curls Nourishing Shampoo — nourishes and defines curls and waves.",
    benefitsAr: ["للشعر المجعد والمموج", "يعرّف التموجات", "يغذّي الألياف", "يقلّل الهيشان", "ينظف بلطف"],
    benefitsEn: ["For curly and wavy hair", "Defines curls", "Nourishes fibres", "Helps reduce frizz", "Gentle cleanse"],
  },
  "7509552848007": {
    nameAr: "لوريال باريس إلفيف توتال ريبير 5 إكستريم - شامبو إصلاح للشعر المتضرر 370 مل",
    nameEn: "L'Oreal Paris Elvive Total Repair 5 Extreme Renewing Shampoo 370ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف توتال ريبير 5 إكستريم — إصلاح مكثّف للشعر المتضرر جداً.",
    descEn: "L'Oreal Paris Elvive Total Repair 5 Extreme Renewing Shampoo — intensive repair for very damaged hair.",
    benefitsAr: ["إصلاح 5 مشاكل", "يقوّي الألياف", "يقلّل التقصف", "ينعّم الشعر", "للشعر المتضرر جداً"],
    benefitsEn: ["Repairs 5 damage problems", "Strengthens fibres", "Reduces breakage", "Smooths hair", "For very damaged hair"],
  },
  "7509552847550": {
    nameAr: "لوريال باريس إلفيف إكستراورديناري كلاي - شامبو منقي للشعر الدهني 370 مل",
    nameEn: "L'Oreal Paris Elvive Extraordinary Clay Purifying Shampoo 370ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    price: 5000,
    descAr: "شامبو إلفيف إكستراورديناري كلاي — ينقّي فروة الرأس الدهنية ويمتص الزيوت الزائدة.",
    descEn: "L'Oreal Paris Elvive Extraordinary Clay Purifying Shampoo — purifies oily scalp and absorbs excess oil.",
    benefitsAr: ["طين منقي", "للفروة الدهنية", "ينظّف بعمق", "يمنح انتعاشاً", "لا يثقل الشعر"],
    benefitsEn: ["Purifying clay", "For oily scalp", "Deep cleansing", "Fresh feel", "Does not weigh hair down"],
  },
  "7509552847505": {
    nameAr: "لوريال باريس إلفيف إكستراورديناري أويل - شامبو مغذٍ شامل بالزيوت 370 مل",
    nameEn: "L'Oreal Paris Elvive Extraordinary Oil Universal Nourishing Shampoo 370ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف إكستراورديناري أويل — مغذٍ شامل بالزيوت لجميع أنواع الشعر.",
    descEn: "L'Oreal Paris Elvive Extraordinary Oil Universal Nourishing Shampoo — nourishes all hair types.",
    benefitsAr: ["زيت الزهور", "لجميع أنواع الشعر", "يرطّب ويلمع", "ينظف بلطف", "يغذّي الألياف"],
    benefitsEn: ["Flower oils", "All hair types", "Hydrates and shines", "Gentle cleanse", "Nourishes fibres"],
  },
  "7509552847598": {
    nameAr: "لوريال باريس إلفيف دريم لونج - شامبو للشعر الطويل والأملس 370 مل",
    nameEn: "L'Oreal Paris Elvive Dream Long Straight Shampoo 370ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف دريم لونج — ينظّف ويحمي الشعر الطويل من التقصف.",
    descEn: "L'Oreal Paris Elvive Dream Long Straight Shampoo — cleanses and protects long hair from breakage.",
    benefitsAr: ["للشعر الطويل", "يقلّل التقصف", "يقوّي الأطراف", "ينظف بلطف", "يترك الشعر ناعماً"],
    benefitsEn: ["For long hair", "Helps reduce breakage", "Strengthens ends", "Gentle cleanse", "Leaves hair soft"],
  },
  "7509552847529": {
    nameAr: "لوريال باريس إلفيف إكستراورديناري - شامبو مغذٍ بجوز الهند 370 مل",
    nameEn: "L'Oreal Paris Elvive Extraordinary Coconut Nourishing Shampoo 370ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف إكستراورديناري بجوز الهند — يغذّي الشعر الجاف وينعّمه.",
    descEn: "L'Oreal Paris Elvive Extraordinary Coconut Nourishing Shampoo — nourishes and softens dry hair.",
    benefitsAr: ["جوز الهند", "يرطّب بعمق", "ينعّم الألياف", "يلمع الشعر", "للشعر الجاف"],
    benefitsEn: ["Coconut nourishment", "Deep hydration", "Softens fibres", "Adds shine", "For dry hair"],
  },
  "3610340667237": {
    nameAr: "لوريال باريس إلفيف فول ريزست - بلسم تقوية ضد التساقط 360 مل",
    nameEn: "L'Oreal Paris Elvive Full Resist Reinforcing Conditioner 360ml",
    brandKey: "loreal",
    typeKey: "conditioner",
    descAr: "بلسم إلفيف فول ريزست — يقوّي الشعر الضعيف ويسهّل التمشيط بتركيبة Aminexil و Biotin.",
    descEn: "L'Oreal Paris Elvive Full Resist Reinforcing Conditioner — strengthens weak hair and detangles with Aminexil and biotin.",
    benefitsAr: ["ضد التساقط", "Aminexil و Biotin", "يفك التشابك", "يقوّي الألياف", "360 مل"],
    benefitsEn: ["Anti hair fall", "Aminexil and biotin", "Detangles hair", "Strengthens fibres", "360ml"],
  },
  "3610340667282": {
    nameAr: "لوريال باريس إلفيف - بلسم حماية اللون للشعر المصبوغ 360 مل",
    nameEn: "L'Oreal Paris Elvive Colour Protect Conditioner 360ml",
    brandKey: "loreal",
    typeKey: "conditioner",
    price: 6750,
    descAr: "بلسم إلفيف حماية اللون — يحافظ على حيوية ولمعان الشعر المصبوغ.",
    descEn: "L'Oreal Paris Elvive Colour Protect Conditioner — preserves colour vibrancy and shine.",
    benefitsAr: ["حماية اللون", "يمنع البهتان", "ينعّم الألياف", "يلمع الشعر", "للشعر المصبوغ"],
    benefitsEn: ["Colour protection", "Prevents fading", "Softens fibres", "Adds shine", "For coloured hair"],
  },
  "3610340673849": {
    nameAr: "لوريال باريس إلفيف غليكوليك جلوس - بلسم للمعان والنعومة 360 مل",
    nameEn: "L'Oreal Paris Elvive Glycolic Gloss Conditioner 360ml",
    brandKey: "loreal",
    typeKey: "conditioner",
    price: 6750,
    descAr: "بلسم إلفيف غليكوليك جلوس — ينعّم ويعزّز لمعان الشعر.",
    descEn: "L'Oreal Paris Elvive Glycolic Gloss Conditioner — smooths and enhances radiant shine.",
    benefitsAr: ["تركيبة جليكوليك", "ينعّم الألياف", "يلمع الشعر", "يسهّل التمشيط", "لمعان مرآوي"],
    benefitsEn: ["Glycolic complex", "Smooths fibres", "Boosts shine", "Detangles hair", "Mirror-like gloss"],
  },
  "3610340667275": {
    nameAr: "لوريال باريس إلفيف Keratin Straight - بلسم لتمليس الشعر الطويل والمجعد 360 مل",
    nameEn: "L'Oreal Paris Elvive Keratin Straight Conditioner 360ml",
    brandKey: "loreal",
    typeKey: "conditioner",
    descAr: "بلسم إلفيف Keratin Straight — يملّس الشعر المجعد والطويل ويسهّل التمشيط بتركيبة Keratin.",
    descEn: "L'Oreal Paris Elvive Keratin Straight Conditioner — smooths frizzy long hair and detangles with keratin care.",
    benefitsAr: ["Keratin لتمليس الشعر", "يقلّل الهيشan", "يفك التشابك", "للشعر الطويل", "360 مل"],
    benefitsEn: ["Keratin smoothing care", "Helps reduce frizz", "Detangles hair", "For long hair", "360ml"],
  },
  "3600524016234": {
    nameAr: "لوريال باريس إلفيف إكستراورديناري أويل - شامبو مغذٍ بالزيوت 300 مل",
    nameEn: "L'Oreal Paris Elvive Extraordinary Oil Nourishing Shampoo 300ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف إكستراورديناري أويل — ينظّف ويغذّي الشعر الجاف بالزيوت.",
    descEn: "L'Oreal Paris Elvive Extraordinary Oil Nourishing Shampoo — cleanses and nourishes dry hair with oils.",
    benefitsAr: ["زيت الزهور", "يرطّب ويلمع", "ينظف بلطف", "للشعر الجاف", "يغذّي الألياف"],
    benefitsEn: ["Flower oils", "Hydrates and shines", "Gentle cleanse", "For dry hair", "Nourishes fibres"],
  },
  "3600523955015": {
    nameAr: "لوريال باريس إلفيف فول ريزست - شامبو تقوية ضد التساقط 700 مل",
    nameEn: "L'Oreal Paris Elvive Full Resist Reinforcing Shampoo 700ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف فول ريزست — يقوّي الشعر ويقلّل التساقط بحجم عائلي 700 مل.",
    descEn: "L'Oreal Paris Elvive Full Resist Reinforcing Shampoo — strengthens hair and helps reduce fall, 700ml family size.",
    benefitsAr: ["ضد التساقط", "يقوّي الجذور", "حجم 700 مل", "للشعر الضعيف", "ينظف ويغذّي"],
    benefitsEn: ["Anti hair fall", "Strengthens roots", "700ml family size", "For weak hair", "Cleanses and nourishes"],
  },
  "3610340687662": {
    nameAr: "لوريال باريس إلفيف Hyaluron Plump - بلسم مرطب للشعر الجاف 400 مل",
    nameEn: "L'Oreal Paris Elvive Hyaluron Plump Hydrating Conditioner 400ml",
    brandKey: "loreal",
    typeKey: "conditioner",
    price: 5000,
    descAr: "بلسم إلفيف Hyaluron Plump — يرطّب الشعر الجاف ويفك التشابك بتركيبة الهيaluron حتى 72 ساعة.",
    descEn: "L'Oreal Paris Elvive Hyaluron Plump Hydrating Conditioner — hydrates dry hair and detangles with hyaluronic care for up to 72 hours.",
    benefitsAr: ["ترطيب 72 ساعة", "الهيaluron", "يفك التشابك", "للشعر الجاف", "400 مل"],
    benefitsEn: ["72-hour hydration", "Hyaluronic care", "Detangles hair", "For dry hair", "400ml"],
  },
  "7509552817409": {
    nameAr: "لوريال باريس إلفيف توتال ريبير 5 إكستريم - شامبو إصلاح للشعر المتضرر 680 مل",
    nameEn: "L'Oreal Paris Elvive Total Repair 5 Extreme Renewing Shampoo 680ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    price: 9000,
    descAr: "شامبو إلفيف توتال ريبير 5 إكستريم — إصلاح مكثّف بحجم 680 مل.",
    descEn: "L'Oreal Paris Elvive Total Repair 5 Extreme Renewing Shampoo — intensive repair, 680ml.",
    benefitsAr: ["إصلاح 5 مشاكل", "حجم 680 مل", "يقوّي الألياف", "للشعر المتضرر", "ينظف ويصلّح"],
    benefitsEn: ["Repairs 5 damage problems", "680ml size", "Strengthens fibres", "For damaged hair", "Cleanses and repairs"],
  },
  "3610340670978": {
    nameAr: "لوريال باريس إلفيف هيالورون بيور - شامبو منقي للشعر الدهني 400 مل",
    nameEn: "L'Oreal Paris Elvive Hyaluron Pure Purifying Shampoo for Oily Hair 400ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    price: 4750,
    descAr: "شامبو إلفيف هيالورون بيور — ينقّي فروة الرأس الدهنية مع ترطيب متوازن.",
    descEn: "L'Oreal Paris Elvive Hyaluron Pure Purifying Shampoo — purifies oily scalp with balanced hydration.",
    benefitsAr: ["تركيبة منقية بالهيالورون", "للفروة الدهنية", "ينظّف بعمق", "يحافظ على الترطيب", "انتعاش نظيف"],
    benefitsEn: ["Hyaluron purifying", "For oily scalp", "Deep cleansing", "Maintains hydration", "Fresh clean feel"],
  },
  "3610340687488": {
    nameAr: "لوريال باريس إلفيف Hyaluron Plump - شامبو مرطب للشعر الجاف 400 مل",
    nameEn: "L'Oreal Paris Elvive Hyaluron Plump Hydrating Shampoo 400ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    price: 4250,
    descAr: "شامبو إلفيف Hyaluron Plump — ينظّف ويرطّب الشعر الجاف بتركيبة الهيaluron حتى 72 ساعة.",
    descEn: "L'Oreal Paris Elvive Hyaluron Plump Hydrating Shampoo — cleanses and hydrates dry hair with hyaluronic care for up to 72 hours.",
    benefitsAr: ["ترطيب 72 ساعة", "الهيaluron", "ينظّف بلطف", "للشعر الجاف", "400 مل"],
    benefitsEn: ["72-hour hydration", "Hyaluronic care", "Gentle cleanse", "For dry hair", "400ml"],
  },
  "3610340687679": {
    nameAr: "لوريال باريس إلفيف Hyaluron Plump - سيروم ترطيب بدون شطف 200 مل",
    nameEn: "L'Oreal Paris Elvive Hyaluron Plump Moisture Replumping Leave-In Serum 200ml",
    brandKey: "loreal",
    typeKey: "leave-in",
    price: 8500,
    descAr: "سيروم إلفيف Hyaluron Plump بدون شطف — يعيد امتلاء وترطيب الشعر الجاف بتركيبة الهيالورون.",
    descEn: "L'Oreal Paris Elvive Hyaluron Plump Moisture Replumping Leave-In Serum — no-rinse moisture boost for dry, dehydrated hair.",
    benefitsAr: ["بدون شطف", "ترطيب وامتلاء", "الهيالورون", "للشعر الجاف", "200 مل"],
    benefitsEn: ["No rinse", "Moisture replumping", "Hyaluronic care", "For dry hair", "200ml"],
  },
  "3600524016265": {
    nameAr: "لوريال باريس إلفيف هيالورون بلَمب - شامبو مرطب 300 مل",
    nameEn: "L'Oreal Paris Elvive Hyaluron Plump Hydrating Shampoo 300ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف هيالورون بلَمب — يرطّب الشعر الجاف بتركيبة الهيالورون.",
    descEn: "L'Oreal Paris Elvive Hyaluron Plump Hydrating Shampoo — hydrates dry hair with hyaluronic formula.",
    benefitsAr: ["هيالورون", "ترطيب مكثّف", "ينظّف بلطف", "يمنح امتلاء", "للشعر الجاف"],
    benefitsEn: ["Hyaluronic formula", "Intensive hydration", "Gentle cleanse", "Adds plumpness", "For dry hair"],
  },
  "3600524074739": {
    nameAr: "لوريال باريس إلفيف بوند ريبير - علاج قبل الشامبو 200 مل",
    nameEn: "L'Oreal Paris Elvive Bond Repair Pre-Shampoo Treatment 200ml",
    brandKey: "loreal",
    typeKey: "hair-mask",
    descAr: "علاج إلفيف بوند ريبير قبل الشامبو — يصلّح روابط الشعر قبل الغسيل.",
    descEn: "L'Oreal Paris Elvive Bond Repair Pre-Shampoo Treatment — repairs hair bonds before washing.",
    benefitsAr: ["يُطبّق قبل الشامبو", "يصلّح الروابط", "للشعر المتضرر", "علاج أسبوعي", "يقوّي الألياف"],
    benefitsEn: ["Apply before shampoo", "Repairs bonds", "For damaged hair", "Weekly treatment", "Strengthens fibres"],
  },
  "3600524135720": {
    nameAr: "لوريال باريس إلفيف غليكوليك جلوس - بلسم للمعان 150 مل",
    nameEn: "L'Oreal Paris Elvive Glycolic Gloss Conditioner 150ml",
    brandKey: "loreal",
    typeKey: "conditioner",
    descAr: "بلسم إلفيف غليكوليك جلوس — ينعّم ويلمع الشعر بحجم 150 مل.",
    descEn: "L'Oreal Paris Elvive Glycolic Gloss Conditioner — smooths and shines hair, 150ml.",
    benefitsAr: ["تركيبة جليكوليك", "لمعان مرآوي", "ينعّم الألياف", "حجم سفر 150 مل", "يسهّل التمشيط"],
    benefitsEn: ["Glycolic complex", "Mirror shine", "Smooths fibres", "Travel size 150ml", "Detangles hair"],
  },
  "3600524074876": {
    nameAr: "لوريال باريس إلفيف غليكوليك جلوس - شامبو للمعان 150 مل",
    nameEn: "L'Oreal Paris Elvive Glycolic Gloss Shampoo 150ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف غليكوليك جلوس — ينظّف ويلمع الشعر بحجم 150 مل.",
    descEn: "L'Oreal Paris Elvive Glycolic Gloss Shampoo — cleanses and boosts shine, 150ml.",
    benefitsAr: ["تركيبة جليكوليك", "لمعان مرآوي", "ينظّف بلطف", "حجم سفر 150 مل", "مناسب يومياً"],
    benefitsEn: ["Glycolic complex", "Mirror shine", "Gentle cleanse", "Travel size 150ml", "Daily use"],
  },
  "3600524075651": {
    nameAr: "لوريال باريس إلفيف غليكوليك جلوس - سيروم بدون شطف 150 مل",
    nameEn: "L'Oreal Paris Elvive Glycolic Gloss Leave-In Serum 150ml",
    brandKey: "loreal",
    typeKey: "leave-in",
    descAr: "سيروم إلفيف غليكوليك جلوس بدون شطف — يغلق قشرة الشعر للمعان.",
    descEn: "L'Oreal Paris Elvive Glycolic Gloss Leave-In Serum — seals cuticles for mirror shine, no rinse.",
    benefitsAr: ["بدون شطف", "يغلق قشرة الشعر", "لمعان فوري", "حماية من الحرارة", "150 مل"],
    benefitsEn: ["No rinse", "Seals cuticles", "Instant shine", "Heat protection", "150ml"],
  },
  "3600524087593": {
    nameAr: "لوريال باريس إلفيف بوند ريبير - بلسم إصلاحي 200 مل",
    nameEn: "L'Oreal Paris Elvive Bond Repair Conditioner 200ml",
    brandKey: "loreal",
    typeKey: "conditioner",
    descAr: "بلسم إلفيف بوند ريبير — يصلّح روابط الشعر المتضرر.",
    descEn: "L'Oreal Paris Elvive Bond Repair Conditioner — repairs damaged hair bonds.",
    benefitsAr: ["إصلاح الروابط", "يقوّي الألياف", "ينعّم الشعر", "للشعر المتضرر", "200 مل"],
    benefitsEn: ["Bond repair", "Strengthens fibres", "Smooths hair", "For damaged hair", "200ml"],
  },
  "3600524127961": {
    nameAr: "لوريال باريس إلفيف بوند ريبير - شامبو إصلاحي 200 مل",
    nameEn: "L'Oreal Paris Elvive Bond Repair Shampoo 200ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف بوند ريبير — ينظّف ويصلّح الشعر المتضرر.",
    descEn: "L'Oreal Paris Elvive Bond Repair Shampoo — cleanses and repairs damaged hair.",
    benefitsAr: ["إصلاح الروابط", "ينظّف بلطف", "يقوّي الألياف", "للشعر المتضرر", "200 مل"],
    benefitsEn: ["Bond repair", "Gentle cleanse", "Strengthens fibres", "For damaged hair", "200ml"],
  },
  "3600521852972": {
    nameAr: "لوريال باريس إلفيف هيالورون بلَمب - شامبو مرطب 200 مل",
    nameEn: "L'Oreal Paris Elvive Hyaluron Plump Hydrating Shampoo 200ml",
    brandKey: "loreal",
    typeKey: "shampoo",
    descAr: "شامبو إلفيف هيالورون بلَمب — يرطّب الشعر الجاف بحجم 200 مل.",
    descEn: "L'Oreal Paris Elvive Hyaluron Plump Hydrating Shampoo — hydrates dry hair, 200ml.",
    benefitsAr: ["هيالورون", "ترطيب مكثّف", "ينظّف بلطف", "200 مل", "للشعر الجاف"],
    benefitsEn: ["Hyaluronic formula", "Intensive hydration", "Gentle cleanse", "200ml", "For dry hair"],
  },
  "3600524228040": {
    nameAr: "لوريال باريس إلفيف غليكوليك جلوس - علاج لامينيشن بريميوم 5 دقائق 150 مل",
    nameEn: "L'Oreal Paris Elvive Glycolic Gloss 5-Minute Lamination Premium Treatment 150ml",
    brandKey: "loreal",
    typeKey: "hair-mask",
    descAr: "علاج إلفيف غليكوليك جلوس لامينيشن بريميوم — لمعان فائق في 5 دقائق.",
    descEn: "L'Oreal Paris Elvive Glycolic Gloss 5-Minute Lamination Premium Treatment — ultra shine in 5 minutes.",
    benefitsAr: ["5 دقائق فقط", "لامينيشن بريميوم", "لمعان مرآوي", "150 مل", "للشعر الباهت"],
    benefitsEn: ["Just 5 minutes", "Premium lamination", "Mirror shine", "150ml", "For dull hair"],
  },
  "3610340673887": {
    nameAr: "لوريال باريس إلفيف غليكوليك جلوس - كريم تصفيف بدون شطف 200 مل",
    nameEn: "L'Oreal Paris Elvive Glycolic Gloss Leave-In Combing Cream 200ml",
    brandKey: "loreal",
    typeKey: "leave-in",
    price: 8500,
    descAr: "كريم تصفيف إلفيف غليكوليك جلوس — يغلق قشرة الشعر ويسهّل التمشيط.",
    descEn: "L'Oreal Paris Elvive Glycolic Gloss Leave-In Combing Cream — seals cuticles and eases detangling.",
    benefitsAr: ["بدون شطف", "تركيبة جليكوليك 2%", "يفك التشابك", "حماية من الحرارة", "200 مل"],
    benefitsEn: ["No rinse", "2% glycolic complex", "Detangles hair", "Heat protection", "200ml"],
  },
  "3600524004538": {
    nameAr: "لوريال باريس إلفيف - علاج ماء لامع لحماية اللون 8 ثوانٍ 200 مل",
    nameEn: "L'Oreal Paris Elvive Colour Protect 8 Second Wonder Water 200ml",
    brandKey: "loreal",
    typeKey: "hair-mask",
    descAr: "علاج ماء لامع إلفيف لحماية اللون — يُشطف ويعزّز لمعان الشعر المصبوغ في 8 ثوانٍ.",
    descEn: "L'Oreal Paris Elvive Colour Protect 8 Second Wonder Water — rinse-out shine boost for coloured hair in 8 seconds.",
    benefitsAr: ["8 ثوانٍ فقط", "يُشطف", "لمعان فوري", "لحماية اللون", "200 مل"],
    benefitsEn: ["Just 8 seconds", "Rinse-out", "Instant shine", "Colour protection", "200ml"],
  },
  "3600524034931": {
    nameAr: "لوريال باريس إلفيف غليكوليك جلوس - علاج لامينيشن 5 دقائق 150 مل",
    nameEn: "L'Oreal Paris Elvive Glycolic Gloss 5-Minute Lamination Treatment 150ml",
    brandKey: "loreal",
    typeKey: "hair-mask",
    descAr: "علاج إلفيف غليكوليك جلوس لامينيشن — لمعان مكثّف في 5 دقائق.",
    descEn: "L'Oreal Paris Elvive Glycolic Gloss 5-Minute Lamination Treatment — intensive shine in 5 minutes.",
    benefitsAr: ["5 دقائق", "لامينيشن", "لمعان مرآوي", "150 مل", "للشعر الباهت"],
    benefitsEn: ["5 minutes", "Lamination treatment", "Mirror shine", "150ml", "For dull hair"],
  },
  "3600523944354": {
    nameAr: "لوريال باريس إلفيف بوند ريبير - سيروم بدون شطف 200 مل",
    nameEn: "L'Oreal Paris Elvive Bond Repair Leave-In Serum 200ml",
    brandKey: "loreal",
    typeKey: "leave-in",
    descAr: "سيروم إلفيف بوند ريبير بدون شطف — يصلّح ويحمي الشعر المتضرر.",
    descEn: "L'Oreal Paris Elvive Bond Repair Leave-In Serum — repairs and protects damaged hair, no rinse.",
    benefitsAr: ["بدون شطف", "إصلاح الروابط", "يحمي من التلف", "200 مل", "للشعر المتضرر"],
    benefitsEn: ["No rinse", "Bond repair", "Protects from damage", "200ml", "For damaged hair"],
  },
};

function buildProducts(): ProductDef[] {
  const batchMap = new Map(batch140.map((p) => [p.barcode, p]));
  return BARCODES.map((barcode) => {
    const o = OVERRIDES[barcode];
    if (!o) throw new Error(`Missing override for ${barcode}`);
    const price = o.price ?? posPrice.get(barcode) ?? 5000;
    const originalPrice = Math.round(price * 1.1 / 250) * 250;
    const { descriptionAr, descriptionEn } = bullets(o.descAr, o.descEn, o.benefitsAr, o.benefitsEn);
    return {
      barcode,
      slug: slugify(o.nameEn, barcode),
      sku: `${o.brandKey === "garnier" ? "GRN" : "LOR"}-${barcode.slice(-6)}`,
      price,
      originalPrice,
      brandKey: o.brandKey,
      tertiaryCategoryId: tertiaryFor(o.typeKey),
      nameAr: o.nameAr,
      nameEn: o.nameEn,
      descriptionAr,
      descriptionEn,
    };
  });
}

const ONLY_BARCODES = process.env.ONLY_BARCODES?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const PRODUCTS = buildProducts().filter(
  (p) => !ONLY_BARCODES?.length || ONLY_BARCODES.includes(p.barcode),
);

let token = "";
const brandIds: Record<string, string> = {};

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

async function resolveBrand(key: "loreal" | "garnier"): Promise<string> {
  if (brandIds[key]) return brandIds[key];
  const spec =
    key === "garnier"
      ? { brandAr: "غارنييه", brandEn: "Garnier" }
      : { brandAr: "لوريال", brandEn: "L'Oreal" };
  const resolved = await api<{ brand?: { id: string } }>("/brands/resolve", "POST", {
    ...spec,
    createIfMissing: true,
  });
  const id = resolved.brand?.id;
  if (!id) throw new Error(`Could not resolve brand ${key}`);
  brandIds[key] = id;
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
  console.log(`Products: ${PRODUCTS.length} (no shades, no images, delete+readd)\n`);
  await login();
  console.log("Logged in.\n");

  let added = 0;
  let deleted = 0;

  for (const product of PRODUCTS) {
    console.log(`--- ${product.barcode} ---`);
    if (await deleteByBarcode(product.barcode)) deleted += 1;
    await deleteOrphanSlug(product.slug);

    const brandId = await resolveBrand(product.brandKey);
    const created = await api<{ id: string }>("/products", "POST", {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId,
      categoryId: CARE,
      subcategoryId: HAIR_CARE,
      tertiaryCategoryId: product.tertiaryCategoryId,
      subcategoryIds: [HAIR_CARE],
      tertiaryCategoryIds: [product.tertiaryCategoryId],
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

  console.log(`Done — added: ${added}/${PRODUCTS.length} | deleted: ${deleted}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
