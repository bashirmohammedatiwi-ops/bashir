/**
 * GOSH Copenhagen Juicy Lip Butter — 4 shades, no images.
 * Source: goshcopenhagen.com
 * Product barcode: 5711914201173 (001 Sparkling Champagne)
 * Shade barcodes intentionally omitted per user request.
 * Usage: npx tsx scripts/add-gosh-juicy-lip-butter-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";

const PRODUCT = {
  barcode: "5711914201173",
  slug: "gosh-juicy-lip-butter-2-8g",
  sku: "GSH-JLB-201173",
  price: 11250,
  originalPrice: 12500,
  nameAr:
    "كوش - زبدة شفاه ملوّنة جوسي لب بتر 2.8 غرام",
  nameEn:
    "GOSH Copenhagen - Juicy Lip Butter 2.8g",
  descriptionAr:
    "زبدة الشفاه جوسي لب بتر من كوش كوبنهاغن — تركيبة كريمية غنية بالفيتامينات والزيوت المغذية تذوب على الشفاه كالزبدة وتمنحها لمعاناً عصيرياً بلمسة لون شفافة إلى متوسطة.\n\n" +
    "• لمعان عالٍ كملمّع الشفاه بدون قوام سائل.\n" +
    "• ترطيب فوري بفضل زبدة الشيا وزيت السمسم وزبدة الموروموروو.\n" +
    "• مظهر «مزجّج» (Glazed) بلمسة واحدة.\n" +
    "• ثبات مريح يدوم حتى 6 ساعات.\n" +
    "• خالٍ من العطر — نباتي (Vegan).\n" +
    "• 4 درجات: 001 Sparkling Champagne و002 Sweet Treat و003 Autumn Brown و004 Burning Heart.",
  descriptionEn:
    "GOSH Copenhagen Juicy Lip Butter — a buttery-soft, vitamin-rich formula that melts onto lips and delivers vibrant, juicy shine with a sheer-to-medium tint in one swipe.\n\n" +
    "• High-shine gloss finish without a liquid formula.\n" +
    "• Instant hydration with shea butter, sesame seed extract and murumuru butter.\n" +
    "• Glazed, glossy look in a single application.\n" +
    "• Comfortable wear lasting up to 6 hours.\n" +
    "• Fragrance-free and vegan.\n" +
    "• 4 shades: 001 Sparkling Champagne, 002 Sweet Treat, 003 Autumn Brown and 004 Burning Heart.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "001 Sparkling Champagne", colorHex: "#e8c8a8", position: 0 },
  { name: "002 Sweet Treat", colorHex: "#d88898", position: 1 },
  { name: "003 Autumn Brown", colorHex: "#a87060", position: 2 },
  { name: "004 Burning Heart", colorHex: "#c83838", position: 3 },
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
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIP_GLOSS],
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
  console.log(`  Category: Makeup → Lips → Lip Gloss`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
