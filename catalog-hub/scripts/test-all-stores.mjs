#!/usr/bin/env node
/**
 * اختبار شامل لكل متاجر catalog-hub
 * الاستخدام: node scripts/test-all-stores.mjs [baseUrl]
 */
const BASE = process.argv[2] || 'http://localhost:10000';

const STORES = [
  { id: 'niceone', health: '/api/health', products: '/api/categories/foundation/products?page=1&limit=2', search: '/api/search?q=lipstick&limit=2' },
  { id: 'elryan', health: '/api/elryan/health', products: '/api/elryan/categories', search: '/api/elryan/search?q=perfume&limit=2', skipSearchTimeout: true },
  { id: 'miraaya', health: '/api/miraaya/health', products: '/api/miraaya/categories', search: '/api/miraaya/search?q=makeup&limit=2' },
  { id: 'faces', health: '/api/faces/health', products: '/api/faces/categories', search: null },
  { id: 'amazon', health: '/api/amazon/health', products: '/api/amazon/categories/3777761/products?page=1&limit=2', search: '/api/amazon/search?q=foundation&limit=2' },
  { id: 'miswag', health: '/api/miswag/health', products: '/api/miswag/search?q=foundation&limit=2', search: '/api/miswag/search?q=foundation&limit=2', detailFromSearch: true },
  { id: 'orisdi', health: '/api/orisdi/health', products: '/api/orisdi/categories', search: '/api/orisdi/search?q=perfume&limit=2' },
  { id: 'beautyway', health: '/api/beautyway/health', products: '/api/beautyway/categories', search: '/api/beautyway/search?q=perfume&limit=2' },
  { id: 'vaneersa', health: '/api/vaneersa/health', products: '/api/vaneersa/categories', search: '/api/vaneersa/search?q=makeup&limit=2' },
  { id: 'najd', health: '/api/najd/health', products: '/api/najd/categories', search: '/api/najd/search?q=perfume&limit=2' },
];

async function fetchJson(path, { timeoutMs = 90000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { _raw: text.slice(0, 200) }; }
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

function countProducts(data) {
  return data.products?.length ?? data.items?.length ?? data.tree?.length ?? 0;
}

let failed = 0;

console.log(`\nCatalog Hub Test Suite — ${BASE}\n${'='.repeat(50)}`);

for (const store of STORES) {
  process.stdout.write(`\n[${store.id}] `);
  const health = await fetchJson(store.health, { timeoutMs: 15000 });
  if (!health.ok) {
    console.log(`FAIL health ${health.status}`);
    failed += 1;
    continue;
  }
  process.stdout.write('health OK · ');

  const prod = await fetchJson(store.products, { timeoutMs: 120000 });
  const prodCount = prod.ok ? countProducts(prod.data) : 0;
  if (!prod.ok) {
    console.log(`FAIL products ${prod.status} ${prod.data?.error || ''}`);
    failed += 1;
    continue;
  }
  process.stdout.write(`products ${prodCount} · `);

  if (store.search) {
    const search = await fetchJson(store.search, { timeoutMs: 90000 });
    const searchCount = search.ok ? countProducts(search.data) : 0;
    if (!search.ok) {
      console.log(`FAIL search ${search.status}`);
      failed += 1;
      continue;
    }
    process.stdout.write(`search ${searchCount} · `);
  }

  // Miswag detail + shades
  if (store.id === 'miswag' && prod.data?.products?.[0]?.id) {
    const pid = prod.data.products[0].id;
    const detail = await fetchJson(`/api/miswag/products/${pid}`, { timeoutMs: 60000 });
    const shades = detail.data?.product?.shades?.length ?? 0;
    process.stdout.write(`detail shades=${shades} · `);
  }

  console.log('OK');
}

// Cross-store barcode
console.log('\n[barcode] ');
const bc = await fetchJson('/api/search/barcode?q=3348901571449', { timeoutMs: 180000 });
if (!bc.ok) {
  console.log(`FAIL ${bc.status}`);
  failed += 1;
} else {
  const stores = [...new Set((bc.data.results || []).map((r) => r.store))];
  console.log(`OK ${bc.data.results?.length || 0} results from ${stores.length} stores: ${stores.join(', ')}`);
  if (stores.length < 3) failed += 1;
}

// Viewer pages
console.log('\n[viewers] ');
for (const path of ['/', '/niceone/', '/miswag/', '/amazon/', '/shared/catalog-app.js']) {
  try {
    const res = await fetch(`${BASE}${path}`);
    const ok = res.ok;
    console.log(`${ok ? 'OK' : 'FAIL'} ${path} (${res.status})`);
    if (!ok) failed += 1;
  } catch (err) {
    console.log(`FAIL ${path} (${err.message})`);
    failed += 1;
  }
}

console.log(`\n${'='.repeat(50)}`);
console.log(failed ? `FAILED: ${failed} issue(s)` : 'ALL TESTS PASSED');
process.exit(failed ? 1 : 0);
