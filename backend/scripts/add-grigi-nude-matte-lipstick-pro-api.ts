/**
 * Grigi Nude Matte Lipstick Pro — 9 nude matte stick shades (4.5 g).
 * Sources: grigi.gr (official names, images), mysofi.gr (full shade list)
 * Product barcode: 5207042151010 (101 Nude Pink)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-grigi-nude-matte-lipstick-pro-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIPSTICK = "eaa06284-281e-475f-937b-b01ee24192df";

const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

const PRODUCT = {
  barcode: "5207042151010",
  slug: "grigi-nude-matte-lipstick-pro",
  sku: "GRG-GNMLP",
  price: 8500,
  nameAr: "كريجي - أحمر شفاه نود مطفي Nude Matte Lipstick Pro",
  nameEn: "Grigi - Nude Matte Lipstick Pro",
  descriptionAr:
    "أحمر شفاه نود مطفي Nude Matte Lipstick Pro من كريجي — تركيبة مطفية ناعة بدرجات نود متنوعة تناسب كل لون بشرة، بحجم 4.5 غ.\n\n" +
    "• تركيبة Matte Powder غنية بالصبغة بلمسة مخملية حريرية.\n" +
    "• ألوان نود مطفية بثبات طويل دون جفاف الشفاه.\n" +
    "• ينزلق بسلاسة ويُوحّد لون الشفاه بشكل مثالي.\n" +
    "• 9 درجات نود: من الوردي الطبيعي والكاراميل إلى الخمري والبني البنفسجي.\n" +
    "• طبّقي من منتصف الشفة العليا نحو الزوايا ثم كرّري على الشفة السفلى.\n" +
    "• للحصول على حواف دقيقة، حدّدي الشفاه بقلم من نفس الدرجة.\n" +
    "• صنع في اليونان.",
  descriptionEn:
    "Grigi Nude Matte Lipstick Pro — soft matte formula in versatile nude shades to complement every skin tone, in a 4.5 g stick.\n\n" +
    "• Highly pigmented Matte Powder formula with a silky, velvety feel.\n" +
    "• Nude matte colours with long-lasting wear and no dryness.\n" +
    "• Glides on smoothly for even, comfortable lip coverage.\n" +
    "• 9 nude shades from natural pink and caramel to berry and brown-purple tones.\n" +
    "• Apply from the centre of the upper lip outward, then repeat on the lower lip.\n" +
    "• For defined edges, line lips with a matching lip pencil.\n" +
    "• Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from grigi.gr / mysofi.gr; hex sampled from official g/s/gsnml-XXX images. */
const SHADES: ShadeInput[] = [
  { name: "101 Nude Pink", colorHex: "#dbb1b1", imageUrl: `${IMG}/g/s/gsnml-101_1_1.jpg`, position: 0 },
  { name: "102 Nude", colorHex: "#dbb7b1", imageUrl: `${IMG}/g/s/gsnml-102_1_1.jpg`, position: 1 },
  { name: "105 Dark Nude Caramel", colorHex: "#996357", imageUrl: `${IMG}/g/s/gsnml-105_1_1.jpg`, position: 2 },
  { name: "106 Nude Mauve", colorHex: "#8d5d57", imageUrl: `${IMG}/g/s/gsnml-106_1_1.jpg`, position: 3 },
  { name: "107 Dark Nude Rose Light", colorHex: "#dba5b1", imageUrl: `${IMG}/g/s/gsnml-107_1_1.jpg`, position: 4 },
  { name: "108 Dark Nude Rose", colorHex: "#874551", imageUrl: `${IMG}/g/s/gsnml-108_1_1.jpg`, position: 5 },
  { name: "109 Nude Brown Purple", colorHex: "#9f6f63", imageUrl: `${IMG}/g/s/gsnml-109.jpg`, position: 6 },
  { name: "110 Nude Brown", colorHex: "#936957", imageUrl: `${IMG}/g/s/gsnml-110_1_1.jpg`, position: 7 },
  { name: "111 Nude Brown", colorHex: "#b78775", imageUrl: `${IMG}/g/s/gsnml-111_1.jpg`, position: 8 },
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
    tertiaryCategoryId: LIPSTICK,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIPSTICK],
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
  console.log(`  Category: Makeup → Lips → Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
