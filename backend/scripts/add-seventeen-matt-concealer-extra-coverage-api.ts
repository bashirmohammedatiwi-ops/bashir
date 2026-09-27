/**
 * Seventeen Matt Concealer Extra Coverage — full-coverage matte liquid concealer
 * Official shades 00–04 + 05 Orange (official tip + pack photo).
 * Product barcode: 5201641736968 (shade 00) — NO shade barcodes.
 *
 * Sources:
 *   - seventeencosmetics.com/en/catalogue/matt-concealer-extra-coverage_50/
 *   - Official pack photos 2021/04/seventeen_matt_concealer_{00-05}.jpg
 * Hex sampled from pigment region in clear tube (warm skin-tone cluster).
 *
 * Usage: npx tsx scripts/add-seventeen-matt-concealer-extra-coverage-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";

const OFF = "https://seventeencosmetics.com/media/images/products/2021/04";

const PRODUCT = {
  barcode: "5201641736968",
  slug: "seventeen-matt-concealer-extra-coverage-3ml",
  sku: "SEV-MC-736968",
  price: 15000,
  originalPrice: 17000,
  nameAr: "سفنتيين - كونسيلر Matt Concealer Extra Coverage تغطية فائقة مطفية 3 مل",
  nameEn: "Seventeen Matt Concealer Extra Coverage Full Coverage Matte Concealer 3ml",
  descriptionAr:
    "كونسيلر Matt Concealer Extra Coverage من سفنتيين — كونسيلر سائل بتغطية فائقة ولمسة مطفية يدوم طوال اليوم، يخفي الهالات السوداء والعيوب والتشوّهات دون إبراز خطوط التعبير.\n\n" +
    "• تغطية كاملة قابلة للبناء للهالات والحبوب والتبقّعات.\n" +
    "• لمسة مطفية ناعمة لا تلمع ولا تتشقّق في خطوط التعبير.\n" +
    "• غني بمستخلص الشاي الأخضر والرمان لتقليل الانتفاخ تحت العين وتنشيط البشرة.\n" +
    "• فرشاة تطبيق مريحة لتوزيع دقيق وسلس حول العين وعلى الوجه.\n" +
    "• مناسب لجميع أنواع البشرة — مختبر جلدياً وعينياً — نباتي وخالٍ من الغلوتين.\n" +
    "• 3 مل — 6 درجات: من الفاتح جداً إلى الحنطي + برتقالي مصحّح.\n\n" +
    "طريقة الاستخدام: ضعيه تحت العينين وعلى أي منطقة تحتاج تغطية أعلى بفرشاة التطبيق المرفقة، ثم ادمِجي برفق.\n" +
    "نصيحة للهالات العنيدة: ضعي درجة 05 Orange مباشرة على الهالات الزرقاء/البنفسجية قبل الفاونديشن لمعادلة اللون، ثم ثبّتي بدرجتك المعتادة.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 00 Fair — فاتح جداً للبشرة الفاتحة جداً\n" +
    "• 01 Light — فاتح بيج طبيعي\n" +
    "• 02 Light Medium — فاتح متوسط دافئ\n" +
    "• 03 Medium — متوسط بيج حنطي\n" +
    "• 04 Golden — حنطي ذهبي دافئ\n" +
    "• 05 Orange — برتقالي مصحّح للهالات الزرقاء والبنفسجية",
  descriptionEn:
    "Seventeen Matt Concealer Extra Coverage — a full-coverage hydrating liquid concealer with a soft matte finish that lasts all day. Instantly covers dark circles, blemishes and discolorations without highlighting expression lines.\n\n" +
    "• Maximum, buildable coverage for under-eyes, spots and uneven tone.\n" +
    "• Soft matte finish that stays put and won’t crease into fine lines.\n" +
    "• Enriched with green tea and pomegranate extracts to help reduce under-eye puffiness.\n" +
    "• Easy application brush for precise, seamless blending on eyes and face.\n" +
    "• Suitable for all skin types — dermatologically & ophthalmologically tested — vegan and gluten free.\n" +
    "• 3ml — 6 shades from fair to golden medium plus an orange colour corrector.\n\n" +
    "How to use: Apply under the eyes and on any area needing extra coverage with the brush applicator, then blend gently.\n" +
    "Pro tip: Neutralize stubborn blue/purple dark circles by dabbing 05 Orange directly onto discoloration before foundation, then layer your matching shade.\n\n" +
    "Available shades:\n" +
    "• 00 Fair — very fair light beige\n" +
    "• 01 Light — natural light beige\n" +
    "• 02 Light Medium — warm light-medium\n" +
    "• 03 Medium — medium beige\n" +
    "• 04 Golden — warm golden medium\n" +
    "• 05 Orange — orange corrector for blue/purple dark circles",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Official codes 00–04 on site; 05 Orange from official tip + pack photo. Hex from tube pigment. */
