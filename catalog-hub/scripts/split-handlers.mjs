#!/usr/bin/env node
/**
 * One-time helper: extracts handler functions from legacy server.js into lib/server/handlers/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

const HANDLERS = [
  { name: 'handleApi', out: 'niceone.js', exportName: 'handleNiceoneApi' },
  { name: 'handleMiswagApi', out: 'miswag.js' },
  { name: 'handleElryanApi', out: 'elryan.js' },
  { name: 'handleMiraayaApi', out: 'miraaya.js' },
  { name: 'handleFacesApi', out: 'faces.js' },
  { name: 'handleAmazonApi', out: 'amazon.js' },
];

function extractFunction(source, fnName) {
  const start = source.indexOf(`async function ${fnName}(`);
  if (start < 0) throw new Error(`Function not found: ${fnName}`);
  let depth = 0;
  let started = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') { depth++; started = true; }
    else if (ch === '}') {
      depth--;
      if (started && depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }
  throw new Error(`Unclosed function: ${fnName}`);
}

const outDir = path.join(root, 'lib', 'server', 'handlers', '_legacy');
fs.mkdirSync(outDir, { recursive: true });

for (const h of HANDLERS) {
  const body = extractFunction(src, h.name);
  const exportName = h.exportName || h.name;
  const content = `// AUTO-EXTRACTED — refactor imports before use\nexport ${body.replace(`async function ${h.name}`, `async function ${exportName}`)};\n`;
  fs.writeFileSync(path.join(outDir, h.out), content);
  console.log('Wrote', h.out, body.length, 'chars');
}

// Extract helper functions used by handlers
const helpers = [
  'getCategoryTree', 'getElryanCategoryTree', 'scheduleElryanCountEnrich',
  'getMiraayaCategoryTree', 'getFacesCategoryTree', 'scheduleFacesCountEnrich',
  'loadFacesCategoryDiskCache', 'saveFacesCategoryDiskCache', 'getMiswagCategoryTree',
  'getAmazonCategoryTree',
];
let helpersSrc = '';
for (const fn of helpers) {
  try {
    helpersSrc += extractFunction(src, fn) + '\n\n';
  } catch { /* optional */ }
}
fs.writeFileSync(path.join(outDir, 'helpers.js'), helpersSrc);
console.log('Done');
