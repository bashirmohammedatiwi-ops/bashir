/**
 * Deborah 24Ore Perfect Compact Foundation — 6 shades.
 * Source: deborahmilano.com (verified names, description)
 * Images: profumeriemallardo.com (01G, 02–04), mallprix.com (01R, 06)
 * Product barcode: 8009518377293 (01G Light Beige)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-24ore-perfect-compact-foundation-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";

const MALLARDO = "https://cdn-3-profumeriemallardo.server.it/shop";

const PRODUCT = {
  barcode: "8009518377293",
  slug: "deborah-24ore-perfect-compact-foundation",
  sku: "DBR-24PCF-KDS4790",
  price: 15000,
  nameAr: "ديبورا ميلانو - فاونديشن 24Ore Perfect Compact Foundation",
  nameEn: "Deborah Milano - 24Ore Perfect Compact Foundation",
  descriptionAr:
    "فاونديشن 24Ore Perfect Compact Foundation من ديبورا ميلانو — بودرة مضغوطة عملية بإطلالة مطفية طبيعية.\n\n" +
    "• تركيبة غنية بخلاصة الكاميليا وDH Anti-pollution Complex بفعالية مضادة للأكسدة والحماية.\n" +
    "• مقاوم للماء وطويل الثبات — no transfer مع SPF 20.\n" +
    "• تغطية قابلة للبناء: إسفنجة رطبة لتغطية عالية، جافة لتغطية متوسطة، أو فرشاة لإطلالة أخف.\n" +
    "• 6 درجات: Light Beige وLight rose وNatural وTrue Beige وCaramel و06.\n" +
    "• 9 g — مع مرآة وإسفنجة.",
  descriptionEn:
    "Deborah Milano 24Ore Perfect Compact Foundation — comfortable compact powder foundation with a matte, natural, even finish.\n\n" +
    "• Enriched with Camellia extract and DH Anti-pollution Complex with antioxidant and protective action.\n" +
    "• Waterproof, long-lasting and no transfer — SPF 20 filter makes it the perfect city product.\n" +
    "• Buildable coverage: damp sponge for high coverage, dry sponge for medium, brush for a lighter look.\n" +
    "• 6 shades: Light Beige, Light rose, Natural, True Beige, Caramel and 06.\n" +
    "• 9 g — Includes mirror and applicator sponge.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com; hex from oggi.shop swatches (01G–04, 01R) and mallprix powder region (06). */
const SHADES: ShadeInput[] = [
  {
    name: "01G Light Beige",
    colorHex: "#f2c89e",
    imageUrl: `${MALLARDO}/157843-large_default/deb-ft-compact-perfect-01.jpg`,
    position: 0,
  },
  {
    name: "01R Light rose",
    colorHex: "#fedcc0",
    imageUrl:
      "https://cdn.mallprix.com/media/gallery/user_4/4b/4be1cc55b3c2522589db6597dfab72787604ea1a36cd48befe97bd02e4448da1.jpg",
    position: 1,
  },
  {
    name: "02 Natural",
    colorHex: "#edad81",
    imageUrl: `${MALLARDO}/157845-large_default/deb-ft-compact-perfect-02.jpg`,
    position: 2,
  },
  {
    name: "03 True Beige",
    colorHex: "#e7ab6f",
    imageUrl: `${MALLARDO}/157847-large_default/deb-ft-compact-perfect-03.jpg`,
    position: 3,
  },
  {
    name: "04 Caramel",
    colorHex: "#ca8d56",
    imageUrl: `${MALLARDO}/157849-large_default/deb-ft-compact-perfect-04.jpg`,
    position: 4,
  },
  {
    name: "06",
    colorHex: "#d9bb9e",
    imageUrl:
      "https://cdn.mallprix.com/media/gallery/user_4/6d/6dbfd83c9080019b3e6577784ebe89681212eb39b0b790e316f31430ae7a998e.jpg",
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
  console.log(`  Category: Makeup → Face → Foundation`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
