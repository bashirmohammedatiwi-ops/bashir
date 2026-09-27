/**
 * Essence — 17 barcodes (mascaras, eyes, brows, lips, face, tools).
 * Usage: API_BASE=https://deemaalhayat.com/api/v1 ADMIN_PASSWORD=000000 npx tsx scripts/add-essence-batch-17-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";

const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const MASCARA = "e1032b57-c1af-49e3-a408-130468f22736";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";

const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FACE_PRIMER = "d179ae24-9cf5-4a70-8dbd-bedd0cfbef0b";

const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const EYEBROW_GEL = "a6620b04-09ee-427c-a195-5b0626276fc9";
const EYEBROW_MASCARA = "3e4a3ad5-72fb-4a9b-878e-97cf31354b74";

const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";
const LIP_SETS = "3b99e300-81d4-4f79-a74e-005f4e037222";

const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";

const TOOLS = "c7a90d6f-6fd4-40df-9b02-4cb33b8efce1";
const MAKEUP_TOOLS = "fccdd999-2838-4884-acb5-649ed08aca59";

type ProductInput = {
  barcode: string;
  slug: string;
  price: number;
  subcategoryId: string;
  tertiaryCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const PRODUCTS: ProductInput[] = [
  {
    barcode: "4059729490551",
    slug: "essence-lash-without-limits-extreme-waterproof-mascara-03-black-13ml",
    price: 6750,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "إيسنس - ماسكارا إكستريم للطول والحجم مقاومة للماء رقم ٣ أسود ١٣ مل",
    nameEn: "Essence - Lash WITHOUT Limits Extreme Lengthening & Volume Waterproof Mascara 03 Black 13 ml",
    descriptionAr:
      "ماسكارا إكستريم للطول والحجم من خط لاش ويذاوت ليمتس، تمنح الرموش طولاً وحجماً دراماتيكياً مع ثبات مقاوم للماء.\n\n" +
      "• تركيبة مقاومة للماء والتلطيخ.\n• فرشاة مرنة تصل لأقصر الرموش.\n• لون أسود عميق.\n• خالية من البارابين.\n• نباتية ولم تُختبر على الحيوانات.\n• تُطبّق من الجذور إلى الأطراف بحركات متعرجة.",
    descriptionEn:
      "Extreme lengthening and volume mascara from the Lash WITHOUT Limits line with waterproof wear.\n\n" +
      "• Waterproof and smudge-proof formula.\n• Flexible brush reaches even the shortest lashes.\n• Deep black colour.\n• Free from parabens.\n• Vegan and cruelty-free.\n• Apply from roots to tips in a zigzag motion.",
  },
  {
    barcode: "4250587772029",
    slug: "essence-get-big-lashes-volume-curl-mascara-01-black",
    price: 5500,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "إيسنس - ماسكارا جيت بيج لاشز للحجم والتجعيد رقم ١ أسود",
    nameEn: "Essence - Get BIG! Lashes Volume Curl Mascara 01 Black",
    descriptionAr:
      "ماسكارا جيت بيج لاشز للحجم والتجعيد، تمنح الرموش حجماً مكثفاً وتجعيداً جذاباً بفرشاة ألياف منحنية كبيرة.\n\n" +
      "• فرشاة ألياف منحنية للحجم والتجعيد.\n• لون أسود كثيف.\n• خالية من البارابين.\n• نباتية ولم تُختبر على الحيوانات.\n• مُختبرة طبياً للعيون.\n• تُطبّق من قاعدة الرموش بحركات متعرجة.",
    descriptionEn:
      "Get BIG! Lashes Volume Curl Mascara — maximum volume and gorgeous curl with a large curved fibre brush.\n\n" +
      "• Large curved fibre brush for volume and curl.\n• Intensive black colour.\n• Free from parabens.\n• Vegan and cruelty-free.\n• Ophthalmologically tested.\n• Apply from the lash line in a zigzag motion.",
  },
  {
    barcode: "4250338494392",
    slug: "essence-get-big-lashes-volume-boost-mascara-01-black",
    price: 5500,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "إيسنس - ماسكارا جيت بيج لاشز لتعزيز الحجم رقم ١ أسود",
    nameEn: "Essence - Get BIG! Lashes Volume Boost Mascara 01 Black",
    descriptionAr:
      "ماسكارا جيت بيج لاشز لتعزيز الحجم، تمنح الرموش كثافة فاخرة بفرشاة ألياف كبيرة دون تكتل.\n\n" +
      "• فرشاة ميغا ألياف تصل لكل رمش.\n• تركيبة خفيفة دون تكتل.\n• لون أسود عميق.\n• خالية من البارابين.\n• نباتية ولم تُختبر على الحيوانات.\n• مُختبرة طبياً للعيون.",
    descriptionEn:
      "Get BIG! Lashes Volume Boost Mascara — mega volume with a lightweight, no-clump formula.\n\n" +
      "• Mega fibre brush reaches every lash.\n• Lightweight formula without clumping.\n• Deep black colour.\n• Free from parabens.\n• Vegan and cruelty-free.\n• Ophthalmologically tested.",
  },
  {
    barcode: "4059729441973",
    slug: "essence-call-me-queen-dramatic-false-lash-effect-mascara-black-11-5ml",
    price: 6750,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "إيسنس - ماسكارا كول مي كوين تأثير رموش كثيفة دراماتيكي أسود ١١٫٥ مل",
    nameEn: "Essence - Call Me Queen Dramatic False Lash Effect Mascara Black 11.5 ml",
    descriptionAr:
      "ماسكارا كول مي كوين لتأثير رموش كثيفة دراماتيكي، تمنح الرموش حجماً وطولاً ملحوظين بفرشاة إيلاستومر مرنة.\n\n" +
      "• فرشاة إيلاستومر تغطي كل رمش.\n• تركيبة قابلة للطبقات دون تكتل.\n• لون أسود عميق.\n• خالية من البارابين والكحول والعطور.\n• نباتية ولم تُختبر على الحيوانات.\n• تُطبّق بحركات متعرجة من الجذور للأطراف.",
    descriptionEn:
      "Call Me Queen Dramatic False Lash Effect Mascara — dramatic volume and length with a flexible elastomer brush.\n\n" +
      "• Elastomer brush coats each individual lash.\n• Buildable formula without clumping.\n• Deep black colour.\n• Free from parabens, alcohol and fragrance.\n• Vegan and cruelty-free.\n• Apply in zigzag strokes from roots to tips.",
  },
  {
    barcode: "4059729593016",
    slug: "essence-lash-princess-false-lash-effect-extreme-waterproof-mascara-12ml",
    price: 6750,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "إيسنس - ماسكارا لاش برنسس إكستريم تأثير الرموش الكثيفة مقاومة للماء ١٢ مل",
    nameEn: "Essence - Lash Princess False Lash Effect Extreme Waterproof Mascara 12 ml",
    descriptionAr:
      "النسخة الإكستريم المقاومة للماء من ماسكارا لاش برنسس، تمنح الرموش حجماً وطولاً دراماتيكياً بمظهر رموش صناعية.\n\n" +
      "• تركيبة مقاومة للماء والتلطيخ.\n• فرشاة ألياف مخصّصة لكل رمش.\n• تأثير رموش كثيفة دراماتيكي.\n• خالية من البارابين والعطور.\n• نباتية ولم تُختبر على الحيوانات.\n• مثالية للمناسبات والأيام الطويلة.",
    descriptionEn:
      "Lash Princess False Lash Effect Extreme Waterproof Mascara — dramatic false-lash look with waterproof wear.\n\n" +
      "• Waterproof and smudge-proof formula.\n• Specially shaped fibre brush coats every lash.\n• Dramatic false-lash effect.\n• Free from parabens and fragrance.\n• Vegan and cruelty-free.\n• Ideal for long days and special occasions.",
  },
  {
    barcode: "4059729393876",
    slug: "essence-lash-princess-false-lash-effect-mascara-brown-12ml",
    price: 6750,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "إيسنس - ماسكارا لاش برنسس تأثير الرموش الكثيفة بني ١٢ مل",
    nameEn: "Essence - Lash Princess False Lash Effect Mascara Brown 12 ml",
    descriptionAr:
      "ماسكارا لاش برنسس بلون بني ناعم، تمنح الرموش طولاً وحجماً طبيعيين بمظهر رموش كثيفة أنيق.\n\n" +
      "• لون بني ناعم لإطلالة طبيعية.\n• فرشاة ألياف تلتقط كل رمش.\n• خالية من البارابين والعطور والكحول.\n• نباتية ولم تُختبر على الحيوانات.\n• مناسبة للإطلالات اليومية.\n• تُطبّق من الجذور إلى الأطراف بحركات متعرجة.",
    descriptionEn:
      "Lash Princess False Lash Effect Mascara in Brown — soft brown shade for a natural false-lash look.\n\n" +
      "• Soft brown colour for a natural look.\n• Fibre brush coats every lash.\n• Free from parabens, fragrance and alcohol.\n• Vegan and cruelty-free.\n• Suitable for everyday wear.\n• Apply from roots to tips in a zigzag motion.",
  },
  {
    barcode: "4059729490322",
    slug: "essence-call-me-queen-dramatic-false-lash-effect-mascara-waterproof-black-11-5ml",
    price: 6750,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "إيسنس - ماسكارا كول مي كوين تأثير رموش كثيفة دراماتيكي مقاومة للماء أسود ١١٫٥ مل",
    nameEn: "Essence - Call Me Queen Dramatic False Lash Effect Mascara Waterproof Black 11.5 ml",
    descriptionAr:
      "النسخة المقاومة للماء من ماسكارا كول مي كوين، تمنح الرموش حجماً وطولاً دراماتيكيين بثبات طويل.\n\n" +
      "• تركيبة مقاومة للماء والتلطيخ.\n• فرشاة إيلاستومر دقيقة لكل رمش.\n• قابلة للطبقات حسب الكثافة المطلوبة.\n• خالية من البارابين والكحول.\n• نباتية ولم تُختبر على الحيوانات.\n• مثالية للرياضة والسباحة.",
    descriptionEn:
      "Call Me Queen Dramatic False Lash Effect Mascara Waterproof — dramatic volume and length that stays put.\n\n" +
      "• Waterproof and smudge-proof formula.\n• Small elastomer brush for precise application.\n• Buildable coverage for custom intensity.\n• Free from parabens and alcohol.\n• Vegan and cruelty-free.\n• Ideal for sports and swimming.",
  },
  {
    barcode: "4059729521088",
    slug: "essence-lash-without-limits-tubing-extreme-lengthening-volume-mascara-04",
    price: 6750,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "إيسنس - ماسكارا تيوبينغ إكستريم للطول والحجم رقم ٤",
    nameEn: "Essence - Lash WITHOUT Limits TUBING Extreme Lengthening & Volume Mascara 04",
    descriptionAr:
      "ماسكارا تيوبينغ إكستريم للطول والحجم، تغلّف كل رمش بطبقة رقيقة دون تلطيخ أو تقشر طوال اليوم.\n\n" +
      "• تقنية تيوبينغ للطول والحجم.\n• فرشاة إيلاستومر بخطافات دقيقة.\n• ثبات دون تلطيخ أو تقشر.\n• تُزال بسهولة بماء دافئ.\n• لون أسود.\n• نباتية ولم تُختبر على الحيوانات.",
    descriptionEn:
      "Lash WITHOUT Limits TUBING Extreme Lengthening & Volume Mascara — tubing technology for smudge-free wear.\n\n" +
      "• Tubing technology for length and volume.\n• Elastomer brush with micro-hooks.\n• Smudge-proof and flake-free wear.\n• Removes easily with warm water.\n• Black shade.\n• Vegan and cruelty-free.",
  },
  {
    barcode: "4250035271180",
    slug: "essence-lash-brow-gel-mascara-clear-9ml",
    price: 3750,
    subcategoryId: EYEBROW,
    tertiaryCategoryId: EYEBROW_MASCARA,
    nameAr: "إيسنس - جل شفاف للرموش والحواجب ٩ مل",
    nameEn: "Essence - Lash & Brow Gel Mascara Clear 9 ml",
    descriptionAr:
      "جل شفاف متعدد الاستخدامات للرموش والحواجب، يثبّت الشعرات ويمنح مظهراً مرتباً طوال اليوم.\n\n" +
      "• لون شفاف لجميع درجات الشعر.\n• يثبّت الحواجب والرموش.\n• يمكن استخدامه لتثبيت خصلات الشعر.\n• تركيبة خفيفة سهلة التطبيق.\n• خالية من البارابين.\n• نباتية ولم تُختبر على الحيوانات.",
    descriptionEn:
      "Lash & Brow Gel Mascara Clear — transparent gel to tame and set brows and lashes.\n\n" +
      "• Clear formula suits all hair shades.\n• Sets brows and lashes in place.\n• Can also tame flyaway hairs.\n• Lightweight, easy-to-apply formula.\n• Free from parabens.\n• Vegan and cruelty-free.",
  },
  {
    barcode: "4059729485922",
    slug: "essence-fix-it-like-a-pro-transparent-brow-fixing-gel-8-5ml",
    price: 3750,
    subcategoryId: EYEBROW,
    tertiaryCategoryId: EYEBROW_GEL,
    nameAr: "إيسنس - جل تثبيت حواجب شفاف ٨٫٥ مل",
    nameEn: "Essence - Fix It Like A Pro Transparent Brow Fixing Gel 8.5 ml",
    descriptionAr:
      "جل تثبيت حواجب شفاف بثبات عالي، مثالي لإطلالة الحواجب اللامعة والمرتبة طوال اليوم.\n\n" +
      "• تثبيت قوي للحواجب والشعرات الخفيفة.\n• يجف بسرعة ويثبت طويلاً.\n• لون شفاف.\n• خالية من الزيوت والبارابين.\n• نباتية ولم تُختبر على الحيوانات.\n• يُطبّق بحركات صاعدة على الحواجب.",
    descriptionEn:
      "Fix It Like A Pro Transparent Brow Fixing Gel — ultra-fixing brow gel for laminated-brow looks.\n\n" +
      "• Strong hold for brows and fine hairs.\n• Fast-drying and long-lasting.\n• Transparent colour.\n• Free from oil and parabens.\n• Vegan and cruelty-free.\n• Apply in upward strokes on brows.",
  },
  {
    barcode: "4059729491145",
    slug: "essence-wonder-full-5-in-1-primer",
    price: 6750,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_PRIMER,
    nameAr: "إيسنس - برايمر وجه ٥ في ١ واندر فول",
    nameEn: "Essence - Wonder Full 5 in 1 Primer",
    descriptionAr:
      "برايمر وجه متعدد الوظائف يمهّد البشرة للمكياج ويقلّل المسام والخطوط الدقيقة مع حماية من الشمس.\n\n" +
      "• ٥ وظائف في منتج واحد.\n• حماية شمسية بعامل ٣٠.\n• يقلّل ظهور المسام والخطوط.\n• لمسة نهائية مطفية ناعمة.\n• درجة شفافة بيج للبشرة الفاتحة والمتوسطة.\n• نباتي ولم يُختبر على الحيوانات.",
    descriptionEn:
      "Wonder Full 5 in 1 Primer — multifunctional face primer with SPF 30 for a smooth makeup base.\n\n" +
      "• 5-in-1 multifunctional formula.\n• SPF 30 sun protection.\n• Minimises pores and fine lines.\n• Soft matte, airbrushed finish.\n• Sheer beige shade for light to medium skin tones.\n• Vegan and cruelty-free.",
  },
  {
    barcode: "4250947501382",
    slug: "essence-duo-sharpener",
    price: 2250,
    subcategoryId: TOOLS,
    tertiaryCategoryId: MAKEUP_TOOLS,
    nameAr: "إيسنس - مبراة أقلام مكياج مزدوجة",
    nameEn: "Essence - Duo Sharpener",
    descriptionAr:
      "مبراة أقلام مكياج مزدوجة بحجمين، مثالية لشحذ أقلام الشفاه والعيون والحواجب بدقة.\n\n" +
      "• فتحتان بمقاسين مختلفين.\n• شحذ نظيف ودقيق.\n• مناسبة لأقلام المكياج.\n• خفيفة وسهلة الحمل.\n• أداة أساسية للحقيبة.\n• من إيسنس ألمانيا.",
    descriptionEn:
      "Duo Sharpener — dual-size cosmetic pencil sharpener for precise sharpening.\n\n" +
      "• Two openings in different sizes.\n• Clean, precise sharpening.\n• Suitable for makeup pencils.\n• Lightweight and portable.\n• Essential kit tool.\n• From Essence Germany.",
  },
  {
    barcode: "4059729539724",
    slug: "essence-polly-pocket-colour-changing-blush-stick-01-here-comes-the-fun-5g",
    price: 5250,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    nameAr: "إيسنس - ستك بلاشر متغيّر اللون بولي بوكيت رقم ٠١ ٥ جم",
    nameEn: "Essence - Polly Pocket Colour-Changing Blush Stick 01 Here Comes The Fun 5 g",
    descriptionAr:
      "ستك بلاشر متغيّر اللون بتركيبة كريمية، يمنح الخدود لوناً حيوياً يتكيّف مع درجة حرارة البشرة.\n\n" +
      "• لون يتغيّر حسب حرارة البشرة.\n• تركيبة ستك سهلة التطبيق.\n• إطلالة طبيعية نضرة.\n• حجم ٥ جم عملي.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق مباشرة على الخدود ويُدمج بالأصابع.",
    descriptionEn:
      "Polly Pocket Colour-Changing Blush Stick — cream blush stick with a colour-adapting formula.\n\n" +
      "• Colour changes with skin temperature.\n• Easy-to-apply stick format.\n• Fresh, natural-looking finish.\n• Practical 5 g size.\n• Vegan and cruelty-free.\n• Apply directly to cheeks and blend with fingers.",
  },
  {
    barcode: "4059729590527",
    slug: "essence-kiss-bomb-shiny-lipgloss-lip-balm-set",
    price: 5250,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_SETS,
    nameAr: "إيسنس - مجموعة ملمع شفاه وبلسم كيس بوم",
    nameEn: "Essence - Kiss Bomb Shiny Lipgloss & Lip Balm Set",
    descriptionAr:
      "مجموعة شفاه تجمع ملمع شفاه لامع وبلسم مرطب في حلقة أنيقة، برائحة الفراولة ولمعان جذاب.\n\n" +
      "• ملمع شفاه لامع بلون وردي ناعم.\n• بلسم شفاه شفاف مرطب.\n• رائحة فراولة حلوة.\n• بلسم داخل حلقة عملية.\n• خالية من الغلوتين.\n• نباتية ولم تُختبر على الحيوانات.",
    descriptionEn:
      "Kiss Bomb Shiny Lipgloss & Lip Balm Set — glossy lip gloss and sheer lip balm in a heart-inspired ring.\n\n" +
      "• Shiny rose-toned lip gloss.\n• Sheer moisturising lip balm.\n• Sweet strawberry scent.\n• Balm tucked inside a practical ring.\n• Gluten-free.\n• Vegan and cruelty-free.",
  },
  {
    barcode: "4059729421340",
    slug: "essence-dip-eyeliner-waterproof-black-3ml",
    price: 3750,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    nameAr: "إيسنس - كحل سائل مقاوم للماء أسود ٣ مل",
    nameEn: "Essence - Dip Eyeliner Waterproof Black 3 ml",
    descriptionAr:
      "كحل سائل مقاوم للماء بفرشاة دقيقة، يمنح خطوطاً سوداء دقيقة وثابتة طوال اليوم.\n\n" +
      "• تركيبة مقاومة للماء.\n• فرشاة دقيقة لخطوط نظيفة.\n• لون أسود كثيف.\n• ثبات طويل دون تلطيخ.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق على الجفن العلوي قرب خط الرموش.",
    descriptionEn:
      "Dip Eyeliner Waterproof Black — liquid eyeliner with a fine brush for precise lines.\n\n" +
      "• Waterproof formula.\n• Fine brush for clean lines.\n• Intense black colour.\n• Long-lasting without smudging.\n• Vegan and cruelty-free.\n• Apply along the upper lash line.",
  },
  {
    barcode: "4250587705454",
    slug: "essence-liquid-ink-eyeliner-black-01",
    price: 3750,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    nameAr: "إيسنس - كحل سائل إنك أسود رقم ٠١",
    nameEn: "Essence - Liquid Ink Eyeliner Black 01",
    descriptionAr:
      "كحل سائل إنك بفرشاة رفيعة، يمنح خطوطاً سوداء دقيقة وواضحة بسهولة وسرعة.\n\n" +
      "• فرشاة رفيعة لخطوط دقيقة.\n• لون أسود عميق.\n• تركيبة سائلة سهلة التحكم.\n• خالية من البارابين والعطور.\n• نباتية ولم تُختبر على الحيوانات.\n• مثالية للخط الدقيق والكات آي.",
    descriptionEn:
      "Liquid Ink Eyeliner Black 01 — liquid eyeliner with a fine brush applicator for precise lines.\n\n" +
      "• Fine brush for precise strokes.\n• Deep black colour.\n• Easy-to-control liquid formula.\n• Free from parabens and perfume.\n• Vegan and cruelty-free.\n• Ideal for fine lines and cat-eye looks.",
  },
  {
    barcode: "4059729511775",
    slug: "essence-love-it-a-choco-lot-lip-gloss-01-melted-bliss-chocolate-kiss-10ml",
    price: 5250,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
    nameAr: "إيسنس - ملمع شفاه برائحة الشوكولاتة رقم ٠١ ١٠ مل",
    nameEn: "Essence - LOVE IT A CHOCO' LOT! Lip Gloss 01 Melted Bliss Chocolate Kiss 10 ml",
    descriptionAr:
      "ملمع شفاه بلمعان طبيعي ولمسة لون خفيفة، برائحة شوكولاتة حلوة لشفاه ناعمة ولامعة.\n\n" +
      "• لمعان طبيعي ولون خفيف.\n• رائحة شوكولاتة لذيذة.\n• تركيبة مريحة غير لاصقة.\n• حجم ١٠ مل.\n• إصدار محدود.\n• نباتي ولم يُختبر على الحيوانات.",
    descriptionEn:
      "LOVE IT A CHOCO' LOT! Lip Gloss 01 Melted Bliss Chocolate Kiss — natural shine with a sweet chocolate scent.\n\n" +
      "• Natural glossy finish with a sheer tint.\n• Delicious chocolate fragrance.\n• Comfortable non-sticky formula.\n• 10 ml size.\n• Limited edition.\n• Vegan and cruelty-free.",
  },
];

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = (await res.json()) as { data?: { accessToken?: string }; message?: string };
  if (!res.ok) throw new Error(json?.message ?? `Login failed HTTP ${res.status}`);
  token = json.data?.accessToken ?? "";
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

async function slugTaken(slug: string) {
  const rows = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
    `/products?search=${encodeURIComponent(slug)}&status=all&limit=10`,
  );
  const list = Array.isArray(rows) ? rows : (rows.data ?? []);
  return list.some((p) => p.slug === slug);
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length}\n`);
  await login();
  console.log("Logged in.\n");

  const results: Array<{ barcode: string; id?: string; nameAr: string; nameEn: string; price: number; status: string }> =
    [];
  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const p of PRODUCTS) {
    try {
      const check = await api<{ exists: boolean; product?: { id?: string; nameAr?: string; nameEn?: string; isActive?: boolean } }>(
        `/products/barcode-check?barcode=${p.barcode}`,
      );
      if (check.exists) {
        console.log(`skip ${p.barcode} — exists | ${check.product?.nameAr ?? check.product?.nameEn ?? "?"}`);
        results.push({ barcode: p.barcode, nameAr: check.product?.nameAr ?? "", nameEn: check.product?.nameEn ?? "", price: p.price, status: "exists" });
        skip += 1;
        continue;
      }

      if (await slugTaken(p.slug)) {
        console.log(`skip ${p.barcode} — slug taken: ${p.slug}`);
        skip += 1;
        continue;
      }

      const created = await api<{ id: string; nameAr?: string; nameEn?: string }>("/products", "POST", {
        sku: p.barcode,
        barcode: p.barcode,
        slug: p.slug,
        brandId: BRAND_ID,
        categoryId: CATEGORY_ID,
        subcategoryId: p.subcategoryId,
        tertiaryCategoryId: p.tertiaryCategoryId,
        subcategoryIds: [p.subcategoryId],
        tertiaryCategoryIds: [p.tertiaryCategoryId],
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
        price: p.price,
        originalPrice: p.price,
        stock: 0,
        isActive: true,
        imageIds: [] as string[],
      });

      console.log(`✓ ${p.nameAr}`);
      console.log(`  ID: ${created.id}`);
      results.push({ barcode: p.barcode, id: created.id, nameAr: p.nameAr, nameEn: p.nameEn, price: p.price, status: "added" });
      ok += 1;
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      fail += 1;
      console.log(`✗ ${p.barcode}: ${err instanceof Error ? err.message : err}`);
      results.push({ barcode: p.barcode, nameAr: p.nameAr, nameEn: p.nameEn, price: p.price, status: "failed" });
    }
  }

  console.log(`\n--- Summary ---\nAdded: ${ok}\nSkipped: ${skip}\nFailed: ${fail}`);
  const fs = await import("node:fs");
  fs.writeFileSync("add-essence-batch-17-results.json", JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
