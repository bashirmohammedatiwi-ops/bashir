/**
 * Fix Matt Lasting Lip Color shade images — re-upload correct image per shade.
 * Usage: npx tsx scripts/fix-radiant-matt-lasting-lip-color-images-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_SLUG = "radiant-professional-matt-lasting-lip-color";
const IMG_RADIANT = "https://radiant-professional.com/media/images/products";
const IMG_BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

/** Correct image per barcode (post barcode-shift fix; verified milva.gr). */
const CORRECT_IMAGES: Record<string, string> = {
  "5201641723821": `${IMG_RADIANT}/2023/03/5201641723821_1_YYaCeq5.jpg`,
  "5201641723838": `${IMG_RADIANT}/2023/03/5201641723838_1_3PWIzGQ.jpg`,
  "5201641723852": `${IMG_RADIANT}/2023/03/5201641723852_1_s4wFH4q.jpg`,
  "5201641723869": `${IMG_RADIANT}/2023/03/5201641723869_1_fuTHIG5.jpg`,
  "5201641723876": `${IMG_RADIANT}/2023/03/5201641723876_1_JmiEaWc.jpg`,
  "5201641723883": `${IMG_RADIANT}/2023/03/5201641723883_1_2OM5y13.jpg`,
  "5201641723890": `${IMG_RADIANT}/2023/03/5201641723890_1_Phd50zt.jpg`,
  "5201641723920": `${IMG_RADIANT}/2023/03/5201641723920_1_fyNLZNz.jpg`,
  "5201641725047": `${IMG_RADIANT}/2024/09/5201641725047_1_N1Mfktr.jpg`,
  "5201641725054": `${IMG_RADIANT}/2023/03/5201641725054_1_4VJX3Rd.jpg`,
  "5201641725061": `${IMG_RADIANT}/2024/09/5201641725061_1_HZ2QJpt.jpg`,
  "5201641725085": `${IMG_RADIANT}/2023/03/5201641725085_1_kYDyie8.jpg`,
  "5201641727331": `${IMG_RADIANT}/2024/09/5201641727331_1_OSyDUEu.jpg`,
  "5201641727379": `${IMG_RADIANT}/2023/03/5201641727379_1_ltsqQUc.jpg`,
  "5201641727393": `${IMG_RADIANT}/2023/03/5201641727393_1_Pn4ehi0.jpg`,
  "5201641727430": `${IMG_RADIANT}/2023/03/5201641727430_1_k1HaI3t.jpg`,
  "5201641734094": `${IMG_RADIANT}/2023/03/5201641734094_1_wDUBruH.jpg`,
  "5201641734117": `${IMG_RADIANT}/2023/03/5201641734117_1_PleResF.jpg`,
  "5201641737132": `${IMG_RADIANT}/2023/03/5201641737132_1_8vRHMyK.jpg`,
  "5201641737149": `${IMG_RADIANT}/2023/03/5201641737149_1_jQ0eIgi.jpg`,
  "5201641740149": `${IMG_RADIANT}/2023/03/5201641740149_1_0erdkpT.jpg`,
  "5201641740156": `${IMG_RADIANT}/2023/03/5201641740156_1_tEzlFak.jpg`,
  "5201641742051": `${IMG_RADIANT}/2023/03/5201641742051_1_GfB4QBX.jpg`,
  "5201641742068": `${IMG_RADIANT}/2023/03/5201641742068_1_V3tZMPB.jpg`,
  "5201641747988": `${IMG_RADIANT}/2023/03/5201641747988_1_MXlbyv9.jpg`,
  "5201641023198": `${IMG_RADIANT}/2023/03/5201641023198_1_CyGUHyx.jpg`,
  "5201641033913": `${IMG_RADIANT}/2024/03/radiant_matt_lasting_lip_color_92_1_PKWZY30.jpg`,
  "5201641038253": `${IMG_RADIANT}/2024/10/radiant_matt_lasting_93_01_5hYCSj7.jpg`,
  "5201641038260": `${IMG_RADIANT}/2024/10/radiant_matt_lasting_94_01_mrSsMe5.jpg`,
  "5201641038277": `${IMG_RADIANT}/2024/10/radiant_matt_lasting_95_01_eh9ryDM.jpg`,
  "5201641043998": `${IMG_RADIANT}/2025/04/radiant_matt_lasting_lip_color_97_1_V98MWfE.jpg`,
  "5201641044001": `${IMG_RADIANT}/2025/04/radiant_matt_lasting_98_1_l5hvWKy.jpg`,
  "5201641044018": `${IMG_RADIANT}/2025/04/radiant_matt_lasting_99_1_k1EaJaV.jpg`,
  "5201641044025": `${IMG_RADIANT}/2025/04/radiant_matt_lasting_lip_color_100_1_vxR8EDN.jpg`,
  "5201641044032": `${IMG_RADIANT}/2025/04/radiant_matt_lasting_lip_color_101_1_p9pA5pa.jpg`,
  "5201641044049": `${IMG_RADIANT}/2025/04/radiant_matt_lasting_lip_color_101_1_p9pA5pa.jpg`,
  "5201641044056": `${IMG_RADIANT}/2025/09/radiant_matt_lasting_lip_color_102_1.jpg`,
  "5201641052310": `${IMG_RADIANT}/2026/04/104_TOFFEE.jpg`,
  "5201641052327": `${IMG_RADIANT}/2026/04/105_FIERY.jpg`,
  "5201641052334": `${IMG_RADIANT}/2026/04/106_FLAMINGO.jpg`,
  "5201641052341": `${IMG_RADIANT}/2026/04/107_CERISE.jpg`,
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

type Shade = {
  name: string;
  barcode?: string | null;
  colorHex: string;
  imageId?: string;
  position: number;
  stock?: number;
};

type Product = {
  id: string;
  nameEn?: string;
  imageIds?: string[];
  shades?: Shade[];
};

async function main() {
  console.log(`API: ${API_BASE}\n`);
  await login();
  console.log("Logged in.\n");

  const list = await api<{ data?: Product[] } | Product[]>(
    `/products?search=${encodeURIComponent(PRODUCT_SLUG)}&status=all&limit=5`,
  );
  const rows = Array.isArray(list) ? list : (list.data ?? []);
  const product = rows.find((p) => (p as Product & { slug?: string }).slug === PRODUCT_SLUG) ?? rows[0];
  if (!product?.id) throw new Error(`Product not found: ${PRODUCT_SLUG}`);

  const full = await api<Product>(`/products/${product.id}`);
  const existingShades = full.shades ?? [];
  if (!existingShades.length) throw new Error("No shades on product");

  console.log(`Product: ${full.nameEn ?? full.id}`);
  console.log(`Shades: ${existingShades.length}\n`);

  const imageIdByBarcode = new Map<string, string>();
  let updated = 0;
  let failed = 0;

  const sorted = [...existingShades].sort((a, b) => a.position - b.position);

  for (const shade of sorted) {
    const barcode = shade.barcode?.trim();
    if (!barcode) {
      console.log(`  ? ${shade.name} — no barcode, skip`);
      continue;
    }

    const imageUrl = CORRECT_IMAGES[barcode] ?? `${IMG_BROCARD}/${barcode}_1.jpg`;
    const urls = [imageUrl, `${IMG_BROCARD}/${barcode}_1.jpg`];

    let imageId: string | null = imageIdByBarcode.get(barcode) ?? null;
    if (!imageId) {
      let lastErr: unknown;
      for (const url of urls) {
        try {
          imageId = await uploadImage(url, `${barcode}-${shade.name}`);
          imageIdByBarcode.set(barcode, imageId);
          break;
        } catch (err) {
          lastErr = err;
        }
      }
      if (!imageId) {
        console.log(`  ✗ ${shade.name} (${barcode}): ${lastErr instanceof Error ? lastErr.message : lastErr}`);
        failed += 1;
        continue;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    const changed = shade.imageId !== imageId;
    if (changed) updated += 1;
    console.log(`  ${changed ? "↻" : "="} ${shade.name} — ${barcode} → ${imageUrl.split("/").pop()}`);
  }

  const shades = sorted.map((s, i) => {
    const barcode = s.barcode?.trim() ?? "";
    const imageId = barcode ? imageIdByBarcode.get(barcode) ?? s.imageId : s.imageId;
    return {
      name: s.name,
      barcode: s.barcode ?? undefined,
      colorHex: s.colorHex,
      imageId,
      position: i,
      stock: s.stock ?? 0,
    };
  });

  const imageIds = [...new Set(shades.map((s) => s.imageId).filter(Boolean) as string[])];

  await api(`/products/${full.id}`, "PATCH", { shades, imageIds });

  console.log(`\n✓ Patched product ${full.id}`);
  console.log(`  Unique images: ${imageIds.length} / ${shades.length} shades`);
  console.log(`  Re-uploaded: ${imageIdByBarcode.size} | changed: ${updated} | failed: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
