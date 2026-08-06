/**
 * Confirmed hard barcodes batch — no shades, no images, delete+readd.
 * Sources: GPT Luna + GPT 5.6 Terra deep lookup + retailer pages with literal barcode.
 * Usage: npx tsx scripts/add-hard-barcodes-batch9-single-api.ts
 *
 * Note: gpt-5.6-high is not in available Cursor models; used gpt-5.6-terra-medium.
 */
const API = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const PASS = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const BODY = "23aaaa07-91ee-4937-847e-d7866a9e937a";
const SUN = "25dc8086-bffa-47af-aaf7-64d503e58a9f";
const EYE = "09bedca5-0c6c-4a71-9b03-4bf29cecaf53";
const BODY_LOTION = "fcd86b22-a0fd-47b9-ba4c-c76164dadab2";
const BODY_WHITENING = "5ab05504-516e-4104-a934-6d23666ffdca";
const SUNSCREEN = "ad2a9e6b-5e20-4393-849a-e5e6c6cc97e2";

type BrandKey = "avon" | "vaseline" | "roushun";

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
  avon: { brandAr: "أفون", brandEn: "Avon", prefix: "AVN" },
  vaseline: { brandAr: "فازلين", brandEn: "Vaseline", prefix: "VAS" },
  roushun: { brandAr: "روشون", brandEn: "Roushun", prefix: "RSH" },
};

/** Still no literal barcode→product source after Luna + Terra digs. */
export const UNRESOLVED = [
  "6921199120390",
  "6921199139071",
  "6921199139262",
  "6921199139255",
  "8888086782469",
  "5059018573711",
] as const;

const PRODUCTS: ProductDef[] = [
  {
    barcode: "5050136192266",
    brandKey: "avon",
    price: 22000,
    subcategoryId: FACE,
    tertiaryCategoryId: EYE,
    nameAr: "أفون أنيو بلاتينيوم – جل فوري لتنعيم وشد محيط العين Instant Eye Smoother 15 مل",
    nameEn: "Avon Anew Platinum Instant Eye Smoother – 15 ml",
    descriptionAr:
      "جل أفون أنيو بلاتينيوم Instant Eye Smoother — تركيبة جل خفيفة تشكّل طبقة غير مرئية تشدّ محيط العين وتنعّمه خلال ثوانٍ.\n\n• يقلّل مظهر أكياس تحت العين والانتفاخ والتجاعيد وخطوط قدم الغراب.\n• تأثير شد فوري يدوم طوال اليوم.\n• يرطّب محيط العين ويمنح مظهراً أكثر يقظة.\n• مناسب لجميع أنواع البشرة.\n• ضعي كمية قليلة واتركيها حتى تشعري بشد خفيف ثم جفّفيها.\n• الحجم: 15 مل.",
    descriptionEn:
      "Avon Anew Platinum Instant Eye Smoother — a light gel that forms an invisible film to instantly firm and smooth the eye area.\n\n• Helps reduce the look of under-eye bags, puffiness, wrinkles and crow’s feet.\n• Instant lifting/smoothing effect that lasts throughout the day.\n• Moisturizes for a more awake look.\n• Suitable for all skin types.\n• Apply a small amount, wait for a slight tightening feel, then let dry.\n• Size: 15 ml.",
  },
  {
    barcode: "6921199135219",
    brandKey: "roushun",
    price: 8000,
    subcategoryId: SUN,
    tertiaryCategoryId: SUNSCREEN,
    nameAr: "روشون – لوشن واقي شمس مبيّض بالكولاجين SPF90 للوجه والجسم 200 مل",
    nameEn: "Roushun Collagen Whitening Sunscreen Lotion SPF90 – 200 ml",
    descriptionAr:
      "لوشن واقي شمس روشن بالكولاجين SPF90 — حماية عالية من أشعة UVA/UVB مع ترطيب ودعم إشراقة البشرة وتوحيد مظهرها.\n\n• حماية شمسية قوية مناسبة للوجه والجسم.\n• غني بالكولاجين لترطيب ومرونة أفضل.\n• ملمس خفيف سريع الامتصاص دون لزوجة.\n• يُعاد وضعه كل ساعتين تقريباً.\n• الحجم: 200 مل.\n• المصدر المؤكد للباركود: Dinda Cosmetics (UPC: 6921199135219).",
    descriptionEn:
      "Roushun Collagen Whitening Sunscreen Lotion SPF90 — high UVA/UVB protection with collagen hydration and a brightening, more even-looking finish.\n\n• Strong sun protection for face and body.\n• Collagen-enriched for moisture and elasticity support.\n• Lightweight, fast-absorbing, non-sticky feel.\n• Reapply about every 2 hours.\n• Size: 200 ml.\n• Barcode verified on Dinda Cosmetics (UPC: 6921199135219).",
  },
  {
    barcode: "8888086782476",
    brandKey: "vaseline",
    price: 8000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_WHITENING,
    nameAr: "فازلين – جل تفتيح وانتعاش البشرة Fresh & Youthful Brightening Gel 180 مل",
    nameEn: "Vaseline Fresh & Youthful Brightening Gel – 180 ml",
    descriptionAr:
      "جل فازلين Fresh & Youthful للتفتيح — تركيبة جل منعشة بخلاصة الجينسنغ النقي والمغذيات النباتية لترطيب وإشراقة أوضح خلال أسبوعين تقريباً.\n\n• يغذي البشرة ويساعد على مظهر أكثر إشراقاً وشباباً.\n• مناسب لجميع أنواع البشرة.\n• ملمس جل خفيف غير دهني.\n• الحجم: 180 مل.\n• السعر المرجعي في العراق (Elryan): نحو 8,000 د.ع.\n• الباركود مؤكد على Elryan: 8888086782476.",
    descriptionEn:
      "Vaseline Fresh & Youthful Brightening Gel — a rejuvenating gel with pure ginseng essence and phytonutrients to hydrate and help skin look brighter within about 2 weeks.\n\n• Nourishes for a brighter, more youthful-looking complexion.\n• Suitable for all skin types.\n• Lightweight, non-greasy gel texture.\n• Size: 180 ml.\n• Iraq reference price (Elryan): about 8,000 IQD.\n• Barcode confirmed on Elryan: 8888086782476.",
  },
];

