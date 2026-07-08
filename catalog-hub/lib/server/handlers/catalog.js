import { sendJson } from '../http.js';
import { listStores } from '../../stores/registry.js';

export async function handleHealth(req, res) {
  return sendJson(res, 200, {
    ok: true,
    service: 'catalog-hub',
    version: '2.0.0',
    stores: listStores().map((s) => s.id),
  });
}

export async function handleStores(req, res) {
  return sendJson(res, 200, { stores: listStores() });
}
