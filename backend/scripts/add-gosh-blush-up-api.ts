/**
 * GOSH Copenhagen Blush Up — 3 shades, no images.
 * Source: goshcopenhagen.com
 * Product barcode: 5711914188047 (002 Rose)
 * Shade barcodes intentionally omitted per user request.
 * Usage: npx tsx scripts/add-gosh-blush-up-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";

const PRODUCT = {
  barcode: "5711914188047",
  slug: "gosh-blush-up-cream-blush-14ml",
  sku: "GSH-BUP-188047",
  price: 13500,
  originalPrice: 15000,
  nameAr:
    "كوش - بلاش أب بلاشر كريمي لامع 14 مل",
  nameEn:
    "GOSH Copenhagen - Blush Up Cream Blush 14ml",
  descriptionAr:
    "بلاشر كريمي لامع من كوش كوبنهاغن بصبغات لؤلؤية عاكسة للضوء تمنح الخدود توهّجاً طبيعياً صحياً ومشرقاً يدوم طوال اليوم.\n\n" +
    "• بلاشر كريمي بلمسة لؤلؤية متوهّجة.\n" +
    "• صبغات لؤلؤية عاكسة للضوء تمنح إشراقاً طبيعياً.\n" +
    "• تركيبة ناعمة كالحرير تندمج بسرعة مع البشرة بدون لزوجة.\n" +
    "• أنبوب عملي مع إسفنجة مدمجة قابلة للغسل والقفل.\n" +
    "• خالٍ من العطر — نباتي (Vegan) — معتمد Allergy Certified.\n" +
    "• 3 درجات: 001 Peach و002 Rose و003 Coral Red.",
  descriptionEn:
    "GOSH Copenhagen Blush Up — a silky-smooth cream blush enriched with light-reflecting pearlescent pigments for a fresh, radiant glow that lasts all day.\n\n" +
    "• Creamy blush with a radiant pearlescent finish.\n" +
    "• Light-reflecting pearl pigments for a natural glow.\n" +
    "• Silky smooth consistency — blends quickly into the skin without stickiness.\n" +
    "• Built-in sponge applicator — lockable and washable.\n" +
    "• Fragrance-free, vegan and Allergy Certified.\n" +
    "• 3 shades: 001 Peach, 002 Rose and 003 Coral Red.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "001 Peach", colorHex: "#f0b89a", position: 0 },
  { name: "002 Rose", colorHex: "#d98a8e", position: 1 },
  { name: "003 Coral Red", colorHex: "#c9635e", position: 2 },
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
