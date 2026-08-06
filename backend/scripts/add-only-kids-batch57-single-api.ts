/**
 * Add Only Aura Kids shampoos identified via non-Iraqi store rios.pk (SKU/GTIN match).
 * Usage: npx tsx scripts/add-only-kids-batch57-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const MOM_BABY = "0daef5a1-9dfb-44ac-89ca-b2ac80dffbef";
const BABY_CARE = "fbacb6e2-33ed-4071-ae78-21d77aaa476c";

type ProductDef = {
  barcode: string;
  price: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const BRAND = { brandAr: "أونلي أورا", brandEn: "Only Aura", prefix: "OLA" };

/** Still unresolved after non-Iraqi store search */
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
] as const;

const PRODUCTS: ProductDef[] = [
  {
    barcode: "6920428206096",
    price: 7000,
    nameAr: "أونلي أورا كيدز – شامبو أطفال بالتوت الأزرق لتنظيف لطيف لفروة الرأس الحساسة 350 مل",
    nameEn: "Only Aura Kids Blueberry Gentle Shampoo – 350 ml",
    descriptionAr:
      "شامبو أونلي أورا للأطفال برائحة التوت الأزرق — تركيبة لطيفة لشعر وفروة رأس الأطفال، ينظف بلطف دون تجفيف ويمنح نعومة وسهولة تمشيط.\n\n• مصدر التعريف: متجر RIOS باكستان (SKU/GTIN) + قائمة خليجية كـ 2 في 1.\n• الحجم: 350 مل.",
    descriptionEn:
      "Only Aura Kids Blueberry shampoo — mild formula for children's delicate hair and scalp; gentle cleanse with blueberry extracts for soft, manageable hair.\n\n• Source: RIOS.pk (Pakistan) SKU/GTIN match.\n• Size: 350 ml.",
  },
  {
    barcode: "6920428206102",
    price: 7000,
    nameAr: "أونلي أورا كيدز – شامبو أطفال بالفراولة لتنظيف لطيف ورائحة فاكهية محببة 350 مل",
    nameEn: "Only Aura Kids Strawberry Gentle Shampoo – 350 ml",
    descriptionAr:
      "شامبو أونلي أورا للأطفال برائحة الفراولة — ينظف شعر الطفل بلطف ويحافظ على الرطوبة بتركيبة مناسبة لفروة الرأس الحساسة.\n\n• مصدر التعريف: RIOS.pk باكستان.\n• الحجم: 350 مل.",
    descriptionEn:
      "Only Aura Kids Strawberry shampoo — gently cleanses children's hair while helping retain moisture; mild scent kids love.\n\n• Source: RIOS.pk (Pakistan).\n• Size: 350 ml.",
  },
  {
    barcode: "6920428206119",
    price: 7000,
    nameAr: "أونلي أورا كيدز – شامبو أطفال بالمانجو لتنظيف لطيف ورائحة استوائية منعشة 350 مل",
    nameEn: "Only Aura Kids Mango Gentle Shampoo – 350 ml",
    descriptionAr:
      "شامبو أونلي أورا للأطفال برائحة المانجو — تنظيف لطيف يومي لشعر الأطفال مع رائحة استوائية منعشة ونعومة بعد كل غسلة.\n\n• مصدر التعريف: RIOS.pk باكستان.\n• الحجم: 350 مل.",
    descriptionEn:
      "Only Aura Kids Mango shampoo — everyday gentle cleanse for children's hair with a fresh tropical mango scent and soft finish.\n\n• Source: RIOS.pk (Pakistan).\n• Size: 350 ml.",
  },
  {
    barcode: "6920428206041",
    price: 7000,
    nameAr: "أونلي أورا كيدز – شامبو أطفال بالأفوكادو لترطيب وتنعيم الشعر الجاف 350 مل",
    nameEn: "Only Aura Kids Avocado Moisturizing Shampoo – 350 ml",
    descriptionAr:
      "شامبو أونلي أورا للأطفال برائحة الأفوكادو — يرطّب وينعّم شعر الأطفال الجاف بتركيبة لطيفة مناسبة للاستخدام اليومي.\n\n• مصدر التعريف: RIOS.pk باكستان.\n• الحجم: 350 مل.",
    descriptionEn:
      "Only Aura Kids Avocado shampoo — moisturizing gentle cleanse that softens dry children's hair for everyday bath time.\n\n• Source: RIOS.pk (Pakistan).\n• Size: 350 ml.",
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

async function resolveBrandId(): Promise<string> {
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: BRAND.brandAr,
    brandEn: BRAND.brandEn,
    createIfMissing: true,
  });
  if (!resolved.brand?.id) throw new Error("Brand resolve failed");
  console.log(`Brand: ${BRAND.brandEn} (${resolved.brand.id})${resolved.created ? " [created]" : ""}`);
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
  const brandId = await resolveBrandId();
  console.log("");

  let added = 0;
  for (const p of PRODUCTS) {
    console.log(`--- ${p.barcode} ---`);
    await deleteByBarcode(p.barcode);
    const created = await api<{ id: string }>("/products", "POST", {
      sku: `${BRAND.prefix}-${p.barcode.slice(-6)}`,
      barcode: p.barcode,
      slug: slugify(p.nameEn, p.barcode),
      brandId,
      categoryId: CARE,
      subcategoryId: MOM_BABY,
      subcategoryIds: [MOM_BABY],
      tertiaryCategoryId: BABY_CARE,
      tertiaryCategoryIds: [BABY_CARE],
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
  console.log("\nStill unresolved (no non-Iraqi store GTIN match):");
  for (const b of STILL_UNRESOLVED) console.log(`  - ${b}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
