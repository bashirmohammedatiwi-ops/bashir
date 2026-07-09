import { createServer } from 'node:http';
import { handleRequest } from './lib/server/router.js';

const PORT = Number(process.env.PORT) || 10000;
const HOST = process.env.HOST || '0.0.0.0';

const server = createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error('Unhandled:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Internal error' }));
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`catalog-hub listening on http://${HOST}:${PORT}`);

  import('./lib/stores/miswag/catalog-index.js')
    .then(({ enrichMiswagCatalogFromBarcodeIndex, isMiswagCatalogWarm }) => {
      if (!isMiswagCatalogWarm(30)) return;
      const n = enrichMiswagCatalogFromBarcodeIndex();
      if (n) console.log(`[miswag] enriched ${n} products with barcode-index`);
    })
    .catch(() => {});

  import('./lib/stores/miswag/barcode-harvest.js')
    .then(({ ensureMiswagBarcodeHarvestAfterCatalog }) => {
      const r = ensureMiswagBarcodeHarvestAfterCatalog();
      if (r?.started) console.log('[miswag] auto-started barcode harvest for beauty');
    })
    .catch(() => {});

  // أمازون: الزحف التلقائي معطّل افتراضياً حتى لا يبطّئ مسواگ وباقي المتاجر.
  // فعّله يدوياً: AMAZON_AUTO_CRAWL=1 أو POST /api/catalog/amazon/crawl
  if (process.env.AMAZON_AUTO_CRAWL === '1') {
    import('./lib/stores/amazon/crawl.js')
      .then(({ ensureAmazonCatalogWarm }) => {
        const result = ensureAmazonCatalogWarm();
        if (result?.started) {
          console.log('[amazon] بدأ زحف فهرس Beauty في الخلفية');
        }
      })
      .catch(() => {});
  }
});
