#!/usr/bin/env node
/**
 * Extracts store handlers from server.js into lib/server/handlers/*.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const outDir = path.join(root, 'lib', 'server', 'handlers');

function extractFunction(source, fnName) {
  const start = source.indexOf(`async function ${fnName}(`);
  if (start < 0) {
    const fnStart = source.indexOf(`function ${fnName}(`);
    if (fnStart < 0) throw new Error(`Function not found: ${fnName}`);
    return extractBlock(source, fnStart, `function ${fnName}`);
  }
  return extractBlock(source, start, `async function ${fnName}`);
}

function extractBlock(source, start, prefix) {
  let depth = 0;
  let started = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') { depth++; started = true; }
    else if (ch === '}') {
      depth--;
      if (started && depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`Unclosed: ${prefix}`);
}

const HANDLERS = [
  {
    file: 'niceone.js',
    exportName: 'handleNiceoneApi',
    fnName: 'handleApi',
    helpers: ['getCategoryTree'],
    header: `import {
  fetchHomeCategories,
  buildBilingualCategoryTree,
  fetchCategoryProducts,
  fetchProductDetail,
  searchProducts,
  normalizeProductSummary,
  normalizeProductDetail,
  extractBarcode,
  fetchManufacturersCatalog,
  fetchManufacturerProducts,
  mapClientSort,
  sortProductsClient,
} from '../../api.js';
import {
  enrichShadesDeep,
  enrichShadesFromDatabase,
  enrichShadesLookup,
  saveProductToIndex,
  resolveProductBarcodesBatch,
  shadeStats,
  getBarcodeCacheStats,
} from '../../barcodes.js';
import { CACHE_MS, sendJson, parseQuery, readBody } from '../http.js';

let categoryCache = { tree: null, leaves: null, fetchedAt: 0 };
let niceoneBrandsCache = { brands: null, fetchedAt: 0 };
`,
  },
  {
    file: 'miswag.js',
    exportName: 'handleMiswagApi',
    fnName: 'handleMiswagApi',
    helpers: ['getMiswagCategoryTree'],
    header: `import {
  fetchCategoryTree as fetchMiswagCategoryTree,
  fetchCategoryProducts as fetchMiswagCategoryProducts,
  searchProducts as searchMiswagProducts,
  fetchProductDetail as fetchMiswagProductDetail,
  normalizeProductSummary as normalizeMiswagProductSummary,
  normalizeProductDetail as normalizeMiswagProductDetail,
  sortProductsClient as sortMiswagProductsClient,
  fetchBrands as fetchMiswagBrands,
} from '../../miswag-api.js';
import { createCategoryCache } from '../cache.js';
import { CACHE_MS, sendJson, parseQuery } from '../http.js';

let miswagCategoryCache = { tree: null, leaves: null, fetchedAt: 0 };
`,
  },
  {
    file: 'elryan.js',
    exportName: 'handleElryanApi',
    fnName: 'handleElryanApi',
    helpers: ['getElryanCategoryTree', 'scheduleElryanCountEnrich'],
    header: `import {
  buildBilingualCategoryTree as buildElryanCategoryTree,
  fetchBeautyCategoriesBilingual,
  enrichProductList,
  fetchProductByIdBilingual,
  sortProductsClientBilingual,
  elryanAr,
} from '../../elryan-api.js';
import { collectDescendantIds, findCategoryNode, applyProductCounts } from '../../category-scope.js';
import { CACHE_MS, sendJson, parseQuery } from '../http.js';

let elryanCategoryCache = { tree: null, leaves: null, all: null, ids: null, fetchedAt: 0 };
let elryanBrandsCache = { brands: null, fetchedAt: 0 };
`,
  },
  {
    file: 'miraaya.js',
    exportName: 'handleMiraayaApi',
    fnName: 'handleMiraayaApi',
    helpers: ['getMiraayaCategoryTree'],
    header: `import {
  fetchCategoryTreeRaw as fetchMiraayaCategoriesRaw,
  buildCategoryTree as buildMiraayaCategoryTree,
  fetchCategoryProducts as fetchMiraayaCategoryProducts,
  searchProducts as searchMiraayaProducts,
  fetchProductById as fetchMiraayaProductById,
  fetchProductBySku as fetchMiraayaProductBySku,
  normalizeProductSummary as normalizeMiraayaProductSummary,
  normalizeProductDetail as normalizeMiraayaProductDetail,
  sortProductsClient as sortMiraayaProductsClient,
  fetchBrandsCatalog as fetchMiraayaBrands,
  fetchBrandProducts as fetchMiraayaBrandProducts,
} from '../../miraaya-api.js';
import { CACHE_MS, sendJson, parseQuery } from '../http.js';

let miraayaCategoryCache = { tree: null, leaves: null, all: null, fetchedAt: 0 };
let miraayaBrandsCache = { brands: null, fetchedAt: 0 };
`,
  },
  {
    file: 'faces.js',
    exportName: 'handleFacesApi',
    fnName: 'handleFacesApi',
    helpers: ['loadFacesCategoryDiskCache', 'saveFacesCategoryDiskCache', 'getFacesCategoryTree', 'scheduleFacesCountEnrich'],
    header: `import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  fetchCategoryTreeRaw as fetchFacesCategoriesRaw,
  fetchCategoryProducts as fetchFacesCategoryProducts,
  searchProductsIncludingBarcode as searchFacesProductsIncludingBarcode,
  fetchProductById as fetchFacesProductById,
  normalizeProductSummary as normalizeFacesProductSummary,
  normalizeProductDetailFromRaw as normalizeFacesProductDetail,
  sortProductsClient as sortFacesProductsClient,
  fetchBrandsCatalog as fetchFacesBrands,
  fetchBrandProducts as fetchFacesBrandProducts,
  fetchCategoryProductCounts as fetchFacesCategoryCounts,
} from '../../faces-api.js';
import { applyProductCounts } from '../../category-scope.js';
import { CACHE_MS, sendJson, parseQuery } from '../http.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FACES_CAT_CACHE_FILE = path.join(__dirname, '..', '..', '..', 'data', 'faces-category-cache.json');

let facesCategoryCache = { tree: null, leaves: null, all: null, fetchedAt: 0 };
let facesCategoryInflight = null;
let facesBrandsCache = { brands: null, fetchedAt: 0 };
`,
  },
  {
    file: 'amazon.js',
    exportName: 'handleAmazonApi',
    fnName: 'handleAmazonApi',
    helpers: ['getAmazonCategoryTree'],
    header: `import {
  buildCategoryTree as buildAmazonCategoryTree,
  fetchCategoryProducts as fetchAmazonCategoryProducts,
  searchProducts as searchAmazonProducts,
  fetchProductByAsin as fetchAmazonProductByAsin,
  normalizeProductSummary as normalizeAmazonProductSummary,
  sortProductsClient as sortAmazonProductsClient,
} from '../../amazon-api.js';
import { sendJson, parseQuery } from '../http.js';
`,
  },
];

for (const h of HANDLERS) {
  let body = '';
  for (const helper of h.helpers || []) {
    body += extractFunction(src, helper) + '\n\n';
  }
  const handler = extractFunction(src, h.fnName).replace(
    `async function ${h.fnName}`,
    `export async function ${h.exportName}`,
  );
  if (h.fnName === 'handleApi') {
    // rename internal references not needed
  }
  const content = `${h.header}\n${body}${handler}\n`;
  fs.writeFileSync(path.join(outDir, h.file), content);
  console.log('Wrote', h.file);
}

console.log('Done');
