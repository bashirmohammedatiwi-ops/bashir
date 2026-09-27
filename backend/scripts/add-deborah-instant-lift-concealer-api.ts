/**
 * Deborah Instant Lift Concealer — 8 shades.
 * Source: deborahmilano.com (verified names, images, description)
 * Product barcode: 8009518356137 (01 Fair)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-instant-lift-concealer-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";

const DM = "https://www.deborahmilano.com/en/wp-content/uploads/2021/01";

const PRODUCT = {
  barcode: "8009518356137",
  slug: "deborah-instant-lift-concealer",
  sku: "DBR-ILC-0010962",
  price: 13500,
  nameAr: "ديبورا ميلانو - كونسيلر Instant Lift",
  nameEn: "Deborah Milano - Instant Lift Concealer",
  descriptionAr:
    "Instant Lift Concealer من ديبورا ميلانو — كونسيلر سائل بحماية شبابية بأداة قلم وطرف إسفنجي.\n\n" +
    "• يُخفّي الهالات والعيوب والتجاعيد بلمسة فورية.\n" +
    "• جزيئات عاكسة للضوء لإشراق العينين ومظهر مرتاح.\n" +
    "• غني بالفيتامينات وCentella Asiatica لبشرة ناعمة ومرطبة.\n" +
    "• 8 درجات: من Fair وBeige إلى Apricot وAmber.\n" +
    "• 4.2 غ — خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano Instant Lift Concealer — youth-protecting liquid concealer with a sponge-tip pen applicator.\n\n" +
    "• Minimises dark circles, imperfections and wrinkles in an instant.\n" +
    "• Light-reflecting particles blur imperfections for bright, well-rested eyes.\n" +
    "• Formulated with vitamins and Centella Asiatica for smooth, supple skin.\n" +
    "• 8 shades from Fair and Beige to Apricot and Amber.\n" +
    "• 4.2 g — Dermatologist tested. Visibly shallower lines and wrinkles.*",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com select labels; hex sampled from each shade image. */
const SHADES: ShadeInput[] = [
  { name: "01 Fair", colorHex: "#e0b8a0", imageUrl: `${DM}/009198-Correttore-Instant-Lift-600x600.jpg`, position: 0 },
  { name: "02 Beige", colorHex: "#e0b090", imageUrl: `${DM}/009199-Correttore-Instant-Lift-600x600.jpg`, position: 1 },
  { name: "2.1 Light", colorHex: "#e0c0a0", imageUrl: `${DM}/010510-Correttore-Instant-Lift-600x600.jpg`, position: 2 },
  { name: "03 Sand", colorHex: "#c8a080", imageUrl: `${DM}/009200-Correttore-Instant-Lift-600x600.jpg`, position: 3 },
  { name: "3.1 Nude", colorHex: "#e0b088", imageUrl: `${DM}/010511-Correttore-Instant-Lift-600x600.jpg`, position: 4 },
  { name: "3.2 Vanilla", colorHex: "#f0d0b0", imageUrl: `${DM}/010512-Correttore-Instant-Lift-600x600.jpg`, position: 5 },
  { name: "04 Apricot", colorHex: "#c8a078", imageUrl: `${DM}/009524-Correttore-Instant-Lift-600x600.jpg`, position: 6 },
  { name: "05 Amber", colorHex: "#c89878", imageUrl: `${DM}/009525-Correttore-Instant-Lift-600x600.jpg`, position: 7 },
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
