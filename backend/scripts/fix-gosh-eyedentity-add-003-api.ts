/**
 * Add Eyedentity 003 Be Happy shade + fix shade barcodes/order.
 * Product: GOSH Copenhagen - Eyedentity Eyeshadow Palette (8036296c-...)
 * Usage: npx tsx scripts/fix-gosh-eyedentity-add-003-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "8036296c-3c23-49b2-b402-9474a1b849a0";
const CDN = "https://goshcopenhagen.com/cdn/shop/files";

const NEW_SHADE = {
  name: "003 Be Happy",
  colorHex: "#e3b9aa",
  imageUrl: `${CDN}/5711914157203_1.jpg`,
  position: 1,
};

/** All 6 palettes in order; hex from official images. */
const TARGET_SHADES = [
  { name: "001 Be Honest", colorHex: "#844848", imageUrl: `${CDN}/5711914157104.jpg`, position: 0 },
  NEW_SHADE,
  { name: "004 Be Here", colorHex: "#fce4cc", imageUrl: `${CDN}/5711914174699_3.jpg`, position: 2 },
  { name: "005 Be Hopeful", colorHex: "#e4d8cc", imageUrl: `${CDN}/5711914174743_3.jpg`, position: 3 },
  { name: "006 Be Harmless", colorHex: "#c0846c", imageUrl: `${CDN}/5711914199012.jpg`, position: 4 },
  { name: "007 Be Honey", colorHex: "#e4ccc0", imageUrl: `${CDN}/5711914210564.jpg`, position: 5 },
];

const DESCRIPTION_AR =
  "باليت Eyedentity من كوش — باليت ظل عيون يحتوي 9 ألوان قابلة للبناء بمزيج من الدرجات المطفية واللامعة والمعدنية.\n\n" +
  "• 9 ظلال في كل باليت — سهلة المزج والدمج.\n" +
  "• صبغة ممتازة وتغطية قابلة للبناء من نهار إلى ليل.\n" +
  "• حجم عملي مناسب للسفر.\n" +
  "• خالٍ من العطر — نباتي (Vegan).\n" +
  "• 6 باليتات: 001 Be Honest و003 Be Happy و004 Be Here و005 Be Hopeful و006 Be Harmless و007 Be Honey.";

const DESCRIPTION_EN =
  "GOSH Copenhagen Eyedentity Eyeshadow Palette — 9 buildable eyeshadows per palette with matte, shimmer and metallic finishes.\n\n" +
  "• Easy to mix and blend with excellent colour intensity.\n" +
  "• Create unique day-to-night looks on the go.\n" +
  "• Compact palette perfect for travel.\n" +
  "• Fragrance-free and vegan.\n" +
  "• 6 palettes: 001 Be Honest, 003 Be Happy, 004 Be Here, 005 Be Hopeful, 006 Be Harmless and 007 Be Honey.";

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

function shadeKey(name: string): string {
  return name.trim().toLowerCase();
}

async function main() {
  await login();
  console.log("Logged in.\n");

  const product = await api<{
    nameEn?: string;
    shades?: Array<{ name: string; colorHex?: string; barcode?: string; imageId?: string; position?: number }>;
    imageIds?: string[];
  }>(`/products/${PRODUCT_ID}`);

  console.log(`Product: ${product.nameEn}`);
  console.log("Before:");
  for (const s of product.shades ?? []) {
    console.log(`  [${s.position}] ${s.name} → ${s.colorHex} | barcode: ${s.barcode ?? "none"}`);
  }

  const imageByKey = new Map<string, string>();
  for (const s of product.shades ?? []) {
    imageByKey.set(shadeKey(s.name), s.imageId ?? "");
  }

  const shades = [];
  for (const target of TARGET_SHADES) {
    let imageId = imageByKey.get(shadeKey(target.name));
    if (!imageId) {
      console.log(`  uploading image for ${target.name}...`);
      imageId = await uploadImage(target.imageUrl, target.name);
    }
    shades.push({
      name: target.name,
      colorHex: target.colorHex,
      imageId,
      position: target.position,
      stock: 0,
    });
  }

  shades.sort((a, b) => a.position - b.position);

  await api(`/products/${PRODUCT_ID}`, "PATCH", {
    descriptionAr: DESCRIPTION_AR,
    descriptionEn: DESCRIPTION_EN,
    shades,
    imageIds: shades.map((s) => s.imageId),
  });

  const verify = await api<{
    shades?: Array<{ name: string; colorHex?: string; barcode?: string; position?: number }>;
  }>(`/products/${PRODUCT_ID}`);

  console.log("\nAfter:");
  for (const s of verify.shades ?? []) {
    const bc = s.barcode ? ` | barcode: ${s.barcode}` : " | no shade barcode";
    console.log(`  [${s.position}] ${s.name} → ${s.colorHex}${bc}`);
  }
  console.log(`\n✓ Added 003 Be Happy — ${verify.shades?.length ?? 0} shades total`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
