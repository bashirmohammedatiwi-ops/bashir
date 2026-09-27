/**
 * Link ilove Excel rows to Google Drive subfolder/file URLs.
 *
 * Usage (API key — folder must be "Anyone with the link"):
 *   GOOGLE_DRIVE_API_KEY=xxx npx tsx scripts/link-ilove-drive-excel.ts
 *
 * Usage (pre-exported map from browser console):
 *   npx tsx scripts/link-ilove-drive-excel.ts --map ../ilove-brand-export/drive-map.json
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";

const PARENT_FOLDER_ID = process.env.DRIVE_PARENT_ID ?? "1aL2XkJoBapgOtmOqXVYqvftAB2xxxTiI";
const API_KEY =
  process.env.GOOGLE_DRIVE_API_KEY ??
  (process.argv.includes("--api-key")
    ? (process.argv[process.argv.indexOf("--api-key") + 1] ?? "")
    : "");
const ROOT_DIR = path.resolve(process.cwd(), "..", "ilove-brand-export");
const EXCEL_PATH = path.join(ROOT_DIR, "ilove-products.xlsx");
const MAP_PATH =
  process.argv.includes("--map")
    ? path.resolve(process.argv[process.argv.indexOf("--map") + 1] ?? "")
    : path.join(ROOT_DIR, "drive-map.json");

type DriveEntry = {
  id: string;
  name: string;
  mimeType?: string;
  webViewLink?: string;
};

type DriveMap = Record<
  string,
  { folderId: string; folderUrl: string; mainImageUrl?: string; mainImageId?: string }
>;

function folderUrl(id: string) {
  return `https://drive.google.com/drive/folders/${id}`;
}

function fileUrl(id: string) {
  return `https://drive.google.com/file/d/${id}/view`;
}

async function driveListChildren(folderId: string, pageToken?: string): Promise<{
  files: DriveEntry[];
  nextPageToken?: string;
}> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "nextPageToken,files(id,name,mimeType,webViewLink)",
    pageSize: "1000",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
    key: API_KEY,
  });
  if (pageToken) params.set("pageToken", pageToken);

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
  const json = (await res.json()) as {
    files?: DriveEntry[];
    nextPageToken?: string;
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(json.error?.message ?? `Drive API HTTP ${res.status}`);
  return { files: json.files ?? [], nextPageToken: json.nextPageToken };
}

async function listAllChildren(folderId: string): Promise<DriveEntry[]> {
  const all: DriveEntry[] = [];
  let token: string | undefined;
  do {
    const page = await driveListChildren(folderId, token);
    all.push(...page.files);
    token = page.nextPageToken;
  } while (token);
  return all;
}

async function buildMapFromDrive(): Promise<DriveMap> {
  if (!API_KEY) throw new Error("GOOGLE_DRIVE_API_KEY is required to list Drive folder");

  const map: DriveMap = {};
  const queue: Array<{ id: string; path: string[] }> = [{ id: PARENT_FOLDER_ID, path: [] }];

  while (queue.length) {
    const current = queue.shift()!;
    const children = await listAllChildren(current.id);

    for (const item of children) {
      const nextPath = [...current.path, item.name];
      const isFolder = item.mimeType === "application/vnd.google-apps.folder";

      if (isFolder) {
        const leaf = item.name;
        const looksLikeProduct =
          /^5060\d{10}$/.test(leaf) || /^SKU-\d+$/.test(leaf) || /^\d{13}$/.test(leaf);

        if (looksLikeProduct) {
          const files = await listAllChildren(item.id);
          const images = files
            .filter((f) => f.mimeType?.startsWith("image/"))
            .sort((a, b) => a.name.localeCompare(b.name));
          const main = images[0];
          map[leaf] = {
            folderId: item.id,
            folderUrl: item.webViewLink ?? folderUrl(item.id),
            mainImageUrl: main ? main.webViewLink ?? fileUrl(main.id) : undefined,
            mainImageId: main?.id,
          };
        } else if (item.name.toLowerCase() === "images" || nextPath.length <= 2) {
          queue.push({ id: item.id, path: nextPath });
        }
      }
    }
  }

  return map;
}

function loadMapFromFile(): DriveMap | null {
  if (!fs.existsSync(MAP_PATH)) return null;
  const raw = JSON.parse(fs.readFileSync(MAP_PATH, "utf8")) as DriveMap | DriveEntry[];
  if (Array.isArray(raw)) {
    const map: DriveMap = {};
    for (const e of raw) {
      if (!e.name || !e.id) continue;
      map[e.name] = {
        folderId: e.id,
        folderUrl: e.webViewLink ?? folderUrl(e.id),
      };
    }
    return map;
  }
  return raw;
}

function updateExcel(map: DriveMap) {
  if (!fs.existsSync(EXCEL_PATH)) throw new Error(`Excel not found: ${EXCEL_PATH}`);

  const wb = XLSX.readFile(EXCEL_PATH);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

  let linked = 0;
  let missing = 0;

  for (const row of rows) {
    const key = String(row["الباركود"] || row["SKU"] || "").trim();
    const folderKey = key || String(row["مجلد الصور"] || "").replace(/^images\//, "");
    const entry = map[folderKey] ?? map[key];

    if (entry) {
      row["رابط مجلد درايف"] = entry.folderUrl;
      row["رابط درايف صورة رئيسية"] = entry.mainImageUrl ?? "";
      if (!row["ملاحظات"] || row["ملاحظات"].includes("درايف")) {
        row["ملاحظات"] = "";
      }
      linked += 1;
    } else if (folderKey) {
      row["ملاحظات"] = (row["ملاحظات"] ? row["ملاحظات"] + " | " : "") + "لم يُعثر على مجلد درايف";
      missing += 1;
    }
  }

  const newWs = XLSX.utils.json_to_sheet(rows);
  const oldCols = ws["!cols"];
  if (oldCols) newWs["!cols"] = oldCols;
  wb.Sheets[sheetName] = newWs;
  XLSX.writeFile(wb, EXCEL_PATH);

  console.log(`Excel updated: ${EXCEL_PATH}`);
  console.log(`Linked: ${linked} | Missing: ${missing}`);
}

async function main() {
  let map = loadMapFromFile();

  if (!map || Object.keys(map).length === 0) {
    console.log("No drive-map.json found — fetching from Google Drive API...");
    map = await buildMapFromDrive();
    fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 2), "utf8");
    console.log(`Saved drive map: ${MAP_PATH} (${Object.keys(map).length} entries)`);
  } else {
    console.log(`Loaded drive map: ${MAP_PATH} (${Object.keys(map).length} entries)`);
  }

  updateExcel(map);
}

main().catch((err) => {
  console.error(err.message ?? err);
  console.error(`
Could not access Google Drive automatically.

Option A — API key (folder must be shared: Anyone with the link):
  1. Google Cloud Console → Enable Drive API → Create API key
  2. Share Drive folder publicly (Anyone with the link can view)
  3. Run: GOOGLE_DRIVE_API_KEY=your_key npx tsx scripts/link-ilove-drive-excel.ts

Option B — Browser console (while logged into Drive on the folder page):
  1. Open: https://drive.google.com/drive/folders/${PARENT_FOLDER_ID}
  2. Open DevTools → Console → paste contents of:
     ilove-brand-export/extract-drive-map.js
  3. Save downloaded drive-map.json into ilove-brand-export/
  4. Run: npx tsx scripts/link-ilove-drive-excel.ts --map ../ilove-brand-export/drive-map.json
`);
  process.exit(1);
});
