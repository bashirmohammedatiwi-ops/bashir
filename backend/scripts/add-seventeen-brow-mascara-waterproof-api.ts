/**
 * Seventeen Brow Mascara Waterproof — 6 shades (01–06), 5ml.
 * Product barcode: 5201641753408 (shade 02 Ash Brown).
 * Shade barcodes intentionally omitted.
 *
 * Sources:
 * - seventeencosmetics.com/en/catalogue/browmascara_862/ (official hex chips, open pack photos, copy)
 * - Russian retailers SCENT / Odecharm (shade names: Almond, Ash Brown, Chestnut, Hazelnut, Brown, Dark Brown)
 * - Brocard pack shots per UPC
 *
 * Hex: official color-select__option__hex from product page.
 * Usage: npx tsx scripts/add-seventeen-brow-mascara-waterproof-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const EYEBROW_MASCARA = "3e4a3ad5-72fb-4a9b-878e-97cf31354b74";

const OFF = "https://seventeencosmetics.com/media/images/products/2020/03";
const BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

const PRODUCT = {
  barcode: "5201641753408",
  slug: "seventeen-brow-mascara-waterproof-5ml",
  sku: "SVN-BMWP-753408",
  price: 12500,
  originalPrice: 14000,
  nameAr: "سفنتين - ماسكارا حواجب Brow Mascara Waterproof مقاومة للماء للتشكيل والتلوين 5 مل",
  nameEn: "Seventeen Brow Mascara Waterproof — Shaping & Coloring Brow Mascara 5ml",
  descriptionAr:
    "ماسكارا حواجب Brow Mascara Waterproof من سفنتين — حليفتكِ لحواجب مرتّبة وملوّنة بدقة في كل مرة. تجف بسرعة، مقاومة للماء، وفرشاتها المتخصصة تملأ الفراغات وتثبّت الشكل واللون بمظهر طبيعي أنيق يناسب الجو العراقي والروتين اليومي.\n\n" +
    "• مقاومة للماء — ثبات طوال اليوم بدون تلطيخ مع العرق أو الرطوبة.\n" +
    "• تجف بسرعة وتثبّت الشعيرات مع الحفاظ على مرونتها ومظهرها الطبيعي.\n" +
    "• فرشاة دقيقة متخصصة لتمشيط وملء الحاجب بالشكل واللون المطلوبين.\n" +
    "• تملأ الفراغات وتغطي الشعيرات الباهتة أو البيضاء بلون متجانس.\n" +
    "• نباتية (Vegan) — مختبرة جلدياً وطبّياً للعيون.\n" +
    "• 5 مل — 6 درجات من اللوز الفاتح إلى البني الغامق.\n\n" +
    "طريقة الاستخدام: بفرشاة الماسكارا، مشّطي الحواجب باتجاه نموها الطبيعي مع ميل خفيف للأعلى.\n\n" +
    "الدرجات المتوفرة (أسماء معتمدة لدى تجار موثوقين + الشيب الرسمي):\n" +
    "• 01 Almond — لوز فاتح دافئ\n" +
    "• 02 Ash Brown — بني رمادي بارد\n" +
    "• 03 Chestnut — كستنائي دافئ\n" +
    "• 04 Hazelnut — بندقي/فندقي\n" +
    "• 05 Brown — بني كلاسيكي\n" +
    "• 06 Dark Brown — بني غامق",
  descriptionEn:
    "Seventeen Brow Mascara Waterproof — your ally for perfectly shaped, coloured brows every time. Fast-drying and waterproof, with a specialised brush that fills and sets brows in the desired shape and colour with natural precision — ideal for everyday wear.\n\n" +
    "• Waterproof polymer wear — stays put through humidity and long days without smudging.\n" +
    "• Fast-drying formula that sets brow hairs while keeping a soft, natural look.\n" +
    "• Specialised precision brush to comb, fill gaps and lock in shape and colour.\n" +
    "• Evens sparse areas and covers lighter or grey brow hairs.\n" +
    "• Vegan — dermatologically and ophthalmologically tested.\n" +
    "• 5ml — 6 shades from light almond to deep dark brown.\n\n" +
    "How to use: With the specialised brush, comb brows in their natural growth direction with a slight upward angle.\n\n" +
    "Available shades (trusted retailer names + official hex chips):\n" +
    "• 01 Almond — warm light almond\n" +
    "• 02 Ash Brown — cool ash brown\n" +
    "• 03 Chestnut — warm chestnut\n" +
    "• 04 Hazelnut — soft hazelnut brown\n" +
    "• 05 Brown — classic brown\n" +
    "• 06 Dark Brown — deep dark brown",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Official hex from color-select__option__hex; names from Russian/EU retail (миндаль, пепельно-коричневый, …). */
