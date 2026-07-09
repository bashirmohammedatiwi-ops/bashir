import { miswagFetch } from './client.js';
import { listVariationIds } from './barcode-scan.js';
import { extractBarcodeFromV2Detail, isValidEan } from './v2-barcode.js';
import {
  bulkUpsertBarcodeIndex,
  findBarcodesForProduct,
  loadBarcodeIndex,
} from '../../core/barcode-index.js';
import {
  enrichMiswagCatalogFromBarcodeIndex,
  loadMiswagIndex,
  setMiswagCrawlMeta,
  upsertMiswagProducts,
} from './catalog-index.js';

let harvestPromise = null;
let stopRequested = false;

const RATE_MS = Math.max(120, Number(process.env.MISWAG_BARCODE_RATE_MS) || 180);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const limiter = {
  queue: Promise.resolve(),
  penalty: 0,
  consecutive403: 0,
  async run(fn) {
    const task = this.queue.then(async () => {
      if (this.penalty > 0) await sleep(this.penalty);
      await sleep(RATE_MS);
      return fn();
    });
    this.queue = task.then(() => {}, () => {});
    return task;
  },
  hit403() {
    this.consecutive403 += 1;
    this.penalty = Math.min(30_000, 1_000 * 2 ** Math.min(this.consecutive403, 5));
  },
  ok() {
    if (this.consecutive403 > 0) this.consecutive403 = 0;
    if (this.penalty > 0) this.penalty = Math.max(0, this.penalty - 500);
  },
};

async function pacedV2Barcode(id) {
  return limiter.run(async () => {
    try {
      const detail = await miswagFetch(`/content/v2/items/${encodeURIComponent(id)}`, {
        retries: 0,
        timeoutMs: 10_000,
      });
      limiter.ok();
      return extractBarcodeFromV2Detail(detail);
    } catch (err) {
      const msg = String(err?.message || '');
      if (/403|Forbidden|429/i.test(msg)) {
        limiter.hit403();
        throw new Error('throttled');
      }
      return '';
    }
  });
}

function defaultBarcodeHarvestMeta() {
  return {
    status: 'idle',
    done: 0,
    total: 0,
    added: 0,
    errors: 0,
    message: '',
    category: 'beauty',
    parentsOnly: false,
  };
}

export function getMiswagBarcodeHarvestStatus() {
  const index = loadMiswagIndex();
  const bh = { ...defaultBarcodeHarvestMeta(), ...(index.meta?.barcodeHarvest || {}) };
  const { entries } = loadBarcodeIndex();
  const miswagBarcodes = Object.values(entries).filter((e) => e?.store === 'miswag').length;
  return {
    ...bh,
    running: Boolean(harvestPromise),
    cursor: Number(index.barcodeHarvestCursor || 0),
    indexedBarcodes: miswagBarcodes,
  };
}

function setBarcodeHarvestMeta(patch = {}) {
  const index = loadMiswagIndex();
  index.meta = {
    ...index.meta,
    barcodeHarvest: {
      ...defaultBarcodeHarvestMeta(),
      ...(index.meta?.barcodeHarvest || {}),
      ...patch,
    },
  };
  setMiswagCrawlMeta({ barcodeHarvest: index.meta.barcodeHarvest });
}

function setBarcodeHarvestCursor(cursor = 0) {
  const index = loadMiswagIndex();
  index.barcodeHarvestCursor = Math.max(0, Number(cursor) || 0);
  setMiswagCrawlMeta({ barcodeHarvest: index.meta?.barcodeHarvest });
}

function productNeedsHarvest(product, { force = false } = {}) {
  if (force) return true;
  const pid = String(product?.id || '').trim();
  if (!pid) return false;
  const local = product.barcodes?.length || product.barcode;
  if (local) return false;
  return findBarcodesForProduct('miswag', pid).length === 0;
}

function listHarvestCandidates({ category = 'beauty', force = false } = {}) {
  const index = loadMiswagIndex();
  let products = Object.values(index.products || {});
  if (category && category !== 'all') {
    products = products.filter((p) =>
      p.l1_alias === category
      || (p.categoryIds || []).includes(category));
  }
  if (!force) {
    products = products.filter((p) => productNeedsHarvest(p, { force }));
  }
  return products.sort((a, b) => String(a.brandAr || '').localeCompare(String(b.brandAr || '')));
}

/** حصاد باركود منتج واحد (أب + تدرجات) عبر v2 */
export async function harvestMiswagProductBarcodes(product, { parentsOnly = false } = {}) {
  const pid = String(product?.id || product || '').trim();
  if (!pid) return { added: 0, barcodes: [] };

  const meta = typeof product === 'object' ? product : { id: pid };
  const rows = [];
  const barcodes = new Set();
  const base = {
    store: 'miswag',
    productId: pid,
    name: meta.nameAr || meta.name || '',
    brand: meta.brandAr || meta.brand || '',
  };

  const parentBc = await pacedV2Barcode(pid).catch(() => '');
  if (isValidEan(parentBc)) {
    rows.push({ ...base, barcode: parentBc, matchType: 'v2_scan' });
    barcodes.add(parentBc);
  }

  if (!parentsOnly) {
    const variations = await listVariationIds(pid).catch(() => []);
    for (const variation of variations) {
      const bc = await pacedV2Barcode(variation.id).catch(() => '');
      if (!isValidEan(bc)) continue;
      rows.push({
        ...base,
        barcode: bc,
        shadeName: variation.name || '',
        matchType: 'v2_shade',
      });
      barcodes.add(bc);
    }
  }

  if (rows.length) bulkUpsertBarcodeIndex(rows);

  if (barcodes.size) {
    upsertMiswagProducts([{
      id: pid,
      nameAr: meta.nameAr,
      brandAr: meta.brandAr,
      barcodes: [...barcodes],
      barcode: [...barcodes][0],
    }]);
  }

  return { added: rows.length, barcodes: [...barcodes] };
}

