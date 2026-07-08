#!/usr/bin/env bash
# Merge repo seed data into the catalog-hub Docker volume (/app/data).
# The named volume shadows image COPY data — rebuild alone never updates lookups.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$INFRA_DIR/.." && pwd)"

SERVICE="catalog-hub"
SEED_LOOKUP="$REPO_ROOT/catalog-hub/data/barcode-lookup.json"
SEED_CACHE="$REPO_ROOT/catalog-hub/data/barcode-cache.json"
MERGE_LOOKUP="$SCRIPT_DIR/merge-barcode-lookup.cjs"
MERGE_CACHE="$SCRIPT_DIR/merge-barcode-cache.cjs"

cd "$INFRA_DIR"

if [[ -f docker-compose.prod.yml ]]; then
  COMPOSE="docker compose -f docker-compose.prod.yml"
else
  COMPOSE="docker compose"
fi

if ! $COMPOSE ps --status running "$SERVICE" 2>/dev/null | grep -q "$SERVICE"; then
  echo "WARN: $SERVICE is not running — skipping data volume sync"
  exit 0
fi

merged=0

if [[ -f "$SEED_LOOKUP" && -f "$MERGE_LOOKUP" ]]; then
  echo "==> Merging seed barcode-lookup.json into catalog-hub volume..."
  $COMPOSE cp "$SEED_LOOKUP" "$SERVICE:/tmp/seed-barcode-lookup.json"
  $COMPOSE cp "$MERGE_LOOKUP" "$SERVICE:/tmp/merge-barcode-lookup.cjs"
  $COMPOSE exec -T "$SERVICE" node /tmp/merge-barcode-lookup.cjs \
    /tmp/seed-barcode-lookup.json /app/data/barcode-lookup.json
  merged=1
fi

if [[ -f "$SEED_CACHE" && -f "$MERGE_CACHE" ]]; then
  echo "==> Merging seed barcode-cache.json into catalog-hub volume..."
  $COMPOSE cp "$SEED_CACHE" "$SERVICE:/tmp/seed-barcode-cache.json"
  $COMPOSE cp "$MERGE_CACHE" "$SERVICE:/tmp/merge-barcode-cache.cjs"
  $COMPOSE exec -T "$SERVICE" node /tmp/merge-barcode-cache.cjs \
    /tmp/seed-barcode-cache.json /app/data/barcode-cache.json
  merged=1
fi

if [[ "$merged" -eq 1 ]]; then
  echo "==> Restarting catalog-hub to reload merged data..."
  $COMPOSE restart "$SERVICE"
  for _ in $(seq 1 30); do
    if $COMPOSE exec -T "$SERVICE" wget -qO- http://127.0.0.1:10000/api/health 2>/dev/null | grep -q '"ok":true'; then
      break
    fi
    sleep 2
  done
fi

echo "==> Verifying sample barcodes inside catalog-hub..."
BASE="http://127.0.0.1:10000/api/import/search"
ALL_OK=1
for bc in 6287020281204 3348901571449; do
  body="$($COMPOSE exec -T "$SERVICE" wget -qO- "$BASE?q=$bc&refresh=1" 2>/dev/null || true)"
  if echo "$body" | grep -q '"options":\[' && echo "$body" | grep -qv '"options":\[\]'; then
    echo "    OK   $bc"
  else
    echo "    WARN $bc -> no import options (check miswag / meta)"
    ALL_OK=0
  fi
done

if [[ "$ALL_OK" -ne 1 ]]; then
  echo "    Some barcodes still empty — inspect: $COMPOSE exec $SERVICE cat /app/data/barcode-lookup.json | grep 6287020281204"
fi
