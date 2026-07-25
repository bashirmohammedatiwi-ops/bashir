#!/usr/bin/env node
/**
 * Long-running care import: re-runs import until no new products added.
 * Token auto-refreshes on expiry. Re-scans pending after each pass.
 */
import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PENDING_FILE = path.join(ROOT, 'data/care-pos-pending.json');
const SLEEP_MS = Number(process.env.LOOP_SLEEP_MS || 30_000);
const MAX_PASSES = Number(process.env.MAX_PASSES || 0); // 0 = unlimited

function run(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: ROOT,
      env: { ...process.env, ...env },
      stdio: 'inherit',
    });
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
  });
}

function pendingCount() {
  if (!existsSync(PENDING_FILE)) return -1;
  try {
    return JSON.parse(readFileSync(PENDING_FILE, 'utf8')).count || 0;
  } catch {
    return -1;
  }
}

async function main() {
  let pass = 0;
  let totalOk = 0;
  console.log('=== Care import loop started ===\n');

  while (!MAX_PASSES || pass < MAX_PASSES) {
    pass += 1;
    console.log(`\n── Pass ${pass} ── ${new Date().toISOString()}`);

    try {
      await run('node', ['scripts/import-niceone-care-pos.mjs']);
    } catch (err) {
      console.log(`Import pass error: ${err.message} — retrying after scan`);
    }

    try {
      await run('node', ['scripts/scan-care-pos-pending.mjs'], {
        LEAF_CONCURRENCY: '2',
        DETAIL_CONCURRENCY: '5',
      });
    } catch (err) {
      console.log(`Scan error: ${err.message}`);
    }

    const pending = pendingCount();
    console.log(`\nPending without overrides: ${pending}`);

    if (pending === 0) {
      console.log('\n✓ All POS care products imported or have overrides pending none.');
      break;
    }

    console.log(`Sleeping ${SLEEP_MS / 1000}s before next pass…`);
    await new Promise((r) => setTimeout(r, SLEEP_MS));
  }

  console.log(`\n=== Loop finished: ${pass} passes ===`);
}

main().catch((e) => { console.error(e); process.exit(1); });
