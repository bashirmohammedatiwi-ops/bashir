/**
 * Add verified product + per-shade images for recently added GOSH products (no shade barcodes).
 * Source: goshcopenhagen.com CDN (scraped per shade page).
 * Usage: npx tsx scripts/fix-gosh-recent-shades-images-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CDN = "https://goshcopenhagen.com/cdn/shop/files";

type ShadeDef = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

type ProductDef = {
  barcode: string;
  label: string;
  shades: ShadeDef[];
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "5711914194376",
    label: "Matte Blush Up",
    shades: [
      {
        name: "001 Hot Pink",
        colorHex: "#e8727a",
        imageUrl: `${CDN}/blush_up_matte_hot_pink_001_ba9895bb-913e-46a9-b080-55e6b63c3f10.jpg`,
        position: 0,
      },
      { name: "002 Dusty Rose", colorHex: "#c8928d", imageUrl: `${CDN}/blush_up_matte_dusty_rose_002.jpg`, position: 1 },
      {
        name: "003 Cherry Berry",
        colorHex: "#b5545e",
        imageUrl: `${CDN}/blush_up_matte_cherry_berry_003.jpg`,
        position: 2,
      },
    ],
  },
  {
    barcode: "5711914088422",
    label: "Brow Sculpting Fibre Gel",
    shades: [
      {
        name: "001 Nutmeg",
        colorHex: "#9a7b5e",
        imageUrl: `${CDN}/5711914088255_64458465-7cd8-48f4-a34c-d9c2f46f69bb.jpg`,
        position: 0,
      },
      { name: "002 Chestnut", colorHex: "#6b4c3a", imageUrl: `${CDN}/5711914088422.jpg`, position: 1 },
    ],
  },
  {
    barcode: "5711914179526",
    label: "Soft'n Tinted Lip Balm",
    shades: [
      {
        name: "001 Nude",
        colorHex: "#d4a58c",
        imageUrl: `${CDN}/soft_n_tinted_001_1_6dfaebf1-b635-4adf-916d-9991780562d3.jpg`,
        position: 0,
      },
      { name: "002 Nougat", colorHex: "#b88878", imageUrl: `${CDN}/soft_n_tinted_002_1.jpg`, position: 1 },
      { name: "003 Rose", colorHex: "#d4838a", imageUrl: `${CDN}/soft_n_tinted_003_1.jpg`, position: 2 },
      { name: "004 Vintage Rose", colorHex: "#c27a7e", imageUrl: `${CDN}/soft_n_tinted_004_1.jpg`, position: 3 },
      { name: "005 Pink Rose", colorHex: "#d98a9a", imageUrl: `${CDN}/5711914188658.jpg`, position: 4 },
      { name: "006 Berry", colorHex: "#a04858", imageUrl: `${CDN}/5711914188702.jpg`, position: 5 },
      { name: "007 Pink Soft Ice", colorHex: "#e8a8b0", imageUrl: `${CDN}/5711914207342_6.jpg`, position: 6 },
      { name: "008 Cherry Soda", colorHex: "#b83848", imageUrl: `${CDN}/5711914207397_3.jpg`, position: 7 },
      { name: "009 Sunny Melon", colorHex: "#e8a070", imageUrl: `${CDN}/5711914207243_5.jpg`, position: 8 },
      { name: "010 Espresso Martini", colorHex: "#8a5048", imageUrl: `${CDN}/5711914207298.jpg`, position: 9 },
    ],
  },
  {
    barcode: "5711914184186",
    label: "Brow Lift Lamination Gel",
    shades: [
      { name: "001 Greybrown", colorHex: "#7a6858", imageUrl: `${CDN}/5711914184186.jpg`, position: 0 },
      { name: "002 Dark Brown", colorHex: "#4a3530", imageUrl: `${CDN}/5711914184261.jpg`, position: 1 },
      {
        name: "001 Transparent",
        colorHex: "#e8e0d8",
        imageUrl: `${CDN}/5711914175313_4_5f997033-76b3-40f9-9902-dd5f7c883890.jpg`,
        position: 2,
      },
    ],
  },
  {
    barcode: "5711914201173",
    label: "Juicy Lip Butter",
    shades: [
      {
        name: "001 Sparkling Champagne",
        colorHex: "#e8c8a8",
        imageUrl: `${CDN}/5711914201173_3df8ab23-312a-412a-92e8-0a8dfc83232a.jpg`,
        position: 0,
      },
      { name: "002 Sweet Treat", colorHex: "#d88898", imageUrl: `${CDN}/5711914201241.jpg`, position: 1 },
      { name: "003 Autumn Brown", colorHex: "#a87060", imageUrl: `${CDN}/5711914201272.jpg`, position: 2 },
      { name: "004 Burning Heart", colorHex: "#c83838", imageUrl: `${CDN}/5711914201326.jpg`, position: 3 },
    ],
  },
  {
    barcode: "5711914211837",
    label: "BB Stick",
    shades: [
      {
        name: "002 Sand",
        colorHex: "#e8c8a0",
        imageUrl: `${CDN}/5711914211806_1496417b-0231-4f14-acd4-dbff263d0681.jpg`,
        position: 0,
      },
      {
        name: "004 Beige",
        colorHex: "#d8b898",
        imageUrl: `${CDN}/5711914211837_4825c7c5-37c2-4994-a78b-ad57884108cd.jpg`,
        position: 1,
      },
      {
        name: "006 Warm Beige",
        colorHex: "#c8a880",
        imageUrl: `${CDN}/5711914211882_2ced88c5-299a-4f8d-82f1-ed3b261caa9e.jpg`,
        position: 2,
      },
    ],
  },
  {
    barcode: "5711914143459",
    label: "I'm Blushing",
    shades: [
      { name: "001 Flirt", colorHex: "#f0a898", imageUrl: `${CDN}/5711914143381.jpg`, position: 0 },
      { name: "002 Amour", colorHex: "#d88080", imageUrl: `${CDN}/5711914143459.jpg`, position: 1 },
      { name: "003 Passion", colorHex: "#c06870", imageUrl: `${CDN}/5711914143480.jpg`, position: 2 },
      { name: "004 Crush", colorHex: "#b87060", imageUrl: `${CDN}/5711914151614.jpg`, position: 3 },
      { name: "005 Shocking Pink", colorHex: "#e85888", imageUrl: `${CDN}/5711914193669.jpg`, position: 4 },
    ],
  },
  {
    barcode: "5711914179205",
    label: "Brow Pen",
    shades: [
      {
        name: "001 Brown",
        colorHex: "#7a5a3a",
        imageUrl: `${CDN}/brow_pen_001_brown_1_399c953d-6e59-46e2-b5d6-a7bb407eb673.jpg`,
        position: 0,
      },
      { name: "002 Greybrown", colorHex: "#7a6858", imageUrl: `${CDN}/brow_pen_002_grey_brown_1.jpg`, position: 1 },
      { name: "003 Dark Brown", colorHex: "#4a3530", imageUrl: `${CDN}/brow_pen_003_dark_brown_1.jpg`, position: 2 },
    ],
  },
  {
    barcode: "5711914121686",
    label: "Metal Eyes",
    shades: [
      {
        name: "001 Hematite",
        colorHex: "#3a3a40",
        imageUrl: `${CDN}/5711914121617_c327c594-7645-4282-b969-239be9ed1dbf.jpg`,
        position: 0,
      },
      { name: "002 Moonstone", colorHex: "#b89868", imageUrl: `${CDN}/5711914121686.jpg`, position: 1 },
      { name: "003 Tiger Eye", colorHex: "#8a5830", imageUrl: `${CDN}/5711914121716.jpg`, position: 2 },
      { name: "004 Silver Stone", colorHex: "#b0b0b8", imageUrl: `${CDN}/5711914121761.jpg`, position: 3 },
      { name: "005 Turquoise", colorHex: "#48a0a0", imageUrl: `${CDN}/5711914121815.jpg`, position: 4 },
    ],
  },
  {
    barcode: "5711914188047",
    label: "Blush Up",
    shades: [
      {
        name: "001 Peach",
        colorHex: "#f0b89a",
        imageUrl: `${CDN}/blush_peach_001_a137fa96-f570-47cb-a3bc-756f8c5248c0.jpg`,
        position: 0,
      },
      { name: "002 Rose", colorHex: "#d98a8e", imageUrl: `${CDN}/blush_up_rose_002.jpg`, position: 1 },
      { name: "003 Coral Red", colorHex: "#c9635e", imageUrl: `${CDN}/5711914200930.jpg`, position: 2 },
    ],
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
    if (attempt >= 3) throw err;
    await new Promise((r) => setTimeout(r, attempt * 800));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function resolveProductId(barcode: string): Promise<string> {
  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${barcode}`,
  );
  if (!check.exists || !check.product?.id) throw new Error(`Product not found for barcode ${barcode}`);
  return check.product.id;
}

async function fixProduct(def: ProductDef) {
  const productId = await resolveProductId(def.barcode);
  const product = await api<{ nameAr?: string; shades?: Array<{ name: string }> }>(`/products/${productId}`);
  console.log(`\n=== ${def.label} (${def.barcode}) ===`);
  console.log(`  ${product.nameAr}`);
  console.log(`  ID: ${productId}`);

  const existingNames = new Set((product.shades ?? []).map((s) => s.name));
  for (const shade of def.shades) {
    if (!existingNames.has(shade.name)) {
      console.warn(`  ⚠ shade not on product: ${shade.name}`);
    }
  }

  console.log("  Uploading shade images...");
  const uploaded = [];
  for (const shade of def.shades) {
    const imageId = await uploadImage(shade.imageUrl, `${def.label}-${shade.name}`);
    console.log(`    ✓ ${shade.name}`);
    uploaded.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
    });
    await new Promise((r) => setTimeout(r, 250));
  }

  uploaded.sort((a, b) => a.position - b.position);
  const imageIds = uploaded.map((s) => s.imageId);

  await api(`/products/${productId}`, "PATCH", { shades: uploaded, imageIds });

  const verify = await api<{ shades?: Array<{ name: string; imageId?: string }>; images?: unknown[] }>(
    `/products/${productId}`,
  );
  const withImages = verify.shades?.filter((s) => s.imageId).length ?? 0;
  console.log(`  ✓ Patched — ${withImages}/${def.shades.length} shades with images`);
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length}\n`);
  await login();
  console.log("Logged in.");

  for (const def of PRODUCTS) {
    await fixProduct(def);
  }

  console.log(`\n✓ Done — updated ${PRODUCTS.length} GOSH products with shade images`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
