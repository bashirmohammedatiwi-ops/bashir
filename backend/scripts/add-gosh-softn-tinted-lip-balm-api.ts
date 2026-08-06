/**
 * GOSH Copenhagen Soft'n Tinted Lip Balm SPF 15 — 10 shades, no images.
 * Source: goshcopenhagen.com
 * Product barcode: 5711914179526 (001 Nude)
 * Shade barcodes intentionally omitted per user request.
 * Usage: npx tsx scripts/add-gosh-softn-tinted-lip-balm-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";

const PRODUCT = {
  barcode: "5711914179526",
  slug: "gosh-softn-tinted-lip-balm-spf15-8ml",
  sku: "GSH-STL-179526",
  price: 11250,
  originalPrice: 12500,
  nameAr:
    "كوش - مرطّب شفاه ملوّن سوفت أن تنتد بحماية SPF 15 — 8 مل",
  nameEn:
    "GOSH Copenhagen - Soft'n Tinted Lip Balm SPF 15 — 8ml",
  descriptionAr:
    "مرطّب شفاه ملوّن من كوش كوبنهاغن بلون شفاف وتركيبة غنية بالمكوّنات المغذّية تمنح الشفاه نعومة ورطوبة ولمعاناً يدوم مع حماية من الشمس SPF 15.\n\n" +
    "• يرطّب الشفاه ويمنحها نعومة فائقة.\n" +
    "• لون شفاف قابل للبناء يعزّز لون الشفاه الطبيعي.\n" +
    "• لمعان مكثّف وطويل الأمد.\n" +
    "• تركيبة غير لزجة ومريحة على الشفاه.\n" +
    "• حماية من أشعة الشمس SPF 15.\n" +
    "• غني بـ Wakapamp وحمض الهيالورونيك.\n" +
    "• خالٍ من العطر — نباتي (Vegan) — معتمد Allergy Certified.\n" +
    "• 10 درجات: 001 Nude و002 Nougat و003 Rose و004 Vintage Rose و005 Pink Rose و006 Berry و007 Pink Soft Ice و008 Cherry Soda و009 Sunny Melon و010 Espresso Martini.",
  descriptionEn:
    "GOSH Copenhagen Soft'n Tinted Lip Balm — a moisturizing tinted lip balm with semi-transparent colour, intense long-lasting shine and SPF 15 sun protection.\n\n" +
    "• Keeps lips soft & moisturized.\n" +
    "• Semi-transparent buildable colour that enhances natural lip tone.\n" +
    "• Ultimate long-lasting shine.\n" +
    "• Non-sticky, comfortable texture.\n" +
    "• Contains SPF 15 sun protection.\n" +
    "• Enriched with Wakapamp and Hyaluronic Acid.\n" +
    "• Fragrance-free, vegan and Allergy Certified.\n" +
    "• 10 shades: 001 Nude, 002 Nougat, 003 Rose, 004 Vintage Rose, 005 Pink Rose, 006 Berry, 007 Pink Soft Ice, 008 Cherry Soda, 009 Sunny Melon and 010 Espresso Martini.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "001 Nude", colorHex: "#d4a58c", position: 0 },
  { name: "002 Nougat", colorHex: "#b88878", position: 1 },
  { name: "003 Rose", colorHex: "#d4838a", position: 2 },
  { name: "004 Vintage Rose", colorHex: "#c27a7e", position: 3 },
  { name: "005 Pink Rose", colorHex: "#d98a9a", position: 4 },
  { name: "006 Berry", colorHex: "#a04858", position: 5 },
  { name: "007 Pink Soft Ice", colorHex: "#e8a8b0", position: 6 },
  { name: "008 Cherry Soda", colorHex: "#b83848", position: 7 },
  { name: "009 Sunny Melon", colorHex: "#e8a070", position: 8 },
  { name: "010 Espresso Martini", colorHex: "#8a5048", position: 9 },
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
  console.log(`  Category: Makeup → Lips → Lip Gloss`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
