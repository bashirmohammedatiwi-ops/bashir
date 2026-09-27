/**
 * Mon Reve Luminess Concealer — Perfect coverage liquid concealer 10ml
 * 7 official shades with images + hex (NO shade barcodes).
 * Product barcode: 5201641750612 (shade 104 Peach)
 *
 * Sources:
 *   - monrevecosmetics.com/en/catalogue/luminess-concealer_49/
 *   - thomasparfums.gr / dna-pharmacy (shade names Light/Medium/Peach)
 * Hex sampled from official Mon Reve shade swatch photos (*-text.jpg).
 *
 * Usage: npx tsx scripts/add-mon-reve-luminess-concealer-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";

const OFF = "https://monrevecosmetics.com/media/images/products/2019/11";

const PRODUCT = {
  barcode: "5201641750612",
  slug: "mon-reve-luminess-concealer-perfect-coverage-10ml",
  sku: "MON-LUM-750612",
  price: 7500,
  originalPrice: 8500,
  nameAr: "مون ريف - كونسيلر Luminess تغطية مثالية للهالات والعيوب 10 مل",
  nameEn: "Mon Reve Luminess Concealer Perfect Coverage 10ml",
  descriptionAr:
    "كونسيلر Luminess من مون ريف — كونسيلر سائل خفيف بتغطية مثالية للهالات السوداء والعيوب، دون إبراز خطوط التعبير، مع ثبات طويل وترطيب طبيعي ولمسة مشرقة.\n\n" +
    "• يغطي الهالات والعيوب ويوحّد لون البشرة حول العينين.\n" +
    "• قوام خفيف يندمج فوراً ولا يثقل ولا يتشقّق في الخطوط الدقيقة.\n" +
    "• يحافظ على رطوبة البشرة ويمنح إشراقاً طبيعياً.\n" +
    "• تغطية قابلة للبناء حسب الحاجة.\n" +
    "• درجات طبيعية + درجات تصحيح لوني متخصصة.\n" +
    "• خالٍ من الغلوتين، غير مجرّب على الحيوانات، مختبر جلدياً.\n" +
    "• 10 مل.\n\n" +
    "نصيحة: لتصحيح اللون ضعيه قبل الفاونديشن؛ ولهالات عادية بعد الفاونديشن. ادمِجي بضربات لطيفة بأطراف الأصابع أو فرشاة أو إسفنجة.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 101 Light — فاتح طبيعي للبشرة الفاتحة\n" +
    "• 102 Medium — متوسط حنطي دافئ\n" +
    "• 103 Dark — غامق دافئ للبشرة الحنطية إلى السمراء\n" +
    "• 104 Peach — مشمشي مصحّح للهالات الداكنة جداً\n" +
    "• 105 Yellow — أصفر مصحّح للهالات البنفسجية الشديدة\n" +
    "• 106 Mint — أخضر نعناعي مصحّح للاحمرار وحبوب البشرة\n" +
    "• 107 White — أبيض لإضافة إشراق وإضاءة",
  descriptionEn:
    "Mon Reve Luminess Concealer — a light-textured liquid concealer for perfect coverage of dark circles and imperfections. Sets quickly, won’t accentuate expression lines, stays put for hours, and helps keep skin’s natural hydration with a unique radiance.\n\n" +
    "• Perfect coverage of dark circles and imperfections.\n" +
    "• Light formula that blends in fast without creasing fine lines.\n" +
    "• Maintains natural hydration and leaves a luminous finish.\n" +
    "• Buildable coverage.\n" +
    "• Matching skin shades plus specialised colour-correcting hues.\n" +
    "• Gluten-free, not tested on animals, dermatologically tested.\n" +
    "• 10ml.\n\n" +
    "Tip: For colour correction use before foundation; for regular dark circles after foundation. Pat a small amount with fingertips, brush or sponge until blended. Repeat to build coverage.\n\n" +
    "Available shades:\n" +
    "• 101 Light — natural light for fair skin\n" +
    "• 102 Medium — warm medium beige\n" +
    "• 103 Dark — warm deeper nude\n" +
    "• 104 Peach — peach corrector for very dark black circles\n" +
    "• 105 Yellow — yellow corrector for intense purple circles\n" +
    "• 106 Mint — mint green corrector for redness and acne\n" +
    "• 107 White — white for added luminosity",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/**
 * Shade names: 102 Medium & 104 Peach confirmed by retailers;
 * 105 Yellow / 106 Mint / 107 White from official colour-corrector guide + swatch colours;
 * 101 Light / 103 Dark from skin-tone depth of official swatches.
 * Hex from official *-text.jpg swatches.
 */
