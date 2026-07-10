/**
 * مسح خلفي لباركودات مسواگ — جمال / عطور / عناية
 * يستخدم harvestMiswagProductBarcodes لجمع كل EAN من v1 + v2 + Typesense
 */

import { typesenseSearch } from './client.js';
import { harvestMiswagProductBarcodes } from './barcode-harvest.js';
import { countMiswagBarcodeIndexEntries } from '../../core/barcode-index.js';

const PAGE_SIZE = 100;
const CONCURRENCY = 2;
const BATCH_SIZE = 8;
const BATCH_PAUSE_MS = 1000;
const BREAKER_WAIT_MS = 65_000;

const BEAUTY_L1 = ['beauty', 'perfumes', 'personal-care', 'fragrances'];
const BEAUTY_FILTER = `(${BEAUTY_L1.map((a) => `l1_division_alias:=\`${a}\``).join(' || ')})`;

export const scanState = {
  running: false,
  scope: 'beauty',
  startedAt: null,
  pagesTotal: 0,
  pagesDone: 0,
  found: 0,
  scanned: 0,
  cached: 0,
  skipped: 0,
  errors: 0,
  indexTotal: 0,
  aborted: false,
  finishedAt: null,
};

let abortFlag = false;

export function abortScan() {
  abortFlag = true;
}

async function pause(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function harvestHit(hit, { force = false } = {}) {
  const doc = hit?.document || {};
  const id = String(doc.id || '').trim();
  if (!id) return { added: 0, skipped: false };

  try {
    const result = await harvestMiswagProductBarcodes(id, {
      typesenseDoc: doc,
      persist: true,
      force,
    });
    if (result.skipped) return { added: 0, skipped: true };
    scanState.scanned += 1;
    return { added: result.count || 0, skipped: false };
  } catch (err) {
    const msg = String(err?.message || '');
    if (msg.includes('403 cooldown')) throw new Error('__breaker__');
    scanState.errors += 1;
    return { added: 0, skipped: false };
  }
}

async function processBatch(hits, { force = false } = {}) {
  let added = 0;
  let skipped = 0;

  for (let i = 0; i < hits.length; i += CONCURRENCY) {
    if (abortFlag) break;
    const group = hits.slice(i, i + CONCURRENCY);
    try {
      const results = await Promise.all(group.map((h) => harvestHit(h, { force })));
      for (const r of results) {
        added += r.added;
        if (r.skipped) skipped += 1;
      }
    } catch (err) {
      if (String(err?.message).includes('__breaker__')) throw err;
    }
  }

  scanState.skipped += skipped;
  return added;
}

/**
 * @param {{ force?: boolean }} opts — force=true يعيد حصاد المنتجات المفهرسة سابقاً
 */
export async function runBarcodeScan({ force = false } = {}) {
  if (scanState.running) return { status: 'already_running' };

  abortFlag = false;
  Object.assign(scanState, {
    running: true,
    scope: 'beauty',
    startedAt: Date.now(),
    pagesTotal: 0,
    pagesDone: 0,
    found: 0,
    scanned: 0,
    cached: 0,
    skipped: 0,
    errors: 0,
    indexTotal: countMiswagBarcodeIndexEntries(),
    aborted: false,
    finishedAt: null,
  });

  try {
    const first = await typesenseSearch('*', {
      page: 1,
      perPage: 1,
      filterBy: BEAUTY_FILTER,
    }).catch(() => ({ found: 0 }));

    scanState.found = first.found || 0;
    scanState.pagesTotal = Math.ceil(scanState.found / PAGE_SIZE) || 0;

    for (let page = 1; page <= scanState.pagesTotal; page++) {
      if (abortFlag) { scanState.aborted = true; break; }

      const { hits = [] } = await typesenseSearch('*', {
        page,
        perPage: PAGE_SIZE,
        filterBy: BEAUTY_FILTER,
      }).catch(() => ({ hits: [] }));

      for (let i = 0; i < hits.length; i += BATCH_SIZE) {
        if (abortFlag) { scanState.aborted = true; break; }
        const batch = hits.slice(i, i + BATCH_SIZE);
        try {
          const batchAdded = await processBatch(batch, { force });
          scanState.cached += batchAdded;
          scanState.indexTotal = countMiswagBarcodeIndexEntries();
        } catch (err) {
          if (String(err?.message).includes('__breaker__')) {
            await pause(BREAKER_WAIT_MS);
          }
        }
        await pause(BATCH_PAUSE_MS);
      }

      scanState.pagesDone = page;
    }
  } catch {
    scanState.errors += 1;
  } finally {
    scanState.running = false;
    scanState.finishedAt = Date.now();
    scanState.indexTotal = countMiswagBarcodeIndexEntries();
  }

  return {
    status: scanState.aborted ? 'aborted' : 'done',
    ...scanState,
  };
}
