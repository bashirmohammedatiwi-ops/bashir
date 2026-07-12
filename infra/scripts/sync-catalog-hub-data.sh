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
  echo "    removed miswag-catalog-index.json (barcode index preserved)"
' || true

echo "==> Sync catalog seed indexes into live volume..."
$COMPOSE exec -T catalog-hub sh -c '
  if [ ! -d /app/data-seed ]; then
    echo "    no /app/data-seed — skip"
    exit 0
  fi
  for f in /app/data-seed/*.json; do
    [ -f "$f" ] || continue
    base=$(basename "$f")
    case "$base" in
      barcode-meta-cache.json) continue ;;
    esac
    cp "$f" "/app/data/$base"
    echo "    synced $base"
  done
' || true

echo "==> catalog-hub data cleanup complete"
