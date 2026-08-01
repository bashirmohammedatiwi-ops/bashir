/**
 * GOSH Copenhagen — 5 separate makeup brush products (no shades).
 * Source: goshcopenhagen.com (verified names, descriptions, images)
 * Usage: npx tsx scripts/add-gosh-brushes-batch-5-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const TOOLS = "c7a90d6f-6fd4-40df-9b02-4cb33b8efce1";
const FACE_BRUSHES = "575c78b2-000c-4311-8c69-3694995a3565";
const EYE_BRUSHES = "0ab0d6d2-4550-4b3b-9ac3-91df6e90b70a";

const CDN = "https://goshcopenhagen.com/cdn/shop/files";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrls: string[];
  tertiaryCategoryId: string;
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "5711914215552",
    slug: "gosh-copenhagen-foundation-brush",
    sku: "GSH-FB-215552",
    price: 12000,
    nameAr: "كوش - فرشاة وجه Foundation Brush",
    nameEn: "GOSH Copenhagen - Foundation Brush",
    descriptionAr:
      "فرشاة Foundation Brush من كوش — رفيقتك لتوزيع الفاونديشن السائل والكريمي بإطلالة ناعمة ومتجانسة.\n\n" +
      "• شعيرات صناعية 100% فائقة النعومة — لا تمتص المنتج.\n" +
      "• رأس مسطّح ومستدير قليلاً لتوزيع متساوٍ بدون خطوط.\n" +
      "• مقبض مريح يمنح تحكماً كاملاً أثناء التطبيق.\n" +
      "• نباتية (Vegan) — مناسبة لجميع أنواع البشرة.\n" +
      "• ضعي كمية صغيرة من الفاونديشن على الوجه ووزّعيها بحركات ناعمة من الوسط نحو الخارج.",
    descriptionEn:
      "GOSH Copenhagen Foundation Brush — your essential tool for smooth, streak-free liquid and cream foundation application.\n\n" +
      "• 100% synthetic ultra-soft bristles that do not absorb product.\n" +
      "• Flat, slightly rounded head for even, seamless blending.\n" +
      "• Ergonomic handle for full control and a flawless finish.\n" +
      "• Vegan — suitable for all skin types.\n" +
      "• Dispense foundation onto the face and blend outward from the centre with gentle sweeping motions.",
    imageUrls: [
      `${CDN}/5711914215552.jpg`,
      `${CDN}/5711914215552_grande.jpg`,
    ],
    tertiaryCategoryId: FACE_BRUSHES,
  },
  {
    barcode: "5711914215750",
    slug: "gosh-copenhagen-precision-brush",
    sku: "GSH-PB-215750",
    price: 8500,
    nameAr: "كوش - فرشاة عيون دقيقة Precision Brush",
    nameEn: "GOSH Copenhagen - Precision Brush",
    descriptionAr:
      "فرشاة Precision Brush من كوش — لتطبيق ودمج ظلال العيون بدقة في ثنية العين والزوايا الداخلية وخط الرموش.\n\n" +
      "• شعيرات صناعية 100% ناعمة وعالية الجودة.\n" +
      "• رأس مدبّب رفيع لعمل تفصيلي وتطبيق محدد.\n" +
      "• مثالية لتحديد ثنية العين وإبراز الزوايا الداخلية.\n" +
      "• مقبض مريح لأقصى دقة وتحكم.\n" +
      "• نباتية (Vegan) — لطيفة على منطقة العين الحساسة.",
    descriptionEn:
      "GOSH Copenhagen Precision Brush — for precise eyeshadow application and blending in the crease, inner corners and lash line.\n\n" +
      "• 100% synthetic ultra-soft, high-quality bristles.\n" +
      "• Fine tapered tip for detailed work and targeted colour placement.\n" +
      "• Ideal for defining the crease and highlighting inner corners.\n" +
      "• Ergonomic handle for maximum control.\n" +
      "• Vegan — gentle on the delicate eye area.",
    imageUrls: [
      `${CDN}/5711914215750_ff2d46c4-31b7-4869-b234-27c7ead90e14.jpg`,
      `${CDN}/5711914215750_ff2d46c4-31b7-4869-b234-27c7ead90e14_grande.jpg`,
    ],
    tertiaryCategoryId: EYE_BRUSHES,
  },
  {
    barcode: "5711914215859",
    slug: "gosh-copenhagen-blender-brush",
    sku: "GSH-BB-215859",
    price: 8500,
    nameAr: "كوش - فرشاة دمج ظلال Blender Brush",
    nameEn: "GOSH Copenhagen - Blender Brush",
    descriptionAr:
      "فرشاة Blender Brush من كوش — لدمج ظلال العيون بسهولة وإطلالات ناعمة بانتقالات طبيعية.\n\n" +
      "• شعيرات صناعية 100% ناعمة وخفيفة لتوزيع متساوٍ.\n" +
      "• شكل دائري منتفخ مثالي للدمج والتدرج بين الدرجات.\n" +
      "• تمنح إطلالات عيون متعددة الأبعاد بلمسة احترافية.\n" +
      "• مقبض مريح لتحكم كامل أثناء الدمج.\n" +
      "• نباتية (Vegan) — لطيفة على منطقة العين الحساسة.",
    descriptionEn:
      "GOSH Copenhagen Blender Brush — effortlessly blend eyeshadow for soft transitions and a seamless finish.\n\n" +
      "• 100% synthetic ultra-soft, airy bristles for even colour distribution.\n" +
      "• Fluffy rounded shape perfect for blending and seamless shade transitions.\n" +
      "• Creates multi-dimensional eye looks with a professional touch.\n" +
      "• Ergonomic handle for full control while blending.\n" +
      "• Vegan — gentle on the delicate eye area.",
    imageUrls: [
      `${CDN}/5711914215859_90fb7bdb-9f23-440c-8934-c33c636e55ff.jpg`,
      `${CDN}/5711914215859_90fb7bdb-9f23-440c-8934-c33c636e55ff_grande.jpg`,
    ],
    tertiaryCategoryId: EYE_BRUSHES,
  },
  {
    barcode: "5711914215705",
    slug: "gosh-copenhagen-brow-eye-liner-brush",
    sku: "GSH-BEL-215705",
    price: 9500,
    nameAr: "كوش - فرشاة حواجب وكحل Brow & Eye Liner Brush",
    nameEn: "GOSH Copenhagen - Brow & Eye Liner Brush",
    descriptionAr:
      "فرشاة Brow & Eye Liner Brush من كوش — فرشاة 2 في 1 لتحديد الحواجب وخط الكحل بدقة احترافية.\n\n" +
      "• رأس مائلة رفيعة لتطبيق دقيق للحواجب والآيلاينر.\n" +
      "• فرشاة حواجب مدمجة لتصفيف وتحديد الشكل.\n" +
      "• شعيرات صناعية 100% ناعمة — لا تمتص المنتج.\n" +
      "• مثالية مع البوماد والجل والبودرة للحواجب وكحل الكريمي والبودرة.\n" +
      "• نباتية وخالية من التجارب على الحيوانات (Vegan & Cruelty-Free).",
    descriptionEn:
      "GOSH Copenhagen Brow & Eye Liner Brush — a 2-in-1 brush for perfectly defined brows and eyeliner looks.\n\n" +
      "• Thin angled tip for detailed brow and liner application.\n" +
      "• Integrated brow brush to comb, shape and define brows.\n" +
      "• 100% synthetic ultra-soft bristles that do not absorb product.\n" +
      "• Works with brow pomade, gel or powder and cream or powder eyeliner.\n" +
      "• Vegan and cruelty-free.",
    imageUrls: [
      `${CDN}/5711914215705_86d73d37-ba78-482d-a6dd-3053a356f912.jpg`,
      `${CDN}/5711914215705_86d73d37-ba78-482d-a6dd-3053a356f912_grande.jpg`,
    ],
    tertiaryCategoryId: EYE_BRUSHES,
  },
  {
    barcode: "5711914215903",
    slug: "gosh-copenhagen-mix-fix-brush",
    sku: "GSH-MF-215903",
    price: 10500,
    nameAr: "كوش - فرشاة مزج وتطبيق Mix & Fix Brush",
    nameEn: "GOSH Copenhagen - Mix & Fix Brush",
    descriptionAr:
      "فرشاة Mix & Fix Brush من كوش — فرشاة مبتكرة لتطبيق ومزج منتجات المكياج السائلة بسهولة.\n\n" +
      "• تجويف مدمج بين الشعيرات لخلط الفاونديشن والبرايمر أو السيروم.\n" +
      "• توزيع متحكم به بدون هدر للمنتج.\n" +
      "• شعيرات صناعية 100% ناعمة لإنهاء ناعم ومتجانس.\n" +
      "• مثالية لتخصيص الخلطات وتطبيق القوام السائل.\n" +
      "• نباتية (Vegan) — مناسبة لجميع أنواع البشرة.",
    descriptionEn:
      "GOSH Copenhagen Mix & Fix Brush — an innovative brush for effortless application of all liquid makeup products.\n\n" +
      "• Unique well in the bristles to hold and blend foundation, primer or serum.\n" +
      "• Controlled distribution with no product waste.\n" +
      "• 100% synthetic ultra-soft bristles for a smooth, even finish.\n" +
      "• Perfect for custom mixes and liquid texture application.\n" +
      "• Vegan — suitable for all skin types.",
    imageUrls: [
      `${CDN}/5711914215903_05996223-95e7-47a0-a0b7-aba0f4c45db5.jpg`,
      `${CDN}/5711914215903_05996223-95e7-47a0-a0b7-aba0f4c45db5_grande.jpg`,
    ],
    tertiaryCategoryId: FACE_BRUSHES,
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

async function resolveBrandId(): Promise<string> {
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: "كوش",
    brandEn: "GOSH Copenhagen",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve GOSH Copenhagen brand");
  return brandId;
}

async function uploadImage(url: string, alt: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*", "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)" },
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 1024) throw new Error("empty image");

    const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!contentType.startsWith("image/")) throw new Error(`not an image (${contentType || "unknown"})`);

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
  console.log(`Products: ${PRODUCTS.length} (no shades)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();
  console.log(`Brand: GOSH Copenhagen (${brandId})\n`);

  let added = 0;
  let skipped = 0;

  for (const product of PRODUCTS) {
    console.log(`--- ${product.barcode} ---`);
    const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
      `/products/barcode-check?barcode=${product.barcode}`,
    );
    if (check.exists) {
      console.log(`  skip — exists | ${check.product?.nameAr ?? "?"}\n`);
      skipped += 1;
      continue;
    }

    const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
      `/products?search=${encodeURIComponent(product.slug)}&status=all&limit=5`,
    );
    const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
    if (rows.some((p) => p.slug === product.slug)) {
      console.log(`  skip — slug exists (${product.slug})\n`);
      skipped += 1;
      continue;
    }

    console.log(`  uploading ${product.imageUrls.length} images...`);
    const imageIds: string[] = [];
    for (let i = 0; i < product.imageUrls.length; i++) {
      imageIds.push(await uploadImage(product.imageUrls[i], `${product.slug}-${i + 1}`));
    }

    const created = await api<{ id: string }>("/products", "POST", {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId,
      categoryId: MAKEUP,
      subcategoryId: TOOLS,
      tertiaryCategoryId: product.tertiaryCategoryId,
      subcategoryIds: [TOOLS],
      tertiaryCategoryIds: [product.tertiaryCategoryId],
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price: product.price,
      originalPrice: product.price,
      stock: 0,
      isActive: true,
      imageIds,
    });

    const verify = await api<{ shades?: unknown[] }>(`/products/${created.id}`);
    console.log(`  ✓ ${product.nameEn}`);
    console.log(`    ID: ${created.id} | shades: ${verify.shades?.length ?? 0} | ${product.price} IQD\n`);
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Product ${product.barcode} has shades`);
    added += 1;
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Done — added: ${added}/${PRODUCTS.length} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
