/**
 * Mon Reve Brow Sketcher — Long-wear eyebrow color gel 1.6g
 * 5 official shades with images + hex (NO shade barcodes).
 * Product barcode: 5201641005422 (shade 01 Light Blond)
 *
 * Sources:
 *   - monrevecosmetics.com/en/catalogue/brow-sketcher_230/ (names, copy, gallery)
 *   - pharm24.gr (per-shade pack+swatch images)
 * Hex sampled from vertical swatch regions on Pharm24 shade shots.
 *
 * Usage: npx tsx scripts/add-mon-reve-brow-sketcher-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const EYEBROW_GEL = "a6620b04-09ee-427c-a195-5b0626276fc9";

const OFF = "https://monrevecosmetics.com/media/images/products";
const P24 = "https://cdn.pharm24.gr/images/AUTOxAUTO-90";

const PRODUCT = {
  barcode: "5201641005422",
  slug: "mon-reve-brow-sketcher-long-wear-eyebrow-color-gel-1-6g",
  sku: "MON-BS-005422",
  price: 7500,
  originalPrice: 8500,
  nameAr: "مون ريف - جل حواجب Brow Sketcher كريمي ثابت مع فرشاة مائلة دقيقة 1.6 غرام",
  nameEn: "Mon Reve Brow Sketcher Long-Wear Eyebrow Color Gel 1.6g",
  descriptionAr:
    "جل حواجب Brow Sketcher من مون ريف — جل لون كريمي طويل الثبات يرسم ويملأ ويحدّد الحواجب بمظهر طبيعي يدوم طوال اليوم، مع فرشاة مائلة دقيقة مدمجة لضربات تشبه الشعرات.\n\n" +
    "• لون غني وسهل الملء دون مجهود — نتيجة طبيعية أو أوضح حسب الكمية.\n" +
    "• لا يتلطّخ ولا ينتقل؛ لمسة نهائية مات مخملية أنيقة.\n" +
    "• تركيبة جل تنساب بسهولة على الشعرات والجلد وتُدمَج بسلاسة.\n" +
    "• مقاوم للماء — مناسب لحرّ العراق والتعرّق اليومي.\n" +
    "• خالٍ من البارابين والغلوتين، غير مجرّب على الحيوانات، مختبر جلدياً.\n" +
    "• 1.6 غرام — 5 درجات رسمية تناسب ألوان الشعر من الأشقر إلى البني المحمر.\n\n" +
    "طريقة الاستخدام: اغرفي كمية قليلة بالفرشاة المائلة، وارفعي الشعرات بضربات قصيرة من بداية الحاجب نحو الذيل، ثم املئي الفراغات باتجاه نمو الشعرة وادمِجي جيداً. امسحي الزيادة على حافة العبوة للتحكّم بالكثافة.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 01 Light Blond — أشقر فاتح دافئ طبيعي\n" +
    "• 02 Dark Blond — أشقر غامق رمادي ترابي\n" +
    "• 03 Light Brown — بني فاتح دافئ\n" +
    "• 04 Dark Brown — بني غامق عميق\n" +
    "• 05 Red Brown — بني محمر دافئ",
  descriptionEn:
    "Mon Reve Brow Sketcher — a long-wear eyebrow color gel that defines, fills and shapes brows with a natural-looking finish that lasts all day. Rich colour payoff with an angled precision brush for hair-like strokes and a velvety-matte effect.\n\n" +
    "• Effortless fill and definition — build from soft everyday brows to a bolder look.\n" +
    "• Does not smudge or budge; velvety-matte, non-transfer finish.\n" +
    "• Gel formula glides and blends easily on brows and skin.\n" +
    "• Water resistant — stays true through heat and humidity.\n" +
    "• Paraben-free, gluten-free, not tested on animals, dermatologically tested.\n" +
    "• 1.6g — 5 official shades from light blond to red brown.\n\n" +
    "How to use: Dip the angled brush lightly into the gel and apply in short, upward, hair-like strokes from the head of the brow toward the tail. Fill gaps in the direction of hair growth and blend thoroughly. Wipe excess on the jar rim to control intensity.\n\n" +
    "Available shades:\n" +
    "• 01 Light Blond — soft warm light blond\n" +
    "• 02 Dark Blond — cool dusty dark blond\n" +
    "• 03 Light Brown — warm light brown\n" +
    "• 04 Dark Brown — deep dark brown\n" +
    "• 05 Red Brown — warm red-brown",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Official shade names from monrevecosmetics.com; hex from Pharm24 swatch sampling. */
