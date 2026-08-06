/**
 * Seventeen Twist Retractable Mechanical Eyeliner — 4 official shades, 0.28g.
 * Product barcode: 5201641702901 (07 Silver Grey).
 * Shade barcodes intentionally omitted.
 *
 * Sources:
 * - seventeencosmetics.com/en/catalogue/twist-retractable-mechanical-eyeliner_1556/
 *   (official name, benefits, 13 Steel Grey chip #82808C, pack photos 2024/09)
 * - Official CDN still hosts 02 / 03 / 07 / 13 pack + tip photos
 * - Depozitul / retailers: full 4-shade range + UPC map
 *   02 Black 5201641702857 | 03 Dark Brown 5201641702864
 *   07 Silver Grey 5201641702901 | 13 Steel Grey 5201641702963
 * - Hex: 13 from official color-select chip; 02/03/07 sampled from official tip/swatch (_4 / _3)
 * - Price: ~7.10€ → 9,000 IQD (aligned with Super Smooth eyeliner tier)
 *
 * Usage: npx tsx scripts/add-seventeen-twist-retractable-mechanical-eyeliner-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";

const OFF = "https://seventeencosmetics.com/media/images/products/2024/09";

const PRODUCT = {
  barcode: "5201641702901",
  slug: "seventeen-twist-retractable-mechanical-eyeliner-0-28g",
  sku: "SVN-TWIST-EL-702901",
  price: 9000,
  originalPrice: 10500,
  nameAr: "سفنتين - قلم عيون Twist Retractable Mechanical Eyeliner ميكانيكي مقاوم للماء 0.28 غ",
  nameEn: "Seventeen Twist Retractable Mechanical Eyeliner Waterproof with Smudger 0.28g",
  descriptionAr:
    "قلم عيون Twist Retractable Mechanical Eyeliner من سفنتين — قلم ميكانيكي مقاوم للماء بلون جريء يدوم طويلاً. تصميم مزدوج الطرف: طرف للتحديد الدقيق + مبراة مدمجة، وفي الجانب الآخر إسفنجة/ممحاة للدمج وصناعة لوك سموكي بسهولة، مع آلية تحمي السن عند عدم الاستخدام.\n\n" +
    "• لون قوي مقاوم للماء بثبات طويل طوال اليوم.\n" +
    "• تطبيق سلس ودقيق دون حاجة لمبراة خارجية.\n" +
    "• إسفنجة دمج مدمجة لمظهر سموكي متدرّج.\n" +
    "• غني بفيتامين C وفيتامين E للعناية بمنطقة العين الحساسة.\n" +
    "• مناسب لمرتدي العدسات اللاصقة — مختبر جلدياً وعينياً — خالٍ من الغلوتين.\n" +
    "• 0.28 غ — 4 درجات رسمية مصمّمة لتتناسب مع ألوان ظلال العيون.\n\n" +
    "طريقة الاستخدام: حدّدي خط الرموش أو الجفن الداخلي/الخارجي بالقلم، واستخدمي الإسفنجة المدمجة للدمج عند الرغبة بمظهر سموكي.\n\n" +
    "الدرجات المتوفرة (الأسماء الرسمية):\n" +
    "• 02 Black — أسود كلاسيكي قاتم\n" +
    "• 03 Dark Brown — بني غامق دافئ\n" +
    "• 07 Silver Grey — رمادي فضي (درجة هذا الباركود)\n" +
    "• 13 Steel Grey — رمادي فولاذي معدني",
  descriptionEn:
    "Seventeen Twist Retractable Mechanical Eyeliner — a waterproof mechanical eye pencil that delivers bold, long-wearing colour. Double-sided: a precise tip with built-in sharpener on one end, and a blending rubber/smudger on the other for soft or smokey looks. The retractable mechanism protects the tip when not in use.\n\n" +
    "• Waterproof, long-wearing bold colour.\n" +
    "• Smooth, precise application — no external sharpener needed.\n" +
    "• Built-in smudger for blended and smokey finishes.\n" +
    "• Enriched with Vitamins C & E to care for the delicate eye area.\n" +
    "• Suitable for contact lens wearers — dermatologically & ophthalmologically tested — gluten free.\n" +
    "• 0.28g — 4 official shades designed to match eyeshadow colours.\n\n" +
    "How to use: Line the lash line or waterline with the pencil tip. Use the built-in smudger to soften or create a smokey effect.\n\n" +
    "Available shades (official names):\n" +
    "• 02 Black\n" +
    "• 03 Dark Brown\n" +
    "• 07 Silver Grey (this barcode’s shade)\n" +
    "• 13 Steel Grey",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/**
 * Shade images: official 2024/09 pack shots (_1).
 * Hex: 13 from official color-select chip; 02/03/07 from official tip/swatch photography.
 */
