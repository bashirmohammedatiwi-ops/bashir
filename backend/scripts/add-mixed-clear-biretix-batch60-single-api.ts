/**
 * Mixed Clear / Bepanthen / Biretix / Covermark / S&L — separate SKUs, no shades, no images.
 * Names via GPT Luna; hard codes via GPT 5.6 Sol.
 * Usage: npx tsx scripts/add-mixed-clear-biretix-batch60-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const BODY = "23aaaa07-91ee-4937-847e-d7866a9e937a";
const SUN = "25dc8086-bffa-47af-aaf7-64d503e58a9f";
const MOM_BABY = "0daef5a1-9dfb-44ac-89ca-b2ac80dffbef";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const FACE_MOIST = "21801439-d0e9-4106-b5e8-dfdd70ffeb8d";
const BODY_MOIST = "fcd86b22-a0fd-47b9-ba4c-c76164dadab2";
const SUNSCREEN = "ad2a9e6b-5e20-4393-849a-e5e6c6cc97e2";
const BABY_CARE = "fbacb6e2-33ed-4071-ae78-21d77aaa476c";

type BrandKey = "clear" | "bepanthen" | "biretix" | "covermark" | "sl";

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
  clear: { brandAr: "كلير", brandEn: "Clear", prefix: "CLR" },
  bepanthen: { brandAr: "بيبانثين", brandEn: "Bepanthen", prefix: "BEP" },
  biretix: { brandAr: "بيريتكس", brandEn: "Biretix", prefix: "BRT" },
  covermark: { brandAr: "كفرمارك", brandEn: "Covermark", prefix: "CVM" },
  sl: { brandAr: "إس آند إل", brandEn: "S&L", prefix: "SNL" },
};

export const UNRESOLVED_BARCODES = [
  "6902540752361", // conflicting dermaroller brand/needle depth across retailers
  "725272732267", // no verified retail product (UPC check digit / no catalog match)
] as const;

const PRODUCTS: ProductDef[] = [
  {
    barcode: "079400267238",
    brandKey: "clear",
    price: 14000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    alsoDelete: ["79400267238", "0079400267238"],
    nameAr: "كلير 24/7 Total Care – شامبو عناية يومية كاملة لفروة الرأس بـ أوميغا-3 وحليب جوز الهند 648 مل",
    nameEn: "Clear 24/7 Total Care Nourishing Shampoo with Omega-3 & Coconut Milk – 648 ml (21.9 fl oz)",
    descriptionAr:
      "شامبو كلير 24/7 Total Care — يغذّي فروة الرأس ويقوّي الشعر بتركيبة أوميغا-3 وحليب جوز الهند مع مضخة عملية.\n\n• الحجم: 648 مل / 21.9 أونصة سائلة.\n• من UPC 79400267238 → EAN 079400267238.",
    descriptionEn:
      "Clear 24/7 Total Care shampoo — nourishes the scalp and strengthens hair with Omega-3 and coconut milk; pump bottle.\n\n• Size: 648 ml / 21.9 fl oz.\n• From UPC 79400267238 → EAN 079400267238.",
  },
  {
    barcode: "8851932391818",
    brandKey: "clear",
    price: 5000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كلير للرجال Anti-Hair Fall – شامبو ضد القشرة وتقوية الجذور لتقليل تساقط الشعر بالجنسنغ والكافيين 315 مل",
    nameEn: "Clear Men Anti-Hair Fall Anti-Dandruff Strengthening Shampoo – 315 ml",
    descriptionAr:
      "شامبو كلير للرجال Anti-Hair Fall — ينظّف فروة الرأس بعمق ويساعد على تقليل التساقط والتقشر مع تقوية الجذور (تركيبة رجالية مضادة للقشرة).\n\n• الحجم: 315 مل (بعض الأسواق تعلّمه 320 مل لنفس الباركود).",
    descriptionEn:
      "Clear Men Anti-Hair Fall anti-dandruff shampoo — deep-cleanses the scalp and helps reduce hair fall while strengthening roots.\n\n• Size: 315 ml (some markets label 320 ml on the same barcode).",
  },
  {
    barcode: "8851932391702",
    brandKey: "clear",
    price: 5000,
    subcategoryId: HAIR_CARE,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "كلير Ice Cool Menthol – شامبو ضد القشرة بنعناع ليموني إحساس تبريد منعش لفروة الرأس 330 مل",
    nameEn: "Clear Ice Cool Menthol Anti-Dandruff Shampoo – 330 ml",
    descriptionAr:
      "شامبو كلير Ice Cool Menthol — يزيل القشرة وينظّف فروة الرأس ويمنح إحساساً بارداً منعشاً بنعناع وليمون.\n\n• الحجم: 330 مل.",
    descriptionEn:
      "Clear Ice Cool Menthol anti-dandruff shampoo — removes flakes, cleanses the scalp and leaves a cooling mint-lemon freshness.\n\n• Size: 330 ml.",
  },
  {
    barcode: "5010605142642",
    brandKey: "bepanthen",
    price: 8000,
    subcategoryId: MOM_BABY,
    tertiaryCategoryId: BABY_CARE,
    nameAr: "بيبانثين Baby – مرهم عناية بحفاض الطفل للحماية من طفح الحفاض ببانثينول 30 غ",
    nameEn: "Bepanthen Baby Nappy Care Protective Ointment – 30 g",
    descriptionAr:
      "مرهم بيبانثين للرضّع — حاجز تنفّسي يحمي بشرة منطقة الحفاض ويساعد على تهدئة طفح الحفاض ببانثينول.\n\n• الحجم: 30 غ.",
    descriptionEn:
      "Bepanthen Baby nappy care ointment — breathable barrier cream that helps protect against nappy rash with panthenol.\n\n• Size: 30 g.",
  },
  {
    barcode: "8436574362558",
    brandKey: "biretix",
    price: 28000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_MOIST,
    nameAr: "بيريتكس Tri-Active – بخاخ جسم ثلاثي الفعالية ضد الشوائب وحب الشباب على الجسم 100 مل",
    nameEn: "Biretix Tri-Active Anti-Imperfections Body Spray – 100 ml",
    descriptionAr:
      "بخاخ بيريتكس Tri-Active للجسم — عناية ثلاثية ضد الشوائب والرؤوس السوداء على الظهر والصدر والمناطق الواسعة التطبيق.\n\n• الحجم: 100 مل.\n• Cantabria Labs.",
    descriptionEn:
      "Biretix Tri-Active body spray — triple-action anti-blemish care for back, chest and body areas prone to imperfections.\n\n• Size: 100 ml.\n• Cantabria Labs.",
  },
  {
    barcode: "8470001908285",
    brandKey: "biretix",
    price: 26000,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "بيريتكس Tri-Active – جل وجه ثلاثي الفعالية ضد الشوائب وحب الشباب للبشرة الدهنية 50 مل",
    nameEn: "Biretix Tri-Active Anti-Blemish Face Gel – 50 ml",
    descriptionAr:
      "جل بيريتكس Tri-Active للوجه — يستهدف الشوائب والرؤوس السوداء والبشرة المعرّضة لحب الشباب بتركيبة ديرموكوزمتك.\n\n• الحجم: 50 مل.\n• Cantabria Labs.",
    descriptionEn:
      "Biretix Tri-Active face gel — targets blemishes and imperfections on acne-prone oily skin with dermocosmetic care.\n\n• Size: 50 ml.\n• Cantabria Labs.",
  },
  {
    barcode: "8436574362336",
    brandKey: "biretix",
    price: 24000,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "بيريتكس Hydramat – سائل مرطّب مطفئ للمعة للبشرة الدهنية والمعرّضة للشوائب 50 مل",
    nameEn: "Biretix Hydramat Mattifying & Hydrating Facial Fluid – 50 ml",
    descriptionAr:
      "سائل بيريتكس Hydramat — يرطّب دون دهنية ويساعد على تقليل اللمعان وتنعيم مظهر المسام للبشرة الدهنية والمعرّضة للشوائب.\n\n• الحجم: 50 مل.",
    descriptionEn:
      "Biretix Hydramat fluid — lightweight hydration that helps mattify oily, blemish-prone skin without clogging pores.\n\n• Size: 50 ml.",
  },
  {
    barcode: "8436574361582",
    brandKey: "biretix",
    price: 26000,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "بيريتكس Isorepair – كريم ترطيب وتجديد الحاجز الجلدي للبشرة الجافة والحساسة بعد العلاجات 50 مل",
    nameEn: "Biretix Isorepair Hydrating Regenerating Cream – 50 ml",
    descriptionAr:
      "كريم بيريتكس Isorepair — يرطّب ويساعد على ترميم الحاجز الجلدي للبشرة المرهقة أو الجافة بعد علاجات الشوائب.\n\n• الحجم: 50 مل.",
    descriptionEn:
      "Biretix Isorepair cream — hydrates and helps regenerate the skin barrier for dry, stressed or post-treatment skin.\n\n• Size: 50 ml.",
  },
  {
    barcode: "5201580141632",
    brandKey: "covermark",
    price: 32000,
    subcategoryId: SUN,
    tertiaryCategoryId: SUNSCREEN,
    nameAr: "كفرمارك Rayblock Face Plus – واقي شمس للوجه SPF 50+ للبشرة الجافة والحساسة ملمس غير مرئي 50 مل",
    nameEn: "Covermark Rayblock Face Plus Dry-Sensitive SPF 50+ Invisible Sunscreen – 50 ml",
    descriptionAr:
      "واقي شمس كفرمارك Rayblock Face Plus — حماية عالية SPF 50+ للبشرة الجافة والحساسة بملمس خفيف غير مرئي ومقاوم للماء.\n\n• الحجم: 50 مل.\n• خالٍ من العطر والبارابين (حسب بيانات المنتج).",
    descriptionEn:
      "Covermark Rayblock Face Plus — high SPF 50+ face sunscreen for dry sensitive skin with an invisible light texture.\n\n• Size: 50 ml.\n• Fragrance-free and paraben-free per product claims.",
  },
  {
    barcode: "6903351280159",
    brandKey: "sl",
    price: 12000,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "إس آند إل 6-in-1 – طقم ديرما رولر متعدد الرؤوس للعناية بالبشرة والشعر في المنزل",
    nameEn: "S&L 6-in-1 Multi-Head Dermaroller Kit for Face & Scalp Care",
    descriptionAr:
      "طقم ديرما رولر S&L 6-in-1 — عدة رؤوس قابلة للتبديل لاستخدام منزلي على الوجه أو فروة الرأس حسب التعليمات.\n\n• قطعة واحدة / طقم.\n• عقّم الرأس قبل وبعد كل استخدام واتبع إرشادات السلامة.",
    descriptionEn:
      "S&L 6-in-1 dermaroller kit — multi-head home microneedling set for face or scalp use as directed.\n\n• 1 kit.\n• Sterilize heads before/after use and follow safety guidance.",
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
  // Prefer exact name match — /brands/resolve fuzzy-match can attach wrong brands
  const listed = await api<Array<{ id: string; name: string }> | { items?: Array<{ id: string; name: string }> }>(
    `/brands?search=${encodeURIComponent(b.brandEn)}&limit=100`,
  );
  const items = Array.isArray(listed) ? listed : listed.items ?? [];
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
  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string; nameEn?: string } }>(
    `/products/barcode-check?barcode=${encodeURIComponent(barcode)}`,
  );
  if (!check.exists || !check.product?.id) return false;
  await api(`/products/${check.product.id}`, "DELETE");
  console.log(`  deleted: ${check.product.nameEn ?? check.product.nameAr ?? check.product.id}`);
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
  console.log(`To add: ${PRODUCTS.length} | unresolved skipped: ${UNRESOLVED_BARCODES.length}\n`);
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

    const verify = await api<{ shades?: unknown[] }>(`/products/${created.id}`);
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Shades on ${p.barcode}`);
    console.log(`  ✓ ${p.nameAr}`);
    console.log(`    EN: ${p.nameEn}`);
    console.log(`    ID: ${created.id} | ${p.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`Done — added ${added}/${PRODUCTS.length}`);
  console.log("\nUnresolved barcodes (not added):");
  for (const b of UNRESOLVED_BARCODES) console.log(`  - ${b}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
