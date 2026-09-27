/**
 * Essence Hydra Kiss Lip Oil — all shades with images + color swatches.
 * Source: https://www.haar-shop.ch/en/67463648-1-hydra-kiss-lip-oil.html
 * Usage: npx tsx scripts/add-essence-hydra-kiss-lip-oil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "56da5b82-c847-4e9b-9cea-cc901236189f";
const TERTIARY_ID = "6405a88e-402f-4508-8799-c8f3ad049c66";

const OLD_SINGLE_SLUG = "essence-hydra-kiss-lip-oil-03-pink-champagne";

const PRODUCT = {
  slug: "essence-hydra-kiss-lip-oil",
  sku: "ESS-HKLO-67463648",
  price: 5250,
  nameAr: "إيسنس - زيت شفاه هايدرا كيس",
  nameEn: "Essence - Hydra Kiss Lip Oil",
  descriptionAr:
    "زيت شفاه هايدرا كيس من إيسنس — لمعة عالية غير لاصقة مع لمسة لون ناعمة تناسب جميع درجات البشرة.\n\n" +
    "• شفاه ناعمة ومرطّبة طوال اليوم.\n• لمعة عالية مع لمسة لون خفيفة.\n• مُعزّز بحمض الهيالورونيك وزيت الجوجوبا وفيتامين E وزيت اللبخ.\n• تركيبة زيتية مغذّية ومرطّبة.\n• مظهر لامع ومنعش.\n• خالٍ من البارابين والجلوتين.\n• نباتي ولم يُختبر على الحيوانات.\n• للون أوضح: حدّدي الشفاه بقلم تحديد ثم ضعي الزيت.",
  descriptionEn:
    "Essence Hydra Kiss Lip Oil — high-shine, non-sticky finish with a hint of colour that suits every skin tone.\n\n" +
    "• For supple and moisturised lips.\n• High-shine finish with a subtle hint of colour.\n• With hyaluronic acid, jojoba oil, vitamin E and meadow cress oil.\n• Nourishing, moisturising oil formula.\n• Glossy, radiantly fresh look.\n• Vegan, paraben-free, gluten-free and cruelty-free.\n• For a more intense colour result, outline and fill lips with a lip liner first.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Kiss From A Rose",
    colorHex: "#E1A3C6",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/b/3b6bcf0fd4d3ae21eef7a3366673174b207081b9_4059729422064_bi_essence_hydra_kiss_lip_oil_01_kiss_from_a_rose.jpg",
    position: 0,
  },
  {
    name: "02 Honey, Honey!",
    colorHex: "#FFA420",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/f/d/fd834e26d0fd006bc61f3463290b028730cc2432_4059729422002_bi_essence_hydra_kiss_lip_oil_02_honey_honey.jpg",
    position: 1,
  },
  {
    name: "03 Pink Champagne",
    colorHex: "#FD6A84",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/d/c/dc86d94c856ae5142c541c5f6381515df49f0c99_4059729421937_bi_essence_hydra_kiss_lip_oil_03_pink_champagne.jpg",
    position: 2,
  },
  {
    name: "06 Cranberry Is Back",
    colorHex: "#FBCAD6",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/1/6/16ff25eea891c85860cc892944f5808727f11c52_4059729518712_bi_essence_hydra_kiss_lip_oil_06_cranberry_is_back.jpg",
    position: 3,
  },
  {
    name: "07 Classy Glassy",
    colorHex: "#F9F9F9",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/d/9/d9fdc298fa5440247713b224da847818b6201842_4059729518729_bi_essence_hydra_kiss_lip_oil_07_classy_glassy.jpg",
    position: 4,
  },
  {
    name: "08 Mocha Glow",
    colorHex: "#933331",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/4/6/4609118fd8f3d0c39344ce81a30bcc2e429e1efc_4059729518736_bi_essence_hydra_kiss_lip_oil_08_mocha_glow.jpg",
    position: 5,
  },
  {
    name: "09 Cookie Sparkle",
    colorHex: "#FCC699",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/4/342513b444759c05ad1e329421323f1aac9cf3bb_4059729542960_bi_essence_hydra_kiss_lip_oil_09_cookie_sparkle.jpg",
    position: 6,
  },
  {
    name: "10 Sugar Sparkle",
    colorHex: "#FBB18F",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/0/4/04c7154fe265208eeae67331ccdb097c688eee6c_4059729584960_bi_essence_hydra_kiss_lip_oil_10_sugar_sparkle.jpg",
    position: 7,
  },
  {
    name: "11 Rosy Sparkle",
    colorHex: "#F07A66",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/b/8b57638c27c97b4504c551a64748ed4420fee145_4059729584977_bi_essence_hydra_kiss_lip_oil_11_rosy_sparkle.jpg",
    position: 8,
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
    if (attempt >= 4) throw err;
    await new Promise((r) => setTimeout(r, attempt * 1500));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function findProductBySlug(slug: string) {
  const result = await api<{ data?: Array<{ id: string; slug?: string }> } | Array<{ id: string; slug?: string }>>(
    `/products?search=${encodeURIComponent(slug)}&status=all&limit=20`,
  );
  const rows = Array.isArray(result) ? result : (result.data ?? []);
  return rows.find((p) => p.slug === slug) ?? null;
}

async function removeOldSingleProduct() {
  const old = await findProductBySlug(OLD_SINGLE_SLUG);
  if (!old) return;
  await api(`/products/${old.id}`, "DELETE");
  console.log(`Removed old single-shade product (${OLD_SINGLE_SLUG})`);
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length}\n`);
  await login();
  console.log("Logged in.\n");

  if (await findProductBySlug(PRODUCT.slug)) {
    console.log(`skip — product already exists (${PRODUCT.slug})`);
    return;
  }

  await removeOldSingleProduct();

  console.log("Uploading shade images...");
  const shades: Array<{
    name: string;
    colorHex: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    try {
      const imageId = await uploadImage(shade.imageUrl, shade.name);
      shades.push({
        name: shade.name,
        colorHex: shade.colorHex,
        imageId,
        position: shade.position,
        stock: 0,
      });
      console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
      await new Promise((r) => setTimeout(r, 900));
    } catch (err) {
      console.log(`  ✗ ${shade.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (!shades.length) throw new Error("No shade images uploaded");

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    slug: PRODUCT.slug,
    brandId: BRAND_ID,
    categoryId: CATEGORY_ID,
    subcategoryId: SUBCATEGORY_ID,
    tertiaryCategoryId: TERTIARY_ID,
    subcategoryIds: [SUBCATEGORY_ID],
    tertiaryCategoryIds: [TERTIARY_ID],
    nameAr: PRODUCT.nameAr,
    nameEn: PRODUCT.nameEn,
    descriptionAr: PRODUCT.descriptionAr,
    descriptionEn: PRODUCT.descriptionEn,
    price: PRODUCT.price,
    originalPrice: PRODUCT.price,
    stock: 0,
    isActive: true,
    imageIds,
    shades,
  });

  console.log(`\n✓ Created: ${created.name ?? PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
