/**
 * Merge seed barcode-cache.json into the live catalog-hub data volume.
 * Repo seed wins on key conflicts (product_meta, web_search, etc.).
 */
const fs = require('fs');

const seedFile = process.argv[2] || '/tmp/seed-barcode-cache.json';
const liveFile = process.argv[3] || '/app/data/barcode-cache.json';

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

const seed = readJson(seedFile);
const live = readJson(liveFile);
const merged = { ...live, ...seed };

fs.mkdirSync(require('path').dirname(liveFile), { recursive: true });
fs.writeFileSync(liveFile, JSON.stringify(merged, null, 2));

console.log(
  `merged barcode-cache.json: live=${Object.keys(live).length} + seed=${Object.keys(seed).length} -> ${Object.keys(merged).length}`,
);
