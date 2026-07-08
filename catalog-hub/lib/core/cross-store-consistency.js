/**
 * Cross-store consensus — drop hits that contradict verified results from other stores.
 */
import { buildMetaFromSearchHits, scoreStoreHintMatch } from '../barcodes.js';

const ANCHOR_STORES = new Set(['amazon', 'orisdi', 'elryan', 'niceone', 'faces', 'miraaya', 'najd']);

function isAnchorHit(hit) {
  if (!hit?.store) return false;
  const mt = String(hit.matchType || '').toLowerCase();
  const score = Number(hit.matchScore) || 0;
  const src = String(hit.source || '').toLowerCase();
  if (mt === 'hint' && score < 28) return false;
  if (ANCHOR_STORES.has(hit.store) && (mt === 'product' || mt === 'shade' || score >= 22)) return true;
  if (src.includes('verified') || src.includes('live')) return score >= 18;
  return false;
}

/** Build product identity from the strongest hits across stores. */
export function buildSearchConsensusMeta(hits = []) {
  const anchors = (hits || []).filter(isAnchorHit);
  if (!anchors.length) return null;
  return buildMetaFromSearchHits(anchors);
}

export function hitAlignsWithConsensus(hit, consensus) {
  if (!consensus?.brand && !consensus?.title) return true;
  const score = scoreStoreHintMatch(
    {
      name: hit.name,
      nameEn: hit.nameEn,
      manufacturer: hit.manufacturer,
      manufacturerEn: hit.manufacturerEn,
      shadeName: hit.shadeName,
    },
    consensus,
  );
  return score >= 10;
}

const STRICT_STORES = new Set(['miswag']);

/**
 * Remove hits that contradict the consensus product identity.
 */
export function filterCrossStoreInconsistentHits(hits = []) {
  const list = hits || [];
  const consensus = buildSearchConsensusMeta(list);
  if (!consensus?.brand && !consensus?.title) return list;

  const anchors = list.filter(isAnchorHit);
  if (anchors.length < 2) {
    // مع متجر مرجعي واحد فقط — صفِّ المتاجر الضعيفة (مسواگ)
    return list.filter((hit) => {
      if (!STRICT_STORES.has(hit.store)) return true;
      const mt = String(hit.matchType || '').toLowerCase();
      const score = Number(hit.matchScore) || 0;
      const src = String(hit.source || '').toLowerCase();
      if (!hitAlignsWithConsensus(hit, consensus)) return false;
      if (src.includes('verified-raw') || src === 'id') return false;
      if (mt === 'hint' && score < 30) return false;
      return true;
    });
  }

  return list.filter((hit) => {
    const mt = String(hit.matchType || '').toLowerCase();
    const score = Number(hit.matchScore) || 0;
    const src = String(hit.source || '').toLowerCase();

    if (mt === 'shade' && score >= 25) return hitAlignsWithConsensus(hit, consensus);
    if (mt === 'product' && score >= 28 && src.includes('verified')) {
      return hitAlignsWithConsensus(hit, consensus);
    }

    if (mt === 'hint' || src.includes('meta-hint') || score < 28) {
      return hitAlignsWithConsensus(hit, consensus) && score >= 14;
    }

    if (!hitAlignsWithConsensus(hit, consensus)) return false;
    if (STRICT_STORES.has(hit.store) && score < 25) return false;
    return true;
  });
}
