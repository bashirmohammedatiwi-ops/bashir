/**
 * Essence The Super Peptide Glossy Lip Treatment — all shades.
 * Source: https://www.haar-shop.ch/en/67463732-1-the-super-peptide-glossy-lip-treatment.html
 * Usage: npx tsx scripts/add-essence-super-peptide-lip-treatment-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const SUBCATEGORY_ID = "07661898-571a-4a88-aa6c-76dcdbf53029";
const TERTIARY_ID = "e932381d-8469-4099-b66e-ce1a7eec9b60";

const PRODUCT = {
  slug: "essence-the-super-peptide-glossy-lip-treatment",
  sku: "ESS-SPLT-67463732",
  price: 5250,
  nameAr: "إيسنس - علاج شفاه لامع سوبر ببتيد",
  nameEn: "Essence - The Super Peptide Glossy Lip Treatment",
  descriptionAr:
    "علاج شفاه لامع سوبر ببتيد من إيسنس — بلسم شفاه فاخر يمنح لمسة لون خفيفة مع عناية مكثّفة ولمعة جذابة غير لاصقة.\n\n" +
    "• بلسم شفاه بلمعة عالية ولمسة لون ناعمة.\n• تركيبة غنية بالببتيدات وزبدة الشيا وفيتامين E.\n• ترطيب مكثّف يترك الشفاه ناعمة كالحرير.\n• قوام فاخر خفيف بلمعة أنيقة.\n• يُعزّز لون الشفاه الطبيعي بأناقة.\n• خالٍ من البارابين والغلوتين.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق على الشفاه في أي وقت خلال اليوم حسب الحاجة.\n• يُغذّي الشفاه ويمنحها نعومة ولمعة خفيفة.",
  descriptionEn:
    "Essence The Super Peptide Glossy Lip Treatment — luxurious lip balm with a hint of colour, intensive care and an irresistible glossy finish.\n\n" +
    "• Lip balm with high shine and a subtle touch of colour.\n• Enriched with peptides, shea butter and vitamin E.\n• Provides intense hydration and leaves lips silky soft.\n• Dreamy, lightweight texture with a non-sticky glossy finish.\n• Elegantly enhances your natural lip colour.\n• Vegan, paraben-free and gluten-free.\n• Cruelty-free.\n• Apply as often as needed throughout the day.\n• Nourishes lips and leaves them soft, supple and subtly glossy.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Peptacular!",
    colorHex: "#F9F9F9",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/4/347abb4049a4d2076bbadbdb6d11508fb3ddb402_4059729490667_bi_essence_the_super_peptide_glossy_lip_treatment_01_peptacular.jpg",
    position: 0,
  },
  {
    name: "02 Pinkified!",
    colorHex: "#C63A4F",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/4/b/4bffdaf7b278d1b8a9112d39b1b3cd064a43b288_4059729518620_bi_essence_the_super_peptide_glossy_lip_treatment_02_pinkified.jpg",
    position: 1,
  },
  {
    name: "03 Toffeetastic!",
    colorHex: "#804336",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/9/e/9e13db0abd2e28777fade0e15a729538dc83f154_4059729518644_bi_essence_the_super_peptide_glossy_lip_treatment_03_toffeetastic.jpg",
    position: 2,
  },
  {
    name: "04 Coralized!",
    colorHex: "#FF6A6C",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/e/9/e99e51c118a2730e8d5f35fa11e56a282af01558_4059729518668_bi_essence_the_super_peptide_glossy_lip_treatment_04_coralized.jpg",
    position: 3,
  },
  {
    name: "05 Holomazing!",
    colorHex: "#FB9CB7",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/f/8f09e14ee49343650e979153b19aeda83c8e266c_4059729593061_bi_essence_the_super_peptide_glossy_lip_treatment_05_holomazing.jpg",
    position: 4,
  },
  {
    name: "06 Plumfection!",
    colorHex: "#742C26",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/2/829b55a9c3e53899e5a272f27a0697f96e46d8f6_4059729593290_bi_essence_the_super_peptide_glossy_lip_treatment__06_plumfection.jpg",
    position: 5,
  },
  {
    name: "07 Sugardorable!",
    colorHex: "#E4745E",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/4/4/44c9634cff7e6e44385ba0e5056f8c5248bc1c9b_4059729593634_bi_essence_the_super_peptide_glossy_lip_treatment_07_sugardorable.jpg",
    position: 6,
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

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length}\n`);
  await login();
  console.log("Logged in.\n");

  const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT.slug)}&status=all&limit=5`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  if (rows.some((p) => p.slug === PRODUCT.slug)) {
    console.log(`skip — product already exists (${PRODUCT.slug})`);
    return;
  }

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
      await new Promise((r) => setTimeout(r, 700));
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
  console.log(`  Category: العناية → العناية بالوجه → العناية بالشفايف`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
