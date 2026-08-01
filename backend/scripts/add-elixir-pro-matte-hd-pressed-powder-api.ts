/**
 * Elixir Pro Matte HD Pressed Powder — 8 shades (200–207).
 * Sources: beautydirect.gr (images), elixir-ks.com / makeupstores.gr (shade names, price)
 * Usage: npx tsx scripts/add-elixir-pro-matte-hd-pressed-powder-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const POWDER = "828bbfd2-d611-417a-bdca-0f5424a61171";

const IMG = "https://beautydirect.gr/image/catalog/Elixir-Make-Up";

const PRODUCT = {
  slug: "elixir-pro-matte-hd-pressed-powder",
  sku: "ELX-PMP-876",
  price: 5000,
  nameAr: "إليكسير - بودرة مضغوطة برو مات HD",
  nameEn: "Elixir - Pro Matte HD Pressed Powder",
  descriptionAr:
    "بودرة مضغوطة برو مات HD من إليكسير — تمنح بشرة متجانسة ولمسة مطفية خالية من العيوب.\n\n" +
    "• تأثير مطفي موحّد وناعم يثبت المكياج.\n• 8 درجات من 200 إلى 207 تناسب مختلف درجات البشرة.\n• تركيبة مطفية مثالية للبشرة المختلطة والدهنية.\n• تمتص اللمعان الزائد وثبات طويل.\n• خالية من البارابين — 9 غ.\n• صُنع في أوروبا.",
  descriptionEn:
    "Elixir Pro Matte HD Pressed Powder — uniform, flawless matte finish for a smooth, refined complexion.\n\n" +
    "• Even matte effect that sets makeup and refines the look.\n• 8 shades from 200 to 207 to match different skin tones.\n• Matte formula ideal for combination and oily skin.\n• Absorbs excess shine with long-lasting wear.\n• Paraben-free — 9 g.\n• Made in Europe.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "200 Milky Sweet", colorHex: "#F0E0D0", imageUrl: `${IMG}/Elixir-Make-Up-Pro-Matte-Pressed-Powder-HD-200-Milky-Sweet.jpg`, position: 0 },
  { name: "201 Vanilla Ice", colorHex: "#EDDCC8", imageUrl: `${IMG}/Elixir-Make-Up-Pro-Matte-Pressed-Powder-HD-201-Vanilla-Ice.jpg`, position: 1 },
  { name: "202 Coconut Silk", colorHex: "#E5CFBA", imageUrl: `${IMG}/Elixir-Make-Up-Pro-Matte-Pressed-Powder-HD-202-Coconut-Silk.jpg`, position: 2 },
  { name: "203 Smooth Cocoa", colorHex: "#D4B896", imageUrl: `${IMG}/Elixir-Make-Up-Pro-Matte-Pressed-Powder-HD-203-Smooth-Cocoa.jpg`, position: 3 },
  { name: "204 Latte Coffee", colorHex: "#C4A882", imageUrl: `${IMG}/Elixir-Make-Up-Pro-Matte-Pressed-Powder-HD-204-Latte-Coffee.jpg`, position: 4 },
  { name: "205 Choco Love", colorHex: "#B08968", imageUrl: `${IMG}/Elixir-Make-Up-Pro-Matte-Pressed-Powder-HD-205-Choco-Love.jpg`, position: 5 },
  { name: "206 Cookie Dust", colorHex: "#A67B5B", imageUrl: `${IMG}/Elixir-Make-Up-Pro-Matte-Pressed-Powder-HD-206-Cookie-Dust.jpg`, position: 6 },
  { name: "207 Light Brown", colorHex: "#8B6649", imageUrl: `${IMG}/Elixir-Make-Up-Pro-Matte-Pressed-Powder-HD-207-Light-Brown.jpg`, position: 7 },
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
    brandAr: "إليكسير",
    brandEn: "Elixir",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Elixir brand");
  console.log(`Brand: Elixir (${brandId})${resolved.created ? " [created]" : ""}\n`);
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
    await new Promise((r) => setTimeout(r, 500));
  }

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [POWDER],
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
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Category: Makeup → Face → Powder`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
