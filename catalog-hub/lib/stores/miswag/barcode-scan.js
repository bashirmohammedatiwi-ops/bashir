/**
 * مسح خلفي لباركودات مسواگ — جمال / عطور / عناية
 * يستخدم harvestMiswagProductBarcodes لجمع كل EAN من v1 + v2 + Typesense
 */

import { typesenseSearch } from './client.js';
import { harvestMiswagProductBarcodes } from './barcode-harvest.js';
import { countMiswagBarcodeIndexEntries } from '../../core/barcode-index.js';

const PAGE_SIZE = 100;
const CONCURRENCY = 1;
const BATCH_SIZE = 6;
const BATCH_PAUSE_MS = 1500;
const BREAKER_WAIT_MS = 65_000;
const MAX_RETRY_PASSES = 6;

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
  incomplete: 0,
  errors: 0,
  retried: 0,
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
    if (result.incomplete) scanState.incomplete += 1;
    scanState.scanned += 1;
    return { added: result.count || 0, skipped: false };
  } catch (err) {
    const msg = String(err?.message || '');
    if (msg.includes('403 cooldown')) {
      return { added: 0, skipped: false, breaker: true, hit };
    }
    scanState.errors += 1;
    return { added: 0, skipped: false };
  }
}

/**
 * @returns {{ added: number, skipped: number, retryHits: Array, breaker: boolean }}
 */
async function processBatch(hits, { force = false, startAt = 0 } = {}) {
  let added = 0;
  let skipped = 0;
  const retryHits = [];

  for (let i = startAt; i < hits.length; i += CONCURRENCY) {
    if (abortFlag) break;
    const group = hits.slice(i, i + CONCURRENCY);
    const results = await Promise.all(group.map((h) => harvestHit(h, { force })));

    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      if (r.breaker) {
        retryHits.push(group[j], ...hits.slice(i + j + 1));
        scanState.retried += retryHits.length;
        return { added, skipped, retryHits, breaker: true };
      }
      added += r.added;
      if (r.skipped) skipped += 1;
    }
  }

  return { added, skipped, retryHits, breaker: false };
}

async function drainRetryQueue(queue, { force = false } = {}) {
  let passes = 0;

  while (queue.length && passes < MAX_RETRY_PASSES && !abortFlag) {
    passes += 1;
    const pending = [...queue];
    queue.length = 0;

    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      if (abortFlag) break;
      const batch = pending.slice(i, i + BATCH_SIZE);
      const { added, skipped, retryHits, breaker } = await processBatch(batch, { force });
      scanState.cached += added;
      scanState.skipped += skipped;
      scanState.indexTotal = countMiswagBarcodeIndexEntries();

      if (breaker) {
        queue.push(...retryHits);
        await pause(BREAKER_WAIT_MS);
        break;
      }
      await pause(BATCH_PAUSE_MS);
    }
  }
}

/**
 * @param {{ force?: boolean }} opts — force=true يعيد حصاد المنتجات المفهرسة سابقاً
 */
export async function runBarcodeScan({ force = false } = {}) {
  if (scanState.running) return { status: 'already_running' };

  abortFlag = false;
  const retryQueue = [];

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
    incomplete: 0,
    errors: 0,
    retried: 0,
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
        const { added, skipped, retryHits, breaker } = await processBatch(batch, { force });
        scanState.cached += added;
        scanState.skipped += skipped;
        scanState.indexTotal = countMiswagBarcodeIndexEntries();

        if (breaker) {
          retryQueue.push(...retryHits);
          await pause(BREAKER_WAIT_MS);
        }
        await pause(BATCH_PAUSE_MS);
      }

      scanState.pagesDone = page;
    }

    if (retryQueue.length && !abortFlag) {
      await drainRetryQueue(retryQueue, { force });
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
