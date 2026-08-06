/**
 * Huda Beauty — 18 separate products (no shades, no images).
 * GPT for naming only (Arabic + English); descriptions from research.
 * Usage: npx tsx scripts/add-huda-batch18-single-api.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { estimateCostUsd, researchProductNameWithGpt } from "./lib/gpt-barcode-import/openai";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

function loadEnvFile(): void {
  const envPath = join(__dirname, "../.env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnvFile();

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYESHADOW = "07f14763-7a8b-4646-a057-8748e2b18bd4";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";
const MASCARA = "e1032b57-c1af-49e3-a408-130468f22736";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const POWDER = "828bbfd2-d611-417a-bdca-0f5424a61171";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";
const MAKEUP_SPRAY = "afb26abb-e48f-4ced-8863-2c3ba1333505";
const MAKEUP_SETS = "77e49c2a-36be-4a4c-a08d-131289617924";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";
const HIGHLIGHTER = "774d62c3-8119-4c0c-983b-2513fc46df24";
const POWDER_HIGHLIGHTER = "7480a30f-ed2b-41a8-9349-dd67edb010b6";
const LIQUID_HIGHLIGHTER = "6fed608e-80d7-4449-9427-fc2848b091be";
const BRUSHES_TOOLS = "c7a90d6f-6fd4-40df-9b02-4cb33b8efce1";
const FACE_BRUSHES = "575c78b2-000c-4311-8c69-3694995a3565";

type ProductMeta = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId?: string;
  /** When barcode is a single-SKU shade, append to GPT line name */
  shadeEn?: string;
  shadeAr?: string;
  sizeEn?: string;
  sizeAr?: string;
  descriptionAr: string;
  descriptionEn: string;
};

