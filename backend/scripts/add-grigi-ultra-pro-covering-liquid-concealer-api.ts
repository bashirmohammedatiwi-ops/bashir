/**
 * Grigi Ultra Pro Covering Liquid Concealer — 6 shades (18–23).
 * Sources: grigi.gr (images, names), boboconcept.bg / epharmadora.com (barcodes)
 * Product barcode: 5207042240271 (shade 20 Ivory — user barcode; new packaging: 5207042240202)
 * Usage: npx tsx scripts/add-grigi-ultra-pro-covering-liquid-concealer-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";

const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

const PRODUCT = {
  barcode: "5207042240271",
  slug: "grigi-ultra-pro-covering-liquid-concealer",
  sku: "GRG-UPCLC",
  price: 10500,
  nameAr: "غريغي - كونسيلر سائل Ultra Pro Covering عالي التغطية",
  nameEn: "Grigi - Ultra Pro Covering Liquid Concealer",
  descriptionAr:
    "كونسيلر سائل Ultra Pro Covering من غريغي — تركيبة جل عالية التغطية تُخفي الهالات والعيوب وتمنح بشرة مشرقة وناعمة.\n\n" +
    "• تغطية عالية وثبات طويل في منطقة تحت العين.\n" +
    "• يُصحّح العيوب والتصبغات ويُوحّد لون البشرة بلمسة طبيعية.\n" +
    "• قوام دقيق ينزلق بسلاسة ويُطبَّق بدقة على المناطق الحساسة.\n" +
    "• يُخفّف مظهر الخطوط الدقيقة وخطوط التعب لإشراقة شبابية.\n" +
    "• 6 درجات: 18 Second Skin، 19 Nude Beige، 20 Ivory، 21 Dark Nude Beige، 22 Luminous Beige، 23 Warm Honey Beige.\n" +
    "• حجم 10 غرام — صُنع في اليونان.",
  descriptionEn:
    "Grigi Ultra Pro Covering Liquid Concealer — gel formula with high coverage that conceals dark circles and imperfections for a flawless, radiant complexion.\n\n" +
    "• High coverage with long-lasting wear in the under-eye area.\n" +
    "• Corrects blemishes and pigmentation with a natural, even finish.\n" +
    "• Fine texture glides on smoothly for precise application.\n" +
    "• Blurs fine lines and signs of fatigue for a youthful glow.\n" +
    "• 6 shades: 18 Second Skin, 19 Nude Beige, 20 Ivory, 21 Dark Nude Beige, 22 Luminous Beige, 23 Warm Honey Beige.\n" +
    "• 10 g — Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  barcode: string;
  imageUrl: string;
  position: number;
};

/** Names from grigi.gr; barcodes from boboconcept.bg / epharmadora.com; hex from texture swatches. */
const SHADES: ShadeInput[] = [
  {
    name: "18 Second Skin",
    colorHex: "#b39077",
    barcode: "5207042240189",
    imageUrl: `${IMG}/g/u/gupclc-18.jpg`,
    position: 0,
  },
  {
    name: "19 Nude Beige",
    colorHex: "#c0a690",
    barcode: "5207042240196",
    imageUrl: `${IMG}/g/u/gupclc-19_1.jpg`,
    position: 1,
  },
  {
    name: "20 Ivory",
    colorHex: "#bb9e85",
    barcode: "5207042240271",
    imageUrl: `${IMG}/g/u/gupclc-20_1.jpg`,
    position: 2,
  },
  {
    name: "21 Dark Nude Beige",
    colorHex: "#c7a894",
    barcode: "5207042240219",
    imageUrl: `${IMG}/g/u/gupclc-21_1.jpg`,
    position: 3,
  },
  {
    name: "22 Luminous Beige",
    colorHex: "#cab094",
    barcode: "5207042240226",
    imageUrl: `${IMG}/g/u/gupclc-22.jpg`,
    position: 4,
  },
  {
    name: "23 Warm Honey Beige",
    colorHex: "#bd977b",
    barcode: "5207042240233",
    imageUrl: `${IMG}/g/u/gupclc-23_1.jpg`,
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
    brandAr: "غريغي",
    brandEn: "Grigi",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Grigi brand");
  console.log(`Brand: Grigi (${brandId})${resolved.created ? " [created]" : ""}\n`);
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
    barcode: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      barcode: shade.barcode,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} — ${shade.colorHex} — ${shade.barcode}`);
    await new Promise((r) => setTimeout(r, 400));
  }

  shades.sort((a, b) => a.position - b.position);
  const imageIds = [...new Set(shades.map((s) => s.imageId))];

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
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"} | ${s.barcode ?? "no barcode"}`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Face → Concealer`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
