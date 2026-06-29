#!/usr/bin/env node
/**
 * Nice One product backup
 * API discovered: https://api.niceonesa.com?route=rest/product_admin/products
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  fetchCategoryPage,
  fetchProductDetail,
  fetchHomeCategories,
  flattenCategories,
  downloadImage,
} from './lib/api.js';
import { enrichShades, extractBarcode } from './lib/api.js';
import { enrichShadesDeep } from './lib/barcodes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'data');
const IMG_DIR = path.join(OUT_DIR, 'images');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadConfig() {
  const configPath = path.join(__dirname, 'config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function extFromUrl(url) {
  try {
    const u = new URL(url);
    const base = path.basename(u.pathname);
    const ext = path.extname(base.split('?')[0]);
    return ext || '.jpg';
  } catch {
    return '.jpg';
  }
}

async function fetchAllCategoryProducts(slug, pageSize, delayMs) {
  const all = [];
  let page = 1;
  let meta = null;

  while (true) {
    const data = await fetchCategoryPage(slug, page, pageSize);
    const products = data?.products || [];
    if (!products.length) break;
    if (!meta) {
      meta = {
        category: data.category,
        categoryInfo: data.data,
        category_hierarchy: data.category_hierarchy,
      };
    }
    all.push(...products);
    process.stdout.write(`\r  ${slug}: page ${page} → ${all.length} products`);
    if (products.length < pageSize) break;
    page += 1;
    await sleep(delayMs);
  }
  process.stdout.write('\n');
  return { meta, products: all };
}

async function enrichProduct(product, opts) {
  if (!opts.fetchFullDetails) return product;
  await sleep(opts.delayMs);
  try {
    const detail = await fetchProductDetail(product.id);
    const shades = detail.has_option
      ? opts.deepBarcodes
        ? await enrichShadesDeep(detail)
        : enrichShades(detail)
      : [];
    return {
      ...product,
      ...detail,
      barcode: extractBarcode(detail) || product.barcode,
      shades,
      shadeBarcodes: shades.map((s) => ({
        name: s.name,
        sku: s.sku,
        ean: s.ean || null,
        barcode: s.barcode,
        source: s.barcodeSource,
      })),
      _listThumb: product.thumb,
    };
  } catch (err) {
    console.warn(`  ⚠ detail failed for ${product.id}: ${err.message}`);
    return product;
  }
}

async function saveProductImages(product, opts) {
  if (!opts.downloadImages) return product;
  const urls = [];
  if (product.images?.length) urls.push(...product.images);
  else if (product.thumb) urls.push(product.thumb);
  else if (product._listThumb) urls.push(product._listThumb);

  const localImages = [];
  const seen = new Set();
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const fname = `${product.id}_${i}${extFromUrl(url)}`;
    const dest = path.join(IMG_DIR, fname);
    if (!fs.existsSync(dest)) {
      try {
        await downloadImage(url, dest);
        await sleep(100);
      } catch (err) {
        console.warn(`  ⚠ image ${product.id}: ${err.message}`);
        localImages.push({ url, local: null, error: err.message });
        continue;
      }
    }
    localImages.push({ url, local: `images/${fname}` });
  }
  return { ...product, localImages };
}

async function main() {
  const args = process.argv.slice(2);
  const allCategories = args.includes('--all-categories');
  const listOnly = args.includes('--list-categories');

  const config = loadConfig();
  const opts = {
    downloadImages: config.downloadImages !== false,
    fetchFullDetails: config.fetchFullDetails !== false,
    delayMs: config.delayMs ?? 300,
    pageSize: config.pageSize ?? 30,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (opts.downloadImages) fs.mkdirSync(IMG_DIR, { recursive: true });

  console.log('Fetching category tree from homepage...');
  const tree = await fetchHomeCategories(config.locale || 'en');
  const leaves = flattenCategories(tree);
  fs.writeFileSync(
    path.join(OUT_DIR, 'categories.json'),
    JSON.stringify({ fetchedAt: new Date().toISOString(), total: leaves.length, categories: leaves }, null, 2)
  );
  console.log(`Found ${leaves.length} leaf categories`);

  if (listOnly) {
    for (const c of leaves) console.log(`${c.slug}\t${c.path}`);
    return;
  }

  let slugs = config.categories || [];
  if (allCategories) {
    slugs = leaves.map((c) => c.slug);
    console.log(`Backing up ALL ${slugs.length} categories (this may take hours)...`);
  }

  if (!slugs.length) {
    console.error('No categories in config.json. Add slugs or use --all-categories');
    process.exit(1);
  }

  const slugMeta = Object.fromEntries(leaves.map((c) => [c.slug, c]));
  const backup = {
    fetchedAt: new Date().toISOString(),
    source: 'https://api.niceonesa.com',
    locale: config.locale || 'en',
    categories: [],
  };

  const seenIds = new Set();

  for (const slug of slugs) {
    console.log(`\nCategory: ${slug} (${slugMeta[slug]?.path || '?'})`);
    let meta, products;
    try {
      ({ meta, products } = await fetchAllCategoryProducts(slug, opts.pageSize, opts.delayMs));
    } catch (err) {
      console.error(`  ✗ ${err.message}`);
      continue;
    }

    const enriched = [];
    for (const p of products) {
      if (seenIds.has(p.id)) continue;
      seenIds.add(p.id);
      let full = await enrichProduct(p, opts);
      full = await saveProductImages(full, opts);
      enriched.push(full);
      process.stdout.write(`\r  Enriched ${enriched.length}/${products.length} (unique total: ${seenIds.size})`);
    }
    process.stdout.write('\n');

    backup.categories.push({
      slug,
      meta: slugMeta[slug] || null,
      categoryMeta: meta,
      productCount: enriched.length,
      products: enriched,
    });
  }

  const allProducts = backup.categories.flatMap((c) =>
    c.products.map((p) => ({
      ...p,
      categorySlug: c.slug,
      categoryPath: c.meta?.path,
    }))
  );

  fs.writeFileSync(path.join(OUT_DIR, 'backup.json'), JSON.stringify(backup, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'products.json'), JSON.stringify(allProducts, null, 2));

  const csvHeader = 'id,name,sku,barcode,price,manufacturer,category,image_url,seo_url_en\n';
  const csvRows = allProducts.map((p) => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const img = p.localImages?.[0]?.local || p.images?.[0] || p.thumb || '';
    return [
      p.id,
      esc(p.name || p.en_name),
      esc(p.sku),
      esc(p.isbn),
      p.price,
      esc(p.manufacturer),
      esc(p.categoryPath || p.categorySlug),
      esc(img.startsWith('http') ? img : img),
      esc(p.seo_url_en),
    ].join(',');
  });
  fs.writeFileSync(path.join(OUT_DIR, 'products.csv'), csvHeader + csvRows.join('\n'));

  console.log(`\n✓ Done: ${allProducts.length} unique products`);
  console.log(`  ${path.join(OUT_DIR, 'backup.json')}`);
  console.log(`  ${path.join(OUT_DIR, 'products.csv')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
