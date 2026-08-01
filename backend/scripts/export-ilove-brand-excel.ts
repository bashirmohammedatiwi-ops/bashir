/**
 * Export ilove brand products to Excel + barcode image folders.
 * Usage: npx tsx scripts/export-ilove-brand-excel.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";

const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";
const BRAND_SLUG = "ilove";

const ROOT_DIR = path.resolve(
  process.env.EXPORT_DIR ?? path.join(process.cwd(), "..", "ilove-brand-export"),
);
const IMAGES_DIR = path.join(ROOT_DIR, "images");
const EXCEL_PATH = path.join(ROOT_DIR, "ilove-products.xlsx");

type MediaVariant = {
  formats?: { jpg?: string; webp?: string; avif?: string };
};

type ProductImage = {
  position?: number;
  media?: {
    id?: string;
    filename?: string;
    publicUrlBase?: string;
    variants?: {
      large?: MediaVariant;
      medium?: MediaVariant;
      small?: MediaVariant;
      thumb?: MediaVariant;
    };
  };
};

type Product = {
  id: string;
  sku?: string;
  barcode?: string;
  slug?: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price?: number;
  stock?: number;
  isActive?: boolean;
  brand?: { name?: string; slug?: string };
  category?: { nameAr?: string; name?: string };
  subcategory?: { nameAr?: string; name?: string };
  tertiaryCategory?: { nameAr?: string; name?: string } | null;
  subcategories?: Array<{ nameAr?: string; name?: string }>;
  tertiaryCategories?: Array<{ nameAr?: string; name?: string }>;
  images?: ProductImage[];
};

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = (await res.json()) as { data?: { accessToken?: string }; message?: string };
  if (!res.ok) throw new Error(json?.message ?? `Login failed HTTP ${res.status}`);
  token = json.data?.accessToken ?? "";
  if (!token) throw new Error("No access token");
}

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as { message?: string })?.message ?? res.statusText;
    throw new Error(`${path}: ${msg}`);
  }
  return ((json as { data?: T }).data ?? json) as T;
}

async function fetchAllProducts(): Promise<Product[]> {
  const all: Product[] = [];
  let page = 1;
  while (true) {
    const batch = await api<Product[]>(
      `/products?brandId=${BRAND_SLUG}&status=all&limit=100&page=${page}`,
    );
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }
  return all.sort((a, b) => (a.barcode ?? "").localeCompare(b.barcode ?? ""));
}

function pickImageUrl(media: ProductImage["media"]): string | null {
  if (!media || media.id === "placeholder") return null;
  const variants = media.variants;
  const candidates = [
    variants?.large?.formats?.jpg,
    variants?.medium?.formats?.jpg,
    variants?.large?.formats?.webp,
    variants?.medium?.formats?.webp,
    variants?.small?.formats?.webp,
    media.publicUrlBase && media.filename ? `${media.publicUrlBase}/${media.filename}.webp` : null,
  ];
  return candidates.find((u) => typeof u === "string" && u.length > 0) ?? null;
}

function extFromUrl(url: string): string {
  const clean = url.split("?")[0] ?? url;
  const ext = path.extname(clean).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".webp" || ext === ".png" || ext === ".avif") {
    return ext;
  }
  return ".jpg";
}

async function downloadFile(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

async function downloadProductImages(product: Product, folderKey: string): Promise<string[]> {
  const dir = path.join(IMAGES_DIR, folderKey);
  fs.mkdirSync(dir, { recursive: true });

  const images = [...(product.images ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const saved: string[] = [];

  let index = 0;
  for (const img of images) {
    const url = pickImageUrl(img.media);
    if (!url) continue;
    index += 1;
    const ext = extFromUrl(url);
    const filename = `${String(index).padStart(2, "0")}${ext}`;
    const dest = path.join(dir, filename);
    try {
      await downloadFile(url, dest);
      saved.push(filename);
    } catch (err) {
      console.warn(`  ! failed image ${folderKey}/${filename}: ${err instanceof Error ? err.message : err}`);
    }
  }

  return saved;
}

function categoryPath(product: Product): string {
  const parts = [
    product.category?.nameAr ?? product.category?.name,
    product.subcategory?.nameAr ?? product.subcategory?.name ?? product.subcategories?.[0]?.nameAr,
    product.tertiaryCategory?.nameAr ??
      product.tertiaryCategory?.name ??
      product.tertiaryCategories?.[0]?.nameAr,
  ].filter(Boolean);
  return parts.join(" > ");
}

async function main() {
  console.log(`Export root: ${ROOT_DIR}`);
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  await login();
  const products = await fetchAllProducts();
  console.log(`Fetched ${products.length} ilove products\n`);

  const rows: Record<string, string | number | boolean>[] = [];
  let downloaded = 0;
  let missingImages = 0;

  for (const p of products) {
    const folderKey = (p.barcode || p.sku || p.id).trim();
    process.stdout.write(`→ ${folderKey} `);

    const imageFiles = await downloadProductImages(p, folderKey);
    if (imageFiles.length) {
      downloaded += imageFiles.length;
      console.log(`(${imageFiles.length} img)`);
    } else {
      missingImages += 1;
      console.log("(no images)");
    }

    rows.push({
      الباركود: p.barcode ?? "",
      "SKU": p.sku ?? "",
      "معرّف المنتج": p.id,
      "Slug": p.slug ?? "",
      "الاسم عربي": p.nameAr ?? "",
      "الاسم إنجليزي": p.nameEn ?? "",
      "الوصف عربي": p.descriptionAr ?? "",
      "الوصف إنجليزي": p.descriptionEn ?? "",
      "البراند": p.brand?.name ?? "ilove",
      "القسم الرئيسي": p.category?.nameAr ?? p.category?.name ?? "",
      "القسم الفرعي":
        p.subcategory?.nameAr ?? p.subcategory?.name ?? p.subcategories?.[0]?.nameAr ?? "",
      "القسم الثانوي":
        p.tertiaryCategory?.nameAr ??
        p.tertiaryCategory?.name ??
        p.tertiaryCategories?.[0]?.nameAr ??
        "",
      "التصنيف الكامل": categoryPath(p),
      "السعر د.ع": p.price ?? 0,
      "المخزون": p.stock ?? 0,
      "نشط": p.isActive ? "نعم" : "لا",
      "مجلد الصور": `images/${folderKey}`,
      "عدد الصور المحفوظة": imageFiles.length,
      "ملفات الصور": imageFiles.join(", "),
      "رابط مجلد درايف": "",
      "رابط درايف صورة رئيسية": "",
      "ملاحظات": imageFiles.length ? "" : "لا توجد صور في المتجر — أضف يدوياً بعد الرفع",
    });
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ilove-products");

  // Wider columns hint via col widths
  ws["!cols"] = [
    { wch: 16 },
    { wch: 16 },
    { wch: 38 },
    { wch: 42 },
    { wch: 50 },
    { wch: 50 },
    { wch: 60 },
    { wch: 60 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 35 },
    { wch: 10 },
    { wch: 8 },
    { wch: 6 },
    { wch: 28 },
    { wch: 8 },
    { wch: 30 },
    { wch: 35 },
    { wch: 35 },
    { wch: 40 },
  ];

  XLSX.writeFile(wb, EXCEL_PATH);

  const readme = `# ilove Brand Export

Generated: ${new Date().toISOString()}

## Contents
- \`ilove-products.xlsx\` — all products (${products.length})
- \`images/{barcode}/\` — product images per barcode folder

## Google Drive workflow
1. Upload the entire \`images\` folder to Google Drive.
2. For each barcode folder, copy the share link.
3. Paste links into Excel columns:
   - \`رابط مجلد درايف\` — folder link
   - \`رابط درايف صورة رئيسية\` — main image link (optional)

## Stats
- Products: ${products.length}
- Images downloaded: ${downloaded}
- Products without images: ${missingImages}
`;

  fs.writeFileSync(path.join(ROOT_DIR, "README.txt"), readme, "utf8");

  console.log(`\n--- Done ---`);
  console.log(`Excel: ${EXCEL_PATH}`);
  console.log(`Images: ${IMAGES_DIR}`);
  console.log(`Products: ${products.length} | Images saved: ${downloaded} | No images: ${missingImages}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
