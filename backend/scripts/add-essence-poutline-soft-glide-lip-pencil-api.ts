/**
 * Essence Poutline Soft Glide Lip Pencil — all shades.
 * Source: https://www.haar-shop.ch/en/76224541-1-poutline-soft-glide-lip-pencil.html
 * Usage: npx tsx scripts/add-essence-poutline-soft-glide-lip-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "56da5b82-c847-4e9b-9cea-cc901236189f";
const TERTIARY_ID = "54e393a9-90bf-41bb-beeb-c5364afce287";

const PRODUCT = {
  slug: "essence-poutline-soft-glide-lip-pencil",
  sku: "ESS-PSGLP-76224541",
  price: 3750,
  nameAr: "إيسنس - قلم تحديد شفاه بولاين سوفت جلايد",
  nameEn: "Essence - Poutline Soft Glide Lip Pencil",
  descriptionAr:
    "قلم تحديد شفاه بولاين سوفت جلايد من إيسنس — تحديد دقيق للشفاه بتركيبة كريمية ناعمة وتغطية كاملة مريحة.\n\n" +
    "• تغطية عالية لشفاه محددة بوضوح.\n• قوام كريمي ناعم ينزلق بسهولة على الشفاه.\n• قلم خشبي قابل للشحذ لرسم دقيق ومتحكم.\n• يُبرز محيط الشفاه لمظهر أكثر امتلاءً.\n• يُستخدم وحده أو مع أحمر الشفاه أو الملمع المفضل.\n• خالٍ من البارابين والعطور والكحول والغلوتين واللاكتوز.\n• نباتي ولم يُختبر على الحيوانات.\n• حدّدي محيط الشفاه ثم ضعي بلسم أو ملمع أو أحمر الشفاه. لإطلالة أكثر امتلاءً: املئي الشفاه بالكامل قبل وضع المنتج المفضل.",
  descriptionEn:
    "Essence Poutline Soft Glide Lip Pencil — enhances and defines the lip contour for a fuller-looking, flawlessly finished look.\n\n" +
    "• High coverage for boldly defined lips.\n• Smooth, creamy texture for gentle, comfortable application.\n• Sharpenable wooden pencil for precise shaping and control.\n• Perfect for contouring and shaping the lips.\n• Wear alone or pair with your favourite lipstick or gloss.\n• Vegan, paraben-free, fragrance-free, alcohol-free, gluten-free and lactose-free.\n• Cruelty-free.\n• Outline the lips for a defined look, then apply lip balm, gloss or lipstick. For a fuller effect, fill in the lips completely before applying your favourite product.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Like To Mauve It",
    colorHex: "#B25A45",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/e/8e4c4e7b4dacd020e8c2b119ebc12f704ed669ec_4059729585196_bi_essence_poutline_soft_glide_lip_pencil_01_like_to_mauve_it.jpg",
    position: 0,
  },
  {
    name: "02 Pinky Promise",
    colorHex: "#C87F89",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/7/37a1563a69b4f638ca2b13ff3855d8a1e950d252_4059729585202_bi_essence_poutline_soft_glide_lip_pencil_02_pinky_promise.jpg",
    position: 1,
  },
  {
    name: "03 Bare Affair",
    colorHex: "#804430",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/e/2eeb16ef856b4ce92ea159e5a929047c0c41d541_4059729585219_bi_essence_poutline_soft_glide_lip_pencil_03_bare_affair.jpg",
    position: 2,
  },
  {
    name: "04 Cocoa Me Crazy",
    colorHex: "#714530",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/5/6/566993a727f7336f8bbb5fe3dafa49d9ecafc432_4059729585226_bi_essence_poutline_soft_glide_lip_pencil_04_cocoa_me_crazy.jpg",
    position: 3,
  },
  {
    name: "05 Pout Out Loud",
    colorHex: "#D42B3C",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/b/6/b65f0859fd8e74ee9346813a875d0fde7a62284c_4059729585233_bi_essence_poutline_soft_glide_lip_pencil_05_pout_out_loud.jpg",
    position: 4,
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
  console.log(`  Category: المكياج → الشفاه → قلم تحديد الشفاه`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