const SHADES: ShadeInput[] = [
  {
    name: "01 Almond",
    colorHex: "#C5A590",
    imageUrl: `${BROCARD}/5201641753392_1.jpg`,
    position: 0,
  },
  {
    name: "02 Ash Brown",
    colorHex: "#8C6858",
    imageUrl: `${BROCARD}/5201641753408_1.jpg`,
    position: 1,
  },
  {
    name: "03 Chestnut",
    colorHex: "#925F4C",
    imageUrl: `${BROCARD}/5201641753415_1.jpg`,
    position: 2,
  },
  {
    name: "04 Hazelnut",
    colorHex: "#8D594B",
    imageUrl: `${BROCARD}/5201641753422_1.jpg`,
    position: 3,
  },
  {
    name: "05 Brown",
    colorHex: "#745B54",
    imageUrl: `${BROCARD}/5201641753439_1.jpg`,
    position: 4,
  },
  {
    name: "06 Dark Brown",
    colorHex: "#8E7B75",
    imageUrl: `${BROCARD}/5201641753446_1.jpg`,
    position: 5,
  },
];

/** Gallery: official open wand photos (all 6 shades) + hero pack of barcode shade 02. */
const PRODUCT_IMAGES = [
  `${OFF}/Seventeen_brow_mascara_open_2.jpg`,
  `${BROCARD}/5201641753408_1.jpg`,
  `${OFF}/Seventeen_brow_mascara_open_1.jpg`,
  `${OFF}/Seventeen_brow_mascara_open_3.jpg`,
  `${OFF}/Seventeen_brow_mascara_open_4.jpg`,
  `${OFF}/Seventeen_brow_mascara_open_5.jpg`,
  `${OFF}/Seventeen_brow_mascara_open_6.jpg`,
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
    const b = await api<{ id: string; name?: string }>(`/brands/${KNOWN}`);
    if (b?.id) {
      console.log(`Brand: Seventeen (${b.id}) [known]\n`);
      return b.id;
    }
  } catch {
    /* fall through */
  }

  const search = await api<
    { data?: Array<{ id: string; name?: string; slug?: string }> } | Array<{ id: string; name?: string; slug?: string }>
  >(`/brands?search=${encodeURIComponent("Seventeen")}&limit=100`);
  const rows = Array.isArray(search) ? search : (search.data ?? []);
  const exact = rows.find((b) => {
    const name = (b.name ?? "").trim().toLowerCase();
    const slug = (b.slug ?? "").trim().toLowerCase();
    return name === "seventeen" || slug === "seventeen";
  });
  if (exact?.id) {
    console.log(`Brand: Seventeen (${exact.id}) [exact search]\n`);
    return exact.id;
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

  const check = await api<{ exists: boolean; product?: { id?: string; nameAr?: string } }>(
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
    await new Promise((r) => setTimeout(r, 300));
  }

  shades.sort((a, b) => a.position - b.position);

  console.log("\nUploading gallery images...");
  const imageIds: string[] = [];
  const shadeImageIds = new Set(shades.map((s) => s.imageId));
  for (const url of PRODUCT_IMAGES) {
    const id = await uploadImage(url, `gallery-${imageIds.length + 1}`);
    if (!shadeImageIds.has(id) && !imageIds.includes(id)) {
      imageIds.push(id);
      console.log(`  ✓ gallery ${imageIds.length}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  // Prefer shade images first in gallery order after hero opens, then extras
  const finalImages = [...shades.map((s) => s.imageId), ...imageIds.filter((id) => !shadeImageIds.has(id))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: EYEBROW,
    tertiaryCategoryId: EYEBROW_MASCARA,
    subcategoryIds: [EYEBROW],
    tertiaryCategoryIds: [EYEBROW_MASCARA],
    nameAr: PRODUCT.nameAr,
    nameEn: PRODUCT.nameEn,
    descriptionAr: PRODUCT.descriptionAr,
    descriptionEn: PRODUCT.descriptionEn,
    price: PRODUCT.price,
    originalPrice: PRODUCT.originalPrice,
    stock: 0,
    isActive: true,
    imageIds: finalImages,
    shades,
  });

  const verify = await api<{
    shades?: Array<{ name: string; colorHex?: string; barcode?: string; image?: { url?: string } }>;
    images?: Array<{ id?: string }>;
  }>(`/products/${created.id}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Gallery images: ${verify.images?.length ?? finalImages.length}`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} | ${s.colorHex ?? "?"} | barcode: ${s.barcode ?? "none"}`);
  }
  console.log(`  Category: Makeup → Eyebrow → Eyebrow Mascara`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
