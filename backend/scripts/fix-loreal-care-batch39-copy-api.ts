/**
 * Final review fix — care batch 39 L'Oreal products
 * Updates names, descriptions, tertiary category, and one white-background image.
 * Usage: npx tsx scripts/fix-loreal-care-batch39-copy-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const OIL_MASKS = "ab7c66e4-4df6-474f-b9d2-dd059dd60bfc";
const HAIR_TREATMENT = "ee39d6a6-5074-43b6-a80c-a7c1b23c3bd1";

type TypeKey = "shampoo" | "conditioner" | "hair-mask" | "leave-in" | "serum";

type Fix = {
  barcode: string;
  typeKey: TypeKey;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  benefitsAr: string[];
  benefitsEn: string[];
  imageSources: string[];
};

function bullets(descAr: string, descEn: string, benefitsAr: string[], benefitsEn: string[]) {
  return {
    descriptionAr: `${descAr}\n\n${benefitsAr.map((b) => `• ${b}`).join("\n")}`,
    descriptionEn: `${descEn}\n\n${benefitsEn.map((b) => `• ${b}`).join("\n")}`,
  };
}

function tertiaryFor(typeKey: TypeKey): string {
  if (typeKey === "hair-mask") return OIL_MASKS;
  if (typeKey === "leave-in" || typeKey === "serum") return HAIR_TREATMENT;
  return SHAMPOO_CONDITIONER;
}

const FIXES: Fix[] = [
  {
    barcode: "3600521453315",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف ري-نيوتريشن - شامبو مغذٍ للشعر الجاف 400 مل",
    nameEn: "L'Oreal Paris Elvive Re-Nutrition Nourishing Shampoo 400ml",
    descAr: "شامبو إلفيف ري-نيوتريشن يغذّي الشعر الجاف بتركيبة الغذاء الملكي ويمنحه نعومة ومرونة.",
    descEn: "L'Oreal Paris Elvive Re-Nutrition Nourishing Shampoo nourishes dry hair with royal jelly for softness and elasticity.",
    benefitsAr: ["يغذّي الشعر الجاف", "مع الغذاء الملكي", "ينظّف بلطف", "يعزّز النعومة", "400 مل"],
    benefitsEn: ["For dry hair", "With royal jelly", "Gentle cleanse", "Boosts softness", "400ml"],
    imageSources: ["https://images.openbeautyfacts.org/images/products/360/052/145/3315/front_en.7.400.jpg"],
  },
  {
    barcode: "3610340649653",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف فول ريزست - شامبو تقوية ضد التساقط 400 مل",
    nameEn: "L'Oreal Paris Elvive Full Resist Reinforcing Shampoo 400ml",
    descAr: "شامبو إلفيف فول ريزست يقوّي الشعر الضعيف المعرّض للتكسّر والتساقط اليومي.",
    descEn: "L'Oreal Paris Elvive Full Resist Reinforcing Shampoo strengthens weak hair prone to daily breakage and fall.",
    benefitsAr: ["للشعر الضعيف", "بيوتين وأرجينين", "يقلّل التكسّر", "ينظّف بلطف", "400 مل"],
    benefitsEn: ["For weak hair", "Biotin and arginine", "Helps reduce breakage", "Gentle cleanse", "400ml"],
    imageSources: [
      "https://images.openbeautyfacts.org/images/products/361/034/064/9653/front_en.5.400.jpg",
      "https://www.loreal-paris-me.com/en/elvive/full-resist/reinforcing-shampoo-400ml",
    ],
  },
  {
    barcode: "3600520838014",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف أنتي-بريكاج - شامبو إصلاحي للشعر المتكسر 400 مل",
    nameEn: "L'Oreal Paris Elvive Anti-Breakage Repairing Shampoo 400ml",
    descAr: "شامبو إلفيف أنتي-بريكاج يقوّي الألياف الضعيفة ويساعد على تقليل تكسّر الأطراف.",
    descEn: "L'Oreal Paris Elvive Anti-Breakage Repairing Shampoo helps reinforce weakened fibres and reduce breakage.",
    benefitsAr: ["للشعر المتكسر", "تقوية وإصلاح", "يساعد على تقليل التقصف", "ينظّف بلطف", "400 مل"],
    benefitsEn: ["For brittle hair", "Repairing care", "Helps reduce breakage", "Gentle cleanse", "400ml"],
    imageSources: [
      "https://londonesebeauty.co.uk/shop/shampoo/loral-paris-elvive-anti-breakage-repairing-shampoo-400-ml-4/",
      "https://www.lorealparis.fi/elvital/anti-breakage/shampoo-400ml",
    ],
  },
  {
    barcode: "3600520837963",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف كولور بروتكت - شامبو حماية اللون للشعر المصبوغ 400 مل",
    nameEn: "L'Oreal Paris Elvive Colour Protect Shampoo 400ml",
    descAr: "شامبو إلفيف كولور بروتكت ينظّف الشعر المصبوغ ويحافظ على حيوية اللون ولمعانه.",
    descEn: "L'Oreal Paris Elvive Colour Protect Shampoo cleanses coloured hair while helping preserve colour vibrancy and shine.",
    benefitsAr: ["للشعر المصبوغ", "يحافظ على اللون", "يعزّز اللمعان", "فلاتر حماية", "400 مل"],
    benefitsEn: ["For coloured hair", "Colour protection", "Boosts shine", "UV protection care", "400ml"],
    imageSources: [
      "https://images.openbeautyfacts.org/images/products/360/052/083/7963/front_ar.6.400.jpg",
      "https://www.hicart.com/loreal-paris-elvive-colour-protect-shampoo-400-ml-w1040-3600520837963/",
    ],
  },
  {
    barcode: "3610340673801",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف غلايكوليك غلوس - شامبو للمعان والنعومة 400 مل",
    nameEn: "L'Oreal Paris Elvive Glycolic Gloss Shampoo 400ml",
    descAr: "شامبو إلفيف غلايكوليك غلوس ينظّف الشعر الباهت ويمنحه لمعاناً أوضح وملمساً أنعم.",
    descEn: "L'Oreal Paris Elvive Glycolic Gloss Shampoo cleanses dull hair and boosts visible shine and smoothness.",
    benefitsAr: ["لمعان مرآوي", "للشعر الباهت", "ينظّف بلطف", "ينعّم الألياف", "400 مل"],
    benefitsEn: ["Mirror-like shine", "For dull hair", "Gentle cleanse", "Smooths fibres", "400ml"],
    imageSources: ["https://niceonesa.com/en/loreal-paris-elvive-glycolic-gloss-shampoo-400ml-n37657"],
  },
  {
    barcode: "3610340020025",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف إكستراورديناري أويل - شامبو مغذٍ للشعر الجاف 400 مل",
    nameEn: "L'Oreal Paris Elvive Extraordinary Oil Nourishing Shampoo 400ml",
    descAr: "شامبو إلفيف إكستراورديناري أويل يغذّي الشعر الجاف ويمنحه نعومة ولمعاناً دون ثقل.",
    descEn: "L'Oreal Paris Elvive Extraordinary Oil Nourishing Shampoo nourishes dry hair for softness and shine without heaviness.",
    benefitsAr: ["للشعر الجاف", "زيوت مغذية", "نعومة ولمعان", "ينظّف بلطف", "400 مل"],
    benefitsEn: ["For dry hair", "Nourishing oils", "Softness and shine", "Gentle cleanse", "400ml"],
    imageSources: [
      "https://images.openbeautyfacts.org/images/products/361/034/002/0025/front_en.3.400.jpg",
      "https://www.loreal-paris.co.uk/elvive/extraordinary-oil/oil-shampoo-dry-hair",
    ],
  },
  {
    barcode: "7509552843026",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف دريم لونغ ليس - شامبو مضاد للهيشان للشعر الطويل 400 مل",
    nameEn: "L'Oreal Paris Elvive Dream Long Liss Super Liss Shampoo 400ml",
    descAr: "شامبو إلفيف دريم لونغ ليس يسيطر على الهيشان ويمنح الشعر الطويل مظهراً أنعم وأكثر انسيابية.",
    descEn: "L'Oreal Paris Elvive Dream Long Liss Super Liss Shampoo helps control frizz and smooth long hair.",
    benefitsAr: ["للشعر الطويل", "مضاد للهيشان", "كيراتين نباتي", "ينعّم الشعر", "400 مل"],
    benefitsEn: ["For long hair", "Anti-frizz care", "Vegetal keratin", "Smooths hair", "400ml"],
    imageSources: [
      "https://images.openbeautyfacts.org/images/products/750/955/284/3026/front_es.7.400.jpg",
      "https://www.lorealparis-centroamerica.com/elvive/dream-long-liss/shampoo",
    ],
  },
  {
    barcode: "3610340636691",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف دريم لونغ - شامبو ترميمي للشعر الطويل والتالف 400 مل",
    nameEn: "L'Oreal Paris Elvive Dream Long Restoring Shampoo 400ml",
    descAr: "شامبو إلفيف دريم لونغ ينظّف الشعر الطويل والتالف ويساعد على تقوية الطول والأطراف.",
    descEn: "L'Oreal Paris Elvive Dream Long Restoring Shampoo cleanses long damaged hair and helps reinforce lengths and ends.",
    benefitsAr: ["للشعر الطويل", "زيت الخروع وفيتامينات", "يساعد على تقوية الأطراف", "ينظّف بلطف", "400 مل"],
    benefitsEn: ["For long hair", "Castor oil and vitamins", "Helps reinforce ends", "Gentle cleanse", "400ml"],
    imageSources: [
      "https://images.openbeautyfacts.org/images/products/361/034/063/6691/front_en.8.400.jpg",
      "https://www.loreal-paris-me.com/en/elvive/dream-long/dream-long-shampoo-400ml",
    ],
  },
  {
    barcode: "3610340653650",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف دريم لونغ ستريت 72H - شامبو تمليس للشعر الطويل والهايش 400 مل",
    nameEn: "L'Oreal Paris Elvive Dream Long Straight 72H Shampoo 400ml",
    descAr: "شامبو إلفيف دريم لونغ ستريت يخفّف الهيشان ويساعد على تمليس الشعر الطويل حتى 72 ساعة.",
    descEn: "L'Oreal Paris Elvive Dream Long Straight 72H Shampoo helps tame frizz and smooth long hair for up to 72 hours.",
    benefitsAr: ["للشعر الطويل والهايش", "مايكرو كيراتين", "يساعد على التمليس", "لمعان ونعومة", "400 مل"],
    benefitsEn: ["For long frizzy hair", "Micro-keratin care", "Helps smooth hair", "Softness and shine", "400ml"],
    imageSources: ["https://www.loreal-paris-me.com/en/elvive/dream-long/dream-long-shampoo-72h-400ml"],
  },
  {
    barcode: "7509552848021",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف إكستراورديناري أويل ريزوس ديفينيدوس - شامبو للشعر المجعد 370 مل",
    nameEn: "L'Oreal Paris Elvive Extraordinary Oil Defined Curls Shampoo 370ml",
    descAr: "شامبو إلفيف ريزوس ديفينيدوس يغذّي التموجات ويمنح الشعر المجعد تعريفاً أوضح ولمعاناً.",
    descEn: "L'Oreal Paris Elvive Extraordinary Oil Defined Curls Shampoo nourishes curls and helps define them with shine.",
    benefitsAr: ["للشعر المجعد", "تعريف للتموجات", "زيوت مغذية", "تقليل الهيشان", "370 مل"],
    benefitsEn: ["For curly hair", "Curl definition", "Nourishing oils", "Helps reduce frizz", "370ml"],
    imageSources: ["https://latinafy.com/products/elvive-extraordinary-oil-defined-curls-shampoo-370-ml/"],
  },
  {
    barcode: "7509552848007",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف توتال ريبير 5 إكستريم - شامبو إعادة بناء للشعر المتضرر 370 مل",
    nameEn: "L'Oreal Paris Elvive Total Repair 5 Extreme Shampoo 370ml",
    descAr: "شامبو إلفيف توتال ريبير 5 إكستريم يساعد على إصلاح الشعر المتضرر وتقوية الألياف.",
    descEn: "L'Oreal Paris Elvive Total Repair 5 Extreme Shampoo helps repair damaged hair and reinforce the fibre.",
    benefitsAr: ["للشعر المتضرر", "إصلاح مكثّف", "تقليل التكسّر", "تنظيف لطيف", "370 مل"],
    benefitsEn: ["For damaged hair", "Intensive repair", "Helps reduce breakage", "Gentle cleanse", "370ml"],
    imageSources: [
      "https://www.nmperfumerias.cl/products/elvive-rt5-extreme-sh-370ml",
      "https://www.lorealparis-centroamerica.com/elvive/reparacion-total-5/shampoo-reparador",
    ],
  },
  {
    barcode: "7509552847550",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف أركيلا بوريفيكانتي - شامبو منقٍ للجذور الدهنية والأطراف الجافة 370 مل",
    nameEn: "L'Oreal Paris Elvive Extraordinary Clay Purifying Shampoo 370ml",
    descAr: "شامبو إلفيف أركيلا بوريفيكانتي ينقّي فروة الرأس ويمتص الدهون الزائدة مع الحفاظ على نعومة الأطراف.",
    descEn: "L'Oreal Paris Elvive Extraordinary Clay Purifying Shampoo purifies the scalp and absorbs excess oil while keeping ends soft.",
    benefitsAr: ["للجذور الدهنية", "ثلاثة أنواع من الطين", "إحساس نظيف أطول", "لا يثقل الشعر", "370 مل"],
    benefitsEn: ["For oily roots", "Three-clay care", "Longer fresh feel", "Won't weigh hair down", "370ml"],
    imageSources: ["https://www.lorealparis.uy/elvive/arcilla-purificante/elvive-arcilla-extr-sh-370ml"],
  },
  {
    barcode: "7509552847505",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف إكستراورديناري أويل - شامبو مغذٍ للشعر الجاف 370 مل",
    nameEn: "L'Oreal Paris Elvive Extraordinary Oil Nourishing Shampoo 370ml",
    descAr: "شامبو إلفيف إكستراورديناري أويل يمنح الشعر الجاف تغذية ولمعاناً بتركيبة زيوت الزهور.",
    descEn: "L'Oreal Paris Elvive Extraordinary Oil Nourishing Shampoo gives dry hair nourishment and shine with flower oils.",
    benefitsAr: ["للشعر الجاف", "زيوت زهور مغذية", "نعومة ولمعان", "تنظيف لطيف", "370 مل"],
    benefitsEn: ["For dry hair", "Flower-oil nourishment", "Softness and shine", "Gentle cleanse", "370ml"],
    imageSources: ["https://www.loreal-paris.es/elvive/aceite-extraordinario/champu-nutritivo-para-pelo-seco-370ml"],
  },
  {
    barcode: "7509552847598",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف دريم لونغ ليس - شامبو مضاد للهيشان للشعر الطويل 370 مل",
    nameEn: "L'Oreal Paris Elvive Dream Long Liss Super Liss Shampoo 370ml",
    descAr: "شامبو إلفيف دريم لونغ ليس ينعّم الشعر الطويل ويخفّف الهيشان ليبدو أكثر انسيابية.",
    descEn: "L'Oreal Paris Elvive Dream Long Liss Super Liss Shampoo smooths long hair and helps control frizz.",
    benefitsAr: ["للشعر الطويل", "مضاد للهيشان", "كيراتين نباتي", "زبدة الكاكاو", "370 مل"],
    benefitsEn: ["For long hair", "Anti-frizz care", "Vegetal keratin", "Cocoa butter", "370ml"],
    imageSources: [
      "https://www.lorealparis-centroamerica.com/-/media/project/loreal/brand-sites/oap/americas/latam/products/hair/hair-care/elvive/new-images-041822/dream-long-liss-shampoo/loreal-elvive-dream-long-liss-shampoo-packshot.png",
      "https://www.lorealparis-centroamerica.com/elvive/dream-long-liss/shampoo",
    ],
  },
  {
    barcode: "7509552847529",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف إكستراورديناري أويل كوكو - شامبو مغذٍ بزيت جوز الهند 370 مل",
    nameEn: "L'Oreal Paris Elvive Extraordinary Coconut Nourishing Shampoo 370ml",
    descAr: "شامبو إلفيف إكستراورديناري أويل كوكو يغذّي الشعر الجاف ويتركه أنعم وأكثر لمعاناً.",
    descEn: "L'Oreal Paris Elvive Extraordinary Coconut Nourishing Shampoo nourishes dry hair for softness and shine.",
    benefitsAr: ["زيت جوز الهند", "للشعر الجاف", "ترطيب ونعومة", "تنظيف لطيف", "370 مل"],
    benefitsEn: ["Coconut oil care", "For dry hair", "Hydration and softness", "Gentle cleanse", "370ml"],
    imageSources: ["https://www.lorealparis-centroamerica.com/elvive/oleo-extraordinario-coco/shampoo-elvive-oleo-extraordinario-coco"],
  },
  {
    barcode: "3610340667237",
    typeKey: "conditioner",
    nameAr: "لوريال باريس إلفيف فول ريزست - بلسم تقوية ضد التكسّر 360 مل",
    nameEn: "L'Oreal Paris Elvive Full Resist Break-Proof Conditioner 360ml",
    descAr: "بلسم إلفيف فول ريزست يفك التشابك ويقوّي الشعر الضعيف المعرّض للتكسّر.",
    descEn: "L'Oreal Paris Elvive Full Resist Break-Proof Conditioner detangles and strengthens weak, breakage-prone hair.",
    benefitsAr: ["للشعر الضعيف", "يفك التشابك", "تقوية يومية", "نعومة أسهل", "360 مل"],
    benefitsEn: ["For weak hair", "Detangles hair", "Daily strengthening care", "Easy softness", "360ml"],
    imageSources: ["https://niceonesa.com/en/loreal-paris-elvive-fall-resist-break-proof-conditioner-360ml-n26999"],
  },
  {
    barcode: "3610340667282",
    typeKey: "conditioner",
    nameAr: "لوريال باريس إلفيف كولور بروتكت - بلسم حماية اللون للشعر المصبوغ 360 مل",
    nameEn: "L'Oreal Paris Elvive Colour Protect Conditioner 360ml",
    descAr: "بلسم إلفيف كولور بروتكت يحافظ على حيوية اللون ويساعد على إبقاء الشعر ناعماً ولامعاً.",
    descEn: "L'Oreal Paris Elvive Colour Protect Conditioner helps preserve colour vibrancy while keeping hair soft and shiny.",
    benefitsAr: ["للشعر المصبوغ", "يحافظ على اللون", "نعومة ولمعان", "يفك التشابك", "360 مل"],
    benefitsEn: ["For coloured hair", "Helps protect colour", "Softness and shine", "Detangles hair", "360ml"],
    imageSources: ["https://niceonesa.com/en/loreal-paris-elvive-colour-protect-conditioner-360ml-n27000"],
  },
  {
    barcode: "3610340673849",
    typeKey: "conditioner",
    nameAr: "لوريال باريس إلفيف غلايكوليك غلوس - بلسم للمعان والنعومة 360 مل",
    nameEn: "L'Oreal Paris Elvive Glycolic Gloss Conditioner 360ml",
    descAr: "بلسم إلفيف غلايكوليك غلوس ينعّم سطح الشعر ويزيد من لمعانه بشكل واضح.",
    descEn: "L'Oreal Paris Elvive Glycolic Gloss Conditioner smooths the hair surface and visibly enhances shine.",
    benefitsAr: ["لمعان مرآوي", "ينعّم الألياف", "يفك التشابك", "للشعر الباهت", "360 مل"],
    benefitsEn: ["Mirror-like shine", "Smooths fibres", "Detangles hair", "For dull hair", "360ml"],
    imageSources: ["https://niceonesa.com/en/loreal-paris-elvive-glycolic-gloss-conditioner-360ml-n37660"],
  },
  {
    barcode: "3610340667275",
    typeKey: "conditioner",
    nameAr: "لوريال باريس إلفيف دريم لونغ ستريت 72H - بلسم تمليس للشعر الطويل والهايش 360 مل",
    nameEn: "L'Oreal Paris Elvive Dream Long Straight 72H Conditioner 360ml",
    descAr: "بلسم إلفيف دريم لونغ ستريت يسهّل التصفيف ويقلّل الهيشان للشعر الطويل.",
    descEn: "L'Oreal Paris Elvive Dream Long Straight 72H Conditioner eases styling and helps control frizz in long hair.",
    benefitsAr: ["للشعر الطويل والهايش", "يسهّل التمشيط", "نعومة وانسيابية", "زيت حبة البركة", "360 مل"],
    benefitsEn: ["For long frizzy hair", "Easy detangling", "Smooth finish", "Black seed oil care", "360ml"],
    imageSources: [
      "https://feel22.com/products/loreal-paris-elvive-dream-long-straight-72h-conditioner",
      "https://www.cairomegastore.com/products/loreal-paris-elvive-keratin-straight-conditioner-for-long-frizzy-hair-360ml",
    ],
  },
  {
    barcode: "3600524016234",
    typeKey: "conditioner",
    nameAr: "لوريال باريس إلفيف إكستراورديناري أويل - بلسم مغذٍ للشعر الجاف 300 مل",
    nameEn: "L'Oreal Paris Elvive Extraordinary Oil Conditioner 300ml",
    descAr: "بلسم إلفيف إكستراورديناري أويل ينعّم الشعر الجاف ويمنحه تغذية ولمعاناً.",
    descEn: "L'Oreal Paris Elvive Extraordinary Oil Conditioner softens dry hair and delivers nourishment and shine.",
    benefitsAr: ["للشعر الجاف", "زيوت مغذية", "يفك التشابك", "نعومة ولمعان", "300 مل"],
    benefitsEn: ["For dry hair", "Nourishing oils", "Detangles hair", "Softness and shine", "300ml"],
    imageSources: [
      "https://trendscyprus.com/Products/hair/haircare/conditioners/elvive-extraordinary-oil-conditioner-300ml/",
      "https://www.superdrug.com/hair/hair-conditioners/loreal-paris-elvive-extraordinary-oil-conditioner-300ml/p/848725",
    ],
  },
  {
    barcode: "3600523955015",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف دريم لونغ - شامبو ترميمي للشعر الطويل والتالف 700 مل",
    nameEn: "L'Oreal Paris Elvive Dream Long Restoring Shampoo 700ml",
    descAr: "شامبو إلفيف دريم لونغ بحجم عائلي يساعد على ترميم الشعر الطويل وتقوية الأطراف.",
    descEn: "L'Oreal Paris Elvive Dream Long Restoring Shampoo in family size helps restore long hair and reinforce ends.",
    benefitsAr: ["حجم عائلي", "للشعر الطويل", "زيت الخروع", "تقوية للأطراف", "700 مل"],
    benefitsEn: ["Family size", "For long hair", "Castor oil care", "Helps reinforce ends", "700ml"],
    imageSources: ["https://beautyaz.gr/en/products/loral-elvive-dream-long-shampoo-700ml"],
  },
  {
    barcode: "3610340687662",
    typeKey: "conditioner",
    nameAr: "لوريال باريس إلفيف هيالورون مويستشر - بلسم مرطب للشعر الجاف 400 مل",
    nameEn: "L'Oreal Paris Elvive Hyaluron Moisture Hydrating Conditioner 400ml",
    descAr: "بلسم إلفيف هيالورون مويستشر يرطّب الشعر الجاف ويفك التشابك ليتركه أكثر امتلاءً ونعومة.",
    descEn: "L'Oreal Paris Elvive Hyaluron Moisture Hydrating Conditioner moisturises dry hair and detangles it for a fuller, softer feel.",
    benefitsAr: ["للشعر الجاف", "ترطيب طويل", "يفك التشابك", "ملمس أكثر امتلاءً", "400 مل"],
    benefitsEn: ["For dry hair", "Long-lasting hydration", "Detangles hair", "Fuller feel", "400ml"],
    imageSources: [
      "https://www.loreal-paris-me.com/en/elvive/hyaluron-moisture/hyaluron-moisture-conditioner-200ml",
      "https://niceonesa.com/en/loreal-paris-elvive-hyaluron-moisture-sealing-conditioner-for-dry-hair-360ml-n27005",
    ],
  },
  {
    barcode: "7509552817409",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف توتال ريبير 5 إكستريم - شامبو إصلاحي للشعر المتضرر 680 مل",
    nameEn: "L'Oreal Paris Elvive Total Repair 5 Extreme Shampoo 680ml",
    descAr: "شامبو إلفيف توتال ريبير 5 إكستريم بحجم 680 مل لإصلاح الشعر المتضرر وتقليل التكسّر.",
    descEn: "L'Oreal Paris Elvive Total Repair 5 Extreme Shampoo 680ml helps repair damaged hair and reduce breakage.",
    benefitsAr: ["إصلاح مكثف", "للشعر المتضرر", "حجم 680 مل", "تقوية الألياف", "تنظيف لطيف"],
    benefitsEn: ["Intensive repair", "For damaged hair", "680ml size", "Strengthens fibres", "Gentle cleanse"],
    imageSources: [
      "https://detqhtv6m6lzl.cloudfront.net/HCLContenido/producto/FullImage/7509552817409-1.jpg",
      "https://www.delsol.com.mx/wcs/shop/es/delsol/shampo-elvive-reparacion-total-680ml-7509552817409",
    ],
  },
  {
    barcode: "3610340670978",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف هيالورون بيور - شامبو منقٍ للجذور الدهنية 400 مل",
    nameEn: "L'Oreal Paris Elvive Hyaluron Pure Purifying Shampoo 400ml",
    descAr: "شامبو إلفيف هيالورون بيور ينظّف الجذور الدهنية ويرطّب الأطراف الجافة دون إثقال الشعر.",
    descEn: "L'Oreal Paris Elvive Hyaluron Pure Purifying Shampoo purifies oily roots and hydrates dry lengths without weighing hair down.",
    benefitsAr: ["للجذور الدهنية", "حمض الساليسيليك", "ترطيب متوازن", "إحساس منعش", "400 مل"],
    benefitsEn: ["For oily roots", "Salicylic acid care", "Balanced hydration", "Fresh feel", "400ml"],
    imageSources: [
      "https://niceonesa.com/en/loreal-paris-elvive-hyaluron-pure-purifying-shampoo-for-oily-hair-400-ml-n27007",
      "https://images.openbeautyfacts.org/images/products/361/034/067/0978/front_en.20.400.jpg",
    ],
  },
  {
    barcode: "3610340687488",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف هيالورون مويستشر - شامبو مرطب للشعر الجاف 400 مل",
    nameEn: "L'Oreal Paris Elvive Hyaluron Moisture Hydrating Shampoo 400ml",
    descAr: "شامبو إلفيف هيالورون مويستشر يرطّب الشعر الجاف ويمنحه ملمساً أكثر نعومة ومرونة.",
    descEn: "L'Oreal Paris Elvive Hyaluron Moisture Hydrating Shampoo moisturises dry hair for softer, bouncier strands.",
    benefitsAr: ["للشعر الجاف", "حمض الهيالورون", "ترطيب وامتلاء", "تنظيف لطيف", "400 مل"],
    benefitsEn: ["For dry hair", "Hyaluronic care", "Hydration and plumpness", "Gentle cleanse", "400ml"],
    imageSources: [
      "https://niceonesa.com/en/l-oreal-paris-elvive-hyaluron-moisture-filling-shampoo-400ml-n23351",
      "https://www.loreal-paris-me.com/en/elvive/hyaluron-moisture/hyaluron-moisture-shampoo-200ml",
    ],
  },
  {
    barcode: "3610340687679",
    typeKey: "serum",
    nameAr: "لوريال باريس إلفيف هيالورون مويستشر - سيروم مرطب بدون شطف 200 مل",
    nameEn: "L'Oreal Paris Elvive Hyaluron Moisture Replumping Leave-In Serum 200ml",
    descAr: "سيروم إلفيف هيالورون مويستشر بدون شطف يعيد الترطيب والامتلاء للشعر الجاف والمتعطش.",
    descEn: "L'Oreal Paris Elvive Hyaluron Moisture Replumping Leave-In Serum is a no-rinse hydrator for dry, dehydrated hair.",
    benefitsAr: ["بدون شطف", "ترطيب وامتلاء", "للشعر الجاف", "ملمس ناعم وخفيف", "200 مل"],
    benefitsEn: ["No rinse", "Hydration and plumpness", "For dry hair", "Soft lightweight feel", "200ml"],
    imageSources: [
      "https://www.loreal-paris-me.com/en/elvive/hyaluron-moisture/hyaluron-moisture-serum",
      "https://www.lorealparisusa.com/hair-care-hair-style/hair-treatments/hyaluron-plump-moisture-plump-serum-paraben-free",
    ],
  },
  {
    barcode: "3600524016265",
    typeKey: "conditioner",
    nameAr: "لوريال باريس إلفيف كولور فايف - بلسم للشعر المصبوغ 300 مل",
    nameEn: "L'Oreal Paris Elvive Color Vive Conditioner 300ml",
    descAr: "بلسم إلفيف كولور فايف يعتني بالشعر المصبوغ ويعزّز نعومته ولمعانه.",
    descEn: "L'Oreal Paris Elvive Color Vive Conditioner cares for colour-treated hair while enhancing softness and shine.",
    benefitsAr: ["للشعر المصبوغ", "يحافظ على الحيوية", "يفك التشابك", "لمعان ونعومة", "300 مل"],
    benefitsEn: ["For coloured hair", "Helps preserve vibrancy", "Detangles hair", "Softness and shine", "300ml"],
    imageSources: [
      "https://trendscyprus.com/Products/hair/haircare/conditioners/elvive-color-vive-conditioner-300ml/",
      "https://www.hebecosmetics.gr/en/products/7305",
    ],
  },
  {
    barcode: "3600524074739",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف بوند ريبير - شامبو إصلاحي للشعر المتضرر 200 مل",
    nameEn: "L'Oreal Paris Elvive Bond Repair Shampoo 200ml",
    descAr: "شامبو إلفيف بوند ريبير ينظّف الشعر المتضرر ويساعد على إعادة تقوية الروابط الداخلية.",
    descEn: "L'Oreal Paris Elvive Bond Repair Shampoo cleanses damaged hair while helping reinforce inner hair bonds.",
    benefitsAr: ["للشعر المتضرر", "إصلاح الروابط", "تنظيف لطيف", "تقوية ولمعان", "200 مل"],
    benefitsEn: ["For damaged hair", "Bond repair care", "Gentle cleanse", "Strength and shine", "200ml"],
    imageSources: [
      "https://trendscyprus.com/Products/hair/haircare/shampoo/elvive-bond-repair-shampoo-200ml/",
      "https://www.loreal-paris-me.com/en/elvive/glycolic-gloss/glycolic-gloss-shampoo-200ml",
    ],
  },
  {
    barcode: "3600524135720",
    typeKey: "conditioner",
    nameAr: "لوريال باريس إلفيف غلايكوليك غلوس - بلسم للمعان 150 مل",
    nameEn: "L'Oreal Paris Elvive Glycolic Gloss Conditioner 150ml",
    descAr: "بلسم إلفيف غلايكوليك غلوس بحجم 150 مل ينعّم الشعر الباهت ويمنحه لمعاناً أوضح.",
    descEn: "L'Oreal Paris Elvive Glycolic Gloss Conditioner 150ml smooths dull hair and boosts shine.",
    benefitsAr: ["للشعر الباهت", "لمعان مرآوي", "ينعّم الألياف", "حجم سفر", "150 مل"],
    benefitsEn: ["For dull hair", "Mirror-like shine", "Smooths fibres", "Travel size", "150ml"],
    imageSources: ["https://trendscyprus.com/Products/hair/haircare/conditioners/glycolic-gloss-conditioner-150ml/"],
  },
  {
    barcode: "3600524074876",
    typeKey: "conditioner",
    nameAr: "لوريال باريس إلفيف بوند ريبير - بلسم إصلاحي للشعر المتضرر 150 مل",
    nameEn: "L'Oreal Paris Elvive Bond Repair Conditioner 150ml",
    descAr: "بلسم إلفيف بوند ريبير يساعد على تنعيم الشعر المتضرر وتقوية الألياف بعد الشامبو.",
    descEn: "L'Oreal Paris Elvive Bond Repair Conditioner helps smooth damaged hair and reinforce fibres after shampooing.",
    benefitsAr: ["للشعر المتضرر", "إصلاح الروابط", "نعومة وفك تشابك", "عناية مكمّلة", "150 مل"],
    benefitsEn: ["For damaged hair", "Bond repair care", "Softness and detangling", "Follow-up care", "150ml"],
    imageSources: ["https://www.glam4u.gr/en/l-oreal-elvive-bond-repair-conditioner-150ml.html"],
  },
  {
    barcode: "3600524075651",
    typeKey: "serum",
    nameAr: "لوريال باريس إلفيف بوند ريبير - سيروم بدون شطف 150 مل",
    nameEn: "L'Oreal Paris Elvive Bond Repair Leave-In Serum 150ml",
    descAr: "سيروم إلفيف بوند ريبير بدون شطف يساعد على حماية الشعر المتضرر ويقلّل تقصّف الأطراف.",
    descEn: "L'Oreal Paris Elvive Bond Repair Leave-In Serum helps protect damaged hair and reduce split ends.",
    benefitsAr: ["بدون شطف", "للشعر المتضرر", "حماية من الحرارة", "تقليل الأطراف المتقصفة", "150 مل"],
    benefitsEn: ["No rinse", "For damaged hair", "Heat protection", "Helps reduce split ends", "150ml"],
    imageSources: ["https://trendscyprus.com/Products/hair/haircare/treatments-haircare/elvive-bond-repair-leave-in-serum-150ml/"],
  },
  {
    barcode: "3600524087593",
    typeKey: "hair-mask",
    nameAr: "لوريال باريس إلفيف بوند ريبير - علاج ريسكيو قبل الشامبو 200 مل",
    nameEn: "L'Oreal Paris Elvive Bond Repair Rescue Pre-Shampoo 200ml",
    descAr: "علاج إلفيف بوند ريبير ريسكيو قبل الشامبو يركّز على الروابط المتضررة قبل الغسل.",
    descEn: "L'Oreal Paris Elvive Bond Repair Rescue Pre-Shampoo targets damaged hair bonds before washing.",
    benefitsAr: ["قبل الشامبو", "عناية مركزة", "للشعر المتضرر", "ترميم الروابط", "200 مل"],
    benefitsEn: ["Before shampoo", "Concentrated care", "For damaged hair", "Bond-restoring care", "200ml"],
    imageSources: ["https://www.lorealparis.com.au/elvive/bond-repair/bond-repair-pre-shampoo-rescue-treatment-200ml"],
  },
  {
    barcode: "3600524127961",
    typeKey: "shampoo",
    nameAr: "لوريال باريس إلفيف غلايكوليك غلوس - شامبو للمعان 200 مل",
    nameEn: "L'Oreal Paris Elvive Glycolic Gloss Shampoo 200ml",
    descAr: "شامبو إلفيف غلايكوليك غلوس بحجم 200 مل ينظّف الشعر الباهت ويمنحه لمعاناً أنقى.",
    descEn: "L'Oreal Paris Elvive Glycolic Gloss Shampoo 200ml cleanses dull hair and adds clearer shine.",
    benefitsAr: ["للشعر الباهت", "لمعان مرآوي", "تنظيف لطيف", "حجم 200 مل", "ملمس أنعم"],
    benefitsEn: ["For dull hair", "Mirror-like shine", "Gentle cleanse", "200ml size", "Smoother feel"],
    imageSources: ["https://www.loreal-paris-me.com/en/elvive/glycolic-gloss/glycolic-gloss-shampoo-200ml"],
  },
  {
    barcode: "3600521852972",
    typeKey: "leave-in",
    nameAr: "لوريال باريس ستوديو لاين هوت ستريت - كريم تمليس حراري 200 مل",
    nameEn: "L'Oreal Paris Studio Line Hot Straight Smoothing Cream 200ml",
    descAr: "كريم ستوديو لاين هوت ستريت يساعد على تمليس الشعر ومقاومة الهيشان مع حماية حرارية.",
    descEn: "L'Oreal Paris Studio Line Hot Straight Smoothing Cream helps smooth hair, fight frizz and protect from heat.",
    benefitsAr: ["حماية حرارية", "تمليس ومقاومة هيشان", "للشعر المتموج أو المنفوش", "بدون شطف", "200 مل"],
    benefitsEn: ["Heat protection", "Smooths and fights frizz", "For unruly hair", "No rinse", "200ml"],
    imageSources: [
      "https://luxplus.imgix.net/content/product/image/32353-22660-1669796400.jpg?auto=format,compress&w=800&h=800&fill-color=FFFFFF&fill=solid&fit=fillmax",
      "https://www.luxplus.co.uk/product/loreal-studio-line-hot-smooth-hot-straight-cream-200-ml",
    ],
  },
  {
    barcode: "3600524228040",
    typeKey: "serum",
    nameAr: "لوريال باريس إلفيف غلايكوليك غلوس - بخاخ لمعان بدون شطف 150 مل",
    nameEn: "L'Oreal Paris Elvive Glycolic Gloss Leave-In Spray 150ml",
    descAr: "بخاخ إلفيف غلايكوليك غلوس بدون شطف يمنح الشعر لمعاناً وانسيابية ويخفّف الهيشان.",
    descEn: "L'Oreal Paris Elvive Glycolic Gloss Leave-In Spray adds shine, smoothness and frizz control without rinsing.",
    benefitsAr: ["بدون شطف", "معان ولمسة ناعمة", "يخفّف الهيشان", "سهل الاستخدام", "150 مل"],
    benefitsEn: ["No rinse", "Shine and smoothness", "Helps reduce frizz", "Easy to use", "150ml"],
    imageSources: [
      "https://care-outlet.com/products/loreal-elvive-glycolic-gloss-leave-in-spray-150ml",
      "https://clicks.co.za/loreal_elvive-glycolic-gloss-treatment-150ml/p/406327",
    ],
  },
  {
    barcode: "3610340673887",
    typeKey: "leave-in",
    nameAr: "لوريال باريس إلفيف غلايكوليك غلوس - كريم تمشيط بدون شطف 200 مل",
    nameEn: "L'Oreal Paris Elvive Glycolic Gloss Leave-In Combing Cream 200ml",
    descAr: "كريم تمشيط إلفيف غلايكوليك غلوس بدون شطف يسهّل فك التشابك ويعزّز لمعان الشعر.",
    descEn: "L'Oreal Paris Elvive Glycolic Gloss Leave-In Combing Cream eases detangling and enhances shine without rinsing.",
    benefitsAr: ["بدون شطف", "يفك التشابك", "معان أوضح", "يسهّل التصفيف", "200 مل"],
    benefitsEn: ["No rinse", "Detangles hair", "Enhanced shine", "Easier styling", "200ml"],
    imageSources: [
      "https://niceonesa.com/en/loreal-paris-elvive-glycolic-gloss-leave-in-hair-combing-cream-200ml-n37661",
      "https://images.openbeautyfacts.org/images/products/361/034/067/3887/front_en.4.400.jpg",
    ],
  },
  {
    barcode: "3600524004538",
    typeKey: "hair-mask",
    nameAr: "لوريال باريس إلفيف كولور بروتكت - وندر ووتر 8 ثوانٍ 200 مل",
    nameEn: "L'Oreal Paris Elvive Colour Protect 8 Second Wonder Water 200ml",
    descAr: "علاج إلفيف وندر ووتر 8 ثوانٍ للشعر المصبوغ يمنح لمعاناً سريعاً وملمساً أكثر نعومة.",
    descEn: "L'Oreal Paris Elvive Colour Protect 8 Second Wonder Water gives coloured hair a fast shine boost and softer feel.",
    benefitsAr: ["للشعر المصبوغ", "8 ثوانٍ فقط", "يُشطف", "لمعان فوري", "200 مل"],
    benefitsEn: ["For coloured hair", "Just 8 seconds", "Rinse-out", "Instant shine", "200ml"],
    imageSources: [
      "https://abclive1.s3.amazonaws.com/a076402a-7650-4da7-b500-516e9897222e/productimage/3600524004538___1___M.jpg",
      "https://www.mellericks.ie/p/elvive-colour-protect-8-second-wonder-water/3600524004538",
    ],
  },
  {
    barcode: "3600524034931",
    typeKey: "leave-in",
    nameAr: "لوريال باريس إلفيف كولور بروتكت بيربل 10 في 1 - بخاخ بدون شطف 150 مل",
    nameEn: "L'Oreal Paris Elvive Colour Protect Purple 10 in 1 Leave-In Spray 150ml",
    descAr: "بخاخ إلفيف بيربل 10 في 1 مخصّص للشعر الأشقر أو المفتح ليساعد على الحماية والنعومة وتقليل الاصفرار.",
    descEn: "L'Oreal Paris Elvive Colour Protect Purple 10 in 1 Leave-In Spray helps protect blonde or lightened hair while reducing brassiness.",
    benefitsAr: ["للشعر الأشقر أو المفتح", "10 فوائد في بخاخ واحد", "بدون شطف", "حماية حرارية", "150 مل"],
    benefitsEn: ["For blonde or lightened hair", "10 benefits in one spray", "No rinse", "Heat protection", "150ml"],
    imageSources: ["https://www.lorealparis.com.au/elvive/colour-protect/purple-10-in-1-leave-in-spray"],
  },
  {
    barcode: "3600523944354",
    typeKey: "leave-in",
    nameAr: "لوريال باريس إلفيف فول ريزست - كريم ليف إن براش بروف 200 مل",
    nameEn: "L'Oreal Paris Elvive Full Resist Brush Proof Leave-In Cream 200ml",
    descAr: "كريم إلفيف فول ريزست براش بروف بدون شطف يساعد على تقوية الشعر الضعيف أثناء التصفيف.",
    descEn: "L'Oreal Paris Elvive Full Resist Brush Proof Leave-In Cream helps strengthen weak hair during brushing and styling.",
    benefitsAr: ["بدون شطف", "للشعر الضعيف", "يساعد على تقليل التكسّر", "حماية أثناء التصفيف", "200 مل"],
    benefitsEn: ["No rinse", "For weak hair", "Helps reduce breakage", "Styling protection", "200ml"],
    imageSources: [
      "https://niceonesa.com/en/loreal-paris-elvive-full-resist-brush-proof-cream-200ml-n22289",
      "https://veelabeauty.com/en/loreal-elvive-full-resist-brush-proof-leave-in-cream-200ml",
    ],
  },
];

const ONLY_BARCODES = process.env.ONLY_BARCODES?.split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const ACTIVE_FIXES = FIXES.filter((fix) => !ONLY_BARCODES?.length || ONLY_BARCODES.includes(fix.barcode));

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

function isImageUrl(value: string): boolean {
  return /\.(png|jpe?g|webp)(\?|$)/i.test(value);
}

function absolutize(url: string, base: string): string {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

function pushCandidate(out: string[], raw: unknown, base: string) {
  if (typeof raw !== "string") return;
  const value = raw.trim();
  if (!value || value.startsWith("data:")) return;
  const absolute = absolutize(value, base);
  if (!/^https?:\/\//i.test(absolute)) return;
  if (absolute.includes(".svg")) return;
  out.push(absolute);
}

function collectImagesFromJson(value: unknown, out: string[], base: string) {
  if (!value) return;
  if (typeof value === "string") {
    pushCandidate(out, value, base);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectImagesFromJson(item, out, base);
    return;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("image" in obj) collectImagesFromJson(obj.image, out, base);
    for (const nested of Object.values(obj)) collectImagesFromJson(nested, out, base);
  }
}

function extractImageCandidates(html: string, pageUrl: string): string[] {
  const candidates: string[] = [];
  const metaPatterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi,
  ];
  for (const pattern of metaPatterns) {
    for (const match of html.matchAll(pattern)) pushCandidate(candidates, match[1], pageUrl);
  }

  for (const script of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(script[1].trim());
      collectImagesFromJson(parsed, candidates, pageUrl);
    } catch {
      // ignore invalid JSON-LD blocks
    }
  }

  for (const match of html.matchAll(/https?:\/\/[^"'()\s<>]+?\.(?:png|jpe?g|webp)(?:\?[^"'()\s<>]*)?/gi)) {
    pushCandidate(candidates, match[0], pageUrl);
  }

  return [...new Set(candidates)];
}

function productTokens(fix: Fix): string[] {
  return Array.from(
    new Set(
      `${fix.nameEn} ${fix.barcode}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .split(/\s+/)
        .filter(
          (token) =>
            token.length >= 4 &&
            ![
              "loreal",
              "paris",
              "elvive",
              "ml",
              "with",
              "hair",
              "care",
              "shampoo",
              "conditioner",
              "treatment",
              "leave",
              "proof",
              "colour",
            ].includes(token),
        ),
    ),
  );
}

function scoreCandidate(url: string, tokens: string[]): number {
  const lower = url.toLowerCase();
  let score = 0;
  if (lower.includes("packshot")) score += 10;
  if (lower.includes("product")) score += 7;
  if (lower.includes("fullimage")) score += 7;
  if (lower.includes("catalog")) score += 5;
  if (lower.includes("image")) score += 4;
  if (lower.includes("500x500") || lower.includes("700x700") || lower.includes("800")) score += 3;
  if (lower.includes("elvive") || lower.includes("loreal")) score += 2;
  for (const token of tokens) {
    if (lower.includes(token)) score += 5;
  }
  if (/(maybelline|garnier|cerave|vichy|essie|nyx|pantene|head-and-shoulders)/.test(lower)) score -= 25;
  if (lower.includes("logo") || lower.includes("icon") || lower.includes("spinner") || lower.includes("null")) score -= 20;
  if (lower.endsWith(".svg")) score -= 20;
  return score;
}

async function resolveImageUrl(fix: Fix): Promise<string> {
  const tokens = productTokens(fix);
  const directSources = fix.imageSources.filter((source) => isImageUrl(source));
  if (directSources.length) {
    return directSources.sort((a, b) => scoreCandidate(b, tokens) - scoreCandidate(a, tokens))[0];
  }
  for (const source of fix.imageSources) {
    try {
      const res = await fetch(source, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)",
        },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const candidates = extractImageCandidates(html, source).sort((a, b) => scoreCandidate(b, tokens) - scoreCandidate(a, tokens));
      const best = candidates[0];
      if (best) return best;
    } catch {
      // try next source
    }
  }
  throw new Error(`No image resolved from sources: ${fix.imageSources.join(" | ")}`);
}

async function uploadImage(url: string, alt: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*", "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)" },
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 64) throw new Error("empty image");

    const contentType = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
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
    if (attempt >= 4) throw err;
    await new Promise((r) => setTimeout(r, attempt * 1500));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function main() {
  console.log(`Fixing ${ACTIVE_FIXES.length} reviewed L'Oreal products...\n`);
  await login();

  let ok = 0;
  for (const fix of ACTIVE_FIXES) {
    const check = await api<{ exists: boolean; product?: { id: string } }>(
      `/products/barcode-check?barcode=${fix.barcode}`,
    );
    if (!check.exists || !check.product?.id) {
      console.log(`  SKIP missing: ${fix.barcode}`);
      continue;
    }

    console.log(`--- ${fix.barcode} ---`);
    const { descriptionAr, descriptionEn } = bullets(fix.descAr, fix.descEn, fix.benefitsAr, fix.benefitsEn);
      const imageUrl = await resolveImageUrl(fix);
    const imageId = await uploadImage(imageUrl, `${fix.barcode}-${fix.nameEn}`);

    await api(`/products/${check.product.id}`, "PATCH", {
      categoryId: CARE,
      subcategoryId: HAIR_CARE,
      tertiaryCategoryId: tertiaryFor(fix.typeKey),
      subcategoryIds: [HAIR_CARE],
      tertiaryCategoryIds: [tertiaryFor(fix.typeKey)],
      nameAr: fix.nameAr,
      nameEn: fix.nameEn,
      descriptionAr,
      descriptionEn,
      imageIds: [imageId],
    });
    console.log(`  ✓ ${fix.nameAr}`);
    console.log(`    image: ${imageUrl}`);
    ok += 1;
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\nDone — updated: ${ok}/${ACTIVE_FIXES.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
