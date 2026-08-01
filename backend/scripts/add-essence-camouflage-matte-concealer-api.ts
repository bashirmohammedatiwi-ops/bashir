/**
 * Essence Camouflage+ Matte Concealer — all shades with images + color swatches.
 * Source: https://www.haar-shop.ch/en/67470334-1-camouflage-matte-concealer.html
 * Usage: npx tsx scripts/add-essence-camouflage-matte-concealer-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "2bbecee1-084d-446c-b4fd-65f769130de9";
const TERTIARY_ID = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";

const PRODUCT = {
  slug: "essence-camouflage-matte-concealer",
  sku: "ESS-CMC-67470334",
  price: 5250,
  nameAr: "إيسنس - كونسيلر كاموفلاج بلس مطفي",
  nameEn: "Essence - Camouflage+ Matte Concealer",
  descriptionAr:
    "كونسيلر كاموفلاج بلس مطفي من إيسنس — تغطية كاملة مقاومة للماء بلمسة مطفية طبيعية لبشرة متساوية وناعمة.\n\n" +
    "• تغطية كاملة بلمسة مطفية طبيعية.\n• قوام سائل خفيف يندمج بسهولة.\n• مقاوم للماء لثبات طويل.\n• يُخفّي الهالات والعيوب والاحمرار.\n• خالٍ من البارابين والزيوت والغلوتين واللاكتوز.\n• نباتي.\n• يُطبّق تحت العين أو على العيوب ويُوزّع بالأصابع أو الفرشاة أو الإسفنجة.",
  descriptionEn:
    "Essence Camouflage+ Matte Concealer — waterproof full coverage for a smooth, even complexion with an intense matte finish.\n\n" +
    "• Full coverage with a naturally matte effect.\n• Light and liquid texture that blends effortlessly.\n• Waterproof for long-lasting wear.\n• Conceals dark circles, blemishes and redness.\n• Vegan, paraben-free, oil-free, gluten-free and lactose-free.\n• Apply under the eyes or on imperfections and blend with fingers, a brush or sponge.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "20",
    colorHex: "#F7C09A",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/a/0/a0b0529a5aeab91060b72e6c4bb9c0af1d8059a0_4059729517982_bi_essence_camouflage_matte_concealer_20.jpg",
    position: 0,
  },
  {
    name: "50",
    colorHex: "#D8A072",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/f/f/ff1f80ee0821804eda9e7a408ba0f1ae70cab2b4_4059729518187_bi_essence_camouflage_matte_concealer_50.jpg",
    position: 1,
  },
  {
    name: "70",
    colorHex: "#B77642",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/0/d/0d4b3a44b643489ed8929c543a81f0ffb3c77f9c_4059729518163_bi_essence_camouflage_matte_concealer_70.jpg",
    position: 2,
  },
  {
    name: "80",
    colorHex: "#CCAE9F",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/d/3dae4353ecf7a91ca59ff17a39f0a8ffcf8126af_4059729518286_bi_essence_camouflage_matte_concealer_80.jpg",
    position: 3,
  },
  {
    name: "90",
    colorHex: "#D0A791",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/3/2391aeea23176565431eb13870696f47e5778ddd_4059729518200_bi_essence_camouflage_matte_concealer_90.jpg",
    position: 4,
  },
  {
    name: "100",
    colorHex: "#CFAE99",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/e/c/ec3ef16d296dd9a558a8877fca7d8277f7399c1f_4059729518224_bi_essence_camouflage_matte_concealer_100.jpg",
    position: 5,
  },
  {
    name: "120",
    colorHex: "#CAA38B",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/0/b/0bcc15e78945010adcfc72850478ebe59f86d8a7_4059729518248_bi_essence_camouflage_matte_concealer_120.jpg",
    position: 6,
  },
  {
    name: "130",
    colorHex: "#BC937E",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/e/2/e2769bfab82e654f94567d9628c13c7fe4ad6bb1_4059729518262_bi_essence_camouflage_matte_concealer_130.jpg",
    position: 7,
  },
  {
    name: "150",
    colorHex: "#D1A18B",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/6/86b44b7b729e3b3139872329e2efc5f076d23099_4059729518309_bi_essence_camouflage_matte_concealer_150.jpg",
    position: 8,
  },
  {
    name: "160",
    colorHex: "#CDA48F",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/4/34a6d08bd40bd749036636eb073530fd87150a37_4059729518323_bi_essence_camouflage_matte_concealer_160.jpg",
    position: 9,
  },
  {
    name: "170",
    colorHex: "#C19176",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/d/e/de4c4f7985928a0021f0bd1ee8aa5efbb123b31e_4059729518347_bi_essence_camouflage_matte_concealer_170.png",
    position: 10,
  },
  {
    name: "180",
    colorHex: "#B5866A",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/b/f/bf4e634ecd34eb66476048a79a716d474924cf5c_4059729518002_bi_essence_camouflage_matte_concealer_180.jpg",
    position: 11,
  },
  {
    name: "190",
    colorHex: "#B38266",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/e/7/e7b6187ef7bd4e5f062f49eb6bc430425acccdca_4059729518361_bi_essence_camouflage_matte_concealer_190.png",
    position: 12,
  },
  {
    name: "200",
    colorHex: "#946C5C",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/f/8f89f30031ced21edfd67d0f43874ef7890bc0bf_4059729518026_bi_essence_camouflage_matte_concealer_200.jpg",
    position: 13,
  },
  {
    name: "210",
    colorHex: "#8F654B",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/5/d/5d5c8e931c6230764857233f9295c53d411cb20f_4059729518040_bi_essence_camouflage_matte_concealer_210.jpg",
    position: 14,
  },
  {
    name: "230",
    colorHex: "#95694E",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/9/39a699db558852907540e5e9a5dcf239f05e564a_4059729518064_bi_essence_camouflage_matte_concealer_230.jpg",
    position: 15,
  },
  {
    name: "240",
    colorHex: "#865541",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/3/23534561eab9c81b3d696c8b95136e30f67740c0_4059729518088_bi_essence_camouflage_matte_concealer_240.jpg",
    position: 16,
  },
  {
    name: "280",
    colorHex: "#5F4237",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/a/ca587495d70e10816d495f284d134bb367c9f934_4059729518101_bi_essence_camouflage_matte_concealer_280.jpg",
    position: 17,
  },
  {
    name: "310",
    colorHex: "#5B3625",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/e/6/e6562d1e70a4e8622d5387a5d2823611d1d2e0b2_4059729518125_bi_essence_camouflage_matte_concealer_310.jpg",
    position: 18,
  },
  {
    name: "340",
    colorHex: "#54301E",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/b/e/beda1a9e13f3bc69cb8b992bc507687d8cc0c4e5_4059729518149_bi_essence_camouflage_matte_concealer_340.jpg",
    position: 19,
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
      const imageId = await uploadImage(shade.imageUrl, `shade-${shade.name}`);
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
