/**
 * Bath & Body Works — 23 Fine Fragrance Mists + 1 Gift Set (no shades, no images).
 * Sources: bathandbodyworks.in, go-upc.com, samawa.ae, bathandbodyworks.com
 * Skipped: 667659376612 (not found in public DBs; duplicate in user list)
 * Usage: npx tsx scripts/add-bbw-mists-batch24-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PERFUME_ID = "975e0e23-edd2-4181-ad6d-ecade6452b95";
const BODY_MIST_SUB = "453c027d-0022-455b-91a9-d4299479ec62";
const CARE_ID = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const BODY_SUB = "23aaaa07-91ee-4937-847e-d7866a9e937a";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  categoryId: string;
  subcategoryId: string;
};

const mistDesc = (scentAr: string, scentEn: string, smellAr: string, smellEn: string, notesAr: string, notesEn: string) => ({
  descriptionAr:
    `بخاخ معطر للجسم من باث آند بودي ووركس برائحة ${scentAr}، يمنح البشرة عطراً خفيفاً منعشاً وسهل التركيب مع منتجات أخرى.\n\n` +
    `• رائحة: ${smellAr}.\n• نوتات: ${notesAr}.\n` +
    `• تركيبة خفيفة تُغطّي الجسم برائحة متوازنة.\n• خالٍ من parabens ومختبر dermatologically.\n` +
    `• مناسب للاستخدام اليومي على الجسم والملابس.\n• 236 مل (8 fl oz).`,
  descriptionEn:
    `Bath & Body Works ${scentEn} Fine Fragrance Mist — ${smellEn}.\n\n` +
    `• Fragrance notes: ${notesEn}.\n` +
    `• Lightweight, layerable body mist with great coverage.\n• Made without parabens; dermatologist tested.\n` +
    `• Ideal for daily use on skin or clothes.\n• 236 ml (8 fl oz).`,
});

const PRODUCTS: ProductDef[] = [
  {
    barcode: "667659363933",
    slug: "bbw-always-and-forever-gift-set-3-pcs",
    sku: "BBW-363933",
    price: 38000,
    nameAr: "باث آند بودي ووركس - طقم هدايا Always & Forever (3 قطع)",
    nameEn: "Bath & Body Works - Always & Forever Gift Set (3 Pieces)",
    descriptionAr:
      "طقم عناية بالجسم من باث آند بودي ووركس برائحة Always & Forever، يتضمن 3 منتجات كاملة الحجم في علبة هدايا أنيقة.\n\n" +
      "• المحتويات: غسول جسم 295 مل + كريم جسم 226 جم + بخاخ معطر 236 مل.\n" +
      "• رائحة: حب حلو ومريح يدوم.\n• نوتات: فلفل وردي لامع، ورد أبيض وخشب الصندل الناعم.\n" +
      "• مناسب كهدية فاخرة للمناسبات والأعياد.\n• صنع في الولايات المتحدة الأمريكية.",
    descriptionEn:
      "Bath & Body Works Always & Forever Gift Set — a sweet, comforting kind of love.\n\n" +
      "• Includes: Body Wash 295 ml + Body Cream 226 g + Fine Fragrance Mist 236 ml.\n" +
      "• Fragrance notes: pearlized pink pepper, white roses and sheer sandalwood.\n" +
      "• Arranged in a decorative gift box with handle and bow.\n• Full-size products; made in the USA.",
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
  },
  {
    barcode: "667659337200",
    slug: "bbw-loyal-to-you-fine-fragrance-mist-236ml",
    sku: "BBW-337200",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Loyal To You 236 مل",
    nameEn: "Bath & Body Works - Loyal To You Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Loyal To You",
      "Loyal To You",
      "مكان دافئ ومريح لا تنتظر العودة إليه",
      "a warm, comforting place you can't wait to return to",
      "زهر الليمون الحلو، زهر البرتقال وmarshmallow الفانيليا",
      "sweet lemon blossom, orange flower and vanilla marshmallow",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667659337217",
    slug: "bbw-guilty-as-fig-fine-fragrance-mist-236ml",
    sku: "BBW-337217",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Guilty As Fig 236 مل",
    nameEn: "Bath & Body Works - Guilty As Fig Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Guilty As Fig",
      "Guilty As Fig",
      "تجربة حية من الفاكهة المرحة والزهور المتفتحة",
      "a vivid, vibrant experience of playful fruit and blooming florals",
      "رحيق التين، ياسmin فاخر ومسk كريمي",
      "fig nectar, lush jasmine and creamy musk",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667659390823",
    slug: "bbw-inner-angel-fine-fragrance-mist-236ml",
    sku: "BBW-390823",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Inner Angel 236 مل",
    nameEn: "Bath & Body Works - Inner Angel Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Inner Angel",
      "Inner Angel",
      "كوكتيل خريفي حلو ومتبل بعد يوم طويل",
      "unwinding after a long day with a lightly sweet and perfectly spiced fall cocktail",
      "cognac التفاح المتبل، tonka bean وpraline دافئ",
      "spiced apple cognac, tonka bean and warm praline",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667659390847",
    slug: "bbw-free-as-a-flower-fine-fragrance-mist-236ml",
    sku: "BBW-390847",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Free As A Flower 236 مل",
    nameEn: "Bath & Body Works - Free As A Flower Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Free As A Flower",
      "Free As A Flower",
      "تجول في حديقة زهور عطرة في ظهيرة مشمسة",
      "frolicking through a fragrant flower garden on a sunlit afternoon",
      "زهر البرتقال البري، لavender مشرق وvetiver كريمي",
      "wild orange flower, bright lavender and creamy vetiver",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667556709629",
    slug: "bbw-midnight-amber-glow-fine-fragrance-mist-236ml",
    sku: "BBW-709629",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Midnight Amber Glow 236 مل",
    nameEn: "Bath & Body Works - Midnight Amber Glow Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Midnight Amber Glow",
      "Midnight Amber Glow",
      "أمسية خريفية دافئة مع مشروب ليلي غني",
      "winding down with a warm nightcap on a chilly fall night—rich, cozy and sweet",
      "عنبر ناعم، latte الكaramil وفانيليا bourbon",
      "smooth amber, caramel latte and vanilla bourbon",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667659346615",
    slug: "bbw-warm-vanilla-sugar-fine-fragrance-mist-236ml",
    sku: "BBW-346615",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Warm Vanilla Sugar 236 مل",
    nameEn: "Bath & Body Works - Warm Vanilla Sugar Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Warm Vanilla Sugar",
      "Warm Vanilla Sugar",
      "دفء الفانيليا والسكر كعناق دافئ",
      "the world's coziest hug in a bottle",
      "فانيليا فاتنة، أورchid أبيض، سكر لامع، ياسمين طازج وصندalwood كريمي",
      "intoxicating vanilla, white orchid, sparkling sugar, fresh jasmine and creamy sandalwood",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667559289470",
    slug: "bbw-vanilla-romance-fine-fragrance-mist-236ml",
    sku: "BBW-289470",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Vanilla Romance 236 مل",
    nameEn: "Bath & Body Works - Vanilla Romance Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Vanilla Romance",
      "Vanilla Romance",
      "رسالة حب إلى الفانيليا الخالدة",
      "a love letter to a trending yet timeless ingredient",
      "هيل طازج، فانيليا مطلقة وأخشاب آسرة",
      "fresh cardamom, vanilla absolute and captivating woods",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667659333608",
    slug: "bbw-bahamas-passionfruit-banana-flower-fine-fragrance-mist-236ml",
    sku: "BBW-333608",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Bahamas Passionfruit & Banana Flower 236 مل",
    nameEn: "Bath & Body Works - Bahamas Passionfruit & Banana Flower Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Bahamas Passionfruit & Banana Flower",
      "Bahamas Passionfruit & Banana Flower",
      "عطلة استوائية مشمسة على شاطئ البهاما",
      "a sunny tropical escape to the Bahamas",
      "passionfruit، أوراق الأnanas وزهر الموز",
      "passionfruit, pineapple leaves and banana flower",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667659320165",
    slug: "bbw-in-the-sun-fine-fragrance-mist-236ml",
    sku: "BBW-320165",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم In The Sun 236 مل",
    nameEn: "Bath & Body Works - In The Sun Fine Fragrance Mist 236ml",
    ...mistDesc(
      "In The Sun",
      "In The Sun",
      "يوم مشمس مشرق مليء بالدفء والإشراق",
      "a bright, sunlit day full of warmth and glow",
      "neroli مشمس، برتقال لامع، ياسمين أبيض، صندalwood ومسk",
      "sunkissed neroli, sparkling orange, white jasmine, sandalwood and musk",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667557061429",
    slug: "bbw-warm-vanilla-sugar-fine-fragrance-mist-236ml-v2",
    sku: "BBW-061429",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Warm Vanilla Sugar 236 مل",
    nameEn: "Bath & Body Works - Warm Vanilla Sugar Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Warm Vanilla Sugar",
      "Warm Vanilla Sugar",
      "دفء الفانيليا والسكر كعناق دافئ",
      "the world's coziest hug in a bottle",
      "فانيليا فاتنة، أورchid أبيض، سكر لامع، ياسمين طازج وصندalwood كريمي",
      "intoxicating vanilla, white orchid, sparkling sugar, fresh jasmine and creamy sandalwood",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667659354344",
    slug: "bbw-pistachio-glaze-fine-fragrance-mist-236ml",
    sku: "BBW-354344",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Pistachio Glaze 236 مل",
    nameEn: "Bath & Body Works - Pistachio Glaze Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Pistachio Glaze",
      "Pistachio Glaze",
      "حلوى مخبز فاخرة لا تقاوم",
      "a specialty bakery confection you can't help but crave",
      "كريمة الفستق، فانيليا محمصة وpatchouli مُرشوش بالسكر",
      "pistachio crème, toasted vanilla and sugared patchouli",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667659349241",
    slug: "bbw-into-the-night-fine-fragrance-mist-236ml",
    sku: "BBW-349241",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Into The Night 236 مل",
    nameEn: "Bath & Body Works - Into The Night Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Into The Night",
      "Into The Night",
      "أمسية جريئة ورومانسية",
      "a bold, romantic evening fragrance",
      "توت أسود، بلورات عنبر، بتلات ورد مخملية، patchouli كريمي وmocha musk",
      "raspberry noir, amber crystals, velvety rose petals, creamy patchouli and mocha musk",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667559278023",
    slug: "bbw-paris-amour-fine-fragrance-mist-236ml",
    sku: "BBW-278023",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Paris Amour 236 مل",
    nameEn: "Bath & Body Works - Paris Amour Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Paris Amour",
      "Paris Amour",
      "نزهة رومانسية في باريس مع لمسة شampán وردي",
      "a dreamy blend of French tulips with a pop of pink champagne",
      "tulip فرنسي، زهر التفاح، شampán وردي، صندalwood ومسk كريمي",
      "French tulips, apple blossoms, sparkling pink champagne, sandalwood and creamy musk",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667659383177",
    slug: "bbw-in-the-stars-fine-fragrance-mist-236ml",
    sku: "BBW-383177",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم In The Stars 236 مل",
    nameEn: "Bath & Body Works - In The Stars Fine Fragrance Mist 236ml",
    ...mistDesc(
      "In The Stars",
      "In The Stars",
      "سماء ليلية مشرقة وجميلة",
      "a bright, beautiful night sky",
      "starflower، musk صندalwood، tangelo مُحلى، agarwood أبيض وعنبر مشع",
      "starflower, sandalwood musk, sugared tangelo, white agarwood and radiant amber",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667659325054",
    slug: "bbw-japanese-cherry-blossom-fine-fragrance-mist-236ml",
    sku: "BBW-325054",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Japanese Cherry Blossom 236 مل",
    nameEn: "Bath & Body Works - Japanese Cherry Blossom Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Japanese Cherry Blossom",
      "Japanese Cherry Blossom",
      "زهور الكرز اليابانية في أوج الإزهار",
      "a floral fantasy of cherry blossoms in full bloom",
      "زهر الكرز الياباني، كمثرى آسيوية، بتلات mimosa، ياسمين أبيض وصندalwood وردي",
      "Japanese cherry blossom, Asian pear, fresh mimosa petals, white jasmine and blushing sandalwood",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667659357185",
    slug: "bbw-perfect-in-pink-fine-fragrance-mist-236ml",
    sku: "BBW-357185",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Perfect In Pink 236 مل",
    nameEn: "Bath & Body Works - Perfect In Pink Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Perfect In Pink",
      "Perfect In Pink",
      "أنثوي ورقيق باللون الوردي",
      "pretty in pink and perfectly feminine",
      "كرز نابض بالحياة، camellia وردي وكريمة لوز مخفوقة",
      "vibrant cherries, pink camellia and whipped almond crème",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667659357093",
    slug: "bbw-vanilla-bean-noel-fine-fragrance-mist-236ml",
    sku: "BBW-357093",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Vanilla Bean Noel 236 مل",
    nameEn: "Bath & Body Works - Vanilla Bean Noel Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Vanilla Bean Noel",
      "Vanilla Bean Noel",
      "دفء الشتاء بحلوى الفانيليا والكaramil",
      "a cozy winter treat of vanilla and caramel",
      "فانيليا طازجة، كaramil دافئ، كوكيز، كريمة مخفوقة ومسk ثلجي",
      "fresh vanilla bean, warm caramel, sugar cookies, whipped cream and snow-kissed musk",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667559116509",
    slug: "bbw-butterfly-fine-fragrance-mist-236ml",
    sku: "BBW-116509",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Butterfly 236 مل",
    nameEn: "Bath & Body Works - Butterfly Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Butterfly",
      "Butterfly",
      "رحلة ملهمة عبر هواء ربيعي زهري حلو",
      "an inspiring flight through sweet, floral spring air",
      "رحيق التوت، بتلات iris وفانيليا هوائية",
      "raspberry nectar, iris petals and airy vanilla",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667559302865",
    slug: "bbw-platinum-fine-fragrance-mist-236ml",
    sku: "BBW-302865",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Platinum 236 مل",
    nameEn: "Bath & Body Works - Platinum Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Platinum",
      "Platinum",
      "أجواء آسرة لا تستطيع مقاومتها",
      "a mesmerizing vibe you can't help but be drawn to",
      "bergamot لامع، زهور فضية وpatchouli musk",
      "sparkling bergamot, silver blooms and patchouli musk",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667659320578",
    slug: "bbw-pink-cashmere-fine-fragrance-mist-236ml",
    sku: "BBW-320578",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Pink Cashmere 236 مل",
    nameEn: "Bath & Body Works - Pink Cashmere Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Pink Cashmere",
      "Pink Cashmere",
      "مزيج ناعم دافئ وم inviting",
      "a smooth, delicate blend of warm and inviting",
      "ياسmin وردي، musk كashmere، صندalwood كريمي وعنبر أبيض",
      "pink jasmine, cashmere musk, creamy sandalwood and white amber",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667541343913",
    slug: "bbw-freesia-fine-fragrance-mist-236ml",
    sku: "BBW-343913",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Freesia 236 مل",
    nameEn: "Bath & Body Works - Freesia Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Freesia",
      "Freesia",
      "مزيج زهري أنيق ومرح",
      "a playful, elegant floral blend",
      "freesia، hyacinth كريمي ومسk أبيض",
      "freesia, creamy hyacinth and white musk",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "667556039047",
    slug: "bbw-dark-kiss-fine-fragrance-mist-236ml",
    sku: "BBW-039047",
    price: 10500,
    nameAr: "باث آند بودي ووركس - بخاخ معطر للجسم Dark Kiss 236 مل",
    nameEn: "Bath & Body Works - Dark Kiss Fine Fragrance Mist 236ml",
    ...mistDesc(
      "Dark Kiss",
      "Dark Kiss",
      "مزيج رومانسي داكن وفاتن",
      "a dark, romantic blend that's utterly irresistible",
      "توت أسود، ورد burgundy، بخور bergamot، فانيليا داكنة ومسk البرقوق",
      "black raspberry, burgundy rose, bergamot incense, dark vanilla bean and plum musk",
    ),
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
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
  token =
    (json as { data?: { accessToken?: string }; accessToken?: string }).data?.accessToken ??
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
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      subcategoryIds: [product.subcategoryId],
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
