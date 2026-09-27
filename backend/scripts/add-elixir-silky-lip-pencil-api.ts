/**
 * Elixir Silky Lip Pencil — 36 waterproof lip liner shades (026–070).
 * Sources: beautyfree.gr (shade list), elixirmakeup.gr (images SKU 812-XXX), swatch colors from beautyfree.gr
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-elixir-silky-lip-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_LINER = "54e393a9-90bf-41bb-beeb-c5364afce287";

const PRODUCT = {
  slug: "elixir-silky-lip-pencil",
  sku: "ELX-SLP-812",
  price: 2950,
  nameAr: "إليكسير - سيلكي ليب بنسل قلم شفاه",
  nameEn: "Elixir - Silky Lip Pencil",
  descriptionAr:
    "قلم شفاه سيلكي من إليكسير — مُصمّم لتحديد وتشكيل وملء الشفاه بلمسة كريمية ناعمة.\n\n" +
    "• تركيبة كريمية ناعمة تُطبّق بسهولة وتُحدّد الشفاه بدقة.\n• مقاوم للماء وثبات طويل.\n• يُستخدم لتحديد محيط الشفاه أو ملئها بالكامل.\n• 36 درجة من 026 إلى 070.\n• صُنع في اليونان.",
  descriptionEn:
    "Elixir Silky Lip Pencil — lip liner designed to shape, line or fill the lips with a soft creamy texture.\n\n" +
    "• Soft creamy formula applies smoothly for precise lip definition.\n• Waterproof, long-lasting wear.\n• Use to outline lips or fill in for all-over colour.\n• 36 shades from 026 to 070.\n• Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "026 Iris Mauve", colorHex: "#834f5b", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_026_Front.jpg", position: 0 },
  { name: "027 Grape Twist", colorHex: "#5c1d2e", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_027_Front.jpg", position: 1 },
  { name: "028 Coral", colorHex: "#e74e62", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_028_Front.jpg", position: 2 },
  { name: "029 Keepsake Pink", colorHex: "#692a35", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_029_Front.jpg", position: 3 },
  { name: "030 True Red", colorHex: "#9b0b22", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_030_Front.jpg", position: 4 },
  { name: "031 Siena", colorHex: "#ab4f50", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_031_Front.jpg", position: 5 },
  { name: "032 Amaranth Pink", colorHex: "#851e49", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_032_Front.jpg", position: 6 },
  { name: "033 Metallic Coral", colorHex: "#c12d47", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_033_Front.jpg", position: 7 },
  { name: "034 Cerise", colorHex: "#9c364c", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_034_Front.jpg", position: 8 },
  { name: "035 Salmon", colorHex: "#ea9088", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_035_Front.jpg", position: 9 },
  { name: "036 Pink Beige", colorHex: "#ab6275", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_036_Front.jpg", position: 10 },
  { name: "037 Modern Mauve", colorHex: "#764c4d", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_037_Front.jpg", position: 11 },
  { name: "038 Caffe", colorHex: "#b96752", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_038_Front.jpg", position: 12 },
  { name: "039 Light Caramel", colorHex: "#bb6e5a", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_039_Front.jpg", position: 13 },
  { name: "040 Coral Red", colorHex: "#b32c30", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_040_Front.jpg", position: 14 },
  { name: "041 Red Cherry", colorHex: "#982c43", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_041_Front.jpg", position: 15 },
  { name: "042 Marron Red", colorHex: "#471015", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_042_Front.jpg", position: 16 },
  { name: "043 Midnight Mauve", colorHex: "#451b33", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_043_Front.jpg", position: 17 },
  { name: "053 Vermillion Red", colorHex: "#981422", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_053_Front.jpg", position: 18 },
  { name: "054 Luminous Orange", colorHex: "#c51721", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_054_Front.jpg", position: 19 },
  { name: "055 Burgundy", colorHex: "#981a28", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_055_Front.jpg", position: 20 },
  { name: "056 Rouge", colorHex: "#c63d57", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_056_Front.jpg", position: 21 },
  { name: "057 Punch", colorHex: "#ad223f", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_057_Front.jpg", position: 22 },
  { name: "058 Hot Pink", colorHex: "#cf5a8f", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_058_Front.jpg", position: 23 },
  { name: "059 Watermelon", colorHex: "#c9375c", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_059_Front.jpg", position: 24 },
  { name: "060 Rosewood", colorHex: "#802537", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_060_Front.jpg", position: 25 },
  { name: "061 Shiny Flamingo", colorHex: "#ae7e74", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_061_Front.jpg", position: 26 },
  { name: "062 Ceramic Peach", colorHex: "#8c5747", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_062_Front.jpg", position: 27 },
  { name: "063 Golden Copper", colorHex: "#67463d", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_063_Front.jpg", position: 28 },
  { name: "064 Desert Taupe", colorHex: "#885657", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_064_Front.jpg", position: 29 },
  { name: "065 Dark Peawood", colorHex: "#793e3a", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_065_Front.jpg", position: 30 },
  { name: "066 Nude Mauve", colorHex: "#78696c", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_066_Front.jpg", position: 31 },
  { name: "067 Cordowan", colorHex: "#4e1f25", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_067_Front.jpg", position: 32 },
  { name: "068 Peach Club", colorHex: "#9e4050", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_068_Front.jpg", position: 33 },
  { name: "069 Wine Marsala", colorHex: "#412429", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_069_Front.jpg", position: 34 },
  { name: "070 Rose Red", colorHex: "#991c2c", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/Lips_LipPencil_070_Front.jpg", position: 35 },
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
    tertiaryCategoryId: LIP_LINER,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIP_LINER],
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
  console.log(`  Category: Makeup → Lips → Lip Liner`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
