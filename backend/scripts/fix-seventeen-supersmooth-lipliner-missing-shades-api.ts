/**
 * Add missing shades to Seventeen Super Smooth Waterproof Lip Liner.
 * Product: a8b6b562-d920-4f09-aa9c-e9639fc75864 / barcode 5201641689561
 * Keeps existing 13 official-chip shades; adds 14 retailer-line shades (NO shade barcodes).
 *
 * Sources for missing shades:
 * - myoras.com Shopify variants (names + EAN + pack PNGs)
 * - musejo.com (26 Pure Orange image)
 * Hex: sampled from shade barrel/tip on retailer pack photos
 *
 * Usage: npx tsx scripts/fix-seventeen-supersmooth-lipliner-missing-shades-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "a8b6b562-d920-4f09-aa9c-e9639fc75864";

const CDN = "https://cdn.shopify.com/s/files/1/0625/2537/4676/files";
const MUSE = "https://cdn.shopify.com/s/files/1/0718/3715/5633";

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  sortKey: number;
};

/** Missing shades — names from Muse Jo / Myoras; hex sampled from pack barrel/tip. */
const MISSING: ShadeInput[] = [
  {
    name: "20 Diva Plum",
    colorHex: "#522B59",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner20DivaPlum.png?v=1689583293`,
    sortKey: 20,
  },
  {
    name: "26 Pure Orange",
    colorHex: "#E07060",
    imageUrl: `${MUSE}/products/seventeen-supersmooth-waterproof-lipliner-26-pure-orangecopy.png?v=1756027600`,
    sortKey: 26,
  },
  {
    name: "30 Nude Peach",
    colorHex: "#B76B69",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner30NudePeach.png?v=1689583293`,
    sortKey: 30,
  },
  {
    name: "31 Cool Pink",
    colorHex: "#D68AA4",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner31CoolPink.png?v=1689583293`,
    sortKey: 31,
  },
  {
    name: "32 Fashion Pink",
    colorHex: "#D64181",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner32FashionPink.png?v=1689583293`,
    sortKey: 32,
  },
  {
    name: "33 Cool Grape",
    colorHex: "#945882",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner33CoolGrape.png?v=1689583293`,
    sortKey: 33,
  },
  {
    name: "34 Modern Mauve",
    colorHex: "#6F4E74",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner34ModernMauve.png?v=1689583293`,
    sortKey: 34,
  },
  {
    name: "35 Dark Signature",
    colorHex: "#592D38",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner35DarkSignature.png?v=1689583293`,
    sortKey: 35,
  },
  {
    name: "36 Super Nude",
    colorHex: "#8A4E58",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner36SuperNude.png?v=1689583293`,
    sortKey: 36,
  },
  {
    name: "37 Rose Gold",
    colorHex: "#DF8982",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner37RoseGold.png?v=1689583293`,
    sortKey: 37,
  },
  {
    name: "38 Purity",
    colorHex: "#714045",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner38Purity.png?v=1689583293`,
    sortKey: 38,
  },
  {
    name: "39 Dark Plum",
    colorHex: "#603441",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner39DarkPlum.png?v=1689583293`,
    sortKey: 39,
  },
  {
    name: "40 Dark Red",
    colorHex: "#632A3A",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner40DarkRed.png?v=1689583293`,
    sortKey: 40,
  },
  {
    name: "41 Strawberry Daiquiri",
    colorHex: "#9F5A79",
    imageUrl: `${CDN}/Seventeen-Supersmoothwaterprooflipliner41StrawberryDaiquiri.png?v=1689583293`,
    sortKey: 41,
  },
];

