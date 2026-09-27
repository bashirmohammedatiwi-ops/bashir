/**
 * Hair-care mixed batch — separate products, no shades, no images.
 * Names via GPT Luna barcode research; hard codes via GPT 5.6 Terra.
 * Usage: npx tsx scripts/add-haircare-mixed-batch31-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const HAIR_TREATMENT = "ee39d6a6-5074-43b6-a80c-a7c1b23c3bd1";

type BrandKey =
  | "avon"
  | "batiste"
  | "revuele"
  | "syoss"
  | "lakme"
  | "selsun"
  | "goldenmaxi";

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
  avon: { brandAr: "أفون", brandEn: "Avon", prefix: "AVN" },
  batiste: { brandAr: "باتيست", brandEn: "Batiste", prefix: "BAT" },
  revuele: { brandAr: "ريفويل", brandEn: "Revuele", prefix: "REV" },
  syoss: { brandAr: "سيوس", brandEn: "Syoss", prefix: "SYS" },
  lakme: { brandAr: "لاكمي", brandEn: "Lakmé", prefix: "LKM" },
  selsun: { brandAr: "سيلسن بلو", brandEn: "Selsun Blue", prefix: "SEL" },
  goldenmaxi: { brandAr: "جولدن ماكسي", brandEn: "Golden Maxi", prefix: "GDM" },
};

/** Unresolved after Luna + Terra + web — do not invent. */
export const UNRESOLVED_BARCODES = [
  "6921074914205",
  "5059018346278",
  "5059018628060",
  "-11072480",
] as const;

