/**
 * Essence What The Fake! Plumping Lipgloss — 4 separate shades.
 * Usage: npx tsx scripts/add-essence-what-the-fake-plumping-lipgloss-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";

const COMMON_AR =
  "• تأثير تكبير وتمهيد فوري لشفاه أوضح حجماً.\n" +
  "• تركيبة مغذّية بحمض الهيالورونيك وفيتامين E وفلفل سيتشوان.\n" +
  "• لمعة عالية غير لاصقة دون تجفيف الشفاه.\n" +
  "• قوام ينزلق بسهولة ويترك الشفاه ناعمة ومرطّبة.\n" +
  "• أداة تطبيق كبيرة ومنحنية لتوزيع متساوٍ ولمعة قصوى بلمسة واحدة.\n" +
  "• الحجم: ٤ مل.\n" +
  "• يُستخدم وحده أو فوق أحمر الشفاه لمزيد من الحجم واللمعة.\n" +
  "• لا يُستخدم على شفاه متشقّقة أو متهيّجة.";

const COMMON_EN =
  "• Instant plumping and smoothing effect for visibly fuller lips.\n" +
  "• Nourishing formula with hyaluronic acid, vitamin E and Sichuan pepper.\n" +
  "• High-shine, non-sticky finish without drying the lips.\n" +
  "• Effortlessly gliding texture for soft, cared-for lips.\n" +
  "• Extra-large rounded applicator for even coverage and maximum shine in one swipe.\n" +
  "• Size: 4 ml.\n" +
  "• Wear alone for a glossy finish or over lipstick for extra volume and shine.\n" +
  "• Do not use on cracked or irritated lips.";

type ProductInput = {
  barcode: string;
  slug: string;
  price: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
};

const PRODUCTS: ProductInput[] = [
  {
    barcode: "4059729585127",
    slug: "essence-what-the-fake-plumping-lipgloss-100-sheer-genius",
    price: 5250,
    nameAr: "إيسنس - ملمع شفاه وات ذا فايك لتكبير الشفاه رقم ١٠٠ شير جينيوس ٤ مل",
    nameEn: "Essence - What The Fake! Plumping Lipgloss 100 Sheer Genius 4 ml",
    descriptionAr:
      "ملمع شفاه وات ذا فايك لتكبير الشفاه من إيسنس بالدرجة الشفافة ١٠٠ شير جينيوس — لمعة عالية وشفاه تبدو أوضح حجماً بلون شفاف طبيعي.\n\n" +
      COMMON_AR,
    descriptionEn:
      "Essence What The Fake! Plumping Lipgloss 100 Sheer Genius — transparent shade with radiant high-shine finish for visibly fuller lips.\n\n" +
      COMMON_EN,
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/0/6/0679e555c7510b67d648e331abf30d59583653b8_4059729585127_bi_essence_what_the_fake_plumping_lipgloss_100_sheer_genius.jpg",
  },
  {
    barcode: "4059729585134",
    slug: "essence-what-the-fake-plumping-lipgloss-101-main-squeeze",
    price: 5250,
    nameAr: "إيسنس - ملمع شفاه وات ذا فايك لتكبير الشفاه رقم ١٠١ مين سكويز ٤ مل",
    nameEn: "Essence - What The Fake! Plumping Lipgloss 101 Main Squeeze 4 ml",
    descriptionAr:
      "ملمع شفاه وات ذا فايك لتكبير الشفاه من إيسنس بالدرجة الحمراء ١٠١ مين سكويز بلمسة وردية — لمعة عالية وشفاه تبدو أوضح حجماً بإطلالة جريئة ومشرقة.\n\n" +
      COMMON_AR,
    descriptionEn:
      "Essence What The Fake! Plumping Lipgloss 101 Main Squeeze — red shade with a pink undertone, radiant high-shine finish and visibly fuller lips.\n\n" +
      COMMON_EN,
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/9/4/948d448712ffdbebd63d2e485daad158dc967f19_4059729585134_bi_essence_what_the_fake_plumping_lipgloss_101_main_squeeze.jpg",
  },
  {
    barcode: "4059729585141",
    slug: "essence-what-the-fake-plumping-lipgloss-102-pink-about-it",
    price: 5250,
    nameAr: "إيسنس - ملمع شفاه وات ذا فايك لتكبير الشفاه رقم ١٠٢ بينك أباوت إت ٤ مل",
    nameEn: "Essence - What The Fake! Plumping Lipgloss 102 Pink About It 4 ml",
    descriptionAr:
      "ملمع شفاه وات ذا فايك لتكبير الشفاه من إيسنس بالدرجة الوردية ١٠٢ بينك أباوت إت — لمعة عالية وشفاه تبدو أوضح حجماً بلون وردي ناعم ومنعش.\n\n" +
      COMMON_AR,
    descriptionEn:
      "Essence What The Fake! Plumping Lipgloss 102 Pink About It — pink shade with radiant high-shine finish for visibly fuller, softly tinted lips.\n\n" +
      COMMON_EN,
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/2/6222be27bcfb6cc285f307b3d047c8fbe76f32a8_4059729585141_bi_essence_what_the_fake_plumping_lipgloss_102_pink_about_it.jpg",
  },
  {
    barcode: "4059729585158",
    slug: "essence-what-the-fake-plumping-lipgloss-103-bare-but-better",
    price: 5250,
    nameAr: "إيسنس - ملمع شفاه وات ذا فايك لتكبير الشفاه رقم ١٠٣ بير بات بيتر ٤ مل",
    nameEn: "Essence - What The Fake! Plumping Lipgloss 103 Bare But Better 4 ml",
    descriptionAr:
      "ملمع شفاه وات ذا فايك لتكبير الشفاه من إيسنس بالدرجة النود البنية ١٠٣ بير بات بيتر — لمعة عالية وشفاه تبدو أوضح حجماً بلون طبيعي يومي أنيق.\n\n" +
      COMMON_AR,
    descriptionEn:
      "Essence What The Fake! Plumping Lipgloss 103 Bare But Better — nude brown shade with radiant high-shine finish for visibly fuller, naturally enhanced lips.\n\n" +
      COMMON_EN,
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/9/4/948853a2c820bc6001a20c480c7d7e439af51c21_4059729585158_bi_essence_what_the_fake_plumping_lipgloss_103_bare_but_better.jpg",
  },
];

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = (await res.json()) as { data?: { accessToken?: string }; message?: string };
  if (!res.ok) throw new Error(json?.message ?? `Login failed HTTP ${res.status}`);
  token = json.data?.accessToken ?? "";
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
  console.log(`Products: ${PRODUCTS.length}\n`);
  await login();
  console.log("Logged in.\n");

  let added = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    const check = await api<{ exists: boolean; product?: { nameAr?: string; id?: string } }>(
      `/products/barcode-check?barcode=${p.barcode}`,
    );
    if (check.exists) {
      console.log(`skip ${p.barcode} — exists | ${check.product?.nameAr ?? "?"}`);
      skipped += 1;
      continue;
    }

    console.log(`Uploading image for ${p.barcode}...`);
    const imageId = await uploadImage(p.imageUrl, p.slug);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: p.barcode,
      barcode: p.barcode,
      slug: p.slug,
      brandId: BRAND_ID,
      categoryId: CATEGORY_ID,
      subcategoryId: LIPS,
      tertiaryCategoryId: LIP_GLOSS,
      subcategoryIds: [LIPS],
      tertiaryCategoryIds: [LIP_GLOSS],
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      price: p.price,
      originalPrice: p.price,
      stock: 0,
      isActive: true,
      imageIds: [imageId],
    });

    console.log(`✓ ${p.nameAr}`);
    console.log(`  ID: ${created.id} | ${p.barcode} | ${p.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`Done — added: ${added} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
