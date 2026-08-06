/**
 * Bath & Body Works — 25 separate 3-Wick Scented Candles (no shades, no images).
 * Sources: bathandbodyworks.in, bathandbodyworks.ph, go-upc.com, elryan.com (verified barcodes)
 * Usage: npx tsx scripts/add-bbw-candles-batch25-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const HOME_SCENTS = "06f8d36f-a094-4252-ae28-cba993445c8f";
const CANDLES_DIFFUSER = "0822145d-8a0c-4eeb-9260-16b7fac0b54d";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const PRODUCTS: ProductDef[] = [
  // ── Fresh & Clean ──
  {
    barcode: "667659428892",
    slug: "bbw-laundry-day-3-wick-candle-411g",
    sku: "BBW-428892",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Laundry Day 411 جم",
    nameEn: "Bath & Body Works - Laundry Day 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة ملابس نظيفة منشورة على حبل الغسيل.\n\n" +
      "• نوتات: هواء منعش، أوكالبتوس منعش ولافندر ناعم.\n• رائحة منعشة ونظيفة تملأ الغرفة بالانتعاش.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص لاحتراق متوازن.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz) — غطاء زخرفي (قد يختلف).",
    descriptionEn:
      "Bath & Body Works Laundry Day 3-Wick Candle — like fresh laundry straight from the clothesline.\n\n" +
      "• Fragrance notes: fresh air, crisp eucalyptus and soft lavender.\n• Clean, airy scent that makes any space smell freshly laundered.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks for an even burn.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz) — decorative lid included (may vary).",
  },
  {
    barcode: "667659363452",
    slug: "bbw-sun-drenched-linen-3-wick-candle-411g",
    sku: "BBW-363452",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Sun-Drenched Linen 411 جم",
    nameEn: "Bath & Body Works - Sun-Drenched Linen 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة ملابس نظيفة مجففة تحت أشعة الشمس.\n\n" +
      "• نوتات: كتان منعش، تفاح حامض مقرمش ومسك ناعم.\n• رائحة نظيفة منعشة كغسيل جاف في يوم مشمس.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Sun-Drenched Linen 3-Wick Candle — fresh, clean laundry drying in the sunshine.\n\n" +
      "• Fragrance notes: fresh linen, crisp tart apple and soft musk.\n• Airy, uplifting clean-laundry fragrance.\n• High concentration of rich fragrance oils in a soy wax blend.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667659363490",
    slug: "bbw-kitchen-lemon-3-wick-candle-411g",
    sku: "BBW-363490",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Kitchen Lemon 411 جم",
    nameEn: "Bath & Body Works - Kitchen Lemon 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة ليمون المطبخ المنعشة.\n\n" +
      "• نوتات: قشر ليمون طازج، زهور بيضاء ومسك.\n• رائحة حمضية منعشة كمطبخ نظيف بعد التنظيف.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Kitchen Lemon 3-Wick Candle — a bright, zesty lemon kitchen scent.\n\n" +
      "• Fragrance notes: fresh lemon zest, white flowers and musk.\n• Crisp, clean citrus fragrance for kitchens and living spaces.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667556464580",
    slug: "bbw-cucumber-aloe-water-3-wick-candle-411g",
    sku: "BBW-464580",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Cucumber & Aloe Water 411 جم",
    nameEn: "Bath & Body Works - Cucumber & Aloe Water 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة خيار وأloe ماء منعشة وخفيفة.\n\n" +
      "• نوتات: خيار منعش، Aloe Vera ونسمات مائية.\n• رائحة هوائية منعشة ومريحة كالطيران بين السحب.\n• شمع صويا مع زيوت عطرية طبيعية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Cucumber & Aloe Water 3-Wick Candle — airy, uplifting and sweet.\n\n" +
      "• Fragrance notes: crisp cucumber, aloe water and fresh aquatic notes.\n• Light, refreshing scent like soaring through the clouds.\n• Proprietary fragranced wax blend infused with natural essential oils.\n• Quality lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },

  // ── Citrus & Herbal ──
  {
    barcode: "667659363483",
    slug: "bbw-midnight-blue-citrus-3-wick-candle-411g",
    sku: "BBW-363483",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Midnight Blue Citrus 411 جم",
    nameEn: "Bath & Body Works - Midnight Blue Citrus 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة حمضيات ليلية منعشة.\n\n" +
      "• نوتات: برتقال دموي، يuzu ياباني وعنبر.\n• مزيج حمضي منعش بلمسة ليلية دافئة.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Midnight Blue Citrus 3-Wick Candle — bright citrus with a warm evening twist.\n\n" +
      "• Fragrance notes: blood orange, Japanese yuzu and amber.\n• Vibrant, energizing citrus fragrance.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667659363506",
    slug: "bbw-lavender-bergamot-3-wick-candle-411g",
    sku: "BBW-363506",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Lavender Bergamot 411 جم",
    nameEn: "Bath & Body Works - Lavender Bergamot 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة لافندر وBergamot مهدئة.\n\n" +
      "• نوتات: لافندر فرنسي، Bergamot إيطالي ومسك.\n• رائحة هادئة ومريحة مثالية للاسترخاء.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Lavender Bergamot 3-Wick Candle — a calming spa-like blend.\n\n" +
      "• Fragrance notes: French lavender, Italian bergamot and musk.\n• Soothing, relaxing fragrance for bedrooms and living rooms.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667659363520",
    slug: "bbw-eucalyptus-mint-3-wick-candle-411g",
    sku: "BBW-363520",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Eucalyptus Mint 411 جم",
    nameEn: "Bath & Body Works - Eucalyptus Mint 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة أوكالبتوس ونعناع منعشة.\n\n" +
      "• نوتات: أوراق أوكالبتوس، نعناع بارد ومسك.\n• رائحة منعشة ومنشّطة كزيارة لمنتجع صحي.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Eucalyptus Mint 3-Wick Candle — a refreshing spa-inspired scent.\n\n" +
      "• Fragrance notes: eucalyptus leaf, cool mint and musk.\n• Invigorating, clean fragrance that awakens the senses.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667659426188",
    slug: "bbw-watermelon-lemonade-3-wick-candle-411g",
    sku: "BBW-426188",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Watermelon Lemonade 411 جم",
    nameEn: "Bath & Body Works - Watermelon Lemonade 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة بطيخ وLemonade صيفية.\n\n" +
      "• نوتات: ثلج بطيخ، ماء فوار وليمون Meyer.\n• رائحة فاكهية منعشة كمشروب صيفي بارد.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Watermelon Lemonade 3-Wick Candle — a sweet and tangy warm-weather refresher.\n\n" +
      "• Fragrance notes: watermelon ice, sparkling water and Meyer lemon.\n• Fruity summertime splash you can enjoy anytime.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },

  // ── Floral ──
  {
    barcode: "667659363445",
    slug: "bbw-lakeside-morning-3-wick-candle-411g",
    sku: "BBW-363445",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Lakeside Morning 411 جم",
    nameEn: "Bath & Body Works - Lakeside Morning 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة صباح هادئ على ضفاف البحيرة.\n\n" +
      "• نوتات: هواء خريفي منعش، خشب driftwood وتفاح أخضر.\n• رائحة باردة حلوة كوقت هدوء على الرصيف.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Lakeside Morning 3-Wick Candle — cool, sweet solitude on the dock.\n\n" +
      "• Fragrance notes: crisp autumn air, white driftwood and a hint of green apple.\n• Fresh, serene lakeside atmosphere.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667659363469",
    slug: "bbw-cactus-blossom-3-wick-candle-411g",
    sku: "BBW-363469",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Cactus Blossom 411 جم",
    nameEn: "Bath & Body Works - Cactus Blossom 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة زهر الصبار الاستوائي.\n\n" +
      "• نوتات: زهر cactus، جوز الهند وvanilla.\n• رائحة زهرية استوائية منعشة ومبهجة.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Cactus Blossom 3-Wick Candle — a vibrant tropical floral scent.\n\n" +
      "• Fragrance notes: cactus flower petals, coconut and vanilla.\n• Fresh, exotic floral fragrance.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667659428922",
    slug: "bbw-rose-water-ivy-3-wick-candle-411g",
    sku: "BBW-428922",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Rose Water & Ivy 411 جم",
    nameEn: "Bath & Body Works - Rose Water & Ivy 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة ورد ولبلab معطّر.\n\n" +
      "• نوتات: بتلات ورد، لبلab إنجlيزي وزهر ليمون.\n• رائحة زهرية خفيفة كباقة ورد طازجة.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Rose Water & Ivy 3-Wick Candle — a light floral like a fresh-cut rose bouquet.\n\n" +
      "• Fragrance notes: rose petals, English ivy and lemon blossom.\n• Beautiful blooming scent for any room.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667659418084",
    slug: "bbw-japanese-cherry-blossom-3-wick-candle-411g",
    sku: "BBW-418084",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Japanese Cherry Blossom 411 جم",
    nameEn: "Bath & Body Works - Japanese Cherry Blossom 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة زهر الCherry الياباني الأيقونية.\n\n" +
      "• نوتات: زهر الCherry الياباني، كمثرى آسيوية وsandalwood وردي.\n• رائحة زهرية أنثوية خالدة وأنيقة.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Japanese Cherry Blossom 3-Wick Candle — timeless, undeniably feminine floral.\n\n" +
      "• Fragrance notes: Japanese cherry blossom, Asian pear and blushing sandalwood.\n• Iconic floral fragrance — the little black dress of scents.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667659313600",
    slug: "bbw-a-thousand-wishes-3-wick-candle-411g",
    sku: "BBW-313600",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل A Thousand Wishes 411 جم",
    nameEn: "Bath & Body Works - A Thousand Wishes 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة A Thousand Wishes الاحتفالية.\n\n" +
      "• نوتات: peonies بلورية وCrème لوز.\n• رائحة حلوة دافئة كاحتفال مبهج.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works A Thousand Wishes 3-Wick Candle — a sweet, heart-warming celebration.\n\n" +
      "• Fragrance notes: crystal peonies and almond crème.\n• Sparkling, festive fragrance that fills the room.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },

  // ── Fruity & Gourmand ──
  {
    barcode: "667659363407",
    slug: "bbw-strawberry-pound-cake-3-wick-candle-411g",
    sku: "BBW-363407",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Strawberry Pound Cake 411 جم",
    nameEn: "Bath & Body Works - Strawberry Pound Cake 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة كعكة الفراولة الذهبية.\n\n" +
      "• نوتات: فراولة طازجة، كعكة pound cake ذهبية وCrème مخفوق.\n• رائحة فاكهية حلوة تفتح الشهية.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Strawberry Pound Cake 3-Wick Candle — fruity, mouth-wateringly sweet.\n\n" +
      "• Fragrance notes: fresh-picked strawberries, golden shortcake and whipped cream.\n• Indulgent baked-goods aroma.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667659363421",
    slug: "bbw-black-cherry-merlot-3-wick-candle-411g",
    sku: "BBW-363421",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Black Cherry Merlot 411 جم",
    nameEn: "Bath & Body Works - Black Cherry Merlot 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة Cherry أسود وmerlot.\n\n" +
      "• نوتات: Cherry أسود ناضج، merlot أحمر وplum.\n• رائحة فاكهية غنية بدفء النبيذ.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Black Cherry Merlot 3-Wick Candle — rich, dark cherry with a wine-like warmth.\n\n" +
      "• Fragrance notes: ripe black cherry, red merlot and plum.\n• Deep, fruity gourmand fragrance.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667659428915",
    slug: "bbw-pineapple-mango-3-wick-candle-411g",
    sku: "BBW-428915",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Pineapple Mango 411 جم",
    nameEn: "Bath & Body Works - Pineapple Mango 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة أناناس وmango استوائية.\n\n" +
      "• نوتات: عصير أnanas طازج، mango وتوت العليق الناضج.\n• رائحة استوائية منعشة عطلة في الجزر.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Pineapple Mango 3-Wick Candle — a deep breath of the tropics.\n\n" +
      "• Fragrance notes: fresh pineapple juice, mango and vine-ripened raspberry.\n• Juicy tropical fruit fragrance.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667659363476",
    slug: "bbw-sunny-coconut-3-wick-candle-411g",
    sku: "BBW-363476",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Sunny Coconut 411 جم",
    nameEn: "Bath & Body Works - Sunny Coconut 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة جوز الهند المشمس.\n\n" +
      "• نوتات: جوز Hind كريمي، أشجار palm مشمسة وvanilla دافئ.\n• رائحة استرخاء على الشاطئ تحت الشمس.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Sunny Coconut 3-Wick Candle — the ultimate relaxing beach day.\n\n" +
      "• Fragrance notes: creamy coconut, sunny palm trees and warm vanilla.\n• Tropical, sun-kissed coconut fragrance.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667555965514",
    slug: "bbw-blueberry-pie-3-wick-candle-411g",
    sku: "BBW-965514",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Blueberry Pie 411 جم",
    nameEn: "Bath & Body Works - Blueberry Pie 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة فطيرة التوت الأزرق.\n\n" +
      "• نوتات: توت أزرق حلو، عجينة مخبوزة وvanilla.\n• رائحة حلوة مريحة كفطيرة طازجة من الفرن.\n• شمع صويا مع زيوت عطرية طبيعية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Blueberry Pie 3-Wick Candle — the fruity baked treat everyone asks for.\n\n" +
      "• Fragrance notes: sweet blueberry, baked pastry and vanilla.\n• Comforting gourmand home fragrance.\n• Patented soy wax blend with natural essential oils.\n• Quality lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667659385324",
    slug: "bbw-warm-vanilla-sugar-3-wick-candle-411g",
    sku: "BBW-385324",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Warm Vanilla Sugar 411 جم",
    nameEn: "Bath & Body Works - Warm Vanilla Sugar 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة Warm Vanilla Sugar الأيقونية.\n\n" +
      "• نوتات: vanilla مسkرة، orchid أبيض، سكر لامع، jasmine وsandalwood كريمي.\n• رائحة vanilla حلوة دافئة ومريحة.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Warm Vanilla Sugar 3-Wick Candle — irresistibly creamy, sweet comfort.\n\n" +
      "• Fragrance notes: intoxicating vanilla, white orchid, sparkling sugar, fresh jasmine and creamy sandalwood.\n• One of the most loved BBW home fragrances.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },

  // ── Woody & Spiced ──
  {
    barcode: "667659346103",
    slug: "bbw-dark-velvet-oud-3-wick-candle-411g",
    sku: "BBW-346103",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Dark Velvet Oud 411 جم",
    nameEn: "Bath & Body Works - Dark Velvet Oud 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة عود مخملي داكن فاخرة.\n\n" +
      "• نوتات: قرنفل غني، ماء ورد، sandalwood.\n• رائحة شرقية دافئة مناسبة للمنزل والمجالس.\n• شمع صويا مع زيوت عطرية طبيعية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Dark Velvet Oud 3-Wick Candle — rich, warm and luxurious.\n\n" +
      "• Fragrance notes: rich clove, rose water and sandalwood.\n• Deep oriental home fragrance with oud character.\n• Proprietary fragranced wax blend infused with natural essential oils.\n• Quality lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667659363438",
    slug: "bbw-mahogany-teakwood-intense-3-wick-candle-411g",
    sku: "BBW-363438",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Mahogany Teakwood Intense 411 جم",
    nameEn: "Bath & Body Works - Mahogany Teakwood Intense 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة Mahogany Teakwood Intense الخشبية.\n\n" +
      "• نوتات: mahogany غني، teakwood أسود، oak داكن وLavender مثلج.\n• رائحة خشبية عميقة كالمشي في الغابة.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Mahogany Teakwood Intense 3-Wick Candle — borrowing flannel for a hike in the woods.\n\n" +
      "• Fragrance notes: rich mahogany, black teakwood, dark oak and frosted lavender.\n• Intense version of the classic woody home fragrance.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667659363513",
    slug: "bbw-cinnamon-spiced-vanilla-3-wick-candle-411g",
    sku: "BBW-363513",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Cinnamon Spiced Vanilla 411 جم",
    nameEn: "Bath & Body Works - Cinnamon Spiced Vanilla 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة قرفة وvanilla دافئة.\n\n" +
      "• نوتات: قرفة مطحونة طازجة، بلورات سكر وvanilla Tahitian.\n• رائحة دافئة متبّلة كحلوى شتوية.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Cinnamon Spiced Vanilla 3-Wick Candle — a warm, spiced, creamy indulgence.\n\n" +
      "• Fragrance notes: fresh ground cinnamon, sugar crystals and Tahitian vanilla bean.\n• Cozy spiced vanilla home fragrance.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667558803189",
    slug: "bbw-tis-the-season-3-wick-candle-411g",
    sku: "BBW-803189",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Tis The Season 411 جم",
    nameEn: "Bath & Body Works - Tis The Season 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة Tis The Season الاحتفالية.\n\n" +
      "• نوتات: تفاح أحمر غني، قرفة حلوة وcedarwood.\n• رائحة فاكهية خشبية متبّلة كروح الموسم.\n• شمع صويا مع زيوت عطرية طبيعية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Tis The Season 3-Wick Candle — fruity, woodsy and spiced.\n\n" +
      "• Fragrance notes: rich red apple, sweet cinnamon and cedarwood.\n• Festive seasonal home fragrance.\n• Proprietary fragranced wax blend infused with natural essential oils.\n• Quality lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667659356737",
    slug: "bbw-dark-kiss-3-wick-candle-411g",
    sku: "BBW-356737",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل Dark Kiss 411 جم",
    nameEn: "Bath & Body Works - Dark Kiss 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة Dark Kiss  sensual.\n\n" +
      "• نوتات: توت أسود، ورد burgundy، bergamot بخور، vanilla داكن وplum musk.\n• رائحة ليلية حلوة وغامضة.\n• شمع صويا معطّر بتركيز عالٍ من الزيوت العطرية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works Dark Kiss 3-Wick Candle — a sweet, seductive night in.\n\n" +
      "• Fragrance notes: black raspberry, burgundy rose, bergamot incense, dark vanilla bean and plum musk.\n• Dark, romantic home fragrance.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
  },
  {
    barcode: "667559276869",
    slug: "bbw-first-sight-3-wick-candle-411g",
    sku: "BBW-276869",
    price: 25000,
    nameAr: "باث آند بودي ووركس - شمعة معطرة 3 فتائل First Sight 411 جم",
    nameEn: "Bath & Body Works - First Sight 3-Wick Scented Candle 411g",
    descriptionAr:
      "شمعة معطرة 3 فتائل من باث آند بودي ووركس برائحة First Sight من مجموعة الزفاف.\n\n" +
      "• نوتات: bergamot إيطالي، أخشاب غنية وmusk مسكّر.\n• رائحة دافئة غنية ومعبّرة عن اللحظة الأولى.\n• شمع صويا مع زيوت عطرية طبيعية.\n• 3 فتائل خالية من الرصاص.\n• مدة احتراق تقريباً 25–45 ساعة.\n• 411 جم (14.5 oz).",
    descriptionEn:
      "Bath & Body Works First Sight 3-Wick Candle — knowing you've found the one.\n\n" +
      "• Fragrance notes: Italian bergamot, rich woods and sugared musk.\n• Warm, musky fragrance from the Wedding Collection.\n• Exclusively fragranced soy wax blend with rich fragrance oils.\n• Premium lead-free wicks.\n• Burns for approximately 25–45 hours.\n• 411 g (14.5 oz).",
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

async function resolveBrand(): Promise<string> {
  const resolved = await api<{ brand?: { id: string } }>("/brands/resolve", "POST", {
    brandAr: "باث آند بودي ووركس",
    brandEn: "Bath & Body Works",
    createIfMissing: true,
  });
  const id = resolved.brand?.id;
  if (!id) throw new Error("Could not resolve Bath & Body Works brand");
  return id;
}

async function barcodeExists(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean }>(`/products/barcode-check?barcode=${barcode}`);
  return check.exists;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length} (no shades, no images)\n`);
  await login();
  const brandId = await resolveBrand();
  console.log(`Brand: Bath & Body Works (${brandId})\n`);

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
      categoryId: HOME_SCENTS,
      subcategoryId: CANDLES_DIFFUSER,
      subcategoryIds: [CANDLES_DIFFUSER],
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
