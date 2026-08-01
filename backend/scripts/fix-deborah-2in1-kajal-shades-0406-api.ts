/**
 * Fix Deborah 2-in-1 Kajal & Eyeliner Gel Pencil shades 04 + 06.
 * Wrong: 04 Aubergine / 06 Light Blue (2023 Italian line)
 * Correct: 04 Green / 06 Butter (old line, EAN 8009518223262 / 8009518223309)
 * Usage: npx tsx scripts/fix-deborah-2in1-kajal-shades-0406-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "a63c7341-f233-47db-bb4b-1ce8eb563192";

const BROCARD = "https://www.brocard.ua/media/catalog/product/8/0";

/** Correct shade data — names, hex sampled from brocard product images. */
const FIX_SHADES: Record<string, { name: string; colorHex: string; imageUrl: string }> = {
  "04 Aubergine": {
    name: "04 Green",
    colorHex: "#00463d",
    imageUrl: `${BROCARD}/8009518223262_1.jpg`,
  },
  "04 Green": {
    name: "04 Green",
    colorHex: "#00463d",
    imageUrl: `${BROCARD}/8009518223262_1.jpg`,
  },
  "06 Light Blue": {
    name: "06 Butter",
    colorHex: "#d0b090",
    imageUrl: `${BROCARD}/8009518223309_1.jpg`,
  },
  "06 Butter": {
    name: "06 Butter",
    colorHex: "#d0b090",
    imageUrl: `${BROCARD}/8009518223309_1.jpg`,
  },
};

const DESCRIPTION = {
  descriptionAr:
    "قلم كحل وجل آيلاينر 2-in-1 من ديبورا ميلانو — تركيبة جل كريمية غنية بالصبغة للعيون.\n\n" +
    "• يُستخدم كآيلاينر لرسم خط دقيق أو ككحل داخل خط الرموش.\n" +
    "• ثبات حتى 16 ساعة كآيلاينر و8 ساعات ككحل.\n" +
    "• مقاوم للماء ولا يتلف — يتحمل الحرارة العالية.\n" +
    "• قابل للشحذ بأي براية تجميل.\n" +
    "• 8 درجات: Black وGrey وBlue وGreen وBrown وButter وDeep Blue وLight Green.\n" +
    "• 1.4g.\n" +
    "• خاضع للاختبار الجلدي واختبار العيون.",
  descriptionEn:
    "Deborah Milano 2-in-1 Kajal & Eyeliner Gel Pencil — gel-effect creamy pencil with high-pigment colour for dramatic eye looks.\n\n" +
    "• Use as eyeliner for precise lines or as kajal inside the lash line.\n" +
    "• Up to 16 hours wear as eyeliner and 8 hours as kajal.\n" +
    "• Waterproof, transfer-proof and heat-resistant.\n" +
    "• Can be sharpened with any cosmetic sharpener.\n" +
    "• 8 shades: Black, Grey, Blue, Green, Brown, Butter, Deep Blue and Light Green.\n" +
    "• 1.4 g.\n" +
    "• Dermatologist and ophthalmologist tested.",
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
    if (attempt >= 3) throw err;
    await new Promise((r) => setTimeout(r, attempt * 800));
    return uploadImage(url, alt, attempt + 1);
  }
}

type Shade = {
  name: string;
  colorHex?: string;
  imageId?: string;
  position: number;
  stock?: number;
};

type Product = {
  nameEn?: string;
  imageIds?: string[];
  shades?: Shade[];
};

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Product: ${PRODUCT_ID}\n`);

  await login();
  console.log("Logged in.\n");

  const product = await api<Product>(`/products/${PRODUCT_ID}`);
  const existing = product.shades ?? [];

  console.log("Before:");
  existing.forEach((s) => console.log(`  ${s.name} → ${s.colorHex}`));

  const toFix = existing.filter((s) => FIX_SHADES[s.name]);
  if (!toFix.length) {
    const alreadyOk =
      existing.some((s) => s.name === "04 Green") && existing.some((s) => s.name === "06 Butter");
    if (alreadyOk) {
      console.log("\nShades 04 Green and 06 Butter already correct.");
      return;
    }
    throw new Error("Could not find shades 04 Aubergine / 06 Light Blue to fix");
  }

  console.log(`\nFixing: ${toFix.map((s) => s.name).join(", ")}\n`);

  const newImageIds: string[] = [];
  const imageIdByName = new Map<string, string>();

  for (const shade of toFix) {
    const fix = FIX_SHADES[shade.name]!;
    console.log(`Uploading ${fix.name}...`);
    const imageId = await uploadImage(fix.imageUrl, fix.name);
    imageIdByName.set(fix.name, imageId);
    newImageIds.push(imageId);
    console.log(`  ✓ ${fix.name} (${fix.colorHex})`);
    await new Promise((r) => setTimeout(r, 400));
  }

  const shades = existing.map((s) => {
    const fix = FIX_SHADES[s.name];
    if (!fix) {
      return {
        name: s.name,
        colorHex: s.colorHex,
        imageId: s.imageId,
        position: s.position,
        stock: s.stock ?? 0,
      };
    }
    return {
      name: fix.name,
      colorHex: fix.colorHex,
      imageId: imageIdByName.get(fix.name) ?? s.imageId,
      position: s.position,
      stock: s.stock ?? 0,
    };
  });

  shades.sort((a, b) => {
    const numA = parseInt(a.name.match(/^(\d+)/)?.[1] ?? String(a.position), 10);
    const numB = parseInt(b.name.match(/^(\d+)/)?.[1] ?? String(b.position), 10);
    return numA - numB;
  });

  const ordered = shades.map((s, i) => ({ ...s, position: i }));
  const imageIds = [...new Set([...(product.imageIds ?? []), ...newImageIds])];

  await api(`/products/${PRODUCT_ID}`, "PATCH", {
    shades: ordered,
    imageIds,
    ...DESCRIPTION,
  });

  console.log(`\n✓ Updated: ${product.nameEn ?? PRODUCT_ID}`);
  console.log("After:");
  ordered.forEach((s) => console.log(`  ${s.name} → ${s.colorHex}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