const DESCRIPTION_AR =
  "قلم شفاه Super Smooth Waterproof من سفنتين — ملمس كريمي فائق النعومة يحدّد الشفاه بدقة ويحمي أحمر الشفاه من التسيّب، بلون غني مقاوم للماء يدوم طوال اليوم. غني بفيتامين E وزيت الجوجوبا لترطيب ونعومة فورية تناسب الروتين اليومي في السوق العراقي.\n\n" +
  "• تطبيق ناعم وسلس بفضل التركيبة الغنية بفيتامين E وزيت الجوجوبا.\n" +
  "• نتيجة مكثّفة ثابتة ومقاومة للماء — بلا تلطيخ أو تسيّب حول الشفاه.\n" +
  "• يمكن تحديد المحيط أو ملء الشفاه بالكامل لمظهر أحمر شفاه أدوم.\n" +
  "• مضادات أكسدة طبيعية تساعد على حماية الشفاه من الخطوط الدقيقة.\n" +
  "• مختبر جلدياً — خالٍ من الغلوتين.\n" +
  "• 1.14 غ — 27 درجة من النود والخوخي والتوتي والأحمر والبرقوقي والموكا.\n\n" +
  "طريقة الاستخدام: ارسمي محيط الشفاه بالقلم، أو املئي الشفاه بالكامل لنتيجة أدوم وأكثر كثافة.\n\n" +
  "الدرجات المتوفرة:\n" +
  "• 01 Bare — نود بني دافئ عاري\n" +
  "• 02 Pink Tint — وردي خفيف ملوّن\n" +
  "• 03 Natural — طبيعي محمر\n" +
  "• 05 Peachy — خوخي دافئ\n" +
  "• 07 Light Cranberry — توت بري فاتح (درجة باركود المنتج)\n" +
  "• 08 Cranberry — توت بري كلاسيكي\n" +
  "• 09 Fuchsia — فوشيا جريء\n" +
  "• 10 Tomato — أحمر طماطم\n" +
  "• 12 Rosy Plum — برقوقي وردي\n" +
  "• 14 Pure Red — أحمر نقي\n" +
  "• 15 Blood Red — أحمر دموي عميق\n" +
  "• 20 Diva Plum — برقوقي ديفا غامق\n" +
  "• 26 Pure Orange — برتقالي مرجاني نقي\n" +
  "• 27 Red — أحمر ساطع\n" +
  "• 29 Mocha — موكا بني وردي\n" +
  "• 30 Nude Peach — نود خوخي\n" +
  "• 31 Cool Pink — وردي بارد\n" +
  "• 32 Fashion Pink — وردي موضة جريء\n" +
  "• 33 Cool Grape — عنبي بارد\n" +
  "• 34 Modern Mauve — مووف عصري\n" +
  "• 35 Dark Signature — توقيع غامق\n" +
  "• 36 Super Nude — سوبر نود\n" +
  "• 37 Rose Gold — ذهبي وردي\n" +
  "• 38 Purity — نقاء بني وردي\n" +
  "• 39 Dark Plum — برقوقي غامق\n" +
  "• 40 Dark Red — أحمر غامق\n" +
  "• 41 Strawberry Daiquiri — فراولة دايكيري";

const DESCRIPTION_EN =
  "Seventeen Super Smooth Waterproof Lip Liner — a creamy, ultra-smooth waterproof lip pencil that outlines lips precisely and locks lipstick in place. Enriched with Vitamin E and Jojoba Oil for effortless glide and comfort, with intense long-wear colour and natural antioxidants that help protect lips from fine lines.\n\n" +
  "• Smooth, easy application thanks to Vitamin E and Jojoba Oil.\n" +
  "• Intense, waterproof long-wear — resists smudging and feathering.\n" +
  "• Line the lip contour or fill the lips completely for even longer-lasting colour.\n" +
  "• Natural antioxidants help protect lips from fine lines.\n" +
  "• Dermatologically tested — gluten free.\n" +
  "• 1.14g — 27 shades from nudes and peach to cranberry, reds, plums and mocha.\n\n" +
  "How to use: Line your lips with the lip liner, or fill them in for an even longer-lasting result.\n\n" +
  "Available shades:\n" +
  "• 01 Bare — warm bare nude brown\n" +
  "• 02 Pink Tint — soft pink tint\n" +
  "• 03 Natural — natural rosy brown\n" +
  "• 05 Peachy — warm peachy nude\n" +
  "• 07 Light Cranberry — light cranberry (product barcode shade)\n" +
  "• 08 Cranberry — classic cranberry\n" +
  "• 09 Fuchsia — bold fuchsia\n" +
  "• 10 Tomato — tomato red\n" +
  "• 12 Rosy Plum — rosy plum\n" +
  "• 14 Pure Red — pure red\n" +
  "• 15 Blood Red — deep blood red\n" +
  "• 20 Diva Plum — deep diva plum\n" +
  "• 26 Pure Orange — pure coral orange\n" +
  "• 27 Red — vivid red\n" +
  "• 29 Mocha — mocha rosy brown\n" +
  "• 30 Nude Peach — nude peach\n" +
  "• 31 Cool Pink — cool pink\n" +
  "• 32 Fashion Pink — bold fashion pink\n" +
  "• 33 Cool Grape — cool grape\n" +
  "• 34 Modern Mauve — modern mauve\n" +
  "• 35 Dark Signature — dark signature\n" +
  "• 36 Super Nude — super nude\n" +
  "• 37 Rose Gold — rose gold\n" +
  "• 38 Purity — purity rosy brown\n" +
  "• 39 Dark Plum — dark plum\n" +
  "• 40 Dark Red — dark red\n" +
  "• 41 Strawberry Daiquiri — strawberry daiquiri";

