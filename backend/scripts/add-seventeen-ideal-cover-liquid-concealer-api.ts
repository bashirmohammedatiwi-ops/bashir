/**
 * Seventeen Ideal Cover Liquid Concealer — 8 official shades, 3ml.
 * Product barcode: 5201641704646 (05 Beige).
 * Shade barcodes intentionally omitted.
 *
 * Sources:
 * - seventeencosmetics.com/en/catalogue/ideal-cover-concealer_41/
 *   (official tips/names, color-select__option__hex chips, benefits)
 * - Epharmadora UPC↔shade map (No1–No8)
 * - Brocard pack shots per UPC (01–07); Epharmadora pack shot for 08
 * - Price tier: aligned with Matt Concealer Extra Coverage (~14€ / 3ml) → 15,000 IQD
 *
 * Usage: npx tsx scripts/add-seventeen-ideal-cover-liquid-concealer-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";

const BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";
const OFF = "https://seventeencosmetics.com/media/images/products/2022/06";
const CACHE = "https://seventeencosmetics.com/media/cache";
const EPH = "https://epharmadora.com/mediastream/w640/files/products";

const PRODUCT = {
  barcode: "5201641704646",
  slug: "seventeen-ideal-cover-liquid-concealer-3ml",
  sku: "SVN-ICLC-704646",
  price: 15000,
  originalPrice: 17000,
  nameAr: "سفنتين - كونسيلر Ideal Cover Liquid Concealer تغطية مثالية مشرقة 3 مل",
  nameEn: "Seventeen Ideal Cover Liquid Concealer Medium Coverage Radiant Finish 3ml",
  descriptionAr:
    "كونسيلر Ideal Cover Liquid Concealer من سفنتين — كونسيلر سائل مرطّب بتغطية متوسطة قابلة للبناء ولمسة مشرقة طبيعية يدوم طويلاً. يخفي علامات التعب والهالات والعيوب دون إبراز خطوط التعبير، ويمنحك إشراقاً تحت العينين طوال اليوم.\n\n" +
    "• تغطية مثالية متوسطة قابلة للبناء للهالات والشوائب وعدم توحيد اللون.\n" +
    "• لمسة مشرقة طبيعية (radiant) تضيء منطقة تحت العين.\n" +
    "• ثبات طويل دون إظهار خطوط التعبير.\n" +
    "• فرشاة تطبيق متخصصة لتوزيع دقيق وسهل حسب الحاجة.\n" +
    "• مختبر جلدياً وعينياً — نباتي — خالٍ من الغلوتين.\n" +
    "• 3 مل — 8 درجات رسمية: درجتان مصحّحتان + 6 درجات تناسب أغلب ألوان البشرة.\n\n" +
    "طريقة الاستخدام: ضعيه تحت العينين أو على أي منطقة تحتاج تغطية إضافية بفرشاة التطبيق، ثم ادمِجي برفق.\n" +
    "نصيحة احترافية: استخدمي الدرجة الصفراء 02 Light Ochre لمعادلة الهالات الزرقاء/البنفسجية قبل درجتك المعتادة.\n\n" +
    "الدرجات المتوفرة (الأسماء الرسمية):\n" +
    "• 01 Highlight — هايلايت فاتح مضيء / مصحّح\n" +
    "• 02 Light Ochre — أصفر فاتح مصحّح للهالات الزرقاء والبنفسجية\n" +
    "• 03 Ivory — عاجي فاتح\n" +
    "• 04 Nude — نود طبيعي\n" +
    "• 05 Beige — بيج (درجة هذا الباركود)\n" +
    "• 06 Caramel — كراميل دافئ\n" +
    "• 07 Medium Beige — بيج متوسط\n" +
    "• 08 Beige Orange — بيج برتقالي دافئ",
  descriptionEn:
    "Seventeen Ideal Cover Liquid Concealer — a hydrating liquid concealer with buildable medium coverage and a radiant finish that lasts. It erases signs of fatigue, covers dark circles and imperfections, and illuminates the under-eye area all day without settling into fine lines.\n\n" +
    "• Buildable medium coverage for under-eyes, spots and uneven tone.\n" +
    "• Radiant finish that brightens the eye area.\n" +
    "• Long-lasting wear that doesn’t show expression lines.\n" +
    "• Specialized application brush for precise, adjustable coverage.\n" +
    "• Dermatologically & ophthalmologically tested — vegan — gluten free.\n" +
    "• 3ml — 8 official shades: 2 intensely corrective + 6 to suit most skin tones.\n\n" +
    "How to use: Apply under the eyes or on any area needing extra coverage with the brush, then blend gently.\n" +
    "Pro tip: Use yellow shade 02 Light Ochre to colour-correct blue/purple under-eye tones before your matching shade.\n\n" +
    "Available shades (official names):\n" +
    "• 01 Highlight — brightening/corrective fair\n" +
    "• 02 Light Ochre — yellow corrector for blue/purple dark circles\n" +
    "• 03 Ivory\n" +
    "• 04 Nude\n" +
    "• 05 Beige (this barcode’s shade)\n" +
    "• 06 Caramel\n" +
    "• 07 Medium Beige\n" +
    "• 08 Beige Orange",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Official tips + hex from color-select__option__hex; pack shots: Brocard (01–07) + Epharmadora (08). */
const SHADES: ShadeInput[] = [
  {
    name: "01 Highlight",
    colorHex: "#F8E5E1",
    imageUrl: `${BROCARD}/5201641704608_1.jpg`,
    position: 0,
  },
  {
    name: "02 Light Ochre",
    colorHex: "#F1DAA8",
    imageUrl: `${BROCARD}/5201641704615_1.jpg`,
    position: 1,
  },
  {
    name: "03 Ivory",
    colorHex: "#FADBBC",
    imageUrl: `${BROCARD}/5201641704622_1.jpg`,
    position: 2,
  },
  {
    name: "04 Nude",
    colorHex: "#EFC7A4",
    imageUrl: `${BROCARD}/5201641704639_1.jpg`,
    position: 3,
  },
  {
    name: "05 Beige",
    colorHex: "#DBB497",
    imageUrl: `${BROCARD}/5201641704646_1.jpg`,
    position: 4,
  },
  {
    name: "06 Caramel",
    colorHex: "#D0AC8C",
    imageUrl: `${BROCARD}/5201641704653_1.jpg`,
    position: 5,
  },
  {
    name: "07 Medium Beige",
    colorHex: "#C68C67",
    imageUrl: `${BROCARD}/5201641704660_1.jpg`,
    position: 6,
  },
  {
    name: "08 Beige Orange",
    colorHex: "#BE8769",
    imageUrl: `${EPH}/8f3ad8992c4e9641dd84b57fa6a7c0c7.jpg.jpg`,
    position: 7,
  },
];

const PRODUCT_IMAGES = [
  `${BROCARD}/5201641704646_1.jpg`,
  `${OFF}/seventeen_ideal_concealer_06.jpg`,
  `${OFF}/seventeen_ideal_concealer_06_1.jpg`,
  `${CACHE}/09/c5/09c5a391256fded9a6de6e518402eced.jpg`,
  `${CACHE}/ec/d8/ecd8a1dc0744e9ac47a2ce32222480b8.jpg`,
  `${CACHE}/10/47/10474f1adab13859d860b36490f5a3dc.jpg`,
  `${BROCARD}/5201641704608_1.jpg`,
  `${BROCARD}/5201641704660_1.jpg`,
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
    subcategoryId: FACE,
    tertiaryCategoryId: CONCEALER,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [CONCEALER],
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
  console.log(`  Category: Makeup → Face → Concealer`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
