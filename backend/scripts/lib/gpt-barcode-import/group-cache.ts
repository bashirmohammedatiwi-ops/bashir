import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { GptMinimalResearch, GptUsage } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, "../../data/gpt-variant-group-cache");

export type GroupCacheEntry = {
  group_key: string;
  representative_barcode: string;
  researched_at: string;
  model: string;
  research: GptMinimalResearch;
  usage: GptUsage;
};

function hashKey(groupKey: string): string {
  return createHash("sha256").update(groupKey).digest("hex").slice(0, 16);
}

function cachePath(groupKey: string): string {
  return join(CACHE_DIR, `${hashKey(groupKey)}.json`);
}

export function readGroupCache(groupKey: string): GroupCacheEntry | null {
  const path = cachePath(groupKey);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as GroupCacheEntry;
  } catch {
    return null;
  }
}

export function writeGroupCache(entry: GroupCacheEntry): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath(entry.group_key), JSON.stringify(entry, null, 2), "utf8");
}

export function buildGroupKey(parts: string[]): string {
  return parts.map((p) => p.trim().toLowerCase()).filter(Boolean).join("|");
}
