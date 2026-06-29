/**
 * Merge a seed barcode-lookup.json into the live one inside the catalog-hub
 * data volume — WITHOUT losing entries the app learned at runtime.
 *
 * Runtime-learned entries (added via upsertBarcodeLookup) are preserved;
 * entries present in the seed override matching keys so manual/verified
 * fixes from the repo always win.
 *
 * Usage (inside the container):
 *   node merge-barcode-lookup.cjs <seedFile> <liveFile>
 */
const fs = require('fs');

const seedFile = process.argv[2] || '/tmp/seed-barcode-lookup.json';
const liveFile = process.argv[3] || '/app/data/barcode-lookup.json';

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

const seed = readJson(seedFile);
const live = readJson(liveFile);

const seedKeys = Object.keys(seed).length;
const liveKeys = Object.keys(live).length;

// live first (keep learned), seed last (repo fixes win on conflict)
const merged = { ...live, ...seed };

fs.mkdirSync(require('path').dirname(liveFile), { recursive: true });
fs.writeFileSync(liveFile, JSON.stringify(merged, null, 2));

console.log(
  `merged barcode-lookup.json: live=${liveKeys} + seed=${seedKeys} -> ${Object.keys(merged).length}`,
);
