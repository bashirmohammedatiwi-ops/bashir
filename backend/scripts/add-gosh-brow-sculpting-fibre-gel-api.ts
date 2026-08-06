/**
 * GOSH Copenhagen Brow Sculpting Fibre Gel — 2 shades, no images.
 * Source: goshcopenhagen.com
 * Product barcode: 5711914088422 (002 Chestnut)
 * Shade barcodes intentionally omitted per user request.
 * Usage: npx tsx scripts/add-gosh-brow-sculpting-fibre-gel-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const BROW_PENCIL = "b1db1ac0-66ff-4912-8072-0c07e3fffda3";

const PRODUCT = {
  barcode: "5711914088422",
  slug: "gosh-brow-sculpting-fibre-gel-8ml",
  sku: "GSH-BSF-088422",
  price: 11250,
  originalPrice: 12500,
  nameAr:
    "كوش - جل الحواجب براو سكالبتنغ فايبر لتعبئة وتحديد الحواجب 8 مل",
  nameEn:
    "GOSH Copenhagen - Brow Sculpting Fibre Gel 8ml",
  descriptionAr:
    "جل حواجب براو سكالبتنغ فايبر من كوش كوبنهاغن بألياف دقيقة تضيف حجماً وكثافة للحواجب مع لون قابل للبناء من مظهر طبيعي إلى حواجب ممتلئة ومحدّدة.\n\n" +
    "• ألياف دقيقة تبني وتضيف حجماً للحواجب.\n" +
    "• يلوّن ويرفع ويحدّد ويملأ الفراغات.\n" +
    "• فرشاة مدبّبة دقيقة لتطبيق محكم.\n" +
    "• ثبات طويل الأمد يروّض الشعيرات المتمردة.\n" +
    "• نباتي (Vegan).\n" +
    "• درجتان: 001 Nutmeg و002 Chestnut.",
  descriptionEn:
    "GOSH Copenhagen Brow Sculpting Fibre Gel — a brush-on gel with micro-fibres for instantly fuller-looking brows with buildable colour, from natural to full and defined.\n\n" +
    "• Fibres build & add volume to brows.\n" +
    "• Colours, lifts, shapes & defines.\n" +
    "• Tapered brush for precise application.\n" +
    "• Long-lasting — tames unruly brows.\n" +
    "• Vegan.\n" +
    "• 2 shades: 001 Nutmeg and 002 Chestnut.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "001 Nutmeg", colorHex: "#9a7b5e", position: 0 },
  { name: "002 Chestnut", colorHex: "#6b4c3a", position: 1 },
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
  console.log(`  Category: Makeup → Eyebrow → Brow Pencil`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
