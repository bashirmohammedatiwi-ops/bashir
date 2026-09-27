import { normalizeBarcode } from "./barcode";

export type PastedProductRow = {
  barcode: string;
  nameAr: string;
  nameEn: string;
  brand: string;
  descriptionAr: string;
  descriptionEn: string;
  category: string;
  subcategory: string;
  tertiary: string;
};

function splitTableCells(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed || /^[\s|:-]+$/.test(trimmed)) return [];
  if (trimmed.includes("|")) {
    return trimmed
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
  }
  // Word / Excel paste
  if (trimmed.includes("\t")) {
    return trimmed.split("\t").map((c) => c.trim());
  }
  // Word sometimes uses 2+ spaces between columns
  if (/\S\s{2,}\S/.test(trimmed) && /\d{8,14}/.test(trimmed)) {
    return trimmed.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
  }
  return [trimmed];
}

type ColKey = keyof PastedProductRow;

const EMPTY_MAP: Record<ColKey, number> = {
  barcode: -1,
  nameAr: -1,
  nameEn: -1,
  brand: -1,
  descriptionAr: -1,
  descriptionEn: -1,
  category: -1,
  subcategory: -1,
  tertiary: -1,
};

function classifyHeaderCell(cell: string): ColKey | null {
  const c = cell.toLowerCase().replace(/\s+/g, " ").trim();
  if (!c) return null;
  if (/باركود|barcode|ean|upc/.test(c)) return "barcode";
  if (/وصف/.test(c) && /(إنكل|انك|engl|en\b)/.test(c)) return "descriptionEn";
  if (/وصف/.test(c) && /(عربي|arab|ar\b)/.test(c)) return "descriptionAr";
  if (/^وصف$|description/.test(c)) return "descriptionAr";
  if (/ثانوي|tertiary|ثالث/.test(c)) return "tertiary";
  if (/فرعي|sub\s*categor|subsection/.test(c)) return "subcategory";
  if (/^القسم$|^قسم$|categor(y|ies)|section/.test(c) && !/فرعي|ثانوي|sub|tert/.test(c)) {
    return "category";
  }
  if (/براند|brand|ماركة|علامة/.test(c)) return "brand";
  if (/اسم/.test(c) && /(إنكل|انك|engl|en\b)/.test(c)) return "nameEn";
  if (/اسم/.test(c) && /(عربي|arab|ar\b)/.test(c)) return "nameAr";
  if (/name\s*en|english\s*name/.test(c)) return "nameEn";
  if (/name\s*ar|arabic\s*name|^name$/.test(c)) return "nameAr";
  return null;
}

function isHeaderRow(cells: string[]): boolean {
  let hits = 0;
  for (const cell of cells) {
    if (classifyHeaderCell(cell)) hits += 1;
  }
  return hits >= 2;
}

function detectColumnMap(headerCells: string[]): Record<ColKey, number> {
  const map = { ...EMPTY_MAP };
  headerCells.forEach((cell, i) => {
    const key = classifyHeaderCell(cell);
    if (key && map[key] < 0) map[key] = i;
  });
  // Sensible defaults for the documented GPT layout when headers are weak
  if (map.barcode < 0) map.barcode = 0;
  if (map.nameAr < 0) map.nameAr = 1;
  if (map.nameEn < 0) map.nameEn = 2;
  if (map.brand < 0) map.brand = 3;
  if (map.descriptionAr < 0) map.descriptionAr = 4;
  if (map.descriptionEn < 0) map.descriptionEn = 5;
  if (map.category < 0) map.category = 6;
  if (map.subcategory < 0) map.subcategory = 7;
  if (map.tertiary < 0) map.tertiary = 8;
  return map;
}

function cellAt(cells: string[], index: number): string {
  if (index < 0 || index >= cells.length) return "";
  return String(cells[index] ?? "")
    .replace(/[`*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse a GPT / Excel / Markdown product table paste.
 * Expected columns (Arabic headers OK):
 * barcode | nameAr | nameEn | brand | descriptionAr | descriptionEn | category | subcategory | tertiary
 */
export function parseProductTablePaste(raw: string): PastedProductRow[] {
  const text = String(raw ?? "").trim();
  if (!text) return [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let colMap = { ...EMPTY_MAP };
  let headerSeen = false;
  const out: PastedProductRow[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (/^\|?[\s|:-]+\|?$/.test(line)) continue;
    const cells = splitTableCells(line);
    if (!cells.length) continue;

    if (!headerSeen && isHeaderRow(cells)) {
      colMap = detectColumnMap(cells);
      headerSeen = true;
      continue;
    }

    if (!headerSeen) {
      colMap = detectColumnMap([]);
      headerSeen = true;
    }

    let barcode = normalizeBarcode(cellAt(cells, colMap.barcode));
    if (barcode.length < 8) {
      const m = line.match(/\b(\d{8,14})\b/);
      barcode = m ? normalizeBarcode(m[1]) : "";
    }
    if (barcode.length < 8 || seen.has(barcode)) continue;

    const nameAr = cellAt(cells, colMap.nameAr);
    const nameEn = cellAt(cells, colMap.nameEn);
    if (!nameAr && !nameEn) continue;

    seen.add(barcode);
    out.push({
      barcode,
      nameAr,
      nameEn,
      brand: cellAt(cells, colMap.brand),
      descriptionAr: cellAt(cells, colMap.descriptionAr),
      descriptionEn: cellAt(cells, colMap.descriptionEn),
      category: cellAt(cells, colMap.category),
      subcategory: cellAt(cells, colMap.subcategory),
      tertiary: cellAt(cells, colMap.tertiary),
    });
  }

  return out;
}

/** Split multi-value cells like "الخدود، الهايلايتر" or "A, B". */
export function splitLabelList(raw: string): string[] {
  return String(raw ?? "")
    .split(/[،,;|/]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
