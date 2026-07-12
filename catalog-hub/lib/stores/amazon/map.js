import { splitBilingualText } from '../../core/bilingual.js';

function textOf(node) {
  if (node == null) return '';
  if (typeof node === 'string') return node.trim();
  if (typeof node?.DisplayValue === 'string') return node.DisplayValue.trim();
  if (typeof node?.Label === 'string') return node.Label.trim();
  return '';
}

function firstImage(item = {}) {
  return (
    item.Images?.Primary?.Large?.URL ||
    item.Images?.Variants?.[0]?.Large?.URL ||
    item.Images?.Primary?.Medium?.URL ||
    ''
  );
}

function allImages(item = {}) {
  const urls = [
    firstImage(item),
    ...(item.Images?.Variants || []).map((v) => v?.Large?.URL || ''),
  ].filter(Boolean);
  return [...new Set(urls)];
}

function priceOf(item = {}) {
  const amount = item.Offers?.Listings?.[0]?.Price?.DisplayAmount
    || item.Offers?.Listings?.[0]?.Price?.Amount;
  if (amount == null || amount === '') return '';
  if (typeof amount === 'string') return amount;
  const currency = item.Offers?.Listings?.[0]?.Price?.Currency || 'USD';
  return `${Number(amount).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`;
}

function brandOf(item = {}) {
  return textOf(item.ItemInfo?.ByLineInfo?.Brand)
    || textOf(item.ItemInfo?.ByLineInfo?.Manufacturer)
    || '';
}

