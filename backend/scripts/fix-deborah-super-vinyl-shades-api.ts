/**
 * Fix Deborah Super Vinyl — correct shade images (verified per shade page) + accurate colorHex sampled from each image.
 * Mallardo og:image for 01–04, 07–10; deborahmilano.com for 05–06.
 * Usage: npx tsx scripts/fix-deborah-super-vinyl-shades-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "8dd164e1-89b4-44db-8fac-9ed0212fbcf0";
const DM = "https://www.deborahmilano.com/en/wp-content/uploads";

type ShadeDef = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Verified URLs + hex sampled from the same image (sharp dominant-color). */
const SHADES: ShadeDef[] = [
  {
    name: "01 Rose",
    colorHex: "#a04850",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/181636-large_default/deb-rs-super-vinyl-01.jpg",
    position: 0,
  },
  {
    name: "02 Caramel",
    colorHex: "#904840",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/181638-large_default/deb-rs-super-vinyl-02.jpg",
    position: 1,
  },
  {
    name: "03 Cherry Pink",
    colorHex: "#a81848",
    imageUrl: "https://cdn-1-profumeriemallardo.server.it/shop/181640-large_default/deb-rs-super-vinyl-03.jpg",
    position: 2,
  },
  {
    name: "04 Signature Red",
    colorHex: "#a81820",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/181642-large_default/deb-rs-super-vinyl-04.jpg",
    position: 3,
  },
  {
    name: "05 Ruby Red",
    colorHex: "#801818",
    imageUrl: `${DM}/2024/02/MDV017123_SUPER-VINYL-shake-lipstick_05-600x600.png`,
    position: 4,
  },
  {
    name: "06 Winery",
    colorHex: "#681028",
    imageUrl: `${DM}/2024/02/MDV017223_SUPER-VINYL-shake-lipstick_06-600x600.png`,
    position: 5,
  },
  {
    name: "07 Rosewood",
    colorHex: "#984048",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/193580-large_default/deb-rs-super-vinyl-07.jpg",
    position: 6,
  },
  {
    name: "08 Orchid Pink",
    colorHex: "#b85880",
    imageUrl: "https://cdn-1-profumeriemallardo.server.it/shop/193582-large_default/deb-rs-super-vinyl-08.jpg",
    position: 7,
  },
  {
    name: "09 SO 90s",
    colorHex: "#984038",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/193584-large_default/deb-rs-super-vinyl-09.jpg",
    position: 8,
  },
  {
    name: "10 Marsala",
    colorHex: "#801810",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/193586-large_default/deb-rs-super-vinyl-10.jpg",
    position: 9,
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

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Product: ${PRODUCT_ID}`);
  console.log(`Shades: ${SHADES.length}\n`);

  await login();
  console.log("Logged in.\n");

  const product = await api<{ nameAr?: string; shades?: Array<{ name: string; colorHex?: string }> }>(
    `/products/${PRODUCT_ID}`,
  );
  console.log(`Before: ${product.nameAr}`);
  product.shades?.forEach((s) => console.log(`  ${s.name} → ${s.colorHex}`));
  console.log("\nUploading shade images (parallel)...");

  const uploaded = await Promise.all(
    SHADES.map(async (shade) => {
      const imageId = await uploadImage(shade.imageUrl, shade.name);
      console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
      return {
        name: shade.name,
        colorHex: shade.colorHex,
        imageId,
        position: shade.position,
        stock: 0,
      };
    }),
  );

  uploaded.sort((a, b) => a.position - b.position);
  const imageIds = uploaded.map((s) => s.imageId);

  await api(`/products/${PRODUCT_ID}`, "PATCH", { shades: uploaded, imageIds });

  console.log(`\n✓ Fixed: ${product.nameAr}`);
  console.log(`  Shades: ${uploaded.length}`);
  uploaded.forEach((s) => console.log(`    ${s.name} | ${s.colorHex} | ${s.imageId.slice(0, 8)}…`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
