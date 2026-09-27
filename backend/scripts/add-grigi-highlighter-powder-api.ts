/**
 * Grigi Highlighter Powder — 4 shades (00, 01, 08, 104).
 * Sources: grigi.gr (00/01 images), beautyfree.gr (swatches, pack shot),
 *          epharmadora.com (104/0104 image), beauty-net.gr (00 name: ΑΝΟΙΧΤΟ / Light)
 * Product barcode: 5207042090081 (shade 08 Golden Champagne)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-grigi-highlighter-powder-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const HIGHLIGHTER = "774d62c3-8119-4c0c-983b-2513fc46df24";
const POWDER_HIGHLIGHTER = "7480a30f-ed2b-41a8-9349-dd67edb010b6";

const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

const PRODUCT = {
  barcode: "5207042090081",
  slug: "grigi-highlighter-powder",
  sku: "GRG-GHLP",
  price: 6500,
  nameAr: "كريجي - بودرة هايلايتر Highlighter Powder للوجه",
  nameEn: "Grigi - Highlighter Powder",
  descriptionAr:
    "بودرة هايلايتر Highlighter Powder من كريجي — إشراقة خفيفة وحريرية تُضيء الوجه بلمسة طبيعية من دون ترك آثار لونية واضحة.\n\n" +
    "• تركيبة بودرة ناعمة بتوهج إيريدescent يعكس الضوء بأناقة.\n" +
    "• تُبرز عظام الخد والحاجب والأنف وزاوية العين الداخلية لإطلالة مشرقة وشبابية.\n" +
    "• تُخفّف مظهر التعب وتمنح البشرة إشراقة طبيعية ولامعة.\n" +
    "• تُطبَّق بسهولة بفرشاة مروحية (Fan Brush) أو بأطراف الأصابع.\n" +
    "• درجات ذهبية وخوخية مثالية للبشرة السمراء والمكياج الصيفي.\n" +
    "• 4 درجات: 00 Light Champagne، 01 Warm Beige Glow، 08 Golden Champagne، 104 Rose Gold Shimmer.\n" +
    "• مناسبة لجميع درجات البشرة — مثالية للاستخدام اليومي والسهرات.\n" +
    "• وزّعي على نقاط الإضاءة: أعلى الخد، عظمة الحاجب، وسط الأنف، وزرعة الشفاه.\n" +
    "• صُنع في اليونان.",
  descriptionEn:
    "Grigi Highlighter Powder — silky powder highlighter for a soft, luminous glow with no heavy colour cast.\n\n" +
    "• Fine powder formula with an iridescent, light-reflecting finish.\n" +
    "• Highlights cheekbones, brow bone, nose bridge and inner eye corner for a fresh, youthful look.\n" +
    "• Reduces the appearance of fatigue and adds a healthy radiance.\n" +
    "• Easy to apply with a fan brush or fingertips.\n" +
    "• Golden and peachy tones ideal for tanned skin and summer makeup.\n" +
    "• 4 shades: 00 Light Champagne, 01 Warm Beige Glow, 08 Golden Champagne, 104 Rose Gold Shimmer.\n" +
    "• Suitable for all skin tones — perfect for everyday and evening looks.\n" +
    "• Apply to high points: tops of cheeks, brow bone, nose bridge and cupid's bow.\n" +
    "• Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Hex sampled from grigi.gr pan centre, beautyfree.gr swatches (5941/5942/16029), tuned to shade names. */
const SHADES: ShadeInput[] = [
  {
    name: "00 Light Champagne",
    colorHex: "#cba791",
    imageUrl: `${IMG}/G/H/GHLP-00_3.jpeg`,
    position: 0,
  },
  {
    name: "01 Warm Beige Glow",
    colorHex: "#a68976",
    imageUrl: `${IMG}/G/H/GHLP-01_3.jpeg`,
    position: 1,
  },
  {
    name: "08 Golden Champagne",
    colorHex: "#b89278",
    imageUrl: "https://beautyfree.gr/12047-large_default/grigi-highlighter-powder.jpg",
    position: 2,
  },
  {
    name: "104 Rose Gold Shimmer",
    colorHex: "#c1967b",
    imageUrl:
      "https://epharmadora.com/mediastream/w640/files/products/a3352ae951bcbc9664e08c75c5c17338.jpeg.jpg",
    position: 3,
  },
];

/** Product gallery — official pack shots + beauty-net reference. */
const PRODUCT_IMAGES = [
  `${IMG}/G/H/GHLP-00_3.jpeg`,
  `${IMG}/G/H/GHLP-01_3.jpeg`,
  "https://www.beauty-net.gr/wp-content/uploads/2021/04/gRIGI-00.jpeg",
  "https://beautyfree.gr/12047-large_default/grigi-highlighter-powder.jpg",
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
    subcategoryId: HIGHLIGHTER,
    tertiaryCategoryId: POWDER_HIGHLIGHTER,
    subcategoryIds: [HIGHLIGHTER],
    tertiaryCategoryIds: [POWDER_HIGHLIGHTER],
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
  console.log(`  Category: Makeup → Highlighter → Powder Highlighter`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