const PRODUCT_META: ProductMeta[] = [
  {
    barcode: "6294018406167",
    slug: "huda-beauty-habibti-face-lip-set-ramadan",
    sku: "HUDA-406167",
    price: 38000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: MAKEUP_SETS,
    descriptionAr:
      "مجموعة Habibti Face & Lip Set من هودا بيوتي — إصدار محدود لرمضان يجمع ثلاثة من أشهر منتجات الوجه والشفاه.\n\n" +
      "• بلاشر سائل Blush Filter بدرجة Cotton Candy — إشراقة وردية ناعمة بلمسة airblushed.\n" +
      "• ملمع شفاه FAUXFILLER Extra Shine Gloss بدرجة Glassy — لمعان عالي مع ترطيب وتنعيم.\n" +
      "• قلم تحديد شفاه Lip Contour 2.0 بدرجة Bombshell Pinky Brown — تحديد مات ناعم ومريح.\n" +
      "• مثالية كهدية أو لإطلالة متكاملة للخدين والشفاه بإشراقة طبيعية.\n" +
      "• مجموعة هدايا (3 قطع).",
    descriptionEn:
      "Huda Beauty Habibti Face & Lip Set — limited-edition Ramadan kit with three bestselling face and lip essentials.\n\n" +
      "• Blush Filter Liquid Blush in Cotton Candy — soft pink airblushed glow.\n" +
      "• FAUXFILLER Extra Shine Gloss in Glassy — high-shine hydrating lip gloss.\n" +
      "• Lip Contour 2.0 in Bombshell Pinky Brown — velvety matte lip liner.\n" +
      "• Perfect gift or complete cheek-and-lip routine with a natural radiant finish.\n" +
      "• Gift set (3 pieces).",
  },
  {
    barcode: "6291107572321",
    slug: "huda-beauty-life-liner-quick-n-easy-mini-0-55ml",
    sku: "HUDA-572321",
    price: 18000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    sizeEn: "0.55 ml",
    sizeAr: "0.55 مل",
    descriptionAr:
      "آيلاينر سائل Life Liner Quick 'N Easy Mini من هودا بيوتي — أسود مكثّف مقاوم للماء بحجم سفر.\n\n" +
      "• تركيبة سائلة سهلة التطبيق بفرشاة دقيقة لخط نظيف أو مدخن.\n" +
      "• لون أسود غني بثبات عالي — مقاوم للماء والعرق والتبقع.\n" +
      "• حجم mini مثالي للتجربة أو السفر والحقيبة.\n" +
      "• 0.55 مل.",
    descriptionEn:
      "Huda Beauty Life Liner Quick 'N Easy Mini — intense black waterproof precision liquid eyeliner in travel size.\n\n" +
      "• Easy liquid formula with fine tip for clean or smoky lines.\n" +
      "• Rich black colour with waterproof, sweat and smudge-resistant wear.\n" +
      "• Mini size ideal for travel and on-the-go touch-ups.\n" +
      "• 0.55 ml.",
  },
  {
    barcode: "6294018409069",
    slug: "huda-beauty-habibti-lip-cheek-best-sellers-bronze-nudes",
    sku: "HUDA-409069",
    price: 42000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: MAKEUP_SETS,
    descriptionAr:
      "مجموعة Habibti Lip & Cheek Best Sellers Bronze Nudes من هودا بيوتي — إصدار محدود بدرجات نود دافئة.\n\n" +
      "• 2 بلاشر سائل Blush Filter بحجم كامل: Latte و Strawberry Cream.\n" +
      "• زيت شفاه Faux Filler Lip Oil بحجم كامل بدرجة Juicy Pink Lady.\n" +
      "• تركيبات قابلة للبناء بإطلالة airblushed ناعمة للخدين وشفاه لامعة مرطبة.\n" +
      "• مثالية كهدية رمضانية أو لإطلالة نود متكاملة.\n" +
      "• مجموعة (3 قطع بحجم كامل).",
    descriptionEn:
      "Huda Beauty Habibti Lip & Cheek Best Sellers Bronze Nudes — limited-edition warm nude Ramadan kit.\n\n" +
      "• 2 full-size Blush Filter Liquid Blushes: Latte and Strawberry Cream.\n" +
      "• 1 full-size Faux Filler Lip Oil in Juicy Pink Lady.\n" +
      "• Buildable soft-focus blushes plus juicy non-sticky lip shine.\n" +
      "• Ideal Ramadan gift or complete warm nude cheek-and-lip look.\n" +
      "• Set (3 full-size pieces).",
  },
  {
    barcode: "6291106036497",
    slug: "huda-beauty-nude-medium-makeup-gift-set-2pcs",
    sku: "HUDA-036497",
    price: 40000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: MAKEUP_SETS,
    descriptionAr:
      "مجموعة Nude Medium Makeup Gift Set من هودا بيوتي — باليت عيون وشفاه نود متناسقة.\n\n" +
      "• باليت Nude Medium Obsessions Eyeshadow — 9 درجات دافئة (بني، كستنائي، مرجاني، ذهبي وردي).\n" +
      "• أحمر شفاه سائل Liquid Matte Mini بدرجة Trendsetter — بني مات جذاب.\n" +
      "• درجات متكاملة لإطلالة نود متوسطة الدفء للعيون والشفاه.\n" +
      "• مجموعة (2 قطع).",
    descriptionEn:
      "Huda Beauty Nude Medium Makeup Gift Set — coordinated nude eye and lip duo.\n\n" +
      "• Nude Medium Obsessions Eyeshadow Palette — 9 warm spicy nude shades.\n" +
      "• Liquid Matte Mini in Trendsetter — sexy brown matte lip colour.\n" +
      "• Complementary tones for a complete medium nude makeup look.\n" +
      "• Set (2 pieces).",
  },
  {
    barcode: "6291106034905",
    slug: "huda-beauty-glow-coco-hydrating-mist-80ml",
    sku: "HUDA-034905",
    price: 28000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: MAKEUP_SPRAY,
    sizeEn: "80 ml",
    sizeAr: "80 مل",
    descriptionAr:
      "رذاذ Glow Coco Hydrating Mist من هودا بيوتي — مثبّت وبرايمر ومنعش 3 في 1 لإشراقة dewy.\n\n" +
      "• رذاذ حليبي غني بماء جوز الهند، حليب جوز الهند وقليل من زيت جوز الهند.\n" +
      "• يُثبّت المكياج، يُهيّئ البشرة ويُنعشها بتوهج طبيعي دون ثقل أو دهنية.\n" +
      "• يرطّب ويُهدئ البشرة — رائحة كوكو منعشة.\n" +
      "• نصيحة هدى: رُشّه على الجسم أو احفظه في الثلاجة لانتعاش إضافي.\n" +
      "• 80 مل.",
    descriptionEn:
      "Huda Beauty Glow Coco Hydrating Mist — 3-in-1 primer, setting and refreshing mist for a dewy glow.\n\n" +
      "• Milky spray infused with coconut water, milk and a hint of coconut oil.\n" +
      "• Primes, sets and refreshes makeup without greasy heaviness.\n" +
      "• Hydrates and soothes skin with a fresh coconut scent.\n" +
      "• Huda's hack: mist on body or store in the fridge for extra freshness.\n" +
      "• 80 ml.",
  },
  {
    barcode: "6291106039535",
    slug: "huda-beauty-get-the-look-kit-eye",
    sku: "HUDA-039535",
    price: 36000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    descriptionAr:
      "مجموعة Get The Look Kit من هودا بيوتي — مجموعة عيون كاملة للإطلالة الجريئة.\n\n" +
      "• باليت Brown Obsessions Eyeshadow — درجات بنية دافعة matte و shimmer.\n" +
      "• ماسكرا Legit Lashes Mini مزدوجة الرأس — تكثيف وتطويل.\n" +
      "• مثالية كهدية أو لإطلالة عيون smokey بنية.\n" +
      "• مجموعة (باليت + ماسكرا mini).",
    descriptionEn:
      "Huda Beauty Get The Look Kit — complete eye look gift set.\n\n" +
      "• Brown Obsessions Eyeshadow Palette — warm brown mattes and shimmers.\n" +
      "• Legit Lashes Mini double-ended mascara — volume and length.\n" +
      "• Ideal gift or effortless brown smoky eye routine.\n" +
      "• Set (palette + mini mascara).",
  },
  {
    barcode: "6291106031294",
    slug: "huda-beauty-summer-solstice-3d-highlighter-palette-31-5g",
    sku: "HUDA-031294",
    price: 45000,
    categoryId: MAKEUP,
    subcategoryId: HIGHLIGHTER,
    tertiaryCategoryId: POWDER_HIGHLIGHTER,
    sizeEn: "31.5 g",
    sizeAr: "31.5 غرام",
    descriptionAr:
      "باليت Summer Solstice 3D Highlighter Palette من هودا بيوتي — 4 درجات لتوهج صيفي متعدد الأبعاد.\n\n" +
      "• Saint Tropez — كريمي ذائب (Melted Strobe) ذهبي مضيء كقاعدة.\n" +
      "• Malibu — برونزي دافع، Copacabana — وردي ناعم، Mykonos — بنفسجي ببريق أزرق.\n" +
      "• امزج الكريمي مع البودرة لإطلالة glow مخصصة من طبيعية إلى جريئة.\n" +
      "• إصدار محدود Summer Solstice — 31.5 غرام.",
    descriptionEn:
      "Huda Beauty Summer Solstice 3D Highlighter Palette — 4 shades for multidimensional summer glow.\n\n" +
      "• Saint Tropez melted strobe cream base, Malibu bronze, Copacabana pink, Mykonos violet-blue sheen.\n" +
      "• Layer cream and powder for custom glow from soft to intense.\n" +
      "• Limited Summer Solstice edition — 31.5 g.",
  },
  {
    barcode: "6291106036442",
    slug: "huda-beauty-naughty-nude-eyeshadow-palette",
    sku: "HUDA-036442",
    price: 52000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    descriptionAr:
      "باليت Naughty Nude Eyeshadow Palette من هودا بيوتي — درجات نود جريئة ومتعددة الاستخدامات.\n\n" +
      "• مزيج من matte و shimmer و metallic بألوان نود دافعة وباردة.\n" +
      "• صبغة عالية وقوام سهل الدمج — من الإطلالة الطبيعية إلى العيون المدخنة.\n" +
      "• باليت كامل الحجم بتركيبة أيقونية من هودا.\n" +
      "• بدون عطر — تغطية قابلة للبناء.",
    descriptionEn:
      "Huda Beauty Naughty Nude Eyeshadow Palette — versatile bold nude eye colours.\n\n" +
      "• Mattes, shimmers and metallics in warm and cool nude tones.\n" +
      "• High pigment, blendable formula — soft daytime to glam smoky eyes.\n" +
      "• Full-size iconic Huda palette.\n" +
      "• Fragrance-free with buildable coverage.",
  },
  {
    barcode: "6291106038354",
    slug: "huda-beauty-rose-quartz-eyeshadow-palette",
    sku: "HUDA-038354",
    price: 52000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    descriptionAr:
      "باليت Rose Quartz Eyeshadow Palette من هودا بيوتي — درجات وردية رومانسية بلمعان كريستالي.\n\n" +
      "• ألوان وردي، موف وذهبي مستوحاة من الكوارتز الوردي.\n" +
      "• matte ناعم و shimmer لامع و metallic براق لإطلالات عيون حالمة.\n" +
      "• صبغة عالية وسهلة الدمج — مثالية للإطلالات الرومانسية والاحتفالية.\n" +
      "• بدون عطر — تغطية قابلة للبناء.",
    descriptionEn:
      "Huda Beauty Rose Quartz Eyeshadow Palette — romantic pink tones with crystal-like shimmer.\n\n" +
      "• Pinks, mauves and golds inspired by rose quartz.\n" +
      "• Soft mattes, glowing shimmers and bold metallics for dreamy eye looks.\n" +
      "• High pigment, blendable formula — romantic and festive eyes.\n" +
      "• Fragrance-free with buildable coverage.",
  },
  {
    barcode: "6291107573458",
    slug: "huda-beauty-empowered-eyeshadow-palette",
    sku: "HUDA-573458",
    price: 55000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    descriptionAr:
      "باليت Empowered Eyeshadow Palette من هودا بيوتي — 18 درجة لإطلالات عيون قوية ومتنوعة.\n\n" +
      "• 18 لونًا بين matte و shimmer و metallic بدرجات محايدة وجريئة.\n" +
      "• باليت كبير بصبغة عالية وقوام كريمي سهل الدمج.\n" +
      "• من الإطلالة اليومية إلى المكياج الاحتفالي والسموكي.\n" +
      "• بدون عطر — تغطية قابلة للبناء مع تساقط قليل.",
    descriptionEn:
      "Huda Beauty Empowered Eyeshadow Palette — 18 shades for bold versatile eye looks.\n\n" +
      "• 18 mattes, shimmers and metallics in neutral and statement tones.\n" +
      "• Large-format palette with creamy high-pigment blendable formula.\n" +
      "• From everyday neutrals to festive and smoky glam.\n" +
      "• Fragrance-free with buildable coverage and minimal fallout.",
  },
  {
    barcode: "6294018403302",
    slug: "huda-beauty-fauxfilter-luminous-matte-foundation-milkshake-100b-35ml",
    sku: "HUDA-403302",
    price: 38000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: FOUNDATION,
    shadeEn: "Milkshake 100B",
    shadeAr: "Milkshake 100B",
    sizeEn: "35 ml",
    sizeAr: "35 مل",
    descriptionAr:
      "فاونديشن #FauxFilter Luminous Matte Foundation بدرجة Milkshake 100B من هودا بيوتي — تغطية ماتة مضيئة طويلة الثبات.\n\n" +
      "• تركيبة سائلة خفيفة بصبغة عالية — تغطية متوسطة إلى كاملة قابلة للبناء.\n" +
      "• ماتي مضيء (luminous matte) بثبات حتى 24 ساعة — مقاوم للعرق والنقل.\n" +
      "• Milkshake 100B — درجة فاتحة ب undertone باردة مناسبة للبشرة الفاتحة.\n" +
      "• غير كوميدوجينيك — خالٍ من الزيوت — فيغن.\n" +
      "• 35 مل (1.18 أونصة).",
    descriptionEn:
      "Huda Beauty #FauxFilter Luminous Matte Foundation in Milkshake 100B — long-wear luminous matte coverage.\n\n" +
      "• Lightweight liquid with high pigment — medium to full buildable coverage.\n" +
      "• Luminous matte finish with up to 24-hour sweat and transfer-resistant wear.\n" +
      "• Milkshake 100B — fair shade with cool undertone for light skin.\n" +
      "• Non-comedogenic, oil-free, vegan.\n" +
      "• 35 ml (1.18 fl oz).",
  },
  {
    barcode: "6294018401797",
    slug: "huda-beauty-1-coat-wow-mascara-9ml",
    sku: "HUDA-401797",
    price: 26000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    sizeEn: "9 ml",
    sizeAr: "9 مل",
    descriptionAr:
      "ماسكرا 1 Coat Wow! من هودا بيوتي — تكثيف وتطويل ورفع بضربة واحدة.\n\n" +
      "• فرشاة مبتكرة تغطي كل رمش بلمسة واحدة دون تكتل.\n" +
      "• صيغة خفيفة بثبات عالي — رفع وطول وكثافة ملحوظة.\n" +
      "• مثالية لإطلالة رموش مفتوحة وواسعة بسرعة.\n" +
      "• 9 مل.",
    descriptionEn:
      "Huda Beauty 1 Coat Wow! Mascara — volume, length and lift in one coat.\n\n" +
      "• Innovative brush coats every lash in one stroke without clumping.\n" +
      "• Lightweight formula with strong hold for lift, length and volume.\n" +
      "• Fast wide-awake lash look in a single application.\n" +
      "• 9 ml.",
  },
  {
    barcode: "6291106037227",
    slug: "huda-beauty-baby-bake-loose-powder-banana-bread-travel-6-5g",
    sku: "HUDA-037227",
    price: 22000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    shadeEn: "Banana Bread",
    shadeAr: "Banana Bread",
    sizeEn: "6.5 g",
    sizeAr: "6.5 غرام",
    descriptionAr:
      "بودرة Baby Bake Loose Powder بحجم سفر بدرجة Banana Bread من هودا بيوتي — تثبيت وبيكينج بإشراقة دافعة.\n\n" +
      "• بودرة سائبة فائقة النعومة لتثبيت المكياج والبيكينج تحت العين.\n" +
      "• درجة Banana Bread ذهبية دافعة مثالية لتفتيح وتوحيد لون البشرة.\n" +
      "• تمتص اللمعان وتوحّد المكياج حتى 10 ساعات دون قسوة.\n" +
      "• حجم سفر (Baby Bake) — 6.5 غرام.",
    descriptionEn:
      "Huda Beauty Baby Bake Loose Powder Travel Size in Banana Bread — baking and setting with warm brightening.\n\n" +
      "• Ultra-fine loose powder for setting and under-eye baking.\n" +
      "• Banana Bread warm golden shade for brightening and tone correction.\n" +
      "• Controls shine and locks makeup for up to 10 hours without creasing.\n" +
      "• Travel size (Baby Bake) — 6.5 g.",
  },
  {
    barcode: "6291106034509",
    slug: "huda-beauty-nymph-liquid-highlighter-aphrodite-15ml",
    sku: "HUDA-034509",
    price: 22000,
    categoryId: MAKEUP,
    subcategoryId: HIGHLIGHTER,
    tertiaryCategoryId: LIQUID_HIGHLIGHTER,
    shadeEn: "Aphrodite",
    shadeAr: "Aphrodite",
    sizeEn: "15 ml",
    sizeAr: "15 مل",
    descriptionAr:
      "هايلايتر سائل N.Y.M.P.H. All Over Highlighter بدرجة Aphrodite من هودا بيوتي — حجم 15 مل.\n\n" +
      "• تركيبة مائية للوجه والجسم — توهج ذهبي برونزي دافع.\n" +
      "• يُنعّم البشرة ويُخفّي العيوب بلمعان sun-kissed مقاوم للنقل والماء.\n" +
      "• مثالي للبشرة المتوسطة — يُطبّق على الوجه، الأكتاف والساقين.\n" +
      "• ارفعي الزجاجة وامزجي بسرعة للتغطية المطلوبة.\n" +
      "• 15 مل (حجم صغير).",
    descriptionEn:
      "Huda Beauty N.Y.M.P.H. All Over Highlighter in Aphrodite — 15 ml travel size.\n\n" +
      "• Water-based face and body illuminator with warm golden-bronze shimmer.\n" +
      "• Blurs imperfections for smooth sun-kissed glow — transfer and water resistant.\n" +
      "• Ideal for medium skin — face, shoulders, legs and décolletage.\n" +
      "• Shake well and blend quickly for desired coverage.\n" +
      "• 15 ml (small size).",
  },
  {
    barcode: "6291106034493",
    slug: "huda-beauty-nymph-liquid-highlighter-aphrodite-55ml",
    sku: "HUDA-034493",
    price: 32000,
    categoryId: MAKEUP,
    subcategoryId: HIGHLIGHTER,
    tertiaryCategoryId: LIQUID_HIGHLIGHTER,
    shadeEn: "Aphrodite",
    shadeAr: "Aphrodite",
    sizeEn: "55 ml",
    sizeAr: "55 مل",
    descriptionAr:
      "هايلايتر سائل N.Y.M.P.H. All Over Highlighter بدرجة Aphrodite من هودا بيوتي — الحجم الكامل.\n\n" +
      "• تركيبة مائية للوجه والجسم — توهج ذهبي برونزي دافع.\n" +
      "• يُنعّم البشرة ويُخفّي العيوب بلمعان sun-kissed مقاوم للنقل والماء.\n" +
      "• مثالي للبشرة المتوسطة — يُطبّق على الوجه، الأكتاف والساقين.\n" +
      "• ارفعي الزجاجة وامزجي بسرعة للتغطية المطلوبة.\n" +
      "• 55 مل (2.02 أونصة).",
    descriptionEn:
      "Huda Beauty N.Y.M.P.H. All Over Highlighter in Aphrodite — full size.\n\n" +
      "• Water-based face and body illuminator with warm golden-bronze shimmer.\n" +
      "• Blurs imperfections for smooth sun-kissed glow — transfer and water resistant.\n" +
      "• Ideal for medium skin — face, shoulders, legs and décolletage.\n" +
      "• Shake well and blend quickly for desired coverage.\n" +
      "• 55 ml (2.02 fl oz).",
  },
  {
    barcode: "6291107573038",
    slug: "huda-beauty-glowish-cheeky-vegan-blush-powder-milky-rose",
    sku: "HUDA-573038",
    price: 28000,
    categoryId: MAKEUP,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    shadeEn: "Milky Rose",
    shadeAr: "Milky Rose",
    sizeEn: "2.2 g",
    sizeAr: "2.2 غرام",
    descriptionAr:
      "بلاشر بودرة GloWish Cheeky Vegan Blush Powder بدرجة Milky Rose من هودا بيوتي.\n\n" +
      "• تركيبة marbled ناعمة بإشراقة soft-focus وثبات 12 ساعة.\n" +
      "• غني بزيت دمشق الورد، زبدة الشيا، سكوالين نباتي وفيتامين E.\n" +
      "• Milky Rose — وردي ناعم لإطلالة خدود طبيعية مشرقة.\n" +
      "• فيغن، خالٍ من العطر، غير كوميدوجينيك — تغليف قابل للتدوير.\n" +
      "• 2.2 غرام (0.08 أونصة).",
    descriptionEn:
      "Huda Beauty GloWish Cheeky Vegan Blush Powder in Milky Rose — marbled soft-focus blush.\n\n" +
      "• Velvety marbled formula with 12-hour wear and buildable colour.\n" +
      "• Infused with Damascus rose oil, shea butter, plant squalane and vitamin E.\n" +
      "• Milky Rose — soft pink for a natural fresh-faced flush.\n" +
      "• Vegan, fragrance-free, non-comedogenic — recyclable packaging.\n" +
      "• 2.2 g (0.08 oz).",
  },
  {
    barcode: "6291106038521",
    slug: "huda-beauty-glowish-cheeky-vegan-blush-powder-caring-coral-02",
    sku: "HUDA-038521",
    price: 28000,
    categoryId: MAKEUP,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    shadeEn: "Caring Coral 02",
    shadeAr: "Caring Coral 02",
    sizeEn: "2.2 g",
    sizeAr: "2.2 غرام",
    descriptionAr:
      "بلاشر بودرة GloWish Cheeky Vegan Blush Powder بدرجة Caring Coral 02 من هودا بيوتي.\n\n" +
      "• تركيبة marbled ناعمة بإشراقة soft-focus وثبات 12 ساعة.\n" +
      "• غني بزيت دمشق الورد، زبدة الشيا، سكوالين نباتي وفيتامين E.\n" +
      "• Caring Coral 02 — مرجاني وردي متوسط لإطلالة مشرقة دافعة.\n" +
      "• فيغن، خالٍ من العطر، غير كوميدوجينيك — تغليف قابل للتدوير.\n" +
      "• 2.2 غرام (0.08 أونصة).",
    descriptionEn:
      "Huda Beauty GloWish Cheeky Vegan Blush Powder in Caring Coral 02 — marbled soft-focus blush.\n\n" +
      "• Velvety marbled formula with 12-hour wear and buildable colour.\n" +
      "• Infused with Damascus rose oil, shea butter, plant squalane and vitamin E.\n" +
      "• Caring Coral 02 — mid-toned rosy coral for a warm radiant flush.\n" +
      "• Vegan, fragrance-free, non-comedogenic — recyclable packaging.\n" +
      "• 2.2 g (0.08 oz).",
  },
  {
    barcode: "6291106031843",
    slug: "huda-beauty-face-buff-blend-complexion-brush",
    sku: "HUDA-031843",
    price: 25000,
    categoryId: MAKEUP,
    subcategoryId: BRUSHES_TOOLS,
    tertiaryCategoryId: FACE_BRUSHES,
    descriptionAr:
      "فرشاة Face Buff & Blend Complexion Brush من هودا بيوتي — لتطبيق الفاونديشن بإطلالة filtered.\n\n" +
      "• فرشاة وجه اصطناعية ناعمة بتقنية stipple-and-blend.\n" +
      "• مصممة خصيصًا مع فاونديشن #FauxFilter لتوزيع متساوي دون خطوط.\n" +
      "• تُطبّق بالتنقيط والدمج على كامل الوجه لبشرة ناعمة ومضيئة.\n" +
      "• فرشاة وجه واحدة.",
    descriptionEn:
      "Huda Beauty Face Buff & Blend Complexion Brush — foundation brush for a filtered finish.\n\n" +
      "• Soft synthetic face brush with stipple-and-blend technique.\n" +
      "• Designed to pair with #FauxFilter Foundation for even seamless coverage.\n" +
      "• Stipple and blend across the face for smooth luminous skin.\n" +
      "• Single face brush.",
  },
];

