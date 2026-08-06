/**
 * Seventeen Super Smooth Waterproof Lip Liner Pencil — full range (28 shades), ~1.14g.
 * Product barcode: 5201641725467 (30 Nude Peach) — user’s stock barcode.
 * Shade barcodes intentionally omitted.
 *
 * Includes all retailer shades (Muse Jo / Myoras / Epharmadora No28) + official EU chips.
 * Note: 5201641725382 is EYELINER 52 Plum — not this product.
 *
 * Usage: npx tsx scripts/add-seventeen-supersmooth-waterproof-lipliner-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_LINER = "54e393a9-90bf-41bb-beeb-c5364afce287";

const OFF = "https://seventeencosmetics.com/media/images/products/2026/04";
const BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";
const CDN = "https://cdn.shopify.com/s/files/1/0625/2537/4676/files";
const MUSE = "https://cdn.shopify.com/s/files/1/0718/3715/5633";

const PRODUCT = {
  barcode: "5201641725467",
  slug: "seventeen-super-smooth-waterproof-lip-liner-pencil",
  sku: "SVN-SSWL-725467",
  price: 9750,
  originalPrice: 11000,
  nameAr: "سفنتين - قلم شفاه Super Smooth Waterproof ناعم مقاوم للماء بفيتامين E وزيت الجوجوبا 1.14 غ",
  nameEn: "Seventeen Super Smooth Waterproof Lip Liner Pencil with Vitamin E & Jojoba Oil 1.14g",
  descriptionAr:
    "قلم شفاه Super Smooth Waterproof من سفنتين — ملمس كريمي فائق النعومة يحدّد الشفاه بدقة ويحمي أحمر الشفاه من التسيّب، بلون غني مقاوم للماء يدوم طوال اليوم. غني بفيتامين E وزيت الجوجوبا لترطيب ونعومة فورية تناسب الروتين اليومي في السوق العراقي.\n\n" +
    "• تطبيق ناعم وسلس بفضل التركيبة الغنية بفيتامين E وزيت الجوجوبا.\n" +
    "• نتيجة مكثّفة ثابتة ومقاومة للماء — بلا تلطيخ أو تسيّب حول الشفاه.\n" +
    "• يمكن تحديد المحيط أو ملء الشفاه بالكامل لمظهر أحمر شفاه أدوم.\n" +
    "• مضادات أكسدة طبيعية تساعد على حماية الشفاه من الخطوط الدقيقة.\n" +
    "• مختبر جلدياً — خالٍ من الغلوتين.\n" +
    "• 1.14 غ — 28 درجة من النود والخوخي والتوتي والأحمر والبرقوقي والموكا.\n\n" +
    "طريقة الاستخدام: ارسمي محيط الشفاه بالقلم، أو املئي الشفاه بالكامل لنتيجة أدوم وأكثر كثافة.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 01 Bare — نود بني دافئ عاري\n" +
    "• 02 Pink Tint — وردي خفيف ملوّن\n" +
    "• 03 Natural — طبيعي محمر\n" +
    "• 05 Peachy — خوخي دافئ\n" +
    "• 07 Light Cranberry — توت بري فاتح\n" +
    "• 08 Cranberry — توت بري كلاسيكي\n" +
    "• 09 Fuchsia — فوشيا جريء\n" +
    "• 10 Tomato — أحمر طماطم\n" +
    "• 12 Rosy Plum — برقوقي وردي\n" +
    "• 14 Pure Red — أحمر نقي\n" +
    "• 15 Blood Red — أحمر دموي عميق\n" +
    "• 20 Diva Plum — برقوقي ديفا غامق\n" +
    "• 26 Pure Orange — برتقالي مرجاني نقي\n" +
    "• 27 Red — أحمر ساطع\n" +
    "• 28 — وردي محمر ناعم (No.28)\n" +
    "• 29 Mocha — موكا بني وردي\n" +
    "• 30 Nude Peach — نود خوخي (درجة باركود المنتج)\n" +
    "• 31 Cool Pink — وردي بارد\n" +
    "• 32 Fashion Pink — وردي موضة جريء\n" +
    "• 33 Cool Grape — عنبي بارد\n" +
    "• 34 Modern Mauve — مووف عصري\n" +
    "• 35 Dark Signature — توقيع غامق\n" +
    "• 36 Super Nude — سوبر نود\n" +
    "• 37 Rose Gold — ذهبي وردي\n" +
    "• 38 Purity — نقاء بني وردي\n" +
    "• 39 Dark Plum — برقوقي غامق\n" +
    "• 40 Dark Red — أحمر غامق\n" +
    "• 41 Strawberry Daiquiri — فراولة دايكيري",
  descriptionEn:
    "Seventeen Super Smooth Waterproof Lip Liner — a creamy, ultra-smooth waterproof lip pencil that outlines lips precisely and locks lipstick in place. Enriched with Vitamin E and Jojoba Oil for effortless glide and comfort, with intense long-wear colour and natural antioxidants that help protect lips from fine lines.\n\n" +
    "• Smooth, easy application thanks to Vitamin E and Jojoba Oil.\n" +
    "• Intense, waterproof long-wear — resists smudging and feathering.\n" +
    "• Line the lip contour or fill the lips completely for even longer-lasting colour.\n" +
    "• Natural antioxidants help protect lips from fine lines.\n" +
    "• Dermatologically tested — gluten free.\n" +
    "• 1.14g — 28 shades from nudes and peach to cranberry, reds, plums and mocha.\n\n" +
    "How to use: Line your lips with the lip liner, or fill them in for an even longer-lasting result.\n\n" +
    "Available shades:\n" +
    "• 01 Bare — warm bare nude brown\n" +
    "• 02 Pink Tint — soft pink tint\n" +
    "• 03 Natural — natural rosy brown\n" +
    "• 05 Peachy — warm peachy nude\n" +
    "• 07 Light Cranberry — light cranberry\n" +
    "• 08 Cranberry — classic cranberry\n" +
    "• 09 Fuchsia — bold fuchsia\n" +
    "• 10 Tomato — tomato red\n" +
    "• 12 Rosy Plum — rosy plum\n" +
    "• 14 Pure Red — pure red\n" +
    "• 15 Blood Red — deep blood red\n" +
    "• 20 Diva Plum — deep diva plum\n" +
    "• 26 Pure Orange — pure coral orange\n" +
    "• 27 Red — vivid red\n" +
    "• 28 — soft rosy nude (No.28)\n" +
    "• 29 Mocha — mocha rosy brown\n" +
    "• 30 Nude Peach — nude peach (product barcode shade)\n" +
    "• 31 Cool Pink — cool pink\n" +
    "• 32 Fashion Pink — bold fashion pink\n" +
    "• 33 Cool Grape — cool grape\n" +
    "• 34 Modern Mauve — modern mauve\n" +
    "• 35 Dark Signature — dark signature\n" +
    "• 36 Super Nude — super nude\n" +
    "• 37 Rose Gold — rose gold\n" +
    "• 38 Purity — purity rosy brown\n" +
    "• 39 Dark Plum — dark plum\n" +
    "• 40 Dark Red — dark red\n" +
    "• 41 Strawberry Daiquiri — strawberry daiquiri",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/**
 * Full shade map:
 * - 01–15,27,29: official color-select hex + official pack photos where available
 * - 20,26,28,30–41: retailer names/images; hex sampled from pack barrel/tip
 */
