/**
 * Seventeen Natural Matte Silky Blusher — compact matte blush 5g.
 * Official current range: 8 shades (product page color-select).
 * Product barcode: 5201641727607 (14 Sweet Brown).
 * Shade barcodes intentionally omitted.
 *
 * Sources:
 * - seventeencosmetics.com/en/catalogue/natural-matte-silky-blusher_103/
 *   (official tips/names, color-select__option__hex, pack photos 2020/03)
 * - Brocard pack shots (gallery)
 * - Price: Alshaheera Iraq — Natural Matte Blusher 11,750 IQD
 *
 * Usage: npx tsx scripts/add-seventeen-natural-matte-silky-blusher-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";

const OFF = "https://seventeencosmetics.com/media/images/products/2020/03";
const BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

const PRODUCT = {
  barcode: "5201641727607",
  slug: "seventeen-natural-matte-silky-blusher-5g",
  sku: "SVN-NMSB-727607",
  price: 11750,
  originalPrice: 13500,
  nameAr: "سفنتين - بلشر مطفي حريري Natural Matte Silky Blusher مدمج ثابت 5 غ",
  nameEn: "Seventeen Natural Matte Silky Blusher Compact Matte Blush 5g",
  descriptionAr:
    "بلشر مدمج Natural Matte Silky Blusher من سفنتين — ملمس حريري ناعم يندمج بسهولة ويمنح الخدود لوناً غنياً بمظهر مطفي طبيعي مع توهّج صحي خفيف بفضل اللآلئ الخاصة في التركيبة. ثبات طوال اليوم يناسب البشرة الدهنية/المختلطة في أجواء العراق دون إبراز عيوب البشرة.\n\n" +
    "• ملمس حريري خفيف لتطبيق سهل ومتجانس دون خطوط.\n" +
    "• مظهر مطفي يدوم طوال اليوم ويكمل المكياج بإشراقة طبيعية.\n" +
    "• لآلئ فريدة تمنح توهجاً صحياً دون لمعة ثقيلة.\n" +
    "• عبوة عملية مدمجة سهلة الحمل في الشنطة.\n" +
    "• مختبر جلدياً — خالٍ من الغلوتين.\n" +
    "• 5 غ — 8 درجات رسمية متوفرة حالياً من الوردي الشاحب إلى البني الحلو.\n\n" +
    "طريقة الاستخدام: ضعيه بفرشاة على عظام الخدود وأي منطقة تحتاج لمسة لون، وادمِجي نحو خط الشعر.\n\n" +
    "نصيحة برو: مثالي للبشرة الدهنية/المختلطة لأنه لا يُبرز العيوب.\n\n" +
    "الدرجات المتوفرة (الأسماء الرسمية من موقع Seventeen):\n" +
    "• 01 Pale Rose — وردي شاحب ناعم\n" +
    "• 02 Hazelnut — بندقي دافئ\n" +
    "• 03 Café au Lait — قهوة بالحليب\n" +
    "• 04 Rose — وردي كلاسيكي\n" +
    "• 09 Apple Cider — تفاح سيدر دافئ\n" +
    "• 13 Pure Blush — وردي نقي\n" +
    "• 14 Sweet Brown — بني حلو (درجة هذا الباركود)\n" +
    "• 15 Rosy Blush — وردي محمر",
  descriptionEn:
    "Seventeen Natural Matte Silky Blusher — a compact powder blush with a silky-smooth texture that blends effortlessly for rich, natural-looking matte colour. Unique pearls add a healthy glow while the lightweight formula stays true all day — ideal for oily/combination skin as it doesn’t highlight imperfections.\n\n" +
    "• Silky, light consistency for easy, even application.\n" +
    "• Long-lasting matte effect that complements any makeup look.\n" +
    "• Special pearls for a natural healthy glow without heavy shine.\n" +
    "• Handy compact container for on-the-go touch-ups.\n" +
    "• Dermatologically tested — gluten free.\n" +
    "• 5g — 8 official shades currently available from pale rose to sweet brown.\n\n" +
    "How to use: Apply with a brush on your cheekbones and any other part of your face that needs a little colour.\n\n" +
    "Pro tip: Ideal for oily/combination skin types as it doesn’t highlight imperfections.\n\n" +
    "Available shades (official names from seventeencosmetics.com):\n" +
    "• 01 Pale Rose — soft pale rose\n" +
    "• 02 Hazelnut — warm hazelnut\n" +
    "• 03 Café au Lait — café au lait beige-rose\n" +
    "• 04 Rose — classic rose\n" +
    "• 09 Apple Cider — warm apple cider\n" +
    "• 13 Pure Blush — pure soft blush pink\n" +
    "• 14 Sweet Brown — sweet brown (this barcode’s shade)\n" +
    "• 15 Rosy Blush — rosy blush",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Official tips + hex from color-select__option__hex; images: official 511820XX pack photos. */
