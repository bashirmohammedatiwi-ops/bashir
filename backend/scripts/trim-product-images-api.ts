/**
 * يبقي أول صورتين لكل منتج (الرئيسية + التالية) ويحذف الباقي عبر API الإدارة.
 *
 * Usage:
 *   API_BASE=https://deemaalhayat.com/api/v1 ADMIN_PASSWORD=000000 npx tsx scripts/trim-product-images-api.ts
 *   DRY_RUN=1 ...  # معاينة فقط بدون تعديل
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const PATCH_DELAY_MS = Math.max(0, Number(process.env.PATCH_DELAY_MS ?? "350") || 350);
const MAX_RETRIES = Math.max(1, Number(process.env.MAX_RETRIES ?? "5") || 5);
const MAX_IMAGES = Math.max(1, Number(process.env.MAX_IMAGES ?? "2") || 2);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PLACEHOLDER_HASH = "alhayaa-product-placeholder-v1";

type Media = {
  id?: string;
  hash?: string | null;
  storagePath?: string | null;
  originalName?: string | null;
};

type ProductImage = {
  id: string;
  mediaId: string;
  position: number;
  isPrimary: boolean;
  media?: Media | null;
};

type Product = {
  id: string;
  name: string;
  sku?: string;
  images?: ProductImage[];
};

type PaginatedMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
};

let token = "";

function isPlaceholderMedia(media: Media | null | undefined): boolean {
  if (!media) return true;
  if (media.id === "placeholder") return true;
  if (media.hash === PLACEHOLDER_HASH) return true;
  if (media.storagePath === "placeholder") return true;
  const name = media.originalName?.toLowerCase() ?? "";
  return name.includes("placeholder");
}

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = (await res.json()) as {
    data?: { accessToken?: string };
    accessToken?: string;
    message?: string;
  };
  if (!res.ok) throw new Error(json?.message ?? `Login failed HTTP ${res.status}`);
  token = json.data?.accessToken ?? json.accessToken ?? "";
  if (!token) throw new Error("No access token in login response");
}

async function apiRaw(path: string, method = "GET", body?: unknown, attempt = 1) {
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
  if (res.status === 429 && attempt < MAX_RETRIES) {
    const wait = PATCH_DELAY_MS * attempt * 2;
    await sleep(wait);
    return apiRaw(path, method, body, attempt + 1);
  }
  if (!res.ok) {
    const msg =
      (json as { message?: string; error?: { message?: string } })?.error?.message ??
      (json as { message?: string })?.message ??
      res.statusText;
    throw new Error(`${method} ${path}: ${msg}`);
  }
  return json as { data?: unknown; meta?: PaginatedMeta };
}

async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const json = await apiRaw(path, method, body);
  return (json.data ?? json) as T;
}

async function fetchAllProducts(): Promise<Product[]> {
  const out: Product[] = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const json = await apiRaw(`/products?status=all&limit=${limit}&page=${page}`);
    const batch = (json.data ?? []) as Product[];
    const meta = json.meta;
    out.push(...batch);
    if (!meta?.hasNext || page >= (meta?.totalPages ?? page)) break;
    page += 1;
  }

  return out;
}

function sortImages(images: ProductImage[]): ProductImage[] {
  return [...images].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.position - b.position;
  });
}

function realImages(images: ProductImage[] | undefined): ProductImage[] {
  return sortImages((images ?? []).filter((img) => !isPlaceholderMedia(img.media)));
}

async function fetchProductDetails(id: string): Promise<Product> {
  return api<Product>(`/products/${id}`);
}

async function trimProduct(product: Product): Promise<{ changed: boolean; removed: number }> {
  const images = realImages(
    product.images?.length ? product.images : (await fetchProductDetails(product.id)).images,
  );
  if (images.length <= MAX_IMAGES) {
    return { changed: false, removed: 0 };
  }

  const keep = images.slice(0, MAX_IMAGES);
  const removeCount = images.length - keep.length;
  const imageIds = keep.map((img) => img.mediaId).filter(Boolean);

  if (imageIds.length === 0) {
    return { changed: false, removed: 0 };
  }

  if (DRY_RUN) {
    console.log(
      `  [dry-run] ${product.name} — ${images.length} → ${imageIds.length} (حذف ${removeCount})`,
    );
    return { changed: true, removed: removeCount };
  }

  await api(`/products/${product.id}`, "PATCH", { imageIds });
  if (PATCH_DELAY_MS > 0) await sleep(PATCH_DELAY_MS);
  console.log(`  ✓ ${product.name} — ${images.length} → ${imageIds.length} (حذف ${removeCount})`);
  return { changed: true, removed: removeCount };
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Admin: ${ADMIN_EMAIL}`);
  console.log(`Max images per product: ${MAX_IMAGES}`);
  console.log(DRY_RUN ? "Mode: DRY RUN (no changes)\n" : "Mode: APPLY\n");

  await login();
  console.log("Logged in.\n");

  const products = await fetchAllProducts();
  console.log(`Found ${products.length} products.\n`);

  let trimmed = 0;
  let skipped = 0;
  let removedTotal = 0;
  let failed = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (i > 0 && i % 50 === 0) {
      console.log(`... progress ${i}/${products.length} (trimmed ${trimmed}, skipped ${skipped}, failed ${failed})`);
    }
    try {
      const result = await trimProduct(p);
      if (result.changed) {
        trimmed += 1;
        removedTotal += result.removed;
      } else {
        skipped += 1;
      }
    } catch (err) {
      failed += 1;
      console.log(`ERROR [${p.name}]: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Products total:     ${products.length}`);
  console.log(`Trimmed:            ${trimmed}`);
  console.log(`Skipped (≤${MAX_IMAGES} images): ${skipped}`);
  console.log(`Images removed:     ${removedTotal}`);
  console.log(`Failed:             ${failed}`);
  if (DRY_RUN) console.log("\nDry run only — re-run without DRY_RUN=1 to apply.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
