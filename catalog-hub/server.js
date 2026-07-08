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
});