const SHADES: ShadeInput[] = [
  {
    name: "101 Light",
    colorHex: "#D7B8B0",
    imageUrl: `${OFF}/mon-reve-luminess01-text.jpg`,
    position: 0,
  },
  {
    name: "102 Medium",
    colorHex: "#D6AF9D",
    imageUrl: `${OFF}/mon-reve-luminess02-text.jpg`,
    position: 1,
  },
  {
    name: "103 Dark",
    colorHex: "#CB9C86",
    imageUrl: `${OFF}/mon-reve-luminess03-text.jpg`,
    position: 2,
  },
  {
    name: "104 Peach",
    colorHex: "#CE967D",
    imageUrl: `${OFF}/mon-reve-luminess04-text.jpg`,
    position: 3,
  },
  {
    name: "105 Yellow",
    colorHex: "#EADBBF",
    imageUrl: `${OFF}/mon-reve-luminess05-text.jpg`,
    position: 4,
  },
  {
    name: "106 Mint",
    colorHex: "#C9E5E8",
    imageUrl: `${OFF}/mon-reve-luminess06-text.jpg`,
    position: 5,
  },
  {
    name: "107 White",
    colorHex: "#CCCACF",
    imageUrl: `${OFF}/mon-reve-luminess07-text.jpg`,
    position: 6,
  },
];

const PRODUCT_IMAGES = [
  `${OFF}/mon-reve-luminess01.jpg`,
  `${OFF}/mon-reve-luminess04.jpg`,
  "https://monrevecosmetics.com/media/images/products/2025/04/luminess-2.jpg",
  "https://monrevecosmetics.com/media/images/products/2023/08/insta_037.jpg",
  "https://beautyfree.gr/40033-large_default/mon-reve-luminess-concealer-10ml.jpg",
  "https://beautyfree.gr/40034-large_default/mon-reve-luminess-concealer-10ml.jpg",
  "https://thomasparfums.gr/5748-large_default/mon-reve-luminess-concealer-104.jpg",
  `${OFF}/mon-reve-luminess02.jpg`,
  `${OFF}/mon-reve-luminess06.jpg`,
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

async function resolveBrandId(): Promise<string> {
  const search = await api<{ data?: Array<{ id: string; name?: string; nameEn?: string }> } | Array<{ id: string; name?: string; nameEn?: string }>>(
    `/brands?search=${encodeURIComponent("Mon Reve")}&limit=20`,
  );
  const rows = Array.isArray(search) ? search : (search.data ?? []);
  const exact = rows.find((b) => {
    const n = `${b.name ?? ""} ${b.nameEn ?? ""}`.toLowerCase();
    return n.includes("mon reve") || n.includes("mon rêve") || n.includes("مون ريف");
  });
  if (exact?.id) {
    console.log(`Brand: Mon Reve (${exact.id}) [exact search]\n`);
    return exact.id;
  }

  const created = await api<{ id: string }>("/brands", "POST", {
    name: "Mon Reve",
    nameAr: "مون ريف",
    nameEn: "Mon Reve",
  });
  console.log(`Brand: Mon Reve (${created.id}) [created]\n`);
  return created.id;
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

async function deleteByBarcode(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${barcode}`,
  );
  if (!check.exists || !check.product?.id) return false;
  await api(`/products/${check.product.id}`, "DELETE");
  console.log(`  deleted existing: ${check.product.nameAr ?? check.product.id}`);
  return true;
}

async function deleteOrphanSlug(slug: string) {
  const existing = await api<{ data?: Array<{ id: string; slug?: string }> } | Array<{ id: string; slug?: string }>>(
    `/products?search=${encodeURIComponent(slug)}&status=all&limit=10`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  for (const row of rows.filter((p) => p.slug === slug)) {
    await api(`/products/${row.id}`, "DELETE");
    console.log(`  deleted orphan slug: ${slug}`);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length} (no shade barcodes)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();

  if (await deleteByBarcode(PRODUCT.barcode)) {
    console.log("");
  }
  await deleteOrphanSlug(PRODUCT.slug);

  console.log("Uploading shade images...");
  const shades: Array<{
    name: string;
    colorHex: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    try {
      const id = await uploadImage(url, "product-gallery");
      galleryIds.push(id);
      console.log(`  ✓ gallery`);
    } catch (err) {
      console.log(`  ✗ gallery skip: ${(err as Error).message} (${url.split("/").pop()})`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  shades.sort((a, b) => a.position - b.position);
  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: CONCEALER,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [CONCEALER],
    nameAr: PRODUCT.nameAr,
    nameEn: PRODUCT.nameEn,
    descriptionAr: PRODUCT.descriptionAr,
    descriptionEn: PRODUCT.descriptionEn,
    price: PRODUCT.price,
    originalPrice: PRODUCT.originalPrice,
    stock: 0,
    isActive: true,
    imageIds,
    shades,
  });

  const verify = await api<{
    nameAr?: string;
    nameEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    shades?: Array<{ name: string; colorHex?: string; barcode?: string; imageId?: string }>;
  }>(`/products/${created.id}`);

  if (!verify.nameAr || !verify.nameEn || !verify.descriptionAr || !verify.descriptionEn) {
    throw new Error("Missing bilingual name/description after create");
  }

  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

  const noImg = (verify.shades ?? []).filter((s) => !s.imageId);
  if (noImg.length) throw new Error(`Shades missing images: ${noImg.map((s) => s.name).join(", ")}`);

  const noHex = (verify.shades ?? []).filter((s) => !s.colorHex);
  if (noHex.length) throw new Error(`Shades missing hex: ${noHex.map((s) => s.name).join(", ")}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}${s.barcode ? ` [barcode: ${s.barcode}]` : ""}`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Face → Concealer`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