const SHADES: ShadeInput[] = [
  {
    name: "00 Fair",
    colorHex: "#D2B29D",
    imageUrl: `${OFF}/seventeen_matt_concealer_00.jpg`,
    position: 0,
  },
  {
    name: "01 Light",
    colorHex: "#CBA591",
    imageUrl: `${OFF}/seventeen_matt_concealer_01.jpg`,
    position: 1,
  },
  {
    name: "02 Light Medium",
    colorHex: "#C29C87",
    imageUrl: `${OFF}/seventeen_matt_concealer_02.jpg`,
    position: 2,
  },
  {
    name: "03 Medium",
    colorHex: "#B4856F",
    imageUrl: `${OFF}/seventeen_matt_concealer_03.jpg`,
    position: 3,
  },
  {
    name: "04 Golden",
    colorHex: "#B88A75",
    imageUrl: `${OFF}/seventeen_matt_concealer_04.jpg`,
    position: 4,
  },
  {
    name: "05 Orange",
    colorHex: "#B1806B",
    imageUrl: `${OFF}/seventeen_matt_concealer_05.jpg`,
    position: 5,
  },
];

const PRODUCT_IMAGES = [
  `${OFF}/seventeen_matt_concealer_00.jpg`,
  `${OFF}/seventeen_matt_concealer_01.jpg`,
  `${OFF}/seventeen_matt_concealer_02.jpg`,
  `${OFF}/seventeen_matt_concealer_03.jpg`,
  `${OFF}/seventeen_matt_concealer_04.jpg`,
  `${OFF}/seventeen_matt_concealer_05.jpg`,
  "https://myoras.com/cdn/shop/files/seventeen-matt-concealer-extra-coverage-oras-official-1.jpg",
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
    | { data?: Array<{ id: string; name?: string; nameEn?: string; nameAr?: string }> }
    | Array<{ id: string; name?: string; nameEn?: string; nameAr?: string }>
  >(`/brands?search=${encodeURIComponent("Seventeen")}&limit=50`);
  const rows = Array.isArray(search) ? search : (search.data ?? []);
  const exact = rows.find((b) => {
    const n = `${b.name ?? ""} ${b.nameEn ?? ""} ${b.nameAr ?? ""}`.toLowerCase().trim();
    return n === "seventeen" || /(^|\s)seventeen(\s|$)/.test(n) || n.includes("seven7een") || n.includes("سفنتيين");
  });
  if (exact?.id) {
    console.log(`Brand: Seventeen (${exact.id}) [exact search]\n`);
    return exact.id;
  }
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: "سفنتيين",
    brandEn: "Seventeen",
    createIfMissing: true,
  });
  if (!resolved.brand?.id) throw new Error("Could not resolve Seventeen brand");
  console.log(`Brand: Seventeen (${resolved.brand.id})${resolved.created ? " [created]" : " [resolve]"}\n`);
  return resolved.brand.id;
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
  console.log(`  Category: Makeup → Face → Concealer`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
