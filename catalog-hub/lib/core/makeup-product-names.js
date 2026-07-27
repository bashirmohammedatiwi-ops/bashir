function cleanText(v = '') {
  return String(v).replace(/\s+/g, ' ').trim();
}

function stripHtml(v = '') {
  return cleanText(String(v).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' '));
}

function escapeRegExp(text = '') {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Remove brand prefix if product title already starts with it. */
export function stripBrandPrefix(brand = '', product = '') {
  const b = cleanText(brand);
  let p = cleanText(product);
  if (!b || !p) return p;

  const re = new RegExp(`^${escapeRegExp(b)}\\s*[-–—|:]?\\s*`, 'i');
  p = p.replace(re, '').trim();

  const bWords = b.split(/\s+/).filter(Boolean);
  if (bWords.length > 1) {
    const partial = new RegExp(`^${escapeRegExp(bWords.slice(0, 2).join(' '))}\\s*[-–—|:]?\\s*`, 'i');
    p = p.replace(partial, '').trim();
  }
  return p || cleanText(product);
}

/**
 * Build display names: Arabic "Brand - Product", English "Brand Product".
 * Uses Nice One copy when available; falls back to POS title.
 */
export function buildMakeupNames({
  brandAr = '',
  brandEn = '',
  productAr = '',
  productEn = '',
  posName = '',
} = {}) {
  const brandEnClean = cleanText(brandEn) || cleanText(brandAr);
  const brandArClean = cleanText(brandAr) || brandEnClean;

  let productEnClean = cleanText(productEn) || cleanText(posName);
  let productArClean = cleanText(productAr);

  productEnClean = stripBrandPrefix(brandEnClean, productEnClean);
  productArClean = stripBrandPrefix(brandArClean, productArClean || productEnClean);

  if (!productEnClean && productArClean) productEnClean = productArClean;
  if (!productArClean && productEnClean) productArClean = productEnClean;

  const nameEn = productEnClean
    ? cleanText(`${brandEnClean} ${productEnClean}`)
    : brandEnClean;
  const nameAr = productArClean
    ? cleanText(`${brandArClean} - ${productArClean}`)
    : brandArClean;

  return {
    brandAr: brandArClean,
    brandEn: brandEnClean,
    productAr: productArClean,
    productEn: productEnClean,
    nameAr,
    nameEn,
  };
}

export function isTrivialDescription(text = '') {
  const t = stripHtml(text);
  return t.length < 24;
}

export { cleanText, stripHtml };
