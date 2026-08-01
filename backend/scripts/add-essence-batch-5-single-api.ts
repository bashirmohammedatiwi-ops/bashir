/**
 * Essence — 5 separate barcode products.
 * Sources: haar-shop + makeupcityshop.com
 * Usage: npx tsx scripts/add-essence-batch-5-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";

const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const KAJAL = "c8866117-67e0-4509-a887-60100775524b";
const EYESHADOW = "07f14763-7a8b-4646-a057-8748e2b18bd4";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";
const TOOLS = "c7a90d6f-6fd4-40df-9b02-4cb33b8efce1";
const EYE_BRUSHES = "0ab0d6d2-4550-4b3b-9ac3-91df6e90b70a";

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
  imageUrl: string;
};

const PRODUCTS: ProductInput[] = [
  {
    barcode: "4059729541888",
    slug: "essence-inner-eye-khol-kajal-01-midnight-black",
    price: 2000,
    subcategoryId: EYES,
    tertiaryCategoryId: KAJAL,
    nameAr: "إيسنس - قلم كحل داخلي للعين رقم ٠١ أسود منتصف الليل ١ جم",
    nameEn: "Essence - Inner Eye Khol Kajal 01 Midnight Black 1 g",
    descriptionAr:
      "قلم كحل داخلي للعين من إيسنس — أسود عميق مصمّم لتطبيق دقيق على خط الماء الداخلي.\n\n" +
      "• تركيبة مطفية عالية التصبغ لتحديد فوري.\n• قوام ناعم ينزلق بسلاسة دون شد.\n• قابل للشحذ لاستخدام طويل.\n• مثالي لخط الماء العلوي والسفلي.\n• خالٍ من البارابين والعطور والكحول.\n• نباتي.\n• يُطبّق على خط الماء أو على خط الرموش ويُدمج للحصول على إطلالة سموكي ناعمة.",
    descriptionEn:
      "Essence Inner Eye Khol Kajal 01 Midnight Black — deep black pencil designed for precise waterline application.\n\n" +
      "• Highly pigmented matte texture for instant definition.\n• Soft formula glides smoothly without tugging.\n• Sharpenable pencil format.\n• Ideal for upper and lower waterline.\n• Vegan, paraben-free, fragrance-free and alcohol-free.\n• Apply to the waterline or lash line and blend for a soft smoky effect.",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/0/7/07276a5ae533f65cd67da73de8b78acece76b4cd_4059729541888_bi_essence_inner_eye_khol_kajal_01_midnight_black.jpg",
  },
  {
    barcode: "4059729307569",
    slug: "essence-inner-eye-brightening-pen-01-everybodys-shade",
    price: 2500,
    subcategoryId: EYES,
    tertiaryCategoryId: KAJAL,
    nameAr: "إيسنس - قلم إضاءة داخلي للعين رقم ٠١ ١ جم",
    nameEn: "Essence - Inner Eye Brightening Pen 01 Everybody's Shade 1 g",
    descriptionAr:
      "قلم إضاءة داخلي للعين من إيسنس — درجة وردية ناعمة عالمية تمنح العين إشراقة وإطلالة واسعة اليقظة.\n\n" +
      "• قلم إضاءة بلون وردي ناعم يناسب الجميع.\n• يُطبّق على خط الماء أو الزاوية الداخلية للعين.\n• قوام ناعم سهل التطبيق وطويل الثبات.\n• نتيجة فورية لعيون أكثر إشراقاً.\n• خالٍ من البارابين والعطور والكحول.\n• نباتي ولم يُختبر على الحيوانات.",
    descriptionEn:
      "Essence Inner Eye Brightening Pen 01 Everybody's Shade — universal soft pink pencil for a wide-awake, bright-eyed look.\n\n" +
      "• Eye highlighter pencil in a universal soft pink shade.\n• Apply to the waterline or inner corner of the eye.\n• Long-lasting, soft texture with an instant eye-opening effect.\n• Vegan, paraben-free, fragrance-free, alcohol-free and cruelty-free.\n• Gently stroke along the waterline or inner corner.",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/6/6616de3d0c2d2ba3cf603dd217ad3e94860818bf_4059729307569_bi_essence_inner_eye_brightening_pen_01_everybodys_shade.jpg",
  },
  {
    barcode: "4059729446480",
    slug: "essence-eyeshadow-brush-01-throwing-a-little-shade",
    price: 5000,
    subcategoryId: TOOLS,
    tertiaryCategoryId: EYE_BRUSHES,
    nameAr: "إيسنس - فرشاة ظلال عيون رقم ٠١",
    nameEn: "Essence - Eyeshadow Brush 01 Throwing A Little Shade",
    descriptionAr:
      "فرشاة ظلال عيون من إيسنس — شكل فريد وشعيرات ناعمة لتطبيق ودمج ظلال البودرة بسهولة.\n\n" +
      "• شعيرات ناعمة لتطبيق مريح وكمية مناسبة.\n• مقبض ناعم مصنوع من مواد معاد تدويرها بنسبة ١٠٠٪.\n• رأس مستدير لتوزيع متساوٍ على الجفن.\n• مناسبة للإطلالات الناعمة والجريئة.\n• نباتي.\n• يُستخدم لتطبيق ودمج ظلال العيون على الجفن المتحرك.",
    descriptionEn:
      "Essence Eyeshadow Brush 01 Throwing A Little Shade — unique brush with soft hairs for easy powder eyeshadow application.\n\n" +
      "• Soft hairs for comfortable, even product pickup.\n• Soft-touch handle made from 100% recycled material.\n• Rounded brush head for even application on the eyelid.\n• Perfect for soft blends and defined looks.\n• Vegan.\n• Use to apply and blend eyeshadow evenly on the eyelid.",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/f/8/f81489ca9ab972002be01d57d757e5497937e244_4059729446480_bi_essence_eyeshadow_brush_01_throwing_a_little_shade.jpg",
  },
  {
    barcode: "4059729271136",
    slug: "essence-the-brown-edition-eyeshadow-palette-30",
    price: 6750,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "إيسنس - باليت ظلال عيون ذا براون إيديشن رقم ٣٠",
    nameEn: "Essence - The Brown Edition Eyeshadow Palette 30",
    descriptionAr:
      "باليت ظلال عيون ذا براون إيديشن من إيسنس — درجات بنية ناعمة وداكنة بقوام فائق النعومة وثبات طويل.\n\n" +
      "• باليت واحد لإطلالات لا محدودة.\n• درجات مطفية ولامعة ومعدنية.\n• تصبغ عالٍ وثبات طويل.\n• قوام ناعم سهل التطبيق والدمج.\n• يناسب جميع درجات البشرة.\n• خالٍ من البارابين والعطور والكحول والزيت والغلوتين.\n• نباتي.\n• يُطبّق بفرشاة ظلال العيون ويُدمج حسب الإطلالة المطلوبة.",
    descriptionEn:
      "Essence The Brown Edition Eyeshadow Palette 30 — super soft texture in gorgeous soft and dark brown tones for endless looks.\n\n" +
      "• One palette, endless looks.\n• Matte, pearly and metallic shades.\n• Long-lasting, highly pigmented colour.\n• Easy to apply and blend.\n• Flatters every skin tone.\n• Vegan, paraben-free, fragrance-free, alcohol-free, oil-free and gluten-free.\n• Apply with an eyeshadow brush and blend as desired.",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0561/4259/4241/products/brown_edt_1.jpg?v=1631277598",
  },
  {
    barcode: "4059729498977",
    slug: "essence-cheeky-love-liquid-blush-01-make-me-blush",
    price: 6000,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    nameAr: "إيسنس - بلاشر سائل تشيكي لوف رقم ٠١ ٦ مل",
    nameEn: "Essence - Cheeky Love Liquid Blush 01 Make Me Blush 6 ml",
    descriptionAr:
      "بلاشر سائل تشيكي لوف من إيسنس — تركيبة خفيفة وعالية التصبغ مع إسفنجة ناعمة لتطبيق سهل ودمج سلس.\n\n" +
      "• تركيبة سائلة خفيفة بلمعة صحية.\n• تصبغ عالٍ قابل للبناء.\n• أداة إسفنجية ناعمة للتطبيق المريح.\n• يندمج بسهولة على البشرة.\n• خالٍ من البارابين والزيت والغلوتين واللاكتوز.\n• نباتي.\n• يُطبّق على عظام الخد ويُدمج بالأصابع أو الفرشاة.",
    descriptionEn:
      "Essence Cheeky Love Liquid Blush 01 Make Me Blush — lightweight, highly pigmented liquid blush with a fluffy sponge applicator.\n\n" +
      "• Lightweight liquid formula with a radiant finish.\n• Highly pigmented and buildable.\n• Soft sponge applicator for easy application.\n• Blends effortlessly into the skin.\n• Vegan, paraben-free, oil-free, gluten-free and lactose-free.\n• Apply to the cheekbones and blend with fingers or a brush.",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0561/4259/4241/files/essence-cheeky-love-tekuce-rumenilo-01-make-me-blush.png?v=1762927275",
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

async function uploadImage(url: string, alt: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*", "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)" },
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 64) throw new Error("empty image");

    const contentType = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const blob = new Blob([buffer], { type: contentType });
    const form = new FormData();
    form.append("file", blob, `${alt.replace(/[^\w.-]+/g, "_")}.${ext}`);
    form.append("purpose", "PRODUCT");

    const uploadRes = await fetch(`${API_BASE}/media/upload`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: form,
    });
    const json = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      const msg =
        (json as { message?: string; error?: { message?: string } })?.error?.message ??
        (json as { message?: string })?.message ??
        uploadRes.statusText;
      throw new Error(msg);
    }
    const media = ((json as { data?: { id: string } }).data ?? json) as { id: string };
    if (!media?.id) throw new Error(`No media id for ${alt}`);
    return media.id;
  } catch (err) {
    if (attempt >= 4) throw err;
    await new Promise((r) => setTimeout(r, attempt * 1500));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length}\n`);
  await login();
  console.log("Logged in.\n");

  let added = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
      `/products/barcode-check?barcode=${p.barcode}`,
    );
    if (check.exists) {
      console.log(`skip ${p.barcode} — exists | ${check.product?.nameAr ?? "?"}`);
      skipped += 1;
      continue;
    }

    const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
      `/products?search=${encodeURIComponent(p.slug)}&status=all&limit=5`,
    );
    const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
    if (rows.some((row) => row.slug === p.slug)) {
      console.log(`skip ${p.barcode} — slug exists (${p.slug})`);
      skipped += 1;
      continue;
    }

    console.log(`Uploading image for ${p.barcode}...`);
    const imageId = await uploadImage(p.imageUrl, p.slug);

    const created = await api<{ id: string }>("/products", "POST", {
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
      imageIds: [imageId],
    });

    console.log(`✓ ${p.nameAr}`);
    console.log(`  ID: ${created.id} | ${p.barcode} | ${p.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`Done — added: ${added} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