const SHADES: ShadeInput[] = [
  {
    name: "01 Light Blond",
    colorHex: "#916D5A",
    imageUrl: `${P24}/5201641005422_3aa.jpg`,
    position: 0,
  },
  {
    name: "02 Dark Blond",
    colorHex: "#6E5953",
    imageUrl: `${P24}/5201641005439.jpg`,
    position: 1,
  },
  {
    name: "03 Light Brown",
    colorHex: "#846351",
    imageUrl: `${P24}/5201641005446.jpg`,
    position: 2,
  },
  {
    name: "04 Dark Brown",
    colorHex: "#513935",
    imageUrl: `${P24}/5201641005453.jpg`,
    position: 3,
  },
  {
    name: "05 Red Brown",
    colorHex: "#54383A",
    imageUrl: `${P24}/5201641005460.jpg`,
    position: 4,
  },
];

const PRODUCT_IMAGES = [
  `${OFF}/2023/08/mon_reve_brow_sketcher.jpg`,
  `${OFF}/2021/01/mon_reve_sketchers_1.jpg`,
  `${OFF}/2021/01/mon_reve_sketchers_2.jpg`,
  `${OFF}/2021/01/mon_reve_sketchers_3.jpg`,
  `${OFF}/2021/01/mon_reve_sketchers_group_txtr_01.jpg`,
  `${OFF}/2023/12/mon_reve_sketchers_txtr_01.jpg`,
  `${OFF}/2023/12/mon_reve_sketchers_txtr_02.jpg`,
  `${P24}/5201641005422α123.jpg`,
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
  const search = await api<{ data?: Array<{ id: string; name?: string; nameEn?: string }> } | Array<{ id: string; name?: string; nameEn?: string }>>(
    `/brands?search=${encodeURIComponent("Mon Reve")}&limit=20`,
  );
  const rows = Array.isArray(search) ? search : (search.data ?? []);
  const exact = rows.find((b) => {
    const n = `${b.name ?? ""} ${b.nameEn ?? ""}`.toLowerCase();
    return n.includes("mon reve") || n.includes("mon rêve") || n.includes("مون ريف");
  });
  if (exact?.id) {
    console.log(`Brand: Mon Reve (${exact.id}) [exact search]\n`);
    return exact.id;
  }

  const created = await api<{ id: string }>("/brands", "POST", {
    name: "Mon Reve",
    nameAr: "مون ريف",
    nameEn: "Mon Reve",
  });
  console.log(`Brand: Mon Reve (${created.id}) [created]\n`);
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

async function deleteByBarcode(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${barcode}`,
  );
  if (!check.exists || !check.product?.id) return false;
  await api(`/products/${check.product.id}`, "DELETE");
  console.log(`  deleted existing: ${check.product.nameAr ?? check.product.id}`);
  return true;
}

async function deleteOrphanSlug(slug: string) {
  const existing = await api<{ data?: Array<{ id: string; slug?: string }> } | Array<{ id: string; slug?: string }>>(
    `/products?search=${encodeURIComponent(slug)}&status=all&limit=10`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  for (const row of rows.filter((p) => p.slug === slug)) {
    await api(`/products/${row.id}`, "DELETE");
    console.log(`  deleted orphan slug: ${slug}`);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length} (no shade barcodes)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();

  if (await deleteByBarcode(PRODUCT.barcode)) {
    console.log("");
  }
  await deleteOrphanSlug(PRODUCT.slug);

  console.log("Uploading shade images...");
  const shades: Array<{
    name: string;
    colorHex: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    try {
      const id = await uploadImage(url, "product-gallery");
      galleryIds.push(id);
      console.log(`  ✓ gallery`);
    } catch (err) {
      console.log(`  ✗ gallery skip: ${(err as Error).message} (${url.split("/").pop()})`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  shades.sort((a, b) => a.position - b.position);
  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: EYEBROW,
    tertiaryCategoryId: EYEBROW_GEL,
    subcategoryIds: [EYEBROW],
    tertiaryCategoryIds: [EYEBROW_GEL],
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
    nameAr?: string;
    nameEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    shades?: Array<{ name: string; colorHex?: string; barcode?: string; imageId?: string }>;
  }>(`/products/${created.id}`);

  if (!verify.nameAr || !verify.nameEn || !verify.descriptionAr || !verify.descriptionEn) {
    throw new Error("Missing bilingual name/description after create");
  }

  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

  const noImg = (verify.shades ?? []).filter((s) => !s.imageId);
  if (noImg.length) throw new Error(`Shades missing images: ${noImg.map((s) => s.name).join(", ")}`);

  const noHex = (verify.shades ?? []).filter((s) => !s.colorHex);
  if (noHex.length) throw new Error(`Shades missing hex: ${noHex.map((s) => s.name).join(", ")}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}${s.barcode ? ` [barcode: ${s.barcode}]` : ""}`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Eyebrow → Eyebrow Gel`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
