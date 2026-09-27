/**
 * Deborah 24Ore Color Power Eyeshadow — 16 shades (01–16).
 * Source: deborahmilano.com (verified names, images, description)
 * Product barcode: 8009518386554 (02 Light Gold)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-24ore-color-power-eyeshadow-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYESHADOW = "07f14763-7a8b-4646-a057-8748e2b18bd4";

const DM21 = "https://www.deborahmilano.com/en/wp-content/uploads/2021/01";
const DM25 = "https://www.deborahmilano.com/en/wp-content/uploads/2025/09";

const PRODUCT = {
  barcode: "8009518386554",
  slug: "deborah-24ore-color-power-eyeshadow",
  sku: "DBR-CP-MDV010684",
  price: 13500,
  nameAr: "ديبورا ميلانو - ظل عيون 24Ore Color Power",
  nameEn: "Deborah Milano - 24Ore Color Power Eyeshadow",
  descriptionAr:
    "24Ore Color Power Eyeshadow من ديبورا ميلانo — ظل عيون stick بألوان luminous، waterproof وNo Transfer.\n\n" +
    "• تركيبة كريمية سهلة التطبيق بلف واحد — ثبات حتى 24 ساعة.\n" +
    "• قلم jumbo twist-up مع temperino مدمج في القاعدة.\n" +
    "• درجات matte وmetallic — 16 درجة من Champagne إلى Ocean Blue.\n" +
    "• الدرجات الداكنة تصلح كـ eyeliner — الفاتحة كـ highlight.\n" +
    "• 1.4g.\n" +
    "• خاضع للاختبار الجلدي والعيون.",
  descriptionEn:
    "Deborah Milano 24Ore Color Power Eyeshadow — intense, luminous eye shadow stick with waterproof, transfer-proof wear.\n\n" +
    "• Creamy twist-up jumbo pencil glides on in one soft swipe.\n" +
    "• Built-in sharpener at the base for extra-precise application.\n" +
    "• Matte and metallic shades — 16 colours from Champagne to Ocean Blue.\n" +
    "• Darker shades double as eyeliner; lighter shades as highlights.\n" +
    "• 1.4 g.\n" +
    "• Dermatologist and ophthalmologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com; hex sampled from center pigment region of each shade image. */
const SHADES: ShadeInput[] = [
  { name: "01 Champagne", colorHex: "#e6c4b9", imageUrl: `${DM21}/010683-OMBRETTO-24ORE-COLOR-POWER-600x600.jpg`, position: 0 },
  { name: "03 Rose Bronze", colorHex: "#c37f71", imageUrl: `${DM21}/010685-OMBRETTO-24ORE-COLOR-POWER-600x600.jpg`, position: 2 },
  { name: "04 Warm Brown", colorHex: "#c18c73", imageUrl: `${DM21}/010686-OMBRETTO-24ORE-COLOR-POWER-600x600.jpg`, position: 3 },
  { name: "05 Brown", colorHex: "#362c2a", imageUrl: `${DM21}/010687-OMBRETTO-24ORE-COLOR-POWER-600x600.jpg`, position: 4 },
  { name: "06 Golden Green", colorHex: "#94a69e", imageUrl: `${DM21}/010688-OMBRETTO-24ORE-COLOR-POWER-600x600.jpg`, position: 5 },
  { name: "07 Light Blue", colorHex: "#b4c8e5", imageUrl: `${DM21}/010689-OMBRETTO-24ORE-COLOR-POWER-600x600.jpg`, position: 6 },
  { name: "08 Deep Purple", colorHex: "#5a3f66", imageUrl: `${DM21}/010691-OMBRETTO-24ORE-COLOR-POWER-600x600.jpg`, position: 7 },
  { name: "09 Night Blue", colorHex: "#6875a2", imageUrl: `${DM21}/MDV000121-OMBRETTO-24ORE-COLOR-POWER-600x600.jpg`, position: 8 },
  { name: "10 Mat Black", colorHex: "#191919", imageUrl: `${DM21}/MDV000221-OMBRETTO-24ORE-COLOR-POWER-600x600.jpg`, position: 9 },
  { name: "11 Intense Taupe", colorHex: "#705950", imageUrl: `${DM25}/MDV012125_ombretto-24H-color-power-11.png`, position: 10 },
  { name: "12 Brown", colorHex: "#472920", imageUrl: `${DM25}/MDV012225_ombretto-24H-color-power-12.png`, position: 11 },
  { name: "13 Military Green", colorHex: "#545446", imageUrl: `${DM25}/MDV012325_ombretto-24H-color-power-13.png`, position: 12 },
  { name: "14 Burnt Sienna", colorHex: "#77323c", imageUrl: `${DM25}/MDV012425_ombretto-24H-color-power-14.png`, position: 13 },
  { name: "15 Soft Rose", colorHex: "#cfa199", imageUrl: `${DM25}/MDV012525_ombretto-24H-color-power-15.png`, position: 14 },
  { name: "16 Ocean Blue", colorHex: "#3a515c", imageUrl: `${DM25}/MDV012625_ombretto-24H-color-power-16.png`, position: 15 },
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
    brandAr: "ديبورا",
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

  console.log("Uploading shade images (parallel)...");
  const shades = await Promise.all(
    SHADES.map(async (shade) => {
      const imageId = await uploadImage(shade.imageUrl, shade.name);
      console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
      return {
        name: shade.name,
        colorHex: shade.colorHex,
        imageId,
        position: shade.position,
        stock: 0,
      };
    }),
  );

  shades.sort((a, b) => a.position - b.position);
  const imageIds = shades.map((s) => s.imageId);

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    subcategoryIds: [EYES],
    tertiaryCategoryIds: [EYESHADOW],
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

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Category: Makeup → Eyes → Eyeshadow`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
