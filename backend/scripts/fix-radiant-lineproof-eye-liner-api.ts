/**
 * Fix Lineproof Eye Liner shade barcodes + verify images.
 * Verified: epharmadora.com, rouge.com.gr, ofarmakopoiosmou.gr
 * Usage: npx tsx scripts/fix-radiant-lineproof-eye-liner-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_SLUG = "radiant-professional-lineproof-eye-liner";
const IMG_BASE = "https://radiant-professional.com/media/images/products";
const IMG_BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

/** Correct barcode + image per shade (radiant site had rotated barcodes/images). */
const CORRECT: Record<
  string,
  { barcode: string; colorHex: string; imageUrl: string }
> = {
  "01 Black": {
    barcode: "5201641747155",
    colorHex: "#000000",
    imageUrl: `${IMG_BASE}/2025/10/lineproof-eyeliner-black.webp`,
  },
  "05 Blue": {
    barcode: "5201641021835",
    colorHex: "#355c94",
    imageUrl: `${IMG_BASE}/2023/10/radiant_lineproof_eye_liner_05__blue_2_aIJhLO7.jpg`,
  },
  "06 Chocolate": {
    barcode: "5201641021842",
    colorHex: "#6c4835",
    imageUrl: `${IMG_BASE}/2023/10/radiant_lineproof_eye_liner_06__chocolate_2_AZVceeT.jpg`,
  },
  "07 Sky Blue": {
    barcode: "5201641021866",
    colorHex: "#70b1e9",
    imageUrl: `${IMG_BASE}/2024/03/radiant_lineproof_eye_liner_07_sky_blue_2_YXQ4Z4a.jpg`,
  },
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

function normalizeName(name: string) {
  return name.trim().replace(/^(\d)\s/, "0$1 ");
}

async function main() {
  await login();
  console.log("Logged in.\n");

  const list = await api<{ data?: Array<{ id: string; slug?: string }> } | Array<{ id: string; slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT_SLUG)}&status=all&limit=5`,
  );
  const rows = Array.isArray(list) ? list : (list.data ?? []);
  const product = rows.find((p) => p.slug === PRODUCT_SLUG);
  if (!product?.id) throw new Error(`Product not found: ${PRODUCT_SLUG}`);

  const full = await api<{
    id: string;
    nameEn?: string;
    imageIds?: string[];
    shades?: Array<{
      name: string;
      barcode?: string | null;
      colorHex: string;
      imageId?: string;
      position: number;
      stock?: number;
    }>;
  }>(`/products/${product.id}`);

  console.log(`Product: ${full.nameEn}\n`);

  const sorted = [...(full.shades ?? [])].sort((a, b) => a.position - b.position);
  const imageIdByBarcode = new Map<string, string>();

  for (const s of sorted) {
    const key = normalizeName(s.name);
    const correct = CORRECT[key] ?? CORRECT[s.name];
    if (!correct) {
      console.log(`? Unknown shade: ${s.name}`);
      continue;
    }

    const barcodeChanged = s.barcode !== correct.barcode;
    console.log(`${barcodeChanged ? "↻" : "="} ${s.name}`);
    if (barcodeChanged) console.log(`    barcode: ${s.barcode} → ${correct.barcode}`);

    if (!imageIdByBarcode.has(correct.barcode)) {
      const urls = [correct.imageUrl, `${IMG_BROCARD}/${correct.barcode}_1.jpg`];
      let imageId: string | null = null;
      for (const url of urls) {
        try {
          imageId = await uploadImage(url, `${correct.barcode}-${key}`);
          break;
        } catch {
          /* try next */
        }
      }
      if (!imageId) throw new Error(`Failed to upload image for ${s.name}`);
      imageIdByBarcode.set(correct.barcode, imageId);
      console.log(`    image: ${correct.imageUrl.split("/").pop()}`);
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const shades = sorted.map((s, i) => {
    const key = normalizeName(s.name);
    const correct = CORRECT[key] ?? CORRECT[s.name];
    return {
      name: s.name,
      barcode: correct?.barcode ?? s.barcode ?? undefined,
      colorHex: correct?.colorHex ?? s.colorHex,
      imageId: correct ? imageIdByBarcode.get(correct.barcode) : s.imageId,
      position: i,
      stock: s.stock ?? 0,
    };
  });

  const imageIds = [...new Set(shades.map((s) => s.imageId).filter(Boolean) as string[])];

  await api(`/products/${full.id}`, "PATCH", { shades, imageIds });

  console.log(`\n✓ Patched ${full.id}`);
  console.log(`  Unique images: ${imageIds.length} / ${shades.length} shades`);
  for (const s of shades) console.log(`  ${s.name} → ${s.barcode}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