function shadeSortKey(name: string): number {
  const m = name.match(/^(\d+)/);
  return m ? Number(m[1]) : 999;
}

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

    const contentType = (res.headers.get("content-type") || "image/png").split(";")[0].trim();
    const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
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

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Product: ${PRODUCT_ID}`);
  console.log(`Adding ${MISSING.length} missing shades\n`);
  await login();
  console.log("Logged in.\n");

  const product = await api<{
    nameAr?: string;
    nameEn?: string;
    images?: Array<{ id: string }>;
    shades?: Array<{
      id?: string;
      name: string;
      colorHex?: string;
      imageId?: string;
      position?: number;
      stock?: number;
      barcode?: string | null;
    }>;
  }>(`/products/${PRODUCT_ID}`);

  console.log(`Current shades: ${product.shades?.length ?? 0}`);
  const existingNames = new Set((product.shades ?? []).map((s) => s.name));

  const toAdd = MISSING.filter((s) => !existingNames.has(s.name));
  console.log(`New shades to upload: ${toAdd.length}`);
  if (toAdd.length === 0) {
    console.log("Nothing to add.");
    return;
  }

  console.log("\nUploading missing shade images...");
  const uploadedNew = [];
  for (const shade of toAdd) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
    uploadedNew.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      sortKey: shade.sortKey,
      stock: 0,
    });
    await new Promise((r) => setTimeout(r, 250));
  }

  const kept = (product.shades ?? []).map((s) => ({
    name: s.name,
    colorHex: s.colorHex ?? "#000000",
    imageId: s.imageId,
    sortKey: shadeSortKey(s.name),
    stock: s.stock ?? 0,
  }));

  const all = [...kept, ...uploadedNew].sort((a, b) => a.sortKey - b.sortKey);
  const shades = all.map((s, i) => ({
    name: s.name,
    colorHex: s.colorHex,
    imageId: s.imageId,
    position: i,
    stock: s.stock,
  }));

  const existingImageIds = (product.images ?? []).map((im) => im.id);
  const newImageIds = uploadedNew.map((s) => s.imageId);
  const imageIds = [...existingImageIds];
  for (const id of newImageIds) {
    if (!imageIds.includes(id)) imageIds.push(id);
  }

  console.log(`\nPATCH shades: ${shades.length} total...`);
  await api(`/products/${PRODUCT_ID}`, "PATCH", {
    shades,
    imageIds,
    descriptionAr: DESCRIPTION_AR,
    descriptionEn: DESCRIPTION_EN,
  });

  const verify = await api<{
    shades?: Array<{ name: string; colorHex?: string; barcode?: string | null }>;
    images?: unknown[];
  }>(`/products/${PRODUCT_ID}`);

  console.log(`\n✓ Updated ${product.nameAr}`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  console.log(`  Gallery images: ${verify.images?.length ?? imageIds.length}`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} | ${s.colorHex ?? "?"} | barcode: ${s.barcode ?? "none"}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
