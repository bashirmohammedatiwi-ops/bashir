/**
 * Mon Reve Nude Skin — Tinted Cream SPF20 Satin Finish 30ml (Normal to Dry Skin)
 * 3 official shades with images + hex (NO shade barcodes).
 * Product barcode: 5201641751183 (shade 101 Light)
 *
 * Sources:
 *   - monrevecosmetics.com/en/catalogue/nude-skin-normal-to-dry-skin_31/
 *   - pharm24.gr (pack+swatch per shade)
 * Hex sampled from official Mon Reve shade swatch photos.
 *
 * Usage: npx tsx scripts/add-mon-reve-nude-skin-normal-dry-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";

const OFF = "https://monrevecosmetics.com/media/images/products";
const P24 = "https://cdn.pharm24.gr/images/AUTOxAUTO-90";

const PRODUCT = {
  barcode: "5201641751183",
  slug: "mon-reve-nude-skin-tinted-cream-spf20-normal-dry-30ml",
  sku: "MON-NS-ND-751183",
  price: 8500,
  originalPrice: 9500,
  nameAr: "مون ريف - كريم ملون Nude Skin للبشرة العادية والجافة SPF20 لمسة ساتان 30 مل",
  nameEn: "Mon Reve Nude Skin Tinted Cream SPF20 Normal to Dry Skin Satin Finish 30ml",
  descriptionAr:
    "كريم ملون Nude Skin من مون ريف — كريم يومي خفيف بتغطية شفافة طبيعية يوحّد لون البشرة ويخفي العيوب البسيطة مع ترطيب وحماية من الشمس SPF20، بلمسة ساتان ناعمة لمظهر بشرة عارية مثالية.\n\n" +
    "• تغطية خفيفة شفافة — إطلالة nude طبيعية دون مظهر مكياج ثقيل.\n" +
    "• يرطّب ويغذي البشرة ويحمي من أشعة الشمس بمعامل SPF20.\n" +
    "• بديل نباتي لحمض الهيالورونيك ومكوّنات نشطة وماء إكليل الجبل لمرونة وترطيب يدوم.\n" +
    "• مثالي للبشرة العادية إلى الجافة — لمسة ساتان غير دهنية.\n" +
    "• خالٍ من البارابين والغلوتين، غير مجرّب على الحيوانات، مختبر جلدياً.\n" +
    "• 30 مل — 3 درجات: فاتح، متوسط، غامق.\n\n" +
    "متى تستخدمينه: يومياً عندما تريدين بشرة مرتّبة ومشرقّة دون فاونديشن ثقيل — للرياضة، المشاوير، أو المكياج الخفيف.\n\n" +
    "طريقة الاستخدام: ضعيه على بشرة نظيفة ومرطّبة بأطراف الأصابع أو فرشاة أو إسفنجة كريم أساس. يُستخدم وحده أو كقاعدة خفيفة تحت المكياج.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 101 Light — فاتح طبيعي دافئ للبشرة الفاتحة\n" +
    "• 102 Medium — متوسط حنطي بيج دافئ\n" +
    "• 103 Dark — غامق دافئ للبشرة الحنطية إلى السمراء",
  descriptionEn:
    "Mon Reve Nude Skin Tinted Cream SPF20 — a sheer-light daily tinted cream that evens skin tone, softens slight imperfections and redness, and nurtures skin with a natural satin nude-skin finish. Moisturizes and protects with SPF20.\n\n" +
    "• Very natural, sheer-light coverage for a perfect nude-skin look.\n" +
    "• Evens tone, covers light imperfections, nourishes and protects from UV rays (SPF20).\n" +
    "• Botanical alternative to hyaluronic acid, biological actives and rosemary water for soft, moisturized skin.\n" +
    "• Ideal for normal to dry skin — comfortable satin finish.\n" +
    "• Paraben-free, gluten-free, not tested on animals, dermatologically tested.\n" +
    "• 30ml — 3 shades: Light, Medium, Dark.\n\n" +
    "When: Whenever you want pampered-looking skin without heavy makeup — gym, weekend errands, lazy mornings.\n\n" +
    "How: Apply to clean, moisturized skin with fingertips, foundation brush or sponge. Wear alone or as a light base under makeup.\n\n" +
    "Available shades:\n" +
    "• 101 Light — warm natural light\n" +
    "• 102 Medium — warm medium beige\n" +
    "• 103 Dark — warm deeper nude",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Official codes + retailer names (Light/Medium/Dark); hex from official swatch photos. */
const SHADES: ShadeInput[] = [
  {
    name: "101 Light",
    colorHex: "#C99878",
    imageUrl: `${P24}/5201641751183.jpg`,
    position: 0,
  },
  {
    name: "102 Medium",
    colorHex: "#CCA083",
    imageUrl: `${P24}/5201641751190.jpg`,
    position: 1,
  },
  {
    name: "103 Dark",
    colorHex: "#C09279",
    imageUrl: `${P24}/5201641751206.jpg`,
    position: 2,
  },
];

const PRODUCT_IMAGES = [
  `${OFF}/2020/05/Mon_Reve_nude_skin_normal_dry_skin_satin_finish_30ml_copy.jpg`,
  `${OFF}/2023/08/nude_skin_normal_dry_skin.jpg`,
  `${OFF}/2019/11/Mon-Reve_nude-skin_mormal-dry-skin_101.jpg`,
  `${OFF}/2019/11/Mon-Reve_nude-skin_mormal-dry-skin_102.jpg`,
  `${OFF}/2019/11/Mon-Reve_nude-skin_mormal-dry-skin_103.jpg`,
  `${OFF}/2020/05/Mon_Reve_nude_skin_normal_dry_skin_satin_finish_30ml_copy_MGxTODR.jpg`,
  `${OFF}/2020/05/Mon_Reve_nude_skin_normal_dry_skin_satin_finish_30ml_copy_Tld7Uo8.jpg`,
  "https://beautyfree.gr/40108-large_default/mon-reve-nude-skin-dry-normal.jpg",
  "https://beautyfree.gr/40109-large_default/mon-reve-nude-skin-dry-normal.jpg",
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
    subcategoryId: FACE,
    tertiaryCategoryId: FOUNDATION,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [FOUNDATION],
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
  console.log(`  Category: Makeup → Face → Foundation`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
