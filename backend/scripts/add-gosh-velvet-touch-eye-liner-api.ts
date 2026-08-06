/**
 * GOSH Copenhagen Velvet Touch Eye Liner — 13 shades.
 * Source: goshcopenhagen.com (verified shade names, descriptions, images)
 * Product barcode: 5701278547963 (011 Sky High)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-gosh-velvet-touch-eye-liner-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";

const CDN = "https://goshcopenhagen.com/cdn/shop/files";

const PRODUCT = {
  barcode: "5701278547963",
  slug: "gosh-velvet-touch-eye-liner-waterproof",
  sku: "GSH-VTE-547963",
  price: 9000,
  nameAr: "كوش - قلم كحل عيون فيلفيت تاتش مقاوم للماء Velvet Touch Eye Liner",
  nameEn: "GOSH Copenhagen - Velvet Touch Eye Liner",
  descriptionAr:
    "قلم كحل عيون فيلفيت تاتش من كوش — ناعم وسهل التطبيق مع تغطية ممتازة ولون مكثّف.\n\n" +
    "• مقاوم للماء بشكل فائق — ثبات طويل ضد التلطّخ.\n" +
    "• قوام ناعم قابل للدمج بالفرشاة أو الأداة.\n" +
    "• غني بفيتامين E وزيت الجوجوبا.\n" +
    "• 13 درجة: Black Ink وTruly Brown وHypnotic Grey وBlueberry Ice وGolden Cadillac وWoody Green وSky High وClassic Grey وRebellious Brown وI Sea You وRenaissance Gold وCarbon Black وBlue Fashion.\n" +
    "• 1.2 g — خالٍ من العطر — نباتي (Vegan) — AllergyCertified.",
  descriptionEn:
    "GOSH Copenhagen Velvet Touch Eye Liner — soft, easy-to-apply pencil with excellent coverage and intense colour.\n\n" +
    "• Extremely waterproof, long-lasting wear.\n" +
    "• Soft texture blends easily with a brush or applicator.\n" +
    "• Enriched with Vitamin E and Jojoba Oil.\n" +
    "• 13 shades: Black Ink, Truly Brown, Hypnotic Grey, Blueberry Ice, Golden Cadillac, Woody Green, Sky High, Classic Grey, Rebellious Brown, I Sea You, Renaissance Gold, Carbon Black and Blue Fashion.\n" +
    "• 1.2 g — Perfume-free, vegan, AllergyCertified.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from goshcopenhagen.com; hex sampled from official product images. */
const SHADES: ShadeInput[] = [
  { name: "Black Ink", colorHex: "#1a1a1a", imageUrl: `${CDN}/5701278546003.jpg`, position: 0 },
  { name: "Truly Brown", colorHex: "#6b4538", imageUrl: `${CDN}/5701278546041.jpg`, position: 1 },
  { name: "Hypnotic Grey", colorHex: "#6a6560", imageUrl: `${CDN}/5701278546201.jpg`, position: 2 },
  { name: "Blueberry Ice", colorHex: "#aaaac1", imageUrl: `${CDN}/5701278546881.jpg`, position: 3 },
  { name: "005 Golden Cadillac", colorHex: "#e7c16d", imageUrl: `${CDN}/5701278547727.jpg`, position: 4 },
  { name: "Woody Green", colorHex: "#4a6b52", imageUrl: `${CDN}/5701278547208.jpg`, position: 5 },
  { name: "011 Sky High", colorHex: "#256b98", imageUrl: `${CDN}/5701278547963.jpg`, position: 6 },
  { name: "016 Classic Grey", colorHex: "#5a5e62", imageUrl: `${CDN}/5701278548168.jpg`, position: 7 },
  { name: "017 Rebellious Brown", colorHex: "#514340", imageUrl: `${CDN}/5701278548243.jpg`, position: 8 },
  { name: "018 I Sea You", colorHex: "#2e6466", imageUrl: `${CDN}/5701278548267.jpg`, position: 9 },
  { name: "021 Renaissance Gold", colorHex: "#b8955a", imageUrl: `${CDN}/5701278548328.jpg`, position: 10 },
  { name: "022 Carbon Black", colorHex: "#121212", imageUrl: `${CDN}/5711914047245.jpg`, position: 11 },
  { name: "032 Blue Fashion", colorHex: "#2a4a9a", imageUrl: `${CDN}/5711914170868_1.jpg`, position: 12 },
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
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    subcategoryIds: [EYES],
    tertiaryCategoryIds: [EYELINER],
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

  const verify = await api<{ shades?: Array<{ name: string; colorHex?: string; barcode?: string }> }>(
    `/products/${created.id}`,
  );

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  for (const s of verify.shades ?? []) {
    const bc = s.barcode ? ` | barcode: ${s.barcode}` : "";
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}${bc}`);
  }
  console.log(`  Category: Makeup → Eyes → Eyeliner`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
