/**
 * GOSH Copenhagen Defining Brow Gel — 2 shades with images.
 * Source: goshcopenhagen.com (verified shade names, descriptions, images)
 * Product barcode: 5711914031107 (003 Greybrown)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-gosh-defining-brow-gel-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const EYEBROW_GEL = "a6620b04-09ee-427c-a195-5b0626276fc9";

const CDN = "https://goshcopenhagen.com/cdn/shop/files";

const PRODUCT = {
  barcode: "5711914031107",
  slug: "gosh-defining-brow-gel-8ml",
  sku: "GSH-DBG-031107",
  price: 11250,
  originalPrice: 12500,
  nameAr: "كوش - جل تحديد الحواجب Defining Brow Gel 8 مل",
  nameEn: "GOSH Copenhagen - Defining Brow Gel 8ml",
  descriptionAr:
    "جل تحديد الحواجب Defining Brow Gel من كوش كوبنهاغن — يلوّن ويشكّل ويثبّت الحواجب طوال اليوم بلمسة طبيعية دون لزوجة أو تصلّب.\n\n" +
    "• يحدّد ويرفع ويشكّل الحواجب.\n" +
    "• ثبات طوال اليوم — يروّض الشعيرات المتمردة.\n" +
    "• سهل التطبيق بفرشاة مدمجة.\n" +
    "• يُستخدم وحده أو فوق قلم الحواجب.\n" +
    "• خالٍ من العطر — نباتي (Vegan).\n" +
    "• درجتان: 001 Clear و003 Greybrown.",
  descriptionEn:
    "GOSH Copenhagen Defining Brow Gel — shapes, defines and sets brows all day with a touch of colour and a flexible, non-sticky finish.\n\n" +
    "• Defines, lifts and shapes brows.\n" +
    "• All-day hold — tames unruly brow hairs.\n" +
    "• Easy to apply with built-in brush.\n" +
    "• Use alone or over an eyebrow pencil.\n" +
    "• Fragrance-free and vegan.\n" +
    "• 2 shades: 001 Clear and 003 Greybrown.",
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
    name: "001 Clear",
    colorHex: "#e8e4dc",
    imageUrl: `${CDN}/5701278619202_1_6bb0886d-2cc4-4761-b7b5-f0b6f8b4e6ab.jpg`,
    position: 0,
  },
  {
    name: "003 Greybrown",
    colorHex: "#7a6858",
    imageUrl: `${CDN}/5711914031107_1.jpg`,
    position: 1,
  },
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
    subcategoryId: EYEBROW,
    tertiaryCategoryId: EYEBROW_GEL,
    subcategoryIds: [EYEBROW],
    tertiaryCategoryIds: [EYEBROW_GEL],
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
  console.log(`  Category: Makeup → Eyebrow → Brow Gel`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