function normalizeGptNames(
  gptAr: string,
  gptEn: string,
  meta: ProductMeta,
): { nameAr: string; nameEn: string } {
  let nameEn = gptEn.trim().replace(/هدى/gi, "Huda");
  let nameAr = gptAr.trim().replace(/هدى/gi, "هودا");

  if (!nameEn.startsWith("Huda Beauty")) {
    nameEn = `Huda Beauty ${nameEn.replace(/^Huda\s+/i, "").replace(/^HUDA\s+BEAUTY\s+/i, "")}`;
  }
  nameEn = nameEn.replace(/\s+/g, " ").trim();

  if (!nameAr.includes("هودا")) {
    nameAr = `هودا بيوتي – ${nameAr}`;
  } else {
    nameAr = nameAr.replace(/^هدى\s*بيوتي/i, "هودا بيوتي").replace(/^هودا\s*بيوتي\s*/i, "هودا بيوتي – ");
    if (!nameAr.includes("–")) {
      nameAr = nameAr.replace(/^هودا بيوتي\s+/i, "هودا بيوتي – ");
    }
  }

  if (meta.shadeEn && !nameEn.toLowerCase().includes(meta.shadeEn.toLowerCase().split(" ")[0])) {
    nameEn = `${nameEn.replace(/\s*–\s*[\d.]+\s*(ml|g|oz).*$/i, "").trim()} – ${meta.shadeEn}`;
  }
  if (meta.shadeAr && !nameAr.includes(meta.shadeAr.split(" ")[0])) {
    nameAr = `${nameAr.replace(/\s*[\d.]+\s*(مل|غرام|مل).*$/i, "").trim()} ${meta.shadeAr}`;
  }

  if (meta.sizeEn && !new RegExp(meta.sizeEn.replace(".", "\\."), "i").test(nameEn)) {
    nameEn = `${nameEn.replace(/\s*–\s*[\d.]+\s*(ml|g|oz).*$/i, "").trim()} – ${meta.sizeEn}`;
  }
  if (meta.sizeAr && !nameAr.includes(meta.sizeAr.replace("غرام", "غرام").split(" ")[0])) {
    const sizePart = meta.sizeAr;
    if (!nameAr.includes(sizePart)) {
      nameAr = `${nameAr.trim()} ${sizePart}`;
    }
  }

  return { nameAr: nameAr.trim(), nameEn: nameEn.trim() };
}

