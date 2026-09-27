import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { GptMinimalResearch, GptUsage } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, "../../data/gpt-barcode-cache");

export type CachedMinimalResearch = {
  barcode: string;
  researched_at: string;
  model: string;
  research: GptMinimalResearch;
  usage: GptUsage;
};

function cachePath(barcode: string): string {
  return join(CACHE_DIR, `${barcode}.json`);
}

export function readCache(barcode: string): CachedMinimalResearch | null {
  const path = cachePath(barcode);
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as CachedMinimalResearch & {
      research?: { barcode?: string; brand_ar?: string };
    };
    // Legacy full-research cache — not usable for minimal flow
    if (raw.research && "brand_ar" in raw.research && !("representative_barcode" in raw.research)) {
      return null;
    }
    return raw as CachedMinimalResearch;
  } catch {
    return null;
  }
}

export function writeCache(entry: CachedMinimalResearch): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath(entry.barcode), JSON.stringify(entry, null, 2), "utf8");
}
