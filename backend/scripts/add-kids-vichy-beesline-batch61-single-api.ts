/**
 * Kids / Vichy Dercos / Beesline / Tabac / Avon mixed — separate SKUs, no shades, no images.
 * Names via GPT Luna; hard codes via GPT 5.6 Sol.
 * Usage: npx tsx scripts/add-kids-vichy-beesline-batch61-single-api.ts
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
const HAIR_STYLING = "c508347a-8844-4068-b508-9653ede66b8b";
const BODY_CLEANSERS = "35be991e-3062-4fbd-8f0a-2393bf806524";
const DEODORANT = "9464c921-9650-421f-8e2b-6a172f7524c5";
const BABY_CARE = "fbacb6e2-33ed-4071-ae78-21d77aaa476c";

type BrandKey =
  | "cantu"
  | "sofnfree"
  | "avon"
  | "aveeno"
  | "lorenay"
  | "lorealkids"
  | "dermaderm"
  | "tabac"
  | "vichy"
  | "beesline";

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
  alsoDelete?: string[];
};

const BRANDS: Record<BrandKey, { brandAr: string; brandEn: string; prefix: string }> = {
  cantu: { brandAr: "كانتو", brandEn: "Cantu", prefix: "CNT" },
  sofnfree: { brandAr: "سوفن فري", brandEn: "Sofn'free n'pretty", prefix: "SFN" },
  avon: { brandAr: "أفون", brandEn: "Avon", prefix: "AVN" },
  aveeno: { brandAr: "أفينو", brandEn: "Aveeno", prefix: "AVO" },
  lorenay: { brandAr: "لوريناي", brandEn: "Lorenay", prefix: "LNY" },
  lorealkids: { brandAr: "لوريال كيدز", brandEn: "L'Oréal Kids", prefix: "LOK" },
  dermaderm: { brandAr: "ديرماديرم", brandEn: "DermaDerm", prefix: "DRD" },
  tabac: { brandAr: "تاباك", brandEn: "Tabac", prefix: "TBC" },
  vichy: { brandAr: "فيشي", brandEn: "Vichy", prefix: "VCH" },
  beesline: { brandAr: "بيزلاين", brandEn: "Beesline", prefix: "BSL" },
};

export const UNRESOLVED_BARCODES = [
  "8906012840264",
  "5905562764924",
  "5905562764917",
  "5905562764900",
  "5905562764979",
  "5906124905144",
  "5905562764559",
] as const;

const PRODUCTS: ProductDef[] = [
  {
    barcode: "0817513015441",
    brandKey: "cantu",
    price: 10000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_STYLING,
    alsoDelete: ["817513015441"],
    nameAr: "كانتو كير فور كيدز – بخاخ فك تشابك Conditioning Detangler بزبدة الشيا وجوز الهند والعسل للأطفال 177 مل",
    nameEn: "Cantu Care for Kids Conditioning Detangler with Shea, Coconut & Honey – 177 ml (6 fl oz)",
    descriptionAr:
      "بخاخ كنتو للأطفال — يسهّل فك التشابك ويرطّب الشعر المجعد بزبدة الشيا وزيت جوز الهند والعسل دون كبريتات قاسية.\n\n• الحجم: 177 مل / 6 أونصة.\n• من UPC 817513015441.",
    descriptionEn:
      "Cantu Care for Kids conditioning detangler — eases knots and softens kids’ textured hair with shea butter, coconut oil and honey.\n\n• Size: 177 ml / 6 fl oz.\n• From UPC 817513015441.",
  },
  {
    barcode: "0612831052037",
    brandKey: "sofnfree",
    price: 9000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    alsoDelete: ["612831052037"],
    nameAr: "سوفن فري n'pretty – كريم زيت الجزر لترطيب وتقوية شعر الأطفال والمجعد 350 مل",
    nameEn: "Sofn'free n'pretty Carrot Oil Creme Moisturizing Hair Cream – 350 ml",
    descriptionAr:
      "كريم سوفن فري بزيت الجزر — يرطّب ويغذّي الشعر الجاف والمجعد ويمنح ليونة وسهولة تصفيف.\n\n• الحجم: 350 مل تقريباً.\n• من UPC 612831052037.",
    descriptionEn:
      "Sofn'free n'pretty Carrot Oil Creme — moisturizes and softens dry or textured hair for easier styling.\n\n• Size: approx. 350 ml.\n• From UPC 612831052037.",
  },
  {
    barcode: "5059018504265",
    brandKey: "avon",
    price: 7000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "أفون كيدز – بخاخ فك تشابك برائحة المانجو لشعر الأطفال 200 مل",
    nameEn: "Avon Kids Mango Detangling Spray – 200 ml",
    descriptionAr:
      "بخاخ أفون كيدز بالمانجو — يسهّل تمشيط شعر الأطفال ويترك رائحة فواكه منعشة دون إثقال.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Avon Kids mango detangling spray — helps detangle children’s hair with a fruity mango scent.\n\n• Size: 200 ml.",
  },
  {
    barcode: "5059018495907",
    brandKey: "avon",
    price: 7000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "أفون كيدز – بخاخ فك تشابك برائحة الفواكه Fruity لشعر الأطفال 200 مل",
    nameEn: "Avon Kids Fruity Detangling Spray – 200 ml",
    descriptionAr:
      "بخاخ أفون كيدز Fruity — فك تشابك لطيف برائحة فواكه ممتعة للأطفال.\n\n• الحجم: 200 مل.\n• يُعرض أحياناً تحت علامة WOW على العبوة.",
    descriptionEn:
      "Avon Kids Fruity detangling spray — gentle kids detangler with a playful fruit scent (WOW packaging on some markets).\n\n• Size: 200 ml.",
  },
  {
    barcode: "0381372021184",
    brandKey: "aveeno",
    price: 14000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    alsoDelete: ["381372021184"],
    nameAr: "أفينو كيدز – شامبو وبلسم 2 في 1 مرطّب بمستخلص الشوفان لتنظيف وفك تشابك شعر الأطفال 354 مل",
    nameEn: "Aveeno Kids 2-in-1 Hydrating Shampoo & Conditioner with Oat Extract – 354 ml (12 fl oz)",
    descriptionAr:
      "أفينو كيدز 2 في 1 — ينظف ويرطّب ويسهّل التمشيط بمستخلص الشوفان بلطف مناسب لفروة الأطفال.\n\n• الحجم: 354 مل / 12 أونصة.",
    descriptionEn:
      "Aveeno Kids 2-in-1 hydrating shampoo & conditioner — gently cleanses, conditions and helps detangle with oat extract.\n\n• Size: 354 ml / 12 fl oz.",
  },
  {
    barcode: "0381372022822",
    brandKey: "aveeno",
    price: 13000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    alsoDelete: ["381372022822"],
    nameAr: "أفينو كيدز – بخاخ فك تشابك مرطّب بمستخلص الشوفان لشعر الأطفال 295 مل",
    nameEn: "Aveeno Kids Hydrating Detangling Spray with Oat Extract – 295 ml (10 fl oz)",
    descriptionAr:
      "بخاخ أفينو كيدز — يرطّب ويفك التشابك بمستخلص الشوفان برائحة خفيفة مناسبة للبشرة الحساسة.\n\n• الحجم: 295 مل / 10 أونصة.",
    descriptionEn:
      "Aveeno Kids hydrating detangling spray — leave-in oat-extract care that eases knots with a light kids-friendly scent.\n\n• Size: 295 ml / 10 fl oz.",
  },
  {
    barcode: "0381372021214",
    brandKey: "aveeno",
    price: 15000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    alsoDelete: ["381372021214"],
    nameAr: "أفينو كيدز – غسول وجه وجسم للبشرة الحساسة بمستخلص الشوفان للأطفال 532 مل",
    nameEn: "Aveeno Kids Sensitive Skin Face & Body Wash with Oat Extract – 532 ml (18 fl oz)",
    descriptionAr:
      "غسول أفينو كيدز للوجه والجسم — تنظيف لطيف للبشرة الحساسة بمستخلص الشوفان برائحة خفيفة.\n\n• الحجم: 532 مل / 18 أونصة.",
    descriptionEn:
      "Aveeno Kids sensitive face & body wash — gentle oat-extract cleansing for kids’ sensitive skin.\n\n• Size: 532 ml / 18 fl oz.",
  },
  {
    barcode: "8412428016792",
    brandKey: "lorenay",
    price: 6000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "لوريناي ديزني برنسيس – شامبو ورغوة استحمام 2 في 1 للأطفال 475 مل",
    nameEn: "Lorenay Disney Princess 2-in-1 Bath & Shampoo Bubble Bath – 475 ml",
    descriptionAr:
      "غسول لوريناي ديزني برنسيس 2 في 1 — شامبو ورغوة استحمام لطيفة للأطفال برائحة ممتعة.\n\n• الحجم: 475 مل.",
    descriptionEn:
      "Lorenay Disney Princess 2-in-1 bath & shampoo — gentle kids bubble bath and hair wash.\n\n• Size: 475 ml.",
  },
  {
    barcode: "8412428021406",
    brandKey: "lorenay",
    price: 6000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "لوريناي Finding Dory – شامبو ورغوة استحمام 2 في 1 للأطفال 475 مل",
    nameEn: "Lorenay Disney Finding Dory 2-in-1 Bath & Shampoo – 475 ml",
    descriptionAr:
      "غسول لوريناي Finding Dory 2 في 1 — شامبو ورغوة استحمام للأطفال بشخصية دوري.\n\n• الحجم: 475 مل.",
    descriptionEn:
      "Lorenay Finding Dory 2-in-1 bath & shampoo — gentle kids wash inspired by Disney Finding Dory.\n\n• Size: 475 ml.",
  },
  {
    barcode: "8412428011117",
    brandKey: "lorenay",
    price: 6000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "لوريناي Paw Patrol – شامبو وجل استحمام 2 في 1 للأطفال 475 مل",
    nameEn: "Lorenay Paw Patrol 2-in-1 Shampoo & Shower Gel – 475 ml",
    descriptionAr:
      "غسول لوريناي باو باترول 2 في 1 — شامبو وجل استحمام لطيف للأطفال.\n\n• الحجم: 475 مل.",
    descriptionEn:
      "Lorenay Paw Patrol 2-in-1 shampoo & shower gel — gentle kids hair and body wash.\n\n• Size: 475 ml.",
  },
  {
    barcode: "8412428015689",
    brandKey: "lorenay",
    price: 6000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "لوريناي My Little Pony – شامبو ورغوة استحمام 2 في 1 للأطفال 475 مل",
    nameEn: "Lorenay My Little Pony 2-in-1 Bath & Shampoo – 475 ml",
    descriptionAr:
      "غسول لوريناي My Little Pony 2 في 1 — شامبو ورغوة استحمام للأطفال برائحة لطيفة.\n\n• الحجم: 475 مل.",
    descriptionEn:
      "Lorenay My Little Pony 2-in-1 bath & shampoo — gentle kids bubble bath and shampoo.\n\n• Size: 475 ml.",
  },
  {
    barcode: "8412428013913",
    brandKey: "lorenay",
    price: 6000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "لوريناي DreamWorks Trolls – شامبو ورغوة استحمام 2 في 1 للأطفال 475 مل",
    nameEn: "Lorenay DreamWorks Trolls 2-in-1 Bath & Shampoo – 475 ml",
    descriptionAr:
      "غسول لوريناي ترولز 2 في 1 — شامبو ورغوة استحمام ممتعة للأطفال.\n\n• الحجم: 475 مل.",
    descriptionEn:
      "Lorenay DreamWorks Trolls 2-in-1 bath & shampoo — fun gentle kids wash.\n\n• Size: 475 ml.",
  },
  {
    barcode: "8412428017553",
    brandKey: "lorenay",
    price: 6000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "لوريناي Sofia the First – شامبو ورغوة استحمام 2 في 1 للأطفال 475 مل",
    nameEn: "Lorenay Disney Sofia the First 2-in-1 Bubble Bath & Shampoo – 475 ml",
    descriptionAr:
      "غسول لوريناي صوفيا الأولى 2 في 1 — شامبو ورغوة استحمام للأطفال.\n\n• الحجم: 475 مل.",
    descriptionEn:
      "Lorenay Sofia the First 2-in-1 bubble bath & shampoo — gentle Disney kids wash.\n\n• Size: 475 ml.",
  },
  {
    barcode: "7506078919372",
    brandKey: "lorealkids",
    price: 8000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "لوريال كيدز Manzanilla – شامبو أطفال بالبابونج لتنظيف لطيف وإبراز اللمعان 265 مل",
    nameEn: "L'Oréal Kids Manzanilla Chamomile Shampoo – 265 ml",
    descriptionAr:
      "شامبو لوريال كيدز بالبابونج (Manzanilla) — تنظيف لطيف لشعر الأطفال مع لمسة لمعان.\n\n• الحجم: 265 مل.",
    descriptionEn:
      "L'Oréal Kids Manzanilla chamomile shampoo — gentle kids cleanse with soft shine care.\n\n• Size: 265 ml.",
  },
  {
    barcode: "8697429000890",
    brandKey: "dermaderm",
    price: 12000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "ديرماديرم Mavi – سيروم تقوية الشعر بالبيوتين والبانثينول وفيتامين E والكيراتين 125 مل",
    nameEn: "DermaDerm Mavi Hair Strengthening Serum with Biotin, Panthenol, Vitamin E & Keratin – 125 ml",
    descriptionAr:
      "سيروم ديرماديرم الأزرق Mavi — يقوّي الشعر ويغذّي الخصل ببيوتين وبانثينول وفيتامين E وكيراتين ومستخلص التوت.\n\n• الحجم: 125 مل.",
    descriptionEn:
      "DermaDerm Mavi blue hair serum — strengthens and energizes hair with biotin, panthenol, vitamin E, keratin and blueberry extract.\n\n• Size: 125 ml.",
  },
  {
    barcode: "4011700410910",
    brandKey: "tabac",
    price: 12000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "تاباك Original – بخاخ مزيل عرق رجالي كلاسيكي بحماية طويلة وانتعاش 250 مل",
    nameEn: "Tabac Original Men’s Deodorant Spray – 250 ml",
    descriptionAr:
      "بخاخ تاباك Original — مزيل عرق رجالي كلاسيكي برائحة التبغ المميزة وحماية تدوم مع إحساس انتعاش.\n\n• الحجم: 250 مل.\n• Mäurer & Wirtz.",
    descriptionEn:
      "Tabac Original deodorant spray — classic men’s aerosol deodorant with the signature Tabac scent and lasting freshness.\n\n• Size: 250 ml.\n• Mäurer & Wirtz.",
  },
  {
    barcode: "3337871324629",
    brandKey: "vichy",
    price: 28000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "فيشي ديركوس Neogenic – شامبو تكثيف وإعادة كثافة الشعر الخفيف 200 مل",
    nameEn: "Vichy Dercos Neogenic Redensifying Shampoo – 200 ml",
    descriptionAr:
      "شامبو فيشي ديركوس Neogenic — يساعد على تكثيف مظهر الشعر الخفيف وإعادة كثافته بتركيبة ديرماتولوجية.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Vichy Dercos Neogenic redensifying shampoo — dermatological care to help densify the look of thinning hair.\n\n• Size: 200 ml.",
  },
  {
    barcode: "3337871323394",
    brandKey: "vichy",
    price: 24000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "فيشي ديركوس – شامبو علاج ضد القشرة لفروة الرأس الحساسة 200 مل",
    nameEn: "Vichy Dercos Anti-Dandruff Treatment Shampoo for Sensitive Scalp – 200 ml",
    descriptionAr:
      "شامبو فيشي ديركوس ضد القشرة — يعالج القشرة وتهدّئ فروة الرأس الحساسة بتركيبة ديرماتولوجية.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Vichy Dercos anti-dandruff treatment shampoo for sensitive scalp — helps clear flakes while respecting scalp comfort.\n\n• Size: 200 ml.",
  },
  {
    barcode: "3337871311292",
    brandKey: "vichy",
    price: 24000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "فيشي ديركوس Energy+ – شامبو منشط لتقوية الشعر الضعيف ومقاومة التساقط 200 مل",
    nameEn: "Vichy Dercos Energy+ Energising Anti-Hair-Loss Shampoo – 200 ml",
    descriptionAr:
      "شامبو فيشي ديركوس Energy+ — ينشّط فروة الرأس ويقوّي الشعر الضعيف ضمن روتين مقاومة التساقط.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Vichy Dercos Energy+ energising shampoo — strengthens weak hair and supports an anti-hair-loss routine.\n\n• Size: 200 ml.",
  },
  {
    barcode: "3337871330286",
    brandKey: "vichy",
    price: 24000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "فيشي ديركوس – شامبو ضد القشرة بفعل متقدم للشعر العادي إلى الدهني 200 مل",
    nameEn: "Vichy Dercos Anti-Dandruff Advanced Action Shampoo for Normal to Oily Hair – 200 ml",
    descriptionAr:
      "شامبو فيشي ديركوس Advanced Action — يزيل القشرة ويستهدف فروة الشعر العادية إلى الدهنية.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Vichy Dercos advanced-action anti-dandruff shampoo — targets dandruff on normal to oily hair and scalp.\n\n• Size: 200 ml.",
  },
  {
    barcode: "3337875486736",
    brandKey: "vichy",
    price: 24000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "فيشي ديركوس Ultra-Soothing – شامبو مهدّئ فائق للشعر الجاف وفروة الرأس الحساسة 200 مل",
    nameEn: "Vichy Dercos Ultra-Soothing Shampoo for Dry Hair – 200 ml",
    descriptionAr:
      "شامبو فيشي ديركوس Ultra-Soothing — يهدّئ فروة الرأس الحساسة ويرطّب الشعر الجاف بتركيبة ديرماتولوجية.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Vichy Dercos Ultra-Soothing shampoo — calms sensitive scalp comfort while caring for dry hair.\n\n• Size: 200 ml.",
  },
  {
    barcode: "5281018712740",
    brandKey: "beesline",
    price: 14000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بيزلاين Radiant Bright – سيروم تحت الإبط فيتامين C يؤخر الحاجة للحلاقة ويجف بسرعة 150 مل",
    nameEn: "Beesline Radiant Bright Underarm Serum Delays Shaving with Vitamin C – 150 ml",
    descriptionAr:
      "سيروم بيزلاين تحت الإبط Delays Shaving — يفتح ويهدّئ ويؤخر نمو الشعر الظاهر مع حماية من الرائحة خالية من الألمنيوم.\n\n• الحجم: 150 مل.",
    descriptionEn:
      "Beesline Radiant Bright underarm serum Delays Shaving — brightening fast-dry deo-serum that helps delay visible hair growth; aluminum-free.\n\n• Size: 150 ml.",
  },
  {
    barcode: "5281018712764",
    brandKey: "beesline",
    price: 14000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بيزلاين Radiant Bright – سيروم تحت الإبط برائحة الورد الجوري وفيتامين C يجف بسرعة 150 مل",
    nameEn: "Beesline Radiant Bright Underarm Serum Jouri Rose with Vitamin C – 150 ml",
    descriptionAr:
      "سيروم بيزلاين تحت الإبط Jouri Rose — تفتيح وانتعاش برائحة الورد الجوري مع تركيبة سريعة الجفاف.\n\n• الحجم: 150 مل.",
    descriptionEn:
      "Beesline Radiant Bright underarm serum Jouri Rose — brightening fast-dry deo-serum with a soft rose scent.\n\n• Size: 150 ml.",
  },
  {
    barcode: "5281018713556",
    brandKey: "beesline",
    price: 14000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بيزلاين Radiant Bright – سيروم تحت الإبط بخيار والشاي الأخضر وفيتامين C يجف بسرعة 150 مل",
    nameEn: "Beesline Radiant Bright Underarm Serum Cucumber & Green Tea with Vitamin C – 150 ml",
    descriptionAr:
      "سيروم بيزلاين تحت الإبط Cucumber & Green Tea — تفتيح وانتعاش بتركيبة خيار وشاي أخضر سريعة الجفاف.\n\n• الحجم: 150 مل.",
    descriptionEn:
      "Beesline Radiant Bright underarm serum Cucumber & Green Tea — brightening fast-dry deo-serum with a fresh green scent.\n\n• Size: 150 ml.",
  },
  {
    barcode: "5281018712733",
    brandKey: "beesline",
    price: 14000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بيزلاين Radiant Bright – سيروم تحت الإبط خالٍ من العطر بفيتامين C للبشرة الحساسة 150 مل",
    nameEn: "Beesline Radiant Bright Underarm Serum Fragrance Free with Vitamin C – 150 ml",
    descriptionAr:
      "سيروم بيزلاين تحت الإبط Fragrance Free — تفتيح وحماية من الرائحة بدون عطر مناسب للبشرة الحساسة.\n\n• الحجم: 150 مل.",
    descriptionEn:
      "Beesline Radiant Bright underarm serum Fragrance Free — brightening aluminum-free deo-serum without perfume for sensitive skin.\n\n• Size: 150 ml.",
  },
  {
    barcode: "5281018712726",
    brandKey: "beesline",
    price: 14000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بيزلاين Radiant Bright – سيروم تحت الإبط Instant Bright لتفتيح فوري بفيتامين C 150 مل",
    nameEn: "Beesline Radiant Bright Underarm Serum Instant Bright with Vitamin C – 150 ml",
    descriptionAr:
      "سيروم بيزلاين تحت الإبط Instant Bright — يساعد على مظهر إشراق فوري تحت الإبط مع حماية من الرائحة سريعة الجفاف.\n\n• الحجم: 150 مل.",
    descriptionEn:
      "Beesline Radiant Bright underarm serum Instant Bright — brightening fast-dry deo-serum for a visibly fresher underarm look.\n\n• Size: 150 ml.",
  },
  {
    barcode: "5281018712771",
    brandKey: "beesline",
    price: 14000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بيزلاين Radiant Bright – سيروم تحت الإبط Silky Touch لمسة حريرية بفيتامين C 150 مل",
    nameEn: "Beesline Radiant Bright Underarm Serum Silky Touch with Vitamin C – 150 ml",
    descriptionAr:
      "سيروم بيزلاين تحت الإبط Silky Touch — تفتيح وانتعاش بملمس حريري سريع الجفاف.\n\n• الحجم: 150 مل.",
    descriptionEn:
      "Beesline Radiant Bright underarm serum Silky Touch — brightening fast-dry deo-serum with a silky soft finish.\n\n• Size: 150 ml.",
  },
  {
    barcode: "5281018712757",
    brandKey: "beesline",
    price: 14000,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "بيزلاين Radiant Bright – سيروم تحت الإبط Powder Soft بملمس بودري ناعم وفيتامين C 150 مل",
    nameEn: "Beesline Radiant Bright Underarm Serum Powder Soft with Vitamin C – 150 ml",
    descriptionAr:
      "سيروم بيزلاين تحت الإبط Powder Soft — تفتيح وانتعاش بإحساس بودري ناعم بعد الجفاف.\n\n• الحجم: 150 مل.",
    descriptionEn:
      "Beesline Radiant Bright underarm serum Powder Soft — brightening fast-dry deo-serum with a soft powdery finish.\n\n• Size: 150 ml.",
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
  const listed = await api<Array<{ id: string; name: string }> | { items?: Array<{ id: string; name: string }> }>(
    `/brands?search=${encodeURIComponent(b.brandEn)}&limit=100`,
  );
  const items = Array.isArray(listed) ? listed : (listed as { items?: Array<{ id: string; name: string }> }).items ?? [];
  const exact = items.find((x) => x.name?.toLowerCase() === b.brandEn.toLowerCase());
  if (exact?.id) {
    console.log(`Brand: ${exact.name} (${exact.id}) [exact]`);
    return exact.id;
  }
  const created = await api<{ id: string }>("/brands", "POST", {
    name: b.brandEn,
    slug: `${b.brandEn.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-5)}`,
    isActive: true,
  });
  console.log(`Brand: ${b.brandEn} (${created.id}) [created]`);
  return created.id;
}

async function deleteByBarcode(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean; product?: { id: string; nameEn?: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${encodeURIComponent(barcode)}`,
  );
  if (!check.exists || !check.product?.id) return false;
  await api(`/products/${check.product.id}`, "DELETE");
  console.log(`  deleted: ${check.product.nameEn ?? check.product.nameAr ?? check.product.id}`);
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

  let added = 0;
  for (const p of PRODUCTS) {
    const brand = BRANDS[p.brandKey];
    console.log(`--- ${p.barcode} ---`);
    for (const extra of p.alsoDelete ?? []) await deleteByBarcode(extra);
    await deleteByBarcode(p.barcode);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: `${brand.prefix}-${p.barcode.slice(-8)}-${Date.now().toString().slice(-5)}`,
      barcode: p.barcode,
      slug: slugify(p.nameEn, p.barcode),
      brandId: brandIds[p.brandKey]!,
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

    const verify = await api<{ shades?: unknown[]; brand?: { name?: string } }>(`/products/${created.id}`);
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Shades on ${p.barcode}`);
    console.log(`  ✓ ${p.nameAr}`);
    console.log(`    EN: ${p.nameEn}`);
    console.log(`    brand: ${verify.brand?.name ?? brand.brandEn} | ID: ${created.id} | ${p.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 180));
  }

  console.log(`Done — added ${added}/${PRODUCTS.length}`);
  console.log("\nUnresolved barcodes (not added):");
  for (const b of UNRESOLVED_BARCODES) console.log(`  - ${b}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