const SHADES: ShadeInput[] = [
  {
    name: "02 Black",
    colorHex: "#272930",
    imageUrl: `${OFF}/seventeen_twist_eyeliner_02_1.jpg`,
    position: 0,
  },
  {
    name: "03 Dark Brown",
    colorHex: "#56403C",
    imageUrl: `${OFF}/seventeen_twist_eyeliner_03_1.jpg`,
    position: 1,
  },
  {
    name: "07 Silver Grey",
    colorHex: "#88888D",
    imageUrl: `${OFF}/seventeen_twist_eyeliner_07_1.jpg`,
    position: 2,
  },
  {
    name: "13 Steel Grey",
    colorHex: "#82808C",
    imageUrl: `${OFF}/seventeen_twist_eyeliner_13_1.jpg`,
    position: 3,
  },
];

const PRODUCT_IMAGES = [
  `${OFF}/seventeen_twist_eyeliner_07_1.jpg`,
  `${OFF}/seventeen_twist_eyeliner_07_2.jpg`,
  `${OFF}/seventeen_twist_eyeliner_07_3.jpg`,
  `${OFF}/seventeen_twist_eyeliner_07_4.jpg`,
  `${OFF}/seventeen_twist_eyeliner_02_1.jpg`,
  `${OFF}/seventeen_twist_eyeliner_03_1.jpg`,
  `${OFF}/seventeen_twist_eyeliner_13_1.jpg`,
  `${OFF}/seventeen_twist_eyeliner_13_4.jpg`,
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
  const KNOWN = "f133215c-8cb8-4686-9960-0ab79390a6bb";
  try {
    const b = await api<{ id: string }>(`/brands/${KNOWN}`);
    if (b?.id) {
      console.log(`Brand: Seventeen (${b.id}) [known]\n`);
      return b.id;
    }
  } catch {
    /* fall through */
  }
  const created = await api<{ id: string }>("/brands", "POST", { name: "Seventeen" });
  console.log(`Brand: Seventeen (${created.id}) [created]\n`);
  return created.id;
}

async function uploadImage(url: string, alt: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*", "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)" },
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 64) throw new Error("empty image");

    const contentType = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const blob = new Blob([buffer], { type: contentType });
    const form = new FormData();
    form.append("file", blob, `${alt.replace(/[^\w.-]+/g, "_")}.${ext}`);
    form.append("purpose", "PRODUCT");

    const uploadRes = await fetch(`${API_BASE}/media/upload`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: form,
    });
    const json = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      const msg =
        (json as { message?: string; error?: { message?: string } })?.error?.message ??
        (json as { message?: string })?.message ??
        uploadRes.statusText;
      throw new Error(msg);
    }
    const media = ((json as { data?: { id: string } }).data ?? json) as { id: string };
    if (!media?.id) throw new Error(`No media id for ${alt}`);
    return media.id;
  } catch (err) {
    if (attempt >= 3) throw err;
    await new Promise((r) => setTimeout(r, attempt * 800));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length} (no shade barcodes)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();

  const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
    `/products/barcode-check?barcode=${PRODUCT.barcode}`,
  );
  if (check.exists) {
    console.log(`skip ${PRODUCT.barcode} — exists | ${check.product?.nameAr ?? "?"}`);
    return;
  }

  const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT.slug)}&status=all&limit=5`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  if (rows.some((p) => p.slug === PRODUCT.slug)) {
    console.log(`skip — slug exists (${PRODUCT.slug})`);
    return;
  }

  console.log("Uploading shade images...");
  const shades = [];
  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
    });
    await new Promise((r) => setTimeout(r, 250));
  }
  shades.sort((a, b) => a.position - b.position);

  console.log("\nUploading gallery images...");
  const shadeIds = new Set(shades.map((s) => s.imageId));
  const extraIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    try {
      const id = await uploadImage(url, `gallery-${extraIds.length + 1}`);
      if (!shadeIds.has(id) && !extraIds.includes(id)) {
        extraIds.push(id);
        console.log(`  ✓ gallery extra ${extraIds.length}`);
      }
    } catch (e) {
      console.log(`  ⚠ gallery skip: ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const imageIds = [...shades.map((s) => s.imageId), ...extraIds];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    subcategoryIds: [EYES],
    tertiaryCategoryIds: [EYELINER],
    nameAr: PRODUCT.nameAr,
    nameEn: PRODUCT.nameEn,
    descriptionAr: PRODUCT.descriptionAr,
    descriptionEn: PRODUCT.descriptionEn,
    price: PRODUCT.price,
    originalPrice: PRODUCT.originalPrice,
    stock: 0,
    isActive: true,
    imageIds,
    shades,
  });

  const verify = await api<{
    shades?: Array<{ name: string; colorHex?: string; barcode?: string | null }>;
    images?: unknown[];
  }>(`/products/${created.id}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Gallery: ${verify.images?.length ?? imageIds.length}`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} | ${s.colorHex ?? "?"} | barcode: ${s.barcode ?? "none"}`);
  }
  console.log(`  Category: Makeup → Eyes → Eyeliner`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
