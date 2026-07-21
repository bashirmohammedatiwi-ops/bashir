import { sendJson, parseQuery } from '../http.js';
import {
  getStoreAdapter,
  listStores,
  parseStoreIds,
  resolveStoreAdapters,
} from '../../stores/registry.js';
import { normalizeProduct, toImportPayload } from '../../core/product.js';
import { isMiswagInternalId } from '../../stores/miswag/ids.js';
import { runBarcodeScan, abortScan, scanState } from '../../stores/miswag/barcode-scan.js';

function storeOr404(res, storeId) {
  const adapter = getStoreAdapter(storeId);
  if (!adapter) {
    sendJson(res, 404, { error: `متجر غير معروف: ${storeId}` });
    return null;
  }
  return adapter;
}

function mapTextSearchHit(adapter, item) {
  return {
    store: adapter.id,
    storeLabel: adapter.label,
    id: item.id,
    sourceId: item.id,
    name: item.nameAr,
    nameAr: item.nameAr,
    nameEn: item.nameEn,
    brandAr: item.brandAr,
    manufacturer: item.brandAr,
    thumb: item.thumb,
    price: item.price,
    category: item.category,
    shadeCount: item.shadeCount,
    matchType: 'text',
  };
}

function mapBarcodeSearchHit(adapter, item, digits) {
  const parentAsin = String(item.parentAsin || item.id || '').toUpperCase();
  const listingAsin = String(item.listingAsin || '').toUpperCase();
  return {
    store: adapter.id,
    storeLabel: adapter.label,
    id: parentAsin,
    sourceId: parentAsin,
    parentAsin,
    listingAsin: listingAsin && listingAsin !== parentAsin ? listingAsin : undefined,
    name: item.nameAr,
    nameAr: item.nameAr,
    nameEn: item.nameEn,
    brandAr: item.brandAr,
    manufacturer: item.brandAr,
    thumb: item.thumb,
    price: item.price,
    shadeCount: item.shadeCount,
    shadeName: item.shadeName,
    matchedShadeName: item.matchedShadeName || item.shadeName,
    miswagId: item.miswagId || (isMiswagInternalId(digits) ? digits : ''),
    barcode: item.barcode || (isMiswagInternalId(digits) ? '' : digits),
    matchType: item.matchType || (isMiswagInternalId(digits) ? 'miswag_id' : 'ean'),
  };
}

function withTimeout(promise, ms, label = 'timeout') {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label)), ms);
    }),
  ]);
}

async function searchAdapter(adapter, query, digits) {
  let results = [];
  const isBarcodeish = digits.length >= 8;
  // مهلة لكل متجر — مسواگ يستعلم مصادر ميتاداتا خارجية بالتوازي مع v2، يحتاج وقتاً أطول قليلاً
  const barcodeBudget = {
    amazon: 55_000,
    miswag: 20_000,
    miraaya: 25_000,
    niceone: 40_000,
    orisdi: 28_000,
    waheteter: 20_000,
  }[adapter.id] ?? 12_000;

  const startedAt = Date.now();
  if (isBarcodeish && adapter.searchBarcode) {
    try {
      results = await withTimeout(
        adapter.searchBarcode(digits),
        barcodeBudget,
        `${adapter.id} barcode timeout`,
      );
    } catch {
      results = [];
    }
  }

  // إن فشل الباركود — بحث نصي احتياطي فقط للمتاجر التي تفعّله صراحةً
  // (بيوتي وي/ميرايا/غيرها: البحث النصي بالأرقام يُرجع نتائج خاطئة)
  const allowTextFallback = adapter.barcodeTextFallback === true;
  if (!results.length && allowTextFallback) {
    const elapsed = Date.now() - startedAt;
    // لا تتجاوز ~28ث إجمالي حتى لا تقطع الواجهة الطلب
    const textBudget = isBarcodeish
      ? Math.max(2_500, Math.min(8_000, 28_000 - elapsed))
      : (adapter.id === 'amazon' ? 18_000 : 12_000);
    if (textBudget >= 2_000) {
      try {
        const data = await withTimeout(
          adapter.searchProducts(query, { page: 1, limit: 20 }),
          textBudget,
          `${adapter.id} search timeout`,
        );
        if (data?.items?.length) {
          return {
            results: data.items.map((item) => mapTextSearchHit(adapter, item)),
            count: data.items.length,
          };
        }
      } catch {
        /* لا نتائج نصية */
      }
    }
  }

  return {
    results: results.map((item) => mapBarcodeSearchHit(adapter, item, digits)),
    count: results.length,
  };
}

