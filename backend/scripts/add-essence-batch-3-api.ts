/**
 * Essence — 3 new barcodes.
 * Usage: npx tsx scripts/add-essence-batch-3-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FACE_PRIMER = "d179ae24-9cf5-4a70-8dbd-bedd0cfbef0b";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";

const PRODUCTS = [
  {
    barcode: "4059729522696",
    slug: "essence-juicy-bomb-party-jumbo-lipgloss-01-lovely-litchi-30ml",
    price: 5250,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
    nameAr: "إيسنس - ملمع شفاه جامبو جوسي بوم بارتي رقم ٠١ ليتشي ٣٠ مل",
    nameEn: "Essence - Juicy Bomb Party Jumbo Lipgloss 01 Lovely Litchi 30 ml",
    descriptionAr:
      "ملمع شفاه جامبو بحجم كبير بلمعان عالي ولمسة شفافة، برائحة ليتشي حلوة لشفاه لامعة وطبيعية.\n\n" +
      "• حجم جامبو ٣٠ مل.\n• لمعان عالي وشفاف.\n• رائحة ليتشي منعشة.\n• تركيبة غير لاصقة.\n• خالية من البارابين والجلوتين.\n• نباتية ولم تُختبر على الحيوانات.",
    descriptionEn:
      "Juicy Bomb Party Jumbo Lipgloss in XXL 30 ml size with ultra-glossy transparent finish and sweet litchi scent.\n\n" +
      "• Jumbo 30 ml size.\n• High-gloss transparent finish.\n• Fresh litchi fragrance.\n• Non-sticky formula.\n• Free from parabens and gluten.\n• Vegan and cruelty-free.",
  },
  {
    barcode: "4059729517036",
    slug: "essence-silky-blur-poreless-primer-30ml",
    price: 6750,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_PRIMER,
    nameAr: "إيسنس - برايمر وجه سيلكي بلور لإخفاء المسام ٣٠ مل",
    nameEn: "Essence - Silky Blur Poreless Primer 30 ml",
    descriptionAr:
      "برايمر وجه خفيف يمهّد البشرة ويخفّي المسام ويمنح مظهراً ناعماً كالحرير قبل المكياج.\n\n" +
      "• يخفّي المسام ويوحّد ملمس البشرة.\n• مُعزّز بنسبة ٥٪ نياسيناميد.\n• درجة شفافة تناسب جميع البشرات.\n• قوام سائل خفيف وسهل الدمج.\n• رائحة زهرية منعشة.\n• نباتي ولم يُختبر على الحيوانات.",
    descriptionEn:
      "Silky Blur Poreless Primer — lightweight liquid primer that blurs pores and creates a smooth makeup base.\n\n" +
      "• Visibly blurs pores and smooths skin texture.\n• Infused with 5% niacinamide.\n• Universal translucent shade.\n• Lightweight, easy-to-blend liquid texture.\n• Subtle floral scent.\n• Vegan and cruelty-free.",
  },
  {
    barcode: "4059729522450",
    slug: "essence-juicy-bomb-party-jelly-blush-01-cassis-crush-10ml",
    price: 5250,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    nameAr: "إيسنس - بلاشر جيلي جوسي بوم بارتي رقم ٠١ كاسيس ١٠ مل",
    nameEn: "Essence - Juicy Bomb Party Jelly Blush 01 Cassis Crush 10 ml",
    descriptionAr:
      "بلاشر جيلي بقوام منعش يذوب على البشرة ويمنح الخدود لوناً وردياً طبيعياً ومظهراً نضراً.\n\n" +
      "• تركيبة جيلي خفيفة ومنعشة.\n• لون وردي توت ناعم.\n• إطلالة لامعة وطبيعية.\n• مُعزّز بالسكوالان للترطيب.\n• يُطبّق مباشرة على الخدود ويُدمج بالأصابع.\n• نباتي ولم يُختبر على الحيوانات.",
    descriptionEn:
      "Juicy Bomb Party Jelly Blush with a refreshing gel texture for a natural, dewy flush.\n\n" +
      "• Lightweight, refreshing jelly texture.\n• Soft pink berry shade.\n• Natural luminous finish.\n• Enriched with squalane for hydration.\n• Apply directly to cheeks and blend with fingers.\n• Vegan and cruelty-free.",
  },
];

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = (await res.json()) as { data?: { accessToken?: string }; message?: string };
  if (!res.ok) throw new Error(json?.message ?? `Login failed HTTP ${res.status}`);
  token = json.data?.accessToken ?? "";
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

async function main() {
  await login();
  for (const p of PRODUCTS) {
    const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
      `/products/barcode-check?barcode=${p.barcode}`,
    );
    if (check.exists) {
      console.log(`skip ${p.barcode} — exists | ${check.product?.nameAr ?? "?"}`);
      continue;
    }
    const created = await api<{ id: string }>("/products", "POST", {
      sku: p.barcode,
      barcode: p.barcode,
      slug: p.slug,
      brandId: BRAND_ID,
      categoryId: CATEGORY_ID,
      subcategoryId: p.subcategoryId,
      tertiaryCategoryId: p.tertiaryCategoryId,
      subcategoryIds: [p.subcategoryId],
      tertiaryCategoryIds: [p.tertiaryCategoryId],
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      price: p.price,
      originalPrice: p.price,
      stock: 0,
      isActive: true,
      imageIds: [] as string[],
    });
    console.log(`✓ ${p.nameAr}`);
    console.log(`  ID: ${created.id} | ${p.barcode} | ${p.price} IQD`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
