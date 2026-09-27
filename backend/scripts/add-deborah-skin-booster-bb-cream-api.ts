/**
 * Deborah Skin Booster BB Cream — 6 shades (00, 0, 01–04).
 * Source: deborahmilano.com (verified names, images, swatch hex)
 * Product barcode: 8009518432701 (0 Light Rose)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-skin-booster-bb-cream-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";

const DM = "https://www.deborahmilano.com/en/wp-content/uploads/2023/09";

const PRODUCT = {
  barcode: "8009518432701",
  slug: "deborah-skin-booster-bb-cream",
  sku: "DBR-SBB-GI876EE",
  price: 15000,
  nameAr: "ديبورا ميلانو - بي بي كريم Skin Booster",
  nameEn: "Deborah Milano - Skin Booster BB Cream",
  descriptionAr:
    "Skin Booster BB Cream من ديبورا ميلانو — فاونديشن متكامل 5 في 1 لبشرة مثالية بلمسة واحدة.\n\n" +
    "• يرطّب، يُضيء، يحمي، يوحّد ويُنعّم لون البشرة في خطوة واحدة.\n" +
    "• قوام ناعم حريري يناسب جميع أنواع البشرة بما فيها الناضجة.\n" +
    "• تأثير second-skin يُخفّي الخطوط الدقيقة والمسام والعيوب.\n" +
    "• غني بـ Vitamin C لمضادات الأكسدة وإشراق البشرة.\n" +
    "• حماية SPF 15 ضد الأشعة فوق البنفسجية.\n" +
    "• 6 درجات: Fair وLight Rose وNude وBeige وSand وCaramel.\n" +
    "• 30 مل — خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano Skin Booster BB Cream — all-in-one skin perfecting foundation delivering 5 performances in one product.\n\n" +
    "• Moisturises, illuminates, protects, evens and smooths the complexion in a single gesture.\n" +
    "• Soft, silky texture designed for all skin types, including mature skin.\n" +
    "• Delicate second-skin effect minimising fine lines, pores and imperfections.\n" +
    "• Enriched with Vitamin C for antioxidant brightening benefits.\n" +
    "• SPF 15 protection against UV rays and photo-ageing.\n" +
    "• Six shades: Fair, Light Rose, Nude, Beige, Sand and Caramel.\n" +
    "• 30 ml — Dermatologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com; colorHex from official WooCommerce swatch terms. */
const SHADES: ShadeInput[] = [
  {
    name: "00 Fair",
    colorHex: "#f1c6a6",
    imageUrl: `${DM}/MDV015523_dh-skin-booster-bb-cream-00-600x600.jpg`,
    position: 0,
  },
  {
    name: "0 Light Rose",
    colorHex: "#ebbeaf",
    imageUrl: `${DM}/MDV015423_dh-skin-booster-bb-cream-0-600x600.jpg`,
    position: 1,
  },
  {
    name: "01 Nude",
    colorHex: "#e0c09e",
    imageUrl: `${DM}/MDV004023_dh-skin-booster-bb-cream-01-600x600.jpg`,
    position: 2,
  },
  {
    name: "02 Beige",
    colorHex: "#cda785",
    imageUrl: `${DM}/MDV004123_dh-skin-booster-bb-cream-02-600x600.jpg`,
    position: 3,
  },
  {
    name: "03 Sand",
    colorHex: "#cda788",
    imageUrl: `${DM}/MDV004223_dh-skin-booster-bb-cream-03-600x600.jpg`,
    position: 4,
  },
  {
    name: "04 Caramel",
    colorHex: "#e0a86f",
    imageUrl: `${DM}/MDV004323_dh-skin-booster-bb-cream-04-600x600.jpg`,
    position: 5,
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
  console.log(`  EN: ${PRODUCT.nameEn}`);
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