let token = "";

async function login(): Promise<void> {
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

async function resolveBrandId(): Promise<string> {
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: "هودا بيوتي",
    brandEn: "Huda Beauty",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Huda Beauty brand");
  console.log(`Brand: Huda Beauty (${brandId})${resolved.created ? " [created]" : ""}\n`);
  return brandId;
}

async function barcodeExists(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean }>(`/products/barcode-check?barcode=${barcode}`);
  return check.exists;
}

type ResolvedProduct = ProductMeta & { nameAr: string; nameEn: string };

async function gptWithRetry(barcode: string, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await researchProductNameWithGpt(barcode, false);
    } catch (err) {
      if (i >= attempts) throw err;
      console.log(`  retry ${i}/${attempts - 1}: ${(err as Error).message}`);
      await new Promise((r) => setTimeout(r, i * 2000));
    }
  }
  throw new Error("gptWithRetry unreachable");
}

async function resolveNamesWithGpt(): Promise<ResolvedProduct[]> {
  const resolved: ResolvedProduct[] = [];
  let totalInput = 0;
  let totalOutput = 0;
  let totalSearches = 0;

  console.log(`GPT naming for ${PRODUCT_META.length} barcodes...\n`);

  for (const meta of PRODUCT_META) {
    console.log(`--- GPT ${meta.barcode} ---`);
    const { research, usage } = await gptWithRetry(meta.barcode);
    totalInput += usage.input_tokens;
    totalOutput += usage.output_tokens;
    totalSearches += usage.web_search_count;

    console.log(`  GPT raw AR: ${research.product_name_ar}`);
    console.log(`  GPT raw EN: ${research.product_name_en}`);
    if (research.needs_review) console.log(`  ⚠ needs_review (confidence ${research.confidence})`);

    const { nameAr, nameEn } = normalizeGptNames(
      research.product_name_ar,
      research.product_name_en,
      meta,
    );
    console.log(`  → AR: ${nameAr}`);
    console.log(`  → EN: ${nameEn}\n`);

    resolved.push({ ...meta, nameAr, nameEn });
    await new Promise((r) => setTimeout(r, 400));
  }

  const cost = estimateCostUsd(totalInput, totalOutput, totalSearches);
  console.log(
    `GPT total: ${totalInput}+${totalOutput} tokens, ${totalSearches} searches, ~$${cost.toFixed(4)}\n`,
  );

  return resolved;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCT_META.length} (no shades, no images)\n`);

  const products = await resolveNamesWithGpt();

  await login();
  const brandId = await resolveBrandId();

  let added = 0;
  let skipped = 0;

  for (const product of products) {
    console.log(`--- ${product.barcode} ---`);
    if (await barcodeExists(product.barcode)) {
      console.log(`  skip — barcode already exists\n`);
      skipped += 1;
      continue;
    }

    const created = await api<{ id: string }>("/products", "POST", {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      subcategoryIds: [product.subcategoryId],
      tertiaryCategoryId: product.tertiaryCategoryId,
      tertiaryCategoryIds: product.tertiaryCategoryId ? [product.tertiaryCategoryId] : [],
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price: product.price,
      originalPrice: product.price,
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

  console.log(`Done — added: ${added}/${products.length} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
