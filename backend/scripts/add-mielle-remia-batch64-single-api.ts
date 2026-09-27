/**
 * Mielle / Remia / Inecto / Kesh King / kids mixed — no shades, no images.
 * Names via GPT Luna; hard codes via GPT 5.6 Sol.
 * Usage: npx tsx scripts/add-mielle-remia-batch64-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const MOM_BABY = "0daef5a1-9dfb-44ac-89ca-b2ac80dffbef";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const HAIR_TREATMENT = "ee39d6a6-5074-43b6-a80c-a7c1b23c3bd1";
const HAIR_STYLING = "c508347a-8844-4068-b508-9653ede66b8b";
const OIL_MASKS = "ab7c66e4-4df6-474f-b9d2-dd059dd60bfc";
const BABY_CARE = "fbacb6e2-33ed-4071-ae78-21d77aaa476c";

type BrandKey =
  | "mielle"
  | "remia"
  | "inecto"
  | "cosmaline"
  | "dabur"
  | "garnier"
  | "revuele"
  | "keshking"
  | "nitro"
  | "estelin";

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
  mielle: { brandAr: "مييل أورغانيكس", brandEn: "Mielle Organics", prefix: "MIE" },
  remia: { brandAr: "ريميا", brandEn: "Remia", prefix: "REM" },
  inecto: { brandAr: "إنكتو ناتشورالز", brandEn: "Inecto Naturals", prefix: "INC" },
  cosmaline: { brandAr: "كوزمالين", brandEn: "Cosmaline", prefix: "CSM" },
  dabur: { brandAr: "دابور أملا", brandEn: "Dabur Amla", prefix: "DBR" },
  garnier: { brandAr: "غارنييه", brandEn: "Garnier", prefix: "GAR" },
  revuele: { brandAr: "ريفويل", brandEn: "Revuele", prefix: "REV" },
  keshking: { brandAr: "كيش كينغ", brandEn: "Kesh King", prefix: "KSK" },
  nitro: { brandAr: "نيترو كندا", brandEn: "Nitro Canada", prefix: "NTR" },
  estelin: { brandAr: "إستيلين", brandEn: "Estelin", prefix: "EST" },
};

export const UNRESOLVED_BARCODES = ["6921199119592", "648564066959"] as const;

const PRODUCTS: ProductDef[] = [
  // —— Mielle ——
  {
    barcode: "0854102006381",
    brandKey: "mielle",
    price: 18000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_STYLING,
    alsoDelete: ["854102006381"],
    nameAr: "مييل أورغانيكس Pomegranate & Honey – سوفليه لفّ وتحديد التجعيدات بترطيب مكثف 340 غ",
    nameEn: "Mielle Organics Pomegranate & Honey Twisting Soufflé – 340 g (12 oz)",
    descriptionAr:
      "سوفليه مييل بالرمان والعسل — يحدد التجعيدات ويرطّب الشعر الكثيف والمجعد أثناء اللف والتصفيف.\n\n• الحجم: 340 غ / 12 أونصة.",
    descriptionEn:
      "Mielle Pomegranate & Honey Twisting Soufflé — defines and hydrates curls for twist-outs and textured styles.\n\n• Size: 340 g / 12 oz.",
  },
  {
    barcode: "0854102006763",
    brandKey: "mielle",
    price: 18000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: OIL_MASKS,
    alsoDelete: ["854102006763"],
    nameAr: "مييل أورغانيكس Rosemary Mint – ماسك تقوية الشعر بإكليل الجبل والنعناع والبيوتين 340 غ",
    nameEn: "Mielle Organics Rosemary Mint Strengthening Hair Masque with Biotin – 340 g (12 oz)",
    descriptionAr:
      "ماسك مييل Rosemary Mint — يقوّي الشعر الضعيف بتركيبة إكليل الجبل والنعناع والبيوتين.\n\n• الحجم: 340 غ / 12 أونصة.",
    descriptionEn:
      "Mielle Rosemary Mint strengthening hair masque — deep-conditions and fortifies weak hair with biotin.\n\n• Size: 340 g / 12 oz.",
  },
  {
    barcode: "0854102006398",
    brandKey: "mielle",
    price: 16000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    alsoDelete: ["854102006398"],
    nameAr: "مييل أورغانيكس Pomegranate & Honey – بلسم يُترك على الشعر لفك التشابك وترطيب التجعيدات 355 مل",
    nameEn: "Mielle Organics Pomegranate & Honey Leave-In Conditioner – 355 ml (12 fl oz)",
    descriptionAr:
      "بلسم مييل يُترك على الشعر بالرمان والعسل — يرطّب ويفك التشابك ويحضّر التجعيدات للتصفيف.\n\n• الحجم: 355 مل.",
    descriptionEn:
      "Mielle Pomegranate & Honey leave-in conditioner — detangles and hydrates curls before styling.\n\n• Size: 355 ml / 12 fl oz.",
  },
  {
    barcode: "0854102006770",
    brandKey: "mielle",
    price: 16000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    alsoDelete: ["854102006770"],
    nameAr: "مييل أورغانيكس Rosemary Mint – شامبو تقوية الشعر بإكليل الجبل والنعناع 355 مل",
    nameEn: "Mielle Organics Rosemary Mint Strengthening Shampoo – 355 ml (12 fl oz)",
    descriptionAr:
      "شامبو مييل Rosemary Mint — ينظّف ويقوّي الشعر الضعيف برائحة منعشة من إكليل الجبل والنعناع.\n\n• الحجم: 355 مل.",
    descriptionEn:
      "Mielle Rosemary Mint strengthening shampoo — cleanses and fortifies weak hair with a refreshing herbal scent.\n\n• Size: 355 ml / 12 fl oz.",
  },
  {
    barcode: "0854102006374",
    brandKey: "mielle",
    price: 18000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_STYLING,
    alsoDelete: ["854102006374"],
    nameAr: "مييل أورغانيكس Pomegranate & Honey – كريم سموذي لتحديد وتغذية التجعيدات 355 مل",
    nameEn: "Mielle Organics Pomegranate & Honey Curl Smoothie – 355 ml (12 fl oz)",
    descriptionAr:
      "كريم مييل Curl Smoothie بالرمان والعسل — يغذّي ويحدد التجعيدات بملمس كريمي.\n\n• الحجم: 355 مل.",
    descriptionEn:
      "Mielle Pomegranate & Honey Curl Smoothie — creamy curl-defining styler with rich moisture.\n\n• Size: 355 ml / 12 fl oz.",
  },
  {
    barcode: "0850001265867",
    brandKey: "mielle",
    price: 16000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    alsoDelete: ["850001265867"],
    nameAr: "مييل أورغانيكس Rosemary Mint – بلسم يُترك على الشعر لتقوية الخصل وفك التشابك 355 مل",
    nameEn: "Mielle Organics Rosemary Mint Strengthening Leave-In Conditioner – 355 ml (12 fl oz)",
    descriptionAr:
      "بلسم مييل Rosemary Mint يُترك على الشعر — يقوّي ويسهّل التمشيط بتركيبة إكليل الجبل والنعناع.\n\n• الحجم: 355 مل.",
    descriptionEn:
      "Mielle Rosemary Mint strengthening leave-in — fortifies and detangles hair with herbal care.\n\n• Size: 355 ml / 12 fl oz.",
  },
  {
    barcode: "0854102006732",
    brandKey: "mielle",
    price: 14000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: OIL_MASKS,
    alsoDelete: ["854102006732"],
    nameAr: "مييل أورغانيكس Rosemary Mint – زيت تقوية فروة الرأس والشعر بإكليل الجبل والنعناع 59 مل",
    nameEn: "Mielle Organics Rosemary Mint Scalp & Hair Strengthening Oil – 59 ml (2 fl oz)",
    descriptionAr:
      "زيت مييل Rosemary Mint — يغذّي فروة الرأس ويقوّي الشعر بزيت إكليل الجبل والنعناع.\n\n• الحجم: 59 مل / 2 أونصة.",
    descriptionEn:
      "Mielle Rosemary Mint scalp & hair strengthening oil — nourishes scalp and supports stronger-looking hair.\n\n• Size: 59 ml / 2 fl oz.",
  },

  // —— Remia (Iraqi retail confirmed) ——
  {
    barcode: "0649910051353",
    brandKey: "remia",
    price: 14000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: OIL_MASKS,
    alsoDelete: ["649910051353"],
    nameAr: "ريميا Nutrition Repair Full Effect – ماسك إصلاح وتغذية مكثفة للشعر التالف والضعيف 500 مل",
    nameEn: "Remia Nutrition Repair Full Effect Hair Mask – 500 ml",
    descriptionAr:
      "ماسك ريميا Nutrition Repair — يرطّب ويصلح الشعر الباهت والضعيف ويسهّل فك التشابك.\n\n• الحجم: 500 مل.",
    descriptionEn:
      "Remia Nutrition Repair Full Effect hair mask — nourishes damaged weak hair and eases detangling.\n\n• Size: 500 ml.",
  },
  {
    barcode: "0648564066928",
    brandKey: "remia",
    price: 7000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    alsoDelete: ["648564066928"],
    nameAr: "ريميا Nutrition Repair Full Effect – شامبو إصلاح وتغذية للشعر التالف والجاف 300 مل",
    nameEn: "Remia Nutrition Repair Full Effect Hair Shampoo – 300 ml",
    descriptionAr:
      "شامبو ريميا Nutrition Repair — ينظّف ويغذي ويساعد على إصلاح الشعر الجاف والتالف ببروتينات وفيتامينات.\n\n• الحجم: 300 مل.",
    descriptionEn:
      "Remia Nutrition Repair Full Effect shampoo — cleanses and helps repair dry damaged hair with proteins and vitamins.\n\n• Size: 300 ml.",
  },
  {
    barcode: "0649910051377",
    brandKey: "remia",
    price: 16000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    alsoDelete: ["649910051377"],
    nameAr: "ريميا Nutrition Repair Full Effect – بلسم ترطيب مزدوج بزيت الأركان للشعر الجاف 1000 مل",
    nameEn: "Remia Nutrition Repair Full Effect Conditioner – 1000 ml",
    descriptionAr:
      "بلسم ريميا Nutrition Repair — ترطيب مكثف ببروتينات وفيتامينات وزيت الأركان بحجم عائلي.\n\n• الحجم: 1000 مل / 1 لتر.",
    descriptionEn:
      "Remia Nutrition Repair Full Effect conditioner — family-size hydrating conditioner with proteins, vitamins and argan oil.\n\n• Size: 1000 ml.",
  },
  {
    barcode: "0649910051322",
    brandKey: "remia",
    price: 16000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    alsoDelete: ["649910051322", "6499100513222"],
    nameAr: "ريميا Nutrition Repair Full Effect – شامبو إصلاح وتغذية بحجم عائلي للشعر التالف 1000 مل",
    nameEn: "Remia Nutrition Repair Full Effect Hair Shampoo – 1000 ml",
    descriptionAr:
      "شامبو ريميا Nutrition Repair بحجم عائلي — يغذي ويصلح الشعر الجاف والتالف.\n\n• الحجم: 1000 مل / 1 لتر.",
    descriptionEn:
      "Remia Nutrition Repair Full Effect shampoo — family-size repairing nourishing cleanse for dry damaged hair.\n\n• Size: 1000 ml.",
  },

  // —— Inecto ——
  {
    barcode: "5012008743105",
    brandKey: "inecto",
    price: 10000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "إنكتو ناتشورالز Miracle Hydration – زيت شعر بجوز الهند لترطيب ولمعان فائق 100 مل",
    nameEn: "Inecto Naturals Miracle Hydration Coconut Hair Oil – 100 ml",
    descriptionAr:
      "زيت إنكتو بجوز الهند — يرطّب الشعر الجاف ويمنح لمعاناً ناعماً بتركيبة طبيعية.\n\n• الحجم: 100 مل.",
    descriptionEn:
      "Inecto Naturals coconut hair oil — hydrates dry hair and adds soft shine with natural coconut care.\n\n• Size: 100 ml.",
  },
  {
    barcode: "5012008743006",
    brandKey: "inecto",
    price: 10000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "إنكتو ناتشورالز Exquisite Shine – زيت شعر بالأركان للمعان ناعم وحريري 100 مل",
    nameEn: "Inecto Naturals Exquisite Shine Argan Hair Oil – 100 ml",
    descriptionAr:
      "زيت إنكتو بالأركان — يمنح لمعاناً حريرياً وينعّم الشعر دون إثقال.\n\n• الحجم: 100 مل.",
    descriptionEn:
      "Inecto Naturals argan hair oil — adds silky shine and softness without heaviness.\n\n• Size: 100 ml.",
  },
  {
    barcode: "5012008592505",
    brandKey: "inecto",
    price: 9000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "إنكتو ناتشورالز Mmm Moisture – شامبو بجوز الهند لترطيب الشعر الجاف 500 مل",
    nameEn: "Inecto Naturals Mmm Moisture Coconut Shampoo – 500 ml",
    descriptionAr:
      "شامبو إنكتو بجوز الهند — يرطّب الشعر الجاف ويمنح نعومة ولمعاناً طبيعياً.\n\n• الحجم: 500 مل.",
    descriptionEn:
      "Inecto Naturals coconut moisturizing shampoo — hydrates dry hair for soft natural shine.\n\n• Size: 500 ml.",
  },

  // —— Kids / Cosmaline / Dabur / Garnier ——
  {
    barcode: "5281019041016",
    brandKey: "cosmaline",
    price: 6000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "كوزمالين Soft Wave Kids – بخاخ فك تشابك للأطفال بالبابونج و6 أعشاب طبيعية 125 مل",
    nameEn: "Cosmaline Soft Wave Kids Detangling Spray with Camomile & 6 Herbal Extracts – 125 ml",
    descriptionAr:
      "بخاخ كوزمالين Soft Wave للأطفال — يسهّل تمشيط شعر الأطفال بلطف بالبابونج ومستخلصات عشبية.\n\n• الحجم: 125 مل.",
    descriptionEn:
      "Cosmaline Soft Wave Kids detangling spray — gentle camomile herbal leave-in for easier kids detangling.\n\n• Size: 125 ml.",
  },
  {
    barcode: "6291069716450",
    brandKey: "dabur",
    price: 7000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "دابور أملا كيدز – بخاخ تغذية وفك تشابك لشعر الأطفال 200 مل",
    nameEn: "Dabur Amla Kids Nourishing Detangler Spray – 200 ml",
    descriptionAr:
      "بخاخ دابور أملا كيدز — يغذّي ويسهّل فك تشابك شعر الأطفال بتركيبة أملا.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Dabur Amla Kids nourishing detangler — softens and eases knots in children’s hair.\n\n• Size: 200 ml.",
  },
  {
    barcode: "3600542378123",
    brandKey: "garnier",
    price: 9000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "غارنييه Botanic Therapy Kids – شامبو وفك تشابك 2 في 1 بالمشمش وزهر القطن للأطفال 400 مل",
    nameEn: "Garnier Botanic Therapy Kids 2-in-1 Apricot & Cotton Flower Shampoo & Detangler – 400 ml",
    descriptionAr:
      "شامبو غارنييه كيدز 2 في 1 — ينظّف ويسهّل التمشيط بتركيبة مشمش وزهر قطن لطيفة للأطفال.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Garnier Botanic Therapy Kids 2-in-1 — cleanses and detangles with apricot and cotton flower care.\n\n• Size: 400 ml.",
  },

  // —— Revuele ——
  {
    barcode: "5060565104129",
    brandKey: "revuele",
    price: 8000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريفويل Tea Tree Tone Up – شامبو بشجرة الشاي لتنقية فروة الرأس وإنعاشها 200 مل",
    nameEn: "Revuele Tea Tree Tone Up Shampoo – 200 ml",
    descriptionAr:
      "شامبو ريفويل بشجرة الشاي — ينقّي فروة الرأس ويمنح إحساساً منعشاً ونظافة عميقة.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Revuele Tea Tree Tone Up shampoo — purifies and freshens the scalp with tea tree care.\n\n• Size: 200 ml.",
  },

  // —— Kesh King ——
  {
    barcode: "8901248246033",
    brandKey: "keshking",
    price: 9000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كيش كينغ Ayurvedic – بلسم ضد تساقط الشعر لعلاج فروة الرأس والشعر 200 مل",
    nameEn: "Kesh King Scalp & Hair Medicine Ayurvedic Anti-Hair Fall Conditioner – 200 ml",
    descriptionAr:
      "بلسم كيش كينغ الأيورفيدي — يساعد على تقليل التساقط وتقوية الشعر ضمن روتين علاج فروة الرأس.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Kesh King Ayurvedic anti-hair-fall conditioner — supports stronger hair and scalp care against fall.\n\n• Size: 200 ml.",
  },
  {
    barcode: "8901248240284",
    brandKey: "keshking",
    price: 10000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كيش كينغ Ayurvedic – شامبو ضد تساقط الشعر بتركيبة عشبية تقليدية 340 مل",
    nameEn: "Kesh King Ayurvedic Anti-Hairfall Shampoo – 340 ml",
    descriptionAr:
      "شامبو كيش كينغ الأيورفيدي — ينظّف ويقوّي الشعر ويساعد على تقليل التساقط بتركيبة عشبية.\n\n• الحجم: 340 مل.",
    descriptionEn:
      "Kesh King Ayurvedic anti-hairfall shampoo — cleanses and fortifies hair against fall with herbal care.\n\n• Size: 340 ml.",
  },
  {
    barcode: "8901248240345",
    brandKey: "keshking",
    price: 10000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كيش كينغ Ayurvedic Damage Repair – شامبو إصلاح التلف ببروتين الحليب 340 مل",
    nameEn: "Kesh King Ayurvedic Damage Repair Shampoo with Milk Protein – 340 ml",
    descriptionAr:
      "شامبو كيش كينغ لإصلاح التلف — يعيد نعومة الشعر التالف ببروتين الحليب وتركيبة أيورفيدية.\n\n• الحجم: 340 مل.",
    descriptionEn:
      "Kesh King damage repair shampoo — restores damaged hair with milk protein Ayurvedic care.\n\n• Size: 340 ml.",
  },
  {
    barcode: "8901248230025",
    brandKey: "keshking",
    price: 10000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كيش كينغ Organic Onion – شامبو بالبصل وأوراق الكاري لتقوية الشعر ومقاومة التساقط 300 مل",
    nameEn: "Kesh King Organic Onion Shampoo with Curry Leaves – 300 ml",
    descriptionAr:
      "شامبو كيش كينغ بالبصل وأوراق الكاري — يقوّي الشعر ويساعد على تقليل التساقط بتركيبة عضوية.\n\n• الحجم: 300 مل.",
    descriptionEn:
      "Kesh King organic onion shampoo with curry leaves — strengthens hair and supports anti-fall care.\n\n• Size: 300 ml.",
  },
  {
    barcode: "8901248230018",
    brandKey: "keshking",
    price: 12000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "كيش كينغ Organic Onion – زيت شعر بالبصل وأوراق الكاري لتقوية الجذور 200 مل",
    nameEn: "Kesh King Organic Onion Hair Oil with Curry Leaves – 200 ml",
    descriptionAr:
      "زيت كيش كينغ بالبصل وأوراق الكاري — يغذّي فروة الرأس ويقوّي الجذور بتركيبة عضوية.\n\n• الحجم: 200 مل.",
    descriptionEn:
      "Kesh King organic onion hair oil with curry leaves — nourishes scalp and strengthens roots.\n\n• Size: 200 ml.",
  },

  // —— Color shampoos (single SKU, not makeup shades) ——
  {
    barcode: "6926901801246",
    brandKey: "nitro",
    price: 12000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "نيترو كندا Cinema Professional – شامبو صبغة فورية بزيت الأركان لون بني غامق 420 مل",
    nameEn: "Nitro Canada Instant Hair Dye Shampoo with Argan Oil – Dark Brown – 420 ml",
    descriptionAr:
      "شامبو نيترو كندا للصبغة الفورية — يلوّن الشعر بالبني الغامق مع تغذية بزيت الأركان.\n\n• اللون: بني غامق.\n• الحجم: 420 مل.",
    descriptionEn:
      "Nitro Canada instant hair dye shampoo — deposits dark brown colour while caring with argan oil.\n\n• Shade: Dark Brown.\n• Size: 420 ml.",
  },
  {
    barcode: "6971764155579",
    brandKey: "estelin",
    price: 10000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "إستيلين Collagen & Argan Oil – شامبو صبغة وتغذية بلون بني 400 مل",
    nameEn: "Estelin Collagen & Argan Oil Hair Color Shampoo – Brown – 400 ml",
    descriptionAr:
      "شامبو إستيلين بالكولاجين وزيت الأركان — يلوّن الشعر بالبني ويغذّي الخصل.\n\n• اللون: بني.\n• الحجم: 400 مل.",
    descriptionEn:
      "Estelin collagen & argan oil hair colour shampoo — brown toning cleanse with nourishing care.\n\n• Shade: Brown.\n• Size: 400 ml.",
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
  // softer match for Mielle / Garnier / Dabur
  const soft = items.find((x) => x.name?.toLowerCase().startsWith(b.brandEn.toLowerCase().split(" ")[0]!));
  if (soft && ["mielle", "garnier", "dabur", "cosmaline", "estelin"].includes(key)) {
    const ok =
      soft.name.toLowerCase().includes(b.brandEn.toLowerCase().split(" ")[0]!) &&
      (key !== "mielle" || soft.name.toLowerCase().includes("mielle"));
    if (ok && soft.name.toLowerCase() === b.brandEn.toLowerCase()) {
      console.log(`Brand: ${soft.name} (${soft.id}) [exact-soft]`);
      return soft.id;
    }
  }
  if (key === "mielle") {
    const m = items.find((x) => /^mielle/i.test(x.name || ""));
    if (m?.id) {
      console.log(`Brand: ${m.name} (${m.id}) [partial]`);
      return m.id;
    }
  }
  if (key === "garnier") {
    const g = items.find((x) => /^garnier$/i.test(x.name || ""));
    if (g?.id) {
      console.log(`Brand: ${g.name} (${g.id}) [partial]`);
      return g.id;
    }
  }
  if (key === "dabur") {
    const d = items.find((x) => /dabur/i.test(x.name || ""));
    if (d?.id) {
      console.log(`Brand: ${d.name} (${d.id}) [partial]`);
      return d.id;
    }
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
  const check = await api<{ exists: boolean; product?: { id: string; nameEn?: string } }>(
    `/products/barcode-check?barcode=${encodeURIComponent(barcode)}`,
  );
  if (!check.exists || !check.product?.id) return false;
  await api(`/products/${check.product.id}`, "DELETE");
  console.log(`  deleted: ${check.product.nameEn ?? check.product.id}`);
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
  console.log(`To add: ${PRODUCTS.length} | unresolved: ${UNRESOLVED_BARCODES.length}\n`);
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
    await new Promise((r) => setTimeout(r, 120));
  }

  console.log(`Done — added ${added}/${PRODUCTS.length}`);
  console.log("\nUnresolved:");
  for (const b of UNRESOLVED_BARCODES) console.log(`  - ${b}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
