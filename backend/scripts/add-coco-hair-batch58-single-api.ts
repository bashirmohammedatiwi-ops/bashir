/**
 * Add remaining COCO HAIR Italian EANs (best-effort catalog mapping).
 * Polish 590… left unresolved — no product identity found.
 * Usage: npx tsx scripts/add-coco-hair-batch58-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const HAIR_TREATMENT = "ee39d6a6-5074-43b6-a80c-a7c1b23c3bd1";

type ProductDef = {
  barcode: string;
  price: number;
  tertiaryCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const BRAND = { brandAr: "كوكو هير", brandEn: "Coco Hair", prefix: "CCH" };

export const STILL_UNRESOLVED_POLISH = [
  "5905562764948",
  "5905562764962",
  "5905562764955",
  "5905562764931",
  "5905562764993",
  "5906692554003",
] as const;

const PRODUCTS: ProductDef[] = [
  {
    barcode: "8056860720536",
    price: 14000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كوكو هير 24K – شامبو مرطب ومنعّم لتغذية الشعر الجاف والمتضرر 750 مل",
    nameEn: "Coco Hair 24K Moisturizing Softening Shampoo – 750 ml",
    descriptionAr:
      "شامبو كوكو هير 24K — ينظف ويرطّب وينعّم الشعر الجاف والمتضرر بتركيبة مغذية بحجم صالون.\n\n• الحجم: 750 مل.\n• ملاحظة: مطابقة باركود تقديرية ضمن سلسلة المنتج.",
    descriptionEn:
      "Coco Hair 24K moisturizing softening shampoo — cleanses, hydrates and softens dry damaged hair in a salon-size bottle.\n\n• Size: 750 ml.\n• Note: best-effort barcode mapping within the product series.",
  },
  {
    barcode: "8056860720550",
    price: 14000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كوكو هير 24K – بلسم مرطب ومنعّم لفك التشابك وإكساب اللمعان 750 مل",
    nameEn: "Coco Hair 24K Moisturizing Softening Conditioner – 750 ml",
    descriptionAr:
      "بلسم كوكو هير 24K — يرطّب بعمق ويسهّل التمشيط ويمنح لمعاناً ونعومة للشعر المتضرر.\n\n• الحجم: 750 مل.",
    descriptionEn:
      "Coco Hair 24K moisturizing softening conditioner — deep hydration, easier detangling, shine and softness for damaged hair.\n\n• Size: 750 ml.",
  },
  {
    barcode: "8056860720567",
    price: 16000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "كوكو هير 24K – ماسك ترميم مكثف لترطيب وإصلاح الشعر التالف 300 مل",
    nameEn: "Coco Hair 24K Moisturizing Repair Hair Mask – 300 ml",
    descriptionAr:
      "ماسك كوكو هير 24K — علاج مكثف لترطيب وإصلاح الشعر التالف واستعادة النعومة واللمعان.\n\n• الحجم: 300 مل.",
    descriptionEn:
      "Coco Hair 24K moisturizing repair mask — intensive treatment to hydrate and repair damaged hair for softness and shine.\n\n• Size: 300 ml.",
  },
  {
    barcode: "8056860720574",
    price: 12000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "كوكو هير – معزز زيت الأرغان المغربي لتغذية الشعر واللمعان 50 مل",
    nameEn: "Coco Hair Moroccan Argan Oil Booster Serum – 50 ml",
    descriptionAr:
      "سيروم/معزز كوكو هير بزيت الأرغان المغربي — يغذّي الشعر ويقلل الهيشان ويمنح لمعاناً حريرياً.\n\n• الحجم: 50 مل.",
    descriptionEn:
      "Coco Hair Moroccan argan oil booster serum — nourishes hair, helps control frizz and adds silky shine.\n\n• Size: 50 ml.",
  },
  {
    barcode: "8056860720581",
    price: 12000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "كوكو هير بلاك دايموند – سيروم بزيت المكاديميا لتنعيم الشعر ولمعانه 50 مل",
    nameEn: "Coco Hair Black Diamond Macadamia Oil Hair Serum – 50 ml",
    descriptionAr:
      "سيروم كوكو هير بلاك دايموند بزيت المكاديميا — ينعّم الشعر ويمنح لمعاناً عالياً ويساعد على فك التشابك.\n\n• الحجم: 50 مل.",
    descriptionEn:
      "Coco Hair Black Diamond macadamia oil serum — smooths hair, boosts high-gloss shine and helps detangle.\n\n• Size: 50 ml.",
  },
  {
    barcode: "8056860720598",
    price: 14000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كوكو هير – شامبو الأرغان والسيراميد لإصلاح وترطيب الشعر التالف 750 مل",
    nameEn: "Coco Hair Argan & Ceramide Repair Shampoo – 750 ml",
    descriptionAr:
      "شامبو كوكو هير بالأرغان والسيراميد — يغذّي ويرمّم بنية الشعر التالف ويرطّب من الجذور حتى الأطراف.\n\n• الحجم: 750 مل.",
    descriptionEn:
      "Coco Hair argan & ceramide shampoo — nourishes and helps repair damaged hair fibre while hydrating from roots to ends.\n\n• Size: 750 ml.",
  },
  {
    barcode: "8056860720604",
    price: 14000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كوكو هير – بلسم الأرغان والسيراميد لتنعيم الشعر وتقوية الألياف 750 مل",
    nameEn: "Coco Hair Argan & Ceramide Repair Conditioner – 750 ml",
    descriptionAr:
      "بلسم كوكو هير بالأرغان والسيراميد — ينعّم ويقوّي ألياف الشعر ويسهّل التمشيط بعد كل غسلة.\n\n• الحجم: 750 مل.",
    descriptionEn:
      "Coco Hair argan & ceramide conditioner — softens and strengthens hair fibre and makes combing easier after every wash.\n\n• Size: 750 ml.",
  },
  {
    barcode: "8056860720611",
    price: 16000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "كوكو هير – ماسك زيت الأرغان لإصلاح عميق للشعر الجاف والتالف 300 مل",
    nameEn: "Coco Hair Argan Oil Deep Repair Hair Mask – 300 ml",
    descriptionAr:
      "ماسك كوكو هير بزيت الأرغان — علاج عميق لإصلاح وترطيب الشعر الجاف والتالف واستعادة الحيوية.\n\n• الحجم: 300 مل.",
    descriptionEn:
      "Coco Hair argan oil deep repair mask — intensive care to restore dry, damaged hair with moisture and vitality.\n\n• Size: 300 ml.",
  },
  {
    barcode: "8056860720628",
    price: 14000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كوكو هير دايموند – شامبو لجميع أنواع الشعر للتغذية واللمعان 750 مل",
    nameEn: "Coco Hair Diamond Nourishing Shampoo for All Hair Types – 750 ml",
    descriptionAr:
      "شامبو كوكو هير دايموند — يغذّي وينظف جميع أنواع الشعر ويمنح لمعاناً صحياً بحجم اقتصادي.\n\n• الحجم: 750 مل.",
    descriptionEn:
      "Coco Hair Diamond nourishing shampoo — cleanses and feeds all hair types for healthy shine in a generous bottle.\n\n• Size: 750 ml.",
  },
  {
    barcode: "8056860720635",
    price: 14000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كوكو هير دايموند – بلسم لجميع أنواع الشعر للترطيب وفك التشابك 750 مل",
    nameEn: "Coco Hair Diamond Nourishing Conditioner for All Hair Types – 750 ml",
    descriptionAr:
      "بلسم كوكو هير دايموند — يرطّب ويفك التشابك ويمنح نعومة لجميع أنواع الشعر.\n\n• الحجم: 750 مل.",
    descriptionEn:
      "Coco Hair Diamond nourishing conditioner — hydrates, detangles and softens all hair types.\n\n• Size: 750 ml.",
  },
  {
    barcode: "8056860720642",
    price: 16000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "كوكو هير دايموند – ماسك شعر مكثف للترطيب واللمعان 300 مل",
    nameEn: "Coco Hair Diamond Intensive Moisturizing Hair Mask – 300 ml",
    descriptionAr:
      "ماسك كوكو هير دايموند — علاج مكثف لترطيب الشعر وإكسابه لمعاناً ونعومة فائقة.\n\n• الحجم: 300 مل.",
    descriptionEn:
      "Coco Hair Diamond intensive hair mask — deep moisture treatment for shine and ultra-soft hair.\n\n• Size: 300 ml.",
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
  console.log(`To add: ${PRODUCTS.length} Coco Hair | Polish skipped: ${STILL_UNRESOLVED_POLISH.length}\n`);
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
  console.log("\nPolish still unresolved (no product identity):");
  for (const b of STILL_UNRESOLVED_POLISH) console.log(`  - ${b}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
