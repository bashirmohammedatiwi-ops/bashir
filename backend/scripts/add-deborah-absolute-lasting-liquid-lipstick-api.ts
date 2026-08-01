/**
 * Deborah Absolute Lasting Liquid Lipstick — 10 shades.
 * Source: deborahmilano.com (verified names, images, description)
 * Product barcode: 8009518227062 (08 Classic Red)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-absolute-lasting-liquid-lipstick-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIQUID_LIPSTICK = "b53dd3be-ae16-47a4-a306-238f2060b8d8";

const DM = "https://www.deborahmilano.com/en/wp-content/uploads/2021/01";

const PRODUCT = {
  barcode: "8009518227062",
  slug: "deborah-absolute-lasting-liquid-lipstick",
  sku: "DBR-ALL-004850",
  price: 13500,
  nameAr: "ديبورا ميلانو - أحمر شفاه سائل Absolute Lasting Liquid",
  nameEn: "Deborah Milano - Absolute Lasting Liquid Lipstick",
  descriptionAr:
    "Absolute Lasting Liquid Lipstick من ديبورا ميلانو — روژ سائل 2-in-1: لون مطفي غني + جلوس شفاف مرطب بلمعة vinyle.\n\n" +
    "• طبقة لون مطفية عالية التصبغ — No Transfer ومقاومة للتلف.\n" +
    "• Top coat شفاف مرطب يعزّز حجم الشفاه ونعومتها.\n" +
    "• أداة floccata للون الدقيق + فرشاة للـ top coat.\n" +
    "• 10 درجات: Mauve Nude وDark Mauve وClassic Red وReal Nude وFire Red وLight Brown وNude Beige وRose وPlum وBurgundy.\n" +
    "• الخطوة 1: اللون — انتظري الجفاف. الخطوة 2: الـ top coat.\n" +
    "• خالي من البارابين — 8ml.\n" +
    "• خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano Absolute Lasting Liquid Lipstick — 2-in-1 liquid lipstick with a super-pigmented matte colour base and clear moisturising vinyl-effect gloss top coat.\n\n" +
    "• Thin, highly pigmented no-transfer, smudge-proof matte film.\n" +
    "• Clear top coat boosts lip volume with an emollient, hydrated vinyl shine.\n" +
    "• Flocked applicator for precise colour + brush top coat for optimal finish.\n" +
    "• 10 shades: Mauve Nude, Dark Mauve, Classic Red, Real Nude, Fire Red, Light Brown, Nude Beige, Rose, Plum and Burgundy.\n" +
    "• Step 1: apply colour and let dry. Step 2: apply moisturising top coat.\n" +
    "• Paraben-free — 8 ml.\n" +
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
  { name: "03 Mauve Nude", colorHex: "#5b2827", imageUrl: `${DM}/004845-Absolute-Lasting-Liquid-Lipstick-600x600.jpg`, position: 0 },
  { name: "07 Dark Mauve", colorHex: "#541d28", imageUrl: `${DM}/004849-Absolute-Lasting-Liquid-Lipstick-600x600.jpg`, position: 1 },
  { name: "08 Classic Red", colorHex: "#951f23", imageUrl: `${DM}/004850-Absolute-Lasting-Liquid-Lipstick-600x600.jpg`, position: 2 },
  { name: "09 Real Nude", colorHex: "#662a1d", imageUrl: `${DM}/005822-Absolute-Lasting-Liquid-Lipstick-600x600.jpg`, position: 3 },
  { name: "10 Fire Red", colorHex: "#af0a1a", imageUrl: `${DM}/005823-Absolute-Lasting-Liquid-Lipstick-600x600.jpg`, position: 4 },
  { name: "13 Light Brown", colorHex: "#60230d", imageUrl: `${DM}/005826-Absolute-Lasting-Liquid-Lipstick-600x600.jpg`, position: 5 },
  { name: "16 Nude Beige", colorHex: "#723028", imageUrl: `${DM}/009632-Absolute-Lasting-Liquid-Lipstick-600x600.jpg`, position: 6 },
  { name: "17 Rose", colorHex: "#7d2135", imageUrl: `${DM}/009633-Absolute-Lasting-Liquid-Lipstick-600x600.jpg`, position: 7 },
  { name: "18 Plum", colorHex: "#531316", imageUrl: `${DM}/009634-Absolute-Lasting-Liquid-Lipstick-600x600.jpg`, position: 8 },
  { name: "19 Burgundy", colorHex: "#640802", imageUrl: `${DM}/009635-Absolute-Lasting-Liquid-Lipstick-600x600.jpg`, position: 9 },
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
    tertiaryCategoryId: LIQUID_LIPSTICK,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIQUID_LIPSTICK],
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
  console.log(`  Category: Makeup → Lips → Liquid Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
