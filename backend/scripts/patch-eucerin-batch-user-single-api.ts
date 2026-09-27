/**
 * Patch Eucerin products — update names, descriptions, categories (no delete).
 * Usage: npx tsx scripts/patch-eucerin-batch-user-single-api.ts
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

const BODY_SUB = [BODY, DERMA];
const FACE_SUB = [FACE, DERMA];
const SUN_SUB = [SUN, FACE, DERMA];
const HAIR_SUB = [HAIR, DERMA];
const HAND_SUB = [HANDS, DERMA, BODY];
const FOOT_SUB = [FEET, BODY, DERMA];

type Patch = {
  barcode: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  subcategoryId: string;
  tertiaryCategoryId: string;
  subcategoryIds: string[];
  tertiaryCategoryIds: string[];
};

function d(descAr: string, descEn: string, benefitsAr: string[], benefitsEn: string[]) {
  return {
    descriptionAr: `${descAr}\n\n${benefitsAr.map((b) => `• ${b}`).join("\n")}`,
    descriptionEn: `${descEn}\n\n${benefitsEn.map((b) => `• ${b}`).join("\n")}`,
  };
}

const PATCHES: Patch[] = [
  {
    barcode: "72140000219",
    nameAr: "يوسيرين - كريم Original Healing Cream للشفاء والترطيب 454 جم",
    nameEn: "Eucerin Original Healing Cream 454g",
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_MOIST,
    subcategoryIds: BODY_SUB,
    tertiaryCategoryIds: [BODY_MOIST],
    ...d(
      "كريم يوسيرين الأصلي للشفاء والترطيب — تركيبة مرطبة غنية تحمي البشرة الجافة والمتشققة والمتهيجة وتساعد على إصلاح حاجز البشرة.",
      "Eucerin Original Healing Cream — rich protective ointment that helps heal very dry, cracked and irritated skin.",
      ["للبشرة الجافة والمتشققة والمتهيجة", "يرطّب ويحمي ويساعد على الإصلاح", "مناسب للوجه والجسم واليدين والشفاه", "خالٍ من العطور والمواد المهيجة", "454 جم"],
      ["For very dry, cracked, irritated skin", "Moisturises, protects and helps heal", "Suitable for face, body, hands and lips", "Fragrance-free and gentle", "454g"],
    ),
  },
  {
    barcode: "72140020491",
    nameAr: "يوسيرين - كريم Advanced Repair Cream لإصلاح الجفاف الشديد 454 جم",
    nameEn: "Eucerin Advanced Repair Cream 454g",
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_MOIST,
    subcategoryIds: BODY_SUB,
    tertiaryCategoryIds: [BODY_MOIST],
    ...d(
      "كريم يوسيرين Advanced Repair — يصلح البشرة شديدة الجفاف بتركيبة Ceramide-3 وعوامل الترطيب الطبيعية لراحة تدوم حتى 48 ساعة.",
      "Eucerin Advanced Repair Cream — repairs very dry, rough skin with Ceramide-3 and Natural Moisturizing Factors for 48-hour relief.",
      ["إصلاح مكثف للبشرة شديدة الجفاف", "Ceramide-3 وعوامل ترطيب طبيعية", "ترطيب يدوم حتى 48 ساعة", "للوجه والجسم واليدين والقدمين", "454 جم"],
      ["Intensive repair for very dry skin", "Ceramide-3 and Natural Moisturizing Factors", "Up to 48-hour hydration", "For face, body, hands and feet", "454g"],
    ),
  },
  {
    barcode: "72140019433",
    nameAr: "يوسيرين - لوشن Soothing لتهدئة البشرة الجافة والحاكة 500 مل",
    nameEn: "Eucerin Soothing Lotion for Dry Itchy Skin 500ml",
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_MOIST,
    subcategoryIds: BODY_SUB,
    tertiaryCategoryIds: [BODY_MOIST],
    ...d(
      "لوشن يوسيرين المهدئ — يرطّب البشرة الجافة والحساسة ويهدئ الحكة والاحمرار بلطف مع ترطيب يومي خفيف الوزن.",
      "Eucerin Soothing Lotion — gently moisturises dry, itchy, sensitive skin and relieves irritation.",
      ["يهدئ الحكة والاحمرار", "للبشرة الجافة والحساسة", "تركيبة خفيفة للاستخدام اليومي", "مناسب لجميع أنحاء الجسم", "500 مل"],
      ["Soothes itchiness and redness", "For dry, sensitive skin", "Lightweight daily formula", "Suitable for full body", "500ml"],
    ),
  },
  {
    barcode: "72140003043",
    nameAr: "يوسيرين - لوشن Daily Hydration للترطيب اليومي SPF 15 500 مل",
    nameEn: "Eucerin Daily Hydration Lotion SPF 15 500ml",
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_MOIST,
    subcategoryIds: BODY_SUB,
    tertiaryCategoryIds: [BODY_MOIST],
    ...d(
      "لوشن يوسيرين للترطيب اليومي — يرطّب الجسم ويمنحه حماية خفيفة من أشعة الشمس بعامل SPF 15 في خطوة واحدة.",
      "Eucerin Daily Hydration Lotion SPF 15 — daily body moisturiser with broad-spectrum SPF 15 sun protection.",
      ["ترطيب يومي للجسم", "حماية SPF 15 من أشعة الشمس", "تركيبة خفيفة سريعة الامتصاص", "للبشرة العادية والجافة", "500 مل"],
      ["Daily body hydration", "Broad-spectrum SPF 15 protection", "Lightweight, fast-absorbing", "For normal to dry skin", "500ml"],
    ),
  },
  {
    barcode: "72140024611",
    nameAr: "يوسيرين - لوشن UreaRepair PLUS 10% يوريا للجسم 500 مل",
    nameEn: "Eucerin UreaRepair PLUS 10% Urea Lotion 500ml",
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_MOIST,
    subcategoryIds: BODY_SUB,
    tertiaryCategoryIds: [BODY_MOIST],
    ...d(
      "لوشن يوسيرين UreaRepair PLUS بتركيز 10% يوريا — يرطب البشرة شديدة الجفاف والخشونة ويقلل التقشر ويعيد النعومة.",
      "Eucerin UreaRepair PLUS 10% Urea Lotion — intensely moisturises extremely dry, rough, scaly skin.",
      ["يوريا 10% لترطيب مكثف", "للبشرة شديدة الجفاف والخشونة", "يقلل التقشر ويعيد النعومة", "مناسب للجسم بالكامل", "500 مل"],
      ["10% urea intensive moisture", "For extremely dry, rough skin", "Reduces scaling, restores softness", "Suitable for full body", "500ml"],
    ),
  },
  {
    barcode: "4005800036798",
    nameAr: "يوسيرين - شامبو DermoCapillaire Calming Urea لفروة الرأس الجافة 250 مل",
    nameEn: "Eucerin DermoCapillaire Calming Urea Shampoo 250ml",
    subcategoryId: HAIR,
    tertiaryCategoryId: SHAMPOO,
    subcategoryIds: HAIR_SUB,
    tertiaryCategoryIds: [SHAMPOO],
    ...d(
      "شامبو يوسيرين DermoCapillaire Calming Urea — ينظف فروة الرأس الجافة والحاكة بلطف ويرطّبها بفضل اليوريا واللاكتات وبوليدوكانول المهدئ.",
      "Eucerin DermoCapillaire Calming Urea Shampoo — gently cleanses and soothes dry, itchy scalp with 5% urea, lactate and polidocanol.",
      ["للفروة الجافة والحاكة", "يوريا 5% ولاكتات مرطّبان", "بوليدوكانول لتهدئة الحكة", "خالٍ من الصبغات والبارابين", "250 مل"],
      ["For dry, itchy scalp", "5% urea and lactate moisturisers", "Polidocanol soothes itching", "Free from colourants and parabens", "250ml"],
    ),
  },
  {
    barcode: "4005800283079",
    nameAr: "يوسيرين - كريم جل Hyaluron-Filler Moisture Booster المرطب 200 مل",
    nameEn: "Eucerin Hyaluron-Filler Moisture Booster Gel-Cream 200ml",
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_MOIST,
    subcategoryIds: FACE_SUB,
    tertiaryCategoryIds: [FACE_MOIST],
    ...d(
      "كريم جل يوسيرين Hyaluron-Filler Moisture Booster — يعزّز ترطيب البشرة ويمنحها مظهراً أكثر امتلاءً ونعومة وانتعاشاً.",
      "Eucerin Hyaluron-Filler Moisture Booster Gel-Cream — boosts hydration and plumps skin for a smoother, fresher appearance.",
      ["تركيبة كريم-جل خفيفة", "حمض الهيالورونيك للترطيب العميق", "يعزّز امتلاء البشرة", "للبشرة الجافة والعادية", "200 مل"],
      ["Lightweight gel-cream texture", "Hyaluronic acid for deep hydration", "Boosts skin plumpness", "For dry to normal skin", "200ml"],
    ),
  },
  {
    barcode: "4005800288296",
    nameAr: "يوسيرين - رغوة UreaRepair PLUS للقدمين 10% يوريا 150 مل",
    nameEn: "Eucerin UreaRepair PLUS 10% Urea Foot Foam 150ml",
    subcategoryId: FEET,
    tertiaryCategoryId: FOOT_CREAM,
    subcategoryIds: FOOT_SUB,
    tertiaryCategoryIds: [FOOT_CREAM],
    ...d(
      "رغوة يوسيرين UreaRepair PLUS للقدمين — تلين القدمين الجافة والخشنة بتركيز 10% يوريا بتركيبة رغوية خفيفة سريعة الامتصاص.",
      "Eucerin UreaRepair PLUS 10% Urea Foot Foam — softens very dry, rough feet with a lightweight, fast-absorbing foam.",
      ["يوريا 10% للقدمين الجافة", "تركيبة رغوية خفيفة", "تقلل الخشونة والتشقق", "امتصاص سريع بدون لزوجة", "150 مل"],
      ["10% urea for dry feet", "Lightweight foam formula", "Reduces roughness and cracking", "Fast absorption, non-greasy", "150ml"],
    ),
  },
  {
    barcode: "4005900480392",
    nameAr: "يوسيرين - سبراي واقي شمس Sun Kids SPF 50+ للأطفال 200 مل",
    nameEn: "Eucerin Sun Kids Spray SPF 50+ 200ml",
    subcategoryId: SUN,
    tertiaryCategoryId: SUNSCREEN,
    subcategoryIds: SUN_SUB,
    tertiaryCategoryIds: [SUNSCREEN],
    ...d(
      "سبراي واقي شمس يوسيرين Sun Kids SPF 50+ — حماية واسعة الطيف UVA/UVB للأطفال بتركيبة لطيفة مقاومة للماء.",
      "Eucerin Sun Kids Spray SPF 50+ — broad-spectrum, water-resistant sun protection formulated for children's sensitive skin.",
      ["SPF 50+ حماية واسعة UVA/UVB", "مقاوم للماء", "تركيبة لطيفة للأطفال", "سهل التطبيق بشكل سبراي", "200 مل"],
      ["SPF 50+ broad-spectrum UVA/UVB", "Water-resistant", "Gentle formula for children", "Easy spray application", "200ml"],
    ),
  },
  {
    barcode: "4005800034428",
    nameAr: "يوسيرين - كريم UreaRepair PLUS للقدمين 10% يوريا 100 مل",
    nameEn: "Eucerin UreaRepair PLUS 10% Urea Foot Cream 100ml",
    subcategoryId: FEET,
    tertiaryCategoryId: FOOT_CREAM,
    subcategoryIds: FOOT_SUB,
    tertiaryCategoryIds: [FOOT_CREAM],
    ...d(
      "كريم يوسيرين UreaRepair PLUS للقدمين — يرطب القدمين الجافة والمتشققة بتركيز 10% يوريا لنعومة فورية ونتائج تدوم.",
      "Eucerin UreaRepair PLUS 10% Urea Foot Cream — intensively moisturises very dry, cracked feet.",
      ["يوريا 10% لترطيب مكثف", "للقدمين الجافة والمتشققة", "يعيد النعومة ويقلل الخشونة", "مناسب للاستخدام اليومي", "100 مل"],
      ["10% urea intensive moisture", "For very dry, cracked feet", "Restores softness, reduces roughness", "Suitable for daily use", "100ml"],
    ),
  },
  {
    barcode: "72140633820",
    nameAr: "يوسيرين - كريم Advanced Repair لليدين خالٍ من العطر 78 جم",
    nameEn: "Eucerin Advanced Repair Hand Cream Fragrance Free 78g",
    subcategoryId: HANDS,
    tertiaryCategoryId: HAND_MOIST,
    subcategoryIds: HAND_SUB,
    tertiaryCategoryIds: [HAND_MOIST],
    ...d(
      "كريم يوسيرين Advanced Repair لليدين — يصلح اليدين الجافة والخشنة جداً بتركيبة خالية من العطر مع ترطيب يدوم.",
      "Eucerin Advanced Repair Hand Cream Fragrance Free — repairs very dry, rough hands with long-lasting, fragrance-free care.",
      ["إصلاح مكثف لليدين الجافة", "خالٍ من العطر", "Ceramide-3 وعوامل ترطيب طبيعية", "امتصاص سريع بدون لزوجة", "78 جم"],
      ["Intensive repair for dry hands", "Fragrance-free", "Ceramide-3 and Natural Moisturizing Factors", "Fast absorption, non-greasy", "78g"],
    ),
  },
  {
    barcode: "4005800034329",
    nameAr: "يوسيرين - كريم UreaRepair PLUS لليدين 5% يوريا 75 مل",
    nameEn: "Eucerin UreaRepair PLUS 5% Urea Hand Cream 75ml",
    subcategoryId: HANDS,
    tertiaryCategoryId: HAND_MOIST,
    subcategoryIds: HAND_SUB,
    tertiaryCategoryIds: [HAND_MOIST],
    ...d(
      "كريم يوسيرين UreaRepair PLUS لليدين — يرطب اليدين الجافة والمتشققة بتركيز 5% يوريا لنعومة فورية وملموسة.",
      "Eucerin UreaRepair PLUS 5% Urea Hand Cream — moisturises dry, cracked hands for immediate softness.",
      ["يوريا 5% لليدين الجافة", "ترطيب فوري ونعومة ملموسة", "لليدين الخشنة والمتشققة", "امتصاص سريع", "75 مل"],
      ["5% urea for dry hands", "Immediate softness and moisture", "For rough, cracked hands", "Fast absorption", "75ml"],
    ),
  },
  {
    barcode: "4005800347467",
    nameAr: "يوسيرين - غسول Anti-Pigment Cleansing Gel للوجه 400 مل",
    nameEn: "Eucerin Anti-Pigment Cleansing Gel 400ml",
    subcategoryId: FACE,
    tertiaryCategoryId: CLEANSERS,
    subcategoryIds: FACE_SUB,
    tertiaryCategoryIds: [CLEANSERS],
    ...d(
      "غسول يوسيرين Anti-Pigment — ينظف البشرة بلطف ويساعد على تقليل التصبغات وتوحيد لون البشرة بفضل مادة Thiamidol.",
      "Eucerin Anti-Pigment Cleansing Gel — gently cleanses and helps reduce hyperpigmentation with patented Thiamidol.",
      ["ينظف البشرة بلطف", "يحتوي Thiamidol لمكافحة التصبغ", "يساعد على توحيد لون البشرة", "مناسب للاستخدام اليومي", "400 مل"],
      ["Gentle daily cleanse", "With patented Thiamidol", "Helps even skin tone", "Suitable for daily use", "400ml"],
    ),
  },
  {
    barcode: "4005800192883",
    nameAr: "يوسيرين - غسول DermoPurifyer Cleansing Gel للبشرة الدهنية 400 مل",
    nameEn: "Eucerin DermoPurifyer Cleansing Gel 400ml",
    subcategoryId: FACE,
    tertiaryCategoryId: CLEANSERS,
    subcategoryIds: FACE_SUB,
    tertiaryCategoryIds: [CLEANSERS],
    ...d(
      "غسول يوسيرين DermoPurifyer — ينظف البشرة الدهنية والمعرضة لحب الشباب بلطف دون تجفيف ويزيل الشوائب والزيوت الزائدة.",
      "Eucerin DermoPurifyer Cleansing Gel — gently cleanses oily, blemish-prone skin without drying.",
      ["للبشرة الدهنية والمعرضة للحبوب", "ينظف ويزيل الزيوت الزائدة", "لا يجفف البشرة", "يحضّر البشرة للعناية التالية", "400 مل"],
      ["For oily, blemish-prone skin", "Removes excess oil and impurities", "Non-drying formula", "Prepares skin for follow-up care", "400ml"],
    ),
  },
  {
    barcode: "4005800194849",
    nameAr: "يوسيرين - لوشن غسول pH5 Washlotion للبشرة الحساسة 400 مل",
    nameEn: "Eucerin pH5 Washlotion 400ml",
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_WASH,
    subcategoryIds: BODY_SUB,
    tertiaryCategoryIds: [BODY_WASH],
    ...d(
      "لوشن غسول يوسيرين pH5 — ينظف البشرة الجافة والحساسة بلطف مع الحفاظ على توازن الحموضة الطبيعي دون إزالة الزيوت الضرورية.",
      "Eucerin pH5 Washlotion — gently cleanses dry, sensitive skin while preserving its natural pH balance.",
      ["يحافظ على توازن pH البشرة", "للبشرة الجافة والحساسة", "ينظف بلطف دون جفاف", "مناسب للاستخدام اليومي", "400 مل"],
      ["Preserves skin's natural pH", "For dry, sensitive skin", "Gentle cleanse without dryness", "Suitable for daily use", "400ml"],
    ),
  },
  {
    barcode: "72140032258",
    nameAr: "يوسيرين - لوشن واقي شمس Sun Advanced Hydration SPF 50 150 جم",
    nameEn: "Eucerin Sun Advanced Hydration SPF 50 Sunscreen Lotion 150g",
    subcategoryId: SUN,
    tertiaryCategoryId: SUNSCREEN,
    subcategoryIds: SUN_SUB,
    tertiaryCategoryIds: [SUNSCREEN],
    ...d(
      "لوشن واقي شمس يوسيرين Sun Advanced Hydration SPF 50 — حماية واسعة مع حمض الهيالورونيك لترطيب يدوم 8 ساعات للوجه والجسم.",
      "Eucerin Sun Advanced Hydration SPF 50 Sunscreen Lotion — broad-spectrum protection with hyaluronic acid for up to 8-hour hydration.",
      ["SPF 50 حماية واسعة UVA/UVB", "حمض الهيالورونيك لترطيب 8 ساعات", "خالٍ من العطر والأوكسيبنزون", "للوجه والجسم — امتصاص سريع", "150 جم"],
      ["SPF 50 broad-spectrum UVA/UVB", "Hyaluronic acid for 8-hour hydration", "Fragrance-free, no oxybenzone", "Face and body — fast absorption", "150g"],
    ),
  },
  {
    barcode: "4005800182037",
    nameAr: "يوسيرين - كريم جل واقي شمس Sun Oil Control Mattifying SPF 50+ 50 مل",
    nameEn: "Eucerin Sun Oil Control Mattifying Gel-Cream SPF 50+ 50ml",
    subcategoryId: SUN,
    tertiaryCategoryId: SUNSCREEN,
    subcategoryIds: SUN_SUB,
    tertiaryCategoryIds: [SUNSCREEN],
    ...d(
      "كريم جل مطفي يوسيرين Sun Oil Control SPF 50+ — واقي شمس للبشرة الدهنية يقلل اللمعان ويمنح مظهراً مطفياً طوال اليوم.",
      "Eucerin Sun Oil Control Mattifying Gel-Cream SPF 50+ — mattifying sunscreen for oily skin with all-day shine control.",
      ["SPF 50+ للبشرة الدهنية", "تأثير مطفي يقلل اللمعان", "حماية واسعة UVA/UVB", "تركيبة خفيفة غير لزجة", "50 مل"],
      ["SPF 50+ for oily skin", "Mattifying shine control", "Broad-spectrum UVA/UVB", "Lightweight, non-greasy", "50ml"],
    ),
  },
  {
    barcode: "4005900570796",
    nameAr: "يوسيرين - كريم نهاري Anti-Pigment Day Cream SPF 30 50 مل",
    nameEn: "Eucerin Anti-Pigment Day Cream SPF 30 50ml",
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_MOIST,
    subcategoryIds: [...FACE_SUB, SUN],
    tertiaryCategoryIds: [FACE_MOIST, SUNSCREEN],
    ...d(
      "كريم يوسيرين Anti-Pigment النهاري SPF 30 — يقلل التصبغات ويوحّد لون البشرة مع حماية يومية من أشعة الشمس بفضل Thiamidol.",
      "Eucerin Anti-Pigment Day Cream SPF 30 — reduces dark spots and evens tone with Thiamidol and daily SPF 30 protection.",
      ["Thiamidol لمكافحة التصبغ", "SPF 30 حماية يومية", "يوحّد لون البشرة", "نتائج ملموسة خلال أسبوعين", "50 مل"],
      ["Patented Thiamidol anti-pigment", "SPF 30 daily protection", "Evens skin tone", "Visible results in 2 weeks", "50ml"],
    ),
  },
  {
    barcode: "4005900871237",
    nameAr: "يوسيرين - سيروم DermoPurifyer Post-Acne Marks ثلاثي المفعول 40 مل",
    nameEn: "Eucerin DermoPurifyer Post-Acne Marks Triple Effect Serum 40ml",
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_MOIST,
    subcategoryIds: FACE_SUB,
    tertiaryCategoryIds: [FACE_MOIST],
    ...d(
      "سيروم يوسيرين DermoPurifyer لآثار حب الشباب — يعمل على تفتيح الآثار وتوحيد لون البشرة وتحسين ملمسها بتركيبة ثلاثية المفعول.",
      "Eucerin DermoPurifyer Post-Acne Marks Triple Effect Serum — fades marks, evens tone and refines skin texture.",
      ["ثلاثي المفعول: تفتيح وتوحيد وتحسين الملمس", "لآثار حب الشباب والبقع الداكنة", "يحتوي Thiamidol وحمض الساليسيليك", "للبشرة المعرضة للحبوب", "40 مل"],
      ["Triple effect: fade, even, refine", "For post-acne marks and dark spots", "With Thiamidol and salicylic acid", "For blemish-prone skin", "40ml"],
    ),
  },
  {
    barcode: "4005800119361",
    nameAr: "يوسيرين - كريم جل واقي شمس Sun Oil Control SPF 50+ 50 مل",
    nameEn: "Eucerin Sun Gel-Cream Oil Control SPF 50+ 50ml",
    subcategoryId: SUN,
    tertiaryCategoryId: SUNSCREEN,
    subcategoryIds: SUN_SUB,
    tertiaryCategoryIds: [SUNSCREEN],
    ...d(
      "واقي شمس يوسيرين Sun Oil Control SPF 50+ — حماية عالية للبشرة الدهنية بتركيبة جل-كريم خفيفة تقلل اللمعان ومقاومة للماء.",
      "Eucerin Sun Gel-Cream Oil Control SPF 50+ — high protection for oily skin with a lightweight, shine-reducing, water-resistant formula.",
      ["SPF 50+ للبشرة الدهنية", "يقلل اللمعان والزيوت", "حماية واسعة UVA/UVB", "مقاوم للماء", "50 مل"],
      ["SPF 50+ for oily skin", "Reduces shine and oiliness", "Broad-spectrum UVA/UVB", "Water-resistant", "50ml"],
    ),
  },
  {
    barcode: "4005800321320",
    nameAr: "يوسيرين - سائل واقي شمس Sun Hydro Protect Ultra Light SPF 50+ 50 مل",
    nameEn: "Eucerin Sun Hydro Protect Ultra Light Fluid SPF 50+ 50ml",
    subcategoryId: SUN,
    tertiaryCategoryId: SUNSCREEN,
    subcategoryIds: SUN_SUB,
    tertiaryCategoryIds: [SUNSCREEN],
    ...d(
      "سائل واقي شمس يوسيرين Sun Hydro Protect SPF 50+ — تركيبة فائقة الخفة ترطّب وتحمي البشرة من أشعة الشمس بامتصاص سريع بدون بقايا بيضاء.",
      "Eucerin Sun Hydro Protect Ultra Light Fluid SPF 50+ — ultra-light hydrating sunscreen with fast absorption and no white cast.",
      ["تركيبة فائقة الخفة", "SPF 50+ مع ترطيب", "امتصاص سريع بدون بقايا بيضاء", "للوجه والرقبة", "50 مل"],
      ["Ultra-light fluid texture", "SPF 50+ with hydration", "Fast absorption, no white cast", "For face and neck", "50ml"],
    ),
  },
  {
    barcode: "4005800295485",
    nameAr: "يوسيرين - كريم جل واقي شمس Sun Oil Control SPF 30 50 مل",
    nameEn: "Eucerin Sun Gel-Cream Oil Control SPF 30 50ml",
    subcategoryId: SUN,
    tertiaryCategoryId: SUNSCREEN,
    subcategoryIds: SUN_SUB,
    tertiaryCategoryIds: [SUNSCREEN],
    ...d(
      "واقي شمس يوسيرين Sun Oil Control SPF 30 — حماية يومية للبشرة الدهنية بتركيبة جل-كريم مطفية خفيفة.",
      "Eucerin Sun Gel-Cream Oil Control SPF 30 — daily mattifying sun protection for oily skin.",
      ["SPF 30 للبشرة الدهنية", "تأثير مطفي يومي", "حماية UVA/UVB", "تركيبة خفيفة غير لزجة", "50 مل"],
      ["SPF 30 for oily skin", "Daily mattifying effect", "UVA/UVB protection", "Lightweight, non-greasy", "50ml"],
    ),
  },
  {
    barcode: "4005900552372",
    nameAr: "يوسيرين - جل Anti-Pigment Spot Corrector لمصحح البقع 5 مل",
    nameEn: "Eucerin Anti-Pigment Spot Corrector 5ml",
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_MOIST,
    subcategoryIds: FACE_SUB,
    tertiaryCategoryIds: [FACE_MOIST],
    ...d(
      "جل يوسيرين Anti-Pigment Spot Corrector — يستهدف البقع الصغيرة والتصبغات الموضعية بدقة بفضل Thiamidol وقارورة دقيقة التطبيق.",
      "Eucerin Anti-Pigment Spot Corrector — precision gel targeting small dark spots and localised hyperpigmentation with Thiamidol.",
      ["تطبيق دقيق للبقع الموضعية", "Thiamidol يقلل إنتاج الميلانين", "نتائج خلال أسبوعين", "يمنع عودة البقع", "5 مل"],
      ["Precision application for local spots", "Thiamidol reduces melanin production", "Visible results in 2 weeks", "Prevents spot reappearance", "5ml"],
    ),
  },
  {
    barcode: "4005800210617",
    nameAr: "يوسيرين - سيروم Anti-Pigment Dual لمكافحة التصبغ 30 مل",
    nameEn: "Eucerin Anti-Pigment Dual Serum 30ml",
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_MOIST,
    subcategoryIds: FACE_SUB,
    tertiaryCategoryIds: [FACE_MOIST],
    ...d(
      "سيروم يوسيرين Anti-Pigment Dual — تركيبة مزدوجة بـ Thiamidol وحمض الهيالورونيك المركّز لتقليل التصبغات وتوحيد لون البشرة.",
      "Eucerin Anti-Pigment Dual Serum — dual-chamber formula with Thiamidol and concentrated hyaluronic acid to reduce dark spots.",
      ["تركيبة مزدوجة: Thiamidol + هيالورونيك", "يقلل جميع أنواع البقع والتصبغ", "للوجه والرقبة والصدر", "نتائج خلال أسبوعين", "30 مل"],
      ["Dual formula: Thiamidol + hyaluronic acid", "Reduces all types of dark spots", "For face, neck and décolleté", "Visible results in 2 weeks", "30ml"],
    ),
  },
  {
    barcode: "4005808858743",
    nameAr: "يوسيرين - لوشن AtopiControl للبشرة الأتوبية والإكزيما 250 مل",
    nameEn: "Eucerin AtopiControl Lotion 250ml",
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_MOIST,
    subcategoryIds: BODY_SUB,
    tertiaryCategoryIds: [BODY_MOIST],
    ...d(
      "لوشن يوسيرين AtopiControl — يهدئ البشرة الأتوبية والمصابة بالإكزيما ويرطّبها ويقلل الحكة والاحمرار بتركيبة لطيفة.",
      "Eucerin AtopiControl Lotion — soothes atopic, eczema-prone skin, relieves itching and redness.",
      ["للبشرة الأتوبية والإكزيما", "يهدئ الحكة والاحمرار", "يرطّب ويقوّي حاجز البشرة", "مناسب للأطفال والبالغين", "250 مل"],
      ["For atopic, eczema-prone skin", "Soothes itching and redness", "Hydrates and strengthens skin barrier", "Suitable for children and adults", "250ml"],
    ),
  },
  {
    barcode: "4005800108464",
    nameAr: "يوسيرين - كريم UltraSENSITIVE Soothing Care للبشرة الحساسة 50 مل",
    nameEn: "Eucerin UltraSENSITIVE Soothing Care 50ml",
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_MOIST,
    subcategoryIds: FACE_SUB,
    tertiaryCategoryIds: [FACE_MOIST],
    ...d(
      "كريم يوسيرين UltraSENSITIVE Soothing Care — عناية مهدئة نهارية للبشرة الحساسة جداً والمتفاعلة، يقلل الاحمرار ويقوّي تحمل البشرة.",
      "Eucerin UltraSENSITIVE Soothing Care — calming day cream for hypersensitive, reactive skin that reduces redness.",
      ["للبشرة الحساسة جداً والمتفاعلة", "يقلل الاحمرار والتهيج", "يقوّي تحمل البشرة", "خالٍ من العطور والمواد المهيجة", "50 مل"],
      ["For hypersensitive, reactive skin", "Reduces redness and irritation", "Strengthens skin tolerance", "Fragrance-free and gentle", "50ml"],
    ),
  },
  {
    barcode: "4005900492944",
    nameAr: "يوسيرين - كريم عين Hyaluron-Filler للترطيب والمرونة 15 مل",
    nameEn: "Eucerin Hyaluron-Filler Eye Cream 15ml",
    subcategoryId: FACE,
    tertiaryCategoryId: EYE,
    subcategoryIds: FACE_SUB,
    tertiaryCategoryIds: [EYE],
    ...d(
      "كريم عين يوسيرين Hyaluron-Filler — يرطّب منطقة العين ويملأ الخطوط الدقيقة ويحسّن مرونة وامتلاء الجلد حول العين.",
      "Eucerin Hyaluron-Filler Eye Cream — hydrates the eye area, fills fine lines and improves elasticity.",
      ["حمض الهيالورونيك للترطيب العميق", "يملأ الخطوط الدقيقة حول العين", "يحسّن مرونة وامتلاء الجلد", "مناسب للاستخدام اليومي", "15 مل"],
      ["Hyaluronic acid for deep hydration", "Fills fine lines around the eyes", "Improves skin elasticity and plumpness", "Suitable for daily use", "15ml"],
    ),
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

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Patching ${PATCHES.length} Eucerin products...\n`);
  await login();

  let patched = 0;
  let missing = 0;

  for (const patch of PATCHES) {
    const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
      `/products/barcode-check?barcode=${patch.barcode}`,
    );
    if (!check.exists || !check.product?.id) {
      console.log(`  ✗ ${patch.barcode} — not found, skipping`);
      missing += 1;
      continue;
    }

    await api(`/products/${check.product.id}`, "PATCH", {
      nameAr: patch.nameAr,
      nameEn: patch.nameEn,
      descriptionAr: patch.descriptionAr,
      descriptionEn: patch.descriptionEn,
      categoryId: CARE,
      subcategoryId: patch.subcategoryId,
      tertiaryCategoryId: patch.tertiaryCategoryId,
      subcategoryIds: patch.subcategoryIds,
      tertiaryCategoryIds: patch.tertiaryCategoryIds,
    });

    console.log(`  ✓ ${patch.barcode} — ${patch.nameAr}`);
    patched += 1;
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\nDone — patched: ${patched}/${PATCHES.length} | missing: ${missing}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
