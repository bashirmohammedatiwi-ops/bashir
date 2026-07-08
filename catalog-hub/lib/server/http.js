const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const PUBLIC_PREFIX = (process.env.CATALOG_HUB_PUBLIC_PREFIX || '').replace(/\/$/, '');

export function getPublicPrefix() {
  return PUBLIC_PREFIX;
}

export function parseQuery(url) {
  const out = {};
  for (const [k, v] of url.searchParams) {
    out[k] = v;
  }
  return out;
}

export function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

export function sendSse(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': CORS_ORIGIN,
  });
}

export function sseWrite(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