const SHADES: ShadeInput[] = [
  { name: "01 Pale Rose", colorHex: "#BB8289", imageUrl: `${OFF}/51182001.jpg`, position: 0 },
  { name: "02 Hazelnut", colorHex: "#D19283", imageUrl: `${OFF}/51182002.jpg`, position: 1 },
  { name: "03 Café au Lait", colorHex: "#C8927A", imageUrl: `${OFF}/51182003.jpg`, position: 2 },
  { name: "04 Rose", colorHex: "#B5746F", imageUrl: `${OFF}/51182004.jpg`, position: 3 },
  { name: "09 Apple Cider", colorHex: "#B96A5D", imageUrl: `${OFF}/51182009.jpg`, position: 4 },
  { name: "13 Pure Blush", colorHex: "#DC8993", imageUrl: `${OFF}/51182013.jpg`, position: 5 },
  { name: "14 Sweet Brown", colorHex: "#BA726E", imageUrl: `${OFF}/51182014.jpg`, position: 6 },
  { name: "15 Rosy Blush", colorHex: "#B97F7B", imageUrl: `${OFF}/51182015.jpg`, position: 7 },
];

const PRODUCT_IMAGES = [
  `${OFF}/51182014.jpg`,
  `${BROCARD}/5201641727607_1.jpg`,
  `${OFF}/51182001.jpg`,
  `${OFF}/51182004.jpg`,
  `${OFF}/51182013.jpg`,
  `${OFF}/51182015.jpg`,
  `${BROCARD}/5201641717134_1.jpg`,
  `${BROCARD}/5201641733523_1.jpg`,
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
  const KNOWN = "f133215c-8cb8-4686-9960-0ab79390a6bb";
  try {
    const b = await api<{ id: string }>(`/brands/${KNOWN}`);
    if (b?.id) {
      console.log(`Brand: Seventeen (${b.id}) [known]\n`);
      return b.id;
    }
  } catch {
    /* fall through */
  }

  const search = await api<
    { data?: Array<{ id: string; name?: string; slug?: string }> } | Array<{ id: string; name?: string; slug?: string }>
  >(`/brands?search=${encodeURIComponent("Seventeen")}&limit=100`);
  const rows = Array.isArray(search) ? search : (search.data ?? []);
  const exact = rows.find((b) => {
    const name = (b.name ?? "").trim().toLowerCase();
    const slug = (b.slug ?? "").trim().toLowerCase();
    return name === "seventeen" || slug === "seventeen";
  });
  if (exact?.id) {
    console.log(`Brand: Seventeen (${exact.id}) [exact search]\n`);
    return exact.id;
  }

  const created = await api<{ id: string }>("/brands", "POST", { name: "Seventeen" });
  console.log(`Brand: Seventeen (${created.id}) [created]\n`);
  return created.id;
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
    if (attempt >= 3) throw err;
    await new Promise((r) => setTimeout(r, attempt * 800));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length} (no shade barcodes)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();

  const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
    `/products/barcode-check?barcode=${PRODUCT.barcode}`,
  );
  if (check.exists) {
    console.log(`skip ${PRODUCT.barcode} — exists | ${check.product?.nameAr ?? "?"}`);
    return;
  }

  const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT.slug)}&status=all&limit=5`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  if (rows.some((p) => p.slug === PRODUCT.slug)) {
    console.log(`skip — slug exists (${PRODUCT.slug})`);
    return;
  }

  console.log("Uploading shade images...");
  const shades = [];
  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
    });
    await new Promise((r) => setTimeout(r, 250));
  }
  shades.sort((a, b) => a.position - b.position);

  console.log("\nUploading gallery images...");
  const shadeIds = new Set(shades.map((s) => s.imageId));
  const extraIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    const id = await uploadImage(url, `gallery-${extraIds.length + 1}`);
    if (!shadeIds.has(id) && !extraIds.includes(id)) {
      extraIds.push(id);
      console.log(`  ✓ gallery extra ${extraIds.length}`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const imageIds = [...shades.map((s) => s.imageId), ...extraIds];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    subcategoryIds: [CHEEK],
    tertiaryCategoryIds: [BLUSH],
    nameAr: PRODUCT.nameAr,
    nameEn: PRODUCT.nameEn,
    descriptionAr: PRODUCT.descriptionAr,
    descriptionEn: PRODUCT.descriptionEn,
    price: PRODUCT.price,
    originalPrice: PRODUCT.originalPrice,
    stock: 0,
    isActive: true,
    imageIds,
    shades,
  });

  const verify = await api<{
    shades?: Array<{ name: string; colorHex?: string; barcode?: string }>;
    images?: unknown[];
  }>(`/products/${created.id}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Gallery images: ${verify.images?.length ?? imageIds.length}`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} | ${s.colorHex ?? "?"} | barcode: ${s.barcode ?? "none"}`);
  }
  console.log(`  Category: Makeup → Cheek → Blush`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
