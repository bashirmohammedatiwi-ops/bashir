/**
 * معرّفات مسواگ — ملف صغير بلا تبعيات لتجنّب التعارض بين الوحدات.
 */

/** رقم مسواگ الداخلي (معرّف منتج/تدرج) — بادئة 17 فقط، وليس أي 9–10 أرقام */
export function isMiswagInternalId(value = '') {
  const d = String(value || '').replace(/\D/g, '');
  // معرّفات مسواگ الشائعة: 17xxxxxxxx (10 أرقام)
  return /^17\d{8}$/.test(d);
}

/** باركود EAN/UPC عالمي صالح للبحث */
export function isValidEan(value = '') {
  const d = String(value || '').replace(/\D/g, '');
  return /^\d{8,14}$/.test(d) && !isMiswagInternalId(d);
}
