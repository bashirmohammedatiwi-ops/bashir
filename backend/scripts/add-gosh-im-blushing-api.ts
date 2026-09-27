/**
 * GOSH Copenhagen I'm Blushing — 5 shades, no images.
 * Source: goshcopenhagen.com, cocooncenter.co.uk
 * Product barcode: 5711914143459 (002 Amour)
 * Shade barcodes intentionally omitted per user request.
 * Usage: npx tsx scripts/add-gosh-im-blushing-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";

const PRODUCT = {
  barcode: "5711914143459",
  slug: "gosh-im-blushing-powder-blush-5-5g",
  sku: "GSH-IMB-143459",
  price: 11250,
  originalPrice: 12500,
  nameAr:
    "كوش - بلاشر بودرة آي أم بلاشنغ غير لامع 5.5 غرام",
  nameEn:
    "GOSH Copenhagen - I'm Blushing Powder Blush 5.5g",
  descriptionAr:
    "بلاشر بودرة آي أم بلاشنغ من كوش كوبنهاغن — بودرة مخملية ناعمة تضيف لمسة لون منعشة للخدود مع لمسة نهائية غير لامعة طبيعية.\n\n" +
    "• صبغة لون عالية الكثافة بلمسة واحدة.\n" +
    "• ملمس حريري خفيف يندمج بسهولة مع البشرة.\n" +
    "• يمكن استخدامه للتحديد والإبراز أو نحت الوجه.\n" +
    "• لمسة نهائية ناعمة خالية من العيوب.\n" +
    "• نباتي (Vegan) — خالٍ من العطر والبارابين.\n" +
    "• 5 درجات: 001 Flirt و002 Amour و003 Passion و004 Crush و005 Shocking Pink.",
  descriptionEn:
    "GOSH Copenhagen I'm Blushing Powder Blush — a velvety soft matte powder that adds a fresh pop of colour to the cheeks with a natural, flawless finish.\n\n" +
    "• High colour pay-off in a single sweep.\n" +
    "• Light, silky texture that blends effortlessly.\n" +
    "• Can be used to define, highlight or contour.\n" +
    "• Smooth, flawless matte finish.\n" +
    "• Vegan, fragrance-free and paraben-free.\n" +
    "• 5 shades: 001 Flirt, 002 Amour, 003 Passion, 004 Crush and 005 Shocking Pink.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "001 Flirt", colorHex: "#f0a898", position: 0 },
  { name: "002 Amour", colorHex: "#d88080", position: 1 },
  { name: "003 Passion", colorHex: "#c06870", position: 2 },
  { name: "004 Crush", colorHex: "#b87060", position: 3 },
  { name: "005 Shocking Pink", colorHex: "#e85888", position: 4 },
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
  console.log(`  Category: Makeup → Cheek → Blush`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
