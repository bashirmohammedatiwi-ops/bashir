/**
 * Add missing Grigi Only Matte Long Stay Power shades: 07, 10, 12, 19, 28, 46, 49, 50.
 * Usage: npx tsx scripts/add-grigi-only-matte-long-stay-missing-shades-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "c82948b9-b193-4a4b-bfe6-8d8e895cfa36";
const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from grigi.gr / official retailers; hex from swatch images. */
const NEW_SHADES: ShadeInput[] = [
  { name: "07 Bordeaux", colorHex: "#9a4e62", imageUrl: `${IMG}/G/O/GOMLSPLL-07NP_3.jpeg`, position: 6 },
  { name: "10 Fuchsia Purple", colorHex: "#bc4677", imageUrl: `${IMG}/G/O/GOMLSPLL-10NP_3.jpeg`, position: 7 },
  { name: "12 Coral Cinnamon", colorHex: "#c1504f", imageUrl: `${IMG}/g/o/gomlspll-12np.jpg`, position: 8 },
  { name: "19 Dark Nude Purple", colorHex: "#926168", imageUrl: `${IMG}/G/O/GOMLSPLL-19NP_3.jpeg`, position: 12 },
  { name: "28 Nude Pink Bright", colorHex: "#946369", imageUrl: `${IMG}/g/o/gomlspll-28np.jpg`, position: 15 },
  {
    name: "46 Dark Pink Mauve",
    colorHex: "#94515b",
    imageUrl: "http://laxmi.gr/wp-content/uploads/2022/09/GOMLSPLL-46NP.jpg",
    position: 23,
  },
  { name: "49 Red Watermelon Intense", colorHex: "#b55864", imageUrl: `${IMG}/g/o/gomlspll-49np.jpg`, position: 24 },
  { name: "50 Light Cherry", colorHex: "#992d4c", imageUrl: `${IMG}/g/o/gomlspll-50np.jpg`, position: 25 },
];

const DESCRIPTION = {
  descriptionAr:
    "روج شفاه سائل مطفي طويل الثبات Only Matte Long Stay Power من غريغي — تركيبة غنية بلون كامل وتغطية مطفية أنيقة.\n\n" +
    "• لون غني ثابت طوال اليوم مع تأثير مطفي ناعم.\n" +
    "• قوام مخملي ينزلق بسلاسة على الشفاه دون تشقق.\n" +
    "• مُعزّز بفيتامين E لترطيب وتجديد الشفاه.\n" +
    "• 33 درجة تبدأ من 01: أحمر، نود، مرجاني، كرزي، بنفسجي والمزيد.\n" +
    "• طبّقي من منتصف الشفة العليا نحو الزوايا ثم كرّري على الشفة السفلى.\n" +
    "• للحواف الدقيقة، حدّدي الشفاه بقلم من نفس الدرجة.\n" +
    "• صنع في اليونان.",
  descriptionEn:
    "Grigi Only Matte Long Stay Power Liquid Lipstick — rich formula with full coverage and an elegant matte finish.\n\n" +
    "• Rich long-wearing colour with a soft matte effect.\n" +
    "• Velvety texture glides on smoothly without cracking.\n" +
    "• Enriched with vitamin E to moisturise and regenerate lips.\n" +
    "• 33 shades from 01: red, nude, coral, cherry, purple and more.\n" +
    "• Apply from the centre of the upper lip outward, then repeat on the lower lip.\n" +
    "• For defined edges, line lips with a matching lip pencil.\n" +
    "• Made in Greece.",
};

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

type ExistingShade = {
  id?: string;
  name: string;
  colorHex?: string;
  imageId?: string;
  position: number;
  stock?: number;
  barcode?: string;
};

type Product = {
  id: string;
  nameEn?: string;
  imageIds?: string[];
  shades?: ExistingShade[];
};

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Product: ${PRODUCT_ID}`);
  console.log(`New shades: ${NEW_SHADES.length}\n`);

  await login();
  console.log("Logged in.\n");

  const product = await api<Product>(`/products/${PRODUCT_ID}`);
  const existingShades = product.shades ?? [];
  const existingNames = new Set(existingShades.map((s) => normalizeName(s.name)));

  const toAdd = NEW_SHADES.filter((s) => !existingNames.has(normalizeName(s.name)));
  if (!toAdd.length) {
    console.log("All requested shades already exist — nothing to add.");
    return;
  }

  console.log(`Adding: ${toAdd.map((s) => s.name).join(", ")}\n`);
  console.log("Uploading shade images...");

  const uploaded: Array<{
    name: string;
    colorHex: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of toAdd) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    uploaded.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} — ${shade.colorHex}`);
    await new Promise((r) => setTimeout(r, 500));
  }

  const merged = [...existingShades, ...uploaded];
  merged.sort((a, b) => {
    const numA = parseInt(a.name.match(/^(\d+)/)?.[1] ?? String(a.position), 10);
    const numB = parseInt(b.name.match(/^(\d+)/)?.[1] ?? String(b.position), 10);
    return numA - numB;
  });

  const shades = merged.map((s, i) => ({
    name: s.name,
    colorHex: s.colorHex,
    imageId: s.imageId,
    position: i,
    stock: s.stock ?? 0,
  }));

  const imageIds = [...new Set([...(product.imageIds ?? []), ...uploaded.map((s) => s.imageId)])];

  await api(`/products/${PRODUCT_ID}`, "PATCH", {
    shades,
    imageIds,
    ...DESCRIPTION,
  });

  const verify = await api<{ shades?: ExistingShade[] }>(`/products/${PRODUCT_ID}`);
  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

  console.log(`\n✓ Updated: ${product.nameEn ?? PRODUCT_ID}`);
  console.log(`  Total shades: ${verify.shades?.length ?? shades.length}`);
  console.log(`  Added: ${uploaded.length}`);
  (verify.shades ?? shades).forEach((s, i) => console.log(`    ${String(i + 1).padStart(2, "0")}. ${s.name}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
