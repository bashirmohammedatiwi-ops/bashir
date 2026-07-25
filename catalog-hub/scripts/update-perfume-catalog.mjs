#!/usr/bin/env node
import { CATEGORY_ID, PERFUME_UPDATES } from './perfume-catalog-updates.mjs';

const API_BASE = (process.env.API_BASE || 'http://187.127.88.146/api/v1').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alhayaa.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '000000';

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || json?.message || res.statusText);
  return json?.data ?? json;
}

async function main() {
  const token = (await api('/auth/login', { method: 'POST', body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })).accessToken;

  const barcodeToId = new Map();
  for (let page = 1; page <= 30; page++) {
    const items = await api(`/products?limit=100&page=${page}`, { token });
    if (!items?.length) break;
    for (const p of items) {
      if (p.barcode) barcodeToId.set(p.barcode, p.id);
    }
  }

  let ok = 0;
  let missing = 0;
  for (const u of PERFUME_UPDATES) {
    const id = barcodeToId.get(u.barcode);
    if (!id) {
      missing += 1;
      console.error('MISSING', u.barcode);
      continue;
    }
    const body = {
      categoryId: CATEGORY_ID,
      subcategoryIds: [...new Set(u.subcategoryIds)],
      tertiaryCategoryIds: [],
      description: u.descriptionAr,
      descriptionAr: u.descriptionAr,
      descriptionEn: u.descriptionEn,
      ...(u.isNew !== undefined ? { isNew: u.isNew } : {}),
    };
    try {
      await api(`/products/${id}`, { method: 'PATCH', token, body });
      ok += 1;
      console.log('OK', u.barcode);
    } catch (err) {
      console.error('FAIL', u.barcode, err.message);
    }
  }

  console.log(`\nUpdated ${ok}/${PERFUME_UPDATES.length} (${missing} missing)`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
