/**
 * Retry unresolved barcodes from batch55 — only Go-UPC / retailer-proven GTINs.
 * Usage: npx tsx scripts/add-retry-hard25-batch56-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const HAIR_TREATMENT = "ee39d6a6-5074-43b6-a80c-a7c1b23c3bd1";

type BrandKey = "cosmaline" | "argandeluxe";

type ProductDef = {
  barcode: string;
  legacyBarcodes?: string[];
  brandKey: BrandKey;
  price: number;
  tertiaryCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const BRANDS: Record<BrandKey, { brandAr: string; brandEn: string; prefix: string }> = {
  cosmaline: { brandAr: "كوزمالين", brandEn: "Cosmaline", prefix: "CSM" },
  argandeluxe: { brandAr: "أرغان ديلوكس", brandEn: "Argan De Luxe", prefix: "ADL" },
};

/** Still no exact GTIN proof after Go-UPC / OBF / retailer retry */
export const STILL_UNRESOLVED = [
  "8056860720628",
  "8056860720574",
  "8056860720550",
  "8056860720567",
  "8056860720598",
  "8056860720604",
  "8056860720611",
  "8056860720581",
  "8056860720536",
  "8056860720635",
  "8056860720642",
  "5905562764948",
  "5905562764962",
  "5905562764955",
  "5905562764931",
  "5905562764993",
  "5906692554003",
  "6920428206119",
  "6920428206102",
  "6920428206096", // retailer title only, no brand/size
  "6920428206041",
] as const;

const PRODUCTS: ProductDef[] = [
  {
    barcode: "5281019051725",
    brandKey: "cosmaline",
    price: 8000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كوزمالين Soft Wave – شامبو وبلسم 2 في 1 بلون وردي لتنظيف وتنعيم الشعر 400 مل",
    nameEn: "Cosmaline Soft Wave 2-in-1 Shampoo & Conditioner Pink – 400 ml",
    descriptionAr:
      "شامبو وبلسم كوزمالين Soft Wave 2 في 1 (عبوة وردية) — ينظف الشعر وينعّمه في خطوة واحدة بحجم 400 مل.\n\n• مصدر التعريف: Go-UPC EAN 5281019051725.\n• الحجم: 400 مل.",
    descriptionEn:
      "Cosmaline Soft Wave 2-in-1 shampoo & conditioner (pink pack) — cleanses and conditions in one step.\n\n• Identified via Go-UPC EAN 5281019051725.\n• Size: 400 ml.",
  },
  {
    barcode: "0722267775803",
    legacyBarcodes: ["722267775803"],
    brandKey: "argandeluxe",
    price: 18000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "أرغان ديلوكس – سيروم زيت جوز الهند وفيتامين E لتغذية الشعر وفك التشابك واللمعان 100 مل",
    nameEn: "Argan De Luxe Coconut Oil Hair Serum with Vitamin E – 100 ml",
    descriptionAr:
      "سيروم أرغان ديلوكس بزيت جوز الهند وفيتامين E — يغذّي الشعر ويسهّل التمشيط ويمنح نعومة ولمعاناً لكل أنواع الشعر.\n\n• من UPC 722267775803 → EAN 0722267775803.\n• الحجم: 100 مل.",
    descriptionEn:
      "Argan De Luxe coconut oil serum with vitamin E — nourishes, detangles, and adds smoothness and shine for all hair types.\n\n• From UPC 722267775803 → EAN 0722267775803.\n• Size: 100 ml.",
  },
  {
    barcode: "0722267775643",
    legacyBarcodes: ["722267775643"],
    brandKey: "argandeluxe",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "أرغان ديلوكس – شامبو زيت جوز الهند لتغذية الشعر الجاف والتالف وإكسابه لمعاناً ونعومة 1000 مل",
    nameEn: "Argan De Luxe Coconut Oil Nourishing Shampoo – 1000 ml",
    descriptionAr:
      "شامبو أرغان ديلوكس بزيت جوز الهند بحجم صالون — يغذّي فوراً ويمنح لمعاناً ونعومة ومرونة، ويساعد على إحياء الشعر الجاف والهش والتالف.\n\n• من UPC 722267775643 → EAN 0722267775643.\n• الحجم: 1000 مل.",
    descriptionEn:
      "Argan De Luxe coconut oil shampoo — salon liter size that instantly nourishes for shine, softness and suppleness; helps revitalize dry, brittle, damaged hair.\n\n• From UPC 722267775643 → EAN 0722267775643.\n• Size: 1000 ml.",
  },
  {
    barcode: "0722267775674",
    legacyBarcodes: ["722267775674"],
    brandKey: "argandeluxe",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "أرغان ديلوكس – بلسم زيت جوز الهند وفيتامين E لترطيب وفك التشابك من الجذور حتى الأطراف 1000 مل",
    nameEn: "Argan De Luxe Coconut Oil Conditioner with Vitamin E – 1000 ml",
    descriptionAr:
      "بلسم أرغان ديلوكس بزيت جوز الهند وفيتامين E بحجم صالون — يرطّب ويفك التشابك ويمنح شعراً صحياً لامعاً من الجذور حتى الأطراف لكل أنواع الشعر.\n\n• من UPC 722267775674 → EAN 0722267775674.\n• الحجم: 1000 مل.",
    descriptionEn:
      "Argan De Luxe coconut oil conditioner with vitamin E — salon liter that nourishes, detangles and leaves hair healthy and shiny from root to tip; for all hair types.\n\n• From UPC 722267775674 → EAN 0722267775674.\n• Size: 1000 ml.",
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

async function resolveBrandId(key: BrandKey): Promise<string> {
  const b = BRANDS[key];
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: b.brandAr,
    brandEn: b.brandEn,
    createIfMissing: true,
  });
  if (!resolved.brand?.id) throw new Error(`Brand resolve failed: ${b.brandEn}`);
  console.log(`Brand: ${b.brandEn} (${resolved.brand.id})${resolved.created ? " [created]" : ""}`);
  return resolved.brand.id;
}