let token = "";

async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
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

function slugify(nameEn: string, barcode: string) {
  return (
    nameEn
      .toLowerCase()
      .replace(/['']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) +
    "-" +
    barcode.slice(-6)
  );
}

async function main() {
  console.log(`API: ${API}`);
  console.log(`Adding ${PRODUCTS.length} confirmed | unresolved ${UNRESOLVED.length}`);
  console.log(`Note: gpt-5.6-high unavailable → used gpt-5.6-terra-medium for hard lookups\n`);

  const login = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  const lj = await login.json();
  token = lj.data?.accessToken ?? lj.accessToken;
  if (!token) throw new Error("Login failed");

  const brandIds: Partial<Record<BrandKey, string>> = {};
  for (const key of Object.keys(BRANDS) as BrandKey[]) {
    const b = BRANDS[key];
    const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
      brandAr: b.brandAr,
      brandEn: b.brandEn,
      createIfMissing: true,
    });
    brandIds[key] = resolved.brand!.id;
    console.log(`Brand: ${b.brandEn} (${brandIds[key]})${resolved.created ? " [created]" : ""}`);
  }
  console.log("");

  let added = 0;
  for (const p of PRODUCTS) {
    const brand = BRANDS[p.brandKey];
    console.log(`--- ${p.barcode} ---`);
    const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
      `/products/barcode-check?barcode=${p.barcode}`,
    );
    if (check.exists && check.product?.id) {
      await api(`/products/${check.product.id}`, "DELETE");
      console.log(`  deleted: ${check.product.nameAr ?? check.product.id}`);
    }

    const created = await api<{ id: string }>("/products", "POST", {
      sku: `${brand.prefix}-${p.barcode.slice(-6)}`,
      barcode: p.barcode,
      slug: slugify(p.nameEn, p.barcode),
      brandId: brandIds[p.brandKey],
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
    console.log(`  ✓ ${p.nameAr}`);
    console.log(`    EN: ${p.nameEn}`);
    console.log(`    ID: ${created.id} | ${p.price} IQD | shades: ${verify.shades?.length ?? 0}\n`);
    added += 1;
  }

  console.log(`Done — added ${added}/${PRODUCTS.length}`);
  console.log("\nUnresolved (no reliable literal barcode match):");
  for (const b of UNRESOLVED) console.log(`  - ${b}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
