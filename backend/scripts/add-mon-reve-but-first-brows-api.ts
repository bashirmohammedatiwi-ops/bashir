/**
 * Mon Reve But First, Brows! — Creamy eyebrow color & styling mascara 4ml
 * 5 shades with images + official hex (NO shade barcodes).
 * Product barcode: 5201641752555 (shade 04)
 *
 * Sources: monrevecosmetics.com (official names, hex chips, pack + texture photos)
 * Hex: official color-select__option__hex from product page.
 *
 * Usage: npx tsx scripts/add-mon-reve-but-first-brows-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const EYEBROW_MASCARA = "3e4a3ad5-72fb-4a9b-878e-97cf31354b74";

const IMG = "https://monrevecosmetics.com/media/images/products";
const P24 = "https://cdn.pharm24.gr/images/515x515-90";

const PRODUCT = {
  barcode: "5201641752555",
  slug: "mon-reve-but-first-brows-eyebrow-color-styling-mascara-4ml",
  sku: "MON-BFB-752555",
  price: 7500,
  originalPrice: 8500,
  nameAr: "مون ريف - ماسكارا حواجب But First, Brows! كريمية للتلوين والتشكيل 4 مل",
  nameEn: "Mon Reve But First, Brows! Creamy Eyebrow Color & Styling Mascara 4ml",
  descriptionAr:
    "ماسكارا حواجب But First, Brows! من مون ريف — تركيبة كريمية بحركة واحدة تمنحكِ حجماً وانضباطاً ولوناً طبيعياً لحواجب مرتّبة وممتلئة تدوم طويلاً.\n\n" +
    "• تملأ الفراغات وتكثّف شعيرات الحاجب وتثبّتها بمظهر طبيعي غير قاسٍ.\n" +
    "• مقاومة للماء، ثابتة طوال اليوم، ولا تنتقل على البشرة أو الملابس.\n" +
    "• فرشاة دقيقة تسهّل التمشيط من بداية الحاجب حتى طرفه.\n" +
    "• خالية من البارابين والغلوتين، غير مجرّبة على الحيوانات، مختبرة جلدياً وطبّياً للعيون.\n" +
    "• 4 مل — 5 درجات من الأسود الناعم إلى البني الفاتح تناسب معظم ألوان الحواجب.\n\n" +
    "طريقة الاستخدام: ضعيها مباشرة على الحواجب بتمشيط قصير وسريع باتجاه نمو الشعيرات، من الجذر نحو الطرف.\n\n" +
    "الدرجات المتوفرة (الأسماء الرسمية أرقام فقط):\n" +
    "• 01 — أسود ناعم دافئ\n" +
    "• 02 — بني غامق كلاسيكي\n" +
    "• 03 — بني متوسط ترابي\n" +
    "• 04 — بني محمر عميق\n" +
    "• 05 — بني فاتح دافئ",
  descriptionEn:
    "Mon Reve But First, Brows! — creamy eyebrow color & styling mascara for full, groomed brows. In one swipe it volumizes, tames and tints brows for a natural, long-wearing finish.\n\n" +
    "• Fills sparse areas, defines brow hairs and sets them in place without a harsh look.\n" +
    "• Water-resistant, long-wearing and non-transfer.\n" +
    "• Precision brush for short, ascending strokes from brow head to tail.\n" +
    "• Paraben-free, gluten-free, cruelty-free; dermatologically and ophthalmologically tested.\n" +
    "• 4ml — 5 shades from soft black to light brown for everyday brows.\n\n" +
    "How to use: Apply directly onto brows with short, quick ascending strokes in the direction of hair growth, from the head toward the tail.\n\n" +
    "Available shades (official codes are numbers only):\n" +
    "• 01 — soft warm black\n" +
    "• 02 — classic dark brown\n" +
    "• 03 — medium earthy brown\n" +
    "• 04 — deep reddish brown\n" +
    "• 05 — light warm brown",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Official shade codes + hex from monrevecosmetics.com color chips. Images: official pack + swatch. */
const SHADES: ShadeInput[] = [
  {
    name: "01",
    colorHex: "#170900",
    imageUrl: `${IMG}/2019/11/mon-reve-but-first-brows-01.jpg`,
    position: 0,
  },
  {
    name: "02",
    colorHex: "#463018",
    imageUrl: `${IMG}/2019/11/mon-reve-but-first-brows-02.jpg`,
    position: 1,
  },
  {
    name: "03",
    colorHex: "#6A5540",
    imageUrl: `${IMG}/2019/11/mon-reve-but-first-brows-03.jpg`,
    position: 2,
  },
  {
    name: "04",
    colorHex: "#411315",
    imageUrl: `${IMG}/2019/11/mon-reve-but-first-brows-04.jpg`,
    position: 3,
  },
  {
    name: "05",
    colorHex: "#886551",
    imageUrl: `${IMG}/2019/11/mon-reve-but-first-brows-05.jpg`,
    position: 4,
  },
];

const PRODUCT_IMAGES = [
  `${IMG}/2019/11/mon-reve-but-first-brows-default_aLFDliU.jpg`,
  `${IMG}/2019/11/mon-reve-but-first-brows-04.jpg`,
  `${IMG}/2019/11/Mon_Reve_but-first-browns_4ml_04_a_txtr.jpg`,
  `${IMG}/2019/11/mon-reve-but-first-brows-default.jpg`,
  `${IMG}/2019/11/mon-reve-but-first-brows-default_YsViwGw.jpg`,
  `${IMG}/2019/11/mon-reve-but-first-brows-default_TObjT0Z.jpg`,
  `${IMG}/2019/11/mon-reve-but-first-brows-default_uXeHpPe.jpg`,
  `${IMG}/2023/08/but_first_brows_post.jpg`,
  `${P24}/5201641752555.jpg`,
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
  const search = await api<
    { data?: Array<{ id: string; name?: string; nameEn?: string }> } | Array<{ id: string; name?: string; nameEn?: string }>
  >(`/brands?search=${encodeURIComponent("Mon Reve")}&limit=20`);
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

  if (await deleteByBarcode(PRODUCT.barcode)) console.log("");
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
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    try {
      const id = await uploadImage(url, "product-gallery");
      galleryIds.push(id);
      console.log(`  ✓ gallery`);
    } catch (e) {
      console.log(`  ✗ gallery skip: ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 350));
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
    imageIds,
    shades,
  });

  const verify = await api<{
    shades?: Array<{ name: string; colorHex?: string; barcode?: string; imageId?: string }>;
  }>(`/products/${created.id}`);

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
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Eyebrow → Eyebrow Mascara`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
