/**
 * Retry Enchanteur barcodes — add confirmed Gorgeous/Charming/Alluring 200ml.
 * Usage: npx tsx scripts/add-enchanteur-retry6-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const BODY = "23aaaa07-91ee-4937-847e-d7866a9e937a";
const DEODORANT = "9464c921-9650-421f-8e2b-6a172f7524c5";

const PRODUCTS = [
  {
    barcode: "8888202061584",
    price: 9000,
    nameAr: "إنشانتر Gorgeous – بخاخ مزيل عرق معطر برائحة زهرية فاكهية أنثوية 200 مل",
    nameEn: "Enchanteur Gorgeous Perfumed Deodorant Spray – 200 ml",
    descriptionAr:
      "بخاخ إنشانتر جورجس المعطّر — حماية من الرائحة مع عطر زهري فاكهي أنثوي يدوم طوال اليوم، يجف بسرعة ولطيف على البشرة.\n\n• مزيل عرق معطر بلمسة عطر يومي.\n• مناسب لمحبات الروائح الفرنسية الزهرية.\n• الحجم: 200 مل.",
    descriptionEn:
      "Enchanteur Gorgeous perfumed deodorant spray — odor protection wrapped in a feminine floral-fruity fragrance that lasts through the day; quick-drying and gentle on skin.\n\n• Perfumed deodorant for everyday confidence.\n• French-inspired floral scent profile.\n• Size: 200 ml.",
  },
  {
    barcode: "8888202061690",
    price: 9000,
    nameAr: "إنشانتر Charming – بخاخ مزيل عرق معطر برائحة الورد والياسمين والحمضيات 200 مل",
    nameEn: "Enchanteur Charming Perfumed Deodorant Spray – 200 ml",
    descriptionAr:
      "بخاخ إنشانتر تشارمنغ المعطّر — حماية من الرائحة مع مزيج أنيق من الورد والياسمين ولمسات حمضية منعشة تدوم طوال اليوم.\n\n• عطر ساحر خفيف للانتعاش اليومي.\n• يجف بسرعة دون لزوجة.\n• الحجم: 200 مل.",
    descriptionEn:
      "Enchanteur Charming perfumed deodorant spray — odor protection with an elegant blend of rose, jasmine and fresh citrus notes that linger through the day.\n\n• Soft charming everyday fragrance.\n• Quick-drying, non-sticky feel.\n• Size: 200 ml.",
  },
  {
    barcode: "8888202061706",
    price: 9000,
    nameAr: "إنشانتر Alluring – بخاخ مزيل عرق معطر برائحة البرغموت والباشن فروت والورد 200 مل",
    nameEn: "Enchanteur Alluring Perfumed Deodorant Spray – 200 ml",
    descriptionAr:
      "بخاخ إنشانتر ألورينغ المعطّر — حماية من الرائحة مع عطر جذّاب من البرغموت والباشن فروت والورد والآيريس والفانيلا.\n\n• رائحة زهرية فاكهية جذابة.\n• انتعاش معطر يدوم.\n• الحجم: 200 مل.",
    descriptionEn:
      "Enchanteur Alluring perfumed deodorant spray — odor protection with a seductive blend of bergamot, passion fruit, rose, iris and rich vanilla.\n\n• Alluring floral-fruity scent for everyday wear.\n• Long-lasting freshness.\n• Size: 200 ml.",
  },
] as const;

export const STILL_UNRESOLVED = ["8888202061560", "8888202061683", "8888202061713"] as const;

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

async function deleteByBarcode(barcode: string) {
  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${barcode}`,
  );
  if (!check.exists || !check.product?.id) return;
  await api(`/products/${check.product.id}`, "DELETE");
  console.log(`  deleted: ${check.product.nameAr ?? check.product.id}`);
}

function slugify(nameEn: string, barcode: string) {
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
  await login();
  console.log("Logged in.\n");

  const resolved = await api<{ brand?: { id: string } }>("/brands/resolve", "POST", {
    brandAr: "إنشانتر",
    brandEn: "Enchanteur",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Brand resolve failed");
  console.log(`Brand Enchanteur: ${brandId}\n`);

  for (const p of PRODUCTS) {
    console.log(`--- ${p.barcode} ---`);
    await deleteByBarcode(p.barcode);
    const created = await api<{ id: string }>("/products", "POST", {
      sku: `ENC-${p.barcode.slice(-6)}`,
      barcode: p.barcode,
      slug: slugify(p.nameEn, p.barcode),
      brandId,
      categoryId: CARE,
      subcategoryId: BODY,
      subcategoryIds: [BODY],
      tertiaryCategoryId: DEODORANT,
      tertiaryCategoryIds: [DEODORANT],
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
    console.log(`  ✓ ${p.nameAr}`);
    console.log(`    EN: ${p.nameEn}`);
    console.log(`    ID: ${created.id} | ${p.price} IQD\n`);
  }

  console.log(`Done — added ${PRODUCTS.length}`);
  console.log("\nStill unresolved:");
  for (const b of STILL_UNRESOLVED) console.log(`  - ${b}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
