/**
 * Fix Matt Lasting Lip Color — barcodes + images were shifted by one shade
 * (radiant site + initial import). Verified: milva.gr per-barcode pages.
 * Each shade gets the next shade's barcode + image; 107 wraps to 01's old data.
 * Usage: npx tsx scripts/fix-radiant-matt-lasting-lip-color-barcodes-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_SLUG = "radiant-professional-matt-lasting-lip-color";
const IMG_RADIANT = "https://radiant-professional.com/media/images/products";
const IMG_BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

type ShadeDef = { name: string; colorHex: string; barcode: string; imageUrl: string };

/** Pre-fix data (shifted by one). */
const ORIGINAL: ShadeDef[] = [
  { name: "01", colorHex: "#b76665", barcode: "5201641052341", imageUrl: `${IMG_BROCARD}/5201641052341_1.jpg` },
  { name: "02", colorHex: "#b16e5e", barcode: "5201641723821", imageUrl: `${IMG_RADIANT}/2023/03/5201641723821_1_YYaCeq5.jpg` },
  { name: "04", colorHex: "#b25b6b", barcode: "5201641723838", imageUrl: `${IMG_RADIANT}/2023/03/5201641723838_1_3PWIzGQ.jpg` },
  { name: "05", colorHex: "#d07663", barcode: "5201641723852", imageUrl: `${IMG_RADIANT}/2023/03/5201641723852_1_s4wFH4q.jpg` },
  { name: "06", colorHex: "#ad6a5a", barcode: "5201641723869", imageUrl: `${IMG_RADIANT}/2023/03/5201641723869_1_fuTHIG5.jpg` },
  { name: "07", colorHex: "#985657", barcode: "5201641723876", imageUrl: `${IMG_RADIANT}/2023/03/5201641723876_1_JmiEaWc.jpg` },
  { name: "08", colorHex: "#ad3541", barcode: "5201641723883", imageUrl: `${IMG_RADIANT}/2023/03/5201641723883_1_2OM5y13.jpg` },
  { name: "11", colorHex: "#863949", barcode: "5201641723890", imageUrl: `${IMG_RADIANT}/2023/03/5201641723890_1_Phd50zt.jpg` },
  { name: "13", colorHex: "#f08478", barcode: "5201641723920", imageUrl: `${IMG_RADIANT}/2023/03/5201641723920_1_fyNLZNz.jpg` },
  { name: "14", colorHex: "#71103e", barcode: "5201641725047", imageUrl: `${IMG_RADIANT}/2024/09/5201641725047_1_N1Mfktr.jpg` },
  { name: "15", colorHex: "#ed7f98", barcode: "5201641725054", imageUrl: `${IMG_RADIANT}/2023/03/5201641725054_1_4VJX3Rd.jpg` },
  { name: "17", colorHex: "#ba1825", barcode: "5201641725061", imageUrl: `${IMG_RADIANT}/2024/09/5201641725061_1_HZ2QJpt.jpg` },
  { name: "18", colorHex: "#960026", barcode: "5201641725085", imageUrl: `${IMG_RADIANT}/2023/03/5201641725085_1_kYDyie8.jpg` },
  { name: "19", colorHex: "#a85253", barcode: "5201641727331", imageUrl: `${IMG_RADIANT}/2024/09/5201641727331_1_OSyDUEu.jpg` },
  { name: "21", colorHex: "#8a483c", barcode: "5201641727379", imageUrl: `${IMG_RADIANT}/2023/03/5201641727379_1_ltsqQUc.jpg` },
  { name: "22", colorHex: "#791c2e", barcode: "5201641727393", imageUrl: `${IMG_RADIANT}/2023/03/5201641727393_1_Pn4ehi0.jpg` },
  { name: "33", colorHex: "#98324a", barcode: "5201641727430", imageUrl: `${IMG_RADIANT}/2023/03/5201641727430_1_k1HaI3t.jpg` },
  { name: "35", colorHex: "#8c5751", barcode: "5201641734094", imageUrl: `${IMG_RADIANT}/2023/03/5201641734094_1_wDUBruH.jpg` },
  { name: "42", colorHex: "#d2667b", barcode: "5201641734117", imageUrl: `${IMG_RADIANT}/2023/03/5201641734117_1_PleResF.jpg` },
  { name: "43", colorHex: "#cf8b85", barcode: "5201641737132", imageUrl: `${IMG_RADIANT}/2023/03/5201641737132_1_8vRHMyK.jpg` },
  { name: "50", colorHex: "#c8303c", barcode: "5201641737149", imageUrl: `${IMG_RADIANT}/2023/03/5201641737149_1_jQ0eIgi.jpg` },
  { name: "51", colorHex: "#bd1d3f", barcode: "5201641740149", imageUrl: `${IMG_RADIANT}/2023/03/5201641740149_1_0erdkpT.jpg` },
  { name: "59", colorHex: "#cf967b", barcode: "5201641740156", imageUrl: `${IMG_RADIANT}/2023/03/5201641740156_1_tEzlFak.jpg` },
  { name: "60", colorHex: "#c69382", barcode: "5201641742051", imageUrl: `${IMG_RADIANT}/2023/03/5201641742051_1_GfB4QBX.jpg` },
  { name: "71 Nude", colorHex: "#c5878a", barcode: "5201641742068", imageUrl: `${IMG_RADIANT}/2023/03/5201641742068_1_V3tZMPB.jpg` },
  { name: "86 Azalea", colorHex: "#c04387", barcode: "5201641747988", imageUrl: `${IMG_RADIANT}/2023/03/5201641747988_1_MXlbyv9.jpg` },
  { name: "92 Burnt Orange", colorHex: "#ac4e46", barcode: "5201641023198", imageUrl: `${IMG_RADIANT}/2023/03/5201641023198_1_CyGUHyx.jpg` },
  { name: "93 Natural", colorHex: "#976868", barcode: "5201641033913", imageUrl: `${IMG_RADIANT}/2024/03/radiant_matt_lasting_lip_color_92_1_PKWZY30.jpg` },
  { name: "94 Dalia", colorHex: "#7a344b", barcode: "5201641038253", imageUrl: `${IMG_RADIANT}/2024/10/radiant_matt_lasting_93_01_5hYCSj7.jpg` },
  { name: "95 Strawberry", colorHex: "#860116", barcode: "5201641038260", imageUrl: `${IMG_RADIANT}/2024/10/radiant_matt_lasting_94_01_mrSsMe5.jpg` },
  { name: "97 Strawberry", colorHex: "#d70164", barcode: "5201641038277", imageUrl: `${IMG_RADIANT}/2024/10/radiant_matt_lasting_95_01_eh9ryDM.jpg` },
  { name: "98 Metal Pink", colorHex: "#f26793", barcode: "5201641043998", imageUrl: `${IMG_RADIANT}/2025/04/radiant_matt_lasting_lip_color_97_1_V98MWfE.jpg` },
  { name: "99 Rose Metal", colorHex: "#e6547c", barcode: "5201641044001", imageUrl: `${IMG_RADIANT}/2025/04/radiant_matt_lasting_98_1_l5hvWKy.jpg` },
  { name: "100 Coral", colorHex: "#c64d41", barcode: "5201641044018", imageUrl: `${IMG_RADIANT}/2025/04/radiant_matt_lasting_99_1_k1EaJaV.jpg` },
  { name: "101 Bare", colorHex: "#a76162", barcode: "5201641044025", imageUrl: `${IMG_RADIANT}/2025/04/radiant_matt_lasting_lip_color_100_1_vxR8EDN.jpg` },
  { name: "102 Hyacinth", colorHex: "#b0666e", barcode: "5201641044032", imageUrl: `${IMG_RADIANT}/2025/04/radiant_matt_lasting_lip_color_101_1_p9pA5pa.jpg` },
  { name: "103 Hazel", colorHex: "#a57275", barcode: "5201641044049", imageUrl: `${IMG_RADIANT}/2025/09/radiant_matt_lasting_lip_color_102_1.jpg` },
  { name: "104 Toffee", colorHex: "#b26c6c", barcode: "5201641044056", imageUrl: `${IMG_RADIANT}/2026/04/104_TOFFEE.jpg` },
  { name: "105 Fiery", colorHex: "#d42036", barcode: "5201641052310", imageUrl: `${IMG_RADIANT}/2026/04/105_FIERY.jpg` },
  { name: "106 Flamingo", colorHex: "#c54873", barcode: "5201641052327", imageUrl: `${IMG_RADIANT}/2026/04/106_FLAMINGO.jpg` },
  { name: "107 Cerise", colorHex: "#b23258", barcode: "5201641052334", imageUrl: `${IMG_RADIANT}/2026/04/107_CERISE.jpg` },
];

