/**
 * Deborah Precious Color — 9 shades.
 * Source: deborahmilano.com (verified names, description)
 * Images: profumeriemallardo.com (all shades)
 * Product barcode: 8009518435771 (08 Dreamy Denim)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-precious-color-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYESHADOW = "07f14763-7a8b-4646-a057-8748e2b18bd4";

const MALLARDO = "https://cdn-2-profumeriemallardo.server.it/shop";

const PRODUCT = {
  barcode: "8009518435771",
  slug: "deborah-precious-color",
  sku: "DBR-PC-GH452DD",
  price: 12000,
  nameAr: "ديبورا ميلانو - ظل عيون Precious Color",
  nameEn: "Deborah Milano - Precious Color",
  descriptionAr:
    "ظل عيون Precious Color من ديبورا ميلانو — أحادي اللون بقوام رقيق ومريح ولون نقي مكثّف وطويل الثبات.\n\n" +
    "• بريق لؤلؤي في مزيج من الزيوت — لون فائق التصبغ وإشراق.\n" +
    "• تركيبة wet & dry: جافاً للإشراق اللطيف، رطباً لتكثيف اللون واللمعان.\n" +
    "• غني بحمض الهيالورونيك المرطّب.\n" +
    "• 9 درجات: Fancy Nude وPink Vibes وRose Gold وGlam Aubergine وCold Taupe وCopper وTrue Green وDreamy Denim وVery Anthracite.\n" +
    "• 1 g.",
  descriptionEn:
    "Deborah Milano Precious Color — thin, comfortable mono eyeshadow with pure, intense, long-lasting colour.\n\n" +
    "• Sparkling pearls infused in a blend of oils for super-pigmented, luminous colour.\n" +
    "• Wet & dry formula: dry for delicate luminosity, wet to intensify colour and pearl brightness.\n" +
    "• Enriched with hyaluronic acid with well-known hydrating properties.\n" +
    "• 9 shades: Fancy Nude, Pink Vibes, Rose Gold, Glam Aubergine, Cold Taupe, Copper, True Green, Dreamy Denim and Very Anthracite.\n" +
    "• 1 g.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com; hex sampled from pan region in mallardo shade images. */
const SHADES: ShadeInput[] = [
  {
    name: "01 Fancy Nude",
    colorHex: "#d6bdab",
    imageUrl: `${MALLARDO}/172414-large_default/deb-om-mono-precious-col-01.jpg`,
    position: 0,
  },
  {
    name: "02 Pink Vibes",
    colorHex: "#caa1a2",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/172417-large_default/deb-om-mono-precious-col-02.jpg",
    position: 1,
  },
  {
    name: "03 Rose Gold",
    colorHex: "#c69290",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/172420-large_default/deb-om-mono-precious-col-03.jpg",
    position: 2,
  },
  {
    name: "04 Glam Aubergine",
    colorHex: "#9a596d",
    imageUrl: "https://cdn-1-profumeriemallardo.server.it/shop/172423-large_default/deb-om-mono-precious-col-04.jpg",
    position: 3,
  },
  {
    name: "05 Cold Taupe",
    colorHex: "#b99693",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/172426-large_default/deb-om-mono-precious-col-05.jpg",
    position: 4,
  },
  {
    name: "06 Copper",
    colorHex: "#c0927f",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/172429-large_default/deb-om-mono-precious-col-06.jpg",
    position: 5,
  },
  {
    name: "07 True Green",
    colorHex: "#8f826a",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/172432-large_default/deb-om-mono-precious-col-07.jpg",
    position: 6,
  },
  {
    name: "08 Dreamy Denim",
    colorHex: "#81aac6",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/172435-large_default/deb-om-mono-precious-col-08.jpg",
    position: 7,
  },
  {
    name: "09 Very Anthracite",
    colorHex: "#83868b",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/172438-large_default/deb-om-mono-precious-col-09.jpg",
    position: 8,
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
  console.log(`  Category: Makeup → Eyes → Eyeshadow`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
