/**
 * Deborah Fluid Velvet Mat Lipstick — 16 shades.
 * Source: deborahmilano.com (shade names, images, barcodes for product-level only)
 * Product barcode: 8009518276923 (Fire Red 7)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-fluid-velvet-mat-lipstick-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIQUID_LIPSTICK = "b53dd3be-ae16-47a4-a306-238f2060b8d8";

const IMG = "https://www.deborahmilano.com/en/wp-content/uploads";

const PRODUCT = {
  barcode: "8009518276923",
  slug: "deborah-fluid-velvet-mat-lipstick",
  sku: "DBR-FVM-00103J4",
  price: 12500,
  nameAr: "ديبورا ميلانو - روژ سائل مطفي Fluid Velvet Mat",
  nameEn: "Deborah Milano - Fluid Velvet Mat Lipstick",
  descriptionAr:
    "روژ سائل مطفي Fluid Velvet Mat من ديبورا ميلانو — تركيبة مريحة طويلة الأمد ومقاومة للانتقال.\n\n" +
    "• تأثير مطفي أنيق بلمسة ناعمة.\n• أداة تطبيق ناعمة للون دقيق وتحديد مثالي.\n• ثبات يصل إلى 18 ساعة.\n• 16 درجة من النود إلى الأحمر والخمري.\n• خالي من البارابين — 4.5 غ.\n• خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano Fluid Velvet Mat Lipstick — comfortable, long-wearing, transfer-proof liquid matte lipstick.\n\n" +
    "• Elegant matte finish with a velvety feel.\n• Special flocked applicator for precise colour and definition.\n• Wear tested up to 18 hours.\n• 16 shades from nude to red and wine tones.\n• Paraben-free — 4.5 g.\n• Dermatologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "01 Antique Rose", colorHex: "#b5746a", imageUrl: `${IMG}/2021/01/006743-Fluid-Velvet-Mat-Lipstick-600x600.jpg`, position: 0 },
  { name: "02 Romantic Pink", colorHex: "#d4788f", imageUrl: `${IMG}/2021/01/006744-Fluid-Velvet-Mat-Lipstick-600x600.jpg`, position: 1 },
  { name: "06 Iconic Red", colorHex: "#c41230", imageUrl: `${IMG}/2021/01/006749-Fluid-Velvet-Mat-Lipstick-600x600.jpg`, position: 2 },
  { name: "07 Fire Red", colorHex: "#b01020", imageUrl: `${IMG}/2021/01/006750-Fluid-Velvet-Mat-Lipstick-600x600.jpg`, position: 3 },
  { name: "08 Classy Mauve", colorHex: "#8b5a6b", imageUrl: `${IMG}/2021/01/006751-Fluid-Velvet-Mat-Lipstick-600x600.jpg`, position: 4 },
  { name: "09 Purple Wine", colorHex: "#6b2c4a", imageUrl: `${IMG}/2021/01/006752-Fluid-Velvet-Mat-Lipstick-600x600.jpg`, position: 5 },
  { name: "13 Antique Pink", colorHex: "#c48a8a", imageUrl: `${IMG}/2021/01/008493-Fluid-Velvet-Mat-Lipstick-600x600.jpg`, position: 6 },
  { name: "19 Mauve", colorHex: "#9a6678", imageUrl: `${IMG}/2021/01/009310-Fluid-Velvet-Mat-Lipstick-600x600.jpg`, position: 7 },
  { name: "21 Poppy Red", colorHex: "#c9182e", imageUrl: `${IMG}/2021/01/009316-Fluid-Velvet-Mat-Lipstick-600x600.jpg`, position: 8 },
  { name: "22 Terracotta", colorHex: "#b85c42", imageUrl: `${IMG}/2021/01/009317-Fluid-Velvet-Mat-Lipstick-600x600.jpg`, position: 9 },
  { name: "24 Rich Nude", colorHex: "#c4a088", imageUrl: `${IMG}/2023/03/FLUID-VELVET_24-600x600.jpg`, position: 10 },
  { name: "25 Blush Nude", colorHex: "#d4a89a", imageUrl: `${IMG}/2023/03/FLUID-VELVET_25-600x600.jpg`, position: 11 },
  { name: "26 Coral Nude", colorHex: "#d8907a", imageUrl: `${IMG}/2023/03/FLUID-VELVET_26-600x600.jpg`, position: 12 },
  { name: "27 Antique Rose", colorHex: "#b86868", imageUrl: `${IMG}/2023/03/FLUID-VELVET_27-600x600.jpg`, position: 13 },
  { name: "28 Rose", colorHex: "#c87080", imageUrl: `${IMG}/2023/03/FLUID-VELVET_28-600x600.jpg`, position: 14 },
  { name: "29 Deep Rose", colorHex: "#a85060", imageUrl: `${IMG}/2023/03/FLUID-VELVET_29-600x600.jpg`, position: 15 },
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
    brandAr: "ديبورا ميلانو",
    brandEn: "Deborah Milano",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Deborah Milano brand");
  console.log(`Brand: Deborah Milano (${brandId})${resolved.created ? " [created]" : ""}\n`);
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
  console.log(`Shades: ${SHADES.length}\n`);
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
    console.log(`skip — product already exists (${PRODUCT.slug})`);
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
    console.log(`  ✓ ${shade.name}`);
    await new Promise((r) => setTimeout(r, 600));
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

  console.log(`\n✓ Created: ${created.name ?? PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Category: Makeup → Lips → Liquid Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
