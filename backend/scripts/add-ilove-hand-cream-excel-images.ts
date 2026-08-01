/**
 * Add 6 I Love Hand & Nail Cream products to ilove-products.xlsx
 * and download images into images/{barcode}/01.jpg
 *
 * Usage: npx tsx scripts/add-ilove-hand-cream-excel-images.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";

const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const EXCEL_PATH = process.env.EXCEL_PATH ?? "C:/Users/Lenovo/Music/ilove-products.xlsx";
const IMAGES_DIR = process.env.IMAGES_DIR ?? "C:/Users/Lenovo/Music/images";
const DRIVE_PARENT_COL = "https://drive.google.com/drive/folders/19pKbe6DFYJ6XVFrEcenHI3bxlw-hFlYL";

const IMAGE_URLS: Record<string, string> = {
  "5060351545587": "https://www.solbeauty.co.uk/cdn/shop/products/HNC001F112_01.jpg?v=1604065970",
  "5060351545655":
    "https://www.solbeauty.co.uk/cdn/shop/products/5_3ada6ded-fb0f-47ee-9968-fa9b06c7f7ac.jpg?v=1639136828",
  "5060351545648":
    "https://www.solbeauty.co.uk/cdn/shop/products/4_0b3620b3-28e1-401f-898f-1911861a0a44.jpg?v=1639136829",
  "5060351545594":
    "https://www.solbeauty.co.uk/cdn/shop/products/1_6dd08d5c-fb95-420b-83a3-81bd831da40b.jpg?v=1639136828",
  "5060351545631":
    "https://www.solbeauty.co.uk/cdn/shop/products/3_21d385e5-1592-4294-ad81-c219fd05f70e.jpg?v=1639136828",
  "5060351545617":
    "https://www.solbeauty.co.uk/cdn/shop/products/2_18e98c9c-823a-47bc-bee8-033a519e734b.jpg?v=1639136828",
};

const BARCODES = Object.keys(IMAGE_URLS);

type Product = {
  barcode: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
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

async function fetchProduct(barcode: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/products?search=${barcode}&limit=10`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as { data?: Array<{ id: string; barcode?: string }> };
  const found = json.data?.find((p) => p.barcode === barcode);
  if (!found) throw new Error(`Product not found: ${barcode}`);

  const full = await fetch(`${API_BASE}/products/${found.id}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  const fullJson = (await full.json()) as { data?: Product };
  const p = fullJson.data;
  if (!p) throw new Error(`Could not load product ${barcode}`);
  return p;
}

function toExcelDescription(text: string): string {
  return text.replace(/\r?\n/g, "\r\r\n");
}

async function downloadImage(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
}

function buildRow(p: Product): Record<string, string | number> {
  return {
    الباركود: Number(p.barcode),
    "الاسم عربي": p.nameAr,
    "الاسم إنجليزي": p.nameEn,
    "الوصف عربي": toExcelDescription(p.descriptionAr),
    "الوصف إنجليزي": toExcelDescription(p.descriptionEn),
    البراند: "ilove",
    "القسم الرئيسي": "العناية",
    "القسم الفرعي": "اليدين",
    "القسم الثانوي": "",
    "التصنيف الكامل": "العناية > اليدين",
    "السعر د.ع": p.price,
    [DRIVE_PARENT_COL]: "",
  };
}

async function main() {
  if (!fs.existsSync(EXCEL_PATH)) throw new Error(`Excel not found: ${EXCEL_PATH}`);

  await login();
  console.log(`Excel: ${EXCEL_PATH}`);
  console.log(`Images: ${IMAGES_DIR}\n`);

  const wb = XLSX.readFile(EXCEL_PATH);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws);

  let added = 0;
  let skipped = 0;

  for (const barcode of BARCODES) {
    const exists = rows.some((r) => String(r["الباركود"] ?? "") === barcode);
    if (exists) {
      console.log(`skip Excel ${barcode} — already exists`);
      skipped += 1;
    } else {
      const p = await fetchProduct(barcode);
      rows.push(buildRow(p));
      console.log(`+ Excel ${barcode} — ${p.nameEn}`);
      added += 1;
    }

    const imgDir = path.join(IMAGES_DIR, barcode);
    const imgPath = path.join(imgDir, "01.jpg");
    if (fs.existsSync(imgPath)) {
      console.log(`  image exists: ${imgPath}`);
    } else {
      await downloadImage(IMAGE_URLS[barcode], imgPath);
      console.log(`  downloaded: ${imgPath}`);
    }
  }

  rows.sort((a, b) => Number(a["الباركود"] ?? 0) - Number(b["الباركود"] ?? 0));

  const newWs = XLSX.utils.json_to_sheet(rows);
  const oldCols = ws["!cols"];
  if (oldCols) newWs["!cols"] = oldCols;
  wb.Sheets[sheetName] = newWs;

  const fallbackPath = EXCEL_PATH.replace(/\.xlsx$/i, "-updated.xlsx");
  try {
    XLSX.writeFile(wb, EXCEL_PATH);
    console.log(`\nExcel saved: ${EXCEL_PATH}`);
  } catch {
    XLSX.writeFile(wb, fallbackPath);
    console.log(`\nExcel locked — saved to: ${fallbackPath}`);
    console.log(`Close ilove-products.xlsx in Excel, then rename or copy the updated file.`);
  }

  console.log(`--- Done ---`);
  console.log(`Excel rows added: ${added} | skipped: ${skipped} | total: ${rows.length}`);
  console.log(`Images folder: ${IMAGES_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
