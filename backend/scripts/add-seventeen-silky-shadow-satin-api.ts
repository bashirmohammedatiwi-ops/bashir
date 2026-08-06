/**
 * Seventeen Silky Shadow Satin — compact satin eyeshadow ~4g
 * 14 shades with images + hex (NO shade barcodes).
 * Product barcode: 5201641731796 (shade 223)
 *
 * Sources:
 *   - seventeencosmetics.com (official 205/210/216 hex + pack photos)
 *   - alshaheera.com Iraq (shade EANs + store photos)
 *   - myoras.com Shopify CDN (225/233/234/235 pack photos)
 *   - beautyfree.gr catalog pack for 223 (shimmer satin family)
 * Hex: official chips where available; otherwise sampled from pan pigment.
 *
 * Usage: npx tsx scripts/add-seventeen-silky-shadow-satin-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYESHADOW = "07f14763-7a8b-4646-a057-8748e2b18bd4";

const OFF = "https://seventeencosmetics.com/media/images/products/2022/12";
const ALSHA = "https://www.storeakmedia.com/storeak-erp/Storeas/326/images/items";
const SHOP = "https://cdn.shopify.com/s/files/1/0625/2537/4676/files";

const PRODUCT = {
  barcode: "5201641731796",
  slug: "seventeen-silky-shadow-satin-compact-eyeshadow-4g",
  sku: "SEV-SSS-731796",
  price: 11000,
  originalPrice: 12500,
  nameAr: "سفنتيين - ظل عيون Silky Shadow Satin ساتان حريري ثابت طويل الأمد 4 غرام",
  nameEn: "Seventeen Silky Shadow Satin Long-Lasting Compact Eyeshadow 4g",
  descriptionAr:
    "ظل عيون Silky Shadow Satin من سفنتيين — ظلال مضغوطة بملمس حريري ساتان، لون غني مكثّف يدوم طوال اليوم دون تلطخ، مع تطبيق سهل وتغطية مثالية تناسب إطلالات السوق العراقي اليومية والمناسبات.\n\n" +
    "• ملمس حريري ناعم ينساب على الجفن ويُدمَج بسهولة.\n" +
    "• لون ساتان مشرق بثبات طويل دون تلطخ أو خطوط.\n" +
    "• تغطية قابلة للبناء من لمسة طبيعية إلى إطلالة جريئة.\n" +
    "• علبة شفافة دائرية عملية تظهر اللون بوضوح.\n" +
    "• مختبر جلدياً وطبّياً للعيون — خالٍ من الغلوتين.\n" +
    "• حوالي 4 غرام — درجات متنوعة من البيج والبني إلى البنفسجي والأزرق والوردي.\n\n" +
    "طريقة الاستخدام: طبّقيه بفرشاة ظلال سفنتيين المناسبة على الجفن، وادمِجي الحواف لإطلالة متناسقة.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 204 Dusty Rose — وردي ترابي ساتان\n" +
    "• 205 Light Taupe — بيج فاتح ناعم\n" +
    "• 210 Deep Brown — بني غامق عميق\n" +
    "• 211 Lilac Mist — ليلكي فاتح ضبابي\n" +
    "• 216 Black — أسود ساتان كلاسيكي\n" +
    "• 219 Plum — برقوقي غني\n" +
    "• 220 Dusty Violet — بنفسجي ترابي\n" +
    "• 222 Gunmetal — رمادي معدني\n" +
    "• 223 Lilac Pearl — ليلكي لؤلؤي ناعم\n" +
    "• 225 Sky Blue — أزرق سماوي مشرق\n" +
    "• 229 Deep Purple — بنفسجي غامق\n" +
    "• 233 Electric Blue — أزرق كهربائي جريء\n" +
    "• 234 Rosewood — وردي خشبي دافئ\n" +
    "• 235 Soft Pink — وردي ناعم باهت",
  descriptionEn:
    "Seventeen Silky Shadow Satin — compact eyeshadows with an extraordinary satin glow. Silky-smooth texture for easy, even application and long-lasting intense colour with perfect coverage that lasts all day without smudging.\n\n" +
    "• Silky-smooth blendable texture.\n" +
    "• Vibrant satin colour payoff with all-day wear.\n" +
    "• Buildable coverage from soft to bold looks.\n" +
    "• Clear round compact that shows the true shade.\n" +
    "• Dermatologically & ophthalmologically tested — gluten free.\n" +
    "• Approx. 4g — a versatile range from nudes and browns to purples, blues and pinks.\n\n" +
    "How to use: Apply with the appropriate Seventeen eyeshadow brushes and blend edges for a seamless finish.\n\n" +
    "Available shades:\n" +
    "• 204 Dusty Rose — warm dusty rose satin\n" +
    "• 205 Light Taupe — soft light taupe\n" +
    "• 210 Deep Brown — deep brown\n" +
    "• 211 Lilac Mist — soft lilac mist\n" +
    "• 216 Black — classic satin black\n" +
    "• 219 Plum — rich plum\n" +
    "• 220 Dusty Violet — dusty violet\n" +
    "• 222 Gunmetal — metallic gunmetal grey\n" +
    "• 223 Lilac Pearl — soft pearly lilac\n" +
    "• 225 Sky Blue — bright sky blue\n" +
    "• 229 Deep Purple — deep purple\n" +
    "• 233 Electric Blue — bold electric blue\n" +
    "• 234 Rosewood — warm rosewood\n" +
    "• 235 Soft Pink — soft muted pink",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "204 Dusty Rose",
    colorHex: "#B9938D",
    imageUrl: `${ALSHA}/769/364/6e0aeeeb-2191-4fd7-ae9a-5c2300049642.jpeg`,
    position: 0,
  },
  {
    name: "205 Light Taupe",
    colorHex: "#B6A6A4",
    imageUrl: `${OFF}/5201641711880_ULRzFk5.jpg`,
    position: 1,
  },
  {
    name: "210 Deep Brown",
    colorHex: "#4C3339",
    imageUrl: `${OFF}/5201641716540.jpg`,
    position: 2,
  },
  {
    name: "211 Lilac Mist",
    colorHex: "#ACB0DC",
    imageUrl: `${ALSHA}/583/643/f445c0ac-9cd4-4bd0-a6c7-28176720e594.jpeg`,
    position: 3,
  },
  {
    name: "216 Black",
    colorHex: "#29262F",
    imageUrl: `${OFF}/5201641722824.jpg`,
    position: 4,
  },
  {
    name: "219 Plum",
    colorHex: "#6C556F",
    imageUrl: `${ALSHA}/057/992/1f0188f6-c519-4eb6-8ec0-7fe87702f832.jpeg`,
    position: 5,
  },
  {
    name: "220 Dusty Violet",
    colorHex: "#67688A",
    imageUrl: `${ALSHA}/314/746/51602e51-d9f4-48a4-82d0-805d47321f7c.jpeg`,
    position: 6,
  },
  {
    name: "222 Gunmetal",
    colorHex: "#79736C",
    imageUrl: `${ALSHA}/526/208/98f9f467-6bf5-4377-a1b3-db5808cec046.jpeg`,
    position: 7,
  },
  {
    name: "223 Lilac Pearl",
    colorHex: "#9A8994",
    imageUrl: "https://beautyfree.gr/34838-large_default/seventeen-silky-shadow-satin.jpg",
    position: 8,
  },
  {
    name: "225 Sky Blue",
    colorHex: "#93C4D5",
    imageUrl: `${SHOP}/Seventeen-SilkyShadowSatin225.png?v=1689574953`,
    position: 9,
  },
  {
    name: "229 Deep Purple",
    colorHex: "#463B4E",
    imageUrl: `${ALSHA}/720/948/482dc0c3-a647-466f-9671-deffbc7bb413.jpeg`,
    position: 10,
  },
  {
    name: "233 Electric Blue",
    colorHex: "#0B709D",
    imageUrl: `${SHOP}/Seventeen-SilkyShadowSatin233.png?v=1689575373`,
    position: 11,
  },
  {
    name: "234 Rosewood",
    colorHex: "#894F57",
    imageUrl: `${SHOP}/Seventeen-SilkyShadowSatin234.png?v=1689575373`,
    position: 12,
  },
  {
    name: "235 Soft Pink",
    colorHex: "#C47B88",
    imageUrl: `${SHOP}/Seventeen-SilkyShadowSatin235.png?v=1689575373`,
    position: 13,
  },
];

const PRODUCT_IMAGES = [
  SHADES[8].imageUrl, // 223 — product barcode shade first
  `${OFF}/5201641711880_ULRzFk5.jpg`,
  `${OFF}/5201641716540.jpg`,
  `${OFF}/5201641722824.jpg`,
  `${SHOP}/Seventeen-SilkyShadowSatin225.png?v=1689574953`,
  `${SHOP}/Seventeen-SilkyShadowSatin233.png?v=1689575373`,
  `${SHOP}/Seventeen-SilkyShadowSatin235.png?v=1689575373`,
  `${ALSHA}/769/364/6e0aeeeb-2191-4fd7-ae9a-5c2300049642.jpeg`,
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
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    subcategoryIds: [EYES],
    tertiaryCategoryIds: [EYESHADOW],
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
  console.log(`  Category: Makeup → Eyes → Eyeshadow`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
