/**
 * GOSH Copenhagen Matte Blush Up — 3 shades, no images.
 * Source: goshcopenhagen.com
 * Product barcode: 5711914194376 (001 Hot Pink)
 * Shade barcodes intentionally omitted per user request.
 * Usage: npx tsx scripts/add-gosh-matte-blush-up-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";

const PRODUCT = {
  barcode: "5711914194376",
  slug: "gosh-matte-blush-up-cream-blush-14ml",
  sku: "GSH-MBU-194376",
  price: 13500,
  originalPrice: 15000,
  nameAr:
    "كوش - مات بلاش أب بلاشر كريمي غير لامع 14 مل",
  nameEn:
    "GOSH Copenhagen - Matte Blush Up Cream Blush 14ml",
  descriptionAr:
    "بلاشر كريمي مات من كوش كوبنهاغن بتركيبة ناعمة كالحرير تمنح الخدود لوناً طبيعياً منعشاً ومظهراً صحياً يدوم طوال اليوم.\n\n" +
    "• بلاشر كريمي بلمسة نهائية غير لامعة (مات).\n" +
    "• تركيبة ناعمة كالحرير تندمج بسرعة مع البشرة.\n" +
    "• تصبّغ لوني غني وثابت يدوم طوال اليوم.\n" +
    "• أنبوب عملي مع إسفنجة مدمجة لتطبيق سهل وسريع.\n" +
    "• غطاء قابل للقفل لمنع التسرّب.\n" +
    "• خالٍ من العطر — نباتي (Vegan) — معتمد Allergy Certified.\n" +
    "• 3 درجات: 001 Hot Pink و002 Dusty Rose و003 Cherry Berry.",
  descriptionEn:
    "GOSH Copenhagen Matte Blush Up — a silky smooth cream blush that adds a fresh flush of colour to the cheeks for a gorgeous, healthy-looking matte finish.\n\n" +
    "• Matte creamy blush with a natural-looking finish.\n" +
    "• Silky smooth consistency — blends quickly into the skin.\n" +
    "• Long-lasting colour pigmentation.\n" +
    "• Built-in sponge applicator for easy and quick application.\n" +
    "• Twist-lock top to prevent spills.\n" +
    "• Fragrance-free, vegan and Allergy Certified.\n" +
    "• 3 shades: 001 Hot Pink, 002 Dusty Rose and 003 Cherry Berry.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "001 Hot Pink", colorHex: "#e8727a", position: 0 },
  { name: "002 Dusty Rose", colorHex: "#c8928d", position: 1 },
  { name: "003 Cherry Berry", colorHex: "#b5545e", position: 2 },
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
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    subcategoryIds: [CHEEK],
    tertiaryCategoryIds: [BLUSH],
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

  const verify = await api<{ shades?: Array<{ name: string; colorHex?: string; barcode?: string }> }>(
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
  console.log(`  Category: Makeup → Cheek → Blush`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
