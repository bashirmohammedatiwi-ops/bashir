/**
 * Deborah 24Ore Waterproof Eye Pencil — 8 shades (01–08).
 * Source: deborahmilano.com (verified names, images, description)
 * Product barcode: 8009518127188 (04 Blue)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-24ore-waterproof-eye-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";

const DM = "https://www.deborahmilano.com/en/wp-content/uploads/2021/01";

const PRODUCT = {
  barcode: "8009518127188",
  slug: "deborah-24ore-waterproof-eye-pencil",
  sku: "DBR-EWP-001893",
  price: 10500,
  nameAr: "ديبورا ميلانو - قلم عيون 24Ore Waterproof",
  nameEn: "Deborah Milano - 24Ore Waterproof Eye Pencil",
  descriptionAr:
    "قلم عيون 24Ore Waterproof من ديبورا ميلانو — قلم كحل أوتوماتيكي مقاوم للماء بلون غني وثبات طويل.\n\n" +
    "• تركيبة غنية بالصبغة مع راتنجات سيليكون لثبات استثنائي.\n" +
    "• مقاوم للماء — يحدد العيون بدقة طوال اليوم.\n" +
    "• temperino مدمج وsponge smudger لدمج اللون بسهولة.\n" +
    "• 8 درجات: Black وBrown وLight Blue وBlue وGolden Green وForest Green وGrey وViolet.\n" +
    "• مختبر من قبل أطباء العيون.\n" +
    "• الوزن: 0.5g.",
  descriptionEn:
    "Deborah Milano 24Ore Waterproof Eye Pencil — automatic waterproof eye pencil with rich pigment and long-lasting wear.\n\n" +
    "• Highly pigmented formula with silicone resins for exceptional hold.\n" +
    "• Waterproof — precise eye definition that lasts all day.\n" +
    "• Built-in sharpener and smudger sponge for easy blending.\n" +
    "• 8 shades: Black, Brown, Light Blue, Blue, Golden Green, Forest Green, Grey and Violet.\n" +
    "• Ophthalmologist tested.\n" +
    "• Net weight: 0.5g.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com select labels; hex sampled from each shade image. */
const SHADES: ShadeInput[] = [
  { name: "01 Black", colorHex: "#000002", imageUrl: `${DM}/001890-Matita-24Ore-Waterproof-600x600.jpg`, position: 0 },
  { name: "02 Brown", colorHex: "#29130f", imageUrl: `${DM}/001891-Matita-24Ore-Waterproof-600x600.jpg`, position: 1 },
  { name: "03 Light Blue", colorHex: "#006997", imageUrl: `${DM}/001892-Matita-24Ore-Waterproof-600x600.jpg`, position: 2 },
  { name: "04 Blue", colorHex: "#001a3b", imageUrl: `${DM}/001893-Matita-24Ore-Waterproof-600x600.jpg`, position: 3 },
  { name: "05 Golden Green", colorHex: "#313211", imageUrl: `${DM}/001894-Matita-24Ore-Waterproof-600x600.jpg`, position: 4 },
  { name: "06 Forest Green", colorHex: "#00221d", imageUrl: `${DM}/001895-Matita-24Ore-Waterproof-600x600.jpg`, position: 5 },
  { name: "07 Grey", colorHex: "#353b3f", imageUrl: `${DM}/001896-Matita-24Ore-Waterproof-600x600.jpg`, position: 6 },
  { name: "08 Violet", colorHex: "#0e0118", imageUrl: `${DM}/001897-Matita-24Ore-Waterproof-600x600.jpg`, position: 7 },
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
    tertiaryCategoryId: EYELINER,
    subcategoryIds: [EYES],
    tertiaryCategoryIds: [EYELINER],
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
  console.log(`  Category: Makeup → Eyes → Eye Liner`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
