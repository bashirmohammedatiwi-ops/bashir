/**
 * GOSH Copenhagen Concealer High Coverage — 6 shades.
 * Source: goshcopenhagen.com + POS (004 Natural barcode 5711914189938)
 * Product barcode: 5711914189938 (004 Natural)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-gosh-concealer-high-coverage-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";

const CDN = "https://goshcopenhagen.com/cdn/shop/files";

const PRODUCT = {
  barcode: "5711914189938",
  slug: "gosh-concealer-high-coverage",
  sku: "GSH-CON-189938",
  price: 13500,
  originalPrice: 15000,
  nameAr: "كوش - كونسيلر Concealer عالي التغطية",
  nameEn: "GOSH Copenhagen - Concealer High Coverage",
  descriptionAr:
    "كونسيلر Concealer High Coverage من كوش — منتج أساسي يخفي العيوب والهالات تحت العين بلمسة طبيعية خالية من العيوب.\n\n" +
    "• تغطية عالية تُخفي كل الشوائب.\n" +
    "• يُخفي الهالات ويملأ الخطوط الدقيقة والتجاعيد.\n" +
    "• ثبات طويل ولمسة مشرقة خالية من العيوب.\n" +
    "• سهل التطبيق بفضل الأداة الناعمة.\n" +
    "• خالٍ من العطر — نباتي (Vegan) — معتمد Allergy Certified.\n" +
    "• 6 درجات: 001 Porcelain و002 Ivory و003 Sand و004 Natural و005 Tawny و006 Honey.",
  descriptionEn:
    "GOSH Copenhagen Concealer High Coverage — a must-have multi-product that covers imperfections and dark under-eye circles.\n\n" +
    "• High coverage that covers every blemish.\n" +
    "• Conceals dark circles, fills in fine lines and wrinkles.\n" +
    "• Long-lasting with a radiant, flawless finish.\n" +
    "• Easy to apply with a soft applicator.\n" +
    "• Fragrance-free and vegan — Allergy Certified.\n" +
    "• 6 shades: 001 Porcelain, 002 Ivory, 003 Sand, 004 Natural, 005 Tawny and 006 Honey.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from goshcopenhagen.com; hex sampled from official product images. */
const SHADES: ShadeInput[] = [
  {
    name: "001 Porcelain",
    colorHex: "#e8ddd2",
    imageUrl: `${CDN}/5711914189785_2_b1754405-a8aa-4aff-b2d6-2248010f1ee6.jpg`,
    position: 0,
  },
  { name: "002 Ivory", colorHex: "#e0d2c3", imageUrl: `${CDN}/5711914189853_1.jpg`, position: 1 },
  { name: "003 Sand", colorHex: "#d4c3b3", imageUrl: `${CDN}/5711914189884_1.jpg`, position: 2 },
  { name: "004 Natural", colorHex: "#cfb6a3", imageUrl: `${CDN}/5711914189938_1.jpg`, position: 3 },
  { name: "005 Tawny", colorHex: "#cdb2a2", imageUrl: `${CDN}/5711914189983_1.jpg`, position: 4 },
  { name: "006 Honey", colorHex: "#c2a898", imageUrl: `${CDN}/5711914190033_1.jpg`, position: 5 },
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
    brandAr: "كوش",
    brandEn: "GOSH Copenhagen",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve GOSH Copenhagen brand");
  console.log(`Brand: GOSH Copenhagen (${brandId})${resolved.created ? " [created]" : ""}\n`);
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
    if (attempt >= 3) throw err;
    await new Promise((r) => setTimeout(r, attempt * 800));
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
    await new Promise((r) => setTimeout(r, 300));
  }

  shades.sort((a, b) => a.position - b.position);
  const imageIds = shades.map((s) => s.imageId);

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: CONCEALER,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [CONCEALER],
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

  const verify = await api<{ shades?: Array<{ name: string; colorHex?: string; barcode?: string }> }>(
    `/products/${created.id}`,
  );

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD (was ${PRODUCT.originalPrice})`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  for (const s of verify.shades ?? []) {
    const bc = s.barcode ? ` | barcode: ${s.barcode}` : "";
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}${bc}`);
  }
  console.log(`  Category: Makeup → Face → Concealer`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
