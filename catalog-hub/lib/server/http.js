export const CACHE_MS = 30 * 60 * 1000;

export const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function sendJson(res, code, data) {
  if (res.headersSent || res.writableEnded) return;
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...corsHeaders(),
  });
  res.end(JSON.stringify(data));
}

export function sendSseEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function startSseResponse(res) {
  res.writeHead(200, {
    ...corsHeaders(),
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');
}

export function parseQuery(url) {
  const q = {};
  for (const [k, v] of url.searchParams) q[k] = v;
  return q;
}

export function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export function pageLimit(q, fallback = 30, max = 60) {
  return Math.min(Number(q.limit) || fallback, max);
}

export function pageNum(q) {
  return Number(q.page) || 1;
}
