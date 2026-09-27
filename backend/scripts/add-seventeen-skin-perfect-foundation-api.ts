/**
 * Seventeen Skin Perfect Foundation SPF15 — ultra coverage waterproof foundation 30ml
 * 9 official shades (00–08) with hex + images (NO shade barcodes).
 * Product barcode: 5201641742112 (shade 01)
 *
 * Sources: seventeencosmetics.com/en/catalogue/skin-perfect-ultra-coverage-waterproof-foundation_23/
 * Hex + images: official ProductGroup schema / color-select chips
 *
 * Usage: npx tsx scripts/add-seventeen-skin-perfect-foundation-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";

const IMG = "https://seventeencosmetics.com/media/images/products/2026/02";

const SHADE_PRICE = 24000;

const PRODUCT = {
  barcode: "5201641742112",
  slug: "seventeen-skin-perfect-ultra-coverage-waterproof-foundation-spf15-30ml",
  sku: "SEV-SKPERF-742112",
  price: SHADE_PRICE,
  originalPrice: 28000,
  nameAr: "سفنتيين - فاونديشن Skin Perfect تغطية كاملة مقاوم للماء بمظهر مات SPF15 سعة 30 مل",
  nameEn: "Seventeen Skin Perfect Ultra Coverage Waterproof Foundation SPF15 Matte 30ml",
  descriptionAr:
    "فاونديشن Skin Perfect من سفنتيين — تغطية كاملة بمظهر طبيعي وإنهاء مات مخملي، بتركيبة خفيفة مقاومة للماء وحماية SPF15.\n\n" +
    "• يغطي العيوب الداكنة والتصبغات والشعيرات وحتى الندوب الصغيرة دون مظهر ثقيل.\n" +
    "• ملمس خفيف غير دهني مريح لجميع أنواع البشرة — يثبت طويلاً بمظهر مات أنيق.\n" +
    "• مقاوم للماء مع SPF15 — مناسب للرياضة والشاطئ والأيام الحارة في العراق.\n" +
    "• 30 مل — 9 درجات رسمية من الفاتح جداً (00) إلى الداكن (08).\n" +
    "• باركود هذا المنتج لدرجة 01 — بيج فاتح دافئ يناسب كثيراً من البشرة الفاتحة إلى المتوسطة.\n" +
    "• مُختبر جلدياً — خالٍ من الغلوتين — غير مسبب لحب الشباب (Non-Comedogenic).\n\n" +
    "طريقة الاستخدام: وزّعي الكمية المناسبة بفرشاة أو إسفنجة بحركات للأسفل على كامل الوجه، وادمجي نحو الرقبة وخط الشعر.\n\n" +
    "الدرجات المتوفرة (الأرقام الرسمية):\n" +
    "• 00 — فاتح جداً عاجي\n" +
    "• 01 — بيج فاتح (درجة هذا الباركود)\n" +
    "• 02 — بيج فاتح دافئ\n" +
    "• 03 — بيج طبيعي\n" +
    "• 04 — بيج متوسط فاتح\n" +
    "• 05 — بيج متوسط\n" +
    "• 06 — بيج متوسط دافئ\n" +
    "• 07 — تان فاتح\n" +
    "• 08 — تان/داكن دافئ",
  descriptionEn:
    "Seventeen Skin Perfect Foundation SPF15 — full coverage with a natural look and velvet matte finish in a lightweight, waterproof formula with SPF15 protection.\n\n" +
    "• Covers dark spots, spider veins and even small scars while staying pleasant and breathable on skin.\n" +
    "• Lightweight, non-oily texture for all skin types with long-lasting matte wear.\n" +
    "• Waterproof + SPF15 — ideal for the gym, beach and hot humid days.\n" +
    "• 30ml — 9 official shades from very fair (00) to deeper (08).\n" +
    "• This barcode is shade 01 — a light warm beige that flatters fair to light-medium complexions.\n" +
    "• Dermatologically tested — gluten-free — non-comedogenic.\n\n" +
    "How to use: Apply evenly with a brush or sponge using downward motions across the face, blending toward the neck and hairline.\n\n" +
    "Available shades (official numbers):\n" +
    "• 00 — very fair ivory\n" +
    "• 01 — light beige (this barcode’s shade)\n" +
    "• 02 — light warm beige\n" +
    "• 03 — natural beige\n" +
    "• 04 — light-medium beige\n" +
    "• 05 — medium beige\n" +
    "• 06 — medium warm beige\n" +
    "• 07 — light tan\n" +
    "• 08 — warm tan/deeper",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
  price: number;
  fallbacks?: string[];
};

/** Official shade numbers + official hex from seventeencosmetics ProductGroup / color chips. */
const SHADES: ShadeInput[] = [
  { name: "00", colorHex: "#E3BBA1", imageUrl: `${IMG}/Skin_Perfect_00.png`, position: 0, price: SHADE_PRICE, fallbacks: [`${IMG}/Skin_Perfect_00_2.png`] },
  { name: "01", colorHex: "#CAA288", imageUrl: `${IMG}/Skin_Perfect_01.png`, position: 1, price: SHADE_PRICE, fallbacks: [`${IMG}/Skin_Perfect_01_2.png`] },
  { name: "02", colorHex: "#D0A88F", imageUrl: `${IMG}/Skin_Perfect_02.png`, position: 2, price: SHADE_PRICE, fallbacks: [`${IMG}/Skin_Perfect_02_2.png`] },
  { name: "03", colorHex: "#D1A588", imageUrl: `${IMG}/Skin_Perfect_03.png`, position: 3, price: SHADE_PRICE, fallbacks: [`${IMG}/Skin_Perfect_03_2.png`] },
  { name: "04", colorHex: "#CAA185", imageUrl: `${IMG}/Skin_Perfect_04.png`, position: 4, price: SHADE_PRICE, fallbacks: [`${IMG}/Skin_Perfect_04_2.png`] },
  { name: "05", colorHex: "#CFA082", imageUrl: `${IMG}/Skin_Perfect_05.png`, position: 5, price: SHADE_PRICE, fallbacks: [`${IMG}/Skin_Perfect_05_2.png`] },
  { name: "06", colorHex: "#CEA180", imageUrl: `${IMG}/Skin_Perfect_06.png`, position: 6, price: SHADE_PRICE, fallbacks: [`${IMG}/Skin_Perfect_06_2.png`] },
  { name: "07", colorHex: "#C3977E", imageUrl: `${IMG}/Skin_Perfect_07.png`, position: 7, price: SHADE_PRICE, fallbacks: [`${IMG}/Skin_Perfect_07_2.png`] },
  { name: "08", colorHex: "#966044", imageUrl: `${IMG}/Skin_Perfect_08.png`, position: 8, price: SHADE_PRICE, fallbacks: [`${IMG}/Skin_Perfect_08_2.png`] },
];

