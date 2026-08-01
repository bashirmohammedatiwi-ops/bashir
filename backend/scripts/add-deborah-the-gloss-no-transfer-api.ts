/**
 * Deborah The Gloss No Transfer — 8 shades (01–08).
 * Sources: profumeriemallardo.com + deborahmilano.com (shade names, images, description)
 * Product barcode: 8009518474060 (Berry 07)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-the-gloss-no-transfer-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";

const PRODUCT = {
  barcode: "8009518474060",
  slug: "deborah-the-gloss-no-transfer",
  sku: "DBR-TGN-90500",
  price: 11500,
  nameAr: "ديبورا ميلانو - جلوس شفاه No Transfer The Gloss",
  nameEn: "Deborah Milano - The Gloss No Transfer Lip Gloss",
  descriptionAr:
    "The Gloss No Transfer من ديبورا ميلانو — أول جلوس شفاه مقاوم للانتقال، بتركيبة ثورية تتحول فوراً إلى فيلم لامع مرن لا يلتصق بالأكواب أو الوجه.\n\n" +
    "• لمعة عالية بتغطية خفيفة ومريحة.\n" +
    "• تركيبة الجيل الجديد مع سيليكونات مرطبة لملمس انسيابي.\n" +
    "• أداة تطبيق دقيقة لرسم سهل وواضح.\n" +
    "• 8 درجات: من Nude Look إلى Berry وSo Peach.\n" +
    "• يُرجّ جيداً لمدة 10 ثوانٍ قبل الاستخدام.\n" +
    "• يُطبّق طبقة رقيقة ويُترك ليجفّ ثوانٍ مع فصل الشفتين قليلاً.\n" +
    "• خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano The Gloss No Transfer — the brand's first transfer-proof lip gloss with a revolutionary texture that sets into a glossy, flexible, non-transfer film.\n\n" +
    "• High shine with light, comfortable colour payoff.\n" +
    "• Next-generation formula enriched with emollient silicones for a fluid feel.\n" +
    "• Precision tip applicator for easy, accurate application.\n" +
    "• 8 shades from Nude Look to Berry and So Peach.\n" +
    "• Shake well for at least 10 seconds before use.\n" +
    "• Apply a thin layer and let dry for a few seconds with lips slightly parted.\n" +
    "• Dermatologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Nude Look",
    colorHex: "#c48a7a",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/193590-large_default/deb-gloss-no-transfer-01.jpg",
    position: 0,
  },
  {
    name: "02 Petal",
    colorHex: "#d8a0a8",
    imageUrl: "https://cdn-1-profumeriemallardo.server.it/shop/193595-large_default/deb-gloss-no-transfer-02.jpg",
    position: 1,
  },
  {
    name: "03 Light Pink",
    colorHex: "#e8a0b0",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/193600-large_default/deb-gloss-no-transfer-03.jpg",
    position: 2,
  },
  {
    name: "04 Pop Pink",
    colorHex: "#e06090",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/193605-large_default/deb-gloss-no-transfer-04.jpg",
    position: 3,
  },
  {
    name: "05 Coral",
    colorHex: "#e87060",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/193610-large_default/deb-gloss-no-transfer-05.jpg",
    position: 4,
  },
  {
    name: "06 Juicy Red",
    colorHex: "#c02830",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/193615-large_default/deb-gloss-no-transfer-06.jpg",
    position: 5,
  },
  {
    name: "07 Berry",
    colorHex: "#8b2040",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/193620-large_default/deb-gloss-no-transfer-07.jpg",
    position: 6,
  },
  {
    name: "08 So Peach",
    colorHex: "#f0a080",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/193625-large_default/deb-gloss-no-transfer-08.jpg",
    position: 7,
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
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIP_GLOSS],
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
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Lips → Lip Gloss`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
