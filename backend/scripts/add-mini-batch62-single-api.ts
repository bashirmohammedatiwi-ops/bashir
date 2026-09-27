/**
 * 4-barcode mini batch — Lorenay Incredibles, DermaDerm shampoo, Johnson's refill.
 * Usage: npx tsx scripts/add-mini-batch62-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const MOM_BABY = "0daef5a1-9dfb-44ac-89ca-b2ac80dffbef";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const BABY_CARE = "fbacb6e2-33ed-4071-ae78-21d77aaa476c";

type BrandKey = "lorenay" | "dermaderm" | "johnsons";

type ProductDef = {
  barcode: string;
  brandKey: BrandKey;
  price: number;
  subcategoryId: string;
  tertiaryCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const BRANDS: Record<BrandKey, { brandAr: string; brandEn: string; prefix: string }> = {
  lorenay: { brandAr: "لوريناي", brandEn: "Lorenay", prefix: "LNY" },
  dermaderm: { brandAr: "ديرماديرم", brandEn: "DermaDerm", prefix: "DRD" },
  johnsons: { brandAr: "جونسون بيبي", brandEn: "Johnson's Baby", prefix: "JNS" },
};

export const UNRESOLVED_BARCODES = ["8906012840264"] as const;

const PRODUCTS: ProductDef[] = [
  {
    barcode: "8412428014439",
    brandKey: "lorenay",
    price: 6000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "لوريناي Disney Pixar Incredibles – شامبو ورغوة استحمام 2 في 1 للأطفال 475 مل",
    nameEn: "Lorenay Disney Pixar Incredibles 2-in-1 Bath & Shampoo – 475 ml",
    descriptionAr:
      "غسول لوريناي Incredibles 2 في 1 — شامبو ورغوة استحمام لطيفة للأطفال بدون دموع تقريباً.\n\n• الحجم: 475 مل.",
    descriptionEn:
      "Lorenay Disney Pixar Incredibles 2-in-1 bath & shampoo — gentle kids hair and body wash for tear-free bath time.\n\n• Size: 475 ml.",
  },
  {
    barcode: "8697400691543",
    brandKey: "dermaderm",
    price: 10000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "ديرماديرم Blue Serum – شامبو تقوية الشعر ومقاومة التساقط بالبيوتين والبانثينول والكيراتين 250 مل",
    nameEn: "DermaDerm Blue Serum Hair-Strengthening Shampoo with Biotin, Panthenol, Vitamin E & Keratin – 250 ml",
    descriptionAr:
      "شامبو ديرماديرم الأزرق Blue Serum — يقوّي الشعر ويساعد على تقليل التساقط ببيوتين وبانثينول وفيتامين E وكيراتين.\n\n• الحجم: 250 مل.",
    descriptionEn:
      "DermaDerm Blue Serum strengthening shampoo — fortifies hair and supports anti-hair-fall care with biotin, panthenol, vitamin E and keratin.\n\n• Size: 250 ml.",
  },
  {
    barcode: "3574661659794",
    brandKey: "johnsons",
    price: 12000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "جونسون بيبي – شامبو الأطفال الكلاسيكي عبوة إعادة تعبئة Eco Refill اقتصادية 1 لتر",
    nameEn: "Johnson's Baby Classic Shampoo Eco Refill Pack – 1 L",
    descriptionAr:
      "شامبو جونسون بيبي الكلاسيكي بتركيبة No More Tears — عبوة Eco Refill اقتصادية لإعادة التعبئة.\n\n• الحجم: 1 لتر / 1000 مل.",
    descriptionEn:
      "Johnson's Baby classic shampoo Eco Refill — No More Tears formula in a large economical refill pack.\n\n• Size: 1 L / 1000 ml.",
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
  const listed = await api<Array<{ id: string; name: string }> | { items?: Array<{ id: string; name: string }> }>(
    `/brands?search=${encodeURIComponent(b.brandEn)}&limit=100`,
  );
  const items = Array.isArray(listed) ? listed : (listed as { items?: Array<{ id: string; name: string }> }).items ?? [];
  const exact = items.find((x) => x.name?.toLowerCase() === b.brandEn.toLowerCase());
  if (exact?.id) {
    console.log(`Brand: ${exact.name} (${exact.id}) [exact]`);
    return exact.id;
  }
  // try partial for Johnson's
  const partial = items.find((x) => x.name?.toLowerCase().includes(b.brandEn.toLowerCase().split(" ")[0]!));
  if (key === "johnsons") {
    const j = items.find((x) => /^johnson'?s/i.test(x.name || ""));
    if (j?.id) {
      console.log(`Brand: ${j.name} (${j.id}) [partial]`);
      return j.id;
    }
  }
  if (partial?.id && partial.name.toLowerCase() === b.brandEn.toLowerCase()) {
    return partial.id;
  }
  const created = await api<{ id: string }>("/brands", "POST", {
    name: b.brandEn,
    slug: `${b.brandEn.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-5)}`,
    isActive: true,
  });
  console.log(`Brand: ${b.brandEn} (${created.id}) [created]`);
  return created.id;
}

async function deleteByBarcode(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean; product?: { id: string; nameEn?: string } }>(
    `/products/barcode-check?barcode=${encodeURIComponent(barcode)}`,
  );
  if (!check.exists || !check.product?.id) return false;
  await api(`/products/${check.product.id}`, "DELETE");
  console.log(`  deleted: ${check.product.nameEn ?? check.product.id}`);
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
  console.log(`To add: ${PRODUCTS.length} | unresolved: ${UNRESOLVED_BARCODES.length}\n`);
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
    await deleteByBarcode(p.barcode);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: `${brand.prefix}-${p.barcode.slice(-8)}-${Date.now().toString().slice(-5)}`,
      barcode: p.barcode,
      slug: slugify(p.nameEn, p.barcode),
      brandId: brandIds[p.brandKey]!,
      categoryId: CARE,
      subcategoryId: p.subcategoryId,
      subcategoryIds: [p.subcategoryId],
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

    const verify = await api<{ shades?: unknown[]; brand?: { name?: string } }>(`/products/${created.id}`);
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Shades on ${p.barcode}`);
    console.log(`  ✓ ${p.nameAr}`);
    console.log(`    EN: ${p.nameEn}`);
    console.log(`    brand: ${verify.brand?.name ?? brand.brandEn} | ID: ${created.id} | ${p.price} IQD\n`);
    added += 1;
  }

  console.log(`Done — added ${added}/${PRODUCTS.length}`);
  console.log("\nUnresolved:");
  for (const b of UNRESOLVED_BARCODES) console.log(`  - ${b}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
