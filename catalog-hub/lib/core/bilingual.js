/** فصل نص ثنائي اللغة (عربي + إنجليزي في حقل واحد) */
function splitAtFirstLatin(raw = '') {
  const latinStart = raw.search(/[A-Za-z]/);
  if (latinStart <= 0) return null;
  const ar = raw.slice(0, latinStart).trim();
  const en = raw.slice(latinStart).trim();
  if (ar && en) return { ar, en };
  return null;
}

function splitTrailingLatin(raw = '') {
  const match = raw.match(/([A-Za-z][A-Za-z0-9\s.,'"/\-&]*(?:\d+[\d.]*\s*(?:ml|g|oz|fl oz))?)\s*$/i);
  if (!match) return null;
  const en = match[1].trim();
  const ar = raw.slice(0, raw.length - match[0].length).trim();
  if (ar && en && /[\u0600-\u06FF]/.test(ar) && !/[\u0600-\u06FF]/.test(en)) {
    return { ar, en };
  }
  return null;
}

export function splitBilingualText(text = '', { mode = 'name' } = {}) {
  if (text && typeof text === 'object') {
    const ar = String(text.AR || text.ar || '').trim();
    const en = String(text.EN || text.en || '').trim();
    if (ar || en) {
      if (ar && en) return { ar, en };
      if (ar) return { ar, en: splitBilingualText(ar, { mode }).en };
      return { ar: splitBilingualText(en, { mode }).ar, en };
    }
    return { ar: '', en: '' };
  }

  const raw = String(text || '').trim();
  if (!raw) return { ar: '', en: '' };

  const hasArabic = /[\u0600-\u06FF]/.test(raw);
  const hasLatin = /[A-Za-z]/.test(raw);

  if (hasArabic && hasLatin) {
    const simple = splitAtFirstLatin(raw);
    if (simple?.en && !/[\u0600-\u06FF]/.test(simple.en)) return simple;

    if (mode === 'name') {
      const trailing = splitTrailingLatin(raw);
      if (trailing) return trailing;
    }

    if (simple) return simple;
  }

  if (hasArabic && !hasLatin) return { ar: raw, en: '' };
  if (hasLatin && !hasArabic) return { ar: '', en: raw };
  return { ar: raw, en: raw };
}

function pickDistinct(parts = []) {
  const ar = parts.map((p) => p.ar).find(Boolean) || '';
  const en = parts.map((p) => p.en).find(Boolean) || '';
  return { ar, en };
}

/** دمج عدة مصادر للاسم — أولوية لحقلين منفصلين ثم الفصل الذكي */
export function resolveBilingualName(...sources) {
  const parts = [];

  for (const src of sources) {
    if (!src) continue;
    if (typeof src === 'object') {
      const ar = String(src.AR || src.ar || '').trim();
      const en = String(src.EN || src.en || '').trim();
      if (ar && en && ar !== en) return { ar, en };
      if (ar) parts.push(splitBilingualText(ar, { mode: 'name' }));
      if (en) parts.push(splitBilingualText(en, { mode: 'name' }));
      continue;
    }
    parts.push(splitBilingualText(src, { mode: 'name' }));
  }

  if (!parts.length) return { ar: '', en: '' };

  const merged = pickDistinct(parts);
  if (merged.ar && merged.en && merged.ar !== merged.en) return merged;

  const best = parts.find((p) => p.ar && p.en) || parts[0];
  return {
    ar: merged.ar || best.ar,
    en: merged.en || best.en,
  };
}

/** دمج أوصاف من عدة مصادر — لا نُجزّئ الوصف عند أسماء إنجليزية داخل النص العربي */
export function resolveBilingualDescription(...sources) {
  const raw = sources.map((s) => String(s || '').trim()).find(Boolean) || '';
  if (!raw) return { ar: '', en: '' };

  const split = splitBilingualText(raw, { mode: 'description' });
  const latinRatio = (split.en.match(/[A-Za-z]/g) || []).length;
  const arabicInEn = /[\u0600-\u06FF]/.test(split.en);

  if (split.ar && split.en && !arabicInEn && split.en.length >= 40 && latinRatio >= 20) {
    return split;
  }

  if (/[\u0600-\u06FF]/.test(raw)) return { ar: raw, en: '' };
  if (/[A-Za-z]/.test(raw)) return { ar: '', en: raw };
  return { ar: raw, en: '' };
}
