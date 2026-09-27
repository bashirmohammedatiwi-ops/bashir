/**
 * Eucerin — 27 separate dermocosmetic products (no shades, no images).
 * Sources: eucerin.com, POS data, verified barcodes
 * Usage: npx tsx scripts/add-eucerin-batch-user-single-api.ts
 * Optional: ONLY_BARCODES=72140000219 npx tsx scripts/add-eucerin-batch-user-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const DERMA = "09146169-f9c4-4649-a365-ca1b8cda365f";
const FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const BODY = "23aaaa07-91ee-4937-847e-d7866a9e937a";
const HAIR = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const HANDS = "01ad1f0d-7c15-469c-bf86-85abd135e68f";
const FEET = "905db637-498a-49bc-83e8-b3d0a335d5b6";
const SUN = "25dc8086-bffa-47af-aaf7-64d503e58a9f";

const FACE_MOIST = "21801439-d0e9-4106-b5e8-dfdd70ffeb8d";
const EYE = "09bedca5-0c6c-4a71-9b03-4bf29cecaf53";
const CLEANSERS = "05028a17-da64-4c66-b25f-73c758acc2f8";
const SUNSCREEN = "ad2a9e6b-5e20-4393-849a-e5e6c6cc97e2";
const BODY_MOIST = "fcd86b22-a0fd-47b9-ba4c-c76164dadab2";
const BODY_WASH = "35be991e-3062-4fbd-8f0a-2393bf806524";
const SHAMPOO = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const HAND_MOIST = "3cdb4e43-e28d-4cac-8677-6415ea069d4f";
const FOOT_CREAM = "d2cf1ce9-fd36-4292-80f3-9fb90c759a3c";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId: string;
  subcategoryIds: string[];
  tertiaryCategoryIds: string[];
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

function slugify(nameEn: string, barcode: string): string {
  const base = nameEn
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${barcode.slice(-6)}`;
}

function p(
  barcode: string,
  nameAr: string,
  nameEn: string,
  descAr: string,
  descEn: string,
  benefitsAr: string[],
  benefitsEn: string[],
  sub: string[],
  tert: string,
  price: number,
): ProductDef {
  return {
    barcode,
    slug: slugify(nameEn, barcode),
    sku: `EUC-${barcode.slice(-6)}`,
    price,
    originalPrice: Math.round((price * 1.12) / 250) * 250,
    categoryId: CARE,
    subcategoryId: sub[0],
    tertiaryCategoryId: tert,
    subcategoryIds: sub,
    tertiaryCategoryIds: [tert],
    nameAr,
    nameEn,
    descriptionAr: `${descAr}\n\n${benefitsAr.map((b) => `• ${b}`).join("\n")}`,
    descriptionEn: `${descEn}\n\n${benefitsEn.map((b) => `• ${b}`).join("\n")}`,
  };
}

const BODY_SUB = [BODY, DERMA];
const FACE_SUB = [FACE, DERMA];
const SUN_SUB = [SUN, FACE, DERMA];
const HAIR_SUB = [HAIR, DERMA];
const HAND_SUB = [HANDS, DERMA, BODY];
const FOOT_SUB = [FEET, BODY, DERMA];

const PRODUCTS: ProductDef[] = [
  p(
    "72140000219",
    "يوسيرين - كريم الأصلي للشفاء والترطيب Original Healing Cream 454 جم",
    "Eucerin Original Healing Cream 454g",
    "كريم يوسيرين الأصلي للشفاء — تركيبة مرطبة غنية تعالج البشرة الجافة والمتشققة والمتهيجة وتساعد على استعادة حاجز البشرة.",
    "Eucerin Original Healing Cream — rich, protective formula that helps heal very dry, cracked and irritated skin and restore the skin barrier.",
    [
      "للبشرة الجافة والمتشققة جداً",
      "يرطّب ويحمي ويعالج",
      "مناسب للوجه والجسم واليدين",
      "خالٍ من العطور والمواد المهيجة",
      "454 جم",
    ],
    [
      "For very dry, cracked skin",
      "Moisturises, protects and heals",
      "Suitable for face, body and hands",
      "Fragrance-free and gentle",
      "454g",
    ],
    BODY_SUB,
    BODY_MOIST,
    24000,
  ),
  p(
    "72140020491",
    "يوسيرين - كريم الإصلاح المتقدم Advanced Repair Cream 454 جم",
    "Eucerin Advanced Repair Cream 454g",
    "كريم يوسيرين Advanced Repair — يصلح البشرة شديدة الجفاف بتركيبة Ceramide-3 و Natural Moisturizing Factors لترطيب يدوم 48 ساعة.",
    "Eucerin Advanced Repair Cream — repairs very dry skin with Ceramide-3 and Natural Moisturizing Factors for 48-hour hydration.",
    [
      "إصلاح مكثف للجفاف الشديد",
      "Ceramide-3 وعوامل ترطيب طبيعية",
      "ترطيب يدوم حتى 48 ساعة",
      "للوجه والجسم واليدين والقدمين",
      "454 جم",
    ],
    [
      "Intensive repair for very dry skin",
      "Ceramide-3 and Natural Moisturizing Factors",
      "Up to 48-hour hydration",
      "For face, body, hands and feet",
      "454g",
    ],
    BODY_SUB,
    BODY_MOIST,
    25000,
  ),
  p(
    "72140019433",
    "يوسيرين - لوشن تهدئة البشرة Skin Calming Lotion 500 مل",
    "Eucerin Skin Calming Lotion 500ml",
    "لوشن يوسيرين لتهدئة البشرة — يرطّب البشرة الجافة والحساسة ويهدئ الحكة والتهيج بلطف.",
    "Eucerin Skin Calming Lotion — soothes dry, itchy, sensitive skin with gentle, long-lasting hydration.",
    [
      "يهدئ الحكة والتهيج",
      "للبشرة الجافة والحساسة",
      "ترطيب يومي خفيف الوزن",
      "مناسب للجسم بالكامل",
      "500 مل",
    ],
    [
      "Soothes itchiness and irritation",
      "For dry, sensitive skin",
      "Lightweight daily hydration",
      "Suitable for full body",
      "500ml",
    ],
    BODY_SUB,
    BODY_MOIST,
    22000,
  ),
  p(
    "72140003043",
    "يوسيرين - لوشن الترطيب اليومي بـ SPF 15+ Daily Hydration Lotion 500 مل",
    "Eucerin Daily Hydration Lotion SPF 15+ 500ml",
    "لوشن يوسيرين للترطيب اليومي مع حماية SPF 15+ — يرطّب البشرة ويحميها من أشعة الشمس في خطوة واحدة.",
    "Eucerin Daily Hydration Lotion SPF 15+ — daily body moisturiser with sun protection in one step.",
    [
      "ترطيب يومي للجسم",
      "حماية SPF 15+ من أشعة الشمس",
      "تركيبة خفيفة سريعة الامتصاص",
      "للبشرة العادية والجافة",
      "500 مل",
    ],
    [
      "Daily body hydration",
      "SPF 15+ sun protection",
      "Lightweight, fast-absorbing formula",
      "For normal to dry skin",
      "500ml",
    ],
    SUN_SUB,
    SUNSCREEN,
    23000,
  ),
  p(
    "72140024611",
    "يوسيرين - لوشن UreaRepair PLUS 10% يوريا 500 مل",
    "Eucerin UreaRepair PLUS Lotion 10% Urea 500ml",
    "لوشن يوسيرين UreaRepair PLUS بتركيز 10% يوريا — يرطب البشرة شديدة الجفاف ويقلل التقشر ويعيد نعومة البشرة.",
    "Eucerin UreaRepair PLUS Lotion with 10% Urea — intensely moisturises extremely dry, rough skin and reduces scaling.",
    [
      "يوريا 10% لترطيب مكثف",
      "للبشرة شديدة الجفاف والخشونة",
      "يقلل التقشر ويعيد النعومة",
      "مناسب للجسم بالكامل",
      "500 مل",
    ],
    [
      "10% urea for intensive moisture",
      "For extremely dry, rough skin",
      "Reduces scaling and restores softness",
      "Suitable for full body",
      "500ml",
    ],
    BODY_SUB,
    BODY_MOIST,
    26000,
  ),
  p(
    "4005800036798",
    "يوسيرين - شامبو DermoCapillaire Calming Urea لفروة الرأس الجافة 250 مل",
    "Eucerin DermoCapillaire Calming Urea Shampoo 250ml",
    "شامبو يوسيرين DermoCapillaire Calming Urea — ينظف فروة الرأس الجافة والحاكة بلطف ويرطّبها بفضل اليوريا واللاكتات.",
    "Eucerin DermoCapillaire Calming Urea Shampoo — gently cleanses and soothes dry, itchy scalp with urea and lactate.",
    [
      "للفروة الجافة والحاكة",
      "يوريا 5% ولاكتات مرطّبان",
      "يحتوي بوليدوكانول لتهدئة الحكة",
      "خالٍ من الصبغات والبارابين",
      "250 مل",
    ],
    [
      "For dry, itchy scalp",
      "5% urea and lactate moisturisers",
      "Polidocanol soothes itching",
      "Free from colourants and parabens",
      "250ml",
    ],
    HAIR_SUB,
    SHAMPOO,
    18000,
  ),
  p(
    "4005800283079",
    "يوسيرين - كريم جل مرطب Hyaluron-Filler Moisture Booster 200 مل",
    "Eucerin Hyaluron-Filler Moisture Booster Gel-Cream 200ml",
    "كريم جل يوسيرين Hyaluron-Filler Moisture Booster — يعزّز ترطيب البشرة ويمنحها مظهراً أكثر امتلاءً ونعومة.",
    "Eucerin Hyaluron-Filler Moisture Booster Gel-Cream — boosts hydration and plumps skin for a smoother, fresher look.",
    [
      "تركيبة كريم-جل خفيفة",
      "حمض الهيالورونيك للترطيب العميق",
      "يعزّز امتلاء البشرة",
      "للبشرة الجافة والعادية",
      "200 مل",
    ],
    [
      "Lightweight gel-cream texture",
      "Hyaluronic acid for deep hydration",
      "Boosts skin plumpness",
      "For dry to normal skin",
      "200ml",
    ],
    FACE_SUB,
    FACE_MOIST,
    24000,
  ),
  p(
    "4005800288296",
    "يوسيرين - رغوة UreaRepair PLUS للقدمين 10% يوريا 150 مل",
    "Eucerin UreaRepair PLUS 10% Urea Foot Foam 150ml",
    "رغوة يوسيرين UreaRepair PLUS للقدمين — تلين القدمين الجافة والخشنة بتركيز 10% يوريا بتركيبة خفيفة سريعة الامتصاص.",
    "Eucerin UreaRepair PLUS 10% Urea Foot Foam — softens very dry, rough feet with a lightweight, fast-absorbing foam.",
    [
      "يوريا 10% للقدمين الجافة",
      "تركيبة رغوية خفيفة",
      "تقلل الخشونة والتشقق",
      "امتصاص سريع بدون لزوجة",
      "150 مل",
    ],
    [
      "10% urea for dry feet",
      "Lightweight foam formula",
      "Reduces roughness and cracking",
      "Fast absorption, non-greasy",
      "150ml",
    ],
    FOOT_SUB,
    FOOT_CREAM,
    20000,
  ),
  p(
    "4005900480392",
    "يوسيرين - سبراي واقي شمس للأطفال Sun Kids SPF 50+ 200 مل",
    "Eucerin Sun Kids Spray SPF 50+ 200ml",
    "سبراي واقي شمس يوسيرين Sun Kids SPF 50+ — حماية واسعة الطيف للأطفال بتركيبة لطيفة مقاومة للماء.",
    "Eucerin Sun Kids Spray SPF 50+ — broad-spectrum, water-resistant sun protection specially formulated for children.",
    [
      "SPF 50+ حماية واسعة UVA/UVB",
      "مقاوم للماء",
      "تركيبة لطيفة للأطفال",
      "سهل التطبيق بشكل سبراي",
      "200 مل",
    ],
    [
      "SPF 50+ broad-spectrum UVA/UVB",
      "Water-resistant",
      "Gentle formula for children",
      "Easy spray application",
      "200ml",
    ],
    SUN_SUB,
    SUNSCREEN,
    26000,
  ),
  p(
    "4005800034428",
    "يوسيرين - كريم UreaRepair PLUS للقدمين 10% يوريا 100 مل",
    "Eucerin UreaRepair PLUS Foot Cream 10% Urea 100ml",
    "كريم يوسيرين UreaRepair PLUS للقدمين — يرطب القدمين الجافة والمتشققة بتركيز 10% يوريا لنعومة فورية ونتائج تدوم.",
    "Eucerin UreaRepair PLUS Foot Cream with 10% Urea — intensively moisturises very dry, cracked feet.",
    [
      "يوريا 10% لترطيب مكثف",
      "للقدمين الجافة والمتشققة",
      "يعيد النعومة ويقلل الخشونة",
      "مناسب للاستخدام اليومي",
      "100 مل",
    ],
    [
      "10% urea intensive moisture",
      "For very dry, cracked feet",
      "Restores softness, reduces roughness",
      "Suitable for daily use",
      "100ml",
    ],
    FOOT_SUB,
    FOOT_CREAM,
    18000,
  ),
  p(
    "72140633820",
    "يوسيرين - كريم إصلاح اليدين المتقدم Advanced Repair خالٍ من العطر 78 جم",
    "Eucerin Advanced Repair Hand Cream Fragrance Free 78g",
    "كريم يوسيرين Advanced Repair لليدين — يصلح اليدين الجافة والخشنة جداً بتركيبة خالية من العطر لراحة تدوم.",
    "Eucerin Advanced Repair Hand Cream Fragrance Free — repairs very dry, rough hands with long-lasting, fragrance-free care.",
    [
      "إصلاح مكثف لليدين الجافة",
      "خالٍ من العطر",
      "Ceramide-3 وعوامل ترطيب طبيعية",
      "امتصاص سريع بدون لزوجة",
      "78 جم",
    ],
    [
      "Intensive repair for dry hands",
      "Fragrance-free",
      "Ceramide-3 and Natural Moisturizing Factors",
      "Fast absorption, non-greasy",
      "78g",
    ],
    HAND_SUB,
    HAND_MOIST,
    16000,
  ),
  p(
    "4005800034329",
    "يوسيرين - كريم UreaRepair PLUS لليدين 5% يوريا 75 مل",
    "Eucerin UreaRepair PLUS Hand Cream 5% Urea 75ml",
    "كريم يوسيرين UreaRepair PLUS لليدين — يرطب اليدين الجافة والمتشققة بتركيز 5% يوريا لنعومة فورية.",
    "Eucerin UreaRepair PLUS Hand Cream with 5% Urea — moisturises dry, cracked hands for immediate softness.",
    [
      "يوريا 5% لليدين الجافة",
      "ترطيب فوري ونعومة ملموسة",
      "لليدين الخشنة والمتشققة",
      "امتصاص سريع",
      "75 مل",
    ],
    [
      "5% urea for dry hands",
      "Immediate softness and moisture",
      "For rough, cracked hands",
      "Fast absorption",
      "75ml",
    ],
    HAND_SUB,
    HAND_MOIST,
    15000,
  ),
  p(
    "4005800347467",
    "يوسيرين - غسول Anti-Pigment للوجه 400 مل",
    "Eucerin Anti-Pigment Cleansing Gel 400ml",
    "غسول يوسيرين Anti-Pigment — ينظف البشرة بلطف ويساعد على تقليل التصبغات وتوحيد لون البشرة بفضل Thiamidol.",
    "Eucerin Anti-Pigment Cleansing Gel — gently cleanses and helps reduce hyperpigmentation with Thiamidol.",
    [
      "ينظف البشرة بلطف",
      "يحتوي Thiamidol لمكافحة التصبغ",
      "يساعد على توحيد لون البشرة",
      "مناسب للاستخدام اليومي",
      "400 مل",
    ],
    [
      "Gentle daily cleanse",
      "With Thiamidol anti-pigment active",
      "Helps even skin tone",
      "Suitable for daily use",
      "400ml",
    ],
    FACE_SUB,
    CLEANSERS,
    22000,
  ),
  p(
    "4005800192883",
    "يوسيرين - غسول DermoPurifyer للوجه 400 مل",
    "Eucerin DermoPurifyer Cleansing Gel 400ml",
    "غسول يوسيرين DermoPurifyer — ينظف البشرة الدهنية والمعرضة لحب الشباب بلطف دون تجفيف ويزيل الشوائب والزيوت الزائدة.",
    "Eucerin DermoPurifyer Cleansing Gel — gently cleanses oily, blemish-prone skin without drying.",
    [
      "للبشرة الدهنية والمعرضة للحبوب",
      "ينظف ويزيل الزيوت الزائدة",
      "لا يجفف البشرة",
      "يحضّر البشرة للعناية التالية",
      "400 مل",
    ],
    [
      "For oily, blemish-prone skin",
      "Removes excess oil and impurities",
      "Non-drying formula",
      "Prepares skin for follow-up care",
      "400ml",
    ],
    FACE_SUB,
    CLEANSERS,
    20000,
  ),
  p(
    "4005800194849",
    "يوسيرين - لوشن غسول pH5 للبشرة الحساسة 400 مل",
    "Eucerin pH5 Washlotion 400ml",
    "لوشن غسول يوسيرين pH5 — ينظف البشرة الجافة والحساسة بلطف مع الحفاظ على توازن الحموضة الطبيعي للبشرة.",
    "Eucerin pH5 Washlotion — gently cleanses dry, sensitive skin while preserving its natural pH balance.",
    [
      "يحافظ على توازن pH البشرة",
      "للبشرة الجافة والحساسة",
      "ينظف بلطف دون جفاف",
      "مناسب للاستخدام اليومي",
      "400 مل",
    ],
    [
      "Preserves skin's natural pH",
      "For dry, sensitive skin",
      "Gentle cleanse without dryness",
      "Suitable for daily use",
      "400ml",
    ],
    [BODY, DERMA],
    BODY_WASH,
    20000,
  ),
  p(
    "72140032258",
    "يوسيرين - لوشن واقي شمس Sun Advanced Hydration SPF 50 150 جم",
    "Eucerin Sun Advanced Hydration SPF 50 Sunscreen Lotion 150g",
    "لوشن واقي شمس يوسيرين Sun Advanced Hydration SPF 50 — حماية واسعة مع حمض الهيالورونيك لترطيب يدوم 8 ساعات للوجه والجسم.",
    "Eucerin Sun Advanced Hydration SPF 50 Sunscreen Lotion — broad-spectrum protection with hyaluronic acid for 8-hour hydration.",
    [
      "SPF 50 حماية واسعة UVA/UVB",
      "حمض الهيالورونيك لترطيب 8 ساعات",
      "خالٍ من العطر والأوكسيبنزون",
      "للوجه والجسم — امتصاص سريع",
      "150 جم (5 أونصات)",
    ],
    [
      "SPF 50 broad-spectrum UVA/UVB",
      "Hyaluronic acid for 8-hour hydration",
      "Fragrance-free, no oxybenzone",
      "Face and body — fast absorption",
      "150g (5 fl oz)",
    ],
    SUN_SUB,
    SUNSCREEN,
    28000,
  ),
  p(
    "4005800182037",
    "يوسيرين - كريم جل مطفي Oil Control SPF 50+ 50 مل",
    "Eucerin Sun Oil Control Mattifying Gel-Cream SPF 50+ 50ml",
    "كريم جل مطفي يوسيرين Oil Control SPF 50+ — واقي شمس للبشرة الدهنية يقلل اللمعان ويمنح مظهراً مطفياً طوال اليوم.",
    "Eucerin Sun Oil Control Mattifying Gel-Cream SPF 50+ — mattifying sunscreen for oily skin with all-day shine control.",
    [
      "SPF 50+ للبشرة الدهنية",
      "تأثير مطفي يقلل اللمعان",
      "حماية واسعة UVA/UVB",
      "تركيبة خفيفة غير لزجة",
      "50 مل",
    ],
    [
      "SPF 50+ for oily skin",
      "Mattifying shine control",
      "Broad-spectrum UVA/UVB",
      "Lightweight, non-greasy",
      "50ml",
    ],
    SUN_SUB,
    SUNSCREEN,
    27000,
  ),
  p(
    "4005900570796",
    "يوسيرين - كريم نهاري Anti-Pigment SPF 30 50 مل",
    "Eucerin Anti-Pigment Day Cream SPF 30 50ml",
    "كريم يوسيرين Anti-Pigment النهاري SPF 30 — يقلل التصبغات ويوحّد لون البشرة مع حماية يومية من أشعة الشمس بفضل Thiamidol.",
    "Eucerin Anti-Pigment Day Cream SPF 30 — reduces dark spots and evens tone with Thiamidol and daily sun protection.",
    [
      "Thiamidol لمكافحة التصبغ",
      "SPF 30 حماية يومية",
      "يوحّد لون البشرة",
      "نتائج ملموسة خلال أسبوعين",
      "50 مل",
    ],
    [
      "Thiamidol anti-pigment active",
      "SPF 30 daily protection",
      "Evens skin tone",
      "Visible results in 2 weeks",
      "50ml",
    ],
    SUN_SUB,
    SUNSCREEN,
    30000,
  ),
  p(
    "4005900871237",
    "يوسيرين - سيروم DermoPurifyer لآثار حب الشباب ثلاثي المفعول 40 مل",
    "Eucerin DermoPurifyer Post-Acne Marks Triple Effect Serum 40ml",
    "سيروم يوسيرين DermoPurifyer لآثار حب الشباب — يعمل على تفتيح الآثار وتوحيد لون البشرة وتحسين ملمسها بتركيبة ثلاثية المفعول.",
    "Eucerin DermoPurifyer Post-Acne Marks Triple Effect Serum — fades marks, evens tone and refines skin texture.",
    [
      "ثلاثي المفعول: تفتيح وتوحيد وتحسين الملمس",
      "لآثار حب الشباب والبقع الداكنة",
      "يحتوي Thiamidol و Salicylic Acid",
      "للبشرة المعرضة للحبوب",
      "40 مل",
    ],
    [
      "Triple effect: fade, even, refine",
      "For post-acne marks and dark spots",
      "With Thiamidol and salicylic acid",
      "For blemish-prone skin",
      "40ml",
    ],
    FACE_SUB,
    FACE_MOIST,
    32000,
  ),
  p(
    "4005800119361",
    "يوسيرين - واقي شمس Oil Control SPF 50+ للبشرة الدهنية 50 مل",
    "Eucerin Sun Oil Control Gel-Cream SPF 50+ 50ml",
    "واقي شمس يوسيرين Oil Control SPF 50+ — حماية عالية للبشرة الدهنية بتركيبة جل-كريم خفيفة تقلل اللمعان.",
    "Eucerin Sun Oil Control Gel-Cream SPF 50+ — high protection for oily skin with a lightweight, shine-reducing formula.",
    [
      "SPF 50+ للبشرة الدهنية",
      "يقلل اللمعان والزيوت",
      "حماية واسعة UVA/UVB",
      "مقاوم للماء",
      "50 مل",
    ],
    [
      "SPF 50+ for oily skin",
      "Reduces shine and oiliness",
      "Broad-spectrum UVA/UVB",
      "Water-resistant",
      "50ml",
    ],
    SUN_SUB,
    SUNSCREEN,
    27000,
  ),
  p(
    "4005800321320",
    "يوسيرين - واقي شمس Hydro Protect SPF 50+ خفيف الوزن 50 مل",
    "Eucerin Sun Hydro Protect Ultra Light Fluid SPF 50+ 50ml",
    "واقي شمس يوسيرين Hydro Protect SPF 50+ — سائل خفيف الوزن يرطّب ويحمي البشرة من أشعة الشمس بامتصاص سريع.",
    "Eucerin Sun Hydro Protect Ultra Light Fluid SPF 50+ — ultra-light hydrating sunscreen with fast absorption.",
    [
      "تركيبة فائقة الخفة",
      "SPF 50+ مع ترطيب",
      "امتصاص سريع بدون بقايا بيضاء",
      "للوجه والرقبة",
      "50 مل",
    ],
    [
      "Ultra-light fluid texture",
      "SPF 50+ with hydration",
      "Fast absorption, no white cast",
      "For face and neck",
      "50ml",
    ],
    SUN_SUB,
    SUNSCREEN,
    27000,
  ),
  p(
    "4005800295485",
    "يوسيرين - واقي شمس Oil Control SPF 30 للبشرة الدهنية 50 مل",
    "Eucerin Sun Oil Control Gel-Cream SPF 30 50ml",
    "واقي شمس يوسيرين Oil Control SPF 30 — حماية يومية للبشرة الدهنية بتركيبة مطفية خفيفة.",
    "Eucerin Sun Oil Control Gel-Cream SPF 30 — daily mattifying sun protection for oily skin.",
    [
      "SPF 30 للبشرة الدهنية",
      "تأثير مطفي يومي",
      "حماية UVA/UVB",
      "تركيبة خفيفة غير لزجة",
      "50 مل",
    ],
    [
      "SPF 30 for oily skin",
      "Daily mattifying effect",
      "UVA/UVB protection",
      "Lightweight, non-greasy",
      "50ml",
    ],
    SUN_SUB,
    SUNSCREEN,
    24000,
  ),
  p(
    "4005900552372",
    "يوسيرين - جل مصحح البقع Anti-Pigment Spot Corrector 5 مل",
    "Eucerin Anti-Pigment Spot Corrector 5ml",
    "جل يوسيرين Anti-Pigment Spot Corrector — يستهدف البقع الصغيرة والتصبغات الموضعية بدقة بفضل Thiamidol وقارورة دقيقة التطبيق.",
    "Eucerin Anti-Pigment Spot Corrector — precision gel targeting small dark spots and localised hyperpigmentation with Thiamidol.",
    [
      "تطبيق دقيق للبقع الموضعية",
      "Thiamidol يقلل إنتاج الميلانين",
      "نتائج خلال أسبوعين",
      "يمنع عودة البقع",
      "5 مل",
    ],
    [
      "Precision application for local spots",
      "Thiamidol reduces melanin production",
      "Visible results in 2 weeks",
      "Prevents spot reappearance",
      "5ml",
    ],
    FACE_SUB,
    FACE_MOIST,
    15000,
  ),
  p(
    "4005800210617",
    "يوسيرين - سيروم Anti-Pigment Dual لمكافحة التصبغ 30 مل",
    "Eucerin Anti-Pigment Dual Serum 30ml",
    "سيروم يوسيرين Anti-Pigment Dual — تركيبة مزدوجة بـ Thiamidol وحمض الهيالورونيك المركّز لتقليل التصبغات وتوحيد لون البشرة.",
    "Eucerin Anti-Pigment Dual Serum — dual formula with Thiamidol and concentrated hyaluronic acid to reduce dark spots.",
    [
      "تركيبة مزدوجة: Thiamidol + هيالورونيك",
      "يقلل جميع أنواع البقع والتصبغ",
      "للوجه والرقبة والصدر",
      "نتائج خلال أسبوعين",
      "30 مل",
    ],
    [
      "Dual formula: Thiamidol + hyaluronic acid",
      "Reduces all types of dark spots",
      "For face, neck and décolleté",
      "Visible results in 2 weeks",
      "30ml",
    ],
    FACE_SUB,
    FACE_MOIST,
    30000,
  ),
  p(
    "4005808858743",
    "يوسيرين - لوشن AtopiControl للبشرة الأتوبية 250 مل",
    "Eucerin AtopiControl Lotion 250ml",
    "لوشن يوسيرين AtopiControl — يهدئ البشرة الأتوبية (الإكزيما) ويرطّبها ويقلل الحكة والاحمرار بتركيبة لطيفة.",
    "Eucerin AtopiControl Lotion — soothes atopic (eczema-prone) skin, relieves itching and redness with gentle care.",
    [
      "للبشرة الأتوبية والإكزيما",
      "يهدئ الحكة والاحمرار",
      "يرطّب ويقوّي حاجز البشرة",
      "مناسب للأطفال والبالغين",
      "250 مل",
    ],
    [
      "For atopic, eczema-prone skin",
      "Soothes itching and redness",
      "Hydrates and strengthens skin barrier",
      "Suitable for children and adults",
      "250ml",
    ],
    BODY_SUB,
    BODY_MOIST,
    22000,
  ),
  p(
    "4005800108464",
    "يوسيرين - كريم UltraSENSITIVE للبشرة الحساسة جداً 50 مل",
    "Eucerin UltraSENSITIVE Soothing Care 50ml",
    "كريم يوسيرين UltraSENSITIVE — عناية مهدئة للبشرة الحساسة جداً والمتفاعلة، يقلل الاحمرار ويقوّي تحمل البشرة.",
    "Eucerin UltraSENSITIVE Soothing Care — calming day cream for hypersensitive, reactive skin that reduces redness.",
    [
      "للبشرة الحساسة جداً والمتفاعلة",
      "يقلل الاحمرار والتهيج",
      "يقوّي تحمل البشرة",
      "خالٍ من العطور والمواد المهيجة",
      "50 مل",
    ],
    [
      "For hypersensitive, reactive skin",
      "Reduces redness and irritation",
      "Strengthens skin tolerance",
      "Fragrance-free and gentle",
      "50ml",
    ],
    FACE_SUB,
    FACE_MOIST,
    25000,
  ),
  p(
    "4005900492944",
    "يوسيرين - كريم عين Hyaluron-Filler للترطيب والمرونة 15 مل",
    "Eucerin Hyaluron-Filler Eye Cream 15ml",
    "كريم عين يوسيرين Hyaluron-Filler — يرطّب منطقة العين ويملأ الخطوط الدقيقة ويحسّن مرونة الجلد حول العين.",
    "Eucerin Hyaluron-Filler Eye Cream — hydrates the eye area, fills fine lines and improves elasticity.",
    [
      "حمض الهيالورونيك للترطيب العميق",
      "يملأ الخطوط الدقيقة حول العين",
      "يحسّن مرونة وامتلاء الجلد",
      "مناسب للاستخدام اليومي",
      "15 مل",
    ],
    [
      "Hyaluronic acid for deep hydration",
      "Fills fine lines around the eyes",
      "Improves skin elasticity and plumpness",
      "Suitable for daily use",
      "15ml",
    ],
    FACE_SUB,
    EYE,
    24000,
  ),
];

const ONLY_BARCODES = process.env.ONLY_BARCODES?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const FILTERED = ONLY_BARCODES?.length
  ? PRODUCTS.filter((p) => ONLY_BARCODES.includes(p.barcode))
  : PRODUCTS;

let token = "";
let brandId = "";

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

async function resolveBrand(): Promise<string> {
  if (brandId) return brandId;
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: "يوسيرين",
    brandEn: "Eucerin",
    createIfMissing: true,
  });
  const id = resolved.brand?.id;
  if (!id) throw new Error("Could not resolve Eucerin brand");
  brandId = id;
  console.log(`Brand: Eucerin (${id})${resolved.created ? " [created]" : ""}\n`);
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
  console.log(`Products: ${FILTERED.length} (no shades, no images, delete+readd)\n`);
  await login();
  console.log("Logged in.\n");

  const resolvedBrandId = await resolveBrand();
  let added = 0;
  let deleted = 0;

  for (const product of FILTERED) {
    console.log(`--- ${product.barcode} ---`);
    if (await deleteByBarcode(product.barcode)) deleted += 1;
    await deleteOrphanSlug(product.slug);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId: resolvedBrandId,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      tertiaryCategoryId: product.tertiaryCategoryId,
      subcategoryIds: product.subcategoryIds,
      tertiaryCategoryIds: product.tertiaryCategoryIds,
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

  console.log(`Done — added: ${added}/${FILTERED.length} | deleted: ${deleted}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
