import { sendJson } from '../http.js';
import { listStores } from '../../stores/registry.js';
import { collectCatalogBrands } from '../../core/catalog-brands.js';

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

/** براندات موحّدة من كل متاجر الكتالوج (بدون تكرار) */
export async function handleCatalogBrands(req, res, url) {
  const force = url.searchParams.get('force') === '1' || url.searchParams.get('refresh') === '1';
  try {
    const data = await collectCatalogBrands({ force });
    return sendJson(res, 200, data);
  } catch (err) {
    return sendJson(res, 502, { error: err.message || 'فشل تجميع البراندات' });
  }
}
