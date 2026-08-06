/**
 * Just For Me / Cosmo Bounz / Skala / Chupa Chups / Air-Val kids — no shades, no images.
 * Names via GPT Luna. Usage: npx tsx scripts/add-bounz-airval-batch63-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const BODY = "23aaaa07-91ee-4937-847e-d7866a9e937a";
const MOM_BABY = "0daef5a1-9dfb-44ac-89ca-b2ac80dffbef";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const HAIR_TREATMENT = "ee39d6a6-5074-43b6-a80c-a7c1b23c3bd1";
const BODY_CLEANSERS = "35be991e-3062-4fbd-8f0a-2393bf806524";
const BABY_CARE = "fbacb6e2-33ed-4071-ae78-21d77aaa476c";

type BrandKey = "justforme" | "cosmobounz" | "skala" | "chupachups" | "airval";

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
  alsoDelete?: string[];
};

const BRANDS: Record<BrandKey, { brandAr: string; brandEn: string; prefix: string }> = {
  justforme: { brandAr: "جست فور مي", brandEn: "Just For Me", prefix: "JFM" },
  cosmobounz: { brandAr: "كوزمو باونز", brandEn: "Cosmo Bounz", prefix: "CBZ" },
  skala: { brandAr: "سكالا", brandEn: "Skala", prefix: "SKL" },
  chupachups: { brandAr: "تشوبا تشوبس", brandEn: "Chupa Chups", prefix: "CHP" },
  airval: { brandAr: "إير فال", brandEn: "Air-Val", prefix: "AVL" },
};

export const UNRESOLVED_BARCODES = [] as const;

const PRODUCTS: ProductDef[] = [
  {
    barcode: "0802535373006",
    brandKey: "justforme",
    price: 12000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    alsoDelete: ["802535373006"],
    nameAr: "جست فور مي – طقم فرد شعر كريمي بدون لاي للأطفال Super للشعر الخشن والمجعد",
    nameEn: "Just For Me No-Lye Conditioning Crème Relaxer Kit Super for Coarse Kids Hair",
    descriptionAr:
      "طقم جست فور مي Super — فرد كريمي لطيف بدون لاي للأطفال والشعر الخشن، مع ترطيب بجوز الهند وزبدة الشيا وفيتامين E.\n\n• قوة Super للشعر الخشن.\n• من UPC 802535373006.",
    descriptionEn:
      "Just For Me Super no-lye conditioning crème relaxer kit — gentle kids relaxer for coarse hair with coconut milk, shea and vitamin E care.\n\n• Super strength for coarse hair.\n• From UPC 802535373006.",
  },
  {
    barcode: "0802535372009",
    brandKey: "justforme",
    price: 12000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: HAIR_TREATMENT,
    alsoDelete: ["802535372009"],
    nameAr: "جست فور مي – طقم فرد شعر كريمي بدون لاي للأطفال Regular للشعر العادي",
    nameEn: "Just For Me No-Lye Conditioning Crème Relaxer Kit Regular for Kids Hair",
    descriptionAr:
      "طقم جست فور مي Regular — فرد كريمي لطيف بدون لاي للأطفال لشعر أكثر نعومة وسهولة تصفيف.\n\n• قوة Regular للشعر العادي.\n• من UPC 802535372009.",
    descriptionEn:
      "Just For Me Regular no-lye conditioning crème relaxer kit — gentle kids relaxer for normal hair for softer, easier styling.\n\n• Regular strength.\n• From UPC 802535372009.",
  },
  {
    barcode: "6295199816516",
    brandKey: "cosmobounz",
    price: 18000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كوزمو باونز Detox & Revitalize – طقم شامبو وبلسم لتنقية فروة الرأس وإحياء الشعر 2×400 مل",
    nameEn: "Cosmo Bounz Detox & Revitalize Shampoo & Conditioner Set – 2 × 400 ml",
    descriptionAr:
      "طقم كوزمو باونز Detox & Revitalize — ينقّي فروة الرأس من التراكم ويعيد حيوية الشعر.\n\n• الحجم: شامبو 400 مل + بلسم 400 مل.",
    descriptionEn:
      "Cosmo Bounz Detox & Revitalize set — cleanses scalp buildup and revitalizes hair with matching shampoo and conditioner.\n\n• Size: shampoo 400 ml + conditioner 400 ml.",
  },
  {
    barcode: "6295199816530",
    brandKey: "cosmobounz",
    price: 18000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كوزمو باونز Perfect Curls Fortifying – طقم شامبو وبلسم لتقوية الشعر المجعد والهش 2×400 مل",
    nameEn: "Cosmo Bounz Perfect Curls Fortifying Shampoo & Conditioner Set – 2 × 400 ml",
    descriptionAr:
      "طقم كوزمو باونز Perfect Curls Fortifying — يقوّي الشعر المجعد والهش ويحافظ على شكل التجعيدات.\n\n• الحجم: شامبو 400 مل + بلسم 400 مل.",
    descriptionEn:
      "Cosmo Bounz Perfect Curls Fortifying set — strengthens fragile curly hair while supporting curl definition.\n\n• Size: shampoo 400 ml + conditioner 400 ml.",
  },
  {
    barcode: "6295199816479",
    brandKey: "cosmobounz",
    price: 18000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "كوزمو باونز Ultra Fortifying Kids – طقم شامبو وبلسم تقوية لشعر الأطفال 2×400 مل",
    nameEn: "Cosmo Bounz Ultra Fortifying Kids Shampoo & Conditioner Set – 2 × 400 ml",
    descriptionAr:
      "طقم كوزمو باونز للأطفال Ultra Fortifying — يقوّي شعر الأطفال بلطف ويسهّل التمشيط.\n\n• الحجم: شامبو 400 مل + بلسم 400 مل.",
    descriptionEn:
      "Cosmo Bounz Ultra Fortifying Kids set — gentle strengthening shampoo and conditioner for children’s hair.\n\n• Size: shampoo 400 ml + conditioner 400 ml.",
  },
  {
    barcode: "6295199816578",
    brandKey: "cosmobounz",
    price: 18000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كوزمو باونز Nutri Smooth – طقم شامبو وبلسم تغذية وتنعيم للشعر المستقيم والمسرّح 2×400 مل",
    nameEn: "Cosmo Bounz Nutri Smooth Shampoo & Conditioner Set – 2 × 400 ml",
    descriptionAr:
      "طقم كوزمو باونز Nutri Smooth — يغذّي وينعّم الشعر المستقيم أو المسرّح ويقلل الهيشان.\n\n• الحجم: شامبو 400 مل + بلسم 400 مل.",
    descriptionEn:
      "Cosmo Bounz Nutri Smooth set — nourishes and smoothes straight or straightened hair with less frizz.\n\n• Size: shampoo 400 ml + conditioner 400 ml.",
  },
  {
    barcode: "6295199816561",
    brandKey: "cosmobounz",
    price: 18000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كوزمو باونز Magic Waves – طقم شامبو وبلسم لتحديد وتمليس الموجات والتجعيدات الخفيفة 2×400 مل",
    nameEn: "Cosmo Bounz Magic Waves Shampoo & Conditioner Set – 2 × 400 ml",
    descriptionAr:
      "طقم كوزمو باونز Magic Waves — يبرز جمال الشعر المموج إلى المجعد الخفيف بنعومة ومرونة دون إثقال.\n\n• الحجم: شامبو 400 مل + بلسم 400 مل.",
    descriptionEn:
      "Cosmo Bounz Magic Waves set — enhances wavy to lightly curly hair with softness and bounce without heaviness.\n\n• Size: shampoo 400 ml + conditioner 400 ml.",
  },
  {
    barcode: "6295199816486",
    brandKey: "cosmobounz",
    price: 18000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "كوزمو باونز Ultra Nourishing Kids – طقم شامبو وبلسم تغذية مكثفة لشعر الأطفال المجعد والمموج 2×400 مل",
    nameEn: "Cosmo Bounz Ultra Nourishing Kids Shampoo & Conditioner Set – 2 × 400 ml",
    descriptionAr:
      "طقم كوزمو باونز للأطفال Ultra Nourishing — يغذّي شعر الأطفال المجعد أو المموج ويسهّل فك التشابك.\n\n• الحجم: شامبو 400 مل + بلسم 400 مل.",
    descriptionEn:
      "Cosmo Bounz Ultra Nourishing Kids set — deeply nourishes curly/wavy kids’ hair for softer, easier detangling.\n\n• Size: shampoo 400 ml + conditioner 400 ml.",
  },
  {
    barcode: "7897042017874",
    brandKey: "skala",
    price: 14000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "سكالا Expert Amor Poderoso – طقم شامبو وبلسم تغذية قوية للشعر الجاف والتالف 325 مل + 200 مل",
    nameEn: "Skala Expert Amor Poderoso Shampoo & Conditioner Kit – 325 ml + 200 ml",
    descriptionAr:
      "طقم سكالا Amor Poderoso — تغذية مكثفة للشعر الجاف والتالف بتركيبة برازيلية Expert.\n\n• الحجم: شامبو 325 مل + بلسم 200 مل.",
    descriptionEn:
      "Skala Expert Amor Poderoso kit — powerful nourishing shampoo and conditioner for dry damaged hair.\n\n• Size: shampoo 325 ml + conditioner 200 ml.",
  },
  {
    barcode: "5013692272964",
    brandKey: "chupachups",
    price: 16000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_CLEANSERS,
    nameAr: "تشوبا تشوبس Cheeky Cherry – طقم هدايا ثلاثي جل استحمام ورذاذ جسم وإسفنجة برائحة الكرز",
    nameEn: "Chupa Chups Cheeky Cherry Pamper Yourself Trio Gift Set – Gel 300 ml + Mist 100 ml + Sponge",
    descriptionAr:
      "طقم تشوبا تشوبس Cheeky Cherry — جل استحمام 300 مل + رذاذ جسم 100 مل + إسفنجة برائحة الكرز المرحة.\n\n• طقم هدية ثلاثي.",
    descriptionEn:
      "Chupa Chups Cheeky Cherry pamper trio — bath & shower gel 300 ml, body mist 100 ml and sponge with cherry scent.\n\n• 3-piece gift set.",
  },
  {
    barcode: "8411114090382",
    brandKey: "airval",
    price: 7000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "إير فال Marvel Spider-Man – جل استحمام وشامبو 2 في 1 للأطفال 400 مل",
    nameEn: "Air-Val Marvel Spider-Man 2-in-1 Shower Gel & Shampoo – 400 ml",
    descriptionAr:
      "غسول إير فال سبايدر مان 2 في 1 — جل استحمام وشامبو لطيف للأطفال بشخصية مارفل.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Air-Val Marvel Spider-Man 2-in-1 shower gel & shampoo — gentle kids hair and body wash.\n\n• Size: 400 ml.",
  },
  {
    barcode: "8411114090535",
    brandKey: "airval",
    price: 7000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "إير فال Marvel Captain America – جل استحمام وشامبو 2 في 1 للأطفال 400 مل",
    nameEn: "Air-Val Marvel Captain America 2-in-1 Shower Gel & Shampoo – 400 ml",
    descriptionAr:
      "غسول إير فال كابتن أمريكا 2 في 1 — جل استحمام وشامبو لطيف للأطفال.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Air-Val Marvel Captain America 2-in-1 shower gel & shampoo — gentle kids wash.\n\n• Size: 400 ml.",
  },
  {
    barcode: "8411114092690",
    brandKey: "airval",
    price: 7000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "إير فال Disney Minnie Mouse – جل استحمام وشامبو 2 في 1 للأطفال 400 مل",
    nameEn: "Air-Val Disney Minnie Mouse 2-in-1 Shower Gel & Shampoo – 400 ml",
    descriptionAr:
      "غسول إير فال ميني ماوس 2 في 1 — جل استحمام وشامبو لطيف للبنات.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Air-Val Disney Minnie Mouse 2-in-1 shower gel & shampoo — gentle kids wash.\n\n• Size: 400 ml.",
  },
  {
    barcode: "8411114090375",
    brandKey: "airval",
    price: 7000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "إير فال Eau My Unicorn – جل استحمام وشامبو ورغوة 2 في 1 برائحة يونيكورن للأطفال 400 مل",
    nameEn: "Air-Val Eau My Unicorn 2-in-1 Shower Gel & Shampoo – 400 ml",
    descriptionAr:
      "غسول إير فال Eau My Unicorn 2 في 1 — جل استحمام وشامبو ورغوة حمام ممتعة للأطفال.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Air-Val Eau My Unicorn 2-in-1 shower gel & shampoo — playful kids wash and bath foam.\n\n• Size: 400 ml.",
  },
  {
    barcode: "8411114095202",
    brandKey: "airval",
    price: 7000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "إير فال Barbie – جل استحمام وشامبو 2 في 1 للأطفال 400 مل",
    nameEn: "Air-Val Barbie 2-in-1 Shower Gel & Shampoo – 400 ml",
    descriptionAr:
      "غسول إير فال باربي 2 في 1 — جل استحمام وشامبو لطيف للأطفال.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Air-Val Barbie 2-in-1 shower gel & shampoo — gentle kids hair and body wash.\n\n• Size: 400 ml.",
  },
  {
    barcode: "8411114090498",
    brandKey: "airval",
    price: 7000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "إير فال Disney Frozen Elsa – جل استحمام وشامبو 2 في 1 مع مجسّم للأطفال 400 مل",
    nameEn: "Air-Val Disney Frozen Elsa 2-in-1 Shower Gel & Shampoo with Figurine – 400 ml",
    descriptionAr:
      "غسول إير فال فروزن إلسا 2 في 1 — جل استحمام وشامبو للأطفال مع مجسّم على العبوة.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Air-Val Disney Frozen Elsa 2-in-1 shower gel & shampoo — gentle kids wash with character figurine packaging.\n\n• Size: 400 ml.",
  },
  {
    barcode: "8411114090436",
    brandKey: "airval",
    price: 7000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "إير فال PAW Patrol Chase – جل استحمام وشامبو 2 في 1 للأطفال 400 مل",
    nameEn: "Air-Val PAW Patrol Chase 2-in-1 Shower Gel & Shampoo – 400 ml",
    descriptionAr:
      "غسول إير فال باو باترول تشيس 2 في 1 — جل استحمام وشامبو لطيف للأطفال.\n\n• الحجم: 400 مل.",
    descriptionEn:
      "Air-Val PAW Patrol Chase 2-in-1 shower gel & shampoo — gentle kids hair and body wash.\n\n• Size: 400 ml.",
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
  console.log(`To add: ${PRODUCTS.length}\n`);
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
    for (const extra of p.alsoDelete ?? []) await deleteByBarcode(extra);
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
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`Done — added ${added}/${PRODUCTS.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
