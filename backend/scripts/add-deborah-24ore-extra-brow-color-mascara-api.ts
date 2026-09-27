/**
 * Deborah 24Ore Extra Brow Color Mascara — 2 shades (01–02).
 * Source: deborahmilano.com (verified names, images, description)
 * Product barcode: 8009518482522 (02 Brown)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-24ore-extra-brow-color-mascara-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const EYEBROW_MASCARA = "3e4a3ad5-72fb-4a9b-878e-97cf31354b74";

const DM = "https://www.deborahmilano.com/en/wp-content/uploads/2025/11";

const PRODUCT = {
  barcode: "8009518482522",
  slug: "deborah-24ore-extra-brow-color-mascara",
  sku: "DBR-EBCM-014925",
  price: 12000,
  nameAr: "ديبورا ميلانو - ماسكارا حواجب 24Ore Extra Brow Color Mascara",
  nameEn: "Deborah Milano - 24Ore Extra Brow Color Mascara",
  descriptionAr:
    "ماسكارا حواجب ملوّنة 24Ore Extra Brow Color Mascara من ديبورا ميلانو — ملمس خفيف قابل للبناء.\n\n" +
    "• تمنح الحواجب حجماً وانضباطاً ولوناً طبيعياً مع تثبيت طوال اليوم.\n" +
    "• ألياف microfibre تملأ وتكثّف خط الحاجب فوراً.\n" +
    "• تركيبة waterproof — ثبات حتى 24 ساعة بدون بقع أو تكتل.\n" +
    "• فرشاة دقيقة بشعيرات ناعمة لتطبيق طبيعي أو bold.\n" +
    "• درجتان: Light Brown وBrown.\n" +
    "• 7 ml.",
  descriptionEn:
    "Deborah Milano 24Ore Extra Brow Color Mascara — lightweight, buildable coloured brow mascara.\n\n" +
    "• Volumises, tames, naturally tints and sets brows all day long.\n" +
    "• Microfibre-infused formula visibly fills and thickens the brow line.\n" +
    "• Waterproof formula stays put for up to 24 hours without smudging or clumping.\n" +
    "• Ultra-precise soft bristled brush — softly subtle to boldly statement-making.\n" +
    "• 2 shades: Light Brown and Brown.\n" +
    "• 7 ml.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com; hex sampled from shade swatch regions in official images. */
const SHADES: ShadeInput[] = [
  {
    name: "01 Light Brown",
    colorHex: "#735c4c",
    imageUrl: `${DM}/MDV014825_mascara-extra-brow-01-600x600.png`,
    position: 0,
  },
  {
    name: "02 Brown",
    colorHex: "#605047",
    imageUrl: `${DM}/MDV014925_mascara-extra-brow-02-600x600.png`,
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
    tertiaryCategoryId: EYEBROW_MASCARA,
    subcategoryIds: [EYEBROW],
    tertiaryCategoryIds: [EYEBROW_MASCARA],
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
    console.log(`    - ${s.name} | ${s.colorHex ?? "?"} | barcode: ${s.barcode ?? "none"}`);
  }
  console.log(`  Category: Makeup → Eyebrow → Eyebrow Mascara`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
