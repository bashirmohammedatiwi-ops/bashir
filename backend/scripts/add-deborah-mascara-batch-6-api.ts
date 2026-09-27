/**
 * Deborah Milano — 6 separate single-SKU mascara products (no shades).
 * Sources: deborahmilano.com (verified names, images, descriptions)
 * Usage: npx tsx scripts/add-deborah-mascara-batch-6-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const MASCARA = "e1032b57-c1af-49e3-a408-130468f22736";

const DM21 = "https://www.deborahmilano.com/en/wp-content/uploads/2021/01";
const DM22 = "https://www.deborahmilano.com/en/wp-content/uploads/2022/10";
const DM25 = "https://www.deborahmilano.com/en/wp-content/uploads/2025/01";
const DM2509 = "https://www.deborahmilano.com/en/wp-content/uploads/2025/09";
const DMIT21 = "https://www.deborahmilano.com/it/wp-content/uploads/2021/01";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "8009518415421",
    slug: "deborah-24ore-instant-maxi-volume-ceramides-black",
    sku: "DBR-IMC-MDV000123",
    price: 14000,
    nameAr: "ديبورا ميلانو - ماسكارا 24Ore Instant Maxi Volume With Ceramides Black",
    nameEn: "Deborah Milano - 24Ore Instant Maxi Volume Mascara With Ceramides Black",
    descriptionAr:
      "ماسكارا 24Ore Instant Maxi Volume With Ceramides Black من ديبورا ميلانو.\n\n" +
      "• تركيبة Ceramides مع ألياف volumizing وmicrospheres من silica.\n" +
      "• حجم فوري وrموش أكثر كثافة من أول طبقة.\n" +
      "• فرشاة maxi — لون أسود ultra-black.\n" +
      "• 12 ml — مختبرة لدى طبيب العيون.",
    descriptionEn:
      "Deborah Milano 24Ore Instant Maxi Volume Mascara With Ceramides Black — best-selling volumising black mascara.\n\n" +
      "• Ceramide-enriched formula with volumising fibres and silica microspheres.\n" +
      "• Instant visible volume in one swipe.\n" +
      "• Maxi brush with ultra-black colour.\n" +
      "• 12 ml — Ophthalmologist tested.",
    imageUrl: `${DM22}/MDV000123_Mascara_instant-Maxi_Ceramidi-600x600.jpg`,
  },
  {
    barcode: "8009518475098",
    slug: "deborah-24ore-instant-maxi-volume-ceramides-chocolate-brown",
    sku: "DBR-IMC-MDV012825",
    price: 14000,
    nameAr: "ديبورا ميلانو - ماسكارا 24Ore Instant Maxi Volume With Ceramides Chocolate Brown",
    nameEn: "Deborah Milano - 24Ore Instant Maxi Volume Mascara With Ceramides Chocolate Brown",
    descriptionAr:
      "ماسكارا 24Ore Instant Maxi Volume With Ceramides — درجة Chocolate Brown.\n\n" +
      "• تركيبة Ceramides مع ألياف volumizing وmicrospheres من silica.\n" +
      "• مظهر intense وsophisticated للرموش.\n" +
      "• فرشاة soft fibre لتوزيع متساوٍ وحجم فوري.\n" +
      "• 12 ml — مختبرة لدى طبيب العيون.",
    descriptionEn:
      "Deborah Milano 24Ore Instant Maxi Volume Mascara With Ceramides Chocolate Brown.\n\n" +
      "• Ceramide-enriched formula with volumising fibres and silica microspheres.\n" +
      "• Chocolate Brown shade for an intense, sophisticated look.\n" +
      "• Soft-fibre applicator for even coverage and instant volume.\n" +
      "• 12 ml — Ophthalmologist tested.",
    imageUrl: `${DM2509}/MDV012825_Brown-600x600.png`,
  },
  {
    barcode: "8009518475074",
    slug: "deborah-24ore-instant-maxi-volume-ceramides-electric-blue",
    sku: "DBR-IMC-MDV012725",
    price: 14000,
    nameAr: "ديبورا ميلانو - ماسكارا 24Ore Instant Maxi Volume With Ceramides Electric Blue",
    nameEn: "Deborah Milano - 24Ore Instant Maxi Volume Mascara With Ceramides Electric Blue",
    descriptionAr:
      "ماسكارا 24Ore Instant Maxi Volume With Ceramides — درجة Electric Blue.\n\n" +
      "• تركيبة Ceramides مع ألياف volumizing وmicrospheres من silica.\n" +
      "• لون أزرق electric لمظهر vibrant وmagnetic.\n" +
      "• فرشاة soft fibre لتوزيع متساوٍ وحجم فوري.\n" +
      "• 12 ml — مختبرة لدى طبيب العيون.",
    descriptionEn:
      "Deborah Milano 24Ore Instant Maxi Volume Mascara With Ceramides Electric Blue.\n\n" +
      "• Ceramide-enriched formula with volumising fibres and silica microspheres.\n" +
      "• Electric Blue shade for a vibrant, magnetic look.\n" +
      "• Soft-fibre applicator for even coverage and instant volume.\n" +
      "• 12 ml — Ophthalmologist tested.",
    imageUrl: `${DM2509}/MDV012725__Blue-600x600.png`,
  },
  {
    barcode: "8009518468625",
    slug: "deborah-extraordinary-5-in-1-mascara-blue-navy",
    sku: "DBR-E51-MDV001425",
    price: 14000,
    nameAr: "ديبورا ميلانو - ماسكارا Extraordinary 5-in-1 Blue Navy",
    nameEn: "Deborah Milano - Extraordinary 5-in-1 Mascara Blue Navy",
    descriptionAr:
      "Extraordinary 5-in-1 Mascara Blue Navy من ديبورا ميلانو.\n\n" +
      "• تركيبة 5 في 1: حجم، طول، تكوير، ثبات وتعريف.\n" +
      "• فرشاة مدببة للرموش القصيرة والطويلة.\n" +
      "• درجة Blue Navy — بدون عطر.\n" +
      "• 12 ml — مختبرة لدى طبيب العيون.",
    descriptionEn:
      "Deborah Milano Extraordinary 5-in-1 Mascara Blue Navy.\n\n" +
      "• 5-in-1 formula: volume, length, curl, long wear and definition.\n" +
      "• Tapered brush for long and short lashes.\n" +
      "• Blue Navy shade — fragrance free.\n" +
      "• 12 ml — Ophthalmologist tested.",
    imageUrl: `${DM25}/MDV001425_Mascara_5in1_BLUE-600x600.jpg`,
  },
  {
    barcode: "8009518207989",
    slug: "deborah-extraordinary-5-in-1-mascara-black",
    sku: "DBR-E51-004194",
    price: 14000,
    nameAr: "ديبورا ميلانو - ماسكارا Extraordinary 5-in-1 Black",
    nameEn: "Deborah Milano - Extraordinary 5-in-1 Mascara Black",
    descriptionAr:
      "Extraordinary 5-in-1 Mascara Black من ديبورا ميلانو.\n\n" +
      "• تركيبة 5 في 1: حجم، طول، تكوير، ثبات وتعريف.\n" +
      "• فرشاة مدببة للرموش القصيرة والطويلة.\n" +
      "• درجة Black — تأثير high-definition.\n" +
      "• 12 ml — مختبرة لدى طبيب العيون.",
    descriptionEn:
      "Deborah Milano Extraordinary 5-in-1 Mascara Black.\n\n" +
      "• 5-in-1 formula: volume, length, curl, long wear and definition.\n" +
      "• Tapered brush for long and short lashes.\n" +
      "• Black shade for a dramatic high-definition effect.\n" +
      "• 12 ml — Ophthalmologist tested.",
    imageUrl: `${DM21}/004194-Mascara-Extraordinary-5in1-600x600.jpg`,
  },
  {
    barcode: "8009518374148",
    slug: "deborah-24ore-instant-maxi-volume-pomegranate-black",
    sku: "DBR-IMV-009997",
    price: 16500,
    nameAr: "ديبورا ميلانو - ماسكارا 24Ore Instant Maxi Volume Pomegranate Oil & Keratin Black",
    nameEn: "Deborah Milano - 24Ore Instant Maxi Volume Mascara Pomegranate Oil & Keratin Black",
    descriptionAr:
      "24Ore Instant Maxi Volume Pomegranate & Keratin Black من ديبورا ميلانو.\n\n" +
      "• حجم extreme من أول تطبيق (+170% volume*).\n" +
      "• غنية بزيت الرمان وCheratina لرموش ناعمة ومغذية.\n" +
      "• ألياف hollow وmicrospheres من silica.\n" +
      "• 12 ml — مختبرة لدى طبيب العيون.\n" +
      "* اختبار instrumentale على 20 مشارك.",
    descriptionEn:
      "Deborah Milano 24Ore Instant Maxi Volume Mascara Pomegranate Oil & Keratin Black.\n\n" +
      "• Extreme volume from the first application (+170% volume*).\n" +
      "• Enriched with pomegranate oil and keratin for nourished, protected lashes.\n" +
      "• Hollow fibres and silica microspheres for instant volume and curl.\n" +
      "• 12 ml — Ophthalmologist tested.\n" +
      "* Instrumental test on 20 subjects.",
    imageUrl: `${DMIT21}/008191-MASCARA-24-ORE-INSTANT-MAXI-VOLUME-600x600.jpg`,
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
  const resolved = await api<{ brand?: { id: string } }>("/brands/resolve", "POST", {
    brandAr: "ديبورا",
    brandEn: "Deborah Milano",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Deborah Milano brand");
  return brandId;
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

async function deleteByBarcode(barcode: string) {
  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string; slug?: string } }>(
    `/products/barcode-check?barcode=${barcode}`,
  );
  if (!check.exists || !check.product?.id) return false;
  await api(`/products/${check.product.id}`, "DELETE");
  console.log(`  deleted old: ${check.product.slug ?? check.product.nameAr ?? check.product.id}`);
  return true;
}

async function deleteOrphanSlug(slug: string) {
  const existing = await api<{ data?: Array<{ id: string; slug?: string; barcode?: string }> } | Array<{ id: string; slug?: string; barcode?: string }>>(
    `/products?search=${encodeURIComponent(slug)}&status=all&limit=10`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  for (const row of rows.filter((p) => p.slug === slug)) {
    await api(`/products/${row.id}`, "DELETE");
    console.log(`  deleted orphan slug: ${slug} (${row.barcode ?? row.id})`);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Fix ${PRODUCTS.length} single-SKU mascara products (no shades)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();
  let fixed = 0;

  for (const product of PRODUCTS) {
    console.log(`--- ${product.barcode} ---`);
    await deleteByBarcode(product.barcode);
    await deleteOrphanSlug("deborah-extraordinary-5-in-1-mascara-blue-navy-brown");

    console.log(`  uploading image...`);
    const imageId = await uploadImage(product.imageUrl, product.slug);

    const created = await api<{ id: string; shades?: unknown[] }>("/products", "POST", {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId,
      categoryId: MAKEUP,
      subcategoryId: EYES,
      tertiaryCategoryId: MASCARA,
      subcategoryIds: [EYES],
      tertiaryCategoryIds: [MASCARA],
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price: product.price,
      originalPrice: product.price,
      stock: 0,
      isActive: true,
      imageIds: [imageId],
    });

    const verify = await api<{ shades?: unknown[] }>(`/products/${created.id}`);
    const shadeCount = verify.shades?.length ?? 0;
    console.log(`  ✓ ${product.nameEn}`);
    console.log(`    ID: ${created.id} | shades: ${shadeCount} | ${product.price} IQD\n`);
    if (shadeCount > 0) throw new Error(`Product ${product.barcode} still has shades`);
    fixed += 1;
  }

  console.log(`Done — fixed: ${fixed}/${PRODUCTS.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