const SHADES: ShadeInput[] = [
  { name: "01 Bare", colorHex: "#895142", imageUrl: `${OFF}/SMOOTH_LIP_LINER_PENCIL__01.jpg`, position: 0 },
  { name: "02 Pink Tint", colorHex: "#954A44", imageUrl: `${OFF}/SMOOTH_LIP_LINER_PENCIL__02.jpg`, position: 1 },
  { name: "03 Natural", colorHex: "#914138", imageUrl: `${OFF}/SMOOTH_LIP_LINER_PENCIL__03.jpg`, position: 2 },
  { name: "05 Peachy", colorHex: "#A64741", imageUrl: `${OFF}/SMOOTH_LIP_LINER_PENCIL__05.jpg`, position: 3 },
  { name: "07 Light Cranberry", colorHex: "#9A3D47", imageUrl: `${OFF}/SMOOTH_LIP_LINER_PENCIL__07.jpg`, position: 4 },
  { name: "08 Cranberry", colorHex: "#81343C", imageUrl: `${OFF}/SMOOTH_LIP_LINER_PENCIL__08.jpg`, position: 5 },
  { name: "09 Fuchsia", colorHex: "#B2214A", imageUrl: `${OFF}/SMOOTH_LIP_LINER_PENCIL__09.jpg`, position: 6 },
  { name: "10 Tomato", colorHex: "#A22B2D", imageUrl: `${OFF}/SMOOTH_LIP_LINER_PENCIL__10.jpg`, position: 7 },
  { name: "12 Rosy Plum", colorHex: "#952939", imageUrl: `${OFF}/SMOOTH_LIP_LINER_PENCIL__12.jpg`, position: 8 },
  { name: "14 Pure Red", colorHex: "#A4121F", imageUrl: `${OFF}/SMOOTH_LIP_LINER_PENCIL__14.jpg`, position: 9 },
  { name: "15 Blood Red", colorHex: "#831E2C", imageUrl: `${OFF}/SMOOTH_LIP_LINER_PENCIL__15.jpg`, position: 10 },
  {
    name: "20 Diva Plum",
    colorHex: "#522B59",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner20DivaPlum.png?v=1689583293`,
    position: 11,
  },
  {
    name: "26 Pure Orange",
    colorHex: "#E07060",
    imageUrl: `${MUSE}/products/seventeen-supersmooth-waterproof-lipliner-26-pure-orangecopy.png?v=1756027600`,
    position: 12,
  },
  { name: "27 Red", colorHex: "#D10101", imageUrl: `${OFF}/SMOOTH_LIP_LINER_PENCIL__27.jpg`, position: 13 },
  {
    name: "28",
    colorHex: "#D28D88",
    imageUrl: `${BROCARD}/5201641725443_1.jpg`,
    position: 14,
  },
  { name: "29 Mocha", colorHex: "#8B4543", imageUrl: `${OFF}/SMOOTH_LIP_LINER_PENCIL__29.jpg`, position: 15 },
  {
    name: "30 Nude Peach",
    colorHex: "#B76B69",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner30NudePeach.png?v=1689583293`,
    position: 16,
  },
  {
    name: "31 Cool Pink",
    colorHex: "#D68AA4",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner31CoolPink.png?v=1689583293`,
    position: 17,
  },
  {
    name: "32 Fashion Pink",
    colorHex: "#D64181",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner32FashionPink.png?v=1689583293`,
    position: 18,
  },
  {
    name: "33 Cool Grape",
    colorHex: "#945882",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner33CoolGrape.png?v=1689583293`,
    position: 19,
  },
  {
    name: "34 Modern Mauve",
    colorHex: "#6F4E74",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner34ModernMauve.png?v=1689583293`,
    position: 20,
  },
  {
    name: "35 Dark Signature",
    colorHex: "#592D38",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner35DarkSignature.png?v=1689583293`,
    position: 21,
  },
  {
    name: "36 Super Nude",
    colorHex: "#8A4E58",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner36SuperNude.png?v=1689583293`,
    position: 22,
  },
  {
    name: "37 Rose Gold",
    colorHex: "#DF8982",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner37RoseGold.png?v=1689583293`,
    position: 23,
  },
  {
    name: "38 Purity",
    colorHex: "#714045",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner38Purity.png?v=1689583293`,
    position: 24,
  },
  {
    name: "39 Dark Plum",
    colorHex: "#603441",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner39DarkPlum.png?v=1689583293`,
    position: 25,
  },
  {
    name: "40 Dark Red",
    colorHex: "#632A3A",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner40DarkRed.png?v=1689583293`,
    position: 26,
  },
  {
    name: "41 Strawberry Daiquiri",
    colorHex: "#9F5A79",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner41StrawberryDaiquiri.png?v=1689583293`,
    position: 27,
  },
];

const PRODUCT_IMAGES = [
  `${CDN}/Seventeen-Supersmoothwaterprooflipliner30NudePeach.png?v=1689583293`,
  `${BROCARD}/5201641725467_1.jpg`,
  `${CDN}/Seventeen-Supersmoothwaterprooflipliner20DivaPlum.png?v=1689583293`,
  `${BROCARD}/5201641725443_1.jpg`,
  `${CDN}/Seventeen-Supersmoothwaterprooflipliner39DarkPlum.png?v=1689583293`,
  `${OFF}/SMOOTH_LIP_LINER_PENCIL__01.jpg`,
  `${OFF}/SMOOTH_LIP_LINER_PENCIL__07.jpg`,
  `${CDN}/seventeen_super_smooth_lip_liner_pencil.png?v=1689583293`,
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
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
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
  console.log(`Shades: ${SHADES.length} (no shade barcodes)`);
  console.log(`Product barcode: ${PRODUCT.barcode} (30 Nude Peach)\n`);
  console.log("Note: 5201641725382 = Eyeliner 52 Plum (separate product) — skipped.\n");

  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();

  for (const barcode of [PRODUCT.barcode, "5201641689561"]) {
    const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
      `/products/barcode-check?barcode=${barcode}`,
    );
    if (check.exists && check.product?.id) {
      await api(`/products/${check.product.id}`, "DELETE");
      console.log(`Deleted existing barcode ${barcode}: ${check.product.nameAr ?? check.product.id}`);
    }
  }

  const existing = await api<{ data?: Array<{ id: string; slug?: string }> } | Array<{ id: string; slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT.slug)}&status=all&limit=5`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  for (const row of rows.filter((p) => p.slug === PRODUCT.slug)) {
    await api(`/products/${row.id}`, "DELETE");
    console.log(`Deleted orphan slug ${PRODUCT.slug}`);
  }

  console.log("\nUploading shade images...");
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
    await new Promise((r) => setTimeout(r, 200));
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
    await new Promise((r) => setTimeout(r, 150));
  }

  const imageIds = [...shades.map((s) => s.imageId), ...extraIds];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_LINER,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIP_LINER],
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
  console.log(`  Category: Makeup → Lips → Lip Liner`);
  console.log(`\n  User stock shades covered:`);
  console.log(`    5201641725467 → 30 Nude Peach (product barcode)`);
  console.log(`    5201641725443 → 28`);
  console.log(`    5201641697641 → 20 Diva Plum`);
  console.log(`    5201641742372 → 39 Dark Plum`);
  console.log(`    5201641725382 → Eyeliner 52 Plum (NOT lip liner — already separate product)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
