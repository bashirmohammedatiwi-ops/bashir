/**
 * Elixir Kissproof Lip Mat — 30 matte liquid lipstick shades.
 * Sources: elixirmakeup.gr (official shade names & images, SKU 740-XXX)
 * Shade barcodes intentionally omitted — product-level SKU only.
 * Usage: npx tsx scripts/add-elixir-kissproof-lip-mat-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIQUID_LIPSTICK = "b53dd3be-ae16-47a4-a306-238f2060b8d8";

const IMG = "https://elixirmakeup.gr/wp-content/uploads";

const PRODUCT = {
  slug: "elixir-kissproof-lip-mat",
  sku: "ELX-KPLM-740",
  price: 5000,
  nameAr: "إليكسير - كيسبروف ليب مات أحمر شفاه سائل مطفي",
  nameEn: "Elixir - Kissproof Lip Mat Liquid Lipstick",
  descriptionAr:
    "كيسبروف ليب مات من إليكسير — مجموعة أحمر الشفاه السائل المطفي بـ 30 لوناً فريداً.\n\n" +
    "• يُطبّق بلمسة لامعة ويجفّ خلال ثوانٍ بلمسة مطفية أنيقة.\n• مقاوم للتلطّخ وطويل الأمد.\n• يُنعّم ويُغذّي الشفاه.\n• أداة تطبيق مريحة لرسم دقيق.\n• صُنع في اليونان — 4.5 غ.\n• اختاري من درجات طبيعية نود إلى أحمر جريء.",
  descriptionEn:
    "Elixir Kissproof Lip Mat — liquid matte lipstick collection with 30 unique shades.\n\n" +
    "• Applies like a gloss and dries within seconds to a stunning matte finish.\n• Smudge-proof and long-lasting wear.\n• Smooths and nourishes the lips.\n• Comfortable applicator for precise application.\n• Made in Greece — 4.5 g.\n• Choose from natural nudes to bold reds.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "001 Red Wine", colorHex: "#7B1E2E", imageUrl: `${IMG}/2023/11/740-001.jpg`, position: 0 },
  { name: "002 Love Red", colorHex: "#C41E3A", imageUrl: `${IMG}/2023/11/740-002.jpg`, position: 1 },
  { name: "003 Toffee", colorHex: "#A67B5B", imageUrl: `${IMG}/2023/11/740-003.jpg`, position: 2 },
  { name: "004 Bean Red", colorHex: "#8B3A3A", imageUrl: `${IMG}/2023/11/740-004.jpg`, position: 3 },
  { name: "005 Cocoa", colorHex: "#6B4423", imageUrl: `${IMG}/2023/11/740-005.jpg`, position: 4 },
  { name: "006 Valentine Red", colorHex: "#D4213D", imageUrl: `${IMG}/2023/11/740-006.jpg`, position: 5 },
  { name: "007 Malt", colorHex: "#9E7B6B", imageUrl: `${IMG}/2023/11/740-007.jpg`, position: 6 },
  { name: "008 Peach Melody", colorHex: "#E8A090", imageUrl: `${IMG}/2023/11/740-008.jpg`, position: 7 },
  { name: "009 Tapioca Cream", colorHex: "#D4B8A8", imageUrl: `${IMG}/2023/11/740-009.jpg`, position: 8 },
  { name: "010 Speckletone Wine", colorHex: "#6B3040", imageUrl: `${IMG}/2023/11/740-010.jpg`, position: 9 },
  { name: "011 Milky Chocolate", colorHex: "#7D5A4A", imageUrl: `${IMG}/2023/11/740-011.jpg`, position: 10 },
  { name: "012 Rust", colorHex: "#B55233", imageUrl: `${IMG}/2023/11/740-012.jpg`, position: 11 },
  { name: "013 Irish Cream", colorHex: "#C9A882", imageUrl: `${IMG}/2023/11/740-013.jpg`, position: 12 },
  { name: "014 Almond Joy", colorHex: "#A07858", imageUrl: `${IMG}/2023/11/740-014.jpg`, position: 13 },
  { name: "015 Cranberry", colorHex: "#9B1B30", imageUrl: `${IMG}/2023/12/740-015-new.jpg`, position: 14 },
  { name: "016 Moonshine", colorHex: "#F0E0D8", imageUrl: `${IMG}/2023/11/740-016.jpg`, position: 15 },
  { name: "017 Crimson Silk", colorHex: "#A01030", imageUrl: `${IMG}/2023/12/740-017-new.jpg`, position: 16 },
  { name: "018 Candy Floss", colorHex: "#E8A0B8", imageUrl: `${IMG}/2023/11/740-018.jpg`, position: 17 },
  { name: "019 Guava Jelly", colorHex: "#E87888", imageUrl: `${IMG}/2023/12/740-019-new.jpg`, position: 18 },
  { name: "020 Chilli Red", colorHex: "#D42030", imageUrl: `${IMG}/2023/12/740-020-new.jpg`, position: 19 },
  { name: "021 Indian Red", colorHex: "#8B2020", imageUrl: `${IMG}/2023/12/740-021-new.jpg`, position: 20 },
  { name: "022 Brown Sugar", colorHex: "#9E6848", imageUrl: `${IMG}/2023/12/740-022-new.jpg`, position: 21 },
  { name: "023 Burgundy", colorHex: "#6B1028", imageUrl: `${IMG}/2023/11/740-023.jpg`, position: 22 },
  { name: "024 Bohemian Princess", colorHex: "#C06070", imageUrl: `${IMG}/2023/11/740-024.jpg`, position: 23 },
  { name: "025 Pecan", colorHex: "#8B6840", imageUrl: `${IMG}/2023/12/740-025-new.jpg`, position: 24 },
  { name: "026 Rouge", colorHex: "#C03048", imageUrl: `${IMG}/2023/11/740-026.jpg`, position: 25 },
  { name: "027 Dark Pink", colorHex: "#B03060", imageUrl: `${IMG}/2023/11/740-027.jpg`, position: 26 },
  { name: "028 Chestnut", colorHex: "#6B4030", imageUrl: `${IMG}/2023/11/740-028.jpg`, position: 27 },
  { name: "029 Pine Cone", colorHex: "#5A4038", imageUrl: `${IMG}/2023/12/740-029-new.jpg`, position: 28 },
  { name: "030 Brick Red", colorHex: "#A03028", imageUrl: `${IMG}/2023/12/740-030-new.jpg`, position: 29 },
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
    await new Promise((r) => setTimeout(r, 600));
  }

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    slug: PRODUCT.slug,
    brandId,
    categoryId: CATEGORY_ID,
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
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Category: Makeup → Lips → Liquid Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
