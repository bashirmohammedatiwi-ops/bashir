/**
 * إضافة 6 منتجات ilove Signature Hand & Nail Cream 100ml عبر API — بدون صور.
 * 3 منتجات موجودة مسبقاً (batch4) — السكربت يتخطاها تلقائياً.
 * Usage: npx tsx scripts/add-ilove-hand-nail-cream-signature-batch-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "4f70b98b-0236-41d9-a257-65db3c801091";
const CARE_ID = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HANDS_SUB = "01ad1f0d-7c15-469c-bf86-85abd135e68f";

type ProductInput = {
  barcode: string;
  slug: string;
  price: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  categoryId: string;
  subcategoryId: string;
};

function handNailCream(
  scentAr: string,
  scentEn: string,
): Pick<ProductInput, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn"> {
  return {
    nameAr: `آي لوف - كريم لليدين والأظافف برائحة ${scentAr} 100 مل`,
    nameEn: `I Love - ${scentEn} Hand & Nail Cream 100 ml`,
    descriptionAr:
      `كريم ترميم وترطيب لليدين والأظافف من آي لوف، برائحة ${scentAr}، يُمتص بسرعة ويترك اليدين ناعمة ومرطبة.\n\n` +
      `• يحتوي على 93% مكونات طبيعية المنشأ.\n• مدعّم بزبدة الشيا وزيت جوز الهند العضوي.\n• يحتوي على بروفيتامين B5 وفيتامين E وماء الخيزران.\n• مستخلصات فواكه طبيعية لترطيب وتنعيم اليدين.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُدلّك على اليدين طوال اليوم حتى الامتصاص.`,
    descriptionEn:
      `Restoring hand and nail cream from I Love with a ${scentEn.toLowerCase()} scent. Absorbs quickly to leave hands intensively moisturised, soft and smooth.\n\n` +
      `• 93% naturally derived ingredients.\n• Enriched with shea butter and organic coconut oil.\n• Contains pro-vitamin B5, vitamin E and ACB bamboo bio-water.\n• Natural fruit extracts help condition hands.\n• Vegan and made in the UK.\n• Massage into hands throughout the day until absorbed.`,
  };
}

const PRODUCTS: ProductInput[] = [
  {
    barcode: "5060351545587",
    slug: "ilove-elderflower-fizz-hand-nail-cream-100ml",
    price: 5500,
    ...handNailCream("إلدرفلاور فيز", "Elderflower Fizz"),
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
  },
  {
    barcode: "5060351545655",
    slug: "ilove-vanilla-milk-hand-nail-cream-100ml",
    price: 5500,
    ...handNailCream("الفانيليا والحليب", "Vanilla Milk"),
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
  },
  {
    barcode: "5060351545648",
    slug: "ilove-english-rose-hand-nail-cream-100ml",
    price: 5500,
    ...handNailCream("الورد الإنجليزي", "English Rose"),
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
  },
  {
    barcode: "5060351545594",
    slug: "ilove-violet-dreams-hand-nail-cream-100ml",
    price: 5500,
    ...handNailCream("أحلام البنفسج", "Violet Dreams"),
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
  },
  {
    barcode: "5060351545631",
    slug: "ilove-glazed-raspberry-hand-nail-cream-100ml",
    price: 5500,
    ...handNailCream("التوت المزجج", "Glazed Raspberry"),
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
  },
  {
    barcode: "5060351545617",
    slug: "ilove-exotic-fruit-hand-nail-cream-100ml",
    price: 5500,
    ...handNailCream("الفواكه الاستوائية", "Exotic Fruit"),
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
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
  console.log(`Products: ${PRODUCTS.length}\n`);
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
        categoryId: p.categoryId,
        subcategoryId: p.subcategoryId,
        subcategoryIds: [p.subcategoryId],
        tertiaryCategoryIds: [] as string[],
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

      const created = await api<{ id: string; name?: string }>("/products", "POST", payload);
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
