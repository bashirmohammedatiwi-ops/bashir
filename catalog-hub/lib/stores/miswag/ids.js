/**
 * معرّفات مسواگ — ملف صغير بلا تبعيات لتجنّب التعارض بين الوحدات.
 */
import { isValidGtinCheckDigit } from '../../core/gtin.js';

/** رقم مسواگ الداخلي (معرّف منتج/تدرج) — بادئة 17 فقط، وليس أي 9–10 أرقام */
export function isMiswagInternalId(value = '') {
  const d = String(value || '').replace(/\D/g, '');
  // معرّفات مسواگ الشائعة: 17xxxxxxxx (10 أرقام)
  return /^17\d{8}$/.test(d);
}

/**
 * باركود EAN/UPC عالمي صالح — طول صحيح + رقم تحقق (check digit) صحيح.
 * هذا يمنع اعتماد أي حقل رقمي عرضي (مثل معرّف داخلي) كباركود حقيقي:
 * الباركودات الحقيقية دائماً تحقّق معادلة GS1 لرقم التحقق.
 */
export function isValidEan(value = '') {
  const d = String(value || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(d)) return false;
  if (isMiswagInternalId(d)) return false;
  return isValidGtinCheckDigit(d);
}
