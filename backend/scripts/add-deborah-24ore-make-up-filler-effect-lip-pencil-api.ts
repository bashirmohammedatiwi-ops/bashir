/**
 * Deborah 24Ore Make Up Filler Effect Lip Pencil — 8 shades (01–08).
 * Source: deborahmilano.com (verified names, images, description)
 * Product barcode: 8009518482881 (06 Rose Framboise)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-24ore-make-up-filler-effect-lip-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_LINER = "54e393a9-90bf-41bb-beeb-c5364afce287";

const DM = "https://www.deborahmilano.com/en/wp-content/uploads/2025/07";

const PRODUCT = {
  barcode: "8009518482881",
  slug: "deborah-24ore-make-up-filler-effect-lip-pencil",
  sku: "DBR-MUF-013824",
  price: 10900,
  nameAr: "ديبورا ميلانو - قلم شفاه 24Ore Make Up Filler Effect",
  nameEn: "Deborah Milano - 24Ore Make Up Filler Effect Lip Pencil",
  descriptionAr:
    "قلم شفاه 24Ore Make Up Filler Effect من ديبورا ميلانو — تأثير filler فوري بدقة عالية وأداء استثنائي.\n\n" +
    "• تركيبة كريمية مطفية بلون غني ينزلق بسلاسة لمظهر مخملي.\n" +
    "• غني بـ Vitamin E وHyaluronic Acid ومجمّع Maxi-Lip™.\n" +
    "• مقاوم للماء وNo Transfer — ثبات طويل بدون تلطّخ.\n" +
    "• قلم retractable مع temperino مدمج وsponge blender احترافي.\n" +
    "• 3 طرق استخدام: تحديد، soft smudging، أو لون matte كامل.\n" +
    "• 8 درجات: Endless Nude وSpicy Cinnamon وMauve Mood وNude Rose وCashmere Rose وRose Framboise وAlways Red وContour Brown.",
  descriptionEn:
    "Deborah Milano 24Ore Make Up Filler Effect Lip Pencil — instant filler-effect lip pencil with flawless precision and exceptional performance.\n\n" +
    "• Creamy matt formula delivers intense, rich colour with a seamless velvety finish.\n" +
    "• Enriched with Vitamin E, Hyaluronic Acid and the exclusive Maxi-Lip™ Complex.\n" +
    "• Waterproof, transfer-proof and ultra-long-wearing.\n" +
    "• Retractable tip with built-in sharpener and pro-grade sponge blender.\n" +
    "• Three ways to use: contour, soft smudge or all-over matte base.\n" +
    "• 8 shades: Endless Nude, Spicy Cinnamon, Mauve Mood, Nude Rose, Cashmere Rose, Rose Framboise, Always Red and Contour Brown.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com select labels; hex sampled from each shade image. */
const SHADES: ShadeInput[] = [
  { name: "01 Endless Nude", colorHex: "#7b5751", imageUrl: `${DM}/MDV013324_Matita-24ore-labbra-automatiche_01-600x600.png`, position: 0 },
  { name: "02 Spicy Cinnamon", colorHex: "#784e4b", imageUrl: `${DM}/MDV013424_Matita-24ore-labbra-automatiche_02-600x600.png`, position: 1 },
  { name: "03 Mauve Mood", colorHex: "#a85d75", imageUrl: `${DM}/MDV013524_Matita-24ore-labbra-automatiche_03-600x600.png`, position: 2 },
  { name: "04 Nude Rose", colorHex: "#9c635d", imageUrl: `${DM}/MDV013624_Matita-24ore-labbra-automatiche_04-600x600.png`, position: 3 },
  { name: "05 Cashmere Rose", colorHex: "#a5696f", imageUrl: `${DM}/MDV013724_Matita-24ore-labbra-automatiche_05-600x600.png`, position: 4 },
  { name: "06 Rose Framboise", colorHex: "#8d3951", imageUrl: `${DM}/MDV013824_Matita-24ore-labbra-automatiche_06-600x600.png`, position: 5 },
  { name: "07 Always Red", colorHex: "#9f3c45", imageUrl: `${DM}/MDV013924_Matita-24ore-labbra-automatiche_07-600x600.png`, position: 6 },
  { name: "08 Contour Brown", colorHex: "#754845", imageUrl: `${DM}/MDV014024_Matita-24ore-labbra-automatiche_08-600x600.png`, position: 7 },
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
    tertiaryCategoryId: LIP_LINER,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIP_LINER],
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
  console.log(`  Category: Makeup → Lips → Lip Liner`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
