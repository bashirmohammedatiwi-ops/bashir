/**
 * Strict barcode matching — reject wrong products, accept only verified hits.
 */
import { barcodeMatches, normalizeBarcodeQuery, normalizeGtinCompare } from './gtin.js';

export const MATCH = {
  PRODUCT: 'product',
  SHADE: 'shade',
  HINT: 'hint',
  INDEX: 'lookup',
  NONE: 'none',
};

const MIN_HINT_SCORE = 18;

function isIndexSourcedHit(hit) {
  const src = String(hit.source || '').toLowerCase();
  const mt = String(hit.matchType || '').toLowerCase();
  return (
    src.includes('index')
    || src.includes('lookup')
    || src.includes('catalog-thumb')
    || src.includes('catalog-scan')
    || src.includes('faces-index')
    || src.includes('unified')
    || src.includes('local')
    || src.includes('verified')
    || src.includes('meta-verified')
    || mt === 'lookup'
    || mt === 'shade'
  );
}

export function verifyBarcodeOnProduct(product, barcode) {
  const digits = normalizeBarcodeQuery(barcode);
  if (!digits || !product) return { ok: false, shadeName: '', matchType: MATCH.NONE };

  const productBc = String(product.barcode || '').replace(/\D/g, '');
  if (barcodeMatches(productBc, digits)) {
    return { ok: true, shadeName: '', matchType: MATCH.PRODUCT };
  }

  for (const shade of product.shades || []) {
    const sbc = String(shade.barcode || shade.ean || '').replace(/\D/g, '');
    if (barcodeMatches(sbc, digits)) {
      return {
        ok: true,
        shadeName: shade.nameAr || shade.name || shade.nameEn || '',
        matchType: MATCH.SHADE,
      };
    }
  }

  return { ok: false, shadeName: '', matchType: MATCH.NONE };
}

export function hitHasBarcodeField(hit, barcode) {
  const digits = normalizeBarcodeQuery(barcode);
  if (!digits || !hit) return false;

  const bc = String(hit.barcode || '').replace(/\D/g, '');
  if (barcodeMatches(bc, digits)) return true;

  const hay = JSON.stringify({
    sku: hit.sku,
    id: hit.id,
    shadeName: hit.shadeName,
  }).replace(/\D/g, '');
  return hay.includes(normalizeGtinCompare(digits));
}

/** Accept index/lookup hits that came from verified sources */
export function isTrustedMatchType(matchType = '') {
  const t = String(matchType || '').toLowerCase();
  return t === 'product' || t === 'shade' || t === 'lookup' || t === 'variant' || t === 'index';
}

export function acceptSearchHit(hit, barcode, { strict = true } = {}) {
  if (!hit?.id && !hit?.sku) return false;
  const digits = normalizeBarcodeQuery(barcode);
  if (!digits) return false;

  const matchType = String(hit.matchType || '').toLowerCase();
  const src = String(hit.source || '').toLowerCase();

  // نتائج الفهرس مفتاحها الباركود — لا تُرفض لغياب حقل barcode في الـ payload
  if (isIndexSourcedHit(hit) && (hit.id || hit.sku)) {
    if (!strict || hitHasBarcodeField(hit, digits) || src.includes('index') || src.includes('lookup')) {
      return true;
    }
  }

  if (matchType === 'live' || matchType === 'live-detail' || src === 'live') {
    if (hitHasBarcodeField(hit, digits)) return true;
  }

  if (isTrustedMatchType(matchType) && hitHasBarcodeField(hit, digits)) {
    return true;
  }

  if (matchType === 'hint') {
    const score = Number(hit.matchScore) || 0;
    return !strict || score >= MIN_HINT_SCORE;
  }

  if (!strict) return true;

  // Reject generic text-search hits without barcode proof
  if (matchType === 'typesense' || matchType === 'search' || matchType === 'text') {
    return false;
  }

  return hitHasBarcodeField(hit, digits);
}

export function filterStrictHits(hits = [], barcode, opts = {}) {
  return hits.filter((h) => acceptSearchHit(h, barcode, opts));
}

export function dedupeHits(hits = []) {
  const seen = new Set();
  const out = [];
  for (const h of hits) {
    const key = `${h.store || ''}:${h.id || h.sku || ''}:${h.shadeName || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(h);
  }
  return out;
}

export function sortHitsStable(hits = []) {
  const rank = {
    shade: 5,
    product: 4,
    lookup: 3,
    variant: 3,
    hint: 1,
    search: 0,
    typesense: 0,
  };
  return [...hits].sort((a, b) => {
    const ra = rank[String(a.matchType || '').toLowerCase()] ?? 2;
    const rb = rank[String(b.matchType || '').toLowerCase()] ?? 2;
    if (rb !== ra) return rb - ra;
    const sa = Number(a.matchScore) || 0;
    const sb = Number(b.matchScore) || 0;
    if (sb !== sa) return sb - sa;
    return (b.shadeCount || 0) - (a.shadeCount || 0);
  });
}
