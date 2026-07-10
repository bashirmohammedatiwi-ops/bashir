/**
 * مسح خلفي خفيف لباركودات مسواگ — جمال / عطور / عناية فقط
 * ─────────────────────────────────────────────────────────
 * يفلتر Typesense على أقسام L1 ذات صلة، يجلب باركود v2 للمنتج
 * وكل درجة لون، ويحفظها في barcode-index.json.
 */

import { typesenseSearch } from './client.js';
import {
  fetchV2Detail,
  fetchV2BarcodesForIds,
  extractAllBarcodesFromV2Detail,
} from './v2-barcode.js';
import { upsertBarcodeIndex, findBarcodesForProduct } from '../../core/barcode-index.js';
import { isValidEan } from './ids.js';

const PAGE_SIZE = 100;
const CONCURRENCY = 3;
const BATCH_SIZE = 12;
const BATCH_PAUSE_MS = 800;
const BREAKER_WAIT_MS = 65_000;

/** أقسام L1 — عطور، جمال، عناية شخصية (لا ملابس/إلكترونيات) */
const BEAUTY_L1 = ['beauty', 'perfumes', 'personal-care', 'fragrances'];
const BEAUTY_FILTER = `(${BEAUTY_L1.map((a) => `l1_division_alias:=\`${a}\``).join(' || ')})`;

/** حالة المسح — مرئية عبر endpoint الحالة */
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

function parseTypesenseVariations(doc = {}) {
  try {
    const raw = typeof doc.variations === 'string' ? JSON.parse(doc.variations) : doc.variations;
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function variationEan(v = {}) {
  for (const key of ['barcode', 'ean', 'upc', 'gtin']) {
    const d = String(v?.[key] || '').replace(/\D/g, '');
    if (isValidEan(d)) return d;
  }
  return '';
}

/**
 * فهرسة باركودات منتج واحد: v2 كامل + كل درجة لون
 */
async function indexProductBarcodes(hit) {
  const doc = hit?.document || hit || {};
  const id = String(doc.id || hit?.id || '').trim();
  if (!id) return 0;

  const seen = new Set();
  let added = 0;

  const saveBarcode = (barcode, shadeName = '') => {
    const digits = String(barcode || '').replace(/\D/g, '');
    if (!isValidEan(digits) || seen.has(digits)) return;
    upsertBarcodeIndex(digits, { store: 'miswag', productId: id, shadeName });
    seen.add(digits);
    added += 1;
  };

  try {
    const detail = await fetchV2Detail(id);
    if (detail) {
      for (const bc of extractAllBarcodesFromV2Detail(detail)) saveBarcode(bc);
    }

    const vars = parseTypesenseVariations(doc);
    const shadeIds = vars
      .map((v) => String(v.id || v.variation_id || '').trim())
      .filter((sid) => sid && sid !== id);

    const barcodeMap = await fetchV2BarcodesForIds([...new Set([id, ...shadeIds])], {
      concurrency: CONCURRENCY,
    });

    for (const [vid, bc] of barcodeMap) {
      const shade = vars.find((v) => String(v.id || v.variation_id) === vid);
      const shadeName = shade
        ? String(shade.title || shade.color || shade.name || '').trim()
        : '';
      saveBarcode(bc, shadeName);
    }

    for (const v of vars) {
      const embedded = variationEan(v);
      if (embedded) {
        saveBarcode(embedded, String(v.title || v.color || v.name || '').trim());
      }
    }

    scanState.scanned += 1;
  } catch (err) {
    const msg = String(err?.message || '');
    if (msg.includes('403 cooldown')) throw new Error('__breaker__');
    scanState.errors += 1;
  }

  return added;
}

async function processBatch(hits) {
  let added = 0;
  for (let i = 0; i < hits.length; i += CONCURRENCY) {
    if (abortFlag) break;
    const group = hits.slice(i, i + CONCURRENCY);
    try {
      const counts = await Promise.all(group.map((h) => indexProductBarcodes(h)));
      added += counts.reduce((a, b) => a + b, 0);
    } catch (err) {
      if (String(err?.message).includes('__breaker__')) throw err;
    }
  }
  return added;
}

/**
 * مسح أقسام الجمال/العطور/العناية فقط.
 */
export async function runBarcodeScan() {
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

      const pending = [];
      for (const h of hits) {
        const id = String(h.document?.id || '');
        if (!id) continue;
        if (findBarcodesForProduct('miswag', id).length > 0) {
          scanState.skipped += 1;
          continue;
        }
        pending.push(h);
      }

      for (let i = 0; i < pending.length; i += BATCH_SIZE) {
        if (abortFlag) { scanState.aborted = true; break; }
        const batch = pending.slice(i, i + BATCH_SIZE);
        try {
          const batchAdded = await processBatch(batch);
          scanState.cached += batchAdded;
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
  }

  return {
    status: scanState.aborted ? 'aborted' : 'done',
    ...scanState,
  };
}
