#!/usr/bin/env bash
# تنظيف بيانات الأرشيف القديم لمسواگ من volume الحي.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="docker compose -f docker-compose.prod.yml"

if ! $COMPOSE ps --status running catalog-hub 2>/dev/null | grep -q catalog-hub; then
  echo "==> catalog-hub not running — skip data cleanup"
  exit 0
fi

echo "==> Removing legacy Miswag archive files from catalog-hub volume..."
$COMPOSE exec -T catalog-hub sh -c '
  rm -f /app/data/miswag-catalog-index.json
  rm -f /app/data/barcode-index.json
  rm -f /app/data/barcode-meta-cache.json
  echo "    removed miswag-catalog-index.json, barcode-index.json, barcode-meta-cache.json"
' || true

echo "==> catalog-hub data cleanup complete"
