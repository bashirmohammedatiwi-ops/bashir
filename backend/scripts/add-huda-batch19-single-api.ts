/**
 * Huda Beauty — 19 separate products (no shades, no images).
 * Sources: hudabeauty.com, utopio.de, upcitemdb, modov.fr
 * Usage: npx tsx scripts/add-huda-batch19-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYESHADOW = "07f14763-7a8b-4646-a057-8748e2b18bd4";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const POWDER = "828bbfd2-d611-417a-bdca-0f5424a61171";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";
const BRONZER = "209555fb-201d-457f-9ac6-7cf1ea277bff";
const HIGHLIGHTER = "774d62c3-8119-4c0c-983b-2513fc46df24";
const POWDER_HIGHLIGHTER = "7480a30f-ed2b-41a8-9349-dd67edb010b6";
const MASCARA = "e1032b57-c1af-49e3-a408-130468f22736";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId?: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "6294018400868",
    slug: "huda-beauty-matte-obsessions-eyeshadow-palette-cool-7g",
    sku: "HUDA-400868",
    price: 34000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "هودا بيوتي – باليت ظلال Matte Obsessions Cool 7 غرام",
    nameEn: "Huda Beauty Matte Obsessions Eyeshadow Palette Cool – 7g",
    descriptionAr:
      "باليت ظلال عيون Matte Obsessions Cool من هودا بيوتي — 9 درجات مطفية باردة لإطلالات ناعمة أو سموكي بلا لمعان.\n\n" +
      "• 7 درجات بودرة مطفية + 2 درجات بودرة كريمية مطفية بصبغة عالية.\n" +
      "• ألوان موف بارد، وردي حالم، بنفسجي باستيل وبني بارد — مثالية للإطلالات الكولية.\n" +
      "• قوام كريمي ناعم سهل الدمج مع تغطية قابلة للبناء وقليل التساقط.\n" +
      "• حجم عملي للسفر — بدون عطر وبدون كحول، التغليف الخارجي قابل للتدوير.\n" +
      "• 7 غرام.",
    descriptionEn:
      "Huda Beauty Matte Obsessions Eyeshadow Palette Cool — 9 cool matte shades for soft or smoky no-shine eye looks.\n\n" +
      "• 7 powder mattes plus 2 creamy-matte powder shades with intense pigment.\n" +
      "• Ice-cool mauves, dreamy pinks, pastel purple and cool brown tones.\n" +
      "• Creamy, blendable formula with buildable coverage and minimal fallout.\n" +
      "• Travel-friendly compact — fragrance-free, alcohol-free, recyclable outer packaging.\n" +
      "• 7g.",
  },
  {
    barcode: "6291107573052",
    slug: "huda-beauty-lovefest-cream-blush-toasted-tangerine-10g",
    sku: "HUDA-573052",
    price: 28000,
    categoryId: MAKEUP,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    nameAr: "هودا بيوتي – بلاشر كريمي Lovefest Cream Blush Toasted Tangerine 10 غرام",
    nameEn: "Huda Beauty Lovefest Cream Blush – Toasted Tangerine – 10g",
    descriptionAr:
      "بلاشر كريمي Lovefest Cream Blush بدرجة Toasted Tangerine من هودا بيوتي — لمسة برتقالية مرجانية مشرقة مع لمعان ذهبي خفيف.\n\n" +
      "• تركيبة كريمية بلمية غنية بصبغة عالية تندمج مع البشرة بلمعان رطب.\n" +
      "• بيرلات ذهبية فائقة النعومة لإشراقة طبيعية مثل الخدود المورودة.\n" +
      "• سهل البناء — يُطبّق بالإصبع أو الفرشاة لإطلالة نهارية أو جريئة.\n" +
      "• إصدار محدود بعلبة فنية — خالٍ من العطر، فيغن، التغليف قابل للتدوير.\n" +
      "• 10 غرام.",
    descriptionEn:
      "Huda Beauty Lovefest Cream Blush in Toasted Tangerine — vibrant orange-coral with fine gold shimmer.\n\n" +
      "• Balmy, high-pigment cream formula melts into skin for a dewy pop of colour.\n" +
      "• Super-fine gold pearls for a natural pinched-glow radiance.\n" +
      "• Buildable — apply with fingers or brush for soft or bold looks.\n" +
      "• Limited-edition collector compact — fragrance-free, vegan, recyclable packaging.\n" +
      "• 10g.",
  },
  {
    barcode: "6291107573069",
    slug: "huda-beauty-lovefest-cream-blush-burning-cherry-10g",
    sku: "HUDA-573069",
    price: 28000,
    categoryId: MAKEUP,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    nameAr: "هودا بيوتي – بلاشر كريمي Lovefest Cream Blush Burning Cherry 10 غرام",
    nameEn: "Huda Beauty Lovefest Cream Blush – Burning Cherry – 10g",
    descriptionAr:
      "بلاشر كريمي Lovefest Cream Blush بدرجة Burning Cherry من هودا بيوتي — أحمر توتي دافئ مع لمعان ذهبي رقيق.\n\n" +
      "• تركيبة كريمية بلمية غنية بصبغة عالية تندمج مع البشرة بلمعان رطب.\n" +
      "• بيرلات ذهبية فائقة النعومة لإشراقة طبيعية مثل الخدود المورودة.\n" +
      "• سهل البناء — يُطبّق بالإصبع أو الفرشاة لإطلالة نهارية أو جريئة.\n" +
      "• إصدار محدود بعلبة فنية — خالٍ من العطر، فيغن، التغليف قابل للتدوير.\n" +
      "• 10 غرام.",
    descriptionEn:
      "Huda Beauty Lovefest Cream Blush in Burning Cherry — warm berry red with fine gold shimmer.\n\n" +
      "• Balmy, high-pigment cream formula melts into skin for a dewy pop of colour.\n" +
      "• Super-fine gold pearls for a natural pinched-glow radiance.\n" +
      "• Buildable — apply with fingers or brush for soft or bold looks.\n" +
      "• Limited-edition collector compact — fragrance-free, vegan, recyclable packaging.\n" +
      "• 10g.",
  },
  {
    barcode: "6291106032307",
    slug: "huda-beauty-easy-bake-loose-powder-cinnamon-bun-20g",
    sku: "HUDA-032307",
    price: 32000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    nameAr: "هودا بيوتي – بودرة Loose Easy Bake Baking & Setting Cinnamon Bun 20 غرام",
    nameEn: "Huda Beauty Easy Bake Loose Baking & Setting Powder – Cinnamon Bun – 20g",
    descriptionAr:
      "بودرة Easy Bake Loose Baking & Setting بدرجة Cinnamon Bun من هودا بيوتي — بودرة سائبة فاخرة لتثبيت المكياج والبيكينج.\n\n" +
      "• تركيبة فائقة النعومة غير كوميدوجينية بصبغات ناعمة ولمسة حريرية.\n" +
      "• تثبّت المكياج حتى 10 ساعات، تمتص اللمعان وتوحّد لون البشرة دون قسوة.\n" +
      "• درجة Cinnamon Bun دافئة مناسبة للبشرة المتوسطة إلى الداكنة أو للكونتور.\n" +
      "• تحتوي على فيتامين E — خالية من البارابين، غير عاكسة، مع رائحة مسك زهرية خفيفة.\n" +
      "• 20 غرام مع شبكة ذكية للتحكم بكمية البودرة.",
    descriptionEn:
      "Huda Beauty Easy Bake Loose Baking & Setting Powder in Cinnamon Bun — iconic loose powder for baking and setting.\n\n" +
      "• Ultra-fine, non-comedogenic silky formula that blurs and sets without creasing.\n" +
      "• Locks makeup for up to 10 hours, controls shine and corrects tone naturally.\n" +
      "• Cinnamon Bun is a warm shade for medium to deep skin or contour baking.\n" +
      "• With vitamin E — paraben-free, non-reflective, light floral musk scent.\n" +
      "• 20g with sifter for controlled application.",
  },
  {
    barcode: "6291106032437",
    slug: "huda-beauty-easy-bake-loose-powder-kunafa-20g",
    sku: "HUDA-032437",
    price: 32000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    nameAr: "هودا بيوتي – بودرة Loose Easy Bake Baking & Setting Kunafa 20 غرام",
    nameEn: "Huda Beauty Easy Bake Loose Baking & Setting Powder – Kunafa – 20g",
    descriptionAr:
      "بودرة Easy Bake Loose Baking & Setting بدرجة Kunafa من هودا بيوتي — بودرة سائبة فاخرة لتثبيت المكياج والبيكينج.\n\n" +
      "• تركيبة فائقة النعومة غير كوميدوجينية بصبغات ناعمة ولمسة حريرية.\n" +
      "• تثبّت المكياج حتى 10 ساعات، تمتص اللمعان وتوحّد لون البشرة دون قسوة.\n" +
      "• درجة Kunafa ذهبية دافئة مستوحاة من حلوى الكنافة — مثالية للهايلايت والبيكينج.\n" +
      "• تحتوي على فيتامين E — خالية من البارابين، غير عاكسة، مع رائحة مسك زهرية خفيفة.\n" +
      "• 20 غرام مع شبكة ذكية للتحكم بكمية البودرة.",
    descriptionEn:
      "Huda Beauty Easy Bake Loose Baking & Setting Powder in Kunafa — iconic loose powder for baking and setting.\n\n" +
      "• Ultra-fine, non-comedogenic silky formula that blurs and sets without creasing.\n" +
      "• Locks makeup for up to 10 hours, controls shine and corrects tone naturally.\n" +
      "• Kunafa is a warm golden shade inspired by the dessert — ideal for brightening and baking.\n" +
      "• With vitamin E — paraben-free, non-reflective, light floral musk scent.\n" +
      "• 20g with sifter for controlled application.",
  },
  {
    barcode: "6291106032338",
    slug: "huda-beauty-coral-obsessions-eyeshadow-palette-7-5g",
    sku: "HUDA-032338",
    price: 34000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "هودا بيوتي – باليت ظلال Coral Obsessions 7.5 غرام",
    nameEn: "Huda Beauty Coral Obsessions Eyeshadow Palette – 7.5g",
    descriptionAr:
      "باليت ظلال عيون Coral Obsessions من هودا بيوتي — مجموعة ألوان مرجانية ودافعة لإطلالات عيون مشرقة وجريئة.\n\n" +
      "• درجات مرجانية، برتقالية، ذهبية ووردية بصيغ matte و shimmer و metallic.\n" +
      "• صبغة عالية وقوام سهل الدمج — من الإطلالة الطبيعية إلى العيون المدخنة اللامعة.\n" +
      "• حجم Obsessions العملي المثالي للسفر والتجربة.\n" +
      "• بدون عطر — تغطية قابلة للبناء مع تساقط قليل.\n" +
      "• 7.5 غرام.",
    descriptionEn:
      "Huda Beauty Coral Obsessions Eyeshadow Palette — vibrant coral-toned shades for bright, bold eye looks.\n\n" +
      "• Coral, orange, gold and pink tones in matte, shimmer and metallic finishes.\n" +
      "• High pigment, blendable formula — from soft daytime to glam smoky eyes.\n" +
      "• Compact Obsessions format perfect for travel and experimentation.\n" +
      "• Fragrance-free with buildable coverage and minimal fallout.\n" +
      "• 7.5g.",
  },
  {
    barcode: "6291106032697",
    slug: "huda-beauty-obsessions-eyeshadow-palette-ruby-precious-stones-7-5g",
    sku: "HUDA-032697",
    price: 34000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "هودا بيوتي – باليت ظلال Obsessions Ruby Precious Stones 7.5 غرام",
    nameEn: "Huda Beauty Obsessions Eyeshadow Palette Ruby Precious Stones – 7.5g",
    descriptionAr:
      "باليت ظلال عيون Obsessions Ruby من مجموعة Precious Stones من هودا بيوتي — درجات أحمر ياقوتي وعنابي فاخرة.\n\n" +
      "• 9 درجات بألوان ياقوتية حمراء، عنابية وبنفسجية عميقة مع لمسات لامعة.\n" +
      "• من مجموعة Precious Stones — ألوان جواهر بصبغة عالية وثبات طوال اليوم.\n" +
      "• قوام ناعم سهل الدمج لإطلالات رومانسية أو سموكي جريئة.\n" +
      "• حجم عملي للسفر — بدون عطر.\n" +
      "• 7.5 غرام.",
    descriptionEn:
      "Huda Beauty Obsessions Eyeshadow Palette Ruby from the Precious Stones collection — luxurious ruby and berry reds.\n\n" +
      "• 9 shades of ruby red, burgundy and deep purple with shimmering accents.\n" +
      "• From the Precious Stones line — jewel-toned pigments with all-day wear.\n" +
      "• Soft, blendable formula for romantic or bold smoky looks.\n" +
      "• Travel-friendly compact — fragrance-free.\n" +
      "• 7.5g.",
  },
  {
    barcode: "6291106037302",
    slug: "huda-beauty-glow-obsessions-highlighter-palette-rich-7-5g",
    sku: "HUDA-037302",
    price: 36000,
    categoryId: MAKEUP,
    subcategoryId: HIGHLIGHTER,
    tertiaryCategoryId: POWDER_HIGHLIGHTER,
    nameAr: "هودا بيوتي – باليت هايلايتر Glow Obsessions Rich 7.5 غرام",
    nameEn: "Huda Beauty Glow Obsessions Highlighter Palette Rich – 7.5g",
    descriptionAr:
      "باليت هايلايتر Glow Obsessions Rich من هودا بيوتي — 4 درجات لامعة مصممة للبشرة الداكنة والعميقة.\n\n" +
      "• 4 درجات هايلايتر بودرة بصبغة عالية ولمعان معدني فاخر.\n" +
      "• ألوان Rich دافئة وعميقة تبرز الإشراقة على البشرة الداكنة دون قسوة.\n" +
      "• قوام ناعم سهل الدمج — للوجه، الجسم والعيون.\n" +
      "• حجم Obsessions العملي — مثالي للسفر.\n" +
      "• 7.5 غرام.",
    descriptionEn:
      "Huda Beauty Glow Obsessions Highlighter Palette Rich — 4 luminous shades for deep and rich skin tones.\n\n" +
      "• 4 high-pigment powder highlighters with luxurious metallic radiance.\n" +
      "• Rich warm deep tones that glow beautifully on darker complexions.\n" +
      "• Silky, blendable formula for face, body and eyes.\n" +
      "• Compact Obsessions format — perfect for travel.\n" +
      "• 7.5g.",
  },
  {
    barcode: "6291106037296",
    slug: "huda-beauty-glow-obsessions-highlighter-palette-medium-7-5g",
    sku: "HUDA-037296",
    price: 36000,
    categoryId: MAKEUP,
    subcategoryId: HIGHLIGHTER,
    tertiaryCategoryId: POWDER_HIGHLIGHTER,
    nameAr: "هودا بيوتي – باليت هايلايتر Glow Obsessions Medium 7.5 غرام",
    nameEn: "Huda Beauty Glow Obsessions Highlighter Palette Medium – 7.5g",
    descriptionAr:
      "باليت هايلايتر Glow Obsessions Medium من هودا بيوتي — 4 درجات لامعة مصممة للبشرة المتوسطة.\n\n" +
      "• 4 درجات هايلايتر بودرة بصبغة عالية ولمعان معدني فاخر.\n" +
      "• ألوان Medium متوازنة تمنح إشراقة طبيعية على البشرة المتوسطة.\n" +
      "• قوام ناعم سهل الدمج — للوجه، الجسم والعيون.\n" +
      "• حجم Obsessions العملي — مثالي للسفر.\n" +
      "• 7.5 غرام.",
    descriptionEn:
      "Huda Beauty Glow Obsessions Highlighter Palette Medium — 4 luminous shades for medium skin tones.\n\n" +
      "• 4 high-pigment powder highlighters with luxurious metallic radiance.\n" +
      "• Medium balanced tones for a natural, lit-from-within glow.\n" +
      "• Silky, blendable formula for face, body and eyes.\n" +
      "• Compact Obsessions format — perfect for travel.\n" +
      "• 7.5g.",
  },
  {
    barcode: "6294018404583",
    slug: "huda-beauty-creamy-obsessions-eyeshadow-palette-greige-7-5g",
    sku: "HUDA-404583",
    price: 36000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "هودا بيوتي – باليت ظلال كريمي Creamy Obsessions Greige 7.5 غرام",
    nameEn: "Huda Beauty Creamy Obsessions Eyeshadow Palette Greige – 7.5g",
    descriptionAr:
      "باليت ظلال عيون Creamy Obsessions Greige من هودا بيوتي — درجات كريمية ناعمة بألوان Greige (رمادي بيج).\n\n" +
      "• صيغ كريمية غنية بصبغة عالية تندمج مع الجفن بلمسة ناعمة.\n" +
      "• ألوان Greige محايدة — مثالية للإطلالات الطبيعية اليومية والسموكي الناعم.\n" +
      "• يُطبّق بالإصبع أو الفرشاة — قابل للبناء دون تساقط.\n" +
      "• حجم Obsessions العملي للسفر.\n" +
      "• 7.5 غرام.",
    descriptionEn:
      "Huda Beauty Creamy Obsessions Eyeshadow Palette Greige — creamy greige (grey-beige) neutral tones.\n\n" +
      "• Rich cream formulas with high pigment that glide smoothly on the lid.\n" +
      "• Greige neutrals perfect for everyday soft looks and subtle smoky eyes.\n" +
      "• Apply with finger or brush — buildable with minimal fallout.\n" +
      "• Compact Obsessions format for travel.\n" +
      "• 7.5g.",
  },
  {
    barcode: "6294018404040",
    slug: "huda-beauty-creamy-obsessions-eyeshadow-palette-brown-7-5g",
    sku: "HUDA-404040",
    price: 36000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "هودا بيوتي – باليت ظلال كريمي Creamy Obsessions Brown 7.5 غرام",
    nameEn: "Huda Beauty Creamy Obsessions Eyeshadow Palette Brown – 7.5g",
    descriptionAr:
      "باليت ظلال عيون Creamy Obsessions Brown من هودا بيوتي — درجات كريمية بنية دافعة لإطلالات عيون كلاسيكية.\n\n" +
      "• صيغ كريمية غنية بصبغة عالية تندمج مع الجفن بلمسة ناعمة.\n" +
      "• درجات بنية من الفاتح إلى الداكن — مثالية للسموكي والإطلالات الطبيعية.\n" +
      "• يُطبّق بالإصبع أو الفرشاة — قابل للبناء دون تساقط.\n" +
      "• حجم Obsessions العملي للسفر.\n" +
      "• 7.5 غرام.",
    descriptionEn:
      "Huda Beauty Creamy Obsessions Eyeshadow Palette Brown — creamy warm brown shades for classic eye looks.\n\n" +
      "• Rich cream formulas with high pigment that glide smoothly on the lid.\n" +
      "• Brown tones from light to deep — ideal for smoky and natural eyes.\n" +
      "• Apply with finger or brush — buildable with minimal fallout.\n" +
      "• Compact Obsessions format for travel.\n" +
      "• 7.5g.",
  },
  {
    barcode: "6291106039115",
    slug: "huda-beauty-wild-obsessions-eyeshadow-palette-tiger-7-5g",
    sku: "HUDA-039115",
    price: 34000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "هودا بيوتي – باليت ظلال Wild Obsessions Tiger 7.5 غرام",
    nameEn: "Huda Beauty Wild Obsessions Eyeshadow Palette Tiger – 7.5g",
    descriptionAr:
      "باليت ظلال عيون Wild Obsessions Tiger من هودا بيوتي — درجات برتقالية وذهبية جريئة مستوحاة من النمر.\n\n" +
      "• 9 درجات بألوان برتقالية، ذهبية، بنية وأسود بصيغ matte و shimmer و metallic.\n" +
      "• من مجموعة Wild Obsessions — ألوان صحراوية جريئة بصبغة عالية.\n" +
      "• قوام ناعم سهل الدمج لإطلالات عيون معدنية أو سموكي دافئة.\n" +
      "• علبة فنية مستوحاة من حيوانات — حجم عملي 7.5 غرام.",
    descriptionEn:
      "Huda Beauty Wild Obsessions Eyeshadow Palette Tiger — bold orange and gold shades inspired by the tiger.\n\n" +
      "• 9 shades in orange, gold, brown and black with matte, shimmer and metallic finishes.\n" +
      "• From the Wild Obsessions line — fierce desert tones with intense pigment.\n" +
      "• Soft, blendable formula for metallic glam or warm smoky eyes.\n" +
      "• Animal-inspired collector packaging — 7.5g travel size.",
  },
  {
    barcode: "6291106038101",
    slug: "huda-beauty-wild-obsessions-eyeshadow-palette-jaguar-7-5g",
    sku: "HUDA-038101",
    price: 34000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "هودا بيوتي – باليت ظلال Wild Obsessions Jaguar 7.5 غرام",
    nameEn: "Huda Beauty Wild Obsessions Eyeshadow Palette Jaguar – 7.5g",
    descriptionAr:
      "باليت ظلال عيون Wild Obsessions Jaguar من هودا بيوتي — درجات خضراء وذهبية مستوحاة من الياغور.\n\n" +
      "• 9 درجات بألوان خضراء، ذهبية، بنية وأسود بصيغ matte و shimmer و metallic.\n" +
      "• من مجموعة Wild Obsessions — ألوان غريبة وجريئة بصبغة عالية.\n" +
      "• قوام ناعم سهل الدمج لإطلالات عيون معدنية أو سموكي خضراء.\n" +
      "• علبة فنية مستوحاة من حيوانات — حجم عملي 7.5 غرام.",
    descriptionEn:
      "Huda Beauty Wild Obsessions Eyeshadow Palette Jaguar — green and gold shades inspired by the jaguar.\n\n" +
      "• 9 shades in green, gold, brown and black with matte, shimmer and metallic finishes.\n" +
      "• From the Wild Obsessions line — exotic bold tones with intense pigment.\n" +
      "• Soft, blendable formula for metallic glam or green smoky eyes.\n" +
      "• Animal-inspired collector packaging — 7.5g travel size.",
  },
  {
    barcode: "6291106038095",
    slug: "huda-beauty-wild-obsessions-eyeshadow-palette-python-7-5g",
    sku: "HUDA-038095",
    price: 34000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "هودا بيوتي – باليت ظلال Wild Obsessions Python 7.5 غرام",
    nameEn: "Huda Beauty Wild Obsessions Eyeshadow Palette Python – 7.5g",
    descriptionAr:
      "باليت ظلال عيون Wild Obsessions Python من هودا بيوتي — درجات بنفسجية وذهبية مستوحاة من الثعبان.\n\n" +
      "• 9 درجات بألوان بنفسجية، ذهبية، خضراء وأسود بصيغ matte و shimmer و metallic.\n" +
      "• من مجموعة Wild Obsessions — ألوان غريبة وجريئة بصبغة عالية.\n" +
      "• قوام ناعم سهل الدمج لإطلالات عيون معدنية أو سموكي بنفسجية.\n" +
      "• علبة فنية مستوحاة من حيوانات — حجم عملي 7.5 غرام.",
    descriptionEn:
      "Huda Beauty Wild Obsessions Eyeshadow Palette Python — purple and gold shades inspired by the python.\n\n" +
      "• 9 shades in purple, gold, green and black with matte, shimmer and metallic finishes.\n" +
      "• From the Wild Obsessions line — exotic bold tones with intense pigment.\n" +
      "• Soft, blendable formula for metallic glam or purple smoky eyes.\n" +
      "• Animal-inspired collector packaging — 7.5g travel size.",
  },
  {
    barcode: "6291106036770",
    slug: "huda-beauty-brown-obsessions-eyeshadow-palette-toffee-7-5g",
    sku: "HUDA-036770",
    price: 34000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "هودا بيوتي – باليت ظلال Brown Obsessions Toffee 7.5 غرام",
    nameEn: "Huda Beauty Brown Obsessions Eyeshadow Palette Toffee – 7.5g",
    descriptionAr:
      "باليت ظلال عيون Brown Obsessions Toffee من هودا بيوتي — 9 درجات بنية دافعة مستوحاة من حلوى التوفي.\n\n" +
      "• درجات بنية كراميلية وشوكولاتية بصيغ matte و shimmer و metallic.\n" +
      "• مثالية للإطلالات الطبيعية النودية والسموكي البني الكلاسيكي.\n" +
      "• صبغة عالية وقوام سهل الدمج مع تغطية قابلة للبناء.\n" +
      "• حجم Obsessions العملي — بدون عطر.\n" +
      "• 7.5 غرام.",
    descriptionEn:
      "Huda Beauty Brown Obsessions Eyeshadow Palette Toffee — 9 warm brown shades inspired by toffee candy.\n\n" +
      "• Caramel and chocolate brown tones in matte, shimmer and metallic finishes.\n" +
      "• Perfect for natural nude looks and classic brown smoky eyes.\n" +
      "• High pigment, blendable formula with buildable coverage.\n" +
      "• Compact Obsessions format — fragrance-free.\n" +
      "• 7.5g.",
  },
  {
    barcode: "6291106033434",
    slug: "huda-beauty-bronzer-tantour-tan-11g",
    sku: "HUDA-033434",
    price: 32000,
    categoryId: MAKEUP,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BRONZER,
    nameAr: "هودا بيوتي – برونزر كريمي-بودرة Tantour Tan 11 غرام",
    nameEn: "Huda Beauty Tantour Bronzer & Contour Cream-Powder – Tan – 11g",
    descriptionAr:
      "برونزر وكونتور Tantour بدرجة Tan من هودا بيوتي — صيغة كريم-بودرة فاخرة بلون كاكاوي عميق.\n\n" +
      "• تركيبة كريم-بودرة عالية الصبغة لوضع الكونتور أو الإشراقة البرونزية الطبيعية.\n" +
      "• درجة Tan — لون كاكاوي عميق للبشرة الداكنة والعميقة.\n" +
      "• ثبات طويل، مقاوم للماء والعرق — لا يتشقق ولا يبهت.\n" +
      "• يُطبّق بالإصبع أو الفرشاة ويُدمج بسلاسة.\n" +
      "• 11 غرام.",
    descriptionEn:
      "Huda Beauty Tantour Bronzer & Contour Cream-Powder in Tan — luxurious cream-to-powder formula in deep cocoa.\n\n" +
      "• High-pigment cream-powder for sculpting contour or natural bronzed warmth.\n" +
      "• Tan shade — deep cocoa tone for deep tan complexions.\n" +
      "• Long-wear, water- and sweat-resistant — no cracking or fading.\n" +
      "• Applies and blends smoothly with finger or brush.\n" +
      "• 11g.",
  },
  {
    barcode: "6291107573151",
    slug: "huda-beauty-lovefest-legit-lashes-mini-mascara",
    sku: "HUDA-573151",
    price: 20000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "هودا بيوتي – ماسكرا Legit Lashes Mini من مجموعة Lovefest",
    nameEn: "Huda Beauty Lovefest Legit Lashes Mini Mascara",
    descriptionAr:
      "ماسكرا Legit Lashes Mini من مجموعة Lovefest من هودا بيوتي — رموش طويلة وكثيفة بحجم صغير للسفر.\n\n" +
      "• تركيبة Legit Lashes لرموش ممتدة ومرتفعة مع فصل بين الرموش.\n" +
      "• فرشاة مصممة لرفع الرموش من الجذور وتغطية كل رمش.\n" +
      "• ثبات طوال اليوم دون تكتل — مثالية للإطلالات اليومية والمناسبات.\n" +
      "• حجم Mini عملي للحقيبة والسفر.\n" +
      "• من مجموعة Lovefest الإصدار المحدود.",
    descriptionEn:
      "Huda Beauty Lovefest Legit Lashes Mini Mascara — lengthening and volumizing mascara in travel size.\n\n" +
      "• Legit Lashes formula for lifted, elongated lashes with clean separation.\n" +
      "• Brush designed to lift from the roots and coat every lash.\n" +
      "• All-day wear without clumping — for everyday and occasion looks.\n" +
      "• Mini size perfect for handbag and travel.\n" +
      "• From the limited-edition Lovefest collection.",
  },
  {
    barcode: "6291106031850",
    slug: "huda-beauty-the-overachiever-concealer-00g-whipped-cream-10ml",
    sku: "HUDA-031850",
    price: 24000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: CONCEALER,
    nameAr: "هودا بيوتي – كونسيلر سائل The Overachiever 00G Whipped Cream 10 مل",
    nameEn: "Huda Beauty The Overachiever Full Cover Concealer – 00G Whipped Cream – 10ml",
    descriptionAr:
      "كونسيلر سائل The Overachiever بدرجة 00G Whipped Cream من هودا بيوتي — تغطية كاملة بلون فاتح جداً ب undertone وردي.\n\n" +
      "• تركيبة كريمية غنية بتغطية كاملة تخفي العيوب والهالات والاحمرار.\n" +
      "• درجة 00G Whipped Cream — للبشرة الفاتحة جداً ب undertone وردي (بارد).\n" +
      "• قابل للبناء دون تشقق — ينزلق بسلاسة ويُدمج بسهولة.\n" +
      "• خالٍ من العطر — مثالي تحت العيون وعلى البقع.\n" +
      "• 10 مل (0.34 أونصة).",
    descriptionEn:
      "Huda Beauty The Overachiever Full Cover Concealer in 00G Whipped Cream — full coverage very fair pink-toned shade.\n\n" +
      "• Rich creamy formula with full coverage for blemishes, dark circles and redness.\n" +
      "• Shade 00G Whipped Cream — for very fair skin with pink (cool) undertone.\n" +
      "• Buildable without creasing — glides on and blends effortlessly.\n" +
      "• Fragrance-free — ideal under eyes and on spots.\n" +
      "• 10ml (0.34 fl oz).",
  },
  {
    barcode: "6294018401858",
    slug: "huda-beauty-easy-bake-and-snatch-pressed-powder-cherry-blossom",
    sku: "HUDA-401858",
    price: 30000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    nameAr: "هودا بيوتي – بودرة مضغوطة Easy Bake And Snatch Cherry Blossom",
    nameEn: "Huda Beauty Easy Bake And Snatch Pressed Baking & Setting Powder – Cherry Blossom",
    descriptionAr:
      "بودرة مضغوطة Easy Bake And Snatch بدرجة Cherry Blossom من هودا بيوتي — تثبيت وكونتور بلون وردي فاتح.\n\n" +
      "• صيغة بودرة مضغوطة من خط Easy Bake — لتثبيت المكياج والسناتش (الكونتور).\n" +
      "• درجة Cherry Blossom وردية فاتحة — مثالية لإبراز منطقة تحت العين والهايلايت.\n" +
      "• تركيبة ناعمة غير كوميدوجينية تمتص اللمعان دون قسوة.\n" +
      "• سهلة التطبيق والنقل — مثالية للحقيبة.\n" +
      "• من خط Easy Bake And Snatch المضغوط.",
    descriptionEn:
      "Huda Beauty Easy Bake And Snatch Pressed Baking & Setting Powder in Cherry Blossom — pressed powder for setting and snatching.\n\n" +
      "• Pressed Easy Bake formula for makeup setting and contour snatching.\n" +
      "• Cherry Blossom is a light pink tone — ideal for brightening under eyes and highlighting.\n" +
      "• Soft non-comedogenic formula absorbs shine without looking harsh.\n" +
      "• Easy to apply and carry — perfect for on-the-go.\n" +
      "• From the Easy Bake And Snatch pressed line.",
  },
  {
    barcode: "6294018401865",
    slug: "huda-beauty-easy-bake-and-snatch-pressed-powder-banana-bread",
    sku: "HUDA-401865",
    price: 30000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    nameAr: "هودا بيوتي – بودرة مضغوطة Easy Bake And Snatch Banana Bread",
    nameEn: "Huda Beauty Easy Bake And Snatch Pressed Baking & Setting Powder – Banana Bread",
    descriptionAr:
      "بودرة مضغوطة Easy Bake And Snatch بدرجة Banana Bread من هودا بيوتي — تثبيت وكونتور بلون أصفر بانانا كلاسيكي.\n\n" +
      "• صيغة بودرة مضغوطة من خط Easy Bake — لتثبيت المكياج والسناتش (الكونتور).\n" +
      "• درجة Banana Bread صفراء دافعة — مثالية لتفتيح تحت العين والبيكينج.\n" +
      "• تركيبة ناعمة غير كوميدوجينية تمتص اللمعان دون قسوة.\n" +
      "• سهلة التطبيق والنقل — مثالية للحقيبة.\n" +
      "• من خط Easy Bake And Snatch المضغوط.",
    descriptionEn:
      "Huda Beauty Easy Bake And Snatch Pressed Baking & Setting Powder in Banana Bread — pressed powder for setting and snatching.\n\n" +
      "• Pressed Easy Bake formula for makeup setting and contour snatching.\n" +
      "• Banana Bread is a classic warm yellow tone — ideal for under-eye brightening and baking.\n" +
      "• Soft non-comedogenic formula absorbs shine without looking harsh.\n" +
      "• Easy to apply and carry — perfect for on-the-go.\n" +
      "• From the Easy Bake And Snatch pressed line.",
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

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length} (no shades, no images)\n`);
  await login();
  const brandId = await resolveBrandId();

  let added = 0;
  let skipped = 0;

  for (const product of PRODUCTS) {
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

  console.log(`Done — added: ${added}/${PRODUCTS.length} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
