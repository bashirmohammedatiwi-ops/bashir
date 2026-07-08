/**
 * معرّفات مسواگ — ملف صغير بلا تبعيات لتجنّب التعارض بين الوحدات.
 */

/** رقم مسواگ الداخلي (معرّف منتج/تدرج) — ليس باركود EAN عالمي */
export function isMiswagInternalId(value = '') {
  const d = String(value || '').replace(/\D/g, '');
  // 17xxxxxxxx أو 9–10 أرقام ليست EAN-13
  return /^17\d{8}$/.test(d) || (/^\d{9,10}$/.test(d) && !/^\d{13}$/.test(d));
}

/** باركود EAN/UPC عالمي صالح للبحث */
export function isValidEan(value = '') {
  const d = String(value || '').replace(/\D/g, '');
  return /^\d{8,14}$/.test(d) && !isMiswagInternalId(d);
}
