/**
 * Essence Extreme Shine Volume Lipgloss — all shades with images + color swatches.
 * Usage: API_BASE=https://deemaalhayat.com/api/v1 ADMIN_PASSWORD=000000 npx tsx scripts/add-essence-extreme-shine-lipgloss-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "56da5b82-c847-4e9b-9cea-cc901236189f";
const TERTIARY_ID = "6405a88e-402f-4508-8799-c8f3ad049c66";

const PRODUCT = {
  slug: "essence-extreme-shine-volume-lipgloss",
  sku: "ESS-ESVL-67463628",
  price: 6000,
  nameAr: "إيسنس - ملمع شفاه إكستريم شاين للحجم واللمعة",
  nameEn: "Essence - Extreme Shine Volume Lipgloss",
  descriptionAr:
    "ملمع شفاه إكستريم شاين للحجم واللمعة من إيسنس — الخيار المثالي لشفاه بلمعة ويت لوك مذهلة.\n\n" +
    "• تأثير تكبير فوري وحجم أقصى للشفاه.\n• ملمس غير لزج يغذّي الشفاه ويمنحها لمعاناً عالياً.\n• خالٍ من السيليكون والبلاستيك الدقيق والكحول والزيوت.\n• خالٍ من البارابين والأسيتون والغلوتين والمواد الحافظة.\n• نباتي ولم يُختبر على الحيوانات.\n• غطاء مصنوع من 90% بلاستيك معاد تدويره.\n• للون أكثر كثافة: حدّدي الشفاه بقلم تحديد ثم املئيها قبل وضع الملمع.",
  descriptionEn:
    "Essence Extreme Shine Volume Lipgloss — the must-have for stunning wet-look lips with maximum volume.\n\n" +
    "• Extreme plumping effect for visibly fuller lips.\n• Non-sticky texture nourishes lips with an ultra-glossy wet-look finish.\n• Free from silicones, microplastic particles, alcohol and oil.\n• Free from parabens, acetone, gluten and preservatives.\n• Vegan and cruelty-free.\n• Cap made from 90% recycled plastic.\n• For a more intense colour result, outline and fill lips with a lip liner first.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Crystal Clear",
    colorHex: "#F1F0F5",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/7/4/7491cc6502b2b18c04d8965bca178b8e99ced1bf_4059729302809_bi_essence_extreme_shine_volume_lipgloss_01_crystal_clear.jpg",
    position: 0,
  },
  {
    name: "02 Summer Punch",
    colorHex: "#FFBBD1",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/3/237cd3575b5a06077f05768bdb8f6176d87d8b0f_4059729302816_bi_essence_extreme_shine_volume_lipgloss_02_summer_punch.jpg",
    position: 1,
  },
  {
    name: "06 Candy Shop",
    colorHex: "#FF7D8E",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/0/8/08597030f6d628ed4296533e33df9463ebd1e873_4059729302854_bi_essence_extreme_shine_volume_lipgloss_06_candy_shop.jpg",
    position: 2,
  },
  {
    name: "08 Gold Dust",
    colorHex: "#FFD29A",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/8/88513f3cb907ab74d4502c090561265c3b12b20d_4059729302878_bi_essence_extreme_shine_volume_lipgloss_08_gold_dust.jpg",
    position: 3,
  },
  {
    name: "09 Shadow Rose",
    colorHex: "#ED8E81",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/a/6a16b27b37e9945173bbb1cd03be3c1318a1c3c1_4059729302885_bi_essence_extreme_shine_volume_lipgloss_09_shadow_rose.jpg",
    position: 4,
  },
  {
    name: "10 Sparkling Purple",
    colorHex: "#D59AD7",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/9/39a6b2fab2cd8fa5587eb4b345cd75b3f8523078_4059729407917_bi_essence_extreme_shine_volume_lipgloss_10_sparkling_purple.jpg",
    position: 5,
  },
  {
    name: "11 Power Of Nude",
    colorHex: "#D7947D",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/a/d/aded4518d9e6f8575068f525faa22ab0a37970ec_4059729407870_bi_essence_extreme_shine_volume_lipgloss_11_power_of_nude.jpg",
    position: 6,
  },
  {
    name: "12 Dazzling Apricot",
    colorHex: "#FF856D",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/0/4/04e87ceeff8627bd72ebf0c74c458a80a796faee_4059729466501_bi_essence_extreme_shine_volume_lipgloss_12_dazzling_apricot.jpg",
    position: 7,
  },
  {
    name: "13 Glazed Berry",
    colorHex: "#B73E5B",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/e/1/e1fad45afa140a61a67e700e20440665f997eb66_4059729491381_bi_essence_extreme_shine_volume_lipgloss_13_glazed_berry.jpg",
    position: 8,
  },
  {
    name: "14 Biscuit Bliss",
    colorHex: "#754533",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/4/5/4599c60203ebf73fa275302cc125c816273b31bd_4059729466525_bi_essence_extreme_shine_volume_lipgloss_14_biscuit_bliss.jpg",
    position: 9,
  },
  {
    name: "15 Rusty Kiss",
    colorHex: "#BA302B",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/e/4/e48931b5f2fcf30e780f2fadbee0b3dbb047f7af_4059729518781_bi_essence_extreme_shine_volume_lipgloss_15_rusty_kiss.jpg",
    position: 10,
  },
  {
    name: "16 Nude Sorbet",
    colorHex: "#DD6F60",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/9/397bfd20a28abfc99cea9d30d929470868af0ec0_4059729542991_bi_essence_extreme_shine_volume_lipgloss_16_nude_sorbet.jpg",
    position: 11,
  },
  {
    name: "17 Mocha Mingle",
    colorHex: "#A64B42",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/0/202d421d6c888353e7226108c185d825d968a424_4059729543004_bi_essence_extreme_shine_volume_lipgloss_17_mocha_mingle.jpg",
    position: 12,
  },
  {
    name: "18 Flaming Rose",
    colorHex: "#FA4A5B",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/7/87ffb4f89a6d8b5db23e7af606f8f3662b41a508_4059729547385_bi_essence_extreme_shine_volume_lipgloss_18_flamingo_rose.jpg",
    position: 13,
  },
  {
    name: "19 Frosted Fairy",
    colorHex: "#FDC4A5",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/f/b/fb22ae3bae51ac8f54c9c53a335faf67338a4248_4059729585080_bi_essence_extreme_shine_volume_lipgloss_19_frosted_fairy.jpg",
    position: 14,
  },
  {
    name: "20 Peach Please",
    colorHex: "#FF8C76",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/5/c54e1299c5ad175df3e17e1ca8d8a6a302edcef4_4059729585097_bi_essence_extreme_shine_volume_lipgloss_20_peach_please.jpg",
    position: 15,
  },
  {
    name: "21 Pretty in Pink",
    colorHex: "#FF4D72",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/f/cfc149e82433da7007e3c53e8143a8bcfedbf790_4059729584762_bi_essence_extreme_shine_volume_lipgloss_21_pretty_in_pink.jpg",
    position: 16,
  },
  {
    name: "101 Milky Way",
    colorHex: "#F2F2F2",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/9/7/970218c02b0d9c7b179b8af4c0c48a05ca3a523f_4059729302892_bi_essence_extreme_shine_volume_lipgloss_101_milky_way.jpg",
    position: 17,
  },
  {
    name: "102 Sweet Dreams",
    colorHex: "#EFB7C4",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/6/36b1935b4820f1dc383938ccbc73c6d40978ba76_4059729302908_bi_essence_extreme_shine_volume_lipgloss_102_sweet_dreams.jpg",
    position: 18,
  },
  {
    name: "103 Pretty In Pink",
    colorHex: "#FF4D72",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/b/4/b491ac6976b9305099e484b79e865d56d2e22a20_4059729302915_bi_essence_extreme_shine_volume_lipgloss_103_pretty_in_pink.jpg",
    position: 19,
  },
  {
    name: "105 Flower Blossom",
    colorHex: "#FFE4CE",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/9/69fa5c180929c661efdcd2db3119372f871b56c0_4059729302939_bi_essence_extreme_shine_volume_lipgloss_105_flower_blossom.jpg",
    position: 20,
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
      headers: {
        Accept: "image/*",
        "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)",
      },
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
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
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
      await new Promise((r) => setTimeout(r, 900));
    } catch (err) {
      console.log(`  ✗ ${shade.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (!shades.length) throw new Error("No shade images uploaded");

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const payload = {
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
  };

  const created = await api<{ id: string; name?: string }>("/products", "POST", payload);
  console.log(`\n✓ Created: ${created.name ?? PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
