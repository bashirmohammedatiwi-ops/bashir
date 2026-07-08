/**
 * Final hit filtering — one best result per store, drop weak hints.
 */
import { sortHitsStable, dedupeHits } from './match.js';
import { filterCrossStoreInconsistentHits } from './cross-store-consistency.js';

const MATCH_RANK = {
  shade: 50,
  product: 40,
  lookup: 35,
  variant: 35,
  live: 30,
  'catalog-scan': 28,
  'live-detail': 28,
  hint: 10,
};

function hitScore(hit) {
  const mt = String(hit.matchType || '').toLowerCase();
  const base = MATCH_RANK[mt] ?? 20;
  const ms = Number(hit.matchScore) || 0;
  const shadeBonus = (hit.shadeCount || 0) > 0 ? 3 : 0;
  const thumbBonus = hit.thumb ? 2 : 0;
  return base + ms + shadeBonus + thumbBonus;
}

/** Keep the single best hit per store; drop hints below minHintScore unless nothing else exists. */
export function pickBestHitPerStore(hits = [], { minHintScore = 18 } = {}) {
  const ranked = sortHitsStable(dedupeHits(filterCrossStoreInconsistentHits(hits)));
  const byStore = new Map();

  for (const hit of ranked) {
    const store = hit.store;
    if (!store) continue;
    const mt = String(hit.matchType || '').toLowerCase();
    const src = String(hit.source || '').toLowerCase();
    const trusted = mt === 'product' || mt === 'shade' || mt === 'lookup' || mt === 'variant'
      || src.includes('lookup') || src.includes('index') || src.includes('verified');
    const score = hitScore(hit);

    if (mt === 'hint' && !trusted && (Number(hit.matchScore) || 0) < minHintScore) continue;

    const prev = byStore.get(store);
    if (!prev || score > hitScore(prev)) {
      byStore.set(store, hit);
    }
  }

  // If store only had weak hints, allow top hint as fallback
  for (const hit of ranked) {
    const store = hit.store;
    if (!store || byStore.has(store)) continue;
    if (String(hit.matchType || '').toLowerCase() === 'hint' && (hit.matchScore || 0) >= 12) {
      byStore.set(store, hit);
    }
  }

  return sortHitsStable([...byStore.values()]);
}