const PRODUCT_IMAGES = [
  `${IMG}/Skin_Perfect_01.png`,
  `${IMG}/Skin_Perfect_01_2.png`,
  `${IMG}/Skin_Perfect_00_2.png`,
  `${IMG}/Skin_Perfect_08_2.png`,
  `${IMG}/Skin_Perfect_03.png`,
  `${IMG}/Skin_Perfect_05.png`,
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
  const search = await api<
    { data?: Array<{ id: string; name?: string; nameEn?: string; nameAr?: string }> } | Array<{ id: string; name?: string; nameEn?: string; nameAr?: string }>
  >(`/brands?search=${encodeURIComponent("Seventeen")}&limit=50`);
  const rows = Array.isArray(search) ? search : (search.data ?? []);
  const exact = rows.find((b) => {
    const n = `${b.name ?? ""} ${b.nameEn ?? ""} ${b.nameAr ?? ""}`.toLowerCase().trim();
    return n === "seventeen" || /(^|\s)seventeen(\s|$)/.test(n) || n.includes("seven7een");
  });
  if (exact?.id) {
    console.log(`Brand: Seventeen (${exact.id}) [exact search]`);
    return exact.id;
  }
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: "سفنتيين",
    brandEn: "Seventeen",
    createIfMissing: true,
  });
  if (!resolved.brand?.id) throw new Error("Could not resolve Seventeen brand");
  console.log(`Brand: Seventeen (${resolved.brand.id})${resolved.created ? " [created]" : " [resolve]"}`);
  return resolved.brand.id;
}

async function uploadImage(url: string, alt: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*", "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)" },
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 64) throw new Error("empty image");

    const contentType = (res.headers.get("content-type") || "image/png").split(";")[0].trim();
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const blob = new Blob([buffer], { type: contentType.startsWith("image/") ? contentType : "image/png" });
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
    await new Promise((r) => setTimeout(r, attempt * 1000));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function uploadWithFallbacks(primary: string, fallbacks: string[], alt: string): Promise<string> {
  const urls = [primary, ...fallbacks];
  let lastErr: unknown;
  for (const url of urls) {
    try {
      return await uploadImage(url, alt);
    } catch (e) {
      lastErr = e;
      console.log(`    retry: ${e instanceof Error ? e.message : e}`);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`All image URLs failed for ${alt}`);
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length} (no shade barcodes)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();
  console.log("");

  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${PRODUCT.barcode}`,
  );
  if (check.exists && check.product?.id) {
    await api(`/products/${check.product.id}`, "DELETE");
    console.log(`deleted existing: ${check.product.nameAr ?? PRODUCT.barcode}\n`);
  }

  const existing = await api<{ data?: Array<{ id: string; slug?: string }> } | Array<{ id: string; slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT.slug)}&status=all&limit=10`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  for (const row of rows.filter((p) => p.slug === PRODUCT.slug)) {
    await api(`/products/${row.id}`, "DELETE");
    console.log(`deleted orphan slug: ${PRODUCT.slug}`);
  }

  console.log("Uploading shade images...");
  const shades: Array<{
    name: string;
    colorHex: string;
    imageId: string;
    position: number;
    stock: number;
    price: number;
    originalPrice: number;
  }> = [];

  for (const shade of SHADES) {
    const imageId = await uploadWithFallbacks(shade.imageUrl, shade.fallbacks ?? [], `shade-${shade.name}`);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
      price: shade.price,
      originalPrice: PRODUCT.originalPrice,
    });
    console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    try {
      galleryIds.push(await uploadImage(url, "product-gallery"));
      console.log("  ✓ gallery");
    } catch (e) {
      console.log(`  ✗ gallery skip: ${e instanceof Error ? e.message : e}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  shades.sort((a, b) => a.position - b.position);
  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: FOUNDATION,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [FOUNDATION],
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
    shades?: Array<{ name?: string; barcode?: string | null; colorHex?: string }>;
  }>(`/products/${created.id}`);
  const shadeRows = verify.shades ?? [];
  const withBarcode = shadeRows.filter((s) => s.barcode);

  console.log(`\n✓ ${PRODUCT.nameEn}`);
  console.log(`  AR: ${PRODUCT.nameAr}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode} (product only — shade 01)`);
  console.log(`  Shades: ${shadeRows.length} | with shade barcode: ${withBarcode.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  if (withBarcode.length > 0) throw new Error("Shade barcodes were saved — must be empty");
  if (shadeRows.length !== SHADES.length) throw new Error(`Expected ${SHADES.length} shades, got ${shadeRows.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
