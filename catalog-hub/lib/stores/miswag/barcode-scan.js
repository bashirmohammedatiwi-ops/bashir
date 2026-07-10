/**
 * مسح خلفي خفيف لباركودات مسواگ
 * ────────────────────────────────
 * يمر على كل منتجات Typesense صفحةً بصفحة، يجلب باركود v2 لكل منتج لم يُفهرس
 * بعد، ويحفظه في barcode-index.json. بعد انتهاء المسح يصبح بحث الباركود
 * فورياً لكل المنتجات.
 *
 * معدّل الطلبات:
 *   - CONCURRENCY طلبات v2 متوازية كحدّ أقصى (دون المساس بالـ rate-gate العام)
 *   - BATCH_PAUSE_MS انتظار بين كل دفعة لتجنب 403
 *   - يتوقف تلقائياً عند فتح circuit-breaker ويستأنف بعد الانتظار
 */

import { typesenseSearch } from './client.js';
import { fetchV2Barcode } from './v2-barcode.js';
import { upsertBarcodeIndex, findBarcodesForProduct } from '../../core/barcode-index.js';
import { isValidEan } from './ids.js';

const PAGE_SIZE = 100;
const CONCURRENCY = 3;
const BATCH_SIZE = 15;
const BATCH_PAUSE_MS = 800;
const BREAKER_WAIT_MS = 65_000;

/** حالة المسح — مرئية عبر endpoint الحالة */
export const scanState = {
  running: false,
  startedAt: null,
  pagesTotal: 0,
  pagesDone: 0,
  found: 0,       // إجمالي منتجات Typesense
  scanned: 0,     // عدد المنتجات التي حُقق بها
  cached: 0,      // عدد الباركودات المحفوظة
  skipped: 0,     // تجاوزها (مفهرسة سابقاً)
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

/**
 * فحص دفعة من معرّفات المنتجات — يُعيد عدد الباركودات المُضافة
 */
async function processBatch(ids) {
  // تشغيل متوازٍ محدود بـ CONCURRENCY
  let added = 0;
  const slots = ids.map((id) => async () => {
    try {
      const barcode = await fetchV2Barcode(id);
      if (barcode && isValidEan(barcode)) {
        upsertBarcodeIndex(barcode, { store: 'miswag', productId: String(id) });
        added++;
      }
      scanState.scanned++;
    } catch (err) {
      const msg = String(err?.message || '');
      if (msg.includes('403 cooldown')) {
        // circuit breaker مفتوح — لا داعي لإحصاء كخطأ، انتظر
        throw new Error('__breaker__');
      }
      scanState.errors++;
    }
  });

  // تشغيل CONCURRENCY في آنٍ واحد
  for (let i = 0; i < slots.length; i += CONCURRENCY) {
    if (abortFlag) break;
    const group = slots.slice(i, i + CONCURRENCY).map((fn) => fn());
    await Promise.allSettled(group);
  }
  return added;
}

/**
 * ينطلق مسحاً كاملاً لكل منتجات مسواگ.
 * غير متزامن — المُستدعي يستلم الـ Promise ليتابع التقدم عبر scanState.
 */
export async function runBarcodeScan() {
  if (scanState.running) return { status: 'already_running' };

  abortFlag = false;
  Object.assign(scanState, {
    running: true,
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
    // ── مرحلة 1: اكتشاف العدد الكلي ──────────────────────────────────────
    const first = await typesenseSearch('*', { page: 1, perPage: 1 }).catch(() => ({ found: 0 }));
    scanState.found = first.found || 0;
    scanState.pagesTotal = Math.ceil(scanState.found / PAGE_SIZE);

    // ── مرحلة 2: المسح صفحةً بصفحة ──────────────────────────────────────
    for (let page = 1; page <= scanState.pagesTotal; page++) {
      if (abortFlag) { scanState.aborted = true; break; }

      const { hits = [] } = await typesenseSearch('*', {
        page,
        perPage: PAGE_SIZE,
      }).catch(() => ({ hits: [] }));

      // تجميع المعرّفات التي لم تُفهرس بعد
      const pending = [];
      for (const h of hits) {
        const id = String(h.document?.id || '');
        if (!id) continue;
        // تجاوز ما هو مفهرس مسبقاً
        if (findBarcodesForProduct('miswag', id).length > 0) {
          scanState.skipped++;
          continue;
        }
        pending.push(id);
      }

      // معالجة الدفعة
      for (let i = 0; i < pending.length; i += BATCH_SIZE) {
        if (abortFlag) { scanState.aborted = true; break; }
        const batch = pending.slice(i, i + BATCH_SIZE);
        try {
          const added = await processBatch(batch);
          scanState.cached += added;
        } catch (err) {
          if (String(err?.message).includes('__breaker__')) {
            // circuit breaker مفتوح — انتظر ثم استأنف
            await pause(BREAKER_WAIT_MS);
          }
        }
        await pause(BATCH_PAUSE_MS);
      }

      scanState.pagesDone = page;
    }
  } catch (err) {
    scanState.errors++;
  } finally {
    scanState.running = false;
    scanState.finishedAt = Date.now();
  }

  return {
    status: scanState.aborted ? 'aborted' : 'done',
    ...scanState,
  };
}
