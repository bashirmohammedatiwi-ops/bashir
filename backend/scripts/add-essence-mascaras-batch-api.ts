/**
 * Essence I Love Extreme / Get BIG! mascaras — 6 barcodes, no images.
 * Usage: API_BASE=https://deemaalhayat.com/api/v1 ADMIN_PASSWORD=000000 npx tsx scripts/add-essence-mascaras-batch-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const TERTIARY_ID = "e1032b57-c1af-49e3-a408-130468f22736";
const PRICE = 6750;

type ProductInput = {
  barcode: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

function mascaraDesc(
  variantAr: string,
  variantEn: string,
  extraAr: string,
  extraEn: string,
): Pick<ProductInput, "descriptionAr" | "descriptionEn"> {
  return {
    descriptionAr:
      `ماسكارا ${variantAr} من خط آي لوف إكستريم من إيسنس، ${extraAr}\n\n` +
      `• تركيبة سائلة عميقة باللون الأسود.\n• فرشاة كبيرة تغطي كل رمش.\n• خالية من البارابين والعطور.\n• نباتية ولم تُختبر على الحيوانات.\n• مناسبة للاستخدام اليومي.\n• تُطبّق من جذور الرموش إلى الأطراف بحركات متعرجة.`,
    descriptionEn:
      `${variantEn} mascara from the Essence I Love Extreme line. ${extraEn}\n\n` +
      `• Deep black liquid formula.\n• Large brush coats every lash.\n• Free from parabens and fragrance.\n• Vegan and cruelty-free.\n• Suitable for everyday use.\n• Apply from lash roots to tips in a zigzag motion.`,
  };
}

const PRODUCTS: ProductInput[] = [
  {
    barcode: "4250338487516",
    slug: "essence-i-love-extreme-volume-mascara-01-black-12ml",
    nameAr: "إيسنس - ماسكارا آي لوف إكستريم للحجم رقم ١ أسود ١٢ مل",
    nameEn: "Essence - I Love Extreme Volume Mascara 01 Black 12 ml",
    ...mascaraDesc(
      "للحجم",
      "I Love Extreme Volume",
      "تمنح الرموش حجماً كثيفاً ومظهراً دراماتيكياً بفرشاة كبيرة وصبغة سوداء فائقة.",
      "Delivers intense volume and a dramatic lash look with ultra-black pigments and an extra-large brush.",
    ),
  },
  {
    barcode: "4250587739084",
    slug: "essence-i-love-extreme-crazy-volume-mascara-01-black-12ml",
    nameAr: "إيسنس - ماسكارا آي لوف إكستريم كريزي للحجم رقم ١ أسود ١٢ مل",
    nameEn: "Essence - I Love Extreme Crazy Volume Mascara 01 Black 12 ml",
    ...mascaraDesc(
      "كريزي للحجم",
      "I Love Extreme Crazy Volume",
      "تمنح الرموش حجماً جنونياً بفرشاة بلاستيكية كبيرة وتركيبة سوداء كريمية.",
      "Delivers crazy volume with an extra-large plastic brush and a deep black creamy formula.",
    ),
  },
  {
    barcode: "4250338494415",
    slug: "essence-get-big-lashes-volume-boost-waterproof-mascara-01-black-12ml",
    nameAr: "إيسنس - ماسكارا جيت بيج لاشز للحجم المقاومة للماء رقم ١ أسود ١٢ مل",
    nameEn: "Essence - Get BIG! Lashes Volume Boost Waterproof Mascara 01 Black 12 ml",
    descriptionAr:
      "ماسكارا جيت بيج لاشز للحجم المقاومة للماء من إيسنس، تمنح الرموش كثافة وحجماً فاخراً دون تلطيخ.\n\n" +
      "• تركيبة مقاومة للماء والتلطيخ.\n• فرشاة ألياف كبيرة تصل لأصغر الرموش.\n• حجم مكثف دون تكتل أو ثقل.\n• خالية من البارابين.\n• نباتية ولم تُختبر على الحيوانات.\n• مثالية للرياضة والسباحة والمناسبات الطويلة.",
    descriptionEn:
      "Essence Get BIG! Lashes Volume Boost Waterproof Mascara — mega volume that stays put.\n\n" +
      "• Waterproof and smudge-proof formula.\n• Mega fibre brush reaches the finest lashes.\n• Intense volume without clumping or weighing lashes down.\n• Free from parabens.\n• Vegan and cruelty-free.\n• Ideal for sports, swimming and long wear.",
  },
  {
    barcode: "4059729381255",
    slug: "essence-i-love-extreme-crazy-volume-waterproof-mascara-01-black-12ml",
    nameAr: "إيسنس - ماسكارا آي لوف إكستريم كريزي للحجم المقاومة للماء رقم ١ أسود ١٢ مل",
    nameEn: "Essence - I Love Extreme Crazy Volume Waterproof Mascara 01 Black 12 ml",
    ...mascaraDesc(
      "كريزي للحجم المقاومة للماء",
      "I Love Extreme Crazy Volume Waterproof",
      "تمنح الرموش حجماً دراماتيكياً مقاوماً للماء والتلطيخ بفرشاة كبيرة.",
      "Delivers dramatic waterproof volume with an extra-large brush and smudge-proof wear.",
    ),
  },
  {
    barcode: "4059729487704",
    slug: "essence-i-love-extreme-blue-crazy-volume-mascara-12ml",
    nameAr: "إيسنس - ماسكارا آي لوف إكستريم كريزي للحجم الأزرق ١٢ مل",
    nameEn: "Essence - I Love Extreme Blue Crazy Volume Mascara 12 ml",
    descriptionAr:
      "ماسكارا آي لوف إكستريم كريزي للحجم باللون الأزرق من إيسنس، تجمع بين الحجم الكثيف واللون الأزرق المتوهج.\n\n" +
      "• لون أزرق كهربائي مع حجم دراماتيكي.\n• فرشاة كبيرة لطلبة سهلة.\n• خالية من البارابين.\n• نباتية ولم تُختبر على الحيوانات.\n• مثالية لإطلالات جريئة وملونة.",
    descriptionEn:
      "Essence I Love Extreme Blue Crazy Volume Mascara — bold blue colour with extreme volume.\n\n" +
      "• Electric blue shade with dramatic volumising effect.\n• Large brush for easy application.\n• Free from parabens.\n• Vegan and cruelty-free.\n• Perfect for bold, colourful eye looks.",
  },
  {
    barcode: "4250947543214",
    slug: "essence-i-love-extreme-volume-waterproof-mascara-01-black-12ml",
    nameAr: "إيسنس - ماسكارا آي لوف إكستريم للحجم المقاومة للماء رقم ١ أسود ١٢ مل",
    nameEn: "Essence - I Love Extreme Volume Waterproof Mascara 01 Black 12 ml",
    ...mascaraDesc(
      "للحجم المقاومة للماء",
      "I Love Extreme Volume Waterproof",
      "النسخة المقاومة للماء من ماسكارا آي لوف إكستريم للحجم، مثالية للرياضة والسباحة.",
      "The waterproof version of I Love Extreme Volume Mascara — ideal for sports and swimming.",
    ),
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

async function slugTaken(slug: string) {
  const rows = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
    `/products?search=${encodeURIComponent(slug)}&status=all&limit=10`,
  );
  const list = Array.isArray(rows) ? rows : (rows.data ?? []);
  return list.some((p) => p.slug === slug);
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length}\n`);
  await login();
  console.log("Logged in.\n");

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const p of PRODUCTS) {
    try {
      const check = await api<{ exists: boolean; product?: { name?: string; isActive?: boolean } }>(
        `/products/barcode-check?barcode=${p.barcode}`,
      );
      if (check.exists) {
        console.log(
          `skip ${p.barcode} — exists | ${check.product?.name ?? "?"} | ${check.product?.isActive ? "نشط" : "متوقف"}`,
        );
        skip += 1;
        continue;
      }

      if (await slugTaken(p.slug)) {
        console.log(`skip ${p.barcode} — slug taken: ${p.slug}`);
        skip += 1;
        continue;
      }

      const payload = {
        sku: p.barcode,
        barcode: p.barcode,
        slug: p.slug,
        brandId: BRAND_ID,
        categoryId: CATEGORY_ID,
        subcategoryId: SUBCATEGORY_ID,
        tertiaryCategoryId: TERTIARY_ID,
        subcategoryIds: [SUBCATEGORY_ID],
        tertiaryCategoryIds: [TERTIARY_ID],
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
        price: PRICE,
        originalPrice: PRICE,
        stock: 0,
        isActive: true,
        imageIds: [] as string[],
      };

      const created = await api<{ id: string; name?: string }>("/products", "POST", payload);
      console.log(`✓ ${created.name ?? p.nameEn}`);
      console.log(`  ${p.nameAr}`);
      console.log(`  ${p.barcode}`);
      ok += 1;
      await new Promise((r) => setTimeout(r, 350));
    } catch (err) {
      fail += 1;
      console.log(`✗ ${p.barcode}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\n--- Summary ---\nAdded: ${ok}\nSkipped: ${skip}\nFailed: ${fail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
