/**
 * Deborah Skin Booster Mat Foundation — 8 shades (00, 01–05, 06, 07).
 * Source: deborahmilano.com (01–05), riano.cz (00), byleijtens.com (06, 07)
 * Product barcode: 8009518459470 (01 Light Rose)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-skin-booster-mat-foundation-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";

const DM = "https://www.deborahmilano.com/en/wp-content/uploads/2024/11";

const PRODUCT = {
  barcode: "8009518459470",
  slug: "deborah-skin-booster-mat-foundation",
  sku: "DBR-SBM-90500",
  price: 21000,
  nameAr: "ديبورا ميلانو - فاونديشن Skin Booster Mat",
  nameEn: "Deborah Milano - Skin Booster Mat Foundation",
  descriptionAr:
    "Skin Booster Mat Foundation من ديبورا ميلانو — فونديشن سائل مطفي بتركيبة مرطبة يجمع بين تغطية مثالية طويلة الأمد والعناية بالبشرة.\n\n" +
    "• قوام خفيف من الجيل الجديد يندمج مع البشرة لمظهر طبيعي مريح طوال اليوم.\n" +
    "• غني بـ Niacinamide وVitamin C ومرطبات لإشراق البشرة وتلبية احتياجات البشرة الحساسة.\n" +
    "• حماية SPF 15 — تغطية عالية بلمسة مطفية تقلّل اللمعان.\n" +
    "• 8 درجات: Fair وLight Rose وNude وMedium وWarm وTan وPorcelain وAlmond.\n" +
    "• 30 مل — خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano Skin Booster Mat Foundation — hydrating matte liquid foundation with flawless, long-lasting coverage that also nurtures skin.\n\n" +
    "• Weightless next-generation texture melts effortlessly into skin for a barely-there, comfortable look all day.\n" +
    "• Enriched with Niacinamide, Vitamin C and moisturisers to brighten and meet demanding skin needs.\n" +
    "• SPF 15 — high-coverage matte finish that reduces shine.\n" +
    "• 8 shades: Fair, Light Rose, Nude, Medium, Warm, Tan, Porcelain and Almond.\n" +
    "• 30 ml — Dermatologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com / retailers; hex sampled from each shade image. */
const SHADES: ShadeInput[] = [
  {
    name: "00 Fair",
    colorHex: "#e9d4cf",
    imageUrl: "https://www.riano.cz/gallery/products/14788/detail_skin_booster_matujici_00_fair.jpg",
    position: 0,
  },
  { name: "01 Light Rose", colorHex: "#e8b8a0", imageUrl: `${DM}/MDV018924_01-600x600.png`, position: 1 },
  { name: "02 Nude", colorHex: "#e0b890", imageUrl: `${DM}/MDV019024_02-600x600.png`, position: 2 },
  { name: "03 Medium", colorHex: "#e8b0a0", imageUrl: `${DM}/MDV019124_03-600x600.png`, position: 3 },
  { name: "04 Warm", colorHex: "#e8b0a0", imageUrl: `${DM}/MDV019224_04-600x600.png`, position: 4 },
  { name: "05 Tan", colorHex: "#e8a880", imageUrl: `${DM}/MDV019324_05-600x600.png`, position: 5 },
  {
    name: "06 Porcelain",
    colorHex: "#ddc7c3",
    imageUrl:
      "https://byleijtens.com/cdn/shop/files/Deborah_Milano_Skin_Booster_Mat_Foundation_06_Porcelain_b0e3f68c-f978-4d8a-a4bd-7978d6930702.jpg",
    position: 6,
  },
  {
    name: "07 Almond",
    colorHex: "#dfc7c2",
    imageUrl: "https://byleijtens.com/cdn/shop/files/Deborah_Milano_Skin_Booster_Mat_Foundation_07_Almond.jpg",
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
    subcategoryId: FACE,
    tertiaryCategoryId: FOUNDATION,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [FOUNDATION],
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
  console.log(`  Category: Makeup → Face → Foundation`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
