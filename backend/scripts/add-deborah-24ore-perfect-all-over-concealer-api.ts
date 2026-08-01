/**
 * Deborah 24Ore Perfect All-Over Concealer — 8 shades.
 * Source: deborahmilano.com (verified names, images, description)
 * Product barcode: 8009518388909 (05 Amber — legacy EAN; current DM EAN is 8009518389067)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-24ore-perfect-all-over-concealer-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";

const DM = "https://www.deborahmilano.com/en/wp-content/uploads/2022/01";

const PRODUCT = {
  barcode: "8009518388909",
  slug: "deborah-24ore-perfect-all-over-concealer",
  sku: "DBR-APC-90500",
  price: 12500,
  nameAr: "ديبورا ميلانو - كونسيلر سائل 24Ore Perfect All-Over",
  nameEn: "Deborah Milano - 24Ore Perfect All-Over Concealer",
  descriptionAr:
    "24Ore Perfect All-Over Concealer من ديبورا ميلانو — كونسيلر سائل متعدد الاستخدامات بتغطية فائقة تدوم حتى 24 ساعة.\n\n" +
    "• تركيبة سائلة خفيفة تُخفّي العيوب والهالات وتصحّح لون البشرة.\n" +
    "• مقاوم للماء وثبات طويل بلمسة نهائية طبيعية.\n" +
    "• غني بHyaluronic Acid وProbiotics وGreen Tea لترطيب البشرة وتنشيطها.\n" +
    "• أداة تطبيق كبيرة للتغطية على كامل الوجه.\n" +
    "• 8 درجات: من Fair وBeige إلى Apricot وAmber.\n" +
    "• خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano 24Ore Perfect All-Over Concealer — multi-purpose fluid concealer with ultra coverage up to 24 hours.\n\n" +
    "• Lightweight liquid formula minimises imperfections, dark circles and discoloration.\n" +
    "• Waterproof, long-lasting wear with a natural finish.\n" +
    "• Enriched with Hyaluronic Acid, probiotics and green tea to hydrate and revitalise skin.\n" +
    "• Maxi applicator for easy all-over application.\n" +
    "• 8 shades from Fair and Beige to Apricot and Amber.\n" +
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
  { name: "01 Fair", colorHex: "#e8c8b8", imageUrl: `${DM}/MDV000822_DH-CORRETTORE-FLUIDO-24ORE-PERFECT_01-600x600.jpg`, position: 0 },
  { name: "02 Beige", colorHex: "#e8c0b0", imageUrl: `${DM}/MDV000922_DH-CORRETTORE-FLUIDO-24ORE-PERFECT_02-600x600.jpg`, position: 1 },
  { name: "2.1 Light", colorHex: "#e8c8b0", imageUrl: `${DM}/MDV001022_DH-CORRETTORE-FLUIDO-24ORE-PERFECT_2.1-600x600.jpg`, position: 2 },
  { name: "03 Sand", colorHex: "#e0b8a0", imageUrl: `${DM}/MDV001122_DH-CORRETTORE-FLUIDO-24ORE-PERFECT_03-600x600.jpg`, position: 3 },
  { name: "3.1 Nude", colorHex: "#e0c0a8", imageUrl: `${DM}/MDV001222_DH-CORRETTORE-FLUIDO-24ORE-PERFECT_3.1-600x600.jpg`, position: 4 },
  { name: "3.2 Vanilla", colorHex: "#f0d0b8", imageUrl: `${DM}/MDV001322_DH-CORRETTORE-FLUIDO-24ORE-PERFECT_3.2-600x600.jpg`, position: 5 },
  { name: "04 Apricot", colorHex: "#d8b8a0", imageUrl: `${DM}/MDV001422_DH-CORRETTORE-FLUIDO-24ORE-PERFECT_04-600x600.jpg`, position: 6 },
  { name: "05 Amber", colorHex: "#d0b098", imageUrl: `${DM}/MDV001522_DH-CORRETTORE-FLUIDO-24ORE-PERFECT_05-600x600.jpg`, position: 7 },
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
    tertiaryCategoryId: CONCEALER,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [CONCEALER],
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
  console.log(`  Category: Makeup → Face → Concealer`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