async function searchAcrossStores(storeIds, query) {
  const adapters = resolveStoreAdapters(storeIds);
  if (!adapters.length) {
    return { results: [], stores: [] };
  }

  const digits = String(query || '').replace(/\D/g, '');
  const settled = await Promise.allSettled(
    adapters.map((adapter) => searchAdapter(adapter, query, digits)),
  );

  const results = [];
  const stores = [];
  settled.forEach((entry, index) => {
    const adapter = adapters[index];
    if (entry.status === 'fulfilled') {
      results.push(...entry.value.results);
      stores.push({ id: adapter.id, label: adapter.label, count: entry.value.count });
    } else {
      stores.push({ id: adapter.id, label: adapter.label, count: 0, error: entry.reason?.message });
    }
  });

  return { results, stores };
}

export async function handleStoreApi(req, res, url) {
  const q = parseQuery(url);

  if (url.pathname === '/api/catalog/stores') {
    return sendJson(res, 200, { stores: listStores() });
  }

  const multiSearchMatch = url.pathname === '/api/catalog/search';
  if (multiSearchMatch) {
    const query = q.q || q.query || '';
    if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
    const storeIds = parseStoreIds(q.stores || q.store, { defaultAll: true });
    const page = Number(q.page) || 1;
    const limit = Math.min(Number(q.limit) || 30, 60);

    try {
      const { results, stores } = await searchAcrossStores(storeIds, query);
      const start = (page - 1) * limit;
      const products = results.slice(start, start + limit);
      return sendJson(res, 200, {
        meta: { query, page, limit, stores: storeIds },
        products,
        page,
        limit,
        total: results.length,
        hasMore: start + limit < results.length,
        stores,
      });
    } catch (err) {
      return sendJson(res, 502, { error: err.message });
    }
  }

  const storeMatch = url.pathname.match(/^\/api\/catalog\/([^/]+)\/health$/);
  if (storeMatch) {
    const adapter = storeOr404(res, storeMatch[1]);
    if (!adapter) return;
    try {
      const status = await adapter.health();
      return sendJson(res, 200, { store: adapter.id, ...status });
    } catch (err) {
      return sendJson(res, 502, { error: err.message });
    }
  }

  // زحف/تحميل الفهرس المحلي (أمازون فقط)
  const crawlMatch = url.pathname.match(/^\/api\/catalog\/([^/]+)\/crawl$/);
  if (crawlMatch) {
    const adapter = storeOr404(res, crawlMatch[1]);
    if (!adapter) return;
    if (!adapter.startCatalogCrawl) {
      return sendJson(res, 400, { error: 'التحميل المحلي غير متاح لهذا المتجر' });
    }
    try {
      if (req.method === 'POST') {
        const force = q.force === '1' || q.force === 'true';
        const resume = q.resume !== '0' && q.resume !== 'false';
        const result = adapter.startCatalogCrawl({ force, resume });
        return sendJson(res, 200, { store: adapter.id, ...result });
      }
      if (req.method === 'DELETE') {
        return sendJson(res, 200, { store: adapter.id, ...adapter.stopCatalogCrawl() });
      }
      return sendJson(res, 200, { store: adapter.id, ...adapter.getCatalogStatus() });
    } catch (err) {
      return sendJson(res, 502, { error: err.message });
    }
  }

  const catMatch = url.pathname.match(/^\/api\/catalog\/([^/]+)\/categories$/);
  if (catMatch) {
    const adapter = storeOr404(res, catMatch[1]);
    if (!adapter) return;
    try {
      const tree = await adapter.fetchCategoryTree();
      return sendJson(res, 200, { ...tree, totalLeaves: tree.leaves?.length || 0 });
    } catch (err) {
      return sendJson(res, 502, { error: err.message });
    }
  }

  const catProdMatch = url.pathname.match(/^\/api\/catalog\/([^/]+)\/categories\/([^/]+)\/products$/);
  if (catProdMatch) {
    const adapter = storeOr404(res, catProdMatch[1]);
    if (!adapter) return;
    const categoryId = decodeURIComponent(catProdMatch[2]);
    const page = Number(q.page) || 1;
    const limit = Math.min(Number(q.limit) || 30, 60);
    const sort = q.sort || 'default';
    try {
      const data = await adapter.listCategoryProducts(categoryId, { page, limit, sort });
      return sendJson(res, 200, {
        meta: { categoryId, page, limit, sort },
        products: data.items,
        page: data.page,
        limit: data.pageSize,
        hasMore: data.hasMore,
        total: data.total,
        softBlocked: data.softBlocked || false,
        message: data.message || undefined,
      });
    } catch (err) {
      // أمازون captcha: لا تُرجع 502 — قائمة فارغة بهدوء
      if (adapter.id === 'amazon' && /captcha|حظر|تهدئة/i.test(String(err.message || ''))) {
        return sendJson(res, 200, {
          meta: { categoryId, page, limit, sort },
          products: [],
          page,
          limit,
          hasMore: false,
          total: 0,
          softBlocked: true,
          message: 'Amazon محدود مؤقتاً — جرّب بعد دقيقة أو استخدم متجراً آخر',
        });
      }
      return sendJson(res, 502, { error: err.message });
    }
  }

  const searchMatch = url.pathname.match(/^\/api\/catalog\/([^/]+)\/search$/);
  if (searchMatch) {
    const adapter = storeOr404(res, searchMatch[1]);
    if (!adapter) return;
    const query = q.q || q.query || '';
    if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
    const page = Number(q.page) || 1;
    const limit = Math.min(Number(q.limit) || 30, 60);
    const categoryId = q.category || q.categoryId || '';
    try {
      const data = await adapter.searchProducts(query, { page, limit, categoryId });
      let products = data.items;
      const sort = q.sort || 'default';
      if (sort !== 'default' && adapter.sortProductsClient) {
        products = adapter.sortProductsClient(products, sort);
      }
      return sendJson(res, 200, {
        meta: { query, page, limit, categoryId: categoryId || undefined },
        products,
        page: data.page,
        limit: data.pageSize,
        hasMore: data.hasMore,
        total: data.total,
      });
    } catch (err) {
      return sendJson(res, 502, { error: err.message });
    }
  }

  // مسار باركود لكل متجر على حدة — لا يمر عبر البحث النصي ولا يخلط المتاجر
  const barcodeMatch = url.pathname.match(/^\/api\/catalog\/([^/]+)\/barcode$/);
  if (barcodeMatch) {
    const adapter = storeOr404(res, barcodeMatch[1]);
    if (!adapter) return;
    const query = q.q || q.query || q.barcode || '';
    if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
    if (!adapter.searchBarcode) {
      return sendJson(res, 400, { error: `المتجر ${adapter.id} لا يدعم البحث بالباركود` });
    }
    try {
      const digits = String(query).replace(/\D/g, '');
      const results = await adapter.searchBarcode(query);
      return sendJson(res, 200, {
        store: adapter.id,
        storeLabel: adapter.label,
        query,
        results: results.map((item) => mapBarcodeSearchHit(adapter, item, digits)),
        count: results.length,
      });
    } catch (err) {
      return sendJson(res, 502, { error: err.message });
    }
  }

  // يدعم أرقام مسواگ/نجد و ASIN أمازون (مثل B0XXXX)
  const productMatch = url.pathname.match(/^\/api\/catalog\/([^/]+)\/products\/([A-Za-z0-9_-]+)$/);
  if (productMatch) {
    const adapter = storeOr404(res, productMatch[1]);
    if (!adapter) return;
    const id = decodeURIComponent(productMatch[2]);
    const light = q.light === '1' || q.light === 'true';
    try {
      const raw = await adapter.fetchProductDetail(id, { light });
      if (!raw?.id) return sendJson(res, 404, { error: 'Product not found' });
      const product = toImportPayload({ ...raw, store: adapter.id, storeLabel: adapter.label });
      return sendJson(res, 200, { product });
    } catch (err) {
      return sendJson(res, 502, { error: err.message });
    }
  }

  return false;
}

