/**
 * GOSH Copenhagen Metal Eyes Waterproof Eyeliner — 5 shades, no images.
 * Source: goshcopenhagen.com
 * Product barcode: 5711914121686 (002 Moonstone)
 * Shade barcodes intentionally omitted per user request.
 * Usage: npx tsx scripts/add-gosh-metal-eyes-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";

const PRODUCT = {
  barcode: "5711914121686",
  slug: "gosh-metal-eyes-waterproof-eyeliner-1-2g",
  sku: "GSH-MTE-121686",
  price: 9750,
  originalPrice: 11000,
  nameAr:
    "كوش - آيلاينر معدني مقاوم للماء ميتال آيز 1.2 غرام",
  nameEn:
    "GOSH Copenhagen - Metal Eyes Waterproof Eyeliner 1.2g",
  descriptionAr:
    "آيلاينر ميتال آيز من كوش كوبنهاغن — قلم تحديد عيون كريمي بلمسة معدنية لامعة مقاوم للماء يدوم لساعات بدون تشقق أو تلطخ أو بهتان.\n\n" +
    "• لمسة نهائية معدنية لامعة بصبغة لون عالية الكثافة.\n" +
    "• ملمس كريمي ناعم حريري سهل المزج.\n" +
    "• مقاوم للماء ومقاوم للتلطخ طوال اليوم.\n" +
    "• يمكن مزجه بعد التطبيق مباشرة قبل أن يثبت.\n" +
    "• مثالي لرسم خطوط دقيقة أو إطلالة سموكي.\n" +
    "• 5 درجات: 001 Hematite و002 Moonstone و003 Tiger Eye و004 Silver Stone و005 Turquoise.",
  descriptionEn:
    "GOSH Copenhagen Metal Eyes Waterproof Eyeliner — a creamy, metallic-finish eye pencil that lasts for hours without cracking, smudging or fading.\n\n" +
    "• Intense metallic finish with high colour pay-off.\n" +
    "• Soft, silky-smooth, creamy texture — easy to blend.\n" +
    "• Waterproof and smudge-proof all day long.\n" +
    "• Blendable right after application before it sets.\n" +
    "• Perfect for precise lines or a smoky eye look.\n" +
    "• 5 shades: 001 Hematite, 002 Moonstone, 003 Tiger Eye, 004 Silver Stone and 005 Turquoise.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "001 Hematite", colorHex: "#3a3a40", position: 0 },
  { name: "002 Moonstone", colorHex: "#b89868", position: 1 },
  { name: "003 Tiger Eye", colorHex: "#8a5830", position: 2 },
  { name: "004 Silver Stone", colorHex: "#b0b0b8", position: 3 },
  { name: "005 Turquoise", colorHex: "#48a0a0", position: 4 },
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
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    subcategoryIds: [EYES],
    tertiaryCategoryIds: [EYELINER],
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
  console.log(`  Category: Makeup → Eyes → Eyeliner`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
