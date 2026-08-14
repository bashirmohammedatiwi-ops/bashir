import { normalizeBarcode } from "./barcode";

export type PastedShadeRow = {
  barcode: string;
  name: string;
  code: string;
  colorHex: string;
};

const HEX_RE = /#?[0-9A-Fa-f]{6}\b/;
const BARCODE_RE = /\b(\d{8,14})\b/;

function normalizeHex(raw: string): string {
  const m = String(raw ?? "").match(HEX_RE);
  if (!m) return "";
  const h = m[0].replace(/^#/, "").toUpperCase();
  return h.length === 6 ? `#${h}` : "";
}

function extractCodeAndName(shadeCell: string): { code: string; name: string } {
  let s = String(shadeCell ?? "")
    .replace(/[`*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return { code: "", name: "" };

  // "21 – Glossy Nude" / "21 - Glossy Nude" / "21: Glossy Nude"
  const dashed = s.match(/^(\d{1,3})\s*[-–—:]\s*(.+)$/);
  if (dashed) {
    return { code: dashed[1], name: `${dashed[2].trim()} ${dashed[1]}`.replace(/\s+/g, " ").trim() };
  }

  // "Glossy Nude 21"
  const tail = s.match(/^(.+?)\s+(\d{1,3})$/);
  if (tail && !/ml|g|oz/i.test(tail[1])) {
    return { code: tail[2], name: `${tail[1].trim()} ${tail[2]}` };
  }

  const codeOnly = s.match(/^(\d{1,3})$/);
  if (codeOnly) return { code: codeOnly[1], name: `Shade ${codeOnly[1]}` };

  return { code: "", name: s };
}

function splitTableCells(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed || /^[\s|:-]+$/.test(trimmed)) return [];
  // Markdown row
  if (trimmed.includes("|")) {
    return trimmed
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
  }
  // TSV
  if (trimmed.includes("\t")) {
    return trimmed.split("\t").map((c) => c.trim());
  }
  // CSV-ish with commas (careful with shade names)
  if (/^\d{8,14}\s*[,;]/.test(trimmed)) {
    return trimmed.split(/[,;]/).map((c) => c.trim());
  }
  return [trimmed];
}

function isHeaderRow(cells: string[]): boolean {
  const blob = cells.join(" ").toLowerCase();
  return (
    /barcode|باركود|ean|upc/.test(blob) ||
    (/shade|تدرج|اسم/.test(blob) && /hex|لون|لون/.test(blob)) ||
    (/shade|تدرج/.test(blob) && /barcode|باركود/.test(blob))
  );
}

function detectColumnMap(headerCells: string[]): { barcode: number; shade: number; hex: number } {
  const map = { barcode: 0, shade: 1, hex: 2 };
  headerCells.forEach((cell, i) => {
    const c = cell.toLowerCase();
    if (/barcode|باركود|ean|upc/.test(c)) map.barcode = i;
    else if (/hex|لون|color|#/.test(c)) map.hex = i;
    else if (/shade|تدرج|اسم|name|color name/.test(c)) map.shade = i;
  });
  return map;
}

/**
 * Parse a GPT / Excel / Markdown shade table paste into structured rows.
 * Supports:
 * | barcode | Shade | HEX |
 * barcode\tshade\thex
 * barcode | 21 – Glossy Nude | #C98F7D
 */
export function parseShadeTablePaste(raw: string): PastedShadeRow[] {
  const text = String(raw ?? "").trim();
  if (!text) return [];

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let colMap = { barcode: 0, shade: 1, hex: 2 };
  let headerSeen = false;
  const out: PastedShadeRow[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    // Skip pure markdown separator
    if (/^\|?[\s|:-]+\|?$/.test(line)) continue;

    const cells = splitTableCells(line);
    if (!cells.length) continue;

    if (!headerSeen && isHeaderRow(cells)) {
      colMap = detectColumnMap(cells);
      headerSeen = true;
      continue;
    }

    // Prefer mapped cells; fall back to regex scan of the whole line
    let barcode = normalizeBarcode(cells[colMap.barcode] ?? "");
    let shadeCell = cells[colMap.shade] ?? "";
    let hexCell = cells[colMap.hex] ?? "";

    if (barcode.length < 8) {
      const m = line.match(BARCODE_RE);
      barcode = m ? normalizeBarcode(m[1]) : "";
    }
    if (barcode.length < 8 || seen.has(barcode)) continue;

    if (!shadeCell || HEX_RE.test(shadeCell) || /^\d{8,14}$/.test(shadeCell)) {
      // Find non-barcode, non-hex cell as shade
      shadeCell =
        cells.find(
          (c) =>
            c &&
            !/^\d{8,14}$/.test(normalizeBarcode(c)) &&
            !HEX_RE.test(c) &&
            !/^[-–—]+$/.test(c),
        ) ?? "";
    }
    if (!normalizeHex(hexCell)) {
      hexCell = cells.find((c) => HEX_RE.test(c)) ?? line.match(HEX_RE)?.[0] ?? "";
    }

    // If shade still empty, strip barcode+hex from line
    if (!shadeCell.trim()) {
      shadeCell = line
        .replace(BARCODE_RE, " ")
        .replace(HEX_RE, " ")
        .replace(/[|`]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    const { code, name } = extractCodeAndName(shadeCell);
    const colorHex = normalizeHex(hexCell) || "#CCCCCC";
    if (!name && !code) continue;

    seen.add(barcode);
    out.push({
      barcode,
      name: name || (code ? `Shade ${code}` : barcode),
      code,
      colorHex,
    });
  }

  return out;
}

export function pastedShadesToBarcodeList(rows: PastedShadeRow[]): string {
  return rows.map((r) => r.barcode).join("\n");
}

export function mergePastedShadesIntoRows<T extends { barcode: string; name: string; code: string; colorHex: string }>(
  rows: T[],
  pasted: PastedShadeRow[],
): T[] {
  if (!pasted.length) return rows;
  const byBc = new Map(pasted.map((p) => [p.barcode, p] as const));
  return rows.map((row) => {
    const hit = byBc.get(row.barcode);
    if (!hit) return row;
    return {
      ...row,
      name: hit.name || row.name,
      code: hit.code || row.code,
      colorHex: hit.colorHex && hit.colorHex !== "#CCCCCC" ? hit.colorHex : row.colorHex,
    };
  });
}