const PRODUCTS: ProductDef[] = [
  {
    barcode: "5059018521385",
    brandKey: "avon",
    price: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "أفون أدفانس تكنيكس – شامبو وبلسم 2 في 1 مضاد للقشرة بالكلايمبازول 400 مل",
    nameEn: "Avon Advance Techniques Anti-Dandruff 2-in-1 Shampoo & Conditioner – 400 ml",
    descriptionAr:
      "شامبو وبلسم أفون أدفانس تكنيكس 2 في 1 مضاد للقشرة — بتقنية Climbazole يساعد على تقليل التقشر والحكة وترطيب فروة الرأس مع تنظيف Conditioner في خطوة واحدة.\n\n• يسيطر على مظهر القشرة والتقشر.\n• ينظف ويرطّب الشعر دون الحاجة لبلسم منفصل.\n• مناسب للاستخدام المنتظم على فروة الرأس المعرّضة للقشرة.\n• الحجم: 400 مل.",
    descriptionEn:
      "Avon Advance Techniques Anti-Dandruff 2-in-1 Shampoo & Conditioner — with Climbazole technology to help control flaking and itching while moisturising the scalp and conditioning in one step.\n\n• Helps reduce the look of dandruff and flakes.\n• Cleanses and conditions without a separate conditioner.\n• Suitable for regular use on dandruff-prone scalp.\n• Size: 400 ml.",
  },
  {
    barcode: "5059018115058",
    brandKey: "avon",
    price: 10000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "أفون أدفانس تكنيكس – شامبو إعادة البناء Reconstruction بكومبلكس كيرا-بانثينول 700 مل",
    nameEn: "Avon Advance Techniques Reconstruction Shampoo – 700 ml",
    descriptionAr:
      "شامبو إعادة البناء من أفون أدفانس تكنيكس — بتركيبة Kera-Panthenol Complex يغذّي ويقوّي الشعر التالف والجاف ويساعد على تقليل مظهر التقصف.\n\n• يغذّي الألياف المتضررة ويدعم مظهراً أقوى وأكثر صحة.\n• حجم اقتصادي 700 مل لغسلات أكثر.\n• مثالي للشعر الجاف والمتضرر؛ يُكمّل ببلسم Reconstruction.",
    descriptionEn:
      "Avon Advance Techniques Reconstruction Shampoo — with Kera-Panthenol Complex to nourish and strengthen dry, damaged hair and help improve the look of split ends.\n\n• Feeds damaged fibres for a healthier, stronger look.\n• Value 700 ml size for more washes.\n• Ideal for dry, damaged hair; pair with Reconstruction conditioner.",
  },
  {
    barcode: "5059018237903",
    brandKey: "avon",
    price: 8500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "أفون كير – شامبو وبلسم 2 في 1 Stay Strong بالمشمش وزبدة الشيا لتقوية الشعر 700 مل",
    nameEn: "Avon Care Stay Strong 2-in-1 Shampoo & Conditioner with Apricot & Shea – 700 ml",
    descriptionAr:
      "شامبو وبلسم أفون كير Stay Strong 2 في 1 — بمستخلص المشمش وزبدة الشيا يرطّب ويحسّن قابلية التصفيف ويساعد على تقليل تكسر الشعر.\n\n• تنظيف وتغذية في خطوة واحدة لجميع أنواع الشعر.\n• يدعم مظهراً أقوى وأكثر مرونة.\n• الحجم: 700 مل.",
    descriptionEn:
      "Avon Care Stay Strong 2-in-1 Shampoo & Conditioner — with apricot extract and shea butter to moisturise, improve manageability and help reduce breakage.\n\n• Cleanse and condition in one step for all hair types.\n• Supports a stronger, more resilient look.\n• Size: 700 ml.",
  },
  {
    barcode: "5059018237934",
    brandKey: "avon",
    price: 8500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "أفون كير – شامبو وبلسم 2 في 1 Refresh & Revitalise بالقريص واللافندر لإنعاش فروة الرأس 700 مل",
    nameEn: "Avon Care Refresh & Revitalise 2-in-1 Shampoo & Conditioner with Nettle & Lavender – 700 ml",
    descriptionAr:
      "شامبو وبلسم أفون كير Refresh & Revitalise 2 في 1 — بالقريص واللافندر ينظف بقايا الزيوت والترسبات وينعش فروة الرأس والشعر.\n\n• مثالي للشعر الذي يحتاج انتعاشاً وتنظيفاً عميقاً لطيفاً.\n• يترك الشعر نظيفاً ومنتعشاً برائحة عشبية مريحة.\n• الحجم: 700 مل.",
    descriptionEn:
      "Avon Care Refresh & Revitalise 2-in-1 Shampoo & Conditioner — with nettle and lavender to help remove buildup and excess oils while refreshing scalp and hair.\n\n• Ideal when hair needs a gentle deep clean and reset.\n• Leaves hair clean and refreshed with a soft herbal scent.\n• Size: 700 ml.",
  },
  {
    barcode: "5059018237958",
    brandKey: "avon",
    price: 8500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "أفون كير – شامبو وبلسم 2 في 1 Healthy Hydration بالصبار وزيت المكاديميا للترطيب 700 مل",
    nameEn: "Avon Care Healthy Hydration 2-in-1 Shampoo & Conditioner with Aloe & Macadamia – 700 ml",
    descriptionAr:
      "شامبو وبلسم أفون كير Healthy Hydration 2 في 1 — بالصبار وزيت جوز المكاديميا ينظف بلطف ويرطّب ويترك الشعر ناعماً حريرياً.\n\n• ترطيب يومي مريح للشعر الجاف أو العطشان.\n• خطوة واحدة للتنظيف والترطيب.\n• الحجم: 700 مل.",
    descriptionEn:
      "Avon Care Healthy Hydration 2-in-1 Shampoo & Conditioner — with aloe vera and macadamia nut oil to gently cleanse, hydrate and leave hair silky soft.\n\n• Comforting daily moisture for dry or thirsty hair.\n• One-step cleanse and condition.\n• Size: 700 ml.",
  },
  {
    barcode: "5059018237910",
    brandKey: "avon",
    price: 8500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "أفون كير – شامبو وبلسم 2 في 1 Full Volume بمستخلص التوت وبرائحة الكركديه لحجم الشعر 700 مل",
    nameEn: "Avon Care Full Volume 2-in-1 Shampoo & Conditioner with Raspberry & Hibiscus – 700 ml",
    descriptionAr:
      "شامبو وبلسم أفون كير Full Volume 2 في 1 — بمستخلص التوت ورائحة الكركديه يمنح الشعر كثافة وحجماً دون ثقل.\n\n• مناسب لجميع أنواع الشعر خاصة الرقيق المسطح.\n• ينظف ويرطّب مع دعم مظهر أكثر امتلاءً.\n• الحجم: 700 مل.",
    descriptionEn:
      "Avon Care Full Volume 2-in-1 Shampoo & Conditioner — with raspberry extract and hibiscus scent to add body and fullness without weighing hair down.\n\n• Suitable for all hair types, especially fine flat hair.\n• Cleanses and conditions while supporting a fuller look.\n• Size: 700 ml.",
  },
  {
    barcode: "5059018237927",
    brandKey: "avon",
    price: 8500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "أفون كير – شامبو وبلسم 2 في 1 Nourish & Smooth بالأفوكادو وزيت اللوز للتغذية والنعومة 700 مل",
    nameEn: "Avon Care Nourish & Smooth 2-in-1 Shampoo & Conditioner with Avocado & Almond Oil – 700 ml",
    descriptionAr:
      "شامبو وبلسم أفون كير Nourish & Smooth 2 في 1 — بزيت الأفوكادو وزيت اللوز ينظف ويغذّي وينعّم الشعر من أول غسلة.\n\n• مثالي للشعر الجاف أو الخشن الذي يحتاج نعومة وتغذية.\n• خطوة واحدة عملية للتنظيف والترطيب.\n• الحجم: 700 مل.",
    descriptionEn:
      "Avon Care Nourish & Smooth 2-in-1 Shampoo & Conditioner — with avocado and almond oil to cleanse, nourish and smooth hair from the first wash.\n\n• Ideal for dry or rough hair needing softness and nourishment.\n• Convenient one-step cleanse and condition.\n• Size: 700 ml.",
  },
  {
    barcode: "5010724527511",
    brandKey: "batiste",
    price: 12000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "باتيست – شامبو جاف تروبيكال برائحة جوز الهند الاستوائية 200 مل",
    nameEn: "Batiste Tropical Dry Shampoo – Coconut Fragrance 200 ml",
    descriptionAr:
      "شامبو باتيست الجاف تروبيكال — يمتص الزيوت الزائدة وينعش الشعر بين الغسلات برائحة جوز هند استوائية مميزة مع زيادة خفيفة في الحجم والملمس.\n\n• انتعاش سريع دون ماء.\n• مناسب لجميع ألوان وأنواع الشعر.\n• الحجم: 200 مل.",
    descriptionEn:
      "Batiste Tropical Dry Shampoo — absorbs excess oil and refreshes hair between washes with a signature tropical coconut scent plus light body and texture.\n\n• Quick refresh without water.\n• Suitable for all hair colours and types.\n• Size: 200 ml.",
  },
  {
    barcode: "3800225901345",
    brandKey: "revuele",
    price: 8000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريفويل كيراتين بلس – شامبو ترميم وتقوية الشعر التالف والهش 200 مل",
    nameEn: "Revuele Keratin+ Restorative Hair Shampoo – 200 ml",
    descriptionAr:
      "شامبو ريفويل كيراتين بلس — بمركب KERATRIX والكيراتين والأرجينين يغذّي ويساعد على ترميم الشعر الجاف والهش والمتقصف ويمنح حجماً ولمعاناً.\n\n• مناسب للشعر التالف والنحيف والجاف.\n• يدعم مظهراً أقوى وأكثر نعومة ولمعاناً.\n• الحجم: 200 مل.",
    descriptionEn:
      "Revuele Keratin+ Hair Shampoo — with KERATRIX complex, keratin and arginine to help restore brittle, dry, damaged hair with added volume and shine.\n\n• Suitable for damaged, thin and dehydrated hair.\n• Supports a stronger, smoother, shinier look.\n• Size: 200 ml.",
  },
  {
    barcode: "5010724527375",
    brandKey: "batiste",
    price: 12000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "باتيست – شامبو جاف بلاش Blush برائحة زهرية أنثوية 200 مل",
    nameEn: "Batiste Blush Floral & Flirty Dry Shampoo – 200 ml",
    descriptionAr:
      "شامبو باتيست الجاف بلاش — يمتص الدهون وينعش الشعر برائحة زهرية أنثوية مع ملمس وحجم خفيف بين الغسلات.\n\n• حل سريع للشعر الدهني دون غسل.\n• الحجم: 200 مل.",
    descriptionEn:
      "Batiste Blush Dry Shampoo — absorbs oil and refreshes hair with a floral flirty fragrance plus light texture and body between washes.\n\n• Fast fix for oily hair without washing.\n• Size: 200 ml.",
  },
  {
    barcode: "5010724532980",
    brandKey: "batiste",
    price: 12000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "باتيست – شامبو جاف Hydrate المرطّب بمستخلص الأفوكادو 200 مل",
    nameEn: "Batiste Hydrate Hydrating Dry Shampoo with Avocado – 200 ml",
    descriptionAr:
      "شامبو باتيست الجاف المرطّب Hydrate — يمتص الزيوت ويمنح نعومة وترطيباً خفيفاً بمستخلص الأفوكادو للشعر الجاف الذي يحتاج انتعاشاً دون ماء.\n\n• يجمع بين إزالة الدهون والإحساس بالنعومة.\n• الحجم: 200 مل.",
    descriptionEn:
      "Batiste Hydrate Dry Shampoo — absorbs oil while adding soft hydration with avocado extract for dry hair that still needs a water-free refresh.\n\n• Oil control with a softer, hydrated feel.\n• Size: 200 ml.",
  },
  {
    barcode: "8410436446556",
    brandKey: "syoss",
    price: 10000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "سيوس – شامبو جاف Anti-Grease مضاد للدهون بالنياسيناميد للشعر الدهني 200 مل",
    nameEn: "Syoss Anti-Grease Dry Shampoo with Niacinamide – 200 ml",
    descriptionAr:
      "شامبو سيوس الجاف Anti-Grease — مصمم للشعر الدهني ليمتص الزيوت وينعش المظهر مع النياسيناميد والبانثينول، وغالباً بدون تالك.\n\n• انتعاش سريع لفروة الرأس الدهنية.\n• يترك الشعر نظيفاً بمظهر أكثر انتعاشاً.\n• الحجم: 200 مل.",
    descriptionEn:
      "Syoss Anti-Grease Dry Shampoo — made for oily hair to absorb grease and refresh the look with niacinamide and panthenol; typically talc-free.\n\n• Fast refresh for oily scalp and roots.\n• Leaves hair looking cleaner and fresher.\n• Size: 200 ml.",
  },
  {
    barcode: "5010724527481",
    brandKey: "batiste",
    price: 12000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "باتيست – شامبو جاف أوريجينال Original كلاسيك لإنعاش الشعر وامتصاص الزيوت 200 مل",
    nameEn: "Batiste Original Clean & Classic Dry Shampoo – 200 ml",
    descriptionAr:
      "شامبو باتيست الجاف الأوريجينال — التركيبة الكلاسيكية لامتصاص الزيوت وإنعاش الشعر وزيادة الحجم برائحة حمضية زهرية خفيفة.\n\n• الأشهر عالمياً للانتعاش بين الغسلات.\n• الحجم: 200 مل.",
    descriptionEn:
      "Batiste Original Clean & Classic Dry Shampoo — the classic formula to absorb oil, refresh hair and add body with a light citrus-floral scent.\n\n• The iconic between-wash refresh.\n• Size: 200 ml.",
  },
  {
    barcode: "5010724527450",
    brandKey: "batiste",
    price: 12000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "باتيست – شامبو جاف فريش Fresh برائحة حمضية منعشة 200 مل",
    nameEn: "Batiste Fresh Dry Shampoo – Citrus Fragrance 200 ml",
    descriptionAr:
      "شامبو باتيست الجاف فريش — يمتص الزيوت وينعش الشعر برائحة حمضية نظيفة ويمنح ملمس وحجم خفيف.\n\n• مثالي لأيام الحر والرطوبة في العراق.\n• الحجم: 200 مل.",
    descriptionEn:
      "Batiste Fresh Dry Shampoo — absorbs oil and refreshes hair with a clean citrus scent plus light body and texture.\n\n• Ideal for hot, humid days between washes.\n• Size: 200 ml.",
  },
  {
    barcode: "5010724527542",
    brandKey: "batiste",
    price: 13000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "باتيست – شامبو جاف بيغ آند باونسي XXL Volume لتكثيف وحجم الشعر 200 مل",
    nameEn: "Batiste Big & Bouncy XXL Volume Dry Shampoo – 200 ml",
    descriptionAr:
      "شامبو باتيست الجاف بيغ آند باونسي XXL — يمتص الزيوت ويمنح حجماً وكثافة واضحة للشعر الرقيق أو المسطح بين الغسلات.\n\n• تركيز على الحجم والامتلاء مع الانتعاش.\n• الحجم: 200 مل.",
    descriptionEn:
      "Batiste Big & Bouncy XXL Volume Dry Shampoo — absorbs oil while boosting visible body and bounce for fine or flat hair between washes.\n\n• Volume-focused refresh with oil control.\n• Size: 200 ml.",
  },
  {
    barcode: "5060565105614",
    brandKey: "revuele",
    price: 10000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "ريفويل – بخاخ مضاد للاصفرار Anti-Yellow للشعر الأشقر والأبيض 200 مل",
    nameEn: "Revuele Anti-Yellow Blond Hair Spray – 200 ml",
    descriptionAr:
      "بخاخ ريفويل Anti-Yellow — بصبغة بنفسجية تساعد على معادلة النغمات الصفراء والنحاسية في الشعر الأشقر أو المصبوغ أو الأبيض مع تنعيم ولمعان خفيف.\n\n• يُترك على الشعر دون شطف.\n• مناسب للشعر الأشقر الطبيعي أو الملون.\n• الحجم: 200 مل.",
    descriptionEn:
      "Revuele Anti-Yellow Blond Hair Spray — purple pigments help neutralize yellow/brassy tones on blonde, highlighted or white hair with light smooth shine.\n\n• Leave-in, no-rinse formula.\n• For natural or coloured blonde hair.\n• Size: 200 ml.",
  },
  {
    barcode: "8429421440127",
    brandKey: "lakme",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لاكمي تيكنيا وايت سيلفر – شامبو مضاد للاصفرار للشعر الأشقر والأبيض 300 مل",
    nameEn: "Lakmé Teknia White Silver Anti-Yellow Shampoo – 300 ml",
    descriptionAr:
      "شامبو لاكمي تيكنيا وايت سيلفر — بصبغات بنفسجية يعادل الاصفرار غير المرغوب ويرطّب ويمنح لمعاناً للشعر الأشقر أو المظلل أو الأبيض.\n\n• تركيبة نباتية خالية من البارابين والزيوت المعدنية.\n• عناية صالونية للحفاظ على نغمة باردة نظيفة.\n• الحجم: 300 مل.",
    descriptionEn:
      "Lakmé Teknia White Silver Shampoo — violet pigments neutralize unwanted yellow tones while hydrating and adding shine to blonde, highlighted or white hair.\n\n• Vegan, paraben-free and mineral-oil-free.\n• Salon care for cool, clean blonde tones.\n• Size: 300 ml.",
  },
  {
    barcode: "8429421440226",
    brandKey: "lakme",
    price: 25000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "لاكمي تيكنيا وايت سيلفر – ماسك تفتيح ومضاد للاصفرار للشعر الأشقر 250 مل",
    nameEn: "Lakmé Teknia White Silver Brightening Anti-Yellow Hair Mask – 250 ml",
    descriptionAr:
      "ماسك لاكمي تيكنيا وايت سيلفر — يعادل النغمات الدافئة ويرمّم ويرطّب الشعر الأشقر مع نظام السيراميد واللوتس الأبيض.\n\n• علاج مكثّف بعد الشامبو المضاد للاصفرار.\n• نباتي وخالٍ من البارابين.\n• الحجم: 250 مل.",
    descriptionEn:
      "Lakmé Teknia White Silver Mask — neutralizes warm tones while repairing and hydrating blonde hair with White Lotus and Ceramide Rebuild System.\n\n• Intensive follow-up to anti-yellow shampoo.\n• Vegan and paraben-free.\n• Size: 250 ml.",
  },
  {
    barcode: "8429421442329",
    brandKey: "lakme",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لاكمي تيكنيا كورال ريد – شامبو إنعاش لون الشعر الأحمر والماهوجاني 300 مل",
    nameEn: "Lakmé Teknia Color Refresh Coral Red Shampoo – 300 ml",
    descriptionAr:
      "شامبو لاكمي تيكنيا كورال ريد — يحدّث نغمات الأحمر والماهوجاني بصبغات كاتيونية ويمنح نعومة ولمعاناً وحماية للون.\n\n• مثالي للحفاظ على حيوية الصبغة الحمراء بين جلسات الصالون.\n• نباتي وخالٍ من البارابين.\n• الحجم: 300 مل.",
    descriptionEn:
      "Lakmé Teknia Color Refresh Coral Red Shampoo — refreshes red and mahogany tones with cationic dyes while softening, conditioning and protecting colour.\n\n• Ideal to keep red colour vivid between salon visits.\n• Vegan and paraben-free.\n• Size: 300 ml.",
  },
  {
    barcode: "5060565104112",
    brandKey: "revuele",
    price: 8000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريفويل – بلسم تي تري تون أب بزيت شجرة الشاي لتغذية وتقوية الشعر 200 مل",
    nameEn: "Revuele Tea Tree Tone Up Conditioner – 200 ml",
    descriptionAr:
      "بلسم ريفويل تي تري تون أب — بمستخلص شجرة الشاي يغذّي ويقوّي وينعّم الشعر ويساعد على ترميم الملمس لجميع أنواع الشعر.\n\n• تسهيل التمشيط ونعومة يومية.\n• الحجم: 200 مل.",
    descriptionEn:
      "Revuele Tea Tree Tone Up Conditioner — with tea-tree extract to nourish, strengthen, soften and help repair hair for all hair types.\n\n• Everyday detangling and softness.\n• Size: 200 ml.",
  },
  {
    barcode: "0041167603529",
    brandKey: "selsun",
    price: 16000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "سيلسن بلو – شامبو مرطّب مضاد للقشرة بالألوفيرا Moisturizing with Aloe 325 مل تقريباً",
    nameEn: "Selsun Blue Moisturizing with Aloe Dandruff Shampoo – 11 fl oz / ~325 ml",
    descriptionAr:
      "شامبو سيلسن بلو المرطّب بالألوفيرا — ينظف فروة الرأس ويساعد على السيطرة على القشرة مع ترطيب لطيف يقلل الإحساس بالجفاف.\n\n• عناية مضادة للقشرة مع راحة مرطّبة.\n• الحجم: 11 أونصة سائلة / حوالي 325 مل.\n• الباركود المعياري EAN-13 من UPC المستخدم: 0041167603529.",
    descriptionEn:
      "Selsun Blue Moisturizing with Aloe Dandruff Shampoo — cleanses the scalp and helps control dandruff with comforting aloe moisturization.\n\n• Anti-dandruff care with a moisturizing feel.\n• Size: 11 fl oz / approx. 325 ml.\n• Normalized EAN-13 from UPC 41167603529 → 0041167603529.",
  },
  {
    barcode: "5059018498847",
    brandKey: "avon",
    price: 10000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "أفون أدفانس تكنيكس – بخاخ علاج ليف-إن Loss Control لتقوية الشعر والحد من التساقط 100 مل",
    nameEn: "Avon Advance Techniques Loss Control Leave-In Treatment Spray – 100 ml",
    descriptionAr:
      "بخاخ أفون أدفانس تكنيكس Loss Control ليف-إن — علاج يُترك على الشعر لدعم تقوية الألياف والعناية بفروة الرأس والمساعدة على تقليل مظهر التساقط المرتبط بالتكسر.\n\n• يُرش على الشعر الرطب أو الجاف دون شطف.\n• مناسب للشعر الضعيف المعرّض للتساقط.\n• الحجم: 100 مل.",
    descriptionEn:
      "Avon Advance Techniques Loss Control Leave-In Treatment Spray — leave-in care to support stronger fibres, scalp comfort and help reduce the look of breakage-related hair fall.\n\n• Spray on damp or dry hair; do not rinse.\n• Suitable for weak, fall-prone hair.\n• Size: 100 ml.",
  },
  {
    barcode: "5061076240764",
    brandKey: "revuele",
    price: 12000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "ريفويل بوتانيكال كير – ماسك روزماري لتقوية الشعر بالبيوتين والكافيين 250 مل",
    nameEn: "Revuele Botanical Care Rosemary Strengthening Hair Mask – 250 ml",
    descriptionAr:
      "ماسك ريفويل روزماري بوتانيكال كير — بإكليل الجبل والبيوتين والكافيين يرمّم ويرطّب ويقوّي الألياف ويدعم مظهر نمو صحي وتقليل التساقط.\n\n• علاج أسبوعي مكثّف للشعر الضعيف والرقيق.\n• يمنح لمعاناً ونعومة بعد الشطف.\n• الحجم: 250 مل.",
    descriptionEn:
      "Revuele Botanical Care Rosemary Strengthening Hair Mask — with rosemary, biotin and caffeine to repair, hydrate and strengthen fibres while supporting healthier-looking growth and less fall.\n\n• Intensive weekly care for weak, thinning hair.\n• Leaves hair shiny and soft after rinsing.\n• Size: 250 ml.",
  },
  {
    barcode: "4897099900092",
    brandKey: "goldenmaxi",
    price: 15000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "جولدن ماكسي – بخاخ كافيار مع كولاجين للعناية الحرارية وتعطير وتنعيم الشعر 200 مل",
    nameEn: "Golden Maxi Caviar with Collagen Hair Spray – Heat Protect & Soften 200 ml",
    descriptionAr:
      "بخاخ جولدن ماكسي كافيار مع كولاجين — ليف-إن يغذّي وينعّم ويقوّي الشعر مع حماية حرارية ورائحة لطيفة ولمعان؛ مناسب للشعر المصبوغ والمتضرر.\n\n• يُرش من مسافة 20–30 سم قبل التصفيف الحراري.\n• يساعد على تقليل الهيشان ومظهر التقصف.\n• الحجم: 200 مل.",
    descriptionEn:
      "Golden Maxi Caviar with Collagen Hair Spray — leave-in care to nourish, smooth and strengthen hair with heat protection, soft scent and shine; suitable for coloured and damaged hair.\n\n• Spray from 20–30 cm before heat styling.\n• Helps reduce frizz and the look of split ends.\n• Size: 200 ml.",
  },
  {
    barcode: "5061076240740",
    brandKey: "revuele",
    price: 11000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريفويل بوتانيكال كير – شامبو روزماري لتقوية الشعر وتحفيز النمو 400 مل",
    nameEn: "Revuele Botanical Care Rosemary Strengthening Shampoo – 400 ml",
    descriptionAr:
      "شامبو ريفويل روزماري بوتانيكال كير — بزيت إكليل الجبل والبيوتين والكافيين ينظف فروة الرأس ويقوّي الألياف ويدعم مظهر نمو أقوى خاصة للشعر الرقيق.\n\n• مناسب لجميع أنواع الشعر المعرّض للتساقط.\n• الحجم: 400 مل.",
    descriptionEn:
      "Revuele Botanical Care Rosemary Strengthening Shampoo — with rosemary oil, biotin and caffeine to cleanse the scalp, strengthen fibres and support healthier-looking growth, especially for thinning hair.\n\n• Suitable for all fall-prone hair types.\n• Size: 400 ml.",
  },
  {
    barcode: "5061076240757",
    brandKey: "revuele",
    price: 11000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ريفويل بوتانيكال كير – بلسم روزماري لتقوية وترطيب الشعر بزبدة الشيا 400 مل",
    nameEn: "Revuele Botanical Care Rosemary Strengthening Conditioner – 400 ml",
    descriptionAr:
      "بلسم ريفويل روزماري بوتانيكال كير — بإكليل الجبل والبيوتين والكافيين وزبدة الشيا يرطّب وينعّم ويقوّي الشعر ويسهّل التمشيط؛ خالٍ من السيليكون والكبريتات.\n\n• مكمّل مثالي لشامبو الروزماري.\n• الحجم: 400 مل.",
    descriptionEn:
      "Revuele Botanical Care Rosemary Strengthening Conditioner — with rosemary, biotin, caffeine and shea butter to hydrate, smooth and strengthen hair while easing detangling; silicone-free and sulfate-free.\n\n• Perfect partner to the Rosemary shampoo.\n• Size: 400 ml.",
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
    `/products/barcode-check?barcode=${barcode}`,
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
  for (const key of needed) {
    brandIds[key] = await resolveBrandId(key);
  }
  console.log("");

  // Also delete legacy UPC form if present for Selsun
  await deleteByBarcode("41167603529");
  await deleteByBarcode("041167603529");

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

    const verify = await api<{ shades?: unknown[]; images?: unknown[] }>(`/products/${created.id}`);
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Shades present on ${p.barcode}`);
    console.log(`  ✓ ${p.nameAr}`);
    console.log(`    EN: ${p.nameEn}`);
    console.log(`    ID: ${created.id} | ${p.price} IQD | images: ${verify.images?.length ?? 0}\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`Done — added ${added}/${PRODUCTS.length}`);
  if (UNRESOLVED_BARCODES.length) {
    console.log("\nUnresolved barcodes (not added — no reliable product match):");
    for (const b of UNRESOLVED_BARCODES) console.log(`  - ${b}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
