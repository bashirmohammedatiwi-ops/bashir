/**
 * L'Oréal Paris Elvive / EverPure / Studio Line — separate SKUs, no shades, no images.
 * Names via GPT Luna; hard codes via GPT 5.6 Sol.
 * Usage: npx tsx scripts/add-loreal-elvive-batch59-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const HAIR_TREATMENT = "ee39d6a6-5074-43b6-a80c-a7c1b23c3bd1";
const OIL_MASKS = "ab7c66e4-4df6-474f-b9d2-dd059dd60bfc";
const HAIR_STYLING = "c508347a-8844-4068-b508-9653ede66b8b";

type BrandKey = "loreal" | "everpure" | "studio";

type ProductDef = {
  barcode: string;
  brandKey: BrandKey;
  price: number;
  tertiaryCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const BRANDS: Record<BrandKey, { brandAr: string; brandEn: string; prefix: string }> = {
  loreal: { brandAr: "لوريال باريس إلفيف", brandEn: "L'Oréal Paris Elvive", prefix: "LEV" },
  everpure: { brandAr: "لوريال باريس EverPure", brandEn: "L'Oréal Paris EverPure", prefix: "LEP" },
  studio: { brandAr: "لوريال باريس ستوديو لاين", brandEn: "L'Oréal Paris Studio Line", prefix: "LSL" },
};

export const UNRESOLVED_BARCODES = [
  "3610340687662",
  "3610340687679",
  "3610340687488",
] as const;

const PRODUCTS: ProductDef[] = [
  // —— Shampoos ——
  {
    barcode: "3600520838014",
    brandKey: "loreal",
    price: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Anti-Breakage – شامبو مقاوم للتكسر لتقوية الشعر الضعيف 400 مل",
    nameEn: "L'Oréal Paris Elvive Anti-Breakage Repairing Shampoo – 400 ml",
    descriptionAr:
      "شامبو إلفيف Anti-Breakage — يقوّي الشعر الضعيف ويساعد على تقليل التكسر مع تنظيف لطيف يومي.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Elvive Anti-Breakage shampoo — strengthens weak hair and helps reduce breakage with a gentle daily cleanse.\n\n• Size: 400 ml.",
  },
  {
    barcode: "3600521453315",
    brandKey: "loreal",
    price: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Re-Nutrition – شامبو مغذٍ للشعر الجاف بغذاء ملكات النحل 400 مل",
    nameEn: "L'Oréal Paris Elvive Re-Nutrition Nourishing Shampoo – 400 ml",
    descriptionAr:
      "شامبو إلفيف Re-Nutrition — يغذّي الشعر الجاف بغذاء ملكات النحل ويمنح نعومة ولمعاناً.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Elvive Re-Nutrition nourishing shampoo — feeds dry hair with royal jelly for softness and shine.\n\n• Size: 400 ml.",
  },
  {
    barcode: "7509552817409",
    brandKey: "loreal",
    price: 12000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Total Repair 5 Extreme – شامبو إصلاح مكثف للشعر شديد التلف 680 مل",
    nameEn: "L'Oréal Paris Elvive Total Repair 5 Extreme Shampoo – 680 ml",
    descriptionAr:
      "شامبو إلفيف TR5 Extreme — إصلاح مكثف للشعر شديد التلف بتركيبة كيراتين ومركز إصلاح.\n\n• الحجم: 680 مل.",
    descriptionEn:
      "Elvive Total Repair 5 Extreme shampoo — intensive repair for severely damaged hair with keratin repair concentrate.\n\n• Size: 680 ml.",
  },
  {
    barcode: "3610340649653",
    brandKey: "loreal",
    price: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Full Resist – شامبو مقوٍ مقاوم لتساقط وتكسر الشعر الضعيف بأمينكسيل وبيوتين 400 مل",
    nameEn: "L'Oréal Paris Elvive Full Resist Reinforcing Shampoo – 400 ml",
    descriptionAr:
      "شامبو إلفيف Full Resist — يقوّي الشعر الهش ويساعد على تقليل التكسر بأمينكسيل وبيوتين وأرجينين.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Elvive Full Resist reinforcing shampoo — fortifies fragile hair and helps reduce breakage with Aminexil, biotin and arginine.\n\n• Size: 400 ml.",
  },
  {
    barcode: "7509552843026",
    brandKey: "loreal",
    price: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Dream Long Liss – شامبو لتنعيم الشعر الطويل وتقليل الهيشان بكيراتين نباتي 400 مل",
    nameEn: "L'Oréal Paris Elvive Dream Long Liss Shampoo – 400 ml",
    descriptionAr:
      "شامبو إلفيف Dream Long Liss — ينعّم الشعر الطويل ويسيطر على الهيشان بكيراتين نباتي وزبدة الكاكاو.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Elvive Dream Long Liss shampoo — smoothes long hair and helps control frizz with vegetable keratin and cocoa butter.\n\n• Size: 400 ml.",
  },
  {
    barcode: "3610340020025",
    brandKey: "loreal",
    price: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Extraordinary Oil – شامبو الزيت الاستثنائي المغذّي للشعر الجاف 400 مل",
    nameEn: "L'Oréal Paris Elvive Extraordinary Oil Nourishing Shampoo – 400 ml",
    descriptionAr:
      "شامبو إلفيف Extraordinary Oil — يغذّي ويرطّب الشعر الجاف بزيوت الزهور ويمنح نعومة ولمعاناً.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Elvive Extraordinary Oil nourishing shampoo — hydrates dry hair with flower oils for softness and shine.\n\n• Size: 400 ml.",
  },
  {
    barcode: "3610340653650",
    brandKey: "loreal",
    price: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Dream Long Straight – شامبو لتنعيم الشعر الطويل والمجعد بكيراتين وزيت الحبة السوداء 400 مل",
    nameEn: "L'Oréal Paris Elvive Dream Long Straight Shampoo – 400 ml",
    descriptionAr:
      "شامبو إلفيف Dream Long Straight — ينعّم الشعر الطويل والمجعد ويقلل الهيشان بميكرو كيراتين وزيت الحبة السوداء.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Elvive Dream Long Straight shampoo — smoothes long frizzy hair with micro-keratin and black cumin oil.\n\n• Size: 400 ml.",
  },
  {
    barcode: "3610340636691",
    brandKey: "loreal",
    price: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Dream Long – شامبو لإصلاح وتقوية الشعر الطويل ضد التقصف والتكسر 400 مل",
    nameEn: "L'Oréal Paris Elvive Dream Long Restoring Shampoo – 400 ml",
    descriptionAr:
      "شامبو إلفيف Dream Long — يساعد على حماية الشعر الطويل من التقصف والتكسر بكيراتين وزيت الخروع وفيتامينات.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Elvive Dream Long restoring shampoo — helps protect long hair against breakage and split ends with keratin, castor oil and vitamins.\n\n• Size: 400 ml.",
  },
  {
    barcode: "3610340673801",
    brandKey: "loreal",
    price: 10000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Glycolic Gloss – شامبو لمعان إضافي للشعر الباهت والمسامّي بحمض الغليكوليك 400 مل",
    nameEn: "L'Oréal Paris Elvive Glycolic Gloss Extra Gloss Shampoo – 400 ml",
    descriptionAr:
      "شامبو إلفيف Glycolic Gloss — يزيد لمعان الشعر الباهت وينعّم المسامّية بتركيبة حمض الغليكوليك.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Elvive Glycolic Gloss shampoo — boosts shine on dull porous hair with a glycolic-acid smoothing formula.\n\n• Size: 400 ml.",
  },
  {
    barcode: "3600520837963",
    brandKey: "loreal",
    price: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Colour Protect – شامبو حماية لون الشعر المصبوغ بفلاتر UV وزيت بذور الكتان 400 مل",
    nameEn: "L'Oréal Paris Elvive Colour Protect Caring Shampoo – 400 ml",
    descriptionAr:
      "شامبو إلفيف Colour Protect — يحافظ على حيوية لون الشعر المصبوغ بفلاتر UVA/UVB وزيت بذور الكتان.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Elvive Colour Protect shampoo — helps preserve colour vibrancy on dyed hair with UV filters and flaxseed oil.\n\n• Size: 400 ml.",
  },
  {
    barcode: "7509552848007",
    brandKey: "loreal",
    price: 8000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Total Repair 5 Extreme – شامبو إصلاح مكثف للشعر شديد التلف 370 مل",
    nameEn: "L'Oréal Paris Elvive Total Repair 5 Extreme Shampoo – 370 ml",
    descriptionAr:
      "شامبو إلفيف TR5 Extreme — يرمّم الشعر شديد التلف بمركز إصلاح وكيراتين ويمنح نعومة وحماية.\n\n• الحجم: 370 مل.",
    descriptionEn:
      "Elvive Total Repair 5 Extreme shampoo — reconstructs severely damaged hair with repair concentrate and keratin.\n\n• Size: 370 ml.",
  },
  {
    barcode: "7509552848021",
    brandKey: "loreal",
    price: 8000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Extraordinary Curls – شامبو الزيت الاستثنائي لتغذية وترطيب الشعر المجعد 370 مل",
    nameEn: "L'Oréal Paris Elvive Extraordinary Curls Oil Shampoo – 370 ml",
    descriptionAr:
      "شامبو إلفيف Extraordinary Curls — يغذّي ويرطّب الشعر المجعد بتركيبة زيوت دون إثقال التجعيدات.\n\n• الحجم: 370 مل.",
    descriptionEn:
      "Elvive Extraordinary Curls oil shampoo — nourishes and hydrates curly hair with an oil-care formula.\n\n• Size: 370 ml.",
  },
  {
    barcode: "7509552847529",
    brandKey: "loreal",
    price: 8000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Extraordinary Oil Coconut – شامبو بجوز الهند لتغذية الشعر الجاف 370 مل",
    nameEn: "L'Oréal Paris Elvive Extraordinary Oil Coconut Nourishing Shampoo – 370 ml",
    descriptionAr:
      "شامبو إلفيف Extraordinary Oil بجوز الهند — تغذية مكثفة للشعر الجاف مع نعومة ولمعان.\n\n• الحجم: 370 مل.",
    descriptionEn:
      "Elvive Extraordinary Oil Coconut shampoo — intense nourishment for dry hair with coconut and flower oils.\n\n• Size: 370 ml.",
  },
  {
    barcode: "7509552847598",
    brandKey: "loreal",
    price: 8000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Dream Long Super Liss – شامبو سوبر ليس لتنعيم الشعر الطويل وتقليل الهيشان 370 مل",
    nameEn: "L'Oréal Paris Elvive Dream Long Super Liss Shampoo – 370 ml",
    descriptionAr:
      "شامبو إلفيف Dream Long Super Liss — ينعّم الشعر الطويل ويقلل الهيشان بكيراتين نباتي وزبدة الكاكاو.\n\n• الحجم: 370 مل.",
    descriptionEn:
      "Elvive Dream Long Super Liss shampoo — disciplines long hair and controls frizz with vegetable keratin and cocoa butter.\n\n• Size: 370 ml.",
  },
  {
    barcode: "7509552847505",
    brandKey: "loreal",
    price: 8000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Extraordinary Oil Universal – شامبو الزيت الاستثنائي العالمي المغذّي للشعر الجاف 370 مل",
    nameEn: "L'Oréal Paris Elvive Extraordinary Oil Universal Nourishing Shampoo – 370 ml",
    descriptionAr:
      "شامبو إلفيف Extraordinary Oil Universal — ينظف ويغذّي ويرطّب الشعر الجاف ويمنح نعومة ولمعاناً.\n\n• الحجم: 370 مل.",
    descriptionEn:
      "Elvive Extraordinary Oil Universal shampoo — cleanses, nourishes and moisturizes dry hair for softness and shine.\n\n• Size: 370 ml.",
  },
  {
    barcode: "7509552847550",
    brandKey: "loreal",
    price: 8000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Extraordinary Clay – شامبو الطين المنقّي للجذور الدهنية والأطراف الجافة 370 مل",
    nameEn: "L'Oréal Paris Elvive Extraordinary Clay Purifying Shampoo – 370 ml",
    descriptionAr:
      "شامبو إلفيف Extraordinary Clay — ينقّي الجذور الدهنية بثلاثة أنواع طين ويرطّب الأطراف الجافة.\n\n• الحجم: 370 مل.",
    descriptionEn:
      "Elvive Extraordinary Clay purifying shampoo — cleanses oily roots with refined clays while hydrating dry lengths.\n\n• Size: 370 ml.",
  },
  {
    barcode: "3600523955015",
    brandKey: "loreal",
    price: 12000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Dream Long – شامبو لتقوية وترطيب الشعر الطويل ضد التقصف 700 مل",
    nameEn: "L'Oréal Paris Elvive Dream Long Shampoo – 700 ml",
    descriptionAr:
      "شامبو إلفيف Dream Long بحجم عائلي — يقوّي ويرطّب الشعر الطويل ويساعد على حمايته من التقصف.\n\n• الحجم: 700 مل.",
    descriptionEn:
      "Elvive Dream Long shampoo — family size care that strengthens and hydrates long hair against split ends.\n\n• Size: 700 ml.",
  },
  {
    barcode: "3610340670978",
    brandKey: "loreal",
    price: 10000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Hyaluron Pure – شامبو منقّي للشعر الدهني بحمض الساليسيليك والهيالورونيك 400 مل",
    nameEn: "L'Oréal Paris Elvive Hyaluron Pure Purifying Shampoo – 400 ml",
    descriptionAr:
      "شامبو إلفيف Hyaluron Pure — ينقّي فروة الرأس الدهنية بحمض الساليسيليك ويرطّب الأطراف بحمض الهيالورونيك.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Elvive Hyaluron Pure purifying shampoo — removes oil and buildup with salicylic acid while hydrating lengths with hyaluronic acid.\n\n• Size: 400 ml.",
  },
  {
    barcode: "3600524074739",
    brandKey: "loreal",
    price: 12000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Bond Repair – شامبو إصلاح الروابط الداخلية للشعر التالف والضعيف 200 مل",
    nameEn: "L'Oréal Paris Elvive Bond Repair Shampoo – 200 ml",
    descriptionAr:
      "شامبو إلفيف Bond Repair — يساعد على إصلاح الروابط داخل ألياف الشعر التالف وتقليل مظهر التكسر.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Elvive Bond Repair shampoo — helps repair internal hair bonds in damaged weak hair and reduce breakage.\n\n• Size: 200 ml.",
  },
  {
    barcode: "3600524127961",
    brandKey: "loreal",
    price: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Glycolic Gloss – شامبو خالٍ من الكبريتات للشعر الباهت بحمض الغليكوليك 200 مل",
    nameEn: "L'Oréal Paris Elvive Glycolic Gloss Sulphate-Free Shampoo – 200 ml",
    descriptionAr:
      "شامبو إلفيف Glycolic Gloss — لمعان وتنعيم للشعر الباهت بتركيبة خالية من الكبريتات وحمض الغليكوليك.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Elvive Glycolic Gloss sulphate-free shampoo — shine and smoothness for dull hair with glycolic acid.\n\n• Size: 200 ml.",
  },
  {
    barcode: "3600521767818",
    brandKey: "loreal",
    price: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Total Repair 5 – شامبو إصلاح شامل للشعر التالف والضعيف ببروتين وكيراتين وسيراميد 400 مل",
    nameEn: "L'Oréal Paris Elvive Total Repair 5 Repairing Shampoo – 400 ml",
    descriptionAr:
      "شامبو إلفيف Total Repair 5 — يعالج خمسة علامات تلف شائعة: التقصف والضعف والخشونة والبهتان والجفاف، ببروتين وكيراتين وسيراميد.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Elvive Total Repair 5 repairing shampoo — targets five signs of damage (split ends, weakness, roughness, dullness, dehydration) with pro-keratin and ceramide.\n\n• Size: 400 ml.",
  },
  {
    barcode: "3610340655197",
    brandKey: "loreal",
    price: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Hyaluron Moisture – شامبو ملء وترطيب للشعر الجاف بحمض الهيالورونيك 400 مل",
    nameEn: "L'Oréal Paris Elvive Hyaluron Moisture Filling Shampoo – 400 ml",
    descriptionAr:
      "شامبو إلفيف Hyaluron Moisture — يملأ ويرطّب الشعر الجاف بحمض الهيالورونيك لنعومة ولمعان يدومان حتى 72 ساعة.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Elvive Hyaluron Moisture filling shampoo — replenishes dry dehydrated hair with hyaluronic acid for lasting softness and shine.\n\n• Size: 400 ml.",
  },
  {
    barcode: "3600523477821",
    brandKey: "loreal",
    price: 12000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Total Repair 5 – شامبو إصلاح شامل للشعر التالف ببروتين وكيراتين 700 مل",
    nameEn: "L'Oréal Paris Elvive Total Repair 5 Repairing Shampoo – 700 ml",
    descriptionAr:
      "شامبو إلفيف Total Repair 5 بحجم عائلي — يقوّي الشعر التالف والضعيف ببروتين وكيراتين ويمنح لمعاناً وحيوية.\n\n• الحجم: 700 مل.",
    descriptionEn:
      "Elvive Total Repair 5 repairing shampoo — family size that strengthens damaged weak hair with pro-keratin and ceramide care.\n\n• Size: 700 ml.",
  },

  // —— Conditioners ——
  {
    barcode: "3610340667237",
    brandKey: "loreal",
    price: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Fall Resist – بلسم مقاوم لتساقط وتكسر الشعر بأمينكسيل وبيوتين 360 مل",
    nameEn: "L'Oréal Paris Elvive Fall Resist Conditioner – 360 ml",
    descriptionAr:
      "بلسم إلفيف Fall Resist — يقوّي الشعر الضعيف ويساعد على تقليل التكسر بأمينكسيل وبيوتين.\n\n• الحجم: 360 مل.",
    descriptionEn:
      "Elvive Fall Resist conditioner — strengthens weak hair and helps reduce breakage with Aminexil and biotin.\n\n• Size: 360 ml.",
  },
  {
    barcode: "3600524016265",
    brandKey: "loreal",
    price: 8000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Color Vive – بلسم حماية لون الشعر المصبوغ بفلاتر UV 300 مل",
    nameEn: "L'Oréal Paris Elvive Color Vive Conditioner – 300 ml",
    descriptionAr:
      "بلسم إلفيف Color Vive — يحافظ على لون الشعر المصبوغ ويسهّل التمشيط مع حماية UV ولمعان.\n\n• الحجم: 300 مل.",
    descriptionEn:
      "Elvive Color Vive conditioner — helps preserve colour, detangles and adds shine with UV protection.\n\n• Size: 300 ml.",
  },
  {
    barcode: "3600524016234",
    brandKey: "loreal",
    price: 8000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Extraordinary Oil – بلسم الزيت الاستثنائي المغذّي للشعر الجاف 300 مل",
    nameEn: "L'Oréal Paris Elvive Extraordinary Oil Nourishing Conditioner – 300 ml",
    descriptionAr:
      "بلسم إلفيف Extraordinary Oil — يغذّي وينعّم الشعر الجاف بزيوت المارولا والكاميليا ويزيد اللمعان.\n\n• الحجم: 300 مل.",
    descriptionEn:
      "Elvive Extraordinary Oil nourishing conditioner — feeds dry hair with marula and camellia oils for softness and shine.\n\n• Size: 300 ml.",
  },
  {
    barcode: "3610340667275",
    brandKey: "loreal",
    price: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Dream Long Straight – بلسم كيراتين لتنعيم الشعر حتى 72 ساعة وتقليل الهيشان 360 مل",
    nameEn: "L'Oréal Paris Elvive Dream Long Straight 72H Keratin Conditioner – 360 ml",
    descriptionAr:
      "بلسم إلفيف Dream Long Straight — تنعيم بكيراتين يدوم حتى 72 ساعة مع تقليل الهيشان ولمعان.\n\n• الحجم: 360 مل.",
    descriptionEn:
      "Elvive Dream Long Straight keratin conditioner — smoothing care lasting up to 72 hours with less frizz and more shine.\n\n• Size: 360 ml.",
  },
  {
    barcode: "3610340673849",
    brandKey: "loreal",
    price: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Glycolic Gloss – بلسم ختم اللمعان للشعر الباهت بحمض الغليكوليك 360 مل",
    nameEn: "L'Oréal Paris Elvive Glycolic Gloss Shine Sealing Conditioner – 360 ml",
    descriptionAr:
      "بلسم إلفيف Glycolic Gloss — يختم اللمعان وينعّم الشعر الباهت بحمض الغليكوليك ويسهّل التصفيف.\n\n• الحجم: 360 مل.",
    descriptionEn:
      "Elvive Glycolic Gloss shine-sealing conditioner — smooths the cuticle on dull hair for gloss and manageability.\n\n• Size: 360 ml.",
  },
  {
    barcode: "3610340667282",
    brandKey: "loreal",
    price: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Colour Protect – بلسم حماية لون الشعر المصبوغ وتنعيمه 360 مل",
    nameEn: "L'Oréal Paris Elvive Colour Protect Conditioner – 360 ml",
    descriptionAr:
      "بلسم إلفيف Colour Protect — يغذّي الشعر المصبوغ ويحافظ على حيوية اللون مع تنعيم وسهولة تمشيط.\n\n• الحجم: 360 مل.",
    descriptionEn:
      "Elvive Colour Protect conditioner — nourishes colour-treated hair while helping preserve vibrancy and softness.\n\n• Size: 360 ml.",
  },
  {
    barcode: "3600524074876",
    brandKey: "loreal",
    price: 11000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Bond Repair – بلسم إصلاح الروابط 10٪ لتقوية الشعر التالف 150 مل",
    nameEn: "L'Oréal Paris Elvive Bond Repair 10% Conditioner – 150 ml",
    descriptionAr:
      "بلسم إلفيف Bond Repair — يساعد على إصلاح الروابط وتقوية الشعر التالف وتقليل التكسر.\n\n• الحجم: 150 مل.",
    descriptionEn:
      "Elvive Bond Repair conditioner — bond-care formula that strengthens damaged hair and helps reduce breakage.\n\n• Size: 150 ml.",
  },
  {
    barcode: "3600524135720",
    brandKey: "loreal",
    price: 8000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Glycolic Gloss – بلسم لمعان وتنعيم للشعر الباهت 150 مل",
    nameEn: "L'Oréal Paris Elvive Glycolic Gloss Conditioner for Dull Hair – 150 ml",
    descriptionAr:
      "بلسم إلفيف Glycolic Gloss — ينعّم الشعر الباهت ويزيد لمعانه بتركيبة حمض الغليكوليك.\n\n• الحجم: 150 مل.",
    descriptionEn:
      "Elvive Glycolic Gloss conditioner — smoothing shine care for dull hair with glycolic acid.\n\n• Size: 150 ml.",
  },
  {
    barcode: "3600524016272",
    brandKey: "loreal",
    price: 8000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Total Repair 5 – بلسم إصلاح شامل للشعر التالف 300 مل",
    nameEn: "L'Oréal Paris Elvive Total Repair 5 Conditioner – 300 ml",
    descriptionAr:
      "بلسم إلفيف Total Repair 5 — يرطّب ويرمّم الشعر التالف ويسهّل التمشيط ويمنح لمعاناً.\n\n• الحجم: 300 مل.",
    descriptionEn:
      "Elvive Total Repair 5 conditioner — repairs and softens damaged hair while adding shine and easier detangling.\n\n• Size: 300 ml.",
  },
  {
    barcode: "3610340667251",
    brandKey: "loreal",
    price: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Total Repair 5 – بلسم ترميمي للشعر التالف ببروتين وسيراميد 360 مل",
    nameEn: "L'Oréal Paris Elvive Total Repair 5 Restorative Conditioner – 360 ml",
    descriptionAr:
      "بلسم إلفيف Total Repair 5 — يعالج الجفاف والتكسر والخشونة والتقصف ببروتين وسيراميد.\n\n• الحجم: 360 مل.",
    descriptionEn:
      "Elvive Total Repair 5 restorative conditioner — targets dryness, breakage, roughness, dullness and split ends.\n\n• Size: 360 ml.",
  },
  {
    barcode: "7509552875010",
    brandKey: "loreal",
    price: 8000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف Hyaluron Pure – بلسم خفيف للجذور الدهنية والأطراف الجافة 370 مل",
    nameEn: "L'Oréal Paris Elvive Hyaluron Pure Conditioner – 370 ml",
    descriptionAr:
      "بلسم إلفيف Hyaluron Pure — يرطّب الأطراف الجافة دون إثقال الجذور الدهنية مع لمعان خفيف.\n\n• الحجم: 370 مل.",
    descriptionEn:
      "Elvive Hyaluron Pure conditioner — hydrates dry ends without weighing down oily roots for lightweight shine.\n\n• Size: 370 ml.",
  },

  // —— Rapid Reviver ——
  {
    barcode: "3600523738632",
    brandKey: "loreal",
    price: 10000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "لوريال باريس إلفيف Total Repair 5 Rapid Reviver – بلسم فائق التركيز لإصلاح الشعر التالف في دقيقة 180 مل",
    nameEn: "L'Oréal Paris Elvive Total Repair 5 Rapid Reviver Deep Conditioner – 180 ml",
    descriptionAr:
      "بلسم إلفيف Rapid Reviver Total Repair 5 — عناية مركزة سريعة لإصلاح الشعر التالف دون إثقال.\n\n• الحجم: 180 مل.",
    descriptionEn:
      "Elvive Total Repair 5 Rapid Reviver — intensive fast conditioner to repair damaged hair without heaviness.\n\n• Size: 180 ml.",
  },
  {
    barcode: "3600523736836",
    brandKey: "loreal",
    price: 10000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "لوريال باريس إلفيف Color Vive Rapid Reviver – بلسم فائق التركيز لحماية لون الشعر المصبوغ 180 مل",
    nameEn: "L'Oréal Paris Elvive Color Vive Rapid Reviver Super Conditioner – 180 ml",
    descriptionAr:
      "بلسم إلفيف Rapid Reviver Color Vive — ترطيب مكثف سريع للشعر المصبوغ بأحماض أمينية وفيتامين E دون وزن.\n\n• الحجم: 180 مل.",
    descriptionEn:
      "Elvive Color Vive Rapid Reviver — intensive quick conditioning for colour-treated hair with amino acids and vitamin E.\n\n• Size: 180 ml.",
  },
  {
    barcode: "3600523738625",
    brandKey: "loreal",
    price: 10000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "لوريال باريس إلفيف Dream Long Rapid Reviver – بلسم فائق التركيز لإصلاح الشعر الطويل وفك التشابك 180 مل",
    nameEn: "L'Oréal Paris Elvive Dream Long Rapid Reviver Super Conditioner – 180 ml",
    descriptionAr:
      "بلسم إلفيف Rapid Reviver Dream Long — عناية مركزة سريعة للشعر الطويل المتضرر مع فك تشابك قوي.\n\n• الحجم: 180 مل.",
    descriptionEn:
      "Elvive Dream Long Rapid Reviver — intensive quick care for long damaged hair with powerful detangling.\n\n• Size: 180 ml.",
  },
  {
    barcode: "3600523738649",
    brandKey: "loreal",
    price: 10000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "لوريال باريس إلفيف Extraordinary Oil Rapid Reviver – بلسم فائق التركيز بزيوت استثنائية لتغذية الشعر 180 مل",
    nameEn: "L'Oréal Paris Elvive Extraordinary Oil Rapid Reviver Super Conditioner – 180 ml",
    descriptionAr:
      "بلسم إلفيف Rapid Reviver Extraordinary Oil — تغذية مكثفة سريعة بزيوت استثنائية لنعومة فورية.\n\n• الحجم: 180 مل.",
    descriptionEn:
      "Elvive Extraordinary Oil Rapid Reviver — intensive oil-nourishing conditioner for instant softness.\n\n• Size: 180 ml.",
  },

  // —— Treatments / leave-ins / oils ——
  {
    barcode: "3600524075651",
    brandKey: "loreal",
    price: 14000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "لوريال باريس إلفيف Bond Repair – سيروم يُترك على الشعر لإصلاح الألياف وتقليل التقصف مع حماية حرارية 150 مل",
    nameEn: "L'Oréal Paris Elvive Bond Repair Leave-In Serum – 150 ml",
    descriptionAr:
      "سيروم إلفيف Bond Repair يُترك على الشعر — يساعد على إصلاح الروابط وتقليل الأطراف المتقصفة مع حماية من الحرارة.\n\n• الحجم: 150 مل.",
    descriptionEn:
      "Elvive Bond Repair leave-in serum — helps repair bonds, reduce split ends and protect from heat styling.\n\n• Size: 150 ml.",
  },
  {
    barcode: "3600524087593",
    brandKey: "loreal",
    price: 14000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "لوريال باريس إلفيف Bond Repair Rescue – بري شامبو مركز 12٪ لإصلاح الشعر التالف قبل الغسيل 200 مل",
    nameEn: "L'Oréal Paris Elvive Bond Repair 12% Rescue Pre-Shampoo – 200 ml",
    descriptionAr:
      "بري شامبو إلفيف Bond Repair Rescue 12٪ — علاج يُشطف لإصلاح الشعر التالف قبل الشامبو.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Elvive Bond Repair 12% Rescue pre-shampoo — rinse-off repair treatment used before shampooing damaged hair.\n\n• Size: 200 ml.",
  },
  {
    barcode: "3600523944354",
    brandKey: "loreal",
    price: 12000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "لوريال باريس إلفيف Full Resist Brush Proof – كريم يُترك على الشعر لتقوية الشعر الهش والحماية الحرارية 200 مل",
    nameEn: "L'Oréal Paris Elvive Full Resist Brush Proof Leave-In Cream – 200 ml",
    descriptionAr:
      "كريم إلفيف Full Resist Brush Proof يُترك على الشعر — يقوّي الشعر الهش ويحمي من الحرارة ويسهّل التمشيط.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Elvive Full Resist Brush Proof leave-in cream — strengthens fragile hair, adds heat protection and easier brushing.\n\n• Size: 200 ml.",
  },
  {
    barcode: "3600524004538",
    brandKey: "loreal",
    price: 14000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "لوريال باريس إلفيف Colour Protect Wonder Water – علاج لاميلار 8 ثوانٍ لحماية لون الشعر المصبوغ 200 مل",
    nameEn: "L'Oréal Paris Elvive Colour Protect 8 Second Wonder Water – 200 ml",
    descriptionAr:
      "علاج إلفيف Wonder Water Colour Protect — عناية لاميلار سريعة خلال ثوانٍ لحماية لون الشعر المصبوغ وتنعيمه.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Elvive Colour Protect 8 Second Wonder Water — ultra-fast lamellar rinse-out treatment for colour-treated hair.\n\n• Size: 200 ml.",
  },
  {
    barcode: "3610340673887",
    brandKey: "loreal",
    price: 12000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "لوريال باريس إلفيف Glycolic Gloss – كريم تمشيط يُترك على الشعر للمعان وتقليل الهيشان 200 مل",
    nameEn: "L'Oréal Paris Elvive Glycolic Gloss Leave-In Combing Cream – 200 ml",
    descriptionAr:
      "كريم إلفيف Glycolic Gloss يُترك على الشعر — يسهّل التمشيط ويزيد اللمعان ويقلل الهيشان.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Elvive Glycolic Gloss leave-in combing cream — easier detangling, more shine and less frizz.\n\n• Size: 200 ml.",
  },
  {
    barcode: "3600524228040",
    brandKey: "loreal",
    price: 12000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "لوريال باريس إلفيف Glycolic Gloss – سيروم بخاخ يُترك على الشعر للمعان عالي للشعر الباهت 150 مل",
    nameEn: "L'Oréal Paris Elvive Glycolic Gloss Leave-In Serum Spray – 150 ml",
    descriptionAr:
      "سيروم بخاخ إلفيف Glycolic Gloss يُترك على الشعر — لمعان فوري وتنعيم للشعر الباهت.\n\n• الحجم: 150 مل.",
    descriptionEn:
      "Elvive Glycolic Gloss leave-in serum spray — instant high shine and smoothness for dull hair.\n\n• Size: 150 ml.",
  },
  {
    barcode: "3600524034931",
    brandKey: "loreal",
    price: 12000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "لوريال باريس إلفيف Purple 10-in-1 – بخاخ يُترك على الشعر الأشقر والمصفّر ضد الاصفرار 150 مل",
    nameEn: "L'Oréal Paris Elvive Colour Protect Purple 10-in-1 Leave-In Spray – 150 ml",
    descriptionAr:
      "بخاخ إلفيف Purple 10-in-1 يُترك على الشعر — عناية متعددة للشعر الأشقر والمبيّض للمساعدة على تحييد الاصفرار.\n\n• الحجم: 150 مل.",
    descriptionEn:
      "Elvive Purple 10-in-1 leave-in spray — multi-benefit care for blonde/bleached hair to help neutralize brassiness.\n\n• Size: 150 ml.",
  },
  {
    barcode: "3610340653865",
    brandKey: "loreal",
    price: 10000,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "لوريال باريس إلفيف Dream Long Straight – كريم زيت بديل لتنعيم الشعر حتى 72 ساعة مع حماية حرارية 300 مل",
    nameEn: "L'Oréal Paris Elvive Dream Long Straight 72H Oil Replacement – 300 ml",
    descriptionAr:
      "كريم زيت إلفيف Dream Long Straight — تنعيم يدوم حتى 72 ساعة بميكرو كيراتين وزيت الحبة السوداء مع حماية حرارية.\n\n• الحجم: 300 مل.",
    descriptionEn:
      "Elvive Dream Long Straight 72H oil replacement — smoothing leave-in with micro-keratin and black cumin oil plus heat protection.\n\n• Size: 300 ml.",
  },
  {
    barcode: "3610340650659",
    brandKey: "loreal",
    price: 10000,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "لوريال باريس إلفيف Full Resist – كريم زيت بديل لتقوية الشعر ومقاومة التكسر ببيوتين وفيتامين B5 300 مل",
    nameEn: "L'Oréal Paris Elvive Full Resist Reinforcing Oil Replacement – 300 ml",
    descriptionAr:
      "كريم زيت إلفيف Full Resist — يقوّي الشعر الضعيف ويساعد على تقليل التكسر ببيوتين وفيتامين B5 وأرجينين.\n\n• الحجم: 300 مل.",
    descriptionEn:
      "Elvive Full Resist reinforcing oil replacement — fortifies weak hair and helps reduce breakage with biotin, B5 and arginine.\n\n• Size: 300 ml.",
  },
  {
    barcode: "3610340028502",
    brandKey: "loreal",
    price: 10000,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "لوريال باريس إلفيف Total Repair 5 – كريم زيت بديل لإصلاح الشعر التالف بكيراتين وسيراميد 300 مل",
    nameEn: "L'Oréal Paris Elvive Total Repair 5 Oil Replacement – 300 ml",
    descriptionAr:
      "كريم زيت إلفيف Total Repair 5 — يرمّم التقصف والجفاف والبهتان والهشاشة ببروتين كيراتين وسيراميد.\n\n• الحجم: 300 مل.",
    descriptionEn:
      "Elvive Total Repair 5 oil replacement — helps repair split ends, dryness, dullness and fragility with pro-keratin and ceramide.\n\n• Size: 300 ml.",
  },
  {
    barcode: "3600524044145",
    brandKey: "loreal",
    price: 12000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "لوريال باريس إلفيف Hyaluron Moisture – كريم ليلي لملء وترطيب الشعر الجاف أثناء النوم 200 مل",
    nameEn: "L'Oréal Paris Elvive Hyaluron Moisture Filling Night Cream – 200 ml",
    descriptionAr:
      "كريم إلفيف Hyaluron Moisture الليلي — يغذّي ويملأ الشعر الجاف أثناء النوم لنعومة في الصباح.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Elvive Hyaluron Moisture filling night cream — overnight nourishment for dehydrated dry hair.\n\n• Size: 200 ml.",
  },

  // —— Studio Line ——
  {
    barcode: "3600521852972",
    brandKey: "studio",
    price: 8000,
    tertiaryCategoryId: HAIR_STYLING,
    nameAr: "لوريال باريس ستوديو لاين Hot & Straight – كريم تنعيم وحماية حرارية لفرد الشعر 200 مل",
    nameEn: "L'Oréal Paris Studio Line Hot & Straight Smoothing Cream – 200 ml",
    descriptionAr:
      "كريم ستوديو لاين Hot & Straight — ينعّم الشعر ويحميه أثناء التصفيف الحراري للفرد.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Studio Line Hot & Straight cream — smoothes hair and helps protect during heat straightening.\n\n• Size: 200 ml.",
  },

  // —— EverPure ——
  {
    barcode: "071249633830",
    brandKey: "everpure",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس EverPure Moisture – شامبو مرطّب خالٍ من الكبريتات للشعر المصبوغ بإكليل الجبل 1 لتر",
    nameEn: "L'Oréal Paris EverPure Moisture Sulfate-Free Shampoo with Rosemary – 1 L",
    descriptionAr:
      "شامبو EverPure Moisture — خالٍ من الكبريتات والبارابين لحماية لون الشعر المصبوغ مع ترطيب مضاعف بإكليل الجبل.\n\n• من UPC 71249633830 → EAN 071249633830.\n• الحجم: 1 لتر / 33.8 أونصة.",
    descriptionEn:
      "EverPure Moisture sulfate-free shampoo — color-safe hydration with rosemary; free from sulfates and parabens.\n\n• From UPC 71249633830 → EAN 071249633830.\n• Size: 1 L / 33.8 fl oz.",
  },
  {
    barcode: "071249633847",
    brandKey: "everpure",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس EverPure Moisture – بلسم مرطّب خالٍ من الكبريتات للشعر المصبوغ بإكليل الجبل 1 لتر",
    nameEn: "L'Oréal Paris EverPure Moisture Sulfate-Free Conditioner with Rosemary – 1 L",
    descriptionAr:
      "بلسم EverPure Moisture — يرطّب وينعّم الشعر المصبوغ مع حماية اللون بتركيبة خالية من الكبريتات وإكليل الجبل.\n\n• من UPC 71249633847.\n• الحجم: 1 لتر.",
    descriptionEn:
      "EverPure Moisture sulfate-free conditioner — hydrates and softens color-treated hair with rosemary while protecting colour.\n\n• From UPC 71249633847.\n• Size: 1 L.",
  },
  {
    barcode: "071249633977",
    brandKey: "everpure",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس EverPure Volume – بلسم لزيادة الحجم خالٍ من الكبريتات للشعر المصبوغ بزهرة اللوتس 1 لتر",
    nameEn: "L'Oréal Paris EverPure Volume Sulfate-Free Conditioner with Lotus – 1 L",
    descriptionAr:
      "بلسم EverPure Volume — يمنح حجماً ولمعاناً للشعر الرفيع والمصبوغ بزهرة اللوتس دون كبريتات.\n\n• من UPC 71249633977.\n• الحجم: 1 لتر.",
    descriptionEn:
      "EverPure Volume sulfate-free conditioner — body and shine for fine flat color-treated hair with lotus flower.\n\n• From UPC 71249633977.\n• Size: 1 L.",
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

async function resolveBrandId(key: BrandKey): Promise<string> {
  const b = BRANDS[key];
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: b.brandAr,
    brandEn: b.brandEn,
    createIfMissing: true,
  });
  if (!resolved.brand?.id) throw new Error(`Brand resolve failed: ${b.brandEn}`);
  console.log(`Brand: ${b.brandEn} (${resolved.brand.id})${resolved.created ? " [created]" : ""}`);
  return resolved.brand.id;
}

async function deleteByBarcode(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${encodeURIComponent(barcode)}`,
  );
  if (!check.exists || !check.product?.id) return false;
  await api(`/products/${check.product.id}`, "DELETE");
  console.log(`  deleted: ${check.product.nameAr ?? check.product.id}`);
  return true;
}

function slugify(nameEn: string, barcode: string): string {
  const base = nameEn
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base}-${barcode.slice(-6)}`;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`To add: ${PRODUCTS.length} | unresolved skipped: ${UNRESOLVED_BARCODES.length}\n`);
  await login();
  console.log("Logged in.\n");

  const brandIds: Partial<Record<BrandKey, string>> = {};
  for (const key of new Set(PRODUCTS.map((p) => p.brandKey))) {
    brandIds[key] = await resolveBrandId(key);
  }
  console.log("");

  // legacy short UPCs
  for (const b of ["71249633830", "71249633847", "71249633977", "0071249633830", "0071249633847", "0071249633977"]) {
    await deleteByBarcode(b);
  }

  let added = 0;
  for (const p of PRODUCTS) {
    const brand = BRANDS[p.brandKey];
    console.log(`--- ${p.barcode} ---`);
    await deleteByBarcode(p.barcode);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: `${brand.prefix}-${p.barcode.slice(-6)}`,
      barcode: p.barcode,
      slug: slugify(p.nameEn, p.barcode),
      brandId: brandIds[p.brandKey]!,
      categoryId: CARE,
      subcategoryId: HAIR_CARE,
      subcategoryIds: [HAIR_CARE],
      tertiaryCategoryId: p.tertiaryCategoryId,
      tertiaryCategoryIds: [p.tertiaryCategoryId],
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      price: p.price,
      originalPrice: Math.round((p.price * 1.15) / 500) * 500,
      stock: 0,
      isActive: true,
      imageIds: [],
    });

    const verify = await api<{ shades?: unknown[] }>(`/products/${created.id}`);
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Shades on ${p.barcode}`);
    console.log(`  ✓ ${p.nameAr}`);
    console.log(`    EN: ${p.nameEn}`);
    console.log(`    ID: ${created.id} | ${p.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`Done — added ${added}/${PRODUCTS.length}`);
  console.log("\nUnresolved barcodes (not added):");
  for (const b of UNRESOLVED_BARCODES) console.log(`  - ${b}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
