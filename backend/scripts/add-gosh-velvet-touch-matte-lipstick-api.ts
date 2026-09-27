/**
 * GOSH Copenhagen Velvet Touch Matte Lipstick — 28 shades (002–034, gaps 001/004/006/018/021/028).
 * Source: goshcopenhagen.com (verified shade names, descriptions, images)
 * Product barcode: 5711914080181 (012 Matt Raisin)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-gosh-velvet-touch-matte-lipstick-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIPSTICK = "eaa06284-281e-475f-937b-b01ee24192df";

const CDN = "https://goshcopenhagen.com/cdn/shop/files";

const PRODUCT = {
  barcode: "5711914080181",
  slug: "gosh-velvet-touch-matte-lipstick",
  sku: "GSH-VTML-080181",
  price: 9500,
  nameAr: "كوش - أحمر شفاه فيلفيت تاتش مات Velvet Touch Matte Lipstick",
  nameEn: "GOSH Copenhagen - Velvet Touch Matte Lipstick",
  descriptionAr:
    "أحمر شفاه فيلفيت تاتش مات من كوش — تركيبة كريمية ناعمة بلون مكثّف ولمسة مات أنيقة تدوم لساعات.\n\n" +
    "• لمسة مات نهائية — صبغة عالية وثبات طويل.\n" +
    "• قوام ناعم وكريمي سهل التطبيق.\n" +
    "• يحتوي على شمع طبيعي وحمض الهيالورونيك لترطيب الشفاه ونعومتها.\n" +
    "• 28 درجة من الوردي والأحمر والبنفسجي والبني إلى الدرجات العصرية مثل Ruby Blush وSunset Vibe وForever Flirty.\n" +
    "• خالٍ من العطر — نباتي (Vegan).",
  descriptionEn:
    "GOSH Copenhagen Velvet Touch Matte Lipstick — creamy, soft formula with intense matte colour and long-lasting wear.\n\n" +
    "• Matte finish with high colour pigmentation.\n" +
    "• Soft, creamy texture for effortless application.\n" +
    "• Natural wax and hyaluronic acid keep lips smooth and moisturised.\n" +
    "• 28 shades from roses and reds to plums, berries and modern tones like Ruby Blush, Sunset Vibe and Forever Flirty.\n" +
    "• Perfume-free and vegan.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from goshcopenhagen.com; hex sampled from official product images. */
const SHADES: ShadeInput[] = [
  { name: "002 Matt Rose", colorHex: "#b25560", imageUrl: `${CDN}/5711914064228.jpg`, position: 0 },
  { name: "003 Matt Antique", colorHex: "#a5685c", imageUrl: `${CDN}/5711914064280.jpg`, position: 1 },
  { name: "005 Matt Classic Red", colorHex: "#b1020f", imageUrl: `${CDN}/5711914064402.jpg`, position: 2 },
  { name: "007 Matt Cherry", colorHex: "#9c283d", imageUrl: `${CDN}/5711914064525.jpg`, position: 3 },
  { name: "008 Matt Plum", colorHex: "#632a3f", imageUrl: `${CDN}/5711914064587.jpg`, position: 4 },
  { name: "009 Matte Sweetness", colorHex: "#fba0ab", imageUrl: `${CDN}/5711914080006.jpg`, position: 5 },
  { name: "010 Matt Smoothie", colorHex: "#aa4847", imageUrl: `${CDN}/5711914080068.jpg`, position: 6 },
  { name: "011 Matt Nougat", colorHex: "#a16d58", imageUrl: `${CDN}/5711914080129.jpg`, position: 7 },
  { name: "012 Matt Raisin", colorHex: "#8d513f", imageUrl: `${CDN}/5711914080181.jpg`, position: 8 },
  { name: "013 Matt Cinnamon", colorHex: "#ae6055", imageUrl: `${CDN}/5711914092955.jpg`, position: 9 },
  { name: "014 Matt Cranberry", colorHex: "#752b31", imageUrl: `${CDN}/5711914093013.jpg`, position: 10 },
  { name: "015 Matt Grape", colorHex: "#6a262b", imageUrl: `${CDN}/5711914093075.jpg`, position: 11 },
  { name: "016 Matt Purple", colorHex: "#7e2479", imageUrl: `${CDN}/5711914093136.jpg`, position: 12 },
  { name: "017 Matt Clove", colorHex: "#393235", imageUrl: `${CDN}/5711914093198.jpg`, position: 13 },
  { name: "019 Matt Angel", colorHex: "#c86b76", imageUrl: `${CDN}/5711914099244.jpg`, position: 14 },
  { name: "020 Matt Pleasure", colorHex: "#e7697f", imageUrl: `${CDN}/5711914099305.jpg`, position: 15 },
  {
    name: "022 Matt Orchid",
    colorHex: "#a77386",
    imageUrl: `${CDN}/5711914099398_f1a6f8e0-75e5-436c-914d-dddd2f877776.jpg`,
    position: 16,
  },
  { name: "023 Matte Chestnut", colorHex: "#834041", imageUrl: `${CDN}/5711914099428.jpg`, position: 17 },
  { name: "024 Matte The Red", colorHex: "#850d0c", imageUrl: `${CDN}/5711914122027.jpg`, position: 18 },
  { name: "025 Matt Spice", colorHex: "#93352d", imageUrl: `${CDN}/5711914137038.jpg`, position: 19 },
  { name: "026 Matt Antique Rose", colorHex: "#a1404c", imageUrl: `${CDN}/5711914136949.jpg`, position: 20 },
  { name: "027 Matt Mauve", colorHex: "#8f3b50", imageUrl: `${CDN}/5711914136970.jpg`, position: 21 },
  { name: "029 Matt Runway Red", colorHex: "#ab1a25", imageUrl: `${CDN}/5711914147303.jpg`, position: 22 },
  { name: "030 Matte Ruby Blush", colorHex: "#b25e5b", imageUrl: `${CDN}/5711914207588.jpg`, position: 23 },
  { name: "031 Matt Indian Summer", colorHex: "#771f28", imageUrl: `${CDN}/5711914207557.jpg`, position: 24 },
  { name: "032 Matt Sunset Vibe", colorHex: "#af6b68", imageUrl: `${CDN}/5711914207496.jpg`, position: 25 },
  { name: "033 Matt Plum Perfection", colorHex: "#935851", imageUrl: `${CDN}/5711914207526.jpg`, position: 26 },
  { name: "034 Matt Forever Flirty", colorHex: "#69363a", imageUrl: `${CDN}/5711914207618.jpg`, position: 27 },
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
  console.log(`  Category: Makeup → Lips → Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
