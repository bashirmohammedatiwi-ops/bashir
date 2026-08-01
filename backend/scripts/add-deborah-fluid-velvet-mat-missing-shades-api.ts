/**
 * Add missing Deborah Fluid Velvet Mat shades 14, 15, 16, 20.
 * Usage: npx tsx scripts/add-deborah-fluid-velvet-mat-missing-shades-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "a1a5557b-d628-46b0-b4be-9f98ae1b80e7";
const IMG = "https://www.deborahmilano.com/en/wp-content/uploads/2021/01";

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const NEW_SHADES: ShadeInput[] = [
  {
    name: "14 Dark Red",
    colorHex: "#8b1420",
    imageUrl: `${IMG}/008494-Fluid-Velvet-Mat-Lipstick-600x600.jpg`,
    position: 13,
  },
  {
    name: "15 Mauve",
    colorHex: "#a06678",
    imageUrl: `${IMG}/008495-Fluid-Velvet-Mat-Lipstick-600x600.jpg`,
    position: 14,
  },
  {
    name: "16 Brick",
    colorHex: "#a0522d",
    imageUrl: `${IMG}/008496-Fluid-Velvet-Mat-Lipstick-600x600.jpg`,
    position: 15,
  },
  {
    name: "20 Fuchsia",
    colorHex: "#c02070",
    imageUrl: "https://us-i.makeupstore.com/i/ix/ix19zissjlug.jpg",
    position: 19,
  },
];

const DESCRIPTION = {
  descriptionAr:
    "فيلفيت مات من ديبورا ميلانو — أحمر شفاه سائل عالي الأداء يمنح لوناً غنياً بلمسة مطفية مخملية، مع راحة فائقة وثبات يدوم طوال اليوم.\n\n" +
    "• تركيبة سائلة مطفية فائقة النعومة، بلون نقي ومتجانس.\n" +
    "• مقاوم للانتقال والتلطّخ — ثبات يصل إلى 18 ساعة.\n" +
    "• أداة تطبيق مخملية خاصة توزّع اللون وتحدّد محيط الشفاه بدقة.\n" +
    "• بوليمرات تشكّل طبقة خفيفة ملتصقة؛ صبغات مصغّرة تمنح لوناً كثيفاً موحّداً.\n" +
    "• زيوت مغذّية تُبقي الشفاه مرطبة وناعمة ومخملية.\n" +
    "• 20 درجة متنوعة: من النود الطبيعي إلى الأحمر الجريء والخمري.\n" +
    "• خالي من البارابين — حجم 4.5 غ.\n" +
    "• مناسب للبشرة الحساسة — خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano Fluid Velvet Mat Liquid Lipstick — a high-performance liquid matte lipstick that delivers rich colour with a sophisticated velvet-matte finish and exceptional comfort.\n\n" +
    "• Supremely soft liquid matte formula with pure, even colour payoff.\n" +
    "• Transfer-proof, smudge-resistant wear tested up to 18 hours.\n" +
    "• Special flocked applicator colours and defines lips precisely in one swipe.\n" +
    "• Film-forming polymers create a lightweight adherent layer; micronized pigments deliver intense, homogeneous colour.\n" +
    "• Nourishing oils keep lips hydrated, soft and velvety.\n" +
    "• 20 shades from natural nudes to bold reds and wine tones.\n" +
    "• Paraben-free — 4.5 g — hypoallergenic.\n" +
    "• Dermatologist tested.",
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
    console.log("Shades 14, 15, 16, 20 already exist — nothing to add.");
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
    console.log(`  ✓ ${shade.name}`);
    await new Promise((r) => setTimeout(r, 700));
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

  console.log(`\n✓ Updated: ${product.nameEn ?? PRODUCT_ID}`);
  console.log(`  Total shades: ${shades.length}`);
  console.log(`  Added: ${uploaded.length}`);
  shades.forEach((s) => console.log(`    ${String(s.position + 1).padStart(2, "0")}. ${s.name}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
