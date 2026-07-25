#!/usr/bin/env node
/** Research barcodes: POS lookup, index hits, catalog status. */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { api, getToken } from '../lib/core/api-auth.js';
import { findBarcodeIndexEntry } from '../lib/core/barcode-index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BARCODES_FILE = path.join(__dirname, '../data/care-batch-large-barcodes.txt');

function loadExtraIndex(name) {
  try {
    const raw = JSON.parse(readFileSync(path.join(__dirname, `../data/${name}`), 'utf8'));
    return raw.entries || raw;
  } catch {
    return {};
  }
}

const orisdi = loadExtraIndex('orisdi-barcode-index.json');
const waheteter = loadExtraIndex('waheteter-barcode-index.json');

const barcodes = [...new Set(
  readFileSync(BARCODES_FILE, 'utf8').trim().split(/\s+/).filter(Boolean),
)];

function guessBrand(bc) {
  if (bc.startsWith('868092')) return 'Dr.Clinic';
  if (bc.startsWith('69423') || bc.startsWith('69413') || bc.startsWith('69302') || bc.startsWith('69294') || bc.startsWith('69325') || bc.startsWith('69766')) return 'Chinese skincare';
  if (bc.startsWith('357466')) return "L'Oreal";
  if (bc.startsWith('77043') || bc.startsWith('70501')) return 'Neutrogena';
  if (bc.startsWith('40058') || bc.startsWith('40059') || bc.startsWith('42355') || bc.startsWith('42164')) return 'Nivea';
  if (bc.startsWith('36005') || bc.startsWith('36103')) return 'Garnier';
  if (bc.startsWith('72140')) return 'Aveeno';
  if (bc.startsWith('59060') || bc.startsWith('59028') || bc.startsWith('59016')) return 'Eveline';
  if (bc.startsWith('84365') || bc.startsWith('84355')) return 'Babaria/Spanish';
  if (bc.startsWith('88094') || bc.startsWith('88096') || bc.startsWith('88002') || bc.startsWith('88063') || bc.startsWith('88093') || bc.startsWith('88025')) return 'Korean skincare';
  if (bc.startsWith('69717')) return 'Focallure/Chinese makeup-care';
  if (bc.startsWith('931483')) return 'Aesop/Australian?';
  if (bc.startsWith('50114') || bc.startsWith('50122')) return 'Simple/UK';
  if (bc.startsWith('87109') || bc.startsWith('87201') || bc.startsWith('87104')) return 'Dove/Unilever';
  if (bc.startsWith('33509')) return 'Palmer\'s';
  if (bc.startsWith('76991')) return 'Cantu';
  if (bc.startsWith('88596') || bc.startsWith('88593')) return 'Thayers/Milani?';
  if (bc.startsWith('50210')) return 'The Body Shop';
  if (bc.startsWith('52810')) return 'Missha';
  if (bc.startsWith('41030')) return 'Essence';
  if (bc.startsWith('80131')) return 'Collistar?';
  if (bc.startsWith('60010') || bc.startsWith('60018') || bc.startsWith('60019')) return 'Dove soap';
  if (bc.startsWith('88864')) return 'Korean';
  if (bc.startsWith('69211')) return 'Chinese masks';
  if (bc.startsWith('48970')) return 'European';
  if (bc.startsWith('62970') || bc.startsWith('62940')) return 'Middle East brand';
  if (bc.startsWith('89999') || bc.startsWith('89949') || bc.startsWith('89997') || bc.startsWith('90058')) return 'Indonesian/Wardah?';
  if (bc.startsWith('89010') || bc.startsWith('89011')) return 'Himalaya/Garnier ID';
  if (bc.startsWith('88500') || bc.startsWith('88519')) return 'Thai/Korean';
  if (bc.startsWith('37600') || bc.startsWith('30316')) return 'Bioderma/Avène?';
  if (bc.startsWith('80009') || bc.startsWith('59970') || bc.startsWith('80179')) return 'European pharmacy';
  return 'unknown';
}

async function lookupPosChunks(list, size = 50) {
  const out = {};
  for (let i = 0; i < list.length; i += size) {
    const chunk = list.slice(i, i + size);
    const res = await api('/sync/inventory/lookup-barcodes', { method: 'POST', body: { barcodes: chunk } });
    Object.assign(out, res.items || {});
  }
  return out;
}

async function main() {
  console.log(`Unique barcodes: ${barcodes.length}`);
  await getToken();
  const posMap = await lookupPosChunks(barcodes);

  const rows = [];
  for (const bc of barcodes) {
    const pos = posMap[bc];
    const idx = findBarcodeIndexEntry(bc);
    const or = orisdi[bc];
    const wa = waheteter[bc];
    const inApp = pos?.inApp;
    rows.push({
      barcode: bc,
      stock: pos?.pos?.stock ?? null,
      posName: pos?.pos?.name || null,
      inApp: inApp?.id || null,
      guessBrand: guessBrand(bc),
      indexTitle: idx?.titleEn || idx?.title || null,
      orisdi: or?.handle || or?.title || null,
      waheteter: wa?.slug || null,
    });
  }

  const withStock = rows.filter((r) => (r.stock ?? 0) >= 1);
  const inCatalog = rows.filter((r) => r.inApp);
  const noPos = rows.filter((r) => r.stock === null || r.stock === undefined);
  const zeroStock = rows.filter((r) => r.stock === 0);

  console.log(`POS stock>=1: ${withStock.length}`);
  console.log(`Already in app: ${inCatalog.length}`);
  console.log(`No POS hit: ${noPos.length}`);
  console.log(`Zero stock: ${zeroStock.length}`);

  const out = path.join(__dirname, '../data/care-batch-large-research.json');
  writeFileSync(out, JSON.stringify({ summary: { total: barcodes.length, withStock: withStock.length, inCatalog: inCatalog.length }, rows }, null, 2));
  console.log(`Wrote ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
