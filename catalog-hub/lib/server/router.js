import { URL } from 'node:url';
import { sendJson } from './http.js';
import { handleHealth, handleStores, handleCatalogBrands } from './handlers/catalog.js';
import { handleStoreApi } from './handlers/store.js';
import { handleImportApi } from './handlers/store.js';

const PREFIX = (process.env.CATALOG_HUB_PUBLIC_PREFIX || '').replace(/\/$/, '');

function stripPrefix(pathname) {
  if (!PREFIX) return pathname;
  if (pathname === PREFIX || pathname === `${PREFIX}/`) return '/';
  if (pathname.startsWith(`${PREFIX}/`)) return pathname.slice(PREFIX.length);
  return pathname;
}

export async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const host = req.headers.host || 'localhost';
  const url = new URL(req.url || '/', `http://${host}`);
  url.pathname = stripPrefix(url.pathname);

  try {
    if (url.pathname === '/api/health') return handleHealth(req, res);
    if (url.pathname === '/api/catalog/stores') return handleStores(req, res);
    if (url.pathname === '/api/catalog/brands') return handleCatalogBrands(req, res, url);

    const storeHandled = await handleStoreApi(req, res, url);
    if (storeHandled !== false) return;

    const importHandled = await handleImportApi(req, res, url);
    if (importHandled !== false) return;

    return sendJson(res, 404, { error: 'Not found', path: url.pathname });
  } catch (err) {
    console.error('API error:', err);
    return sendJson(res, 500, { error: err.message || 'Internal error' });
  }
}
