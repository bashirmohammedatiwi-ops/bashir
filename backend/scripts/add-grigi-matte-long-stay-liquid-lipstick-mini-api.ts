/**
 * Grigi Matte Long Stay Liquid Lipstick Mini — 22 shades (2 ml).
 * Sources: grigi.gr (official names, images, swatch colors)
 * Product barcode: 5207042390020 (shade 02 Dark Nude Rose)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-grigi-matte-long-stay-liquid-lipstick-mini-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIQUID_LIPSTICK = "b53dd3be-ae16-47a4-a306-238f2060b8d8";

const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

const PRODUCT = {
  barcode: "5207042390020",
  slug: "grigi-matte-long-stay-liquid-lipstick-mini",
  sku: "GRG-MLSLM",
  price: 6500,
  nameAr: "كريجي - أحمر شفاه سائل مطفي Matte Long Stay ميني",
  nameEn: "Grigi - Matte Long Stay Liquid Lipstick Mini",
  descriptionAr:
    "أحمر شفاه سائل مطفي Matte Long Stay ميني من كريجي — تركيبة غنية بلون كامل وتغطية مطفية أنيقة بحجم عملي 2 مل.\n\n" +
    "• لون غني ثابت طوال اليوم مع تأثير مطفي ناعم.\n" +
    "• قوام مخملي مرن ينزلق بسلاسة على الشفاه دون تشقق.\n" +
    "• مُعزّز بفيتامين E لترطيب وتجديد الشفاه.\n" +
    "• حجم ميني خفيف — مثالي للحقيبة والسفر.\n" +
    "• 22 درجة: نود، وردي، مرجاني، أحمر، بنفسجي، بني والمزيد.\n" +
    "• طبّقي من منتصف الشفة العليا نحو الزوايا ثم كرّري على الشفة السفلى.\n" +
    "• صنع في اليونان.",
  descriptionEn:
    "Grigi Matte Long Stay Liquid Lipstick Mini — rich formula with full coverage and an elegant matte finish in a practical 2 ml size.\n\n" +
    "• Rich long-wearing colour with a soft matte effect.\n" +
    "• Flexible velvety texture glides on smoothly without cracking.\n" +
    "• Enriched with vitamin E to moisturise and regenerate lips.\n" +
    "• Compact mini size — ideal for your bag and travel.\n" +
    "• 22 shades: nude, pink, coral, red, purple, brown and more.\n" +
    "• Apply from the centre of the upper lip outward, then repeat on the lower lip.\n" +
    "• Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from grigi.gr; hex from full-size swatches or mini texture/pan sampling. */
const SHADES: ShadeInput[] = [
  { name: "02 Dark Nude Rose", colorHex: "#b67879", imageUrl: `${IMG}/g/o/gomlspll-mini-02.jpg`, position: 0 },
  { name: "03 Nude", colorHex: "#cd8a86", imageUrl: `${IMG}/g/o/gomlspll-mini-03.jpg`, position: 1 },
  { name: "04 Nude Pink", colorHex: "#c58581", imageUrl: `${IMG}/g/o/gomlspll-mini-04.jpg`, position: 2 },
  { name: "05 Nude Purple", colorHex: "#b97580", imageUrl: `${IMG}/g/o/gomlspll-mini-05.jpg`, position: 3 },
  { name: "06 Dark Natural Pink", colorHex: "#d27888", imageUrl: `${IMG}/g/o/gomlspll-mini-06.jpg`, position: 4 },
  { name: "07 Bordeaux", colorHex: "#885964", imageUrl: `${IMG}/g/o/gomlspll-mini-07.jpg`, position: 5 },
  { name: "11 Coral Deep", colorHex: "#bf5757", imageUrl: `${IMG}/g/o/gomlspll-mini-11_1.jpg`, position: 6 },
  { name: "15 Dark Nude", colorHex: "#9e7d82", imageUrl: `${IMG}/g/o/gomlspll-mini-15.jpg`, position: 7 },
  { name: "20 Nude Pink Light", colorHex: "#cc8f88", imageUrl: `${IMG}/g/o/gomlspll-mini-20.jpg`, position: 8 },
  { name: "21 Dark Nude Cherry", colorHex: "#a16166", imageUrl: `${IMG}/g/o/gomlspll-mini-21.jpg`, position: 9 },
  { name: "26 Deep Red", colorHex: "#c44a57", imageUrl: `${IMG}/g/o/gomlspll-mini-26.jpg`, position: 10 },
  { name: "29 Nude Pink Purple", colorHex: "#a8636a", imageUrl: `${IMG}/g/o/gomlspll-mini-29.jpg`, position: 11 },
  { name: "38 Pink Purple", colorHex: "#cf558a", imageUrl: `${IMG}/g/o/gomlspll-mini-38_1.jpg`, position: 12 },
  { name: "39 Watermelon", colorHex: "#d3435b", imageUrl: `${IMG}/g/o/gomlspll-mini-39.jpg`, position: 13 },
  { name: "40 Warm Coral", colorHex: "#cb6a61", imageUrl: `${IMG}/g/o/gomlspll-mini-40.jpg`, position: 14 },
  { name: "41 Nude Neutral", colorHex: "#9c6d69", imageUrl: `${IMG}/g/o/gomlspll-mini-41.jpg`, position: 15 },
  { name: "47 Deep Cherry", colorHex: "#a44652", imageUrl: `${IMG}/g/o/gomlspll-mini-47.jpg`, position: 16 },
  { name: "48 Fuchsia Pink Intense", colorHex: "#b94f98", imageUrl: `${IMG}/g/o/gomlspll-mini-48_1.jpg`, position: 17 },
  { name: "49 Red Watermelon Intense", colorHex: "#d44654", imageUrl: `${IMG}/g/o/gomlspll-mini-49.jpg`, position: 18 },
  { name: "51 Nude Coral Brown", colorHex: "#995a55", imageUrl: `${IMG}/g/o/gomlspll-mini-51.jpg`, position: 19 },
  { name: "405 Metallic Cinnamon", colorHex: "#9e4a3f", imageUrl: `${IMG}/g/o/gomlspll-mini-405.jpg`, position: 20 },
  { name: "408 Dark Brown", colorHex: "#6b5348", imageUrl: `${IMG}/g/o/gomlspll-mini-408.jpg`, position: 21 },
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

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIQUID_LIPSTICK,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIQUID_LIPSTICK],
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
    shades?: Array<{ name: string; barcode?: string; colorHex?: string }>;
    nameAr?: string;
    nameEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
  }>(`/products/${created.id}`);

  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

  if (!verify.nameAr || !verify.nameEn || !verify.descriptionAr || !verify.descriptionEn) {
    throw new Error("Missing bilingual copy after create");
  }

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Lips → Liquid Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
