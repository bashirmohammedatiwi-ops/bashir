/** صور افتراضية/عامة في متجر ساره — تظهر على منتجات كثيرة بدون صورة حقيقية */
export const SARAH_DEFAULT_IMAGE_KEYS = new Set([
  '7lfuVrbiGBhWQkR49uvVqDMBE7fsiumef3oL2uAB',
  'qJsxfhKvISxhNxNgFJYq4vvLchO7m76yCebfbLbs',
  '71SYm3sgMHUA0jTslKFkSoVxD5sjDatCekbP7D42',
]);

export function sallaImageKey(url = '') {
  return String(url).match(/mvKj\/([A-Za-z0-9]+)/)?.[1] || '';
}

export function isSarahDefaultImage(url = '') {
  const key = sallaImageKey(url);
  return key ? SARAH_DEFAULT_IMAGE_KEYS.has(key) : false;
}

export function isJunkImageUrl(url = '') {
  const u = String(url).toLowerCase();
  return !u.startsWith('http')
    || /\s/.test(u)
    || /\/swatch\//i.test(u)
    || /placeholder|no[_-]?image|data:image/i.test(u);
}

/** تصفية صور سلا: إزالة الافتراضية والروابط غير الصالحة */
export function filterSallaImages(urls = []) {
  const seen = new Set();
  const out = [];
  for (const raw of urls) {
    const url = String(raw || '').trim();
    if (!url || isJunkImageUrl(url) || isSarahDefaultImage(url)) continue;
    const key = sallaImageKey(url) || url;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(url);
  }
  return out;
}
