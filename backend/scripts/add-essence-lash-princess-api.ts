/**
 * إضافة ماسكارات Essence Lash Princess عبر API — بدون صور.
 * Usage: API_BASE=https://deemaalhayat.com/api/v1 ADMIN_PASSWORD=000000 npx tsx scripts/add-essence-lash-princess-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const TERTIARY_ID = "e1032b57-c1af-49e3-a408-130468f22736";

type ProductInput = {
  barcode: string;
  slug: string;
  price: number;
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
      `ماسكارا ${variantAr} من خط لاش برنسس من إيسنس، ${extraAr}\n\n` +
      `• تركيبة سائلة عميقة باللون الأسود.\n• فرشاة ألياف مخصّصة لالتقاط كل رمش.\n• خالية من البارابين والعطور والكحول.\n• نباتية ولم تُختبر على الحيوانات.\n• مناسبة للاستخدام اليومي.\n• تُطبّق من جذور الرموش إلى الأطراف بحركات متعرجة.`,
    descriptionEn:
      `${variantEn} mascara from the Essence Lash Princess line. ${extraEn}\n\n` +
      `• Deep black liquid formula.\n• Specially shaped fibre brush coats every lash.\n• Free from parabens, fragrance and alcohol.\n• Vegan and cruelty-free.\n• Suitable for everyday use.\n• Apply from lash roots to tips in a zigzag motion.`,
  };
}

const PRODUCTS: ProductInput[] = [
  {
    barcode: "4059729207241",
    slug: "essence-lash-princess-false-lash-effect-waterproof-mascara-12ml",
    price: 6000,
    nameAr: "إيسنس - ماسكارا لاش برنسس تأثير الرموش الكثيفة المقاومة للماء 12 مل",
    nameEn: "Essence - Lash Princess False Lash Effect Waterproof Mascara 12 ml",
    ...mascaraDesc(
      "تأثير الرموش الكثيفة المقاومة للماء",
      "False Lash Effect Waterproof",
      "تمنح الرموش طولاً وحجماً ومظهر رموش صناعية مع تركيبة مقاومة للماء والتلطيخ.",
      "Adds length, volume and a false-lash look with a waterproof, smudge-proof formula.",
    ),
  },
  {
    barcode: "4059729327024",
    slug: "essence-lash-princess-curl-volume-mascara-12ml",
    price: 6000,
    nameAr: "إيسنس - ماسكارا لاش برنسس للتجعيد والحجم 12 مل",
    nameEn: "Essence - Lash Princess Curl & Volume Mascara 12 ml",
    ...mascaraDesc(
      "للتجعيد والحجم",
      "Curl & Volume",
      "تُعطي الرموش تجعيداً وحجماً مكثفاً بفرشاة ألياف على شكل فول سوداني، مدعّمة بزيوت الجوجوبا واللوز وعباد الشمس.",
      "Delivers curl and intense volume with a peanut-shaped fibre brush, enriched with jojoba, almond and sunflower oils.",
    ),
  },
  {
    barcode: "4250947501245",
    slug: "essence-lash-princess-volume-mascara-12ml",
    price: 6000,
    nameAr: "إيسنس - ماسكارا لاش برنسس للحجم 12 مل",
    nameEn: "Essence - Lash Princess Volume Mascara 12 ml",
    ...mascaraDesc(
      "للحجم",
      "Volume",
      "تمنح الرموش حجماً مذهلاً وتجعيداً فاخراً بفرشاة على شكل رأس الكوبرا تلتقط كل رمش.",
      "Delivers stunning volume and curl with an innovative cobra-head brush that coats every lash.",
    ),
  },
  {
    barcode: "4059729541703",
    slug: "essence-lash-princess-false-lash-effect-mascara-12ml-eu",
    price: 6000,
    nameAr: "إيسنس - ماسكارا لاش برنسس تأثير الرموش الكثيفة 12 مل",
    nameEn: "Essence - Lash Princess False Lash Effect Mascara 12 ml",
    ...mascaraDesc(
      "تأثير الرموش الكثيفة",
      "False Lash Effect",
      "تمنح الرموش طولاً وحجماً دراماتيكياً ومظهر رموش صناعية بفرشاة ألياف مخروطية.",
      "Adds dramatic length, volume and a false-lash look with a conical fibre brush.",
    ),
  },
  {
    barcode: "4250947516027",
    slug: "essence-lash-princess-false-lash-effect-mascara-12ml",
    price: 6000,
    nameAr: "إيسنس - ماسكارا لاش برنسس تأثير الرموش الكثيفة 12 مل",
    nameEn: "Essence - Lash Princess False Lash Effect Mascara 12 ml",
    ...mascaraDesc(
      "تأثير الرموش الكثيفة",
      "False Lash Effect",
      "تمنح الرموش طولاً وحجماً دراماتيكياً ومظهر رموش صناعية بفرشاة ألياف مخروطية.",
      "Adds dramatic length, volume and a false-lash look with a conical fibre brush.",
    ),
  },
  {
    barcode: "4251232221619",
    slug: "essence-lash-princess-sculpted-volume-mascara-12ml",
    price: 6000,
    nameAr: "إيسنس - ماسكارا لاش برنسس حجم منحوت 12 مل",
    nameEn: "Essence - Lash Princess Sculpted Volume Mascara 12 ml",
    ...mascaraDesc(
      "حجم منحوت",
      "Sculpted Volume",
      "تُشكّل الرموش وتفصلها مع حجم دراماتيكي بفرشاة مدبّبة مخصّصة للتعريف أو التكثيف.",
      "Sculpts and separates lashes with dramatic volume using a tapered brush for defined or fanned-out looks.",
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

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products to add: ${PRODUCTS.length}\n`);
  await login();
  console.log("Logged in.\n");

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const p of PRODUCTS) {
    try {
      const check = await api<{ exists: boolean }>(`/products/barcode-check?barcode=${p.barcode}`);
      if (check.exists) {
        console.log(`skip ${p.barcode} — already exists`);
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
        price: p.price,
        originalPrice: p.price,
        stock: 0,
        isActive: true,
        imageIds: [] as string[],
      };

      const created = await api<{ id: string; name: string }>("/products", "POST", payload);
      console.log(`✓ ${created.name ?? p.nameEn} (${p.barcode})`);
      console.log(`  ${p.nameAr}`);
      ok += 1;
      await new Promise((r) => setTimeout(r, 300));
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
