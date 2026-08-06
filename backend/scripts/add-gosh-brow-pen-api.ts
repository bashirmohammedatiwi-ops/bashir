/**
 * GOSH Copenhagen Brow Pen — 3 shades, no images.
 * Source: goshcopenhagen.com, med24.no
 * Product barcode: 5711914179205 (001 Brown)
 * Shade barcodes intentionally omitted per user request.
 * Usage: npx tsx scripts/add-gosh-brow-pen-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const BROW_PENCIL = "b1db1ac0-66ff-4912-8072-0c07e3fffda3";

const PRODUCT = {
  barcode: "5711914179205",
  slug: "gosh-brow-pen-microblading-1-1ml",
  sku: "GSH-BWP-179205",
  price: 11250,
  originalPrice: 12500,
  nameAr:
    "كوش - قلم حواجب براو بن بتأثير المايكروبليدنغ 1.1 مل",
  nameEn:
    "GOSH Copenhagen - Brow Pen Microblading Effect 1.1ml",
  descriptionAr:
    "قلم حواجب براو بن من كوش كوبنهاغن — قلم سائل بطرف فائق الدقة يرسم خطوطاً رفيعة تشبه الشعيرات الطبيعية لمظهر مايكروبليدنغ احترافي يدوم حتى 20 ساعة.\n\n" +
    "• طرف فلت رفيع جداً لرسم شعيرات دقيقة وواقعية.\n" +
    "• تركيبة مائية تنساب بسلاسة على البشرة.\n" +
    "• يملأ الفراغات ويحدّد ويشكّل الحواجب بمظهر طبيعي.\n" +
    "• ثبات يدوم حتى 20 ساعة.\n" +
    "• مناسب لجميع أنواع الحواجب.\n" +
    "• خالٍ من العطر — نباتي (Vegan).\n" +
    "• 3 درجات: 001 Brown و002 Greybrown و003 Dark Brown.",
  descriptionEn:
    "GOSH Copenhagen Brow Pen — an ultra-fine felt-tip liquid brow pen that draws hair-like strokes for a professional microblading effect lasting up to 20 hours.\n\n" +
    "• Ultra-thin felt tip for precise, realistic hair-like strokes.\n" +
    "• Water-based formula that glides on smoothly.\n" +
    "• Fills, defines and shapes brows with a natural finish.\n" +
    "• Long-lasting wear up to 20 hours.\n" +
    "• Suitable for all brow types.\n" +
    "• Fragrance-free and vegan.\n" +
    "• 3 shades: 001 Brown, 002 Greybrown and 003 Dark Brown.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "001 Brown", colorHex: "#7a5a3a", position: 0 },
  { name: "002 Greybrown", colorHex: "#7a6858", position: 1 },
  { name: "003 Dark Brown", colorHex: "#4a3530", position: 2 },
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
    subcategoryId: EYEBROW,
    tertiaryCategoryId: BROW_PENCIL,
    subcategoryIds: [EYEBROW],
    tertiaryCategoryIds: [BROW_PENCIL],
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
  console.log(`  Category: Makeup → Eyebrow → Brow Pencil`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
