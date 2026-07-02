import fs from 'fs';
import path from 'path';
import { MIME } from './http.js';
import { STORES } from '../stores/registry.js';

export function buildAppPrefixes(viewerRoot) {
  return STORES.map((s) => [s.path.replace(/\/$/, ''), path.join(viewerRoot, s.id)]);
}

export function serveStatic(viewerRoot, req, res, urlPath) {
  const prefixes = buildAppPrefixes(viewerRoot);
  let root = viewerRoot;
  let relative = urlPath;

  for (const [prefix, dir] of prefixes) {
    if (urlPath === prefix || urlPath.startsWith(`${prefix}/`)) {
      root = dir;
      relative = urlPath.slice(prefix.length) || '/';
      break;
    }
  }

  if (relative === '/') relative = '/index.html';
  const file = path.join(root, relative);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end('Not found');
  }
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

export function serveShared(viewerRoot, res, relPath) {
  const file = path.join(viewerRoot, 'shared', relPath);
  const sharedRoot = path.join(viewerRoot, 'shared');
  if (!file.startsWith(sharedRoot) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end('Not found');
  }
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}
