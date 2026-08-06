/**
 * Bath & Body Works — 43 separate body-care products (no shades, no images).
 * Sources: bathandbodyworks.in, go-upc.com, samawa.ae, springs.com.pk, beautyhub.com.bd
 * Note: 667559299905 & 667559299974 could not be verified in public DBs; mapped to Country Chic wash/lotion pair.
 * Usage: npx tsx scripts/add-bbw-bodycare-batch42-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE_ID = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const BODY_SUB = "23aaaa07-91ee-4937-847e-d7866a9e937a";
const BODY_WASH_TERT = "35be991e-3062-4fbd-8f0a-2393bf806524";
const BODY_LOTION_TERT = "fcd86b22-a0fd-47b9-ba4c-c76164dadab2";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  tertiaryCategoryId: string;
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "667558533987",
    slug: "bbw-warm-vanilla-sugar-daily-nourishing-body-lotion-236ml",
    sku: "BBW-533987",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم Warm Vanilla Sugar 236 مل",
    nameEn: "Bath & Body Works - Warm Vanilla Sugar Daily Nourishing Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة Warm Vanilla Sugar، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: دفء الفانيليا والسكر الدافئ.\n• نوتات: فانيليا، أورchid أبيض، سكر لامع، ياسمين طازج وصندalwood كريمي.\n• ترطيب 48 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works Warm Vanilla Sugar Daily Nourishing Body Lotion — the world's coziest hug in a bottle.\n\n• Fragrance notes: vanilla, white orchid, sparkling sugar, fresh jasmine and creamy sandalwood.\n• Provides 48 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667659353286",
    slug: "bbw-gingham-daily-nourishing-body-lotion-236ml",
    sku: "BBW-353286",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم Gingham 236 مل",
    nameEn: "Bath & Body Works - Gingham Daily Nourishing Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة Gingham، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: مزيج مرح من السماء الزرقاء وربيع منعش.\n• نوتات: فreesia زرقاء، خوخ أبيض، بنفسج ومسk نظيف.\n• ترطيب 48 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works Gingham Daily Nourishing Body Lotion — a free-spirited blend of blue skies and springtime.\n\n• Fragrance notes: blue freesia, white peach, violet and clean musk.\n• Provides 48 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667557479699",
    slug: "bbw-dark-kiss-super-smooth-body-lotion-236ml",
    sku: "BBW-479699",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم Dark Kiss 236 مل",
    nameEn: "Bath & Body Works - Dark Kiss Super Smooth Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة Dark Kiss، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: مزيج رومانسي داكن وفاتن.\n• نوتات: توت داكن، ياسمين ليلي، فانيليا وصندalwood.\n• ترطيب 24 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works Dark Kiss Super Smooth Body Lotion — a dark, romantic blend that's utterly irresistible.\n\n• Fragrance notes: dark berries, night-blooming jasmine, vanilla and sandalwood.\n• Provides 24 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667559302896",
    slug: "bbw-platinum-daily-nourishing-body-lotion-236ml",
    sku: "BBW-302896",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم Platinum 236 مل",
    nameEn: "Bath & Body Works - Platinum Daily Nourishing Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة Platinum، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: نظيف وواثق وأنيق.\n• نوتات: مسk platinum، لavender وعنبر.\n• ترطيب 48 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works Platinum Daily Nourishing Body Lotion — clean, confident and effortlessly cool.\n\n• Fragrance notes: platinum musk, lavender and amber.\n• Provides 48 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667555531122",
    slug: "bbw-happy-vibes-body-wash-295ml",
    sku: "BBW-531122",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم Happy Vibes 295 مل",
    nameEn: "Bath & Body Works - Happy Vibes Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة Happy Vibes، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: سعادة خالصة في زجاجة.\n• نوتات: sorbet قوس قزح، أشعة الشمس ومسk حلو.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works Happy Vibes Body Wash — pure happiness in a bottle.\n\n• Fragrance notes: rainbow sorbet, sunshine and sweet musk.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  {
    barcode: "667554975620",
    slug: "bbw-love-sunshine-body-wash-295ml",
    sku: "BBW-975620",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم Love Sunshine 295 مل",
    nameEn: "Bath & Body Works - Love Sunshine Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة Love Sunshine، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: يوم مشمس مشرق مليء بالحب.\n• نوتات: ليمون لامع، زنبق مائي ومسk خفيف.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works Love Sunshine Body Wash — a bright, sunny day full of love.\n\n• Fragrance notes: sparkling lemon, water lily and sheer musk.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  {
    barcode: "667558205112",
    slug: "bbw-in-the-stars-daily-nourishing-body-lotion-236ml",
    sku: "BBW-205112",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم In The Stars 236 مل",
    nameEn: "Bath & Body Works - In The Stars Daily Nourishing Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة In The Stars، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: سماء ليلية مشرقة وجميلة.\n• نوتات: زهرة النجوم، agarwood، tangelo وعنبر.\n• ترطيب 48 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works In The Stars Daily Nourishing Body Lotion — a bright, beautiful night sky.\n\n• Fragrance notes: starflower, agarwood, tangelo and amber.\n• Provides 48 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667659359400",
    slug: "bbw-a-thousand-wishes-daily-nourishing-body-lotion-236ml",
    sku: "BBW-359400",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم A Thousand Wishes 236 مل",
    nameEn: "Bath & Body Works - A Thousand Wishes Daily Nourishing Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة A Thousand Wishes، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: احتفال حلو يدفئ القلب.\n• نوتات: سفرjل لامع، peonies بلورية، عنبر ذهبي وكريمة amaretto.\n• ترطيب 48 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works A Thousand Wishes Daily Nourishing Body Lotion — a sweet, heart-warming celebration.\n\n• Fragrance notes: sparkling quince, crystal peonies, gilded amber and amaretto crème.\n• Provides 48 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667559118756",
    slug: "bbw-japanese-cherry-blossom-daily-nourishing-body-lotion-236ml",
    sku: "BBW-118756",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم Japanese Cherry Blossom 236 مل",
    nameEn: "Bath & Body Works - Japanese Cherry Blossom Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة Japanese Cherry Blossom، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: زهور الكرز اليابانية في أوج الإزهار.\n• نوتات: زهور الكرز، كمثرى آسيوية وصندalwood.\n• ترطيب 24 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works Japanese Cherry Blossom Body Lotion — a floral fantasy of cherry blossoms in full bloom.\n\n• Fragrance notes: cherry blossoms, Asian pear and sandalwood.\n• Provides 24 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667559304241",
    slug: "bbw-perfect-in-pink-body-wash-295ml",
    sku: "BBW-304241",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم Perfect In Pink 295 مل",
    nameEn: "Bath & Body Works - Perfect In Pink Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة Perfect In Pink، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: أنثوي ورقيق باللون الوردي.\n• نوتات: كشمish وردي، peony بري وعنبر أبيض.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works Perfect In Pink Body Wash — pretty in pink and perfectly feminine.\n\n• Fragrance notes: pink currant, wild peony and white amber.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  {
    barcode: "667659311606",
    slug: "bbw-warm-vanilla-sugar-body-wash-295ml",
    sku: "BBW-311606",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم Warm Vanilla Sugar 295 مل",
    nameEn: "Bath & Body Works - Warm Vanilla Sugar Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة Warm Vanilla Sugar، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: دفء الفانيليا والسكر الدافئ.\n• نوتات: فانيليا، أورchid أبيض، سكر لامع، ياسمين طازج وصندalwood كريمي.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works Warm Vanilla Sugar Body Wash — the world's coziest hug in a bottle.\n\n• Fragrance notes: vanilla, white orchid, sparkling sugar, fresh jasmine and creamy sandalwood.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  {
    barcode: "667659320738",
    slug: "bbw-pink-cashmere-body-wash-295ml",
    sku: "BBW-320738",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم Pink Cashmere 295 مل",
    nameEn: "Bath & Body Works - Pink Cashmere Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة Pink Cashmere، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: ناعم ومريح وفاخر.\n• نوتات: بتلات ناعمة، عنبر دافئ وصندalwood كريمي.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works Pink Cashmere Body Wash — soft, cozy and luxurious.\n\n• Fragrance notes: soft petals, warm amber and creamy sandalwood.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  {
    barcode: "667659334896",
    slug: "bbw-sweetheart-cherry-body-wash-295ml",
    sku: "BBW-334896",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم Sweetheart Cherry 295 مل",
    nameEn: "Bath & Body Works - Sweetheart Cherry Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة Sweetheart Cherry، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: مفاجأة حلوة من معجب سري.\n• نوتات: كرز بري، فستق مطحون وفانيليا مخفوقة.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works Sweetheart Cherry Body Wash — a sweet surprise from a secret admirer.\n\n• Fragrance notes: wild cherry, crushed pistachio and whipped vanilla.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  {
    barcode: "667558513149",
    slug: "bbw-pure-wonder-daily-nourishing-body-lotion-236ml",
    sku: "BBW-513149",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم Pure Wonder 236 مل",
    nameEn: "Bath & Body Works - Pure Wonder Daily Nourishing Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة Pure Wonder، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: مزيج حالم من الزهور الناعمة والأخشاب الدافئة.\n• نوتات: كمثرى جليدية، ياسمين نجمي، عنبر وأخشاب كashmere.\n• ترطيب 48 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works Pure Wonder Daily Nourishing Body Lotion — a dreamy blend of soft florals and warm woods.\n\n• Fragrance notes: ice pear, star jasmine, amber and cashmere woods.\n• Provides 48 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667659319930",
    slug: "bbw-in-the-stars-body-wash-295ml",
    sku: "BBW-319930",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم In The Stars 295 مل",
    nameEn: "Bath & Body Works - In The Stars Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة In The Stars، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: سماء ليلية مشرقة وجميلة.\n• نوتات: زهرة النجوم، agarwood، tangelo وعنبر.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works In The Stars Body Wash — a bright, beautiful night sky.\n\n• Fragrance notes: starflower, agarwood, tangelo and amber.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  {
    barcode: "667659311750",
    slug: "bbw-youre-the-one-body-wash-295ml",
    sku: "BBW-311750",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم You're The One 295 مل",
    nameEn: "Bath & Body Works - You're The One Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة You're The One، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: العطر الذي كنت تنتظره.\n• نوتات: ورد، geranium أبيض ورذاذ ربيعي.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works You're The One Body Wash — the one you've been waiting for.\n\n• Fragrance notes: rose, white geranium and springtime spritzer.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  {
    barcode: "667559109846",
    slug: "bbw-butterfly-body-wash-295ml",
    sku: "BBW-109846",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم Butterfly 295 مل",
    nameEn: "Bath & Body Works - Butterfly Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة Butterfly، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: خفيف ومنعش وحر كالفراشة.\n• نوتات: زهر الأرز، حليب جوز الهند، فانيليا وصندalwood.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works Butterfly Body Wash — light, airy and beautifully free.\n\n• Fragrance notes: rice flower, coconut milk, vanilla and sandalwood.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  {
    barcode: "667559286035",
    slug: "bbw-a-thousand-wishes-body-wash-295ml",
    sku: "BBW-286035",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم A Thousand Wishes 295 مل",
    nameEn: "Bath & Body Works - A Thousand Wishes Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة A Thousand Wishes، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: احتفال حلو يدفئ القلب.\n• نوتات: سفرjل لامع، peonies بلورية، عنبر ذهبي وكريمة amaretto.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works A Thousand Wishes Body Wash — a sweet, heart-warming celebration.\n\n• Fragrance notes: sparkling quince, crystal peonies, gilded amber and amaretto crème.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  {
    barcode: "667559118718",
    slug: "bbw-japanese-cherry-blossom-body-wash-295ml",
    sku: "BBW-118718",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم Japanese Cherry Blossom 295 مل",
    nameEn: "Bath & Body Works - Japanese Cherry Blossom Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة Japanese Cherry Blossom، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: زهور الكرز اليابانية في أوج الإزهار.\n• نوتات: زهور الكرز، كمثرى آسيوية وصندalwood.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works Japanese Cherry Blossom Body Wash — a floral fantasy of cherry blossoms in full bloom.\n\n• Fragrance notes: cherry blossoms, Asian pear and sandalwood.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  {
    barcode: "667659342105",
    slug: "bbw-into-the-night-body-wash-295ml",
    sku: "BBW-342105",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم Into The Night 295 مل",
    nameEn: "Bath & Body Works - Into The Night Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة Into The Night، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: عطر مسائي جريء ورومانسي.\n• نوتات: توت داكن، ياسمين ليلي، فانيليا غنية وعنبر.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works Into The Night Body Wash — a bold, romantic evening fragrance.\n\n• Fragrance notes: dark berries, night-blooming jasmine, rich vanilla and amber.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  {
    barcode: "667659320714",
    slug: "bbw-pink-tie-dye-body-wash-295ml",
    sku: "BBW-320714",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم Pink Tie Dye 295 مل",
    nameEn: "Bath & Body Works - Pink Tie Dye Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة Pink Tie Dye، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: يوم مشرق وسعيد حيث كل شيء ممكن.\n• نوتات: تفاح عصيري، lotus مائي وزهر قطن.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works Pink Tie Dye Body Wash — a bright, happy day where anything can happen.\n\n• Fragrance notes: juicy apple, water lotus and cotton blossom.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  {
    barcode: "667659320721",
    slug: "bbw-pink-watermelon-blast-body-wash-295ml",
    sku: "BBW-320721",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم Pink Watermelon Blast 295 مل",
    nameEn: "Bath & Body Works - Pink Watermelon Blast Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة Pink Watermelon Blast، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: انفجار منعش من الفاكهة الحلوة ينعش يومك.\n• نوتات: بطيخ وردي عصيري، زهر الفراولة المُحلى وقشر اللime.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works Pink Watermelon Blast Body Wash — a bold burst of fresh, sweet fruit that brightens your day.\n\n• Fragrance notes: juicy pink watermelon, sugared strawberry blossoms and lime zest.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  { // barcode ID unverified — best-effort scent match
    barcode: "667559299905",
    slug: "bbw-country-chic-body-wash-295ml",
    sku: "BBW-299905",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم Country Chic 295 مل",
    nameEn: "Bath & Body Works - Country Chic Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة Country Chic، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: هروب إلى ريف زهري منعش.\n• نوتات: ليمون لامع، marigold دافئ، دوار الشمس الذهبي، زهر البرتقال وخشب العنبر.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works Country Chic Body Wash — a fresh, bright floral countryside escape.\n\n• Fragrance notes: sparkling lemon, warm marigold, golden sunflower, orange blossom and amber wood.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  {
    barcode: "667559290070",
    slug: "bbw-vanilla-romance-body-wash-295ml",
    sku: "BBW-290070",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم Vanilla Romance 295 مل",
    nameEn: "Bath & Body Works - Vanilla Romance Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة Vanilla Romance، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: رسالة حب إلى الفانيليا الخالدة.\n• نوتات: هيل طازج، فانيليا مطلقة وأخشاب آسرة.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works Vanilla Romance Body Wash — a love letter to a trending yet timeless ingredient.\n\n• Fragrance notes: fresh cardamom, vanilla absolute and captivating woods.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  {
    barcode: "667659349234",
    slug: "bbw-into-the-night-daily-nourishing-body-lotion-236ml",
    sku: "BBW-349234",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم Into The Night 236 مل",
    nameEn: "Bath & Body Works - Into The Night Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة Into The Night، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: عطر مسائي جريء ورومانسي.\n• نوتات: توت داكن، ياسمين ليلي، فانيليا غنية وعنبر.\n• ترطيب 24 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works Into The Night Body Lotion — a bold, romantic evening fragrance.\n\n• Fragrance notes: dark berries, night-blooming jasmine, rich vanilla and amber.\n• Provides 24 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667659357062",
    slug: "bbw-snowflakes-and-cashmere-daily-nourishing-body-lotion-236ml",
    sku: "BBW-357062",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم Snowflakes & Cashmere 236 مل",
    nameEn: "Bath & Body Works - Snowflakes & Cashmere Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة Snowflakes & Cashmere، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: عناق شتوي دافئ ومريح.\n• نوتات: فانيليا، كashmere وتوت بري متجمد.\n• ترطيب 24 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works Snowflakes & Cashmere Body Lotion — a cozy winter embrace.\n\n• Fragrance notes: vanilla, cashmere and frosted cranberry.\n• Provides 24 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667559278221",
    slug: "bbw-paris-amour-body-wash-295ml",
    sku: "BBW-278221",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم Paris Amour 295 مل",
    nameEn: "Bath & Body Works - Paris Amour Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة Paris Amour، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: نزهة رومانسية في باريس.\n• نوتات: تulip فرنسي، زهر التفاح، شampán وردي، صندalwood ومسk كريمي.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works Paris Amour Body Wash — a romantic stroll through the City of Love.\n\n• Fragrance notes: French tulips, apple blossoms, sparkling pink champagne, sandalwood and creamy musk.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  {
    barcode: "667659410255",
    slug: "bbw-touch-of-gold-daily-nourishing-body-lotion-236ml",
    sku: "BBW-410255",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم Touch of Gold 236 مل",
    nameEn: "Bath & Body Works - Touch of Gold Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة Touch of Gold، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: هالتك الذهبية في زجاجة عطر.\n• نوتات: توت أسود مشرق، زهر البرتقال الذهبي وتonka فاخر.\n• ترطيب 24 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works Touch of Gold Body Lotion — your aura, all bottled up in a fragrance.\n\n• Fragrance notes: bright blackberries, golden orange blossom and decadent tonka.\n• Provides 24 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667659320806",
    slug: "bbw-pink-watermelon-blast-daily-nourishing-body-lotion-236ml",
    sku: "BBW-320806",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم Pink Watermelon Blast 236 مل",
    nameEn: "Bath & Body Works - Pink Watermelon Blast Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة Pink Watermelon Blast، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: انفجار منعش من الفاكهة الحلوة ينعش يومك.\n• نوتات: بطيخ وردي عصيري، زهر الفراولة المُحلى وقشر اللime.\n• ترطيب 24 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works Pink Watermelon Blast Body Lotion — a bold burst of fresh, sweet fruit that brightens your day.\n\n• Fragrance notes: juicy pink watermelon, sugared strawberry blossoms and lime zest.\n• Provides 24 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667659311798",
    slug: "bbw-youre-the-one-daily-nourishing-body-lotion-236ml",
    sku: "BBW-311798",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم You're The One 236 مل",
    nameEn: "Bath & Body Works - You're The One Daily Nourishing Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة You're The One، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: العطر الذي كنت تنتظره.\n• نوتات: ورد، geranium أبيض ورذاذ ربيعي.\n• ترطيب 48 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works You're The One Daily Nourishing Body Lotion — the one you've been waiting for.\n\n• Fragrance notes: rose, white geranium and springtime spritzer.\n• Provides 48 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667659376889",
    slug: "bbw-dream-bright-moisturizing-body-wash-295ml",
    sku: "BBW-376889",
    price: 12000,
    tertiaryCategoryId: BODY_WASH_TERT,
    nameAr: "باث آند بودي ووركس - غسول جسم Dream Bright 295 مل",
    nameEn: "Bath & Body Works - Dream Bright Moisturizing Body Wash 295ml",
    descriptionAr: "غسول جسم من باث آند بودي ووركس برائحة Dream Bright، ينظف البشرة بلطف ويتركها معطرة وناعمة.\n\n• رائحة: حلم عطري زهري وفاكهي يتحقق.\n• نوتات: توت safir، orchid ليلي وفانيليا متبلورة.\n• تركيبة مرطبة بزبدة الشيا وزيت جوز الهند.\n• يُرطّب البشرة من أول استحمام.\n• رغوة غنية ومنعشة.\n• مُعزّز بفيتامين E وAloe Vera.\n• خالٍ من الكبريتات والparabens.\n• مختبر dermatologically.\n• 295 مل (10 fl oz).",
    descriptionEn: "Bath & Body Works Dream Bright Body Wash — a floral-fruity fragrance dream come true.\n\n• Fragrance notes: sapphire berries, night-blooming orchid and crystallized vanilla.\n• Moisturizing formula with shea butter and coconut oil.\n• Clinically tested to moisturize after one shower.\n• Rich, bubbly lather gently cleanses without drying.\n• Infused with vitamin E and aloe.\n• Dermatologist tested.\n• 295 ml (10 fl oz).",
  },
  {
    barcode: "667559278351",
    slug: "bbw-paris-amour-daily-nourishing-body-lotion-236ml",
    sku: "BBW-278351",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم Paris Amour 236 مل",
    nameEn: "Bath & Body Works - Paris Amour Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة Paris Amour، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: نزهة رومانسية في باريس.\n• نوتات: تulip فرنسي، زهر التفاح، شampán وردي، صندalwood ومسk كريمي.\n• ترطيب 24 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works Paris Amour Body Lotion — a romantic stroll through the City of Love.\n\n• Fragrance notes: French tulips, apple blossoms, sparkling pink champagne, sandalwood and creamy musk.\n• Provides 24 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667659320813",
    slug: "bbw-pink-cashmere-daily-nourishing-body-lotion-236ml",
    sku: "BBW-320813",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم Pink Cashmere 236 مل",
    nameEn: "Bath & Body Works - Pink Cashmere Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة Pink Cashmere، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: ناعم ومريح وفاخر.\n• نوتات: بتلات ناعمة، عنبر دافئ وصندalwood كريمي.\n• ترطيب 24 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works Pink Cashmere Body Lotion — soft, cozy and luxurious.\n\n• Fragrance notes: soft petals, warm amber and creamy sandalwood.\n• Provides 24 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667556605334",
    slug: "bbw-sea-island-shore-body-cream-226g",
    sku: "BBW-605334",
    price: 14000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - كريم جسم Sea Island Shore 226 جم",
    nameEn: "Bath & Body Works - Sea Island Shore Body Cream 226g",
    descriptionAr: "كريم ترطيب فائق للجسم من باث آند بودي ووركس برائحة Sea Island Shore.\n\n• رائحة: نسيم جزيرة استوائية.\n• نوتات: ملح البحر، ماء جوز الهند وزهر الشاطئ.\n• ترطيب لمدة 24 ساعة.\n• غني بزبدة الشيا وزبدة الكakao.\n• تركيبة Ultra Shea ناعمة وسريعة الامتصاص.\n• 226 جم (8 oz).",
    descriptionEn: "Bath & Body Works Sea Island Shore Body Cream — a breezy day on a tropical island.\n\n• Fragrance notes: sea salt, coconut water and beach flower.\n• 24-hour moisture with shea and cocoa butters.\n• Rich, non-greasy Ultra Shea formula.\n• 226 g (8 oz).",
  },
  {
    barcode: "667558534502",
    slug: "bbw-warm-vanilla-sugar-ultimate-hydration-body-cream-226g",
    sku: "BBW-534502",
    price: 14000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - كريم جسم Warm Vanilla Sugar 226 جم",
    nameEn: "Bath & Body Works - Warm Vanilla Sugar Ultimate Hydration Body Cream 226g",
    descriptionAr: "كريم ترطيب فائق للجسم من باث آند بودي ووركس برائحة Warm Vanilla Sugar.\n\n• رائحة: دفء الفانيليا والسكر الدافئ.\n• نوتات: فانيليا، أورchid أبيض، سكر لامع، ياسمين طازج وصندalwood كريمي.\n• ترطيب لمدة 24 ساعة.\n• غني بزبدة الشيا وزبدة الكakao.\n• تركيبة Ultra Shea ناعمة وسريعة الامتصاص.\n• 226 جم (8 oz).",
    descriptionEn: "Bath & Body Works Warm Vanilla Sugar Ultimate Hydration Body Cream — the world's coziest hug in a bottle.\n\n• Fragrance notes: vanilla, white orchid, sparkling sugar, fresh jasmine and creamy sandalwood.\n• 24-hour moisture with shea and cocoa butters.\n• Rich, non-greasy Ultra Shea formula.\n• 226 g (8 oz).",
  },
  {
    barcode: "667558736036",
    slug: "bbw-frosted-coconut-snowball-ultimate-hydration-body-cream-226g",
    sku: "BBW-736036",
    price: 14000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - كريم جسم Frosted Coconut Snowball 226 جم",
    nameEn: "Bath & Body Works - Frosted Coconut Snowball Ultimate Hydration Body Cream 226g",
    descriptionAr: "كريم ترطيب فائق للجسم من باث آند بودي ووركس برائحة Frosted Coconut Snowball.\n\n• رائحة: حلوى جوز الهند الثلجية.\n• نوتات: جوز هند متجمد، فانيليا وسكر.\n• ترطيب لمدة 24 ساعة.\n• غني بزبدة الشيا وزبدة الكakao.\n• تركيبة Ultra Shea ناعمة وسريعة الامتصاص.\n• 226 جم (8 oz).",
    descriptionEn: "Bath & Body Works Frosted Coconut Snowball Ultimate Hydration Body Cream — a sweet, snowy coconut treat.\n\n• Fragrance notes: frosted coconut, vanilla and sugar.\n• 24-hour moisture with shea and cocoa butters.\n• Rich, non-greasy Ultra Shea formula.\n• 226 g (8 oz).",
  },
  {
    barcode: "667554075535",
    slug: "bbw-clean-slate-ultra-shea-body-cream-men-226g",
    sku: "BBW-075535",
    price: 14000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - كريم جسم للرجال Clean Slate 226 جم",
    nameEn: "Bath & Body Works - Clean Slate Ultra Shea Body Cream (For Men) 226g",
    descriptionAr: "كريم جسم للرجال من باث آند بودي ووركس برائحة Clean Slate.\n\n• رائحة: منعش ونظيف ورجالي بثقة.\n• نوتات: meramiya، bergamot وأرز أبيض.\n• ترطيب لمدة 24 ساعة.\n• غني بزبدة الشيا وزبدة الكakao.\n• تركيبة Ultra Shea ناعمة وسريعة الامتصاص.\n• 226 جم (8 oz).",
    descriptionEn: "Bath & Body Works Clean Slate Ultra Shea Body Cream — fresh, clean and confidently masculine.\n\n• Fragrance notes: sage, bergamot and white cedar.\n• 24-hour moisture with shea and cocoa butters.\n• Rich, non-greasy Ultra Shea formula.\n• 226 g (8 oz).",
  },
  {
    barcode: "667558513187",
    slug: "bbw-pure-wonder-ultimate-hydration-body-cream-226g",
    sku: "BBW-513187",
    price: 14000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - كريم جسم Pure Wonder 226 جم",
    nameEn: "Bath & Body Works - Pure Wonder Ultimate Hydration Body Cream 226g",
    descriptionAr: "كريم ترطيب فائق للجسم من باث آند بودي ووركس برائحة Pure Wonder.\n\n• رائحة: مزيج حالم من الزهور الناعمة والأخشاب الدافئة.\n• نوتات: كمثرى جليدية، ياسمين نجمي، عنبر وأخشاب كashmere.\n• ترطيب لمدة 24 ساعة.\n• غني بزبدة الشيا وزبدة الكakao.\n• تركيبة Ultra Shea ناعمة وسريعة الامتصاص.\n• 226 جم (8 oz).",
    descriptionEn: "Bath & Body Works Pure Wonder Ultimate Hydration Body Cream — a dreamy blend of soft florals and warm woods.\n\n• Fragrance notes: ice pear, star jasmine, amber and cashmere woods.\n• 24-hour moisture with shea and cocoa butters.\n• Rich, non-greasy Ultra Shea formula.\n• 226 g (8 oz).",
  },
  {
    barcode: "667659314218",
    slug: "bbw-magic-in-the-air-daily-nourishing-body-lotion-236ml",
    sku: "BBW-314218",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم Magic in the Air 236 مل",
    nameEn: "Bath & Body Works - Magic in the Air Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة Magic in the Air، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: مزيج ساحر ومتألق.\n• نوتات: شampán متألق، peonies بلورية وكريمة لوز.\n• ترطيب 24 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works Magic in the Air Body Lotion — a sparkling, enchanting blend.\n\n• Fragrance notes: sparkling champagne, crystal peonies and almond crème.\n• Provides 24 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  { // barcode ID unverified — best-effort scent match
    barcode: "667559299974",
    slug: "bbw-country-chic-daily-nourishing-body-lotion-236ml",
    sku: "BBW-299974",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم Country Chic 236 مل",
    nameEn: "Bath & Body Works - Country Chic Daily Nourishing Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة Country Chic، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: هروب إلى ريف زهري منعش.\n• نوتات: ليمون لامع، marigold دافئ، دوار الشمس الذهبي، زهر البرتقال وخشب العنبر.\n• ترطيب 48 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works Country Chic Daily Nourishing Body Lotion — a fresh, bright floral countryside escape.\n\n• Fragrance notes: sparkling lemon, warm marigold, golden sunflower, orange blossom and amber wood.\n• Provides 48 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667558202555",
    slug: "bbw-at-the-beach-daily-nourishing-body-lotion-236ml",
    sku: "BBW-202555",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم At the Beach 236 مل",
    nameEn: "Bath & Body Works - At the Beach Daily Nourishing Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة At the Beach، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: يوم مشمس على الشاطئ.\n• نوتات: frangipani أبيض، حمضيات مائية ومسk جوز الهند.\n• ترطيب 48 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works At the Beach Daily Nourishing Body Lotion — a sunny day at the shore.\n\n• Fragrance notes: white frangipani, watery citrus and coconut musk.\n• Provides 48 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667559290018",
    slug: "bbw-vanilla-romance-daily-nourishing-body-lotion-236ml",
    sku: "BBW-290018",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم Vanilla Romance 236 مل",
    nameEn: "Bath & Body Works - Vanilla Romance Daily Nourishing Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة Vanilla Romance، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: رسالة حب إلى الفانيليا الخالدة.\n• نوتات: هيل طازج، فانيليا مطلقة وأخشاب آسرة.\n• ترطيب 48 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works Vanilla Romance Daily Nourishing Body Lotion — a love letter to a trending yet timeless ingredient.\n\n• Fragrance notes: fresh cardamom, vanilla absolute and captivating woods.\n• Provides 48 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  },
  {
    barcode: "667659357079",
    slug: "bbw-strawberry-snowflakes-daily-nourishing-body-lotion-236ml",
    sku: "BBW-357079",
    price: 12000,
    tertiaryCategoryId: BODY_LOTION_TERT,
    nameAr: "باث آند بودي ووركس - لوشن جسم Strawberry Snowflakes 236 مل",
    nameEn: "Bath & Body Works - Strawberry Snowflakes Body Lotion 236ml",
    descriptionAr: "لوشن جسم من باث آند بودي ووركس برائحة Strawberry Snowflakes، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n• رائحة: حلوى شتوية بنكهة الفراولة.\n• نوتات: فراولة مُرشوشة بالسكر، فانيليا مخفوقة ومسk متجمد.\n• ترطيب 24 ساعة.\n• زيت جوز الهند وزبدة الشيا وفيتامين E.\n• خالٍ من parabens.\n• 236 مل (8 fl oz).",
    descriptionEn: "Bath & Body Works Strawberry Snowflakes Body Lotion — a sweet winter treat.\n\n• Fragrance notes: sugared strawberries, whipped vanilla and iced musk.\n• Provides 24 hours of continuous moisture.\n• Infused with coconut oil, shea butter and vitamin E.\n• Dermatologist tested.\n• 236 ml (8 fl oz).",
  }
];

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Login failed: ${JSON.stringify(json)}`);
  token = (json as { data?: { accessToken?: string }; accessToken?: string }).data?.accessToken ??
    (json as { accessToken?: string }).accessToken ??
    "";
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
      categoryId: CARE_ID,
      subcategoryId: BODY_SUB,
      subcategoryIds: [BODY_SUB],
      tertiaryCategoryId: product.tertiaryCategoryId,
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