function inferBrandFromTitle(title = '') {
  const t = String(title || '').trim();
  if (!t) return '';
  const byMatch = t.match(/\bby\s+([A-Za-z][A-Za-z0-9 &'./-]{1,35})(?:\s+for\b|,|\s+[-–]|$)/i);
  if (byMatch) return byMatch[1].trim();
  const lead = t.match(/^([A-Za-z][A-Za-z0-9 &'-]{1,25})\s+/);
  if (lead && !/^(the|new|best|top|amazon)$/i.test(lead[1])) return lead[1].trim();
  return '';
}

function barcodeOf(item = {}) {
  const ids = item.ItemInfo?.ExternalIds || {};
  for (const key of ['EANs', 'UPCs', 'ISBNs']) {
    const vals = ids[key]?.DisplayValues || ids[key]?.DisplayValue;
    const list = Array.isArray(vals) ? vals : vals ? [vals] : [];
    const hit = list.map((v) => String(v).replace(/\D/g, '')).find((d) => d.length >= 8 && d.length <= 14);
    if (hit) return hit;
  }
  return '';
}

function categoryOf(item = {}) {
  const nodes = item.BrowseNodeInfo?.BrowseNodes || [];
  const leaf = nodes.find((n) => !n.Children?.length) || nodes[0];
  return textOf(leaf?.DisplayName) || textOf(leaf?.ContextFreeName) || '';
}

function featuresText(item = {}, lang = 'en') {
  const feats = item.ItemInfo?.Features?.DisplayValues || [];
  if (!feats.length) return '';
  return feats.slice(0, 8).join(lang === 'ar' ? ' • ' : ' • ');
}

function variationLabel(item = {}) {
  const dims = item.VariationAttributes || item.VariationSummary?.VariationDimension || [];
  if (Array.isArray(item.VariationAttributes)) {
    return item.VariationAttributes
      .map((d) => `${textOf(d.Name) || d.Name}: ${textOf(d.Value) || d.Value}`)
      .filter((s) => !s.includes('undefined'))
      .join(' / ');
  }
  // fallback: color/size from product info
  const color = textOf(item.ItemInfo?.ProductInfo?.Color);
  const size = textOf(item.ItemInfo?.ProductInfo?.Size);
  return [color, size].filter(Boolean).join(' / ');
}

function colorHexGuess(label = '') {
  const map = {
    black: '#111111', white: '#f5f5f5', red: '#c62828', pink: '#e91e63', nude: '#d2a679',
    brown: '#6d4c41', beige: '#d7ccc8', coral: '#ff7043', rose: '#ec407a', plum: '#7b1fa2',
    berry: '#ad1457', wine: '#880e4f', cherry: '#b71c1c', peach: '#ffab91', gold: '#c9a227',
    silver: '#b0bec5', clear: '#eeeeee', transparent: '#eeeeee',
  };
  const key = String(label || '').toLowerCase();
  for (const [name, hex] of Object.entries(map)) {
    if (key.includes(name)) return hex;
  }
  return '';
}

/** دمج عنوان إنجليزي + عربي */
export function mergeAmazonLocales(enItem = null, arItem = null) {
  const primary = enItem || arItem;
  if (!primary?.ASIN) return null;

  const titleEn = textOf(enItem?.ItemInfo?.Title) || textOf(primary.ItemInfo?.Title);
  const titleAr = textOf(arItem?.ItemInfo?.Title);
  const split = (!titleAr || !titleEn) ? splitBilingualText(titleEn || titleAr, { mode: 'name' }) : null;

  const brand = brandOf(enItem || {}) || brandOf(arItem || {})
    || inferBrandFromTitle(titleEn || titleAr);
  const descEn = featuresText(enItem || {}, 'en');
  // لا تملأ الوصف العربي بالإنجليزي — أبقِه فارغاً إن لم يتوفر عربي
  const descAr = featuresText(arItem || {}, 'ar');

  return {
    id: String(primary.ASIN),
    parentAsin: String(primary.ParentASIN || primary.ASIN),
    sku: String(primary.ASIN),
    barcode: barcodeOf(primary),
    nameAr: titleAr || split?.ar || titleEn,
    nameEn: titleEn || split?.en || '',
    brandAr: brand,
    brandEn: brand,
    descriptionAr: descAr,
    descriptionEn: descEn,
    thumb: firstImage(enItem || primary) || firstImage(arItem || {}),
    images: allImages(enItem || primary),
    price: priceOf(enItem || primary) || priceOf(arItem || {}),
    category: categoryOf(enItem || primary) || categoryOf(arItem || {}),
    productUrl: primary.DetailPageURL || `https://www.amazon.com/dp/${primary.ASIN}`,
    productUrlAr: arItem?.DetailPageURL || '',
    inStock: true,
    shadeCount: 1,
    hasOptions: false,
  };
}

export function mapListProduct(enItem = null, arItem = null) {
  const merged = mergeAmazonLocales(enItem, arItem);
  if (!merged) return null;
  return {
    id: merged.id,
    nameAr: merged.nameAr,
    nameEn: merged.nameEn,
    brandAr: merged.brandAr,
    brandEn: merged.brandEn,
    thumb: merged.thumb,
    price: merged.price,
    shadeCount: merged.shadeCount,
    hasOptions: merged.hasOptions,
    category: merged.category,
    sku: merged.sku,
    barcode: merged.barcode,
    productUrl: merged.productUrl,
    inStock: merged.inStock,
  };
}

export function mapShadeFromVariation(item = {}, index = 0) {
  const label = variationLabel(item) || textOf(item.ItemInfo?.Title) || `خيار ${index + 1}`;
  const color = textOf(item.ItemInfo?.ProductInfo?.Color) || label;
  return {
    id: String(item.ASIN || index),
    nameAr: label,
    nameEn: label,
    sku: String(item.ASIN || ''),
    barcode: barcodeOf(item),
    image: firstImage(item),
    price: priceOf(item),
    inStock: true,
    colorHex: colorHexGuess(color),
    optionGroup: textOf(item.VariationAttributes?.[0]?.Name) || 'التدرج',
  };
}

export function mapDetailProduct(enItem = null, arItem = null, variations = []) {
  const base = mergeAmazonLocales(enItem, arItem);
  if (!base) return null;

  const shades = variations.length
    ? variations.map((v, i) => mapShadeFromVariation(v, i))
    : [{
      id: '0',
      nameAr: base.nameAr,
      nameEn: base.nameEn,
      sku: base.sku,
      barcode: base.barcode,
      image: base.thumb,
      price: base.price,
      inStock: true,
      colorHex: '',
      optionGroup: '',
    }];

  return {
    ...base,
    shades,
    shadeCount: shades.length,
    hasOptions: shades.length > 1,
    manufacturer: base.brandAr,
    manufacturerEn: base.brandEn,
  };
}

export function mapBrowseNode(node = {}, children = []) {
  const id = String(node.Id || node.id || '');
  const name = textOf(node.DisplayName) || textOf(node.ContextFreeName) || id;
  return {
    id,
    slug: id,
    name,
    nameEn: name,
    level: Number(node.Ancestor ? 3 : 2),
    isLeaf: children.length === 0,
    children,
    productCount: null,
    path: name,
  };
}
