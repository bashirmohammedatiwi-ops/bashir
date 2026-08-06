/**
 * Grigi Eyebrow Premium Pro Pencil — 4 shades (10–13).
 * Sources: grigi.gr (images, names), epharmadora.com (barcodes)
 * Product barcode: 5207042610128 (12 Espresso)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-grigi-eyebrow-premium-pro-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const BROW_PENCIL = "b1db1ac0-66ff-4912-8072-0c07e3fffda3";

const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

const PRODUCT = {
  barcode: "5207042610128",
  slug: "grigi-eyebrow-premium-pro-pencil",
  sku: "GRG-EPPP",
  price: 8500,
  nameAr: "كريجي - قلم حواجب Eyebrow Premium Pro Pencil مثلث مع فرشاة",
  nameEn: "Grigi - Eyebrow Premium Pro Pencil",
  descriptionAr:
    "قلم حواجب Eyebrow Premium Pro Pencil من كريجي — قلم مثلث ثنائي الاستخدام مع فرشاة spoolie لحواجب مُحدّدة وطبيعية.\n\n" +
    "• رأس مثلث متعدد الوظائف: حافة حادة لخطوط شعرية دقيقة وحافة مسطحة للملء والتشكيل.\n" +
    "• فرشاة spoolie مُرفقة لتمشيط وتثبيت شكل الحواجب.\n" +
    "• تركيبة غنية بشمع Candelilla و Carnauba وفيتامين E لترطيب وتغذية.\n" +
    "• ثبات طويل ونتيجة طبيعية تُكمل إطلالة المكياج اليومية والمسائية.\n" +
    "• مُختبر جلدياً — نباتي (Vegan).\n" +
    "• 4 درجات طبيعية: 10 Almost Black و 11 Brunette و 12 Espresso و 13 Blonde.\n" +
    "• ارسمي بخطوط شعرية خفيفة لملء الفراغات ثم مشّطي بفرشاة spoolie.\n" +
    "• اختاري الدرجة الأقرب لون شعرك لأكثر نتيجة طبيعية.\n" +
    "• صُنع في اليونان.",
  descriptionEn:
    "Grigi Eyebrow Premium Pro Pencil — triangular dual-ended brow pencil with a spoolie brush for defined, natural brows.\n\n" +
    "• Multi-use triangular tip: sharp edge for hair-like strokes, flat edge for filling and shaping.\n" +
    "• Built-in spoolie brush to groom and blend brows.\n" +
    "• Formula enriched with Candelilla and Carnauba wax and vitamin E.\n" +
    "• Long-wearing, natural finish for day and evening looks.\n" +
    "• Dermatologically tested, vegan.\n" +
    "• 4 natural shades: 10 Almost Black, 11 Brunette, 12 Espresso and 13 Blonde.\n" +
    "• Draw light hair-like strokes to fill gaps, then brush through with the spoolie.\n" +
    "• Match the shade to your hair colour for the most natural result.\n" +
    "• Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from grigi.gr / epharmadora.com; hex tuned to official shade names. */
const SHADES: ShadeInput[] = [
  { name: "10 Almost Black", colorHex: "#2e2a28", imageUrl: `${IMG}/g/e/gebpp_10.jpg`, position: 0 },
  { name: "11 Brunette", colorHex: "#6a5e56", imageUrl: `${IMG}/g/e/gebpp_11.jpg`, position: 1 },
  { name: "12 Espresso", colorHex: "#5c4638", imageUrl: `${IMG}/g/e/gebpp_12.jpg`, position: 2 },
  { name: "13 Blonde", colorHex: "#b8a088", imageUrl: `${IMG}/g/e/gebpp_13.jpg`, position: 3 },
];

/** Extra product gallery images (alternate angles). */
const PRODUCT_IMAGES = [
  `${IMG}/g/e/geyppp-10.jpg`,
  `${IMG}/g/e/geyppp-12.jpg`,
  `${IMG}/g/e/geyppp-13.jpg`,
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
    brandAr: "كريجي",
    brandEn: "Grigi",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Grigi brand");
  console.log(`Brand: Grigi (${brandId})${resolved.created ? " [created]" : ""}\n`);
  return brandId;
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
  const shades: Array<{
    name: string;
    colorHex: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} — ${shade.colorHex}`);
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    const id = await uploadImage(url, "product-gallery");
    galleryIds.push(id);
    console.log(`  ✓ gallery`);
    await new Promise((r) => setTimeout(r, 500));
  }

  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: EYEBROW,
    tertiaryCategoryId: BROW_PENCIL,
    subcategoryIds: [EYEBROW],
    tertiaryCategoryIds: [BROW_PENCIL],
    nameAr: PRODUCT.nameAr,
    nameEn: PRODUCT.nameEn,
    descriptionAr: PRODUCT.descriptionAr,
    descriptionEn: PRODUCT.descriptionEn,
    price: PRODUCT.price,
    originalPrice: PRODUCT.price,
    stock: 0,
    isActive: true,
    imageIds,
    shades,
  });

  const verify = await api<{
    shades?: Array<{ name: string; barcode?: string; colorHex?: string; imageId?: string }>;
    nameAr?: string;
    nameEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    barcode?: string;
  }>(`/products/${created.id}`);

  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

  if (!verify.nameAr || !verify.nameEn || !verify.descriptionAr || !verify.descriptionEn) {
    throw new Error("Missing bilingual copy after create");
  }

  const noImg = (verify.shades ?? []).filter((s) => !s.imageId);
  if (noImg.length) throw new Error(`Shades missing images: ${noImg.map((s) => s.name).join(", ")}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${verify.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Eyes → Brow Pencil`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
