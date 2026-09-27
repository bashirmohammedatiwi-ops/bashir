/**
 * GOSH Copenhagen X-Ceptional Wear Foundation — 10 shades.
 * Source: goshcopenhagen.com + POS (11 Porcelain barcode 5701278601368)
 * Product barcode: 5701278601368 (11 Porcelain)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-gosh-x-ceptional-wear-foundation-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";

const CDN = "https://goshcopenhagen.com/cdn/shop/files";

const PRODUCT = {
  barcode: "5701278601368",
  slug: "gosh-x-ceptional-wear-foundation",
  sku: "GSH-XCW-601368",
  price: 15300,
  originalPrice: 17000,
  nameAr: "كوش - أساس X-Ceptional Wear",
  nameEn: "GOSH Copenhagen - X-Ceptional Wear Foundation",
  descriptionAr:
    "أساس X-Ceptional Wear من كوش — سهل التطبيق بتغطية متوسطة طبيعية بلمسة مطفية تدوم طوال اليوم.\n\n" +
    "• تغطية متوسطة طبيعية لا تجفّف البشرة.\n" +
    "• لمسة مطفية ناعمة تُنعّم البشرة.\n" +
    "• ثبات طويل — مضاد للشيخوخة ومرطّب.\n" +
    "• يحتوي على فيتامين E — مقاوم للماء.\n" +
    "• 10 درجات: 11 Porcelain و12 Natural و14 Sand و16 Golden و18 Sunny و19 Chestnut و20 Caramel و22 Mocha و24 Cappuccino و28 Cinnamon.",
  descriptionEn:
    "GOSH Copenhagen X-Ceptional Wear Foundation — light and easy to apply with medium, natural coverage and a beautiful matte finish.\n\n" +
    "• Medium coverage without drying out the skin.\n" +
    "• Natural matte finish that smooths the skin.\n" +
    "• Long-lasting — anti-aging and moisturising.\n" +
    "• Contains vitamin E — waterproof.\n" +
    "• 10 shades: 11 Porcelain, 12 Natural, 14 Sand, 16 Golden, 18 Sunny, 19 Chestnut, 20 Caramel, 22 Mocha, 24 Cappuccino and 28 Cinnamon.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from goshcopenhagen.com; hex sampled from official swatch images (_1.jpg). */
const SHADES: ShadeInput[] = [
  {
    name: "11 Porcelain",
    colorHex: "#e9d1bd",
    imageUrl: `${CDN}/11_porcelain_gosh_2021-07-09_packshots5773_af377158-e1ce-455f-bfc7-decbc90df94c.jpg`,
    position: 0,
  },
  { name: "12 Natural", colorHex: "#e6c6a9", imageUrl: `${CDN}/12_natural_gosh_2021-07-09_packshots5773.jpg`, position: 1 },
  { name: "14 Sand", colorHex: "#e0b492", imageUrl: `${CDN}/14_sand_gosh_2021-07-09_packshots5773.jpg`, position: 2 },
  { name: "16 Golden", colorHex: "#cda48c", imageUrl: `${CDN}/16_golden_gosh_2021-07-09_packshots5773.jpg`, position: 3 },
  { name: "18 Sunny", colorHex: "#d4a589", imageUrl: `${CDN}/18_sunny_gosh_2021-07-09_packshots5773.jpg`, position: 4 },
  { name: "19 Chestnut", colorHex: "#c18d67", imageUrl: `${CDN}/5701278601405.jpg`, position: 5 },
  { name: "20 Caramel", colorHex: "#ac6d3e", imageUrl: `${CDN}/5701278601443.jpg`, position: 6 },
  { name: "22 Mocha", colorHex: "#9e693d", imageUrl: `${CDN}/5701278601467.jpg`, position: 7 },
  { name: "24 Cappuccino", colorHex: "#9a6d4e", imageUrl: `${CDN}/5701278601481.jpg`, position: 8 },
  { name: "28 Cinnamon", colorHex: "#956f60", imageUrl: `${CDN}/5711914087425.jpg`, position: 9 },
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
  console.log(`  Category: Makeup → Face → Foundation`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
