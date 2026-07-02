import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { corsHeaders } from './http.js';
import { serveStatic, serveShared } from './static.js';
import { handleCrossStoreApi } from './handlers/cross-store.js';
import { handleNiceoneApi } from './handlers/niceone.js';
import { handleElryanApi } from './handlers/elryan.js';
import { handleMiraayaApi } from './handlers/miraaya.js';
import { handleFacesApi, loadFacesCategoryDiskCache } from './handlers/faces.js';
import { handleAmazonApi } from './handlers/amazon.js';
import { handleMiswagApi } from './handlers/miswag.js';
import { handleOrisdiApi } from './handlers/orisdi.js';
import { handleBeautywayApi } from './handlers/beautyway.js';
import { handleVaneersaApi } from './handlers/vaneersa.js';
import { handleNajdApi } from './handlers/najd.js';
import { warmupBarcodeSearch } from '../barcode-search.js';
import { warmupOrisdiFeed } from '../orisdi-api.js';
import { STORES } from '../stores/registry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_VIEWER = path.join(__dirname, '..', '..', 'viewer');

/** ترتيب المسارات: الأكثر تحديداً أولاً */
const API_ROUTES = [
  { prefix: '/api/faces/', handler: handleFacesApi },
  { prefix: '/api/amazon/', handler: handleAmazonApi },
  { prefix: '/api/miraaya/', handler: handleMiraayaApi },
  { prefix: '/api/elryan/', handler: handleElryanApi },
  { prefix: '/api/miswag/', handler: handleMiswagApi },
  { prefix: '/api/orisdi/', handler: handleOrisdiApi },
  { prefix: '/api/beautyway/', handler: handleBeautywayApi },
  { prefix: '/api/vaneersa/', handler: handleVaneersaApi },
  { prefix: '/api/najd/', handler: handleNajdApi },
  { prefix: '/api/', handler: handleNiceoneApi },
];

const STARTUP_LOG = {
  niceone: 'Nice One  → /niceone/  (api.niceonesa.com)',
  elryan: 'Elryan      → /elryan/   (elryan.com — عطور وتجميل · AR+EN)',
  miraaya: 'Miraaya     → /miraaya/  (miraaya.com)',
  faces: 'Faces       → /faces/    (faces.ae — الإمارات)',
  amazon: 'Amazon      → /amazon/   (amazon.com/sa — Cosmetics node 3760911 · AR+EN)',
  miswag: 'Miswag      → /miswag/   (miswag.com — الجمال والعناية · AR+EN)',
  orisdi: 'Orisdi      → /orisdi/   (orisdi.com — أورزدي · مكياج وعطور · AR+EN)',
  beautyway: 'Beauty Way  → /beautyway/ (beautyway-iq.com — بيوتي وي · عطور وتجميل · AR+EN)',
  vaneersa: 'Vaneersa    → /vaneersa/  (vaneersa.com — ڤانير · عناية ومكياج · AR+EN)',
  najd: 'Najd        → /najd/      (najdalatheyah.com — نجد العذية · عطور · Salla)',
};

export function createCatalogServer({
  port = Number(process.env.PORT) || 10000,
  host = process.env.HOST || '0.0.0.0',
  viewerRoot = process.env.VIEWER_ROOT || DEFAULT_VIEWER,
} = {}) {
  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders());
      return res.end();
    }

    const url = new URL(req.url, `http://localhost:${port}`);

    if (url.pathname.startsWith('/shared/')) {
      const rel = url.pathname.slice('/shared/'.length) || 'store-ui.css';
      return serveShared(viewerRoot, res, rel);
    }

    if (await handleCrossStoreApi(req, res, url, { port })) return;

    for (const route of API_ROUTES) {
      if (url.pathname.startsWith(route.prefix)) {
        return route.handler(req, res, url);
      }
    }

    return serveStatic(viewerRoot, req, res, decodeURIComponent(url.pathname));
  });

  loadFacesCategoryDiskCache();
  warmupBarcodeSearch();
  warmupOrisdiFeed();

  server.listen(port, host, () => {
    const displayHost = host === '0.0.0.0' ? 'localhost' : host;
    console.log(`Catalog Hub: http://${displayHost}:${port}`);
    for (const store of STORES) {
      const line = STARTUP_LOG[store.id];
      if (line) console.log(`  ${line}`);
    }
    console.log(`  Stores: ${STORES.length} active (Vanilla removed)`);
  });

  return server;
}
