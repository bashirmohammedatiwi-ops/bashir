/**
 * Deodorants + Suave Kids — separate SKUs, no shades, no images.
 * Names via GPT Luna; hard codes via GPT 5.6 Terra.
 * Usage: npx tsx scripts/add-deo-suave-batch52-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const BODY = "23aaaa07-91ee-4937-847e-d7866a9e937a";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const DEODORANT = "9464c921-9650-421f-8e2b-6a172f7524c5";
const BODY_CLEANSERS = "35be991e-3062-4fbd-8f0a-2393bf806524";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";

type BrandKey =
  | "dove"
  | "dovemen"
  | "rexona"
  | "nivea"
  | "niveamen"
  | "simple"
  | "alex"
  | "enchanteur"
  | "suavekids";

type ProductDef = {
  barcode: string;
  brandKey: BrandKey;
  price: number;
  subcategoryId: string;
  tertiaryCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const BRANDS: Record<BrandKey, { brandAr: string; brandEn: string; prefix: string }> = {
  dove: { brandAr: "دوف", brandEn: "Dove", prefix: "DOV" },
  dovemen: { brandAr: "دوف للرجال", brandEn: "Dove Men+Care", prefix: "DVM" },
  rexona: { brandAr: "ريكسونا", brandEn: "Rexona", prefix: "REX" },
  nivea: { brandAr: "نيفيا", brandEn: "NIVEA", prefix: "NIV" },
  niveamen: { brandAr: "نيفيا مين", brandEn: "NIVEA Men", prefix: "NVM" },
  simple: { brandAr: "سيمبل", brandEn: "Simple", prefix: "SMP" },
  alex: { brandAr: "أليكس", brandEn: "Alex", prefix: "ALX" },
  enchanteur: { brandAr: "إنشانتر", brandEn: "Enchanteur", prefix: "ENC" },
  suavekids: { brandAr: "سواف كيدز", brandEn: "Suave Kids", prefix: "SVK" },
};

export const UNRESOLVED_BARCODES = [
  "8888202061584",
  "8888202061690",
  "8888202061560",
  "8888202061683",
  "8888202061713",
  "8888202061706",
  "6291109866305",
  "6291109866299",
] as const;

const PRODUCTS: ProductDef[] = [
  // —— Dove women sprays ——
  {
    barcode: "8720181625381",
    brandKey: "dove",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "دوف Go Fresh – بخاخ مضاد للتعرق تفاح وشاي أبيض حماية 48 ساعة 250 مل",
    nameEn: "Dove Go Fresh Apple & White Tea Antiperspirant Deodorant Spray – 250 ml",
    descriptionAr:
      "بخاخ دوف Go Fresh بتفاح وشاي أبيض — حماية من العرق والرائحة حتى 48 ساعة مع ربع كريم مرطّب، خالٍ من الكحول ويساعد على تنعيم بشرة الإبط.\n\n• انتعاش يومي برائحة فاكهية خفيفة.\n• مناسب للبشرة الحساسة تحت الإبط.\n• الحجم: 250 مل.",
    descriptionEn:
      "Dove Go Fresh Apple & White Tea antiperspirant spray — up to 48-hour sweat and odor protection with ¼ moisturizing cream; alcohol-free and helps soften underarm skin.\n\n• Everyday freshness with a light fruity scent.\n• Kind to sensitive underarm skin.\n• Size: 250 ml.",
  },
  {
    barcode: "8717163997345",
    brandKey: "dove",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "دوف Original – بخاخ مضاد للتعرق الأصلي لحماية العرق والرائحة 250 مل",
    nameEn: "Dove Original Antiperspirant Deodorant Spray – 250 ml",
    descriptionAr:
      "بخاخ دوف الأصلي — حماية كلاسيكية من العرق والرائحة مع عناية مرطّبة تحت الإبط.\n\n• التركيبة الأشهر للاستخدام اليومي.\n• الحجم: 250 مل.",
    descriptionEn:
      "Dove Original antiperspirant deodorant spray — classic sweat and odor protection with underarm moisturizing care.\n\n• The iconic everyday formula.\n• Size: 250 ml.",
  },
  {
    barcode: "8717163004869",
    brandKey: "dove",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "دوف Go Fresh – بخاخ مضاد للتعرق خيار وشاي أخضر حماية 48 ساعة 250 مل",
    nameEn: "Dove Go Fresh Cucumber & Green Tea Antiperspirant Deodorant Spray – 250 ml",
    descriptionAr:
      "بخاخ دوف Go Fresh بخيار وشاي أخضر — حماية 48 ساعة وانتعاش منعش، 0% كحول ولطيف على البشرة.\n\n• رائحة نظيفة ومنعشة مثالية لأيام الحر.\n• الحجم: 250 مل.",
    descriptionEn:
      "Dove Go Fresh Cucumber & Green Tea antiperspirant spray — 48-hour protection with a refreshing scent; 0% alcohol and gentle on skin.\n\n• Clean freshness ideal for hot days.\n• Size: 250 ml.",
  },
  {
    barcode: "8720181625374",
    brandKey: "dove",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "دوف Fresh – بخاخ مضاد للتعرق فريش حماية 48 ساعة مع كريم مرطّب 250 مل",
    nameEn: "Dove Fresh Antiperspirant Deodorant Spray – 250 ml",
    descriptionAr:
      "بخاخ دوف فريش — حماية 48 ساعة من العرق والرائحة مع ربع كريم مرطّب و0% كحول، مناسب للبشرة الحساسة.\n\n• انتعاش يومي نظيف.\n• الحجم: 250 مل.",
    descriptionEn:
      "Dove Fresh antiperspirant spray — 48-hour sweat and odor protection with ¼ moisturizing cream and 0% alcohol; suitable for sensitive skin.\n\n• Clean everyday freshness.\n• Size: 250 ml.",
  },
  {
    barcode: "8710908559204",
    brandKey: "dove",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "دوف Go Fresh – بخاخ مضاد للتعرق كمثرى وألوفيرا حماية 48 ساعة 250 مل",
    nameEn: "Dove Go Fresh Pear & Aloe Vera Antiperspirant Deodorant Spray – 250 ml",
    descriptionAr:
      "بخاخ دوف Go Fresh بكمثرى وألوفيرا — حماية 48 ساعة مع ترطيب وتهدئة بشرة الإبط، خالٍ من الكحول.\n\n• رائحة فاكهية ناعمة.\n• الحجم: 250 مل.",
    descriptionEn:
      "Dove Go Fresh Pear & Aloe Vera antiperspirant spray — 48-hour protection with soothing moisturizing care; alcohol-free.\n\n• Soft fruity scent.\n• Size: 250 ml.",
  },
  {
    barcode: "8717163997383",
    brandKey: "dove",
    price: 10500,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "دوف Invisible Dry Clean Touch – بخاخ مضاد للتعرق بدون آثار بيضاء 250 مل",
    nameEn: "Dove Invisible Dry Clean Touch Antiperspirant Deodorant Spray – 250 ml",
    descriptionAr:
      "بخاخ دوف إنفيزيبل دراي — يساعد على تقليل الآثار البيضاء على الملابس مع حماية طويلة وربع كريم مرطّب و0% كحول.\n\n• مناسب للملابس الداكنة والفاتحة.\n• الحجم: 250 مل.",
    descriptionEn:
      "Dove Invisible Dry Clean Touch antiperspirant spray — helps reduce white marks on clothes with long-lasting protection, ¼ moisturizing cream and 0% alcohol.\n\n• Suitable for dark and light clothing.\n• Size: 250 ml.",
  },
  {
    barcode: "8720181624568",
    brandKey: "dove",
    price: 11000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "دوف Advanced Care – بخاخ مضاد للتعرق باشن فروت وعشب الليمون حماية 72 ساعة 250 مل",
    nameEn: "Dove Advanced Care Passion Fruit & Lemongrass Antiperspirant Spray – 250 ml",
    descriptionAr:
      "بخاخ دوف Advanced Care بباشن فروت وعشب الليمون — حماية تصل إلى 72 ساعة بتقنية الترطيب الثلاثي، خالٍ من الكحول ويساعد على تهدئة تهيج الحلاقة.\n\n• حماية أقوى لأيام أطول.\n• الحجم: 250 مل.",
    descriptionEn:
      "Dove Advanced Care Passion Fruit & Lemongrass antiperspirant spray — up to 72-hour protection with Triple Moisturising Technology; alcohol-free and helps reduce shaving irritation.\n\n• Stronger protection for longer days.\n• Size: 250 ml.",
  },
  {
    barcode: "8717163714942",
    brandKey: "dove",
    price: 10500,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "دوف Nourishing Secrets – بخاخ مضاد للتعرق جوز الهند وزهرة الياسمين حماية 48 ساعة 250 مل",
    nameEn: "Dove Nourishing Secrets Coconut & Jasmine Flower Antiperspirant Spray – 250 ml",
    descriptionAr:
      "بخاخ دوف Nourishing Secrets بجوز الهند وزهرة الياسمين — حماية 48 ساعة مع ترطيب ورائحة أنثوية دافئة، 0% كحول.\n\n• طقس يومي فاخر تحت الإبط.\n• الحجم: 250 مل.",
    descriptionEn:
      "Dove Nourishing Secrets Coconut & Jasmine Flower antiperspirant spray — 48-hour protection with moisturizing care and a warm feminine scent; 0% alcohol.\n\n• Everyday underarm ritual with a luxurious scent.\n• Size: 250 ml.",
  },
  // —— Rexona ——
  {
    barcode: "7791293046693",
    brandKey: "rexona",
    price: 9000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ريكسونا Advanced Protection – بخاخ مضاد للتعرق بامبو وألوفيرا حماية 72 ساعة 200 مل",
    nameEn: "Rexona Advanced Protection Bamboo & Aloe Vera Antiperspirant Spray – 200 ml",
    descriptionAr:
      "بخاخ ريكسونا Advanced Protection بامبو وألوفيرا — حماية حتى 72 ساعة بتقنية MotionSense، 0% كحول ويجف بسرعة دون آثار ظاهرة.\n\n• انتعاش يتحرّك معك.\n• الحجم: 200 مل.",
    descriptionEn:
      "Rexona Advanced Protection Bamboo & Aloe Vera antiperspirant spray — up to 72-hour protection with MotionSense; 0% alcohol, quick-drying and invisible finish.\n\n• Freshness activated by movement.\n• Size: 200 ml.",
  },
  {
    barcode: "8714100019757",
    brandKey: "rexona",
    price: 9000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ريكسونا MotionSense – بخاخ مضاد للتعرق Antibacterial Protection حماية 48 ساعة 200 مل",
    nameEn: "Rexona MotionSense Antibacterial Protection Antiperspirant Spray – 200 ml",
    descriptionAr:
      "بخاخ ريكسونا مضاد للبكتيريا MotionSense — حماية 48 ساعة ويقلل البكتيريا المسببة للرائحة مع انتعاش حمضيات وأوكالبتوس يتحرّك معك.\n\n• حماية يومية قوية من الرائحة.\n• الحجم: 200 مل.",
    descriptionEn:
      "Rexona MotionSense Antibacterial Protection antiperspirant spray — 48-hour protection that helps reduce odor-causing bacteria with a clean citrus-eucalyptus freshness activated by movement.\n\n• Strong everyday odor defense.\n• Size: 200 ml.",
  },
  {
    barcode: "7791293046686",
    brandKey: "rexona",
    price: 9000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ريكسونا نساء – بخاخ مضاد للتعرق Cotton Dry حماية 48 ساعة 200 مل",
    nameEn: "Rexona Women Cotton Dry Antiperspirant Deodorant Spray – 200 ml",
    descriptionAr:
      "بخاخ ريكسونا النسائي Cotton Dry — حماية 48 ساعة بتقنية MotionSense ورائحة قطن نظيفة خفيفة، خالٍ من الكحول.\n\n• إحساس جاف ونظيف طوال اليوم.\n• الحجم: 200 مل.",
    descriptionEn:
      "Rexona Women Cotton Dry antiperspirant spray — 48-hour protection with MotionSense and a light clean cotton scent; alcohol-free.\n\n• Dry, clean feel all day.\n• Size: 200 ml.",
  },
  {
    barcode: "7791293046679",
    brandKey: "rexona",
    price: 9500,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ريكسونا Advanced Protection Invisible – بخاخ مضاد للتعرق بدون آثار حماية 72 ساعة 200 مل",
    nameEn: "Rexona Advanced Protection Invisible Antiperspirant Spray – 200 ml",
    descriptionAr:
      "بخاخ ريكسونا Advanced Invisible — حماية حتى 72 ساعة ويقلل الآثار البيضاء، MotionSense و0% كحول.\n\n• مثالي للملابس الداكنة.\n• الحجم: 200 مل.",
    descriptionEn:
      "Rexona Advanced Protection Invisible antiperspirant spray — up to 72-hour protection that helps minimize white marks; MotionSense and 0% alcohol.\n\n• Ideal for dark clothing.\n• Size: 200 ml.",
  },
  {
    barcode: "7791293046716",
    brandKey: "rexona",
    price: 9000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ريكسونا نساء – بخاخ مضاد للتعرق Antibacterial Protection حماية 48 ساعة 200 مل",
    nameEn: "Rexona Women Antibacterial Protection Antiperspirant Spray – 200 ml",
    descriptionAr:
      "بخاخ ريكسونا النسائي المضاد للبكتيريا — حماية 48 ساعة من العرق والرائحة بتقنية MotionSense، خالٍ من الكحول.\n\n• حماية أنثوية يومية قوية.\n• الحجم: 200 مل.",
    descriptionEn:
      "Rexona Women Antibacterial Protection antiperspirant spray — 48-hour sweat and odor protection with MotionSense; alcohol-free.\n\n• Strong everyday feminine protection.\n• Size: 200 ml.",
  },
  {
    barcode: "7791293046662",
    brandKey: "rexona",
    price: 9500,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ريكسونا رجال – بخاخ مضاد للتعرق Advanced Antibacterial حماية 72 ساعة 200 مل",
    nameEn: "Rexona Men Advanced Protection Antibacterial Antiperspirant Spray – 200 ml",
    descriptionAr:
      "بخاخ ريكسونا الرجالي Advanced Antibacterial — حماية تصل إلى 72 ساعة ضد العرق والرائحة والبكتيريا مع MotionSense و0% كحول.\n\n• مناسب لأيام النشاط والحر.\n• الحجم: 200 مل.",
    descriptionEn:
      "Rexona Men Advanced Protection Antibacterial antiperspirant spray — up to 72-hour protection against sweat, odor and bacteria with MotionSense; 0% alcohol.\n\n• Built for active, hot days.\n• Size: 200 ml.",
  },
  // —— NIVEA ——
  {
    barcode: "4005900493002",
    brandKey: "nivea",
    price: 8500,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا نساء – بخاخ مضاد للتعرق Dry Fresh حماية 48 ساعة 200 مل",
    nameEn: "NIVEA Woman Dry Fresh Antiperspirant Deodorant Spray – 200 ml",
    descriptionAr:
      "بخاخ نيفيا النسائي Dry Fresh — حماية 48 ساعة بتركيبة DualActive، بدون كحول إيثيلي، موافق عليه جلدياً.\n\n• جفاف وانتعاش يومي.\n• الحجم: 200 مل.",
    descriptionEn:
      "NIVEA Woman Dry Fresh antiperspirant spray — 48-hour protection with DualActive formula; 0% ethyl alcohol and dermatologically approved.\n\n• Everyday dry freshness.\n• Size: 200 ml.",
  },
  {
    barcode: "4005808816194",
    brandKey: "nivea",
    price: 8000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا نساء – بخاخ مزيل عرق Fresh Natural للانتعاش والحماية اليومية 200 مل",
    nameEn: "NIVEA Fresh Natural Deodorant Spray for Women – 200 ml",
    descriptionAr:
      "بخاخ نيفيا Fresh Natural للنساء — حماية يومية من الرائحة برائحة طبيعية منعشة.\n\n• انتعاش خفيف للاستخدام اليومي.\n• الحجم: 200 مل.",
    descriptionEn:
      "NIVEA Fresh Natural deodorant spray for women — daily odor protection with a fresh natural scent.\n\n• Light everyday freshness.\n• Size: 200 ml.",
  },
  {
    barcode: "4005900371935",
    brandKey: "niveamen",
    price: 9000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا مين – بخاخ مضاد للتعرق Black & White Invisible Original ضد البقع 200 مل",
    nameEn: "NIVEA Men Black & White Invisible Original Antiperspirant Spray – 200 ml",
    descriptionAr:
      "بخاخ نيفيا مين Black & White Invisible Original — حماية قوية من العرق والرائحة مع تقنية تقلل البقع البيضاء على الأسود والصفراء على الأبيض.\n\n• مناسب للملابس الرسمية والداكنة.\n• الحجم: 200 مل تقريباً.",
    descriptionEn:
      "NIVEA Men Black & White Invisible Original antiperspirant spray — strong sweat and odor protection that helps prevent white marks on black and yellow stains on white.\n\n• Ideal for dark and formal clothes.\n• Size: approx. 200 ml.",
  },
  {
    barcode: "4005900371553",
    brandKey: "niveamen",
    price: 9000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا مين – بخاخ مضاد للتعرق Black & White Invisible Fresh ضد البقع 200 مل",
    nameEn: "NIVEA Men Black & White Invisible Fresh Antiperspirant Spray – 200 ml",
    descriptionAr:
      "بخاخ نيفيا مين Black & White Invisible Fresh — حماية طويلة (حتى 72 ساعة في بعض الأسواق) برائحة منعشة مع حماية من البقع البيضاء والصفراء.\n\n• انتعاش رجالي مع حماية الملابس.\n• الحجم: 200 مل.",
    descriptionEn:
      "NIVEA Men Black & White Invisible Fresh antiperspirant spray — long-lasting protection (up to 72h in some markets) with a fresh scent and anti-white/yellow stain technology.\n\n• Masculine freshness that protects clothes.\n• Size: 200 ml.",
  },
  {
    barcode: "4005808828845",
    brandKey: "niveamen",
    price: 8000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا مين – بخاخ مزيل عرق Cool Kick للانتعاش المبرّد والحماية اليومية 200 مل",
    nameEn: "NIVEA Men Cool Kick Deodorant Spray – 200 ml",
    descriptionAr:
      "بخاخ نيفيا مين Cool Kick — انتعاش مبرّد وحماية يومية من الرائحة برائحة رجالية نشيطة.\n\n• مثالي بعد الرياضة وفي الحر.\n• الحجم: 200 مل.",
    descriptionEn:
      "NIVEA Men Cool Kick deodorant spray — cooling freshness and daily odor protection with an active masculine scent.\n\n• Ideal after sport and in the heat.\n• Size: 200 ml.",
  },
  {
    barcode: "4005900243485",
    brandKey: "niveamen",
    price: 15000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا مين – عبوة مزدوجة بخاخ مزيل عرق Protect & Care حماية وعناية 2×200 مل",
    nameEn: "NIVEA Men Protect & Care Deodorant Spray Duo Pack – 2 × 200 ml",
    descriptionAr:
      "عبوة مزدوجة نيفيا مين Protect & Care — بخاخان 200 مل للحماية من الرائحة مع عناية بالبشرة تحت الإبط.\n\n• قيمة أوفر لعبوتين.\n• الحجم: 2 × 200 مل.",
    descriptionEn:
      "NIVEA Men Protect & Care deodorant spray duo — two 200 ml aerosols for odor protection with underarm skin care.\n\n• Better value twin pack.\n• Size: 2 × 200 ml.",
  },
  {
    barcode: "4005900242990",
    brandKey: "niveamen",
    price: 8000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا مين – بخاخ مزيل عرق Protect & Care للحماية والعناية بالبشرة 200 مل",
    nameEn: "NIVEA Men Protect & Care Deodorant Spray – 200 ml",
    descriptionAr:
      "بخاخ نيفيا مين Protect & Care — حماية يومية من الرائحة مع تركيبة تعتني ببشرة الإبط.\n\n• توازن بين الحماية والعناية.\n• الحجم: 200 مل.",
    descriptionEn:
      "NIVEA Men Protect & Care deodorant spray — daily odor protection with a formula that cares for underarm skin.\n\n• Balance of protection and care.\n• Size: 200 ml.",
  },
  {
    barcode: "4005808816187",
    brandKey: "niveamen",
    price: 8000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا مين – بخاخ مزيل عرق Fresh Active للانتعاش النشيط والحماية 200 مل",
    nameEn: "NIVEA Men Fresh Active Deodorant Spray – 200 ml",
    descriptionAr:
      "بخاخ نيفيا مين Fresh Active — حماية يومية من الرائحة برائحة نشيطة ومنعشة للرجال.\n\n• انتعاش يومي بسيط وفعّال.\n• الحجم: 200 مل.",
    descriptionEn:
      "NIVEA Men Fresh Active deodorant spray — daily odor protection with an active fresh masculine scent.\n\n• Simple, effective everyday freshness.\n• Size: 200 ml.",
  },
  {
    barcode: "4005808816057",
    brandKey: "niveamen",
    price: 8000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "نيفيا مين – بخاخ مضاد للتعرق Dry Impact حماية جافة 24 ساعة",
    nameEn: "NIVEA Men Dry Impact 24h Anti-Perspirant Deodorant Spray",
    descriptionAr:
      "بخاخ نيفيا مين Dry Impact — حماية مضادة للتعرق حتى 24 ساعة بإحساس جاف ومظهر مرتّب تحت الإبط.\n\n• للرجال الذين يريدون جفافاً واضحاً.\n• الحجم حسب العبوة (بخاخ رجالي كلاسيكي).",
    descriptionEn:
      "NIVEA Men Dry Impact antiperspirant deodorant — up to 24-hour anti-perspirant protection with a dry underarm feel.\n\n• For men who want a clear dry finish.\n• Classic men's aerosol format.",
  },
  // —— Simple ——
  {
    barcode: "8886467057564",
    brandKey: "simple",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "سيمبل Pure 0% – بخاخ للبشرة الحساسة خالٍ من الألمنيوم والكحول 250 مل",
    nameEn: "Simple Pure 0% Anti-Perspirant / Deodorant Spray – 250 ml",
    descriptionAr:
      "بخاخ سيمبل Pure 0% — تركيبة للبشرة الحساسة بدون ألمنيوم وبدون كحول وبدون بارابين، انتعاش يومي برائحة خشبية ناعمة (سيدار وباتشولي في بعض الأسواق).\n\n• لطيف على البشرة الحساسة.\n• الحجم: 250 مل.",
    descriptionEn:
      "Simple Pure 0% spray — sensitive-skin formula free from aluminium, alcohol and parabens for gentle all-day freshness (cedarwood & patchouli notes in some markets).\n\n• Kind to sensitive underarms.\n• Size: 250 ml.",
  },
  {
    barcode: "8886467057533",
    brandKey: "simple",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "سيمبل Aloe Fresh – بخاخ مضاد للتعرق منعش بالألوفيرا للبشرة الحساسة 250 مل",
    nameEn: "Simple Aloe Fresh Anti-Perspirant Spray – 250 ml",
    descriptionAr:
      "بخاخ سيمبل Aloe Fresh — حماية لطيفة وانتعاش بالألوفيرا مناسب للبشرة الحساسة.\n\n• انتعاش ناعم دون قسوة.\n• الحجم: 250 مل.",
    descriptionEn:
      "Simple Aloe Fresh antiperspirant spray — gentle protection with aloe freshness for sensitive skin.\n\n• Soft freshness without harshness.\n• Size: 250 ml.",
  },
  {
    barcode: "8886467057540",
    brandKey: "simple",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "سيمبل Gentle Care – بخاخ مضاد للتعرق للعناية اللطيفة بالبشرة الحساسة 250 مل",
    nameEn: "Simple Gentle Care Anti-Perspirant Spray – 250 ml",
    descriptionAr:
      "بخاخ سيمبل Gentle Care — تركيبة لطيفة للبشرة الحساسة مع حماية يومية من العرق والرائحة.\n\n• عناية يومية هادئة تحت الإبط.\n• الحجم: 250 مل.",
    descriptionEn:
      "Simple Gentle Care antiperspirant spray — gentle sensitive-skin formula with everyday sweat and odor protection.\n\n• Calm daily underarm care.\n• Size: 250 ml.",
  },
  {
    barcode: "8886467057557",
    brandKey: "simple",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "سيمبل Invisible – بخاخ مضاد للتعرق بدون بقع بيضاء/صفراء حماية 48 ساعة 250 مل",
    nameEn: "Simple Invisible Anti-Perspirant Spray – 250 ml",
    descriptionAr:
      "بخاخ سيمبل Invisible — حماية حتى 48 ساعة ويساعد على تقليل البقع البيضاء والصفراء، خالٍ من الكحول والبارابين.\n\n• حماية الملابس مع لطف على البشرة.\n• الحجم: 250 مل.",
    descriptionEn:
      "Simple Invisible antiperspirant spray — up to 48-hour protection that helps reduce white and yellow marks; alcohol-free and paraben-free.\n\n• Clothes-friendly with kind-to-skin care.\n• Size: 250 ml.",
  },
  // —— Alex ——
  {
    barcode: "5997001715611",
    brandKey: "alex",
    price: 7000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "أليكس XXL – بخاخ مزيل عرق رجالي Fireball حجم كبير 250 مل",
    nameEn: "Alex XXL Fireball Men’s Deodorant Spray – 250 ml",
    descriptionAr:
      "بخاخ أليكس XXL Fireball للرجال — حماية من الرائحة برائحة قوية نشيطة وحجم اقتصادي 250 مل.\n\n• خيار عملي يومي بسعر مناسب.\n• الحجم: 250 مل.",
    descriptionEn:
      "Alex XXL Fireball men’s deodorant spray — odor protection with a bold energetic scent in a value 250 ml size.\n\n• Practical everyday choice.\n• Size: 250 ml.",
  },
  {
    barcode: "5997001715635",
    brandKey: "alex",
    price: 7000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "أليكس XXL – بخاخ مزيل عرق رجالي Viking حجم كبير 250 مل",
    nameEn: "Alex XXL Viking Men’s Deodorant Spray – 250 ml",
    descriptionAr:
      "بخاخ أليكس XXL Viking للرجال — انتعاش وحماية من الرائحة برائحة رجالية قوية وحجم XXL.\n\n• الحجم: 250 مل.",
    descriptionEn:
      "Alex XXL Viking men’s deodorant spray — freshness and odor protection with a strong masculine scent in XXL size.\n\n• Size: 250 ml.",
  },
  {
    barcode: "5997001715642",
    brandKey: "alex",
    price: 7000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "أليكس XXL – بخاخ مزيل عرق رجالي Prince حجم كبير 250 مل",
    nameEn: "Alex XXL Prince Men’s Deodorant Spray – 250 ml",
    descriptionAr:
      "بخاخ أليكس XXL Prince للرجال — حماية يومية من الرائحة برائحة Prince وحجم اقتصادي 250 مل.\n\n• الحجم: 250 مل.",
    descriptionEn:
      "Alex XXL Prince men’s deodorant spray — everyday odor protection with the Prince scent in a value 250 ml can.\n\n• Size: 250 ml.",
  },
  {
    barcode: "5997001715628",
    brandKey: "alex",
    price: 7000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "أليكس XXL Sensitive – بخاخ مزيل عرق رجالي لطيف بالألوفيرا حماية حتى 48 ساعة 250 مل",
    nameEn: "Alex XXL Sensitive Men’s Deodorant Spray with Aloe – 250 ml",
    descriptionAr:
      "بخاخ أليكس XXL Sensitive — تركيبة ألطف للبشرة الحساسة مع الألوفيرا وحماية تصل إلى 48 ساعة.\n\n• مناسب لمن يجد البخاخات القاسية مهيّجة.\n• الحجم: 250 مل.",
    descriptionEn:
      "Alex XXL Sensitive men’s deodorant spray — gentler formula with aloe vera and up to 48-hour protection.\n\n• Better for those irritated by harsh sprays.\n• Size: 250 ml.",
  },
  // —— Dove Men+Care ——
  {
    barcode: "8886467026195",
    brandKey: "dovemen",
    price: 10500,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "دوف للرجال Elements – بخاخ مضاد للتعرق بودرة المعادن وخشب الصندل حماية 48 ساعة 250 مل",
    nameEn: "Dove Men+Care Elements Mineral Powder + Sandalwood Antiperspirant Spray – 250 ml",
    descriptionAr:
      "بخاخ دوف للرجال Elements بودرة المعادن وخشب الصندل — حماية 48 ساعة بتركيبة تجف فوراً مع عناية مرطّبة ورائحة خشبية رجالية.\n\n• الحجم: 250 مل.",
    descriptionEn:
      "Dove Men+Care Elements Mineral Powder + Sandalwood antiperspirant spray — 48-hour protection with an instant-dry feel, moisturizing care and a woody masculine scent.\n\n• Size: 250 ml.",
  },
  {
    barcode: "8886304600526",
    brandKey: "dovemen",
    price: 10500,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "دوف للرجال Advanced Care – بخاخ مضاد للتعرق Cool Fresh انتعاش مائي 250 مل",
    nameEn: "Dove Men+Care Advanced Care Cool Fresh Antiperspirant Spray – 250 ml",
    descriptionAr:
      "بخاخ دوف للرجال Cool Fresh — حماية من العرق والرائحة بانتعاش مائي وعناية مرطّبة تحت الإبط.\n\n• الحجم: 250 مل.",
    descriptionEn:
      "Dove Men+Care Cool Fresh antiperspirant spray — sweat and odor protection with aqua freshness and moisturizing underarm care.\n\n• Size: 250 ml.",
  },
  {
    barcode: "8886304600519",
    brandKey: "dovemen",
    price: 11000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "دوف للرجال Advanced Invisible Dry – بخاخ مضاد للتعرق بدون بقع حماية حتى 72 ساعة 250 مل",
    nameEn: "Dove Men+Care Advanced Invisible Dry Antiperspirant Spray – 250 ml",
    descriptionAr:
      "بخاخ دوف للرجال Invisible Dry — حماية تصل إلى 72 ساعة ويساعد على تقليل البقع البيضاء والصفراء مع ربع كريم مرطّب وبدون كحول.\n\n• الحجم: 250 مل.",
    descriptionEn:
      "Dove Men+Care Advanced Invisible Dry antiperspirant spray — up to 72-hour protection that helps prevent white and yellow marks; ¼ moisturizing cream and alcohol-free.\n\n• Size: 250 ml.",
  },
  {
    barcode: "8886304600502",
    brandKey: "dovemen",
    price: 10500,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "دوف للرجال – بخاخ مضاد للتعرق Extra Fresh انتعاش قوي وحماية من العرق 250 مل",
    nameEn: "Dove Men+Care Extra Fresh Antiperspirant Deodorant Spray – 250 ml",
    descriptionAr:
      "بخاخ دوف للرجال Extra Fresh — انتعاش قوي وحماية من العرق والرائحة مع عناية دوف المرطّبة.\n\n• الحجم: 250 مل.",
    descriptionEn:
      "Dove Men+Care Extra Fresh antiperspirant deodorant spray — bold freshness with sweat and odor protection plus Dove moisturizing care.\n\n• Size: 250 ml.",
  },
  {
    barcode: "8886467026188",
    brandKey: "dovemen",
    price: 10500,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "دوف للرجال Elements – بخاخ مضاد للتعرق بودرة المعادن والميرمية حماية 48 ساعة 250 مل",
    nameEn: "Dove Men+Care Elements Mineral Powder + Sage Antiperspirant Spray – 250 ml",
    descriptionAr:
      "بخاخ دوف للرجال Elements بودرة المعادن والميرمية — حماية 48 ساعة ورائحة عشبية نظيفة ضمن سلسلة Elements.\n\n• الحجم: 250 مل.",
    descriptionEn:
      "Dove Men+Care Elements Mineral Powder + Sage antiperspirant spray — 48-hour protection with a clean herbal scent from the Elements range.\n\n• Size: 250 ml.",
  },
  // —— Enchanteur (confirmed only) ——
  {
    barcode: "8888202063014",
    brandKey: "enchanteur",
    price: 9000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "إنشانتر Rose Oud Amour – بخاخ مزيل عرق معطر برائحة الورد والعود 150 مل",
    nameEn: "Enchanteur Rose Oud Amour Perfumed Deodorant Spray – 150 ml",
    descriptionAr:
      "بخاخ إنشانتر Rose Oud Amour — مزيل عرق معطر يجمع حماية الرائحة مع عطر ورد وعود فاخر (بابونج أزرق، زعفران، مسك كشمير).\n\n• مناسب للسوق العراقي لمحبي الروائح الشرقية.\n• الحجم: 150 مل.",
    descriptionEn:
      "Enchanteur Rose Oud Amour perfumed deodorant spray — odor protection wrapped in rose and oud luxury notes (blue chamomile, saffron, cashmere musk).\n\n• Popular oriental floral scent profile.\n• Size: 150 ml.",
  },
  // —— Suave Kids ——
  {
    barcode: "0079400459534",
    brandKey: "suavekids",
    price: 12000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "سواف كيدز Silly Apple – شامبو وبلسم وغسول جسم 3 في 1 برائحة التفاح 532 مل",
    nameEn: "Suave Kids Silly Apple 3-in-1 Shampoo Conditioner & Body Wash – 18 fl oz / 532 ml",
    descriptionAr:
      "سواف كيدز Silly Apple 3 في 1 — ينظف الشعر والبشرة بلطف ويرطّب الشعر برائحة تفاح طفولية، خالٍ من الدموع ومختبر جلدياً.\n\n• عملي للحمام اليومي للأطفال.\n• الباركود المعياري من UPC 79400459534 → 0079400459534.\n• الحجم: 18 أونصة / حوالي 532 مل.",
    descriptionEn:
      "Suave Kids Silly Apple 3-in-1 — gently cleanses hair and skin and conditions hair with a fresh apple kids scent; tear-free and dermatologist tested.\n\n• Convenient daily bath for kids.\n• Normalized from UPC 79400459534 → 0079400459534.\n• Size: 18 fl oz / ~532 ml.",
  },
  {
    barcode: "0079400459480",
    brandKey: "suavekids",
    price: 12000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "سواف كيدز Watermelon Wonder – شامبو وبلسم وغسول جسم 3 في 1 برائحة البطيخ 532 مل",
    nameEn: "Suave Kids Watermelon Wonder 3-in-1 Shampoo Conditioner & Body Wash – 18 fl oz / 532 ml",
    descriptionAr:
      "سواف كيدز Watermelon Wonder 3 في 1 — تنظيف لطيف للشعر والجسم برائحة بطيخ محببة للأطفال، tear-free ومختبر جلدياً.\n\n• من UPC 79400459480 → 0079400459480.\n• الحجم: 18 أونصة / حوالي 532 مل.",
    descriptionEn:
      "Suave Kids Watermelon Wonder 3-in-1 — gentle hair and body cleanse with a fun watermelon scent; tear-free and dermatologist tested.\n\n• From UPC 79400459480 → 0079400459480.\n• Size: 18 fl oz / ~532 ml.",
  },
  {
    barcode: "0079400459510",
    brandKey: "suavekids",
    price: 12000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "سواف كيدز Strawberry Smoothers – شامبو وبلسم 2 في 1 برائحة الفراولة 532 مل",
    nameEn: "Suave Kids Strawberry Smoothers 2-in-1 Shampoo & Conditioner – 18 fl oz / 532 ml",
    descriptionAr:
      "سواف كيدز Strawberry Smoothers 2 في 1 — شامبو وبلسم برائحة فراولة لتنظيف وتنعيم شعر الأطفال.\n\n• من UPC 79400459510 → 0079400459510.\n• الحجم: 18 أونصة / حوالي 532 مل.",
    descriptionEn:
      "Suave Kids Strawberry Smoothers 2-in-1 shampoo & conditioner — cleanses and softens kids’ hair with a strawberry scent.\n\n• From UPC 79400459510 → 0079400459510.\n• Size: 18 fl oz / ~532 ml.",
  },
  {
    barcode: "8886467048272",
    brandKey: "suavekids",
    price: 14000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "سواف كيدز Watermelon Wonder – شامبو وبلسم وغسول جسم 3 في 1 برائحة البطيخ 700 مل",
    nameEn: "Suave Kids Watermelon Wonder 3-in-1 Shampoo Conditioner & Body Wash – 700 ml",
    descriptionAr:
      "سواف كيدز Watermelon Wonder بحجم اقتصادي 700 مل — 3 في 1 للشعر والجسم، tear-free ومختبر للعيون والجلد، خالٍ من البارابين.\n\n• الحجم: 700 مل.",
    descriptionEn:
      "Suave Kids Watermelon Wonder value 700 ml — 3-in-1 for hair and body; tear-free, derm and ophthalmologist tested, paraben-free.\n\n• Size: 700 ml.",
  },
  {
    barcode: "8886467048234",
    brandKey: "suavekids",
    price: 10000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "سواف كيدز Silly Apple – شامبو وبلسم وغسول جسم 3 في 1 برائحة التفاح 350 مل",
    nameEn: "Suave Kids Silly Apple 3-in-1 Shampoo Conditioner & Body Wash – 350 ml",
    descriptionAr:
      "سواف كيدز Silly Apple 350 مل — 3 في 1 لتنظيف لطيف للشعر والجسم برائحة تفاح، مناسب للاستحمام اليومي للأطفال.\n\n• الحجم: 350 مل.",
    descriptionEn:
      "Suave Kids Silly Apple 350 ml — 3-in-1 gentle cleanse for hair and body with apple scent for everyday kids’ baths.\n\n• Size: 350 ml.",
  },
  {
    barcode: "8886467048241",
    brandKey: "suavekids",
    price: 10000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "سواف كيدز Watermelon Wonder – شامبو وبلسم وغسول جسم 3 في 1 برائحة البطيخ 350 مل",
    nameEn: "Suave Kids Watermelon Wonder 3-in-1 Shampoo Conditioner & Body Wash – 350 ml",
    descriptionAr:
      "سواف كيدز Watermelon Wonder 350 مل — 3 في 1 برائحة بطيخ لتنظيف وترطيب شعر وبشرة الأطفال بلطف.\n\n• الحجم: 350 مل.",
    descriptionEn:
      "Suave Kids Watermelon Wonder 350 ml — 3-in-1 watermelon scent that gently cleanses and conditions kids’ hair and skin.\n\n• Size: 350 ml.",
  },
  {
    barcode: "8886467048258",
    brandKey: "suavekids",
    price: 10000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "سواف كيدز Coconut Splash – شامبو وبلسم وغسول جسم 3 في 1 برائحة جوز الهند 350 مل",
    nameEn: "Suave Kids Coconut Splash 3-in-1 Shampoo Conditioner & Body Wash – 350 ml",
    descriptionAr:
      "سواف كيدز Coconut Splash 350 مل — 3 في 1 برائحة جوز هند لطيفة لتنظيف شعر وجسم الأطفال.\n\n• الحجم: 350 مل.",
    descriptionEn:
      "Suave Kids Coconut Splash 350 ml — 3-in-1 with a soft coconut scent for gentle kids’ hair and body cleansing.\n\n• Size: 350 ml.",
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

  const needed = new Set(PRODUCTS.map((p) => p.brandKey));
  const brandIds: Partial<Record<BrandKey, string>> = {};
  for (const key of needed) brandIds[key] = await resolveBrandId(key);
  console.log("");

  // Legacy short UPCs for Suave
  for (const b of ["79400459534", "79400459480", "79400459510", "079400459534", "079400459480", "079400459510"]) {
    await deleteByBarcode(b);
  }

  let added = 0;
  for (const p of PRODUCTS) {
    const brand = BRANDS[p.brandKey];
    const brandId = brandIds[p.brandKey]!;
    const slug = slugify(p.nameEn, p.barcode);
    const sku = `${brand.prefix}-${p.barcode.slice(-6)}`;

    console.log(`--- ${p.barcode} ---`);
    await deleteByBarcode(p.barcode);

    const created = await api<{ id: string }>("/products", "POST", {
      sku,
      barcode: p.barcode,
      slug,
      brandId,
      categoryId: CARE,
      subcategoryId: p.subcategoryId,
      subcategoryIds: [p.subcategoryId],
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

    const verify = await api<{ shades?: unknown[]; images?: unknown[] }>(`/products/${created.id}`);
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Shades present on ${p.barcode}`);
    console.log(`  ✓ ${p.nameAr}`);
    console.log(`    EN: ${p.nameEn}`);
    console.log(`    ID: ${created.id} | ${p.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`Done — added ${added}/${PRODUCTS.length}`);
  console.log("\nUnresolved (not added):");
  for (const b of UNRESOLVED_BARCODES) console.log(`  - ${b}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
