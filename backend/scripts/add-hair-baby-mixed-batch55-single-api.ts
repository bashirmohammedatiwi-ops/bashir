/**
 * Hair/baby care mixed batch — separate SKUs, no shades, no images.
 * Names via GPT Luna; hard codes via GPT 5.6 Terra.
 * Usage: npx tsx scripts/add-hair-baby-mixed-batch55-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const BODY = "23aaaa07-91ee-4937-847e-d7866a9e937a";
const MOM_BABY = "0daef5a1-9dfb-44ac-89ca-b2ac80dffbef";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const HAIR_TREATMENT = "ee39d6a6-5074-43b6-a80c-a7c1b23c3bd1";
const BODY_CLEANSERS = "35be991e-3062-4fbd-8f0a-2393bf806524";
const BODY_LOTION = "fcd86b22-a0fd-47b9-ba4c-c76164dadab2";
const BABY_CARE = "fbacb6e2-33ed-4071-ae78-21d77aaa476c";

type BrandKey =
  | "johnsons"
  | "fino"
  | "karseell"
  | "intesa"
  | "cosmaline"
  | "vichy"
  | "alpecin"
  | "ducray"
  | "neutrogena"
  | "argandeluxe";

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
  johnsons: { brandAr: "جونسون", brandEn: "Johnson's", prefix: "JNS" },
  fino: { brandAr: "فينو", brandEn: "Fino", prefix: "FNO" },
  karseell: { brandAr: "كارسيل", brandEn: "Karseell", prefix: "KRS" },
  intesa: { brandAr: "إنتيسا للرجال", brandEn: "Intesa Pour Homme", prefix: "INT" },
  cosmaline: { brandAr: "كوزمالين", brandEn: "Cosmaline", prefix: "CSM" },
  vichy: { brandAr: "فيشي", brandEn: "Vichy", prefix: "VCH" },
  alpecin: { brandAr: "ألبسين", brandEn: "Alpecin", prefix: "ALP" },
  ducray: { brandAr: "دوكراي", brandEn: "Ducray", prefix: "DUC" },
  neutrogena: { brandAr: "نيوتروجينا", brandEn: "Neutrogena", prefix: "NEU" },
  argandeluxe: { brandAr: "أرغان ديلوكس", brandEn: "Argan De Luxe", prefix: "ADL" },
};

export const UNRESOLVED_BARCODES = [
  // Coco Hair / Italian GS1 — no exact GTIN proof
  "8056860720628",
  "8056860720574",
  "8056860720550",
  "8056860720567",
  "8056860720598",
  "8056860720604",
  "8056860720611",
  "8056860720581",
  "8056860720536",
  "8056860720635",
  "8056860720642",
  // Polish
  "5905562764948",
  "5905562764962",
  "5905562764955",
  "5905562764931",
  "5905562764993",
  "5906692554003",
  // China kids (incomplete brand/size)
  "6920428206119",
  "6920428206102",
  "6920428206096",
  "6920428206041",
  // Cosmaline without GTIN proof
  "5281019051725",
  // Argan De Luxe UPCs without match
  "722267775803",
  "722267775643",
  "722267775674",
] as const;

const PRODUCTS: ProductDef[] = [
  {
    barcode: "3574661520476",
    brandKey: "johnsons",
    price: 9000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "جونسون بيبي – شامبو أطفال بالبابونج لتنظيف لطيف بدون دموع 500 مل",
    nameEn: "Johnson's Baby Chamomile Tear-Free Shampoo – 500 ml",
    descriptionAr:
      "شامبو جونسون للأطفال بالبابونج — تنظيف لطيف بتركيبة خالية من الدموع ومضادة للحساسية ومتوازنة الحموضة، بدون صبغات أو بارابين أو كبريتات.\n\n• رائحة بابونج مهدئة مناسبة للرضع والأطفال.\n• الحجم: 500 مل.",
    descriptionEn:
      "Johnson's Baby Chamomile shampoo — gentle tear-free, hypoallergenic, pH-balanced cleanse without dyes, parabens or sulfates.\n\n• Soft chamomile scent for babies and kids.\n• Size: 500 ml.",
  },
  {
    barcode: "4550516493583",
    brandKey: "fino",
    price: 18000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "فينو بريميوم تاتش – ماسك شعر علاجي مكثف لإصلاح وترطيب الشعر التالف 230 غ",
    nameEn: "Fino Premium Touch Penetrating Essence Hair Mask – 230 g",
    descriptionAr:
      "ماسك فينو بريميوم تاتش الياباني — علاج مكثف بمركب Lipidure EX والغذاء الملكي وPCA لإصلاح التلف وترطيب الشعر وتقليل الهيشان وزيادة اللمعان.\n\n• مثالي للشعر الجاف والمتضرر والمصبوغ.\n• الحجم: 230 غ.",
    descriptionEn:
      "Fino Premium Touch Hair Mask — intensive Japanese treatment with Lipidure EX, royal jelly and PCA to repair damage, hydrate, smooth frizz and boost shine.\n\n• Ideal for dry, damaged and coloured hair.\n• Size: 230 g.",
  },
  {
    barcode: "4550516475961",
    brandKey: "fino",
    price: 16000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "فينو بريميوم تاتش – شامبو لترطيب وتقوية وإصلاح الشعر التالف 550 مل",
    nameEn: "Fino Premium Touch Shampoo – 550 ml",
    descriptionAr:
      "شامبو فينو بريميوم تاتش — ينظف ويرطّب ويقوّي الشعر التالف بتركيبة الغذاء الملكي وPCA وLipidure EX.\n\n• مكمّل مثالي لماسك فينو.\n• الحجم: 550 مل.",
    descriptionEn:
      "Fino Premium Touch Shampoo — cleanses, hydrates and strengthens damaged hair with royal jelly, PCA and Lipidure EX.\n\n• Perfect partner to Fino mask.\n• Size: 550 ml.",
  },
  {
    barcode: "4897110030180",
    brandKey: "karseell",
    price: 20000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "كارسيل ماكا باور – ماسك كولاجين مكثف لإصلاح وترطيب الشعر الجاف والتالف 500 مل",
    nameEn: "Karseell Maca Power Collagen Hair Treatment Mask – 500 ml",
    descriptionAr:
      "ماسك كارسيل كولاجين ماكا باور — علاج عميق بالكولاجين وزيت الأرغان وخلاصة الماكا لإصلاح التلف وترطيب الشعر وتقليل الهيشان.\n\n• الأشهر عالمياً للشعر الجاف والمتضرر.\n• الحجم: 500 مل.",
    descriptionEn:
      "Karseell Maca Power Collagen Hair Treatment — deep repair with collagen, argan oil and maca essence for dry, damaged, frizzy hair.\n\n• Global favourite intensive mask.\n• Size: 500 ml.",
  },
  {
    barcode: "4897110030234",
    brandKey: "karseell",
    price: 16000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كارسيل ماكا باور – شامبو لإصلاح وترطيب الشعر الجاف والتالف 500 مل",
    nameEn: "Karseell Maca Power Shampoo for Damaged Hair – 500 ml",
    descriptionAr:
      "شامبو كارسيل ماكا باور — يغذّي ويرمّم الشعر الجاف والتالف والمعالج كيميائياً بزيت الأرغان وخلاصة الماكا.\n\n• الحجم: 500 مل.",
    descriptionEn:
      "Karseell Maca Power Shampoo — nourishes and repairs dry, damaged and chemically treated hair with argan oil and maca.\n\n• Size: 500 ml.",
  },
  {
    barcode: "4897110030357",
    brandKey: "karseell",
    price: 16000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كارسيل ماكا باور – بلسم مكثف لإصلاح وترطيب الشعر وفك التشابك 500 مل",
    nameEn: "Karseell Maca Power Intensive Repair Conditioner – 500 ml",
    descriptionAr:
      "بلسم كارسيل ماكا باور المكثف — يرطّب بعمق ويصلح التقصف ويسهّل التمشيط ويقلل الهيشان بزيوت الأرغان والمكاديميا.\n\n• الحجم: 500 مل.",
    descriptionEn:
      "Karseell Maca Power Intensive Repair Conditioner — deep hydration, split-end care, easier detangling and less frizz with argan and macadamia oils.\n\n• Size: 500 ml.",
  },
  {
    barcode: "4897110032863",
    brandKey: "karseell",
    price: 16000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كارسيل BNC – شامبو بزيت الأرغان والكيراتين والكولاجين لتغذية الشعر 500 مل",
    nameEn: "Karseell BNC Argan Nourishing Shampoo – 500 ml",
    descriptionAr:
      "شامبو كارسيل BNC بزيت الأرغان — يغذّي ويرطّب ويحمي اللون بتركيبة كيراتين وكولاجين، خالٍ من الكبريتات والبارابين.\n\n• الحجم: 500 مل.",
    descriptionEn:
      "Karseell BNC Argan Nourishing Shampoo — moisturizes and protects colour with argan, keratin and collagen; sulfate- and paraben-free.\n\n• Size: 500 ml.",
  },
  {
    barcode: "4897110032870",
    brandKey: "karseell",
    price: 16000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كارسيل BNC – بلسم سوبر ديتانجل بزيت الأرغان لفك التشابك والترطيب 500 مل",
    nameEn: "Karseell BNC Argan Super Detangle Conditioner – 500 ml",
    descriptionAr:
      "بلسم كارسيل BNC سوبر ديتانجل — يسهّل التمشيط ويرطّب ويقلل التكسر ويمنح لمعاناً بزيت الأرغان والكيراتين.\n\n• الحجم: 500 مل.",
    descriptionEn:
      "Karseell BNC Argan Super Detangle Conditioner — detangles, hydrates, helps reduce breakage and adds shine with argan and keratin.\n\n• Size: 500 ml.",
  },
  {
    barcode: "3574669909105",
    brandKey: "johnsons",
    price: 10000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "جونسون بيبي – زيت أطفال كلاسيكي لحبس الرطوبة وتنعيم البشرة 500 مل",
    nameEn: "Johnson's Baby Oil Regular Classic – 500 ml",
    descriptionAr:
      "زيت جونسون للأطفال الكلاسيكي — يحبس الرطوبة وينعّم بشرة الرضيع، مضاد للحساسية ومتوازن الحموضة ومناسب للتدليك اليومي.\n\n• الحجم: 500 مل.",
    descriptionEn:
      "Johnson's Baby Oil Regular — locks in moisture and softens baby skin; hypoallergenic, pH-balanced and ideal for daily massage.\n\n• Size: 500 ml.",
  },
  {
    barcode: "8003510035205",
    brandKey: "intesa",
    price: 9000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "إنتيسا للرجال Fresh – شامبو مضاد للقشرة بالزنك لتنقية فروة الرأس 300 مل",
    nameEn: "Intesa Pour Homme Fresh Anti-Dandruff Shampoo – 300 ml",
    descriptionAr:
      "شامبو إنتيسا للرجال Fresh مضاد للقشرة — بالزنك ومجمع معدني يساعد على السيطرة على التقشر وتنقية فروة الرأس الدهنية.\n\n• الحجم: 300 مل.",
    descriptionEn:
      "Intesa Pour Homme Fresh anti-dandruff shampoo — with zinc and mineral complex to help control flaking and purify oily scalp.\n\n• Size: 300 ml.",
  },
  {
    barcode: "8003510003549",
    brandKey: "intesa",
    price: 9000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "إنتيسا للرجال Antiloss – شامبو مضاد لتساقط الشعر بـ Kerastim S لتقوية الألياف 300 مل",
    nameEn: "Intesa Pour Homme Anti-Hair-Loss Antiloss Shampoo – 300 ml",
    descriptionAr:
      "شامبو إنتيسا للرجال Antiloss — بتقنية Kerastim S يقوّي ألياف الشعر ويساعد على تقليل مظهر التساقط بتركيبة منعشة للحموضة الفسيولوجية.\n\n• الحجم: 300 مل.",
    descriptionEn:
      "Intesa Pour Homme Antiloss shampoo — with Kerastim S to strengthen hair fibre and help reduce the look of hair fall; physiological pH.\n\n• Size: 300 ml.",
  },
  {
    barcode: "8003510003587",
    brandKey: "intesa",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_CLEANSERS,
    nameAr: "إنتيسا للرجال Aloe – شامبو وجل استحمام 2 في 1 بالألوفيرا لترطيب الجسم والشعر 500 مل",
    nameEn: "Intesa Pour Homme Aloe Bath & Shower Shampoo 2-in-1 – 500 ml",
    descriptionAr:
      "شامبو وجل استحمام إنتيسا Aloe للرجال — ينظف الجسم والشعر بتركيبة ألوفيرا ومجمع معدني ورائحة خشبية مسكية منعشة.\n\n• الحجم: 500 مل.",
    descriptionEn:
      "Intesa Pour Homme Aloe bath & shower shampoo — cleanses body and hair with aloe vera, mineral complex and a woody-musky scent.\n\n• Size: 500 ml.",
  },
  {
    barcode: "8003510003570",
    brandKey: "intesa",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_CLEANSERS,
    nameAr: "إنتيسا للرجال Ginseng – شامبو وجل استحمام 2 في 1 بالجينسنغ للتنشيط والترطيب 500 مل",
    nameEn: "Intesa Pour Homme Ginseng Revitalizing Bath & Shower Shampoo – 500 ml",
    descriptionAr:
      "شامبو وجل استحمام إنتيسا بالجينسنغ — ينشّط ويرطّب الجسم والشعر برائحة أخشاب ثمينة وعنبر ومسك.\n\n• الحجم: 500 مل.",
    descriptionEn:
      "Intesa Pour Homme Ginseng bath & shower shampoo — toning, moisturizing cleanse for body and hair with precious woods, amber and musk.\n\n• Size: 500 ml.",
  },
  {
    barcode: "8003510023066",
    brandKey: "intesa",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_CLEANSERS,
    nameAr: "إنتيسا للرجال Essence Power – شامبو وجل استحمام بتقنية Odour Block لمنع الروائح 500 مل",
    nameEn: "Intesa Pour Homme Essence Power Odour Block Bath & Shower Shampoo – 500 ml",
    descriptionAr:
      "شامبو وجل استحمام إنتيسا Essence Power — بتقنية Odour Block يعادل الروائح غير المرغوبة وينظف الجسم والشعر برائحة عنبر وطحلب البلوط.\n\n• الحجم: 500 مل.",
    descriptionEn:
      "Intesa Pour Homme Essence Power Odour Block bath & shower shampoo — neutralizes unwanted odor while cleansing body and hair with amber and oak moss fragrance.\n\n• Size: 500 ml.",
  },
  {
    barcode: "5281019023029",
    brandKey: "cosmaline",
    price: 8000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "كوزمالين Soft Wave Kids – شامبو أطفال 2 في 1 بتفاح أخضر بدون دموع 400 مل",
    nameEn: "Cosmaline Soft Wave Kids Green Apple 2-in-1 Shampoo – 400 ml",
    descriptionAr:
      "شامبو كوزمالين Soft Wave Kids 2 في 1 بتفاح أخضر — تنظيف لطيف بدون دموع ومضاد للحساسية وخالٍ من البارابين لشعر لامع سهل التمشيط.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Cosmaline Soft Wave Kids Green Apple 2-in-1 shampoo — tear-free, hypoallergenic, paraben-free cleanse for shiny, tangle-free kids’ hair.\n\n• Size: 400 ml.",
  },
  {
    barcode: "5281019047186",
    brandKey: "cosmaline",
    price: 8000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "كوزمالين Soft Wave Kids – شامبو أطفال برائحة فواكه الربيع للترطيب وفك التشابك 400 مل",
    nameEn: "Cosmaline Soft Wave Kids Fruity Spring Shampoo – 400 ml",
    descriptionAr:
      "شامبو كوزمالين Soft Wave Kids Fruity Spring — مختبر جلدياً، بدون دموع، مضاد للحساسية، خالٍ من البارابين والكبريتات والصبغات.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Cosmaline Soft Wave Kids Fruity Spring shampoo — dermatologically tested, tear-free, hypoallergenic; free from parabens, sulfates and colorants.\n\n• Size: 400 ml.",
  },
  {
    barcode: "5281019023043",
    brandKey: "cosmaline",
    price: 8000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "كوزمالين Soft Wave Kids – شامبو أطفال برائحة زهرية لطيفة لتنظيف وفك التشابك 400 مل",
    nameEn: "Cosmaline Soft Wave Kids Baby Hair Floral Shampoo – 400 ml",
    descriptionAr:
      "شامبو كوزمالين Soft Wave Kids برائحة زهرية لطيفة — تنظيف فروة الرأس بلطف وبدون دموع لشعر لامع سهل التمشيط.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Cosmaline Soft Wave Kids floral baby shampoo — gentle tear-free scalp cleanse for shiny, tangle-free hair.\n\n• Size: 400 ml.",
  },
  {
    barcode: "5281019040439",
    brandKey: "cosmaline",
    price: 8000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "كوزمالين Soft Wave Kids – شامبو أطفال 2 في 1 بالفراولة بمكونات طبيعية المنشأ 400 مل",
    nameEn: "Cosmaline Soft Wave Kids Strawberry 2-in-1 Shampoo – 400 ml",
    descriptionAr:
      "شامبو كوزمالين Soft Wave Kids 2 في 1 بالفراولة — أكثر من 90% مكونات طبيعية المنشأ، بدون دموع، خالٍ من البارابين والكبريتات والسيليكون.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Cosmaline Soft Wave Kids Strawberry 2-in-1 shampoo — over 90% natural-origin ingredients; tear-free, free from parabens, sulfates and silicones.\n\n• Size: 400 ml.",
  },
  {
    barcode: "5281019041252",
    brandKey: "cosmaline",
    price: 8000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "كوزمالين Soft Wave Kids – بلسم أطفال بالفراولة لترطيب وتنعيم وفك التشابك 400 مل",
    nameEn: "Cosmaline Soft Wave Kids Strawberry Conditioner – 400 ml",
    descriptionAr:
      "بلسم كوزمالين Soft Wave Kids بالفراولة — يرطّب وينعّم ويفك التشابك بتركيبة طبيعية المنشأ، بدون دموع ومختبر جلدياً.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Cosmaline Soft Wave Kids Strawberry conditioner — hydrates, softens and detangles with natural-origin care; tear-free and dermatologically tested.\n\n• Size: 400 ml.",
  },
  {
    barcode: "3337875595711",
    brandKey: "vichy",
    price: 22000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "فيشي ديركوس Nutrients Nutri-Protein – شامبو مغذٍ لإصلاح الشعر الجاف والمتقصف 250 مل",
    nameEn: "Vichy Dercos Nutrients Nutri-Protein Nourishing Shampoo – 250 ml",
    descriptionAr:
      "شامبو فيشي ديركوس Nutri-Protein — يغذّي ويرمّم الشعر الجاف والهش والمتقصف بنخالة الكينوا وزيت البراكسي، ويدعم إصلاح تلف الحرارة والأشعة.\n\n• الحجم: 250 مل.",
    descriptionEn:
      "Vichy Dercos Nutri-Protein nourishing shampoo — feeds dry, frizzy, brittle hair with quinoa bran and pracaxi oil; helps address heat and UV stress.\n\n• Size: 250 ml.",
  },
  {
    barcode: "4008666211187",
    brandKey: "alpecin",
    price: 14000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ألبسين C1 – شامبو الكافيين لتقوية جذور الشعر والمساعدة على تقليل التساقط الوراثي 250 مل",
    nameEn: "Alpecin Caffeine Shampoo C1 – 250 ml",
    descriptionAr:
      "شامبو ألبسين C1 بالكافيين — يصل إلى جذور الشعر ليقوّيها ويساعد على تقليل التساقط الوراثي، خالٍ من السيليكون.\n\n• الأشهر عالمياً لشعر الرجال.\n• الحجم: 250 مل.",
    descriptionEn:
      "Alpecin Caffeine Shampoo C1 — reaches hair roots to fortify them and help reduce hereditary hair loss; silicone-free.\n\n• Iconic men’s hair-loss care shampoo.\n• Size: 250 ml.",
  },
  {
    barcode: "4008666200174",
    brandKey: "alpecin",
    price: 14000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ألبسين S1 – شامبو كافيين لطيف لفروة الرأس الحساسة مع بانثينول وألانتوين 250 مل",
    nameEn: "Alpecin pH Sensitiv Caffeine Shampoo S1 – 250 ml",
    descriptionAr:
      "شامبو ألبسين S1 الحساس — تركيبة لطيفة لفروة الرأس الحساسة بالكافيين والبانثينول والألانتوين، بدون كحول وبدون سيليكون.\n\n• الحجم: 250 مل.",
    descriptionEn:
      "Alpecin S1 Sensitive caffeine shampoo — mild formula for sensitive scalp with caffeine, panthenol and allantoin; alcohol- and silicone-free.\n\n• Size: 250 ml.",
  },
  {
    barcode: "4008666205506",
    brandKey: "alpecin",
    price: 14000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ألبسين Medicinal Hypo-Sensitive – شامبو طبي لفروة الرأس الجافة والحساسة ضد الحكة والقشرة 250 مل",
    nameEn: "Alpecin Medicinal Hypo-Sensitive Shampoo – 250 ml",
    descriptionAr:
      "شامبو ألبسين الطبي Hypo-Sensitive — لفروة الرأس الجافة والحساسة، بدون عطر أو صبغات أو مواد حافظة، بمستخلص الميرمية والبيسابولول لتهدئة الحكة والقشرة.\n\n• الحجم: 250 مل.",
    descriptionEn:
      "Alpecin Medicinal Hypo-Sensitive shampoo — for dry sensitive scalp; fragrance-, colorant- and preservative-free with sage extract and bisabolol to soothe itch and dandruff.\n\n• Size: 250 ml.",
  },
  {
    barcode: "4008666204608",
    brandKey: "alpecin",
    price: 14000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ألبسين Medicinal – شامبو مركز طبي مضاد للقشرة والحكة بحمض الساليسيليك 200 مل",
    nameEn: "Alpecin Medicinal Shampoo-Concentrate Anti-Dandruff – 200 ml",
    descriptionAr:
      "شامبو ألبسين الطبي المركز مضاد للقشرة — بحمض الساليسيليك وحمض الفيوماريك يساعد على إزالة القشرة وتخفيف الحكة، مناسب للاستخدام اليومي.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Alpecin Medicinal anti-dandruff shampoo concentrate — with salicylic and fumaric acids to help clear flakes and relieve itching; suitable for daily use.\n\n• Size: 200 ml.",
  },
  {
    barcode: "4008666203137",
    brandKey: "alpecin",
    price: 15000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "ألبسين Medicinal Forte – تونك مركز لفروة الرأس ضد القشرة ودعم نمو الشعر 200 مل",
    nameEn: "Alpecin Medicinal Forte Intensive Scalp & Hair Tonic – 200 ml",
    descriptionAr:
      "تونك ألبسين Medicinal Forte — يُترك على الشعر بحمض الساليسيليك والمنثول والثيمول لمكافحة القشرة ودعم الدورة الدموية في فروة الرأس.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Alpecin Medicinal Forte leave-in scalp tonic — with salicylic acid, menthol and thymol to fight dandruff and support scalp circulation.\n\n• Size: 200 ml.",
  },
  {
    barcode: "4008666200242",
    brandKey: "alpecin",
    price: 15000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "ألبسين Medicinal Special Vitamin – تونك فيتامين لفروة الرأس الحساسة وتهدئة التهيج 200 مل",
    nameEn: "Alpecin Medicinal Special Vitamin Scalp & Hair Tonic – 200 ml",
    descriptionAr:
      "تونك ألبسين Special Vitamin — يُترك على فروة الرأس الحساسة بمستخلص الجنجل وفيتامينات A وE وحمض الساليسيليك لتهدئة التهيج.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Alpecin Medicinal Special Vitamin leave-in tonic — for sensitive scalp with hop extract, vitamins A and E and salicylic acid to soothe irritation.\n\n• Size: 200 ml.",
  },
  {
    barcode: "3282770075533",
    brandKey: "ducray",
    price: 22000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "دوكراي Anaphase+ – شامبو مكمل مضاد لتساقط الشعر لتقوية وتكثيف الشعر 200 مل",
    nameEn: "Ducray Anaphase+ Anti-Hair Loss Complement Shampoo – 200 ml",
    descriptionAr:
      "شامبو دوكراي Anaphase+ — يكمّل علاجات التساقط ويقوّي الألياف وينشّط مظهر الشعر الخفيف ويمنح حجماً، صنع في فرنسا.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Ducray Anaphase+ fortifying shampoo — complements hair-loss treatments, strengthens fibre, revitalizes thinning hair and adds volume; made in France.\n\n• Size: 200 ml.",
  },
  {
    barcode: "3574661450735",
    brandKey: "neutrogena",
    price: 16000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "نيوتروجينا T/Gel – شامبو علاجي للقشرة وفروة الرأس الجافة والحكة 250 مل",
    nameEn: "Neutrogena T/Gel Therapeutic Shampoo for Dry Hair & Scalp – 250 ml",
    descriptionAr:
      "شامبو نيوتروجينا T/Gel العلاجي — بمستخلص قطران الفحم المنحل (Neutar) لعلاج القشرة والتهاب الجلد الدهني وفروة الرأس الحكة والتقشر.\n\n• يُستخدم 2–3 مرات أسبوعياً.\n• الحجم: 250 مل.",
    descriptionEn:
      "Neutrogena T/Gel Therapeutic shampoo — with Neutar solubilised coal tar extract for dandruff, seborrhoeic dermatitis and itchy flaky scalp.\n\n• Use 2–3 times weekly.\n• Size: 250 ml.",
  },
  {
    barcode: "3574661450773",
    brandKey: "neutrogena",
    price: 16000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "نيوتروجينا T/Gel – شامبو وبلسم 2 في 1 مضاد للقشرة بحمض الساليسيليك 250 مل",
    nameEn: "Neutrogena T/Gel Anti-Dandruff 2-in-1 Shampoo & Conditioner – 250 ml",
    descriptionAr:
      "شامبو وبلسم نيوتروجينا T/Gel 2 في 1 — بحمض الساليسيليك 1% وبيروكتون أولامين 0.6% لمكافحة القشرة من أول غسلة مع تنعيم Conditioner.\n\n• الحجم: 250 مل.",
    descriptionEn:
      "Neutrogena T/Gel 2-in-1 anti-dandruff shampoo & conditioner — 1% salicylic acid and 0.6% piroctone olamine to fight dandruff from the first wash while conditioning.\n\n• Size: 250 ml.",
  },
  {
    barcode: "3574661783345",
    brandKey: "neutrogena",
    price: 16000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "نيوتروجينا T/Gel Scalp Relief – شامبو لتخفيف القشرة وتهدئة فروة الرأس الجافة والحكة 250 مل",
    nameEn: "Neutrogena T/Gel Anti-Dandruff Scalp Relief Shampoo – 250 ml",
    descriptionAr:
      "شامبو نيوتروجينا T/Gel Scalp Relief — بحمض الساليسيليك وبيروكتون أولامين لتخفيف القشرة وتهدئة فروة الرأس الجافة والحكة والتقشر.\n\n• يُستخدم 2–3 مرات أسبوعياً للبالغين.\n• الحجم: 250 مل.",
    descriptionEn:
      "Neutrogena T/Gel Scalp Relief shampoo — with salicylic acid and piroctone olamine to relieve dandruff and soothe dry, itchy, flaky scalp.\n\n• Use 2–3 times weekly for adults.\n• Size: 250 ml.",
  },
  {
    barcode: "00783583000420",
    brandKey: "argandeluxe",
    price: 18000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "أرغان ديلوكس – سيروم زيت الأرغان للشعر والجسم للترطيب واللمعان والحماية الحرارية 100 مل",
    nameEn: "Argan De Luxe Argan Oil Hair & Body Serum – 100 ml",
    descriptionAr:
      "سيروم أرغان ديلوكس بزيت الأرغان المغربي — يرطّب الشعر والبشرة ويسيطر على الهيشان ويمنح لمعاناً عالياً مع حماية حرارية.\n\n• من UPC 783583000420 → EAN 00783583000420.\n• الحجم: 100 مل.",
    descriptionEn:
      "Argan De Luxe hair & body serum with Moroccan argan oil — hydrates hair and skin, controls frizz, adds high-gloss shine and heat protection.\n\n• From UPC 783583000420 → EAN 00783583000420.\n• Size: 100 ml.",
  },
  {
    barcode: "00783583000260",
    brandKey: "argandeluxe",
    price: 22000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "أرغان ديلوكس – شامبو زيت الأرغان المغذي لإصلاح الشعر الجاف والتالف 1000 مل",
    nameEn: "Argan De Luxe Argan Oil Nourishing Shampoo – 1000 ml",
    descriptionAr:
      "شامبو أرغان ديلوكس المغذي بحجم صالون — بزيت الأرغان المغربي وفيتامين E ينظف بلطف ويرطّب ويرمّم الشعر الجاف والتالف والمصبوغ، خالٍ من البارابين.\n\n• من UPC 783583000260.\n• الحجم: 1000 مل.",
    descriptionEn:
      "Argan De Luxe nourishing shampoo — salon liter size with Moroccan argan oil and vitamin E; gentle cleanse that hydrates and repairs dry, damaged, colour-treated hair; paraben-free.\n\n• From UPC 783583000260.\n• Size: 1000 ml.",
  },
  {
    barcode: "00783583000253",
    brandKey: "argandeluxe",
    price: 22000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "أرغان ديلوكس – بلسم زيت الأرغان المغذي لتنعيم الشعر وتقليل الهيشان 1000 مل",
    nameEn: "Argan De Luxe Argan Oil Nourishing Conditioner – 1000 ml",
    descriptionAr:
      "بلسم أرغان ديلوكس المغذي بحجم صالون — بزيت الأرغان المغربي 100% يرطّب وينعّم البشرة الخارجية للشعرة ويقلل الهيشان ويمنح لمعاناً.\n\n• من UPC 783583000253.\n• الحجم: 1000 مل.",
    descriptionEn:
      "Argan De Luxe nourishing conditioner — salon liter with 100% Moroccan argan oil to hydrate, smooth the cuticle, reduce frizz and add shine.\n\n• From UPC 783583000253.\n• Size: 1000 ml.",
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

  // Legacy short UPCs for Argan De Luxe
  for (const b of ["783583000420", "783583000253", "783583000260", "0783583000420", "0783583000253", "0783583000260"]) {
    await deleteByBarcode(b);
  }

  let added = 0;
  for (const p of PRODUCTS) {
    const brand = BRANDS[p.brandKey];
    const brandId = brandIds[p.brandKey]!;
    console.log(`--- ${p.barcode} ---`);
    await deleteByBarcode(p.barcode);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: `${brand.prefix}-${p.barcode.slice(-6)}`,
      barcode: p.barcode,
      slug: slugify(p.nameEn, p.barcode),
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

    const verify = await api<{ shades?: unknown[] }>(`/products/${created.id}`);
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Shades on ${p.barcode}`);
    console.log(`  ✓ ${p.nameAr}`);
    console.log(`    EN: ${p.nameEn}`);
    console.log(`    ID: ${created.id} | ${p.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`Done — added ${added}/${PRODUCTS.length}`);
  console.log("\nUnresolved barcodes (not added):");
  for (const b of UNRESOLVED_BARCODES) console.log(`  - ${b}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
