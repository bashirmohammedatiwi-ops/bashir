/**
 * Deodorant batch – 65 separate SKUs (NO shades, NO images).
 * Usage: npx tsx scripts/add-deodorant-batch-aug6-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const BODY = "23aaaa07-91ee-4937-847e-d7866a9e937a";
const DEODORANT = "9464c921-9650-421f-8e2b-6a172f7524c5";

type BrandKey =
  | "enchanteur"
  | "mitchum"
  | "degree"
  | "sanex"
  | "rexona"
  | "dermaflora"
  | "nivea"
  | "acm"
  | "adidas"
  | "beesline"
  | "ui";

type ProductDef = {
  barcode: string;
  brandKey: BrandKey;
  price: number;
  originalPrice?: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId?: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const BRANDS: Record<BrandKey, { brandAr: string; brandEn: string; prefix: string }> = {
  enchanteur: { brandAr: "إنشانتور", brandEn: "Enchanteur", prefix: "ENC" },
  mitchum: { brandAr: "ميتشوم", brandEn: "Mitchum", prefix: "MTC" },
  degree: { brandAr: "ديغري", brandEn: "Degree", prefix: "DEG" },
  sanex: { brandAr: "سانكس", brandEn: "Sanex", prefix: "SNX" },
  rexona: { brandAr: "ريكسونا", brandEn: "Rexona", prefix: "RXN" },
  dermaflora: { brandAr: "ديرمافلورا", brandEn: "Dermaflora", prefix: "DRF" },
  nivea: { brandAr: "نيفيا", brandEn: "NIVEA", prefix: "NIV" },
  acm: { brandAr: "إيه سي إم", brandEn: "ACM", prefix: "ACM" },
  adidas: { brandAr: "أديداس", brandEn: "Adidas", prefix: "ADI" },
  beesline: { brandAr: "بيزلين", brandEn: "Beesline", prefix: "BSL" },
  ui: { brandAr: "يو آند آي", brandEn: "U&I", prefix: "UNI" },
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "8888202045690",
    brandKey: "enchanteur",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "إنشانتور Gorgeous معطر – رول أون مزيل عرق 50 مل",
    nameEn: "Enchanteur - Gorgeous Perfumed Roll-On Deodorant 50ml",
    descriptionAr: "إنشانتور Gorgeous معطر – مزيل عرق رول أون رائحة زهرية فاكهية Gorgeous لحماية مريحة طوال اليوم في الجو الحار.\n\n• أمبولة رول أون لتوزيع متساوٍ على بشرة نظيفة وجافة.\n• يساعد على تقليل رائحة العرق مع عطر لطيف.\n• 50 مل – مناسب للاستخدام اليومي والسفر.",
    descriptionEn: "Enchanteur Gorgeous Perfumed roll-on deodorant – floral-fruity Gorgeous scent for reliable daily freshness in warm weather.\n\n• Roll-on applicator for even, controlled coverage on clean dry skin.\n• Helps reduce underarm odour while leaving a pleasant scent.\n• 50ml size – handy for daily use, work and travel.",
  },
  {
    barcode: "8888202026859",
    brandKey: "enchanteur",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "إنشانتور Alluring معطر – رول أون مزيل عرق 50 مل",
    nameEn: "Enchanteur - Alluring Perfumed Roll-On Deodorant 50ml",
    descriptionAr: "إنشانتور Alluring معطر – مزيل عرق رول أون عطر Alluring جذاب لحماية مريحة طوال اليوم في الجو الحار.\n\n• أمبولة رول أون لتوزيع متساوٍ على بشرة نظيفة وجافة.\n• يساعد على تقليل رائحة العرق مع عطر لطيف.\n• 50 مل – مناسب للاستخدام اليومي والسفر.",
    descriptionEn: "Enchanteur Alluring Perfumed roll-on deodorant – seductive Alluring fragrance for reliable daily freshness in warm weather.\n\n• Roll-on applicator for even, controlled coverage on clean dry skin.\n• Helps reduce underarm odour while leaving a pleasant scent.\n• 50ml size – handy for daily use, work and travel.",
  },
  {
    barcode: "8888202018182",
    brandKey: "enchanteur",
    price: 9800,
    originalPrice: 11200,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "إنشانتور Charming معطر – رول أون مزيل عرق 50 مل",
    nameEn: "Enchanteur - Charming Perfumed Roll-On Deodorant 50ml",
    descriptionAr: "إنشانتور Charming معطر – مزيل عرق رول أون نفحات ورد وياسمين Charming لحماية مريحة طوال اليوم في الجو الحار.\n\n• أمبولة رول أون لتوزيع متساوٍ على بشرة نظيفة وجافة.\n• يساعد على تقليل رائحة العرق مع عطر لطيف.\n• 50 مل – مناسب للاستخدام اليومي والسفر.",
    descriptionEn: "Enchanteur Charming Perfumed roll-on deodorant – elegant Charming rose-jasmine notes for reliable daily freshness in warm weather.\n\n• Roll-on applicator for even, controlled coverage on clean dry skin.\n• Helps reduce underarm odour while leaving a pleasant scent.\n• 50ml size – handy for daily use, work and travel.",
  },
  {
    barcode: "8888202018175",
    brandKey: "enchanteur",
    price: 9800,
    originalPrice: 11200,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "إنشانتور Charming معطر (باركود بديل) – رول أون مزيل عرق 50 مل",
    nameEn: "Enchanteur - Charming Perfumed (Alt SKU) Roll-On Deodorant 50ml",
    descriptionAr: "إنشانتور Charming معطر (باركود بديل) – مزيل عرق رول أون نفس رائحة Charming – باركود بديل لحماية مريحة طوال اليوم في الجو الحار.\n\n• أمبولة رول أون لتوزيع متساوٍ على بشرة نظيفة وجافة.\n• يساعد على تقليل رائحة العرق مع عطر لطيف.\n• 50 مل – مناسب للاستخدام اليومي والسفر.",
    descriptionEn: "Enchanteur Charming Perfumed (Alt SKU) roll-on deodorant – beloved Charming scent, alternate barcode for reliable daily freshness in warm weather.\n\n• Roll-on applicator for even, controlled coverage on clean dry skin.\n• Helps reduce underarm odour while leaving a pleasant scent.\n• 50ml size – handy for daily use, work and travel.",
  },
  {
    barcode: "8888202035172",
    brandKey: "enchanteur",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "إنشانتور Enticing معطر – رول أون مزيل عرق 50 مل",
    nameEn: "Enchanteur - Enticing Perfumed Roll-On Deodorant 50ml",
    descriptionAr: "إنشانتور Enticing معطر – مزيل عرق رول أون رائحة Enticing فاكهية مميزة لحماية مريحة طوال اليوم في الجو الحار.\n\n• أمبولة رول أون لتوزيع متساوٍ على بشرة نظيفة وجافة.\n• يساعد على تقليل رائحة العرق مع عطر لطيف.\n• 50 مل – مناسب للاستخدام اليومي والسفر.",
    descriptionEn: "Enchanteur Enticing Perfumed roll-on deodorant – playful Enticing fruity-floral scent for reliable daily freshness in warm weather.\n\n• Roll-on applicator for even, controlled coverage on clean dry skin.\n• Helps reduce underarm odour while leaving a pleasant scent.\n• 50ml size – handy for daily use, work and travel.",
  },
  {
    barcode: "8888202046420",
    brandKey: "enchanteur",
    price: 10500,
    originalPrice: 12000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "إنشانتور Alluring 40 غرام – عصا مزيل عرق",
    nameEn: "Enchanteur - Alluring Deodorant 40g Deodorant Stick",
    descriptionAr: "إنشانتور عصا Alluring 40 غرام – حماية Alluring معطرة.\n\n• عصا صلبة تنزلق بسلاسة على البشرة النظيفة.\n• حجم عملي للحقيبة والجيم.\n• نضارة تحت الذراع طوال اليوم.",
    descriptionEn: "Enchanteur Alluring Deodorant 40g deodorant stick – captivating Alluring protection.\n\n• Solid stick glides on smoothly after showering.\n• Portable format for gym bag and handbag.\n• Helps keep underarms fresh through busy days.",
  },
  {
    barcode: "8888202046413",
    brandKey: "enchanteur",
    price: 10500,
    originalPrice: 12000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "إنشانتور Romantic 40 غرام – عصا مزيل عرق",
    nameEn: "Enchanteur - Romantic Deodorant 40g Deodorant Stick",
    descriptionAr: "إنشانتور عصا Romantic 40 غرام – عطر رومانسي ناعم.\n\n• عصا صلبة تنزلق بسلاسة على البشرة النظيفة.\n• حجم عملي للحقيبة والجيم.\n• نضارة تحت الذراع طوال اليوم.",
    descriptionEn: "Enchanteur Romantic Deodorant 40g deodorant stick – soft romantic fragrance.\n\n• Solid stick glides on smoothly after showering.\n• Portable format for gym bag and handbag.\n• Helps keep underarms fresh through busy days.",
  },
  {
    barcode: "8888202052384",
    brandKey: "enchanteur",
    price: 10200,
    originalPrice: 11800,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "إنشانتور Charming Soft & Smooth – رول أون Radiant White 50 مل",
    nameEn: "Enchanteur - Charming Soft & Smooth Radiant White Roll-On 50ml",
    descriptionAr: "رول أون Charming Soft & Smooth Radiant White – عناية مرحة مع إحساس ببشرة مشرقة.\n\n• خط Soft & Smooth لملمس ناعم.\n• Radiant White لمظهر نضيف.\n• 50 مل ينشف بسرعة.",
    descriptionEn: "Enchanteur Charming Soft & Smooth Radiant White roll-on – deodorant with a bright, silky underarm feel.\n\n• Soft & Smooth line for a silky finish.\n• Radiant White variant for users who prefer a clean luminous feel.\n• 50ml quick-drying roll-on.",
  },
  {
    barcode: "0309978632009",
    brandKey: "mitchum",
    price: 13500,
    originalPrice: 15500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ميتشوم للرجال Advanced – جل شفاف عديم الرائحة 3.4 أونصة",
    nameEn: "Mitchum - Men Advanced Clear Gel Unscented Antiperspirant 3.4oz",
    descriptionAr: "جل ميتشوم شفاف عديم الرائحة – حماية قوية من التعرق.\n\n• يجف شفافاً على البشرة.\n• بدون رائحة – يناسب العطور.\n• مناسب للرياضة والجو الحار.",
    descriptionEn: "Mitchum Men Advanced Clear Gel Unscented – strong wetness protection without added fragrance.\n\n• Clear gel dries invisibly.\n• Unscented – pairs with cologne.\n• Advanced formula for active lifestyles.",
  },
  {
    barcode: "0309975122084",
    brandKey: "mitchum",
    price: 12500,
    originalPrice: 14500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ميتشوم للنساء Powder Fresh – رول أون 100 مل",
    nameEn: "Mitchum - Women Powder Fresh Roll-On Antiperspirant 100ml",
    descriptionAr: "رول أون Powder Fresh 100 مل – رائحة نظيفة مثل البابس.\n\n• 100 مل حجم عائلي.\n• يساعد على التحكم بالتعرق.\n• أمبولة رول أون دقيقة.",
    descriptionEn: "Mitchum Women Powder Fresh 100ml roll-on – trusted protection with a clean powder-fresh scent.\n\n• 100ml value size.\n• Controls wetness and odour on busy days.\n• Roll-on for precise dosage.",
  },
  {
    barcode: "0079400118028",
    brandKey: "degree",
    price: 11500,
    originalPrice: 13000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ديغري شاور كلين – عصا مضاد للتعرق 2.6 أونصة",
    nameEn: "Degree - Shower Clean Antiperspirant Deodorant Stick 2.6oz",
    descriptionAr: "ديغري عصا شاور كلين – حماية متينة مع الحركة.\n\n• عصا 2.6 أونصة سهلة الاستخدام.\n• رائحة شاور كلين يومية.\n• مناسب للجو الحار.",
    descriptionEn: "Degree Shower Clean antiperspirant stick – motion-activated protection for active days.\n\n• 2.6oz twist-up stick.\n• Shower Clean scent for everyday confidence.\n• Fights odour and wetness in heat.",
  },
  {
    barcode: "0079400017437",
    brandKey: "degree",
    price: 11800,
    originalPrice: 13300,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ديغري سيكسي إنتريج – عصا مضاد للتعرق 2.6 أونصة",
    nameEn: "Degree - Sexy Intrigue Antiperspirant Deodorant Stick 2.6oz",
    descriptionAr: "ديغري عصا سيكسي إنتريج – حماية متينة مع الحركة.\n\n• عصا 2.6 أونصة سهلة الاستخدام.\n• رائحة سيكسي إنتريج يومية.\n• مناسب للجو الحار.",
    descriptionEn: "Degree Sexy Intrigue antiperspirant stick – motion-activated protection for active days.\n\n• 2.6oz twist-up stick.\n• Sexy Intrigue scent for everyday confidence.\n• Fights odour and wetness in heat.",
  },
  {
    barcode: "0079400275325",
    brandKey: "degree",
    price: 11500,
    originalPrice: 13000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ديغري شير بودر – عصا مضاد للتعرق 2.6 أونصة",
    nameEn: "Degree - Sheer Powder Antiperspirant Deodorant Stick 2.6oz",
    descriptionAr: "ديغري عصا شير بودر – حماية متينة مع الحركة.\n\n• عصا 2.6 أونصة سهلة الاستخدام.\n• رائحة شير بودر يومية.\n• مناسب للجو الحار.",
    descriptionEn: "Degree Sheer Powder antiperspirant stick – motion-activated protection for active days.\n\n• 2.6oz twist-up stick.\n• Sheer Powder scent for everyday confidence.\n• Fights odour and wetness in heat.",
  },
  {
    barcode: "0079400486882",
    brandKey: "degree",
    price: 12000,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ديغري فانيلا وياسمين Advanced – عصا مضاد للتعرق 2.6 أونصة",
    nameEn: "Degree - Advanced Vanilla & Jasmine Antiperspirant Deodorant Stick 2.6oz",
    descriptionAr: "ديغري عصا فانيلا وياسمين Advanced – حماية متينة مع الحركة.\n\n• عصا 2.6 أونصة سهلة الاستخدام.\n• رائحة فانيلا وياسمين Advanced يومية.\n• مناسب للجو الحار.",
    descriptionEn: "Degree Advanced Vanilla & Jasmine antiperspirant stick – motion-activated protection for active days.\n\n• 2.6oz twist-up stick.\n• Advanced Vanilla & Jasmine scent for everyday confidence.\n• Fights odour and wetness in heat.",
  },
  {
    barcode: "0079400478566",
    brandKey: "degree",
    price: 12000,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ديغري جوز الهند والكركدية Advanced – عصا مضاد للتعرق 2.6 أونصة",
    nameEn: "Degree - Advanced Coconut & Hibiscus Antiperspirant Deodorant Stick 2.6oz",
    descriptionAr: "ديغري عصا جوز الهند والكركدية Advanced – حماية متينة مع الحركة.\n\n• عصا 2.6 أونصة سهلة الاستخدام.\n• رائحة جوز الهند والكركدية Advanced يومية.\n• مناسب للجو الحار.",
    descriptionEn: "Degree Advanced Coconut & Hibiscus antiperspirant stick – motion-activated protection for active days.\n\n• 2.6oz twist-up stick.\n• Advanced Coconut & Hibiscus scent for everyday confidence.\n• Fights odour and wetness in heat.",
  },
  {
    barcode: "0079400612748",
    brandKey: "degree",
    price: 12200,
    originalPrice: 13700,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ديغري تحكم بالتوتر Advanced – عصا مضاد للتعرق 2.6 أونصة",
    nameEn: "Degree - Advanced Stress Control Antiperspirant Deodorant Stick 2.6oz",
    descriptionAr: "ديغري عصا تحكم بالتوتر Advanced – حماية متينة مع الحركة.\n\n• عصا 2.6 أونصة سهلة الاستخدام.\n• رائحة تحكم بالتوتر Advanced يومية.\n• مناسب للجو الحار.",
    descriptionEn: "Degree Advanced Stress Control antiperspirant stick – motion-activated protection for active days.\n\n• 2.6oz twist-up stick.\n• Advanced Stress Control scent for everyday confidence.\n• Fights odour and wetness in heat.",
  },
  {
    barcode: "8718951315457",
    brandKey: "sanex",
    price: 12000,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "سانكس Natur Protect – رول أون حجر شب للبشرة الحساسة 50 مل",
    nameEn: "Sanex - Natur Protect Sensitive Alum Stone Roll-On 50ml",
    descriptionAr: "رول أون حجر الشب للبشرة الحساسة – سانكس Natur Protect.\n\n• صيغة مستوحاة من حجر الشب.\n• 50 مل.\n• لراحة البشرة.",
    descriptionEn: "Sanex Natur Protect Sensitive Alum Stone roll-on – mineral-inspired care for delicate skin.\n\n• Alum stone formula.\n• 50ml gentle roll-on.\n• Natur Protect skin tolerance focus.",
  },
  {
    barcode: "8714789764559",
    brandKey: "sanex",
    price: 11500,
    originalPrice: 13000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "سانكس Natur Protect 24H – ضد البقع البيضاء 50 مل",
    nameEn: "Sanex - Natur Protect 24H Anti-White-Marks Roll-On 50ml",
    descriptionAr: "ضد البقع البيضاء 24 ساعة – سانكس.\n\n• حماية تصل لـ 24 ساعة.\n• مناسب للملابس الداكنة.\n• 50 مل.",
    descriptionEn: "Sanex Natur Protect 24H Anti-White-Marks – helps reduce white residue on dark clothing.\n\n• 24-hour protection goal.\n• Anti-white-marks for abayas and dark tops.\n• 50ml dermo-tested.",
  },
  {
    barcode: "8718951315518",
    brandKey: "sanex",
    price: 11000,
    originalPrice: 12500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "سانكس Natur Protect – بشرة عادية 50 مل",
    nameEn: "Sanex - Natur Protect Normal Skin Roll-On 50ml",
    descriptionAr: "سانكس للبشرة العادية – رول أون 50 مل.\n\n• قاعدة لطيفة على البشرة.\n• ماركة أوروبية معتمدة.\n• 50 مل.",
    descriptionEn: "Sanex Natur Protect Normal Skin roll-on – balanced daily deodorant.\n\n• Light skin-friendly base.\n• Trusted EU pharmacy brand.\n• 50ml roll-on.",
  },
  {
    barcode: "8718951087385",
    brandKey: "sanex",
    price: 11200,
    originalPrice: 12700,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "سانكس للرجال Active Control – رول أون 50 مل",
    nameEn: "Sanex - Men Active Control Roll-On 50ml",
    descriptionAr: "سانكس Active Control للرجال – حماية رياضية.\n\n• رائحة رياضية.\n• رول أون دقيق.\n• 50 مل.",
    descriptionEn: "Sanex Men Active Control roll-on – sporty protection for active men.\n\n• Active Control scent.\n• Precise roll-on application.\n• 50ml travel size.",
  },
  {
    barcode: "8851932463997",
    brandKey: "rexona",
    price: 9500,
    originalPrice: 10700,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ريكسونا تايلاند Vitamin+Bright عناية عباد الشمس – رول أون 45 مل",
    nameEn: "Rexona (Thailand) - Vitamin+Bright Sunflower Care Roll-On Deodorant 45ml",
    descriptionAr: "ريكسونا تايلاند Vitamin+Bright عناية عباد الشمس 45 مل – مستورد مطلوب.\n\n• حجم 45 مل للحقيبة.\n• حماية معتمدة من ريكسونا.\n• للاستخدام اليومي.",
    descriptionEn: "Rexona Thailand Vitamin+Bright Sunflower Care 45ml – popular import with brightening and care variants.\n\n• 45ml compact bottle.\n• Rexona wetness protection.\n• Daily use in warm climates.",
  },
  {
    barcode: "8851932463898",
    brandKey: "rexona",
    price: 9500,
    originalPrice: 10700,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ريكسونا تايلاند سيكسي بوكيه – رول أون 45 مل",
    nameEn: "Rexona (Thailand) - Sexy Bouquet Roll-On Deodorant 45ml",
    descriptionAr: "ريكسونا تايلاند سيكسي بوكيه 45 مل – مستورد مطلوب.\n\n• حجم 45 مل للحقيبة.\n• حماية معتمدة من ريكسونا.\n• للاستخدام اليومي.",
    descriptionEn: "Rexona Thailand Sexy Bouquet 45ml – popular import with brightening and care variants.\n\n• 45ml compact bottle.\n• Rexona wetness protection.\n• Daily use in warm climates.",
  },
  {
    barcode: "8851932463959",
    brandKey: "rexona",
    price: 9800,
    originalPrice: 11000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ريكسونا تايلاند توهج الساكورا – رول أون 45 مل",
    nameEn: "Rexona (Thailand) - Sakura Radiance Roll-On Deodorant 45ml",
    descriptionAr: "ريكسونا تايلاند توهج الساكورا 45 مل – مستورد مطلوب.\n\n• حجم 45 مل للحقيبة.\n• حماية معتمدة من ريكسونا.\n• للاستخدام اليومي.",
    descriptionEn: "Rexona Thailand Sakura Radiance 45ml – popular import with brightening and care variants.\n\n• 45ml compact bottle.\n• Rexona wetness protection.\n• Daily use in warm climates.",
  },
  {
    barcode: "8851932463874",
    brandKey: "rexona",
    price: 9500,
    originalPrice: 10700,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ريكسونا تايلاند شاور كلين + تفتيح – رول أون 45 مل",
    nameEn: "Rexona (Thailand) - Shower Clean + Brightening Roll-On Deodorant 45ml",
    descriptionAr: "ريكسونا تايلاند شاور كلين + تفتيح 45 مل – مستورد مطلوب.\n\n• حجم 45 مل للحقيبة.\n• حماية معتمدة من ريكسونا.\n• للاستخدام اليومي.",
    descriptionEn: "Rexona Thailand Shower Clean + Brightening 45ml – popular import with brightening and care variants.\n\n• 45ml compact bottle.\n• Rexona wetness protection.\n• Daily use in warm climates.",
  },
  {
    barcode: "8851932463973",
    brandKey: "rexona",
    price: 9800,
    originalPrice: 11000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ريكسونا تايلاند وهج الورد – رول أون 45 مل",
    nameEn: "Rexona (Thailand) - Rose Glow Roll-On Deodorant 45ml",
    descriptionAr: "ريكسونا تايلاند وهج الورد 45 مل – مستورد مطلوب.\n\n• حجم 45 مل للحقيبة.\n• حماية معتمدة من ريكسونا.\n• للاستخدام اليومي.",
    descriptionEn: "Rexona Thailand Rose Glow 45ml – popular import with brightening and care variants.\n\n• 45ml compact bottle.\n• Rexona wetness protection.\n• Daily use in warm climates.",
  },
  {
    barcode: "8851932463935",
    brandKey: "rexona",
    price: 9800,
    originalPrice: 11000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ريكسونا تايلاند فيتامين سي + ضد البقع – رول أون 45 مل",
    nameEn: "Rexona (Thailand) - Vit C + Anti-Stain Roll-On Deodorant 45ml",
    descriptionAr: "ريكسونا تايلاند فيتامين سي + ضد البقع 45 مل – مستورد مطلوب.\n\n• حجم 45 مل للحقيبة.\n• حماية معتمدة من ريكسونا.\n• للاستخدام اليومي.",
    descriptionEn: "Rexona Thailand Vit C + Anti-Stain 45ml – popular import with brightening and care variants.\n\n• 45ml compact bottle.\n• Rexona wetness protection.\n• Daily use in warm climates.",
  },
  {
    barcode: "5997001719725",
    brandKey: "dermaflora",
    price: 11000,
    originalPrice: 12500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ديرمافلورا – رول أون زيت الأرغان والعسل 50 مل",
    nameEn: "Dermaflora - Argan Oil & Honey Roll-On Deodorant 50ml",
    descriptionAr: "رول أون بزيت الأرغان والعسل – تغذية وحماية.\n\n• ماركة مجريية معتمدة في الصيدليات.\n• عناية يومية للبشرة تحت الذراع.\n• 50 مل حسب نوع المنتج.",
    descriptionEn: "Dermaflora Argan Oil & Honey roll-on – nourishing deodorant with argan and honey.\n\n• Hungarian dermo brand trusted in pharmacies.\n• Skin-conscious daily underarm care.\n• 50ml roll-on or stick as labeled.",
  },
  {
    barcode: "5997001719558",
    brandKey: "dermaflora",
    price: 11500,
    originalPrice: 13000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ديرمافلورا Sensitive – عصا جل MSM 50 مل",
    nameEn: "Dermaflora - Sensitive MSM Gel Stick Deodorant 50ml",
    descriptionAr: "عصا جل MSM للبشرة الحساسة.\n\n• ماركة مجريية معتمدة في الصيدليات.\n• عناية يومية للبشرة تحت الذراع.\n• 50 مل حسب نوع المنتج.",
    descriptionEn: "Dermaflora Sensitive MSM gel stick – gentle solid deodorant for irritated skin.\n\n• Hungarian dermo brand trusted in pharmacies.\n• Skin-conscious daily underarm care.\n• 50ml roll-on or stick as labeled.",
  },
  {
    barcode: "5997001719534",
    brandKey: "dermaflora",
    price: 10500,
    originalPrice: 12000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ديرمافلورا 0% – رول أون ألوي فيرا 50 مل",
    nameEn: "Dermaflora - 0% Aloe Vera Roll-On Deodorant 50ml",
    descriptionAr: "رول أون ألوي فيرا بصيغة 0%.\n\n• ماركة مجريية معتمدة في الصيدليات.\n• عناية يومية للبشرة تحت الذراع.\n• 50 مل حسب نوع المنتج.",
    descriptionEn: "Dermaflora 0% Aloe Vera roll-on – minimalist formula with soothing aloe.\n\n• Hungarian dermo brand trusted in pharmacies.\n• Skin-conscious daily underarm care.\n• 50ml roll-on or stick as labeled.",
  },
  {
    barcode: "5997001719718",
    brandKey: "dermaflora",
    price: 10800,
    originalPrice: 12300,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ديرمافلورا – رول أون بزيت جوز الهند 50 مل",
    nameEn: "Dermaflora - Coconut Oil Roll-On Deodorant 50ml",
    descriptionAr: "رول أون بزيت جوز الهند.\n\n• ماركة مجريية معتمدة في الصيدليات.\n• عناية يومية للبشرة تحت الذراع.\n• 50 مل حسب نوع المنتج.",
    descriptionEn: "Dermaflora Coconut Oil roll-on – tropical coconut note with dermo care.\n\n• Hungarian dermo brand trusted in pharmacies.\n• Skin-conscious daily underarm care.\n• 50ml roll-on or stick as labeled.",
  },
  {
    barcode: "5997001719831",
    brandKey: "dermaflora",
    price: 10800,
    originalPrice: 12300,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ديرمافلورا – رول أون ورد الفيك 50 مل",
    nameEn: "Dermaflora - Rosehip Roll-On Deodorant 50ml",
    descriptionAr: "رول أون ورد الفيك.\n\n• ماركة مجريية معتمدة في الصيدليات.\n• عناية يومية للبشرة تحت الذراع.\n• 50 مل حسب نوع المنتج.",
    descriptionEn: "Dermaflora Rosehip roll-on – soft rosehip scent, skin-friendly base.\n\n• Hungarian dermo brand trusted in pharmacies.\n• Skin-conscious daily underarm care.\n• 50ml roll-on or stick as labeled.",
  },
  {
    barcode: "5997001719756",
    brandKey: "dermaflora",
    price: 11000,
    originalPrice: 12500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ديرمافلورا For Him Intensity – رول أون للرجال 50 مل",
    nameEn: "Dermaflora - For Him Intensity Roll-On Deodorant 50ml",
    descriptionAr: "رول أون للرجال Intensity.\n\n• ماركة مجريية معتمدة في الصيدليات.\n• عناية يومية للبشرة تحت الذراع.\n• 50 مل حسب نوع المنتج.",
    descriptionEn: "Dermaflora For Him Intensity roll-on – masculine daily protection.\n\n• Hungarian dermo brand trusted in pharmacies.\n• Skin-conscious daily underarm care.\n• 50ml roll-on or stick as labeled.",
  },
  {
    barcode: "9005800379289",
    brandKey: "nivea",
    price: 12500,
    originalPrice: 14000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا Derma Dry Control 96H – 50 مل",
    nameEn: "NIVEA - Derma Dry Control 96H Roll-On 50ml",
    descriptionAr: "حماية تجفيف تصل 96 ساعة.\n\n• جودة نيفيا العالمية.\n• على بشرة نظيفة وجافة.\n• حماية مزيل عرق طويلة.",
    descriptionEn: "NIVEA Derma Dry Control 96H roll-on – extended anti-perspirant protection.\n\n• NIVEA quality trusted worldwide.\n• Apply to clean, dry underarms.\n• Long-lasting deodorant protection.",
  },
  {
    barcode: "9005800379128",
    brandKey: "nivea",
    price: 11800,
    originalPrice: 13300,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا Black & White Invisible Pure 48H – 50 مل",
    nameEn: "NIVEA - Black & White Invisible Pure 48H Roll-On 50ml",
    descriptionAr: "ضد البقع على الأسود والأصفر.\n\n• جودة نيفيا العالمية.\n• على بشرة نظيفة وجافة.\n• حماية مزيل عرق طويلة.",
    descriptionEn: "NIVEA Black & White Invisible Pure 48H – anti white marks on black clothes.\n\n• NIVEA quality trusted worldwide.\n• Apply to clean, dry underarms.\n• Long-lasting deodorant protection.",
  },
  {
    barcode: "9005800356440",
    brandKey: "nivea",
    price: 11500,
    originalPrice: 13000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا Pearl & Beauty Black – 50 مل",
    nameEn: "NIVEA - Pearl & Beauty Black Roll-On 50ml",
    descriptionAr: "بيرل وجمال للبشرة الناعمة.\n\n• جودة نيفيا العالمية.\n• على بشرة نظيفة وجافة.\n• حماية مزيل عرق طويلة.",
    descriptionEn: "NIVEA Pearl & Beauty Black roll-on – pearl extract and smooth skin feel.\n\n• NIVEA quality trusted worldwide.\n• Apply to clean, dry underarms.\n• Long-lasting deodorant protection.",
  },
  {
    barcode: "9005800379098",
    brandKey: "nivea",
    price: 11800,
    originalPrice: 13300,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا Black & White Invisible Clear – 50 مل",
    nameEn: "NIVEA - Black & White Invisible Clear Roll-On 50ml",
    descriptionAr: "فورمولا Invisible Clear.\n\n• جودة نيفيا العالمية.\n• على بشرة نظيفة وجافة.\n• حماية مزيل عرق طويلة.",
    descriptionEn: "NIVEA Black & White Invisible Clear roll-on.\n\n• NIVEA quality trusted worldwide.\n• Apply to clean, dry underarms.\n• Long-lasting deodorant protection.",
  },
  {
    barcode: "9005800378978",
    brandKey: "nivea",
    price: 11800,
    originalPrice: 13300,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا Black & White Silky Smooth – 50 مل",
    nameEn: "NIVEA - Black & White Invisible Silky Smooth Roll-On 50ml",
    descriptionAr: "Silky Smooth – ملمس ناعم.\n\n• جودة نيفيا العالمية.\n• على بشرة نظيفة وجافة.\n• حماية مزيل عرق طويلة.",
    descriptionEn: "NIVEA Black & White Invisible Silky Smooth – soft skin feel.\n\n• NIVEA quality trusted worldwide.\n• Apply to clean, dry underarms.\n• Long-lasting deodorant protection.",
  },
  {
    barcode: "9005800379173",
    brandKey: "nivea",
    price: 12000,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا Fresh Rose Touch 72H – 50 مل",
    nameEn: "NIVEA - Fresh Rose Touch 72H Roll-On 50ml",
    descriptionAr: "رائحة الورد 72 ساعة.\n\n• جودة نيفيا العالمية.\n• على بشرة نظيفة وجافة.\n• حماية مزيل عرق طويلة.",
    descriptionEn: "NIVEA Fresh Rose Touch 72H roll-on – rose-scented protection.\n\n• NIVEA quality trusted worldwide.\n• Apply to clean, dry underarms.\n• Long-lasting deodorant protection.",
  },
  {
    barcode: "9005800342788",
    brandKey: "nivea",
    price: 11000,
    originalPrice: 12500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا للرجال Fresh Kick – 50 مل",
    nameEn: "NIVEA - Men Fresh Kick Roll-On 50ml",
    descriptionAr: "رائحة رجالية منعشة.\n\n• جودة نيفيا العالمية.\n• على بشرة نظيفة وجافة.\n• حماية مزيل عرق طويلة.",
    descriptionEn: "NIVEA Men Fresh Kick roll-on – energetic masculine scent.\n\n• NIVEA quality trusted worldwide.\n• Apply to clean, dry underarms.\n• Long-lasting deodorant protection.",
  },
  {
    barcode: "42241980",
    brandKey: "nivea",
    price: 11000,
    originalPrice: 12500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا للرجال Cool Kick – 50 مل",
    nameEn: "NIVEA - Men Cool Kick Roll-On 50ml",
    descriptionAr: "Cool Kick – إحساس برد.\n\n• جودة نيفيا العالمية.\n• على بشرة نظيفة وجافة.\n• حماية مزيل عرق طويلة.",
    descriptionEn: "NIVEA Men Cool Kick roll-on – cooling kick fragrance.\n\n• NIVEA quality trusted worldwide.\n• Apply to clean, dry underarms.\n• Long-lasting deodorant protection.",
  },
  {
    barcode: "42349822",
    brandKey: "nivea",
    price: 11200,
    originalPrice: 12700,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا للرجال Deep Black Carbon – 50 مل",
    nameEn: "NIVEA - Men Deep Black Carbon Roll-On 50ml",
    descriptionAr: "Deep Black Carbon – فحم.\n\n• جودة نيفيا العالمية.\n• على بشرة نظيفة وجافة.\n• حماية مزيل عرق طويلة.",
    descriptionEn: "NIVEA Men Deep Black Carbon roll-on.\n\n• NIVEA quality trusted worldwide.\n• Apply to clean, dry underarms.\n• Long-lasting deodorant protection.",
  },
  {
    barcode: "9005800379685",
    brandKey: "nivea",
    price: 11200,
    originalPrice: 12700,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا للرجال Deep – 50 مل",
    nameEn: "NIVEA - Men Deep Roll-On 50ml",
    descriptionAr: "خط Deep الكلاسيكي.\n\n• جودة نيفيا العالمية.\n• على بشرة نظيفة وجافة.\n• حماية مزيل عرق طويلة.",
    descriptionEn: "NIVEA Men Deep roll-on – classic deep scent.\n\n• NIVEA quality trusted worldwide.\n• Apply to clean, dry underarms.\n• Long-lasting deodorant protection.",
  },
  {
    barcode: "9005800379494",
    brandKey: "nivea",
    price: 11500,
    originalPrice: 13000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا للرجال Deep Sport Maxx Tech – 50 مل",
    nameEn: "NIVEA - Men Deep Sport Maxx Tech Roll-On 50ml",
    descriptionAr: "Deep Sport للرياضة.\n\n• جودة نيفيا العالمية.\n• على بشرة نظيفة وجافة.\n• حماية مزيل عرق طويلة.",
    descriptionEn: "NIVEA Men Deep Sport Maxx Tech – sport-grade roll-on.\n\n• NIVEA quality trusted worldwide.\n• Apply to clean, dry underarms.\n• Long-lasting deodorant protection.",
  },
  {
    barcode: "42240709",
    brandKey: "nivea",
    price: 11800,
    originalPrice: 13300,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا للرجال Invisible Black & White – 50 مل",
    nameEn: "NIVEA - Men Invisible Black & White Original Roll-On 50ml",
    descriptionAr: "ضد البقع للرجال.\n\n• جودة نيفيا العالمية.\n• على بشرة نظيفة وجافة.\n• حماية مزيل عرق طويلة.",
    descriptionEn: "NIVEA Men Invisible Black & White Original – anti-mark protection.\n\n• NIVEA quality trusted worldwide.\n• Apply to clean, dry underarms.\n• Long-lasting deodorant protection.",
  },
  {
    barcode: "42242314",
    brandKey: "nivea",
    price: 11200,
    originalPrice: 12700,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا للرجال Silver Protect – 50 مل",
    nameEn: "NIVEA - Men Silver Protect Roll-On 50ml",
    descriptionAr: "Silver Protect – فضة.\n\n• جودة نيفيا العالمية.\n• على بشرة نظيفة وجافة.\n• حماية مزيل عرق طويلة.",
    descriptionEn: "NIVEA Men Silver Protect roll-on – silver antibacterial line.\n\n• NIVEA quality trusted worldwide.\n• Apply to clean, dry underarms.\n• Long-lasting deodorant protection.",
  },
  {
    barcode: "42283409",
    brandKey: "nivea",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا Fresh Comfort – مزيل عرق 150 مل",
    nameEn: "NIVEA - Fresh Comfort Deodorant 150ml",
    descriptionAr: "فرش كومفورت – 150 مل.\n\n• جودة نيفيا العالمية.\n• على بشرة نظيفة وجافة.\n• حماية مزيل عرق طويلة.",
    descriptionEn: "NIVEA Fresh Comfort deodorant 150ml – larger fresh comfort size.\n\n• NIVEA quality trusted worldwide.\n• Apply to clean, dry underarms.\n• Long-lasting deodorant protection.",
  },
  {
    barcode: "3760095254548",
    brandKey: "acm",
    price: 13500,
    originalPrice: 14500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "إيه سي إم – رول أون ملطّف 50 مل",
    nameEn: "ACM - Soothing Deodorant Roll-On 50ml",
    descriptionAr: "رول أون ملطّف – يهدئ التهيج.\n\n• ماركة صيدلية فرنسية.\n• 50 مل.\n• للبشرة الحساسة.",
    descriptionEn: "ACM Soothing deodorant roll-on – calms irritated underarm skin while controlling odour.\n\n• French pharmacy dermo brand.\n• 50ml roll-on.\n• For sensitive underarms.",
  },
  {
    barcode: "3760095254555",
    brandKey: "acm",
    price: 13800,
    originalPrice: 14800,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "إيه سي إم 48H Moderate Fresh – 50 مل",
    nameEn: "ACM - 48H Moderate Fresh Antiperspirant Roll-On 50ml",
    descriptionAr: "48 ساعة Moderate Fresh – حماية متوازنة.\n\n• حماية 48 ساعة.\n• موصى به من الأطباء.\n• 50 مل.",
    descriptionEn: "ACM 48H Moderate Fresh antiperspirant – balanced protection for normal perspiration.\n\n• 48-hour moderate protection.\n• Dermatologist-trusted ACM.\n• 50ml roll-on.",
  },
  {
    barcode: "3760095254562",
    brandKey: "acm",
    price: 14000,
    originalPrice: 15000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "إيه سي إم – مضاد تعرق ملطّف 48H 50 مل",
    nameEn: "ACM - Soothing Anti-Perspirant 48H Roll-On 50ml",
    descriptionAr: "مضاد تعرق ملطّف 48 ساعة.\n\n• عناية ملطّفة مع مضاد التعرق.\n• 48 ساعة.\n• 50 مل.",
    descriptionEn: "ACM Soothing Anti-Perspirant 48H – soothing care with 48-hour wetness control.\n\n• Combines soothing + antiperspirant.\n• 48H protection claim.\n• 50ml.",
  },
  {
    barcode: "3616303842130",
    brandKey: "adidas",
    price: 11800,
    originalPrice: 13300,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "أديداس Fresh Endurance – رول أون مزيل عرق 50 مل",
    nameEn: "Adidas - Fresh Endurance Roll-On Deodorant 50ml",
    descriptionAr: "أديداس Fresh Endurance – مزيل عرق رول أون رياضية Fresh Endurance لحماية مريحة طوال اليوم في الجو الحار.\n\n• أمبولة رول أون لتوزيع متساوٍ على بشرة نظيفة وجافة.\n• يساعد على تقليل رائحة العرق مع عطر لطيف.\n• 50 مل – مناسب للاستخدام اليومي والسفر.",
    descriptionEn: "Adidas Fresh Endurance roll-on deodorant – sporty Fresh Endurance scent for reliable daily freshness in warm weather.\n\n• Roll-on applicator for even, controlled coverage on clean dry skin.\n• Helps reduce underarm odour while leaving a pleasant scent.\n• 50ml size – handy for daily use, work and travel.",
  },
  {
    barcode: "3616303842123",
    brandKey: "adidas",
    price: 11800,
    originalPrice: 13300,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "أديداس Power Booster – رول أون مزيل عرق 50 مل",
    nameEn: "Adidas - Power Booster Roll-On Deodorant 50ml",
    descriptionAr: "أديداس Power Booster – مزيل عرق رول أون منشطة Power Booster لحماية مريحة طوال اليوم في الجو الحار.\n\n• أمبولة رول أون لتوزيع متساوٍ على بشرة نظيفة وجافة.\n• يساعد على تقليل رائحة العرق مع عطر لطيف.\n• 50 مل – مناسب للاستخدام اليومي والسفر.",
    descriptionEn: "Adidas Power Booster roll-on deodorant – energising Power Booster fragrance for reliable daily freshness in warm weather.\n\n• Roll-on applicator for even, controlled coverage on clean dry skin.\n• Helps reduce underarm odour while leaving a pleasant scent.\n• 50ml size – handy for daily use, work and travel.",
  },
  {
    barcode: "3616303439972",
    brandKey: "adidas",
    price: 12000,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "أديداس Pro Invisible Men – رول أون مزيل عرق 50 مل",
    nameEn: "Adidas - Pro Invisible Men Roll-On Deodorant 50ml",
    descriptionAr: "أديداس Pro Invisible Men – مزيل عرق رول أون Pro Invisible للرجال لحماية مريحة طوال اليوم في الجو الحار.\n\n• أمبولة رول أون لتوزيع متساوٍ على بشرة نظيفة وجافة.\n• يساعد على تقليل رائحة العرق مع عطر لطيف.\n• 50 مل – مناسب للاستخدام اليومي والسفر.",
    descriptionEn: "Adidas Pro Invisible Men roll-on deodorant – invisible Pro protection for men for reliable daily freshness in warm weather.\n\n• Roll-on applicator for even, controlled coverage on clean dry skin.\n• Helps reduce underarm odour while leaving a pleasant scent.\n• 50ml size – handy for daily use, work and travel.",
  },
  {
    barcode: "5281018088142",
    brandKey: "beesline",
    price: 12500,
    originalPrice: 14000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بيزلين Vitamin C Instant White – رول أون تبييض 50 مل",
    nameEn: "Beesline - Vitamin C Instant White Whitening Roll-On Deodorant 50ml",
    descriptionAr: "بيزلين Vitamin C Instant White – تبييض ومزيل عرق 50 مل.\n\n• خط تبييض مطلوب في المنطقة.\n• تركيبات طبيعية مستوحاة.\n• 50 مل يومياً.",
    descriptionEn: "Beesline Vitamin C Instant White whitening roll-on – deodorant protection with brightening care.\n\n• Whitening range popular in the Middle East.\n• Natural-inspired Beesline formula.\n• 50ml daily use.",
  },
  {
    barcode: "5281018003152",
    brandKey: "beesline",
    price: 12000,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بيزلين Elder Rose – رول أون تبييض 50 مل",
    nameEn: "Beesline - Elder Rose Whitening Roll-On Deodorant 50ml",
    descriptionAr: "بيزلين Elder Rose – تبييض ومزيل عرق 50 مل.\n\n• خط تبييض مطلوب في المنطقة.\n• تركيبات طبيعية مستوحاة.\n• 50 مل يومياً.",
    descriptionEn: "Beesline Elder Rose whitening roll-on – deodorant protection with brightening care.\n\n• Whitening range popular in the Middle East.\n• Natural-inspired Beesline formula.\n• 50ml daily use.",
  },
  {
    barcode: "5281018003862",
    brandKey: "beesline",
    price: 12000,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بيزلين Invisible Touch – رول أون تبييض 50 مل",
    nameEn: "Beesline - Invisible Touch Whitening Roll-On Deodorant 50ml",
    descriptionAr: "بيزلين Invisible Touch – تبييض ومزيل عرق 50 مل.\n\n• خط تبييض مطلوب في المنطقة.\n• تركيبات طبيعية مستوحاة.\n• 50 مل يومياً.",
    descriptionEn: "Beesline Invisible Touch whitening roll-on – deodorant protection with brightening care.\n\n• Whitening range popular in the Middle East.\n• Natural-inspired Beesline formula.\n• 50ml daily use.",
  },
  {
    barcode: "5281018003909",
    brandKey: "beesline",
    price: 12200,
    originalPrice: 13700,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بيزلين Beauty Pearl – رول أون تبييض 50 مل",
    nameEn: "Beesline - Beauty Pearl Whitening Roll-On Deodorant 50ml",
    descriptionAr: "بيزلين Beauty Pearl – تبييض ومزيل عرق 50 مل.\n\n• خط تبييض مطلوب في المنطقة.\n• تركيبات طبيعية مستوحاة.\n• 50 مل يومياً.",
    descriptionEn: "Beesline Beauty Pearl whitening roll-on – deodorant protection with brightening care.\n\n• Whitening range popular in the Middle East.\n• Natural-inspired Beesline formula.\n• 50ml daily use.",
  },
  {
    barcode: "5281018003251",
    brandKey: "beesline",
    price: 12800,
    originalPrice: 14300,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بيزلين Hair-Delaying 3-in-1 – رول أون تبييض 50 مل",
    nameEn: "Beesline - Hair-Delaying 3-in-1 Whitening Roll-On Deodorant 50ml",
    descriptionAr: "بيزلين Hair-Delaying 3-in-1 – تبييض ومزيل عرق 50 مل.\n\n• خط تبييض مطلوب في المنطقة.\n• تركيبات طبيعية مستوحاة.\n• 50 مل يومياً.",
    descriptionEn: "Beesline Hair-Delaying 3-in-1 whitening roll-on – deodorant protection with brightening care.\n\n• Whitening range popular in the Middle East.\n• Natural-inspired Beesline formula.\n• 50ml daily use.",
  },
  {
    barcode: "5281018088166",
    brandKey: "beesline",
    price: 12500,
    originalPrice: 14000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بيزلين Super Dry Jouri Rose – رول أون تبييض 50 مل",
    nameEn: "Beesline - Super Dry Jouri Rose Whitening Roll-On Deodorant 50ml",
    descriptionAr: "بيزلين Super Dry Jouri Rose – تبييض ومزيل عرق 50 مل.\n\n• خط تبييض مطلوب في المنطقة.\n• تركيبات طبيعية مستوحاة.\n• 50 مل يومياً.",
    descriptionEn: "Beesline Super Dry Jouri Rose whitening roll-on – deodorant protection with brightening care.\n\n• Whitening range popular in the Middle East.\n• Natural-inspired Beesline formula.\n• 50ml daily use.",
  },
  {
    barcode: "5281018003176",
    brandKey: "beesline",
    price: 12000,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بيزلين Pacific Islands – رول أون تبييض 50 مل",
    nameEn: "Beesline - Pacific Islands Whitening Roll-On Deodorant 50ml",
    descriptionAr: "بيزلين Pacific Islands – تبييض ومزيل عرق 50 مل.\n\n• خط تبييض مطلوب في المنطقة.\n• تركيبات طبيعية مستوحاة.\n• 50 مل يومياً.",
    descriptionEn: "Beesline Pacific Islands whitening roll-on – deodorant protection with brightening care.\n\n• Whitening range popular in the Middle East.\n• Natural-inspired Beesline formula.\n• 50ml daily use.",
  },
  {
    barcode: "5281018003183",
    brandKey: "beesline",
    price: 12000,
    originalPrice: 13500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بيزلين Cool Breeze – رول أون تبييض 50 مل",
    nameEn: "Beesline - Cool Breeze Whitening Roll-On Deodorant 50ml",
    descriptionAr: "بيزلين Cool Breeze – تبييض ومزيل عرق 50 مل.\n\n• خط تبييض مطلوب في المنطقة.\n• تركيبات طبيعية مستوحاة.\n• 50 مل يومياً.",
    descriptionEn: "Beesline Cool Breeze whitening roll-on – deodorant protection with brightening care.\n\n• Whitening range popular in the Middle East.\n• Natural-inspired Beesline formula.\n• 50ml daily use.",
  },
  {
    barcode: "5281018003893",
    brandKey: "beesline",
    price: 12200,
    originalPrice: 13700,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بيزلين Sport Pulse – رول أون تبييض 50 مل",
    nameEn: "Beesline - Sport Pulse Whitening Roll-On Deodorant 50ml",
    descriptionAr: "بيزلين Sport Pulse – تبييض ومزيل عرق 50 مل.\n\n• خط تبييض مطلوب في المنطقة.\n• تركيبات طبيعية مستوحاة.\n• 50 مل يومياً.",
    descriptionEn: "Beesline Sport Pulse whitening roll-on – deodorant protection with brightening care.\n\n• Whitening range popular in the Middle East.\n• Natural-inspired Beesline formula.\n• 50ml daily use.",
  },
  {
    barcode: "8851445922806",
    brandKey: "ui",
    price: 13500,
    originalPrice: 15000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "يو آند آي ألوي فيرا والشاي الأخضر – مزيل عرق كريستال طبيعي 80 غرام",
    nameEn: "U&I - Aloe Vera & Green Tea Natural Crystal Deodorant 80g",
    descriptionAr: "يو آند آي كريستال طبيعي ألوي فيرا والشاي الأخضر 80 غرام – بدون كحول.\n\n• يدوم أسابيع عند الاستخدام الصحيح.\n• بلّل بالماء ومرّر على بشرة نظيفة.\n• نكهة ألوي فيرا والشاي الأخضر.",
    descriptionEn: "U&I Aloe Vera & Green Tea natural crystal deodorant 80g – alum crystal with botanical notes, alcohol-free.\n\n• 80g crystal lasts weeks with proper use.\n• Wet stone slightly and glide on clean skin.\n• Aloe Vera & Green Tea botanical variant.",
  },
  {
    barcode: "8851445952803",
    brandKey: "ui",
    price: 13800,
    originalPrice: 15300,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "يو آند آي المانجوستين – مزيل عرق كريستال طبيعي 80 غرام",
    nameEn: "U&I - Mangosteen Natural Crystal Deodorant 80g",
    descriptionAr: "يو آند آي كريستال طبيعي المانجوستين 80 غرام – بدون كحول.\n\n• يدوم أسابيع عند الاستخدام الصحيح.\n• بلّل بالماء ومرّر على بشرة نظيفة.\n• نكهة المانجوستين.",
    descriptionEn: "U&I Mangosteen natural crystal deodorant 80g – alum crystal with botanical notes, alcohol-free.\n\n• 80g crystal lasts weeks with proper use.\n• Wet stone slightly and glide on clean skin.\n• Mangosteen botanical variant.",
  },
  {
    barcode: "8851445962802",
    brandKey: "ui",
    price: 13500,
    originalPrice: 15000,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "يو آند آي جوز الهند – مزيل عرق كريستال طبيعي 80 غرام",
    nameEn: "U&I - Coconut Natural Crystal Deodorant 80g",
    descriptionAr: "يو آند آي كريستال طبيعي جوز الهند 80 غرام – بدون كحول.\n\n• يدوم أسابيع عند الاستخدام الصحيح.\n• بلّل بالماء ومرّر على بشرة نظيفة.\n• نكهة جوز الهند.",
    descriptionEn: "U&I Coconut natural crystal deodorant 80g – alum crystal with botanical notes, alcohol-free.\n\n• 80g crystal lasts weeks with proper use.\n• Wet stone slightly and glide on clean skin.\n• Coconut botanical variant.",
  },
  {
    barcode: "8851445942804",
    brandKey: "ui",
    price: 14000,
    originalPrice: 15500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "يو آند آي كركم وفاكهة النجم – مزيل عرق كريستال طبيعي 80 غرام",
    nameEn: "U&I - Turmeric & Star Fruit Natural Crystal Deodorant 80g",
    descriptionAr: "يو آند آي كريستال طبيعي كركم وفاكهة النجم 80 غرام – بدون كحول.\n\n• يدوم أسابيع عند الاستخدام الصحيح.\n• بلّل بالماء ومرّر على بشرة نظيفة.\n• نكهة كركم وفاكهة النجم.",
    descriptionEn: "U&I Turmeric & Star Fruit natural crystal deodorant 80g – alum crystal with botanical notes, alcohol-free.\n\n• 80g crystal lasts weeks with proper use.\n• Wet stone slightly and glide on clean skin.\n• Turmeric & Star Fruit botanical variant.",
  }
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
  console.log(`Brand: ${b.brandEn} / ${b.brandAr} (${resolved.brand.id})${resolved.created ? " [created]" : ""}`);
  return resolved.brand.id;
}

async function deleteIfExists(barcode: string): Promise<void> {
  const check = await api<{ exists: boolean; product?: { id: string; nameEn?: string } }>(
    `/products/barcode-check?barcode=${encodeURIComponent(barcode)}`,
  );
  if (!check.exists || !check.product?.id) return;
  console.log(`  deleting existing: ${check.product.id} (${check.product.nameEn ?? ""})`);
  await api(`/products/${check.product.id}`, "DELETE");
}

function slugify(nameEn: string, barcode: string): string {
  const base = nameEn
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base}-${barcode.slice(-6)}`;
}

async function createProduct(product: ProductDef, brandId: string): Promise<{ id: string }> {
  const brand = BRANDS[product.brandKey];
  const payload: Record<string, unknown> = {
    sku: `${brand.prefix}-${product.barcode.slice(-6)}`,
    barcode: product.barcode,
    slug: slugify(product.nameEn, product.barcode),
    brandId,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
    subcategoryIds: [product.subcategoryId],
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    descriptionAr: product.descriptionAr,
    descriptionEn: product.descriptionEn,
    price: product.price,
    originalPrice: product.originalPrice ?? product.price,
    stock: 0,
    isActive: true,
    imageIds: [] as string[],
  };
  if (product.tertiaryCategoryId) {
    payload.tertiaryCategoryId = product.tertiaryCategoryId;
    payload.tertiaryCategoryIds = [product.tertiaryCategoryId];
  }
  return api<{ id: string }>("/products", "POST", payload);
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

  const needed = new Set(PRODUCTS.map((p) => p.brandKey));
  const brandIds: Partial<Record<BrandKey, string>> = {};
  for (const key of needed) brandIds[key] = await resolveBrandId(key);
  console.log("");

  const results: Array<{ barcode: string; id: string; nameEn: string }> = [];
  const failures: Array<{ barcode: string; error: string }> = [];

  for (const product of PRODUCTS) {
    const brandId = brandIds[product.brandKey]!;
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
  console.log("─".repeat(100));
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
