/**
 * Essence Juicy Bomb Shiny Lipgloss — all shades.
 * Source: https://www.haar-shop.ch/en/67463663-1-shiny-lipgloss.html
 * Usage: npx tsx scripts/add-essence-juicy-bomb-shiny-lipgloss-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "56da5b82-c847-4e9b-9cea-cc901236189f";
const TERTIARY_ID = "6405a88e-402f-4508-8799-c8f3ad049c66";

const PRODUCT = {
  slug: "essence-juicy-bomb-shiny-lipgloss",
  sku: "ESS-JBSL-67463663",
  price: 4000,
  nameAr: "إيسنس - ملمع شفاه جوزي بوم شايني",
  nameEn: "Essence - Juicy Bomb Shiny Lipgloss",
  descriptionAr:
    "ملمع شفاه جوزي بوم شايني من إيسنس — لمعة فائقة ورائحة فاكهية منعشة لشفاه لامعة وجذابة دون لزوجة.\n\n" +
    "• لمعة فائقة ولمسة لامعة برائحة فاكهية.\n• قوام غير لاصق مريح طوال اليوم.\n• تطبيق سهل بفضل رأس الأداة المائلة.\n• مظهر لامع ومشرق ومنعش.\n• تركيبة كلين بيوتي صديقة للبيئة.\n• أنبوب وغطاء من مادة PE قابلة لإعادة التدوير بنسبة ٩٠٪ على الأقل.\n• خالٍ من البارابين والغلوتين.\n• نباتي ولم يُختبر على الحيوانات.\n• للون أوضح: حدّدي الشفاه بقلم تحديد ثم ضعي الملمع.",
  descriptionEn:
    "Essence Juicy Bomb Shiny Lipgloss — ultra-glossy, super-fruity lip gloss for beautifully shiny lips without stickiness.\n\n" +
    "• Ultra-glossy, shiny finish with a fruity scent.\n• Non-sticky texture for comfortable wear.\n• Easy application thanks to the angled applicator tip.\n• Shiny, shimmering, radiantly fresh look.\n• Clean beauty formulation.\n• Tube and cap made from at least 90% recyclable mono-material PE.\n• Vegan, paraben-free and gluten-free.\n• Cruelty-free.\n• For a more intense colour result, outline and fill lips with a lip liner first.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "101 Lovely Litchi",
    colorHex: "#F0F0F0",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/9/29d01caff2129e5250b367f4cd158d085bf1731b_4059729394606_bi_essence_juicy_bomb_shiny_lipgloss_101_lovely_litchi.jpg",
    position: 0,
  },
  {
    name: "102 Witty Watermelon",
    colorHex: "#FF94C5",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/9/3/9397951967619b011cecd8d8246148ef50a9cc8b_4059729394590_bi_essence_juicy_bomb_shiny_lipgloss_102_witty_watermelon.jpg",
    position: 1,
  },
  {
    name: "103 Proud Papaya",
    colorHex: "#FAACA7",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/0/202c865f7b0db0fd2e290bab5315d2482327a1ae_4059729394583_bi_essence_juicy_bomb_shiny_lipgloss_103_proud_papaya.jpg",
    position: 2,
  },
  {
    name: "104 Poppin' Pomegranate",
    colorHex: "#D83A71",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/e/7/e7f755adf300112ecf38fe654d17ab76c7a8775f_4059729395177_bi_essence_juicy_bomb_shiny_lipgloss_104_poppin_pomegranate.jpg",
    position: 3,
  },
  {
    name: "105 Bouncy Bubblegum",
    colorHex: "#CD81AF",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/1/3160f153a7c6f2522b95db14e9983f7dc85c46b5_4059729395184_bi_essence_juicy_bomb_shiny_lipgloss_105_bouncy_bubblegum.jpg",
    position: 4,
  },
  {
    name: "106 Mellow Mango",
    colorHex: "#F9ED72",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/5/8/587eb9a40cdd934066f18f8d68a99567f1259bf0_4059729491398_bi_essence_juicy_bomb_shiny_lipgloss_106_mellow_mango.jpg",
    position: 5,
  },
  {
    name: "107 Glowy Gummy",
    colorHex: "#9ADBA8",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/b/3b6f079136d5d0e902e52652eeeb071f47d4bc76_4059729491626_bi_essence_juicy_bomb_shiny_lipgloss_107_glowy_gummy.jpg",
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
  console.log(`  Category: المكياج → الشفاه → ملمع الشفاه`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
