/**
 * Deborah Milano Red Mat Lipstick — 20 shades.
 * Source: deborahmilano.com (verified names, images, barcodes for product-level only)
 * Product barcode: 8009518419481 (37 Caramel)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-milano-red-mat-lipstick-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIPSTICK = "eaa06284-281e-475f-937b-b01ee24192df";

const DM = "https://www.deborahmilano.com/en/wp-content/uploads";

const PRODUCT = {
  barcode: "8009518419481",
  slug: "deborah-milano-red-mat-lipstick",
  sku: "DBR-MRM-90500",
  price: 14000,
  nameAr: "ديبورا ميلانو - أحمر شفاه مطفي Milano Red Mat",
  nameEn: "Deborah Milano - Milano Red Mat Lipstick",
  descriptionAr:
    "Milano Red Mat من ديبورا ميلانو — أحمر شفاه خفيف فائق الراحة بلمسة مطفية مخملية.\n\n" +
    "• غني بمستخلص Avocado وCollagen وHyaluronic Acid لشفاه مرطبة.\n" +
    "• تغطية كاملة بلون نقي يدوم حتى 8 ساعات.\n" +
    "• 20 درجة: من Blooming Pink إلى Caramel وFire Red.\n" +
    "• خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano Milano Red Mat Lipstick — ultra-comfortable lightweight lipstick for a velvety matte finish.\n\n" +
    "• Enriched with Avocado extracts, collagen and Hyaluronic Acid so lips won't dry out.\n" +
    "• Full-colour coverage that lasts for up to 8 hours.\n" +
    "• 20 shades from Blooming Pink to Caramel and Fire Red.\n" +
    "• Dermatologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com select labels; hex sampled from each shade image. */
const SHADES: ShadeInput[] = [
  { name: "01 Blooming Pink", colorHex: "#e84868", imageUrl: `${DM}/2021/01/009969-Milano-Red-Mat-600x544.jpg`, position: 0 },
  { name: "02 Dark Brown", colorHex: "#784840", imageUrl: `${DM}/2021/01/009970-Milano-Red-Mat-600x544.jpg`, position: 1 },
  { name: "03 Geranium", colorHex: "#c85058", imageUrl: `${DM}/2021/01/009971-Milano-Red-Mat-600x544.jpg`, position: 2 },
  { name: "05 Deep Red", colorHex: "#a02040", imageUrl: `${DM}/2021/01/009973-Milano-Red-Mat-600x544.jpg`, position: 3 },
  { name: "07 Pink Brick", colorHex: "#a04050", imageUrl: `${DM}/2021/01/009975-Milano-Red-Mat-600x544.jpg`, position: 4 },
  { name: "17 First Kiss", colorHex: "#a86070", imageUrl: `${DM}/2021/01/009980-Milano-Red-Mat-600x544.jpg`, position: 5 },
  { name: "26 Nude Skin", colorHex: "#986858", imageUrl: `${DM}/2021/01/009981-Milano-Red-Mat-600x544.jpg`, position: 6 },
  { name: "29 Nude Brown", colorHex: "#a07870", imageUrl: `${DM}/2021/01/009982-Milano-Red-Mat-600x544.jpg`, position: 7 },
  { name: "30 Nude Rose", colorHex: "#a05850", imageUrl: `${DM}/2021/01/009972-Milano-Red-Mat-600x544.jpg`, position: 8 },
  { name: "31 Berry Me", colorHex: "#981858", imageUrl: `${DM}/2021/01/009974-Milano-Red-Mat-600x544.jpg`, position: 9 },
  { name: "32 Rusty Red", colorHex: "#b83830", imageUrl: `${DM}/2021/01/009976-Milano-Red-Mat-600x544.jpg`, position: 10 },
  { name: "33 Timeless Red", colorHex: "#d02848", imageUrl: `${DM}/2021/01/009977-Milano-Red-Mat-600x544.jpg`, position: 11 },
  { name: "34 Red In Winter", colorHex: "#b82048", imageUrl: `${DM}/2021/01/009978-Milano-Red-Mat-600x544.jpg`, position: 12 },
  { name: "35 Wine", colorHex: "#783848", imageUrl: `${DM}/2021/01/009979-Milano-Red-Mat-600x544.jpg`, position: 13 },
  { name: "36 Brown", colorHex: "#906050", imageUrl: `${DM}/2023/03/MDV000823_rossetto-milano-red-mat_36-600x600.jpg`, position: 14 },
  { name: "37 Caramel", colorHex: "#a86050", imageUrl: `${DM}/2023/03/MDV000923_rossetto-milano-red-mat_37-600x600.jpg`, position: 15 },
  { name: "38 Terracotta", colorHex: "#a85850", imageUrl: `${DM}/2023/03/MDV001023_rossetto-milano-red-mat_38-600x600.jpg`, position: 16 },
  { name: "39 Nude Tan", colorHex: "#884850", imageUrl: `${DM}/2023/03/MDV001123_rossetto-milano-red-mat_39-600x600.jpg`, position: 17 },
  { name: "40 Dusty Rose", colorHex: "#883850", imageUrl: `${DM}/2023/03/MDV001223_rossetto-milano-red-mat_40-600x600.jpg`, position: 18 },
  { name: "41 Fire Red", colorHex: "#c81840", imageUrl: `${DM}/2023/03/MDV001323_rossetto-milano-red-mat_41-600x600.jpg`, position: 19 },
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

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Category: Makeup → Lips → Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
