/**
 * Deborah Multi-Chrome Liquid Eyeshadow — 4 shades (01–04).
 * Sources: deborahmilano.com + profumeriemallardo.com (verified names, images, description)
 * Product barcode: 8009518478334 (01 Pure Bliss)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-multi-chrome-liquid-eyeshadow-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYESHADOW = "07f14763-7a8b-4646-a057-8748e2b18bd4";

const PRODUCT = {
  barcode: "8009518478334",
  slug: "deborah-multi-chrome-liquid-eyeshadow",
  sku: "DBR-MCL-90500",
  price: 13500,
  nameAr: "ديبورا ميلانو - ظل عيون سائل Multi-Chrome Liquid",
  nameEn: "Deborah Milano - Multi-Chrome Liquid Eyeshadow",
  descriptionAr:
    "Multi-Chrome Liquid Eyeshadow من ديبورا ميلانو — أحدث إصدارات Chrome Collection، ظل عيون سائل كريمي بانعكاسات متعددة الألوان.\n\n" +
    "• تركيبة كريمية ناعمة وخفيفة تنزلق بسهولة على الجفون.\n" +
    "• غني بالماء لإحساس منعش وراحة طوال اليوم.\n" +
    "• ثبات طويل بلمعة متعددة الأبعاد تتغير مع الضوء.\n" +
    "• 4 درجات: Pure Bliss وUltra Violet وCopper Deluxe وLux Green.\n" +
    "• يُطبّق مباشرة على الجفن ويُدمج قبل الجفاف.\n" +
    "• خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano Multi-Chrome Liquid Eyeshadow — Chrome Collection cream liquid eyeshadow with multi-chromatic, light-catching reflections.\n\n" +
    "• Fine, lightweight cream texture glides effortlessly onto lids.\n" +
    "• High water content for a fresh, comfortable feel all day.\n" +
    "• Long-wearing multi-dimensional shimmer that shifts with the light.\n" +
    "• 4 shades: Pure Bliss, Ultra Violet, Copper Deluxe and Lux Green.\n" +
    "• Apply directly to lids and blend before it sets.\n" +
    "• Dermatologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com / profumeriemallardo.com; hex sampled from shade images. */
const SHADES: ShadeInput[] = [
  {
    name: "01 Pure Bliss",
    colorHex: "#dd7bef",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/193636-large_default/deb-chrome-liquid-eyes-01.jpg",
    position: 0,
  },
  {
    name: "02 Ultra Violet",
    colorHex: "#351676",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/193640-large_default/deb-chrome-liquid-eyes-02.jpg",
    position: 1,
  },
  {
    name: "03 Copper Deluxe",
    colorHex: "#975149",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/193644-large_default/deb-chrome-liquid-eyes-03.jpg",
    position: 2,
  },
  {
    name: "04 Lux Green",
    colorHex: "#656c34",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/193648-large_default/deb-chrome-liquid-eyes-04.jpg",
    position: 3,
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
