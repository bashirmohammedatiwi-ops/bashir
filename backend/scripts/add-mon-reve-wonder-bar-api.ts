/**
 * Mon Reve Wonder Bar — pH-Activated Color Revealing Multi-Use Stick 6g
 * 4 official shades with images + hex (NO shade barcodes).
 * Product barcode: 5201641031322 (shade 02 PINK)
 *
 * Sources:
 *   - monrevecosmetics.com/en/catalogue/wonder-bar_483/
 *   - Official shade pack + texture swatches (2024/05)
 * Hex sampled from official texture swatches (stick pigment).
 *
 * Usage: npx tsx scripts/add-mon-reve-wonder-bar-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";

const OFF = "https://monrevecosmetics.com/media/images/products/2024/05";

const PRODUCT = {
  barcode: "5201641031322",
  slug: "mon-reve-wonder-bar-ph-activated-color-revealing-stick-6g",
  sku: "MON-WB-031322",
  price: 7500,
  originalPrice: 8500,
  nameAr: "مون ريف - وندر بار Wonder Bar ستيك كاشف للون حسب الـ pH متعدد الاستخدام 6 غرام",
  nameEn: "Mon Reve Wonder Bar pH-Activated Color Revealing Multi-Use Stick 6g",
  descriptionAr:
    "وندر بار Wonder Bar من مون ريف — ستيك سحري متعدد الاستخدام يتفاعل مع درجة حموضة بشرتكِ (pH) ليظهر لوناً وردياً مخصصاً وفريداً لكل بشرة، بتركيبة زبدية غير دهنية غنية بزبدة الشيا وزيوت اللوز والمانجو والأفوكادو.\n\n" +
    "• لون وردي شخصي يتكيّف مع بشرتكِ — تورّد طبيعي لا يشبه أحداً.\n" +
    "• متعدد الاستخدام: خدود كمورد، شفاه كبلسم ملون، وحتى العيون لتعزيز خفيف طبيعي.\n" +
    "• قوام زبدي سهل الدمج وثبات طويل مع إمكانية بناء الكثافة.\n" +
    "• مناسب لجميع أنواع البشرة — خالٍ من العطر والسيليكون والغلوتين، فيغن، غير مجرّب على الحيوانات، مختبر جلدياً.\n" +
    "• 6 غرام — عملي للسفر والحقيبة.\n" +
    "• 4 درجات أساسية (لون الستيك قبل التفعيل) مصمّمة لتناسب مختلف ألوان البشرة.\n\n" +
    "طريقة الاستخدام: مرّري الستيك مباشرة على البشرة لتفعيل تغيّر اللون، ثم ادمِجي بأطراف الأصابع أو فرشاة أو إسفنجة. كرّري لزيادة الكثافة حسب الرغبة.\n\n" +
    "الدرجات المتوفرة (لون الستيك → يتحوّل لوردي شخصي على البشرة):\n" +
    "• 01 MILKY — حليبي فاتح للبشرة الفاتحة\n" +
    "• 02 PINK — وردي متوسط\n" +
    "• 03 GREEN — أخضر مكثّف\n" +
    "• 04 BLACK — أسود/فحمي للبشرة الأغمق",
  descriptionEn:
    "Mon Reve Wonder Bar — a multi-use pH-activated color revealing stick that reacts to your skin’s individual pH and transforms into a unique personalized pink flush. Oil-free buttery formula enriched with Shea butter, Almond, Mango and Avocado oils to keep skin hydrated and nourished.\n\n" +
    "• Personalized pink shade that adapts to every skin tone.\n" +
    "• Multi-use: cheeks as blush, lips as tinted balm, eyes for soft natural enhancement.\n" +
    "• Smooth, blendable, long-lasting and buildable color intensity.\n" +
    "• Ideal for all skin types — fragrance-free, silicone-free, gluten-free, vegan, cruelty-free, dermatologically tested.\n" +
    "• 6g — travel-friendly stick.\n" +
    "• 4 stick base shades designed to complement light to deep skin tones.\n\n" +
    "How to use: Apply directly onto skin to activate the color change. Dab and blend with fingertips, brush or sponge. Repeat to build intensity.\n\n" +
    "Available shades (stick color → activates to personalized pink on skin):\n" +
    "• 01 MILKY — milky light (for fair skin)\n" +
    "• 02 PINK — medium pink\n" +
    "• 03 GREEN — intense green base\n" +
    "• 04 BLACK — deep black/charcoal base",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Official shade codes from monrevecosmetics.com; hex from official texture swatches. */
const SHADES: ShadeInput[] = [
  {
    name: "01 MILKY",
    colorHex: "#E4E3E8",
    imageUrl: `${OFF}/wonder_bar_01_1.jpg`,
    position: 0,
  },
  {
    name: "02 PINK",
    colorHex: "#F0D7E7",
    imageUrl: `${OFF}/wonder_bar_02_1.jpg`,
    position: 1,
  },
  {
    name: "03 GREEN",
    colorHex: "#74B9A1",
    imageUrl: `${OFF}/wonder_bar_03_1.jpg`,
    position: 2,
  },
  {
    name: "04 BLACK",
    colorHex: "#38363C",
    imageUrl: `${OFF}/wonder_bar_04_1.jpg`,
    position: 3,
  },
];

const PRODUCT_IMAGES = [
  `${OFF}/wonder_bar.jpg`,
  `${OFF}/Wonder_Bar_Web_Product.jpg`,
  `${OFF}/wonder_bar_lTOjjkB.jpg`,
  `${OFF}/wonder_bar_FA1BQyC.jpg`,
  "https://monrevecosmetics.com/media/images/products/2025/02/wonder-bar-1200x1570-2.jpg",
  `${OFF}/wonder_bar_01_txtr.jpg`,
  `${OFF}/wonder_bar_02_txtr.jpg`,
  `${OFF}/wonder_bar_03_txtr.jpg`,
  `${OFF}/wonder_bar_04_txtr.jpg`,
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
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    subcategoryIds: [CHEEK],
    tertiaryCategoryIds: [BLUSH],
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
  console.log(`  Category: Makeup → Cheek → Blush`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