async function deleteByBarcode(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${encodeURIComponent(barcode)}`,
  );
  if (!check.exists || !check.product?.id) return false;
  await api(`/products/${check.product.id}`, "DELETE");
  console.log(`  deleted: ${check.product.nameAr ?? check.product.id}`);
  return true;
}

function slugify(nameEn: string, barcode: string): string {
  const base = nameEn
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base}-${barcode.slice(-6)}`;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`To add: ${PRODUCTS.length} | still unresolved: ${STILL_UNRESOLVED.length}\n`);
  await login();
  console.log("Logged in.\n");

  const brandIds: Partial<Record<BrandKey, string>> = {};
  for (const key of new Set(PRODUCTS.map((p) => p.brandKey))) {
    brandIds[key] = await resolveBrandId(key);
  }
  console.log("");

  let added = 0;
  for (const p of PRODUCTS) {
    const brand = BRANDS[p.brandKey];
    console.log(`--- ${p.barcode} ---`);
    for (const legacy of p.legacyBarcodes ?? []) await deleteByBarcode(legacy);
    await deleteByBarcode(p.barcode);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: `${brand.prefix}-${p.barcode.slice(-6)}`,
      barcode: p.barcode,
      slug: slugify(p.nameEn, p.barcode),
      brandId: brandIds[p.brandKey]!,
      categoryId: CARE,
      subcategoryId: HAIR_CARE,
      subcategoryIds: [HAIR_CARE],
      tertiaryCategoryId: p.tertiaryCategoryId,
      tertiaryCategoryIds: [p.tertiaryCategoryId],
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      price: p.price,
      originalPrice: Math.round((p.price * 1.15) / 500) * 500,
      stock: 0,
      isActive: true,
      imageIds: [],
    });

    const verify = await api<{ shades?: unknown[] }>(`/products/${created.id}`);
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Shades on ${p.barcode}`);
    console.log(`  ✓ ${p.nameAr}`);
    console.log(`    EN: ${p.nameEn}`);
    console.log(`    ID: ${created.id} | ${p.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`Done — added ${added}/${PRODUCTS.length}`);
  console.log("\nStill unresolved:");
  for (const b of STILL_UNRESOLVED) console.log(`  - ${b}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
