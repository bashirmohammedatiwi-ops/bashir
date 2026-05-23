import * as fs from "fs";
import * as path from "path";
import { normalizeBarcode } from "./barcode";
import { SyncItem } from "./pricing";

export type SyncStateEntry = {
  price: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
};

export type SyncStateMap = Record<string, SyncStateEntry>;

function stateFile(userData: string) {
  return path.join(userData, "last-sync-state.json");
}

function syncSignature(item: SyncItem | SyncStateEntry): string {
  return `${item.price}|${item.originalPrice}|${item.discountPercent}|${item.stock}`;
}

export function dedupeSyncItems(items: SyncItem[]): SyncItem[] {
  const byBarcode = new Map<string, SyncItem>();
  for (const item of items) {
    byBarcode.set(normalizeBarcode(item.barcode), item);
  }
  return [...byBarcode.values()];
}

export function buildSyncState(items: SyncItem[]): SyncStateMap {
  const state: SyncStateMap = {};
  for (const item of items) {
    state[normalizeBarcode(item.barcode)] = {
      price: item.price,
      originalPrice: item.originalPrice,
      discountPercent: item.discountPercent,
      stock: item.stock,
    };
  }
  return state;
}

export function filterChangedItems(items: SyncItem[], previous: SyncStateMap): SyncItem[] {
  return items.filter((item) => {
    const key = normalizeBarcode(item.barcode);
    const prev = previous[key];
    if (!prev) return true;
    return syncSignature(item) !== syncSignature(prev);
  });
}

export function mergeSyncState(previous: SyncStateMap, items: SyncItem[]): SyncStateMap {
  const next = { ...previous };
  for (const item of items) {
    next[normalizeBarcode(item.barcode)] = {
      price: item.price,
      originalPrice: item.originalPrice,
      discountPercent: item.discountPercent,
      stock: item.stock,
    };
  }
  return next;
}

export function loadSyncState(userData: string): SyncStateMap {
  try {
    const file = stateFile(userData);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8")) as SyncStateMap;
    }
  } catch {
    /* ignore corrupt state */
  }
  return {};
}

export function saveSyncState(userData: string, state: SyncStateMap) {
  const file = stateFile(userData);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state), "utf8");
  fs.renameSync(tmp, file);
}

export function countSyncState(state: SyncStateMap) {
  return Object.keys(state).length;
}
