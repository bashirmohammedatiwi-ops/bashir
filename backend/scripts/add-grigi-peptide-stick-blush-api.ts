/**
 * Grigi On The Go Peptide Stick Blush — 5 shades (01–05).
 * Sources: grigi.gr (names, pack/swatch images, color descriptions), beautytown.gr (05 barcode)
 * Product barcode: 5207042770051 (05 Muted Brick)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-grigi-peptide-stick-blush-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";

const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

const PRODUCT = {
  barcode: "5207042770051",
  slug: "grigi-on-the-go-peptide-stick-blush",
  sku: "GRG-GOTPSB",
  price: 7900,
  nameAr: "كريجي - ستك بلاشر On The Go Peptide Stick Blush للخدود",
  nameEn: "Grigi - On The Go Peptide Stick Blush",
  descriptionAr:
    "ستك بلاشر On The Go Peptide Stick Blush من كريجي — بلاشر كريمي متعدد الاستخدامات بتركيبة غنية بالببتيدات لإطلالة طبيعية مشرقة على الخدود والشفاه والعيون.\n\n" +
    "• تركيبة كريمية ناعمة ومُرطّبة مع ببتيدات — تُطبَّق وتندمج بسهولة فائقة.\n" +
    "• متعدد الاستخدامات: خدود، شفاه وعيون — ستك واحد لإطلالة متكاملة.\n" +
    "• لون صحي وطبيعي بتوهج نضر يدوم طوال اليوم دون بهتان.\n" +
    "• شكل ستك عملي On The Go — مثالي للتطبيق السريع والتعديل أثناء التنقل.\n" +
    "• 5 درجات: 01 Pink Fuchsia، 02 Berry، 03 Warm Pink، 04 Deep Rose، 05 Muted Brick.\n" +
    "• مناسب لجميع أنواع البشرة وكل درجات لون البشرة.\n" +
    "• مرّري الستك على عظام الخد وادمجيه بالأصابع أو فرشاة.\n" +
    "• يمكن استخدامه أيضاً على الشفاه وكظل خفيف للعيون.\n" +
    "• صُنع في اليونان.",
  descriptionEn:
    "Grigi On The Go Peptide Stick Blush — multi-use creamy blush stick enriched with peptides for a healthy, natural glow on cheeks, lips and eyes.\n\n" +
    "• Soft, hydrating creamy formula with peptides — glides on and blends effortlessly.\n" +
    "• Multi-use: cheeks, lips and eyes — one stick for a complete fresh look.\n" +
    "• Healthy, natural flush with a long-wearing finish that stays vibrant all day.\n" +
    "• Practical On The Go stick format — perfect for quick touch-ups anywhere.\n" +
    "• 5 shades: 01 Pink Fuchsia, 02 Berry, 03 Warm Pink, 04 Deep Rose, 05 Muted Brick.\n" +
    "• Suitable for all skin types and tones.\n" +
    "• Glide onto cheekbones and blend with fingers or a brush.\n" +
    "• Can also be used on lips and as a soft wash of colour on the eyes.\n" +
    "• Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Hex sampled from grigi.gr swatch images (blush_on_the_go_XX.jpg / 06_1.jpg for 04). */
const SHADES: ShadeInput[] = [
  {
    name: "01 Pink Fuchsia",
    colorHex: "#d57080",
    imageUrl: `${IMG}/b/l/blush_on_the_go_01_pack.jpg`,
    position: 0,
  },
  {
    name: "02 Berry",
    colorHex: "#bd4364",
    imageUrl: `${IMG}/b/l/blush_on_the_go_02_pack.jpg`,
    position: 1,
  },
  {
    name: "03 Warm Pink",
    colorHex: "#e3808b",
    imageUrl: `${IMG}/b/l/blush_on_the_go_03_pack.jpg`,
    position: 2,
  },
  {
    name: "04 Deep Rose",
    colorHex: "#b77b6a",
    imageUrl: `${IMG}/b/l/blush_on_the_go_04_pack.jpg`,
    position: 3,
  },
  {
    name: "05 Muted Brick",
    colorHex: "#965644",
    imageUrl: `${IMG}/b/l/blush_on_the_go_05_pack.jpg`,
    position: 4,
  },
];

/** Swatch / application gallery images from grigi.gr. */
const PRODUCT_IMAGES = [
  `${IMG}/b/l/blush_on_the_go_01.jpg`,
  `${IMG}/b/l/blush_on_the_go_02.jpg`,
  `${IMG}/b/l/blush_on_the_go_03.jpg`,
  `${IMG}/b/l/blush_on_the_go_06_1.jpg`,
  `${IMG}/b/l/blush_on_the_go_05.jpg`,
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
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    subcategoryIds: [CHEEK],
    tertiaryCategoryIds: [BLUSH],
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
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Cheek → Blush`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
