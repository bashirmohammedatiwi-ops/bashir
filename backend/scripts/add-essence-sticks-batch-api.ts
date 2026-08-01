/**
 * Essence stick products — 5 separate barcode products.
 * Usage: npx tsx scripts/add-essence-sticks-batch-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const HIGHLIGHTER = "774d62c3-8119-4c0c-983b-2513fc46df24";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";
const FACE_PRIMER = "d179ae24-9cf5-4a70-8dbd-bedd0cfbef0b";
const BRONZER = "209555fb-201d-457f-9ac6-7cf1ea277bff";
const LIQUID_HIGHLIGHTER = "6fed608e-80d7-4449-9427-fc2848b091be";

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
    barcode: "4059729490971",
    slug: "essence-jelly-grip-undereye-primer-stick",
    price: 5250,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_PRIMER,
    nameAr: "إيسنس - ستك برايمر جيلي جريب تحت العين",
    nameEn: "Essence - Jelly Grip Undereye Primer Stick",
    descriptionAr:
      "ستك برايمر جيلي جريب تحت العين من إيسنس — قاعدة مثالية للكونسيلر مع ترطيب وانتعاش فوري.\n\n" +
      "• برايمر مثالي كقاعدة للكونسيلر.\n• يوفّر ترطيباً وإحساساً منعشاً.\n• تطبيق مريح بفضل شكل الستك العملي.\n• مُعزّز بحمض الهيالورونيك والبانثينول.\n• مغذّي ومرطّب ومهيّئ ومنعش.\n• خالٍ من البارابين والعطور والكحول والزيوت.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق بلطف تحت العين بإصبع الخنصر.",
    descriptionEn:
      "Essence Jelly Grip Undereye Primer Stick — the perfect base for concealer with moisture and an instant refreshing feel.\n\n" +
      "• Ideal primer base for concealer.\n• Provides moisture and a refreshing sensation.\n• Comfortable application thanks to the practical stick format.\n• With hyaluronic acid and panthenol.\n• Nourishing, moisturising, priming and refreshing.\n• Vegan, paraben-free, fragrance-free, alcohol-free and oil-free.\n• Cruelty-free.\n• Gently tap under the eyes with your ring finger.",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/4/2/42254c90e82d68fbf3bab96f988ce415ca633270_4059729490971_bi_essence_jelly_grip_undereye_primer_stick.jpg",
  },
  {
    barcode: "4059729542533",
    slug: "essence-baby-got-glow-highlighter-stick-20-rosy-glaze",
    price: 5250,
    subcategoryId: HIGHLIGHTER,
    tertiaryCategoryId: LIQUID_HIGHLIGHTER,
    nameAr: "إيسنس - ستك هايلايتر بيبي جوت جلو رقم ٢٠ روزي جليز",
    nameEn: "Essence - Baby Got Glow Highlighter Stick 20 Rosy Glaze",
    descriptionAr:
      "ستك هايلايتر بيبي جوت جلو من إيسنس — لمعة زجاجية ناعمة تندمج مع البشرة لإطلالة مشرقة وطبيعية.\n\n" +
      "• قوام بلسمي يندمج بلطف مع البشرة.\n• توهج لطيف بلمعة عاكسة ومشرقة.\n• يناسب جميع درجات البشرة وسهل التوزيع.\n• يُستخدم وحده أو فوق المكياج.\n• رائحة خفيفة منعشة.\n• خالٍ من البارابين والزيوت والغلوتين واللاكتوز.\n• نباتي.\n• يُطبّق على عظام الخد أو جسر الأنف أو تحت الحاجب.",
    descriptionEn:
      "Essence Baby Got Glow Highlighter Stick — shimmering balm texture for the iconic glassy glow look.\n\n" +
      "• Balm texture that gently melts into the skin.\n• Delicate glow with a reflective, radiant effect.\n• Suitable for all skin tones and easy to blend.\n• Wear alone or over makeup.\n• Subtle fresh scent.\n• Vegan, paraben-free, oil-free, gluten-free and lactose-free.\n• Apply on cheekbones, bridge of the nose or under brows.",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/b/4/b4951b13c7aa89b87de1053afe23a03b917f7f9c_4059729542533_bi_essence_baby_got_glow_highlighter_stick_20_rosy_glaze.jpg",
  },
  {
    barcode: "4059729421401",
    slug: "essence-bright-eyes-under-eye-stick-01-soft-rose",
    price: 5250,
    subcategoryId: FACE,
    tertiaryCategoryId: CONCEALER,
    nameAr: "إيسنس - ستك تحت العين برايت آيز رقم ٠١ سوفت روز",
    nameEn: "Essence - Bright Eyes Under Eye Stick 01 Soft Rose",
    descriptionAr:
      "ستك تحت العين برايت آيز من إيسنس — يخفّي الهالات ويمنح مظهراً مشرقاً ومنتعشاً في ثوانٍ.\n\n" +
      "• ستك عيون ضد الهالات ولإطلالة مشرقة.\n• مُعزّز بالألوفيرا وزيت عباد الشمس وحمض الهيالورونيك.\n• شكل ستك عملي وسهل التطبيق.\n• تفتيح ومغذّي.\n• تغطية كاملة.\n• خالٍ من البارابين والعطور واللاكتوز.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق تحت العين بعد العناية اليومية ويُربّت بلطف.",
    descriptionEn:
      "Essence Bright Eyes Under Eye Stick — makes dark circles disappear in seconds for a fresh, radiant finish.\n\n" +
      "• Eye stick against dark circles for radiant-looking skin.\n• With aloe vera, sunflower oil and hyaluronic acid.\n• Convenient stick format.\n• Brightening and nourishing.\n• Full coverage.\n• Vegan, paraben-free, fragrance-free and lactose-free.\n• Cruelty-free.\n• Apply under the eyes after day care and gently tap in.",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/e/f/efb4969fb1889678f8a0a0d94d98defa5b086f0c_4059729421401_bi_essence_bright_eyes_under_eye_stick_01_soft_rose.jpg",
  },
  {
    barcode: "4059729394637",
    slug: "essence-baby-got-bronze-bronzing-stick-10-cinnamon-spice",
    price: 5250,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BRONZER,
    nameAr: "إيسنس - ستك برونزر بيبي جوت برونز رقم ١٠ سينامون سبايس",
    nameEn: "Essence - Baby Got Bronze Bronzing Stick 10 Cinnamon Spice",
    descriptionAr:
      "ستك برونزر كريمي من إيسنس — إطلالة مشمسة ناعمة بلمسة طبيعية سهلة التوزيع.\n\n" +
      "• برونزر كريمي بشكل ستك.\n• سهل التوزيع والدمج.\n• لمسة برونزية ناعمة وطبيعية.\n• مظهر مشرق ومنعش.\n• قابل للبناء حسب الرغبة.\n• خالٍ من البارابين والغلوتين واللاكتوز.\n• نباتي ولم يُختبر على الحيوانات.\n• يُوزّع بالأصابع أو الإسفنجة أو الفرشاة.",
    descriptionEn:
      "Essence Baby Got Bronze Bronzing Stick — creamy bronzer for a sunkissed look with a natural finish.\n\n" +
      "• Creamy bronzer in stick format.\n• Easy to blend.\n• Soft bronzed look with a natural finish.\n• Radiantly fresh appearance.\n• Buildable colour.\n• Vegan, paraben-free, gluten-free and lactose-free.\n• Cruelty-free.\n• Blend with fingertips, a sponge or a brush.",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/1/4/144e3af0f887eb7e9fd7903dabbbaab5c95754ea_4059729394637_bi_essence_bronzing_stick_10_cinnamon_spice.jpg",
  },
  {
    barcode: "4059729542526",
    slug: "essence-baby-got-glow-highlighter-stick-10-golden-aura",
    price: 5250,
    subcategoryId: HIGHLIGHTER,
    tertiaryCategoryId: LIQUID_HIGHLIGHTER,
    nameAr: "إيسنس - ستك هايلايتر بيبي جوت جلو رقم ١٠ جولدن أورا",
    nameEn: "Essence - Baby Got Glow Highlighter Stick 10 Golden Aura",
    descriptionAr:
      "ستك هايلايتر بيبي جوت جلو من إيسنس — لمعة زجاجية ناعمة تندمج مع البشرة لإطلالة مشرقة وطبيعية.\n\n" +
      "• قوام بلسمي يندمج بلطف مع البشرة.\n• توهج لطيف بلمعة عاكسة ومشرقة.\n• يناسب جميع درجات البشرة وسهل التوزيع.\n• يُستخدم وحده أو فوق المكياج.\n• رائحة خفيفة منعشة.\n• خالٍ من البارابين والزيوت والغلوتين واللاكتوز.\n• نباتي.\n• يُطبّق على عظام الخد أو جسر الأنف أو تحت الحاجب.",
    descriptionEn:
      "Essence Baby Got Glow Highlighter Stick — shimmering balm texture for the iconic glassy glow look.\n\n" +
      "• Balm texture that gently melts into the skin.\n• Delicate glow with a reflective, radiant effect.\n• Suitable for all skin tones and easy to blend.\n• Wear alone or over makeup.\n• Subtle fresh scent.\n• Vegan, paraben-free, oil-free, gluten-free and lactose-free.\n• Apply on cheekbones, bridge of the nose or under brows.",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/4/24130c9f9dde0a862ef703c9e75fd5275954bdb6_4059729542526_bi_essence_baby_got_glow_highlighter_stick_10_golden_aura.jpg",
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
    const check = await api<{ exists: boolean; product?: { nameAr?: string; id?: string } }>(
      `/products/barcode-check?barcode=${p.barcode}`,
    );
    if (check.exists) {
      console.log(`skip ${p.barcode} — exists | ${check.product?.nameAr ?? "?"}`);
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