export async function handleImportApi(req, res, url) {
  const q = parseQuery(url);

  const productMatch = url.pathname.match(/^\/api\/import\/([^/]+)\/products\/([A-Za-z0-9_-]+)$/);
  if (productMatch) {
    const adapter = getStoreAdapter(productMatch[1]);
    if (!adapter) return sendJson(res, 404, { error: 'متجر غير معروف' });
    const id = decodeURIComponent(productMatch[2]);
    try {
      const raw = await adapter.fetchProductDetail(id, { light: false });
      if (!raw?.id) {
        // أمازون: البطاقة قد تظهر من البحث بينما التفاصيل تفشل مؤقتاً (كابتشا)
        const softMsg = adapter.id === 'amazon'
          ? 'تعذّر تحميل تفاصيل أمازون مؤقتاً — أعد المحاولة بعد لحظات'
          : 'لم يُعثر على المنتج';
        return sendJson(res, 404, { error: softMsg });
      }
      const product = toImportPayload({ ...raw, store: adapter.id, storeLabel: adapter.label });
      return sendJson(res, 200, { product });
    } catch (err) {
      const softMsg = adapter.id === 'amazon'
        ? `تعذّر تحميل تفاصيل أمازون: ${err.message || 'خطأ مؤقت'}`
        : err.message;
      return sendJson(res, 502, { error: softMsg });
    }
  }

  const searchMatch = url.pathname === '/api/import/search';
  if (searchMatch) {
    const query = q.q || q.barcode || '';
    if (!query.trim()) return sendJson(res, 400, { error: 'أدخل باركود EAN أو نص بحث' });

    const storeIds = parseStoreIds(q.stores || q.store, { defaultAll: false });
    if (!storeIds.length) {
      return sendJson(res, 400, { error: 'حدد متجراً واحداً على الأقل' });
    }

    try {
      const { results, stores } = await searchAcrossStores(storeIds, query);
      return sendJson(res, 200, { query, results, stores });
    } catch (err) {
      return sendJson(res, 502, { error: err.message });
    }
  }

  return false;
}

/**
 * POST /api/stores/miswag/scan-barcodes       — ابدأ المسح في الخلفية
 * DELETE /api/stores/miswag/scan-barcodes     — أوقف المسح
 * GET    /api/stores/miswag/scan-barcodes     — حالة المسح
 */
export async function handleMiswagScan(req, res, url) {
  if (!url.pathname.startsWith('/api/stores/miswag/scan-barcodes')) return false;

  if (req.method === 'GET') {
    return sendJson(res, 200, { scan: scanState });
  }

  if (req.method === 'DELETE') {
    abortScan();
    return sendJson(res, 200, { message: 'طلب إيقاف المسح أُرسل' });
  }

  if (req.method === 'POST') {
    if (scanState.running) {
      return sendJson(res, 200, { message: 'المسح يعمل بالفعل', scan: scanState });
    }
    const force = url.searchParams.get('force') === '1' || url.searchParams.get('force') === 'true';
    runBarcodeScan({ force }).catch(() => {});
    return sendJson(res, 202, {
      message: force ? 'بدأ إعادة الحصاد الشامل' : 'بدأ المسح في الخلفية',
      scan: scanState,
    });
  }

  return false;
}
