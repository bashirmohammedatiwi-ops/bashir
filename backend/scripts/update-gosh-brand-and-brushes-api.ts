/**
 * Fix GOSH brand Arabic name to كوش + update 5 brush products.
 * Usage: npx tsx scripts/update-gosh-brand-and-brushes-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "2efeb1c1-b018-4316-b0df-1799c38e6c1f";

const PRODUCTS: Array<{ id: string; barcode: string; copy: { nameAr: string; descriptionAr: string } }> = [
  {
    id: "1d47932d-476f-4360-b3d6-2c64b6db4b11",
    barcode: "5711914215552",
    copy: {
      nameAr: "كوش - فرشاة وجه Foundation Brush",
      descriptionAr:
        "فرشاة Foundation Brush من كوش — رفيقتك لتوزيع الفاونديشن السائل والكريمي بإطلالة ناعمة ومتجانسة.\n\n" +
        "• شعيرات صناعية 100% فائقة النعومة — لا تمتص المنتج.\n" +
        "• رأس مسطّح ومستدير قليلاً لتوزيع متساوٍ بدون خطوط.\n" +
        "• مقبض مريح يمنح تحكماً كاملاً أثناء التطبيق.\n" +
        "• نباتية (Vegan) — مناسبة لجميع أنواع البشرة.\n" +
        "• ضعي كمية صغيرة من الفاونديشن على الوجه ووزّعيها بحركات ناعمة من الوسط نحو الخارج.",
    },
  },
  {
    id: "07499b8d-205f-4141-a960-c83533be586f",
    barcode: "5711914215750",
    copy: {
      nameAr: "كوش - فرشاة عيون دقيقة Precision Brush",
      descriptionAr:
        "فرشاة Precision Brush من كوش — لتطبيق ودمج ظلال العيون بدقة في ثنية العين والزوايا الداخلية وخط الرموش.\n\n" +
        "• شعيرات صناعية 100% ناعمة وعالية الجودة.\n" +
        "• رأس مدبّب رفيع لعمل تفصيلي وتطبيق محدد.\n" +
        "• مثالية لتحديد ثنية العين وإبراز الزوايا الداخلية.\n" +
        "• مقبض مريح لأقصى دقة وتحكم.\n" +
        "• نباتية (Vegan) — لطيفة على منطقة العين الحساسة.",
    },
  },
  {
    id: "a1927484-b44b-451c-81a1-e252a18bf018",
    barcode: "5711914215859",
    copy: {
      nameAr: "كوش - فرشاة دمج ظلال Blender Brush",
      descriptionAr:
        "فرشاة Blender Brush من كوش — لدمج ظلال العيون بسهولة وإطلالات ناعمة بانتقالات طبيعية.\n\n" +
        "• شعيرات صناعية 100% ناعمة وخفيفة لتوزيع متساوٍ.\n" +
        "• شكل دائري منتفخ مثالي للدمج والتدرج بين الدرجات.\n" +
        "• تمنح إطلالات عيون متعددة الأبعاد بلمسة احترافية.\n" +
        "• مقبض مريح لتحكم كامل أثناء الدمج.\n" +
        "• نباتية (Vegan) — لطيفة على منطقة العين الحساسة.",
    },
  },
  {
    id: "dd692faf-7240-4e1b-b219-04effc2ac66a",
    barcode: "5711914215705",
    copy: {
      nameAr: "كوش - فرشاة حواجب وكحل Brow & Eye Liner Brush",
      descriptionAr:
        "فرشاة Brow & Eye Liner Brush من كوش — فرشاة 2 في 1 لتحديد الحواجب وخط الكحل بدقة احترافية.\n\n" +
        "• رأس مائلة رفيعة لتطبيق دقيق للحواجب والآيلاينر.\n" +
        "• فرشاة حواجب مدمجة لتصفيف وتحديد الشكل.\n" +
        "• شعيرات صناعية 100% ناعمة — لا تمتص المنتج.\n" +
        "• مثالية مع البوماد والجل والبودرة للحواجب وكحل الكريمي والبودرة.\n" +
        "• نباتية وخالية من التجارب على الحيوانات (Vegan & Cruelty-Free).",
    },
  },
  {
    id: "20318674-c14a-483e-bf93-d323d14d3705",
    barcode: "5711914215903",
    copy: {
      nameAr: "كوش - فرشاة مزج وتطبيق Mix & Fix Brush",
      descriptionAr:
        "فرشاة Mix & Fix Brush من كوش — فرشاة مبتكرة لتطبيق ومزج منتجات المكياج السائلة بسهولة.\n\n" +
        "• تجويف مدمج بين الشعيرات لخلط الفاونديشن والبرايمر أو السيروم.\n" +
        "• توزيع متحكم به بدون هدر للمنتج.\n" +
        "• شعيرات صناعية 100% ناعمة لإنهاء ناعم ومتجانس.\n" +
        "• مثالية لتخصيص الخلطات وتطبيق القوام السائل.\n" +
        "• نباتية (Vegan) — مناسبة لجميع أنواع البشرة.",
    },
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
  await login();
  console.log("Logged in.\n");

  const brandBefore = await api<{ name?: string }>(`/brands/${BRAND_ID}`);
  console.log(`Brand before: ${brandBefore.name}`);

  const brand = await api<{ name?: string }>(`/brands/${BRAND_ID}`, "PATCH", { name: "كوش" });
  console.log(`Brand after:  ${brand.name}\n`);

  for (const product of PRODUCTS) {
    const before = await api<{ nameAr?: string }>(`/products/${product.id}`);
    console.log(`--- ${product.barcode} ---`);
    console.log(`  before: ${before.nameAr}`);

    const updated = await api<{ nameAr?: string }>(`/products/${product.id}`, "PATCH", product.copy);
    console.log(`  after:  ${updated.nameAr}\n`);
  }

  console.log(`✓ Updated brand + ${PRODUCTS.length} products.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
