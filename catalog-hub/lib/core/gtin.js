/** أدوات GTIN/EAN/UPC — تصحيح رقم التحقق وتوليد المتغيرات */

export function onlyDigits(value = '') {
  return String(value || '').replace(/\D/g, '');
}

export function gtinCheckDigit12(body11 = '') {
  const d = onlyDigits(body11).padStart(11, '0').slice(0, 11);
  let sum = 0;
  for (let i = 0; i < 11; i += 1) sum += Number(d[i]) * (i % 2 === 0 ? 3 : 1);
  return String((10 - (sum % 10)) % 10);
}

export function gtinCheckDigit13(body12 = '') {
  const d = onlyDigits(body12).padStart(12, '0').slice(0, 12);
  let sum = 0;
  for (let i = 0; i < 12; i += 1) sum += Number(d[i]) * (i % 2 === 0 ? 1 : 3);
  return String((10 - (sum % 10)) % 10);
}

export function isValidGtinCheckDigit(digits = '') {
  const d = onlyDigits(digits);
  if (d.length === 12) return gtinCheckDigit12(d.slice(0, 11)) === d.slice(-1);
  if (d.length === 13) return gtinCheckDigit13(d.slice(0, 12)) === d.slice(-1);
  if (d.length === 14) return isValidGtinCheckDigit(d.slice(1));
  if (d.length === 8) {
    // EAN-8
    let sum = 0;
    for (let i = 0; i < 7; i += 1) sum += Number(d[i]) * (i % 2 === 0 ? 3 : 1);
    return String((10 - (sum % 10)) % 10) === d.slice(-1);
  }
  return d.length >= 8 && d.length <= 14;
}

/** صحّح رقم التحقق إن كان خاطئاً */
export function correctGtinCheckDigit(digits = '') {
  const d = onlyDigits(digits);
  if (d.length === 12) return d.slice(0, 11) + gtinCheckDigit12(d.slice(0, 11));
  if (d.length === 13) return d.slice(0, 12) + gtinCheckDigit13(d.slice(0, 12));
  if (d.length === 14) return `0${correctGtinCheckDigit(d.slice(1))}`.slice(-14);
  return d;
}

/**
 * كل أشكال الباركود المحتملة للبحث:
 * الأصلي، بدون أصفار بادئة، مع صفر، ونسخة مصحّحة لرقم التحقق.
 */
export function barcodeSearchVariants(barcode = '') {
  const raw = onlyDigits(barcode);
  if (raw.length < 8 || raw.length > 14) return [];

  const out = [];
  const push = (v) => {
    const d = onlyDigits(v);
    if (d.length >= 8 && d.length <= 14 && !out.includes(d)) out.push(d);
  };

  push(raw);
  push(raw.replace(/^0+/, '') || raw);
  if (raw.length === 12) push(`0${raw}`);
  if (raw.length === 13 && raw.startsWith('0')) push(raw.slice(1));

  const corrected = correctGtinCheckDigit(raw);
  push(corrected);
  if (corrected.length === 12) push(`0${corrected}`);
  if (corrected.length === 13 && corrected.startsWith('0')) push(corrected.slice(1));

  // إن كان الأصلي غير صالح، قدّم المصحّح أولاً
  if (!isValidGtinCheckDigit(raw) && corrected !== raw) {
    return [corrected, ...out.filter((x) => x !== corrected)];
  }
  return out;
}
