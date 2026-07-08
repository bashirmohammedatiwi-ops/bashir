import crypto from 'crypto';
import { cacheGet, cacheSet } from '../../core/cache.js';

const DEFAULT_TTL = 15 * 60 * 1000;
const HOST = 'webservices.amazon.com';
const REGION = 'us-east-1';
const SERVICE = 'ProductAdvertisingAPI';

export const BEAUTY_ROOT_NODE = '3760911';

export function amazonCredentials() {
  const accessKey = String(process.env.AMAZON_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || '').trim();
  const secretKey = String(process.env.AMAZON_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || '').trim();
  const partnerTag = String(process.env.AMAZON_PARTNER_TAG || '').trim();
  const marketplace = String(process.env.AMAZON_MARKETPLACE || 'www.amazon.com').trim();
  const partnerTagAr = String(process.env.AMAZON_PARTNER_TAG_AR || partnerTag).trim();
  const marketplaceAr = String(process.env.AMAZON_MARKETPLACE_AR || 'www.amazon.ae').trim();
  return {
    accessKey,
    secretKey,
    partnerTag,
    marketplace,
    partnerTagAr,
    marketplaceAr,
    configured: Boolean(accessKey && secretKey && partnerTag),
  };
}

function hmac(key, data, encoding) {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest(encoding);
}

function hash(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

function amzDate(date = new Date()) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
}

/** توقيع AWS Signature V4 لطلبات PA-API 5 */
function signHeaders({ method, path, payload, accessKey, secretKey, target }) {
  const { amzDate, dateStamp } = amzDate();
  const payloadHash = hash(payload);
  const canonicalHeaders = [
    `content-encoding:amz-1.0`,
    `content-type:application/json; charset=utf-8`,
    `host:${HOST}`,
    `x-amz-date:${amzDate}`,
    `x-amz-target:${target}`,
  ].join('\n') + '\n';
  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';
  const canonicalRequest = [
    method,
    path,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hash(canonicalRequest),
  ].join('\n');

  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = hmac(kSigning, stringToSign, 'hex');

  return {
    'Content-Encoding': 'amz-1.0',
    'Content-Type': 'application/json; charset=utf-8',
    Host: HOST,
    'X-Amz-Date': amzDate,
    'X-Amz-Target': target,
    Authorization: [
      `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(', '),
  };
}

const OPERATION_PATH = {
  SearchItems: '/paapi5/searchitems',
  GetItems: '/paapi5/getitems',
  GetVariations: '/paapi5/getvariations',
  GetBrowseNodes: '/paapi5/getbrowsenodes',
};

const OPERATION_TARGET = {
  SearchItems: 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
  GetItems: 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
  GetVariations: 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetVariations',
  GetBrowseNodes: 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetBrowseNodes',
};

export async function paapiRequest(operation, body, { ttl = DEFAULT_TTL, cacheKey = '', marketplace } = {}) {
  const creds = amazonCredentials();
  if (!creds.configured) {
    throw new Error('مفاتيح Amazon غير مضبوطة — أضف AMAZON_ACCESS_KEY و AMAZON_SECRET_KEY و AMAZON_PARTNER_TAG');
  }

  const path = OPERATION_PATH[operation];
  const target = OPERATION_TARGET[operation];
  if (!path || !target) throw new Error(`عملية Amazon غير مدعومة: ${operation}`);

  const payloadObj = {
    PartnerTag: marketplace && marketplace !== creds.marketplace ? creds.partnerTagAr : creds.partnerTag,
    PartnerType: 'Associates',
    Marketplace: marketplace || creds.marketplace,
    Operation: operation,
    ...body,
  };
  const payload = JSON.stringify(payloadObj);

  const key = cacheKey || (ttl > 0
    ? `amazon:${operation}:${payloadObj.Marketplace}:${hash(payload).slice(0, 24)}`
    : '');
  if (key) {
    const cached = cacheGet(key, ttl);
    if (cached) return cached;
  }

  const headers = signHeaders({
    method: 'POST',
    path,
    payload,
    accessKey: creds.accessKey,
    secretKey: creds.secretKey,
    target,
  });

  const res = await fetch(`https://${HOST}${path}`, {
    method: 'POST',
    headers,
    body: payload,
    signal: AbortSignal.timeout(12_000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data?.Errors?.[0] || data?.errors?.[0];
    const msg = err?.Message || err?.message || data?.message || `Amazon PA-API ${res.status}`;
    throw new Error(msg);
  }

  if (key) cacheSet(key, data);
  return data;
}

export const ITEM_RESOURCES = [
  'Images.Primary.Large',
  'Images.Primary.Medium',
  'Images.Variants.Large',
  'ItemInfo.Title',
  'ItemInfo.ByLineInfo',
  'ItemInfo.Classifications',
  'ItemInfo.Features',
  'ItemInfo.ProductInfo',
  'ItemInfo.ExternalIds',
  'ItemInfo.ManufactureInfo',
  'ItemInfo.ContentInfo',
  'Offers.Listings.Price',
  'Offers.Listings.SavingBasis',
  'BrowseNodeInfo.BrowseNodes',
  'ParentASIN',
];

export const VARIATION_RESOURCES = [
  ...ITEM_RESOURCES,
  'VariationSummary.VariationDimension',
  'VariationSummary.Price',
];

export { DEFAULT_TTL, HOST };
