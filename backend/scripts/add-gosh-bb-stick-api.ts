/**
 * GOSH Copenhagen BB Stick — 3 shades, no images.
 * Source: goshcopenhagen.com
 * Product barcode: 5711914211837 (004 Beige)
 * Shade barcodes intentionally omitted per user request.
 * Usage: npx tsx scripts/add-gosh-bb-stick-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";

const PRODUCT = {
  barcode: "5711914211837",
  slug: "gosh-bb-stick-foundation-9g",
  sku: "GSH-BBS-211837",
  price: 13500,
  originalPrice: 15000,
  nameAr:
    "كوش - ستيك أساس بي بي كريمي بتغطية خفيفة إلى متوسطة 9 غرام",
  nameEn:
    "GOSH Copenhagen - BB Stick Foundation 9g",
  descriptionAr:
    "ستيك أساس بي بي من كوش كوبنهاغن — تركيبة كريمية قابلة للبناء تذوب على البشرة وتمنحها لوناً موحّداً طبيعياً مع تأثير ناعم ضبابي (Soft-Focus).\n\n" +
    "• تغطية خفيفة إلى متوسطة بلمسة طبيعية.\n" +
    "• تركيبة كريمية حريرية تندمج مع البشرة بسلاسة.\n" +
    "• قابلة للبناء — طبّقي أكثر للتغطية المطلوبة.\n" +
    "• حجم مدمج مثالي للّمسات السريعة أثناء التنقل.\n" +
    "• غنية بمكونات مغذّية تحافظ على نعومة البشرة.\n" +
    "• 3 درجات: 002 Sand و004 Beige و006 Warm Beige.",
  descriptionEn:
    "GOSH Copenhagen BB Stick — a creamy, buildable foundation stick that melts into the skin for a natural, even skin tone with a soft-focus finish.\n\n" +
    "• Light to medium coverage with a natural finish.\n" +
    "• Silky-smooth, creamy formula that blends seamlessly.\n" +
    "• Buildable — layer for desired coverage.\n" +
    "• Compact size, perfect for touch-ups on the go.\n" +
    "• Enriched with nourishing ingredients for smooth, comfortable wear.\n" +
    "• 3 shades: 002 Sand, 004 Beige and 006 Warm Beige.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "002 Sand", colorHex: "#e8c8a0", position: 0 },
  { name: "004 Beige", colorHex: "#d8b898", position: 1 },
  { name: "006 Warm Beige", colorHex: "#c8a880", position: 2 },
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
    brandAr: "كوش",
    brandEn: "GOSH Copenhagen",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve GOSH Copenhagen brand");
  console.log(`Brand: GOSH Copenhagen (${brandId})${resolved.created ? " [created]" : ""}\n`);
  return brandId;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length} (no images)\n`);
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

  const shades = SHADES.map((shade) => ({
    name: shade.name,
    colorHex: shade.colorHex,
    position: shade.position,
    stock: 0,
  }));

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
    originalPrice: PRODUCT.originalPrice,
    stock: 0,
    isActive: true,
    imageIds: [] as string[],
    shades,
  });

  const verify = await api<{ shades?: Array<{ name: string; colorHex?: string }> }>(
    `/products/${created.id}`,
  );

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD (was ${PRODUCT.originalPrice})`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}`);
  }
  console.log(`  Category: Makeup → Face → Foundation`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