async function runBarcodeHarvestLoop({
  resume = true,
  force = false,
  parentsOnly = false,
  category = 'beauty',
} = {}) {
  stopRequested = false;
  const candidates = listHarvestCandidates({ category, force });
  let cursor = resume ? getMiswagBarcodeHarvestStatus().cursor : 0;
  if (!resume || force) setBarcodeHarvestCursor(0);
  if (!resume) cursor = 0;

  setBarcodeHarvestMeta({
    status: 'running',
    total: candidates.length,
    done: cursor,
    added: 0,
    errors: 0,
    category,
    parentsOnly,
    message: `جاري حصاد الباركودات — ${candidates.length.toLocaleString('ar-IQ')} منتج`,
  });

  let addedTotal = 0;
  let errors = 0;

  for (let i = cursor; i < candidates.length; i += 1) {
    if (stopRequested) {
      setBarcodeHarvestMeta({
        status: 'paused',
        done: i,
        added: addedTotal,
        errors,
        message: 'توقف حصاد الباركود مؤقتاً',
      });
      setBarcodeHarvestCursor(i);
      return getMiswagBarcodeHarvestStatus();
    }

    const product = candidates[i];
    try {
      const { added } = await harvestMiswagProductBarcodes(product, { parentsOnly });
      addedTotal += added;
    } catch (err) {
      errors += 1;
      if (String(err?.message || '').includes('throttled')) {
        setBarcodeHarvestMeta({
          done: i,
          added: addedTotal,
          errors,
          message: 'تباطؤ مؤقت من مسواگ — يستأنف تلقائياً',
        });
        await sleep(Math.max(2_000, limiter.penalty));
        i -= 1;
        continue;
      }
    }

    if ((i + 1) % 25 === 0) {
      enrichMiswagCatalogFromBarcodeIndex();
      setBarcodeHarvestMeta({
        done: i + 1,
        added: addedTotal,
        errors,
        message: `حصاد الباركود… ${(i + 1).toLocaleString('ar-IQ')}/${candidates.length.toLocaleString('ar-IQ')}`,
      });
    }

    setBarcodeHarvestCursor(i + 1);
  }

  const enriched = enrichMiswagCatalogFromBarcodeIndex();
  const { indexedBarcodes } = getMiswagBarcodeHarvestStatus();

  setBarcodeHarvestMeta({
    status: 'done',
    done: candidates.length,
    total: candidates.length,
    added: addedTotal,
    errors,
    message: `اكتمل — ${indexedBarcodes.toLocaleString('ar-IQ')} باركود مفهرس${enriched ? ` · ${enriched} منتج محدّث` : ''}`,
  });
  setBarcodeHarvestCursor(0);
  return getMiswagBarcodeHarvestStatus();
}

export function startMiswagBarcodeHarvest({
  resume = true,
  force = false,
  parentsOnly = false,
  category = 'beauty',
} = {}) {
  const stats = getMiswagBarcodeHarvestStatus();
  if (harvestPromise && !force) {
    return { started: false, reason: 'already_running', ...stats };
  }

  if (force) {
    setBarcodeHarvestCursor(0);
    resume = false;
  }

  harvestPromise = runBarcodeHarvestLoop({ resume, force, parentsOnly, category })
    .catch((err) => {
      setBarcodeHarvestMeta({
        status: 'error',
        message: err.message || 'فشل حصاد الباركود',
      });
      return getMiswagBarcodeHarvestStatus();
    })
    .finally(() => {
      harvestPromise = null;
    });

  return { started: true, ...getMiswagBarcodeHarvestStatus() };
}

export function stopMiswagBarcodeHarvest() {
  stopRequested = true;
  return getMiswagBarcodeHarvestStatus();
}

/** يبدأ تلقائياً بعد اكتمال تحميل الكتالوج */
export function ensureMiswagBarcodeHarvestAfterCatalog() {
  const index = loadMiswagIndex();
  const catalogDone = index.meta?.status === 'done';
  if (!catalogDone) return { started: false, reason: 'catalog_not_ready' };
  if (harvestPromise) return { started: false, reason: 'already_running' };

  const bh = index.meta?.barcodeHarvest || {};
  if (bh.status === 'running') return { started: false, reason: 'already_running' };

  const pending = listHarvestCandidates({ category: 'beauty', force: false });
  if (!pending.length) return { started: false, reason: 'nothing_pending' };

  const resume = bh.status === 'paused' || Number(index.barcodeHarvestCursor || 0) > 0;
  return startMiswagBarcodeHarvest({ resume, category: 'beauty', parentsOnly: false });
}