const CORRECT: ShadeDef[] = ORIGINAL.map((s, i) => {
  const next = ORIGINAL[(i + 1) % ORIGINAL.length];
  return { name: s.name, colorHex: s.colorHex, barcode: next.barcode, imageUrl: next.imageUrl };
});

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
  const urls = [url, url.includes(IMG_BROCARD) ? url : `${IMG_BROCARD}/${alt.split("-")[0]}_1.jpg`];
  let lastErr: unknown;
  for (const u of urls) {
    try {
      const res = await fetch(u, {
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
      lastErr = err;
    }
  }
  if (attempt >= 4) throw lastErr;
  await new Promise((r) => setTimeout(r, attempt * 1500));
  return uploadImage(url, alt, attempt + 1);
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
    shades?: Array<{
      name: string;
      barcode?: string | null;
      colorHex: string;
      imageId?: string;
      position: number;
      stock?: number;
    }>;
  }>(`/products/${product.id}`);

  console.log(`Product: ${full.nameEn}`);
  console.log(`Fixing ${CORRECT.length} shades (barcode + image shift)...\n`);

  const correctByName = new Map(CORRECT.map((s) => [s.name, s]));
  const sorted = [...(full.shades ?? [])].sort((a, b) => a.position - b.position);
  const imageIdByBarcode = new Map<string, string>();
  let changed = 0;

  for (const s of sorted) {
    const fix = correctByName.get(s.name);
    if (!fix) {
      console.log(`? Unknown shade: ${s.name}`);
      continue;
    }
    const barcodeChanged = s.barcode !== fix.barcode;
    if (barcodeChanged) changed += 1;

    if (!imageIdByBarcode.has(fix.barcode)) {
      const imageId = await uploadImage(fix.imageUrl, `${fix.barcode}-${s.name}`);
      imageIdByBarcode.set(fix.barcode, imageId);
      console.log(`  ↻ ${s.name} → ${fix.barcode} | ${fix.imageUrl.split("/").pop()}`);
      await new Promise((r) => setTimeout(r, 400));
    } else if (barcodeChanged) {
      console.log(`  ↻ ${s.name} → ${fix.barcode} (image cached)`);
    }
  }

  const shades = sorted.map((s, i) => {
    const fix = correctByName.get(s.name)!;
    return {
      name: s.name,
      barcode: fix.barcode,
      colorHex: fix.colorHex,
      imageId: imageIdByBarcode.get(fix.barcode),
      position: i,
      stock: s.stock ?? 0,
    };
  });

  const imageIds = [...new Set(shades.map((s) => s.imageId).filter(Boolean) as string[])];
  await api(`/products/${full.id}`, "PATCH", { shades, imageIds });

  console.log(`\n✓ Patched ${full.id}`);
  console.log(`  Barcodes updated: ${changed} / ${shades.length}`);
  console.log(`  Unique images: ${imageIds.length} / ${shades.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
