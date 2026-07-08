import {
  corsHeaders,
  sendJson,
  sendSseEvent,
  startSseResponse,
  parseQuery,
} from '../http.js';
import { searchBarcodeAllStores, searchBarcodeAllStoresStreaming } from '../../barcode-search.js';
import { STORES } from '../../stores/registry.js';
import {
  searchImportByBarcode,
  searchImportByBarcodeStream,
  fetchImportProduct,
  fetchImportSummary,
} from '../../catalog-import.js';

function parseHintHits(q) {
  if (!q.hints) return [];
  try {
    return JSON.parse(decodeURIComponent(q.hints));
  } catch {
    return [];
  }
}

function parseStoreFilter(q) {
  const store = q.store || '';
  return store ? store.split(',').map((s) => s.trim()).filter(Boolean) : null;
}

export async function handleCrossStoreApi(req, res, url, { port }) {
  if (url.pathname === '/api/stores') {
    return sendJson(res, 200, { stores: STORES, total: STORES.length });
  }

  if (url.pathname === '/api/import/search/stream') {
    try {
      const q = parseQuery(url);
      startSseResponse(res);
      await searchImportByBarcodeStream(q.q || q.barcode || '', (event) => {
        sendSseEvent(res, event.type, event);
      }, { stores: parseStoreFilter(q), hintHits: parseHintHits(q), refresh: q.refresh === '1' || q.refresh === 'true' });
      res.end();
    } catch (err) {
      console.error('Import search stream error:', err.message);
      if (!res.headersSent) return sendJson(res, 502, { error: err.message });
      sendSseEvent(res, 'error', { error: err.message });
      res.end();
    }
    return true;
  }

  if (url.pathname === '/api/import/search') {
    try {
      const q = parseQuery(url);
      const data = await searchImportByBarcode(q.q || q.barcode || '', {
        fast: q.fast === '1' || q.fast === 'true',
        stores: parseStoreFilter(q),
        hintHits: parseHintHits(q),
        refresh: q.refresh === '1' || q.refresh === 'true',
      });
      if (data.error) return sendJson(res, 400, data);
      return sendJson(res, 200, data);
    } catch (err) {
      console.error('Import search error:', err.message);
      return sendJson(res, 502, { error: err.message });
    }
  }

  if (url.pathname === '/api/import/product') {
    try {
      const q = parseQuery(url);
      const hubOrigin = q.hubOrigin || `http://${req.headers.host || `localhost:${port}`}`;
      const data = await fetchImportProduct(q.store || '', q.id || q.sourceId || '', {
        hubOrigin,
        barcode: q.barcode || '',
      });
      if (data.error) return sendJson(res, 404, data);
      return sendJson(res, 200, data);
    } catch (err) {
      console.error('Import product error:', err.message);
      return sendJson(res, 502, { error: err.message });
    }
  }

  if (url.pathname === '/api/import/summary') {
    try {
      const q = parseQuery(url);
      const hubOrigin = q.hubOrigin || `http://${req.headers.host || `localhost:${port}`}`;
      const data = await fetchImportSummary(q.store || '', q.id || q.sourceId || '', {
        hubOrigin,
        barcode: q.barcode || '',
      });
      if (data.error) return sendJson(res, 404, data);
      return sendJson(res, 200, data);
    } catch (err) {
      console.error('Import summary error:', err.message);
      return sendJson(res, 502, { error: err.message });
    }
  }

  if (url.pathname === '/api/search/barcode/stream') {
    try {
      const q = parseQuery(url);
      startSseResponse(res);
      await searchBarcodeAllStoresStreaming(q.q || q.barcode || '', (event) => {
        sendSseEvent(res, event.type, event);
      });
      res.end();
    } catch (err) {
      console.error('Barcode search stream error:', err.message);
      if (!res.headersSent) return sendJson(res, 502, { error: err.message });
      sendSseEvent(res, 'error', { error: err.message });
      res.end();
    }
    return true;
  }

  if (url.pathname === '/api/search/barcode') {
    try {
      const q = parseQuery(url);
      const data = await searchBarcodeAllStores(q.q || q.barcode || '');
      if (data.error) return sendJson(res, 400, data);
      return sendJson(res, 200, data);
    } catch (err) {
      console.error('Barcode search error:', err.message);
      return sendJson(res, 502, { error: err.message });
    }
  }

  return false;
}
