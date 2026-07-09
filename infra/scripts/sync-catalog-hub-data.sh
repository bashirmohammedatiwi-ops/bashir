#!/usr/bin/env bash
# دمج ملفات البيانات المدمجة في الصورة إلى volume الحي (يُستبدل /app/data بالكامل).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"
COMPOSE="docker compose -f docker-compose.prod.yml"
DATA_DIR="$REPO_ROOT/catalog-hub/data"

if ! $COMPOSE ps --status running catalog-hub 2>/dev/null | grep -q catalog-hub; then
  echo "==> catalog-hub not running — skip data sync"
  exit 0
fi

if [[ -f "$DATA_DIR/barcode-index.json" && -f "$ROOT/scripts/merge-barcode-index.cjs" ]]; then
  echo "==> Merging barcode-index.json into catalog-hub volume..."
  $COMPOSE cp "$DATA_DIR/barcode-index.json" catalog-hub:/tmp/seed-barcode-index.json
  $COMPOSE cp "$ROOT/scripts/merge-barcode-index.cjs" catalog-hub:/tmp/merge-barcode-index.cjs
  $COMPOSE exec -T catalog-hub node /tmp/merge-barcode-index.cjs /tmp/seed-barcode-index.json /app/data/barcode-index.json || true
fi

echo "==> catalog-hub data sync complete"
